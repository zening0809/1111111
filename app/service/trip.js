'use strict'

/**
 * 平台行程匹配业务
 */

const enum_state = {
  open: 'open',
  done: 'done',
  canceled: 'canceled',
  timeout: 'timeout',
}

const enum_type = {
  // 车找人
  car: 'car',
  // 人找车
  person: 'person',
}

const enum_notify = {
  group: 'group',
  alone: 'alone',
}

module.exports = app => {
  const config = app.config.trip
  const ObjectId = app.mongoose.Schema.Types.ObjectId

  // 转换时间单位
  // TODO: 需要改定义
  const deadline_time = {
    max: config.deadline_time.max * 60,
    min: config.deadline_time.min * 60,
  }
  const diff_time = config.diff_time * 60
  const batch_diff_time = config.batch_diff_time
  const loc_near = config.loc.near
  const unit_price = config.unit_price
  const max_seat = config.max_seat
  const limit = {
    // NOTE: 查询历史记录返回数量限制
    log: config.trip_log_limit || 10,
    // NOTE: 单次匹配行程结果数量限制
    find: config.trip_match_limit || 10,
  }
  const expire_time = 60

  // 平台行程等候匹配队列
  const { model } = app
  const redis = app.redis
  // const redis = app.redis.get('trip')

  class TripService extends app.Service {

    /**
     * 创建行程
     * 
     * 当创建了一个新行程后，如果是司机行程，且没有能找到此司机的专属群，会为其创建专属群
     * 但会避免重复建群
     * 
     * @param {any} data 
     * @returns 
     * @memberof TripService
     */

    async create(data) {
      const { logger, ctx, service, config } = this
      const tripData = {
        time: data.time,
        close_time: data.close_time || data.time,
        sloc: ctx.helper.convertLoc(data.sloc),
        eloc: ctx.helper.convertLoc(data.eloc),
        type: data.type === 'car' ? 'car' : 'person',
        uid: data.uid,
        state: enum_state.open,
        source: data.source || 'unknown',
        gid: data.gid || '',
        ctid: data.ctid || null,
        // seat: data.seat || null,
        // formal: user.formal,
      }
      if (!data.uid) {
        throw new Error('创建行程失败：缺少用户信息！')
      }
      const query = {
        state: enum_state.open,
        uid: data.uid,
      }
      const trips = await model.Trip.find(query, null, { limit: 5 })
      logger.debug('\n create() 创建行程前，寻找用户行程结果:\n%s\n', JSON.stringify(trips))
      if (trips && Array.isArray(trips) && trips.length > 0) {
        logger.warn('\n create() 用户uid "%s" 创建行程前仍有未关闭行程，取消创建行程，使用查询条件：\n%s\n', data.uid, JSON.stringify(query))
        throw new Error('创建行程失败：存在未关闭的行程！')
      }

      logger.debug('\n create() 准备创建行程')
      const user = await service.user.getUser(data.uid)
      // 行程类型是司机，而且不是从微信群内发布的行程
      if (tripData.type === 'car' && tripData.source !== 'group') {
        logger.debug('\n create() 行程为司机行程，将查询是否有专属群')
        // 如果要创建司机群，则先查队列中是否有此司机uid的建群任务
        const key = 'new_group#' + data.uid
        if (user && !await service.group.getUserGroup(data.uid) && !await redis.exists(key)) {
          // TODO: 需要创建专属群
          logger.debug('\n create() 此司机没有对应专属群，现在提交创建专属群')
          await service.group.newGroup({
            uid: data.uid,
            type: 'driver',
            // NOTE: 司机群名称格式在这里改
            name: config.trip.groupNamePrefix + user.unum,
            // 司机群key默认使用其用户编号
            key: user.unum,
          })
        } else {
          logger.debug('\n create() 此司机有对应专属群或正在建群队列中，不提交建群')
        }
      }

      // logger.debug('\ntripData: %s', JSON.stringify(tripData))
      // 此处计算记录为两点间距离，并非路线距离！
      // if (!data.dist) {
      //   const id = ctx.helper.uuid()
      //   const geo = [].concat(
      //     tripData.sloc.coordinates,
      //     'sloc',
      //     tripData.eloc.coordinates,
      //     'eloc',
      //   )
      //   await redis.geoadd(id, geo)
      //   // 使用redis计算两点之间的距离
      //   const dist = await redis.geodist(id, 'sloc', 'eloc', 'km')
      //   await redis.del(id)
      //   console.log(dist)
      //   tripData.dist = (dist * 1).toFixed(2)
      // } else {
      //   tripData.dist = (data.dist * 1).toFixed(2)
      // }
      data.dist = 0

      // 计算价格，去掉小数
      const price = (data.price || tripData.dist * unit_price || 0) * 1
      tripData.price = price.toFixed(0)
      tripData.formal = user.formal

      if (data.type === enum_type.car) {
        tripData.driver_gid = ''
        tripData.driver_gkey = ''
        tripData.min_seat = data.min_seat
        tripData.max_seat = data.max_seat
        // tripData.explain = data.explain || ''
        tripData.memo = data.memo || ''
      }
      logger.debug('\n create()行程数据 tripData: %s', JSON.stringify(tripData))
      const trip = await model.Trip.create(tripData)
      if (!trip || !trip.tid) {
        logger.warn('\n create() 创建行程失败!')
        throw new Error('创建行程失败!')
      }

      // debug
      logger.debug('\n create() create model: \n%s', JSON.stringify(trip))
      trip.tid = trip._id + ''
      // 将行程存入redis，用于匹配
      const key = 'trip#' + trip.tid

      const cache_data = {
        tid: trip.tid,
        type: trip.type,
        time: trip.time,
        sloc: JSON.stringify(trip.sloc),
        eloc: JSON.stringify(trip.eloc),
        dist: trip.dist,
        uid: trip.uid,
        gid: trip.gid,
        ctid: trip.ctid || null,
        state: trip.state,
        formal: trip.formal,
        // notify: trip,
        last_time: 0,
        last_res_time: 0,
        last_res_by_time: 0,
      }
      // 通知方式
      // if (trip.gid) {
      //   // 群内通知
      //   cache_data.notify.push(enum_notify.group)
      // } else {
      //   // 单聊通知
      //   cache_data.notify.push(enum_notify.alone)
      // }
      // 行程存入redis

      const msgData = {
        // topic:
        alias: user.wx_alias,
      }
      if (trip.gid) {
        const group = await service.group.getGroup(trip.gid)
        msgData.topic = group.name || null
      }
      // TODO: 时间格式化
      const time = ctx.helper.moment(trip.time).calendar()
      const close_time = ctx.helper.moment(trip.close_time).calendar()
      const link = await service.url.shareTripPage(trip.tid)
      msgData.msg = `您的 ${trip.type === enum_type.car ? '车找人' : '人找车'} 行程已经发布，信息如下：
${time}，从 ${trip.sloc.name} 到 ${trip.eloc.name}
-----
行程信息链接：${link}`

      logger.debug('\n create() 行程创建后的推送信息:\n%s\n\n', JSON.stringify(msgData))
      const pushId = ctx.helper.uuid()
      const pushKey = 'push_msg#' + pushId

      logger.debug('\n create() 信息推送任务id: %s', pushId)
      // 信息设置为30分钟过期
      await redis.hmset(pushKey, msgData)
      await redis.expire(pushKey, 30 * 60)
      await redis.sadd('push_msg', pushId)


      await redis.hmset(key, cache_data)
      // 如果是群内发布行程，则存入群行程集合
      // if (cache_data.gid) {
      //   await redis.sadd('group_trip#' + cache_data.gid, cache_data.tid)
      //   await redis.sadd('trip_group', cache_data.gid)
      // }
      return trip.tid
    }

    /**
     * 载入开放行程到redis
     * 
     * 用于redis或服务重启后，重载数据
     * 
     * @memberof TripService
     */
    async loadOpenTrip() {
      const { logger, ctx, service } = this
      logger.debug('\n loadOpenTrip() 开始载入所有匹配中行程...')
      const keys = await redis.keys('trip#*')
      const tids = new Set()
      keys.forEach(key => {
        tids.add(key.replace(/^trip#/, ''))
      })
      let i = 0
      const trips = await model.Trip.find({ state: enum_state.open })
      for (const trip of trips) {
        if (!tids.has(trip.tid + '')) {
          tids.add(trip.tid)
          const key = 'trip#' + trip.tid
          const user = await service.user.getUser(trip.uid)
          const cache_data = {
            tid: trip.tid,
            type: trip.type,
            time: trip.time,
            sloc: JSON.stringify(trip.sloc),
            eloc: JSON.stringify(trip.eloc),
            dist: trip.dist,
            uid: trip.uid,
            gid: trip.gid,
            ctid: trip.ctid || null,
            state: trip.state,
            formal: user.formal,
            last_time: 0,
            last_res_time: 0,
            last_res_by_time: 0,
          }
          await redis.hmset(key, cache_data)
          // 如果是群内发布行程，则存入群行程集合
          // if (cache_data.gid) {
          //   await redis.sadd('group_trip#' + cache_data.gid, cache_data.tid)
          //   await redis.sadd('trip_group', cache_data.gid)
          // }
          i++
        }
      }
      logger.info('\n loadOpenTrip() 共计载入 %d 条数据库中存在，但redis中不存在的未关闭行程', i)
    }

    /**
     * 批量匹配行程 #人找车
     * 
     * 行程的匹配结果会存入redis中，由定时通知服务进行投递
     * 
     * @memberof TripService
     */

    async batch() {
      const { logger, ctx } = this
      logger.debug('\n batch() 开始批量匹配：')
      const keys = await redis.keys('trip#*')

      logger.debug('\n batch() 待匹配行程数量：%s', keys.length)

      for (const trip_key of keys) {
        const tid = trip_key.replace(/^trip#/, '')
        if (!tid) {
          continue
        }
        const trip = await this.getTrip(tid)
        if (!trip || trip.state !== enum_state.open || !trip.formal) {
          continue
        }
        if (ctx.helper.addTime(trip.last_time, batch_diff_time) > new Date()) {
          // logger.debug('\n batch() last_time间隔时间不足: \n%s\n', trip.last_time)
          // 如果上次匹配时间离现在不足间隔时间，则跳过
          continue
        }
        if (new Date(trip.time) < new Date()) {
          // 如果行程出发时间已经错过，则设置超时并跳过
          await redis.hset(trip_key, 'state', enum_state.timeout)
          continue
        }
        logger.debug('\n batch() 开始获取行程数据，tid：%s \n行程数据：\n%s\n', tid, JSON.stringify(trip))
        // 人找车，不主动匹配
        if (trip.type !== enum_type.person) {
          // 平台批量匹配，使用 人去匹配车 的方式，然后给人发匹配结果
          continue
        }
        await redis.hmset(trip_key, { last_time: new Date() })
        const query = {
          time: trip.time,
          sloc: trip.sloc,
          eloc: trip.eloc,
          state: enum_state.open,
          type: enum_type.car,
          // 只查找平台司机
          formal: true,
        }
        logger.debug('\n batch() 前query: %s', JSON.stringify(query))
        logger.debug('\n batch() 批量匹配 开始匹配，tid：%s', tid)
        const ret = await this.find(query, [trip.tid])
        logger.debug('\n batch() 批量匹配 匹配结果：\n%s\n', JSON.stringify(ret))

        if (ret && ret.length > 0) {
          await redis.hmset(trip_key, { last_res_time: new Date() })
          ret.forEach(async item => {
            // 更新被匹配到的行程的被匹配时间
            const i_key = 'trip#' + item.tid
            if (await redis.exists(i_key)) {
              await redis.hmset(i_key, {
                last_res_by_time: new Date(),
              })
            }
          })
          // const res = { trip: JSON.stringify(trip), ret: JSON.stringify(ret) }
          await this.makeResMsg(trip, ret)
          // const res_key = 'trip_res#' + tid
          // await redis.hmset(res_key, res)
          // await redis.sadd('trip_res', res_key)
        }
      }
    }

    /**
     * 批量匹配群内行程 #车找人
     * 
     * 行程的匹配结果会存入redis中，由定时通知服务进行投递
     * 
     * @param {any} gid 
     * @memberof TripService
     */

    async batchGroup(gid) {
      const { logger, ctx } = this
      logger.debug('\n batchGroup() 开始批量群内匹配：')
      const groups = await redis.smembers('trip_group')
      logger.debug('\n batchGroup() 待匹配群内行程数量：%s', groups.length)
      // 遍历有行程群id 列表
      for (const gid of groups) {
        const group_key = 'group_trip#' + gid
        const tids = await redis.smembers(group_key)
        const tmp_key = 'group_trip_res#' + ctx.helper.uuid()
        // logger.debug('\n batchGroup() 批量匹配 开始群行程匹配，gkey: %s\n获得tid列表:\n%s\n', group_key, JSON.stringify(tids))
        // 遍历群行程id 列表
        for (const tid of tids) {
          // logger.debug('\n batchGroup() 批量匹配 开始群行程匹配，gid: %s\ntid: %s', gid, tid)
          const trip_key = 'trip#' + tid
          const trip = await this.getTrip(tid)
          // logger.debug('\n batchGroup() 批量匹配 trip信息: \n%s\n', JSON.stringify(trip))

          // 如果无法获得行程信息，或者通知方式中不包含群，则跳过
          // if (!trip || trip.notify.indexOf(enum_notify.group) < 0 || trip.state !== enum_state.open) {
          if (!trip || trip.state !== enum_state.open) {
            // 从群行程列表移除
            await redis.srem(group_key, tid)
            return
          }
          if (ctx.helper.addTime(trip.last_time, batch_diff_time) > new Date()) {
            // logger.debug('\n batchGroup() last_time间隔时间不足: \n%s\n', trip.last_time)
            // 如果上次匹配时间离现在不足间隔时间，则跳过
            continue
          }
          // 如果已经在群内被匹配到，则跳过
          // 取消 by: 2017.9.25
          // 原因：跳过其他司机并不公平，会引起负面反馈
          // 
          // const skip = await redis.sismember(tmp_key, tid)
          // if (skip) {
          //   await redis.hmset(trip_key, { last_res_time: new Date() })
          //   return
          // }

          // 车找人，不主动匹配
          if (trip.type !== enum_type.car) {
            continue
          }
          await redis.hmset(trip_key, { last_time: new Date() })
          logger.debug('\n batchGroup() 批量匹配 开始在群gid "%s" 内匹配行程，tid："%s"', gid, tid)
          const query = {
            time: trip.time,
            sloc: trip.sloc,
            eloc: trip.eloc,
            gid: trip.gid,
            state: enum_state.open,
            type: enum_type.person,
          }
          const ret = await this.find(query, [trip.tid])
          if (ret && ret.length > 0) {
            await redis.hmset(trip_key, { last_res_time: new Date() })
            await redis.sadd(tmp_key, tid)
            // const res = { trip: JSON.stringify(trip), ret: JSON.stringify(ret), type: enum_notify.group }
            // const res_key = 'trip_res#' + tid
            // 无论是平台匹配还是群内匹配，统一进入 `trip_res#{tid}` 系列哈希
            // await redis.hmset(res_key, res)
            // await redis.sadd('trip_res', res_key)
            await this.makeResMsg(trip, ret)
              .catch(e => {
                logger.error(e)
              })
          }

        }
        await redis.del(tmp_key)
      }
    }

    /**
     * 组装在微信上回复的内容
     * 
     * @param {any} trip 
     * @param {any} ret 
     * @memberof TripService
     */

    async makeResMsg(trip, ret) {
      const { service, ctx, logger } = this
      if (!trip || !ret) {
        return
      }
      let i = 0
      const time = ctx.helper.moment(new Date(trip.time)).calendar()
      const isCar = trip.type === enum_type.car
      const data = {
        // topic,
        // alias,
        // msg
      }
      logger.debug('\n makeResMsg() 准备组装匹配回复, 源行程信息: \n%s,\n匹配结果:\n%s\n\n', JSON.stringify(trip), JSON.stringify(ret))
      if (trip.gid) {
        const group = await service.group.getGroup(trip.gid)
        data.topic = group.name || null
      }
      const u = await service.user.getUser(trip.uid)
      data.alias = u.wx_alias || ''
      if (!data.topic && !data.alias) {
        logger.debug('\n makeResMsg() 源行程信息缺失topic或alias，不发送')
        return
      }
      const s1 = String.fromCharCode(8199)
      const s2 = String.fromCharCode(8198)
      let msg = ''
      if (isCar) {
        msg += `【车找人】行程匹配结果：\n时间:${time}\n起点:${trip.sloc.name}\n终点:${trip.eloc.name}\n---------\n`
        for (const r of ret) {
          const u = await service.user.getUser(r.uid)
          logger.debug('\n makeResMsg() 车找人，得到用户信息: \n%s\n', JSON.stringify(u))
          if (u && u.wx_alias) {
            // NOTE:回复时At用户
            // msg += s1 + (u.name || u.wx_nickname || u.wx_alias) + s2 + ' \n'
            msg += s1 + (u.wx_alias) + s2 + ' \n'
            i++
          }
          if (i >= 20) {
            break
          }
        }
        msg += '---------\n加入行程后请回复"完成"后，取消行程请回复"取消"。\n回复后将不再继续进行匹配，如已回复请忽略本条信息。'
        msg += '\n\n使用借螃蟹拼车平台可获得更多匹配结果: ' + await service.url.batchPage()
      } else {
        // 人找车不在群内提示
        data.topic = ''
        msg += `【人找车】行程匹配结果：\n时间: ${time}\n起点: ${trip.sloc.name}\n终点: ${trip.eloc.name}\n---------\n进群口令      |      用户\n`
        // console.log('------------ 要开始进入 ret 的for循环')
        // console.log(ret)
        for (const r of ret) {
          // console.log('已经进入for循环')
          const u = await service.user.getUser(r.uid)
          logger.debug('\n makeResMsg() 人找车，得到用户信息: \n%s\n', JSON.stringify(u))
          if (u && u.wx_alias) {
            const gid = await service.group.getUserGroup(r.uid)
            // logger.debug('\n获取到对应群gid：\n%s\n', JSON.stringify(gid))
            let gkey = ''
            if (gid) {
              const g = await service.group.getGroup(gid)
              // logger.debug('\n获取到对应群信息：\n%s\n', JSON.stringify(g))
              gkey = g.key
            }
            if (gkey) {
              // NOTE:回复时At用户
              msg += (gkey || '暂无口令') + ' | ' + (u.name || u.wx_nickname || u.wx_alias) + '\n'
              // msg += gkey + ' | ' + s1 + (u.name || u.wx_nickname || u.wx_alias) + s2 + '\n'
              i++
            }
          }
          if (i >= 10) {
            break
          }
        }
        msg += '---------\n输入口令或点击下方链接，选择加入行程。加入行程后您的行程将自动标记为完成。'
        msg += '\n如希望取消行程请回复"取消"。\n行程完成或取消后不再继续进行匹配，如已回复请忽略本条信息。'
        msg += '\n\n进入借螃蟹拼车平台可查看更完整的匹配信息: ' + await service.url.batchPage() + '?tid=' + trip.tid
      }
      if (i < 1) {
        logger.debug('\n makeResMsg() 由于循环次数i<1，将要中断组装，已组装的信息msg:\n%s\n', msg)
        return
      }
      data.msg = msg
      logger.debug('\n makeResMsg() 组装后的信息:\n%s\n\n', JSON.stringify(data))
      const id = ctx.helper.uuid()
      const key = 'push_msg#' + id

      logger.debug('\n makeResMsg() 信息推送任务id: %s', id)
      // 信息设置为30分钟过期
      await redis.hmset(key, data)
      await redis.expire(key, 30 * 60)
      await redis.sadd('push_msg', id)
    }

    /**
     * 计算两个坐标间距离
     * 
     * @param {any} a 
     * @param {any} b 
     * @returns 
     * @memberof TripService
     */

    async getGeoDist(a, b) {
      const { ctx } = this
      const key = 'tmp_geo#' + ctx.helper.uuid()
      let geo = []
      if (typeof a === 'array') {
        a = a.splice(0, 2)
      } else if (a && a.coordinates) {
        a = a.coordinates
      } else {
        return false
      }
      if (typeof b === 'array') {
        b = b.splice(0, 2)
      } else if (b && b.coordinates) {
        b = b.coordinates
      } else {
        return false
      }
      geo = geo.concat([a, 'a', b, 'b'])
      await redis.geoadd(key, geo)
      // 使用redis计算两点之间的距离
      const dist = await redis.geodist(key, 'a', 'b', 'km')
      await redis.del(key)
      return dist
    }


    /**
     * 清除匹配超时的行程
     * 
     * @returns 
     * @memberof TripService
     */

    async cleanTimeout() {
      const { logger, ctx } = this
      logger.debug('\n cleanTimeout() 开始执行')
      const ret = await model.Trip.update({
        state: enum_state.open,
        close_time: {
          $lt: new Date(),
        },
      }, {
        $set: {
          state: enum_state.timeout,
          cleanTimeout: true,
        },
      }, {
        multi: true,
      })
      logger.debug('\n cleanTimeout() 执行更新超时行程，结果: %s', JSON.stringify(ret))
      if (!ret) {
        return
      }
      const count = ret.nModified
      // console.log(ret)
      // console.log(typeof ret)
      // logger.debug('\n cleanTimeout() 执行更新超时行程，结果: %s',ret)
      // FIXME: 这里存在问题，设置为超时后，应进行清理或其他处理。否则会越积越多
      // const list = await model.Trip.find({ cleanTimeout: true })
      // for (const trip of list) {
      //   trip.tid = trip._id + ''
      //   if (trip.type === enum_type.car) {
      //     trip.state = enum_state.canceled
      //     logger.debug('\n cleanTimeout() 得到超时行程：%s', trip.tid)

      //     // await model.TripLog.create(trip)
      //   }
      //   // TODO:行程匹配超时通知？
      //   await redis.del('trip#' + trip._id)
      //   await redis.srem('group_trip#' + trip.gid, trip.tid)
      //   // 进入行程超时通知队列 （取消，不通知）
      //   await redis.sadd('trip_timeout', {
      //     uid: trip.uid + '',
      //     tid: trip.tid,
      //     time: trip.time,
      //     close_time: trip.close_time,
      //   })
      // }
      // debug
      logger.debug('\n cleanTimeout() ret count: ' + (ret.nModified || 0))
      return ret.nModified || 0
    }

    /**
     * 查找匹配的行程
     * 
     * @param {any} data 查询匹配条件
     * {
     *   time: Number,
     *   sloc: {
     *     type: "Point",
     *     coordinates: [12.123456, 13.134578]
     *   },
     *   eloc: {
     *     type: "Point",
     *     coordinates: [12.123456, 13.134578]
     *   },
     *   gid: ''  //可选，群id
     * }
     * 如果需要仅在指定群搜索，则提供gid
     * @param {string[]} skip_tip 跳过匹配的行程id列表
     * @returns [Trip]
     * @memberof TripService
     */

    async find(data, skip) {
      const { logger, ctx } = this
      const query = {
        // type: data.type,
        // uid: data.uid,
        // gid: data.gid,
      }
      if (data.time) {
        query.time = {
          $gte: ctx.helper.addTime(data.time, -diff_time),
          $lte: ctx.helper.addTime(data.time, diff_time),
        }
      } else {
        query.time = {
          $gte: new Date(),
        }
      }
      // if (!sloc.coordinates || !eloc.coordinates) {
      //   return false
      // }
      // console.log(data)
      if (data.sloc) {
        const sloc = ctx.helper.convertLoc(data.sloc)
        // logger.debug('\n find() 中转换前的sloc:\n%s\n转换后的sloc: \n%s\n', JSON.stringify(data.sloc), JSON.stringify(sloc))
        if (sloc.coordinates && Array.isArray(sloc.coordinates) && sloc.coordinates.length > 0) {
          query.sloc = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: sloc.coordinates,
              },
              $maxDistance: loc_near, // 米数
            },
            // spherical: true,
          }
        }
        // logger.debug('\n find() 加入了sloc查询条件: \n%s\n', JSON.stringify(query))
      }
      if (data.eloc) {
        const eloc = ctx.helper.convertLoc(data.eloc)
        if (eloc.coordinates && Array.isArray(eloc.coordinates) && eloc.coordinates.length > 0) {
          query.eloc = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: eloc.coordinates,
              },
              $maxDistance: loc_near, // 米数
            },
            // spherical: true,
          }
        }
      }
      if (data.type) {
        query.type = data.type
      }
      if (data.uid) {
        query.uid = data.uid
      }
      // 添加过滤的行程列表
      if (skip && Array.isArray(skip)) {
        const list = new Set()
        skip.forEach(tid => {
          if (tid && typeof tid === 'string') {
            list.add(tid)
          }
        })
        if (list.size > 0) {
          query._id = {
            $nin: skip,
          }
        }
      }
      if (data.gid) {
        query.gid = data.gid
        // 如果是群内匹配，且没有指定type，则不使用type条件
        if (!data.type) {
          delete query.type
        }
      }
      query.state = data.state || enum_state.open

      logger.debug('\n find() 搜索条件: \n%s\n', JSON.stringify(query))
      let ret = []
      if (query.sloc && query.eloc) {
        const query1 = Object.assign({}, query)
        const query2 = Object.assign({}, query)
        delete query1.sloc
        delete query2.eloc

        const ret1 = await model.Trip.find(query1, null, { limit: limit.find, sort: { dist: 1, time: 1 } })

        logger.debug('\n\n find() 使用终点进行查询:')
        // console.log(ret1)
        if (ret1 && ret1.length > 0) {
          const list = new Set()
          ret1.forEach(item => {
            // 注意这个item.tid是object类型，需要转成字符串
            const tid = item.tid + ''
            // logger.debug('\n添加 %s', tid)
            // console.log(tid)
            list.add(tid)
          })

          const ret2 = await model.Trip.find(query2, null, { limit: limit.find, sort: { dist: 1, time: 1 } })
          logger.debug('\n\n find() 使用起点进行查询:')
          // console.log(ret2)

          // logger.debug('\n---------------')
          // logger.debug('\n终点数组:')
          // console.log(list.keys())
          ret2.forEach(item => {
            const tid = item.tid + ''
            if (list.has(tid)) {
              // logger.debug('\n已有 %s', tid)
              ret.push(item)
            }
          })
          logger.debug('\n find() 合并结果查询结果: %s 条', ret.length)
          // console.log(ret)
          // logger.debug('\n')
        }
      } else {
        ret = await model.Trip.find(query, null, { limit: limit.find, sort: { dist: 1, time: 1 } })
      }

      // debug
      // logger.debug('\nTripService.find() ret: ' + JSON.stringify(ret))
      return ret
    }


    /**
     * 查询历史匹配记录 #司机
     * 
     * 返回数量有限制
     * 
     * @param {any} data 
     * @returns 
     * @memberof TripService
     */

    async findLog(data) {
      const { logger } = this
      // const ret = await model.TripLog.find({
      const query = {
        // _id: data.id,
        // uid: data.uid,
        // type: data.type,
        // // 默认只查找成功匹配的记录
        // state: data.state,
        uid: data.uid,
        // 不显示标记为隐藏（即用户提交了删除历史行程操作）
        hide: { $ne: true },
      }
      // if (uid) {
      //   query.uid = uid
      // }
      logger.debug('\n findLog() 进入数据:\n%s\n', JSON.stringify(data))


      logger.debug('\n findLog() 查询使用条件:\n%s\n', JSON.stringify(query))

      const ret = await model.Trip.find(query, null, { limit: limit.log, sort: { createTime: -1 } })

      logger.debug('\n findLog() 查询使用条件:\n%s\n结果: \n%s\n', JSON.stringify(query), JSON.stringify(ret))

      // debug
      return ret || false
    }


    /**
     * 获取行程信息
     * 
     * @param {any} tid 行程id
     * @param {boolean} full 是否获取完整信息
     * @returns {object}
     * @memberof TripService
     */

    async getTrip(tid, full) {
      const { service, logger } = this
      const key = 'trip#' + tid
      const exist = await redis.exists(key)
      let trip
      if (!full && exist) {
        trip = await redis.hgetall(key)
        trip.sloc = JSON.parse(trip.sloc)
        trip.eloc = JSON.parse(trip.eloc)
        return trip
      }
      trip = await model.Trip.findById(tid)
        .catch(e => {
          logger.error(new Error(e.message))
        })
      if (!trip) {
        return false
      }
      trip = trip.toObject()
      const user = await this.service.user.getUser(trip.uid)
      const cache_data = {
        tid: trip.tid,
        type: trip.type,
        time: trip.time,
        close_time: trip.close_time,
        state: trip.state,
        sloc: JSON.stringify(trip.sloc),
        eloc: JSON.stringify(trip.eloc),
        dist: trip.dist,
        uid: trip.uid,
        gid: trip.gid,
        ctid: trip.ctid || null,
        formal: user.formal,
        // notify: '',
        last_time: 0,
        last_res_time: 0,
        last_res_by_time: 0,
      }
      // 通知方式
      // if (trip.gid) {
      //   // 群内通知
      //   cache_data.notify = enum_notify.group
      // } else {
      //   // 单聊通知
      //   cache_data.notify = enum_notify.alone
      // }
      await redis.hmset(key, cache_data)
      if (cache_data.state !== enum_state.open) {
        // 非开放状态的行程，只缓存10分钟
        await redis.expire(key, 10 * 60)
      }
      if (!full) {
        trip = cache_data
        trip.sloc = JSON.parse(cache_data.sloc)
        trip.eloc = JSON.parse(cache_data.eloc)
      }
      this.logger.debug('\n getTrip() 即将返回：%s', JSON.stringify(trip))
      return trip
    }

    /**
     * 关闭行程
     * 
     * @param {any} tid 行程id
     * @param {boolean} done 是完成行程还是取消行程？
     * @returns 
     * @memberof TripService
     */

    async closeTrip(tid, done) {
      const { logger } = this
      if (!tid) {
        return false
      }
      const trip = await model.Trip.findOneAndUpdate({
        _id: tid, state: enum_state.open,
      }, {
        $set: {
          state: done ? enum_state.done : enum_state.canceled,
        },
      }, { new: true })
      logger.debug('\ncloseTrip() 关闭行程tid "%s" 后返回:\n%s\n', tid, JSON.stringify(trip))

      if (!done && trip.ctid) {
        // 关闭
        await model.CycleTrip.findOneAndUpdate({
          _id: trip.ctid + '',
          enabled: true,
        }, {
          $set: { enabled: false },
        })
        logger.debug('\ncloseTrip() 关闭周期行程ctid "%s"', trip.ctid + '')
      }
      await redis.del('trip#' + tid)
      if (!trip) {
        return false
      }
      await redis.srem('group_trip#' + trip.gid, tid)
      return true
    }

    /**
     * 删除行程（对用户隐藏）
     * 
     * @param {any} tid 
     * @returns 
     * @memberof TripService
     */

    async delTrip(tid) {
      const { logger } = this
      if (!tid) {
        return false
      }
      const trip = await model.Trip.findOneAndUpdate({
        _id: tid, state: { $ne: enum_state.open },
      }, {
        $set: {
          hide: true,
        },
      }, { new: true })
      logger.debug('\n delTrip() 隐藏行程tid "%s" 后返回:\n%s\n', tid, JSON.stringify(trip))
      await redis.del('trip#' + tid)
      if (!trip) {
        return false
      }
      await redis.srem('group_trip#' + trip.gid, tid)
      return true
    }


    /**
     * 加入行程
     * 
     * @param {any} data 
     * @returns 
     * @memberof TripService
     */

    async joinTrip(data) {
      const { service, logger, config } = this
      const trip = await this.getTrip(data.tid)
      const user = await service.user.getUser(data.uid)
      const ret = {
        // msg: '',
        closeMyTrip: false,
      }
      logger.debug('\n joinTrip() 获取到行程信息为: %s', JSON.stringify(trip))
      if (!trip || trip.state !== enum_state.open) {
        ret.msg = '未找到行程信息或此行程已关闭！'
        return ret
      }
      if (data.uid === trip.uid) {
        ret.msg = '不能选择加入自己发布的行程哦！'
        return ret
      }
      const gid = await service.group.getUserGroup(trip.uid)
      if (!gid) {
        logger.warn('\n joinTrip() 未能获取到用户group gid, 用户uid: %s', trip.uid)
        ret.msg = '未找到此行程对应的出行群信息！'
        return ret
      }
      const group = await service.group.getGroup(gid)
      logger.debug('\n joinTrip() 获取到group信息为: %s', JSON.stringify(group))
      const tmp = {
        command: 'add_member',
        topic: group.name,
        members: [user.wx_alias],
        say: '已经进入行程',
      }
      // 乘客进群数量限制。项目一期取消
      // if (group.type === 'driver') {
      //   const key = 'join_group_limit'
      //   if (await redis.hget(key, user.uid) > config.trip.user_join_group_limit) {
      //     logger.debug('\n 用户uid "%s" 达到每日加入司机群数量限制，取消进群操作')
      //     tmp = {
      //       topic: group.name,
      //       alias: user.wx_alias,
      //       msg: '抱歉！您本日加入行程群的数量已经达到限制值，您本次进群操作被取消。',
      //     }
      //     return await service.bot.rev_msg(tmp)
      //   }
      // }
      if (!await service.bot.rev_command(tmp)) {
        ret.msg = '系统错误：提交进群指令失败！'
      } else {
        ret.closeMyTrip = true
      }

      return ret
    }
  }
  return TripService
}
