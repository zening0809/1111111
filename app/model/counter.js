'use strict'

/**
 * 系统计数器
 */

module.exports = app => {
  const mongoose = app.mongoose
  const Schema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1 },
  })

  return mongoose.model('counter', Schema, 'counter')
}
