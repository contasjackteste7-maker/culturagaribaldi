import { defineEventHandler, readBody, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  let user = await serverSupabaseUser(event)
  let userId = user?.id || (user as any)?.sub
  let userEmail = user?.email

  if (!userId) {
    try {
      const stdClient = await serverSupabaseClient(event)
      const { data: { user: authUser } } = await stdClient.auth.getUser()
      userId = authUser?.id || (authUser as any)?.sub
      userEmail = authUser?.email || userEmail
    } catch (err) {}
  }

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Sessão expirada. Faça login novamente.' })
  }

  const client = await serverSupabaseServiceRole(event)
  const body = await readBody(event)
  const { filme_id } = body

  if (!filme_id) {
    throw createError({ statusCode: 400, statusMessage: 'Filme não selecionado.' })
  }

  // 1. Verificar se o e-mail / usuário já registrou voto
  const { data: votoExistente } = await client
    .from('votos')
    .select('id')
    .or(`user_id.eq.${userId},email.eq.${userEmail || ''}`)
    .maybeSingle()

  if (votoExistente) {
    throw createError({ statusCode: 400, statusMessage: 'Você já registrou seu voto nesta sessão de cinema!' })
  }

  // 2. Inserir voto único no banco
  const { data: novoVoto, error: insertError } = await client
    .from('votos')
    .insert({
      filme_id,
      user_id: userId,
      email: userEmail || `${userId}@aluno.cultura.br`,
    })
    .select()
    .single()

  if (insertError) {
    throw createError({ statusCode: 500, statusMessage: insertError.message || 'Erro ao registrar voto.' })
  }

  return { success: true, voto: novoVoto }
})
