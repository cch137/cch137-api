import { wss } from '../../server'
import random from '../../utils/random'

const subdom = {
  ready: true,
  wss
}

const players = new Map<number, Player>()

class Player {
  id: number
  x: number = 127
  y: number = 127
  rgb: [number, number, number] = [255, 255, 255]
  constructor() {
    let i = 0
    for (; i < 256; i++) {
      if (!players.has(i)) break
    }
    if (i === 256) throw 'Too Many Players'
    players.set(i, this)
    this.id = i
    this.rgb = [random.randInt(0, 256), random.randInt(0, 256), random.randInt(0, 256)]
  }
  get array() {
    return [this.id, this.x, this.y, ...this.rgb]
  }
}

wss.on('connection', (socket, req) => {
  const player = new Player()
  function broadcastUintArray(uintArray: number[]) {
    const buffer = Buffer.from(uintArray)
    for (const client of wss.clients) {
      client.send(buffer)
    }
  }
  broadcastUintArray([101, player.id, player.x, player.y])
  broadcastUintArray([102, player.id, ...player.rgb])
  socket.on('message', (data, isBinary) => {
    if (!isBinary) return;
    const [cmd, ...items] = data as Buffer
    switch (cmd) {
      case 100: // init Player
        socket.send(Buffer.from([112, ...player.rgb]))
        players.forEach((p) => {
          socket.send(Buffer.from([101, p.id, p.x, p.y]))
          socket.send(Buffer.from([102, p.id, ...p.rgb]))
        })
        break
      case 101: // Player Move
        const moveCode = items[0]
        switch (moveCode % 10) {
          case 1:
            player.x -= 1
            break
          case 3:
            player.x += 1
            break
        }
        switch (Math.floor(moveCode / 10)) {
          case 1:
            player.y -= 1
            break
          case 3:
            player.y += 1
            break
        }
        if (player.x < 0) player.x = 0
        else if (player.x > 255) player.x = 255
        if (player.y < 0) player.y = 0
        else if (player.y > 255) player.y = 255
        broadcastUintArray([101, player.id, player.x, player.y])
        break
      case 102: // Player Change Color
        const [r, g, b] = items;
        player.rgb = [r, g, b]
        broadcastUintArray([102, player.id, ...player.rgb])
        break
    }
  })
  socket.on('close', () => {
    players.delete(player.id)
    for (const client of wss.clients) {
      client.send(Buffer.from([104, player.id]))
    }
  })
})

export default subdom