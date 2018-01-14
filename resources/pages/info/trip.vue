<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">我的行程</h2>
        </div>
      </div>
    </div>
    <template v-for="trip in myTrips">
      <my-trip :key="trip.tid" :data="trip" :wx-ready="wx_ready"></my-trip>
    </template>
  </div>
</template>

<script>
import myTrip from "~/components/my-trip.vue";
import axios from "axios";
import { isIOSWeChat } from "~/assets/js/utils";

export default {
  data: function() {
    return {
      showInfo: true,
      myTrips: [],

      loading: false,
      wx_config: {
        // debug: true,
        // appId: '',
        // timestamp: 0,
        // nonceStr: '',
        // signature: '',
        // jsApiList: []
      },
      wx_ready: false
    };
  },
  components: {
    myTrip
  },
  mounted() {
    if (this.wx_config.signature) {
      this.loadWxSdk();
    } else {
      this.getJsSign();
    }
    this.loadTrips();
  },
  beforeRouteEnter(to, from, next) {
    // XXX: 修复iOS版微信HTML5 History兼容性问题
    if (isIOSWeChat() && to.path !== location.pathname) {
      // 此处不可使用location.replace
      location.assign(to.fullPath);
    } else {
      next();
    }
  },
  methods: {
    getJsSign() {
      console.log("使用 getJsSign() 加载js签名");
      axios
        .get(
          "/api/web/getJsSign?url=" + encodeURIComponent(window.location.href)
        )
        .then(res => {
          const data = res.data;
          if (!data.data || !data.data.sign) {
            console.log("获取微信jsapi调用签名失败！");
          }
          this.wx_config = data.data.sign;
          this.loadWxSdk();
        })
        .catch(e => {
          weui.topTips("获取微信jsapi调用签名错误!");
        });
    },
    loadWxSdk() {
      if (!wx) {
        return;
      }
      if (!this.wx_config.signature) {
        console.log("初始化异常！缺少wx jsapi配置！");
        return;
      }
      this.wx_config.jsApiList = [
        "onMenuShareAppMessage",
        "onMenuShareTimeline"
      ];
      wx.config(this.wx_config);

      wx.ready(() => {
        this.wx_ready = true;
      });
      wx.error(res => {
        // weui.topTips("微信jsapi异常！错误信息如下:\n" + JSON.stringify(res));
        // alert(window.location);
        // alert(location);
        console.error("微信jsapi异常！错误信息如下:\n%s\n", JSON.stringify(res));
      });
    },
    loadTrips() {
      if (this.loading) {
        return;
      }
      this.loading = true;
      const loading = weui.loading("正在加载...");
      //TODO:要根据api实际返回数据结构更改
      axios
        .get("/api/web/getTripLog")
        .then(res => {
          loading.hide();
          // alert(JSON.stringify(res.data))
          const data = res.data;

          switch (data.errCode) {
            case 0:
              this.myTrips = data.data.trips;
              // console.log(this.myTrips)
              this.trip_count = data.data.count || 0;
              weui.toast("载入完成！<br>共载入" + this.trip_count + "条行程", 1000);
              break;

            case 11:
            case 12:
            case 13:
              weui.confirm("需要刷新页面以重新登陆。<br>如果不重新登陆，将不能正常使用页面部分功能！", {
                buttons: [
                  {
                    label: "取消",
                    type: "defalut"
                  },
                  {
                    label: "确定",
                    type: "primary",
                    onClick: function() {
                      window.location.href =
                        window.location.origin +
                        "/mp_auth?to=" +
                        encodeURIComponent(window.location.href);
                    }
                  }
                ]
              });
              break;

            case 21:
              weui.topTips("请求参数错误!");
              break;

            case 31:
              weui.topTips(data.errMsg || data.data.msg || "操作失败!");
              break;

            case 51:
              weui.topTips("系统错误！");
              break;

            default:
              weui.topTips(data.errMsg);
              break;
          }
        })
        .catch(e => {
          // DEBUG: 开发期间
          this.myTrips = [];
          loading.hide();
          console.error("searchTrip() 请求API: getTripLog 失败");

          weui.topTips("加载失败...", 2000);
        });
      this.loading = false;
    }
  },
  layout: "wxApp"
};
</script>
<style>
</style>
