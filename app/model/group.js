'use strict'

/**
 * 微信群(含大群与司机专属群)
 */

module.exports = app => {
  const mongoose = app.mongoose
  const Point = mongoose.Schema.Types.Point
  const ObjectId = mongoose.Schema.Types.ObjectId

  const Schema = new mongoose.Schema({
    // 群建立时间戳
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    // 群名称，同topic
    name: String,
    // 群组组织名称，用于将多个群认定为属于同一组织
    union_name: String,
    // 群类型 (大群big，专属群driver，客服群service)
    type: String,
    // 司机的用户id
    uid: { type: ObjectId, ref: 'User' },
    // 司机 微信id(alias)
    wx_alias: String,
    // 管理员信息
    admin: {
      // 管理员id(alias) 数组
      wx_alias: [String],
    },
    // 状态
    state: String,
    // 成员数量
    member_num: Number,
    // 进入密码
    key: String,
  }, {
    toObject: { virtuals: true },
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  })
  // Schema.pre('save', function(next) {
  //   next()
  // })

  Schema.virtual('gid').get(function() {
    return this._id + ''
  })

  return mongoose.model('WxGroup', Schema, 'wx.group')
}
