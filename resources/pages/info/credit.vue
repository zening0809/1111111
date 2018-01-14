<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">我的信用</h2>
        </div>
      </div>
    </div>
    <div class="weui-cells__title">我的螃蟹信用</div>
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__bd">
          <label>总信用值：</label>
        </div>
        <div class="weui-cell__bd">
          <p>{{info.credit_total || 0}} 分</p>
        </div>
      </div>
      <!-- <div class="weui-cell">
      <label>个人出行信用值：</label>
      </div>
      <div class="weui-cell__bd">
      <p>{{info.credit_trip}} 分</p>
      </div> -->
      <div class="weui-cell">
        <div class="weui-cell__bd">
          <label>邀请所得信用值：</label>
        </div>
        <div class="weui-cell__bd">
          <p>{{info.credit_subtype&&info.credit_subtype.invite || 0}} 分</p>
        </div>
      </div>
    </div>
    <div class="weui-cells__title">我的螃蟹积分</div>
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__bd">
          <label>总积分：</label>
        </div>
        <div class="weui-cell__bd">
          <p>{{info.score&&info.score.total || 0}} 分</p>
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__bd">
          <label>已生效积分：</label>
        </div>
        <div class="weui-cell__bd">
          <p>{{info.score&&info.score.valid || 0}} 分</p>
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__bd">
          <label>未生效积分：</label>
        </div>
        <div class="weui-cell__bd">
          <p>{{info.score&&info.score.freeze || 0}} 分</p>
        </div>
      </div>
    </div>
    <div class="weui-cells__title">螃蟹信用值说明</div>
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <p></p>
          <div>螃蟹信用是用户对【借螃蟹】支持的信用记录累计，每期都同等对待，但是早期的信用更珍贵。</div>
          <div><br></div>
          <div>为了报答用户对【借螃蟹】的信任和支持，【借螃蟹】在有能力的时候，会对用户进行感谢。</div>
          <div><br></div>
          <div>【借螃蟹】每期都会对信用价值进行重新评估，并根据自己能力，推出一个感谢用户的总额，用户可以按照先后申请的顺序，接受感谢，感谢总额用完即止。</div>
          <div><br></div>
          <div>对没有及时打赏的用户，可打赏值将逐步减少。</div>
          <div><br></div>
          <div>对于信用不好的用户，【借螃蟹】在有能力的时候，可以强制其接受感谢。</div>
          <div><br></div>
          <div>对于无法继续为【借螃蟹】提供支持的用户，【借螃蟹】在有能力的时候，会对其部分信用实时感谢。</div>
          <div><br></div>
          <div>所有的打赏都是基于自愿的原则，【借螃蟹】不能保证一定有能力感谢用户。</div>
        </div>
      </div>
    </div>
    <div class="button-sp-area">
      <a @click="invite" class="weui-btn weui-btn_plain-primary">我要邀请</a>
    </div>
    <br>
  </div>
</template>
<script>
import axios from "axios";
import { isIOSWeChat } from "~/assets/js/utils";
export default {
  data: function() {
    return {
      loading: false,
      info: {
        // credit_total: 0,
        // credit_invite: 0,
        //
      },
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
      shareLink: ""
    };
  },
  mounted() {
    this.loadUserInfo();
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
