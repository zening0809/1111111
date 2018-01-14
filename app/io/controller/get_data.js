'use strict'

// 给bot同步数据
const WsRevDataType = {
  config: 'config',
  room: 'room',
}

/**
 * 房间创建完成
 */

module.exports = () => {
  return function* () {
    const rev_event = 'rev_data'
    const data = this.args[0]
    const { service, logger, app } = this
    // const data = {
    //   room: true,
    //   config: true,
    //   topic:
    // }
    if (!data) {
      return
    }

    logger.info('\n io.getData 收到bot更新数据请求: %s', JSON.stringify(data))
    if (data.room && !data.topic) {
      const query = { state: 'ok' }
      const ret = yield app.model.Group.find(query, { name: 1, type: 1, gid: 1, admin: 1 })
      logger.debug('\n io.getData 查询到群信息:\n%s\n', JSON.stringify(ret))
      if (ret && ret.length > 0) {
        let room = []
        let i = 0
        logger.debug('\n io.getData 将开始准备room数据')
        for (const group of ret) {
          logger.debug('\n io.getData 处理group数据:\n%s', JSON.stringify(group))
          i++
          const admins = []
          if (group.admin && group.admin.wx_alias && Array.isArray(group.admin.wx_alias)) {
            group.admin.wx_alias.forEach(item => {
              if (item && typeof item === 'string') {
                admins.push(item)
              }
            })
          }
          room.push({
            topic: group.name,
            gid: group.gid || group._id + '',
            type: group.type || 'big',
            admin: admins,
          })
          logger.debug('\n io.getData 已添加room数据量: \d 条', room.length)

          if (i % 1000 === 0) {
            logger.debug('\n io.getData 将发送room数据:\n%s\n', JSON.stringify(room))
            this.socket.emit(rev_event, {
              type: 'room',
              room,
            })
            room = []
          }
        }
        if (room.length > 0) {
          logger.debug('\n io.getData 将发送room数据:\n%s\n', JSON.stringify(room))
          this.socket.emit(rev_event, {
            type: 'room',
            room,
          })
          room = []
        }
      }
    }

    if (data.topic) {
      logger.debug('\n io.getData 收到请求获取room "%s" 的数据', data.topic)
      const gid = yield service.group.getGroupId(data.topic)
      if (gid) {
        const group = yield service.group.getGroup(gid)
        const admins = []
        if (group) {
          if (group.admin && group.admin.wx_alias && Array.isArray(group.admin.wx_alias)) {
            group.admin.wx_alias.forEach(item => {
              if (item && typeof item === 'string') {
                admins.push(item)
              }
            })
          }
          const room = [{
            topic: group.name,
            gid: group.gid || group._id + '',
            type: group.type || 'big',
            admin: admins,
          }]
          logger.debug('\n io.getData 将发送room "%s" 数据:\n%s\n', data.topic, JSON.stringify(room))
          this.socket.emit(rev_event, {
            type: 'room',
            room,
          })
        } else {
          logger.debug('\n io.getData 未能查找到room "%s" 的数据', data.topic)
        }
      } else {
        logger.debug('\n io.getData 未能查找到room "%s" 的gid', data.topic)
      }

    }
    //   //限更新房间信息 WsRevDataType.room
    //   room: [{
    //     topic: '',//群名称
    //     gid: '',//群gid
    //     type: '',//群类型 driver司机群
    //     admin:[], //群管理员列表
    //   }],


  }
}
