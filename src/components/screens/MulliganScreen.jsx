import React, { useState } from 'react';
import Card from '../game/Card';

export default function MulliganScreen({ hand, onSubmit, isWaiting }) {
  // 交換したいカードのUIDのリスト
  const [selectedUids, setSelectedUids] = useState([]);

  const toggleSelection = (uid) => {
    if (isWaiting) return;
    setSelectedUids(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  return (
    <div className="absolute inset-0 z-[150] bg-slate-900/95 flex flex-col items-center justify-center select-none">
      <h2 className="text-4xl font-bold text-white mb-2">MULLIGAN PHASE</h2>
      <p className="text-slate-400 mb-8">交換したいカードを選んでください</p>

      {/* 手札リスト (大きく表示) */}
      <div className="flex gap-4 md:gap-8 justify-center items-center mb-12 perspective-1000">
        {hand.map((card) => {
          const isSelected = selectedUids.includes(card.uid);
          return (
            <div 
              key={card.uid}
              onClick={() => toggleSelection(card.uid)}
              className={`relative cursor-pointer transition-all duration-300 transform ${isSelected ? '-translate-y-8 opacity-50 grayscale' : 'hover:scale-105'}`}
            >
              {/* 選択状態のバツ印 */}
              {isSelected && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-white shadow-lg">
                    ✕
                  </div>
                </div>
              )}
              {/* カード本体 (少し大きく) */}
              <div className="transform scale-125 origin-center">
                <Card card={card} location="hand" />
              </div>
              
              <div className={`text-center mt-4 font-bold ${isSelected ? 'text-red-500' : 'text-blue-400'}`}>
                  {isSelected ? "交換" : "キープ"}
              </div>
            </div>
          );
        })}
      </div>

      {isWaiting ? (
        <div className="text-2xl text-yellow-400 animate-pulse font-bold">
          相手の選択を待っています...
        </div>
      ) : (
        <button 
          onClick={() => onSubmit(selectedUids)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all hover:scale-110"
        >
          決 定
        </button>
      )}
    </div>
  );
}