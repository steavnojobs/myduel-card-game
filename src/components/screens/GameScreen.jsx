import React, { useState } from 'react';
import { MAX_MANA_LIMIT } from '../../data/rules';
import GameHeader from '../game/GameHeader';
import GameBoard from '../game/GameBoard';
import PlayerConsole from '../game/PlayerConsole';
import GameSidebar from '../game/GameSidebar';
import Card from '../game/Card';

export default function GameScreen({ 
    gameData, myRole, enemyRole, isMyTurn, 
    targetingHandCard, aimingState, attackingState, selectedUnit, isDragging,
    handleTargetSelection, handleSurrender, handleBoardDragStart, handleContextMenu, handleGameDrop, 
    initiatePlayCard, endTurn, handleGameDragStart, handleGameDragEnd, resolveStartPhase 
}) {
    const [showGraveyard, setShowGraveyard] = useState(false);

    // --- 墓地の整理整頓ロジック ---
    const processGraveyard = (graveyard) => {
        if (!graveyard || !Array.isArray(graveyard)) return [];

        // 1. IDごとに集計する
        const counts = {};
        const uniqueCards = {};

        graveyard.forEach(card => {
            if (!counts[card.id]) {
                counts[card.id] = 0;
                uniqueCards[card.id] = card;
            }
            counts[card.id]++;
        });

        // 2. リストにして、コスト順（昇順）に並び替える
        return Object.values(uniqueCards)
            .map(card => ({ ...card, count: counts[card.id] }))
            .sort((a, b) => {
                if (a.cost !== b.cost) return a.cost - b.cost; // コスト順
                return a.id - b.id; // 同じならID順
            });
    };

    const sortedGraveyard = processGraveyard(gameData[myRole].graveyard);

    return (
        <div className="flex w-full min-h-screen bg-slate-900 text-white font-sans overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
            
            {/* 戦略フェイズ */}
            {isMyTurn && gameData.turnPhase === 'strategy' && (
                <div className="absolute inset-0 bg-black/40 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-12 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-widest" style={{ fontFamily: 'serif' }}>STRATEGY PHASE</h2>
                    <div className="flex gap-12 md:gap-24 items-center">
                        {(() => { 
                            const isMaxMana = gameData[myRole].maxMana >= MAX_MANA_LIMIT; 
                            return ( 
                                <button onClick={() => !isMaxMana && resolveStartPhase('mana')} disabled={isMaxMana} className={`group relative w-64 h-80 md:w-80 md:h-96 transition-all duration-300 ${isMaxMana ? 'grayscale cursor-not-allowed opacity-50' : 'hover:scale-105'}`}> 
                                    <div className={`absolute inset-0 rounded-2xl overflow-hidden border-4 transition-all bg-slate-900/80 ${isMaxMana ? 'border-slate-600' : 'border-blue-400/30 group-hover:border-blue-400 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]'}`}> 
                                        <img src="/images/strategy_mana.png" alt="Mana Charge" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.add('bg-gradient-to-br', 'from-blue-900', 'to-slate-900'); }} /> 
                                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent opacity-60"></div> 
                                    </div> 
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10"> 
                                        <span className={`text-6xl md:text-7xl font-serif font-black drop-shadow-[0_0_10px_rgba(59,130,246,1)] ${isMaxMana ? 'text-slate-400' : 'text-white group-hover:animate-pulse'}`}>MANA</span> 
                                        <div className={`mt-4 px-4 py-1 bg-black/60 rounded-full border backdrop-blur-md text-sm font-bold tracking-wider transition-colors ${isMaxMana ? 'border-slate-500 text-slate-400' : 'border-blue-400/50 text-blue-200 group-hover:bg-blue-600 group-hover:text-white'}`}>{isMaxMana ? 'MAX REACHED' : '最大マナ +1'}</div> 
                                    </div> 
                                </button> 
                            ); 
                        })()}
                        <button onClick={() => resolveStartPhase('draw')} className="group relative w-64 h-80 md:w-80 md:h-96 transition-all duration-300 hover:scale-105"> 
                            <div className="absolute inset-0 rounded-2xl overflow-hidden border-4 border-yellow-400/30 group-hover:border-yellow-400 group-hover:shadow-[0_0_50px_rgba(250,204,21,0.6)] transition-all bg-slate-900/80"> 
                                <img src="/images/strategy_draw.png" alt="Draw Card" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.add('bg-gradient-to-br', 'from-yellow-900', 'to-slate-900'); }} /> 
                                <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/80 via-transparent to-transparent opacity-60"></div> 
                            </div> 
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"> 
                                <span className="text-6xl md:text-7xl font-serif font-black text-yellow-100 drop-shadow-[0_0_10px_rgba(234,179,8,1)] group-hover:animate-pulse">DRAW</span> 
                                <div className="mt-4 px-4 py-1 bg-black/60 rounded-full border border-yellow-400/50 backdrop-blur-md text-yellow-200 text-sm font-bold tracking-wider group-hover:bg-yellow-600 group-hover:text-white transition-colors">カードを1枚引く</div> 
                            </div> 
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col relative">
                <GameHeader 
                    enemy={gameData[enemyRole]} 
                    onFaceClick={() => handleTargetSelection('face', 'FACE')} 
                    isTargetMode={!!aimingState || (!!targetingHandCard && ['all_enemy', 'face', 'any'].includes(targetingHandCard.mode))} 
                    onSurrender={handleSurrender} 
                />
                
                <GameBoard 
                    myBoard={gameData[myRole].board} enemyBoard={gameData[enemyRole].board}
                    isMyTurn={isMyTurn} turnCount={gameData.turnCount} lastAction={gameData.lastAction}
                    selectedUnit={selectedUnit} isDragging={isDragging}
                    onCardClick={(unit) => handleTargetSelection('unit', unit.uid)} 
                    onBoardDragStart={handleBoardDragStart}
                    onContextMenu={handleContextMenu} onDrop={handleGameDrop}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                    attackingState={attackingState}
                    targetingHandCard={targetingHandCard}
                />
                
                <PlayerConsole 
                    me={gameData[myRole]} isMyTurn={isMyTurn} turnPhase={gameData.turnPhase}
                    onPlayCard={initiatePlayCard} onEndTurn={endTurn} onContextMenu={handleContextMenu}
                    onDragStart={handleGameDragStart} onDragEnd={handleGameDragEnd}
                />

                {/* 墓地アイコン */}
                <div 
                    className="absolute bottom-40 right-4 w-16 h-16 bg-slate-800/90 border-2 border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-slate-700 transition-all z-20 shadow-xl"
                    onClick={() => setShowGraveyard(true)}
                    title="墓地を見る"
                >
                    <span className="text-2xl drop-shadow-md">🪦</span>
                    <div className="text-xs text-slate-200 font-bold mt-1">
                        {gameData[myRole].graveyard?.length || 0}
                    </div>
                </div>

            </div>
            
            <GameSidebar me={gameData[myRole]} enemy={gameData[enemyRole]} />

            {/* 墓地リストのモーダル */}
            {showGraveyard && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setShowGraveyard(false)}>
                    <div 
                        className="bg-slate-900/95 border-2 border-purple-500 rounded-xl p-6 max-w-5xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-200" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 sticky top-0 bg-slate-900/95 z-10">
                            <h2 className="text-3xl text-white font-black flex items-center gap-3">
                                <span className="text-4xl">🪦</span>
                                墓地
                                <span className="text-xl text-slate-400 font-normal ml-2">
                                    ({gameData[myRole].graveyard?.length || 0}枚)
                                </span>
                            </h2>
                            <button 
                                onClick={() => setShowGraveyard(false)} 
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* カードリスト */}
                        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 p-2">
                            {sortedGraveyard.map((card, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="transform transition-transform hover:scale-110 hover:z-20 origin-center">
                                        <Card 
                                            card={card} 
                                            location="library" 
                                            count={card.count}
                                            maxCount={999} // ★修正: 絶対にグレーアウトしないように大きい数字を指定！
                                        />
                                    </div>
                                    <div className="text-center text-[10px] text-slate-300 mt-1 truncate w-full px-1">
                                        {card.name}
                                    </div>
                                </div>
                            ))}
                            
                            {sortedGraveyard.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                                    <span className="text-6xl mb-4 opacity-30">🪦</span>
                                    <p className="text-xl">墓地は空っぽです...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}