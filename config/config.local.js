'use strict'

const fs = require('fs')

module.exports = appInfo => {
  let config = {
    logger: {
      level: 'DEBUG',
      consoleLevel: 'DEBUG',
    },
  }

  try {
    const tmp = require('./dev_config.js')
    config = Object.assign(config, tmp)
  } catch (e) {
    console.error('config err: ' + JSON.stringify(e));
  }

  return config
}
