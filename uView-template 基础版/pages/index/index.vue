<template>
	<view>
		<u-navbar :is-back="false" title="推流控制面板"></u-navbar>


		<view class="status-card">
			<text class="status-title">当前状态</text>
			<text :class="['status-value', streamStatusClass]">{{statusText}}</text>
		</view>
		<view class="network-selector">
			<text class="selector-label">网络环境</text>
			<u-radio-group v-model="networkType" @change="handleNetworkChange">
				<u-radio name="internal" label="内网">内网</u-radio>
				<u-radio name="external" label="外网">外网</u-radio>
			</u-radio-group>
		</view>



		<view class="control-panel">
			<u-button type="primary" @click="startStream" :loading="isLoading" :disabled="streamStatus === 'running'"
				icon="play-circle" shape="circle">启动推流</u-button>

			<u-button type="error" @click="stopStream" :loading="isLoading" :disabled="streamStatus !== 'running'"
				style="margin-top: 20rpx;" icon="stop-circle" shape="circle">停止推流</u-button>

			<u-button type="info" @click="checkStatus" :loading="isLoading" style="margin-top: 20rpx;" icon="reload"
				shape="circle">刷新状态</u-button>
		</view>

		<!-- 流地址显示 -->
		<view class="url-container">
			<view class="url-item">
				<text class="url-label">内网地址</text>

				<u-button type="primary" size="mini" @click="copyUrl(urls.internal)" icon="copy">复制</u-button>
			</view>
			<view class="url-item">
				<text class="url-label">外网地址</text>

				<u-button type="primary" size="mini" @click="copyUrl(urls.external)" icon="copy">复制</u-button>
			</view>
		</view>

		<!-- 日志显示区域 -->
		<view class="log-container">
			<view class="log-header">
				<text class="log-title">系统日志：</text>
				<u-button type="warning" size="mini" @click="clearLogs" :disabled="logs.length === 0">清除日志</u-button>
			</view>
			<scroll-view scroll-y class="log-list" :scroll-into-view="'log-' + (logs.length - 1)" scroll-with-animation>
				<view v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]" :id="'log-' + index"
					@click="copyLog(log)">
					<text class="log-time">[{{log.time}}]</text>
					<text class="log-message">{{log.message}}</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				networkType: 'internal', // 当前网络类型 internal/external
				streamStatus: 'stopped', // 推流状态 running | stopped | error
				isLoading: false, // 加载状态
				timer: null, // 轮询计时器
				logs: [], // 状态日志
				urls: null // 视频播放地址
			};
		},
		computed: {
			statusText() {
				const statusMap = {
					running: '运行中',
					stopped: '已停止',
					error: '异常状态'
				}
				return statusMap[this.streamStatus] || '未知状态'
			},
			streamStatusClass() {
				return `status-${this.streamStatus}`
			},
			// 视频播放地址
			videoUrl() {
				const url = this.urls[this.networkType];
				// 添加时间戳防止缓存
				return url + '?t=' + Date.now();
			}
		},
		created() {
			// 初始化网络类型
			this.networkType = uni.getStorageSync('networkType') || 'internal';
			// 初始化URLs
			this.urls = {
				internal: 'http://192.168.1.200:9999/hdl/live/live.flv',
				external: 'http://iptv.tang.tj.cn:9999/hdl/live/live.flv'
			};
			// 启动状态轮询
			this.startPolling();
		},
		methods: {
			// 处理网络切换
			handleNetworkChange(val) {
				this.$http.setNetwork(val);
				uni.showToast({
					title: `已切换至${val === 'internal' ? '内网' : '外网'}环境`,
					icon: 'none'
				});
			},

			// 启动推流
			async startStream() {
				this.isLoading = true;
				try {
					const res = await this.$api.startStream();
					await this.checkStatus();
					this.$u.toast('推流已启动');
					this.logs.unshift({
						type: 'info',
						message: '推流启动成功',
						time: new Date().toLocaleTimeString()
					});
				} catch (err) {
					this.streamStatus = 'error';
					const errorMessage = err.statusCode ?
						`[${err.statusCode}] ${err.message}` :
						`网络错误：${err.message}`;
					this.$u.toast(errorMessage);
					this.logs.unshift({
						type: 'error',
						message: `推流启动失败：${errorMessage}`,
						time: new Date().toLocaleTimeString()
					});
				} finally {
					this.isLoading = false;
				}
			},

			// 停止推流
			async stopStream() {
				this.isLoading = true;
				try {
					const res = await this.$api.stopStream();
					this.streamStatus = 'stopped';
					this.$u.toast('推流已停止');
					this.logs.unshift({
						type: 'info',
						message: '推流停止成功',
						time: new Date().toLocaleTimeString()
					});
				} catch (err) {
					this.streamStatus = 'error';
					const errorMessage = err.statusCode ?
						`[${err.statusCode}] ${err.message}` :
						`网络错误：${err.message}`;
					this.$u.toast(errorMessage);
					this.logs.unshift({
						type: 'error',
						message: `推流停止失败：${errorMessage}`,
						time: new Date().toLocaleTimeString()
					});
				} finally {
					this.isLoading = false;
				}
			},

			// 主动检查状态
			async checkStatus() {
				this.isLoading = true;
				let retryCount = 0;
				const maxRetries = 3;

				while (retryCount < maxRetries) {
					try {
						const res = await this.$api.getStatus();
						const prevStatus = this.streamStatus;
						this.streamStatus = res.data.status;

						// 记录状态变化
						if (prevStatus !== this.streamStatus) {
							this.logs.unshift({
								type: 'info',
								message: `状态变化：${prevStatus} -> ${this.streamStatus}`,
								time: new Date().toLocaleTimeString()
							});
						}
						break; // 成功则退出重试
					} catch (err) {
						retryCount++;
						if (retryCount === maxRetries) {
							this.streamStatus = 'error';
							const errorMessage = err.statusCode ?
								`[${err.statusCode}] ${err.message}` :
								`网络错误：${err.message}`;
							this.logs.unshift({
								type: 'error',
								message: `获取状态失败：${errorMessage}（重试 ${maxRetries} 次）`,
								time: new Date().toLocaleTimeString()
							});
						} else {
							await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒后重试
						}
					}
				}
				this.isLoading = false;
			},

			// 开启轮询
			startPolling() {
				if (!this.timer) {
					this.timer = setInterval(() => {
						this.checkStatus()
					}, 5000)
					this.logs.unshift({
						type: 'info',
						message: '状态轮询已启动',
						time: new Date().toLocaleTimeString()
					});
				}
			},

			// 停止轮询
			stopPolling() {
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
					this.logs.unshift({
						type: 'info',
						message: '状态轮询已停止',
						time: new Date().toLocaleTimeString()
					});
				}
			},

			// 复制URL
			copyUrl(url) {
				uni.setClipboardData({
					data: url,
					success: () => {
						this.$u.toast('复制成功');
						this.logs.unshift({
							type: 'info',
							message: `已复制URL：${url}`,
							time: new Date().toLocaleTimeString()
						});
					},
					fail: () => {
						this.$u.toast('复制失败');
						this.logs.unshift({
							type: 'error',
							message: `URL复制失败：${url}`,
							time: new Date().toLocaleTimeString()
						});
					}
				});
			},

			// 复制日志内容
			copyLog(log) {
				const logText = `[${log.time}] ${log.message}`;
				uni.setClipboardData({
					data: logText,
					success: () => {
						this.$u.toast('日志已复制');
					},
					fail: () => {
						this.$u.toast('复制失败');
					}
				});
			},

			// 清空日志
			clearLogs() {
				return new Promise((resolve) => {
					if (this.logs.length > 0) {
						this.logs = [];
						this.$u.toast('日志已清空');
						resolve();
					} else {
						this.$u.toast('没有可清空的日志');
						resolve();
					}
				});
			}
		},
		beforeDestroy() {
			this.stopPolling()
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.url-container {
		width: 90%;
		margin: 40rpx auto;
		padding: 40rpx;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		position: relative;
		overflow: hidden;
	}


	.url-item {
		display: flex;
		align-items: center;
		margin: 20rpx 0;
		padding: 30rpx;
		background-color: #f8f8f8;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.url-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 6rpx;
		height: 100%;
		background-color: #2979ff;
		transition: all 0.3s ease;
	}

	.url-item:hover {
		transform: translateY(-4rpx);
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.12);
	}

	.url-item:hover::before {
		width: 12rpx;
	}

	.url-label {
		font-size: 36rpx;
		color: #333;
		margin-right: 20rpx;
		font-weight: bold;
		min-width: 140rpx;
		display: flex;
		align-items: center;
	}

	.url-label::before {
		content: '';
		display: inline-block;
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #2979ff;
		margin-right: 10rpx;
		transition: all 0.3s ease;
	}

	.url-item:hover .url-label::before {
		transform: scale(1.2);
	}

	.url-value {
		flex: 1;
		font-size: 32rpx;
		color: #333;
		word-break: break-all;
		margin-right: 20rpx;
		padding: 20rpx;
		background-color: #fff;
		border-radius: 12rpx;
		box-shadow: inset 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.url-value::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(41, 121, 255, 0.1),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	.url-value:hover {
		background-color: #f5f5f5;
		box-shadow: inset 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
	}

	.url-value:hover::before {
		background: linear-gradient(90deg,
				transparent,
				rgba(41, 121, 255, 0.2),
				transparent);
	}

	.control-panel {
		width: 90%;
		margin: 40rpx auto;
		padding: 40rpx;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		overflow: hidden;
	}


	.control-panel .u-button {
		width: 100%;
		margin: 20rpx 0;
		padding: 30rpx;
		font-size: 36rpx;
		font-weight: bold;
		letter-spacing: 2rpx;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		border: none;
	}

	.control-panel .u-button[disabled] {
		opacity: 0.6;
		transform: scale(0.98);
		filter: grayscale(0.8);
		cursor: not-allowed;
	}

	.control-panel .u-button:not([disabled]):hover {
		transform: translateY(-4rpx);
		box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.2);
	}

	.control-panel .u-button:not([disabled]):active {
		transform: translateY(0) scale(0.98);
	}

	/* 启动按钮特殊样式 */
	.control-panel .u-button[type="primary"] {
		background: linear-gradient(135deg, #2979ff, #00bcd4);
		color: #fff;
	}

	.control-panel .u-button[type="primary"]::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(255, 255, 255, 0.3),
				transparent);
		animation: loading 1.5s infinite;
	}

	.control-panel .u-button[type="primary"]::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(41, 121, 255, 0.2),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	/* 停止按钮特殊样式 */
	.control-panel .u-button[type="error"] {
		background: linear-gradient(135deg, #fa3534, #ff9900);
		color: #fff;
	}

	.control-panel .u-button[type="error"]::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(255, 255, 255, 0.3),
				transparent);
		animation: loading 1.5s infinite;
	}

	.control-panel .u-button[type="error"]::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(250, 53, 52, 0.2),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	/* 刷新按钮特殊样式 */
	.control-panel .u-button[type="info"] {
		background: linear-gradient(135deg, #909399, #c0c4cc);
		color: #fff;
	}

	.control-panel .u-button[type="info"]::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(255, 255, 255, 0.3),
				transparent);
		animation: loading 1.5s infinite;
	}

	.control-panel .u-button[type="info"]::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(144, 147, 153, 0.2),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	.control-panel .u-button .u-icon {
		margin-right: 10rpx;
		font-size: 40rpx;
		transition: all 0.3s ease;
	}

	.control-panel .u-button:hover .u-icon {
		transform: scale(1.1);
	}

	@keyframes loading {
		0% {
			left: -100%;
		}

		100% {
			left: 100%;
		}
	}

	.status-card {
		width: 90%;
		margin: 25rpx auto 0rpx;
		padding: 40rpx;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		overflow: hidden;
	}


	.status-title {
		font-size: 36rpx;
		color: #333;
		font-weight: bold;
		margin-bottom: 20rpx;
		display: flex;
		align-items: center;
	}

	.status-title::before {
		content: '';
		display: inline-block;
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #2979ff;
		margin-right: 10rpx;
		transition: all 0.3s ease;
	}

	.status-title:hover::before {
		transform: scale(1.2);
	}

	.status-value {
		font-size: 40rpx;
		font-weight: bold;
		padding: 20rpx 40rpx;
		border-radius: 40rpx;
		background-color: #f5f5f5;
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.status-value:hover {
		transform: translateY(-4rpx);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
	}

	.status-value::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(255, 255, 255, 0.4),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	.status-running {
		color: #19be6b;
		background-color: #e6f8f0;
		animation: pulse 1.5s infinite;
	}

	.status-running::after {
		background: linear-gradient(90deg,
				transparent,
				rgba(25, 190, 107, 0.2),
				transparent);
	}

	.status-running::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(25, 190, 107, 0.1),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	.status-stopped {
		color: #909399;
		background-color: #f5f5f5;
	}

	.status-stopped::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(144, 147, 153, 0.1),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	.status-error {
		color: #fa3534;
		background-color: #fff5f5;
		animation: shake 0.5s;
	}

	.status-error::after {
		background: linear-gradient(90deg,
				transparent,
				rgba(250, 53, 52, 0.2),
				transparent);
	}

	.status-error::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(250, 53, 52, 0.1),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	@keyframes statusLine {
		0% {
			transform: translateX(-100%);
		}

		100% {
			transform: translateX(100%);
		}
	}

	@keyframes statusGlow {
		0% {
			left: -100%;
		}

		100% {
			left: 100%;
		}
	}

	@keyframes pulse {
		0% {
			opacity: 1;
		}

		50% {
			opacity: 0.5;
		}

		100% {
			opacity: 1;
		}
	}

	@keyframes shake {
		0% {
			transform: translateX(0);
		}

		25% {
			transform: translateX(-10rpx);
		}

		50% {
			transform: translateX(10rpx);
		}

		75% {
			transform: translateX(-10rpx);
		}

		100% {
			transform: translateX(0);
		}
	}

	.network-tag {
		padding: 8rpx 20rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
		margin-left: 15rpx;
	}

	.header {
		width: 100%;
		padding: 30rpx;
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		margin-bottom: 30rpx;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.network-tag {
		padding: 8rpx 20rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		font-weight: bold;
		transition: all 0.3s ease;
	}

	.internal {
		background-color: #e6f3ff;
		color: #2979ff;
		border: 1rpx solid #2979ff;
	}

	.external {
		background-color: #fff0e6;
		color: #ff9900;
		border: 1rpx solid #ff9900;
	}

	.network-selector {
		width: 90%;
		margin: 40rpx auto;
		padding: 40rpx;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
	}


	.selector-label {
		font-size: 36rpx;
		color: #333;
		font-weight: bold;
		margin-bottom: 30rpx;
		display: flex;
		align-items: center;
	}

	.selector-label::before {
		content: '';
		display: inline-block;
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #2979ff;
		margin-right: 10rpx;
		transition: all 0.3s ease;
	}

	.selector-label:hover::before {
		transform: scale(1.2);
	}

	.u-radio-group {
		display: flex;
		gap: 40rpx;
	}

	.u-radio {
		padding: 20rpx 40rpx;
		border-radius: 40rpx;
		background-color: #f5f5f5;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.u-radio::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(255, 255, 255, 0.4),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	.u-radio:hover {
		transform: translateY(-4rpx);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
	}

	.u-radio:active {
		transform: translateY(0) scale(0.98);
	}

	.u-radio.is-checked {
		background-color: #e6f3ff;
		box-shadow: 0 4rpx 16rpx rgba(41, 121, 255, 0.2);
	}

	.u-radio.is-checked::before {
		background: linear-gradient(90deg,
				transparent,
				rgba(41, 121, 255, 0.2),
				transparent);
	}

	/* 日志区域样式 */
	.log-container {
		width: 90%;
		margin: 40rpx auto;
		padding: 40rpx;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		position: relative;
		overflow: hidden;
	}


	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.log-title {
		font-size: 36rpx;
		color: #333;
		font-weight: bold;
		display: flex;
		align-items: center;
	}

	.log-title::before {
		content: '';
		display: inline-block;
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #2979ff;
		margin-right: 10rpx;
		transition: all 0.3s ease;
	}

	.log-title:hover::before {
		transform: scale(1.2);
	}

	.log-list {
		height: 500rpx;
		margin-top: 20rpx;
		padding: 20rpx;
		background-color: #f8f8f8;
		border-radius: 16rpx;
		box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		position: relative;
		overflow: hidden;
	}


	.log-item {
		padding: 30rpx;
		margin: 20rpx 0;
		background-color: #fff;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.log-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 6rpx;
		height: 100%;
		background-color: #2979ff;
		transition: all 0.3s ease;
	}

	.log-item:hover {
		transform: translateY(-4rpx);
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.12);
	}

	.log-item:hover::before {
		width: 12rpx;
	}

	.log-item:active {
		transform: translateY(0) scale(0.98);
	}

	.log-time {
		font-size: 28rpx;
		color: #666;
		font-weight: bold;
		margin-bottom: 10rpx;
		display: flex;
		align-items: center;
	}

	.log-time::before {
		content: '';
		display: inline-block;
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #2979ff;
		margin-right: 10rpx;
		transition: all 0.3s ease;
	}

	.log-item:hover .log-time::before {
		transform: scale(1.2);
	}

	.log-message {
		font-size: 32rpx;
		color: #333;
		line-height: 1.6;
		word-break: break-all;
		transition: all 0.3s ease;
	}

	.log-item:hover .log-message {
		color: #2979ff;
	}

	.log-item.error {
		background-color: #fff5f5;
	}

	.log-item.error::before {
		background-color: #fa3534;
	}

	.log-item.error .log-time::before {
		background-color: #fa3534;
	}

	.log-item.error:hover .log-message {
		color: #fa3534;
	}

	.log-item.error::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(250, 53, 52, 0.1),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	.log-item.info {
		background-color: #f5fff5;
	}

	.log-item.info::before {
		background-color: #19be6b;
	}

	.log-item.info .log-time::before {
		background-color: #19be6b;
	}

	.log-item.info:hover .log-message {
		color: #19be6b;
	}

	.log-item.info::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg,
				transparent,
				rgba(25, 190, 107, 0.1),
				transparent);
		animation: statusGlow 1.5s infinite;
	}

	/* 自定义滚动条样式 */
	.log-list::-webkit-scrollbar {
		width: 8rpx;
		background-color: #f5f5f5;
	}

	.log-list::-webkit-scrollbar-thumb {
		border-radius: 10rpx;
		background-color: #c1c1c1;
		transition: all 0.3s ease;
	}

	.log-list::-webkit-scrollbar-thumb:hover {
		background-color: #2979ff;
	}
</style>