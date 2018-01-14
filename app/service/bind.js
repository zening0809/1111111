'use strict';
module.exports = app => {
  const { model, service, config, redis } = app

  // 验证码有效期 10分钟
  const expire_time = 10 * 60
  const vcode_key = 'vcode#'


  class BindService extends app.Service {

    /**
     * 缓存验证码
     * 
     * 有效期默认为10分钟
     * 
     * @param {any} code 验证码
     * @param {any} data 关联数据
     * @memberof BindService
     */

    async set(code, data) {
      const key = vcode_key + code
      // console.log('bind, set(): ', key, ' : ', data)
      await redis.hmset(key, data)
      await redis.expire(key, expire_time)
    }

    /**
     * 验证验证码
     * 
     * 如果验证码有效，则返回验证码对应数据
     * 
     * @param {any} code 验证码
     * @returns 
     * @memberof BindService
     */

    async get(code) {
      const key = vcode_key + code
      const data = await redis.hgetall(key)
      if (!data) {
        return false
      }
      await redis.del(key)
      return data
    }
  }
  return BindService;
};
