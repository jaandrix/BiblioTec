import { useEffect, useMemo, useRef } from 'react'
import { Euler, Object3D, Quaternion, Vector3 } from 'three'
import { cambiarEstado, leerEstado, useEstado } from '../estado'
import { control, giroInspeccion } from './registro'

const curva = (t: number) => 1 - (1 - t) ** 3

// Coger un objeto para mirarlo de cerca (cartas y producto sellado; los libros
// tienen su propia versión, con el viaje desde la balda). `frente` es el giro
// que deja la cara buena mirando a la cámara; `escala` acerca los objetos
// pequeños para que llenen lo mismo que un libro.
export function useInspeccion(id: string, objeto: React.RefObject<Object3D | null>, frente: Quaternion, escala = 1) {
  const abierto = useEstado(e => e.abierto === id)
  const a = useRef({ fase: 'reposo' as 'reposo' | 'abriendo' | 'volviendo', t: 0, desdePos: new Vector3(), desdeRot: new Quaternion() })
  const tmp = useMemo(() => ({ pos: new Vector3(), rot: new Quaternion(), giro: new Quaternion(), euler: new Euler(), v: new Vector3() }), [])

  useEffect(() => {
    const o = objeto.current
    if (!o) return
    a.current.desdePos.copy(o.position)
    a.current.desdeRot.copy(o.quaternion)
    a.current.t = 0
    if (abierto) {
      a.current.fase = 'abriendo'
      if (leerEstado().guia === id) cambiarEstado({ guia: null })
    } else if (a.current.fase !== 'reposo') {
      a.current.fase = 'volviendo'
    }
  }, [abierto, id, objeto])

  // Devuelve true si se encarga del objeto este fotograma; si no, el objeto
  // está en reposo y lo coloca quien llama.
  return (dt: number, reposoPos: Vector3, reposoRot: Quaternion) => {
    const o = objeto.current
    const cam = control.camara
    const s = a.current
    if (!o || !cam || s.fase === 'reposo') return false
    if (s.fase === 'abriendo') {
      s.t = Math.min(1, s.t + dt / 0.6)
      const d = giroInspeccion.distancia * escala
      tmp.pos.copy(cam.position)
        .addScaledVector(tmp.v.set(0, 0, -1).applyQuaternion(cam.quaternion), d)
        .addScaledVector(tmp.v.set(-1, 0, 0).applyQuaternion(cam.quaternion), 0.07 * escala)
      tmp.euler.set(giroInspeccion.x, giroInspeccion.y, 0, 'XYZ')
      tmp.rot.copy(cam.quaternion).multiply(tmp.giro.setFromEuler(tmp.euler)).multiply(frente)
      const p = curva(s.t)
      o.position.lerpVectors(s.desdePos, tmp.pos, p)
      o.position.y += Math.sin(Math.PI * p) * 0.05
      o.quaternion.slerpQuaternions(s.desdeRot, tmp.rot, p)
      return true
    }
    s.t = Math.min(1, s.t + dt / 0.45)
    const p = curva(s.t)
    o.position.lerpVectors(s.desdePos, reposoPos, p)
    o.position.y += Math.sin(Math.PI * p) * 0.05
    o.quaternion.slerpQuaternions(s.desdeRot, reposoRot, p)
    if (s.t >= 1) s.fase = 'reposo'
    return true
  }
}
