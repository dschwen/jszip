# $Id: cursesio.mak,v 1.1.1.1 2000/05/10 14:20:50 jholder Exp $ 
#!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# WARNING: the curses/ncurses library support is _very_ raw and
#          not quite complete!  Use at your own risk!
#!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# UNIX C makefile for the JZIP Infocom interpreter
#
# If you have:            |  CC=  |  CFLAGS =       |  LIBS =     |
#-------------------------+-------+-----------------+-------------+
#    Linux                |  gcc  |  -c -DPOSIX     |  -lcurses   | 
#                         |       |  -DHAVE_GETOPT  |             |
#    FreeBSD              |  cc   |  -c -DPOSIX     |  -lcurses   | 
#                         |       |  -DHAVE_GETOPT  |             |
#    RS6000 / AIX         |  xlc  |  -c -DAIX       |  -lcurses   |
#    SGI / Irix 4.x       |  cc   |  -c -DPOSIX     |  -lcurses   |
#    SGI / Irix 5.x       |  cc   |  -c -DPOSIX     |  -lcurses   |
#                         |       |  -DHAVE_GETOPT  |             |
#                         |       |  -mips2 -32     |             |
#                         |       |  -O             |             |
#    SGI / Irix 6.x       |  cc   |  -c -DPOSIX     |  -lcurses   |
#                         |       |  -DHAVE_GETOPT  |             |
#                         |       |  -mips3 -n32    |             |
#                         |       |  -O             |             |
#                         |       |  -OPT:Olimit=2500 |           |
#    SPARC / SunOS        |  cc   |  -c -DPOSIX     |  -lcurses   |
#    SPARC /Solaris       |  gcc  |  -c -DPOSIX     |  -lcurses   |
#                         |       |  -DNO_BCOPY     |             |
#                         |       |  -DHAVE_GETOPT  |             |
#    NeXT / Mach          |  cc   |  -c -DBSD       |  -lcurses   |    
#    Alpha / OSF/1        |  cc   |  -c -DPOSIX     |  -lcurses   |
#    HP9000 / HP-UX       |  gcc  |  -c -DPOSIX     |  -lcurses   |
#    HP9000 / HP-UX >10.x |  cc   |  -c -DPOSIX     |  -lcurses   |
#    DEC / Ultrix         |  cc   |  -c -DPOSIX     |  -lcurses   | (not tested)
#
# To try and use ANSI color escape sequences, try adding
# -DHARD_COLORS
# to the CFLAGS line.
#
# To disable Quetzal and use the old Jzip save format, 
# edit ztypes.h and comment out:                      #define USE_QUETZAL
#
# To disable strict zcode checking so the interpreter
# _cannot_ be strict, edit ztypes.h and comment out:  #define STRICTZ
#    
# To enable use of Zlib (gzip compressed games files) add:
# To CFLAGS: -DUSE_ZLIB   
# To LIBS: -lz

CC = gcc

# If your compiler doesn't like this, put -O or nothing.
OPTIMIZE = -O2 
#OPTIMIZE = 
#OPTIMIZE = -pg -ansi -pedantic

CFLAGS = $(OPTIMIZE) -DPOSIX -DHAVE_GETOPT -DHARD_COLORS -DUSE_NCURSES_H -DUSE_ZLIB

LIBS = -lncurses -lz

# -------------------------------------------------------------------
# YOU SHOULD NOT NEED TO MODIFY BELOW HERE
# -------------------------------------------------------------------

INC = ztypes.h jzip.h

OBJS = jzip.o control.o extern.o fileio.o input.o interpre.o math.o memory.o \
	object.o operand.o osdepend.o property.o quetzal.o screen.o text.o \
	variable.o cursesio.o license.o


all  : jzip jzexe ckifzs


jzip : $(OBJS) ztypes.h jzip.h
	$(CC) -o $@ $(CFLAGS) $(OBJS) $(LIBS)

jzexe : jzexe.o jzexe.h
	$(CC) -o $@ $(CFLAGS) jzexe.o

ckifzs : ckifzs.o
	$(CC) -o $@ $(CFLAGS) ckifzs.o


clean :
	-rm -f *.o

realclean :
	-rm -f *.o jzip jzexe ckifzs

DATE = `date +%m%d%Y`
FULLDATE = `date '+%a, %b %d %Y'`
stamp:
	-echo "#define JZIPVER \"Jzip V2.1\"" > ./jzip.h
	-echo "#define JZIPRELDATE \"$(FULLDATE)\"" >> ./jzip.h
archive:
	-tar cvf jzip21-std10-$(DATE).tar *.[c,h] *.txt *.6 *.mak Makefile > /dev/null 2>&1
	-gzip --force jzip21-std10-$(DATE).tar
