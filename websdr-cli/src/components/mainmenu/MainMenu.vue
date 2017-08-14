<template>
    <v-navigation-drawer class="pb-0" persistent absolute height="100%" clipped enable-resize-watcher v-model="display">
      <v-list dense>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>home</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title href="#/">
              Home
            </v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>equalizer</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title href="#/spectrum">
              Band Spectrum
            </v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
</template>

<script>
export default {
  props: {
    display: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {

    }
  }
}
</script>

<style lang="css" scoped>
</style>