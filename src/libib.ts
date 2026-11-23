import type { Libro, TipoMedio } from './tipos'

// Importador del CSV que exporta Libib (Ajustes, exportar, una biblioteca por
// archivo). Las columnas de Libib son en inglés: item_type, title, creators,
// ean_isbn13, upc_isbn10, publish_date, group, tags, notes... Se leen por su
// nombre, así que da igual el orden o que falte alguna.

export function leerCsv(texto: string): Record<string, string>[] {
  const filas: string[][] = []
  let fila: string[] = [], campo = '', comillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++ }
      else if (c === '"') comillas = false
      else campo += c
    } else if (c === '"') comillas = true
    else if (c === ',' || c === ';' && !texto.slice(0, 200).includes(',')) { fila.push(campo); campo = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(campo); campo = ''
      if (fila.some(x => x.trim())) filas.push(fila)
      fila = []
    } else campo += c
  }
  fila.push(campo)
  if (fila.some(x => x.trim())) filas.push(fila)
  const [cabecera = [], ...resto] = filas
  const claves = cabecera.map(h => h.trim().toLowerCase().replace(/^﻿/, ''))
  return resto.map(f => Object.fromEntries(claves.map((k, i) => [k, (f[i] ?? '').trim()])))
}

const TIPOS: [RegExp, TipoMedio][] = [
  [/book|libro|comic|manga/i, 'libro'],
  [/movie|film|pel[ií]cula|dvd|blu/i, 'pelicula'],
  [/tv|series|serie/i, 'serie'],
  [/game|juego|video ?game/i, 'videojuego'],
]

const CONSOLAS: [RegExp, string][] = [
  [/xbox ?360|x360/i, 'xbox 360'],
  [/xbox ?one|series ?[xs]|\bxbox\b/i, 'xbox'],
  [/switch/i, 'switch'],
  [/\b3ds\b/i, '3ds'],
  [/\bnds\b|nintendo ds|\bds\b/i, 'ds'],
  [/\bwii\b/i, 'wii'],
  [/ps[1-5]|playstation/i, 'ps'],
]

export function consolaDe(texto: string) {
  return CONSOLAS.find(([re]) => re.test(texto))?.[1] ?? null
}

const campo = (f: Record<string, string>, ...nombres: string[]) => nombres.map(n => f[n]).find(v => v) ?? ''

export interface ResultadoLibib {
  libros: Libro[]
  sinConsola: number
}

export function deLibib(filas: Record<string, string>[], consolaPorDefecto: string | null): ResultadoLibib {
  let sinConsola = 0
  const hoy = new Date().toLocaleDateString('sv-SE')
  const libros = filas.filter(f => campo(f, 'title', 'titulo', 'título')).map((f, i) => {
    const titulo = campo(f, 'title', 'titulo', 'título')
    const tipoTexto = campo(f, 'item_type', 'type', 'tipo')
    const tipo = TIPOS.find(([re]) => re.test(tipoTexto))?.[1] ?? 'libro'
    const autor = campo(f, 'creators', 'author', 'authors', 'autor') || [f.first_name, f.last_name].filter(Boolean).join(' ')
    const isbn = campo(f, 'ean_isbn13', 'upc_isbn10', 'isbn').replace(/[^0-9xX]/g, '')
    const anio = Number(campo(f, 'publish_date', 'year', 'release_date').slice(0, 4)) || null
    const grupo = campo(f, 'group', 'tags', 'shelf', 'collection')
    let plataforma: string | undefined
    if (tipo === 'videojuego') {
      plataforma = consolaDe(Object.values(f).join(' ')) ?? consolaPorDefecto ?? undefined
      if (!plataforma) sinConsola++
    }
    const libro: Libro = {
      id: `libib_${tipo}_${isbn || titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}_${i}`,
      tipo,
      titulo,
      autor: tipo === 'libro' ? autor.split(/[;,]/)[0].trim() : '',
      anio,
      paginas: Number(campo(f, 'length', 'pages')) || null,
      // Open Library tiene portada por ISBN sin necesidad de buscar.
      portada: tipo === 'libro' && isbn.length >= 10 ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : null,
      genero: tipo === 'libro' ? (grupo.split(/[;,]/)[0].trim().toLowerCase() || 'sin clasificar') : undefined,
      formato: tipo === 'videojuego' ? 'caja' : tipo === 'libro' ? undefined : /blu/i.test(Object.values(f).join(' ')) ? 'bluray' : 'dvd',
      ...(plataforma ? { plataforma } : {}),
      alta: hoy,
    }
    return libro
  })
  return { libros, sinConsola }
}
