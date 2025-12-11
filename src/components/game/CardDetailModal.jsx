import React from 'react';
// Xアイコンはもう使わないので削除してOK！
// import { X } from 'lucide-react'; 
import Card from './Card'; 

const CardDetailModal = ({ detailCard, onClose }) => {
  if (!detailCard) return null;

  return (
    // ★修正1: 画面全体を覆う透明なクリッカブル領域を作る (fixed inset-0)
    // これなら背景（カードプール）は丸見えだけど、クリック判定は拾える！
    <div 
      className="fixed inset-0 z-[100] bg-transparent"
      onClick={onClose} // どこを押しても閉じる！
    >
      {/* 詳細ウィンドウ本体 */}
      {/* 左上(top-8 left-8)に固定配置！ */}
      <div 
        className="absolute top-8 left-8 bg-slate-900/95 border border-slate-700 rounded-2xl w-[800px] max-w-[90vw] flex flex-row overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-300 origin-top-left scale-90"
        onClick={(e) => e.stopPropagation()} // ウィンドウの中をクリックした時は閉じないようにする
      >
        
        {/* ★修正2: 閉じるボタンは削除しました！スッキリ！★ */}

        {/* --- 左側：巨大カード表示エリア --- */}
        <div className="bg-slate-950 p-6 flex items-center justify-center w-1/2 border-r border-slate-800 relative overflow-hidden group">
          
          {/* 背景ボカシ画像 */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img 
              src={`/images/cards/${detailCard.id}.webp`} 
              className="w-full h-full object-cover blur-xl scale-150"
              alt=""
            />
          </div>

          {/* 巨大カード */}
          <div className="relative z-10 scale-90 transition-transform duration-500 group-hover:scale-100">
            <Card 
              card={detailCard} 
              location="detail" 
            />
          </div>
        </div>

        {/* --- 右側：詳細テキスト情報エリア --- */}
        <div className="p-6 w-1/2 flex flex-col gap-4 text-white max-h-[600px] overflow-y-auto custom-scrollbar">
          
          {/* 名前とコスト */}
          <div className="border-b border-slate-700 pb-3">
            <div className="flex items-center justify-between mb-1">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{detailCard.type.toUpperCase()}</span>
               <div className="flex items-center gap-1 bg-blue-900/50 px-3 py-1 rounded-full border border-blue-500/30">
                 <span className="text-blue-300 text-xs font-bold">COST</span>
                 <span className="text-xl font-black text-white">{detailCard.cost}</span>
               </div>
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 leading-tight">
              {detailCard.name}
            </h2>
          </div>

          {/* ステータス (ユニットのみ) */}
          {detailCard.type === 'unit' && (
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-800/50 rounded-lg p-2 border border-slate-700 flex items-center gap-2">
                 <img src="/images/attack_icon.png" className="w-8 h-8 object-contain" alt="ATK" />
                 <div>
                   <div className="text-[9px] text-slate-400 font-bold">ATTACK</div>
                   <div className="text-2xl font-black text-white leading-none">{detailCard.attack}</div>
                 </div>
              </div>
              <div className="flex-1 bg-slate-800/50 rounded-lg p-2 border border-slate-700 flex items-center gap-2">
                 <img src="/images/health_icon.png" className="w-8 h-8 object-contain" alt="HP" />
                 <div>
                   <div className="text-[9px] text-slate-400 font-bold">HEALTH</div>
                   <div className="text-2xl font-black text-white leading-none">{detailCard.health}</div>
                 </div>
              </div>
            </div>
          )}

          {/* 効果テキスト */}
          <div className="flex-1">
            <h3 className="text-xs font-bold text-slate-400 mb-1">💎 カード効果</h3>
            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 text-slate-200 text-sm leading-relaxed min-h-[80px]">
              {detailCard.description 
                ? detailCard.description 
                : <span className="text-slate-600 italic">効果なし</span>
              }
            </div>
          </div>

          {/* フレーバーテキスト */}
          <div className="text-[10px] text-slate-500 italic text-right border-t border-slate-800 pt-2">
            {detailCard.flavorText ? `"${detailCard.flavorText}"` : "No flavor text available."}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;