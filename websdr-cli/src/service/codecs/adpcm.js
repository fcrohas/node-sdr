class Adpcm {

    constructor () {
        this.adpcm_ima_step_table = new Int16Array([
          7, 8, 9, 10, 11, 12, 13, 14,
          16, 17, 19, 21, 23, 25, 28, 31,
          34, 37, 41, 45, 50, 55, 60, 66,
          73, 80, 88, 97, 107, 118, 130, 143,
          157, 173, 190, 209, 230, 253, 279, 307,
          337, 371, 408, 449, 494, 544, 598, 658,
          724, 796, 876, 963, 1060, 1166, 1282, 1411,
          1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024,
          3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484,
          7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
          15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767
        ])
        this.adpcm_ima_index_table = new Int16Array([
          -1, -1, -1, -1, 2, 4, 6, 8,
          -1, -1, -1, -1, 2, 4, 6, 8
        ])
    }

    ADPCM_IMA_DECODE_NIBBLE (state) {
      let step = this.adpcm_ima_step_table[state.v_step_index]
      state.v_step_index += this.adpcm_ima_index_table[state.v_nibble]
      if (state.v_step_index < 0)
        state.v_step_index = 0
      else if (state.v_step_index > 38)
        state.v_step_index = 38
      let diff = step >> 3
      if (state.v_nibble & 4)
        diff += step
      if (state.v_nibble & 2)
        diff += step >> 1
      if (state.v_nibble & 1)
        diff += step >> 2
      if (state.v_nibble & 8)
        state.v_predicted_value -= diff
      else
        state.v_predicted_value += diff
      if ((state.v_predicted_value) < -0x80)
        (state.v_predicted_value) = -0x80
      else if ((state.v_predicted_value) > 0x7f)
        (state.v_predicted_value) = 0x7f
	}

    ADPCM_IMA_ENCODE_NIBBLE (state) {
      let step = this.adpcm_ima_step_table[state.v_step_index]
      let diff = state.v_nibble - state.v_predicted_value
      let sign = (diff < 0) ? 8 : 0
      if (sign)
        diff = -diff
      state.v_out = 0
      let vpdiff = (step >> 3)
      if (diff >= step)
      {
        state.v_out = 4
        diff -= step
        vpdiff += step
      }
      step >>= 1
      if (diff >= step)
      {
        state.v_out |= 2
        diff -= step
        vpdiff += step
      }
      step >>= 1
      if ( diff >= step )
      {
        state.v_out |= 1
        vpdiff += step
      }
      if (sign)
        state.v_predicted_value -= vpdiff
      else
        state.v_predicted_value += vpdiff
      if ((state.v_predicted_value) < -0x80)
        (state.v_predicted_value) = -0x80
      else if ((state.v_predicted_value) > 0x7f)
        (state.v_predicted_value) = 0x7f
      state.v_step_index += this.adpcm_ima_index_table[state.v_out]
      state.v_out |= sign
      if (state.v_step_index < 0)
        state.v_step_index = 0
      else if (state.v_step_index > 38)
        state.v_step_index = 38
    }

    adpcm_ima_decode_nibble (state) {
      // Cast the predicted value and the step index into 32-bit values
      let v_state = { v_nibble:state.nibble, v_predicted_value: state.predicted_value, v_step_index: state.step_index}
      // Macro to decode a 4-bit sample with the IMA/DVI ADPCM algorithm
      this.ADPCM_IMA_DECODE_NIBBLE(v_state)

      // Restore the predicted value and step index
      state.predicted_value = v_state.v_predicted_value
      state.step_index = v_state.v_step_index

      // Return the result stored in int_predicted_value
      return v_state.v_predicted_value
    }

    adpcm_ima_decode (out, input, size, state) {
      // Cast the predicted value and the step index into 32-bit values
      let v_state = { v_nibble:0, v_predicted_value: state.predicted_value, v_step_index: state.step_index}

      // Main loop
      let inp = 0
      for(let i=0 ;i<size * 2;i+=2)
      {
        // Decode the low-nibble (4-bit) of the byte
        v_state.v_nibble = input[inp] & 0xF
        // Macro to decode a 4-bit sample with the IMA/DVI ADPCM algorithm
        this.ADPCM_IMA_DECODE_NIBBLE(v_state)
        // Store the result
        out[i] = v_state.v_predicted_value

        // Decode the high-nibble (4-bit) of the byte
        v_state.v_nibble = (input[inp] >> 4) & 0xF
        // Macro to decode a 4-bit sample with the IMA/DVI ADPCM algorithm
        this.ADPCM_IMA_DECODE_NIBBLE(v_state)
        // Store the result
        out[i + 1] = v_state.v_predicted_value

        inp++
      }

      // Restore the predicted value and step index
      state.predicted_value = v_state.v_predicted_value
      state.step_index = v_state.v_step_index
    }

    adpcm_ima_encode_nibble (state) {
      // Cast the predicted value and the step index into 32-bit values
      let v_state = { v_nibble: state.nibble, v_out: 0, v_predicted_value: state.predicted_value, v_step_index: state.step_index}

      // Macro to encode a sample with the IMA/DVI ADPCM algorithm
      this.ADPCM_IMA_ENCODE_NIBBLE(v_state)

      // Restore the predicted value and step index
      state.predicted_value = v_state.v_predicted_value
      state.step_index = v_state.v_step_index

      // Return the result stored in delta
      return v_state.v_out
    }

    adpcm_ima_encode (c_out, input, size, state) {
      // Cast the predicted value and the step index into 32-bit values
      let v_state = { v_nibble:0, v_out: 0, v_predicted_value: state.predicted_value, v_step_index: state.step_index}

      // Main loop
      let pout = 0
      for(let i = 0; i < size; i += 2)
      {
        // Get the first sample to encode
        v_state.v_nibble = input[i]
        // Macro to encode a sample with the IMA/DVI ADPCM algorithm
        this.ADPCM_IMA_ENCODE_NIBBLE(v_state)
        // Store the result in the low-nibble (4-bit) of the byte
        c_out[pout] = v_state.v_out

        // Get the second sample to encode
        v_state.v_nibble = input[i + 1]
        // Macro to encode a sample with the IMA/DVI ADPCM algorithm
        this.ADPCM_IMA_ENCODE_NIBBLE(v_state)
        // Store the result in the high-nibble (4-bit) of the byte
        c_out[pout] |= v_state.v_out << 4

        pout++
      }
      // Restore the predicted value and step index
      state.predicted_value = v_state.v_predicted_value
      state.step_index = v_state.v_step_index
      return pout      
    }    
}

export default Adpcm