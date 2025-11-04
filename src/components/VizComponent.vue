<script setup>
import { useDataStore } from '@/stores/data'
import ProteinSequence from './ProteinSequence.vue'
import PeptidesCoverage from './PeptidesCoverage.vue'

const dataStore = useDataStore()
console.log(dataStore.modifications)
console.log(dataStore.peptides)
console.log(dataStore.sequence)
</script>
<template lang="pug">
main
    v-container(fluid)
        h2 Results
        v-row(v-if="dataStore.modifications !== null && dataStore.sequence !== ''")
            .v-col-12
                ProteinSequence(:sequence="dataStore.sequence" :modifications="dataStore.modifications")
        v-row(v-if="dataStore.peptides !== null")
            .v-col-12
                PeptidesCoverage(:peptides="dataStore.peptides" :sequence="dataStore.sequence" :modsClassification="dataStore.peptidesModifications")
</template>