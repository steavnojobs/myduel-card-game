export const CARD_DATABASE = [
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
    "attack": 1,
    "health": 1,
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
    "id": 10,
    "type": "unit",
    "name": "ゴブリン",
    "cost": 1,
    "attack": 2,
    "health": 1,
    "description": ""
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
    "id": 2,
    "type": "unit",
    "name": "見習い騎士",
    "cost": 2,
    "attack": 2,
    "health": 2,
    "description": ""
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
    "id": 3,
    "type": "unit",
    "name": "エルフの射手",
    "cost": 3,
    "attack": 2,
    "health": 2,
    "description": "【登場時】ランダムな敵1体に2ダメージ。",
    "onPlay": {
      "type": "damage_random",
      "value": 2
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
    "id": 11,
    "type": "unit",
    "name": "爆弾魔",
    "cost": 4,
    "attack": 3,
    "health": 3,
    "description": "【登場時】敵全体に1ダメージ。",
    "onPlay": {
      "type": "damage_all_enemy",
      "value": 1
    }
  },
  {
    "id": 12,
    "type": "unit",
    "name": "吸血鬼",
    "cost": 4,
    "attack": 3,
    "health": 4,
    "description": "【登場時】敵1体に2ダメージ、自分のHPを2回復。",
    "onPlay": {
      "type": "drain",
      "value": 2
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
    "id": 5,
    "type": "unit",
    "name": "炎の魔導士",
    "cost": 5,
    "attack": 4,
    "health": 4,
    "description": "【登場時】敵プレイヤーに3ダメージ。",
    "onPlay": {
      "type": "damage_face",
      "value": 3
    }
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
    "id": 7,
    "type": "unit",
    "name": "ドラゴン",
    "cost": 8,
    "attack": 8,
    "health": 8,
    "description": "【攻撃時】マナ+1。【ターン終了時】手札に「ファイアボール」を加える。",
    "onAttack": {
      "type": "add_mana",
      "value": 1
    },
    "turnEnd": {
      "type": "generate_card",
      "value": 1001
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
      "type": "damage_all_enemy",
      "value": 5
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
    "id": 2003,
    "type": "building",
    "name": "防衛塔",
    "cost": 4,
    "attack": 0,
    "health": 5,
    "description": "【ターン終了時】ランダムな敵1体に1ダメージ。",
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
    "description": "【ターン終了時】兵士(1/1)を2体出す。",
    "turnEnd": {
      "type": "summon_multi",
      "value": 9002,
      "count": 2
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
    "id": 1008,
    "type": "spell",
    "name": "毒の一撃",
    "cost": 1,
    "attack": 0,
    "health": 0,
    "description": "ランダムな敵1体に1ダメージ。",
    "onPlay": {
      "type": "damage_random",
      "value": 1
    }
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
      "value": 3
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
    "id": 1004,
    "type": "spell",
    "name": "雷撃",
    "cost": 4,
    "attack": 0,
    "health": 0,
    "description": "敵プレイヤーに5ダメージ。",
    "onPlay": {
      "type": "damage_face",
      "value": 5
    }
  },
  {
    "id": 1007,
    "type": "spell",
    "name": "王の号令",
    "cost": 4,
    "attack": 0,
    "health": 0,
    "description": "兵士(1/1)を2体出す。",
    "onPlay": {
      "type": "summon_multi",
      "value": 9002,
      "count": 2
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
      "type": "damage_all_enemy",
      "value": 2
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
    "onPlay": {
      "type": "damage_all_and_face",
      "value": 4
    }
  }
];





export const MANA_COIN = { id: 9999, type: 'spell', name: "マナコイン", cost: 0, attack: 0, health: 0, description: "このターンのみマナ+1。", onPlay: { type: 'add_mana', value: 1 } };