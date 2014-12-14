/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 固定天数区间日历
 * @author Haihan Wang(wanghaihan@baidu.com)
 */

define(
    function(require) {
        require('./MonthView');

        var u = require('underscore');
        var moment = require('moment');
        var lib = require('./lib');
        var ui = require('./main');
        var InputControl = require('./InputControl');
        var helper = require('./controlHelper');
        var Layer = require('./Layer');

        // 日期范围之间的连接符
        var DATE_SPLITER = ' 至 ';
        // 用一个肯定在范围之外的日期来让monthView表现得像没有选值一样.
        var NULL_DATE = new Date(2050, 1, 1);

        /**
         * 日历用浮层
         *
         * @extends Layer
         * @ignore
         * @constructor
         */
        function CalendarLayer() {
            Layer.apply(this, arguments);
        }

        /**
         * 获取layer的HTML
         * @param  {Object} model 数据集
         * @return {string}       html
         */
        CalendarLayer.getLayerHTML = function(model) {
            var template = [
                '<div class="${classPanel}">',
                '<div class="${classItem} ${classTime}">起始时间 : ',
                '<span id="${beginDomID}"></span>',
                '</div>',
                '<div data-ui-type="MonthView"',
                'data-ui-child-name="monthView"></div>',
                '<div class="${classItem} ${classTime}">结束时间 : ',
                '<span id="${endDomID}"></span>',
                '</div>',
                '<div class="${classItem}">时间段 : ',
                '<span id="${daysDomID}"></span> 天',
                '</div>',
                '</div>'
            ];
            return lib.format(template.join(''), model);
        };

        /**
         * 将日历选择控件的各项值设置为rawValue
         * @param {FixedRangeCalendar} calendar 固定天数区间日历实例
         */
        CalendarLayer.syncMonthViewByMain = function(calendar) {
            var monthView = calendar.getChild('monthView');
            var monthViewProperties = {
                'range': {
                    begin: calendar.range.begin,
                    end: moment(calendar.range.end)
                        .subtract('day', (calendar.days - 1)).toDate()
                }
            };
            if (calendar.rawValue == null) {
                // 如果没有值,则将日历的当前天调到最大范围之外,但是将年和月设置为当前
                var now = new Date();
                monthViewProperties.rawValue = NULL_DATE;
                monthViewProperties.year = now.getFullYear();
                monthViewProperties.month = now.getMonth() + 1;
            }
            else {
                monthViewProperties.rawValue = calendar.rawValue.begin;
            }
            monthView.setProperties(monthViewProperties);
        };

        /**
         * 初始化MonthView的各项参数
         * @param  {FixedRangeCalendar} calendar 固定天数区间日历实例
         */
        CalendarLayer.initMonthView = function(calendar) {
            var monthView = calendar.getChild('monthView');
            CalendarLayer.syncMonthViewByMain(calendar);
            monthView.on('change', function() {
                var date = monthView.getRawValue();
                if (!date || date >= NULL_DATE) {
                    calendar.setBeginOfRawValuePreview(null);
                }
                calendar.setBeginOfRawValuePreview(date);
            });

            // 将mouseview的点击行为修正为hover行为. 此处依赖mouseview的initEvents方法实现
            var monthMain = monthView.helper.getPart('monthMain');
            var orgClickHandler = monthView.domEvents[monthMain._esuiDOMEvent].click.queue[0].handler;
            helper.addDOMEvent(monthView, monthMain, 'mousemove', orgClickHandler);
            helper.removeDOMEvent(monthView, monthMain, 'click', orgClickHandler);
            helper.addDOMEvent(monthView, monthMain, 'click', function() {
                calendar.setRawValue(calendar.rawValuePreview);
                calendar.layer.toggle();
            });
            helper.addDOMEvent(monthView, monthMain, 'mouseleave', function() {
                calendar.set('rawValuePreview', calendar.rawValue);
                CalendarLayer.syncMonthViewByMain(calendar);
            });
        };

        CalendarLayer.prototype = {
            /**
             * 渲染层内容 用于重写this.layer.render
             *
             * @param {HTMLElement} element 层元素
             * @abstract
             */
            render: function(element) {
                var thisHelper = this.control.helper;
                // 将ID放到当前对象上以后后期更新数据是用
                this.beginDomID = thisHelper.getId('begin');
                this.endDomID = thisHelper.getId('end');
                this.daysDomID = thisHelper.getId('days');
                element.innerHTML = CalendarLayer.getLayerHTML({
                    classPanel: thisHelper.getPartClassName('panel'),
                    classItem: thisHelper.getPartClassName('item'),
                    classTime: thisHelper.getPartClassName('time'),
                    beginDomID: this.beginDomID,
                    endDomID: this.endDomID,
                    daysDomID: this.daysDomID
                });
                document.body.appendChild(element);
                var calendar = this.control;
                calendar.helper.initChildren(element);
                // 格外设置一些MonthView的各种定制参数
                CalendarLayer.initMonthView(calendar);
            },

            /**
             * 隐藏或显示浮层
             */
            toggle: function() {
                var element = this.getElement();
                if (!element || this.control.helper.isPart(element, 'layer-hidden')) {
                    var calendar = this.control;
                    // 展示之前先跟main同步
                    CalendarLayer.syncMonthViewByMain(calendar);
                    // 将预览值重置为当前值
                    calendar.set('rawValuePreview', calendar.rawValue);
                    // 更新下天数
                    lib.g(calendar.layer.daysDomID).innerText = calendar.days;

                    this.show();
                }
                else {
                    this.hide();
                }
            }
        };
        lib.inherits(CalendarLayer, Layer);

        /**
         * 固定天数区间日历
         *
         * @extends InputControl
         * @requires MonthView
         * @constructor
         */
        function FixedRangeCalendar() {
            InputControl.apply(this, arguments);
            this.layer = new CalendarLayer(this);
        }

        /**
         * 检查时间范围是否变化
         * @param  {{begin:Date,end:Date}=} newRange 新值
         * @param  {{begin:Date,end:Date}=} oldRange 原值
         * @return {boolean} true代表改变
         */
        FixedRangeCalendar.isRangeChanged = function(newRange, oldRange) {
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
        };

        /**
         * 获取main的HTML
         * @param  {Object} model 数据集
         * @return {string}       html
         */
        FixedRangeCalendar.getMainHTML = function(model) {
            var template = [
                '<div class="${classes}" id="${id}">${value}</div>',
                '<div class="${arrow}"></div>'
            ];
            return lib.format(template.join(''), model);
        };


        FixedRangeCalendar.prototype = {
            /**
             * 控件类型，始终为`"FixedRangeCalendar"`
             *
             * @type {string}
             * @readonly
             * @override
             */
            type: 'FixedRangeCalendar',

            /**
             * 初始化参数
             *
             * @param {Object} options 构造函数传入的参数
             * @protected
             * @override
             */
            initOptions: function(options) {
                var now = new Date();
                var properties = {
                    range: {
                        begin: new Date(1983, 8, 3),
                        end: new Date(2046, 10, 4)
                    },
                    /**
                     * @property {string} [dateFormat="YYYY-MM-DD"]
                     * 输出的日期格式，具体的日期格式参考
                     * [moment文档](http://momentjs.com/docs/#/displaying/format/)
                     */
                    dateFormat: 'YYYY-MM-DD',
                    /**
                     * @property {Object} 初始日期，只可设置begin字段,end字段为自动算出
                     */
                    rawValue: {
                        begin: now
                    },
                    days: 1
                };
                u.extend(properties, options);
                // 抽取dom属性
                if (lib.isInput(this.main)) {
                    this.helper.extractOptionsFromInput(this.main, properties);
                }
                // 修正rawValue
                if (properties.value) {
                    properties.rawValue = this.parseValue(properties.value);
                }
                properties.rawValue.end = this.getEndDay(properties.rawValue.begin);
                // 修正range,兼容字符串设置
                if (typeof properties.range === 'string') {
                    var beginAndEnd = properties.range.split(',');
                    properties.range = {
                        begin: this.parseValue(beginAndEnd[0]),
                        end: this.parseValue(beginAndEnd[1])
                    };
                }
                this.setProperties(properties);
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             * @override
             */
            initStructure: function() {
                // 如果主元素是输入元素，替换成`<div>`
                // 如果输入了非块级元素，则不负责
                var thisHelper = this.helper;
                if (lib.isInput(this.main)) {
                    thisHelper.replaceMain();
                }
                this.main.innerHTML = FixedRangeCalendar.getMainHTML({
                    id: thisHelper.getId('text'),
                    classes: thisHelper.getPartClassName('text'),
                    arrow: thisHelper.getPartClassName('arrow')
                });
            },

            /**
             * 初始化事件交互
             *
             * @protected
             * @override
             */
            initEvents: function() {
                this.helper.addDOMEvent(this.main, 'click', u.bind(this.layer.toggle, this.layer));
            },

            /**
             * 重渲染
             *
             * @method
             * @protected
             * @override
             */
            repaint: require('./painters').createRepaint(
                InputControl.prototype.repaint, {
                    name: ['rawValue'],
                    paint: function(calendar, rawValue) {
                        // 更新主显示
                        var textHolder = calendar.helper.getPart('text');
                        if (textHolder) {
                            textHolder.innerHTML = u.escape(calendar.getValue());
                        }
                    }
                }, {
                    name: ['rawValuePreview'],
                    paint: function(calendar, rawValuePreview) {
                        var layer = calendar.layer;
                        if (!calendar.helper.isInStage('INITED')) {
                            if (rawValuePreview == null) {
                                lib.g(layer.beginDomID).innerText = '';
                                lib.g(layer.endDomID).innerText = '';
                            }
                            else {
                                lib.g(layer.beginDomID).innerText = calendar.stringifyDate(rawValuePreview.begin);
                                lib.g(layer.endDomID).innerText = calendar.stringifyDate(rawValuePreview.end);
                            }
                        }
                    }
                }, {
                    name: ['disabled', 'hidden', 'readOnly'],
                    paint: function(calendar, disabled, hidden, readOnly) {
                        if (disabled || hidden || readOnly) {
                            calendar.layer.hide();
                        }
                    }
                }
            ),

            /**
             * 设置输入控件的原始值,没有验证是否处在可选范围内
             *
             * @param {{begin:Date,end:Date}=} rawValue 原始值
             */
            setRawValue: function(rawValue) {
                var changesIndex = this.setProperties({
                    rawValue: rawValue
                });
                if (changesIndex.hasOwnProperty('rawValue')) {
                    this.fire('change');
                }
            },

            /**
             * 设置输入控件的开始日期原始值
             *
             * @param {Date} begin 开始日期,end字段根据天数自动计算
             */
            setBeginOfRawValuePreview: function(begin) {
                var rawValuePreview = {};
                if (begin != null) {
                    rawValuePreview = {
                        begin: begin,
                        end: this.getEndDay(begin)
                    };
                }
                else {
                    rawValuePreview = null;
                }
                this.setProperties({
                    rawValuePreview: rawValuePreview
                });
            },


            /**
             * 计算结束日期
             * @param {Date} begin 起始日期
             * @return {Date} 结束日期
             */
            getEndDay: function(begin) {
                return moment(begin)
                    .add('day', (this.days - 1)).toDate();
            },

            /**
             * 设置天数
             * @param {number} days 天数
             */
            setDays: function(days) {
                var changesIndex = this.setProperties({
                    days: days
                });
                if (changesIndex.hasOwnProperty('days')) {
                    if (this.rawValue != null) {
                        var rawValue = lib.clone(this.rawValue);
                        rawValue.end = this.getEndDay(this.rawValue.begin);
                        this.setRawValue(rawValue);
                        this.ensureInRange();
                    }
                }
            },

            /**
             *
             * 设置日期可选区间
             *
             * @param {meta.DateRange} range 日期可选区间
             */
            setRange: function(range) {
                var changesIndex = this.setProperties({
                    range: range
                });
                if (changesIndex.hasOwnProperty('range')) {
                    this.ensureInRange();
                }
            },

            /**
             * 确保当前的值处在可选范围的措施.
             * 设置monthView的range.
             * 如果更改导致原始值超出了范围,则将rawValue值置空
             */
            ensureInRange: function() {
                if (this.rawValue.begin < this.range.begin || this.rawValue.end > this.range.end) {
                    this.setRawValue(null);
                }
            },

            /**
             * 获取日期的格式化文字
             *
             * @param {Date} rawValue 原始值
             * @return {string} 日期文字
             * @protected
             */
            stringifyDate: function(rawValue) {
                return moment(rawValue).format(this.dateFormat) || '';
            },

            /**
             * 将值从原始格式转换成字符串，复杂类型的输入控件需要重写此接口
             *
             * @param {Object} rawValue 原始值
             * @return {string} 日期文字
             * @protected
             * @override
             */
            stringifyValue: function(rawValue) {
                if (rawValue === null) {
                    return '请选择';
                }
                var begin = this.stringifyDate(rawValue.begin);
                var end = this.stringifyDate(rawValue.end);
                if (begin === end) {
                    return begin;
                }
                return begin + DATE_SPLITER + end;
            },

            /**
             * 将字符串类型的值转换成原始格式，复杂类型的输入控件需要重写此接口
             *
             * @param {string} value 字符串值
             * @return {Object} rawValue
             * @protected
             * @override
             */
            parseValue: function(value) {
                if (!value) {
                    return null;
                }
                var rangeValues = value.split(DATE_SPLITER);
                if (rangeValues.length === 1) {
                    return moment(value, this.dateFormat).toDate();
                }
                var rawValue = {
                    begin: moment(rangeValues[0], this.dateFormat).toDate(),
                    end: moment(rangeValues[1], this.dateFormat).toDate()
                };
                return rawValue;
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
                if (propertyName === 'rawValue' || propertyName === 'rawValuePreview') {
                    // 比较两个时间范围
                    return FixedRangeCalendar.isRangeChanged(newValue, oldValue);
                }
                // 默认实现将值和当前新值进行简单比对
                return oldValue !== newValue;
            },

            /**
             * 销毁
             *
             * @override
             */
            dispose: function() {
                if (this.helper.isInStage('DISPOSED')) {
                    return;
                }

                if (this.layer) {
                    this.layer.dispose();
                    this.layer = null;
                }

                InputControl.prototype.dispose.apply(this, arguments);
            }
        };

        lib.inherits(FixedRangeCalendar, InputControl);
        ui.register(FixedRangeCalendar);

        return FixedRangeCalendar;
    }
);
