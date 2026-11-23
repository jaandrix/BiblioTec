import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

// Texturas dibujadas por código: sin descargar imágenes, con el estilo limpio
// del juego (vetas suaves, nada fotorrealista) y ligeras.

function azar(semilla: number) {
  let s = semilla >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

function mezclar(hex: string, cambio: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * (1 + cambio)))))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

function vetas(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, r: () => number, horizontal = true) {
  const lineas = Math.round((horizontal ? h : w) / 5)
  for (let i = 0; i < lineas; i++) {
    ctx.strokeStyle = mezclar(base, (r() - 0.5) * 0.16)
    ctx.globalAlpha = 0.35 + r() * 0.3
    ctx.lineWidth = 1 + r() * 1.5
    ctx.beginPath()
    const fase = r() * Math.PI * 2, amp = 1 + r() * 3
    for (let t = 0; t <= 1.001; t += 0.05) {
      const a = horizontal ? x + t * w : x + (i / lineas) * w + Math.sin(t * 6 + fase) * amp
      const b = horizontal ? y + (i / lineas) * h + Math.sin(t * 6 + fase) * amp : y + t * h
      if (t === 0) ctx.moveTo(a, b); else ctx.lineTo(a, b)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function aTextura(lienzo: HTMLCanvasElement, repetir: [number, number]): Texture {
  const t = new CanvasTexture(lienzo)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(...repetir)
  t.anisotropy = 8
  return t
}

const cache = new Map<string, Texture>()

export function sueloMadera(repetir: [number, number]) {
  const clave = `suelo${repetir}`
  if (cache.has(clave)) return cache.get(clave)!
  const lienzo = document.createElement('canvas')
  lienzo.width = lienzo.height = 1024
  const ctx = lienzo.getContext('2d')!
  const r = azar(7)
  const tablas = 8, alto = 1024 / tablas
  for (let i = 0; i < tablas; i++) {
    let x = -r() * 400
    while (x < 1024) {
      const largo = 380 + r() * 420
      const base = ['#b88a5c', '#b07f52', '#c09363', '#a97b4f'][Math.floor(r() * 4)]
      ctx.fillStyle = base
      ctx.fillRect(x, i * alto, largo, alto)
      vetas(ctx, x, i * alto, largo, alto, base, r)
      ctx.fillStyle = 'rgba(60,35,18,0.55)'
      ctx.fillRect(x, i * alto, 2, alto)
      x += largo
    }
    ctx.fillStyle = 'rgba(60,35,18,0.5)'
    ctx.fillRect(0, i * alto, 1024, 2)
  }
  const t = aTextura(lienzo, repetir)
  cache.set(clave, t)
  return t
}

export function madera(base: string, horizontal = true) {
  const clave = `madera${base}${horizontal}`
  if (cache.has(clave)) return cache.get(clave)!
  const lienzo = document.createElement('canvas')
  lienzo.width = lienzo.height = 256
  const ctx = lienzo.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  vetas(ctx, 0, 0, 256, 256, base, azar(base.length * 13), horizontal)
  const t = aTextura(lienzo, [1, 1])
  cache.set(clave, t)
  return t
}

export function pared(repetir: [number, number]) {
  const clave = `pared${repetir}`
  if (cache.has(clave)) return cache.get(clave)!
  const lienzo = document.createElement('canvas')
  lienzo.width = lienzo.height = 512
  const ctx = lienzo.getContext('2d')!
  ctx.fillStyle = '#efe4d2'
  ctx.fillRect(0, 0, 512, 512)
  const r = azar(3)
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(120,90,60,0.05)'
    const s = 1 + r() * 3
    ctx.fillRect(r() * 512, r() * 512, s, s)
  }
  const t = aTextura(lienzo, repetir)
  cache.set(clave, t)
  return t
}

export function alfombra() {
  if (cache.has('alfombra')) return cache.get('alfombra')!
  const lienzo = document.createElement('canvas')
  lienzo.width = 512
  lienzo.height = 340
  const ctx = lienzo.getContext('2d')!
  ctx.fillStyle = '#7a2e2a'
  ctx.fillRect(0, 0, 512, 340)
  ctx.strokeStyle = '#d9b77a'
  ctx.lineWidth = 6
  ctx.strokeRect(18, 18, 476, 304)
  ctx.lineWidth = 2
  ctx.strokeRect(34, 34, 444, 272)
  ctx.fillStyle = '#d9b77a'
  for (let i = 0; i < 7; i++) {
    ctx.save()
    ctx.translate(86 + i * 57, 170)
    ctx.rotate(Math.PI / 4)
    ctx.fillRect(-12, -12, 24, 24)
    ctx.restore()
  }
  const t = aTextura(lienzo, [1, 1])
  cache.set('alfombra', t)
  return t
}
