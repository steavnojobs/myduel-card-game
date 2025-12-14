import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { Target } from 'lucide-react';

// --- 視覚的な盤面同期フック (破壊されたユニットの幽霊表示など) ---
const useVisualBoard = (realBoard) => {
  const [visualBoard, setVisualBoard] = useState(realBoard);
  const prevBoardRef = useRef(realBoard);

  useEffect(() => {
    const prevBoard = prevBoardRef.current;
    
    // 1. 破壊されたカードを探す
    const deadCards = prevBoard.filter(prevCard => 
      !realBoard.find(newCard => newCard.uid === prevCard.uid)
    );

    if (deadCards.length > 0) {
      // 生き残り + 死体(幽霊) をマージ
      const mergedBoard = prevBoard.map(prevCard => {
        const survivor = realBoard.find(newCard => newCard.uid === prevCard.uid);
        if (survivor) {
          return survivor;
        } else {
          // 死んでいれば死亡フラグを立てて残す
          return { ...prevCard, currentHp: 0, isDying: true };
        }
      });

      // 新しく召喚されたカードを追加
      const newBornCards = realBoard.filter(newCard => 
        !prevBoard.find(prevCard => prevCard.uid === newCard.uid)
      );

      setVisualBoard([...mergedBoard, ...newBornCards]);

      // 1秒後に完全に同期
      const timer = setTimeout(() => {
        setVisualBoard(realBoard); 
      }, 1000);

      prevBoardRef.current = realBoard;
      return () => clearTimeout(timer);
    } else {
      setVisualBoard(realBoard);
      prevBoardRef.current = realBoard;
    }
  }, [realBoard]);

  return visualBoard;
};

const GameBoard = ({ 
    myBoard, enemyBoard, isMyTurn, turnCount, lastAction, 
    selectedUnit, isDragging, onCardClick, onBoardDragStart, 
    onContextMenu, onDrop, onDragOver, attackingState,
    targetingHandCard 
}) => {
  
  const visualMyBoard = useVisualBoard(myBoard);
  const visualEnemyBoard = useVisualBoard(enemyBoard);

  // ★修正: このユニットが現在選択可能か判定する関数
  const isTargetable = (unit, isEnemy) => {
      if (!targetingHandCard) return false;
      const { card, mode } = targetingHandCard;

      // 1. 建物(Building)はターゲット選択のエフェクトを出さない（完全に対象外）
      if (unit.type === 'building') return false;

      // 2. ターゲットモードごとの判定
      if (mode === 'enemy_unit' || mode === 'all_enemy') {
          // 敵ユニットのみ（all_enemyの場合、顔はGameHeaderで判定）
          // 敵 かつ 隠密でないこと
          return isEnemy && !unit.stealth;
      }

      if (mode === 'ally_unit') {
          // 味方ユニットのみ
          return !isEnemy;
      }

      if (mode === 'unit' || mode === 'any') {
          // 従来/任意: 
          // 敵なら隠密チェック、味方ならOK
          if (isEnemy && unit.stealth) return false;
          return true;
      }

      // 3. 特殊な条件チェック (例: 負傷者のみ対象)
      const effectType = Array.isArray(card.onPlay) ? card.onPlay[0].type : card.onPlay?.type;
      if (effectType === 'execute_damaged') {
          if (unit.currentHp >= unit.maxHp) return false;
      }

      return false;
  };

  // ユニット描画用のヘルパー関数
  const renderUnit = (card, isEnemy) => {
      const canBeTargeted = isTargetable(card, isEnemy);
      const isTargetMode = !!targetingHandCard;

      return (
        <div 
            key={card.uid}
            className="relative group perspective-1000"
        >
            <Card 
              card={card}
              location="board"
              isSelected={selectedUnit?.uid === card.uid}
              isPlayable={!isEnemy && isMyTurn && card.canAttack && !isDragging} // 自分の盤面用
              // ターゲットモード中は、対象にできる場合のみクリック許可
              onClick={() => {
                  if (card.isDying) return;
                  if (isTargetMode) {
                      if (canBeTargeted) onCardClick(card, isEnemy ? 'enemy' : 'me');
                  } else {
                      onCardClick(card, isEnemy ? 'enemy' : 'me');
                  }
              }}
              // 自分のカードかつターゲットモードじゃない時だけドラッグ攻撃
              onMouseDown={(e) => !card.isDying && !isEnemy && !isTargetMode && onBoardDragStart(e, card)}
              onContextMenu={(e) => onContextMenu(e, card)}
              isAttacking={attackingState?.uid === card.uid ? attackingState : false}
              isDying={card.isDying}
            />

            {/* ★修正: 選択可能ターゲットの場合のみエフェクト表示 (建物には出ない！) */}
            {canBeTargeted && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    {/* 外側の円 */}
                    <div className="absolute w-24 h-24 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                    {/* 内側の円 (実体) */}
                    <div className="absolute w-20 h-20 rounded-full border-4 border-double border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-pulse flex items-center justify-center bg-green-900/20">
                        <Target className="text-green-400 w-10 h-10 opacity-90 drop-shadow-[0_0_2px_black]" />
                    </div>
                </div>
            )}

            {/* ターゲットモード中、対象外のユニットを少し暗くする演出 */}
            {isTargetMode && !canBeTargeted && (
                <div className="absolute inset-0 bg-black/60 rounded-lg pointer-events-none transition-colors z-40" />
            )}
        </div>
      );
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center relative perspective-1000 overflow-hidden" 
         onDrop={(e) => onDrop(e, 'board')} 
         onDragOver={onDragOver}>
      
      {/* 背景エフェクト */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80 -z-10 pointer-events-none"></div>
      
      {/* 盤面中央のライン */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] -z-5"></div>

      {/* --- 敵の盤面 --- */}
      <div className="w-full flex justify-center items-end h-40 md:h-48 pb-4 gap-2 md:gap-4 relative z-10">
          {visualEnemyBoard.map((card) => renderUnit(card, true))}
          {/* 空っぽの時のプレースホルダー (オプション) */}
          {/* {visualEnemyBoard.length === 0 && <div className="text-slate-600 font-bold opacity-30 text-2xl tracking-widest absolute">ENEMY AREA</div>} */}
      </div>

      {/* インフォメーションバー */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs md:text-sm font-bold tracking-widest pointer-events-none opacity-50 z-0">
          TURN {turnCount}
      </div>
        
      {/* ラストアクションログ */}
      {lastAction && (
          <div className="absolute top-[45%] left-4 bg-black/60 px-4 py-1 rounded text-xs text-slate-300 pointer-events-none animate-fade-out-slow z-20">
             {lastAction}
          </div>
      )}

      {/* --- 自分の盤面 --- */}
      <div className="w-full flex justify-center items-start h-40 md:h-48 pt-4 gap-2 md:gap-4 relative z-10">
          {visualMyBoard.map((card) => renderUnit(card, false))}
      </div>

    </div>
  );
};

export default GameBoard;