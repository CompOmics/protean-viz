import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDataStore = defineStore('data', () => {
  const sequence = ref(null)
  const modifications = ref(null)
  const peptides = ref(null)
  const sageFileContent = ref(null)
  const peptidesModifications = ref(null)

  return { sequence, modifications, peptides, peptidesModifications, sageFileContent }
})
