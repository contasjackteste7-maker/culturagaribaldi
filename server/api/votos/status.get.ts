import { defineEventHandler, createError } from 'h3'
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

  const client = await serverSupabaseServiceRole(event)

  let jaVotou = false
  let votoUsuario = null

  if (userId) {
    try {
      const { data: voto } = await client
        .from('votos')
        .select('*')
        .or(`user_id.eq.${userId},email.eq.${userEmail || ''}`)
        .maybeSingle()

      if (voto) {
        jaVotou = true
        votoUsuario = voto
      }
    } catch (err) {
      console.error('Erro ao consultar voto do usuário:', err)
    }
  }

  // Buscar todos os filmes ativos cadastrados
  const { data: filmes } = await client
    .from('filmes')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  return {
    jaVotou,
    voto: votoUsuario,
    filmes: filmes || [],
  }
})
