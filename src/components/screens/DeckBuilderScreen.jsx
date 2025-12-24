import React, { useState, useMemo } from 'react';
import { Sword, Zap, Castle, Layers, ChevronLeft, Save, Trash2 } from 'lucide-react'; 
import { CARD_DATABASE } from '../../data/cards';
import { DECK_SIZE, MAX_COPIES_IN_DECK } from '../../data/rules';
import Card from '../game/Card';

export default function DeckBuilderScreen({ 
    initialDeck, 
    selectedClass, 
    onSaveDeck, 
    onBack,
    onCardMouseDown, // ★変更: 詳細表示開始用
    onCardMouseUp    // ★変更: 詳細表示終了用
}) {
    const [deckName, setDeckName] = useState(initialDeck ? initialDeck.name : "新しいデッキ");
    const [currentClass] = useState(initialDeck ? initialDeck.class : selectedClass);
    const [deckCards, setDeckCards] = useState(initialDeck ? initialDeck.cards : []);
    
    // --- フィルタリング用 State ---
    const [filterCost, setFilterCost] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL'); 
    const [filterClassView, setFilterClassView] = useState('ALL'); 

    // --- マナカーブ集計 ---
    const manaCurve = useMemo(() => {
        const counts = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0 };
        deckCards.forEach(id => {
            const card = CARD_DATABASE.find(c => c.id === id);
            if (card) {
                const costIndex = Math.min(card.cost, 7);
                counts[costIndex] = (counts[costIndex] || 0) + 1;
            }
        });
        return counts;
    }, [deckCards]);

    const maxCurveCount = Math.max(...Object.values(manaCurve), 5);

    // --- カード種別カウント集計 ---
    const typeCounts = useMemo(() => {
        const counts = { unit: 0, spell: 0, building: 0 };
        deckCards.forEach(id => {
            const card = CARD_DATABASE.find(c => c.id === id);
            if (card && counts[card.type] !== undefined) {
                counts[card.type]++;
            }
        });
        return counts;
    }, [deckCards]);

    // --- カードプール (フィルタリング適用) ---
    const availableCards = useMemo(() => {
        return CARD_DATABASE.filter(card => {
            // 1. 基本ルール: 自クラス or Neutral
            const isAllowedClass = (card.class === currentClass || card.class === 'Neutral');
            if (!isAllowedClass) return false;
            
            // トークン除外
            if (card.token) return false; 
            if (card.id >= 9000) return false; 

            // 2. クラスフィルタ
            if (filterClassView === 'CLASS' && card.class !== currentClass) return false;
            if (filterClassView === 'NEUTRAL' && card.class !== 'Neutral') return false;

            // 3. タイプフィルタ
            if (filterType !== 'ALL' && card.type !== filterType) return false;

            // 4. コストフィルタ
            if (filterCost !== 'ALL' && card.cost !== parseInt(filterCost)) return false;

            return true;
        }).sort((a, b) => a.cost - b.cost || a.id - b.id);
    }, [currentClass, filterCost, filterType, filterClassView]);

    // デッキ操作
    const addCard = (cardId) => {
        const count = deckCards.filter(id => id === cardId).length;
        if (count >= MAX_COPIES_IN_DECK) return;
        if (deckCards.length >= DECK_SIZE) return;
        setDeckCards([...deckCards, cardId].sort((a, b) => {
            const cardA = CARD_DATABASE.find(c => c.id === a);
            const cardB = CARD_DATABASE.find(c => c.id === b);
            return (cardA?.cost || 0) - (cardB?.cost || 0) || a - b;
        }));
    };

    const removeCard = (cardId) => {
        const idx = deckCards.indexOf(cardId);
        if (idx > -1) {
            const newDeck = [...deckCards];
            newDeck.splice(idx, 1);
            setDeckCards(newDeck);
        }
    };

    // デッキ全削除（クリア）処理
    const handleClearDeck = () => {
        if (deckCards.length === 0) return;
        if (window.confirm("デッキの内容を全て削除しますか？")) {
            setDeckCards([]);
        }
    };

    const handleSave = () => {
        if (deckCards.length !== DECK_SIZE) return;
        if (!deckName.trim()) {
            alert("デッキ名を入力してください");
            return;
        }
        onSaveDeck({
            id: initialDeck ? initialDeck.id : Date.now().toString(),
            name: deckName,
            class: currentClass,
            cards: deckCards
        });
    };

    const classColors = {
        Ignis: "text-red-500 border-red-500 bg-red-900/20",
        Aqua: "text-blue-500 border-blue-500 bg-blue-900/20",
        Gaia: "text-green-500 border-green-500 bg-green-900/20",
        Order: "text-yellow-500 border-yellow-500 bg-yellow-900/20",
        Shadow: "text-purple-500 border-purple-500 bg-purple-900/20",
    }[currentClass] || "text-gray-500 border-gray-500";

    const isDeckComplete = deckCards.length === DECK_SIZE;

    return (
        <div 
            className="flex h-screen bg-slate-900 text-white overflow-hidden font-sans" 
            // ★追加: 右クリックメニュー無効 & どこで離しても詳細OFF
            onContextMenu={(e) => e.preventDefault()}
            onMouseUp={onCardMouseUp}
        >
            
            {/* --- 左側: カードプール --- */}
            <div className="w-2/3 flex flex-col bg-slate-950 border-r border-slate-700">
                
                {/* フィルタリングヘッダー */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black italic tracking-wider text-slate-300">CARD POOL</h2>
                            <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                                {[
                                    { id: 'ALL', label: 'ALL' },
                                    { id: 'CLASS', label: currentClass },
                                    { id: 'NEUTRAL', label: 'Neutral' }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setFilterClassView(item.id)}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all
                                            ${filterClassView === item.id 
                                                ? (item.id === 'CLASS' ? classColors : 'bg-slate-600 text-white') 
                                                : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {[
                                { id: 'ALL', icon: <Layers size={16}/>, label: 'All' },
                                { id: 'unit', icon: <Sword size={16}/>, label: 'Unit' },
                                { id: 'spell', icon: <Zap size={16}/>, label: 'Spell' },
                                { id: 'building', icon: <Castle size={16}/>, label: 'Build' },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setFilterType(type.id)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                                        ${filterType === type.id 
                                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {type.icon} {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-start gap-1">
                        {['ALL', '0', '1', '2', '3', '4', '5', '6', '7+'].map(cost => (
                            <button
                                key={cost}
                                onClick={() => setFilterCost(cost === '7+' ? 7 : (cost === 'ALL' ? 'ALL' : parseInt(cost)))}
                                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all
                                    ${(filterCost === (cost === '7+' ? 7 : (cost === 'ALL' ? 'ALL' : parseInt(cost)))) 
                                        ? 'bg-blue-500 text-white scale-110 shadow-lg' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                {cost}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* カード一覧 */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {availableCards.map(card => {
                            const inDeckCount = deckCards.filter(id => id === card.id).length;
                            const isMax = inDeckCount >= MAX_COPIES_IN_DECK;
                            return (
                                <div 
                                    key={card.id} 
                                    className={`relative group cursor-pointer transition-all duration-200 ${isMax ? 'opacity-50 grayscale' : 'hover:scale-105 hover:z-10'}`} 
                                    onClick={() => addCard(card.id)}
                                    // ★変更: 右クリック(MouseDown)で詳細表示
                                    onMouseDown={(e) => onCardMouseDown && onCardMouseDown(e, card)}
                                >
                                    <div className="origin-top-left pointer-events-none">
                                        <Card 
                                            card={card} 
                                            location="library" 
                                            count={inDeckCount} 
                                            maxCount={MAX_COPIES_IN_DECK} 
                                        />
                                    </div>
                                    <div className="text-center text-[20px] text-slate-400 mt-1 truncate px-1">
                                        {card.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- 右側: デッキ情報 & リスト --- */}
            <div className="w-1/3 flex flex-col bg-slate-900 shadow-2xl z-10 border-l border-slate-700">
                
                {/* ヘッダーエリア */}
                <div className="p-5 bg-slate-800 border-b border-slate-700 shadow-lg flex flex-col gap-4">
                    
                    {/* デッキ名 & 全削除ボタン */}
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={deckName} 
                            onChange={(e) => setDeckName(e.target.value)}
                            className="flex-1 bg-transparent text-2xl font-black border-b border-slate-600 focus:border-blue-500 outline-none pb-2 text-white placeholder-slate-600 tracking-wider"
                            placeholder="デッキ名を入力..."
                        />
                        <button 
                            onClick={handleClearDeck}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="デッキを空にする"
                        >
                            <Trash2 size={24} />
                        </button>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4 flex gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 text-slate-800 opacity-20 pointer-events-none">
                            <Layers size={100} />
                        </div>

                        <div className="flex-1 flex items-end justify-between gap-1 h-28 z-10">
                            {[0,1,2,3,4,5,6,7].map(cost => {
                                const count = manaCurve[cost];
                                const heightPercent = (count / maxCurveCount) * 100;
                                return (
                                    <div key={cost} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                        <div className={`text-[10px] font-bold mb-1 ${count > 0 ? 'text-blue-300' : 'text-slate-600'}`}>
                                            {count}
                                        </div>
                                        <div 
                                            className={`w-full rounded-t-sm transition-all duration-500 ${count > 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400 group-hover:to-blue-300' : 'bg-slate-700/50'}`}
                                            style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                        ></div>
                                        <div className="text-[10px] text-slate-500 font-bold mt-1">
                                            {cost === 7 ? '7+' : cost}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="w-32 flex flex-col justify-between z-10 py-1">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm text-slate-300">
                                    <span className="flex items-center gap-2 text-slate-400"><Sword size={14}/> Unit</span>
                                    <span className="font-bold">{typeCounts.unit}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-slate-300">
                                    <span className="flex items-center gap-2 text-slate-400"><Zap size={14}/> Spell</span>
                                    <span className="font-bold">{typeCounts.spell}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-slate-300">
                                    <span className="flex items-center gap-2 text-slate-400"><Castle size={14}/> Build</span>
                                    <span className="font-bold">{typeCounts.building}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end mt-2">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total Cards</span>
                                <span className={`text-4xl font-black tracking-tight flex items-baseline ${isDeckComplete ? 'text-blue-400' : 'text-yellow-500'}`}>
                                    {deckCards.length} 
                                    <span className="text-lg text-slate-500 font-medium ml-1">/ {DECK_SIZE}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button 
                            onClick={onBack} 
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 hover:text-white transition-all active:scale-95"
                        >
                            <ChevronLeft size={20} />
                            戻る
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={!isDeckComplete}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-bold shadow-lg transition-all transform active:scale-95 ${
                                isDeckComplete 
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white hover:shadow-blue-500/30' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                        >
                            <Save size={20} />
                            保存
                        </button>
                    </div>
                </div>

                {/* デッキリスト */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gradient-to-b from-slate-900 to-slate-950 custom-scrollbar">
                    {[...new Set(deckCards)].sort((a,b) => {
                        const cardA = CARD_DATABASE.find(c => c.id === a);
                        const cardB = CARD_DATABASE.find(c => c.id === b);
                        return (cardA?.cost || 0) - (cardB?.cost || 0) || a - b;
                    }).map(cardId => {
                        const card = CARD_DATABASE.find(c => c.id === cardId);
                        const count = deckCards.filter(id => id === cardId).length;
                        return (
                            <div 
                                key={cardId} 
                                onClick={() => removeCard(cardId)}
                                // ★変更: リスト内カードも右クリック(MouseDown)で詳細表示
                                onMouseDown={(e) => onCardMouseDown && onCardMouseDown(e, card)}
                                className="group flex items-center bg-slate-800/60 hover:bg-red-900/40 cursor-pointer rounded border border-slate-700/50 hover:border-red-500/50 h-10 transition-all relative overflow-hidden"
                            >
                                <img src={`/images/cards/${cardId}.webp`} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-10 transition-opacity" />
                                <div className="w-8 h-full bg-blue-900/80 flex items-center justify-center font-black text-sm text-blue-200 border-r border-white/10 z-10">
                                    {card.cost}
                                </div>
                                <div className="flex-1 px-3 truncate font-bold text-xs text-slate-200 group-hover:text-white z-10 shadow-black drop-shadow-md">
                                    {card.name}
                                </div>
                                {count > 1 && (
                                    <div className="w-8 h-full bg-yellow-500/20 flex items-center justify-center font-black text-yellow-400 text-xs border-l border-white/10 z-10">
                                        x{count}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}