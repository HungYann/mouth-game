import { useEffect, useCallback, useRef } from 'react'

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

interface UseKeyboardControlProps {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
  playerActionsRef: React.MutableRefObject<
    { startTime: number; endTime: number }[]
  >
}

export function useKeyboardControl({
  gameState,
  setGameState,
  playerActionsRef
}: UseKeyboardControlProps) {
  const spaceDownTimeRef = useRef<number | null>(null)
  const isSpaceDownRef = useRef(false)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()

        // 只在游戏进行阶段响应空格键
        if (gameState.gamePhase !== 'playing') return

        // 防止重复触发
        if (isSpaceDownRef.current) return

        isSpaceDownRef.current = true
        spaceDownTimeRef.current = Date.now() - gameState.playStartTime

        setGameState(prev => ({
          ...prev,
          isPlayerMouthOpen: true
        }))
      }
    },
    [gameState.gamePhase, gameState.playStartTime, setGameState]
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()

        // 只在游戏进行阶段响应空格键
        if (gameState.gamePhase !== 'playing') return

        if (!isSpaceDownRef.current || spaceDownTimeRef.current === null) return

        isSpaceDownRef.current = false
        const endTime = Date.now() - gameState.playStartTime

        // 记录玩家动作
        playerActionsRef.current.push({
          startTime: spaceDownTimeRef.current,
          endTime: endTime
        })

        spaceDownTimeRef.current = null

        setGameState(prev => ({
          ...prev,
          isPlayerMouthOpen: false
        }))
      }
    },
    [
      gameState.gamePhase,
      gameState.playStartTime,
      setGameState,
      playerActionsRef
    ]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // 重置状态当游戏阶段改变时
  useEffect(() => {
    if (gameState.gamePhase !== 'playing') {
      isSpaceDownRef.current = false
      spaceDownTimeRef.current = null
      setGameState(prev => ({
        ...prev,
        isPlayerMouthOpen: false
      }))
    }
  }, [gameState.gamePhase, setGameState])
}
