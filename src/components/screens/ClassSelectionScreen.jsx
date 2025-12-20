import React from 'react';

const CLASSES = [
    { id: 'Ignis', name: 'イグニス', desc: '炎・攻撃・速攻', icon: '🔥', color: 'from-red-600 to-orange-500' },
    { id: 'Aqua', name: 'アクア', desc: '水・魔法・制御', icon: '💧', color: 'from-blue-600 to-cyan-500' },
    { id: 'Gaia', name: 'ガイア', desc: '自然・マナ加速', icon: '🌿', color: 'from-green-600 to-emerald-500' },
    { id: 'Order', name: 'オーダー', desc: '秩序・防御・強化', icon: '🛡️', color: 'from-yellow-500 to-amber-400' },
    { id: 'Shadow', name: 'シャドウ', desc: '闇・死霊・蘇生', icon: '💀', color: 'from-purple-600 to-violet-500' },
];

export default function ClassSelectionScreen({ onSelectClass, onBack }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white font-sans p-8 animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-black mb-12 tracking-widest border-b-4 border-slate-700 pb-4">クラスを選択</h2>
            
            <div className="flex flex-wrap justify-center gap-8 max-w-7xl">
                {CLASSES.map((cls) => (
                    <div 
                        key={cls.id}
                        onClick={() => onSelectClass(cls.id)}
                        className={`group relative w-56 h-80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-4 ring-4 ring-slate-800 hover:ring-white shadow-2xl`}
                    >
                        {/* 背景グラデーション */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${cls.color} opacity-80 group-hover:opacity-100 transition-opacity duration-500`}></div>
                        
                        {/* アイコンとテキスト */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                            <span className="text-8xl mb-6 drop-shadow-2xl transform group-hover:scale-125 transition-transform duration-300 filter group-hover:brightness-110">{cls.icon}</span>
                            <h3 className="text-2xl font-black uppercase tracking-wider drop-shadow-md text-white">{cls.name}</h3>
                            <div className="w-10 h-1 bg-white/50 my-3 rounded-full"></div>
                            <p className="text-sm font-bold text-white/90">{cls.desc}</p>
                        </div>

                        {/* ホバー時の光沢エフェクト */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </div>
                ))}
            </div>

            <button 
                onClick={onBack}
                className="mt-16 px-10 py-3 rounded-full border-2 border-slate-600 text-slate-400 font-bold hover:text-white hover:border-white hover:bg-slate-800 transition-all"
            >
                キャンセル
            </button>
        </div>
    );
}