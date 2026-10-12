import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { detectQuality, type Quality } from './lightMode'

type Ctx = Quality & { goLight: () => void }
const QualityContext = createContext<Ctx | null>(null)

export function QualityProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState<Quality>(detectQuality)
  const goLight = useCallback(() => setQ({ light: true, reason: 'slow-fps', pinned: false }), [])
  return <QualityContext.Provider value={{ ...q, goLight }}>{children}</QualityContext.Provider>
}

export function useQuality() {
  const ctx = useContext(QualityContext)
  if (!ctx) throw new Error('useQuality must be used inside <QualityProvider>')
  return ctx
}
