import { useLoader, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { type BufferGeometry, Matrix4, MeshStandardMaterial, Quaternion, Vector3, type Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Caja } from '../tipos'
import { SALA } from './distribucion'

const MODELOS = ['sillon', 'lampara-pie', 'mesita', 'planta', 'planta-pequena', 'caja-abierta', 'caja-cerrada'] as const
type Modelo = (typeof MODELOS)[number]
const RUTA = (m: Modelo) => `${import.meta.env.BASE_URL}recursos/modelos/${m}.glb`

interface Sitio { modelo: Modelo; x: number; y?: number; z: number; giro: number; choca?: [number, number] }

// Rincón de lectura a la izquierda de la entrada, plantas en las esquinas y
// cajas de lo recién llegado junto a la mesa. Las esquinas dependen del ancho
// de la sala, que crece con los pasillos.
function sitios(ancho = SALA.ancho): Sitio[] {
  const izq = -ancho / 2, der = ancho / 2, frente = SALA.fondo / 2
  return [
    { modelo: 'sillon', x: izq + 1.25, z: frente - 1.15, giro: -Math.PI / 2 + 0.5, choca: [0.85, 0.85] },
    { modelo: 'mesita', x: izq + 0.32, z: frente - 1.95, giro: Math.PI / 2, choca: [0.35, 0.75] },
    { modelo: 'planta-pequena', x: izq + 0.32, y: 0.5, z: frente - 2.15, giro: 0.4 },
    { modelo: 'lampara-pie', x: izq + 0.4, z: frente - 0.45, giro: 0.6, choca: [0.35, 0.35] },
    { modelo: 'planta', x: der - 0.35, z: frente - 0.4, giro: 1.2, choca: [0.45, 0.45] },
    { modelo: 'planta', x: izq + 0.35, z: 2.75, giro: 2.4, choca: [0.45, 0.45] },
    { modelo: 'caja-abierta', x: 4.05, z: 1.45, giro: -1.35, choca: [0.4, 0.5] },
    { modelo: 'caja-cerrada', x: 4.15, z: 2.05, giro: 0.25, choca: [0.35, 0.35] },
    { modelo: 'caja-cerrada', x: 4.15, y: 0.34, z: 2.05, giro: 0.6 },
  ]
}

export function cajasAtrezo(): Caja[] {
  return sitios().filter(s => s.choca).map(s => ({
    min: [s.x - s.choca![0] / 2, s.z - s.choca![1] / 2],
    max: [s.x + s.choca![0] / 2, s.z + s.choca![1] / 2],
  }))
}

const MATERIAL = new MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })

// Todos los modelos (de Kenney, con el color en cada vértice) se funden en
// una sola malla: el atrezo entero cuesta una llamada de dibujo.
export function Atrezo({ ancho }: { ancho: number }) {
  const gltfs = useLoader(GLTFLoader, MODELOS.map(RUTA))
  const gl = useThree(s => s.gl)
  const geometria = useMemo(() => {
    const base = new Map<Modelo, BufferGeometry>()
    MODELOS.forEach((m, i) => {
      let malla: Mesh | null = null
      gltfs[i].scene.traverse(o => { if ((o as Mesh).isMesh && !malla) malla = o as Mesh })
      if (malla) base.set(m, (malla as Mesh).geometry)
    })
    const piezas = sitios(ancho).flatMap(s => {
      const g = base.get(s.modelo)
      if (!g) return []
      const matriz = new Matrix4().compose(new Vector3(s.x, s.y ?? 0, s.z), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), s.giro), new Vector3(1, 1, 1))
      return [g.clone().applyMatrix4(matriz)]
    })
    const unida = mergeGeometries(piezas, false)
    piezas.forEach(p => p.dispose())
    return unida
  }, [gltfs, ancho])

  useEffect(() => { gl.shadowMap.needsUpdate = true }, [gl, geometria])
  useEffect(() => () => geometria.dispose(), [geometria])

  return <mesh geometry={geometria} material={MATERIAL} castShadow receiveShadow />
}
