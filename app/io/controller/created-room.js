'use strict'

/**
 * 房间创建完成
 */

module.exports = () => {
  return function* () {
    const data = this.args[0]
    const rev_event = 'rev_msg'
    // const data = {
    //   topic: '',
    //   taskId: '',
    // }
    this.logger.info('\n io.createdRoom data: \n%s', JSON.stringify(data))
    const ret = yield this.service.bot.createdGroup(data)
    if (ret && ret.msg) {
      this.socket.emit(rev_event, {
        alias: data.alias,
        topic: data.topic,
        msg: ret.msg,
      })
    }
  }
}
