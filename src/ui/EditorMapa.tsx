import { useEffect, useMemo, useRef, useState } from 'react'
import { avisar, cambiarEstado, guardarMapa, useEstado } from '../estado'
import { COLOR_MADERA, MUEBLE, SALA } from '../escena/distribucion'
import { MESA } from '../escena/Entrada'
import { control, entrar } from '../escena/registro'
import type { MuebleMapa } from '../tipos'

// Editor de la biblioteca visto desde arriba: arrastrar para mover, y con una
// estantería elegida, girarla, cambiar su color, su alto, sus baldas y qué
// sección guarda. Al guardar, el mapa pasa a ser el tuyo (ya no se reparte
// solo por pasillos); «volver a lo automático» lo deshace.

const ESCALA_MAX = 56
// El panel lateral, los huecos y la pista ocupan unos 360 px de ancho y 120 de alto.
const escalaQueCabe = () => Math.max(24, Math.min(ESCALA_MAX, (window.innerWidth - 360) / SALA.ancho, (window.innerHeight - 120) / SALA.fondo))
const PASO = 0.25
const COLORES = [COLOR_MADERA, '#c49a6c', '#5b3a24', '#f1efe9', '#2b2b2e', '#3f6b4f', '#2f4f7a', '#8a2233', '#d0453a']
const ajustar = (v: number) => Math.round(v / PASO) * PASO
const limitar = (v: number, max: number) => Math.max(-max, Math.min(max, v))

export function EditorMapa() {
  const config = useEstado(e => e.config)
  const secciones = control.biblioteca?.secciones ?? []
  const inicial = useMemo<MuebleMapa[]>(
    () => (control.biblioteca?.muebles ?? []).map(({ indice: _, ...m }) => ({ ...m, seccion: m.seccion || null })),
    [],
  )
  const [muebles, setMuebles] = useState<MuebleMapa[]>(inicial)
  const [elegido, setElegido] = useState<string | null>(null)
  const arrastre = useRef<{ id: string; dx: number; dz: number } | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [escala, setEscala] = useState(escalaQueCabe)
  const actual = muebles.find(m => m.id === elegido) ?? null

  const cambiar = (id: string, parcial: Partial<MuebleMapa>) => setMuebles(ms => ms.map(m => (m.id === id ? { ...m, ...parcial } : m)))
  const cerrar = () => { cambiarEstado({ editorMapa: false }); entrar() }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return
      if (e.code === 'Escape') cerrar()
      if (!elegido) return
      if (e.code === 'KeyR') setMuebles(ms => ms.map(m => (m.id === elegido ? { ...m, giro: m.giro + Math.PI / 2 } : m)))
      if (e.code === 'Delete' || e.code === 'Backspace') { setMuebles(ms => ms.filter(m => m.id !== elegido)); setElegido(null) }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [elegido])

  useEffect(() => {
    const medir = () => setEscala(escalaQueCabe())
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  const aMetros = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / escala - SALA.ancho / 2, z: (e.clientY - r.top) / escala - SALA.fondo / 2 }
  }

  const empezar = (e: React.PointerEvent, m: MuebleMapa) => {
    e.stopPropagation()
    setElegido(m.id)
    const p = aMetros(e)
    arrastre.current = { id: m.id, dx: m.x - p.x, dz: m.z - p.z }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const mover = (e: React.PointerEvent) => {
    const a = arrastre.current
    if (!a) return
    const p = aMetros(e)
    cambiar(a.id, { x: limitar(ajustar(p.x + a.dx), SALA.ancho / 2 - 0.3), z: limitar(ajustar(p.z + a.dz), SALA.fondo / 2 - 0.3) })
  }

  const anadir = () => {
    const id = 'm' + Date.now().toString(36)
    setMuebles(ms => [...ms, { id, x: 0, z: 3, giro: 0, seccion: null, color: actual?.color ?? COLOR_MADERA, alto: actual?.alto ?? MUEBLE.alto, baldas: actual?.baldas ?? MUEBLE.baldas }])
    setElegido(id)
  }

  const guardar = () => {
    guardarMapa(muebles)
    avisar('mapa guardado. tu biblioteca ya tiene tu distribución.')
    cerrar()
  }

  const nombre = (s: string | null) => secciones.find(x => x.id === s)?.nombre ?? 'vacía'

  return (
    <div className="velo-pausa editor-mapa-velo">
      <div className="editor-mapa">
        <div className="mapa-lienzo">
          <svg ref={svg} width={SALA.ancho * escala} height={SALA.fondo * escala} onPointerMove={mover} onPointerUp={() => { arrastre.current = null }} onPointerDown={() => setElegido(null)}>
            <defs>
              <pattern id="rejilla" width={escala / 2} height={escala / 2} patternUnits="userSpaceOnUse">
                <path d={`M ${escala / 2} 0 L 0 0 0 ${escala / 2}`} fill="none" stroke="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#2d241d" />
            <rect width="100%" height="100%" fill="url(#rejilla)" />
            <g transform={`translate(${(SALA.ancho / 2) * escala} ${(SALA.fondo / 2) * escala}) scale(${escala})`}>
              <rect x={MESA.x - MESA.ancho / 2} y={MESA.z - MESA.fondo / 2} width={MESA.ancho} height={MESA.fondo} fill="#6e4a2c" opacity={0.6} />
              <text x={MESA.x} y={MESA.z + 0.08} fontSize={0.22} fill="#f6efe3" textAnchor="middle">mesa</text>
              <rect x={-6} y={0.95} width={0.8} height={1.3} fill="#6e4a2c" opacity={0.6} />
              <text x={-5.6} y={1.65} fontSize={0.14} fill="#f6efe3" textAnchor="middle">ordenador</text>
              <text x={0} y={SALA.fondo / 2 - 0.15} fontSize={0.24} fill="#e0a35a" textAnchor="middle">entrada</text>
              {muebles.map(m => (
                <g key={m.id} transform={`translate(${m.x} ${m.z}) rotate(${(-m.giro * 180) / Math.PI})`} onPointerDown={e => empezar(e, m)} style={{ cursor: 'grab' }}>
                  <rect x={-MUEBLE.ancho / 2} y={-MUEBLE.fondo / 2} width={MUEBLE.ancho} height={MUEBLE.fondo} fill={m.color} stroke={m.id === elegido ? '#e0a35a' : 'rgba(0,0,0,0.5)'} strokeWidth={m.id === elegido ? 0.05 : 0.02} />
                  <rect x={-MUEBLE.ancho / 2} y={MUEBLE.fondo / 2 - 0.05} width={MUEBLE.ancho} height={0.05} fill="#e0a35a" opacity={0.8} />
                  <text y={0.06} fontSize={0.15} fill={m.color === '#f1efe9' ? '#241c16' : '#f6efe3'} textAnchor="middle" style={{ pointerEvents: 'none' }}>{nombre(m.seccion)}</text>
                </g>
              ))}
            </g>
          </svg>
          <p className="pista">arrastra las estanterías. la franja naranja es su frente. r gira, supr borra, esc sale sin guardar.</p>
        </div>
        <aside>
          <h2>mapa de la biblioteca.</h2>
          <button onClick={anadir}>+ añadir estantería.</button>
          {actual ? (
            <div className="propiedades">
              <label>
                <span>sección.</span>
                <select value={actual.seccion ?? ''} onChange={e => cambiar(actual.id, { seccion: e.target.value || null })}>
                  <option value="">vacía</option>
                  {secciones.map(s => <option key={s.id} value={s.id}>{s.pasillo === 'libros' ? s.nombre : `${s.pasillo}: ${s.nombre}`}</option>)}
                </select>
              </label>
              <div>
                <span>color.</span>
                <div className="muestras">
                  {COLORES.map(c => <button key={c} className={c === actual.color ? 'activa' : ''} style={{ background: c }} onClick={() => cambiar(actual.id, { color: c })} aria-label={c} />)}
                </div>
              </div>
              <label>
                <span>alto. {actual.alto.toFixed(2)} m</span>
                <input type="range" min={1.2} max={2.6} step={0.1} value={actual.alto} onChange={e => cambiar(actual.id, { alto: Number(e.target.value) })} />
              </label>
              <label>
                <span>baldas. {actual.baldas}</span>
                <input type="range" min={2} max={7} step={1} value={actual.baldas} onChange={e => cambiar(actual.id, { baldas: Number(e.target.value) })} />
              </label>
              <div className="fila-botones">
                <button onClick={() => cambiar(actual.id, { giro: actual.giro + Math.PI / 2 })}>girar.</button>
                <button onClick={() => { const id = 'm' + Date.now().toString(36); setMuebles(ms => [...ms, { ...actual, id, x: actual.x + 0.5, z: actual.z + 0.5 }]); setElegido(id) }}>duplicar.</button>
                <button onClick={() => { setMuebles(ms => ms.filter(m => m.id !== actual.id)); setElegido(null) }}>borrar.</button>
              </div>
            </div>
          ) : <p className="nota">elige una estantería para cambiarla.</p>}
          <div className="pie-editor">
            <button className="principal" onClick={guardar}>guardar.</button>
            {config.mapa && <button onClick={() => { guardarMapa(null); avisar('vuelve la distribución automática por pasillos.'); cerrar() }}>volver a lo automático.</button>}
            <button onClick={cerrar}>salir sin guardar.</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
