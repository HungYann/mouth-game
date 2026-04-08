import { useState, useEffect, useCallback, useRef } from 'react'
import { gameLevels } from '../data/levels'

interface PersonState {
  index: number
  isMouthOpen: boolean
  isPlayer: boolean
}

interface GameAction {
  personIndex: number // 小牛马索引 (0-4)
  startTime: number // 开始张嘴时间 (毫秒)
  duration: number // 张嘴持续时间 (毫秒)
}

interface ActiveLevel {
  actions: GameAction[]
  totalDuration: number
}

interface GameState {
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

// const COUNTDOWN_DURATION = 3000 // 3秒倒计时 (暂未使用)

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 0,
    lives: 3,
    score: 0,
    gamePhase: 'waiting',
    playerIndex: -1, // 初始时未选择玩家，等待开始游戏时随机
    isPlayerMouthOpen: false,
    demoStartTime: 0,
    playStartTime: 0,
    currentTime: 0
  })

  const [demoPersons, setDemoPersons] = useState<PersonState[]>([])
  const [playPersons, setPlayPersons] = useState<PersonState[]>([])
  const [countdown, setCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeLevel, setActiveLevel] = useState<ActiveLevel | null>(null)

  const animationFrameRef = useRef<number | undefined>(undefined)
  const playerActionsRef = useRef<{ startTime: number; endTime: number }[]>([])

  const getRoundLevel = useCallback(
    (levelIndex: number): ActiveLevel => {
      const baseLevel = gameLevels[levelIndex]
      if (!baseLevel) {
        return { actions: [], totalDuration: 3000 }
      }

      // 前4关保持更稳定，5关后随机扰动逐渐增强
      if (levelIndex < 4) {
        return {
          actions: baseLevel.actions.map(action => ({ ...action })),
          totalDuration: baseLevel.totalDuration
        }
      }

      const intensity = Math.min(1, 0.35 + (levelIndex - 4) * 0.06)
      const clusterJitterRange = Math.round(120 + intensity * 300)
      const microJitterRange = Math.round(40 + intensity * 120)
      const durationRatio = 0.15 + intensity * 0.25
      const personShift = Math.floor(Math.random() * 5)

      const clusterJitterMap = new Map<number, number>()
      for (const action of baseLevel.actions) {
        if (!clusterJitterMap.has(action.startTime)) {
          const clusterJitter =
            (Math.random() * 2 - 1) * clusterJitterRange
          clusterJitterMap.set(action.startTime, Math.round(clusterJitter))
        }
      }

      const randomizedActions = baseLevel.actions
        .map(action => {
          const clusterJitter = clusterJitterMap.get(action.startTime) ?? 0
          const microJitter = Math.round(
            (Math.random() * 2 - 1) * microJitterRange
          )
          const startTime = Math.max(
            120,
            action.startTime + clusterJitter + microJitter
          )

          const ratio = 1 + (Math.random() * 2 - 1) * durationRatio
          const duration = Math.max(220, Math.round(action.duration * ratio))

          let personIndex = (action.personIndex + personShift) % 5
          if (Math.random() < intensity * 0.35) {
            const extraShift = Math.floor(Math.random() * 3) - 1 // -1,0,1
            personIndex = (personIndex + extraShift + 5) % 5
          }

          return { personIndex, startTime, duration }
        })
        .sort((a, b) => a.startTime - b.startTime)

      const maxEnd = randomizedActions.reduce(
        (maxValue, action) => Math.max(maxValue, action.startTime + action.duration),
        0
      )

      return {
        actions: randomizedActions,
        totalDuration: Math.max(baseLevel.totalDuration, maxEnd + 700)
      }
    },
    []
  )

  // 初始化小牛马状态
  const initializePersons = useCallback(() => {
    const persons: PersonState[] = Array.from({ length: 5 }, (_, index) => ({
      index,
      isMouthOpen: false,
      isPlayer: gameState.playerIndex >= 0 && index === gameState.playerIndex
    }))
    return persons
  }, [gameState.playerIndex])

  // 检查当前时间应该张嘴的小牛马
  const getActivePersons = useCallback(
    (actions: GameAction[], currentTime: number, startTime: number) => {
      const relativeTime = currentTime - startTime
      return actions
        .filter(
          action =>
            relativeTime >= action.startTime &&
            relativeTime <= action.startTime + action.duration
        )
        .map(action => action.personIndex)
    },
    []
  )

  // 检查玩家表现 - 严格检查次数、顺序和时机
  const checkPlayerPerformance = useCallback(() => {
    const currentLevel =
      activeLevel ??
      gameLevels[gameState.currentLevel] ?? {
        actions: [],
        totalDuration: 3000
      }
    const playerActions = currentLevel.actions
      .filter(action => action.personIndex === gameState.playerIndex)
      .sort((a, b) => a.startTime - b.startTime) // 按时间顺序排序

    const recordedActions = playerActionsRef.current.sort(
      (a, b) => a.startTime - b.startTime
    )

    let hasError = false
    let errorMessage = ''

    console.log('检查玩家表现:', {
      playerIndex: gameState.playerIndex,
      expectedActions: playerActions.length,
      recordedActionsCount: recordedActions.length,
      playerActions: playerActions.map((a, i) => ({
        index: i,
        start: a.startTime,
        duration: a.duration
      })),
      recordedActionsList: recordedActions.map((a, i) => ({
        index: i,
        start: a.startTime,
        end: a.endTime,
        duration: a.endTime - a.startTime
      }))
    })

    // 1. 检查张嘴次数是否正确
    if (recordedActions.length !== playerActions.length) {
      hasError = true
      if (recordedActions.length < playerActions.length) {
        errorMessage = `张嘴次数不够！应该张嘴${playerActions.length}次，实际只张了${recordedActions.length}次`
      } else {
        errorMessage = `张嘴次数过多！应该张嘴${playerActions.length}次，实际张了${recordedActions.length}次`
      }
    }

    // 2. 检查张嘴顺序和时机是否正确
    if (!hasError && playerActions.length > 0) {
      for (let i = 0; i < playerActions.length; i++) {
        const expectedAction = playerActions[i]
        const recordedAction = recordedActions[i]

        if (!recordedAction) {
          hasError = true
          errorMessage = `第${i + 1}次张嘴缺失！`
          break
        }

        const expectedStart = expectedAction.startTime
        const recordedStart = recordedAction.startTime
        const recordedEnd = recordedAction.endTime

        // 检查时机是否正确（允许±600ms误差）
        const startTimeDiff = Math.abs(recordedStart - expectedStart)

        if (startTimeDiff > 600) {
          hasError = true
          errorMessage = `第${
            i + 1
          }次张嘴时机不对！开始时间偏差${startTimeDiff}ms`
          break
        }

        // 检查时长是否合理（允许±800ms误差）
        const expectedDuration = expectedAction.duration
        const recordedDuration = recordedEnd - recordedStart
        const durationDiff = Math.abs(recordedDuration - expectedDuration)

        if (durationDiff > 800) {
          hasError = true
          errorMessage = `第${i + 1}次张嘴时长不对！时长偏差${durationDiff}ms`
          break
        }
      }
    }

    // 3. 检查是否一直张嘴不闭嘴（检测超长张嘴）
    if (!hasError && recordedActions.length > 0 && playerActions.length > 0) {
      const maxAllowedDuration =
        Math.max(...playerActions.map(a => a.duration)) + 1000 // 最长允许时间 + 1秒容错

      for (let i = 0; i < recordedActions.length; i++) {
        const recordedAction = recordedActions[i]
        const recordedDuration =
          recordedAction.endTime - recordedAction.startTime

        if (recordedDuration > maxAllowedDuration) {
          hasError = true
          errorMessage = `第${i + 1}次张嘴时间太长！一直张嘴不闭嘴算失败`
          break
        }
      }
    }

    // 4. 特殊情况：如果没有要求动作，但玩家张嘴了，算作错误
    if (!hasError && playerActions.length === 0 && recordedActions.length > 0) {
      hasError = true
      errorMessage = '不该张嘴时张嘴了！这轮你应该保持安静'
    }

    if (hasError) {
      // 玩家出错
      setGameState(prev => ({
        ...prev,
        lives: prev.lives - 1,
        gamePhase: prev.lives <= 1 ? 'gameOver' : 'result'
      }))
      setErrorMessage(errorMessage || '出错了！点击重试')
    } else {
      // 玩家成功
      setGameState(prev => ({
        ...prev,
        score: prev.score + 10,
        currentLevel: prev.currentLevel + 1,
        gamePhase:
          prev.currentLevel + 1 >= gameLevels.length ? 'gameOver' : 'result'
      }))
      setErrorMessage('')
    }

    playerActionsRef.current = []
  }, [gameState.currentLevel, gameState.playerIndex, activeLevel])

  // 更新游戏时间和动画
  const updateGame = useCallback(() => {
    const now = Date.now()
    setGameState(prev => ({ ...prev, currentTime: now }))

    if (gameState.gamePhase === 'demo' && gameState.demoStartTime > 0) {
      const currentLevel =
        activeLevel ??
        gameLevels[gameState.currentLevel] ?? {
          actions: [],
          totalDuration: 3000
        }
      const activePersonIndexes = getActivePersons(
        currentLevel.actions,
        now,
        gameState.demoStartTime
      )

      setDemoPersons(prev =>
        prev.map(person => ({
          ...person,
          isMouthOpen: activePersonIndexes.includes(person.index)
        }))
      )

      // 检查demo是否结束
      if (now - gameState.demoStartTime >= currentLevel.totalDuration) {
        setGameState(prev => ({ ...prev, gamePhase: 'countdown' }))
        setCountdown(1)
        return
      }
    }

    if (gameState.gamePhase === 'playing' && gameState.playStartTime > 0) {
      const currentLevel =
        activeLevel ??
        gameLevels[gameState.currentLevel] ?? {
          actions: [],
          totalDuration: 3000
        }
      const activePersonIndexes = getActivePersons(
        currentLevel.actions,
        now,
        gameState.playStartTime
      )

      // 更新非玩家小牛马
      setPlayPersons(prev =>
        prev.map(person => ({
          ...person,
          isMouthOpen: person.isPlayer
            ? gameState.isPlayerMouthOpen
            : activePersonIndexes.includes(person.index)
        }))
      )

      // 检查游戏是否结束
      if (now - gameState.playStartTime >= currentLevel.totalDuration) {
        checkPlayerPerformance()
        return
      }
    }

    if (gameState.gamePhase === 'demo' || gameState.gamePhase === 'playing') {
      animationFrameRef.current = requestAnimationFrame(updateGame)
    }
  }, [
    gameState.gamePhase,
    gameState.demoStartTime,
    gameState.playStartTime,
    gameState.currentLevel,
    gameState.isPlayerMouthOpen,
    activeLevel,
    getActivePersons,
    checkPlayerPerformance
  ])

  // 开始游戏 - 每次开始时随机选择玩家位置
  const startGame = useCallback(() => {
    if (gameState.currentLevel >= gameLevels.length) {
      setGameState(prev => ({ ...prev, gamePhase: 'gameOver' }))
      return
    }

    // 只有在第一次开始游戏时（currentLevel为0）才随机选择玩家位置
    const shouldRandomizePlayer = gameState.currentLevel === 0

    // 使用更好的随机算法，确保真正的均匀分布
    const generateRandomPlayerIndex = () => {
      // 方法1：使用crypto.getRandomValues获得更好的随机性（如果可用）
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1)
        crypto.getRandomValues(array)
        const result = array[0] % 5
        console.log('使用crypto随机算法，结果:', result)
        return result
      }

      // 方法2：使用多重随机数生成，避免Math.random()的潜在偏差
      let randomValue = 0
      // 生成多个随机数并组合，提高随机性
      for (let i = 0; i < 5; i++) {
        randomValue += Math.random()
      }
      // 使用模运算确保均匀分布
      const result = Math.floor((randomValue % 1) * 5)
      console.log('使用多重随机算法，结果:', result)
      return result
    }

    const newPlayerIndex = shouldRandomizePlayer
      ? generateRandomPlayerIndex()
      : gameState.playerIndex
    const roundLevel = getRoundLevel(gameState.currentLevel)

    // 调试日志：记录随机选择的结果
    if (shouldRandomizePlayer) {
      console.log('随机选择玩家位置:', newPlayerIndex)
    }
    console.log('本轮动作随机扰动:', {
      level: gameState.currentLevel + 1,
      actionCount: roundLevel.actions.length,
      totalDuration: roundLevel.totalDuration
    })

    setGameState(prev => ({
      ...prev,
      playerIndex: newPlayerIndex,
      gamePhase: 'demo',
      demoStartTime: Date.now(),
      isPlayerMouthOpen: false
    }))

    // 使用新的玩家位置初始化小牛马
    const initPersonsWithPlayer = () => {
      return Array.from({ length: 5 }, (_, index) => ({
        index,
        isMouthOpen: false,
        isPlayer: index === newPlayerIndex
      }))
    }

    setDemoPersons(initPersonsWithPlayer())
    setPlayPersons(initPersonsWithPlayer())
    setActiveLevel(roundLevel)
    playerActionsRef.current = []
  }, [gameState.currentLevel, gameState.playerIndex, getRoundLevel])

  // 重试当前关卡 - 保持相同的关卡和玩家位置
  const retryLevel = useCallback(() => {
    const roundLevel = getRoundLevel(gameState.currentLevel)

    // 确保不改变玩家位置，直接重新开始当前关卡
    setDemoPersons(initializePersons())
    setPlayPersons(initializePersons())
    setActiveLevel(roundLevel)
    setGameState(prev => ({
      ...prev,
      gamePhase: 'demo',
      demoStartTime: Date.now(),
      isPlayerMouthOpen: false
      // 注意：不改变 playerIndex 和 currentLevel
    }))
    playerActionsRef.current = []
  }, [gameState.playerIndex, gameState.currentLevel, initializePersons, getRoundLevel])

  // 下一关 - 保持玩家位置不变
  const nextLevel = useCallback(() => {
    // 不改变玩家位置，只进入下一关
    startGame()
  }, [startGame])

  // 重置游戏 - 重置到初始状态，等待下次开始游戏时随机选择玩家
  const resetGame = useCallback(() => {
    setGameState({
      currentLevel: 0,
      lives: 3,
      score: 0,
      gamePhase: 'waiting',
      playerIndex: -1, // 重置为未选择状态
      isPlayerMouthOpen: false,
      demoStartTime: 0,
      playStartTime: 0,
      currentTime: 0
    })
    setErrorMessage('')
    setActiveLevel(null)
    playerActionsRef.current = []
  }, [])

  // 启动动画循环
  useEffect(() => {
    if (gameState.gamePhase === 'demo' || gameState.gamePhase === 'playing') {
      animationFrameRef.current = requestAnimationFrame(updateGame)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState.gamePhase, updateGame])

  // 倒计时逻辑
  useEffect(() => {
    if (gameState.gamePhase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          setGameState(prev => ({
            ...prev,
            gamePhase: 'playing',
            playStartTime: Date.now()
          }))
          setCountdown(0)
        } else {
          setCountdown(prev => prev - 1)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [gameState.gamePhase, countdown])

  return {
    gameState,
    demoPersons,
    playPersons,
    countdown,
    errorMessage,
    startGame,
    retryLevel,
    nextLevel,
    resetGame,
    setGameState,
    setCountdown,
    playerActionsRef
  }
}
