<script setup>
import { ref, onBeforeMount } from 'vue'
import { useDataStore } from '@/stores/data'
import ProteinSequence from './ProteinSequence.vue'
import PeptidesCoverage from './PeptidesCoverage.vue'
import PieChartComponent from './PieChartComponent.vue'
import { parseFastaFileContent } from '@/utils/fastaService'

const dataStore = useDataStore()
const selectedProtein = ref(null)
const selectedProteinList = ref(null)
const peptidesReady = ref(false)
const pieChartData = ref(null)
const getFastaSequenceError = ref(false)
const numberOfPeptides = ref(null)

onBeforeMount(async() => {
    // pieChartData.value = setPieChartData(dataStore.sageFileContent)
    console.log('pieChartData',pieChartData.value)
    selectedProteinList.value = dataStore.sageFileContent[0].uniprot_id
    selectedProtein.value = dataStore.sageFileContent[0]
    await setPeptideSequenceCoordinates()
    numberOfPeptides.value = getNumberOfPeptides()
    
    // selectedProtein.value.sequence = await getSequence(selectedProtein.value.accession)
})
const getNumberOfPeptides = () => {
    let nbOrPeptides = 0
    dataStore.sageFileContent.forEach(el => {
        nbOrPeptides = nbOrPeptides + el.peptides.length
    })
    return nbOrPeptides
}
const setPieChartData = (data) => {
    return data.map( el => {
        console.log(el)
        // el.peptides.length()
    })
}
const setPeptideSequenceCoordinates = async() => {
    console.log(dataStore.sageFileContent)
    selectedProtein.value.sequence = await getSequence(selectedProtein.value.accession)
    mapPeptideToSequence(selectedProtein.value.sequence)
    peptidesReady.value = true
    console.log(peptidesReady.value)
}
// TODO give error if accession is not valid
async function getSequence(accession) {
    const url = 'https://rest.uniprot.org/uniprotkb/' + accession + '.fasta';
    let sequence = ''
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`)
        } 
        const response_text = await response.text()
        sequence = parseFastaFileContent(response_text)
        console.log('json', sequence)
    } catch (error) {
        getFastaSequenceError.value = true
        console.error(error.message)
    }
    return sequence
}
const mapPeptideToSequence = (sequence) => {
    selectedProtein.value.peptides.forEach(peptide => {
        const sequenceRegex = new RegExp(String.raw`${peptide.peptide_sequence}`, "g");
        const start = sequence.search(sequenceRegex)+1
        const end = start + peptide.peptide_sequence.length -1
        peptide.peptide_start = start
        peptide.peptide_end = end
        // console.log(start, end)
    })
    console.log('mapPeptideToSequence',selectedProtein.value)
}
const onProteinChange = async() => {
    console.log('onProteinChange')
    peptidesReady.value = false
    console.log(selectedProteinList.value)
    selectedProtein.value = dataStore.sageFileContent.filter(el => el.uniprot_id == selectedProteinList.value)[0]
    console.log(selectedProtein.value)
    await setPeptideSequenceCoordinates()
}

</script>
<template lang="pug">
main
    v-container(fluid)
        h2(class="mb-5") Results
        v-row
            .v-col-6
                p Total number of 
                    strong proteins 
                    | in your results: {{ dataStore.sageFileContent.length }}
                p Total number of 
                    strong peptided 
                    | in your results: {{ numberOfPeptides }}
        v-row
            .v-col-6
                v-select(
                    v-model="selectedProteinList"
                    :items="dataStore.sageFileContent"
                    item-title="uniprot_id"
                    item-value="uniprot_id"
                    label="Selet protein"
                    @update:modelValue="onProteinChange"
                )
        v-row(v-if="!peptidesReady")
            .v-col-12
                p Mapping peptides to sequence
        v-row
            .v-col-12
                div(v-if="selectedProtein.modifications && selectedProtein.modifications.length > 0")
                    ProteinSequence(:sequence="selectedProtein.sequence" :modifications="[]")
        v-row
            .v-col-12
                //- | {{ peptidesReady }}
                div(v-if="peptidesReady")
                    PeptidesCoverage(:peptides="selectedProtein.peptides", :sequence="selectedProtein.sequence")
</template>