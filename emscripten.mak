# $Id: unixio.mak,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $ 
# UNIX C makefile for the Jzip Infocom interpreter
#
# If you have:            |  CC=  |  CFLAGS =       |  LIBS =     |
#-------------------------+-------+-----------------+-------------+
#    Linux                |  gcc  |  -c -DPOSIX     |  -ltermcap  | 
#                         |       |  -DHAVE_GETOPT  |             |
#    FreeBSD              |  cc   |  -c -DPOSIX     |  -ltermcap  | 
#                         |       |  -DHAVE_GETOPT  |             |
#    RS6000 / AIX         |  xlc  |  -c -DAIX       |  -ltermcap  |
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
#    SPARC / SunOS        |  cc   |  -c -DPOSIX     |  -ltermcap  |
#    SPARC /Solaris       |  gcc  |  -c -DPOSIX     |  -ltermcap  |
#                         |       |  -DNO_BCOPY     |             |
#                         |       |  -DHAVE_GETOPT  |             |
#    NeXT / Mach          |  cc   |  -c -DBSD       |  -ltermcap  |    
#    Alpha / OSF/1        |  cc   |  -c -DPOSIX     |  -lcurses   |
#    HP9000 / HP-UX       |  gcc  |  -c -DPOSIX     |  -ltermcap  |
#    HP9000 / HP-UX >10.x |  cc   |  -c -DPOSIX     |  -ltermcap  |
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

CC = emcc

# If your compiler doesn't like this, put -O or nothing.
OPTIMIZE = -O2 
#OPTIMIZE = 
#OPTIMIZE = -pg -ansi -pedantic

CFLAGS = $(OPTIMIZE) -DPOSIX -DHAVE_GETOPT -DHARD_COLORS 
#-DUSE_ZLIB

#LIBS = -lcurses
LIBS = -lz -ltermcap

# -------------------------------------------------------------------
# YOU SHOULD NOT NEED TO MODIFY BELOW HERE
# -------------------------------------------------------------------

INC = ztypes.h jzip.h

OBJS = jzip.bc control.bc extern.bc fileio.bc input.bc interpre.bc license.bc \
        math.bc memory.bc object.bc operand.bc osdepend.bc property.bc quetzal.bc \
	screen.bc text.bc variable.bc emscriptenio.bc

%.bc: %.c
	$(CC) $(CFLAGS) $< -o $@

#all  : jzip jzexe ckifzs
all  : jzip.js

jzip.js : $(OBJS) ztypes.h jzip.h
	$(CC) -o $@ $(CFLAGS) $(OBJS) $(LIBS) --embed-file zork2.z3 -s EXPORTED_FUNCTIONS="['_spinupJS','_interpret','_cleanupJS']"

jzip.html : $(OBJS) ztypes.h jzip.h
	$(CC) -o $@ $(CFLAGS) $(OBJS) $(LIBS) --embed-file zork2.z3 --pre-js zork2pre.js

jzexe : jzexe.bc jzexe.h
	$(CC) -o $@ $(CFLAGS) jzexe.o

ckifzs : ckifzs.bc
	$(CC) -o $@ $(CFLAGS) ckifzs.o


clean :
	-rm -f *.bc

realclean :
	-rm -f *bc jzip jzexe ckifzs

DATE = `date +%m%d%Y`
FULLDATE = `date '+%a, %b %d %Y'`
stamp:
	-echo "#define JZIPVER \"Jzip V2.1\"" > ./jzip.h
	-echo "#define JZIPRELDATE \"$(FULLDATE)\"" >> ./jzip.h

archive:
	-tar cvf jzip21-std10-$(DATE).tar *.[c,h] *.txt *.6 *.mak Makefile > /dev/null 2>&1
	-gzip --force jzip21-std10-$(DATE).tar
