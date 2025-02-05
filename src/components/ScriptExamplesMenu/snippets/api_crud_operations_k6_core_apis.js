import http from 'k6/http'
import { check, group, fail } from 'k6'

export const options = {
  vus: 1,
  iterations: 1,
}

// Create a random string of given length
function randomString(length, charset = '') {
  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz'
  let res = ''
  while (length--) res += charset[(Math.random() * charset.length) | 0]
  return res
}

const USERNAME = `${randomString(10)}@example.com` // Set your own email or `${randomString(10)}@example.com`;
const PASSWORD = 'secret'
const BASE_URL = 'https://quickpizza.grafana.com'

// Register a new user and retrieve authentication token for subsequent API requests
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/users`,
    JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
    })
  )

  check(res, { 'created user': (r) => r.status === 201 })

  const loginRes = http.post(
    `${BASE_URL}/api/users/token/login?set_cookie=true`,
    JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
    })
  )

  const authToken = loginRes.json('token')
  check(authToken, { 'logged in successfully': () => authToken.length > 0 })

  return {token: authToken, cookies: http.cookieJar().cookiesForURL(BASE_URL)}
}

export default function (data) {
  // copy cookies over to this VU
  Object.entries(data.cookies).forEach(([k,v]) => { http.cookieJar().set(BASE_URL, k, v) })

  // set the authorization header on the session for the subsequent requests
  const requestConfigWithTag = (tag) => ({
    headers: {
      Authorization: `Bearer ${data.authToken}`,
    },
    tags: Object.assign(
      {},
      {
        name: 'PrivateRatings',
      },
      tag
    ),
  })

  let URL = `${BASE_URL}/api/ratings`

  group('01. Create a new rating', () => {
    const payload = {
      stars: 2,
      pizza_id: 1, // Pizza ID 1 already exists in the database.
    }

    const res = http.post(
      URL,
      JSON.stringify(payload),
      requestConfigWithTag({ name: 'Create' })
    )

    if (check(res, { 'Rating created correctly': (r) => r.status === 201 })) {
      URL = `${URL}/${res.json('id')}`
    } else {
      console.log(`Unable to create rating ${res.status} ${res.body}`)
      return
    }
  })

  group('02. Fetch my ratings', () => {
    const res = http.get(
      `${BASE_URL}/api/ratings`,
      requestConfigWithTag({ name: 'Fetch' })
    )
    check(res, { 'retrieve ratings status': (r) => r.status === 200 })
    check(res.json(), { 'retrieved ratings list': (r) => r.ratings.length > 0 })
  })

  group('03. Update the rating', () => {
    const payload = { stars: 5 }
    const res = http.put(
      URL,
      JSON.stringify({ stars: 5 }),
      requestConfigWithTag({ name: 'Update' })
    )
    const isSuccessfulUpdate = check(res, {
      'Update worked': () => res.status === 200,
      'Updated stars number is correct': () => res.json('stars') === 5,
    })

    if (!isSuccessfulUpdate) {
      console.log(`Unable to update the rating ${res.status} ${res.body}`)
      return
    }
  })

  group('04. Delete the rating', () => {
    const delRes = http.del(URL, null, requestConfigWithTag({ name: 'Delete' }))

    const isSuccessfulDelete = check(null, {
      'Rating was deleted correctly': () => delRes.status === 204,
    })

    if (!isSuccessfulDelete) {
      console.log('Rating was not deleted properly')
      return
    }
  })
}
