import React from 'react';
import Card from './Card';

const GameBoard = ({ 
    myBoard, 
    enemyBoard, 
    isMyTurn, 
    turnCount,
    lastAction,
    selectedUnit, 
    isDragging,
    onCardClick, 
    onContextMenu, 
    onDrop, 
    onDragOver 
}) => {

    return (
        <div 
            className={`flex-1 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] transition-colors ${isDragging ? 'ring-4 ring-inset ring-blue-400/50 bg-blue-900/10' : ''}`} 
            onDragOver={onDragOver} 
            onDrop={(e) => onDrop(e, 'board')}
        >
            {/* --- 敵の盤面 (上側) --- */}
            <div className="flex-1 flex items-start justify-center pt-8 gap-2 border-b border-white/10 relative overflow-x-auto min-h-[120px]">
                {enemyBoard.map((unit, i) => (
                    unit && (
                        <Card 
                            key={`${unit.uid}-${i}`}
                            card={unit}
                            location="board"
                            // 敵ユニットをクリック＝攻撃対象選択
                            onClick={() => onCardClick(unit, 'enemy')} 
                            onContextMenu={(e) => onContextMenu(e, unit)}
                        />
                    )
                ))}
            </div>

            {/* --- 中央インフォメーション (ターン表示など) --- */}
            <div className="h-16 bg-black/40 w-full flex flex-col justify-center items-center text-xs text-slate-300 pointer-events-none absolute top-1/2 -translate-y-1/2 z-0 backdrop-blur-sm">
                <div className="text-yellow-400 font-bold text-lg mb-1">
                    {isMyTurn ? "YOUR TURN" : "ENEMY TURN"}
                </div>
                <div className="px-2 text-center text-white/80">
                    {lastAction}
                </div>
                <div className="absolute right-4 text-xs text-slate-500">
                    Turn: {turnCount}
                </div>
            </div>

            {/* --- 自分の盤面 (下側) --- */}
            <div className="flex-1 flex items-end justify-center pb-8 gap-2 overflow-x-auto min-h-[120px]">
                {myBoard.map((unit, i) => (
                    unit && (
                        <Card 
                            key={`${unit.uid}-${i}`}
                            card={unit}
                            location="board"
                            isSelected={selectedUnit === unit.uid}
                            // 自分ユニットをクリック＝攻撃元選択
                            onClick={() => onCardClick(unit, 'me')} 
                            onContextMenu={(e) => onContextMenu(e, unit)}
                        />
                    )
                ))}
            </div>
        </div>
    );
};

export default GameBoard;