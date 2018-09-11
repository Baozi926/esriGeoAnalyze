define([], function () {

  return {
    forceHttps: true, //是否强制使用https来加载服务
    toolList: [
      {
        name: '临近分析',
        children: [
          {
            name: '缓冲区分析',
            icon: 'buffer',
            url: 'tools/Buffer/Buffer',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/Cr' +
              'eateBuffers32.png'
          }
        ]
      }, {
        name: '分析模式',
        children: [
          {
            name: '差值点',
            icon: 'buffer',
            url: 'tools/interpolation-point/interpolation-point',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/Cr' +
                'eateInterpolatedSurface32.png'
          }, {
            name: '热点分析',
            icon: 'findHotSpots',
            url: 'tools/find-hot-spots/find-hot-spots',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/Fi' +
                'ndHotSpots32.png'
          }
        ]
      }, {
        name: 'Demo',
        children: [
          {
            name: 'demo',
            icon: 'network',
            url: 'tools/Demo/Demo'
          }
        ]
      }
    ]
  }
})