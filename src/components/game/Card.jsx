import React from 'react';
import { RefreshCw } from 'lucide-react';

const Card = ({
  card,
  location = 'hand', // 'hand', 'board', 'library', 'opponent'
  isSelected = false,
  isPlayable = false,
  isDragging = false,
  count = null,
  maxCount = null,
  onClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
}) => {
  if (!card) return null;

  const baseStyle = "flex-shrink-0 relative transition-all select-none rounded-lg overflow-hidden shadow-lg"; // shadow追加で見やすく！
  
  let sizeStyle = "";
  let behaviorStyle = "";
  
  switch (location) {
    case 'board':
      sizeStyle = "w-16 h-24 md:w-20 md:h-28"; // 盤面は固定サイズ
      if (isSelected) {
        behaviorStyle = "cursor-crosshair ring-4 ring-green-400 -translate-y-2 shadow-[0_0_15px_rgba(74,222,128,0.5)] z-10";
      } else if (card.type === 'unit' && !card.canAttack) {
        behaviorStyle = "opacity-80 grayscale cursor-default";
      } else if (card.type === 'unit' && card.canAttack) {
        behaviorStyle = "cursor-pointer hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-red-400";
      }
      break;

    case 'hand':
      sizeStyle = "w-24 h-36"; // 手札も固定サイズ (96px x 144px = 2:3)
      if (isPlayable) {
        behaviorStyle = "cursor-grab active:cursor-grabbing hover:-translate-y-6 hover:scale-110 hover:z-20 shadow-xl transition-transform duration-200";
      } else {
        behaviorStyle = "opacity-60 cursor-not-allowed brightness-75";
      }
      break;

    case 'library':
      // ★ここが最終兵器！！★
      // h-0 にして、padding-bottom で無理やり高さを作る！
      // w-full に対する 150% なので、比率は絶対に 2:3 になる！
      sizeStyle = "w-full h-0 pb-[150%]"; 
      
      const isMaxed = count >= maxCount;
      if (isMaxed) {
        behaviorStyle = "opacity-50 grayscale cursor-default";
      } else {
        behaviorStyle = "cursor-grab active:cursor-grabbing hover:scale-105 hover:z-10 shadow-md";
      }
      break;

    default:
      sizeStyle = "w-20 h-28";
  }

  if (isDragging) behaviorStyle += " opacity-50 scale-95";

  const textShadow = "drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]";

  return (
    <div
      className={`${baseStyle} ${sizeStyle} ${behaviorStyle}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      draggable={location !== 'board' && (location === 'library' ? (count < maxCount) : isPlayable)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* ★中身を absolute inset-0 で配置★
         親の高さは padding で確保されてるから、
         中身はその空間いっぱいに広がるだけ！
      */}
      <div className="absolute inset-0 w-full h-full">

        {/* Layer 1: カードイラスト */}
        {/* ★修正ポイント： inset-0 をやめて、少し内側 (inset-[2.5%]) に配置！ */}
        {/* さらに rounded-md をつけて、角からはみ出すのも防ぐよ！ */}
        <img 
          src={`/images/cards/${card.id}.webp`}
          alt={card.name}
          className="absolute inset-[4%] w-[95%] h-[85%] object-cover bg-slate-800 z-0 rounded-sm"
          onError={(e) => {
            e.target.style.display = 'none'; 
            e.target.parentNode.classList.add('bg-slate-700');
          }}
        />

        {/* Layer 2: フレーム枠 */}
        <img 
          src="/images/frame.png"
          alt="frame"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        />

        {/* Layer 3: テキスト情報 */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-[6%] pointer-events-none">
          {/* ※ p-1.5 とかだとサイズによってズレるから、%指定(p-[6%])にしてみたよ！ */}
          
          {/* 上部 */}
          <div className="flex justify-between items-start">
            <div className={`w-[20%] aspect-square bg-blue-600 text-white rounded-full flex items-center justify-center font-bold border border-white/50 shadow-md text-xs md:text-sm ${textShadow}`}>
              {card.cost}
            </div>
            {location === 'library' && count !== null && (
               <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold border border-white/20 shadow-lg ${count >= maxCount ? 'bg-red-600 text-white' : 'bg-black/70 text-yellow-400'}`}>
                 {count}/{maxCount}
               </div>
            )}
          </div>

          {/* 下部 */}
          <div className="flex flex-col gap-[2%]">
            <div className="bg-black/60 rounded px-1 py-[2%] backdrop-blur-[1px]">
              <div className={`text-white text-center font-bold truncate text-[10px] md:text-xs`}>
                {card.name}
              </div>
            </div>

            <div className="flex justify-between items-center px-[2%]">
              {card.type === 'unit' && (
                <>
                  <div className={`font-black text-yellow-400 ${textShadow} text-xs md:text-sm`}>
                    ⚔️{card.attack}
                  </div>
                  <div className={`font-black text-red-400 ${textShadow} text-xs md:text-sm`}>
                    ♥{card.currentHp !== undefined ? card.currentHp : card.health}
                  </div>
                </>
              )}
              {card.type === 'building' && (
                <div className={`w-full text-center font-bold text-slate-200 ${textShadow} text-[10px]`}>
                   耐久 {card.currentHp !== undefined ? card.currentHp : card.health}
                </div>
              )}
              {card.type === 'spell' && (
                <div className="w-full text-center text-[10px] text-cyan-300 font-bold drop-shadow-md">
                  SPELL
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layer 4: バッジ */}
        {location !== 'library' && (
          <>
            {card.taunt && <div className="absolute top-[20%] left-0 bg-red-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-r shadow border-y border-r border-red-400 z-30 font-bold">挑発</div>}
            {card.haste && <div className="absolute top-[20%] right-0 bg-yellow-600/90 text-white text-[8px] px-1.5 py-0.5 rounded-l shadow border-y border-l border-yellow-400 z-30 font-bold">速攻</div>}
            {card.elusive && <div className="absolute top-[30%] left-0 bg-green-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-r shadow border-y border-r border-green-400 z-30 font-bold">回避</div>}
            {card.bane && <div className="absolute top-[30%] right-0 bg-purple-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-l shadow border-y border-l border-purple-400 z-30 font-bold">相討</div>}
          </>
        )}

        {location === 'board' && card.type === 'unit' && !card.canAttack && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20">
            <RefreshCw size={24} className="text-white opacity-80 drop-shadow-md animate-pulse" />
          </div>
        )}

        {isSelected && <div className="absolute inset-0 border-4 border-green-400 rounded-lg z-40 animate-pulse pointer-events-none box-border"></div>}
      
      </div>
    </div>
  );
};

export default Card;