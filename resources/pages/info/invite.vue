<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">我的邀请</h2>
        </div>
      </div>
    </div>

    <!-- // FIXME: banner显示区域 -->
    <div class="img-box">
      <img class="m-img" :src="headImg">邀请好友进行乘车或注册司机，可以获得不同信用分的提升！</img>
    </div>

    <div class="weui-form-preview">
      <div class="weui-form-preview__bd ">
        <div class="weui-form-preview__item">
          <div class="weui-flex">
            <div class="weui-flex__item flex25">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">我的好友</label>
              </div>
            </div>
            <div class="weui-flex__item flex2">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">生效时间</label>
              </div>
            </div>
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">信用变化</label>
              </div>
            </div>
          </div>
        </div>
        <template v-for="item in inviteLog">
          <div class="weui-form-preview__item" :key="item.id">
            <div class="weui-flex">
              <div class="weui-flex__item flex25">
                <div class="placeholder">
                  <label class="weui-form-preview__label no-min-width">{{item.name}}</label>
                </div>
              </div>
              <div class="weui-flex__item flex2">
                <div class="placeholder">
                  <label class="weui-form-preview__label no-min-width">{{ formatDate(item.createTime)}}</label>
                </div>
              </div>
              <div class="weui-flex__item">
                <div class="placeholder">
                  <label class="weui-form-preview__label no-min-width">+{{item.add_total}}分</label>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <br>
    <a @click="invite" class="weui-btn weui-btn_plain-primary">我要邀请</a>
  </div>
</template>

<script>
import axios from "axios";
import { formatDate } from "~/assets/js/date";
import { isIOSWeChat } from "~/assets/js/utils";

export default {
  data: function() {
    return {
      wx_config: {
        // debug: true,
        // appId: '',
        // timestamp: 0,
        // nonceStr: '',
        // signature: '',
        // jsApiList: []
      },
      wxShare: {
        timeline: {
          // title:'',
          // link:'',
          // imgUrl:'',
        },
        appMsg: {
          // title:'',
          // desc:'',
          // link:'',
          // imgUrl:'',
        }
      },
      inviteLog: [],
      inviteCount: 0,
      loading: false,
      headImg: "",
      shareLink: ""
    };
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
  mounted() {
    this.loadInvites();
    if (this.wx_config.signature) {
      this.loadWxSdk();
    } else {
      this.getJsSign();
    }
    this.shareLink =
      window.location.origin +
      "/share/invite/" +
      window.localStorage.getItem("inviteCode");
  },
  methods: {
    formatDate(date) {
      return formatDate(new Date(date), "yyyy年MM月dd日");
    },
    loadInvites() {
      if (this.loading) {
        return;
      }
      this.loading = true;
      const loading = weui.loading("正在加载中...", 3000);
      //TODO:要根据api实际返回数据结构更改
      axios
        .get("/api/web/getInviteLog")
        .then(res => {
          loading.hide();
          const data = res.data;

          switch (data.errCode) {
            case 0:
              this.inviteLog = data.data.log;
              // console.log(this.myTrips)
              this.inviteCount = data.data.count || 0;
              weui.toast("载入完成！<br>共载入" + this.inviteCount + "条邀请记录", 1000);
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
          loading.hide();
          this.inviteLog = [];
          console.error("loadInvites() 请求API: getInviteLog 失败");
          weui.topTips("数据加载失败");
        });
      this.loading = false;
    },
    getJsSign() {
      console.log("使用 getJsSign() 加载js签名");
      // weui.topTips('使用 getJsSign() 加载js签名')
      axios
        .get(
          "/api/web/getJsSign?url=" + encodeURIComponent(window.location.href)
        )
        .then(res => {
          const data = res.data;
          if (!data.data || !data.data.sign) {
            console.log("获取微信jsapi调用签名失败！");
            weui.topTips("获取微信jsapi调用签名失败！");
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
        console.error("初始化异常！缺少wx jsapi配置！");
        return;
      }
      this.wx_config.jsApiList = [
        "onMenuShareAppMessage",
        "onMenuShareTimeline"
      ];
      wx.config(this.wx_config);

      wx.ready(() => {
        const shareData = {
          title: "好友邀请你来借螃蟹",
          desc: "借螃蟹为你提供出行便利",
          link: this.shareLink,
          //TODO: 图标url需要替换为云端url
          imgUrl: window.location.origin + "/site/logo.jpg"
        };
        wx.onMenuShareTimeline(shareData);
        wx.onMenuShareAppMessage(shareData);
      });
      wx.error(res => {
        // weui.topTips("微信jsapi异常！错误信息如下:\n" + JSON.stringify(res));
        // alert(window.location);
        // alert(location);
        console.log("微信jsapi异常！错误信息如下:\n%s\n", JSON.stringify(res));
        // alert('微信jsapi异常！错误信息如下:\n%s\n', JSON.stringify(res))
      });
    },
    invite() {
      if (!this.wx_config.signature) {
        weui.alert("没有获取微信js签名，需要跳转到邀请页后按右上角进行分享！", {
          buttons: [
            {
              label: "OK",
              type: "primary",
              onClick: function() {
                window.location.href = this.shareLink;
              }
            }
          ]
        });
      } else {
        weui.toast("点击右上角的菜单，即可选择分享给好友或分享到朋友圈！");
      }
    },
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
          this.info = res.data.data.info;
          this.loading = false;
        })
        .catch(e => {
          loading.hide();
          weui.topTips("加载失败!");
          this.loading = false;
        });
    }
  },
  layout: "wxApp"
};
</script>
<style>
.flex2 {
  -webkit-box-flex: 2;
  -webkit-flex: 2;
  flex: 2;
}
.flex25 {
  -webkit-box-flex: 2.5;
  -webkit-flex: 2.5;
  flex: 2.5;
}
</style>
