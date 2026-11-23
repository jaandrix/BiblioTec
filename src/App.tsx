import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { PCFSoftShadowMap } from 'three'
import librosDemo from './datos/libros-demo.json'
import { cajasDeChoque, colocarLibros, muebles } from './escena/distribucion'
import { Jugador } from './escena/Jugador'
import { Libro } from './escena/Libro'
import { Sala } from './escena/Sala'
import type { Libro as TLibro } from './tipos'
import { Interfaz } from './ui/Interfaz'

const LIBROS = librosDemo as TLibro[]

export default function App() {
  const lista = useMemo(() => muebles(), [])
  const huecos = useMemo(() => colocarLibros(LIBROS, lista), [lista])
  const cajas = useMemo(() => cajasDeChoque(lista), [lista])

  return (
    <>
      <Canvas shadows={{ type: PCFSoftShadowMap }} camera={{ fov: 62, near: 0.05, far: 60 }} dpr={[1, 2]}>
        <Sala lista={lista} />
        {huecos.map(h => <Libro key={h.libro.id} hueco={h} />)}
        <Jugador cajas={cajas} />
      </Canvas>
      <Interfaz libros={LIBROS} />
    </>
  )
}
