import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { Zap, Layers } from 'lucide-react';

const PlayerConsole = ({ 
  me, 
  isMyTurn, 
  turnPhase, 
  onEndTurn, 
  onContextMenu, 
  onDragStart, 
  onDragEnd 
}) => {
  // ★追加: HP変動ポップアップ用のロジック
  const [hpPopup, setHpPopup] = useState(null);
  const prevHpRef = useRef(me?.hp);

  // HPの変化を監視してポップアップを出す！
  useEffect(() => {
    if (!me) return;
    const diff = me.hp - prevHpRef.current;
    
    // 初回レンダリング時は無視、差分がある時だけ実行
    if (prevHpRef.current !== undefined && diff !== 0) {
      setHpPopup({ value: diff, key: Date.now() });
      
      // 1秒後に消す
      setTimeout(() => setHpPopup(null), 1000);
    }
    prevHpRef.current = me.hp;
  }, [me?.hp]);

  if (!me) return null;

  const manaPercent = (me.mana / me.maxMana) * 100;

  return (
    <div className="relative z-20 h-48 md:h-56 w-full bg-slate-950 border-t-4 border-slate-800 flex items-end justify-between px-4 pb-4 select-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      {/* --- 左側：ライフ & マナ情報 --- */}
      <div className="w-28 md:w-36 mb-2 flex flex-col items-center justify-end z-10">
        
        {/* ID: my-face (敵からの攻撃ターゲット用) */}
        <div 
          id="my-face"
          className="flex flex-col items-center mb-3 animate-in slide-in-from-bottom-2 duration-500 relative"
        >
           
           {/* ★ダメージポップアップ (頭上に出現！) */}
           {hpPopup && (
             <div 
               key={hpPopup.key}
               className={`absolute -top-16 z-50 font-black text-6xl md:text-7xl pointer-events-none animate-float-damage drop-shadow-[0_4px_4px_rgba(0,0,0,1)] stroke-black whitespace-nowrap
                 ${hpPopup.value > 0 ? 'text-green-400' : 'text-red-500'}`}
               style={{ textShadow: '0 0 10px black' }}
             >
               {hpPopup.value > 0 ? `+${hpPopup.value}` : hpPopup.value}
             </div>
           )}

           {/* ライフ表示 (ハート + デカ文字) */}
           <div className="flex items-center gap-1">
             <span className="text-4xl text-red-600 drop-shadow-md animate-pulse">♥</span>
             <span className="text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none font-serif">
               {me.hp}
             </span>
           </div>
           
           {/* 簡易HPバー (飾り) */}
           <div className="w-full h-1 bg-red-900/50 mt-1 rounded-full overflow-hidden">
             <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(me.hp / 20) * 100}%` }}></div>
           </div>
        </div>

        {/* マナ情報 */}
        <div className="w-full flex flex-col items-center gap-1">
          <div className="text-blue-400 font-bold text-xl md:text-2xl flex items-center gap-2 shadow-black drop-shadow-md">
             <Zap size={24} fill="currentColor" />
             {me.mana}/{me.maxMana}
          </div>
          {/* マナバー */}
          <div className="w-full h-4 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 shadow-[0_0_10px_#2563eb]" 
              style={{ width: `${manaPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* --- 中央：手札エリア --- */}
      <div className="flex-1 flex justify-center items-end px-4 z-50 h-full pb-2">
        <div className="flex justify-center items-end -space-x-4 md:-space-x-6 hover:-space-x-2 transition-all duration-300 w-full max-w-5xl h-full">
          {me.hand.map((card, index) => (
            <div 
              key={card.uid} 
              className="relative group transition-all duration-300 hover:z-50 hover:-translate-y-8"
            >
              <Card 
                card={card}
                location="hand"
                isPlayable={isMyTurn && me.mana >= card.cost && turnPhase === 'main'}
                // ★クリックプレイは廃止済み！ドラッグのみ！
                onContextMenu={(e) => onContextMenu(e, card)}
                onDragStart={(e) => onDragStart(e, card, 'hand')}
                onDragEnd={onDragEnd}
              />
            </div>
          ))}
        </div>
      </div>

      {/* --- 右側：デッキ枚数 & ターン終了ボタン --- */}
      <div className="w-28 md:w-36 mb-2 flex flex-col items-center gap-2 z-10">
        <div className="text-slate-500 font-bold text-xs mb-1 flex items-center gap-1">
          <Layers size={14}/>
          DECK: {me.deck.length}
        </div>
        
        <button 
          onClick={onEndTurn}
          disabled={!isMyTurn}
          className={`
            w-full py-4 rounded-xl font-black text-white shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all text-lg
            ${isMyTurn 
              ? 'bg-green-600 border-green-800 hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] cursor-pointer' 
              : 'bg-slate-800 border-slate-900 text-slate-600 cursor-not-allowed'}
          `}
        >
          {isMyTurn ? 'ターン終了' : '相手番'}
        </button>
      </div>

    </div>
  );
};

export default PlayerConsole;