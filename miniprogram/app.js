//app.js
App({
	globalData: {
		openid: null,
		userInfo: null,
		hasUserInfo: false
		// rootOpenId: 'odufi5LQnaBGOAPIlWRIrOWtFvLM'
	},
	onLaunch: function () {
		var that = this
		// 设置云开发环境
		if (!wx.cloud) {
			console.error('请使用 2.2.3 或以上的基础库以使用云能力')
		} else {
			wx.cloud.init({
				env: 'lyy1-2mnm7',
				traceUser: true,
			})
		}

		// 在已经授权的情况下，获取用户信息
		wx.getSetting({
			success: res => {
				if (res.authSetting['scope.userInfo']) {
					console.log("[app]: " + "用户已经授权")
					// 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
					wx.getUserInfo({
						success: res => {
							// 可以将 res 发送给后台解码出 unionId
							that.globalData.userInfo = res.userInfo
							that.globalData.hasUserInfo = true
							// console.log("全局用户信息: ", res.userInfo)
							// 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
							// 所以此处加入 callback 以防止这种情况
							if (that.userInfoCallback) {
								that.userInfoCallback(res)
							}
						},
						fail: (res) => {
							console.log("[app]: " + "获取用户信息失败")
						}
					})
				} else {
					console.log("[app]: " + "用户暂时未授权")
				}
			}
		})

		// 获取openid
		wx.cloud.callFunction({
			name: 'login',
			data: {},
			success: res => {
				// console.log('[云函数] [login] user openid: ', res.result.openid)
				that.globalData.openid = res.result.openid
				wx.setStorageSync('openid', res.result.openid)// 同步请求存储缓存
				if (that.openidCallback) {
					that.openidCallback(res.result.openid)
				}
			},
			fail: err => {
				console.error('[云函数] [login] 调用失败', err)
			}
		})
	}
})
