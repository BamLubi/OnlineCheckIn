// 云函数入口文件 
const cloud = require('wx-server-sdk')
const nodeExcel = require('excel-export')
const path = require('path');
cloud.init()
// 云函数入口函数 
exports.main = async(event, context) => {
	var tableMap = {
		styleXmlFile: path.join(__dirname, "styles.xml"),
		name: Date.now() + "-export",
		cols: [],
		rows: [],
	}
    if (event.mode == "exchange") {
        var tableHead = ["昵称", "兑奖次数", "姓名", "电话", "省", "市", "区", "详细地址", "邮编"];
        //添加表头
        for (var i = 0; i < tableHead.length; i++) {
            tableMap.cols[tableMap.cols.length] = {
                caption: tableHead[i],
                type: 'string'
            }
        }
        //添加每一行数据
        for (var i = 0; i < event.list.length; i++) {
            tableMap.rows[tableMap.rows.length] = [
                event.list[i].userInfo.nickName,
				String(event.list[i].exchangeInfo.level),
                event.list[i].address.userName,
				String(event.list[i].address.telNumber),
                event.list[i].address.provinceName,
                event.list[i].address.cityName,
                event.list[i].address.countyName,
                event.list[i].address.detailInfo,
				String(event.list[i].address.postalCode)
            ]
        }
	} else if (event.mode == "all"){
		var tableHead = ["昵称", "签到次数"];
		//添加表头
		for (var i = 0; i < tableHead.length; i++) {
			tableMap.cols[tableMap.cols.length] = {
				caption: tableHead[i],
				type: 'string'
			}
		}
		//添加每一行数据
		for (var i = 0; i < event.list.length; i++) {
			tableMap.rows[tableMap.rows.length] = [
				event.list[i].userInfo.nickName,
				String(event.list[i].signDaysTimes)
			]
		}
	}
    //保存excelResult到相应位置
    var excelResult = nodeExcel.execute(tableMap);
    var filePath = "outputExcels";
    var fileName = cloud.getWXContext().OPENID + "-" + Date.now() / 1000 + '.xlsx';
    console.log(excelResult);
    //上传文件到云端
    return await cloud.uploadFile({
        cloudPath: path.join(filePath, fileName),
        fileContent: new Buffer(excelResult, 'binary')
    });
}