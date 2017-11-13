/*
 * @author: wes
 * @date: 2017-10-26
 * @desc: 产品详细
*/
var util = require('../../utils/util.js')
var app = getApp()

Page({
  data: {
    detail: {},
    id: '',
    count: 0,
    // 轮播
    swiperTrue: true,
    swiperHeight: 0,
    swiperCurrent: 0,
    // 属性
    showModalStatus: false,
    attrList: [],
    argsList: [],
    // 商城
    productAttr: '',
    num: 1,
    skuCode: '',
    appendPrice: 0,
    appendIds: '',
    defaultColor: ''
  },
  page: function (e) {
    debugger
    wx.navigateTo({
      url: e.currentTarget.dataset.url
    })
  },
  pageTab: function (e) {
    wx.switchTab({
      url: '../cart/cart'
    })
  },
  get: function () {
    var that = this
    //调用应用实例的方法获取全局数据
    wx.showNavigationBarLoading()
    console.log('产品详细' + this.data.id + '加载中...')
    wx.request({
      url: 'https://api.jihui88.net/jihuiapi/products/single/' + this.data.id,
      success: function (res) {
        if (res.data.proddesc === null) {
          res.data.proddesc = ''
        } else {
          // .replace(/<style[^>]*?>[\s\S]*?<\/style>/g, "")
          res.data.proddesc = res.data.proddesc.replace(/<img /g, "<img width='100%;' ").replace(/\"/g, "'")
        }
        if (res.data.detail1 === null) {
          res.data.detail1 = ''
        } else {
          // 表格
          res.data.detail1 = res.data.detail1.replace(/<table>/g, "<table style='border-collapse:collapse;display:table;'>").replace(/<td>/g, "<td style='padding: 5px 10px;border: 1px solid #DDD;'>").replace(/<th>/g, "<th style='padding: 5px 10px;border: 1px solid #DDD;border-top:1px solid #BBB;background-color:#F7F7F7;'>").replace(/\"/g, "'")
        }

        res.data.price = parseFloat(res.data.price).toFixed(2)
        for (var i = 0; i < res.data.imagelist.length; i++) {
          res.data.imagelist[i].sourceProductImagePath = util.picUrl(res.data.imagelist[i].sourceProductImagePath, 3)
        }
        that.setData({
          detail: res.data
        })
        wx.setStorage({
          key: 'detail' + that.data.id,
          data: res.data
        })
        that.wxTitle()
        wx.hideNavigationBarLoading()
      }
    })
  },
  /* 预览图片 */
  showPic: function (e) {
    var urls = []
    for (var i = 0; i < this.data.detail.imagelist.length; i++) {
      urls.push(this.data.detail.imagelist[i].sourceProductImagePath)
    }
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: urls
    })
  },
  showDescPic: function (e) {
    var urls = []
    var descs = this.data.detail.proddesc.match(/<img[^>]+>/g)
    if (descs != null) {
      for (var i = 0; i < descs.length; i++) {
        urls.push(descs[i].replace(/(<img[^>]*?src=['""]([^'""]*?)['""][^>]*?>)/g, '$2'))
      }
      wx.previewImage({
        urls: urls
      })
    }
  },

  // 获取属性参数
  getAttr: function () {
    var that = this
    wx.request({
      url: 'https://wx.jihui88.net/rest/api/shop/order/args_list',
      data: {
        productId: this.data.detail.product_id,
        memberRankId: app.globalData.member.memberRankId,
        attrState: this.data.detail.attr_state,
        skey: app.globalData.member.skey
      },
      success: function (res) {
        var attrList = res.data.attributes.data

        for (var i = 0; i < attrList.length; i++) {
          var element = attrList[i].element;
          var price = attrList[i].price
          attrList[i].eleList = element.substring(1, element.length - 1).split(',')
          attrList[i].priceList = price.substring(1, price.length - 1).split(',')
        }
        that.setData({
          attrList: attrList,
          argsList: attrList[0] && attrList[0].argsList
        })
        wx.setStorage({
          key: 'attr' + that.data.id,
          data: attrList
        })
      }
    })
  },
  /* 下拉框切换 */
  setModalStatus: function (e) {
    var status = e.currentTarget.dataset.status
    if (status === "1" && this.data.attrList.length === 0) {
      this.getAttr()
    }
    console.log("设置显示状态，1显示0不显示", status);
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export()
    })
    if (status == 1) {
      this.setData({
        skip: e.currentTarget.dataset.skip,
        showModalStatus: true
      });
    }
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation
      })
      if (status == 0) {
        this.setData({
          showModalStatus: false
        });
      }
    }.bind(this), 200)
  },
  /* 属性选择 */
  attrClick: function (e) {
    // 选择边框
    this.data.attrList[e.target.dataset.index].dx = e.target.dataset.idx
    this.setData({
      attrList: this.data.attrList
    })
    // 属性图片

    var productAttr = ''
    var skuCode = ''
    var appendIds = ''
    var cost_price = 0
    var pic = ''
    for (var i = 0; i < this.data.attrList.length; i++) {
      var attr = this.data.attrList[i].eleList[this.data.attrList[i].dx] || ''
      cost_price = parseFloat(parseFloat(this.data.detail.price) + parseFloat(this.data.attrList[i].priceList[this.data.attrList[i].dx]) || 0).toFixed(2)
      if (appendIds === '') {
        appendIds = attr
        productAttr = this.data.attrList[i].name + ': ' + attr
      } else {
        appendIds = appendIds + ',' + attr
        productAttr = productAttr + ';  ' + this.data.attrList[i].name + ': ' + attr
      }
    }

    for (var i = 0; i < this.data.argsList.length; i++) {
      if (appendIds === this.data.argsList[i].sku_code) {
        skuCode = this.data.argsList[i].id
        pic = this.data.argsList[i].pic
        cost_price = this.data.argsList[i].cost_price
      }
    }
    this.data.detail.price = cost_price
    this.setData({
      productAttr: productAttr,
      skuCode: skuCode,
      appendIds: appendIds,
      detail: this.data.detail
    })

    if (pic && pic != '') {
      this.data.detail.pic_path = 'http://img.jihui88.com/' + pic
      this.setData({
        detail: this.data.detail
      })
    }
  },
  /* 点击减号 */
  bindMinus: function () {
    var num = this.data.num;
    // 如果大于1时，才可以减
    if (num > 1) {
      num--;
    }
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = num <= 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      num: num,
      minusStatus: minusStatus
    });
  },
  /* 点击加号 */
  bindPlus: function () {
    var num = this.data.num;
    // 不作过多考虑自增1
    num++;
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = num < 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      num: num,
      minusStatus: minusStatus
    });
  },
  /* 输入框事件 */
  bindManual: function (e) {
    var num = e.detail.value;
    // 将数值与状态写回
    this.setData({
      num: num
    });
  },
  /* 支付 */
  pay: function () {
    var that = this

    for (var i = 0; i < this.data.attrList.length; i++) {
      if (!this.data.attrList[i].dx && this.data.attrList[i].dx !== 0) {
        wx.showModal({
          title: this.data.attrList[i].name + '未选择'
        })
        return false
      }
    }
    wx.request({
      url: 'https://wx.jihui88.net/rest/api/shop/cartItem/add',
      type: "get",
      dataType: "jsonp",
      data: {
        callback: "jsonpCallback",
        payType: '01',
        id: this.data.detail.product_id,
        quantity: this.data.num,
        mobileShop: true,
        entName: this.data.detail.name,
        productAttr: this.data.productAttr, // []
        skuCode: this.data.skuCode,
        appendPrice: this.data.appendPrice,
        appendIds: this.data.appendIds,
        formulaResult: '1',
        formulaStr: [],
        skey: app.globalData.member.skey
      },
      success: function (res) {
        var str = res.data.split('jsonpCallback(')[1]
        var data = JSON.parse(str.substring(0, str.length - 1))
        if (data.success) {
          if (that.data.skip === '1') {
            wx.switchTab({
              url: '../cart/cart'
            })
          }
          that.setData({
            count: that.data.count + that.data.num,
            showModalStatus: false
          });
        } else {
          wx.showModal({
            title: '提示',
            content: data.msg,
            success: function (res) {
              if (res.confirm) {
                console.log('用户点击确定')
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
        }
      }
    })
  },
  imageLoad: function (e) {
    var $width = e.detail.width,    //获取图片真实宽度
      $height = e.detail.height,
      ratio = $width / $height;    //图片的真实宽高比例

    var viewWidth = wx.getSystemInfoSync().windowWidth;    //窗口宽度
    var viewHeight = viewWidth / ratio;    //计算的高度值
    this.setData({
      swiperHeight: 'height:' + viewHeight + 'px'
    })
  },
  swiperChange: function(e){
    this.setData({
      swiperCurrent: e.detail.current
    })
  },
  // cartCount
  cartCount: function () {
    var that = this
    wx.request({
      url: 'https://wx.jihui88.net/rest/api/shop/order/info1',
      data: {
        entId: app.globalData.enterpriseId,
        cIds: '',
        skey: app.globalData.member.skey
      },
      success: function (res) {
        var count = (res.data.attributes && res.data.attributes.totalQuantity) || 0
        wx.setStorage({
          key: 'cartCount',
          data: count
        })
        that.setData({
          count: 0
        })
      }
    })
  },
  wxTitle: function () {
    wx.setNavigationBarTitle({
      title: decodeURIComponent(this.data.detail.name)
    })
  },
  onLoad: function (options) {
    this.setData({
      id: options.id,
      'detail.name': options.name,
      defaultColor: app.globalData.defaultColor
    })
  },

  onReady: function () {
    if (app.globalData.member === null) {
      app.getUserInfo()
    }
    var detail = wx.getStorageSync('detail' + this.data.id)
    if (!detail) {
      this.get()
    } else {
      this.setData({
        detail: detail
      })
      this.wxTitle()
    }
    var cartCount = wx.getStorageSync('cartCount')
    if (!cartCount) {
      this.cartCount()
    } else {
      this.setData({
        count: cartCount
      })
    }
  },
  onPullDownRefresh: function () {
    this.get()
    this.getAttr()
    this.cartCount()
    wx.stopPullDownRefresh()
  },
  onShareAppMessage: function () {
    return {
      title: decodeURIComponent(this.data.detail.name)
    }
  }
})
