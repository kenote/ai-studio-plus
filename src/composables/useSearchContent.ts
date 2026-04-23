import { db } from '@/db'

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date: string
}

export interface TavilySearchResponse {
  query: string
  follow_up_questions: string[]
  answer: string
  images: string[]
  results: TavilySearchResult[]
  api_duration: number
}

/**
 * 联网搜索
 * @param query
 * @param maxResults
 * @returns
 */
export async function useSearchContent(
  query: string,
  maxResults = 10,
): Promise<TavilySearchResponse | null> {
  const config = await db.config.get(1)
  let response: Response | null = null
  if (config?.search?.type === 'tavily') {
    const { host, token } = config.search.tavily
    if (!host) throw new Error(`请先配置 Tavily 主机`)
    if (!token) throw new Error(`请先配置 Tavily API 私钥`)
    response = await fetch(`${host}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
      }),
    })
  } else if (config?.search?.type === 'searxng') {
    const host = config.search.searxng
    if (!host) throw new Error(`请先配置 SearXNG 主机`)
    response = await fetch(`${host}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        q: query,
        format: 'json',
      }),
    })
  }
  if (!response) return null
  if (!response.ok) throw new Error(`请求失败: ${response.status}`)
  return response.json()
}
