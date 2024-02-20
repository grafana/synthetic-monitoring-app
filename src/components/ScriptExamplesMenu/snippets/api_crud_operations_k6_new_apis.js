import { describe, expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js'
import { Httpx } from 'https://jslib.k6.io/httpx/0.1.0/index.js'
import {
  randomIntBetween,
  randomItem,
  randomString,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

export const options = {}

// Set your own email
const USERNAME = `user${randomIntBetween(1, 100000)}@example.com`
const PASSWORD = 'superCroc2019'

const session = new Httpx({ baseURL: 'https://test-api.k6.io' })

// Register a new user and retrieve authentication token for subsequent API requests
export function setup() {
  let authToken = null

  describe(`setup - create a test user ${USERNAME}`, () => {
    const resp = session.post(`/user/register/`, {
      first_name: 'Crocodile',
      last_name: 'Owner',
      username: USERNAME,
      password: PASSWORD,
    })

    expect(resp.status, 'User create status').to.equal(201)
    expect(resp, 'User create valid json response').to.have.validJsonBody()
  })

  describe(`setup - Authenticate the new user ${USERNAME}`, () => {
    const resp = session.post(`/auth/token/login/`, {
      username: USERNAME,
      password: PASSWORD,
    })

    expect(resp.status, 'Authenticate status').to.equal(200)
    expect(resp, 'Authenticate valid json response').to.have.validJsonBody()
    authToken = resp.json('access')
    expect(authToken, 'Authentication token').to.be.a('string')
  })

  return authToken
}

export default function (authToken) {
  // set the authorization header on the session for the subsequent requests
  session.addHeader('Authorization', `Bearer ${authToken}`)

  describe('01. Create a new crocodile', (t) => {
    const payload = {
      name: `Croc name ${randomString(10)}`,
      sex: randomItem(['M', 'F']),
      date_of_birth: '2023-05-11',
    }

    session.addTag('name', 'Create')
    const resp = session.post(`/my/crocodiles/`, payload)

    expect(resp.status, 'Croc creation status').to.equal(201)
    expect(resp, 'Croc creation valid json response').to.have.validJsonBody()

    session.newCrocId = resp.json('id')
  })

  describe('02. Fetch private crocs', (t) => {
    session.clearTag('name')
    const resp = session.get('/my/crocodiles/')

    expect(resp.status, 'Fetch croc status').to.equal(200)
    expect(resp, 'Fetch croc valid json response').to.have.validJsonBody()
    expect(resp.json().length, 'Number of crocs').to.be.above(0)
  })

  describe('03. Update the croc', (t) => {
    const payload = {
      name: `New croc name ${randomString(10)}`,
    }

    const resp = session.patch(`/my/crocodiles/${session.newCrocId}/`, payload)

    expect(resp.status, 'Croc patch status').to.equal(200)
    expect(resp, 'Fetch croc valid json response').to.have.validJsonBody()
    expect(resp.json('name'), 'Croc name').to.equal(payload.name)

    // read "croc" again to verify the update worked
    const resp1 = session.get(`/my/crocodiles/${session.newCrocId}/`)

    expect(resp1.status, 'Croc fetch status').to.equal(200)
    expect(resp1, 'Fetch croc valid json response').to.have.validJsonBody()
    expect(resp1.json('name'), 'Croc name').to.equal(payload.name)
  })

  describe('04. Delete the croc', (t) => {
    const resp = session.delete(`/my/crocodiles/${session.newCrocId}/`)

    expect(resp.status, 'Croc delete status').to.equal(204)
  })
}
