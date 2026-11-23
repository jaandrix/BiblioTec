export interface Libro {
  id: string
  tipo: 'libro'
  titulo: string
  autor: string
  anio: number | null
  paginas: number | null
  portada: string | null
  saga?: string
  tomo?: number
  ubicacion?: string
}

export interface Hueco {
  libro: Libro
  posicion: [number, number, number]
  medidas: [number, number, number]
}

export interface Caja {
  min: [number, number]
  max: [number, number]
}
