'use strict';
const URL = require('url')

module.exports = app => {
  class WebController extends app.Controller {

    /**
     * 微信绑定引导页入口
     * 
     * @memberof WebController
     */
    async bind() {
      const { ctx, service, logger } = this
      const { openid, uid } = ctx.session
      if (!ctx.res.nuxtData) {
        ctx.res.nuxtData = {}
      }
      const code = ctx.params.code || ctx.session.inviteCode
      if (code) {
        // 将邀请码缓存在session，以确保用户使用不含邀请码的链接进入时，不丢失邀请信息
        ctx.session.inviteCode = code
      }
      // console.log('进入bind()')
      if (!openid) {
        logger.warn('\n bind() 没有openid！')
        return
      }
      if (uid) {
        ctx.res.nuxtData.regUser = true
        return
      }
      if (ctx.query.s) {
        // 如果页面带参数s，则显示绑定码
        ctx.res.nuxtData.showCode = true
      }
      const ret = await service.web.bind({ openid, inviteCode: code })
      if (!ret.key) {
        ctx.res.nuxtData.error = ret.msg || '获取绑定码失败！'
        return
      }

      if (!ctx.session.wxUserinfo) {
        const url = new URL.URL(ctx.origin + '/mp_auth')
        url.searchParams.set('to', ctx.href)
        const u = await service.wxAuth.getAuthUrl(url.toString(), '', 'snsapi_userinfo')
        ctx.redirect(u.url)
        return
        // this.ctx.session.needUserinfoAuth = true
      }
      if (code) {
        const user = await service.user.getUser(code)
        if (user) {
          ctx.res.nuxtData.inviteInfo = {
            name: user.name || user.wx_nickname,
            credit: user.credit_total,
            headImg: user.headImg,
          }
        }
      }
      ctx.res.nuxtData.data = {
        imgUrl: ret.imgUrl,
        key: ret.key,
        expire_time: ret.expire_time,
      }
    }

    /**
     * 邀请分享页ssr渲染
     * 
     * @memberof WebController
     */
    async shareInvite() {
      const { ctx, service, logger } = this
      const { code } = ctx.params
      // console.log(code)
      if (!code) {
        return
      }
      if (!ctx.res.nuxtData) {
        ctx.res.nuxtData = {}
      }
      const user = await service.user.getUser(code)
      if (!user) {
        ctx.res.nuxtData.error = '邀请码无效！'
        return
      }
      // 默认邀请码即用户的uid
      ctx.res.nuxtData.invite = user.uid
      ctx.res.nuxtData.link = '/bind/' + user.uid
      ctx.res.nuxtData.inviteInfo = {
        name: user.name || user.wx_nickname,
        credit: user.credit_total,
        headImg: user.headImg,
      }
    }

    /**
     * 行程分享页ssr渲染
     * 
     * @memberof WebController
     */
    async shareTrip() {
      const { ctx, service, logger } = this
      const { tid } = ctx.params
      const { uid } = ctx.session
      // console.log(tid)
      if (!tid) {
        return
      }
      if (!ctx.res.nuxtData) {
        ctx.res.nuxtData = {}
      }
      const trip = await service.trip.getTrip(tid, true)
      let user
      if (trip && trip.uid) {
        user = await service.user.getUser(trip.uid)
      }
      if (!trip || !user) {
        ctx.res.nuxtData.error = '行程信息无效！'
        return
      }

      ctx.res.nuxtData.trip = {
        tid: trip.tid,
        time: trip.time,
        close_time: trip.close_time,
        type: trip.type,
        // sloc: { name: trip.sloc.name },
        // eloc: { name: trip.eloc.name },

        eloc: trip.eloc,
        sloc: trip.sloc,
        price: trip.price,
        min_seat: trip.min_seat,
        max_seat: trip.max_seat,
        memo: trip.memo,
      }
      if (!uid) {
        ctx.res.nuxtData.regLink = '/bind/' + user.uid
      }
      ctx.res.nuxtData.userInfo = {
        name: user.name || user.wx_nickname,
        credit: user.credit_total,
        headImg: user.headImg,
      }
      if (trip.type === 'car') {
        if (uid) {
          ctx.res.nuxtData.tripLink = '/tripInfo/' + trip.tid
        }
        ctx.res.nuxtData.userInfo.car_model = user.car_model
        ctx.res.nuxtData.userInfo.car_color = user.car_color
        ctx.res.nuxtData.userInfo.car_no = user.car_no
      }
    }

    /**
     * 信息修改页
     * 
     * @memberof WebController
     */
    async infoPage() {
      const { ctx, service, logger } = this
      const { openid, uid, wxAuth } = ctx.session
      if (!uid) {
        return
      }
      if (!ctx.res.nuxtData) {
        ctx.res.nuxtData = {}
      }
      const { info, msg } = await service.web.getUserInfo({ openid, uid })
      if (msg) {
        ctx.res.nuxtData.error = msg
        return
      }
      if (ctx.query.edit) {
        // 如果页面带edit参数，则进入资料编辑状态
        ctx.res.nuxtData.isChange = true
      }
      if (!info.headImg) {
        if (!ctx.session.wxUserinfo) {
          const url = new URL.URL(ctx.origin + '/mp_auth')
          url.searchParams.set('to', ctx.href)
          const u = await service.wxAuth.getAuthUrl(url.toString(), '', 'snsapi_userinfo')
          ctx.redirect(u.url)
          return
        }
        const headImg = ctx.session.wxUserinfo.headimgurl
        if (headImg) {
          logger.debug('\n infoPage() 获取到用户头像: %s', headImg)
          const ret = await service.user.update(uid, { headImg })
          info.headImg = ret.headImg
        } else {
          logger.warn('\n infoPage() 没有头像信息: \n%s', JSON.stringify(ctx.session.wxUserinfo))
        }
        // 没有头像，需要更新
      }
      ctx.res.nuxtData.info = info
    }

  }
  return WebController;
};
