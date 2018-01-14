'use strict'

/**
 * 处理ws连接后身份认证登记
 */

module.exports = () => {
  return function* () {
    const rev_event = 'rev_msg'
    const rev_type = 'rev_bind'
    const data = this.args[0]
    const { logger } = this
    // const data = {
    //   key: key,
    //   alias?: string,
    //   nickname:
    //   userId: content.id,
    //   guest: boolean,  //如果是需要
    // }
    logger.debug('\n io.bind data: \n%s', JSON.stringify(data))
    if (!data.key || !data.nickname || (!data.alias && !!data.guest)) {
      return
    }

    // const ret = {
    //   type: 'rev_bind',
    //   msg: '',
    //   alias: data.alias,
    // }
    const ret = yield this.service.bot.bind(data)
    logger.debug('\n io.bind 得到绑定结果: \n%s', JSON.stringify(ret))
    if (ret) {
      const { bindRet, msg, alias } = ret
      if (ret.newAlias) {
        // NOTE: 如果绑定后有newAlias字段，则将触发设置新alias指令
        // 见 service.bot.getUserInfo
        logger.info('\n io.bind 为用户 "%s" 设置新alias:"%s" ，旧alias为:"%s"\n', data.nickname, ret.newAlias, ret.oldAlias)
        this.socket.emit('rev_command', {
          command: 'set_alias',
          alias: ret.oldAlias,
          newAlias: ret.newAlias,
        })
      }
      this.socket.emit(rev_event, {
        type: rev_type,
        msg, alias,
      })
    } else {
      this.socket.emit(rev_event, {
        type: rev_type,
        msg: '服务异常!',
        alias: data.alias,
      })
    }
  }
}
