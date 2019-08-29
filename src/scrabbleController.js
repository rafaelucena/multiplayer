app.controller("scrbCtrl", ['$scope', 'socket', 'randomColor', 'userService', 'boardTileFactory', 'gameFactory', 'wordsFactory', function ($scope, socket, randomColor, userService, boardTileFactory, gameFactory, wordsFactory) {
    /*** GAME ***/
    /* services */
    var boardTileService = new boardTileFactory();
    var gameService = new gameFactory();
    var wordService = new wordsFactory();

    /* variables */
    $scope.player1Letters = [];
    $scope.inputs = {};
    $scope.words = {};
    $scope.wordHistory = [];
    $scope.letterHistory = [];
    $scope.selected = null;
    // $scope.loops = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    $scope.loops = [0, 1];

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
        if (this.bag.length < (7 - this.player1Letters.length)) {
            console.log('Game Over!');
            return;
        }
        this.player1Letters = gameService.distributeLetters(this.player1Letters, this.bag);
    };

    $scope.resetInput = function () {
        this.inputs = {
            'direction': '',
            'reference': '',
            'last': '',
            'length': 0,
            'list': {},
        };
        this.words = {};
    };

    $scope.showSelected = function (index) {
        return this.player1Letters[index].status;
    };

    // Placing tiles on the board
    $scope.selectLetter = function (index) {
        if (this.player1Letters[index].status === 'placed') {
            return;
        }
        if (this.player1Letters[index].status === 'selected') {
            return this.undoSelect(index);
        }
        if (this.selected !== null && this.player1Letters[index].status === 'ready') {
            return this.adjustLetters(index);
        }
        this.selected = this.player1Letters[index].value;
        this.removeAllSelectedClass();
        this.addSelectedClass(index);
    };

    $scope.undoSelect = function (index) {
        this.selected = null;
        this.removeAllSelectedClass();
    };

    $scope.adjustLetters = function (index) {
        var indexOfSelected = null;

        for (var x in this.player1Letters) {
            if (this.player1Letters[x].status === 'selected') {
                indexOfSelected = x;
                break;
            }
        }

        var valueOfReady = this.player1Letters[index].value;
        this.player1Letters[index].value = this.selected;
        this.player1Letters[indexOfSelected].value = valueOfReady;
        this.selected = null;
        this.removeAllSelectedClass();
    };

    $scope.removeAllSelectedClass = function () {
        this.player1Letters = wordService.removeAllSelectedClass(this.player1Letters);
    };

    $scope.addSelectedClass = function (index) {
        this.player1Letters = wordService.addSelectedClass(this.player1Letters, index);
    };

    // Display board tiles at correct opacity
    $scope.showBoardTiles = function (x, y) {
        if (this.wordHistory.length === 0 && this.inputs.length === 0) {
            return boardTileService.showStartingTile(x, y);
        }
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
