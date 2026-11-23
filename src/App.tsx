import { Environment, Lightformer } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useMemo } from 'react'
import { PCFSoftShadowMap } from 'three'
import librosDemo from './datos/libros-demo.json'
import { Brazos, Carro } from './escena/Carro'
import { cajasDeChoque, construir } from './escena/distribucion'
import { CAJA_MESA, Entrada, posicionesMesa } from './escena/Entrada'
import { Guia } from './escena/Guia'
import { GuiaSuelo, Huecos } from './escena/Huecos'
import { Jugador } from './escena/Jugador'
import { Libro, type Destino } from './escena/Libro'
import { control } from './escena/registro'
import { Sala } from './escena/Sala'
import { CAJA_TERMINAL, Terminal3D } from './escena/Terminal3D'
import { useEstado } from './estado'
import { colorDeLibro } from './libros/color'
import type { Libro as TLibro } from './tipos'
import { Interfaz } from './ui/Interfaz'

const LIBROS = librosDemo as TLibro[]

export default function App() {
  const config = useEstado(e => e.config)
  const alta = config.calidad === 'alta'
  const coleccion = useEstado(e => e.coleccion)
  const todos = useMemo(() => {
    const base = [...LIBROS, ...coleccion.anadidos.filter(a => !LIBROS.some(l => l.id === a.id))]
    return base.map(l => (coleccion.portadas[l.id] ? { ...l, portada: coleccion.portadas[l.id] } : l))
  }, [coleccion.anadidos, coleccion.portadas])

  // Los del carro ya cuentan en la estantería: así su hueco queda abierto y se
  // ilumina, y los vecinos se apartan para dejarle sitio.
  const biblioteca = useMemo(() => {
    const enMesa = new Set(coleccion.pendientes)
    return construir(todos.filter(l => !enMesa.has(l.id)), config, colorDeLibro)
  }, [todos, coleccion.pendientes, config])
  control.biblioteca = biblioteca
  control.todos = todos

  const { libros, destinos, huecosCarro } = useMemo(() => {
    const porId = new Map(todos.map(l => [l.id, l]))
    const destinos = new Map<string, Destino>()
    const enCarro = new Set(coleccion.carro)
    for (const h of biblioteca.huecos) if (!enCarro.has(h.libro.id)) destinos.set(h.libro.id, { tipo: 'balda', hueco: h })
    coleccion.carro.forEach((id, indice) => destinos.set(id, { tipo: 'carro', indice }))
    const mesa = posicionesMesa(coleccion.pendientes.map(id => porId.get(id)).filter((l): l is TLibro => !!l))
    for (const [id, s] of mesa) destinos.set(id, { tipo: 'mesa', ...s })
    const libros = todos.filter(l => destinos.has(l.id))
    const huecosCarro = biblioteca.huecos.filter(h => enCarro.has(h.libro.id))
    return { libros, destinos, huecosCarro }
  }, [todos, biblioteca, coleccion.carro, coleccion.pendientes])

  const cajas = useMemo(() => [...cajasDeChoque(biblioteca.muebles), CAJA_TERMINAL, CAJA_MESA], [biblioteca])

  return (
    <>
      <Canvas shadows={{ type: PCFSoftShadowMap }} camera={{ fov: 62, near: 0.05, far: 60 }} dpr={alta ? [1, 2] : 1}>
        {/* Reflejos suaves de luz cálida sin descargar ningún mapa de entorno. */}
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={1.2} color="#ffe6c4" position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={0.6} color="#cfe6ff" position={[6, 2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2, 1]} />
          <Lightformer intensity={0.4} color="#ffcf99" position={[-6, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[6, 2, 1]} />
        </Environment>
        <Sala muebles={biblioteca.muebles} secciones={biblioteca.secciones} />
        <Entrada pendientes={coleccion.pendientes.length} />
        <Carro cajas={cajas} />
        <Brazos />
        {libros.map(l => <Libro key={l.id} libro={l} destino={destinos.get(l.id)!} />)}
        <Huecos huecos={huecosCarro} />
        <GuiaSuelo huecos={huecosCarro} />
        <Terminal3D libros={biblioteca.huecos.length} estanterias={biblioteca.secciones.length} />
        <Guia />
        <Jugador cajas={cajas} />
        {alta && (
          <EffectComposer multisampling={4}>
            <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} halfRes />
            <Bloom luminanceThreshold={0.95} intensity={0.45} mipmapBlur />
            <Vignette offset={0.3} darkness={0.45} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </Canvas>
      <Interfaz libros={todos} />
    </>
  )
}
