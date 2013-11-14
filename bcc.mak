# $Id: bcc.mak,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $
# Borland C makefile for the ZIP Infocom interpreter

.autodepend
CC = bcc
CFLAGS = -ml -d -DLOUSY_RANDOM -DMSDOS=1 -D__STDC__=1
LD = bcc
LDFLAGS = -ml
LIBS =

INC = ztypes.h
OBJS = jzip.obj control.obj extern.obj fileio.obj input.obj interpre.obj \
        math.obj memory.obj object.obj operand.obj osdepend.obj license.obj\
        property.obj quetzal.obj screen.obj text.obj variable.obj getopt.obj \
        bccio.obj

jzip.exe: $(OBJS)
        $(LD) $(LDFLAGS) @&&!
-e$&
$(OBJS)
$(LIBS)
!

.c.obj:
        $(CC) $(CFLAGS) -c {$. }
