import React, { useState, useEffect, useRef } from 'react';
import { Swords, Users, Copy, Zap, Layers, WifiOff, RefreshCw, XCircle, Crosshair } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

import { INITIAL_HP, INITIAL_MANA, MAX_MANA_LIMIT, MAX_BOARD_SIZE, DECK_SIZE, MAX_COPIES_IN_DECK, EFFECT_DELAY } from './data/rules';
import { CARD_DATABASE, MANA_COIN } from './data/cards';
import { generateId, getCard, getDeckSummary, shuffleDeck } from './utils/helpers';
import { processEffect, handleDraw, createUnit, applyDamage } from './utils/gameLogic';

import CardDetailModal from './components/game/CardDetailModal';
import GameHeader from './components/game/GameHeader';
import GameBoard from './components/game/GameBoard';
import PlayerConsole from './components/game/PlayerConsole';
import GameSidebar from './components/game/GameSidebar';
import DeckBuilder from './components/screens/DeckBuilder';
import Card from './components/game/Card';
import AimingOverlay from './components/game/AimingOverlay';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app, auth, db;
if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.error("Firebase設定が見つかりません。.envを確認してください！");
}

const appId = 'my-card-game'; 

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
  const [userId, setUserId] = useState(null); 
  const [view, setView] = useState('menu'); 
  const [myDeckIds, setMyDeckIds] = useState([]);
  const isDeckInitialized = useRef(false);
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  const [detailCard, setDetailCard] = useState(null);
  const isRightClickHeld = useRef(false); 

  const [isDragging, setIsDragging] = useState(false);
  const [attackingState, setAttackingState] = useState(null);
  const [notification, setNotification] = useState(null);
  const prevLastActionRef = useRef("");
  const prevAttackTimestampRef = useRef(0);
  const [aimingState, setAimingState] = useState(null); 
  const [targetingHandCard, setTargetingHandCard] = useState(null);
  const [lastDataUpdate, setLastDataUpdate] = useState(Date.now());
  const [isConnectionUnstable, setIsConnectionUnstable] = useState(false);

  const isProcessingTurnEnd = useRef(false);

  useEffect(() => {
    const handleGlobalContextMenu = (e) => { 
        e.preventDefault(); 
        if (targetingHandCard) {
            setTargetingHandCard(null); 
        } 
    };
    
    const handleGlobalClick = (e) => {
        if (view !== 'game' && detailCard) {
             setDetailCard(null);
        }
    };

    document.addEventListener('contextmenu', handleGlobalContextMenu);
    document.addEventListener('click', handleGlobalClick);
    return () => { 
        document.removeEventListener('contextmenu', handleGlobalContextMenu);
        document.removeEventListener('click', handleGlobalClick);
    };
  }, [targetingHandCard, view, detailCard]);

  useEffect(() => {
      if (view !== 'game') return;

      const findCardFromEvent = (target) => {
          const unitEl = target.closest('[id^="unit-"]');
          if (unitEl && gameData) {
              const uid = unitEl.id.replace('unit-', '');
              const allUnits = [...(gameData.host.board || []), ...(gameData.guest.board || [])];
              return allUnits.find(u => u.uid === uid);
          }
          const handEl = target.closest('[id^="hand-"]');
          if (handEl && gameData) {
              const uid = handEl.id.replace('hand-', '');
              const myHand = gameData[myRole]?.hand || [];
              return myHand.find(c => c.uid === uid);
          }
          return null;
      };

      const handleMouseDown = (e) => {
          if (e.button === 2) { 
              isRightClickHeld.current = true;
              const card = findCardFromEvent(e.target);
              if (card) setDetailCard(card);
          }
      };

      const handleMouseUp = (e) => {
          if (e.button === 2) { 
              isRightClickHeld.current = false;
              setDetailCard(null); 
          }
      };

      const handleMouseMove = (e) => {
          if (aimingState) {
              setAimingState(prev => ({ ...prev, currentPos: { x: e.clientX, y: e.clientY } }));
          }
          if (isRightClickHeld.current) {
              const card = findCardFromEvent(e.target);
              if (card && card.uid !== detailCard?.uid) {
                  setDetailCard(card);
              } else if (!card) {
                  setDetailCard(null);
              }
          }
      };

      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);

      return () => {
          window.removeEventListener('mousedown', handleMouseDown);
          window.removeEventListener('mouseup', handleMouseUp);
          window.removeEventListener('mousemove', handleMouseMove);
      };
  }, [view, gameData, aimingState, detailCard]);

  useEffect(() => {
    const handleMouseUpAim = (e) => {
      if (aimingState) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const unitTarget = element?.closest('[id^="unit-"]');
        const faceTarget = element?.closest('#enemy-face');

        if (unitTarget) {
            const targetUid = unitTarget.id.replace('unit-', '');
            attack('unit', targetUid, aimingState.attackerUid);
        } else if (faceTarget) {
            attack('face', null, aimingState.attackerUid);
        }
        setAimingState(null);
      }
    };
    if (aimingState) window.addEventListener('mouseup', handleMouseUpAim);
    return () => { if (aimingState) window.removeEventListener('mouseup', handleMouseUpAim); };
  }, [aimingState]); 

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && roomId) {
        try {
          const roomRef = getRoomRef(roomId);
          const snap = await getDoc(roomRef);
          if (snap.exists()) { setGameData(snap.data()); setLastDataUpdate(Date.now()); setIsConnectionUnstable(false); }
        } catch (e) { console.error("Re-sync failed:", e); }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [roomId]);

  useEffect(() => {
    if (!gameData) return;
    const timer = setInterval(() => {
      if (Date.now() - lastDataUpdate > 30000) setIsConnectionUnstable(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [gameData, lastDataUpdate]);

  const myRole = isHost ? 'host' : 'guest';
  const enemyRole = isHost ? 'guest' : 'host';
  const isMyTurn = gameData && gameData.currentTurn === myRole;

 useEffect(() => {
    if (!gameData || !isMyTurn || !roomId) return;
    const proceedPhase = async () => {
      const roomRef = getRoomRef(roomId);
      let updates = {};
      const me = gameData[myRole];
      const enemy = gameData[enemyRole];

      if (gameData.turnPhase === 'end_effect') {
          if (isProcessingTurnEnd.current) return;
          isProcessingTurnEnd.current = true;

          console.log("🔄 Processing End Effects...");
          
          updates[`${myRole}.board`] = me.board;
          updates[`${enemyRole}.board`] = enemy.board;
          
          let effectLogs = [];
          let hasEffectTriggered = false;

          me.board.forEach(card => {
              if (card.turnEnd) {
                  const log = processEffect(card.turnEnd, me, enemy, updates, myRole, enemyRole, gameData, card.uid);
                  if (log) {
                      effectLogs.push(log);
                      hasEffectTriggered = true;
                  }
              }
          });

          if (effectLogs.length > 0) {
              updates.lastAction = `ターン終了効果: ${effectLogs.join(" ")}`;
          }

          await updateDoc(roomRef, updates);

          const delay = hasEffectTriggered ? EFFECT_DELAY : 0;

          setTimeout(async () => {
              const finalUpdates = {}; 
              const currentMyBoard = updates[`${myRole}.board`] || me.board;
              const currentEnemyBoard = updates[`${enemyRole}.board`] || enemy.board;
              
              finalUpdates[`${myRole}.board`] = currentMyBoard;
              finalUpdates[`${enemyRole}.board`] = currentEnemyBoard;

              let deathLog = "";

              const deadMyUnits = currentMyBoard.filter(u => u.currentHp <= 0);
              deadMyUnits.forEach(d => {
                  if (d.onDeath && !d.status?.includes('silenced')) {
                      deathLog += ` 💀${d.name}効果`;
                      const log = processEffect(d.onDeath, me, enemy, finalUpdates, myRole, enemyRole, gameData, d.uid);
                      if (log) deathLog += " " + log;
                  }
              });

              const deadEnemyUnits = currentEnemyBoard.filter(u => u.currentHp <= 0);
              deadEnemyUnits.forEach(d => {
                  if (d.onDeath && !d.status?.includes('silenced')) {
                      deathLog += ` 💀${d.name}効果`;
                      const log = processEffect(d.onDeath, enemy, me, finalUpdates, enemyRole, myRole, gameData, d.uid);
                      if (log) deathLog += " " + log;
                  }
              });

              const afterDeathMyBoard = finalUpdates[`${myRole}.board`];
              const afterDeathEnemyBoard = finalUpdates[`${enemyRole}.board`];

              const cleanMyBoard = afterDeathMyBoard.filter(u => u.currentHp > 0);
              const cleanEnemyBoard = afterDeathEnemyBoard.filter(u => u.currentHp > 0);

              finalUpdates[`${myRole}.board`] = cleanMyBoard;
              finalUpdates[`${enemyRole}.board`] = cleanEnemyBoard;

              finalUpdates[`${myRole}.board`] = cleanMyBoard.map(u => ({ ...u, canAttack: true }));

              finalUpdates.turnPhase = 'switching';
              
              if (deathLog) {
                  finalUpdates.lastAction = (updates.lastAction || "") + deathLog;
              }
              
              console.log("🧹 Cleaning up dead units and switching turn...");
              await updateDoc(roomRef, finalUpdates);
              
              isProcessingTurnEnd.current = false;

          }, delay);

      } else if (gameData.turnPhase === 'switching'){
          updates.currentTurn = enemyRole; 
          updates.turnPhase = 'start_effect';
          updates.turnCount = gameData.turnCount + 1;
          await updateDoc(roomRef, updates);
      } else if (gameData.turnPhase === 'start_effect') {
          const processedBoard = me.board.map(card => {
              if (card.type === 'building') return { ...card, currentHp: card.currentHp - 1 };
              return card;
          }).filter(u => u.currentHp > 0);

          // まずは基本の状態セット
          updates[`${myRole}.board`] = processedBoard.map(u => {
              let newStatus = u.status || [];
              let canAttack = true;
              if (newStatus.includes('frozen')) {
                  newStatus = newStatus.filter(s => s !== 'frozen');
                  canAttack = false; 
              }
              return { ...u, canAttack: canAttack, attackCount: 0, status: newStatus };
          });

          // ターン開始時効果の発動
          me.board.forEach(card => {
              if (card.turnStart) {
                  // ★修正: 第8引数に card.uid を渡すのを忘れずに！(前回修正済み)
                  processEffect(card.turnStart, me, enemy, updates, myRole, enemyRole, gameData, card.uid);
              }
          });

          // ★★★ 追加: 死体掃除処理 (ここが足りなかった！) ★★★
          // processEffect で HPが0になったユニット (destroy_selfなど) をここで削除する！
          const currentMyBoard = updates[`${myRole}.board`];
          const currentEnemyBoard = updates[`${enemyRole}.board`] || enemy.board;

          if (currentMyBoard) {
              updates[`${myRole}.board`] = currentMyBoard.filter(u => u.currentHp > 0);
          }
          if (currentEnemyBoard) {
              updates[`${enemyRole}.board`] = currentEnemyBoard.filter(u => u.currentHp > 0);
          }
          // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

          updates.turnPhase = 'strategy';
          await updateDoc(roomRef, updates);
      } else if (gameData.turnPhase === 'draw_phase') {
          let newDeck = [...me.deck];
          let newHand = [...me.hand];
          const drawResult = handleDraw(newDeck, newHand, me.board, updates, myRole, gameData);
          updates[`${myRole}.deck`] = drawResult.deck;
          updates[`${myRole}.hand`] = drawResult.hand;
          updates.turnPhase = 'main';
          await updateDoc(roomRef, updates);
      }
    };
    proceedPhase();
  }, [gameData, isMyTurn, roomId, myRole, enemyRole]); 

  const isDeckValidStrict = (deck) => {
      if (!Array.isArray(deck) || deck.length !== DECK_SIZE) return false;
      const allValid = deck.every(id => getCard(id).id !== 9999);
      if (!allValid) return false;
      const counts = {};
      for (const id of deck) { counts[id] = (counts[id] || 0) + 1; if (counts[id] > MAX_COPIES_IN_DECK) return false; }
      return true;
  };

  const getRoomRef = (rId) => doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${rId}`);
  const getDeckForGame = () => myDeckIds;

  useEffect(() => {
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

  useEffect(() => {
    if (!roomId || !userId || !db) return; 
    const roomRef = getRoomRef(roomId);
    const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setLastDataUpdate(Date.now());
            setIsConnectionUnstable(false);
            const applyGameUpdate = () => {
                setGameData(data);
                if (data.lastAction && data.lastAction !== prevLastActionRef.current) {
                    const match = data.lastAction.match(/^(Host|Guest)が (.+) をプレイ！/);
                    if (match) {
                        const actorName = match[1];
                        const cardName = match[2];
                        const playedCard = CARD_DATABASE.find(c => c.name === cardName) || (cardName === MANA_COIN.name ? MANA_COIN : null);
                        if (playedCard) {
                            setNotification({ card: playedCard, side: actorName === (isHost ? 'Host' : 'Guest') ? 'right' : 'left', key: Date.now() });
                            setTimeout(() => setNotification(null), 1500);
                        }
                    }
                    prevLastActionRef.current = data.lastAction;
                }
                let role = null;
                if (data.hostId === userId) role = 'host';
                else if (data.guestId === userId) role = 'guest';
                if (role) {
                    setIsHost(role === 'host'); 
                    if (data.status === 'playing' && view !== 'game') setView('game');
                    if (data.status === 'finished' && view !== 'result') setView('result');
                    if (data.status === 'waiting' && view !== 'lobby') setView('lobby');
                }
            };
            if (data.latestAttack && data.latestAttack.timestamp > prevAttackTimestampRef.current && data.latestAttack.attackerRole !== myRole) { 
                const { sourceUid, targetType, targetUid } = data.latestAttack;
                const attackerEl = document.getElementById(`unit-${sourceUid}`);
                let targetEl = targetType === 'unit' ? document.getElementById(`unit-${targetUid}`) : document.getElementById('my-face');
                if (!targetEl && targetType === 'unit') targetEl = document.getElementById('my-face');
                if (attackerEl && targetEl) {
                    const atkRect = attackerEl.getBoundingClientRect();
                    const tgtRect = targetEl.getBoundingClientRect();
                    setAttackingState({ uid: sourceUid, x: (tgtRect.left+tgtRect.width/2)-(atkRect.left+atkRect.width/2), y: (tgtRect.top+tgtRect.height/2)-(atkRect.top+atkRect.height/2) });
                    setTimeout(() => { setAttackingState(null); applyGameUpdate(); }, 600);
                } else { applyGameUpdate(); }
                prevAttackTimestampRef.current = data.latestAttack.timestamp;
            } else { applyGameUpdate(); }
        }
    });
    return () => unsubscribe();
  }, [roomId, view, userId, isHost, myRole]);

  // ★重要: ターゲットのタイプをカード効果から取得
  const getRequiredTargetType = (effect) => {
      if (!effect) return null;
      if (Array.isArray(effect)) {
          const targetedEffect = effect.find(e => ['unit', 'enemy_unit', 'ally_unit', 'all_enemy', 'any', 'select'].includes(e.target));
          return targetedEffect ? targetedEffect.target : null;
      }
      return ['unit', 'enemy_unit', 'ally_unit', 'all_enemy', 'any', 'select'].includes(effect.target) ? effect.target : null;
  };

  // ★重要: ターゲットが有効かチェックする共通関数 (Building除外、隠密チェックなど)
  // targetType: 'enemy_unit', 'ally_unit', 'all_enemy', 'unit'(legacy), 'any'
  const isValidTarget = (unit, targetType, myRole) => {
      if (!unit) return false;
      
      // Buildingはターゲット選択不可（不動のオブジェクト）
      if (unit.type === 'building') return false;

      // 敵ユニットの場合
      if (targetType === 'enemy_unit' || targetType === 'all_enemy') {
          if (unit.owner === myRole) return false; // 味方はNG
          if (unit.stealth) return false; // 隠密はNG
          return true;
      }

      // 味方ユニットの場合
      if (targetType === 'ally_unit') {
          if (unit.owner !== myRole) return false; // 敵はNG
          return true;
      }

      // 任意のユニット (legacy 'unit', 'any', 'select')
      if (targetType === 'unit' || targetType === 'any' || targetType === 'select') {
          // 敵で隠密ならNG（味方ならOK）
          if (unit.owner !== myRole && unit.stealth) return false;
          return true;
      }

      return false;
  };

  const initiatePlayCard = (card) => {
      if (!gameData || !isMyTurn || gameData.turnPhase !== 'main') return;
      const me = gameData[myRole];
      const enemy = gameData[enemyRole];

      if (me.mana < card.cost) return;
      if (card.type !== 'spell' && me.board.length >= MAX_BOARD_SIZE) return;
      
      const targetType = getRequiredTargetType(card.onPlay);
      
      if (targetType) {
          // ★修正: ターゲット選択スキップ判定（対象がいないなら不発として処理）
          let canSkip = false;
          const allUnits = [...me.board, ...enemy.board];

          if (targetType === 'enemy_unit') {
              // 敵の「建物以外」「隠密以外」がいなければスキップ
              const validTargets = enemy.board.filter(u => u.type !== 'building' && !u.stealth);
              if (validTargets.length === 0) canSkip = true;
          } 
          else if (targetType === 'ally_unit') {
              // 味方の「建物以外」がいなければスキップ
              const validTargets = me.board.filter(u => u.type !== 'building');
              if (validTargets.length === 0) canSkip = true;
          }
          else if (targetType === 'unit') {
              // 全体の「建物以外」「敵の隠密以外」がいなければスキップ
              const validTargets = allUnits.filter(u => isValidTarget(u, 'unit', myRole));
              if (validTargets.length === 0) canSkip = true;
          }
          // 'all_enemy' は顔が含まれるのでスキップしない

          if (canSkip) {
              console.log("⚠️ 対象がいないため、効果不発でカードをプレイします");
              commitPlayCard(card, null);
              return;
          }

          const mode = targetType === 'select' ? 'any' : targetType;
          setTargetingHandCard({ card: card, mode: mode }); 
      } else {
          commitPlayCard(card, null);
      }
  };

  const commitPlayCard = async (card, targetUid) => {
    setTargetingHandCard(null);
    const me = gameData[myRole];
    const enemy = gameData[enemyRole];
    const roomRef = getRoomRef(roomId);
    let updates = {};
    updates[`${myRole}.mana`] = me.mana - card.cost;
    const cardIndex = me.hand.findIndex(c => c.uid === card.uid);
    let newHand = [...me.hand];
    if (cardIndex > -1) newHand.splice(cardIndex, 1);
    updates[`${myRole}.hand`] = newHand;

    let effectLog = "";
    if (card.type === 'spell') {
        effectLog = processEffect(card.onPlay, me, enemy, updates, myRole, enemyRole, gameData, null, targetUid) || "";
    } else {
        const playedCard = createUnit(card.id, myRole);
        if (card.currentHp) playedCard.currentHp = card.currentHp; 
        
        if (card.haste) playedCard.canAttack = true;

        updates[`${myRole}.board`] = [...me.board, playedCard];
        if (card.onPlay) {
            effectLog = processEffect(card.onPlay, me, enemy, updates, myRole, enemyRole, gameData, playedCard.uid, targetUid);
        }
    }
    
    const checkDeath = (board, prefix, enemyPrefix) => {
        if (!board) return;
        let deadUnits = [], aliveUnits = [];
        board.forEach(u => { if (u.currentHp <= 0) deadUnits.push(u); else aliveUnits.push(u); });
        updates[`${prefix}.board`] = aliveUnits;
        if (deadUnits.length > 0) {
            deadUnits.forEach(d => {
                if (d.onDeath && !d.status?.includes('silenced')) {
                    const log = processEffect(d.onDeath, gameData[prefix === myRole ? myRole : enemyRole], gameData[enemyPrefix === enemyRole ? enemyRole : myRole], updates, prefix, enemyPrefix, gameData, d.uid);
                    if (log) effectLog += " " + log;
                }
            });
        }
    };
    checkDeath(updates[`${enemyRole}.board`] || enemy.board, enemyRole, myRole);
    checkDeath(updates[`${myRole}.board`] || me.board, myRole, enemyRole);
    const enemyHp = updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp;
    const myHp = updates[`${myRole}.hp`] !== undefined ? updates[`${myRole}.hp`] : me.hp;
    if (enemyHp <= 0 || myHp <= 0) { updates.status = 'finished'; updates.winner = enemyHp <= 0 ? myRole : enemyRole; }
    updates.lastAction = `${myRole === 'host' ? 'Host' : 'Guest'}が ${card.name} をプレイ！ ${effectLog || ''}`;
    await updateDoc(roomRef, updates);
  };

  const handleTargetSelection = (clickedType, targetUid) => {
      if (targetingHandCard) {
          const { card, mode } = targetingHandCard;
          
          // 顔クリックの判定
          if (clickedType === 'face') {
              if (mode === 'unit' || mode === 'enemy_unit' || mode === 'ally_unit') return; // ユニット指定系なら顔はNG
              // 'all_enemy', 'any', 'face' ならOK
          }

          // ユニットクリックの判定
          if (clickedType === 'unit' && targetUid) {
              const enemy = gameData[isHost ? 'guest' : 'host'];
              const me = gameData[isHost ? 'host' : 'guest'];
              const target = [...enemy.board, ...me.board].find(u => u.uid === targetUid);
              
              if (target) {
                  // ★修正: isValidTargetを使ってクリックの有効性をチェック
                  if (!isValidTarget(target, mode, myRole)) {
                      console.warn("⚠️ 選択できないターゲットです！");
                      return; // 無効なクリックは無視
                  }

                  const effectType = Array.isArray(card.onPlay) ? card.onPlay[0].type : card.onPlay?.type;
                  if (effectType === 'execute_damaged') {
                      if (target.currentHp >= target.maxHp) {
                          console.warn("⚠️ 無傷のユニットは対象にできません！");
                          return; 
                      }
                  }
              }
          }
          commitPlayCard(card, targetUid); 
      } else {
          if (clickedType === 'face' && selectedUnit) attack('face');
      }
  };

  const attack = async (targetType, targetUid = null, attackerUid = null) => {
      if (!gameData || !isMyTurn || gameData.turnPhase !== 'main') return;
      const me = gameData[myRole];
      const enemy = gameData[enemyRole];
      
      const attacker = me.board.find(u => u.uid === attackerUid);
      if (!attacker || !attacker.canAttack || attacker.type === 'building') return;

      if (targetType === 'unit') {
          const targetUnit = enemy.board.find(u => u.uid === targetUid);
          if (!targetUnit) return;
          if (targetUnit.elusive && !attacker.elusive) {
              console.warn("⚠️ Elusive持ちはElusive持ちでしか攻撃できません！");
              return;
          }
      }

      const tauntUnits = enemy.board.filter(u => u.taunt && u.currentHp > 0 && !u.stealth && !u.elusive);
      if (tauntUnits.length > 0) {
          if (targetType === 'face') return; 
          if (targetType === 'unit') {
              const targetUnit = enemy.board.find(u => u.uid === targetUid);
              if (!targetUnit.taunt) return; 
          }
      }

      const attackerEl = document.getElementById(`unit-${attacker.uid}`);
      let targetEl = targetType === 'unit' ? document.getElementById(`unit-${targetUid}`) : document.getElementById('enemy-face');
      if (attackerEl && targetEl) {
          const atkRect = attackerEl.getBoundingClientRect();
          const tgtRect = targetEl.getBoundingClientRect();
          setAttackingState({ uid: attacker.uid, x: (tgtRect.left+tgtRect.width/2)-(atkRect.left+atkRect.width/2), y: (tgtRect.top+tgtRect.height/2)-(atkRect.top+atkRect.height/2) });
          await new Promise(resolve => setTimeout(resolve, 600));
          setAttackingState(null);
      }

      const roomRef = getRoomRef(roomId);
      let updates = {};
      let actionLog = "", effectLog = "";
      updates.latestAttack = { sourceUid: attacker.uid, targetType: targetType, targetUid: targetUid, attackerRole: myRole, timestamp: Date.now() };

      if (attacker.onAttack) {
          const log = processEffect(attacker.onAttack, me, enemy, updates, myRole, enemyRole, gameData, attacker.uid);
          if (log) effectLog += " " + log;
      }
      
      const currentAttacker = (updates[`${myRole}.board`] || me.board).find(u => u.uid === attacker.uid) || attacker;
      const damage = currentAttacker.attack;

      if (targetType === 'face') {
          const currentEnemyHp = (updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp);
          const newEnemyHp = Math.max(0, currentEnemyHp - damage);
          actionLog = `💥 ${attacker.name} がプレイヤーに ${damage} ダメージ！`;
          updates[`${enemyRole}.hp`] = newEnemyHp;
      } else if (targetType === 'unit') {
          const target = enemy.board.find(u => u.uid === targetUid);
          if (!target) return;
          
          let processedTarget = applyDamage(target, damage);
          
          if (attacker.bane && damage >= 0) {
              processedTarget.currentHp = 0;
          }
          
          if (processedTarget.wasShielded) {
              actionLog = `🛡 ${target.name}の聖なる盾が攻撃を防いだ！`;
              delete processedTarget.wasShielded; 
          } else {
              actionLog = `⚔️ ${attacker.name} vs ${target.name}`;
          }

          let processedAttacker = currentAttacker;
          if ((target.attack > 0 || target.bane) && !target.type.includes('building')) {
              processedAttacker = applyDamage(currentAttacker, target.attack);
              
              if (target.bane) {
                  processedAttacker.currentHp = 0;
              }
              if (processedAttacker.wasShielded) delete processedAttacker.wasShielded;
          }
          
          let finalEnemyBoard = updates[`${enemyRole}.board`] || enemy.board;
          let finalMyBoard = updates[`${myRole}.board`] || me.board;
          
          updates[`${enemyRole}.board`] = finalEnemyBoard.map(u => u.uid === target.uid ? processedTarget : u);
          updates[`${myRole}.board`] = finalMyBoard.map(u => u.uid === attacker.uid ? processedAttacker : u);
      }

      const handleDeath = (board, prefix, oppPrefix) => {
          let dead = board.filter(u => u.currentHp <= 0), alive = board.filter(u => u.currentHp > 0);
          updates[`${prefix}.board`] = alive;
          if (dead.length > 0) dead.forEach(d => { 
              if (d.onDeath && !d.status?.includes('silenced')) { 
                  const log = processEffect(d.onDeath, gameData[prefix], gameData[oppPrefix], updates, prefix, oppPrefix, gameData, d.uid); 
                  if (log) effectLog += " " + log; 
              } 
          });
      };
      if (updates[`${enemyRole}.board`]) handleDeath(updates[`${enemyRole}.board`], enemyRole, myRole);
      if (updates[`${myRole}.board`]) handleDeath(updates[`${myRole}.board`], myRole, enemyRole);

      const finalMyBoard = updates[`${myRole}.board`] || me.board;
      updates[`${myRole}.board`] = finalMyBoard.map(u => {
          if (u.uid === attacker.uid) {
              const newAttackCount = (u.attackCount || 0) + 1;
              const canAttackAgain = u.doubleAttack ? newAttackCount < 2 : false;
              return { ...u, canAttack: canAttackAgain, attackCount: newAttackCount };
          }
          return u;
      });
      const enemyHp = updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp;
      const myHp = updates[`${myRole}.hp`] !== undefined ? updates[`${myRole}.hp`] : me.hp;
      if (enemyHp <= 0 || myHp <= 0) { updates.status = 'finished'; updates.winner = enemyHp <= 0 ? myRole : enemyRole; }
      updates.lastAction = actionLog + effectLog;
      await updateDoc(roomRef, updates);
  };

  const endTurn = async () => {
      if (!gameData || !isMyTurn) return;
      const roomRef = getRoomRef(roomId);
      await updateDoc(roomRef, { turnPhase: 'end_effect' });
  };

  const resolveStartPhase = async (choice) => {
    if (!gameData || !isMyTurn || gameData.turnPhase !== 'strategy') return;
    const roomRef = getRoomRef(roomId);
    const me = gameData[myRole];
    let updates = {};
    let choiceLog = "";
    
    const currentMaxMana = me.maxMana || 0;
    let newMaxMana = currentMaxMana;

    if (choice === 'mana') {
        newMaxMana = Math.min(currentMaxMana + 1, MAX_MANA_LIMIT);
        choiceLog = "マナチャージを選択！";
        updates[`${myRole}.mana`] = newMaxMana;
    } else if (choice === 'draw') {
        updates[`${myRole}.mana`] = newMaxMana; 
        const extraDraw = handleDraw([...me.deck], [...me.hand], me.board, updates, myRole, gameData);
        updates[`${myRole}.deck`] = extraDraw.deck;
        updates[`${myRole}.hand`] = extraDraw.hand;
        choiceLog = "追加ドローを選択！";
    }

    updates[`${myRole}.maxMana`] = newMaxMana;
    updates.turnPhase = 'draw_phase';
    updates.lastAction = choiceLog;
    await updateDoc(roomRef, updates);
  };

  const startRandomMatch = async () => {
    if (!userId) return; const currentDeckIds = getDeckForGame(); if (currentDeckIds.length === 0) return;
    const roomsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
    const q = query(roomsRef, where("status", "==", "waiting"), limit(10)); 
    try {
        const querySnapshot = await getDocs(q); let targetRoomId = null; const EXPIRE_TIME = 15 * 60 * 1000; const now = Date.now();
        for (const docSnap of querySnapshot.docs) { const data = docSnap.data(); if (data.hostId !== userId && data.createdAt && (now - data.createdAt < EXPIRE_TIME)) { targetRoomId = docSnap.id.replace('room_', ''); break; } }
        if (targetRoomId) { console.log("Found room:", targetRoomId); await joinRoom(targetRoomId); } else { console.log("No room found, creating new one..."); await createRoom(); }
    } catch (error) { console.error("Error finding match:", error); alert("マッチング中にエラーが発生しました"); }
  };
  const createRoom = async () => {
    if (!userId) return; const currentDeckIds = getDeckForGame(); if (currentDeckIds.length === 0) return;
    const newRoomId = generateId().substring(0, 6).toUpperCase(); const roomRef = getRoomRef(newRoomId);
    const firstTurn = Math.random() < 0.5 ? 'host' : 'guest'; const hostDeck = shuffleDeck(currentDeckIds);
    let hostHand = hostDeck.splice(0, 3); let hostMana = INITIAL_MANA; if (firstTurn !== 'host') hostHand.push({ ...MANA_COIN, uid: generateId() });
    const initialData = { hostId: userId, guestId: null, status: 'waiting', createdAt: Date.now(), turnCount: 1, currentTurn: firstTurn, turnPhase: 'strategy', lastAction: null, host: { hp: INITIAL_HP, mana: hostMana, maxMana: INITIAL_MANA, deck: hostDeck, hand: hostHand, board: [], initialDeckSummary: getDeckSummary(currentDeckIds) }, guest: { hp: INITIAL_HP, mana: INITIAL_MANA, maxMana: INITIAL_MANA, deck: [], hand: [], board: [] } };
    await setDoc(roomRef, initialData); sessionStorage.setItem('duel_room_id', newRoomId); setRoomId(newRoomId); setIsHost(true); setView('lobby');
  };
  const joinRoom = async (inputRoomId) => {
    if (!userId || !inputRoomId) return; const currentDeckIds = getDeckForGame(); if (currentDeckIds.length === 0) return;
    const roomRef = getRoomRef(inputRoomId); const snap = await getDoc(roomRef);
    if (snap.exists() && snap.data().status === 'waiting') {
        const data = snap.data(); if (data.hostId === userId) { alert("自分の部屋には参加できません"); return; }
        const guestDeck = shuffleDeck(currentDeckIds); let guestHand = guestDeck.splice(0, 3); if (data.currentTurn !== 'guest') guestHand.push({ ...MANA_COIN, uid: generateId() });
        await updateDoc(roomRef, { guestId: userId, status: 'playing', 'guest.deck': guestDeck, 'guest.hand': guestHand, 'guest.maxMana': INITIAL_MANA, 'guest.mana': INITIAL_MANA, 'guest.initialDeckSummary': getDeckSummary(currentDeckIds) });
        sessionStorage.setItem('duel_room_id', inputRoomId); setRoomId(inputRoomId); setIsHost(false); setView('game');
    } else { alert("部屋が見つかりません"); }
  };
  const handleBoardDragStart = (e, unit) => {
      if (e.button !== 0) return;
      if (isMyTurn && gameData.turnPhase === 'main' && unit.canAttack && unit.type !== 'building') {
          const rect = e.currentTarget.getBoundingClientRect();
          setAimingState({ attackerUid: unit.uid, startPos: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, currentPos: { x: e.clientX, y: e.clientY } });
      }
  };
  const handleContextMenu = (e, card) => { 
      e.preventDefault(); 
      if (view !== 'game') setDetailCard(card); 
  };
  const handleBackgroundClick = () => { if (detailCard && view !== 'game') setDetailCard(null); };
  const handleGameDragStart = (e, card, origin) => { setIsDragging(true); e.dataTransfer.setData("application/json", JSON.stringify({ id: card.id, card: card, origin: origin })); };
  const handleGameDragEnd = () => setIsDragging(false);
  const handleGameDrop = (e, target) => { e.preventDefault(); setIsDragging(false); try { const data = JSON.parse(e.dataTransfer.getData("application/json")); if (target === 'board' && data.origin === 'hand') initiatePlayCard(data.card); } catch (err) {} };

  const handleSurrender = async () => {
      if (!roomId || !gameData) return;
      const roomRef = getRoomRef(roomId);
      await updateDoc(roomRef, {
          status: 'finished',
          winner: enemyRole,
          lastAction: `${myRole === 'host' ? 'Host' : 'Guest'}が降参しました🏳️`
      });
  };

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
              <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-900 text-white font-sans select-none" onClick={handleBackgroundClick}>
                  <h1 className="text-6xl font-bold mb-4 text-blue-400">DUEL CARD GAME</h1>
                  <p className="mb-8 text-slate-400">Ver 44.0: Target Fix Complete! 🏗️</p>
                  <div className="flex flex-col gap-4 w-64">
                      <button onClick={() => setView('deck')} className="bg-indigo-600 hover:bg-indigo-500 py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2"><Swords size={20}/> デッキ構築</button>
                      <button onClick={startRandomMatch} disabled={!isDeckValidStrict(myDeckIds)} className={`w-full py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${isDeckValidStrict(myDeckIds) ? 'bg-orange-600 hover:bg-orange-500 text-white animate-pulse' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Zap size={20}/> ランダムマッチ</button>
                      <button onClick={() => setView('lobby')} disabled={!isDeckValidStrict(myDeckIds)} className={`w-full py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${isDeckValidStrict(myDeckIds) ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Users size={20}/> 友達と対戦</button>
                  </div>
              </div>
          )}
          {view === 'deck' && ( <DeckBuilder myDeckIds={myDeckIds} setMyDeckIds={setMyDeckIds} onBack={() => setView('menu')} onContextMenu={handleContextMenu} onBackgroundClick={handleBackgroundClick} /> )}
          {view === 'lobby' && (
               <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-900 text-white select-none">
                  <h2 className="text-3xl font-bold mb-8">🌐 オンラインロビー</h2>
                  {!roomId ? (
                      <div className="flex flex-col gap-8 w-full max-w-md">
                          <button onClick={createRoom} className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-500">部屋を作る</button>
                          <div className="flex gap-2"> <input type="text" placeholder="部屋ID" className="flex-1 bg-slate-900 border border-slate-600 rounded px-4 text-center uppercase" id="roomIdInput"/> <button onClick={() => joinRoom(document.getElementById('roomIdInput').value.toUpperCase())} className="bg-green-600 px-6 rounded-lg font-bold hover:bg-green-500">参加</button> </div>
                          <button onClick={() => setView('menu')} className="text-slate-500 mt-4">戻る</button>
                      </div>
                  ) : (
                      <div className="text-center">
                          <div className="text-xl mb-4 text-slate-300">部屋ID</div>
                          <div className="text-5xl font-mono font-bold text-yellow-400 mb-8 tracking-widest bg-black/30 p-4 rounded border border-yellow-500/30 flex items-center gap-4"> {roomId}<button onClick={() => {navigator.clipboard.writeText(roomId)}} className="text-sm bg-slate-700 p-2 rounded hover:bg-slate-600"><Copy size={20}/></button> </div>
                          <p className="animate-pulse text-xl">対戦相手を待っています...</p>
                          <button onClick={() => { setRoomId(""); setIsHost(false); setGameData(null); sessionStorage.removeItem('duel_room_id'); setView('menu'); }} className="mt-8 text-red-400 underline">キャンセル</button>
                      </div>
                  )}
               </div>
          )}
          {view === 'game' && gameData && (
              <div className="flex w-full min-h-screen bg-slate-900 text-white font-sans overflow-hidden select-none" onClick={handleBackgroundClick} onContextMenu={(e) => e.preventDefault()}>
                  {isMyTurn && gameData.turnPhase === 'strategy' && (
                      <div className="absolute inset-0 bg-black/40 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-12 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-widest" style={{ fontFamily: 'serif' }}>STRATEGY PHASE</h2>
                          <div className="flex gap-12 md:gap-24 items-center">
                              {(() => { const isMaxMana = gameData[myRole].maxMana >= MAX_MANA_LIMIT; return ( <button onClick={() => !isMaxMana && resolveStartPhase('mana')} disabled={isMaxMana} className={`group relative w-64 h-80 md:w-80 md:h-96 transition-all duration-300 ${isMaxMana ? 'grayscale cursor-not-allowed opacity-50' : 'hover:scale-105'}`}> <div className={`absolute inset-0 rounded-2xl overflow-hidden border-4 transition-all bg-slate-900/80 ${isMaxMana ? 'border-slate-600' : 'border-blue-400/30 group-hover:border-blue-400 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]'}`}> <img src="/images/strategy_mana.png" alt="Mana Charge" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.add('bg-gradient-to-br', 'from-blue-900', 'to-slate-900'); }} /> <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent opacity-60"></div> </div> <div className="absolute inset-0 flex flex-col items-center justify-center z-10"> <span className={`text-6xl md:text-7xl font-serif font-black drop-shadow-[0_0_10px_rgba(59,130,246,1)] ${isMaxMana ? 'text-slate-400' : 'text-white group-hover:animate-pulse'}`}>MANA</span> <div className={`mt-4 px-4 py-1 bg-black/60 rounded-full border backdrop-blur-md text-sm font-bold tracking-wider transition-colors ${isMaxMana ? 'border-slate-500 text-slate-400' : 'border-blue-400/50 text-blue-200 group-hover:bg-blue-600 group-hover:text-white'}`}>{isMaxMana ? 'MAX REACHED' : '最大マナ +1'}</div> </div> </button> ); })()}
                              <button onClick={() => resolveStartPhase('draw')} className="group relative w-64 h-80 md:w-80 md:h-96 transition-all duration-300 hover:scale-105"> <div className="absolute inset-0 rounded-2xl overflow-hidden border-4 border-yellow-400/30 group-hover:border-yellow-400 group-hover:shadow-[0_0_50px_rgba(250,204,21,0.6)] transition-all bg-slate-900/80"> <img src="/images/strategy_draw.png" alt="Draw Card" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.add('bg-gradient-to-br', 'from-yellow-900', 'to-slate-900'); }} /> <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/80 via-transparent to-transparent opacity-60"></div> </div> <div className="absolute inset-0 flex flex-col items-center justify-center z-10"> <span className="text-6xl md:text-7xl font-serif font-black text-yellow-100 drop-shadow-[0_0_10px_rgba(234,179,8,1)] group-hover:animate-pulse">DRAW</span> <div className="mt-4 px-4 py-1 bg-black/60 rounded-full border border-yellow-400/50 backdrop-blur-md text-yellow-200 text-sm font-bold tracking-wider group-hover:bg-yellow-600 group-hover:text-white transition-colors">カードを1枚引く</div> </div> </button>
                          </div>
                      </div>
                  )}

                  <div className="flex-1 flex flex-col relative">
                      {/* GameHeaderに targetingHandCard を渡して、顔がターゲット可能か判定させる */}
                      <GameHeader 
                          enemy={gameData[enemyRole]} 
                          onFaceClick={() => handleTargetSelection('face', 'FACE')} 
                          isTargetMode={!!aimingState || (!!targetingHandCard && ['all_enemy', 'face', 'any'].includes(targetingHandCard.mode))} 
                          onSurrender={handleSurrender} 
                      />
                      <GameBoard 
                          myBoard={gameData[myRole].board} enemyBoard={gameData[enemyRole].board}
                          isMyTurn={isMyTurn} turnCount={gameData.turnCount} lastAction={gameData.lastAction}
                          selectedUnit={selectedUnit} isDragging={isDragging}
                          onCardClick={(unit) => handleTargetSelection('unit', unit.uid)} 
                          onBoardDragStart={handleBoardDragStart}
                          onContextMenu={handleContextMenu} onDrop={handleGameDrop}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                          attackingState={attackingState}
                          targetingHandCard={targetingHandCard}
                      />
                      <PlayerConsole 
                          me={gameData[myRole]} isMyTurn={isMyTurn} turnPhase={gameData.turnPhase}
                          onPlayCard={initiatePlayCard} onEndTurn={endTurn} onContextMenu={handleContextMenu}
                          onDragStart={handleGameDragStart} onDragEnd={handleGameDragEnd}
                      />
                  </div>
                  <GameSidebar me={gameData[myRole]} enemy={gameData[enemyRole]} />
              </div>
          )}

          {view === 'result' && (
              <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 text-white z-[10000] select-none animate-in fade-in duration-1000">
                  <h1 className={`text-7xl md:text-9xl font-black mb-8 tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] animate-pulse ${gameData?.winner === myRole ? 'text-yellow-400' : 'text-blue-500 grayscale'}`}>{gameData?.winner === myRole ? 'VICTORY' : 'DEFEAT'}</h1>
                  <p className="text-2xl text-slate-300 mb-12 font-serif tracking-widest uppercase">{gameData?.winner === myRole ? 'You are the Champion!' : 'Better luck next time...'}</p>
                  <button onClick={() => { setRoomId(""); setIsHost(false); setGameData(null); sessionStorage.removeItem('duel_room_id'); setView('menu'); }} className="bg-white text-black px-12 py-4 rounded-full font-black text-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all duration-300">タイトルに戻る</button>
              </div>
          )}
      </ErrorBoundary>
  );
}