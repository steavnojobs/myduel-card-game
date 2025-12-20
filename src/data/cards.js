export const CARD_DATABASE = [
  // --- 🔥 イグニス (Ignis) / 炎・攻撃 ---
  {
    "id": 5, "class": "Ignis", "type": "unit", "name": "炎の魔導士", "cost": 5, "attack": 4, "health": 4,
    "description": "【登場時】敵プレイヤーに3ダメージ。",
    "onPlay": { "type": "damage_face", "value": 3, "target": "face" }
  },
  {
    "id": 7, "class": "Ignis", "type": "unit", "name": "ドラゴン", "cost": 8, "attack": 8, "health": 8,
    "description": "【攻撃時】マナ+1。【ターン終了時】手札に「ファイアボール」を加える。",
    "turnEnd": { "type": "generate_card", "value": 1001 },
    "onAttack": { "type": "add_mana", "value": 1 }
  },
  {
    "id": 9, "class": "Ignis", "type": "unit", "name": "疾風の狼", "cost": 2, "attack": 3, "health": 1,
    "description": "【速攻】", "haste": true
  },
  {
    "id": 11, "class": "Ignis", "type": "unit", "name": "爆弾魔", "cost": 4, "attack": 3, "health": 3,
    "description": "【登場時】敵全体に1ダメージ。",
    "onPlay": { "type": "damage_all", "value": 1, "target": "enemy_unit" }
  },
  {
    "id": 17, "class": "Ignis", "type": "unit", "name": "自爆特攻ドローン", "cost": 1, "attack": 1, "health": 1,
    "description": "【速攻】【破壊時】敵リーダーに2ダメージ。",
    "haste": true, "onDeath": { "type": "damage_face", "value": 2 }
  },
  {
    "id": 25, "class": "Ignis", "type": "unit", "name": "怒れる牛", "cost": 3, "attack": 3, "health": 3,
    "description": "【攻撃時】攻撃力+1。",
    "onAttack": { "type": "buff_self_attack", "value": 1 }
  },
  {
    "id": 44, "class": "Ignis", "type": "unit", "name": "伝説のドラゴン", "cost": 9, "attack": 2, "health": 9,
    "description": "【ターン終了時】手札に「ドラゴンの息吹」を加える。",
    "turnEnd": { "type": "generate_card", "value": 9008 }
  },
  {
    "id": 51, "class": "Ignis", "type": "unit", "name": "突進する狂戦士", "cost": 4, "attack": 2, "health": 3,
    "description": "【速攻】【聖なる盾】", "haste": true, "divineShield": true
  },
  {
    "id": 1001, "class": "Ignis", "type": "spell", "name": "ファイアボール", "cost": 2,
    "description": "ランダムな敵1体に3ダメージ。",
    "onPlay": { "type": "damage_random", "value": 3, "target": "enemy_unit" }
  },
  {
    "id": 1004, "class": "Ignis", "type": "spell", "name": "雷撃", "cost": 4,
    "description": "敵プレイヤーに5ダメージ。",
    "onPlay": { "type": "damage_face", "value": 5, "target": "face" }
  },
  {
    "id": 1010, "class": "Ignis", "type": "spell", "name": "メテオ", "cost": 7,
    "description": "敵全体とプレイヤーに4ダメージ。",
    "onPlay": [{ "type": "damage_all", "value": 4, "target": "enemy_unit" }, { "type": "damage_face", "value": 4 }]
  },
  {
    "id": 1014, "class": "Ignis", "type": "spell", "name": "インパクト・ブロー", "cost": 2,
    "description": "敵ユニット1体に2ダメージを与え、その隣接するユニットに1ダメージを与える。",
    "onPlay": { "type": "chain_lightning", "primary": 2, "secondary": 1, "target": "enemy_unit" }
  },
  {
    "id": 1016, "class": "Ignis", "type": "spell", "name": "連鎖する稲妻", "cost": 3,
    "description": "敵ユニット1体に3ダメージを与え、その隣接するユニットに1ダメージを与える。",
    "onPlay": { "type": "chain_lightning", "primary": 3, "secondary": 1, "target": "enemy_unit" }
  },

  // --- 💧 アクア (Aqua) / 水・魔法 ---
  {
    "id": 18, "class": "Aqua", "type": "unit", "name": "マナワーム", "cost": 1, "attack": 1, "health": 3,
    "description": "【ドロー時】攻撃力+1。",
    "onDrawTrigger": { "type": "buff_self_attack", "value": 1 }
  },
  {
    "id": 28, "class": "Aqua", "type": "unit", "name": "研究者", "cost": 4, "attack": 2, "health": 3,
    "description": "【登場時】カードを1枚引く。",
    "onPlay": { "type": "draw", "value": 1 }
  },
  {
    "id": 33, "class": "Aqua", "type": "unit", "name": "氷の精霊", "cost": 1, "attack": 1, "health": 1,
    "description": "【登場時】敵1体を凍結させる。",
    "onPlay": { "type": "freeze_enemy", "value": 1, "target": "enemy_unit" }
  },
  {
    "id": 39, "class": "Aqua", "type": "unit", "name": "スペルブレイカー", "cost": 4, "attack": 4, "health": 3,
    "description": "【登場時】敵ユニット1体を沈黙させる。",
    "onPlay": { "type": "silence_unit", "value": 0, "target": "enemy_unit" }
  },
  {
    "id": 42, "class": "Aqua", "type": "unit", "name": "嵐の精霊", "cost": 7, "attack": 5, "health": 5,
    "description": "【破壊時】自身以外の全体に2ダメージ。",
    "onDeath": { "type": "damage_all_other", "value": 2 }
  },
  {
    "id": 43, "class": "Aqua", "type": "unit", "name": "クラーケン", "cost": 8, "attack": 8, "health": 8,
    "description": "【登場時】敵ユニット1体を破壊する。",
    "onPlay": { "type": "destroy", "value": 0, "target": "enemy_unit" }
  },
  {
    "id": 54, "class": "Aqua", "type": "unit", "name": "見習い魔法使い・リリア", "cost": 2, "attack": 1, "health": 3,
    "description": "【登場時】手札に「マジックキャンディ」を加える。",
    "onPlay": { "type": "generate_card", "value": 9000 }
  },
  {
    "id": 1005, "class": "Aqua", "type": "spell", "name": "吹雪", "cost": 5,
    "description": "敵全体に2ダメージ。",
    "onPlay": { "type": "damage_all", "value": 2, "target": "enemy_unit" }
  },
  {
    "id": 1006, "class": "Aqua", "type": "spell", "name": "知識の探求", "cost": 3,
    "description": "カードを2枚引く。",
    "onPlay": { "type": "draw", "value": 2 }
  },
  {
    "id": 1017, "class": "Aqua", "type": "spell", "name": "沈黙の霧", "cost": 5,
    "description": "敵のユニット全体を【沈黙】させる。",
    "onPlay": { "type": "silence_all_enemy" }
  },
  {
    "id": 1018, "class": "Aqua", "type": "spell", "name": "氷瀑", "cost": 2,
    "description": "敵1体を凍結させる。",
    "onPlay": { "type": "freeze_enemy", "value": 1, "target": "enemy_unit" }
  },
  {
    "id": 1023, "class": "Aqua", "type": "spell", "name": "神聖なる恩寵", "cost": 4,
    "description": "相手の手札と同じ枚数になるまでカードを引く。",
    "onPlay": { "type": "draw_until_match_enemy" }
  },

  // --- 🌿 ガイア (Gaia) / 自然・繁栄 ---
  {
    "id": 3, "class": "Gaia", "type": "unit", "name": "エルフの射手", "cost": 3, "attack": 2, "health": 2,
    "description": "【登場時】ランダムな相手のユニットに2ダメージ。",
    "onPlay": { "type": "damage_random", "value": 2, "target": "enemy_unit" }
  },
  {
    "id": 6, "class": "Gaia", "type": "unit", "name": "癒やしの天使", "cost": 3, "attack": 2, "health": 4,
    "description": "【登場時】自分のHPを4回復。",
    "onPlay": { "type": "heal_face", "value": 4 }
  },
  {
    "id": 30, "class": "Gaia", "type": "unit", "name": "マナの古木", "cost": 7, "attack": 2, "health": 10,
    "description": "【挑発】【ドロー時】このユニットのHPを3回復。",
    "taunt": true, "onDrawTrigger": { "type": "heal_self", "value": 3 }
  },
  {
    "id": 34, "class": "Gaia", "type": "unit", "name": "エルフの剣豪", "cost": 2, "attack": 3, "health": 2,
    "description": "【連撃】", "doubleAttack": true
  },
  {
    "id": 50, "class": "Gaia", "type": "unit", "name": "ジャングルパンサー", "cost": 3, "attack": 4, "health": 2,
    "description": "【隠密】", "stealth": true
  },
  {
    "id": 52, "class": "Gaia", "type": "unit", "name": "アースクエイカー", "cost": 5, "attack": 2, "health": 3,
    "description": "【回避】【ターン終了時】自身以外の全体に1ダメージ。",
    "elusive": true, "turnEnd": { "type": "damage_all_other", "value": 1 }
  },
  {
    "id": 56, "class": "Gaia", "type": "unit", "name": "妖精女王・ティターニア", "cost": 7, "attack": 5, "health": 6,
    "description": "【登場時】自分のユニットを手札に戻す。",
    "onPlay": { "type": "return_to_hand", "target": "ally_unit" }
  },
  {
    "id": 1009, "class": "Gaia", "type": "spell", "name": "ドラゴンの卵", "cost": 3,
    "description": "ドラゴンパピー(2/2)を1体出す。",
    "onPlay": { "type": "summon", "value": 9003 }
  },
  {
    "id": 1011, "class": "Gaia", "type": "spell", "name": "急成長", "cost": 2,
    "description": "空のマナクリスタルを1つ得る。",
    "onPlay": { "type": "gain_empty_mana", "value": 1 }
  },
  {
    "id": 2002, "class": "Gaia", "type": "building", "name": "マナの泉", "cost": 2, "health": 3,
    "description": "【ターン終了時】自分のHPを2回復。",
    "turnEnd": { "type": "heal_face", "value": 2 }
  },
  {
    "id": 2007, "class": "Gaia", "type": "building", "name": "精霊のトーテム", "cost": 2, "health": 3,
    "description": "【ターン終了時】ランダムな味方ユニット1体を1回復する。",
    "turnEnd": { "type": "heal_random", "value": 1, "target": "ally_unit" }
  },

  // --- 🛡️ オーダー (Order) / 秩序・防御 ---
  {
    "id": 2, "class": "Order", "type": "unit", "name": "見習い騎士", "cost": 2, "attack": 2, "health": 2,
    "description": "【登場時】手札に「兵士の剣」を加える。",
    "onPlay": { "type": "generate_card", "value": 9006 }
  },
  {
    "id": 4, "class": "Order", "type": "unit", "name": "堅牢な盾兵", "cost": 4, "attack": 0, "health": 6,
    "description": "【挑発】", "taunt": true
  },
  {
    "id": 8, "class": "Order", "type": "unit", "name": "城壁の巨人", "cost": 6, "attack": 1, "health": 8,
    "description": "【挑発】", "taunt": true
  },
  {
    "id": 13, "class": "Order", "type": "unit", "name": "グリフォン", "cost": 5, "attack": 3, "health": 3,
    "description": "【速攻】", "haste": true
  },
  {
    "id": 21, "class": "Order", "type": "unit", "name": "シールドベア", "cost": 2, "attack": 2, "health": 4,
    "description": "【挑発】", "taunt": true
  },
  {
    "id": 27, "class": "Order", "type": "unit", "name": "ドラゴンライダー", "cost": 4, "attack": 2, "health": 2,
    "description": "【速攻】", "haste": true
  },
  {
    "id": 37, "class": "Order", "type": "unit", "name": "聖職者", "cost": 2, "attack": 1, "health": 3,
    "description": "【ターン終了時】ランダムな味方1体を2回復。",
    "turnEnd": { "type": "heal_random", "value": 2, "target": "ally_unit" }
  },
  {
    "id": 38, "class": "Order", "type": "unit", "name": "グリフィンライダー", "cost": 3, "attack": 1, "health": 3,
    "description": "【速攻】【ターン終了時】このユニットを手札に戻す。",
    "haste": true, "turnEnd": { "type": "return_to_hand", "value": 1 }
  },
  {
    "id": 40, "class": "Order", "type": "unit", "name": "重装騎士", "cost": 5, "attack": 6, "health": 6,
    "description": "【聖なる盾】", "divineShield": true
  },
  {
    "id": 48, "class": "Order", "type": "unit", "name": "輝く司祭", "cost": 1, "attack": 1, "health": 3,
    "description": "【登場時】味方ユニット1体を完全回復。",
    "onPlay": { "type": "heal_unit_full", "value": 0, "target": "ally_unit" }
  },
  {
    "id": 53, "class": "Order", "type": "unit", "name": "風の王", "cost": 8, "attack": 3, "health": 5,
    "description": "【速攻】【連撃】【聖なる盾】【挑発】",
    "haste": true, "doubleAttack": true, "divineShield": true, "taunt": true
  },
  {
    "id": 55, "class": "Order", "type": "unit", "name": "癒やしの歌姫・セレーナ", "cost": 4, "attack": 3, "health": 4,
    "description": "【ターン開始時】ランダムな味方を2回復する。攻撃力+1。",
    "turnStart": [{ "type": "heal_random_ally", "value": 2 }, { "type": "buff_self_attack", "value": 1 }]
  },
  {
    "id": 1002, "class": "Order", "type": "spell", "name": "回復の薬", "cost": 1,
    "description": "自分のHPを5回復。",
    "onPlay": { "type": "heal_face", "value": 5 }
  },
  {
    "id": 1003, "class": "Order", "type": "spell", "name": "勇気の叫び", "cost": 2,
    "description": "全味方攻撃+1。",
    "onPlay": { "type": "buff_all_attack", "value": 1 }
  },
  {
    "id": 1007, "class": "Order", "type": "spell", "name": "王の号令", "cost": 4,
    "description": "兵士(2/2)を2体出す。",
    "onPlay": [{ "type": "summon", "value": 9002 }, { "type": "summon", "value": 9002 }]
  },
  {
    "id": 1020, "class": "Order", "type": "spell", "name": "聖なる火", "cost": 7,
    "description": "敵の対象に5ダメージ。自分のHPを5回復。",
    "onPlay": [{ "type": "damage", "value": 5, "target": "all_enemy" }, { "type": "heal_face", "value": 5 }]
  },
  {
    "id": 2001, "class": "Order", "type": "building", "name": "訓練所", "cost": 3, "health": 4,
    "description": "【ターン終了時】全味方攻撃+1。",
    "turnEnd": { "type": "buff_all_attack", "value": 1 }
  },
  {
    "id": 2003, "class": "Order", "type": "building", "name": "防衛塔", "cost": 4, "health": 5,
    "description": "【ターン終了時】ランダムな敵に1ダメージ。",
    "turnEnd": { "type": "damage_random", "value": 1 }
  },
  {
    "id": 2004, "class": "Order", "type": "building", "name": "兵舎", "cost": 5, "health": 4,
    "description": "【ターン終了時】兵士(2/2)を1体出す。",
    "turnEnd": { "type": "summon", "value": 9002 }
  },

  // --- 💀 シャドウ (Shadow) / 闇・死霊 ---
  {
    "id": 12, "class": "Shadow", "type": "unit", "name": "吸血鬼", "cost": 4, "attack": 3, "health": 4,
    "description": "【登場時】ランダムな相手に2ダメージ。自分を2回復。",
    "onPlay": [{ "type": "damage_random", "value": 2, "target": "enemy_unit" }, { "type": "heal_face", "value": 2 }]
  },
  {
    "id": 14, "class": "Shadow", "type": "unit", "name": "ネクロマンサー", "cost": 3, "attack": 2, "health": 2,
    "description": "【登場時】スケルトン(1/1)を1体出す。",
    "onPlay": { "type": "summon", "value": 9001 }
  },
  {
    "id": 16, "class": "Shadow", "type": "unit", "name": "斥候ネズミ", "cost": 1, "attack": 1, "health": 1,
    "description": "【回避】", "elusive": true
  },
  {
    "id": 19, "class": "Shadow", "type": "unit", "name": "毒矢の吹矢兵", "cost": 2, "attack": 1, "health": 2,
    "description": "【相討ち】", "bane": true
  },
  {
    "id": 20, "class": "Shadow", "type": "unit", "name": "おしゃべりな骸骨", "cost": 2, "attack": 1, "health": 1,
    "description": "【破壊時】スケルトン(1/1)を1体出す。",
    "onDeath": { "type": "summon", "value": 9001 }
  },
  {
    "id": 22, "class": "Shadow", "type": "unit", "name": "盗賊", "cost": 2, "attack": 3, "health": 2,
    "description": "【攻撃時】敵リーダーに1ダメージ。",
    "onAttack": { "type": "damage_face", "value": 1 }
  },
  {
    "id": 24, "class": "Shadow", "type": "unit", "name": "隠密アサシン", "cost": 3, "attack": 4, "health": 2,
    "description": "【回避】", "elusive": true
  },
  {
    "id": 26, "class": "Shadow", "type": "unit", "name": "呪われた人形", "cost": 3, "attack": 0, "health": 2,
    "description": "【相討ち】【挑発】", "bane": true, "taunt": true
  },
  {
    "id": 29, "class": "Shadow", "type": "unit", "name": "死神", "cost": 6, "attack": 6, "health": 5,
    "description": "【相討ち】", "bane": true
  },
  {
    "id": 32, "class": "Shadow", "type": "unit", "name": "墓荒らし", "cost": 1, "attack": 2, "health": 1,
    "description": "【破壊時】手札に「スケルトン(1/1)」を加える。",
    "onDeath": { "type": "generate_card", "value": 9001 }
  },
  {
    "id": 36, "class": "Shadow", "type": "unit", "name": "疫病ネズミ", "cost": 2, "attack": 1, "health": 1,
    "description": "【破壊時】疫病ネズミ(1/1)を1体出す。自分に1ダメージ。",
    "onDeath": [{ "type": "summon", "value": 36 }, { "type": "damage_self", "value": 1 }]
  },
  {
    "id": 41, "class": "Shadow", "type": "unit", "name": "吸血コウモリの群れ", "cost": 5, "attack": 1, "health": 1,
    "description": "【登場時】コウモリ(1/1)を3体出す。",
    "onPlay": [{ "type": "summon", "value": 9005 }, { "type": "summon", "value": 9005 }, { "type": "summon", "value": 9005 }]
  },
  {
    "id": 47, "class": "Shadow", "type": "unit", "name": "影の潜伏者", "cost": 1, "attack": 2, "health": 1,
    "description": "【回避】【隠密】", "stealth": true, "elusive": true
  },
  {
    "id": 49, "class": "Shadow", "type": "unit", "name": "実験体No.9", "cost": 1, "attack": 4, "health": 1,
    "description": "【登場時】自分に3ダメージを与える。",
    "onPlay": { "type": "damage_self", "value": 3 }
  },
  {
    "id": 1008, "class": "Shadow", "type": "spell", "name": "毒の一撃", "cost": 1,
    "description": "ランダムな相手のユニットに1ダメージ。",
    "onPlay": { "type": "damage_random", "value": 1, "target": "enemy_unit" }
  },
  {
    "id": 1012, "class": "Shadow", "type": "spell", "name": "暗殺", "cost": 5,
    "description": "敵ユニット1体を破壊する。",
    "onPlay": { "type": "destroy", "value": 0, "target": "enemy_unit" }
  },
  {
    "id": 1013, "class": "Shadow", "type": "spell", "name": "悪魔との契約書", "cost": 2,
    "description": "自分は2ダメージを受け、カードを2枚引く。",
    "onPlay": [{ "type": "damage_self", "value": 2 }, { "type": "draw", "value": 2 }]
  },
  {
    "id": 1015, "class": "Shadow", "type": "spell", "name": "崩壊", "cost": 10,
    "description": "全てのユニットを破壊する。",
    "onPlay": { "type": "destroy_all_units" }
  },
  {
    "id": 1019, "class": "Shadow", "type": "spell", "name": "致命的な一撃", "cost": 3,
    "description": "ダメージを受けている敵ユニット1体を破壊する。",
    "onPlay": { "type": "execute_damaged", "value": 0, "target": "enemy_unit" }
  },
  {
    "id": 1021, "class": "Shadow", "type": "spell", "name": "ナイフの雨", "cost": 3,
    "description": "敵全体に1ダメージ。カードを1枚引く。",
    "onPlay": [{ "type": "damage_all", "value": 1, "target": "enemy_unit" }, { "type": "draw", "value": 1 }]
  },
  {
    "id": 1022, "class": "Shadow", "type": "spell", "name": "究極の疫病", "cost": 10,
    "description": "敵に5ダメ、隣接3ダメ、5回復、グール召喚。",
    "onPlay": [
      { "type": "chain_lightning", "primary": 5, "secondary": 3, "target": "enemy_unit" },
      { "type": "heal_face", "value": 5 },
      { "type": "summon", "value": 9007 }
    ]
  },
  {
    "id": 2006, "class": "Shadow", "type": "building", "name": "墓地", "cost": 3, "health": 4,
    "description": "【ターン終了時】スケルトン(1/1)を1体出す。",
    "turnEnd": { "type": "summon", "value": 9001 }
  },

  // --- 🏳️ ニュートラル (Neutral) / 無所属 ---
  {
    "id": 1, "class": "Neutral", "type": "unit", "name": "スライム", "cost": 1, "attack": 1, "health": 2,
    "description": "【破壊時】カードを1枚引く。",
    "onDeath": { "type": "draw", "value": 1 }
  },
  {
    "id": 10, "class": "Neutral", "type": "unit", "name": "ゴブリン", "cost": 1, "attack": 2, "health": 1,
    "description": ""
  },
  {
    "id": 15, "class": "Neutral", "type": "unit", "name": "召喚士", "cost": 4, "attack": 3, "health": 3,
    "description": "【登場時】スライム(1/2)を1体出す。",
    "onPlay": { "type": "summon", "value": 1 }
  },
  {
    "id": 23, "class": "Neutral", "type": "unit", "name": "魔法剣士", "cost": 3, "attack": 3, "health": 3,
    "description": "【ドロー時】自分のHPを1回復。",
    "onDrawTrigger": { "type": "heal_face", "value": 1 }
  },
  {
    "id": 31, "class": "Neutral", "type": "unit", "name": "破壊神", "cost": 10, "attack": 10, "health": 10,
    "description": "【登場時】敵全体に5ダメージ。",
    "onPlay": { "type": "damage_all", "value": 5, "target": "enemy_unit" }
  },
  {
    "id": 35, "class": "Neutral", "type": "unit", "name": "ストーンゴーレム", "cost": 2, "attack": 1, "health": 5,
    "description": "【挑発】", "taunt": true
  },
  {
    "id": 45, "class": "Neutral", "type": "unit", "name": "ギガント・コマンダーX", "cost": 10, "attack": 2, "health": 12,
    "description": "【ドロー時】【攻撃時】【ターン終了時】攻撃力+1。",
    "onDrawTrigger": { "type": "buff_self_attack", "value": 1 },
    "turnEnd": { "type": "buff_self_attack", "value": 1 },
    "onAttack": { "type": "buff_self_attack", "value": 1 }
  },
  {
    "id": 46, "class": "Neutral", "type": "unit", "name": "スライムキング", "cost": 6, "attack": 4, "health": 4,
    "description": "【破壊時】スライム(1/2)を3体出す。",
    "onDeath": [{ "type": "summon", "value": 1 }, { "type": "summon", "value": 1 }, { "type": "summon", "value": 1 }]
  },
  {
    "id": 2005, "class": "Neutral", "type": "building", "name": "見張り台", "cost": 3, "health": 4,
    "description": "【ターン終了時】カードを1枚引く。",
    "turnEnd": { "type": "draw", "value": 1 }
  },

  // --- 🪙 トークン (Tokens) ---
  { "id": 9000, "class": "Aqua", "type": "spell", "name": "マジックキャンディ", "cost": 0, "token": true, "onPlay": [{ "type": "damage_random", "value": 1, "target": "enemy_unit" }, { "type": "heal_face", "value": 1 }] },
  { "id": 9001, "class": "Shadow", "type": "unit", "name": "スケルトン", "cost": 1, "attack": 1, "health": 1, "token": true },
  { "id": 9002, "class": "Order", "type": "unit", "name": "兵士", "cost": 1, "attack": 2, "health": 2, "token": true },
  { "id": 9003, "class": "Gaia", "type": "unit", "name": "ドラゴンパピー", "cost": 3, "attack": 2, "health": 2, "token": true, "onAttack": { "type": "damage_random", "value": 1 } },
  { "id": 9005, "class": "Shadow", "type": "unit", "name": "コウモリ", "cost": 1, "attack": 1, "health": 1, "token": true, "onAttack": { "type": "heal_face", "value": 1 } },
  { "id": 9006, "class": "Order", "type": "spell", "name": "兵士の剣", "cost": 1, "token": true, "onPlay": [{ "type": "damage_random", "value": 1 }, { "type": "generate_card", "value": 9009 }] },
  { "id": 9007, "class": "Shadow", "type": "unit", "name": "グール", "cost": 5, "attack": 5, "health": 5, "token": true, "onAttack": { "type": "summon", "value": 9007 }, "onDeath": { "type": "damage_self", "value": 5 } },
  { "id": 9008, "class": "Ignis", "type": "spell", "name": "ドラゴンの息吹", "cost": 2, "token": true, "onPlay": { "type": "damage", "value": 3, "target": "all_enemy" } },
  { "id": 9009, "class": "Order", "type": "spell", "name": "折れた兵士の剣", "cost": 1, "token": true, "onPlay": { "type": "execute_damaged", "value": 1, "target": "enemy_unit" } },
];

export const MANA_COIN = {
  "id": 9999,
  "class": "Neutral",
  "type": "spell",
  "name": "マナコイン",
  "cost": 0,
  "attack": 0,
  "health": 0,
  "description": "このターンのみマナ+1。",
  "onPlay": {
    "type": "add_mana",
    "value": 1
  }
};