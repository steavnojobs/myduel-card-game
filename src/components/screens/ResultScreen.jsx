import React from 'react';

export default function ResultScreen({ winner, myRole, onBackToTitle }) {
  return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 text-white z-[10000] select-none animate-in fade-in duration-1000">
          <h1 className={`text-7xl md:text-9xl font-black mb-8 tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] animate-pulse ${winner === myRole ? 'text-yellow-400' : 'text-blue-500 grayscale'}`}>{winner === myRole ? 'VICTORY' : 'DEFEAT'}</h1>
          <p className="text-2xl text-slate-300 mb-12 font-serif tracking-widest uppercase">{winner === myRole ? 'You are the Champion!' : 'Better luck next time...'}</p>
          <button onClick={onBackToTitle} className="bg-white text-black px-12 py-4 rounded-full font-black text-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all duration-300">タイトルに戻る</button>
      </div>
  );
}