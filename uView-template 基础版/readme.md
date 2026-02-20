### 项目目录信息

1.`/api/api.js` api请求的列表

2.`/common/config.js`  config配置请求的信息

3.`/common/http.js`  封装HTTP请求的方法

4.`node_modules`  安装的依赖/插件

5.`pages`  页面

6.`static`  静态资源

7.`utils`  封装的公共的方法



### 配置域名等信息

tips:在`/common/config.js`配置相应的信息，设置完之后会自动判断`开发环境`和`生产环境`

1.`devUrl`设置测试域名

2.`buildUrl`设置正式域名

3.`tokenUrl`设置获取token的域名



### 公用方法UTILS使用方法：

1.`checkAccount`校验用户名正则，默认6到16位（字母，数字，下划线，减号）

```js
this.$utils.checkAccount('我是信息提示') //满足条件返回true，否则返回false
```

2.`checkPassword`校验密码强度正则，最少6位，包括至少1个大写字母，1个小写字母，1个数字，1个特殊字符

```js
this.$utils.checkPassword('我是密码') //满足条件返回true，否则返回false
```

3.`checkPhone`校验手机号码

```js
this.$utils.checkPhone('178********') //满足条件返回true，否则返回false
```

4.`checkCard`校验身份证号码  -（强校验）

```js
this.$utils.checkCard('410************') //满足条件返回true，否则返回false
```

5.`checkEmail`校验邮箱

```js
this.$utils.checkEmail('liu@163.com') //满足条件返回true，否则返回false
```

6.`checkPostCode`校验中国邮政编码

```js
this.$utils.checkPostCode('450000') //满足条件返回true，否则返回false
```

7.`getTimestamp`获取时间戳（已处理ios设备传入'2022-08-08 08:08:08'时返回undefined的bug）

```js
this.$utils.getTimestamp() //不传参数时，默认获取当前时间的时间戳
this.$utils.getTimestamp('2022-08-08 08:08:08') //传时间参数时，获取传递时间的时间戳
this.$utils.getTimestamp('2022/08/08 08:08:08') //传时间参数时，获取传递时间的时间戳
```

8.`getCurrentTime`获取当前时间

|  YY  |  MM  |  DD  |  hh  |  mm  |  ss  |  W   |         weekType         |
| :--: | :--: | :--: | :--: | :--: | :--: | :--: | :----------------------: |
|  年  |  月  |  日  |  时  |  分  |  秒  |  周  | 默认（周），可选（星期） |

```js
this.$utils.getCurrentTime() //不传参数时，返回 2022-08-08 08:08:08 周六
this.$utils.getCurrentTime('星期') //只传weekType，返回 2022-08-08 08:08:08 星期六
this.$utils.getCurrentTime('MM-DD hh:mm W','星期') //返回 08-08 08:08 星期六
this.$utils.getCurrentTime('MM-DD hh:mm') //返回 08-08 08:08
this.$utils.getCurrentTime('hh:mm') //返回 08:08
```

9.`showToast`显示消息提示框

​	tips  第一个参数（必选）：消息内容；

​			第二个参数（选填）：提示的延迟时间；

​			第三个参数（选填）：提示图标；

```js
this.$utils.showToast('我是消息',2000,success) 
```

10.`navigateTo`保留当前页面，跳转到应用内的某个页面

```js
this.$utils.navigateTo('/pages/index/index') 
```

11.`redirectTo`关闭当前页面，跳转到应用内的某个页面

```js
this.$utils.redirectTo('/pages/index/index') 
```

12.`switchTab` tabbar跳转

```js
this.$utils.switchTab('/pages/index/index') 
```

13.`navigateBack` 关闭当前页面，返回上一页面或多级页面。可通过 `getCurrentPages()` 获取当前的页面栈，决定需要返回几层

```js
this.$utils.navigateBack()// 默认返回上一页面
this.$utils.navigateBack(2)// 返回上两个页面
```

14.`callPhone` 拨打电话

```js
this.$utils.callPhone(178********)// 拨打电话
```

