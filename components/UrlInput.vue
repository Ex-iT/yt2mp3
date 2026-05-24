<script setup lang="ts">
const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{ submit: [] }>()
const url = defineModel<string>('url', { required: true })
const ytPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}(?=[?#&]|$)|^[\w-]{11}$/
const isValid = computed(() => ytPattern.test(url.value.trim()))

function onSubmit() {
  if (isValid.value)
    emit('submit')
}
</script>

<template>
  <form class="flex w-full max-w-xl gap-2" @submit.prevent="onSubmit">
    <UInput
      v-model="url"
      placeholder="Paste a YouTube link..."
      size="lg"
      class="flex-1 [&_input]:bg-elevated [&_input]:border-default [&_input]:focus:border-primary/50 [&_input]:focus:ring-2 [&_input]:focus:ring-primary/20 [&_input]:pl-4 [&_input]:rounded-xl"
    >
      <template v-if="isValid" #trailing>
        <UIcon name="i-heroicons-check-circle" class="text-green-500 size-5" />
      </template>
    </UInput>
    <UButton
      type="submit"
      size="lg"
      label="Extract"
      color="primary"
      :disabled="!isValid || props.loading"
      :loading="props.loading"
      class="rounded-xl font-medium px-6 cursor-pointer"
    />
  </form>
</template>
