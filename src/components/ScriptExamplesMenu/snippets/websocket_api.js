import {
  randomString,
  randomIntBetween,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'
import ws from 'k6/ws'
import { check, sleep } from 'k6'

const sessionDuration = randomIntBetween(10000, 60000) // user session between 10s and 1m

export const options = {
  vus: 10,
  iterations: 10,
}

export default function () {
  const url = `wss://quickpizza.grafana.com/ws`
  const params = { tags: { my_tag: 'my ws session' } }
  const user = `user_${__VU}`

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', function open() {
      console.log(`VU ${__VU}: connected`)

      socket.send(JSON.stringify({ msg: 'Hello!', user: user }))

      socket.setInterval(function timeout() {
        socket.send(
          JSON.stringify({
            user: user,
            msg: `I'm saying ${randomString(5)}`,
            foo: 'bar',
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
      const data = JSON.parse(message)
      console.log(`VU ${__VU} received message: ${data.msg}`)
    })

    socket.setTimeout(function () {
      console.log(
        `VU ${__VU}: ${sessionDuration}ms passed, leaving the website`
      )
      socket.send(JSON.stringify({ msg: 'Goodbye!', user: user }))
    }, sessionDuration)

    socket.setTimeout(function () {
      console.log(`Closing the socket forcefully 3s after graceful LEAVE`)
      socket.close()
    }, sessionDuration + 3000)
  })

  check(res, { 'Connected successfully': (r) => r && r.status === 101 })
  sleep(1)
}
