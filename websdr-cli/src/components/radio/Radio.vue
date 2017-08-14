<template>
	<div class="full-height">
		<md-layout md-row class="full-height">
			<md-layout class="full-height" md-column>
				<vue-draggable-resizable :parent="false" :resizable="true" :w="800" :h="400" :x="500" :y="500">
					<waterfall></waterfall>
				</vue-draggable-resizable>
				<vue-draggable-resizable :parent="false" :resizable="true" :w="400" :h="300" :x="100" :y="100">
					<control></control>
				</vue-draggable-resizable>
			</md-layout>
		</md-layout>
	</div>
</template>

<script>
import Waterfall from './Waterfall'
import Control from './Control'

export default {
  name: 'Radio',
  components: { Waterfall, Control }
}
</script>

<style lang="css" scoped>
.full-height {
	height: 100%;
}
</style>