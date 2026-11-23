export type TipoMedio = 'libro' | 'pelicula' | 'serie' | 'videojuego'
export type Formato = 'dvd' | 'bluray' | '4k' | 'caja' | 'cartucho'

// "Libro" es todo lo que va de pie en una estantería: libros, películas,
// series y videojuegos. Lo que cambia entre ellos son las medidas y el lomo.
export interface Libro {
  id: string
  tipo: TipoMedio
  formato?: Formato
  plataforma?: string
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
  pasillo: 'libros' | 'películas' | 'series' | 'videojuegos'
  plataforma?: string
  criterio: Criterio
  modulos: number
  libros: Libro[]
}

// Una estantería del mapa tal como la guarda el editor.
export interface MuebleMapa {
  id: string
  x: number
  z: number
  giro: number
  seccion: string | null
  color: string
  alto: number
  baldas: number
}

export interface Mueble extends Omit<MuebleMapa, 'seccion'> {
  seccion: string
  indice: number
}

export interface Hueco {
  libro: Libro
  posicion: [number, number, number]
  medidas: [number, number, number]
  giro: number
  expuesto?: boolean
  seccion: string
  modulo: number
  balda: number
  orden: number
}

export interface Caja {
  min: [number, number]
  max: [number, number]
}

export interface Carta {
  id: string
  tipo: 'carta'
  tcgdex: string
  nombre: string
  set: string
  setId: string
  numero: string
  total: number | null
  rareza: string
  imagen: string
  holo: boolean
  estado: string
  graduada?: { empresa: string; nota: number }
}

export type FormatoSellado = 'etb' | 'media-caja' | 'caja' | 'sobre' | 'lata' | 'coleccion'

export interface Sellado {
  id: string
  tipo: 'sellado'
  formato: FormatoSellado
  nombre: string
  set: string
  setId: string
  logo: string | null
  simbolo: string | null
}

export interface CajaCartas {
  id: string
  nombre: string
  cartas: string[]
}

export type CriterioCartas = 'set' | 'nombre' | 'rareza'
