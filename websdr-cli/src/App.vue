<template>
  <v-app standalone>
    <v-toolbar class="blue" dark>
      <v-toolbar-title>
        <v-toolbar-side-icon @click.stop="displayMenu = !displayMenu"></v-toolbar-side-icon>
        <v-icon dark>home</v-icon>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-text-field label="Search..." single-line append-icon="search" dark hide-details></v-text-field>
    </v-toolbar>
    <main-menu :display="displayMenu"></main-menu>
    <main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </main>
    <v-footer>
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

<style>

</style>
