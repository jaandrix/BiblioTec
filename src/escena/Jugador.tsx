import { advance, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { MathUtils, PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { alCarro, alternarGuiaSuelo, avisar, cambiarEstado, colocar, hechosHoy, leerEstado, MAX_CARRO } from '../estado'
import { sonar } from '../sonido'
import type { Caja } from '../tipos'
import { cajaCarroAparcado, cartChoca } from './Carro'
import { SALA } from './distribucion'
import { control, giroInspeccion, huecoDe, interactivos, mallasLibros, soltadoPropio, soltar } from './registro'

const RADIO = 0.28
const ALTURA_OJOS = 1.6
const VELOCIDAD = 2.4
const CORRER = 4.2
const ALCANCE = 2.2
const FOV = 62
const FOV_MIN = 22
const CARRO_CERCA = 3.5

export const zoom = { objetivo: FOV, base: FOV }

function choca(x: number, z: number, cajas: Caja[]) {
  const lim = { x: SALA.ancho / 2 - RADIO, z: SALA.fondo / 2 - RADIO }
  if (Math.abs(x) > lim.x || Math.abs(z) > lim.z) return true
  return cajas.some(c => {
    const cx = Math.max(c.min[0], Math.min(x, c.max[0]))
    const cz = Math.max(c.min[1], Math.min(z, c.max[1]))
    return (x - cx) ** 2 + (z - cz) ** 2 < RADIO * RADIO
  })
}

function distanciaAlCarro() {
  const c = control.carro, cam = control.camara
  if (!c || !cam) return Infinity
  return Math.hypot(c.position.x - cam.position.x, c.position.z - cam.position.z)
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
    if (import.meta.env.DEV) Object.assign(window, { __bibliotec: { control, cambiarEstado, leerEstado, mallasLibros, pasar: (n = 30) => { for (let i = 0; i < n; i++) advance(performance.now() + i * 16) }, medir: (n = 20) => { gl.info.autoReset = false; gl.info.reset(); const t = performance.now(); for (let i = 0; i < n; i++) advance(performance.now() + i * 16); const ms = (performance.now() - t) / n; const r = { ms: +ms.toFixed(1), llamadas: Math.round(gl.info.render.calls / n), triangulos: Math.round(gl.info.render.triangles / n), texturas: gl.info.memory.textures, programas: gl.info.programs?.length }; gl.info.autoReset = true; return r } } })

    const alEntrar = () => cambiarEstado({ dentro: true, terminal: false, menuOrden: null, pausa: false, inicio: false, editarPortada: null, cajaAbierta: null, guardarEnCaja: null, verRevision: false })
    const alSalir = () => {
      if (soltadoPropio.activo) {
        soltadoPropio.activo = false
        cambiarEstado({ dentro: false, apuntado: null })
        return
      }
      // Lo ha soltado el navegador (esc): pausa, y el libro que mirabas vuelve a su sitio.
      cambiarEstado({ dentro: false, apuntado: null, abierto: null, pausa: !leerEstado().inicio })
    }
    mando.addEventListener('lock', alEntrar)
    mando.addEventListener('unlock', alSalir)

    const cogerAlCarro = (ids: string[]) => {
      if (!leerEstado().llevoCarro) { sonar.error(); avisar('ve a por el carro (c) para llevar libros.'); return }
      const libres = MAX_CARRO - leerEstado().coleccion.carro.length
      if (libres <= 0) { sonar.error(); avisar('el carro está lleno. coloca algo primero.'); return }
      alCarro(ids)
      sonar.coger()
      const n = Math.min(libres, ids.length)
      avisar(n === 1 ? 'al carro. ahora sigue las flechas hasta su hueco.' : `${n} libros al carro. sigue las flechas.`)
    }

    const alternarCarro = () => {
      const { llevoCarro } = leerEstado()
      if (llevoCarro) {
        cambiarEstado({ llevoCarro: false })
        avisar('carro aparcado. pulsa c cerca de él para cogerlo.')
      } else if (distanciaAlCarro() < 2.2) {
        cambiarEstado({ llevoCarro: true })
        sonar.coger()
      } else {
        sonar.error()
        avisar('el carro está lejos. acércate a él.')
      }
    }

    const abajo = (e: KeyboardEvent) => {
      teclas.current.add(e.code)
      if (!mando.isLocked) return
      const { apuntado, coleccion, abierto } = leerEstado()
      if (abierto) {
        if (e.code === 'KeyF' || e.code === 'KeyR') giroInspeccion.volteo += Math.PI
        if (e.code === 'KeyE' || e.code === 'KeyQ') cambiarEstado({ abierto: null })
        if (e.code === 'KeyP' && !abierto.startsWith('carta_') && !abierto.startsWith('sellado_')) { cambiarEstado({ editarPortada: abierto }); soltar() }
        if (e.code === 'KeyB' && abierto.startsWith('carta_')) { cambiarEstado({ guardarEnCaja: abierto, abierto: null }); soltar() }
        return
      }
      if (e.code === 'KeyG') {
        alternarGuiaSuelo()
        avisar(leerEstado().config.guiaSuelo ? 'flechas del suelo encendidas.' : 'flechas del suelo apagadas.')
      }
      if (e.code === 'KeyC') alternarCarro()
      if (e.code === 'KeyE') accion()
      if (e.code === 'KeyV') vaciarCerca()
      if (e.code === 'KeyN') {
        if (!leerEstado().revision.length) { avisar('nada nuevo de bitácora.'); return }
        cambiarEstado({ verRevision: true })
        soltar()
      }
      if (e.code === 'KeyT' && apuntado && coleccion.pendientes.includes(apuntado)) cogerAlCarro(coleccion.pendientes)
      if (e.code === 'KeyO' && apuntado?.startsWith('carta_')) {
        cambiarEstado({ menuOrden: 'pokemon', apuntado: null })
        soltar()
        return
      }
      if (e.code === 'KeyO') {
        const hueco = apuntado ? huecoDe(apuntado) : null
        if (!hueco) return
        cambiarEstado({ menuOrden: hueco.seccion, apuntado: null })
        soltar()
      }
    }
    const arriba = (e: KeyboardEvent) => teclas.current.delete(e.code)
    const perderFoco = () => teclas.current.clear()

    // Vaciar el carro aquí: los libros cuyo hueco está a menos de 3 m vuelan a
    // su sitio uno tras otro (como reponer una balda en un simulador de tienda).
    const vaciarCerca = () => {
      const { coleccion, llevoCarro } = leerEstado()
      const cam = control.camara
      if (!cam || !coleccion.carro.length) { avisar('el carro está vacío.'); return }
      if (!llevoCarro && distanciaAlCarro() > CARRO_CERCA) { sonar.error(); avisar('el carro está lejos.'); return }
      const cerca = coleccion.carro.filter(id => {
        const h = huecoDe(id)
        return h && Math.hypot(h.posicion[0] - cam.position.x, h.posicion[2] - cam.position.z) < 3
      })
      if (!cerca.length) { sonar.error(); avisar('ningún libro del carro va en las estanterías de aquí. sigue las flechas.'); return }
      cerca.forEach((id, i) => setTimeout(() => { colocar([id]); sonar.colocar() }, i * 160))
      setTimeout(() => avisar(`${cerca.length} ${cerca.length === 1 ? 'libro colocado' : 'libros colocados'}. llevas ${hechosHoy()} hoy.`), cerca.length * 160)
    }

    const clic = (e: MouseEvent) => {
      if (!mando.isLocked) return
      // Clic derecho devuelve lo que tienes en la mano, como en los simuladores.
      if (e.button === 2) { if (leerEstado().abierto) cambiarEstado({ abierto: null }); return }
      if (e.button !== 0) return
      accion()
    }

    function accion() {
      const { apuntado, coleccion, abierto } = leerEstado()
      if (abierto) { cambiarEstado({ abierto: null }); return }
      if (!apuntado) return
      if (apuntado === 'carro') { alternarCarro(); return }
      if (apuntado.startsWith('caja:')) { cambiarEstado({ cajaAbierta: apuntado.slice(5), apuntado: null }); soltar(); return }
      if (apuntado.startsWith('hueco:')) {
        if (!leerEstado().llevoCarro && distanciaAlCarro() > CARRO_CERCA) { sonar.error(); avisar('el libro está en el carro y el carro está lejos.'); return }
        colocar([apuntado.slice(6)])
        sonar.colocar()
        const n = hechosHoy()
        avisar(leerEstado().coleccion.carro.length ? `en su sitio. llevas ${n} hoy.` : `carro vacío. ${n} ${n === 1 ? 'libro ordenado' : 'libros ordenados'} hoy.`)
        return
      }
      if (coleccion.pendientes.includes(apuntado)) { cogerAlCarro([apuntado]); return }
      if (coleccion.carro.includes(apuntado)) { avisar('busca su hueco: brilla en la estantería.'); return }
      if (apuntado === 'terminal') { cambiarEstado({ terminal: true, apuntado: null }); soltar(); return }
      giroInspeccion.x = 0
      giroInspeccion.y = 0
      giroInspeccion.volteo = 0
      giroInspeccion.distancia = 0.42
      sonar.sacar()
      cambiarEstado({ abierto: apuntado, apuntado: null })
    }
    const sinMenu = (e: MouseEvent) => { if (mando.isLocked) e.preventDefault() }

    // Con el libro en la mano el ratón sigue capturado: moverlo gira el libro
    // (como coger un objeto en un juego) en vez de girar la cabeza.
    const mover = (e: MouseEvent) => {
      if (!mando.isLocked || !leerEstado().abierto) return
      const s = leerEstado().config.sensibilidad
      giroInspeccion.volteo += e.movementX * 0.006 * s
      giroInspeccion.x = MathUtils.clamp(giroInspeccion.x + e.movementY * 0.006 * s, -1.3, 1.3)
    }

    const rueda = (e: WheelEvent) => {
      if (!mando.isLocked) return
      if (leerEstado().abierto) giroInspeccion.distancia = MathUtils.clamp(giroInspeccion.distancia + e.deltaY * 0.0006, 0.24, 0.8)
      else zoom.objetivo = MathUtils.clamp(zoom.objetivo + e.deltaY * 0.03, FOV_MIN, leerEstado().config.fov)
    }

    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    window.addEventListener('blur', perderFoco)
    document.addEventListener('mousedown', clic)
    document.addEventListener('contextmenu', sinMenu)
    document.addEventListener('mousemove', mover)
    window.addEventListener('wheel', rueda, { passive: true })
    return () => {
      mando.removeEventListener('lock', alEntrar)
      mando.removeEventListener('unlock', alSalir)
      mando.disconnect()
      control.mando = null
      window.removeEventListener('keydown', abajo)
      window.removeEventListener('keyup', arriba)
      window.removeEventListener('blur', perderFoco)
      document.removeEventListener('mousedown', clic)
      document.removeEventListener('contextmenu', sinMenu)
      document.removeEventListener('mousemove', mover)
      window.removeEventListener('wheel', rueda)
    }
  }, [camera, gl])

  useFrame((_, dt) => {
    const { dentro, abierto, terminal, menuOrden, config, llevoCarro, cajaAbierta, guardarEnCaja, verRevision } = leerEstado()
    const mando = control.mando
    const cam = camera as PerspectiveCamera
    if (mando) {
      mando.enabled = !abierto && !terminal
      mando.pointerSpeed = config.sensibilidad
    }
    giroInspeccion.y += (giroInspeccion.volteo - giroInspeccion.y) * (1 - Math.exp(-12 * dt))

    // El zoom es relativo al campo de visión elegido en los ajustes.
    if (zoom.objetivo > config.fov || zoom.base !== config.fov) { zoom.objetivo = Math.min(zoom.objetivo, config.fov); if (zoom.base !== config.fov) zoom.objetivo = config.fov; zoom.base = config.fov }
    const fov = abierto || terminal ? config.fov : zoom.objetivo
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov += (fov - cam.fov) * (1 - Math.exp(-10 * dt))
      cam.updateProjectionMatrix()
    }

    if (!dentro || abierto || terminal || menuOrden || cajaAbierta || guardarEnCaja || verRevision) return
    const t = teclas.current
    const avance = (t.has('KeyW') || t.has('ArrowUp') ? 1 : 0) - (t.has('KeyS') || t.has('ArrowDown') ? 1 : 0)
    const giro = (t.has('KeyD') || t.has('ArrowRight') ? 1 : 0) - (t.has('KeyA') || t.has('ArrowLeft') ? 1 : 0)
    if (avance || giro) {
      camera.getWorldDirection(dir)
      dir.y = 0
      dir.normalize()
      lado.crossVectors(dir, camera.up)
      const fx = dir.x, fz = dir.z
      const v = (t.has('ShiftLeft') || t.has('ShiftRight') ? CORRER : VELOCIDAD) * Math.min(dt, 0.05)
      const mov = dir.multiplyScalar(avance).addScaledVector(lado, giro).normalize().multiplyScalar(v)
      const todas = llevoCarro ? cajas : [...cajas, cajaCarroAparcado()]
      // Por ejes separados, para deslizar a lo largo de una estantería en vez de
      // pararse en seco. Si llevas el carro, tampoco puede meterse en nada.
      const libre = (x: number, z: number) => !choca(x, z, todas) && (!llevoCarro || !cartChoca(x + fx * 0.5, z + fz * 0.5, cajas))
      if (libre(camera.position.x + mov.x, camera.position.z)) camera.position.x += mov.x
      if (libre(camera.position.x, camera.position.z + mov.z)) camera.position.z += mov.z
    }
    rayo.setFromCamera(centro, camera)
    rayo.far = ALCANCE
    const golpe = rayo.intersectObjects([...mallasLibros.values(), ...interactivos.values()], true)[0]
    let id: string | null = (golpe?.object.userData.id as string | undefined) ?? null
    if (id && llevoCarro && id === 'carro') id = null
    if (id && llevoCarro && leerEstado().coleccion.carro.includes(id)) id = null
    cambiarEstado({ apuntado: id })
  })

  return null
}
