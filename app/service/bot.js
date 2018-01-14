'use strict'

const WsEvent = {
  // 服务端回复使用以下事件
  rev_auth: 'rev_auth',
  rev_msg: 'rev_msg',
  rev_data: 'rev_data',
  rev_command: 'rev_command',
}
const WsRevCommandType = {
  restart_bot: 'restart_bot',
  resume_bot: 'resume_bot',
  pause_bot: 'pause_bot',
  // 刷新数据
  create_room: 'create_room',
  set_alias: 'set_alias',
  set_topic: 'set_topic',
  add_member: 'add_member',
}

// 给bot同步数据
const WsRevDataType = {
  config: 'config',
  room: 'room',
}

const WsRevMsgType = {
  rev_bind: 'rev_bind',
  pub_trip: 'pub_trip',
  close_trip: 'close_trip',
  finish_trip: 'finish_trip',
  trip_result: 'trip_result',
  trip_timeout: 'trip_timeout',
  warn_trip: 'warn_trip',
  // user_trip : 'user_trip',
}

module.exports = app => {
  const { redis, model } = app

  const expire_time = 10 * 60
  class BotService extends app.Service {

    /**
     * Ws连接身份验证，返回是否允许运行
     * 
     * @param {any} data 
     * @returns 
     * @memberof BotService
     */

    async auth(data) {
      const { logger, service, config } = this
      // data = {
      //   uuid: string,
      //   bot_name: string,
      //   nickname: string,
      //   allow_run: boolean,
      //   socket_id:string
      // }
      const key = 'bot_state#' + data.uuid
      let s = await redis.hgetall(key)
      const ret = {
        allow_run: false,
      }
      // 先从redis中读取已经缓存的bot数据，然后对比是否与本次的uuid一致
      // 否则清空数据，然后从配置中读取此bot配置，然后决定是否可以运行
      // FIXME: bot二次重连时，会授权失败导致不能继续服务
      if (!s || s.bot_name !== data.bot_name) {
        s = {}
        s.bot_name = ''
      }
      // const bot = await service.config.getBot(data.bot_name)
      const bot = config.bots[data.bot_name]

      if (bot && bot.enabled) {
        s.bot_name = data.bot_name
        ret.allow_run = true
      }

      // NOTE: 调试，默认允许运行
      // ret.allow_run = true
      if (s.bot_name) {
        s.socket_id = data.socket_id
        // 运行状态有效期10分钟
        s.last_time = new Date()
        await redis.hmset(key, s)
        // 由ws接收report时间来维持存活
        await redis.expire(key, expire_time)
      } else {
        await redis.del(key)
      }
      return ret
    }

    /**
     * 返回bot是否可以服务
     * 
     * NOTE: 暂时未用，考虑用于解决bot不重启恢复运行。
     * 即在接收bot报告状态时检查并设置其运行状态
     * 
     * @param {any} bot_name 
     * @returns 
     * @memberof BotService
     */

    async isAllowRun(bot_name) {
      const { service, config } = this
      // const bot = await service.config.getBot(bot_name)
      const bot = config.bots[bot_name]
      return bot && bot.enabled
    }


    /**
     * 处理上报的bot运行状态，维持redis中记录和socket记录有效期
     * 
     * @param {any} data 
     * @memberof BotService
     */

    async report(data) {
      const { logger, service } = this
      // data = {
      // bot_login,
      // bot_running,
      // bot_usable,
      // uuid,
      // socket_id: this.socket.id,
      // }
      if (!data.uuid) {
        return
      }
      const key = 'bot_state#' + data.uuid
      const s = await redis.hgetall(key)
      if (s) {
        s.login = data.bot_login || false
        s.running = data.bot_running || false
        s.usable = data.bot_usable || false
        s.last_time = new Date()
        await redis.hmset(key, s)
        await redis.expire(key, expire_time)
        await service.ws.keepWs(data.socket_id)
      }
    }

    /**
     * 获取bot列表
     * 
     * @returns 
     * @memberof BotService
     */

    async getBots() {
      const { logger, service } = this
      const keys = await redis.keys('bot_state#*')
      // logger.debug('\n获取bot列表 keys: \n%s', JSON.stringify(keys))
      const bots = []
      for (const key of keys) {
        const bot = await redis.hgetall(key)
        // logger.debug('\n获取一个bot数据: \n%s', JSON.stringify(bot))
        if (bot) {
          bots.push(bot)
        }
      }
      // logger.debug('\n获取bot列表 bots: \n%s', JSON.stringify(bots))
      return bots
    }

    /**
     * 获取一个运行的bot socket对象
     * 
     * @returns 
     * @memberof BotService
     */

    async getOneBot() {
      const bots = await this.getBots()
      // this.logger.debug('\n getOneBot() 尝试获取一个可操作的bot，列表：\n%s\n', JSON.stringify(bots))
      for (const bot of bots) {
        if (bot.running && bot.login) {
          // this.logger.debug('\n getOneBot() 找到一个可操作的bot：\n%s\n', JSON.stringify(bot))
          const ws = await this.service.ws.getWs(bot.socket_id)
          if (ws) {
            return ws
          }
        }
      }
      // this.logger.debug('\n getOneBot() 未能找到一个可操作的bot')
      return false
    }

    // async handle(event, data) {

    // }

    async send(event, data, filter) {
      const { service, logger } = this
      const ws = await this.getOneBot()
      // const ws = await service.ws.getWs(bot.socket_id)
      // 修复无法找到可用bot的ws连接问题
      // TODO:增加过滤
      // logger.debug('\nws.emit: %s', JSON.stringify(ws.emit))
      // logger.debug('\nws: %s', JSON.stringify(ws))

      // logger.debug('\n得到的ws内容是： \n%s\n', ws)
      if (ws) {
        ws.emit(event, data)
        return true
      }
      logger.warn('\n send() 未能获得有效socket')

      return false
    }

    /**
     * 向bot下发信息
     * 
     * @param {any} data 
     * @returns 
     * @memberof BotService
     */

    async rev_msg(data) {
      // const data = {
      //   topic: '',//房间名称
      //   alias: '',//好友alias
      //   msg: '',//信息内容
      // }
      this.logger.debug('\n rev_msg() 向bot发送信息：\n%s\n', JSON.stringify(data))
      return await this.send(WsEvent.rev_msg, data)
    }

    /**
     * 向bot下发指令
     * 
     * @param {any} data 
     * @returns 
     * @memberof BotService
     */

    async rev_command(data) {
      // const data = {
      //   command: '',//指令

      //   //仅限创建房间的指令 WsRevCommandType.create_room
      //   list: [{
      //     taskId: '',//任务id
      //     topic: '',//房间名称
      //     type: '',//房间类型
      //     members: ['user_alias'],//成员列表
      //   }]

      //   //仅限设置联系人 set_alias
      //   alias:'',
      //   newAlias:'',

      //   //仅限设置房间名称 set_topic
      //   topic:'',
      //   newTopic:'',

      //   //将房间加入指定成员 add_member
      //   topic: string,
      //   members: [string],
      //   say: string,

      // }
      this.logger.debug('\n rev_command() 向bot发送指令：%s', JSON.stringify(data))
      return await this.send(WsEvent.rev_command, data)
    }


    /**
     * 给bot发送数据更新
     * 
     * 主要数据更新看 io.controller.get_data 中
     */

    async rev_data(data) {
      // const data = {
      //   type: '', //发送的数据类型 WsRevDataType

      //   //限更新房间信息 WsRevDataType.room
      //   room: [{
      //     topic: '',//群名称
      //     gid: '',//群gid
      //     type: '',//群类型 driver司机群
      //   }],

      //   //限更新配置信息
      //   config: {
      //     locker: {
      //       limit_alias: 10 * 1000,   //设置用户备注alias间隔毫秒数
      //       limit_msg: 10 * 1000,   //发送信息间隔毫秒数
      //       limit_create_room: 10 * 1000,   //创建房间间隔毫秒数
      //     },
      //     whiteUserList: [],   //用户白名单
      //     botAliasList: [],   //微信bot列表
      //   }
      // }
      this.logger.debug('\n rev_data() 向bot发送更新数据：%s', JSON.stringify(data))
      return await this.send(WsEvent.rev_data, data)
    }


    async login(data) {
      const { logger, service, config } = this
      const key = 'bot_state#' + data.uuid
      const s = await redis.hgetall(key)
      // const bot = await service.config.getBot(s.bot_name)
      const bot = config.bots[s.bot_name]
      // DEBUG: 调试，允许执行
      // return { allow: true }
      // logger.debug('\nbot data: \n%s \nredis data: \n%s \nbot conf: \n%s \n\n', JSON.stringify(data), JSON.stringify(s), JSON.stringify(bot))
      // logger.debug('\nbot conf: %s', JSON.stringify(bot))
      return {
        allow: (bot && bot.enabled) || false,
      }
    }


    /**
     * 返回用户信息
     * 
     * 如果在系统中没有用户的记录，将会创建用户记录
     * 
     * @param {any} data 
     * @returns 
     * @memberof BotService
     */

    async getUserInfo(data) {
      const { logger, service, ctx } = this
      let uid,
        userInfo,
        groupId
      // // 用于使用多种方式来识别一个用户，data来自ws
      // const data = {
      //   key: key,
      //   alias?: string,
      //   nickname:
      //   userId: content.id,
      //   guest: boolean,  //如果是需要
      // }
      logger.debug('\n getUserInfo() 获取用户 "%s" 的信息： \n%s', data.nickname, JSON.stringify(data))
      if (!data.alias && !data.nickname) {
        return false
      }
      if (!data.alias) {
        // 使用bot端的userId来生成临时alias，即 tmp#@xxxx
        data.alias = 'tmp#' + data.userId
      }
      uid = await service.user.getUserByAlias(data.alias)
      if (data.topic) {
        groupId = await service.group.getGroupId(data.topic)
        if (!uid && groupId) {
          // 如果凭临时alias找不到，则尝试用群名称+昵称+性别 来复合查询，并更新临时alias。
          // TODO:存在bug，如果一个群内有两个相同昵称且未认证的用户，会被认为是一个用户
          userInfo = await model.User.findOneAndUpdate({
            wx_alias: /^tmp#/i, wx_nickname: data.nickname,
            gid: groupId, gender: data.gender,
          }, { wx_alias: data.alias }, { new: true })
          logger.debug('\n getUserInfo() 使用综合判断更新用户alias记录，返回: \n%s\n', JSON.stringify(userInfo))
          if (userInfo) {
            uid = userInfo._id + ''
          }
        }
      }
      logger.debug('\n getUserInfo() 获得用户uid: "%s" 信息 data: \n%s\n ', uid, JSON.stringify(data))
      if (!uid && !userInfo) {
        // console.log('要创建用户')
        // console.log(data)

        // NOTE: 只在绑定用户时创建用户
        // 这里返回一个新的alias，在 io/bind中会判断，然后让bot端设置新alias
        const alias = /^tmp#/i.test(data.alias) ? ctx.helper.uuid(16) : data.alias
        userInfo = await service.user.create({
          wx_alias: alias,
          wx_nickname: data.nickname,
          gender: data.gender || 0,
          gid: groupId || null,
        })
        // 增加一个新增用户标志，用来作为新用户增加信用值
        userInfo.newUser = true
        logger.debug('\n getUserInfo() 创建用户：%s', JSON.stringify(userInfo))
      } else {
        // console.log('要查找用户')
        userInfo = await service.user.getUser(uid)
        logger.debug('\n getUserInfo() 找到用户：%s', JSON.stringify(userInfo))
      }
      if (userInfo.wx_alias !== data.alias) {
        // 如果需要改alias，将临时alias和新alias都传递
        userInfo.newAlias = userInfo.wx_alias
        userInfo.oldAlias = data.alias
      }
      logger.debug('\n getUserInfo() 返回用户信息：\n%s', JSON.stringify(userInfo))
      return userInfo
    }


    /**
     * 返回群信息
     * 
     * 如果没有找到群，则会默认作为大群创建群记录
     * 
     * @param {any} data 
     * @returns 
     * @memberof BotService
     */

    async getGroupInfo(data) {
      const { logger, service } = this
      let groupId,
        groupInfo,
        needMap

      if (!data.topic) {
        return false
      }
      groupId = await service.group.getGroupId(data.topic)
      if (!groupId && data.roomId) {
        groupId = await service.group.getGroupIdByRoomId(data.roomId)
      }
      if (data.gid && !groupId) {
        groupInfo = await service.group.getGroup(data.gid)
      }
      if (!groupId && !groupInfo) {
        groupInfo = await service.group.create({
          name: data.topic,
          type: 'big',
          member_num: data.memberNum || 0,
        })
      } else {
        groupInfo = await service.group.getGroup(groupId)
      }
      if (groupInfo && !await service.group.getGroupIdByRoomId(data.roomId) && data.roomId) {
        await service.group.setRoomId(groupInfo.gid, data.roomId)
      }
      return groupInfo
    }


    /**
     * 绑定帐户
     * 
     * @param {any} data 
     * @returns 
     * @memberof BotService
     */

    async bind(data) {
      const { logger, ctx, service } = this
      let userId
      const ret = {
        bindRet: false,
        msg: '',
        alias: data.alias,
      }
      logger.info(`\n bind() 处理绑定： 用户alias:'${data.alias}' 绑定码：'${data.key}'`)
      // console.log(data)
      const bindData = await service.bind.get(data.key)
      const userInfo = await this.getUserInfo(data)
      if (!userInfo) {
        logger.warn('\n bind() 未能获取用户信息！')
        ret.msg = '服务器异常！'
      }
      if (bindData && bindData.openid) {
        if (userInfo && userInfo.wx_openid) {
          const url = await service.url.batchPage()
          ret.msg = '绑定失败：已经绑定过帐户，不能再次绑定！\n直接进入平台： ' + url
        } else {
          const uid = await service.user.getUserByOpenid(bindData.openid)
          if (!uid) {
            // console.log('开始更新')
            // console.log(userInfo)
            // console.log(bindData)
            logger.debug(`\n bind() 获取openid#'${bindData.openid}' 的bindData为: \n%s\n`, JSON.stringify(bindData))
            const tmpData = {
              wx_openid: bindData.openid,
              formal: true, // 改为完成待补充信息后再设置
            }

            // NOTE: 绑定成功后，处理邀请码，给邀请人发奖励
            if (bindData.inviteCode) {
              const iUser = await service.user.getUser(bindData.inviteCode)
              logger.debug(`\n bind() 获取邀请码#'${bindData.inviteCode}' 的用户信息为: \n%s\n`, JSON.stringify(iUser))
              if (iUser) {
                // 给用户增加邀请人uid
                tmpData.inviteFromUid = iUser.uid
                const data = {
                  uid: userInfo.uid,
                  name: userInfo.name || userInfo.wx_nickname || '未知名称',
                }
                await service.user.addCredit({
                  uid: iUser.uid,
                  type: 'invite',
                  value: 5,
                  memo: '邀请奖励',
                  data,
                })
              }
            }
            await service.user.update(userInfo.uid, tmpData)
            const url = await service.url.infoPage()
            ret.bindRet = true
            ret.msg = '绑定成功！\n请打开链接填写信息以完成注册！\n链接: ' + url

            logger.debug(`\n bind()绑定成功： 用户#'${userInfo.uid}' 使用绑定码：${data.key} 成功`)

            // NOTE: 注册成功后获得信用值
            await service.user.addCredit({
              uid: userInfo.uid,
              type: 'sys',
              value: 50,
              memo: '注册赠送',
            })

          } else {
            // TODO: 以后需要考虑两个账户合并的情况
            logger.warn(`\n bind() 绑定异常： 用户#'${userInfo.uid}' 试图绑定 用户#'${uid}' 的 openid#'${bindData.openid}'`)
            ret.msg = '绑定失败！'
          }
        }
      } else {
        logger.warn(`\n  bind() 绑定失败： 用户#'${userInfo.uid}' 使用绑定码：${data.key} 无效`)
        const url = await service.url.bindPage(true)
        ret.msg = '绑定失败：无效验证码！\n打开页面获取验证码，链接： ' + url
      }
      if (userInfo.newAlias) {
        // 传递设置新alias
        ret.newAlias = userInfo.newAlias
        ret.oldAlias = userInfo.oldAlias
      }
      return ret
    }

    /**
     * 关闭行程
     * 
     * @param {any} data 
     * @param {any} done 完成行程或取消行程？
     * @returns 
     * @memberof BotService
     */

    async closeTrip(data) {
      const { logger, service } = this
      let userId
      const ret = {
        msg: '',
        alias: data.alias,
        topic: data.topic,
      }
      await this.getGroupInfo(data)
      const userInfo = await this.getUserInfo(data)
      if (!userInfo || !userInfo.uid) {
        logger.warn('\n closeTrip() 未能获取用户信息！')
        ret.msg = '没有有效的行程可以操作！'
        return ret
      }
      const query = {
        uid: userInfo.uid,
        state: 'open',
      }
      const list = await model.Trip.find(query)
      logger.debug('\n closeTrip() 关闭行程操作，查询用户uid "%s" 未关闭行程结果：\n%s\n', userInfo.uid, JSON.stringify(list))
      if (!list || list.length < 1) {
        ret.msg = '未发现有效的行程！\n有可能您的行程已经超时并自动关闭了。'
      } else {
        for (const trip of list) {
          logger.debug('\n closeTrip() 关闭行程操作，关闭用户uid "%s" 未关闭行程tid：%s', userInfo.uid, trip.tid)
          await service.trip.closeTrip(trip.tid, data.done)
        }
        ret.msg = data.done ? '行程已完成！' : '行程已取消！'
      }
      return ret
    }

    /**
     * 用户要使用群key进入群
     * 
     * @param {any} data 
     * @memberof BotService
     */

    /**
     * 用户使用群key加入微信群
     * 
     * @param {any} { alias, key } 
     * @returns 
     * @memberof BotService
     */

    async joinGroup({ alias, key }) {
      // data = {
      //   key,
      //   alias,
      // }
      const { service, logger } = this
      if (!alias || !key) {
        return false
      }
      const user = await service.user.getUserByAlias(alias)
      if (!user) {
        return false
      }
      const group = await model.Group.findOne({ key })
      logger.debug('\n joinGroup() 使用群key "%s" 查找到群信息如下：\n%s\n', key, JSON.stringify(group))
      if (group && group.name) {
        // 这里将用户加入此群
        const tmp = {
          command: 'add_member',
          topic: group.name,
          members: [alias],
          say: '已经进入本群',
        }
        // TODO: 复制一份行程
        await this.rev_command(tmp)
        await this.closeTrip({ alias, done: true })
        return { topic: group.name }
      }
      return false
    }

    /**
     * 发布行程
     * 
     * @param {any} { data, type, loc, time } 
     * @returns 
     * @memberof BotService
     */

    async pubTrip({ data, type, loc, time, min_seat, max_seat }) {
      // type: car/person /loc/pub
      // 其中 car/person 表明车找人/人找车，附加time参数表示时间
      // loc表示为地理坐标，附加loc参数
      // pub表示触发发布
      const { logger, service, ctx } = this
      // const key = 'wait_bot_trip#' // {uid}@{gid}
      let userId
      const ret = {
        alias: data.alias,
        topic: data.topic || '',
      }
      if (!type && !data.topic) {
        return false
      }
      const groupInfo = await this.getGroupInfo(data)
      const userInfo = await this.getUserInfo(data)
      if (!userInfo) {
        logger.warn('\n pubTrip() 未能获取用户信息！')
        ret.msg = '未能获取用户信息！'
        return false
      }
      logger.debug('\n pubTrip() 获得用户信息:\n%s\n\n获得群信息：\n%s\n', JSON.stringify(userInfo), JSON.stringify(groupInfo))

      const trip = await service.trip.find({ uid: userInfo.uid })
      logger.debug('\n pubTrip() 获取到trip: \n%s\n', JSON.stringify(trip))
      if (trip && trip.length > 0) {
        ret.msg = '\n存在仍未关闭的行程，您需要先取消或完成之前的行程，才能发布新的行程哦！\n请发送"取消行程" 或 "完成行程" 来结束之前的行程。'
        return ret
      }
      const key = 'wait_bot_trip#' + userInfo.uid + (groupInfo ? '@' + groupInfo.gid : '')
      logger.debug('\n pubTrip() 准备的key: %s', key)

      let info = await redis.hgetall(key)
      // {
      //   // time,
      //   // sloc,
      //   // eloc,
      //   // type,
      //   // uid,
      //   // source: 'group',
      //   // gid,
      // }

      try {
        info.sloc = info.sloc && JSON.parse(info.sloc) || null
        info.eloc = info.eloc && JSON.parse(info.eloc) || null
      } catch (e) {
        logger.error('\n pubTrip() error:\n%s\n', JSON.stringify(e))
      }
      logger.debug('\n pubTrip() 从redis读取info: \n%s\n', JSON.stringify(info))

      let tid
      switch (type) {
        case 'car':
        case 'person':
          if (!info.uid) {
            info = {
              uid: userInfo.uid,
              gid: groupInfo.gid || '',
              source: 'group',
            }
          }
          info.type = type
          info.time = new Date(time)
          info.min_seat = min_seat || info.min_seat || 1
          info.max_seat = max_seat || info.max_seat || 4
          await redis.hmset(key, info)
          // 3分钟的有效期
          await redis.expire(key, 3 * 60)
          ret.msg = `\n您准备发布新的行程信息:\n类型: ${info.type === 'car' ? '车找人' : '人找车'}\n时间: ${ctx.helper.moment(info.time).calendar()}\n\n请在3分钟内点右下角的加号，分别发送起点与终点的位置信息。\n如信息错误请按格式重新发送行程即可。`

          // logger.debug('\n pubTrip() 组建信息: \n%s\n', JSON.stringify(info))
          // logger.debug('\n pubTrip() 准备回复信息: \n%s\n', JSON.stringify(ret))
          break;

        case 'loc':
          if (!info.type) {
            // 不是有效的待发行程，取消处理
            break
          }
          // logger.debug('\n pubTrip() 收到loc数据，已有数据:\n%s\n', JSON.stringify(info))
          if (!info.sloc) {
            info.sloc = loc
            logger.debug('\n pubTrip() 增加sloc数据:\n%s\n', JSON.stringify(loc))
            await redis.hset(key, 'sloc', JSON.stringify(loc))

            ret.msg = `\n已添加起点为: ${loc.name}\n请发送终点位置信息！`
          } else if (!info.eloc) {
            info.eloc = loc
            logger.debug('\n pubTrip() 增加eloc数据:\n%s\n', JSON.stringify(loc))
            await redis.hset(key, 'eloc', JSON.stringify(loc))

            ret.msg = `\n已添加终点为: ${loc.name}\n如确认无误请发送"发布行程"，如地点错误请发送新的位置，则当前终点将变为起点，新位置将作为终点。`
          } else {
            // 如果起点和终点都已经设置过了，则以上个终点为起点，以新loc为新终点
            await redis.hset(key, 'sloc', JSON.stringify(loc))
            await redis.hset(key, 'eloc', JSON.stringify(loc))

            ret.msg = `\n已更新地点信息。\n当前起点: ${info.eloc.name}\n当前终点: ${loc.name}\n如确认无误请发送"发布行程"，如地点错误请发送新的位置，则当前终点将变为起点，新位置将作为终点。`
          }
          break;
        case 'pub':
          if (!info.type || !info.time) {
            ret.msg = '\n没有有效的待发布行程！\n发布行程格式为：[人找车/车找人]时间\n时间为 哪天hh点mm分 或 hh:mm\n其中哪天仅支持：今天/明天/后天 如为今天可省略不填\n\n例如：[人找车]今天16点30分 或 [车找人]16:30'
            break
          }
          if (!info.sloc) {
            ret.msg = '\n缺少行程起点和终点，请分别发送起点和终点的定位信息！'
            break
          }
          if (!info.eloc) {
            ret.msg = '\n缺少行程终点，请分别终点的定位信息！'
            break
          }
          logger.debug('\n pubTrip() 即将创建行程，使用数据:\n%s\n', JSON.stringify(info))
          tid = await service.trip.create(info)
            .catch(e => {
              logger.error(e)
              ret.msg = '行程发布失败！'
            })
          if (tid) {
            // logger.debug('\n pubTrip() 行程创建完毕,key:\n%s\n', key)
            await redis.del(key)
            // 创建后会自动推送信息
          } else {
            logger.warn('\n pubTrip() 行程创建失败,key:\n%s\n', key)
          }
          break;

        default:
          break;
      }

      // ret.msg = data.done ? '行程已完成！' : '行程已取消！'
      return ret
    }

    /**
     * Bot创建群完毕，将群入库
     * 
     * @param {any} data 
     * @memberof BotService
     */

    async createdGroup(data) {
      // const data = {
      //   topic: '',
      //   taskId: '',
      // }
      const { logger, service } = this
      const key = 'new_group'
      const key2 = 'new_group#' + data.taskId
      const ret = {
        alias: data.alias || '',
        topic: data.topic || '',
      }

      logger.info('\n createdGroup() 收到Bot通知，任务 "%s" - 群 "%s" 已创建完毕', data.taskId, data.topic)

      const tmp = await redis.hgetall(key2)
      if (!tmp || !tmp.name) {
        logger.warn('\n createdGroup() 未能从redis获得群 "%s" 的信息，无法创建群记录!', data.topic)
        return
      }
      logger.debug('\n createdGroup() 从redis得到群信息如下：\n%s\n', JSON.stringify(tmp))

      const info = {
        name: tmp.name,
        type: tmp.type,
        key: tmp.key || '',
        admin: {
          wx_alias: [],
        },
      }
      if (tmp.uid) {
        info.uid = tmp.uid
        info.wx_alias = tmp.wx_alias
      }
      // TODO:后续扩充各类群的自定义设置
      // 如：在redis记录中增加一个字段，通过发布订阅的形式来触发其他通知？
      switch (tmp.type) {
        case 'driver':
          info.admin.wx_alias.push(info.wx_alias)
          break;
        case 'big':
          break;
        case 'service':
          break;
        default:
          break;
      }

      const group = await service.group.create(info)
      if (group) {
        await service.group.ok(group.gid)
        logger.info('\n createdGroup() 群 "%s" 记录保存完毕', tmp.name)
        if (tmp.type === 'driver') {
          const s1 = String.fromCharCode(8199)
          const s2 = String.fromCharCode(8198)
          ret.msg = `本群进群口令为: ${tmp.key || '未设置'}\n管理员为: ${info.wx_alias ? s1 + info.wx_alias + s2 : ''}\n管理员可使用指令：\n踢人: @用户 移出`
        }
      } else {
        logger.error('\n createdGroup() 保存群 "%s" 记录失败！', tmp.name)
      }

      await redis.del(key2)
      await redis.srem('new_group', data.taskId)
      return ret
    }

    /**
     * Bot端群名称改变，更新数据库内记录
     * 
     * @param {any} { oldTopic, newTopic, gid } 
     * @returns 
     * @memberof BotService
     */

    async changeRoomTopic({ oldTopic, newTopic, gid }) {
      const { logger, service } = this
      const key = 'group_name#'
      // const data = {
      //   roomid: '',
      //   newTopic: '',
      //   oldTopic: '',
      //   gid: '',
      // }
      logger.debug('\n changeRoomTopic() 将更新gid "%s" 名称 "%s" 为 "%s"', gid, oldTopic, newTopic)

      if (!gid) {
        gid = await service.group.getGroupId(oldTopic)
      }
      if (!gid) {
        logger.error('\n changeRoomTopic() 没有gid或没有找到群 "%s"', oldTopic)
        return false
      }
      const room = await service.group.getGroup(gid)
      if (!room) {
        logger.error('\n changeRoomTopic() 使用gid "%s" 未能获得群 "%s" 的信息', gid, oldTopic)
        return false
      }
      await service.group.update(gid, { name: newTopic })
      const id = await service.group.getGroupId(newTopic)
      if (!id || id !== gid) {
        logger.error('\n changeRoomTopic() 更新gid "%s" 名称 "%s" 为 "%s" 后，查询gid异常: "%s"', gid, oldTopic, newTopic, id)
      }
    }

    /**
     * 保存微信聊天记录
     * 
     * @param {any} { uid, gid, msg, time } 
     * @memberof BotService
     */

    async saveWxMsg({ uid, gid, msg, time }) {
      const { logger, service } = this
      if (!uid || !msg) {
        throw new Error('参数错误！')
      }
      logger.debug('\n saveWxMsg() 将保存群聊天记录:\n%s\n', JSON.stringify({ uid, gid, msg, time }))
      await model.WxMsg.create({
        uid,
        gid: gid || null,
        msg,
        time: time || new Date(),
      })
        .catch(e => {
          logger.error('\n', e, '\n')
        })
    }

  }
  return BotService
}
