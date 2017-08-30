import * as types from '../mutation-types'
import Websocket from '../../service/websocket-cli'

const state = {
  frequency: 105600000,
  bandwidth: 170000,
  centerFrequency: 105600000,
  sampleRate: 2048000,
  connected: false,
  opened: false,
  tunerGain: 241,
  capabilities: [],
  modulation: 'WFM'
}

const getters = {
  tunedFrequency: state => state.frequency,
  currentBandwidth: state => state.bandwidth,
  centerFrequency: state => state.centerFrequency,
  isConnected: state => state.connected,
  tunerGain: state => state.tunerGain,
  capabilities: state => state.capabilities,
  modulationType: state => state.modulation,
  sampleRate: state => state.sampleRate
}

const actions = {
  connect ({ commit }, serialNumber) {
    Websocket.connect(serialNumber)
    Websocket.onceEvent('connect', () => {
      console.log('connected')
      Websocket.emit('config', [
        {
          type: 'modulation',
          value: state.modulation
        },
        {
          type: 'bandwidth',
          value: state.bandwidth
        },
        {
          type: 'frequency',
          value: state.frequency
        },
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
          console.log('emit start')
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
  changeModulation ({ commit }, modulationType) {
    Websocket.emit('config', [{ type: 'modulation', value: modulationType }], () => {
      commit(types.MODULATION_CHANGE, modulationType)
    })
  },
  changeFrequency ({ commit }, frequency) {
    Websocket.emit('config', [{ type: 'frequency', value: frequency }], () => {
      commit(types.FREQUENCY_CHANGE, frequency)
    })
  },
  changeBandwidth ({ commit }, bandwidth) {
    Websocket.emit('config', [{ type: 'bandwidth', value: bandwidth }], () => {
      commit(types.BANDWIDTH_CHANGE, bandwidth)
    })
  },
  getCapabilities ({ commit }) {
    Websocket.emit('config', [{type: 'capabilities'}], (capabilities) => {
      commit(types.RECEIVE_CAPABILITIES, capabilities)
    })
  },
  changeSampleRate ({ commit }, samplerate) {
    commit(types.SAMPLERATE_CHANGE, samplerate)
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
  [types.MODULATION_CHANGE] (state, modulation) {
    state.modulation = modulation
  },
  [types.POWER_CHANGE] (state, power) {
    state.connected = power
  },
  [types.RECEIVE_CAPABILITIES] (state, capabilities) {
    state.capabilities = capabilities
  },
  [types.SAMPLERATE_CHANGE] (state, sampleRate) {
    state.sampleRate = sampleRate
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
