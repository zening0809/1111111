<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;"> 行程信息</h2>
        </div>
      </div>
    </div>
    <div class="weui-form-preview">
      <div class="weui-form-preview__ft">
        <a class="weui-form-preview__btn weui-form-preview__btn_primary" @click="joinTrip">我要乘车</a>
      </div>
    </div>
    <div class="weui-form-preview">
      <div class="weui-form-preview__bd ">
        <!-- <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">司机姓名：</label>
            <span class="weui-form-preview__value">{{driver.wx_nickname}}</span>
          </div>
        </div> -->
        <!-- <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">信用值：</label>
            <span class="weui-form-preview__value">{{driver.credit}} 分</span>
          </div>
        </div> -->
        <div class="weui-flex">
          <div class="weui-flex__item" style="-webkit-box-flex: 2.5;-webkit-flex: 2.5;flex: 2.5;">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">司机：{{driver.wx_nickname}}</label>
            </div>
          </div>
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">信用：{{driver.credit}}</label>
            </div>
          </div>
        </div>
        <div class="weui-flex">
          <div class="weui-flex__item" style="-webkit-box-flex: 2.4;-webkit-flex: 2.4;flex: 2.4;">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">车型：{{driver.car_model}}</label>
            </div>
          </div>
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">颜色：{{driver.car_color}}</label>
            </div>
          </div>
          <div class="weui-flex__item">
            <div class="placeholder">
              <label class="weui-form-preview__label no-min-width">尾号：{{carNo}}</label>
            </div>
          </div>
        </div>
      <!-- </div>
    </div>
    <br/>
    <div class="weui-form-preview">
      <div class="weui-form-preview__bd "> -->
        <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">{{tripInfo}} </label>
          </div>
        </div>
        <!-- <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">截止时间：</label>
            <span class="weui-form-preview__value">{{formatDate(trip.close_time)}}</span>
          </div>
        </div> -->
        <!-- <div class="weui-form-preview__item">
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
        <!-- <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">预期人数：</label>
            <span class="weui-form-preview__value">{{trip.min_seat}} 至 {{trip.max_seat}} 人</span>
          </div>
        </div> -->
        <!-- <div class="weui-form-preview__item">
          <div class="placeholder">
            <label class="weui-form-preview__label no-min-width">价格：</label>
            <span class="weui-form-preview__value">{{trip.price}}元</span>
          </div>
        </div> -->
      </div>
    </div>
        <show-map :sloc="trip.sloc" :eloc="trip.eloc" :dsize='280'></show-map>
    <!-- <div v-show="showInput">
      <div class="weui-cells__title">填写乘车信息：</div>
      <div class="weui-cells weui-cells_form">
        <div class="weui-cell weui-cell_select weui-cell_select-after" style="padding: 10px 15px;">
          <div class="weui-cell__hd">
            <label for="" class="weui-label">乘坐人数：</label>
          </div>
          <div class="weui-cell__bd ">
            <select class="weui-select" name="select_seat" v-model="seatNum">
                <option :value="i" v-for="i in 5" :key="i">{{i}} 人</option>
              </select>
          </div>
        </div>
      </div>
      <div class="weui-btn-area">
        <a class="weui-btn weui-btn_primary" id="showTooltips" @click="joinTrip">确定乘车</a>
      </div>
    </div> -->
  </div>
</template>

<script>
import axios from "axios";
import { formatDate } from "~/assets/js/date";
import showMap from "~/components/showMap.vue";
import { isIOSWeChat } from "~/assets/js/utils";

export default {
  data: function() {
    return {
      driver: {},
      // const ret = {
      //   name: user.name,
      //   wx_nickname: user.wx_nickname,
      //   credit: user.credit,
      //   car_model: user.car_model,
      //   car_color: user.car_color,
      //   intro: user.intro,
      // }
      seatNum: 1,
      tid: "",
      showInput: false,
      lock: false,
      wx_config: {
        // debug: true,
        // appId: '',
        // timestamp: 0,
        // nonceStr: '',
        // signature: '',
        // jsApiList: []
      },
      trip: {
        // tid: String,
        // time: String,
        // close_time: String,
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
      return (this.driver.car_no || "").substr(-3, 3);
    },
    tripInfo() {
      return this.trip.time
        ? this.trip.price +
            "元，" +
            this.formatDate(new Date(this.trip.time)) +
            "，从 " +
            this.startName +
            " 到 " +
            this.endName
        : "";
    }
  },
  validate({ params }) {
    return params.tid && /^[\w-]+$/.test(params.tid);
  },
  components: {
    showMap
  },
  mounted() {
    this.tid = this.$route.params.tid;
    if (!this.tid) {
      weui.alert("未指定行程！", () => {
        this.$router.push({ name: "index" });
      });
      return;
    }
    this.getTripInfo();
    if (this.wx_config.signature) {
      this.loadWxSdk();
    } else {
      this.getJsSign();
    }

    this.$refs.container.style.height =
      document.documentElement.clientHeight - 50 + "px";
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
        const shareData = {
          title:
            "车找人" +
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
    },
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
    getTripInfo() {
      if (!this.tid) {
        weui.topTips("未指定要查看的行程！");
        return;
      }
      const loading = weui.loading("正在加载行程信息...");
      axios
        .post("/api/web/getTripInfo", {
          tid: this.tid
        })
        .then(res => {
          loading.hide();
          const data = res.data;
          if (data && data.errCode == 0) {
            this.driver = data.data.driver;
            this.trip = data.data.trip;
            this.trip.sloc = this.convertLoc(this.trip.sloc);
            this.trip.eloc = this.convertLoc(this.trip.eloc);
          } else {
            weui.topTips("加载行程信息失败！");
          }
        })
        .catch(e => {
          loading.hide();
          weui.topTips("信息加载失败！");
        });
    },
    joinTrip() {
      // console.log('触发 joinTrip()')
      if (this.lock) {
        return;
      }
      this.lock = true;
      if (!this.tid) {
        weui.alert("没有行程数据！");
        // console.log('joinTrip() 没有行程数据 ')
        this.lock = false;
        return;
      }
      if (!this.seatNum) {
        weui.topTips("请选择乘坐人数！");
        // console.log('joinTrip() 乘车人数错误：', this.seatNum)
        this.lock = false;
        return;
      }
      const loading = weui.loading("操作中...");
      axios
        .post("/api/web/joinTrip", {
          tid: this.tid,
          seat: this.seatNum
        })
        .then(res => {
          loading.hide();
          //TODO: 需要增加操作失败的原因提醒
          const data = res.data;
          switch (data.errCode) {
            case 0:
              weui.toast("乘车请求提交成功！稍后系统会自动将您拉入对应行程的微信群中，请注意查看！", {
                duration: 3000,
                callback: function() {
                  this.$router.replace({
                    name: "index"
                  });
                }
              });
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
          // DEBUG: 开发期间填充数据
          console.log("请求API 失败: ", e);

          weui.alert("请求API失败!");
        });
      this.lock = false;
    }
  },
  layout: "wxApp"
};
</script>
