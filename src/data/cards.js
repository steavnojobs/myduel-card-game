export const CARD_DATABASE = [
  {
    "id": 1,
    "type": "unit",
    "name": "スライム",
    "cost": 1,
    "attack": 1,
    "health": 2,
    "description": "【破壊時】カードを1枚引く。",
    "onDeath": {
      "type": "draw",
      "value": 1
    }
  },
  {
    "id": 2,
    "type": "unit",
    "name": "見習い騎士",
    "cost": 2,
    "attack": 2,
    "health": 2,
    "description": "【登場時】手札に「兵士の剣」を加える。",
    "onPlay": {
      "type": "generate_card",
      "value": 9006
    }
  },
  {
    "id": 3,
    "type": "unit",
    "name": "エルフの射手",
    "cost": 3,
    "attack": 2,
    "health": 2,
    "description": "【登場時】ランダムな相手のユニットに2ダメージ。",
    "onPlay": {
      "type": "damage_random",
      "value": 2,
      "target": "enemy_unit"
    }
  },
  {
    "id": 4,
    "type": "unit",
    "name": "堅牢な盾兵",
    "cost": 4,
    "attack": 0,
    "health": 6,
    "description": "【挑発】",
    "taunt": true
  },
  {
    "id": 5,
    "type": "unit",
    "name": "炎の魔導士",
    "cost": 5,
    "attack": 4,
    "health": 4,
    "description": "【登場時】敵プレイヤーに3ダメージ。",
    "onPlay": {
      "type": "damage_face",
      "value": 3,
      "target": "face"
    }
  },
  {
    "id": 6,
    "type": "unit",
    "name": "癒やしの天使",
    "cost": 3,
    "attack": 2,
    "health": 4,
    "description": "【登場時】自分のHPを4回復。",
    "onPlay": {
      "type": "heal_face",
      "value": 4
    }
  },
  {
    "id": 7,
    "type": "unit",
    "name": "ドラゴン",
    "cost": 8,
    "attack": 8,
    "health": 8,
    "description": "【攻撃時】マナ+1。【ターン終了時】手札に「ファイアボール」を加える。",
    "turnEnd": {
      "type": "generate_card",
      "value": 1001
    },
    "onAttack": {
      "type": "add_mana",
      "value": 1
    }
  },
  {
    "id": 8,
    "type": "unit",
    "name": "城壁の巨人",
    "cost": 6,
    "attack": 1,
    "health": 8,
    "description": "【挑発】",
    "taunt": true
  },
  {
    "id": 9,
    "type": "unit",
    "name": "疾風の狼",
    "cost": 2,
    "attack": 3,
    "health": 1,
    "description": "【速攻】",
    "haste": true
  },
  {
    "id": 10,
    "type": "unit",
    "name": "ゴブリン",
    "cost": 1,
    "attack": 2,
    "health": 1,
    "description": ""
  },
  {
    "id": 11,
    "type": "unit",
    "name": "爆弾魔",
    "cost": 4,
    "attack": 3,
    "health": 3,
    "description": "【登場時】敵全体に1ダメージ。",
    "onPlay": {
      "type": "damage_all",
      "value": 1,
      "target": "enemy_unit"
    }
  },
  {
    "id": 12,
    "type": "unit",
    "name": "吸血鬼",
    "cost": 4,
    "attack": 3,
    "health": 4,
    "description": "【登場時】ランダムな相手のユニットに2ダメージ。自分のリーダーを2回復する。",
    "onPlay": [
      {
        "type": "damage_random",
        "value": 2,
        "target": "enemy_unit"
      },
      {
        "type": "heal_face",
        "value": 2
      }
    ]
  },
  {
    "id": 13,
    "type": "unit",
    "name": "グリフォン",
    "cost": 5,
    "attack": 3,
    "health": 3,
    "description": "【速攻】",
    "haste": true
  },
  {
    "id": 14,
    "type": "unit",
    "name": "ネクロマンサー",
    "cost": 3,
    "attack": 2,
    "health": 2,
    "description": "【登場時】スケルトン(1/1)を1体出す。",
    "onPlay": {
      "type": "summon",
      "value": 9001
    }
  },
  {
    "id": 15,
    "type": "unit",
    "name": "召喚士",
    "cost": 4,
    "attack": 3,
    "health": 3,
    "description": "【登場時】スライム(1/2)を1体出す。",
    "onPlay": {
      "type": "summon",
      "value": 1
    }
  },
  {
    "id": 16,
    "type": "unit",
    "name": "斥候ネズミ",
    "cost": 1,
    "attack": 1,
    "health": 1,
    "description": "【回避】",
    "elusive": true
  },
  {
    "id": 17,
    "type": "unit",
    "name": "自爆特攻ドローン",
    "cost": 1,
    "attack": 1,
    "health": 1,
    "description": "【速攻】【破壊時】敵リーダーに2ダメージ。",
    "haste": true,
    "onDeath": {
      "type": "damage_face",
      "value": 2
    }
  },
  {
    "id": 18,
    "type": "unit",
    "name": "マナワーム",
    "cost": 1,
    "attack": 1,
    "health": 3,
    "description": "【ドロー時】攻撃力+1。",
    "onDrawTrigger": {
      "type": "buff_self_attack",
      "value": 1
    }
  },
  {
    "id": 19,
    "type": "unit",
    "name": "毒矢の吹矢兵",
    "cost": 2,
    "attack": 1,
    "health": 2,
    "description": "【相討ち】",
    "bane": true
  },
  {
    "id": 20,
    "type": "unit",
    "name": "おしゃべりな骸骨",
    "cost": 2,
    "attack": 1,
    "health": 1,
    "description": "【破壊時】スケルトン(1/1)を1体出す。",
    "onDeath": {
      "type": "summon",
      "value": 9001
    }
  },
  {
    "id": 21,
    "type": "unit",
    "name": "シールドベア",
    "cost": 2,
    "attack": 2,
    "health": 4,
    "description": "【挑発】",
    "taunt": true
  },
  {
    "id": 22,
    "type": "unit",
    "name": "盗賊",
    "cost": 2,
    "attack": 3,
    "health": 2,
    "description": "【攻撃時】敵リーダーに1ダメージ。",
    "onAttack": {
      "type": "damage_face",
      "value": 1
    }
  },
  {
    "id": 23,
    "type": "unit",
    "name": "魔法剣士",
    "cost": 3,
    "attack": 3,
    "health": 3,
    "description": "【ドロー時】自分のHPを1回復。",
    "onDrawTrigger": {
      "type": "heal_face",
      "value": 1
    }
  },
  {
    "id": 24,
    "type": "unit",
    "name": "隠密アサシン",
    "cost": 3,
    "attack": 4,
    "health": 2,
    "description": "【回避】",
    "elusive": true
  },
  {
    "id": 25,
    "type": "unit",
    "name": "怒れる牛",
    "cost": 3,
    "attack": 3,
    "health": 3,
    "description": "【攻撃時】攻撃力+1。",
    "onAttack": {
      "type": "buff_self_attack",
      "value": 1
    }
  },
  {
    "id": 26,
    "type": "unit",
    "name": "呪われた人形",
    "cost": 3,
    "attack": 0,
    "health": 2,
    "description": "【相討ち】【挑発】",
    "bane": true,
    "taunt": true
  },
  {
    "id": 27,
    "type": "unit",
    "name": "ドラゴンライダー",
    "cost": 4,
    "attack": 2,
    "health": 2,
    "description": "【速攻】",
    "haste": true
  },
  {
    "id": 28,
    "type": "unit",
    "name": "研究者",
    "cost": 4,
    "attack": 2,
    "health": 3,
    "description": "【登場時】カードを1枚引く。",
    "onPlay": {
      "type": "draw",
      "value": 1
    }
  },
  {
    "id": 29,
    "type": "unit",
    "name": "死神",
    "cost": 6,
    "attack": 6,
    "health": 5,
    "description": "【相討ち】",
    "bane": true
  },
  {
    "id": 30,
    "type": "unit",
    "name": "マナの古木",
    "cost": 7,
    "attack": 2,
    "health": 10,
    "description": "【挑発】【ドロー時】このユニットのHPを3回復。",
    "taunt": true,
    "onDrawTrigger": {
      "type": "heal_self",
      "value": 3
    }
  },
  {
    "id": 31,
    "type": "unit",
    "name": "破壊神",
    "cost": 10,
    "attack": 10,
    "health": 10,
    "description": "【登場時】敵全体に5ダメージ。",
    "onPlay": {
      "type": "damage_all",
      "value": 5,
      "target": "enemy_unit"
    }
  },
  {
    "id": 32,
    "type": "unit",
    "name": "墓荒らし",
    "cost": 1,
    "attack": 2,
    "health": 1,
    "description": "【破壊時】手札に「スケルトン(1/1)」を加える。",
    "onDeath": {
      "type": "generate_card",
      "value": 9001
    }
  },
  {
    "id": 33,
    "type": "unit",
    "name": "氷の精霊",
    "cost": 1,
    "attack": 1,
    "health": 1,
    "description": "【登場時】敵1体を凍結させる。",
    "onPlay": {
      "type": "freeze_enemy",
      "value": 1,
      "target": "enemy_unit"
    }
  },
  {
    "id": 34,
    "type": "unit",
    "name": "エルフの剣豪",
    "cost": 2,
    "attack": 3,
    "health": 2,
    "description": "【連撃】",
    "doubleAttack": true
  },
  {
    "id": 35,
    "type": "unit",
    "name": "ストーンゴーレム",
    "cost": 2,
    "attack": 1,
    "health": 5,
    "description": "【挑発】",
    "taunt": true
  },
  {
    "id": 36,
    "type": "unit",
    "name": "疫病ネズミ",
    "cost": 2,
    "attack": 1,
    "health": 1,
    "description": "【破壊時】疫病ネズミ(1/1)を1体出す。自分に1ダメージ。",
    "onDeath": [
      {
        "type": "summon",
        "value": 36
      },
      {
        "type": "damage_self",
        "value": 1
      }
    ]
  },
  {
    "id": 37,
    "type": "unit",
    "name": "聖職者",
    "cost": 2,
    "attack": 1,
    "health": 3,
    "description": "【ターン終了時】ランダムな味方1体を2回復。",
    "turnEnd": {
      "type": "heal_random",
      "value": 2,
      "target": "ally_unit"
    }
  },
  {
    "id": 38,
    "type": "unit",
    "name": "グリフィンライダー",
    "cost": 3,
    "attack": 1,
    "health": 3,
    "description": "【速攻】【ターン終了時】このユニットを手札に戻す。",
    "turnEnd": {
      "type": "return_to_hand",
      "value": 1
    },
    "haste": true
  },
  {
    "id": 39,
    "type": "unit",
    "name": "スペルブレイカー",
    "cost": 4,
    "attack": 4,
    "health": 3,
    "description": "【登場時】敵ユニット1体を沈黙させる。",
    "onPlay": {
      "type": "silence_unit",
      "value": 0,
      "target": "enemy_unit"
    }
  },
  {
    "id": 40,
    "type": "unit",
    "name": "重装騎士",
    "cost": 5,
    "attack": 6,
    "health": 6,
    "description": "【聖なる盾】",
    "divineShield": true
  },
  {
    "id": 41,
    "type": "unit",
    "name": "吸血コウモリの群れ",
    "cost": 5,
    "attack": 1,
    "health": 1,
    "description": "【登場時】コウモリ(1/1)を3体出す。",
    "onPlay": [
      {
        "type": "summon",
        "value": 9005
      },
      {
        "type": "summon",
        "value": 9005
      },
      {
        "type": "summon",
        "value": 9005
      }
    ]
  },
  {
    "id": 42,
    "type": "unit",
    "name": "嵐の精霊",
    "cost": 7,
    "attack": 5,
    "health": 5,
    "description": "【破壊時】自身以外の全体に2ダメージ。",
    "onDeath": {
      "type": "damage_all_other",
      "value": 2
    }
  },
  {
    "id": 43,
    "type": "unit",
    "name": "クラーケン",
    "cost": 8,
    "attack": 8,
    "health": 8,
    "description": "【登場時】敵ユニット1体を破壊する。",
    "onPlay": {
      "type": "destroy",
      "value": 0,
      "target": "enemy_unit"
    }
  },
  {
    "id": 44,
    "type": "unit",
    "name": "伝説のドラゴン",
    "cost": 9,
    "attack": 2,
    "health": 9,
    "description": "【ターン終了時】手札に「ドラゴンの息吹」を加える。",
    "turnEnd": {
      "type": "generate_card",
      "value": 9008
    }
  },
  {
    "id": 45,
    "type": "unit",
    "name": "ギガント・コマンダーX",
    "cost": 10,
    "attack": 2,
    "health": 12,
    "description": "【ドロー時】【攻撃時】【ターン終了時】攻撃力+1。",
    "onDrawTrigger": {
      "type": "buff_self_attack",
      "value": 1
    },
    "turnEnd": {
      "type": "buff_self_attack",
      "value": 1
    },
    "onAttack": {
      "type": "buff_self_attack",
      "value": 1
    }
  },
  {
    "id": 46,
    "type": "unit",
    "name": "スライムキング",
    "cost": 6,
    "attack": 4,
    "health": 4,
    "description": "【破壊時】スライム(1/2)を3体出す。",
    "onDeath": [
      {
        "type": "summon",
        "value": 1
      },
      {
        "type": "summon",
        "value": 1
      },
      {
        "type": "summon",
        "value": 1
      }
    ]
  },
  {
    "id": 47,
    "type": "unit",
    "name": "影の潜伏者",
    "cost": 1,
    "attack": 2,
    "health": 1,
    "description": "【回避】【隠密】",
    "stealth": true,
    "elusive": true
  },
  {
    "id": 48,
    "type": "unit",
    "name": "輝く司祭",
    "cost": 1,
    "attack": 1,
    "health": 3,
    "description": "【登場時】味方ユニット1体を完全回復。",
    "onPlay": {
      "type": "heal_unit_full",
      "value": 0,
      "target": "ally_unit"
    }
  },
  {
    "id": 49,
    "type": "unit",
    "name": "実験体No.9",
    "cost": 1,
    "attack": 4,
    "health": 1,
    "description": "【登場時】自分に3ダメージを与える。",
    "onPlay": {
      "type": "damage_self",
      "value": 3
    }
  },
  {
    "id": 50,
    "type": "unit",
    "name": "ジャングルパンサー",
    "cost": 3,
    "attack": 4,
    "health": 2,
    "description": "【隠密】",
    "stealth": true
  },
  {
    "id": 51,
    "type": "unit",
    "name": "突進する狂戦士",
    "cost": 4,
    "attack": 2,
    "health": 3,
    "description": "【速攻】【聖なる盾】",
    "haste": true,
    "divineShield": true
  },
  {
    "id": 52,
    "type": "unit",
    "name": "アースクエイカー",
    "cost": 5,
    "attack": 2,
    "health": 3,
    "description": "【回避】【ターン終了時】自身以外の全体に1ダメージ。",
    "turnEnd": {
      "type": "damage_all_other",
      "value": 1
    },
    "elusive": true
  },
  {
    "id": 53,
    "type": "unit",
    "name": "風の王",
    "cost": 8,
    "attack": 3,
    "health": 5,
    "description": "【速攻】【連撃】【聖なる盾】【挑発】",
    "haste": true,
    "doubleAttack": true,
    "divineShield": true,
    "taunt": true
  },
  {
    "id": 1001,
    "type": "spell",
    "name": "ファイアボール",
    "cost": 2,
    "attack": 0,
    "health": 0,
    "description": "ランダムな敵1体に3ダメージ。",
    "onPlay": {
      "type": "damage_random",
      "value": 3,
      "target": "enemy_unit"
    }
  },
  {
    "id": 1002,
    "type": "spell",
    "name": "回復の薬",
    "cost": 1,
    "attack": 0,
    "health": 0,
    "description": "自分のHPを5回復。",
    "onPlay": {
      "type": "heal_face",
      "value": 5
    }
  },
  {
    "id": 1003,
    "type": "spell",
    "name": "勇気の叫び",
    "cost": 2,
    "attack": 0,
    "health": 0,
    "description": "全味方攻撃+1。",
    "onPlay": {
      "type": "buff_all_attack",
      "value": 1
    }
  },
  {
    "id": 1004,
    "type": "spell",
    "name": "雷撃",
    "cost": 4,
    "attack": 0,
    "health": 0,
    "description": "敵プレイヤーに5ダメージ。",
    "onPlay": {
      "type": "damage_face",
      "value": 5,
      "target": "face"
    }
  },
  {
    "id": 1005,
    "type": "spell",
    "name": "吹雪",
    "cost": 5,
    "attack": 0,
    "health": 0,
    "description": "敵全体に2ダメージ。",
    "onPlay": {
      "type": "damage_all",
      "value": 2,
      "target": "enemy_unit"
    }
  },
  {
    "id": 1006,
    "type": "spell",
    "name": "知識の探求",
    "cost": 3,
    "attack": 0,
    "health": 0,
    "description": "カードを2枚引く。",
    "onPlay": {
      "type": "draw",
      "value": 2
    }
  },
  {
    "id": 1007,
    "type": "spell",
    "name": "王の号令",
    "cost": 4,
    "attack": 0,
    "health": 0,
    "description": "兵士(2/2)を2体出す。",
    "onPlay": [
      {
        "type": "summon",
        "value": 9002
      },
      {
        "type": "summon",
        "value": 9002
      }
    ]
  },
  {
    "id": 1008,
    "type": "spell",
    "name": "毒の一撃",
    "cost": 1,
    "attack": 0,
    "health": 0,
    "description": "ランダムな相手のユニットに1ダメージ。",
    "onPlay": {
      "type": "damage_random",
      "value": 1,
      "target": "enemy_unit"
    }
  },
  {
    "id": 1009,
    "type": "spell",
    "name": "ドラゴンの卵",
    "cost": 3,
    "attack": 0,
    "health": 0,
    "description": "ドラゴンパピー(2/2)を1体出す。",
    "onPlay": {
      "type": "summon",
      "value": 9003
    }
  },
  {
    "id": 1010,
    "type": "spell",
    "name": "メテオ",
    "cost": 7,
    "attack": 0,
    "health": 0,
    "description": "敵全体とプレイヤーに4ダメージ。",
    "onPlay": [
      {
        "type": "damage_all",
        "value": 4,
        "target": "enemy_unit"
      },
      {
        "type": "damage_face",
        "value": 4
      }
    ]
  },
  {
    "id": 1011,
    "type": "spell",
    "name": "急成長",
    "cost": 2,
    "attack": 0,
    "health": 0,
    "description": "空のマナクリスタルを1つ得る。",
    "onPlay": {
      "type": "gain_empty_mana",
      "value": 1
    }
  },
  {
    "id": 1012,
    "type": "spell",
    "name": "暗殺",
    "cost": 5,
    "attack": 0,
    "health": 0,
    "description": "敵ユニット1体を破壊する。",
    "onPlay": {
      "type": "destroy",
      "value": 0,
      "target": "enemy_unit"
    }
  },
  {
    "id": 1013,
    "type": "spell",
    "name": "悪魔との契約書",
    "cost": 2,
    "attack": 0,
    "health": 0,
    "description": "自分は2ダメージを受け、カードを2枚引く。",
    "onPlay": [
      {
        "type": "damage_self",
        "value": 2
      },
      {
        "type": "draw",
        "value": 2
      }
    ]
  },
  {
    "id": 1014,
    "type": "spell",
    "name": "インパクト・ブロー",
    "cost": 2,
    "attack": 0,
    "health": 0,
    "description": "敵ユニット1体に2ダメージを与え、その隣接するユニットに1ダメージを与える。",
    "onPlay": {
      "type": "chain_lightning",
      "primary": 2,
      "secondary": 1,
      "target": "enemy_unit"
    }
  },
  {
    "id": 1015,
    "type": "spell",
    "name": "崩壊",
    "cost": 10,
    "attack": 0,
    "health": 0,
    "description": "全てのユニットを破壊する。",
    "onPlay": {
      "type": "destroy_all_units"
    }
  },
  {
    "id": 1016,
    "type": "spell",
    "name": "連鎖する稲妻",
    "cost": 3,
    "attack": 0,
    "health": 0,
    "description": "敵ユニット1体に3ダメージを与え、その隣接するユニットに1ダメージを与える。",
    "onPlay": {
      "type": "chain_lightning",
      "primary": 3,
      "secondary": 1,
      "target": "enemy_unit"
    }
  },
  {
    "id": 1017,
    "type": "spell",
    "name": "沈黙の霧",
    "cost": 5,
    "attack": 0,
    "health": 0,
    "description": "敵のユニット全体を【沈黙】させる。",
    "onPlay": {
      "type": "silence_all_enemy"
    }
  },
  {
    "id": 1018,
    "type": "spell",
    "name": "氷瀑",
    "cost": 2,
    "attack": 0,
    "health": 0,
    "description": "敵1体を凍結させる。",
    "onPlay": {
      "type": "freeze_enemy",
      "value": 1,
      "target": "enemy_unit"
    }
  },
  {
    "id": 1019,
    "type": "spell",
    "name": "致命的な一撃",
    "cost": 3,
    "attack": 0,
    "health": 0,
    "description": "ダメージを受けている敵ユニット1体を破壊する。",
    "onPlay": {
      "type": "execute_damaged",
      "value": 0,
      "target": "enemy_unit"
    }
  },
  {
    "id": 1020,
    "type": "spell",
    "name": "聖なる火",
    "cost": 7,
    "attack": 0,
    "health": 0,
    "description": "敵の対象に5ダメージ。自分のHPを5回復。",
    "onPlay": [
      {
        "type": "damage",
        "value": 5,
        "target": "all_enemy"
      },
      {
        "type": "heal_face",
        "value": 5
      }
    ]
  },
  {
    "id": 1021,
    "type": "spell",
    "name": "ナイフの雨",
    "cost": 3,
    "attack": 0,
    "health": 0,
    "description": "敵全体に1ダメージ。カードを1枚引く。",
    "onPlay": [
      {
        "type": "damage_all",
        "value": 1,
        "target": "enemy_unit"
      },
      {
        "type": "draw",
        "value": 1
      }
    ]
  },
  {
    "id": 1022,
    "type": "spell",
    "name": "究極の疫病",
    "cost": 10,
    "attack": 0,
    "health": 0,
    "description": "敵ユニット1体に5ダメージを与え、その隣接するユニットに3ダメージを与える。自分のHPを5回復。グール(5/5)を1体出す。",
    "onPlay": [
      {
        "type": "chain_lightning",
        "primary": 5,
        "secondary": 3,
        "target": "enemy_unit"
      },
      {
        "type": "heal_face",
        "value": 5
      },
      {
        "type": "summon",
        "value": 9007
      }
    ]
  },
  {
    "id": 1023,
    "type": "spell",
    "name": "神聖なる恩寵",
    "cost": 4,
    "attack": 0,
    "health": 0,
    "description": "相手の手札と同じ枚数になるまでカードを引く。",
    "onPlay": {
      "type": "draw_until_match_enemy"
    }
  },
  {
    "id": 2001,
    "type": "building",
    "name": "訓練所",
    "cost": 3,
    "attack": 0,
    "health": 4,
    "description": "【ターン終了時】全味方攻撃+1。",
    "turnEnd": {
      "type": "buff_all_attack",
      "value": 1
    }
  },
  {
    "id": 2002,
    "type": "building",
    "name": "マナの泉",
    "cost": 2,
    "attack": 0,
    "health": 3,
    "description": "【ターン終了時】自分のHPを2回復。",
    "turnEnd": {
      "type": "heal_face",
      "value": 2
    }
  },
  {
    "id": 2003,
    "type": "building",
    "name": "防衛塔",
    "cost": 4,
    "attack": 0,
    "health": 5,
    "description": "【ターン終了時】ランダムな敵に1ダメージ。",
    "turnEnd": {
      "type": "damage_random",
      "value": 1
    }
  },
  {
    "id": 2004,
    "type": "building",
    "name": "兵舎",
    "cost": 5,
    "attack": 0,
    "health": 4,
    "description": "【ターン終了時】兵士(2/2)を1体出す。",
    "turnEnd": {
      "type": "summon",
      "value": 9002
    }
  },
  {
    "id": 2005,
    "type": "building",
    "name": "見張り台",
    "cost": 3,
    "attack": 0,
    "health": 4,
    "description": "【ターン終了時】カードを1枚引く。",
    "turnEnd": {
      "type": "draw",
      "value": 1
    }
  },
  {
    "id": 2006,
    "type": "building",
    "name": "墓地",
    "cost": 3,
    "attack": 0,
    "health": 4,
    "description": "【ターン終了時】スケルトン(1/1)を1体出す。",
    "turnEnd": {
      "type": "summon",
      "value": 9001
    }
  },
  {
    "id": 2007,
    "type": "building",
    "name": "精霊のトーテム",
    "cost": 2,
    "attack": 0,
    "health": 3,
    "description": "【ターン終了時】ランダムな味方ユニット1体を1回復する。",
    "turnEnd": {
      "type": "heal_random",
      "value": 1,
      "target": "ally_unit"
    }
  },
  {
    "id": 9001,
    "type": "unit",
    "name": "スケルトン",
    "cost": 1,
    "attack": 1,
    "health": 1,
    "description": "",
    "token": true
  },
  {
    "id": 9002,
    "type": "unit",
    "name": "兵士",
    "cost": 1,
    "attack": 2,
    "health": 2,
    "description": "",
    "token": true
  },
  {
    "id": 9003,
    "type": "unit",
    "name": "ドラゴンパピー",
    "cost": 3,
    "attack": 2,
    "health": 2,
    "description": "【攻撃時】ランダムな敵1体に1ダメージ",
    "token": true,
    "onAttack": {
      "type": "damage_random",
      "value": 1
    }
  },
  {
    "id": 9005,
    "type": "unit",
    "name": "コウモリ",
    "cost": 1,
    "attack": 1,
    "health": 1,
    "description": "【攻撃時】自分のHPを1回復。",
    "token": true,
    "onAttack": {
      "type": "heal_face",
      "value": 1
    }
  },
  {
    "id": 9006,
    "type": "spell",
    "name": "兵士の剣",
    "cost": 1,
    "attack": 0,
    "health": 0,
    "description": "ランダムな敵1体に1ダメージ。手札に「折れた兵士の剣」を加える。",
    "token": true,
    "onPlay": [
      {
        "type": "damage_random",
        "value": 1
      },
      {
        "type": "generate_card",
        "value": 9009
      }
    ]
  },
  {
    "id": 9007,
    "type": "unit",
    "name": "グール",
    "cost": 5,
    "attack": 5,
    "health": 5,
    "description": "【破壊時】自分に5ダメージ。【攻撃時】グール(5/5)を1体出す。",
    "token": true,
    "onAttack": {
      "type": "summon",
      "value": 9007
    },
    "onDeath": {
      "type": "damage_self",
      "value": 5
    }
  },
  {
    "id": 9008,
    "type": "spell",
    "name": "ドラゴンの息吹",
    "cost": 2,
    "attack": 0,
    "health": 0,
    "description": "敵の対象に3ダメージ。",
    "onPlay": {
      "type": "damage",
      "value": 3,
      "target": "all_enemy"
    }
  },
  {
    "id": 9009,
    "type": "spell",
    "name": "折れた兵士の剣",
    "cost": 1,
    "attack": 0,
    "health": 0,
    "description": "ダメージを受けている敵ユニット1体を破壊する。",
    "onPlay": {
      "type": "execute_damaged",
      "value": 1,
      "target": "enemy_unit"
    }
  }
];



export const MANA_COIN = {
  "id": 9999,
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