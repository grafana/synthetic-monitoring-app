import {
  randomString,
  randomIntBetween,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'
import ws from 'k6/ws'
import { check, sleep } from 'k6'

const sessionDuration = randomIntBetween(10000, 60000) // user session between 10s and 1m
const chatRoomName = 'publicRoom' // choose your chat room name

export const options = {
  vus: 10,
  iterations: 10,
}

export default function () {
  const url = `wss://test-api.k6.io/ws/crocochat/${chatRoomName}/`
  const params = { tags: { my_tag: 'my ws session' } }

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', function open() {
      console.log(`VU ${__VU}: connected`)

      socket.send(
        JSON.stringify({ event: 'SET_NAME', new_name: `Croc ${__VU}` })
      )

      socket.setInterval(function timeout() {
        socket.send(
          JSON.stringify({
            event: 'SAY',
            message: `I'm saying ${randomString(5)}`,
          })
        )
      }, randomIntBetween(2000, 8000)) // say something every 2-8seconds
    })

    socket.on('ping', function () {
      console.log('PING!')
    })

    socket.on('pong', function () {
      console.log('PONG!')
    })

    socket.on('close', function () {
      console.log(`VU ${__VU}: disconnected`)
    })

    socket.on('message', function (message) {
      const msg = JSON.parse(message)
      if (msg.event === 'CHAT_MSG') {
        console.log(`VU ${__VU} received: ${msg.user} says: ${msg.message}`)
      } else if (msg.event === 'ERROR') {
        console.error(`VU ${__VU} received:: ${msg.message}`)
      } else {
        console.log(`VU ${__VU} received unhandled message: ${msg.message}`)
      }
    })

    socket.setTimeout(function () {
      console.log(`VU ${__VU}: ${sessionDuration}ms passed, leaving the chat`)
      socket.send(JSON.stringify({ event: 'LEAVE' }))
    }, sessionDuration)

    socket.setTimeout(function () {
      console.log(`Closing the socket forcefully 3s after graceful LEAVE`)
      socket.close()
    }, sessionDuration + 3000)
  })

  check(res, { 'Connected successfully': (r) => r && r.status === 101 })
  sleep(1)
}
