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

  switch (location) {
    case 'board':
      sizeStyle = "w-20 h-32 md:w-32 md:h-48"; 
      
      if (card.type === 'unit' && !card.canAttack) {
        behaviorStyle = "opacity-80 grayscale cursor-default";
      } else if (card.type === 'unit' && card.canAttack) {
        behaviorStyle = "cursor-pointer hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-yellow-400";
      }

      // エフェクト類
      if (card.taunt) behaviorStyle += " ring-4 ring-red-700 shadow-[0_0_20px_rgba(220,38,38,0.6)] z-10";
      
      if (card.elusive) {
         if (!card.taunt) {
            behaviorStyle += " ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]";
         } else {
            behaviorStyle += " shadow-[0_0_20px_rgba(255,100,255,0.7)]"; 
         }
      }

      if (isSelected) {
        behaviorStyle = "cursor-crosshair ring-4 ring-green-400 -translate-y-2 shadow-[0_0_20px_rgba(74,222,128,0.8)] z-20 scale-105";
      }
      break;

      // ★ここに追加！詳細モーダル用の「超特大サイズ」設定！
      case 'detail':
      // w-64 h-96 (256px x 384px) くらいの巨大サイズ！
      // 影も特大 (shadow-2xl) にして浮き上がらせる！
      sizeStyle = "w-64 h-96 shadow-2xl z-50"; 
      // マウス操作は不要なのでデフォルトのカーソルでOK
      behaviorStyle = "cursor-default";
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
          draggable={false}
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
          draggable={false}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        />

        {/* Layer 3: テキスト情報 */}
        {/* ★ここ重要！Layer 3全体をコンテナに設定することで、中のcqwが安定して動作する！ */}
        <div 
          className="absolute inset-0 z-20 flex flex-col justify-between p-[6%] pointer-events-none"
          style={{ containerType: 'size' }}
        >
          
          {/* 上部 */}
          <div className="flex justify-between items-start">
            
            {/* マナコスト */}
            <div className="relative w-[22%] aspect-square">
                <img 
                  src="/images/mana_icon.png" 
                  alt="mana"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div className={`absolute inset-0 flex items-center justify-center font-black text-white text-[15cqw] pt-0 ${textShadow} z-10`}>
                  {card.cost}
                </div>
            </div>

            {/* 右上エリア（枚数＆能力ラベル） */}
            <div className="flex flex-col items-end gap-[1cqw] z-20">
              
              {/* デッキ枚数バッジ */}
              {location === 'library' && count !== null && (
                 <div className={`px-[0.4em] py-[0.1em] rounded text-[10cqw] font-bold border border-white/20 shadow-lg ${count >= maxCount ? 'bg-red-600 text-white' : 'bg-black/70 text-yellow-400'}`}>
                   {count}/{maxCount}
                 </div>
              )}

              {/* ★ここに追加！キーワード能力ラベル (Library専用) */}
              {location === 'library' && (
                <div className="flex flex-col gap-[2px] items-end mt-[2px]">
                  {card.taunt && (
                    <span className="bg-red-700/90 text-white text-[8cqw] px-1 rounded shadow border border-red-400 font-bold whitespace-nowrap">
                      挑発
                    </span>
                  )}
                  {card.haste && (
                    <span className="bg-yellow-600/90 text-white text-[8cqw] px-1 rounded shadow border border-yellow-400 font-bold whitespace-nowrap">
                      速攻
                    </span>
                  )}
                  {card.elusive && (
                    <span className="bg-green-700/90 text-white text-[8cqw] px-1 rounded shadow border border-green-400 font-bold whitespace-nowrap">
                      回避
                    </span>
                  )}
                  {card.bane && (
                    <span className="bg-purple-700/90 text-white text-[8cqw] px-1 rounded shadow border border-purple-400 font-bold whitespace-nowrap">
                      相討
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* 下部 */}
          <div className="flex flex-col gap-[2%]">
            
            {/* 名前 */}
            <div className="bg-black/60 rounded px-1 py-[2%] backdrop-blur-[1px] mb-[2%]">
              {/* 名前もcqwでサイズ指定！ */}
              <div className={`text-white text-center font-bold truncate text-[8cqw]`}>
                {card.name}
              </div>
            </div>

            <div className="flex justify-between items-end px-[2%] pb-[2%]">
              {card.type === 'unit' && (
                <>
                  {/* ⚔️ 攻撃力 */}
                  <div className="relative w-[24%] aspect-square group">
                    <img 
                      src="/images/attack_icon.png"
                      alt="attack"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center font-black text-white text-[15cqw] pt-[1cqw] ${textShadow} z-10`}>
                      {card.attack}
                    </div>
                  </div>

                  {/* ♥ 体力 */}
                  <div className="relative w-[24%] aspect-square group">
                    <img 
                      src="/images/health_icon.png"
                      alt="health"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center font-black text-white text-[15cqw] pt-[1cqw] ${textShadow} z-10`}>
                      {card.currentHp !== undefined ? card.currentHp : card.health}
                    </div>
                  </div>
                </>
              )}
              
              {card.type === 'building' && (
                <div className={`w-full text-center font-bold text-slate-200 ${textShadow} text-[8cqw]`}>
                   耐久 {card.currentHp !== undefined ? card.currentHp : card.health}
                </div>
              )}
              {card.type === 'spell' && (
                <div className="w-full text-center text-[8cqw] text-cyan-300 font-bold drop-shadow-md">
                  SPELL
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layer 4: バッジ (Library以外で表示する通常のバッジ) */}
        {location !== 'library' && (
          <>
            {card.taunt && <div className="absolute top-[20%] left-0 bg-red-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-r shadow border-y border-r border-red-400 z-30 font-bold">挑発</div>}
            {card.haste && <div className="absolute top-[20%] right-0 bg-yellow-600/90 text-white text-[8px] px-1.5 py-0.5 rounded-l shadow border-y border-l border-yellow-400 z-30 font-bold">速攻</div>}
            {card.elusive && <div className="absolute top-[30%] left-0 bg-green-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-r shadow border-y border-r border-green-400 z-30 font-bold">回避</div>}
            {card.bane && <div className="absolute top-[30%] right-0 bg-purple-700/90 text-white text-[8px] px-1.5 py-0.5 rounded-l shadow border-y border-l border-purple-400 z-30 font-bold">相討</div>}
          </>
        )}

        {/* 🛡️ 挑発エフェクト (盤面) */}
        {location === 'board' && card.taunt && (
          <div className="absolute inset-0 z-15 pointer-events-none flex items-center justify-center overflow-hidden rounded-lg">
            <img 
              src="/images/shield_effect.png"
              alt="taunt shield"
              className="w-[75%] h-[75%] object-contain animate-slow-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
          </div>
        )}

        {/* 攻撃済みアイコン */}
        {location === 'board' && card.type === 'unit' && !card.canAttack && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20">
            <RefreshCw size={24} className="text-white opacity-80 drop-shadow-md animate-pulse" />
          </div>
        )}

        {/* 選択中枠 */}
        {isSelected && <div className="absolute inset-0 border-4 border-green-400 rounded-lg z-40 animate-pulse pointer-events-none box-border"></div>}
      
      </div>
    </div>
  );
};

export default Card;