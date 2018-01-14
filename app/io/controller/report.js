'use strict'

/**
 * 接收定时上报的bot运行状态，维持bot状态更新
 */

module.exports = () => {
  return function* () {
    const rev_event = 'rev_command'
    const data = this.args[0]
    if (!data.uuid) {
      this.logger.warn('Websocket: Receive error report: %s', data)
      return
    }
    yield this.service.bot.report({
      bot_login: data.bot_login || false,
      bot_running: data.bot_running || false,
      bot_usable: data.bot_usable || false,
      uuid: data.uuid,
      socket_id: data.socket_id,
    })

    // const ret = yield this.service.bot.isAllowRun()
    // if (data.bot_running && data.bot_login && !data.bot_usable) {
    //   this.socket.emit(rev_event, { command: ret.allow ? 'resume_bot' : 'pause_bot' })
    // }
  }
}
