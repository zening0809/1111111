'use strict'

const fs = require('fs')

module.exports = appInfo => {
  let config = {
    logger: {
      level: 'INFO',
      consoleLevel: 'INFO',
    },
  }

  try {
    const tmp = require('./prod_config.js')
    config = Object.assign(config, tmp)
  } catch (e) {
    console.error('config err: ' + JSON.stringify(e));
  }

  if (process.env.CONFIG_FILE && fs.existsSync(process.env.CONFIG_FILE)) {
    try {
      const tmp = require(process.env.CONFIG_FILE)
      config = Object.assign(config, tmp)
    } catch (e) {
      console.error('config err: ' + JSON.stringify(e));
    }
  }

  if (process.env.CONFIG) {
    try {
      const tmp = JSON.parse(process.env.CONFIG)
      config = Object.assign(config, tmp)
    } catch (e) {
      console.error('config err: ' + JSON.stringify(e));
    }
  }

  return config
}
