app.factory('userService', function ($rootScope) {
    return {
        get: function (users, nickname) {
            if (users instanceof Array) {
                for (var i = 0; i < users.length; i++) {
                    if (users[i].nickname === nickname) {
                        return users[i];
                    }
                }
            } else {
                return null;
            }
        }
    };
});

