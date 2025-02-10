import http from 'k6/http'
import { sleep } from 'k6'

export const options = {}

export default function () {
  // Request page containing a form
  let res = http.get('https://quickpizza.grafana.com/admin')

  // Now, submit form setting/overriding some fields of the form
  res = res.submitForm({
    formSelector: 'form',
    fields: { username: 'admin', password: 'admin' },
  })
  sleep(3)
}
