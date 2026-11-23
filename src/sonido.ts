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

export const sonar = {
  coger: () => tono(520, 0, 0.07, 0.08),
  colocar: () => { tono(330, 0, 0.08); tono(660, 0.07, 0.12, 0.09) },
  error: () => tono(180, 0, 0.14, 0.08),
}
