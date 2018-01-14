'use strict';

module.exports = () => {
  return function* (next) {
    // TODO:对ws请求进行检查，提取并登记其身份信息
    // const say = yield this.service.user.say();
    // this.socket.emit('res', 'auth!' + say);
    const socketId = this.socket.id
    this.logger.info('\nWebsocket client connect! socket id: %s\n', socketId);
    this.service.ws.addWs(this.socket)
    yield* next;
    this.service.ws.delWs(socketId)
    this.logger.info('\nWebsocket client diconnect! socket id: %s\n', socketId);
  };
};
