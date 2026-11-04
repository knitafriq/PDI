import { defineConfig } from 'vite'

// RETIRED staging branch: do not publish legacy prototype_dummy/ warehouse files.
// Builds only the static redirect in index.html. This is NOT production source.
export default defineConfig({ publicDir: false })
