'use strict'

/**
 * 后台管理帐号
 * 
 * NOTE: 暂未用
 */

module.exports = app => {
  const mongoose = app.mongoose
  const Schema = new mongoose.Schema({
    // 账号名
    user: { type: String, required: true, unique: true },
    // 密码
    password: { type: String, required: true },
    // 姓名
    name: { type: String, required: true },
    // 账号状态
    state: { type: Number, required: true },
    // 权限
    auth: [{ type: String }],
  }, {
    toObject: { virtuals: true },
  })
  Schema.virtual('aid').get(function() {
    return this._id + ''
  })

  return mongoose.model('Admins', Schema, 'admins')
}
