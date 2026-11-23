import { useEffect, useRef, useState } from 'react'
import { cambiarEstado, hechosHoy, useEstado } from '../estado'
import { entrar, giroInspeccion, huecoDe } from '../escena/registro'
import type { Libro } from '../tipos'
import { MenuOrden } from './MenuOrden'
import { Terminal } from './Terminal'

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | number | null | undefined }) {
  return (
    <div className="fila">
      <span>{etiqueta}</span>
      <strong>{valor ?? 'sin dato.'}</strong>
    </div>
  )
}

function Ficha({ libro }: { libro: Libro }) {
  const h = huecoDe(libro.id)
  return (
    <aside className="ficha" onMouseDown={e => e.stopPropagation()}>
      <h1>{libro.titulo}</h1>
      <p className="autor">{libro.autor}</p>
      <div className="filas">
        <Fila etiqueta="año." valor={libro.anio} />
        <Fila etiqueta="páginas." valor={libro.paginas} />
        {libro.saga && <Fila etiqueta="saga." valor={`${libro.saga}, ${libro.tomo}`} />}
        {h && <Fila etiqueta="aquí." valor={`${h.seccion}, mueble ${h.modulo + 1}, balda ${h.balda}`} />}
        <Fila etiqueta="en casa." valor={libro.ubicacion ?? 'sin ubicación.'} />
      </div>
      <button onClick={() => cambiarEstado({ abierto: null })}>devolver a la balda.</button>
      <p className="pista">arrastra para girarlo. esc o clic fuera para devolverlo.</p>
    </aside>
  )
}

function Marcador({ pendientes, carro }: { pendientes: number; carro: number }) {
  const hoy = useEstado(() => hechosHoy())
  if (!pendientes && !carro && !hoy) return null
  return (
    <div className="marcador">
      <div><span>por ordenar.</span><strong>{pendientes}</strong></div>
      <div><span>en el carro.</span><strong>{carro}</strong></div>
      <div><span>hoy.</span><strong>{hoy}</strong></div>
      {carro > 0 && <p>sigue las flechas hasta el hueco que brilla. <kbd>g</kbd> las apaga.</p>}
    </div>
  )
}

function Aviso() {
  const aviso = useEstado(e => e.aviso)
  const [visible, setVisible] = useState<typeof aviso>(null)
  useEffect(() => {
    if (!aviso) return
    setVisible(aviso)
    const t = setTimeout(() => setVisible(v => (v === aviso ? null : v)), 2200)
    return () => clearTimeout(t)
  }, [aviso])
  if (!visible) return null
  return <div className="aviso" key={visible.n}>{visible.texto}</div>
}

export function Interfaz({ libros }: { libros: Libro[] }) {
  const dentro = useEstado(e => e.dentro)
  const abierto = useEstado(e => e.abierto)
  const apuntado = useEstado(e => e.apuntado)
  const terminal = useEstado(e => e.terminal)
  const menuOrden = useEstado(e => e.menuOrden)
  const libro = abierto ? libros.find(l => l.id === abierto) : null
  const arrastre = useRef<{ x: number; y: number; movido: boolean } | null>(null)

  useEffect(() => {
    if (!abierto) return
    const tecla = (e: KeyboardEvent) => { if (e.code === 'Escape') cambiarEstado({ abierto: null }) }
    const bajar = (e: MouseEvent) => { arrastre.current = { x: e.clientX, y: e.clientY, movido: false } }
    const mover = (e: MouseEvent) => {
      const a = arrastre.current
      if (!a) return
      const dx = e.clientX - a.x, dy = e.clientY - a.y
      if (Math.abs(dx) + Math.abs(dy) > 4) a.movido = true
      giroInspeccion.y += dx * 0.01
      giroInspeccion.x = Math.max(-1.2, Math.min(1.2, giroInspeccion.x + dy * 0.01))
      a.x = e.clientX
      a.y = e.clientY
    }
    const soltar = () => {
      const a = arrastre.current
      arrastre.current = null
      if (a && !a.movido) {
        cambiarEstado({ abierto: null })
        entrar()
      }
    }
    window.addEventListener('keydown', tecla)
    window.addEventListener('mousedown', bajar)
    window.addEventListener('mousemove', mover)
    window.addEventListener('mouseup', soltar)
    return () => {
      window.removeEventListener('keydown', tecla)
      window.removeEventListener('mousedown', bajar)
      window.removeEventListener('mousemove', mover)
      window.removeEventListener('mouseup', soltar)
    }
  }, [abierto])

  const pendientes = useEstado(e => e.coleccion.pendientes)
  const carro = useEstado(e => e.coleccion.carro)
  const pista = !apuntado ? null
    : apuntado === 'terminal' ? <><kbd>clic</kbd> usar el ordenador</>
    : apuntado.startsWith('hueco:') ? <><kbd>clic</kbd> colocar aquí</>
    : pendientes.includes(apuntado) ? <><kbd>clic</kbd> al carro <kbd>t</kbd> todos al carro</>
    : carro.includes(apuntado) ? <>en el carro. busca su hueco iluminado.</>
    : <><kbd>clic</kbd> sacar <kbd>o</kbd> ordenar esta estantería</>

  return (
    <>
      {dentro && <div className={`mirilla ${apuntado ? 'activa' : ''}`} />}
      {dentro && pista && <div className="pista-mirilla">{pista}</div>}
      {dentro && <Marcador pendientes={pendientes.length} carro={carro.length} />}
      <Aviso />
      {libro && <Ficha libro={libro} />}
      {terminal && <Terminal />}
      {menuOrden && <MenuOrden seccion={menuOrden} />}
      {!dentro && !libro && !terminal && !menuOrden && (
        <div className="portada" onClick={entrar}>
          <div className="caja">
            <h1>bibliotec.</h1>
            <p>haz clic para entrar.</p>
            <ul>
              <li><kbd>w a s d</kbd> moverse, <kbd>mayús</kbd> correr</li>
              <li><kbd>ratón</kbd> mirar</li>
              <li><kbd>clic</kbd> sacar un libro, usar el ordenador, coger de la mesa, colocar</li>
              <li><kbd>t</kbd> todo lo de la mesa al carro, <kbd>g</kbd> flechas del suelo</li>
              <li><kbd>o</kbd> ordenar la estantería que miras</li>
              <li><kbd>esc</kbd> salir</li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
