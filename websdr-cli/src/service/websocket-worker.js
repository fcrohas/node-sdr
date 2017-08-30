import websocket from './websocket'

addEventListener('message', (event) => {
    const data = event.data
    switch(data.cmd) {
      case 'connect':
        websocket.onceEvent('connect', () => {
            postMessage({cmd: 'connect', message : 'connected'})
        })
        websocket.connect(data.params.serialNumber)
        break;
      case 'disconnect':
        websocket.close('disconnect')
        break;
      case 'start':
        websocket.emit('start','up', () => {
            postMessage({cmd: 'start', message : 'started'})
        })
        break;
      case 'stop':
        websocket.emit('stop','down', () => {
            postMessage({cmd: 'stop', message : 'stopped'})
        })
        break;
      case 'emit':
        if (data.params.ack != null) {
            websocket.emit(data.params.emit, data.params.message, () => {
              postMessage({cmd: 'emit', name: data.params.emit, ack : data.params.ack})
            })
        } else {
            websocket.emit(data.params.emit, data.params.message)
        }
        break;
      case 'send':
        if (data.params.ack != null) {
            websocket.send(data.params.message, () => {
              postMessage({cmd: 'send', ack : data.params.ack})
            })
        } else {
            websocket.send(data.params.message)
        }
        break;
      case 'on':
        websocket.onEvent(data.params.on, (data) => {
            postMessage({cmd: 'on', name: data.params.on, ack: data.params.callback, message: data})
        })
        break;
      case 'off':
        websocket.offEvent(data.params.off)
        break;
      case 'once':
        websocket.onceEvent(data.params.once, data.params.callback)
        break;
    }
})