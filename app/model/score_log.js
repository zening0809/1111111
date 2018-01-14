'use strict'

/**
 * 用户积分历史
 */

module.exports = app => {
  const { mongoose } = app
  const ObjectId = mongoose.Schema.Types.ObjectId

  const Schema = new mongoose.Schema({
    // 用户信息建立时间戳
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    // 关联的用户id
    uid: { type: ObjectId, ref: 'User' },
    // 积分记录类型 打赏reward/系统sys
    type: String,
    // 是否修改用户积分成功
    succeed: Boolean,
    // 用户信息更新后的版本号
    user_ver: Number,
    // 信用总值
    add_value: Number,
    // 来源用户id
    from_uid: { type: ObjectId, ref: 'User' },
    // 备注
    memo: String,
  }, {
    toObject: { virtuals: true },
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  })

  return mongoose.model('ScoreLog', Schema, 'score.log')
}
