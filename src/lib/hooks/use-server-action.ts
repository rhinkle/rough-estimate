'use client'

import { useActionState, useOptimistic, useTransition } from 'react'
import type { ActionResult } from '@/lib/actions/projects'

export function useServerActionWithOptimistic<T, A>(
  action: (
    prevState: ActionResult<T>,
    formData: FormData | A
  ) => Promise<ActionResult<T>>,
  initialState: ActionResult<T>,
  optimisticReducer?: (state: T[], action: { type: string; payload: T }) => T[]
) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [optimisticState, addOptimistic] = useOptimistic<
    T[],
    { type: string; payload: T }
  >(
    [],
    optimisticReducer ||
      ((state, { type, payload }) => {
        switch (type) {
          case 'ADD':
            return [...state, payload]
          case 'UPDATE':
            return state.map(item =>
              (item as any).id === (payload as any).id ? payload : item
            )
          case 'DELETE':
            return state.filter(
              item => (item as any).id !== (payload as any).id
            )
          default:
            return state
        }
      })
  )

  const executeWithOptimistic = async (
    optimisticAction: { type: string; payload: T },
    formDataOrPayload: FormData | A
  ) => {
    addOptimistic(optimisticAction)
    await formAction(formDataOrPayload as FormData)
  }

  return {
    state,
    pending,
    optimisticState,
    executeWithOptimistic,
    formAction,
  }
}

export function useOptimisticAction<T>(
  initialData: T[],
  serverAction: (data: any) => Promise<ActionResult<T>>
) {
  const [isPending, startTransition] = useTransition()
  const [optimisticData, addOptimistic] = useOptimistic<
    T[],
    { type: string; payload: T }
  >(initialData, (state, { type, payload }) => {
    switch (type) {
      case 'ADD':
        return [...state, payload]
      case 'UPDATE':
        return state.map(item =>
          (item as any).id === (payload as any).id
            ? { ...item, ...payload }
            : item
        )
      case 'DELETE':
        return state.filter(item => (item as any).id !== (payload as any).id)
      case 'TOGGLE':
        return state.map(item =>
          (item as any).id === (payload as any).id
            ? { ...item, isActive: !(item as any).isActive }
            : item
        )
      default:
        return state
    }
  })

  const executeAction = async (
    type: string,
    payload: T,
    serverData?: any,
    onSuccess?: (result: ActionResult<T>) => void,
    onError?: (error: string) => void
  ) => {
    startTransition(async () => {
      // Add optimistic update
      addOptimistic({ type, payload })

      try {
        const result = await serverAction(serverData || payload)

        if (result.success) {
          onSuccess?.(result)
        } else {
          // Revert optimistic update on error
          onError?.(result.error || 'An error occurred')
        }
      } catch (error) {
        // Revert optimistic update on error
        onError?.(error instanceof Error ? error.message : 'An error occurred')
      }
    })
  }

  return {
    data: optimisticData,
    isPending,
    executeAction,
  }
}
