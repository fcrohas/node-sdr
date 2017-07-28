import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/home/Home'
import Waterfall from '@/components/waterfall/Waterfall'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/spectrum',
      name: 'Waterfall',
      component: Waterfall
    }
  ]
})
