// One line of the name on a gentle arc: the ends come toward the viewer and are a bit bigger.
export const LINE_GAP = 1.3        // vertical distance between the lines (letter units)
export const END_SCALE = 1.22      // end letters vs middle letters
export const CURVE = 0.3           // 0 = flat, 1 = strong bend

// chars: [{ ch, adv }], adv = glyph advance in letter units
export function layoutLine(chars: { ch: string; adv: number }[]) {
  // Pass 1: flat layout -> where each letter sits from -1 (left end) to 1 (right end)
  const flatW = chars.reduce((a, c) => a + c.adv, 0)
  let x = 0
  const withU = chars.map((c) => { const u = ((x + c.adv / 2) / flatW) * 2 - 1; x += c.adv; return { ...c, u } })
  // Pass 2: size grows smoothly toward both ends
  const sized = withU.map((c) => ({ ...c, s: 1 + (END_SCALE - 1) * Math.pow(Math.abs(c.u), 1.6) }))
  const totalW = sized.reduce((a, c) => a + c.adv * c.s, 0)
  // Pass 3: bend the line onto an arc that wraps toward the viewer
  const R = totalW / (0.4 + 2.2 * CURVE)
  let cursor = -totalW / 2
  return sized.map((c) => {
    const w = c.adv * c.s, arcX = cursor + w / 2; cursor += w
    const theta = arcX / R
    return { ch: c.ch, s: c.s, theta, x: R * Math.sin(theta), z: R * (1 - Math.cos(theta)) }
  })
}
