'use strict'

/**
 * 处理ws连接后身份认证登记
 */

module.exports = () => {
  return function* () {
    const rev_event = 'rev_auth'
    const data = this.args[0]
    this.logger.debug('\n io.auth data: %s', JSON.stringify(data))

    if (!data.bot_name || !data.uuid) {
      this.socket.emit(rev_event, {
        allow_run: false,
      })
      return
    }
    const ret = yield this.service.bot.auth({
      bot_name: data.bot_name,
      uuid: data.uuid,
      socket_id: data.socket_id,
    })
    this.service.ws.bindUuid(data.socket_id, data.uuid)
    if (ret.allow_run === undefined) {
      ret.allow_run = false
    }
    this.socket.emit(rev_event, ret)
  }
}
