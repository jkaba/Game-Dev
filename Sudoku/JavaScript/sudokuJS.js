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
	    /*
	    * setBoardCell
	    * Does not update UI
	    */
	    var setBoardCell = function(cellIndex, val){
		    var boardCell = board[cellIndex];
    
		    // Update val
		    boardCell.val = val;
	
		    if(val !== null)
			    boardCell.candidates = getNullCandidatesList();
	    };

	    /*
	    * indexInHouse
	    * Returns index (0-9) for digit in house, false if not
	    */
	    var indexInHouse = function(digit, house){
		    for(var i = 0; i < boardSize; i++){
			    if(board[house[i]].vak === digit)
				    return i;
		    }
		    return false;
	    };

	    /*
	    * housesWithCell
	    * Returns houses which a cell belongs to
	    */
	    var housesWithCell = function(cellIndex){
		    var boxSideSize = Math.sqrt(boardSize);
		    var houses = [];
    
		    // Horizontal row
		    var hrow = Math.floor(cellIndex/boardSize);
		    houses.push(hrow);
 
		    // Vertical row
		    var vrow = Math.floor(cellIndex % boardSize);
		    houses.push(vrow);
    		   
		    // Box
		    var box = (Math.floor(hrow/boxSideSize) * boxSideSize) + Math.floor(vrow/boxSideSize);
		    houses.push(box);
    
		    return houses;
	    };

	    /*
	    * numbersLeft
	    * Returns unused numbers in a house
	    */
	    var numbersLeft = function(house){
		    var numbers = boardNumbers.slice();
		    for(var i = 0; i < house.length; i++){
			    for(varj = 0; j < numbers.length; j++){
				    // Remove all numbers already in use
				    if(numbers[i] === board[house[i]].val)
					    numbers.splice(j,1);
			    }
		    }
		    // Return remaining numbers
		    return numbers;
	    };

	    /*
	    * numbersTaken
	    * Returns used numbers in a house
	    */
	    var numbersTaken = function(house){
		    var numbers = [];
		    for(var i = 0; i < house.length; i++){
			    var n = board[house[i]].val;
			    if(n !== null)
				    numbers.push(n)
		    }
		    // Return remaining numbers
		    return numbers;
	    };

	    /*
	    * candidatesLeft
	    * Returns list of candidates for cell (null's removed)
	    */
	    var candidatesLeft = function(cellIndex){
		    var t = [];
		    var candidates = board[cellIndex].candidates;
		    for(var i = 0; i < candidates.length; i++){
			    if(candidates[i] !== null)
				    t.push(candidates[i]);
		    }
		    return t;
	    };

	    /*
	    * cellsForCandidate
	    * Returns list of possible cells for candidate
	    */
	    var cellsForCandidate = function(candidate, house){
		    var t = [];
		    for(var i = 0; i < house.length; i++){
			    var cell = board[house[i]];
			    var candidates = cell.candidates;
			    if(contains(candidates, candidate))
				    t.push(house[i]);
		    }
		    return t;
	    };

	    /*
	    * openSingles
	    * Checks for houses with 1 empty cell = fills it in board variable if so
	    */
	    function openSingles(){
		    // For each type of house
		    var hlength = houses.length;
		    for(var i = 0; i < hlength; i++){
        
			    // For each house (up to 9 if finished)
			    var housesCompleted = 0;
			    for(var j = 0; j < boardSize; j++){
				    var emptyCells = [];
            
				    // For each empty cell
				    for(var k = 0; k < boardSize; k++){
					    var boardIndex = houses[i][j][k];
					    if(board[boardIndex].val === null){
						    emptyCells.push({house: houses[i][j], cell: boardIndex});
						    if(emptyCells.length > 1){
							    break;
						    }
					    }
				    }
				    // 1 Empty Cell
				    if(emptyCells.length === 1){
					    var emptyCell = emptyCells[0];
                
					    // Grab the number to fill in this spot
					    var val = numbersLeft(emptyCell.house);
					    if(val.length > 1){
						    boardError = true;
						    return -1;
					    }
					    setBoardCell(emptyCell.cell, val[0]);
					    if(solveMode === SOLVE_MODE_STEP)
						    uIBoardHighlightCandidate(emptyCell.cell, val[0]);
					    return [emptyCell.cell];
				    }
				    // No empty cells
				    if(emptyCells.length === 0){
					    housesCompleted++;
					    if(housesCompleted === boardSize){
						    boardFinished = true;
						    return -1;                    
					    }
				    }
			    }
		    }
		    return false;
	    }

	    /*
	    * visualEliminationOfCandidates
	    * Always returns false
	    * Special as it updatesthe whole board in one shot
	    */
	    function visualEliminationOfCandidates(){
		    // For each type of house
		    var hlength = houses.length;
		    for(var i = 0; i < hlength; i++){
       
			    // For each house
			    for(var j = 0; j < boardSize; j++){
				    var house = houses[i][j];
				    var candidatesToRemove = numbersTaken(house);
            
				    // For each cell
				    for(var k = 0; k < boardSize; k++){
					    var cell = house[k];
					    var candidates = board[cell].candidates;
					    removeCandidatesFromCell(cell, candidatesToRemove);
				    }
			    }
		    }
		    return false;
	    }

	    /*
	    * visualElimination
	    * Looks for houses where a digit only appears in one spot (we know which digit fits)
	    * Returns effectedCells / the updated cell / or false
	    */
	    function visualElimination(){
		    // For each type of house
		    var hlength = houses.length;
		    for(var i = 0; i < hlength; i++){
        
			    // For each house
			    for(var j = 0; j < boardSize; j++){
				    var house = houses[i][j];
				    var digits = numbersLeft(house);
            
				    // For each digit remaining in the house
				    for(var k = 0; k < digits.length; k++){
					    var digit = digits[k];
					    var possibleCells = [];
                
					    // For each cell in the house
					    for(var l = 0; l < boardSize; l++){
						    var cell = house[l];
						    var boardCell = board[cell];
                    
						    // If the digit only appears as a candidate in one slot, that's where it goes
						    if(contains(boardCell.candidates, digit)){
							    possibleCells.push(cell);
							    if(possibleCells.length > 1)
								    break;
						    }
					    }
					    if(possibleCells.length === 1){
						    var cellIndex = possibleCells[0];
						    setBoardCell(cellIndex, digit);
                   
						    if(solveMode === SOLVE_MODE_STEP)
							    uIBoardHighlightCandidate(cellIndex, digit);
						    onlyUpdatedCandidates = false;
						    return [cellIndex];
					    }
				    }
			    }
		    }
		    return false;
	    }

	    /*
	    * singleCandidate
	    * Looks for cells with only one candidate
	    */
	    function singleCandidate(){
		    // Before starting, we need to update candidates from last round
		    visualEliminationOfCandidates();
    
		    // For each cell
		    for(var i = 0; i < board.length; i++){
			    var cell = board[i];
			    var candidates = cell.candidates;
        
			    // For each candidate in that cell
			    var possibleCandidates = [];
			    for(var j = 0; j < candidates.length; j++){
				    if(candidates[j] !== null)
					    possibleCandidates.push(candidates[j]);
				    if(possibleCandidates.length > 1)
					    break;
			    }
			    if(possibleCandidates.length === 1){
				    var digit = possibleCandidates[0];
				    setBoardCell(i, digit);
				    if(solveMode === SOLVE_MODE_STEP)
					    uIBoardHighlightCandidate(i, digit);
				    onlyUpdatedCandidates = false;
				    return[i];
			    }
		    }
		    return false;
	    }

	    /*
	    * pointingElimination
	    * If candidates of a type in a box only appear on one row/box, all other same types can be removed
	    */
	    function pointingElimination(){
		    var effectedCells = false;
    
		    // For each type of house
		    var hlength = houses.length;
		    for(var a = 0; a < hlength; a++){
			    var houseType = a;
			    for(var i = 0; i < boardSize; i++){
				    var house = houses[houseType][i];
            
				    // For each digit left in this house
				    var digits = numbersLeft(house);
				    for(var j = 0; j < digits.length; j++){
					    var digit = digits[j];
                
					    // Check if digit only appears once
					    var sameAltHouse = true;
					    var houseId = -1;
                
					    // When checking from box, we need to compare both kinds of rows
					    var houseTwoId = -1;
					    var sameAltTwoHouse = true;
					    var cellsWithCandidate = [];
                
					    // For each cell
					    for(var k = 0; k < house.length; k++){
						    var cell = house[k];
                    
						    if(containts(board[cell].candidates, digit)){
							    var cellHouses = housesWithCell(cell);
							    var newHouseId = (houseType === 2) ? cellHouses[0] : cellHouses[2];
							    var newHouseTwoId = (houseType === 2) ? cellHouses[1] : cellHouses[2];

							    if(cellsWithCandidate.length > 0){
								    if(newHouseId !== houseId){
									    sameAltHouse = false
								    }
								    if(houseTwoId !== newHouseTwoId){
									    sameAltTwoHouse = false;
								    }
								    if(sameAltHouse === false && sameAltTwoHouse === false){
									    break;
								    }
							    }
							    houseId = newHouseId;
							    houseTwoId = newHouseTwoId;
							    cellsWithCandidate.push(cell);
						    }
					    }
					    if((sameAltHouse === true || sameAltTwoHouse === true) && cellsWithCandidate.length > 0){
						    // We need to make sure this actually eliminates something
						    // First what type of house are we talking about
						    var h = housesWithCell(cellsWithCandidate[0]);
						    var altHouseType = 2;
						    if(houseType === 2){
							    if(sameAltHouse)
								    altHouseType = 0;
							    else
								    altHouseType = 1;
						    }
						    var altHouse = houses[altHouseType][h[altHouseType]];
						    var cellsEffected = [];
                    
						    // Need to remove cells with candidates
						    for(var x = 0; x < altHouse.length; x++){
							    if(!contains(cellsWithCandidate, altHouse[x])){
								    cellsEffected.push(altHouse[x]);
							    }
						    }
						    // Remove all candidates on althouse
						    var cellsUpdated = removeCandidatesFromCells(cellsEffected, [digit]);
						    if(cellsUpdated.length > 0){
							    if(solveMode === SOLVE_MODE_STEP)
								    highLightCandidatesOnCells([digit], cellsWithCandidate);
							    onlyUpdatedCandidates = true;
							    return cellsUpdated;
						    }
					    }
				    }
			    }
		    }
		    return false;
	    }

	    /*
	    * nakedCandidates
	    * Looks for n number of cells in a house, which combines has n unique candidates
	    */
	    function nakedCandidates(n){
		    // For each type of house
		    var hlength = houses.length;
		    for(var i = 0; i < hlength; i++){
			    // For each such house
			    for(var j = 0; j < boardSize; j++){
				    var house = houses[i][j];
				    if(numbersLeft(house).length <= n)
					    // Can't remove any candidates
					    continue;
				    var combineInfo = [];
				    var minIndexes = [-1];
            
				    // Check every combo of candidates in house
				    var result = checkCombinedCandidates(house, 0);
				    if(result !== false)
					    return result;
			    }
		    }
		    return false;
    
		    function checkCombinedCandidates(house, startIndex){
			    for(var i = Math.max(startIndex, minIndexes[startIndex]); i < boardSize - n + startIndex; i++){
				    minIndexes[startIndex] = i+1;
				    minIndexes[startIndex+1] = i+1;
				    var cell = house[i];
				    var cellCandidates = candidatesLeft(cell);
				    if(cellCandidates.length === 0 || cellCandidates.length > n)
					    continue;
            
				    // Try to add this cell, but check to make sure that it doesn't interfere
				    if(combineInfo.length > 0){
					    var temp = cellCandidates.slice)();
					    for(var a = 0; a < combineInfo.length; a++){
						    var candidates = combineInfo[a].candidates;
						    for(var b = 0; b < candidates.length; b++){
							    if(!contains(temp, candidates[b]))
								    temp.push(candidates[b];
									      
						    }
					    }
					    if(temp.length > n){
						    continue;
					    }
				    }
				    combineInfo.push({cell: cell, candidates: cellCandidates});
				    if(startIndex < n - 1){
					    // Need to go deeper into the combo
					    var r = checkCombinedCandidates(house, startIndex + 1);
					    if(r !== false)
						    return r;
				    }
				    // Check to see if we matched our pattern
				    if(combineInfo.length === n){
					    // Check to see if any candidates get eliminated
					    var cellsWithCandidates = [];
					    var combinedCandidates = [];
					    for(var x = 0; x < combineInfo.length; x++){
						    cellsWithCandidates.push(combineInfo[x].cell);
						    combinedCandidates = combinedCandidates.concat(combineInfo[x].candidates);
					    }
					    // Get all cells in the house except the cells with candidates
					    var cellsEffected = [];
					    for(var y = 0; y < boardSize; y++){
						    if(!contains(cellsWithCandidates, house[y])){
							    cellsEffected.push(house[y]);
						    }
					    }
					    // Remove all candidates in house, except the cells matched in the pattern
					    var cellsUpdated = removeCandidatesFromCells(cellsEffected, combinedCandidates);
					    if(cellsUpdated.length > 0){
						    if(solveMode === SOLVE_MODE_STEP)
							    highLightCandidatesOnCells(combinedCandidates, cellsWithCandidates);
						    onlyUpdatedCandidates = true;
						    return uniqueArray(cellsUpdated);
					    }
				    }
			    }
			    if(startIndex > 0){
				    if(combineInfo.length > startIndex - 1){
					    combineInfo.pop();
				    }
			    }
			    return false;
		    }
	    }

	    /*
	    * nakedPair
	    * Returns effectedCells / updated cells / false
	    */
	    function nakedPair(){
		    return nakedCandidates(2);
	    }

	    /*
	    * nakedTriplet
	    * Returns effectedCells / updated cells / false
	    */
	    function nakedTriplet(){
		    return nakedCandidates(3);
	    }

	    /*
	    * nakedQuad
	    * Returns effectedCells / updated cells / false
	    */
	    function nakedQuad(){
		    return nakedCandidates(4);
	    }

	    /*
	    * hiddenLockedCandidates
	    * Looks for n number of cells in house which together has exactly n unique candidates
	    */
	    function hiddenLockedCandidates(n){
		    // For each type of house
		    var hlength = houses.length;
		    for(var i = 0; i < hlength; i++){
			    // For each house
			    for(var j = 0; j < boardSize; j++){
				    var house = houses[i][j];
				    if(numbersLeft(house).length <= n)
					    continue;
				    var combineInfo = [];
				    var minIndexes = [-1];
            
				    // Checks every combo of n candidates
				    var result = checkLockedCandidates(house, 0);
				    if(result !== false)
					    return result;
			    }
		    }
		    return false;
    
		    function checkLockedCandidates(house, startIndex){
			    for(var i = Math.max(startIndex, minIndexes[startIndex]); i <= boardSize - n + startIndex; i++){
				    minIndexes[startIndex] = i + 1;
				    minIndexes[startIndex + 1] = i + 1;
				    var candidates = i + 1;
				    var possibleCells = cellsForCandidate(candidate, house);
				    if(possibleCells.length === 0 || possibleCells.length > n)
					    continue;
            
				    // Try to add this candidate and it's cells
				    if(combineInfo.length > 0){
					    var temp = possibleCells.slice();
					    for(var a = 0; a < combineInfo.length; a++){
						    var cells = combineInfo[a].cells;
						    for(var b = 0; b < cells.length; b++){
							    if(!contains(temp, cells[b]))
								    temp.push(cells[b]);
						    }
					    }
					    if(temp.length > n){
						    continue;
					    }
				    }          
				    combineInfo.push({candidate: candidate, cells: possibleCells});
				    if(startIndex < n - 1){
					    var r = checkLockedCandidates(house, startIndex + 1);
					    if(r !== false)
						    return r;
				    }
				    // Check if we have matched our pattern
				    if(combineInfo.length === n){
					    var combinedCandidates = [];
					    var cellsWithCandidates = [];
					    for(var x = 0; x < combineInfo.length; x++){
						    combinedCandidates.push(combineInfo[x].candidate);
						    cellsWithCandidates = cellsWithCandidates.concat(combineInfo[x].cells);
					    }
					    var candidatesToRemove = [];
					    for(var c = 0; c < boardSize; c++){
						    if(!contains(combinedCandidates, c + 1))
							    candidatesToRemove.push(c + 1);
					    }
					    // Remove all other candidates
					    var cellsUpdated = removeCandidatesFromCells(cellsWithCandidates, candidatesToRemove);
					    if(cellsUpdated.length > 0){
						    if(solveMode === SOLVE_MODE_STEP)
							    highLightCandidatesOnCells(combinedCandidates, cellsWithCandidates);
						    onlyUpdatedCandidates = true;
						    return uniqueArray(cellsWithCandidates);
					    }
				    }
			    }      
			    if(startIndex > 0){
				    if(combineInfo.length > startIndex - 1){
					    combineInfo.pop();
				    }
			    }
			    return false;
		    }
	    }

	    /*
	    * hiddenPair
	    * Returns effected cells / updated cells / false
	    */
	    function hiddenPair(){
		    return hiddenLockedCandidates(2);
	    }

	    /*
	    * hiddenTriplet
	    * Returns effected cells / updated cells / false
	    */
	    function hiddenTriplet(){
		    return hiddenLockedCandidates(3);
	    }

	    /*
	    * hiddenQuad
	    * Returns effected cells / updated cells / false
	    */
	    function hiddenQuad(){
		    return hiddenLockedCandidates(4);
	    }

	    /*
	    * solveFn
	    * Applies strategy ordered by simplicity
	    */
	    var nrSolveLoops = 0;
	    var effectedCells = false;
	    var solveFn = function(i){
		    if(boardFinished){
			    if(!gradingMode){
				    updateUIBoard(false);
				    if(typeof opts.boardFinishedFn === "function"){
					    opts.boardFinishedFn({difficultyInfo: calcBoardDifficulty(usedStrategies)});
				    }
			    }
			    return false;
		    }
		    else if(solveMode === SOLVE_MODE_STEP){
			    if(effectedCells && effectedCells !== -1){
				    $boardInputs.removeClass("highlight-val");
				    $(".candidate--highlight").removeClass("candidate--highlight");
				    for(var j = 0; j < effectedCells.length; j++){
					    updateUIBoardCell(effectedCells[j]);
				    }
			    }
		    }
		    nrSolveLoops++;
		    var strat = strategied[i].fn;
		    effectedCells = strat();
		    if(effectedCells === false){
			    if(strategies.length > i + 1){
				    return solveFn(i + 1);
			    }
			    else{
				    if(typeof opts.boardErrorFn === "function" && !generatingMode)
					    opts.boardErrorFn({msg: "No more strategies"});
				    if(!gradingMode && !generatingMode && solveMode === SOLVE_MODE_ALL)
					    updateUIBoard(false);
				    return false;
			    }
		    }
		    else if(boardError){
			    if(typeof opts.boardErrorFn === "function")
				    opts.boardErrorFn({msg: "Board incorrect"});
			    if(solveMode === SOLVE_MODE_ALL){
				    updateUIBoard(false);
			    }
			    return false;
		    }
		    else if(solveMode === SOLVE_MODE_STEP){
			    if(typeof opts.boardUpdatedFn === "function"){
				    opts.boardUpdatedFn({cause: strategies[i].title, cellsUpdated: effectedCells});
			    }
			    if(isBoardFinished()){
				    boardFinished = true;
				    if(typeof opts.boardFinishedFn === "function"){
					    opts.boardFinishedFn({difficultyInfo: calcBoardDifficulty(usedStrategies)});
				    }
				    if(candidatesShowing)
					    updateUIBoard(false);
			    }
			    if(!candidatesShowing && !onlyUpdatedCandidates && effectedCells && effectedCells !== -1){
				    // Remove highlights from last step
				    $boardInputs.removeClass("highlight-val");
				    $(".candidate--highlight").removeClass("candidate--highlight");
				    for(var k = 0; k < effectedCells.length; k++){
					    updateUIBoardCell(effectedCells[k]);
				    }
			    }
		    }
		    if(typeof usedStrategies[i] === "undefined")
			    usedStrategies[i] = 0;
		    usedStrategies[i] = usedStrategies[i] + 1;
		    if(!gradingMode && !candidatesShowing && onlyUpdatedCandidates){
			    showCandidates();
			    if(typeof opts.candidateShowToggleFn === "function")
				    opts.candidateShowToggleFn(true);
		    }
		    return true;
	    };

	    /*
	    * keyboardMoveBoardFocus
	    * Puts focus on the adjacent board cell
	    */
	    var keyboardMoveBoardFocus = function(currentId, keyCode){
		    var newId = currentId;
    
		    // Right
		    if(keyCode === 39)
			    newId++;
    
		    //Left
		    else if(keyCode === 37)
			    newId--;
    
		    // Down
		    else if(keyCode === 40)
			    newId = newId + boardSize;
    
		    // Up
		    else if(keyCode === 38)
			    newId = newId - boardSize;
    
		    // Out of bounds
		    if(newId < 0 || newId > (boardSize * boardSize))
			    return;
    
		    // Focus input
		    $("#input-" + newId).focus();
	    };

	    /*
	    * toggleCandidateOnCell
	    * Used for editing candidates
	    */
	    var toggleCandidateOnCell = function(candidate, cell){
		    var boardCell = board[cell];
		    if(boardCell.val){
			    return;
		    }
		    var c = boardCell.candidates;
		    c[candidate - 1] = c[candidate - 1] === null ? candidate : null;
		    if(solveMode === SOLVE_MODE_STEP)
			    updateUIBoardCell(cell, {mode: "only-candidates"});
	    };

	    /*
	    * keyboardNumberInput
	    * Update our board model
	    */
	    var keyboardNumberInput = function(input, id){
		    var val = parseInt(input.val());
		    if(editingCandidates){
			    toggleCandidateOnCell(val, id);
			    input.val(board[id].val);
			    return;
		    }
		    var candidates = getNullCandidatesList();
		    if(val > 0){
			    // Check that this doesn't cause the board to be incorrect
			    var temp = housesWithCell(id);
        
			    // For each type of house
			    for(var i = 0; i < houses.length; i++){
				    if(indexInHouse(val, houses[i][temp[i]])){
					    var alreadyExistingCellInHouseWithDigit = houses[i][temp[i]][indexInHouse(val, houses[i][temp[i]])];
					    if(alreadyExistingCellInHouseWithDigit === id)
						    continue;
					    $("#input-" + alreadyExistingCellInHouseWithDigit + ", #input-" + id).addClass("board-cell--error");
					    return;
				    }
			    }
			    // Remove candidates
			    input.siblings(".candidates").html(buildCandidatesString(candidates));
			    board[id].candidates = candidates;
			    board[id].val = val;
        
			    if(isBoardFinished()){
				    boardFinished = true;
				    if(typeof opts.boardFinishedFn === "function"){
					    opts.boardFinishedFn({});
				    }
			    }
		    }
		    else{
			    boardError = false;
			    val = null;
			    candidates = boardNumbers.slice();
			    input.siblings(".candidates").html(buildCandidatesString(candidates));
			    board[id].val = val;
			    resetCandidates();
			    visualEliminationOfCandidates();
		    }
		    if($("#input-" + id).hasClass("board-cell--error"))
			    $boardInputs.removeClass("board-cell--error");
		    if(typeof opts.boardUpdatedFn === "function")
			    opts.boardUpdatedFn({cause: "User input", cellsUpdated: [id]});
		    onlyUpdatedCandidates = false;
	    };

	    /*
	    * toggleShowCandidates
	    */
	    var toggleShowCandidates = function(){
		    $board.toggleClass("showCandidates");
		    candidatesShowing = !candidatesShowing;
	    };
	    
	    /*
	    * analyzeBoard
	    * Solves a copy of the current board
	    */
	    var analyzeBoard = function(){
		    gradingMode = true;
		    solveMode = SOLVE_MODE_ALL;
		    var usedStrategiesClone = JSON.parse(JSON.stringify(usedStrategies));
		    var boardClone = JSON.parse(JSON.stringify(board));
		    var canContinue = true;
		    while(canContinue){
			    var startStrat = onlyUpdatedCandidates ? 2 : 0;
			    canContinue = solveFn(startStrat);
		    }
		    var data = {};
		    if(boardError){
			    data.error = "Board incorrect";
		    }
		    else{
			    data.finished = boardFinished;
			    data.usedStrategies = [];
			    for(var i = 0; i < usedStrategies.length; i++){
				    var strat = strategies[i];
				    if(typeof usedStrategies[i] !== "undefined"){
					    data.usedStrategies[i] = {title: strat.title, freq: usedStrategies[i]};
				    }
			    }
			    if(boardFinished){
				    var boardDiff = calcBoardDifficulty(usedStrategies);
				    data.level = boardDiff.level;
				    data.score = boardDiff.score;
			    }
		    }
		    // Restore everthing to state prior to solving
		    resetBoardVariables();
		    usedStrategies = usedStrategiesClone;
		    board = boardClone;
		    return data;
	    };

	    var setBoardCellWithRandomCandidate = function(cellIndex, forceUIUpdate){
		    visualEliminationOfCandidates();
		    var invalids = invalidCandidates && invalidCandidates[cellIndex];
		    var candidates = board[cellIndex].candidates.filter(function(candidate){
			    if(!candidate || (invalids && contains(invalids, candidate)))
				    return false;
			    return candidate;
		    });
		    // If cell has 0 candidates, fail to set
		    if(candidates.length === 0){
			    return false;
		    }
		    var randIndex = Math.round(Math.random() * (candidates.length - 1));
		    var randomCandidate = candidates[randIndex];
		    setBoardCell(cellIndex, randomCandidate);
		    return true;
	    };

	    var generateBoardAnswerRecursively = function(cellIndex){
		    if((cellIndex + 1) > (boardSize * boardSize)){
			    invalidCandidates = [];
			    return true;
		    }
		    if(setBoardCellWithRandomCandidate(cellIndex)){
			    generateBoardAnswerRecursively(cellIndex + 1);
		    }
		    else{
			    if(cellIndex <= 0)
				    return false;
			    var lastIndex = cellIndex - 1;
			    invalidCandidates[lastIndex] = invalidCandidates[lastIndex] || [];
			    invalidCandidates[lastIndex].push(board[lastIndex].val);
        
			    // Set val back to null
			    setBoardCell(lastIndex, null);
        
			    // Reset candidates in model
			    resetCandidates(false);
        
			    // Reset invalid candidates
			    invalidCandidates[cellIndex] = [];
        
			    // Try again
			    generateBoardAnswerRecursively(lastIndex);
			    return false;
		    }
	    };

	    var easyEnough = function(data){
		    if(data.level === DIFFICULTY_EASY)
			    return true;
		    if(data.level === DIFFICULTY_MEDIUM)
			    return difficulty !== DIFFICULTY_EASY;
		    if(data.level === DIFFICULTY_HARD)
			    return difficulty !== DIFFICULTY_EASY && difficulty !== DIFFICULTY_MEDIUM;
		    if(data.level === DIFFICULTY_VERY_HARD)
			    return difficulty !== DIFFICULTY_EASY && difficulty !== DIFFICULTY_MEDIUM && difficulty !== DIFFICULTY_HARD;
	    };

	    var hardEnough = function(data) {
		    if(difficulty === DIFFICULTY_EASY)
			    return true;
		    if(difficulty === DIFFICULTY_MEDIUM)
			    return data.level !== DIFFICULTY_EASY;
		    if(difficulty === DIFFICULTY_HARD)
			    return data.level !== DIFFICULTY_EASY && data.level !== DIFFICULTY_MEDIUM;
		    if(difficulty === DIFFICULTY_VERY_HARD)
			    return data.level !== DIFFICULTY_EASY && data.level !== DIFFICULTY_MEDIUM && data.level !== DIFFICULTY_HARD;
	    };

	    var digCells = function(){
		    var cells = [];
		    var given = boardSize * boardSize;
		    var minGiven = 17;
		    if(difficulty === DIFFICULTY_EASY){
			    minGiven = 40;
		    }
		    else if(difficulty == DIFFICULTY_MEDIUM){
			    minGiven = 30;
		    }
		    if(boardSize < 9){
			    minGiven = 4;
		    }
		    for(var i = 0; i < boardSize * boardSize; i++){
			    cells.push(i);
		    }
		    while(cells.length > 0 && given > minGiven){
			    var randIndex = Math.round(Math.random() * (cell.length - 1));
			    var cellIndex = cells.splice(randIndex, 1);
			    var val = board[cellIndex].val;
        
			    // Remove value from this cell
			    setBoardCell(cellIndex, null);
			    resetCandidates(false);
        
			    var data = analyzeBoard();
			    if(data.finished !== false && easyEnough(data)){
				    given--;
			    }
			    else{
				    setBoardCell(cellIndex,val);
			    }
		    }
	    };

	    /*
	    * generateBoard
	    * Generates board puzzle
	    */
	    var generateBoard = function(diff, callback){
		    if($boardInputs)
			    clearBoard();
		    if(contains(DIFFICULTIES, diff)){
			    difficulty = diff;
		    }
		    else if(boardSize >= 9){
			    difficulty = DIFFICULTY_MEDIUM;
		    }
		    else {
			    difficulty = DIFFICULTY_EASY;
		    }
		    generatingMode = true;
		    solveMode = SOLVE_MODE_ALL;
		    generateBoardAnswerRecursively(0);
    
		    // Attempt 1: Save answer, dig multiple times
		    var boardAnswer = board.slice();
		    var boardTooEasy = true;
		    while(boardTooEasy){
			    digCells();
			    var data = analyzeBoard();
			    if(hardEnough(data))
				    boardTooEasy = false;
			    else
				    board = boardAnswer;
		    }
		    solveMode = SOLVE_MODE_STEP;
		    if($boardInputs)
			    updateUIBoard();
		    visualEliminationOfCandidates();
		    if(typeof callback === 'function'){
			    callback();
		    }
	    };

	    /*
	    * init / API / events
	    */
	    if(!opts.board){
		    initBoard(opts);
		    generateBoard(opts);
		    renderBoard();
	    }
	    else{
		    board = opts.board;
		    initBoard();
		    renderBoard();
		    visualEliminationOfCandidates();
	    }

	    $boardInputs.on("keyup", function(e){var $this = $(this);
						 var id = parseInt($this.attr("id").replace("input-", ""));
    
						 // Allow keyboard movements
						 if(e.keyCode >= 37 && e.keyCode <= 40){
							 keyboardMoveBoardFocus(id, e.keyCode);
						 }
						});


	    // Listen on change, val incorrect at all times leading to filtering out other keys
	    $boardInputs.on("change", function(){
		    var $this = $(this);
		    var id = parseInt($this.attr("id").replace("input-", ""));
		    keyboardNumberInput($this, id);
	    });

	    /*
	    * Public methods
	    */
	    var solveAll = function(){
		    solveMode = SOLVE_MODE_ALL;
		    var canContinue = true;
		    while(canContinue){
			    var startStrat =  onlyUpdatedCandidates ? 2 : 0;
			    canContinue = solveFn(startStrat);
		    }
	    };

	    var solveStep = function(){
		    solveMode = SOLVE_MODE_STEP;
		    var startStrat = onlyUpdatedCandidates ? 2 : 0;
		    solveFn(startStrat);
	    };

	    var getBoard = function(){
		    return board;
	    };

	    var setBoard = function(newBoard){
		    clearBoard();
		    board = newBoard;
		    initBoard();
		    visualEliminationOfCandidates();
		    updateUIBoard(false);
	    };

	    var hideCandidates = function(){
		    $board.removeClass("showCandidates");
		    candidatesShowing = false;
	    };

	    var showCandidates = function(){
		    $board.addClass("showCandidates");
		    candidatesShowing = true;
	    };

	    var setEditingCandidates = function(newVal){
		    editingCandidates = newVal;
	    };


	    return{
		    solveAll : solveAll,
		    solveStep : solveStep,
		    analyzeBoard : analyzeBoard,
		    clearBoard : clearBoard,
		    getBoard : getBoard,
		    setBoard : setBoard,
		    hideCandidates : hideCandidates,
		    showCandidates : showCandidates,
		    setEditingCandidates : setEditingCandidates,
		    generateBoard : generateBoard
	    };
    };
})(window, jQuery);
