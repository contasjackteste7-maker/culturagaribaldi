<script setup lang="ts">
import { computed } from 'vue'

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

const props = defineProps<{
  votedMovie: Movie | null
  userEmail: string
  userName: string
  allMovies: Movie[]
}>()

const emit = defineEmits<{
  (e: 'open-trailer', movie: Movie): void
}>()

// Função para estilo da ribbon tag de classificação
function getRatingRibbonStyle(rating?: string) {
  if (!rating) {
    return { gradient: 'linear-gradient(45deg, #e50914 0%, #ff4b2b 51%, #990000 100%)' }
  }
  const clean = rating.toLowerCase().trim()
  if (clean.includes('livre') || clean === 'l') {
    return { gradient: 'linear-gradient(45deg, #16a34a 0%, #22c55e 51%, #15803d 100%)' }
  } else if (clean.includes('10')) {
    return { gradient: 'linear-gradient(45deg, #2563eb 0%, #3b82f6 51%, #1d4ed8 100%)' }
  } else if (clean.includes('12')) {
    return { gradient: 'linear-gradient(45deg, #eab308 0%, #f59e0b 51%, #ca8a04 100%)' }
  } else if (clean.includes('14')) {
    return { gradient: 'linear-gradient(45deg, #f97316 0%, #ea580c 51%, #c2410c 100%)' }
  } else if (clean.includes('16')) {
    return { gradient: 'linear-gradient(45deg, #e50914 0%, #ef4444 51%, #b91c1c 100%)' }
  } else if (clean.includes('18')) {
    return { gradient: 'linear-gradient(45deg, #18181b 0%, #27272a 51%, #09090b 100%)' }
  }
  return { gradient: 'linear-gradient(45deg, #e50914 0%, #ff4b2b 51%, #990000 100%)' }
}
</script>

<template>
  <div class="relative min-h-[90vh] pt-24 pb-20 px-4 sm:px-8 flex flex-col items-center justify-center overflow-hidden">
    
    <!-- Fundo Sombrio com Névoa e Gradiente de Sangue -->
    <div class="absolute inset-0 bg-gradient-to-b from-black via-[#100404] to-[#1a0505] -z-10"></div>
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- Container Principal Card Ticket Holográfico Macabro -->
    <div class="relative w-full max-w-3xl rounded-[30px] border border-red-600/40 bg-black/90 p-6 sm:p-10 shadow-[0_0_60px_rgba(229,9,20,0.35)] backdrop-blur-xl space-y-8 text-center">
      
      <!-- Título & Mensagem de Confirmação Macabra -->
      <div class="space-y-3 pt-2">
        <span class="px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/50 text-red-400 font-black text-xs uppercase tracking-widest inline-block shadow-inner">
          ✓ VOTE CONFIRMED & RECORDED
        </span>

        <h1 class="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_25px_rgba(229,9,20,0.8)] font-mono">
          We hope to see you! 👻
        </h1>

        <p class="text-gray-300 text-sm sm:text-base font-semibold max-w-xl mx-auto leading-relaxed">
          Thank you for voting, <span class="text-red-500 font-extrabold">{{ userName }}</span>! Your vote at CulturaFlix has been sealed successfully.
        </p>
      </div>

      <!-- Card em Destaque do Dia da Sessão (30/10) -->
      <div class="relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/80 via-black to-red-950/80 p-5 sm:p-6 shadow-2xl text-center space-y-2">
        <div class="flex items-center justify-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest">
          <span class="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          Scheduled Movie Session
        </div>
        
        <h2 class="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider drop-shadow">
          📅 MOVIE SESSION DATE: <span class="text-red-500 underline underline-offset-8 decoration-red-600">OCTOBER 30TH (10/30)</span>
        </h2>
        
        <p class="text-xs sm:text-sm text-gray-400 font-medium">
          Grab your popcorn and get ready to be spooked with us on this special date!
        </p>
      </div>

      <!-- Detalhes do Filme Escolhido (Ingresso do Filme) -->
      <div v-if="votedMovie" class="relative rounded-2xl border border-white/10 bg-neutral-900/90 p-5 text-left flex flex-col sm:flex-row items-center gap-6 shadow-xl overflow-hidden">
        
        <!-- Poster do Filme com Ribbon de Classificação -->
        <div class="relative w-36 h-52 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/20 group">
          <!-- Ribbon Tag da Classificação -->
          <span class="ribbon-tag">
            <span
              class="ribbon-text"
              :style="{ backgroundImage: getRatingRibbonStyle(votedMovie.rating).gradient }"
            >
              {{ votedMovie.rating }}
            </span>
          </span>

          <img :src="votedMovie.posterUrl" :alt="votedMovie.title" class="w-full h-full object-cover" />
        </div>

        <!-- Informações do Ticket do Filme -->
        <div class="flex-1 space-y-3 text-center sm:text-left w-full">
          <div>
            <span class="text-[11px] font-extrabold text-red-500 uppercase tracking-widest block">Your Selected Movie</span>
            <h3 class="text-xl sm:text-2xl font-black text-white tracking-wide">
              {{ votedMovie.title }}
            </h3>
            <p class="text-xs text-gray-400 font-semibold mt-1">
              {{ votedMovie.year }} • {{ votedMovie.duration }} • {{ votedMovie.genre }}
            </p>
          </div>

          <p class="text-xs text-gray-300 line-clamp-2 leading-relaxed">
            {{ votedMovie.synopsis }}
          </p>

          <div class="pt-2 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
            <button
              v-if="votedMovie.trailerUrl"
              @click="emit('open-trailer', votedMovie)"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black border border-white/20 text-xs font-extrabold text-white hover:bg-neutral-900 transition shadow-md active:scale-95"
            >
              <svg class="w-4 h-4 fill-current text-red-500" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>Watch Trailer Again</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Código de Barras Macabro no Rodapé do Ticket -->
      <div class="pt-4 border-t border-white/10 flex flex-col items-center gap-2">
        <div class="font-mono text-2xl tracking-[0.3em] text-gray-400 select-none opacity-80">
          |||||| | |||| |||| | ||| ||||| | |||
        </div>
        <p class="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
          CONFIRMED SINGLE TICKET • CULTURAFLIX 2026-3010
        </p>
      </div>

    </div>

    <!-- Carrossel de Outros Filmes (Apenas para ver Trailers - Padrão Uiverse Card Box) -->
    <div v-if="allMovies.length > 1" class="w-full max-w-5xl mt-16 space-y-6">
      <h3 class="text-lg font-extrabold text-white text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
        <span class="h-4 w-1 bg-red-600 rounded-full"></span>
        Watch Trailers of Other Movies in Theaters
      </h3>

      <div class="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 px-2 no-scrollbar scroll-smooth">
        <div
          v-for="movie in allMovies.filter(m => m.id !== votedMovie?.id)"
          :key="movie.id"
          class="uiverse-container w-[250px] xs:w-[270px] sm:w-[280px] shrink-0 snap-center"
        >
          <div
            class="card_box group relative w-full h-[400px] rounded-[24px] overflow-hidden transition-all duration-300 cursor-pointer border border-white/10 hover:border-red-600/80 flex flex-col justify-between"
            @click.stop="emit('open-trailer', movie)"
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
                @click.stop="emit('open-trailer', movie)"
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
                  @click.stop="emit('open-trailer', movie)"
                  class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black border border-white/20 text-[11px] font-bold text-white hover:bg-neutral-900 hover:border-red-600/50 transition-all shadow-md active:scale-95"
                  title="Watch Movie Trailer"
                >
                  <svg class="w-3.5 h-3.5 fill-current text-red-500" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Watch Trailer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
