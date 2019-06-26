/**
 * @author zj
 * @createDate 2018-9-3
 *
 */

define([
  'esri/layers/FeatureLayer',
  'dojo/_base/array',
  'dojo/on',
  'dojo/promise/all',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/dom-class',
  'dojo/dom-style',
  'esri/config',
  'esri/request',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/_base/declare',
  'dojo/text!./template.html',
  'dojo/_base/array',
  './summarize-within-task',
  '../../arcgisUtil',
  '../ToolBase',
  '../../config'
], function(
  FeatureLayer,
  ArrayUtil,
  on,
  all,
  domConstruct,
  lang,
  domClass,
  domStyle,
  esriConfig,
  esriRequest,
  _WidgetBase,
  _TemplatedMixin,
  declare,
  template,
  arrayUtil,
  summarizeWithinTask,
  arcgisUtil,
  ToolBase,
  geoAnaConfig
) {
  var widget = declare(
    'caihm.widgets.summarize-within',
    [_WidgetBase, _TemplatedMixin, ToolBase],
    {
      constructor(options) {
        this.mapView = options.mapView;
        this.portalUrl = options.portalUrl;
        this.user = options.user;
        this.analyzeService = options.analyzeService;
        this.portalInfo = options.portalInfo;
      },

      templateString: template,

      data: {
        currentServicesInfo: [],
        avaliableFields: []
      },

      startup() {
        this.getAvailableLayer(); //初始化选择图层
        this.initFolders(); //初始化输出位置
        this.useCurrentExtentChange({ target: this.useCurrentExtent_Node }); //初始化使用当前extent
        this.jishuCheckChange({ target: this.jishuCheck_Node }); //初始化使用当前jishu check
      },

      //获取输入信息
      initParams: function() {
        return [
          {
            srcNode: this.step_1_node, //输入图层
            name: '步骤一',
            params: {
              inputLayer: {
                value: null,
                rule: [
                  {
                    msg: '不能为空',
                    valid: function(value) {
                      return value != null && value != '';
                    }
                  }
                ]
              }
            }
          },
          {
            srcNode: this.step_2_node, //输入图层
            name: '步骤二',
            params: {
              huizongLayer: {
                value: null,
                rule: [
                  {
                    msg: '不能为空',
                    valid: function(value) {
                      return value != null && value != '';
                    }
                  }
                ]
              }
            }
          },
          {
            srcNode: this.step_3_node, //输入统计数
            name: '步骤三',
            params: {
              sumShape: {},
              shapeUnits: {
                value: 'SquareKilometers',
                rule: [
                  {
                    msg: '',
                    valid: function(value) {
                      return true;
                    }
                  }
                ]
              },
              summaryFields: {}
            }
          },
          {
            srcNode: this.step_4_node, //可选
            name: '步骤四',
            params: {
              groupByField: {},
              minorityMajority: {},
              percentShape: {}
            }
          },
          {
            srcNode: this.step_5_node,
            name: '步骤五',
            params: {
              use_current_extent: {}, //当前范围
              result_layer_name: {
                //输出名称
                rule: [
                  {
                    msg: '不能为空',
                    valid: function(value) {
                      return value != null && value != '';
                    }
                  }
                ]
              },
              folderId: {
                //输出位置
                rule: [
                  {
                    msg: '不能为空',
                    valid: function(value) {
                      return value != null && value != '';
                    }
                  }
                ]
              }
            }
          }
        ];
      },

      //获取当前图层,初始化选择框
      getAvailableLayer() {
        //获取服务
        // var services = arrayUtil.filter(
        //   this.mapView.map.layers.items,
        //   function(v) {
        //     return v.url && v.listMode !== 'listMode';
        //   },
        //   this
        // );
        // console.log('services', services);

        //清空选择图层option
        domConstruct.empty(this.layerChooseNode);
        domConstruct.create(
          'option',
          {
            selected: true,
            disabled: true,
            hidden: true,
            innerHTML: '请选择'
          },
          this.layerChooseNode
        );

        //清空选择范围图层option
        domConstruct.empty(this.huizongNode);
        domConstruct.create(
          'option',
          {
            selected: true,
            disabled: true,
            hidden: true,
            innerHTML: '请选择'
          },
          this.huizongNode
        );

        //获取图层信息
        var filterServices = [];
        this.availableLayers = [];

        arcgisUtil
          .getCurrentDisplayLayerWithInfo({
            mapView: this.mapView,
            user: this.user
          })
          .then(
            lang.hitch(this, function(res) {
              this.availableLayers = res;
              ArrayUtil.forEach(
                res,
                function(v, k) {
                  domConstruct.create(
                    'option',
                    {
                      value: v.id,
                      innerHTML: v.name
                    },
                    this.layerChooseNode
                  );

                  domConstruct.create(
                    'option',
                    {
                      value: v.id,
                      innerHTML: v.name
                    },
                    this.huizongNode
                  );
                },
                this
              );
            })
          );
        // var promises = ArrayUtil.map(services, function (v, k) {
        //     var url;
        //     if (v.allSublayers && v.allSublayers.items.length === 1) { //如果只有一层
        //         url = v.url + '/0';
        //     } else {
        //         url = v.url
        //     }
        //     return arcgisUtil.getLayerInfo(url, this.user.token);
        // }, this);

        // all(promises).then(lang.hitch(this, function (resArr) {
        //     this.data.currentServicesInfo = [];
        //     if (resArr.length === 0) {
        //         this.onNoServiceAvailable();
        //     }

        // }));
      },
      //输出位置初始化
      initFolders() {
        // 清空结果存储位置
        domConstruct.empty(this.resultFolderNode);
        domConstruct.create(
          'option',
          {
            selected: true,
            disabled: true,
            hidden: true,
            innerHTML: '请选择'
          },
          this.resultFolderNode
        );

        domConstruct.create(
          'option',
          {
            value: this.user.username,
            innerHTML: this.user.username
          },
          this.resultFolderNode
        );

        ArrayUtil.forEach(
          this.user.info.folders,
          function(v) {
            //创建文件夹信息
            domConstruct.create(
              'option',
              {
                value: v.id,
                innerHTML: v.title
              },
              this.resultFolderNode
            );
          },
          this
        );
      },
      //是否用当前范围
      useCurrentExtentChange: function(evt) {
        this.setParam('use_current_extent', evt.target.checked);
      },

      resultNameChange: function(evt) {
        this.setParam('result_layer_name', evt.target.value);
      }, //输出名称变化
      resultFolderChange: function(evt) {
        this.setParam('folderId', evt.target.value);
      }, //输出文件夹变化
      fenZuFieldChange: function(evt) {
        this.setParam('groupByField', evt.target.value);

        if (evt.target.value != '0') {
          this.TianJia1.disabled = false;
          this.TianJia2.disabled = false;
          this.setParam('groupByField', '');
          this.setParam('minorityMajority', false);
          this.setParam('percentShape', false);
        } else {
          this.TianJia1.disabled = 'disabled';
          this.TianJia2.disabled = 'disabled';
          this.setParam('groupByField', evt.target.value);
          this.setParam('minorityMajority', this.TianJia1.checked);
          this.setParam('percentShape', this.TianJia2.checked);
        }
      }, //分组字段变化

      inputLayerChange(evt) {
        // //设置输入图层
        var layerId = evt.target.value.split('?')[0];
        var Xurl = this.mapView.map.findLayerById(layerId);
        var valueX;
        var filter = arrayUtil.filter(
          this.availableLayers,
          function(v) {
            return v.id === layerId;
          },
          this
        );

        if (filter[0].layerId != null) {
          valueX = Xurl.url + '/' + filter[0].layerId;
        } else {
          valueX = Xurl.url;
        }

        this.setParam('inputLayer', valueX);

        // //被统计图层option添加，但不能与统计相同
        // domConstruct.empty(this.huizongNode);
        // domConstruct.create(
        //   'option',
        //   {
        //     value: '0',
        //     innerHTML: '请选择'
        //   },
        //   this.huizongNode
        // );
        // var temServices;
        // for (var j = 0; j < this.data.currentServicesInfo.length; j++) {
        //   var services = this.data.currentServicesInfo[j].layer;
        //   var v = this.data.currentServicesInfo[j].info;

        //   for (var i = 0; i < v.layers.length; i++) {
        //     if (evt.target.value != services.id + '?' + v.layers[i].id) {

        //     }
        //   }
        // }
      }, //输入图层变化
      huizongLayerChange(evt) {
        if (evt.target.value != '0') {
          //如果不是“请选择”
          var layerId = evt.target.value.split('?')[0];
          var Xurl = this.mapView.map.findLayerById(layerId);

          var filter = arrayUtil.filter(
            this.availableLayers,
            function(v) {
              return v.id === layerId;
            },
            this
          );

          if (filter.length === 0) {
            console.warn('错误');
            return;
          }

          var valueX;
          if (filter[0].layerId != null) {
            valueX = Xurl.url + '/' + filter[0].layerId;
          } else {
            valueX = Xurl.url;
          }

          var info = filter[0].info;

          this.setParam('huizongLayer', valueX);

          //判断统计对象点线面
          if (arcgisUtil.isPointLayer(info.geometryType)) {
            this.TxtJishu.innerHTML = '点计数';
            this.DanWei.style.display = 'none';
            this.setParam('shapeUnits', '');
          } else if (arcgisUtil.isPolylineLayer(info.geometryType)) {
            this.TxtJishu.innerHTML = '范围内总长度';
            domConstruct.empty(this.DanWei);
            ArrayUtil.forEach(
              arcgisUtil.LineUnits,
              function(v) {
                domConstruct.create(
                  'option',
                  {
                    innerHTML: v.name,
                    value: v.value
                  },
                  this.DanWei
                );
              },
              this
            );
            this.DanWei.style.display = 'inline-block';
            this.setParam('shapeUnits', 'Miles');
          } else {
            this.TxtJishu.innerHTML = '范围内总面积';
            domConstruct.empty(this.DanWei);
            ArrayUtil.forEach(
              arcgisUtil.polygonUnits,
              function(v) {
                domConstruct.create(
                  'option',
                  {
                    innerHTML: v.name,
                    value: v.value
                  },
                  this.DanWei
                );
              },
              this
            );
            this.DanWei.style.display = 'inline-block';
            this.setParam('shapeUnits', 'SquareMiles');
          }

          //加载字段
          //   var temServices;
          //   for (var j = 0; j < this.data.currentServicesInfo.length; j++) {
          //     var services = this.data.currentServicesInfo[j].layer;
          //     var v = this.data.currentServicesInfo[j].info;

          //     for (var i = 0; i < v.layers.length; i++) {
          //       if (evt.target.value != services.id + '?' + v.layers[i].id) {
          //       } else {
          //         temServices = services;
          //       }
          //     }
          //   }

          this.data.avaliableFields = [];
          var avaliableFieldsAll = [];

          var fields = info.fields;

          ArrayUtil.forEach(
            fields,
            function(v) {
              //只加载数字类型

              avaliableFieldsAll.push(v);
            },
            this
          );

          ArrayUtil.forEach(
            fields,
            function(v) {
              //只加载数字类型
              if (arcgisUtil.isNumberFieldType(v.type)) {
                this.data.avaliableFields.push(v);
              }
            },
            this
          );

          //图层变化都要变化
          var selects = this.summaryFields_Node.getElementsByTagName('select');
          for (var i = 0; i < selects.length; i++) {
            if (
              selects[i].id.substr(0, 6) == 'ZiDuan' &&
              parseInt(selects[i].id.substr(6)) > evt.target.id.substr(10)
            ) {
              //所有字段
              domConstruct.empty(selects[i]);

              domConstruct.create(
                'option',
                {
                  value: '0',
                  innerHTML: '字段'
                },
                selects[i]
              );

              ArrayUtil.forEach(
                this.data.avaliableFields,
                function(v) {
                  domConstruct.create(
                    'option',
                    {
                      innerHTML: v.alias,
                      value: v.name
                    },
                    selects[i]
                  );
                },
                this
              );
            } else if (
              selects[i].id.substr(0, 11) == 'TongJiXinXi' &&
              parseInt(selects[i].id.substr(11)) > evt.target.id.substr(10)
            ) {
              //加载统计类型
              domConstruct.empty(selects[i]);

              domConstruct.create(
                'option',
                {
                  value: '0',
                  innerHTML: '统计信息'
                },
                selects[i]
              );

              ArrayUtil.forEach(
                arcgisUtil.TongJiFangShiUnits,
                function(v) {
                  domConstruct.create(
                    'option',
                    {
                      innerHTML: v.name,
                      value: v.value
                    },
                    selects[i]
                  );
                },
                this
              );
            }
          }

          //加载步骤四所有字段
          domConstruct.empty(this.fenZuFieldNode);

          domConstruct.create(
            'option',
            {
              value: '0',
              innerHTML: '字段'
            },
            this.fenZuFieldNode
          );

          ArrayUtil.forEach(
            avaliableFieldsAll,
            function(v) {
              if (v.alias != 'OBJECTID') {
                domConstruct.create(
                  'option',
                  {
                    innerHTML: v.alias,
                    value: v.name
                  },
                  this.fenZuFieldNode
                );
              }
            },
            this
          );
        } else {
          //如果没图层，就清空
          var selects = this.summaryFields_Node.getElementsByTagName('select');
          for (var i = 0; i < selects.length; i++) {
            if (
              selects[i].id.substr(0, 6) == 'ZiDuan' &&
              parseInt(selects[i].id.substr(6)) > evt.target.id.substr(10)
            ) {
              //所有字段
              domConstruct.empty(selects[i]);

              domConstruct.create(
                'option',
                {
                  value: '0',
                  innerHTML: '字段'
                },
                selects[i]
              );
            } else if (
              selects[i].id.substr(0, 11) == 'TongJiXinXi' &&
              parseInt(selects[i].id.substr(11)) > evt.target.id.substr(10)
            ) {
              //加载统计类型
              domConstruct.empty(selects[i]);

              domConstruct.create(
                'option',
                {
                  value: '0',
                  innerHTML: '统计信息'
                },
                selects[i]
              );
            }
          }
        }
      }, //汇总图层变化
      jishuCheckChange(evt) {
        this.setParam('sumShape', evt.target.checked);
      }, //计数选框变化
      duoshuCheckChange(evt) {
        this.setParam('minorityMajority', evt.target.checked);
      }, //多数选框变化
      baifenbiCheckChange(evt) {
        this.setParam('percentShape', evt.target.checked);
      }, //百分比变化
      DanWeiChange(evt) {
        this.setParam('shapeUnits', evt.target.value);
      }, //单位变化
      ZiDuanChange(evt) {
        var str = 'TongJiXinXi' + evt.target.id.substr(6);
        var index = document.getElementById(str).selectedIndex; // 选中索引
        var value = document.getElementById(str).options[index].value; // 选中值
        if (value != '0') {
          //两者皆被选
          //判断有没有下一个
          var nextNum = parseInt(evt.target.id.substr(6)) + 1;
          var nowNum =
            this.summaryFields_Node.getElementsByTagName('select').length / 2;
          //有下一个就不操作 没有下一个就新建下一个
          if (nextNum > nowNum) {
            this.jishuCheck_Node.disabled = false;
            //加一个关闭按钮
            var liClose = domConstruct.create(
              'p',
              {
                class: 'closestyle',
                id: 'closestyle' + (nextNum - 1),
                innerHTML: '删除'
              },
              this.summaryFields_Node
            );
            //加一个字段框
            var liZiDuan = domConstruct.create(
              'select',
              {
                class: 'aliSelect',
                id: 'ZiDuan' + nextNum
              },
              this.summaryFields_Node
            );

            domConstruct.create(
              'option',
              {
                value: '0',
                innerHTML: '字段'
              },
              liZiDuan
            );
            ArrayUtil.forEach(
              this.data.avaliableFields,
              function(v, k) {
                domConstruct.create(
                  'option',
                  {
                    value: v.name,
                    innerHTML: v.alias
                  },
                  liZiDuan
                );
              },
              this
            );
            //加一个统计信息框
            var liTongJiXinXi = domConstruct.create(
              'select',
              {
                class: 'aliSelect',
                id: 'TongJiXinXi' + nextNum
              },
              this.summaryFields_Node
            );

            domConstruct.create(
              'option',
              {
                value: '0',
                innerHTML: '统计信息'
              },
              liTongJiXinXi
            );
            ArrayUtil.forEach(
              arcgisUtil.TongJiFangShiUnits,
              function(v, k) {
                domConstruct.create(
                  'option',
                  {
                    value: v.value,
                    innerHTML: v.name
                  },
                  liTongJiXinXi
                );
              },
              this
            );

            //添加点击事件
            dojo.connect(
              liZiDuan,
              'onchange',
              lang.hitch(this, function(evt) {
                this.ZiDuanChange(evt);
              })
            );
            //添加字段变化事件
            dojo.connect(
              liTongJiXinXi,
              'onchange',
              lang.hitch(this, function(evt) {
                this.TongJiXinXiChange(evt);
              })
            );
            //添加点击事件
            dojo.connect(
              liClose,
              'onclick',
              lang.hitch(this, function(evt) {
                var id1 = 'ZiDuan' + evt.target.id.substr(10);
                var id2 = 'TongJiXinXi' + evt.target.id.substr(10);
                var id3 = evt.target.id;

                document
                  .getElementById(id1)
                  .parentNode.removeChild(document.getElementById(id1));
                document
                  .getElementById(id2)
                  .parentNode.removeChild(document.getElementById(id2));
                document
                  .getElementById(id3)
                  .parentNode.removeChild(document.getElementById(id3));

                var selects = this.summaryFields_Node.getElementsByTagName(
                  'select'
                );
                var ps = this.summaryFields_Node.getElementsByTagName('p');

                for (var i = 0; i < selects.length; i++) {
                  if (
                    selects[i].id.substr(0, 6) == 'ZiDuan' &&
                    parseInt(selects[i].id.substr(6)) > evt.target.id.substr(10)
                  ) {
                    selects[i].id =
                      'ZiDuan' + (parseInt(selects[i].id.substr(6)) - 1);
                  } else if (
                    selects[i].id.substr(0, 11) == 'TongJiXinXi' &&
                    parseInt(selects[i].id.substr(11)) >
                      evt.target.id.substr(10)
                  ) {
                    selects[i].id =
                      'TongJiXinXi' + (parseInt(selects[i].id.substr(11)) - 1);
                  }
                }

                for (var i = 0; i < ps.length; i++) {
                  if (
                    ps[i].id.substr(0, 10) == 'closestyle' &&
                    parseInt(ps[i].id.substr(10)) > evt.target.id.substr(10)
                  ) {
                    ps[i].id =
                      'closestyle' + (parseInt(ps[i].id.substr(10)) - 1);
                  }
                }
              })
            );
          }
        }
      }, //字段变化
      TongJiXinXiChange(evt) {
        var str = 'ZiDuan' + evt.target.id.substr(11);

        var index = document.getElementById(str).selectedIndex; // 选中索引
        var value = document.getElementById(str).options[index].value; // 选中值
        if (value != '0') {
          //两者皆被选
          //判断有没有下一个
          var nextNum = parseInt(evt.target.id.substr(11)) + 1;
          var nowNum =
            this.summaryFields_Node.getElementsByTagName('select').length / 2;
          //有下一个就不操作 没有下一个就新建下一个
          if (nextNum > nowNum) {
            this.jishuCheck_Node.disabled = false;
            //加一个关闭按钮
            var liClose = domConstruct.create(
              'p',
              {
                class: 'closestyle',
                id: 'closestyle' + (nextNum - 1),
                innerHTML: '删除'
              },
              this.summaryFields_Node
            );
            //加一个字段框
            var liZiDuan = domConstruct.create(
              'select',
              {
                class: 'aliSelect',
                id: 'ZiDuan' + nextNum
              },
              this.summaryFields_Node
            );

            domConstruct.create(
              'option',
              {
                value: '0',
                innerHTML: '字段'
              },
              liZiDuan
            );
            ArrayUtil.forEach(
              this.data.avaliableFields,
              function(v, k) {
                domConstruct.create(
                  'option',
                  {
                    value: v.name,
                    innerHTML: v.alias
                  },
                  liZiDuan
                );
              },
              this
            );
            //加一个统计信息框
            var liTongJiXinXi = domConstruct.create(
              'select',
              {
                class: 'aliSelect',
                id: 'TongJiXinXi' + nextNum
              },
              this.summaryFields_Node
            );

            domConstruct.create(
              'option',
              {
                value: '0',
                innerHTML: '统计信息'
              },
              liTongJiXinXi
            );
            ArrayUtil.forEach(
              arcgisUtil.TongJiFangShiUnits,
              function(v, k) {
                domConstruct.create(
                  'option',
                  {
                    value: v.value,
                    innerHTML: v.name
                  },
                  liTongJiXinXi
                );
              },
              this
            );
            //添加点击事件
            dojo.connect(
              liClose,
              'onclick',
              lang.hitch(this, function(evt) {
                var id1 = 'ZiDuan' + evt.target.id.substr(10);
                var id2 = 'TongJiXinXi' + evt.target.id.substr(10);
                var id3 = evt.target.id;

                document
                  .getElementById(id1)
                  .parentNode.removeChild(document.getElementById(id1));
                document
                  .getElementById(id2)
                  .parentNode.removeChild(document.getElementById(id2));
                document
                  .getElementById(id3)
                  .parentNode.removeChild(document.getElementById(id3));

                var selects = this.summaryFields_Node.getElementsByTagName(
                  'select'
                );
                var ps = this.summaryFields_Node.getElementsByTagName('p');

                for (var i = 0; i < selects.length; i++) {
                  if (
                    selects[i].id.substr(0, 6) == 'ZiDuan' &&
                    parseInt(selects[i].id.substr(6)) > evt.target.id.substr(10)
                  ) {
                    selects[i].id =
                      'ZiDuan' + (parseInt(selects[i].id.substr(6)) - 1);
                  } else if (
                    selects[i].id.substr(0, 11) == 'TongJiXinXi' &&
                    parseInt(selects[i].id.substr(11)) >
                      evt.target.id.substr(10)
                  ) {
                    selects[i].id =
                      'TongJiXinXi' + (parseInt(selects[i].id.substr(11)) - 1);
                  }
                }

                for (var i = 0; i < ps.length; i++) {
                  if (
                    ps[i].id.substr(0, 10) == 'closestyle' &&
                    parseInt(ps[i].id.substr(10)) > evt.target.id.substr(10)
                  ) {
                    ps[i].id =
                      'closestyle' + (parseInt(ps[i].id.substr(10)) - 1);
                  }
                }
              })
            );
            //添加字段变化事件
            dojo.connect(
              liZiDuan,
              'onchange',
              lang.hitch(this, function(evt) {
                this.ZiDuanChange(evt);
              })
            );
            //添加统计变化事件
            dojo.connect(
              liTongJiXinXi,
              'onchange',
              lang.hitch(this, function(evt) {
                this.TongJiXinXiChange(evt);
              })
            );
          }
        }
      }, //统计信息变化
      //开始计算
      runTask() {
        var state = this.checkParam(); //检查客户填写信息,返回一个valid状态

        //获取字段统计
        var selects = this.summaryFields_Node.getElementsByTagName('select');
        var fieldAll = [];
        var strTem = '';
        for (var i = 0; i < selects.length; i++) {
          if (selects[i].id.substr(0, 6) == 'ZiDuan') {
            if (selects[i].value != '0') {
              selects[i].id =
                'ZiDuan' + (parseInt(selects[i].id.substr(6)) - 1);
              strTem = selects[i].value + ' ';
            }
          } else if (selects[i].id.substr(0, 11) == 'TongJiXinXi') {
            if (selects[i].value != '0') {
              selects[i].id =
                'TongJiXinXi' + (parseInt(selects[i].id.substr(11)) - 1);
              strTem = strTem + selects[i].value;
              fieldAll.push(strTem);
            }
          }
        }
        if (fieldAll.length > 0) {
          this.setParam('summaryFields', fieldAll);
        }

        if (state.valid) {
          //如果填写正确
          this.onAnalyzeStart();
          var tempParm = this.getTransParam(); //获取所有输入信息
          var context;

          if (tempParm.use_current_extent) {
            //如果是使用当前范围,暂存当前范围
            context = {
              extent: {
                type: 'extent'
              }
            };
            lang.mixin(context.extent, this.mapView.extent.toJSON());
          }

          var dfd = new summarizeWithinTask().run({
            //调用task
            portalInfo: this.portalInfo,
            analyzeService: this.analyzeService,
            user: this.user,
            portalUrl: this.portalUrl,
            param: {
              inputLayer: tempParm.inputLayer, //输入图层
              summaryLayer: tempParm.huizongLayer,
              sumShape: tempParm.sumShape,
              shapeUnits: tempParm.shapeUnits,
              summaryFields: tempParm.summaryFields,
              groupByField: tempParm.groupByField,
              minorityMajority: tempParm.minorityMajority,
              percentShape: tempParm.percentShape,
              context: context,
              exportService: {
                name: tempParm.result_layer_name //输出名称
              },
              folderId: tempParm.folderId
            }
          });

          dfd.then(
            lang.hitch(this, function(res) {
              console.log(res);
              if (res.success) {
                //将结果图层加载到地图
                var serviceUrl = res.serviceUrl;

                console.log('结果图层url:' + serviceUrl);
                var popupTemplate = {
                  title: '统计信息',
                  content: '{*}'
                };

                this.mapView.map.add(
                  new FeatureLayer({
                    url: serviceUrl + '/0',
                    popupTemplate: popupTemplate,
                    token: this.user.token
                  })
                );
              }
              this.onAnalyzeEnd(res);
            }),
            lang.hitch(this, function(err) {
              alert(err);
              this.onAnalyzeEnd();
            })
          );
        }
      }
    }
  );

  return widget;
});
