// miniprogram/pages/sign/sign.js
const app = getApp()

Page({
    /**
     * 页面的初始数据
     */
    data: {
        openid: null, // 唯一识别号
        userInfo: null, // 用户信息
        hasUserInfo: false, // 是否存储用户信息
        tableId: null, // 用户表id
        allSignData: [], // 用户签到信息
        signDays: {
            "yesterday": false, // 昨天是否签到
            "today": false, // 今天是否签到
            "all": 0 // 连续签到次数
        },
        hasRequest: false // 是否申请
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        console.log("sign页面加载")
        // 获取个人信息
        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
                hasUserInfo: true
            })
        } else {
            // 异步操作
            app.userInfoCallback = res => {
                this.setData({
                    userInfo: app.globalData.userInfo,
                    hasUserInfo: true
                })
            }
        }
        // 获取openid
        if (app.globalData.openid) {
            this.setData({
                openid: app.globalData.openid
            })
            // 如果是管理员，则跳转管理员页面
            // if (this.data.openid == app.globalData.rootOpenId) {
            //     wx.redirectTo({
            //         url: '/pages/root/root'
            //     })
            // } else {
            //     // 查询数据库
            //     this.queryTableId()
            // }
			// 查询数据库
			this.queryTableId()
        } else {
            // 异步操作
            app.openidCallback = res => {
                this.setData({
                    openid: res
                })
                // 如果是管理员，则跳转管理员页面
                // if (this.data.openid == app.globalData.rootOpenId) {
                //     wx.redirectTo({
                //         url: '/pages/root/root'
                //     })
                // } else {
                //     // 查询数据库
                //     this.queryTableId()
                // }
				// 查询数据库
				this.queryTableId()
            }
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {},

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        console.log("用户下拉")
        this.queryTableId()
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {},

    /**
     * 获取用户信息,只有第一次需要授权
     */
    getUserInfo: function(e) {
        console.log("用户点击授权")
        if (e.detail.userInfo) {
            // 当前页面赋值
            this.setData({
                userInfo: e.detail.userInfo,
                hasUserInfo: true
            })
            // 全局变量赋值
            app.globalData.userInfo = this.data.userInfo
            app.globalData.hasUserInfo = true
        }
    },

    /**
     * 签到
     */
    signIn: function() {
        console.log("开始签到")
        wx.showLoading({
            title: '签到中',
        })
        // 由于数据库访问属于异步访问，暂未写回调函数，直接在数据库访问成功后处理线性处理
        // 若后期需要函数复用，可以考虑回调函数
        // 获取table的_id
        // this.queryTableId()
        // 拿到table_id后新增签到
        if (this.data.tableId != null) {
            // 新增日期
            this.addTodaySignInfo()
        } else {
            // 查询table_id的回调函数
            this.queryTableIdCallback = res => {
                // 新增日期
                this.addTodaySignInfo()
            }
        }
    },
    /**
     * 查询用户表的_id,若不存在则总是新建表
     */
    queryTableId: function() {
        const db = wx.cloud.database()
        // 查询用户表_id
        db.collection('onlineCheckIn').where({
            _openid: this.data.openid
        }).get({
            success: res => {
                if (res.data.length != 0) {
                    // console.log('[数据库] [查询用户表] 用户表_id: ', res.data[0]._id)
                    // 设置：用户表_id，签到记录
                    this.setData({
                        tableId: res.data[0]._id,
                        allSignData: JSON.parse(JSON.stringify(res.data[0].signData)),
                        hasRequest: res.data[0].exchangeInfo.hasRequest
                    })
                    // Date序列化签到数据
                    for (let i = 0; i < this.data.allSignData; i++) {
                        this.data.allSignData[i] = new Date(this.data.allSignData[i])
                    }
                    // 设置：签到次数
                    this.setData({
                        ["signDays.all"]: res.data[0].signDaysTimes
                    })
                    // 同步请求存储缓存
                    wx.setStorageSync('tableid', res.data[0]._id)
                    // 判断今天和昨天是否签到
                    this.hasSignTodayAndYesterday()
                    // 由于该方法需要复用，设置回调函数
                    if (this.queryTableIdCallback) {
                        this.queryTableIdCallback(res.data[0])
                    }
                } else if (res.data.length == 0) {
                    console.log('[数据库] [查询用户表] 未查询到表')
                    // 新建用户表
                    this.addNewSignTable()
                }
                //  停止下拉刷新
                wx.stopPullDownRefresh()
            },
            fail: err => {
                console.error('[数据库] [查询用户表] 失败：', err)
            }
        })
    },
    /**
     * 新建用户签到表，无需传递openid
     */
    addNewSignTable: function() {
        const db = wx.cloud.database()
        // 如果未获取到用户信息，则回滚
        if (this.data.hasUserInfo == false) {
            console.log('[数据库] [新增用户表] 未获取到userinfo回滚：')
            return this.queryTableId()
        }
        // 新建表
        db.collection('onlineCheckIn').add({
            // data 字段表示需新增的 JSON 数据
            data: {
                signData: [], //用于存储签到日期
                signDaysTimes: 0,
                userInfo: this.data.userInfo,
                exchangeInfo: {
                    date: new Date(),
                    level: 0,
                    hasRequest: false
                }
            },
            success: res => {
                // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
                // console.log('[数据库] [新增用户表] 成功：', res)
                this.queryTableId()
            },
            fail: err => {
                console.error('[数据库] [新增用户表] 失败：', err)
            }
        })
    },

    /**
     * 今日签到，需确保已经有用户表
     */
    addTodaySignInfo: function() {
        const db = wx.cloud.database()
        const _ = db.command
        // 如果已经签到，则退出
        if (this.data.signDays.today == true) return
        // 当前日期
        var now = new Date()
        var newSignDataList = new Array()
        var allTimes = this.data.signDays.all + 1
        // 若昨日未签到，则签到列表清空，且次数从1开始
        if (this.data.signDays.yesterday == false) {
            newSignDataList.push(now)
            allTimes = 1
        } else {
            newSignDataList = this.data.allSignData
            newSignDataList.push(now)
        }
        // 数据库访问
        db.collection('onlineCheckIn').doc(this.data.tableId).update({
            data: {
                signData: newSignDataList,
                signDaysTimes: allTimes
            },
            success: res => {
                // console.log('[数据库] [追加日期] 成功：', res)
                // 隐藏模态框
                wx.hideLoading()
                // 改变状态
                this.setData({
                    ["signDays.today"]: true,
                    ["signDays.all"]: allTimes
                })
            },
            fail: err => {
                console.error('[数据库] [追加日期] 失败：', err)
            }
        })
    },

    /**
     * 判断今天和昨天是否签到过了
     */
    hasSignTodayAndYesterday: function() {
        const db = wx.cloud.database()
        const _ = db.command
        // 变量定义
        let hasSignToday = false
        let hasSignYesterday = false
        // 今天日期
        let today = new Date()
        // 如果没有签到数据，则直接跳过
        if (this.data.signDays.all == 0) {
            // 防止管理员删除信息后，用户前端未变化
            this.setData({
                ["signDays.today"]: false
            })
            // 退出
            return
        }
        // 转换签到时间
        let signDataLast = new Date(this.data.allSignData[this.data.allSignData.length - 1])
        // 判断今日是否签到
        if (today.getDate() == signDataLast.getDate() && today.getMonth() == signDataLast.getMonth() && today.getFullYear() == signDataLast.getFullYear()) {
            console.log("今天已经签到")
            hasSignToday = true
        } else {
            console.log("今天未签到")
            hasSignToday = false
        }
        // 判断昨日是否签到
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
        var yesterdayMinusOneDay = new Date(mathChangeDate(date, '-', 1))
        if (signDataLast.getDate() == yesterdayMinusOneDay.getDate() && signDataLast.getMonth() == yesterdayMinusOneDay.getMonth() && signDataLast.getFullYear() == yesterdayMinusOneDay.getFullYear()) {
            console.log("昨天已经签到")
            hasSignYesterday = true
        } else if (hasSignToday == true) {
            console.log("昨天已经签到")
            hasSignYesterday = true
        } else {
            console.log("昨天未签到")
            hasSignYesterday = false
        }
        // 如果有签到记录，且昨日未签到，则显示弹窗
        if (this.data.signData != [] && hasSignYesterday == false) {
            // 提示框
            wx.showModal({
                title: '温馨提示',
                content: '昨日未签到,签到已清零'
            })
            // 数据库清空记录
            db.collection('onlineCheckIn').doc(this.data.tableId).update({
                data: {
                    signData: new Array(),
                    signDaysTimes: 0
                },
                success: res => {
                    // console.log('[数据库] [清空签到] 成功：', res)
                },
                fail: err => {
                    console.error('[数据库] [清空签到] 失败：', err)
                }
            })
        }
        // 赋值
        this.setData({
            ["signDays.today"]: hasSignToday,
            ["signDays.yesterday"]: hasSignYesterday,
            ["signDays.all"]: hasSignYesterday == false ? 0 : this.data.signDays.all,
            allSignData: hasSignYesterday == false ? [] : this.data.allSignData
        })
    },

    /**
     * 申请礼包
     */
    applyGift: function(event) {
        var that = this
        const db = wx.cloud.database()
        const _ = db.command
        // 获取参数
        var level = event.currentTarget.dataset.level
        // 显示选择框
        wx.showModal({
            title: '温馨提示',
            content: '确认申请兑换 ' + level + " 天大礼包嘛？",
            success: function(res) {
                if (res.confirm) {
                    console.log("确认兑换")
                    if (wx.chooseAddress) {
                        wx.chooseAddress({
                            success: function(res) {
                                // console.log("[个人信息] [获取地址] 成功：", res)
                                wx.showLoading({
                                    title: '申请中',
                                })
                                // 发起数据库请求
                                db.collection('onlineCheckIn').doc(that.data.tableId).update({
                                    data: {
                                        ["exchangeInfo.date"]: new Date(),
                                        ["exchangeInfo.level"]: parseInt(level),
                                        ["exchangeInfo.hasRequest"]: true,
                                        "address": res
                                    },
                                    success: res => {
                                        // console.log('[数据库] [添加兑换] 成功：', res)
                                        // 隐藏模态框
                                        wx.hideLoading()
                                        // 改变状态
                                        that.setData({
                                            hasRequest: true
                                        })
                                        // 反馈
                                        wx.showToast({
                                            title: '成功',
                                            icon: 'success',
                                            duration: 1000
                                        })
                                    },
                                    fail: err => {
                                        console.error('[数据库] [添加兑换] 失败：', err)
                                        // 反馈
                                        wx.hideLoading()
                                        wx.showToast({
                                            title: '失败',
                                            icon: 'warn',
                                            duration: 1000
                                        })
                                    }
                                })
                            },
                            fail: function(err) {
                                console.log("[个人信息] [获取地址] 取消：", err)
                            }
                        })
                    } else {
                        console.log('当前微信版本不支持chooseAddress');
                    }
                } else if (res.cancel) {
                    console.log("取消")
                }
            }
        })
    }
})

// 加减天数
function mathChangeDate(date, method, days) {
    //method:'+' || '-'
    //ios不解析带'-'的日期格式，要转成'/'，不然Nan，切记
    var dateVal = date.replace(/-/g, '/');
    var timestamp = Date.parse(dateVal);
    if (method == '+') {
        timestamp = timestamp / 1000 + 24 * 60 * 60 * days;
    } else if (method == '-') {
        timestamp = timestamp / 1000 - 24 * 60 * 60 * days;
    }
    return toDate(timestamp);
}
// 转换成date
function toDate(number) {
    var n = number;
    var date = new Date(parseInt(n) * 1000);
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    return y + '-' + m + '-' + d;
}