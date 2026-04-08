import { useEffect, useState } from 'react'
import { useAudio } from './useAudio'

export function useBackgroundMusic() {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolumeState] = useState(0.3) // 默认音量30%

  // 测试多个可能的文件路径
  const musicPaths = ['/bgm.MP3', '/bgm.mp3', '/bgm.wav', '/bgm.ogg']
  const [currentPath, setCurrentPath] = useState(musicPaths[0])

  // 背景音乐文件路径 - 你需要将音乐文件放到 public/bgm.mp3
  const bgm = useAudio(currentPath, {
    volume: isMuted ? 0 : volume,
    loop: true,
    autoPlay: false
  })

  // 如果当前路径失败，尝试下一个
  useEffect(() => {
    if (bgm.error && musicPaths.indexOf(currentPath) < musicPaths.length - 1) {
      const nextIndex = musicPaths.indexOf(currentPath) + 1
      console.log(`尝试下一个音频文件: ${musicPaths[nextIndex]}`)
      setCurrentPath(musicPaths[nextIndex])
    }
  }, [bgm.error, currentPath])

  // 开始播放背景音乐
  const startBGM = async () => {
    console.log('尝试播放背景音乐...', {
      isMuted,
      isLoaded: bgm.isLoaded,
      error: bgm.error
    })
    if (!isMuted && bgm.isLoaded) {
      try {
        await bgm.play()
        console.log('背景音乐开始播放')
      } catch (error) {
        console.error('背景音乐播放失败:', error)
      }
    } else {
      console.log('背景音乐未播放:', { isMuted, isLoaded: bgm.isLoaded })
    }
  }

  // 停止背景音乐
  const stopBGM = () => {
    bgm.stop()
  }

  // 暂停背景音乐
  const pauseBGM = () => {
    bgm.pause()
  }

  // 恢复背景音乐
  const resumeBGM = async () => {
    if (!isMuted) {
      await bgm.play()
    }
  }

  // 切换静音状态
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev
      if (newMuted) {
        bgm.setVolume(0)
      } else {
        bgm.setVolume(volume)
        if (!bgm.isPlaying) {
          bgm.play()
        }
      }
      return newMuted
    })
  }

  // 设置音量
  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clampedVolume)
    if (!isMuted) {
      bgm.setVolume(clampedVolume)
    }
  }

  // 当音量或静音状态改变时更新音频音量
  useEffect(() => {
    bgm.setVolume(isMuted ? 0 : volume)
  }, [volume, isMuted, bgm])

  return {
    isPlaying: bgm.isPlaying,
    isLoaded: bgm.isLoaded,
    error: bgm.error,
    isMuted,
    volume,
    startBGM,
    stopBGM,
    pauseBGM,
    resumeBGM,
    toggleMute,
    setVolume
  }
}
