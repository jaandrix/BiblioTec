import { BoxGeometry, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Pieza = { medidas: [number, number, number]; posicion: [number, number, number] }

// Une varias cajas que comparten material en una sola geometría: un mueble
// pasa de una llamada de dibujo por tabla a una por material.
export function unirCajas(piezas: Pieza[]): BufferGeometry {
  const sueltas = piezas.map(p => new BoxGeometry(...p.medidas).translate(...p.posicion))
  const unida = mergeGeometries(sueltas, false)
  sueltas.forEach(g => g.dispose())
  return unida
}
