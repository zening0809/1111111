'use strict'

// 先加载geojson扩展，为mongoose注入geojson schema，否则model中无法使用GeoJSON类型
const GeoJSON = require('mongoose-geojson-schema')

module.exports = {
  redis: {
    enable: true,
    package: 'egg-redis',
  },
  sessionRedis: {
    enable: true,
    package: 'egg-session-redis',
  },
  mongoose: {
    enable: true,
    package: 'egg-mongoose',
  },
  validate: {
    enable: true,
    package: 'egg-validate',
  },
  io: {
    enable: true,
    package: 'egg-socket.io',
  },
  oss: {
    enable: true,
    package: 'egg-oss',
  },
}
