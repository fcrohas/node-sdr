<template>
  <md-layout md-row md-flex>
    <md-layout md-column>
      <md-layout md-flex></md-layout>
      <md-layout md-flex>
      <md-whiteframe md-elevation="2">
        <md-card>
          <md-card-header>
            <div class="md-title">Title goes here</div>
            <div class="md-subhead">Subtitle here</div>
          </md-card-header>
          <md-card-content>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Optio itaque ea, nostrum odio. Dolores, sed accusantium quasi non, voluptas eius illo quas, saepe voluptate pariatur in deleniti minus sint. Excepturi.
          </md-card-content>
        </md-card>
        </md-whiteframe>
      </md-layout>
    </md-layout>
    <md-layout md-column md-gutter>
      <md-layout md-flex="20"></md-layout>
      <md-layout>
      </md-layout>
    </md-layout>

    <md-layout md-column md-gutter>
      <md-layout md-flex="50"></md-layout>
      <md-layout></md-layout>
      <md-layout></md-layout>
    </md-layout>
  </md-layout>  
</template>

<script>
export default {
  name: 'waterfall',
  data () {
    return {
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
