<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">个人中心</h2>
        </div>
      </div>
    </div>
    <div class="weui-loadmore">
      <span class="weui-loadmore__tips">
        <img class="weui-loadmore__tips" style="width: 120px;height: 120px;" :src="info.headImg"></img>
      </span>
    </div>
    <div v-show="showInfo">
      <div class="weui-flex">
        <div class="weui-flex__item">
          <div class="placeholder">编号: {{info.unum}} </div>
        </div>
      </div>
      <div class="weui-flex">
        <div class="weui-flex__item" style="-webkit-box-flex: 1.5;-webkit-flex: 1.5;flex: 1.5;">
          <div class="placeholder">车牌号:{{info.car_no}} </div>
        </div>
        <div class="weui-flex__item">
          <div class="placeholder">{{info.car_model}} </div>
        </div>
        <div class="weui-flex__item">
          <div class="placeholder">{{info.car_color}} </div>
        </div>
      </div>
      <br>
    </div>
    <div class="weui-grids">
      <nuxt-link class="weui-grid" to="/info/trip">
        <div class="weui-grid__label">我的行程</div>
      </nuxt-link>
      <nuxt-link class="weui-grid" to="/info/invite">
        <div class="weui-grid__label">我的邀请</div>
      </nuxt-link>
    </div>
    <div class="weui-grids">
      <nuxt-link class="weui-grid" to="/info/info">
        <div class="weui-grid__label">个人资料</div>
      </nuxt-link>
      <nuxt-link class="weui-grid" to="/info/credit">
        <div class="weui-grid__label">我的信用</div>
      </nuxt-link>
    </div>
    <br>
    <div class="button-sp-area">
      <a href="/info/reward" class="weui-btn weui-btn_primary">打赏</a>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data: function() {
    return {
      info: {
        headImg: "",
        unum: "",
        car_model: "",
        car_color: "",
        car_no: ""
      },
      loading: false
      // showInfo:false,
      // info: {
      //   uid: null,
      //   unum: null,
      //   phone: null,
      //   wx_id: null,
      //   useWay: null,
      //   wx_nickname: null,
      //   formal: null,
      //   addrs: [],
      //   recent_addrs: [],
      //   gender: null,
      //   car_model: null,
      //   car_color: null,
      //   car_no: null,
      //   corp: null,
      //   intro: null,
      //   credit: null,
      //   credit_trip: null,
      //   credit_invite: null,
      // },
    };
  },
  mounted() {
    this.loadUserInfo();
  },
  computed: {
    showInfo() {
      return this.info.car_no || false;
    }
  },
  methods: {
    loadUserInfo() {
      if (this.loading) {
        return;
      }
      this.loading = true;
      const loading = weui.loading("加载中...", 1000);
      axios
        .get("/api/web/getUserInfo")
        .then(res => {
          loading.hide();
          const data = res.data;
          switch (data.errCode) {
            case 0:
              this.info = data.data.info;
              // console.log(this.info);
              break;
            case 11:
            case 12:
            case 13:
              weui.confirm("需要刷新页面以重新登陆。如果不重新登陆，将不能正常使用页面部分功能！", {
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
            case 99:
              weui.topTips("你不是平台用户哦！");
              break;
            default:
              weui.topTips(data.errMsg || data.data.msg || "请求异常！");
              break;
          }
          this.loading = false;
        })
        .catch(e => {
          loading.hide();
          this.trips = [];
          weui.topTips("加载失败!");
          this.loading = false;
        });
    }
  },
  layout: "wxApp"
};
</script>
