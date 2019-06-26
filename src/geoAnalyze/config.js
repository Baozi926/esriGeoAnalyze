define([], function () {

  var portalUrl = 'https://map.xyzhgt.com/arcgis'

  return {
    forceHttps: true, //是否强制使用https来加载服务
    toolList: [
       {
        name: '数据汇总',
        children: [
            {
                name: '范围内汇总',
                icon: 'summarizewithin',
                url: 'tools/summarize-within/summarize-within',
                pic: 'onemap/app/modules/geoAnalyze/images/SummarizeWithin32.png'
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
            pic: 'onemap/app/modules/geoAnalyze/images/CreateBuffers32.png'
          }
        ]
      }, {
        name: '模式分析',
        children: [
          {
            name: '插值点',
            icon: 'CreateInterpolatedSurface',
            url: 'tools/interpolation-point/interpolation-point',
            pic: 'onemap/app/modules/geoAnalyze/images/CreateInterpolatedSurface32.png'
          }, {
            name: '热点分析',
            icon: 'findHotSpots',
            url: 'tools/find-hot-spots/find-hot-spots',
            pic: 'onemap/app/modules/geoAnalyze/images/FindHotSpots32.png'
          }, {
            name: '计算密度',
            icon: 'CreateDensitySurface',
            url: 'tools/calculate-density/calculate-density',
            pic: 'onemap/app/modules/geoAnalyze/images/CreateDensitySurface32.png'

          }
        ]
      }, {
        name: '查找位置',
        children: [
          // {
          //   name: '查找相似位置',
          //   icon: 'FindSimilarLocations',
          //   url: 'tools/find-similar-locations/find-similar-locations',
          //   pic: 'onemap/app/modules/geoAnalyze/images/FindSimilarLocations32.png'
          // },
           {
            name: '派生新位置',
            icon: 'FindNewLocations',
            url: 'tools/derive-new-locations/derive-new-locations',
            pic: 'onemap/app/modules/geoAnalyze/images/FindNewLocations32.png'
          }
        ]
      },
      {
        name: '和网分析',
        children: [
          {
            name: '追溯分析',
            // icon: 'extractdata',
            url: 'tools/up-down-stream-tracing/up-down-stream-tracing',
            pic: 'onemap/app/modules/geoAnalyze/images/ClipAndShip32.png'
          },
          {
            name: '截取分析',
            // icon: 'extractdata',
            url: 'tools/river-intercept/river-intercept',
            pic: 'onemap/app/modules/geoAnalyze/images/ClipAndShip32.png'
          },
          {
            name: '河道距离计算',
            // icon: 'extractdata',
            url: 'tools/river-length-calc/river-length-calc',
            pic: 'onemap/app/modules/geoAnalyze/images/ClipAndShip32.png'
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
      //       pic: 'onemap/app/modules/geoAnalyze/images/ClipAndShip32.png'
      //     }
      //   ]
      // }
    ]
  }
})