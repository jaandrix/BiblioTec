import { useEffect, useState } from 'react'
import { alternarGuiaSuelo, cambiarAjuste, cambiarEstado, hechosHoy, useEstado } from '../estado'
import { entrar, huecoDe } from '../escena/registro'
import type { Carta, Libro, Sellado } from '../tipos'
import { CajaAbierta, ElegirCaja, FichaCarta, FichaSellado, MenuOrdenCartas } from './Pokemon'
import { EditorPortada } from './EditorPortada'
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
    <aside className="ficha">
      <h1>{libro.titulo}</h1>
      <p className="autor">{libro.autor}</p>
      <div className="filas">
        <Fila etiqueta="año." valor={libro.anio} />
        <Fila etiqueta="páginas." valor={libro.paginas} />
        {libro.saga && <Fila etiqueta="saga." valor={`${libro.saga}, ${libro.tomo}`} />}
        {h && <Fila etiqueta="aquí." valor={`${h.seccion}, mueble ${h.modulo + 1}, balda ${h.balda}`} />}
        <Fila etiqueta="en casa." valor={libro.ubicacion ?? 'sin ubicación.'} />
      </div>
      <ul className="controles-ficha">
        <li><kbd>ratón</kbd> girarlo</li>
        <li><kbd>f</kbd> darle la vuelta</li>
        <li><kbd>rueda</kbd> acercar o alejar</li>
        <li><kbd>p</kbd> cambiar la portada</li>
        <li><kbd>clic</kbd> devolverlo a la balda</li>
      </ul>
    </aside>
  )
}

function Marcador() {
  const pendientes = useEstado(e => e.coleccion.pendientes.length)
  const carro = useEstado(e => e.coleccion.carro.length)
  const llevo = useEstado(e => e.llevoCarro)
  const hoy = useEstado(() => hechosHoy())
  if (!pendientes && !carro && !hoy && llevo) return null
  const paso = !llevo ? 'el carro está aparcado. acércate y pulsa c para cogerlo.'
    : carro ? 'sigue las flechas del suelo. donde va cada libro brilla un hueco con una flecha encima: apúntalo y haz clic.'
    : pendientes ? 'en la mesa de la entrada esperan libros. apunta a uno y haz clic para cogerlo (t coge todos).'
    : null
  return (
    <div className="marcador">
      <div><span>por ordenar.</span><strong>{pendientes}</strong></div>
      <div><span>en el carro.</span><strong>{carro}</strong></div>
      <div><span>hoy.</span><strong>{hoy}</strong></div>
      {paso && <p>{paso}</p>}
    </div>
  )
}

function Aviso() {
  const aviso = useEstado(e => e.aviso)
  const [visible, setVisible] = useState<typeof aviso>(null)
  useEffect(() => {
    if (!aviso) return
    setVisible(aviso)
    const t = setTimeout(() => setVisible(v => (v === aviso ? null : v)), 2600)
    return () => clearTimeout(t)
  }, [aviso])
  if (!visible) return null
  return <div className="aviso" key={visible.n}>{visible.texto}</div>
}

const CONTROLES: [string, string][] = [
  ['w a s d', 'moverse (mayús corre)'],
  ['ratón', 'mirar'],
  ['rueda', 'acercar la vista'],
  ['clic', 'sacar un libro, coger de la mesa, colocar en un hueco, usar el ordenador'],
  ['t', 'todo lo de la mesa al carro'],
  ['c', 'dejar o coger el carro'],
  ['o', 'ordenar la estantería que miras'],
  ['g', 'flechas del suelo'],
  ['esc', 'pausa'],
]

function Controles() {
  return (
    <ul className="lista-controles">
      {CONTROLES.map(([k, t]) => <li key={k}><kbd>{k}</kbd><span>{t}</span></li>)}
    </ul>
  )
}

function Portada() {
  return (
    <div className="portada" onClick={entrar}>
      <div className="caja">
        <h1>bibliotec.</h1>
        <p>haz clic para entrar.</p>
        <Controles />
      </div>
    </div>
  )
}

function Pausa() {
  const config = useEstado(e => e.config)
  const [pestana, setPestana] = useState<'controles' | 'ajustes'>('controles')
  const seguir = () => { cambiarEstado({ pausa: false }); entrar() }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.code === 'Escape') seguir() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  return (
    <div className="velo-pausa">
      <div className="pausa">
        <h1>pausa.</h1>
        <div className="pestanas">
          <button className={pestana === 'controles' ? 'activa' : ''} onClick={() => setPestana('controles')}>controles.</button>
          <button className={pestana === 'ajustes' ? 'activa' : ''} onClick={() => setPestana('ajustes')}>ajustes.</button>
        </div>
        {pestana === 'controles' ? <Controles /> : (
          <div className="ajustes">
            <label>
              <span>sensibilidad del ratón.</span>
              <input type="range" min={0.3} max={2} step={0.05} value={config.sensibilidad} onChange={e => cambiarAjuste('sensibilidad', Number(e.target.value))} />
            </label>
            <div className="ajuste">
              <span>calidad gráfica.</span>
              <div className="pestanas">
                {(['alta', 'baja'] as const).map(c => (
                  <button key={c} className={config.calidad === c ? 'activa' : ''} onClick={() => cambiarAjuste('calidad', c)}>{c}.</button>
                ))}
              </div>
            </div>
            <div className="ajuste">
              <span>sonido.</span>
              <button className={config.sonido ? 'activa' : ''} onClick={() => cambiarAjuste('sonido', !config.sonido)}>{config.sonido ? 'sí.' : 'no.'}</button>
            </div>
            <div className="ajuste">
              <span>flechas en el suelo.</span>
              <button className={config.guiaSuelo ? 'activa' : ''} onClick={alternarGuiaSuelo}>{config.guiaSuelo ? 'sí.' : 'no.'}</button>
            </div>
          </div>
        )}
        <button className="principal" onClick={seguir}>seguir.</button>
        <p className="pista">esc también vuelve al juego.</p>
      </div>
    </div>
  )
}

export function Interfaz({ libros, cartas, sellados }: { libros: Libro[]; cartas: Carta[]; sellados: Sellado[] }) {
  const dentro = useEstado(e => e.dentro)
  const abierto = useEstado(e => e.abierto)
  const apuntado = useEstado(e => e.apuntado)
  const terminal = useEstado(e => e.terminal)
  const menuOrden = useEstado(e => e.menuOrden)
  const pausa = useEstado(e => e.pausa)
  const inicio = useEstado(e => e.inicio)
  const editar = useEstado(e => e.editarPortada)
  const pendientes = useEstado(e => e.coleccion.pendientes)
  const carro = useEstado(e => e.coleccion.carro)
  const cajaAbierta = useEstado(e => e.cajaAbierta)
  const guardarEnCaja = useEstado(e => e.guardarEnCaja)
  const libro = abierto ? libros.find(l => l.id === abierto) : null
  const carta = abierto ? cartas.find(c => c.id === abierto) : null
  const sellado = abierto ? sellados.find(s => s.id === abierto) : null
  const cartaGuardar = guardarEnCaja ? cartas.find(c => c.id === guardarEnCaja) : null
  const mirando = libro || carta || sellado
  const libroEditar = editar ? libros.find(l => l.id === editar) : null

  // Tras un menú, el navegador a veces no devuelve el ratón al momento: basta
  // un clic, sin volver a enseñar todas las instrucciones.
  useEffect(() => {
    const fallo = () => cambiarEstado({ aviso: { texto: 'haz clic otra vez para seguir.', n: Date.now() } })
    document.addEventListener('pointerlockerror', fallo)
    return () => document.removeEventListener('pointerlockerror', fallo)
  }, [])

  const pista = !apuntado ? null
    : apuntado === 'terminal' ? <><kbd>clic</kbd> usar el ordenador</>
    : apuntado === 'carro' ? <><kbd>clic</kbd> coger el carro</>
    : apuntado.startsWith('caja:') ? <><kbd>clic</kbd> abrir la caja</>
    : apuntado.startsWith('carta_') ? <><kbd>clic</kbd> mirar <kbd>o</kbd> ordenar el expositor</>
    : apuntado.startsWith('sellado_') ? <><kbd>clic</kbd> mirar</>
    : apuntado.startsWith('hueco:') ? <><kbd>clic</kbd> colocar aquí</>
    : pendientes.includes(apuntado) ? <><kbd>clic</kbd> al carro <kbd>t</kbd> todos al carro</>
    : carro.includes(apuntado) ? <>en el carro. busca su hueco iluminado.</>
    : <><kbd>clic</kbd> sacar <kbd>o</kbd> ordenar esta estantería</>

  const sinNada = !dentro && !terminal && !menuOrden && !pausa && !libroEditar && !cajaAbierta && !cartaGuardar
  return (
    <>
      {dentro && !mirando && <div className={`mirilla ${apuntado ? 'activa' : ''}`} />}
      {dentro && !mirando && pista && <div className="pista-mirilla">{pista}</div>}
      {dentro && !mirando && <Marcador />}
      <Aviso />
      {libro && dentro && <Ficha libro={libro} />}
      {carta && dentro && <FichaCarta carta={carta} />}
      {sellado && dentro && <FichaSellado sellado={sellado} />}
      {cajaAbierta && <CajaAbierta id={cajaAbierta} cartas={cartas} />}
      {cartaGuardar && <ElegirCaja carta={cartaGuardar} />}
      {terminal && <Terminal />}
      {menuOrden === 'pokemon' && <MenuOrdenCartas />}
      {menuOrden && menuOrden !== 'pokemon' && <MenuOrden seccion={menuOrden} />}
      {libroEditar && <EditorPortada libro={libroEditar} />}
      {pausa && <Pausa />}
      {sinNada && inicio && <Portada />}
      {sinNada && !inicio && <div className="seguir" onClick={entrar}>haz clic para seguir.</div>}
    </>
  )
}
