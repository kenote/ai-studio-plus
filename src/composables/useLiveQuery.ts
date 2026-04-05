import { ref, watch, type Ref, onUnmounted } from 'vue'
import { liveQuery } from 'dexie'

export function useLiveQuery<T>(
  queryFn: () => Promise<T> | T,
  deps?: Ref<unknown>[] | Ref<unknown>,
): Ref<T | undefined> {
  const result = ref<T>() as Ref<T | undefined>
  let subscription: { unsubscribe: () => void } | null = null

  const startQuery = () => {
    if (subscription) {
      subscription.unsubscribe()
    }
    const observable = liveQuery(queryFn)
    subscription = observable.subscribe({
      next: (value) => {
        result.value = value
      },
      error: (err) => {
        console.error('useLiveQuery error:', err)
      },
    })
  }

  if (deps) {
    watch(deps, startQuery, { immediate: true })
  } else {
    startQuery()
  }

  onUnmounted(() => {
    if (subscription) {
      subscription.unsubscribe()
    }
  })

  return result
}
