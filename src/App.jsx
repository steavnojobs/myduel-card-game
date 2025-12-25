import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Crosshair, XCircle } from 'lucide-react'; 
import { auth, db } from './config/firebase'; 
import { signInAnonymously } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore'; 

// --- Hooks ---
import { useMatchmaking } from './hooks/useMatchmaking';
import { useGameActions } from './hooks/useGameActions';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameSync } from './hooks/useGameSync';
import { useGameControls } from './hooks/useGameControls'; 

// --- Components ---
import MenuScreen from './components/screens/MenuScreen';
import LobbyScreen from './components/screens/LobbyScreen';
import GameScreen from './components/screens/GameScreen';
import ResultScreen from './components/screens/ResultScreen';
import CoinTossScreen from './components/screens/CoinTossScreen';
import MulliganScreen from './components/screens/MulliganScreen';
import CardDetailModal from './components/game/CardDetailModal';
import Card from './components/game/Card';
import AimingOverlay from './components/game/AimingOverlay';

// ★新画面コンポーネント
import DeckSelectionScreen from './components/screens/DeckSelectionScreen';
import ClassSelectionScreen from './components/screens/ClassSelectionScreen';
import DeckBuilderScreen from './components/screens/DeckBuilderScreen';

import { generateId } from './utils/helpers';

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
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  // ★デッキ管理用のState
  const [myDeckIds, setMyDeckIds] = useState([]); 
  const [decks, setDecks] = useState(() => {
      try {
          return JSON.parse(localStorage.getItem('my_decks')) || [];
      } catch { return []; }
  });
  const [editingDeck, setEditingDeck] = useState(null);
  const [selectedClassForNewDeck, setSelectedClassForNewDeck] = useState(null);

  // UI State
  const [detailCard, setDetailCard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aimingState, setAimingState] = useState(null); 
  const [targetingHandCard, setTargetingHandCard] = useState(null);
  const isRightClickHeld = useRef(false);

  // Derived State
  const myRole = isHost ? 'host' : 'guest';
  const enemyRole = isHost ? 'guest' : 'host';

  // 2. Custom Hooks Initialization
  const { 
      gameData, setGameData, notification, attackingState, setAttackingState 
  } = useGameSync(roomId, userId, myRole);

  const isMyTurn = gameData && gameData.currentTurn === myRole;
  // ★修正: ゲーム画面にいる時だけロックを有効にする！
  const isPhaseLocked = view === 'game' && gameData && ['coin_toss', 'start_effect', 'end_effect', 'switching'].includes(gameData.turnPhase);

  // Game Logic Hooks
  useGameLoop(gameData, roomId, myRole, enemyRole, isMyTurn);

  useEffect(() => {
      if (!gameData) return;

      // ★追加: リロード対策！自分がホストかどうか再確認する！
      if (userId && gameData.hostId === userId) {
          setIsHost(true);
      }

      if (gameData.status === 'finished' && view !== 'result') setView('result');
      if (gameData.status === 'playing' && view !== 'game') setView('game');
      if (gameData.status === 'waiting' && view !== 'lobby') setView('lobby');
  }, [gameData, view, userId]); 

  const gameActions = useGameActions({
      gameData, myRole, enemyRole, isMyTurn, roomId, isPhaseLocked, 
      targetingHandCard, setTargetingHandCard, setAttackingState, isHost
  });

  // ★ここで cancelRoom も受け取る！
  const { isDeckValidStrict, startRandomMatch, createRoom, joinRoom, cancelRoom } = useMatchmaking(
      userId, myDeckIds, setRoomId, setIsHost, setView
  );

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
  useEffect(() => {
    let sId = sessionStorage.getItem('duel_session_id');
    if (!sId) { sId = generateId(); sessionStorage.setItem('duel_session_id', sId); }
    setUserId(sId);
    const savedRoomId = sessionStorage.getItem('duel_room_id');
    if (savedRoomId) { setRoomId(savedRoomId); }
    const initAuth = async () => { if (auth) await signInAnonymously(auth); };
    initAuth();
  }, []);

  // ★修正: タイトルに戻る（キャンセル）時の処理
  const handleBackToTitle = async () => {
      // 自分がホストで、まだマッチング待ち状態なら、部屋を削除する！🔥
      if (isHost && roomId && gameData?.status === 'waiting') {
          console.log("Canceling matchmaking, deleting room:", roomId);
          await cancelRoom(roomId);
      }

      // ローカルの状態をリセット
      setRoomId(""); 
      setIsHost(false); 
      setGameData(null); 
      sessionStorage.removeItem('duel_room_id'); 
      setView('menu');
  };

  // --- デッキ操作関数 ---
  const handleSaveDeck = (newDeck) => {
      let newDecks = [...decks];
      const idx = newDecks.findIndex(d => d.id === newDeck.id);
      if (idx > -1) { newDecks[idx] = newDeck; } else { newDecks.push(newDeck); }
      setDecks(newDecks);
      localStorage.setItem('my_decks', JSON.stringify(newDecks));
      setView('deck-selection');
  };

  const handleDeleteDeck = (id) => {
      const newDecks = decks.filter(d => d.id !== id);
      setDecks(newDecks);
      localStorage.setItem('my_decks', JSON.stringify(newDecks));
  };

  const handleSelectDeckForBattle = (deck) => {
      setMyDeckIds(deck.cards); 
      startRandomMatch(deck.cards);
  };

  // デッキ構築画面用の右クリックハンドラ
  const handleDeckCardMouseDown = (e, card) => {
    if (e.button === 2) { setDetailCard(card); }
  };
  const handleDeckCardMouseUp = () => { setDetailCard(null); };

  // コイントス終了時の処理
  const handleCoinTossEnd = useCallback(async () => {
    if (isHost && roomId) {
        console.log("Coin toss finished! Moving to mulligan..."); 
        const roomRef = doc(db, 'artifacts', 'my-card-game', 'public', 'data', 'rooms', `room_${roomId}`);
        await updateDoc(roomRef, { turnPhase: 'mulligan' });
    }
  }, [isHost, roomId]);

  // 4. Render
  return (
      <ErrorBoundary>
          {/* ★詳細モーダル制御（透明な壁対策済み） */}
          {detailCard && view !== 'game' && (
              <CardDetailModal detailCard={detailCard} onClose={() => setDetailCard(null)} />
          )}
          
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
          
          {notification && ( <div key={notification.key} className={`fixed top-32 z-[100] animate-pop-notification ${notification.side === 'left' ? 'left-20' : 'right-20'}`}> <div className="relative transform scale-150 origin-top"> <Card card={notification.card} location="detail" /> </div> </div> )}
          
          {/* --- Screens --- */}
          
          {view === 'menu' && (
              <MenuScreen 
                  setView={setView} 
                  startRandomMatch={() => setView('deck-selection')}
                  isDeckValid={true}
              />
          )}
          
          {(view === 'deck-selection' || view === 'deck') && (
              <DeckSelectionScreen 
                  decks={decks}
                  onNewDeck={() => setView('class-selection')}
                  onEditDeck={(deck) => {
                      setEditingDeck(deck);
                      setView('deck-builder');
                  }}
                  onSelectDeckForBattle={handleSelectDeckForBattle}
                  onDeleteDeck={handleDeleteDeck}
                  onBack={() => setView('menu')}
              />
          )}

          {view === 'class-selection' && (
              <ClassSelectionScreen 
                  onSelectClass={(cls) => {
                      setSelectedClassForNewDeck(cls);
                      setEditingDeck(null); // 新規
                      setView('deck-builder');
                  }}
                  onBack={() => setView('deck-selection')}
              />
          )}

          {view === 'deck-builder' && (
              <DeckBuilderScreen 
                  initialDeck={editingDeck}
                  selectedClass={selectedClassForNewDeck}
                  onSaveDeck={handleSaveDeck}
                  onBack={() => setView('deck-selection')}
                  onCardMouseDown={handleDeckCardMouseDown}
                  onCardMouseUp={handleDeckCardMouseUp}
              />
          )}
          
          {view === 'lobby' && (
              <LobbyScreen roomId={roomId} createRoom={createRoom} joinRoom={joinRoom} onCancel={handleBackToTitle} />
          )}
          
          {view === 'game' && gameData?.turnPhase === 'coin_toss' && (
             <CoinTossScreen isMyTurn={isMyTurn} onComplete={handleCoinTossEnd} />
          )}

          {view === 'game' && gameData?.turnPhase === 'mulligan' && (
             <MulliganScreen 
                hand={gameData[myRole].hand} 
                onSubmit={gameActions.submitMulligan}
                isWaiting={gameData[myRole].mulliganDone} 
             />
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
                  handleTargetSelection={gameActions.handleTargetSelection}
                  handleSurrender={gameActions.handleSurrender}
                  handleBoardDragStart={controls.handleBoardDragStart}
                  handleContextMenu={controls.handleContextMenu}
                  handleGameDrop={controls.handleGameDrop}
                  initiatePlayCard={gameActions.initiatePlayCard}
                  endTurn={gameActions.endTurn}
                  handleGameDragStart={controls.handleGameDragStart}
                  handleGameDragEnd={controls.handleGameDragEnd}
                  resolveStartPhase={gameActions.resolveStartPhase}
              />
          )}
          
          {view === 'result' && (
              <ResultScreen winner={gameData?.winner} myRole={myRole} onBackToTitle={handleBackToTitle} />
          )}
      </ErrorBoundary>
  );
}