'use strict'


module.exports = {
  // 使用nuxt进行渲染，参数1为渲染路径，参数2为渲染数据。参数可省略
  async renderNuxt(router, data) {
    const url = (typeof router === 'string' && router) ? router : this.req.url

    if (typeof data === 'object' && data) {
      this.res.nuxtData = data
    } else if (typeof router === 'object' && router) {
      this.res.nuxtData = router
    }

    return await this.app.nuxt.renderRoute(url, {
      req: this.req,
      res: this.res,
    })
  },
}
