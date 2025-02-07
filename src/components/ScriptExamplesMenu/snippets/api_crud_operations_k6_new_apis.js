import http from 'k6/http'
import { describe, expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js'
import { Httpx } from 'https://jslib.k6.io/httpx/0.1.0/index.js'
import {
  randomIntBetween,
  randomItem,
  randomString,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

export const options = {
  // for the example, let's run only 1 VU with 1 iteration
  vus: 1,
  iterations: 1,
}

const USERNAME = `user${randomIntBetween(1, 100000)}@example.com` // Set your own email;
const PASSWORD = 'secretpassword'
const BASE_URL = 'https://quickpizza.grafana.com'
const session = new Httpx({ baseURL: BASE_URL })

// Register a new user and retrieve authentication token for subsequent API requests
export function setup() {
  let authToken = null

  describe(`setup - create a test user ${USERNAME}`, () => {
    const resp = session.post(
      `/api/users`,
      JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
      })
    )

    expect(resp.status, 'User create status').to.equal(201)
    expect(resp, 'User create valid json response').to.have.validJsonBody()
  })

  describe(`setup - Authenticate the new user ${USERNAME}`, () => {
    const resp = session.post(
      `/api/users/token/login?set_cookie=true`,
      JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
      })
    )

    expect(resp.status, 'Authenticate status').to.equal(200)
    expect(resp, 'Authenticate valid json response').to.have.validJsonBody()
    authToken = resp.json('token')
    expect(authToken, 'Authentication token').to.be.a('string')
  })

  return { token: authToken, cookies: http.cookieJar().cookiesForURL(BASE_URL) }
}

export default function (data) {
  // copy cookies over to this VU
  Object.entries(data.cookies).forEach(([k, v]) => {
    http.cookieJar().set(BASE_URL, k, v)
  })

  // set the authorization header on the session for the subsequent requests
  session.addHeader('Authorization', `Bearer ${data.authToken}`)

  describe('01. Create a new rating', (t) => {
    const payload = {
      stars: 2,
      pizza_id: 1, // Pizza ID 1 already exists in the database
    }

    session.addTag('name', 'Create')
    const resp = session.post(`/api/ratings`, JSON.stringify(payload))

    expect(resp.status, 'Rating creation status').to.equal(201)
    expect(resp, 'Rating creation valid json response').to.have.validJsonBody()

    session.newRatingId = resp.json('id')
  })

  describe('02. Fetch my ratings', (t) => {
    session.clearTag('name')
    const resp = session.get('/api/ratings')

    expect(resp.status, 'Fetch ratings status').to.equal(200)
    expect(resp, 'Fetch ratings valid json response').to.have.validJsonBody()
    expect(resp.json('ratings').length, 'Number of ratings').to.be.above(0)
  })

  describe('03. Update the rating', (t) => {
    const payload = {
      stars: 5,
    }

    const resp = session.patch(
      `/api/ratings/${session.newRatingId}`,
      JSON.stringify(payload)
    )

    expect(resp.status, 'Rating patch status').to.equal(200)
    expect(resp, 'Fetch rating valid json response').to.have.validJsonBody()
    expect(resp.json('stars'), 'Stars').to.equal(payload.stars)

    // read rating again to verify the update worked
    const resp1 = session.get(`/api/ratings/${session.newRatingId}`)

    expect(resp1.status, 'Fetch rating status').to.equal(200)
    expect(resp1, 'Fetch rating valid json response').to.have.validJsonBody()
    expect(resp1.json('stars'), 'Stars').to.equal(payload.stars)
  })

  describe('04. Delete the rating', (t) => {
    const resp = session.delete(`/api/ratings/${session.newRatingId}`)

    expect(resp.status, 'Rating delete status').to.equal(204)
  })
}
