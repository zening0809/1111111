'use strict';

// NOTE: 一期未用

module.exports = app => {
  class OssService extends app.Service {

    /**
     * 上传资源，返回可访问的url
     * 
     * @param {any} { name, file } 
     * @returns 
     * @memberof OssService
     */

    async upload({ name, file }) {
      const { app, logger } = this
      const { oss } = app
      if (!name || !file) {
        return false
      }
      try {
        const ret = await oss.put(name, file)
        if (!ret.url) {
          logger.error('\n upload() 使用oss上传失败，返回数据: \n%s\n', JSON.stringify(ret))
          return false
        }
        return ret.url
      } catch (e) {
        logger.error('\n upload() 使用oss上传失败: \n%s\n', JSON.stringify(e))
        return false
      }
    }

  }
  return OssService;
};
