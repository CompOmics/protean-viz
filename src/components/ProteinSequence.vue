<script setup>
import { onBeforeMount, onMounted, watch, ref, useTemplateRef } from 'vue';
import * as d3 from 'd3'

const proteinSequence = useTemplateRef('protein-sequence')
let seqarray = []
// modifications: [],
let xScale = function() {}
let xAxis = ''
let yAxis = ''
let zoom = ''
const svg = ref(null)
let svg2 = ''
let chart_height = 0
let gradDefs
const ptmSites = ref([])
const proteinseq = ref(null)
let maxPeptideCount = 0
let chart_width = 0
let ptmTypes = []
let ptmMap = {}
const ptmSitesGroup = ref(null)
let modificationsSorted = []
let modificationTypes = []
const selectedPtmTypes = ref(['post_translational', 'chemical_derivative', 'artefact'])

const colorScheme = [
    '#f74e4a',
    '#619a00',
    '#ff681e',
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
const legendColours = {
    'Artefact': '#f74e4a',
    'Post-translational': '#619a00',
    'Chemical derivative': '#ff681e',
    'Multiple,Post-translational': '#bfa6a2',
    'Other glycosylation': '#eb5f00',
    'Post-translational,Artefact': '#425f8f',
    'Isotopic label,Multiple': '#ffdf57',
    'Post-translational,Isotopic label': '#9e000d',
    'Multiple': '#ffb3a2',
    'O-linked glycosylation': '#ffbdec',
    'Chemical derivative,Multiple': '#00f5fd',
    'N-linked glycosylation': '#ffc974',
    'Pre-translational': '#1b3d2f',
    'Synth. pep. protect. gp.': '#006b60',
    'Co-translational': '#3f5500'
}

const props = defineProps({
    sequence: String,
    modifications: Object
})

onBeforeMount(() => {
    console.log('onBeforeMount')
    console.log(props.modifications)
    if(props.modifications.length > 0) {
        modificationTypes = setModificationTypes(props.modifications)
        modificationsSorted = props.modifications.toSorted((a, b) => {
            const a_type = a.modificationType.toLowerCase()
            const b_type = b.modificationType.toLowerCase()
            if(a_type > b_type) {
                return 1
            } else if(a_type< b_type) {
                return -1
            } else {
                return 0
            }
        })
    }
    convertProteinSequenceIntoArray(props.sequence)
    createPtmMapping()
    // renderProteinView()
    // updatePlot()
})
onMounted(() => {
    console.log('onMounted')
    // convertProteinSequenceIntoArray(props.sequence)
    // createPtmMapping()
    renderProteinView()
    updatePlot()
})

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
const convertProteinSequenceIntoArray = (sequence) => {
    seqarray = sequence.split('');
}
/**
 * Assign a color and visibility status to every type of PTM in the
 * modifications list
 */
const createPtmMapping = () => {
    ptmTypes = [
        ...new Set(modificationsSorted.map(x => x.modificationName))
    ]
    let colorMap = getColorMap(ptmTypes)
    for (let ptm in ptmTypes) {
        const ptmType = ptmTypes[ptm]
        ptmMap[ptmType] = {
            show: true,
            color: colorMap[ptmType]
        }
    }
}
/**
 * Keeps ptm color codings consistent within a page.
 */
const getColorMap = (ptmTypes) => {
    let colorMapping = {}
    if (Object.keys(colorMapping).length == 0) {
        for (let ptm in ptmTypes) {
            colorMapping[ptmTypes[ptm]] =
                colorScheme[ptm % colorScheme.length]
        }
    }
    return colorMapping
}
const renderProteinView = () => {
    initProteinBlock()

    createPtmSites()
    setTimeout(renderPtmSites(), 3000)

    createGradientDef()
    renderGradients()

    renderProteinSequence()

    // createCompass()
}

const updatePlot = () => {
    console.log('selectedPtmTypes', selectedPtmTypes.value)
    modificationTypes.forEach(el => {
        
        if (selectedPtmTypes.value.includes(el.value)) {
            svg2.selectAll('.' + el.value)
                .transition()
                .duration(1000)
                .style("opacity", 1)
        } else {
            svg2.selectAll('.' + el.value)
                .transition()
                .duration(1000)
                .style("opacity", 0)
        }
    })
}

const initProteinBlock = () => {
    console.log('initProteinBlock')
    let margin = { top: 0, right: 40, bottom: 80, left: 40 },
        svg_width = proteinSequence.value.offsetWidth,
        svg_height = 500
    console.log(svg_width)
    chart_height = svg_height - margin.top - margin.bottom
    let moveXaxis = 0
    chart_width = svg_width - margin.left - margin.right
    let xMax = props.sequence.length,
        xMin = 1

    xScale = d3
        .scaleLinear()
        .range([0, chart_width])
        .nice()
        .domain([xMin, xMax])

    xAxis = d3.axisBottom(xScale)

    zoom = d3
        .zoom()
        .scaleExtent([1, (4 / 120) * props.sequence.length]) //1,50
        .translateExtent([
            [0, 0],
            [chart_width, chart_height]
        ])
        .on('zoom', zoomed)

    svg.value = d3
        .select(proteinSequence.value)
        .append('svg')
        .attr('width', svg_width)
        .attr('height', svg_height)
        .style('background-color', 'white')
        .append('g')
        .attr(
            'transform',
            'translate(' + margin.left + ',' + margin.top + ')'
        )
    svg2 = svg.value
        .append('svg')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .append('g')
        .call(zoom)
    let view = svg2
        .append('rect')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .style('fill', 'white')

    let gX = svg.value
        .append('g')
        .classed('xAxis', true)
        .attr(
            'transform',
            'translate(0,'+chart_height+')'
        )
        .call(xAxis)
    // TODO make xAxis label into a prop
    // let xAxisLabel = svg.value
    //     .append('text')
    //     .attr('class', 'x label')
    //     .attr('text-anchor', 'middle')
    //     .attr('x', chart_width / 2)
    //     .attr('y', chart_height + 30)
    //     .text('Protein Sequence')
    //     .style('font-size', '13px')
    //     .style('font-family', 'Arial')
}
const createPtmSites = () => {
    ptmSitesGroup.value = svg2.append('g').attr('id', 'circles')
}
const renderPtmSites = () => {
    let occupied = []
    ptmSites.value = ptmSitesGroup.value.selectAll('.site').data(
        modificationsSorted.filter(
            m => ptmMap[m.modificationName].show
        ),
        d => modificationsSorted.indexOf(d)
    )
    ptmSites.value
        .transition()
        .select('circle')
        .attr('cy', d => placeSite(d))

    let newPtmSites = ptmSites.value
        .enter()
        .append('g')
        .classed('site', true)
    let tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip-protein-sequence')
        .style('opacity', 0)
    newPtmSites
        .append('circle')
        .attr('r', 4)
        .attr('cx', d => xScale(d.uniprotPosition))
        .attr('cy', d => placeSite(d))
        .attr('class', d => {return d.modificationType.replace(/ |,|\.|-/g, '_').toLowerCase()})
        .style('fill', d => legendColours[d.modificationType])
        .style('stroke', d => legendColours[d.modificationType])
        .style('stroke-width', '2')
        .on('mouseover', (event, d) => {
            if(selectedPtmTypes.value.includes(formatModificationType(d.modificationType))) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9)
                tooltip
                    .style('left', event.pageX + 'px')
                    .style('top', event.pageY - 28 + 'px')
                    // .style('background-color', '#FFFFFF')
                    .html('<p> Modified residue: ' + d.modifiedResidue + '<br />' + 
                        d.modificationType + ': ' + d.unimodModificationName +'<br/>' +
                        'Source: ' + d.source + '<br />' +
                        'Unimod ID: ' + d.unimodId + '<br/>' +
                        'UP position: ' + d.uniprotPosition + '<br/></p>'
                    )
            }
        })
        .on('mouseout', () => {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0)
        })

        ptmSites.value.exit().remove()
        ptmSites.value = newPtmSites.merge(ptmSites.value)

    /**
     * Places ptm sites vertically underneath each other.
     *
     * @return y coordinate
     */
    function placeSite(d) {
        if (
            occupied[d.uniprotPosition] === undefined ||
            occupied[d.uniprotPosition] === 0
        ) {
            occupied[d.uniprotPosition] = 1
        } else {
            occupied[d.uniprotPosition]++
        }
        const ptm_num = occupied[d.uniprotPosition]
        return 400 - (ptm_num - 1) * 10
    }
}
const formatModificationType = (modType) =>{
    return modType.replace(/ |,|\.|-/g, '_').toLowerCase()
}
const createGradientDef = () => {
    gradDefs = svg2.append('defs')
}
const renderGradients = () => {
    let gradients = gradDefs.selectAll('linearGradient').data(
        modificationsSorted.filter(
            m => ptmMap[m.modificationName].show
        ),
        d => modificationsSorted.indexOf(d)
    )

    gradients
        .enter()
        .append('linearGradient')
        .attr('id', d => 'grad_' + modificationsSorted.indexOf(d))
        .attr('x1', '0%')
        .attr('x2', '0%')
        .attr('y1', '100%')
        .attr('y2', '0%')
        .each(setGrad)

    gradients.exit().remove()
}
const setGrad = (d) => {
    let grad = d3.select('linearGradient')
    let colorSize = 0
    if (maxPeptideCount > 0) {
        colorSize = (d.peptides.length * 100) / maxPeptideCount
    }
    const ptmColor = ptmMap[d.modificationName]['color']

    grad.append('stop')
        .attr('offset', colorSize + '%')
        .style('stop-color', ptmColor)
    grad.append('stop')
        .attr('offset', colorSize + '%')
        .style('stop-color', 'white')

    if (colorSize == 100) {
        grad.append('stop')
            .attr('offset', colorSize + '%')
            .style('stop-color', 'white')
    } else {
        grad.append('stop')
            .attr('offset', 100 + '%')
            .style('stop-color', 'white')
    }
}
const applyReset = () => {
    svg2
        .transition()
        .duration(2000)
        .call(zoom.transform, d3.zoomIdentity)
}
const renderProteinSequence = () => {
    proteinseq.value = svg2
        .append('g')
        .selectAll('text')
        .data(seqarray)
        .enter()
        .append('text')
        .attr('y', 60)
        .text((d) => {
            return d
        })
        .attr('x', (d, i) => xScale(i + 1))
        .style('font-size', '13px')
        .style('x', '5')
        .attr('text-anchor', 'middle')
        .attr('visibility', 'hidden')
}
// const createCompass = () => {}
const zoomed= (event) => {
    const { transform, sourceEvent } = event
    svg.value
        .select('.xAxis')
        .call(xAxis.scale(transform.rescaleX(xScale)))
    let new_xScale = transform.rescaleX(xScale)
    ptmSites.value.selectAll('circle').attr('cx', function(d) {
        return new_xScale(d.uniprotPosition)
    })
    proteinseq.value.attr('x', function(d, i) {
        return new_xScale(i + 1)
    })
    if (new_xScale.domain()[1] - new_xScale.domain()[0] >= 100) {
        proteinseq.value.attr('visibility', 'hidden')
    } else {
        proteinseq.value.attr('visibility', 'visible')
    }
}
</script>

<template lang="pug">
    div.protein_block
        h1 protein sequence
        div(ref="protein-sequence" id="protein-sequence")
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}
.protein_block {
    width: 100%;
}
</style>