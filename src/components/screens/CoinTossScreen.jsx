import React from 'react';

export default function CoinTossScreen({ isMyTurn }) {
  return (
    <div className="absolute inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="relative">
        {/* 光る円のエフェクト */}
        <div className={`absolute inset-0 blur-3xl opacity-50 ${isMyTurn ? 'bg-blue-500' : 'bg-red-500'}`}></div>
        
        <h1 className={`relative text-6xl md:text-8xl font-black tracking-tighter transform transition-all duration-1000 scale-150 ${isMyTurn ? 'text-blue-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]' : 'text-red-400 drop-shadow-[0_0_30px_rgba(248,113,113,0.8)]'}`}>
          {isMyTurn ? "FIRST TURN" : "SECOND TURN"}
        </h1>
      </div>
      
      <p className="text-2xl text-white mt-8 font-serif tracking-widest opacity-80 animate-pulse">
        {isMyTurn ? "あなたの先行です" : "あなたは後攻です"}
      </p>
    </div>
  );
}