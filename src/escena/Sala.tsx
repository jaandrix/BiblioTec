import { MUEBLE, SALA, type Mueble } from './distribucion'

const MADERA = '#8a5a34'
const MADERA_CLARA = '#a8754a'

function Estanteria({ m }: { m: Mueble }) {
  const paso = (MUEBLE.alto - MUEBLE.tabla) / MUEBLE.baldas
  const t = MUEBLE.tabla
  return (
    <group position={[m.x, 0, m.z]} rotation={[0, m.giro, 0]}>
      {[-1, 1].map(lado => (
        <mesh key={lado} position={[lado * (MUEBLE.ancho / 2 - t / 2), MUEBLE.alto / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, MUEBLE.alto, MUEBLE.fondo]} />
          <meshStandardMaterial color={MADERA} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, MUEBLE.alto / 2, -MUEBLE.fondo / 2 + 0.006]} receiveShadow>
        <boxGeometry args={[MUEBLE.ancho - 2 * t, MUEBLE.alto, 0.012]} />
        <meshStandardMaterial color={MADERA} roughness={0.9} />
      </mesh>
      {Array.from({ length: MUEBLE.baldas + 1 }, (_, i) => (
        <mesh key={i} position={[0, i * paso + t / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[MUEBLE.ancho - 2 * t, t, MUEBLE.fondo]} />
          <meshStandardMaterial color={MADERA_CLARA} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

export function Sala({ lista }: { lista: Mueble[] }) {
  const { ancho, fondo, alto } = SALA
  return (
    <>
      <color attach="background" args={['#2a221c']} />
      <hemisphereLight args={['#fff1dc', '#8a6446', 1.5]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.2}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {[-3, 0, 3].map(x => (
        <group key={x} position={[x, alto - 0.05, -1]}>
          <pointLight intensity={2.2} distance={6} decay={1.6} color="#ffd9a0" />
          <mesh>
            <cylinderGeometry args={[0.18, 0.24, 0.1, 12]} />
            <meshStandardMaterial color="#fff4dc" emissive="#ffd9a0" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ancho, fondo]} />
        <meshStandardMaterial color="#b88a5c" roughness={0.9} />
      </mesh>
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
            <meshStandardMaterial color="#efe4d2" roughness={1} />
          </mesh>
          <mesh position={[0, 0.06 - alto / 2, 0.01]}>
            <boxGeometry args={[w.a, 0.12, 0.02]} />
            <meshStandardMaterial color={MADERA} roughness={0.8} />
          </mesh>
        </group>
      ))}
      {lista.map(m => <Estanteria key={m.id} m={m} />)}
    </>
  )
}
