<script setup lang="ts">
import { definePageMeta, navigateTo } from '#imports'

definePageMeta({
  middleware: () => {
    return navigateTo('/admin/filmes')
  }
})
</script>

<template>
  <div></div>
</template>
