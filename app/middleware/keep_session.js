'use strict'

module.exports = () => {
  return function* (next) {
    yield next
    if (!this.session.openid) return
    this.session.save()
  }
}
