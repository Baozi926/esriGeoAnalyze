/**
 * @author caihm
 * @createDate 2018-9-3
 *
*/
define([
  'dojo/_base/lang',
  'dojo/dom-class',
  'dojo/dom-style',
  'dojo/_base/declare',
  'dojo/_base/array',
  '../task-monitor/task-monitor',
  'dojo/dom-construct',
  'dojo/dom-style'
], function (lang, domClass, domStyle, declare, arrayUtil, TaskMonitor, domConstruct, domStyle) {

  /**
   * @class
   * @classdesc 空间分析基类，提供参数管理和验证的能力
   *
  */
  var widget = declare('caihm.geoAna.baseTool', [], {
    constructor(options) {
      this.toolName = options.toolName;
      this.parent = options.parent
    },
    onNoServiceAvailable() {
      setTimeout(lang.hitch(this, function () {

        if (this.layerChooseNode) {
          domConstruct.empty(this.layerChooseNode);
          domConstruct.create('option', {
            selected: true,
            disabled: true,
            hidden: true,
            innerHTML: '无可用服务'
          }, this.layerChooseNode);

          domStyle.set(this.layerChooseNode, 'border', '1px solid #ec0000');
        }

        if (this.inputLayersNode) {
          //输入图层不是select选择框的情况下
          domConstruct.empty(this.inputLayersNode);
          this.inputLayersNode.innerHTML = '无可用服务';
          domStyle.set(this.inputLayersNode, 'border', '1px solid #ec0000');
        }

      }), 10);

    },
    onAnalyzeStart() {
      this.taskId = new Date()
        .getTime()
        .toString(16) + Math.round(Math.random() * 10000);
      this.runButtonNode.innerHTML = '<i class="fa fa-refresh fa-spin fa-fw"></i> 计算中...'
      this.runButtonNode.disabled = true;
      var html = lang.clone(this.domNode);
      TaskMonitor
        .getInstance()
        .addTask({html: html, toolName: this.toolName, taskId: this.taskId});

      this
        .parent
        .switchPane('list');
    },
    onAnalyzeEnd(res) {
      TaskMonitor
        .getInstance()
        .taskFinish({info: res, taskId: this.taskId});
      this.taskId = null;
      //如果dom已被销毁则不执行
      if (this.runButtonNode) {
        this.runButtonNode.innerHTML = '运行分析'
        this.runButtonNode.disabled = false
      }

    },
    postCreate() {

      if (this.initParams && lang.isFunction(this.initParams)) {
        this._params = this.initParams();
      } else {
        throw new Error("需要实现initParams方法，参考Demo")
      }
    },
    _params: [],

    /**
     * @description 生成一个参数的Object
     *
    */
    getTransParam() {
      var result = {};
      for (var i = 0; i < this._params.length; i++) {
        var step = this._params[i];
        for (var key in step.params) {
          result[key] = step.params[key].value
        }
      }
      console.log(result);
      return result
    },

    /**
     * 通过参数名，设置参数
     *
    */
    setParam(name, value) {
      if (!name) {
        throw new Error('name can not be none')
      }

      var flag = false;
      for (var i = 0; i < this._params.length; i++) {
        var step = this._params[i];
        for (var key in step.params) {
          if (key === name) {
            step.params[name].value = value
            console.log(name, value);
            flag = true;
            break;
          }
        }
      }
      if (flag) {} else {
        throw new Error('未找到相应参数' + name);
      }

    },
    /**
     * @description 根据参数名称获取参数
     *
     */
    getParam(name) {

      if (!name) {
        throw new Error('name  can not be none')
      }

      for (var i = 0; i < this._params.length; i++) {
        var step = this._params[i];
        for (var key in step.params) {
          if (key === name) {
            return step.params[name].value

          }
        }
      }
      throw new Error('未找到相应参数:' + name);

    },
    /**
     * @description 检查参数是否有效
     *
     */
    checkParam() {
      var allValid = true;
      arrayUtil.forEach(this._params, function (div) {
        domClass.remove(div.srcNode, 'error');
      }, this)

      var errorMsgs = [];
      for (var i = 0; i < this._params.length; i++) {
        var step = this._params[i];

        for (var key in step.params) {
          var param = step.params[key]
          if (param.rule && lang.isArray(param.rule) && param.rule.length > 0) {

            var rulevalidArr = arrayUtil.map(param.rule, function (ruleInst) {
              var isvalid = ruleInst
                .valid
                .bind(this)(param.value, this._params);
              if (!isvalid) {
                errorMsgs.push({msg: ruleInst.msg, step: i});
              }

              return isvalid
            }, this);
            var notValid = arrayUtil.some(rulevalidArr, function (valid) {
              return valid === false;
            })

            if (notValid) {
              console.log(key, param)
              domClass.add(step.srcNode, 'error')
              allValid = false;
            }
          }
        }
      }

      var result = {
        msg: errorMsgs,
        valid: allValid
      }

      arrayUtil.forEach(errorMsgs, function (v) {
        console.log(v.msg);
      })

      console.log(allValid
        ? '有效'
        : '无效', this._params)
      return {valid: allValid}
    },

    //输出位置初始化
    initFolders() {
      // 清空结果存储位置
      domConstruct.empty(this.resultFolderNode);
      domConstruct.create('option', {
        selected: true,
        disabled: true,
        hidden: true,
        innerHTML: '请选择'
      }, this.resultFolderNode);

      domConstruct.create('option', {
        value: this.user.username,
        innerHTML: this.user.username
      }, this.resultFolderNode)

      ArrayUtil.forEach(this.user.info.folders, function (v) { //创建文件夹信息
        domConstruct.create('option', {
          value: v.id,
          innerHTML: v.title
        }, this.resultFolderNode)
      }, this);

    }
  });

  return widget;
})