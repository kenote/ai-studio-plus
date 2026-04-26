import type { TextContent, ImageContent, AIRequest, Message, ContentItem } from '@/types/chat'
import { getModelInfo } from '@/db/model'
import { pick, last, set, isString, isArray } from 'lodash-es'
import { useSearchContent } from '@/composables/useSearchContent'

/**
 * 文件转 base64
 * @param file
 * @returns
 */
export function fileToBase64(file: File) {
  return new Promise(
    (
      resolve: (value: string) => void,
      reject: (this: FileReader, ev: ProgressEvent<FileReader>) => void,
    ) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    },
  )
}

/**
 * 图片 Base64 对象
 */
export declare type ImageFile = {
  url: string
  name: string
  base64: string
}

/**
 * 加载本地图片文件
 * @param imageList
 */
export function loadImage(imageList: ImageFile[]) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const base64 = await fileToBase64(file)
      imageList.push({ url: base64, name: file.name, base64 })
    }
  }
  input.click()
}

/**
 * 获取输入信息
 * @param inputMessage
 * @param imageList
 * @returns
 */
export function getInputContent(inputMessage: string, imageList: ImageFile[] = []) {
  const contents: (string | TextContent | ImageContent)[] = []
  // 处理上传图片
  if (imageList.length > 0) {
    for (const img of imageList) {
      contents.push({ type: 'image_url', image_url: { url: img.base64 } })
    }
  }
  // 处理文字消息
  if (inputMessage.trim()) {
    const text = inputMessage.trim()
    if (contents.length === 0) {
      // 1. 数组为空，直接 push 字符串
      contents.push(text)
    } else {
      // 2. 数组不为空，查找是否存在 type 为 'text' 的对象
      const textItem = contents.find(
        (c): c is TextContent => typeof c !== 'string' && c.type === 'text',
      )
      if (textItem) {
        // 存在对象则更新
        textItem.text = text
      } else {
        // 不存在对象则追加一个新对象
        contents.push({ type: 'text', text: text })
      }
    }
  }
  return contents
}

/**
 * 获取请求参数
 * @param modelId
 * @param messages
 * @param stream
 * @returns
 */
export async function getRequestConfig(
  modelId: number,
  messages: Message[],
  stream: boolean = false,
) {
  const modelInfo = await getModelInfo(modelId)
  if (!modelInfo?.apiBase) {
    throw new Error('缺失 BaseURL')
  }
  if (!modelInfo?.apiKey) {
    throw new Error('缺失 APIKey')
  }
  if (!modelInfo?.modelName) {
    throw new Error('缺失模型信息')
  }
  return <AIRequest>{
    ...modelInfo,
    messages: messages.map((v) => pick(v, ['role', 'content'])),
    stream,
  }
}

/**
 * 格式化时间
 * @param value
 * @returns
 */
export function formatDate(value: number) {
  const date = new Date(value)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 联网搜索用户消息
 * @param msgs
 * @param openSearch
 * @returns
 */
export async function getSearchContent(msgs: Message[], openSearch: boolean = false) {
  if (!openSearch) return []
  const lsatContent = last(msgs)?.content
  let query = ''
  if (isString(lsatContent)) {
    query = lsatContent
  } else if (isArray(lsatContent)) {
    query = lsatContent.find((v) => v.type === 'text')?.text ?? ''
  }
  const rks = await useSearchContent(query)
  console.log(rks?.results.map((v) => v.content))
  if (rks?.results && rks.results.length > 0) {
    let tmpContent: ContentItem[] = []
    if (isString(last(msgs)?.content)) {
      tmpContent.push({ type: 'text', text: last(msgs)?.content as string })
    }
    tmpContent = tmpContent.concat(
      rks.results.map((v) => ({
        type: 'text',
        text: v.content,
      })),
    )
    console.log(tmpContent)
    set(last(msgs)!, 'content', tmpContent)
  }
  return rks?.results
}
