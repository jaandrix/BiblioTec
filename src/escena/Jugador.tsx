import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { cambiarEstado, leerEstado } from '../estado'
import type { Caja } from '../tipos'
import { SALA } from './distribucion'
import { control, huecoDe, interactivos, mallasLibros } from './registro'

const RADIO = 0.28
const ALTURA_OJOS = 1.6
const VELOCIDAD = 2.4
const CORRER = 4.2
const ALCANCE = 2.2

function choca(x: number, z: number, cajas: Caja[]) {
  const lim = { x: SALA.ancho / 2 - RADIO, z: SALA.fondo / 2 - RADIO }
  if (Math.abs(x) > lim.x || Math.abs(z) > lim.z) return true
  return cajas.some(c => {
    const cx = Math.max(c.min[0], Math.min(x, c.max[0]))
    const cz = Math.max(c.min[1], Math.min(z, c.max[1]))
    return (x - cx) ** 2 + (z - cz) ** 2 < RADIO * RADIO
  })
}

export function Jugador({ cajas }: { cajas: Caja[] }) {
  const { camera, gl } = useThree()
  const teclas = useRef(new Set<string>())
  const rayo = useMemo(() => new Raycaster(), [])
  const centro = useMemo(() => new Vector2(0, 0), [])
  const dir = useMemo(() => new Vector3(), [])
  const lado = useMemo(() => new Vector3(), [])

  useEffect(() => {
    camera.position.set(0.8, ALTURA_OJOS, 2.8)
    camera.lookAt(0, 1.3, -2)
    const mando = new PointerLockControls(camera, gl.domElement)
    control.mando = mando
    control.camara = camera as PerspectiveCamera
    if (import.meta.env.DEV) Object.assign(window, { __bibliotec: { control, cambiarEstado, leerEstado, mallasLibros } })
    const alEntrar = () => cambiarEstado({ dentro: true, terminal: false, menuOrden: null })
    const alSalir = () => cambiarEstado({ dentro: false, apuntado: null })
    mando.addEventListener('lock', alEntrar)
    mando.addEventListener('unlock', alSalir)

    const abajo = (e: KeyboardEvent) => {
      teclas.current.add(e.code)
      if (e.code === 'KeyO' && mando.isLocked) {
        const { apuntado } = leerEstado()
        const hueco = apuntado ? huecoDe(apuntado) : null
        if (!hueco) return
        cambiarEstado({ menuOrden: hueco.seccion, apuntado: null })
        mando.unlock()
      }
    }
    const arriba = (e: KeyboardEvent) => teclas.current.delete(e.code)
    const perderFoco = () => teclas.current.clear()
    const clic = (e: MouseEvent) => {
      if (e.button !== 0 || !mando.isLocked) return
      const { apuntado } = leerEstado()
      if (!apuntado) return
      if (apuntado === 'terminal') cambiarEstado({ terminal: true, apuntado: null })
      else cambiarEstado({ abierto: apuntado, apuntado: null })
      mando.unlock()
    }
    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    window.addEventListener('blur', perderFoco)
    document.addEventListener('mousedown', clic)
    return () => {
      mando.removeEventListener('lock', alEntrar)
      mando.removeEventListener('unlock', alSalir)
      mando.disconnect()
      control.mando = null
      window.removeEventListener('keydown', abajo)
      window.removeEventListener('keyup', arriba)
      window.removeEventListener('blur', perderFoco)
      document.removeEventListener('mousedown', clic)
    }
  }, [camera, gl])

  useFrame((_, dt) => {
    const { dentro, abierto, terminal, menuOrden } = leerEstado()
    if (!dentro || abierto || terminal || menuOrden) return
    const t = teclas.current
    const avance = (t.has('KeyW') || t.has('ArrowUp') ? 1 : 0) - (t.has('KeyS') || t.has('ArrowDown') ? 1 : 0)
    const giro = (t.has('KeyD') || t.has('ArrowRight') ? 1 : 0) - (t.has('KeyA') || t.has('ArrowLeft') ? 1 : 0)
    if (avance || giro) {
      camera.getWorldDirection(dir)
      dir.y = 0
      dir.normalize()
      lado.crossVectors(dir, camera.up)
      const v = (t.has('ShiftLeft') || t.has('ShiftRight') ? CORRER : VELOCIDAD) * Math.min(dt, 0.05)
      const mov = dir.multiplyScalar(avance).addScaledVector(lado, giro).normalize().multiplyScalar(v)
      // Por ejes separados, para deslizar a lo largo de una estantería en vez de pararse en seco.
      if (!choca(camera.position.x + mov.x, camera.position.z, cajas)) camera.position.x += mov.x
      if (!choca(camera.position.x, camera.position.z + mov.z, cajas)) camera.position.z += mov.z
    }
    rayo.setFromCamera(centro, camera)
    rayo.far = ALCANCE
    const golpe = rayo.intersectObjects([...mallasLibros.values(), ...interactivos.values()], true)[0]
    cambiarEstado({ apuntado: (golpe?.object.userData.id as string) ?? null })
  })

  return null
}
