# $Id: msqc3.mak,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $ 
PROJ	=jzexe
DEBUG	=0
CC	=qcl
AS	=qcl
CFLAGS_G	= /AL /W3 /Ze 
CFLAGS_D	= /Zi /Zr /Gi$(PROJ).mdt /Od 
CFLAGS_R	= /O /Ol /Gs /DNDEBUG 
CFLAGS	=$(CFLAGS_G) $(CFLAGS_R)
AFLAGS_G	= /Cx /W1 /P1 
AFLAGS_D	= /Zi 
AFLAGS_R	= /DNDEBUG 
AFLAGS	=$(AFLAGS_G) $(AFLAGS_R)
LFLAGS_G	= /CP:0xfff /NOI /SE:0x80 /ST:0x1000 /map 
LFLAGS_D	= /CO /INCR 
LFLAGS_R	= /packcode /exepack 
LFLAGS	=$(LFLAGS_G) $(LFLAGS_R)
RUNFLAGS	=
H = 	jzexe.h msqc3.mak 
OBJS_EXT = 	
LIBS_EXT = 	

.asm.obj: ; $(AS) $(AFLAGS) -c $*.asm

all:	$(PROJ).EXE

jzexe.obj:	jzexe.c $(H)

$(PROJ).EXE:	jzexe.obj $(OBJS_EXT)
	echo >NUL @<<$(PROJ).crf
jzexe.obj +
$(OBJS_EXT)
$(PROJ).EXE

$(LIBS_EXT);
<<
	qlink $(LFLAGS) @$(PROJ).crf

run: $(PROJ).EXE
	$(PROJ) $(RUNFLAGS)

