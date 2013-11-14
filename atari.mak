# $Id: atari.mak,v 1.1.1.1 2000/05/10 14:20:50 jholder Exp $
#    Atari ST(e)/TT/Falcon Makefile.
#    (It's really just the Unix makefile with one or two small changes)

CC = gcc
CFLAGS = -O -c -DPOSIX -DATARI -DATARIST
LDFLAGS = -O
LIBS = -ltermcap

INC = ztypes.h
OBJS = jzip.o control.o extern.o fileio.o input.o interpre.o license.o math.o \
	memory.o object.o operand.o osdepend.o property.o quetzal.o screen.o \
	text.o variable.o atariio.o

all: jzip jzexe

jzexe : jzexe.h
	$(CC) -o $@ $(LDFLAGS) $(OBJS)

jzip : $(OBJS)
	$(CC) -o $@ $(LDFLAGS) $(OBJS) $(LIBS)

jzip.o: $(INC) jzip.c extern.c
	$(CC) $(CFLAGS) jzip.c

control.o: $(INC) control.c extern.c
	$(CC) $(CFLAGS) control.c

extern.o: $(INC) extern.c
	$(CC) $(CFLAGS) extern.c

fileio.o: $(INC) fileio.c extern.c
	$(CC) $(CFLAGS) fileio.c

input.o: $(INC) input.c extern.c
	$(CC) $(CFLAGS) input.c

interpre.o: $(INC) interpre.c extern.c
	$(CC) $(CFLAGS) interpre.c

license.o: $(INC) license.c
	$(CC) $(CFLAGS) license.c

math.o: $(INC) math.c extern.c
	$(CC) $(CFLAGS) math.c

memory.o: $(INC) memory.c extern.c
	$(CC) $(CFLAGS) memory.c

object.o: $(INC) object.c extern.c
	$(CC) $(CFLAGS) object.c

operand.o: $(INC) operand.c extern.c
	$(CC) $(CFLAGS) operand.c

osdepend.o: $(INC) osdepend.c extern.c
	$(CC) $(CFLAGS) osdepend.c

property.o: $(INC) property.c extern.c
	$(CC) $(CFLAGS) property.c

quetzal.o: $(INC) quetzal.c extern.c
	$(CC) $(CFLAGS) quetzal.c

screen.o: $(INC) screen.c extern.c
	$(CC) $(CFLAGS) screen.c

text.o: $(INC) text.c extern.c
	$(CC) $(CFLAGS) text.c

variable.o: $(INC) variable.c extern.c
	$(CC) $(CFLAGS) variable.c

unixio.o: $(INC) unixio.c extern.c
	$(CC) $(CFLAGS) unixio.c

clean :
	-rm *.o jzip jzexe
