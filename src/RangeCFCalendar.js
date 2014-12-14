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

        require('./RangeCalendar');
        require('./Calendar');
        var FixedRangeCalendar = require('./FixedRangeCalendar');

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

        /**
         * 不考虑时间计算天数差的绝对值
         * @param  {Date} begin 开始
         * @param  {Date} end   结束
         * @return {number}     天数
         */
        RangeCFCalendar.absDiffOfDays = function(begin, end) {
            // 计算日期差值一定要确保是凌晨,以计算自然日
            var from = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate());
            var to = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            return Math.abs(moment(from).diff(moment(to), 'days'));
        };

        /**
         * 添加子控件
         * @param {RangeCFCalendar} me 当前实例
         * @param {Object} child       自控件实例
         * @param {string} childName   控件名
         */
        RangeCFCalendar.addChildAndRender = function(me, child, childName) {
            // 添加在Child列表中
            me.addChild(child, childName);
            // 渲染到main中
            var childContainer = document.createElement('div');
            me.main.appendChild(childContainer);
            me.helper.addPartClasses('inline-block', childContainer);
            child.appendTo(childContainer);
        };

        RangeCFCalendar.prototype = {
            /**
             * 控件类型，始终为`"RangeCFCalendar"`
             *
             * @type {string}
             * @readonly
             * @override
             */
            type: 'RangeCFCalendar',

            /**
             * 外抛change事件锁,以防止多控件间的联动导致一次操作多次事件外抛
             * @protected
             * @type {boolean}
             */
            changeLocked: false,

            /**
             * 初始化参数
             *
             * @param {Object} options 构造函数传入的参数
             * @protected
             * @override
             */
            initOptions: function(options) {
                var now = new Date();
                var yesterday = moment(now).subtract('day', 1).toDate();
                var properties = {
                    // 是否处于比较状态
                    isCompare: true,
                    base: {
                        begin: now,
                        end: now
                    },
                    compared: {
                        begin: yesterday
                        // end会根据前三个值自动算出,不可设置
                    },

                    // 测试--------------
                    range: {
                        begin: new Date(2008, 10, 1),
                        end: now
                    }
                };
                lib.extend(properties, options);
                // 计算compared.end
                properties.compared.end = moment(properties.compared.begin).add('day',
                        RangeCFCalendar.absDiffOfDays(properties.base.begin, properties.base.end)
                    ).toDate();
                Control.prototype.initOptions.call(this, properties);
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             * @override
             */
            initStructure: function() {
                // 如果主元素是输入元素，替换成`<div>`
                if (lib.isInput(this.main)) {
                    this.helper.replaceMain();
                }

                // 添加左侧日历
                RangeCFCalendar.addChildAndRender(this,
                    ui.create('RangeCalendar', {
                        rawValue: {
                            begin: this.base.begin,
                            end: this.base.end
                        },
                        range: this.range
                    }),
                    'baseCalendar');

                // 添加比较选择框
                RangeCFCalendar.addChildAndRender(this,
                    ui.create('CheckBox', {
                        title: '比较',
                        checked: this.isCompare
                    }),
                    'compareCheckBox');

                // 添加右侧日历
                RangeCFCalendar.addChildAndRender(this,
                    ui.create('FixedRangeCalendar', {
                        rawValue: {
                            begin: this.compared.begin
                            // 对比日历的end是根据days结合自身逻辑自动算出,外部不可指定
                        },
                        range: this.range,
                        days: this.getDays(),
                        disabled: !this.isCompare
                    }),
                    'compareCalendar');

                // 右侧天数描述
                RangeCFCalendar.addChildAndRender(this,
                    ui.create('Label', {
                        text: this.getDaysText()
                    }),
                    'totalDays');
            },

            /**
             * 初始化事件交互
             *
             * @protected
             * @override
             */
            initEvents: function() {
                var me = this;

                var baseCalendar = this.getChild('baseCalendar');
                var compareCheckBox = this.getChild('compareCheckBox');
                var compareCalendar = this.getChild('compareCalendar');
                baseCalendar.on(
                    'change',
                    function(e) {
                        me.setProperties({
                            base: e.target.getRawValue()
                        });
                    }
                );
                compareCheckBox.on(
                    'change',
                    function(e) {
                        me.setProperties({
                            isCompare: e.target.isChecked()
                        });
                    }
                );
                compareCalendar.on(
                    'change',
                    function(e) {
                        me.setProperties({
                            compared: e.target.getRawValue()
                        });
                    }
                );
            },

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
            getRawValue: function() {
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
            },

            /**
             * 获取日期话术
             * @return {Object}
             * {base:'2014-12-12 至 2014-12-13',compared:'2014-12-10 至 2014-12-11'}
             */
            getValue: function() {
                var reValue = {
                    base: this.getChild('baseCalendar').helper.getPart('text').innerText
                };
                // 即使在对比状态, 如果右侧日历为空,即显示为'请选择',也要对外表现为非对比状态
                if (this.isCompare && this.compared != null) {
                    reValue.compared = this.getChild('compareCalendar').helper.getPart('text').innerText;
                }
                return reValue;
            },

            /**
             * 获取天数
             *
             * @return {number} 天数
             */
            getDays: function() {
                return RangeCFCalendar.absDiffOfDays(this.base.begin, this.base.end) + 1;
            },

            /**
             * 获取天数话术
             * @param {?number} days 数字天数.如果不传则自动计算
             * @return {string} 共n天
             */
            getDaysText: function(days) {
                if (days == null) {
                    days = this.getDays();
                }
                return '共' + days.toString() + '天';
            },

            /**
             * 批量设置控件的属性值
             *
             * @param {Object} properties 属性值集合
             * @override
             * @return {Object} `properties`参数中确实变更了的那些属性
             */
            setProperties: function(properties) {
                var changes = Control.prototype.setProperties.call(this, properties);
                if (this.helper.isInStage('NEW')) {
                    return changes;
                }
                var compareCalendar = this.getChild('compareCalendar');
                var days = this.getDays();
                var isBaseChanged = changes.hasOwnProperty('base');
                var isIsCompareChanged = changes.hasOwnProperty('isCompare');
                var isComparedChanged = changes.hasOwnProperty('compared');
                // 确保只由原始触发的change向外抛出事件.以避免控件多联动导致的多次外抛.
                var isFireChange = false;
                if (!this.changeLocked) {
                    this.changeLocked = true;
                    isFireChange = true;
                }
                // 左侧base日历日期有变化
                if (isBaseChanged) {
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
                        compareCalendar.setDays(days);
                    }
                    else {
                        compareCalendar.disable();
                    }
                }
                // 处理外内部改动后,外抛change事件
                if (isFireChange) {
                    this.changeLocked = false;
                    // 只有rawValue的三个值变化了,才触发change事件
                    if (isBaseChanged || isIsCompareChanged || isComparedChanged) {
                        // 特殊逻辑: 如果是对比发生变化,但是右侧为请选择,则相当于没有勾选对比.故没必要抛出change事件
                        if (!(isIsCompareChanged && compareCalendar.getRawValue() === null)) {
                            this.fire('change', {
                                rawValue: this.getRawValue()
                            });
                        }

                    }
                }
                return changes;
            },

            /**
             * 判断属性新值是否有变化，内部用于`setProperties`方法
             *
             * @param {string} propertyName 属性名称
             * @param {Mixed} newValue 新值
             * @param {Mixed} oldValue 旧值
             * @return {boolean} true代表以改变
             * @override
             * @protected
             */
            isPropertyChanged: function(propertyName, newValue, oldValue) {
                if (propertyName === 'base' || propertyName === 'compared') {
                    // 比较两个时间范围,调用了FixedRangeCalendar的静态函数
                    return FixedRangeCalendar.isRangeChanged(newValue, oldValue);
                }
                // 默认实现将值和当前新值进行简单比对
                return oldValue !== newValue;
            }
        };

        lib.inherits(RangeCFCalendar, Control);
        ui.register(RangeCFCalendar);
        return RangeCFCalendar;
    }
);
