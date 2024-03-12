import http from 'k6/http'

const username = 'user'
const password = 'passwd'

export const options = {}

export default function () {
  // Passing username and password as part of URL and then specifying "ntlm" as auth type will do the trick!
  http.get(`http://${username}:${password}@example.com/`, { auth: 'ntlm' })
}
