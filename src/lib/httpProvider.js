import { ajax } from 'rxjs/observable/dom/ajax'
import axios from 'axios'

export default class HttpProvider {

  constructor(config) {
    this.makeRequest = this.makeRequest.bind(this)
    this.errorHandlers = []
    this.config = config
  }

  find({ resourceName, query, options } = {}) {
    const path = `${resourceName}s`
    return this.makeRequest('GET', path, query, options)
  }

  count({ resourceName, query, options } = {}) {
    const path = `${resourceName}s/count`
    return this.makeRequest('GET', path, query, options)
  }

  findOne({ resourceName, query, options }) {
    const path = `${resourceName}s`
    return this.makeRequest('GET', path, query, options)
        .then(results => results[0])
  }

  findById({ resourceName, id, options }) {
    const path = `${resourceName}s/${id}`
    return this.makeRequest('GET', path, { id }, options)
  }

  create({ resourceName, data, options }) {
    const path = `${resourceName}s`
    const payload = { data }
    return this.makeRequest('POST', path, payload, options)
  }

  update({ resourceName, id, data, options }) {
    const path = `${resourceName}s/${id}`
    const payload = { id, data }
    return this.makeRequest('PATCH', path, payload, options)
  }

  updateAll({ resourceName, where, data, options }) {
    const path = `${resourceName}s`
    const payload = { where, data }
    return this.makeRequest('PUT', path, payload, options)
  }

  delete({ resourceName, id, options }) {
    const path = `${resourceName}s/${id}`
    const payload = { id }
    return this.makeRequest('DELETE', path, payload, options)
  }

  makeRequest(method, path, payload = {}) {
    const request = {
      method,
      data: method === 'GET' ? undefined : payload.data,
      params: method !== 'GET' ? undefined : payload,
      // headers: {},
      url: `${this.config.apiBase}/api/${path}`
    }

    return axios(request).then(response => response.data)
  }
}