<script setup lang="ts">
defineProps<{
  downloading: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  download: []
}>()
</script>

<template>
  <div class="bg-elevated rounded-2xl border border-default p-5 transition-all hover:border-accented">
    <UButton
      size="lg"
      block
      color="primary"
      :loading="downloading"
      :disabled="loading"
      class="rounded-xl font-medium h-12 cursor-pointer"
      icon="i-heroicons-arrow-down-tray"
      @click="emit('download')"
    >
      {{ downloading ? 'Downloading...' : 'Download Audio' }}
    </UButton>
  </div>
</template>
