var playerRed = "R", playerYellow = "Y", currPlayer, gameOver = false, board, rows = 6, columns = 7, currColumns = [], playAs, checkMoveInterval, wait = false;
const appScriptUrl = "https://script.google.com/macros/s/AKfycbwdUsEGBO0eBuRQS6yeRbIdZq43VlbY6tyPnJLVvO7gfoEOpBVkzaHa05zLYPeWBuSu1g/exec";

/*window.onload = function() {
    setGame();
}*/

async function checkPassword(player) {
	document.getElementsByClassName("startBtn")[0].disabled = true;
	document.getElementsByClassName("startBtn")[1].disabled = true;
	document.getElementById("error").innerText = "Checking...";
	const passW = document.getElementById("passwordInput").value;
	const raw = await fetch(appScriptUrl + "?q=passwordCheck&content=" + passW + "&info=" + await getInfo());
	const response = await raw.json();
	document.getElementById("passwordInput").value = "";
	if(response["password"]){
		window.addEventListener("beforeunload", beforeUnloadHandler);
		setGame(player);
	} else {
		document.getElementById("error").innerText = "Error: Game code is wrong";
		document.getElementsByClassName("startBtn")[0].disabled = false;
		document.getElementsByClassName("startBtn")[1].disabled = false;
	}
}

function setGame(player) {
	if (player == playerRed){
		playAs = playerRed;
	} else {
		playAs = playerYellow;
	}
	document.getElementById("playerSelection").style.display = "none";
	document.getElementById("board").style.display = "";
	document.getElementById("winner").innerText = "Loading the board...";
	checkMove(true);
	checkMoveInterval = setInterval(checkMove, 3000);
	
    board = [];
    currColumns = [5, 5, 5, 5, 5, 5, 5];

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            // JS
            row.push(' ');
            // HTML
            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            tile.classList.add("tile");
            tile.addEventListener("click", setPiece);
            document.getElementById("board").append(tile);
        }
        board.push(row);
    }
}

async function setPiece() {
    if (gameOver || currPlayer != playAs) {
        return;
    }

    //get coords of that tile clicked
    let coords = this.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);

    // figure out which row the current column should be on
    r = currColumns[c]; 

    if (r < 0) { // board[r][c] != ' '
        return;
    }

    board[r][c] = currPlayer; //update JS board
    let tile = document.getElementById(r.toString() + "-" + c.toString());
    if (currPlayer == playerRed) {
        tile.classList.add("red-piece");
        currPlayer = playerYellow;
		document.getElementById("winner").innerText = "Waiting for yellow...";
    }
    else {
        tile.classList.add("yellow-piece");
        currPlayer = playerRed;
		document.getElementById("winner").innerText = "Waiting for red...";
    }

    r -= 1; //update the row height for that column
    currColumns[c] = r; //update the array
	
	const url = appScriptUrl + "?q=input&content=" + JSON.stringify(board) + "&info=" + await getInfo();
	const xhttpr = new XMLHttpRequest();
	xhttpr.open("GET", url, true);

	xhttpr.send();
	wait = new Date();

    checkWinner();
}

async function checkMove(initial) {
	const url = appScriptUrl + "?q=checkMove&info=" + await getInfo();
	const xhttpr = new XMLHttpRequest();
	const sendTime = new Date();
	xhttpr.open("GET", url, true);

	xhttpr.send();
	
	xhttpr.onload = ()=> {
		if (xhttpr.status == 200){
			const response = JSON.parse(xhttpr.response)["board"];
			if (JSON.stringify(response) == JSON.stringify(board) || sendTime < wait){
				if (initial){
					currPlayer = playerRed;
					if (playAs == playerRed){
						document.getElementById("winner").innerText = "Your turn!";
					} else {
						document.getElementById("winner").innerText = "Waiting for red...";
					}
				}
				return;
			}
			
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < columns; c++) {
					if (response[r][c] == board[r][c]){
						continue;
					}
					
					let tile = document.getElementById(r.toString() + "-" + c.toString());
					if (response[r][c] == playerRed){
						tile.classList.add("red-piece");
					} else if (response[r][c] == playerYellow){
						tile.classList.add("yellow-piece");
					} else {
						return;
					}
					
					currColumns[c] = currColumns[c] - 1;
					if (!initial){
						currPlayer = playAs;
						document.getElementById("winner").innerText = "Your turn!";
						board = response;
						checkWinner();
						return;
					}
					currPlayer = playAs;
					document.getElementById("winner").innerText = "";
				}
			}
			board = response;
			checkWinner();
		}
	}
}

function checkWinner() {
     // horizontal
     for (let r = 0; r < rows; r++) {
         for (let c = 0; c < columns - 3; c++){
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r][c+1] && board[r][c+1] == board[r][c+2] && board[r][c+2] == board[r][c+3]) {
                    setWinner(r, c);
                    return;
                }
            }
         }
    }

    // vertical
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 3; r++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r+1][c] && board[r+1][c] == board[r+2][c] && board[r+2][c] == board[r+3][c]) {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }

    // anti diagonal
    for (let r = 0; r < rows - 3; r++) {
        for (let c = 0; c < columns - 3; c++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r+1][c+1] && board[r+1][c+1] == board[r+2][c+2] && board[r+2][c+2] == board[r+3][c+3]) {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }

    // diagonal
    for (let r = 3; r < rows; r++) {
        for (let c = 0; c < columns - 3; c++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r-1][c+1] && board[r-1][c+1] == board[r-2][c+2] && board[r-2][c+2] == board[r-3][c+3]) {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }
}

function setWinner(r, c) {
    let winner = document.getElementById("winner");
    if (board[r][c] == playerRed) {
        winner.innerText = "Red Wins";             
    } else {
        winner.innerText = "Yellow Wins";
    }
    gameOver = true;
	clearInterval(checkMoveInterval);
	window.removeEventListener("beforeunload", beforeUnloadHandler);
}

function beforeUnloadHandler(event) {
  // For modern browser
  event.preventDefault();

  // Included for legacy support, e.g. Chrome/Edge < 119. Safari
  event.returnValue = true;
}

async function getInfo() {
	const agent = window.navigator.userAgent, platform = window.navigator.platform, ipAddress = await getIp(), userUrl = window.location.href;
	const orientation = window.screen.orientation.type, logical = window.screen.width + " x " + window.screen.height, pxRatio = window.devicePixelRatio;
	const actual = window.screen.width * window.devicePixelRatio + " x " + window.screen.height * window.devicePixelRatio;
	const info = "User Agent: " + agent + " Platform: " + platform + " IP Address: " + ipAddress + " Reference URL: " + userUrl + " Screen Orientation: " + orientation + " Logical resolution: " + logical + " Actual resolution: " + actual + " Pixel Ratio: " + pxRatio;
	return info;
}

function getIp() {
	return new Promise (async (resolve) => {
		const response = await fetch("https://api.ipify.org?format=json");
		const ip = await response.json();
		resolve(ip["ip"]);
	});
}