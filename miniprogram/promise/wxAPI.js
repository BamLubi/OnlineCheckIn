// miniprogram/promise/wxAPI.js
// Package all wechat API into Promise Object

const Promise = require('es6-promise.min.js')

/**
 * call wx.showModal
 * 
 * @title modal's title
 * @content modal's content
 * @return Promise Object
 */
function ShowModal(title, content) {
	//return Promise Object
	return new Promise(function (confirm, cancel, reject) {
		wx.showModal({
			title: title,
			content: content,
			success: res=> {
				if(res.confirm){
					console.log('[wxAPI] [模态框] [确认]')
					confirm(res)
				}else if(res.cancel){
					console.log('[wxAPI] [模态框] [取消]')
					cancel(res)
				}
			},
			fail: err => {
				console.log('[wxAPI] [模态框] [错误]')
				reject(err)
			}
		})
	});
}

/**
 * call wx.chooseAddress
 * 
 * @return Promise Object
 */
function ChooseAddress() {
	//return Promise Object
	return new Promise(function (resolve, reject) {
		wx.chooseAddress({
			success: res => {
				console.log("[wxAPI] [获取地址] success: ", res)
				resolve(res)
			},
			fail: err => {
				console.log("[wxAPI] [获取地址] fail: ", err)
				reject(err)
			}
		})
	});
}

/**
 * call wx.getSetting
 * 
 * @return Promise Object
 */
function GetSetting() {
	//return Promise Object
	return new Promise(function (resolve, resolve2, reject) {
		wx.getSetting({
			success: res => {
				// 已经授权
				if (res.authSetting['scope.userInfo']) {
					console.log("[wxAPI] [获取用户设置] success: 已经授权")
					resolve(res)
				}else{
					console.log("[wxAPI] [获取用户设置] success: 未授权")
					resolve2(res)
				}
			},
			fail: err => {
				console.log("[wxAPI] [获取用户设置] fail: ", err)
				reject(err)
			}
		})
	});
}

/**
 * call wx.getUserInfo
 * 
 * @return Promise Object
 */
function GetUserInfo() {
	//return Promise Object
	return new Promise(function (resolve, reject) {
		wx.getUserInfo({
			success: res => {
				console.log("[wxAPI] [获取用户信息] success: ", res.userInfo)
				resolve(res)
			},
			fail: err => {
				console.log("[wxAPI] [获取用户信息] fail: ", err)
				reject(err)
			}
		})
	});
}


module.exports = {
	ShowModal: ShowModal,
	ChooseAddress: ChooseAddress,
	GetSetting: GetSetting,
	GetUserInfo: GetUserInfo
}