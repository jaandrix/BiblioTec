import type { Config } from '../estado'
import { ordenar } from '../libros/orden'
import type { Caja, Criterio, Hueco, Libro, Mueble, MuebleMapa, Seccion } from '../tipos'

// El ancho crece si hacen falta más pasillos (ver mapaAutomatico).
export const SALA = { ancho: 12, fondo: 10, alto: 3.2 }
const ANCHO_MINIMO = 12
export const MUEBLE = { ancho: 1, alto: 2.1, fondo: 0.34, baldas: 5, tabla: 0.025 }
export const PROFUNDIDAD_LIBRO = 0.15
export const COLOR_MADERA = '#8a5a34'
const HOLGURA = 0.004
const UTIL = MUEBLE.ancho - 2 * MUEBLE.tabla - 0.02
const LLENADO = 0.85
const ALTURA_OJOS = 1.3

// ------------------------------------------------------------------ medidas

// Medidas reales aproximadas (metros) de cada caja: grosor, alto y fondo
// (fondo = ancho de la portada).
const CAJAS: Record<string, [number, number, number]> = {
  dvd: [0.014, 0.19, 0.135],
  bluray: [0.012, 0.17, 0.135],
  '4k': [0.012, 0.17, 0.135],
  switch: [0.011, 0.17, 0.105],
  ds: [0.014, 0.125, 0.137],
  '3ds': [0.014, 0.125, 0.137],
  ps: [0.014, 0.17, 0.135],
  xbox: [0.014, 0.19, 0.135],
  'xbox 360': [0.014, 0.19, 0.135],
  wii: [0.014, 0.19, 0.135],
  cartucho: [0.008, 0.06, 0.05],
}

export function plataformaDe(libro: Libro) {
  const p = (libro.plataforma ?? '').toLowerCase().trim()
  if (!p) return 'otra'
  if (/360/.test(p)) return 'xbox 360'
  if (/xbox/.test(p)) return 'xbox'
  if (/^ps|playstation/.test(p)) return 'ps'
  if (/3ds/.test(p)) return '3ds'
  if (/\bds\b/.test(p)) return 'ds'
  if (/switch/.test(p)) return 'switch'
  if (/wii/.test(p)) return 'wii'
  return p
}

function cajaDe(libro: Libro) {
  if (libro.tipo === 'libro') return null
  if (libro.formato === 'cartucho') return CAJAS.cartucho
  if (libro.tipo === 'videojuego') return CAJAS[plataformaDe(libro)] ?? CAJAS.dvd
  return CAJAS[libro.formato ?? 'dvd'] ?? CAJAS.dvd
}

export function grosorLibro(libro: Libro) {
  const caja = cajaDe(libro)
  return caja ? caja[0] : Math.max(0.012, (libro.paginas ?? 300) * 0.00006 + 0.004)
}

export function fondoLibro(libro: Libro) {
  return cajaDe(libro)?.[2] ?? PROFUNDIDAD_LIBRO
}

function hash(texto: string) {
  let h = 0
  for (const c of texto) h = (h * 33 + c.charCodeAt(0)) >>> 0
  return h
}

export function altoLibro(libro: Libro) {
  const caja = cajaDe(libro)
  if (caja) return caja[1]
  return [0.21, 0.23, 0.23, 0.24, 0.25][hash(libro.id) % 5]
}

// --------------------------------------------------------------- secciones

const ORDEN_GENEROS = ['novela', 'clásicos', 'fantasía', 'ciencia ficción', 'ensayo']
export const PASILLOS = ['libros', 'películas', 'series', 'videojuegos'] as const
export type Pasillo = typeof PASILLOS[number]
const PASILLO_DE: Record<string, Pasillo> = { libro: 'libros', pelicula: 'películas', serie: 'series', videojuego: 'videojuegos' }
const ORDEN_CONSOLAS = ['switch', '3ds', 'ds', 'wii', 'xbox 360', 'xbox', 'ps']

function seccionDe(l: Libro): { id: string; nombre: string; pasillo: Pasillo; plataforma?: string } {
  const pasillo = PASILLO_DE[l.tipo] ?? 'libros'
  if (pasillo === 'videojuegos') {
    const p = plataformaDe(l)
    return { id: `juegos-${p}`, nombre: p, pasillo, plataforma: p }
  }
  if (pasillo === 'libros') return { id: l.genero ?? 'sin género', nombre: l.genero ?? 'sin género', pasillo }
  return { id: pasillo, nombre: pasillo, pasillo }
}

function modulosNecesarios(libros: Libro[], expuestos: Set<string>) {
  const ancho = libros.reduce((s, l) => s + (expuestos.has(l.id) ? fondoLibro(l) + 0.01 : grosorLibro(l)) + HOLGURA, 0)
  return Math.max(1, Math.ceil(ancho / (UTIL * MUEBLE.baldas * LLENADO)))
}

export function secciones(libros: Libro[], config: Config, expuestos: Set<string> = new Set()): Seccion[] {
  const grupos = new Map<string, { info: ReturnType<typeof seccionDe>; libros: Libro[] }>()
  for (const l of libros) {
    const info = seccionDe(l)
    const g = grupos.get(info.id) ?? { info, libros: [] }
    g.libros.push(l)
    grupos.set(info.id, g)
  }
  const peso = (s: ReturnType<typeof seccionDe>) =>
    PASILLOS.indexOf(s.pasillo) * 100 + (s.pasillo === 'libros' ? (ORDEN_GENEROS.includes(s.id) ? ORDEN_GENEROS.indexOf(s.id) : 50)
      : s.plataforma ? (ORDEN_CONSOLAS.includes(s.plataforma) ? ORDEN_CONSOLAS.indexOf(s.plataforma) : 50) : 0)
  return [...grupos.values()]
    .sort((a, b) => peso(a.info) - peso(b.info) || a.info.nombre.localeCompare(b.info.nombre, 'es'))
    .map(({ info, libros: ls }) => ({
      id: info.id,
      nombre: info.nombre,
      pasillo: info.pasillo,
      plataforma: info.plataforma,
      criterio: config.criterios[info.id] ?? (info.pasillo === 'libros' ? 'autor' : info.pasillo === 'videojuegos' ? 'saga' : 'alfabetico') as Criterio,
      modulos: modulosNecesarios(ls, expuestos) + (config.extra[info.id] ?? 0),
      libros: ls,
    }))
}

// ---------------------------------------------------------------- pasillos

// Distribución automática: un pasillo por tipo (libros, películas, series,
// videojuegos), uno al lado del otro, cada uno con dos filas de estanterías
// enfrentadas. Se entra por el lado de la entrada (z mayor) y se llena primero
// la fila izquierda hacia el fondo y luego la derecha volviendo.
export const ANCHO_PASILLO = 2.6
const POR_FILA = 5
const Z_FONDO = -4.3
const SEPARACION = 0.8 + MUEBLE.fondo / 2

export function centroPasillo(i: number, total: number) {
  return (i - (total - 1) / 2) * ANCHO_PASILLO
}

function sitiosDePasillo(i: number, total: number) {
  const xc = centroPasillo(i, total)
  const izquierda = Array.from({ length: POR_FILA }, (_, k) => ({ x: xc - SEPARACION, z: Z_FONDO + (POR_FILA - 1 - k), giro: Math.PI / 2 }))
  const derecha = Array.from({ length: POR_FILA }, (_, k) => ({ x: xc + SEPARACION, z: Z_FONDO + k, giro: -Math.PI / 2 }))
  return [...izquierda, ...derecha]
}

// Un tipo con más de lo que cabe en un pasillo ocupa varios (libros 1,
// libros 2...). Devuelve la lista de pasillos con su tipo.
export function pasillosDe(lista: Seccion[]) {
  const res: { tipo: Pasillo; nombre: string }[] = []
  for (const p of PASILLOS) {
    const modulos = lista.filter(s => s.pasillo === p).reduce((n, s) => n + s.modulos, 0)
    if (!modulos) continue
    const cuantos = Math.ceil(modulos / (POR_FILA * 2))
    for (let i = 0; i < cuantos; i++) res.push({ tipo: p, nombre: cuantos > 1 ? `${p} ${i + 1}` : p })
  }
  return res
}

export function mapaAutomatico(lista: Seccion[]): MuebleMapa[] {
  const pasillos = pasillosDe(lista)
  SALA.ancho = Math.max(ANCHO_MINIMO, pasillos.length * ANCHO_PASILLO + 1.6)
  const mapa: MuebleMapa[] = []
  for (const tipo of PASILLOS) {
    const suyos = pasillos.map((p, i) => ({ ...p, i })).filter(p => p.tipo === tipo)
    if (!suyos.length) continue
    const sitios = suyos.flatMap(p => sitiosDePasillo(p.i, pasillos.length))
    let cursor = 0
    for (const s of lista.filter(x => x.pasillo === tipo)) {
      for (let k = 0; k < s.modulos && cursor < sitios.length; k++) {
        mapa.push({ id: `auto-${s.id}-${k}`, ...sitios[cursor++], seccion: s.id, color: COLOR_MADERA, alto: MUEBLE.alto, baldas: MUEBLE.baldas })
      }
    }
    // Lo que sobra de la fila se deja como estantería vacía: así el pasillo se
    // ve completo y hay sitio para crecer.
    while (cursor < sitios.length) mapa.push({ id: `auto-${tipo}-libre-${cursor}`, ...sitios[cursor++], seccion: null, color: COLOR_MADERA, alto: MUEBLE.alto, baldas: MUEBLE.baldas })
  }
  return mapa
}

// --------------------------------------------------------------- construir

export interface Biblioteca {
  secciones: Seccion[]
  muebles: Mueble[]
  huecos: Hueco[]
  sobran: Record<string, Libro[]>
  libres: number
  manual: boolean
}

function ordenBaldas(alto: number, baldas: number) {
  const paso = (alto - MUEBLE.tabla) / baldas
  return Array.from({ length: baldas }, (_, i) => i).sort((a, b) => Math.abs((a + 0.5) * paso - ALTURA_OJOS) - Math.abs((b + 0.5) * paso - ALTURA_OJOS))
}

export function construir(libros: Libro[], config: Config, colorDe: (l: Libro) => string, expuestos: Set<string> = new Set()): Biblioteca {
  const lista = secciones(libros, config, expuestos)
  const manual = !!config.mapa
  if (manual) SALA.ancho = ANCHO_MINIMO
  const mapa = config.mapa?.muebles ?? mapaAutomatico(lista)
  const muebles: Mueble[] = []
  const huecos: Hueco[] = []
  const sobran: Record<string, Libro[]> = {}
  const usados = new Set<string>()

  for (const s of lista) {
    const cola = ordenar(s.libros, s.criterio, colorDe)
    const suyos = mapa.filter(m => m.seccion === s.id)
    let i = 0
    suyos.forEach((mm, indice) => {
      usados.add(mm.id)
      const m: Mueble = { ...mm, seccion: s.id, indice }
      muebles.push(m)
      const cos = Math.cos(m.giro), sin = Math.sin(m.giro)
      const paso = (m.alto - MUEBLE.tabla) / m.baldas
      for (const balda of ordenBaldas(m.alto, m.baldas)) {
        if (i >= cola.length) break
        const suelo = balda * paso + MUEBLE.tabla
        const hueco = paso - MUEBLE.tabla
        let x = -UTIL / 2
        while (i < cola.length) {
          const libro = cola[i]
          const expuesto = expuestos.has(libro.id)
          const g = grosorLibro(libro)
          const fondo = fondoLibro(libro)
          const alto = altoLibro(libro)
          if (alto > hueco - 0.005) break
          const ocupa = expuesto ? fondo + 0.01 : g
          if (x + ocupa > UTIL / 2) break
          const lx = x + ocupa / 2
          // De frente (exposición): la portada mira al pasillo, un poco recostada.
          const lz = expuesto ? MUEBLE.fondo / 2 - g / 2 - 0.04 : MUEBLE.fondo / 2 - fondo / 2 - 0.015
          huecos.push({
            libro,
            posicion: [m.x + lx * cos + lz * sin, suelo + alto / 2 + (expuesto ? 0.002 : 0), m.z - lx * sin + lz * cos],
            medidas: [g, alto, fondo],
            giro: m.giro,
            expuesto,
            seccion: s.id,
            modulo: indice,
            balda: m.baldas - balda,
            orden: i,
          })
          x += ocupa + HOLGURA
          i++
        }
      }
    })
    if (i < cola.length) sobran[s.id] = cola.slice(i)
  }
  for (const mm of mapa) if (!usados.has(mm.id)) muebles.push({ ...mm, seccion: mm.seccion ?? '', indice: -1 })
  const libres = mapa.filter(m => !m.seccion || !lista.some(s => s.id === m.seccion)).length
  return { secciones: lista, muebles, huecos, sobran, libres, manual }
}

export function cajasDeChoque(muebles: Mueble[]): Caja[] {
  return muebles.map(m => {
    const giro = Math.abs(Math.sin(m.giro)) > 0.5
    const ax = giro ? MUEBLE.fondo / 2 : MUEBLE.ancho / 2
    const az = giro ? MUEBLE.ancho / 2 : MUEBLE.fondo / 2
    return { min: [m.x - ax, m.z - az], max: [m.x + ax, m.z + az] }
  })
}
