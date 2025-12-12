import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';

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
      // ★ここが修正ポイント！！
      // 「生き残り + 死体」を単純に足すんじゃなくて、
      // 「前の並び順」をベースにして、死んだ場所だけ「幽霊」に置き換える！
      
      const mergedBoard = prevBoard.map(prevCard => {
        // このカードは生きてる？
        const survivor = realBoard.find(newCard => newCard.uid === prevCard.uid);
        
        if (survivor) {
          // 生きてれば最新の状態を使う
          return survivor;
        } else {
          // 死んでれば、その場で「死亡フラグ」を立てる！ (位置はそのまま！)
          return { ...prevCard, currentHp: 0, isDying: true };
        }
      });

      // さらに、新しく召喚されたカードがあれば末尾に追加 (破壊と召喚が同時の場合など)
      const newBornCards = realBoard.filter(newCard => 
        !prevBoard.find(prevCard => prevCard.uid === newCard.uid)
      );

      // 合体！
      setVisualBoard([...mergedBoard, ...newBornCards]);

      // 1秒後に現実（削除済み）に戻す
      const timer = setTimeout(() => {
        setVisualBoard(realBoard); 
      }, 1000);

      prevBoardRef.current = realBoard;
      return () => clearTimeout(timer);
    } else {
      // 誰も死んでなければそのまま同期
      setVisualBoard(realBoard);
      prevBoardRef.current = realBoard;
    }
  }, [realBoard]);

  return visualBoard;
};

// ★修正: props に onBoardDragStart を追加
const GameBoard = ({ myBoard, enemyBoard, isMyTurn, turnCount, lastAction, selectedUnit, isDragging, onCardClick, onBoardDragStart, onContextMenu, onDrop, onDragOver, attackingState }) => {
  
  const visualMyBoard = useVisualBoard(myBoard);
  const visualEnemyBoard = useVisualBoard(enemyBoard);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" 
         onDrop={(e) => onDrop(e, 'board')} 
         onDragOver={onDragOver}>
      
      {/* --- 敵の盤面 --- */}
      <div className="flex-1 flex items-center justify-center p-4 border-b border-slate-800/50 bg-black/20">
        <div className="flex gap-4 items-center justify-center flex-wrap w-full max-w-6xl min-h-[12rem]">
          {visualEnemyBoard.map((card) => (
            <Card 
              key={card.uid} 
              card={card}
              location="board"
              isSelected={false}
              isPlayable={false}
              onClick={() => !card.isDying && onCardClick(card, 'enemy')}
              onContextMenu={(e) => onContextMenu(e, card)}
              isAttacking={attackingState?.uid === card.uid ? attackingState : false}
              isDying={card.isDying}
            />
          ))}
          {visualEnemyBoard.length === 0 && <div className="text-slate-600 font-bold opacity-30 text-2xl tracking-widest">ENEMY AREA</div>}
        </div>
      </div>

      {/* インフォメーションバー */}
      <div className="h-10 bg-slate-950 flex items-center justify-center border-y border-slate-800 relative z-10 shrink-0">
        <div className="text-slate-400 text-sm font-bold animate-pulse">
           {isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
        </div>
        <div className="absolute right-4 text-xs text-slate-600">
           {lastAction}
        </div>
        <div className="absolute left-4 text-xs text-slate-600">
           Turn: {turnCount}
        </div>
      </div>

      {/* --- 自分の盤面 --- */}
      <div className={`flex-1 flex items-center justify-center p-4 transition-colors duration-500 ${isMyTurn && isDragging ? 'bg-blue-900/10' : ''}`}>
        <div className="flex gap-4 items-center justify-center flex-wrap w-full max-w-6xl min-h-[12rem]">
          {visualMyBoard.map((card) => (
            <Card 
              key={card.uid} 
              card={card}
              location="board"
              isSelected={selectedUnit === card.uid}
              isPlayable={false}
              onClick={() => !card.isDying && onCardClick(card, 'me')}
              // ★追加: 自分のカードだけマウスダウンでドラッグ攻撃開始！
              onMouseDown={(e) => !card.isDying && onBoardDragStart(e, card)}
              onContextMenu={(e) => onContextMenu(e, card)}
              isAttacking={attackingState?.uid === card.uid ? attackingState : false}
              isDying={card.isDying}
            />
          ))}
          {visualMyBoard.length === 0 && <div className="text-slate-600 font-bold opacity-30 text-2xl tracking-widest">PLAYER AREA</div>}
        </div>
      </div>

    </div>
  );
};

export default GameBoard;