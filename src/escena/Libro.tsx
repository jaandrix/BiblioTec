import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Euler, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { cambiarEstado, leerEstado, useEstado } from '../estado'
import { colorDeLibro, colorDominante } from '../libros/color'
import { cajaLibro, texturaLibro } from '../libros/lomo'
import type { Hueco, Libro as TLibro } from '../tipos'
import { huecoCarro } from './Carro'
import { altoLibro, fondoLibro, grosorLibro } from './distribucion'
import { control, giroInspeccion, mallasLibros } from './registro'

export type Destino =
  | { tipo: 'balda'; hueco: Hueco }
  | { tipo: 'carro'; indice: number }
  | { tipo: 'mesa'; posicion: [number, number, number]; giro: number }

const SACAR = 0.13
const ARRIBA = new Vector3(0, 1, 0)
const DELANTE = new Vector3(0, 0, 1)
const GIRO_PORTADA = new Quaternion().setFromAxisAngle(ARRIBA, -Math.PI / 2)
const TUMBADO = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)

const curva = (t: number) => 1 - (1 - t) ** 3
const curvaSuave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function firma(d: Destino) {
  if (d.tipo === 'balda') return `b${d.hueco.posicion.join(',')}`
  if (d.tipo === 'carro') return `c${d.indice}`
  return `m${d.posicion.join(',')}`
}

type Fase = 'reposo' | 'viaje' | 'abriendo'

export function Libro({ libro, destino }: { libro: TLibro; destino: Destino }) {
  const malla = useRef<Mesh>(null!)
  const apuntado = useEstado(e => e.apuntado === libro.id)
  const abierto = useEstado(e => e.abierto === libro.id)
  const grosor = grosorLibro(libro)
  const alto = altoLibro(libro)
  const fondo = fondoLibro(libro)
  const geometria = useMemo(() => cajaLibro(grosor, alto, fondo), [grosor, alto, fondo])
  useEffect(() => () => geometria.dispose(), [geometria])
  const destinoRef = useRef(destino)
  destinoRef.current = destino

  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.6, emissive: '#ffb347', emissiveIntensity: 0 }), [libro])
  useEffect(() => () => { material.map?.dispose(); material.dispose() }, [material])

  // La portada real solo se baja cuando se va a ver: al abrir el libro o si
  // espera tumbado en la mesa de la entrada. Al abrirlo se pinta en alta.
  const verPortada = abierto || destino.tipo === 'mesa'
  const estadoTextura = useRef<{ fondo: string; img: HTMLImageElement | null; alta: boolean }>({ fondo: colorDeLibro(libro), img: null, alta: false })

  useEffect(() => {
    let vivo = true
    const e = estadoTextura.current
    const pintar = () => {
      if (!vivo) return
      material.map?.dispose()
      material.map = texturaLibro(libro, grosor, alto, e.fondo, e.img, e.alta)
      material.needsUpdate = true
    }
    e.alta = abierto
    document.fonts.load('600 20px Poppins').finally(pintar)
    if (libro.portada && !e.img && verPortada) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { e.img = img; pintar() }
      img.src = libro.portada
    }
    if (libro.portada) colorDominante(libro.portada).then(c => { if (c !== e.fondo) { e.fondo = c; pintar() } }).catch(() => {})
    return () => { vivo = false }
  }, [libro, material, grosor, alto, verPortada, abierto])

  useEffect(() => {
    const m = malla.current
    m.userData.id = libro.id
    mallasLibros.set(libro.id, m)
    return () => { mallasLibros.delete(libro.id) }
  }, [libro.id])

  const objetivo = useMemo(() => {
    const pos = new Vector3(), rot = new Quaternion(), normal = new Vector3()
    return (d: Destino) => {
      if (d.tipo === 'balda') {
        pos.set(...d.hueco.posicion)
        rot.setFromAxisAngle(ARRIBA, d.hueco.giro)
      } else if (d.tipo === 'mesa') {
        pos.set(...d.posicion)
        rot.setFromAxisAngle(ARRIBA, d.giro).multiply(TUMBADO)
      } else {
        const carro = control.carro
        pos.set(...huecoCarro(d.indice, alto))
        if (carro) { carro.localToWorld(pos); rot.copy(carro.quaternion) } else rot.identity()
      }
      normal.copy(DELANTE).applyQuaternion(rot)
      return { pos, rot, normal }
    }
  }, [alto])

  const anim = useRef({
    fase: 'reposo' as Fase,
    t: 0,
    duracion: 1,
    elevar: 0.03,
    firma: '',
    desdePos: new Vector3(),
    desdeRot: new Quaternion(),
    normalDesde: new Vector3(),
    abrirPos: new Vector3(),
    abrirRot: new Quaternion(),
  })

  const empezarViaje = (desdeTipo: string | null) => {
    const a = anim.current
    const m = malla.current
    const d = destinoRef.current
    a.desdePos.copy(m.position)
    a.desdeRot.copy(m.quaternion)
    a.normalDesde.copy(DELANTE).applyQuaternion(m.quaternion)
    const objetivoPos = objetivo(d).pos
    const lejos = a.desdePos.distanceTo(objetivoPos)
    a.duracion = Math.min(1.1, 0.45 + lejos * 0.12)
    const entreBaldas = desdeTipo === 'b' && d.tipo === 'balda'
    a.elevar = entreBaldas ? 0.03 : Math.min(0.35, 0.08 + lejos * 0.06)
    // Al reordenar, en cascada, para que se vea la estantería moverse.
    a.t = entreBaldas ? -Math.min(d.hueco.orden * 0.018, 0.9) / a.duracion : 0
    a.fase = 'viaje'
  }

  useEffect(() => {
    const a = anim.current
    const m = malla.current
    const nueva = firma(destino)
    if (!a.firma) {
      const { pos, rot } = objetivo(destino)
      m.position.copy(pos)
      m.quaternion.copy(rot)
      a.firma = nueva
      return
    }
    if (nueva === a.firma) return
    const antes = a.firma[0]
    a.firma = nueva
    if (a.fase === 'abriendo') return
    empezarViaje(antes)
  })

  useEffect(() => {
    const a = anim.current
    const m = malla.current
    if (abierto) {
      a.desdePos.copy(m.position)
      a.desdeRot.copy(m.quaternion)
      const cam = control.camara!
      const delante = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion)
      const izquierda = new Vector3(-1, 0, 0).applyQuaternion(cam.quaternion)
      a.abrirPos.copy(cam.position).addScaledVector(delante, giroInspeccion.distancia).addScaledVector(izquierda, 0.07)
      a.abrirRot.copy(cam.quaternion)
      a.t = 0
      a.duracion = 0.7
      a.fase = 'abriendo'
      if (leerEstado().guia === libro.id) cambiarEstado({ guia: null })
    } else if (a.fase === 'abriendo') {
      empezarViaje(null)
      a.duracion = 0.5
      a.elevar = 0
    }
  }, [abierto, libro.id])

  const tmpRot = useMemo(() => new Quaternion(), [])
  const tmpPos = useMemo(() => new Vector3(), [])
  const tmpGiro = useMemo(() => new Quaternion(), [])
  const fuera = useMemo(() => new Vector3(), [])
  const euler = useMemo(() => new Euler(), [])

  useFrame(({ clock }, dt) => {
    const a = anim.current
    const m = malla.current
    const guiando = leerEstado().guia === libro.id
    const brillo = guiando ? 0.35 + 0.35 * Math.sin(clock.elapsedTime * 5) : 0
    material.emissiveIntensity = brillo
    const d = destinoRef.current
    const { pos, rot, normal } = objetivo(d)

    if (a.fase === 'abriendo') {
      a.t = Math.min(1, a.t + dt / a.duracion)
      // El giro se aplica en los ejes de la cámara: arrastrar a los lados lo hace
      // girar sobre sí mismo, arriba y abajo lo inclina hacia ti. Sin giro, la
      // portada mira de frente.
      euler.set(giroInspeccion.x, giroInspeccion.y, 0, 'XYZ')
      tmpRot.copy(a.abrirRot).multiply(tmpGiro.setFromEuler(euler)).multiply(GIRO_PORTADA)
      const cam = control.camara
      if (cam) {
        const delante = fuera.set(0, 0, -1).applyQuaternion(cam.quaternion)
        a.abrirPos.copy(cam.position).addScaledVector(delante, giroInspeccion.distancia)
        a.abrirPos.addScaledVector(fuera.set(-1, 0, 0).applyQuaternion(cam.quaternion), 0.07)
      }
      // Primero sale de la balda, luego vuela hacia ti girando hasta enseñar la portada.
      fuera.copy(a.desdePos).addScaledVector(a.normalDesde, SACAR)
      if (a.t < 0.3) {
        m.position.lerpVectors(a.desdePos, fuera, curva(a.t / 0.3))
      } else {
        const p = curva((a.t - 0.3) / 0.7)
        m.position.lerpVectors(fuera, a.abrirPos, p)
        m.quaternion.slerpQuaternions(a.desdeRot, tmpRot, p)
      }
      if (a.t >= 1) m.quaternion.copy(tmpRot)
      return
    }

    if (a.fase === 'viaje') {
      a.t = Math.min(1, a.t + dt / a.duracion)
      if (a.t <= 0) return
      const p = curvaSuave(a.t)
      const arco = Math.sin(Math.PI * p)
      m.position.lerpVectors(a.desdePos, pos, p)
      m.position.addScaledVector(a.normalDesde, arco * 0.14 * (1 - p)).addScaledVector(normal, arco * 0.14 * p)
      m.position.y += arco * a.elevar
      m.quaternion.slerpQuaternions(a.desdeRot, rot, p)
      if (a.t >= 1) a.fase = 'reposo'
      return
    }

    m.quaternion.copy(rot)
    if (d.tipo === 'balda') {
      const sale = apuntado ? 0.025 : 0
      const actual = tmpPos.copy(m.position).sub(pos).dot(normal)
      const siguiente = actual + (sale - actual) * (1 - Math.exp(-18 * dt))
      m.position.copy(pos).addScaledVector(normal, siguiente)
    } else {
      m.position.copy(pos)
      if (apuntado && d.tipo === 'mesa') m.position.y += 0.012
    }
  })

  return (
    <mesh ref={malla} geometry={geometria} material={material} receiveShadow />
  )
}
