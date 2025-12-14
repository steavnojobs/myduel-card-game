import React, { useState, useEffect, useRef } from 'react';
import { Zap, Menu, Flag } from 'lucide-react';

const GameHeader = ({ enemy, onFaceClick, isTargetMode, onSurrender }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // HP変動ポップアップ用のState
  const [hpPopup, setHpPopup] = useState(null);
  const prevHpRef = useRef(enemy ? enemy.hp : 20);

  // HPの変化を監視してポップアップを出す！
  useEffect(() => {
    if (!enemy) return;
    
    const diff = enemy.hp - prevHpRef.current;
    
    if (diff !== 0) {
      setHpPopup({ 
        value: diff, 
        key: Date.now() 
      });
      
      const timer = setTimeout(() => setHpPopup(null), 1500);
      prevHpRef.current = enemy.hp;
      return () => clearTimeout(timer);
    }
    
    prevHpRef.current = enemy.hp;
  }, [enemy?.hp]);

  if (!enemy) return null;

  return (
    <>
        <div className="h-24 bg-slate-950 border-b-4 border-slate-800 flex items-start justify-between px-4 pt-2 relative z-30 shadow-xl">
        
            {/* 左側：敵の情報エリア */}
            <div className="flex items-center gap-4">
                
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 bg-slate-800 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors"
                    >
                        <Menu size={24} className="text-slate-300" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button 
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setShowConfirm(true);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-red-900/50 text-red-400 font-bold flex items-center gap-2 transition-colors"
                            >
                                <Flag size={18} />
                                降参する
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-blue-400 font-bold text-xl drop-shadow-md">
                        <Zap size={20} fill="currentColor" />
                        <span>{enemy.mana}/{enemy.maxMana}</span>
                    </div>
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-1">
                        <div 
                            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" 
                            style={{ width: `${(enemy.mana / 10) * 100}%` }} 
                        ></div>
                    </div>
                </div>

                <div className="text-slate-500 text-xs font-bold mt-1 bg-black/30 px-2 py-1 rounded">
                    Deck: {enemy.deck?.length || 0}
                </div>
            </div>

            {/* 中央：敵のライフ */}
            <div className="absolute left-1/2 -translate-x-1/2 top-6 flex flex-col items-center">
                
                <div 
                    id="enemy-face"
                    onClick={onFaceClick}
                    className={`relative px-8 py-2 rounded-full border-4 flex items-center gap-3 shadow-xl transition-all duration-300
                        ${isTargetMode 
                            ? 'bg-red-900/80 border-red-500 cursor-crosshair animate-pulse scale-110 shadow-[0_0_30px_rgba(220,38,38,0.8)]' 
                            : 'bg-slate-900 border-red-900 cursor-default'}`}
                >
                    {/* ハートアイコン */}
                    <span className="text-red-500 text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">♥</span>
                    
                    {/* HP数値 */}
                    <span className="text-white font-black text-4xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-widest font-mono">
                        {enemy.hp}
                    </span>

                    {/* HP変動ポップアップ (★修正: 位置を下に変更 top-14) */}
                    {hpPopup && (
                        <div 
                            key={hpPopup.key}
                            className={`absolute left-1/2 -translate-x-1/2 top-14 z-50 font-black text-6xl pointer-events-none animate-bounce stroke-black drop-shadow-[0_4px_4px_rgba(0,0,0,1)]
                                ${hpPopup.value > 0 ? 'text-green-400' : 'text-red-500'}`}
                            style={{ textShadow: '0 0 10px black', minWidth: '150px', textAlign: 'center' }}
                        >
                            {hpPopup.value > 0 ? `+${hpPopup.value}` : hpPopup.value}
                        </div>
                    )}
                </div>

            </div>

            <div className="flex flex-col items-end mr-2">
                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(enemy.hand?.length || 0, 10) }).map((_, i) => (
                        <div key={i} className="w-6 h-8 bg-slate-700 border border-slate-500 rounded shadow-md -ml-3 first:ml-0" />
                    ))}
                </div>
                <div className="text-slate-400 text-xs mt-1 font-bold">
                    Hand: {enemy.hand?.length || 0}
                </div>
            </div>
        </div>

        {showConfirm && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                <div className="bg-slate-900 border-2 border-red-600 p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] max-w-sm w-full text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">降参しますか？</h3>
                    <p className="text-slate-400 mb-8">この対戦はあなたの敗北となります。</p>
                    
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
                        >
                            いいえ
                        </button>
                        <button 
                            onClick={() => {
                                onSurrender();
                                setShowConfirm(false);
                            }}
                            className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/50 transition-colors"
                        >
                            はい
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default GameHeader;