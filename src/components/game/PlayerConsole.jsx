import React from 'react';
import Card from './Card';
import { Zap, Layers } from 'lucide-react';

const PlayerConsole = ({ 
  me, 
  isMyTurn, 
  turnPhase, 
  // onPlayCard, // ← クリックプレイ廃止に伴い、ここでの受け取りは不要になったけど、App.jsx側の修正を減らすために残しておいてもエラーにはならないよ！
  onEndTurn, 
  onContextMenu, 
  onDragStart, 
  onDragEnd 
}) => {
  if (!me) return null;

  const manaPercent = (me.mana / me.maxMana) * 100;

  return (
    <div className="relative z-20 h-48 md:h-56 w-full bg-slate-950 border-t-4 border-slate-800 flex items-end justify-between px-4 pb-4 select-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      {/* --- 左側：マナ情報 --- */}
      <div className="w-24 md:w-32 mb-2 flex flex-col items-center gap-2 z-10">
        <div className="text-blue-400 font-bold text-xl md:text-2xl flex items-center gap-2 shadow-black drop-shadow-md">
           <Zap size={24} fill="currentColor" />
           {me.mana}/{me.maxMana}
        </div>
        <div className="w-full h-4 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 shadow-[0_0_10px_#2563eb]" 
            style={{ width: `${manaPercent}%` }}
          ></div>
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
                // ★修正: onClick を削除しました！これでクリックでは出なくなります！
                // onClick={() => isMyTurn && me.mana >= card.cost && turnPhase === 'main' && onPlayCard(card)} 
                
                onContextMenu={(e) => onContextMenu(e, card)}
                onDragStart={(e) => onDragStart(e, card, 'hand')}
                onDragEnd={onDragEnd}
              />
            </div>
          ))}
        </div>
      </div>

      {/* --- 右側：ターン終了ボタン --- */}
      <div className="w-24 md:w-32 mb-2 flex flex-col items-center gap-2 z-10">
        <div className="text-slate-500 font-bold text-xs mb-1 flex items-center gap-1">
          <Layers size={14}/>
          DECK: {me.deck.length}
        </div>
        
        <button 
          onClick={onEndTurn}
          disabled={!isMyTurn}
          className={`
            w-full py-4 rounded-xl font-black text-white shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all
            ${isMyTurn 
              ? 'bg-green-500 border-green-700 hover:bg-green-400 hover:shadow-green-500/50 cursor-pointer' 
              : 'bg-slate-700 border-slate-800 text-slate-500 cursor-not-allowed'}
          `}
        >
          {isMyTurn ? 'ターン終了' : '相手番'}
        </button>
      </div>

    </div>
  );
};

export default PlayerConsole;