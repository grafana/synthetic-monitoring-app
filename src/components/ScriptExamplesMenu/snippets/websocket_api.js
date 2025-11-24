import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import ws from 'k6/ws';
import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js';

export const options = {};

export default function () {
  const url = `wss://quickpizza.grafana.com/ws`;
  const params = { tags: { my_tag: 'my ws session' } };
  const user = `user_${__VU}`;
  const sessionDuration = 5000;

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', function open() {
      console.log(`VU ${__VU}: connected`);

      socket.send(JSON.stringify({ msg: 'Hello!', user: user }));

      // Send a couple of messages during the session
      socket.setTimeout(function () {
        socket.send(
          JSON.stringify({
            user: user,
            msg: `I'm saying ${randomString(5)}`,
          })
        );
      }, 1000);

      socket.setTimeout(function () {
        socket.send(
          JSON.stringify({
            user: user,
            msg: `I'm saying ${randomString(5)}`,
          })
        );
      }, 2500);
    });

    socket.on('close', function () {
      console.log(`VU ${__VU}: disconnected`);
    });

    socket.on('message', function (message) {
      const data = JSON.parse(message);
      console.log(`VU ${__VU} received message: ${data.msg}`);
    });

    socket.setTimeout(function () {
      console.log(`VU ${__VU}: ${sessionDuration}ms passed, closing connection`);
      socket.send(JSON.stringify({ msg: 'Goodbye!', user: user }));
      socket.close();
    }, sessionDuration);
  });

  expect(res.status).toBe(101);
}
