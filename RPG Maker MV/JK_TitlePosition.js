//-----------------------------------------------------------------------------
//  Joker's Title Command Repositioning
//-----------------------------------------------------------------------------
//  For: RPGMAKER MV
//  JK_TitlePosition.js
//-----------------------------------------------------------------------------

/*:
 * @author Jameel Kaba (Joker Games)
 * @plugindesc Manipulates the position of the title command window.
 *
 * @param Offset X
 * @desc The offset value for the x coordinate.
 * @default 0
 *
 * @param Offset Y
 * @desc The offset value for the y coordinate.
 * @default 0
 *
 * @param Width
 * @desc The width of the command window.
 * @default 240
 *
 * @param Background
 * @desc The background type. 0: Normal, 1: Dim, 2: Transparent
 * @default 0
 *
 * @help
 *
 */

(function(){
    var parameters = PluginManager.parameters('JK_TitlePosition');
    var offsetX = Number(parameters['Offset X'] || 0);
    var offsetY = Number(parameters['Offset Y'] || 0);
    var width = Number(parameters['Width'] || 240);
    var background = Number(param['Background'] || 0);
    
    var _Window_TitleCommand_updatePlacement = Window_TitleCommand.prototype.updatePlacement;
    Window_TitleCommand.prototype.updatePlacement = function(){
        _Window_TitleCommand_updatePlacement.call(this);
        this.x += offsetX;
        this.y += offsetY;
        this.setBackgroundType(background);
    };
    
    Window_TitleCommand.prototype.windowWidth = function(){
        return width;
    };
})();
