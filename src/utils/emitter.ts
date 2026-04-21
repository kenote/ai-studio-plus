import mitt from 'mitt'

export const emitter = mitt()

export const Events = {
  OPEN_MODEL: 'open-model',
  DATA_CHANGE: 'data-change',
  TOGGLE_SIDEBAR: 'toggle-sidebar',
  CHAT_CHANGE: 'chat-change',
} as const
