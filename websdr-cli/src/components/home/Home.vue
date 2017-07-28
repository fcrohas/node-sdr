<template>
	<md-stepper md-alternate-labels>
	  <md-step md-label="Plugin device">
	    <p>This seems something basic I need to do first before the next step.</p>
	  </md-step>
	  <md-step md-label="Configure">
	    <p>This seems something I need to focus on just after the first step.</p>
	  </md-step>
	  <md-step md-label="Save">
	    <p>This seems something important I need to fix just right before the last step.</p>
	  </md-step>
	</md-stepper>
</template>

<script>
export default {

  name: 'Home',

  data () {
    return {

    }
  }
}
</script>

<style lang="css" scoped>
</style>