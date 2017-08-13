import api from '../../service/api.js'
import * as types from '../mutation-types'

const state = {
  all: []
}

const getters = {
  allDevices: state => state.all
}

const actions = {
  getAllDevices ({ commit }) {
    api.get('/devices/config').then(response => {
      commit(types.RECEIVE_DEVICES, response.data)
    }).catch(e => {
    })
  }
}

const mutations = {
  [types.RECEIVE_DEVICES] (state, devices) {
    state.all = devices
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
