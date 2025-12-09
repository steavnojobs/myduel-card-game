import React from 'react';
import { Layers, Scroll } from 'lucide-react';

const GameSidebar = ({ me, enemy }) => {
    // 共通の表示パーツ
    const InfoBox = ({ icon: Icon, label, value, colorClass }) => (
        <div className="flex flex-col items-center bg-slate-800 p-2 rounded w-full">
            <Icon size={16} className={`${colorClass} mb-1`}/>
            <div className="font-bold text-[10px]">{label}</div>
            <div className="text-lg">{value}</div>
        </div>
    );

    return (
        <div className="w-24 bg-slate-900 border-l border-slate-700 p-2 flex flex-col justify-between items-center text-xs">
            {/* 敵の情報 (上) */}
            <div className="flex flex-col items-center gap-2 mt-4 w-full">
                <div className="text-slate-400 mb-1">ENEMY</div>
                <InfoBox icon={Layers} label="山札" value={enemy.deck.length} colorClass="text-indigo-400" />
                <InfoBox icon={Scroll} label="Hand" value={enemy.hand.length} colorClass="text-green-400" />
            </div>

            {/* 自分の情報 (下) */}
            <div className="flex flex-col items-center gap-2 mb-20 w-full">
                <div className="text-slate-400 mb-1">YOU</div>
                <InfoBox icon={Scroll} label="Hand" value={me.hand.length} colorClass="text-green-400" />
                <InfoBox icon={Layers} label="山札" value={me.deck.length} colorClass="text-indigo-400" />
            </div>
        </div>
    );
};

export default GameSidebar;