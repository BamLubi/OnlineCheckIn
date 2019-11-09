// miniprogram/promise/advDB.js
// package special operations of wxCloud DB

const Promise = require('es6-promise.min.js')
const db = wx.cloud.database()
const _ = db.command

/**
 * @limit The max numbers of list data,no bigger than 20
 */
function GetRankList(limit) {
    //return Promise Object
    return new Promise(function(resolve, reject) {
        db.collection('onlineCheckIn')
            .field({
                signDaysTimes: true,
                ["userInfo.nickName"]: true,
                ["userInfo.avatarUrl"]: true
            })
            .limit(limit)
            .orderBy('signDaysTimes', 'desc')
            .get({
                success: res => {
					console.log('[云数据库] [GET] [rankList] success: ', res.data)
                    resolve(res)
                },
                fail: err => {
					console.error('[云数据库] [GET] [rankList] fail: ', err)
                    reject(err)
                }
            })
    });
}

module.exports = {
	GetRankList: GetRankList
}