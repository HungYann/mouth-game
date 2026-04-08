import { Redis } from '@upstash/redis'

export interface LeaderboardEntry {
  nickname: string
  highScore: number
}

const LEADERBOARD_KEY = 'mouth-game:leaderboard:top10'

const getRedis = () => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Missing Upstash Redis environment variables')
  }

  return new Redis({ url, token })
}

const sanitize = (input: unknown): LeaderboardEntry[] => {
  if (!Array.isArray(input)) return []

  const normalized = input
    .filter(
      item =>
        item &&
        typeof item === 'object' &&
        typeof (item as LeaderboardEntry).nickname === 'string' &&
        typeof (item as LeaderboardEntry).highScore === 'number'
    )
    .map(item => ({
      nickname: (item as LeaderboardEntry).nickname.trim(),
      highScore: Math.max(0, Math.floor((item as LeaderboardEntry).highScore))
    }))
    .filter(item => item.nickname.length > 0)

  normalized.sort(
    (a, b) => b.highScore - a.highScore || a.nickname.localeCompare(b.nickname)
  )

  return normalized.slice(0, 10)
}

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const redis = getRedis()
  const data = await redis.get<unknown>(LEADERBOARD_KEY)
  return sanitize(data)
}

export const upsertLeaderboard = async (
  nickname: string,
  score: number
): Promise<LeaderboardEntry[]> => {
  const redis = getRedis()
  const current = sanitize(await redis.get<unknown>(LEADERBOARD_KEY))

  const normalizedNickname = nickname.trim()
  if (!normalizedNickname) return current

  const next = [...current]
  const existingIndex = next.findIndex(item => item.nickname === normalizedNickname)

  if (existingIndex >= 0) {
    next[existingIndex] = {
      ...next[existingIndex],
      highScore: Math.max(next[existingIndex].highScore, Math.max(0, Math.floor(score)))
    }
  } else {
    next.push({
      nickname: normalizedNickname,
      highScore: Math.max(0, Math.floor(score))
    })
  }

  next.sort(
    (a, b) => b.highScore - a.highScore || a.nickname.localeCompare(b.nickname)
  )

  const top10 = next.slice(0, 10)
  await redis.set(LEADERBOARD_KEY, top10)
  return top10
}
