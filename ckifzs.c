
/* $Id: ckifzs.c,v 1.1.1.1 2000/05/10 14:21:34 jholder Exp $ 
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information 
 * --------------------------------------------------------------------
 *
 * File name: $Id: ckifzs.c,v 1.1.1.1 2000/05/10 14:21:34 jholder Exp $
 *
 * Description:
 *
 * Modification history:
 * $Log: ckifzs.c,v $
 * Revision 1.1.1.1  2000/05/10 14:21:34  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/* quick command to do a sanity check on a QUETZAL file
 *
 * 28/04/97
 */

/* Altered by John W. Kennedy  2000-03-17 :
 *  Addtnl ln of output with release number, "serial number" checksum fields
 *  Optional file buffering added
 *  Odd-size logic corrected
 *  Stack dump added
 *  Data dump added
 */

/*
#define LONG_DUMP
*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define GOT_HEADER   0x01
#define GOT_MEMORY   0x02
#define GOT_STACKS   0x04
#define GOT_CMEM     0x10
#define GOT_UMEM     0x20
#define GOT_ALL      0x07

#ifndef EXIT_SUCCESS
#define EXIT_SUCCESS 0
#define EXIT_FAILURE 1
#endif

typedef short ZINT16;
typedef unsigned short ZUINT16;

unsigned char read_byte( FILE * fp )
{
   int c;

   if ( ( c = getc( fp ) ) == EOF )
   {
      printf( "*** Premature EOF.\n" );
      exit( EXIT_FAILURE );
   }
   return ( unsigned char ) c;
}

#if defined SHORT_DUMP || defined LONG_DUMP 

void coredump( unsigned long ul, unsigned char uch ) 
{                               
   if ( !( ul % 16 ) )          
      printf( "\n    %08X  ", ul ); 
   else if ( !( ul % 8 ) )      
      fputs( "  ", stdout );    
   else if ( !( ul % 4 ) )      
      putchar( ' ' );           
   printf( "%02X", uch );       
}                               

#endif 

int main( int argc, char **argv )
{
   FILE *fp = stdin;
   char buffer[BUFSIZ];         
   int i;
   unsigned char status = 0;
   char id[5];
   ZUINT16 errors = 0;
   unsigned long filelen, cklen, odd_byte; 

   if ( argc == 2 && strcmp( argv[1], "-" ) )
   {
      if ( ( fp = fopen( argv[1], "rb" ) ) == NULL )
      {
         perror( argv[1] );
         exit( EXIT_FAILURE );
      }
      setbuf( fp, buffer );     
   }
   else
   {
      fprintf( stderr, "usage: %s [file]\n\n", argv[0] );
      fprintf( stderr, "Checks a QUETZAL/IFZS file for conformance to the standard.\n" );
      fprintf( stderr,
               "This does not do in-depth checking, but makes sure all chunk lengths are\n" );
      fprintf( stderr,
               "correct, and ensures all necessary chunks appear and in the correct order.\n" );
      exit( EXIT_FAILURE );
   }

   /* print details of FORM header */
   if ( getc( fp ) != ( int ) 'F' || getc( fp ) != ( int ) 'O' || getc( fp ) != ( int ) 'R' ||
        getc( fp ) != ( int ) 'M' )
   {
      printf( "*** No FORM header: not an IFZS file.\n" );
      exit( EXIT_FAILURE );
   }

   for ( filelen = 0, i = 0; i < 4; ++i )
   {
      filelen = ( filelen << 8 ) | read_byte( fp );
   }

   if ( getc( fp ) != ( int ) 'I' || getc( fp ) != ( int ) 'F' || getc( fp ) != ( int ) 'Z' ||
        getc( fp ) != ( int ) 'S' )
   {
      printf( "*** No IFZS type: not an IFZS file.\n" );
      exit( EXIT_FAILURE );
   }

   fprintf( stdout, "FORM %lu IFZS\n", filelen );
   filelen -= 4;
   if ( filelen & 1 )
   {
      printf( "*** FORM length is even in all legal files\n" );
      ++errors;
   }

   /* loop while there's still something left in the IFZS chunk */
   while ( filelen > 0 )
   {
      /* check there's enough of the IFZS chunk left */
      if ( filelen < 8 )
      {
         printf( "*** IFZS chunk too short to contain another chunk (%lu bytes left)\n", filelen );
         exit( EXIT_FAILURE );
      }

      /* read this chunk's details */
      for ( i = 0; i < 4; ++i )
      {
         id[i] = read_byte( fp );
      }

      for ( i = 0; i < 4; ++i )
      {
         if ( id[i] < 0x20 || id[i] > 0x7E )
         {
            printf( "*** Illegal chunk ID: 0x%02X%02X%02X%02X\n", ( ZUINT16 ) id[0],
                    ( ZUINT16 ) id[1], ( ZUINT16 ) id[2], ( ZUINT16 ) id[3] );
            exit( EXIT_FAILURE );
         }
      }

      for ( cklen = 0, i = 0; i < 4; ++i )
      {
         cklen = ( cklen << 8 ) | read_byte( fp );
      }
      odd_byte = cklen & 1l;    
      id[4] = ( unsigned char ) 0;
      printf( "  %s %6lu", id, cklen );

      /* if it's a known chunk id, print more information */
      if ( !strncmp( id, "IFhd", 4 ) )
      {
         printf( " (QUETZAL header)\n" );
         if ( status & GOT_HEADER )
         {
            printf( "*** Only one IFhd chunk is allowed.\n" );
            ++errors;
         }
         if ( status & ( GOT_STACKS | GOT_MEMORY ) )
         {
            printf( "*** warning: IFhd must come before CMem, UMem, or Stks." );
            ++errors;
         }
         status |= GOT_HEADER;
         if ( cklen >= 2 )      
         {                      
            unsigned char uch1 = read_byte( fp ); 
            unsigned char uch2 = read_byte( fp ); 

            printf( "    Release %u", ( uch1 << 8 ) | uch2 ); 
            cklen -= 2;
            filelen -= 2;       
            if ( cklen >= 6 )   
            {                   
               fputs( "  Serial number ", stdout ); 
               for ( i = 0; i < 6; ++i ) 
               {                
                  putchar( read_byte( fp ) ); 
               }                
               cklen -= 6;
               filelen -= 6;    
               if ( cklen >= 2 ) 
               {                
                  uch1 = read_byte( fp );
                  uch2 = read_byte( fp ); 
                  printf( "  Checksum: %4X", ( uch1 << 8 ) | uch2 ); 
                  cklen -= 2;
                  filelen -= 2; 
                  if ( cklen >= 3 ) 
                  {             
                     unsigned char uch3; 

                     uch1 = read_byte( fp );
                     uch2 = read_byte( fp ); 
                     uch3 = read_byte( fp ); 
                     printf( "  PC: %6X", ( uch1 << 16 ) | 
                             ( uch2 << 8 ) | uch3 ); 
                     cklen -= 3;
                     filelen -= 3; 
                  }             
               }                
            }                   
            putchar( '\n' );    
         }                      
      }
      else if ( !strncmp( id, "CMem", 4 ) )
      {
         unsigned long ul1, ul2; 

         printf( " (compressed memory)" ); 
#if defined SHORT_DUMP          
         for ( ul1 = 0; ul1 < cklen; ++ul1 )
         {                      
            unsigned char uch = read_byte( fp ); 

            coredump( ul1, uch ); 
         }                      
         filelen -= cklen;
         cklen = 0;             
#elif defined LONG_DUMP         
         for ( ul1 = 0, ul2 = 0; ul1 < cklen; ++ul1 )
         {                      
            unsigned char uch = read_byte( fp ); 

            if ( !uch )
            {                   
               int c = read_byte( fp ) + 1;

               ++ul1;           
               while ( c-- )    
                  coredump( ul2++, '\0' ); 
            }
            else                
               coredump( ul2++, uch ); 
         }                      
         putchar( '\n' );       
         filelen -= cklen;
         cklen = 0;             
#endif 

         if ( status & GOT_CMEM )
         {
            printf( "*** warning: only one CMem chunk is allowed.\n" );
            ++errors;
         }
         status |= GOT_MEMORY | GOT_CMEM;
      }
      else if ( !strncmp( id, "UMem", 4 ) )
      {
         printf( " (uncompressed memory)\n" );
         if ( status & GOT_UMEM )
         {
            printf( "*** warning: only one UMem chunk is allowed.\n" );
            ++errors;
         }
         status |= GOT_MEMORY | GOT_UMEM;
      }
      else if ( !strncmp( id, "Stks", 4 ) )
      {
         printf( " (stacks)\n" );

#if defined SHORT_DUMP || defined LONG_DUMP
         while ( cklen > 0 )
         {
            if ( cklen >= 3 )
            {
               unsigned char uch1 = read_byte( fp );
               unsigned char uch2 = read_byte( fp );
               unsigned char uch3 = read_byte( fp );

               printf( "    PC: %6X", ( uch1 << 16 ) | ( uch2 << 8 ) | uch3 );
               cklen -= 3;
               filelen -= 3;
               if ( cklen >= 1 )
               {
                  unsigned char uchFlags = read_byte( fp );

                  printf( "  Flags: %02X", uchFlags );
                  cklen -= 1;
                  filelen -= 1;
                  if ( cklen >= 1 ) 
                  {             
                     uch1 = read_byte( fp ); 
                     if ( uchFlags & 0x10 )
                     {          
                     }          
                     else       
                     {          
                        fputs( "  Return: ", stdout ); 
                        switch ( uch1 ) 
                        {       
                           case 0: 
                              fputs( "sp", stdout ); 
                              break; 
                           case 1:
                           case 2:
                           case 3:
                           case 4:
                           case 5: 
                           case 6:
                           case 7:
                           case 8:
                           case 9: 
                           case 10:
                           case 11:
                           case 12:
                           case 13: 
                           case 14:
                           case 15: 
                              printf( "local%d", uch1 - 1 ); 
                              break; 
                           default: 
                              printf( "g%02x", uch1 - 16 ); 
                              break; 
                        }       
                     }          
                     cklen -= 1;
                     filelen -= 1; 
                     if ( cklen >= 1 ) 
                     {          
                        uch1 = read_byte( fp ); 
                        printf( "  Args: %02X", uch1 ); 
                        cklen -= 1;
                        filelen -= 1; 
                        if ( cklen >= 1 ) 
                        {       
                           unsigned short usStack; 

                           uch1 = read_byte( fp ); 
                           uch2 = read_byte( fp ); 
                           usStack = ( uch1 << 8 ) | uch2; 
                           printf( "  Local stack use: %d", usStack ); 
                           cklen -= 2;
                           filelen -= 2; 
                           if ( cklen >= ( uchFlags & 0x0Fu ) * 2 ) 
                           {    
                              unsigned int i; 

                              for ( i = 0; i < ( uchFlags & 0xFu ); ++i ) 
                              { 
                                 uch1 = read_byte( fp ); 
                                 uch2 = read_byte( fp ); 
                                 if ( i & 0x07u ) 
                                 { 
                                 } 
                                 else 
                                 { 
                                    fputs( "\n     ", stdout ); 
                                 } 
                                 printf( " l%d=%04X", i, 
                                         ( uch1 << 8 ) | uch2 ); 
                                 cklen -= 2;
                                 filelen -= 2; 
                              } 
                              if ( cklen >= usStack * 2 ) 
                              { 
                                 for ( i = 0; i < usStack; ++i ) 
                                 { 
                                    if ( i & 0x07u ) 
                                    { 
                                    } 
                                    else 
                                    { 
                                       fputs( "\n     ", stdout ); 
                                    } 
                                    uch1 = read_byte( fp ); 
                                    uch2 = read_byte( fp ); 
                                    printf( " %04X", ( uch1 << 8 ) | 
                                            uch2 ); 
                                    cklen -= 2;
                                    filelen -= 2; 
                                 } 
                              } 
                           }    
                        }       
                     }          
                  }             
               }                
            }                   /* endif */
            putchar( '\n' );    
         }                      
#endif 
         if ( status & GOT_STACKS )
         {
            printf( "*** warning: only one Stks chunk is allowed.\n" );
            ++errors;
         }
         status |= GOT_STACKS;
      }
      else if ( !strncmp( id, "IntD", 4 ) )
      {
         printf( " (interpreter-dependent)" ); 
         if ( cklen >= 4 )      
         {                      
            unsigned char uch1; 

            fputs( "    Operating system ", stdout ); 
            for ( i = 0; i < 4; ++i ) 
            {                   
               putchar( read_byte( fp ) ); 
            }                   
            cklen -= 4;
            filelen -= 4;       
            if ( cklen >= 1 )   
            {                   
               fputs( "  flags ", stdout ); 
               uch1 = read_byte( fp ); 
               if ( uch1 & 0x02 ) 
               {                
                  putchar( 's' ); 
               }                
               if ( uch1 & 0x01 ) 
               {                
                  putchar( 'c' ); 
               }                
               cklen -= 1;
               filelen -= 1;    
               if ( cklen >= 1 ) 
               {                
                  printf( "  contents id %02X", read_byte( fp ) ); 
                  cklen -= 1;
                  filelen -= 2; 
                  if ( cklen >= 6 ) 
                  {             
                     ( void ) read_byte( fp ); /* discard */
                     ( void ) read_byte( fp ); /* discard */
                     cklen -= 2;
                     filelen -= 2; 
                     fputs( "    Interpreter ", stdout ); 
                     for ( i = 0; i < 4; ++i ) 
                     {          
                        putchar( read_byte( fp ) ); 
                     }          
                     cklen -= 4;
                     filelen -= 4; 
                     printf( "  %d bytes of data", cklen ); 
                  }             
               }                
            }                   
         }                      
         putchar( '\n' );       
      }
      else if ( !strncmp( id, "ANNO", 4 ) )
      {
         printf( " (annotation)" ); 
         if ( cklen >= 1 )      
         {                      
            unsigned long l;    
            unsigned char uch1; 

            fputs( "    ", stdout ); 
            for ( l = 0; l < cklen; ++l ) 
            {                   
               putchar( read_byte( fp ) ); 
            }                   
            filelen -= cklen;
            cklen = 0;          
         }                      
         putchar( '\n' );       
      }
      else if ( !strncmp( id, "AUTH", 4 ) )
      {
         printf( " (author)" ); 
         if ( cklen >= 1 )      
         {                      
            unsigned long l;    
            unsigned char uch1; 

            fputs( "    ", stdout ); 
            for ( l = 0; l < cklen; ++l ) 
            {                   
               putchar( read_byte( fp ) ); 
            }                   
            filelen -= cklen;
            cklen = 0;          
         }                      
         putchar( '\n' );       
      }
      else if ( !strncmp( id, "NAME", 4 ) )
      {
         printf( " (name of content)" ); 
         if ( cklen >= 1 )      
         {                      
            unsigned long l;    
            unsigned char uch1; 

            fputs( "    ", stdout ); 
            for ( l = 0; l < cklen; ++l ) 
            {                   
               putchar( read_byte( fp ) ); 
            }                   
            filelen -= cklen;
            cklen = 0;          
         }                      
         putchar( '\n' );       
      }
      else if ( !strncmp( id, "(c) ", 4 ) )
      {
         printf( " (copyright on content)" ); 
         if ( cklen >= 1 )      
         {                      
            unsigned long l;    
            unsigned char uch1; 

            fputs( "    ", stdout ); 
            for ( l = 0; l < cklen; ++l ) 
            {                   
               putchar( read_byte( fp ) ); 
            }                   
            filelen -= cklen;
            cklen = 0;          
         }                      
         putchar( '\n' );       
      }
      else if ( !strncmp( id, "    ", 4 ) )
      {
         printf( " (%d-byte filler)\n", cklen ); 
      }
      else
      {
         printf( "\n*** Unknown %d-byte chunk type found.\n", cklen ); 
         ++errors;
      }
      filelen -= 8;

      if ( cklen > filelen )
      {
         printf( "*** Chunk extends past end of IFZS chunk (%lu left in IFZS)\n", filelen );
         exit( EXIT_FAILURE );
      }
      cklen = ( cklen + odd_byte ); 
      filelen -= cklen;
      for ( ; cklen > 0; --cklen )
      {
         ( void ) read_byte( fp ); /* skip chunk contents */
      }
   }

   if ( getc( fp ) != EOF )
   {
      for ( filelen = 1; getc( fp ) != EOF; ++filelen ) ;
      printf( "*** Spurious data (%lu bytes) past specified chunk length\n", filelen );
      ++errors;
   }

   if ( argc == 2 && strcmp( argv[1], "-" ) )
   {
      fclose( fp );
   }

   i = EXIT_SUCCESS;

   if ( ( status & GOT_ALL ) != GOT_ALL )
   {
      printf( "\n*** Missing chunks:" );
      if ( !( status & 0x01 ) )
         printf( " IFhd" );
      if ( !( status & 0x02 ) )
         printf( " Stks" );
      if ( !( status & 0x04 ) )
         printf( " CMem/UMem" );
      printf( "\n" );
      i = EXIT_FAILURE;
   }

   if ( errors > 0 )
   {
      printf( "\n*** %u error%s.\n", errors, ( errors > 1 ) ? "s" : "" );
      i = EXIT_FAILURE;
   }
   else
   {
      printf( "\nSave file is valid.\n" );
   }

   return ( i );
}
