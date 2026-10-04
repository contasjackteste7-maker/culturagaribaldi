<script setup lang="ts">
import { definePageMeta, useFetch, $fetch, ref } from '#imports'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-guard',
})

interface MovieItem {
  id: string
  title: string
  year: number
  genre: string
  duration: string
  rating: string
  synopsis: string
  banner_url?: string
  poster_url?: string
  trailer_url?: string
  active: boolean
}

const { data: movies, pending, refresh } = useFetch<MovieItem[]>('/api/admin/filmes', {
  default: () => []
})

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const isSaving = ref(false)

const uploadingPoster = ref(false)
const uploadingBanner = ref(false)

// Opções Oficiais da Classificação Indicativa do Cinema Brasileiro
const ratingOptions = [
  { value: 'Livre', label: '🟢 Livre (Verde)', colorClass: 'text-emerald-600 font-extrabold' },
  { value: '10+', label: '🔵 10 Anos (Azul)', colorClass: 'text-blue-600 font-extrabold' },
  { value: '12+', label: '🟡 12 Anos (Amarelo)', colorClass: 'text-yellow-600 font-extrabold' },
  { value: '14+', label: '🟠 14 Anos (Laranja)', colorClass: 'text-orange-600 font-extrabold' },
  { value: '16+', label: '🔴 16 Anos (Vermelho)', colorClass: 'text-red-600 font-extrabold' },
  { value: '18+', label: '⚫ 18 Anos (Preto)', colorClass: 'text-zinc-900 font-extrabold' },
]

// Form states
const formTitle = ref('')
const formYear = ref<number>(new Date().getFullYear())
const formGenre = ref('Terror')
const formDuration = ref('1h 45m')
const formRating = ref('16+')
const formSynopsis = ref('')
const formBannerUrl = ref('')
const formPosterUrl = ref('')
const formTrailerUrl = ref('')

async function handleFileUpload(event: Event, targetField: 'poster' | 'banner') {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  const formData = new FormData()
  formData.append('file', file)

  if (targetField === 'poster') uploadingPoster.value = true
  else uploadingBanner.value = true

  try {
    const res: any = await $fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    if (res?.url) {
      if (targetField === 'poster') {
        formPosterUrl.value = res.url
      } else {
        formBannerUrl.value = res.url
      }
    }
  } catch (err: any) {
    alert(err?.statusMessage || err?.message || 'Erro ao fazer upload da imagem.')
  } finally {
    if (targetField === 'poster') uploadingPoster.value = false
    else uploadingBanner.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  formTitle.value = ''
  formYear.value = new Date().getFullYear()
  formGenre.value = 'Terror / Suspense'
  formDuration.value = '1h 45m'
  formRating.value = '16+'
  formSynopsis.value = ''
  formBannerUrl.value = ''
  formPosterUrl.value = ''
  formTrailerUrl.value = ''
  showModal.value = true
}

function openEditModal(movie: MovieItem) {
  isEditing.value = true
  editingId.value = movie.id
  formTitle.value = movie.title
  formYear.value = movie.year
  formGenre.value = movie.genre
  formDuration.value = movie.duration
  formRating.value = movie.rating
  formSynopsis.value = movie.synopsis || ''
  formBannerUrl.value = movie.banner_url || ''
  formPosterUrl.value = movie.poster_url || ''
  formTrailerUrl.value = movie.trailer_url || ''
  showModal.value = true
}

async function saveMovie() {
  if (!formTitle.value.trim()) return
  isSaving.value = true

  try {
    const payload = {
      title: formTitle.value,
      year: formYear.value,
      genre: formGenre.value,
      duration: formDuration.value,
      rating: formRating.value,
      synopsis: formSynopsis.value,
      banner_url: formBannerUrl.value,
      poster_url: formPosterUrl.value,
      trailer_url: formTrailerUrl.value,
    }

    if (isEditing.value && editingId.value) {
      await $fetch(`/api/admin/filmes/${editingId.value}`, {
        method: 'PUT',
        body: payload,
      })
    } else {
      await $fetch('/api/admin/filmes', {
        method: 'POST',
        body: payload,
      })
    }

    await refresh()
    showModal.value = false
  } catch (err: any) {
    alert(err?.statusMessage || err?.message || 'Erro ao salvar filme.')
  } finally {
    isSaving.value = false
  }
}

async function removeMovie(id: string) {
  if (!confirm('Deseja realmente remover este filme do catálogo?')) return
  try {
    await $fetch(`/api/admin/filmes/${id}`, {
      method: 'DELETE',
    })
    await refresh()
  } catch (err: any) {
    alert(err?.statusMessage || 'Erro ao excluir filme.')
  }
}

async function toggleMovieStatus(movie: MovieItem) {
  try {
    await $fetch(`/api/admin/filmes/${movie.id}`, {
      method: 'PUT',
      body: { active: !movie.active },
    })
    await refresh()
  } catch (err: any) {
    alert(err?.statusMessage || 'Erro ao alterar status do filme.')
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Topo da Seção de Filmes -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Catálogo de Filmes</h1>
        <p class="text-sm font-medium text-slate-500 mt-1">
          Gerencie as opções de filmes que aparecerão para os alunos votarem após o login.
        </p>
      </div>

      <button
        @click="openCreateModal"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-md hover:bg-red-700 transition active:scale-95"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        Cadastrar Novo Filme
      </button>
    </div>

    <!-- Feedback de carregamento -->
    <div v-if="pending" class="py-12 text-center text-slate-400 font-bold">
      Carregando filmes...
    </div>

    <!-- Lista em Cards dos Filmes Cadastrados -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="movie in movies"
        :key="movie.id"
        class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <!-- Imagem de Capa do Filme (Poster Vertical) -->
        <div class="relative h-56 w-full overflow-hidden bg-slate-900">
          <img
            :src="movie.poster_url || movie.banner_url || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'"
            :alt="movie.title"
            class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <div class="absolute top-3 right-3 flex items-center gap-2">
            <span
              :class="movie.active ? 'bg-emerald-500/90 text-white' : 'bg-gray-600/90 text-gray-200'"
              class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm"
            >
              {{ movie.active ? 'Disponível p/ Votação' : 'Oculto' }}
            </span>
          </div>

          <div class="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-xs font-bold text-gray-300">
            <span class="rounded bg-red-600 px-2 py-0.5 text-white uppercase tracking-wider text-[10px] font-black">CulturaFlix</span>
            <span>{{ movie.year }}</span>
            <span class="border border-white/40 px-1.5 py-0.5 rounded text-[10px] font-extrabold">{{ movie.rating }}</span>
            <span>• {{ movie.duration }}</span>
          </div>
        </div>

        <!-- Conteúdo/Descrição -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-2">
            <h2 class="text-xl font-black text-slate-900 leading-snug tracking-tight">
              {{ movie.title }}
            </h2>
            <p class="text-xs text-red-600 font-bold uppercase tracking-wider">
              {{ movie.genre }}
            </p>
            <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {{ movie.synopsis }}
            </p>
          </div>

          <!-- Botões de Ação do Card -->
          <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              @click="toggleMovieStatus(movie)"
              class="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition flex-1 text-slate-700"
            >
              {{ movie.active ? 'Desativar Votação' : 'Ativar Votação' }}
            </button>
            
            <button
              @click="openEditModal(movie)"
              class="p-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
              title="Editar Filme"
            >
              ✏️
            </button>

            <button
              @click="removeMovie(movie.id)"
              class="p-2 rounded-xl text-xs font-bold border border-red-200 hover:bg-red-50 text-red-600 transition"
              title="Excluir Filme"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-if="movies.length === 0" class="col-span-full py-16 text-center text-slate-400 font-bold">
        Nenhum filme cadastrado no banco de dados Supabase.
      </div>
    </div>

    <!-- Modal de Cadastro / Edição de Filme -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div class="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 class="text-xl font-extrabold text-slate-900">
            {{ isEditing ? 'Editar Filme' : 'Cadastrar Novo Filme' }}
          </h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
        </div>

        <form @submit.prevent="saveMovie" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Título do Filme</label>
            <input
              v-model="formTitle"
              type="text"
              required
              placeholder="Ex: Invocação do Mal 3"
              class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-red-600 focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ano</label>
              <input
                v-model="formYear"
                type="number"
                required
                class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold focus:border-red-600 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Duração</label>
              <input
                v-model="formDuration"
                type="text"
                placeholder="1h 45m"
                class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold focus:border-red-600 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Classificação Indicativa</label>
              <select
                v-model="formRating"
                required
                class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-800 bg-white focus:border-red-600 focus:outline-none"
              >
                <option
                  v-for="opt in ratingOptions"
                  :key="opt.value"
                  :value="opt.value"
                  :class="opt.colorClass"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Gênero</label>
            <input
              v-model="formGenre"
              type="text"
              placeholder="Terror / Suspense"
              class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Sinopse / Descrição</label>
            <textarea
              v-model="formSynopsis"
              rows="3"
              placeholder="Breve descrição da história do filme..."
              class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-red-600 focus:outline-none"
            ></textarea>
          </div>

          <!-- UPLOAD DA CAPA DO CARD (POSTER VERTICAL) -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700">Capa do Card (Poster Vertical)</label>
            <div class="flex items-center gap-3">
              <label class="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-red-300 bg-red-50/50 text-red-700 hover:bg-red-50 transition font-bold text-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{{ uploadingPoster ? 'Enviando imagem...' : '📁 Escolher Imagem do Computador' }}</span>
                <input type="file" accept="image/*" class="hidden" @change="(e) => handleFileUpload(e, 'poster')" />
              </label>
            </div>
            <input
              v-model="formPosterUrl"
              type="text"
              placeholder="Ou cole a URL direta (https://...)"
              class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 focus:border-red-600 focus:outline-none"
            />
            <div v-if="formPosterUrl" class="h-20 w-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img :src="formPosterUrl" class="h-full w-full object-cover" />
            </div>
          </div>

          <!-- UPLOAD DO BANNER DO SLIDE (HORIZONTAL) -->
          <div class="space-y-1.5 pt-2">
            <label class="block text-xs font-bold text-slate-700">Banner do Slide Hero (Horizontal)</label>
            <div class="flex items-center gap-3">
              <label class="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition font-bold text-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{{ uploadingBanner ? 'Enviando imagem...' : '📁 Escolher Imagem do Computador' }}</span>
                <input type="file" accept="image/*" class="hidden" @change="(e) => handleFileUpload(e, 'banner')" />
              </label>
            </div>
            <input
              v-model="formBannerUrl"
              type="text"
              placeholder="Ou cole a URL direta (https://...)"
              class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 focus:border-red-600 focus:outline-none"
            />
            <div v-if="formBannerUrl" class="h-16 w-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img :src="formBannerUrl" class="h-full w-full object-cover" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Link do Trailer (YouTube)</label>
            <input
              v-model="formTrailerUrl"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-red-600 focus:outline-none"
            />
          </div>

          <div class="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="showModal = false"
              class="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSaving || uploadingPoster || uploadingBanner"
              class="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white shadow-md hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <span v-if="isSaving">Salvando...</span>
              <span v-else>Salvar Filme</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
