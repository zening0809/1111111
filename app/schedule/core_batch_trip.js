'use strict'

/**
 * 批量匹配行程定时器
 */

module.exports = {
  schedule: {
    // interval: '10m',
    interval: '1m',
    type: 'worker',
  },
  // 定时批量匹配行程
  async task(ctx) {
    const { service, app } = ctx
    const { config, redis, logger } = app
    const time1 = Date.now()
    logger.debug('\n 定时任务-行程匹配 启动')
    await ctx.service.trip.batch()
    // await ctx.service.trip.batchGroup()
    const time2 = Date.now()
    logger.info('\n 定时任务-行程匹配 本次任务执行用时 %d ms', time2 - time1)
  },
};
