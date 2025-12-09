import React from 'react';
import { RefreshCw } from 'lucide-react';
import { getCardBorderColor } from '../../utils/helpers';

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

  const baseStyle = "flex-shrink-0 rounded border flex flex-col items-center p-1 relative transition-all select-none";
  const borderColor = getCardBorderColor(card.type);
  
  let sizeStyle = "";
  let behaviorStyle = "";

  switch (location) {
    case 'board':
      sizeStyle = "w-16 h-24 md:w-20 md:h-28 border-2";
      if (isSelected) {
        behaviorStyle = "cursor-crosshair border-green-400 -translate-y-2 shadow-[0_0_15px_rgba(74,222,128,0.5)] z-10";
      } else if (card.type === 'unit' && !card.canAttack) {
        behaviorStyle = "opacity-60 grayscale cursor-default";
      } else if (card.type === 'unit' && card.canAttack) {
        behaviorStyle = "cursor-pointer hover:border-red-500 hover:scale-105 hover:shadow-lg";
      }
      break;

    case 'hand':
      sizeStyle = "w-20 h-28 border";
      if (isPlayable) {
        behaviorStyle = "cursor-grab active:cursor-grabbing hover:-translate-y-4 hover:shadow-xl hover:z-10";
      } else {
        behaviorStyle = "opacity-50 cursor-not-allowed";
      }
      break;

    case 'library':
      // ★修正: ここを微調整！
      sizeStyle = "w-full h-24 border"; // 高さを固定して並びを綺麗に
      const isMaxed = count >= maxCount;
      if (isMaxed) {
        behaviorStyle = "opacity-50 grayscale cursor-default";
      } else {
        behaviorStyle = "cursor-grab active:cursor-grabbing hover:scale-105 hover:z-10";
      }
      break;

    default:
      sizeStyle = "w-20 h-28";
  }

  if (isDragging) behaviorStyle += " opacity-50";

  return (
    <div
      className={`${baseStyle} ${borderColor} ${sizeStyle} ${behaviorStyle}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      draggable={location !== 'board' && (location === 'library' ? (count < maxCount) : isPlayable)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* --- コスト表示 --- */}
      {location !== 'board' && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow z-20 border border-white/20">
          {card.cost}
        </div>
      )}

      {/* --- 絵文字 --- */}
      <div className={`text-center ${location === 'board' ? 'text-xl md:text-2xl mt-1' : 'text-3xl mt-2'}`}>
        {card.emoji}
      </div>

      {/* --- 名前 --- */}
      <div className={`text-center font-bold truncate w-full px-1 ${location === 'board' ? 'text-[9px] md:text-[10px]' : 'text-[10px] mt-1'}`}>
        {card.name}
      </div>

      {/* --- スタッツ --- */}
      <div className="mt-auto w-full flex justify-between px-1 mb-0.5">
        {card.type === 'unit' && (
          <>
            <span className={`text-yellow-400 font-bold ${location === 'board' ? 'text-[10px] md:text-xs' : 'text-xs'}`}>
              ⚔️{card.attack}
            </span>
            <span className={`text-red-400 font-bold ${location === 'board' ? 'text-[10px] md:text-xs' : 'text-xs'}`}>
              ♥{card.currentHp !== undefined ? card.currentHp : card.health}
            </span>
          </>
        )}
        {card.type === 'building' && (
          <div className="w-full text-center">
             <span className={`text-yellow-400 font-bold ${location === 'board' ? 'text-[10px] md:text-xs' : 'text-xs'}`}>
               耐久 {card.currentHp !== undefined ? card.currentHp : card.health}
             </span>
          </div>
        )}
      </div>

      {/* --- バッジ (挑発・速攻など) --- */}
      {/* ★修正: libraryの時は表示しない！(はみ出し防止) */}
      {location !== 'library' && (
        <>
          {card.taunt && <div className="absolute -top-2 bg-red-800 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-red-400 shadow z-10">挑発</div>}
          {card.haste && <div className="absolute -top-2 right-0 bg-yellow-800 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-yellow-400 shadow z-10">速攻</div>}
          {card.elusive && <div className={`absolute -top-2 ${location === 'board' ? 'left-0' : 'left-8'} bg-green-800 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-green-400 shadow z-10`}>回避</div>}
          {card.bane && <div className="absolute bottom-5 md:bottom-6 bg-purple-900 text-white text-[8px] px-1.5 py-0.5 rounded border border-purple-500 shadow z-10">相討</div>}
        </>
      )}

      {/* --- 所持枚数バッジ (デッキ構築画面用) --- */}
      {/* ★修正: 右上に「1/3」のようにまとめて表示！ */}
      {location === 'library' && count !== null && (
         <div className={`absolute top-1 right-1 px-1.5 rounded text-xs font-bold border border-white/20 z-20 ${count >= maxCount ? 'bg-red-600 text-white' : 'bg-black/60 text-yellow-400'}`}>
           {count}/{maxCount}
         </div>
      )}

      {location === 'board' && card.type === 'unit' && !card.canAttack && (
        <div className="absolute top-1 right-1 text-slate-400 bg-black/60 rounded-full p-0.5">
          <RefreshCw size={12} />
        </div>
      )}
    </div>
  );
};

export default Card;