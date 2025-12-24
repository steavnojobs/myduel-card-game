import { collection, query, where, limit, getDocs, doc, setDoc, updateDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { INITIAL_HP, INITIAL_MANA, DECK_SIZE, MAX_COPIES_IN_DECK } from '../data/rules';
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

    const startRandomMatch = async (deckOverride = null) => {
        if (!userId) return; 
        const currentDeck = deckOverride || myDeckIds;

        if (!currentDeck || currentDeck.length === 0) {
            alert("デッキが選択されていません");
            return;
        }
        
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
            
            if (targetRoomId) { 
                await joinRoom(targetRoomId, currentDeck); 
            } else { 
                await createRoom(currentDeck); 
            }
        } catch (error) { 
            console.error("Error finding match:", error); 
            alert("マッチング中にエラーが発生しました"); 
        }
    };

    const createRoom = async (deckOverride = null) => {
        const useDeck = deckOverride || myDeckIds;
        if (!userId || useDeck.length === 0) return;
        
        const newRoomId = generateId().substring(0, 6).toUpperCase(); 
        const roomRef = getRoomRef(newRoomId);
        
        // 先行・後攻の決定
        const firstTurn = Math.random() < 0.5 ? 'host' : 'guest'; 
        
        // ホストのデッキと手札準備
        const hostDeck = shuffleDeck(useDeck);
        // 先行なら3枚、後攻なら4枚
        const drawCount = firstTurn === 'host' ? 3 : 4;
        const drawnIds = hostDeck.splice(0, drawCount);
        const hostHand = drawnIds.map(id => ({ ...getCard(id), id: id, uid: generateId() }));

        // ★削除: ここでのマナコイン追加は削除しました（useGameLoopへ移動）
        
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 24);

        const initialData = { 
            hostId: userId, 
            guestId: null, 
            status: 'waiting', 
            createdAt: Date.now(), 
            expireAt: Timestamp.fromDate(expireDate),
            turnCount: 1, 
            currentTurn: firstTurn, 
            turnPhase: 'coin_toss', 
            lastAction: null, 
            host: { 
                hp: INITIAL_HP, 
                mana: INITIAL_MANA, 
                maxMana: INITIAL_MANA, 
                deck: hostDeck, 
                hand: hostHand, 
                board: [], 
                graveyard: [],
                initialDeckSummary: getDeckSummary(useDeck),
                mulliganDone: false
            }, 
            guest: { 
                hp: INITIAL_HP, 
                mana: INITIAL_MANA, 
                maxMana: INITIAL_MANA, 
                deck: [], 
                hand: [], 
                board: [],
                graveyard: [],
                mulliganDone: false
            } 
        };
        
        await setDoc(roomRef, initialData); 
        sessionStorage.setItem('duel_room_id', newRoomId); 
        setRoomId(newRoomId); 
        setIsHost(true); 
        setView('lobby');
    };

    const joinRoom = async (inputRoomId, deckOverride = null) => {
        const useDeck = deckOverride || myDeckIds;
        if (!userId || !inputRoomId || useDeck.length === 0) return;
        
        const roomRef = getRoomRef(inputRoomId); 
        const snap = await getDoc(roomRef);
        
        if (snap.exists() && snap.data().status === 'waiting') {
            const data = snap.data(); 
            if (data.hostId === userId) { alert("自分の部屋には参加できません"); return; }
            
            const guestDeck = shuffleDeck(useDeck); 
            
            // ゲストの手札枚数: 自分が先行(hostが後攻)なら3枚、自分が後攻(hostが先行)なら4枚
            const drawCount = data.currentTurn === 'guest' ? 3 : 4;
            const drawnIds = guestDeck.splice(0, drawCount);
            const guestHand = drawnIds.map(id => ({ ...getCard(id), id: id, uid: generateId() }));
            
            // ★削除: ここでのマナコイン追加は削除しました（useGameLoopへ移動）
            
            await updateDoc(roomRef, { 
                guestId: userId, 
                status: 'playing', 
                'guest.deck': guestDeck, 
                'guest.hand': guestHand, 
                'guest.maxMana': INITIAL_MANA, 
                'guest.mana': INITIAL_MANA, 
                'guest.graveyard': [],
                'guest.initialDeckSummary': getDeckSummary(useDeck),
                'guest.mulliganDone': false
            });
            
            sessionStorage.setItem('duel_room_id', inputRoomId); 
            setRoomId(inputRoomId); 
            setIsHost(false); 
            setView('game');
        } else { 
            alert("部屋が見つかりません"); 
        }
    };

    return { isDeckValidStrict, startRandomMatch, createRoom, joinRoom };
};