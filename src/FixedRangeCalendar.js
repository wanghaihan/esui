/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 时间长度已定的时间区间选择控件
 * @author Haihan Wang(wanghaihan@baidu.com)
 */
define(
    function (require) {
        var lib = require('./lib');
        var ui = require('./main');
        var Calendar = require('./Calendar');

        /**
         * 控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function FixedRangeCalendar(options) {
            Calendar.apply(this, arguments);
        }

        FixedRangeCalendar.prototype.type = 'FixedRangeCalendar';

        lib.inherits(FixedRangeCalendar, Calendar);
        ui.register(FixedRangeCalendar);
        return FixedRangeCalendar;
    }
);
