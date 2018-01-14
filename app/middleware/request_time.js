'use strict'

module.exports = () => {
  return function* (next) {
    this.logger.debug('\n 中间件ReqTime 请求进入')
    const start = Date.now()
    yield next
    const end = Date.now()
    this.logger.debug('\n 中间件ReqTime 请求处理用时 %d ms', end - start)
  }
}
