import axios from 'axios'

const config = {
  baseURL: process.env.API_URL,
  timeout: 60000,
}

export default axios.create(config)
