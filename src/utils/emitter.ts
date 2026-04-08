import mitt from 'mitt'

export const emitter = mitt()

export const Events = {
  OPEN_MODEL: 'open-model',
  MODEL_COUNT_CHANGE: 'model-count-change',
  PROVIDER_COUNT_CHANGE: 'provider-count-change',
} as const
