import { collection, query, where, limit, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { INITIAL_HP, INITIAL_MANA, DECK_SIZE, MAX_COPIES_IN_DECK } from '../data/rules';
import { MANA_COIN } from '../data/cards';
import { generateId, getCard, getDeckSummary, shuffleDeck } from '../utils/helpers';

const appId = 'my-card-game'; 

export const useMatchmaking = (userId, myDeckIds, setRoomId, setIsHost, setView) => {

    const getRoomRef = (rId) => doc(db, 'artifacts', appId, 'public', 'data', 'rooms', `room_${rId}`);

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

    const startRandomMatch = async () => {
        if (!userId) return; 
        if (myDeckIds.length === 0) return;
        const roomsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
        const q = query(roomsRef, where("status", "==", "waiting"), limit(10)); 
        try {
            const querySnapshot = await getDocs(q); 
            let targetRoomId = null; 
            const EXPIRE_TIME = 15 * 60 * 1000; 
            const now = Date.now();
            for (const docSnap of querySnapshot.docs) { 
                const data = docSnap.data(); 
                if (data.hostId !== userId && data.createdAt && (now - data.createdAt < EXPIRE_TIME)) { 
                    targetRoomId = docSnap.id.replace('room_', ''); 
                    break; 
                } 
            }
            if (targetRoomId) { await joinRoom(targetRoomId); } 
            else { await createRoom(); }
        } catch (error) { console.error("Error finding match:", error); alert("マッチング中にエラーが発生しました"); }
    };

    const createRoom = async () => {
        if (!userId || myDeckIds.length === 0) return;
        const newRoomId = generateId().substring(0, 6).toUpperCase(); 
        const roomRef = getRoomRef(newRoomId);
        
        const firstTurn = Math.random() < 0.5 ? 'host' : 'guest'; 
        const hostDeck = shuffleDeck(myDeckIds); // ★ID配列が返ってくる
        
        const drawCount = firstTurn === 'host' ? 3 : 4;
        const drawnIds = hostDeck.splice(0, drawCount); // IDを取り出す
        // ★IDをカード化！これでUnknownにならない！
        const hostHand = drawnIds.map(id => ({ ...getCard(id), id: id, uid: generateId() }));
        
        const initialData = { 
            hostId: userId, 
            guestId: null, 
            status: 'waiting', 
            createdAt: Date.now(), 
            turnCount: 1, 
            currentTurn: firstTurn, 
            turnPhase: 'coin_toss', 
            lastAction: null, 
            host: { 
                hp: INITIAL_HP, mana: INITIAL_MANA, maxMana: INITIAL_MANA, 
                deck: hostDeck, // ID配列
                hand: hostHand, // オブジェクト配列
                board: [], initialDeckSummary: getDeckSummary(myDeckIds), mulliganDone: false
            }, 
            guest: { 
                hp: INITIAL_HP, mana: INITIAL_MANA, maxMana: INITIAL_MANA, 
                deck: [], hand: [], board: [], mulliganDone: false
            } 
        };
        await setDoc(roomRef, initialData); 
        sessionStorage.setItem('duel_room_id', newRoomId); 
        setRoomId(newRoomId); setIsHost(true); setView('lobby');
    };

    const joinRoom = async (inputRoomId) => {
        if (!userId || !inputRoomId || myDeckIds.length === 0) return;
        const roomRef = getRoomRef(inputRoomId); 
        const snap = await getDoc(roomRef);
        if (snap.exists() && snap.data().status === 'waiting') {
            const data = snap.data(); 
            if (data.hostId === userId) { alert("自分の部屋には参加できません"); return; }
            
            const guestDeck = shuffleDeck(myDeckIds); 
            const drawCount = data.currentTurn === 'guest' ? 3 : 4;
            const drawnIds = guestDeck.splice(0, drawCount);
            const guestHand = drawnIds.map(id => ({ ...getCard(id), id: id, uid: generateId() }));
            
            await updateDoc(roomRef, { 
                guestId: userId, status: 'playing', 
                'guest.deck': guestDeck, 'guest.hand': guestHand, 
                'guest.maxMana': INITIAL_MANA, 'guest.mana': INITIAL_MANA, 
                'guest.initialDeckSummary': getDeckSummary(myDeckIds), 'guest.mulliganDone': false
            });
            sessionStorage.setItem('duel_room_id', inputRoomId); 
            setRoomId(inputRoomId); setIsHost(false); setView('game');
        } else { alert("部屋が見つかりません"); }
    };

    return { isDeckValidStrict, startRandomMatch, createRoom, joinRoom };
};