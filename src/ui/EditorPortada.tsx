import { useEffect, useState } from 'react'
import { avisar, cambiarEstado, ponerPortada, useEstado } from '../estado'
import { entrar } from '../escena/registro'
import type { Libro } from '../tipos'

const LADO = 700

// La foto se reduce y se guarda como JPEG dentro del navegador: una portada de
// móvil pesa megas y el almacenamiento local no da para muchas así.
function reducirFoto(archivo: File): Promise<string> {
  return new Promise((ok, mal) => {
    const img = new Image()
    img.onload = () => {
      const escala = Math.min(1, LADO / Math.max(img.width, img.height))
      const lienzo = document.createElement('canvas')
      lienzo.width = Math.round(img.width * escala)
      lienzo.height = Math.round(img.height * escala)
      lienzo.getContext('2d')!.drawImage(img, 0, 0, lienzo.width, lienzo.height)
      URL.revokeObjectURL(img.src)
      ok(lienzo.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = mal
    img.src = URL.createObjectURL(archivo)
  })
}

function obraDe(libro: Libro) {
  const m = libro.id.match(/OL\d+W/)
  return m ? m[0] : null
}

export function EditorPortada({ libro }: { libro: Libro }) {
  const actual = useEstado(e => e.coleccion.portadas[libro.id] ?? libro.portada)
  const [ediciones, setEdiciones] = useState<string[] | null>(null)
  const [enlace, setEnlace] = useState('')

  useEffect(() => {
    const obra = obraDe(libro)
    if (!obra) { setEdiciones([]); return }
    fetch(`https://openlibrary.org/works/${obra}/editions.json?limit=60`)
      .then(r => r.json())
      .then(d => {
        const ids = new Set<number>()
        for (const e of d.entries ?? []) for (const c of e.covers ?? []) if (c > 0) ids.add(c)
        setEdiciones([...ids].slice(0, 24).map(c => `https://covers.openlibrary.org/b/id/${c}-L.jpg`))
      })
      .catch(() => setEdiciones([]))
  }, [libro])

  const cerrar = () => { cambiarEstado({ editarPortada: null }); entrar() }
  const elegir = (url: string | null) => { ponerPortada(libro.id, url); avisar('portada cambiada.'); cerrar() }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.code === 'Escape') cerrar() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  return (
    <div className="velo-pausa" onMouseDown={e => { if (e.target === e.currentTarget) cerrar() }}>
      <div className="editor-portada">
        <div className="cabecera">
          {actual && <img src={actual} alt="" />}
          <div>
            <h2>portada de {libro.titulo}.</h2>
            <p>elige la de tu edición, sube una foto o pega un enlace.</p>
          </div>
        </div>
        <h3>otras ediciones.</h3>
        <div className="ediciones">
          {ediciones === null && <p className="nota">buscando…</p>}
          {ediciones?.length === 0 && <p className="nota">no hay más ediciones con portada en open library.</p>}
          {ediciones?.map(u => (
            <button key={u} className={u === actual ? 'activa' : ''} onClick={() => elegir(u)}>
              <img src={u.replace('-L.jpg', '-M.jpg')} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <div className="otras">
          <label className="boton">
            subir una foto.
            <input type="file" accept="image/*" hidden onChange={async e => {
              const f = e.target.files?.[0]
              if (f) elegir(await reducirFoto(f))
            }} />
          </label>
          <form onSubmit={e => { e.preventDefault(); if (/^https?:\/\//.test(enlace)) elegir(enlace) }}>
            <input value={enlace} onChange={e => setEnlace(e.target.value)} placeholder="o pega el enlace de una imagen" />
            <button type="submit">usar.</button>
          </form>
        </div>
        <div className="pie">
          <button onClick={() => elegir(null)}>volver a la original.</button>
          <button className="principal" onClick={cerrar}>cerrar.</button>
        </div>
      </div>
    </div>
  )
}
