import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  acknowledgeExtensionActions,
  postAppReadyToExtension,
  processExtensionAction,
  type IncomingExtensionAction,
} from '../../lib/extensionBridge'

export function ExtensionBridge() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let toastTimer: number | undefined

    const showToast = (msg: string) => {
      setToast(msg)
      if (toastTimer) window.clearTimeout(toastTimer)
      toastTimer = window.setTimeout(() => setToast(null), 4500)
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window || !event.data) return
      const data = event.data as {
        source?: string
        type?: string
        actions?: IncomingExtensionAction[]
      }

      if (data.source === 'hirely-extension' && data.type === 'HIRELY_EXT_ACTIONS') {
        const actions = Array.isArray(data.actions) ? data.actions : []
        const ackIds: string[] = []
        for (const act of actions) {
          if (processExtensionAction(act, navigate, showToast)) {
            ackIds.push(act.id)
          }
        }
        if (ackIds.length) {
          acknowledgeExtensionActions(ackIds)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    postAppReadyToExtension()

    return () => {
      window.removeEventListener('message', handleMessage)
      if (toastTimer) window.clearTimeout(toastTimer)
    }
  }, [navigate])

  if (!toast) return null

  return (
    <div className="fixed bottom-20 left-4 sm:left-6 z-50 max-w-sm px-4 py-3 rounded-2xl bg-surface/95 backdrop-blur-xl border border-brand-500/40 shadow-2xl text-xs font-medium text-fg-strong flex items-center gap-2.5 animate-fade-in">
      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
      <span>{toast}</span>
    </div>
  )
}

