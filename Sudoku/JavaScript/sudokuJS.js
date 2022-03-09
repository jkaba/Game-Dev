// Sudoku Java Script
// Author: Jameel Kaba

(function (window, $, undefined){
    'use strict';
    
    $.fn.sudokuJS = function(opts) {
        /*
         * Constants
         */
        var DIFFICULTY_EASY = 'easy';
        var DIFFICULTY_MEDIUM = 'medium';
        var DIFFICULTY_HARD = 'hard';
        var DIFFICULTY_VERY_HARD = 'very hard';
        
        var SOLVE_MODE_STEP = 'step';
        var SOLVE_MODE_ALL = 'all';
        
        var DIFFICULTIES = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD, DIFFICULTY_VERY_HARD];
        
        /*
         * Variables
         */
        opts = opts || {};
        var solveMode = SOLVE_MODE_STEP, difficulty = "unknown", candidatesShowing = false, editingCandidates = false, boardFinished = false, boardError = false, onlyUpdatedCandidates = false, gradingMode = false, generatingMode = false, invalidCandidates[],
    
		/*
         * Score reflects how much harder the board gets by having the pattern rather than an already solved cell
		 */
        strategies = [
        {title: "openSingles", fn:	openSingles, score : 0.1	},
        
        // Harder for a human to spot
        {title: "singleCandidate", fn:	singleCandidate, score : 9	},
        {title: "visualElimination", fn:	visualElimination, score : 8	},
                      
        // Only eliminates one candidate
        {title: "nakedPair", fn:	nakedPair, score : 50	},
        {title: "pointingElimination", fn:	pointingElimination, score : 80	},
                      
        // Harder for a human to spot
        {title: "hiddenPair", fn:	hiddenPair, score :	90	},
        {title: "nakedTriplet", fn:	nakedTriplet, score :	100 },
                     
        // Never gets used unless above strats are turned off
        {title: "hiddenTriplet", fn:	hiddenTriplet, score :	140	},
        {title: "nakedQuad", fn:	nakedQuad, score :	150 },
        {title: "hiddenQuad", fn:	hiddenQuad, score :	280	}
                      ],
        
        // number of times each strategy has been used for solving this board
        usedStrategies = [],
        
        board = [],
        boardSize,
        boardNumbers,
        
        // Indexes of cells in each house
        houses = [[],[],[]];
       
        /*
         * Selectors
         */
        var $board = $(this), $boardInputs, $boardInputCandidates;
		
        /*
         * Methods
         */
        function log(msg){
            if(window.console && console.log)
                console.log(msg);
        }
        
        // Array contains function
        var contains = function(a, obj){
            for(var i = 0; i < a.length; i++){
                if(a[i] === obj){
                    return true;
                }
            }
            return false;
        };

        var uniqueArray = function(a){
            var temp = {};
            for(var i = 0; i < a.length; i++)
                temp[a[i]] = true;
            var r = [];
            for(var k in temp)
                r.push(k);
            return r;
        };

        /*
         * calcBoardDifficulty
         * TYPE: based on strategies required to solve board
         * SCORE: distinguish between boards of similar difficulty
         */
        var calcBoardDifficulty = function(usedStrategies){
            var boardDiff = {};
            if(usedStrategies.length < 3)
                boardDiff.level = DIFFICULTY_EASY;
            else if(usedStrategies.length < 4)
                boardDiff.level = DIFFICULTY_MEDIUM;
            else
                boardDiff.level = DIFFICULTY_HARD;
            
            var totalScore = 0;
            for(var i = 0; i < strategies.length; i++){
                var freq = usedStrategies[i];
                if(!freq)
                    continue;
                var stratObj = strategies[i];
                totalScore += freq * stratObj.score;
            }
            boardDiff.score = totalScore;
            if(totalScore > 750)
                boardDiff.level = DIFFICULTY_VERY_HARD;
            return boardDiff;
        };

        /*
         * isBoardFinished
         */
        var isBoardFinished = function(){
            for(var i = 0; i < boardSize * boardSize; i++){
                if(board[i].val === null)
                    return false;
            }
            return true;
        };
        
        /*
         * generateHouseIndexList
         */
        var generateHouseIndexList = function(){
            houses = [[],[],[]]
            var boxSideSize = Math.sqrt(boardSize);
            
            for(var i = 0; i < boardSize; i++){
                var hrow = [];
                var vrow = [];
                var box = [];
                for(var j = 0; j < boardSize; j++){
                    hrow.push(boardSize * i + j);
                    vrow.push(boardSize * j + i);
                    
                    if(j < boxSideSize){
                        for(var k = 0; k < boxSideSize; k++){
                            var a = Math.floor(i / boxSideSize) * boardSize * boxSideSize;
                            var b = (i % boxSideSize) * boxSideSize;
                            var boxSideSize = a + b;
                            box.push(boxSideIndex + boardSize * j + k);
                        }
                    }
                }
                houses[0].push(hrow);
                houses[1].push(vrow);
                houses[2].push(box);
            }
        };

        /*
         * initBoard
         */
		var initBoard = function(opts){
			var alreadyEnhanced = (board[0] !== null && typeof board[0] === "object");
			var nullCandidateList = [];
            boardNumbers = [];
			boardSize = (!board.length && opts.boardSize) || Math.sqrt(board.length) || 9;
			$board.attr("data-board-size", boardSize);
			if(boardSize % 1 !== 0 || Math.sqrt(boardSize) % 1 !== 0) {
				log("invalid boardSize: "+boardSize);
				if(typeof opts.boardErrorFn === "function")
					opts.boardErrorFn({msg: "invalid board size"});
				return;
			}
			for (var i=0; i < boardSize; i++){
				boardNumbers.push(i+1);
				nullCandidateList.push(null);
			}
			generateHouseIndexList();

			if(!alreadyEnhanced){
				for(var j=0; j < boardSize*boardSize ; j++){
					var cellVal = (typeof board[j] === "undefined") ? null : board[j];
					var candidates = cellVal === null ? boardNumbers.slice() : nullCandidateList.slice();
					board[j] = {
						val: cellVal,
						candidates: candidates
					};
				}
			}
		};

        /*
         * renderBoard
         * Dynamically renders the board on the screen
         */
		var renderBoard = function(){
			var htmlString = "";
			for(var i=0; i < boardSize*boardSize; i++){
				htmlString += renderBoardCell(board[i], i);

				if((i+1) % boardSize === 0) {
					htmlString += "<br>";
				}
			}
			$board.append(htmlString);

			//save important board elements
			$boardInputs = $board.find("input");
			$boardInputCandidates = $board.find(".candidates");
		};

        /*
         * renderBoardCell
         */
		var renderBoardCell = function(boardCell, id){
			var val = (boardCell.val === null) ? "" : boardCell.val;
			var candidates = boardCell.candidates || [];
			var candidatesString = buildCandidatesString(candidates);
			var maxlength = (boardSize < 10) ? " maxlength='1'" : "";
			return "<div class='sudoku-board-cell'>" +
						"<input type='text' pattern='\\d*' novalidate id='input-"+id+"' value='"+val+"'"+maxlength+">" +
						"<div id='input-"+id+"-candidates' class='candidates'>" + candidatesString + "</div>" +
					"</div>";
		};


        /*
         * buildCandidatesString
         */
		var buildCandidatesString = function(candidatesList){
			var s="";
			for(var i=1; i<boardSize+1; i++){
				if(contains(candidatesList,i))
					s+= "<div>"+i+"</div> ";
				else
					s+= "<div>&nbsp;</div> ";
			}
			return s;
		};

        /*
         * updateUIBoard
         */
		 var updateUIBoard = function(paintNew){
			$boardInputs
				.removeClass("highlight-val")
				.each(function(i,v){
					var $input = $(this);
					var newVal = board[i].val;
                    $input.val(newVal);
                    if(paintNew)
                        $input.addClass("highlight-val");
					var $candidates = $input.siblings(".candidates");
					$candidates.html(buildCandidatesString(board[i].candidates));
				});
		};

        /*
         * updateUIBoardCell
         * Updates one cell on the board with current value
         */
		 var updateUIBoardCell = function(cellIndex, opts){
			opts = opts || {};
            var newVal = board[cellIndex].val;
            $("#input-"+cellIndex)
                .val(newVal)
                .addClass("highlight-val");
			$("#input-"+cellIndex+"-candidates")
				.html(buildCandidatesString(board[cellIndex].candidates));
		};

        /*
         * uIBoardHighlightRemoveCandidate
         * Highlight candidate in cell which is to be removed
         */
		var uIBoardHighlightRemoveCandidate = function(cellIndex, digit){
			$("#input-"+cellIndex+"-candidates div:nth-of-type("+digit+")").addClass("candidate--to-remove");
		};

        /*
         * uIBoardHighlightCandidate
         * Highlight candidate in cell to eliminate other candidates
         */
		var uIBoardHighlightCandidate = function(cellIndex, digit){
			$("#input-"+cellIndex+"-candidates div:nth-of-type("+digit+")").addClass("candidate--highlight");
		};

        /*
         * removeCandidatesFromCell
         */
		var removeCandidatesFromCell = function(cell, candidates){
			var boardCell = board[cell];
			var c = boardCell.candidates;
			var cellUpdated = false;
			for(var i=0; i < candidates.length; i++){
				if(c[candidates[i]-1] !== null) {
					c[candidates[i]-1] = null;
					cellUpdated = true;
				}
			}
			if(cellUpdated && solveMode === SOLVE_MODE_STEP)
				updateUIBoardCell(cell, {mode: "only-candidates"});
		};

        /*
         * removeCandidatesFromCells
         * Returns list of cells where any candidates are removed
         */
		var removeCandidatesFromCells = function(cells, candidates){
			var cellsUpdated = [];
			for (var i=0; i < cells.length; i++){
				var c = board[cells[i]].candidates;
				for(var j=0; j < candidates.length; j++){
					var candidate = candidates[j];
					if(c[candidate-1] !== null) {
						c[candidate-1] = null;
						cellsUpdated.push(cells[i]);
						if(solveMode===SOLVE_MODE_STEP){
							//highlight candidate as to be removed on board
							uIBoardHighlightRemoveCandidate(cells[i],candidate);
						}
					}
				}
			}
			return cellsUpdated;
		};

		var highLightCandidatesOnCells = function(candidates, cells){
			for(var i=0; i < cells.length; i++){
				var cellCandidates = board[cells[i]].candidates;
				for(var j=0; j < cellCandidates.length; j++){
					if(contains(candidates, cellCandidates[j]))
						uIBoardHighlightCandidate(cells[i],cellCandidates[j]);
				}
			}
		};
                                               
		var resetBoardVariables = function() {
			boardFinished = false;
			boardError = false;
			onlyUpdatedCandidates = false;
			usedStrategies = [];
			gradingMode = false;
		};

        /*
         * clearBoard
         */
		var clearBoard = function(){
			resetBoardVariables();

			//reset board variable
			var cands = boardNumbers.slice(0);
			for(var i=0; i <boardSize*boardSize;i++){
				board[i] = {
					val: null,
					candidates: cands.slice()
				};
			}

			//reset UI
			$boardInputs
				.removeClass("highlight-val")
				.val("");
			updateUIBoard(false);
		};

		var getNullCandidatesList = function() {
			var l = [];
			for (var i=0; i < boardSize; i++){
				l.push(null);
			}
			return l;
		};

        /*
         * resetCandidates
         */
		var resetCandidates = function(updateUI){
			var resetCandidatesList = boardNumbers.slice(0);
			for(var i=0; i <boardSize*boardSize;i++){
				if(board[i].val === null){
					board[i].candidates = resetCandidatesList.slice();
					if(updateUI !== false)
						$("#input-"+i+"-candidates").html(buildCandidatesString(resetCandidatesList));
				} else if(updateUI !== false) {
						$("#input-"+i+"-candidates").html("");
				}
			}
		};
