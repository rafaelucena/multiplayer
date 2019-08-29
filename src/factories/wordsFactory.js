app.factory('wordsFactory', ['$http', function ($http) {

  var Words = function () { };

  Words.prototype.removePlacedLetters = function (playerLetters) {
    var letters = [];

    for (var x in playerLetters) {
      if (playerLetters[x].status !== 'placed') {
        letters.push(playerLetters[x]);
      }
    }

    return letters;
  };

  Words.prototype.addSelectedClass = function (letters, index) {
    letters[index].status = 'selected';
    return letters;
  };

  Words.prototype.addPlacedClass = function (letters) {
    for (var x in letters) {
      if (letters[x].status === 'selected') {
        letters[x].status = 'placed';
      }
    }

    return letters;
  };

  Words.prototype.removeAllPlacedClasses = function (letters) {
    for (var x in letters) {
      if (letters[x].status === 'placed') {
        letters[x].status = 'ready';
      }
    }

    return letters;
  };

  Words.prototype.removeAllSelectedClass = function (letters) {
    for (var x in letters) {
      if (letters[x].status === 'selected') {
        letters[x].status = 'ready';
      }
    }

    return letters;
  };

  return Words;

}]);
