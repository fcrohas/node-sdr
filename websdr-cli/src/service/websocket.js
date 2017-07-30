import Socket from 'socket.io-client/dist/socket.io'
var instance = null

class Websocket {

  static getInstance () {
    if (instance == null) {
      instance = new Websocket()
    }
    return instance
  }

  constructor () {
    this.socket = null
  }

  connect (serial) {
    this.socket = Socket.connect('http://localhost:3000/socket/device/' + serial)
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
    }
  }

  onEvent (event, callback) {
    if (this.socket != null) {
      this.socket.on(event, callback)
    }
  }
}

export default Websocket.getInstance()
