import React from 'react';
import { Zap } from 'lucide-react';
import Card from './Card';
import { getCardBorderColor } from '../../utils/helpers';

const PlayerConsole = ({ 
    me, 
    isMyTurn, 
    turnPhase, 
    onPlayCard, 
    onEndTurn, 
    onContextMenu, 
    onDragStart, 
    onDragEnd 
}) => {
    // プレイ可能な条件: 自分のターン && メインフェーズ
    const canPlay = isMyTurn && turnPhase === 'main';

    return (
        <div className="w-full bg-slate-800 border-t border-slate-700 p-2 relative pb-safe">
            {/* 情報バー & ターン終了ボタン */}
            <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center gap-3">
                    {/* 自分のアイコン & HP */}
                    <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center border-2 border-blue-500 relative">
                        <span className="text-xl">😎</span>
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {me.hp}
                        </span>
                    </div>
                    {/* 名前 & マナ */}
                    <div className="flex flex-col">
                        <div className="text-xs font-bold text-slate-400">YOU</div>
                        <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                            <Zap size={16} fill="currentColor" /> {me.mana}/{me.maxMana}
                        </div>
                    </div>
                </div>

                {/* ターン終了ボタン */}
                <button 
                    onClick={onEndTurn} 
                    disabled={!canPlay} 
                    className={`px-6 py-2 rounded-full font-bold shadow-lg transition ${
                        canPlay ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-slate-700 text-slate-500'
                    }`}
                >
                    ターン終了
                </button>
            </div>

            {/* 手札エリア */}
            <div className="flex justify-center gap-2 overflow-x-auto min-h-[120px] px-2">
                {me.hand.map((card, i) => (
                    card && (
                        <Card 
                            key={`${card.uid}-${i}`}
                            card={card}
                            location="hand"
                            // マナが足りてて、自分のターンならプレイ可能
                            isPlayable={canPlay && me.mana >= card.cost}
                            onClick={() => onPlayCard(card)}
                            onContextMenu={(e) => onContextMenu(e, card)}
                            onDragStart={(e) => onDragStart(e, card, 'hand')} 
                            onDragEnd={onDragEnd}
                        />
                    )
                ))}
            </div>
        </div>
    );
};

export default PlayerConsole;