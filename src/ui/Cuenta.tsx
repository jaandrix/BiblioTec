import { useState } from 'react'
import { anadirCarta, anadirPendiente, anadirSellado, avisar, cambiarEnlace, cambiarEstado, leerEstado, quitarEjemplos, useEstado, type ItemBitacora } from '../estado'
import { entrar } from '../escena/registro'
import { cambiarClave, cartaDesdeBitacora, crearCuenta, entrarConCorreo, libroDesdeBitacora, medioDesdeBitacora, recordarClave, salirDeLaCuenta, selladoDesdeBitacora, traerDeBitacora } from '../sincronizar'

export function Acceso() {
  const [modo, setModo] = useState<'entrar' | 'crear' | 'recordar' | 'nueva'>(() => (window.location.hash.includes('type=recovery') ? 'nueva' : 'entrar'))
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setOcupado(true)
    setMensaje(null)
    const error = modo === 'entrar' ? await entrarConCorreo(email, clave)
      : modo === 'crear' ? await crearCuenta(email, clave)
        : modo === 'recordar' ? await recordarClave(email)
          : await cambiarClave(clave)
    setOcupado(false)
    if (error) { setMensaje(error); return }
    if (modo === 'crear') setMensaje('listo. te he enviado un correo: confírmalo y vuelve a entrar aquí.')
    if (modo === 'recordar') setMensaje('te he enviado un correo con un enlace para poner una contraseña nueva.')
    if (modo === 'nueva') { setMensaje('contraseña cambiada.'); setModo('entrar'); window.location.hash = '' }
  }

  return (
    <form className="acceso" onSubmit={enviar} onClick={e => e.stopPropagation()}>
      {modo !== 'nueva' && (
        <div className="pestanas">
          <button type="button" className={modo === 'entrar' ? 'activa' : ''} onClick={() => setModo('entrar')}>entrar.</button>
          <button type="button" className={modo === 'crear' ? 'activa' : ''} onClick={() => setModo('crear')}>crear cuenta.</button>
        </div>
      )}
      {modo !== 'nueva' && <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="correo" autoComplete="email" />}
      {modo !== 'recordar' && <input type="password" required minLength={modo === 'entrar' ? 1 : 8} value={clave} onChange={e => setClave(e.target.value)} placeholder={modo === 'nueva' ? 'contraseña nueva' : 'contraseña'} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} />}
      <button type="submit" className="principal" disabled={ocupado}>
        {ocupado ? 'un momento…' : modo === 'entrar' ? 'entrar.' : modo === 'crear' ? 'crear cuenta.' : modo === 'recordar' ? 'enviar enlace.' : 'guardar contraseña.'}
      </button>
      {mensaje && <p className="mensaje">{mensaje}</p>}
      {modo === 'entrar' && <button type="button" className="enlace" onClick={() => setModo('recordar')}>¿olvidaste la contraseña?</button>}
      {modo === 'recordar' && <button type="button" className="enlace" onClick={() => setModo('entrar')}>volver.</button>}
    </form>
  )
}

export function AjustesCuenta() {
  const cuenta = useEstado(e => e.cuenta)
  const enlace = useEstado(e => e.enlace)
  const ejemplos = useEstado(e => e.config.ejemplos)
  const [codigo, setCodigo] = useState(enlace.codigo ?? '')
  return (
    <div className="ajustes">
      <div className="ajuste">
        <span>{cuenta ? cuenta.email : 'sin cuenta: se guarda solo en este navegador.'}</span>
        {cuenta && <button onClick={() => salirDeLaCuenta()}>cerrar sesión.</button>}
      </div>
      <form className="ajuste codigo-bitacora" onSubmit={e => { e.preventDefault(); cambiarEnlace({ codigo: codigo.trim() || null }); if (codigo.trim()) traerDeBitacora() }}>
        <span>código de bitácora.</span>
        <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="pégalo aquí" spellCheck={false} />
        <button type="submit">{enlace.codigo ? 'sincronizar.' : 'conectar.'}</button>
      </form>
      <p className="nota-ajuste">en bitácora: ajustes, conexiones, «bibliotec.». solo lee tus libros y cartas.{enlace.ultima ? ` última vez: ${new Date(enlace.ultima).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}.` : ''}</p>
      {ejemplos && (
        <div className="ajuste">
          <span>libros y cartas de ejemplo.</span>
          <button onClick={() => { if (confirm('¿Quitar los libros y cartas de ejemplo? Lo tuyo se queda.')) quitarEjemplos() }}>quitarlos.</button>
        </div>
      )}
    </div>
  )
}

const CLASES: Record<ItemBitacora['clase'], string> = { libro: 'libro', pelicula: 'película', serie: 'serie', videojuego: 'videojuego', carta: 'carta', sellado: 'sellado', incompleta: 'carta sin identificar' }
const PLURALES: Partial<Record<ItemBitacora['clase'], string>> = { libro: 'ningún libro', pelicula: 'ninguna película', serie: 'ninguna serie', videojuego: 'ningún videojuego' }

async function aceptar(item: ItemBitacora) {
  if (item.clase === 'libro') anadirPendiente(await libroDesdeBitacora(item))
  else if (item.clase === 'pelicula' || item.clase === 'serie' || item.clase === 'videojuego') anadirPendiente(medioDesdeBitacora(item))
  else if (item.clase === 'carta') {
    const carta = await cartaDesdeBitacora(item)
    if (!carta) { avisar(`no encuentro «${item.titulo}» en tcgdex.`); return false }
    anadirCarta(carta)
  } else if (item.clase === 'sellado') anadirSellado(selladoDesdeBitacora(item))
  return true
}

function decidido(id: string, archivar: boolean) {
  const { enlace, revision } = leerEstado()
  cambiarEnlace({ vistos: [...enlace.vistos, id], archivo: archivar ? [...enlace.archivo, id] : enlace.archivo })
  cambiarEstado({ revision: revision.filter(r => r.id !== id) })
}

export function Revision() {
  const items = useEstado(e => e.revision)
  const ejemplos = useEstado(e => e.config.ejemplos)
  const [trabajando, setTrabajando] = useState<string | null>(null)
  const cerrar = () => { cambiarEstado({ verRevision: false }); entrar() }

  const lo = async (item: ItemBitacora, tengo: boolean) => {
    setTrabajando(item.id)
    if (tengo && !(await aceptar(item))) { setTrabajando(null); return }
    decidido(item.id, !tengo)
    setTrabajando(null)
  }
  const todo = async () => {
    for (const it of items.filter(i => i.clase !== 'incompleta')) await lo(it, true)
  }

  return (
    <div className="velo-pausa">
      <div className="editor-portada revision">
        <h2>llegan de bitácora.</h2>
        <p>¿lo tienes en físico? lo que tengas irá a la mesa de la entrada (libros, películas, series y juegos) o a la zona pokémon (las cartas). lo que no, queda apuntado para el archivo.</p>
        {ejemplos && <button className="quitar-ejemplos" onClick={quitarEjemplos}>quitar antes los libros y cartas de ejemplo.</button>}
        <div className="atajos-revision">
          {(Object.keys(PLURALES) as ItemBitacora['clase'][]).filter(c => items.filter(i => i.clase === c).length >= 3).map(c => (
            <button key={c} disabled={!!trabajando} onClick={() => items.filter(i => i.clase === c).forEach(i => decidido(i.id, true))}>no tengo {PLURALES[c]} de estos.</button>
          ))}
        </div>
        <div className="lista-revision">
          {items.length === 0 && <p className="nota">todo revisado.</p>}
          {items.map(it => (
            <div key={it.id} className="item-revision">
              <div>
                <b>{it.titulo}</b>
                <small>{CLASES[it.clase]}. {it.detalle}</small>
              </div>
              {it.clase === 'incompleta' ? (
                <button disabled={trabajando === it.id} onClick={() => cambiarEstado({ revision: leerEstado().revision.filter(r => r.id !== it.id) })}>más tarde.</button>
              ) : (
                <div className="botones">
                  <button disabled={!!trabajando} className="si" onClick={() => lo(it, true)}>{trabajando === it.id ? '…' : 'lo tengo.'}</button>
                  <button disabled={!!trabajando} onClick={() => lo(it, false)}>no.</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="pie">
          {items.some(i => i.clase !== 'incompleta') && <button disabled={!!trabajando} onClick={todo}>lo tengo todo.</button>}
          <button className="principal" onClick={cerrar}>cerrar.</button>
        </div>
      </div>
    </div>
  )
}
