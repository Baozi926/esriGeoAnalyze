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
  var widget = declare('caihm.widgets.DemoTask', [], {
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
              }, {analyzeToolName: 'InterpolatePoints'}));

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
    submitJob(){

    }
  });

  return widget;

})