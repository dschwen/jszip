
/* $Id: os2iob.c,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: os2iob.c,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: os2iob.c,v $
 * Revision 1.1.1.1  2000/05/10 14:20:51  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/*
 * os2iob.c
 *
 * specific thread-1 screen I/O routines for OS/2.
 *
 */

/* ZIP2 version Created by John W. Kennedy, May, 1994 */

/* Based on pre-existing mscio.c */

/* Functional improvements over mscio.c: */

/*   Keyboard reading is done in a separate thread, with a timed-out wait, */

/*     so that the CPU is not uselessly devoured; functions for that thread, */

/*     and for that thread alone, are maintained in a separate module */

/*     (os2iot.c) so that they can be compiled with stack probes; all the */

/*     functions in this module and the OS-neutral modules, running in thread */

/*     1 alone, do not need stack probes */

/*   Accomodation is made for screens in color, black-and-white, and */

/*     monochrome modes.  The modes are by discovery, where possible */

/*   Option -b forces black-and-white mode; when determination is impossible, */

/*     either in a window or on a display that doesn't feed back color, */

/*     and -b is not specified, then the question is asked outright */

/*   Screen size is handled by discovery */

/*   Complete support for Beyond Zork navigation keys */

/*   Cursor appears correctly in Bureaucracy forms */

/* Second ZIP2 release additions, June, 1994: */

/*   Bug corrected that made Border Zone loop on input */

/*   Functional improvements compared to DOS ZIP 2.00 */

/*     Screen information is correctly fed back to Z machine */

/*     In V4+, Config byte 0x04 is always set */

/*       (per Graham Nelson, it is "Boldface available") */

/*     CONFIG_EMPHASIS is set for PALETTE_MONOCHROME only */

/*       (per Graham Nelson, it is "Underlining available") */

/*   ^D launches a window displaying, in chronological order, all files */

/*     in the current directory containing exactly the right number of */

/*     bytes to be a save file in the current game */

/*   Options -o for color and -m for monochrome added */

/*   Options -o, -m, and -b invoke MODE command */

/* Third ZIP2 release additions, June, 1995 (source not released) */

/*   Functional improvements compared to DOS ZIP 2.00 */

/*     Version-8 support */

/* Fourth ZIP2 release, July, 1997 */

/*   __STDC__ tests removed from the two OS/2 modules, which require -Se */

/*     (extended-ANSI) compilation, and -Sa (pure-ANSI) used on the rest. */

/*     (IBM VisualAge C/C++ sets __STDC__ only in pure-ANSI mode; it */

/*     appears that the standard does not define whether this or the more */

/*     common ANSI-or-more interpretation is correct.) */

/*   Corrected order-of-magnitude error in keyboard timeout.  (Ouch!  Why */

/*     didn't anyone tell me?) */

/* Fifth ZIP2 release, October, 1997 */

/*   Functional improvements compared to DOS ZIP 2.00 */

/*     Corrected end-of-line erasure (c.f. Jigsaw "style 3. examine frame") */

/*     Corrected MORE logic */

/*     Added F11, F12 and 0/Ins key */

/*     Included Z-machine 1.0 character set (backoff option for Beyond Zork) */

/*     JZIP support added (guarded by #if) to OS/2 modules */

/*     JZIP history buffer added, adapted from bccio.c */

/*     Full Z-machine 1.0 color support, and combination of color and bold supported */

/*     Add -y option to set Tandy bit */

/*     Move cursor to top at end of run */

/*     Options -o, -b and -m are now silently overridden if they conflict with */

/*       reality */

/*     Remove ^D feature, since it won't work with QUETZAL */

/* Sixth ZIP2 release, February, 1999 */

/*   Bring up to JZIP 2.02beta */

/*   Move Tandy bit setting to control.c, where it belongs */

/*   Minor signed/unsigned and other corrections performed while debugging new mscio.c */

/* Seventh ZIP2 release, February, 2000 */

/*   Bring up to JZIP 2.1 */

/*   Corrected some errors in command editing */

/* The following special codes are used for keys that do not exist in the Z machine, */

/*   but are needed by the history buffer */

/* 20000000 Del */

/* 20000001 Ctrl-Left-arrow */

/* 20000002 Ctrl-Right-arrow */

/* From at least 1994 to the present, IBM module BSESUB.H has had the following
     error:  structure VIOMODINFO, field ext_data_addr and
     structure VIOCOLORREG, field colorregaddr are declared as type PCH when
     they are in fact type PCHAR16.  Until IBM fixes this, you _must_ correct
     your BSESUB.H before compiling, or this module will blow up when running
     in full-screen mode */

#include "ztypes.h"

#define INCL_NOCOMMON
#define INCL_DOSPROCESS
#define INCL_DOSSEMAPHORES
#if !defined JZIPVER
#define INCL_DOSSESMGR
#endif
#define INCL_DOSNLS
#define INCL_VIO
#define INCL_KBD
#define INCL_DOSERRORS
#define INCL_NOPMAPI
#include <os2.h>

#include <stddef.h>
#include <stdlib.h>
#include <string.h>

/* Communications with the keyboard thread */
HEV hevKbdReq, hevKbdRsp;
volatile int fKbdOpen = FALSE;
volatile int iKbdChar;
static TID tidKbd = 0;
static int fKbdRequested = FALSE;

#define                 BLACK       0
#define                 BLUE        1
#define                 UNDERSCORE  1
#define                 GREEN       2
#define                 CYAN        3
#define                 RED         4
#define                 MAGENTA     5
#define                 BROWN       6
#define                 WHITE       7

#define                 BRIGHT      0x08
#define                 FLASH       0x10

#define                 PALETTE_NIL             -1
#define                 PALETTE_COLOUR          0
#define                 PALETTE_BLACK_AND_WHITE 1
#define                 PALETTE_MONOCHROME      2
int iPalette = PALETTE_NIL;

static int screen_started = FALSE;
static int cursor_saved = OFF;
static int saved_row = 0;
static int saved_col = 0;
static int current_fg = WHITE;
static int current_bg = BLACK;
static int fgBright = 0;

#if !defined JZIPVER
char fTandy = 0;
char fIBMGraphics = 0;
#endif

/* These items are maintained here instead of by the system */
static char achBlankAttribute[2] = { ' ', ( BLACK << 4 ) | WHITE };
static char achClearAttribute[2] = { ' ', ( BLACK << 4 ) | WHITE };
static int current_row, current_col;


void os2_read_key_thread( void *p );
int os2_read_key_byte( void );
int os2_read_key_byte_timed( int timeout );

#if defined JZIPVER
int BUFFER_SIZE;
char *commands;
static int space_avail;
static int ptr1, ptr2 = 0;
static int end_ptr = 0;
static int row, head_col;

static void get_prev_command( void );
static void get_next_command( void );
static void get_first_command( void );
static void delete_command( void );
static void add_command( char *, int size );
static int display_command( char * );
static int init_char_pos, curr_char_pos;
static int loop, tail_col;
#endif

void initialize_screen( void )
{

   VIOMODEINFO vmi;
   VIOSETULINELOC vsull;
   KBDINFO ki;
   APIRET rc;
   int iPaletteRequested = iPalette;

   if ( !fIBMGraphics )
   {
      /* Set codepage 850; it ought to work, but if it doesn't, there's nothing
       * we can do about it, so don't check the return code */
      VioSetCp( 0, 850, NULLHANDLE );
   }                            /* endif */

   /* There is no VIO interface to reset things like the color palette to
    * "normal", so spawn a MODE command to do it */
   if ( iPalette != PALETTE_NIL )
   {
      static char /* const */ *const apszMode[3] =
      { "Mode\0CO80\0",
         "Mode\0BW80\0",
         "Mode\0Mono\0"
      };
      RESULTCODES rc;

      DosExecPgm( NULL, 0, EXEC_SYNC, apszMode[iPalette], NULL, &rc, "MODE.COM" );
   }                            /* endif */

   /* Black-and-white is always correct, so if it is forced, accept it. */
   /* For the other options, man proposes, but hardware disposes, so verify it */
   if ( iPalette != PALETTE_BLACK_AND_WHITE )
   {
      iPalette = PALETTE_NIL;
   }                            /* endif */

   /* Get the underline location; if < 31, use monochrome palette */
   vsull.cb = sizeof vsull;
   vsull.type = 5;
   rc = VioGetState( &vsull, NULLHANDLE );
   if ( !rc && vsull.scanline < 31 )
   {
      iPalette = PALETTE_MONOCHROME;
   }
   else
   {
      /* Otherwise, get color information */
      /* If the 16 main colors have R==G==B, use black-and-white palette */
      /* If either VioGetState call fails, we still don't know */
      PVIOPALSTATE pvps = _alloca( 38 );

      pvps->cb = 38;
      pvps->type = 0;
      pvps->iFirst = 0;
      if ( !VioGetState( pvps, NULLHANDLE ) )
      {
         VIOCOLORREG vcr;
         int iLimit;

         iLimit = pvps->iFirst + ( pvps->cb - sizeof ( VIOPALSTATE ) ) / sizeof ( USHORT ) + 1;
         vcr.cb = sizeof ( VIOCOLORREG );
         vcr.type = 3;
         vcr.firstcolorreg = 0;
         vcr.numcolorregs = 256;
         vcr.colorregaddr = _alloca( 3 * 256 );
         if ( !VioGetState( &vcr, NULLHANDLE ) )
         {
            int i;

            for ( i = pvps->iFirst; i < iLimit; ++i )
            {
               typedef struct
               {
                  UCHAR uchRed, uchGreen, uchBlue;
               }
               COLOURS;
               COLOURS *pvcrx = &( ( ( COLOURS * ) vcr.colorregaddr )[i - pvps->iFirst] );

               if ( pvcrx->uchRed != pvcrx->uchGreen || pvcrx->uchGreen != pvcrx->uchBlue )
               {
                  break;
               }                /* endif */
            }                   /* endfor */
            if ( i >= iLimit )
            {
               iPalette = PALETTE_BLACK_AND_WHITE;
            }                   /* endif */
         }                      /* endif */
      }                         /* endif */
   }                            /* endif */
   /* If we are still undetermined, it is possible that we are in a */
   /*   window or that we have a dumb CRT; either way, we could still be */
   /*   on black and white hardware, so consider what was requested */
   if ( iPalette == PALETTE_NIL )
   {
      if ( iPaletteRequested == PALETTE_MONOCHROME )
      {
         iPalette = PALETTE_BLACK_AND_WHITE;
      }
      else
      {
         iPalette = iPaletteRequested;
      }                         /* endif */
   }                            /* endif */
   /* If it isn't determined after all that, just ask */
   if ( iPalette == PALETTE_NIL )
   {
      char ch;

      do
      {
         static /* const */ char sz[] = "Do you want color? ";
         KBDKEYINFO kki;

         VioScrollUp( 0, 0, 0xFFFF, 0xFFFF, 0xFFFF, achClearAttribute, NULLHANDLE );
         VioWrtCharStrAtt( sz, sizeof sz - 1, 0, 0, &achBlankAttribute[1], NULLHANDLE );
         VioSetCurPos( 0, sizeof sz - 1, NULLHANDLE );
         KbdCharIn( &kki, IO_WAIT, NULLHANDLE );
         ch = kki.chChar;
      }
      while ( ch != 'y' && ch != 'Y' && ch != 'n' && ch != 'N' ); /* enddo */
      if ( ch == 'n' || ch == 'N' )
      {
         iPalette = PALETTE_BLACK_AND_WHITE;
      }
      else
      {
         iPalette = PALETTE_COLOUR;
      }                         /* endif */
   }                            /* endif */

   /* If we're still in color after all that, set up for color */
   if ( iPalette == PALETTE_COLOUR )
   {
      current_bg = BLUE;
      achClearAttribute[1] = achBlankAttribute[1] = ( BLUE << 4 ) | WHITE;
   }                            /* endif */

   /* Now get the existing rows and columns */
   vmi.cb = sizeof vmi;
   VioGetMode( &vmi, NULLHANDLE );
   if ( screen_rows == 0 )
   {
      screen_rows = vmi.row;
   }                            /* endif */
   if ( screen_cols == 0 )
   {
      screen_cols = vmi.col;
   }                            /* endif */

   /* Now set up the user's desired rows and columns */
   /* If it fails, go to the default */
   vmi.cb = sizeof vmi.cb + sizeof vmi.fbType + sizeof vmi.color + sizeof vmi.col + sizeof vmi.row;
   vmi.col = screen_cols;
   vmi.row = screen_rows;
   if ( VioSetMode( &vmi, NULLHANDLE ) )
   {
      vmi.row = screen_rows = 25;
      vmi.col = screen_cols = 80;
      VioSetMode( &vmi, NULLHANDLE );
   }                            /* endif */

   move_cursor( 1, 1 );
   set_attribute( NORMAL );
   clear_screen(  );

   {

#if defined JZIPVER
      static const char cb = sizeof JZIPVER - 1;
#else
      static /* const */ char sz[] = "ZIP for OS/2 2.0.4";
      static const char cb = sizeof sz - 1;
#endif

      move_cursor( screen_rows / 2 - 1, ( screen_cols - cb ) / 2 );

#if defined JZIPVER
      VioWrtCharStrAtt( JZIPVER, cb, current_row - 1, current_col - 1, &achClearAttribute[1],
                        NULLHANDLE );
#else
      VioWrtCharStrAtt( sz, cb, current_row - 1, current_col - 1, &achClearAttribute[1],
                        NULLHANDLE );
#endif
      current_col += cb;
      move_cursor( current_row, current_col );

   }

   {

      static /* const */ char sz[] = "The story is loading...";
      static const char cb = sizeof sz - 1;

      move_cursor( screen_rows / 2, ( screen_cols - cb ) / 2 );

      VioWrtCharStrAtt( sz, cb, current_row - 1, current_col - 1, &achClearAttribute[1],
                        NULLHANDLE );
      current_col += cb;
      move_cursor( current_row, current_col );

   }

#if defined JZIPVER

   /* set up the history buffer to be the right size */
   commands = ( char * ) malloc( hist_buf_size * sizeof ( char ) );

   if ( commands == NULL )
   {
      /* try again, with smaller buffer if failure */
      if ( hist_buf_size > 1024 )
      {
         commands = ( char * ) malloc( 1024 * sizeof ( char ) );

         if ( commands == NULL )
         {
            fatal( "Could not allocate history buffer." );
         }
         else
         {
            hist_buf_size = 1024;
         }
      }
      else
      {
         fatal( "Could not allocate history buffer." );
      }
   }
   BUFFER_SIZE = hist_buf_size;
   space_avail = hist_buf_size - 1;
   /* I have code that analyzes the history buffer - I must first init */
   /* the history buffer to a known state to insure it will work. */

#endif

   ki.cb = sizeof ki;
   KbdGetStatus( &ki, NULLHANDLE );
   ki.fsMask = KEYBOARD_ECHO_OFF | KEYBOARD_BINARY_MODE;
   KbdSetStatus( &ki, NULLHANDLE );

   /* Set up a semaphore for this thread to unblock the other, */
   /*   and one for the other to respond.  Then start the thread */
   DosCreateEventSem( NULL, &hevKbdReq, 0, FALSE );
   DosCreateEventSem( NULL, &hevKbdRsp, 0, FALSE );
   tidKbd = _beginthread( &os2_read_key_thread, NULL, 12288, NULL );
   fKbdOpen = TRUE;

   screen_started = TRUE;

   h_interpreter = INTERP_MSDOS;

#if defined JZIPVER

   JTERP = INTERP_MSDOS;

#endif

}                               /* initialize_screen */


void restart_screen( void )
{

   zbyte_t config_byte = get_byte( H_CONFIG );

   cursor_saved = OFF;

#if defined JZIPVER
   {
      zbyte_t high = 1, low = 0;

      set_byte( H_STANDARD_HIGH, high );
      set_byte( H_STANDARD_LOW, low );
   }
#endif

   if ( h_type == V3 )
   {
      config_byte |= CONFIG_MAX_DATA | CONFIG_WINDOWS;
      config_byte &= ~0x40 /* not variable pitch */  & ~CONFIG_NOSTATUSLINE;
   }
   else if ( h_type >= V4 )
   {
      config_byte |= 0x04 /* Bold */  | 0x80 /* Timer */ ;
      if ( iPalette == PALETTE_MONOCHROME )
      {
         config_byte |= CONFIG_EMPHASIS;
      }
      else
      {
         config_byte &= ~CONFIG_EMPHASIS;
      }                         /* endif */
      config_byte &= ~0x10 /* no switch to fixed */ ;
      if ( h_type >= V5 )
      {
         config_byte &= ~0x20 /* no sound */ ;
         if ( iPalette == PALETTE_COLOUR )
         {
            config_byte |= CONFIG_COLOUR;
         }
         else
         {
            config_byte &= ~CONFIG_COLOUR;
         }                      /* endif */
      }                         /* endif */
   }                            /* endif */

   set_byte( H_CONFIG, config_byte );

   set_word( H_FLAGS, get_word( H_FLAGS ) & ~GRAPHICS_FLAG & ~0x20 /* Mouse */
             & ~NEW_SOUND_FLAG );

}                               /* restart_screen */


void reset_screen( void )
{

   if ( screen_started == TRUE )
   {
      output_new_line(  );
      output_string( "[Hit any key to exit.]" );
      ( void ) input_character( 0 );

      current_bg = BLACK;
      current_fg = WHITE;
      achClearAttribute[1] = achBlankAttribute[1] = ( BLACK << 4 ) | WHITE;
      clear_screen(  );
      move_cursor( 1, 1 );
      /* We know that the last input-character was not timed, so set */
      /*   fKbdOpen to false and unblock the other thread, which should end */
      fKbdOpen = FALSE;
      DosPostEventSem( hevKbdReq );
      if ( tidKbd )
      {
         DosWaitThread( &tidKbd, DCWW_WAIT );
      }                         /* endif */
   }                            /* endif */

   screen_started = FALSE;

}                               /* reset_screen */


void clear_screen( void )
{

   VioScrollUp( 0, 0, 0xFFFF, 0xFFFF, 0xFFFF, achClearAttribute, NULLHANDLE );
   lines_written = 0;
   if ( h_type >= V4 )
   {
      set_status_size( 0 );
   }                            /* endif */

}                               /* clear_screen */


void create_status_window( void )
{

}                               /* create_status_window */


void delete_status_window( void )
{

}                               /* delete_status_window */


void select_status_window( void )
{

   VIOCURSORINFO vci;

   save_cursor_position(  );
   VioGetCurType( &vci, NULLHANDLE );
   vci.attr = -1;
   VioSetCurType( &vci, NULLHANDLE );

}                               /* select_status_window */


void select_text_window( void )
{

   VIOCURSORINFO vci;

   VioGetCurType( &vci, NULLHANDLE );
   vci.attr = 0;
   VioSetCurType( &vci, NULLHANDLE );
   restore_cursor_position(  );

}                               /* select_text_window */


void clear_line( void )
{

   VioScrollRt( current_row - 1, current_col - 1, current_row - 1, screen_cols - 1, 0xFFFF,
                achClearAttribute, NULLHANDLE );

}                               /* clear_line */


void clear_text_window( void )
{

   VioScrollUp( status_size, 0, screen_rows - 1, screen_cols - 1, 0xFFFF, achClearAttribute,
                NULLHANDLE );

}                               /* clear_text_window */


void clear_status_window( void )
{

   VioScrollUp( 0, 0, status_size - 1, screen_cols - 1, 0xFFFF, achClearAttribute, NULLHANDLE );

}                               /* clear_status_window */


void move_cursor( int row, int col )
{

   current_row = row;
   current_col = col;
   VioSetCurPos( current_row - 1, current_col - 1, NULLHANDLE );

}                               /* move_cursor */


void get_cursor_position( int *row, int *col )
{

   *row = current_row;
   *col = current_col;

}                               /* get_cursor_position */


void save_cursor_position( void )
{

   if ( cursor_saved == OFF )
   {
      saved_row = current_row;
      saved_col = current_col;
      cursor_saved = ON;
   }                            /* endif */

}                               /* save_cursor_position */


void restore_cursor_position( void )
{

   if ( cursor_saved == ON )
   {
      move_cursor( saved_row, saved_col );
      cursor_saved = OFF;
   }                            /* endif */

}                               /* restore_cursor_position */


void set_attribute( int attribute )
{

   int fg, bg, new_fg, new_bg;

   fg = achBlankAttribute[1] & 0x0F;
   bg = achBlankAttribute[1] >> 4;

   if ( attribute == NORMAL )
   {
      new_fg = current_fg;
      new_bg = current_bg;
      fgBright = 0;
   }                            /* endif */

   if ( attribute & REVERSE )
   {
      if ( iPalette == PALETTE_MONOCHROME )
      {
         if ( fg == UNDERSCORE )
         {
            fg == 0;
         }                      /* endif */
      }                         /* endif */
      new_fg = bg;
      new_bg = fg & WHITE;
      fgBright = 0;
   }                            /* endif */

   if ( attribute & BOLD )
   {
      fgBright = BRIGHT;
      new_fg = fg | BRIGHT;
      new_bg = bg;
   }
   else
   {
      fgBright = 0;
   }                            /* endif */

   if ( attribute & EMPHASIS )
   {
      switch ( iPalette )
      {
         case PALETTE_COLOUR:
            new_fg = RED | BRIGHT;
            fgBright = BRIGHT;
            break;
         case PALETTE_BLACK_AND_WHITE:
            new_fg = WHITE | BRIGHT;
            fgBright = BRIGHT;
            break;
         case PALETTE_MONOCHROME:
            new_fg = UNDERSCORE;
            fgBright = 0;
            break;
      }                         /* endswitch */
      new_bg = bg;
   }                            /* endif */

   if ( attribute & FIXED_FONT )
   {
      new_fg = fg;
      new_bg = bg;
      fgBright = 0;
   }                            /* endif */

   achBlankAttribute[1] = ( new_bg << 4 ) | new_fg | fgBright;;

}                               /* set_attribute */


void display_char( int c )
{

   char ch = c;

   switch ( ch )
   {
      case '\n':
         scroll_line(  );
         break;
      case '\a':
         DosBeep( 880, 200 );
         break;
      default:
         VioWrtCharStrAtt( &ch, 1, current_row - 1, current_col - 1, &achBlankAttribute[1],
                           NULLHANDLE );
         ++current_col;
         break;
   }                            /* endswitch */

}                               /* display_char */


static int convert_key( int c )
{

   /* Translate extended keys to Infocom-determined single bytes above 127 */
   switch ( c )
   {
      case 'H':                /* Up arrow */
         c = '\x81';
         break;
      case 'P':                /* Down arrow */
         c = '\x82';
         break;
      case 'K':                /* Left arrow */
         c = '\x83';
         break;
      case 's':                /* Ctrl-Left arrow */
         c = 0x20000001;
         break;
      case 'M':                /* Right arrow */
         c = '\x84';
         break;
      case 't':                /* Ctrl-Right arrow */
         c = 0x20000002;
         break;
      case ';':                /* Function keys F1 to F10 */
      case '<':
      case '=':
      case '>':
      case '?':
      case '@':
      case 'A':
      case 'B':
      case 'C':
      case 'D':
         c = ( c - ';' ) + '\x85';
         break;
      case 133:                /* Function key F11 */
         c = '\x8F';
         break;
      case 134:                /* Function key F12 */
         c = '\x90';
         break;
      case 'R':                /* Ins */
         c = '\x91';
         break;
      case 'S':                /* Del */
         c = 0x20000000;
         break;
      case 'O':                /* End (SW) */
         c = '\x92';
         break;
      case 'Q':                /* PgDn (SE) */
         c = '\x94';
         break;
      case 'G':                /* Home (NW) */
         c = '\x98';
         break;
      case 'I':                /* PgUp (NE) */
         c = ( unsigned char ) '\x9A';
         break;
      case 'L':                /* Unnamed (Walk Around) */
         c = '\x96';
         break;
      default:
         DosBeep( 880, 200 );
         c = 0;
   }                            /* endswitch */
   return c;

}


static int read_key( void )
{

   int c;

   do
   {
      c = os2_read_key_byte(  );
      if ( c != '\0' && c != ( unsigned char ) '\xE0' )
      {
         if ( c == '\x07F' )
         {
            c = '\b';
         }
         else
         {
            if ( c >= ( unsigned char ) '\x80' )
            {
               DosBeep( 880, 200 );
               c = '\0';
            }                   /* endif */
         }                      /* endif */
      }
      else
      {
         int c1 = os2_read_key_byte(  );

         c = convert_key( c1 & 0x3FFFFFFF );
         if ( ( c && 0xFF ) >= 0xFC )
         {
            DosBeep( 880, 200 );
            c = '\0';
         }                      /* endif */
         c |= c1 & 0x40000000;
      }                         /* endif */
   }
   while ( c == 0 );            /* enddo */
   return c;

}                               /* read_key */


static int timed_read_key( int timeout )
{

   int c;

   do
   {
      c = os2_read_key_byte_timed( timeout );
      if ( c != '\0' && c != ( unsigned char ) '\xE0' )
      {
         if ( c == '\x7F' )
         {
            c = '\b';
         }
         else
         {
            if ( c >= ( unsigned char ) '\x80' )
            {
               DosBeep( 880, 200 );
               c = '\0';
            }                   /* endif */
         }                      /* endif */
      }
      else
      {
         int c1 = os2_read_key_byte(  );

         c = convert_key( c1 & 0x3FFFFFFF );
         if ( ( c && 0xFF ) >= 0xFC )
         {
            DosBeep( 880, 200 );
            c = '\0';
         }                      /* endif */
         c |= c1 & 0x40000000;
      }                         /* endif */
   }
   while ( c == 0 );            /* enddo */
   return c;

}                               /* timed_read_key */


#if defined JZIPVER


/*
 * Previous command system
 *
 * Here's how this works:
 *
 * The previous command buffer is BUFFER_SIZE bytes long. After the player
 * presses Enter, the command is added to this buffer, with a trailing '\n'
 * added. The '\n' is used to show where one command ends and another begins.
 *
 * The up arrow key retrieves a previous command. This is done by working
 * backwards through the buffer until a '\n' is found. The down arrow
 * retieves the next command by counting forward. The ptr1 and ptr2
 * values hold the start and end of the currently displayed command.
 *
 * Unlike the BCC version, this requires Scroll-Lock to be on
 *
 * Special Key Summary:
 *
 *  left arrow         - move one character to the left
 *  right arrow        - move one character to the right
 *  ctrl + left arrow  - move one word to the left
 *  ctrl + right arrow - move one word to the right
 *  home               - move to beginning of line
 *  end                - move to end of line
 *  backspace          - delete character to the left of the cursor
 *  delete             - delete character below cursor
 *  cursor up          - get previous command
 *  cursor down        - get next command
 *  page up            - get "oldest" command
 *  page down          - display blank prompt (i.e. clears current line)
 *  esc                - display blank prompt (i.e. clears current line)
 *
 */


static int display_command( char *buffer )
{

   int counter, loop;

   move_cursor( row, head_col );
   clear_line(  );

   /* ptr1 = end_ptr when the player has selected beyond any previously
    * saved command.
    */

   if ( ptr1 == end_ptr )
   {
      return 0;
   }
   else
   {
      /* Put the characters from the save buffer into the variable "buffer".
       * The return value (counter) is the value of *read_size.
       */
      counter = 0;
      for ( loop = ptr1; loop <= ptr2; loop++ )
      {
         buffer[counter] = commands[loop];
         display_char( buffer[counter++] );
      }                         /* endfor */
      return counter;
   }                            /* endif */
}                               /* display_command */


void get_prev_command( void )
{

   /* Checking to see if ptr1 > 0 prevents moving ptr1 and ptr2 into
    * never-never land.
    */

   if ( ptr1 > 0 )
   {

      /* Subtract 2 to jump over any intervening '\n' */
      ptr2 = ptr1 -= 2;

      /* If we've jumped too far, fix it */
      if ( ptr1 < 0 )
      {
         ptr1 = 0;
      }                         /* endif */
      if ( ptr2 < 0 )
      {
         ptr2 = 0;
      }                         /* endif */

      if ( ptr1 > 0 )
      {
         do
         {
            /* Decrement ptr1 until a '\n' is found */
            ptr1--;
         }
         while ( ( commands[ptr1] != '\n' ) && ( ptr1 >= 0 ) );
         /* Then advance back to the position after the '\n' */
         ptr1++;
      }                         /* endif */
   }                            /* endif */

}                               /* get_prev_command */


void get_next_command( void )
{

   if ( ptr2 < end_ptr )
   {
      /* Add 2 to advance over any intervening '\n' */
      ptr1 = ptr2 += 2;
      if ( ptr2 >= end_ptr )
      {
         ptr1 = ptr2 = end_ptr;
      }
      else
      {
         do
         {
            ptr2++;
         }
         while ( ( commands[ptr2] != '\n' ) && ( ptr2 <= end_ptr ) );
         ptr2--;
      }                         /* endif */
   }                            /* endif */

}                               /* get_next_command */


void get_first_command( void )
{

   if ( end_ptr > 1 )
   {
      ptr1 = ptr2 = 0;
      do
      {
         ptr2++;
      }
      while ( commands[ptr2] != '\n' );
      ptr2--;
   }                            /* endif */

}                               /* get_first_command */


/* Deletes entire commands from the beginning of the command buffer */
void delete_command( void )
{


   int loop;

   /* Keep moving the characters in the command buffer one space to the left
    * until a '\n' is found...
    */

   do
   {
      for ( loop = 0; loop < end_ptr; loop++ )
      {
         commands[loop] = commands[loop + 1];
      }                         /* endfor */
      end_ptr--;
      space_avail++;
   }
   while ( commands[0] != '\n' );

   /* ...then delete the '\n' */
   for ( loop = 0; loop < end_ptr; loop++ )
   {
      commands[loop] = commands[loop + 1];
   }                            /* endfor */
   end_ptr--;
   space_avail++;
   ptr1 = ptr2 = end_ptr;

}                               /* delete_command */


void add_command( char *buffer, int size )
{

   int loop, counter;

   /* Add the player's last command to the command buffer */
   counter = 0;
   for ( loop = end_ptr; loop < ( end_ptr + size ); loop++ )
   {
      commands[loop] = buffer[counter++];
   }                            /* endfor */

   /* Add one space for '\n' */
   end_ptr += size + 1;
   ptr1 = ptr2 = end_ptr;
   commands[end_ptr - 1] = '\n';
   space_avail -= size + 1;

}                               /* add_command */


#endif


int input_line( int buflen, char *buffer, int timeout, int *read_size )
{

   int c, col;

#if defined JZIPVER
   get_cursor_position( &row, &col );
   head_col = tail_col = col;
   init_char_pos = curr_char_pos = *read_size;
   ptr1 = ptr2 = end_ptr;
#endif

   for ( ;; )
   {

      /* Read a single keystroke */
      do
      {
         if ( timeout == 0 )
         {
            c = read_key(  );
         }
         else
         {
            c = timed_read_key( timeout );
            if ( c == -1 )
               return -1;
         }                      /* endif */
      }
      while ( c == 0 );         /* enddo */

      switch ( c )
      {

#if defined JZIPVER

         case 0x40000081:      /* Scroll-lock: Up arrow */
            get_prev_command(  );
            curr_char_pos = *read_size = display_command( buffer );
            tail_col = head_col + *read_size;
            break;

         case 0x40000082:      /* Scroll-lock: Down arrow */
            get_next_command(  );
            curr_char_pos = *read_size = display_command( buffer );
            tail_col = head_col + *read_size;
            break;

         case 0x4000009A:      /* Scroll-lock: PgUp */
            get_first_command(  );
            curr_char_pos = *read_size = display_command( buffer );
            tail_col = head_col + *read_size;
            break;

         case 0x40000094:      /* Scroll-lock: PgDn */
         case 0x4000001b:      /* Scroll-lock: Esc */
            ptr1 = ptr2 = end_ptr;
            curr_char_pos = *read_size = display_command( buffer );
            tail_col = head_col + *read_size;
            break;

         case 0x40000083:      /* Scroll-lock: Left arrow */
            get_cursor_position( &row, &col );
            /* Prevents moving the cursor into the prompt */
            if ( col > head_col )
            {
               move_cursor( row, --col );
               curr_char_pos--;
            }                   /* endif */
            break;

         case 0x60000001:      /* Scroll-lock: Ctrl + Left arrow */
            get_cursor_position( &row, &col );
            if ( col > head_col )
            {
               col--;
               curr_char_pos--;
               do
               {
                  /* Decrement until a ' ' is found */
                  col--;
                  curr_char_pos--;
               }
               while ( ( buffer[curr_char_pos] != ' ' ) && ( col >= head_col ) );
               curr_char_pos++;
               move_cursor( row, ++col );
            }
            break;

         case 0x40000084:      /* Scroll-lock: Right arrow */
            get_cursor_position( &row, &col );
            /* Prevents moving the cursor beyond the end of the input line */
            if ( col < tail_col )
            {
               move_cursor( row, ++col );
               curr_char_pos++;
            }                   /* endif */
            break;

         case 0x60000002:      /* Scroll-lock: Ctrl + Right arrow */
            get_cursor_position( &row, &col );
            if ( col < tail_col )
            {
               do
               {
                  /* Increment until a ' ' is found */
                  col++;
                  curr_char_pos++;
               }
               while ( ( buffer[curr_char_pos] != ' ' ) && ( col < tail_col ) );
               if ( col == tail_col )
               {
                  move_cursor( row, tail_col );
               }
               else
               {
                  curr_char_pos++;
                  move_cursor( row, ++col );
               }                /* endif */
            }                   /* endif */
            break;

         case 0x40000092:      /* Scroll-lock: End */
            move_cursor( row, tail_col );
            curr_char_pos = init_char_pos + *read_size;
            break;

         case 0x40000098:      /* Scroll-lock: Home */
            move_cursor( row, head_col );
            curr_char_pos = init_char_pos;
            break;

         case 0x60000000:      /* Scroll-lock: Delete */
            if ( curr_char_pos < *read_size )
            {
               get_cursor_position( &row, &col );
               /* Moves the input line one to the left */
               for ( loop = curr_char_pos; loop < *read_size; loop++ )
               {
                  buffer[loop] = buffer[loop + 1];
               }                /* endfor */
               /* Decrements the end of the input line and the *read_size * value */
               tail_col--;
               ( *read_size )--;
               /* Displays the input line */
               clear_line(  );
               for ( loop = curr_char_pos; loop < *read_size; loop++ )
               {
                  display_char( buffer[loop] );
               }                /* endfor */
               /* Restores the cursor position */
               move_cursor( row, col );
            }                   /* endif */
            break;

#else

         case '\x04':
            {                   /* Control-D */

               STARTDATA sd;
               ULONG ulSessID;
               PID pid;
               char *pszPath = getenv( "COMSPEC" );
               static char szTitle[] = "Save files";
               static char sz1[] = "/C Dir /Od | Find \" ";
               char sz2[10];
               int cch2;
               static char sz3[] = " \"| More && Pause && Exit";
               char *psz;

               cch2 = sprintf( sz2, "%u", ( unsigned ) ( h_restart_size + sizeof stack ) );

               psz = _alloca( sizeof sz1 - 1 + cch2 + sizeof sz3 );

               strcat( strcat( strcpy( psz, sz1 ), sz2 ), sz3 );

               sd.Length = offsetof( STARTDATA, IconFile );
               sd.Related = SSF_RELATED_CHILD;
               sd.FgBg = SSF_FGBG_FORE;
               sd.TraceOpt = SSF_TRACEOPT_NONE;
               sd.PgmTitle = szTitle;
               sd.PgmName = pszPath;
               sd.PgmInputs = psz;
               sd.TermQ = NULL;
               sd.Environment = NULL;
               sd.InheritOpt = SSF_INHERTOPT_PARENT;
               sd.SessionType = SSF_TYPE_DEFAULT;
               DosStartSession( &sd, &ulSessID, &pid );

               break;

            }

#endif

         case '\b':

            /* Delete key action */

            if ( *read_size == 0 )
            {

               /* Ring bell if line is empty */
               DosBeep( 880, 200 );

            }
            else
            {

               char ch = ' ';

               /* Decrement read count */
               --*read_size;
               --curr_char_pos;
               --current_col;

               /* Erase last character typed */
               VioWrtCharStrAtt( &ch, 1, current_row - 1, current_col - 1, &achBlankAttribute[1],
                                 NULLHANDLE );
               move_cursor( current_row, current_col );

            }                   /* endif */

            break;

         default:

            /* Normal key action */

            if ( *read_size == ( buflen - 1 ) )
            {

               /* Ring bell if buffer is full */

               DosBeep( 880, 200 );

            }
            else
            {

               /* Scroll line if return key pressed */

               if ( c == '\r' || c == '\n' )
               {
                  c = '\n';
                  scroll_line(  );
               }                /* endif */

               if ( c == '\n' || c >= ( unsigned char ) '\x80' )
               {
#if defined JZIPVER
                  /* Add the current command to the command buffer */
                  if ( *read_size > space_avail )
                  {
                     do
                     {
                        delete_command(  );
                     }
                     while ( *read_size > space_avail );
                  }             /* endif */
                  if ( *read_size > 0 )
                  {
                     add_command( buffer, *read_size );
                  }             /* endif */
#endif
                  /* Return key if it is a line terminator */

                  /* Beyond Zork wants different keys for the arrow keys (as used */
                  /*   to choose menu options) and for cardinal navigation.  Since */
                  /*   arrows applies only when reading single characters, and */
                  /*   navigation applies only when reading input lines, we can */
                  /*   disambiguate them here */

                  switch ( c )
                  {
                     case '\x81': /* Up arrow */
                        return '\x99'; /* North */
                     case '\x82': /* Down arrow */
                        return '\x93'; /* South */
                     case '\x83': /* Left arrow */
                        return '\x95'; /* West */
                     case '\x84': /* Right arrow */
                        return '\x97'; /* East */
                     default:
                        return ( unsigned char ) c;
                  }             /* endswitch */

               }
               else if ( c < ' ' || c >= 127 )
               {

                  DosBeep( 880, 200 );

               }
               else
               {

                  /* Put key in buffer and display it */

                  buffer[curr_char_pos++] = ( char ) c;
                  if ( *read_size < curr_char_pos )
                     *read_size = curr_char_pos;
                  display_char( c );

               }                /* endif */

            }                   /* endif */

      }                         /* endswitch */

   }                            /* endfor */

}                               /* input_line */


int input_character( int timeout )
{

   int c;

   if ( timeout == 0 )
   {
      c = read_key(  );
   }
   else
   {
      c = timed_read_key( timeout );
   }                            /* endif */

   return c;

}                               /* input_character */


static int os2_read_key_byte( void )
{

   ULONG ulPostCt;

   /* Ensure that the cursor is where it belongs */
   VioSetCurPos( current_row - 1, current_col - 1, NULLHANDLE );

   /* If we have not alredy requested the other thread to read, do it now */
   if ( !fKbdRequested )
   {
      DosPostEventSem( hevKbdReq );
      fKbdRequested = TRUE;
   }                            /* endif */

   /* Either way, it's requested now; wait for it */
   DosWaitEventSem( hevKbdRsp, SEM_INDEFINITE_WAIT );
   DosResetEventSem( hevKbdRsp, &ulPostCt );

   /* We are clear; reset, and return the key */
   fKbdRequested = FALSE;
   return iKbdChar;

}                               /* os2_read_key_byte */


static int os2_read_key_byte_timed( int timeout )
{

   ULONG ulPostCt;
   APIRET rc;

   /* Ensure that the cursor is where it belongs */
   VioSetCurPos( current_row - 1, current_col - 1, NULLHANDLE );

   /* If we have not alredy requested the other thread to read, do it now */
   if ( !fKbdRequested )
   {
      DosPostEventSem( hevKbdReq );
      fKbdRequested = TRUE;
   }                            /* endif */

   /* Either way, it's requested now; wait for it, or for a timeout */
   rc = DosWaitEventSem( hevKbdRsp, timeout * 100 );
   if ( rc == ERROR_TIMEOUT )
   {
      return -1;
   }
   else
   {
      DosResetEventSem( hevKbdRsp, &ulPostCt );
      fKbdRequested = FALSE;
      return iKbdChar;
   }                            /* endif */

}                               /* os2_read_key_byte_timed */


void scroll_line( void )
{

   if ( current_row == screen_rows )
   {
      VioScrollUp( status_size, 0, screen_rows - 1, screen_cols - 1, 1, achClearAttribute,
                   NULLHANDLE );
   }
   else
   {
      current_row++;
   }                            /* endif */
   move_cursor( current_row, 1 );

}                               /* scroll_line */


/*
 * set_colours
 *
 * Sets the screen foreground and background colours.
 *
 */

void set_colours(
#if defined JZIPVER
                    zword_t foreground, zword_t background )
{
#else
                    int foreground, int background )
{
#endif

   int fg, bg;

   /* Translate from Z-code colour values to natural colour values */

   if ( iPalette != PALETTE_COLOUR )
   {

      int colour_map[] = { BLACK, WHITE, WHITE, WHITE, WHITE, WHITE, WHITE, WHITE };

      if ( foreground )
      {
         fg = ( foreground == 1 ) ? WHITE : colour_map[foreground - 2];
      }
      else
      {
         fg = current_fg;
      }                         /* endif */

      if ( background )
      {
         bg = ( foreground == 1 ) ? ( fg == BLACK ) ? WHITE : BLACK : colour_map[background - 2];
      }
      else
      {
         bg = current_bg;
      }                         /* endif */

   }
   else
   {

      int colour_map[] = { BLACK, RED, GREEN, BROWN, BLUE, MAGENTA, CYAN, WHITE };

      if ( foreground )
      {
         fg = ( foreground == 1 ) ? WHITE : colour_map[foreground - 2];
      }
      else
      {
         fg = current_fg;
      }                         /* endif */

      if ( background )
      {
         bg = ( background == 1 ) ? BLUE : colour_map[background - 2];
      }
      else
      {
         bg = current_bg;
      }                         /* endif */

   }                            /* endif */

   /* Set foreground and background colour */

   achBlankAttribute[1] = ( bg << 4 ) | fg | fgBright;

   /* Save new foreground and background colours for restoring colour */

   current_fg = ( int ) fg;
   current_bg = ( int ) bg;;

}                               /* set_colours */


/*
 * codes_to_text
 *
 * Translate Z-code characters to machine specific characters. These characters
 * include line drawing characters and international characters.
 *
 * The routine takes one of the Z-code characters from the following table and
 * writes the machine specific text replacement. The target replacement buffer
 * is defined by MAX_TEXT_SIZE in ztypes.h. The replacement text should be in a
 * normal C, zero terminated, string.
 *
 * Return 0 if a translation was available, otherwise 1.
 *
 *
 */

int codes_to_text( int c, char *s )
{

   /* Characters 24 to 27 (and 179 to 218 in IBM mode) need no translation */

   if ( ( c > 23 && c < 28 ) || ( fIBMGraphics && c > 178 && c < 219 ) )
   {

      s[0] = ( char ) c;
      s[1] = '\0';

      return 0;

   }

   /* International characters need translation */

   if ( c > 154 && c < 224 )
   {

      /*       0     1     2     3     4     5     6     7     8     9 */
      /*  15_                                „     ”          Ž     ™ */
      static char xlat[] = { 0x84, 0x94, 0x81, 0x8E, 0x99,
         /*  16_  š     á     ¯     ®     ‰     ‹     ˜     Ó     Ø       */
         0x9A, 0xE1, 0xAF, 0xAE, 0x89, 0x8B, 0x98, 0xD3, 0xD8, 0xA0,
         /*  17_  ‚     ¡     ¢     £     ì     µ          Ö     à     é */
         0x82, 0xA1, 0xA2, 0xA3, 0xEC, 0xB5, 0x90, 0xD6, 0xE0, 0xE9,
         /*  18_  í     …     Š          ã     —     ·     Ô     Þ     ã */
         0xED, 0x85, 0x8A, 0x8D, 0xE3, 0x97, 0xB7, 0xD4, 0xDE, 0xE3,
         /*  19_  ë     ƒ     ˆ     Œ     “     –     ¶     Ò     ×     â */
         0xEB, 0x83, 0x88, 0x8C, 0x93, 0x96, 0xB6, 0xD2, 0xD7, 0xE2,
         /*  20_  ê     †          ›          Æ     ¤     ä     Ç     ¥ */
         0xEA, 0x86, 0x8F, 0x9B, 0x9D, 0xC6, 0xA4, 0xE4, 0xC7, 0xA5,
         /*  21_  å     ‘     ’     ‡     €     è     Ð     ç     Ñ     œ */
         0xE5, 0x91, 0x92, 0x87, 0x80, 0xE8, 0xD0, 0xE7, 0xD1, 0x9C,
         /*  22_  o     O     ­     ¨ */
         'o', 'O', 0xAD, 0xA8
      };

      s[0] = xlat[c - 155];
      /* Oe and oe digraphs are not available in codepage 850 */
      if ( c == 220 || c == 221 )
      {
         s[1] = 'e';
         s[2] = '\0';
      }
      else
      {
         s[1] = '\0';
      }                         /* endif */
      return 0;
   }                            /* endif */

   return 1;

}                               /* codes_to_text */
