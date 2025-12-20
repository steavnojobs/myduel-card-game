import { getCard, generateId, shuffleDeck } from './helpers'; 
import { MAX_BOARD_SIZE } from '../data/rules';

export const createUnit = (cardId, ownerPrefix) => {
    const cardData = getCard(cardId);
    if (!cardData) return null;
    return {
        ...cardData,
        uid: generateId(),
        currentHp: cardData.health,
        maxHp: cardData.health,
        canAttack: !!cardData.haste, 
        attackCount: 0, 
        divineShield: !!cardData.divineShield,
        stealth: !!cardData.stealth, 
        elusive: !!cardData.elusive, 
        owner: ownerPrefix,
        status: [] 
    };
};

export const applyDamage = (unit, amount) => {
    if (amount <= 0) return unit; 
    if (unit.divineShield) {
        return { ...unit, divineShield: false, wasShielded: true }; 
    } else {
        const newHp = Math.max(0, unit.currentHp - amount);
        return { ...unit, currentHp: newHp };
    }
};

const resolveTarget = (targetUid, me, enemy, updates, rolePrefix, enemyPrefix, mode = 'any') => {
    const currentEnemyBoard = updates[`${enemyPrefix}.board`] || enemy.board;
    const currentMeBoard = updates[`${rolePrefix}.board`] || me.board;
    let targetUnit = null;
    let targetBoard = null;
    let updateKey = null; 
    let isEnemy = false;

    if (targetUid) {
        targetUnit = currentEnemyBoard.find(u => u.uid === targetUid);
        if (targetUnit) { targetBoard = currentEnemyBoard; updateKey = `${enemyPrefix}.board`; isEnemy = true; } 
        else { targetUnit = currentMeBoard.find(u => u.uid === targetUid); if (targetUnit) { targetBoard = currentMeBoard; updateKey = `${rolePrefix}.board`; } }
    } else {
        let candidates = [];
        let pickFromEnemy = false; let pickFromAlly = false;
        if (mode === 'enemy_unit' || mode === 'all_enemy') { candidates = currentEnemyBoard; pickFromEnemy = true; } 
        else if (mode === 'ally_unit') { candidates = currentMeBoard; pickFromAlly = true; } 
        else { candidates = [...currentEnemyBoard, ...currentMeBoard]; }
        const validTargets = candidates.filter(u => u.type !== 'building');
        if (validTargets.length > 0) {
            const idx = Math.floor(Math.random() * validTargets.length);
            targetUnit = validTargets[idx];
            if (pickFromEnemy) { targetBoard = currentEnemyBoard; updateKey = `${enemyPrefix}.board`; } 
            else if (pickFromAlly) { targetBoard = currentMeBoard; updateKey = `${rolePrefix}.board`; } 
            else {
                if (currentEnemyBoard.some(u => u.uid === targetUnit.uid)) { targetBoard = currentEnemyBoard; updateKey = `${enemyPrefix}.board`; } 
                else { targetBoard = currentMeBoard; updateKey = `${rolePrefix}.board`; }
            }
        }
    }
    return { targetUnit, targetBoard, updateKey, isEnemy };
};

export const handleDraw = (deck, hand, board, updates, role, gameData) => {
    if (deck.length === 0) return { deck, hand }; 
    const cardId = deck.shift();
    const newCard = { ...getCard(cardId), id: cardId, uid: generateId() };
    if (hand.length < 10) { hand.push(newCard); } 
    else { console.log("Hand is full! Card burned:", newCard.name); return { deck, hand }; }

    if (board && Array.isArray(board)) {
        board.forEach(unit => {
            if (unit.onDrawTrigger) {
                processEffect(unit.onDrawTrigger, gameData[role], gameData[role === 'host' ? 'guest' : 'host'], updates, role, role === 'host' ? 'guest' : 'host', gameData, unit.uid);
            }
        });
    }
    return { deck, hand };
};

export const processEffect = (effect, me, enemy, updates, rolePrefix, enemyPrefix, latestGameData, sourceUnitUid = null, targetUnitUid = null) => {
    if (!effect || !me || !enemy || !latestGameData) return "";
    if (Array.isArray(effect)) {
        let combinedLog = "";
        effect.forEach(singleEffect => { combinedLog += processEffect(singleEffect, me, enemy, updates, rolePrefix, enemyPrefix, latestGameData, sourceUnitUid, targetUnitUid) + "\n"; });
        return combinedLog;
    }

    let logMsg = "";
    const currentEnemyBoard = updates[`${enemyPrefix}.board`] || enemy.board;
    const currentMeBoard = updates[`${rolePrefix}.board`] || me.board;

    switch(effect.type) {
        // --- ★追加: 蘇生効果 ---
        case 'resurrect': {
            // 現在の墓地を取得 (updatesにあればそれを、なければ現在のデータから)
            const currentGraveyard = updates[`${rolePrefix}.graveyard`] || me.graveyard || [];
            
            if (currentGraveyard.length === 0) {
                logMsg = "⚠️ 墓地にユニットがいません！";
                break;
            }

            // 指定コスト以下で検索 (x以下の最大コストを探す)
            let maxCost = effect.value; // x以下
            let targetCard = null;

            // コストを下げながら探索
            for (let cost = maxCost; cost >= 0; cost--) {
                // そのコストのユニットのみ抽出 (建物は除外？今回はunit全て対象と仮定)
                const candidates = currentGraveyard.filter(c => c.cost === cost && c.type === 'unit');
                
                if (candidates.length > 0) {
                    // ランダムに1つ選ぶ
                    targetCard = candidates[Math.floor(Math.random() * candidates.length)];
                    break; // 見つかったら終了
                }
            }

            if (targetCard) {
                if (currentMeBoard.length < MAX_BOARD_SIZE) {
                    // 墓地から削除せず、コピーを作成して場に出す
                    const resurrectedUnit = createUnit(targetCard.id, rolePrefix);
                    if (resurrectedUnit) {
                        updates[`${rolePrefix}.board`] = [...currentMeBoard, resurrectedUnit];
                        logMsg = `♻️ ${resurrectedUnit.name}を蘇生！`;
                    }
                } else {
                    logMsg = "⚠️ 盤面がいっぱいで蘇生できません！";
                }
            } else {
                logMsg = `⚠️ 蘇生対象(コスト${maxCost}以下)がいません！`;
            }
            break;
        }

        case 'damage': 
        case 'damage_random': {
            const { targetUnit, targetBoard, updateKey } = resolveTarget(effect.type === 'damage' ? targetUnitUid : null, me, enemy, updates, rolePrefix, enemyPrefix, effect.target || 'enemy_unit');
            if (targetUnit) {
                if (targetUnit.type === 'building') { logMsg = `⚠️ ${targetUnit.name}は建物なので効果ダメージを受けない！`; } 
                else {
                    const processedUnit = applyDamage(targetUnit, effect.value);
                    if (processedUnit.wasShielded) { delete processedUnit.wasShielded; logMsg = `🛡 ${processedUnit.name}の聖なる盾がダメージを防いだ！`; } 
                    else { logMsg = `💥 ${processedUnit.name}に${effect.value}ダメージ！`; }
                    updates[updateKey] = targetBoard.map(u => u.uid === targetUnit.uid ? processedUnit : u);
                }
            } else {
                if (effect.type === 'damage_random') logMsg = `⚠️ ダメージ対象がいません！`;
                else {
                    const currentHp = updates[`${enemyPrefix}.hp`] !== undefined ? updates[`${enemyPrefix}.hp`] : enemy.hp;
                    updates[`${enemyPrefix}.hp`] = Math.max(0, currentHp - effect.value);
                    logMsg = `🏹 敵リーダーに${effect.value}ダメージ！`;
                }
            }
            break;
        }
        case 'damage_all': {
            const dealDamageToBoard = (board) => board.map(unit => { if (unit.type === 'building') return unit; return applyDamage(unit, effect.value); });
            let targetScope = effect.target || 'enemy_unit';
            if (targetScope === 'enemy_unit' || targetScope === 'all_unit' || targetScope === 'all_enemy') { updates[`${enemyPrefix}.board`] = dealDamageToBoard(currentEnemyBoard); }
            if (targetScope === 'ally_unit' || targetScope === 'all_unit' || targetScope === 'all_ally') { updates[`${rolePrefix}.board`] = dealDamageToBoard(currentMeBoard); }
            const targetName = targetScope.includes('all') ? "全員" : (targetScope.includes('enemy') ? "敵全体" : "味方全体");
            logMsg = `🌪 ${targetName}(建物以外)に${effect.value}ダメージ！`;
            break;
        }
        case 'damage_self': {
             const myHp = updates[`${rolePrefix}.hp`] !== undefined ? updates[`${rolePrefix}.hp`] : me.hp;
             updates[`${rolePrefix}.hp`] = Math.max(0, myHp - effect.value);
             logMsg = `🩸 自分に${effect.value}ダメージ！`;
             break;
        }
        case 'damage_face': {
            const hp = updates[`${enemyPrefix}.hp`] !== undefined ? updates[`${enemyPrefix}.hp`] : enemy.hp;
            const val = effect.target === 'face' ? effect.value : effect.value;
            updates[`${enemyPrefix}.hp`] = Math.max(0, hp - val);
            logMsg = `🏹 敵リーダーに${effect.value}ダメージ！`;
            break;
        }
        case 'damage_all_other': {
            if (!sourceUnitUid) break;
            const newMeBoard = currentMeBoard.map(u => { if (u.uid === sourceUnitUid || u.type === 'building') return u; return applyDamage(u, effect.value); });
            const newEnemyBoard = currentEnemyBoard.map(u => { if (u.type === 'building') return u; return applyDamage(u, effect.value); });
            updates[`${rolePrefix}.board`] = newMeBoard; updates[`${enemyPrefix}.board`] = newEnemyBoard;
            logMsg = `🔥 周囲全て(建物以外)に${effect.value}ダメージ！`;
            break;
        }
        case 'execute_damaged': {
            const { targetUnit, targetBoard, updateKey } = resolveTarget(targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, effect.target);
            if (targetUnit) {
                if (targetUnit.type === 'building') logMsg = `⚠️ 建物は処刑できません！`;
                else if (targetUnit.currentHp < targetUnit.maxHp) { updates[updateKey] = targetBoard.map(u => u.uid === targetUnit.uid ? { ...u, currentHp: 0 } : u); logMsg = `💀 ${targetUnit.name}を処刑した！`; } 
                else logMsg = `⚠️ ミス！対象は傷ついていない！`;
            }
            break;
        }
        case 'chain_lightning': {
            const { targetUnit, updateKey } = resolveTarget(targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, effect.target);
            if (targetUnit && updateKey && targetUnit.type !== 'building') { 
                const board = updates[updateKey] || currentEnemyBoard;
                const idx = board.findIndex(u => u.uid === targetUnit.uid);
                if (idx !== -1) {
                    const newBoard = [...board];
                    const mainDmg = effect.primary || effect.value || 0;
                    const subDmg = effect.secondary || 1;
                    newBoard[idx] = applyDamage(newBoard[idx], mainDmg);
                    if (idx > 0 && newBoard[idx-1].type !== 'building') newBoard[idx-1] = applyDamage(newBoard[idx-1], subDmg);
                    if (idx < newBoard.length - 1 && newBoard[idx+1].type !== 'building') newBoard[idx+1] = applyDamage(newBoard[idx+1], subDmg);
                    updates[updateKey] = newBoard;
                    logMsg = `⚡️ 連鎖する稲妻！`;
                }
            } else if (targetUnit?.type === 'building') logMsg = `⚠️ 建物には稲妻は効かない！`;
            break;
        }
        case 'destroy':
        case 'destroy_unit': 
        case 'destroy_random': {
            const { targetUnit, targetBoard, updateKey } = resolveTarget((effect.type === 'destroy_random') ? null : targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, effect.target || 'enemy_unit');
            if (targetUnit) {
                 if (targetUnit.type === 'building') logMsg = `⚠️ 建物は破壊できません！`;
                 else { updates[updateKey] = targetBoard.map(u => u.uid === targetUnit.uid ? { ...u, currentHp: 0 } : u); logMsg = `💀 ${targetUnit.name}を破壊！`; }
            } else { if (effect.type === 'destroy_random') logMsg = `⚠️ 破壊対象がいません！`; }
            break;
        }
        case 'destroy_self': {
            if (sourceUnitUid) {
                const latestMeBoard = updates[`${rolePrefix}.board`] || me.board;
                const targetUnit = latestMeBoard.find(u => u.uid === sourceUnitUid);
                if (targetUnit) { updates[`${rolePrefix}.board`] = latestMeBoard.map(u => u.uid === sourceUnitUid ? { ...u, currentHp: 0 } : u); logMsg = `💀 ${targetUnit.name}は自壊した！`; }
            }
            break;
        }
        case 'destroy_all_units': {
             updates[`${rolePrefix}.board`] = currentMeBoard.map(u => u.type === 'building' ? u : ({ ...u, currentHp: 0 }));
             updates[`${enemyPrefix}.board`] = currentEnemyBoard.map(u => u.type === 'building' ? u : ({ ...u, currentHp: 0 }));
             logMsg = `🌋 全てのユニット(建物以外)が破壊された...`;
             break;
        }
        case 'heal':
        case 'heal_random':
        case 'heal_random_ally': {
            const { targetUnit, targetBoard, updateKey } = resolveTarget((effect.type.includes('random')) ? null : targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, effect.target || 'ally_unit');
            if (targetUnit) {
                const newBoard = targetBoard.map(u => u.uid === targetUnit.uid ? { ...u, currentHp: Math.min(u.currentHp + effect.value, u.maxHp) } : u);
                updates[updateKey] = newBoard;
                logMsg = `✨ ${targetUnit.name}を回復！`;
            } else logMsg = `⚠️ 回復対象がいません！`;
            break;
        }
        case 'heal_face': {
            const currentHp = updates[`${rolePrefix}.hp`] !== undefined ? updates[`${rolePrefix}.hp`] : me.hp;
            updates[`${rolePrefix}.hp`] = currentHp + effect.value;
            logMsg = `💚 HPを${effect.value}回復！`;
            break;
        }
        case 'heal_unit_full': {
             const { targetUnit, targetBoard, updateKey } = resolveTarget(targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, effect.target);
             if (targetUnit) { updates[updateKey] = targetBoard.map(u => u.uid === targetUnit.uid ? { ...u, currentHp: u.maxHp } : u); logMsg = `✨ 完全回復！`; }
             break;
        }
        case 'buff_all_attack': {
            const newBoard = currentMeBoard.map(u => u.type === 'building' ? u : ({ ...u, attack: u.attack + effect.value }));
            updates[`${rolePrefix}.board`] = newBoard;
            logMsg = `⚔️ 全味方攻撃+${effect.value}！`;
            break;
        }
        case 'buff_self_attack': {
             if (sourceUnitUid) {
                 const newBoard = currentMeBoard.map(u => u.uid === sourceUnitUid ? { ...u, attack: u.attack + effect.value } : u);
                 updates[`${rolePrefix}.board`] = newBoard;
                 logMsg = `💪 攻撃力アップ！`;
             }
             break;
        }
        case 'freeze_enemy': {
             const { targetUnit, targetBoard, updateKey } = resolveTarget(targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, 'random_enemy');
             if (targetUnit && targetUnit.type !== 'building') {
                const newBoard = targetBoard.map(u => {
                    if (u.uid === targetUnit.uid) {
                        const newStatus = u.status ? [...u.status] : [];
                        if (!newStatus.includes('frozen')) newStatus.push('frozen');
                        return { ...u, status: newStatus, canAttack: false };
                    }
                    return u;
                });
                updates[updateKey] = newBoard;
                logMsg = `❄️ ${targetUnit.name}を凍結！`;
             }
             break;
        }
        case 'silence_unit': {
             const { targetUnit, targetBoard, updateKey } = resolveTarget(targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, effect.target);
             if (targetUnit) {
                 updates[updateKey] = targetBoard.map(u => {
                     if (u.uid === targetUnit.uid) {
                         return { 
                             ...u, taunt: false, haste: false, stealth: false, divineShield: false, doubleAttack: false,
                             deathrattle: null, onPlay: null, onDeath: null, description: "(沈黙)" 
                         };
                     }
                     return u;
                 });
                 logMsg = `😶 沈黙！`;
             }
             break;
        }
        case 'silence_all_enemy': {
            const stat = effect.conditionStat; 
            const limit = effect.conditionValue;
            const newEnemyBoard = currentEnemyBoard.map(u => {
                if (u.type === 'building') return u; 
                if (stat && limit !== undefined) { if (u[stat] > limit) return u; }
                return { 
                    ...u, taunt: false, haste: false, stealth: false, divineShield: false, doubleAttack: false,
                    deathrattle: null, onPlay: null, onDeath: null, onDrawTrigger: null, description: "(沈黙)" 
                };
            });
            updates[`${enemyPrefix}.board`] = newEnemyBoard;
            logMsg = stat ? `😶 条件を満たす敵を沈黙！` : `😶 敵全体を沈黙！`;
            break;
        }
        case 'return_to_hand': {
            if (targetUnitUid) {
                 const { targetUnit, updateKey } = resolveTarget(targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, effect.target);
                 if (targetUnit && targetUnit.type !== 'building') { 
                     updates[updateKey] = updates[updateKey].filter(u => u.uid !== targetUnit.uid); 
                     let targetHand = updates[`${enemyPrefix}.hand`] || enemy.hand;
                     if (targetHand.length < 10) {
                         targetHand = [...targetHand, { ...getCard(targetUnit.id), uid: generateId() }];
                         updates[`${enemyPrefix}.hand`] = targetHand;
                     }
                     logMsg = `💨 ${targetUnit.name}を手札に戻した！`;
                 }
            }
            else if (sourceUnitUid) {
                 const myself = currentMeBoard.find(u => u.uid === sourceUnitUid);
                 if (myself) {
                     updates[`${rolePrefix}.board`] = currentMeBoard.filter(u => u.uid !== sourceUnitUid);
                     let myHand = updates[`${rolePrefix}.hand`] || me.hand;
                     if (myHand.length < 10) {
                         myHand = [...myHand, { ...getCard(myself.id), uid: generateId() }];
                         updates[`${rolePrefix}.hand`] = myHand;
                     }
                     logMsg = `💨 ${myself.name}が手札に戻った！`;
                 }
            }
            break;
        }
        case 'summon': {
            if (currentMeBoard.length < MAX_BOARD_SIZE) {
                const newUnit = createUnit(effect.value, rolePrefix);
                if (newUnit) { updates[`${rolePrefix}.board`] = [...currentMeBoard, newUnit]; logMsg = `🪄 ${newUnit.name}を召喚！`; }
            } else logMsg = "⚠️ 盤面がいっぱいです！";
            break;
        }
        case 'draw': {
            let tempDeck = [...(updates[`${rolePrefix}.deck`] || me.deck)];
            let tempHand = [...(updates[`${rolePrefix}.hand`] || me.hand)];
            let tempBoard = [...currentMeBoard];
            for(let i=0; i<effect.value; i++) {
                const res = handleDraw(tempDeck, tempHand, tempBoard, updates, rolePrefix, latestGameData);
                tempDeck = res.deck; tempHand = res.hand;
            }
            updates[`${rolePrefix}.deck`] = tempDeck; updates[`${rolePrefix}.hand`] = tempHand;
            logMsg = `📚 ${effect.value}枚ドロー！`;
            break;
        }
        case 'draw_until_match_enemy': {
             const enemyHandCount = (updates[`${enemyPrefix}.hand`] || enemy.hand).length;
             const myHandCount = (updates[`${rolePrefix}.hand`] || me.hand).length;
             const diff = enemyHandCount - myHandCount;
             if (diff > 0) logMsg = processEffect({ type: 'draw', value: diff }, me, enemy, updates, rolePrefix, enemyPrefix, latestGameData);
             break;
        }
        case 'generate_card': {
            let tempHand = [...(updates[`${rolePrefix}.hand`] || me.hand)];
            if (tempHand.length < 10) {
                const newCard = getCard(effect.value || effect.cardId);
                if (newCard) { tempHand.push({ ...newCard, uid: generateId() }); updates[`${rolePrefix}.hand`] = tempHand; logMsg = `🃏 ${newCard.name}を手札に追加！`; }
            }
            break;
        }
        case 'add_mana': {
            const currentMana = updates[`${rolePrefix}.mana`] !== undefined ? updates[`${rolePrefix}.mana`] : me.mana;
            updates[`${rolePrefix}.mana`] = currentMana + effect.value;
            logMsg = `💎 マナ+${effect.value}！`;
            break;
        }
        case 'gain_empty_mana': {
             const currentMax = updates[`${rolePrefix}.maxMana`] !== undefined ? updates[`${rolePrefix}.maxMana`] : me.maxMana;
             updates[`${rolePrefix}.maxMana`] = Math.min(currentMax + effect.value, 10);
             logMsg = `🌱 最大マナ+${effect.value}！`;
             break;
        }
        case 'double_stats': {
            const { targetUnit, targetBoard, updateKey } = resolveTarget(targetUnitUid, me, enemy, updates, rolePrefix, enemyPrefix, effect.target);
            if (targetUnit) {
                updates[updateKey] = targetBoard.map(u => u.uid === targetUnit.uid ? { ...u, attack: u.attack * 2, currentHp: u.currentHp * 2, maxHp: u.maxHp * 2 } : u);
                logMsg = `💪 倍化！`;
            }
            break;
        }
        default: break;
    }
    return logMsg;
};