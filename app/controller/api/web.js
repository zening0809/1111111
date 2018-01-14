'use strict'

// 错误码 说明
// 0 正常
// 11 需要使用微信登陆 缺少openid
// 12 需要绑定微信机器人  缺少uid
// 13 用户验证失败 缺少openid或uid
// 21  参数错误
// 31  操作失败(不同的原因提示)
// 51  系统错误

module.exports = app => {
  class HomeController extends app.Controller {

    /**
     * 获取绑定用数据
     * 
     * @memberof HomeController
     */
    async bind() {
      const { ctx, service, logger } = this
      let { openid, inviteCode } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {
          // msg: null,
          // key: '',
          // imgUrl: '',
          // expire_time: 0,
        },
      }
      if (!openid) {
        ret.errCode = 11
        ret.errMsg = '请求错误！没有使用微信登陆！'
      } else {
        if (!inviteCode && ctx.query.invite) {
          inviteCode = ctx.query.invite
          logger.debug('\n bind() 使用query中的invite: %s', inviteCode)
        }
        const t = await service.web.bind({ openid, inviteCode })
        if (!t.key) {
          ret.errCode = 31
          ret.data.msg = t.msg
        } else {
          ret.data.imgUrl = t.imgUrl
          ret.data.key = t.key
          ret.data.expire_time = t.expire_time
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 设置用户信息
     * 
     * @memberof HomeController
     */
    async setUserInfo() {
      const { ctx, service } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {
          //   msg: null,
        },
      }
      const data = ctx.request.body
      if (!openid || !uid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const r = await service.web.setUserInfo({ openid, uid, data })
        if (!r) {
          ret.errCode = 31
          ret.errMsg = '信息更新失败！'
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 搜索行程
     * 
     * @memberof HomeController
     */
    async findTrip() {
      const { ctx, service, logger } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {
          // msg: null,
          // count: 0,
          // trips: [],
        },
      }
      if (!uid || !openid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const data = ctx.request.body
        if (data.time && data.sloc && data.eloc) {
          const r = await service.web.findTrip({ data, uid, openid })
          logger.debug('\n findTrip() 搜索行程结果: \n%s\n', JSON.stringify(r))
          if (!r) {
            ret.errCode = 31
            ret.errMsg = '搜索失败！'
          } else {
            ret.data.trips = r
            ret.data.count = r.length || 0
          }
        } else {
          ret.errCode = 21
          ret.errMsg = '参数错误！'
        }
      }
      ctx.body = ret
      ctx.status = 200
    }


    /**
     * 获取我的行程记录
     * 
     * @memberof HomeController
     */

    async getTripLog() {
      const { ctx, service, logger } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {
          // msg: null,
          // count: 0,
          // trips: [],
        },
      }
      if (!uid || !openid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const r = await service.web.getTripLog({ uid, openid })
        logger.debug('\n getTripLog() 获取行程历史结果: \n%s\n', JSON.stringify(r))
        if (!r) {
          ret.errCode = 31
          ret.errMsg = '获取数据失败！'
        } else {
          ret.data.trips = r
          ret.data.count = r.length || 0
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 加载最新行程
     * 
     * @memberof HomeController
     */
    async nowTrip() {
      const { ctx, service, logger } = this
      const { openid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {
          // msg: null,
          // count: 0,
          // trips: [],
        },
      }
      const r = await service.web.findTrip({})
      if (!r) {
        ret.errCode = 31
        ret.errMsg = '搜索失败！'
      } else {
        ret.data.trips = r
        ret.data.count = r.length || 0
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 发布行程
     * 
     * @memberof HomeController
     */
    async pubTrip() {
      const { ctx, service } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
      }
      if (!uid || !openid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const data = ctx.request.body
        if (data.time && data.sloc && data.eloc) {
          const r = await service.web.pubTrip({ data, openid, uid })
            .catch(e => {
              ret.errCode = 31
              ret.errMsg = e.message
            })
          if (r.errCode) {
            ret.errCode = r.errCode
            ret.errMsg = r.msg
          }
        } else {
          ret.errCode = 21
          ret.errMsg = '参数错误！'
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 获取用户信息
     * 
     * @memberof HomeController
     */
    async getUserInfo() {
      const { ctx, service, logger } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {},
      }
      if (!uid || !openid) {
        logger.debug('\n getUserInfo() 用户验证失败！\n当前openid: "%s" uid: "%s"', openid, uid)
        logger.debug('\n getUserInfo() 尝试使用ctx方式获取 \n当前openid: "%s" uid: "%s"', ctx.session.openid, ctx.session.uid)
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const t = await service.web.getUserInfo({ openid, uid })
        // logger.debug('\n getUserInfo() 调用getUserInfo返回: %s', JSON.stringify(t))
        if (!t || t.msg) {
          ret.errCode = 31
          ret.errMsg = t.msg || '操作失败！'
        } else {
          ret.data = t
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 乘客加入行程
     * 
     * @memberof HomeController
     */
    async joinTrip() {
      const { ctx, service } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
      }
      if (!uid || !openid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const data = ctx.request.body
        if (data.tid && data.seat) {
          const r = await service.web.joinTrip({ data, openid, uid })
          if (!r || r.msg) {
            ret.errCode = 31
            ret.errMsg = r.msg || '操作失败！'
          }
        } else {
          ret.errCode = 21
          ret.errMsg = '参数错误！'
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 关闭行程
     * 
     * @memberof HomeController
     */
    async closeTrip() {
      const { ctx, service } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
      }
      if (!uid || !openid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const data = ctx.request.body
        // data = {
        //   tid,
        //   done, // 完成行程/取消行程
        // }
        if (data.tid && data.done !== undefined) {
          const r = await service.web.closeTrip({ data, openid, uid })
          if (!r) {
            ret.errCode = 31
            ret.errMsg = '操作失败！'
          }
        } else {
          // console.log(data)
          ret.errCode = 21
          ret.errMsg = '参数错误！'
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 删除行程
     * 
     * @memberof HomeController
     */
    async delTrip() {
      const { ctx, service } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
      }
      if (!uid || !openid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const data = ctx.request.body
        // data = {
        //   tid,
        // }
        if (data.tid) {
          const r = await service.web.delTrip({ tid: data.tid, openid, uid })
          if (!r || r.msg) {
            ret.errCode = 31
            ret.errMsg = r.msg || '操作失败！'
          }
        } else {
          // console.log(data)
          ret.errCode = 21
          ret.errMsg = '参数错误！'
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 获取行程的信息
     * 
     * @memberof HomeController
     */
    async getTripInfo() {
      const { ctx, service, logger } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {},
      }
      if (!openid) {
        ret.errCode = 11
        ret.errMsg = '用户验证失败！需要微信登陆！'
      } else {
        const data = ctx.request.body
        // data = {
        //   tid,
        //   detail: boolean, //仅查询自己的行程时，可以显示定位坐标
        // }
        if (data.tid) {
          const r = await service.web.getTripInfo({ data, openid, uid })
          logger.debug('\n getTripInfo() 获得行程信息：%s', JSON.stringify(r))
          if (!r || r.msg) {
            ret.errCode = 31
            ret.errMsg = r.msg || '操作失败！'
          } else {
            ret.data = r
          }
        } else {
          ret.errCode = 21
          ret.errMsg = '参数错误！'
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 返回基本信息，如地图key等
     * 
     * @memberof HomeController
     */
    async getInfo() {
      const { ctx, service } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {},
      }
      const r = await service.web.getMapConf()
      if (!r || r.msg) {
        ret.errCode = 31
        ret.errMsg = '载入数据失败！'
      } else {
        ret.data = r
      }
      if (uid) {
        // NOTE: 如果登陆且存在uid，则将uid作为邀请码
        ret.data.inviteCode = uid
      }
      ctx.body = ret
      ctx.status = 200
    }

    async getJsSign() {
      const { ctx, service } = this
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {
          // sign: {},
        },
      }
      const { url } = ctx.query
      if (url) {
        const r = await service.wxApi.getJsSign(url)
        if (!r || r.msg) {
          ret.errCode = 31
          ret.errMsg = '载入数据失败！'
        } else {
          ret.data.sign = r
        }
      } else {
        ret.errCode = 21
        ret.errMsg = '参数错误！'
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 获取邀请记录
     * 
     * @memberof HomeController
     */
    async getInviteLog() {
      const { ctx, service } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {},
      }
      if (!uid || !openid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const { page } = ctx.query
        const r = await service.web.getInviteLog({
          uid,
          skip: page * 10 || 0,
          limit: 10,
        })
        if (!r) {
          ret.errCode = 31
          ret.errMsg = '操作失败！'
        } else {
          ret.data.log = r
          ret.data.count = r.length
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

    /**
     * 创建支付订单
     * 
     * @memberof HomeController
     */
    async pay() {
      const { ctx, service } = this
      const { openid, uid } = ctx.session
      const ret = {
        errCode: 0,
        errMsg: null,
        data: {
          // order:{}
        },
      }
      if (!uid || !openid) {
        ret.errCode = 13
        ret.errMsg = '用户验证失败！'
      } else {
        const { fee, unum } = ctx.query
        if (fee > 0) {
          const r = await service.web.createPay({
            fee, openid, uid, unum,
          })
            .catch(e => {
              ret.errCode = 31
              ret.errMsg = e.message || '操作失败！'
            })
          if (r) {
            ret.data.order = {
              timestamp: r.timeStamp,
              nonceStr: r.nonceStr,
              package: r.package,
              signType: 'MD5',
              paySign: r.paySign,
            }
          }
        } else {
          ret.errCode = 21
          ret.errMsg = '参数错误！'
        }
      }
      ctx.body = ret
      ctx.status = 200
    }

  }
  return HomeController
}
