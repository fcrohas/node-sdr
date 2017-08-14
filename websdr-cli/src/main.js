// The Vue build version to load with the `import` command
import('../node_modules/vuetify/dist/vuetify.min.css')
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Vuetify from 'vuetify'
import VueDraggableResizable from 'vue-draggable-resizable'
import store from './store'

// UI Framework
Vue.use(Vuetify)

// Component
Vue.component('vue-draggable-resizable', VueDraggableResizable)

// Config
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  template: '<App/>',
  components: { App }
})
