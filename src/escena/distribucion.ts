import type { Config } from '../estado'
import { ordenar } from '../libros/orden'
import type { Caja, Hueco, Libro, Mueble, Seccion } from '../tipos'

export const SALA = { ancho: 12, fondo: 10, alto: 3.2 }
export const MUEBLE = { ancho: 1, alto: 2.1, fondo: 0.34, baldas: 5, tabla: 0.025 }
export const ISLA_Z = -2
const PROFUNDIDAD_LIBRO = 0.15
const HOLGURA = 0.004
const UTIL = MUEBLE.ancho - 2 * MUEBLE.tabla - 0.02
const LLENADO = 0.85
// Se llena primero la balda a la altura de los ojos y se baja; la de arriba,
// incómoda de leer, queda para el final.
const ORDEN_BALDAS = [3, 2, 1, 0, 4]
const ORDEN_GENEROS = ['novela', 'clásicos', 'fantasía', 'ciencia ficción', 'ensayo']

export function grosorLibro(libro: Libro) {
  return Math.max(0.012, (libro.paginas ?? 300) * 0.00006 + 0.004)
}

function hash(texto: string) {
  let h = 0
  for (const c of texto) h = (h * 33 + c.charCodeAt(0)) >>> 0
  return h
}

export function altoLibro(libro: Libro) {
  return [0.21, 0.23, 0.23, 0.24, 0.25][hash(libro.id) % 5]
}

// Orden en que se ocupan los sitios: primero la cara de la isla que mira a la
// entrada (lo primero que ves al entrar), luego su otra cara y al final la
// pared del fondo. Dentro de cada fila, de izquierda a derecha según la mira
// quien está delante.
function sitios() {
  const fila = (n: number, z: number, giro: number) =>
    Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * MUEBLE.ancho)
      .sort((a, b) => (giro === 0 ? a - b : b - a))
      .map(x => ({ x, z, giro }))
  return [
    ...fila(6, ISLA_Z + MUEBLE.fondo / 2, 0),
    ...fila(6, ISLA_Z - MUEBLE.fondo / 2, Math.PI),
    ...fila(7, -SALA.fondo / 2 + MUEBLE.fondo / 2 + 0.02, 0),
  ]
}
export const TOTAL_SITIOS = sitios().length

function modulosNecesarios(libros: Libro[]) {
  const ancho = libros.reduce((s, l) => s + grosorLibro(l) + HOLGURA, 0)
  return Math.max(1, Math.ceil(ancho / (UTIL * MUEBLE.baldas * LLENADO)))
}

export function secciones(libros: Libro[], config: Config): Seccion[] {
  const grupos = new Map<string, Libro[]>()
  for (const l of libros) {
    const g = l.genero ?? 'sin género'
    grupos.set(g, [...(grupos.get(g) ?? []), l])
  }
  const peso = (g: string) => (ORDEN_GENEROS.includes(g) ? ORDEN_GENEROS.indexOf(g) : 99)
  return [...grupos.keys()]
    .sort((a, b) => peso(a) - peso(b) || a.localeCompare(b, 'es'))
    .map(g => ({
      id: g,
      nombre: g,
      criterio: config.criterios[g] ?? 'autor',
      modulos: modulosNecesarios(grupos.get(g)!) + (config.extra[g] ?? 0),
      libros: grupos.get(g)!,
    }))
}

export interface Biblioteca {
  secciones: Seccion[]
  muebles: Mueble[]
  huecos: Hueco[]
  sobran: Record<string, Libro[]>
  libres: number
}

export function construir(libros: Libro[], config: Config, colorDe: (l: Libro) => string): Biblioteca {
  const lista = sitios()
  const muebles: Mueble[] = []
  const huecos: Hueco[] = []
  const sobran: Record<string, Libro[]> = {}
  const paso = (MUEBLE.alto - MUEBLE.tabla) / MUEBLE.baldas
  const lz = MUEBLE.fondo / 2 - PROFUNDIDAD_LIBRO / 2 - 0.015
  let cursor = 0
  const lista_secciones = secciones(libros, config)

  for (const s of lista_secciones) {
    const propios = lista.slice(cursor, cursor + s.modulos).map((sitio, indice) => ({ ...sitio, id: `${s.id}-${indice}`, seccion: s.id, indice }))
    cursor += propios.length
    muebles.push(...propios)
    const cola = ordenar(s.libros, s.criterio, colorDe)
    let i = 0
    for (const m of propios) {
      const cos = Math.cos(m.giro), sin = Math.sin(m.giro)
      for (const balda of ORDEN_BALDAS) {
        if (i >= cola.length) break
        const suelo = balda * paso + MUEBLE.tabla
        let x = -UTIL / 2
        while (i < cola.length) {
          const libro = cola[i]
          const g = grosorLibro(libro)
          if (x + g > UTIL / 2) break
          const alto = altoLibro(libro)
          const lx = x + g / 2
          huecos.push({
            libro,
            posicion: [m.x + lx * cos + lz * sin, suelo + alto / 2, m.z - lx * sin + lz * cos],
            medidas: [g, alto, PROFUNDIDAD_LIBRO],
            giro: m.giro,
            seccion: s.id,
            modulo: m.indice,
            balda: MUEBLE.baldas - balda,
            orden: i,
          })
          x += g + HOLGURA
          i++
        }
      }
    }
    if (i < cola.length) sobran[s.id] = cola.slice(i)
  }
  return { secciones: lista_secciones, muebles, huecos, sobran, libres: lista.length - cursor }
}

export function cajasDeChoque(muebles: Mueble[]): Caja[] {
  return muebles.map(m => ({
    min: [m.x - MUEBLE.ancho / 2, m.z - MUEBLE.fondo / 2],
    max: [m.x + MUEBLE.ancho / 2, m.z + MUEBLE.fondo / 2],
  }))
}
