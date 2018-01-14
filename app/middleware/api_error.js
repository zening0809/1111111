'use strict';
module.exports = (options, app) => {
  return function* (next) {
    yield next
    if (this.body === '' || this.status === 404) {
      this.body = {
        errCode: -1,
        errMsg: '',
      }
      this.status = 200
    }
  }
};
