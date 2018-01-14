'use strict'

/**
 * 司机专属群业务
 */

// 群状态
const enum_state = {
  created: 'created',
  ok: 'ok',
  canceled: 'deleted',
}

const enum_type = {
  // 大群
  big: 'big',
  // 司机群
  driver: 'driver',
}

// 查询司机群
// 司机群口令管理
// 移除司机群
// @司机 #群管理
// 	司机在群内的管理指令
// 获取群id  name -> gid

module.exports = app => {
  const { model } = app

  const redis = app.redis
  // const redis = app.redis.get('trip')
  const expire_time = 60

  class GroupService extends app.Service {

    /**
     * 创建微信群
     * 
     * @param {any} data 
     * @returns 
     * @memberof GroupService
     */

    async create(data) {
      const { logger, service } = this
      const groupData = {
        name: data.name,
        type: data.type,
        admin: {
          wx_alias: [],
        },
        state: enum_state.created,
        member_num: data.member_num || 0,
        // 默认群key使用6位随机数
        key: data.key || Math.floor(Math.random() * 1000000),
      }
      if (!data.name) {
        logger.error('\n create() 创建群的信息不足！无法保存记录 信息如下：\n%s\n', JSON.stringify(data))
        return
      }

      logger.debug('\n create() 创建群的息如下：\n%s\n', JSON.stringify(data))
      if (data.uid) {
        groupData.uid = data.uid
        const user = await service.user.getUser(data.uid)
        groupData.wx_alias = user.wx_alias
      }
      if (data.admin && Array.isArray(data.admin.wx_alias)) {
        for (const alias of data.admin.wx_alias) {
          if (alias && typeof alias === 'string') {
            groupData.admin.wx_alias.push(alias)
          }
        }
      }
      const group = await model.Group.create(groupData)
      return group ? group.toObject() : false
    }


    /**
     * TODO:需要重构，应该放在其他类中
     * 
     * @memberof TripService
     */

    async newGroup(data) {
      const { service, ctx, logger, config } = this
      // data = {
      //   uid: '',
      //   wx_alias:'',
      //   type: '',
      //   name:'',
      //   gid:'',
      //   members:[alias],
      //   admin:{}
      //   key:''
      // }
      const tmp = {
        uid: data.uid + '' || '',
        wx_alias: data.wx_alias || '',
        type: data.type || 'big',
        name: data.name || data.topic || '群' + ctx.helper.uuid(),
        members: [],
        admin: {},
        key: data.key || '',
        time: new Date(), // 任务提交时间
      }

      if (tmp.uid) {
        const user = await service.user.getUser(tmp.uid)
        if (!tmp.wx_alias && user.wx_alias) {
          tmp.wx_alias = user.wx_alias
          tmp.members.push(user.wx_alias)
        }
      }
      // 获取建群的初始成员列表
      // const list = await service.config.getRoomAlias()
      const list = config.roomBaseAlias
      if (list) {
        tmp.members = tmp.members.concat(list)
      }
      tmp.members = JSON.stringify(tmp.members)
      tmp.admin = JSON.stringify(tmp.admin)
      // 这个id是任务id，即taskId
      // NOTE: 如果是司机群，则任务id采用司机uid，可以作为建群锁来避免重复建群
      let id = ctx.helper.uuid()
      // const id = ctx.helper.uuid()
      switch (tmp.type) {
        case 'driver':
          if (!tmp.uid) {
            logger.warn('\n newGroup() 创建司机群，但没有uid！ 详细信息:\n%s', JSON.stringify(data))
          } else {
            id = tmp.uid
          }
          break;

        default:
          break;
      }

      logger.debug('\n newGroup() 准备创建专属群信息: %s\n', JSON.stringify(tmp))
      // TODO: 需要过滤重复建群
      logger.info('\n newGroup() 提交建群信息到任务队列: new_group#%s', id)

      await redis.hmset('new_group#' + id, tmp)
      // 1小时的等待期
      await redis.expire('new_group#' + id, 60 * 60)
      await redis.sadd('new_group', id)
    }


    /**
     * 获取微信群信息
     * 
     * @param {string} id 群id
     * @param {boolean} full 是否获取完整信息
     * @returns 
     * @memberof GroupService
     */

    async getGroup(id, full) {
      id += ''
      const { service, logger } = this
      const key = 'group#' + id
      const exist = await redis.exists(key)
      let group
      if (!full && exist) {
        group = await redis.hgetall(key)
      } else {
        group = await model.Group.findById(id)
          .catch(e => {
            logger.error(new Error(e.message))
          })
        if (!group) {
          return false
        }
        group = group.toObject()
        // const user = await service.user.getUser(group.uid)
        const cache_data = {
          gid: group.gid,
          name: group.name,
          union_name: group.union_name,
          type: group.type,
          uid: group.uid,
          wx_alias: group.wx_alias,
          admin: JSON.stringify(group.admin),
          key: group.key,
        }
        await redis.hmset(key, cache_data)
        await redis.expire(key, expire_time)
        if (!full) {
          group = cache_data
        } else {
          return group
        }
      }
      group.admin = group.admin ? JSON.parse(group.admin) : []
      return group
    }


    /**
     * 查询群id
     * 
     * @param {any} name 群名 name
     * @returns 
     * @memberof GroupService
     */

    async getGroupId(name) {
      const key = 'group_name#' + name
      const exist = await redis.exists(key)
      let group
      if (exist) {
        group = await redis.hgetall(key)
      } else {
        group = await model.Group.findOne({ name })
        if (!group) {
          return false
        }
        group = group.toObject()
        const cache_data = {
          gid: group.gid,
        }
        await redis.hmset(key, cache_data)
        await redis.expire(key, expire_time)
        group = cache_data
      }
      return group.gid || false
    }

    /**
     * 获取群组织
     * 
     * @param {any} name 群组织名称
     * @returns 群gid数组
     * @memberof GroupService
     */

    async getUnionGroup(name) {
      if (!name) {
        return false
      }
      const key = 'union_group#' + name
      const exist = await redis.exists(key)
      let gids = []
      let group
      if (exist) {
        gids = await redis.smembers(key)
      } else {
        const groups = await model.Group.find({ union_name: name }, { _id: 1 })
        if (groups.length > 0) {
          for (const group of groups) {
            const gid = group._id + ''
            gids.push(gid)
            await redis.sadd(key, gid)
          }
          await redis.expire(key, expire_time)
        }
      }
      return gids.length > 0 && gids || false
    }

    /**
     * 查询用户（司机）的群id
     * 
     * @param {any} uid 用户uid
     * @returns 
     * @memberof GroupService
     */

    async getUserGroup(uid) {
      uid += ''
      const key = 'group_uid#' + uid
      const exist = await redis.exists(key)
      let group
      if (exist) {
        group = await redis.hgetall(key)
      } else {
        group = await model.Group.findOne({ uid })
        if (!group) {
          return false
        }
        group = group.toObject()
        const cache_data = {
          gid: group.gid,
        }
        await redis.hmset(key, cache_data)
        await redis.expire(key, expire_time)
        group = cache_data
      }
      return group.gid || false
    }

    /**
     * 使用wechaty端的临时roomId来查找群id
     * 
     * @param {any} roomId 
     * @returns 
     * @memberof GroupService
     */

    async getGroupIdByRoomId(roomId) {
      const key = 'room_id#' + roomId
      const group = await redis.hgetall(key)
      return group.gid || false
    }

    /**
     * 使用wechaty端的临时roomId来映射群id
     * 
     * @param {any} roomId 
     * @returns 
     * @memberof GroupService
     */

    async setRoomId(gid, roomId) {
      gid += ''
      const key = 'room_id#' + roomId
      const cache_data = { gid }
      await redis.hmset(key, cache_data)
      await redis.expire(key, expire_time)
    }

    /**
     * 修改群信息
     * 
     * @param {string} id 群id
     * @param {any} data 修改的信息
     * @returns 
     * @memberof GroupService
     */

    async update(id, data) {
      id += ''
      const { logger } = this
      delete data.createTime
      const group = await model.Group.findOneAndUpdate({ _id: id }, { $set: data }, { new: true })
      group.gid = group._id + ''
      return group._id ? group.toObject() : false
    }

    // 投入使用
    async ok(id) {
      const data = {
        state: enum_state.ok,
      }
      return this.update(id, data)
    }


    /**
     * 修改群key
     * 
     * @param {string} id 群id
     * @param {string} newKey 新key
     * @returns {boolean}
     * @memberof GroupService
     */

    async changeKey(id, newKey) {
      id += ''
      const data = {
        key: newKey,
      }
      return !!(await this.update(id, data))
    }

    /**
     * 关闭群
     * 
     * @param {any} id 群id
     * @returns 
     * @memberof GroupService
     */

    async cancel(id) {
      id += ''
      const data = {
        state: enum_state.canceled,
        closetime: new Date(),
      }
      return this.update(id, data)
    }

    /**
     * 设置群组织名称
     * 
     * @param {any} id 
     * @param {any} name 
     * @returns 
     * @memberof GroupService
     */

    async setUnionName(id, name) {
      if (!id) {
        return false
      }
      const data = {
        union_name: name,
      }
      await redis.del('group#' + id)
      await redis.del('union_group#' + name)
      return !!(await this.update(id, data))
    }
  }
  return GroupService
}
