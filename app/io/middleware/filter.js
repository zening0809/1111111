'use strict'

module.exports = () => {
  return function* (next) {
    // 所有请求必须发送一个对象
    // 这里会在对象中加入客户socket的id
    if (Array.isArray(this.packet) && this.packet.length > 1 && typeof this.packet[1] === 'object') {
      this.packet[1].socket_id = this.socket.id
    } else {
      return
    }
    const { logger, service } = this

    const event = this.packet[0]
    // 未授权的访问需要过滤掉需要权限的访问入口

    // FIXME: 这里验证没有作用？？
    if (!service.ws.isAuth(this.socket_id)) {
      const whiteEvent = new Set([
        'auth', 'scan', 'login', 'logout', 'error',
      ])
      if (!whiteEvent.has(event)) {
        logger.debug('\nWebsocket-filter: "%s" event, data: \n%s\n', event, this.packet[1])
        return
      }
    }
    // this.logger.debug('\nWebsocket请求: "%s" event, data: \n%s\n', event, JSON.stringify(this.packet[1]))

    // 统一捕获异常
    try {
      yield* next
    } catch (e) {
      logger.error('\n', e, '\n')
    }
  }
}
