// 定义api请求的公用域名,封装HTTP请求
import config from '@/common/config.js'

// 判断是否内网环境
const isInternalNetwork = () => {
    try {
        const host = window.location.hostname;
        return host.startsWith('192.168.') || host.endsWith('.internal');
    } catch(e) {
        // 非浏览器环境（如APP）根据UA判断
        const ua = navigator.userAgent.toLowerCase();
        return ua.includes('internal') || ua.includes('wifi');
    }
}

// 获取网络配置
const getNetworkConfig = () => {
  try {
    const networkType = uni.getStorageSync('networkType') || 'internal';
    return ['internal', 'external'].includes(networkType) ? networkType : 'internal';
  } catch (e) {
    console.error('读取网络配置失败:', e);
    return 'internal';
  }
};

// 设置请求api接口的基础路径
const baseUrl = config.current[getNetworkConfig()];

// 网络检测器
const checkNetworkAvailability = async (url) => {
  try {
    const res = await uni.request({
      url: url + '/health-check',
      method: 'HEAD',
      timeout: 3000
    });
    return res.statusCode === 200;
  } catch (e) {
    return false;
  }
};

// 初始化基础地址
let currentBaseUrl = baseUrl;

/**
 * 封装uni.request
 * @param url     api接口地址
 * @param method  uni.request请求方法 "POST" 和 "GET"
 * @param data    uni.request请求携带的参数 {}
 * @param header  uni.request请求携带的header {}
 */
const request = async (url, method, data, header) => {
  try {
    const currentBaseUrl = config.current.baseURL;
    return new Promise((resolve, reject) => {
      uni.request({
        url: currentBaseUrl + url,
        method: method || "GET",
        data: data,
        header: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          ...header
        }
      }).then(data => {
        let [err, res] = data;
        if (err) {
          return reject(err);
        }
        
        // 处理响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          return resolve(res);
        } else {
          // 处理HTTP错误
          const error = new Error(res.data?.message || '请求失败');
          error.statusCode = res.statusCode;
          error.data = res.data;
          return reject(error);
        }
      }).catch(error => {
        // 处理网络错误
        const err = new Error('网络请求失败');
        err.originalError = error;
        return reject(err);
      });
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

const http = {
	request,
	get baseUrl() {
		return config.current[getNetworkConfig()];
	},
	setNetwork(networkType) {
		try {
			uni.setStorageSync('networkType', networkType);
			currentBaseUrl = config.current[networkType];
		} catch (e) {
			console.error('保存网络配置失败:', e);
			uni.showToast({
				title: '网络配置保存失败',
				icon: 'none'
			});
		}
	}
}

export default http;
