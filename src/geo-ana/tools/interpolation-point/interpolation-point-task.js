define([
  'dojo/Evented',
  'dojo/promise/all',
  'dojo/_base/Deferred',
  'dojo/_base/lang',
  'dojo/dom-class',
  'dojo/dom-style',
  "esri/config",
  'esri/request',
  'dojo/_base/declare',
  'dojo/_base/array',
  '../../arcgisUtil'
], function (Evented, all, Deferred, lang, domClass, domStyle, esriConfig, esriRequest, declare, ArrayUtil, arcgisUtil) {
  var widget = declare('caihm.widgets.interpolation-point-task', [], {

    run(param) {

      var dfd = new Deferred();
      arcgisUtil
        .CreateServiceWithValidation(param)
        .then(lang.hitch(this, function (portalItem) {
          this
            .submitJob(lang.mixin(param, {portalItem: portalItem}))
            .then(lang.hitch(this, function (res) {
              var event = arcgisUtil.watchJobj(lang.mixin(param, {jobId: res.jobId}));

              event.on('success', lang.hitch(this, function (res) {
                debugger
                dfd.resolve({success: true, serviceUrl: param.portalItem.url});
              }));

              event.on('error', lang.hitch(this, function (res) {
                alert(res);
              }));

              event.on('msg', lang.hitch(this, function (res) {
                console.log(res)
              }));

            }), lang.hitch(this, function (err) {
              dfd.reject(err);

            }));

        }), lang.hitch(this, function (err) {

          dfd.reject(err);
        }));

      return dfd;
    },
    submitJob(param) {
      //设置空间分析工具的名称，在监控gp执行时需用到

      var dfd = new Deferred();
      var url = param.analyzeService + '/InterpolatePoints/submitJob';
      var inputLayer = {
        "url": param.param.inputLayer
      }
      var OutputName = {
        "serviceProperties": {
          "name": param.param.exportService.name,
          "serviceUrl": param.portalItem.url
        },
        "itemProperties": {
          "itemId": param.portalItem.url,
          "folderId": param.param.folderId
        }
      }

      var queryParam = {
        f: 'json',
        inputLayer: JSON.stringify(inputLayer),
        field: param.param.field,
        interpolateOption: 5,
        classificationType: 'GeometricInterval',
        numClasses: 10,
        outputPredictionError: false,
        OutputName: JSON.stringify(OutputName),
        context: JSON.stringify(param.param.context),
        token: param.user.token
      }

      esriRequest(url, {
          query: queryParam,
          method: 'post'
        }).then(lang.hitch(this, function (res) {
        param.jobId = res.data.jobId;
        console.log('jobId:' + param.jobId);
        dfd.resolve(res.data);
      }), function (err) {
        dfd.reject(err);
      });

      return dfd;

    }
  });

  return widget;

})