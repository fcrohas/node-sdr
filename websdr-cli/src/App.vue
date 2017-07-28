<template>
  <div id="app">
    <md-toolbar class="md-medium">
      <div class="md-toolbar-container">
        <md-button class="md-icon-button" @click="$refs.mainmenu.toggle()">
          <md-icon>menu</md-icon>
        </md-button>

        <h2 class="md-title" style="flex: 1;">Node-SDR web client</h2>

        <md-button class="md-icon-button">
          <md-icon>search</md-icon>
        </md-button>

        <md-button class="md-icon-button">
          <md-icon>filter_list</md-icon>
        </md-button>
      </div>
    </md-toolbar>
    <main-menu ref="mainmenu"></main-menu>
    <router-view></router-view>
  </div>
</template>

<script>
import MainMenu from '@/components/mainmenu/MainMenu'
export default {
  name: 'app',
  components: { MainMenu },
  methods: {
  }
}
</script>

<style>

</style>
