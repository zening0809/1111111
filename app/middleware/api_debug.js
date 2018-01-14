'use strict';
module.exports = (options, app) => {
  return function* (next) {
    const req = this.request.body
    this.logger.debug('\n 中间件API_DEBUG 访问进入,授权情况：\n%s\n请求内容: \n%s\n\n', JSON.stringify(this.session), JSON.stringify(req))
    yield next
    const res = this.body
    this.logger.debug('\n 中间件API_DEBUG 访问得到的内容: \n%s\n', JSON.stringify(res))
  }
};
