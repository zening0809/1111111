<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-flex">
      <div><div class="placeholder">
        <img src="/site/logo.jpg" class="logo" style="width: 80px;height: 80px;" />
      </div></div>
      <div class="weui-flex__item"><div class="placeholder">
        <br>
        <h2> 拼车就在借螃蟹 
        </h2>
      </div></div>
      <div><div class="placeholder">
        <br>
        <a href="/info/reward" class="weui-btn weui-btn_mini weui-btn_primary" style="margin-right: 10px;">打赏</a>
      </div></div>
    </div>
    <div class="weui-cells">
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">起点：</label>
        </div>
        <div class="weui-cell__bd">
          <input class="weui-input" type="text" readonly="true" placeholder="点击选择起点" :value="slocAddr" onfocus="this.blur()" @click="openMap(true)" />
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">终点：</label>
        </div>
        <div class="weui-cell__bd">
          <input class="weui-input" type="text" readonly="true" placeholder="点击选择终点" :value="elocAddr" onfocus="this.blur()" @click="openMap(false)" />
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">时间：</label>
        </div>
        <div class="weui-cell__bd">
          <input class="weui-input" type="datetime-local" value="" placeholder="" v-model="time" />
        </div>
      </div>
      <div class="button-sp-area">
        <a @click="searchTrip" class="weui-btn weui-btn_plain-primary" :class="{'weui-btn_disabled':inSearch}">搜索行程</a>
      </div>
    </div>
    <tx-map v-model="showMap" @chooseMap="onMap" @hide="showMap=false"></tx-map>
    <div class="weui-form-preview__hd" v-show="trips.length<1">
      <br>
      <div class="weui-form-preview__item" style="text-align: center;">暂时没有任何行程信息
      </div>
      <br>
    </div>
    <div class="page__bd">
      <template v-for="trip in trips">
          <trip :key="trip.tid" :data="trip"></trip>
      </template>
    </div>
    <div class="button-sp-area">
      <a @click="loadTrip" class="weui-btn weui-btn_plain-primary">刷新最新行程</a>
    </div>
  </div>
</template>

<script>
import TxMap from "~/components/TxMap.vue";
import Trip from "~/components/trip";
import axios from "axios";
import { formatDate, newDate } from "~/assets/js/date";
export default {
  data: function() {
    return {
      showMap: false,
      sloc: {},
      eloc: {},
      chooseLoc: "",
      time: "",
      trips: [],
      trip_count: 0,
      //TODO:后期实现分页查询
      tid: "",
      inSearch: false,
      loading: false
    };
  },
  props: {
    mapKey: String,
    mapReferer: String
  },
  components: {
    TxMap,
    Trip
  },
  computed: {
    slocAddr() {
      if (this.sloc && this.sloc.poiaddress) {
        return this.sloc.poiname;
      }
    },
    elocAddr() {
      if (this.eloc && this.eloc.poiaddress) {
        return this.eloc.poiname;
      }
    }
  },
  created() {
    if (this.$route.query && this.$route.query.tid) {
      this.tid = this.$route.query.tid;
    }
    // console.log('created 中得到tid: %s', this.tid)
  },
  mounted() {
    if (this.tid) {
      axios
        .post("/api/web/getTripInfo", {
          tid: this.tid,
          detail: true
        })
        .then(res => {
          const data = res.data;
          console.group("getTripInfo");
          console.log("getTripInfo 返回：", JSON.stringify(data));
          if (data && data.errCode == 0) {
            const trip = data.data.trip;
            this.sloc = this.convertLoc(trip.sloc);
            this.eloc = this.convertLoc(trip.eloc);
            this.time = formatDate(new Date(trip.time), "yyyy-MM-ddThh:mm");
            if (!this.sloc.latlng || !this.sloc.latlng) {
              weui.topTips("加载指定行程数据，未能获得地点坐标！");
            }
            console.log(
              "首页加载匹配结果，使用行程数据：\n%s",
              JSON.stringify({
                sloc: this.sloc,
                eloc: this.eloc,
                time: this.time
              })
            );
            this.searchTrip();
          } else {
            weui.topTips(data.errMsg || "加载行程信息失败！");
          }
        })
        .catch(e => {
          console.error("错误：", e);
          weui.topTips("信息加载失败！");
        });
      console.groupEnd();
    } else {
      this.loadTrip();
    }
    this.time = formatDate(new Date(), "yyyy-MM-ddThh:mm");
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
    convertLoc(loc) {
      //将服务器端存储格式的坐标数据转换为腾讯地图格式
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
    // scroll(event) {
    //   console.log("触发scroll: ", event);
    // },
    // scroll2(event) {
    //   console.log("触发scroll2: ", event);
    // },
    openMap(isStart) {
      this.chooseLoc = "";
      if (isStart) {
        this.chooseLoc = "sloc";
      } else {
        this.chooseLoc = "eloc";
      }
      this.showMap = true;
    },
    onMap(event) {
      // console.log('onMap 收到事件信息:', event)
      const loc = event;
      if (loc && loc.module === "locationPicker") {
        // console.log('onMap chooseLoc为:', this.chooseLoc)
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
    // TODO: 要增加查询分页
    searchTrip() {
      if (this.inSearch) {
        return;
      }
      this.inSearch = true;
      const query = {
        time: newDate(this.time),
        sloc: this.sloc,
        eloc: this.eloc
      };
      if (!query.sloc.poiaddress) {
        weui.topTips("没有选择起点！");
        this.inSearch = false;
        return;
      }
      if (!query.eloc.poiaddress) {
        weui.topTips("没有选择终点！");
        this.inSearch = false;
        return;
      }
      if (query.time < new Date()) {
        weui.topTips("出发时间要晚于现在哦！");
        this.inSearch = false;
        return;
      }
      const loading = weui.loading("正在搜索中...", 1000);
      axios
        .post("/api/web/findTrip", query)
        .then(res => {
          loading.hide();
          const data = res.data;
          switch (data.errCode) {
            case 0:
              this.trips = data.data.trips;
              console.log("搜索结果：", JSON.stringify(this.trips));
              this.trip_count = data.data.count || 0;
              weui.toast("搜索完成！\n搜索到" + this.trip_count + "条行程");
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
          loading.hide();
          console.log("searchTrip() 请求API: getTrip 失败");
          weui.topTips("搜索失败!");
        });
      this.inSearch = false;
    },
    loadTrip() {
      if (this.loading) {
        return;
      }
      this.loading = true;
      const loading = weui.loading("加载中...", 1000);
      axios
        .get("/api/web/nowTrip")
        .then(res => {
          loading.hide();
          const data = res.data;
          if (data.errCode !== 0) {
            weui.topTips(data.errMsg);
            return;
          }
          // console.log('data: ' + JSON.stringify(data))
          this.trips = data.data.trips;
          // console.log('trips: ' + JSON.stringify(this.trips))
          this.trip_count = data.data.count;
          // weui.toast('加载完成！')
          this.loading = false;
        })
        .catch(e => {
          loading.hide();
          // this.trips = []
          // for (var i = 0; i < 10; i++) {
          //   this.trips.push({ tid: 'id-xxx-' + i })
          // }
          weui.topTips("加载失败!");
          this.loading = false;
        });
    }
  },
  layout: "wxApp"
};
</script>
