/*global document,image, Image, int, alert*/

///////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////                              ////////////////////////////////////
/////////////////////////////////            GLOBALS           ////////////////////////////////////
/////////////////////////////////                              ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

//Enum to hold tile-states
var State = {
	Hidden: 0,
	Shown: 1,
	Flagged: 2,
	Blown: 3
};

//Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
var canvasSize = 495;
canvas.width = canvasSize;
canvas.height = canvasSize;
document.body.appendChild(canvas);

///////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////                              ////////////////////////////////////
/////////////////////////////////          HELP CODE           ////////////////////////////////////
/////////////////////////////////                              ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

//Checks if an array contains a value
function Contains(a, obj) {
	var i = a.length;
	while (i--) {
		if (a[i] === obj) {
			return true;
		}
	}
	return false;
}

//Clears canvas
function clearCanvas(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//Returns a sorted array of 'n' random numbers between 'min' and 'max'.
function getRandomNumbers(n, min, max){
	var values = [], i = max;
	while(i >= min){
		values.push(i--);
	}
	var results = [];
	var maxIndex = max;
	var index = 0;
	for(i=1; i <= n; i++){
		maxIndex--;
		index = Math.floor(maxIndex * Math.random());
		results.push(values[index]);
		values[index] = values[maxIndex];
	}
	return results.sort();
}

///////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////                              ////////////////////////////////////
/////////////////////////////////        INFRASTRUCTURE        ////////////////////////////////////
/////////////////////////////////                              ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

//Tile
function Tile(isMine, tileState) {
	this.isMine = isMine; //If mine
	this.tileState = tileState; //State of tile ( Hidden / Shown / Flagged / Blown )
	var adjoinMines = 0;
	
	this.addAdjoiningMine = function(){
		adjoinMines++;
	};
	
	this.returnAdjoiningMines = function(){
		return adjoinMines;
	};
}

//Board
function Board(){
	var Tiles = [];
	var tilesPerRow = 15;
	
	var tileSize = canvasSize/tilesPerRow;
	var numberOfTiles = tilesPerRow*tilesPerRow;
	var numberOfMines = Math.floor(numberOfTiles/6);
	
	//Skapar tiles och sparar dem i Tiles[]
	this.generateBoard = function(){
		Tiles.length = 0;
		var mines = getRandomNumbers(numberOfMines, 0, numberOfTiles);
		
		//Skapar tiles samt minor och sparar dem i Tiles[]
		for(var i = 0; i < numberOfTiles; i++){
			var newTile;
			if(Contains(mines, i)){
				newTile = new Tile(true, State.Hidden);
			}else{
				newTile = new Tile(false, State.Hidden);			
			}
			//alert(i + " " + newTile.isMine);
			Tiles.push(newTile);
		}
		
		//Räknar ut siffror runt minor
		for(var n = 0; n < numberOfMines; n++){
			var tilesAroundMines = this.getAdjoiningTiles(mines[n]);
			for(var y = 0; y < tilesAroundMines.length; y++){
				//BUGG
				try{
					Tiles[tilesAroundMines[y]].addAdjoiningMine();
				}catch(err){
					break;
				}
			}
		}
		
		this.drawBoard();
	};
	
	//Ritar ut Tiles[] på en canvas
	this.drawBoard = function(){
		var row = 0;
		var col = 0;
		
		clearCanvas();
		
		for(var i = 1; i <= numberOfTiles; i++){
			//alert(Tiles[i-1].returnAdjoiningMines() + " " + Tiles[i-1].isMine);
			
			//Formen
			ctx.beginPath();
			ctx.rect(tileSize*col, tileSize*row, tileSize-3, tileSize-3);
			
			//Border
			ctx.strokeStyle = "black";
			ctx.stroke();
			
			if(Tiles[i-1].tileState == State.Hidden){ //Hidden
				ctx.font = "30pt Helvetica";
				ctx.fillStyle = "blue";
				ctx.fillText("~", tileSize*col+4, tileSize*row+(tileSize)-4);
			}else if(Tiles[i-1].tileState == State.Shown){ //Shown
				ctx.fillStyle = "black";
				ctx.font = "19pt Helvetica";
				if(Tiles[i-1].returnAdjoiningMines() !== 0){ //Shown med värde
					ctx.fillText(Tiles[i-1].returnAdjoiningMines(), tileSize*col+8, tileSize*row+(tileSize)-8);
				}else{ //Shown utan värde
					ctx.fillText(".", tileSize*col+12, tileSize*row+(tileSize)-15);
				}
			}else if(Tiles[i-1].tileState == State.Flagged){ //Flagged
				ctx.font = "19pt Helvetica";
				ctx.fillStyle = "red";
				ctx.fillText("F", tileSize*col+8, tileSize*row+(tileSize)-8);
			}else{ //Blown
				ctx.font = "19pt Helvetica";
				ctx.fillStyle = "red";
				ctx.fillText("X", tileSize*col+7, tileSize*row+(tileSize)-8);
			}
			
			col++;
			if(i % tilesPerRow === 0 && i !== 0){
				row++;
				col = 0;
			}
		}
	};
	
	
	this.getTileId = function(x, y){
		return (Math.floor(y/tileSize) * tilesPerRow) + Math.floor(x/tileSize);
	}
	
	//Tar emot användar-input i form utav x,y av ett musklick och tar fram vilken tile som klickades på
	//Kollar sedan tilens state och ändrar den därefter beroende på typ av klick
	this.playerInput = function(key, tileId){
		//Tar ut vilken tileID baserat på x,y på musklicket
		//var tileId = this.getTileId(x,y);
		console.log("pInput " + key + " " + tileId);
		//Om vänsterklick
		if(key === 0){
			if(Tiles[tileId].isMine === true){ 						//Om klick på mina
				//Tiles[tileId].tileState = State.Blown;
				this.gameOver();
			}else if(Tiles[tileId].returnAdjoiningMines() === 0){ 			//Om klick på null tile
				this.expandBoard(tileId);				
			}else{ 													//Om klick på non-null tile
				Tiles[tileId].tileState = State.Shown;			
			}
		//(Högerklick)
			//Om inte redan visad
		}else if(Tiles[tileId].tileState !== State.Shown){
			//Om inte redan flaggad
			if(Tiles[tileId].tileState !== State.Flagged){
				Tiles[tileId].tileState = State.Flagged;
			//Om flaggad, göm igen
			}else{
				Tiles[tileId].tileState = State.Hidden;
			}
		}
		
		this.drawBoard();
	};
	
	//Expand board if click on a null tile
	this.expandBoard = function(tileId){
		//alert(tileId);
		Tiles[tileId].tileState = State.Shown;
		if(Tiles[tileId].returnAdjoiningMines() === 0){
			var borderingTiles = this.getAdjoiningTiles(tileId);
			for(var i = 0; i < borderingTiles.length; i++){
				//BUGG
				try{
					if(Tiles[borderingTiles[i]].tileState == State.Hidden){
						this.expandBoard(borderingTiles[i]);
					}
				}catch(err){
					alert(err + " " + borderingTiles[i]);
				}
			}		
		}
	};
	
	//Returns an array with id of all adjoining tiles
	this.getAdjoiningTiles = function(id){
		var adjoinTiles = [];
		
		//Upper
		if(id >= tilesPerRow){
			adjoinTiles.push(id - tilesPerRow);
		}
		//Lower
		if(id < tilesPerRow * (tilesPerRow - 1)){
			adjoinTiles.push(id + tilesPerRow);
		}
		//Right
		if((id+1) % tilesPerRow !== 0){
			adjoinTiles.push(id+1);
		}
		//Left
		if(id % tilesPerRow !== 0){
			adjoinTiles.push(id-1);
		}
		//Upper-Left
		if(Contains(adjoinTiles, id - tilesPerRow) && Contains(adjoinTiles, id-1)){
			adjoinTiles.push((id-tilesPerRow)-1);
		}
		//Upper-Right
		if(Contains(adjoinTiles, id - tilesPerRow) && Contains(adjoinTiles, id+1)){
			adjoinTiles.push((id-tilesPerRow)+1);
		}
		//Lower-Left
		if(Contains(adjoinTiles, id+tilesPerRow) && Contains(adjoinTiles, id-1)){
			adjoinTiles.push((id+tilesPerRow)-1);
		}
		//Lower-Right
		if(Contains(adjoinTiles, id+tilesPerRow) && Contains(adjoinTiles, id+1)){
			adjoinTiles.push((id+tilesPerRow)+1);
		}
		
		return adjoinTiles;
	};
	
	//Game over method. Shows all mines and alerts "game over", then resets board
	this.gameOver = function(){
		//Loop that blows all the mines
		for(var i = 0; i < Tiles.length; i++){
			if(Tiles[i].isMine === true){
				Tiles[i].tileState = State.Blown;
			}
		}
		
		//Draw the, now, blown mines
		this.drawBoard();
		alert("Game over!")
		//generate new board
		this.generateBoard();
	};
	
	this.bot = function(){
		//loop through all tiles
		for(var i = 0; i < numberOfTiles; i++){
			if(Tiles[i].tileState == State.Shown){
				
				
				var adjointedTiles = this.getAdjoiningTiles(i);
				
				console.log(adjointedTiles);
				var tileValue = Tiles[i].returnAdjoiningMines();
				console.log(tileValue);
				var flagCount = 0;
				var hiddenCount = 0;
				var hidden = [];
				
				//collect info on adjointning tiles
				for(var j = 0; j < adjointedTiles.length; j++){
					if(Tiles[adjointedTiles[j]].tileState == State.Flagged){
						flagCount++;
					}
					if(Tiles[adjointedTiles[j]].tileState == State.Hidden){
						hiddenCount++;
						hidden.push(adjointedTiles[j]);
					}
				}
				
				//flag tiles
				if(tileValue - flagCount == hiddenCount){
					for(var n = 0; n < hidden.length; n++){
						//Tiles[hidden[n]].State = State.Flagged;
						this.playerInput(1, hidden[n]);
						return;
					}
				}
				
				//Click if satisfied
				if(tileValue == flagCount){
					for(var n = 0; n < hidden.length; n++){
						this.playerInput(0,hidden[n]);
						return;
						
					}
				}
				
			}
		}
		alert("Bot to dumb");
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////                              ////////////////////////////////////
/////////////////////////////////         MAIN PROGRAM         ////////////////////////////////////
/////////////////////////////////                              ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

var game = new Board();
game.generateBoard();

////// MOUSE DOWN EVENT
canvas.onmousedown = function (e) {
	//console.log(e);
	
	game.playerInput(e.button, game.getTileId(e.clientX, e.clientY));
	//alert(e.button + " " + e.x + " " + e.y);
};

//Events som lyssnar efter knapptryckn
addEventListener("keydown", function (e) {
	//space down
	if(e.which == 32){
		game.bot();
	}	
}, false);

