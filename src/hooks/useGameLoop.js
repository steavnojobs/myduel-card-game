import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { processEffect, handleDraw } from '../utils/gameLogic';
import { EFFECT_DELAY } from '../data/rules';

const appId = 'my-card-game'; 

export const useGameLoop = (gameData, roomId, myRole, enemyRole, isMyTurn) => {
    const isProcessingTurnEnd = useRef(false);

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
                    // 死体処理の再取得用
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
                const currentEnemyBoard = updates[`${enemyRole}.board`] || enemy.board; // 敵盤面への影響も考慮
                
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