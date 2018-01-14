'use strict'

/**
 * 取消行程
 */

module.exports = () => {
  return function* () {
    const rev_event = 'rev_msg'
    const rev_type = 'close_trip'
    const data = this.args[0]
    // const data = {
    //   key: key,
    //   alias?: string,
    //   nickname:
    //   userId: content.id,
    //   guest: boolean,  //如果是需要
    // }
    this.logger.debug('\n io.closeTrip data: \n%s', JSON.stringify(data))
    if (!data.alias) {
      return
    }

    // const ret = {
    //   type: 'rev_bind',
    //   msg: '',
    //   alias: data.alias,
    //   topic:
    // }
    const ret = yield this.service.bot.closeTrip(data)
    if (ret) {
      const { msg, alias, topic } = ret
      this.socket.emit(rev_event, {
        type: rev_type,
        msg, alias, topic,
      })
    } else {
      this.socket.emit(rev_event, {
        type: rev_type,
        msg: '服务异常!',
        alias: data.alias,
        topic: data.topic || '',
      })
    }
  }
}
