import axios from 'axios'

export default axios.create({
  baseURL: 'http://192.168.2.62:3000/api'
})
