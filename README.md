jzip.js
=======

An interactive fiction Z-Machine interpreter to play Infocom-style text adventures in your browser.

Jzip.js is based on an emscripten cross-compilation of the commandline Z-Machine interpreter [jzip](http://jzip.sourceforge.net/). On
top of that I added a whole bunch of functions to make playing in the webbrowser more convenient.

* Save games to
  * Local storage (in your brwoser)
  * To your computer (download a Quezal save file that is compatible with many Z-Machine interpreters)
  * Google Drive (to "the cloud", allowing you to play across multiple devices easily)
* Auto completion based on the text outputted by the game
* Auto mapping!
  * Map updated while you play (new rooms are added, room connections updated)
  * Current room highlighted on the map
  * Drag the rooms around to lay out the map like you want it
  * Quickly move between rooms using the numpad and/or n,e,w,s,u,d keys

Example installation
--------------------

Try it live on [http://frost.schwen.de](http://frost.schwen.de)

Screenshot
----------

![Graham Nelson's "Curses" on jzip.js](http://i.imgur.com/zm1tzW4.png)
The screenshot shows automapping support in the Z-Machine V5 game "Curses" by Graham Nelson. Also note the correct display of the free form status bar.

Bugs
----

Currently only z3 games are supported due to the lack of fixed font terminal emulation. Games beyond z3 position
the cursor absolutely to draw their own status lines.
