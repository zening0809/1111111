'use strict'

/**
 * 用户信用历史
 */

module.exports = app => {
  const { mongoose } = app
  const ObjectId = mongoose.Schema.Types.ObjectId

  const Schema = new mongoose.Schema({
    // 用户信息建立时间戳
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    // 关联的微信群id (司机认证后会关联司机群)
    uid: { type: ObjectId, ref: 'User' },
    // 信用值类型 邀请invite/系统sys
    type: String,
    // 是否修改信用值成功
    succeed: Boolean,
    // 用户信息更新后的版本号
    user_ver: Number,
    // 信用总值
    add_total: Number,
    add_subtype: {
      // // 出行信用值
      // trip: Number,
      // // 邀请信用值
      // invite: Number,
    },
    // 被邀请人信息字段
    invite: {
      uid: { type: ObjectId, ref: 'User' },
      name: String,
    },
    // 邀请确认（邀请人确认过被邀请人身份）#迭代版本
    // inviteAuth: Boolean,
    // 备注
    memo: String,
  }, {
    toObject: { virtuals: true },
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  })

  return mongoose.model('CreditLog', Schema, 'credit.log')
}
