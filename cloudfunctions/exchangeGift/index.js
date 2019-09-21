// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
	env: 'lyy1-2mnm7',
	traceUser: true
})
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
	const wxContext = cloud.getWXContext()
	return db.collection('onlineCheckIn').doc(event._id).update({
		data: {
			["exchangeInfo.level"]: 0,
			["exchangeInfo.hasRequest"]: false,
			signDaysTimes: event.newSignDaysTimes,
			signData: event.newSignData,
			address: []
		},
		success: res => { },
		fail: err => { }
	})
}