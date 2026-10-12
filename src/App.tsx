import { useEffect } from 'react'
import { NAME_LINES, SECTIONS } from './data/content'
import { useLang } from './i18n/lang'
import { watchFirstFrames } from './perf/lightMode'
import { useQuality } from './perf/quality'
import { NameCanvas } from './scene/NameScene'
import { RoomCanvas } from './scene/Room'
import { LangToggle } from './ui/LangToggle'

// Light version: no WebGL at all, the name as HTML text in the same place.
function LightName() {
  return <h1 className="light-name" aria-label="Santiago Boada.dev">{NAME_LINES.map((l) => <span key={l}>{l}</span>)}</h1>
}

export default function App() {
  const { light, reason, pinned, goLight } = useQuality()
  const { lang, t } = useLang()

  // a slow start (< 24 fps over the first 2 s) switches to the light version
  useEffect(() => {
    if (light || pinned) return
    return watchFirstFrames(goLight)
  }, [light, pinned, goLight])

  return (
    <>
      {light ? <div className="light-bg" aria-hidden="true" /> : <RoomCanvas />}
      {light ? <LightName /> : <><h1 className="sr-only">Santiago Boada.dev</h1><NameCanvas /></>}
      <LangToggle />
      {import.meta.env.DEV && (
        <div className="dev-chip">
          {light ? `light (${reason})` : 'full 3D'} · {lang} · {SECTIONS.map((s) => t(s.label)).join(' · ')}
        </div>
      )}
    </>
  )
}
