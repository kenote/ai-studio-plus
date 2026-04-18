import { db } from './'
import type { Model, ModelType, ModelInfo } from '@/types/provider'

/** 模型消息 */
export async function getModelInfo(modelId: number): Promise<ModelInfo | undefined> {
  const model = await db.models.get(modelId)
  if (!model) {
    console.error('Model not found for id:', modelId)
    return undefined
  }
  const { apiBase } = (await db.providers.get(model?.providerId))!
  const { apiKey } = (await db.groups.get(model?.groupId))!
  console.log('Model Info - Name:', model.name, 'API Base:', apiBase, 'API Key:', apiKey)
  return {
    modelName: model.name,
    apiBase: toOpenaiURL(apiBase),
    apiKey,
  }
}

/** 获取模型全名（模型名 | 组名） */
export async function getModelFullName(modelId: number): Promise<string> {
  const model = await db.models.get(modelId)
  if (!model) return '未知模型'
  const groupName = await getGroupName(model.groupId!)
  return `${model.name} | ${groupName}`
}

/** 获取模型分组名称 */
export async function getGroupName(groupId: number): Promise<string> {
  const group = await db.groups.get(groupId)
  const provider = await db.providers.get(group?.providerId)
  return group ? `${provider?.name} - ${group.name}` : '未知组'
}

/** 获取模型分组列表 */
export async function getModelGroups(typeFilter: ModelType, search?: string) {
  const models = (await db.models.toArray())
    .filter((m) => m.type?.includes(typeFilter) && new RegExp(search || '', 'i').test(m.name))
    .sort((a, b) => a.name.localeCompare(b.name))
  const providers = await db.providers.toArray()
  const groups = await db.groups.toArray()

  const groupMap = new Map<number, { groupName: string; models: Model[] }>()
  for (const model of models) {
    if (!model.type?.includes(typeFilter) || !new RegExp(search || '', 'i').test(model.name))
      continue
    const groupId = model.groupId || -1
    if (!groupMap.has(groupId)) {
      const group = groups.find((g) => g.id === groupId)
      const provider = providers.find((p) => p.id === model.providerId)
      groupMap.set(groupId, {
        groupName: group ? `${provider?.name} - ${group.name}` : '未知组',
        models: [],
      })
    }
    const group = groupMap.get(groupId)!
    if (!group.models.some((m) => m.id === model.id)) {
      group.models.push(model) // 避免重复添加模型
      group.models.sort((a, b) => a.name.localeCompare(b.name))
    }
  }
  return Array.from(groupMap.values()).sort((a, b) => a.groupName.localeCompare(b.groupName)) // 按组名排序
}

/** 转 OpenAI URL */
export function toOpenaiURL(apiBase: string) {
  if (apiBase.includes('googleapis')) {
    return apiBase.replace(/\/?$/, '/v1beta/openai')
  } else if (apiBase.includes('anthropic')) {
    return apiBase.replace(/\/?$/, '/v1/openai')
  }
  return apiBase.replace(/\/?$/, '/v1')
}
