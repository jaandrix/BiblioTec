import { RoundedBox } from '@react-three/drei'
import { MeshStandardMaterial } from 'three'

// Consolas de adorno encima de la estantería de sus juegos. Hechas con piezas
// sencillas y redondeadas, en estilo low-poly; se reconocen por la forma y los
// colores. Medidas reales aproximadas.

const m = (color: string, roughness = 0.45, metalness = 0.1) => new MeshStandardMaterial({ color, roughness, metalness })
const NEGRO = m('#1b1b1d', 0.35)
const PANTALLA = m('#0c0f14', 0.15, 0.3)
const BLANCO = m('#eeeeec', 0.4)
const GRIS = m('#9a9ca0', 0.4, 0.2)
const ROJO_JOY = m('#ff3c28', 0.4)
const AZUL_JOY = m('#0ab9e6', 0.4)
const VERDE_LUZ = new MeshStandardMaterial({ color: '#7cff4f', emissive: '#4cff2a', emissiveIntensity: 1.4 })
const AZUL_LUZ = new MeshStandardMaterial({ color: '#7cd6ff', emissive: '#3fb6ff', emissiveIntensity: 1.2 })

function Switch() {
  return (
    <group>
      <RoundedBox args={[0.175, 0.105, 0.055]} radius={0.008} position={[0, 0.0525, -0.01]} material={NEGRO} />
      <group position={[0, 0.11, 0.024]} rotation={[-0.08, 0, 0]}>
        <RoundedBox args={[0.172, 0.102, 0.014]} radius={0.004} material={NEGRO} />
        <mesh position={[0, 0, 0.0072]} material={PANTALLA}><planeGeometry args={[0.152, 0.086]} /></mesh>
        <RoundedBox args={[0.036, 0.102, 0.028]} radius={0.012} position={[-0.104, 0, 0.002]} material={AZUL_JOY} />
        <RoundedBox args={[0.036, 0.102, 0.028]} radius={0.012} position={[0.104, 0, 0.002]} material={ROJO_JOY} />
      </group>
    </group>
  )
}

function Portatil({ tres }: { tres: boolean }) {
  const cuerpo = tres ? m('#2a2c34', 0.3, 0.3) : BLANCO
  return (
    <group rotation={[0, -0.25, 0]}>
      <RoundedBox args={[0.134, 0.022, 0.074]} radius={0.008} position={[0, 0.011, 0]} material={cuerpo} />
      <mesh position={[0, 0.0225, 0.004]} rotation={[-Math.PI / 2, 0, 0]} material={PANTALLA}><planeGeometry args={[0.07, 0.052]} /></mesh>
      <group position={[0, 0.02, -0.036]} rotation={[-1.85, 0, 0]}>
        <RoundedBox args={[0.134, 0.074, 0.012]} radius={0.006} position={[0, 0.037, 0]} material={cuerpo} />
        <mesh position={[0, 0.037, -0.0065]} rotation={[0, Math.PI, 0]} material={PANTALLA}><planeGeometry args={[tres ? 0.096 : 0.07, 0.054]} /></mesh>
      </group>
    </group>
  )
}

function Xbox360() {
  return (
    <group rotation={[0, -0.3, 0]}>
      <RoundedBox args={[0.258, 0.083, 0.309]} radius={0.02} position={[0, 0.0415, 0]} material={BLANCO} />
      <mesh position={[0.07, 0.042, 0.1555]} material={GRIS}><boxGeometry args={[0.1, 0.008, 0.002]} /></mesh>
      <mesh position={[-0.08, 0.042, 0.156]} material={VERDE_LUZ}><torusGeometry args={[0.012, 0.002, 6, 20]} /></mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} material={GRIS}><planeGeometry args={[0.2, 0.26]} /></mesh>
    </group>
  )
}

function Wii() {
  return (
    <group>
      <RoundedBox args={[0.044, 0.157, 0.215]} radius={0.008} position={[0, 0.0785, 0]} material={BLANCO} />
      <mesh position={[0.0225, 0.12, 0.05]} material={AZUL_LUZ}><boxGeometry args={[0.002, 0.012, 0.11]} /></mesh>
    </group>
  )
}

function Playstation() {
  return (
    <group rotation={[0, -0.2, 0]}>
      <RoundedBox args={[0.275, 0.053, 0.305]} radius={0.012} position={[0, 0.0265, 0]} material={NEGRO} />
      <mesh position={[0, 0.054, 0]} material={AZUL_LUZ}><boxGeometry args={[0.27, 0.002, 0.01]} /></mesh>
    </group>
  )
}

function Mando() {
  return (
    <group rotation={[-0.2, 0.3, 0]}>
      <RoundedBox args={[0.15, 0.03, 0.07]} radius={0.014} position={[0, 0.015, 0]} material={NEGRO} />
      <RoundedBox args={[0.04, 0.03, 0.06]} radius={0.014} position={[-0.06, 0.015, 0.03]} material={NEGRO} />
      <RoundedBox args={[0.04, 0.03, 0.06]} radius={0.014} position={[0.06, 0.015, 0.03]} material={NEGRO} />
    </group>
  )
}

export function Consola({ plataforma, posicion }: { plataforma: string; posicion: [number, number, number] }) {
  return (
    <group position={posicion}>
      {plataforma === 'switch' ? <Switch />
        : plataforma === 'ds' ? <Portatil tres={false} />
          : plataforma === '3ds' ? <Portatil tres />
            : plataforma === 'xbox 360' || plataforma === 'xbox' ? <Xbox360 />
              : plataforma === 'wii' ? <Wii />
                : plataforma === 'ps' ? <Playstation />
                  : <Mando />}
    </group>
  )
}
