'use strict'

module.exports = () => {
  return function* (next) {
    const { service, logger } = this
    // 通过将数据写入到nuxtData参数中，在使用nuxt渲染的vue文件asyncData中引用res.nuxtData取出
    if (!this.res.nuxtData) {
      this.res.nuxtData = {}
    }
    const ret = yield service.wxApi.getJsSign(this.href)
    if (!ret) {
      logger.warn('\n 中间件wx_jsapi_sign 未能获得有效的wxJsApi签名！')
    }
    this.res.nuxtData.wx_config = ret
    logger.debug('\n 中间件wx_jsapi_sign 设置nuxtData后:\n%s\n', JSON.stringify(this.res.nuxtData))
    yield next
  }
}
