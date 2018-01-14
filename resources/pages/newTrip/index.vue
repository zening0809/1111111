<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">发布行程</h2>
        </div>
      </div>
    </div>
    <div class="weui-tab m-top">
      <div class="weui-navbar" style="position: relative;">
        <div class="weui-navbar__item" :class="{'weui-bar__item_on':isDriver}" @click="isDriver=true">
          我是司机
        </div>
        <div class="weui-navbar__item" :class="{'weui-bar__item_on':!isDriver}" @click="isDriver=false">
          我是乘客
        </div>
      </div>
      <div class="m-top">
        <div class="weui-cells m-top" v-show="isDriver">
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">出发地址：</label>
            </div>
            <div class="weui-cell__bd">
              <input class="weui-input" type="text" readonly="true" placeholder="点击选择出发地点" :value="slocAddr" onfocus="this.blur()" @click="openMap(true)" />
            </div>
          </div>
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">终点地址：</label>
            </div>
            <div class="weui-cell__bd">
              <input class="weui-input" type="text" readonly="true" placeholder="点击选择目的地点" :value="elocAddr" onfocus="this.blur()" @click="openMap(false)" />
            </div>
          </div>
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">出发时间：</label>
            </div>
            <div class="weui-cell__bd">
              <input class="weui-input" type="datetime-local" value="" placeholder="" v-model="time" />
            </div>
          </div>
          <!-- <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">截止时间：</label>
            </div>
            <div class="weui-cell__bd">
              <input class="weui-input" type="datetime-local" value="" placeholder="" v-model="closeTime" />
            </div>
          </div> -->
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label for="" class="weui-label">期望人数：</label>
            </div>
            <div class="weui-cell__bd ">
              <div class="weui-flex">
                <div class="weui-flex__item">
                  <div class="placeholder select-after">
                    <select class="weui-select" name="select_seat" v-model="minSeat">
                          <option :value="i" v-for="i in 5" :key="i">{{i}} 人</option>
                        </select>
                  </div>
                </div>
                <div class="weui-flex__item">
                  <div class="placeholder weui-select">
                    至
                  </div>
                </div>
                <div class="weui-flex__item">
                  <div class="placeholder select-after">
                    <select class="weui-select" name="select_seat" v-model="maxSeat">
                          <option :value="i" v-for="i in 5" :key="i">{{i}} 人</option>
                        </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">每人 A费：</label>
            </div>
            <div class="weui-cell__bd">
              <input class="weui-input" type="number" placeholder="每人出点A费均摊油钱" v-model="price" />
            </div>
            元
          </div>
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">备注：</label>
              <br>
              <br>
              <br>
            </div>
            <div class="weui-cell__bd">
              <textarea class="weui-textarea" placeholder="可以填写你对乘客的留言。" rows="3" v-model="memo"/></textarea>
              <div class="weui-textarea-counter">
                <span>{{memo.length || 0}}/50</span>
              </div>
            </div>
          </div>

          <div class="weui-cell weui-cell_switch">
            <div class="weui-cell__bd">创建周期行程</div>
            <div class="weui-cell__ft">
              <input class="weui-switch" type="checkbox" v-model="isCycle">
            </div>
          </div>
          <div class="weui-cells__title"  v-show="isCycle">选择每周哪天自动创建行程（多选）</div>
          <div class="weui-cells weui-cells_checkbox" v-show="isCycle">
            <label class="weui-cell weui-check__label" v-for="s in week" :key="s.id">
                <div class="weui-cell__hd" :key="s.id">
                    <input type="checkbox" class="weui-check" v-model="chooseWeek[s.id]">
                    <i class="weui-icon-checked"></i>
                </div>
                <div class="weui-cell__bd" :key="s.id">
                    <p>{{s.name}}</p>
                </div>
            </label>
          </div>
          <div class="weui-cell">
            <div class="weui-cell__bd">
              <a @click="pubTrip" class="weui-btn weui-btn_plain-primary" :class="{'weui-btn_disabled':inPub}">发布行程</a>
            </div>
          </div>
        </div>
        <div class="weui-cells m-top" v-show="!isDriver">
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">出发地址：</label>
            </div>
            <div class="weui-cell__bd">
              <input class="weui-input" type="text" readonly="true" placeholder="点击选择出发地" :value="slocAddr" onfocus="this.blur()" @click="openMap(true)" />
            </div>
          </div>
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">终点地址：</label>
            </div>
            <div class="weui-cell__bd">
              <input class="weui-input" type="text" readonly="true" placeholder="点击选择目的地" :value="elocAddr" onfocus="this.blur()" @click="openMap(false)" />
            </div>
          </div>
          <div class="weui-cell">
            <div class="weui-cell__hd">
              <label class="weui-label">出发时间：</label>
            </div>
            <div class="weui-cell__bd">
              <input class="weui-input" type="datetime-local" v-model="time" />
            </div>
          </div>

          <div class="weui-cell weui-cell_switch">
            <div class="weui-cell__bd">创建周期行程</div>
            <div class="weui-cell__ft">
              <input class="weui-switch" type="checkbox" v-model="isCycle">
            </div>
          </div>
          <div class="weui-cells__title"  v-show="isCycle">选择每周哪天自动创建行程（多选）</div>
          <div class="weui-cells weui-cells_checkbox" v-show="isCycle">
            <label class="weui-cell weui-check__label" v-for="s in week" :key="s.id">
                <div class="weui-cell__hd" :key="s.id">
                    <input type="checkbox" class="weui-check" v-model="chooseWeek[s.id]">
                    <i class="weui-icon-checked"></i>
                </div>
                <div class="weui-cell__bd" :key="s.id">
                    <p>{{s.name}}</p>
                </div>
            </label> 
          </div>
          <div class="weui-cell">
            <div class="weui-cell__bd">
              <a @click="pubTrip" class="weui-btn weui-btn_plain-primary" :class="{'weui-btn_disabled':inPub}">发布行程123 </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <tx-map :map-loc="loc" v-model="showMap" @chooseMap="onMap" @hide="showMap=false"></tx-map>
  </div>
</template>

<script>
import TxMap from "~/components/TxMap.vue";
import axios from "axios";
import { formatDate, newDate } from "~/assets/js/date";
export default {
  data: function() {
    return {
      isDriver: true,
      sloc: {},
      eloc: {},
      loc: {},
      time: "",
      closeTime: "",
      minSeat: 2,
      maxSeat: 4,
      price: 10,
      memo: "",
      isCycle: false,
      week: [
        { id: "0", name: "周日" },
        { id: "1", name: "周一" },
        { id: "2", name: "周二" },
        { id: "3", name: "周三" },
        { id: "4", name: "周四" },
        { id: "5", name: "周五" },
        { id: "6", name: "周六" }
      ],
      chooseWeek: [],

      gid: "",
      chooseLoc: "",
      showMap: false,
      inPub: false,
      loading: false
    };
  },
  props: {
    mapConf: {
      key: String,
      referer: String
    }
  },
  components: {
    TxMap
  },
  computed: {
    slocAddr() {
      if (this.sloc && this.sloc.poiaddress) {
        return this.sloc.poiname;
        // } else {
        //   return "点击选择出发地"
      }
    },
    elocAddr() {
      if (this.eloc && this.eloc.poiaddress) {
        return this.eloc.poiname;
        // } else {
        //   return "点击选择出发地"
      }
    }
  },
  mounted() {
    const trip = JSON.parse(window.localStorage.getItem("trip")) || {};
    if (trip.sloc && trip.eloc) {
      this.sloc = trip.sloc;
      this.eloc = trip.eloc;
      // this.time = new Date(trip.time)
      // this.closeTime = new Date(trip.closeTime)
      this.minSeat = trip.minSeat || this.minSeat;
      this.maxSeat = trip.maxSeat || this.maxSeat;
      this.price = trip.price || 0;
      this.memo = trip.memo || "";
      this.isDriver = !!trip.isDriver;
    }
    //可以在url后附加gid参数说明行程创建于某个微信群
    this.gid = this.$route.query.gid;
    this.time = formatDate(new Date(), "yyyy-MM-ddThh:mm");
    this.closeTime = formatDate(new Date(), "yyyy-MM-ddThh:mm");
    this.$refs.container.style.height =
      document.documentElement.clientHeight - 50 + "px";
    console.log("container初始化高度: %s", this.$refs.container.style.height);
    const that = this;
    this.$nextTick(() => {
      window.onresize = () => {
        return (() => {
          that.$refs.container.style.height = window.innerHeight - 50 + "px";
          console.log("container新高度: %s", that.$refs.container.style.height);
        })();
      };
    });
  },
  watch: {
    sloc(val) {
      if (val && val.poiname === "我的位置") {
        this.sloc = this.checkLoc(val);
        // console.log("已经修改sloc");
      }
    },
    eloc(val) {
      if (val && val.poiname === "我的位置") {
        this.eloc = this.checkLoc(val);
        // console.log("已经修改eloc");
      }
    }
  },
  methods: {
    checkLoc(loc) {
      if (loc && loc.poiname === "我的位置") {
        loc.poiname = loc.poiaddress.replace(/[^区]+区/, "") || loc.poiaddress;
      }
      return loc;
    },
    openMap(isStart) {
      this.chooseLoc = "";
      if (isStart) {
        this.chooseLoc = "sloc";
        this.loc = this.sloc;
      } else {
        this.chooseLoc = "eloc";
        this.loc = this.eloc;
      }
      this.showMap = true;
    },
    onMap(event) {
      const loc = event;
      if (loc && loc.module === "locationPicker") {
        switch (this.chooseLoc) {
          case "sloc":
            this.sloc = loc;
            break;
          case "eloc":
            this.eloc = loc;
            break;
          default:
            break;
        }
      }
    },
    pubTrip() {
      console.log("触发 pubTrip()");
      if (this.inPub) {
        return;
      }
      this.inPub = true;
      const data = {
        isDriver: this.isDriver,
        sloc: this.sloc,
        eloc: this.eloc,
        time: newDate(this.time)
      };
      if (data.time < new Date()) {
        weui.topTips("出发时间要晚于现在哦！");
        this.inPub = false;
        return;
      }
      if (this.isDriver) {
        this.closeTime = this.time;
        data.close_time = newDate(this.closeTime) || data.time;
        data.min_seat = this.minSeat || 1;
        data.max_seat = this.maxSeat || 1;
        data.price = this.price || 0;
        data.memo = this.memo || "";
        if (data.close_time > data.time) {
          weui.topTips("截止时间不能晚于出发时间！");
          this.inPub = false;
          return;
        }
        if (data.close_time < new Date()) {
          weui.topTips("截止时间要晚于现在哦！");
          this.inPub = false;
          return;
        }
        if (data.min_seat > data.max_seat) {
          const tmp = data.max_seat;
          data.max_seat = data.min_seat;
          data.min_seat = tmp;
        }
        if (data.min_seat < 1 || data.max_seat > 10) {
          weui.topTips("期望人数设置不正确！");
          this.inPub = false;
          return;
        }
        if (data.memo && data.memo.length > 30) {
          weui.topTips("备注字数不能超过30字符！");
          this.inPub = false;
          return;
        }
      }
      if (!data.sloc || !data.eloc || !data.time) {
        weui.topTips("信息要填写完整哦！");
        this.inPub = false;
        return;
      }
      if (this.gid) {
        data.gid = this.gid;
      }
      if (this.isCycle) {
        data.cycle = true;
        data.week_cycle = [];
        for (const i in this.chooseWeek) {
          data.week_cycle.push(i);
        }
      }
      const loding = weui.loading("操作中...");
      const router = this.$router;
      //TODO:要根据api实际返回数据结构更改
      axios
        .post("/api/web/pubTrip", data)
        .then(res => {
          loding.hide();
          const data = res.data;
          console.log(res.data,1111111111111);
          switch (data.errCode) {
            case 0:
              weui.toast("行程发布成功！系统会在后台为你进行匹配，然后以单人聊天告知您。", {
                duration: 3000,
                callback: function() {
                  router.push({
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
          console.error("请求API 失败: ", e);
          loding.hide();
          weui.alert("请求API失败!");
        });
      this.inPub = false;
    }
  },
  layout: "wxApp"
};
</script>

<style>
.weui-label {
  width: auto;
}
</style>
