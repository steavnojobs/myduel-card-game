import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';

// ★魔法のフック: 盤面の変化を監視して、削除されたカードを「死亡演出」用に一時的に残す！
const useVisualBoard = (realBoard) => {
  const [visualBoard, setVisualBoard] = useState(realBoard);
  const prevBoardRef = useRef(realBoard);

  useEffect(() => {
    // 前回の盤面と今回の盤面を比較
    const prevBoard = prevBoardRef.current;
    
    // 1. 新しい盤面にあるカードはそのまま使う
    // 2. 「前はいたけど今いない」カードを探し出す（＝破壊されたカード）
    const deadCards = prevBoard.filter(prevCard => 
      !realBoard.find(newCard => newCard.uid === prevCard.uid)
    );

    if (deadCards.length > 0) {
      // 破壊されたカードを「HP:0」「isDying:true」の状態にして、新しい盤面に混ぜる！
      const dyingCards = deadCards.map(c => ({
        ...c,
        currentHp: 0, // HPを0にしてダメージポップアップを誘発
        isDying: true // 死亡フラグ
      }));

      // 一時的に混ぜて表示
      setVisualBoard([...realBoard, ...dyingCards]);

      // 1秒後に本当に消すタイマー
      const timer = setTimeout(() => {
        setVisualBoard(realBoard); // 元の（削除済みの）盤面に戻す
      }, 1000);

      prevBoardRef.current = realBoard;
      return () => clearTimeout(timer);
    } else {
      // 削除がなければそのまま同期
      setVisualBoard(realBoard);
      prevBoardRef.current = realBoard;
    }
  }, [realBoard]);

  return visualBoard;
};

const GameBoard = ({ myBoard, enemyBoard, isMyTurn, turnCount, lastAction, selectedUnit, isDragging, onCardClick, onContextMenu, onDrop, onDragOver, attackingState }) => {
  
  // ★フックを使って「演出付き盤面」を取得！
  const visualMyBoard = useVisualBoard(myBoard);
  const visualEnemyBoard = useVisualBoard(enemyBoard);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" 
         onDrop={(e) => onDrop(e, 'board')} 
         onDragOver={onDragOver}>
      
      {/* --- 敵の盤面 (visualEnemyBoard を使う！) --- */}
      <div className="flex-1 flex items-center justify-center p-4 border-b border-slate-800/50 bg-black/20">
        <div className="flex gap-4 items-center justify-center flex-wrap w-full max-w-6xl min-h-[12rem]">
          {visualEnemyBoard.map((card) => (
            <Card 
              key={card.uid} 
              card={card}
              location="board"
              isSelected={false}
              isPlayable={false}
              onClick={() => !card.isDying && onCardClick(card, 'enemy')} // 死んでる時はクリック無効
              onContextMenu={(e) => onContextMenu(e, card)}
              isAttacking={attackingState?.uid === card.uid ? attackingState : false}
              isDying={card.isDying} // ★死亡フラグを渡す！
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

      {/* --- 自分の盤面 (visualMyBoard を使う！) --- */}
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
              onContextMenu={(e) => onContextMenu(e, card)}
              isAttacking={attackingState?.uid === card.uid ? attackingState : false}
              isDying={card.isDying} // ★死亡フラグを渡す！
            />
          ))}
          {visualMyBoard.length === 0 && <div className="text-slate-600 font-bold opacity-30 text-2xl tracking-widest">PLAYER AREA</div>}
        </div>
      </div>

    </div>
  );
};

export default GameBoard;