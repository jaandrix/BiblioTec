import { createClient } from '@supabase/supabase-js'

// Clave publicable: está pensada para ir en la web. Lo que protege los datos
// son las políticas de la tabla (cada usuario solo ve su fila).
export const SUPABASE_URL = 'https://ebxktgoiizjwsumoklfk.supabase.co'
const CLAVE = 'sb_publishable_g9Ep6-rnGiI2xrUaPN1sKA_uWzHk_-Q'

export const sb = createClient(SUPABASE_URL, CLAVE, { auth: { persistSession: true, autoRefreshToken: true } })

export const BITACORA_FUNCION = 'https://avdqtnukgbejorieuunj.supabase.co/functions/v1/biblioteca'
