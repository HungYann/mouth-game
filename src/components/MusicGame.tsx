import React from 'react'
import PersonRow from './PersonRow'
import { useGameLogic } from '../hooks/useGameLogic'
import { useKeyboardControl } from '../hooks/useKeyboardControl'
import { gameLevels } from '../data/levels'

// 称号系统
const getTitleByScore = (score: number): string => {
  if (score < 100) return '小笨嘴'
  if (score < 200) return '抹了蜜小嘴'
  return '嘴强王者'
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

  const gameContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '24px',
    padding: '20px',
    minHeight: '100vh',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f0f9ff',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
    position: 'relative'
  }

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '20px'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: '10px'
  }

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '30px',
    fontSize: '18px',
    fontWeight: 'bold'
  }

  const livesStyle: React.CSSProperties = {
    color: '#dc2626'
  }

  const scoreStyle: React.CSSProperties = {
    color: '#059669'
  }

  const levelStyle: React.CSSProperties = {
    color: '#7c3aed'
  }

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#3b82f6',
    color: 'white',
    transition: 'background-color 0.2s ease'
  }

  // const countdownStyle: React.CSSProperties = {
  //   fontSize: '48px',
  //   fontWeight: 'bold',
  //   color: '#ef4444',
  //   textAlign: 'center',
  //   margin: '20px 0'
  // }

  // const countdownOverlayStyle: React.CSSProperties = {
  //   position: 'fixed',
  //   top: '50%',
  //   left: '50%',
  //   transform: 'translate(-50%, -50%)',
  //   backgroundColor: 'rgba(255, 255, 255, 0.95)',
  //   display: 'flex',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   zIndex: 1000,
  //   fontSize: '80px',
  //   fontWeight: 'bold',
  //   color: '#000',
  //   textShadow: 'none',
  //   fontFamily: '"Courier New", "Monaco", "Menlo", monospace',
  //   border: '6px solid #000',
  //   borderRadius: '0',
  //   padding: '40px 60px',
  //   boxShadow: '12px 12px 0px #000',
  //   minWidth: '200px',
  //   textAlign: 'center'
  // }

  const gameContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    width: '100%',
    maxWidth: '800px',
    flex: 1,
    justifyContent: 'center'
  }

  const gameAreaStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    minHeight: '400px',
    width: '100%',
    justifyContent: 'center'
  }

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    gap: '20px'
  }

  const instructionStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '16px',
    color: '#374151',
    backgroundColor: '#fef3c7',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #f59e0b'
  }

  const errorStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '18px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid #ef4444'
  }

  const resultStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '18px',
    color: '#059669',
    backgroundColor: '#f0fdf4',
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid #10b981'
  }

  const renderGameContent = () => {
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
                  color: '#000',
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
            <div style={overlayStyle}>
              <div style={instructionStyle}>
                <p>欢迎来到嘴炮游戏！</p>
                <p>游戏规则：</p>
                <p>1. 观看第一排小牛马的示例表演</p>
                <p>2. 倒计时后，第二排开始模仿</p>
                <p>
                  3. 你控制YOU上的小牛马,你控制YOU上的小牛马，按住空格键张嘴
                </p>
                <p>4. 跟随示例的节奏，准确模仿张嘴时机和时长</p>
                <p>5. 你有3次生命，出错会扣除生命</p>
              </div>
              <button
                style={buttonStyle}
                onClick={startGame}
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = '#2563eb')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.backgroundColor = '#3b82f6')
                }
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
                <button
                  style={buttonStyle}
                  onClick={retryLevel}
                  onMouseEnter={e =>
                    (e.currentTarget.style.backgroundColor = '#2563eb')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.backgroundColor = '#3b82f6')
                  }
                >
                  重试
                </button>
              ) : (
                <button
                  style={buttonStyle}
                  onClick={nextLevel}
                  onMouseEnter={e =>
                    (e.currentTarget.style.backgroundColor = '#2563eb')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.backgroundColor = '#3b82f6')
                  }
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
                style={buttonStyle}
                onClick={resetGame}
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = '#2563eb')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.backgroundColor = '#3b82f6')
                }
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
      <div style={gameContentStyle}>
        <div style={{ position: 'relative', width: '100%' }}>
          {baseGameArea}
          {renderOverlay()}
        </div>
      </div>
    )
  }

  return (
    <div style={gameContainerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>嘴炮游戏</h1>
        <div style={statsStyle}>
          <span style={livesStyle}>❤️ 生命: {gameState.lives}</span>
          <span style={scoreStyle}>⭐ 积分: {gameState.score}</span>
          <span style={levelStyle}>
            🎯 关卡: {gameState.currentLevel + 1} / {gameLevels.length}
          </span>
        </div>
      </div>

      {renderGameContent()}

      {/* 倒计时浮层移到游戏区域内渲染 */}
    </div>
  )
}

export default MusicGame
