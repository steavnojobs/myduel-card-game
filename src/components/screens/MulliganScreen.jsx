import React, { useState, useEffect } from 'react';
import Card from '../game/Card';
import { Clock } from 'lucide-react'; // 時計アイコン

export default function MulliganScreen({ hand, onSubmit, isWaiting }) {
    // 交換したいカードのインデックスを管理
    const [selectedIndices, setSelectedIndices] = useState([]);
    // 残り時間 (30秒)
    const [timeLeft, setTimeLeft] = useState(30);

    // カードの選択・解除
    const toggleCard = (index) => {
        if (isWaiting) return; // 待機中は操作不可
        setSelectedIndices(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index) 
                : [...prev, index]
        );
    };

    // 決定処理
    const handleSubmit = () => {
        if (isWaiting) return;
        onSubmit(selectedIndices);
    };

    // タイマー処理
    useEffect(() => {
        // 待機中ならタイマー不要
        if (isWaiting) return;

        // 1秒ごとにカウントダウン
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // 0になったら強制送信！
                    // ※ ここで直接 onSubmit を呼ぶと最新の selectedIndices が取れないことがあるので
                    //   stateに依存しない形にするか、このまま呼んで次のレンダリングに任せる
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isWaiting]);

    // 時間切れ監視
    useEffect(() => {
        if (timeLeft === 0 && !isWaiting) {
            console.log("Time's up! Force submitting mulligan.");
            onSubmit(selectedIndices);
        }
    }, [timeLeft, isWaiting, selectedIndices, onSubmit]);

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-in fade-in">
            
            {/* 待機中の表示 */}
            {isWaiting ? (
                <div className="text-center animate-pulse">
                    <h2 className="text-4xl font-black text-white mb-4">WAITING...</h2>
                    <p className="text-slate-400">相手の選択を待っています</p>
                </div>
            ) : (
                <>
                    {/* ヘッダー & タイマー */}
                    <div className="absolute top-10 flex flex-col items-center gap-2">
                        <h2 className="text-3xl font-bold text-white tracking-widest">MULLIGAN</h2>
                        <p className="text-slate-400 text-sm">交換したいカードを選んでください</p>
                        
                        {/* タイマー表示 */}
                        <div className={`flex items-center gap-2 text-2xl font-black px-6 py-2 rounded-full border-2 transition-all ${
                            timeLeft <= 10 ? 'text-red-500 border-red-500 bg-red-950/50 animate-pulse' : 'text-blue-400 border-blue-500 bg-blue-950/50'
                        }`}>
                            <Clock size={24} />
                            {timeLeft}
                        </div>
                    </div>

                    {/* 手札リスト */}
                    <div className="flex gap-4 mb-12 px-8 perspective-1000">
                        {hand.map((card, index) => {
                            const isSelected = selectedIndices.includes(index);
                            return (
                                <div 
                                    key={card.uid}
                                    onClick={() => toggleCard(index)}
                                    className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                                        isSelected ? '-translate-y-8 z-10' : 'translate-y-0'
                                    }`}
                                >
                                    {/* 選択中のバツ印 */}
                                    {isSelected && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-lg backdrop-blur-sm border-2 border-red-500">
                                            <span className="text-red-500 font-bold text-xl">CHANGE</span>
                                        </div>
                                    )}
                                    
                                    {/* カード本体 */}
                                    <div className={isSelected ? 'opacity-50' : 'opacity-100'}>
                                        <Card card={card} location="hand" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 決定ボタン */}
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-full font-black text-xl shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                    >
                        決定
                    </button>
                </>
            )}
        </div>
    );
}