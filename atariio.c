
/* $Id: atariio.c,v 1.1.1.1 2000/05/10 14:20:50 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: atariio.c,v 1.1.1.1 2000/05/10 14:20:50 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: atariio.c,v $
 * Revision 1.1.1.1  2000/05/10 14:20:50  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */


#include <stdio.h>
#include <osbind.h>
#include <mintbind.h>

/* atariio.c */

#include "ztypes.h"

#if defined(BSD)
#include <sgtty.h>
#endif /* defined(BSD) */
#if defined(SYSTEM_FIVE)
#include <termio.h>
#endif /* defined(SYSTEM_FIVE) */
#if defined(POSIX)
#include <termios.h>
#endif /* defined(POSIX) */

#include <signal.h>
#include <sys/types.h>
#include <sys/time.h>

/* needed by AIX */
#if defined(AIX)
#include <sys/select.h>
#endif

/* new stuff for command editing */
int BUFFER_SIZE;
char *commands;
int space_avail;
static int ptr1, ptr2 = 0;
static int end_ptr = 0;
static int row, head_col;
static int keypad_avail = 1;

/* done with editing global info */

static int ismint = 0;
static int current_row = 1;
static int current_col = 1;

static int saved_row;
static int saved_col;

static int cursor_saved = OFF;

static char tcbuf[1024];
static char cmbuf[1024];
static char *cmbufp;

volatile long volatile *_systicks = ( long * ) 0x4baL;
static char *CE, *CL, *CM, *CS, *DL, *MD, *ME, *MR, *SE, *SO, *TE, *TI, *UE, *US, *KD, *KL, *KR,

      *KU;

#define GET_TC_STR(p1, p2) if ((p1 = tgetstr (p2, &cmbufp)) == NULL) p1 = ""

#define BELL 7
static int Agetchar( void );
static void outc(  );
static void display_string(  );
static int wait_for_char(  );
static int read_key(  );
static void set_cbreak_mode(  );
static void rundown(  );

extern int tgetent(  );
extern int tgetnum(  );
extern char *tgetstr(  );
extern char *tgoto(  );
extern void tputs(  );

static int colours = 0;
static void outc( c )
   int c;
{
   putchar( c );
}                               /* outc */

void set_colours( int foreground, int background )
{
   /* Somewhere, we have a termcap entry, but we'll have to get a
    * bit machine specific for this one */
   static int cmap2b[] = { 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1 };
   static int cmap2f[] = { 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0 };
   static int cmap4b[] = { 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3 };
   static int cmap4f[] = { 3, 2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0 };
   static int cmap16f[] = { 0, 2, 4, 6, 8, 10, 12, 14, 1, 3, 5, 7, 9, 11, 13, 15 };
   static int cmap16b[] = { 15, 13, 11, 9, 7, 5, 3, 1, 14, 12, 10, 8, 6, 4, 2, 0 };

   if ( !colours )
   {
      int mode;

      putchar( '\033' );
      putchar( 'w' );
      mode = Getrez(  );
      switch ( mode )
      {
         case 1:
            colours = 4;
            break;
         case 6:
         case 2:
            colours = 2;
            break;
         default:
            /* At least 16, and possibly 16 million */
            colours = 16;
            break;
      }
   }

   switch ( colours )
   {
      case 2:
         foreground = cmap2f[foreground - 1];
         background = cmap2b[background - 1];
         putchar( '\033' );
         putchar( 'b' );
         putchar( foreground );
         putchar( '\033' );
         putchar( 'c' );
         putchar( foreground + 1 );
         break;
      case 4:
         foreground = cmap4f[foreground - 1];
         background = cmap4b[background - 1];
         putchar( '\033' );
         putchar( 'b' );
         putchar( foreground );
         putchar( '\033' );
         putchar( 'c' );
         putchar( ( foreground == background ) ? foreground + 1 : background );
         break;
      case 16:
         foreground = cmap16f[foreground - 1];
         background = cmap16b[background - 1];
         putchar( '\033' );
         putchar( 'b' );
         putchar( foreground );
         putchar( '\033' );
         putchar( 'c' );
         putchar( ( foreground == background ) ? foreground + 1 : background );
         break;
      default:
         fatal( "set_colours(): Terminal error in colour handling." );
   }
}

void initialize_screen(  )
{
   char *term;
   int row, col;

   ismint = Pgetpid(  ) != -32;

   if ( ( term = getenv( "TERM" ) ) == NULL )
   {
      /* If there is no termcap entry available, then make the standard default */
    fudge:
      term =
            "vt52|dec-vt52|dec vt52:do=^J:le=^H:bs:cd=\\EJ:ce=\\EK:"
            "cl=\\EH\\EJ:cm=\\EY%+ %+ :co#80:li#24:nd=\\EC:pt:sr=\\EI:up=\\EA:"
            "ku=\\EA:kd=\\EB:kr=\\EC:kl=\\ED:kb=^H:so=\\Ep:se=\\Eq:al=\\EL:dl=\\EM:";
      CE = "\033K";
      CL = "\033H\033J";
      CM = "\033Y%+ %+ ";
      MR = MD = ME = CS = US = UE = "";
      KU = "\033A";
      KD = "\033B";
      KL = "\033C";
      KR = "\033D";
      DL = "\033M";
      SO = "\033p";
      SE = "\033q";
      TE = "\033v";
      TI = "\033w";
      screen_cols = 80;
      if ( !Getrez(  ) )
         screen_cols /= 2;
      screen_rows = 25;
   }
   else
   {
      if ( tgetent( tcbuf, term ) <= 0 )
      {
         goto fudge;
         /* fatal ("No termcap entry for this terminal"); */
      }

      cmbufp = cmbuf;

      GET_TC_STR( CE, "ce" );
      GET_TC_STR( CL, "cl" );
      GET_TC_STR( CM, "cm" );
      GET_TC_STR( CS, "cs" );
      GET_TC_STR( DL, "dl" );
      GET_TC_STR( MD, "md" );
      GET_TC_STR( ME, "me" );
      GET_TC_STR( MR, "mr" );
      GET_TC_STR( SE, "se" );
      GET_TC_STR( SO, "so" );
      GET_TC_STR( TE, "te" );
      GET_TC_STR( TI, "ti" );
      GET_TC_STR( UE, "ue" );
      GET_TC_STR( US, "us" );
      GET_TC_STR( KU, "ku" );
      GET_TC_STR( KD, "kd" );
      GET_TC_STR( KR, "kr" );
      GET_TC_STR( KL, "kl" );

      if ( !KU || !*KU )
      {
         KU = "\033A";
         KD = "\033B";
         KL = "\033C";
         KR = "\033D";
      }
      if ( screen_cols == 0 && ( screen_cols = tgetnum( "co" ) ) == -1 )
         screen_cols = DEFAULT_COLS;

      if ( screen_rows == 0 && ( screen_rows = tgetnum( "li" ) ) == -1 )
         screen_rows = DEFAULT_ROWS;

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

   clear_screen(  );

   row = screen_rows / 2 - 1;
   col = ( screen_cols - ( sizeof ( JZIPVER ) - 1 ) ) / 2;
   move_cursor( row, col );
   display_string( JZIPVER );
   row = screen_rows / 2;
   col = ( screen_cols - ( sizeof ( "The story is loading..." ) - 1 ) ) / 2;
   move_cursor( row, col );
   display_string( "The story is loading..." );

   h_interpreter = INTERP_ATARI_ST;

   commands = ( char * ) malloc( hist_buf_size * sizeof ( char ) );

   if ( commands == NULL )
      fatal( "initialize_screen(): Could not allocate history buffer!" );
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
      delete_status_window(  );
      select_text_window(  );
      set_attribute( NORMAL );

      set_cbreak_mode( 0 );

      tputs( TE, 1, outc );
   }

}                               /* reset_screen */

void clear_screen(  )
{

   tputs( CL, 1, outc );
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

   tputs( CE, 1, outc );

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

void move_cursor( row, col )
   int row;
   int col;
{

   tputs( tgoto( CM, col - 1, row - 1 ), 1, outc );
   current_row = row;
   current_col = col;

}                               /* move_cursor */

void get_cursor_position( row, col )
   int *row;
   int *col;
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

void set_attribute( attribute )
   int attribute;
{

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

}                               /* set_attribute */

static void display_string( s )
   char *s;
{

   while ( *s )
      display_char( *s++ );

}                               /* display_string */

void display_char( c )
   int c;
{

   outc( c );

   if ( ++current_col > screen_cols )
      current_col = screen_cols;

}                               /* display_char */

void scroll_line(  )
{
   int row, col;

   get_cursor_position( &row, &col );

   if ( *CS || row < screen_rows )
   {
      display_char( '\n' );
   }
   else
   {
      move_cursor( status_size + 1, 1 );
      tputs( DL, 1, outc );
      move_cursor( row, 1 );
   }

   current_col = 1;
   if ( ++current_row > screen_rows )
      current_row = screen_rows;

}                               /* scroll_line */

int display_command( char *buffer )
{
   int counter, loop;

   move_cursor( row, head_col );
   clear_line(  );
   move_cursor( row, head_col );
   /* ptr1 == end_ptr when the player has selected beyond any previously
    * saved command */
   if ( ptr1 == end_ptr )
      return 0;
   else
   {
      counter = 0;
      for ( loop = ptr1; loop <= ptr2; loop++ )
      {
         buffer[counter] = commands[loop];
         display_char( buffer[counter++] );
      }
      return counter;
   }
}

void get_prev_command( void )
{
   if ( ptr1 > 0 )
   {
      ptr2 = ptr1 -= 2;
      if ( ptr1 < 0 )
         ptr1 = 0;
      if ( ptr2 < 0 )
         ptr2 = 0;
      if ( ptr1 > 0 )
      {
         do
            ptr1--;
         while ( ( commands[ptr1] != '\n' ) && ( ptr1 >= 0 ) );
         ptr1++;
      }
   }
}

void get_next_command( void )
{
   if ( ptr2 < end_ptr )
   {
      ptr1 = ptr2 += 2;
      if ( ptr2 >= end_ptr )
         ptr1 = ptr2 = end_ptr;
      else
      {
         do
            ptr2++;
         while ( ( commands[ptr2] != '\n' ) && ( ptr2 <= end_ptr ) );
         ptr2--;
      }
   }
}

void get_first_command( void )
{
   if ( end_ptr > 1 )
   {
      ptr1 = ptr2 = 0;
      do
         ptr2++;
      while ( ( commands[ptr2] != '\n' ) && ( ptr2 <= end_ptr ) );
      ptr2--;
   }

}

void delete_command( void )
{
   int loop;

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
   for ( loop = 0; loop < end_ptr; loop++ )
   {
      commands[loop] = commands[loop + 1];
   }
   end_ptr--;
   space_avail++;
   ptr1 = ptr2 = end_ptr;
}

void add_command( char *buffer, int size )
{
   int loop, counter;

   counter = 0;
   for ( loop = end_ptr; loop < ( end_ptr + size ); loop++ )
   {
      commands[loop] = buffer[counter++];
   }
   end_ptr += size + 1;
   ptr1 = ptr2 = end_ptr;
   commands[end_ptr - 1] = '\n';
   space_avail -= size + 1;
}






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

   /* gettimeofday (&tv, &tz);
    * 
    * tv.tv_sec += timeout; */

   fflush( stdout );

   if ( timeout != 0 )
   {
      if ( wait_for_char( timeout ) )
         return ( -1 );
   }

   c = read_key(  );

   if ( c == '\n' )
      c = '\r';

   return ( c );

}                               /* input_character */

int input_line( int buflen, char *buffer, int timeout, int *read_size )
{
   struct timeval tv;
   struct timezone tz;
   int c, col;
   int init_char_pos, curr_char_pos, loop, tail_col, keyfunc = 0;

   get_cursor_position( &row, &col );
   head_col = tail_col = col;
   init_char_pos = curr_char_pos = *read_size;
   ptr1 = ptr2 = end_ptr;

/*
	if(timeout!=0)
		{
		gettimeofday (&tv, &tz);
		tv.tv_usec+=timeout*100000;
		while(tv.tv_usec>1000000)
			{
			tv.tv_sec++;
			tv.tv_usec-=1000000;
			}
		}
*/

   for ( ;; )
   {

      get_cursor_position( &row, &col );
      keyfunc = 0;
      /* Read a single keystroke */
      fflush( stdout );

      if ( timeout != 0 )
         if ( wait_for_char( timeout ) )
            return ( -1 );
      c = read_key(  );

      if ( keypad_avail )
      {
         if ( c == ( char ) *KU )
         {
            for ( loop = 0; loop < ( strlen( KU ) - 1 ); loop++ )
               do
                  c = Agetchar(  );
               while ( c == '[' );
            if ( c == ( unsigned char ) KU[strlen( KU ) - 1] )
            {
               get_prev_command(  );
               curr_char_pos = *read_size = display_command( buffer );
               tail_col = head_col + *read_size;
               keyfunc = 1;
            }
            else if ( c == ( unsigned char ) KD[strlen( KD ) - 1] )
            {
               get_next_command(  );
               curr_char_pos = *read_size = display_command( buffer );
               tail_col = head_col + *read_size;
               keyfunc = 1;
            }
            else if ( c == ( unsigned char ) KL[strlen( KL ) - 1] )
            {
               get_cursor_position( &row, &col );
               if ( col > head_col )
               {
                  move_cursor( row, --col );
                  curr_char_pos--;
               }
               keyfunc = 1;
            }
            else if ( c == ( unsigned char ) KR[strlen( KR ) - 1] )
            {
               get_cursor_position( &row, &col );
               if ( col < tail_col )
               {
                  move_cursor( row, ++col );
                  curr_char_pos++;
               }
               keyfunc = 1;
            }
         }
      }
      if ( keyfunc )
         continue;

      if ( !keyfunc )
      {
         if ( c == '\b' )
         {
            /* Backspace */
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
               if ( c == '\n' || c == '\r' )
               {
                  c = '\n';
                  scroll_line(  );
               }
               if ( c == '\n' )
               {
                  if ( *read_size > BUFFER_SIZE )
                     return ( c );
                  while ( *read_size > space_avail )
                  {
                     delete_command(  );
                  }
                  if ( *read_size > 0 )
                     add_command( buffer, *read_size );
                  return c;
               }
               else
               {
                  get_cursor_position( &row, &col );
                  if ( col < tail_col )
                  {
                     for ( loop = *read_size; loop >= curr_char_pos; loop-- )
                        buffer[loop + 1] = buffer[loop];
                     buffer[curr_char_pos] = ( char ) c;
                     ( *read_size )++;
                     tail_col++;
#if 1
                     move_cursor( row, col );
                     for ( loop = curr_char_pos; loop < *read_size; loop++ )
                        display_char( buffer[loop] );
                     move_cursor( row, ++col );
                     curr_char_pos++;
#endif
#if 0
                     move_cursor( row, head_col );
                     for ( loop = 0; loop < *read_size; loop++ )
                        display_char( buffer[loop] );
                     move_cursor( row, ++col );
#endif
                  }
                  else
                  {
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

long Systicks( void )
{
   long rval;
   long sssp;

   sssp = Super( 0L );
   rval = *_systicks;
   Super( sssp );
   return rval;
}

static int wait_for_char( int timeout )
{
   int nfds, status;
   fd_set readfds;
   struct timeval tv;
   struct timezone tz;

   printf( "timeout %d/ticks %ld\n", timeout, Systicks(  ) );
   if ( !ismint )
   {
      /* if in TOS then the timeout value is just stored in tv.usec */
      printf( "timeout %d/ticks %ld\n", timeout, Systicks(  ) );
      timeout = ( timeout * 20 ) + Systicks(  );
      while ( Systicks(  ) < ( long ) timeout )
         if ( Cconis(  ) )
            return 0;
      return -1;
   }

   gettimeofday( &tv, &tz );

   /*
    * if (tv.tv_sec >= timeout->tv_sec && tv.tv_usec >= timeout->tv_usec)
    * return (-1);
    */
   if ( !timeout )
      return ( -1 );

/*
    tv.tv_sec = timeout->tv_sec - tv.tv_sec;
    if (timeout->tv_usec < tv.tv_usec) {
	tv.tv_sec--;
	tv.tv_usec = (timeout->tv_usec + 1000000) - tv.tv_usec;
    } else
	tv.tv_usec = timeout->tv_usec - tv.tv_usec;
*/
   tv.tv_sec = ( timeout * 100000 ) / 1000000;
   tv.tv_usec = ( timeout * 100000 ) % 1000000;

   /* used to be the following, but some boxen have no getdtablesize() */
   /* nfds = getdtablesize (); */
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

static int Agetchar( void )
{
   static int holdover = 0;
   int c, c1;

   if ( ismint )
   {
      c = getchar(  );
      if ( c == 13 )
         c = 10;
      return c;
   }
   if ( holdover )
   {
      c = holdover;
      holdover = 0;
      return c;
   }
 reloop:
   c1 = Cnecin(  );
   if ( c1 & 0xff )
      return c1 & 0xff;
   c = ( ( c1 & 0x00ff0000 ) >> 16 );
   switch ( c )
   {
      case 0x48:
         holdover = 'A';
         return 27;
      case 0x50:
         holdover = 'B';
         return 27;
      case 0x4b:
         holdover = 'C';
         return 27;
      case 0x4d:
         holdover = 'D';
         return 27;
      default:
         goto reloop;
   }
}


static int read_key(  )
{
   int c;

   c = Agetchar(  );


   if ( c == 127 )
      c = '\b';
   else if ( c == 13 )
      c = 10;

   return ( c );

}                               /* read_key */

static void set_cbreak_mode( mode )
   int mode;
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
   if ( status && ismint )
   {
      perror( "ioctl" );
      exit( 1 );
   }

   if ( mode )
   {
      signal( SIGINT, rundown );
      signal( SIGTERM, rundown );
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
      if ( status && ismint )
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
      if ( status && ismint )
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
