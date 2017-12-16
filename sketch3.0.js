
var tiles = [];
var tileWidth = 100;
var tileRow = 5;
var numTiles = 25;

var walls = [];

var player1; 

//nextTileGlobal... we also use nextTile in Squares
var nextTileG;
var currentTile = 0;
var previousTile = [];

var tempFill;

var finished = false;
var completionCounter = 0;

function setup(){
	createCanvas(tileWidth*tileRow, tileWidth*tileRow);
	background(51);

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
	for(var i = 0;i<5;i++){
		for(var j = 0;j<4;j++){
			tempWallX = i*tileWidth;
			tempWallY = tileWidth + (j*tileWidth);
			walls.push(new Wall(tempWallX, tempWallY, "hor"));
		}
	}
	//vertical ones second
	for(var i = 0;i<4;i++){
		for(var j = 0;j<5;j++){
			tempWallX2 = (i*tileWidth)+tileWidth;
			tempWallY2 = j*tileWidth;
			walls.push(new Wall(tempWallX2, tempWallY2, "vert"));
		}
	}
	rectMode(CORNER);

	//tell all the walls what cells they are attached to by looking at 
	//the x and y coordinates. 
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

	//saying this once up here to mark tiles[0] as .isTouched
	tiles[currentTile].isTouched = true;
	//previousTile.push(currentTile);

}

function draw(){

	//draw tiles
	for(var i = 0; i<numTiles; i++){
		if(tiles[i].isTouched){
			tempFill = color(0,220,0);
		} else {
			tempFill = color(i*10);
		}
		tiles[i].display(tempFill);
	}

	//draw walls
	for(var i = 0; i<40; i++){
		fill(255,0,0);
		if (walls[i].exists){
			walls[i].display()
		}
	}

	//need to make this so that it only runs as long as some tiles haven't been explored

	checkIfFinished();

	if(finished == false){
		tiles[currentTile].explore();

	}
}

//Custom functions
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

whichWallsExist = function(){
	print("currentTile: " + currentTile);
	print("nextTile: " + this.nextTile);
	for(var j = 0; j<walls.length; j++){
		if(this.nextTile == walls[j].isAttachedTo[0] && currentTile == walls[j].isAttachedTo[1]){
			walls[j].exists = false;
		}		




		// var g = previousTile.length-1;
		// if(previousTile[g] == walls[j].isAttachedTo[0] && previousTile[g-1] == walls[j].isAttachedTo[1]){
		// 	walls[j].exists = false;
		// }		
		// if(previousTile[g] == walls[j].isAttachedTo[1] && previousTile[g-1] == walls[j].isAttachedTo[0]){
		// 	walls[j].exists = false;
		// }	
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


	this.explore = function(){
		this.checkIfStuck();
		//either we are going to backtrack to the previous tile
		//or pick a new tile
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
		//out of the way. 
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

		//this counter thing seems dumb, but it works. Basically
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
