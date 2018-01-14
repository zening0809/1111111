'use strict';
module.exports = {
  /*
   ** Headers of the page
   */
  // dev: false,
  dev: (process.env.NODE_ENV !== 'production'),
  rootDir: './',
  srcDir: './resources',
  buildDir: './.nuxt',
  cacheDir: './.cache',
  cache: {
    max: 1000,
    maxAge: 900000,
  },
  head: {
    title: '借螃蟹出行平台',
    meta: [{
      charset: 'utf-8',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, user-scalable=0',
    },
    {
      hid: 'description',
      name: 'description',
      content: '借螃蟹出行平台',
    },
    ],
    link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
      {
        rel: 'stylesheet',
        href: 'https://res.wx.qq.com/open/libs/weui/1.1.2/weui.min.css',
      },
    ],
  },
  /*
   ** Global CSS
   */
  css: [
    // '~assets/css/weui.min.css',
    '~assets/css/main.css',
  ],
  /*
   ** Customize the progress-bar color
   */
  loading: {
    color: '#3B8070',
  },
  plugins: [
  ],
  /*
   ** Build configuration
   */
  build: {
    loaders: [{
      test: /\.vue$/,
      loader: 'vue-loader',
    }],
    extend(config, ctx) {
      // if (ctx.isClient) {
      //   config.module.rules.push({
      //     enforce: 'pre',
      //     test: /\.(js|vue)$/,
      //     loader: 'eslint-loader',
      //     exclude: /(node_modules)/,
      //   })
      // }
    },
    vendor: [
      'axios',
    ],
    // 抽出"css"中设置的第三方样式
    extractCSS: true,
    // 修改打包路径
    publicPath: '/site/',
    filenames: {
      vendor: 'vendor.[hash].js',
      app: 'app.[chunkhash].js',
    },
    resolve: {
      extensions: ['.js', '.vue', '.json'],
    },
  },
}
