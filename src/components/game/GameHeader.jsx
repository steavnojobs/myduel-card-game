import React from 'react';
import { Zap, Skull } from 'lucide-react';

const GameHeader = ({ enemy, onFaceClick, isTargetMode }) => {
    return (
        <div className="w-full p-2 grid grid-cols-3 items-center bg-slate-800 border-b border-slate-700">
            {/* 敵のマナ情報 */}
            <div className="flex flex-col items-start gap-1">
                <div className="font-bold text-sm text-slate-300">Opponent</div>
                <div className="flex items-center gap-1 text-blue-400 text-xs bg-slate-900/50 px-2 py-1 rounded">
                    <Zap size={12} fill="currentColor" />
                    <span>{enemy.mana}/{enemy.maxMana}</span>
                </div>
            </div>

            {/* 敵の顔アイコン (攻撃対象になる！) */}
            <div className="flex justify-center">
                <div 
                    className={`relative transition-all duration-300 ${isTargetMode ? 'cursor-crosshair scale-110' : ''}`} 
                    onClick={onFaceClick}
                >
                    <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center border-4 border-red-800 shadow-md">
                        <Skull size={32} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-red-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white text-sm z-10 shadow">
                        {enemy.hp}
                    </div>
                </div>
            </div>

            {/* 敵の手札枚数 (裏面表示) */}
            <div className="flex justify-end gap-1">
                {enemy.hand.map((_, i) => (
                    <div key={i} className="w-6 h-10 bg-indigo-900 border border-indigo-500 rounded flex items-center justify-center text-[8px]">?</div>
                ))}
            </div>
        </div>
    );
};

export default GameHeader;