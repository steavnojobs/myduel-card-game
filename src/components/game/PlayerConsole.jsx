import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { Zap, Layers, Shield, SkipForward } from 'lucide-react';

const PlayerConsole = ({ 
  me, 
  isMyTurn, 
  turnPhase, 
  onEndTurn, 
  onContextMenu, 
  onDragStart, 
  onDragEnd 
}) => {
  // ★HP変動ポップアップ用のロジック
  const [hpPopup, setHpPopup] = useState(null);
  const prevHpRef = useRef(me?.hp);

  // HPの変化を監視してポップアップを出す！
  useEffect(() => {
    if (!me) return;
    const diff = me.hp - prevHpRef.current;
    
    // 初回レンダリング時は無視、差分がある時だけ実行
    if (prevHpRef.current !== undefined && diff !== 0) {
      setHpPopup({ value: diff, key: Date.now() });
      setTimeout(() => setHpPopup(null), 1000);
    }
    prevHpRef.current = me.hp;
  }, [me?.hp]);

  if (!me) return null;

  const manaPercent = (me.mana / me.maxMana) * 100;

  return (
    <div className="relative z-20 h-48 md:h-56 w-full bg-slate-950 border-t-4 border-slate-800 flex items-end justify-between px-4 pb-4 select-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      {/* --- 左側：ライフ & マナ情報 --- */}
      <div className="w-32 md:w-40 mb-2 flex flex-col items-center justify-end z-10 gap-2">
        
        {/* ID: my-face (敵からの攻撃ターゲット用) */}
        <div 
          id="my-face"
          className="flex flex-col items-center animate-in slide-in-from-bottom-2 duration-500 relative w-full"
        >
           
           {/* ★ダメージポップアップ (頭上に出現！) */}
           {hpPopup && (
             <div 
               key={hpPopup.key}
               className={`absolute -top-20 left-1/2 -translate-x-1/2 z-50 font-black text-6xl md:text-7xl pointer-events-none animate-float-damage drop-shadow-[0_4px_4px_rgba(0,0,0,1)] stroke-black whitespace-nowrap
                 ${hpPopup.value > 0 ? 'text-green-400' : 'text-red-500'}`}
               style={{ textShadow: '0 0 10px black' }}
             >
               {hpPopup.value > 0 ? `+${hpPopup.value}` : hpPopup.value}
             </div>
           )}

           {/* ライフ表示 (ハート + デカ文字) */}
           <div className="flex items-center gap-1 relative">
             <span className="text-5xl text-red-600 drop-shadow-md animate-pulse">♥</span>
             <span className="text-6xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none font-serif">
               {me.hp}
             </span>
             
             {/* 装甲があれば表示 */}
             {me.armor > 0 && (
                 <div className="absolute -top-4 -right-4 flex items-center justify-center w-10 h-10 bg-slate-300 rounded-full border-2 border-slate-500 shadow-lg z-10">
                     <Shield size={20} className="text-slate-600 absolute opacity-20"/>
                     <span className="text-slate-800 font-black text-lg z-10">{me.armor}</span>
                 </div>
             )}
           </div>
           
           {/* 簡易HPバー */}
           <div className="w-full h-1.5 bg-red-900/50 mt-1 rounded-full overflow-hidden border border-red-900/30">
             <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${Math.min((me.hp / 20) * 100, 100)}%` }}></div>
           </div>
        </div>

        {/* マナ情報 */}
        <div className="w-full flex flex-col items-center gap-1 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
          <div className="text-blue-400 font-bold text-xl md:text-2xl flex items-center gap-2 shadow-black drop-shadow-md leading-none">
             <Zap size={20} fill="currentColor" />
             {me.mana}<span className="text-sm text-slate-500">/{me.maxMana}</span>
          </div>
          {/* マナバー */}
          <div className="w-full h-2 bg-slate-900 rounded-full border border-slate-600 overflow-hidden relative">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_#3b82f6]" 
              style={{ width: `${manaPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* --- 中央：手札エリア (扇状表示) --- */}
      <div className="flex-1 flex justify-center items-center h-full relative perspective-1000 z-50">
        <div className="flex justify-center items-end w-full max-w-4xl px-8 pb-6" style={{ transformStyle: 'preserve-3d' }}>
          {me.hand.map((card, index) => {
            // ★扇状に広げる計算
            const total = me.hand.length;
            const center = (total - 1) / 2;
            const offset = index - center;
            const rotate = offset * 3; // 角度
            const translateY = Math.abs(offset) * 6; // 中央を高く
            const zIndex = index + 10;

            return (
                <div 
                    key={card.uid} 
                    className="relative group transition-all duration-300 hover:z-[100]"
                    style={{ 
                        transform: `rotate(${rotate}deg) translateY(${translateY}px)`,
                        zIndex: zIndex,
                        marginLeft: index === 0 ? 0 : '-35px' // カードを重ねる
                    }}
                    onDragStart={(e) => onDragStart(e, card, 'hand')}
                    onDragEnd={onDragEnd}
                    draggable // ドラッグ可能に
                >
                    {/* ★重要: location="hand" を渡すことでIDが付与され、右クリック詳細が可能になる！ */}
                    <Card 
                        card={card} 
                        location="hand" 
                        isPlayable={isMyTurn && me.mana >= card.cost && turnPhase === 'main'}
                        onContextMenu={onContextMenu} 
                    />
                </div>
            );
          })}
        </div>
      </div>

      {/* --- 右側：デッキ枚数 & ターン終了ボタン --- */}
      <div className="w-32 md:w-40 mb-2 flex flex-col items-end gap-2 z-10">
        <div className="text-slate-500 font-bold text-xs mb-1 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10">
          <Layers size={14}/>
          DECK: {me.deck.length}
        </div>
        
        <button 
          onClick={onEndTurn}
          disabled={!isMyTurn || turnPhase !== 'main'}
          className={`
            relative w-full py-4 rounded-xl font-black text-lg tracking-wider shadow-lg transition-all duration-200 
            flex items-center justify-center gap-2 border-b-4 active:border-b-0 active:translate-y-1
            ${isMyTurn && turnPhase === 'main' 
                ? 'bg-green-600 hover:bg-green-500 border-green-800 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] cursor-pointer' 
                : 'bg-slate-700 border-slate-900 text-slate-500 cursor-not-allowed'}
          `}
        >
          {isMyTurn ? (turnPhase === 'main' ? 'ターン終了' : '処理中...') : '相手ターン'}
          {isMyTurn && <SkipForward size={20} fill="currentColor" />}
        </button>
      </div>

    </div>
  );
};

export default PlayerConsole;