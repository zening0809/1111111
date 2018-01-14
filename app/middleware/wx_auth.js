'use strict'
const URL = require('url')

// 检测是否经过微信授权
// 这个中间件里检测并设置web的cookie

module.exports = (options, app) => {
  return function* (next) {
    const openid = this.session.openid || null
    const formal = this.session.formal || null
    let uid = this.session.uid || null
    const logger = this.logger
    logger.debug('\n 中间件wxAuth 访问进入')

    if (this.method === 'POST') {
      logger.debug('\n 中间件wxAuth POST请求直接跳过')
      yield next
      return
    }
    logger.debug('\n 中间件wxAuth openid: "%s" uid: "%s"', openid, uid)

    if (!openid) { // 如果没有得到授权则跳转授权
      const to = this.query.to && /^[http|https]:\/\//.test(this.query.to) ? this.query.to : this.href
      const url = new URL.URL(this.origin + '/mp_auth')
      url.searchParams.set('to', to)
      const u = yield this.service.wxAuth.getAuthUrl(url.toString())
      logger.debug('\n 中间件wxAuth 重定向进行微信授权 url:\n%s\n', JSON.stringify(u))
      if (!u) {
        // TODO:跳转错误页提示无法微信授权
        this.throw(new Error('Create auth url fail.'))
        return
      }
      // logger.info('\n生成的authUrl: ' + u.url)
      // this.session.jumpAuth += 1
      this.redirect(u.url)
      return
    }
    if (!uid) {
      logger.debug('\n 中间件wxAuth 没有uid，调用getUserByOpenid("%s") 获取uid', openid)
      uid = yield this.service.user.getUserByOpenid(openid)
      logger.debug('\n 中间件wxAuth 获取uid结果: %s', uid)
      if (uid) {
        this.session.uid = uid
      }
      if (!uid) {
        logger.debug('\n 中间件wxAuth 仍未获取到uid，当前页面url: \n%s', this.path)
        if (!/^\/bind/i.test(this.path)) {
          // 跳转绑定页面
          this.redirect(this.origin + '/bind')
          yield next
          return
        }
      }
    }
    if (this.session.needUserinfoAuth) {
      // NOTE:需要显示用户信息授权
      const to = this.query.to && /^[http|https]:\/\//.test(this.query.to) ? this.query.to : this.href
      const url = new URL.URL(this.origin + '/mp_auth')
      url.searchParams.set('to', to)
      const u = yield this.service.wxAuth.getAuthUrl(url.toString(), '', 'snsapi_userinfo')
      logger.debug('\n 中间件wxAuth 重定向进行微信授权 url:\n%s\n', JSON.stringify(u))
      if (!u) {
        this.throw(new Error('Create auth url fail.'))
        return
      }
      this.redirect(u.url)
      return
    }
    if (uid && !formal) {
      const isFormal = yield this.service.user.isFormal({ uid })
      if (isFormal) {
        this.session.formal = isFormal
      }
      if (!isFormal && !/^\/info\/info/.test(this.path)) {
        const u = this.origin + '/info/info?new=1'
        logger.debug('\n 中间件wxAuth 重定向到编辑资料页 url:\n%s\n', JSON.stringify(u))
        this.redirect(u)
        return
      }
    }

    yield next
  }
}
