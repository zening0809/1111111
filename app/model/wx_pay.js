'use strict'

/**
 * 微信支付
 */

module.exports = app => {
  const { mongoose } = app
  const ObjectId = mongoose.Schema.Types.ObjectId

  const Schema = new mongoose.Schema({
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    uid: { type: ObjectId, ref: 'User' },
    openid: String,
    // 商品名称
    body: String,
    // 订单号
    out_trade_no: String,
    // 订单类型 打赏reward
    type: String,
    // 订单金额，单位为分
    total_fee: Number,
    // 现金支付金额
    cash_fee: Number,
    // 订单状态 (等待支付0，支付成功1，支付失败-1)
    state: Number,
    // 打赏目标用户uid，如果没有指定用户，则默认为平台
    reward_uid: { type: ObjectId, ref: 'User' },
  }, {
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  })

  return mongoose.model('WxPay', Schema, 'wx.pay')
}
