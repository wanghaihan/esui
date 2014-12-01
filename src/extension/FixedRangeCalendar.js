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

            if (!date) {
                return;
            }

            this.rawValue = date;
            updateDisplayText(this);

            /**
             * @event change
             *
             * 值发生变化时触发
             *
             * @member Calendar
             */
            this.fire('change');
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
            textHolder.innerHTML = u.escape(calendar.getValue());
        }

        /**
         * 初始化DOM结构
         */
        function initStructure() {
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
        }

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
            target.initStructure = initStructure;
            target.on('afterrender', function() {
                this.layer.render = function(element) {
                    document.body.appendChild(element);
                    element.innerHTML = '<div>起始时间:</div>'
                    + '<div data-ui-type="MonthView" '
                    + 'data-ui-child-name="monthView"></div>'
                    + '<div>结束时间:</div>'
                    + '<div>时间段:</div>';

                    var calendar = this.control;
                    calendar.helper.initChildren(element);

                    var monthView = calendar.getChild('monthView');
                    monthView.setProperties({
                        'rawValue': calendar.rawValue,
                        'range': calendar.range
                    });
                    monthView.on('change', syncMonthViewValue, calendar);


                    if (calendar.autoHideLayer) {
                        monthView.on(
                            'itemclick',
                            u.bind(calendar.layer.toggle, calendar.layer)
                        );
                    }
                };

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
