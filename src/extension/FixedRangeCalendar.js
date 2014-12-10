/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 时间长度已定的时间区间选择控件
 * @author Haihan Wang(wanghaihan@baidu.com)
 */
define(
    function(require) {
        var lib = require('../lib');
        var ui = require('../main');
        var Extension = require('../Extension');
        var u = require('underscore');
        var moment = require('moment');
        var helper = require('../controlHelper');

        var DATE_SPLITER = ' 至 ';
        // 用一个肯定在范围之外的日期来让monthView表现得像没有选值一样.
        var NULL_DATE = new Date(2050, 1, 1);

        /**
         * 对日历控件的扩展
         *
         * @constructor
         */
        function FixedRangeCalendar() {
            Extension.apply(this, arguments);
        }

        /**
         * 更新显示
         *
         * @param {MonthView} monthView MonthView控件实例
         * @ignore
         */
        function syncMonthViewValue() {
            var monthView = this.getChild('monthView');
            var date = monthView.getRawValue();
            if (!date || date >= NULL_DATE) {
                return;
            }
            this.setRawValue({
                begin: date
            });
        }



        /**
         * 更新显示的文字
         *
         * @param {Calendar} calendar 控件实例
         * @ignore
         */
        function updateDisplayText(calendar) {
            // 更新主显示
            var textHolder = calendar.helper.getPart('text');
            if (textHolder) {
                textHolder.innerHTML = u.escape(calendar.getValue());
            }
        }

        /**
         * 更新layer中的文字
         *
         * @param {Calendar} calendar 控件实例
         * @ignore
         */
        function updateLayerText(calendar) {
            // 更新layer中的值
            var rangeDate = calendar.getRawValue();
            var layer = calendar.layer;
            if (layer) {
                var daysDom = lib.g(layer.daysDomID);
                // 只要拥有了一下任意一个dom, 则说明layer已经被render
                if (daysDom) {
                    lib.g(layer.beginDomID).innerText = rangeDate === null ?
                        '' : calendar.stringifyValue(rangeDate.begin);
                    lib.g(layer.endDomID).innerText = rangeDate === null ?
                        '' : calendar.stringifyValue(rangeDate.end);
                    daysDom.innerText =
                        calendar.days;
                }
            }

        }

        /**
         * canlendar 需要扩展或重写的对象
         * @type {object}
         */
        var calendarPrototype = {
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

                var template = [
                    '<div class="${classes}" id="${id}">${value}</div>',
                    '<div class="${arrow}"></div>'
                ];


                this.main.innerHTML = lib.format(
                    template.join(''), {
                        id: thisHelper.getId('text'),
                        // 使用与左侧日历一致的样式
                        classes: thisHelper.getPartClassName('fixedRange-text'),
                        arrow: thisHelper.getPartClassName('fixedRange-arrow')
                    }
                );

                // 与range calendar的外贸保持一致
                var prefix = ui.getConfig('uiClassPrefix');
                lib.removeClass(this.main, prefix + '-calendar');
                lib.addClass(this.main, prefix + '-rangecalendar');
            },

            /**
             * 获取输入控件的值的字符串形式
             *
             * @return {string} 格式为:xx 至 xx.为空时为'请选择'
             */
            getValue: function() {
                var rangeRawValue = this.getRawValue();
                if (rangeRawValue === null) {
                    return '请选择';
                }
                return this.stringifyValue(rangeRawValue.begin) + DATE_SPLITER + this.stringifyValue(
                    rangeRawValue.end);
            },

            /**
             * 设置输入控件的值
             *
             * @param {string} value 输入控件的值
             */
            setValue: function(value) {
                var rangeValues = value.split(DATE_SPLITER);
                var rawValue = {};
                rawValue.begin = this.parseValue(rangeValues[0]);
                rawValue.end = this.parseValue(rangeValues[2]);
                this.setRawValue(rawValue);
            },

            /**
             * 获取输入控件的原始值
             *
             * @return {Object} 返回包含begin和end字段的日期范围
             */
            getRawValue: function() {
                if (this.rawValue === null) {
                    return null;
                }
                // 为了维持日历的功能,内部的rawValue采用了begin字段.
                // 但是对外暴漏的是begin 和 end的两个字段的对象
                var rangeRawValue = {};
                rangeRawValue.begin = this.rawValue;
                rangeRawValue.end = this.getEndDay();
                return rangeRawValue;
            },

            /**
             * 设置输入控件的原始值,没有验证是否处在可选范围内
             *
             * @param {Object} rangeRawValue
             * 输入控件的原始值,只考虑begin字段. end字段根据天数自动计算
             */
            setRawValue: function(rangeRawValue) {
                if (rangeRawValue == null) {
                    this.setProperties({
                        rawValue: null
                    });
                } else {
                    this.setProperties({
                        rawValue: rangeRawValue.begin
                    });
                }
                //   updateDisplayText(this);

                updateLayerText(this);
                /**
                 * @event change
                 *
                 * 值发生变化时触发
                 *
                 * @member Calendar
                 */
                this.fire('change');
            },

            /**
             * 获取结束日期
             * @return {Date} 结束日期
             */
            getEndDay: function() {
                if (this.rawValue === null) {
                    return null;
                }
                // 为了减小对calendar的修改
                // 故每次获取end时采用计算方式,而非添加一个需要维护的字段
                return moment(this.rawValue)
                    .add('day', (this.days - 1)).toDate();
            },

            /**
             * 设置天数
             * @param {number} days 天数
             */
            setDays: function(days) {
                if (days !== this.days) {
                    this.days = days;
                    updateLayerText(this);
                    this.setRange(this.getBeginRange());
                }
            },

            /**
             * 获取起始时间的日期可选区间
             * @return {meta.DateRange} 起始日期的可选区间
             */
            getBeginRange: function() {
                var beginRange = {};
                beginRange.begin = this.orgRange.begin;
                beginRange.end = moment(this.orgRange.end)
                    .subtract('day', (this.days - 1)).toDate();
                return beginRange;
            },

            /**
             * 设置日期可选区间
             *
             * @param {meta.DateRange} range 起始日期的可选区间
             */
            setRange: function(range) {
                this.setProperties({
                    'range': range
                });
                this.ensureInRange();
            },

            /**
             * 确保当前的值处在可选范围的措施.
             * 设置monthView的range.
             * 如果更改导致原始值超出了范围,则将rawValue值置空
             */
            ensureInRange: function() {
                if (this.rawValue > this.range.end) {
                    this.setRawValue(null);
                }
            }

        };

        /**
         * layter 需要扩展或重写的对象
         * @type {object}
         */
        var layerPrototype = {
            toggle: function() {
                var element = this.getElement();
                if (!element || this.control.helper.isPart(element, 'layer-hidden')) {
                    // 展示之前先跟main同步
                    var calendar = this.control;
                    var monthView = calendar.getChild('monthView');
                    var monthViewProperties = {
                        'rawValue': calendar.rawValue,
                        'range': calendar.range
                    };
                    if (calendar.rawValue == null) {
                        var now = new Date();
                        monthViewProperties.rawValue = NULL_DATE;
                        monthViewProperties.year = now.getFullYear();
                        monthViewProperties.month = now.getMonth() + 1;
                    }
                    monthView.setProperties(monthViewProperties);
                    this.show();
                } else {
                    this.hide();
                }
            },
            /**
             * 渲染层内容 用于重写this.layer.render
             *
             * @param {HTMLElement} element 层元素
             * @abstract
             */
            render: function(element) {
                var thisHelper = this.control.helper;
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
                // 将ID放到当前对象上以后后期更新数据是用
                this.beginDomID = thisHelper.getId('begin');
                this.endDomID = thisHelper.getId('end');
                this.daysDomID = thisHelper.getId('days');

                element.innerHTML = lib.format(
                    template.join(''), {
                        classPanel: thisHelper
                            .getPartClassName('fixedRange-panel'),
                        classItem: thisHelper
                            .getPartClassName('fixedRange-item'),
                        classTime: thisHelper
                            .getPartClassName('fixedRange-time'),
                        beginDomID: this.beginDomID,
                        endDomID: this.endDomID,
                        daysDomID: this.daysDomID
                    }
                );

                document.body.appendChild(element);

                var calendar = this.control;
                calendar.helper.initChildren(element);

                updateLayerText(calendar);

                var monthView = calendar.getChild('monthView');
                monthView.setProperties({
                    'rawValue': calendar.rawValue,
                    'range': calendar.range
                });
                monthView.on('change', syncMonthViewValue, calendar);

                // 将mouseview的点击行为修正为hover行为. 此次依赖mouseview的initEvents方法实现
                var monthMain = monthView.helper.getPart('monthMain');
                var mousemoveHandler = monthView.domEvents[monthMain._esuiDOMEvent].click.queue[0].handler;
                helper.addDOMEvent(monthView, monthMain, 'mousemove', mousemoveHandler);
                helper.removeDOMEvent(monthView, monthMain, 'click', mousemoveHandler);



                if (calendar.autoHideLayer) {
                    monthView.on(
                        'itemclick',
                        u.bind(calendar.layer.toggle, calendar.layer)
                    );
                }
            }
        };

        /**
         * 指定扩展类型，始终为`"FixedRangeCalendar"`
         *
         * @type {string}
         */
        FixedRangeCalendar.prototype.type = 'FixedRangeCalendar';

        /**
         * 激活扩展
         *
         * @override
         */
        FixedRangeCalendar.prototype.activate = function() {
            var target = this.target;
            lib.extend(target, calendarPrototype);

            // 将扩展初始化时传来的天数设置到控件中
            target.setDays(this.days);

            // 扩展layer的方法
            target.on('afterrender', function() {
                lib.extend(this.layer, layerPrototype);
            });
            Extension.prototype.activate.apply(this, arguments);
        };

        /**
         * 取消扩展的激活状态
         *
         * @override
         */
        FixedRangeCalendar.prototype.inactivate = function() {
            // var target = this.target;

            Extension.prototype.inactivate.apply(this, arguments);
        };

        lib.inherits(FixedRangeCalendar, Extension);
        ui.registerExtension(FixedRangeCalendar);
        return FixedRangeCalendar;
    }
);