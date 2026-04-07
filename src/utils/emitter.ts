import mitt from 'mitt'

export const emitter = mitt()

export const Events = {
  OPEN_MODEL: 'open-model',
} as const
