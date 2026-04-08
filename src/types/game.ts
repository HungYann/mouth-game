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

export interface GameState {
  currentLevel: number
  lives: number
  score: number
  gamePhase:
    | 'waiting'
    | 'demo'
    | 'countdown'
    | 'playing'
    | 'result'
    | 'gameOver'
  playerIndex: number // 玩家控制的小牛马索引
  isPlayerMouthOpen: boolean
  demoStartTime: number
  playStartTime: number
  currentTime: number
}

export interface PersonState {
  index: number
  isMouthOpen: boolean
  isPlayer: boolean
}

// 称号系统
export const getTitleByScore = (score: number): string => {
  if (score < 100) return '小笨嘴'
  if (score < 200) return '抹了蜜小嘴'
  return '嘴强王者'
}
