app.controller("scrbCtrl", ['$http', '$q', '$scope', '$timeout', 'socket', 'randomColor', 'userService', 'boardTileFactory', 'gameFactory', 'wordsFactory', function ($http, $q, $scope, $timeout, socket, randomColor, userService, boardTileFactory, gameFactory, wordsFactory) {
    /*** GAME ***/
    /* services */
    var boardTileService = new boardTileFactory();
    var gameService = new gameFactory();
    var wordService = new wordsFactory();

    /* variables */
    $scope.player = {
        'time': 300,
        'turn': false,
    };
    $scope.bag = [];
    $scope.playerLetters = {};
    $scope.inputs = {};
    $scope.wordHistory = [];
    $scope.letterHistory = [];
    $scope.totalScore = {};
    // $scope.loops = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    $scope.loops = [0, 1, 2];

    $scope.setup = function () {
        $scope.bonuses = gameService.createBoard();
        $scope.boardDisplay = gameService.createBoard();
        $scope.resetInput();
        $scope.totalScore = {
            'mine': 0,
            'opponent': 0,
        };
        // Moved
        // $scope.bag = gameService.createBag();
        // $scope.distributeNewLetters();
    };

    $scope.pushPlayerTurn = function () {
        $scope.player.turn = !$scope.player.turn;
        if ($scope.player.turn) {
            $scope.countdown();
        }
    }

    $scope.countdown = function () {
        countdownStop = $timeout(function () {
            if ($scope.player.time == 0) {
                $scope.stop();
                // $scope.completeRound();
            }
            else {
                if ($scope.player.turn) {
                    $scope.player.time--;
                    $scope.countdown();
                }
            }
        }, 1000);
    };

    $scope.stop = function () {
        $timeout.cancel(countdownStop);
    }

    $scope.tile = function (x, y) {
        return boardTileService.setTile(x, y, $scope.boardDisplay);
    };

    $scope.distributeNewLetters = function () {
        $scope.setupPlayerLetters();
        if ($scope.bag.length < (7 - $scope.playerLetters.list.length)) {
            console.log('Game Over!');
            return;
        }
        $scope.playerLetters.list = gameService.distributeLetters($scope.playerLetters.list, $scope.bag);
        socket.emit('changeGameBag', $scope.bag);
    };

    $scope.setupPlayerLetters = function () {
        $scope.playerLetters = {
            'list': [],
            'selected': 0,
        };
    };

    $scope.resetInput = function () {
        $scope.inputs = {
            'direction': '',
            'reference': '',
            'last': '',
            'length': 0,
            'list': {},
            'words': {},
        };
    };

    $scope.showSelected = function (index) {
        return $scope.playerLetters.list[index].status;
    };

    $scope.getTimeClass = function () {
        if ($scope.player.turn === true) {
            return 'success';
        }
        return 'default';
    }

    // Placing tiles on the board
    $scope.selectLetter = function (index) {
        if ($scope.playerLetters.list[index].status === 'placed') {
            return;
        }
        if ($scope.playerLetters.list[index].status === 'selected') {
            return $scope.undoSelect(index);
        }
        // if ($scope.playerLetters.selected !== null && $scope.playerLetters.list[index].status === 'ready') {
        //     return $scope.adjustLetters(index);
        // }
        // $scope.playerLetters.selected = $scope.playerLetters.list[index].value;
        // $scope.removeAllSelectedClass();
        $scope.addSelectedClass(index);
    };

    $scope.undoSelect = function (index) {
        $scope.removeSelectedClass(index);
    };

    $scope.adjustLetters = function (index) {
        var indexOfSelected = null;

        for (var x in $scope.playerLetters.list) {
            if ($scope.playerLetters.list[x].status === 'selected') {
                indexOfSelected = x;
                break;
            }
        }

        var valueOfReady = $scope.playerLetters.list[index].value;
        $scope.playerLetters.list[index].value = $scope.playerLetters.selected;
        $scope.playerLetters.list[indexOfSelected].value = valueOfReady;
        $scope.playerLetters.selected = null;
        $scope.removeAllSelectedClass();
    };

    $scope.removeAllSelectedClass = function () {
        $scope.playerLetters.list = wordService.removeAllSelectedClass($scope.playerLetters.list);
        $scope.playerLetters.selected = 0;
    };

    $scope.removeAllPlacedClasses = function () {
        $scope.playerLetters.list = wordService.removeAllPlacedClasses($scope.playerLetters.list);
    };

    $scope.removeSelectedClass = function (index) {
        $scope.playerLetters.list = wordService.removeSelectedClass($scope.playerLetters.list, index);
        $scope.playerLetters.selected--;
    };

    $scope.addSelectedClass = function (index) {
        $scope.playerLetters.list = wordService.addSelectedClass($scope.playerLetters.list, index);
        $scope.playerLetters.selected++;
    };

    $scope.selectTile = function (x, y) {
        var tile = boardTileService.convert(x, y);
        if ($scope.canPlace(x, y, tile) === false || $scope.playerLetters.selected === 0 || $scope.player.turn === false) {
            return;
        }
        $scope.addTile(tile);
        $scope.addPlacedClass();
    };

    $scope.canPlace = function (x, y, tile) {
        if ($scope.disabledTile(x, y) === true || $scope.playerLetters.selected === 0) {
            return false;
        }
        if ($scope.boardDisplay[tile] === undefined) {
            return true;
        }
        if ($scope.boardDisplay[tile].length === 1) {
            return false;
        }
    };

    $scope.disabledTile = function (x, y) {
        return $scope.showBoardTiles(x, y) === 'board-tiles-inactive';
    };

    $scope.addPlacedClass = function () {
        $scope.playerLetters.list = wordService.addPlacedClass($scope.playerLetters.list);
    };

    $scope.addTile = function (tile) {
        //@TODO - To be fixed using ng-dialog
        // if ($scope.playerLetters.selected === 'blank') {
        //     return $scope.assignLetterToBlank(tile);
        // }
        $scope.addToInput(tile, false);
    };

    $scope.getNextSelectedPlayerLetter = function () {
        for (var x in $scope.playerLetters.list) {
            if ($scope.playerLetters.list[x].status === 'selected') {
                return $scope.playerLetters.list[x].value;
            }
        }
    }

    $scope.addToInput = function (tile, isBlank) {
        let letter = $scope.getNextSelectedPlayerLetter();
        let userInput = {
          'letter': letter,
          'position': tile,
          'blank': isBlank,
          'intercept': '',
        };
        $scope.boardDisplay[tile] = letter;
        $scope.setInputs(userInput);
        $scope.playerLetters.selected--;
    };

    $scope.setInputs = function (letter) {
        if ($scope.inputs.reference === '') {
            $scope.inputs.reference = letter.position;
        }
        $scope.inputs.last = letter.position;
        $scope.inputs.length = $scope.inputs.length + 1;
        $scope.inputs.list[letter.position] = letter;
    };

    $scope.disablePlayWord = function () {
        if ($scope.inputs.length === 0) {
            return true;
        }
        // if (self.gameRules === true && self.wordHistory.length !== 0) {
        //     return true;
        // }
        return false;
    };

    $scope.disableClearButton = function () {
        return $scope.inputs.length === 0 && $scope.playerLetters.selected === 0;
    };

    $scope.disableSwapButton = function () {
        return $scope.player.turn === false || $scope.playerLetters.selected === 0;
    };

    $scope.swapLetters = function () {
        $scope.playerLetters.list = gameService.swapLetters($scope.playerLetters.list, $scope.bag);
        $scope.playerLetters.selected = 0;
        $scope.pushPlayerTurn();
        socket.emit('changeGameBag', $scope.bag);
    };

    $scope.shuffleLetters = function () {
        $scope.playerLetters.list = gameService.shuffle($scope.playerLetters.list);
    };

    // Playing the word
    $scope.playWord = function () {
        $scope.getFormedWords();

        if ($scope.inputs.words.valid === false) {
            return $scope.notAWord('');
        }

        var requests = [];
        for (var x in $scope.inputs.words.list) {
            var config = { params: { 'word': $scope.inputs.words.list[x].formed } };
            requests.push($http.get('/word', config));
        }
        $q.all(requests).then(function (response) {
            for (var x = 0; x < response.length; x++) {
                if (response[x].data.length === 0) {
                    return $scope.notAWord(response[x].data.word);
                }
            }
            $scope.pushPlayerTurn();
            return $scope.validWords($scope.inputs.words);
        });
    };

    /*$scope.playWord = async function () {
        $scope.getFormedWords();

        if ($scope.inputs.words.valid === false) {
            return $scope.notAWord('');
        }

        for (var x in $scope.inputs.words.list) {
            var config = { params: { 'word': $scope.inputs.words.list[x].formed } };
            // $scope.defer = $q.defer();
            await $http.get('/word', config).then(function (response) {
                if (response.data.length === 0) {
                    $scope.inputs.words.list[x].valid = false;
                    $scope.inputs.words.valid = false
                    // break;
                }
            });
        }

        if ($scope.inputs.words.valid === false) {
            return $scope.notAWord('');
        }

        return $scope.validWords($scope.inputs.words);
    };*/

    $scope.getFormedWords = function () {
        $scope.inputs.words = boardTileService.mapFormedWords($scope.inputs);
    };

    $scope.notAWord = function (word) {
        $scope.wordHistory.push({ 'word': word, 'points': 0, 'definition': 'Not a word!' });
        $scope.resetRound();
    };

    $scope.validWords = function (words) {
        $scope.getPoints(words);
        $scope.playerLetters.list = wordService.removePlacedLetters($scope.playerLetters.list);
        $scope.distributeNewLetters();
        $scope.updateLetterHistory($scope.inputs.list);
        socket.emit('addLetters', $scope.inputs.list);
        $scope.resetInput();
        boardTileService.resetDirection();
    };

    $scope.getPoints = function (words) {
        words.list = gameService.getPoints(words.list);

        for (var x in words.list) {
            $scope.wordHistory.push({ 'word': words.list[x].formed, 'points': words.list[x].points, 'definition': '' });
            $scope.totalScore.mine += words.list[x].points;
        }

        socket.emit('scoreTotal', $scope.totalScore.mine);
    };

    $scope.updateLetterHistory = function (letters) {
        boardTileService.setBoardMap(letters);
        for (var x in letters) {
            $scope.letterHistory.push(letters[x]);
        }
    };

    // Display board tiles at correct opacity
    $scope.showBoardTiles = function (x, y) {
        // if ($scope.wordHistory.length === 0 && $scope.inputs.length === 0) {
        //     return boardTileService.showStartingTile(x, y);
        // }
        var tileToCheck = [x, y];
        if (boardTileService.showLaidTiles(tileToCheck, $scope.inputs.list, $scope.letterHistory) === true) {
            return 'board-tiles-active';
        }
        if ($scope.inputs.length === 0) {
            return 'board-tiles-active';
        }
        if ($scope.inputs.length === 1) {
            return boardTileService.showWhenOneTileLaid(tileToCheck, $scope.inputs);
        }
        return boardTileService.showBoardTiles(tileToCheck, $scope.inputs);
    };

    // Clearing
    $scope.clear = function () {
        $scope.removeTileFromDisplay();
        $scope.removeAllPlacedClasses();
        $scope.removeAllSelectedClass();
        $scope.resetInput();
    };

    $scope.removeTileFromDisplay = function () {
        for (var x in $scope.inputs.list) {
            var letter = $scope.inputs.list[x];
            $scope.boardDisplay[letter.position] = $scope.bonuses[letter.position];
        }
        boardTileService.resetDirection();
    };

    $scope.resetRound = function () {
        $scope.removeTileFromDisplay();
        $scope.resetInput();
        $scope.removeAllPlacedClasses();
    };

    /*** MULTIPLAYER ***/
    var messageWrapper = $('.message-wrapper');
    $scope.hasLogined = false;
    $scope.receiver = "";//默认是群聊
    $scope.publicMessages = [];//群聊消息
    $scope.privateMessages = {};//私信消息
    $scope.messages = $scope.publicMessages;//默认显示群聊
    $scope.users = [];//
    $scope.color = randomColor.newColor();//当前用户头像颜色
    $scope.login = function () {   //登录进入聊天室
        socket.emit("addUser", { nickname: $scope.nickname, color: $scope.color });
    }
    $scope.scrollToBottom = function () {
        messageWrapper.scrollTop(messageWrapper[0].scrollHeight);
    }

    $scope.postMessage = function () {
        var msg = { text: $scope.words, type: "normal", color: $scope.color, from: $scope.nickname, to: $scope.receiver };
        var rec = $scope.receiver;
        if (rec) {  //私信
            if (!$scope.privateMessages[rec]) {
                $scope.privateMessages[rec] = [];
            }
            $scope.privateMessages[rec].push(msg);
        } else { //群聊
            $scope.publicMessages.push(msg);
        }
        $scope.words = "";
        if (rec !== $scope.nickname) { //排除给自己发的情况
            socket.emit("addMessage", msg);
        }
    }
    $scope.setReceiver = function (receiver) {
        $scope.receiver = receiver;
        if (receiver) { //私信用户
            if (!$scope.privateMessages[receiver]) {
                $scope.privateMessages[receiver] = [];
            }
            $scope.messages = $scope.privateMessages[receiver];
        } else {//广播
            $scope.messages = $scope.publicMessages;
        }
        var user = userService.get($scope.users, receiver);
        if (user) {
            user.hasNewMessage = false;
        }
    }

    //收到登录结果
    socket.on('userAddingResult', function (data) {
        if (data.result) {
            $scope.userExisted = false;
            $scope.hasLogined = true;
        } else {//昵称被占用
            $scope.userExisted = true;
        }
    });

    //接收到欢迎新用户消息
    socket.on('userAdded', function (data) {
        if (!$scope.hasLogined) return;
        $scope.publicMessages.push({ text: data.nickname, type: "welcome" });
        $scope.users.push(data);
    });

    //接收到在线用户消息
    socket.on('allUser', function (data) {
        if (!$scope.hasLogined) {
            return;
        }
        $scope.users = data;
        socket.emit('setGameBag', gameService.createBag());
        // if ($scope.users.length === 2) {
            // $scope.pushPlayerTurn();
        // }
    });

    socket.on('gameBagCreated', function(data) {
        $scope.bag = data;
        $scope.distributeNewLetters();
    });

    socket.on('gameBagChanged', function(data) {
        $scope.bag = data;
        $scope.pushPlayerTurn();
    });

    //接收到用户退出消息
    socket.on('userRemoved', function (data) {
        if (!$scope.hasLogined) return;
        $scope.publicMessages.push({ text: data.nickname, type: "bye" });
        for (var i = 0; i < $scope.users.length; i++) {
            if ($scope.users[i].nickname == data.nickname) {
                $scope.users.splice(i, 1);
                return;
            }
        }
    });

    //接收到新消息
    socket.on('messageAdded', function (data) {
        if (!$scope.hasLogined) return;
        if (data.to) { //私信
            if (!$scope.privateMessages[data.from]) {
                $scope.privateMessages[data.from] = [];
            }
            $scope.privateMessages[data.from].push(data);
        } else {//群发
            $scope.publicMessages.push(data);
        }
        var fromUser = userService.get($scope.users, data.from);
        var toUser = userService.get($scope.users, data.to);
        if ($scope.receiver !== data.to) {//与来信方不是正在聊天当中才提示新消息
            if (fromUser && toUser.nickname) {
                fromUser.hasNewMessage = true;//私信
            } else {
                toUser.hasNewMessage = true;//群发
            }
        }
    });

    socket.on('lettersAdded', function (list) {
        $scope.updateLetterHistory(list);
        var unsetList = [];
        for (var x in list) {
            var item = list[x];
            $scope.boardDisplay[item.position] = item.letter;
            unsetList.push(item.position);
        }
        gameService.unsetBonuses(unsetList);
        $scope.pushPlayerTurn();
    });

    socket.on('totalScore', function (points) {
        $scope.totalScore.opponent = points;
    });
}]);

app.directive('message', ['$timeout', function ($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'message.html',
        scope: {
            info: "=",
            self: "=",
            scrolltothis: "&"
        },
        link: function (scope, elem, attrs) {
            scope.time = new Date();
            $timeout(scope.scrolltothis);
            $timeout(function () {
                elem.find('.avatar').css('background', scope.info.color);
            });
        }
    };
}])
    .directive('user', ['$timeout', function ($timeout) {
        return {
            restrict: 'E',
            templateUrl: 'user.html',
            scope: {
                info: "=",
                iscurrentreceiver: "=",
                setreceiver: "&"
            },
            link: function (scope, elem, attrs, chatCtrl) {
                $timeout(function () {
                    elem.find('.avatar').css('background', scope.info.color);
                });
            }
        };
    }]);
