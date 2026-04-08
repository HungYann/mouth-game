import { useEffect, useRef, useState } from 'react'

interface UseAudioOptions {
  volume?: number
  loop?: boolean
  autoPlay?: boolean
}

export function useAudio(src: string, options: UseAudioOptions = {}) {
  const { volume = 0.5, loop = false, autoPlay = false } = options
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 创建音频元素
    const audio = new Audio()
    audio.volume = volume
    audio.loop = loop
    audio.preload = 'auto'
    audioRef.current = audio

    // 音频加载完成
    const handleCanPlay = () => {
      console.log('音频可以播放了')
      setIsLoaded(true)
      setError(null)
      if (autoPlay) {
        play()
      }
    }

    // 音频数据加载完成
    const handleLoadedData = () => {
      console.log('音频数据加载完成')
      setIsLoaded(true)
      setError(null)
    }

    // 音频播放结束
    const handleEnded = () => {
      setIsPlaying(false)
    }

    // 音频播放开始
    const handlePlay = () => {
      setIsPlaying(true)
    }

    // 音频暂停
    const handlePause = () => {
      setIsPlaying(false)
    }

    // 音频加载错误
    const handleError = (e: Event) => {
      console.error('音频加载错误:', e)
      setError('音频文件加载失败，请检查文件路径和格式')
      setIsLoaded(false)
    }

    // 添加事件监听器
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    // 设置音频源
    audio.src = src

    // 清理函数
    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
      audio.pause()
      audio.src = ''
    }
  }, [src, volume, loop, autoPlay])

  const play = async () => {
    if (audioRef.current) {
      try {
        console.log('尝试播放音频...', { isLoaded, src })
        await audioRef.current.play()
        console.log('音频播放成功')
      } catch (err: any) {
        console.error('音频播放失败:', err)
        if (err.name === 'NotAllowedError') {
          setError('浏览器阻止自动播放，请点击播放按钮')
        } else if (err.name === 'NotSupportedError') {
          setError('音频格式不支持')
        } else {
          setError(`播放失败: ${err.message}`)
        }
      }
    } else {
      console.log('音频元素不存在')
      setError('音频元素未初始化')
    }
  }

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume))
    }
  }

  const toggle = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  return {
    isPlaying,
    isLoaded,
    error,
    play,
    pause,
    stop,
    toggle,
    setVolume
  }
}
