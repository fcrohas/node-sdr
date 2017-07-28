<template>
  <md-sidenav class="md-left" ref="menu">
    <md-toolbar class="md-large">
      <div class="md-toolbar-container">
        <h3 class="md-title">Navigation</h3>
      </div>
    </md-toolbar>
    <md-list>
      <md-list-item href="#/" @click="$refs.menu.toggle()">
        <md-icon>home</md-icon> <span>Home</span>
      </md-list-item>    
	    <md-list-item href="#/spectrum" @click="$refs.menu.toggle()">
	      <md-icon>equalizer</md-icon> <span>Band Spectrum</span>
	    </md-list-item>    
    </md-list>
  </md-sidenav>
</template>

<script>
export default {
  props: [],
  data () {
    return {

    }
  },
  methods: {
    toggle: function () {
      this.$refs.menu.toggle()
    }
  },
  ready () {
  }

}
</script>

<style lang="css" scoped>
</style>