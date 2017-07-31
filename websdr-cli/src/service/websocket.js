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
  }

  connect (serial) {
    this.socket = Socket.connect('http://192.168.0.49:3000/socket/device/' + serial)
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
      this.socket.emit(event, message, ack)
    }
  }

  close () {
    if (this.socket != null) {
      this.socket.close()
      this.socket = null
    }
  }

  onEvent (event, callback) {
    if (this.socket != null) {
      this.socket.on(event, callback)
    }
  }
}

export default new Websocket()
