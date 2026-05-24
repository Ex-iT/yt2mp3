<script setup lang="ts">
const { extract, download, loading, downloading, error, data, reset } = useExtractAudio()
const url = ref('')

function handleExtract() {
  extract(url.value)
}

function handleDownload() {
  download()
}

function handleReset() {
  reset()
  url.value = ''
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center">
    <header class="w-full flex items-center justify-between px-6 h-14 border-b border-default">
      <span><span class="text-highlighted">yt2</span><span class="text-primary">mp3</span></span>
      <span class="text-xs text-muted">Private use only</span>
    </header>

    <main class="flex-1 flex flex-col items-center justify-start w-full max-w-2xl px-4 pt-[15vh]">
      <div class="text-center space-y-3 mb-10">
        <h1 class="text-5xl font-bold tracking-tight">
          <span class="text-highlighted">yt2</span><span class="text-primary">mp3</span>
        </h1>
        <p class="text-muted text-sm">
          Extract audio from any YouTube video
        </p>
      </div>

      <UrlInput
        v-model:url="url"
        :loading="loading"
        @submit="handleExtract"
      />

      <div v-if="loading" class="mt-12 flex flex-col items-center gap-3">
        <UIcon name="i-heroicons-arrow-path" class="size-6 text-primary animate-spin" />
        <p class="text-sm text-muted">
          Extracting audio info...
        </p>
      </div>

      <UAlert
        v-if="error && !loading"
        color="error"
        variant="soft"
        :title="error"
        icon="i-heroicons-exclamation-triangle"
        class="w-full max-w-2xl mt-8"
      />

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div v-if="data" class="w-full mt-8 space-y-6">
          <VideoInfo :data="data" />

          <AudioDownloader
            :loading="loading"
            :downloading="downloading"
            @download="handleDownload"
          />

          <div class="flex justify-center">
            <button
              class="text-xs text-muted hover:text-default transition-colors cursor-pointer"
              @click="handleReset"
            >
              Clear & start over
            </button>
          </div>
        </div>
      </Transition>
    </main>
  </div>
</template>
