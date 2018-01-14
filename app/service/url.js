'use strict';
module.exports = app => {
  class UrlService extends app.Service {

    /**
     * 个人信息页
     * 
     * @memberof UrlService
     */

    async infoPage() {
      // 需要在这里返回完善信息页url
      return this.app.config.host + '/info/info?edit=true'
    }

    async batchPage() {
      // 需要在这里返回完善信息页url
      return this.app.config.host + '/'
    }

    async bindPage(showCode = false) {
      // 需要在这里返回绑定页url，如果showCode为true，则显示绑定码
      return this.app.config.host + '/bind' + (showCode && '?s=1')
    }

    async pubPage(gid) {
      // 需要在这里返回绑定页url，如果showCode为true，则显示绑定码
      return this.app.config.host + '/newTrip' + (gid && '?gid=' + gid)
    }

    async shareTripPage(tid) {
      return this.app.config.host + '/share/trip/' + tid
    }
  }
  return UrlService;
};
