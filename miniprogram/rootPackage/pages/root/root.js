// miniprogram/pages/root/root.js
const app = getApp()
const exportFile = require("../../utils/exportFile.js")
const functions = require("../../utils/functions.js")

Page({

    /**
     * 页面的初始数据
     */
    data: {
        allListData: [], // 所有签到列表
		allListLength: 0, // 所有签到列表长度
		allListHasMore: true, // 所有签到列表是否含有更多数据
		allListIsLoad: false, // 所有签到列表是否在加载
        exchangeListData: [], // 兑换奖品列表
		exchangeListLength: 0, // 兑换奖品列表长度
		exchangeListHasMore: true, // 兑换奖品列表是否含有更多数据
		exchangeListIsLoad: false, // 兑换奖品列表是否在加载
        TabCur: 0,
        scrollLeft: 0,
        TabCurText: ["清空记录", "兑换奖品", "功能列表"],
        showAddress: false, // 是否显示地址模态框
        addressInfo: [], // 地址信息
        selectUserIndex: null //选中的用户index
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.getAllSignData()
        this.getAllExchangeData()
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        console.log("管理员下拉刷新")
        if (this.data.TabCur == 0) {
            // 获取所有签到信息
			// 清空之前获取的信息
			this.setData({
				allListData: [],
				allListLength: 0,
				allListHasMore: true
			})
            this.getAllSignData()
        } else if (this.data.TabCur == 1) {
            // 获取所有兑奖信息
			// 清空之前获取的信息
			this.setData({
				exchangeListData: [],
				exchangeListLength: 0,
				exchangeListHasMore: true
			})
            this.getAllExchangeData()
        }
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
		
    },
	/**
	 * 加载更多
	 */
	loadMore: function(){
		console.log("加载更多")
		if (this.data.TabCur == 0) {
			// 所有签到信息
			if (this.data.exchangeListHasMore) {
				this.setData({
					allListIsLoad: true
				})
				this.getAllSignData()
			}
		} else if (this.data.TabCur == 1) {
			// 兑奖信息页面
			if (this.data.exchangeListHasMore) {
				this.setData({
					exchangeListIsLoad: true
				})
				this.getAllExchangeData()
			}
		}
	},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    },

    /**
     * 清空签到记录
     */
    clearSign: function(event) {
        const db = wx.cloud.database()
        const _ = db.command
        var that = this
        // 获取参数
        var index = event.currentTarget.dataset.index
        var _id = this.data.allListData[index]._id
        var nickName = this.data.allListData[index].userInfo.nickName
        // 显示选择框
        wx.showModal({
            title: '温馨提示',
            content: '确认清除 “' + nickName + "” 的签到数据嘛？",
            success: function(res) {
                if (res.confirm) {
                    console.log("确认清除")
                    wx.showLoading({
                        title: '清除中',
                    })
                    // 更新
                    wx.cloud.callFunction({
                        // 云函数名称
                        name: 'clearSignData',
                        // 传给云函数的参数
                        data: {
                            _id: _id
                        },
                        success: res => {
                            // console.log('[云函数] [clearSignData] ', res)
                            if (res.result.stats.updated == 1) {
                                wx.hideLoading()
                                wx.showToast({
                                    title: '成功',
                                    icon: 'success',
                                    duration: 1000
                                })
                            } else if (res.result.stats.updated == 0) {
                                wx.hideLoading()
                                wx.showToast({
                                    title: '失败',
                                    icon: 'warn',
                                    duration: 1000
                                })
                            }
                            // 刷新数据
                            that.getAllSignData()
                        },
                        fail: err => {
                            console.error('[云函数] [clearSignData] 调用失败', err)
                            wx.hideLoading()
                            wx.showToast({
                                title: '失败',
                                icon: 'warn',
                                duration: 1000
                            })
                        }
                    })
                } else if (res.cancel) {
                    console.log("取消")
                }
            }
        })
    },

    /**
     * 获取所有兑奖信息
     */
    getAllExchangeData: function() {
        const db = wx.cloud.database()
		const That = this
        // 查询所有兑换奖品数据，最多只会传回20个数组
        db.collection('onlineCheckIn')
            .where({
                ["exchangeInfo.hasRequest"]: true
            })
            .field({
                _id: true,
                signData: true,
                signDaysTimes: true,
                ["exchangeInfo.level"]: true,
                ["userInfo.nickName"]: true,
                ["userInfo.avatarUrl"]: true,
                address: true
            })
			.skip(That.data.exchangeListLength)
			.limit(20)
            .orderBy('exchangeInfo.date', 'asc')
            .get({
                success: res => {
                    console.log('[数据库][查询所有兑奖] 成功：', res)
					// 没有更多数据
					if(res.data.length==0){
						console.log("么有更多数据了")
						That.setData({
							exchangeListHasMore: false
						})
					}else{
						// 拼接字符串
						let newList = That.data.exchangeListData.concat(res.data)
						let length = That.data.exchangeListLength += res.data.length
						// 赋值
						That.setData({
							exchangeListData: newList,
							exchangeListLength: length
						})
					}
                    // 关闭下拉刷新
                    wx.stopPullDownRefresh()
					// 关闭正在加载
					this.setData({
						exchangeListIsLoad: false
					})
                },
                fail: err => {
                    console.error('[数据库][查询所有兑奖] 失败：', err)
                }
            })
    },

    /**
     * 获取所有签到信息
     */
    getAllSignData: function() {
        // 获取所有人信息
        const db = wx.cloud.database()
        const _ = db.command
		const That = this
        // 查询所有用户的签到数据，最多只会传回20个数组
        db.collection('onlineCheckIn')
            .where({
                signDaysTimes: _.neq(0)
            })
            .field({
                _id: true,
                signDaysTimes: true,
                ["userInfo.nickName"]: true,
                ["userInfo.avatarUrl"]: true
            })
			.skip(That.data.allListLength)
			.limit(20)
            .orderBy('signDaysTimes', 'desc')
            .get({
                success: res => {
                    console.log('[数据库] [查询所有签到] 成功：', res)
					// 没有更多数据
					if (res.data.length == 0) {
						console.log("么有更多数据了")
						That.setData({
							allListHasMore: false
						})
					} else {
						// 拼接字符串
						let newList = That.data.allListData.concat(res.data)
						let length = That.data.allListLength += res.data.length
						// 赋值
						That.setData({
							allListData: newList,
							allListLength: length
						})
					}
                    // 关闭下拉刷新
                    wx.stopPullDownRefresh()
					// 关闭正在加载
					this.setData({
						allListIsLoad: false
					})
                },
                fail: err => {
                    console.error('[数据库] [查询所有签到] 失败：', err)
                }
            })
    },

    /**
     * 导航栏切换
     */
    tabSelect(e) {
        this.setData({
            TabCur: e.currentTarget.dataset.id,
            scrollLeft: (e.currentTarget.dataset.id - 1) * 60
        })
    },

    /**
     * 兑奖
     */
    exchange: function(event) {
        // 获取参数
        var index = event.currentTarget.dataset.index
        // 显示模态框、赋值地址信息
        this.setData({
            showAddress: true,
            addressInfo: this.data.exchangeListData[index].address,
            selectUserIndex: index
        })
    },

    /**
     * 确认已经发货，访问云函数
     */
    confirmExchange: function() {
        // 获取参数
        const db = wx.cloud.database()
        const _ = db.command
        var that = this
        var index = this.data.selectUserIndex
        var _id = this.data.exchangeListData[index]._id
        var nickName = this.data.exchangeListData[index].userInfo.nickName
        var level = this.data.exchangeListData[index].exchangeInfo.level
        var signTimes = this.data.exchangeListData[index].signDaysTimes
        var newSignData = this.data.exchangeListData[index].signData // 浅拷贝
        // 关闭地址模态框
        this.hideModal()
        // 云函数访问
        wx.showModal({
            title: '温馨提示',
            content: '确认给 “' + nickName + "” 兑换 “" + level + "天大礼包” 嘛？",
            success: function(res) {
                if (res.confirm) {
                    console.log("确认兑换")
                    wx.showLoading({
                        title: '兑奖中',
                    })
                    // 兑换：减少次数
                    newSignData.splice(0, level)
                    // 访问云函数
                    wx.cloud.callFunction({
                        // 云函数名称
                        name: 'exchangeGift',
                        // 传给云函数的参数
                        data: {
                            _id: _id,
                            newSignDaysTimes: signTimes - level < 0 ? 0 : signTimes - level,
                            newSignData: newSignData
                        },
                        success: res => {
                            console.log('[云函数] [exchangeGift] ', res)
                            if (res.result.stats.updated == 1) {
                                wx.hideLoading()
                                wx.showToast({
                                    title: '成功',
                                    icon: 'success',
                                    duration: 1000
                                })
                            } else if (res.result.stats.updated == 0) {
                                wx.hideLoading()
                                wx.showToast({
                                    title: '失败',
                                    icon: 'warn',
                                    duration: 1000
                                })
                            }
                            // 刷新数据
                            that.getAllExchangeData()
                        },
                        fail: err => {
                            console.error('[云函数] [exchangeGift] 调用失败', err)
                            wx.hideLoading()
                            wx.showToast({
                                title: '失败',
                                icon: 'warn',
                                duration: 1000
                            })
                        }
                    })
                } else if (res.cancel) {
                    console.log("取消")
                }
            }
        })
    },

    /**
     * 隐藏地址显示
     */
    hideModal: function() {
        this.setData({
            showAddress: false,
            addressInfo: [],
            selectUserIndex: null
        })
    },

    /**
     * 复制地址信息
     */
    copyAddress: function() {
		functions.copy(this.data.addressInfo)
    },
    /**
     * 下载兑奖信息
     */
    exportExchange: function() {
        exportFile.ExchangeData()
    },
    /**
     * 导出所有签到信息
     */
    exportAll: function() {
        exportFile.SignData()
    }
})