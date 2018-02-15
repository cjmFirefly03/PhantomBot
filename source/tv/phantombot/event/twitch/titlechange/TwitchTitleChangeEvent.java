/*
 * Copyright (C) 2016-2018 phantombot.tv
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package tv.phantombot.event.twitch.titlechange;

import tv.phantombot.event.twitch.TwitchEvent;

public class TwitchTitleChangeEvent extends TwitchEvent {
    private final String streamTitle;

    /*
     * Class constructor.
     *
     * @param {String} streamTitle
     */
    public TwitchTitleChangeEvent(String streamTitle) {
        this.streamTitle = streamTitle;
    }

    /*
     * Method that returns the stream name
     *
     * @return {String} streamTitle
     */
    public String getTitleTitle() {
        return this.streamTitle;
    }
}
