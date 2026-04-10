import { db } from './'

export async function getModelFullName(modelId: number): Promise<string> {
  const model = await db.models.get(modelId)
  if (!model) return '未知模型'
  const provider = await db.providers.get(model.providerId!)
  return provider ? `${provider.name} - ${model.name}` : model.name
}
