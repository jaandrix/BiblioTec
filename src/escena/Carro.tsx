import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Group, Mesh, Quaternion, Vector3 } from 'three'
import { leerEstado } from '../estado'
import type { Caja } from '../tipos'
import { SALA } from './distribucion'
import { control, interactivos } from './registro'

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

export function cajaCarroAparcado(): Caja {
  const c = control.carro
  if (!c) return { min: [0, 0], max: [0, 0] }
  const r = Math.max(ANCHO, FONDO) / 2
  return { min: [c.position.x - r, c.position.z - r], max: [c.position.x + r, c.position.z + r] }
}

const METAL = '#3d3a36'
const MANGA = '#34405a'
const PIEL = '#e0b08a'
const ARRIBA = new Vector3(0, 1, 0)

// Brazos en primera persona: del hombro (fijo a la cámara) a la mano, que agarra
// el asa del carro. Con un codo, para que no parezcan palos.
function Brazo({ lado }: { lado: 1 | -1 }) {
  const brazo = useRef<Mesh>(null!)
  const antebrazo = useRef<Mesh>(null!)
  const mano = useRef<Mesh>(null!)
  const v = useMemo(() => ({ hombro: new Vector3(), codo: new Vector3(), mano: new Vector3(), d: new Vector3(), q: new Quaternion() }), [])

  const unir = (m: Mesh, a: Vector3, b: Vector3) => {
    v.d.subVectors(b, a)
    const largo = v.d.length()
    m.position.addVectors(a, b).multiplyScalar(0.5)
    m.quaternion.setFromUnitVectors(ARRIBA, v.d.normalize())
    m.scale.set(1, largo, 1)
  }

  useFrame(() => {
    const cam = control.camara, carro = control.carro
    const visible = !!cam && !!carro && leerEstado().llevoCarro && !leerEstado().abierto
    brazo.current.visible = antebrazo.current.visible = mano.current.visible = visible
    if (!visible) return
    v.hombro.set(lado * 0.24, -0.34, 0.12).applyMatrix4(cam.matrixWorld)
    v.mano.set(lado * 0.27, SUELO_CESTA + 0.5, FONDO / 2 + 0.01)
    carro.localToWorld(v.mano)
    v.codo.lerpVectors(v.hombro, v.mano, 0.5)
    v.codo.y -= 0.1
    v.d.set(lado * 0.07, 0, 0).applyQuaternion(cam.quaternion)
    v.codo.add(v.d)
    unir(brazo.current, v.hombro, v.codo)
    unir(antebrazo.current, v.codo, v.mano)
    mano.current.position.copy(v.mano)
    mano.current.quaternion.copy(carro.quaternion)
  })

  return (
    <>
      <mesh ref={brazo} castShadow>
        <cylinderGeometry args={[0.05, 0.045, 1, 10]} />
        <meshStandardMaterial color={MANGA} roughness={0.85} />
      </mesh>
      <mesh ref={antebrazo} castShadow>
        <cylinderGeometry args={[0.042, 0.036, 1, 10]} />
        <meshStandardMaterial color={MANGA} roughness={0.85} />
      </mesh>
      <mesh ref={mano} castShadow>
        <boxGeometry args={[0.075, 0.06, 0.1]} />
        <meshStandardMaterial color={PIEL} roughness={0.7} />
      </mesh>
    </>
  )
}

export function Brazos() {
  return <><Brazo lado={1} /><Brazo lado={-1} /></>
}
const MADERA = '#a8754a'

export function Carro({ cajas }: { cajas: Caja[] }) {
  const grupo = useRef<Group>(null!)
  const dir = useMemo(() => new Vector3(), [])
  const listo = useRef(false)

  useEffect(() => {
    control.carro = grupo.current
    grupo.current.traverse(o => { o.userData.id = 'carro' })
    interactivos.set('carro', grupo.current)
    return () => { control.carro = null; interactivos.delete('carro') }
  }, [])

  // El carro va delante de ti; si lo que tienes delante es una estantería, se
  // acerca a tus manos en vez de meterse dentro.
  useFrame((_, dt) => {
    const cam = control.camara
    if (!cam) return
    // Aparcado se queda donde lo dejaste.
    if (listo.current && !leerEstado().llevoCarro) return
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
