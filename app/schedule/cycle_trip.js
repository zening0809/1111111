'use strict'

module.exports = {
  schedule: {
    cron: ' 0 0 6,18 * * * *',
    type: 'worker',
  },
  // 定时处理行程匹配结果
  async task(ctx) {
    const { service, app, helper } = ctx
    const { config, redis, model, logger } = app
    const time1 = Date.now()

    logger.debug('\n 定时任务-处理周期行程 定时器启动')
    const startTime = new Date()
    const endTime = new Date()
    const hour = startTime.getHours()
    // 12点前查询当天12点 至 (12+18)小时的行程
    // 12点后查询次日0点 至 (24+18)小时的行程
    const x = hour < 12 ? 12 : 24
    const y = x + 18
    startTime.setHours(x, 0, 0, 0)
    endTime.setHours(y, 0, 0, 0)
    logger.debug('\n 定时任务-处理周期行程 startTime: %s', startTime)
    logger.debug('\n 定时任务-处理周期行程 startTime.getDay(): %s', startTime.getDay())
    logger.debug('\n 定时任务-处理周期行程 endTime: %s', endTime)
    logger.debug('\n 定时任务-处理周期行程 endTime.getDay(): %s', endTime.getDay())

    const timeOffset = 1000 * 60 * 60 * 24

    const ret = await model.CycleTrip.find({
      enabled: true,
      tid: { $ne: null },
      $or: [
        {
          weeks: startTime.getDay(),
          dayTime: {
            $gte: startTime.getTime() % timeOffset,
          },
        },
        {
          weeks: endTime.getDay(),
          dayTime: {
            $lte: endTime.getTime() % timeOffset,
          },
        },
      ],
    })

    logger.debug('\n 定时任务-处理周期行程 查询结果:\n', JSON.stringify(ret), '\n')
    let count = 0
    for (const r of ret) {
      const trip = await service.trip.getTrip(r.tid + '', true)
      if (!trip) {
        continue
      }

      const trips = await model.Trip.find({
        state: 'open',
        uid: trip.uid,
      }, null, { limit: 5 })
      if (trips && Array.isArray(trips) && trips.length > 0) {
        logger.debug('\n pubTrip() 用户uid "%s" 创建行程前仍有未关闭行程，取消创建行程', trip.uid)
        continue
      }

      const data = {
        type: trip.type,
        time: new Date(),
        state: trip.state,
        sloc: trip.sloc,
        eloc: trip.eloc,
        dist: trip.dist,
        source: 'auto',
        uid: trip.uid,
        gid: trip.gid,
        ctid: trip.ctid || null,
        price: trip.price || 0,
        driver_gid: trip.driver_gid || '',
        driver_gkey: trip.driver_gkey || '',
        min_seat: trip.min_seat || 0,
        max_seat: trip.max_seat || 0,
        memo: trip.memo || '',
      }
      const offset = new Date(trip.time).getTime() % timeOffset
      const offset2 = data.time.getTime() % timeOffset

      logger.debug('\n 定时任务-处理周期行程 trip.time: %s', trip.time)
      logger.debug('\n 定时任务-处理周期行程 offset: %d  offset2: %d', offset, offset2)
      logger.debug('\n 定时任务-处理周期行程 data.time: %s', data.time)

      if (offset > offset2) {
        data.time.setUTCHours(0, 0, 0, offset)
      } else {
        data.time.setUTCHours(0, 0, 0, offset + timeOffset)
      }
      logger.debug('\n 定时任务-处理周期行程 data.time: %s', data.time)

      logger.debug('\n 定时任务-处理周期行程 准备创建行程:\n', JSON.stringify(data), '\n')
      const tid = await service.trip.create(data)
        .catch(e => {
          logger.error('定时任务-处理周期行程 异常：', e)
        })
      if (tid) {
        const ctrip = await model.CycleTrip.findOneAndUpdate({
          _id: trip.ctid + '',
          enabled: true,
        }, {
          $inc: { count: 1 },
        }, { new: true })
        logger.debug('\n 定时任务-处理周期行程 根据周期行程ctid "%s" 创建行程成功，新行程tid: "%s" ', r.ctid, tid)
        count++
      } else {
        logger.error('\n 定时任务-处理周期行程 根据周期行程ctid "%s" 创建行程失败，旧行程tid: "%s"', r.ctid, r.tid + '')
      }
    }

    const time2 = Date.now()
    logger.info('\n 定时任务-处理周期行程 本次任务执行用时 %d ms ，共创建行程 %d 条', time2 - time1, count)
  },
}
