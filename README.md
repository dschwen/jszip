jzip.js [![Build Status](https://travis-ci.org/dschwen/jszip.svg?branch=master)](https://travis-ci.org/dschwen/jszip)
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

Try it live on [http://frost.schwen.de](http://frost.schwen.de/jszip/jzip.html)

Screenshot
----------

![Graham Nelson's "Curses" on jzip.js](http://i.imgur.com/zm1tzW4.png)
The screenshot shows automapping support in the Z-Machine V5 game "Curses" by Graham Nelson. Also note the correct display of the free form status bar.

Help
----

### Automapping

The automapping algorithm in jzip.js has two components:
* Identifying the last movement command
* Identifying the current room

The movement commands are parsed by jzip.js before the command line is passed on to the Z-Machine interpreter. Jzip.js
understands the compass directions in abbreviated (n,e,s,w,ne,nw,se,sw and u,d) and unabbreviated form,
as well as the unabbreviated forms prefixed with ```go``` command. When the command line does not have input focus, the user
can navigate with single keypresses of n,e,s,w,u,d or the numerical keypad (which also allows diagonal movements).

In V3 and below games obtaining the current location is straight forward; it is stored in the global Z-Machine variable 0.

In higher version games the current location is determined by inspecting the parent object of the player object. Determining the
player object is currently done with a simple heuristic, by looking for an object with the name of ```(self object)``` or ```yourself```.


### Autocomplete

Jzip.js creates a dictionary of completable words form the game text that was printed during the last five game turns. Press the tab key to
complete the currently typed word. Press the tab key repeatedly to cycle through all possible completions. Press space, enter, or cursor left/right keys
to accept the suggested completion or continue typing to cancel completion.

Cursor up/down keys cycle through the command line history

### The Map

Click on the gray bar at the right edge of the screen to expand the map view. The map can be panned by dragging the background with the mouse.
Rooms can be rearranged by dragging them around on the map. Hovering a room with the mous will highlight all rooms that have been accessed from the room.
The current location in the game is highlighted with a red aura.

### Saving and Restoring game states

The current state of the game can be save using the ```save``` command, and a previously saved game can be restored with the ```restore``` command.
In either case a dialog with save/restore options will pop up. The games are saved in the standard save game format Quetzal, which many Z-Machine
interpreters can read and write.

Building
--------

JSZip was developed using an early version of emscripten. Fortunately the emscripten-portable SDK tool allows the installation of arbitrary emscripten versions.

[Download emsdk](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html) and replace step 2 of the instructions with

```
# Fetch the latest registry of available tools.
./emsdk update

# Download and install SDK tools version 1.8.2 (from January 2014).
./emsdk install sdk-1.8.2-64bit

# Make the "1.8.2" SDK "active" for the current user. (writes ~/.emscripten file)
./emsdk activate emscripten-1.8.2

# you may need to add the clang location to ~/.emscripten
echo "LLVM_ROOT='$(pwd)/clang/3.2_64bit/bin/'" >> ~/.emscripten

# Activate PATH and other environment variables in the current terminal
source ./emsdk_env.sh
```

Now jszip sould build with `make`. You may notice warnings about missing `z` and `termcap` libraries. Just ignore those for now.
