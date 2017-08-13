import * as types from '../mutation-types'

const state = {
  frequency: 106100000,
  bandwidth: 200000,
  centerFrequency: 105500000
}

const getters = {
  tunedFrequency: state => state.frequency,
  currentBandwidth: state => state.bandwidth,
  centerFrequency: state => state.centerFrequency
}

const actions = {
  changeCenterFrequency ({ commit }, increment) {
    var newCenterFrequency = state.centerFrequency + increment
    commit(types.CENTERFREQUENCY_CHANGE, newCenterFrequency)
  },
  changeFrequency ({ commit }, frequency) {
    commit(types.FREQUENCY_CHANGE, frequency)
  },
  changeBandwidth ({ commit }, bandwidth) {
    commit(types.BANDWIDTH_CHANGE, bandwidth)
  }
}

const mutations = {
  [types.FREQUENCY_CHANGE] (state, frequency) {
    state.frequency = frequency
  },
  [types.BANDWIDTH_CHANGE] (state, bandwidth) {
    state.bandwidth = bandwidth
  },
  [types.CENTERFREQUENCY_CHANGE] (state, centerFrequency) {
    state.centerFrequency = centerFrequency
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
