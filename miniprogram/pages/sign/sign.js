// miniprogram/pages/sign/sign.js
import Toast from '../../dist/toast/toast'
const app = getApp()
const cloudDB = require('../../promise/wxCloudDB.js')
const api = require('../../promise/wxAPI.js')

var DefaultSignTable = {
    signData: [],
    signDaysTimes: 0,
    userInfo: null,
    exchangeInfo: {
        date: new Date(),
        level: 0,
        hasRequest: false
    }
}

Page({
    /**
     * 页面的初始数据
     */
    data: {
        isRoot: false, // 是否为管理员
        openid: null, // 唯一识别号
        userInfo: null, // 用户信息
        hasUserInfo: false, // 是否存储用户信息
        tableId: null, // 用户表id
        allSignData: [], // 用户签到信息
        signDays: {
            "yesterday": false, // 昨天是否签到,用于清零
            "today": false, // 今天是否签到，用于今日签到
            "all": 0, // 连续签到次数，用于显示签到次数
            "hasRequest": false, // 是否申请
        },
        showSignMask: false, // 签到成功的模态窗
        showPrizeDraw: false,
        showCalendar: false,
        dayStyle: []
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
            if (app.globalData.rootOpenId.indexOf(this.data.openid) != -1) {
                this.setData({
                    isRoot: true
                })
            }
            // 查询数据库
            this.queryTableId()
        } else {
            // 异步操作
            app.openidCallback = res => {
                this.setData({
                    openid: res
                })
                // 如果是管理员，则跳转管理员页面
                if (app.globalData.rootOpenId.indexOf(this.data.openid) != -1) {
                    this.setData({
                        isRoot: true
                    })
                }
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
    onPullDownRefresh: function() {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {},

    /**
     * 授权后，设置全局变量
     */
    authorize: function(e) {
        console.log("[授权][变量赋值]", e)
        // 当前页面赋值
        this.setData({
            userInfo: e.detail.userInfo,
            hasUserInfo: true
        })
        // 全局变量赋值
        app.globalData.userInfo = this.data.userInfo
        app.globalData.hasUserInfo = true
    },

    /**
     * 签到
     */
    signIn: function() {
        console.log("开始签到")
        wx.showLoading({
            title: '签到中',
        })
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
        var that = this
        // 查询用户表_id
        cloudDB.GetWxCloudDB('onlineCheckIn', {
                _openid: that.data.openid
            })
            .then(
                // 有记录
                function(res) {
					
					if (res.data[0].balance==undefined){
						console.log("可以等于undefined")
					}
                    // 设置：用户表_id，签到记录
                    that.setData({
                        tableId: res.data[0]._id,
                        allSignData: JSON.parse(JSON.stringify(res.data[0].signData)),
                        ["signDays.hasRequest"]: res.data[0].exchangeInfo.hasRequest,
                        ["signDays.all"]: res.data[0].signDaysTimes
                    })
                    // 由于该方法需要复用，设置回调函数
                    if (that.queryTableIdCallback) {
                        that.queryTableIdCallback(res.data[0])
                    }
                    // 判断今天和昨天是否签到
                    that.hasSignTodayAndYesterday()
                },
                // 无记录，新建表
                function(res) {
                    // 确定用户个人信息
                    if (that.data.hasUserInfo) {
                        DefaultSignTable.userInfo = that.data.userInfo
                    } else {
                        that.spaceBg = that.selectComponent("#spaceBg")
                        that.spaceBg.getUserInfoCallback = res => {
                            that.authorize(res)
                            DefaultSignTable.userInfo = that.data.userInfo
                        }
                    }
                    return cloudDB.AddWxCloudDB('onlineCheckIn', DefaultSignTable).then(res => {
                        return that.queryTableId()
                    })
                }
            )
    },

    /**
     * 今日签到，需确保已经有用户表
     */
    addTodaySignInfo: function() {
        var that = this
        // 如果已经签到，则退出
        if (this.data.signDays.today == true) {
            // 隐藏模态框
            wx.hideLoading()
            return
        }
        // 当前日期
        var now = new Date()
        var newSignDataList = new Array()
        var allTimes = this.data.signDays.all + 1
        // 若昨日未签到，则签到列表清空，且次数从1开始
        if (this.data.signDays.yesterday == false) {
            newSignDataList.push(now)
            allTimes = 1
        } else {
            newSignDataList = JSON.parse(JSON.stringify(this.data.allSignData))
            newSignDataList.push(now)
        }
        // 数据库访问
        cloudDB.UpdateWxCloudDB('onlineCheckIn', that.data.tableId, {
            signData: newSignDataList,
            signDaysTimes: allTimes
        }, '新增今日签到').then(res => {
            // 隐藏模态框
            wx.hideLoading()
            // 改变状态
            that.setData({
                ["signDays.today"]: true,
                ["signDays.all"]: allTimes,
                showSignMask: true,
                allSignData: newSignDataList
            })
            // 签到成功后，调用组件方法
            that.spaceBg = that.selectComponent("#spaceBg")
            that.spaceBg.setHasSign(allTimes)
            // 签到成功后，更新日历
            that.createDayStyle()
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
            // 调用组件库函数
            this.spaceBg = this.selectComponent("#spaceBg")
            this.spaceBg.setHasSign(this.data.signDays.all)
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
            // 调用组件库函数
            this.spaceBg = this.selectComponent("#spaceBg")
            this.spaceBg.setHasSign(0)
            // 提示框
            wx.showModal({
                title: '温馨提示',
                content: '昨日未签到,签到已清零'
            })
            // 数据库清空记录
            cloudDB.UpdateWxCloudDB('onlineCheckIn', this.data.tableId, {
                signData: new Array(),
                signDaysTimes: 0
            }, '清空记录').then()
        }
        // 赋值
        this.setData({
            ["signDays.today"]: hasSignToday,
            ["signDays.yesterday"]: hasSignYesterday,
            ["signDays.all"]: hasSignYesterday == false ? 0 : this.data.signDays.all,
            allSignData: hasSignYesterday == false ? [] : this.data.allSignData
        })
        // 设置签到日期样式
        this.createDayStyle()
    },

    /**
     * 申请礼包
     */
    applyGift: function() {
        var that = this
        // 获取参数
        var level = this.data.signDays.all
        // 小于10天
        if (this.data.signDays.hasRequest) {
            Toast({
                message: '上一次兑奖未完结，无法再次兑奖',
                duration: 1500
            })
        } else if (level < 10) {
            Toast({
                message: '签到次数小于10天，无法兑奖',
                duration: 1500
            })
        } else {
            level = level < 30 ? 10 : 30
            // 显示选择框
            api.ShowModal('', '确认申请兑换' + level + '天大礼包嘛').then(res => {
                return api.ChooseAddress()
            }).then(res => {
                wx.showLoading({
                    title: '申请中'
                })
                return cloudDB.UpdateWxCloudDB('onlineCheckIn', that.data.tableId, {
                    ["exchangeInfo.date"]: new Date(),
                    ["exchangeInfo.level"]: parseInt(level),
                    ["exchangeInfo.hasRequest"]: true,
                    "address": res
                }, '兑换奖品')
            }).then(res => {
                // 隐藏模态框
                wx.hideLoading()
                // 改变状态
                that.setData({
                    ["signDays.hasRequest"]: true
                })
                // 反馈
                wx.showToast({
                    title: '申请成功',
                    icon: 'success',
                    duration: 1000
                })
            }).catch(err => {
                // 反馈
                wx.hideLoading()
                Toast({
                    message: '服务器异常，请稍后再试',
                    duration: 1000
                })
            })
        }
    },
    /**
     * 跳转规则页面
     */
    naviToRule: function() {
        wx.navigateTo({
            url: '/pages/rule/rule',
        })
    },
    /**
     * 抽奖
     */
    superDraw: function() {
        this.setData({
            showPrizeDraw: true
        })
    },
    /**
     * 显示签到记录日历
     */
    showHistory: function() {
        this.calendar = this.selectComponent("#calendar")
        this.calendar.refreshCalendar()
        this.setData({
            showCalendar: true
        })
    },
    /**
     * 隐藏签到记录日历
     */
    hideHistory: function() {
        this.setData({
            showCalendar: false
        })
    },
    /**
     * 隐藏签到成功模态框
     */
    hideSignSuccessMask: function() {
        this.setData({
            showSignMask: false
        })
    },
    /**
     * 隐藏幸运抽奖模态框
     */
    hidePrizeDrawMask: function() {
        this.setData({
            showPrizeDraw: false
        })
    },
    /**
     * 跳转到管理员页面
     */
    navigateToRoot: function() {
        if (this.data.openid == app.globalData.rootOpenId) {
            wx.navigateTo({
                url: '/rootPackage/pages/root/root'
            })
        }
    },
    /**
     * 生成日期序列
     */
    createDayStyle: function() {
        let days = new Array()
        for (var i = 0; i < this.data.allSignData.length; i++) {
            days[i] = new Date(this.data.allSignData[i])
            days[i] = days[i].getFullYear() + "-" + (days[i].getMonth() + 1 < 10 ? '0' + days[i].getMonth() + 1 : days[i].getMonth() + 1) + "-" + (days[i].getDate() < 10 ? '0' + days[i].getDate() : days[i].getDate())
            days[i] = new CreateDayStyleObject(days[i])
        }
        this.setData({
            dayStyle: days
        })
    }
})

// 选中的日期构造器
function CreateDayStyleObject(day) {
    this.id = day
    this.style = 'color: red;background-color: yellow;font-weight:bold;'
}
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