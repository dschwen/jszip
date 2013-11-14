# $Id: os2.mak,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $ 
CFLAGS  =/DNDEBUG /DOS2 /DBUFFER_FILES /Gm+ /Gs+ /Gt+ /O /Qarch=x86 /Qlibansi /Qnolonglong /Sa
LINK    =ilink
LFLAGS  =/exepack:2 /map /packdata /packcode /optfunc /pmtype:vio
H       =ztypes.h jzip.h jzexe.h os2.mak

jzip2.pa@:      jzip.exe jzip.inf ckifzs.exe jzip.txt license.txt readme.txt jzip2.pak os2.mak
        pack2 jzip2.pak /L

jzip.exe:       jzip.obj control.obj extern.obj fileio.obj getopt.obj \
                input.obj interpre.obj license.obj math.obj memory.obj \
                object.obj operand.obj os2iob.obj os2iot.obj osdepend.obj \
                property.obj quetzal.obj screen.obj text.obj variable.obj \
                qc\jzip.exe os2.mak
        $(LINK) $(LFLAGS) /version:2.10 /stub:qc\jzip.exe @<<$*.crf
jzip.obj control.obj extern.obj fileio.obj
getopt.obj input.obj interpre.obj license.obj
math.obj memory.obj object.obj operand.obj os2iob.obj
os2iot.obj osdepend.obj property.obj quetzal.obj
screen.obj text.obj variable.obj /out:$@
<<NOKEEP

jzip.inf:       jzip.ipf os2.mak
        ipfc /i $*

ckifzs.exe:     ckifzs.obj qc\ckifzs.exe os2.mak
        $(LINK) $(LFLAGS) /version:1.0 /stub:qc\ckifzs.exe $*.obj /out:$@

jzip.obj:       jzip.c $(H)

control.obj:    control.c $(H)

extern.obj:     extern.c $(H)

fileio.obj:     fileio.c $(H)

getopt.obj:     getopt.c $(H)

input.obj:      input.c $(H)

interpre.obj:   interpre.c $(H)

license.obj:    license.c $(H)

math.obj:       math.c $(H)

memory.obj:     memory.c $(H)

object.obj:     object.c $(H)

operand.obj:    operand.c $(H)

os2iob.obj:     os2iob.c $(H)
        $(CC) $(CFLAGS) /Se /C $*.c

os2iot.obj:     os2iot.c $(H)
        $(CC) $(CFLAGS) /Gs- /C $*.c

osdepend.obj:   osdepend.c $(H)

property.obj:   property.c $(H)

quetzal.obj:    quetzal.c $(H)

screen.obj:     screen.c $(H)

text.obj:       text.c $(H)

variable.obj:   variable.c $(H)

ckifzs.obj:     ckifzs.c os2.mak
        $(CC) $(CFLAGS) /Gm- /Gt- /C $*.c
