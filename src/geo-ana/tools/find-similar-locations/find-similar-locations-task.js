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
  var widget = declare('caihm.widgets.find-similar-locations-task', [], {
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
              }, {analyzeToolName: 'FindSimilarLocations'}));

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
      var url = param.analyzeService + '/FindSimilarLocations/submitJob';
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
        inputLayer: JSON.stringify({"url": param.param.inputLayer}),
        inputQuery: param.param.inputQuery, //'ADCLASS = 3',
        searchLayer: JSON.stringify({"url": param.param.searchLayer}),
        analysisFields: JSON.stringify(param.param.analysisFields) ,
        numberOfResults: 0,
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