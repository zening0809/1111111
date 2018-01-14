'use strict'
const URL = require('url')

module.exports = (options, app) => {
  return function* (next) {
    let { openid, uid } = this.session
    const { logger } = this
    // logger.debug('\n 中间件 webApiAuth \n')
    if (!this.session.openid) {
      this.body = {
        errCode: 99,
        errMsg: '需要使用微信登陆才可以访问！',
      }
      this.status = 200
      return
    }
    if (!uid) {
      logger.debug('\n 中间件webApiAuth 检测到没有uid，调用getUserByOpenid("%s") 获取uid\n', openid)
      uid = yield this.service.user.getUserByOpenid(openid)
      logger.debug('\n 中间件webApiAuth 获取uid结果: "%s"\n', uid)
      this.session.uid = uid
    }
    yield next
  }
}
