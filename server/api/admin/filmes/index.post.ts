import { defineEventHandler, createError, readBody, getHeader } from 'h3'
import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)

  let user = await serverSupabaseUser(event).catch(() => null)
  let userId = user?.id || (user as any)?.sub
  let userEmail = user?.email

  if (!userId || !userEmail) {
    try {
      const stdClient = await serverSupabaseClient(event)
      const { data: { user: authUser } } = await stdClient.auth.getUser()
      userId = authUser?.id || (authUser as any)?.sub || userId
      userEmail = authUser?.email || userEmail
    } catch (err) {}
  }

  // Tentar também extrair via Bearer token se necessário
  if (!userId || !userEmail) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data } = await client.auth.getUser(token)
      userId = data?.user?.id || userId
      userEmail = data?.user?.email || userEmail
    }
  }

  // 1. Buscar todos os administradores cadastrados
  const { data: adminList } = await client
    .from('administradores')
    .select('*')

  let isAdmin = false
  if (adminList && adminList.length > 0) {
    isAdmin = adminList.some((adm: any) => {
      const matchId = userId && adm.user_id && String(adm.user_id).toLowerCase() === String(userId).toLowerCase()
      const matchEmail = userEmail && adm.email && String(adm.email).trim().toLowerCase() === String(userEmail).trim().toLowerCase()
      return matchId || matchEmail
    })
  }

  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: `Acesso negado. Usuário (${userEmail || userId || 'não identificado'}) não é um administrador registrado.`,
    })
  }

  const body = await readBody(event)
  const { title, year, genre, duration, rating, synopsis, banner_url, poster_url, trailer_url, active } = body

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'O título do filme é obrigatório.' })
  }

  const { data: filme, error } = await client
    .from('filmes')
    .insert({
      title,
      year: year || 2026,
      genre: genre || 'Terror',
      duration: duration || '1h 45m',
      rating: rating || '16+',
      synopsis,
      banner_url,
      poster_url,
      trailer_url,
      active: active !== undefined ? active : true,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true, filme }
})
