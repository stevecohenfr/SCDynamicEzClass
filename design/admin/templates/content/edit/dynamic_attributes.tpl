{def    $show_accessible_variables = ezini('DebugSettings', 'ShowAccessibleVariables', 'scdynamicezclass.ini')
        $show_conditions = ezini('DebugSettings', 'ShowConditions', 'scdynamicezclass.ini')
        $show_errors = ezini('DebugSettings', 'ShowErrors', 'scdynamicezclass.ini')
}

{literal}
<script type="text/javascript">
    $(document).ready(function() {
        var scdynamicezclass = new SCDynamicEzClass();
        scdynamicezclass.debugShowAccessibleVariables = "{/literal}{$show_accessible_variables}{literal}" === "enabled";
        scdynamicezclass.debugShowConditions = "{/literal}{$show_conditions}{literal}" === "enabled";
        scdynamicezclass.debugShowErrors = "{/literal}{$show_errors}{literal}" === "enabled";
        scdynamicezclass.run();
    });
</script>
{/literal}