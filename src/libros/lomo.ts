import { BoxGeometry, CanvasTexture, SRGBColorSpace } from 'three'
import type { Libro } from '../tipos'
import { fondoLibro } from '../escena/distribucion'
import { colorDeTexto } from './color'

// Cada objeto lleva UNA textura con todo su forro (portada, lomo,
// contraportada y una tira para los cantos: papel en los libros, plástico en
// las cajas) y una sola caja con las UV apuntando a cada trozo: una llamada de
// dibujo por objeto. La versión normal es pequeña; al cogerlo se pinta otra
// al doble. Las proporciones son las mismas, así que las UV no cambian.

const ALTO_NORMAL = 512
const PORTADA_NORMAL = 160
const PAPEL_NORMAL = 8
const PAPEL = '#efe6d0'

// Estilo de caja de cada consola o formato: color del plástico, franja de la
// cabecera y su texto. Inspirado en las cajas reales, sin sus logotipos.
interface Estilo { plastico: string; franja: string; texto: string; tinta: string; alto: number }
const ESTILOS: Record<string, Estilo> = {
  switch: { plastico: '#d8141e', franja: '#e60012', texto: 'NINTENDO SWITCH', tinta: '#ffffff', alto: 0.1 },
  ds: { plastico: '#e4e4e2', franja: '#f2f2f0', texto: 'NINTENDO DS', tinta: '#1a1a1a', alto: 0.09 },
  '3ds': { plastico: '#ececea', franja: '#ffffff', texto: 'NINTENDO 3DS', tinta: '#d0101a', alto: 0.09 },
  'xbox 360': { plastico: '#2c8a2a', franja: '#3aa335', texto: 'XBOX 360', tinta: '#ffffff', alto: 0.075 },
  xbox: { plastico: '#107c10', franja: '#107c10', texto: 'XBOX', tinta: '#ffffff', alto: 0.075 },
  wii: { plastico: '#f2f2f2', franja: '#ffffff', texto: 'Wii', tinta: '#8a8a8a', alto: 0.075 },
  ps: { plastico: '#0b49a6', franja: '#0b49a6', texto: 'PlayStation', tinta: '#ffffff', alto: 0.075 },
  dvd: { plastico: '#141414', franja: '#141414', texto: 'DVD', tinta: '#ffffff', alto: 0.06 },
  bluray: { plastico: '#1f5fbf', franja: '#1f5fbf', texto: 'BLU-RAY', tinta: '#ffffff', alto: 0.065 },
  '4k': { plastico: '#111111', franja: '#111111', texto: '4K ULTRA HD', tinta: '#ffffff', alto: 0.065 },
  otra: { plastico: '#3a3a3a', franja: '#3a3a3a', texto: 'VIDEOJUEGO', tinta: '#ffffff', alto: 0.07 },
}

export function estiloDe(libro: Libro): Estilo | null {
  if (libro.tipo === 'libro' || libro.formato === 'cartucho') return null
  if (libro.tipo === 'videojuego') {
    const p = (libro.plataforma ?? '').toLowerCase()
    const clave = /360/.test(p) ? 'xbox 360' : /xbox/.test(p) ? 'xbox' : /^ps|playstation/.test(p) ? 'ps' : /3ds/.test(p) ? '3ds' : /\bds\b/.test(p) ? 'ds' : /switch/.test(p) ? 'switch' : /wii/.test(p) ? 'wii' : 'otra'
    return ESTILOS[clave]
  }
  return ESTILOS[libro.formato ?? 'dvd'] ?? ESTILOS.dvd
}

function recortar(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  if (ctx.measureText(texto).width <= ancho) return texto
  let t = texto
  while (t.length > 1 && ctx.measureText(t + '…').width > ancho) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}

function medidas(grosor: number, alto: number, escala: number) {
  const h = ALTO_NORMAL * escala
  const lomo = Math.max(24, Math.round((grosor / alto) * ALTO_NORMAL)) * escala
  const portada = PORTADA_NORMAL * escala
  const papel = PAPEL_NORMAL * escala
  return { h, lomo, portada, papel, ancho: portada * 2 + lomo + papel }
}

export function regionesLibro(grosor: number, alto: number) {
  const m = medidas(grosor, alto, 1)
  const u = (px: number) => px / m.ancho
  return {
    portada: [0, u(m.portada)] as const,
    lomo: [u(m.portada), u(m.portada + m.lomo)] as const,
    contra: [u(m.portada + m.lomo), u(m.portada * 2 + m.lomo)] as const,
    papel: [u(m.portada * 2 + m.lomo + 1), 1] as const,
  }
}

type Region = readonly [number, number]
// Caja con cada cara apuntando a un trozo de la textura. Orden de caras de
// BoxGeometry, 4 vértices cada una: +x, -x, +y, -y, +z, -z.
export function cajaConRegiones(medidasCaja: [number, number, number], caras: [Region, Region, Region, Region, Region, Region]) {
  const g = new BoxGeometry(...medidasCaja)
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) {
    const [a, b] = caras[Math.floor(i / 4)]
    uv.setX(i, a + uv.getX(i) * (b - a))
  }
  g.clearGroups()
  return g
}

// Libro cerrado: +x portada, -x contraportada, arriba y abajo papel, +z lomo
// y -z el canto de las hojas.
export function cajaLibro(grosor: number, alto: number, fondo: number) {
  const r = regionesLibro(grosor, alto)
  return cajaConRegiones([grosor, alto, fondo], [r.portada, r.contra, r.papel, r.papel, r.lomo, r.papel])
}

// Piezas de la caja abierta de un juego (o una película): bandeja de atrás,
// tapa con la portada por fuera y un manual con la portada por dentro.
export function piezasCajaAbierta(grosor: number, alto: number, fondo: number) {
  const r = regionesLibro(grosor, alto)
  const media = grosor / 2
  return {
    bandeja: cajaConRegiones([media, alto, fondo], [r.papel, r.contra, r.papel, r.papel, r.lomo, r.papel]),
    tapa: cajaConRegiones([media, alto, fondo], [r.portada, r.papel, r.papel, r.papel, r.papel, r.papel]),
    manual: cajaConRegiones([0.002, alto * 0.86, fondo * 0.84], [r.papel, r.portada, r.papel, r.papel, r.papel, r.papel]),
    etiqueta: cajaConRegiones([0.0006, 1, 1], [r.portada, r.portada, r.papel, r.papel, r.papel, r.papel]),
  }
}

function sombraCurva(ctx: CanvasRenderingContext2D, x: number, ancho: number, h: number) {
  // Lomo redondeado: más oscuro en los bordes, un brillo suave en el centro.
  const g = ctx.createLinearGradient(x, 0, x + ancho, 0)
  g.addColorStop(0, 'rgba(0,0,0,0.38)')
  g.addColorStop(0.18, 'rgba(0,0,0,0.05)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.10)')
  g.addColorStop(0.82, 'rgba(0,0,0,0.06)')
  g.addColorStop(1, 'rgba(0,0,0,0.42)')
  ctx.fillStyle = g
  ctx.fillRect(x, 0, ancho, h)
}

function pintarLomoLibro(ctx: CanvasRenderingContext2D, libro: Libro, x: number, ancho: number, h: number, fondo: string, escala: number) {
  const tinta = colorDeTexto(fondo)
  ctx.fillStyle = fondo
  ctx.fillRect(x, 0, ancho, h)
  // Mismo diseño para todos (decisión 43): dos filetes dobles arriba y abajo.
  ctx.fillStyle = tinta
  ctx.globalAlpha = 0.45
  for (const y of [22, 27, h / escala - 29, h / escala - 24]) ctx.fillRect(x + 3 * escala, y * escala, ancho - 6 * escala, 1.5 * escala)
  ctx.globalAlpha = 1
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, 0, ancho, h)
  ctx.clip()
  ctx.translate(x + ancho / 2, 0)
  ctx.rotate(Math.PI / 2)
  ctx.textBaseline = 'middle'
  ctx.fillStyle = tinta
  const cuerpo = Math.min(ancho * 0.42, 17 * escala)
  ctx.font = `600 ${cuerpo}px Poppins, sans-serif`
  ctx.fillText(recortar(ctx, libro.titulo.toLowerCase(), h * 0.58), 45 * escala, 0)
  ctx.font = `400 ${cuerpo * 0.72}px Poppins, sans-serif`
  ctx.globalAlpha = 0.8
  ctx.textAlign = 'right'
  if (libro.autor) ctx.fillText(recortar(ctx, libro.autor.toLowerCase(), h * 0.24), h - 40 * escala, 0)
  ctx.restore()
  if (libro.tomo) {
    ctx.fillStyle = tinta
    ctx.font = `600 ${Math.min(ancho * 0.5, 13 * escala)}px Poppins, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(libro.tomo), x + ancho / 2, 12 * escala)
  }
  sombraCurva(ctx, x, ancho, h)
}

// Lomo de caja: plástico del color de la consola, cabecera con su nombre y el
// título en una tira blanca, como las cajas de verdad.
function pintarLomoCaja(ctx: CanvasRenderingContext2D, libro: Libro, e: Estilo, x: number, ancho: number, h: number, escala: number) {
  ctx.fillStyle = e.plastico
  ctx.fillRect(x, 0, ancho, h)
  const cab = h * e.alto * 1.4
  ctx.fillStyle = e.franja
  ctx.fillRect(x, 0, ancho, cab)
  ctx.save()
  ctx.translate(x + ancho / 2, cab / 2)
  ctx.rotate(Math.PI / 2)
  ctx.fillStyle = e.tinta
  ctx.font = `700 ${Math.min(ancho * 0.42, 9 * escala)}px Poppins, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(e.texto, 0, 0)
  ctx.restore()
  const margen = 2 * escala
  ctx.fillStyle = '#f7f7f5'
  ctx.fillRect(x + margen, cab + margen, ancho - margen * 2, h - cab - margen * 2)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, cab, ancho, h - cab)
  ctx.clip()
  ctx.translate(x + ancho / 2, cab)
  ctx.rotate(Math.PI / 2)
  ctx.fillStyle = '#1a1a1a'
  ctx.font = `600 ${Math.min(ancho * 0.4, 14 * escala)}px Poppins, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText(recortar(ctx, libro.titulo, (h - cab) * 0.9), 10 * escala, 0)
  ctx.restore()
  sombraCurva(ctx, x, ancho, h)
}

function pintarPortadaSinImagen(ctx: CanvasRenderingContext2D, libro: Libro, x: number, y: number, ancho: number, alto: number, fondo: string, escala: number) {
  const g = ctx.createLinearGradient(0, y, 0, y + alto)
  g.addColorStop(0, fondo)
  g.addColorStop(1, '#' + [1, 3, 5].map(i => Math.round(parseInt(fondo.slice(i, i + 2) || '80', 16) * 0.6).toString(16).padStart(2, '0')).join(''))
  ctx.fillStyle = g
  ctx.fillRect(x, y, ancho, alto)
  ctx.fillStyle = colorDeTexto(fondo)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${15 * escala}px Poppins, sans-serif`
  ctx.fillText(recortar(ctx, libro.titulo.toLowerCase(), ancho * 0.85), x + ancho / 2, y + alto * 0.42)
  if (libro.autor) {
    ctx.font = `400 ${11 * escala}px Poppins, sans-serif`
    ctx.fillText(recortar(ctx, libro.autor.toLowerCase(), ancho * 0.85), x + ancho / 2, y + alto * 0.5)
  }
}

function pintarPortada(ctx: CanvasRenderingContext2D, libro: Libro, e: Estilo | null, img: HTMLImageElement | null, ancho: number, h: number, fondo: string, escala: number, proporcion: number) {
  const cab = e ? h * e.alto : 0
  const y = cab
  const alto = h - cab
  if (img) {
    // Recorte tipo «cover» con las proporciones de la tapa de verdad (la
    // textura es más estrecha y luego se estira): llena sin deformar.
    const real = h * proporcion
    const k = Math.max(real / img.width, alto / img.height)
    const w = img.width * k, hh = img.height * k
    ctx.save()
    ctx.scale(ancho / real, 1)
    ctx.beginPath()
    ctx.rect(0, y, real, alto)
    ctx.clip()
    ctx.drawImage(img, (real - w) / 2, y + (alto - hh) / 2, w, hh)
    ctx.restore()
  } else pintarPortadaSinImagen(ctx, libro, 0, y, ancho, alto, fondo, escala)
  if (e) {
    ctx.fillStyle = e.franja
    ctx.fillRect(0, 0, ancho, cab)
    ctx.fillStyle = e.tinta
    ctx.font = `700 ${Math.round(cab * 0.42)}px Poppins, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(e.texto, ancho / 2, cab / 2)
    if (libro.tipo === 'videojuego') {
      // Recuadro de edad abajo a la izquierda, como en las cajas europeas.
      const s = 22 * escala
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(6 * escala, h - s - 6 * escala, s * 0.8, s)
      ctx.fillStyle = '#3c9a3a'
      ctx.fillRect(7.5 * escala, h - s - 4.5 * escala, s * 0.8 - 3 * escala, s * 0.62)
      ctx.fillStyle = '#ffffff'
      ctx.font = `700 ${s * 0.4}px Poppins, sans-serif`
      ctx.fillText('7', 6 * escala + s * 0.4, h - s - 4.5 * escala + s * 0.31)
    }
    // Brillo del plástico de la funda.
    const brillo = ctx.createLinearGradient(0, 0, ancho, h)
    brillo.addColorStop(0, 'rgba(255,255,255,0.14)')
    brillo.addColorStop(0.35, 'rgba(255,255,255,0)')
    brillo.addColorStop(1, 'rgba(255,255,255,0.05)')
    ctx.fillStyle = brillo
    ctx.fillRect(0, 0, ancho, h)
  } else {
    // Libros: un poco de sombra junto a la bisagra de la tapa.
    const g = ctx.createLinearGradient(0, 0, 14 * escala, 0)
    g.addColorStop(0, 'rgba(0,0,0,0.25)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 14 * escala, h)
  }
}

export function texturaLibro(libro: Libro, grosor: number, alto: number, fondo: string, portada: HTMLImageElement | null, alta: boolean) {
  const escala = alta ? 2 : 1
  const m = medidas(grosor, alto, escala)
  const e = estiloDe(libro)
  const lienzo = document.createElement('canvas')
  lienzo.width = m.ancho
  lienzo.height = m.h
  const ctx = lienzo.getContext('2d')!
  pintarPortada(ctx, libro, e, portada, m.portada, m.h, fondo, escala, fondoLibro(libro) / alto)
  if (e) pintarLomoCaja(ctx, libro, e, m.portada, m.lomo, m.h, escala)
  else pintarLomoLibro(ctx, libro, m.portada, m.lomo, m.h, fondo, escala)
  const xc = m.portada + m.lomo
  ctx.fillStyle = e ? e.plastico : fondo
  ctx.fillRect(xc, 0, m.portada, m.h)
  ctx.fillStyle = 'rgba(0,0,0,0.14)'
  ctx.fillRect(xc, 0, m.portada, m.h)
  if (e) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillRect(xc + m.portada * 0.1, m.h * 0.2, m.portada * 0.8, m.h * 0.42)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    for (let i = 0; i < 6; i++) ctx.fillRect(xc + m.portada * 0.14, m.h * (0.66 + i * 0.035), m.portada * (0.72 - (i % 2) * 0.2), 2 * escala)
  }
  const xp = m.portada * 2 + m.lomo
  if (e) {
    ctx.fillStyle = e.plastico
    ctx.fillRect(xp, 0, m.papel, m.h)
  } else {
    // Canto de las hojas: papel con líneas finas.
    ctx.fillStyle = PAPEL
    ctx.fillRect(xp, 0, m.papel, m.h)
    ctx.fillStyle = 'rgba(120,100,70,0.18)'
    for (let y = 0; y < m.h; y += 3 * escala) ctx.fillRect(xp, y, m.papel, 1)
  }
  const t = new CanvasTexture(lienzo)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}
