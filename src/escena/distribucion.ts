import type { Caja, Hueco, Libro } from '../tipos'

export const SALA = { ancho: 12, fondo: 9, alto: 3.2 }
export const MUEBLE = { ancho: 1, alto: 2.1, fondo: 0.34, baldas: 5, tabla: 0.025 }
const PROFUNDIDAD_LIBRO = 0.15
const HOLGURA = 0.004

export interface Mueble {
  id: string
  x: number
  z: number
  giro: number
}

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

// Una fila contra la pared del fondo y una isla central de dos caras: así la
// sala ya se lee como pasillo aunque la isla esté vacía en la fase 1.
export function muebles(): Mueble[] {
  const lista: Mueble[] = []
  const zFondo = -SALA.fondo / 2 + MUEBLE.fondo / 2 + 0.02
  for (let i = 0; i < 5; i++) lista.push({ id: `fondo-${i}`, x: (i - 2) * MUEBLE.ancho, z: zFondo, giro: 0 })
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * MUEBLE.ancho
    lista.push({ id: `isla-a-${i}`, x, z: -0.2 - MUEBLE.fondo / 2, giro: Math.PI })
    lista.push({ id: `isla-b-${i}`, x, z: -0.2 + MUEBLE.fondo / 2, giro: 0 })
  }
  return lista
}

export function colocarLibros(libros: Libro[], lista: Mueble[]): Hueco[] {
  const huecos: Hueco[] = []
  const util = MUEBLE.ancho - 2 * MUEBLE.tabla - 0.02
  const paso = (MUEBLE.alto - MUEBLE.tabla) / MUEBLE.baldas
  let i = 0
  // Se empieza por el mueble central: con pocos libros, la balda llena queda delante al entrar.
  const fondo = lista.filter(m => m.id.startsWith('fondo')).sort((a, b) => Math.abs(a.x) - Math.abs(b.x) || a.x - b.x)
  for (const m of fondo) {
    for (let balda = MUEBLE.baldas - 1; balda >= 0 && i < libros.length; balda--) {
      const suelo = balda * paso + MUEBLE.tabla
      let x = m.x - util / 2
      while (i < libros.length) {
        const libro = libros[i]
        const g = grosorLibro(libro)
        if (x + g > m.x + util / 2) break
        const alto = altoLibro(libro)
        huecos.push({
          libro,
          posicion: [x + g / 2, suelo + alto / 2, m.z + MUEBLE.fondo / 2 - PROFUNDIDAD_LIBRO / 2 - 0.015],
          medidas: [g, alto, PROFUNDIDAD_LIBRO],
        })
        x += g + HOLGURA
        i++
      }
    }
  }
  return huecos
}

export function cajasDeChoque(lista: Mueble[]): Caja[] {
  return lista.map(m => ({
    min: [m.x - MUEBLE.ancho / 2, m.z - MUEBLE.fondo / 2],
    max: [m.x + MUEBLE.ancho / 2, m.z + MUEBLE.fondo / 2],
  }))
}
