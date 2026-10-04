import { defineEventHandler, createError, readBody } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const client = await serverSupabaseServiceRole(event)

  if (event.node.req.method === 'POST') {
    const body = await readBody(event)
    const { action } = body || {}

    if (action === 'update_snapshot') {
      const { data: filmes } = await client.from('filmes').select('*')
      const { data: votos } = await client.from('votos').select('*')

      const totalVotos = votos?.length || 0
      const countMap: Record<string, number> = {}

      votos?.forEach((v) => {
        if (v.filme_id) {
          countMap[v.filme_id] = (countMap[v.filme_id] || 0) + 1
        }
      })

      const apuracaoSnapshot = (filmes || []).map((f) => {
        const qtd = countMap[f.id] || 0
        const pct = totalVotos > 0 ? (qtd / totalVotos) * 100 : 0
        return {
          id: f.id,
          nome: f.title,
          foto_url: f.poster_url || f.banner_url,
          qtdVotos: qtd,
          porcentagem: Number(pct.toFixed(1)),
        }
      })

      apuracaoSnapshot.sort((a, b) => b.qtdVotos - a.qtdVotos)

      const snapshotData = {
        updated_at: new Date().toISOString(),
        totalVotos,
        apuracao: apuracaoSnapshot,
      }

      return { success: true, snapshot: snapshotData }
    }
  }

  // GET PARA O ADMIN (APURAÇÃO DE FILMES E LOG DE AUDITORIA)
  const { data: filmes, error: errFilmes } = await client
    .from('filmes')
    .select('*')
    .order('title', { ascending: true })

  if (errFilmes) {
    throw createError({ statusCode: 500, statusMessage: errFilmes.message })
  }

  const { data: votos, error: errVotos } = await client
    .from('votos')
    .select(`
      id,
      user_id,
      email,
      filme_id,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (errVotos) {
    throw createError({ statusCode: 500, statusMessage: errVotos.message })
  }

  // Buscar perfis para obter nomes cadastrados
  const { data: profiles } = await client.from('profiles').select('id, nome, email, avatar_url')
  const profilesMap: Record<string, { nome?: string; email?: string }> = {}
  profiles?.forEach((p) => {
    profilesMap[p.id] = { nome: p.nome, email: p.email }
  })

  const filmeMap: Record<string, any> = {}
  filmes?.forEach((f) => {
    filmeMap[f.id] = f
  })

  const auditVotos = (votos || []).map((v) => {
    const prof = profilesMap[v.user_id]
    const filme = filmeMap[v.filme_id]

    return {
      id: v.id,
      created_at: v.created_at,
      voter_id: v.user_id,
      voter_name: prof?.nome || v.email.split('@')[0] || 'Aluno',
      voter_email: v.email,
      candidato_nome: filme ? filme.title : 'Filme Removido',
      candidato_foto: filme ? (filme.poster_url || filme.banner_url) : null,
      tipo_voto: 'Nominal',
    }
  })

  const totalVotos = votos?.length || 0
  const countMap: Record<string, number> = {}

  votos?.forEach((v) => {
    if (v.filme_id) {
      countMap[v.filme_id] = (countMap[v.filme_id] || 0) + 1
    }
  })

  const apuracao = (filmes || []).map((f) => {
    const qtd = countMap[f.id] || 0
    const pct = totalVotos > 0 ? (qtd / totalVotos) * 100 : 0
    return {
      id: f.id,
      nome: f.title,
      foto_url: f.poster_url || f.banner_url,
      qtdVotos: qtd,
      porcentagem: Number(pct.toFixed(1)),
    }
  })

  apuracao.sort((a, b) => b.qtdVotos - a.qtdVotos)

  return {
    totalVotos,
    brancos: 0,
    nulos: 0,
    apuracao,
    auditVotos,
    resultado_publico_ativo: false,
    resultado_congelado: null,
  }
})
