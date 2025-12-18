import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CARD_DATABASE, MANA_COIN } from '../data/cards';

const appId = 'my-card-game'; 

export const useGameSync = (roomId, userId, myRole) => {
    const [gameData, setGameData] = useState(null);
    const [lastDataUpdate, setLastDataUpdate] = useState(Date.now());
    const [isConnectionUnstable, setIsConnectionUnstable] = useState(false);
    const [notification, setNotification] = useState(null);
    const [attackingState, setAttackingState] = useState(null);
    
    const prevLastActionRef = useRef("");
    const prevAttackTimestampRef = useRef(0);

    const getRoomRef = (rId) => doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${rId}`);

    // 通信不安定チェック
    useEffect(() => {
        if (!gameData) return;
        const timer = setInterval(() => {
            if (Date.now() - lastDataUpdate > 30000) setIsConnectionUnstable(true);
        }, 5000);
        return () => clearInterval(timer);
    }, [gameData, lastDataUpdate]);

    // 再接続・タブ復帰時の同期
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
                } catch (e) { console.error("Re-sync failed:", e); }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [roomId]);

    // メイン同期リスナー
    useEffect(() => {
        if (!roomId || !userId) return; 
        const roomRef = getRoomRef(roomId);
        
        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setGameData(data);
                setLastDataUpdate(Date.now());
                setIsConnectionUnstable(false);

                // 通知処理 (カードプレイログ)
                if (data.lastAction && data.lastAction !== prevLastActionRef.current) {
                    const match = data.lastAction.match(/^(Host|Guest)が (.+) をプレイ！/);
                    if (match) {
                        const actorName = match[1];
                        const cardName = match[2];
                        const playedCard = CARD_DATABASE.find(c => c.name === cardName) || (cardName === MANA_COIN.name ? MANA_COIN : null);
                        
                        // 自分以外のプレイ、または演出用
                        // ここでは「誰がプレイしたか」で左右を出し分ける判定が必要
                        // myRole (host/guest) と actorName (Host/Guest) を比較
                        const isEnemyAction = (myRole === 'host' && actorName === 'Guest') || (myRole === 'guest' && actorName === 'Host');
                        
                        if (playedCard) {
                            setNotification({ 
                                card: playedCard, 
                                side: isEnemyAction ? 'right' : 'left', // 敵なら右、自分なら左から
                                key: Date.now() 
                            });
                            setTimeout(() => setNotification(null), 1500);
                        }
                    }
                    prevLastActionRef.current = data.lastAction;
                }

                // 攻撃アニメーション同期
                if (data.latestAttack && 
                    data.latestAttack.timestamp > prevAttackTimestampRef.current && 
                    data.latestAttack.attackerRole !== myRole) { 
                    
                    const { sourceUid, targetType, targetUid } = data.latestAttack;
                    
                    // DOM要素を探す
                    const attackerEl = document.getElementById(`unit-${sourceUid}`);
                    let targetEl = targetType === 'unit' ? document.getElementById(`unit-${targetUid}`) : document.getElementById('my-face');
                    if (!targetEl && targetType === 'unit') targetEl = document.getElementById('my-face'); // ターゲット不在時のフォールバック

                    if (attackerEl && targetEl) {
                        const atkRect = attackerEl.getBoundingClientRect();
                        const tgtRect = targetEl.getBoundingClientRect();
                        
                        setAttackingState({ 
                            uid: sourceUid, 
                            x: (tgtRect.left + tgtRect.width/2) - (atkRect.left + atkRect.width/2), 
                            y: (tgtRect.top + tgtRect.height/2) - (atkRect.top + atkRect.height/2) 
                        });
                        
                        setTimeout(() => { 
                            setAttackingState(null); 
                        }, 600);
                    }
                    prevAttackTimestampRef.current = data.latestAttack.timestamp;
                }
            }
        });
        return () => unsubscribe();
    }, [roomId, userId, myRole]); // myRoleが変わることはほぼないが依存配列へ

    return {
        gameData,
        setGameData, // 手動リセット用などに返す
        isConnectionUnstable,
        notification,
        attackingState,
        setAttackingState // 自分の攻撃時にセット用
    };
};