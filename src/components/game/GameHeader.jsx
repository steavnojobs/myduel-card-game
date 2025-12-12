import React, { useState, useEffect, useRef } from 'react';
import { Zap, Layers } from 'lucide-react';

const GameHeader = ({ enemy, onFaceClick, isTargetMode }) => {
  const [hpPopup, setHpPopup] = useState(null);
  const prevHpRef = useRef(enemy?.hp);

  useEffect(() => {
    if (!enemy) return;
    const diff = enemy.hp - prevHpRef.current;
    if (prevHpRef.current !== undefined && diff !== 0) {
      setHpPopup({ value: diff, key: Date.now() });
      setTimeout(() => setHpPopup(null), 1000);
    }
    prevHpRef.current = enemy.hp;
  }, [enemy?.hp]);

  if (!enemy) return null;

  return (
    <div className="relative h-24 bg-slate-950 border-b border-slate-800 flex items-center px-6 z-20 shadow-md shrink-0 justify-between">
      
      <div className="flex flex-col items-start gap-1 z-10">
         <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Enemy Mana</span>
         <div className="flex items-center text-blue-400 text-xl font-black gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 shadow-inner">
           <Zap size={20} fill="currentColor"/> {enemy.mana}/{enemy.maxMana}
         </div>
      </div>

      {/* 敵プレイヤーアイコン */}
      <div 
        id="enemy-face" 
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-all duration-300 ${isTargetMode ? 'scale-110 z-30' : 'z-20'}`}
        onClick={onFaceClick}
      >
        <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-300 ${isTargetMode ? 'border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.8)] bg-red-900' : 'border-slate-600 bg-slate-800 hover:border-slate-400'}`}>
           
           <span className={`text-[10px] font-black tracking-widest mb-[-5px] ${isTargetMode ? 'text-red-200' : 'text-slate-400'}`}>ENEMY</span>
           
           <div className={`text-6xl font-black font-serif leading-none drop-shadow-lg ${isTargetMode ? 'text-white' : 'text-red-500'}`}>
             {enemy.hp}
           </div>

           <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/30">
              <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(enemy.hp / 20) * 100}%` }}></div>
           </div>
        </div>

        {/* ★ダメージポップアップ (アイコンの右横に配置！) */}
        {/* absolute left-[100%] でアイコンの右端に配置し、flex で上下中央揃え */}
        <div className="absolute left-[105%] top-0 bottom-0 flex items-center w-40 pointer-events-none">
           {hpPopup && (
             <div 
               key={hpPopup.key}
               className={`font-black text-6xl md:text-7xl animate-float-damage drop-shadow-[0_4px_4px_rgba(0,0,0,1)] stroke-black whitespace-nowrap ml-2
                 ${hpPopup.value > 0 ? 'text-green-400' : 'text-red-500'}`}
               style={{ textShadow: '0 0 10px black' }}
             >
               {hpPopup.value > 0 ? `+${hpPopup.value}` : hpPopup.value}
             </div>
           )}
        </div>

      </div>

      <div className="flex flex-col items-end gap-2 z-10">
         <div className="flex -space-x-1">
            {[...Array(Math.min(enemy.hand.length, 10))].map((_, i) => (
                <div key={i} className="w-5 h-8 bg-slate-700 border border-slate-600 rounded-sm shadow-sm" />
            ))}
            {enemy.hand.length > 10 && <div className="text-slate-500 text-xs self-center ml-2">...</div>}
         </div>
         <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800"><Layers size={14}/> Deck: {enemy.deck.length}</span>
            <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">Hand: {enemy.hand.length}</span>
         </div>
      </div>

    </div>
  );
};

export default GameHeader;