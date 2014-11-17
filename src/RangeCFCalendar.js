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
            // 如果主元素是输入元素，替换成`<div>`
            if (lib.isInput(this.main)) {
                this.helper.replaceMain();
            }

            // 添加左侧日历
            var rangeCalendar = ui.create('RangeCalendar', {});
            rangeCalendar.appendTo(this.main);
            this.addChild(rangeCalendar);

            // 添加右侧日历
            var richCAlendar = ui.create('Calendar', {});
            richCAlendar.appendTo(this.main);
            this.addChild(richCAlendar);
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        RangeCFCalendar.prototype.initEvents = function() {};

        /**
         * 获取输入值
         *
         * @return {string}
         * @override
         */
        RangeCFCalendar.prototype.getValue = function() {
            var allChildren = this.Children;
            alert(allChildren.length);
        };



        lib.inherits(RangeCFCalendar, Control);
        ui.register(RangeCFCalendar);
        return RangeCFCalendar;
    }
);