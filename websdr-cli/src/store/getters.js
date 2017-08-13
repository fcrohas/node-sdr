export const radioState = state => {
  return {
    frequency: state.radio.frequency,
    bandwidth: state.radio.bandwidth,
    centerFrequency: state.radio.centerFrequency
  }
}
