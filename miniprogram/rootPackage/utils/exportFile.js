// miniprogram/rootPackage/utils/exportFile.js
// This file is used to store code of exporting DBdata

/**
 * Export all sign data
 */
function exportFileOFAllSignData(){
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
				console.log("[导出Excel][签到信息]", res.data)
				// 调用云函数，生成Excel
				wx.cloud.callFunction({
					// 云函数名称
					name: 'excel-export',
					// 传给云函数的参数
					data: {
						list: res.data,
						mode: "all" // 所有签到信息
					},
					success: function (res) {
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
									let date = new Date()
									date = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate() + '' + date.getHours() + '' + date.getMinutes()
									fs.saveFile({
										tempFilePath: res.tempFilePath,
										filePath: wx.env.USER_DATA_PATH + '/' + date + '签到名单.xlsx',
										success(res) {
											const savedFilePath = res.savedFilePath
											console.log("[导出Excel][存储]", savedFilePath)
											wx.hideLoading()
											// 打开文件
											wx.openDocument({
												filePath: savedFilePath,
												success: function (res) {
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

/**
 * Export all exchange gift data
 */
function exportFileOFAllExchangeGiftData(){
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
					success: function (res) {
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
									let date = new Date()
									date = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate() + '' + date.getHours() + '' + date.getMinutes()
									fs.saveFile({
										tempFilePath: res.tempFilePath,
										filePath: wx.env.USER_DATA_PATH + '/' + date + '兑奖名单.xlsx',
										success(res) {
											const savedFilePath = res.savedFilePath
											console.log("[导出Excel][存储]", savedFilePath)
											wx.hideLoading()
											// 打开文件
											wx.openDocument({
												filePath: savedFilePath,
												success: function (res) {
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

// Export setting
module.exports = {
	signData: exportFileOFAllSignData,
	exchangeData: exportFileOFAllExchangeGiftData
}