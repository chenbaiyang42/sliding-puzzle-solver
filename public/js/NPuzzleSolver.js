// NPuzzleSolver
// by Zachary Cava
// repository: https://github.com/technogeek00/NPuzzleSolver

export class NPuzzleSolver {
	constructor(toSolve) {
		this.grid = [];
		this.fixed = [];
		this.numbers = [];
		this.solution = [];
		this.originalGrid = toSolve;
	}

	setupSolver() {
		this.numbers = [];
		this.fixed = [];
		this.grid = [];
		for(let i = 0; i < this.originalGrid.length; i++) {
			this.fixed[i] = [];
			this.grid[i] = [];
			for(let j = 0; j < this.originalGrid.length; j++) {
				let num = this.originalGrid[i][j];
				this.grid[i][j] = num;
				this.fixed[i][j] = false;
				this.numbers[num] = { x : j, y : i };
			}
		}
	}

	solve() {
		this.setupSolver();
		try {
			this.solveGrid(this.grid.length);
		} catch (err) {
			console.log(err.message);
			return null;
		}
		return this.solution;
	}

	solveGrid(size) {
		if(size > 2) {
			// pattern solve nxn squares greater than 2x2
			this.solveRow(size); // solve the upper row first
			this.solveColumn(size); // solve the left column next
			this.solveGrid(size - 1); // now we can solve the sub (n-1)x(n-1) puzzle
		} else if(size == 2) {
			this.solveRow(size); // solve the row like normal
			// rotate last two numbers if they arent in place
			if(this.grid[this.grid.length - 1][this.grid.length - size] === "") {
				this.swapE({ x : this.grid.length - 1, y : this.grid.length - 1});
			}
		} // smaller than 2 is solved by definition
	}

	solveRow(size) {
		var rowNumber = this.grid.length - size;
		// using row number here because this is also our starting column
		for(var i = rowNumber; i < this.grid.length - 2; i++) {
			var number = rowNumber * this.grid.length + (i + 1); // calculate the number that is suppose to be at this position
			this.moveNumberTowards(number, { x : i, y : rowNumber});
			this.fixed[rowNumber][i] = true;
		}
		var secondToLast = rowNumber * this.grid.length + this.grid.length - 1;
		var last = secondToLast + 1;
		// position second to last number
		this.moveNumberTowards(secondToLast, { x : this.grid.length - 1, y : rowNumber });
		// position last number
		this.moveNumberTowards(last, { x : this.grid.length - 1, y : rowNumber + 1 });
		// double check to make sure they are in the right position
		if(this.numbers[secondToLast].x != this.grid.length - 1 || this.numbers[secondToLast].y != rowNumber ||
			this.numbers[last].x != this.grid.length - 1 || this.numbers[last].y != rowNumber + 1) {
				// the ordering has messed up
				this.moveNumberTowards(secondToLast, {x : this.grid.length - 1, y : rowNumber });
				this.moveNumberTowards(last, { x : this.grid.length - 2, y : rowNumber });
				this.moveEmptyTo({ x : this.grid.length - 2, y : rowNumber + 1 });
				// the numbers will be right next to each other
				var pos = { x : this.grid.length - 1, y : rowNumber + 1}; // square below last one in row
				var moveList = ["ul", "u", "", "l", "dl", "d", "", "l", "ul", "u", "", "l", "ul", "u", "", "d"];
				this.applyRelativeMoveList(pos, moveList);
				// now we reversed them, the puzzle is solveable!
			}
		// do the special
		this.specialTopRightRotation(rowNumber);
		// now the row has been solved :D
	}

	solveColumn(size) {
		var colNumber = this.grid.length - size;
		// use column number as this is the starting row
		for(var i = colNumber; i < this.grid.length - 2; i++) {
			var number = i * this.grid.length + 1 + colNumber;
			this.moveNumberTowards(number, { x : colNumber, y : i});
			this.fixed[i][colNumber] = true;
		}
		var secondToLast = (this.grid.length - 2) * this.grid.length + 1 + colNumber;
		var last = secondToLast + this.grid.length;
		// position second to last number
		this.moveNumberTowards(secondToLast, { x : colNumber, y : this.grid.length - 1 });
		// position last number
		this.moveNumberTowards(last, { x : colNumber + 1, y : this.grid.length - 1});
		
		// double check to make sure they are in the right position
		if(this.numbers[secondToLast].x != colNumber || this.numbers[secondToLast].y != this.grid.length - 1 ||
				this.numbers[last].x != colNumber + 1 || this.numbers[last].y != this.grid.length - 1) {
			// this happens because the ordering of the two numbers is reversed, we have to reverse them
			this.moveNumberTowards(secondToLast, { x : colNumber, y : this.grid.length - 1});
			this.moveNumberTowards(last, { x : colNumber, y : this.grid.length - 2});
			this.moveEmptyTo({ x : colNumber + 1, y : this.grid.length - 2});
			// the numbers will be stacked and the empty should be to the left of the last number
			var pos = { x : colNumber + 1, y : this.grid.length - 1 };
			var moveList = ["ul", "l", "", "u", "ur", "r", "", "u", "ul", "l", "", "u", "ul", "l", "", "r"];
			this.applyRelativeMoveList(pos, moveList);
			// now the order has been officially reversed
		}
		
		// do the special
		this.specialLeftBottomRotation(colNumber);
		// now the column is solved
	}

	applyRelativeMoveList(pos, list) {
		for(var i = 0; i < list.length; i++) {
			if(list[i] == "") {
				this.swapE(pos);
			} else {
				this.swapE(this.offsetPosition(pos, list[i]));
			}
		}
	}

	moveNumberTowards(num, dest) {
		// dont bother if the piece is in the right place, it can cause odd things to happen with the space
		if(this.numbers[num].x == dest.x && this.numbers[num].y == dest.y) return; // dont bother
		
		// choose where we want the empty square
		this.makeEmptyNeighborTo(num);
		// now empty will be next to our number and thats all we need
		var counter = 1;
		while(this.numbers[num].x != dest.x || this.numbers[num].y != dest.y) {
			var direction = this.getDirectionToProceed(num, dest);
			if(!this.areNeighbors(num, "")) {
				throw "cannot rotate without empty";
			}
			if(direction == "u" || direction == "d") {
				this.rotateVertical(num, (direction == "u"));
			} else {
				this.rotateHorizontal(num, (direction == "l"));
			}
		}
	}

	rotateHorizontal(num, leftDirection) {
		var side = (leftDirection) ? "l" : "r";
		var other = (leftDirection) ? "r" : "l";
		var empty = this.numbers[""];
		var pos = this.numbers[num];
		if(empty.y != pos.y) {
			// the empty space is above us
			var location = (empty.y < pos.y) ? "u" : "d";
			if(!this.moveable(this.offsetPosition(pos, location + side)) || !this.moveable(this.offsetPosition(pos, location))) {
				this.swapE(this.offsetPosition(pos, location + other));
				this.swapE(this.offsetPosition(pos, other));
				this.proper3By2RotationHorizontal(pos, leftDirection);
			} else {
				this.swapE(this.offsetPosition(pos, location + side));
				this.swapE(this.offsetPosition(pos, side));
			}
		} else if((empty.x < pos.x && !leftDirection) || (empty.x > pos.x && leftDirection)) {
			// its on the opposite that we want it on
			this.proper3By2RotationHorizontal(pos, leftDirection);
		}
		// now it is in the direction we want to go so just swap
		this.swapE(pos);
	}

	proper3By2RotationHorizontal(pos, leftDirection) {
		var side = (leftDirection) ? "l" : "r";
		var other = (leftDirection) ? "r" : "l";
		var location = "u"; // assume up as default
		if(this.moveable(this.offsetPosition(pos, "d" + side)) && this.moveable(this.offsetPosition(pos, "d")) && this.moveable(this.offsetPosition(pos, "d" + other))) {
			location = "d";
		} else if(!this.moveable(this.offsetPosition(pos, "u" + side)) || !this.moveable(this.offsetPosition(pos, "u")) || !this.moveable(this.offsetPosition(pos, "u" + other))) {
			throw "unable to move up all spots fixed";
		}
		this.swapE(this.offsetPosition(pos, location + other));
		this.swapE(this.offsetPosition(pos, location));
		this.swapE(this.offsetPosition(pos, location + side));
		this.swapE(this.offsetPosition(pos, side));
	}

	rotateVertical(num, upDirection) {
		var toward = (upDirection) ? "u" : "d";
		var away = (upDirection) ? "d" : "u";
		
		var empty = this.numbers[""];
		var pos = this.numbers[num];
		if(empty.x != pos.x) {
			// its to the right or left
			var side = (empty.x < pos.x) ? "l" : "r";
			if(!this.moveable(this.offsetPosition(pos, toward + side)) || !this.moveable(this.offsetPosition(pos, side))) {
				this.swapE(this.offsetPosition(pos, away + side));
				this.swapE(this.offsetPosition(pos, away));
				this.proper2By3RotationVertical(pos, upDirection);
			} else {
				this.swapE(this.offsetPosition(pos, toward + side));
				this.swapE(this.offsetPosition(pos, toward));
			}
		} else if((empty.y < pos.y && !upDirection) || (empty.y > pos.y && upDirection)) {
			// its in the opposite direction we want to go
			this.proper2By3RotationVertical(pos, upDirection);
		}
		// now the empty is in the direction we need to go
		// so just swap with it
		this.swapE(pos);
	}

	proper2By3RotationVertical(pos, upDirection) {
		var toward = (upDirection) ? "u" : "d";
		var away = (upDirection) ? "d" : "u";
		
		var side = "r"; // default to right column usage
		if(this.moveable(this.offsetPosition(pos, toward + "l")) && this.moveable(this.offsetPosition(pos, "l")) && this.moveable(this.offsetPosition(pos, away + "l"))) {
			side = "l";
		} else if(!this.moveable(this.offsetPosition(pos, toward + "r")) || !this.moveable(this.offsetPosition(pos, "r")) || !this.moveable(this.offsetPosition(pos, away + "r"))) {
			throw "Unable to preform move, the puzzle is quite possibly unsolveable";
		}
		this.swapE(this.offsetPosition(pos, away + side));
		this.swapE(this.offsetPosition(pos, side));
		this.swapE(this.offsetPosition(pos, toward + side));
		this.swapE(this.offsetPosition(pos, toward));
	}

	specialTopRightRotation(top) {
		// lock the two pieces
		this.fixed[top][this.grid.length - 1] = true;
		this.fixed[top + 1][this.grid.length - 1] = true;
		// preform the swap
		var topRight = { x : this.grid.length - 1, y : top};
		this.moveEmptyTo(this.offsetPosition(topRight, "l"));
		this.swapE(topRight);
		this.swapE(this.offsetPosition(topRight, "d"));
		// lock proper pieces and unlock extra from next row
		this.fixed[top + 1][this.grid.length - 1] = false;
		this.fixed[topRight.y][topRight.x - 1] = true;
	}

	specialLeftBottomRotation(left) {
		// lock the two pieces
		this.fixed[this.grid.length - 1][left] = true;
		this.fixed[this.grid.length - 1][left + 1] = true;
		// preform the swap
		var leftBottom = { x : left, y : this.grid.length - 1};
		this.moveEmptyTo(this.offsetPosition(leftBottom, "u"));
		this.swapE(leftBottom);
		this.swapE(this.offsetPosition(leftBottom, "r"));
		// lock proper pieces and unlock extras from next column
		this.fixed[this.grid.length - 1][left + 1] = false;
		this.fixed[leftBottom.y - 1][leftBottom.x] = true;
	}

	getDirectionToProceed(num, dest) {
		var cur = this.numbers[num];
		var diffx = dest.x - cur.x;
		var diffy = dest.y - cur.y;
		// case 1, we need to move left and are not being blocked
		if(diffx < 0 && this.moveable({x : cur.x - 1, y : cur.y})) {
			return "l";
		}
		// case 2, we need to move right and are not being blocked
		if(diffx > 0 && this.moveable({x : cur.x + 1, y : cur.y})) {
			return "r";
		}
		// case 3, we need to move up
		if(diffy < 0 && this.moveable({x : cur.x, y : cur.y - 1})) {
			return "u";
		}
		// case 4, we need to move down
		if(diffy > 0 && this.moveable({x : cur.x, y : cur.y + 1})) {
			return "d";
		}
		throw "There is no valid move, the puzzle was incorrectly shuffled";
	}

	makeEmptyNeighborTo(num, boundry) {
		var gotoPos = this.numbers[num];
		var counter = 1;
		while((this.numbers[""].x != gotoPos.x || this.numbers[""].y != gotoPos.y) && !this.areNeighbors("", num)) {
			this.movingEmptyLoop(gotoPos);
			counter++;
			if(counter > 100) {
				throw "Infinite loop hit while solving the puzzle, it is quite likely this puzzle is invalid";
			}
		}
	}

	moveEmptyTo(pos) {
		// check to see if the pos is a fixed number
		if(this.fixed[pos.y][pos.x]) {
			throw "cannot move empty to a fixed position";
		}
		var counter = 1;
		while(this.numbers[""].x != pos.x || this.numbers[""].y != pos.y) {
			this.movingEmptyLoop(pos);
			counter++;
			if(counter > 100) {
				console.log("problem trying to move the piece");
				break;
			}
		}
	}

	movingEmptyLoop(pos) {
		var empty = this.numbers[""];
		var diffx = empty.x - pos.x;
		var diffy = empty.y - pos.y;
		if(diffx < 0 && this.canSwap(empty, this.offsetPosition(empty, "r"))) {
			this.swap(empty, this.offsetPosition(empty, "r"));
		} else if(diffx > 0 && this.canSwap(empty, this.offsetPosition(empty, "l"))) {
			this.swap(empty, this.offsetPosition(empty, "l"));
		} else if(diffy < 0 && this.canSwap(empty, this.offsetPosition(empty, "d"))) {
			this.swap(empty, this.offsetPosition(empty, "d"));
		} else if(diffy > 0 && this.canSwap(empty, this.offsetPosition(empty, "u"))) {
			this.swap(empty, this.offsetPosition(empty, "u"));
		}
	}

	offsetPosition(pos, direction) {
		if(direction == "u") {
			return { x : pos.x , y : pos.y - 1 };
		} else if(direction == "d") {
			return { x : pos.x , y : pos.y + 1 };
		} else if(direction == "l") {
			return { x : pos.x - 1 , y : pos.y };
		} else if(direction == "r") {
			return { x : pos.x + 1 , y : pos.y };
		} else if(direction == "ul") {
			return { x : pos.x - 1, y : pos.y - 1};
		} else if(direction == "ur") {
			return { x : pos.x + 1, y : pos.y - 1};
		} else if(direction == "dl") {
			return { x : pos.x - 1, y : pos.y + 1};
		} else if(direction == "dr") {
			return { x : pos.x + 1, y : pos.y + 1};
		}
		return pos;
	}

	areNeighbors(first, second) {
		var num1 = this.numbers[first];
		var num2 = this.numbers[second];
		return (Math.abs(num1.x - num2.x) == 1 && num1.y == num2.y) || (Math.abs(num1.y - num2.y) == 1 && num1.x == num2.x);
	}

	moveable(pos) {
		return this.validPos(pos) && !this.fixed[pos.y][pos.x];
	}

	validPos(pos) {
		return !(pos.x < 0 || pos.x >= this.grid.length || pos.y < 0 || pos.y >= this.grid.length);
	}

	canSwap(pos1, pos2) {
		if(!this.validPos(pos1) || !this.validPos(pos2)) {
			return false;
		}
		var num1 = this.grid[pos1.y][pos1.x];
		var num2 = this.grid[pos2.y][pos2.x];
		if(!this.areNeighbors(num1, num2)) {
			return false;
		}
		// check fixed positions
		return !(this.fixed[pos1.y][pos1.x] || this.fixed[pos2.y][pos2.x]);
	}

	swapE(pos) {
		this.swap(this.numbers[""], pos);
	}

	swap(pos1, pos2) {
		var num1 = this.grid[pos1.y][pos1.x];
		var num2 = this.grid[pos2.y][pos2.x];
		// guard against illegal moves
		if(!this.areNeighbors(num1, num2)) {
			throw "These numbers are not neighbors and cannot be swapped";
		}
		if(num1 != "" && num2 != "") {
			throw "You must swap with an empty space";
		}
		var oldPos1 = this.numbers[num1];
		this.numbers[num1] = this.numbers[num2];
		this.numbers[num2] = oldPos1;
		this.grid[pos1.y][pos1.x] = num2;
		this.grid[pos2.y][pos2.x] = num1;
		this.solution.push({empty : (num1 == "") ? pos1 : pos2,
							piece : (num1 == "") ? pos2 : pos1,
							number : (num1 == "") ? num2 : num1});
	}

	solveAStarManhattan() {
		this.setupSolver();
		this.solution = [];
		
		// Create a flat representation of the grid for easier manipulation
		const flatGrid = this.createFlatGrid();
		const size = this.grid.length;
		const goalState = this.createGoalState(size);
		
		// A* search with Manhattan distance heuristic
		const result = this.aStarSearch(flatGrid, goalState, this.manhattanDistance);
		
		if (!result) {
			console.log("No solution found with A* Manhattan Distance");
			return null;
		}
		
		return this.solution;
	}
	
	// A* search algorithm
	aStarSearch(initialState, goalState, heuristicFn) {
		// Priority queue for open set (using array + sort for simplicity)
		let openSet = [];
		// Set to track visited states
		const closedSet = new Set();
		// Map to store parent states for path reconstruction
		const cameFrom = new Map();
		// Map to store g scores (cost from start to current)
		const gScore = new Map();
		// Map to store f scores (g score + heuristic)
		const fScore = new Map();
		
		// Initialize with start state
		const initialStateStr = JSON.stringify(initialState);
		openSet.push(initialState);
		gScore.set(initialStateStr, 0);
		fScore.set(initialStateStr, heuristicFn(initialState, goalState));
		
		while (openSet.length > 0) {
			// Sort open set by f score (lowest first)
			openSet.sort((a, b) => {
				const aStr = JSON.stringify(a);
				const bStr = JSON.stringify(b);
				return fScore.get(aStr) - fScore.get(bStr);
			});
			
			// Get the state with lowest f score
			const current = openSet.shift();
			const currentStr = JSON.stringify(current);
			
			// Check if we reached the goal
			if (JSON.stringify(current) === JSON.stringify(goalState)) {
				// Reconstruct the path and convert to solution format
				return this.reconstructPath(cameFrom, current, initialState);
			}
			
			// Add to closed set
			closedSet.add(currentStr);
			
			// Get all possible moves from current state
			const neighbors = this.getNeighbors(current);
			
			for (const neighbor of neighbors) {
				const neighborStr = JSON.stringify(neighbor);
				
				// Skip if already evaluated
				if (closedSet.has(neighborStr)) {
					continue;
				}
				
				// Calculate tentative g score
				const tentativeGScore = gScore.get(currentStr) + 1;
				
				// Check if this path is better or if neighbor is not in open set
				const neighborInOpenSet = openSet.some(state => JSON.stringify(state) === neighborStr);
				if (!neighborInOpenSet || tentativeGScore < gScore.get(neighborStr)) {
					// Record this path
					cameFrom.set(neighborStr, current);
					gScore.set(neighborStr, tentativeGScore);
					fScore.set(neighborStr, tentativeGScore + heuristicFn(neighbor, goalState));
					
					// Add to open set if not already there
					if (!neighborInOpenSet) {
						openSet.push(neighbor);
					}
				}
			}
		}
		
		// No solution found
		return null;
	}
	
	// Manhattan distance heuristic
	manhattanDistance(state, goalState) {
		let distance = 0;
		const size = Math.sqrt(state.length);
		
		for (let i = 0; i < state.length; i++) {
			const value = state[i];
			if (value === "") continue; // Skip empty space
			
			// Find position in goal state
			const goalIndex = goalState.indexOf(value);
			
			// Calculate Manhattan distance
			const x1 = i % size;
			const y1 = Math.floor(i / size);
			const x2 = goalIndex % size;
			const y2 = Math.floor(goalIndex / size);
			
			distance += Math.abs(x1 - x2) + Math.abs(y1 - y2);
		}
		
		return distance;
	}
	
	// Helper function to create a flat representation of the grid
	createFlatGrid() {
		const flat = [];
		for (let i = 0; i < this.grid.length; i++) {
			for (let j = 0; j < this.grid.length; j++) {
				flat.push(this.grid[i][j]);
			}
		}
		return flat;
	}
	
	// Helper function to create the goal state
	createGoalState(size) {
		const goal = [];
		for (let i = 1; i < size * size; i++) {
			goal.push(i);
		}
		goal.push(""); // Empty space at the end
		return goal;
	}
	
	// Get all possible neighbor states from current state
	getNeighbors(state) {
		const neighbors = [];
		const size = Math.sqrt(state.length);
		const emptyIndex = state.indexOf("");
		
		// Calculate row and column of empty space
		const emptyRow = Math.floor(emptyIndex / size);
		const emptyCol = emptyIndex % size;
		
		// Possible moves: up, down, left, right
		const moves = [
			{ dr: -1, dc: 0 }, // up
			{ dr: 1, dc: 0 },  // down
			{ dr: 0, dc: -1 }, // left
			{ dr: 0, dc: 1 }   // right
		];
		
		for (const move of moves) {
			const newRow = emptyRow + move.dr;
			const newCol = emptyCol + move.dc;
			
			// Check if the move is valid
			if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
				const newIndex = newRow * size + newCol;
				
				// Create a new state with the swap
				const newState = [...state];
				newState[emptyIndex] = state[newIndex];
				newState[newIndex] = "";
				
				neighbors.push(newState);
			}
		}
		
		return neighbors;
	}
	
	// Reconstruct the path from start to goal
	reconstructPath(cameFrom, current, start) {
		// Convert the path to solution format
		const path = [current];
		let currentStr = JSON.stringify(current);
		
		while (currentStr !== JSON.stringify(start)) {
			const previous = cameFrom.get(currentStr);
			path.unshift(previous);
			currentStr = JSON.stringify(previous);
		}
		
		// Convert path to solution format (sequence of moves)
		for (let i = 0; i < path.length - 1; i++) {
			const currentState = path[i];
			const nextState = path[i + 1];
			
			// Find the positions that changed
			const size = Math.sqrt(currentState.length);
			let emptyPos, piecePos;
			
			for (let j = 0; j < currentState.length; j++) {
				if (currentState[j] === "" && nextState[j] !== "") {
					emptyPos = {
						x: j % size,
						y: Math.floor(j / size)
					};
					break;
				}
			}
			
			for (let j = 0; j < nextState.length; j++) {
				if (nextState[j] === "" && currentState[j] !== "") {
					piecePos = {
						x: j % size,
						y: Math.floor(j / size)
					};
					const number = currentState[j];
					
					this.solution.push({
						empty: emptyPos,
						piece: piecePos,
						number: number
					});
					break;
				}
			}
		}
		
		return this.solution;
	}

	solveAStarMisplaced() {
		this.setupSolver();
		this.solution = [];
		
		// Create a flat representation of the grid for easier manipulation
		const flatGrid = this.createFlatGrid();
		const size = this.grid.length;
		const goalState = this.createGoalState(size);
		
		// A* search with Misplaced Tiles heuristic
		const result = this.aStarSearch(flatGrid, goalState, this.misplacedTiles);
		
		if (!result) {
			console.log("No solution found with A* Misplaced Tiles");
			return null;
		}
		
		return this.solution;
	}
	
	// Misplaced tiles heuristic
	misplacedTiles(state, goalState) {
		let count = 0;
		
		for (let i = 0; i < state.length; i++) {
			// Skip empty space
			if (state[i] === "") continue;
			
			// Count if tile is not in its goal position
			if (state[i] !== goalState[i]) {
				count++;
			}
		}
		
		return count;
	}

	solveAStarLinearConflict() {
		this.setupSolver();
		this.solution = [];
		
		// Create a flat representation of the grid for easier manipulation
		const flatGrid = this.createFlatGrid();
		const size = this.grid.length;
		const goalState = this.createGoalState(size);
		
		// A* search with Linear Conflict + Manhattan Distance heuristic
		const result = this.aStarSearch(flatGrid, goalState, (state, goal) => this.linearConflict(state, goal));
		
		if (!result) {
			console.log("No solution found with A* Linear Conflict");
			return null;
		}
		
		return this.solution;
	}
	
	// Linear conflict heuristic (Manhattan distance + linear conflicts)
	linearConflict(state, goalState) {
		const size = Math.sqrt(state.length);
		let conflicts = 0;
		
		// Calculate Manhattan distance first
		const manhattanDist = this.manhattanDistance(state, goalState);
		
		// Check row conflicts
		for (let row = 0; row < size; row++) {
			// Get all tiles in this row
			const tilesInRow = [];
			for (let col = 0; col < size; col++) {
				const index = row * size + col;
				const value = state[index];
				
				// Skip empty space
				if (value === "") continue;
				
				// Check if this tile belongs in this row in the goal state
				const goalIndex = goalState.indexOf(value);
				const goalRow = Math.floor(goalIndex / size);
				
				if (goalRow === row) {
					tilesInRow.push({
						value,
						currentCol: col,
						goalCol: goalIndex % size
					});
				}
			}
			
			// Count conflicts in this row
			for (let i = 0; i < tilesInRow.length; i++) {
				for (let j = i + 1; j < tilesInRow.length; j++) {
					// Check if tiles are in conflict (reversed order)
					if (tilesInRow[i].currentCol < tilesInRow[j].currentCol && 
						tilesInRow[i].goalCol > tilesInRow[j].goalCol) {
						conflicts++;
					}
					if (tilesInRow[i].currentCol > tilesInRow[j].currentCol && 
						tilesInRow[i].goalCol < tilesInRow[j].goalCol) {
						conflicts++;
					}
				}
			}
		}
		
		// Check column conflicts
		for (let col = 0; col < size; col++) {
			// Get all tiles in this column
			const tilesInCol = [];
			for (let row = 0; row < size; row++) {
				const index = row * size + col;
				const value = state[index];
				
				// Skip empty space
				if (value === "") continue;
				
				// Check if this tile belongs in this column in the goal state
				const goalIndex = goalState.indexOf(value);
				const goalCol = goalIndex % size;
				
				if (goalCol === col) {
					tilesInCol.push({
						value,
						currentRow: row,
						goalRow: Math.floor(goalIndex / size)
					});
				}
			}
			
			// Count conflicts in this column
			for (let i = 0; i < tilesInCol.length; i++) {
				for (let j = i + 1; j < tilesInCol.length; j++) {
					// Check if tiles are in conflict (reversed order)
					if (tilesInCol[i].currentRow < tilesInCol[j].currentRow && 
						tilesInCol[i].goalRow > tilesInCol[j].goalRow) {
						conflicts++;
					}
					if (tilesInCol[i].currentRow > tilesInCol[j].currentRow && 
						tilesInCol[i].goalRow < tilesInCol[j].goalRow) {
						conflicts++;
					}
				}
			}
		}
		
		// Each conflict requires at least 2 additional moves
		return manhattanDist + 2 * conflicts;
	}
}
