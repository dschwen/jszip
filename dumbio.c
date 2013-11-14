
/* $Id: dumbio.c,v 1.3 2000/07/05 16:52:52 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: dumbio.c,v 1.3 2000/07/05 16:52:52 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: dumbio.c,v $
 * Revision 1.3  2000/07/05 16:52:52  jholder
 * changed func defs to use ANSI prototypes.
 *
 * Revision 1.1.1.1  2000/05/10 14:20:51  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/* dumbio.c
 *
 * dumbio is a module for output to a terminal with no capabilities for
 * multiwindowing and so on.  It is relatively untested by me 
 * but I am including it in the Jzip distribution in case it is useful to some
 * porter.
 *        - John
 * ------------------
 * $Id: dumbio.c,v 1.3 2000/07/05 16:52:52 jholder Exp $
 * zip io functions for a bare ansi c environment.  Good for use in
 * something like an emacs shell window, or a teletype.
 *
 * Copyright 1995, 1997 Al Petrofsky <alpetrof@csua.berkeley.edu>.
 * All rights granted provided this notice stays intact.
 *
 */

#include "ztypes.h"

static int status_mode = FALSE;

static char *dumb_status_window;
static char *dumb_old_status_window;
static char *dumb_prompt;

/* Our copy of the status_size global.  We keep this so that when the
 * global changes, we know whether it increased or decreased.  Lines
 * should be blanked on increases, and not on decreases.  */
static int dumb_status_size = 0;

/* Size of status window at last update.  */
static int last_display_status_size = 0;

/* Maximum size of status window since the last update, not counting
 * the size at the last update.  Strange but apparently true, the
 * maximum of this and the current size is the size that should be
 * displayed.  */
static int dumb_status_max = 0;

/* Compression styles for the status window.  */
enum
{
   COMPRESSION_NONE,
   COMPRESSION_SPAN,
   COMPRESSION_CHANGED
};
static int status_compression = COMPRESSION_SPAN;

static int status_row = 0;
static int status_col = 0;
static int text_col = 0;

static char *dumb_row( int r )
{
   return dumb_status_window + r * screen_cols;
}

static char *dumb_old_row( int r )
{
   return dumb_old_status_window + r * screen_cols;
}

static int dumb_row_changed( int r )
{
   return ( strncmp( dumb_row( r ), dumb_old_row( r ), screen_cols ) != 0 );
}

static char *dumb_row_copy( int r )
{
   return strncpy( dumb_old_row( r ), dumb_row( r ), screen_cols );
}

static int inc( void )
{
   int c = getchar(  );

   if ( c == EOF )
   {
      if ( feof( stdin ) )
      {
         fprintf( stderr, "\nEOT\n" );
         exit( 0 );
      }
      else
      {
         fprintf( stderr, "zip: dumbio.c: inc: error in getchar\n" );
         exit( 1 );
      }
   }
   return c;
}

static int uninc( int c )
{
   return ungetc( c, stdin );
}

static int outc( int c )
{
   return putchar( c );
}


void initialize_screen( void )
{
   if ( screen_cols == 0 )
      screen_cols = DEFAULT_COLS;

   if ( screen_rows == 0 )
      screen_rows = DEFAULT_ROWS;

   /* Leave room for brackets and line numbers in status window lines.  */
   /* See prompt_flush().  */
   screen_cols -= 2;

   status_mode = FALSE;

   /* Disable more breaks.  */
   top_margin = -1000;

   dumb_prompt = malloc( screen_cols );
   dumb_status_window = malloc( screen_rows * screen_cols );
   dumb_old_status_window = malloc( screen_rows * screen_cols );
   memset( dumb_status_window, ' ', screen_rows * screen_cols );
   memset( dumb_old_status_window, ' ', screen_rows * screen_cols );

   h_interpreter = INTERP_MSDOS;

}                               /* initialize_screen */

void restart_screen( void )
{
   zbyte_t high = 1, low = 0;

   set_byte( H_STANDARD_HIGH, high );
   set_byte( H_STANDARD_LOW, low );

   if ( h_type < V4 )
      set_byte( H_CONFIG, ( get_byte( H_CONFIG ) | CONFIG_WINDOWS ) );
   else;

   /* Force graphics off as we can't do them */
   set_word( H_FLAGS, ( get_word( H_FLAGS ) & ( ~GRAPHICS_FLAG ) ) );

}                               /* restart_screen */

void reset_screen( void )
{
   select_text_window(  );
}                               /* reset_screen */

void clear_screen( void )
{
}                               /* clear_screen */

void select_status_window( void )
{
   status_mode = TRUE;
}                               /* select_status_window */

void select_text_window( void )
{
   status_mode = FALSE;
}                               /* select_text_window */

void create_status_window( void )
{
   if ( status_size > dumb_status_max )
      dumb_status_max = status_size;

   if ( status_size > dumb_status_size )
   {
      /* If expanding, blank out new lines.  */
      memset( dumb_row( dumb_status_size ), ' ', ( status_size - dumb_status_size ) * screen_cols );
   }

   dumb_status_size = status_size;
}                               /* create_status_window */

void delete_status_window( void )
{
}                               /* delete_status_window */

void clear_line(  )
{
   if ( status_mode )
      memset( dumb_row( status_row ), ' ', screen_cols );
}                               /* clear_line */

void clear_text_window( void )
{
   text_col = 0;
}                               /* clear_text_window */

void clear_status_window( void )
{
   memset( dumb_status_window, ' ', status_size * screen_cols );
}                               /* clear_status_window */

void move_cursor( int row, int col )
{
   if ( status_mode )
   {
      status_row = row - 1;
      status_col = col - 1;
   }
   else
   {
      text_col = col - 1;
   }
}                               /* move_cursor */

void get_cursor_position( int *row, int *col )
{
   if ( status_mode )
   {
      *row = status_row + 1;
      *col = status_col + 1;
   }
   else
   {
      *row = screen_rows;
      *col = text_col + 1;
   }
}                               /* get_cursor_position */

void set_attribute( int attribute )
{
}                               /* set_attribute */

void display_char( int c )
{
   if ( c == '\a' )
   {
      outc( '\a' );
      return;
   }

   if ( status_mode )
   {
      if ( c == '\n' )
      {
         status_col = 0;
         status_row++;
      }
      else
         dumb_row( status_row )[status_col++] = c;
   }
   else
   {
      dumb_prompt[text_col++] = c;
   }
}                               /* display_char */

/* Return true if first n characters of s are c.  */
static int strneq( char *s, char c, int n )
{
   return ( s[0] == c ) && ( strncmp( s, s + 1, n - 1 ) == 0 );
}

static void print_status_prefix( int r )
{
   outc( '[' );
#if 0
   /* NOTE: This code will break if we're using EBCDIC.  */
   outc( r / 10 + '0' );
   outc( r % 10 + '0' );
   outc( ':' );
#endif
}

static void print_status_suffix( int r )
{
   outc( ']' );
}


/* Print status line and prompt for input.  */
static void prompt_flush( void )
{
   int r, c, display_status_size, start, end;

   display_status_size = ( dumb_status_max == 0 ) ? status_size : dumb_status_max;
   dumb_status_max = 0;

   switch ( status_compression )
   {
      case COMPRESSION_SPAN:
         /* Find first and last change.  */
         for ( start = 0; start < display_status_size; start++ )
            if ( dumb_row_changed( start ) )
               break;
         for ( end = display_status_size - 1; end >= 0; end-- )
            if ( dumb_row_changed( end ) )
               break;

         /* If status window grew, consider the new lines (the bottom ones) as
          * changed.  */
         if ( display_status_size > last_display_status_size )
         {
            end = display_status_size - 1;
            if ( start > last_display_status_size )
               start = last_display_status_size;
         }
         break;
      case COMPRESSION_NONE:
      case COMPRESSION_CHANGED:
         start = 0;
         end = display_status_size - 1;
         break;
   }

   /* Display the appropriate region.  */
   for ( r = start; r <= end; r++ )
   {
      if ( ( status_compression == COMPRESSION_CHANGED ) && ( r < last_display_status_size ) &&
           ( !dumb_row_changed( r ) ) )
         continue;
      dumb_row_copy( r );
      print_status_prefix( r );
      for ( c = 0; c < screen_cols; c++ )
      {
         outc( dumb_row( r )[c] );
      }
      print_status_suffix( r );
      outc( '\n' );
   }

   last_display_status_size = display_status_size;

   /* Choose a prompt.  */
   if ( status_mode )
   {
      /* Use current line, up to the cursor, as our prompt.  */
      /* This is the Right Thing for Bureaucracy forms.  */
      print_status_prefix( r );
      for ( c = 0; c < status_col; c++ )
      {
         outc( dumb_row( status_row )[c] );
      }
   }
   else
   {
      /* Show the text window prompt buffer.  */
      for ( c = 0; c < text_col; c++ )
      {
         outc( dumb_prompt[c] );
      }
   }
}

void scroll_line( void )
{
   int c;

   for ( c = 0; c < text_col; c++ )
   {
      outc( dumb_prompt[c] );
   }
   outc( '\n' );

   text_col = 0;
}

#define COMMAND_LEN 20
static int read_char( void )
{
   static int input_is_at_eol = TRUE;
   int c, n;
   char command[COMMAND_LEN + 1];

   if ( input_is_at_eol )
      prompt_flush(  );

   for ( ;; )
   {
      if ( ( c = inc(  ) ) == '\\' )
      {
         c = inc(  );
         if ( c == '\\' )
            break;
         uninc( c );
         /* Read a command.  */
         for ( n = 0; n < COMMAND_LEN; n++ )
         {
            command[n] = inc(  );
            if ( command[n] == '\n' )
               break;
         }
         command[n] = '\0';
         /* If line was too long, flush input to the end of it.  */
         if ( n == COMMAND_LEN )
            while ( inc(  ) != '\n' )
               ;

         if ( strcmp( command, "help" ) == 0 )
         {
            printf( "Dumb-Zip commands:\n" "  General:\n" "    help    This message\n"
                    "    <null>  Do nothing (but process preceeding input)\n"
                    "  Status window compression:\n" "    cn      none\n"
                    "    cc      Show only changed lines\n"
                    "    cs      Show lines from the first changed one"
                    " to the last changed one\n" );
         }
         else if ( strcmp( command, "" ) == 0 )
         {
         }
         else if ( strcmp( command, "cn" ) == 0 )
         {
            status_compression = COMPRESSION_NONE;
         }
         else if ( strcmp( command, "cc" ) == 0 )
         {
            status_compression = COMPRESSION_CHANGED;
         }
         else if ( strcmp( command, "cs" ) == 0 )
         {
            status_compression = COMPRESSION_SPAN;
         }
         else
         {
            fprintf( stderr, "zip: unknown command: %s\n", command );
         }
         prompt_flush(  );
         continue;
      }
      break;
   }

   input_is_at_eol = ( c == '\n' );
   return c;
}                               /* read_char */

int input_character( int timeout )
{
   int c = read_char(  );

   /* Bureaucracy expects CR, not NL.  */
   return ( ( c == '\n' ) ? '\r' : c );
}                               /* input_character */

int input_line( int buflen, char *buffer, int timeout, int *read_size )
{
   int c;

   *read_size = 0;

   while ( ( c = read_char(  ) ) != '\n' )
   {
      if ( *read_size < buflen )
         buffer[( *read_size )++] = c;
   }
   text_col = 0;
   return c;
}                               /* input_line */

/* --------------------------------------------------------------------------*/

/* code below this point added by John Holder and distributed under the Jzip
   license */

#if defined(VMS) || defined(POSIX) || defined(MSDOS)

/* allows dumbio to compile on VMS, UNIX and DOS */
int codes_to_text( int c, char *s )
{
   return 1;
}                               /* codes_to_text */
#endif

#if defined(HARD_COLORS)
void set_colours( zword_t foreground, zword_t background )
{
   return;
}
#endif
