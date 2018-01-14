'use strict';
const URL = require('url')
module.exports = app => {
  class MpAuthController extends app.Controller {
    // TODO:待完善网页基本授权
    async oauth() {
      const { ctx, service, logger } = this
      const code = ctx.query.code || null
      const state = ctx.query.state || null
      const openid = this.ctx.session.openid || null
      const to = ctx.query.to || this.origin
      if (code) {
        const ret = await service.wxAuth.getToken(code)
        logger.debug('\n oauth() 发现code参数，得到返回结果:\n%s\n', JSON.stringify(ret))
        if (ret && ret.openid) {
          ctx.session.openid = ret.openid
          ctx.session.wxAuthTime = new Date()
          ctx.session.wxAuth = ret

          if (/snsapi\_userinfo/i.test(ret.scope)) {
            ctx.session.needUserinfoAuth = false
            const userinfo = await service.wxAuth.getUserinfo(ret.access_token, ret.openid)
            logger.debug('\n oauth() 调用getUserinfo得到返回结果:\n%s\n', JSON.stringify(userinfo))
            if (userinfo) {
              ctx.session.wxUserinfo = userinfo

            }
            // TODO: 要保存用户授权信息，用来长久维护用户信息
          }
          if (/\/mp_auth/i.test(to)) {
            ctx.redirect(this.origin)
          } else {
            ctx.redirect(to)
          }
          return
        }
        logger.debug('\n oauth() 网页授权失败，返回信息：%s\n\n', JSON.stringify(ret))
        //   ctx.throw(new Error('网页授权失败！'))
        // } else {
        //   logger.debug('\n oauth() 没有uid，调用getUserByOpenid("%s") 获取uid', openid)
        //   // logger.debug(this)
        //   const url = new URL.URL(this.config.host + '/mp_auth')
        //   url.searchParams.set('to', this.to)
        //   const u = await this.service.wxAuth.getAuthUrl(url.toString())
        //   if (!u) {
        //     // TODO:跳转错误页提示无法微信授权
        //     this.throw(new Error('获取微信授权异常！'))
        //     return
        //   }
        //   ctx.redirect(u)
      }
      ctx.logger.warn('\n oauth() 网页授权失败！')
      ctx.redirect(this.origin)
      // TODO: 跳转到错误页提示

    }
  }
  return MpAuthController;
};
