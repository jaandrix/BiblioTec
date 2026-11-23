import { useEffect, useRef, useState } from 'react'
import { anadirPendiente, anadirVarios, cambiarCriterio, cambiarEstado, colocar, crearCaja, leerEstado, sumarModulo } from '../estado'
import { precioCarta } from './Pokemon'
import { control, entrar } from '../escena/registro'
import { ejecutar } from '../terminal/comandos'
import type { Libro } from '../tipos'
import { traerDeBitacora } from '../sincronizar'
import { cambiarEnlace } from '../estado'
import { sonar } from '../sonido'
import { deLibib, leerCsv } from '../libib'

const ATAJOS = ['ayuda', 'buscar ', 'añadir ', 'pendientes', 'colocar todo', 'mapa', 'importar libib', 'bitacora', 'salir']

function arranque() {
  const b = control.biblioteca
  return [
    'BIBLIOTEC OS v0.3   (C) 1984-2026',
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
  const candidatos = useRef<Libro[]>([])
  const campo = useRef<HTMLInputElement>(null)
  const fondo = useRef<HTMLDivElement>(null)
  const archivo = useRef<HTMLInputElement>(null)

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
    const b = control.biblioteca!
    const { coleccion } = leerEstado()
    const porId = (id: string) => control.todos.find(l => l.id === id)
    const deIds = (ids: string[]) => ids.map(porId).filter((l): l is Libro => !!l)
    const r = ejecutar(texto, {
      biblioteca: b,
      pendientes: deIds(coleccion.pendientes),
      carro: deIds(coleccion.carro),
      ultimaBusqueda: busqueda.current,
      candidatos: candidatos.current,
      anadir: anadirPendiente,
      cartas: control.cartas,
      abrirMapa: () => { setTimeout(() => cambiarEstado({ terminal: false, editorMapa: true }), 300) },
      importarLibib: () => archivo.current?.click(),
      bitacora: (codigo?: string) => { if (codigo) cambiarEnlace({ codigo }); return traerDeBitacora() },
      cajas: leerEstado().pokemon.cajas,
      crearCaja: n => { crearCaja(n) },
      precio: precioCarta,
      colocarTodo: () => { colocar([...coleccion.pendientes, ...coleccion.carro]); sonar.colocar() },
      ordenar: cambiarCriterio,
      ampliar: sumarModulo,
      guiar: id => { cambiarEstado({ guia: id }); saliendo = true },
      salir: () => { saliendo = true },
    })
    if (r.busqueda) busqueda.current = r.busqueda
    setLineas(l => (r.limpiar ? [] : [...l, `> ${texto}`, ...r.lineas]).slice(-200))
    r.despues?.then(d => {
      if (d.candidatos) candidatos.current = d.candidatos
      setLineas(l => [...l, ...d.lineas].slice(-200))
    })
    // Pedir el ratón desde la tecla Intro cuenta como gesto del usuario.
    if (saliendo) setTimeout(() => salir(), 700)
  }

  const tecla = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    sonar.tecla()
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
      <input ref={archivo} type="file" accept=".csv,text/csv" hidden onChange={async e => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f) return
        const filas = leerCsv(await f.text())
        let r = deLibib(filas, null)
        if (r.sinConsola) {
          const consola = prompt(`${r.sinConsola} juegos no dicen de qué consola son. ¿De cuál? (por ejemplo: xbox 360, switch, ds, 3ds, wii, ps)`)
          if (consola) r = deLibib(filas, consola.trim().toLowerCase())
        }
        if (!r.libros.length) { setLineas(l => [...l, 'ESE ARCHIVO NO PARECE UN CSV DE LIBIB.']); return }
        const directo = r.libros.length > 20 && confirm(`${r.libros.length} cosas. ¿Colocarlas directamente en sus estanterías? (Cancelar: dejarlas en la mesa de la entrada para ordenarlas tú.)`)
        const n = anadirVarios(r.libros, directo, control.todos)
        const tipos = r.libros.reduce<Record<string, number>>((a, l) => ({ ...a, [l.tipo]: (a[l.tipo] ?? 0) + 1 }), {})
        setLineas(l => [...l, `IMPORTADOS ${n} DE ${r.libros.length} (LOS DEMAS YA ESTABAN).`, ...Object.entries(tipos).map(([t, k]) => `  ${t.toUpperCase().padEnd(12)} ${k}`), directo ? 'YA ESTAN EN SUS ESTANTERIAS.' : 'TE ESPERAN EN LA MESA DE LA ENTRADA.'])
      }} />
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
