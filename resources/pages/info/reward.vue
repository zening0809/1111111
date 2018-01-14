<template>
  <div class="page__bd content" ref="container" style="overflow: auto;">
<script type="text/javascript" src="https://res.wx.qq.com/open/libs/weuijs/1.1.2/weui.min.js">

</script>

<script type="text/javascript" src="https://res.wx.qq.com/open/js/jweixin-1.2.0.js">

</script>
    <div class="title">
      <span>微信打赏</span>
      <span>微信安全支付</span>
    </div>
    <div class="userinfo">
      <div class="user-picture"><img src="/site/logo.jpg"></div>
      <div class="user-red">{{unum?'打赏用户'+unum:'打赏借螃蟹平台'}}</div>
      <div class="red-message">打赏，是认同与鼓励！</div>
      <div class="money-select">
        <div class="money-item" @click="newPay(5)">
          5 <span class="yuan">元</span>
        </div>
        <div class="money-item" @click="newPay(10)">
          10 <span class="yuan">元</span>
        </div>
        <div class="money-item" @click="newPay(20)">
          20 <span class="yuan">元</span>
        </div>
        <div class="money-item" @click="newPay(50)">
          50 <span class="yuan">元</span>
        </div>
        <div class="money-item" @click="newPay(100)">
          100 <span class="yuan">元</span>
        </div>
        <div class="money-item" @click="newPay(200)">
          200 <span class="yuan">元</span>
        </div>
      </div>
      <br>
      <div style="clear: both;padding-top: 25px;"></div>
      <div class="weui-flex" v-show="!other_user && !other_fee">
        <div class="weui-flex__item">
          <div class="placeholder">
            <div @click="other_user=true" class="weui-btn weui-btn_mini weui-btn_default">打赏其他用户</div>
          </div>
        </div>
        <div class="weui-flex__item">
          <div class="placeholder">
            <div @click="other_fee=true" class="weui-btn weui-btn_mini weui-btn_default">选择其他金额</div>
          </div>
        </div>
      </div>
      <div class="weui-cell" v-show="other_fee">
        <div class="weui-cell__hd"><label class="weui-label">
                          输入金额：
                          </label></div>
        <div class="weui-cell__bd">
          <input class="weui-input" type="number" pattern="[0-9]*" placeholder="请输入打赏金额" v-model="fee">
        </div>
        <div class="weui-cell__ft">
          元
        </div>
        <br>
      </div>
      <div class="weui-cell" v-show="other_user">
        <div class="weui-cell__hd"><label class="weui-label">用户编号：</label></div>
        <div class="weui-cell__bd">
          <input class="weui-input" type="number" pattern="[0-9]*" placeholder="请输入用户编号" v-model="new_unum">
        </div>
      </div>
      <div class="button-sp-area" v-show="other_fee">
        <a @click="newPay(fee)" class="weui-btn weui-btn_primary">打赏</a>
      </div>
      <div class="button-sp-area" v-show="other_user">
        <a @click="chooseUser" class="weui-btn weui-btn_primary">确认用户编号</a>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data: function() {
    return {
      fee: 0,
      unum: "",
      new_unum: "",
      other_fee: false,
      other_user: false,
      wx_config: {
        // debug: true
        // appId: '',
        // timestamp: 0,
        // nonceStr: '',
        // signature: '',
        // jsApiList: []
      }
    };
  },
  mounted() {
    if (this.wx_config.signature) {
      this.loadWxSdk();
    } else {
      this.getJsSign();
    }
    this.unum = this.$route.query.unum || "";
  },
  methods: {
    chooseUser() {
      if (!this.new_unum) {
        weui.toast("未输入用户编号，默认为打赏平台");
      } else if (!/\d+/.test(this.new_unum)) {
        weui.topTips("用户编号输入错误！请确认仅包含数字");
        return;
      }
      this.unum = this.new_unum;
      this.other_user = false;
    },
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
      this.wx_config.jsApiList = ["chooseWXPay"];
      wx.config(this.wx_config);
      wx.ready(() => {});
      wx.error(res => {
        console.log("微信jsapi异常！错误信息如下:\n%s\n", JSON.stringify(res));
      });
    },
    newPay(fee) {
      if (fee < 1) {
        weui.topTips("最低1元哦！");
        return;
      }
      axios
        .get(
          "/api/web/pay?fee=" +
            fee * 1 +
            (this.unum ? "&unum=" + this.unum : "")
        )
        .then(res => {
          const data = res.data;
          if (!data.data || !data.data.order) {
            weui.topTips(data.errMsg || "获取支付数据失败！");
            console.log("获取支付数据失败！");
            return;
          }
          const order = data.data.order;
          order.success = function(res) {
            weui.toast("感谢您对借螃蟹的认可与支持！", {
              duration: 2000,
              callback: function() {
                window.location.href = window.location.origin;
              }
            });
          };
          wx.chooseWXPay(order);
        })
        .catch(e => {
          weui.topTips("获取支付数据错误!");
        });
    }
  }
};
</script>

<style>
.money-select {
  height: 36px;
  padding-top: 15px;
  margin-left: 8%;
  margin-right: 8%;
}
.money-item {
  padding-top: 5px;
  padding-bottom: 5px;
  float: left;
  width: 30%;
  border: 2px solid #ff0700;
  border-radius: 5px;
  margin-top: 15px;
  margin-right: 2%;
  color: #ff0700;
  font-size: 22px;
  font-style: oblique;
}
.money-item .yuan {
  font-size: 14px;
  font-style: normal;
}
.userinfo {
  padding: 40px 0 40px;
  text-align: center;
}
.title {
  height: 36px;
  padding: 20px 0;
  text-align: center;
  color: #f4fbec;
}
.title span {
  display: block;
  font-size: 18px;
  margin-top: -6px;
  font-weight: normal;
}
.user-picture {
  width: 124px;
  height: 124px;
  margin: 0 auto;
  border-radius: 50%;
  background-clip: border-box;
  box-shadow: rgba(0, 0, 0, 0.75) 0 0 6px;
}
.user-picture img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.content {
  margin: 0 auto;
  background: #fff url("~/assets/img/main-top.png") no-repeat center top;
  position: relative;
}
.money-input {
  clear: both;
  padding-top: 25px;
  text-align: center;
  color: #9932cc;
  font-size: 14px;
}
</style>

