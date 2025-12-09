import React from 'react';
import { Heart, Swords, Landmark } from 'lucide-react';

const CardDetailModal = ({ detailCard }) => {
    if (!detailCard) return null;

    return (
        <div className="fixed top-4 left-4 z-50 w-72 bg-black/80 border border-slate-500 rounded-lg p-4 text-white shadow-2xl backdrop-blur-sm pointer-events-none select-none">
            {/* ヘッダー */}
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-3xl">{detailCard.emoji || "?"}</span>
                    {detailCard.name || "Unknown"}
                </h3>
            </div>

            {/* タグ情報 */}
            <div className="flex gap-2 text-sm mb-3">
                <div className="px-2 py-1 bg-blue-900 rounded border border-blue-500">
                    コスト: {detailCard.cost}
                </div>
                <div className="px-2 py-1 bg-slate-700 rounded border border-slate-500 capitalize">
                    {detailCard.type}
                </div>
            </div>

            {/* スタッツ */}
            {detailCard.type === 'unit' && (
                <div className="flex gap-4 mb-3">
                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                        <Swords size={20}/> {detailCard.attack}
                    </div>
                    <div className="flex items-center gap-1 text-red-400 font-bold text-lg">
                        <Heart size={20}/> {detailCard.health}
                    </div>
                </div>
            )}
            {detailCard.type === 'building' && (
                <div className="flex items-center gap-1 text-red-400 font-bold text-lg mb-3">
                    <Landmark size={20}/> 耐久: {detailCard.health}
                </div>
            )}

            {/* 能力バッジ */}
            <div className="flex gap-1 mb-2 flex-wrap">
              {detailCard.taunt && <span className="bg-red-900/50 text-red-300 px-2 py-1 rounded text-xs border border-red-500 font-bold">🛡️ 挑発</span>}
              {detailCard.haste && <span className="bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500 font-bold">⚡ 速攻</span>}
              {detailCard.bane && <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500 font-bold">☠️ 相討ち</span>}
              {detailCard.elusive && <span className="bg-green-900/50 text-green-300 px-2 py-1 rounded text-xs border border-green-500 font-bold">🍃 回避</span>}
            </div>

            {/* 説明文 */}
            <div className="bg-slate-800/50 p-2 rounded text-sm text-slate-300 leading-relaxed border border-white/10">
                {detailCard.description}
                {detailCard.onDeath && <div className="mt-1 text-purple-300 text-xs">※ 破壊時効果あり</div>}
                {detailCard.onAttack && <div className="mt-1 text-orange-300 text-xs">※ 攻撃時効果あり</div>}
                {detailCard.onDrawTrigger && <div className="mt-1 text-blue-300 text-xs">※ ドロー時効果あり</div>}
                {detailCard.turnEnd && <div className="mt-1 text-yellow-300 text-xs">※ ターン終了時効果あり</div>}
            </div>
            
            <div className="mt-2 text-[10px] text-slate-500 text-right">右クリックで詳細表示中</div>
        </div>
    );
};

export default CardDetailModal;