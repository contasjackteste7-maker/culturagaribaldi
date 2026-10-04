<script setup lang="ts">
import { definePageMeta, useSupabaseUser, useSupabaseClient, $fetch } from '#imports'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import SpookyMirrorModal from '~/components/urna/SpookyMirrorModal.vue'
import PostVoteScreen from '~/components/urna/PostVoteScreen.vue'

definePageMeta({
  middleware: 'auth-guard',
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { logout } = useAuth()

interface Movie {
  id: string
  title: string
  year: number
  genre: string
  duration: string
  rating: string
  synopsis: string
  bannerUrl: string
  posterUrl: string
  trailerUrl?: string
}

const movies = ref<Movie[]>([])
const votedMovieId = ref<string | null>(null)
const isLoadingCatalog = ref(true)

const votedMovie = computed(() => {
  if (!votedMovieId.value) return null
  return movies.value.find(m => m.id === votedMovieId.value) || null
})

// Modal de Trailer do YouTube
const showTrailerModal = ref(false)
const activeTrailerMovie = ref<Movie | null>(null)

// Mapeamento Oficial de Cores por Classificação Indicativa (Ministério da Justiça / Cinema)
function getRatingRibbonStyle(rating?: string) {
  const clean = (rating || '').trim().toLowerCase()
  if (clean.includes('l') || clean.includes('livre')) {
    // Livre: Verde
    return {
      gradient: 'linear-gradient(45deg, #00a859 0%, #22c55e 51%, #15803d 100%)',
      shadow: '#065f46'
    }
  } else if (clean.includes('10')) {
    // 10 Anos: Azul
    return {
      gradient: 'linear-gradient(45deg, #0070f3 0%, #3b82f6 51%, #1d4ed8 100%)',
      shadow: '#1e40af'
    }
  } else if (clean.includes('12')) {
    // 12 Anos: Amarelo
    return {
      gradient: 'linear-gradient(45deg, #eab308 0%, #f59e0b 51%, #ca8a04 100%)',
      shadow: '#854d0e'
    }
  } else if (clean.includes('14')) {
    // 14 Anos: Laranja
    return {
      gradient: 'linear-gradient(45deg, #f97316 0%, #ea580c 51%, #c2410c 100%)',
      shadow: '#9a3412'
    }
  } else if (clean.includes('16')) {
    // 16 Anos: Vermelho
    return {
      gradient: 'linear-gradient(45deg, #e50914 0%, #ef4444 51%, #b91c1c 100%)',
      shadow: '#991b1b'
    }
  } else if (clean.includes('18')) {
    // 18 Anos: Preto
    return {
      gradient: 'linear-gradient(45deg, #18181b 0%, #27272a 51%, #09090b 100%)',
      shadow: '#000000'
    }
  }
  // Padrão Vermelho CulturaFlix
  return {
    gradient: 'linear-gradient(45deg, #e50914 0%, #ff4b2b 51%, #990000 100%)',
    shadow: '#800000'
  }
}

function getEmbedYoutubeUrl(url?: string): string {
  if (!url) return ''
  let videoId = ''
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1]?.split('&')[0] || ''
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0] || ''
  } else {
    videoId = url
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
}

const wasBgAudioPlayingBeforeTrailer = ref(false)

function openTrailer(movie: Movie) {
  if (!movie.trailerUrl) return
  activeTrailerMovie.value = movie
  showTrailerModal.value = true
  
  if (bgAudioRef.value && !bgAudioRef.value.paused) {
    wasBgAudioPlayingBeforeTrailer.value = true
    bgAudioRef.value.pause()
  } else {
    wasBgAudioPlayingBeforeTrailer.value = false
  }
}

function closeTrailerModal() {
  showTrailerModal.value = false
  activeTrailerMovie.value = null
  
  if (wasBgAudioPlayingBeforeTrailer.value && bgAudioRef.value && !isMuted.value) {
    bgAudioRef.value.play().catch(() => {})
  }
  wasBgAudioPlayingBeforeTrailer.value = false
}

function getRatingWeight(rating?: string): number {
  if (!rating) return 99
  const clean = rating.toLowerCase().trim()
  if (clean.includes('livre') || clean === 'l') return 0
  if (clean.includes('10')) return 10
  if (clean.includes('12')) return 12
  if (clean.includes('14')) return 14
  if (clean.includes('16')) return 16
  if (clean.includes('18')) return 18
  const match = clean.match(/\d+/)
  return match ? parseInt(match[0], 10) : 99
}

async function loadCatalogAndVoteStatus() {
  isLoadingCatalog.value = true
  try {
    const data: any = await $fetch('/api/votos/status')
    if (data?.filmes) {
      const mapped = data.filmes.map((f: any) => ({
        id: f.id,
        title: f.title,
        year: f.year,
        genre: f.genre,
        duration: f.duration,
        rating: f.rating,
        synopsis: f.synopsis,
        bannerUrl: f.banner_url || f.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
        posterUrl: f.poster_url || f.banner_url || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        trailerUrl: f.trailer_url,
      }))

      // Ordenar filmes por faixa etária (Livre -> 10+ -> 12+ -> 14+ -> 16+ -> 18+)
      movies.value = mapped.sort((a: any, b: any) => getRatingWeight(a.rating) - getRatingWeight(b.rating))
    }
    if (data?.jaVotou && data?.voto) {
      votedMovieId.value = data.voto.filme_id
    }
  } catch (err) {
    console.error('Erro ao carregar catálogo/status de voto:', err)
  } finally {
    isLoadingCatalog.value = false
  }
}

// Filme em Destaque no Hero Banner
const selectedMovieIndex = ref(0)
const selectedMovie = computed(() => movies.value[selectedMovieIndex.value] || {
  id: '',
  title: 'CulturaFlix',
  year: 2026,
  genre: 'Horror',
  duration: '1h 45m',
  rating: '16+',
  synopsis: 'Vote for your favorite movie for our special cinema session!',
  bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
  posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
})

const isSubmitting = ref(false)
const showModal = ref(false)
const movieToVote = ref<Movie | null>(null)
const isManualSelection = ref(false)
let autoRotateTimer: any = null

// Usuário atual
const userEmail = computed(() => user.value?.email || 'Student')
const userName = computed(() => user.value?.user_metadata?.full_name || user.value?.email?.split('@')[0] || 'Student')

const catalogRowRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeftPos = ref(0)
let dragMoved = false

function startDrag(e: MouseEvent) {
  if (!catalogRowRef.value) return
  isDragging.value = true
  dragMoved = false
  startX.value = e.pageX - catalogRowRef.value.offsetLeft
  scrollLeftPos.value = catalogRowRef.value.scrollLeft
}

function stopDrag() {
  isDragging.value = false
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value || !catalogRowRef.value) return
  const x = e.pageX - catalogRowRef.value.offsetLeft
  const walk = (x - startX.value) * 1.5
  if (Math.abs(walk) > 5) {
    dragMoved = true
  }
  catalogRowRef.value.scrollLeft = scrollLeftPos.value - walk
}

function handleMovieClick(movie: Movie) {
  if (dragMoved) {
    dragMoved = false
    return
  }
  selectFeaturedMovie(movie)
}

function selectFeaturedMovie(movie: Movie) {
  const index = movies.value.findIndex(m => m.id === movie.id)
  if (index !== -1) {
    selectedMovieIndex.value = index
    isManualSelection.value = true
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer)
      autoRotateTimer = null
    }
  }
}

function clearManualSelection() {
  if (isManualSelection.value) {
    isManualSelection.value = false
    startAutoRotate()
  }
}

function startAutoRotate() {
  if (autoRotateTimer) clearInterval(autoRotateTimer)
  autoRotateTimer = setInterval(() => {
    if (!isManualSelection.value && movies.value.length > 0) {
      selectedMovieIndex.value = (selectedMovieIndex.value + 1) % movies.value.length
    }
  }, 6000)
}

const isScrolled = ref(false)

function handleScroll() {
  if (window.scrollY > 50) {
    isScrolled.value = true
  } else {
    isScrolled.value = false
  }
}

const showNetflixIntro = ref(true)
const isMuted = ref(false)
const bgAudioRef = ref<HTMLAudioElement | null>(null)
const modalAudioRef = ref<HTMLAudioElement | null>(null)
const tudumAudioRef = ref<HTMLAudioElement | null>(null)

function toggleAudio() {
  if (!bgAudioRef.value) return
  if (isMuted.value) {
    bgAudioRef.value.play().then(() => { isMuted.value = false }).catch(() => {})
  } else {
    bgAudioRef.value.pause()
    isMuted.value = true
  }
}

function playTudumAndSequenceBgAudio() {
  if (tudumAudioRef.value) {
    tudumAudioRef.value.currentTime = 0
    tudumAudioRef.value.volume = 0.8
    
    tudumAudioRef.value.onended = () => {
      startBgAudio()
    }
    
    tudumAudioRef.value.play().then(() => {
    }).catch(() => {
      const enableAudioOnUserAction = () => {
        if (tudumAudioRef.value) {
          tudumAudioRef.value.play().then(() => {
            tudumAudioRef.value!.onended = () => { startBgAudio() }
          }).catch(() => {
            startBgAudio()
          })
        } else {
          startBgAudio()
        }
        window.removeEventListener('pointerdown', enableAudioOnUserAction, { once: true })
        window.removeEventListener('click', enableAudioOnUserAction, { once: true })
        window.removeEventListener('keydown', enableAudioOnUserAction, { once: true })
      }
      window.addEventListener('pointerdown', enableAudioOnUserAction, { once: true })
      window.addEventListener('click', enableAudioOnUserAction, { once: true })
      window.addEventListener('keydown', enableAudioOnUserAction, { once: true })
    })
  } else {
    startBgAudio()
  }
}

function startBgAudio() {
  if (!bgAudioRef.value) return
  bgAudioRef.value.volume = 0.8
  bgAudioRef.value.play().then(() => {
    isMuted.value = false
  }).catch(() => {})
}

const isAdmin = ref(false)

async function checkIsAdmin() {
  if (!user.value?.id) return
  try {
    const { data } = await supabase
      .from('administradores')
      .select('user_id')
      .eq('user_id', user.value.id)
      .maybeSingle()

    if (data) {
      isAdmin.value = true
    } else {
      if (user.value.email) {
        const { data: dataByEmail } = await supabase
          .from('administradores')
          .select('id')
          .eq('email', user.value.email)
          .maybeSingle()
        if (dataByEmail) {
          isAdmin.value = true
        }
      }
    }
  } catch (_) {}
}

onMounted(() => {
  loadCatalogAndVoteStatus()
  startAutoRotate()
  window.addEventListener('scroll', handleScroll)
  checkIsAdmin()
  
  playTudumAndSequenceBgAudio()

  setTimeout(() => {
    showNetflixIntro.value = false
  }, 2300)
})

onUnmounted(() => {
  if (autoRotateTimer) clearInterval(autoRotateTimer)
  window.removeEventListener('scroll', handleScroll)
})

function openVoteModal(movie: Movie) {
  if (votedMovieId.value) return
  movieToVote.value = movie
  showModal.value = true

  if (modalAudioRef.value) {
    modalAudioRef.value.currentTime = 0
    modalAudioRef.value.play().catch(() => {})
  }
}

async function confirmVote() {
  if (!movieToVote.value) return
  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/votos', {
      method: 'POST',
      body: { filme_id: movieToVote.value.id },
    })
    if (res?.success) {
      votedMovieId.value = movieToVote.value.id
    }
  } catch (err: any) {
    alert(err?.statusMessage || err?.message || 'Erro ao registrar seu voto.')
  } finally {
    isSubmitting.value = false
    showModal.value = false
  }
}

async function handleLogout() {
  await logout()
}
</script>

<template>
  <div @click="clearManualSelection" class="min-h-screen bg-[#141414] text-white font-sans select-none overflow-x-hidden">

    <!-- Áudio Netflix Tudum na Animação de Entrada -->
    <audio ref="tudumAudioRef" preload="auto" src="/netflix-tudum-sfx-n-c.mp3"></audio>

    <!-- Áudio Ambiente de Fundo -->
    <audio ref="bgAudioRef" loop preload="auto" src="/spooky-ambient.mp3"></audio>

    <!-- Áudio ao Abrir Modal de Votação -->
    <audio ref="modalAudioRef" preload="auto" src="/som-modal.mp3"></audio>

    <!-- Botão Mute / Unmute -->
    <button
      @click.stop="toggleAudio"
      class="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-red-500/30 bg-black/70 px-4 py-2 text-xs font-bold text-red-500 backdrop-blur-md transition-all hover:scale-105 hover:bg-black hover:border-red-500"
      title="Ambient Sound"
    >
      <svg v-if="!isMuted" class="h-4 w-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      <svg v-else class="h-4 w-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
      <span>{{ isMuted ? 'Sound: Off' : 'Sound: On 🎃' }}</span>
    </button>

    <!-- Intro Animada -->
    <Transition name="fade">
      <div v-if="showNetflixIntro" class="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden pointer-events-none">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px]"></div>

        <div class="relative flex flex-col items-center justify-center animate-netflix-zoom">
          <div class="relative">
            <img src="/logo-cultura-vermelho.png" alt="CulturaFlix Logo" class="h-56 sm:h-80 w-auto object-contain drop-shadow-[0_0_60px_rgba(229,9,20,0.9)] animate-pulse-fast" />
            <img src="/logo-cultura-vermelho.png" alt="CulturaFlix Red Shift" class="absolute top-0 left-0 h-56 sm:h-80 w-auto object-contain opacity-80 animate-glitch-fast red-shift mix-blend-screen" />
            <img src="/logo-cultura-vermelho.png" alt="CulturaFlix Cyan Shift" class="absolute top-0 left-0 h-56 sm:h-80 w-auto object-contain opacity-80 animate-glitch-fast cyan-shift mix-blend-screen" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Navbar Estilo Netflix -->
    <header
      class="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 transition-all duration-500"
      :class="isScrolled ? 'bg-black/95 border-b border-white/10 shadow-2xl backdrop-blur-md' : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent'"
    >
      <div class="flex items-center gap-8">
        <img
          src="/logo-cultura-vermelho.png"
          alt="Cultura Logo"
          class="w-auto object-contain transition-all duration-300 drop-shadow-[0_0_20px_rgba(229,9,20,0.6)]"
          :class="isScrolled ? 'h-10 sm:h-12' : 'h-14 sm:h-16'"
        />
      </div>

      <!-- Menu do Usuário -->
      <div class="flex items-center gap-3 sm:gap-4">
        <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
          <div class="h-8 w-8 rounded-md bg-red-600 flex items-center justify-center font-bold text-white shadow-md">
            {{ userName.charAt(0).toUpperCase() }}
          </div>
          <span class="hidden sm:inline font-semibold">{{ userName }}</span>
        </div>

        <!-- Botão Painel Admin -->
        <NuxtLink
          v-if="isAdmin"
          to="/admin/filmes"
          class="inline-flex items-center gap-1.5 rounded-md border border-red-500/50 bg-red-600/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-red-600 hover:scale-105 active:scale-95 transition-all"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Admin Panel</span>
        </NuxtLink>

        <button
          v-if="!votedMovieId"
          @click="handleLogout"
          class="rounded-md border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
        >
          Logout
        </button>
      </div>
    </header>

    <!-- SE O USUÁRIO JÁ VOTOU: Exibe Tela Pós-Votação Macabra (Lockout de Voto Único) -->
    <PostVoteScreen
      v-if="votedMovieId"
      :voted-movie="votedMovie"
      :user-email="userEmail"
      :user-name="userName"
      :all-movies="movies"
      @open-trailer="openTrailer"
    />

    <!-- SE O USUÁRIO AINDA NÃO VOTOU: Exibe Hero Banner e Catálogo para Votação -->
    <template v-else>
      <!-- Hero Banner Carrossel Automático -->
    <section class="relative h-[70vh] sm:h-[80vh] w-full bg-cover bg-center flex items-end pb-16 px-6 sm:px-12 transition-all duration-1000" :style="{ backgroundImage: `url(${selectedMovie.bannerUrl})` }">
      <div class="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-black/60"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>

      <!-- Informações do Filme no Banner -->
      <div class="relative z-10 max-w-2xl space-y-4">
        <div class="flex items-center gap-3 text-xs font-bold text-gray-300">
          <span class="rounded bg-red-600 px-2 py-0.5 text-white uppercase tracking-wider font-extrabold text-[10px]">CulturaFlix</span>
          <span>{{ selectedMovie.year }}</span>
          <span class="border border-gray-500 px-1.5 py-0.5 rounded text-[10px]">{{ selectedMovie.rating }}</span>
          <span>{{ selectedMovie.duration }}</span>
          <span class="text-red-500 font-semibold">• {{ selectedMovie.genre }}</span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black uppercase tracking-tight drop-shadow-lg text-white font-mono">
          {{ selectedMovie.title }}
        </h1>

        <p class="text-xs sm:text-sm text-gray-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
          {{ selectedMovie.synopsis }}
        </p>

        <div class="pt-2 flex flex-wrap items-center gap-4">
          <!-- Botão Votar -->
          <button
            v-if="selectedMovie.id && votedMovieId !== selectedMovie.id"
            @click="openVoteModal(selectedMovie)"
            :disabled="!!votedMovieId"
            class="flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>{{ votedMovieId ? 'Vote Recorded' : 'Vote For This Movie' }}</span>
          </button>

          <!-- Selo de Votado -->
          <div
            v-else-if="votedMovieId === selectedMovie.id"
            class="flex items-center gap-2 rounded-md bg-emerald-600/90 px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-md"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <span>Your Vote Recorded!</span>
          </div>

          <!-- Botão Assistir Trailer -->
          <button
            v-if="selectedMovie.trailerUrl"
            @click.stop="openTrailer(selectedMovie)"
            class="flex items-center gap-2 rounded-md border border-white/30 bg-black/60 px-5 py-3 text-sm font-bold text-white backdrop-blur-md hover:bg-white hover:text-black transition-all active:scale-95"
          >
            <svg class="w-5 h-5 fill-current text-red-600" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Watch Trailer</span>
          </button>
        </div>

        <!-- Indicadores de Rotação do Carrossel Hero -->
        <div v-if="movies.length > 1" class="flex items-center gap-2 pt-2">
          <button
            v-for="(movie, index) in movies"
            :key="movie.id"
            @click="selectedMovieIndex = index"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="selectedMovieIndex === index ? 'w-8 bg-red-600' : 'w-2 bg-gray-600 hover:bg-gray-400'"
          ></button>
        </div>
      </div>
    </section>

    <!-- Catálogo de Filmes em Grid Uiverse Card Box Design -->
    <main id="catalogo" class="relative z-20 -mt-10 px-6 sm:px-12 space-y-10 pb-20">
      <!-- Status da Votação do Usuário -->
      <div v-if="votedMovieId" class="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-center text-sm font-medium text-emerald-400 backdrop-blur-md">
        🎉 Your vote for the Cinema Session was successfully recorded!
      </div>

      <!-- Fileira de Filmes -->
      <div>
        <h2 class="text-lg sm:text-xl font-extrabold tracking-wide text-white mb-6 flex items-center gap-2">
          <span class="h-4 w-1 bg-red-600 rounded-full"></span>
          Cinema Session Options
        </h2>

        <div v-if="isLoadingCatalog" class="py-12 text-center text-gray-400 font-bold">
          Loading movies in theaters...
        </div>

        <div v-else-if="movies.length === 0" class="py-12 text-center text-gray-400 font-bold">
          No movies available for voting at the moment.
        </div>

        <!-- Uiverse.io Inspired Card Box Grid com Cores Oficiais de Classificação (Arrastável no Mobile) -->
        <div
          v-else
          ref="catalogRowRef"
          @mousedown="startDrag"
          @mouseleave="stopDrag"
          @mouseup="stopDrag"
          @mousemove="onDrag"
          class="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-8 sm:pb-0 sm:overflow-visible justify-start sm:justify-items-center select-none cursor-grab active:cursor-grabbing no-scrollbar"
        >
          <div
            v-for="movie in movies"
            :key="movie.id"
            @click.stop="handleMovieClick(movie)"
            class="uiverse-container w-[250px] xs:w-[270px] sm:w-full max-w-[280px] shrink-0 snap-center sm:shrink"
          >
            <div
              class="card_box group relative w-full h-[400px] rounded-[24px] overflow-hidden transition-all duration-300 cursor-pointer border border-white/10 hover:border-red-600/80 flex flex-col justify-between"
              :class="{ 'ring-4 ring-red-600 shadow-[0_0_30px_rgba(229,9,20,0.6)]': selectedMovie.id === movie.id }"
            >
              <!-- Ribbon Tag Superior Esquerda (Com cor oficial da classificação) -->
              <span class="ribbon-tag">
                <span
                  class="ribbon-text"
                  :style="{ backgroundImage: getRatingRibbonStyle(movie.rating).gradient }"
                >
                  {{ movie.rating }}
                </span>
              </span>

              <!-- Imagem do Poster com Gradiente Escuro -->
              <div
                class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                :style="{ backgroundImage: `url(${movie.posterUrl})` }"
              >
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              </div>

              <!-- Overlay centralizado para ver trailer ao passar o mouse -->
              <div v-if="movie.trailerUrl" class="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 backdrop-blur-[2px]">
                <button
                  @click.stop="openTrailer(movie)"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 text-white font-extrabold text-xs shadow-2xl hover:bg-red-700 hover:scale-110 active:scale-95 transition-all"
                >
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Watch Trailer</span>
                </button>
              </div>

              <!-- Informações do Card na parte inferior -->
              <div class="relative z-10 p-4 mt-auto space-y-2.5 bg-gradient-to-t from-black via-black/90 to-transparent">
                <div>
                  <span class="text-[10px] font-extrabold text-red-500 uppercase tracking-widest block">{{ movie.genre }}</span>
                  <h3 class="text-base font-black text-white truncate group-hover:text-red-400 transition-colors">
                    {{ movie.title }}
                  </h3>
                  <div class="mt-0.5 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span>{{ movie.year }} • {{ movie.duration }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <!-- Botão Trailer Preto -->
                  <button
                    v-if="movie.trailerUrl"
                    @click.stop="openTrailer(movie)"
                    class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black border border-white/20 text-[11px] font-bold text-white hover:bg-neutral-900 hover:border-red-600/50 transition-all shadow-md active:scale-95"
                    title="Watch Movie Trailer"
                  >
                    <svg class="w-3.5 h-3.5 fill-current text-red-500" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span>Trailer</span>
                  </button>

                  <!-- Botão Votar -->
                  <button
                    @click.stop="openVoteModal(movie)"
                    :disabled="!!votedMovieId"
                    class="flex-1 rounded-xl bg-red-600 py-2 text-xs font-extrabold text-white transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {{ votedMovieId === movie.id ? 'Your Vote ✓' : (votedMovieId ? 'Voted' : 'Vote') }}
                  </button>
                </div>
              </div>

              <!-- Badge Votado -->
              <div v-if="votedMovieId === movie.id" class="absolute top-3 right-3 bg-emerald-600 text-white rounded-full p-1.5 shadow-xl z-20">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    </template>

    <!-- MODAL DE TRAILER DO YOUTUBE -->
    <Transition name="fade">
      <div
        v-if="showTrailerModal && activeTrailerMovie"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
        @click.self="closeTrailerModal"
      >
        <!-- Logo CulturaFlix Acima do Modal -->
        <div class="mb-4 flex items-center justify-center pointer-events-none">
          <img
            src="/logo-cultura-vermelho.png"
            alt="CulturaFlix Logo"
            class="h-12 sm:h-16 w-auto object-contain drop-shadow-[0_0_25px_rgba(229,9,20,0.8)] animate-pulse"
          />
        </div>

        <div class="card_box no-hover-scale hover:!transform-none relative w-full max-w-4xl rounded-[24px] border border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
          <!-- Ribbon Tag Superior Esquerda da Classificação (Igual aos Cards dos Filmes) -->
          <span class="ribbon-tag">
            <span
              class="ribbon-text"
              :style="{ backgroundImage: getRatingRibbonStyle(activeTrailerMovie.rating).gradient }"
            >
              {{ activeTrailerMovie.rating }}
            </span>
          </span>

          <!-- Cabeçalho do Modal de Trailer -->
          <div class="flex items-center justify-between pl-24 sm:pl-28 pr-6 py-4 border-b border-white/10 bg-black/60 z-10">
            <h3 class="text-base sm:text-lg font-black text-white truncate max-w-md sm:max-w-xl">
              {{ activeTrailerMovie.title }}
            </h3>
            <button
              @click="closeTrailerModal"
              class="h-9 w-9 rounded-full bg-white/10 hover:bg-red-600 text-white font-bold flex items-center justify-center transition shrink-0 ml-3"
              title="Close Trailer"
            >
              ✕
            </button>
          </div>

          <!-- Player do YouTube Iframe -->
          <div class="relative aspect-video w-full bg-black">
            <iframe
              v-if="activeTrailerMovie.trailerUrl"
              :src="getEmbedYoutubeUrl(activeTrailerMovie.trailerUrl)"
              class="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>

          <!-- Rodapé do Modal -->
          <div class="px-6 py-4 bg-black/80 border-t border-white/10 flex items-center justify-between">
            <p class="text-xs text-gray-400 truncate max-w-md">
              {{ activeTrailerMovie.synopsis }}
            </p>
            <button
              v-if="votedMovieId !== activeTrailerMovie.id"
              @click="closeTrailerModal(); openVoteModal(activeTrailerMovie)"
              :disabled="!!votedMovieId"
              class="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-extrabold hover:bg-red-700 transition shrink-0 ml-4 shadow-lg disabled:opacity-50"
            >
              {{ votedMovieId ? 'Vote Recorded' : 'Vote For This Movie' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal Assustador Espelho Sussurrante -->
    <Transition name="fade">
      <SpookyMirrorModal
        v-if="showModal && movieToVote"
        :movie-title="movieToVote.title"
        @confirm="confirmVote"
        @cancel="showModal = false"
      />
    </Transition>
  </div>
</template>

<style scoped>
.uiverse-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card_box {
  background: linear-gradient(170deg, rgba(35, 35, 35, 0.95) 0%, rgb(15, 15, 15) 100%);
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
}

.card_box:hover {
  transform: scale(0.96);
}

.card_box.no-hover-scale:hover {
  transform: none !important;
}

.ribbon-tag {
  position: absolute;
  overflow: hidden;
  width: 140px;
  height: 140px;
  top: -10px;
  left: -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  pointer-events: none;
}

.ribbon-text {
  position: absolute;
  width: 150%;
  height: 38px;
  transform: rotate(-45deg) translateY(-20px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.4);
}

@keyframes netflixZoom {
  0% { transform: scale(0.4); opacity: 0; filter: blur(10px); }
  30% { transform: scale(1); opacity: 1; filter: blur(0); }
  75% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(3.5); opacity: 0; filter: blur(15px); }
}

@keyframes glitchFast {
  0% { transform: translate(0); clip-path: inset(10% 0 30% 0); }
  20% { transform: translate(-5px, 3px); clip-path: inset(40% 0 10% 0); }
  40% { transform: translate(5px, -3px); clip-path: inset(20% 0 50% 0); }
  60% { transform: translate(-3px, 1px); clip-path: inset(60% 0 5% 0); }
  80% { transform: translate(3px, -2px); clip-path: inset(5% 0 70% 0); }
  100% { transform: translate(0); clip-path: inset(0 0 0 0); }
}

.animate-netflix-zoom {
  animation: netflixZoom 2.6s cubic-bezier(0.7, 0, 0.3, 1) forwards;
}

.animate-glitch-fast {
  animation: glitchFast 0.6s infinite steps(2);
}

.red-shift {
  filter: drop-shadow(-4px 0 0 rgba(255, 0, 0, 0.9));
}

.cyan-shift {
  filter: drop-shadow(4px 0 0 rgba(0, 255, 255, 0.9));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
