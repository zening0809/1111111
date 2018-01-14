'use strict'
const URL = require('url')

module.exports = (options, app) => {
  return function* (next) {
    const { logger } = this
    if (/\sMicroMessenger\//i.test(this.get('user-agent'))) {
      yield next
      return
    }
    logger.warn('\n 中间件webApiAuth 检查ua如下：\n%s\n', this.get('user-agent'))
    this.body = {
      errCode: -1,
      errMsg: '禁止访问！',
    }
  }
}

