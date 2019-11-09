// miniprogram/promise/wxCloudStore.js
// Package all wx cloud function into Promise Object

const Promise = require('es6-promise.min.js')

/**
 * used to call weixin Cloud Store Functions
 * 
 * @params funName , cloud function's name
 * @params data , cloud function's data for POST
 * @return Promise Object
 */
function DownloadWxCloudStore(fileID) {
    //return Promise Object
    return new Promise(function(resolve, reject) {
        wx.cloud.downloadFile({
            fileID: fileID,
            success: res => {
                console.log("[云存储] [下载] success: ", res)
                resolve(res)
			},
			fail: err => {
				console.err("[云存储] [下载] fail: ", err)
				reject(err)
			}
        });
    })
}

module.exports = {
	DownloadWxCloudStore: DownloadWxCloudStore
}