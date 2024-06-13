const directionOffsets = [8, -8, -1, 1, 7, -7, 9, -9];
const squaresToEdge = {};

function moveData() {
    for (let file = 0; file < 8; file++) {
        for (let rank = 0; rank < 8; rank++) {
            const north = 7 - rank;
            const south = rank;
            const west = file;
            const east = 7 - file;

            const squareIndex = rank * 8 + file;

            squaresToEdge[squareIndex] = {
                north,
                south,
                west,
                east,   
                minNW: Math.min(north, west),
                minSE: Math.min(south, east),
                minNE: Math.min(north, east),
                minSW: Math.min(south, west)
            };
        }
    }
}

class Move {
    constructor(startSquare, targetSquare) {
        this.startSquare = startSquare;
        this.targetSquare = targetSquare;
    }
}

const moves = [];

function generateMoves() {
    moves.length = 0; // Clear the existing array

    for (let startSquare = 0; startSquare < 64; startSquare++) {
        const piece = Board.Square[startSquare];
        
        if (Piece.isColour(piece, Board.ColourToMove)) {
            if (Piece.isSlidingPiece(piece)) {
                generateSlidingMoves(startSquare, piece);
            }
            // Add other conditions and move generation logic as needed
        }
    }

    return moves;
}

function generateSlidingMoves(startSquare, piece) {

    let startDirIndex =(Piece.IsType (piece, Piece.BISHOP)) ? 4 : 0;
    let endDirIndex =(Piece.IsType (piece, Piece.ROOK)) ? 4 : 8;

    for (let directionIndex = startDirIndex; directionIndex < endDirIndex; directionIndex++) {
        for (let n = 0; n < squaresToEdge[startSquare][directionIndex]; n++) {
            let targetSquare = startSquare + directionOffsets[directionIndex] * ( n + 1)
            let pieceOnTargetSquare = Board.Square[targetSquare];

            if (Piece.isColour(pieceOnTargetSquare, friendlyColour)) {
                break;
            }

            moves.add(new move (startSquare, targetSquare));

            if (Piece.isColour(pieceOnTargetSquare, opponentColour)){
                break;
            }

            
        }
        
    }
}
