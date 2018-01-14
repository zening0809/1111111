<template>
  <div v-show="show">
    <iframe id="mapPage" width="100%" height="200px" frameborder=0 :src="mapSrc" ref="mapFrame">
    </iframe>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "showMap",
  data() {
    return {
      mapSrc: "",
      mapKey: "",
      show: false,
      referer: ""
    };
  },
  props: {
    dsize: Number,
    sloc: Object,
    eloc: Object
  },
  computed: {
    src() {
      let s = "";
      if (this.sloc.latlng && this.eloc.latlng) {
        s =
          "http://apis.map.qq.com/tools/routeplan/topbar=0&footdetail=0&zoombutton=1&trafficbutton=0&transport=2&editstartbutton=0" +
          "&eword=" +
          this.eloc.poiname +
          "&epointx=" +
          this.eloc.latlng.lng +
          "&epointy=" +
          this.eloc.latlng.lat +
          "&sword=" +
          this.sloc.poiname +
          "&spointx=" +
          this.sloc.latlng.lng +
          "&spointy=" +
          this.sloc.latlng.lat +
          "?key=" +
          this.mapKey +
          "&referer=" +
          this.referer +
          "&back=0";
        console.log("地图的src为： %s", s);
      }
      return s;
    }
  },
  watch: {
    src(val) {
      if (val) {
        // console.log('src= "%s"', val);
        this.mapSrc = this.src;
      }
    }
  },
  mounted() {
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
    const win = window.document.getElementById("mapPage");
    win.onload = () => {
      if (this.mapSrc) {
        console.log("地图页面加载完毕");
        this.show = true;
      }
      const size = this.dsize || 270;
      win.style.height = window.innerHeight - size + "px";
      console.log("mapFrame新高度: %s", win.style.height);
    };
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
              JSON.stringify({
                key: this.mapKey,
                referer: this.referer
              })
            );
            console.log("将mapSet存放到local中了");
          }
          console.log("从api获取mapKey: %s", this.mapKey);
        })
        .catch(e => {
          loading.hide();
          console.warn("getMapKey() 出现catch: ", e);
        });
    }
  }
};
</script>
