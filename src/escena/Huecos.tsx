import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Group, InstancedMesh, Matrix4, MeshBasicMaterial, Object3D, Shape, Vector3 } from 'three'
import { leerEstado } from '../estado'
import type { Hueco } from '../tipos'
import { control, interactivos } from './registro'

const FLECHAS = 14
const PASO = 0.45

// Hueco que espera a un libro del carro: una caja de luz que late en la balda.
export function Huecos({ huecos }: { huecos: Hueco[] }) {
  const grupo = useRef<Group>(null!)
  const material = useMemo(() => new MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false }), [])

  useEffect(() => {
    interactivos.set('huecos', grupo.current)
    return () => { interactivos.delete('huecos') }
  }, [])

  const invisible = useMemo(() => new MeshBasicMaterial({ visible: false }), [])
  const flechas = useRef<Group>(null!)

  useFrame(({ clock }) => {
    material.opacity = 0.6 + 0.3 * Math.sin(clock.elapsedTime * 4)
    flechas.current.children.forEach((f, i) => {
      f.position.y = (f.userData.base as number) + Math.abs(Math.sin(clock.elapsedTime * 3 + i)) * 0.05
    })
  })

  // Lo que se apunta es más ancho que el hueco (un libro fino es difícil de
  // acertar), y encima de cada hueco flota una flecha que lo señala.
  return (
    <>
      <group ref={grupo}>
        {huecos.map(h => (
          <group key={h.libro.id} position={h.posicion} rotation={[0, h.giro - (h.expuesto ? Math.PI / 2 : 0), 0]}>
            <mesh material={material}>
              <boxGeometry args={[h.medidas[0] * 1.15, h.medidas[1] * 1.04, h.medidas[2] * 1.04]} />
            </mesh>
            <mesh material={invisible} userData={{ id: `hueco:${h.libro.id}` }} position={[0, 0.02, 0.04]}>
              <boxGeometry args={[Math.max(0.12, h.medidas[0] * 2), h.medidas[1] + 0.08, h.medidas[2] + 0.08]} />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={flechas}>
        {huecos.map(h => (
          <mesh key={h.libro.id} position={[h.posicion[0] + Math.sin(h.giro) * 0.1, h.posicion[1] + h.medidas[1] / 2 + 0.1, h.posicion[2] + Math.cos(h.giro) * 0.1]} rotation={[Math.PI, 0, 0]} userData={{ base: h.posicion[1] + h.medidas[1] / 2 + 0.1 }}>
            <coneGeometry args={[0.035, 0.07, 4]} />
            <meshBasicMaterial color="#ffb347" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </>
  )
}

// Flechas en el suelo hacia el hueco más cercano. Van en línea recta: con
// pocos pasillos basta, y se pueden apagar con la tecla g.
export function GuiaSuelo({ huecos }: { huecos: Hueco[] }) {
  const flechas = useRef<InstancedMesh>(null!)
  const forma = useMemo(() => {
    const s = new Shape()
    s.moveTo(0, 0.09)
    s.lineTo(0.09, -0.03)
    s.lineTo(0.045, -0.03)
    s.lineTo(0, 0.03)
    s.lineTo(-0.045, -0.03)
    s.lineTo(-0.09, -0.03)
    s.closePath()
    return s
  }, [])
  const tmp = useMemo(() => new Object3D(), [])
  const oculta = useMemo(() => new Matrix4().makeScale(0, 0, 0), [])
  const destino = useMemo(() => new Vector3(), [])

  useFrame(({ clock }) => {
    const im = flechas.current
    const cam = control.camara
    const { guiaSuelo } = leerEstado().config
    let mejor: Hueco | null = null
    let dMejor = Infinity
    if (cam && guiaSuelo) {
      for (const h of huecos) {
        const fx = h.posicion[0] + Math.sin(h.giro) * 0.7, fz = h.posicion[2] + Math.cos(h.giro) * 0.7
        const d = Math.hypot(fx - cam.position.x, fz - cam.position.z)
        if (d < dMejor) { dMejor = d; mejor = h; destino.set(fx, 0, fz) }
      }
    }
    for (let i = 0; i < FLECHAS; i++) {
      if (!mejor || !cam || dMejor < 1.2) { im.setMatrixAt(i, oculta); continue }
      const dx = destino.x - cam.position.x, dz = destino.z - cam.position.z
      const largo = Math.hypot(dx, dz)
      const avance = 0.9 + i * PASO + (clock.elapsedTime * 0.6) % PASO
      if (avance > largo) { im.setMatrixAt(i, oculta); continue }
      tmp.position.set(cam.position.x + (dx / largo) * avance, 0.012, cam.position.z + (dz / largo) * avance)
      tmp.rotation.set(-Math.PI / 2, 0, Math.atan2(-dx, -dz))
      tmp.scale.setScalar(1)
      tmp.updateMatrix()
      im.setMatrixAt(i, tmp.matrix)
    }
    im.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={flechas} args={[undefined, undefined, FLECHAS]} frustumCulled={false}>
      <shapeGeometry args={[forma]} />
      <meshBasicMaterial color="#ffb347" transparent opacity={0.75} depthWrite={false} />
    </instancedMesh>
  )
}
