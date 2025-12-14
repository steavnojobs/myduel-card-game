import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

const Card = ({
  card,
  location = 'hand', // 'hand', 'board', 'library', 'opponent', 'detail', 'game-detail'
  isSelected = false,
  isPlayable = false,
  isDragging = false,
  isAttacking = false,
  isDying = false,
  count = null,
  maxCount = null,
  onClick,
  onMouseDown,
  onContextMenu,
  onDragStart,
  onDragEnd,
}) => {
  if (!card) return null;

  const isDetail = location === 'detail';
  const isGameDetail = location === 'game-detail';

  // --- アニメーション・HPポップアップ制御 ---
  const [hasLanded, setHasLanded] = useState(false);
  const [hpPopup, setHpPopup] = useState(null);
  const prevHpRef = useRef(card.currentHp !== undefined ? card.currentHp : card.health);

  useEffect(() => {
    const currentHp = card.currentHp !== undefined ? card.currentHp : card.health;
    const diff = currentHp - prevHpRef.current;
    if (diff !== 0 && (location === 'board' || location === 'hand')) {
      setHpPopup({ value: diff, key: Date.now() });
      const timer = setTimeout(() => setHpPopup(null), 1000);
      prevHpRef.current = currentHp;
      return () => clearTimeout(timer);
    }
    prevHpRef.current = currentHp;
  }, [card.currentHp, card.health, location]);

  useEffect(() => {
    if (location === 'board') {
      const timer = setTimeout(() => setHasLanded(true), 500);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // --- スタイル定義 ---
  const baseStyle = "flex-shrink-0 relative transition-all select-none rounded-lg overflow-hidden shadow-lg box-border";
  
  let sizeStyle = "";
  let behaviorStyle = "";
  let customStyle = {};

  const attackStyle = (isAttacking && typeof isAttacking === 'object') ? {
    '--atk-x': `${isAttacking.x}px`,
    '--atk-y': `${isAttacking.y}px`,
  } : {};

  const isGrayedOut = location === 'board' && card.type === 'unit' && !card.canAttack && !isAttacking && !isDying;

  switch (location) {
    case 'board':
      sizeStyle = "w-20 h-28 md:w-32 md:h-48"; 
      if (isDying) behaviorStyle = "animate-fade-out-death z-0 pointer-events-none"; 
      else if (isAttacking) behaviorStyle = "animate-attack-thrust z-50"; 
      else if (!hasLanded) behaviorStyle = "animate-summon-land"; 

      if (isGrayedOut) behaviorStyle += " cursor-default"; 
      else if (card.type === 'unit' && card.canAttack && !isDying) behaviorStyle += " cursor-pointer hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-yellow-400";

      if (isSelected && !isDying) behaviorStyle += " cursor-crosshair ring-4 ring-green-400 -translate-y-2 shadow-[0_0_20px_rgba(74,222,128,0.8)] z-20 scale-105";
      break;

    case 'hand':
      sizeStyle = "w-28 h-40 md:w-32 md:h-48"; 
      if (isPlayable) behaviorStyle = "cursor-grab active:cursor-grabbing hover:-translate-y-6 hover:scale-110 hover:z-40 transition-transform duration-200 z-30 border-2 border-blue-500 animate-glow-blue";
      else behaviorStyle = "cursor-not-allowed z-30";
      break;

    case 'detail':
      sizeStyle = "w-64 h-96 shadow-2xl z-50"; 
      behaviorStyle = "cursor-default";
      break;

    case 'game-detail':
      sizeStyle = "w-96 h-[32rem] shadow-2xl z-50 border-4 border-yellow-400 bg-slate-900"; 
      behaviorStyle = "cursor-default";
      break;

    case 'library':
      sizeStyle = "w-full h-0 pb-[150%]"; 
      if (count >= maxCount) behaviorStyle = "opacity-50 grayscale cursor-default";
      else behaviorStyle = "cursor-grab active:cursor-grabbing hover:scale-105 hover:z-10 shadow-md";
      break;

    default:
      sizeStyle = "w-20 h-28";
  }

  if (isDragging) behaviorStyle += " opacity-50 scale-95";

  const textShadow = "drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,1)]";

  const getCurrentHpColor = () => {
      const current = card.currentHp !== undefined ? card.currentHp : card.health;
      const max = card.maxHp || card.health;
      
      if (current < max) return "text-red-500 animate-pulse";
      if (current > card.health) return "text-green-400";
      return "text-white";
  };

  const getAttackColor = () => {
      if (card.attack > (card.baseAttack || 0)) return "text-green-400";
      return "text-white";
  };

  // ラベル表示用コンポーネント (再利用)
  const KeywordLabels = () => (
    <div className="flex flex-col gap-[2px] items-start mt-[4px]">
      {card.haste && <span className="bg-yellow-600/90 text-white text-[8cqw] px-1 rounded shadow border border-yellow-400 font-bold whitespace-nowrap leading-none">速攻</span>}
      {card.taunt && <span className="bg-red-700/90 text-white text-[8cqw] px-1 rounded shadow border border-red-400 font-bold whitespace-nowrap leading-none">挑発</span>}
      {card.bane && <span className="bg-purple-700/90 text-white text-[8cqw] px-1 rounded shadow border border-purple-400 font-bold whitespace-nowrap leading-none">相討ち</span>}
      {card.elusive && <span className="bg-green-700/90 text-white text-[8cqw] px-1 rounded shadow border border-green-400 font-bold whitespace-nowrap leading-none">回避</span>}
      {card.stealth && <span className="bg-slate-700/90 text-white text-[8cqw] px-1 rounded shadow border border-slate-500 font-bold whitespace-nowrap leading-none">隠密</span>}
      {card.divineShield && <span className="bg-amber-500/90 text-white text-[8cqw] px-1 rounded shadow border border-amber-300 font-bold whitespace-nowrap leading-none">聖なる盾</span>}
      {card.doubleAttack && <span className="bg-orange-600/90 text-white text-[8cqw] px-1 rounded shadow border border-orange-400 font-bold whitespace-nowrap leading-none">連撃</span>}
    </div>
  );

  return (
    <div
      id={card.uid ? (location === 'hand' ? `hand-${card.uid}` : `unit-${card.uid}`) : undefined}
      className={`${baseStyle} ${sizeStyle} ${behaviorStyle}`}
      style={{ ...customStyle, ...attackStyle }}
      onClick={onClick}
      onMouseDown={onMouseDown} 
      onContextMenu={onContextMenu}
      draggable={location !== 'board' && (location === 'library' ? (count < maxCount) : isPlayable)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      
      <div className={`absolute inset-0 w-full h-full transition-all duration-300 ${isGrayedOut ? 'grayscale opacity-80' : ''}`}>
        
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
        <div className={`absolute inset-0 z-10 pointer-events-none ${isGameDetail ? 'bg-black/40' : ''}`}>
            <img 
              src="/images/frame.png"
              alt="frame"
              draggable={false}
              className="w-full h-full"
            />
        </div>

        {/* Layer 3: テキスト情報 */}
        <div 
          className="absolute inset-0 z-20 flex flex-col justify-between p-[6%] pointer-events-none"
          style={{ containerType: 'size' }} 
        >
          
          {/* 上部 */}
          <div className="flex justify-between items-start">
            
            {/* 左上エリア: マナコスト & ラベル(Hand/Board用) */}
            <div className="flex flex-col items-start w-[25%]"> {/* w指定でラベルの折り返し制御 */}
                
                {/* マナコスト */}
                <div className="relative w-[100%] aspect-square"> {/* 親の幅に合わせる */}
                    <img 
                      src="/images/mana_icon.png" 
                      alt="mana"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center font-black text-white pt-0 ${textShadow} z-10
                      ${isGameDetail ? 'text-4xl' : 'text-[15cqw]'}`}>
                      {card.cost}
                    </div>
                </div>

                {/* ★修正: 手札・盤面の場合はここにラベルを表示！(マナの下) */}
                {(location === 'hand' || location === 'board') && !isDetail && !isGameDetail && (
                    <KeywordLabels />
                )}
            </div>

            {/* 右上エリア: カウント & ラベル(Library用) */}
            <div className="flex flex-col items-end gap-[1cqw] z-20">
              {location === 'library' && count !== null && (
                 <div className={`px-[0.4em] py-[0.1em] rounded text-[10cqw] font-bold border border-white/20 shadow-lg ${count >= maxCount ? 'bg-red-600 text-white' : 'bg-black/70 text-yellow-400'}`}>
                   {count}/{maxCount}
                 </div>
              )}
              
              {/* Libraryの場合は従来どおり右側に表示 */}
              {location === 'library' && (
                <div className="flex flex-col gap-[2px] items-end mt-[2px]">
                    <KeywordLabels /> {/* 中身は同じ */}
                </div>
              )}
            </div>

          </div>

          {/* 下部 */}
          <div className="flex flex-col gap-[2%]">
            
            {/* 説明文 (詳細モードのみ) */}
            {isGameDetail && card.description && (
                <div className="absolute top-[55%] left-0 w-full px-4 z-50">
                    <div className="bg-black/90 text-white text-lg p-2 rounded border border-white/30 shadow-2xl text-center leading-tight font-medium max-h-24 overflow-y-auto">
                        {card.description}
                    </div>
                </div>
            )}

            {/* 名前 */}
            <div className="bg-black/60 rounded px-1 py-[2%] backdrop-blur-[1px] mb-[2%]">
              <div className={`text-white text-center font-bold truncate 
                ${isGameDetail ? 'text-lg py-1' : 'text-[8cqw]'}`}>
                {card.name}
              </div>
            </div>

            <div className="flex justify-between items-end px-[2%] pb-[2%]">
              {card.type === 'unit' && (
                <>
                  {/* 攻撃力 */}
                  <div className="relative w-[24%] aspect-square group">
                    <img src="/images/attack_icon.png" alt="attack" draggable={false} className="absolute inset-0 w-full h-full object-contain drop-shadow-md" />
                    <div className={`absolute inset-0 flex items-center justify-center font-black pt-[1cqw] ${textShadow} z-10
                      ${getAttackColor()} ${isGameDetail ? 'text-4xl pt-1' : 'text-[15cqw]'}`}>
                      {card.attack}
                    </div>
                  </div>
                  
                  {/* 体力 */}
                  <div className="relative w-[24%] aspect-square group">
                    <img src="/images/health_icon.png" alt="health" draggable={false} className="absolute inset-0 w-full h-full object-contain drop-shadow-md" />
                    <div className={`absolute inset-0 flex items-center justify-center font-black pt-[1cqw] ${textShadow} z-10
                      ${getCurrentHpColor()} ${isGameDetail ? 'text-4xl pt-1' : 'text-[15cqw]'}`}>
                      {card.currentHp !== undefined ? card.currentHp : card.health}
                    </div>
                  </div>
                </>
              )}
              {card.type === 'building' && (
                <div className={`w-full text-center font-bold text-slate-200 ${textShadow} 
                  ${isGameDetail ? 'text-xl' : 'text-[14cqw]'}`}>
                   耐久 {card.currentHp !== undefined ? card.currentHp : card.health}
                </div>
              )}
              {card.type === 'spell' && (
                <div className={`w-full text-center text-cyan-300 font-bold drop-shadow-md 
                  ${isGameDetail ? 'text-base' : 'text-[8cqw]'}`}>
                  SPELL
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 盤面エフェクト (Boardのみ) */}
        {/* ★修正: 挑発(Taunt)以外は全て削除しました！ */}
        {location === 'board' && !isDying && (
          <div className="absolute inset-0 z-15 pointer-events-none flex items-center justify-center overflow-hidden rounded-lg">
            
            {/* 挑発 (Taunt) のみ残す */}
            {card.taunt && (
              <img src="/images/effect_taunt.png" alt="Taunt" className="absolute w-[90%] h-[90%] object-contain animate-slow-pulse opacity-80" />
            )}

          </div>
        )}

      </div> 

      {/* HPポップアップ */}
      {hpPopup && (
        <div 
          key={hpPopup.key}
          className={`absolute inset-0 z-[60] flex items-center justify-center font-black text-6xl md:text-7xl pointer-events-none animate-float-damage drop-shadow-[0_4px_4px_rgba(0,0,0,1)] stroke-black
            ${hpPopup.value > 0 ? 'text-green-400' : 'text-red-500'}`}
          style={{ textShadow: '0 0 10px black' }}
        >
          {hpPopup.value > 0 ? `+${hpPopup.value}` : hpPopup.value}
        </div>
      )}

      {/* 攻撃済みアイコン */}
      {isGrayedOut && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 pointer-events-none">
          <RefreshCw size={24} className="text-white opacity-80 drop-shadow-md animate-pulse" />
        </div>
      )}

      {/* 選択中枠 */}
      {isSelected && !isDying && <div className="absolute inset-0 border-4 border-green-400 rounded-lg z-40 animate-pulse pointer-events-none box-border"></div>}
      
    </div>
  );
};

export default Card;