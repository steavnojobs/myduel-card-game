import React, { useState, useEffect, useRef } from 'react';
import { Swords, Users, Copy, Zap, Layers } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';

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
  
  // 攻撃アニメーション用State
  const [attackingState, setAttackingState] = useState(null);

  // プレイ通知用State
  const [notification, setNotification] = useState(null);
  const prevLastActionRef = useRef("");
  
  // 直前の攻撃イベントを記憶
  const prevAttackTimestampRef = useRef(0);

  // 全画面右クリック禁止
  useEffect(() => {
    const handleGlobalContextMenu = (e) => { e.preventDefault(); };
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => { document.removeEventListener('contextmenu', handleGlobalContextMenu); };
  }, []);

  const myRole = isHost ? 'host' : 'guest';
  const enemyRole = isHost ? 'guest' : 'host';
  const isMyTurn = gameData && gameData.currentTurn === myRole;

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

    const initAuth = async () => { if (auth) await signInAnonymously(auth); };
    initAuth();

    const loadDeck = () => {
        const savedDeck = localStorage.getItem('my_duel_deck');
        if (savedDeck) { try { setMyDeckIds(JSON.parse(savedDeck)); } catch (e) {} }
        isDeckInitialized.current = true;
    };
    if (!isDeckInitialized.current) loadDeck();
  }, []);

  // ★データ監視と各種アニメーション発火
  useEffect(() => {
    if (!roomId || !userId || !db) return; 
    const roomRef = getRoomRef(roomId);
    
    const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // ★画面更新（＆通知）を行う関数
            // 攻撃アニメーションの時は、これを遅らせて実行する！
            const applyGameUpdate = () => {
                setGameData(data);
                
                // 1. プレイ通知 (Play!)
                if (data.lastAction && data.lastAction !== prevLastActionRef.current) {
                    const match = data.lastAction.match(/^(Host|Guest)が (.+) をプレイ！/);
                    if (match) {
                        const actorName = match[1];
                        const cardName = match[2];
                        const myRoleName = isHost ? 'Host' : 'Guest';
                        const side = actorName === myRoleName ? 'right' : 'left';
                        
                        let playedCard = CARD_DATABASE.find(c => c.name === cardName);
                        if (!playedCard && cardName === MANA_COIN.name) playedCard = MANA_COIN;
                        
                        if (playedCard) {
                            setNotification({ card: playedCard, side: side, key: Date.now() });
                            setTimeout(() => setNotification(null), 1500);
                        }
                    }
                    prevLastActionRef.current = data.lastAction;
                }

                // ロール設定などの基本処理
                let role = null;
                if (data.hostId === userId) role = 'host';
                else if (data.guestId === userId) role = 'guest';
                
                if (role) {
                    setIsHost(role === 'host'); 
                    if (data.status === 'playing' && view === 'lobby') setView('game');
                    if (data.status === 'finished' && view === 'game') setView('result');
                }
            };

            // 2. 相手からの攻撃判定 (Attack!)
            if (data.latestAttack && 
                data.latestAttack.timestamp > prevAttackTimestampRef.current && 
                data.latestAttack.attackerRole !== myRole) { 
                
                const { sourceUid, targetType, targetUid } = data.latestAttack;
                
                // ★まだ setGameData してないから、破壊される前の古いDOMが残ってる！
                // だから「unit-xxxx」が必ず見つかるはず！
                const attackerEl = document.getElementById(`unit-${sourceUid}`);
                let targetEl = null;

                if (targetType === 'unit') {
                    targetEl = document.getElementById(`unit-${targetUid}`); 
                } else if (targetType === 'face') {
                    // 相手が顔を狙ったなら、こっちの「自分の顔」がターゲット
                    targetEl = document.getElementById('my-face'); 
                }

                // もし万が一ターゲットが見つからない場合（既にない場合）、自分の顔へフォールバック
                if (!targetEl && targetType === 'unit') {
                     targetEl = document.getElementById('my-face');
                }

                // アニメーション再生！
                if (attackerEl && targetEl) {
                    const atkRect = attackerEl.getBoundingClientRect();
                    const tgtRect = targetEl.getBoundingClientRect();
                    const deltaX = (tgtRect.left + tgtRect.width / 2) - (atkRect.left + atkRect.width / 2);
                    const deltaY = (tgtRect.top + tgtRect.height / 2) - (atkRect.top + atkRect.height / 2);

                    setAttackingState({ uid: sourceUid, x: deltaX, y: deltaY });
                    
                    // ★ここがポイント！ 0.6秒待ってから、画面を更新（破壊処理）する！
                    setTimeout(() => {
                        setAttackingState(null); // アニメーション終了
                        applyGameUpdate();       // ここで初めてデータ更新！(ユニットが消える)
                    }, 600);
                } else {
                    // 要素が見つからないなら即更新
                    applyGameUpdate();
                }
                
                prevAttackTimestampRef.current = data.latestAttack.timestamp;

            } else {
                // 攻撃じゃない時（ドローやプレイなど）は、即座に画面更新！
                applyGameUpdate();
            }
        }
    });
    return () => unsubscribe();
  }, [roomId, view, userId, isHost, myRole]); // myRoleも依存配列に追加

  const handleDraw = (currentDeck, currentHand, currentBoard, updates, rolePrefix, latestGameData) => {
      if (currentDeck.length > 0 && currentHand.length < 10) {
          const drawnCard = currentDeck.shift();
          currentHand.push(drawnCard);
          
          let triggerLogs = [];
          const newBoard = currentBoard.map(unit => {
              if (unit.onDrawTrigger) {
                   if (unit.onDrawTrigger.type === 'buff_self_attack') {
                       triggerLogs.push(`${unit.name}の攻撃力UP！`);
                       return { ...unit, attack: unit.attack + unit.onDrawTrigger.value };
                   }
                   if (unit.onDrawTrigger.type === 'heal_self') {
                       triggerLogs.push(`${unit.name}が回復！`);
                       return { ...unit, currentHp: Math.min(unit.currentHp + unit.onDrawTrigger.value, unit.health) };
                   }
                   if (unit.onDrawTrigger.type === 'heal_face') {
                       const baseHp = latestGameData?.[rolePrefix]?.hp || INITIAL_HP;
                       const currentHp = updates[`${rolePrefix}.hp`] !== undefined ? updates[`${rolePrefix}.hp`] : baseHp;
                       updates[`${rolePrefix}.hp`] = currentHp + unit.onDrawTrigger.value;
                       triggerLogs.push(`${unit.name}の効果でリーダー回復！`);
                   }
              }
              return unit;
          });
          updates[`${rolePrefix}.board`] = newBoard; 
          
          if (triggerLogs.length > 0) {
              const prevLog = updates.lastAction || "";
              updates.lastAction = (prevLog ? prevLog + " " : "") + triggerLogs.join(" ");
          }
      }
      return { deck: currentDeck, hand: currentHand };
  };

  const processEffect = (effect, me, enemy, updates, rolePrefix, enemyPrefix, latestGameData, sourceUnitUid = null) => {
      if (!effect) return "";
      if (!me || !enemy || !latestGameData) return "";

      let logMsg = "";
      const currentEnemyBoard = updates[`${enemyPrefix}.board`] || enemy.board;
      const currentMeBoard = updates[`${rolePrefix}.board`] || me.board;
      let currentDeck = updates[`${rolePrefix}.deck`] || me.deck;
      let currentHand = updates[`${rolePrefix}.hand`] || me.hand;

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
              let drawnCount = 0;
              let tempDeck = [...currentDeck];
              let tempHand = [...currentHand];
              let tempBoard = [...currentMeBoard];
              for(let i=0; i<count; i++) {
                  const deckSizeBefore = tempDeck.length;
                  const res = handleDraw(tempDeck, tempHand, tempBoard, updates, rolePrefix, latestGameData);
                  tempDeck = res.deck;
                  tempHand = res.hand;
                  if (tempDeck.length < deckSizeBefore) drawnCount++;
                  if (updates[`${rolePrefix}.board`]) tempBoard = updates[`${rolePrefix}.board`];
              }
              updates[`${rolePrefix}.deck`] = tempDeck;
              updates[`${rolePrefix}.hand`] = tempHand;
              logMsg = `📚 ${drawnCount}枚ドロー！`;
              break;
          }
          case 'summon': {
              if (currentMeBoard.length < MAX_BOARD_SIZE) {
                  // ★修正: === を == に変更して、型が違ってもIDが合えばOKにする！
                  const tokenCard = CARD_DATABASE.find(c => c.id == effect.value);
                  if (tokenCard) {
                      const token = { ...tokenCard, uid: generateId(), canAttack: false, currentHp: tokenCard.health };
                      updates[`${rolePrefix}.board`] = [...currentMeBoard, token];
                      logMsg = `✨ ${token.name}を召喚！`;
                  }
              } else {
                  logMsg = `⚠️ 盤面がいっぱいで召喚できない！`;
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
    if (!gameData || !gameData[myRole] || !gameData[enemyRole]) return;
    if (!isMyTurn || gameData.turnPhase !== 'main') return;
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
        effectLog = processEffect(card.onPlay, me, enemy, updates, myRole, enemyRole, gameData) || "効果なし";
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

  const attack = async (targetType, targetUid = null) => {
      if (!gameData || !gameData[myRole] || !gameData[enemyRole]) return;

      if (!isMyTurn || !selectedUnit || gameData.turnPhase !== 'main') return;
      const me = gameData[myRole];
      const enemy = gameData[enemyRole];
      const attacker = me.board.find(u => u.uid === selectedUnit);
      if (!attacker || !attacker.canAttack) { setSelectedUnit(null); return; }
      if (attacker.type === 'building') return;

      if (targetType === 'unit') {
          const targetUnit = enemy.board.find(u => u.uid === targetUid);
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

      // --- 攻撃アニメーション (ローカル再生 & DB記録) ---
      const attackerEl = document.getElementById(`unit-${attacker.uid}`);
      let targetEl = null;
      if (targetType === 'unit') {
          targetEl = document.getElementById(`unit-${targetUid}`);
      } else if (targetType === 'face') {
          targetEl = document.getElementById('enemy-face');
      }

      if (attackerEl && targetEl) {
          const atkRect = attackerEl.getBoundingClientRect();
          const tgtRect = targetEl.getBoundingClientRect();
          const deltaX = (tgtRect.left + tgtRect.width / 2) - (atkRect.left + atkRect.width / 2);
          const deltaY = (tgtRect.top + tgtRect.height / 2) - (atkRect.top + atkRect.height / 2);

          setAttackingState({ uid: attacker.uid, x: deltaX, y: deltaY });
          await new Promise(resolve => setTimeout(resolve, 600));
          setAttackingState(null);
      }
      // -----------------------

      const roomRef = getRoomRef(roomId);
      let updates = {};
      let actionLog = "";
      let effectLog = "";

      // 攻撃イベントをDBに記録！
      updates.latestAttack = {
          sourceUid: attacker.uid,
          targetType: targetType,
          targetUid: targetUid,
          attackerRole: myRole, // 誰が攻撃したか
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
          
          const targetDamage = target.attack;
          let newTargetHp = target.currentHp - damage;
          let newAttackerHp = currentAttacker.currentHp - targetDamage;
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
      setSelectedUnit(null);
      await updateDoc(roomRef, updates);
  };

  const endTurn = async () => {
    if (!gameData || !gameData[myRole] || !gameData[enemyRole]) return;

    if (!isMyTurn) return;
    const roomRef = getRoomRef(roomId);
    const me = gameData[myRole];
    const enemy = gameData[enemyRole]; // 敵データも定義しておく
    let updates = {};   
    let effectLogs = [];
    
    // --- 1. ターン終了時効果の処理 ---
    // ここで「兵舎」がトークンを出したり、「防衛塔」がダメージを与えたりして
    // updates に最新の盤面情報が書き込まれる！
    me.board.forEach(card => {
        if (card.type === 'building' && card.turnEnd) {
            const log = processEffect(card.turnEnd, me, enemy, updates, myRole, enemyRole, gameData);
            if (log) effectLogs.push(log);
        }
    });

    const nextTurn = myRole === 'host' ? 'guest' : 'host';
    const nextPlayer = gameData[nextTurn]; // これは enemy と同じ

    // --- 2. 相手の盤面更新 (防衛塔などのダメージ反映) ---
    // ★重要: updatesにある「効果処理後の盤面」を優先して取得！
    const enemyBoardAfterEffects = updates[`${nextTurn}.board`] || nextPlayer.board;

    // 建物の耐久を減らす & 生存判定
    let finalNextPlayerBoard = enemyBoardAfterEffects.map(card => {
        if (card.type === 'building') return { ...card, currentHp: card.currentHp - 1 };
        return card;
    }).filter(u => u.currentHp > 0);
    
    // 次のターンなので行動権を回復
    finalNextPlayerBoard = finalNextPlayerBoard.map(u => ({ ...u, canAttack: true }));
    
    // --- 3. 自分の盤面更新 (兵舎などの召喚反映) ---
    // ★重要: ここも updatesにある「効果処理後の盤面」を優先！！
    // これを忘れると、せっかく召喚したトークンが消えちゃう！
    const myBoardAfterEffects = updates[`${myRole}.board`] || me.board;

    // 自分はターン終了なので、行動権を一応回復状態にしておく（見た目のため）
    const finalMyBoard = myBoardAfterEffects.map(u => ({ ...u, canAttack: true }));


    // --- 4. データを確定 ---
    updates.currentTurn = nextTurn;
    updates.turnPhase = 'start_choice';
    updates.turnCount = gameData.turnCount + 1;
    
    // 計算し直した盤面をセット！
    updates[`${nextTurn}.board`] = finalNextPlayerBoard;
    updates[`${myRole}.board`] = finalMyBoard;
    
    updates.lastAction = `ターン終了！${effectLogs.join(" ")}`;
    await updateDoc(roomRef, updates);
  };

  const resolveStartPhase = async (choice) => {
    if (!gameData || !gameData[myRole] || !gameData[enemyRole]) return;

    if (!isMyTurn || gameData.turnPhase !== 'start_choice') return;
    const roomRef = getRoomRef(roomId);
    const me = gameData[myRole];
    let updates = {};
    let choiceLog = "";

    let newDeck = [...me.deck];
    let newHand = [...me.hand];
    let currentBoard = [...me.board];

    const drawResult = handleDraw(newDeck, newHand, currentBoard, updates, myRole, enemyRole, gameData);
    newDeck = drawResult.deck;
    newHand = drawResult.hand;
    if (updates[`${myRole}.board`]) currentBoard = updates[`${myRole}.board`];

    let newMaxMana = me.maxMana;
    if (choice === 'mana') {
        newMaxMana = Math.min(me.maxMana + 1, MAX_MANA_LIMIT);
        choiceLog = "マナチャージを選択！";
    } else if (choice === 'draw') {
        const extraDraw = handleDraw(newDeck, newHand, currentBoard, updates, myRole, enemyRole, gameData);
        newDeck = extraDraw.deck;
        newHand = extraDraw.hand;
        if (updates[`${myRole}.board`]) currentBoard = updates[`${myRole}.board`];
        choiceLog = "追加ドローを選択！";
    }

    updates[`${myRole}.maxMana`] = newMaxMana;
    updates[`${myRole}.mana`] = newMaxMana;
    updates[`${myRole}.deck`] = newDeck;
    updates[`${myRole}.hand`] = newHand;
    updates[`${myRole}.board`] = currentBoard;
    
    updates.turnPhase = 'main';
    const drawLog = updates.lastAction || "";
    updates.lastAction = `${choiceLog} ${drawLog}`;
    await updateDoc(roomRef, updates);
  };

  const createRoom = async () => {
    if (!userId) return;
    const currentDeckIds = getDeckForGame();
    if (currentDeckIds.length === 0) return;

    const newRoomId = generateId().substring(0, 6).toUpperCase();
    const roomRef = getRoomRef(newRoomId);
    const firstTurn = Math.random() < 0.5 ? 'host' : 'guest';
    const hostDeck = shuffleDeck(currentDeckIds);
    let hostHand = hostDeck.splice(0, 3);
    let hostMaxMana = INITIAL_MANA;
    let hostMana = INITIAL_MANA;
    
    if (firstTurn !== 'host') {
        hostHand.push({ ...MANA_COIN, uid: generateId() });
    }

    const initialData = {
        hostId: userId,
        guestId: null,
        status: 'waiting',
        turnCount: 1,
        currentTurn: firstTurn,
        turnPhase: 'start_choice',
        lastAction: null,
        host: { hp: INITIAL_HP, mana: hostMana, maxMana: hostMaxMana, deck: hostDeck, hand: hostHand, board: [], initialDeckSummary: getDeckSummary(currentDeckIds) },
        guest: { hp: INITIAL_HP, mana: INITIAL_MANA, maxMana: INITIAL_MANA, deck: [], hand: [], board: [] }
    };
    await setDoc(roomRef, initialData);
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
        let guestMaxMana = INITIAL_MANA;
        let guestMana = INITIAL_MANA;

        if (data.currentTurn !== 'guest') {
            guestHand.push({ ...MANA_COIN, uid: generateId() });
        }

        await updateDoc(roomRef, {
            guestId: userId,
            status: 'playing',
            'guest.deck': guestDeck,
            'guest.hand': guestHand,
            'guest.maxMana': guestMaxMana,
            'guest.mana': guestMana,
            'guest.initialDeckSummary': getDeckSummary(currentDeckIds)
        });
        setRoomId(inputRoomId);
        setIsHost(false);
        setView('game');
    } else { alert("部屋が見つかりません"); }
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

          {/* プレイカード通知 */}
          {notification && (
              <div 
                key={notification.key} 
                className={`fixed top-32 z-[100] animate-pop-notification ${notification.side === 'left' ? 'left-20' : 'right-20'}`}
              >
                 <div className="relative transform scale-150 origin-top">
                    <Card card={notification.card} location="detail" />
                 </div>
              </div>
          )}

          {view === 'menu' && (
              <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-900 text-white font-sans select-none" onClick={handleBackgroundClick}>
                  <h1 className="text-6xl font-bold mb-4 text-blue-400">DUEL CARD GAME</h1>
                  <p className="mb-8 text-slate-400">Ver 11.0: Visual Update & Bug Fixes ✨</p>
                  <div className="flex flex-col gap-4 w-64">
                      <button onClick={() => setView('deck')} className="bg-indigo-600 hover:bg-indigo-500 py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2"><Swords size={20}/> デッキ構築</button>
                      <button onClick={() => setView('lobby')} disabled={!isDeckValidStrict(myDeckIds)} className={`w-full py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${isDeckValidStrict(myDeckIds) ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                          <Users size={20}/> オンライン対戦
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
                          <button onClick={() => {setRoomId(""); setIsHost(false); setGameData(null); setView('menu');}} className="mt-8 text-red-400 underline">キャンセル</button>
                      </div>
                  )}
               </div>
          )}

          {view === 'game' && gameData && (
              <div className="flex w-full min-h-screen bg-slate-900 text-white font-sans overflow-hidden select-none" onClick={handleBackgroundClick} onContextMenu={(e) => e.preventDefault()}>
                  
                  {isMyTurn && gameData.turnPhase === 'start_choice' && (
                      <div className="absolute inset-0 bg-black/40 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                          
                          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-12 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-widest" style={{ fontFamily: 'serif' }}>
                              STRATEGY PHASE
                          </h2>

                          <div className="flex gap-12 md:gap-24 items-center">
                              
                              {(() => {
                                const isMaxMana = gameData[myRole].maxMana >= MAX_MANA_LIMIT;
                                return (
                                  <button 
                                    onClick={() => !isMaxMana && resolveStartPhase('mana')} 
                                    disabled={isMaxMana}
                                    className={`group relative w-64 h-80 md:w-80 md:h-96 transition-all duration-300 ${isMaxMana ? 'grayscale cursor-not-allowed opacity-50' : 'hover:scale-105'}`}
                                  >
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
                      <GameHeader 
                          enemy={gameData[enemyRole]} 
                          onFaceClick={() => selectedUnit && attack('face')}
                          isTargetMode={!!selectedUnit}
                      />
                      <GameBoard 
                          myBoard={gameData[myRole].board}
                          enemyBoard={gameData[enemyRole].board}
                          isMyTurn={isMyTurn}
                          turnCount={gameData.turnCount}
                          lastAction={gameData.lastAction}
                          selectedUnit={selectedUnit}
                          isDragging={isDragging}
                          onCardClick={(unit, owner) => {
                              if (owner === 'me' && isMyTurn && unit.canAttack) {
                                  setSelectedUnit(selectedUnit === unit.uid ? null : unit.uid);
                              } else if (owner === 'enemy' && selectedUnit) {
                                  attack('unit', unit.uid);
                              }
                          }}
                          onContextMenu={handleContextMenu}
                          onDrop={handleGameDrop}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                          attackingState={attackingState}
                      />
                      <PlayerConsole 
                          me={gameData[myRole]}
                          isMyTurn={isMyTurn}
                          turnPhase={gameData.turnPhase}
                          onPlayCard={playCard}
                          onEndTurn={endTurn}
                          onContextMenu={handleContextMenu}
                          onDragStart={handleGameDragStart}
                          onDragEnd={handleGameDragEnd}
                      />
                  </div>
                  <GameSidebar me={gameData[myRole]} enemy={gameData[enemyRole]} />
              </div>
          )}

          {view === 'result' && (
              <div className="flex flex-col items-center justify-center w-full min-h-screen bg-black/90 text-white z-50 select-none">
                  <h1 className={`text-6xl font-bold mb-4 ${gameData?.winner === myRole ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {gameData?.winner === myRole ? 'YOU WIN!! 🎉' : 'YOU LOSE... 💀'}
                  </h1>
                  <button onClick={() => {setRoomId(""); setIsHost(false); setGameData(null); setView('menu');}} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition">タイトルに戻る</button>
              </div>
          )}
      </ErrorBoundary>
  );
}