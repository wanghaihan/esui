/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 时间区间对比日历控件
 * @author Haihan Wang(wanghaihan@baidu.com)
 */
define(
    function(require) {
        var lib = require('./lib');
        var ui = require('esui');
        var Control = require('./Control');

        // var paint = require('./painters');

        require('./RangeCalendar');
        require('./Calendar');

        /**
         * 搜索框控件，由一个文本框和一个搜索按钮组成
         *
         * @extends Control
         * @param {Object} [options] 初始化参数
         * @constructor
         */
        function RangeCFCalendar(options) {
            Control.apply(this, arguments);
        }

        RangeCFCalendar.prototype.type = 'RangeCFCalendar';

        /**
         * 初始化参数
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        RangeCFCalendar.prototype.initOptions = function(options) {
            var properties = {}; // todo: 扩展
            lib.extend(properties, options);
            Control.prototype.initOptions.call(this, properties);
        };

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        RangeCFCalendar.prototype.initStructure = function() {
            var me = this;
            // 如果主元素是输入元素，替换成`<div>`
            if (lib.isInput(me.main)) {
                me.helper.replaceMain();
            }

            var addChild = function(child, childName) {
                // 添加在Child列表中
                me.addChild(child,childName);
                // 渲染到main中
                var childContainer = document.createElement('div');
                me.helper.addPartClasses('inline-block', childContainer);
                me.main.appendChild(childContainer);
                if (typeof child.addChild === 'function') {
                    child.appendTo(childContainer);
                }
                else {
                    childContainer.appendChild(child);
                }
            };
            // 添加左侧日历
            var baseCalendar = ui.create('RangeCalendar', {});
            addChild(baseCalendar,'baseCalendar');
            // 添加选择框
            var isCompare = ui.create('CheckBox', {});
            addChild(isCompare,'isCompare');
            // 添加右侧日历
            var compareCalendar = ui.create('Calendar', {});
            addChild(compareCalendar,'compareCalendar');
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        RangeCFCalendar.prototype.initEvents = function() {
            for (var i = this.children.length - 1; i >= 0; --i) {
                this.children[i].on('change', this.childChangeHandler);
            }
        };

        /**
         * 获取输入值
         *
         * @return {string} 输入值
         * @override
         */
        RangeCFCalendar.prototype.getValue = function() {
            var allChildren = this.Children;
            alert(allChildren.length);
            return '';
        };

        /**
         * 子控件chang事件handler
         * @param  {Event} e 事件对象
         * @protected
         */
        RangeCFCalendar.prototype.childChangeHandler = function(e) {
            // var textbox = this.getChild('baseCalendar');

        };

        lib.inherits(RangeCFCalendar, Control);
        ui.register(RangeCFCalendar);
        return RangeCFCalendar;
    }
);
