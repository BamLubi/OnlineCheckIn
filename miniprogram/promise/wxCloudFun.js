// miniprogram/promise/wxCloudFun.js
// Package all wx cloud function into Promise Object

const Promise = require('es6-promise.min.js')

/**
 * used to call weixin Cloud Function
 * 
 * @params funName , cloud function's name
 * @params data , cloud function's data for POST
 * @return Promise Object
 */
function CallWxCloudFun(funName, data) {
    //return Promise Object
    return new Promise(function(resolve, reject) {
        wx.cloud.callFunction({
            name: funName,
            data: data,
            success: res => {
                console.log('[云函数] [' + funName + '] success: ', res.result)
                resolve(res)
            },
            fail: err => {
				console.error('[云函数] [' + funName + '] fail: ', err)
                reject(res)
            }
        })
    });
}

module.exports = {
    CallWxCloudFun: CallWxCloudFun
}