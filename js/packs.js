/* ═══════════════════════════════════════════════════════════════
   GENERIC DATA SCHEMA
   ─────────────────────────────────────────────────────────────
   GAME_PACKS: Array of GamePack
   ─────────────────────────────────────────────────────────────
   GamePack {
     id        : string          — unique key
     icon      : string          — emoji
     name      : string          — display name (EN)
     nameCN    : string          — display name (ZH)
     desc      : string          — short description
     attribution: string|null    — HTML string shown in footer (null = hide)
     type      : 'display'|undef — undef = matching engine; 'display' = radicals engine
     levels: Array of Level {
       id         : number
       label      : string       — full label shown in round-info
       shortLabel : string       — short label shown in badge
       cls        : 'lv1'|'lv2'|'lv3'…
       pairs      : Array of Pair { left: CardData, right: CardData }     (matching)
       items      : Array of { char, pinyin, nameCN, examples[] }         (display)
     }
   }

   CardData {
     pinyin  : string | null   — romanisation / pronunciation hint
     chinese : string | null   — Chinese characters
     img     : string | null   — image URL
   }
   At least one of (chinese, img) should be non-null.
═══════════════════════════════════════════════════════════════ */

/* ── Helper: build a CardData quickly ── */
const card = (pinyin, chinese, img = null) => ({ pinyin, chinese, img });
const imgOnly = (img, alt = null) => ({ pinyin: null, chinese: alt, img });

/* ═══════════════════════════════════════════════════════════════
   PACK 1 — Stroke Matching (original game)
═══════════════════════════════════════════════════════════════ */
const PACK_STROKES = {
  id: 'strokes',
  icon: '🖌️',
  name: 'Stroke Names',
  nameCN: '汉字笔画',
  desc: 'Match stroke names to their written form',
  attribution: `Stroke images &copy; <a href="https://commons.wikimedia.org/wiki/User:Cangjie6" target="_blank" rel="noopener">Cangjie6</a>
    via <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons</a>,
    <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>, used unmodified for educational purposes.`,
  levels: [
    {
      id: 1, cls: 'lv1',
      label:      '⭐ Level 1 — Basic Strokes 基础笔画',
      shortLabel: '⭐ Level 1',
      pairs: [
        { left: card('héng',    '横'),   right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/7/72/Cjk_k_str_h.svg',  '横') },
        { left: card('shù',     '竖'),   right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/f/ff/Cjk_k_str_v.svg',  '竖') },
        { left: card('diǎn',    '点'),   right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/5/59/Cjk_k_str_d.svg',  '点') },
        { left: card('piě',     '撇'),   right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/e/ed/Cjk_k_str_t.svg',  '撇') },
        { left: card('nà',      '捺'),   right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/3/39/Cjk_k_str_p.svg',  '捺') },
        { left: card('tí',      '提'),   right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/9/92/Cjk_k_str_u.svg',  '提') },
        { left: card('shù gōu','竖钩'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/7/79/Cjk_k_str_vj.svg', '竖钩') },
        { left: card('wān gōu','弯钩'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/a/a2/Cjk_k_str_cj.svg', '弯钩') },
      ]
    },
    {
      id: 2, cls: 'lv2',
      label:      '⭐⭐ Level 2 — Compound Strokes 复合笔画',
      shortLabel: '⭐⭐ Level 2',
      pairs: [
        { left: card('héng zhé','横折'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/d/de/Cjk_k_str_hv.svg',  '横折') },
        { left: card('shù zhé', '竖折'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/c/c4/Cjk_k_str_vh.svg',  '竖折') },
        { left: card('héng gōu','横钩'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/5/51/Cjk_k_str_hj.svg',  '横钩') },
        { left: card('shù wān', '竖弯'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/c/cc/Cjk_k_str_va.svg',  '竖弯') },
        { left: card('piě diǎn','撇点'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/d/d7/Cjk_k_str_td.svg',  '撇点') },
        { left: card('piě zhé', '撇折'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cjk_k_str_tu.svg',  '撇折') },
        { left: card('xié gōu', '斜钩'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/e/ec/Cjk_k_str_pj.svg',  '斜钩') },
        { left: card('wò gōu',  '卧钩'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/0/06/Cjk_k_str_fpj.svg', '卧钩') },
        { left: card('shù tí',  '竖提'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/7/75/Cjk_k_str_vu.svg',  '竖提') },
      ]
    },
    {
      id: 3, cls: 'lv3',
      label:      '⭐⭐⭐ Level 3 — Complex Strokes 复杂笔画',
      shortLabel: '⭐⭐⭐ Level 3',
      pairs: [
        { left: card('shù wān gōu',      '竖弯钩'),  right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/1/1a/Cjk_k_str_vaj.svg') },
        { left: card('héng zhé gōu',     '横折钩'),  right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/a/ac/Cjk_k_str_hvj.svg') },
        { left: card('héng zhé tí',      '横折提'),  right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/1/12/Cjk_k_str_hvu.svg') },
        { left: card('héng piě',         '横撇'),    right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/9/9d/Cjk_k_str_ht.svg') },
        { left: card('héng zhé wān gōu', '横折弯钩'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/8/8f/Cjk_k_str_haj.svg') },
        { left: card('shù zhé zhé gōu',  '竖折折钩'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/9/9f/Cjk_k_str_vhtj.svg') },
        { left: card('héng piě wān gōu', '横撇弯钩'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/0/02/Cjk_k_str_htcj.svg') },
        { left: card('héng zhé zhé piě', '横折折撇'), right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/8/89/Cjk_k_str_htht.svg') },
        { left: card('héng zhé wān',     '横折弯'),  right: imgOnly('https://upload.wikimedia.org/wikipedia/commons/4/45/Cjk_k_str_ha.svg') },
      ]
    }
  ]
};

/* ═══════════════════════════════════════════════════════════════
   PACK 2 — Antonyms 反义词
═══════════════════════════════════════════════════════════════ */
const PACK_ANTONYMS = {
  id: 'antonyms',
  icon: '↔️',
  name: 'Antonyms',
  nameCN: '反义词',
  desc: 'Match each word with its opposite',
  attribution: null,
  levels: [
    {
      id: 1, cls: 'lv1',
      label:      '⭐ Level 1 — Basic Opposites 基础反义词',
      shortLabel: '⭐ Level 1',
      pairs: [
        { left: card(null, '大'), right: card(null, '小') },
        { left: card(null, '多'), right: card(null, '少') },
        { left: card(null, '快'), right: card(null, '慢') },
        { left: card(null, '来'), right: card(null, '去') },
        { left: card(null, '上'), right: card(null, '下') },
        { left: card(null, '左'), right: card(null, '右') },
        { left: card(null, '黑'), right: card(null, '白') },
        { left: card(null, '开'), right: card(null, '关') },
      ]
    },
    {
      id: 2, cls: 'lv2',
      label:      '⭐⭐ Level 2 — Descriptive Opposites 描述反义词',
      shortLabel: '⭐⭐ Level 2',
      pairs: [
        { left: card(null,  '新'), right: card(null,  '旧') },
        { left: card(null,  '冷'), right: card(null,  '热') },
        { left: card(null,  '高'), right: card(null,  '矮') },
        { left: card(null,  '远'), right: card(null,  '近') },
        { left: card(null,  '真'), right: card('jiǎ', '假') },
        { left: card(null,  '对'), right: card('cuò', '错') },
        { left: card(null,  '里'), right: card(null,  '外') },
        { left: card(null,  '前'), right: card(null,  '后') },
      ]
    },
    {
      id: 3, cls: 'lv3',
      label:      '⭐⭐⭐ Level 3 — Action & State Opposites 动作反义词',
      shortLabel: '⭐⭐⭐ Level 3',
      pairs: [
        { left: card(null,     '有'),  right: card(null,       '无') },
        { left: card(null,     '早'),  right: card(null,       '晚') },
        { left: card(null,     '直'),  right: card(null,       '弯') },
        { left: card(null,     '细'),  right: card('cū',       '粗') },
        { left: card(null,     '凉'),  right: card(null,       '热') },
        { left: card(null,     '加'),  right: card(null,       '减') },
        { left: card(null,     '开心'), right: card('nán guò',  '难过') },
      ]
    },
    {
      id: 4, cls: 'lv4',
      label:      '⭐⭐⭐⭐ Level 4 — Qualities & Emotions 性质情感',
      shortLabel: '⭐⭐⭐⭐ Level 4',
      pairs: [
        { left: card(null, '聪明'), right: card(null, '笨')  },
        { left: card(null, '干净'), right: card(null, '脏')  },
        { left: card(null, '高兴'), right: card(null, '生气') },
        { left: card(null, '脱'),   right: card(null, '穿')  },
        { left: card(null, '轻'),   right: card(null, '响')  },
        { left: card(null, '收'),   right: card(null, '放')  },
        { left: card(null, '先'),   right: card(null, '后')  },
      ]
    },
    {
      id: 5, cls: 'lv5',
      label:      '⭐⭐⭐⭐⭐ Level 5 — Simple Compounds 简单复合',
      shortLabel: '⭐⭐⭐⭐⭐ Level 5',
      pairs: [
        { left: card(null,    '头'), right: card(null,    '尾') },
        { left: card(null,    '出'), right: card(null,    '进') },
        { left: card(null,    '升'), right: card('jiàng', '降') },
        { left: card(null,    '正'), right: card('fǎn',   '反') },
      ]
    },
    {
      id: 6, cls: 'lv6',
      label:      '⭐⭐⭐⭐⭐⭐ Level 6 — Compound Phrases 复合短语',
      shortLabel: '⭐⭐⭐⭐⭐⭐ Level 6',
      pairs: [
        { left: card(null,        '出去'), right: card(null,        '进来') },
        { left: card(null,        '升起'), right: card('jiàng luò', '降落') },
        { left: card(null,        '正面'), right: card('fǎn miàn',  '反面') },
        { left: card(null,        '睁开'), right: card(null,        '闭上') },
      ]
    },
  ]
};

/* ═══════════════════════════════════════════════════════════════
   PACK 3 — Measure Words 量词
═══════════════════════════════════════════════════════════════ */
const PACK_MEASURE = {
  id: 'measure',
  icon: '📏',
  name: 'Measure Words',
  nameCN: '量词',
  desc: 'Match the measure word to what it counts',
  attribution: null,
  levels: [
    {
      id: 1, cls: 'lv1',
      label:      '⭐ Level 1 — Measure Words 量词（一）',
      shortLabel: '⭐ Level 1',
      pairs: [
        { left: card(null, '对'), right: card(null,           '好朋友') },
        { left: card(null, '道'), right: card(null,           '彩虹')   },
        { left: card(null, '棵'), right: card(null,           '树')     },
        { left: card(null, '面'), right: card(null,           '镜子')   },
        { left: card(null, '袋'), right: card(null,           '苹果')   },
        { left: card(null, '朵'), right: card(null,           '花')     },
        { left: card(null, '件'), right: card(null,           '礼物')   },
        { left: card(null, '顶'), right: card(null,           '帽子')   },
      ]
    },
    {
      id: 2, cls: 'lv2',
      label:      '⭐⭐ Level 2 — Measure Words 量词（二）',
      shortLabel: '⭐⭐ Level 2',
      pairs: [
        { left: card(null, '对'), right: card(null,           '花瓶')   },
        { left: card(null, '道'), right: card(null,           '菜')     },
        { left: card(null, '棵'), right: card(null,           '草')     },
        { left: card(null, '面'), right: card('qí zi',        '旗子')   },
        { left: card(null, '袋'), right: card(null,           '面包')   },
        { left: card(null, '朵'), right: card(null,           '云')     },
        { left: card(null, '件'), right: card(null,           '事情')   },
        { left: card(null, '顶'), right: card('zhàng péng',   '帐篷')   },
      ]
    },
    {
      id: 3, cls: 'lv3',
      label:      '⭐⭐⭐ Level 3 — Measure Words 量词（三）',
      shortLabel: '⭐⭐⭐ Level 3',
      pairs: [
        { left: card(null, '匹'), right: card(null, '马')   },
        { left: card(null, '根'), right: card('kuài zi', '筷子') },
        { left: card(null, '回'), right: card(null, '游戏') },
        { left: card(null, '座'), right: card(null, '山')   },
        { left: card(null, '只'), right: card(null, '狼')   },
        { left: card(null, '双'), right: card(null, '鞋')   },
        { left: card(null, '套'), right: card(null, '衣服') },
      ]
    },
    {
      id: 4, cls: 'lv4',
      label:      '⭐⭐⭐⭐ Level 4 — Measure Words 量词（四）',
      shortLabel: '⭐⭐⭐⭐ Level 4',
      pairs: [
        { left: card(null, '匹'), right: card(null, '布')   },
        { left: card(null, '根'), right: card('shéng zi', '绳子') },
        { left: card(null, '回'), right: card(null, '老师') },
        { left: card(null, '座'), right: card(null, '高楼') },
        { left: card(null, '双'), right: card(null, '手')   },
        { left: card(null, '棵'), right: card(null, '菜')   },
        { left: card(null, '件'), right: card(null, '衣服') },
      ]
    },
    {
      id: 5, cls: 'lv5',
      label:      '⭐⭐⭐⭐⭐ Level 5 — Measure Words 量词（五）',
      shortLabel: '⭐⭐⭐⭐⭐ Level 5',
      pairs: [
        { left: card(null, '块'), right: card(null, '石头') },
        { left: card(null, '群'), right: card(null, '小孩') },
        { left: card(null, '片'), right: card(null, '叶子') },
        { left: card(null, '颗'), right: card(null, '星星') },
        { left: card(null, '瓶'), right: card(null, '牛奶') },
        { left: card(null, '头'), right: card(null, '大象') },
        { left: card(null, '对'), right: card('bāo tāi', '双胞胎') },
        { left: card(null, '朵'), right: card(null, '浪花') },
      ]
    },
    {
      id: 6, cls: 'lv6',
      label:      '⭐⭐⭐⭐⭐⭐ Level 6 — Measure Words 量词（六）',
      shortLabel: '⭐⭐⭐⭐⭐⭐ Level 6',
      pairs: [
        { left: card(null, '块'), right: card(null, '蛋糕') },
        { left: card(null, '群'), right: card(null, '鸡')   },
        { left: card(null, '片'), right: card(null, '沙滩') },
        { left: card(null, '颗'), right: card(null, '牙齿') },
        { left: card(null, '瓶'), right: card(null, '药')   },
        { left: card(null, '头'), right: card(null, '老虎') },
        { left: card(null, '根'), right: card(null, '玉米') },
      ]
    },
    {
      id: 7, cls: 'lv7',
      label:      '⭐⭐⭐⭐⭐⭐⭐ Level 7 — Measure Words 量词（七）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐ Level 7',
      pairs: [
        { left: card(null, '块'), right: card(null, '木头') },
        { left: card(null, '群'), right: card(null, '狐狸') },
        { left: card(null, '片'), right: card(null, '天空') },
        { left: card(null, '颗'), right: card(null, '葡萄') },
        { left: card(null, '瓶'), right: card(null, '油')   },
        { left: card(null, '头'), right: card(null, '骆驼') },
        { left: card(null, '双'), right: card('kuài zi', '筷子') },
        { left: card(null, '座'), right: card(null, '房子') },
      ]
    },
    {
      id: 8, cls: 'lv8',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐ Level 8 — Measure Words 量词（八）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐ Level 8',
      pairs: [
        { left: card(null, '套'), right: card(null, '书')   },
        { left: card(null, '面'), right: card('qiáng',  '墙')   },
        { left: card(null, '根'), right: card(null, '线')   },
        { left: card(null, '双'), right: card(null, '脚')   },
        { left: card(null, '顶'), right: card(null, '伞')   },
        { left: card(null, '匹'), right: card(null, '布')   },
        { left: card(null, '座'), right: card(null, '桥')   },
      ]
    },
    {
      id: 9, cls: 'lv9',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 9 — Measure Words 量词（九）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 9',
      pairs: [
        { left: card(null, '头'), right: card(null, '牛')   },
        { left: card(null, '瓶'), right: card(null, '水')   },
        { left: card(null, '颗'), right: card(null, '花生') },
        { left: card(null, '群'), right: card(null, '老人') },
        { left: card(null, '片'), right: card(null, '海洋') },
        { left: card(null, '块'), right: card(null, '肉')   },
        { left: card(null, '道'), right: card(null, '题目') },
        { left: card(null, '根'), right: card('mù bàng', '木棒') },
      ]
    },
    {
      id: 10, cls: 'lv10',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 10 — Measure Words 量词（十）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 10',
      pairs: [
        { left: card(null, '头'), right: card(null, '猪')   },
        { left: card(null, '瓶'), right: card(null, '盐')   },
        { left: card(null, '颗'), right: card(null, '糖果') },
        { left: card(null, '群'), right: card(null, '鸟')   },
        { left: card(null, '片'), right: card(null, '草地') },
        { left: card(null, '块'), right: card(null, '水果') },
        { left: card(null, '道'), right: card(null, '点心') },
        { left: card(null, '根'), right: card(null, '头发') },
      ]
    },
    {
      id: 11, cls: 'lv11',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 11 — Measure Words 量词（十一）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 11',
      pairs: [
        { left: card(null, '头'), right: card(null, '狮子')  },
        { left: card(null, '瓶'), right: card(null, '白糖')  },
        { left: card(null, '颗'), right: card(null, '小石子') },
        { left: card(null, '群'), right: card(null, '羊')    },
        { left: card(null, '片'), right: card(null, '饼干')  },
        { left: card(null, '道'), right: card(null, '线条')  },
        { left: card(null, '根'), right: card(null, '草')    },
        { left: card(null, '顶'), right: card('wén zhàng', '蚊帐') },
      ]
    },
    {
      id: 12, cls: 'lv12',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 12 — Measure Words 量词（十二）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 12',
      pairs: [
        { left: card('zhī',   '枝'), right: card('là zhú',     '蜡烛') },
        { left: card('lì',    '粒'), right: card('zuàn shí',   '钻石') },
        { left: card('kǒu',   '口'), right: card('jǐng',       '井')   },
        { left: card('jù',    '句'), right: card('shī',        '诗')   },
        { left: card('bǎ',    '把'), right: card(null,         '伞')   },
        { left: card('zhāng', '张'), right: card(null,         '床')   },
        { left: card('tǒng',  '桶'), right: card(null,         '油')   },
      ]
    },
    {
      id: 13, cls: 'lv13',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 13 — Measure Words 量词（十三）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 13',
      pairs: [
        { left: card('lì',    '粒'), right: card('zhǒng zi',   '种子') },
        { left: card('kǒu',   '口'), right: card('chí táng',   '池塘') },
        { left: card('jù',    '句'), right: card(null,         '话')   },
        { left: card('bǎ',    '把'), right: card('yào shi',    '钥匙') },
        { left: card('zhāng', '张'), right: card(null,         '桌子') },
        { left: card('biàn',  '遍'), right: card('kè wén',     '课文') },
      ]
    },
    {
      id: 14, cls: 'lv14',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 14 — Measure Words 量词（十四）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 14',
      pairs: [
        { left: card('zhī',   '枝'), right: card(null,         '花')   },
        { left: card('kǒu',   '口'), right: card('guō',        '锅')   },
        { left: card('jù',    '句'), right: card('jù zi',      '句子') },
        { left: card('zhāng', '张'), right: card('dì tú',      '地图') },
        { left: card(null,    '袋'), right: card('shuǐ guǒ',   '水果') },
        { left: card('lǐ',    '里'), right: card(null,         '路')   },
        { left: card('biàn',  '遍'), right: card('diàn yǐng',  '电影') },
      ]
    },
  ]
};

/* ═══════════════════════════════════════════════════════════════
   PACK 4 — Character Structure 汉字结构
═══════════════════════════════════════════════════════════════ */
const PACK_STRUCTURE = {
  id: 'structure',
  icon: '🧩',
  name: 'Character Structure',
  nameCN: '汉字结构',
  desc: 'Match each character to its structural type',
  attribution: null,
  levels: [
    {
      id: 1, cls: 'lv1',
      label:      '⭐ Level 1 — 汉字结构（一）',
      shortLabel: '⭐ Level 1',
      pairs: [
        { left: card(null,        '月'), right: card('dú tǐ zì',           '独体字')     },
        { left: card(null,        '笑'), right: card('shàng xià',          '上下结构')   },
        { left: card(null,        '高'), right: card('shàng zhōng xià',    '上中下结构') },
        { left: card(null,        '记'), right: card('zuǒ yòu',            '左右结构')   },
        { left: card(null,        '游'), right: card('zuǒ zhōng yòu',      '左中右结构') },
        { left: card(null,        '国'), right: card('quán bāo wéi',       '全包围结构') },
        { left: card(null,        '远'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 2, cls: 'lv2',
      label:      '⭐⭐ Level 2 — 汉字结构（二）',
      shortLabel: '⭐⭐ Level 2',
      pairs: [
        { left: card(null,        '日'), right: card('dú tǐ zì',           '独体字')     },
        { left: card(null,        '苹'), right: card('shàng xià',          '上下结构')   },
        { left: card(null,        '亮'), right: card('shàng zhōng xià',    '上中下结构') },
        { left: card('qīng',      '蜻'), right: card('zuǒ yòu',            '左右结构')   },
        { left: card('bān',       '班'), right: card('zuǒ zhōng yòu',      '左中右结构') },
        { left: card(null,        '回'), right: card('quán bāo wéi',       '全包围结构') },
        { left: card(null,        '病'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 3, cls: 'lv3',
      label:      '⭐⭐⭐ Level 3 — 汉字结构（三）',
      shortLabel: '⭐⭐⭐ Level 3',
      pairs: [
        { left: card(null,        '土'), right: card('dú tǐ zì',           '独体字')     },
        { left: card(null,        '哭'), right: card('shàng xià',          '上下结构')   },
        { left: card('bí',        '鼻'), right: card('shàng zhōng xià',    '上中下结构') },
        { left: card('è',         '饿'), right: card('zuǒ yòu',            '左右结构')   },
        { left: card('bāi',       '掰'), right: card('zuǒ zhōng yòu',      '左中右结构') },
        { left: card(null,        '圈'), right: card('quán bāo wéi',       '全包围结构') },
        { left: card('dài',       '戴'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 4, cls: 'lv4',
      label:      '⭐⭐⭐⭐ Level 4 — 汉字结构（四）',
      shortLabel: '⭐⭐⭐⭐ Level 4',
      pairs: [
        { left: card(null,        '米'), right: card('dú tǐ zì',           '独体字')     },
        { left: card(null,        '音'), right: card('shàng xià',          '上下结构')   },
        { left: card(null,        '意'), right: card('shàng zhōng xià',    '上中下结构') },
        { left: card(null,        '经'), right: card('zuǒ yòu',            '左右结构')   },
        { left: card('bàn',       '瓣'), right: card('zuǒ zhōng yòu',      '左中右结构') },
        { left: card(null,        '圆'), right: card('quán bāo wéi',       '全包围结构') },
        { left: card(null,        '画'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 5, cls: 'lv5',
      label:      '⭐⭐⭐⭐⭐ Level 5 — 汉字结构（五）',
      shortLabel: '⭐⭐⭐⭐⭐ Level 5',
      pairs: [
        { left: card(null,        '王'), right: card('dú tǐ zì',           '独体字')     },
        { left: card('láo',       '牢'), right: card('shàng xià',          '上下结构')   },
        { left: card('suàn',      '算'), right: card('shàng zhōng xià',    '上中下结构') },
        { left: card('dié',       '蝶'), right: card('zuǒ yòu',            '左右结构')   },
        { left: card(null,        '尾'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 6, cls: 'lv6',
      label:      '⭐⭐⭐⭐⭐⭐ Level 6 — 汉字结构（六）',
      shortLabel: '⭐⭐⭐⭐⭐⭐ Level 6',
      pairs: [
        { left: card(null,        '已'), right: card('dú tǐ zì',           '独体字')     },
        { left: card(null,        '等'), right: card('shàng xià',          '上下结构')   },
        { left: card(null,        '爱'), right: card('shàng zhōng xià',    '上中下结构') },
        { left: card('zāo',       '糟'), right: card('zuǒ yòu',            '左右结构')   },
        { left: card('zhe',       '着'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 7, cls: 'lv7',
      label:      '⭐⭐⭐⭐⭐⭐⭐ Level 7 — 汉字结构(七)',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐ Level 7',
      pairs: [
        { left: card(null,        '田'), right: card('dú tǐ zì',           '独体字')     },
        { left: card('tū',        '突'), right: card('shàng xià',          '上下结构')   },
        { left: card('hǎn',       '喊'), right: card('zuǒ yòu',            '左右结构')   },
        { left: card('pǐ',        '匹'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 8, cls: 'lv8',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐ Level 8 — 汉字结构（八）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐ Level 8',
      pairs: [
        { left: card(null,        '木'), right: card('dú tǐ zì',           '独体字')     },
        { left: card('zěn',       '怎'), right: card('shàng xià',          '上下结构')   },
        { left: card(null,        '伯'), right: card('zuǒ yòu',            '左右结构')   },
        { left: card(null,        '向'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 9, cls: 'lv9',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 9 — 汉字结构（九）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 9',
      pairs: [
        { left: card(null,        '虫'), right: card('dú tǐ zì',           '独体字')     },
        { left: card('bèn',       '笨'), right: card('shàng xià',          '上下结构')   },
        { left: card('tòng',      '痛'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 10, cls: 'lv10',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 10 — 汉字结构（十）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 10',
      pairs: [
        { left: card(null,        '正'), right: card('dú tǐ zì',           '独体字')     },
        { left: card('wàng',      '忘'), right: card('shàng xià',          '上下结构')   },
        { left: card('fáng',      '房'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
    {
      id: 11, cls: 'lv11',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 11 — 汉字结构（十一）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ Level 11',
      pairs: [
        { left: card('tóu',       '头'), right: card('dú tǐ zì',           '独体字')     },
        { left: card('yuè',       '越'), right: card('bàn bāo wéi',        '半包围结构') },
      ]
    },
  ]
};

/* ═══════════════════════════════════════════════════════════════
   PACK 5 — Radicals 偏旁部首 (display-only, parent-led)
═══════════════════════════════════════════════════════════════ */
const PACK_RADICALS = {
  id: 'radicals',
  icon: '🖋️',
  name: 'Radicals',
  nameCN: '偏旁部首',
  desc: 'Watch a radical animate, name it, then think of an example character',
  type: 'display',
  attribution: `Stroke animation powered by <a href="https://hanziwriter.org/" target="_blank" rel="noopener">Hanzi Writer</a>
    (data from <a href="https://github.com/skishore/makemeahanzi" target="_blank" rel="noopener">Make Me a Hanzi</a>),
    used under the <a href="https://github.com/chanind/hanzi-writer/blob/master/LICENSE" target="_blank" rel="noopener">ARPHIC license</a>.`,
  levels: [
    {
      id: 1, cls: 'lv1',
      label:      '⭐ Level 1 — 偏旁部首（一）',
      shortLabel: '⭐ Level 1',
      items: [
        { char: '口', pinyin: 'kǒu zì páng',  nameCN: '口字旁',  examples: ['吃','叫','吗','听'] },
        { char: '扌', pinyin: 'tí shǒu páng', nameCN: '提手旁',  examples: ['打','拍','抱','扔'] },
        { char: '木', pinyin: 'mù zì páng',   nameCN: '木字旁',  examples: ['树','林','桥','板'] },
        { char: '日', pinyin: 'rì zì páng',   nameCN: '日字旁',  examples: ['时','明','晴','暗'] },
        { char: '石', pinyin: 'shí zì páng',  nameCN: '石字旁',  examples: ['破','硬','码','碗'] },
      ],
    },
    {
      id: 2, cls: 'lv2',
      label:      '⭐⭐ Level 2 — 偏旁部首（二）',
      shortLabel: '⭐⭐ Level 2',
      items: [
        { char: '女', pinyin: 'nǚ zì páng',    nameCN: '女字旁',  examples: ['妈','姐','妹','好'] },
        { char: '氵', pinyin: 'sān diǎn shuǐ', nameCN: '三点水',  examples: ['江','河','海','流'] },
        { char: '月', pinyin: 'ròu yuè páng',  nameCN: '肉月旁',  examples: ['肚','脸','脚','胖'] },
        { char: '亻', pinyin: 'dān rén páng',  nameCN: '单人旁',  examples: ['你','他','们','住'] },
        { char: '穴', pinyin: 'xué bǎo gài',   nameCN: '穴宝盖',  examples: ['空','穿','突','窗'] },
      ],
    },
    {
      id: 3, cls: 'lv3',
      label:      '⭐⭐⭐ Level 3 — 偏旁部首（三）',
      shortLabel: '⭐⭐⭐ Level 3',
      items: [
        { char: '犭', pinyin: 'fǎn quǎn páng', nameCN: '反犬旁',  examples: ['狗','猫','狮','猪'] },
        { char: '艹', pinyin: 'cǎo zì tóu',    nameCN: '草字头',  examples: ['花','草','苹','茶'] },
        { char: '讠', pinyin: 'yán zì páng',   nameCN: '言字旁',  examples: ['说','话','请','谢'] },
        { char: '人', pinyin: 'rén zì tóu',    nameCN: '人字旁/头', examples: ['从','众','个','今'] },
        { char: '辶', pinyin: 'zǒu zhī dǐ',    nameCN: '走之底',  examples: ['进','远','还','这'] },
      ],
    },
    {
      id: 4, cls: 'lv4',
      label:      '⭐⭐⭐⭐ Level 4 — 偏旁部首（四）',
      shortLabel: '⭐⭐⭐⭐ Level 4',
      items: [
        { char: '纟', pinyin: 'jiǎo sī páng',  nameCN: '绞丝旁',  examples: ['红','绿','线','细'] },
        { char: '竹', pinyin: 'zhú zì tóu',    nameCN: '竹字头',  examples: ['笑','笔','答','算'] },
        { char: '土', pinyin: 'tí tǔ páng',    nameCN: '提土旁',  examples: ['地','块','城','场'] },
        { char: '王', pinyin: 'wáng zì páng',  nameCN: '王字旁/底', examples: ['玩','球','现','理'] },
        { char: '心', pinyin: 'xīn zì dǐ',     nameCN: '心字底',  examples: ['想','念','思','怎'] },
      ],
    },
    {
      id: 5, cls: 'lv5',
      label:      '⭐⭐⭐⭐⭐ Level 5 — 偏旁部首（五）',
      shortLabel: '⭐⭐⭐⭐⭐ Level 5',
      items: [
        { char: '宀', pinyin: 'bǎo gài tóu',   nameCN: '宝盖头',  examples: ['家','安','字','完'] },
        { char: '灬', pinyin: 'sì diǎn dǐ',    nameCN: '四点底',  examples: ['热','点','然','照'] },
        { char: '又', pinyin: 'yòu zì páng',   nameCN: '又字旁',  examples: ['友','双','对','取'] },
        { char: '目', pinyin: 'mù zì páng',    nameCN: '目字旁',  examples: ['看','眼','睛','睡'] },
        { char: '刂', pinyin: 'lì dāo páng',   nameCN: '立刀旁',  examples: ['别','到','刚','利'] },
      ],
    },
    {
      id: 6, cls: 'lv6',
      label:      '⭐⭐⭐⭐⭐⭐ Level 6 — 偏旁部首（六）',
      shortLabel: '⭐⭐⭐⭐⭐⭐ Level 6',
      items: [
        { char: '匚', pinyin: 'sān kuàng',     nameCN: '半边框/三框', examples: ['区','医','匹','匠'] },
        { char: '疒', pinyin: 'bìng zì páng',  nameCN: '病字旁',  examples: ['病','痛','疼','疯'] },
        { char: '钅', pinyin: 'jīn zì páng',   nameCN: '金字旁',  examples: ['银','钟','钱','错'] },
        { char: '忄', pinyin: 'shù xīn páng',  nameCN: '竖心旁',  examples: ['怕','快','忙','慢'] },
        { char: '走', pinyin: 'zǒu zì páng',   nameCN: '走字旁',  examples: ['起','越','赶','超'] },
      ],
    },
    {
      id: 7, cls: 'lv7',
      label:      '⭐⭐⭐⭐⭐⭐⭐ Level 7 — 偏旁部首（七）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐ Level 7',
      items: [
        { char: '火', pinyin: 'huǒ zì páng',   nameCN: '火字旁',  examples: ['灯','烧','炸','烟'] },
        { char: '囗', pinyin: 'dà kǒu kuàng',  nameCN: '大口框',  examples: ['国','圆','园','围'] },
        { char: '彳', pinyin: 'shuāng rén páng', nameCN: '双人旁', examples: ['行','很','待','往'] },
        { char: '虫', pinyin: 'chóng zì páng', nameCN: '虫字旁',  examples: ['蚂','蚊','蛇','虾'] },
        { char: '冖', pinyin: 'tū bǎo gài',    nameCN: '秃宝盖',  examples: ['写','军','农','冠'] },
      ],
    },
    {
      id: 8, cls: 'lv8',
      label:      '⭐⭐⭐⭐⭐⭐⭐⭐ Level 8 — 偏旁部首（八）',
      shortLabel: '⭐⭐⭐⭐⭐⭐⭐⭐ Level 8',
      items: [
        { char: '衣', pinyin: 'yī zì dǐ',      nameCN: '衣字底',  examples: ['装','袋','裹','裂'] },
        { char: '子', pinyin: 'zǐ zì páng',    nameCN: '子字旁',  examples: ['孩','孙','学','孔'] },
        { char: '身', pinyin: 'shēn zì páng',  nameCN: '身字旁',  examples: ['躲','躺','射','躬'] },
        { char: '足', pinyin: 'zú zì páng',    nameCN: '足字旁',  examples: ['跑','跳','路','踢'] },
        { char: '羊', pinyin: 'yáng zì tóu',   nameCN: '羊字旁/头', examples: ['美','群','着','差'] },
      ],
    },
  ],
};

/* ── Master pack registry ── */
const GAME_PACKS = [PACK_STROKES, PACK_ANTONYMS, PACK_MEASURE, PACK_STRUCTURE, PACK_RADICALS];
