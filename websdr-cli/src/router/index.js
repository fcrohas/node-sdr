import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/home/Home'
import Radio from '@/components/radio/Radio'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/spectrum/:serialNumber',
      name: 'Radio',
      component: Radio
    }
  ]
})
