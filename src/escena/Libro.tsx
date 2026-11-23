import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Euler, MathUtils, Mesh, MeshStandardMaterial, Quaternion, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
import { colorDeReserva, colorDominante, colorGuardado } from '../libros/color'
import { texturaLomo } from '../libros/lomo'
import { useEstado } from '../estado'
import type { Hueco } from '../tipos'
import { control, giroInspeccion, mallasLibros } from './registro'

const PAPEL = '#efe6d0'
const SACAR = 0.13
const DURACION_ABRIR = 0.7
const DURACION_CERRAR = 0.45
const ARRIBA = new Vector3(0, 1, 0)
const GIRO_PORTADA = new Quaternion().setFromAxisAngle(ARRIBA, -Math.PI / 2)
const cargador = new TextureLoader().setCrossOrigin('anonymous')

const curva = (t: number) => 1 - (1 - t) ** 3

type Fase = 'reposo' | 'abriendo' | 'cerrando'

export function Libro({ hueco }: { hueco: Hueco }) {
  const { libro, posicion, medidas } = hueco
  const malla = useRef<Mesh>(null!)
  const apuntado = useEstado(e => e.apuntado === libro.id)
  const abierto = useEstado(e => e.abierto === libro.id)

  const materiales = useMemo(() => {
    const color = colorGuardado(libro.portada) ?? colorDeReserva(libro.titulo)
    const tapa = () => new MeshStandardMaterial({ color, roughness: 0.6 })
    const papel = new MeshStandardMaterial({ color: PAPEL, roughness: 0.95 })
    // Orden de caras de BoxGeometry: +x (portada), -x (contra), +y, -y, +z (lomo), -z.
    return [tapa(), tapa(), papel, papel, tapa(), papel]
  }, [libro])

  useEffect(() => {
    let vivo = true
    const pintar = (fondo: string) => {
      if (!vivo) return
      for (const i of [0, 1]) materiales[i].color.set(fondo)
      document.fonts.load('600 20px Poppins').finally(() => {
        if (!vivo) return
        const lomo = materiales[4]
        lomo.map?.dispose()
        lomo.map = texturaLomo(libro, medidas[0], medidas[1], fondo)
        lomo.color.set('#ffffff')
        lomo.needsUpdate = true
      })
    }
    pintar(colorGuardado(libro.portada) ?? colorDeReserva(libro.titulo))
    if (libro.portada) colorDominante(libro.portada).then(pintar).catch(() => {})
    return () => { vivo = false }
  }, [libro, materiales, medidas])

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

  const anim = useRef({
    fase: 'reposo' as Fase,
    t: 0,
    desdePos: new Vector3(),
    desdeRot: new Quaternion(),
    destinoPos: new Vector3(),
    destinoRot: new Quaternion(),
  })
  const casa = useMemo(() => new Vector3(...posicion), [posicion])
  const fuera = useMemo(() => new Vector3(posicion[0], posicion[1], posicion[2] + SACAR), [posicion])

  useEffect(() => {
    const a = anim.current
    const m = malla.current
    a.desdePos.copy(m.position)
    a.desdeRot.copy(m.quaternion)
    a.t = 0
    if (abierto) {
      const cam = control.camara!
      const delante = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion)
      const izquierda = new Vector3(-1, 0, 0).applyQuaternion(cam.quaternion)
      a.destinoPos.copy(cam.position).addScaledVector(delante, 0.42).addScaledVector(izquierda, 0.07)
      a.destinoRot.copy(cam.quaternion).multiply(GIRO_PORTADA)
      giroInspeccion.x = 0
      giroInspeccion.y = 0
      a.fase = 'abriendo'
    } else if (a.fase !== 'reposo' || !m.position.equals(casa)) {
      a.fase = 'cerrando'
    }
  }, [abierto, casa])

  const tmpPos = useMemo(() => new Vector3(), [])
  const tmpRot = useMemo(() => new Quaternion(), [])
  const tmpGiro = useMemo(() => new Quaternion(), [])
  const euler = useMemo(() => new Euler(), [])

  useFrame((_, dt) => {
    const a = anim.current
    const m = malla.current
    if (a.fase === 'abriendo') {
      a.t = Math.min(1, a.t + dt / DURACION_ABRIR)
      // Primero sale de la balda, luego vuela hacia ti girando hasta enseñar la portada.
      if (a.t < 0.3) {
        tmpPos.lerpVectors(a.desdePos, fuera, curva(a.t / 0.3))
        m.position.copy(tmpPos)
      } else {
        const p = curva((a.t - 0.3) / 0.7)
        m.position.lerpVectors(fuera, a.destinoPos, p)
        euler.set(giroInspeccion.x, giroInspeccion.y, 0)
        tmpRot.copy(a.destinoRot).multiply(tmpGiro.setFromEuler(euler))
        m.quaternion.slerpQuaternions(a.desdeRot, tmpRot, p)
      }
      if (a.t >= 1) {
        euler.set(giroInspeccion.x, giroInspeccion.y, 0)
        m.quaternion.copy(a.destinoRot).multiply(tmpGiro.setFromEuler(euler))
      }
    } else if (a.fase === 'cerrando') {
      a.t = Math.min(1, a.t + dt / DURACION_CERRAR)
      if (a.t < 0.7) {
        const p = curva(a.t / 0.7)
        m.position.lerpVectors(a.desdePos, fuera, p)
        m.quaternion.slerpQuaternions(a.desdeRot, tmpRot.identity(), p)
      } else {
        m.position.lerpVectors(fuera, casa, curva((a.t - 0.7) / 0.3))
        m.quaternion.identity()
      }
      if (a.t >= 1) a.fase = 'reposo'
    } else {
      const objetivo = apuntado ? posicion[2] + 0.025 : posicion[2]
      m.position.set(posicion[0], posicion[1], MathUtils.damp(m.position.z, objetivo, 18, dt))
    }
  })

  return (
    <mesh ref={malla} position={posicion} material={materiales} castShadow receiveShadow>
      <boxGeometry args={medidas} />
    </mesh>
  )
}
