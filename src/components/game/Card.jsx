import React from 'react';
import { RefreshCw } from 'lucide-react';
import { getCardBorderColor } from '../../utils/helpers';

/**
 * カードを表示する万能コンポーネント
 * * @param {Object} props
 * @param {Object} props.card - カードデータオブジェクト
 * @param {string} props.location - 表示場所 ('hand' | 'board' | 'library' | 'opponent')
 * @param {boolean} props.isSelected - 選択中かどうか（攻撃対象選択時など）
 * @param {boolean} props.isPlayable - プレイ可能かどうか（マナ足りてる？など）
 * @param {boolean} props.isDragging - ドラッグ中かどうか
 * @param {number} props.count - デッキ構築時の所持枚数表示用
 * @param {number} props.maxCount - デッキ構築時の最大枚数表示用
 * @param {Function} props.onClick - クリック時のイベント
 * @param {Function} props.onContextMenu - 右クリック時のイベント
 * @param {Function} props.onDragStart - ドラッグ開始時
 * @param {Function} props.onDragEnd - ドラッグ終了時
 */
const Card = ({
  card,
  location = 'hand', // default: 'hand', 'board', 'library'
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
  // カードデータが無い場合（バグ回避）
  if (!card) return null;

  // 1. スタイルのベースを決める
  const baseStyle = "flex-shrink-0 rounded border flex flex-col items-center p-1 relative transition-all select-none";
  const borderColor = getCardBorderColor(card.type);
  
  // 2. 場所ごとのサイズ・挙動設定
  let sizeStyle = "";
  let behaviorStyle = "";

  switch (location) {
    case 'board':
      // 盤面のカード：レスポンシブ対応 (スマホ:w-16, PC:w-20)
      sizeStyle = "w-16 h-24 md:w-20 md:h-28 border-2";
      if (isSelected) {
        // 選択中（攻撃対象など）は緑色に光らせる
        behaviorStyle = "cursor-crosshair border-green-400 -translate-y-2 shadow-[0_0_15px_rgba(74,222,128,0.5)] z-10";
      } else if (card.type === 'unit' && !card.canAttack) {
        // 攻撃不可（召喚酔いなど）
        behaviorStyle = "opacity-60 grayscale cursor-default";
      } else if (card.type === 'unit' && card.canAttack) {
        // 攻撃可能
        behaviorStyle = "cursor-pointer hover:border-red-500 hover:scale-105 hover:shadow-lg";
      }
      break;

    case 'hand':
      // 手札のカード
      sizeStyle = "w-20 h-28 border";
      if (isPlayable) {
        // プレイ可能なら浮き上がる
        behaviorStyle = "cursor-grab active:cursor-grabbing hover:-translate-y-4 hover:shadow-xl hover:z-10";
      } else {
        // マナ不足などは暗くする
        behaviorStyle = "opacity-50 cursor-not-allowed";
      }
      break;

    case 'library':
      // デッキ構築画面のカード一覧
      sizeStyle = "w-full h-auto min-h-[100px] border";
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

  // ドラッグ中のスタイル上書き
  if (isDragging) {
    behaviorStyle += " opacity-50";
  }

  // 3. 実際の描画
  return (
    <div
      className={`${baseStyle} ${borderColor} ${sizeStyle} ${behaviorStyle}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      draggable={location !== 'board' && (location === 'library' ? (count < maxCount) : isPlayable)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* --- コスト表示 (盤面以外で表示) --- */}
      {location !== 'board' && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow z-20 border border-white/20">
          {card.cost}
        </div>
      )}

      {/* --- 絵文字 (メインビジュアル) --- */}
      <div className={`text-center ${location === 'board' ? 'text-xl md:text-2xl mt-1' : 'text-3xl mt-2'}`}>
        {card.emoji}
      </div>

      {/* --- 名前 --- */}
      <div className={`text-center font-bold truncate w-full px-1 ${location === 'board' ? 'text-[9px] md:text-[10px]' : 'text-[10px] mt-1'}`}>
        {card.name}
      </div>

      {/* --- スタッツ (攻撃力・体力) --- */}
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
        {/* 呪文の場合はコストなどを表示してもいいけど、今はシンプルに空 */}
        {card.type === 'spell' && location === 'library' && (
           <span className="text-blue-400 text-xs mx-auto">💎{card.cost}</span>
        )}
      </div>

      {/* --- バッジ (挑発・速攻など) --- */}
      {/* 盤面で見やすいように配置 */}
      {card.taunt && (
        <div className="absolute -top-2 bg-red-800 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-red-400 shadow z-10">
          挑発
        </div>
      )}
      {card.haste && (
        <div className="absolute -top-2 right-0 bg-yellow-800 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-yellow-400 shadow z-10">
          速攻
        </div>
      )}
      {card.elusive && (
        <div className={`absolute -top-2 ${location === 'board' ? 'left-0' : 'left-8'} bg-green-800 text-white text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border border-green-400 shadow z-10`}>
          回避
        </div>
      )}
      {card.bane && (
        <div className="absolute bottom-5 md:bottom-6 bg-purple-900 text-white text-[8px] px-1.5 py-0.5 rounded border border-purple-500 shadow z-10">
          相討
        </div>
      )}

      {/* --- 攻撃不可アイコン (盤面のユニットのみ) --- */}
      {location === 'board' && card.type === 'unit' && !card.canAttack && (
        <div className="absolute top-1 right-1 text-slate-400 bg-black/60 rounded-full p-0.5">
          <RefreshCw size={12} />
        </div>
      )}

      {/* --- 所持枚数バッジ (デッキ構築画面用) --- */}
      {location === 'library' && count !== null && (
        <>
           <div className="absolute top-1 right-1 bg-black/60 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border border-white/20 z-10">
             {count}/{maxCount}
           </div>
           {count > 0 && (
             <div className="absolute bottom-1 right-1 bg-black/60 px-2 rounded text-xs font-bold text-yellow-400 border border-white/20 z-10">
               x{count}
             </div>
           )}
        </>
      )}
    </div>
  );
};

export default Card;