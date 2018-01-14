'use strict'

module.exports = {
  schedule: {
    interval: '1m',
    type: 'worker',
  },
  // 定时处理行程匹配结果
  async task(ctx) {
    const { service, app } = ctx
    const { redis, logger } = app
    const time1 = Date.now()
    logger.debug('\n 定时任务-发送信息 启动')
    let i = 1
    const key = 'push_msg'
    const key2 = 'push_msg#'
    // 没有有效的bot
    if (!await service.bot.getOneBot()) {
      logger.debug('\n 定时任务-发送信息 未能获得一个可用的bot，将结束任务')
      return
    }
    while (await redis.scard(key) > 0) {
      // 控制发送量
      if (i > 1000 || !await service.bot.getOneBot()) {
        logger.debug('\n 定时任务-发送信息 发送信息任务循环: %d 将退出', i)
        break
      }
      const id = await redis.spop(key)
      if (id) {
        const data = await redis.hgetall(key2 + id)
        if (data && await service.bot.rev_msg(data)) {
          await redis.del(key2 + id)
        } else {
          // 如果服务不可用，重新将信息放入队列
          logger.debug('\n 定时任务-发送信息 服务不可用,恢复任务到队列')
          await redis.sadd(key, id)
          break
        }
      }
      i++
    }

    const time2 = Date.now()
    logger.info('\n 定时任务-发送信息 本次任务执行用时 %d ms，处理任务 %d 条', time2 - time1, i)

  },
};
