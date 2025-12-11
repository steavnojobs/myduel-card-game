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

  const baseStyle = "flex-shrink-0 relative transition-all select-none rounded-lg overflow-hidden shadow-lg";
  
  let sizeStyle = "";
  let behaviorStyle = "";
  let customStyle = {};

  const manaTextSize = location === 'library' 
    ? "text-xl md:text-3xl" 
    : "text-base md:text-xl"; 

  switch (location) {
    case 'board':
      sizeStyle = "w-20 h-32 md:w-32 md:h-48"; 
      
      // --- 基本のアクション状態 ---
      if (card.type === 'unit' && !card.canAttack) {
        behaviorStyle = "opacity-80 grayscale cursor-default";
      } else if (card.type === 'unit' && card.canAttack) {
        behaviorStyle = "cursor-pointer hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-yellow-400"; // ホバー時は黄色く光る！
      }

      // --- ★追加：能力持ちのエフェクト演出！ ---
      
      // 🛡️ 挑発 (Taunt): 赤い鉄壁のオーラ！
      if (card.taunt) {
         // ring-red-600 で赤い太枠、shadow で赤く発光！ z-indexを上げて目立たせる！
         behaviorStyle += " ring-4 ring-red-700 shadow-[0_0_20px_rgba(220,38,38,0.6)] z-50";
      }
      
      // 🍃 回避 (Elusive): 神秘的な緑のバリア！
      // (挑発と両方持ってる場合は、挑発の赤枠を優先して、影だけ混ぜる感じにするよ！)
      if (card.elusive) {
         if (!card.taunt) {
            // 挑発がないなら、緑のリングと影！
            behaviorStyle += " ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]";
         } else {
            // 挑発もあるなら、枠は赤のままで、影を少し不思議な色に混ぜる！(上級者向け演出)
            behaviorStyle += " shadow-[0_0_20px_rgba(255,100,255,0.7)]"; 
         }
      }

      // --- 選択中 (ターゲット指定など) ---
      // これが一番強い上書き！緑の極太リング！
      if (isSelected) {
        behaviorStyle = "cursor-crosshair ring-4 ring-green-400 -translate-y-2 shadow-[0_0_20px_rgba(74,222,128,0.8)] z-20 scale-105";
      }
      break;

    case 'hand':
      sizeStyle = "w-28 h-40 md:w-32 md:h-48"; 
      if (isPlayable) {
        behaviorStyle = "cursor-grab active:cursor-grabbing hover:-translate-y-6 hover:scale-110 hover:z-40 shadow-xl transition-transform duration-200 z-30";
      } else {
        behaviorStyle = "cursor-not-allowed z-30";
      }
      break;

    case 'library':
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
      style={customStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
      draggable={location !== 'board' && (location === 'library' ? (count < maxCount) : isPlayable)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="absolute inset-0 w-full h-full">

        {/* Layer 1: カードイラスト */}
        <img 
          src={`/images/cards/${card.id}.webp`}
          alt={card.name}
          className="absolute inset-[2.5%] w-[95%] h-[95%] object-cover bg-slate-800 z-0 rounded-sm"
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
          
          {/* 上部 */}
          <div className="flex justify-between items-start">
            
            {/* マナコスト画像エリア */}
            <div className="relative w-[22%] aspect-square">
                <img 
                  src="/images/mana_icon.png" 
                  alt="mana"
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
                  onError={(e) => e.target.style.display = 'none'}
                />
                
                <div className={`absolute inset-0 flex items-center justify-center font-black text-white ${manaTextSize} pt-0.5 ${textShadow} z-10`}>
                  {card.cost}
                </div>
            </div>

            {/* デッキ枚数バッジ */}
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
            {card.taunt && <div className="absolute top-[20%] left-0 bg-red-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-r shadow border-y border-r border-red-400 z-30 font-bold">挑発</div>}
            {card.haste && <div className="absolute top-[20%] right-0 bg-yellow-600/90 text-white text-[8px] px-1.5 py-0.5 rounded-l shadow border-y border-l border-yellow-400 z-30 font-bold">速攻</div>}
            {card.elusive && <div className="absolute top-[30%] left-0 bg-green-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-r shadow border-y border-r border-green-400 z-30 font-bold">回避</div>}
            {card.bane && <div className="absolute top-[30%] right-0 bg-purple-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-l shadow border-y border-l border-purple-400 z-30 font-bold">相討</div>}
          </>
        )}

        {location === 'board' && card.taunt && (
          <div className="absolute inset-0 z-15 pointer-events-none flex items-center justify-center overflow-hidden rounded-lg">
            <img 
              src="/images/shield_effect.png" // ← 用意した画像ファイル名に合わせてね！
              alt="taunt shield"
              // opacity-30 で「うっすら」を実現！
              // w-[90%] とかで少し余白を持たせて中央に配置！
              className="w-[90%] h-[90%] object-contain animate-slow-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
          </div>
        )}
        {/* ------------------------------------ */}

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