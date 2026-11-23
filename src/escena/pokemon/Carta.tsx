import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, DoubleSide, Group, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, Quaternion, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
import { useEstado } from '../../estado'
import type { Carta as TCarta } from '../../tipos'
import { useInspeccion } from '../inspeccion'
import { mallasLibros } from '../registro'

export const CARTA = { ancho: 0.063, alto: 0.088 }
const cargador = new TextureLoader().setCrossOrigin('anonymous')
const FRENTE = new Quaternion()
const PLANO = new PlaneGeometry(0.063, 0.088)
let DORSO: MeshStandardMaterial

let dorso: CanvasTexture | null = null
// Dorso propio (no el oficial): azul con un óvalo, para que de espaldas se
// lea "carta" sin copiar el diseño de nadie.
function texturaDorso() {
  if (dorso) return dorso
  const l = document.createElement('canvas')
  l.width = 256
  l.height = 358
  const c = l.getContext('2d')!
  const g = c.createRadialGradient(128, 179, 20, 128, 179, 220)
  g.addColorStop(0, '#3d6fd1')
  g.addColorStop(1, '#16306e')
  c.fillStyle = '#e9c34a'
  c.fillRect(0, 0, 256, 358)
  c.fillStyle = g
  c.fillRect(12, 12, 232, 334)
  c.strokeStyle = 'rgba(255,255,255,0.35)'
  c.lineWidth = 6
  c.beginPath()
  c.ellipse(128, 179, 80, 120, 0, 0, Math.PI * 2)
  c.stroke()
  c.fillStyle = '#e9c34a'
  c.font = '600 30px Poppins, sans-serif'
  c.textAlign = 'center'
  c.fillText('bibliotec.', 128, 190)
  dorso = new CanvasTexture(l)
  dorso.colorSpace = SRGBColorSpace
  return dorso
}

function texturaEtiqueta(carta: TCarta) {
  const l = document.createElement('canvas')
  l.width = 512
  l.height = 110
  const c = l.getContext('2d')!
  c.fillStyle = '#f4f1ea'
  c.fillRect(0, 0, 512, 110)
  c.fillStyle = '#c0392b'
  c.fillRect(0, 0, 512, 10)
  c.fillStyle = '#1d1a16'
  c.font = '600 30px Poppins, sans-serif'
  c.fillText(carta.nombre.toUpperCase().slice(0, 22), 18, 52)
  c.font = '400 22px Poppins, sans-serif'
  c.fillText(`${carta.set} #${carta.numero}`.slice(0, 34), 18, 88)
  c.textAlign = 'right'
  c.font = '600 54px Poppins, sans-serif'
  c.fillText(String(carta.graduada?.nota ?? ''), 494, 76)
  c.font = '600 18px Poppins, sans-serif'
  c.fillText(carta.graduada?.empresa ?? '', 494, 98)
  const t = new CanvasTexture(l)
  t.colorSpace = SRGBColorSpace
  return t
}

export interface PosicionCarta {
  posicion: [number, number, number]
  giro: [number, number, number]
}

export function Carta({ carta, sitio }: { carta: TCarta; sitio: PosicionCarta }) {
  const grupo = useRef<Group>(null!)
  const apuntado = useEstado(e => e.apuntado === carta.id)
  const abierto = useEstado(e => e.abierto === carta.id)
  const losa = !!carta.graduada
  DORSO ??= new MeshStandardMaterial({ map: texturaDorso(), roughness: 0.6 })
  const inspeccionar = useInspeccion(carta.id, grupo, FRENTE, losa ? 0.62 : 0.42)

  // Dos caras planas (frente y dorso): dos llamadas de dibujo por carta. Las
  // brillantes tienen iridiscencia: al girarlas, el brillo cambia de color.
  const frente = useMemo(() => (carta.holo
    ? new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.32, metalness: 0.25, iridescence: 0.9, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 900] })
    : new MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 })), [carta])

  useEffect(() => {
    cargador.load(`${carta.imagen}/${abierto ? 'high' : 'low'}.webp`, tex => {
      tex.colorSpace = SRGBColorSpace
      tex.anisotropy = 8
      frente.map?.dispose()
      frente.map = tex
      frente.needsUpdate = true
    })
  }, [carta, frente, abierto])

  const etiqueta = useMemo(() => (losa ? texturaEtiqueta(carta) : null), [carta, losa])

  useEffect(() => {
    const g = grupo.current
    g.traverse(o => { o.userData.id = carta.id })
    mallasLibros.set(carta.id, g)
    return () => { mallasLibros.delete(carta.id) }
  }, [carta.id])

  const posReposo = useMemo(() => new Vector3(...sitio.posicion), [sitio])
  const rotReposo = useMemo(() => {
    const g = new Group()
    g.rotation.set(...sitio.giro, 'YXZ')
    return g.quaternion.clone()
  }, [sitio])
  const normal = useMemo(() => new Vector3(0, 0, 1).applyQuaternion(rotReposo), [rotReposo])
  const listo = useRef(false)

  useFrame((_, dt) => {
    const g = grupo.current
    if (!listo.current) { listo.current = true; g.position.copy(posReposo); g.quaternion.copy(rotReposo) }
    if (inspeccionar(dt, posReposo, rotReposo)) return
    g.quaternion.copy(rotReposo)
    g.position.copy(posReposo).addScaledVector(normal, apuntado ? 0.012 : 0)
  })

  return (
    <group ref={grupo}>
      <mesh geometry={PLANO} material={frente} position={[0, 0, 0.0003]} />
      <mesh geometry={PLANO} material={DORSO} position={[0, 0, -0.0003]} rotation={[0, Math.PI, 0]} />
      {losa && (
        <>
          <mesh position={[0, 0.012, 0]}>
            <boxGeometry args={[CARTA.ancho + 0.016, CARTA.alto + 0.05, 0.008]} />
            <meshStandardMaterial color="#eef6ff" roughness={0.1} metalness={0.1} transparent opacity={0.28} depthWrite={false} side={DoubleSide} />
          </mesh>
          <mesh position={[0, CARTA.alto / 2 + 0.02, 0.0045]}>
            <planeGeometry args={[CARTA.ancho + 0.008, 0.017]} />
            <meshStandardMaterial map={etiqueta} roughness={0.6} />
          </mesh>
        </>
      )}
    </group>
  )
}
