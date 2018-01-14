<template>
  <div id="actionSheet_wrap" v-show="show" height="100%">
    <div class="weui-actionsheet full" v-bind:class="{ 'weui-actionsheet_toggle':show }" id="weui-actionsheet" height="100%">
      <div class="weui-actionsheet__title">
        <div class="weui-flex">
          <div>
            <div class="placeholder weui-btn weui-btn_mini weui-btn_default" @click="hideMap">取消</div>
          </div>
          <div class="weui-flex__item">
            <div class="placeholder weui-actionsheet__title-text">请在列表中选择目标地点</div>
          </div>
          <div>
            <div class="placeholder weui-btn weui-btn_mini weui-btn_primary" @click="retMap">确认</div>
          </div>
        </div>
      </div>
      <div class="weui-actionsheet__menu full" height="100%">
        <iframe id="mapPage" width="100%" height="100%" frameborder=0 :src="mapSrc" ref="mapFrame">
        </iframe>

      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "tx-map",
  data() {
    return {
      loc: {},
      mapSrc: "",
      mapKey: "",
      newLoc: false,
      referer: ""
    };
  },
  model: {
    prop: "show",
    event: "hide"
  },
  props: {
    show: Boolean,
    mapLoc: Object
  },
  computed: {
    src() {
      let s =
        "http://apis.map.qq.com/tools/locpicker?search=1&type=1&key=" +
        this.mapKey +
        "&referer=" +
        this.referer;
      if (this.mapLoc && this.mapLoc.latlng) {
        const { lat, lng } = this.mapLoc.latlng;
        if (lat && lng) {
          s += "&coord=" + lat + "," + lng;
        }
      }
      console.log("地图的src为： %s", s);
      return s;
    }
  },
  watch: {
    show(val, oldVal) {
      //实现首次显示地图组件时，才加载地图
      if (!this.mapSrc && val) {
        this.mapSrc = this.src;
      }
    }
  },
  mounted() {
    const win = this.$refs.mapFrame.contentWindow;
    win.parent.addEventListener(
      "message",
      event => {
        var loc = event.data;
        if (loc && loc.module == "locationPicker") {
          this.loc = loc;
          this.newLoc = true;
        }
      },
      false
    );
    if (window && window.localStorage) {
      console.log("存在localStorage");
      const mapSet = JSON.parse(window.localStorage.getItem("mapSet")) || {};
      if (mapSet.key && mapSet.referer) {
        this.mapKey = mapSet.key;
        this.referer = mapSet.referer;
        console.log("从local中读取到mapKey: %s", this.mapKey);
      } else {
        this.getMapKey();
      }
    }
    this.$nextTick(() => {
      this.screenHeight = window.screen.height;
    });
  },
  methods: {
    getMapKey() {
      const loading = weui.loading("正在载入中...");
      axios
        .get("/api/web/getInfo")
        .then(res => {
          loading.hide();
          const data = res.data.data;
          this.mapKey = data.mapConf.key;
          this.referer = data.mapConf.referer;
          if (this.mapKey && this.referer && window && window.localStorage) {
            window.localStorage.setItem(
              "mapSet",
              JSON.stringify({ key: this.mapKey, referer: this.referer })
            );
            console.log("将mapSet存放到local中了");
          }
          console.log("从api获取mapKey: %s", this.mapKey);
        })
        .catch(e => {
          loading.hide();
          console.warn("getMapKey() 出现catch: ", e);
        });
    },
    hideMap() {
      this.newLoc = false;
      this.$emit("hide", true);
    },
    retMap() {
      // console.log('已有定位信息：', this.loc);
      if (this.loc && this.loc.module === "locationPicker" && this.newLoc) {
        // console.log('即将返回定位信息：', this.loc);
        this.$emit("chooseMap", this.loc);
        this.hideMap();
        this.newLoc = false;
      } else {
        weui.topTips("请在下方的位置列表中选择一个地点哦！");
      }
    }
  }
};
</script>

<style>
.full {
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
  bottom: 0;
}
</style>

