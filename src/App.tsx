import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { PCFSoftShadowMap } from 'three'
import librosDemo from './datos/libros-demo.json'
import { cajasDeChoque, construir } from './escena/distribucion'
import { Guia } from './escena/Guia'
import { Jugador } from './escena/Jugador'
import { Libro } from './escena/Libro'
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
  const biblioteca = useMemo(() => construir(LIBROS, config, colorDeLibro), [config])
  control.biblioteca = biblioteca
  const cajas = useMemo(() => [...cajasDeChoque(biblioteca.muebles), CAJA_TERMINAL], [biblioteca])

  return (
    <>
      <Canvas shadows={{ type: PCFSoftShadowMap }} camera={{ fov: 62, near: 0.05, far: 60 }} dpr={[1, 2]}>
        <Sala muebles={biblioteca.muebles} secciones={biblioteca.secciones} />
        {biblioteca.huecos.map(h => <Libro key={h.libro.id} hueco={h} />)}
        <Terminal3D libros={biblioteca.huecos.length} estanterias={biblioteca.secciones.length} />
        <Guia />
        <Jugador cajas={cajas} />
      </Canvas>
      <Interfaz libros={LIBROS} />
    </>
  )
}
