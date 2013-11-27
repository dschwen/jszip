
/* $Id: unixio.c,v 1.3 2000/10/04 23:06:24 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: unixio.c,v 1.3 2000/10/04 23:06:24 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: unixio.c,v $
 * Revision 1.3  2000/10/04 23:06:24  jholder
 * made zscii2latin1 table global
 *
 * Revision 1.2  2000/06/29 20:42:04  jholder
 * fixed termcap scroll bug
 *
 * Revision 1.1.1.1  2000/05/10 14:20:51  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/* unixio.c */

/* *JWK* Altered by John W. Kennedy */

/* *JWK* Source code made safe (naughty bytes hexed) */

/* *JWK* Right margin forced to 1 only where needed */

/* *JWK* 2000-02-29 */

#include "ztypes.h"

#if defined(BSD)
#include <sgtty.h>
#elif defined(SYSTEM_FIVE)
#include <termio.h>
#elif defined(POSIX)
#include <termios.h>
#endif /* defined(POSIX) */

#include <signal.h>
#include <sys/types.h>
#include <sys/time.h>

/* needed by AIX */
#if defined(AIX)
#include <sys/select.h>
#endif

#define EXTENDED 1
#define PLAIN    2

#ifdef HARD_COLORS
static ZINT16 current_fg;
static ZINT16 current_bg;
#endif
extern ZINT16 default_fg;
extern ZINT16 default_bg;

extern int hist_buf_size;
extern int use_bg_color;

/* new stuff for command editing */
int BUFFER_SIZE;
char *commands;
int space_avail;
static int ptr1, ptr2 = 0;
static int end_ptr = 0;
static int row, head_col;
static int keypad_avail = 1;

/* done with editing global info */

static int current_row = 1;
static int current_col = 1;

static int saved_row;
static int saved_col;

static int cursor_saved = OFF;

static char tcbuf[1024];
static char cmbuf[1024];
static char *cmbufp;

static char *CE, *CL, *CM, *CS, *DL, *MD, *ME, *MR, *SE, *SO, *TE, *TI, *UE, *US, *KD, *KL, *KR,

      *KU;

#define GET_TC_STR(p1, p2) if ((p1 = tgetstr (p2, &cmbufp)) == NULL) p1 = ""

#define BELL 7

static void display_string( char *s );
static int wait_for_char(  );
static int read_key( int );
static void set_cbreak_mode( int );
static void rundown(  );
static void sig_rundown(  );
void get_prev_command(  );
void get_next_command(  );
void get_first_command(  );
void delete_command(  );
void add_command( char *, int );
int display_command( char * );
int input_line( int, char *, int, int * );
int input_character( int );
static int wait_for_char( int );

void outc( int );
void move_cursor( int, int );
void get_cursor_position( int *, int * );
void set_attribute( int );
void display_char( int );

/* done with editing prototypes */

extern int tgetent(  );
extern int tgetnum(  );
extern char *tgetstr(  );
extern char *tgoto(  );
extern void tputs(  );

void outc( int c )
{
   putchar( c );
}                               /* outc */

void initialize_screen(  )
{
   char *term;
   int row, col;

   if ( ( term = getenv( "TERM" ) ) == NULL )
      fatal( "initialize_screen(): No TERM environment variable" );

   if ( tgetent( tcbuf, term ) <= 0 )
      fatal( "initialize_screen(): No termcap entry for this terminal" );

   cmbufp = cmbuf;

   /* COMMENTS to aid in porting to other sys. */
   GET_TC_STR( CE, "ce" );      /* clear to end of line                     */
   GET_TC_STR( CL, "cl" );      /* clear screen, home cursor                */
   GET_TC_STR( CM, "cm" );      /* screen-rel cursor motion to row m, col n */
   GET_TC_STR( CS, "cs" );      /* change scroll region to lines m thru n   */
   GET_TC_STR( DL, "dl" );      /* delete line                              */
   GET_TC_STR( MD, "md" );      /* turn on bold attribute                   */
   GET_TC_STR( ME, "me" );      /* turn off all attributes                  */
   GET_TC_STR( MR, "mr" );      /* turn on reverse video attribute          */
   GET_TC_STR( SE, "se" );      /* end standout mode                        */
   GET_TC_STR( SO, "so" );      /* begin standout mode                      */
   GET_TC_STR( TE, "te" );      /* string to end a termcap program          */
   GET_TC_STR( TI, "ti" );      /* string to begin a termcap program        */
   GET_TC_STR( UE, "ue" );      /* end underscore mode                      */
   GET_TC_STR( US, "us" );      /* begin underscore mode                    */
   GET_TC_STR( KU, "ku" );      /* sent by keypad up arrow                  */
   GET_TC_STR( KD, "kd" );      /* sent by keypad down arrow                */
   GET_TC_STR( KL, "kl" );      /* sent by keypad left arrow                */
   GET_TC_STR( KR, "kr" );      /* sent by keypad right arrow               */

   if ( right_margin == 0 && tgetflag( "am" ) && !tgetflag( "xn" ) ) /* *JWK* */
      right_margin = 1;         /* *JWK* */

   if ( screen_cols == 0 && ( screen_cols = tgetnum( "co" ) ) == -1 )
      screen_cols = DEFAULT_COLS;

   if ( screen_rows == 0 && ( screen_rows = tgetnum( "li" ) ) == -1 )
      screen_rows = DEFAULT_ROWS;

   if ( *KU == '\0' || *KD == '\0' || *KL == '\0' || *KR == '\0' )
   {
      keypad_avail = 0;
   }

   if ( *MD == '\0' || *ME == '\0' || *MR == '\0' )
   {
      MD = SO;
      ME = SE;
      MR = SO;
   }

   if ( *UE == '\0' || *US == '\0' )
   {
      UE = SE;
      US = SO;
   }
   tputs( TI, 1, outc );

   set_attribute( NORMAL );

#if defined HARD_COLORS
   default_fg = 7;              /* white */
   default_bg = 4;              /* blue */
   if ( monochrome )
   {
      default_bg = 0;           /* black */
   }
   if ( default_bg < 0 )
   {
      use_bg_color = 0;
      printf( "\x1B[1m" );
      default_bg = 0;
   }

   set_colours( default_fg, default_bg );
   set_colours( 1, 1 );
#endif

   clear_screen(  );

   row = screen_rows / 2 - 1;
   col = ( screen_cols - ( sizeof ( JZIPVER ) - 1 ) ) / 2;
   move_cursor( row, col );
   display_string( JZIPVER );
   row = screen_rows / 2;
   col = ( screen_cols - ( sizeof ( "The story is loading..." ) - 1 ) ) / 2;
   move_cursor( row, col );
   display_string( "The story is loading..." );

   /* Last release (2.0.1g) claimed DEC tops 20.  I'm a sadist. Sue me. */
   h_interpreter = INTERP_MSDOS;
   JTERP = INTERP_UNIX;

   commands = ( char * ) malloc( hist_buf_size * sizeof ( char ) );

   if ( commands == NULL )
      fatal( "initialize_screen(): Could not allocate history buffer." );
   BUFFER_SIZE = hist_buf_size;
   space_avail = hist_buf_size - 1;

   set_cbreak_mode( 1 );
   interp_initialized = 1;

}                               /* initialize_screen */

void restart_screen(  )
{
   zbyte_t high = 1, low = 0;

   cursor_saved = OFF;

   set_byte( H_STANDARD_HIGH, high );
   set_byte( H_STANDARD_LOW, low );
   if ( h_type < V4 )
      set_byte( H_CONFIG, ( get_byte( H_CONFIG ) | CONFIG_WINDOWS ) );
   else
   {
      /* turn stuff on */
      set_byte( H_CONFIG,
                ( get_byte( H_CONFIG ) | CONFIG_BOLDFACE | CONFIG_EMPHASIS | CONFIG_FIXED |
                  CONFIG_TIMEDINPUT ) );
#if defined HARD_COLORS
      set_byte( H_CONFIG, ( get_byte( H_CONFIG ) | CONFIG_COLOUR ) );
#endif
      /* turn stuff off */
      set_byte( H_CONFIG, ( get_byte( H_CONFIG ) & ~CONFIG_PICTURES & ~CONFIG_SFX ) );
   }

   /* Force graphics off as we can't do them */
   set_word( H_FLAGS, ( get_word( H_FLAGS ) & ( ~GRAPHICS_FLAG ) ) );

}                               /* restart_screen */

void reset_screen(  )
{
   /* only do this stuff on exit when called AFTER initialize_screen */
   if ( interp_initialized )
   {
      display_string( "\n" );
      clear_line(  );
      display_string( "[Hit any key to exit.]" );
      getchar(  );
      move_cursor( screen_rows, 1 );

      delete_status_window(  );
      select_text_window(  );

#if defined HARD_COLORS
      printf( "\x1B[0m" );
#else
      set_attribute( NORMAL );
#endif

      set_cbreak_mode( 0 );

      tputs( TE, 1, outc );
   }
   display_string( "\n" );

}                               /* reset_screen */

void sig_reset_screen(  )
{
   /* only do this stuff on exit when called AFTER initialize_screen */
   if ( interp_initialized )
   {
      delete_status_window(  );
      select_text_window(  );

#if defined HARD_COLORS
      printf( "\x1B[0m" );
#else
      set_attribute( NORMAL );
#endif

      set_cbreak_mode( 0 );

      tputs( TE, 1, outc );
   }
   display_string( "\n" );

}                               /* sig_reset_screen */

void clear_screen(  )
{

/*
    tputs (CL, 1, outc);
*/
   int row;

   for ( row = 1; row <= screen_rows; row++ )
   {
      move_cursor( row, 1 );
      clear_line(  );
   }
   current_row = 1;
   current_col = 1;

}                               /* clear_screen */

void select_status_window(  )
{

   save_cursor_position(  );

}                               /* select_status_window */

void select_text_window(  )
{

   restore_cursor_position(  );

}                               /* select_text_window */

void create_status_window(  )
{
   int row, col;

   if ( *CS )
   {
      get_cursor_position( &row, &col );

      tputs( tgoto( CS, screen_rows - 1, status_size ), 1, outc );

      move_cursor( row, col );
   }

}                               /* create_status_window */

void delete_status_window(  )
{
   int row, col;

   if ( *CS )
   {
      get_cursor_position( &row, &col );

      tputs( tgoto( CS, screen_rows - 1, 0 ), 1, outc );

      move_cursor( row, col );
   }

}                               /* delete_status_window */

void clear_line(  )
{

/*    tputs (CE, 1, outc);*/
   int i;

   for ( i = 1; i <= screen_cols; i++ )
      outc( ' ' );

}                               /* clear_line */

void clear_text_window(  )
{
   int i, row, col;

   get_cursor_position( &row, &col );

   for ( i = status_size + 1; i <= screen_rows; i++ )
   {
      move_cursor( i, 1 );
      clear_line(  );
   }

   move_cursor( row, col );

}                               /* clear_text_window */

void clear_status_window(  )
{
   int i, row, col;

   get_cursor_position( &row, &col );

   for ( i = status_size; i; i-- )
   {
      move_cursor( i, 1 );
      clear_line(  );
   }

   move_cursor( row, col );

}                               /* clear_status_window */

void move_cursor( int row, int col )
{

   tputs( tgoto( CM, col - 1, row - 1 ), 1, outc );
   current_row = row;
   current_col = col;

}                               /* move_cursor */

void get_cursor_position( int *row, int *col )
{

   *row = current_row;
   *col = current_col;

}                               /* get_cursor_position */

void save_cursor_position(  )
{

   if ( cursor_saved == OFF )
   {
      get_cursor_position( &saved_row, &saved_col );
      cursor_saved = ON;
   }

}                               /* save_cursor_position */

void restore_cursor_position(  )
{

   if ( cursor_saved == ON )
   {
      move_cursor( saved_row, saved_col );
      cursor_saved = OFF;
   }

}                               /* restore_cursor_position */

void set_attribute( int attribute )
{
#if defined HARD_COLORS
   static int emph = 0, rev = 0;

   if ( attribute == NORMAL )
   {
      if ( use_bg_color )
      {
         printf( "\x1B[0m" );
      }
      else
      {
         if ( emph || rev )
         {
            emph = 0;
            rev = 0;
            printf( "\x1B[0m\x1B[1m" );
         }
      }
      set_colours( 1, 1 );
   }

   if ( attribute & REVERSE )
   {
      printf( "\x1B[7m" );
      rev = 1;
   }

   if ( attribute & BOLD )
   {
      if ( use_bg_color )
      {
         printf( "\x1B[1m" );
      }
   }
   if ( attribute & EMPHASIS )
   {
      printf( "\x1B[4m" );
      emph = 1;
   }

   if ( attribute & FIXED_FONT )
   {
   }


#else

   if ( attribute == NORMAL )
   {
      tputs( ME, 1, outc );
      tputs( UE, 1, outc );
   }

   if ( attribute & REVERSE )
      tputs( MR, 1, outc );

   if ( attribute & BOLD )
      tputs( MD, 1, outc );

   if ( attribute & EMPHASIS )
      tputs( US, 1, outc );

   if ( attribute & FIXED_FONT )
      ;
#endif

}                               /* set_attribute */

static void display_string( char *s )
{
   while ( *s )
      display_char( *s++ );
}                               /* display_string */

void display_char( int c )
{
   outc( c );

   if ( ++current_col > screen_cols )
      current_col = screen_cols;
}                               /* display_char */

void scroll_line(  )
{
   int row, col;
   int i;

   get_cursor_position( &row, &col );

   if ( *CS || row < screen_rows )
   {
      for ( i = col; i < screen_cols; i++ )
         outc( ' ' );           /* BUGFIX */
      display_char( '\n' );
   }
   else
   {
      move_cursor( status_size + 1, 1 );
      tputs( DL, 1, outc );
      move_cursor( row, 1 );
      for ( i = col; i < screen_cols; i++ )
         outc( ' ' );           /* BUGFIX */
   }

   current_col = 1;
   if ( ++current_row > screen_rows )
   {
      current_row = screen_rows;
      move_cursor( current_row, 1 );
      for ( i = 1; i < screen_cols; i++ )
         outc( ' ' );           /* BUGFIX */
      move_cursor( current_row, 1 );
   }

}                               /* scroll_line */

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
 * PgUp displays the first ("oldest") command, while PgDn displays a blank
 * prompt.
 */
int display_command( char *buffer )
{
   int counter, loop;

   move_cursor( row, head_col );
   tputs (CE, 1, outc);  /* fix scoll bug w/ command history */

   /* ptr1 = end_ptr when the player has selected beyond any previously
    * saved command.
    */

   if ( ptr1 == end_ptr )
   {
      return ( 0 );
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
      }
      return ( counter );
   }
}                               /* display_command */

void get_prev_command(  )
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
         ptr1 = 0;
      if ( ptr2 < 0 )
         ptr2 = 0;

      if ( ptr1 > 0 )
      {
         do

            /* Decrement ptr1 until a '\n' is found */

            ptr1--;
         while ( ( commands[ptr1] != '\n' ) && ( ptr1 >= 0 ) );

         /* Then advance back to the position after the '\n' */

         ptr1++;
      }
   }
}                               /* get_prev_command */

void get_next_command(  )
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
            ptr2++;
         while ( ( commands[ptr2] != '\n' ) && ( ptr2 <= end_ptr ) );
         ptr2--;
      }
   }
}                               /* get_next_command */

void get_first_command(  )
{

   if ( end_ptr > 1 )
   {
      ptr1 = ptr2 = 0;
      do
         ptr2++;
      while ( commands[ptr2] != '\n' );
      ptr2--;
   }
}                               /* get_first_command */

void delete_command(  )
{

   /* Deletes entire commands from the beginning of the command buffer */

   int loop;

   /* Keep moving the characters in the command buffer one space to the left
    * until a '\n' is found...
    */

   do
   {
      for ( loop = 0; loop < end_ptr; loop++ )
      {
         commands[loop] = commands[loop + 1];
      }
      end_ptr--;
      space_avail++;

   }
   while ( commands[0] != '\n' );

   /* ...then delete the '\n' */

   for ( loop = 0; loop < end_ptr; loop++ )
   {
      commands[loop] = commands[loop + 1];
   }
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
   }

   /* Add one space for '\n' */

   end_ptr += size + 1;
   ptr1 = ptr2 = end_ptr;
   commands[end_ptr - 1] = '\n';
   space_avail -= size + 1;

}                               /* add_command */


int input_line( int buflen, char *buffer, int timeout, int *read_size )
{
   struct timeval tv;
   struct timezone tz;

   int c, col;
   int init_char_pos, curr_char_pos;
   int loop, tail_col;
   int keyfunc = 0;

   /*
    * init_char_pos : the initial cursor location
    * curr_char_pos : the current character position within the input line
    * head_col: the head of the input line (used for cursor position)
    *  (global variable)
    * tail_col: the end of the input line (used for cursor position)
    */

   get_cursor_position( &row, &col );
   head_col = tail_col = col;

   init_char_pos = curr_char_pos = *read_size;

   ptr1 = ptr2 = end_ptr;

   for ( ;; )
   {

      keyfunc = 0;

      /* Read a single keystroke */

      fflush( stdout );

      if ( timeout != 0 )
      {
         if ( wait_for_char( timeout ) )
            return ( -1 );
      }
      c = read_key( EXTENDED );

      /****** Previous Command Selection Keys ******/

      if ( keypad_avail )
      {
         if ( c == ( char ) *KU )
         {
            keyfunc = 1;
            for ( loop = 0; loop < ( strlen( KU ) - 1 ); loop++ )
               c = getchar(  );

            if ( c == ( unsigned char ) KU[strlen( KU ) - 1] )
            {                   /* Up arrow */
               get_prev_command(  );
               curr_char_pos = *read_size = display_command( buffer );
               tail_col = head_col + *read_size;
               keyfunc = 1;
            }
            else if ( c == ( unsigned char ) KD[strlen( KU ) - 1] )
            {                   /* Down arrow */
               get_next_command(  );
               curr_char_pos = *read_size = display_command( buffer );
               tail_col = head_col + *read_size;
               keyfunc = 1;
            }

/* PgUp
          else if (c == (unsigned char) '\x09a') { 
             get_first_command();
             curr_char_pos = *read_size = display_command(buffer);
             tail_col = head_col + *read_size;
             keyfunc=1;
          }
*/

/* PgDn
          else if (c == (unsigned char) '\x094') { 
             ptr1 = ptr2 = end_ptr;
             curr_char_pos = *read_size = display_command(buffer);
             tail_col = head_col + *read_size;
             keyfunc=1;
         }
*/

         /****** Cursor Editing Keys ******/

            else if ( c == ( unsigned char ) KL[strlen( KL ) - 1] )
            {                   /* Left arrow */
               get_cursor_position( &row, &col );

               /* Prevents moving the cursor into the prompt */

               if ( col > head_col )
               {
                  move_cursor( row, --col );
                  curr_char_pos--;
               }
               keyfunc = 1;
            }
            else if ( c == ( unsigned char ) KR[strlen( KR ) - 1] )
            {                   /* Right arrow */
               get_cursor_position( &row, &col );

               /* Prevents moving the cursor beyond the end of the input line */

               if ( col < tail_col )
               {
                  move_cursor( row, ++col );
                  curr_char_pos++;
               }
               keyfunc = 1;
            }

/* End
         else if (c == (unsigned char) '\x092') {  
            move_cursor(row, tail_col);
            curr_char_pos = init_char_pos + *read_size;
            keyfunc=1;
         }
*/

/* Home
         else if (c == (unsigned char) '\x098') { 
            move_cursor(row, head_col);
            curr_char_pos = init_char_pos;
            keyfunc=1;
         }
*/

/* Delete */

/*
         else if (c == (unsigned char) '\x096') { 
            if (curr_char_pos < *read_size) {
               get_cursor_position (&row, &col);
 
               for (loop = curr_char_pos; loop < *read_size; loop++) {
                  buffer[loop] = buffer[loop + 1];
               }
 
               tail_col--;
               (*read_size)--;
 
               for (loop = curr_char_pos; loop < *read_size; loop++) {
                  display_char (buffer[loop]);
                }
 
                display_char (' ');
 
                move_cursor(row, col);
                keyfunc=1;
            }
         }
 */
         }
      }
      if ( !keyfunc )
      {
         if ( c == '\b' )       /* Backspace */
         {
            get_cursor_position( &row, &col );
            if ( col > head_col )
            {
               move_cursor( row, --col );
               for ( loop = curr_char_pos; loop < *read_size; loop++ )
               {
                  buffer[loop - 1] = buffer[loop];
                  display_char( buffer[loop - 1] );
               }
               display_char( ' ' );
               curr_char_pos--;
               tail_col--;
               ( *read_size )--;
               move_cursor( row, col );
            }
         }
         else
         {
            /* Normal key action */
            if ( *read_size == ( buflen - 1 ) )
            {
               /* Ring bell if buffer is full */
               outc( BELL );
            }
            else
            {
               /* Scroll line if return key pressed */
               if ( c == '\r' || c == '\n' )
               {
                  c = '\n';
                  scroll_line(  );
               }

               if ( c == '\n' )
               {
                  /* Add the current command to the command buffer */
                  if ( *read_size > space_avail )
                  {
                     do
                        delete_command(  );
                     while ( *read_size > space_avail );
                  }
                  if ( *read_size > 0 )
                     add_command( buffer, *read_size );

                  /* Return key if it is a line terminator */
                  return ( c );
               }
               else
               {
                  get_cursor_position( &row, &col );

                  /* Used if the cursor is not at the end of the line */
                  if ( col < tail_col )
                  {
                     /* Moves the input line one character to the right */
                     for ( loop = *read_size; loop >= curr_char_pos; loop-- )
                     {
                        buffer[loop + 1] = buffer[loop];
                     }

                     /* Puts the character into the space created by the
                      * "for" loop above */
                     buffer[curr_char_pos] = ( char ) c;

                     /* Increment the end of the line values */

                     ( *read_size )++;
                     tail_col++;

                     /* Move the cursor back to its original position */

                     move_cursor( row, col );

                     /* Redisplays the input line from the point of
                      * insertion */

                     for ( loop = curr_char_pos; loop < *read_size; loop++ )
                     {
                        display_char( buffer[loop] );
                     }

                     /* Moves the cursor to the next position */

                     move_cursor( row, ++col );
                     curr_char_pos++;
                  }
                  else
                  {
                     /* Used if the cursor is at the end of the line */
                     buffer[curr_char_pos++] = ( char ) c;
                     display_char( c );
                     ( *read_size )++;
                     tail_col++;
                  }
               }
            }
         }
      }
   }
}                               /* input_line */

/*
 * Patched 28-June-1995: Changed this routine's expectation of a \n to
 *                       a \r so the form in Bureaucracy works.  Patch
 *                       applied by John Holder.
 */
int input_character( int timeout )
{
   struct timeval tv;
   struct timezone tz;
   int c;

   fflush( stdout );

   if ( timeout != 0 )
   {
      if ( wait_for_char( timeout ) )
         return ( -1 );
   }

   c = read_key( PLAIN );

   return ( c );

}                               /* input_character */

/* timeout is in tenths of a second */
static int wait_for_char( int timeout )
{
   int nfds, status;
   fd_set readfds;
   struct timeval tv;
   struct timezone tz;

   gettimeofday( &tv, &tz );

   if ( timeout == 0 )
      return ( -1 );

   tv.tv_sec = ( timeout * 100000 ) / 1000000;
   tv.tv_usec = ( timeout * 100000 ) % 1000000;

   nfds = FD_SETSIZE;

   FD_ZERO( &readfds );
   FD_SET( fileno( stdin ), &readfds );

   status = select( nfds, &readfds, NULL, NULL, &tv );
   if ( status < 0 )
   {
      perror( "select" );
      return ( -1 );
   }

   if ( status == 0 )
      return ( -1 );
   else
      return ( 0 );

}                               /* wait_for_char */

static int read_key( int mode )
{
   int c;

   if ( mode == PLAIN )
   {
      do
      {
         c = getchar(  );
         if ( c == 4 )
         {
            delete_status_window(  );
            select_text_window(  );
            set_attribute( NORMAL );
            set_cbreak_mode( 0 );
            tputs( TE, 1, outc );
            exit( 0 );
         }                      /* CTRL-D (EOF) */
      }
      while ( !( c == 10 || c == 13 || c == 8 ) && ( c < 32 || c > 127 ) );
   }
   else if ( mode == EXTENDED )
   {                            /* also pass ESC character back for editor */
      do
      {
         c = getchar(  );
         if ( c == 4 )
         {
            delete_status_window(  );
            select_text_window(  );
            set_attribute( NORMAL );
            set_cbreak_mode( 0 );
            tputs( TE, 1, outc );
            exit( 0 );
         }                      /* CTRL-D (EOF) */
      }
      while ( !( c == 27 || c == 10 || c == 13 || c == 8 ) && ( c < 32 || c > 127 ) );
   }

   if ( c == 127 )
      c = '\b';
   else if ( c == 10 )
      c = 13;

   return ( c );

}                               /* read_key */

static void set_cbreak_mode( int mode )
{
   int status;

#if defined(BSD)
   struct sgttyb new_tty;
   static struct sgttyb old_tty;
#endif /* defined(BSD) */
#if defined(SYSTEM_FIVE)
   struct termio new_termio;
   static struct termio old_termio;
#endif /* defined(SYSTEM_FIVE) */
#if defined(POSIX)
   struct termios new_termios;
   static struct termios old_termios;
#endif /* defined(POSIX) */

#if defined(BSD)
   status = ioctl( fileno( stdin ), ( mode ) ? TIOCGETP : TIOCSETP, &old_tty );
#endif /* defined(BSD) */
#if defined(SYSTEM_FIVE)
   status = ioctl( fileno( stdin ), ( mode ) ? TCGETA : TCSETA, &old_termio );
#endif /* defined(SYSTEM_FIVE) */
#if defined(POSIX)
   if ( mode )
      status = tcgetattr( fileno( stdin ), &old_termios );
   else
      status = tcsetattr( fileno( stdin ), TCSANOW, &old_termios );
#endif /* defined(POSIX) */
   if ( status )
   {
      perror( "ioctl" );
      exit( 1 );
   }

   if ( mode )
   {

/*        signal (SIGINT, sig_rundown);
        signal (SIGTERM, sig_rundown);
	*/
   }

   if ( mode )
   {
#if defined(BSD)
      status = ioctl( fileno( stdin ), TIOCGETP, &new_tty );
#endif /* defined(BSD) */
#if defined(SYSTEM_FIVE)
      status = ioctl( fileno( stdin ), TCGETA, &new_termio );
#endif /* defined(SYSTEM_FIVE) */
#if defined(POSIX)
      status = tcgetattr( fileno( stdin ), &new_termios );
#endif /* defined(POSIX) */
      if ( status )
      {
         perror( "ioctl" );
         exit( 1 );
      }

#if defined(BSD)
      new_tty.sg_flags |= CBREAK;
      new_tty.sg_flags &= ~ECHO;
#endif /* defined(BSD) */
#if defined(SYSTEM_FIVE)
      new_termio.c_lflag &= ~( ICANON | ECHO );
#endif /* defined(SYSTEM_FIVE) */
#if defined(POSIX)
      new_termios.c_lflag &= ~( ICANON | ECHO );

      /* the next two lines of code added by Mark Phillips.  The patch */
      /* was for sun and __hpux, active only if those were #defined,   */
      /* but most POSIX boxen (SunOS, HP-UX, Dec OSF, Irix for sure)   */
      /* can use this... It makes character input work.  VMIN and      */
      /* VTIME are reused on some systems, so when the mode is switched */
      /* to RAW all character access is, by default, buffered wrong.   */
      /* For the curious: VMIN='\004' and VTIME='\005' octal on        */
      /* these systems.  VMIN is usually EOF and VTIME is EOL. (JDH)   */
      new_termios.c_cc[VMIN] = 1;
      new_termios.c_cc[VTIME] = 2;
#endif /* defined(POSIX) */

#if defined(BSD)
      status = ioctl( fileno( stdin ), TIOCSETP, &new_tty );
#endif /* defined(BSD) */
#if defined(SYSTEM_FIVE)
      status = ioctl( fileno( stdin ), TCSETA, &new_termio );
#endif /* defined(SYSTEM_FIVE) */
#if defined(POSIX)
      status = tcsetattr( fileno( stdin ), TCSANOW, &new_termios );
#endif /* defined(POSIX) */
      if ( status )
      {
         perror( "ioctl" );
         exit( 1 );
      }
   }

   if ( mode == 0 )
   {
      signal( SIGINT, SIG_DFL );
      signal( SIGTERM, SIG_DFL );
   }

}                               /* set_cbreak_mode */

static void rundown(  )
{
   unload_cache(  );
   close_story(  );
   close_script(  );
   reset_screen(  );
}                               /* rundown */

static void sig_rundown(  )
{
   unload_cache(  );
   close_story(  );
   close_script(  );
   sig_reset_screen(  );
}                               /* rundown */

#if defined HARD_COLORS

/* Zcolors:
 * BLACK 0   RED  1   GREEN 2   BROWN 3  BLUE 4  MAGENTA 5   CYAN 6    WHITE 7
 * ANSI Colors (foreground over background):
 * BLACK 30  RED  31  GREEN 32  BROWN 33 BLUE 34 MAGENTA 35  CYAN 36   WHITE 37
 * BLACK 40  RED  41  GREEN 42  BROWN 43 BLUE 44 MAGENTA 45  CYAN 46   WHITE 47
 */
void set_colours( zword_t foreground, zword_t background )
{
   int fg, bg;
   static int bgset = 0;

   int fg_colour_map[] = { 30, 31, 32, 33, 34, 35, 36, 37 };
   int bg_colour_map[] = { 40, 41, 42, 43, 44, 45, 46, 47 };

   /* Translate from Z-code colour values to natural colour values */

   if ( ( ZINT16 ) foreground >= 1 && ( ZINT16 ) foreground <= 9 )
   {
      fg = ( foreground == 1 ) ? ( default_fg + 30 ) : fg_colour_map[foreground - 2];
   }
   if ( ( ZINT16 ) background >= 1 && ( ZINT16 ) background <= 9 )
   {
      bg = ( background == 1 ) ? ( default_bg + 40 ) : bg_colour_map[background - 2];
   }

   current_fg = ( ZINT16 ) fg;
   current_bg = ( ZINT16 ) bg;

   /* Set foreground and background colour */
   if ( !monochrome )
   {
      if ( use_bg_color )
      {
         printf( "\x1B[%dm", bg );
      }
      else if ( bg != 40 )
      {
         printf( "\x1B[%dm", bg );
         bgset = 1;
      }
      else if ( bgset )
      {
         printf( "\x1B[0m\x1B[1m" );
         bgset = 0;
      }
      printf( "\x1B[%dm", fg );
   }

}
#endif

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
 *  International characters (0x9b - 0xa3):
 *                                        
 *  0x9b a umlaut (ae)                    
 *  0x9c o umlaut (oe)
 *  0x9d u umlaut (ue)
 *  0x9e A umlaut (Ae)
 *  0x9f O umlaut (Oe)
 *  0xa0 U umlaut (Ue)
 *  0xa1 sz (ss)     
 *  0xa2 open quote (>>)
 *  0xa3 close quota (<<)
 *                      
 *  Line drawing characters (0xb3 - 0xda):
 *                                       
 *  0xb3 vertical line (|)               
 *  0xba double vertical line (#)
 *  0xc4 horizontal line (-)    
 *  0xcd double horizontal line (=)
 *  all other are corner pieces (+)
 *                                
 */
int codes_to_text( int c, char *s )
{
   if ( c > 154 && c < 224 )
   {
      s[0] = zscii2latin1[c - 155];

      if ( c == 220 )
      {
         s[1] = 'e';
         s[2] = '\0';
      }
      else if ( c == 221 )
      {
         s[1] = 'E';
         s[2] = '\0';
      }
      else
      {
         s[1] = '\0';
      }

      return 0;
   }

   return 1;
}                               /* codes_to_text */
