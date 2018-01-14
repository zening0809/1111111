'use strict'
const { Builder } = require('nuxt')
const redisExtend = require('./lib/redis-extend')

module.exports = app => {
  const nuxt = app.nuxt
  if (app.config.nuxt.dev) {
    const builder = new Builder(nuxt)
    builder.build().catch(e => {
      app.logger.error(e)
      process.exit(1)
    })
  }
  redisExtend(app)

  app.beforeStart(async () => {
  })
}
