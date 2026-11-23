import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Euler, Mesh, MeshStandardMaterial, Quaternion, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
import { colorDeLibro, colorDominante } from '../libros/color'
import { texturaLomo } from '../libros/lomo'
import { cambiarEstado, leerEstado, useEstado } from '../estado'
import type { Hueco } from '../tipos'
import { control, giroInspeccion, mallasLibros } from './registro'

const PAPEL = '#efe6d0'
const SACAR = 0.13
const DURACION_ABRIR = 0.7
const DURACION_CERRAR = 0.45
const DURACION_MOVER = 0.75
const ARRIBA = new Vector3(0, 1, 0)
const GIRO_PORTADA = new Quaternion().setFromAxisAngle(ARRIBA, -Math.PI / 2)
const cargador = new TextureLoader().setCrossOrigin('anonymous')

const curva = (t: number) => 1 - (1 - t) ** 3
const curvaSuave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

type Fase = 'reposo' | 'abriendo' | 'cerrando' | 'moviendo'

export function Libro({ hueco }: { hueco: Hueco }) {
  const { libro, posicion, medidas, giro, orden } = hueco
  const malla = useRef<Mesh>(null!)
  const apuntado = useEstado(e => e.apuntado === libro.id)
  const abierto = useEstado(e => e.abierto === libro.id)

  const materiales = useMemo(() => {
    const color = colorDeLibro(libro)
    const tapa = () => new MeshStandardMaterial({ color, roughness: 0.6, emissive: '#ffb347', emissiveIntensity: 0 })
    const papel = new MeshStandardMaterial({ color: PAPEL, roughness: 0.95 })
    // Orden de caras de BoxGeometry: +x (portada), -x (contra), +y, -y, +z (lomo), -z.
    return [tapa(), tapa(), papel, papel, tapa(), papel]
  }, [libro])

  const [grosor, alto] = medidas
  useEffect(() => {
    let vivo = true
    const pintar = (fondo: string) => {
      if (!vivo) return
      for (const i of [0, 1]) if (!materiales[i].map) materiales[i].color.set(fondo)
      document.fonts.load('600 20px Poppins').finally(() => {
        if (!vivo) return
        const lomo = materiales[4]
        lomo.map?.dispose()
        lomo.map = texturaLomo(libro, grosor, alto, fondo)
        lomo.color.set('#ffffff')
        lomo.needsUpdate = true
      })
    }
    pintar(colorDeLibro(libro))
    if (libro.portada) colorDominante(libro.portada).then(pintar).catch(() => {})
    return () => { vivo = false }
  }, [libro, materiales, grosor, alto])

  // La portada en alta solo se baja al abrir el libro.
  useEffect(() => {
    if (!abierto || !libro.portada || materiales[0].map) return
    cargador.load(libro.portada, tex => {
      tex.colorSpace = SRGBColorSpace
      tex.anisotropy = 8
      materiales[0].map = tex
      materiales[0].color.set('#ffffff')
      materiales[0].needsUpdate = true
    })
  }, [abierto, libro, materiales])

  useEffect(() => {
    const m = malla.current
    m.userData.id = libro.id
    mallasLibros.set(libro.id, m)
    return () => { mallasLibros.delete(libro.id) }
  }, [libro.id])

  const casa = useMemo(() => new Vector3(...posicion), [posicion])
  const normal = useMemo(() => new Vector3(Math.sin(giro), 0, Math.cos(giro)), [giro])
  const reposo = useMemo(() => new Quaternion().setFromAxisAngle(ARRIBA, giro), [giro])
  const fuera = useMemo(() => casa.clone().addScaledVector(normal, SACAR), [casa, normal])

  const anim = useRef({
    fase: 'reposo' as Fase,
    t: 0,
    duracion: 1,
    desdePos: new Vector3(),
    desdeRot: new Quaternion(),
    destinoPos: new Vector3(),
    destinoRot: new Quaternion(),
    normalDesde: new Vector3(),
    primera: true,
  })

  useEffect(() => {
    const a = anim.current
    const m = malla.current
    if (a.primera) {
      a.primera = false
      m.position.copy(casa)
      m.quaternion.copy(reposo)
      return
    }
    if (a.fase === 'abriendo' || leerEstado().abierto === libro.id) return
    // Recolocar al reordenar: en cascada, para que se vea la estantería moverse.
    a.desdePos.copy(m.position)
    a.desdeRot.copy(m.quaternion)
    a.normalDesde.set(0, 0, 1).applyQuaternion(m.quaternion)
    a.duracion = DURACION_MOVER
    a.t = -Math.min(orden * 0.018, 0.9) / DURACION_MOVER
    a.fase = 'moviendo'
  }, [casa, reposo, orden, libro.id])

  useEffect(() => {
    const a = anim.current
    const m = malla.current
    if (abierto) {
      a.desdePos.copy(m.position)
      a.desdeRot.copy(m.quaternion)
      const cam = control.camara!
      const delante = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion)
      const izquierda = new Vector3(-1, 0, 0).applyQuaternion(cam.quaternion)
      a.destinoPos.copy(cam.position).addScaledVector(delante, 0.42).addScaledVector(izquierda, 0.07)
      a.destinoRot.copy(cam.quaternion).multiply(GIRO_PORTADA)
      giroInspeccion.x = 0
      giroInspeccion.y = 0
      a.t = 0
      a.duracion = DURACION_ABRIR
      a.fase = 'abriendo'
      if (leerEstado().guia === libro.id) cambiarEstado({ guia: null })
    } else if (a.fase === 'abriendo' || !m.position.equals(casa)) {
      if (a.fase === 'moviendo') return
      a.desdePos.copy(m.position)
      a.desdeRot.copy(m.quaternion)
      a.t = 0
      a.duracion = DURACION_CERRAR
      a.fase = 'cerrando'
    }
  }, [abierto, casa, libro.id])

  const tmpRot = useMemo(() => new Quaternion(), [])
  const tmpGiro = useMemo(() => new Quaternion(), [])
  const euler = useMemo(() => new Euler(), [])

  useFrame(({ clock }, dt) => {
    const a = anim.current
    const m = malla.current
    const guiando = leerEstado().guia === libro.id
    const brillo = guiando ? 0.35 + 0.35 * Math.sin(clock.elapsedTime * 5) : 0
    for (const i of [0, 1, 4]) materiales[i].emissiveIntensity = brillo

    if (a.fase === 'abriendo') {
      a.t = Math.min(1, a.t + dt / a.duracion)
      euler.set(giroInspeccion.x, giroInspeccion.y, 0)
      tmpRot.copy(a.destinoRot).multiply(tmpGiro.setFromEuler(euler))
      // Primero sale de la balda, luego vuela hacia ti girando hasta enseñar la portada.
      if (a.t < 0.3) {
        m.position.lerpVectors(a.desdePos, fuera, curva(a.t / 0.3))
      } else {
        const p = curva((a.t - 0.3) / 0.7)
        m.position.lerpVectors(fuera, a.destinoPos, p)
        m.quaternion.slerpQuaternions(a.desdeRot, tmpRot, p)
      }
      if (a.t >= 1) m.quaternion.copy(tmpRot)
    } else if (a.fase === 'cerrando') {
      a.t = Math.min(1, a.t + dt / a.duracion)
      if (a.t < 0.7) {
        const p = curva(a.t / 0.7)
        m.position.lerpVectors(a.desdePos, fuera, p)
        m.quaternion.slerpQuaternions(a.desdeRot, reposo, p)
      } else {
        m.position.lerpVectors(fuera, casa, curva((a.t - 0.7) / 0.3))
        m.quaternion.copy(reposo)
      }
      if (a.t >= 1) a.fase = 'reposo'
    } else if (a.fase === 'moviendo') {
      a.t = Math.min(1, a.t + dt / a.duracion)
      if (a.t <= 0) return
      const p = curvaSuave(a.t)
      const arco = Math.sin(Math.PI * p) * 0.14
      m.position.lerpVectors(a.desdePos, casa, p)
      m.position.addScaledVector(a.normalDesde, arco * (1 - p)).addScaledVector(normal, arco * p)
      m.position.y += Math.sin(Math.PI * p) * 0.03
      m.quaternion.slerpQuaternions(a.desdeRot, reposo, p)
      if (a.t >= 1) a.fase = 'reposo'
    } else {
      const sale = apuntado ? 0.025 : 0
      const actual = m.position.clone().sub(casa).dot(normal)
      const siguiente = actual + (sale - actual) * (1 - Math.exp(-18 * dt))
      m.position.copy(casa).addScaledVector(normal, siguiente)
    }
  })

  return (
    <mesh ref={malla} material={materiales} castShadow receiveShadow>
      <boxGeometry args={medidas} />
    </mesh>
  )
}
