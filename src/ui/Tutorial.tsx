import { useEffect } from 'react'
import { avisar, cambiarEstado, hechosHoy, leerEstado, suscribir, useEstado } from '../estado'
import { control, huecoDe } from '../escena/registro'
import { sonar } from '../sonido'

export const PASOS = [
  'muévete con w a s d y mira alrededor con el ratón.',
  've a la mesa de la entrada y haz clic en un libro: irá al carro.',
  'sigue las flechas del suelo hasta el hueco que brilla.',
  'apunta al hueco que brilla y haz clic para colocar el libro.',
  'mira un libro de cerca: apúntalo en una estantería y haz clic. el clic derecho lo devuelve.',
  'abre el ordenador retro, a la izquierda de la entrada, con un clic. prueba a escribir ayuda.',
]
const MOVER = 0, COGER = 1, FLECHAS = 2, COLOCAR = 3, MIRAR = 4, ORDENADOR = 5

export function pasoActual(hechos: number[]) {
  const i = PASOS.findIndex((_, n) => !hechos.includes(n))
  return i === -1 ? null : i
}

export function empezarTutorial() {
  cambiarEstado({ tutorial: { activo: true, hechos: [] } })
}

export function saltarTutorial() {
  cambiarEstado({ tutorial: { activo: false, hechos: PASOS.map((_, i) => i) } })
}

function marcar(...pasos: number[]) {
  const t = leerEstado().tutorial
  const nuevos = pasos.filter(p => !t.hechos.includes(p))
  if (!t.activo || !nuevos.length) return
  const hechos = [...t.hechos, ...nuevos]
  const siguiente = pasoActual(hechos)
  cambiarEstado({ tutorial: { activo: siguiente !== null, hechos } })
  sonar.logro()
  avisar(siguiente === null ? 'listo: ya sabes lo básico. el resto está en la pausa (esc).' : 'hecho.')
}

// Los pasos se completan al hacerlos, en el orden que sea: se vigila el estado
// y la posición de la cámara en vez de tocar cada acción del jugador.
export function VigilarTutorial() {
  const activo = useEstado(e => e.tutorial.activo)

  useEffect(() => {
    if (!activo) return
    let carroAntes = leerEstado().coleccion.carro.length
    let hoyAntes = hechosHoy()
    let origen: { x: number; z: number } | null = null

    const revisar = () => {
      const e = leerEstado()
      if (!e.tutorial.activo) return
      const carro = e.coleccion.carro.length, hoy = hechosHoy()
      if (carro > carroAntes) marcar(COGER)
      if (hoy > hoyAntes) marcar(COGER, FLECHAS, COLOCAR)
      carroAntes = carro
      hoyAntes = hoy
      if (e.abierto && !e.abierto.startsWith('carta_') && !e.abierto.startsWith('sellado_') && !e.coleccion.pendientes.includes(e.abierto)) marcar(MIRAR)
      if (e.terminal) marcar(ORDENADOR)
      // Sin nada en la mesa ni en el carro no hay nada que colocar: esos pasos no aplican.
      if (e.dentro && !e.coleccion.pendientes.length && !carro) marcar(COGER, FLECHAS, COLOCAR)
    }

    const vigilar = setInterval(() => {
      const cam = control.camara
      const e = leerEstado()
      if (!cam || !e.dentro || !e.tutorial.activo) return
      origen ??= { x: cam.position.x, z: cam.position.z }
      if (Math.hypot(cam.position.x - origen.x, cam.position.z - origen.z) > 1.2) marcar(MOVER)
      const cerca = e.coleccion.carro.some(id => {
        const h = huecoDe(id)
        return h && Math.hypot(h.posicion[0] - cam.position.x, h.posicion[2] - cam.position.z) < 2
      })
      if (cerca) marcar(FLECHAS)
    }, 250)

    const quitar = suscribir(revisar)
    return () => { quitar(); clearInterval(vigilar) }
  }, [activo])

  return null
}

export function PasoTutorial() {
  const hechos = useEstado(e => e.tutorial.hechos)
  const paso = pasoActual(hechos)
  if (paso === null) return null
  return (
    <section className="tutorial">
      <span>primera partida. {paso + 1} de {PASOS.length}.</span>
      <p>{PASOS[paso]}</p>
      <span className="puntos">{PASOS.map((_, i) => <i key={i} className={hechos.includes(i) ? 'hecho' : i === paso ? 'ahora' : ''} />)}</span>
      <small>se puede saltar desde la pausa (esc).</small>
    </section>
  )
}
