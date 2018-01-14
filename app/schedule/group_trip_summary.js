'use strict'

module.exports = {
  schedule: {
    cron: ' 0 0 16,17 * * * *',
    type: 'worker',
  },
  // 定时处理行程匹配结果
  async task(ctx) {
    const { service, app, helper } = ctx
    const { config, redis, model, logger } = app
    const time1 = Date.now()

    logger.debug('\n 定时任务-群内行程信息汇总 定时器启动')
    const startTime = new Date()
    const endTime = new Date()
    let count = 0
    let groupCount = 0
    startTime.setHours(9, 0, 0, 0)
    const ret = await model.WxMsg.aggregate([{
      $match: {
        time: {
          $gte: startTime,
          $lte: endTime,
        },
        gid: { $ne: null },
      },
    }, {
      $group: {
        _id: '$gid',
        count: { $sum: 1 },
        data: {
          $push: {
            uid: '$uid',
            msg: '$msg',
          },
        },
      },
    }])
    logger.debug('\n 定时任务-群内行程信息汇总 聚合查询结果:\n', JSON.stringify(ret), '\n')
    const s1 = String.fromCharCode(8199)
    const s2 = String.fromCharCode(8198)
    for (const r of ret) {
      groupCount++
      const group = await service.group.getGroup(r._id + '')
      const groups = new Map()
      groups.set(group.gid, group.name)
      // 查询微信群组织其他群信息
      if (group.union_name) {
        const groupIds = await service.group.getUnionGroup(group.union_name)
        if (groupIds) {
          for (const gid of groupIds) {
            const group = await service.group.getGroup(gid)
            if (group) {
              groups.set(group.gid, group.name)
            }
          }
        }
      }

      const msgArr = []
      msgArr.push(`本群今天 ${ctx.helper.formatDate('HH点', startTime)}至 ${ctx.helper.formatDate('HH点', endTime)}发布的行程共 ${r.count}条，汇总如下：\n============== \n`)
      let i = 0
      for (const m of r.data) {
        if (i > 0) {
          msgArr.push('-----\n')
        }
        const user = await service.user.getUser(m.uid + '')
        i++
        msgArr.push(i + '# ')
        if (user && user.wx_alias) {
          msgArr.push(s1 + user.wx_alias + s2)
        } else {
          msgArr.push('群用户')
        }
        msgArr.push(': ' + m.msg.substr(0, 100) + '\n')
      }
      msgArr.push('============== \n如果您未在其中找到合适的司机或乘客，欢迎使用借螃蟹平台发布行程！\n链接： ' + await service.url.batchPage())

      const msg = msgArr.join('')

      for (const gid of groups.keys()) {
        const data = {
          topic: groups.get(gid),
          msg: '',
        }
        if (gid !== group.gid) {
          data.msg = `本信息转发自关联群 "${group.name}" \n\n`
        }
        data.msg += msg

        const id = ctx.helper.uuid()
        const key = 'push_msg#' + id

        logger.debug('\n 定时任务-群内行程信息汇总 信息推送任务id: %s ,数据：\n%s\n', id, JSON.stringify(data))
        // 信息设置为30分钟过期
        count++
        try {
          await redis.hmset(key, data)
          await redis.expire(key, 30 * 60)
          await redis.sadd('push_msg', id)
        } catch (e) {
          logger.error(e)
        }
      }
    }

    const time2 = Date.now()
    logger.info('\n 定时任务-群内行程信息汇总 本次任务执行用时 %d ms, 处理 %d 个群内的行程汇总, 推送汇总结果 %d 条', time2 - time1, groupCount, count)
  },
};
