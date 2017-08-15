<template>
	<v-container fluid>
		<v-layout fill-height>
			<v-flex md12 fill-height>
				<vue-draggable-resizable :parent="false" :resizable="false" :draggable="false" :w="800" :h="400" :x="500" :y="500">
					<waterfall></waterfall>
				</vue-draggable-resizable>
				<vue-draggable-resizable :parent="false" :resizable="true" :draggable="true" :w="400" :h="300" :x="100" :y="100">
					<control></control>
				</vue-draggable-resizable>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Waterfall from './Waterfall'
import Control from './Control'

export default {
  name: 'Radio',
  components: { Waterfall, Control },
  computed: mapGetters({
    tunedFrequency: 'tunedFrequency',
    currentBandwidth: 'currentBandwidth',
    centerFrequency: 'centerFrequency'
  }),
  methods: mapActions({
    changeCenterFrequency: 'changeCenterFrequency'
  })
}
</script>

<style lang="css" scoped>
.full-height {
	height: 100%;
}
</style>