/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Panel控件
 * @author otakustay
 */

define(
    function (require) {
        var Control = require('./Control');
        /**
         * Label控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Panel(options) {
            Control.call(this, options);
        }

        Panel.prototype.type = 'Panel';

        /**
         * 设置内容
         *
         * @param {string} html 内容HTML
         */
        Panel.prototype.setContent = function (html) {
            this.disposeChildren();
            this.main.innerHTML = html;
            this.initChildren(this.main);
        };

        require('./lib').inherits(Panel, Control);
        require('./main').register(Panel);
        return Panel;
    }
);