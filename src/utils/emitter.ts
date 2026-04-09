import mitt from 'mitt'

export const emitter = mitt()

export const Events = {
  OPEN_MODEL: 'open-model',
  DATA_CHANGE: 'data-change',
} as const
