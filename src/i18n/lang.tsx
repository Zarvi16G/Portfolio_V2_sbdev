import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { META, type L, type Lang } from '../data/content'

const KEY = 'sb-lang'

// English by default; Spanish when the browser language starts with "es"; a saved choice wins.
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'es') return saved
  } catch { /* storage blocked */ }
  return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en'
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (l: L) => string }
const LangContext = createContext<Ctx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* storage blocked */ }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = META.title[lang]
    document.querySelector('meta[name="description"]')?.setAttribute('content', META.description[lang])
  }, [lang])

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (l) => l[lang] }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}

// Renders copy where **text** means bold.
export function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : part)}</>
}
