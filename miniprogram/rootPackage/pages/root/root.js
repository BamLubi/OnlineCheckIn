// miniprogram/pages/root/root.js
const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        allListData: [], // 清空记录的列表
        exchangeListData: [], // 兑换奖品列表
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
            this.getAllSignData()
        } else if (this.data.TabCur == 1) {
            // 获取所有兑奖信息
            this.getAllExchangeData()
        }
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

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
        // 获取所有人信息
        const db = wx.cloud.database()
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
            .orderBy('exchangeInfo.date', 'asc')
            .get({
                success: res => {
                    console.log('[数据库] [查询所有兑奖] 成功：', res)
                    this.setData({
                        exchangeListData: res.data
                    })
                    // 关闭下拉刷新
                    wx.stopPullDownRefresh()
                },
                fail: err => {
                    console.error('[数据库] [查询所有兑奖] 失败：', err)
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
            .orderBy('signDaysTimes', 'desc')
            .get({
                success: res => {
                    // console.log('[数据库] [查询所有签到] 成功：', res)
                    this.setData({
                        allListData: res.data
                    })
                    // 关闭下拉刷新
                    wx.stopPullDownRefresh()
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
        let that = this.data.addressInfo
        var stringForCopy = "收件人:" + that.userName + ";电话:" + that.telNumber + ";地址:" + that.provinceName + that.cityName + that.countyName + that.detailInfo + ";邮编:" + that.postalCode + ";"
        wx.setClipboardData({
            //准备复制的数据
            data: stringForCopy,
            success: function(res) {
                console.log("剪切板复制的信息为: " + stringForCopy)
                wx.showToast({
                    title: '复制成功',
                });
            }
        });
    },
    /**
     * 下载兑奖信息
     */
    exportExchange: function() {
        wx.showLoading({
            title: '正在导出'
        })
        // 获取所有人信息
        const db = wx.cloud.database()
        // 查询所有兑换奖品数据，最多只会传回20个数组
        db.collection('onlineCheckIn')
            .where({
                ["exchangeInfo.hasRequest"]: true
            })
            .field({
                ["exchangeInfo.level"]: true,
                ["userInfo.nickName"]: true,
                address: true
            })
            .orderBy('exchangeInfo.level', 'desc')
            .get({
                success: res => {
                    console.log("[导出Excel][兑奖信息]", res.data)
                    // 调用云函数，生成Excel
                    wx.cloud.callFunction({
                        // 云函数名称
                        name: 'excel-export',
                        // 传给云函数的参数
                        data: {
                            list: res.data,
                            mode: "exchange" // 所有兑奖信息
                        },
                        success: function(res) {
                            const fileID = res.result.fileID
                            console.log("[导出Excel][云存储]", fileID)
                            if (fileID == null) {
                                wx.hideLoading()
                                Toast({
                                    message: '导出失败，请稍后再试',
                                    duration: 1500
                                })
                            } else {
                                wx.hideLoading()
                                wx.showLoading({
                                    title: '正在下载'
                                })
                                // 下载文件
                                wx.cloud.downloadFile({
                                    fileID: fileID,
                                    success: res => {
                                        // 返回临时文件路径
                                        console.log("[导出Excel][下载]", res.tempFilePath)
                                        // 保存文件
                                        const fs = wx.getFileSystemManager();
                                        fs.saveFile({
                                            tempFilePath: res.tempFilePath,
                                            filePath: wx.env.USER_DATA_PATH + '/' + '兑奖名单.xlsx',
                                            success(res) {
                                                const savedFilePath = res.savedFilePath
                                                console.log("[导出Excel][存储]", savedFilePath)
                                                wx.hideLoading()
                                                // 打开文件
                                                wx.openDocument({
                                                    filePath: savedFilePath,
                                                    success: function(res) {
                                                        console.log("[导出Excel][打开]", res)
                                                    },
                                                    fail: console.error
                                                })
                                            },
                                            fail: console.error
                                        })
                                    },
                                    fail: console.error
                                })
                            }
                        },
                        fail: console.error
                    })
                },
                fail: console.error
            })
    },
    /**
     * 导出所有签到信息
     */
    exportAll: function() {
        // 获取所有人信息
        const db = wx.cloud.database()
        const _ = db.command
        // 显示loading
        wx.showLoading({
            title: '正在导出'
        })
        // 查询所有用户的签到数据，最多只会传回20个数组
        db.collection('onlineCheckIn')
            .where({
                signDaysTimes: _.neq(0)
            })
            .field({
                signDaysTimes: true,
                ["userInfo.nickName"]: true
            })
            .orderBy('signDaysTimes', 'desc')
            .get({
                success: res => {
                    console.log("[导出Excel][兑奖信息]", res.data)
                    // 调用云函数，生成Excel
                    wx.cloud.callFunction({
                        // 云函数名称
                        name: 'excel-export',
                        // 传给云函数的参数
                        data: {
                            list: res.data,
                            mode: "all" // 所有兑奖信息
                        },
                        success: function(res) {
                            const fileID = res.result.fileID
                            console.log("[导出Excel][云存储]", fileID)
                            if (fileID == null) {
                                wx.hideLoading()
                                Toast({
                                    message: '导出失败，请稍后再试',
                                    duration: 1500
                                })
                            } else {
                                wx.hideLoading()
                                wx.showLoading({
                                    title: '正在下载'
                                })
                                // 下载文件
                                wx.cloud.downloadFile({
                                    fileID: fileID,
                                    success: res => {
                                        // 返回临时文件路径
                                        console.log("[导出Excel][下载]", res.tempFilePath)
                                        // 保存文件
                                        const fs = wx.getFileSystemManager();
                                        fs.saveFile({
                                            tempFilePath: res.tempFilePath,
                                            filePath: wx.env.USER_DATA_PATH + '/' + '签到名单.xlsx',
                                            success(res) {
                                                const savedFilePath = res.savedFilePath
                                                console.log("[导出Excel][存储]", savedFilePath)
                                                wx.hideLoading()
                                                // 打开文件
                                                wx.openDocument({
                                                    filePath: savedFilePath,
                                                    success: function(res) {
                                                        console.log("[导出Excel][打开]", res)
                                                    },
                                                    fail: console.error
                                                })
                                            },
                                            fail: console.error
                                        })
                                    },
                                    fail: console.error
                                })
                            }
                        },
                        fail: console.error
                    })
                },
                fail: console.error
            })
    }
})