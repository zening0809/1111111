'use strict'

/**
 * 一次性调整信用值
 */

module.exports = {
  schedule: {
    cron: ' 0 0 0 * * * 1',
    immediate: true,
    // 已禁用
    disable: true,
    type: 'worker',
  },
  // 定时批量匹配行程
  async task(ctx) {
    const { service, app } = ctx
    const { config, logger, model } = app
    const time1 = Date.now()
    logger.info('特殊任务-信用值调整 启动')

    const count = 0

    await model.CreditLog.update({
      type: 'invite',
      succeed: true,
      'add_subtype.fixed': true,
      'add_subtype.invite': 1,
    },
    { $set: { 'add_subtype.invite': 5, add_total: 5 } },
    { multi: true })

    await model.CreditLog.update({
      type: 'sys',
      succeed: true,
      'add_subtype.fixed': true,
      'add_subtype.sys': 20,
    },
    { $set: { 'add_subtype.sys': 50, add_total: 50 } },
    { multi: true })

    await model.CreditLog.deleteMany({
      type: 'sys',
      memo: '系统调整补偿',
    })

    const ret = await model.CreditLog.aggregate([{
      $match: {
        succeed: true,
        'add_subtype.fixed': true,
      },
    }, {
      $group: {
        _id: '$uid',
        sys: { $sum: '$add_subtype.sys' },
        invite: { $sum: '$add_subtype.invite' },
      },
    }])
    logger.info('用户信用值聚合数据：\n', ret)
    for (const i of ret) {
      logger.info('调整：', i)
      const u = await model.User.findOneAndUpdate({
        _id: i._id,
      }, {
        $set: {
          'credit_subtype.invite': i.invite,
          'credit_subtype.sys': i.sys,
          'score.limit': i.invite + i.sys,
        },
      })
    }

    // const userList = await model.User.find({}, { uid: 1 })
    // for (const u of userList) {
    //   const uid = u.uid
    // let value = 0
    // let ret = await model.CreditLog.update({
    //   uid,
    //   type: 'sys',
    //   succeed: true,
    //   'add_subtype.sys': 20,
    //   'add_subtype.fixed': { $ne: true },
    // },
    // { $set: { 'add_subtype.fixed': true } },
    // { multi: true })

    // if (ret && ret.nModified > 0) {
    //   // 原先注册信用值为20，新规则增加到50
    //   value += 50 - 20
    // }

    // ret = await model.CreditLog.update({
    //   uid,
    //   type: 'invite',
    //   succeed: true,
    //   'add_subtype.invite': 1,
    //   'add_subtype.fixed': { $ne: true },
    // },
    // { $set: { 'add_subtype.fixed': true } },
    // { multi: true })

    // if (ret && ret.nModified > 0) {
    //   // 原先邀请增加信用值1，新规则增加到5
    //   value += (5 - 1) * ret.nModified
    // }

    // if (value > 0) {
    //   await service.user.addCredit({
    //     uid,
    //     type: 'sys',
    //     value,
    //     memo: '系统调整补偿',
    //   })
    //   count++
    //   logger.info('特殊任务-信用值调整: 为用户uid "%s" 增加信用值 %d 分', uid, value)
    // }
    // }
    const time2 = Date.now()
    logger.info('特殊任务-信用值调整 本次任务执行用时 %d ms, 为 %d 用户增加信用分', time2 - time1, count)
  },
};
