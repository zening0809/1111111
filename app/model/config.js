'use strict'

/**
 * 系统配置
 * 
 * NOTE: 暂停使用
 */

module.exports = app => {
  const mongoose = app.mongoose
  const Schema = new mongoose.Schema({
    _id: { type: String, required: true },
    value: mongoose.Schema.Types.Mixed,
  })

  return mongoose.model('Config', Schema, 'config')
}
