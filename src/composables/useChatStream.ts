import type { AIRequest } from '@/types/chat'

export async function useChatStream(
  options: AIRequest,
  entrance: string,
  callback?: (content: string, status: string) => void,
): Promise<string | void> {
  const { apiBase, apiKey, modelName, messages, stream } = options

  const response = await fetch(apiBase + entrance, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      stream,
    }),
  })
  if (!response.ok) throw new Error(`请求失败: ${response.status}`)

  if (stream) {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = '' // 用于处理被截断的 JSON 字符串

    while (true) {
      const { done, value } = await reader!.read()
      if (done) break

      // 将新读取的数据块合并到缓冲区
      buffer += decoder.decode(value, { stream: true })

      // 处理每一行数据
      const lines = buffer.split('\n')
      // 最后一项可能是不完整的行，保留到下次循环处理
      buffer = lines.pop() || ''

      for (const line of lines) {
        const message = line.replace(/^data: /, '').trim()

        if (message === '' || message === '[DONE]') continue

        try {
          const parsed = JSON.parse(message)
          console.log(parsed)
          if (parsed.error) {
            callback?.(parsed.error, 'error')
            break
          }
          // 兼容 OpenAI 格式：choices[0].delta.content
          // const delta = parsed.choices?.[0]?.delta?.content || ''
          callback?.(parsed.choices?.[0]?.delta?.content || '', parsed.choices?.[0]?.finish_reason)
        } catch {
          // 如果解析失败，可能是数据帧被中间层截断，保持在 buffer 中等待下一次合并
          console.warn('解析流出错，等待下一帧')
        }
      }
    }
    // return
  } else {
    const data = await response.json()
    // callback?.(data.choices?.[0]?.message?.content || '')
    return data.choices?.[0]?.message?.content || ''
  }
}
