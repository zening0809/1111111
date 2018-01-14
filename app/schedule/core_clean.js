'use strict'

module.exports = {
  schedule: {
    interval: '5m',
    type: 'worker',
  },
  // 定时处理行程匹配结果
  async task(ctx) {
    const { service, app } = ctx
    const { config, redis, logger } = app
    const time1 = Date.now()

    logger.debug('\n 定时任务-清理任务 启动')

    await service.trip.cleanTimeout()

    const time2 = Date.now()
    logger.info('\n 定时任务-清理任务 本次执行用时 %d ms', time2 - time1)
  },
};
