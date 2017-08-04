import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/home/Home'
import Waterfall from '@/components/radio/Waterfall'

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
      name: 'Waterfall',
      component: Waterfall
    }
  ]
})
