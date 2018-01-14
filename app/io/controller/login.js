'use strict'

/**
 * 处理ws连接后身份认证登记
 * 此时Bot端已扫码登陆
 */

module.exports = () => {
  return function* () {
    const rev_event = 'rev_command'
    const data = this.args[0]
    const logger = this.logger
    logger.debug('\n io.login data: \n%s', JSON.stringify(data))

    const s = yield this.service.ws.get(data.socket_id)
    // logger.info(' io.login() ws cache data: %s', JSON.stringify(s))
    // console.log(s)

    if (!s || !s.uuid || !data.nickname) {
      return
    }
    const ret = yield this.service.bot.login({
      bot_name: data.bot_name,
      uuid: s.uuid,
    })
    // 向bot发送是否允许登陆的指令
    logger.debug('\n io.login 回复是否允许登陆: %s', ret.allow)
    // if (!ret.allow) {
    // logger.debug('\n请求数据：\n%s\n系统获得结果： \n%s\n\n', JSON.stringify(data), JSON.stringify(ret))
    // }
    this.socket.emit(rev_event, { command: ret.allow ? 'resume_bot' : 'pause_bot' })
  }
}
