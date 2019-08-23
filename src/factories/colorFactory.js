app.factory('randomColor', function ($rootScope) {
    return {
        newColor: function () {
            return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6);
        }
    };
});
