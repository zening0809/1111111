<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">朋友向你分享{{trip.type=='car'?'司机':'乘客'}}行程信息</h2>
        </div>
      </div>
    </div>
    <!-- <br/> -->
    <div class="weui-cells__title">
      <img style="width: 24px;height: 24px;" :src="userInfo.headImg"></img>
      <span>
        <!-- {{trip.type=='car'?'司机行程':'乘客行程'}} -->
      {{userInfo.name}}（信用：{{userInfo.credit}}）        
      </span>
    </div>
    <div class="weui-form-preview">
      <div class="weui-form-preview__bd ">
        <!-- <div class="weui-flex">
          <div class="weui-flex__item" style="-webkit-box-flex: 2.5;-webkit-flex: 2.5;flex: 2.5;">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">姓名：{{userInfo.name}}</label>
            </div>
          </div>
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">信用值：{{userInfo.credit}}分</label>
            </div>
          </div>
        </div> -->
        <div class="weui-flex" v-show="trip.type=='car'">
          <div class="weui-flex__item" style="-webkit-box-flex: 2.4;-webkit-flex: 2.4;flex: 2.4;">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">车型：{{userInfo.car_model}}</label>
            </div>
          </div>
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">颜色：{{userInfo.car_color}}</label>
            </div>
          </div>
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">尾号：{{carNo}}</label>
            </div>
          </div>
        </div>

        <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">{{tripInfo}} </label>
          </div>
        </div>

      </div>
    <!-- </div> -->

    <!-- <div class="weui-cells__title">
      <span>行程信息：</span>
    </div> -->
    <!-- <div class="weui-form-preview">
      <div class="weui-form-preview__bd "> -->
        <!-- <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">出发时间：</label>
            <span class="weui-form-preview__value">{{trip.time?formatDate(trip.time):''}}</span>
          </div>
        </div>
        <div class="weui-form-preview__item" v-show="trip.type=='car'">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">截止时间：</label>
            <span class="weui-form-preview__value">{{trip.close_time?formatDate(trip.close_time):''}}</span>
          </div>
        </div>
        <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">出发地址：</label>
            <span class="weui-form-preview__value">{{trip.sloc.poiname}}</span>
          </div>
        </div>
        <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">终点地址：</label>
            <span class="weui-form-preview__value">{{trip.eloc.poiname}}</span>
          </div>
        </div> -->
        <!-- <div class="weui-form-preview__item" v-show="trip.type=='car'">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">预期人数：</label>
            <span class="weui-form-preview__value">{{trip.min_seat}} 至 {{trip.max_seat}} 人</span>
          </div>
        </div> -->
        <!-- <div class="weui-form-preview__item" v-show="trip.type=='car'">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">价格：</label>
            <span class="weui-form-preview__value">{{trip.price}}元</span>
          </div>
        </div>
      </div> -->
        <show-map :sloc="trip.sloc" :eloc="trip.eloc"></show-map>
      <div class="weui-form-preview__ft">
        <a class="weui-form-preview__btn weui-form-preview__btn_primary" v-show="regLink" :href="regLink">我要注册</a>
      </div>
      <div class="weui-form-preview__ft">
        <a class="weui-form-preview__btn weui-form-preview__btn_primary" v-show="tripLink" :href="tripLink">我要乘车</a>
      </div>
    </div>
    <div class="weui-loadmore" style="margin: 1em auto;">
      <span class="weui-loadmore__tips" >
        <img class="weui-loadmore__tips" style="width: 200px;height: 200px;" src="/site/qrcode.jpg"></img>
      </span>
    </div>

  </div>
</template>

<script>
import axios from "axios";
import { formatDate } from "~/assets/js/date";
import { isIOSWeChat } from "~/assets/js/utils";
import showMap from "~/components/showMap.vue";

export default {
  data: function() {
    return {
      regLink: "",
      tripLink: "",
      userInfo: {
        // name:'',
        // credit:0,
        // headImg:'',
      },
      ssr: false,
      wx_config: {
        // debug: true,
        // appId: '',
        // timestamp: 0,
        // nonceStr: '',
        // signature: '',
        // jsApiList: []
      },

      trip: {
        // time: String,
        // close_time: String,
        // type:String,
        type: "car",
        sloc: { poiname: "" },
        eloc: { poiname: "" },
        price: 0
        // min_seat: Number,
        // max_seat: Number,
        // memo: String,
        // car_model: String,
      }
    };
  },
  asyncData({ res }) {
    const data = res.nuxtData || {};
    data.ssr = true;
    return data;
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
  components: {
    showMap
  },
  computed: {
    startName() {
      //起点名称
      return this.trip.sloc.poiname || "";
    },
    endName() {
      //起点名称
      return this.trip.eloc.poiname || "";
    },
    carNo() {
      return (this.userInfo.car_no || "").substr(-3, 3);
    },
    tripInfo() {
      return this.trip.time
        ? (this.trip.type === "car" ? this.trip.price + "元，" : "") +
            this.formatDate(new Date(this.trip.time)) +
            "，从 " +
            this.startName +
            " 到 " +
            this.endName
        : "";
    }
  },
  mounted() {
    if (!this.ssr) {
      window.location.reload();
      return;
    }
    this.trip.sloc = this.convertLoc(this.trip.sloc);
    this.trip.eloc = this.convertLoc(this.trip.eloc);
    if (this.wx_config.signature) {
      this.loadWxSdk();
    } else {
      this.getJsSign();
    }
    if (this.error) {
      console.error('页面错误: "%s"', this.error);
    }
    console.log(JSON.stringify(this.trip));
  },
  validate({ params }) {
    return params.tid && /^[\w-]+$/.test(params.tid);
  },
  methods: {
    convertLoc(loc) {
      //将服务器端存储格式的坐标数据转换为腾讯地图格式
      console.log(loc);
      const data = {
        poiaddress: loc.addr || loc.poiaddress || "",
        poiname: loc.name || loc.poiname || "",
        cityname: loc.cityname || ""
      };
      if (
        Array.isArray(loc.coordinates) &&
        loc.coordinates.length > 1 &&
        !loc.latlng
      ) {
        data.latlng = {
          lat: loc.coordinates[1],
          lng: loc.coordinates[0]
        };
      }
      return data;
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
      this.wx_config.jsApiList = [
        "onMenuShareAppMessage",
        "onMenuShareTimeline"
      ];
      wx.config(this.wx_config);

      wx.ready(() => {
        this.wx_ready = true;
        const shareData = {
          title:
            (this.trip.type === "car" ? "车找人" : "人找车") +
            formatDate(new Date(this.trip.time), "hh点mm分") +
            this.startName +
            "到" +
            this.endName,
          desc: "点击进入借螃蟹查看行程信息",
          link: window.location.href,
          //TODO: 图标url需要替换为云端url
          imgUrl: window.location.origin + "/site/logo.jpg"
        };
        console.log(shareData);
        wx.onMenuShareTimeline(shareData);
        wx.onMenuShareAppMessage(shareData);
      });
      wx.error(res => {
        weui.topTips("微信jsapi异常！错误信息如下:\n" + JSON.stringify(res));
        alert(window.location);
        alert(location);
        console.error("微信jsapi异常！错误信息如下:\n%s\n", JSON.stringify(res));
      });
    },
    formatDate(date) {
      return formatDate(new Date(date), "yyyy年MM月dd日 hh点mm分");
    }
  }
};
</script>
