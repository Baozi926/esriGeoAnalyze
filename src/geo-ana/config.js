define([], function () {

  var portalUrl = 'https://map.xyzhgt.com/arcgis'

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
            pic: './src/geo-ana/images/CreateBuffers32.png'
          }
        ]
      }, {
        name: '分析模式',
        children: [
          {
            name: '差值点',
            icon: 'buffer',
            url: 'tools/interpolation-point/interpolation-point',
            pic:  './src/geo-ana/images/CreateInterpolatedSurface32.png'
          }, {
            name: '热点分析',
            icon: 'findHotSpots',
            url: 'tools/find-hot-spots/find-hot-spots',
            pic: './src/geo-ana/images/FindHotSpots32.png'
          }
        ]
      }, {
        name: 'Demo',
        children: [
          {
            name: 'demo',
            icon: 'network',
            url: 'tools/Demo/Demo',
            pic: './src/geo-ana/images/FindHotSpots32.png'
          }
        ]
      }
    ]
  }
})