'use strict'
module.exports = app => {
  const { model, redis, config } = app
  // TODO:公众号页面服务
  class WebService extends app.Service {

    /**
     * 获取绑定信息
     * 
     * @param {any} openid 
     * @returns 
     * @memberof WebService
     */

    async bind({ openid, inviteCode }) {
      const { service, logger, ctx } = this
      const ret = {
        key: null,
        msg: null,
        botUrl: null,
        expire_time: null,
      }
      const uid = await service.user.getUserByOpenid(openid)
      if (uid) {
        const user = await service.user.getUser(uid)
        if (user && user.wx_alias) {
          ret.msg = '账户已经绑定过！未解绑前不能再次绑定！'
          return ret
        }
      }
      const bot = await service.core.getBindBot()
      if (!bot || !bot.qrcodeImgUrl) {
        ret.msg = '系统错误！当前无法提供绑定服务！'
        logger.error('\n bind() 没有有效的Bot二维码信息')
      } else {
        ret.imgUrl = bot.qrcodeImgUrl
        ret.key = ctx.helper.uuid(16)
        ret.expire_time = await service.bind.set(ret.key, { openid, inviteCode })
      }
      return ret
    }

    /**
     * 获取用户信息（删减字段）
     * 
     * @returns 
     * @memberof WebService
     */

    async getUserInfo({ openid, uid }) {
      const { service, logger } = this
      const ret = {
        // msg: null,
        info: {
          uid: null,
          unum: null,
          phone: '',
          wx_id: '',
          useWay: null,
          wx_nickname: '',
          formal: null,
          addrs: [],
          recent_addrs: [],
          gender: null,
          car_model: null,
          car_seat: null,
          car_color: null,
          car_no: null,
          corp: null,
          intro: null,
          credit_total: 0,
          credit_subtype: {},
          // TODO:用户头像，需要后续跟进。采用微信授权获取，还是用bot获取。以及头像资源的保存方式
          headImg: '',
          score: {},
        },
      }
      logger.debug('\n getUserInfo() openid: "%s" \nuid: %s', openid, uid)
      if (!uid) {
        uid = await service.user.getUserByOpenid(openid)
      }
      const user = await service.user.getUser(uid, true)
      logger.debug('\n getUserInfo() ret user: %s', JSON.stringify(user))
      if (!user) {
        ret.msg = '未能获取此用户信息！'
      } else {
        for (const key in ret.info) {
          if (user[key]) {
            ret.info[key] = user[key]
          }
        }
      }
      return ret
    }

    /**
     * 更新用户信息
     * 
     * @param {any} uid 
     * @param {any} data 
     * @returns 
     * @memberof WebService
     */

    async setUserInfo({ data = {}, openid, uid }) {
      const { service, logger } = this
      const d = {}
      const fields = [
        'phone',
        'wx_id',
        'useWay',
        'addrs',
        'gender',
        'car_model',
        'car_seat',
        'car_color',
        'car_no',
        'corp',
        'intro',
      ]
      fields.forEach(i => {
        if (data[i] !== undefined) {
          d[i] = data[i]
        }
      })
      if (d.phone || d.wx_id) {
        data.formal = true
      }

      // TODO:进一步过滤字段，比如addrs
      const ret = await service.user.update(uid, d)
      return !!ret
    }

    /**
     * 按条件搜索行程
     * 
     * @param {any} data 
     * @returns 
     * @memberof WebService
     */

    async findTrip({ data = {}, openid, uid }) {
      const { service, logger, session } = this.ctx
      const d = {}
      const fields = [
        'sloc',
        'eloc',
        'date',
      ]
      // TODO:待添加分页查询
      // TODO: 需要添加对自己行程的屏蔽
      fields.forEach(i => {
        if (data[i] !== undefined) {
          d[i] = data[i]
        }
      })
      d.type = 'car'
      const ret = await service.trip.find(d)
      if (ret && Array.isArray(ret)) {
        for (const key in ret) {
          const i = ret[key]
          const u = await service.user.getUser(i.uid)
          ret[key] = {
            tid: i.tid,
            time: i.time,
            close_time: i.close_time,
            sloc: i.sloc.name,
            eloc: i.eloc.name,
            price: i.price,
            min_seat: i.min_seat,
            max_seat: i.max_seat,
            memo: i.memo,
            car_model: u.car_model,
          }
        }
      }
      return ret || false
    }

    async getTripLog({ openid, uid }) {
      if (!openid || !uid) {
        return false
      }
      const { service, logger } = this
      const trips = await service.trip.findLog({ uid })
      if (!trips) {
        return false
      }
      const fields = new Set([
        'tid',
        'createTime',
        'time',
        'close_time',
        'sloc',
        'eloc',
        'type',
        'state',
        'min_seat',
        'max_seat',
        'dist',
        'price',
      ])
      // logger.debug('\ngetTripLog() 查找用户uid "%s" 的行程历史如下: \n%s\n', uid, JSON.stringify(trips))
      const ret = []
      for (const key in trips) {
        const trip = trips[key].toObject()
        // console.log('现在key是: %s', key)
        for (const f in trip) {
          // console.log('现在f是: %s', f)
          if (!fields.has(f)) {
            delete trip[f]
          }
        }
        ret.push(trip)
      }
      // logger.debug('\ngetTripLog() 字段过滤后的数据为: \n%s\n', JSON.stringify(ret))
      return ret
    }

    /**
     * 获取行程详情（含司机情况）
     * 
     * @param {any} data 
     * @param {any} { openid } 
     * @returns 
     * @memberof WebService
     */

    async getTripInfo({ data = {}, openid, uid }) {
      const { service, logger } = this
      const trip = await service.trip.getTrip(data.tid, true)
      logger.debug('\n getTripInfo() 获得行程信息：%s', JSON.stringify(trip))
      if (!trip) {
        return { msg: '未能获取行程详情！' }
      }
      const ret = {
        trip: {
          tid: trip.tid,
          time: trip.time,
          close_time: trip.close_time,
          sloc: trip.sloc,
          eloc: trip.eloc,
          price: trip.price,
          min_seat: trip.min_seat,
          max_seat: trip.max_seat,
          memo: trip.memo,
        },
      }
      if (trip.type === 'car') {
        const user = await service.user.getUser(trip.uid)
        logger.debug('\n getTripInfo() 获得用户信息：%s', JSON.stringify(user))
        if (!user) {
          return { msg: '未能获取行程详情！' }
        }
        ret.driver = {
          name: user.name,
          wx_nickname: user.wx_nickname,
          credit: user.credit_total,
          car_model: user.car_model,
          car_color: user.car_color,
          car_no: user.car_no,
          intro: user.intro,
        }
      }
      // 蛋疼，uid默认是Object，要转换成字符串
      // if ((trip.uid + '') === uid && data.detail) {
      //   ret.trip.sloc = trip.sloc
      //   ret.trip.eloc = trip.eloc
      // }
      logger.debug('\n getTripInfo() 进入参数: \n%s\n得到结果:\n%s\n获得Trip数据：\n%s\n', JSON.stringify({ data, uid, openid }), JSON.stringify(ret), JSON.stringify(trip))
      return ret
    }

    /**
     * 发布行程
     * 
     * @param {any} data 
     * @returns 
     * @memberof WebService
     */

    async pubTrip({ data = {}, openid, uid }) {
      const { service, logger } = this
      const d = {}
      const fields = [
        'time',
        'sloc',
        'eloc',
      ]
      const fields2 = [
        // 'isDriver',
        // 'type',
        'close_time',
        'min_seat',
        'max_seat',
        'price',
        'memo',
      ]
      for (const f of fields) {
        if (data[f] !== undefined) {
          d[f] = data[f]
        } else {
          // return false
          logger.error('\n pubTrip() 参数"%s"检查失败！', f)
          return {
            errCode: 21,
            msg: '参数错误！',
          }
        }
      }
      if (data.isDriver) {
        for (const f of fields2) {
          if (data[f] !== undefined) {
            d[f] = data[f]
          } else {
            // return false
            logger.error('\n pubTrip() 参数"%s"检查失败！', f)
            return {
              errCode: 21,
              msg: '参数错误！',
            }
          }
        }
        d.close_time = new Date(d.close_time)
        d.price = d.price * 1 || 0
        d.min_seat = d.min_seat * 1 || 1
        d.max_seat = d.max_seat * 1 || 1
      }
      d.uid = uid
      d.source = 'mp'
      d.type = data.isDriver ? 'car' : 'person'
      d.time = new Date(d.time)
      if (d.time < new Date() || (d.close_time && d.close_time < new Date())) {
        return {
          errCode: 31,
          msg: '时间设置错误！',
        }
      }
      if (d.memo && d.memo.length > 100) {
        return {
          errCode: 31,
          msg: '备注字数不能超过100字！',
        }
      }

      if (data.gid) {
        // 查询gid是否为有效的微信群id
        const groupInfo = await service.group.getGroup(data.gid)
        if (groupInfo && groupInfo.gid) {
          d.gid = groupInfo.gid
        } else {
          logger.warn('\n pubTrip() 创建行程时，未能获取到gid "%s" 对应的微信群信息', data.gid)
        }
      }

      const trips = await model.Trip.find({
        state: 'open',
        uid,
      }, null, { limit: 5 })

      logger.debug('\n pubTrip() 创建行程前，提交来的data:\n%s\n', JSON.stringify(data))
      logger.debug('\n pubTrip() 创建行程前，寻找用户行程结果:\n%s\n', JSON.stringify(trips))
      console.log(111111111111);
      可以发多个行程
      if (trips && Array.isArray(trips) && trips.length > 0) {
        logger.warn('\n pubTrip() 用户uid "%s" 创建行程前仍有未关闭行程，取消创建行程', uid)
        return {
          errCode: 31,
          msg: '仍有未结束的行程！不能再发布新行程！',
        }
      }

      // 这里创建操作返回的是boolean值
      const tid = await service.trip.create(d)
        .catch(e => {
          logger.error(e)
          let msg = '创建行程失败！'
          if (/创建行程/.test(e.message)) {
            msg = e.message
          }
          throw new Error(msg)
        })


      // 检查是否要创建周期行程
      if (data.cycle && Array.isArray(data.week_cycle) && data.week_cycle.length > 0) {
        const week = new Set()
        data.week_cycle.forEach(w => {
          // 周几，注意 0-6顺次代表周日周一至周六
          if (w >= 0 && w <= 6) {
            week.add(w)
          }
        })
        if (week.size > 0) {
          const data = {
            time: d.time,
            dayTime: d.time.getTime() % (1000 * 60 * 60 * 24),
            weeks: Array.from(week),
            uid: d.uid,
            tid,
            enabled: true,
            count: 0,
          }
          await model.CycleTrip.update({
            uid: d.uid,
            enabled: true,
          }, {
            $set: { enabled: false },
          }, {
            multi: true,
          })
          const ret = await model.CycleTrip.create(data)
          if (!ret || !ret.ctid) {
            logger.error('\n pubTrip() 创建周期行程失败！')
          }
          await model.Trip.update({
            _id: tid,
          }, {
            ctid: ret.ctid,
          })
        } else {
          logger.warn('\n pubTrip() 要创建的周期行程没有选择任何一天！\nweek_cycle: %s\n', JSON.stringify(data.week_cycle))
        }
      }
      return tid
    }

    /**
     * 加入行程
     * 
     * @param {any} data 
     * @returns 
     * @memberof WebService
     */

    async joinTrip({ data = {}, openid, uid }) {
      const { service, logger } = this
      const d = {}
      const fields = [
        'tid',
        'seat',
      ]
      fields.forEach(i => {
        if (data[i] !== undefined) {
          d[i] = data[i]
        }
      })
      d.uid = uid
      const ret = await service.trip.joinTrip(d)
      logger.debug('\n joinTrip() 返回了: %s', ret)
      // ret = {
      //   msg: '错误提示',
      //   closeMyTrip: false, // 是否关闭自己的行程
      // }
      if (ret.closeMyTrip || ret.closeMyTrip === undefined) {
        // 以下将完成用户所有未关闭的行程
        const query = {
          uid,
          state: 'open',
        }
        const trips = await model.Trip.find(query)
        logger.debug('\n joinTrip() 关闭行程操作，查询用户uid "%s" 未关闭行程结果：\n%s\n', uid, JSON.stringify(trips))
        for (const trip of trips) {
          logger.debug('\n joinTrip() 关闭行程操作，关闭用户uid "%s" 未关闭行程tid：%s', uid, trip.tid)
          await service.trip.closeTrip(trip.tid, true)
        }
      }
      return ret
    }

    /**
     * 关闭行程
     * 
     * @param {any} { data = {}, openid, uid } 
     * @returns 
     * @memberof WebService
     */

    async closeTrip({ data = {}, openid, uid }) {
      const { service, logger } = this
      const d = {}
      const fields = [
        'tid',
        'done',
      ]
      fields.forEach(i => {
        if (data[i] !== undefined) {
          d[i] = data[i]
        }
      })
      d.uid = uid
      const trip = await service.trip.getTrip(d.tid)
      if (!trip || trip.uid !== uid) {
        // 没有找到此行程或行程不是此用户的
        return false
      }
      const ret = await service.trip.closeTrip(data.tid, data.done)
      logger.debug('\n closeTrip() 返回了: %s', ret)
      return ret
    }

    /**
     * 删除行程（对用户隐藏）
     * 
     * @param {any} { tid, openid, uid } 
     * @returns 
     * @memberof WebService
     */

    async delTrip({ tid, openid, uid }) {
      const { service, logger } = this
      const trip = await service.trip.getTrip(tid, true)
      const ret = {
        // msg:'',
      }
      // console.log('', trip, '')
      if (!trip) {
        ret.msg = '要删除的行程不存在！'
        return ret
      }
      if (trip.uid + '' !== uid) {
        // 行程不是此用户的
        ret.msg = '无法删除非自己的行程！'
        logger.warn('\n delTrip() 用户uid: "%s" 尝试删除非自己的行程tid: "%s"', uid, tid)
        return ret
      }
      if (trip.hide) {
        // 避免重复提交删除操作，以及探测行程是否删除
        ret.msg = '操作失败：行程已删除！'
        logger.warn('\n delTrip() 行程tid: "%s" 已经删除过了', tid)
        return ret
      }
      const r = await service.trip.delTrip(tid)
      logger.debug('\n delTrip() 返回了: %s', r)
      if (!r) {
        ret.msg = '删除行程失败！'
      }
      return ret
    }


    /**
     * 获取地图配置
     * 
     * @returns 
     * @memberof WebService
     */

    async getMapConf() {
      const { service, logger, config } = this
      const ret = {
        mapConf: {
          key: null,
          referer: null,
        },
      }
      // const t = await service.config.getMapConf()
      const t = config.mapConf
      if (t && t.key) {
        ret.mapConf = t
      } else {
        ret.msg = '没有有效的地图配置'
      }
      return ret
    }

    /**
     * 获取邀请记录
     * 
     * 从信用历史中获取邀请类型的记录
     * 
     * @param {any} { uid, skip, limit } 
     * @returns 
     * @memberof WebService
     */

    async getInviteLog({ uid, skip, limit }) {
      const { service, logger } = this
      if (!uid) {
        return false
      }
      const log = await model.CreditLog.find({
        uid, type: 'invite', succeed: true,
      }, {
        _id: 1,
        createTime: 1, add_total: 1,
        add_subtype: 1, type: 1, invite: 1,
      }, {
        limit: limit || 10, sort: { createTime: -1 },
        skip,
      })
      logger.debug('\n getInviteLog() 获取邀请历史记录结果：\n%s\n', JSON.stringify(log))
      const ret = []
      if (log) {
        log.forEach(item => {
          ret.push({
            id: item._id,
            createTime: item.createTime,
            add_total: item.add_total,
            name: item.invite ? item.invite.name || '' : '',
          })
        })
      }
      return log ? ret : false
    }

    /**
     * 创建支付订单
     * 
     * @param {any} { openid, uid, fee } 
     * @returns 
     * @memberof WebService
     */

    async createPay({ openid, uid, fee, unum }) {
      const { service, logger, ctx } = this
      if (!uid && !openid && !fee) {
        throw new Error('缺少必要参数！')
      }
      // 查询被打赏用户uid
      const reward_uid = unum && await service.user.getUserByUnum(unum) || ''
      const order = {
        // 订单金额从 元转分
        total_fee: fee * 100,
        openid,
        body: (reward_uid && '打赏用户 ' + unum) || '打赏借螃蟹平台',
        out_trade_no: Date.now() + ctx.helper.uuid(16),
        notify_url: config.host + '/hook/pay',
      }
      const data = await service.wxPay.getJsPayParams(order)
        .catch(e => {
          logger.error('\n createPay() error:\n', e)
        })
      if (!data) {
        throw new Error('创建支付订单失败！')
      }
      await model.WxPay.create({
        uid, openid,
        body: order.body,
        type: 'reward',
        total_fee: order.total_fee,
        out_trade_no: order.out_trade_no,
        state: 0, // 等待支付
        reward_uid: reward_uid || null,
      })
      return data
    }

    /**
     * 更新订单状态
     * 
     * @param {any} { openid, uid, out_trade_no, fee, state } 
     * @returns 
     * @memberof WebService
     */

    async updatePay({ openid, out_trade_no, total_fee, cash_fee, state }) {
      const { service, logger, ctx } = this
      const order = await model.WxPay.findOneAndUpdate({
        openid, out_trade_no, total_fee, state: 0,
      }, {
        $set: { state, cash_fee },
      }, {
        new: true,
      })
      logger.debug('\n updatePay() find order \n%s', JSON.stringify(order))

      if (order && order.state === 1 && order.type === 'reward' && parseInt(order.cash_fee / 100) > 0) {
        const ret = await service.user.addScore({
          // 如果指定了打赏目标，则为被打赏用户增加积分，否则为当前用户增加积分
          uid: order.reward_uid || order.uid,
          type: 'reward',
          value: parseInt(order.cash_fee / 100),
          // 如果指定了打赏目标，则积分记录保存当前用户
          from_uid: order.reward_uid && order.uid || null,
          memo: order.reward_uid ? '被用户打赏获得积分' : '打赏平台获得积分',
        })
          .catch(e => {
            logger.error('updatePay() 捕捉到异常： ', e)
          })
        logger.debug('\n updatePay() 因打赏为用户uid "%s" 增加 %d 积分。%s \n', order.reward_uid || order.uid, parseInt(order.cash_fee / 100), ret ? '操作成功' : '操作失败')
      }
      return order && !!order._id
    }


  }
  return WebService
}
