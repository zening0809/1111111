<template>
  <nuxt-link :to="infoUrl">
    <div class="weui-form-preview m-top">
      <div class="weui-form-preview__hd">
        <div class="weui-form-preview__item">
          <label class="weui-form-preview__label color">司机发布-拼车信息</label>
        </div>
      </div>
      <div class="weui-form-preview__bd ">
        <div class="weui-form-preview__item">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">从：{{data.sloc}}</label>
                <!-- <span class="weui-form-preview__value">距离沿线{{startDist}}公里</span> -->
              </div>
            </div>
          </div>
        </div>
        <div class="weui-form-preview__item">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">到：{{data.eloc}}</label>
                <!-- <span class="weui-form-preview__value">距离沿线{{endDist}}公里</span> -->
              </div>
            </div>
          </div>
        </div>
        <div class="weui-form-preview__item">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">时间：{{time}}</label>
                <!-- <span class="weui-form-preview__value">{{date}}</span> -->
              </div>
            </div>
          </div>
        </div>

        <div class="weui-form-preview__item">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">车型：{{data.car_model}}</label>
                <span class="weui-form-preview__value">费用：{{data.price}} 元/人</span>
              </div>
            </div>
          </div>
        </div>

        <div class="weui-form-preview__item">
          <div class="weui-flex">
            <div class="weui-flex__item">
              <div class="placeholder">
                <label class="weui-form-preview__label no-min-width">司机期望：</label>
                <span class="weui-form-preview__value left-align">{{data.memo}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nuxt-link>
</template>


<script>
import { formatDate } from '~/assets/js/date'
export default {
  name: 'trip',
  props: {
    data: Object,
  },
  computed: {
    infoUrl() {
      return this.data.tid ? ('/tripInfo/' + this.data.tid) : ''
    },
    // startDist() {
    //   //起点距离
    //   return 0.2
    // },
    // endDist() {
    //   //终点距离
    //   return 1.1
    // },
    time() {
      const time = new Date(this.data.time)
      return formatDate(time, 'yyyy年MM月dd日 hh点mm分')
    }
  }
}
</script>

<style>
.no-min-width {
  min-width: 0em;
}

.left-align {
  text-align: left;
}

.right-float {
  float: right;
}

.color {
  color: #000000;
}

.weui-form-preview__hd {
  line-height: 1.5em;
}
</style>
