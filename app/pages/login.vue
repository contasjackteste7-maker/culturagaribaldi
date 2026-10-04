<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginAuthForm from '~/components/login/LoginAuthForm.vue'
import SpectralGhostBg from '~/components/login/SpectralGhostBg.client.vue'

definePageMeta({
  layout: false,
  middleware: 'guest-guard',
})

const isMuted = ref(false)
const audioRef = ref<HTMLAudioElement | null>(null)
const showGlitchIntro = ref(true)
const introProgress = ref(0)
const glitchText = ref('SISTEMA INICIALIZANDO...')

function toggleAudio() {
  if (!audioRef.value) return
  if (isMuted.value) {
    audioRef.value.play().then(() => {
      isMuted.value = false
    }).catch(() => {})
  } else {
    audioRef.value.pause()
    isMuted.value = true
  }
}

function startAudio() {
  if (!audioRef.value) return
  audioRef.value.volume = 0.6

  const playPromise = audioRef.value.play()
  if (playPromise !== undefined) {
    playPromise.then(() => {
      isMuted.value = false
    }).catch(() => {
      const enableAudio = () => {
        if (audioRef.value && audioRef.value.paused) {
          audioRef.value.volume = 0.6
          audioRef.value.play().then(() => {
            isMuted.value = false
          }).catch(() => {})
        }
      }
      window.addEventListener('pointerdown', enableAudio, { once: true })
      window.addEventListener('click', enableAudio, { once: true })
      window.addEventListener('touchstart', enableAudio, { once: true })
      window.addEventListener('keydown', enableAudio, { once: true })
    })
  }
}

onMounted(() => {
  if (audioRef.value) {
    audioRef.value.load()
  }

  startAudio()

  const enableAudioInstant = () => {
    if (audioRef.value && audioRef.value.paused) {
      audioRef.value.volume = 0.6
      audioRef.value.play().then(() => {
        isMuted.value = false
      }).catch(() => {})
    }
  }

  window.addEventListener('pointerdown', enableAudioInstant, { once: true })
  window.addEventListener('click', enableAudioInstant, { once: true })
  window.addEventListener('touchstart', enableAudioInstant, { once: true })
  window.addEventListener('keydown', enableAudioInstant, { once: true })

  // Revela o sistema após breve exibição da logo com efeito glitch
  setTimeout(() => {
    showGlitchIntro.value = false
  }, 1800)
})

</script>

<template>
  <main class="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4 sm:p-6 text-white overflow-hidden select-none">
    <!-- Screen Glitch Preloader Intro (Tela cheia de entrada) -->
    <Transition name="fade">
      <div v-if="showGlitchIntro" @click="showGlitchIntro = false; startAudio()" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-6 text-center font-mono cursor-pointer">
        <!-- Scanlines CRT Overlay -->
        <div class="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

        <!-- Conteúdo do Glitch Intro (Apenas a logo em animação Glitch) -->
        <div class="relative z-10 flex flex-col items-center max-w-lg">
          <div class="relative">
            <img src="/logo-cultura-vermelho.png" alt="Cultura Logo Glitch" class="h-44 sm:h-60 w-auto object-contain animate-glitch drop-shadow-[0_0_30px_rgba(229,9,20,0.8)]" />
            <img src="/logo-cultura-vermelho.png" alt="Cultura Logo Red Glitch" class="absolute top-0 left-0 h-44 sm:h-60 w-auto object-contain opacity-70 animate-glitch-fast red-shift mix-blend-screen" />
            <img src="/logo-cultura-vermelho.png" alt="Cultura Logo Blue Glitch" class="absolute top-0 left-0 h-44 sm:h-60 w-auto object-contain opacity-70 animate-glitch-fast cyan-shift mix-blend-screen" />
          </div>
          <p class="mt-8 text-xs sm:text-sm font-semibold tracking-widest text-red-500/90 animate-pulse">CLICK ANYWHERE TO START 🎃</p>
        </div>

      </div>
    </Transition>

    <!-- Fundo Animado Interativo 3D Spectral Ghost -->
    <SpectralGhostBg />

    <!-- Áudio de Fundo Assustador com Autoplay Local -->
    <audio ref="audioRef" loop autoplay preload="auto" src="/spooky-ambient.mp3"></audio>

    <!-- Botão Mute / Unmute de Áudio no Canto -->
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

    <!-- Overlay Gradiente Escuro -->
    <div class="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/40 to-black/80 pointer-events-none"></div>

    <!-- Header com Logo Cultura Vermelho com Animação Glitch e Float -->
    <div class="z-10 mb-4 sm:mb-6 flex flex-col items-center justify-center text-center">
      <div class="relative group">
        <img src="/logo-cultura-vermelho.png" alt="Cultura Language Center" class="h-32 sm:h-44 w-auto object-contain drop-shadow-[0_0_30px_rgba(229,9,20,0.7)] animate-subtle-glitch transition-all hover:scale-105" />
      </div>
    </div>

    <!-- Card Principal de Login com visual Netflix -->
    <div class="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl p-2 sm:p-4">
      <LoginAuthForm />
    </div>
  </main>
</template>

<style scoped>
/* Keyframes de Glitch Terror */
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

@keyframes glitchFast {
  0% { transform: translate(0); clip-path: inset(10% 0 30% 0); }
  15% { transform: translate(-4px, 3px); clip-path: inset(40% 0 10% 0); }
  30% { transform: translate(4px, -3px); clip-path: inset(20% 0 50% 0); }
  45% { transform: translate(-3px, 1px); clip-path: inset(60% 0 5% 0); }
  60% { transform: translate(3px, -2px); clip-path: inset(5% 0 70% 0); }
  75% { transform: translate(-2px, 4px); clip-path: inset(35% 0 25% 0); }
  100% { transform: translate(0); clip-path: inset(0 0 0 0); }
}

@keyframes subtleGlitch {
  0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 30px rgba(229, 9, 20, 0.7)); }
  92% { transform: translateY(0); filter: drop-shadow(0 0 30px rgba(229, 9, 20, 0.7)); }
  93% { transform: translate(-3px, 1px) skewX(2deg); filter: drop-shadow(-4px 0 35px rgba(255, 0, 0, 0.9)); }
  94% { transform: translate(3px, -1px) skewX(-2deg); filter: drop-shadow(4px 0 35px rgba(0, 255, 255, 0.9)); }
  95% { transform: translate(0); filter: drop-shadow(0 0 30px rgba(229, 9, 20, 0.7)); }
}

.animate-glitch {
  animation: glitch 2s infinite ease-in-out;
}

.animate-glitch-fast {
  animation: glitchFast 0.8s infinite steps(2);
}

.animate-subtle-glitch {
  animation: subtleGlitch 4s infinite ease-in-out;
}

.red-shift {
  filter: drop-shadow(-3px 0 0 rgba(255, 0, 0, 0.8));
}

.cyan-shift {
  filter: drop-shadow(3px 0 0 rgba(0, 255, 255, 0.8));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>




