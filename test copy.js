const NONE = 0;
const KING = 1;
const QUEEN = 2;
const ROOK = 3;
const BISHOP = 4;
const KNIGHT = 5;
const PAWN = 6;

const WHITE = 8;
const BLACK = 16;


const chessboard = Array(64).fill(NONE);

// Function to parse FEN string and update the chessboard
function loadPositionFromFen(fen) {
    const fenboard = fen.split(' ')[0];
    let file = 0;
    let rank = 7;

    for (const symbol of fenboard) {
        if (symbol === '/') {
            file = 0;
            rank--;
        } else {
            if (!isNaN(symbol)) {
                file += parseInt(symbol);
            } else {
                const pieceColor = symbol === symbol.toUpperCase() ? WHITE : BLACK;
                const pieceType = {
                    'k': KING,
                    'q': QUEEN,
                    'r': ROOK,
                    'b': BISHOP,
                    'n': KNIGHT,
                    'p': PAWN
                }[symbol.toLowerCase()];
                chessboard[rank * 8 + file] = pieceType | pieceColor;
                file++;
            }
        }
    }
}

const startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

loadPositionFromFen(startingFen);

const canvasSize = 600;
const squareSize = canvasSize / 8;

const canvas = document.createElement("canvas");
canvas.width = canvasSize;
canvas.height = canvasSize;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const lightCol = "#f0d9b5";
const darkCol = "#b58863";

const pieceImages = {
    [BISHOP | WHITE]: "images/bishopwhite.png",
    [BISHOP | BLACK]: "images/bishopblack.png",
    [PAWN | WHITE]: "images/pawnwhite.png",
    [PAWN | BLACK]: "images/pawnblack.png",
    [KNIGHT | WHITE]: "images/nightwhite.png",
    [KNIGHT | BLACK]: "images/nightblack.png",
    [ROOK | WHITE]: "images/rookwhite.png",
    [ROOK | BLACK]: "images/rookblack.png",
    [QUEEN | WHITE]: "images/queenwhite.png",
    [QUEEN | BLACK]: "images/queenblack.png",
    [KING | WHITE]: "images/kingwhite.png",
    [KING | BLACK]: "images/kingblack.png",
};

const preloadedImages = {};

// Preload piece images
for (const pieceType in pieceImages) {
    const img = new Image();
    img.src = pieceImages[pieceType];
    preloadedImages[pieceType] = img;
}

function drawBoard() {
    for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
            const isLightSquare = (file + rank) % 2 !== 0;
            const squareColor = isLightSquare ? lightCol : darkCol;

            const x = file * squareSize;
            const y = rank * squareSize;

            ctx.fillStyle = squareColor;
            ctx.fillRect(x, y, squareSize, squareSize);

            // Draw the piece (if any)
            const piece = chessboard[file + rank * 8];
            if (piece !== NONE) {
                const pieceImage = preloadedImages[piece];
                if (pieceImage) {
                    ctx.drawImage(pieceImage, x - 1, y, squareSize, squareSize);
                }
            }

            // Highlight the selected piece
            if (file === selectedFile && rank === selectedRank) {
                ctx.fillStyle = "red";
                ctx.globalAlpha = 0.3; // Adjust transparency if needed
                ctx.fillRect(x, y, squareSize, squareSize);
                ctx.globalAlpha = 1; 
            }

            if (selectedPiece !== NONE && legalMoves.some(([moveFile, moveRank]) => moveFile === file && moveRank === rank)) {
                ctx.fillStyle = "green";
                ctx.globalAlpha = 0.3; // Adjust transparency if needed
                ctx.fillRect(x, y, squareSize, squareSize);
                ctx.globalAlpha = 1; 
            }
        }
    }
}



for (let i = 0; i < 8; i++) {
    console.log(chessboard.slice(i * 8, (i + 1) * 8));
}

let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookKingSideMoved = false;
let whiteRookQueenSideMoved = false;
let blackRookKingSideMoved = false;
let blackRookQueenSideMoved = false;

let enPassantTarget = -1;


function getLegalMovesBishop(file, rank) {
    const moves = [];
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [df, dr] of directions) {
        for (let dist = 1; dist < 8; dist++) {
            const newFile = file + df * dist;
            const newRank = rank + dr * dist;

            // Stop if off board
            if (newFile < 0 || newFile >= 8 || newRank < 0 || newRank >= 8) {
                break;
            }

            const targetPiece = chessboard[newFile + newRank * 8];

            // Stop if friendly piece
            if ((targetPiece & currentTurn) === currentTurn) {
                break;
            }

            // Add move
            moves.push([newFile, newRank]);

            // Stop if enemy piece
            if (targetPiece !== NONE) {
                break;
            }
        }
    }

    return moves;
}

function getLegalMovesRook(file, rank) {
    const moves = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [df, dr] of directions) {
        for (let dist = 1; dist < 8; dist++) {
            const newFile = file + df * dist;
            const newRank = rank + dr * dist;

            // Stop if off board
            if (newFile < 0 || newFile >= 8 || newRank < 0 || newRank >= 8) {
                break;
            }
            const targetPiece = chessboard[newFile + newRank * 8];

            // Stop if friendly piece
            if ((targetPiece & currentTurn) === currentTurn) {
                break;
            }

            // Add move
            moves.push([newFile, newRank]);

            // Stop if enemy piece
            if (targetPiece !== NONE) {
                break;
            }
        }
    }

    return moves;
}

function getLegalMovesQueen(file, rank) {
    return [...getLegalMovesRook(file, rank), ...getLegalMovesBishop(file, rank)];
}

function getLegalMovesKing(file, rank) {
    const moves = [];

    // Check all eight directions: N, NE, E, SE, S, SW, W, NW
    const directions = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]];
    for (const [df, dr] of directions) {
        const newFile = file + df;
        const newRank = rank + dr;

        // Skip if off board
        if (newFile < 0 || newFile >= 8 || newRank < 0 || newRank >= 8) {
            continue;
        }

        const targetPiece = chessboard[newFile + newRank * 8];

        // Skip if friendly piece
        if ((targetPiece & currentTurn) === currentTurn) {
            continue;
        }

        // Add move
        moves.push([newFile, newRank]);
    }

      // Castling
    if (!isInCheck(currentTurn)) {
        // King-side
        if (canCastleKingside(file, rank)) {
            moves.push([file + 2, rank]);
        }

        // Queen-side
        if (canCastleQueenside(file, rank)) {
            moves.push([file - 2, rank]);
        }
    }
    return moves;
}

function getLegalMovesKnight(file, rank) {
    const moves = [];

    // Knights move in an 'L' shape: two squares in one direction, then one square perpendicular
    const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [df, dr] of offsets) {
        const newFile = file + df;
        const newRank = rank + dr;

        // Skip if off board
        if (newFile < 0 || newFile >= 8 || newRank < 0 || newRank >= 8) {
            continue;
        }

        const targetPiece = chessboard[newFile + newRank * 8];

        // Skip if friendly piece
        if ((targetPiece & currentTurn) === currentTurn) {
            continue;
        }

        // Add move
        moves.push([newFile, newRank]);
    }

    return moves;
}

function getLegalMovesPawn(file, rank) {
    const moves = [];

    // Determine direction based on color
    const direction = (currentTurn === WHITE) ? 1 : -1;

    // Pawns can capture en passant
    if (rank === 3 && currentTurn === WHITE) {
        const enPassantFiles = [file - 1, file + 1];
        for (const enPassantFile of enPassantFiles) {
            if (enPassantFile >= 0 && enPassantFile < 8 && enPassantFile + rank * 8 === enPassantTarget) {
                moves.push([enPassantFile, rank - 1]);
            }
        }
    } else if (rank === 4 && currentTurn === BLACK) {
        const enPassantFiles = [file - 1, file + 1];
        for (const enPassantFile of enPassantFiles) {
            if (enPassantFile >= 0 && enPassantFile < 8 && enPassantFile + rank * 8 === enPassantTarget) {
                moves.push([enPassantFile, rank + 1]);
            }
        }
    }


    // Pawns can move forward if the square in front is empty
    const forwardFile = file;
    const forwardRank = rank + direction;
    if (forwardRank >= 0 && forwardRank < 8 && chessboard[forwardFile + forwardRank * 8] === NONE) {
        moves.push([forwardFile, forwardRank]);

        // If the pawn is on its starting rank, it can move two squares forward
        const startRank = (currentTurn === WHITE) ? 1 : 6;
        const doubleForwardRank = rank + 2 * direction;
        if (rank === startRank && chessboard[forwardFile + doubleForwardRank * 8] === NONE) {
            moves.push([forwardFile, doubleForwardRank]);
        }
    }

    // Pawns can capture diagonally
    const captureFiles = [file - 1, file + 1];
    for (const captureFile of captureFiles) {
        if (captureFile >= 0 && captureFile < 8) {
            const captureRank = rank + direction;
            const targetPiece = chessboard[captureFile + captureRank * 8];
            if (targetPiece !== NONE && (targetPiece & currentTurn) !== currentTurn) {
                moves.push([captureFile, captureRank]);
            }
        }
    }

    return moves;
}

function isInCheck(color) {
    // Find the king
    let kingFile = -1, kingRank = -1;
    for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
            const piece = chessboard[file + rank * 8];
            if ((piece & ~color) === KING && (piece & color) === color) {
                kingFile = file;
                kingRank = rank;
                break;
            }
        }
    }

    // Check if any opposing piece can capture the king
    const opposingColor = color === WHITE ? BLACK : WHITE;
    for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
            const piece = chessboard[file + rank * 8];
            if ((piece & opposingColor) === opposingColor) {
                const legalMoves = getRawLegalMoves(piece, file, rank);
                if (legalMoves.some(([moveFile, moveRank]) => moveFile === kingFile && moveRank === kingRank)) {
                    return true;
                }
            }
        }
    }

    return false;
}


function canCastleKingside(file, rank) {
    // Check if the king and the rook haven't moved and the squares between them are empty
    if (currentTurn === WHITE) {
        return !whiteKingMoved && !whiteRookKingSideMoved && chessboard[5] === NONE && chessboard[6] === NONE;
    } else { // BLACK
        return !blackKingMoved && !blackRookKingSideMoved && chessboard[61] === NONE && chessboard[62] === NONE;
    }
}

function canCastleQueenside(file, rank) {
    // Check if the king and the rook haven't moved and the squares between them are empty
    if (currentTurn === WHITE) {
        return !whiteKingMoved && !whiteRookQueenSideMoved && chessboard[1] === NONE && chessboard[2] === NONE && chessboard[3] === NONE;
    } else { // BLACK
        return !blackKingMoved && !blackRookQueenSideMoved && chessboard[57] === NONE && chessboard[58] === NONE && chessboard[59] === NONE;
    }
}

function getRawLegalMoves(piece, file, rank) {
    let legalMoves = [];

    switch (piece & ~currentTurn) { // Remove color bits to get piece type
        case KING:
            legalMoves = getLegalMovesKing(file, rank);
            break;
        case QUEEN:
            legalMoves = getLegalMovesQueen(file, rank);
            break;
        case ROOK:
            legalMoves = getLegalMovesRook(file, rank);
            break;
        case BISHOP:
            legalMoves = getLegalMovesBishop(file, rank);
            break;
        case KNIGHT:
            legalMoves = getLegalMovesKnight(file, rank);
            break;
        case PAWN:
            legalMoves = getLegalMovesPawn(file, rank);
            break;
    }

    return legalMoves;
}

function isSquareAttacked(file, rank, color) {
    const opposingColor = color === WHITE ? BLACK : WHITE;
    for (let f = 0; f < 8; f++) {
        for (let r = 0; r < 8; r++) {
            const piece = chessboard[f + r * 8];
            if ((piece & opposingColor) === opposingColor) {
                const legalMoves = getRawLegalMoves(piece, f, r);
                if (legalMoves.some(([moveFile, moveRank]) => moveFile === file && moveRank === rank)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getLegalMoves(piece, file, rank) {
    let legalMoves = getRawLegalMoves(piece, file, rank);

    // Filter out moves that would result in the player being in check
    legalMoves = legalMoves.filter(([newFile, newRank]) => {
        // Simulate the move
        const originalPiece = chessboard[newFile + newRank * 8];
        chessboard[file + rank * 8] = NONE;
        chessboard[newFile + newRank * 8] = piece;

        // Check if the player would be in check
        const isInCheckAfterMove = isSquareAttacked(selectedFile, selectedRank, currentTurn);

        // Undo the move
        chessboard[file + rank * 8] = piece;
        chessboard[newFile + newRank * 8] = originalPiece;

        // If the player would be in check, the move is not legal
        return !isInCheckAfterMove;
    });

    return legalMoves;
}



canvas.addEventListener("click", handleCanvasClick);

let currentTurn = WHITE;
let selectedPiece = NONE;
let selectedFile = -1;
let selectedRank = -1;
let legalMoves = [];

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const file = Math.floor(mouseX / squareSize);
    const rank = Math.floor(mouseY / squareSize);

    const clickedPiece = chessboard[file + rank * 8];

    if (clickedPiece !== NONE) {
        if ((clickedPiece & currentTurn) === currentTurn) {
            selectedPiece = clickedPiece;
            selectedFile = file;
            selectedRank = rank;
            legalMoves = getLegalMoves(selectedPiece, file, rank);
        } else {
            if (selectedPiece !== NONE && (clickedPiece & currentTurn) !== currentTurn) {
                // Valid capture
                handlePieceCapture(file, rank);
            } else {
                console.log("pick yo own damn piece.");
            }
        }
    } else if (selectedPiece !== NONE) {
        handlePieceMove(file, rank);
    }
}

function handlePieceMove(newFile, newRank) {
    // Check if the move is legal
    if (!legalMoves.some(([moveFile, moveRank]) => moveFile === newFile && moveRank === newRank)) {
        console.log("Illegal move.");
        return;
    }

    // Check for castling move
    if (selectedPiece === (KING | WHITE) && selectedFile === 4 && (newFile === 2 || newFile === 6)) {
        whiteKingMoved = true;
        // Move the rook as well
        if (newFile === 2) { // Queen-side castling
            chessboard[0 + selectedRank * 8] = NONE;
            chessboard[3 + selectedRank * 8] = ROOK | WHITE;
        } else { // King-side castling
            chessboard[7 + selectedRank * 8] = NONE;
            chessboard[5 + selectedRank * 8] = ROOK | WHITE;
        }
    } else if (selectedPiece === (KING | BLACK) && selectedFile === 4 && (newFile === 2 || newFile === 6)) {
        blackKingMoved = true;
        // Move the rook as well
        if (newFile === 2) { // Queen-side castling
            chessboard[56] = NONE;
            chessboard[59] = ROOK | BLACK;
        } else { // King-side castling
            chessboard[63] = NONE;
            chessboard[61] = ROOK | BLACK;
        }
    } else if (selectedPiece === (KING | WHITE) || selectedPiece === (KING | BLACK)) {
        whiteKingMoved = true;
        blackKingMoved = true;
    }
    
    // Make the move
    chessboard[selectedFile + selectedRank * 8] = NONE;
    chessboard[newFile + newRank * 8] = selectedPiece;

    // Check if the move puts the player in check
    const color = currentTurn;
    currentTurn = currentTurn === WHITE ? BLACK : WHITE; // Temporarily switch turns
    if (isInCheck(color)) {
        console.log("Cannot move into check.");
        // Undo the move
        chessboard[selectedFile + selectedRank * 8] = selectedPiece;
        chessboard[newFile + newRank * 8] = NONE;
        currentTurn = color; // Switch turns back
        return;
    }

    // Clear selection
    selectedPiece = NONE; 
    selectedFile = -1;
    selectedRank = -1;
    legalMoves = [];
}


function handlePieceCapture(targetFile, targetRank) {
    // Check if the move is legal
    if (!legalMoves.some(([moveFile, moveRank]) => moveFile === targetFile && moveRank === targetRank)) {
        console.log("Illegal move.");
        return;
    }

    if (selectedPiece === KING | WHITE) {
        whiteKingMoved = true;
    } else if (selectedPiece === KING | BLACK) {
        blackKingMoved = true;
    } else if (selectedPiece === ROOK | WHITE) {
        if (selectedFile === 0) {
            whiteRookQueenSideMoved = true;
        } else if (selectedFile === 7) {
            whiteRookKingSideMoved = true;
        }
    } else if (selectedPiece === ROOK | BLACK) {
        if (selectedFile === 0) {
            blackRookQueenSideMoved = true;
        } else if (selectedFile === 7) {
            blackRookKingSideMoved = true;
        }
    }

    if (selectedPiece === PAWN | WHITE && selectedFile !== targetFile && chessboard[targetFile + targetRank * 8] === NONE) {
        // White pawn captures en passant
        chessboard[targetFile + (targetRank + 1) * 8] = NONE;
    } else if (selectedPiece === PAWN | BLACK && selectedFile !== targetFile && chessboard[targetFile + targetRank * 8] === NONE) {
        // Black pawn captures en passant
        chessboard[targetFile + (targetRank - 1) * 8] = NONE;
    }
    
    

    // Capture the opponent's piece
    const capturedPiece = chessboard[targetFile + targetRank * 8];
    chessboard[selectedFile + selectedRank * 8] = NONE;
    chessboard[targetFile + targetRank * 8] = selectedPiece;

    // Check if the move puts the player in check
    const color = currentTurn;
    currentTurn = currentTurn === WHITE ? BLACK : WHITE; // Temporarily switch turns
    if (isInCheck(color)) {
        console.log("Cannot move into check.");
        // Undo the move
        chessboard[selectedFile + selectedRank * 8] = selectedPiece;
        chessboard[targetFile + targetRank * 8] = capturedPiece;
        currentTurn = color; // Switch turns back
        return;
    }

    // Clear selection
    selectedPiece = NONE;
    selectedFile = -1;
    selectedRank = -1;
    legalMoves = [];
}


function updateBoard() {
    // Perform any necessary updates (e.g., piece movements, animations)

    // Redraw the board
    drawBoard();

    setTimeout(1)
    // Request the next animation frame
    requestAnimationFrame(updateBoard);
}

// Start the animation loop
updateBoard();

