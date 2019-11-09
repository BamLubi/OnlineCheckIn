//app.js
const cloudFun = require('promise/wxCloudFun.js');
const api = require('promise/wxAPI.js');
App({
    globalData: {
        openid: null,
        userInfo: null,
        hasUserInfo: false,
        rootOpenId: ['odufi5LQnaBGOAPIlWRIrOWtFvLM', 'oOq6m5GJu622Tnf6-5FU1fWKQ85Q', 'oOq6m5DHSXqOhBAOZopkL28KfH5I', 'oOq6m5DNKaqviHYUZR5LPGQFHVuk']
    },
    onLaunch: function() {
        var that = this
        // 设置云开发环境
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力')
        } else {
            // wx.cloud.init({
            // 	env: 'lyy1-2mnm7',
            // 	traceUser: true,
            // })
            wx.cloud.init()
        }
		
        // 在已经授权的情况下，获取用户信息
		api.GetSetting().then(res=>{
			return api.GetUserInfo()
		}).then(res=>{
			// 可以将 res 发送给后台解码出 unionId
			that.globalData.userInfo = res.userInfo
			that.globalData.hasUserInfo = true
			// 回调
			if (that.userInfoCallback) {
				that.userInfoCallback(res)
			}
		})

        // Get user's OPENID, using Promise Object
        cloudFun.CallWxCloudFun('login', {}).then(res => {
            that.globalData.openid = res.result.openid
            wx.setStorageSync('openid', res.result.openid) // 同步请求存储缓存
            if (that.openidCallback) {
            	that.openidCallback(res.result.openid)
            }
        })
    }
})