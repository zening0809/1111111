<template>
  <div v-show="!hide">
    <br>
    <div class="weui-form-preview">
      <div class="weui-form-preview__bd ">
        <div class="weui-form-preview__item">
          <label class="weui-form-preview__label no-min-width">起点：</label>
          <span class="weui-form-preview__value left-align">{{startName}}</span>
        </div>
        <div class="weui-form-preview__item">
          <label class="weui-form-preview__label no-min-width">终点：</label>
          <span class="weui-form-preview__value left-align">{{endName}}</span>
        </div>
        <div class="weui-form-preview__item">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">出发：</label>
                <span class="weui-form-preview__value left-align">{{time}}</span>
              </div>
            </div>
            {{state}}
          </div>
        </div>
        <!-- <div class="weui-form-preview__item" v-show="data.type=='car'">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">截止：</label>
                <span class="weui-form-preview__value left-align">{{closeTime}}</span>
              </div>
            </div>
            到时乘客不足则取消
          </div>
        </div> -->
        <div class="weui-form-preview__item">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">里程：</label>
                <span class="weui-form-preview__value left-align">{{dist}}公里</span>
              </div>
            </div>
            <div class="weui-flex__item" v-show="data.type=='car'">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">建议价格：</label>
                <span class="weui-form-preview__value left-align">{{price}}元/人</span>
              </div>
            </div>
            <div class="weui-flex__item" v-show="data.type=='person'">
              <div class="placeholder">
                <span class="weui-form-preview__value">乘客行程</span>
              </div>
            </div>
          </div>
        </div>
        <div class="weui-form-preview__item" v-show="data.type=='car'">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">最少乘客：</label>
                <span class="weui-form-preview__value left-align">{{data.min_seat}}人</span>
              </div>
            </div>
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">最多乘客：</label>
                <span class="weui-form-preview__value left-align">{{data.max_seat}}人</span>
              </div>
            </div>
          </div>
        </div>
        <br>
        <div class="weui-form-preview__item">
          <div class="weui-flex" v-show="this.data.state=='open'">
            <div class="weui-flex__item">
              <div class="placeholder">
                <a @click="closeTrip(true)" class="weui-btn weui-btn_mini weui-btn_plain-default">完成行程</a>
              </div>
            </div>
            <div class="weui-flex__item">
              <div class="placeholder">
                <a @click="closeTrip(false)" class="weui-btn weui-btn_mini weui-btn_plain-default">取消行程</a>
              </div>
            </div>
            <div class="weui-flex__item">
              <div class="placeholder">
                <a @click="shareTrip(data)" class="weui-btn weui-btn_mini weui-btn_plain-default">分享行程</a>
              </div>
            </div>
          </div>
          <div class="weui-flex" v-show="this.data.state!='open'">
            <div class="weui-flex__item">
              <div class="placeholder">
                <a @click="pubTrip(data)" class="weui-btn weui-btn_mini weui-btn_plain-default">再次发布</a>
              </div>
            </div>
            <div class="weui-flex__item">
              <div class="placeholder">
                <a @click="delTrip(data)" class="weui-btn weui-btn_mini weui-btn_plain-default">删除行程</a>
              </div>
            </div>
            <div class="weui-flex__item">
              <div class="placeholder">
                <a @click="shareTrip(data)" class="weui-btn weui-btn_mini weui-btn_plain-default">分享行程</a>
              </div>
            </div>
      <!--  <div class="weui-flex__item">
              <div class="placeholder">
                <a @click="likeTrip(data)" class="weui-btn weui-btn_mini weui-btn_plain-default">赞赏行程</a>
              </div>
            </div>
            <div class="weui-flex__item">
              <div class="placeholder">
                <a @click="complainTrip(data)" class="weui-btn weui-btn_mini weui-btn_plain-default">投诉行程</a>
              </div>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import axios from "axios";
import { formatDate } from "~/assets/js/date";

export default {
  name: "my-trip",
  data() {
    return {
      hide: false,
      locker: false
    };
  },
  props: {
    data: {},
    wxReady: Boolean
  },
  computed: {
    startName() {
      //起点名称
      return this.data.sloc.name;
    },
    endName() {
      //起点名称
      return this.data.eloc.name;
    },
    dist() {
      //行程距离
      return this.data.dist || "未知";
    },
    time() {
      //行程时间，需要转换
      const time = new Date(this.data.time);
      return formatDate(time, "yyyy年MM月dd日 hh点mm分");
    },
    closeTime() {
      const time = new Date(this.data.closeTime || this.data.time);
      return formatDate(time, "MM月dd日 hh点mm分");
    },
    price() {
      //标价，每人xx元
      return this.data.price;
    },
    state() {
      const enum_state = {
        open: "进行中",
        done: "已完成",
        canceled: "已取消",
        timeout: "超时关闭"
      };
      return enum_state[this.data.state] || "未知状态";
    }
  },
  methods: {
    delTrip(done) {
      if (this.locker) {
        return;
      }
      this.locker = true;
      const loading = weui.loading("操作中...");
      axios
        .post("/api/web/delTrip", { tid: this.data.tid })
        .then(res => {
          loading.hide();
          const data = res.data;
          switch (data.errCode) {
            case 0:
              this.hide = true;
              weui.toast("操作成功!<br>行程已删除！");
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
          weui.topTips("操作失败...", 2000);
        });
      this.locker = false;
    },
    closeTrip(done) {
      if (this.locker) {
        return;
      }
      this.locker = true;
      const loading = weui.loading("操作中...");
      axios
        .post("/api/web/closeTrip", { tid: this.data.tid, done: !!done })
        .then(res => {
          loading.hide();
          const data = res.data;
          switch (data.errCode) {
            case 0:
              weui.toast("操作成功!<br>行程已" + (done ? "完成" : "取消"));
              this.data.state = done ? "done" : "canceled";
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
          weui.topTips("操作失败...", 2000);
        });
      this.locker = false;
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
    pubTrip(trip) {
      console.log("要再次发布行程：", JSON.stringify(trip));
      let content = "";
      const data = {
        isDriver: trip.type == "car" || false,
        sloc: this.convertLoc(trip.sloc),
        eloc: this.convertLoc(trip.eloc)
        // time: trip.time,
      };
      content = "起点：" + data.sloc.poiname + "<br>终点：" + data.eloc.poiname;
      if (data.isDriver) {
        // data.closeTime = trip.close_time
        data.minSeat = trip.min_seat || 1;
        data.maxSeat = trip.max_seat || 1;
        data.price = trip.price || 0;
        data.memo = trip.memo || "";
        content +=
          "<br>最少人数:" +
          data.minSeat +
          "<br>最多人数:" +
          data.maxSeat +
          "<br>每人A费:" +
          data.price;
      }
      console.log("准备好的行程数据：", JSON.stringify(data));
      const router = this.$router;
      // weui.dialog({
      //   title: "确认再次发布行程",
      //   content: "行程信息如下：<br>" + content,
      //   buttons: [
      //     {
      //       label: "取消",
      //       type: "default"
      //     },
      //     {
      //       label: "确定",
      //       type: "primary",
      //       onClick: function() {
      // 缓存行程数据，跳转到发布行程页
      window.localStorage.setItem("trip", JSON.stringify(data));
      console.log("存入local的数据为: %s", window.localStorage.getItem("trip"));
      router.push({ name: "newTrip" });
      //       }
      //     }
      //   ]
      // });
    },
    shareTrip(trip) {
      if (!this.wxReady) {
        weui.alert("微信JS载入失败！需要跳转到行程分享页后按右上角进行分享！", {
          buttons: [
            {
              label: "取消",
              type: "default"
            },
            {
              label: "OK",
              type: "primary",
              onClick: function() {
                window.location.href =
                  window.location.origin + "/share/trip/" + this.data.tid;
              }
            }
          ]
        });
        return;
      }

      const shareData = {
        title:
          (this.data.type === "car" ? "车找人" : "人找车") +
          formatDate(new Date(this.data.time), "hh点mm分") +
          this.startName +
          "到" +
          this.endName,
        desc: "点击进入借螃蟹查看行程信息",
        link: window.location.origin + "/share/trip/" + this.data.tid,
        //TODO: 图标url需要替换为云端url
        imgUrl: window.location.origin + "/site/logo.jpg"
      };
      console.log(shareData);
      wx.onMenuShareTimeline(shareData);
      wx.onMenuShareAppMessage(shareData);
      weui.toast("点击右上角的菜单，即可选择分享给好友或分享到朋友圈！");
    }
    // likeTrip(trip) {
    //   console.log("要赞赏行程：", trip);
    //   // 赞赏行程
    //   weui.dialog({
    //     title: "确认赞赏行程吗？",
    //     content: "行程信息为：\n",
    //     buttons: [
    //       {
    //         label: "取消",
    //         type: "default"
    //       },
    //       {
    //         label: "确定",
    //         type: "primary",
    //         onClick: function() {
    //           // TODO: 调用API 赞赏行程 #迭代#
    //         }
    //       }
    //     ]
    //   });
    // },
    // complainTrip(trip) {
    //   console.log("要投诉行程：", trip);
    //   let content =
    //     "起点：" +
    //     data.sloc.name +
    //     "\n终点：" +
    //     data.eloc.name +
    //     "\n出发时间：" +
    //     data.time;
    //   // 投诉行程
    //   weui.dialog({
    //     title: "确认投诉此次行程吗？",
    //     content: content,
    //     buttons: [
    //       {
    //         label: "取消",
    //         type: "default"
    //       },
    //       {
    //         label: "确定",
    //         type: "primary",
    //         onClick: function() {
    //           // TODO: 调用api投诉行程 #迭代#
    //         }
    //       }
    //     ]
    //   });
    // }
  }
};
</script>
