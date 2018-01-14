'use strict'

/**
 * 微信bot聊天记录存储
 */

module.exports = app => {
  const { mongoose } = app
  const ObjectId = mongoose.Schema.Types.ObjectId
  // 信息最长存储7天自动删除，如果创建时提供信息发布时间，则按发布时间计算
  const ttl = 60 * 60 * 24 * 7

  const Schema = new mongoose.Schema({
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    time: { type: Date, default: Date.now, index: { expires: ttl } },
    uid: { type: ObjectId, ref: 'User' },
    gid: { type: ObjectId, ref: 'Group' },
    msg: { type: String, required: true },
  }, {
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  })

  return mongoose.model('WxMsg', Schema, 'wx.msg')
}
