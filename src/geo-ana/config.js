define([], function () {

  return {
    toolList: [
      {
        name: '临近分析',
        children: [
          {
            name: '缓冲区分析',
            icon: 'buffer',
            url: 'tools/Buffer/Buffer',
            pic:'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/CreateBuffers32.png'
          }
        ]
      }, {
        name: '分析模式',
        children: [
          {
            name: '差值点',
            icon: 'buffer',
            url: 'tools/interpolation-point/interpolation-point',
            pic:'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/CreateInterpolatedSurface32.png'
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