import Socket from 'socket.io-client/dist/socket.io'

class Websocket {

  static instance = null

  static getInstance () {
    if (Websocket.instance == null) {
      Websocket.instance = new Websocket()
    }
    return Websocket.instance
  }

  constructor () {
    this.socket = null
    this.serial = null
  }

  connect (serial) {
    this.socket = Socket.connect('http://192.168.0.49:3000/socket/device/' + serial)
    this.serial = serial
  }

  send (message, ack) {
    if (this.socket != null) {
      if (ack == null) {
        this.socket.send(message)
      } else {
        this.socket.send(message, ack)
      }
    }
  }

  emit (event, message, ack) {
    if (this.socket != null) {
      if (ack == null) {
        this.socket.emit(event, message)
      } else {
        this.socket.emit(event, message, ack)
      }
    }
  }

  close () {
    if (this.socket != null) {
      this.socket.close()
    }
  }

  onEvent (event, callback) {
    if (this.socket != null) {
      this.socket.on(event, callback)
    }
  }

  offEvent (event) {
    if (this.socket != null) {
      this.socket.off(event)
    }
  }

  onceEvent (event, callback) {
    if (this.socket != null) {
      this.socket.once(event, callback)
    }
  }
}

export default Websocket.getInstance()
