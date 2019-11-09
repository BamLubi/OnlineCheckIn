// miniprogram/rootPackage/utils/exportFile.js
// This file is used to store code of exporting DBdata

const Promise = require('../../promise/es6-promise.min.js')
const cloudFun = require('../../promise/wxCloudFun.js')
const cloudStore = require('../../promise/wxCloudStore.js')
const api = require('../../promise/wxAPI.js')
const db = wx.cloud.database()
const _ = db.command

/**
 * Export all sign data
 */
function exportFileOFAllSignData() {
    // 显示loading
    wx.showLoading({
        title: '正在导出'
    })
    // 导出
    getSignList(new Array()).then(res => {
        var list = res
        // 调用云函数
        return cloudFun.CallWxCloudFun('excel-export', {
            list: list,
            mode: "all"
        })
    }).then(res => {
        const fileID = res.result.fileID
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
            return cloudStore.DownloadWxCloudStore(fileID)
        }
    }).then(res => {
        // 返回临时文件路径
        let tempFilePath = res.tempFilePath
        let date = new Date()
        date = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate() + '' + date.getHours() + '' + date.getMinutes()
        let fileName = date + '签到名单.xlsx'
        // 保存文件
        return api.SaveFile(tempFilePath, fileName)
    }).then(res => {
        wx.hideLoading()
        const savedFilePath = res.savedFilePath
        // 打开文件
        api.OpenDocument(savedFilePath)
    }).then()
}

/**
 * Export all exchange gift data
 */
function exportFileOFAllExchangeGiftData() {
    // 显示loading
    wx.showLoading({
        title: '正在导出'
    })
    // 导出
    getExchangeList(new Array()).then(res => {
        var list = res
        // 调用云函数
        return cloudFun.CallWxCloudFun('excel-export', {
            list: list,
            mode: "exchange"
        })
    }).then(res => {
        const fileID = res.result.fileID
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
            return cloudStore.DownloadWxCloudStore(fileID)
        }
    }).then(res => {
        // 返回临时文件路径
        let tempFilePath = res.tempFilePath
        let date = new Date()
        date = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate() + '' + date.getHours() + '' + date.getMinutes()
        let fileName = date + '兑奖名单.xlsx'
        // 保存文件
        return api.SaveFile(tempFilePath, fileName)
    }).then(res => {
        wx.hideLoading()
        const savedFilePath = res.savedFilePath
        // 打开文件
        api.OpenDocument(savedFilePath)
    }).then()
}

/**
 * get all sign data
 * database operation,used to get all data,Because of the limit that cloudDB can only get less than 20 rows data.
 */
function getSignList(list) {
    //return Promise Object
    return new Promise(function(resolve, reject) {
        db.collection('onlineCheckIn')
            .where({
                signDaysTimes: _.neq(0)
            })
            .field({
                signDaysTimes: true,
                ["userInfo.nickName"]: true
            })
            .skip(list.length)
            .orderBy('signDaysTimes', 'desc')
            .get({
                success: res => {
                    console.log('[云数据库] [GET] [所有签到] success: ', res.data)
                    // add to list
                    for (var i = 0; i < res.data.length; i++) {
                        if (res.data[i].userInfo.nickName == undefined)
                            list.push(new createDefaultSign(res.data[i].signDaysTimes))
                        else
                            list.push(res.data[i])
                    }
                    // judjue whether return or go next Promise
                    if (res.data.length < 20) {
                        resolve(list)
                    } else {
                        // This is a important part for transmiting resolve() to next Promise.if you ignored it ,you would never had the ability to do any opertions to data got.
                        return getSignList(list).then(res => {
                            resolve(list)
                        })
                    }
                },
                fail: err => {
                    console.error('[云数据库] [GET] [所有签到] fail: ', err)
                    reject(err)
                },

            })
    });
}

function createDefaultSign(signDaysTimes) {
    this.signDaysTimes = signDaysTimes
    this.userInfo = new createUserInfo("未知")

    function createUserInfo(nickName) {
        this.nickName = nickName
    }
}

/**
 * get all exchange gift data
 * database operation,used to get all data,Because of the limit that cloudDB can only get less than 20 rows data.
 */
function getExchangeList(list) {
    //return Promise Object
    return new Promise(function(resolve, reject) {
        db.collection('onlineCheckIn')
            .where({
                ["exchangeInfo.hasRequest"]: true
            })
            .field({
                ["exchangeInfo.level"]: true,
                ["userInfo.nickName"]: true,
                address: true
            })
            .skip(list.length)
            .orderBy('exchangeInfo.level', 'desc')
            .get({
                success: res => {
                    console.log('[云数据库] [GET] [所有兑奖] success: ', res.data)
                    // add to list
                    for (var i = 0; i < res.data.length; i++) {
                        if (res.data[i].userInfo.nickName == undefined)
                            list.push(new createDefaultExchange(res.data[i].exchangeInfo.level, res.data[i].address))
                        else
                            list.push(res.data[i])
                    }
                    // judjue whether return or go next Promise
                    if (res.data.length < 20) {
                        resolve(list)
                    } else {
                        // This is a important part for transmiting resolve() to next Promise.if you ignored it ,you would never had the ability to do any opertions to data got.
                        return getSignList(list).then(res => {
                            resolve(list)
                        })
                    }
                },
                fail: err => {
                    console.error('[云数据库] [GET] [所有兑奖] fail: ', err)
                    reject(err)
                },

            })
    });
}

function createDefaultExchange(level, address) {
    this.address = address
    this.userInfo = new createUserInfo("未知")
	this.exchangeInfo = new createExchangeInfo(level)

    function createUserInfo(nickName) {
        this.nickName = nickName
    }

    function createExchangeInfo(level) {
        this.level = level
    }
}

// Export setting
module.exports = {
    SignData: exportFileOFAllSignData,
    ExchangeData: exportFileOFAllExchangeGiftData
}