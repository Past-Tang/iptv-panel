import App from './App'
import Vue from 'vue'

// 在项目根目录中的main.js中，引入并使用uView的JS库，注意这两行要放在import Vue之后。
import uView from "uview-ui";
Vue.use(uView);


// 引入HTTP模块
import http from '@/common/http.js'
Vue.prototype.$http = http;

// import引入api.js并添加到Vue实例上
import api from "api/api.js"
Vue.prototype.$api = api;







Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	...App
})
app.$mount()
