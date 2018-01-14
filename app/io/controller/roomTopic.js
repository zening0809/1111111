'use strict'

/**
 * 房间改名
 */

module.exports = () => {
  return function* () {
    const data = this.args[0]
    // const data = {
    //   roomid: '',
    //   newTopic: '',
    //   oldTopic: '',
    //   gid: '',
    // }
    yield this.service.bot.changeRoomTopic(data)
  }
}
