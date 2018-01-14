'use strict'
module.exports = app => {
  /**
   * 暂存Websocket会话服务
   * 
   * @class WsService
   * @extends {app.Service}
   */
  class WsService extends app.Service {
    /**
     * 暂存ws会话
     * 
     * 从ws io的中间件auth中调用
     * 
     * @param {any} socket 
     * @memberof WsService
     */

    async addWs(socket) {
      // 改为在helper中初始化数组
      app.wsClients[socket.id] = {
        socket,
        expiry_time: Date.now() + 60 * 1000,
        uuid: '',
        auth: false,
      }
    }

    /**
     * 获取ws会话
     * 
     * @param {any} socketId 
     * @returns 
     * @memberof WsService
     */

    async getWs(socketId) {
      // FIXME:设计模式可能有问题
      // this.logger.debug(app.wsClients)
      // console.log(socketId)
      // this.logger.debug(app.wsClients[socketId])

      if (socketId && app.wsClients && app.wsClients[socketId]) {
        return app.wsClients[socketId].socket
      }

      // console.log('xxxxxx')
      // console.log(app.wsClients['/bot#IAf7jjT3-gBs-WtXAAAA'])
      // console.log('xxxxxx')

      return false
    }

    /**
     * 获取ws会话整体信息
     * 
     * @param {any} socketId 
     * @returns 
     * @memberof WsService
     */

    async get(socketId) {
      if (socketId && app.wsClients && app.wsClients[socketId]) {
        return app.wsClients[socketId]
      }
      return false
    }


    /**
     * DEBUG: 返回所有ws信息
     * 
     * @returns 
     * @memberof WsService
     */

    async getAll() {
      return app.wsClients
    }

    /**
     * 为socket绑定客户端认证后的uuid
     * 
     * @param {any} socketId 
     * @param {any} uuid 
     * @memberof WsService
     */

    async bindUuid(socketId, uuid) {
      if (socketId && app.wsClients && app.wsClients[socketId]) {
        app.wsClients[socketId].uuid = uuid
      }
    }

    /**
     * 为socket设置授权标志，ws的filter将过滤未授权的非法访问
     * 
     * NOTE: ？？？未用？？
     * 
     * @param {any} socketId 
     * @param {any} uuid 
     * @memberof WsService
     */

    async auth(socketId, auth) {
      if (socketId && app.wsClients && app.wsClients[socketId]) {
        app.wsClients[socketId].auth = auth
      }
    }

    /**
     * 确定socket是否已经授权
     * 
     * @param {any} socketId 
     * @memberof WsService
     */

    async isAuth(socketId) {
      if (socketId && app.wsClients && app.wsClients[socketId]) {
        return app.wsClients[socketId].auth || false
      }
      return false
    }

    /**
     * 删除ws会话
     * 
     * 从ws io的中间件auth中调用
     * 
     * @param {any} socketId 
     * @memberof WsService
     */

    async delWs(socketId) {
      if (socketId && app.wsClients) {
        delete app.wsClients[socketId]
      }
    }

    /**
     * 保持ws会话的有效，避免被清理
     * 
     * FIXME: ws的有效性暂时未使用
     * 
     * @param {any} socketId 
     * @memberof WsService
     */

    async keepWs(socketId) {
      if (socketId && app.wsClients) {
        app.wsClients[socketId].expiry_time = Date.now() + 60 * 1000
      }
    }
  }
  return WsService
}
