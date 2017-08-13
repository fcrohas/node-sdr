import * as types from './mutation-types'

export const changeFrequency = ({ commit }, frequency) => {
  commit(types.FREQUENCY_CHANGE, {
    frequency: frequency
  })
}

export const changeBandwidth = ({ commit }, bandwidth) => {
  commit(types.BANDWIDTH_CHANGE, {
    bandwidth: bandwidth
  })
}
