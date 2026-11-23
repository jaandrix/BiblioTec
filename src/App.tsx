import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { PCFSoftShadowMap } from 'three'
import librosDemo from './datos/libros-demo.json'
import { Carro } from './escena/Carro'
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
  const coleccion = useEstado(e => e.coleccion)
  const todos = useMemo(() => [...LIBROS, ...coleccion.anadidos.filter(a => !LIBROS.some(l => l.id === a.id))], [coleccion.anadidos])

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
      <Canvas shadows={{ type: PCFSoftShadowMap }} camera={{ fov: 62, near: 0.05, far: 60 }} dpr={[1, 2]}>
        <Sala muebles={biblioteca.muebles} secciones={biblioteca.secciones} />
        <Entrada pendientes={coleccion.pendientes.length} />
        <Carro cajas={cajas} />
        {libros.map(l => <Libro key={l.id} libro={l} destino={destinos.get(l.id)!} />)}
        <Huecos huecos={huecosCarro} />
        <GuiaSuelo huecos={huecosCarro} />
        <Terminal3D libros={biblioteca.huecos.length} estanterias={biblioteca.secciones.length} />
        <Guia />
        <Jugador cajas={cajas} />
      </Canvas>
      <Interfaz libros={todos} />
    </>
  )
}
