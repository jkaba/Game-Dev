//-----------------------------------------------------------------------------
//  Joker's Dash Management
//-----------------------------------------------------------------------------
//  For: RPGMAKER MV
//  JK_CreditsRoll.js
//-----------------------------------------------------------------------------

/*:
 * @author Jameel Kaba (Joker Games)
 * @plugindesc Lets you manage the dashing mode in your game with simple plugin options.
 *
 * @param Disable Auto-dash
 * @desc If true: Disables touch and mouse input to cause auto-dashing behavior
 * @default false
 *
 * @param Disable Dashing
 * @desc If true: Disables dashing in the game will also remove the "Always Dash" game option.
 * @default false
 *
 * @param Remove Dash Option
 * @desc If true: Removes the "Always Dash" option from the game.
 * @default false
 *
 * @help
 *
 */

var Imported = Imported || {};
Imported.JK_ManageDashing = "1.0.0";

var JK_ManageDashing = {};
(function(){
    "use strict";
    var parameters = PluginManager.parameters('JK_ManageDashing');
    JK_ManageDashing.disableAutoDash = Boolean(parameters['Disable Auto-dash'] === 'true' || false);
    JK_ManageDashing.disableDashing = Boolean(parameters['Disable Dashing'] === ' true' || false);
    JK_ManageDashing.removeDashOption = Boolean(parameters['Remove Dash Option'] === 'true' || false);
    
    // Determine if Always Dash option is available
    JK_ManageDashing.showDashOption = function(){
        if(this.disableDashing || this.removeDashOption){
            return false;
        }
        else{
            return true;
        }
    }
    
    // Check for Dashing based on plugin parameters
    JK_ManageDashing.dashing = function(gamePlayer){
        if(this.disableDashing){
            return false;
        }
        if(this.disableAutoDash){
            return gamePlayer.isDashButtonPressed();
        }
        else{
            return(gamePlayer.isDashButtonPressed() || $gameTemp.isDestinationValid());
        }
    }
    
    // Check to see if Dash should be removed
    Window_Options.prototype.addGeneralOptions = function(){
        if(JK_ManageDashing.showDashOption()){
            this.addCommand(TextManager.alwaysDash, 'alwaysDash');
        }
        this.addCommand(TextManager.commandRemember, 'commandRemember');
    };
    
    // Alter game so that touch won't force auto dash
    Game_Player.prototype.updateDashing = function(){
        if(this.isMoving()){
            return;
        }
        if(this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled()){
            this._dashing = JK_ManageDashing.dashing(this);
        }
        else{
            this._dashing = false;
        }
    };
    
    // Check to see if Always Dash is an option
    Game_Player.prototype.isDashButtonPressed = function(){
        var shift = Input.isPressed('shift');
        
        // In the event the Dash option is removed
        if(ConfigManager.alwaysDash && JK_ManageDashing.showDashOption()){
            return !shift;
        }
        else{
            return shift;
        }
    };
})();
