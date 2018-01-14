'use strict';
module.exports = app => {
  const { config, model } = app
  class HookController extends app.Controller {
    async pay() {
      const { ctx, service, logger } = this
      const data = ctx.req.body
      let obj
      try {
        if (!data) {
          throw new Error('解析XML失败！')
        }
        logger.debug('pay() 收到支付通知: \n', data)
        obj = data
        if (!(obj.appid === config.wx_pay.appid &&
          obj.mch_id === config.wx_pay.mch_id &&
          obj.transaction_id && obj.out_trade_no &&
          obj.openid && obj.total_fee
        )) {
          throw new Error('参数检查失败！')
        }
        const sign = await service.wxPay.sign(obj)
        if (obj.sign !== sign) {
          throw new Error('签名校验失败！')
        }
      } catch (e) {
        logger.error('pay() error:\n', e.message)
        ctx.status = 200
        ctx.body = ctx.helper.buildXML({ return_code: 'FAIL', return_msg: e.message })
        return
      }
      await service.web.updatePay({
        openid: obj.openid || '',
        out_trade_no: obj.out_trade_no,
        total_fee: obj.total_fee,
        cash_fee: obj.cash_fee,
        state: obj.result_code === 'SUCCESS' ? 1 : -1,
      })
      ctx.status = 200
      ctx.body = ctx.helper.buildXML({ return_code: 'SUCCESS' })
    }

  }
  return HookController;
};
