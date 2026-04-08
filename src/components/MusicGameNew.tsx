'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import PersonRow from './PersonRow'
import { useGameLogic } from '../hooks/useGameLogic'
import { useKeyboardControl } from '../hooks/useKeyboardControl'
import { useBackgroundMusic } from '../hooks/useBackgroundMusic'
import { stopAllVoiceSounds } from '../hooks/useVoiceSound'
import { gameLevels } from '../data/levels'

// 称号系统 - 新的分数要求
const getTitleByScore = (score: number): string => {
  if (score < 50) return '小笨嘴'
  if (score < 100) return '小嘴抹了蜜'
  if (score < 150) return '意大利嘴炮'
  if (score < 200) return '嘴强王者'
  return '传说嘴神' // 200分以上的超级称号
}

// 添加CSS样式来减少按钮抖动
const buttonHoverStyles = `
  .game-button {
    transition: all 0.1s ease !important;
    will-change: transform, box-shadow, background-color, color !important;
    backface-visibility: hidden !important;
  }
  .game-button:hover {
    background-color: #303030 !important;
    color: #fff !important;
    transform: translate(2px, 2px) !important;
    box-shadow: 4px 4px 0px #303030 !important;
  }
  .music-button:hover {
    background-color: #303030 !important;
    color: #fff !important;
    transform: translate(2px, 2px) !important;
    box-shadow: 2px 2px 0px #303030 !important;
  }
`

interface LeaderboardEntry {
  nickname: string
  highScore: number
}

function MusicGame() {
  const {
    gameState,
    demoPersons,
    playPersons,
    // countdown,
    errorMessage,
    startGame,
    retryLevel,
    nextLevel,
    resetGame,
    setGameState,
    playerActionsRef
  } = useGameLogic()

  useKeyboardControl({ gameState, setGameState, playerActionsRef })

  const {
    isPlaying: isBGMPlaying,
    isLoaded: isBGMLoaded,
    error: bgmError,
    isMuted,
    volume,
    startBGM,
    stopBGM,
    pauseBGM,
    resumeBGM,
    toggleMute,
    setVolume
  } = useBackgroundMusic()

  const [showMusicPrompt, setShowMusicPrompt] = useState(true)
  const [userHasInteracted, setUserHasInteracted] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [currentNickname, setCurrentNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isVoicePlaying, setIsVoicePlaying] = useState(false)
  const [learningVideos, setLearningVideos] = useState<string[]>([])
  const [selectedLearningVideo, setSelectedLearningVideo] = useState('')
  const [videoUnlocked, setVideoUnlocked] = useState(false)
  const [videoError, setVideoError] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const maxWatchedTimeRef = useRef(0)
  const failureCountRef = useRef(0)
  const wasFailureResultRef = useRef(false)
  const bgmPausedByGateRef = useRef(false)
  const wasLearningVideoPhaseRef = useRef(false)
  const lastRecordedGameOverRef = useRef('')

  const stitchTheme = {
    canvas: '#efe3d2',
    stitchLight: 'rgba(255, 247, 235, 0.65)',
    stitchDark: 'rgba(126, 104, 83, 0.26)',
    panel: '#f7ecdd'
  }

  const upsertLeaderboard = useCallback(
    async (nickname: string, score: number) => {
      try {
        const response = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nickname,
            score
          })
        })

        if (!response.ok) {
          throw new Error(`更新排行榜失败: ${response.status}`)
        }

        const data = (await response.json()) as {
          leaderboard?: LeaderboardEntry[]
        }
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard)
        }
      } catch (error) {
        console.error('更新排行榜失败:', error)
      }
    },
    []
  )

  const handleStartGameWithNickname = async () => {
    const trimmedNickname = nicknameInput.trim()
    if (!trimmedNickname) {
      setNicknameError('请先输入昵称再开始。')
      return
    }

    setNicknameError('')
    setCurrentNickname(trimmedNickname)
    await handleUserInteraction()
    startGame()
  }

  const handleRestartWithNewNickname = () => {
    resetGame()
    setCurrentNickname('')
    setNicknameInput('')
    setNicknameError('')
  }

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard', {
          cache: 'no-store'
        })
        if (!response.ok) {
          throw new Error(`读取排行榜失败: ${response.status}`)
        }

        const data = (await response.json()) as {
          leaderboard?: LeaderboardEntry[]
        }
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard)
        }
      } catch (error) {
        console.error('读取排行榜失败:', error)
      }
    }

    void loadLeaderboard()
  }, [])

  // 进入结算页后记录当前昵称的历史最高分
  useEffect(() => {
    if (gameState.gamePhase !== 'gameOver' || !currentNickname) {
      return
    }

    const snapshotKey = `${currentNickname}-${gameState.score}-${gameState.currentLevel}`
    if (lastRecordedGameOverRef.current === snapshotKey) {
      return
    }

    lastRecordedGameOverRef.current = snapshotKey
    void upsertLeaderboard(currentNickname, gameState.score)
  }, [
    gameState.gamePhase,
    gameState.score,
    gameState.currentLevel,
    currentNickname,
    upsertLeaderboard
  ])

  // 游戏开始时启动背景音乐
  useEffect(() => {
    console.log('游戏状态变化:', {
      gamePhase: gameState.gamePhase,
      isBGMLoaded,
      isBGMPlaying,
      bgmError
    })
    // 不自动播放，等待用户交互
  }, [gameState.gamePhase, isBGMLoaded, isBGMPlaying, startBGM, bgmError])

  // 处理用户首次交互，启动音乐
  const handleUserInteraction = async () => {
    setUserHasInteracted(true)
    if (isBGMLoaded && !isBGMPlaying && !isMuted) {
      await startBGM()
    }
  }

  // 启动音乐的函数
  const handleStartMusic = async () => {
    setShowMusicPrompt(false)
    setUserHasInteracted(true)
    if (isBGMLoaded && !isMuted) {
      await startBGM()
    }
  }

  // 游戏结束时停止背景音乐
  useEffect(() => {
    if (gameState.gamePhase === 'gameOver') {
      stopBGM()
    }
  }, [gameState.gamePhase, stopBGM])

  // 监听英语语音播放状态：放英语时暂停BGM，英语结束后恢复BGM
  useEffect(() => {
    const handleVoicePlaybackChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isPlaying: boolean }>
      setIsVoicePlaying(Boolean(customEvent.detail?.isPlaying))
    }

    window.addEventListener(
      'voice-playback-change',
      handleVoicePlaybackChange as EventListener
    )
    return () => {
      window.removeEventListener(
        'voice-playback-change',
        handleVoicePlaybackChange as EventListener
      )
    }
  }, [])

  useEffect(() => {
    if (!userHasInteracted || gameState.gamePhase === 'gameOver') {
      return
    }

    const isLearningVideoPhase =
      gameState.gamePhase === 'result' && Boolean(errorMessage)

    // 进入学习视频阶段时，先硬停止牛叫，避免视频+BGM+牛叫抢占导致卡顿
    if (isLearningVideoPhase && !wasLearningVideoPhaseRef.current) {
      stopAllVoiceSounds()
    }
    wasLearningVideoPhaseRef.current = isLearningVideoPhase

    const shouldPauseBGM = isVoicePlaying || isLearningVideoPhase

    if (shouldPauseBGM && !bgmPausedByGateRef.current) {
      bgmPausedByGateRef.current = true
      pauseBGM()
      return
    }

    if (!shouldPauseBGM && bgmPausedByGateRef.current && !isMuted) {
      bgmPausedByGateRef.current = false
      void resumeBGM()
    }
  }, [
    isVoicePlaying,
    userHasInteracted,
    gameState.gamePhase,
    errorMessage,
    isMuted,
    pauseBGM,
    resumeBGM
  ])

  // 读取学习视频清单
  useEffect(() => {
    let canceled = false

    const loadLearningVideos = async () => {
      try {
        const response = await fetch('/videos/manifest.json', {
          cache: 'no-store'
        })
        if (!response.ok) {
          if (!canceled) {
            setLearningVideos([])
          }
          return
        }

        const data = await response.json()
        if (!canceled && Array.isArray(data)) {
          const validVideos = data.filter(
            item => typeof item === 'string' && item.trim().length > 0
          )
          setLearningVideos(validVideos)
        }
      } catch (error) {
        console.error('读取学习视频清单失败:', error)
        if (!canceled) {
          setLearningVideos([])
        }
      }
    }

    loadLearningVideos()

    return () => {
      canceled = true
    }
  }, [])

  // 失败时按失败次数循环选择学习视频，并锁定继续按钮直到看完
  useEffect(() => {
    const isFailureResult =
      gameState.gamePhase === 'result' && Boolean(errorMessage)

    if (!isFailureResult) {
      wasFailureResultRef.current = false
      return
    }

    // 只在每次“新进入失败结果页”时处理一次，避免重复触发
    if (wasFailureResultRef.current) {
      return
    }
    wasFailureResultRef.current = true

    maxWatchedTimeRef.current = 0
    setVideoUnlocked(false)
    setVideoError('')

    if (learningVideos.length === 0) {
      setSelectedLearningVideo('')
      setVideoError('未找到学习视频，请先在 public/videos 中配置并放入视频文件。')
      failureCountRef.current += 1
      return
    }

    const videoIndex = failureCountRef.current % learningVideos.length
    setSelectedLearningVideo(learningVideos[videoIndex])
    failureCountRef.current += 1
  }, [gameState.gamePhase, errorMessage, learningVideos])

  // 样式定义 - 卡通像素风格，左右布局
  const gameContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    backgroundColor: stitchTheme.canvas,
    fontFamily: '"Courier New", "Monaco", "Menlo", monospace',
    overflow: 'hidden',
    position: 'relative',
    backgroundImage: `
      repeating-linear-gradient(
        45deg,
        ${stitchTheme.stitchLight} 0 2px,
        transparent 2px 16px
      ),
      repeating-linear-gradient(
        -45deg,
        ${stitchTheme.stitchDark} 0 2px,
        transparent 2px 16px
      ),
      linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
      linear-gradient(180deg, rgba(84, 61, 40, 0.08) 1px, transparent 1px)
    `,
    backgroundSize: '16px 16px, 16px 16px, 22px 22px, 22px 22px'
  }

  // 左侧信息面板样式
  const leftPanelStyle: React.CSSProperties = {
    width: '300px',
    minWidth: '300px',
    height: '100vh',
    padding: '20px',
    backgroundColor: stitchTheme.panel,
    border: '4px solid #000',
    borderTop: 'none',
    borderLeft: 'none',
    borderBottom: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowY: 'auto'
  }

  // 右侧游戏区域样式
  const rightGameAreaStyle: React.CSSProperties = {
    flex: 1,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    // 防止抖动的稳定性样式
    overflow: 'hidden',
    willChange: 'filter'
  }

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '20px',
    padding: '20px',
    border: '4px solid #303030',
    borderRadius: '0',
    backgroundColor: '#f3f0ed',
    boxShadow: '8px 8px 0px #303030',
    position: 'relative'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#303030',
    marginBottom: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    textShadow: 'none'
  }

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
    justifyContent: 'center',
    flexWrap: 'wrap'
  }

  const livesStyle: React.CSSProperties = {
    color: '#303030',
    backgroundColor: '#f3f0ed',
    border: '2px solid #303030',
    padding: '8px 12px',
    borderRadius: '0',
    boxShadow: '4px 4px 0px #303030'
  }

  const scoreStyle: React.CSSProperties = {
    color: '#303030',
    backgroundColor: '#f3f0ed',
    border: '2px solid #303030',
    padding: '8px 12px',
    borderRadius: '0',
    boxShadow: '4px 4px 0px #303030'
  }

  const levelStyle: React.CSSProperties = {
    color: '#303030',
    backgroundColor: '#f3f0ed',
    border: '2px solid #303030',
    padding: '8px 12px',
    borderRadius: '0',
    boxShadow: '4px 4px 0px #303030'
  }

  const nicknameStyle: React.CSSProperties = {
    color: '#303030',
    backgroundColor: '#f3f0ed',
    border: '2px solid #303030',
    padding: '8px 12px',
    borderRadius: '0',
    boxShadow: '4px 4px 0px #303030',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }

  const buttonStyle: React.CSSProperties = {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: '4px solid #303030',
    borderRadius: '0',
    cursor: 'pointer',
    backgroundColor: '#f3f0ed',
    color: '#303030',
    transition: 'all 0.1s ease',
    boxShadow: '6px 6px 0px #303030',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontFamily: '"Courier New", "Monaco", "Menlo", monospace',
    // 防止抖动的稳定性样式
    minWidth: '120px',
    minHeight: '56px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform, box-shadow',
    backfaceVisibility: 'hidden'
  }

  const musicControlStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'stretch',
    padding: '12px',
    backgroundColor: '#f3f0ed',
    border: '3px solid #303030',
    borderRadius: '0',
    boxShadow: '4px 4px 0px #303030'
  }

  const musicButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: '2px solid #303030',
    borderRadius: '0',
    cursor: 'pointer',
    backgroundColor: isMuted ? '#fff' : '#fff',
    color: '#303030',
    transition: 'all 0.1s ease',
    boxShadow: '2px 2px 0px #303030'
  }

  const volumeSliderStyle: React.CSSProperties = {
    width: '80px',
    height: '4px',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer'
  }

  const musicPromptStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#f3f0ed',
    padding: '30px',
    borderRadius: '0',
    border: '4px solid #303030',
    boxShadow: '12px 12px 0px #303030',
    zIndex: 2000,
    textAlign: 'center',
    maxWidth: '400px',
    fontFamily: '"Courier New", "Monaco", "Menlo", monospace'
  }

  const musicPromptButtonStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: '3px solid #303030',
    borderRadius: '0',
    cursor: 'pointer',
    backgroundColor: '#f3f0ed',
    color: '#303030',
    transition: 'all 0.1s ease',
    margin: '0 8px',
    boxShadow: '4px 4px 0px #303030',
    textTransform: 'uppercase'
  }

  // const countdownOverlayStyle: React.CSSProperties = {
  //   position: 'fixed',
  //   top: '50%',
  //   left: '50%',
  //   transform: 'translate(-50%, -50%)',
  //   backgroundColor: 'rgba(255, 255, 255, 0.95)',
  //   display: 'flex',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   zIndex: 1002, // 确保在模糊层和其他弹窗之上
  //   fontSize: '80px',
  //   fontWeight: 'bold',
  //   color: '#303030',
  //   textShadow: 'none',
  //   fontFamily: '"Courier New", "Monaco", "Menlo", monospace',
  //   border: '6px solid #303030',
  //   borderRadius: '0',
  //   padding: '40px 60px',
  //   boxShadow: '12px 12px 0px #303030',
  //   minWidth: '200px',
  //   textAlign: 'center',
  //   // 防止抖动的稳定性样式
  //   willChange: 'transform',
  //   backfaceVisibility: 'hidden'
  // }

  // const gameContentStyle: React.CSSProperties = {
  //   display: 'flex',
  //   flexDirection: 'column',
  //   alignItems: 'center',
  //   gap: '24px',
  //   width: '100%',
  //   maxWidth: '800px',
  //   flex: 1,
  //   justifyContent: 'center'
  // }

  const gameAreaStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    height: '680px', // 固定高度，防止抖动
    width: '100%',
    maxWidth: '800px',
    justifyContent: 'flex-start', // 改为顶部对齐，避免居中导致的抖动
    padding: '40px 20px 20px 20px', // 顶部多一些padding来视觉居中
    border: '4px solid #303030',
    borderRadius: '0',
    backgroundColor: stitchTheme.panel,
    boxShadow: '8px 8px 0px #303030',
    // 防止抖动的稳定性样式
    position: 'relative',
    overflow: 'hidden'
  }

  // 小浮层样式 - 用于结果和游戏结束
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001, // 确保在模糊层之上
    gap: '20px',
    border: '4px solid #303030',
    borderRadius: '0',
    padding: '30px',
    boxShadow: '12px 12px 0px #303030',
    maxWidth: '500px',
    minWidth: '400px',
    // 防止抖动的稳定性样式
    willChange: 'transform',
    backfaceVisibility: 'hidden'
  }

  // 全屏遮罩样式 - 用于等待开始游戏
  const fullOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    gap: '20px',
    border: '4px solid #303030',
    borderRadius: '0',
    margin: '4px'
  }

  const instructionStyle: React.CSSProperties = {
    textAlign: 'left',
    fontSize: '16px',
    color: '#303030',
    backgroundColor: '#f3f0ed',
    padding: '16px',
    borderRadius: '0',
    border: '3px solid #303030',
    boxShadow: '6px 6px 0px #303030',
    fontFamily: '"Courier New", "Monaco", "Menlo", monospace',
    fontWeight: 'bold'
  }

  const leaderboardStyle: React.CSSProperties = {
    ...instructionStyle,
    padding: '14px'
  }

  const leaderboardFloatingStyle: React.CSSProperties = {
    ...leaderboardStyle,
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '300px',
    maxHeight: '50vh',
    overflowY: 'auto',
    zIndex: 1100
  }

  const errorStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '18px',
    color: '#303030',
    backgroundColor: '#f3f0ed',
    padding: '20px',
    borderRadius: '0',
    border: '4px solid #303030',
    boxShadow: '8px 8px 0px #303030',
    fontFamily: '"Courier New", "Monaco", "Menlo", monospace',
    fontWeight: 'bold'
  }

  const resultStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '18px',
    color: '#303030',
    backgroundColor: '#f3f0ed',
    padding: '20px',
    borderRadius: '0',
    border: '4px solid #303030',
    boxShadow: '8px 8px 0px #303030',
    fontFamily: '"Courier New", "Monaco", "Menlo", monospace',
    fontWeight: 'bold'
  }

  const learningVideoCardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '560px',
    textAlign: 'left',
    backgroundColor: '#f3f0ed',
    border: '4px solid #303030',
    boxShadow: '8px 8px 0px #303030',
    padding: '16px'
  }

  const learningVideoStyle: React.CSSProperties = {
    width: '100%',
    border: '3px solid #303030',
    backgroundColor: '#000'
  }

  // 基础游戏区域 - 始终显示两排小牛马
  const baseGameArea = (
    <div style={gameAreaStyle}>
      <PersonRow persons={demoPersons} label="示例表演" />
      <PersonRow persons={playPersons} label="模仿表演" />
      <div style={instructionStyle}>
        {gameState.gamePhase === 'demo' && (
          <p>请仔细观看示例表演，记住节奏！</p>
        )}
        {gameState.gamePhase === 'countdown' && (
          <p>准备好！按住空格键控制你的小牛马张嘴</p>
        )}
        {gameState.gamePhase === 'playing' && (
          <p>按住空格键控制你的小牛马张嘴！</p>
        )}
      </div>
    </div>
  )

  // 根据游戏状态渲染不同的覆盖层
  const renderOverlay = () => {
    switch (gameState.gamePhase) {
      case 'countdown':
        return (
          <div style={overlayStyle}>
            <div
              style={{
                fontSize: '80px',
                fontWeight: 'bold',
                color: '#303030',
                textAlign: 'center',
                fontFamily: '"Courier New", "Monaco", "Menlo", monospace'
              }}
            >
              Go!
            </div>
          </div>
        )

      case 'waiting':
        return (
          <div style={fullOverlayStyle}>
            <div style={instructionStyle}>
              <p>欢迎来到嘴炮游戏！</p>
              <p>本轮玩家昵称: {nicknameInput.trim() || '未输入'}</p>
              <p>游戏规则：</p>
              <p>1. 观看第一排小牛马的示例表演</p>
              <p>2. 倒计时后，第二排开始模仿</p>
              <p>3. 你控制YOU上的小牛马，按住空格键张嘴</p>
              <p>4. 跟随示例的节奏，准确模仿张嘴时机和时长</p>
              <p>5. 你有3次生命，出错会扣除生命</p>
              <p>6. 第5关后动作会随机扰动，每轮都会有新变化</p>
            </div>
            <div
              style={{
                ...instructionStyle,
                width: '100%',
                maxWidth: '520px'
              }}
            >
              <p style={{ marginBottom: '10px' }}>
                请输入昵称（每次重新开始都需要重新输入）：
              </p>
              <input
                value={nicknameInput}
                onChange={event => setNicknameInput(event.target.value)}
                placeholder="例如：Player-1"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '3px solid #303030',
                  backgroundColor: '#fff',
                  color: '#303030',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  fontFamily: '"Courier New", "Monaco", "Menlo", monospace',
                  outline: 'none'
                }}
              />
              {nicknameError && (
                <p style={{ marginTop: '8px', fontSize: '14px' }}>
                  {nicknameError}
                </p>
              )}
            </div>
            <button
              className="game-button"
              style={buttonStyle}
              onClick={handleStartGameWithNickname}
            >
              开始游戏
            </button>
          </div>
        )

      case 'result':
        return (
          <div style={overlayStyle}>
            {errorMessage ? (
              <div style={errorStyle}>
                <p>{errorMessage}</p>
                <p>剩余生命: {gameState.lives}</p>
              </div>
            ) : (
              <div style={resultStyle}>
                <p>太棒了！成功通过第 {gameState.currentLevel} 关！</p>
                <p>获得 10 积分</p>
              </div>
            )}

            {errorMessage ? (
              <>
                <div style={learningVideoCardStyle}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                    失败学习：请完整观看当前失败轮次学习视频后继续
                  </p>
                  {selectedLearningVideo ? (
                    <video
                      key={selectedLearningVideo}
                      ref={videoRef}
                      style={learningVideoStyle}
                      src={selectedLearningVideo}
                      controls
                      autoPlay
                      playsInline
                      controlsList="nodownload noplaybackrate"
                      onTimeUpdate={e => {
                        const current = e.currentTarget.currentTime
                        if (current > maxWatchedTimeRef.current) {
                          maxWatchedTimeRef.current = current
                        }
                      }}
                      onSeeking={e => {
                        if (videoUnlocked) return
                        const video = e.currentTarget
                        const allowedTime = maxWatchedTimeRef.current + 0.5
                        if (video.currentTime > allowedTime) {
                          video.currentTime = maxWatchedTimeRef.current
                        }
                      }}
                      onEnded={() => {
                        setVideoUnlocked(true)
                        setVideoError('')
                      }}
                      onError={() => {
                        setVideoUnlocked(false)
                        setVideoError(
                          '学习视频播放失败，请检查 public/videos/manifest.json 与视频文件路径。'
                        )
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        ...learningVideoStyle,
                        minHeight: '180px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        padding: '10px',
                        textAlign: 'center'
                      }}
                    >
                      视频暂不可用
                    </div>
                  )}

                  <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                    {videoUnlocked
                      ? '学习完成，已解锁继续重试。'
                      : '视频未看完前，无法继续。'}
                  </p>
                  {videoError && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                      {videoError}
                    </p>
                  )}
                </div>

                <button
                  className="game-button"
                  style={{
                    ...buttonStyle,
                    opacity: videoUnlocked ? 1 : 0.6,
                    cursor: videoUnlocked ? 'pointer' : 'not-allowed'
                  }}
                  onClick={retryLevel}
                  disabled={!videoUnlocked}
                >
                  {videoUnlocked ? '我学完了，继续重试' : '请先看完学习视频'}
                </button>
              </>
            ) : (
              <button
                className="game-button"
                style={buttonStyle}
                onClick={nextLevel}
              >
                下一关
              </button>
            )}
          </div>
        )

      case 'gameOver':
        const title = getTitleByScore(gameState.score)
        return (
          <div style={overlayStyle}>
            <div style={resultStyle}>
              <h2>游戏结束！</h2>
              <p>最终得分: {gameState.score}</p>
              <p>
                获得称号: <strong>{title}</strong>
              </p>
              <p>
                完成关卡: {gameState.currentLevel} / {gameLevels.length}
              </p>
            </div>

            <button
              className="game-button"
              style={buttonStyle}
              onClick={handleRestartWithNewNickname}
            >
              重新开始
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={gameContainerStyle}>
      {/* 添加CSS样式来减少按钮抖动 */}
      <style>{buttonHoverStyles}</style>
      {/* 左侧信息面板 */}
      <div style={leftPanelStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>一起来嘴炮</h1>
          <div style={statsStyle}>
            <span style={livesStyle}>❤️ 生命: {gameState.lives}</span>
            <span style={scoreStyle}>⭐ 积分: {gameState.score}</span>
            <span style={levelStyle}>
              🎯 关卡: {gameState.currentLevel + 1} / {gameLevels.length}
            </span>
            <span style={nicknameStyle}>
              👤 玩家: {currentNickname || '待输入昵称'}
            </span>
          </div>
        </div>

        {/* 音乐控制 */}
        <div style={musicControlStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#000', fontSize: '16px' }}>
            🎵 音乐控制
          </h3>
          {userHasInteracted && (
            <>
              <button
                style={musicButtonStyle}
                onClick={toggleMute}
                title={isMuted ? '开启音乐' : '关闭音乐'}
              >
                {isMuted ? '🔇 开启音乐' : '🎵 关闭音乐'}
              </button>
              {!isMuted && (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '12px', color: '#000' }}>音量:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={e => setVolume(parseFloat(e.target.value))}
                    style={volumeSliderStyle}
                    title="音量控制"
                  />
                  <div style={{ fontSize: '12px', color: '#000' }}>
                    {isBGMPlaying ? '🎵' : '⏸️'}
                  </div>
                </div>
              )}
            </>
          )}
          {!userHasInteracted && isBGMLoaded && (
            <div
              style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}
            >
              🎵 音乐就绪
            </div>
          )}
          {bgmError && (
            <span style={{ fontSize: '11px', color: '#ef4444' }}>
              音乐不可用
            </span>
          )}
        </div>

        {/* 游戏说明 */}
        <div style={instructionStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#000', fontSize: '16px' }}>
            🎮 游戏说明
          </h3>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            1. 观看第一排小牛马的示例表演
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            2. 倒计时后，第二排开始模仿
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            3. 你控制YOU标记的小牛马
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>4. 按住空格键张嘴</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            5. 跟随示例的节奏和时机
          </p>
        </div>

        {/* 随机性测试（开发模式） */}
        {process.env.NODE_ENV !== 'production' && (
          <div style={instructionStyle}>
            <h3
              style={{ margin: '0 0 10px 0', color: '#000', fontSize: '16px' }}
            >
              🎲 随机性测试
            </h3>
            <button
              style={{
                ...musicButtonStyle,
                width: '100%',
                marginBottom: '10px'
              }}
              onClick={() => {
                // 测试随机分布
                const counts = [0, 0, 0, 0, 0]
                const testCount = 1000

                for (let i = 0; i < testCount; i++) {
                  // 使用与游戏相同的改进随机算法
                  let randomValue = 0
                  for (let j = 0; j < 5; j++) {
                    randomValue += Math.random()
                  }
                  const index = Math.floor((randomValue % 1) * 5)
                  counts[index]++
                }

                console.log('随机性测试结果 (1000次):', {
                  位置0: counts[0],
                  位置1: counts[1],
                  位置2: counts[2],
                  位置3: counts[3],
                  位置4: counts[4],
                  期望值: testCount / 5,
                  分布: counts.map(
                    c => `${((c / testCount) * 100).toFixed(1)}%`
                  )
                })

                alert(
                  `随机性测试完成！\n位置分布：\n${counts
                    .map(
                      (c, i) =>
                        `位置${i}: ${c}次 (${((c / testCount) * 100).toFixed(
                          1
                        )}%)`
                    )
                    .join('\n')}\n\n期望值: ${
                    testCount / 5
                  }次 (20%)\n\n详细结果请查看控制台`
                )
              }}
            >
              测试随机分布
            </button>
          </div>
        )}
      </div>

      {/* 右侧游戏区域 */}
      <div style={rightGameAreaStyle}>
        {/* 右上角排行榜 */}
        <div style={leaderboardFloatingStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#000', fontSize: '16px' }}>
            🏆 排行榜（TOP 10）
          </h3>
          {leaderboard.length === 0 ? (
            <p style={{ margin: '0', fontSize: '14px' }}>暂无记录，等你上榜。</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.nickname}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '14px',
                    borderBottom: '1px dashed #303030',
                    paddingBottom: '4px'
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {index + 1}. {entry.nickname}
                  </span>
                  <strong>{entry.highScore}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            // 当有弹窗时添加模糊效果
            filter:
              gameState.gamePhase === 'result' ||
              gameState.gamePhase === 'gameOver' ||
              gameState.gamePhase === 'countdown'
                ? 'blur(3px)'
                : 'none',
            transition: 'filter 0.3s ease',
            // 防止抖动的稳定性样式
            willChange: 'filter',
            backfaceVisibility: 'hidden'
          }}
        >
          {baseGameArea}
        </div>
        {/* 弹窗层单独渲染，避免被模糊 */}
        {renderOverlay()}
      </div>

      {/* 倒计时浮层移到游戏区域内渲染 */}

      {/* 音乐播放提示 */}
      {showMusicPrompt && isBGMLoaded && !userHasInteracted && (
        <div style={musicPromptStyle}>
          <h3 style={{ color: '#1e40af', marginBottom: '16px' }}>
            🎵 背景音乐
          </h3>
          <p
            style={{
              color: '#374151',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}
          >
            检测到背景音乐文件！
            <br />
            是否要播放背景音乐来增强游戏体验？
          </p>
          <div>
            <button
              className="music-button"
              style={musicPromptButtonStyle}
              onClick={handleStartMusic}
            >
              🎵 播放音乐
            </button>
            <button
              className="music-button"
              style={{ ...musicPromptButtonStyle, backgroundColor: '#6b7280' }}
              onClick={() => setShowMusicPrompt(false)}
            >
              🔇 静音游戏
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MusicGame
