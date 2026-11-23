import { BoxGeometry, CanvasTexture, SRGBColorSpace } from 'three'
import type { Libro } from '../tipos'
import { colorDeTexto } from './color'

// Cada libro lleva UNA textura con todo su forro (portada, lomo, contraportada
// y un trozo de papel para los cantos) y una sola caja con las UV apuntando a
// cada trozo: así es una llamada de dibujo por libro en vez de seis.
// La versión normal es pequeña; al cogerlo se pinta otra al doble con la
// portada en alta. Las proporciones son las mismas, así que las UV no cambian.

const ALTO_NORMAL = 512
const PORTADA_NORMAL = 160
const PAPEL_NORMAL = 8
const PAPEL = '#efe6d0'

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

// Caras de BoxGeometry, 4 vértices cada una: +x portada, -x contraportada,
// +y y -y papel, +z lomo, -z papel (canto de las hojas).
export function cajaLibro(grosor: number, alto: number, fondo: number) {
  const g = new BoxGeometry(grosor, alto, fondo)
  const r = regionesLibro(grosor, alto)
  const porCara = [r.portada, r.contra, r.papel, r.papel, r.lomo, r.papel]
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) {
    const [a, b] = porCara[Math.floor(i / 4)]
    uv.setX(i, a + uv.getX(i) * (b - a))
  }
  g.clearGroups()
  return g
}

const FRANJAS: Record<string, [string, string]> = {
  dvd: ['#111111', 'dvd'],
  bluray: ['#1f5fbf', 'blu-ray'],
  '4k': ['#111111', '4k'],
  switch: ['#e60012', 'switch'],
  ds: ['#d8d8d8', 'ds'],
  '3ds': ['#d8d8d8', '3ds'],
  ps: ['#0b49a6', 'playstation'],
  xbox: ['#107c10', 'xbox'],
}

function franjaDe(libro: Libro) {
  if (libro.tipo === 'libro' || libro.formato === 'cartucho') return null
  if (libro.tipo === 'videojuego') {
    const p = (libro.plataforma ?? '').toLowerCase()
    return FRANJAS[p] ?? (p.startsWith('ps') ? FRANJAS.ps : p.startsWith('xbox') ? FRANJAS.xbox : ['#555555', p || 'juego'])
  }
  return FRANJAS[libro.formato ?? 'dvd'] ?? FRANJAS.dvd
}

function pintarLomo(ctx: CanvasRenderingContext2D, libro: Libro, x: number, ancho: number, h: number, fondo: string, escala: number) {
  const tinta = colorDeTexto(fondo)
  ctx.fillStyle = fondo
  ctx.fillRect(x, 0, ancho, h)
  const franja = franjaDe(libro)
  if (franja) {
    const alto = 46 * escala
    ctx.fillStyle = franja[0]
    ctx.fillRect(x, 0, ancho, alto)
    ctx.save()
    ctx.translate(x + ancho / 2, alto / 2)
    ctx.rotate(Math.PI / 2)
    ctx.fillStyle = colorDeTexto(franja[0].length === 7 ? franja[0] : '#111111')
    ctx.font = `600 ${Math.min(ancho * 0.5, 10 * escala)}px Poppins, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(franja[1], 0, 0)
    ctx.restore()
  }
  ctx.fillStyle = tinta
  ctx.globalAlpha = 0.35
  ctx.fillRect(x, 23 * escala, ancho, 2 * escala)
  ctx.fillRect(x, h - 25 * escala, ancho, 2 * escala)
  ctx.globalAlpha = 1
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, 0, ancho, h)
  ctx.clip()
  ctx.translate(x + ancho / 2, 0)
  ctx.rotate(Math.PI / 2)
  ctx.textBaseline = 'middle'
  const cuerpo = Math.min(ancho * 0.42, 17 * escala)
  ctx.font = `600 ${cuerpo}px Poppins, sans-serif`
  ctx.fillText(recortar(ctx, libro.titulo.toLowerCase(), h * (libro.autor ? 0.58 : 0.78)), (franjaDe(libro) ? 60 : 45) * escala, 0)
  ctx.font = `400 ${cuerpo * 0.72}px Poppins, sans-serif`
  ctx.globalAlpha = 0.8
  ctx.textAlign = 'right'
  if (libro.autor) ctx.fillText(recortar(ctx, libro.autor.toLowerCase(), h * 0.24), h - 40 * escala, 0)
  ctx.restore()
  if (libro.tomo) {
    ctx.globalAlpha = 1
    ctx.fillStyle = tinta
    ctx.font = `600 ${Math.min(ancho * 0.5, 13 * escala)}px Poppins, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(libro.tomo), x + ancho / 2, 12 * escala)
  }
}

function pintarPortadaSinImagen(ctx: CanvasRenderingContext2D, libro: Libro, x: number, ancho: number, h: number, fondo: string, escala: number) {
  ctx.fillStyle = fondo
  ctx.fillRect(x, 0, ancho, h)
  ctx.fillStyle = colorDeTexto(fondo)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${15 * escala}px Poppins, sans-serif`
  ctx.fillText(recortar(ctx, libro.titulo.toLowerCase(), ancho * 0.85), x + ancho / 2, h * 0.4)
  ctx.font = `400 ${11 * escala}px Poppins, sans-serif`
  if (libro.autor) ctx.fillText(recortar(ctx, libro.autor.toLowerCase(), ancho * 0.85), x + ancho / 2, h * 0.48)
}

export function texturaLibro(libro: Libro, grosor: number, alto: number, fondo: string, portada: HTMLImageElement | null, alta: boolean) {
  const escala = alta ? 2 : 1
  const m = medidas(grosor, alto, escala)
  const lienzo = document.createElement('canvas')
  lienzo.width = m.ancho
  lienzo.height = m.h
  const ctx = lienzo.getContext('2d')!
  if (portada) ctx.drawImage(portada, 0, 0, m.portada, m.h)
  else pintarPortadaSinImagen(ctx, libro, 0, m.portada, m.h, fondo, escala)
  pintarLomo(ctx, libro, m.portada, m.lomo, m.h, fondo, escala)
  ctx.fillStyle = fondo
  ctx.fillRect(m.portada + m.lomo, 0, m.portada, m.h)
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.fillRect(m.portada + m.lomo, 0, m.portada, m.h)
  ctx.fillStyle = PAPEL
  ctx.fillRect(m.portada * 2 + m.lomo, 0, m.papel, m.h)
  const t = new CanvasTexture(lienzo)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}
