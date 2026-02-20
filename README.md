<div align="center">
  <img src="assets/logo.svg" alt="IPTV Panel" width="680"/>

  # IPTV Panel

  **IPTV 推流控制面板**

  [![uni-app](https://img.shields.io/badge/uni--app-Framework-42b883?style=flat-square)](https://uniapp.dcloud.net.cn)
  [![Vue.js](https://img.shields.io/badge/Vue.js-2-42b883?style=flat-square&logo=vue.js)](https://vuejs.org)
  [![uView](https://img.shields.io/badge/uView-UI-2979ff?style=flat-square)](https://uviewui.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
</div>

---

## 项目概述

IPTV Panel 是一个基于 uni-app + uView UI 的 IPTV 推流控制面板前端应用。通过 REST API 与后端推流服务通信，提供推流启动/停止控制、实时状态轮询监控、内网/外网环境切换、FLV 直播流地址管理和系统日志查看等功能。基于 uni-app 跨平台框架，支持编译为 H5、微信小程序、App 等多端应用。

## 技术栈

- **uni-app**: 跨平台应用框架
- **Vue.js 2**: 前端响应式框架
- **uView UI 1.8**: 移动端 UI 组件库（导航栏、按钮、单选框、Toast 等）
- **HTTP-FLV**: 直播流协议（`live.flv`）
- **REST API**: 前后端通信（`/start_stream`、`/stop_stream`、`/status`）

## 功能特性

- **推流控制** -- 一键启动/停止推流，按钮状态与推流状态联动（运行中禁用启动、停止时禁用停止）
- **实时状态监控** -- 5 秒轮询后端状态接口，状态卡片动态显示运行中（绿色脉冲）/已停止（灰色）/异常（红色抖动）
- **内网/外网切换** -- 单选框切换网络环境，自动切换 API 基础地址和直播流地址
- **直播流地址管理** -- 显示内网和外网 FLV 直播流地址，一键复制到剪贴板
- **系统日志** -- 实时记录所有操作和状态变化，支持滚动查看、点击复制、一键清空
- **请求重试** -- 状态查询失败时自动重试 3 次，间隔 1 秒
- **网络健康检测** -- 内置 `/health-check` 端点可用性检测
- **精美动画** -- 渐变按钮、光效扫描、脉冲动画、悬停效果等 CSS 动画

## 安装说明

1. 克隆仓库到本地：
   ```bash
   git clone https://github.com/Past-Tang/iptv-panel.git
   cd iptv-panel
   ```

2. 安装依赖：
   ```bash
   cd "uView-template 基础版"
   npm install
   ```

3. 使用 HBuilderX 打开项目：
   - 下载 [HBuilderX](https://www.dcloud.io/hbuilderx.html)
   - 打开 `uView-template 基础版` 目录
   - 运行到浏览器或模拟器

## 使用方法

1. 修改后端地址配置（`common/config.js`）：
   ```javascript
   env: {
     development: {
       internal: 'http://192.168.1.200:8899',  // 内网后端地址
       external: 'http://your-domain:8899'      // 外网后端地址
     }
   }
   ```

2. 修改直播流地址（`pages/index/index.vue`）：
   ```javascript
   urls: {
     internal: 'http://192.168.1.200:9999/hdl/live/live.flv',  // 内网流地址
     external: 'http://your-domain:9999/hdl/live/live.flv'      // 外网流地址
   }
   ```

3. 运行项目后：
   - 选择网络环境（内网/外网）
   - 点击"启动推流"开始推流
   - 状态卡片实时显示推流状态
   - 点击"停止推流"停止推流
   - 复制直播流地址到播放器观看

## 配置说明

### 网络环境 (`common/config.js`)

| 环境 | 内网地址 | 外网地址 |
|:---|:---|:---|
| API 服务 | `http://192.168.1.200:8899` | `http://iptv.tang.tj.cn:8899` |
| 直播流 | `http://192.168.1.200:9999/hdl/live/live.flv` | `http://iptv.tang.tj.cn:9999/hdl/live/live.flv` |

### API 接口

| 接口 | 方法 | 说明 |
|:---|:---|:---|
| `/start_stream` | GET | 启动推流 |
| `/stop_stream` | GET | 停止推流 |
| `/status` | GET | 获取推流状态（返回 `{status: 'running'/'stopped'/'error'}`） |
| `/health-check` | HEAD | 网络健康检测 |

## 项目结构

```
iptv-panel/
├── uView-template 基础版/
│   ├── pages/
│   │   └── index/
│   │       └── index.vue          # 主页面：推流控制面板（1112行）
│   ├── api/
│   │   └── api.js                 # API 接口封装（startStream/stopStream/getStatus）
│   ├── common/
│   │   ├── config.js              # 环境配置（内网/外网地址）
│   │   └── http.js                # HTTP 请求封装（uni.request + 网络切换）
│   ├── utils/
│   │   └── utils.js               # 公共工具函数
│   ├── static/
│   │   └── image/
│   │       └── logo.png           # 应用 Logo
│   ├── App.vue                    # 应用根组件
│   ├── main.js                    # 入口文件（注册 uView、HTTP、API）
│   ├── pages.json                 # 页面路由配置
│   ├── manifest.json              # 应用配置（AppID、图标等）
│   ├── uni.scss                   # 全局样式变量
│   ├── package.json               # 依赖配置
│   └── index.html                 # H5 入口
├── assets/
│   └── logo.svg                   # 项目 Logo
├── LICENSE                        # MIT 许可证
└── README.md
```

## 界面说明

### 状态卡片
- **运行中**: 绿色背景 + 脉冲动画
- **已停止**: 灰色背景
- **异常状态**: 红色背景 + 抖动动画

### 控制按钮
- **启动推流**: 蓝色渐变按钮，推流运行中时禁用
- **停止推流**: 红色渐变按钮，推流停止时禁用
- **刷新状态**: 灰色渐变按钮，手动刷新状态

### 日志面板
- **info 日志**: 绿色左边框，记录正常操作
- **error 日志**: 红色左边框，记录错误信息
- 点击日志条目可复制内容

## 依赖项

| 包 | 版本 | 用途 |
|:---|:---|:---|
| uview-ui | ^1.8.4 | 移动端 UI 组件库 |

## 常见问题

### 状态一直显示"异常状态"？
检查后端推流服务是否启动，确认 `config.js` 中的 API 地址配置正确。

### 如何切换内网/外网？
在页面顶部的"网络环境"区域选择内网或外网，系统会自动切换 API 地址和直播流地址。

### 如何在手机上使用？
使用 HBuilderX 编译为 App 或微信小程序，或部署 H5 版本后通过手机浏览器访问。

### 后端需要提供哪些接口？
至少需要 `/start_stream`、`/stop_stream`、`/status` 三个 GET 接口，`/status` 返回 JSON 格式 `{status: 'running'/'stopped'/'error'}`。

## 许可证

[MIT License](LICENSE)

## 免责声明

本项目仅供学习研究使用。IPTV 推流涉及版权和网络法规，请遵守当地法律法规。