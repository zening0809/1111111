'use strict'

/**
 * 用户信息
 */

module.exports = app => {
  const { mongoose } = app
  const Point = mongoose.Schema.Types.Point
  const ObjectId = mongoose.Schema.Types.ObjectId
  const unum_base = 1000000

  // 地址
  const Addr = {
    // 位置坐标
    loc: { type: Point, index: '2dsphere' },
    // 位置标题
    text: String,
    // 位置类型：家/公司/无
    type: String,
  }

  const UserSchema = new mongoose.Schema({
    // 用户信息建立时间戳
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    // 用户编号
    unum: { type: String, index: true },
    phone: { type: String, default: '' },
    // 微信号 (web端手动填写)
    wx_id: { type: String, default: '' },
    // 姓名（车主）
    name: String,
    // 首选联系方式
    useWay: { type: String, default: 'phone' },
    // 微信 alias (wechaty识别用户的方式)
    wx_alias: { type: String, default: '' },
    // 微信昵称
    wx_nickname: { type: String, default: '' },
    // 公众平台的openid
    wx_openid: { type: String, default: '' },
    // 平台注册用户 标记
    formal: { type: Boolean, default: false },
    // 关联的微信群id (司机认证后会关联司机群)
    gid: { type: ObjectId, ref: 'Group' },
    // 地址列表
    addrs: Array,
    // 近期地址列表
    recent_addrs: Array,
    // 性别 (男人male 1/女人female 2/未知unknown 0)
    gender: { type: Number, default: 0 },
    // 车型
    car_model: String,
    // 车颜色
    car_color: String,
    // 车牌号
    car_no: String,
    // 车辆座位数
    car_seat: Number,
    // 微信头像的url
    wx_headImgUrl: String,
    // 头像资源url
    headImg: String,
    // 头像资源更新日期
    headImgUpdatetime: Date,
    // 公司名称
    corp: String,
    // 简介 
    intro: { type: String, default: '' },
    // 标签 用户为自己设定的关键字，比如能提供的服务、从业类型、爱好等
    tag: [String],
    // 邀请人的uid
    inviteFromUid: { type: ObjectId, ref: 'User' },
    // 信用总值
    credit_total: { type: Number, default: 0 },
    credit_subtype: {
      // // 出行信用值
      // trip: { type: Number, default: 0 },
      // // 邀请信用值
      // invite: { type: Number, default: 0 },
    },
    // 积分
    score: {
      // 总积分（含待生效部分）
      total: { type: Number, default: 0 },
      // 有效积分上限（更新信用值时，同步更新）
      limit: { type: Number, default: 0 },
      // // 【虚拟属性】有效积分
      // valid: { type: Number, default: 0 },
      // // 【虚拟属性】冻结积分（待生效积分）
      // freeze: { type: Number, default: 0 },
    },
    // 是否发送用户信息
    is_send: { type: Boolean, default: true },
    // 住址
    address: { type: String, default: '' },
    // 上班时间
    office_hours: Date,
    // 下班时间 
    off_hours: Date,
    // TODO: 认证部分
    cert: {},
    
  }, {
    toObject: { virtuals: true },
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  })
  /** 实现用户编号自增加 */
  UserSchema.pre('save', async function(next) {
    if (!this.unum) {
      let value = await app.model.Counter.findOneAndUpdate({ _id: 'user_number' }, { $inc: { seq: 1 } }, { new: true })
      if (!value) {
        value = await app.model.Counter.create({ _id: 'user_number', seq: 1 })
      }
      this.unum = unum_base + value.seq
    }
    // this.__v++
    // console.log('保存user中，版本锁字段__v= "%s"', this.__v)
    next()
  })

  UserSchema.virtual('uid').get(function() {
    return this._id + ''
  })

  UserSchema.virtual('score.valid').get(function() {
    const limit = this.credit_total
    return this.score.total < limit ?
      this.score.total :
      limit
  })

  UserSchema.virtual('score.freeze').get(function() {
    const limit = this.credit_total
    return this.score.total > limit ?
      this.score.total - limit : 0
  })

  return mongoose.model('user', UserSchema, 'user')
}
