'use strict'

const UUID = require('uuid')
const { Nuxt } = require('nuxt')
const NUXT = Symbol('Application#nuxt')
const WSCLIENTS = Symbol('Application#wsClients')
const fs = require('fs')


module.exports = {
  get nuxt() {
    if (!this[NUXT]) {
      this[NUXT] = new Nuxt(loadNuxtConfig(this.config))
    }
    return this[NUXT]
  },

  get wsClients() {
    if (!this[WSCLIENTS]) {
      this[WSCLIENTS] = []
    }
    return this[WSCLIENTS]
  },
}

function loadNuxtConfig(config) {
  const options = config.nuxt || {}
  if (!fs.existsSync(options.srcDir)) {
    console.error(`${options.srcDir} folder not exists!`)
    process.exit(1)
  }
  return options
}
