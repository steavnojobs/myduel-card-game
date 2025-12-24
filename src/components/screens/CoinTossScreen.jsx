import React, { useEffect, useState } from 'react';

export default function CoinTossScreen({ isMyTurn, onComplete }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // マウント時にアニメーション開始
        setShow(true);

        // ★修正: 3000(3秒) を 5000(5秒) に変更！
        // 好きな数字に変えて調整してね！ (1000 = 1秒)
        const timer = setTimeout(() => {
            if (onComplete) {
                onComplete();
            }
        }, 3000); 

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-500">
            {/* 装飾円 */}
            <div className={`absolute w-[500px] h-[500px] rounded-full border-4 opacity-20 animate-spin-slow ${isMyTurn ? 'border-blue-500' : 'border-red-500'}`}></div>
            <div className={`absolute w-[300px] h-[300px] rounded-full border-2 opacity-40 animate-reverse-spin ${isMyTurn ? 'border-blue-400' : 'border-red-400'}`}></div>

            {/* メインテキスト */}
            <div className={`transform transition-all duration-700 ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10'}`}>
                <h1 className="text-6xl md:text-8xl font-black italic tracking-widest text-center drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]">
                    <span className={`bg-clip-text text-transparent bg-gradient-to-b ${isMyTurn ? 'from-blue-300 to-blue-600' : 'from-red-300 to-red-600'}`}>
                        {isMyTurn ? 'YOU GO' : 'YOU GO'}
                    </span>
                    <br />
                    <span className={`text-7xl md:text-9xl ${isMyTurn ? 'text-blue-100' : 'text-red-100'}`}>
                        {isMyTurn ? 'FIRST' : 'SECOND'}
                    </span>
                </h1>
                
                <div className="mt-8 flex justify-center">
                    <div className={`px-6 py-2 rounded-full border-2 font-bold tracking-widest text-xl animate-pulse ${isMyTurn ? 'border-blue-500 text-blue-400' : 'border-red-500 text-red-400'}`}>
                        {isMyTurn ? 'あなたのターンから始まります' : '相手のターンから始まります'}
                    </div>
                </div>
            </div>
        </div>
    );
}