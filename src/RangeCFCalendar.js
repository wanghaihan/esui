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
        var moment = require('moment');

        // var paint = require('./painters');

        require('./RangeCalendar');
        require('./Calendar');
        require('./extension/FixedRangeCalendar');

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
            var now = new Date();
            var yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            var properties = {
                // 是否处于比较状态
                isCompare: true,
                // 日期天数
                days: 1,
                base: {
                    begin: now,
                    end: now
                },
                compared: {
                    begin: yesterday,
                    end: yesterday
                }

                // 测试
                ,range: {
                begin: new Date(2008, 10, 1),
                end: new Date()
                }
            };
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
                me.addChild(child, childName);
                // 渲染到main中
                var childContainer = document.createElement('div');
                me.helper.addPartClasses('inline-block', childContainer);
                me.main.appendChild(childContainer);
                if (typeof child.addChild === 'function') {
                    child.appendTo(childContainer);
                } else {
                    childContainer.appendChild(child);
                }
            };
            // 添加左侧日历
            var baseCalendar = ui.create('RangeCalendar', {
                rawValue: {
                    begin: this.base.begin,
                    end: this.base.end
                },
                range: this.range
            });
            addChild(baseCalendar, 'baseCalendar');

            // 添加比较选择框
            var compareCheckBox = ui.create('CheckBox', {
                title: '比较',
                checked: this.isCompare
            });
            addChild(compareCheckBox, 'compareCheckBox');

            // 添加右侧日历
            var compareCalendar = ui.create('Calendar', {
                extensions: [
                    ui.createExtension('FixedRangeCalendar', {
                        days: this.getDays()
                    })
                ],
                rawValue: this.compared.begin,
                orgRange: this.range
            });
            addChild(compareCalendar, 'compareCalendar');
            // 为了防止disable后,日历控件就不会显示文字
            // 故初始化时如果需要disable,需要先render
            if (!this.isCompare) {
                compareCalendar.disable();
            }

            // 右侧天数描述
            var totalDays = ui.create('Label', {});
            addChild(totalDays, 'totalDays');
            this.refreshDays();

            // extendCalendarIntoFixedDays.call(me, compareCalendar);
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        RangeCFCalendar.prototype.initEvents = function() {
            // for (var i = this.children.length - 1; i >= 0; --i) {
            //     this.children[i].on('change', this.childChangeHandler);
            // }
            var me = this;

            var baseCalendar = this.getChild('baseCalendar');
            var compareCheckBox = this.getChild('compareCheckBox');
            var compareCalendar = this.getChild('compareCalendar');
            baseCalendar.on(
                'change',
                function(e) {
                    me.base = e.target.getRawValue();
                    me.refreshDays();
                }
            );
            compareCheckBox.on(
                'change',
                function(e) {
                    if (e.target.isChecked()) {
                        compareCalendar.enable();
                    } else {
                        compareCalendar.disable();
                    }
                }
            );
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
         * 判断当前是否处于对比日期状态
         *
         * @return {boolean} true代表处于对比状态
         */
        RangeCFCalendar.prototype.getIsCompare = function() {
            return this.isCompare;
        };

        /**
         * 获取天数
         *
         * @return {number} 天数
         */
        RangeCFCalendar.prototype.getDays = function() {
            // 计算日期差值一定要确保是凌晨,以计算自然日
            var begin = this.base.begin;
            begin = new Date(
                begin.getFullYear(),
                begin.getMonth(),
                begin.getDate());

            var end = this.base.end;
            end = new Date(
                end.getFullYear(),
                end.getMonth(),
                end.getDate());

            return moment(end).diff(moment(begin), 'days') + 1;
        };


        /**
         * 更新天数
         *
         */
        RangeCFCalendar.prototype.refreshDays = function() {
            var days = this.getDays();
            this.getChild('totalDays').setText('共' + days.toString() + '天');
            this.getChild('compareCalendar').setDays(days);
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