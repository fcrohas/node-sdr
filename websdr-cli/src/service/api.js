import axios from 'axios'

export default axios.create({
  baseURL: 'http://192.168.2.51:3000/api'
})
