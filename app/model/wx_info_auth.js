'use strict'

/**
 * 微信授权
 * 
 * NOTE: 一期暂不用
 */

module.exports = app => {
  const mongoose = app.mongoose
  const Schema = new mongoose.Schema({
    createTime: { type: Date, default: Date.now, index: {} },
    access_token: String,
    refresh_token: String,
    scope: String,
    wx_openid: { type: String, default: '' },
  })

  return mongoose.model('Config', Schema, 'config')
}
