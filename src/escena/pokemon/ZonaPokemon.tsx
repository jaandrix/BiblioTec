import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Group, RepeatWrapping, SRGBColorSpace } from 'three'
import { CAPACIDAD_CAJA, useEstado } from '../../estado'
import type { Caja, Carta as TCarta, CriterioCartas, Sellado } from '../../tipos'
import { interactivos } from '../registro'
import { Carta, CARTA, type PosicionCarta } from './Carta'
import { MEDIDAS_SELLADO, Sellado3D } from './Sellado3D'

// La zona Pokémon ocupa el lado izquierdo de la sala, con suelo y muebles de
// tienda (blanco y rojo) para que se lea como una tienda de cartas dentro de la
// biblioteca.
const PARED = -6
const EXPOSITOR = { x: PARED + 0.16, zs: [-2.5, -3.75], ancho: 1.2, fondo: 0.3, baldas: [0.82, 1.12, 1.42, 1.72], cajas: 0.42 }
const SELLADO = { x: PARED + 0.22, z: -0.95, ancho: 1.4, fondo: 0.42, baldas: [0.06, 0.6, 1.14] }
const VITRINA = { x: -4.7, z: -4.55, ancho: 1.4, fondo: 0.55, alto: 0.95 }
const POR_BALDA = 12
// Índices de EXPOSITOR.baldas: primero las de la altura de los ojos.
const ORDEN_BALDAS = [2, 1, 3, 0]
const BLANCO = '#f1efe9'
const ROJO = '#d0453a'

export const CAJAS_POKEMON: Caja[] = [
  { min: [PARED, EXPOSITOR.zs[1] - 0.62], max: [PARED + 0.34, EXPOSITOR.zs[0] + 0.62] },
  { min: [PARED, SELLADO.z - 0.72], max: [PARED + 0.45, SELLADO.z + 0.72] },
  { min: [VITRINA.x - VITRINA.ancho / 2, VITRINA.z - VITRINA.fondo / 2], max: [VITRINA.x + VITRINA.ancho / 2, VITRINA.z + VITRINA.fondo / 2] },
]

const RAREZAS = ['común', 'uncommon', 'poco común', 'rara', 'holo rara', 'rara doble', 'ultra rara', 'rara ilustración', 'rara ilustración especial', 'rara híper', 'rara secreta']
const rango = (r: string) => { const i = RAREZAS.findIndex(x => r.toLowerCase().startsWith(x)); return i < 0 ? 4 : i }

export function ordenarCartas(cartas: TCarta[], criterio: CriterioCartas) {
  const col = new Intl.Collator('es', { numeric: true, sensitivity: 'base' }).compare
  return [...cartas].sort((a, b) =>
    criterio === 'nombre' ? col(a.nombre, b.nombre) || col(a.setId, b.setId)
      : criterio === 'rareza' ? rango(b.rareza) - rango(a.rareza) || col(a.nombre, b.nombre)
        : col(a.setId, b.setId) || col(a.numero, b.numero))
}

// Huecos de expositor: de pie sobre un soporte, algo inclinadas hacia atrás.
function sitioExpositor(i: number): PosicionCarta | null {
  const modulo = Math.floor(i / (POR_BALDA * EXPOSITOR.baldas.length))
  if (modulo >= EXPOSITOR.zs.length) return null
  const resto = i % (POR_BALDA * EXPOSITOR.baldas.length)
  const balda = ORDEN_BALDAS[Math.floor(resto / POR_BALDA)]
  const col = resto % POR_BALDA
  // Mirando a la pared, la izquierda es +z: se lee de izquierda a derecha.
  const z = EXPOSITOR.zs[modulo] + EXPOSITOR.ancho / 2 - 0.07 - col * ((EXPOSITOR.ancho - 0.14) / (POR_BALDA - 1))
  return { posicion: [EXPOSITOR.x + 0.06, EXPOSITOR.baldas[balda] + 0.012 + CARTA.alto / 2, z], giro: [-0.2, Math.PI / 2, 0] }
}

function texturaSuelo() {
  const l = document.createElement('canvas')
  l.width = l.height = 128
  const c = l.getContext('2d')!
  c.fillStyle = '#ece6da'
  c.fillRect(0, 0, 128, 128)
  c.fillStyle = '#c9443a'
  c.fillRect(0, 0, 64, 64)
  c.fillRect(64, 64, 64, 64)
  const t = new CanvasTexture(l)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(5, 10)
  return t
}

function texturaTexto(texto: string, sub: string, fondo: string, tinta: string, ancho = 512, alto = 160) {
  const l = document.createElement('canvas')
  l.width = ancho
  l.height = alto
  const c = l.getContext('2d')!
  c.fillStyle = fondo
  c.fillRect(0, 0, ancho, alto)
  c.fillStyle = tinta
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.font = `600 ${Math.round(alto * 0.42)}px Poppins, sans-serif`
  c.fillText(texto, ancho / 2, sub ? alto * 0.4 : alto / 2)
  if (sub) {
    c.font = `400 ${Math.round(alto * 0.2)}px Poppins, sans-serif`
    c.fillText(sub, ancho / 2, alto * 0.76)
  }
  const t = new CanvasTexture(l)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

function Mueble({ x, z, ancho, fondo, alto, baldas }: { x: number; z: number; ancho: number; fondo: number; alto: number; baldas: number[] }) {
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * (ancho / 2 - 0.015), alto / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.03, alto, fondo]} />
          <meshStandardMaterial color={BLANCO} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, alto / 2, -fondo / 2 + 0.01]} receiveShadow>
        <boxGeometry args={[ancho, alto, 0.02]} />
        <meshStandardMaterial color="#e3ddd1" roughness={0.6} />
      </mesh>
      {baldas.map(y => (
        <group key={y}>
          <mesh position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[ancho - 0.03, 0.02, fondo]} />
            <meshStandardMaterial color={BLANCO} roughness={0.35} metalness={0.25} />
          </mesh>
          <mesh position={[0, y + 0.012, fondo / 2 - 0.008]}>
            <boxGeometry args={[ancho - 0.03, 0.03, 0.012]} />
            <meshStandardMaterial color={ROJO} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, alto + 0.04, 0]} castShadow>
        <boxGeometry args={[ancho + 0.02, 0.08, fondo + 0.02]} />
        <meshStandardMaterial color={ROJO} roughness={0.5} />
      </mesh>
    </group>
  )
}

function CajaNegra({ id, nombre, n, posicion }: { id: string; nombre: string; n: number; posicion: [number, number, number] }) {
  const ref = useRef<Group>(null!)
  const apuntada = useEstado(e => e.apuntado === `caja:${id}`)
  const etiqueta = useMemo(() => texturaTexto(`${nombre}.`, `${n} de ${CAPACIDAD_CAJA}`, '#f4f1ea', '#1d1a16', 256, 120), [nombre, n])
  useEffect(() => {
    ref.current.traverse(o => { o.userData.id = `caja:${id}` })
  }, [id])
  return (
    <group ref={ref} position={[posicion[0] + (apuntada ? 0.02 : 0), posicion[1], posicion[2]]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.075, 0.13]} />
        <meshStandardMaterial color="#141414" roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.003, 0.0655]}>
        <planeGeometry args={[0.075, 0.035]} />
        <meshStandardMaterial map={etiqueta} roughness={0.7} />
      </mesh>
    </group>
  )
}

export function ZonaPokemon({ cartas, sellados }: { cartas: TCarta[]; sellados: Sellado[] }) {
  const pokemon = useEstado(e => e.pokemon)
  const suelo = useMemo(texturaSuelo, [])
  const rotulo = useMemo(() => texturaTexto('pokémon.', 'cartas y producto sellado', ROJO, '#ffffff', 768, 220), [])
  const cajasRef = useRef<Group>(null!)

  useEffect(() => {
    interactivos.set('cajas-pokemon', cajasRef.current)
    return () => { interactivos.delete('cajas-pokemon') }
  }, [])

  const porId = useMemo(() => new Map(cartas.map(c => [c.id, c])), [cartas])
  const enExpositor = useMemo(
    () => ordenarCartas(pokemon.expositor.map(id => porId.get(id)).filter((c): c is TCarta => !!c), pokemon.criterio),
    [pokemon.expositor, pokemon.criterio, porId],
  )
  const graduadas = cartas.filter(c => c.graduada)

  const sitiosSellado = useMemo(() => {
    const sitios: { s: Sellado; posicion: [number, number, number] }[] = []
    let balda = SELLADO.baldas.length - 1, z = SELLADO.z - SELLADO.ancho / 2 + 0.05
    for (const s of sellados) {
      const [w, h, d] = MEDIDAS_SELLADO[s.formato]
      if (z + w > SELLADO.z + SELLADO.ancho / 2 - 0.03) { balda--; z = SELLADO.z - SELLADO.ancho / 2 + 0.05 }
      if (balda < 0) break
      sitios.push({ s, posicion: [SELLADO.x - SELLADO.fondo / 2 + 0.06 + d / 2 + (SELLADO.fondo - d) * 0.4, SELLADO.baldas[balda] + 0.012 + h / 2, z + w / 2] })
      z += w + 0.04
    }
    return sitios
  }, [sellados])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(PARED - 3.7) / 2, 0.003, -2.4]} receiveShadow>
        <planeGeometry args={[PARED * -1 - 3.7, 5.2]} />
        <meshStandardMaterial map={suelo} roughness={0.45} />
      </mesh>
      <group position={[PARED + 0.02, 2.55, -2.4]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[1.9, 0.55]} />
          <meshStandardMaterial map={rotulo} roughness={0.5} emissive="#ffffff" emissiveIntensity={0.08} />
        </mesh>
      </group>

      {EXPOSITOR.zs.map(z => <Mueble key={z} x={EXPOSITOR.x} z={z} ancho={EXPOSITOR.ancho} fondo={EXPOSITOR.fondo} alto={1.95} baldas={[EXPOSITOR.cajas, ...EXPOSITOR.baldas]} />)}
      {enExpositor.map((c, i) => {
        const sitio = sitioExpositor(i)
        if (!sitio) return null
        return (
          <group key={c.id}>
            <mesh position={[sitio.posicion[0] - 0.012, sitio.posicion[1] - CARTA.alto / 2 + 0.004, sitio.posicion[2]]}>
              <boxGeometry args={[0.03, 0.008, 0.05]} />
              <meshStandardMaterial color="#f4f8ff" roughness={0.15} transparent opacity={0.45} depthWrite={false} />
            </mesh>
            <Carta carta={c} sitio={sitio} />
          </group>
        )
      })}
      <group ref={cajasRef}>
        {pokemon.cajas.map((c, i) => (
          <CajaNegra key={c.id} id={c.id} nombre={c.nombre} n={c.cartas.length}
            posicion={[EXPOSITOR.x + 0.02, EXPOSITOR.cajas + 0.012 + 0.0375, EXPOSITOR.zs[0] + EXPOSITOR.ancho / 2 - 0.1 - i * 0.14]} />
        ))}
      </group>

      <Mueble x={SELLADO.x} z={SELLADO.z} ancho={SELLADO.ancho} fondo={SELLADO.fondo} alto={1.7} baldas={SELLADO.baldas} />
      {sitiosSellado.map(({ s, posicion }) => <Sellado3D key={s.id} sellado={s} posicion={posicion} giro={Math.PI / 2} />)}

      <group position={[VITRINA.x, 0, VITRINA.z]}>
        <mesh position={[0, (VITRINA.alto - 0.12) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[VITRINA.ancho, VITRINA.alto - 0.12, VITRINA.fondo]} />
          <meshStandardMaterial color={BLANCO} roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, VITRINA.alto - 0.12 + 0.005, 0]}>
          <boxGeometry args={[VITRINA.ancho - 0.04, 0.01, VITRINA.fondo - 0.04]} />
          <meshStandardMaterial color="#1f2b4a" roughness={0.9} />
        </mesh>
        <mesh position={[0, VITRINA.alto - 0.06, 0]}>
          <boxGeometry args={[VITRINA.ancho, 0.12, VITRINA.fondo]} />
          <meshStandardMaterial color="#e8f4ff" roughness={0.05} metalness={0.2} transparent opacity={0.18} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.04, VITRINA.fondo / 2 + 0.002]}>
          <boxGeometry args={[VITRINA.ancho, 0.08, 0.005]} />
          <meshStandardMaterial color={ROJO} roughness={0.5} />
        </mesh>
      </group>
      {graduadas.map((c, i) => (
        <Carta key={c.id} carta={c} sitio={{ posicion: [VITRINA.x + (i - (graduadas.length - 1) / 2) * 0.18, VITRINA.alto - 0.08, VITRINA.z + 0.02], giro: [-1.05, 0, 0] }} />
      ))}
    </group>
  )
}
