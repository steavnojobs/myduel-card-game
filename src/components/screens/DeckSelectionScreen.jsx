import React from 'react';
import { DECK_SIZE } from '../../data/rules'; // ★追加: ルールを読み込む

// クラスごとの色とアイコン定義
const CLASS_INFO = {
    Ignis: { icon: "🔥", color: "from-red-600 to-orange-500", name: "イグニス" },
    Aqua: { icon: "💧", color: "from-blue-600 to-cyan-500", name: "アクア" },
    Gaia: { icon: "🌿", color: "from-green-600 to-emerald-500", name: "ガイア" },
    Order: { icon: "🛡️", color: "from-yellow-500 to-amber-400", name: "オーダー" },
    Shadow: { icon: "💀", color: "from-purple-600 to-violet-500", name: "シャドウ" },
};

export default function DeckSelectionScreen({ decks, onNewDeck, onEditDeck, onSelectDeckForBattle, onDeleteDeck, onBack }) {
    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-900 text-white font-sans p-8 overflow-y-auto">
            <div className="w-full max-w-6xl flex justify-between items-center mb-12">
                <button onClick={onBack} className="text-slate-400 hover:text-white px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors">
                    ← メニューへ戻る
                </button>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-lg">
                    DECK SELECTION
                </h1>
                <div className="w-24"></div> {/* レイアウト調整用 */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl pb-20">
                
                {/* 新規作成ボタン */}
                <div 
                    onClick={onNewDeck}
                    className="group relative h-40 border-4 border-dashed border-slate-600 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-slate-800/50 transition-all active:scale-95"
                >
                    <div className="text-slate-500 group-hover:text-blue-400 text-2xl font-bold flex flex-col items-center gap-2">
                        <span className="text-5xl transition-transform group-hover:scale-110 group-hover:rotate-90">+</span>
                        新規デッキ作成
                    </div>
                </div>

                {/* 保存済みデッキリスト */}
                {decks.map((deck) => {
                    const classData = CLASS_INFO[deck.class] || { icon: "❓", color: "from-gray-600 to-gray-500", name: "Unknown" };
                    // ★修正: DECK_SIZEを使って判定
                    const isComplete = deck.cards.length === DECK_SIZE;

                    return (
                        <div key={deck.id} className="relative group h-40 bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] transition-all border border-slate-700 hover:border-white/30">
                            {/* 背景のグラデーションバー */}
                            <div className={`absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-br ${classData.color} flex items-center justify-center`}>
                                <span className="text-6xl drop-shadow-md transform group-hover:scale-110 transition-transform">{classData.icon}</span>
                            </div>

                            {/* デッキ情報 */}
                            <div className="absolute left-28 right-0 top-0 bottom-0 p-5 flex flex-col justify-between bg-slate-800">
                                <div>
                                    <h3 className="text-xl font-bold truncate text-white">{deck.name}</h3>
                                    <p className={`text-xs font-black uppercase tracking-wider mt-1 bg-clip-text text-transparent bg-gradient-to-r ${classData.color}`}>
                                        {classData.name} CLASS
                                    </p>
                                </div>
                                <div className="flex justify-end items-end">
                                    {/* ★修正: DECK_SIZEを表示 */}
                                    <span className={`text-sm font-bold ${isComplete ? 'text-green-400' : 'text-yellow-500'}`}>
                                        {deck.cards.length} / {DECK_SIZE} 枚
                                    </span>
                                </div>
                            </div>

                            {/* アクションボタン (ホバーで表示) */}
                            <div className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                {/* ★修正: 完了している時だけ対戦ボタン表示 */}
                                {isComplete && (
                                    <button 
                                        onClick={() => onSelectDeckForBattle(deck)}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform hover:-translate-y-1 transition-all"
                                    >
                                        対戦
                                    </button>
                                )}
                                <button 
                                    onClick={() => onEditDeck(deck)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform hover:-translate-y-1 transition-all"
                                >
                                    編集
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(window.confirm('本当に削除しますか？')) onDeleteDeck(deck.id); }}
                                    className="bg-red-600/80 hover:bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm transform hover:-translate-y-1 transition-all"
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}