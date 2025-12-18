import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, XCircle, Crosshair } from 'lucide-react';
import { auth } from './config/firebase'; // Config
import { signInAnonymously } from 'firebase/auth';

// --- Hooks ---
import { useMatchmaking } from './hooks/useMatchmaking';
import { useGameActions } from './hooks/useGameActions';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameSync } from './hooks/useGameSync';
import { useGameControls } from './hooks/useGameControls'; // ★追加

// --- Components ---
import MenuScreen from './components/screens/MenuScreen';
import LobbyScreen from './components/screens/LobbyScreen';
import GameScreen from './components/screens/GameScreen';
import ResultScreen from './components/screens/ResultScreen';
import CardDetailModal from './components/game/CardDetailModal';
import DeckBuilder from './components/screens/DeckBuilder';
import Card from './components/game/Card';
import AimingOverlay from './components/game/AimingOverlay';

import { DECK_SIZE, MAX_COPIES_IN_DECK } from './data/rules';
import { getCard, generateId } from './utils/helpers';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="text-white p-4">エラーが発生しました。リロードしてください。</div>;
    return this.props.children; 
  }
}

export default function App() {
  // 1. Basic State
  const [userId, setUserId] = useState(null); 
  const [view, setView] = useState('menu'); 
  const [myDeckIds, setMyDeckIds] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  // UI State
  const [detailCard, setDetailCard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aimingState, setAimingState] = useState(null); 
  const [targetingHandCard, setTargetingHandCard] = useState(null);
  const isRightClickHeld = useRef(false);
  const isDeckInitialized = useRef(false);

  // Derived State
  const myRole = isHost ? 'host' : 'guest';
  const enemyRole = isHost ? 'guest' : 'host';

  // 2. Custom Hooks Initialization
  const { 
      gameData, setGameData, isConnectionUnstable, notification, attackingState, setAttackingState 
  } = useGameSync(roomId, userId, myRole);

  const isMyTurn = gameData && gameData.currentTurn === myRole;
  const isPhaseLocked = gameData && ['start_effect', 'end_effect', 'switching'].includes(gameData.turnPhase);

  // Game Logic Hooks
  useGameLoop(gameData, roomId, myRole, enemyRole, isMyTurn);

  useEffect(() => {
      if (!gameData) return;

      // 決着がついたらリザルト画面へ！ (降参もここで検知される)
      if (gameData.status === 'finished' && view !== 'result') {
          setView('result');
      }
      
      // ゲームが始まったらゲーム画面へ！
      if (gameData.status === 'playing' && view !== 'game') {
          setView('game');
      }

      // 待機中ならロビーへ！
      if (gameData.status === 'waiting' && view !== 'lobby') {
          setView('lobby');
      }
  }, [gameData, view]);

  const gameActions = useGameActions({
      gameData, myRole, enemyRole, isMyTurn, roomId, isPhaseLocked, 
      targetingHandCard, setTargetingHandCard, setAttackingState, isHost
  });

  const { isDeckValidStrict, startRandomMatch, createRoom, joinRoom } = useMatchmaking(
      userId, myDeckIds, setRoomId, setIsHost, setView
  );

  // ★追加: UI Control Hook (マウス操作などを一任)
  const controls = useGameControls({
      gameData, myRole, view, isPhaseLocked,
      targetingHandCard, setTargetingHandCard,
      aimingState, setAimingState,
      detailCard, setDetailCard,
      isDragging, setIsDragging,
      isRightClickHeld,
      attack: gameActions.attack,
      initiatePlayCard: gameActions.initiatePlayCard
  });

  // 3. Initial Setup
  React.useEffect(() => {
    let sId = sessionStorage.getItem('duel_session_id');
    if (!sId) { sId = generateId(); sessionStorage.setItem('duel_session_id', sId); }
    setUserId(sId);
    const savedRoomId = sessionStorage.getItem('duel_room_id');
    if (savedRoomId) { setRoomId(savedRoomId); }
    const initAuth = async () => { if (auth) await signInAnonymously(auth); };
    initAuth();
    const loadDeck = () => { 
        const savedDeck = localStorage.getItem('my_duel_deck'); 
        if (savedDeck) { try { setMyDeckIds(JSON.parse(savedDeck)); } catch (e) {} } 
        isDeckInitialized.current = true; 
    };
    if (!isDeckInitialized.current) loadDeck();
  }, []);

  const handleBackToTitle = () => {
      setRoomId(""); setIsHost(false); setGameData(null); sessionStorage.removeItem('duel_room_id'); setView('menu');
  };

  // 4. Render
  return (
      <ErrorBoundary>
          {view !== 'game' && <CardDetailModal detailCard={detailCard} onClose={() => setDetailCard(null)} />}
          
          {view === 'game' && detailCard && (
              <div className="fixed top-4 left-4 z-[9999] pointer-events-none animate-in fade-in zoom-in duration-200 shadow-2xl rounded-xl overflow-hidden ring-4 ring-yellow-500/50">
                  <div className="bg-slate-900/90 backdrop-blur-sm p-4 rounded-xl">
                      <Card card={detailCard} location="game-detail" />
                  </div>
              </div>
          )}
          
          <AimingOverlay startPos={aimingState?.startPos} currentPos={aimingState?.currentPos} />
          {isPhaseLocked && <div className="fixed inset-0 z-[200] bg-transparent cursor-wait" />}
          
          {targetingHandCard && (
              <div className="fixed inset-0 z-[90] pointer-events-none">
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-8 py-4 rounded-full shadow-2xl border-2 border-red-500 animate-pulse flex flex-col items-center pointer-events-auto">
                      <div className="text-xl font-bold flex items-center gap-2"><Crosshair className="animate-spin-slow"/> {targetingHandCard.mode === 'enemy_unit' ? '敵ユニットを選択' : targetingHandCard.mode === 'ally_unit' ? '味方ユニットを選択' : 'ターゲットを選択'}</div>
                      <div className="text-sm text-slate-300 mt-1">{targetingHandCard.card.name} を使用中...</div>
                      <button onClick={() => setTargetingHandCard(null)} className="mt-2 bg-red-600 hover:bg-red-500 px-4 py-1 rounded text-sm flex items-center gap-1"><XCircle size={16}/> キャンセル</button>
                  </div>
              </div>
          )}
          
          {isConnectionUnstable && ( <div className="fixed top-20 right-4 z-[100] bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce cursor-pointer" onClick={() => window.location.reload()}><WifiOff size={20} /> <span className="text-xs font-bold">通信不安定！タップして再接続</span> <RefreshCw size={16} /></div> )}
          
          {notification && ( <div key={notification.key} className={`fixed top-32 z-[100] animate-pop-notification ${notification.side === 'left' ? 'left-20' : 'right-20'}`}> <div className="relative transform scale-150 origin-top"> <Card card={notification.card} location="detail" /> </div> </div> )}
          
          {view === 'menu' && (
              <MenuScreen setView={setView} startRandomMatch={startRandomMatch} isDeckValid={isDeckValidStrict(myDeckIds)} />
          )}
          
          {view === 'deck' && (
              <DeckBuilder 
                  myDeckIds={myDeckIds} 
                  setMyDeckIds={setMyDeckIds} 
                  onBack={() => setView('menu')} 
                  onContextMenu={controls.handleContextMenu} // ★Hookから使用
                  onBackgroundClick={controls.handleBackgroundClick} // ★Hookから使用
              />
          )}
          
          {view === 'lobby' && (
              <LobbyScreen roomId={roomId} createRoom={createRoom} joinRoom={joinRoom} onCancel={handleBackToTitle} />
          )}
          
          {view === 'game' && gameData && (
              <GameScreen 
                  gameData={gameData}
                  myRole={myRole}
                  enemyRole={enemyRole}
                  isMyTurn={isMyTurn}
                  targetingHandCard={targetingHandCard}
                  aimingState={aimingState}
                  attackingState={attackingState}
                  selectedUnit={selectedUnit}
                  isDragging={isDragging}
                  // Actions & Controls
                  handleTargetSelection={gameActions.handleTargetSelection}
                  handleSurrender={gameActions.handleSurrender}
                  handleBoardDragStart={controls.handleBoardDragStart} // ★Hookから使用
                  handleContextMenu={controls.handleContextMenu} // ★Hookから使用
                  handleGameDrop={controls.handleGameDrop} // ★Hookから使用
                  initiatePlayCard={gameActions.initiatePlayCard}
                  endTurn={gameActions.endTurn}
                  handleGameDragStart={controls.handleGameDragStart} // ★Hookから使用
                  handleGameDragEnd={controls.handleGameDragEnd} // ★Hookから使用
                  resolveStartPhase={gameActions.resolveStartPhase}
              />
          )}
          
          {view === 'result' && (
              <ResultScreen winner={gameData?.winner} myRole={myRole} onBackToTitle={handleBackToTitle} />
          )}
      </ErrorBoundary>
  );
}