// components/spaceBackground/spaceBackground.js
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持 
	},
	/**
	 * 组件的属性列表
	 */
	properties: {
		hasUserInfo: {
			type: Boolean,
			value: false
		}
	},

	/**
	 * 组件的初始数据
	 */
	data: {
		animationData: {
			star: null
		},
		signDays: 0
	},

	created: function(){
		var that = this
		var animation1 = wx.createAnimation({})
		var animation2 = wx.createAnimation({})
		// 流星划过
		setInterval(function () {
			console.log("[动画][流星划过]")
			animation1.opacity(1).translate3d(168, 231, 200).step({duration: 2000,timingFunction: 'ease-in'})
			animation1.opacity(0.3).translate3d(-168,-231,0).step({duration: 1,timingFunction: 'step-start'})
			that.setData({
				["animationData.star"]: animation1.export(),
			})
		}.bind(that), Math.ceil(Math.random() * 3000 + 2000));
	},

	/**
	 * 组件的方法列表
	 */
	methods: {
		/**
		 * 授权
		 */
		getUserInfo: function (e) {
			console.log("[授权][授权成功]")
			if (e.detail.userInfo) {
				// 当前页面赋值
				this.setData({
					hasUserInfo: true
				})
			}
			// 回调函数
			if(this.getUserInfoCallback){
				this.getUserInfoCallback(e)
			}
			// 对外接口
			this.triggerEvent("authorize",{e})
		},
		/**
		 * 签到
		 */
		sign: function(){
			this.triggerEvent("click")
		},
		/**
		 * 设置已经签到
		 */
		setHasSign: function(days){
			console.log("[组件][设置已经签到]",days)
			this.setData({
				signDays: days
			})
		}
	}
})
