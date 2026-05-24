import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    stylistic: {
      semi: false,
    },
    typescript: true,
    vue: true,
    rules: {
      'vue/max-attributes-per-line': ['error', {
        singleline: 3,
        multiline: 1,
      }],
      'pnpm/yaml-enforce-settings': 'off',
    },
  },
  withNuxt(),
)
