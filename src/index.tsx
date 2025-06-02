import React, { useSyncExternalStore } from 'react'
import { useIsomorphicLayoutEffect } from './utils'

type Props = { children: React.ReactNode }

function createStore<TState>(initialState: TState) {
  let state: TState = initialState
  const notifiers: Array<() => void> = []

  function subscribe(onChange: () => void) {
    notifiers.push(onChange)
    return () => {
      notifiers.splice(notifiers.indexOf(onChange), 1)
    }
  }

  function getState() {
    return state
  }

  return {
    useState() {
      return useSyncExternalStore(subscribe, getState)
    },
    setState(updateState: (currentState: TState) => TState) {
      state = updateState(state)
      for (const notify of notifiers) {
        notify()
      }
    },
  }
}

export default function tunnel() {
  const ratsStore = createStore<Array<React.ReactNode>>([])
  const versionStore = createStore(0)

  return {
    In: ({ children }: Props) => {
      const version = versionStore.useState()

      /* When this component mounts, we increase the version number.
      This will cause all existing rats to re-render (just like if the Out component
      were mapping items to a list.) The re-rendering will cause the final
      order of rendered components to match what the user is expecting. */
      useIsomorphicLayoutEffect(() => {
        versionStore.setState((currentVersion) => currentVersion + 1)
      }, [])

      /* Any time the children _or_ the version number change, insert
      the specified React children into the list of rats. */
      useIsomorphicLayoutEffect(() => {
        ratsStore.setState((rats) => [...rats, children])
        return () => {
          ratsStore.setState((rats) => rats.filter((child) => child !== children))
        }
      }, [children, version])

      return null
    },

    Out: () => {
      const rats = ratsStore.useState()
      return <>{rats}</>
    },
  }
}
