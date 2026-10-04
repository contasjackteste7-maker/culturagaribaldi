import { defineEventHandler, readMultipartFormData, createError, getHeader } from 'h3'
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

  // Verificar admin
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
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas administradores podem fazer upload de imagens.' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo enviado.' })
  }

  const fileItem = formData.find((item) => item.name === 'file' || item.filename)
  if (!fileItem || !fileItem.data) {
    throw createError({ statusCode: 400, statusMessage: 'Arquivo de imagem inválido.' })
  }

  const BUCKET_NAME = 'filmes'
  const { data: buckets } = await client.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === BUCKET_NAME)

  if (!exists) {
    await client.storage.createBucket(BUCKET_NAME, { public: true })
  }

  const fileExt = fileItem.filename?.split('.').pop() || 'png'
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
  const filePath = fileName

  const { error: uploadError } = await client.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileItem.data, {
      contentType: fileItem.type || 'image/png',
      upsert: true,
    })

  if (uploadError) {
    // Fallback garantido para Data URL base64 se o bucket do Supabase estiver com RLS estrito
    const base64 = fileItem.data.toString('base64')
    const mime = fileItem.type || 'image/png'
    return { url: `data:${mime};base64,${base64}` }
  }

  const { data: publicUrlData } = client.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return { url: publicUrlData.publicUrl }
})
