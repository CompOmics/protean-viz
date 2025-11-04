<script setup>
// import { protein } from '@/stores/protein'
// import { proteinStructures } from '@/stores/proteinStructures'
import { onBeforeMount, ref, watchEffect, watch, onMounted, useTemplateRef } from 'vue'
import * as d3 from 'd3'
import { sassNull } from 'sass'

const colorScheme = [
    '#f74e4a',
    '#619a00',
    '#57423f',
    '#bfa6a2',
    '#eb5f00',
    '#425f8f',
    '#ffdf57',
    '#9e000d',
    '#ffb3a2',
    '#ffbdec',
    '#00f5fd',
    '#ffc974',
    '#1b3d2f',
    '#006b60',
    '#3f5500'
]
// const props = protein()
// const structuresStore = proteinStructures()
const peptideCoverage = useTemplateRef('peptide-coverage')
const sequence = ref(null) // TODO move to protein store as sequence array
const peptidesFormatted = ref(null)
const peptideCoverageLine = ref(null)
let x, y,svg, xAxis, yAxis, zoom
const margin = { top: 0, right: 40, bottom: 80, left: 40 }
let svg_width=0, svg_height=0, chart_width=0, chart_height=0, moveXaxis=0
const props = defineProps({
    peptides: Array,
    sequence: String,
    modsClassification: Array
})
watch(
    () => props.peptides,
    () => {
        clearPlot()
        setSequence(props.sequence)
        setPeptidesArray()
        setPepCoverage()
        setPlotParams()
        initPlot()
    }
)
const clearPlot = () => {
    console.log('clearPlot')
    if(svg != ''){
        d3.selectAll(".peptide-coverage g > *").remove()
        d3.select(".peptide-coverage svg").remove()
    }
}
onBeforeMount(()=> {
    console.log('props',props)
    setSequence(props.sequence)
    setPeptidesArray()
    setPepCoverage()
})
onMounted(() => {
    setPlotParams()
    initPlot()
})
// set density plot
const setPepCoverage = () => {
    // set array with number of elements equal to sequence length and set values to 0
    let pepCoverage = Array.apply(null,Array(props.sequence.length)).map(Number.prototype.valueOf, 0)
    props.peptides.forEach((pep, index) => {
        for(let i = pep.peptide_start -1; i <pep.peptide_end; i++){
            pepCoverage[i] = pepCoverage[i]+1
        }
    })
    peptideCoverageLine.value = pepCoverage
}
const isInRow = (peptideToAdd, peptidesRow) => {
    let inRow = false
    for(let i = 0; i < peptidesRow.length; i++){
        if(isInRange(peptideToAdd.peptide_start, peptideToAdd.peptide_end, peptidesRow[i].peptide_start, peptidesRow[i].peptide_end)){
            console.log('in row')
            inRow = true
            break
        }
    }
    return inRow
}

// is peptide in range
const isInRange = (start1, end1, start2, end2) => {
    if(end1 < start2){
        return false
    } else if(start1 > end2) {
        return false
    } else if(start1 == start2) {
        return true
    } else if(start1 >= start2 && start1 <= end2) {
        return true
    } else if(start1 >= start2 && end1 <= end2){
        return true
    } else if(end1 >= start2 && end1 <= end2) {
        return true
    } else if(start1 < start2 && end1 > end2) {
        return true
    }
}

const setPeptidesArray = () => {
    console.log('setPeptidesArray')
    const peptides = props.peptides
    let peptidesArray = []
    let peptidesArrayIndex = []
    peptides.forEach((peptideToAdd, index) => {
        if(peptidesArray.length == 0) {
            peptidesArray[0] = new Array(peptideToAdd)
            peptidesArrayIndex[0] = new Array(index)
            peptideToAdd['y'] = 0
        } else {
            // TODO possibly create a recursive function to replace this for loop
            for(let i = 0; i < peptidesArray.length; i++) {
                const inRow = isInRow(peptideToAdd, peptidesArray[i])
                if(inRow){
                    if(i == peptidesArray.length -1) {
                        peptidesArray[i+1] = new Array(peptideToAdd)
                        peptidesArrayIndex[i+1] = new Array(index)
                        peptideToAdd['y'] = i+1
                        break
                    } else {
                        continue
                    }
                } else {
                    peptidesArray[i].push(peptideToAdd)
                    peptidesArrayIndex[i].push(index)
                    peptideToAdd['y'] = i
                    break
                }
            }
        }
    })
    peptides.forEach(el => {
        if(el.peptide_modifications.length > 0) {
            el.peptide_modifications.map(mod => mod['y'] = el.y)
            el.peptide_modifications.map(mod => mod['start'] = el.peptide_start)
        }
    })
    peptidesFormatted.value = peptides
    console.log(peptidesFormatted.value)
}
const setSequence = () => {
    sequence.value = props.sequence.split('')
}
const setPlotParams = () => {
    svg_width = peptideCoverage.value.offsetWidth,
    svg_height = 450,
    chart_width = svg_width - margin.left - margin.right,
    chart_height = svg_height //- margin.top - margin.bottom,
    moveXaxis = 0;
}
const setModificationTypes = (modificationsList) => {
    let modificationTypeList = []
    console.log(modificationsList)
    modificationsList.forEach((element) => {
        const index = modificationTypeList.findIndex(mod => mod.text === element.modificationType)
        if (index !== -1) {
            modificationTypeList[index].count++
        } else {
            let temp = {
                'text': element.modificationType,
                'value': element.modificationType.replace(/ |,|-|\./g, '_').toLowerCase(),
                'count': 1
            }
            modificationTypeList.push(temp)
            temp = null
        }
    })
    return modificationTypeList
}

const initPlot = () => {
    // minimum and maximum x axis values
    let xMax = sequence.value.length,
        xMin = 1;
    x = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, chart_width]).nice()
    y = d3.scaleLinear()
        .domain([0, Math.max.apply(Math, peptidesFormatted.value.map(o => o.y))])
        .range([chart_height - margin.bottom,margin.top])
    zoom = d3.zoom()
        .scaleExtent([1, 4/120*sequence.value.length]) //1,50
        .translateExtent([[0,0],[chart_width,chart_height]])
        .extent([[0,0],[chart_width,chart_height]])
        .on("zoom", zoomed);
    const tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'peptide-coverage-tooltip')
        .style('visibility', 'hidden')
    svg = d3.select('#peptide-coverage')
        .append('svg')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .style("background-color", "white")
        .append("g")
        //.attr("transform", `translate(${margin.left},${margin.top})`)
        .attr("transform", `translate(${margin.left},10)`)
        .call(zoom)
    xAxis = svg.append('g')
        .attr('transform', `translate(0, ${chart_height-margin.bottom})`)
        .call(d3.axisBottom(x))
    // yAxis = svg.append('g')
    //     .attr('transform', `translate(${margin.left},0)`)
    //     .call(d3.axisLeft(y))
    const listenerRect = svg.append('rect')
        .attr('class','listener-rect')
        .attr('x', 0)
        .attr('y', -margin.top+15)
        .attr('width', chart_width)
        .attr('height', chart_height + margin.top + margin.bottom)
        .style('opacity', 0)
        .call(zoom)
    const peptidesGroup = svg.insert('g', '.listener-rect')
        .attr('class', 'peptides-group')
    const peptidesLines = peptidesGroup
        .selectAll('.peptide-line')
        .data(peptidesFormatted.value)
        .enter()
        .append('line')
        .attr('class', 'peptide-line')
        .attr('x1', d => x(d.peptide_start))
        .attr('x2', d => x(d.peptide_end))
        .attr('y1', d => y(d.y))
        .attr('y2', d => y(d.y))
        .attr('stroke', '#7ec4ea')
        .attr('stroke-width', 6)

    const modifsGroup = svg.insert('g', '.listener-rect')
        .attr('class','modifs-group')
    let tempProps = {}
    const modifsLines = modifsGroup
        .selectAll('.mod-line')
        .data(peptidesFormatted.value)
        .enter()
        .selectAll('circle')
        .data(d => {
            // console.log(d)
            // tempProps = {y: d.y, start: d.peptide_start, end: d.peptide_end}
            // console.log(tempProps)
            return d.peptide_modifications
        })
        .enter()
        .append('circle')
        .attr('r', 4)
        .attr('cx', d => {
            console.log('cx',d)
            // console.log(d.start + d.modification_position -1)
            // console.log(tempProps.y)
            return x(d.start + (d.modification_position == 0 ? 0 : d.modification_position - 1))
        })
        .attr('cy', d => y(d.y))
        // .attr('class', d => {return d.modificationType.replace(/ |,|\.|-/g, '_').toLowerCase()})
        // .style('fill', d => legendColours[d.modificationType])
        .style('stroke', d => {
            if(props.modsClassification !== null && props.modsClassification !== undefined) {
                const modificationIndex = props.modsClassification.findIndex(({unimod_classification}) => d.unimod_classification == unimod_classification)
                console.log(modificationIndex)
                return modificationIndex != -1 ? colorScheme[modificationIndex] : '#8218ff'
            } else {
                return '#f74e4a'
            }
        })
        .style('stroke-width', '2')
        .style('fill', d => {
            if(props.modsClassification !== null && props.modsClassification !== undefined) {
                const modificationIndex = props.modsClassification.findIndex(({unimod_classification}) => d.unimod_classification == unimod_classification)
                return modificationIndex != -1 ? colorScheme[modificationIndex] : '#8218ff'
            } else {
                return '#f74e4a'
            }
        })

    const transparentGroup = svg.append('g')
        .attr('class','transparent-group')
    const transparentLines = transparentGroup
        .selectAll('.transparent-line')
        .data(peptidesFormatted.value)
        .enter()
        .append('line')
        .attr('class', 'transparent-line')
        .attr('x1', d => x(d.peptide_start))
        .attr('x2', d => x(d.peptide_end))
        .attr('y1', d => y(d.y))
        .attr('y2', d => y(d.y))
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 6)
        .style('opacity', 0)
        .call(zoom)
        .on('mouseover', (event, d) => {
            d3.select(event.currentTarget).style('fill', '#2A6A9E')
            const modifications = d.peptide_modifications
            const modificationsPositions = modifications.map(m => m.modification_position)
            const modificationsResidues = modifications.map(m => {
                if(m.modification_position == 0) {
                    return 'N-Term'
                } else {
                    return d.peptide_sequence.charAt(m.modification_position -1 )
                }
            })
            let tableHtml = '<table><tr><th style="width: 50px;">Position</th><th style="width: 50px;">Residue</th><th style="width: 50px;">Modification</th></tr>'
            for(let i = 0; i<modifications.length; i++) {
                const str = '<tr><td style="width: 50px;">'+modifications[i].modification_position+'</td>'+
                    '<td style="width: 50px;">'+d.peptide_sequence.charAt(modifications[i].modification_position -1)+'</td>'+
                    '<td style="width: 50px;">'+
                        modifications[i].unimod_name ? modifications[i].unimod_name : 
                            modifications[i].avg_mass ? modifications[i].avg_mass : '-' +'</td><tr>'
                tableHtml = tableHtml.concat(str)
            }
            tableHtml.concat('</table>')
            tooltip.transition()
                .duration(200)
                .style('visibility', 'visible')
                .style('opacity', 0.9)
            tooltip
                .style('left', event.pageX + 'px')
                .style('top', event.pageY - 28 + 'px')
                .html(
                    '<div> Sequence: ' + d.peptide_sequence + '</div>' +
                    '<div>'+tableHtml+'</div>'+
                    // '<div>Modification positions: '+ (modificationsPositions.length == 0 ? '-' : modificationsPositions) + '</div>' +
                    // '<div>Modified residues: ' + (modificationsResidues.length == 0 ? '-' : modificationsResidues) + '</div>' +
                    '<div>Start: ' + d.peptide_start + '</div>' +
                    '<div>End: ' + d.peptide_end + '</div>' +
                    '<div>PSM id: ' + d.psm + '</div>'
                )
        })
        .on('mouseout', (event, d) => {
            console.log('mouseout')
            d3.select(event.currentTarget).style('fill', '#5E99C5');
            tooltip.transition()
                .duration(500)
                .style('visibilty', 'hidden')
                .style('opacity', 0)
        })
    const proteinseq = listenerRect.append('g')
        .attr('class', '.x-axis-sequence')
        .selectAll('text')
        .data(props.sequence)
        .enter()
        .append('text')
        .attr('y',chart_height - 2)
        .text(d => d)
        .attr('x', (d, i) => x(i+1))
        .style('font-size', '13px')
        .style('x', '5')
        .attr('text-anchor', 'middle')
        .attr('visibility', 'hidden')
}
const zoomed = (event) => {
    console.log('zoom',event)
    const newX = event.transform.rescaleX(x)

    xAxis.call(d3.axisBottom(newX))

    svg.selectAll('.peptide-line')
        .attr('x1', d => newX(d.peptide_start))
        .attr('x2', d => newX(d.peptide_end))

    svg.select('.modifs-group').selectAll('circle')
        .attr('cx', d => {
            // console.log('mod-line',d)
            return newX(d.start + d.modification_position - 1)}
        )
        // .attr('x2', d => newX(d.peptide_start + d.peptide_modification_position))
    svg.selectAll('.transparent-line')
        .attr('x1', d => newX(d.peptide_start))
        .attr('x2', d => newX(d.peptide_end))
    svg.select('.x-axis-sequence')
        .attr("x", (d, i) => newX(i+1))

}
</script>
<template lang="pug">
    div
        div(id="peptide-coverage" ref="peptide-coverage" class="peptide-coverage")
        div
            div(class="modifications_legend")
                div(class="legend_group" v-for="(item, index) in props.modsClassification" :key="index")
                    div( class="legend_circle" :style="{'background-color':colorScheme[index] }")
                    span.legend_label {{ item.unimod_classification}}
                //- div(class="legend_group")
                //-     div(class="legend_circle" style="background-color: #619a00")
                //-     span.legend_label  Methylation
                //- div(class="legend_group" )
                //-     div(class="legend_circle" style="background-color: #57423f")
                //-     span.legend_label Oxidation
                //- div(class="legend_group")
                //-     div(class="legend_circle" style="background-color: #bfa6a2")
                //-     span.legend_label Ubiquitination
</template>
<style lang="scss">
.bar{
    background-color: #5E99C5;
}
.peptide-coverage-tooltip{
    z-index: 1;
    position: absolute;
    text-align: left;
    color: black;
    width: auto;
    height: auto;
    padding: 2px;
    font-size: 12px;
    background-color: rgb(191, 202, 241);
    border: 1px solid black;
    border-radius: 3px;
    pointer-events: none;
    // padding: 10px;
    // border-radius: 5px;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    .close-btn{
        position: absolute;
        top: 5px;
        right: 10px;
        cursor: pointer;
    }
}
.modifications_legend {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    .legend_group {
        width: auto;
        display: inline-block;
        margin-right: 25px;
        .legend_circle {
            display: inline-block;
            height: 25px;
            width: 25px;
            border-radius: 50%;
        }
        .legend_label {
            margin-left: 5px;
            vertical-align: super;
        }
    }
    
}

</style>