/**
 * topCommand.js
 *
 * Build and announce lists of top viewers (Highest points, highest time spent in the channel)
 */
(function() {
    var bots = ['moobot', 'nightbot', 'xanbot', 'hnlbot', 'ohbot', 'wizebot', 'vivbot', 'coebot', 'branebot', 'monstercat', 'curseappbot', 'revlobot', 'muxybot', 'faegwent'], // Add your own name that you want to be in the list here.
        amountPoints = $.getSetIniDbNumber('settings', 'topListAmountPoints', 5),
        amountTime = $.getSetIniDbNumber('settings', 'topListAmountTime', 5),
        excludedUsers = $.getSetIniDbString('settings', 'excludedUsers', '');

    /*
     * @function reloadTop
     */
    function reloadTop() {
        amountPoints = $.getIniDbNumber('settings', 'topListAmountPoints');
        amountTime = $.getIniDbNumber('settings', 'topListAmountTime');
        excludedUsers = $.getIniDbString('settings', 'excludedUsers');
    }

    /*
     * @function isTwitchBot
     * @param {string} username
     * @returns {Boolean}
     */
    function isTwitchBot(username) {
        for (var i in bots) {
            if (bots[i].equalsIgnoreCase(username)) {
                return true;
            }
        }

        var users = excludedUsers.split(",");
        for (var i in users) {
            var user = users[i].trim();
            if (user.equalsIgnoreCase(username)) {
                return true;
            }
        }
        return false;
    }

    /*
     * @function getTop5
     *
     * @param {string} iniName
     * @returns {Array}
     */
    function getTop5(iniName) {
        var keys = $.inidb.GetKeysByOrderValue(iniName, '', 'DESC', (iniName.equals('points') ? amountPoints + 1 : amountTime + 1), 0),
            list = [],
            i;

        for (i in keys) {
            if (!$.isBot(keys[i]) && !$.isOwner(keys[i]) && !isTwitchBot(keys[i])) {
                list.push({
                    username: keys[i],
                    value: $.inidb.get(iniName, keys[i])
                });
            }
        }

        list.sort(function(a, b) {
            return (b.value - a.value);
        });

        if (iniName == 'points' || iniName == 'alltimepoints') {
            return list.splice(0, amountPoints);
        } else {
            return list.slice(0, amountTime);
        }
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs(),
            sender = event.getSender(),
            action = args[0];

        /**
         * @commandpath top - Display the top people with the most points
         */
        if (command.equalsIgnoreCase('top')) {
            if (!$.bot.isModuleEnabled('./systems/pointSystem.js')) {
                return;
            }

            var temp = getTop5('points'),
                top = [],
                i;

            for (i in temp) {
                top.push((parseInt(i) + 1) + '. ' + $.resolveRank(temp[i].username) + ' ' + $.getPointsString(temp[i].value));
            }

            $.say($.lang.get('top5.default', amountPoints, $.pointNameMultiple, top.join(', ')));
            return;
        }

        if (command.equalsIgnoreCase('leaderboard')) {
            if (!$.bot.isModuleEnabled('./systems/pointSystem.js')) {
                return;
            }

            var temp = getTop5('alltimepoints'),
                top = [],
                i;

            for (i in temp) {
                top.push((parseInt(i) + 1) + '. ' + $.resolveRank(temp[i].username) + ' ' + $.getPointsString(temp[i].value));
            }

            $.say($.lang.get('top5.alltime', amountPoints, $.pointNameMultiple, top.join(', ')));
            return;
        }

        /*
         * @commandpath toptime - Display the top people with the most time
         */
        if (command.equalsIgnoreCase('toptime')) {
            var temp = getTop5('time'),
                top = [],
                i;

            for (i in temp) {
                top.push((parseInt(i) + 1) + '. ' + $.resolveRank(temp[i].username) + ' ' + $.getTimeString(temp[i].value, true));
            }

            $.say($.lang.get('top5.default', amountTime, 'time', top.join(', ')));
            return;
        }

        /*
         * @commandpath topamount - Set how many people who will show up in the !top points list
         */
        if (command.equalsIgnoreCase('topamount')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.points.usage'));
                return;
            } else if (action > 15) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.max'));
                return;
            }

            amountPoints = action;
            $.inidb.set('settings', 'topListAmountPoints', amountPoints);
            $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.points.set', amountPoints));
        }

        /*
         * @commandpath toptimeamount - Set how many people who will show up in the !toptime list
         */
        if (command.equalsIgnoreCase('toptimeamount')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.time.usage'));
                return;
            } else if (action > 15) {
                $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.max'));
                return;
            }

            amountTime = action;
            $.inidb.set('settings', 'topListAmountTime', amountTime);
            $.say($.whisperPrefix(sender) + $.lang.get('top5.amount.time.set', amountTime));
        }

        /*
         * Panel command, no command path needed.
         */
        if (command.equalsIgnoreCase('reloadtop')) {
            reloadTop();
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/topCommand.js', 'top', 7);
        $.registerChatCommand('./commands/topCommand.js', 'toptime', 7);
        $.registerChatCommand('./commands/topCommand.js', 'topamount', 1);
        $.registerChatCommand('./commands/topCommand.js', 'toptimeamount', 1);
        $.registerChatCommand('./commands/topCommand.js', 'reloadtop', 1);
        $.registerChatCommand('./commands/topCommand.js', 'leaderboard', 7);
    });
})();
