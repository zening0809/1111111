'use strict'

/**
 * 行程集合
 */

function addTime(time, addSec) {
  return new Date(time.getTime() - addSec)
}

module.exports = app => {
  const mongoose = app.mongoose
  const Point = mongoose.Schema.Types.Point
  const ObjectId = mongoose.Schema.Types.ObjectId
  // 提前截止匹配的分钟数
  const dtime_max = app.config.trip.deadline_time.max
  const dtime_min = app.config.trip.deadline_time.min || 10

  const Schema = new mongoose.Schema({
    // 行程创建时间
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },

    // 行程约定时间
    time: Date,
    // 匹配截止时间
    close_time: Date,
    // 起点坐标
    // {
    //   type: "Point",
    //   coordinates: [12.123456, 13.134578],
    //   addr: '',
    //   name: '',
    //   cityname: ''
    // },
    // sloc: { type: Point, required: true },
    sloc: { type: Point, index: '2dsphere', required: true },
    // sloc: {
    //   type: String,
    //   name: String,
    //   coordinates: { type: [Number], index: '2dsphere', required: true },
    //   cityname: String,
    //   addr: String,
    // },
    // 终点坐标
    // eloc: { type: Point, required: true },
    eloc: { type: Point, index: '2dsphere', required: true },
    // eloc: {
    //   type: String,
    //   name: String,
    //   coordinates: { type: [Number], index: '2dsphere', required: true },
    //   cityname: String,
    //   addr: String,
    // },
    // 匹配类型 （找车/找人）
    type: String,
    // 用户id
    uid: { type: ObjectId, ref: 'User', required: true },
    // 周期行程记录id
    ctid: { type: ObjectId, ref: 'CycleTrip' },

    // 行程状态 (创建中/等待/满人/已完成/已取消)
    state: String,
    // 行程删除标志（仅对用户隐藏显示）
    hide: Boolean,
    // 行程的发起来源(微信群/公众号/小程序)
    source: String,
    // 行程是否对外共享 TODO: 使用此字段控制是否其他人可见
    // NOTE: 一期不用
    share: Boolean,

    // 行程来源群id
    gid: String,
    // 司机群id (司机有效)
    driver_gid: String,
    // 司机群key (司机有效)
    driver_gkey: String,
    // 最少乘客数 (司机有效)
    min_seat: Number,
    // 最多乘客数 (司机有效)
    max_seat: Number,
    // 是否来自平台用户
    formal: Boolean,

    // 占用座位数 (乘客有效)
    seat: Number,

    // 距离 单位：公里
    dist: Number,
    // 建议价格
    price: Number,

    // 说明 (期望的乘客)
    // explain: String,
    // 备注
    memo: String,
  }, {
    toObject: { virtuals: true },
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  })

  // Schema.virtual('deadline_minute').set(function (minute) {
  //   // 截止时间超出系统配置的范围，则使用配置的最小值
  //   if (minute < dtime_min || minute > dtime_max) {
  //     minute = dtime_min
  //   }
  //   this.deadline_time = addTime(this.stime, minute * 60)
  // })
  // Schema.virtual('deadline_minute').get(function () {
  //   const stime = this.stime.getTime()
  //   const dtime = this.deadline_time.getTime()
  //   const minute = (stime - dtime) / 1000 / 60
  //   // 截止出发时间前的分钟数，保证在 30~300分钟范围内
  //   return (minute < dtime_min || minute > dtime_max) ? dtime_min : minute
  // })
  Schema.virtual('tid').get(function() {
    return this._id + ''
  })
  // Schema.pre('save', function(next) {
  //   this.time = new Date(this.time)
  //   this.close_time = new Date(this.close_time)
  //   next()
  // })

  return mongoose.model('Trip', Schema, 'trip')
}
