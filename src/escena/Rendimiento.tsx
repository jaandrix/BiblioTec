import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { avisar, cambiarAjuste, leerEstado } from '../estado'

// Las sombras solo las proyectan los muebles, que casi nunca se mueven: el
// mapa de sombras se calcula al cambiar la distribución (y un rato después,
// mientras se deslizan los muebles) en vez de en cada fotograma.
export function SombrasEstaticas({ version }: { version: unknown }) {
  const gl = useThree(s => s.gl)
  const pendientes = useRef(90)
  const calidad = leerEstado().config.calidad

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.enabled = calidad !== 'baja'
    pendientes.current = 90
  }, [gl, version, calidad])

  useFrame(() => {
    if (pendientes.current <= 0) return
    pendientes.current--
    gl.shadowMap.needsUpdate = true
  })
  return null
}

const NIVELES = ['alta', 'media', 'baja'] as const

// Si va a menos de 28 imágenes por segundo, baja un nivel de calidad y avisa.
// Solo baja, nunca sube sola, y deja de mirar si el usuario elige a mano.
export function CalidadAutomatica() {
  const medida = useRef({ tiempo: 0, fotogramas: 0, espera: 3 })
  useFrame((_, dt) => {
    const { dentro, pausa, config } = leerEstado()
    const m = medida.current
    if (!dentro || pausa || !config.calidadAuto) { m.tiempo = 0; m.fotogramas = 0; m.espera = 3; return }
    if (m.espera > 0) { m.espera -= dt; return }
    m.tiempo += dt
    m.fotogramas++
    if (m.tiempo < 2.5) return
    const fps = m.fotogramas / m.tiempo
    m.tiempo = 0
    m.fotogramas = 0
    const i = NIVELES.indexOf(config.calidad)
    if (fps < 28 && i < NIVELES.length - 1) {
      cambiarAjuste('calidad', NIVELES[i + 1])
      m.espera = 3
      avisar(`iba a ${Math.round(fps)} imágenes por segundo: he bajado la calidad a ${NIVELES[i + 1]}. puedes cambiarla en la pausa.`)
    }
  })
  return null
}
