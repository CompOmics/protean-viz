<script setup>

import { onBeforeMount, ref, watchEffect, watch, onMounted, useTemplateRef } from 'vue'
import * as d3 from 'd3'
const props = defineProps({
    proteins: Array
})
const pieChart = useTemplateRef('pie-chart-block')
const proteins = props.proteins





</script>
<template lang="pug">
div(ref="pie-chart-block")
</template>
<style lang="scss">
</style>