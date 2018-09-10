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

      dfd.resolve() //dfd.reject()

      return dfd;
    }
  });

  return widget;

})