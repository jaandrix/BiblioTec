import { leerEstado } from './estado'

let ctx: AudioContext | null = null

function audio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tono(frecuencia: number, retraso = 0, duracion = 0.09, volumen = 0.12) {
  if (!leerEstado().config.sonido) return
  const a = audio()
  if (!a) return
  const t = a.currentTime + retraso
  const osc = a.createOscillator()
  const gan = a.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frecuencia, t)
  osc.frequency.exponentialRampToValueAtTime(frecuencia * 0.6, t + duracion)
  gan.gain.setValueAtTime(0.0001, t)
  gan.gain.exponentialRampToValueAtTime(volumen, t + 0.008)
  gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion)
  osc.connect(gan).connect(a.destination)
  osc.start(t)
  osc.stop(t + duracion + 0.02)
}

// Sonidos de Kenney (RPG Audio, CC0). Se descargan al primer uso; mientras
// tanto, o si el navegador no sabe leer ogg, suena el tono sintetizado.
const MUESTRAS = ['bookOpen', 'bookClose', 'bookFlip1', 'bookFlip2', 'bookPlace1', 'bookPlace2', 'bookPlace3', 'footstep00', 'footstep01', 'footstep02', 'footstep03', 'footstep04'] as const
type Muestra = (typeof MUESTRAS)[number]
const buferes = new Map<Muestra, AudioBuffer>()
let cargando = false

function cargar(a: AudioContext) {
  if (cargando) return
  cargando = true
  for (const m of MUESTRAS) {
    fetch(`${import.meta.env.BASE_URL}recursos/sonidos/${m}.ogg`)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.statusText))))
      .then(d => a.decodeAudioData(d))
      .then(b => { buferes.set(m, b) })
      .catch(() => { /* se queda el tono */ })
  }
}

function muestra(nombres: Muestra[], volumen: number, alternativa?: () => void) {
  if (!leerEstado().config.sonido) return
  const a = audio()
  if (!a) return
  cargar(a)
  const b = buferes.get(nombres[Math.floor(Math.random() * nombres.length)])
  if (!b) { alternativa?.(); return }
  const fuente = a.createBufferSource()
  const gan = a.createGain()
  fuente.buffer = b
  fuente.playbackRate.value = 0.94 + Math.random() * 0.12
  gan.gain.value = volumen
  fuente.connect(gan).connect(a.destination)
  fuente.start()
}

const PASOS: Muestra[] = ['footstep00', 'footstep01', 'footstep02', 'footstep03', 'footstep04']

export const sonar = {
  coger: () => muestra(['bookFlip1', 'bookFlip2'], 0.5, () => tono(520, 0, 0.07, 0.08)),
  colocar: () => { muestra(['bookPlace1', 'bookPlace2', 'bookPlace3'], 0.6); tono(660, 0.07, 0.12, 0.05) },
  error: () => tono(180, 0, 0.14, 0.08),
  sacar: () => muestra(['bookOpen'], 0.5, () => { tono(700, 0, 0.05, 0.05); tono(420, 0.04, 0.08, 0.05) }),
  devolver: () => muestra(['bookClose'], 0.45),
  paso: () => muestra(PASOS, 0.16),
  logro: () => { tono(523, 0, 0.1, 0.06); tono(784, 0.09, 0.16, 0.06) },
  tecla: () => tono(1800 + Math.random() * 400, 0, 0.025, 0.03),
}
