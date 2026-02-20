import http from '@/common/http.js'

export default {
	// 流控制接口
	startStream: async () => {
		try {
			const res = await http.request('/start_stream', "GET");
			return {
				statusCode: res.statusCode,
				data: res.data
			};
		} catch (err) {
			throw {
				statusCode: err.statusCode || 500,
				message: err.message || '网络请求失败'
			};
		}
	},
	
	stopStream: async () => {
		try {
			const res = await http.request('/stop_stream', "GET");
			return {
				statusCode: res.statusCode,
				data: res.data
			};
		} catch (err) {
			throw {
				statusCode: err.statusCode || 500,
				message: err.message || '网络请求失败'
			};
		}
	},
	
	getStatus: async () => {
		try {
			const res = await http.request('/status', "GET");
			return {
				statusCode: res.statusCode,
				data: res.data
			};
		} catch (err) {
			throw {
				statusCode: err.statusCode || 500,
				message: err.message || '网络请求失败'
			};
		}
	}
}
