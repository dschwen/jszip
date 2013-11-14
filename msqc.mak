# $Id: msqc.mak,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $ 
PROJ	=jzip
DEBUG	=0
CC	=qcl
AS	=qcl
CFLAGS_G	= /AL /W3 /Ze /D__MSDOS__ 
CFLAGS_D	= /Zi /Gi$(PROJ).mdt /Od 
CFLAGS_R	= /O /Ol /Gs /DNDEBUG 
CFLAGS	=$(CFLAGS_G) $(CFLAGS_R)
AFLAGS_G	= /Cx /W1 /P1
AFLAGS_D	= /Zi
AFLAGS_R	= /DNDEBUG
AFLAGS	=$(AFLAGS_G) $(AFLAGS_R)
LFLAGS_G	= /CP:0xfff /NOI /SE:0x80 /ST:0x2000 /map 
LFLAGS_D	= /CO /INCR 
LFLAGS_R	= /packcode /exepack 
LFLAGS	=$(LFLAGS_G) $(LFLAGS_R)
RUNFLAGS	=-o dejavu.z3
H = 	ztypes.h jzip.h jzexe.h msqc.mak 
OBJS_EXT = 	
LIBS_EXT = 	

.asm.obj: ; $(AS) $(AFLAGS) -c $*.asm

all:	$(PROJ).EXE

jzip.obj:	jzip.c $(H)

control.obj:	control.c $(H)

extern.obj:	extern.c $(H)

fileio.obj:	fileio.c $(H)

getopt.obj:	getopt.c $(H)

input.obj:	input.c $(H)

interpre.obj:	interpre.c $(H)

math.obj:	math.c $(H)

memory.obj:	memory.c $(H)

object.obj:	object.c $(H)

operand.obj:	operand.c $(H)

mscio.obj:	mscio.c $(H)

quetzal.obj:	quetzal.c $(H)

screen.obj:	screen.c $(H)

text.obj:	text.c $(H)

variable.obj:	variable.c $(H)

osdepend.obj:	osdepend.c $(H)

property.obj:	property.c $(H)

license.obj:	license.c $(H)

$(PROJ).EXE:	jzip.obj control.obj extern.obj fileio.obj getopt.obj input.obj interpre.obj \
	math.obj memory.obj object.obj operand.obj mscio.obj quetzal.obj screen.obj text.obj \
	variable.obj osdepend.obj property.obj license.obj $(OBJS_EXT)
	echo >NUL @<<$(PROJ).crf
jzip.obj +
control.obj +
extern.obj +
fileio.obj +
getopt.obj +
input.obj +
interpre.obj +
math.obj +
memory.obj +
object.obj +
operand.obj +
mscio.obj +
quetzal.obj +
screen.obj +
text.obj +
variable.obj +
osdepend.obj +
property.obj +
license.obj +
$(OBJS_EXT)
$(PROJ).EXE

$(LIBS_EXT);
<<
	qlink $(LFLAGS) @$(PROJ).crf

run: $(PROJ).EXE
	$(PROJ) $(RUNFLAGS)

