'use strict';

/** 注意：这个access_token是用于公众平台API的全局调用凭证，并非网页授权得到的用户信息获取凭证 */
const API_token = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET'
const API_jsapi_ticket = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi'

const URL = require('url')


module.exports = app => {

  const { config } = app
  const redis = app.redis
  // const redis = app.redis.get('sys')

  class WxApiService extends app.Service {

    /**
     * 获取access_token
     * 
     * @returns {string} 返回access_token
     * @memberof WxApiService
     */

    async getAccessToken() {
      const key = 'mp_dev#access_token'
      const token = await redis.hgetall(key)
      if (!token.access_token || token.expires_time > new Date()) {
        this.logger.debug('\n getAccessToken() 未能得到token，刷新token')
        return await this.refreshAccessToken()
      }
      return token.access_token || false
    }

    /**
     * 刷新access_token
     * 
     * @returns 
     * @memberof WxApiService
     */

    async refreshAccessToken() {
      const { service, ctx, logger } = this
      const key = 'mp_dev#access_token'
      const { appid, appsecret } = config.mp_dev
      if (!appid || !appsecret) {
        logger.error('\n refreshAccessToken() appid or appsecret is no set!')
        return false
      }
      const url = new URL.URL(API_token)
      url.searchParams.set('appid', appid)
      url.searchParams.set('secret', appsecret)
      const ret = await ctx.curl(url.toString(), { dataType: 'json' })
      if (!ret.data.access_token) {
        logger.error('\n refreshAccessToken() curl error: \n%s', JSON.stringify(ret))
        return false
      }
      logger.debug('\n refreshAccessToken() 刷新token结果:\n%s\n', JSON.stringify(ret))
      const data = {
        access_token: ret.data.access_token,
        expires_time: ctx.helper.addTime(new Date(), ret.data.expires_in * 0.8),
      }
      await redis.hmset(key, data)
      // 使access_token提前到期，避免失效
      await redis.expire(key, ret.data.expires_in * 0.9)
      return data.access_token || false
    }

    /**
     * 获取微信jsapi用的ticket
     * 
     * @returns 
     * @memberof WxApiService
     */

    async getJsapiTicket() {
      const key = 'mp_dev#jsapi_ticket'
      const ticket = await redis.hgetall(key)
      if (!ticket.ticket || ticket.expires_time > new Date()) {
        // this.logger.debug('\n getJsapiTicket() 未能得到ticket，刷新ticket')
        return await this.refreshJsapiTicket()
      }
      // this.logger.debug('\n getJsapiTicket() 获取ticket:%s\n', JSON.stringify(ticket))
      return ticket.ticket || false
    }


    /**
     * 刷新微信jsapi的ticket
     * 
     * @returns 
     * @memberof WxApiService
     */

    async refreshJsapiTicket() {
      const { ctx, logger } = this
      const key = 'mp_dev#jsapi_ticket'
      const access_token = await this.getAccessToken()
      if (!access_token) {
        logger.error('\n refreshJsapiTicket() 没有找到 access_token!')
        return false
      }
      const url = new URL.URL(API_jsapi_ticket)
      url.searchParams.set('access_token', access_token)
      const ret = await ctx.curl(url.toString(), { dataType: 'json' })
      if (!ret.data.ticket) {
        logger.error('\n refreshJsapiTicket() curl error: \n%s\n', JSON.stringify(ret.data))
        return false
      }
      const data = {
        ticket: ret.data.ticket,
        expires_time: ctx.helper.addTime(new Date(), ret.data.expires_in * 0.8),
      }
      await redis.hmset(key, data)
      // 使ticket提前到期，避免失效
      await redis.expire(key, ret.data.expires_in * 0.9)
      return data.ticket
    }

    /**
     * 获取对指定url的jsapi的签名
     * 
     * @param {any} url 
     * @returns 
     * @memberof WxApiService
     */

    async getJsSign(url) {
      const { service, ctx, logger } = this
      const { appid } = config.mp_dev
      if (!appid) {
        logger.error('\n getJsSign() 未能获得appid,系统配置中的mp_dev为: \n%s\n', JSON.stringify(config.mp_dev))
        return false
      }
      const jsapi_ticket = await this.getJsapiTicket()
      const nonce_str = Math.random().toString(36).substr(2, 15)
      const timestamp = new Date().getTime() // 时间戳
      if (!jsapi_ticket) {
        logger.error('\n getJsSign() 未能获得jsapi_ticket: %s\n', jsapi_ticket)
        return false
      }

      const str = 'jsapi_ticket=' + jsapi_ticket + '&noncestr=' + nonce_str + '&timestamp=' + timestamp + '&url=' + url

      // logger.debug('\n getJsSign() 准备使用签名的数据为: \n%s\n', str)

      // 用sha1加密
      const signature = ctx.helper.sha1(str)
      return {
        appId: appid,
        timestamp,
        nonceStr: nonce_str,
        signature,
      }
    }


  }
  return WxApiService;
};

