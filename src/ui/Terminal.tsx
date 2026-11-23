import { useEffect, useRef, useState } from 'react'
import { cambiarCriterio, cambiarEstado, sumarModulo } from '../estado'
import { control, entrar } from '../escena/registro'
import { ejecutar } from '../terminal/comandos'
import type { Libro } from '../tipos'

const ATAJOS = ['ayuda', 'buscar ', 'estanterias', 'estadisticas', 'ordenar todas por ', 'salir']

function arranque() {
  const b = control.biblioteca
  return [
    'BIBLIOTEC OS v0.2   (C) 1984-2026',
    'MEMORIA ......... 640K OK',
    `CATALOGO ........ ${b?.huecos.length ?? 0} LIBROS EN ${b?.secciones.length ?? 0} ESTANTERIAS`,
    '',
    'ESCRIBE AYUDA PARA VER LOS COMANDOS.',
  ]
}

export function Terminal() {
  const [lineas, setLineas] = useState<string[]>(arranque)
  const [entrada, setEntrada] = useState('')
  const historial = useRef<string[]>([])
  const posHistorial = useRef(-1)
  const busqueda = useRef<Libro[]>([])
  const campo = useRef<HTMLInputElement>(null)
  const fondo = useRef<HTMLDivElement>(null)

  useEffect(() => { campo.current?.focus() }, [])
  useEffect(() => { fondo.current?.scrollTo({ top: fondo.current.scrollHeight }) }, [lineas])

  const salir = (relock = true) => {
    cambiarEstado({ terminal: false })
    if (relock) entrar()
  }

  const enviar = () => {
    const texto = entrada
    setEntrada('')
    if (texto.trim()) historial.current.unshift(texto)
    posHistorial.current = -1
    let saliendo = false
    const r = ejecutar(texto, {
      biblioteca: control.biblioteca!,
      ultimaBusqueda: busqueda.current,
      ordenar: cambiarCriterio,
      ampliar: sumarModulo,
      guiar: id => { cambiarEstado({ guia: id }); saliendo = true },
      salir: () => { saliendo = true },
    })
    if (r.busqueda) busqueda.current = r.busqueda
    setLineas(l => (r.limpiar ? [] : [...l, `> ${texto}`, ...r.lineas]).slice(-200))
    // Pedir el ratón desde la tecla Intro cuenta como gesto del usuario.
    if (saliendo) setTimeout(() => salir(), 700)
  }

  const tecla = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') enviar()
    else if (e.key === 'Escape') salir(false)
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const h = historial.current
      posHistorial.current = Math.max(-1, Math.min(h.length - 1, posHistorial.current + (e.key === 'ArrowUp' ? 1 : -1)))
      setEntrada(posHistorial.current < 0 ? '' : h[posHistorial.current])
    }
  }

  return (
    <div className="terminal-velo" onMouseDown={e => { e.stopPropagation(); campo.current?.focus() }}>
      <div className="crt">
        <div className="crt-texto" ref={fondo}>
          {lineas.map((l, i) => <pre key={i}>{l || ' '}</pre>)}
          <div className="crt-entrada">
            <span>&gt;&nbsp;</span>
            <input
              ref={campo}
              value={entrada}
              onChange={e => setEntrada(e.target.value)}
              onKeyDown={tecla}
              spellCheck={false}
              autoComplete="off"
              aria-label="comando"
            />
          </div>
        </div>
        <div className="crt-atajos">
          {ATAJOS.map(a => (
            <button key={a} onClick={() => { setEntrada(a); campo.current?.focus() }}>{a.trim()}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
