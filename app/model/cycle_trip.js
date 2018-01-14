'use strict'

/**
 * 周期行程记录集合
 */

function addTime(time, addSec) {
  return new Date(time.getTime() - addSec)
}

module.exports = app => {
  const mongoose = app.mongoose
  const Point = mongoose.Schema.Types.Point
  const ObjectId = mongoose.Schema.Types.ObjectId

  const Schema = new mongoose.Schema({
    // 行程创建时间
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },

    // 行程约定时间
    time: Date,
    // 行程出发时间的对于天的偏移秒数 0-60*60*24
    dayTime: Number,
    // 每周的循环时间数组，（周日0、周一1...周六6）
    weeks: [Number],
    // 用户id
    uid: { type: ObjectId, ref: 'User', required: true },
    // 源行程id
    tid: { type: ObjectId, ref: 'Trip', required: true },
    // 是否生效
    enabled: Boolean,
    // 基于此周期行程自动创建的行程计数
    count: Number,
  }, {
    toObject: { virtuals: true },
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  })
  Schema.virtual('ctid').get(function() {
    return this._id + ''
  })

  return mongoose.model('CycleTrip', Schema, 'trip.cycle')
}
