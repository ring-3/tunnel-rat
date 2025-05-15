import React, { useSyncExternalStore } from 'react'
import { useIsomorphicLayoutEffect } from './utils'

type Props = { children: React.ReactNode }

export default function tunnel() {
  let rats: Array<React.ReactNode> = []
  const ratNotifiers: Array<() => void> = []
  function subscribeToRatChanges(onRatsChange: () => void) {
    ratNotifiers.push(onRatsChange)
    return () => {
      ratNotifiers.splice(ratNotifiers.indexOf(onRatsChange), 1)
    }
  }
  function getRats() {
    return rats
  }
  function setRats(newRats: Array<React.ReactNode>) {
    rats = newRats
    for (const notify of ratNotifiers) {
      notify()
    }
  }

  let version = 0
  const versionNotifiers: Array<() => void> = []
  function subscribeToVersionChanges(onVersionChange: () => void) {
    versionNotifiers.push(onVersionChange)
    return () => {
      versionNotifiers.splice(versionNotifiers.indexOf(onVersionChange), 1)
    }
  }
  function getVersion() {
    return version
  }
  function setVersion(newVersion: number) {
    version = newVersion
    for (const notify of versionNotifiers) {
      notify()
    }
  }

  return {
    In: ({ children }: Props) => {
      const currentVersion = useSyncExternalStore(subscribeToVersionChanges, getVersion)

      /* When this component mounts, we increase the version number.
      This will cause all existing rats to re-render (just like if the Out component
      were mapping items to a list.) The re-rendering will cause the final
      order of rendered components to match what the user is expecting. */
      useIsomorphicLayoutEffect(() => {
        setVersion(version + 1)
      }, [])

      /* Any time the children _or_ the version number change, insert
      the specified React children into the list of rats. */
      useIsomorphicLayoutEffect(() => {
        setRats([...rats, children])
        return () => {
          setRats(rats.filter((child) => child !== children))
        }
      }, [children, currentVersion])

      return null
    },

    Out: () => {
      const children = useSyncExternalStore(subscribeToRatChanges, getRats)
      return <>{children}</>
    },
  }
}
