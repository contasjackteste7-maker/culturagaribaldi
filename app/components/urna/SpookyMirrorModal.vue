<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  movieTitle: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const ghostAudioRef = ref<HTMLAudioElement | null>(null)
let ghostSoundInterval: any = null

function playGhostSound() {
  if (ghostAudioRef.value) {
    ghostAudioRef.value.currentTime = 0
    ghostAudioRef.value.volume = 0.6
    ghostAudioRef.value.play().catch(() => {})
  }
}

onMounted(() => {
  playGhostSound()
  ghostSoundInterval = setInterval(() => {
    playGhostSound()
  }, 3000)
})

onUnmounted(() => {
  if (ghostSoundInterval) {
    clearInterval(ghostSoundInterval)
  }
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
    <audio ref="ghostAudioRef" preload="auto" src="/som-modal.mp3"></audio>

    <!-- Ticket Card Container de Votação (Estilo Ticket Holográfico Preto & Vermelho) -->
    <div class="ticket-card">
      <!-- Fundo Holográfico Perfurado -->
      <div class="bg holographic"></div>

      <!-- Notas Musicais Sombrias em Overlay -->
      <div class="notes">🎬🎬🎬🎬</div>
      <div class="notes">🎟️🎟️🎟️</div>

      <!-- Cabeçalho do Ticket com Fantasminha e Título -->
      <div class="header flex flex-col items-center justify-center">
        <div class="symbol">✁</div>
        
        <!-- Fantasminha Animado Flutuante no Ticket -->
        <div class="ghost-wrapper flex justify-center items-center h-28 my-1 overflow-visible">
          <div class="ghost-container">
            <div class="ghost animate-hover">
              <div class="face">
                <div class="eye eye-left"></div>
                <div class="eye eye-right"></div>
                <div class="mouth animate-smile"></div>
              </div>
              <div class="bottom-container-left">
                <div class="wave"></div>
              </div>
              <div class="bottom-container-right">
                <div class="wave"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="ticket-title mt-1">CULTURAFLIX</div>
      </div>

      <!-- Corpo do Ticket (Filme Selecionado) -->
      <div class="body text-center space-y-2">
        <span class="ticket-badge uppercase">CINE-SCHOOL PASS</span>
        <h2 class="text-xl font-black text-white uppercase tracking-wider">
          CONFIRM VOTE?
        </h2>
        <p class="text-[11px] text-gray-300">You are voting for the movie:</p>
        <div class="movie-box rounded-xl border border-red-500/50 bg-black/80 px-4 py-2 text-sm font-extrabold text-red-500 shadow-md">
          {{ movieTitle }}
        </div>
      </div>

      <!-- Rodapé do Ticket com Código de Barras e Botões -->
      <div class="footer flex flex-col items-center gap-3">
        <div class="number text-xs text-gray-300">
          Session <span class="bold font-bold text-red-500">CINE #2026</span>
        </div>
        <div class="barcode-wrapper flex justify-center w-full my-1">
          <div class="barcode"></div>
        </div>

        <!-- Botões de Ação -->
        <div class="flex items-center gap-3 w-full pt-2">
          <button
            @click="emit('cancel')"
            class="flex-1 rounded-xl border border-white/20 bg-black/80 py-2.5 text-xs font-bold text-gray-300 hover:bg-gray-900 hover:text-white transition-all active:scale-95"
          >
            Cancel
          </button>

          <button
            @click="emit('confirm')"
            class="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-red-700 hover:scale-105 active:scale-95 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-card {
  --width: 320px;
  --height: 520px;
  --perforation-size: 14px;
  --cutouts-adjust: 140px;

  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.75rem;
  grid-template-areas:
    "header"
    "body"
    "footer";

  width: var(--width);
  height: var(--height);
  padding: var(--perforation-size) 0;

  font-family: "Inter", sans-serif;
  user-select: none;
  overflow: hidden;

  box-shadow: 0 0 35px rgba(229, 9, 20, 0.5);
  animation: hover 3.5s ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes hover {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(0, -6px, 0);
  }
}

.bg {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background-color: #0d0d0d;
  border: 1px solid rgba(229, 9, 20, 0.4);
}

.holographic {
  background: linear-gradient(135deg, #140303 0%, #2b0505 50%, #0d0d0d 100%);
}

.holographic::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 70% 20%, rgba(229, 9, 20, 0.25), transparent 70%);
  pointer-events: none;
}

@keyframes bg-pos {
  to {
    background-position: 0 500px;
  }
}

.header {
  position: relative;
  grid-area: header;
  margin: 0 8px;
  text-align: center;
  z-index: 10;
}

.ticket-title {
  font-family: "Impact", sans-serif;
  font-size: 1.8rem;
  letter-spacing: 3px;
  color: #ffffff;
  text-shadow: 0 0 15px rgba(229, 9, 20, 0.8);
}

.symbol {
  position: absolute;
  top: 0px;
  right: 6px;
  rotate: 185deg;
  font-size: 1.1em;
  color: #ff3333;
  line-height: 0.5;
  opacity: 0.6;
}

.body {
  grid-area: body;
  margin: 0 1.25em;
  padding: 0.25em;
  z-index: 10;
}

.ticket-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #ff4d4d;
  background: rgba(229, 9, 20, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(229, 9, 20, 0.4);
}

.footer {
  grid-area: footer;
  z-index: 10;
  margin: 0 1.25em 0.75em 1.25em;
}

.number {
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.barcode-wrapper {
  overflow: hidden;
}

.barcode {
  width: 0;
  height: 28px;
  box-shadow:
    0px 0 0 1px #fff,
    5px 0 0 1px #fff,
    7px 0 0 1px #fff,
    11px 0 0 1px #fff,
    15px 0 0 1px #fff,
    16px 0 0 1px #fff,
    22px 0 0 1px #fff,
    27px 0 0 1px #fff,
    30px 0 0 1px #fff,
    35px 0 0 1px #fff,
    36px 0 0 1px #fff,
    39px 0 0 1px #fff,
    43px 0 0 1px #fff,
    47px 0 0 1px #fff,
    50px 0 0 1px #fff,
    55px 0 0 1px #fff,
    59px 0 0 1px #fff,
    60px 0 0 1px #fff,
    64px 0 0 1px #fff,
    69px 0 0 1px #fff,
    70px 0 0 1px #fff,
    74px 0 0 1px #fff;
  transform: translateX(-37px);
  opacity: 0.85;
}

.notes {
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-size: 3.5rem;
  color: #ff0000;
  opacity: 0.15;
  mix-blend-mode: color-burn;
  transform: translateY(20%);
  z-index: 2;
  pointer-events: none;
}

.notes:nth-child(2) {
  transform: translateY(45%);
}

/* Fantasminha Animado */
.ghost-container {
  padding: 10px;
  margin: 0 auto;
  position: relative;
  width: 250px;
  height: 300px;
  transform: scale(0.32);
  transform-origin: center center;
  opacity: 0.95;
  animation: ghost-float-auto 3.5s ease-in-out infinite alternate;
}

@keyframes ghost-float-auto {
  0% {
    transform: scale(0.32) translateY(0px) rotate(-1deg);
  }
  50% {
    transform: scale(0.35) translateY(-14px) rotate(2deg);
  }
  100% {
    transform: scale(0.32) translateY(0px) rotate(-1deg);
  }
}

.ghost {
  width: 250px;
  height: 300px;
  background: #f8f8ff;
  border-radius: 50% 50% 0 0;
  box-shadow: 0 5px 40px 0px rgba(255, 255, 255, 0.7);
  position: relative;
  opacity: 0.95;
  animation: animate-hover 3s ease-in-out infinite alternate;
}

.ghost::before,
.ghost::after {
  content: '';
  background: #f8f8ff;
  position: absolute;
  z-index: 10;
  bottom: -17px;
  width: 160px;
  height: 190px;
  border-radius: 18%;
}

.ghost::before {
  left: 3px;
  transform: skew(-34deg) rotate(-23deg);
}

.ghost::after {
  right: 3px;
  transform: skew(34deg) rotate(24deg);
}

.bottom-container-left,
.bottom-container-right {
  width: 160px;
  height: 100px;
  overflow: hidden;
  bottom: -90px;
  position: absolute;
  z-index: 20;
}

.bottom-container-left .wave,
.bottom-container-right .wave {
  display: block;
  position: relative;
  height: 40px;
  background: #f8f8ff;
}

.bottom-container-left .wave::before,
.bottom-container-right .wave::before {
  display: none;
}

.bottom-container-left .wave::after,
.bottom-container-right .wave::after {
  content: "";
  display: block;
  position: absolute;
  border-radius: 100%;
  width: 100%;
  height: 300px;
  background-color: #f8f8ff;
  left: -25%;
  top: -240px;
}

.bottom-container-left {
  transform: rotate(180deg) scaleY(-1);
}

.bottom-container-right {
  right: 0;
}

.face {
  position: absolute;
  z-index: 20;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 70px;
}

.face .eye {
  background: #0d0d0d;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  position: absolute;
}

.face .eye::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f8f8ff;
  position: absolute;
  right: 8px;
  top: 6px;
}

.face .eye-left {
  left: 0;
}

.face .eye-right {
  right: 0;
}

.face .mouth {
  background: #0d0d0d;
  width: 42px;
  height: 40px;
  border-radius: 50%;
  position: absolute;
  left: 30%;
  z-index: -1;
  bottom: 0;
}

.face .mouth::before {
  content: '';
  background: #f8f8ff;
  width: 48px;
  height: 40px;
  border-radius: 50%;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 6px;
}

.animate-hover {
  animation: animate-hover 4s ease-in-out infinite alternate;
}

@keyframes animate-hover {
  0% {
    transform: translateY(0px);
    opacity: 0.85;
    box-shadow: 0 5px 30px 0px rgba(255, 255, 255, 0.6);
  }
  50% {
    transform: translateY(-20px);
    opacity: 1;
    box-shadow: 0 5px 50px 0px rgba(229, 9, 20, 0.9);
  }
  100% {
    transform: translateY(0px);
    opacity: 0.85;
    box-shadow: 0 5px 30px 0px rgba(255, 255, 255, 0.6);
  }
}
</style>
