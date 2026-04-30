type JoplinConfig = {
  host?: string
  token: string
  folder?: string
}

type Folder = {
  id: string
  title: string
  parent_id?: string
  updated_time?: number
}

interface SearchResponse<T> {
  items: T[]
}

type Note = {
  id: string
  title: string
  body: string
  parent_id?: string
  // 根据 API 实际返回字段补充
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * 保存笔记
 * @param title
 * @param body
 * @param options
 * @returns
 */
export async function saveJoplin(
  title: string,
  body: string,
  options: JoplinConfig,
): Promise<Note> {
  const { host, token, folder } = options

  // 1. 获取或创建父级笔记本ID，默认名称可以统一定义
  const parentId = await getOrCreateNotebookId(folder ?? 'AI Studio Archives', options)

  // 2. 构造请求 URL，使用URL对象更稳健
  const url = new URL('/notes', host)
  url.searchParams.set('token', token)

  // 3. 发起创建笔记请求
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      body,
      parent_id: parentId,
    }),
  })

  // 4. 错误坑处理：非成功状态主动抛异常
  if (!response.ok) {
    throw new Error(`Create note failed: ${response.status} ${response.statusText}`)
  }

  // 5. 返回具体类型，方便调用者进一步处理
  return response.json() as Promise<Note>
}

/**
 * 搜索文件夹
 * @param query
 * @param options
 * @returns
 */
async function searchFolder(query: string, options: JoplinConfig): Promise<Folder[]> {
  const { host, token } = options

  const url = new URL('/search', host)
  url.searchParams.set('query', query)
  url.searchParams.set('type', 'folder')
  url.searchParams.set('token', token)

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as SearchResponse<Folder>
  return data.items
}

/**
 * 创建文件夹
 * @param title
 * @param options
 * @returns
 */
async function createFolder(title: string, options: JoplinConfig): Promise<Folder> {
  const url = new URL('/folders', options.host)
  url.searchParams.set('token', options.token)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })

  if (!response.ok) {
    throw new Error(`Create folder failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as Folder
}

/**
 * 获取文件夹ID
 * @param name
 * @param options
 * @returns
 */
async function getOrCreateNotebookId(name: string, options: JoplinConfig): Promise<string> {
  const searchData = await searchFolder(name, options)

  const existing = searchData.find((folder) => folder.title === name)
  if (existing) {
    await delay(1000)
    return existing.id
  }
  const newFolder = await createFolder(name, options)
  // 等待 3 秒
  await delay(3000)
  return newFolder.id
}
