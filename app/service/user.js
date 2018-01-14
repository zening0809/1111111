'use strict'

/**
 * 用户相关业务
 */

// TODO: 状态标识需要改
const enum_state = {
  created: '',
  done: 'done',
  canceled: 'canceled',
}
// 性别
const enum_gender = {
  male: 'male', // 1
  female: 'female', // 2
  unknown: 'unknown', // 0
}


module.exports = app => {
  const config = app.config.trip
  const { model, service } = app
  // 平台行程等候匹配队列
  const redis = app.redis
  // const redis = app.redis.get('trip')
  // 设定用户信息在redis中缓存时间为60秒
  const expire_time = 60

  class UserService extends app.Service {

    /**
     * 创建用户
     * 
     * @param {any} data 
     * @returns 
     * @memberof Userervice
     */

    async create(data) {
      const { logger } = this
      const UserDate = {
        phone: data.phone || '',
        wx_alias: data.wx_alias,
        wx_nickname: data.wx_nickname,
        wx_openid: data.wx_openid || null,
        formal: data.formal || false,
        gid: data.gid,
        // addrs: data.addrs,
        // recent_addrs: data.recent_addrs,
        gender: data.gender,
        // car: data.car,
        // intro: data.intro,
        // tag: data.tag,
        // TODO: 需要实现过滤数据
        // credit: data.credit,
        // cert: data.cert,
      }
      // console.log('现在创建')
      // console.log(UserDate)
      let user = await model.User.create(UserDate)
      if (user) {
        user = user.toObject()
      }
      // console.log('创建结果')
      // console.log(user)
      return user
    }


    /**
     * 获取用户信息
     * 
     * @param {string} uid 用户id
     * @returns 
     * @memberof UserService
     */

    async getUser(uid, full) {
      const { logger } = this
      uid += ''
      const key = 'user#' + uid
      const exist = await redis.exists(key)
      let user
      if (exist && !full) {
        user = await redis.hgetall(key)
      } else {
        if (!/^[0-9a-fA-F]{24}$/.test(uid)) {
          // 如果不是合格的ObjectId则直接返回失败
          return false
        }
        user = await model.User.findById(uid)
          .catch(e => {
            logger.error(new Error(e.message))
          })

        this.logger.debug('\n getUser() 使用findById查找uid "%s" 得到： \n %s', uid, JSON.stringify(user))
        if (!user) {
          this.logger.debug('\n getUser() 使用findById查找uid "%s" 失败', uid)
          return false
        }
        // NOTE: 踩坑历险记，mongoose查询出来的是document对象，要用方法转换才能存到redis !
        user = user.toObject()
        // this.logger.debug('findById ret user: %s \n typeof user: %s', JSON.stringify(), typeof user)
        // TODO: 返回的信息需要进行过滤
        // user.uid = user._id
        await redis.hmset(key, user)
        await redis.expire(key, expire_time)
      }
      if (!user || !user.uid) {
        this.logger.debug('\n getUser() 得到的user信息错误： \n %s', user)
        return false
      }
      return user
    }

    /**
     * 查询用户 使用昵称
     * 
     * @param {string} nickname 用户昵称 nickname
     * @returns 
     * @memberof UserService
     */

    async getUserByNick(nickname) {
      const key = 'user_nickname#' + nickname
      const exist = await redis.exists(key)
      let user

      if (exist) {
        user = await redis.hgetall(key)
      } else {
        user = await model.User.findOne({ wx_nickname: nickname })
        if (!user) {
          return false
        }
        // user = user.toObject()
        const cache_data = {
          uid: user.uid,
        }
        await redis.hmset(key, cache_data)
        await redis.expire(key, expire_time)
      }
      return user.uid || false
    }

    /**
     * 查询用户 使用openid
     * 
     * @param {string} openid 
     * @returns 
     * @memberof UserService
     */

    async getUserByOpenid(openid) {
      const key = 'user_openid#' + openid
      const exist = await redis.exists(key)
      let user

      if (exist) {
        user = await redis.hgetall(key)
      } else {
        user = await model.User.findOne({ wx_openid: openid })
        if (!user) {
          return false
        }
        // user = user.toObject()
        const cache_data = {
          uid: user.uid,
        }
        await redis.hmset(key, cache_data)
        await redis.expire(key, expire_time)
      }
      return user.uid || false
    }

    /**
     * 使用用户编号查询用户uid
     * 
     * @param {any} unum 
     * @returns 
     * @memberof UserService
     */

    async getUserByUnum(unum) {
      const key = 'user_unum#' + unum
      const exist = await redis.exists(key)
      let user

      if (!unum) {
        return false
      }

      if (exist) {
        user = await redis.hgetall(key)
      } else {
        user = await model.User.findOne({ unum })
        if (!user) {
          return false
        }
        const cache_data = {
          uid: user.uid,
        }
        await redis.hmset(key, cache_data)
        await redis.expire(key, expire_time)
      }
      return user.uid || false
    }


    /**
     * 查询用户uid 使用alias
     * 
     * @param {string} alias 
     * @returns 
     * @memberof UserService
     */

    async getUserByAlias(alias) {
      const key = 'user_alias#' + alias
      const exist = await redis.exists(key)
      let user

      if (exist) {
        user = await redis.hgetall(key)
      } else {
        user = await model.User.findOne({ wx_alias: alias })
        if (!user) {
          return false
        }
        // user = user.toObject()
        const cache_data = {
          uid: user.uid,
        }
        await redis.hmset(key, cache_data)
        await redis.expire(key, expire_time)
      }
      return user.uid || false
    }


    /**
     * 修改用户信息
     * 
     * @param {string} id 用户id
     * @param {any} data 修改的信息
     * @returns 
     * @memberof UserService
     */

    async update(uid, data) {
      uid += ''
      const key = 'user#'
      const { logger } = this
      delete data.createTime
      delete data.unum
      // delete data.cert
      // TODO: 需要添加其他的过滤
      // console.log('现在开始更新')
      // console.log({ id, data })
      let user = await model.User.findOneAndUpdate({ _id: uid }, { $set: data }, { new: true })
      // console.log('更新结果')
      // console.log(user)
      if (user) {
        user = user.toObject()
        await redis.del(key + user._id)
      }
      return user
    }

    /**
     * 返回是否是正式用户
     * 
     * @param {any} { uid, openid, wx_alias } 
     * @returns 
     * @memberof UserService
     */

    async isFormal({ uid, openid, wx_alias }) {
      uid += ''
      const { service } = this
      let user
      if (!uid && openid) {
        uid = await this.getUserByOpenid(openid)
      }
      if (!uid && wx_alias) {
        uid = await this.getUserByOpenid(wx_alias)
      }
      if (uid) {
        user = await this.getUser(uid)
        if (user.formal) {
          return true
        }
      }
      return false
    }

    /**
     * 增加信用值
     * 
     * @param {any} { uid, type, value, data, memo } 
     * @returns 
     * @memberof UserService
     */

    async addCredit({ uid, type, value, data, memo }) {
      const { service, logger } = this
      if (!uid || !type || !value) {
        return false
      }
      const user = await this.getUser(uid)
      if (!user) {
        return false
      }
      logger.debug('\n addCredit() 开始为用户uid: "%s" 增加 "%s" 类型信用分: "%d"', uid, type, value)
      const userData = {
        $inc: {
          __v: 1,
        },
      }
      const creditData = {
        $inc: {},
        type,
        memo,
        uid,
        succeed: false,
        add_subtype: {},
      }
      let err
      switch (type) {
        case 'invite':
          if (!data.uid || !data.name) {
            err = true
            break
          }
          creditData.invite = {
            uid: data.uid,
            name: data.name,
          }
          break;

        default:
          break;
      }
      if (err) {
        // logger.warn('\n addCredit() 为用户uid: "%s" 增加 %s 类型信用值，出现错误: %s', uid, type, data, JSON.stringify(data))
        return false
      }
      userData.$inc.credit_total = value
      // 增加积分上限值
      userData.$inc['score.limit'] = value
      userData.$inc['credit_subtype.' + type] = value
      creditData.add_total = value
      creditData.add_subtype[type] = value

      // logger.debug('\n addCredit() 修改用户前信息:\n%s\n', JSON.stringify(user))
      const newUser = await model.User.findOneAndUpdate({ _id: uid }, userData, { new: true })
      // logger.debug('\n addCredit() 修改用户信息后返回:\n%s\n', JSON.stringify(newUser))
      if (newUser && newUser._id) {
        creditData.succeed = true
        creditData.user_ver = newUser.__v
      }
      const ret = await model.CreditLog.create(creditData)
      // logger.debug('\n addCredit() 创建信用值修改记录后返回:\n%s\n', JSON.stringify(ret))
      return true
    }

    /**
     * 增加积分
     * 
     * @param {any} { uid, type, value, memo } 
     * @returns 
     * @memberof UserService
     */

    async addScore({ uid, type, value, memo, from_uid }) {
      const { service, logger } = this
      if (!uid || !type || !value) {
        return false
      }
      const user = await this.getUser(uid)
      if (!user) {
        return false
      }
      logger.debug('\n addScore() 开始积分id: "%s" 增加 "%s" 类型积分: "%d"', uid, type, value)
      const userData = {
        $inc: {
          __v: 1,
        },
      }
      const scoreData = {
        add_value: value,
        type,
        memo,
        uid,
        from_uid,
        succeed: false,
      }
      userData.$inc['score.total'] = value
      scoreData.add_total = value


      logger.debug('\n addScore() 修改积分信息:\n%s\n', JSON.stringify(user))
      const newUser = await model.User.findOneAndUpdate({ _id: uid }, userData, { new: true })
      logger.debug('\n addScore() 修改积分后返回:\n%s\n', JSON.stringify(newUser))
      if (newUser && newUser._id) {
        scoreData.succeed = true
        scoreData.user_ver = newUser.__v
      }
      const ret = await model.ScoreLog.create(scoreData)
      logger.debug('\n addScore() 创建积分改记录后返回:\n%s\n', JSON.stringify(ret))
      return true
    }


    /**
     *  TODO: 需要实现功能
     * - 认证
     * - 注销
     */

  }
  return UserService
}
