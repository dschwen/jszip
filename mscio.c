
/* $Id: mscio.c,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: mscio.c,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: mscio.c,v $
 * Revision 1.1.1.1  2000/05/10 14:20:51  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/*
 * mscio.c
 *
 * Microsoft C specific screen I/O routines for DOS.
 *
 */

/* Updated by John W. Kennedy, based on OS2IOB, which was originally */

/*   based on the original mscio.c */

/* Functional improvements over original mscio.c: */

/*   Accomodation is made for screens in color, black-and-white, and */

/*     monochrome modes.  The modes are by discovery, where possible. */

/*     On a display that doesn't feed back color, and -b is not specified, */

/*     then the question is asked outright */

/*   Options -o for color and -m for monochrome added */

/*   Screen size is handled by discovery */

/*   Complete support for Beyond Zork navigation keys */

/*   Cursor appears correctly in Bureaucracy forms */

/*   Screen information is correctly fed back to Z machine */

/*   In V4+, Config byte 0x04 is always set */

/*     (per Graham Nelson, it is "Boldface available") */

/*   CONFIG_EMPHASIS is set for PALETTE_MONOCHROME only */

/*     (per Graham Nelson, it is "Underlining available") */

/*   Options -o, -m, and -b reset screen */

/*   Corrected end-of-line erasure (c.f. Jigsaw "style 3. examine frame") */

/*   Corrected MORE logic */

/*   Added F11, F12 and 0/Ins key */

/*   Included Z-machine 1.0 character set (backoff option for Beyond Zork) */

/*   JZIP history buffer added, adapted from bccio.c */

/*   Full Z-machine 1.0 color support, and combination of color and bold supported */

/*   Move cursor to top at end of run */

/*   Options -o, -b and -m are now silently overridden if they conflict with */

/*     reality */

/*   Bring up to JZIP 2.1 */

/* In order to keep Beyond Zork running according to spec, this module, */

/*   unlike bccio.c, wants Scroll Lock turned on in order to use the command */

/*   buffer feature */

#include "ztypes.h"

#include <conio.h>
#include <dos.h>
#include <graph.h>
#include <sys/timeb.h>
#include <sys/types.h>

#define                 BLACK      0
#define                 BLUE       1
#define                 UNDERSCORE 1
#define                 GREEN      2
#define                 CYAN       3
#define                 RED        4
#define                 MAGENTA    5
#define                 BROWN      6
#define                 WHITE      7

#define                 BRIGHT     0x08
#define                 FLASH      0x10

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
static void add_command( char *, int );
static int display_command( char * );
static int init_char_pos, curr_char_pos;
static int loop, tail_col;
#endif


void initialize_screen( void )
{

   struct videoconfig vc;
   char achPalettes[] = { 0, 0, 0 };

   _getvideoconfig( &vc );

   if ( !fIBMGraphics )
   {
      union REGS regsIn, regsOut;

      /* Set codepage 850; it ought to work, but if it doesn't, there's nothing
       * we can do about it, so don't check the return code */
      regsIn.h.ah = 0x66;
      regsIn.h.al = 0x02;
      regsIn.x.bx = 850;
      intdos( &regsIn, &regsOut );
   }                            /* endif */

   switch ( vc.adapter )
   {
      case _MDPA:
         achPalettes[PALETTE_MONOCHROME] = 1;
         break;
      case _CGA:
      case _MCGA:
         achPalettes[PALETTE_COLOUR] = achPalettes[PALETTE_BLACK_AND_WHITE] = 1;
         break;
      default:
         achPalettes[PALETTE_MONOCHROME] = achPalettes[PALETTE_COLOUR] =
               achPalettes[PALETTE_BLACK_AND_WHITE] = 1;
         break;
   }                            /* endswitch */

   if ( iPalette != PALETTE_NIL && !achPalettes[iPalette] )
   {
      switch ( vc.adapter )
      {
         case _MDPA:
            iPalette = PALETTE_MONOCHROME;
            break;
         default:
            iPalette = PALETTE_BLACK_AND_WHITE;
            break;
      }                         /* endswitch */
   }                            /* endif */

   if ( iPalette != PALETTE_NIL )
   {
      static short const asMode[3] = { _TEXTC80, _TEXTBW80, _TEXTMONO };

      _setvideomode( asMode[iPalette] );
      _getvideoconfig( &vc );
   }                            /* endif */

   switch ( vc.mode )
   {
      case _TEXTC80:
      case _TEXTC40:
         break;
      case _TEXTBW80:
      case _TEXTBW40:
         iPalette = PALETTE_BLACK_AND_WHITE;
         break;
      case _TEXTMONO:
         iPalette = PALETTE_MONOCHROME;
         break;
      default:
         fprintf( stderr, "Cannot account for screen mode %d\n", vc.mode );
         exit( EXIT_FAILURE );
         break;
   }                            /* endswitch */
   /* If it isn't determined after all that, just ask */
   if ( iPalette == PALETTE_NIL )
   {
      unsigned char uch;

      do
      {
         static unsigned char const sz[] = "Do you want color? ";

         _clearscreen( _GCLEARSCREEN );
         _outtext( sz );
         uch = ( char ) ( bdos( 8, 0, 0 ) & 0xff );
      }
      while ( uch != 'y' && uch != 'Y' && uch != 'n' && uch != 'N' ); /* enddo */
      if ( uch == 'n' || uch == 'N' )
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
   }                            /* endif */

   _settextcolor( ( short ) current_fg );
   _setbkcolor( ( long ) current_bg );

   /* Now get the existing rows and columns */
   if ( screen_rows == 0 )
   {
      screen_rows = vc.numtextrows;
   }                            /* endif */
   if ( screen_cols == 0 )
   {
      screen_cols = vc.numtextcols;
   }                            /* endif */

   if ( screen_cols <= 40 )
   {
      switch ( vc.mode )
      {
         case _TEXTC80:
            _setvideomode( _TEXTC40 );
            break;
         case _TEXTBW80:
            _setvideomode( _TEXTBW40 );
            break;
         default:
            break;
      }
      _getvideoconfig( &vc );
   }
   else if ( screen_cols >= 80 )
   {
      screen_cols = 80;
   }                            /* endif */
   if ( screen_rows )
      screen_rows = _settextrows( screen_rows );
   if ( screen_rows == 0 )
      screen_rows = 25;
   _settextwindow( 1, 1, screen_rows, screen_cols );
   _wrapon( _GWRAPOFF );
   move_cursor( 1, 1 );
   set_attribute( NORMAL );
   clear_screen(  );
   move_cursor( screen_rows / 2 - 1, ( screen_cols - sizeof ( JZIPVER ) ) / 2 );
   _outtext( JZIPVER );
   move_cursor( screen_rows / 2, ( screen_cols - sizeof ( "The story is loading..." ) ) / 2 );
   _outtext( "The story is loading..." );

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

   screen_started = TRUE;

   h_interpreter = INTERP_MSDOS;
   JTERP = INTERP_MSDOS;

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
      output_new_line(  );

      _settextcolor( WHITE );
      _setbkcolor( BLACK );
      clear_screen(  );
      move_cursor( 1, 1 );
   }

   screen_started = FALSE;

}                               /* reset_screen */


void clear_screen( void )
{

   _clearscreen( _GWINDOW );
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

   save_cursor_position(  );
   _displaycursor( _GCURSOROFF );

}                               /* select_status_window */


void select_text_window( void )
{

   _displaycursor( _GCURSORON );
   restore_cursor_position(  );

}                               /* select_text_window */


void clear_line( void )
{

   int i, row, col;

   get_cursor_position( &row, &col );
   for ( i = col; i <= screen_cols; i++ )
   {
      move_cursor( row, i );
      display_char( ' ' );
   }
   move_cursor( row, col );

}                               /* clear_line */


void clear_text_window( void )
{

   short left, top, right, bottom;
   int row, col;

   get_cursor_position( &row, &col );
   _gettextwindow( &top, &left, &bottom, &right );
   _settextwindow( status_size + 1, left, bottom, right );
   _clearscreen( _GWINDOW );
   _settextwindow( top, left, bottom, right );
   move_cursor( row, col );

}                               /* clear_text_window */


void clear_status_window( void )
{

   short left, top, right, bottom;
   int row, col;

   get_cursor_position( &row, &col );
   _gettextwindow( &top, &left, &bottom, &right );
   _settextwindow( 1, left, status_size, right );
   _clearscreen( _GWINDOW );
   _settextwindow( top, left, bottom, right );
   move_cursor( row, col );

}                               /* clear_status_window */


void move_cursor( int row, int col )
{

   _settextposition( row, col );

}                               /* move_cursor */


void get_cursor_position( int *row, int *col )
{

   struct rccoord rc;

   rc = _gettextposition(  );
   *row = rc.row;
   *col = rc.col;

}                               /* get_cursor_position */


void save_cursor_position( void )
{

   if ( cursor_saved == OFF )
   {
      get_cursor_position( &saved_row, &saved_col );
      cursor_saved = ON;
   }

}                               /* save_cursor_position */


void restore_cursor_position( void )
{

   if ( cursor_saved == ON )
   {
      move_cursor( saved_row, saved_col );
      cursor_saved = OFF;
   }

}                               /* restore_cursor_position */


void set_attribute( int attribute )
{

   int fg, bg, new_fg, new_bg;

   fg = ( int ) _gettextcolor(  );
   bg = ( int ) _getbkcolor(  );

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

   _settextcolor( ( short ) new_fg | fgBright );
   _setbkcolor( ( long ) new_bg );

}                               /* set_attribute */


void display_char( int c )
{

   switch ( c )
   {
      case '\n':
         scroll_line(  );
         break;
      case '\a':
         putchar( '\a' );
         break;
      default:
         {
            char string[2] = { ( char ) c, '\0' };

            _outtext( string );
         }
   }                            /* endswitch */

}                               /* display_char */


static long convert_key( long c )
{

   /* Translate extended keys to Infocom-determined single bytes above 127 */
   switch ( c )
   {
      case 'H':                /* Up arrow */
         c = 0x81;
         break;
      case 'P':                /* Down arrow */
         c = 0x82;
         break;
      case 'K':                /* Left arrow */
         c = 0x83;
         break;
      case 's':                /* Ctrl-Left arrow */
         c = 0x20000001;
         break;
      case 'M':                /* Right arrow */
         c = 0x84;
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
         c = ( c - ';' ) + 0x85;
         break;
      case 133:                /* Function key F11 */
         c = 0x8F;
         break;
      case 134:                /* Function key F12 */
         c = 0x90;
         break;
      case 'R':                /* Ins */
         c = 0x91;
         break;
      case 'S':                /* Del */
         c = 0x20000000;
         break;
      case 'O':                /* End (SW) */
         c = 0x92;
         break;
      case 'Q':                /* PgDn (SE) */
         c = 0x94;
         break;
      case 'G':                /* Home (NW) */
         c = 0x98;
         break;
      case 'I':                /* PgUp (NE) */
         c = 0x9A;
         break;
      case 'L':                /* Unnamed (Walk Around) */
         c = 0x96;
         break;
      default:
         putchar( '\a' );
         c = 0;
   }                            /* endswitch */
   return c;

}


static long read_key( void )
{

   long c;
   static unsigned char *_far shift_byte = ( unsigned char * ) 0x417L;

   c = bdos( 8, 0, 0 ) & 0xff;
   if ( c != '\0' && c != ( unsigned char ) '\xE0' )
   {
      if ( *shift_byte & 0x10 )
      {
         switch ( c )
         {
            case '\x1B':       /* Escape */
               c |= 0x40000000;
         }                      /* endswitch */
      }                         /* endif */
      if ( c == '\x7F' )
      {
         c = '\b';
      }
      else
      {
         if ( c >= ( unsigned char ) '\x80' )
         {
            putchar( '\a' );
            c = '\0';
         }                      /* endif */
      }                         /* endif */
      return c;
   }
   else
   {
      long c1 = bdos( 8, 0, 0 ) & 0xff;

      /* Add 0x40000000 to certain values to detect scroll-lock */
      if ( *shift_byte & 0x10 )
      {
         switch ( c1 )
         {
            case 'H':          /* Up arrow */
            case 'P':          /* Down arrow */
            case 'I':          /* PgUp */
            case 'Q':          /* PgDn */
            case 'K':          /* Left arrow */
            case 's':          /* Ctrl + Left arrow */
            case 'M':          /* Right arrow */
            case 't':          /* Ctrl + Right arrow */
            case 'O':          /* End */
            case 'G':          /* Home */
            case 'S':          /* Delete */
               c1 |= 0x40000000;
         }                      /* endswitch */
      }                         /* endif */
      c = convert_key( c1 & 0x3FFFFFFF );
      if ( ( c && 0xFF ) >= 0xFC )
      {
         putchar( '\a' );
         c = '\0';
      }                         /* endif */
      c |= c1 & 0x40000000;
   }

   return c;

}                               /* read_key */


static long timed_read_key( int target_second, int target_millisecond )
{

   struct timeb timenow;
   struct tm *tmptr;
   long c;

   for ( ;; )
   {

      do
      {
         ftime( &timenow );
         tmptr = gmtime( &timenow.time );
      }
      while ( ( bdos( 11, 0, 0 ) & 0xff ) == 0 &&
              ( tmptr->tm_sec != target_second || ( int ) timenow.millitm < target_millisecond ) );

      if ( ( bdos( 11, 0, 0 ) & 0xff ) == 0 )
         return -1;
      else
      {
         c = read_key(  );
         if ( c != 0 )
            return c;
      }
   }

}                               /* timed_read_key */


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
 * Unlike the BCC version, this version requires Scroll-Lock to be on so
 * that the arrow keys behave correctly in Beyond Zork.
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

   int counter, loop, col;

   get_cursor_position( &row, &col );
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


int input_line( int buflen, char *buffer, int timeout, int *read_size )
{

   struct timeb timenow;
   struct tm *tmptr;
   long c;
   int row, col, target_second, target_millisecond;

   get_cursor_position( &row, &col );
   head_col = tail_col = col;
   init_char_pos = curr_char_pos = *read_size;
   ptr1 = ptr2 = end_ptr;

   if ( timeout != 0 )
   {
      ftime( &timenow );
      tmptr = gmtime( &timenow.time );
      target_second = ( tmptr->tm_sec + timeout ) % 60;
      target_millisecond = timenow.millitm;
   }

   for ( ;; )
   {

      /* Read a single keystroke */

      do
      {
         if ( timeout == 0 )
            c = read_key(  );
         else
         {
            c = timed_read_key( target_second, target_millisecond );
            if ( c == -1 )
               return -1;
         }
      }
      while ( c == 0 );

      switch ( c )
      {

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

         case '\b':

            /* Delete key action */

            if ( *read_size == 0 )
            {

               /* Ring bell if line is empty */
               putchar( '\a' );

            }
            else
            {

               /* Decrement read count */
               --*read_size;
               --curr_char_pos;

               /* Erase last character typed */
               get_cursor_position( &row, &col );
               move_cursor( row, --col );
               _outtext( " " );
               move_cursor( row, col );
            }

            break;

         default:

            /* Normal key action */

            if ( *read_size == ( buflen - 1 ) )
            {

               /* Ring bell if buffer is full */

               putchar( '\a' );

            }
            else
            {

               /* Scroll line if return key pressed */

               if ( c == '\r' || c == '\n' )
               {
                  c = '\n';
                  scroll_line(  );
               }

               if ( c == '\n' || c >= ( unsigned char ) '\x080' )
               {

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

                  putchar( '\a' );;

               }
               else
               {

                  /* Put key in buffer and display it */

                  buffer[curr_char_pos++] = ( char ) c;
                  if ( *read_size < curr_char_pos )
                     *read_size = curr_char_pos;
                  display_char( ( int ) c );

               }

            }

      }

   }

}                               /* input_line */


int input_character( int timeout )
{

   struct timeb timenow;
   struct tm *tmptr;
   int target_second, target_millisecond;
   long c;

   if ( timeout != 0 )
   {
      ftime( &timenow );
      tmptr = gmtime( &timenow.time );
      target_second = ( tmptr->tm_sec + timeout ) % 60;
      target_millisecond = timenow.millitm;
   }

   if ( timeout == 0 )
      c = read_key(  );
   else
      c = timed_read_key( target_second, target_millisecond );

   return ( char ) c;

}                               /* input_character */


void scroll_line( void )
{

   short left, top, right, bottom;
   int row, col;

   get_cursor_position( &row, &col );
   _gettextwindow( &top, &left, &bottom, &right );
   if ( row == bottom )
   {
      _settextwindow( status_size + 1, left, bottom, right );
      _scrolltextwindow( _GSCROLLUP );
      _settextwindow( top, left, bottom, right );
   }
   else
   {
      row++;
   }
   move_cursor( row, left );

}                               /* scroll_line */


/*
 * set_colours
 *
 * Sets the screen foreground and background colours.
 *
 */

void set_colours( zword_t foreground, zword_t background )
{

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

   _settextcolor( ( short ) fg | fgBright );
   _setbkcolor( ( long ) bg );

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
