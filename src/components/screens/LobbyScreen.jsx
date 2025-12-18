import React from 'react';
import { Copy } from 'lucide-react';

export default function LobbyScreen({ roomId, createRoom, joinRoom, onCancel }) {
  return (
     <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-900 text-white select-none">
        <h2 className="text-3xl font-bold mb-8">🌐 オンラインロビー</h2>
        {!roomId ? (
            <div className="flex flex-col gap-8 w-full max-w-md">
                <button onClick={createRoom} className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-500">部屋を作る</button>
                <div className="flex gap-2"> <input type="text" placeholder="部屋ID" className="flex-1 bg-slate-900 border border-slate-600 rounded px-4 text-center uppercase" id="roomIdInput"/> <button onClick={() => joinRoom(document.getElementById('roomIdInput').value.toUpperCase())} className="bg-green-600 px-6 rounded-lg font-bold hover:bg-green-500">参加</button> </div>
                <button onClick={onCancel} className="text-slate-500 mt-4">戻る</button>
            </div>
        ) : (
            <div className="text-center">
                <div className="text-xl mb-4 text-slate-300">部屋ID</div>
                <div className="text-5xl font-mono font-bold text-yellow-400 mb-8 tracking-widest bg-black/30 p-4 rounded border border-yellow-500/30 flex items-center gap-4"> {roomId}<button onClick={() => {navigator.clipboard.writeText(roomId)}} className="text-sm bg-slate-700 p-2 rounded hover:bg-slate-600"><Copy size={20}/></button> </div>
                <p className="animate-pulse text-xl">対戦相手を待っています...</p>
                <button onClick={onCancel} className="mt-8 text-red-400 underline">キャンセル</button>
            </div>
        )}
     </div>
  );
}