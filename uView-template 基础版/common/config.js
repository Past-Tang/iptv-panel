// 环境配置文件
module.exports = {
  // 网络类型配置
  networkTypes: {
    internal: '内网',
    external: '外网'
  },

  // 基础环境配置
  env: {
    development: {
      internal: 'http://192.168.1.200:8899',
      external: 'http://iptv.tang.tj.cn:8899'
    },
    production: {
      internal: 'http://192.168.1.200:8899',
      external: 'http://iptv.tang.tj.cn:8899'
    }
  },
  
  // 获取当前环境配置
  get current() {
    const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const network = uni.getStorageSync('networkType') || 'internal';
    return {
      ...this.env[env],
      baseURL: this.env[env][network],
      networkType: network
    };
  },

  // Token服务地址
  get tokenUrl() {
    const network = uni.getStorageSync('networkType') || 'internal';
    return this.env[process.env.NODE_ENV === 'production' ? 'production' : 'development'][network];
  }
}
