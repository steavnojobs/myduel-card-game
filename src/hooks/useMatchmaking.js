import { collection, query, where, limit, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { INITIAL_HP, INITIAL_MANA, DECK_SIZE, MAX_COPIES_IN_DECK } from '../data/rules';
import { MANA_COIN } from '../data/cards';
import { generateId, getCard, getDeckSummary, shuffleDeck } from '../utils/helpers';

const appId = 'my-card-game'; 

export const useMatchmaking = (userId, myDeckIds, setRoomId, setIsHost, setView) => {

    const getRoomRef = (rId) => doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${rId}`);

    // デッキバリデーション
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

    // ランダムマッチ
    const startRandomMatch = async () => {
        if (!userId) return; 
        if (myDeckIds.length === 0) return;
        
        const roomsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
        // 待機中の部屋を探す
        const q = query(roomsRef, where("status", "==", "waiting"), limit(10)); 
        
        try {
            const querySnapshot = await getDocs(q); 
            let targetRoomId = null; 
            const EXPIRE_TIME = 15 * 60 * 1000; // 15分
            const now = Date.now();
            
            for (const docSnap of querySnapshot.docs) { 
                const data = docSnap.data(); 
                // 自分以外の部屋で、かつ有効期限内のもの
                if (data.hostId !== userId && data.createdAt && (now - data.createdAt < EXPIRE_TIME)) { 
                    targetRoomId = docSnap.id.replace('room_', ''); 
                    break; 
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

    // 部屋作成
    const createRoom = async () => {
        if (!userId) return; 
        if (myDeckIds.length === 0) return;
        
        const newRoomId = generateId().substring(0, 6).toUpperCase(); 
        const roomRef = getRoomRef(newRoomId);
        
        const firstTurn = Math.random() < 0.5 ? 'host' : 'guest'; 
        const hostDeck = shuffleDeck(myDeckIds);
        
        let hostHand = hostDeck.splice(0, 3); 
        let hostMana = INITIAL_MANA; 
        // 後攻ならマナコイン
        if (firstTurn !== 'host') hostHand.push({ ...MANA_COIN, uid: generateId() });
        
        const initialData = { 
            hostId: userId, 
            guestId: null, 
            status: 'waiting', 
            createdAt: Date.now(), 
            turnCount: 1, 
            currentTurn: firstTurn, 
            turnPhase: 'strategy', 
            lastAction: null, 
            host: { 
                hp: INITIAL_HP, 
                mana: hostMana, 
                maxMana: INITIAL_MANA, 
                deck: hostDeck, 
                hand: hostHand, 
                board: [], 
                initialDeckSummary: getDeckSummary(myDeckIds) 
            }, 
            guest: { 
                hp: INITIAL_HP, 
                mana: INITIAL_MANA, 
                maxMana: INITIAL_MANA, 
                deck: [], 
                hand: [], 
                board: [] 
            } 
        };
        
        await setDoc(roomRef, initialData); 
        sessionStorage.setItem('duel_room_id', newRoomId); 
        setRoomId(newRoomId); 
        setIsHost(true); 
        setView('lobby');
    };

    // 部屋参加
    const joinRoom = async (inputRoomId) => {
        if (!userId || !inputRoomId) return; 
        if (myDeckIds.length === 0) return;
        
        const roomRef = getRoomRef(inputRoomId); 
        const snap = await getDoc(roomRef);
        
        if (snap.exists() && snap.data().status === 'waiting') {
            const data = snap.data(); 
            if (data.hostId === userId) { 
                alert("自分の部屋には参加できません"); 
                return; 
            }
            
            const guestDeck = shuffleDeck(myDeckIds); 
            let guestHand = guestDeck.splice(0, 3); 
            // 後攻ならマナコイン
            if (data.currentTurn !== 'guest') guestHand.push({ ...MANA_COIN, uid: generateId() });
            
            await updateDoc(roomRef, { 
                guestId: userId, 
                status: 'playing', 
                'guest.deck': guestDeck, 
                'guest.hand': guestHand, 
                'guest.maxMana': INITIAL_MANA, 
                'guest.mana': INITIAL_MANA, 
                'guest.initialDeckSummary': getDeckSummary(myDeckIds) 
            });
            
            sessionStorage.setItem('duel_room_id', inputRoomId); 
            setRoomId(inputRoomId); 
            setIsHost(false); 
            setView('game');
        } else { 
            alert("部屋が見つかりません"); 
        }
    };

    return {
        isDeckValidStrict,
        startRandomMatch,
        createRoom,
        joinRoom
    };
};