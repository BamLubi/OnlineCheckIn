// miniprogram/rootPackage/utils/functions.js
// This file is used to store some signal functions

/**
 * copy user's Address to clipboard
 */
function copyAddressTOClipboard(Address) {
	var stringForCopy = "收件人:" + Address.userName + ";电话:" + Address.telNumber + ";地址:" + Address.provinceName + Address.cityName + Address.countyName + Address.detailInfo + ";邮编:" + Address.postalCode + ";"
    wx.setClipboardData({
        //准备复制的数据
        data: stringForCopy,
        success: function(res) {
            console.log("[剪切板] " + stringForCopy)
            wx.showToast({
                title: '复制成功',
            });
        }
    });
}

// Export setting
module.exports = {
	copy: copyAddressTOClipboard
}