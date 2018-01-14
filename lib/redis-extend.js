'use strict'

module.exports = app => {
  app.redis.xhset = async (key, field, value) => {
    const v = objToStr(value)
    const ret = await app.redis.hset(key, field, v)
    return ret
  }
  app.redis.xhget = async (key, field) => {
    const ret = await app.redis.hget(key, field)
    if (!ret) {
      return null
    }
    const v = strToObj(ret)
    return v
  }
  app.redis.xhgetall = async key => {
    const result = await app.redis.hgetall(key)
    console.log(result)
    if (result) {
      for (const field in result) {
        if (result.hasOwnProperty(field)) {
          result[field] = strToObj(result[field])
        }
      }
    }
    return result
  }


  function strToObj(str) {
    try {
      return JSON.parse(str)
    } catch (e) {
      return str
    }
  }

  function objToStr(obj) {
    try {
      return JSON.stringify(obj)
    } catch (e) {
      return obj
    }
  }

}
