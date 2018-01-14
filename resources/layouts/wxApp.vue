<template>
  <div class="weui-tab mian-body" id="layout">
    <!-- <link rel="stylesheet" href="https://res.wx.qq.com/open/libs/weui/1.1.2/weui.min.css"> -->
    <script type="text/javascript" src="https://res.wx.qq.com/open/libs/weuijs/1.1.2/weui.min.js"></script>
    <script type="text/javascript" src="https://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
    <div class="weui-tab__panel" ref="viewBoxBody">
      <nuxt />
    </div>
    <div class="weui-tabbar" v-show="!hideTabbar" ref="tabbar">
      <nuxt-link class="weui-tabbar__item" to="/">
        <img src="~assets/img/icon_nav_button.png" alt="" class="weui-tabbar__icon">
        <p class="weui-tabbar__label">拼车信息</p>
      </nuxt-link>
      <nuxt-link class="weui-tabbar__item" to="/newTrip">
        <img src="~assets/img/icon_nav_msg.png" alt="" class="weui-tabbar__icon">
        <p class="weui-tabbar__label">发布行程</p>
      </nuxt-link>
      <nuxt-link class="weui-tabbar__item" to="/info">
        <img src="~assets/img/icon_nav_article.png" alt="" class="weui-tabbar__icon">
        <p class="weui-tabbar__label">个人中心</p>
      </nuxt-link>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      hideTabbar: false
    };
  },
  mounted() {
    if (!window.localStorage.getItem("inviteCode")) {
      console.log("localStorage中没有邀请码，将从服务器获取");
      axios
        .get("/api/web/getInfo")
        .then(res => {
          const data = res.data.data;
          if (data.inviteCode && window.localStorage) {
            window.localStorage.setItem("inviteCode", data.inviteCode);
            console.log("将mapSet存放到local中了");
          }
        })
        .catch(e => {
          console.warn("getMapKey() 出现catch: ", e);
        });
    }
  },
  methods: {
    scrollTo(top) {
      this.$refs.viewBoxBody.scrollTop = top;
    },
    getScrollTop() {
      return this.$refs.viewBoxBody.scrollTop;
    },
    getScrollBody() {
      return this.$refs.viewBoxBody;
    }
  }
};
</script>

<style>
.mian-body {
  height: 100%;
  width: 100%;
  position: inherit;
  background-color: #f8f8f8;
}
</style>
