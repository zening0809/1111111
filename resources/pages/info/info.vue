<template>
  <div class="page__bd" ref="container" style="overflow: auto;">
    <div class="weui-form-preview">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <h2 style="text-align: center;">{{isChange?'修改':'查看'}}我的资料</h2>
        </div>
      </div>
    </div>
    <div class="weui-cells__title">联系方式</div>
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">手机号：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="tel" placeholder="请输入手机号" v-model="info.phone">
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">微信号：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="text" placeholder="请输入微信号(非昵称)" v-model="info.wx_id">
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label for="" class="weui-label">默认联系：</label>
        </div>
        <div class="weui-cell__bd ">
          <div class="placeholder select-after">
            <select @focus="onFocus($event)" class="weui-select" v-model="info.useWay" :readonly="!isChange">
                <option value="phone">手机</option>
                <option value="wx">微信</option>
              </select>
          </div>
        </div>
      </div>
    </div>
    <div class="weui-cells__title">个人信息</div>
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">公&nbsp;司：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="text" placeholder="公司名称（非必填）" v-model="info.corp">
        </div>
      </div>
      <!-- <div class="weui-cell">
        <div class="weui-cell__hd">
          <label for="" class="weui-label">常用地址：</label>
        </div>
        <div class="weui-cell__bd select-after">
          <select class="weui-select">
              TODO: 需要添加删除地址的功能
            <option v-for="addr in info.addrs" :key="addr.id" :value="addr.id">{{addr.poiname}}</option>
          </select>
        </div>
      </div>
      <div class="weui-cell">
        <label for="" class="weui-label"></label>
        <a href="javascript:void(0);" class="weui-cell weui-cell_link">
          <div class="weui-cell__bd">添加更多</div>
        </a>
      </div> -->
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label for="" class="weui-label">性&nbsp;别：</label>
        </div>
        <div class="weui-cell__bd select-after">
          <select @focus="onFocus($event)" class="weui-select" v-model="info.gender" :readonly="!isChange">
              <option value="1">男</option>
              <option value="2">女</option>
              <option value="0">保密</option>
            </select>
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">车&nbsp;型：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="text" placeholder="车辆型号" v-model="info.car_model">
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">座位数：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="text" placeholder="车辆座位数" v-model="info.car_seat">
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">颜&nbsp;色：</label>
        </div>
        <div class="weui-cell__bd select-after">
          <select @focus="onFocus($event)" class="weui-select" v-model="info.car_color" :readonly="!isChange">
              <option value="白色">白色</option>
              <option value="灰色">灰色</option>
              <option value="黄色">黄色</option>
              <option value="粉色">粉色</option>
              <option value="红色">红色</option>
              <option value="紫色">紫色</option>
              <option value="绿色">绿色</option>
              <option value="蓝色">蓝色</option>
              <option value="棕色">棕色</option>
              <option value="黑色">黑色</option>
            </select>
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">车牌号：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="text" placeholder="" v-model="info.car_no">
        </div>
      </div>
      <!-- 新添加的住址 公司地址 上下班时间 -->
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">住址：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="text" placeholder="" v-model="info.address">
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">公司地址：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="text" placeholder="" v-model="info.company_address">
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">上班时间：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="time" placeholder="" v-model="info.office_hours">
        </div>
      </div>
      <div class="weui-cell">
        <div class="weui-cell__hd">
          <label class="weui-label">下班时间：</label>
        </div>
        <div class="weui-cell__bd">
          <input @focus="onFocus($event)" :readonly="!isChange" class="weui-input" type="time" placeholder="" v-model="info.off_hours">
        </div>
      </div>
    </div>
    <div class="weui-cells__title">个人简介</div>
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__bd">
          <textarea @focus="onFocus($event)" class="weui-textarea" placeholder="介绍下自己吧" rows="3" v-model="info.intro" :readonly="!isChange"></textarea>
          <div class="weui-textarea-counter">
            <span>{{info.intro && info.intro.length || 0}}/100</span>
          </div>
        </div>
      </div>
    </div>
    <!-- TODO: 修改/保存修改 -->
    <div class="weui-cells weui-cells_form">
      <div class="weui-cell">
        <div class="weui-cell__bd">
          <a @click="isChange=true" v-show="!isChange" class="weui-btn weui-btn_primary">修改资料</a>
          <a @click="save" v-show="isChange" class="weui-btn weui-btn_primary">保存资料</a>
        </div>
      </div>
    </div>
    <!-- <div class="weui-cells__title" >身份认证</div>
      <div class="weui-cells weui-cells_form">
        <div class="weui-cell">
          <div class="weui-cell__bd">
            <a @click="toAuth" class="weui-btn weui-btn_plain-primary">点击开始认证</a>
          </div>
        </div>
      </div> -->
    <br>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data: function() {
    return {
      info: {},
      loading: false,
      isChange: false,
      ssr: false
    };
  },
  asyncData({ res }) {
    if (res && res.nuxtData) {
      const data = res.nuxtData || {};
      data.ssr = true;
      return data;
    }
  },
  mounted() {
    if (!this.ssr) {
      window.location.reload();
      return;
    }
    // this.loadUserInfo()
    //TODO:判断是否为新用户并初始化信息
  },
  methods: {
    // 使用服务端渲染
    // loadUserInfo() {
    //   if (this.loading) {
    //     return;
    //   }
    //   this.loading = true;
    //   const loading = weui.loading("加载中...", 1000);
    //   axios
    //     .get("/api/web/getUserInfo")
    //     .then(res => {
    //       loading.hide();
    //       const data = res.data;
    //       if (data.errCode !== 0) {
    //         weui.topTips(data.errMsg);
    //       } else {
    //         this.info = res.data.data.info;
    //       }
    //       this.loading = false;
    //     })
    //     .catch(e => {
    //       loading.hide();
    //       weui.topTips("加载失败!");
    //       this.loading = false;
    //     });
    // },
    onFocus(event) {
      // console.log('当前元素为:')
      // console.log(event.srcElement)
      if (!this.isChange && event.type === "focus") {
        console.log(event);
        console.log(event.srcElement);
        // console.log('调用元素的blur方法')
        event.srcElement.blur();
      }
    },
    save() {
      this.isChange = false;
      const data = {};
      const fields = [
        "phone",
        "wx_id",
        "useWay",
        "addrs",
        "gender",
        "car_model",
        "car_seat",
        "car_color",
        "car_no",
        "address",
        "company_address",
        "office_hours",
        "off_hours",
        "is_send",
        "corp",
        "intro",             
      ];
      fields.forEach(i => {
        if (this.info[i] !== undefined) {
          data[i] = this.info[i];
        }
      });
      if (!data.phone && !data.wx_id) {
        weui.topTips("手机号和微信号请至少填一个！");
        this.isChange = true;
        return;
      }
      if (data.phone && !/^1[34578]\d{9}$/.test(data.phone)) {
        weui.topTips("手机号填写错误！");
        this.isChange = true;
        return;
      }
      if (data.wx_id && data.wx_id.length > 16) {
        weui.topTips("微信号字数过长！");
        this.isChange = true;
        return;
      }
      if (data.car_model && data.car_model.length > 8) {
        weui.topTips("车型字数不得超过8个字！");
        this.isChange = true;
        return;
      }
      if (data.car_seat && !(data.car_seat * 1 > 0)) {
        weui.topTips("座位数填写错误！请填写大于0的数字");
        this.isChange = true;
        return;
      }
      data.car_seat = data.car_seat * 1 || 0;
      if (data.car_color && data.car_color.length > 3) {
        weui.topTips("车辆颜色字数错误！");
        this.isChange = true;
        return;
      }
      const carNoRule = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/;
      data.car_no = data.car_no.replace(" ", "").toUpperCase();
      if (data.car_no && !carNoRule.test(data.car_no)) {
        weui.topTips("车牌号填写有误！");
        this.isChange = true;
        return;
      }
      if (data.corp && data.corp.length > 15) {
        weui.topTips("公司名称字数不得超过15字，请适当简写！");
        this.isChange = true;
        return;
      }
      if (data.intro && data.intro.length > 100) {
        weui.topTips("个人简介字数不得超过100字，请适当简写！");
        this.isChange = true;
        return;
      }
      
      const router = this.$router;
      axios
        .post("/api/web/setUserInfo", data)
        .then(res => {
          if (res.data && res.data.errCode === 0) {
            weui.toast("修改成功！", 2000);
            setTimeout(function() {
              router.push({
                name: "info"
              });
            }, 1000);
          } else {
            weui.alert("修改失败！");
            this.isChange = true;
          }
        })
        .catch(e => {
          weui.alert("提交失败！");
          this.isChange = true;
        });
    }
    // addAddr() {},
    // toAuth() {
    //   // TODO: 开始认证
    // }
  },
  layout: "wxApp"
};
</script>
