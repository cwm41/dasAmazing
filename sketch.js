
var tiles = [];
var tileWidth = 30;
var tileRow = 13;
var numTiles = tileRow*tileRow;
var numWalls = (tileRow*(tileRow+1))*2-(tileRow*4);

var walls = [];

var player1; 

var currentTile = 0;
var previousTile = [];

var tempFill;

var finished = false;
var completionCounter = 0;

var mapBuilt;

function setup(){

	createCanvas(tileWidth*tileRow, tileWidth*tileRow);
	background(51);

	mapBuilt = false;

	rectMode(CORNER);

	// createTilesAndWalls();
	// meetYourNeighbors();

	// print(tiles[currentTile]);

	// tiles[currentTile].isTouched = true;


}

function draw(){


	if(mapBuilt == false){
		createTilesAndWalls();
		meetYourNeighbors();
		//saying this once up here to mark tiles[0] as .isTouched
		tiles[currentTile].isTouched = true;
		mapBuilt = true;
	}

	//draw tiles
	for(var i = 0; i<numTiles; i++){
		//uncomment to see tiles change color as they are touched
		//somewhat useful for debugging
		// if(tiles[i].isTouched){
		// 	tempFill = color(20,60,40, 10);
		// } else {
		// 	tempFill = color(i*(255/numTiles));
		// }
		tiles[i].display(i*(255/numTiles));
	}

	//draw walls
	for(var i = 0; i<numWalls; i++){
		fill(255);
		stroke(0);
		if (walls[i].exists){
			walls[i].display()
		}
	}

	checkIfFinished();
	if(finished == false){
		tiles[currentTile].explore();

	}
	
}


//Custom functions//
checkIfFinished = function(){
	for(var i = 0;i<tiles.length;i++){
		if(tiles[i].isTouched == true){
			completionCounter++;
			//print("Completion Counter: " +completionCounter);
		}
	}
	if(completionCounter >= numTiles){
		finished = true;
		completionCounter = 0;
	} else if(completionCounter<numTiles){
		finished = false;
	}
}

createTilesAndWalls = function(){
		//tempX & Y will help will drawing the squares
	var tempX;
	var tempY;
	//start with -1 to match with array numbering
	var name = -1;
	//tempWall coordinates will help us with giving
	//initial coords for the walls
	var tempWallX, tempWallY;
	var tempWallX2, tempWallY2;

	//starts drawing tiles in the top left, down each column
	for(var i = 0; i<tileRow;i++){
		for (var j = 0; j<tileRow; j++){
			name++;
			tempX = i*tileWidth;
			tempY = j*tileWidth;
			tiles.push(new Square(tempX, tempY, name));
		}
	}
	//draw all the walls, horizontal ones first
	for(var i = 0;i<tileRow;i++){
		for(var j = 0;j<tileRow-1;j++){
			tempWallX = i*tileWidth;
			tempWallY = tileWidth + (j*tileWidth);
			walls.push(new Wall(tempWallX, tempWallY, "hor"));
		}
	}
	//vertical ones second
	for(var i = 0;i<tileRow-1;i++){
		for(var j = 0;j<tileRow;j++){
			tempWallX2 = (i*tileWidth)+tileWidth;
			tempWallY2 = j*tileWidth;
			walls.push(new Wall(tempWallX2, tempWallY2, "vert"));
		}
	}
}

meetYourNeighbors = function(){
	//tell all the walls what cells they are attached to by looking at 
	//the x and y coordinates - not the most elegant way to do it, but
	//it works. 
	for(var i = 0;i<walls.length;i++){
		for(var j = 0;j<tiles.length;j++){
			//slightly different tests for vertical vs. horizontal lines
			if(walls[i].Dir == "vert"){
				if(walls[i].x == tiles[j].x || walls[i].x == tiles[j].x+tileWidth){
					if(walls[i].y == tiles[j].y){
						walls[i].isAttachedTo.push(tiles[j].name);
					}
				}
			} else {
				if(walls[i].x == tiles[j].x){
					if(walls[i].y == tiles[j].y || walls[i].y == tiles[j].y+tileWidth){
						walls[i].isAttachedTo.push(tiles[j].name);
					}
				}
			}
		}
	}

	//if two cells are attached to the same wall, they are neighbors
	for(var i = 0;i<tiles.length;i++){
		for(var j = 0;j<walls.length;j++){
			//checking inside each isAttachedTo array to see if the current
			//tile is in there. Unfortunately, this means that the tiles.neighbor[]
			//will include the tile itself. We will deal with that tiles.pickem()
			for(var f = 0;f<walls[j].isAttachedTo.length;f++){
				if(walls[j].isAttachedTo[f] == tiles[i].name){
					splice(tiles[i].neighbor, walls[j].isAttachedTo, 0);
				}
			}
		}
	}
}


//CLASSES//
function Square(ix, iy, iName){
	//coordinates of the tile
	this.x = ix;
	this.y = iy;

	this.filler;

	//the name of this tile - it's number on the chart
	this.name = iName;
	this.isTouched = false;
	this.isStuck = false;

	//all tiles this tile touches, plus itself (for bad reasons)
	this.neighbor = [];

	//for picking the next tile in .pickem()
	this.nextTile;

	//we'll use the counter when looking at neighbors
	this.counter = 0;

	this.display = function(colour){
		noStroke();

		fill(colour);
		rect(this.x, this.y, tileWidth, tileWidth);
		//textSize(20);

		//show what tile we are over
		if(mouseX>this.x && mouseX<this.x+tileWidth){
			if(mouseY>this.y && mouseY<this.y+tileWidth){
				fill(255, 0, 0);
				noStroke();
				textSize(20);
				textAlign(CENTER);
				text(this.name, mouseX, mouseY);
			}
		}
	}


	//this.explore is based on my limited understanding of a "depthfirst" search.
	//My understanding of that concept is basically "go as deep as you can, and
	//when you get stuck, back up and look for another way." Interestingly, you use
	//the same logic to solve a maze as to build one this way. 
	this.explore = function(){
		//stuck means the currentTile has NO untouched neighbors
		this.checkIfStuck();

		//if we're stuck, we backtrack until we find a neighbor
		//with that is untouched. Otherwise, randomly pick a current
		//untouched neighbor
		if(this.isStuck == true){
			this.backtrack();
		} else {
			this.pickem();
		}
	}

	this.pickem = function(){
		//print("picking");
		this.nextTile = random(this.neighbor);
		//if we pick ourselves or we've already been to that tile, pick again
		while(this.nextTile == this.name || tiles[this.nextTile].isTouched == true){
			this.nextTile = random(this.neighbor);
		}

		//for this instant, we know what the currentTile is AND what the nextTile is going to be.
		//While we know both of those things, we have to let the walls know so they can get
		//out of the way. Wanted this to be a global function because that seemed to make
		//sense, but it works here, so here it is.
		for(var j = 0; j<walls.length; j++){
			if(this.nextTile == walls[j].isAttachedTo[0] && currentTile == walls[j].isAttachedTo[1]){
				walls[j].exists = false;
			}	
			if(this.nextTile == walls[j].isAttachedTo[1] && currentTile == walls[j].isAttachedTo[0]){
				walls[j].exists = false;
			}
		}

		//currentTile is relegated to the previousTile bin
		previousTile.push(currentTile);
		//now the nextTile IS the currentTile
		currentTile = this.nextTile;
		tiles[currentTile].isTouched = true;
	}


	this.checkIfStuck = function(){
		//print("checking");

		//this counter thing seems clumsy, but it works. Basically
		//it just tells you when all of the neighboring tiles are 
		//touched
		this.counter = 0;
		for(var i = 0;i<this.neighbor.length;i++){
			if(tiles[tiles[currentTile].neighbor[i]].isTouched == true){
				this.counter++;
			}
			if(this.counter == this.neighbor.length){
				this.isStuck = true;
			} else {
				this.isStuck = false;
			}
		}
	}

	this.backtrack = function(){
		//print("backtracking");
		//Go back to the previous tile and hope you are unstuck
		currentTile = previousTile[previousTile.length-1];
		//shorten array by one, because we've gone backward
		previousTile = shorten(previousTile);
	}

}

function Wall(tx, ty, tDir){
	this.x = tx;
	this.y = ty;
	this.Dir = tDir;
	this.isAttachedTo = [];
	this.exists = true;

	this.length;
	this.height;

	this.display = function(){
		if(this.Dir == "hor"){
			this.length = tileWidth;
			this.height = 3;
		}
		if(this.Dir == "vert"){
			this.length = 3;
			this.height = tileWidth;
		}
		rect(this.x, this.y, this.length, this.height);
	}


}
