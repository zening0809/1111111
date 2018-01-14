'use strict'
module.exports = (options, app) => {
  return function* (next) {
    // yield next
    if (this.path !== '/__webpack_hmr') {
      yield next

      // ignore status if not 404
      if (this.status !== 404 || this.method !== 'GET') {
        return
      }

      this.status = 200
      const path = this.path
      if (/\.js$/.test(path)) {
        this.set('Content-Type', 'application/javascript')
      }
      if (/\.css/.test(path)) {
        this.set('Content-Type', 'text/css')
      }
    }

    this.res.data = this.body
    return new Promise((resolve, reject) => {
      app.nuxt.render(this.req, this.res, promise => {
        console.log(this.res)
        // nuxt.render passes a rejected promise into callback on error.
        promise.then(resolve).catch(reject)
      })
    })
  }
}
