/**
 * pointSystem.js
 *
 * Manage user loyalty points and export and API to manipulate points in other modules
 * Use the $ API
 */
(function() {
    var rewardCommands = [],
        pointNameSingle = $.getSetIniDbString('pointSettings', 'pointNameSingle', 'point'),
        pointNameMultiple = $.getSetIniDbString('pointSettings', 'pointNameMultiple', 'points');

    /*
     * @class Reward
     *
     * @param {String}  name
     * @param {Number}  cost
     * @param {String} command
     * @param {String} description
     * @param {Number} maxRedemptions
     * @param {Number} viewerLimit
     */
    function Reward(name, command, cost, description, cooldown, maxRedemptions, viewerLimit) {
        this.name = name;
        this.cost = cost;
        this.command = command;
        this.cooldown = cooldown;
        this.description = description;
        this.maxRedemptions = maxRedemptions;
        this.viewerLimit = viewerLimit;
    }

    /*
     * @function loadRewards
     */
    function loadRewards() {
        var rewards = $.inidb.GetKeyList('rewards', ''),
            json,
            pricecom,
            cooldown,
            i;
        for (i in rewards) {
            json = JSON.parse($.inidb.get('rewards', rewards[i]));
            cooldown = $.inidb.get('cooldown', json.command);
            if (!$.commandExists(json.command)) {
                rewardCommands[json.command] = new Reward(rewards[i], json.command, json.cost, json.description, cooldown, json.maxRedemptions, json.viewerLimit);
                $.registerChatCommand('./systems/rewardSystem.js', json.command, 7);
                $.registerChatSubcommand(json.command, 'redeem', 7);
                $.registerChatSubcommand(json.command, 'reset', 1);
            }
        }
    }

    /*
     * @function add
     *
     * @export $.coolDown
     * @param {String}  command
     * @param {Number}  seconds
     * @param {Boolean} isGlobal
     */
    function add(name, command, cost, description, cooldown, maxRedemptions, viewerLimit) {
        if (rewardCommands[command] === undefined) {
            rewardCommands[command] = new Reward(name, command, cost, description, cooldown, maxRedemptions, viewerLimit);
            $.inidb.set('rewards', name, JSON.stringify({description: String(description), cost: String(cost), command: String(command.toLowerCase()), cooldown: String(cooldown), maxRedemptions: String(maxRedemptions), viewerLimit: String(viewerLimit)}));
        } else {
            rewardCommands[command].name = name;
            rewardCommands[command].command = command;
            rewardCommands[command].cost = cost;
            rewardCommands[command].description = description;
            rewardCommands[command].cooldown = cooldown;
            rewardCommands[command].maxRedemptions = maxRedemptions;
            rewardCommands[command].viewerLimit = viewerLimit;
            $.inidb.set('rewards', name, JSON.stringify({description: String(description), cost: String(cost), command: String(command.toLowerCase()), cooldown: String(cooldown), maxRedemptions: String(maxRedemptions), viewerLimit: String(viewerLimit)}));
        }
    }

    function fulfillReward(user, id, value) {
        var userRedemptions = JSON.parse($.inidb.get('redemptions', user)).redemptions;
        var oldRedemption = userRedemptions[id];
        userRedemptions[id] = {reward: String(oldRedemption.reward), date: String(oldRedemption.date), fulfillment: String(value)};
        $.inidb.set('redemptions', user, convertToString({redemptions : userRedemptions}));
    }
    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender().toLowerCase(),
            username = $.username.resolve(sender, event.getTags()).toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath points - Announce points in chat when no parameters are given.
         */
        if (rewardCommands[command] !== undefined) {
            var rewardCounts,
                users = [],
                redemptions = [],
                amount = 0,
                reward = rewardCommands[command];
            if (!action) {
                $.say($.lang.get('rewards.usage', command));
            } else if (action.equalsIgnoreCase('redeem')) {
                if ($.getUserPoints(username) < parseInt(reward.cost)) {
                    $.say($.lang.get('rewards.needpoints', command, $.getPointsString(parseInt(reward.cost)), username, $.getPointsString($.getUserPoints(username))));
                    return;
                }

                if ($.inidb.exists('rewardsCounts', reward.name)) {
                    rewardCounts = JSON.parse($.inidb.get('rewardsCounts', reward.name));
                    rewardCounts.users.forEach(function(u) { users.push(String(u)); });
                    amount = parseInt(rewardCounts.times);
                }
                users.push(String(username));

                if (!isNaN(parseInt(reward.maxRedemptions)) && (amount + 1) > parseInt(reward.maxRedemptions)) {
                    $.say($.lang.get('rewards.maxreached', command, rewardCommands[command].maxRedemptions));
                    return;
                }

                if (!isNaN(parseInt(reward.viewerLimit))) {
                    var count = {};
                    users.forEach(function(x) { count[x] = (count[x] || 0)+1; });
                    if (count[username] !== undefined && (count[username] + 1) > parseInt(reward.viewerLimit)) {
                        $.say($.lang.get('rewards.viewerlimitreached', command, username, reward.viewerLimit));
                        return;
                    }
                }

                if ($.inidb.exists('redemptions', username)) {
                    JSON.parse($.inidb.get('redemptions', username)).redemptions.forEach(function (r) {
                        redemptions.push(r);
                    });
                }

                redemptions.push({reward: String(reward.name), date: String((new Date()).getTime()), fulfillment: String(false)});

                $.inidb.set('rewardsCounts', reward.name, convertToString({users: users, times: String(amount + 1)}));
                $.inidb.set('redemptions', username, convertToString({redemptions : redemptions}));
                $.inidb.decr('points', username, parseInt(reward.cost));
                $.say($.lang.get('rewards.redeem', command, username));
                return;
            }
            else if (action.equalsIgnoreCase('reset')) {
                if ($.inidb.exists('rewardsCounts', command)) {
                    rewardCounts = JSON.parse($.inidb.get('rewardsCounts', command));
                    $.say('rewardsCounts rest forEach');
                    rewardCounts.users.forEach(function(u) { users.push(u); });
                }
                $.inidb.set('rewardsCounts', reward.name, JSON.stringify({users: String([]), times: String(0)}));
                $.say($.lang.get('rewards.reset', command));
                return;
            }
        }
        if (command.equalsIgnoreCase('redemptions')) {
            if ($.inidb.exists('redemptions', username)) {
                var userRedemptions = JSON.parse($.inidb.get('redemptions', username)).redemptions,
                    redemptionsStringBuffer = [],
                    count = {};
                userRedemptions.forEach(function(x) {
                    if (x.fulfillment == 'false') {
                        count[x.reward] = (count[x.reward] || 0)+1;
                    }
                });

                for (var prop in count) {
                    redemptionsStringBuffer.push(prop + ' x' + count[prop]);
                }
                if (redemptionsStringBuffer.length > 0) {
                    $.say($.lang.get('rewards.redemptions', username, redemptionsStringBuffer.join(', ')));
                }
                else {
                    $.say($.lang.get('rewards.noredemptions', username));
                }
            }
        }
        if (command.equalsIgnoreCase('makeitrain')) {
            if (action.equalsIgnoreCase('redeem')) {
                var lastAmount = 0,
                    amount = 30,
                    cost = amount * 2;

                if (isNaN(amount)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.makeitrain.usage'));
                    return;
                }

                if (amount < 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('pointsystem.makeitrain.error.negative', pointNameMultiple));
                    return;
                }

                for (i in $.users) {
                    $.inidb.incr('points', $.users[i][0].toLowerCase(), amount);
                }

                $.inidb.decr('points', username, parseInt(cost));
                $.say($.lang.get('rewards.makeitrain.success', username, action, pointNameMultiple));
            }
        }
    });

    function convertToString(obj) {
        //create an array that will later be joined into a string.
        var string = [];

        //is object
        //    Both arrays and objects seem to return "object"
        //    when typeof(obj) is applied to them. So instead
        //    I am checking to see if they have the property
        //    join, which normal objects don't have but
        //    arrays do.

        if (obj == undefined) {
            return String(obj);
        } else if (typeof(obj) == "object" && (obj.join == undefined)) {
            for (prop in obj) {
                if (new Object(obj).hasOwnProperty(prop)) {
                    string.push(JSON.stringify(prop) + ": " + convertToString(obj[prop]));
                }
            };
            return "{" + string.join(", ") + "}";

            //is array
        } else if (typeof(obj) == "object" && !(obj.join == undefined)) {
            for(prop in obj) {
                string.push(convertToString(obj[prop]));
            }
            return "[" + string.join(", ") + "]";

            //is function
        } else if (typeof(obj) == "function") {
            string.push(obj.toString())

            //all other values can be done with JSON.stringify
        } else {
            string.push(JSON.stringify(obj))
        }

        return string.join(",");
    }

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./systems/rewardSystem.js')) {
            loadRewards();
            $.registerChatCommand('./systems/rewardSystem.js', 'redemptions', 7);
            $.registerChatSubcommand('makeitrain', 'redeem', 7);
        }
    });

    /*
     * @event panelWebSocket
     */
    $.bind('panelWebSocket', function(event) {
        if (event.getScript().equalsIgnoreCase('./systems/rewardSystem.js')) {
            if (event.getArgs()[0] == 'remove') {
                if (rewardCommands[event.getArgs()[1].toLowerCase()] !== undefined) {
                    delete rewardCommands[event.getArgs()[1].toLowerCase()];
                    $.unregisterChatCommand(event.getArgs()[1].toLowerCase());
                    $.coolDown.remove(event.getArgs()[1].toLowerCase());
                }
            } else if (event.getArgs()[0] == 'add') {
                add(event.getArgs()[2].toLowerCase(), event.getArgs()[1].toLowerCase(), event.getArgs()[3].toLowerCase(), event.getArgs()[4].toLowerCase(), event.getArgs()[5].toLowerCase(), event.getArgs()[6].toLowerCase(), event.getArgs()[7].toLowerCase());
                $.registerChatCommand('./systems/rewardSystem.js', event.getArgs()[1].toLowerCase());
            } else if (event.getArgs()[0] == 'edit') {
                add(event.getArgs()[2].toLowerCase(), event.getArgs()[1].toLowerCase(), event.getArgs()[3].toLowerCase(), event.getArgs()[4].toLowerCase(), event.getArgs()[5].toLowerCase(), event.getArgs()[6].toLowerCase(), event.getArgs()[7].toLowerCase());
            } else if (event.getArgs()[0] == 'fulfill') {
                fulfillReward(event.getArgs()[1].toLowerCase(), event.getArgs()[2].toLowerCase(), event.getArgs()[3].toLowerCase());
            }
        }
    });
    /* Export to the $. API */
    $.loadRewards = loadRewards;
})();