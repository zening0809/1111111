'use strict'


const WsMsgType = {
  bot_auth: 'auth',
  bot_scan: 'scan',
  bot_login: 'login',
  bot_logout: 'logout',
  bot_error: 'error',

  bot_get_data: 'get_data',
  bot_bind: 'bind',

  bot_pub_trip: 'pub_trip',
  bot_close_trip: 'close_trip',
  // bot_admin_cmd: 'admin_cmd',
  bot_report_state: 'report_state',
  // 就当做日志，暂不处理
  bot_message: 'message',
  // 房间建立完毕
  bot_created_room: 'created_room',
  // 房间被改名
  bot_room_topic: 'room_topic',

  // 服务端回复使用以下事件
  rev_auth: 'rev_auth',
  rev_msg: 'rev_msg',
  rev_data: 'rev_data',
  rev_command: 'rev_command',
}


module.exports = app => {
  const webApiAuth = app.middlewares.webApiAuth()
  const api = app.controller.api

  /** Bot Websocket 路由 */
  app.io.of('/bot').route(WsMsgType.bot_auth, app.io.controllers.auth)
  app.io.of('/bot').route(WsMsgType.bot_report_state, app.io.controllers.report)
  app.io.of('/bot').route(WsMsgType.bot_scan, app.io.controllers.scan)
  app.io.of('/bot').route(WsMsgType.bot_login, app.io.controllers.login)
  // app.io.of('/bot').route(WsMsgType.bot_logout, app.io.controllers.logout)
  // app.io.of('/bot').route(WsMsgType.bot_error, app.io.controllers.error)

  app.io.of('/bot').route(WsMsgType.bot_bind, app.io.controllers.bind)

  app.io.of('/bot').route(WsMsgType.bot_close_trip, app.io.controllers.closeTrip)

  app.io.of('/bot').route(WsMsgType.bot_message, app.io.controllers.message)

  app.io.of('/bot').route(WsMsgType.bot_created_room, app.io.controllers.createdRoom)
  // 微信群改名称
  app.io.of('/bot').route(WsMsgType.bot_room_topic, app.io.controllers.roomTopic)
  // 获取bot运行支持数据，如群信息列表
  app.io.of('/bot').route(WsMsgType.bot_get_data, app.io.controllers.getData)

  // // bot api
  // app.post('/api/bot', '')

  // // 公众号 网页授权回调
  app.get('auth', '/mp_auth', app.controller.auth.oauth)

  // // 公众号 API回调
  // app.get('/hook/mp', '')
  // app.post('/hook/mp', '')
  // 微信支付回调
  app.post('payHook', '/hook/pay', app.controller.hook.pay)


  // WEB前端页面，使用ssr渲染数据
  app.get('/bind', 'web.bind')
  app.get('/bind/:code', 'web.bind')
  app.get('/share/invite', 'web.shareInvite')
  app.get('/share/invite/:code', 'web.shareInvite')
  app.get('/share/trip', 'web.shareTrip')
  app.get('/share/trip/:tid', 'web.shareTrip')
  app.get('/info/info', 'web.infoPage')
  // 微信支付

  /** 公众平台 web页 api */
  // 获取页面调用微信jsapi的签名
  app.get('/api/web/getJsSign', api.web.getJsSign)
  // 获取基础信息，如地图调用token
  app.get('/api/web/getInfo', api.web.getInfo)
  // 请求Api后，系统返回一个绑定码和bot的二维码。用户需加bot发送绑定码完成绑定流程
  // app.get('/api/web/bind', api.web.bind)// 已更换为后端渲染
  // 司机认证
  // app.get('/api/web/auth', api.web.auth)
  // 获取用户信息
  app.get('/api/web/getUserInfo', api.web.getUserInfo)
  // 设置用户信息
  app.post('/api/web/setUserInfo', api.web.setUserInfo)
  // TODO:查询邀请记录
  app.get('/api/web/getInviteLog', api.web.getInviteLog)
  // 获取行程记录
  app.get('/api/web/getTripLog', api.web.getTripLog)
  // 搜索行程
  app.post('/api/web/findTrip', api.web.findTrip)
  // 加载最新行程
  app.get('/api/web/nowTrip', api.web.nowTrip)
  // 关闭/取消行程
  app.post('/api/web/closeTrip', api.web.closeTrip)
  // 删除行程（仅对用户隐藏）
  app.post('/api/web/delTrip', api.web.delTrip)
  // 加入行程
  app.post('/api/web/joinTrip', api.web.joinTrip)
  // 获取行程对应司机的信息
  app.post('/api/web/getTripInfo', api.web.getTripInfo)
  // 发布行程
  app.post('/api/web/pubTrip', api.web.pubTrip)

  // 发起微信支付
  app.get('/api/web/pay', api.web.pay)


  // 加载最新行程

  // // 管理后台web
  // app.get('/admin', '')

  // // 管理后台api
  // app.post('/api/admin', '')


}

