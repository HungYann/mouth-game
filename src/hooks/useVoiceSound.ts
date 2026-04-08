import { useRef, useCallback } from 'react'

// 全局音频实例，确保只有一个声音播放
let globalAudio: HTMLAudioElement | null = null
let currentPlayingPersonId: string | null = null

const emitVoicePlaybackChange = (isPlaying: boolean) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('voice-playback-change', { detail: { isPlaying } })
    )
  }
}

export const stopAllVoiceSounds = () => {
  if (globalAudio) {
    globalAudio.pause()
    globalAudio.currentTime = 0
  }
  currentPlayingPersonId = null
  emitVoicePlaybackChange(false)
}

export function useVoiceSound(personId: string) {
  const isPlayingRef = useRef(false)

  // 初始化全局音频
  const initAudio = useCallback(() => {
    if (!globalAudio) {
      globalAudio = new Audio('/sounds/voice1.MP3')
      globalAudio.loop = true // 循环播放
      globalAudio.volume = 0.6 // 设置音量
      globalAudio.preload = 'auto'
    }
  }, [])

  // 播放声音
  const playVoice = useCallback(async () => {
    initAudio()

    // 如果已经有其他小牛马在播放，先停止
    if (currentPlayingPersonId && currentPlayingPersonId !== personId) {
      if (globalAudio) {
        globalAudio.pause()
        globalAudio.currentTime = 0
      }
    }

    if (globalAudio && currentPlayingPersonId !== personId) {
      try {
        globalAudio.currentTime = 0 // 重置到开始
        await globalAudio.play()
        currentPlayingPersonId = personId
        isPlayingRef.current = true
        emitVoicePlaybackChange(true)
        console.log(`小牛马${personId}张嘴声音开始播放`)
      } catch (error) {
        console.error('播放张嘴声音失败:', error)
      }
    }
  }, [initAudio, personId])

  // 停止声音
  const stopVoice = useCallback(() => {
    if (
      globalAudio &&
      currentPlayingPersonId === personId &&
      isPlayingRef.current
    ) {
      globalAudio.pause()
      globalAudio.currentTime = 0
      currentPlayingPersonId = null
      isPlayingRef.current = false
      emitVoicePlaybackChange(false)
      console.log(`小牛马${personId}张嘴声音停止播放`)
    }
  }, [personId])

  // 设置音量
  const setVolume = useCallback((volume: number) => {
    if (globalAudio) {
      globalAudio.volume = Math.max(0, Math.min(1, volume))
    }
  }, [])

  // 清理资源
  const cleanup = useCallback(() => {
    if (currentPlayingPersonId === personId) {
      if (globalAudio) {
        globalAudio.pause()
        globalAudio.currentTime = 0
      }
      currentPlayingPersonId = null
      isPlayingRef.current = false
      emitVoicePlaybackChange(false)
    }
  }, [personId])

  return {
    playVoice,
    stopVoice,
    setVolume,
    cleanup,
    isPlaying: isPlayingRef.current
  }
}
