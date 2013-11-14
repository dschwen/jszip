:userdoc.
:title.JZIP &dash. John's Z-code Interpreter Program
:h1.The JZIP command
:cgraphic.
        ÚÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ¿
                                          ³
JZIP ÄÄÄÄÄÄÄÂÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÂÄÄÄÄÁÄÄÄ
            ÃÄÄÄÄÄ :link refid=optv reftype=fn.-V:elink. ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ´
            ÃÄÄÄÄÄ :link refid=optl reftype=fn.-L lines:elink.      ÄÄÄÄÄ´
            ÃÄÄÄÄÄ :link refid=optc reftype=fn.-C columns:elink.    ÄÄÄÄÄ´
            ÃÄÄÄÄÄ :link refid=optt reftype=fn.-T tmargin:elink.    ÄÄÄÄÄ´
            ÃÄÄÄÄÄ :link refid=optr reftype=fn.-R rmargin:elink.    ÄÄÄÄÄ´
            ÃÄÄÄÄÄ :link refid=optk reftype=fn.-K buffersize:elink. ÄÄÄÄÄ´
            ÃÄÄÄÄÄ :link refid=opty reftype=fn.-Y:elink. ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ´
            ÃÄÄÂÄÄ :link refid=optb reftype=fn.-B:elink. ÄÄÂÄÄÄÄÄÄÄÄÄÄÄÄÄ´
            ³  ÃÄÄ :link refid=opto reftype=fn.-O:elink. ÄÄ´             ³
            ³  ÀÄÄ :link refid=optm reftype=fn.-M:elink. ÄÄÙ             ³
            ÃÄÄÄÄÄ :link refid=optz reftype=fn.-G:elink. ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ´
            ÀÄÄÄÄÄ :link refid=opts reftype=fn.-S level:elink. ÄÄÄÄÄÄÄÄÄÄÙ

ÄÄÄÄÄÄÄÄÄÄ :link refid=file reftype=fn.z-file-name:elink. ÄÄÄÄÄÄÄÄ´
:ecgraphic.
:fn id=optv.
:lines align=center.
-V option&colon.  :hp5.V:ehp5.ersion
:elines.
When this option is given, all other input is ignored, and :hp2.JZIP:ehp2. displays
its own version.
:efn.
:fn id=optl.
:lines align=center.
-L :hp1.lines:ehp1. option&colon.  :hp5.L:ehp5.ines
:elines.
When this option is given, :hp2.JZIP:ehp2. will attempt to set up a window or screen
with :hp1.lines:ehp1. lines.  Otherwise, it will try to use the number
of lines already there.
:efn.
:fn id=optc.
:lines align=center.
-C :hp1.columns:ehp1. option&colon.  :hp5.C:ehp5.olumns
:elines.
When this option is given, :hp2.JZIP:ehp2. will attempt to set up a window or screen
with :hp1.columns:ehp1. columns.  Otherwise, it will try to use the number
of columns already there.
:efn.
:fn id=optt.
:lines align=center.
-T :hp1.tmargin:ehp1. option&colon.  :hp5.T:ehp5.op margin
:elines.
When this option is given, :hp2.JZIP:ehp2. will reserve the first :hp1.tmargin:ehp1.
lines for a margin.  :hp1.tmargin:ehp1. defaults to zero.
:efn.
:fn id=optr.
:lines align=center.
-R :hp1.rmargin:ehp1. option&colon.  :hp5.R:ehp5.ight margin
:elines.
When this option is given, :hp2.JZIP:ehp2. will reserve the last :hp1.rmargin:ehp1.
columns for a margin.  :hp1.rmargin:ehp1. defaults to zero on OS/2.  (In
some non-OS/2 versions of :hp2.JZIP:ehp2., it may default to one.)
:efn.
:fn id=optk.
:lines align=center.
-K :hp1.buffersize:ehp1. option&colon.  :hp5.K:ehp5.ommand buffer
:elines.
:hp2.JZIP:ehp2. remembers recent typed-in commands, and can recall them using the
:hp2.Scroll Lock:ehp2. and arrow keys.  This option gives the size of
the buffer used for the purpose.  The default value is 1024 bytes; values
greater than 16384 are silently reduced to that number.
:efn.
:fn id=opty.
:lines align=center.
-Y option&colon.  Tand:hp5.y:ehp5. bit
:elines.
For reasons of censorship and marketing, certain Infocom games sold
under the Tandy Radio Shack label in the early 1980's had their texts
altered.  In order to do this without maintaining two versions of the
game, Infocom put a run-time test into the game that determined whether
the game was running under the control of the Tandy Z-machine interpreter.
This option will tell those games to present the Tandy version; other 
games will ignore it.
:efn.
:fn id=optb.
:lines align=center.
-B option&colon.  :hp5.B:ehp5.lack and white
:elines.
This option will make :hp2.JZIP:ehp2. run in Black-and-white mode (as with the OS/2
MODE&rbl.BW80 command), which is always possible on OS/2.  Note that
Black-and-white mode (historically associated with the original IBM PC's
Color Graphics Adapter) is not as good as Monochrome mode, but runs in
an OS/2 window, which Monochrome mode does not.  The default is to run
in the mode that the window is already in, but OS/2 does not always give
:hp2.JZIP:ehp2. the ability to detect that, so it will ask if it isn't sure.
:efn.
:fn id=optm.
:lines align=center.
-M option&colon.  :hp5.M:ehp5.onochrome
:elines.
This option will make :hp2.JZIP:ehp2. run in Monochrome mode (as with 
the OS/2 MODE&rbl.MONO command) if possible, or Black-and-white mode
if not.  Monochrome
mode (historically associated with the original IBM PC's Monochrome
Display and Printer Adapter) is superior to Black-and-white mode, but is
available only in an OS/2 Full Screen session.  The default is to run in
the mode that the window is already in, but OS/2 does not always give
:hp2.JZIP:ehp2. the ability to detect that, so it will ask if it isn't sure.
:efn.
:fn id=opto.
:lines align=center.
-O option&colon.  C:hp5.o:ehp5.lor
:elines.
This option will make :hp2.JZIP:ehp2. run in Color mode (as with the 
OS/2 MODE&rbl.CO80
command) if possible, or Monochrome mode if not.  The default is to run
in the mode that the window is already in, but OS/2 does not always give
:hp2.JZIP:ehp2. the ability to detect that, so it will ask if it isn't sure.
:efn.
:fn id=optz.
:lines align=center.
-G option&colon.  Beyond Zork :hp5.g:ehp5.raphics
:elines.
This option will make :hp2.JZIP:ehp2. treat certain bytes in displayed text as
special characters that are used only in the Infocom game "Beyond Zork".
The default is to instead treat those bytes as certain characters used
in non-English languages.
:efn.
:fn id=opts.
:lines align=center.
-S :hp1.level:ehp1. option&colon.  :hp5.S:ehp5.trictness level
:elines.
This option will make :hp2.JZIP:ehp2. take note of certain errors in the use of
the Z machine that interpreters have historically ignored.  The default
is to continue to ignore them.  As a rule, if you are not testing a new
game, setting this level to any other level won't do you much good, but
setting it to 1 or 2 may help you get around a bug.
:dl.
:dthd.Level
:ddhd.Meaning
:dt.0
:dd.Ignore errors
:dt.1
:dd.Report the first error only
:dt.2
:dd.Report all errors
:dt.3
:dd.Report the first error and terminate
:edl.
:efn.
:fn id=file.
:lines align=center.
:hp1.z-file-name:ehp1.&colon.  Game file
:elines.
This is the name of the game file to be executed, and the only mandatory
operand.  The current directory will be searched, along with directories
listed in the :hp2.PATH:ehp2. and :hp2.INFOCOM_PATH:ehp2. environment variables.
:efn.
:p.Z-code is the machine language of the imaginary Z-machine, developed by
Infocom in the late 70's as a compact and portable way to implement text
adventures.  :hp2.JZIP:ehp2. is one of several programs created in the post-Infocom
era to run these programs.  It can implement all the following versions
of the Z-machine.
:dl.
:dthd.Version:ddhd.Meaning
:dt.1:dd.Used only on a few early releases of :hp1.Zork I:ehp1. for the Apple II.
:dt.2:dd.Used only on a few early releases of :hp1.Zork I:ehp1. for the Apple II.
:dt.3:dd.The :hp1.Standard:ehp1. level used by Infocom throughout the early 1980's.
:dt.4:dd.The :hp1.Advanced:ehp1. level used by a few games as a transition to Verison 5.
:dt.5:dd.The :hp1.Extended:ehp1. level used in most of Infocom's later text games.
:dt.8:dd.A post-Infocom version developed by Graham Nelson for his :hp1.Inform:ehp1. compiler system, used for games too large for Version 5.
:edl.
:p.:hp2.JZIP:ehp2. does not implement these versions:
:dl.
:dthd.Version:ddhd.Meaning
:dt.6:dd.A graphical version used by the last few Infocom releases.  A good program to process these games is :hp2.FROTZ:ehp2.;
:hp2.FROTZ:ehp2., however, has no fully-functioning OS/2 version.
:dt.7:dd.An alternative to Version 8, also produced by Graham Nelson.  Since Version 8 proved simpler to use in practice, no
Version 7 game is known ever to have been produced.
:dt.9:dd.An extension beyond Version 8, still in the planning stages.
:dt.10:dd.A combination of Version 9 and Version 6, not even in the planning stages yet.
:edl.
:p.:hp2.JZIP:ehp2. looks for the environment variable :hp2.INFOCOM_PATH:ehp2.
and will use the path found there and in :hp2.PATH:ehp2. to look for the story file specified on
the command line if the story file cannot be found in the current
directory.
:h2.Cursor editing
:p.:hp2.JZIP:ehp2. extends the original game function to allow editing 
of the command line.  In order to ensure that none of these functions 
interfere with game functions, Scroll Lock must be on.

:dl break=all.
:dt.Left arrow
:dd.Move one character to the left.
:dt.Right arrow
:dd.Move one character to the right.
:dt.Ctrl + Left arrow
:dd.Move one word to the left.
:dt.Ctrl + Right arrow
:dd.Move one word to the right.
:dt.Home
:dd.Move to beginning of line.
:dt.End
:dd.Move to end of line.
:dt.Backspace
:dd.Delete character to the left of the cursor.
:dt.Delete
:dd.Delete character below cursor.
:dt.Up arrow
:dd.Get previous command.
:dt.Down arrow
:dd.Get next command.
:dt.Page up
:dd.Get "oldest" command
:dt.Page down
:dd.Display blank prompt (:hp1.i.e.:ehp1. clears current line)
:dt.Esc
:dd.Display blank prompt (:hp1.i.e.:ehp1. clears current line)
:edl.
:h2.Credits
:p.:hp2.JZIP:ehp2. is written and maintained by John Holder
(jholder@frii.com), based on
the ZIP v2.0 sources by Mark Howell and Olaf 'Olsen' Barthel.
:p.The OS/2 version is written and maintained by John W. Kennedy
(rri0189@attglobal.net).
:h2.Availability
:p.The most recent version of :hp2.JZIP:ehp2. can be ftp'ed from ftp.gmd.de,
in the /if-archive/infocom/interpreters/zip/ directory.
:h2.Related USENET groups
:p.Interactive Fiction (IF) authors should check out
news&colon.rec.arts.int-fiction,
and IF players should check out news&colon.rec.games.int-fiction.
:euserdoc.
