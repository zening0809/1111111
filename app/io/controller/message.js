'use strict'

/**
 * 处理ws连接后身份认证登记
 */

module.exports = () => {
  return function* () {
    // const rev_event = 'rev_msg'
    // const rev_type = 'rev_bind'
    const data = this.args[0]
    // const data = {
    //   key: key,
    //   alias: string,
    //   nickname:
    //   userId: content.id,
    //   guest: boolean,  //如果是需要
    //   type: string, //地理信息 location
    //   url: string,//地理信息时 'http://apis.map.qq.com/uri/v1/geocoder?coord=40.075041,116.338994'
    //   msg: string //地理信息时为地点名称
    // }
    const { logger, service, helper } = this
    logger.debug('\n io.message data: \n%s', JSON.stringify(data))

    // TODO:对其他消息的处理与提取

    // if (!data.key || !data.nickname || (!data.alias && !!data.guest)) {
    //   return
    // }


    if (!data.msg) {
      return
    }

    // 保存聊天记录
    let rule = /^\s*(发布|发布行程|人找车|车找人).+$/i
    if (rule.test(data.msg)) {
      const userInfo = yield service.bot.getUserInfo(data)
      const groupInfo = yield service.bot.getGroupInfo(data)
      const msg = data.msg.replace(/^\s+/, '').replace(/\s+$/, '')
      if (userInfo) {
        yield service.bot.saveWxMsg({
          uid: userInfo.uid,
          gid: groupInfo.gid || null,
          msg,
          // 这里传入的日期是10位数字，精确到秒而非毫秒
          time: data.date && new Date(data.date * 1000) || null,
        })
          .catch(e => {
            logger.error('\n', e, '\n')
          })
      }
    }

    // 行程发布助手
    rule = /^\s*(发布|发布行程|人找车|车找人|注册|绑定).*$/i
    if (rule.test(data.msg)) {
      const userInfo = yield service.bot.getUserInfo(data)
      const groupInfo = yield service.bot.getGroupInfo(data)
      let msg = ''
      if (userInfo && userInfo.wx_openid) {
        const gid = groupInfo && groupInfo.gid || ''
        const url = yield service.url.pubPage(gid)
        msg = '请点击链接填写行程发布信息：\n' + url
      } else {
        const url = yield service.url.bindPage(true)
        msg = '未绑定平台账号，请先点击链接复制验证码，并发送给我进行绑定！\n链接： ' + url
      }
      this.socket.emit('rev_msg', {
        alias: data.alias,
        msg,
      })

      if (data.topic) {
        this.socket.emit('rev_msg', {
          alias: data.alias,
          topic: data.topic,
          msg: '已经通过私聊将填写链接发给您，请尽快查看填写！',
        })
      }
    }

    // 加群助手
    const keyRule = /^\s*(\d{5,7})\s*$/i
    let o = keyRule.exec(data.msg)
    if (o) {
      const groupKey = o[1]
      this.logger.debug('\n用户alias "%s" $s 尝试使用群key "%s"', data.alias, data.topic ? `在群 "${data.topic} " 中` : '', groupKey)
      const ret = yield service.bot.joinGroup({ alias: data.alias, key: groupKey })
      let msg = ''
      if (ret && ret.topic) {
        msg += `您要选择加入的群为： "${ret.topic}"\n稍后将邀请您进入此群`
      } else {
        msg += '无效的群口令'
      }
      this.socket.emit('rev_msg', {
        alias: data.alias,
        topic: data.topic,
        msg,
      })
    }

    rule = /^\s*#(设置群组|群组)\s*(.*)\s*$/i
    o = rule.exec(data.msg)
    if (o) {
      const cmd = o[1]
      const unionName = o[2].replace(/\s+$/i, '')
      const groupInfo = yield service.bot.getGroupInfo(data)
      if (!groupInfo) {
        logger.warn('\n获取群信息失败！\ndata数据：\n%s\n', JSON.stringify(data))
        return
      }
      if (!unionName) {
        this.socket.emit('rev_msg', {
          alias: data.alias,
          topic: data.topic,
          msg: groupInfo.union_name ? `当前群已经加入群组织 "${groupInfo.union_name}"` : '当前群未加入任何群组织',
        })
        return
      }
      const ret = yield service.group.setUnionName(groupInfo.gid, unionName)
      logger.debug('\n为群 "%s" 设置群组织名称 "%s" 结果 %s', data.topic, unionName, ret)
      this.socket.emit('rev_msg', {
        alias: data.alias,
        topic: data.topic,
        msg: `本群加入群组织 "${unionName}" ${ret ? '成功' : '失败'}`,
      })
    }
  }
}
