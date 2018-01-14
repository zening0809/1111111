'use strict'

module.exports = {
  schedule: {
    cron: ' 0 0 */1 * * * *',
    type: 'worker',
    immediate: true,
  },
  // 定时处理行程匹配结果
  async task(ctx) {
    const { service, app } = ctx
    const { config, redis, logger } = app
    const time1 = Date.now()

    logger.debug('\n 定时任务-载入开放行程到redis 定时器启动')

    await service.trip.loadOpenTrip()

    const time2 = Date.now()
    logger.info('\n 定时任务-载入开放行程到redis 本次任务执行用时 %d ms', time2 - time1)
  },
};
