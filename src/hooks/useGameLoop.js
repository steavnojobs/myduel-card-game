import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { processEffect, handleDraw } from '../utils/gameLogic';
import { EFFECT_DELAY } from '../data/rules';
import { MANA_COIN } from '../data/cards'; // ★追加: マナコイン
import { generateId, getCard } from '../utils/helpers'; // ★追加: getCardも念のため

const appId = 'my-card-game'; 

export const useGameLoop = (gameData, roomId, myRole, enemyRole, isMyTurn) => {
    const isProcessingTurnEnd = useRef(false);
    const isProcessingPhase = useRef(false); 

    // ★ 1. ホスト専用: ゲーム進行管理
    useEffect(() => {
        if (!gameData || !roomId || myRole !== 'host') return;
        
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${roomId}`);

        const proceedPreGame = async () => {
            if (isProcessingPhase.current) return;

            // コイントスは無視
            if (gameData.turnPhase === 'coin_toss') return;

            // マリガン完了チェック
            if (gameData.turnPhase === 'mulligan') {
                if (gameData.host.mulliganDone && gameData.guest.mulliganDone) {
                    console.log("Both players finished mulligan! Distributing Coin & Starting game...");
                    isProcessingPhase.current = true;
                    
                    setTimeout(async () => {
                         // ★ここで後攻プレイヤーにマナコインを配る！
                         const secondPlayer = gameData.currentTurn === 'host' ? 'guest' : 'host';
                         const coinCard = MANA_COIN ? { ...MANA_COIN } : getCard(9001);
                         
                         // 後攻の手札にコインを追加 (ユニークIDを付与)
                         const newHand = [
                             ...gameData[secondPlayer].hand, 
                             { ...coinCard, uid: generateId() }
                         ];

                         await updateDoc(roomRef, { 
                             turnPhase: 'start_effect',
                             [`${secondPlayer}.hand`]: newHand // ★コイン追加！
                         });
                         
                         isProcessingPhase.current = false;
                    }, 1000);
                }
            }
        };
        proceedPreGame();
    }, [gameData, roomId, myRole]); 

    // ★ 2. ターンプレイヤー用: フェーズごとの自動処理
    useEffect(() => {
        if (!gameData || !isMyTurn || !roomId) return;
        
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${roomId}`);

        const proceedPhase = async () => {
            let updates = {};
            const me = gameData[myRole];
            const enemy = gameData[enemyRole];

            // --- ターン終了処理 (End Effect) ---
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
                        if (log) { effectLogs.push(log); hasEffectTriggered = true; }
                    }
                });
                if (effectLogs.length > 0) { updates.lastAction = `ターン終了効果: ${effectLogs.join(" ")}`; }
                
                await updateDoc(roomRef, updates);
                const delay = hasEffectTriggered ? EFFECT_DELAY : 0;

                setTimeout(async () => {
                    const finalUpdates = {}; 
                    const currentMyBoard = updates[`${myRole}.board`] || me.board;
                    const currentEnemyBoard = updates[`${enemyRole}.board`] || enemy.board;
                    let deathLog = "";

                    const deadMyUnits = currentMyBoard.filter(u => u.currentHp <= 0);
                    if (deadMyUnits.length > 0) {
                        const currentGraveyard = gameData[myRole].graveyard || [];
                        finalUpdates[`${myRole}.graveyard`] = [...currentGraveyard, ...deadMyUnits];
                        deadMyUnits.forEach(d => {
                            if (d.onDeath && !d.status?.includes('silenced')) {
                                deathLog += ` 💀${d.name}効果`;
                                const log = processEffect(d.onDeath, me, enemy, finalUpdates, myRole, enemyRole, gameData, d.uid);
                                if (log) deathLog += " " + log;
                            }
                        });
                    }

                    const deadEnemyUnits = currentEnemyBoard.filter(u => u.currentHp <= 0);
                    if (deadEnemyUnits.length > 0) {
                        const currentEnemyGraveyard = gameData[enemyRole].graveyard || [];
                        finalUpdates[`${enemyRole}.graveyard`] = [...currentEnemyGraveyard, ...deadEnemyUnits];
                        deadEnemyUnits.forEach(d => {
                            if (d.onDeath && !d.status?.includes('silenced')) {
                                deathLog += ` 💀${d.name}効果`;
                                const log = processEffect(d.onDeath, enemy, me, finalUpdates, enemyRole, myRole, gameData, d.uid);
                                if (log) deathLog += " " + log;
                            }
                        });
                    }

                    const cleanMyBoard = (finalUpdates[`${myRole}.board`] || currentMyBoard).filter(u => u.currentHp > 0);
                    const cleanEnemyBoard = (finalUpdates[`${enemyRole}.board`] || currentEnemyBoard).filter(u => u.currentHp > 0);
                    
                    finalUpdates[`${myRole}.board`] = cleanMyBoard.map(u => ({ ...u, canAttack: true }));
                    finalUpdates[`${enemyRole}.board`] = cleanEnemyBoard;
                    
                    finalUpdates.turnPhase = 'switching';
                    if (deathLog) { finalUpdates.lastAction = (updates.lastAction || "") + deathLog; }
                    
                    await updateDoc(roomRef, finalUpdates);
                    isProcessingTurnEnd.current = false;
                }, delay);
            } 
            // --- ターン交代 (Switching) ---
            else if (gameData.turnPhase === 'switching'){
                const nextTurn = enemyRole;
                const nextTurnCount = gameData.turnCount + 1;
                
                // ★マナ自動増加(+1)は削除済み（全回復のみ）
                const nextMaxMana = gameData[nextTurn].maxMana; 
                
                updates.currentTurn = nextTurn; 
                updates.turnPhase = 'start_effect';
                updates.turnCount = nextTurnCount;
                updates[`${nextTurn}.maxMana`] = nextMaxMana;
                updates[`${nextTurn}.mana`] = nextMaxMana; 

                await updateDoc(roomRef, updates);
            } 
            // --- ターン開始処理 (Start Effect) ---
            else if (gameData.turnPhase === 'start_effect') {
                const processedBoard = me.board.map(card => {
                    if (card.type === 'building') return { ...card, currentHp: card.currentHp - 1 };
                    return card;
                }).filter(u => u.currentHp > 0);

                updates[`${myRole}.board`] = processedBoard.map(u => {
                    let newStatus = u.status || []; 
                    let canAttack = true; 
                    if (newStatus.includes('frozen')) { 
                        newStatus = newStatus.filter(s => s !== 'frozen'); 
                        canAttack = false;
                    }
                    return { ...u, canAttack: canAttack, attackCount: 0, status: newStatus };
                });

                me.board.forEach(card => { 
                    if (card.turnStart) { 
                        processEffect(card.turnStart, me, enemy, updates, myRole, enemyRole, gameData, card.uid); 
                    } 
                });

                const currentMyBoard = updates[`${myRole}.board`];
                if (currentMyBoard) updates[`${myRole}.board`] = currentMyBoard.filter(u => u.currentHp > 0);

                updates.turnPhase = 'strategy';
                await updateDoc(roomRef, updates);
            } 
            // --- 戦略フェイズ (Strategy Phase) ---
            else if (gameData.turnPhase === 'strategy') {
                console.log("Waiting for strategy selection...");
                return; 
            }
            // --- ドローフェーズ (Draw Phase) ---
            else if (gameData.turnPhase === 'draw_phase') {
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
};