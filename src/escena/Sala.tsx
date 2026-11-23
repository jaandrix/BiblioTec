import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CanvasTexture, Group, SRGBColorSpace } from 'three'
import { CRITERIOS } from '../libros/orden'
import type { Mueble, Seccion } from '../tipos'
import { ISLA_Z, MUEBLE, SALA } from './distribucion'
import { alfombra, madera, pared, sueloMadera } from './texturas'

const MADERA = '#8a5a34'
const MADERA_CLARA = '#a8754a'

function texturaCartel(lineas: { texto: string; peso: number; tam: number; color: string }[], ancho: number, alto: number, fondo: string) {
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')!
  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, ancho, alto)
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

function Cartel({ seccion }: { seccion: Seccion }) {
  const criterio = CRITERIOS.find(c => c.id === seccion.criterio)?.nombre ?? seccion.criterio
  const textura = useMemo(
    () => texturaCartel([
      { texto: `${seccion.nombre}.`, peso: 600, tam: 64, color: '#2a1d12' },
      { texto: `por ${criterio}.`, peso: 400, tam: 36, color: '#7a5636' },
    ], 512, 180, '#f3e6cf'),
    [seccion.nombre, criterio],
  )
  return (
    <mesh position={[0, MUEBLE.alto + 0.16, MUEBLE.fondo / 2 - 0.02]} castShadow>
      <boxGeometry args={[0.8, 0.28, 0.02]} />
      <meshStandardMaterial attach="material-0" color={MADERA} />
      <meshStandardMaterial attach="material-1" color={MADERA} />
      <meshStandardMaterial attach="material-2" color={MADERA} />
      <meshStandardMaterial attach="material-3" color={MADERA} />
      <meshStandardMaterial attach="material-4" map={textura} roughness={0.9} />
      <meshStandardMaterial attach="material-5" color={MADERA} />
    </mesh>
  )
}

function Estanteria({ m, seccion }: { m: Mueble; seccion?: Seccion }) {
  const grupo = useRef<Group>(null!)
  const crecer = useRef(0)
  const paso = (MUEBLE.alto - MUEBLE.tabla) / MUEBLE.baldas
  const t = MUEBLE.tabla

  const colocado = useRef(false)

  // Un mueble nuevo (al ampliar) sube desde el suelo; uno que se corre de sitio
  // porque otro creció se desliza a la vez que sus libros.
  useFrame((_, dt) => {
    const g = grupo.current
    if (!colocado.current) {
      colocado.current = true
      g.position.set(m.x, 0, m.z)
      g.rotation.y = m.giro
    }
    const k = 1 - Math.exp(-6 * dt)
    g.position.x += (m.x - g.position.x) * k
    g.position.z += (m.z - g.position.z) * k
    g.rotation.y += (m.giro - g.rotation.y) * k
    if (crecer.current >= 1) return
    crecer.current = Math.min(1, crecer.current + dt / 0.6)
    const p = 1 - (1 - crecer.current) ** 3
    g.scale.set(1, Math.max(0.001, p), 1)
  })

  return (
    <group ref={grupo} scale={[1, 0.001, 1]}>
      {[-1, 1].map(lado => (
        <mesh key={lado} position={[lado * (MUEBLE.ancho / 2 - t / 2), MUEBLE.alto / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, MUEBLE.alto, MUEBLE.fondo]} />
          <meshStandardMaterial map={madera(MADERA, false)} roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[0, MUEBLE.alto / 2, -MUEBLE.fondo / 2 + 0.006]} receiveShadow>
        <boxGeometry args={[MUEBLE.ancho - 2 * t, MUEBLE.alto, 0.012]} />
        <meshStandardMaterial map={madera('#7a4e2c', false)} roughness={0.9} />
      </mesh>
      {Array.from({ length: MUEBLE.baldas + 1 }, (_, i) => (
        <mesh key={i} position={[0, i * paso + t / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[MUEBLE.ancho - 2 * t, t, MUEBLE.fondo]} />
          <meshStandardMaterial map={madera(MADERA_CLARA)} roughness={0.7} />
        </mesh>
      ))}
      {m.indice === 0 && seccion && <Cartel seccion={seccion} />}
    </group>
  )
}

function Rotulo() {
  const textura = useMemo(
    () => texturaCartel([{ texto: 'libros.', peso: 600, tam: 120, color: '#f6efe3' }], 768, 200, '#3a2a1e'),
    [],
  )
  return (
    <group position={[0, SALA.alto - 0.55, ISLA_Z + 0.4]}>
      {[-0.7, 0.7].map(x => (
        <mesh key={x} position={[x, 0.32, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.5, 6]} />
          <meshStandardMaterial color="#2a2018" />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[1.9, 0.5, 0.03]} />
        <meshStandardMaterial attach="material-0" color="#3a2a1e" />
        <meshStandardMaterial attach="material-1" color="#3a2a1e" />
        <meshStandardMaterial attach="material-2" color="#3a2a1e" />
        <meshStandardMaterial attach="material-3" color="#3a2a1e" />
        <meshStandardMaterial attach="material-4" map={textura} />
        <meshStandardMaterial attach="material-5" color="#3a2a1e" />
      </mesh>
    </group>
  )
}

// Luz de las ventanas según la hora real: día claro, atardecer naranja, noche azul.
function cieloAhora() {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  if (h >= 8 && h < 18) return { color: '#cfe6ff', fuerza: 2.2 }
  if ((h >= 18 && h < 21) || (h >= 6 && h < 8)) return { color: '#ffb36b', fuerza: 1.8 }
  return { color: '#3b4f7a', fuerza: 0.9 }
}

function Ventanas() {
  const cielo = useMemo(cieloAhora, [])
  const x = SALA.ancho / 2 - 0.02
  return (
    <>
      {[-2.6, 1.2].map(z => (
        <group key={z} position={[x, 1.75, z]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <planeGeometry args={[1.5, 1.4]} />
            <meshBasicMaterial color={cielo.color} toneMapped={false} />
          </mesh>
          {[[0, 0.72, 1.62, 0.08], [0, -0.72, 1.62, 0.1], [0.77, 0, 0.08, 1.5], [-0.77, 0, 0.08, 1.5], [0, 0, 0.04, 1.4], [0, 0, 1.5, 0.04]].map(([px, py, w, h], i) => (
            <mesh key={i} position={[px, py, 0.03]}>
              <boxGeometry args={[w, h, 0.06]} />
              <meshStandardMaterial color="#f4ece0" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

export function Sala({ muebles, secciones }: { muebles: Mueble[]; secciones: Seccion[] }) {
  const { ancho, fondo, alto } = SALA
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
      {/* Seis lámparas a la vista, pero solo tres dan luz: cada luz encarece
          todos los píxeles de la escena. */}
      {[-3, 0, 3].flatMap(x => [-3.4, 1.2].map(z => (
        <group key={`${x}${z}`} position={[x, alto - 0.05, z]}>
          {z > 0 === (x === 0) && <pointLight intensity={2.2} distance={7} decay={1.5} color="#ffd9a0" />}
          <mesh>
            <cylinderGeometry args={[0.18, 0.24, 0.1, 12]} />
            <meshStandardMaterial color="#fff4dc" emissive="#ffd9a0" emissiveIntensity={1.2} />
          </mesh>
        </group>
      )))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ancho, fondo]} />
        <meshStandardMaterial map={sueloMadera([ancho / 3, fondo / 3])} roughness={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0.004, 3.4]} receiveShadow>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial map={alfombra()} roughness={1} />
      </mesh>
      {[-3, 0, 3].map(z => (
        <mesh key={z} position={[0, alto - 0.09, z]} castShadow>
          <boxGeometry args={[ancho, 0.18, 0.22]} />
          <meshStandardMaterial map={madera('#6e4a2c')} roughness={0.8} />
        </mesh>
      ))}
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
          <mesh position={[0, 0.9 - alto / 2, 0.012]}>
            <boxGeometry args={[w.a, 0.04, 0.02]} />
            <meshStandardMaterial color={MADERA} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.06 - alto / 2, 0.01]}>
            <boxGeometry args={[w.a, 0.12, 0.02]} />
            <meshStandardMaterial color={MADERA} roughness={0.8} />
          </mesh>
        </group>
      ))}
      <Rotulo />
      <Ventanas />
      {muebles.map(m => <Estanteria key={m.id} m={m} seccion={secciones.find(s => s.id === m.seccion)} />)}
    </>
  )
}
