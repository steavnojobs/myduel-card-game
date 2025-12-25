import { collection, query, where, limit, getDocs, doc, setDoc, updateDoc, getDoc, deleteDoc, serverTimestamp, Timestamp, runTransaction } from 'firebase/firestore'; // ★ deleteDoc を追加！
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
        // waitingの部屋を探す
        const q = query(roomsRef, where("status", "==", "waiting"), limit(10)); 
        
        try {
            const querySnapshot = await getDocs(q); 
            let matched = false;
            
            // 見つかった部屋を順番にトライする
            const now = Date.now();
            const EXPIRE_TIME = 15 * 60 * 1000; 

            for (const docSnap of querySnapshot.docs) { 
                const data = docSnap.data(); 
                
                // 自分の部屋じゃなくて、かつ作られてから古すぎない部屋
                if (data.hostId !== userId && data.createdAt && (now - data.createdAt < EXPIRE_TIME)) { 
                    const targetRoomId = docSnap.id.replace('room_', ''); 
                    
                    // トランザクションで参加を試みる
                    const success = await joinRoom(targetRoomId, currentDeck);
                    if (success) {
                        matched = true;
                        break; 
                    }
                } 
            }
            
            // どの部屋にも入れなかったら自分で作る
            if (!matched) { 
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
        
        const firstTurn = Math.random() < 0.5 ? 'host' : 'guest'; 
        const hostDeck = shuffleDeck(useDeck);
        const drawCount = firstTurn === 'host' ? 3 : 4;
        const drawnIds = hostDeck.splice(0, drawCount);
        const hostHand = drawnIds.map(id => ({ ...getCard(id), id: id, uid: generateId() }));

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
        if (!userId || !inputRoomId || useDeck.length === 0) return false;
        
        const roomRef = getRoomRef(inputRoomId); 

        try {
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                
                if (!roomDoc.exists()) {
                    throw new Error("Room does not exist!");
                }

                const data = roomDoc.data();

                if (data.status !== 'waiting') {
                    throw new Error("Room is already full or playing!");
                }

                if (data.hostId === userId) {
                    throw new Error("Cannot join your own room!");
                }

                const guestDeck = shuffleDeck(useDeck); 
                const drawCount = data.currentTurn === 'guest' ? 3 : 4;
                const drawnIds = guestDeck.splice(0, drawCount);
                const guestHand = drawnIds.map(id => ({ ...getCard(id), id: id, uid: generateId() }));

                transaction.update(roomRef, { 
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
            });

            console.log("Successfully joined room via transaction!");
            sessionStorage.setItem('duel_room_id', inputRoomId); 
            setRoomId(inputRoomId); 
            setIsHost(false); 
            setView('game');
            return true; 

        } catch (e) {
            console.warn("Join failed (Transaction):", e.message);
            return false; 
        }
    };

    // ★追加: 部屋をキャンセル（削除）する関数
    const cancelRoom = async (rId) => {
        if (!rId) return;
        try {
            const roomRef = getRoomRef(rId);
            await deleteDoc(roomRef); // ドキュメントごと消す！💥
            console.log(`Room ${rId} has been deleted.`);
        } catch (error) {
            console.error("Failed to cancel room:", error);
        }
    };

    // cancelRoom をエクスポートに追加するのを忘れずに！
    return { isDeckValidStrict, startRandomMatch, createRoom, joinRoom, cancelRoom };
};