/**
 * @author caihm
 * @createDate 2018-9-3
 *
*/
define([
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/dom-class',
  'dojo/dom-style',
  'dojo/_base/declare',
  'dojo/_base/array',
  './task-item',
  './task-console'
], function (domConstruct, lang, domClass, domStyle, declare, ArrayUtil, TaskItem, TaskConsole) {

  /**
   * @class
   * @classdesc 空间分析的监控工具
   *
  */
  var instance = null;

  var Clazz = declare([], {
    data: {
      taskItemStore: []
    },
    ui: {},
    taskFinish(res) {
      var taskId = res.taskId;
      for (var index = 0; index < this.data.taskItemStore.length; index++) {
        var taskItem = this.data.taskItemStore[index];
        if (taskItem.taskId === taskId) {
          if (res.info && res.info.success) {
            taskItem.setFinished()
          } else {
            taskItem.setFailed(res.info)
          }

          break
        }
      }
      this.renderTaskConsole();
    },

    renderTaskConsole() {
      var running = 0;
      var finished = 0

      ArrayUtil.forEach(this.data.taskItemStore, function (v) {
        if (v.isFinished === true) {
          finished++
        } else {
          running++
        }
      }, this);

      this
        .ui
        .taskConsole
        .setState({running: running, finished: finished})

    },

    addTask(taskInfo) {
      this.showConsole();
      var taskItem = new TaskItem({
        taskInfo: taskInfo,
        parent: this,
        detailNode: this.detailNode
      }, domConstruct.create('div', {}, this.taskContainerNode));

      this
        .data
        .taskItemStore
        .push(taskItem);

      this.renderTaskConsole();

    },
    deleteTask(deleteItem) {
      for (var index = 0; index < this.data.taskItemStore.length; index++) {
        var taskItem = this.data.taskItemStore[index];
        if (taskItem.taskId === deleteItem.taskId) {
          this
            .data
            .taskItemStore
            .splice(index, 1);
          deleteItem.destroy();
          break
        }
      }
      this.renderTaskConsole();
    },
    mapView: null,
    showTaskItemList() {
      if (this.taskContainerNode) {
        domClass.remove(this.taskContainerNode, 'hide');
      }

    },
    hideTaskItemList() {
      if (this.taskContainerNode) {
        domClass.add(this.taskContainerNode, 'hide');
      }

    },
    showConsole() {
      this
        .ui
        .taskConsole
        .show();

    },

    setMapView(mapView) {

      this.mapView = mapView;
      this.domNode = domConstruct.create('div', {
        innerHTML: '',
        className: 'task-monitor'
      }, this.mapView.ui.container);

      this.stateNode = domConstruct.create('div', {
        innerHTML: '',
        className: 'task-console'
      }, this.domNode);

      this.ui.taskConsole = new TaskConsole({
        parent: this
      }, domConstruct.create('div', {}, this.stateNode));

      this.taskContainerNode = domConstruct.create('div', {
        innerHTML: '',

        className: 'task-container'
      }, this.domNode);

    },
    setDetailNode(node) {
      this.detailNode = node;

    },
    constructor(options) {}
  });

  Clazz.getInstance = function () {
    if (instance === null) {
      instance = new Clazz();
    }
    return instance
  }

  return Clazz;
})