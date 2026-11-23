import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Libro } from '../tipos'
import { colorDeTexto } from './color'

const ALTO = 1024

function recortar(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  if (ctx.measureText(texto).width <= ancho) return texto
  let t = texto
  while (t.length > 1 && ctx.measureText(t + '…').width > ancho) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}

// Todos los lomos comparten diseño; solo cambia el color (decisión 43).
export function texturaLomo(libro: Libro, grosor: number, alto: number, fondo: string) {
  const ancho = Math.max(48, Math.round((grosor / alto) * ALTO))
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = ALTO
  const ctx = lienzo.getContext('2d')!
  const tinta = colorDeTexto(fondo)

  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, ancho, ALTO)
  ctx.fillStyle = tinta
  ctx.globalAlpha = 0.35
  ctx.fillRect(0, 46, ancho, 3)
  ctx.fillRect(0, ALTO - 49, ancho, 3)
  ctx.globalAlpha = 1

  ctx.save()
  ctx.translate(ancho / 2, 0)
  ctx.rotate(Math.PI / 2)
  ctx.textBaseline = 'middle'
  const cuerpo = Math.min(ancho * 0.42, 34)
  ctx.font = `600 ${cuerpo}px Poppins, sans-serif`
  ctx.fillText(recortar(ctx, libro.titulo.toLowerCase(), ALTO * 0.58), 90, 0)
  ctx.font = `400 ${cuerpo * 0.72}px Poppins, sans-serif`
  ctx.globalAlpha = 0.8
  const autor = recortar(ctx, libro.autor.toLowerCase(), ALTO * 0.24)
  ctx.textAlign = 'right'
  ctx.fillText(autor, ALTO - 80, 0)
  ctx.restore()

  if (libro.tomo) {
    ctx.globalAlpha = 1
    ctx.font = `600 ${Math.min(ancho * 0.5, 26)}px Poppins, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(libro.tomo), ancho / 2, 24)
  }

  const textura = new CanvasTexture(lienzo)
  textura.colorSpace = SRGBColorSpace
  textura.anisotropy = 8
  return textura
}
