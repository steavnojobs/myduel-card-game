import React, { useMemo } from 'react';
import { ArrowLeft, Save, Trash2, RotateCcw } from 'lucide-react';
import { CARD_DATABASE } from '../../data/cards'; 
import { getCard } from '../../utils/helpers';
import Card from '../game/Card';

// 定数
const DECK_SIZE = 30;
const MAX_COPIES = 3;

export default function DeckBuilder({ myDeckIds, setMyDeckIds, onBack, onContextMenu, onBackgroundClick }) {

  // デッキの分析データ
  const deckAnalysis = useMemo(() => {
    const counts = { unit: 0, spell: 0, building: 0 };
    const costCurve = [0, 0, 0, 0, 0, 0, 0, 0]; // 0~7+
    
    myDeckIds.forEach(id => {
      const card = getCard(id);
      if (!card) return;
      
      // タイプカウント
      if (counts[card.type] !== undefined) counts[card.type]++;
      
      // マナカーブ
      const costIndex = Math.min(card.cost, 7);
      costCurve[costIndex]++;
    });

    return { counts, costCurve };
  }, [myDeckIds]);

  // ★共通のソート関数 (IDを受け取って比較)
  const sortDeckIds = (ids) => {
    return [...ids].sort((idA, idB) => {
      const cardA = getCard(idA);
      const cardB = getCard(idB);
      // 1. まずコストで比較
      if (cardA.cost !== cardB.cost) {
        return cardA.cost - cardB.cost;
      }
      // 2. コストが同じならIDで比較
      return cardA.id - cardB.id;
    });
  };

  // カードを追加
  const addCard = (card) => {
    if (myDeckIds.length >= DECK_SIZE) return;
    const currentCount = myDeckIds.filter(id => id === card.id).length;
    if (currentCount >= MAX_COPIES) return;
    
    // 追加して、即座にソート！
    const newDeck = [...myDeckIds, card.id];
    setMyDeckIds(sortDeckIds(newDeck));
  };

  // カードを削除
  const removeCard = (indexToRemove) => {
    const newDeck = myDeckIds.filter((_, index) => index !== indexToRemove);
    setMyDeckIds(newDeck);
  };

  const getCountInDeck = (cardId) => myDeckIds.filter(id => id === cardId).length;

  // ★カードプールの表示用データ (ここで事前にソートしておく！)
  const sortedCardPool = useMemo(() => {
    return CARD_DATABASE
      .filter(c => !c.token && c.id < 900)
      .sort((a, b) => {
        // 1. コスト昇順
        if (a.cost !== b.cost) return a.cost - b.cost;
        // 2. ID昇順
        return a.id - b.id;
      });
  }, []);

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
             const validCards = CARD_DATABASE.filter(c => !c.token && c.id < 900);
             while (randomDeck.length < DECK_SIZE) {
               const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
               const currentCount = randomDeck.filter(id => id === randomCard.id).length;
               if (currentCount < MAX_COPIES) {
                 randomDeck.push(randomCard.id);
               }
             }
             // ★ここでも共通のソート関数を使う！
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

        {/* LEFT: カードプール (ソート済みリストを使用) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900/50 custom-scrollbar">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 pb-20">
            {sortedCardPool.map((card) => {
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
                   {/* カード画像もドラッグ無効(draggable=false)にしておく */}
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
          </div>
        </div>

        {/* RIGHT: デッキ情報 & リスト */}
        <div className="w-80 md:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 shadow-2xl z-10">
          
          {/* 1. マナカーブ (棒グラフ) */}
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

          {/* 2. タイプ別カウント */}
          <div className="flex divide-x divide-slate-800 border-b border-slate-800 bg-slate-900/80 text-xs font-bold text-slate-300">
             <div className="flex-1 py-2 text-center flex flex-col">
               <span className="text-[10px] text-slate-500">UNIT</span>
               <span className="text-yellow-400 text-lg">{deckAnalysis.counts.unit}</span>
             </div>
             <div className="flex-1 py-2 text-center flex flex-col">
               <span className="text-[10px] text-slate-500">SPELL</span>
               <span className="text-cyan-400 text-lg">{deckAnalysis.counts.spell}</span>
             </div>
             <div className="flex-1 py-2 text-center flex flex-col">
               <span className="text-[10px] text-slate-500">BUILDING</span>
               <span className="text-orange-400 text-lg">{deckAnalysis.counts.building}</span>
             </div>
          </div>

          {/* 3. デッキ内容 (極小カードリスト) */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-900/30">
            {myDeckIds.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                <div className="text-4xl">🎴</div>
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
                        {/* イラスト */}
                        <img 
                          src={`/images/cards/${card.id}.webp`} 
                          draggable={false}
                          className="absolute inset-[2.5%] w-[95%] h-[95%] object-cover rounded-sm bg-slate-800"
                          alt={card.name}
                        />
                        {/* 枠 */}
                        <img 
                          src="/images/frame.png" 
                          draggable={false}
                          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                          alt="frame"
                        />
                        
                        {/* コストバッジ (左上) */}
                        <div className="absolute top-[2%] left-[2%] w-[25%] aspect-square bg-blue-600 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black text-white shadow-md border border-white/30 z-20">
                          {card.cost}
                        </div>

                        {/* ★追加: ステータス表示 (極小版) ★ */}
                        {card.type === 'unit' && (
                          <>
                            {/* ⚔️ 攻撃力 (左下) */}
                            <div className="absolute bottom-[3%] left-[3%] w-[24%] aspect-square z-20">
                              <img 
                                src="/images/attack_icon.png" 
                                className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
                                draggable={false}
                              />
                              <div className="absolute inset-0 flex items-center justify-center font-black text-white text-[7px] md:text-[9px] pt-[1px] drop-shadow-md">
                                {card.attack}
                              </div>
                            </div>

                            {/* ♥ 体力 (右下) */}
                            <div className="absolute bottom-[3%] right-[3%] w-[24%] aspect-square z-20">
                              <img 
                                src="/images/health_icon.png" 
                                className="absolute inset-0 w-full h-full object-contain drop-shadow-md"
                                draggable={false}
                              />
                              <div className="absolute inset-0 flex items-center justify-center font-black text-white text-[7px] md:text-[9px] pt-[1px] drop-shadow-md">
                                {card.currentHp !== undefined ? card.currentHp : card.health}
                              </div>
                            </div>
                          </>
                        )}
                        {/* ------------------------------------ */}

                      </div>
                      
                      {/* 削除ホバーエフェクト */}
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