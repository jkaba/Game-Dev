// Sudoku CPP generator
// Author: Jameel Kaba

#include <iostream>
#include <algorithm>
#include <ctime>
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

#define UNASSIGNED 0

using namespace std;

class Sudoku{
private:
    int grid[9][9];
    int solnGrid[9][9];
    int guessNum[9];
    int gridPos[81];
    int difficultyLevel;
    bool grid_status;
    
public:
    Sudoku();
    Sudoku(string, bool row_major = true);
    void fillEmptyDiagonalBox(int);
    void createSeed();
    void printGrid();
    bool solveGrid();
    string getGrid();
    void countSoln(int &number);
    void genPuzzle();
    bool verifyGridStatus();
    void printSVG(string);
    void calculateDifficulty();
    int branchDifficultyScore();
};

// getGrid
// Get grid as a string in row major order
string Sudoku::getGrid(){
    string s = "";
    for(int row_num = 0; row_num < 9; ++row_num){
        for(int col_num = 0; col_num < 9; ++col_num){
            s = s + to_string(grid[row_num][col_num]);
        }
    }
    return s;
}

// getRandNum
// Generate a random number
int genRandNum(int maxLimit){
    return rand() % maxLimit;
}

// Helper functions for solving grid
bool FindUnassignedLocation(int grid[9][9], int &row, int &col){
    for(row = 0; row < 9; row++){
        for(col = 0; col < 9; col++){
            if(grid[row][col] == UNASSIGNED)
                return true;
        }
    }
    return false;
}

bool UsedInRow(int grid[9][9], int row, int num){
    for(int col = 0; col < 9; col++){
        if(grid[row][col] == num)
            return true;
    }
    return false;
}

bool UsedInCol(int grid[9][9], int col, int num){
    for(int row = 0; row < 9; row++){
        if(grid[row][col] == num)
            return true;
    }
    return false;
}

bool UsedInBox(int grid[9][9], int boxStartRow, int boxStartCol, int num){
    for(int row = 0; row < 3; row++){
        for(int col = 0; col < 3; col++){
            if(grid[row + boxStartRow][col + boxStartCol] == num)
                return true;
        }
    }
    return false;
}

bool isSafe(int grid[9][9], int row, int col, int num){
    return !UsedInRow(grid, row, num) && !UsedInCol(grid, col, num) && !UsedInBox(grid, row - row % 3, col - col % 3, num);
}

// Methods to create seed grid
void Sudoku::fillEmptyDiagonalBox(int idx){
    int start = idx * 3;
    random_shuffle(this -> guessNum, (this -> guessNum) + 9, genRandNum);
    for(int i = 0; i < 3; ++i){
        for(int j = 0; j < 3; ++j){
            this -> grid[start + i][start + j] = guessNum[i * 3 + j];
        }
    }
}

void Sudoku::createSeed(){
    /*
       Fill diagonal boxes
       X|.|.
       .|X|.
       .|.|X
     */
    this -> fillEmptyDiagonalBox(0);
    this -> fillEmptyDiagonalBox(1);
    this -> fillEmptyDiagonalBox(2);
    
    /*
       Fill remaining blocks
       X|X|X
       X|X|X
       X|X|X
     */
    this -> solveGrid();
    
    // Saving the solution grid
    for(int i = 0; i < 9; i++){
        for(int j = 0; j < 9; j++){
            this -> solnGrid[i][j] = this -> grid[i][j];
        }
    }
}

// Initializing
Sudoku::Sudoku(){
    
    // Initialize difficulty level
    this -> difficultyLevel = 0;
    
    // Randomly shuffle the array of removing grid positions
    for(int i = 0; i < 81; i++){
        this -> gridPos[i] = i;
    }
    
    random_shuffle(this -> gridPos, (this -> gridPos) + 81, genRandNum);
    
    // Randomly shuffling the guessing number array
    for(int i = 0; i < 9; i++){
        this -> guessNum[i] = i + 1;
    }
    
    random_shuffle(this -> guessNum, (this -> guessNum) + 9, genRandNum);
    
    // Initialize the grid
    for(int i = 0; i < 9; i++){
        for(int j = 0; j < 9; j++){
            this -> grid[i][j] = 0;
        }
    }
    grid_status = true;
}

// Custom initializing with grid passed as argument
Sudoku::Sudoku(string grid_str, bool row_major){
    if(grid_str.length() != 81){
        grid_status = false;
        return;
    }
    
    // First pass: Check if all cells are valid
    for(int i = 0; i < 81; ++i){
        int curr_num = grid_str[i] - '0';
        if(!((curr_num == UNASSIGNED) || (curr_num > 0 && curr_num < 10))){
            grid_status = false;
            return;
        }
        if(row_major) grid[i / 9][i % 9] = curr_num;
        else          grid[i % 9][i / 9] = curr_num;
    }
    
    // Second pass: Check if all columns are valid
    for(int col_num = 0; col_num < 9; ++col_num){
        bool nums[10] = {false};
        for(int row_num = 0; row_num < 9; ++row_num){
            int curr_num = grid[row_num][col_num];
            if(curr_num != UNASSIGNED && nums[curr_num] == true){
                grid_status = false;
                return;
            }
            nums[curr_num] = true;
        }
    }
    
    // Third pass: Check if all rows are valid
    for(int row_num = 0; row_num < 9; ++row_num){
        bool nums[10] = {false};
        for(int col_num = 0; col_num < 9; ++col_num){
            int curr_num = grid[row_num][col_num];
            if(curr_num != UNASSIGNED && nums[curr_num] == true){
                grid_status = false;
                return;
            }
            nums[curr_num] = true;
        }
    }
    
    // Fourth pass: Check if all blocks are valid
    for(int block_num = 0; block_num < 9; ++block_num){
        bool nums[10] = {false};
        for(int cell_num = 0; cell_num < 9; ++cell_num){
            int curr_num = grid[((int)(block_num / 3)) * 3 + (cell_num / 3)][((int)(block_num % 3)) * 3 + (cell_num % 3)];
            if(curr_num != UNASSIGNED && nums[curr_num] == true){
                grid_status = false;
                return;
            }
            nums[curr_num] = true;
        }
    }
    
    // Randomly shuffle the guessing number array
    for(int i = 0; i < 9; i++){
        this -> guessNum[i] = i + 1;
    }
    
    random_shuffle(this -> guessNum, (this -> guessNum) + 9, genRandNum);
    grid_status = true;
}
