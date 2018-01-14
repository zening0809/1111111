'use strict'

const UUID = require('uuid')
const moment = require('moment')
const crypto = require('crypto')
const xml2js = require('xml2js')

module.exports = {
  // 生成uuid，如果指定len为16则取其16位MD5值
  uuid(len) {
    let str = UUID.v1().replace(/-/g, '').toUpperCase()
    if (len === 16) {
      str = this.md5(str, 16)
    }
    return str
  },

  // 生成大写md5值，如果指定len为16则取中间16位
  md5(text, len = 32) {
    const md5 = crypto.createHash('md5')
    md5.update(text)
    let str = md5.digest('hex')
    const s = str.toUpperCase() // 32位大写 
    if (len === 16) {
      str = str.slice(7, 23)
    }
    return str
  },

  // 生成sha1签名
  sha1(str) {
    const hash = crypto.createHash('sha1')
    hash.update(str, 'utf8')
    return hash.digest('hex')
  },

  // 时间加法，增加量单位为秒
  addTime(time, addSec) {
    if (!addSec && typeof time === 'number') {
      addSec = time
      time = new Date()
    } else {
      time = new Date(time)
    }
    return new Date(time.getTime() + addSec * 1000)
  },

  // 检查url是否合法
  checkUrl(url) {
    return /^(http|https):\/\//.test(url)
  },

  /**
   * 转换地理信息格式，以便在数据库中保存
   * 
   * @param {any} loc 
   * @returns 
   */

  convertLoc(loc, onlyLoc) {
    const ret = {
      type: 'Point',
      // coordinates: loc.coordinates || null,
    }
    // console.log(loc)

    if (!loc.coordinates) {
      ret.coordinates = []
      const lat = loc.latlng && loc.latlng.lat || loc.lat || null
      const lng = loc.latlng && loc.latlng.lng || loc.lng || null

      if (lat && lng) {
        ret.coordinates.push(lng * 1)
        ret.coordinates.push(lat * 1)
      }
    } else {
      ret.coordinates = loc.coordinates
    }
    if (!onlyLoc) {
      ret.addr = loc.poiaddress || loc.addr || ''
      ret.name = loc.poiname || loc.name || ''
      ret.cityname = loc.cityname || loc.city || ''
    }
    return ret
  },

  formatDate(str = 'MM月DD日 HH时mm分', date = new Date()) {
    if (!date instanceof Date) {
      date = new Date(date)
    }
    moment.locale('zh-cn')
    return moment(date).format(str)
  },

  moment(date) {
    if (!date instanceof Date) {
      date = new Date(date)
    }
    moment.locale('zh-cn')
    return moment(date)
  },

  generateNonceString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const maxPos = chars.length;
    let noceStr = '';
    for (let i = 0; i < (length || 32); i++) {
      noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return noceStr;
  },

  buildXML(json) {
    const builder = new xml2js.Builder();
    return builder.buildObject(json);
  },

  async parseXML(xml) {
    const parser = new xml2js.Parser({
      trim: true, explicitArray: false,
      explicitRoot: false,
    })
    return await new Promise((resolve, reject) => {
      parser.parseString(xml, (err, result) => {
        if (err) {
          reject(err)
          return
        }
        resolve(result)
      })
    })
  },
}
