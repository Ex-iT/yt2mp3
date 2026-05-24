<script setup lang="ts">
import type { ExtractResponse } from '~/types/youtube'

const props = defineProps<{
  data: ExtractResponse
}>()

const bestThumbnail = computed(() => {
  const sorted = [...props.data.thumbnails].sort((a, b) => b.width - a.width)
  return sorted[0]?.url ?? ''
})

const thumbnailFailed = ref(false)

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatBitrate(bps: number): string {
  return `${Math.round(bps / 1000)} kbps`
}
</script>

<template>
  <div class="bg-elevated rounded-2xl border border-default p-5 transition-all hover:border-accented">
    <div class="flex gap-5 items-start">
      <div
        class="w-44 aspect-video bg-accented rounded-xl flex-shrink-0 overflow-hidden shadow-lg"
        :class="{ 'flex items-center justify-center': thumbnailFailed }"
      >
        <img
          v-if="!thumbnailFailed"
          :src="bestThumbnail"
          :alt="data.title"
          class="w-full h-full object-cover"
          @error="thumbnailFailed = true"
        >
        <UIcon v-else name="i-heroicons-musical-note" class="size-8 text-muted" />
      </div>
      <div class="flex flex-col gap-2 min-w-0 flex-1">
        <h2 class="font-semibold text-base truncate text-highlighted">
          {{ data.title }}
        </h2>
        <div class="flex items-center gap-3 text-sm text-muted">
          <span class="truncate">{{ data.uploader }}</span>
          <span class="size-1 rounded-full bg-muted" />
          <span class="whitespace-nowrap">{{ formatDuration(data.duration) }}</span>
        </div>
        <div class="flex gap-2 mt-1.5">
          <UBadge size="sm" variant="soft" color="info">
            {{ data.bestAudio.format.toUpperCase() }}
          </UBadge>
          <UBadge size="sm" variant="soft" color="info">
            {{ formatBitrate(data.bestAudio.bitrate) }}
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>
