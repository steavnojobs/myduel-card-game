import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; 
import { MAX_BOARD_SIZE, MAX_MANA_LIMIT, EFFECT_DELAY, INITIAL_MANA } from '../data/rules';
import { processEffect, handleDraw, createUnit, applyDamage } from '../utils/gameLogic';
import { generateId, shuffleDeck, getCard } from '../utils/helpers'; 

const appId = 'my-card-game'; 

const isManualTargetEffect = (e) => {
    if (!e || !e.type) return false;
    const manualTypes = ['damage', 'heal', 'destroy', 'silence_unit', 'freeze_enemy', 'return_to_hand', 'execute_damaged', 'chain_lightning', 'double_stats', 'heal_unit_full'];
    return manualTypes.includes(e.type) && ['unit', 'enemy_unit', 'ally_unit', 'all_enemy', 'any', 'select'].includes(e.target);
};

const getRequiredTargetType = (effect) => {
    if (!effect) return null;
    if (Array.isArray(effect)) { const targetedEffect = effect.find(e => isManualTargetEffect(e)); return targetedEffect ? targetedEffect.target : null; }
    return isManualTargetEffect(effect) ? effect.target : null;
};

const isValidTarget = (unit, targetType, myRole) => {
    if (!unit) return false;
    if (unit.type === 'building') return false;
    if (targetType === 'enemy_unit' || targetType === 'all_enemy') { return unit.owner !== myRole && !unit.stealth; }
    if (targetType === 'ally_unit') { return unit.owner === myRole; }
    if (targetType === 'unit' || targetType === 'any' || targetType === 'select') { return unit.owner === myRole || !unit.stealth; }
    return false;
};

export const useGameActions = ({
    gameData, myRole, enemyRole, isMyTurn, roomId, isPhaseLocked, 
    targetingHandCard, setTargetingHandCard, setAttackingState, isHost 
}) => {

    const getRoomRef = (rId) => doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${rId}`);

    const submitMulligan = async (exchangeUids) => {
        if (!gameData || !roomId) return;
        const roomRef = getRoomRef(roomId);
        const me = gameData[myRole];
        let newHand = [...me.hand];
        let newDeck = [...me.deck];
        const cardsToReturn = [];
        newHand = newHand.filter(card => {
            if (exchangeUids.includes(card.uid)) {
                cardsToReturn.push(card);
                return false;
            }
            return true;
        });
        const idsToReturn = cardsToReturn.map(c => c.id).filter(id => id !== undefined);
        newDeck = [...newDeck, ...idsToReturn];
        newDeck = shuffleDeck(newDeck);
        const drawCount = cardsToReturn.length;
        if (drawCount > 0) {
            const drawnIds = newDeck.splice(0, drawCount);
            const drawnCards = drawnIds.map(id => ({ ...getCard(id), id: id, uid: generateId() }));
            newHand = [...newHand, ...drawnCards];
        }
        let updates = {};
        updates[`${myRole}.hand`] = newHand;
        updates[`${myRole}.deck`] = newDeck;
        updates[`${myRole}.mulliganDone`] = true;
        await updateDoc(roomRef, updates);
    };

    const initiatePlayCard = (card) => {
        if (!gameData || !isMyTurn || gameData.turnPhase !== 'main') return;
        const me = gameData[myRole]; const enemy = gameData[enemyRole];
        if (me.mana < card.cost) return;
        if (card.type !== 'spell' && me.board.length >= MAX_BOARD_SIZE) return;
        const targetType = getRequiredTargetType(card.onPlay);
        if (targetType) {
            let canSkip = false; const allUnits = [...me.board, ...enemy.board];
            if (targetType === 'enemy_unit') { const validTargets = enemy.board.filter(u => u.type !== 'building' && !u.stealth); if (validTargets.length === 0) canSkip = true; } 
            else if (targetType === 'ally_unit') { const validTargets = me.board.filter(u => u.type !== 'building'); if (validTargets.length === 0) canSkip = true; }
            else if (targetType === 'unit') { const validTargets = allUnits.filter(u => isValidTarget(u, 'unit', myRole)); if (validTargets.length === 0) canSkip = true; }
            if (canSkip) { commitPlayCard(card, null); return; }
            const mode = targetType === 'select' ? 'any' : targetType;
            setTargetingHandCard({ card: card, mode: mode }); 
        } else { commitPlayCard(card, null); }
    };

    const commitPlayCard = async (card, targetUid) => {
        setTargetingHandCard(null); const me = gameData[myRole]; const enemy = gameData[enemyRole]; const roomRef = getRoomRef(roomId); let updates = {};
        updates[`${myRole}.mana`] = me.mana - card.cost;
        const cardIndex = me.hand.findIndex(c => c.uid === card.uid); let newHand = [...me.hand]; if (cardIndex > -1) newHand.splice(cardIndex, 1); updates[`${myRole}.hand`] = newHand;
        let effectLog = "";
        if (card.type === 'spell') { effectLog = processEffect(card.onPlay, me, enemy, updates, myRole, enemyRole, gameData, null, targetUid) || ""; } 
        else {
            const playedCard = createUnit(card.id, myRole); if (card.currentHp) playedCard.currentHp = card.currentHp; if (card.haste) playedCard.canAttack = true;
            updates[`${myRole}.board`] = [...me.board, playedCard];
            if (card.onPlay) effectLog = processEffect(card.onPlay, me, enemy, updates, myRole, enemyRole, gameData, playedCard.uid, targetUid);
        }
        
        // --- ★修正: 死亡判定＆墓地送り ---
        const checkDeath = (board, prefix, enemyPrefix) => {
            if (!board) return; 
            let deadUnits = [], aliveUnits = []; 
            board.forEach(u => { 
                if (u.currentHp <= 0) deadUnits.push(u); 
                else aliveUnits.push(u); 
            }); 
            
            if (deadUnits.length > 0) {
                updates[`${prefix}.board`] = aliveUnits;
                // 墓地へ送る
                const currentGraveyard = updates[`${prefix}.graveyard`] || gameData[prefix].graveyard || [];
                updates[`${prefix}.graveyard`] = [...currentGraveyard, ...deadUnits];

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

        const enemyHp = updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp; const myHp = updates[`${myRole}.hp`] !== undefined ? updates[`${myRole}.hp`] : me.hp;
        if (enemyHp <= 0 || myHp <= 0) { updates.status = 'finished'; updates.winner = enemyHp <= 0 ? myRole : enemyRole; }
        updates.lastAction = `${myRole === 'host' ? 'Host' : 'Guest'}が ${card.name} をプレイ！ ${effectLog || ''}`; await updateDoc(roomRef, updates);
    };

    const handleTargetSelection = (clickedType, targetUid) => {
        if (isPhaseLocked) return;
        if (targetingHandCard) {
            const { card, mode } = targetingHandCard;
            if (clickedType === 'face') { if (mode === 'unit' || mode === 'enemy_unit' || mode === 'ally_unit') return; }
            if (clickedType === 'unit' && targetUid) {
                const enemy = gameData[enemyRole]; const me = gameData[myRole]; const target = [...enemy.board, ...me.board].find(u => u.uid === targetUid);
                if (target) {
                    if (!isValidTarget(target, mode, myRole)) { console.warn("⚠️ 選択できないターゲットです！"); return; }
                    const effectType = Array.isArray(card.onPlay) ? card.onPlay[0].type : card.onPlay?.type;
                    if (effectType === 'execute_damaged') { if (target.currentHp >= target.maxHp) { console.warn("⚠️ 無傷のユニットは対象にできません！"); return; } }
                }
            }
            commitPlayCard(card, targetUid); 
        } 
    };

    const attack = async (targetType, targetUid = null, attackerUid = null) => {
        if (isPhaseLocked) return;
        if (!gameData || !isMyTurn || gameData.turnPhase !== 'main') return;
        const me = gameData[myRole]; const enemy = gameData[enemyRole];
        const attacker = me.board.find(u => u.uid === attackerUid); if (!attacker || !attacker.canAttack || attacker.type === 'building') return;
        if (targetType === 'unit') {
            const targetUnit = enemy.board.find(u => u.uid === targetUid); if (!targetUnit) return;
            if (targetUnit.elusive && !attacker.elusive) return;
        }
        const tauntUnits = enemy.board.filter(u => u.taunt && u.currentHp > 0 && !u.stealth && !u.elusive);
        if (tauntUnits.length > 0) { if (targetType === 'face') return; if (targetType === 'unit') { const targetUnit = enemy.board.find(u => u.uid === targetUid); if (!targetUnit.taunt) return; } }
        const attackerEl = document.getElementById(`unit-${attacker.uid}`); let targetEl = targetType === 'unit' ? document.getElementById(`unit-${targetUid}`) : document.getElementById('enemy-face');
        if (attackerEl && targetEl) {
            const atkRect = attackerEl.getBoundingClientRect(); const tgtRect = targetEl.getBoundingClientRect();
            setAttackingState({ uid: attacker.uid, x: (tgtRect.left+tgtRect.width/2)-(atkRect.left+atkRect.width/2), y: (tgtRect.top+tgtRect.height/2)-(atkRect.top+atkRect.height/2) });
            await new Promise(resolve => setTimeout(resolve, 600)); setAttackingState(null);
        }
        const roomRef = getRoomRef(roomId); let updates = {}; let actionLog = "", effectLog = ""; updates.latestAttack = { sourceUid: attacker.uid, targetType: targetType, targetUid: targetUid, attackerRole: myRole, timestamp: Date.now() };
        if (attacker.onAttack) { const log = processEffect(attacker.onAttack, me, enemy, updates, myRole, enemyRole, gameData, attacker.uid); if (log) effectLog += " " + log; }
        const currentAttacker = (updates[`${myRole}.board`] || me.board).find(u => u.uid === attacker.uid) || attacker; const damage = currentAttacker.attack;
        if (targetType === 'face') {
            const currentEnemyHp = (updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp); const newEnemyHp = Math.max(0, currentEnemyHp - damage); actionLog = `💥 ${attacker.name} がプレイヤーに ${damage} ダメージ！`; updates[`${enemyRole}.hp`] = newEnemyHp;
        } else if (targetType === 'unit') {
            const target = enemy.board.find(u => u.uid === targetUid); if (!target) return;
            let processedTarget = applyDamage(target, damage); if (attacker.bane && damage >= 0) { processedTarget.currentHp = 0; }
            if (processedTarget.wasShielded) { actionLog = `🛡 ${target.name}の聖なる盾が攻撃を防いだ！`; delete processedTarget.wasShielded; } else { actionLog = `⚔️ ${attacker.name} vs ${target.name}`; }
            let processedAttacker = currentAttacker; if ((target.attack > 0 || target.bane) && !target.type.includes('building')) { processedAttacker = applyDamage(currentAttacker, target.attack); if (target.bane) { processedAttacker.currentHp = 0; } if (processedAttacker.wasShielded) delete processedAttacker.wasShielded; }
            let finalEnemyBoard = updates[`${enemyRole}.board`] || enemy.board; let finalMyBoard = updates[`${myRole}.board`] || me.board;
            updates[`${enemyRole}.board`] = finalEnemyBoard.map(u => u.uid === target.uid ? processedTarget : u); updates[`${myRole}.board`] = finalMyBoard.map(u => u.uid === attacker.uid ? processedAttacker : u);
        }
        
        // --- ★修正: 死亡判定＆墓地送り (攻撃時) ---
        const handleDeath = (board, prefix, oppPrefix) => {
            let dead = [], alive = [];
            board.forEach(u => { if (u.currentHp <= 0) dead.push(u); else alive.push(u); });
            
            if (dead.length > 0) {
                updates[`${prefix}.board`] = alive;
                // 墓地へ
                const currentGraveyard = updates[`${prefix}.graveyard`] || gameData[prefix].graveyard || [];
                updates[`${prefix}.graveyard`] = [...currentGraveyard, ...dead];

                dead.forEach(d => { 
                    if (d.onDeath && !d.status?.includes('silenced')) { 
                        const log = processEffect(d.onDeath, gameData[prefix], gameData[oppPrefix], updates, prefix, oppPrefix, gameData, d.uid); 
                        if (log) effectLog += " " + log; 
                    } 
                });
            }
        };
        if (updates[`${enemyRole}.board`]) handleDeath(updates[`${enemyRole}.board`], enemyRole, myRole); 
        if (updates[`${myRole}.board`]) handleDeath(updates[`${myRole}.board`], myRole, enemyRole);

        const finalMyBoard = updates[`${myRole}.board`] || me.board; updates[`${myRole}.board`] = finalMyBoard.map(u => { if (u.uid === attacker.uid) { const newAttackCount = (u.attackCount || 0) + 1; const canAttackAgain = u.doubleAttack ? newAttackCount < 2 : false; return { ...u, canAttack: canAttackAgain, attackCount: newAttackCount }; } return u; });
        const enemyHp = updates[`${enemyRole}.hp`] !== undefined ? updates[`${enemyRole}.hp`] : enemy.hp; const myHp = updates[`${myRole}.hp`] !== undefined ? updates[`${myRole}.hp`] : me.hp;
        if (enemyHp <= 0 || myHp <= 0) { updates.status = 'finished'; updates.winner = enemyHp <= 0 ? myRole : enemyRole; } updates.lastAction = actionLog + effectLog; await updateDoc(roomRef, updates);
    };

    const endTurn = async () => {
        if (isPhaseLocked) return;
        if (!gameData || !isMyTurn) return;
        const roomRef = getRoomRef(roomId);
        await updateDoc(roomRef, { turnPhase: 'end_effect' });
    };

    const resolveStartPhase = async (choice) => {
        if (isPhaseLocked) return;
        if (!gameData || !isMyTurn || gameData.turnPhase !== 'strategy') return;
        const roomRef = getRoomRef(roomId);
        const me = gameData[myRole];
        let updates = {};
        let choiceLog = "";
        const currentMaxMana = me.maxMana || 0; let newMaxMana = currentMaxMana;
        if (choice === 'mana') { newMaxMana = Math.min(currentMaxMana + 1, MAX_MANA_LIMIT); choiceLog = "マナチャージを選択！"; updates[`${myRole}.mana`] = newMaxMana; } else if (choice === 'draw') { updates[`${myRole}.mana`] = newMaxMana; const extraDraw = handleDraw([...me.deck], [...me.hand], me.board, updates, myRole, gameData); updates[`${myRole}.deck`] = extraDraw.deck; updates[`${myRole}.hand`] = extraDraw.hand; choiceLog = "追加ドローを選択！"; }
        updates[`${myRole}.maxMana`] = newMaxMana; updates.turnPhase = 'draw_phase'; updates.lastAction = choiceLog; await updateDoc(roomRef, updates);
    };

    const handleSurrender = async () => {
        if (!roomId || !gameData) return;
        const roomRef = getRoomRef(roomId);
        await updateDoc(roomRef, { status: 'finished', winner: enemyRole, lastAction: `${myRole === 'host' ? 'Host' : 'Guest'}が降参しました🏳️` });
    };

    return {
        initiatePlayCard, commitPlayCard, handleTargetSelection, attack, endTurn, resolveStartPhase, handleSurrender, submitMulligan
    };
};