import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { Target } from 'lucide-react';

// --- 視覚的な盤面同期フック (破壊されたユニットの幽霊表示など) ---
// ★修正: bouncedUid を受け取るように変更！
const useVisualBoard = (realBoard, bouncedUid) => {
  const [visualBoard, setVisualBoard] = useState(realBoard);
  const prevBoardRef = useRef(realBoard);

  useEffect(() => {
    const prevBoard = prevBoardRef.current;
    
    // 1. 破壊（またはバウンス）されて消えたカードを探す
    const missingCards = prevBoard.filter(prevCard => 
      !realBoard.find(newCard => newCard.uid === prevCard.uid)
    );

    if (missingCards.length > 0) {
      // 生き残り + 幽霊(死体 or バウンス) をマージ
      const mergedBoard = prevBoard.map(prevCard => {
        const survivor = realBoard.find(newCard => newCard.uid === prevCard.uid);
        if (survivor) {
          return survivor;
        } else {
          // ★ここで運命の分かれ道！
          // バウンス対象のIDと一致したら「バウンス演出」、それ以外は「死亡演出」
          if (prevCard.uid === bouncedUid) {
              return { ...prevCard, isBouncing: true }; // バウンス！💨
          } else {
              return { ...prevCard, currentHp: 0, isDying: true }; // 死亡...💀
          }
        }
      });

      // 新しく召喚されたカードを追加
      const newBornCards = realBoard.filter(newCard => 
        !prevBoard.find(prevCard => prevCard.uid === newCard.uid)
      );

      setVisualBoard([...mergedBoard, ...newBornCards]);

      // 1秒後に完全に同期 (演出が終わる頃に消す)
      const timer = setTimeout(() => {
        setVisualBoard(realBoard); 
      }, 1000);

      prevBoardRef.current = realBoard;
      return () => clearTimeout(timer);
    } else {
      setVisualBoard(realBoard);
      prevBoardRef.current = realBoard;
    }
  }, [realBoard, bouncedUid]); // ★依存配列に bouncedUid を追加！

  return visualBoard;
};

const GameBoard = ({ 
    myBoard, enemyBoard, isMyTurn, turnCount, lastAction, 
    selectedUnit, isDragging, onCardClick, onBoardDragStart, 
    onContextMenu, onDrop, onDragOver, attackingState,
    targetingHandCard, bouncedUid // ★追加: propsで受け取る！
}) => {
  
  // ★追加: フックに bouncedUid を渡す！
  const visualMyBoard = useVisualBoard(myBoard, bouncedUid);
  const visualEnemyBoard = useVisualBoard(enemyBoard, bouncedUid);

  // このユニットが現在選択可能か判定する関数
  const isTargetable = (unit, isEnemy) => {
      if (!targetingHandCard) return false;
      const { card, mode } = targetingHandCard;

      if (unit.type === 'building') return false;

      if (mode === 'enemy_unit' || mode === 'all_enemy') {
          return isEnemy && !unit.stealth;
      }

      if (mode === 'ally_unit') {
          return !isEnemy;
      }

      if (mode === 'unit' || mode === 'any') {
          if (isEnemy && unit.stealth) return false;
          return true;
      }

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
              isPlayable={!isEnemy && isMyTurn && card.canAttack && !isDragging}
              onClick={() => {
                  if (card.isDying || card.isBouncing) return; // ★バウンス中もクリック禁止
                  if (isTargetMode) {
                      if (canBeTargeted) onCardClick(card, isEnemy ? 'enemy' : 'me');
                  } else {
                      onCardClick(card, isEnemy ? 'enemy' : 'me');
                  }
              }}
              onMouseDown={(e) => !card.isDying && !card.isBouncing && !isEnemy && !isTargetMode && onBoardDragStart(e, card)}
              onContextMenu={(e) => onContextMenu(e, card)}
              isAttacking={attackingState?.uid === card.uid ? attackingState : false}
              isDying={card.isDying}
              isBouncing={card.isBouncing} // ★追加: Cardにフラグを渡す！
            />

            {canBeTargeted && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="absolute w-24 h-24 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                    <div className="absolute w-20 h-20 rounded-full border-4 border-double border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-pulse flex items-center justify-center bg-green-900/20">
                        <Target className="text-green-400 w-10 h-10 opacity-90 drop-shadow-[0_0_2px_black]" />
                    </div>
                </div>
            )}

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
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80 -z-10 pointer-events-none"></div>
      
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] -z-5"></div>

      {/* --- 敵の盤面 --- */}
      <div className="w-full flex justify-center items-end h-40 md:h-48 pb-4 gap-2 md:gap-4 relative z-10">
          {visualEnemyBoard.map((card) => renderUnit(card, true))}
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs md:text-sm font-bold tracking-widest pointer-events-none opacity-50 z-0">
          TURN {turnCount}
      </div>
        
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