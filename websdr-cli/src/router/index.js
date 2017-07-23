import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Waterfall from '@/components/Waterfall'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/waterfall',
      name: 'Waterfall',
      component: Waterfall
    }

  ]
})
