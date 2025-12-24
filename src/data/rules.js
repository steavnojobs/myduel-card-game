// ゲームの基本ルール定数

export const INITIAL_HP = 20;       // 初期の体力
export const INITIAL_MANA = 0;      // 初期のマナ
export const MAX_MANA = 10;         // 現在のマナの最大値
export const MAX_MANA_LIMIT = 10;   // ★追加: マナの絶対上限 (これをuseGameActionsが探してた！)

export const DECK_SIZE = 30;        // デッキの枚数
export const MAX_COPIES_IN_DECK = 3;// 同名カードの最大枚数

export const EFFECT_DELAY = 600;    // エフェクトの待機時間(ms)

export const MAX_HAND_SIZE = 10;    // 手札の最大枚数
export const MAX_BOARD_SIZE = 7;    // 盤面に置けるユニットの最大数