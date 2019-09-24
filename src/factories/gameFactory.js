app.factory('gameFactory', function () {

  var Game = function () {
    this.bonuses = this.createBoard();
  };

  var letterValues = {
    "a": { "points": 1, "tiles": 9 },
    "b": { "points": 3, "tiles": 2 },
    "c": { "points": 3, "tiles": 2 },
    "d": { "points": 2, "tiles": 4 },
    "e": { "points": 1, "tiles": 12 },
    "f": { "points": 4, "tiles": 2 },
    "g": { "points": 2, "tiles": 3 },
    "h": { "points": 4, "tiles": 2 },
    "i": { "points": 1, "tiles": 9 },
    "j": { "points": 8, "tiles": 1 },
    "k": { "points": 5, "tiles": 1 },
    "l": { "points": 1, "tiles": 4 },
    "m": { "points": 3, "tiles": 2 },
    "n": { "points": 1, "tiles": 6 },
    "o": { "points": 1, "tiles": 8 },
    "p": { "points": 3, "tiles": 2 },
    "q": { "points": 10, "tiles": 1 },
    "r": { "points": 1, "tiles": 6 },
    "s": { "points": 1, "tiles": 4 },
    "t": { "points": 1, "tiles": 6 },
    "u": { "points": 1, "tiles": 4 },
    "v": { "points": 4, "tiles": 2 },
    "w": { "points": 4, "tiles": 2 },
    "x": { "points": 8, "tiles": 1 },
    "y": { "points": 4, "tiles": 2 },
    "z": { "points": 10, "tiles": 1 },
    "blank": { "points": 0, "tiles": 2 }
  };

  Game.prototype.createBoard = function () {
    return {
      'A1': 'tripleword', 'A4': 'doubleletter', 'A8': 'tripleword', 'A12': 'doubleletter', 'A15': 'tripleword',
      'B2': 'doubleword', 'B6': 'tripleletter', 'B10': 'tripleletter', 'B14': 'doubleword',
      'C3': 'doubleword', 'C7': 'doubleletter', 'C9': 'doubleletter', 'C13': 'doubleword',
      'D1': 'doubleletter', 'D4': 'doubleword', 'D8': 'doubleletter', 'D12': 'doubleword', 'D15': 'doubleletter',
      'E5': 'doubleword', 'E11': 'doubleword',
      'F2': 'tripleletter', 'F6': 'tripleletter', 'F10': 'tripleletter', 'F14': 'tripleletter',
      'G3': 'doubleletter', 'G7': 'doubleletter', 'G9': 'doubleletter', 'G13': 'doubleletter',
      'H1': 'tripleword', 'H4': 'doubleletter', 'H8': 'star', 'H12': 'doubleletter', 'H15': 'tripleword',
      'I3': 'doubleletter', 'I7': 'doubleletter', 'I9': 'doubleletter', 'I13': 'doubleletter',
      'J2': 'tripleletter', 'J6': 'tripleletter', 'J10': 'tripleletter', 'J14': 'tripleletter',
      'K5': 'doubleword', 'K11': 'doubleword',
      'L1': 'doubleletter', 'L4': 'doubleword', 'L8': 'doubleletter', 'L12': 'doubleword', 'L15': 'doubleletter',
      'M3': 'doubleword', 'M7': 'doubleletter', 'M9': 'doubleletter', 'M13': 'doubleword',
      'N2': 'doubleword', 'N6': 'tripleletter', 'N10': 'tripleletter', 'N14': 'doubleword',
      'O1': 'tripleword', 'O4': 'doubleletter', 'O8': 'tripleword', 'O12': 'doubleletter', 'O15': 'tripleword',
    };
  };

  Game.prototype.shuffle = function (array) {
    var currentIndex = array.length;
    var temporaryValue, randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };

  Game.prototype.createBag = function () {
    var letters = Object.keys(letterValues);
    var bag = [];
    for (var letter in letters) {
      for (i = 0; i < letterValues[letters[letter]].tiles; i++) {
        bag.push(letters[letter]);
      }
    }
    return this.shuffle(bag);
  };

  Game.prototype.distributeLetters = function (currentLetters, bag) {
    var number = 7 - currentLetters.length;
    for (i = 0; i < number; i++) {
      var x = Math.floor((Math.random() * bag.length));
      var letter = bag.splice(x, 1).join();
      currentLetters.push({ 'value': letter, 'status': 'ready' });
    }
    return currentLetters;
  };

  Game.prototype.swapLetters = function (currentLetters, bag) {
    var keepLetters = [];
    var returnLetters = [];
    for (var x in currentLetters) {
        if (currentLetters[x].status !== 'selected') {
            keepLetters.push(currentLetters[x]);
        } else {
            returnLetters.push(currentLetters[x].value);
        }
    }

    var newLetters = this.distributeLetters(keepLetters, bag);
    bag.push(...returnLetters);
    this.shuffle(bag);

    return newLetters;
  };

  Game.prototype.getPoints = function (words) {
    var unsetList = [];

    for (var x in words) {
      var currentBonuses = {
        'word': 1
      };
      var points = 0;

      for (var i in words[x].tiles) {
        currentBonuses.letter = 1;
        var position = words[x].tiles[i].position;
        currentBonuses = this.getBonuses(position, currentBonuses);
        var letter = this.checkForBlankOrLetter(words[x].tiles[i]);
        points += (letterValues[letter].points * currentBonuses.letter);
        unsetList.push(position);
      }

      points *= currentBonuses.word;
      points = this.bingoBonus(words[x], points);
      words[x].points = points;
    }

    this.unsetBonuses(unsetList);

    return words;
  };

  Game.prototype.getBonuses = function (position, currentBonuses) {
    if (this.bonuses[position] !== undefined) {
      position = this.bonuses[position];
      if (position === 'doubleword') { currentBonuses.word *= 2; }
      if (position === 'tripleword') { currentBonuses.word *= 3; }
      if (position === 'doubleletter') { currentBonuses.letter = 2; }
      if (position === 'tripleletter') { currentBonuses.letter = 3; }
    }
    return currentBonuses;
  };

  Game.prototype.checkForBlankOrLetter = function (tile) {
    if (tile.blank === true) {
      return 'blank';
    }
    return tile.letter;
  };

  Game.prototype.bingoBonus = function (input, total) {
    if (input.length === 7) {
      total += 50;
    }
    return total;
  };

  Game.prototype.unsetBonuses = function (unsetList) {
    for (var x in unsetList) {
      delete this.bonuses[unsetList[x]];
    }
  };

  return Game;
});
