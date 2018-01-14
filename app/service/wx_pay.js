'use strict';

const API_UNIFIED_ORDER = 'https://api.mch.weixin.qq.com/pay/unifiedorder'
const API_QUERY_ORDER = 'https://api.mch.weixin.qq.com/pay/orderquery'
const API_CLOSE_ORDER = 'https://api.mch.weixin.qq.com/pay/closeorder'

const URL = require('url')


module.exports = app => {

  const { config } = app
  const { appid, mch_id, sign_key } = config.wx_pay


  class WxPayService extends app.Service {


    /**
     * 获取JS微信支付参数
     * 
     * @param {any} order 
     * @returns 
     * @memberof WxPayService
     */

    async getJsPayParams(order) {
      const { ctx, logger } = this
      order.trade_type = 'JSAPI'
      const ret = await this.createUnifiedOrder(order)
      if (!ret) {
        throw new Error('调用统一下单失败！')
      }
      if (ret.return_code === 'FAIL') {
        logger.error('\n getJsPayParams 下单失败！返回信息：\n%s', JSON.stringify(ret))
        throw new Error('创建支付订单失败！' + ret.return_msg)
      }
      const data = {
        appId: appid,
        timeStamp: Math.floor(Date.now() / 1000) + '',
        nonceStr: ret.nonce_str,
        package: 'prepay_id=' + ret.prepay_id,
        signType: 'MD5',
      }
      data.paySign = this.sign(data)
      logger.debug('\n getJsPayParams 创建的data内容: \n%s\n', JSON.stringify(data))
      return data
    }

    /**
     * 统一下单
     * 
     * @param {any} opt 
     * @returns 
     * @memberof WxPayService
     */

    async createUnifiedOrder(opt) {
      const { ctx, logger } = this
      let data = {
        appid,
        mch_id,
        // notify_url, // 微信付款后的回调地址
        // body: BODY,
        nonce_str: ctx.helper.generateNonceString(),
        // openid: OPENID,
        out_trade_no: Date.now() + '', // 订单号
        // 客户端的 ip
        spbill_create_ip: ctx.ip,
        // 商品的价格， 此处需要注意的是这个价格是以分算的， 那么一般是元， 你需要转换为 RMB 的元
        // total_fee: TOTAL_FEE,
        trade_type: 'JSAPI',
      }

      data = Object.assign(data, opt)
      data.sign = this.sign(data)
      logger.debug('\n createUnifiedOrder 创建的data内容: \n%s\n', JSON.stringify(data))

      const ret = await ctx.curl(API_UNIFIED_ORDER, {
        method: 'POST',
        content: ctx.helper.buildXML({ xml: data }),
        headers: {
          'content-type': 'text/html',
        },
      })
      if (ret.status === 200) {
        logger.debug('\n createUnifiedOrder 服务器返回: \n%s\n', JSON.stringify(ret.data))
        const data = await ctx.helper.parseXML(ret.data)
        logger.debug('\n createUnifiedOrder 解析后: \n%s\n', JSON.stringify(data))
        return data
      }
      return false
    }

    /**
     * 查询订单
     * 
     * @param {any} query 
     * @returns 
     * @memberof WxPayService
     */

    async queryOrder(query) {
      const { ctx, logger } = this
      if (!query.transaction_id && !query.out_trade_no) {
        return { return_code: 'FAIL', return_msg: '缺少参数' }
      }
      let data = {
        appid,
        mch_id,
        nonce_str: ctx.helper.generateNonceString(),
        // transaction_id,
        // out_trade_no,
      }
      data = Object.assign(data, query)
      data.sign = this.sign(data)

      const ret = await ctx.curl(API_QUERY_ORDER, {
        method: 'POST',
        content: ctx.helper.buildXML({ xml: data }),
        headers: {
          'content-type': 'text/html',
        },
      })
      if (ret.status === 200) {
        const data = await ctx.helper.parseXML(ret.data)
        return data
      }
      return false
    }

    /**
     * 关闭订单
     * 
     * @param {any} query 
     * @returns 
     * @memberof WxPayService
     */

    async closeOrder(query) {
      const { ctx, logger } = this
      if (!query.transaction_id && !query.out_trade_no) {
        return { return_code: 'FAIL', return_msg: '缺少参数' }
      }
      let data = {
        appid,
        mch_id,
        nonce_str: ctx.helper.generateNonceString(),
        // out_trade_no,
      }
      data = Object.assign(data, query)
      data.sign = this.sign(data)

      const ret = await ctx.curl(API_CLOSE_ORDER, {
        method: 'POST',
        content: ctx.helper.buildXML({ xml: data }),
        headers: {
          'content-type': 'text/html',
        },
      })
      if (ret.status === 200) {
        const data = await ctx.helper.parseXML(ret.data)
        return data
      }
      return false
    }

    sign(param) {
      const { ctx } = this
      const querystring = Object.keys(param)
        .filter(key => {
          return param[key] !== undefined && param[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key) < 0;
        })
        .sort()
        .map(key => {
          return key + '=' + param[key];
        })
        .join('&') + '&key=' + sign_key;
      return ctx.helper.md5(querystring).toUpperCase();
    }


  }
  return WxPayService;
};

