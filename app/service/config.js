'use strict';


/**
 * NOTE: 本类暂停使用
 */

module.exports = app => {
  const config = app.config.trip
  const redis = app.redis
  const model = app.model
  // const redis = app.redis.get('sys')
  const key = 'config'

  class ConfigService extends app.Service {

    /**
     * 设置指定配置项
     * 
     * @param {string} field 配置项名称
     * @param {string} value 配置值。注意：不能是object，否则redis存储会出问题
     * @memberof ConfigService
     */

    async setConf(field, value) {
      await redis.xhset(key, field, value)
      await model.Config.findOneAndUpdate({ _id: field }, { $set: { value, _id: field } }, { upsert: true, new: true })
    }

    /**
     * 获取指定配置项
     * 
     * @param {string} field 配置项名称
     * @returns {any} 配置值
     * @memberof ConfigService
     */

    async getConf(field) {
      let conf
      const { logger } = this
      conf = await redis.xhget(key, field)
      if (conf) {
        return conf
      }
      conf = await model.Config.findById(field)
        .catch(e => {
          logger.error(new Error(e.message))
        })
      if (conf) {
        conf = conf.toObject()
        await redis.xhset(key, field, conf.value)
        return (conf.value)
      }
      return false
    }

    /**
     * 获取bot参数
     * 
     * @param {any} bot_name 
     * @returns 
     * @memberof ConfigService
     */

    async getBot(bot_name) {
      const bot_list = await this.getConf('bot.list')
      if (bot_name && bot_list && Array.isArray(bot_list)) {
        for (const bot of bot_list) {
          if (bot.name === bot_name) {
            return bot
          }
        }
      }
    }

    /**
     * 获取建群用的其他alias
     * 
     * @param {any} bot_name 
     * @returns 
     * @memberof ConfigService
     */

    async getRoomAlias() {
      const list = await this.getConf('room.alias')
      if (list && Array.isArray(list)) {
        return list
      }
      return list && [].push(list)
    }

    /**
     * 获取地图参数
     * 
     * @returns 
     * @memberof ConfigService
     */

    async getMapConf() {
      const map = await this.getConf('mapConf')
      const ret = {}
      if (map && map.key && map.referer) {
        ret.key = map.key
        ret.referer = map.referer
      }
      return ret
    }
  }
  return ConfigService;
};
