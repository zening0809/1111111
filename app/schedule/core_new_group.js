'use strict'

module.exports = {
  schedule: {
    interval: '1m',
    type: 'worker',
  },
  // 定时处理行程匹配结果
  async task(ctx) {
    const { service, app } = ctx
    const { config, redis, logger } = app
    logger.debug('\n 定时任务-处理建群 启动')
    let i = 0
    const time1 = Date.now()
    const key = 'new_group'
    const key2 = 'new_group#'
    // 没有有效的bot
    while (await redis.scard(key) > 0) {
      // 控制发送量
      logger.debug('\n 定时任务-处理建群 循环: %d', i)
      if (i > 1000) {
        logger.debug('\n 定时任务-处理建群 循环: %d 将退出', i)
        break
      }
      const bot = await service.bot.getOneBot()
      if (!bot) {
        logger.debug('\n 定时任务-处理建群 未能获得一个可用的bot，将结束任务')
        break
      }
      const data = {
        command: 'create_room',
        list: [],
        // [{
        // taskId: '', // 任务id
        // topic: '', // 房间名称
        // type: '', // 房间类型
        // members: ['user_alias'], // 成员列表
        // }],
      }
      const ids = []
      for (let j = 0; j < 10; j++) {
        const id = await redis.spop(key)
        if (!id) {
          break
        }
        logger.debug('\n 定时任务-处理建群 获取建群任务: %s', id)
        ids.push(id)
        const tmp = await redis.hgetall(key2 + id)
        if (!tmp) {
          break
        }
        logger.debug('\n 定时任务-处理建群 获取建群任务内容：\n%s\n', JSON.stringify(tmp))
        if (tmp.members.length < 2) {
          logger.warn('\n 定时任务-处理建群 要创建的群成员不足2人，群可能会创建失败！')
        }
        data.list.push({
          taskId: id,
          topic: tmp.name,
          type: tmp.type,
          members: JSON.parse(tmp.members),
        })
        i++
      }
      if (data.list && data.list.length > 0) {
        logger.debug('\n 定时任务-处理建群 发送建群指令：\n%s', JSON.stringify(data))
        await service.bot.rev_command(data)
      }
    }
    const time2 = Date.now()
    logger.info('\n 定时任务-处理建群 本次任务执行用时 %d ms, 处理任务 %d 条', time2 - time1, i)
  },
};
