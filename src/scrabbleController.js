app.controller("scrbCtrl", ['$http', '$q', '$scope', 'socket', 'randomColor', 'userService', 'boardTileFactory', 'gameFactory', 'wordsFactory', function ($http, $q, $scope, socket, randomColor, userService, boardTileFactory, gameFactory, wordsFactory) {
    /*** GAME ***/
    /* services */
    var boardTileService = new boardTileFactory();
    var gameService = new gameFactory();
    var wordService = new wordsFactory();

    /* variables */
    $scope.playerLetters = {};
    $scope.inputs = {};
    $scope.wordHistory = [];
    $scope.letterHistory = [];
    // $scope.loops = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    $scope.loops = [0, 1, 2];

    $scope.setup = function () {
        $scope.bag = gameService.createBag();
        $scope.bonuses = gameService.createBoard();
        $scope.boardDisplay = gameService.createBoard();
        this.distributeNewLetters();
        this.resetInput();
    };

    $scope.tile = function (x, y) {
        return boardTileService.setTile(x, y, this.boardDisplay);
    };

    $scope.distributeNewLetters = function () {
        this.setupPlayerLetters();
        if (this.bag.length < (7 - this.playerLetters.list.length)) {
            console.log('Game Over!');
            return;
        }
        this.playerLetters.list = gameService.distributeLetters(this.playerLetters.list, this.bag);
    };

    $scope.setupPlayerLetters = function () {
        this.playerLetters = {
            'list': [],
            'selected': null
        };
    };

    $scope.resetInput = function () {
        this.inputs = {
            'direction': '',
            'reference': '',
            'last': '',
            'length': 0,
            'list': {},
            'words': {},
        };
    };

    $scope.showSelected = function (index) {
        return this.playerLetters.list[index].status;
    };

    // Placing tiles on the board
    $scope.selectLetter = function (index) {
        if (this.playerLetters.list[index].status === 'placed') {
            return;
        }
        if (this.playerLetters.list[index].status === 'selected') {
            return this.undoSelect(index);
        }
        if (this.playerLetters.selected !== null && this.playerLetters.list[index].status === 'ready') {
            return this.adjustLetters(index);
        }
        this.playerLetters.selected = this.playerLetters.list[index].value;
        this.removeAllSelectedClass();
        this.addSelectedClass(index);
    };

    $scope.undoSelect = function (index) {
        this.playerLetters.selected = null;
        this.removeAllSelectedClass();
    };

    $scope.adjustLetters = function (index) {
        var indexOfSelected = null;

        for (var x in this.playerLetters.list) {
            if (this.playerLetters.list[x].status === 'selected') {
                indexOfSelected = x;
                break;
            }
        }

        var valueOfReady = this.playerLetters.list[index].value;
        this.playerLetters.list[index].value = this.playerLetters.selected;
        this.playerLetters.list[indexOfSelected].value = valueOfReady;
        this.playerLetters.selected = null;
        this.removeAllSelectedClass();
    };

    $scope.removeAllSelectedClass = function () {
        this.playerLetters.list = wordService.removeAllSelectedClass(this.playerLetters.list);
    };

    $scope.removeAllPlacedClasses = function () {
        this.playerLetters.list = wordService.removeAllPlacedClasses(this.playerLetters.list);
    };

    $scope.addSelectedClass = function (index) {
        this.playerLetters.list = wordService.addSelectedClass(this.playerLetters.list, index);
    };

    $scope.selectTile = function (x, y) {
        var tile = boardTileService.convert(x, y);
        if (this.canPlace(x, y, tile) === false) {
            return;
        }
        this.addPlacedClass();
        this.addTile(tile);
    };

    $scope.canPlace = function (x, y, tile) {
        if (this.disabledTile(x, y) === true || this.playerLetters.selected === null) {
            return false;
        }
        if (this.boardDisplay[tile] === undefined) {
            return true;
        }
        if (this.boardDisplay[tile].length === 1) {
            return false;
        }
    };

    $scope.disabledTile = function (x, y) {
        return this.showBoardTiles(x, y) === 'board-tiles-inactive';
    };

    $scope.addPlacedClass = function () {
        this.playerLetters.list = wordService.addPlacedClass(this.playerLetters.list);
    };

    $scope.addTile = function (tile) {
        //@TODO - To be fixed using ng-dialog
        // if (this.playerLetters.selected === 'blank') {
        //     return this.assignLetterToBlank(tile);
        // }
        this.addToInput(tile, false);
    };

    $scope.addToInput = function (tile, isBlank) {
        let userInput = {
          'letter': this.playerLetters.selected,
          'position': tile,
          'blank': isBlank,
          'intercept': '',
        };
        this.boardDisplay[tile] = this.playerLetters.selected;
        this.setInputs(userInput);
        this.playerLetters.selected = null;
    };

    $scope.setInputs = function (letter) {
        if (this.inputs.reference === '') {
            this.inputs.reference = letter.position;
        }
        this.inputs.last = letter.position;
        this.inputs.length = this.inputs.length + 1;
        this.inputs.list[letter.position] = letter;
    };

    $scope.swapLetter = function () {
        this.playerLetters.list = gameService.swapLetter(this.playerLetters.list, this.bag);
        this.playerLetters.selected = null;
    };

    $scope.shuffleLetters = function () {
        this.playerLetters.list = gameService.shuffle(this.playerLetters.list);
    };

    // Display board tiles at correct opacity
    $scope.showBoardTiles = function (x, y) {
        // if (this.wordHistory.length === 0 && this.inputs.length === 0) {
        //     return boardTileService.showStartingTile(x, y);
        // }
        var tileToCheck = [x, y];
        if (boardTileService.showLaidTiles(tileToCheck, this.inputs.list, this.letterHistory) === true) {
            return 'board-tiles-active';
        }
        if (this.inputs.length === 0) {
            return 'board-tiles-active';
        }
        if (this.inputs.length === 1) {
            return boardTileService.showWhenOneTileLaid(tileToCheck, this.inputs);
        }
        return boardTileService.showBoardTiles(tileToCheck, this.inputs);
    };

    // Clearing
    $scope.clear = function () {
        this.removeTileFromDisplay();
        this.removeAllPlacedClasses();
        this.resetInput();
    };

    $scope.removeTileFromDisplay = function () {
        for (var x in this.inputs.list) {
            var letter = this.inputs.list[x];
            this.boardDisplay[letter.position] = this.bonuses[letter.position];
        }
        boardTileService.resetDirection();
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
        if (!$scope.hasLogined) return;
        $scope.users = data;
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
