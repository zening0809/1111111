'use strict'

module.exports = appInfo => {
    return {

        // use for cookie sign key, should change to your own and keep security
        keys: appInfo.name + '_1505738154039_1092',

        // add your config here
        middleware: [
            'requestTime',
            'errorHandler',
            'keepSession',
            'wxAuth',
            'parsePostXml',
            'nuxt',
            'apiDebug',
            'apiError',
            'checkFromWx',
            'webApiAuth',
            'wxJsapiSign',
        ],

        security: {
            csrf: {
                // 微信支付的通知回调发送的是xml格式，需要允许其通过
                ignore: '/hook/',
                ignoreJSON: true, // 默认为 false，当设置为 true 时，将会放过所有 content-type 为 `application/json` 的请求
            },
        },

        nuxt: require('./config.nuxt'),

        session: {
            key: 'EGG_SESS',
            maxAge: 24 * 3600 * 1000,
            // httpOnly: true,
            // encrypt: false,
        },

        // redis插件配置
        redis: {
            client: {
                host: '127.0.0.1',
                port: '6379',
                family: 4,
                password: null,
                db: 0,
            },
        },

        // mongoose插件配置
        mongoose: {
            url: '127.0.0.1:27017',
            options: {},
        },

        // 阿里oss配置
        oss: {
            client: {
                accessKeyId: 'your access key',
                accessKeySecret: 'your access secret',
                bucket: 'your bucket name',
                endpoint: 'oss-cn-hongkong.aliyun.com',
                timeout: '60s',
            },
        },

        // socket.io插件配置
        io: {
            namespace: {
                '/bot': {
                    connectionMiddleware: ['auth'],
                    packetMiddleware: ['filter'],
                },
            },
        },

        // session 配置
        sessionRedis: {
            // name: 'web',
        },

        // 强制微信web 授权中间件配置
        wxAuth: {
            ignore: ctx => {
                // 不强制使用微信授权的路由
                const rules = [
                    /^\/api/i,
                    // /^\/bind/i,
                    /^\/bot/i,
                    // /^\/admin/i,
                    /^\/mp_auth/i,
                    /^\/hook\//i,
                    /^\/site/i,
                    /^\/share/i,
                    /^\/web\/share/i,
                    /^\/__webpack/i,
                    /^\/[\w]+\.[\w]+$/i,
                    // /^\/\?nsukey=/i,
                ]
                // ctx.logger.debug('本次访问路径："%s" ', ctx.url)
                if (ctx.method === 'GET') {
                    for (const rule of rules) {
                        if (rule.test(ctx.url)) {
                            // ctx.logger.debug('路径匹配成功："%s" 使用正则: "%s"', ctx.url, rule)
                            return true
                        }
                        // ctx.logger.debug('路径匹配失败："%s" 使用正则: "%s"', ctx.url, rule)
                    }
                    // } else {
                    //   ctx.logger.debug('直接跳过匹配 "%s" 类型访问', ctx.method)
                }
                // ctx.logger.debug('未匹配 "%s"，应进入中间件', ctx.url)
                return false
            },
        },
        // web Api访问权限过滤 中间件配置
        webApiAuth: {
            match: /^\/api\/web/i,
        },

        // 将所有的api访问进行过滤，如果没有正确的返回结果，统一返回-1
        apiError: {
            match: '/api/',
        },

        // 限制仅允许微信浏览器通过访问
        checkFromWx: {
            match: '/api/web',
        },

        // API访问信息输出中间件，默认关闭
        apiDebug: {
            match: /^\/api\/.*/i,
            enable: false,
        },

        // 微信jsapi签名中间件
        wxJsapiSign: {
            match: ctx => {
                const rules = [
                    /^\/share\//i,
                    // /^\/web\/share/i,
                    /^\/info\//i,
                ]
                // ctx.logger.debug('本次访问路径："%s" ', ctx.url)
                if (ctx.method === 'GET') {
                    for (const rule of rules) {
                        if (rule.test(ctx.url)) {
                            return true
                        }
                    }
                }
                return false
            },
        },

        // 域名
        host: 'http://lywxtest.free.ngrok.cc',

        // 行程相关参数配置
        trip: {
            groupNamePrefix: '螃蟹出行群#',
            // 行程匹配的截止时间控制
            deadline_time: {
                max: 120,
                min: 30,
            },
            // 查询坐标差值：500米
            loc: {
                near: 500,
            },
            // 同一行程参与批量处理的间隔时间，单位为秒
            batch_diff_time: 120,

            // 行程匹配的前后时间差，单位为分钟
            diff_time: 30,

            // 查询行程历史返回记录数量限制
            trip_log_limit: 10,
            // 匹配行程返回结果数量限制
            trip_match_limit: 10,

            // 限制用户每天加入司机群的数量
            // NOTE: 一期不用
            user_join_group_limit: 3,

            // 行程单价 元/公里
            unit_price: 1,
            // 最大座位数
            max_seat: 10,
        },

        // 微信公众平台参数
        mp_dev: {
            appid: 'wx894e6adf793412fd',
            appsecret: '422ac986b4d1ba5112a5854457ecc44f',
        },

        // 腾讯地图参数
        mapConf: {
            key: 'YMTBZ-HGZKS-J2EOE-6VMEA-FYQR2-K2FDE',
            referer: 'myapp',
        },

        // 微信支付参数
        wx_pay: {
            appid: '',
            mch_id: '',
            sign_key: '',
        },

        // bot配置
        bot: {
            imgUrl: './site/qr.jpg',
        },
        bots: {
            bot10086: {
              enabled: true,
              imgUrl: './site/qr.jpg', // 机器人的二维码图片url        
              sckey: '', // server酱通知调用key
            },
        },

        // 是否使用Server酱通知，false则使用batorange的通知服务
        useFtqqNotify: true,

        // 建群的初始成员alias列表
        roomBaseAlias: [],

    }
}
