import http from 'k6/http'
import { check, group } from 'k6'

export const options = {}

// Create a random string of given length
function randomString(length, charset = 'abcdefghijklmnopqrstuvwxyz') {
  let res = ''
  while (length--) {
    res += charset[Math.floor(Math.random() * charset.length)]
  }
  return res
}

// Set your own email or `${randomString(10)}@example.com`;
const USERNAME = `${randomString(10)}@example.com`
const PASSWORD = 'superCroc2019'

const BASE_URL = 'https://test-api.k6.io'

// Register a new user and retrieve authentication token for subsequent API requests
export function setup() {
  const res = http.post(`${BASE_URL}/user/register/`, {
    first_name: 'Crocodile',
    last_name: 'Owner',
    username: USERNAME,
    password: PASSWORD,
  })

  check(res, { 'created user': (r) => r.status === 201 })

  const loginRes = http.post(`${BASE_URL}/auth/token/login/`, {
    username: USERNAME,
    password: PASSWORD,
  })

  const authToken = loginRes.json('access')
  check(authToken, { 'logged in successfully': () => authToken !== '' })

  return authToken
}

export default (authToken) => {
  // set the authorization header on the session for the subsequent requests
  const requestConfigWithTag = (tag) => ({
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    tags: Object.assign(
      {},
      {
        name: 'PrivateCrocs',
      },
      tag
    ),
  })

  let URL = `${BASE_URL}/my/crocodiles/`

  group('01. Create a new crocodile', () => {
    const payload = {
      name: `Name ${randomString(10)}`,
      sex: 'F',
      date_of_birth: '2023-05-11',
    }

    const res = http.post(
      URL,
      payload,
      requestConfigWithTag({ name: 'Create' })
    )

    if (check(res, { 'Croc created correctly': (r) => r.status === 201 })) {
      URL = `${URL}${res.json('id')}/`
    } else {
      console.log(`Unable to create a Croc ${res.status} ${res.body}`)
      return
    }
  })

  group('02. Fetch private crocs', () => {
    const res = http.get(
      `${BASE_URL}/my/crocodiles/`,
      requestConfigWithTag({ name: 'Fetch' })
    )
    check(res, { 'retrieved crocs status': (r) => r.status === 200 })
    check(res.json(), { 'retrieved crocs list': (r) => r.length > 0 })
  })

  group('03. Update the croc', () => {
    const payload = { name: 'New name' }
    const res = http.patch(
      URL,
      payload,
      requestConfigWithTag({ name: 'Update' })
    )
    const isSuccessfulUpdate = check(res, {
      'Update worked': () => res.status === 200,
      'Updated name is correct': () => res.json('name') === 'New name',
    })

    if (!isSuccessfulUpdate) {
      console.log(`Unable to update the croc ${res.status} ${res.body}`)
      return
    }
  })

  group('04. Delete the croc', () => {
    const delRes = http.del(URL, null, requestConfigWithTag({ name: 'Delete' }))

    const isSuccessfulDelete = check(null, {
      'Croc was deleted correctly': () => delRes.status === 204,
    })

    if (!isSuccessfulDelete) {
      console.log(`Croc was not deleted properly`)
      return
    }
  })
}
