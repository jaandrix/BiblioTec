import type { Criterio, Libro } from '../tipos'

export const CRITERIOS: { id: Criterio; nombre: string }[] = [
  { id: 'autor', nombre: 'autor' },
  { id: 'saga', nombre: 'saga' },
  { id: 'color', nombre: 'color' },
  { id: 'alfabetico', nombre: 'alfabético' },
  { id: 'anio', nombre: 'año' },
  { id: 'paginas', nombre: 'páginas' },
  { id: 'alta', nombre: 'fecha de alta' },
]

const comparar = new Intl.Collator('es', { sensitivity: 'base', numeric: true }).compare
const ARTICULOS = /^(el|la|los|las|lo|un|una|unos|unas|the|a|an)\s+/i
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'van', 'von', 'der', 'di', 'da', 'du', 'le'])

export function tituloParaOrdenar(titulo: string) {
  return titulo.trim().replace(/^[¿¡"'«(]+/, '').replace(ARTICULOS, '')
}

// Apellido sin saberlo de verdad: se quita el nombre de pila, las iniciales y
// las partículas. Acierta con "Gabriel García Márquez" (García Márquez) y con
// "J. R. R. Tolkien"; con nombres compuestos ingleses puede fallar.
export function apellidos(autor: string) {
  const partes = autor.trim().split(/\s+/)
  if (partes.length < 2) return autor.trim()
  const resto = partes.slice(1).filter(p => !/^([A-ZÁÉÍÓÚ]\.)+$/.test(p))
  while (resto.length > 1 && PARTICULAS.has(resto[0].toLowerCase())) resto.shift()
  return resto.join(' ') || partes[partes.length - 1]
}

function hexAHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

// Arcoíris por tono; los casi grises van al final, de claro a oscuro.
export function claveColor(hex: string) {
  const [h, s, l] = hexAHsl(hex)
  const gris = s < 0.18 || l < 0.1 || l > 0.92
  return gris ? 1000 + (1 - l) * 100 : (h + 15) % 360
}

const porTitulo = (a: Libro, b: Libro) => comparar(tituloParaOrdenar(a.titulo), tituloParaOrdenar(b.titulo))
const porSaga = (a: Libro, b: Libro) => (a.saga && a.saga === b.saga ? (a.tomo ?? 0) - (b.tomo ?? 0) : 0)
const nulosAlFinal = (a: number | null | undefined, b: number | null | undefined) =>
  a == null ? (b == null ? 0 : 1) : b == null ? -1 : a - b

export function ordenar(libros: Libro[], criterio: Criterio, colorDe: (l: Libro) => string = () => '#888888') {
  const fn: Record<Criterio, (a: Libro, b: Libro) => number> = {
    autor: (a, b) => comparar(apellidos(a.autor), apellidos(b.autor)) || comparar(a.autor, b.autor) || porSaga(a, b) || nulosAlFinal(a.anio, b.anio) || porTitulo(a, b),
    saga: (a, b) => {
      if (a.saga && !b.saga) return -1
      if (!a.saga && b.saga) return 1
      return comparar(a.saga ?? '', b.saga ?? '') || porSaga(a, b) || porTitulo(a, b)
    },
    color: (a, b) => claveColor(colorDe(a)) - claveColor(colorDe(b)) || porTitulo(a, b),
    alfabetico: porTitulo,
    anio: (a, b) => nulosAlFinal(a.anio, b.anio) || porTitulo(a, b),
    paginas: (a, b) => nulosAlFinal(a.paginas, b.paginas) || porTitulo(a, b),
    alta: (a, b) => comparar(b.alta ?? '', a.alta ?? '') || porTitulo(a, b),
  }
  return [...libros].sort(fn[criterio])
}
