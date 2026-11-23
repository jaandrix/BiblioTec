import type { Object3D, PerspectiveCamera } from 'three'
import type { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import type { Carta, Libro } from '../tipos'
import type { Biblioteca } from './distribucion'

// Lo que comparten la escena y la interfaz sin pasar por React en cada fotograma.
// Todo lo que se puede coger para mirar: libros, cartas y producto sellado.
export const mallasLibros = new Map<string, Object3D>()
export const interactivos = new Map<string, Object3D>()
// Giro y distancia del libro que miras de cerca; `volteo` es el giro al que va
// (f le da media vuelta) y `y` lo sigue suave.
export const giroInspeccion = { x: 0, y: 0, volteo: 0, distancia: 0.42 }
// Cuando somos nosotros quienes sueltan el ratón (ordenador, menús), no es una pausa.
export const soltadoPropio = { activo: false }
export const control: {
  mando: PointerLockControls | null
  camara: PerspectiveCamera | null
  biblioteca: Biblioteca | null
  carro: Object3D | null
  todos: Libro[]
  cartas: Carta[]
} = { mando: null, camara: null, biblioteca: null, carro: null, todos: [], cartas: [] }

export function entrar() {
  control.mando?.lock()
}

export function soltar() {
  soltadoPropio.activo = true
  control.mando?.unlock()
}

export function huecoDe(id: string) {
  return control.biblioteca?.huecos.find(h => h.libro.id === id) ?? null
}
