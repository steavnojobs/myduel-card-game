// src/utils/helpers.js
import { CARD_DATABASE } from '../data/cards';

// --- ID生成 ---
let idCounter = 0;
export const generateId = () => {
    const randomPart = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now().toString(36);
    idCounter++;
    return `${randomPart}-${timestamp}-${idCounter}`;
};

// --- カード取得 ---
export const getCard = (id) => {
    // IDがオブジェクトで渡された場合のガード（念のため）
    if (typeof id === 'object' && id !== null) return id;
    
    return CARD_DATABASE.find(c => c.id === parseInt(id)) ||
    {
        id: 9999, type: 'unit', name: "Unknown", cost: 0, attack: 0, health: 0, emoji: "❓", description: "データ不明"
    };
};

// --- 枠色決定 ---\
export const getCardBorderColor = (type) => {
    if (type === 'spell') return 'border-pink-400 bg-pink-900/20';
    if (type === 'building') return 'border-yellow-500 bg-yellow-900/20';
    return 'border-slate-600 bg-slate-800';
};

// --- デッキ情報の要約 ---
export const getDeckSummary = (deckIds) => {
    if (!Array.isArray(deckIds)) return "デッキ情報なし";
    const counts = {}; 
    deckIds.forEach(id => counts[id] = (counts[id] || 0) + 1);
    return Object.entries(counts).map(([id, count]) => {
        const card = getCard(parseInt(id));
        return card ? `${card.name}x${count}` : `Unknown(${id})x${count}`;
    }).join(", ");
};

// --- ★修正: デッキのシャッフル (IDのままシャッフルするだけに変更！) ---
export const shuffleDeck = (deck) => {
    if (!Array.isArray(deck)) return [];
    // コピーを作成してシャッフル (中身はいじらない！)
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};