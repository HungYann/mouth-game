import { NextResponse } from 'next/server'
import { getLeaderboard, upsertLeaderboard } from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const leaderboard = await getLeaderboard()
    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('读取排行榜失败:', error)
    return NextResponse.json(
      { error: '读取排行榜失败', leaderboard: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      nickname?: string
      score?: number
    }

    if (!body.nickname || typeof body.score !== 'number') {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    const leaderboard = await upsertLeaderboard(body.nickname, body.score)
    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('更新排行榜失败:', error)
    return NextResponse.json({ error: '更新排行榜失败' }, { status: 500 })
  }
}
