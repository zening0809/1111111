'use strict'

module.exports = () => {
  return function* (next) {
    const { logger, app, req, helper } = this
    if (this.method === 'POST' && this.is('text/xml')) {
      // logger.debug('\n 中间件parsePostXML开始处理')
      const promise = new Promise((resolve, reject) => {
        let buf = ''
        req.setEncoding('utf8')
        req.on('data', chunk => {
          buf += chunk
        })
        req.on('end', () => {
          helper.parseXML(buf)
            .then(resolve)
            .catch(reject)
        })
      })
      yield promise.then(r => {
        req.body = r
      }).catch(e => {
        e.status = 400
      })
      // logger.debug('\n 中间件parsePostXML处理结束')
    }
    yield next
  }
}
