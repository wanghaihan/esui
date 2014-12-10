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
         * 检查两个时间范围是否相当
         * @param  {Object}  newRange 结构类似于{begin:Date,end:Date}
         * @param  {Object}  oldRange 结构类似于{begin:Date,end:Date}
         * @return {boolean} true 代表以改变
         */
        function isRangeChanged(newRange, oldRange) {
            if (newRange === oldRange) {
                return false;
            }
            if (newRange == null || oldRange == null) {
                return true;
            }
            if (newRange.begin.getTime() === oldRange.begin.getTime()
                && newRange.end.getTime() === oldRange.end.getTime()) {
                return false;
            }
            return true;
        }

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
                base: {
                    begin: now,
                    end: now
                },
                compared: {
                    begin: yesterday,
                    end: yesterday
                },

                // 测试--------------
                range: {
                    begin: new Date(2008, 10, 1),
                    end: new Date()
                }
            };
            lib.extend(properties, options);
            Control.prototype.initOptions.call(this, properties);
        };

        /**
         * 外抛change事件锁,以防止控件的联动更改导致一次操作多次事件外抛
         * @type {boolean}
         */
        RangeCFCalendar.prototype._changeLocked = false;

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
                }
                else {
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
            // 故如果配置里要求初始化时需要disable,需要先render,再disable
            if (!this.isCompare) {
                compareCalendar.disable();
            }

            // 右侧天数描述
            var totalDays = ui.create('Label', {
                text: this.getDaysText()
            });
            addChild(totalDays, 'totalDays');

            // extendCalendarIntoFixedDays.call(me, compareCalendar);
        };

        /**
         * 初始化事件交互
         *
         * @protected
         * @override
         */
        RangeCFCalendar.prototype.initEvents = function() {
            var me = this;

            var baseCalendar = this.getChild('baseCalendar');
            var compareCheckBox = this.getChild('compareCheckBox');
            var compareCalendar = this.getChild('compareCalendar');
            baseCalendar.on(
                'change',
                function(e) {
                    me.setProperties({base: e.target.getRawValue()});
                }
            );
            compareCheckBox.on(
                'change',
                function(e) {
                    me.setProperties({isCompare: e.target.isChecked()});
                }
            );
            compareCalendar.on(
                'change',
                function(e) {
                    me.setProperties({compared: e.target.getRawValue()});
                }
            );
        };

        /**
         * 获取日期范围
         *
         * @return {Object}
         * 对比状态下结构为:
         * {
         *     base: {begin:Date,end:Date},
         *     compared: {begin:Date,end:Date},
         *     isCompare: true
         * }
         * 非对比状态下结构为:
         * {
         *     base: {begin:Date,end:Date},
         *     isCompare: false
         * }
         * @override
         */
        RangeCFCalendar.prototype.getRawValue = function() {
            var rawValue = {
                base: this.base,
                isCompare: false
            };
            // 即使在对比状态, 如果右侧日历为空,即显示为'请选择',也要对外表现为非对比状态
            if (this.isCompare && this.compared != null) {
                rawValue.isCompare = true;
                rawValue.compared = this.compared;
            }
            return rawValue;
        };

        /**
         * 获取日期话术
         * @return {[type]} [description] {Object}
         * {base:'2014-12-12 至 2014-12-13',compared:'2014-12-10 至 2014-12-11'}
         */
        RangeCFCalendar.prototype.getValue = function() {
            var reValue = {
                base: this.getChild('baseCalendar').helper.getPart('text').innerText
            };
            // 即使在对比状态, 如果右侧日历为空,即显示为'请选择',也要对外表现为非对比状态
            if (this.isCompare && this.compared != null) {
                reValue.compared = this.getChild('compareCalendar').helper.getPart('text').innerText;
            }
            return reValue;
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
         * 获取天数话术
         * @param {?number} days 数字天数.如果不传则自动计算
         * @return {string} 共n天
         */
        RangeCFCalendar.prototype.getDaysText = function(days) {
            if (days == null) {
                days = this.getDays();
            }
            return '共' + days.toString() + '天';
        };



        /**
         * 批量设置控件的属性值
         *
         * @param {Object} properties 属性值集合
         * @override
         * @return {Object} `properties`参数中确实变更了的那些属性
         */
        RangeCFCalendar.prototype.setProperties = function(properties) {
            var changes = Control.prototype.setProperties.call(
                this, properties);
            if (this.helper.isInStage('NEW')) {
                return changes;
            }

            var compareCalendar = this.getChild('compareCalendar');
            var isBaseChanged = changes.hasOwnProperty('base');
            var isIsCompareChanged = changes.hasOwnProperty('isCompare');
            // 确保只由原始触发的change向外抛出事件.以避免控件多联动导致的多次外抛.
            var isFireChange = false;
            if (!this._changeLocked) {
                this._changeLocked = true;
                isFireChange = true;
            }

            // 左侧base日历日期有变化
            if (isBaseChanged) {
                var days = this.getDays();
                this.getChild('totalDays').setText(this.getDaysText(days));
                if (this.isCompare) {
                    // 为了保证非比较状态下, 用户的历史对比日期是安全的,只在比较状态下给右侧对比控件设置天数
                    compareCalendar.setDays(days);
                }
            }

            // 对比勾选框有变化
            if (isIsCompareChanged) {
                if (this.isCompare) {
                    compareCalendar.enable();
                    // 开启时要重设一下天数
                    compareCalendar.setDays(days);
                }
                else {
                    compareCalendar.disable();
                }
            }

            // 处理外内部改动后,外抛change事件
            if (isFireChange) {
                this._changeLocked = false;
                // 如果是勾选了对比,但是右侧为请选择,则相当于没有勾选对比.故没必要抛出change事件
                if (!(isIsCompareChanged && compareCalendar.getRawValue() === null)) {
                    this.fire('change', {rawValue: this.getRawValue()});
                }
            }
            return changes;
        };

        /**
         * 判断属性新值是否有变化，内部用于`setProperties`方法
         *
         * @param {string} propertyName 属性名称
         * @param {Mixed} newValue 新值
         * @param {Mixed} oldValue 旧值
         * @return {boolean}
         * @override
         * @protected
         */
        RangeCFCalendar.prototype.isPropertyChanged =
            function(propertyName, newValue, oldValue) {
                if (propertyName === 'base' || propertyName === 'compared') {
                    // 比较两个时间范围
                    return isRangeChanged(newValue, oldValue);
                }
                // 默认实现将值和当前新值进行简单比对
                return oldValue !== newValue;
            };

        lib.inherits(RangeCFCalendar, Control);
        ui.register(RangeCFCalendar);
        return RangeCFCalendar;
    }
);
