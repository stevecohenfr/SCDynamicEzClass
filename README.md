# SCDynamicEzClass

SCDynamicEzClass add dynamism to your eZ Publish classes. You can add conditions to hide attributes depending to other attributes values. For exemple if you want to show a Text line attribute depending of a checkbox.


# Installation

Clone this repository to your **ezpublish_legacy/extension** directory.
Enable this extension in **ezpublish_legacy/settings/override/site.ini.append.php**

    [ExtensionSettings]  
    ... 
    ActiveExtensions[]=scdynamicezclass
    ...

## Note

This plugin does **not** override any template of eZ Publish backend. It only inject a Javascript file that read and eval your conditions.

## Usage

Your conditions have to be written in the **description** field of your attribute between `{cond}{/cond}`. The condition will not be shown in the description when editing an Object. You can write your description after the closing tag `{/cond}`
All attributes are accessible as jQuery object by their identifier.

## Exemple

**Create dynamic attributes**

![Dynamic class exemple](/../screenshots/screenshots/screenshot1.png)

**Result**

![Dynamic class exemple 2](/../screenshots/screenshots/screenshot2.gif)
