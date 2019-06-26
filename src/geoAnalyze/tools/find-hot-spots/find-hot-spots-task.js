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
  var widget = declare('caihm.widgets.findHotSpots', [], {
    run(param) {
      
      var dfd = new Deferred();
      arcgisUtil
        .createServiceWithValidation(param)
        .then(lang.hitch(this, function (portalItem) {
          this
            .submitJob(lang.mixin(param, {portalItem: portalItem}))
            .then(lang.hitch(this, function (res) {
              var event = arcgisUtil.watchJob(lang.mixin(param, {
                jobId: res.jobId
              }, {analyzeToolName: 'FindHotSpots'}));

              event.on('success', lang.hitch(this, function (res) {
                console.log(res)
               
                dfd.resolve({success: true, serviceUrl: param.portalItem.url});
              }));

              event.on('error', lang.hitch(this, function (res) {
             
                var msg = '';

                ArrayUtil.forEach(res.messages, function (v, k) {
                  msg += k + ': ' + v.description + '\n';
                }, this);

                arcgisUtil.removeServicefromPortal(param);
                console.log(msg);
                dfd.reject(msg);
              }));

              event.on('msg', lang.hitch(this, function (res) {
                console.log(res)
              }));

              event.on('internet-error', lang.hitch(this, function (err) {
                arcgisUtil.removeServicefromPortal(param);
                dfd.reject(err);
              }))

            }), lang.hitch(this, function (err) {
              arcgisUtil.removeServicefromPortal(param);
              dfd.reject(err);

            }));

        }), lang.hitch(this, function (err) {

          dfd.reject(err);
        }));

      return dfd;
    },
    submitJob(param) {
    

      var dfd = new Deferred();
      var url = param.analyzeService + '/FindHotSpots/submitJob';
      var analysisLayer = {
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
        analysisLayer: JSON.stringify(analysisLayer),
        analysisField:param.param.analysisField,
        boundingPolygonLayer:param.param.boundingPolygonLayer,
        aggregationPolygonLayer:param.param.aggregationPolygonLayer,
        shapeType: 'fishnet',
        returnProcessInfo: true,
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