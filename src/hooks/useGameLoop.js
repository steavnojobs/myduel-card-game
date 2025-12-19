import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { processEffect, handleDraw } from '../utils/gameLogic';
import { EFFECT_DELAY } from '../data/rules';
import { MANA_COIN } from '../data/cards'; // ★追加: マナコイン
import { generateId } from '../utils/helpers'; // ★追加: ID生成

const appId = 'my-card-game'; 

export const useGameLoop = (gameData, roomId, myRole, enemyRole, isMyTurn) => {
    const isProcessingTurnEnd = useRef(false);
    const isProcessingPhase = useRef(false); // ★追加: フェイズ重複実行防止

    // -------------------------------------------------------
    // ★1. ゲーム開始前の進行 (Hostのみが管理)
    // coin_toss -> mulligan -> start_effect
    // -------------------------------------------------------
    useEffect(() => {
        // Hostじゃなければ何もしない（Hostが進行役）
        if (!gameData || !roomId || myRole !== 'host') return;

        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${roomId}`);

        const proceedPreGame = async () => {
            if (isProcessingPhase.current) return;

            // ▼ コイントス演出 (3秒後にマリガンへ)
            if (gameData.turnPhase === 'coin_toss') {
                isProcessingPhase.current = true;
                console.log("🪙 Coin Toss Phase...");
                setTimeout(async () => {
                    await updateDoc(roomRef, { turnPhase: 'mulligan' });
                    isProcessingPhase.current = false;
                }, 3000);
            }
            // ▼ マリガン待機 (両者が完了したらゲーム開始へ)
            else if (gameData.turnPhase === 'mulligan') {
                const hostDone = gameData.host?.mulliganDone;
                const guestDone = gameData.guest?.mulliganDone;

                if (hostDone && guestDone) {
                    isProcessingPhase.current = true;
                    
                    // ゲーム開始処理: 後攻にコインを渡す
                    // ※ createRoomで決めた currentTurn が先行プレイヤー
                    const secondPlayerRole = gameData.currentTurn === 'host' ? 'guest' : 'host';
                    const secondPlayerHand = [...gameData[secondPlayerRole].hand];
                    
                    secondPlayerHand.push({ ...MANA_COIN, uid: generateId() });
                    
                    let updates = {};
                    updates[`${secondPlayerRole}.hand`] = secondPlayerHand;
                    updates.turnPhase = 'start_effect'; // 最初のターン開始！
                    updates.lastAction = "ゲーム開始！";

                    console.log("🎮 Game Start! Giving Coin to", secondPlayerRole);
                    await updateDoc(roomRef, updates);
                    isProcessingPhase.current = false;
                }
            }
        };
        proceedPreGame();
    }, [gameData, roomId, myRole]);


    // -------------------------------------------------------
    // ★2. ターン中の進行 (ターン主のみが管理)
    // start_effect -> strategy -> draw -> main -> end_effect
    // -------------------------------------------------------
    useEffect(() => {
        if (!gameData || !isMyTurn || !roomId) return;

        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${roomId}`);

        const proceedPhase = async () => {
            let updates = {};
            const me = gameData[myRole];
            const enemy = gameData[enemyRole];

            // --- エンドフェイズ (ターン終了時効果) ---
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

                    // 自分の死体処理
                    const deadMyUnits = currentMyBoard.filter(u => u.currentHp <= 0);
                    deadMyUnits.forEach(d => {
                        if (d.onDeath && !d.status?.includes('silenced')) {
                            deathLog += ` 💀${d.name}効果`;
                            const log = processEffect(d.onDeath, me, enemy, finalUpdates, myRole, enemyRole, gameData, d.uid);
                            if (log) deathLog += " " + log;
                        }
                    });

                    // 敵の死体処理
                    const deadEnemyUnits = currentEnemyBoard.filter(u => u.currentHp <= 0);
                    deadEnemyUnits.forEach(d => {
                        if (d.onDeath && !d.status?.includes('silenced')) {
                            deathLog += ` 💀${d.name}効果`;
                            const log = processEffect(d.onDeath, enemy, me, finalUpdates, enemyRole, myRole, gameData, d.uid);
                            if (log) deathLog += " " + log;
                        }
                    });

                    // 死体を取り除く
                    const afterDeathMyBoard = finalUpdates[`${myRole}.board`];
                    const afterDeathEnemyBoard = finalUpdates[`${enemyRole}.board`];

                    const cleanMyBoard = afterDeathMyBoard.filter(u => u.currentHp > 0);
                    const cleanEnemyBoard = afterDeathEnemyBoard.filter(u => u.currentHp > 0);

                    finalUpdates[`${myRole}.board`] = cleanMyBoard;
                    finalUpdates[`${enemyRole}.board`] = cleanEnemyBoard;

                    // 攻撃権のリセット
                    finalUpdates[`${myRole}.board`] = cleanMyBoard.map(u => ({ ...u, canAttack: true }));

                    finalUpdates.turnPhase = 'switching';
                    
                    if (deathLog) {
                        finalUpdates.lastAction = (updates.lastAction || "") + deathLog;
                    }
                    
                    console.log("🧹 Cleaning up dead units and switching turn...");
                    await updateDoc(roomRef, finalUpdates);
                    
                    isProcessingTurnEnd.current = false;

                }, delay);

            } 
            // --- 交代フェイズ ---
            else if (gameData.turnPhase === 'switching'){
                updates.currentTurn = enemyRole; 
                updates.turnPhase = 'start_effect';
                updates.turnCount = gameData.turnCount + 1;
                await updateDoc(roomRef, updates);
            } 
            // --- スタートフェイズ (ターン開始時効果) ---
            else if (gameData.turnPhase === 'start_effect') {
                // 建物の耐久減少など
                const processedBoard = me.board.map(card => {
                    if (card.type === 'building') return { ...card, currentHp: card.currentHp - 1 };
                    return card;
                }).filter(u => u.currentHp > 0);

                updates[`${myRole}.board`] = processedBoard.map(u => {
                    let newStatus = u.status || [];
                    let canAttack = true;
                    // 凍結解除
                    if (newStatus.includes('frozen')) {
                        newStatus = newStatus.filter(s => s !== 'frozen');
                        canAttack = false; 
                    }
                    return { ...u, canAttack: canAttack, attackCount: 0, status: newStatus };
                });

                // 開始時効果発動
                me.board.forEach(card => {
                    if (card.turnStart) {
                        processEffect(card.turnStart, me, enemy, updates, myRole, enemyRole, gameData, card.uid);
                    }
                });

                // 死体掃除 (start_effect用)
                const currentMyBoard = updates[`${myRole}.board`];
                const currentEnemyBoard = updates[`${enemyRole}.board`] || enemy.board; 
                
                if (currentMyBoard) updates[`${myRole}.board`] = currentMyBoard.filter(u => u.currentHp > 0);
                if (currentEnemyBoard) updates[`${enemyRole}.board`] = currentEnemyBoard.filter(u => u.currentHp > 0);

                updates.turnPhase = 'strategy';
                await updateDoc(roomRef, updates);
            } 
            // --- ドローフェイズ ---
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