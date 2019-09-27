"use strict";

/**
 * @author Steve Cohen
 * @copyright 2019 (c) Steve Cohen.
 */


function SCDynamicEzClass() {

    this.constants = {};
    this.constants.DEBUG_GLOBAL_VAR = {};
    this.constants.EXT_NAME = "SCDynamicEzClass";
    this.constants.ATTR_DESCRIPTION_CLASS = '.classattribute-description';
    this.constants.ERROR_STYLE = "margin-top:3px;color:red;font-style:italic;font-size:11px;";
    this.constants.DEBUG_STYLE = "margin-top:3px;color:blue;font-style:italic;font-size:11px;";
    this.constants.COND_PREFIX = "{cond}";
    this.constants.COND_SUFFIX = "{/cond}";

    this.debugShowAccessibleVariables = false;
    this.debugShowConditions = false;
    this.debugShowErrors = false;
    /* Will contains all this.attributes by names: conditions, inputs*/
    this.attributes = {};

    var self = this;

    this.run = function() {
        this.populateAttributes();
        this.setAttributesValAccessibleGlobaly();
        this.checkAttributesCond();
    };

    /* Fill this.attributes object */
    this.populateAttributes = function() {
        $('[class^="block ezcca-edit-"]').each(function(index, e) {
            var block = $(e);
            var collapse = block.closest('.ezcca-collapsible').size() > 0 ? $(block.closest('.ezcca-collapsible')[0]) : null;
            var description = block.find(self.constants.ATTR_DESCRIPTION_CLASS);
            var inputs = block.find('input:not("[type=hidden]"), select');
            var attrName = block.attr('class').substr(block.attr('class').lastIndexOf("ezcca-edit-")+"ezcca-edit-".length);

            if (inputs.size() === 0) {
                return;
            } else if (inputs.size() === 1) {
                inputs = $(inputs[0]);
            }else {
                var subInputs = {
                    _nested_inputs: true
                };
                for (var i = 0; i < inputs.size(); i++) {
                    var subInput = $(inputs[i]);
                    if (typeof subInput.attr('id') !== 'undefined') {
                        subInputs[subInput.attr('id').substr(subInput.attr('id').lastIndexOf("_")+1)] = $(subInput);
                    }
                }
                inputs = subInputs;
            }

            self.attributes[attrName] = {
                block: block,
                collapse: collapse,
                inputs: inputs
            };

            if (description.text().startsWith(self.constants.COND_PREFIX)) {
                var cond = description.text().substring(description.text().indexOf(self.constants.COND_PREFIX) + self.constants.COND_PREFIX.length, description.text().indexOf(self.constants.COND_SUFFIX));
                var cleanDesc = description.text().substring(description.text().indexOf(self.constants.COND_SUFFIX) + self.constants.COND_SUFFIX.length);
                description.text(cleanDesc.trim());
                self.attributes[attrName].cond = cond;
            }
        });
    };

    /* Set attributes values accessible globaly */
    this.setAttributesValAccessibleGlobaly = function() {
        Object.keys(self.attributes).forEach(function(key) {
            var attr = self.attributes[key];
            if (attr.inputs instanceof jQuery) {
                /* Listen for any input change in attribute input  */
                $(document).on("change", attr.inputs[0], self.checkAttributesCond);
            }else {
                var subkeys = Object.keys(attr.inputs);
                for (var i = 0; i < subkeys.length; i++) {
                    var subInput = $(attr.inputs[subkeys[i]]);
                    /* Listen for any input change in attribute inputs  */
                    $(document).on("change", subInput, self.checkAttributesCond);
                }
            }
            /* Set global access to attribute inputs */
            self.setGlobalVar(key, attr.inputs);
        });

    };

    this.checkAttributesCond = function() {
        Object.keys(self.attributes).forEach(function(key) {
            var attr = self.attributes[key];

            if (attr.hasOwnProperty("cond")) {
                var show = null;
                try {
                    show = eval(attr.cond);
                } catch (e) {
                    return self.showError("Invalid condition (" + attr.cond + "):<br>" + e.message, key);
                }

                /* If contributed condition is invalid show error and skip */
                if (typeof show !== "boolean") {
                    return self.showError("Invalid condition (" + attr.cond + "):<br>" + "Your condition must result as boolean", key);
                }

                /* Hide attribute block if contributed cond is false */
                self.setAttrVisible(key, show);
            }
        });

    };


    this.setAttrVisible = function(key, visible) {
        var attr = self.attributes[key];

        if (self.debugShowConditions) {
            self.showDebug('cond(' + attr.cond + ') = ' + visible, key);
        }else {
            attr.block.css('display', visible ? 'block' : 'none');

            if (attr.collapse !== null && (visible === true || attr.collapse.find('.block:visible').size() === 0)) {
                attr.collapse.css('display', visible ? 'block' : 'none');
            }
        }

    };

    this.setGlobalVar = function(key, value) {
        window[key] = value;
        if (self.debugShowAccessibleVariables) {
            self.constants.DEBUG_GLOBAL_VAR[key] = Object.assign({}, value);
            if (typeof value === "object" && value._nested_inputs === true) {
                Object.keys(self.constants.DEBUG_GLOBAL_VAR[key]).map(function(nestedkey, index) {
                    self.constants.DEBUG_GLOBAL_VAR[key][nestedkey] = (self.constants.DEBUG_GLOBAL_VAR[key][nestedkey] instanceof jQuery) ? "jQuery" : typeof self.constants.DEBUG_GLOBAL_VAR[key][nestedkey];
                });
                delete self.constants.DEBUG_GLOBAL_VAR[key]._nested_inputs;
            }else {
                self.constants.DEBUG_GLOBAL_VAR[key] = value instanceof jQuery ? "jQuery" : typeof value;
            }
            if ($('#' + self.constants.EXT_NAME + "_global_var_debug").size() === 0) {
                $('.content-edit .box-content').prepend(
                    '<span style="' + self.constants.DEBUG_STYLE + '">[' + self.constants.EXT_NAME + '] DEBUG: ' +
                    '<a href="JavaScript:void(0);" id="'+ self.constants.EXT_NAME + '_global_var_debug_toggle" style="text-decoration:underline, cursor:pointer;">Show accessible variables in cond</a>' +
                    '</span>' +
                    '<div id="'+ self.constants.EXT_NAME + '_global_var_debug" style="display:none;' + self.constants.DEBUG_STYLE + '"></div>');

                $('#' + self.constants.EXT_NAME + '_global_var_debug_toggle').click(function() {
                    $('#' + self.constants.EXT_NAME + '_global_var_debug').slideToggle(500);
                });
            }
            $('#' + self.constants.EXT_NAME + "_global_var_debug").html(
                "<br><pre>" + JSON.stringify(self.constants.DEBUG_GLOBAL_VAR, null, 2) + "</pre>");
        }
    };

    this.showError = function(error, key) {
        if (self.debugShowErrors) {
            var attr = self.attributes[key];
            delete  self.attributes[key];
            attr.block.append('<div style="' + self.constants.ERROR_STYLE + '">[' + self.constants.EXT_NAME + '] ERROR: ' + error + '</div>');

        }
        return true;
    };

    this.showDebug = function(debug, key) {
        var attr = self.attributes[key];
        if ($("#" + self.constants.EXT_NAME + "_cond_debug_" + key).size() === 0) {
            attr.block.append('<div id="' + self.constants.EXT_NAME + '_cond_debug_' + key + '" style="' + self.constants.DEBUG_STYLE + '"></div>');
        }
        $("#" + self.constants.EXT_NAME + "_cond_debug_" + key).html('[' + self.constants.EXT_NAME + '] DEBUG: ' + debug);

        return true;
    };

}