import React from 'react';
import { Swords, Users, Zap } from 'lucide-react';

export default function MenuScreen({ setView, startRandomMatch, isDeckValid }) {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-900 text-white font-sans select-none">
        <h1 className="text-6xl font-bold mb-4 text-blue-400">DUEL CARD GAME</h1>
        <p className="mb-8 text-slate-400">Ver 44.2: Refactored Edition 🧹</p>
        <div className="flex flex-col gap-4 w-64">
            <button onClick={() => setView('deck')} className="bg-indigo-600 hover:bg-indigo-500 py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2"><Swords size={20}/> デッキ構築</button>
            <button onClick={startRandomMatch} disabled={!isDeckValid} className={`w-full py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${isDeckValid ? 'bg-orange-600 hover:bg-orange-500 text-white animate-pulse' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Zap size={20}/> ランダムマッチ</button>
            <button onClick={() => setView('lobby')} disabled={!isDeckValid} className={`w-full py-4 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${isDeckValid ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Users size={20}/> 友達と対戦</button>
        </div>
    </div>
  );
}