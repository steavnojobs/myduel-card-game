import React, { useEffect, useRef } from 'react';
import { X, ScrollText } from 'lucide-react';

const LogModal = ({ logs, onClose }) => {
    const bottomRef = useRef(null);

    // 開いた時に一番下（最新）までスクロール
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-start p-4 md:p-8 animate-in fade-in duration-200 pointer-events-none">
            {/* ポインターイベントを有効にして操作可能にする */}
            <div className="pointer-events-auto bg-slate-900/95 border border-slate-600 rounded-lg shadow-2xl w-full max-w-md h-[60vh] flex flex-col overflow-hidden mt-16 md:mt-20">
                
                {/* ヘッダー */}
                <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-950">
                    <div className="flex items-center gap-2 text-slate-200 font-bold">
                        <ScrollText size={18} />
                        <span>ACTION LOG</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* ログリスト */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                    {logs.length === 0 ? (
                        <div className="text-slate-500 text-center py-10">履歴はありません</div>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                                <div className="text-slate-500 text-xs mt-0.5 whitespace-nowrap">
                                    Turn {log.turn}
                                </div>
                                <div className="text-slate-300 border-l-2 border-slate-700 pl-3 leading-relaxed">
                                    {log.text}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
};

export default LogModal;