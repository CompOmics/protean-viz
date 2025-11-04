<script setup>

import router from '@/router';
import { onBeforeMount, ref, watch } from 'vue';
import { useDataStore } from '@/stores/data';
import { parse } from 'vue/compiler-sfc';
import { unimod_db } from '../utils/unimod_db.js'

console.log('unimod_data',unimod_db)
const dataStore = useDataStore()
const tmpSeq = 'MSHVAVENALGLDQQFAGLDLNSSDNQSGGSTASSFYDKDSSGWSSSKDKDAYSSFGSRSDSRGKSSFFSDRGSGSRGRFDDRGRSDYDGIGSRGDRSGFGKFERGGNSRWCDKSDEDDWSKPLPPSERLEQELFSGGNTGINFEKYDDIPVEATGNNCPPHIESFSDVEMGEIIMGNIELTRYTRPTPVQKHAIPIIKEKRDLMACAQTGSGKTAAFLLPILSQIYSDGPGEALRAMKENGRYGRRKQYPISLVLAPTRELAVQIYEEARKFSYRSRVRPCVVYGGADIGQQIRDLERGCHLLVATPGRLVDMMERGKIGLDFCKYLVLDEADRMLDMGFEPQIRRIVEQDTMPPKGVRHTMMFSATFPKEIQMLARDFLDEYIFLAVGRVGSTSENITQKVVWVEESDKRSFLLDLLNATGKDSLTLVFVETKKGADSLEDFLYHEGYACTSIHGDRSQRDREEALHQFRSGKSPILVATAVAARGLDISNVKHVINFDLPSDIEEYVHRIGRTGRVGNLGLATSFFNERNINITKDLLDLLVEAKQEVPSWLENMAYEHHYKGSSRGRSKSSRFSGGFGARDYRQSSGASSSSFSSSRASSSRSGGGGHGSSRGFGGGGYGGFYNSDGYGGNYNSQGVDWWGN'
const fileType = ref(null)
const sequence = ref(null)
const sequenceFile = ref(null)
const modificationsFile = ref(null)
const peptidesFile = ref(null)
const sageFile = ref(null)
const isDisabled = ref(true)
// const filesReady = ref(false)
const fixedModifications = ref(null)
const variableModifications = ref(null)

const modRegex = /\[[+|-]([0-9]+\.[0-9]+\])/g

watch(
    () => sequence.value,
    () => {
        dataStore.sequence = sequence.value
        console.log('dataStore.sequence', dataStore.sequence)
    }
)
onBeforeMount(async () => {
  console.log('onBeforeMount')
  // await getSequence('O00571')
})
const filesReady = () => {
    console.log(dataStore.sequence !== null && (dataStore.peptides !== null || dataStore.modifications !== null))
    if((dataStore.sequence !== null && (dataStore.peptides !== null || dataStore.modifications !== null)) || dataStore.sageFileContent !== null) {
        return true
    }
    return false
}

async function getSequence(accession) {
  const url = 'https://rest.uniprot.org/uniprotkb/' + accession + '.fasta';
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    } 
    const response_text = await response.text()
    dataStore.sequence = parseFastaFileContent(response_text)
    console.log('json', dataStore.sequence)
  } catch (error) {
    console.error(error.message)
  }
}

function parseFastaFileContent(fileContent) {
  let sequence = ''
  const lines = fileContent.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('>')) {
      sequence += lines[i]
    }
  }
  return sequence
}
// watch(modifications, async(oldMods, newMods) => {
//   modifications.value = newMods
// })
// 0 id	
// 1 sequence	
// 2 peptide_modification_position	
// 3 uniprot_position	
// 4 modified_residue	
// 5 peptide_start	
// 6 peptide_end	
// 7 unimod_modification_name	
// 8 unimod_id	
// 9 modification_type
const processCsvFile = (fileContent) => {
    // console.log(fileContent)
    const fileContentArray = fileContent.split(/\r?\n/).filter(Boolean).map(row => row.split(/\;|\,|\t/))
    // console.log(fileContentArray)
    let idArray = []
    let peptidesArray = []
    let peptidesModifications = []
    fileContentArray.forEach((row, index) => {
        if(index !== 0) {
            //console.log(row[8])
            const unimod = unimod_db.find(({unimod_id}) => unimod_id == row[7])
            //console.log('unimod', unimod)
            const foundIndexModification = peptidesModifications.findIndex(({unimod_classification}) => unimod_classification == unimod.classification)
            if(foundIndexModification === -1) {
                peptidesModifications.push({
                    unimod_classification: unimod.classification,
                    code: unimod.classification.replace(/ |,|-|\./g, '_').toLowerCase(),
                    count: 1
                })
            } else {
                peptidesModifications[foundIndexModification].count += 1
            }
            if(!idArray.includes(row[0])) {
                console.log('not in peptidesArray')
                idArray.push(row[0])
                const tmp = {
                    id: row[0],
                    peptide_sequence: row[1],
                    peptide_start: Number.parseInt(row[5]),
                    peptide_end: Number.parseInt(row[6]),
                    peptide_modifications: [
                        {
                            modification_position: Number.parseInt(row[2]),
                            unimod_id: row[7],
                            unimod_name: unimod !== undefined ? unimod.full_name : '',
                            unimod_classification: unimod !== undefined ? unimod.classification : ''
                        }
                    ]
                }
                peptidesArray.push(tmp)
            } else {
                const pepArrayIndex = peptidesArray.findIndex(({id}) => id == row[0])
                const tmpMod = {
                    modification_position: Number.parseInt(row[2]),
                    unimod_id: row[7],
                    unimod_name: unimod !== undefined ? unimod.full_name : '',
                    unimod_classification: unimod !== undefined ? unimod.classification : ''
                }
                const foundIndex = peptidesArray[pepArrayIndex].peptide_modifications.findIndex(({modification_position}) => modification_position == tmpMod.modification_position)
                if(foundIndex === -1) {
                    console.log('not found **')
                    peptidesArray[pepArrayIndex].peptide_modifications.push(tmpMod)
                } 
                else{
                    // TODO add modifications on the same position in a different list either in the same
                    // mod object or in a different data structure
                }
            }
        }
    })
    console.log('peptidesArray',peptidesArray)
    console.log('peptideMods',peptidesModifications)
    return [peptidesArray, peptidesModifications]
}
const processSageFile = (fileConent) => {
    const fileContentArray = fileConent.split(/\r?\n/).filter(Boolean).map(row => row.split('\t'))
    console.log('fileContentArray', fileContentArray)
    let parsed = [] // {uniprot_id: {peptides:[{peptide_start:Num, peptide_end: Num, peptide_sequence: String, psm: Number}], sequence: String, accession: String}}
    let parsedKeys = []
    
    fileContentArray.forEach((row, index) => {
        // console.log(index)
        // 0 psm, 1 peptide, 2 proteins, 3 num proteins
        
        if(index != 0) {
            // console.log('parsedKeys', parsedKeys)
            let uniprot_id = []
            let accession = []
            let modifications = []
            let peptide_sequence = ''
            console.log('psm',row[0])
            if(row[3] == 1) {
                // console.log('one protein')
                const proteinSplit = row[2].split('|')
                uniprot_id.push(proteinSplit[2])
                accession.push(proteinSplit[1])
            } else if(row[3] > 1){
                // console.log(`${row[3]} proteins`)
                const proteinMultipleSplit = row[2].split(';')
                proteinMultipleSplit.forEach(prot => {
                    const proteinSplit = prot.split('|')
                    uniprot_id.push(proteinSplit[2])
                    accession.push(proteinSplit[1])
                })
            }
            
            if(row[1].search(/\[/g)) {
                modifications = getPeptideModifications(row[1])
                peptide_sequence = getCleanPeptideSequence(row[1])
                console.log('clean peptide seq',peptide_sequence)
            } else {
                peptide_sequence = row[1]
            }
            uniprot_id.forEach(async (id, i) => {
                // console.log('id', id)
                
                const tempPeptide = {
                    psm: row[0],
                    peptide_sequence: peptide_sequence,
                    peptide_modifications: modifications
                }
                if(!parsedKeys.includes(id)) {
                    // const temp = id
                    // parsed.push(id)
                    parsedKeys.push(id)
                    parsed.push ({
                        uniprot_id: id,
                        peptides: [tempPeptide],
                        accession: accession[i]
                    })
                } else {
                    parsed[parsed.findIndex(el => el.uniprot_id == id)]['peptides'].push(tempPeptide)
                }
            })
        }
    })
    console.log('parsed',parsed)
    return parsed
}
// sage results: get modifications for peptide
const getPeptideModifications = (sequence) => {
    console.log(sequence)
    let seq = ''
    let modifications = []
    const seqArray = sequence.split(']')
    
    seqArray.forEach(str => {
        if(str.includes('[')){
            const modPosition = str.indexOf('[')
            seq = seq.concat(str.substring(0, modPosition))
            const modifAvgMass = str.includes('+') ? 
                str.substring(modPosition+1+1, str.indexOf[']']) : 
                str.substring(modPosition+1, str.indexOf[']'])
            const unimod = unimod_db.find(({avg_mass}) => Number.parseFloat(avg_mass).toPrecision(4) == Number.parseFloat(modifAvgMass).toPrecision(4))
            console.log('unimod', unimod)
            modifications.push({
                modification_position: seq.length,
                modif_delta_mass: modifAvgMass,
                unimod_id: unimod != undefined ? unimod.avg_mass : '',
                unimod_name: unimod != undefined ? unimod.full_name : '',
                unimod_classification: unimod != undefined ? unimod.classification : ''
            })
        } else {
            seq = seq.concat(str)
        }
        
    })
    console.log('seq',seq)
    console.log(modifications)
    return modifications
}
const getCleanPeptideSequence = (sequence) => {
    const cleanSequence = sequence.replace(modRegex, '')
    return cleanSequence
}
const readFile = (event, fileType) =>{
    console.log('readFile')
    const reader = new FileReader()
    const chunk_size = 10 * 1024;
    if(fileType == 'sage') {
        console.log('sage',sageFile.value)
        reader.readAsText(sageFile.value)
        reader.onload = async () => {
            const sageFileContent = reader.result
            // console.log(sageFileContent)
            dataStore.sageFileContent = processSageFile(sageFileContent)
            // filesReady.value = true
        }
        // reader.readAsArrayBuffer(sageFile.value)
        // reader.onload = () => {
        //     const sageFileContent = reader.result
        //     let buffer = new Uint8Array(reader.result)
        //     console.log(sageFileContent)
        //     for(let i = 0; i < buffer.length; i++) {

        //     }
        // }
    } else {
        if(fileType == 'modifications') {
            console.log('mods')
            reader.readAsText(modificationsFile.value)
            reader.onload = async () => {
                const modFileContent = reader.result
                dataStore.modifications = JSON.parse(modFileContent)
                filesReady.value = true
            }
        } else if(fileType == 'peptides'){
            reader.readAsText(peptidesFile.value)
            reader.onload = async () => {
                const peptidesFileContent = reader.result
                const [peptides, peptidesMods] = processCsvFile(peptidesFileContent)
                dataStore.peptides = peptides
                dataStore.peptidesModifications = peptidesMods //processCsvFile(peptidesFileContent)
                // filesReady.value = true
            }
        } 
    }
}

const showViz = (vizType) => {
  router.push({ name: vizType })
}
const reset = () => {
  
}
</script>

<template lang="pug">
v-container(fluid class="fileRead")
    v-row
        .v-col-2
            v-radio-group(v-model="fileType")
                v-radio(label="Custom files" value="custom")
                v-radio(label="Sage" value="sage")
                v-radio(label="ionbot" value="ionbot")
        
        .v-col-8(v-if="fileType == 'custom'")
            v-row
                .v-col-10
                    v-textarea(
                        label="Paste sequence"
                        v-model="sequence"
                    )
                    div
                        p Ex. MSHVAVENALGLDQQFAGLDLNSSDNQSGGSTASSFYD
                    div or
            v-row
                .v-col-4
                    v-file-input(
                        label="Fasta file"
                    )
                .v-col-1.offset-1
                    p or
                .v-col-4
                    v-text-field(label="Accession")
            v-row
                .v-col-10
                    v-file-input(
                        label="upload modifications file"
                        accept="tsv, csv"
                        show-size
                        v-model="modificationsFile"
                        @update:modelValue="readFile($event, 'modifications')"
                    )
            v-row
                .v-col-10
                    v-file-input(
                        label="upload peptides file"
                        accept="tsv, csv"
                        show-size
                        v-model="peptidesFile"
                        @update:modelValue="readFile($event, 'peptides')"
                    )

        .v-col-7(v-if="fileType == 'sage'")
            v-file-input(
                label="upload sage results file"
                accept="tsv"
                show-size
                v-model="sageFile"
                @update:modelValue="readFile($event, 'sage')"
            )
            v-autocomplete(
                label="Fixed modifications"
                v-model="fixedModifications"
                :items="unimod_db"
                item-title="full_name"
                item-value="unimod_id"
                chips
                closable-chips
                multiple
            )
            v-autocomplete(
                label="Variable modifications"
                v-model="variableModifications"
                :items="unimod_db"
                item-title="full_name"
                item-value="unimod_id"
                chips
                closable-chips
                multiple
            )

    v-row(v-if="fileType == 'ionbot'")
        .v-col-8.offset-4
            v-file-input(
                label="upload ionbot results file"
                accept="tsv"
            )
    
    v-row(v-if="fileType !== null")
        .v-col-8.offset-4
            //- | {{ filesReady() }}
            //- v-row(justify="center")
            
            v-btn(
                class="primary"
                type="button"
                @click="showViz(fileType)" 
                :readonly="!filesReady()"
            ) go
            v-btn(type="button" @click="reset" class="reset ml-10") reset
 
  

</template>

<style lang="scss">
button.primary{
    background-color: #7ec4ea;
    &:hover {
        background-color: #1ea1e8;
    }
}
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}


</style>
