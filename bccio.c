
/* $Id: bccio.c,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: bccio.c,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: bccio.c,v $
 * Revision 1.1.1.1  2000/05/10 14:20:51  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/*
 * bccio.c
 *
 * Borland C specific screen I/O routines for DOS.
 *
 */

#include "ztypes.h"

#include <conio.h>
#include <time.h>
#include <sys/types.h>


#define BLACK 0
#define BLUE 1
#define GREEN 2
#define CYAN 3
#define RED 4
#define MAGENTA 5
#define BROWN 6
#define WHITE 7


#define BRIGHT 0x08

/* below was 0x10 */
#define FLASH 0x80

static unsigned char prevmode;
static int win_cursor_on = 1;
static int screen_started = FALSE;
static int cursor_saved = OFF;
static int saved_row = 0;
static int saved_col = 0;
static ZINT16 current_fg;
static ZINT16 current_bg;
static ZINT16 default_fg = WHITE;
static ZINT16 default_bg = BLUE;

int timed_read_key( int );
int read_key( void );

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

void initialize_screen( void )
{
   struct text_info ti;

   gettextinfo( &ti );
   prevmode = ti.currmode;

   if ( bigscreen )
   {
      textmode( C4350 );
   }
   else
   {
      textmode( C80 );
   }

   gettextinfo( &ti );
   if ( screen_rows == 0 )
      screen_rows = ti.screenheight;
   if ( screen_cols == 0 )
      screen_cols = ti.screenwidth;
   window( 1, 1, screen_cols, screen_rows );
   _wscroll = 0;

   if ( monochrome )
      default_bg = 0;           /* black */

   set_colours( 1, 1 );         /* set default colours */
   set_attribute( NORMAL );
   clear_screen(  );
   move_cursor( screen_rows / 2 - 1, ( screen_cols - sizeof ( JZIPVER ) ) / 2 );
   cputs( JZIPVER );
   move_cursor( screen_rows / 2, ( screen_cols - sizeof ( "The story is loading..." ) ) / 2 );
   cputs( "The story is loading..." );

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
            fatal( "initialize_screen(): Could not allocate history buffer." );
         }
         else
         {
            hist_buf_size = 1024;
         }
      }
      else
      {
         fatal( "initialize_screen(): Could not allocate history buffer." );
      }
   }

   BUFFER_SIZE = hist_buf_size;
   space_avail = hist_buf_size - 1;

   screen_started = TRUE;

   h_interpreter = INTERP_MSDOS;
   JTERP = INTERP_MSDOS;

}                               /* initialize_screen */

void restart_screen( void )
{
   zbyte_t high = 1, low = 0;

   cursor_saved = OFF;

   set_byte( H_STANDARD_HIGH, high );
   set_byte( H_STANDARD_LOW, low );
   if ( h_type < V4 )
   {
      set_byte( H_CONFIG, ( get_byte( H_CONFIG ) | CONFIG_WINDOWS ) );
   }
   else
   {
      /* turn stuff on */
      set_byte( H_CONFIG,
                ( get_byte( H_CONFIG ) | CONFIG_BOLDFACE | CONFIG_EMPHASIS | CONFIG_FIXED |
                  CONFIG_TIMEDINPUT | CONFIG_COLOUR ) );
      /* turn stuff off */
      set_byte( H_CONFIG, ( get_byte( H_CONFIG ) & ~CONFIG_PICTURES & ~CONFIG_SFX ) );
   }

   /* Force graphics off as we can't do them */
   set_word( H_FLAGS, ( get_word( H_FLAGS ) & ( ~GRAPHICS_FLAG ) ) );

}                               /* restart_screen */

void reset_screen( void )
{
   if ( screen_started == TRUE )
   {
      output_new_line(  );
      output_string( "[Hit any key to exit.]" );
      ( void ) read_key(  );
      output_new_line(  );
      textmode( prevmode );
      clear_screen(  );
   }
   screen_started = FALSE;

}                               /* reset_screen */

void clear_screen( void )
{
   clrscr(  );

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
   if ( !win_cursor_on )
   {
      _setcursortype( _NOCURSOR );
   }

}                               /* select_status_window */

void select_text_window( void )
{
   if ( !win_cursor_on )
   {
      _setcursortype( _NORMALCURSOR );
   }
   restore_cursor_position(  );

}                               /* select_text_window */

void clear_line( void )
{
   clreol(  );

}                               /* clear_line */

void clear_text_window( void )
{
   struct text_info ti;
   int row, col;

   get_cursor_position( &row, &col );
   gettextinfo( &ti );
   window( ti.winleft, status_size + 1, ti.winright, ti.winbottom );
   clrscr(  );
   window( ti.winleft, ti.wintop, ti.winright, ti.winbottom );
   move_cursor( row, col );

}                               /* clear_text_window */

void clear_status_window( void )
{
   struct text_info ti;
   int row, col;

   get_cursor_position( &row, &col );
   gettextinfo( &ti );
   window( ti.winleft, 1, ti.winright, status_size );
   clrscr(  );
   window( ti.winleft, ti.wintop, ti.winright, ti.winbottom );
   move_cursor( row, col );

}                               /* clear_status_window */

void move_cursor( int row, int col )
{
   gotoxy( col, row );
}                               /* move_cursor */

struct rccoord
{
   int row;
   int col;
};

struct rccoord _gettextposition( void )
{
   struct rccoord rc_coord;

   rc_coord.row = wherey(  );
   rc_coord.col = wherex(  );
   return rc_coord;
}

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
   int new_fg, new_bg;


   if ( attribute == NORMAL )
   {
      new_fg = ( current_fg & 0x07 );
      new_bg = current_bg;
   }

   if ( attribute & REVERSE )
   {
      new_fg = current_bg;
      new_bg = ( current_fg & 0x07 );
   }

   if ( attribute & BOLD )
   {
      new_fg = current_fg | BRIGHT;
      new_bg = current_bg;
   }

   if ( attribute & EMPHASIS )
   {
      new_fg = current_fg | BRIGHT;
      new_bg = current_bg;
   }

   if ( attribute & FIXED_FONT )
   {
      new_fg = current_fg;
      new_bg = current_bg;
   }

   textcolor( new_fg );
   textbackground( new_bg );

}                               /* set_attribute */

void display_char( int c )
{
   char string[2];

   string[0] = ( char ) c;
   string[1] = '\0';
   cputs( string );
   if ( string[0] == '\n' )
   {
      display_char( '\r' );
   }
}                               /* display_char */

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

int display_command( char *buffer )
{
   int counter, loop;

   move_cursor( row, head_col );
   clear_line(  );

   /* ptr1 = end_ptr when the player has selected beyond any previously
    * * saved command.
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
         ptr1 = 0;
      if ( ptr2 < 0 )
         ptr2 = 0;

      if ( ptr1 > 0 )
      {
         do
         {                      /* Decrement ptr1 until a '\n' is found */
            ptr1--;
         }
         while ( ( commands[ptr1] != '\n' ) && ( ptr1 >= 0 ) );

         /* Then advance back to the position after the '\n' */
         ptr1++;
      }
   }
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
      }
   }
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
   }
}                               /* get_first_command */

void delete_command( void )
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
   int c, col;
   int init_char_pos, curr_char_pos;
   int loop, tail_col;

   /*
    * init_char_pos : the initial cursor location
    * curr_char_pos : the current character position within the input line
    * head_col: the head of the input line (used for cursor position)
    *  (global variable)
    * tail_col: the end of the input line (used for cursor position)
    */

/*
    if (timeout != 0) {
	ftime (&timenow);
/*	tmptr = gmtime (&timenow.time);
	target_second = (tmptr->tm_sec + (timeout/10));*/

/*	target_second = timenow.time + (timeout/10);
	target_millisecond = timenow.millitm + (timeout*10);
	while (target_millisecond >= 1000)
	{
	   target_millisecond -= 1000;
	   target_second++;
	}

    }
*/
   get_cursor_position( &row, &col );
   head_col = tail_col = col;

   init_char_pos = curr_char_pos = *read_size;

   ptr1 = ptr2 = end_ptr;

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
               return ( c );
         }
      }
      while ( c == 0 );

      /****** Previous Command Selection Keys ******/

      if ( c == ( unsigned char ) '\x081' )
      {                         /* Up arrow */
         get_prev_command(  );
         curr_char_pos = *read_size = display_command( buffer );
         tail_col = head_col + *read_size;
      }
      else if ( c == ( unsigned char ) '\x082' )
      {                         /* Down arrow */
         get_next_command(  );
         curr_char_pos = *read_size = display_command( buffer );
         tail_col = head_col + *read_size;
      }
      else if ( c == ( unsigned char ) '\x09a' )
      {                         /* PgUp */
         get_first_command(  );
         curr_char_pos = *read_size = display_command( buffer );
         tail_col = head_col + *read_size;
      }
      else if ( ( c == ( unsigned char ) '\x094' ) || ( c == ( unsigned char ) '\x0bc' ) )
      {                         /* PgDn or Esc */
         ptr1 = ptr2 = end_ptr;
         curr_char_pos = *read_size = display_command( buffer );
         tail_col = head_col + *read_size;
      }

      /****** Cursor Editing Keys ******/

      else if ( c == ( unsigned char ) '\x083' )
      {                         /* Left arrow */
         get_cursor_position( &row, &col );

         /* Prevents moving the cursor into the prompt */
         if ( col > head_col )
         {
            move_cursor( row, --col );
            curr_char_pos--;
         }
      }
      else if ( c == ( unsigned char ) '\x0aa' )
      {                         /* Ctrl + Left arrow */
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
      }
      else if ( c == ( unsigned char ) '\x084' )
      {                         /* Right arrow */
         get_cursor_position( &row, &col );

         /* Prevents moving the cursor beyond the end of the input line */
         if ( col < tail_col )
         {
            move_cursor( row, ++col );
            curr_char_pos++;
         }
      }
      else if ( c == ( unsigned char ) '\x0ba' )
      {                         /* Ctrl + Right arrow */
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
            }
         }
      }
      else if ( c == ( unsigned char ) '\x092' )
      {                         /* End */
         move_cursor( row, tail_col );
         curr_char_pos = init_char_pos + *read_size;
      }
      else if ( c == ( unsigned char ) '\x098' )
      {                         /* Home */
         move_cursor( row, head_col );
         curr_char_pos = init_char_pos;
      }
      else if ( c == ( unsigned char ) '\x096' )
      {                         /* Delete */
         if ( curr_char_pos < *read_size )
         {
            get_cursor_position( &row, &col );

            /* Moves the input line one to the left */
            for ( loop = curr_char_pos; loop < *read_size; loop++ )
            {
               buffer[loop] = buffer[loop + 1];
            }

            /* Decrements the end of the input line and the *read_size value */
            tail_col--;
            ( *read_size )--;

            /* Displays the input line */
            clear_line(  );

            for ( loop = curr_char_pos; loop < *read_size; loop++ )
            {
               display_char( buffer[loop] );
            }

            /* Restores the cursor position */
            move_cursor( row, col );
         }

      }
      else if ( c == '\b' )
      {                         /* Backspace */
         get_cursor_position( &row, &col );
         if ( col > head_col )
         {
            move_cursor( row, --col );
            clear_line(  );
            for ( loop = curr_char_pos; loop < *read_size; loop++ )
            {
               buffer[loop - 1] = buffer[loop];
               display_char( buffer[loop - 1] );
            }
            curr_char_pos--;
            tail_col--;
            ( *read_size )--;
            move_cursor( row, col );
         }

      }
      else
      {                         /* Normal key action */

         if ( *read_size == ( buflen - 1 ) )
         {                      /* Ring bell if buffer is full */
            putchar( '\a' );
         }
         else
         {                      /* Scroll line if return key pressed */
            if ( c == '\r' || c == '\n' )
            {
               c = '\n';
               scroll_line(  );
            }

            if ( ( c == '\n' ) || ( c > ( unsigned char ) '\x080' ) )
            {                   /* Add the current command to the command buffer */

               if ( *read_size > space_avail )
               {
                  do
                  {
                     delete_command(  );
                  }
                  while ( *read_size > space_avail );
               }
               if ( *read_size > 0 )
               {
                  add_command( buffer, *read_size );
               }

               /* Return key if it is a line terminator */

               return ( ( unsigned char ) c );

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
                   * * insertion */

                  for ( loop = curr_char_pos; loop < *read_size; loop++ )
                  {
                     display_char( buffer[loop] );
                  }

                  /* Moves the cursor to the next position */

                  move_cursor( row, ++col );
                  curr_char_pos++;
               }
               else
               {                /* Used if the cursor is at the end of the line */
                  buffer[curr_char_pos++] = ( char ) c;
                  display_char( c );
                  ( *read_size )++;
                  tail_col++;
               }
            }
         }
      }
   }
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
   }
   return ( c );

}                               /* input_character */


int timed_read_key( int timeout )
{
   int c;
   register clock_t curr_tick, target_tick;

   /* do math BEFORE calling clock for stability */
   target_tick = ( int ) ( timeout * CLK_TCK ) / 10;
   target_tick += clock(  );

   for ( ;; )
   {
      do
      {
         curr_tick = clock(  );
      }
      while ( ( curr_tick < target_tick ) && !kbhit(  ) );

      if ( !kbhit(  ) )
      {
         return ( -1 );
      }
      else
      {
         c = read_key(  );
         if ( c > 31 || c == 8 || c == 13 )
         {
            return ( c );
         }
      }
   }                            /* for */
}                               /* timed_read_key */

int read_key( void )
{
   int c;

 read_key_top:
   c = getch(  );
   if ( c < 32 && !( c == 0 || c == 8 || c == 13 ) )
      goto read_key_top;

   if ( c != '\0' && c != ( unsigned char ) '\x0e0' )
   {
      if ( c == '\x07f' )
      {
         c = '\b';
      }
      return ( c );
   }

   c = getch(  );

   if ( c == 'H' )
      return ( ( unsigned char ) '\x081' ); /* Up arrow                */
   else if ( c == 'P' )
      return ( ( unsigned char ) '\x082' ); /* Down arrow              */
   else if ( c == 'K' )
      return ( ( unsigned char ) '\x083' ); /* Left arrow              */
   else if ( c == 'M' )
      return ( ( unsigned char ) '\x084' ); /* Right arrow             */
   else if ( c == 'O' )
      return ( ( unsigned char ) '\x092' ); /* End (SW)                */
   else if ( c == 'Q' )
      return ( ( unsigned char ) '\x094' ); /* PgDn (SE)               */
   else if ( c == 'S' )
      return ( ( unsigned char ) '\x096' ); /* Delete                  */
   else if ( c == 'G' )
      return ( ( unsigned char ) '\x098' ); /* Home (NW)               */
   else if ( c == 'I' )
      return ( ( unsigned char ) '\x09a' ); /* PgUp (NE)               */
   else if ( c == 's' )
      return ( ( unsigned char ) '\x0aa' ); /* Ctrl + Left Arrow       */
   else if ( c == 't' )
      return ( ( unsigned char ) '\x0ba' ); /* Ctrl + Right Arrow      */
   else if ( c >= ';' && c <= 'D' ) /* Function keys F1 to F10 */
      return ( ( c - ';' ) + ( unsigned char ) '\x085' );

   return ( 0 );

}                               /* read_key */

void scroll_line( void )
{
   struct text_info ti;
   int row, col;

   get_cursor_position( &row, &col );
   gettextinfo( &ti );
   if ( row == ti.winbottom )
   {
      window( ti.winleft, status_size + 1, ti.winright, ti.winbottom );
      movetext( ti.winleft, status_size + 2, ti.winright, ti.winbottom, ti.winleft,
                status_size + 1 );
      window( ti.winleft, ti.winbottom, ti.winright, ti.winbottom );
      clrscr(  );
      window( ti.winleft, ti.wintop, ti.winright, ti.winbottom );
   }
   else
   {
      row++;
   }
   move_cursor( row, ti.winleft );

}                               /* scroll_line */

/*
 * set_colours
 *
 * Sets the screen foreground and background colours.
 *
 */

void set_colours( zword_t foreground, zword_t background )
{
   ZINT16 fg, bg;
   int colour_map[] = { BLACK, RED, GREEN, BROWN, BLUE, MAGENTA, CYAN, WHITE };

   /* Translate from Z-code colour values to natural colour values */
   if ( ( ZINT16 ) foreground >= 1 && ( ZINT16 ) foreground <= 9 )
   {
      fg = ( foreground == 1 ) ? default_fg : colour_map[( ZINT16 ) foreground - 2];
   }
   if ( ( ZINT16 ) background >= 1 && ( ZINT16 ) background <= 9 )
   {
      bg = ( background == 1 ) ? default_bg : colour_map[( ZINT16 ) background - 2];
   }

   /* Set foreground and background colour */
   textcolor( fg );
   textbackground( bg );

   /* Save new foreground and background colours for restoring colour */
   current_fg = ( ZINT16 ) fg;
   current_bg = ( ZINT16 ) bg;

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
 *  Arrow characters (0x18 - 0x1b):
 *
 *  0x18 Up arrow
 *  0x19 Down arrow
 *  0x1a Right arrow
 *  0x1b Left arrow
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
   /* Characters 24 to 27 and 179 to 218 need no translation */

   if ( ( c > 23 && c < 28 ) || ( c > 178 && c < 219 ) )
   {
      s[0] = ( char ) c;
      s[1] = '\0';
      return ( 0 );
   }

   /* German characters need translation */

   if ( c > 154 && c < 164 )
   {
      char xlat[9] = { 0x84, 0x94, 0x81, 0x8e, 0x99, 0x9a, 0xe1, 0xaf, 0xae };

      s[0] = xlat[c - 155];
      s[1] = '\0';

      return ( 0 );
   }

   return ( 1 );

}                               /* codes_to_text */
