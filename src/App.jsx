import React, { useState, useEffect, useRef } from 'react';
import { Swords, Users, Copy, Zap, Layers, WifiOff, RefreshCw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

import { INITIAL_HP, INITIAL_MANA, MAX_MANA_LIMIT, MAX_BOARD_SIZE, DECK_SIZE, MAX_COPIES_IN_DECK } from './data/rules';
import { CARD_DATABASE, MANA_COIN } from './data/cards';
import { generateId, getCard, getDeckSummary, shuffleDeck } from './utils/helpers';

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
  const [isDragging, setIsDragging] = useState(false);
  
  const [attackingState, setAttackingState] = useState(null);
  const [notification, setNotification] = useState(null);
  const prevLastActionRef = useRef("");
  const prevAttackTimestampRef = useRef(0);
  const [aimingState, setAimingState] = useState(null); 
  
  const [lastDataUpdate, setLastDataUpdate] = useState(Date.now());
  const [isConnectionUnstable, setIsConnectionUnstable] = useState(false);

  useEffect(() => {
    const handleGlobalContextMenu = (e) => { e.preventDefault(); };
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => { document.removeEventListener('contextmenu', handleGlobalContextMenu); };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (aimingState) {
        setAimingState(prev => ({ ...prev, currentPos: { x: e.clientX, y: e.clientY } }));
      }
    };

    const handleMouseUp = (e) => {
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

    if (aimingState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [aimingState]); 

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && roomId) {
        try {
          const roomRef = getRoomRef(roomId);
          const snap = await getDoc(roomRef);
          if (snap.exists()) {
             setGameData(snap.data()); 
             setLastDataUpdate(Date.now());
             setIsConnectionUnstable(false);
          }
        } catch (e) {
          console.error("Re-sync failed:", e);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [roomId]);

  useEffect(() => {
    if (!gameData) return;
    const timer = setInterval(() => {
      if (Date.now() - lastDataUpdate > 30000) {
         setIsConnectionUnstable(true);
      }
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
          console.log("🔄 Processing End Effects...");
          updates[`${myRole}.board`] = me.board;
          let effectLogs = [];

          me.board.forEach(card => {
              if (card.type === 'building' && card.turnEnd) {
                  const log = processEffect(card.turnEnd, me, enemy, updates, myRole, enemyRole, gameData);
                  if (log) effectLogs.push(log);
              }
          });

          updates[`${myRole}.board`] = (updates[`${myRole}.board`] || me.board).map(u => ({ ...u, canAttack: true }));

          updates.turnPhase = 'switching';
          if (effectLogs.length > 0) updates.lastAction = `ターン終了効果: ${effectLogs.join(" ")}`;
          
          await updateDoc(roomRef, updates);
      } 
      
      else if (gameData.turnPhase === 'switching') {
          console.log("🔄 Switching Turn...");
          updates.currentTurn = enemyRole; 
          updates.turnPhase = 'start_effect';
          updates.turnCount = gameData.turnCount + 1;
          await updateDoc(roomRef, updates);
      }
      
      else if (gameData.turnPhase === 'start_effect') {
          console.log("🔄 Processing Start Effects...");
          
          const processedBoard = me.board.map(card => {
              if (card.type === 'building') {
                  return { ...card, currentHp: card.currentHp - 1 };
              }
              return card;
          }).filter(u => u.currentHp > 0);

          updates[`${myRole}.board`] = processedBoard.map(u => ({ ...u, canAttack: true }));
          updates.turnPhase = 'strategy';
          await updateDoc(roomRef, updates);
      }

      else if (gameData.turnPhase === 'draw_phase') {
          console.log("🔄 Processing Draw Phase...");
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
      for (const id of deck) {
          counts[id] = (counts[id] || 0) + 1;
          if (counts[id] > MAX_COPIES_IN_DECK) return false;
      }
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

            if (data.latestAttack && 
                data.latestAttack.timestamp > prevAttackTimestampRef.current && 
                data.latestAttack.attackerRole !== myRole) { 
                
                const { sourceUid, targetType, targetUid } = data.latestAttack;
                const attackerEl = document.getElementById(`unit-${sourceUid}`);
                let targetEl = targetType === 'unit' ? document.getElementById(`unit-${targetUid}`) : document.getElementById('my-face');
                if (!targetEl && targetType === 'unit') targetEl = document.getElementById('my-face');

                if (attackerEl && targetEl) {
                    const atkRect = attackerEl.getBoundingClientRect();
                    const tgtRect = targetEl.getBoundingClientRect();
                    setAttackingState({ uid: sourceUid, x: (tgtRect.left+tgtRect.width/2)-(atkRect.left+atkRect.width/2), y: (tgtRect.top+tgtRect.height/2)-(atkRect.top+atkRect.height/2) });
                    setTimeout(() => { setAttackingState(null); applyGameUpdate(); }, 600);
                } else {
                    applyGameUpdate();
                }
                prevAttackTimestampRef.current = data.latestAttack.timestamp;
            } else {
                applyGameUpdate();
            }
        }
    });
    return () => unsubscribe();
  }, [roomId, view, userId, isHost, myRole]);

  const handleDraw = (currentDeck, currentHand, currentBoard, updates, rolePrefix, latestGameData) => {
      if (currentDeck.length > 0 && currentHand.length < 10) {
          const drawnCard = currentDeck.shift();
          currentHand.push(drawnCard);
          const newBoard = currentBoard.map(unit => {
              if (unit.onDrawTrigger) {
                   if (unit.onDrawTrigger.type === 'buff_self_attack') return { ...unit, attack: unit.attack + unit.onDrawTrigger.value };
                   if (unit.onDrawTrigger.type === 'heal_self') return { ...unit, currentHp: Math.min(unit.currentHp + unit.onDrawTrigger.value, unit.health) };
                   if (unit.onDrawTrigger.type === 'heal_face') {
                       const currentHp = updates[`${rolePrefix}.hp`] !== undefined ? updates[`${rolePrefix}.hp`] : latestGameData[rolePrefix].hp;
                       updates[`${rolePrefix}.hp`] = currentHp + unit.onDrawTrigger.value;
                   }
              }
              return unit;
          });
          updates[`${rolePrefix}.board`] = newBoard; 
      }
      return { deck: currentDeck, hand: currentHand };
  };

  const processEffect = (effect, me, enemy, updates, rolePrefix, enemyPrefix, latestGameData, sourceUnitUid = null) => {
      if (!effect || !me || !enemy || !latestGameData) return "";
      let logMsg = "";
      const currentEnemyBoard = updates[`${enemyPrefix}.board`] || enemy.board;
      const currentMeBoard = updates[`${rolePrefix}.board`] || me.board;
      
      const currentHand = updates[`${rolePrefix}.hand`] || me.hand;

      switch(effect.type) {
          case 'damage_random': {
              const targets = currentEnemyBoard.filter(u => u.currentHp > 0);
              if (targets.length > 0) {
                  const targetIndex = Math.floor(Math.random() * targets.length);
                  const target = targets[targetIndex];
                  const newHp = target.currentHp - effect.value;
                  const newEnemyBoard = currentEnemyBoard.map((u, i) => i === targetIndex ? { ...u, currentHp: newHp } : u);
                  updates[`${enemyPrefix}.board`] = newEnemyBoard;
                  logMsg = `💥 ${target.name}に${effect.value}ダメージ！`;
              } else {
                  const newHp = (updates[`${enemyPrefix}.hp`] !== undefined ? updates[`${enemyPrefix}.hp`] : enemy.hp) - effect.value;
                  updates[`${enemyPrefix}.hp`] = newHp;
                  logMsg = `💥 敵プレイヤーに${effect.value}ダメージ！`;
              }
              break;
          }
          case 'damage_all_enemy': {
              let newEnemyBoard = currentEnemyBoard.map(u => ({ ...u, currentHp: u.currentHp - effect.value }));
              updates[`${enemyPrefix}.board`] = newEnemyBoard;
              logMsg = `💣 敵全体に${effect.value}ダメージ！`;
              break;
          }
          case 'damage_all_and_face': {
              let newEnemyBoard = currentEnemyBoard.map(u => ({ ...u, currentHp: u.currentHp - effect.value }));
              updates[`${enemyPrefix}.board`] = newEnemyBoard;
              const newHp = (updates[`${enemyPrefix}.hp`] !== undefined ? updates[`${enemyPrefix}.hp`] : enemy.hp) - effect.value;
              updates[`${enemyPrefix}.hp`] = newHp;
              logMsg = `🌠 敵軍壊滅！${effect.value}ダメージ！`;
              break;
          }
          case 'damage_face': {
              const newHp = (updates[`${enemyPrefix}.hp`] !== undefined ? updates[`${enemyPrefix}.hp`] : enemy.hp) - effect.value;
              updates[`${enemyPrefix}.hp`] = newHp;
              logMsg = `🔥 敵プレイヤーに${effect.value}ダメージ！`;
              break;
          }
          case 'heal_face': {
              const newHp = (updates[`${rolePrefix}.hp`] !== undefined ? updates[`${rolePrefix}.hp`] : me.hp) + effect.value;
              updates[`${rolePrefix}.hp`] = newHp;
              logMsg = `💚 自分のHPを${effect.value}回復！`;
              break;
          }
          case 'drain': {
              const targets = currentEnemyBoard.filter(u => u.currentHp > 0);
              if (targets.length > 0) {
                  const targetIndex = Math.floor(Math.random() * targets.length);
                  const target = targets[targetIndex];
                  const newHp = target.currentHp - effect.value;
                  const newEnemyBoard = currentEnemyBoard.map((u, i) => i === targetIndex ? { ...u, currentHp: newHp } : u);
                  updates[`${enemyPrefix}.board`] = newEnemyBoard;
                  logMsg = `🧛 ${target.name}から${effect.value}吸収！`;
              } else {
                  const newHp = (updates[`${enemyPrefix}.hp`] !== undefined ? updates[`${enemyPrefix}.hp`] : enemy.hp) - effect.value;
                  updates[`${enemyPrefix}.hp`] = newHp;
                  logMsg = `🧛 敵プレイヤーから${effect.value}吸収！`;
              }
              const myHp = (updates[`${rolePrefix}.hp`] !== undefined ? updates[`${rolePrefix}.hp`] : me.hp) + effect.value;
              updates[`${rolePrefix}.hp`] = myHp;
              break;
          }
          case 'add_mana': {
              const newMana = (updates[`${rolePrefix}.mana`] !== undefined ? updates[`${rolePrefix}.mana`] : me.mana) + effect.value;
              updates[`${rolePrefix}.mana`] = newMana;
              logMsg = `🪙 マナを+${effect.value}！`;
              break;
          }
          case 'buff_all_attack': {
              const newBoard = currentMeBoard.map(u => {
                  if (u.type === 'unit') { return { ...u, attack: u.attack + effect.value }; }
                  return u;
              });
              updates[`${rolePrefix}.board`] = newBoard;
              logMsg = `⚔️ 味方全員の攻撃力+${effect.value}！`;
              break;
          }
          case 'buff_self_attack': {
              if (sourceUnitUid) {
                  const newBoard = currentMeBoard.map(u => {
                      if (u.uid === sourceUnitUid) { return { ...u, attack: u.attack + effect.value }; }
                      return u;
                  });
                  updates[`${rolePrefix}.board`] = newBoard;
                  logMsg = `💪 攻撃力が${effect.value}アップ！`;
              }
              break;
          }
          case 'draw': {
              const count = effect.value;
              let tempDeck = [...(updates[`${rolePrefix}.deck`] || me.deck)];
              let tempHand = [...(updates[`${rolePrefix}.hand`] || me.hand)];
              let tempBoard = [...currentMeBoard];
              for(let i=0; i<count; i++) {
                  const res = handleDraw(tempDeck, tempHand, tempBoard, updates, rolePrefix, latestGameData);
                  tempDeck = res.deck;
                  tempHand = res.hand;
              }
              updates[`${rolePrefix}.deck`] = tempDeck;
              updates[`${rolePrefix}.hand`] = tempHand;
              logMsg = `📚 ${count}枚ドロー！`;
              break;
          }
          case 'summon': {
              if (currentMeBoard.length < MAX_BOARD_SIZE) {
                  const tokenCard = CARD_DATABASE.find(c => c.id == effect.value);
                  if (tokenCard) {
                      const token = { ...tokenCard, uid: generateId(), canAttack: false, currentHp: tokenCard.health };
                      updates[`${rolePrefix}.board`] = [...currentMeBoard, token];
                      logMsg = `✨ ${token.name}を召喚！`;
                  }
              }
              break;
          }
          case 'generate_card': {
              const genCard = CARD_DATABASE.find(c => c.id == effect.value);
              
              if (genCard) {
                  // 手札が10枚未満なら追加できる
                  if (currentHand.length < 10) {
                      const newCard = { ...genCard, uid: generateId() };
                      const newHand = [...currentHand, newCard];
                      updates[`${rolePrefix}.hand`] = newHand;
                      
                      logMsg = `🃏 手札に${genCard.name}を加えた！`;
                  } else {
                      logMsg = `⚠️ 手札がいっぱいで${genCard.name}が入らない！`;
                  }
              }
              break;
          }
          case 'summon_multi': {
              const count = effect.count;
              const tokenCard = CARD_DATABASE.find(c => c.id == effect.value);
              if (tokenCard) {
                  let newBoard = [...currentMeBoard];
                  let summoned = 0;
                  for(let i=0; i<count; i++) {
                      if (newBoard.length < MAX_BOARD_SIZE) {
                          newBoard.push({ ...tokenCard, uid: generateId(), canAttack: false, currentHp: tokenCard.health });
                          summoned++;
                      }
                  }
                  updates[`${rolePrefix}.board`] = newBoard;
                  logMsg = `✨ ${tokenCard.name}を${summoned}体召喚！`;
              }
              break;
          }
      }
      return logMsg;
  };

  const playCard = async (card) => {
    if (!gameData || !isMyTurn || gameData.turnPhase !== 'main') return;
    const me = gameData[myRole];
    const enemy = gameData[enemyRole];
    if (me.mana < card.cost) return;
    if (card.type !== 'spell' && me.board.length >= MAX_BOARD_SIZE) return;

    const roomRef = getRoomRef(roomId);
    let updates = {};
    updates[`${myRole}.mana`] = me.mana - card.cost;
    const cardIndex = me.hand.findIndex(c => c.uid === card.uid);
    let newHand = [...me.hand];
    if (cardIndex > -1) newHand.splice(cardIndex, 1);
    updates[`${myRole}.hand`] = newHand;

    let effectLog = "";
    if (card.type === 'spell') {
        effectLog = processEffect(card.onPlay, me, enemy, updates, myRole, enemyRole, gameData) || "";
    } else {
        const playedCard = { ...card, uid: generateId(), canAttack: !!card.haste, currentHp: card.health };
        updates[`${myRole}.board`] = [...me.board, playedCard];
        if (card.onPlay) {
            effectLog = processEffect(card.onPlay, me, enemy, updates, myRole, enemyRole, gameData);
        }
    }

    const checkDeath = (board, prefix, enemyPrefix) => {
        if (!board) return;
        let deadUnits = [];
        let aliveUnits = [];
        board.forEach(u => {
            if (u.currentHp <= 0) deadUnits.push(u);
            else aliveUnits.push(u);
        });
        updates[`${prefix}.board`] = aliveUnits;
        if (deadUnits.length > 0) {
            deadUnits.forEach(d => {
                if (d.onDeath) {
                    const log = processEffect(d.onDeath, gameData[prefix === myRole ? myRole : enemyRole], gameData[enemyPrefix === enemyRole ? enemyRole : myRole], updates, prefix, enemyPrefix, gameData);
                    if (log) effectLog += " " + log;
                }
            });
        }
    };
    checkDeath(updates[`${enemyRole}.board`] || enemy.board, enemyRole, myRole);
    checkDeath(updates[`${myRole}.board`] || me.board, myRole, enemyRole);

    const enemyHp = updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp;
    const myHp = updates[`${myRole}.hp`] !== undefined ? updates[`${myRole}.hp`] : me.hp;

    if (enemyHp <= 0 || myHp <= 0) {
        updates.status = 'finished';
        updates.winner = enemyHp <= 0 ? myRole : enemyRole; 
    }

    updates.lastAction = `${myRole === 'host' ? 'Host' : 'Guest'}が ${card.name} をプレイ！ ${effectLog || ''}`;
    await updateDoc(roomRef, updates);
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
          if (targetUnit.elusive && !attacker.elusive) return; 
      }

      const tauntUnits = enemy.board.filter(u => u.taunt && u.currentHp > 0);
      const attackableTaunts = tauntUnits.filter(t => !t.elusive || attacker.elusive);
      if (attackableTaunts.length > 0) {
          if (targetType === 'face') return; 
          if (targetType === 'unit') {
              const targetUnit = enemy.board.find(u => u.uid === targetUid);
              if (!targetUnit.taunt) return; 
          }
      }

      const attackerEl = document.getElementById(`unit-${attacker.uid}`);
      let targetEl = null;
      if (targetType === 'unit') targetEl = document.getElementById(`unit-${targetUid}`);
      else if (targetType === 'face') targetEl = document.getElementById('enemy-face');

      if (attackerEl && targetEl) {
          const atkRect = attackerEl.getBoundingClientRect();
          const tgtRect = targetEl.getBoundingClientRect();
          setAttackingState({ uid: attacker.uid, x: (tgtRect.left+tgtRect.width/2)-(atkRect.left+atkRect.width/2), y: (tgtRect.top+tgtRect.height/2)-(atkRect.top+atkRect.height/2) });
          await new Promise(resolve => setTimeout(resolve, 600));
          setAttackingState(null);
      }

      const roomRef = getRoomRef(roomId);
      let updates = {};
      let actionLog = "";
      let effectLog = "";

      updates.latestAttack = {
          sourceUid: attacker.uid,
          targetType: targetType,
          targetUid: targetUid,
          attackerRole: myRole, 
          timestamp: Date.now()
      };

      if (attacker.onAttack) {
          const log = processEffect(attacker.onAttack, me, enemy, updates, myRole, enemyRole, gameData, attacker.uid);
          if (log) effectLog += " " + log;
      }

      const currentAttacker = (updates[`${myRole}.board`] || me.board).find(u => u.uid === attacker.uid) || attacker;
      const damage = currentAttacker.attack;

      if (targetType === 'face') {
          const newEnemyHp = (updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp) - damage;
          actionLog = `💥 ${attacker.name} がプレイヤーに ${damage} ダメージ！`;
          updates[`${enemyRole}.hp`] = newEnemyHp;
      } else if (targetType === 'unit') {
          const target = enemy.board.find(u => u.uid === targetUid);
          if (!target) return;
          
          let newTargetHp = target.currentHp - damage;
          let newAttackerHp = currentAttacker.currentHp - target.attack;
          if (attacker.bane) newTargetHp = 0;
          if (target.bane) newAttackerHp = 0;
          if (target.type === 'building') newAttackerHp = currentAttacker.currentHp;

          let newEnemyBoard = (updates[`${enemyRole}.board`] || enemy.board).map(u => u.uid === targetUid ? { ...u, currentHp: newTargetHp } : u);
          let newMyBoard = (updates[`${myRole}.board`] || me.board).map(u => u.uid === attacker.uid ? { ...u, currentHp: newAttackerHp } : u);
          updates[`${enemyRole}.board`] = newEnemyBoard;
          updates[`${myRole}.board`] = newMyBoard;
          actionLog = `⚔️ ${attacker.name} vs ${target.name}`;
      }

      const handleDeath = (board, prefix, oppPrefix) => {
          let dead = board.filter(u => u.currentHp <= 0);
          let alive = board.filter(u => u.currentHp > 0);
          updates[`${prefix}.board`] = alive;
          if (dead.length > 0) {
              dead.forEach(d => {
                  if (d.onDeath) {
                     const log = processEffect(d.onDeath, gameData[prefix], gameData[oppPrefix], updates, prefix, oppPrefix, gameData);
                     if (log) effectLog += " " + log;
                  }
              });
          }
      };
      
      if (updates[`${enemyRole}.board`]) handleDeath(updates[`${enemyRole}.board`], enemyRole, myRole);
      if (updates[`${myRole}.board`]) handleDeath(updates[`${myRole}.board`], myRole, enemyRole);

      const finalMyBoard = updates[`${myRole}.board`] || me.board;
      updates[`${myRole}.board`] = finalMyBoard.map(u => u.uid === attacker.uid ? { ...u, canAttack: false } : u);

      const enemyHp = updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp;
      const myHp = updates[`${myRole}.hp`] !== undefined ? updates[`${myRole}.hp`] : me.hp;

      if (enemyHp <= 0 || myHp <= 0) {
          updates.status = 'finished';
          updates.winner = enemyHp <= 0 ? myRole : enemyRole;
      }

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

    let newMaxMana = me.maxMana;
    if (choice === 'mana') {
        newMaxMana = Math.min(me.maxMana + 1, MAX_MANA_LIMIT);
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

  // ★修正: 検索機能強化！ (createdAt と 有効期限チェック)
  const startRandomMatch = async () => {
    if (!userId) return;
    const currentDeckIds = getDeckForGame();
    if (currentDeckIds.length === 0) return;

    const roomsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
    const q = query(roomsRef, where("status", "==", "waiting"), limit(10)); 

    try {
        const querySnapshot = await getDocs(q);
        let targetRoomId = null;
        
        // ★フィルター条件: 15分以内の部屋のみ
        const EXPIRE_TIME = 15 * 60 * 1000;
        const now = Date.now();

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            
            // 自分以外 かつ 有効期限内(createdAtあり) の部屋を探す
            if (data.hostId !== userId) {
                if (data.createdAt && (now - data.createdAt < EXPIRE_TIME)) {
                    targetRoomId = docSnap.id.replace('room_', '');
                    break; 
                }
            }
        }

        if (targetRoomId) {
            console.log("Found room:", targetRoomId);
            await joinRoom(targetRoomId);
        } else {
            console.log("No room found, creating new one...");
            await createRoom();
        }

    } catch (error) {
        console.error("Error finding match:", error);
        alert("マッチング中にエラーが発生しました");
    }
  };

  // ★修正: createdAt を追加！
  const createRoom = async () => {
    if (!userId) return;
    const currentDeckIds = getDeckForGame();
    if (currentDeckIds.length === 0) return;

    const newRoomId = generateId().substring(0, 6).toUpperCase();
    const roomRef = getRoomRef(newRoomId);
    const firstTurn = Math.random() < 0.5 ? 'host' : 'guest';
    const hostDeck = shuffleDeck(currentDeckIds);
    let hostHand = hostDeck.splice(0, 3);
    let hostMana = INITIAL_MANA;
    if (firstTurn !== 'host') hostHand.push({ ...MANA_COIN, uid: generateId() });

    const initialData = {
        hostId: userId,
        guestId: null,
        status: 'waiting',
        createdAt: Date.now(), // ★ここ追加！
        turnCount: 1,
        currentTurn: firstTurn,
        turnPhase: 'strategy', 
        lastAction: null,
        host: { hp: INITIAL_HP, mana: hostMana, maxMana: INITIAL_MANA, deck: hostDeck, hand: hostHand, board: [], initialDeckSummary: getDeckSummary(currentDeckIds) },
        guest: { hp: INITIAL_HP, mana: INITIAL_MANA, maxMana: INITIAL_MANA, deck: [], hand: [], board: [] }
    };
    await setDoc(roomRef, initialData);
    sessionStorage.setItem('duel_room_id', newRoomId);
    setRoomId(newRoomId);
    setIsHost(true);
    setView('lobby');
  };

  const joinRoom = async (inputRoomId) => {
    if (!userId || !inputRoomId) return;
    const currentDeckIds = getDeckForGame();
    if (currentDeckIds.length === 0) return;

    const roomRef = getRoomRef(inputRoomId);
    const snap = await getDoc(roomRef);
    if (snap.exists() && snap.data().status === 'waiting') {
        const data = snap.data();
        if (data.hostId === userId) { alert("自分の部屋には参加できません"); return; }
        
        const guestDeck = shuffleDeck(currentDeckIds);
        let guestHand = guestDeck.splice(0, 3);
        if (data.currentTurn !== 'guest') guestHand.push({ ...MANA_COIN, uid: generateId() });

        await updateDoc(roomRef, {
            guestId: userId,
            status: 'playing',
            'guest.deck': guestDeck,
            'guest.hand': guestHand,
            'guest.maxMana': INITIAL_MANA,
            'guest.mana': INITIAL_MANA,
            'guest.initialDeckSummary': getDeckSummary(currentDeckIds)
        });
        sessionStorage.setItem('duel_room_id', inputRoomId);
        setRoomId(inputRoomId);
        setIsHost(false);
        setView('game');
    } else { alert("部屋が見つかりません"); }
  };

  const handleBoardDragStart = (e, unit) => {
      if (isMyTurn && gameData.turnPhase === 'main' && unit.canAttack && unit.type !== 'building') {
          const rect = e.currentTarget.getBoundingClientRect();
          setAimingState({
              attackerUid: unit.uid,
              startPos: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
              currentPos: { x: e.clientX, y: e.clientY }
          });
      }
  };

  const handleContextMenu = (e, card) => { e.preventDefault(); setDetailCard(card); };
  const handleBackgroundClick = () => { if (detailCard) setDetailCard(null); };

  const handleGameDragStart = (e, card, origin) => { setIsDragging(true); e.dataTransfer.setData("application/json", JSON.stringify({ id: card.id, card: card, origin: origin })); };
  const handleGameDragEnd = () => setIsDragging(false);
  const handleGameDrop = (e, target) => { 
      e.preventDefault(); setIsDragging(false);
      try {
          const data = JSON.parse(e.dataTransfer.getData("application/json"));
          if (target === 'board' && data.origin === 'hand') playCard(data.card);
      } catch (err) {}
  };

  return (
      <ErrorBoundary>
          <CardDetailModal detailCard={detailCard} onClose={() => setDetailCard(null)} />
          <AimingOverlay startPos={aimingState?.startPos} currentPos={aimingState?.currentPos} />

          {isConnectionUnstable && (
            <div className="fixed top-20 right-4 z-[100] bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce cursor-pointer" onClick={() => window.location.reload()}>
              <WifiOff size={20} />
              <span className="text-xs font-bold">通信不安定！タップして再接続</span>
              <RefreshCw size={16} />
            </div>
          )}

          {notification && (
              <div key={notification.key} className={`fixed top-32 z-[100] animate-pop-notification ${notification.side === 'left' ? 'left-20' : 'right-20'}`}>
                 <div className="relative transform scale-150 origin-top">
                    <Card card={notification.card} location="detail" />
                 </div>
              </div>
          )}

          {view === 'menu' && (
              <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-900 text-white font-sans select-none" onClick={handleBackgroundClick}>
                  <h1 className="text-6xl font-bold mb-4 text-blue-400">DUEL CARD GAME</h1>
                  <p className="mb-8 text-slate-400">Ver 13.0: Random Matchmaking 🎲</p>
                  <div className="flex flex-col gap-4 w-64">
                      <button onClick={() => setView('deck')} className="bg-indigo-600 hover:bg-indigo-500 py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2"><Swords size={20}/> デッキ構築</button>
                      
                      {/* ランダムマッチボタン */}
                      <button 
                        onClick={startRandomMatch} 
                        disabled={!isDeckValidStrict(myDeckIds)} 
                        className={`w-full py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${isDeckValidStrict(myDeckIds) ? 'bg-orange-600 hover:bg-orange-500 text-white animate-pulse' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                      >
                          <Zap size={20}/> ランダムマッチ
                      </button>

                      <button onClick={() => setView('lobby')} disabled={!isDeckValidStrict(myDeckIds)} className={`w-full py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${isDeckValidStrict(myDeckIds) ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                          <Users size={20}/> 友達と対戦
                      </button>
                  </div>
              </div>
          )}

          {view === 'deck' && (
              <DeckBuilder 
                  myDeckIds={myDeckIds} 
                  setMyDeckIds={setMyDeckIds} 
                  onBack={() => setView('menu')}
                  onContextMenu={handleContextMenu}
                  onBackgroundClick={handleBackgroundClick}
              />
          )}

          {view === 'lobby' && (
               <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-900 text-white select-none">
                  <h2 className="text-3xl font-bold mb-8">🌐 オンラインロビー</h2>
                  {!roomId ? (
                      <div className="flex flex-col gap-8 w-full max-w-md">
                          <button onClick={createRoom} className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-500">部屋を作る</button>
                          <div className="flex gap-2">
                              <input type="text" placeholder="部屋ID" className="flex-1 bg-slate-900 border border-slate-600 rounded px-4 text-center uppercase" id="roomIdInput"/>
                              <button onClick={() => joinRoom(document.getElementById('roomIdInput').value.toUpperCase())} className="bg-green-600 px-6 rounded-lg font-bold hover:bg-green-500">参加</button>
                          </div>
                          <button onClick={() => setView('menu')} className="text-slate-500 mt-4">戻る</button>
                      </div>
                  ) : (
                      <div className="text-center">
                          <div className="text-xl mb-4 text-slate-300">部屋ID</div>
                          <div className="text-5xl font-mono font-bold text-yellow-400 mb-8 tracking-widest bg-black/30 p-4 rounded border border-yellow-500/30 flex items-center gap-4">
                              {roomId}<button onClick={() => {navigator.clipboard.writeText(roomId)}} className="text-sm bg-slate-700 p-2 rounded hover:bg-slate-600"><Copy size={20}/></button>
                          </div>
                          <p className="animate-pulse text-xl">対戦相手を待っています...</p>
                          <button onClick={() => {
                              setRoomId(""); 
                              setIsHost(false); 
                              setGameData(null); 
                              sessionStorage.removeItem('duel_room_id');
                              setView('menu');
                          }} className="mt-8 text-red-400 underline">キャンセル</button>
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
                              {(() => {
                                const isMaxMana = gameData[myRole].maxMana >= MAX_MANA_LIMIT;
                                return (
                                  <button onClick={() => !isMaxMana && resolveStartPhase('mana')} disabled={isMaxMana} className={`group relative w-64 h-80 md:w-80 md:h-96 transition-all duration-300 ${isMaxMana ? 'grayscale cursor-not-allowed opacity-50' : 'hover:scale-105'}`}>
                                    <div className={`absolute inset-0 rounded-2xl overflow-hidden border-4 transition-all bg-slate-900/80 ${isMaxMana ? 'border-slate-600' : 'border-blue-400/30 group-hover:border-blue-400 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]'}`}>
                                      <img src="/images/strategy_mana.png" alt="Mana Charge" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.add('bg-gradient-to-br', 'from-blue-900', 'to-slate-900'); }} />
                                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent opacity-60"></div>
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                       <span className={`text-6xl md:text-7xl font-serif font-black drop-shadow-[0_0_10px_rgba(59,130,246,1)] ${isMaxMana ? 'text-slate-400' : 'text-white group-hover:animate-pulse'}`}>MANA</span>
                                       <div className={`mt-4 px-4 py-1 bg-black/60 rounded-full border backdrop-blur-md text-sm font-bold tracking-wider transition-colors ${isMaxMana ? 'border-slate-500 text-slate-400' : 'border-blue-400/50 text-blue-200 group-hover:bg-blue-600 group-hover:text-white'}`}>{isMaxMana ? 'MAX REACHED' : '最大マナ +1'}</div>
                                    </div>
                                  </button>
                                );
                              })()}
                              <button onClick={() => resolveStartPhase('draw')} className="group relative w-64 h-80 md:w-80 md:h-96 transition-all duration-300 hover:scale-105">
                                <div className="absolute inset-0 rounded-2xl overflow-hidden border-4 border-yellow-400/30 group-hover:border-yellow-400 group-hover:shadow-[0_0_50px_rgba(250,204,21,0.6)] transition-all bg-slate-900/80">
                                  <img src="/images/strategy_draw.png" alt="Draw Card" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.add('bg-gradient-to-br', 'from-yellow-900', 'to-slate-900'); }} />
                                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/80 via-transparent to-transparent opacity-60"></div>
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                   <span className="text-6xl md:text-7xl font-serif font-black text-yellow-100 drop-shadow-[0_0_10px_rgba(234,179,8,1)] group-hover:animate-pulse">DRAW</span>
                                   <div className="mt-4 px-4 py-1 bg-black/60 rounded-full border border-yellow-400/50 backdrop-blur-md text-yellow-200 text-sm font-bold tracking-wider group-hover:bg-yellow-600 group-hover:text-white transition-colors">カードを1枚引く</div>
                                </div>
                              </button>
                          </div>
                      </div>
                  )}

                  <div className="flex-1 flex flex-col relative">
                      <GameHeader enemy={gameData[enemyRole]} onFaceClick={() => selectedUnit && attack('face')} isTargetMode={!!aimingState} />
                      <GameBoard 
                          myBoard={gameData[myRole].board} enemyBoard={gameData[enemyRole].board}
                          isMyTurn={isMyTurn} turnCount={gameData.turnCount} lastAction={gameData.lastAction}
                          selectedUnit={selectedUnit} isDragging={isDragging}
                          onCardClick={(unit, owner) => {}} onBoardDragStart={handleBoardDragStart}
                          onContextMenu={handleContextMenu} onDrop={handleGameDrop}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                          attackingState={attackingState}
                      />
                      <PlayerConsole 
                          me={gameData[myRole]} isMyTurn={isMyTurn} turnPhase={gameData.turnPhase}
                          onPlayCard={playCard} onEndTurn={endTurn} onContextMenu={handleContextMenu}
                          onDragStart={handleGameDragStart} onDragEnd={handleGameDragEnd}
                      />
                  </div>
                  <GameSidebar me={gameData[myRole]} enemy={gameData[enemyRole]} />
              </div>
          )}

          {view === 'result' && (
              <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 text-white z-[10000] select-none animate-in fade-in duration-1000">
                  <h1 className={`text-7xl md:text-9xl font-black mb-8 tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] animate-pulse ${gameData?.winner === myRole ? 'text-yellow-400' : 'text-blue-500 grayscale'}`}>
                      {gameData?.winner === myRole ? 'VICTORY' : 'DEFEAT'}
                  </h1>
                  <p className="text-2xl text-slate-300 mb-12 font-serif tracking-widest uppercase">{gameData?.winner === myRole ? 'You are the Champion!' : 'Better luck next time...'}</p>
                  <button onClick={() => { setRoomId(""); setIsHost(false); setGameData(null); sessionStorage.removeItem('duel_room_id'); setView('menu'); }} className="bg-white text-black px-12 py-4 rounded-full font-black text-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all duration-300">
                      タイトルに戻る
                  </button>
              </div>
          )}
      </ErrorBoundary>
  );
}