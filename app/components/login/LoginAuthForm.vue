<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../../composables/useAuth'

const isLoading = ref(false)
const authError = ref('')
const { loginWithGoogle } = useAuth()

async function handleGoogleLogin(): Promise<void> {
  authError.value = ''
  isLoading.value = true

  try {
    await loginWithGoogle()
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Could not initiate Google login.'
    isLoading.value = false
  }
}
</script>

<template>
  <section class="flex w-full flex-col items-center justify-center p-6 sm:p-8">
    <div class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold tracking-tight text-white">
          Sign In to Vote
        </h2>
        <p class="mt-2 text-xs text-gray-400">
          Use your Google account to access the catalog and submit your movie vote.
        </p>
      </div>


      <div class="space-y-6">
        <p
          v-if="authError"
          class="rounded-xl border border-red-500/40 bg-red-950/60 p-3.5 text-xs font-medium text-red-300 text-center"
        >
          {{ authError }}
        </p>

        <!-- Botão Entrar com Google estilo Netflix / Dark Premium -->
        <button
          class="group relative flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-900 shadow-md hover:bg-gray-100 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isLoading"
          type="button"
          @click="handleGoogleLogin"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{{ isLoading ? 'Connecting with Google...' : 'Sign in with Google' }}</span>
        </button>

        <div class="pt-2 text-center border-t border-white/10">
          <p class="text-[11px] font-medium text-gray-500">
            Secure access for students and teachers
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

