import React, { useState, useEffect } from 'react'
import { useVoiceSound } from '../hooks/useVoiceSound'

interface PersonProps {
  index: number
  isMouthOpen: boolean
  isPlayer: boolean
  size?: number
}

function Person({ index, isMouthOpen, isPlayer, size = 120 }: PersonProps) {
  const [imageError, setImageError] = useState(false)
  const personId = `person-${index}-${isPlayer ? 'player' : 'npc'}`
  const { playVoice, stopVoice, cleanup } = useVoiceSound(personId)

  // 监听张嘴状态变化，播放/停止声音
  useEffect(() => {
    if (isMouthOpen) {
      playVoice()
    } else {
      stopVoice()
    }
  }, [isMouthOpen, playVoice, stopVoice])

  // 组件卸载时清理音频资源
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease',
    cursor: isPlayer ? 'pointer' : 'default',
    transform: isPlayer ? 'scale(1.05)' : 'scale(1)' // 玩家稍微放大
  }

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain', // 保持图片原始比例
    transition: 'opacity 0.2s ease'
  }

  // 备用圆圈样式（图片加载失败时使用）
  const fallbackCircleStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: isMouthOpen ? '#ef4444' : '#3b82f6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  }

  const fallbackLabelStyle: React.CSSProperties = {
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    userSelect: 'none'
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        minHeight: size + 40 // 确保所有小牛马容器高度一致
      }}
    >
      <div style={containerStyle}>
        {!imageError ? (
          <img
            src={isMouthOpen ? '/open.png' : '/close.png'}
            alt={isMouthOpen ? '张嘴' : '闭嘴'}
            style={imageStyle}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        ) : (
          // 备用圆圈显示
          <div style={fallbackCircleStyle}>
            <span style={fallbackLabelStyle}>{index + 1}</span>
          </div>
        )}
      </div>

      {/* YOU标签区域 - 所有小牛马都有这个区域，但只有玩家显示内容 */}
      <div
        style={{
          height: '16px', // 固定高度确保对齐
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isPlayer && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#303030',
              fontWeight: 'bold',
              textAlign: 'center',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              padding: '2px 8px',
              borderRadius: '8px',
              border: '1px solid #303030'
            }}
          >
            YOU
          </div>
        )}
      </div>
    </div>
  )
}

export default Person
