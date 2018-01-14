<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">借螃蟹</h2>
        </div>
      </div>
    </div>
    <div class="weui-cells__title" v-show="inviteInfo.name">
      <img style="width: 24px;height: 24px;" :src="inviteInfo.headImg"/>
      用户 {{inviteInfo.name}} 邀请你体验借螃蟹！
    </div>
    <div class="weui-form-preview" v-show="inviteInfo.name">
      <div class="weui-form-preview__bd ">
        <div class="weui-flex">
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">ta的信用分：{{inviteInfo.credit}} 分</label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="weui-loadmore weui-loadmore_line" v-show="!regUser">
      <span class="weui-loadmore__tips">注册绑定</span>
    </div>
    <div class="weui-form-preview" v-show="!regUser">
      <div class="weui-form-preview__bd ">
        <div class="weui-flex" v-show="!showCode">
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">
                步骤1.长按下图，扫码加好友
              </label>
            </div>
          </div>
        </div>
        <div class="weui-flex" v-show="showCode">
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">
                步骤2.长按复制验证码：
              </label>
            </div>
          </div>
          <div class="weui-flex__item">
            <div class="placeholder">
              <span>{{data.key}}</span>
            </div>
          </div>
        </div>
        <div class="weui-flex" v-show="showCode">
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">
                步骤3.长按下图，扫码加好友，发送验证码
              </label>
            </div>
          </div>
        </div>
        <div class="weui-flex">
          <div class="weui-flex__item">
            <div class="placeholder">
              <img :src="data.imgUrl" v-show="!!data.imgUrl" style="width: 200px;height: 200px;"/>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div class="weui-loadmore weui-loadmore_line">
      <span class="weui-loadmore__tips">螃蟹出行简介</span>
    </div>
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <div>【借螃蟹】提供在线行程撮合匹配服务，让你出行更方便。</div>
        </div>
      </div>
    </div>
    <div class="weui-loadmore">
      <span class="weui-loadmore__tips">
        <img class="weui-loadmore__tips" style="width: 200px;height: 200px;" src="/site/qrcode.jpg"></img>
      </span>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      inviteInfo: {
        // name: '测试员',
        // credit: 100,
        // headImg: '/qrcode.jpg',
      },
      data: {
        // key: '',
        // imgUrl: '',
      },
      ssr: false,
      showCode: false,
      regUser: false
    };
  },
  asyncData({ res }) {
    const data = res.nuxtData || {};
    data.ssr = true;
    return data;
  },
  mounted() {
    if (!this.ssr) {
      window.location.reload();
      return;
    }
    if (this.regUser) {
      window.location.href = window.location.origin;
    }
    console.error('页面错误: "%s"', this.error);
  }
};
</script>
<style>

</style>
