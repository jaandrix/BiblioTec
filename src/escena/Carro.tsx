import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Group, Vector3 } from 'three'
import type { Caja } from '../tipos'
import { SALA } from './distribucion'
import { control } from './registro'

const ANCHO = 0.86
const FONDO = 0.46
const SUELO_CESTA = 0.5
const ALTO_CESTA = 0.24
const LEJOS = 0.95
const CERCA = 0.5
const RADIO = 0.36
const POR_FILA = 10

// Dos filas de diez, de pie y con el lomo hacia ti, como en un carro de biblioteca.
export function huecoCarro(indice: number, alto: number): [number, number, number] {
  const fila = Math.floor(indice / POR_FILA) % 2
  const col = indice % POR_FILA
  return [-0.34 + col * 0.075, SUELO_CESTA + alto / 2 + 0.01, -0.09 + fila * 0.17]
}

export function cartChoca(x: number, z: number, cajas: Caja[]) {
  if (Math.abs(x) > SALA.ancho / 2 - RADIO || Math.abs(z) > SALA.fondo / 2 - RADIO) return true
  return cajas.some(c => {
    const cx = Math.max(c.min[0], Math.min(x, c.max[0]))
    const cz = Math.max(c.min[1], Math.min(z, c.max[1]))
    return (x - cx) ** 2 + (z - cz) ** 2 < RADIO * RADIO
  })
}

const METAL = '#3d3a36'
const MADERA = '#a8754a'

export function Carro({ cajas }: { cajas: Caja[] }) {
  const grupo = useRef<Group>(null!)
  const dir = useMemo(() => new Vector3(), [])
  const listo = useRef(false)

  useEffect(() => {
    control.carro = grupo.current
    return () => { control.carro = null }
  }, [])

  // El carro va delante de ti; si lo que tienes delante es una estantería, se
  // acerca a tus manos en vez de meterse dentro.
  useFrame((_, dt) => {
    const cam = control.camara
    if (!cam) return
    cam.getWorldDirection(dir)
    dir.y = 0
    dir.normalize()
    let d = LEJOS
    while (d > CERCA && cartChoca(cam.position.x + dir.x * d, cam.position.z + dir.z * d, cajas)) d -= 0.05
    const x = cam.position.x + dir.x * d, z = cam.position.z + dir.z * d
    const yaw = Math.atan2(-dir.x, -dir.z)
    const g = grupo.current
    if (!listo.current) {
      listo.current = true
      g.position.set(x, 0, z)
      g.rotation.y = yaw
    }
    const k = 1 - Math.exp(-14 * dt)
    g.position.x += (x - g.position.x) * k
    g.position.z += (z - g.position.z) * k
    let delta = yaw - g.rotation.y
    delta = Math.atan2(Math.sin(delta), Math.cos(delta))
    g.rotation.y += delta * k
  })

  const postes = [-1, 1].flatMap(sx => [-1, 1].map(sz => [sx * (ANCHO / 2 - 0.02), sz * (FONDO / 2 - 0.02)] as const))
  return (
    <group ref={grupo}>
      <mesh position={[0, SUELO_CESTA - 0.015, 0]} castShadow receiveShadow>
        <boxGeometry args={[ANCHO, 0.03, FONDO]} />
        <meshStandardMaterial color={MADERA} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[ANCHO, 0.025, FONDO]} />
        <meshStandardMaterial color={MADERA} roughness={0.8} />
      </mesh>
      {[-1, 1].map(s => (
        <mesh key={`l${s}`} position={[s * (ANCHO / 2 - 0.01), SUELO_CESTA + ALTO_CESTA / 2 - 0.03, 0]} castShadow>
          <boxGeometry args={[0.02, ALTO_CESTA, FONDO]} />
          <meshStandardMaterial color={MADERA} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, SUELO_CESTA + 0.05, -FONDO / 2 + 0.01]} castShadow>
        <boxGeometry args={[ANCHO, 0.1, 0.02]} />
        <meshStandardMaterial color={MADERA} roughness={0.8} />
      </mesh>
      {postes.map(([x, z]) => (
        <group key={`${x}${z}`}>
          <mesh position={[x, (SUELO_CESTA + 0.04) / 2, z]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, SUELO_CESTA - 0.04, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[x, 0.04, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
            <meshStandardMaterial color="#1e1c1a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map(s => (
        <mesh key={`m${s}`} position={[s * (ANCHO / 2 - 0.02), SUELO_CESTA + 0.25, FONDO / 2 - 0.02]}>
          <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, SUELO_CESTA + 0.5, FONDO / 2 - 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, ANCHO, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}
