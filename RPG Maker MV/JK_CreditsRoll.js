//-----------------------------------------------------------------------------
//  Joker's Roll Credits
//-----------------------------------------------------------------------------
//  For: RPGMAKER MV
//  JK_CreditsRoll.js
//-----------------------------------------------------------------------------

/*:
 * @author Jameel Kaba (Joker Games)
 * @plugindesc A plugin which calls a new scene to display text credits based on an external text file.
 *
 * @param Folder
 * @desc The folder which contains Credits.txt (Credits file).
 *
 * @param Skippable
 * @desc Boolean variable, if true allows cancel button to skip and close scene
 * @default false
 *
 * @param Title Credits Music
 * @desc The music that plays during the credits
 *
 * @help
 * ----------------------------------------------------------------------------
 * The plugin uses an external text file to control what is displayed. The text file will contain tags which will set how the text will be displayed
 *
 * REQUIRED TAGS:
 * Text must be placed inside the following tag and you can have multiple of
 * these tages in the same .txt file to make each block of text display in
 * a different way.
 *
 *     <block:time,scroll,fadeIn,fadeOut,ypos,align,image>
 *     your text here
 *     </block>
 *
 * time    = The amount of time that the text within the tag is displayed before the next tag.
 * scroll  = How fast the text scrolls. (-) for up, (+) positive for down
 * fadeIn  = How fast the tag text fades in (255 = instant appear)
 * fadeOut = How fast the tag text fades out (255 = instant disappear)
 * ypos    = The starting y position of the block of text on screen.
 * align   = Left/Center/Right
 * ----------------------------------------------------------------------------
 *  SCRIPT CALL
 * ----------------------------------------------------------------------------
 * 
 *    Joker.CRED.start("filename");    // filename of .txt file located in the
 *                                    // folder you chose in the settings
 *                                    // if no filename specified or if run
 *                                    // directly using SceneManager.push,
 *                                    // then it will use "Credits.txt"
 *
 * ----------------------------------------------------------------------------
 */

// Code Start

var Imported = Imported || {};
Imported.JK_CreditsRoll = true;

var Joker = Joker ||{};
Joker.CRED = Joker.CRED || {};


(function(){
    Joker.CRED.skippable = PluginManager.parameters('JK_CreditsRoll')["Skippable"].toLowerCase() == 'true' ? true : false;
    Joker.CRED.bgm = {name:PluginManager.parameters('JK_CreditsRoll')["Title Credits Music"], pan:0, pitch:100, volume:90};

// Get the text file
    Joker.CRED.file = {};
    Joker.CRED.file.getString = function(filePath){
        var request = new XMLHttpRequest();
        request.open("GET", filePath);
        request.overrideMimeType('application/json');
        request.onload = function(){
            if(request.status < 400){
                Joker.CRED.createCreds(request.responseText);
            }
        };
        request.send();
    };
    
    Joker.CRED.createCreds = function(string){
        var lines = string.split("\n");
        var bIndex = 0;
        var record = false;
        Joker.CRED.txtArray = [];
        
        for(var i = 0; i < lines.length; i++){
            if(lines[i].contains('</block>')){
                record = false;
                bIndex += 1;
            }
            else if(lines[i].contains('<block:')){
                Joker.CRED.txtArray[bIndex] = [];
                record = true;
            };
            if(record){
                Joker.CRED.txtArray[bIndex].push(lines[i]);
            };
        };
    };
    
    Joker.CRED.start = function(filename){
        Joker.CRED.tempFilename = filename;
        Joker.CRED.filename();
        SceneManager.push(Scene_Credits);
    };
    
    Joker.CRED.filename = function(){
        var filename = Joker.CRED.tempFilename || "Credits";
        var folder = PluginManager.parameters('JK_CreditsRoll')["Folder"];
        if(folder !== ""){
            folder = folder + "/";
        };
        JK.CRED.file.getString(folder + filename +  ".txt");
    };
})();

// Window Credits

function Window_Credits(){
    this.initialize.apply(this, arguments);
}

Window_Credits.prototype = Object.create(Window_Base.prototype);
Window_Credits.prototype.constructor = Window_Credits;

Window_Credits.prototype.initialize = function(blockId) {
    var width = Graphics.boxWidth;
    var height = Graphics.boxHeight;
    Window_Base.prototype.initialize.call(this, 0, 0, width, height);
    this._id = blockId;
    this.createVars();
    this.refresh();
};

Window_Credits.prototype.txt = function(){
    return Joker.CRED.txtArray[this._id];
};

Window_Credits.prototype.createVars = function(){
    this._textArray = this.txt();
    this._complete = false;
    this.opacity = 0;
    this.contentsOpacity = 0;

    // settings
    var txt = this.txt() || ' ';
    var a = txt[0].toLowerCase().match(/<block:(.*)>/i);
    a = a[1].split(",");
    if (!a) return;
    this._timer = Number(a[0]);
    this._scroll = Number(a[1]) * 0.5;
    this._fadeIn = Number(a[2]);
    this._fadeOut = Number(a[3]);
    var isNumber = Number(a[4]);
    if (isNumber){
        this.y = Number(a[4]);
        this._ypos = "";
    }
    else{
        this._ypos = a[4] || "";
    };
    this._align = a[5] || "left";
};

Window_Credits.prototype.update = function(){
    Window_Base.prototype.update.call(this);
    this.opacity = 0;
    
    // If Timer Active
    if(this._timer > 0){
        this.contentsOpacity += this._fadeIn;
        this._timer -= 1;
    }
    
    // Timer Ends
    else{
        this.contentsOpacity -= this._fadeOut;
        if(this.contentsOpacity <= 0){
            this._complete = true;
        };
    };
    this.y += this._scroll;
};

Window_Credits.prototype.refresh = function(){
    this._allTextHeight = 1;
    
    // Draw all lines
    for(var i = 1; i < this._textArray.length; i++){
        var textState = { index: 0 };
        textState.text = this.convertEscapeCharacters(this._textArray[i]);
        this.resetFontSettings();
        this._allTextHeight += this.calcTextHeight(textState, false);
    };
    
    // Window height
    this.height = this.contentsHeight() + this.standardPadding() * 2;
    this.createContents();
    
    if(this._ypos.contains('offbot')){
        this.y = Graphics.height;
    }
    else if(this._ypos.contains('offtop')){
        this.y = -height;
    };
    
    // Set auto timer if -1
    if(this._timer < 0){
        if(this._scroll == 0) {
            
            // Set the timer based on the amount of text
            this._timer = 2 * this._allTextHeight;
        }
        else if(this._scroll < 0){
            
            // Calculate how many frames it will take for the text to leave the screen
            var distance = Math.abs(this.y) + this.height;
            this._timer = distance / Math.abs(this._scroll);
        }
        else if(this._scroll > 0){
        };
    };
    
    // Draw lines
    var cy = 0;
    for(var i = 1; i < this._textArray.length; i++){
        var textState = {index:0,text:this._textArray[i]};
        var x = this.textPadding();
        var w = this.testWidthEx(textState.text);
        var h = this.cTextHeight;

        if(this._align == 'center'){
            x = this.contents.width / 2 - w / 2;
        }
        else if (this._align == 'right'){
            x = this.contents.width - this.textPadding() - w;
        };
        this.drawTextEx(textState.text, x, cy);
        cy += h;
    };
    
    this._allTextHeight = cy;
    this.height = cy + this.standardPadding() * 2;
};

Window_Credits.prototype.testWidthEx = function(text){
    return this.drawTextExTest(text, 0, this.contents.height);
};

Window_Credits.prototype.drawTextExTest = function(text, x, y){
    this.testActive = false;
    if(text){
        this.resetFontSettings();
        this.testActive = true;
        var textState = { index: 0, x: x, y: y, left: x };
        textState.text = this.convertEscapeCharacters(text);
        textState.height = this.calcTextHeight(textState, false);
        this.cTextHeight = textState.height;
        while(textState.index < textState.text.length){
            this.processCharacter(textState);
        }
        this.testActive = false;
        return textState.x - x;
    }
    else{
        return 0;
    }
};


Window_Credits.prototype.contentsHeight = function(){
    return Math.max(this._allTextHeight, 1);
};

// Scene Credits
function Scene_Credits(){
    this.initialize.apply(this, arguments);
}

Scene_Credits.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Credits.prototype.constructor = Scene_Credits;

Scene_Credits.prototype.initialize = function(){
    this._blockId = 0;
    this._txtLoaded = false;
    this._bgs = [];
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_Credits.prototype.create = function(){
    Scene_Base.prototype.create.call(this);
    this.createBackground();
};

Scene_Credits.prototype.isReady = function(){
    if(Scene_Base.prototype.isReady.call(this)){
        return Joker.CRED.txtArray;
    }
    else{
        return false;
    }
};

Scene_Credits.prototype.update = function(){
    Scene_Base.prototype.update.call(this);
    this.updateInput();
    this.updateBlocks();
};

Scene_Credits.prototype.updateInput = function(){
    if (Input.isTriggered('cancel') && Joker.CRED.skippable){
        this.endScene();
    }
    else if((TouchInput.isPressed() || Input.isTriggered('ok')) && Joker.CRED.bSkip){
        if(this._blocks && this._blocks[this._blockId]){
            this._blocks[this._blockId]._timer = 0;
        }
    };
};

Scene_Credits.prototype.updateBlocks = function(){

    if(!this._txtLoaded){
        
        // wait for load
        if(Joker.CRED.txtArray){
            this._txtLoaded = true;
            this._blocks = [];
            this.createBlock();
        }
    }
    else{
        
        // If current block timer is up, create next block
        if(!Joker.CRED.txtArray[this._blockId]){
            this.endScene();
            return;
        }
    
        if(this._blocks[this._blockId]._complete){
            
            // If block is finished, remove window and continue to next
            this.removeChild(this._blocks[this._blockId]);
            this._blockId += 1;
            if(Joker.CRED.txtArray[this._blockId]){
                this.createBlock();
            }
        }
    }
};

Scene_Credits.prototype.createBlock = function(){
    if(Joker.CRED.txtArray[this._blockId]){
        var arr = Joker.CRED.txtArray[this._blockId][0].match(/<block:(.*)>/i);
        arr = arr[1].split(",");
        if(arr[6]){
            var id = this._bgs.length;
            this._bgs[id] = new Sprite_CredBg(arr[6],this._blockId);
            this.addChild(this._bgs[id]);
        };
    };
    
    this._blocks[this._blockId] = new Window_Credits(this._blockId);
    this.addChild(this._blocks[this._blockId]);
};


Scene_Credits.prototype.endScene = function(){
    Joker.CRED.tempFilename = null;
    SceneManager.pop();
};



// Sprite CredBg

function Sprite_CredBg(){
    this.initialize.apply(this, arguments);
}

Sprite_CredBg.prototype = Object.create(Sprite.prototype);
Sprite_CredBg.prototype.constructor = Sprite_CredBg;

Sprite_CredBg.prototype.initialize = function(image,id){
    Sprite.prototype.initialize.call(this);
    this._id = id;
    this.createBitmap(image);
    this.update();
};

Sprite_CredBg.prototype.createBitmap = function(image){
    this.bitmap = ImageManager.loadTitle1(image);
    this.opacity = 0;
};

Sprite_CredBg.prototype.update = function(){
    Sprite.prototype.update.call(this);
    this.opacity += 5;
};
