import * as THREE from 'three'

// TextGeometry puts walls and bevel in one group; split them so the groups are
// 0 = front/back faces, 1 = side walls, 2 = rounded edge.
export function splitEdges(geo: THREE.BufferGeometry, depth: number) {
  const src = geo.attributes, caps: number[] = [], walls: number[] = [], bevel: number[] = []
  // letters made of several pieces (like "i") have one cap group per piece
  const capGroups = geo.groups.filter((g) => g.materialIndex === 0)
  const isCap = (v: number) => capGroups.some((g) => v >= g.start && v < g.start + g.count)
  const z = src.position.array as Float32Array
  for (let t = 0; t < src.position.count / 3; t++) {
    const v = t * 3
    if (isCap(v)) { caps.push(t); continue }
    let isBevel = false
    for (let k = 0; k < 3; k++) { const zz = z[(v + k) * 3 + 2]; if (zz > depth + 1e-5 || zz < -1e-5) isBevel = true }
    ;(isBevel ? bevel : walls).push(t)
  }
  const order = [...caps, ...walls, ...bevel], out = new THREE.BufferGeometry()
  for (const name of Object.keys(src)) {
    const a = src[name] as THREE.BufferAttribute, size = a.itemSize, arr = new Float32Array(a.count * size)
    order.forEach((t, i) => { for (let k = 0; k < 3 * size; k++) arr[i * 3 * size + k] = (a.array as Float32Array)[t * 3 * size + k] })
    out.setAttribute(name, new THREE.BufferAttribute(arr, size))
  }
  out.addGroup(0, caps.length * 3, 0)
  out.addGroup(caps.length * 3, walls.length * 3, 1)
  out.addGroup((caps.length + walls.length) * 3, bevel.length * 3, 2)
  geo.dispose()
  return out
}
