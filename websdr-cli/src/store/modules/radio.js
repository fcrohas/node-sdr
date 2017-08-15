import * as types from '../mutation-types'
import Websocket from '../../service/websocket'

const state = {
  frequency: 106100000,
  bandwidth: 200000,
  centerFrequency: 105500000,
  sampleRate: 2048000,
  connected: false,
  opened: false,
  tunerGain: 241,
  capabilities: []
}

const getters = {
  tunedFrequency: state => state.frequency,
  currentBandwidth: state => state.bandwidth,
  centerFrequency: state => state.centerFrequency,
  isConnected: state => state.connected,
  tunerGain: state => state.tunerGain,
  capabilities: state => state.capabilities
}

const actions = {
  connect ({ commit }, serialNumber) {
    Websocket.connect(serialNumber)
    Websocket.onceEvent('connect', () => {
      Websocket.emit('config', [
        {
          type: 'centerfrequency',
          value: state.centerFrequency
        },
        {
          type: 'samplerate',
          value: state.sampleRate
        },
        {
          type: 'tunergain',
          value: state.tunerGain
        }], () => {
          // Start on connect
          Websocket.emit('start', 'test')
          commit(types.POWER_CHANGE, true)
        })
    })
  },
  disconnect ({ commit }, serialNumber) {
    // Close websocket
    Websocket.emit('stop', 'disconnect', () => {
      Websocket.offEvent('connect')
      Websocket.offEvent('fft')
      Websocket.close()
      // Save new state
      commit(types.POWER_CHANGE, false)
    })
  },
  changeCenterFrequency ({ commit }, increment) {
    var newCenterFrequency = state.centerFrequency + increment
    Websocket.emit('config', [{ type: 'centerfrequency', value: newCenterFrequency }], () => {
      commit(types.CENTERFREQUENCY_CHANGE, newCenterFrequency)
    })
  },
  changeFrequency ({ commit }, frequency) {
    commit(types.FREQUENCY_CHANGE, frequency)
  },
  changeBandwidth ({ commit }, bandwidth) {
    commit(types.BANDWIDTH_CHANGE, bandwidth)
  },
  getCapabilities ({ commit }) {
    Websocket.emit('config', [{type: 'capabilities'}], (capabilities) => {
      commit(types.RECEIVE_CAPABILITIES, capabilities)
    })
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
  },
  [types.POWER_CHANGE] (state, power) {
    state.connected = power
  },
  [types.RECEIVE_CAPABILITIES] (state, capabilities) {
    state.capabilities = capabilities
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
