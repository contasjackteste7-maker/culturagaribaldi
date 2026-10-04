<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'done'): void
}>()

const isVisible = ref(true)
const audioRef = ref<HTMLAudioElement | null>(null)

function playJumpscareSound() {
  if (audioRef.value) {
    audioRef.value.currentTime = 0
    audioRef.value.volume = 0.9
    audioRef.value.play().catch(() => {})
  }
}

function dismiss() {
  isVisible.value = false
  emit('done')
}

onMounted(() => {
  playJumpscareSound()

  // O fantasma surge do nada, flutua assustadoramente e desaparece após 3 segundos
  setTimeout(() => {
    dismiss()
  }, 3200)
})
</script>

<template>
  <Transition name="spectral-fade">
    <div
      v-if="isVisible"
      @click="dismiss"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-lg select-none cursor-pointer overflow-hidden"
    >
      <!-- Áudio do Susto do Fantasma -->
      <audio ref="audioRef" preload="auto" src="/som-modal.mp3"></audio>

      <!-- Névoa Vermelha e Vignette em Movimento -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.35)_0%,rgba(0,0,0,0.95)_70%)] animate-pulse pointer-events-none"></div>
      <div class="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

      <!-- Partículas de Fumaça Espectral -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="smoke-particle particle-1"></div>
        <div class="smoke-particle particle-2"></div>
        <div class="smoke-particle particle-3"></div>
      </div>

      <!-- O FANTASMA ASSUSTADOR (Aparecendo do Nada & Saindo) -->
      <div class="relative z-10 flex flex-col items-center justify-center animate-jumpscare-ghost">
        
        <!-- Ilustração Espectral do Fantasma de Terror 3D/SVG -->
        <div class="relative w-72 h-96 sm:w-96 sm:h-[450px] filter drop-shadow-[0_0_60px_rgba(255,0,0,0.9)]">
          <svg viewBox="0 0 200 250" class="w-full h-full text-white fill-current">
            <defs>
              <radialGradient id="ghostGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
                <stop offset="50%" stop-color="#fecdd3" stop-opacity="0.7" />
                <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
              </radialGradient>
              <filter id="spectralBlur">
                <feGaussianBlur stdDeviation="1.5" />
              </filter>
            </defs>

            <!-- Aura Espectral Externa -->
            <path
              d="M 100 20 C 50 20, 20 60, 20 120 C 20 180, 40 210, 20 240 C 50 230, 70 245, 100 230 C 130 245, 150 230, 180 240 C 160 210, 180 180, 180 120 C 180 60, 150 20, 100 20 Z"
              fill="url(#ghostGlow)"
              class="animate-ghost-wobble"
            />

            <!-- Corpo Principal Macabro -->
            <path
              d="M 100 30 C 60 30, 30 70, 30 125 C 30 175, 45 200, 30 230 C 55 220, 75 235, 100 220 C 125 235, 145 220, 170 230 C 155 200, 170 175, 170 125 C 170 70, 140 30, 100 30 Z"
              fill="#ffffff"
              opacity="0.9"
            />

            <!-- Olhos Vermelhos Brilhantes Assustadores -->
            <g class="animate-eye-flare">
              <ellipse cx="70" cy="95" rx="14" ry="20" fill="#000000" />
              <ellipse cx="130" cy="95" rx="14" ry="20" fill="#000000" />
              <!-- Pupilas em Chamas Vermelhas -->
              <circle cx="70" cy="95" r="6" fill="#ef4444" class="animate-ping" />
              <circle cx="130" cy="95" r="6" fill="#ef4444" class="animate-ping" />
              <circle cx="70" cy="95" r="4" fill="#ffffff" />
              <circle cx="130" cy="95" r="4" fill="#ffffff" />
            </g>

            <!-- Boca Aberta Gritando em Desespero -->
            <path
              d="M 75 145 Q 100 195 125 145 Q 100 135 75 145 Z"
              fill="#000000"
              class="animate-scream-mouth"
            />

            <!-- Fumaça caindo da boca -->
            <ellipse cx="100" cy="165" rx="8" ry="15" fill="#ef4444" opacity="0.6" filter="url(#spectralBlur)" />
          </svg>

          <!-- Feixes de Luz Vermelha dos Olhos -->
          <div class="absolute top-[35%] left-[30%] w-3 h-24 bg-gradient-to-b from-red-600 via-red-500 to-transparent rounded-full blur-sm rotate-[-15deg] animate-pulse"></div>
          <div class="absolute top-[35%] right-[30%] w-3 h-24 bg-gradient-to-b from-red-600 via-red-500 to-transparent rounded-full blur-sm rotate-[15deg] animate-pulse"></div>
        </div>

        <!-- Texto Espectral Tremendo -->
        <h2 class="mt-4 text-3xl sm:text-5xl font-black uppercase tracking-widest text-red-600 drop-shadow-[0_0_35px_rgba(255,0,0,1)] font-mono animate-glitch-text">
          BOO! 👻
        </h2>
        <p class="text-xs text-gray-400 font-mono tracking-widest mt-2 uppercase opacity-80">
          [ Click anywhere to skip ]
        </p>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes jumpscareGhost {
  0% {
    transform: scale(0.1) translateY(200px) rotate(-10deg);
    opacity: 0;
    filter: blur(20px);
  }
  25% {
    transform: scale(1.35) translateY(-20px) rotate(4deg);
    opacity: 1;
    filter: blur(0px);
  }
  40% {
    transform: scale(1.1) translateY(0px) rotate(-2deg);
    opacity: 0.95;
  }
  75% {
    transform: scale(1.2) translateY(-30px) rotate(3deg);
    opacity: 0.9;
    filter: blur(2px);
  }
  100% {
    transform: scale(3.2) translateY(-150px) rotate(-5deg);
    opacity: 0;
    filter: blur(25px);
  }
}

@keyframes ghostWobble {
  0%, 100% { transform: translateY(0) scaleX(1); }
  50% { transform: translateY(-10px) scaleX(1.05); }
}

@keyframes screamMouth {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes glitchText {
  0%, 100% { transform: translate(0); text-shadow: 0 0 20px red; }
  20% { transform: translate(-3px, 2px); text-shadow: -4px 0 red, 4px 0 cyan; }
  40% { transform: translate(3px, -2px); text-shadow: 4px 0 red, -4px 0 cyan; }
  60% { transform: translate(-2px, -1px); text-shadow: -2px 0 red, 2px 0 cyan; }
}

.animate-jumpscare-ghost {
  animation: jumpscareGhost 3.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.animate-ghost-wobble {
  animation: ghostWobble 1.5s infinite ease-in-out;
}

.animate-scream-mouth {
  transform-origin: center center;
  animation: screamMouth 0.8s infinite ease-in-out;
}

.animate-glitch-text {
  animation: glitchText 0.4s infinite ease-in-out;
}

.smoke-particle {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(229, 9, 20, 0.25) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(40px);
  animation: floatSmoke 6s infinite ease-in-out;
}

.particle-1 { top: 10%; left: 20%; animation-delay: 0s; }
.particle-2 { bottom: 15%; right: 20%; animation-delay: 2s; }
.particle-3 { top: 40%; right: 35%; animation-delay: 4s; }

@keyframes floatSmoke {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
  50% { transform: translate(40px, -50px) scale(1.3); opacity: 0.6; }
}

.spectral-fade-enter-active,
.spectral-fade-leave-active {
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.spectral-fade-enter-from,
.spectral-fade-leave-to {
  opacity: 0;
}
</style>
