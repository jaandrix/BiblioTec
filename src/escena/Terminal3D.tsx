import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Group, Quaternion, SRGBColorSpace, Vector3 } from 'three'
import { leerEstado } from '../estado'
import type { Caja } from '../tipos'
import { control, interactivos } from './registro'

const X = -5.55
const Z = 1.6
const ALTO_MOSTRADOR = 1.0
const PANTALLA = new Vector3(X + 0.235, ALTO_MOSTRADOR + 0.22, Z)
const VISTA = new Vector3(X + 0.95, 1.36, Z)

export const CAJA_TERMINAL: Caja = { min: [-6, Z - 0.65], max: [X + 0.45, Z + 0.65] }

function texturaPantalla(libros: number, estanterias: number) {
  const lienzo = document.createElement('canvas')
  lienzo.width = 512
  lienzo.height = 384
  const ctx = lienzo.getContext('2d')!
  ctx.fillStyle = '#031a08'
  ctx.fillRect(0, 0, 512, 384)
  ctx.fillStyle = '#39ff6a'
  ctx.shadowColor = '#39ff6a'
  ctx.shadowBlur = 8
  ctx.font = '30px VT323, monospace'
  const lineas = ['BIBLIOTEC OS v0.2', '', `LIBROS ........ ${libros}`, `ESTANTERIAS ... ${estanterias}`, '', '> HAZ CLIC PARA USAR_']
  lineas.forEach((l, i) => ctx.fillText(l, 34, 64 + i * 46))
  for (let y = 0; y < 384; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(0, y, 512, 2)
  }
  const t = new CanvasTexture(lienzo)
  t.colorSpace = SRGBColorSpace
  return t
}

export function Terminal3D({ libros, estanterias }: { libros: number; estanterias: number }) {
  const grupo = useRef<Group>(null!)
  const textura = useMemo(() => texturaPantalla(libros, estanterias), [libros, estanterias])

  useEffect(() => {
    document.fonts.load('30px VT323').then(() => {
      const nueva = texturaPantalla(libros, estanterias)
      textura.image = nueva.image
      textura.needsUpdate = true
    })
  }, [textura, libros, estanterias])

  useEffect(() => {
    grupo.current.traverse(o => { o.userData.id = 'terminal' })
    interactivos.set('terminal', grupo.current)
    return () => { interactivos.delete('terminal') }
  }, [])

  const viaje = useRef({ activo: false, t: 0, desde: new Vector3(), desdeRot: new Quaternion(), hastaRot: new Quaternion() })
  useFrame((_, dt) => {
    const cam = control.camara
    if (!cam) return
    const v = viaje.current
    const { terminal } = leerEstado()
    if (terminal && !v.activo) {
      v.activo = true
      v.t = 0
      v.desde.copy(cam.position)
      v.desdeRot.copy(cam.quaternion)
      const antes = cam.quaternion.clone()
      const pos = cam.position.clone()
      cam.position.copy(VISTA)
      cam.lookAt(PANTALLA)
      v.hastaRot.copy(cam.quaternion)
      cam.position.copy(pos)
      cam.quaternion.copy(antes)
    }
    if (!terminal) { v.activo = false; return }
    if (v.t >= 1) return
    v.t = Math.min(1, v.t + dt / 0.6)
    const p = 1 - (1 - v.t) ** 3
    cam.position.lerpVectors(v.desde, VISTA, p)
    cam.quaternion.slerpQuaternions(v.desdeRot, v.hastaRot, p)
  })

  return (
    <group>
      <mesh position={[X, ALTO_MOSTRADOR / 2, Z]} castShadow receiveShadow>
        <boxGeometry args={[0.8, ALTO_MOSTRADOR, 1.2]} />
        <meshStandardMaterial color="#6e4a2c" roughness={0.85} />
      </mesh>
      <mesh position={[X + 0.3, ALTO_MOSTRADOR + 0.015, Z]} castShadow>
        <boxGeometry args={[0.16, 0.03, 0.42]} />
        <meshStandardMaterial color="#d9cdb4" roughness={0.7} />
      </mesh>
      <group ref={grupo}>
        <mesh position={[X - 0.02, ALTO_MOSTRADOR + 0.22, Z]} castShadow>
          <boxGeometry args={[0.46, 0.42, 0.48]} />
          <meshStandardMaterial color="#e4d8bf" roughness={0.6} />
        </mesh>
        <mesh position={[X - 0.3, ALTO_MOSTRADOR + 0.2, Z]} castShadow>
          <boxGeometry args={[0.22, 0.3, 0.34]} />
          <meshStandardMaterial color="#d6c9ae" roughness={0.6} />
        </mesh>
        <mesh position={[PANTALLA.x + 0.002, PANTALLA.y, Z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.36, 0.27]} />
          <meshBasicMaterial map={textura} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
