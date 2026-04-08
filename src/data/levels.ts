// 游戏数据类型定义
export interface GameAction {
  personIndex: number // 小牛马索引 (0-4)
  startTime: number // 开始张嘴时间 (毫秒)
  duration: number // 张嘴持续时间 (毫秒)
}

export interface GameLevel {
  id: number
  actions: GameAction[]
  totalDuration: number // 整个关卡持续时间
}

// 20轮比赛的游戏数据 - 难度逐渐提升
export const gameLevels: GameLevel[] = [
  // 第1关 - 入门级，单人简单节奏
  {
    id: 1,
    totalDuration: 4000,
    actions: [
      { personIndex: 2, startTime: 1000, duration: 800 },
      { personIndex: 2, startTime: 2500, duration: 600 }
    ]
  },

  // 第2关 - 基础级，两个不同小牛马
  {
    id: 2,
    totalDuration: 5000,
    actions: [
      { personIndex: 1, startTime: 800, duration: 600 },
      { personIndex: 3, startTime: 2200, duration: 700 }
    ]
  },

  // 第3关 - 三个动作
  {
    id: 3,
    totalDuration: 6000,
    actions: [
      { personIndex: 0, startTime: 500, duration: 600 },
      { personIndex: 4, startTime: 1800, duration: 500 },
      { personIndex: 2, startTime: 3500, duration: 700 }
    ]
  },

  // 第4关 - 四个动作，间隔适中
  {
    id: 4,
    totalDuration: 7000,
    actions: [
      { personIndex: 1, startTime: 400, duration: 500 },
      { personIndex: 3, startTime: 1400, duration: 600 },
      { personIndex: 0, startTime: 2800, duration: 500 },
      { personIndex: 4, startTime: 4500, duration: 600 }
    ]
  },

  // 第5关 - 引入同时张嘴
  {
    id: 5,
    totalDuration: 6500,
    actions: [
      { personIndex: 1, startTime: 600, duration: 700 },
      { personIndex: 3, startTime: 600, duration: 700 }, // 同时张嘴
      { personIndex: 2, startTime: 2200, duration: 600 },
      { personIndex: 0, startTime: 3800, duration: 500 }
    ]
  },

  // 第6关 - 五个动作，节奏加快
  {
    id: 6,
    totalDuration: 7500,
    actions: [
      { personIndex: 0, startTime: 300, duration: 500 },
      { personIndex: 2, startTime: 1200, duration: 600 },
      { personIndex: 4, startTime: 2400, duration: 500 },
      { personIndex: 1, startTime: 3600, duration: 600 },
      { personIndex: 3, startTime: 5000, duration: 500 }
    ]
  },

  // 第7关 - 更多同时张嘴
  {
    id: 7,
    totalDuration: 8000,
    actions: [
      { personIndex: 0, startTime: 500, duration: 600 },
      { personIndex: 4, startTime: 500, duration: 600 }, // 同时张嘴
      { personIndex: 2, startTime: 1800, duration: 500 },
      { personIndex: 1, startTime: 3000, duration: 700 },
      { personIndex: 3, startTime: 4500, duration: 600 }
    ]
  },

  // 第8关 - 六个动作
  {
    id: 8,
    totalDuration: 8500,
    actions: [
      { personIndex: 1, startTime: 400, duration: 500 },
      { personIndex: 3, startTime: 1200, duration: 600 },
      { personIndex: 0, startTime: 2400, duration: 500 },
      { personIndex: 4, startTime: 3600, duration: 600 },
      { personIndex: 2, startTime: 4800, duration: 500 },
      { personIndex: 1, startTime: 6200, duration: 600 }
    ]
  },

  // 第9关 - 三人同时张嘴
  {
    id: 9,
    totalDuration: 7000,
    actions: [
      { personIndex: 0, startTime: 600, duration: 700 },
      { personIndex: 2, startTime: 600, duration: 700 }, // 同时张嘴
      { personIndex: 4, startTime: 600, duration: 700 }, // 三人同时张嘴
      { personIndex: 1, startTime: 2200, duration: 600 },
      { personIndex: 3, startTime: 3800, duration: 500 }
    ]
  },

  // 第10关 - 快速连续
  {
    id: 10,
    totalDuration: 8000,
    actions: [
      { personIndex: 0, startTime: 300, duration: 400 },
      { personIndex: 1, startTime: 1000, duration: 400 },
      { personIndex: 2, startTime: 1700, duration: 400 },
      { personIndex: 3, startTime: 2400, duration: 400 },
      { personIndex: 4, startTime: 3100, duration: 400 },
      { personIndex: 0, startTime: 4000, duration: 500 },
      { personIndex: 2, startTime: 5200, duration: 600 }
    ]
  },

  // 第11关 - 复杂同时张嘴
  {
    id: 11,
    totalDuration: 9000,
    actions: [
      { personIndex: 1, startTime: 500, duration: 600 },
      { personIndex: 3, startTime: 500, duration: 600 }, // 同时张嘴
      { personIndex: 0, startTime: 1800, duration: 500 },
      { personIndex: 2, startTime: 1800, duration: 500 }, // 同时张嘴
      { personIndex: 4, startTime: 3200, duration: 700 },
      { personIndex: 1, startTime: 4800, duration: 600 },
      { personIndex: 0, startTime: 6200, duration: 500 }
    ]
  },

  // 第12关 - 高频率动作
  {
    id: 12,
    totalDuration: 9500,
    actions: [
      { personIndex: 0, startTime: 200, duration: 400 },
      { personIndex: 2, startTime: 900, duration: 400 },
      { personIndex: 4, startTime: 1600, duration: 400 },
      { personIndex: 1, startTime: 2300, duration: 500 },
      { personIndex: 3, startTime: 3100, duration: 500 },
      { personIndex: 0, startTime: 3900, duration: 400 },
      { personIndex: 2, startTime: 4600, duration: 600 },
      { personIndex: 4, startTime: 5500, duration: 500 }
    ]
  },

  // 第13关 - 四人同时张嘴
  {
    id: 13,
    totalDuration: 8500,
    actions: [
      { personIndex: 0, startTime: 600, duration: 700 },
      { personIndex: 1, startTime: 600, duration: 700 }, // 同时张嘴
      { personIndex: 3, startTime: 600, duration: 700 }, // 同时张嘴
      { personIndex: 4, startTime: 600, duration: 700 }, // 四人同时张嘴
      { personIndex: 2, startTime: 2200, duration: 600 },
      { personIndex: 0, startTime: 3600, duration: 500 },
      { personIndex: 1, startTime: 4800, duration: 600 }
    ]
  },

  // 第14关 - 交替快速
  {
    id: 14,
    totalDuration: 10000,
    actions: [
      { personIndex: 0, startTime: 300, duration: 350 },
      { personIndex: 1, startTime: 800, duration: 350 },
      { personIndex: 2, startTime: 1300, duration: 350 },
      { personIndex: 3, startTime: 1800, duration: 350 },
      { personIndex: 4, startTime: 2300, duration: 350 },
      { personIndex: 0, startTime: 2900, duration: 400 },
      { personIndex: 2, startTime: 3500, duration: 400 },
      { personIndex: 4, startTime: 4100, duration: 400 },
      { personIndex: 1, startTime: 4800, duration: 500 }
    ]
  },

  // 第15关 - 重叠复杂
  {
    id: 15,
    totalDuration: 10500,
    actions: [
      { personIndex: 1, startTime: 400, duration: 800 },
      { personIndex: 3, startTime: 700, duration: 600 }, // 重叠
      { personIndex: 0, startTime: 1800, duration: 500 },
      { personIndex: 4, startTime: 1800, duration: 500 }, // 同时张嘴
      { personIndex: 2, startTime: 2800, duration: 700 },
      { personIndex: 1, startTime: 4000, duration: 600 },
      { personIndex: 3, startTime: 5200, duration: 500 },
      { personIndex: 0, startTime: 6400, duration: 600 }
    ]
  },

  // 第16关 - 超高频率
  {
    id: 16,
    totalDuration: 11000,
    actions: [
      { personIndex: 0, startTime: 200, duration: 300 },
      { personIndex: 1, startTime: 600, duration: 300 },
      { personIndex: 2, startTime: 1000, duration: 300 },
      { personIndex: 3, startTime: 1400, duration: 300 },
      { personIndex: 4, startTime: 1800, duration: 300 },
      { personIndex: 0, startTime: 2200, duration: 400 },
      { personIndex: 2, startTime: 2700, duration: 400 },
      { personIndex: 4, startTime: 3200, duration: 400 },
      { personIndex: 1, startTime: 3700, duration: 500 },
      { personIndex: 3, startTime: 4300, duration: 500 }
    ]
  },

  // 第17关 - 全员同时张嘴
  {
    id: 17,
    totalDuration: 9000,
    actions: [
      { personIndex: 0, startTime: 800, duration: 800 },
      { personIndex: 1, startTime: 800, duration: 800 }, // 同时张嘴
      { personIndex: 2, startTime: 800, duration: 800 }, // 同时张嘴
      { personIndex: 3, startTime: 800, duration: 800 }, // 同时张嘴
      { personIndex: 4, startTime: 800, duration: 800 }, // 五人同时张嘴
      { personIndex: 0, startTime: 2400, duration: 600 },
      { personIndex: 2, startTime: 3600, duration: 500 },
      { personIndex: 4, startTime: 4800, duration: 600 }
    ]
  },

  // 第18关 - 极限挑战
  {
    id: 18,
    totalDuration: 12000,
    actions: [
      { personIndex: 1, startTime: 300, duration: 400 },
      { personIndex: 3, startTime: 800, duration: 400 },
      { personIndex: 0, startTime: 1300, duration: 350 },
      { personIndex: 2, startTime: 1750, duration: 350 },
      { personIndex: 4, startTime: 2200, duration: 350 },
      { personIndex: 1, startTime: 2650, duration: 400 },
      { personIndex: 0, startTime: 3150, duration: 500 },
      { personIndex: 3, startTime: 3150, duration: 500 }, // 同时张嘴
      { personIndex: 2, startTime: 4200, duration: 600 },
      { personIndex: 4, startTime: 5200, duration: 500 },
      { personIndex: 1, startTime: 6000, duration: 400 }
    ]
  },

  // 第19关 - 大师级
  {
    id: 19,
    totalDuration: 13000,
    actions: [
      { personIndex: 0, startTime: 200, duration: 300 },
      { personIndex: 2, startTime: 600, duration: 300 },
      { personIndex: 4, startTime: 1000, duration: 300 },
      { personIndex: 1, startTime: 1400, duration: 400 },
      { personIndex: 3, startTime: 1400, duration: 400 }, // 同时张嘴
      { personIndex: 0, startTime: 2000, duration: 350 },
      { personIndex: 2, startTime: 2450, duration: 350 },
      { personIndex: 4, startTime: 2900, duration: 350 },
      { personIndex: 1, startTime: 3350, duration: 500 },
      { personIndex: 3, startTime: 3950, duration: 500 },
      { personIndex: 0, startTime: 4550, duration: 600 },
      { personIndex: 2, startTime: 5250, duration: 400 }
    ]
  },

  // 第20关 - 终极挑战
  {
    id: 20,
    totalDuration: 15000,
    actions: [
      { personIndex: 0, startTime: 300, duration: 400 },
      { personIndex: 1, startTime: 300, duration: 400 }, // 同时张嘴
      { personIndex: 2, startTime: 900, duration: 350 },
      { personIndex: 3, startTime: 1350, duration: 350 },
      { personIndex: 4, startTime: 1800, duration: 350 },
      { personIndex: 0, startTime: 2250, duration: 300 },
      { personIndex: 1, startTime: 2650, duration: 300 },
      { personIndex: 2, startTime: 3050, duration: 300 },
      { personIndex: 3, startTime: 3450, duration: 300 },
      { personIndex: 4, startTime: 3850, duration: 300 },
      { personIndex: 0, startTime: 4250, duration: 500 },
      { personIndex: 2, startTime: 4250, duration: 500 }, // 同时张嘴
      { personIndex: 4, startTime: 4250, duration: 500 }, // 三人同时张嘴
      { personIndex: 1, startTime: 5200, duration: 600 },
      { personIndex: 3, startTime: 6000, duration: 500 }
    ]
  }
]
