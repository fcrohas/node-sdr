import WebsocketWorker from 'worker-loader!./websocket-worker.js'

class WebsocketClient {

  static instance = null

  static getInstance () {
    if (WebsocketClient.instance == null) {
      WebsocketClient.instance = new WebsocketClient()
    }
    return WebsocketClient.instance
  }

  constructor () {
    this.worker = new WebsocketWorker()
    this.worker.addEventListener('message', (event) => {
      this.onMessage(event)
    })
    this.connected = false
    this.callback = {'connect': [], 'disconnect': [], 'send': [], 'emit': [], 'on': [], 'once': []}
  }

  connect (serial) {
    this.worker.postMessage({cmd: 'connect', params: {serialNumber: serial}})
    this.connected = true
  }

  send (message, ack) {
    if (this.connected) {
      if (ack == null) {
        this.worker.postMessage({cmd: 'send', params: {message: message}})
      } else {
        const id = this.register('send', event, ack)
        this.worker.postMessage({cmd: 'send', params: {message: message, ack: id}})
      }
    }
  }

  emit (event, message, ack) {
    if (this.connected) {
      if (ack == null) {
        this.worker.postMessage({cmd: 'emit', params: {emit: event, message: message}})
      } else {
        const id = this.register('emit', event, ack)
        this.worker.postMessage({cmd: 'emit', params: {emit: event, message: message, ack: id}})
      }
    }
  }

  close () {
    this.worker.postMessage({cmd: 'close'})
  }

  onEvent (event, callback) {
    if (this.connected) {
      const id = this.register('on', event, callback)
      this.worker.postMessage({cmd: 'on', params: {event: event, callback: id}})
    }
  }

  offEvent (event) {
    if (this.connected) {
      this.worker.postMessage({cmd: 'off', params: {event: event}})
    }
  }

  onceEvent (event, callback) {
    if (this.connected) {
      const id = this.register('once', event, callback)
      this.worker.postMessage({cmd: 'once', params: {event: event, callback: id}})
    }
  }

  register (type, name, callback) {
    console.log('register', type, name)
    console.log('callback=', this.callback[type])
    if (!this.callback[type][name]) {
      this.callback[type][name] = []
    }
    this.callback[type][name].push(callback)
    return this.callback[type][name].length - 1
  }

  callbackEvent (type, name, id, data) {
    if (this.callback[type][name] != null) {
      if (data) {
        this.callback[type][name][id](data.message)
      } else {
        this.callback[type][name][id]()
      }
    }
  }

  onMessage (event) {
    const data = event.data
    console.log('onmessage', data)
    this.callbackEvent(data.cmd, data.name, data.ack, data.message)
  }
}

export default WebsocketClient.getInstance()
