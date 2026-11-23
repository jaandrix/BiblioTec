import { useEffect } from 'react'
import { cambiarCriterio, cambiarEstado, useEstado } from '../estado'
import { control, entrar } from '../escena/registro'
import { CRITERIOS } from '../libros/orden'

export function MenuOrden({ seccion }: { seccion: string }) {
  const actual = useEstado(e => e.config.criterios[seccion] ?? 'autor')
  const s = control.biblioteca?.secciones.find(x => x.id === seccion)

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.code === 'Escape') cambiarEstado({ menuOrden: null }) }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  const cerrar = () => {
    cambiarEstado({ menuOrden: null })
    entrar()
  }

  return (
    <div className="menu-velo" onMouseDown={e => { e.stopPropagation(); if (e.target === e.currentTarget) cerrar() }}>
      <div className="menu-orden">
        <h2>ordenar {s?.nombre ?? seccion}.</h2>
        <p>{s?.libros.length ?? 0} libros. elige cómo.</p>
        <div className="opciones">
          {CRITERIOS.map(c => (
            <button
              key={c.id}
              className={c.id === actual ? 'activa' : ''}
              onClick={() => { cambiarCriterio(seccion, c.id); cerrar() }}
            >
              {c.nombre}.
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
