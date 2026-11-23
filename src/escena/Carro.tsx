import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BoxGeometry, BufferGeometry, CapsuleGeometry, DoubleSide, CylinderGeometry, Group, Mesh, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { leerEstado } from '../estado'
import type { Caja } from '../tipos'
import { SALA } from './distribucion'
import { control, interactivos } from './registro'
import { madera } from './texturas'

// Une piezas que comparten material (sin índices, para poder mezclar cajas,
// cilindros y cápsulas).
function unir(piezas: BufferGeometry[]) {
  const sueltas = piezas.map(g => (g.index ? g.toNonIndexed() : g))
  return mergeGeometries(sueltas, false)
}

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

const ARRIBA = new Vector3(0, 1, 0)
const ASA_Y = SUELO_CESTA + 0.5
const ASA_Z = FONDO / 2 + 0.03

// ------------------------------------------------------------------ brazos
// Del hombro (fijo a la cámara) al puño del asa, con codo, puño de la manga y
// una mano que agarra el asa con los dedos alrededor.
const M_MANGA = new MeshStandardMaterial({ color: '#3b4a68', roughness: 0.92 })
const M_PUNO = new MeshStandardMaterial({ color: '#2a3550', roughness: 0.9 })
// Doble cara: la mano izquierda es la derecha en espejo (escala negativa).
const M_PIEL = new MeshStandardMaterial({ color: '#e3b48d', roughness: 0.65, side: DoubleSide })
const G_BRAZO = new CylinderGeometry(0.052, 0.046, 1, 14)
const G_ANTEBRAZO = new CylinderGeometry(0.046, 0.04, 1, 14)
const G_CODO = new SphereGeometry(0.049, 14, 10)
const G_PUNO = new CylinderGeometry(0.044, 0.044, 0.035, 14)
const G_MANO = unir([
  trasladar(new BoxGeometry(0.07, 0.03, 0.075), 0, 0.022, -0.005),
  ...[-0.026, -0.009, 0.009, 0.026].map(x => trasladar(new CapsuleGeometry(0.0085, 0.03, 4, 8).rotateX(Math.PI / 2 - 0.5), x, 0.004, -0.04)),
  ...[-0.026, -0.009, 0.009, 0.026].map(x => trasladar(new CapsuleGeometry(0.008, 0.02, 4, 8), x, -0.018, -0.03)),
  trasladar(new CapsuleGeometry(0.009, 0.028, 4, 8).rotateZ(1.1), -0.045, 0.01, 0.0),
])

function trasladar<T extends BufferGeometry>(g: T, x: number, y: number, z: number) {
  g.translate(x, y, z)
  return g
}

function Brazo({ lado }: { lado: 1 | -1 }) {
  const brazo = useRef<Mesh>(null!)
  const antebrazo = useRef<Mesh>(null!)
  const codo = useRef<Mesh>(null!)
  const puno = useRef<Mesh>(null!)
  const mano = useRef<Mesh>(null!)
  const v = useMemo(() => ({ hombro: new Vector3(), codo: new Vector3(), mano: new Vector3(), muneca: new Vector3(), d: new Vector3() }), [])

  const unirPiezas = (m: Mesh, a: Vector3, b: Vector3) => {
    v.d.subVectors(b, a)
    const largo = v.d.length()
    m.position.addVectors(a, b).multiplyScalar(0.5)
    m.quaternion.setFromUnitVectors(ARRIBA, v.d.normalize())
    m.scale.set(1, largo, 1)
  }

  useFrame(() => {
    const cam = control.camara, carro = control.carro
    const visible = !!cam && !!carro && leerEstado().llevoCarro && !leerEstado().abierto
    for (const r of [brazo, antebrazo, codo, puno, mano]) r.current.visible = visible
    if (!visible) return
    v.hombro.set(lado * 0.24, -0.36, 0.14).applyMatrix4(cam.matrixWorld)
    v.mano.set(lado * 0.27, ASA_Y, ASA_Z)
    carro.localToWorld(v.mano)
    v.muneca.set(lado * 0.27, ASA_Y + 0.035, ASA_Z + 0.07)
    carro.localToWorld(v.muneca)
    v.codo.lerpVectors(v.hombro, v.muneca, 0.5)
    v.codo.y -= 0.09
    v.d.set(lado * 0.08, 0, 0).applyQuaternion(cam.quaternion)
    v.codo.add(v.d)
    unirPiezas(brazo.current, v.hombro, v.codo)
    unirPiezas(antebrazo.current, v.codo, v.muneca)
    codo.current.position.copy(v.codo)
    puno.current.position.copy(v.muneca)
    puno.current.quaternion.copy(antebrazo.current.quaternion)
    mano.current.position.copy(v.mano)
    mano.current.quaternion.copy(carro.quaternion)
    mano.current.scale.set(lado, 1, 1)
  })

  return (
    <>
      <mesh ref={brazo} geometry={G_BRAZO} material={M_MANGA} />
      <mesh ref={codo} geometry={G_CODO} material={M_MANGA} />
      <mesh ref={antebrazo} geometry={G_ANTEBRAZO} material={M_MANGA} />
      <mesh ref={puno} geometry={G_PUNO} material={M_PUNO} />
      <mesh ref={mano} geometry={G_MANO} material={M_PIEL} />
    </>
  )
}

export function Brazos() {
  return <><Brazo lado={1} /><Brazo lado={-1} /></>
}

// ------------------------------------------------------------------- carro
// Carro de biblioteca: dos baldas de madera con laterales, armazón de tubo
// oscuro, asa con puños de goma y cuatro ruedas con buje. Las piezas de cada
// material van unidas: cuatro llamadas de dibujo en total.
function tubo(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, r = 0.012) {
  const a = new Vector3(x1, y1, z1), b = new Vector3(x2, y2, z2)
  const d = b.clone().sub(a)
  const g = new CylinderGeometry(r, r, d.length(), 10)
  g.applyQuaternion(new Quaternion().setFromUnitVectors(ARRIBA, d.normalize()))
  const m = a.add(b).multiplyScalar(0.5)
  return g.translate(m.x, m.y, m.z)
}

const PIEZAS_CARRO = (() => {
  const madera: BufferGeometry[] = [
    trasladar(new BoxGeometry(ANCHO, 0.03, FONDO), 0, SUELO_CESTA - 0.015, 0),
    trasladar(new BoxGeometry(ANCHO, 0.025, FONDO), 0, 0.16, 0),
    ...[-1, 1].map(s => trasladar(new BoxGeometry(0.022, ALTO_CESTA, FONDO), s * (ANCHO / 2 - 0.011), SUELO_CESTA + ALTO_CESTA / 2 - 0.03, 0)),
    ...[-1, 1].map(s => trasladar(new BoxGeometry(0.022, 0.12, FONDO), s * (ANCHO / 2 - 0.011), 0.21, 0)),
    trasladar(new BoxGeometry(ANCHO, 0.11, 0.02), 0, SUELO_CESTA + 0.05, -FONDO / 2 + 0.01),
    trasladar(new BoxGeometry(ANCHO, 0.05, 0.02), 0, SUELO_CESTA + 0.02, FONDO / 2 - 0.01),
    trasladar(new BoxGeometry(ANCHO, 0.06, 0.02), 0, 0.2, -FONDO / 2 + 0.01),
  ]
  const metal: BufferGeometry[] = [
    ...[-1, 1].flatMap(sx => [-1, 1].map(sz => tubo(sx * (ANCHO / 2 - 0.02), 0.07, sz * (FONDO / 2 - 0.02), sx * (ANCHO / 2 - 0.02), SUELO_CESTA + 0.02, sz * (FONDO / 2 - 0.02)))),
    ...[-1, 1].map(s => tubo(s * (ANCHO / 2 - 0.02), SUELO_CESTA, FONDO / 2 - 0.02, s * (ANCHO / 2 - 0.02), ASA_Y - 0.02, ASA_Z, 0.013)),
    tubo(-ANCHO / 2 + 0.02, ASA_Y, ASA_Z, ANCHO / 2 - 0.02, ASA_Y, ASA_Z, 0.015),
    ...[-1, 1].flatMap(sx => [-1, 1].map(sz => trasladar(new BoxGeometry(0.03, 0.05, 0.03), sx * (ANCHO / 2 - 0.02), 0.07, sz * (FONDO / 2 - 0.02)))),
  ]
  const goma: BufferGeometry[] = [
    ...[-1, 1].flatMap(sx => [-1, 1].map(sz => trasladar(new CylinderGeometry(0.042, 0.042, 0.026, 18).rotateZ(Math.PI / 2), sx * (ANCHO / 2 - 0.02), 0.042, sz * (FONDO / 2 - 0.02)))),
    ...[-1, 1].map(s => trasladar(new CylinderGeometry(0.02, 0.02, 0.11, 12).rotateZ(Math.PI / 2), s * 0.27, ASA_Y, ASA_Z)),
  ]
  const buje: BufferGeometry[] = [-1, 1].flatMap(sx => [-1, 1].map(sz => trasladar(new CylinderGeometry(0.018, 0.018, 0.03, 12).rotateZ(Math.PI / 2), sx * (ANCHO / 2 - 0.02), 0.042, sz * (FONDO / 2 - 0.02))))
  return { madera: unir(madera), metal: unir(metal), goma: unir(goma), buje: unir(buje) }
})()
const M_MADERA_CARRO = new MeshStandardMaterial({ map: madera('#a8754a'), roughness: 0.6 })
const M_METAL = new MeshStandardMaterial({ color: '#33302c', metalness: 0.7, roughness: 0.35 })
const M_GOMA = new MeshStandardMaterial({ color: '#1a1918', roughness: 0.95 })
const M_BUJE = new MeshStandardMaterial({ color: '#b9bcc0', metalness: 0.8, roughness: 0.3 })

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
    if (!leerEstado().llevoCarro) {
      // Al empezar, el carro espera aparcado junto a la mesa de la entrada.
      if (!listo.current) { listo.current = true; grupo.current.position.set(1.75, 0, 2.55); grupo.current.rotation.y = 0.4 }
      return
    }
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

  return (
    <group ref={grupo}>
      <mesh geometry={PIEZAS_CARRO.madera} material={M_MADERA_CARRO} receiveShadow />
      <mesh geometry={PIEZAS_CARRO.metal} material={M_METAL} />
      <mesh geometry={PIEZAS_CARRO.goma} material={M_GOMA} />
      <mesh geometry={PIEZAS_CARRO.buje} material={M_BUJE} />
    </group>
  )
}
