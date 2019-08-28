app.factory('boardTileFactory', function () {

  var BoardTile = function () {
    this.letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'M', 'N', 'O', 'P', 'Q'];
    this.alphabet = '_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.direction = '';
    this.boardMap = {
      "_": {},
      "A": {},
      "B": {},
      "C": {},
      "D": {},
      "E": {},
      "F": {},
      "G": {},
      "H": {},
      "I": {},
      "J": {},
      "K": {},
      "L": {},
      "M": {},
      "N": {},
      "O": {},
    };
  };

  BoardTile.prototype.setBoardMap = function (letter) {
    var index = letter.position.substring(0, 1);
    this.boardMap[index][letter.position] = letter;
  };

  BoardTile.prototype.hasDirection = function () {
    if (this.direction !== '') {
      return true;
    }
    return false;
  };

  BoardTile.prototype.checkNextTile = function (tileToCheck, placedTile) {
    var tileToCheckCoords = this.reverseConvert(tileToCheck);
    var placedTileCoords = this.reverseConvert(placedTile);
    if (this.direction === 'vertical') {
      return this.isAboveOrBelow(tileToCheckCoords, placedTileCoords);
    } else if (this.direction === 'horizontal') {
      return this.isEitherSide(tileToCheckCoords, placedTileCoords);
    }
    return this.isOnAnySide(tileToCheckCoords, placedTileCoords);
  };

  BoardTile.prototype.mapFormedWords = function (playerInputs) {
    playerInputs = this.mapIntercepts(playerInputs);

    var words = {
      'valid': false,
      'list': [],
    };
    words.list.push(this.getFormedWordDirection(playerInputs, this.direction));
    words.valid = words.list[0].valid;

    for (var a in playerInputs.list) {
      if (playerInputs.list[a].intercept !== '') {
        var intercepted = {
          'direction': playerInputs.list[a].intercept,
          'reference': playerInputs.list[a].position,
          'list': {},
        };
        intercepted.list[a] = {
          'letter': playerInputs.list[a].letter,
        };

        var formedWord = this.getFormedWordDirection(intercepted, intercepted.direction);
        words.list.push(formedWord);
        words.valid = words.valid && formedWord.valid;
      }
    }

    return words;
  }

  BoardTile.prototype.getFormedWordDirection = function (inputs, direction) {
    var baseWordKeys = Object.keys(inputs.list);
    var playerTiles = [];

    var word = {
      'formed': '',
      'length': 0,
      'valid': false,
      'direction': direction,
      'tiles': {},
    };

    for (var a = 1; a <= 15; a++) {
      var address = '';
      if (direction === 'horizontal') {
        address = inputs.reference.substring(0, 1) + a;
      } else {
        address = this.alphabet.charAt(a) + inputs.reference.substring(1);
      }

      if (this.isOnBoard(address)) {
        word.tiles[address] = this.getFromBoard(address);
        word.formed = word.formed + word.tiles[address].letter;
      } else if (inputs.list[address] !== undefined) {
        word.length++;
        word.tiles[address] = inputs.list[address];
        word.formed = word.formed + word.tiles[address].letter;
        playerTiles.push(address);
      } else if (word.formed.length >= 2 && playerTiles.length === baseWordKeys.length) {
        word.valid = true;
        break;
      } else {
        word = {
          'formed': '',
          'length': 0,
          'valid': false,
          'direction': direction,
          'tiles': {},
        };
      }
    }

    return word;
  };

  BoardTile.prototype.mapIntercepts = function (playerInputs) {
    playerInputs.direction = this.direction;

    for (var index in playerInputs.list) {
      var playerInput = this.checkBorders(playerInputs.list[index]);

      if (playerInput.intercept === 'cross') {
        this.direction = 'horizontal';
        playerInputs.direction = 'horizontal';
        playerInput.intercept = 'vertical';
      }

      if (playerInput.intercept !== '' && this.direction === '') {
        this.direction = playerInput.intercept;
        playerInputs.direction = this.direction;
        playerInput.intercept = '';
      }
    };

    return playerInputs;
  };

  BoardTile.prototype.isOnBoard = function (position) {
    return this.boardMap[position.substring(0, 1)][position] !== undefined;
  };

  BoardTile.prototype.getFromBoard = function (position) {
    return this.boardMap[position.charAt(0)][position];
  }

  BoardTile.prototype.checkBorderVertical = function (position) {
    var latitude = position.substring(0, 1);
    var longitude = position.substring(1);
    var index = this.alphabet.indexOf(latitude);

    var previous = this.alphabet.charAt(index - 1) + longitude;
    var next = this.alphabet.charAt(index + 1) + longitude;

    if (this.isOnBoard(previous) || this.isOnBoard(next)) {
      return true;
    }
    return false;
  };

  BoardTile.prototype.checkBorderHorizontal = function (position) {
    var latitude = position.substring(0, 1);
    var longitude = position.substring(1);

    var previous = latitude + (Number(longitude) - 1);
    var next = latitude + (Number(longitude) + 1);

    if (this.isOnBoard(previous) || this.isOnBoard(next)) {
      return true;
    }
    return false;
  };

  BoardTile.prototype.checkBorders = function (playerInput) {
    var intercept = [];

    if (this.direction === 'horizontal' || this.direction === '') {
      if (this.checkBorderVertical(playerInput.position)) {
        intercept.push('vertical');
      }
    }

    if (this.direction === 'vertical' || this.direction === '') {
      if (this.checkBorderHorizontal(playerInput.position)) {
        intercept.push('horizontal');
      }
    }

    if (intercept.length === 2) {
      playerInput.intercept = 'cross';
    } else if (intercept.length === 1) {
      playerInput.intercept = intercept[0];
    }

    return playerInput;
  };

  BoardTile.prototype.resetDirection = function () {
    this.direction = '';
  };

  BoardTile.prototype.setTile = function (x, y, board) {
    var tile = board[this.convert(x, y)];
    if (tile === null) { return; }
    if (tile === undefined) { return 'empty'; }
    if (tile.length === 1 || tile === 'blank') { return 'letter-' + tile; }
    return tile;
  };

  BoardTile.prototype.convert = function (x, y) {
    return this.letters[x] + String(y + 1);
  };

  BoardTile.prototype.reverseConvert = function (tile) {
    var splitTile = _.initial(tile.split(/(\d+)/));
    splitTile[0] = _.indexOf(this.letters, splitTile[0]);
    splitTile[1] = parseInt(splitTile[1], 10) - 1;
    return splitTile;
  };

  BoardTile.prototype.showStartingTile = function (x, y) {
    if (x === 7 && y === 7) {
      return 'board-tiles-active';
    }
    return 'board-tiles-inactive';
  };

  BoardTile.prototype.showBoardTiles = function (tileToCheck, playerInput) {
    if (this.hasDirection() === false) {
      this.determineDirection(playerInput);
    }
    if (this.direction === 'vertical') {
      return this.showTilesLaidVertically(tileToCheck, playerInput);
    } else if (this.direction === 'horizontal') {
      return this.showTilesLaidHorizontally(tileToCheck, playerInput);
    }
  };

  BoardTile.prototype.determineDirection = function (playerInput) {
    if (playerInput.length === 1) {
      return;
    }
    var placedTile = this.reverseConvert(playerInput.reference);
    var tileToCheck = this.reverseConvert(playerInput.last);
    if (this.isAboveOrBelow(tileToCheck, placedTile) === true) {
      this.direction = 'vertical';
    } else if (this.isEitherSide(tileToCheck, placedTile) === true) {
      this.direction = 'horizontal';
    }
  };

  BoardTile.prototype.showLaidTiles = function (tileToCheck, playerInput, letterHistory) {
    var x = tileToCheck[0];
    var y = tileToCheck[1];
    for (var i in playerInput) {
      if (this.convert(x, y) === playerInput[i].position) { return true; }
    }
    for (var j in letterHistory) {
      if (this.convert(x, y) === letterHistory[j].position) { return true; }
    }
  };

  BoardTile.prototype.showWhenOneTileLaid = function (tileToCheck, playerInput) {
    var placedTile = this.reverseConvert(playerInput.reference);
    if (this.isOnAnySide(tileToCheck, placedTile)) {
      return 'board-tiles-active';
    }
    return 'board-tiles-inactive';
  };

  BoardTile.prototype.showTilesLaidHorizontally = function (tileToCheck, playerInput) {
    var placedTile = this.reverseConvert(playerInput.reference);
    if (this.isEitherSide(tileToCheck, placedTile) === true) { return 'board-tiles-active'; }
    placedTile = this.reverseConvert(playerInput.last);
    if (this.isEitherSide(tileToCheck, placedTile) === true) { return 'board-tiles-active'; }
    return 'board-tiles-inactive';
  };

  BoardTile.prototype.showTilesLaidVertically = function (tileToCheck, playerInput) {
    var placedTile = this.reverseConvert(playerInput.reference);
    if (this.isAboveOrBelow(tileToCheck, placedTile) === true) { return 'board-tiles-active'; }
    placedTile = this.reverseConvert(playerInput.last);
    if (this.isAboveOrBelow(tileToCheck, placedTile) === true) { return 'board-tiles-active'; }
    return 'board-tiles-inactive';
  };

  BoardTile.prototype.isOnAnySide = function (tileToCheck, placedTile) {
    return this.isSameTileColumn(tileToCheck, placedTile) || this.isSameTileRow(tileToCheck, placedTile);
  };

  BoardTile.prototype.isEitherSide = function (tileToCheck, placedTile) {
    return this.isSameTileRow(tileToCheck, placedTile);
  };

  BoardTile.prototype.isAboveOrBelow = function (tileToCheck, placedTile) {
    return this.isSameTileColumn(tileToCheck, placedTile);
  };

  BoardTile.prototype.isSameTileRow = function (tileToCheck, placedTile) {
    return placedTile[0] === tileToCheck[0];
  };

  BoardTile.prototype.isSameTileColumn = function (tileToCheck, placedTile) {
    return placedTile[1] === tileToCheck[1];
  };

  return BoardTile;

});
