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

  if (!userId || !userEmail) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data } = await client.auth.getUser(token)
      userId = data?.user?.id || userId
      userEmail = data?.user?.email || userEmail
    }
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID do filme não informado.' })
  }

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
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores.' })
  }

  const body = await readBody(event)

  const { data: filme, error } = await client
    .from('filmes')
    .update({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.year !== undefined && { year: body.year }),
      ...(body.genre !== undefined && { genre: body.genre }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.rating !== undefined && { rating: body.rating }),
      ...(body.synopsis !== undefined && { synopsis: body.synopsis }),
      ...(body.banner_url !== undefined && { banner_url: body.banner_url }),
      ...(body.poster_url !== undefined && { poster_url: body.poster_url }),
      ...(body.trailer_url !== undefined && { trailer_url: body.trailer_url }),
      ...(body.active !== undefined && { active: body.active }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true, filme }
})
