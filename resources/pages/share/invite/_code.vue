<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">好友邀请你体验借螃蟹</h2>
        </div>
      </div>
    </div>
    <br>
    <div class="weui-cells__title" v-show="inviteInfo.name">
      <img style="width: 24px;height: 24px;" :src="inviteInfo.headImg"></img>
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
    <div class="weui-form-preview__ft">
      <a class="weui-form-preview__btn weui-form-preview__btn_primary" v-show="link" :href="link">注册体验</a>
    </div>

    <div class="weui-loadmore weui-loadmore_line">
      <span class="weui-loadmore__tips">借螃蟹是什么</span>
    </div>
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <p></p>
          <div>【借螃蟹】提供在线行程撮合匹配服务，让你出行更方便。</div>
          <div><br></div>
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
import axios from 'axios'

export default {
  // layout: 'wxApp',
  data: function() {
    return {
      invite: '',
      link: '/bind',
      inviteInfo: {
        // name: '测试员',
        // credit: 100,
        // headImg: '/qrcode.jpg',
      },
      ssr: false,
    }
  },
  asyncData({ res }) {
    const data = res.nuxtData || {}
    data.ssr = true
    return data
  },
  mounted() {
    if (!this.ssr) {
      window.location.reload()
    }
    console.log('页面错误: "%s"', this.error)
  },
}
</script>
