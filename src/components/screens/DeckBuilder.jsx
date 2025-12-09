import React, { useState } from 'react';
import { RotateCcw, Trash2, Save, CheckCircle, Minus, Swords } from 'lucide-react';
import Card from '../game/Card';
import { CARD_DATABASE } from '../../data/cards';
import { DECK_SIZE, MAX_COPIES_IN_DECK } from '../../data/rules';
import { getCard, getCardBorderColor } from '../../utils/helpers';

const DeckBuilder = ({ myDeckIds, setMyDeckIds, onBack }) => {
    const [saveMessage, setSaveMessage] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // --- デッキ操作ロジック ---
    const addCardToDeck = (cardId) => {
        if (myDeckIds.length < DECK_SIZE) {
            const count = myDeckIds.filter(id => id === cardId).length;
            if (count < MAX_COPIES_IN_DECK) {
                setMyDeckIds([...myDeckIds, cardId]);
            }
        }
    };

    const removeCardFromDeck = (cardId) => {
        const idx = myDeckIds.indexOf(cardId);
        if (idx > -1) {
            const newDeck = [...myDeckIds];
            newDeck.splice(idx, 1);
            setMyDeckIds(newDeck);
        }
    };

    const saveDeckManual = () => {
        localStorage.setItem('my_duel_deck', JSON.stringify(myDeckIds));
        setSaveMessage("保存しました！");
        setTimeout(() => setSaveMessage(""), 2000);
    };

    const clearDeck = () => {
        setMyDeckIds([]);
        setSaveMessage("デッキを空にしました！");
        setTimeout(() => setSaveMessage(""), 2000);
    };

    const resetDeck = () => {
        // デフォルトデッキの生成ロジック（簡易版）
        const validCards = CARD_DATABASE.filter(c => !c.token);
        const defaultDeck = [];
        for(let i=0; i<DECK_SIZE; i++) {
            defaultDeck.push(validCards[i % validCards.length].id);
        }
        setMyDeckIds(defaultDeck);
        setSaveMessage("初期デッキに戻しました！");
        setTimeout(() => setSaveMessage(""), 2000);
    };

    // --- DnD Handlers ---
    const handleDragStart = (e, card, origin) => {
        setIsDragging(true);
        e.dataTransfer.setData("application/json", JSON.stringify({ id: card.id, origin }));
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, target) => {
        e.preventDefault();
        setIsDragging(false);
        try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            if (target === 'deck' && data.origin === 'library') addCardToDeck(data.id);
            else if (target === 'library' && data.origin === 'deck') removeCardFromDeck(data.id);
        } catch (err) {}
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-slate-900 text-white p-4 select-none">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <div className="flex items-center gap-4">
                    <h2 className={`text-2xl font-bold ${myDeckIds.length === DECK_SIZE ? 'text-green-400' : 'text-red-400'}`}>
                        🛠️ デッキ構築 ({myDeckIds.length}/{DECK_SIZE})
                    </h2>
                    <button onClick={resetDeck} className="text-red-400 text-xs hover:underline flex items-center gap-1 ml-4"><RotateCcw size={14}/>初期化</button>
                    <button onClick={clearDeck} className="text-red-400 text-xs hover:underline flex items-center gap-1"><Trash2 size={14}/>全削除</button>
                </div>
                <div className="flex items-center gap-2">
                    {saveMessage && <span className="text-green-400 text-sm animate-pulse flex items-center gap-1"><CheckCircle size={14}/>{saveMessage}</span>}
                    <button onClick={saveDeckManual} className="bg-green-600 px-4 py-2 rounded hover:bg-green-500 flex items-center gap-2 font-bold"><Save size={16}/> 保存</button>
                    <button onClick={onBack} className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600">戻る</button>
                </div>
            </div>

            <div className="flex gap-4 h-[calc(100vh-100px)]">
                {/* 左：カードライブラリ */}
                <div 
                    className={`flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 content-start pr-2 rounded transition-colors ${isDragging ? 'bg-white/5' : ''}`}
                    onDragOver={handleDragOver} 
                    onDrop={(e) => handleDrop(e, 'library')}
                >
                    {CARD_DATABASE.filter(c => !c.token).sort((a,b)=>a.cost-b.cost).map(card => {
                        const countInDeck = myDeckIds.filter(id => id === card.id).length;
                        return (
                            <Card 
                                key={card.id}
                                card={card}
                                location="library"
                                count={countInDeck}
                                maxCount={MAX_COPIES_IN_DECK}
                                onClick={() => addCardToDeck(card.id)}
                                onDragStart={(e) => handleDragStart(e, card, 'library')}
                                onDragEnd={() => setIsDragging(false)}
                            />
                        )
                    })}
                </div>

                {/* 右：現在のデッキ */}
                <div 
                    className={`w-1/3 bg-black/30 rounded-lg p-2 overflow-y-auto border border-slate-700 transition-colors ${isDragging ? 'bg-blue-900/20 border-blue-500' : ''}`}
                    onDragOver={handleDragOver} 
                    onDrop={(e) => handleDrop(e, 'deck')}
                >
                    {[...new Set(myDeckIds)].sort((a,b)=>a-b).map(id => {
                        const card = getCard(id);
                        const count = myDeckIds.filter(x => x === id).length;
                        return (
                            <div 
                                key={id} 
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, card, 'deck')}
                                onDragEnd={() => setIsDragging(false)}
                                className="flex items-center justify-between bg-slate-800 mb-1 p-2 rounded border border-slate-700 text-sm cursor-grab active:cursor-grabbing hover:bg-slate-700 transition"
                                onClick={() => removeCardFromDeck(id)}
                            >
                                <span>{card.emoji} {card.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-yellow-400">x{count}</span>
                                    <Minus size={16} className="text-red-400"/>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default DeckBuilder;