import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Trash2, RotateCcw, Swords, Zap, Home, Grid } from 'lucide-react';
import { CARD_DATABASE } from '../../data/cards'; 
import { getCard } from '../../utils/helpers';
import Card from '../game/Card';

// 定数
const DECK_SIZE = 40;
const MAX_COPIES = 3;

export default function DeckBuilder({ myDeckIds, setMyDeckIds, onBack, onContextMenu, onBackgroundClick }) {

  // 表示するカードの種類を管理
  const [filterType, setFilterType] = useState('all'); // 'all', 'unit', 'spell', 'building'

  // デッキの分析データ
  const deckAnalysis = useMemo(() => {
    const counts = { unit: 0, spell: 0, building: 0 };
    const costCurve = [0, 0, 0, 0, 0, 0, 0, 0]; // 0~7+
    
    myDeckIds.forEach(id => {
      const card = getCard(id);
      if (!card) return;
      
      if (counts[card.type] !== undefined) counts[card.type]++;
      const costIndex = Math.min(card.cost, 7);
      costCurve[costIndex]++;
    });

    return { counts, costCurve };
  }, [myDeckIds]);

  // ソート関数
  const sortDeckIds = (ids) => {
    return [...ids].sort((idA, idB) => {
      const cardA = getCard(idA);
      const cardB = getCard(idB);
      if (cardA.cost !== cardB.cost) return cardA.cost - cardB.cost;
      return cardA.id - cardB.id;
    });
  };

  const addCard = (card) => {
    if (myDeckIds.length >= DECK_SIZE) return;
    const currentCount = myDeckIds.filter(id => id === card.id).length;
    if (currentCount >= MAX_COPIES) return;
    
    const newDeck = [...myDeckIds, card.id];
    setMyDeckIds(sortDeckIds(newDeck));
  };

  const removeCard = (indexToRemove) => {
    const newDeck = myDeckIds.filter((_, index) => index !== indexToRemove);
    setMyDeckIds(newDeck);
  };

  const getCountInDeck = (cardId) => myDeckIds.filter(id => id === cardId).length;

  // フィルタリング機能を追加したカードプール
  const filteredCardPool = useMemo(() => {
    return CARD_DATABASE
      // ★修正: ユーザー指定！ ID 9000未満 (トークン除外) を表示！
      .filter(c => !c.token && c.id < 9000) 
      .filter(c => filterType === 'all' || c.type === filterType)
      .sort((a, b) => {
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.id - b.id;
      });
  }, [filterType]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans select-none overflow-hidden" onClick={onBackgroundClick}>
      
      {/* --- ヘッダーエリア --- */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} /> 戻る
          </button>
          <div className="h-8 w-px bg-slate-700 mx-2"></div>
          <h2 className="text-xl font-bold flex items-center gap-3">
            🛠️ デッキ構築 
            <span className={`text-2xl font-black ${myDeckIds.length === DECK_SIZE ? 'text-green-400' : 'text-yellow-400'}`}>
              {myDeckIds.length} / {DECK_SIZE}
            </span>
          </h2>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setMyDeckIds([])} className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/30 rounded transition text-sm">
            <Trash2 size={16}/> 全削除
          </button>
          
          <button onClick={() => {
             const randomDeck = [];
             // ★修正: ここも ID 9000未満 から選ぶように変更！
             const validCards = CARD_DATABASE.filter(c => !c.token && c.id < 9000);
             while (randomDeck.length < DECK_SIZE) {
               const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
               const currentCount = randomDeck.filter(id => id === randomCard.id).length;
               if (currentCount < MAX_COPIES) {
                 randomDeck.push(randomCard.id);
               }
             }
             setMyDeckIds(sortDeckIds(randomDeck));
          }} className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:bg-blue-900/30 rounded transition text-sm">
            <RotateCcw size={16}/> おまかせ
          </button>

          <button onClick={() => {
              localStorage.setItem('my_duel_deck', JSON.stringify(myDeckIds));
              alert('保存しました！');
          }} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold shadow-lg transition flex items-center gap-2">
            <Save size={18}/> 保存
          </button>
        </div>
      </header>

      {/* --- メインエリア --- */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: カードプール */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
          
          {/* カテゴリ切り替えタブ */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20 overflow-x-auto custom-scrollbar">
             {[
               { id: 'all', label: 'すべて', icon: Grid, color: 'text-white' },
               { id: 'unit', label: 'ユニット', icon: Swords, color: 'text-yellow-400' },
               { id: 'spell', label: 'スペル', icon: Zap, color: 'text-cyan-400' },
               { id: 'building', label: '建物', icon: Home, color: 'text-orange-400' },
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setFilterType(tab.id)}
                 className={`
                   flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap
                   ${filterType === tab.id 
                     ? 'bg-slate-700 text-white shadow-lg ring-2 ring-slate-500 scale-105' 
                     : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}
                 `}
               >
                 <tab.icon size={16} className={filterType === tab.id ? tab.color : ''} />
                 {tab.label}
               </button>
             ))}
          </div>

          {/* カードリスト */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 pb-20">
              {filteredCardPool.map((card) => {
                const count = getCountInDeck(card.id);
                const isMaxed = count >= MAX_COPIES;

                return (
                  <div 
                    key={card.id} 
                    className="relative group cursor-grab active:cursor-grabbing"
                    draggable="true"
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify(card));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                  >
                     <div className="pointer-events-none absolute inset-0 z-10"></div>
                     <Card 
                       card={card} 
                       location="library" 
                       count={count} 
                       maxCount={MAX_COPIES}
                       onClick={() => addCard(card)}
                       onContextMenu={(e) => onContextMenu(e, card)}
                     />
                     
                     {!isMaxed && (
                       <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition pointer-events-none rounded-lg border-2 border-blue-400"></div>
                     )}
                  </div>
                );
              })}
              
              {filteredCardPool.length === 0 && (
                <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-500">
                  <div className="text-4xl mb-2">📦</div>
                  <p>カードが見つかりません</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: デッキ情報 & リスト */}
        <div className="w-80 md:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 shadow-2xl z-10">
          
          {/* マナカーブ */}
          <div className="p-4 border-b border-slate-800 bg-slate-900">
            <h3 className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Mana Curve</h3>
            <div className="flex items-end justify-between h-24 gap-1.5 px-1 pb-1">
              {deckAnalysis.costCurve.map((count, cost) => {
                const maxVal = Math.max(...deckAnalysis.costCurve, 1);
                const heightPercent = count > 0 ? (count / maxVal) * 100 : 0;
                
                return (
                  <div key={cost} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full h-full bg-slate-800/50 rounded-t-sm relative overflow-hidden flex items-end">
                       <div 
                         className="w-full bg-blue-500 hover:bg-blue-400 transition-all duration-500" 
                         style={{ height: `${heightPercent}%` }}
                       ></div>
                       {count > 0 && (
                          <div className="absolute w-full text-center text-[9px] font-bold text-white bottom-1 pointer-events-none shadow-black drop-shadow-md">
                            {count}
                          </div>
                       )}
                    </div>
                    <span className={`text-[10px] font-bold ${count > 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                      {cost === 7 ? '7+' : cost}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* タイプ別カウント */}
          <div className="flex divide-x divide-slate-800 border-b border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-300">
             <div className={`flex-1 py-2 text-center flex flex-col cursor-pointer hover:bg-slate-800 transition ${filterType === 'unit' ? 'bg-slate-800' : ''}`} onClick={() => setFilterType('unit')}>
               <span className="text-[10px] text-slate-500">UNIT</span>
               <span className="text-yellow-400 text-lg">{deckAnalysis.counts.unit}</span>
             </div>
             <div className={`flex-1 py-2 text-center flex flex-col cursor-pointer hover:bg-slate-800 transition ${filterType === 'spell' ? 'bg-slate-800' : ''}`} onClick={() => setFilterType('spell')}>
               <span className="text-[10px] text-slate-500">SPELL</span>
               <span className="text-cyan-400 text-lg">{deckAnalysis.counts.spell}</span>
             </div>
             <div className={`flex-1 py-2 text-center flex flex-col cursor-pointer hover:bg-slate-800 transition ${filterType === 'building' ? 'bg-slate-800' : ''}`} onClick={() => setFilterType('building')}>
               <span className="text-[10px] text-slate-500">BUILDING</span>
               <span className="text-orange-400 text-lg">{deckAnalysis.counts.building}</span>
             </div>
          </div>

          {/* デッキ内容 (極小カードリスト) */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-900/30">
            {myDeckIds.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                <div className="text-4xl"></div>
                <p className="text-sm">カードを選んでね！</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1.5 content-start">
                {myDeckIds.map((id, index) => {
                  const card = getCard(id);
                  return (
                    <div 
                      key={`${id}-${index}`} 
                      onClick={() => removeCard(index)}
                      onContextMenu={(e) => onContextMenu(e, card)}
                      className="relative group cursor-pointer aspect-[2/3] transition-transform hover:scale-105 hover:z-10"
                    >
                      <div className="absolute inset-0 rounded overflow-hidden shadow-md">
                        <img 
                          src={`/images/cards/${card.id}.webp`} 
                          draggable={false}
                          className="absolute inset-[2.5%] w-[95%] h-[95%] object-cover rounded-sm bg-slate-800"
                          alt={card.name}
                        />
                        <img 
                          src="/images/frame.png" 
                          draggable={false}
                          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                          alt="frame"
                        />
                        
                        {/* コストバッジ */}
                        {/* ★修正: 親のdivではなく、バッジ自体に containerType を設定して、中の文字サイズを調整！ */}
                        <div 
                          className="absolute top-[2%] left-[2%] w-[25%] aspect-square bg-blue-600 rounded-full flex items-center justify-center shadow-md border border-white/30 z-20"
                          style={{ containerType: 'size' }}
                        >
                          {/* 50cqwくらいがちょうどいい！ */}
                          <span className="font-black text-white text-[90cqw] pt-[1px]">{card.cost}</span>
                        </div>

                        {card.type === 'unit' && (
                          <>
                            {/* 攻撃力 */}
                            {/* ★修正: ここも containerType を個別に設定！ */}
                            <div 
                              className="absolute bottom-[3%] left-[3%] w-[24%] aspect-square z-20"
                              style={{ containerType: 'size' }}
                            >
                              <img src="/images/attack_icon.png" className="absolute inset-0 w-full h-full object-contain drop-shadow-md" draggable={false}/>
                              <div className="absolute inset-0 flex items-center justify-center font-black text-white text-[90cqw] pt-[1px] drop-shadow-md">{card.attack}</div>
                            </div>
                            
                            {/* 体力 */}
                            {/* ★修正: ここも containerType を個別に設定！ */}
                            <div 
                              className="absolute bottom-[3%] right-[3%] w-[24%] aspect-square z-20"
                              style={{ containerType: 'size' }}
                            >
                              <img src="/images/health_icon.png" className="absolute inset-0 w-full h-full object-contain drop-shadow-md" draggable={false}/>
                              <div className="absolute inset-0 flex items-center justify-center font-black text-white text-[90cqw] pt-[1px] drop-shadow-md">{card.currentHp !== undefined ? card.currentHp : card.health}</div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded z-30">
                        <Trash2 size={16} className="text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}