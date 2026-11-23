import { useEffect, useState } from 'react'
import { avisar, CAPACIDAD_CAJA, cambiarCriterioCartas, cambiarEstado, crearCaja, moverCarta, renombrarCaja, useEstado } from '../estado'
import { entrar } from '../escena/registro'
import type { Carta, CriterioCartas, Sellado } from '../tipos'

const precios = new Map<string, Promise<number | null>>()

export function precioCarta(tcgdex: string) {
  if (!precios.has(tcgdex)) {
    precios.set(tcgdex, fetch(`https://api.tcgdex.net/v2/es/cards/${tcgdex}`)
      .then(r => r.json())
      .then(d => d.pricing?.cardmarket?.avg ?? d.pricing?.cardmarket?.trend ?? null)
      .catch(() => null))
  }
  return precios.get(tcgdex)!
}

const euros = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | number | null | undefined }) {
  return <div className="fila"><span>{etiqueta}</span><strong>{valor ?? 'sin dato.'}</strong></div>
}

function useDondeEsta(id: string, graduada: boolean) {
  const p = useEstado(e => e.pokemon)
  if (graduada) return 'vitrina.'
  if (p.expositor.includes(id)) return 'expositor.'
  const caja = p.cajas.find(c => c.cartas.includes(id))
  return caja ? `caja ${caja.nombre}.` : 'sin colocar.'
}

export function FichaCarta({ carta }: { carta: Carta }) {
  const [precio, setPrecio] = useState<number | null | undefined>(undefined)
  const donde = useDondeEsta(carta.id, !!carta.graduada)
  useEffect(() => { precioCarta(carta.tcgdex).then(setPrecio) }, [carta.tcgdex])
  return (
    <aside className="ficha">
      <h1>{carta.nombre}</h1>
      <p className="autor">{carta.set}</p>
      <div className="filas">
        <Fila etiqueta="número." valor={carta.total ? `${carta.numero}/${carta.total}` : carta.numero} />
        <Fila etiqueta="rareza." valor={carta.rareza.toLowerCase()} />
        <Fila etiqueta="estado." valor={carta.graduada ? `${carta.graduada.empresa} ${carta.graduada.nota}` : carta.estado.toLowerCase()} />
        <Fila etiqueta="mercado." valor={precio === undefined ? 'consultando…' : precio === null ? 'sin precio.' : `${euros(precio)} (cardmarket)`} />
        <Fila etiqueta="aquí." valor={donde} />
      </div>
      <ul className="controles-ficha">
        <li><kbd>ratón</kbd> girarla{carta.holo ? ' (mira el brillo)' : ''}</li>
        <li><kbd>f</kbd> darle la vuelta</li>
        <li><kbd>rueda</kbd> acercar o alejar</li>
        {!carta.graduada && <li><kbd>b</kbd> guardar en una caja</li>}
        <li><kbd>clic dcho.</kbd> devolverla</li>
      </ul>
    </aside>
  )
}

const NOMBRE_FORMATO: Record<Sellado['formato'], string> = {
  etb: 'caja de entrenador élite', caja: 'caja de 36 sobres', 'media-caja': 'caja de 18 sobres',
  sobre: 'sobre', lata: 'lata', coleccion: 'colección especial',
}

export function FichaSellado({ sellado }: { sellado: Sellado }) {
  return (
    <aside className="ficha">
      <h1>{sellado.set}</h1>
      <p className="autor">{NOMBRE_FORMATO[sellado.formato]}.</p>
      <div className="filas">
        <Fila etiqueta="estado." valor="sellado." />
        <Fila etiqueta="aquí." valor="estantería de sellado." />
      </div>
      <ul className="controles-ficha">
        <li><kbd>ratón</kbd> girarlo</li>
        <li><kbd>f</kbd> darle la vuelta</li>
        <li><kbd>clic dcho.</kbd> devolverlo</li>
      </ul>
    </aside>
  )
}

function useEscape(fn: () => void) {
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if (e.code === 'Escape') fn() }
    window.addEventListener('keydown', t)
    return () => window.removeEventListener('keydown', t)
  }, [fn])
}

export function CajaAbierta({ id, cartas }: { id: string; cartas: Carta[] }) {
  const caja = useEstado(e => e.pokemon.cajas.find(c => c.id === id))
  const [nombre, setNombre] = useState(caja?.nombre ?? '')
  const cerrar = () => { cambiarEstado({ cajaAbierta: null }); entrar() }
  useEscape(cerrar)
  if (!caja) return null
  const dentro = caja.cartas.map(cid => cartas.find(c => c.id === cid)).filter((c): c is Carta => !!c)
  return (
    <div className="velo-pausa" onMouseDown={e => { if (e.target === e.currentTarget) cerrar() }}>
      <div className="editor-portada caja-abierta">
        <form className="cabecera-caja" onSubmit={e => { e.preventDefault(); renombrarCaja(id, nombre) }}>
          <input value={nombre} onChange={e => setNombre(e.target.value)} onBlur={() => renombrarCaja(id, nombre)} aria-label="nombre de la caja" />
          <span>{caja.cartas.length} de {CAPACIDAD_CAJA}.</span>
        </form>
        {dentro.length ? (
          <div className="rejilla-cartas">
            {dentro.map(c => (
              <div key={c.id} className="carta-caja">
                <img src={`${c.imagen}/low.webp`} alt={c.nombre} loading="lazy" />
                <button onClick={() => { moverCarta(c.id, 'expositor'); avisar(`${c.nombre} al expositor.`) }}>al expositor.</button>
              </div>
            ))}
          </div>
        ) : <p className="nota">caja vacía. coge una carta del expositor y pulsa b para guardarla aquí.</p>}
        <div className="pie"><button className="principal" onClick={cerrar}>cerrar.</button></div>
      </div>
    </div>
  )
}

export function ElegirCaja({ carta }: { carta: Carta }) {
  const cajas = useEstado(e => e.pokemon.cajas)
  const [nueva, setNueva] = useState('')
  const cerrar = () => { cambiarEstado({ guardarEnCaja: null }); entrar() }
  useEscape(cerrar)
  const guardar = (id: string) => {
    if (moverCarta(carta.id, id)) { avisar(`${carta.nombre} guardada.`); cerrar() }
    else avisar(`esa caja ya tiene ${CAPACIDAD_CAJA} cartas.`)
  }
  return (
    <div className="velo-pausa" onMouseDown={e => { if (e.target === e.currentTarget) cerrar() }}>
      <div className="pausa">
        <h1>guardar {carta.nombre}.</h1>
        <div className="lista-cajas">
          {cajas.map(c => (
            <button key={c.id} disabled={c.cartas.length >= CAPACIDAD_CAJA || c.cartas.includes(carta.id)} onClick={() => guardar(c.id)}>
              <span>{c.nombre}.</span><small>{c.cartas.length} de {CAPACIDAD_CAJA}</small>
            </button>
          ))}
        </div>
        <form className="nueva-caja" onSubmit={e => { e.preventDefault(); if (nueva.trim()) guardar(crearCaja(nueva)) }}>
          <input value={nueva} onChange={e => setNueva(e.target.value)} placeholder="o crea una caja nueva" />
          <button type="submit">crear y guardar.</button>
        </form>
        <button className="principal" onClick={cerrar}>cancelar.</button>
      </div>
    </div>
  )
}

const CRITERIOS_CARTAS: { id: CriterioCartas; nombre: string }[] = [
  { id: 'set', nombre: 'set y número' },
  { id: 'nombre', nombre: 'nombre' },
  { id: 'rareza', nombre: 'rareza' },
]

export function MenuOrdenCartas() {
  const actual = useEstado(e => e.pokemon.criterio)
  const n = useEstado(e => e.pokemon.expositor.length)
  const cerrar = () => { cambiarEstado({ menuOrden: null }); entrar() }
  useEscape(cerrar)
  return (
    <div className="menu-velo" onMouseDown={e => { e.stopPropagation(); if (e.target === e.currentTarget) cerrar() }}>
      <div className="menu-orden">
        <h2>ordenar el expositor.</h2>
        <p>{n} cartas. elige cómo.</p>
        <div className="opciones">
          {CRITERIOS_CARTAS.map(c => (
            <button key={c.id} className={c.id === actual ? 'activa' : ''} onClick={() => { cambiarCriterioCartas(c.id); cerrar() }}>{c.nombre}.</button>
          ))}
        </div>
      </div>
    </div>
  )
}
