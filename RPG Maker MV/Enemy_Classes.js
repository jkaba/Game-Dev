//-----------------------------------------------------------------------------
//  Joker's Enemy Classes
//-----------------------------------------------------------------------------
//  For: RPGMAKER MV
//  Enemy_Classes.js
//-----------------------------------------------------------------------------

/*:
 * @author Jameel Kaba (Joker Games)
 * @plugindesc Allows enemies to have access to classes
 * @help
 * To assign a class to an enemy, use the note-tag
 *
 * <enemy class: CLASS_ID />
 *
 * Where the CLASS_ID is the ID of the class you want to set.
 *
 */

var Imported = Imported || {};
var JK = JK || {};

Imported.EnemyClasses = 1;
JK.EnemyClasses = JK.EnemyClasses || {};

(function ($){
    
    $.Regex = /<enemy[-_ ]class:\s*(.+?)\s*\/>/im
    
    $.getEnemyClass = function(enemy){
        if(enemy.classId !== undefined){
            return enemy.classId;
        }
        enemy.classId = 0;
        var res = $.Regex.exec(enemy.note);
        if(res){
            enemy.classId = Math.floor(res[1]);
        }
        return enemy.classId;
    };
    
    var JK_EnemyClass_GameEnemy_initMembers = Game_Enemy.prototype.initMembers;
    Game_Enemy.prototype.initMembers = function(){
        this._level = 1;
        this._classId = 0;
        JK_EnemyClass_GameEnemy_initMembers.call(this)
    };
    
    var JK_EnemyClass_GameEnemy_setup = Game_Enemy.prototype.setup;
    Game_Enemy.prototype.setup = function(enemyId, x, y){
        this._classId = $.getEnemyClass($dataEnemies[enemyId]);
        JK_EnemyClass_GameEnemy_setup.call(this, enemyId, x, y);
    }
    
    Game_Enemy.prototype.currentClass = function(){
        return $dataClasses[this._classId];
    };
    
    var JK_EnemyClass_GameEnemy_paramBase = Game_Enemy.prototype.paramBase;
    Game_Enemy.prototype.paramBase = function(paramId){
        if(this._classId === 0){
            return JK_EnemyClass_GameEnemy_paramBase.call(this, paramId);
        }
        else{
            return this.currentClass().params[paramId][this._level];
        }
    };
    
    Game_Enemy.prototype.changeClass = function(classId, keepExp){
        this._classId = classId;
        this.refresh();
    };
    
    var JK_GameEnemy_traitObjects = Game_Enemy.prototype.traitObjects;
    Game_Enemy.prototype.traitObjects = function(){
        var traits = JK_GameEnemy_traitObjects.call(this);
        if(this._classId > 0){
            traits = traits.concat(this.currentClass());
        }
        return traits;
    };
    
    var JK_GameInterpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args){
        var cmd = command.toLowerCase();
        if(cmd === "change_enemy_class"){
            var id = Math.floor(args[1]) - 1
            var classId = Math.floor(args[4]);
            var keepExp = true;
            $gameTroop.members()[id].changeClass(classId, keepExp);
        }
        else{
            JK_GameInterpreter_pluginCommand.call(this, command, args);
        }
    };
})(JK.EnemyClasses);
