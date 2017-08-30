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
    this.callback = {'connect': [], 'disconnect': [], 'send': [], 'emit': [], 'on': [], 'once': [], 'audioFrame': []}
  }

  connect (serial) {
    this.worker.postMessage({cmd: 'connect', params: {serialNumber: serial}})
  }

  send (message, ack) {
    if (ack == null) {
      this.worker.postMessage({cmd: 'send', params: {message: message}})
    } else {
      const id = this.register('send', event, ack)
      this.worker.postMessage({cmd: 'send', params: {message: message, ack: id}})
    }
  }

  emit (event, message, ack) {
    if (ack == null) {
      this.worker.postMessage({cmd: 'emit', params: {emit: event, message: message}})
    } else {
      const id = this.register('emit', event, ack)
      this.worker.postMessage({cmd: 'emit', params: {emit: event, message: message, ack: id}})
    }
  }

  close () {
    this.worker.postMessage({cmd: 'close'})
  }

  onEvent (event, callback) {
    const id = this.register('on', event, callback)
    this.worker.postMessage({cmd: 'on', params: {on: event, callback: id}})
  }

  offEvent (event) {
    this.worker.postMessage({cmd: 'off', params: {event: event}})
    this.callback['on'][event] = []
  }

  onceEvent (event, callback) {
    const id = this.register('once', event, callback)
    this.worker.postMessage({cmd: 'once', params: {once: event, callback: id}})
  }

  register (type, name, callback) {
    if (!this.callback[type][name]) {
      this.callback[type][name] = []
    }
    this.callback[type][name].push(callback)
    return this.callback[type][name].length - 1
  }

  callbackEvent (type, name, id, data) {
    if (this.callback[type][name] != null) {
      if (data) {
        this.callback[type][name][id](data)
      } else {
        this.callback[type][name][id]()
      }
      // If not a callabck type
      // Simply clear array callback
      if ((type !== 'on') && (type !== 'audioFrame')) {
        this.callback[type][name][id] = null
      }
    }
  }

  onMessage (event) {
    const data = event.data
    this.callbackEvent(data.cmd, data.name, data.ack, data.message)
  }

  onAudioFrame (sampleRate, channelsCount, callback) {
    // Register the callback
    const id = this.register('audioFrame', 'audioFrame', callback)
    // Start streaming
    this.worker.postMessage({cmd: 'audioFrame', params: {sampleRate: sampleRate, channels: channelsCount, callback: id}})
  }
}

export default WebsocketClient.getInstance()
