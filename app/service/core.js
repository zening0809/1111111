'use strict';
// const URL = require('url')
module.exports = app => {
  const { model, redis, config } = app

  class CoreService extends app.Service {

    /**
     * 通知服务，用于推送扫码登陆通知
     * 
     * @param {any} { desp, key, text = '微信群管通知' } 
     * @memberof CoreService
     */

    async sendNotify({ desp, key, text = '微信群管通知' }) {
      const { ctx, logger } = this
      if (!key) {
        logger.warn('\n sendNotify() 缺少key，无法执行通知下发！')
        return
      }
      const url = config.useFtqqNotify ?
        `http://sc.ftqq.com/${key}.send` :
        `http://swan.batorange.com/wechat/swan/${key}.send`

      const res = await ctx.curl(url, { data: { desp, text } })
      if (res.status !== 200) {
        logger.warn('\n sendNotify() 请求信息push服务失败！响应码: %d\n', res.status)
        return
      }
      logger.info('\n sendNotify() 请求信息push服务结果: %s\n', res.data)
    }


    /**
     * 返回用于绑定账号的bot信息
     * 
     * @returns 
     * @memberof CoreService
     */

    async getBindBot() {
      const bot = {
        qrcodeImgUrl: config.bot.imgUrl,
      }
      // TODO: 返回活动中bot的信息 //一期不用
      return bot
    }
  }
  return CoreService;
};
