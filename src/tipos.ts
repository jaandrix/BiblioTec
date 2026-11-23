export interface Libro {
  id: string
  tipo: 'libro'
  titulo: string
  autor: string
  anio: number | null
  paginas: number | null
  portada: string | null
  genero?: string
  alta?: string
  saga?: string
  tomo?: number
  ubicacion?: string
}

export type Criterio = 'autor' | 'saga' | 'color' | 'alfabetico' | 'anio' | 'paginas' | 'alta'

export interface Seccion {
  id: string
  nombre: string
  criterio: Criterio
  modulos: number
  libros: Libro[]
}

export interface Mueble {
  id: string
  x: number
  z: number
  giro: number
  seccion: string
  indice: number
}

export interface Hueco {
  libro: Libro
  posicion: [number, number, number]
  medidas: [number, number, number]
  giro: number
  seccion: string
  modulo: number
  balda: number
  orden: number
}

export interface Caja {
  min: [number, number]
  max: [number, number]
}
