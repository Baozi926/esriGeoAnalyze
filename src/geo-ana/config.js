define([], function () {

  var portalUrl = 'https://map.xyzhgt.com/arcgis'

  return {
    portalDomain:'https://map.xyzhgt.com/',
    forceHttps: true, //是否强制使用https来加载服务
    toolList: [
       {
        name: '数据汇总',
        children: [
            {
                name: '范围内汇总',
                icon: 'summarizewithin',
                url: 'tools/summarize-within/summarize-within',
                pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/SummarizeWithin32.png'
            }
        ]
      },
      {
        name: '临近分析',
        children: [
          {
            name: '缓冲区分析',
            icon: 'CreateBuffers',
            url: 'tools/Buffer/Buffer',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/CreateBuffers32.png'
          }
        ]
      }, {
        name: '模式分析',
        children: [
          {
            name: '差值点',
            icon: 'CreateInterpolatedSurface',
            url: 'tools/interpolation-point/interpolation-point',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/CreateInterpolatedSurface32.png'
          }, {
            name: '热点分析',
            icon: 'findHotSpots',
            url: 'tools/find-hot-spots/find-hot-spots',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/FindHotSpots32.png'
          }, {
            name: '计算密度',
            icon: 'CreateDensitySurface',
            url: 'tools/calculate-density/calculate-density',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/CreateDensitySurface32.png'

          }
        ]
      }, {
        name: '查找位置',
        children: [
          {
            name: '查找相似位置',
            icon: 'FindSimilarLocations',
            url: 'tools/find-similar-locations/find-similar-locations',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/FindSimilarLocations32.png'
          }, {
            name: '派生新位置',
            icon: 'FindNewLocations',
            url: 'tools/derive-new-locations/derive-new-locations',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/FindNewLocations32.png'
          }
        ]
      }, {
        name: '数据管理',
        children: [
          {
            name: '提取数据',
            icon: 'extractdata',
            url: 'tools/extract-data/extract-data',
            pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/ClipAndShip32.png'
          }
        ]
      }
      // ,
      //  {
      //   name: 'demo',
      //   children: [
      //     {
      //       name: 'demo',
      //       icon: 'extractdata',
      //       url: 'tools/Demo/Demo',
      //       pic: 'https://map.xyzhgt.com/arcgis/home/10.5.1/js/jsapi/esri/dijit/analysis/images/ClipAndShip32.png'
      //     }
      //   ]
      // }
    ]
  }
})