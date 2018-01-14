<template>
  <div>
    <script type="text/javascript" src="https://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
    <script type="text/javascript" src="https://res.wx.qq.com/open/libs/weuijs/1.1.2/weui.min.js"></script>
    <nuxt/>
    <wx-footer/>
  </div>
</template>

<script>
import WxFooter from "../components/WxFooter.vue";

export default {
  components: {
    WxFooter
  }
};
</script>
