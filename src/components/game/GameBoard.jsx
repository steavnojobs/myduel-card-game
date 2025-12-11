import React from 'react';
import Card from './Card';

const GameBoard = ({ myBoard, enemyBoard, isMyTurn, turnCount, lastAction, selectedUnit, isDragging, onCardClick, onContextMenu, onDrop, onDragOver, attackingState }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" 
         onDrop={(e) => onDrop(e, 'board')} 
         onDragOver={onDragOver}>
      
      {/* 敵の盤面 */}
      <div className="flex-1 flex items-center justify-center p-4 border-b border-slate-800/50 bg-black/20">
        <div className="flex gap-4 items-center justify-center flex-wrap w-full max-w-6xl min-h-[12rem]">
          {enemyBoard.map((card) => (
            <Card 
              key={card.uid} 
              card={card}
              location="board"
              isSelected={false}
              isPlayable={false}
              onClick={() => onCardClick(card, 'enemy')}
              onContextMenu={(e) => onContextMenu(e, card)}
            />
          ))}
          {enemyBoard.length === 0 && <div className="text-slate-600 font-bold opacity-30 text-2xl tracking-widest">ENEMY AREA</div>}
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

      {/* 自分の盤面 */}
      <div className={`flex-1 flex items-center justify-center p-4 transition-colors duration-500 ${isMyTurn && isDragging ? 'bg-blue-900/10' : ''}`}>
        <div className="flex gap-4 items-center justify-center flex-wrap w-full max-w-6xl min-h-[12rem]">
          {myBoard.map((card) => (
            <Card 
              key={card.uid} 
              card={card}
              location="board"
              isSelected={selectedUnit === card.uid}
              isPlayable={false}
              onClick={() => onCardClick(card, 'me')}
              onContextMenu={(e) => onContextMenu(e, card)}
              // ★ここで座標データを渡す！
              isAttacking={attackingState?.uid === card.uid ? attackingState : false}
            />
          ))}
          {myBoard.length === 0 && <div className="text-slate-600 font-bold opacity-30 text-2xl tracking-widest">PLAYER AREA</div>}
        </div>
      </div>

    </div>
  );
};

export default GameBoard;