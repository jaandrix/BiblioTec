import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Caja, Libro } from '../tipos'
import { grosorLibro } from './distribucion'

export const MESA = { x: 2.9, z: 1.7, ancho: 1.5, fondo: 0.85, alto: 0.8 }
export const CAJA_MESA: Caja = {
  min: [MESA.x - MESA.ancho / 2, MESA.z - MESA.fondo / 2],
  max: [MESA.x + MESA.ancho / 2, MESA.z + MESA.fondo / 2],
}
const COLUMNAS = 3

function hash(texto: string) {
  let h = 0
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

// Montones de libros tumbados con la portada hacia arriba, un poco torcidos
// para que parezcan dejados a mano.
export function posicionesMesa(libros: Libro[]) {
  const sitios = new Map<string, { posicion: [number, number, number]; giro: number }>()
  const altura: number[] = []
  // Con pocos libros, montones bajos repartidos por la mesa; con muchos, más altos.
  const porMonton = Math.max(2, Math.ceil(libros.length / (COLUMNAS * 2)))
  libros.forEach((l, i) => {
    const monton = Math.floor(i / porMonton) % (COLUMNAS * 2)
    const col = monton % COLUMNAS, fila = Math.floor(monton / COLUMNAS)
    const g = grosorLibro(l)
    const y = MESA.alto + (altura[monton] ?? 0) + g / 2
    altura[monton] = (altura[monton] ?? 0) + g
    sitios.set(l.id, {
      posicion: [MESA.x - 0.47 + col * 0.47, y, MESA.z - 0.2 + fila * 0.4],
      giro: -Math.PI / 2 + ((hash(l.id) % 100) / 100 - 0.5) * 0.3,
    })
  })
  return sitios
}

export function Entrada({ pendientes }: { pendientes: number }) {
  const cartel = useMemo(() => {
    const lienzo = document.createElement('canvas')
    lienzo.width = 512
    lienzo.height = 160
    const ctx = lienzo.getContext('2d')!
    ctx.fillStyle = '#f3e6cf'
    ctx.fillRect(0, 0, 512, 160)
    ctx.fillStyle = '#2a1d12'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '600 58px Poppins, sans-serif'
    ctx.fillText('por ordenar.', 256, 62)
    ctx.font = '400 34px Poppins, sans-serif'
    ctx.fillStyle = '#7a5636'
    ctx.fillText(pendientes ? `${pendientes} ${pendientes === 1 ? 'libro' : 'libros'}.` : 'todo en su sitio.', 256, 118)
    const t = new CanvasTexture(lienzo)
    t.colorSpace = SRGBColorSpace
    return t
  }, [pendientes])

  return (
    <group>
      <mesh position={[MESA.x, MESA.alto - 0.03, MESA.z]} castShadow receiveShadow>
        <boxGeometry args={[MESA.ancho, 0.06, MESA.fondo]} />
        <meshStandardMaterial color="#9a6a40" roughness={0.75} />
      </mesh>
      {[-1, 1].flatMap(sx => [-1, 1].map(sz => (
        <mesh key={`${sx}${sz}`} position={[MESA.x + sx * (MESA.ancho / 2 - 0.06), (MESA.alto - 0.06) / 2, MESA.z + sz * (MESA.fondo / 2 - 0.06)]} castShadow>
          <boxGeometry args={[0.06, MESA.alto - 0.06, 0.06]} />
          <meshStandardMaterial color="#6e4a2c" roughness={0.85} />
        </mesh>
      )))}
      <group position={[MESA.x, MESA.alto + 0.12, MESA.z - MESA.fondo / 2 + 0.05]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0, 0]} rotation={[-0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.16, 0.015]} />
          <meshStandardMaterial attach="material-0" color="#6e4a2c" />
          <meshStandardMaterial attach="material-1" color="#6e4a2c" />
          <meshStandardMaterial attach="material-2" color="#6e4a2c" />
          <meshStandardMaterial attach="material-3" color="#6e4a2c" />
          <meshStandardMaterial attach="material-4" map={cartel} />
          <meshStandardMaterial attach="material-5" color="#6e4a2c" />
        </mesh>
      </group>
    </group>
  )
}
