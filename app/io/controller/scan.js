'use strict'

/**
 * 处理bot扫码登陆
 */

module.exports = () => {
  return function* () {
    const data = this.args[0]
    // const data = {
    //   url: loginUrl,
    //   bot_name: config.bot_name,
    // }
    // this.logger.info(' io.scan data: %s', JSON.stringify(data))
    if (!data.url || !data.bot_name) {
      return
    }

    const { service, logger, app } = this

    // const bot = yield service.config.getBot(data.bot_name)
    const bot = app.config.bots[data.bot_name]
    logger.info('\n io.scan Bot "%s" 需要扫码登陆,二维码url: ', data.bot_name, data.url)
    logger.debug('\n 获得bot信息如下: \n%s\n', JSON.stringify(bot))
    if (!bot || !bot.enabled || !bot.sckey) {
      return
    }
    logger.info('\n io.scan 允许给Bot "%s" 发送扫码登陆通知', data.bot_name)

    yield service.core.sendNotify({
      desp: `您的微信机器人 "${data.bot_name}" 需要扫码登陆。\n\n请打开登陆了机器人的微信，使用扫一扫功能，扫描下方二维码。\n\n![二维码](${data.url})`,
      text: `微信机器人 ${data.bot_name} 需要扫码登陆`,
      key: bot.sckey,
    })
  }
}
