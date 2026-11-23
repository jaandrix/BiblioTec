import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferGeometry, CanvasTexture, Color, Group, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { CRITERIOS } from '../libros/orden'
import type { Mueble, Seccion } from '../tipos'
import { Consola } from './Consolas'
import { centroPasillo, MUEBLE, pasillosDe, SALA } from './distribucion'
import { unirCajas } from './fusionar'
import { alfombra, madera, pared, sueloMadera } from './texturas'

const MADERA = '#8a5a34'

function texturaCartel(lineas: { texto: string; peso: number; tam: number; color: string }[], ancho: number, alto: number, fondo: string) {
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')!
  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, ancho, alto)
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, ancho - 6, alto - 6)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const total = lineas.reduce((s, l) => s + l.tam * 1.25, 0)
  let y = alto / 2 - total / 2
  for (const l of lineas) {
    ctx.font = `${l.peso} ${l.tam}px Poppins, sans-serif`
    ctx.fillStyle = l.color
    y += l.tam * 0.625
    ctx.fillText(l.texto, ancho / 2, y)
    y += l.tam * 0.625
  }
  const t = new CanvasTexture(lienzo)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

function Cartel({ seccion, alto, ancho }: { seccion: Seccion; alto: number; ancho: number }) {
  const criterio = CRITERIOS.find(c => c.id === seccion.criterio)?.nombre ?? seccion.criterio
  const textura = useMemo(
    () => texturaCartel([
      { texto: `${seccion.nombre}.`, peso: 600, tam: 64, color: '#2a1d12' },
      { texto: `por ${criterio}.`, peso: 400, tam: 36, color: '#7a5636' },
    ], 512, 180, '#f3e6cf'),
    [seccion.nombre, criterio],
  )
  const x = seccion.plataforma ? -0.2 : 0
  return (
    <mesh position={[x, alto + 0.16, MUEBLE.fondo / 2 - 0.01]}>
      <planeGeometry args={[ancho, ancho * 0.35]} />
      <meshStandardMaterial map={textura} roughness={0.9} />
    </mesh>
  )
}

// Las estanterías del mismo alto y número de baldas comparten geometría, y
// las del mismo color comparten materiales: tres piezas por estantería.
const geometrias = new Map<string, { lados: BufferGeometry; fondo: BufferGeometry; baldas: BufferGeometry }>()
const materiales = new Map<string, { lados: MeshStandardMaterial; fondo: MeshStandardMaterial; baldas: MeshStandardMaterial }>()

function geometriaEstanteria(alto: number, baldas: number) {
  const clave = `${alto}-${baldas}`
  if (!geometrias.has(clave)) {
    const t = MUEBLE.tabla
    const paso = (alto - t) / baldas
    geometrias.set(clave, {
      lados: unirCajas([-1, 1].map(lado => ({ medidas: [t, alto, MUEBLE.fondo], posicion: [lado * (MUEBLE.ancho / 2 - t / 2), alto / 2, 0] }))),
      fondo: unirCajas([{ medidas: [MUEBLE.ancho - 2 * t, alto, 0.012], posicion: [0, alto / 2, -MUEBLE.fondo / 2 + 0.006] }]),
      baldas: unirCajas([
        ...Array.from({ length: baldas + 1 }, (_, i) => ({ medidas: [MUEBLE.ancho - 2 * t, t, MUEBLE.fondo] as [number, number, number], posicion: [0, i * paso + t / 2, 0] as [number, number, number] })),
        { medidas: [MUEBLE.ancho, 0.05, MUEBLE.fondo + 0.02], posicion: [0, alto + 0.025, 0.005] },
        { medidas: [MUEBLE.ancho - 2 * t, 0.08, 0.015], posicion: [0, 0.04, MUEBLE.fondo / 2 - 0.0075] },
      ]),
    })
  }
  return geometrias.get(clave)!
}

function oscurecer(hex: string, k: number) {
  return '#' + new Color(hex).multiplyScalar(k).getHexString()
}

function materialesEstanteria(color: string) {
  if (!materiales.has(color)) {
    const esMadera = color === MADERA
    materiales.set(color, {
      lados: new MeshStandardMaterial(esMadera ? { map: madera(MADERA, false), roughness: 0.72 } : { color, roughness: 0.55 }),
      fondo: new MeshStandardMaterial(esMadera ? { map: madera('#7a4e2c', false), roughness: 0.9 } : { color: oscurecer(color, 0.82), roughness: 0.7 }),
      baldas: new MeshStandardMaterial(esMadera ? { map: madera('#a8754a'), roughness: 0.65 } : { color: oscurecer(color, 1.08), roughness: 0.5 }),
    })
  }
  return materiales.get(color)!
}

function Estanteria({ m, seccion }: { m: Mueble; seccion?: Seccion }) {
  const g = geometriaEstanteria(m.alto, m.baldas)
  const mat = materialesEstanteria(m.color)
  const grupo = useRef<Group>(null!)
  const crecer = useRef(0)
  const colocado = useRef(false)

  // Una estantería nueva sube desde el suelo; una que cambia de sitio se
  // desliza a la vez que sus libros. Quieta, no hace nada.
  useFrame((_, dt) => {
    const o = grupo.current
    if (!colocado.current) {
      colocado.current = true
      o.position.set(m.x, 0, m.z)
      o.rotation.y = m.giro
    }
    const dx = m.x - o.position.x, dz = m.z - o.position.z, dg = m.giro - o.rotation.y
    if (crecer.current >= 1 && Math.abs(dx) + Math.abs(dz) + Math.abs(dg) < 1e-4) return
    const k = 1 - Math.exp(-6 * dt)
    o.position.x += dx * k
    o.position.z += dz * k
    o.rotation.y += dg * k
    if (crecer.current < 1) {
      crecer.current = Math.min(1, crecer.current + dt / 0.6)
      o.scale.set(1, Math.max(0.001, 1 - (1 - crecer.current) ** 3), 1)
    }
  })

  return (
    <group ref={grupo} scale={[1, 0.001, 1]}>
      <mesh geometry={g.lados} material={mat.lados} castShadow receiveShadow />
      <mesh geometry={g.fondo} material={mat.fondo} receiveShadow />
      <mesh geometry={g.baldas} material={mat.baldas} castShadow receiveShadow />
      {m.indice === 0 && seccion && <Cartel seccion={seccion} alto={m.alto + 0.05} ancho={seccion.plataforma ? 0.55 : 0.8} />}
      {m.indice === 0 && seccion?.plataforma && <Consola plataforma={seccion.plataforma} posicion={[0.28, m.alto + 0.05, 0]} />}
    </group>
  )
}

function RotuloPasillo({ texto, x }: { texto: string; x: number }) {
  const textura = useMemo(() => texturaCartel([{ texto: `${texto}.`, peso: 600, tam: 110, color: '#f6efe3' }], 768, 200, '#3a2a1e'), [texto])
  return (
    <group position={[x, SALA.alto - 0.38, 0.55]}>
      {[-0.45, 0.45].map(dx => (
        <mesh key={dx} position={[dx, 0.24, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
          <meshStandardMaterial color="#2a2018" />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[1.2, 0.3, 0.03]} />
        <meshStandardMaterial color="#3a2a1e" />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[1.2, 0.3]} />
        <meshStandardMaterial map={textura} />
      </mesh>
    </group>
  )
}

// Luz de las ventanas según la hora real: día claro, atardecer naranja, noche azul.
function cieloAhora() {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  if (h >= 8 && h < 18) return '#cfe6ff'
  if ((h >= 18 && h < 21) || (h >= 6 && h < 8)) return '#ffb36b'
  return '#3b4f7a'
}

function Ventanas() {
  const cielo = useMemo(cieloAhora, [])
  return (
    <>
      {[-3.5, -1.2].map(x => (
        <group key={x} position={[x, 1.85, -SALA.fondo / 2 + 0.02]}>
          <mesh>
            <planeGeometry args={[1.4, 1.2]} />
            <meshBasicMaterial color={cielo} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.03]} geometry={MARCO} material={M_MARCO} />
        </group>
      ))}
    </>
  )
}
const MARCO = unirCajas([[0, 0.62, 1.52, 0.08], [0, -0.62, 1.52, 0.1], [0.72, 0, 0.08, 1.3], [-0.72, 0, 0.08, 1.3], [0, 0, 0.04, 1.2], [0, 0, 1.4, 0.04]]
  .map(([px, py, w, h]) => ({ medidas: [w, h, 0.06] as [number, number, number], posicion: [px, py, 0] as [number, number, number] })))
const M_MARCO = new MeshStandardMaterial({ color: '#f4ece0', roughness: 0.6 })

export function Sala({ muebles, secciones, manual }: { muebles: Mueble[]; secciones: Seccion[]; manual: boolean }) {
  const { ancho, fondo, alto } = SALA
  const pasillos = pasillosDe(secciones)
  const centros = pasillos.map((_, i) => centroPasillo(i, pasillos.length))
  // Tres luces repartidas por la sala, sea cual sea su ancho.
  const luces = [centros[0] ?? -3, centros[Math.floor(centros.length / 2)] ?? 0, centros[centros.length - 1] ?? 3]
  return (
    <>
      <color attach="background" args={['#2a221c']} />
      <hemisphereLight args={['#fff1dc', '#8a6446', 0.9]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.2}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {/* Lámparas sobre cada pasillo; solo tres dan luz de verdad: cada luz
          encarece todos los píxeles de la escena. */}
      {(centros.length ? centros : [-3.9, -1.3, 1.3, 3.9]).flatMap(x => [-3.3, -0.8].map(z => (
        <group key={`${x}${z}`} position={[x, alto - 0.05, z]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.24, 0.1, 12]} />
            <meshStandardMaterial color="#fff4dc" emissive="#ffd9a0" emissiveIntensity={1.2} />
          </mesh>
        </group>
      )))}
      {[...new Set(luces)].map((x, i) => <pointLight key={x} position={[x, alto - 0.2, i % 2 ? -3.3 : -0.8]} intensity={2.4} distance={7.5} decay={1.5} color="#ffd9a0" />)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ancho, fondo]} />
        <meshStandardMaterial map={sueloMadera([ancho / 3, fondo / 3])} roughness={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0.004, 3.4]} receiveShadow>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial map={alfombra()} roughness={1} />
      </mesh>
      <mesh geometry={vigas(ancho)} material={M_VIGA} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, alto, 0]}>
        <planeGeometry args={[ancho, fondo]} />
        <meshStandardMaterial color="#e9dfcf" roughness={1} />
      </mesh>
      {[
        { p: [0, alto / 2, -fondo / 2], r: 0, a: ancho },
        { p: [0, alto / 2, fondo / 2], r: Math.PI, a: ancho },
        { p: [-ancho / 2, alto / 2, 0], r: Math.PI / 2, a: fondo },
        { p: [ancho / 2, alto / 2, 0], r: -Math.PI / 2, a: fondo },
      ].map((w, i) => (
        <group key={i} position={w.p as [number, number, number]} rotation={[0, w.r, 0]}>
          <mesh receiveShadow>
            <planeGeometry args={[w.a, alto]} />
            <meshStandardMaterial map={pared([w.a / 2, alto / 2])} roughness={1} />
          </mesh>
          <mesh geometry={zocalo(w.a)} material={M_ZOCALO} position={[0, -alto / 2, 0.01]} />
        </group>
      ))}
      {!manual && pasillos.map((p, i) => <RotuloPasillo key={p.nombre} texto={p.nombre} x={centros[i]} />)}
      <Ventanas />
      {muebles.map(m => <Estanteria key={m.id} m={m} seccion={secciones.find(s => s.id === m.seccion)} />)}
    </>
  )
}

const vigasCache = new Map<number, BufferGeometry>()
function vigas(ancho: number) {
  if (!vigasCache.has(ancho)) vigasCache.set(ancho, unirCajas([-3, 0, 3].map(z => ({ medidas: [ancho, 0.18, 0.22] as [number, number, number], posicion: [0, SALA.alto - 0.09, z] as [number, number, number] }))))
  return vigasCache.get(ancho)!
}
const M_VIGA = new MeshStandardMaterial({ map: madera('#6e4a2c'), roughness: 0.8 })
const M_ZOCALO = new MeshStandardMaterial({ color: MADERA, roughness: 0.8 })
const zocalos = new Map<number, BufferGeometry>()
function zocalo(ancho: number) {
  if (!zocalos.has(ancho)) zocalos.set(ancho, unirCajas([
    { medidas: [ancho, 0.12, 0.02], posicion: [0, 0.06, 0] },
    { medidas: [ancho, 0.04, 0.02], posicion: [0, 0.9, 0] },
  ]))
  return zocalos.get(ancho)!
}
