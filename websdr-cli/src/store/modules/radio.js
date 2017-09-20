import * as types from '../mutation-types'
import Websocket from '../../service/websocket-cli'

const state = {
  frequency: 103900000,
  bandwidth: 170000,
  centerFrequency: 104500000,
  sampleRate: 1536000,
  stepFrequency: 50000,
  audiorate: 24000,
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
  sampleRate: state => state.sampleRate,
  audiorate: state => state.audiorate,
  stepFrequency: state => state.stepFrequency
}

const actions = {
  connect ({ commit }, serialNumber) {
    Websocket.connect(serialNumber)
    Websocket.onceEvent('connect', () => {
      Websocket.emit('config', [
        {
          type: 'modulation',
          value: state.modulation
        },
        {
          type: 'samplerate',
          value: state.sampleRate
        },
        {
          type: 'centerfrequency',
          value: state.centerFrequency
        },
        {
          type: 'frequency',
          value: state.frequency
        },
        {
          type: 'bandwidth',
          value: state.bandwidth
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
    const newCenterFrequency = state.centerFrequency + increment
    Websocket.emit('config', [{ type: 'centerfrequency', value: newCenterFrequency }], () => {
      commit(types.CENTERFREQUENCY_CHANGE, newCenterFrequency)
    })
  },
  changeModulation ({ commit }, modulationType) {
    Websocket.emit('config', [{ type: 'modulation', value: modulationType }], () => {
      switch (modulationType) {
        case 'WFM' :
          commit(types.AUDIORATE_CHANGE, 24000)
          break
        case 'FM' :
          commit(types.AUDIORATE_CHANGE, 24000)
          break
        case 'AM' :
          commit(types.AUDIORATE_CHANGE, 24000)
          break
        case 'LSB' :
          commit(types.AUDIORATE_CHANGE, 24000)
          break
        case 'USB' :
          commit(types.AUDIORATE_CHANGE, 24000)
          break
      }
      // validate modulation change
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
  },
  changeAudiorate ({ commit }, audiorate) {
    commit(types.AUDIORATE_CHANGE, audiorate)
  },
  changeFrequencyStep ({ commit }, step) {
    commit(types.STEPFREQUENCY_CHANGE, step)
  },
  changeTunerGain ({ commit }, gain) {
    Websocket.emit('config', [{ type: 'tunergain', value: gain }], () => {
      commit(types.TUNERGAIN_CHANGE, gain)
    })
  },
  writeSetting ({ commit }, item) {
    Websocket.emit('config', [{ type: 'setting', value: {name: item.name, value: item.value} }])
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
  },
  [types.AUDIORATE_CHANGE] (state, audiorate) {
    state.audiorate = audiorate
  },
  [types.STEPFREQUENCY_CHANGE] (state, step) {
    state.stepFrequency = step
  },
  [types.TUNERGAIN_CHANGE] (state, gain) {
    state.tunerGain = gain
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
