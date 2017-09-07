<template>
  <v-app toolbar footer class="full-height">
    <main-menu :display="displayMenu"></main-menu>
    <v-toolbar class="indigo" dark>
      <v-toolbar-title>
        <v-toolbar-side-icon @click.stop="displayMenu = !displayMenu"></v-toolbar-side-icon>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-text-field label="Search..." single-line append-icon="search" dark hide-details></v-text-field>
    </v-toolbar>
    <main class="height-90">
      <v-container fluid class="full-height">
        <router-view class="full-height"></router-view>
      </v-container>
    </main>
    <v-footer class="indigo">
      <span class="white--text">© 2017</span>
    </v-footer>
  </v-app>    
</template>

<script>
import MainMenu from '@/components/mainmenu/MainMenu'
export default {
  props: {
  },
  data () {
    return {
      displayMenu: false
    }
  },
  name: 'app',
  components: { MainMenu },
  methods: {
  },
  ready () {

  }
}
</script>

<style lang="css" scoped>
.full-height {
  height: 100%;
}

.height-90 {
  height: 90%;
}
</style>
