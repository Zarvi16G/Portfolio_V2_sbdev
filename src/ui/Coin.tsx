// A real CSS-3D coin: two faces 12px apart, an edge band of thin strips around the rim
// (shaded by angle, lit from the top-left) and four solid core discs so nothing shows through edge-on.
const R = 42                                  // 84px coin
const N = Math.round(R * 1.15)
const STRIP = (2 * Math.PI * R) / N + 1.4
const EDGE = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * 360
  const light = 0.5 + 0.5 * Math.cos(((a - 315) * Math.PI) / 180)
  return {
    width: `${STRIP}px`, marginLeft: `${-STRIP / 2}px`,
    '--edge': `hsl(342 ${78 + light * 6}% ${16 + light * 18}%)`,
    '--edge-ghost': `hsl(342 38% ${58 + light * 16}%)`,
    transform: `rotateZ(${a}deg) translateY(-${R - 0.6}px) rotateX(90deg)`,
  } as React.CSSProperties
})

export function CoinFaces({ label }: { label: string }) {
  return (
    <span className="spin">
      {EDGE.map((style, i) => <i key={`e${i}`} className="e" style={style} />)}
      {[-4.5, -1.5, 1.5, 4.5].map((z) => <i key={`c${z}`} className="core" style={{ transform: `translateZ(${z}px)` }} />)}
      <i className="face back">{label}</i>
      <i className="face front">{label}</i>
    </span>
  )
}
