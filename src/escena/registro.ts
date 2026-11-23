import type { Mesh, Object3D, PerspectiveCamera } from 'three'
import type { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import type { Libro } from '../tipos'
import type { Biblioteca } from './distribucion'

// Lo que comparten la escena y la interfaz sin pasar por React en cada fotograma.
export const mallasLibros = new Map<string, Mesh>()
export const interactivos = new Map<string, Object3D>()
export const giroInspeccion = { x: 0, y: 0 }
export const control: {
  mando: PointerLockControls | null
  camara: PerspectiveCamera | null
  biblioteca: Biblioteca | null
  carro: Object3D | null
  todos: Libro[]
} = { mando: null, camara: null, biblioteca: null, carro: null, todos: [] }

export function entrar() {
  control.mando?.lock()
}

export function huecoDe(id: string) {
  return control.biblioteca?.huecos.find(h => h.libro.id === id) ?? null
}
