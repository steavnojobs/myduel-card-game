import { useEffect } from 'react';

export const useGameControls = ({
    gameData,
    myRole,
    view,
    isPhaseLocked,
    // State類
    targetingHandCard, setTargetingHandCard,
    aimingState, setAimingState,
    detailCard, setDetailCard,
    isDragging, setIsDragging,
    isRightClickHeld, // useRef
    // Actions
    attack,
    initiatePlayCard
}) => {

    // --- グローバルイベント (右クリックキャンセルなど) ---
    useEffect(() => {
        const handleGlobalContextMenu = (e) => { 
            e.preventDefault(); 
            if (targetingHandCard) {
                setTargetingHandCard(null); 
            } 
        };
        
        const handleGlobalClick = (e) => {
            if (view !== 'game' && detailCard) {
                 setDetailCard(null);
            }
        };

        document.addEventListener('contextmenu', handleGlobalContextMenu);
        document.addEventListener('click', handleGlobalClick);
        return () => { 
            document.removeEventListener('contextmenu', handleGlobalContextMenu);
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [targetingHandCard, view, detailCard, setTargetingHandCard, setDetailCard]);

    // --- マウス操作 (詳細表示 & エイミング矢印) ---
    useEffect(() => {
        if (view !== 'game') return;

        const findCardFromEvent = (target) => {
            const unitEl = target.closest('[id^="unit-"]');
            if (unitEl && gameData) {
                const uid = unitEl.id.replace('unit-', '');
                const allUnits = [...(gameData.host.board || []), ...(gameData.guest.board || [])];
                return allUnits.find(u => u.uid === uid);
            }
            const handEl = target.closest('[id^="hand-"]');
            if (handEl && gameData) {
                const uid = handEl.id.replace('hand-', '');
                const myHand = gameData[myRole]?.hand || [];
                return myHand.find(c => c.uid === uid);
            }
            return null;
        };

        const handleMouseDown = (e) => {
            if (e.button === 2) { 
                isRightClickHeld.current = true;
                const card = findCardFromEvent(e.target);
                if (card) setDetailCard(card);
            }
        };

        const handleMouseUp = (e) => {
            if (e.button === 2) { 
                isRightClickHeld.current = false;
                setDetailCard(null); 
            }
        };

        const handleMouseMove = (e) => {
            if (aimingState) {
                setAimingState(prev => ({ ...prev, currentPos: { x: e.clientX, y: e.clientY } }));
            }
            if (isRightClickHeld.current) {
                const card = findCardFromEvent(e.target);
                if (card && card.uid !== detailCard?.uid) {
                    setDetailCard(card);
                } else if (!card) {
                    setDetailCard(null);
                }
            }
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [view, gameData, aimingState, detailCard, myRole, isRightClickHeld, setDetailCard, setAimingState]);

    // --- エイミング終了 (攻撃実行) ---
    useEffect(() => {
        const handleMouseUpAim = (e) => {
            if (aimingState) {
                const element = document.elementFromPoint(e.clientX, e.clientY);
                const unitTarget = element?.closest('[id^="unit-"]');
                const faceTarget = element?.closest('#enemy-face');

                if (unitTarget) {
                    const targetUid = unitTarget.id.replace('unit-', '');
                    attack('unit', targetUid, aimingState.attackerUid);
                } else if (faceTarget) {
                    attack('face', null, aimingState.attackerUid);
                }
                setAimingState(null);
            }
        };
        if (aimingState) window.addEventListener('mouseup', handleMouseUpAim);
        return () => { if (aimingState) window.removeEventListener('mouseup', handleMouseUpAim); };
    }, [aimingState, attack, setAimingState]); 

    // --- ハンドラー関数 ---

    const handleBoardDragStart = (e, unit) => {
        if (e.button !== 0) return;
        if (isPhaseLocked) return;
        
        // 攻撃可能なユニットかチェック
        if (gameData && gameData.currentTurn === myRole && gameData.turnPhase === 'main' && unit.canAttack && unit.type !== 'building') {
            const rect = e.currentTarget.getBoundingClientRect();
            setAimingState({ 
                attackerUid: unit.uid, 
                startPos: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, 
                currentPos: { x: e.clientX, y: e.clientY } 
            });
        }
    };

    const handleContextMenu = (e, card) => { 
        e.preventDefault(); 
        if (view !== 'game') setDetailCard(card); 
    };

    const handleBackgroundClick = () => { 
        if (detailCard && view !== 'game') setDetailCard(null); 
    };

    const handleGameDragStart = (e, card, origin) => { 
        if (isPhaseLocked) return;
        setIsDragging(true); 
        e.dataTransfer.setData("application/json", JSON.stringify({ id: card.id, card: card, origin: origin })); 
    };

    const handleGameDragEnd = () => setIsDragging(false);

    const handleGameDrop = (e, target) => { 
        e.preventDefault(); 
        setIsDragging(false); 
        try { 
            const data = JSON.parse(e.dataTransfer.getData("application/json")); 
            if (target === 'board' && data.origin === 'hand') {
                initiatePlayCard(data.card);
            }
        } catch (err) {} 
    };

    return {
        handleBoardDragStart,
        handleContextMenu,
        handleBackgroundClick,
        handleGameDragStart,
        handleGameDragEnd,
        handleGameDrop
    };
};