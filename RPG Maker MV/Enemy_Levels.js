//-----------------------------------------------------------------------------
//  Joker's Enemy Levels
//-----------------------------------------------------------------------------
//  For: RPGMAKER MV
//  Enemy_Levels.js
//-----------------------------------------------------------------------------

/*:
 * @author Jameel Kaba (Joker Games)
 * @plugindesc Allows enemies to have access to levels
 *
 * @param Name Format
 * @desc Format for the enemy name, %1 = name, %2 = level
 * @default %1 Lv %2
 * @help
 * Note-tag enemies with
 *
 *  <enemy level: FORMULA />
 *
 * Where the formula is any valid javascript formula that evaluates to a
 * number.
 *
 */

var Imported = Imported || {};
var JK = JK || {};
Imported.EnemyLevels = 1;
JK.EnemyLevels = JK.EnemyLevels || {};

(function($){
    $.Regex = /enemy[-_ ]level:\s*(.+?)\s*\/>/im
    $.params = PluginManager.parameters("Enemy_Levels");
    $.nameFormat = $.params["Name Format"]
    
    $.getEnemyLevel = function(enemy){
        if(enemy.levelFormula === undefined){
            enemy.levelFormula = "1"
            var res = $.Regex.exec(enemy.note);
            if(res){
                enemy.levelFormula = res[1];
            }
        }
        return $.evalEnemyLevel(enemy.levelFormula);
    };
    
    $.evalEnemyLevel = function(formula){
        var v = $gameVariables
        return eval(formula)
    };
    
    Object.defineProperty(Game_Enemy.prototype, 'level', {
        get: function(){
            return this._level;
        },
        configurable: true
    });
    
    var JK_EnemyLevels_GameEnemy_initMembers = Game_Enemy.prototype.initMembers;
    Game_Enemy.prototype.initMembers = function(){
        this._level = 0;
        JK_EnemyLevels_GameEnemy_initMembers.call(this);
    };
    
    var JK_EnemyLevels_GameEnemy_setup = Game_Enemy.prototype.setup;
    Game_Enemy.prototype.setup = function(enemyId, x, y){
        this._level = $.getEnemyLevel($dataEnemies[enemyId]);
        JK_EnemyLevels_GameEnemy_setup.call(this, enemyId, x, y);
    };
    
    Game_Enemy.prototype.level = function(){
        return this._level;
    };
    
    Game_Enemy.prototype.maxLevel = function(){
        return 99;
    };
    
    Game_Enemy.prototype.minLevel = function(){
        return 1;
    };
    
    Game_Enemy.prototype.setLevel = function(num){
        this._level = Math.min(Math.max(this.minLevel(), num), this.maxLevel());
    };

    Game_Enemy.prototype.addLevel = function(num){
        this._level = Math.min(Math.max(this.minLevel(), this._level + num), this.maxLevel());
    };
    
    var JK_GameEnemy_name = Game_Enemy.prototype.name;
    Game_Enemy.prototype.name = function(){
        var name = JK_GameEnemy_name.call(this);
        name = $.nameFormat.format(name, this._level);
        return name;
    };
    
    var JK_GameInterpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args){
        var cmd = command.toLowerCase();
        if(cmd === "set_enemy_level"){
            var id = Math.floor(args[1]) - 1
            var level = Math.floor(args[4]);
            $gameTroop.members()[id].setLevel(level);
        }
        else if (cmd === "add_enemy_level"){
            var level = Math.floor(args[0]);
            var id = Math.floor(args[4]) -  1
            $gameTroop.members()[id].addLevel(level);
        }
        else{
            JK_GameInterpreter_pluginCommand.call(this, command, args);
        }
    };
})(JK.EnemyLevels);
