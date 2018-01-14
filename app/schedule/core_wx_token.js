'use strict'

module.exports = {
  schedule: {
    interval: '10m',
    type: 'worker',
    // disable: true,
  },
  // 定时处理行程匹配结果
  async task(ctx) {
    const { service, app, helper } = ctx
    const { config, redis, logger } = app
    const time1 = Date.now()

    logger.debug('\n 定时任务-检查微信Token有效性 定时器启动')

    const token_key = 'mp_dev#access_token'
    const token = await redis.hgetall(token_key)

    if (!token.access_token || helper.addTime(token.expires_time, -10 * 60) > new Date()) {
      await service.wxApi.refreshAccessToken()
    }

    const ticket_key = 'mp_dev#jsapi_ticket'
    const ticket = await redis.hgetall(ticket_key)
    if (!ticket.ticket || helper.addTime(ticket.expires_time, -10 * 60) > new Date()) {
      await service.wxApi.refreshJsapiTicket()
    }

    const time2 = Date.now()
    logger.info('\n 定时任务-检查微信Token有效性 本次任务执行用时 %d ms', time2 - time1)
  },
};
