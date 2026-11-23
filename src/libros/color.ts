// Color del lomo: el más repetido de la portada, cuantizado. Lo casi blanco y
// lo casi negro solo ganan si dominan de verdad, porque muchas portadas tienen
// márgenes o fondos neutros que no son "su" color.

const CLAVE = 'bibliotec-colores-v1'
let cache: Record<string, string> = {}
try { cache = JSON.parse(localStorage.getItem(CLAVE) || '{}') } catch { cache = {} }

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(cache)) } catch { /* sin almacenamiento: se recalcula */ }
}

export function colorDeReserva(texto: string) {
  let h = 0
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `hsl(${h % 360}, 35%, 38%)`
}

export function colorGuardado(url: string | null) {
  return url ? cache[url] ?? null : null
}

export async function colorDominante(url: string): Promise<string> {
  if (cache[url]) return cache[url]
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url.replace('-L.jpg', '-S.jpg')
  await img.decode()
  const lienzo = document.createElement('canvas')
  lienzo.width = 24
  lienzo.height = 36
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height)
  const { data } = ctx.getImageData(0, 0, lienzo.width, lienzo.height)
  const cubos = new Map<number, { n: number; r: number; g: number; b: number }>()
  let neutros = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const neutro = max > 235 && min > 220 || max < 28
    if (neutro) neutros++
    const clave = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4)
    const peso = neutro ? 0.25 : 1 + (max - min) / 255
    const c = cubos.get(clave) ?? { n: 0, r: 0, g: 0, b: 0 }
    c.n += peso; c.r += r * peso; c.g += g * peso; c.b += b * peso
    cubos.set(clave, c)
  }
  let mejor = { n: 0, r: 0, g: 0, b: 0 }
  for (const c of cubos.values()) if (c.n > mejor.n) mejor = c
  if (neutros / (data.length / 4) > 0.75) {
    mejor = [...cubos.values()].reduce((a, c) => (c.n > a.n ? c : a), mejor)
  }
  const hex = '#' + [mejor.r, mejor.g, mejor.b].map(v => Math.round(v / mejor.n).toString(16).padStart(2, '0')).join('')
  cache[url] = hex
  guardar()
  return hex
}

export function colorDeTexto(fondo: string) {
  const m = fondo.match(/^#(..)(..)(..)$/)
  if (!m) return '#f6f1e7'
  const [r, g, b] = m.slice(1).map(x => parseInt(x, 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const luz = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luz > 0.22 ? '#1d1a16' : '#f6f1e7'
}
