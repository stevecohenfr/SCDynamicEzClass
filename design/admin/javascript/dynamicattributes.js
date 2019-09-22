/**
 * @author Steve Cohen
 * @copyright 2019 (c) Steve Cohen.
 */

$(function() {
    const DEBUG = false;
    const DEBUG_GLOBAL_VAR = {};

    const EXT_NAME = "SCDynamicEzClass";

    const ATTR_DESCRIPTION_CLASS = '.classattribute-description';

    const ERROR_STYLE = "margin-top:3px;color:red;font-style:italic;font-size:11px;";
    const DEBUG_STYLE = "margin-top:3px;color:blue;font-style:italic;font-size:11px;";

    const COND_PREFIX = "{cond}";
    const COND_SUFFIX = "{/cond}";

    /* Will contains all attributes by names: conditions, inputs*/
    var attributes = {};

    /* Fill attributes object */
    var populateAttributes = function() {
        $('[class^="block ezcca-edit-"]').each(function(i, e) {
            var block = $(e);
            var collapse = block.closest('.ezcca-collapsible').size() > 0 ? $(block.closest('.ezcca-collapsible')[0]) : null;
            var description = block.find(ATTR_DESCRIPTION_CLASS);
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
            console.log(inputs);

            attributes[attrName] = {
                block: block,
                collapse: collapse,
                inputs: inputs
            };

            if (description.text().startsWith(COND_PREFIX)) {
                var cond = description.text().substring(description.text().indexOf(COND_PREFIX) + COND_PREFIX.length, description.text().indexOf(COND_SUFFIX));
                var cleanDesc = description.text().substring(description.text().indexOf(COND_SUFFIX) + COND_SUFFIX.length);
                description.text(cleanDesc.trim());
                attributes[attrName]["cond"] = cond;
            }
        });
    };

    var onInputChange = function(event) {
        checkAttributesCond();
    };

    /* Set attributes values accessible globaly */
    var setAttributesValAccessibleGlobaly = function() {
        Object.keys(attributes).forEach(function(key) {
            var attr = attributes[key];
            if (attr.inputs instanceof jQuery) {
                /* Listen for any input change in attribute input  */
                $(document).on("change", attr.inputs[0], onInputChange);
            }else {
                var subkeys = Object.keys(attr.inputs);
                for (var i = 0; i < subkeys.length; i++) {
                    var subInput = $(attr.inputs[subkeys[i]]);
                    /* Listen for any input change in attribute inputs  */
                    $(document).on("change", subInput, onInputChange);
                }
            }
            /* Set global access to attribute inputs */
            setGlobalVar(key, attr.inputs);
        });

    };

    var checkAttributesCond = function() {
        Object.keys(attributes).forEach(function(key) {
            var attr = attributes[key];

            if (attr.hasOwnProperty("cond")) {
                var show = null;
                try {
                    show = eval(attr.cond);
                } catch (e) {
                    return showError("Invalid condition (" + attr.cond + "):<br>" + e.message, key);
                }

                /* If contributed condition is invalid show error and skip */
                if (typeof show !== "boolean") {
                    return showError("Invalid condition (" + attr.cond + "):<br>" + "Your condition must result as boolean", key);
                }

                /* Hide attribute block if contributed cond is false */
                setAttrVisible(key, show);
            }
        });

    };

    var setAttrVisible = function(key, visible) {
        var attr = attributes[key];

        if (DEBUG) {
            showDebug('cond(' + attr.cond + ') = ' + visible, key);
        }else {
            attr.block.css('display', visible ? 'block' : 'none');

            if (attr.collapse !== null && (visible === true || attr.collapse.find('.block:visible').size() === 0)) {
                attr.collapse.css('display', visible ? 'block' : 'none');
            }
        }

    };

    var setGlobalVar = function(key, value) {
        window[key] = value;
        if (DEBUG) {
            DEBUG_GLOBAL_VAR[key] = Object.assign({}, value);
            if (typeof value === "object" && value._nested_inputs === true) {
                Object.keys(DEBUG_GLOBAL_VAR[key]).map(function(nestedkey, index) {
                    DEBUG_GLOBAL_VAR[key][nestedkey] = (DEBUG_GLOBAL_VAR[key][nestedkey] instanceof jQuery) ? "jQuery" : typeof DEBUG_GLOBAL_VAR[key][nestedkey];
                });
                delete DEBUG_GLOBAL_VAR[key]._nested_inputs;
            }else {
                DEBUG_GLOBAL_VAR[key] = value instanceof jQuery ? "jQuery" : typeof value;
            }
            if ($('#' + EXT_NAME + "_global_var_debug").size() === 0) {
                $('.content-edit .box-content').prepend(
                    '<span style="' + DEBUG_STYLE + '">[' + EXT_NAME + '] DEBUG: ' +
                    '<a href="JavaScript:void(0);" id="'+ EXT_NAME + '_global_var_debug_toggle" style="text-decoration:underline, cursor:pointer;">Show accessible variables in cond</a>' +
                    '</span>' +
                    '<div id="'+ EXT_NAME + '_global_var_debug" style="display:none;' + DEBUG_STYLE + '"></div>');

                $('#' + EXT_NAME + '_global_var_debug_toggle').click(function() {
                    $('#' + EXT_NAME + '_global_var_debug').slideToggle(500);
                });
            }
            $('#' + EXT_NAME + "_global_var_debug").html(
                "<br><pre>" + JSON.stringify(DEBUG_GLOBAL_VAR, null, 2) + "</pre>");
        }
    };

    var showError = function(error, key) {
        var attr = attributes[key];
        delete  attributes[key];
        attr.block.append('<div style="' + ERROR_STYLE + '">[' + EXT_NAME + '] ERROR: ' + error + '</div>');

        return true;
    };

    var showDebug = function(debug, key) {
        var attr = attributes[key];
        if ($("#" + EXT_NAME + "_cond_debug_" + key).size() === 0) {
            attr.block.append('<div id="' + EXT_NAME + '_cond_debug_' + key + '" style="' + DEBUG_STYLE + '"></div>');
        }
        $("#" + EXT_NAME + "_cond_debug_" + key).html('[' + EXT_NAME + '] DEBUG: ' + debug);

        return true;
    };

    $(document).ready(function() {
        populateAttributes();
        setAttributesValAccessibleGlobaly();
        checkAttributesCond();
    });
});