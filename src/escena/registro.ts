import type { Mesh, PerspectiveCamera } from 'three'
import type { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

// Lo que comparten la escena y la interfaz sin pasar por React en cada fotograma.
export const mallasLibros = new Map<string, Mesh>()
export const giroInspeccion = { x: 0, y: 0 }
export const control: { mando: PointerLockControls | null; camara: PerspectiveCamera | null } = { mando: null, camara: null }

export function entrar() {
  control.mando?.lock()
}
