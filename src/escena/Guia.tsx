import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { AdditiveBlending, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { leerEstado } from '../estado'
import { control, mallasLibros } from './registro'

const ALTO = 2.6
const tmp = new Vector3()

// Columna de luz sobre el libro que buscas desde el ordenador. Se esconde al
// llegar a su lado (el libro sigue brillando hasta que lo sacas).
export function Guia() {
  const columna = useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    const { guia } = leerEstado()
    const malla = guia ? mallasLibros.get(guia) : null
    const c = columna.current
    c.visible = !!malla
    if (!malla || !control.camara) return
    malla.getWorldPosition(tmp)
    c.position.set(tmp.x, ALTO / 2, tmp.z)
    ;(c.material as MeshBasicMaterial).opacity = 0.34 + 0.12 * Math.sin(clock.elapsedTime * 3)
    const cam = control.camara.position
    if (Math.hypot(cam.x - tmp.x, cam.z - tmp.z) < 1.2) c.visible = false
  })
  return (
    <mesh ref={columna} visible={false}>
      <cylinderGeometry args={[0.09, 0.09, ALTO, 16, 1, true]} />
      <meshBasicMaterial color="#ffc46b" transparent opacity={0.2} blending={AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}
