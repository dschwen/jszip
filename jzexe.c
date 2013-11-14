
/* $Id: jzexe.c,v 1.1.1.1 2000/05/10 14:21:34 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: jzexe.c,v 1.1.1.1 2000/05/10 14:21:34 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: jzexe.c,v $
 * Revision 1.1.1.1  2000/05/10 14:21:34  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/*
 * jzexe.c  version 1.1
 * 
 * This program creates standalone game executables from Infocom
 * format story files. It does so by concatenating the JZip executable
 * with the story file and then patching the excutable to start reading
 * the story from the correct file position.
 *
 * Written by Magnus Olsson (mol@df.lth.se), 20 November, 1995,
 * as part of the JZip distribution. 
 * You may use this code in any way you like as long as it is
 * attributed to its author.
 *
 */

#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "jzexe.h"

#ifndef TRUE
#define TRUE 1
#define FALSE 0
#endif

#ifndef SEEK_SET
#define SEEK_SET 0
#endif

/* The size of the buffer used when copying files */
#define BUFSIZE 16384

static unsigned char *buf;
static unsigned char *jzipmagic = ( unsigned char * ) MAGIC_STRING;

#if defined(MSDOS) || defined(__MSDOS__)
#define READ_MODE "rb"
#define WRITE_MODE "wb"
#else
#define READ_MODE "r"
#define WRITE_MODE "w"
#endif

#define NAME_LENGTH 200
static char in_name[NAME_LENGTH + 1];
static char out_name[NAME_LENGTH + 1];

/* The name of the JZip executable */
#define JZIP_NAME "jzip.exe"

void abort_program( int exit_code )
{
   fprintf( stderr, "\nProgram aborted.\n" );
   /* Remove output file; it's probably corrupted. */
   remove( out_name );
   exit( exit_code );
}

FILE *open_file( char *name, int input )
{
   char *mode;
   FILE *f;

   if ( input )
   {
      strncpy( in_name, name, NAME_LENGTH );
      /* If name is too long, in_name won't be null terminated: fix this,
       * just in case */
      in_name[NAME_LENGTH] = 0;
      mode = READ_MODE;
   }
   else
   {
      strncpy( out_name, name, NAME_LENGTH );
      out_name[NAME_LENGTH] = 0;
      mode = WRITE_MODE;
   }
   f = fopen( name, mode );
   if ( !f )
   {
      fprintf( stderr, "Error opening file %s\n", name );
      abort_program( 1 );
   }
   return f;
}

/* 
 * Search through the file f for the magic string. If found, return
 * the offset stored in the patch area, otherwise abort the program.
 */
long search( FILE * f )
{
   int c, i;

   i = 0;
   while ( ( c = getc( f ) ) > -1 )
   {
      if ( ( unsigned char ) c != jzipmagic[i] )
      {                         
         if ( ( unsigned char ) c == jzipmagic[0] ) 
            i = 1;
         else
            i = 0;
      }
      else if ( ++i == MAGIC_END )
      {
         /* Found magic string. */
         long offset;

         /* Next byte must be zero. */
         if ( getc( f ) != 0 )
         {
            fprintf( stderr, "Error: standalone flag != 0\n" );
            abort_program( 1 );
         }
         offset = getc( f );
         offset += 256L * getc( f );
         offset += 65536L * getc( f );
         return offset;
      }
   }
   fprintf( stderr, "Couldn't find magic string." );
   abort_program( 1 );
}

/*
 * Copy the file in to the file out. Set length to the length in bytes
 * of the input file, and set magic_pos to the offset of the first
 * occurrence of MAGIC_STRING. 
 */
void copy_and_search( FILE * in, FILE * out, long *length, long *magic_pos )
{
   int c, magic_idx;            
   size_t buf_idx, buf_end;     
   long pos;

   pos = 0;
   buf_idx = buf_end = 0;
   magic_idx = 0;
   *magic_pos = 0;

   for ( ;; )
   {                            
      if ( buf_idx >= buf_end )
      {
         /* Reached end of input buffer; read in a new chunk */
         buf_end = fread( buf, 1, BUFSIZE, in );
         if ( buf_end < 1 )
         {
            /* Reached end of input file. 
             * pos is now the number of bytes read. */
            *length = pos;
            return;
         }
         if ( fwrite( buf, 1, buf_end, out ) != buf_end )
         {
            fprintf( stderr, "Write error on file %s\n", out_name );
            fclose( in );
            fclose( out );
            abort_program( 1 );
         }
         buf_idx = 0;
      }

      c = buf[buf_idx++];       /* Get current character */
      ++pos;                    /* Offset of next byte */

      /* The following search algorithm utilizes the fact that the
       * first character of the magic string is unique. */
      if ( ( unsigned char ) c != jzipmagic[magic_idx] ) 
         if ( ( unsigned char ) c == jzipmagic[0] ) 
            magic_idx = 1;
         else
            magic_idx = 0;
      else if ( ++magic_idx == MAGIC_END )
      {
         /* Matched the entire magic string */
         if ( *magic_pos > 0 )
         {
            /* If this condition occurs, the magic string isn't unique,
             * with potentially bad consequences. Re-compile with a
             * different magic string. */
            fprintf( stderr, "Found more than one instance of the magic string.\n" );
            fclose( in );
            fclose( out );
            abort_program( 1 );
         }
         *magic_pos = pos;
      }
   }
}

/*
 * Copy the input file to the output file.
 */
void copy( FILE * in, FILE * out )
{
   unsigned bytes_read;
   long total = 0;

   do
   {
      bytes_read = fread( buf, 1, BUFSIZE, in );
      if ( bytes_read > 0 )
         if ( fwrite( buf, 1, bytes_read, out ) != bytes_read )
         {
            fprintf( stderr, "Write error on file %s\n", out_name );
            fclose( in );
            fclose( out );
            abort_program( 1 );
         }
      total += bytes_read;
   }
   while ( bytes_read > 0 );

   if ( total == 0 )
      fprintf( stderr, "Nothing read from file %s - probably an error.\n", in_name );
}

/*
 * Patch the output file so it will read Z code from the correct position.
 */
void patch( FILE * f, long pos, long value )
{
   int i;

   fflush( f );
   if ( fseek( f, pos, SEEK_SET ) )
   {
      fprintf( stderr, "Seek error on file %s\n", out_name );
      fclose( f );
      abort_program( 1 );
   }
   /* Set STANDALONE_FLAG to FALSE */
   fputc( FALSE, f );
   /* Write the length of the JZip interpreter to the file as a
    * little-endian, 24-bit number. */
   for ( i = 0; i < 3; ++i )
   {
      fputc( ( int ) ( value & 0xff ), f );
      value >>= 8;
   }
}

void create_executable( char *story, char *jzip )
{
   FILE *in, *out;
   long p, length, pos;
   char fn[NAME_LENGTH + 4];
   char *ext;
   int ok;

   strcpy( in_name, "" );
   strcpy( out_name, "" );

   if ( strlen( story ) > NAME_LENGTH || strlen( jzip ) > NAME_LENGTH )
   {
      fprintf( stderr, "Filename too long.\n" );
      abort_program( 1 );
   }
   strcpy( fn, story );
   ext = strrchr( fn, '.' );
   if ( ext )
      *ext = '\0';
   strcat( fn, ".exe" );

   printf( "Creating standalone story %s\n", fn );
   out = open_file( fn, FALSE );

   printf( "Copying JZip interpreter (%s).\n", jzip );
   in = open_file( jzip, TRUE );

   copy_and_search( in, out, &length, &pos );
   fclose( in );
   if ( pos == 0 )
   {
      fprintf( stderr, "Error: couldn't find magic string.\n" );
      fprintf( stderr, "Check that you have the right version of JZip.\n" );
      abort_program( 1 );
   }

   printf( "Copying story file %s.\n", story );
   in = open_file( story, TRUE );
   copy( in, out );
   fclose( in );

   printf( "Patching interpreter.\n" );
   patch( out, pos, length );
   fclose( out );

   printf( "Done!\n" );
}

void extract_zcode( char *filename )
{
   FILE *in, *out;
   long offset;
   char fn[NAME_LENGTH + 4];
   char *ext;
   int z_version;

   strcpy( in_name, "" );
   strcpy( out_name, "" );

   if ( strlen( filename ) > NAME_LENGTH )
   {
      fprintf( stderr, "Filename too long.\n" );
      abort_program( 1 );
   }

   in = open_file( filename, TRUE );
   offset = search( in );

   fseek( in, offset, SEEK_SET );
   z_version = fgetc( in );
   if ( z_version < 1 || z_version > 8 )
   {
      fprintf( stderr, "Unsupported Z code version: %d\n", z_version );
      abort_program( 1 );
   }
   strcpy( fn, filename );
   ext = strrchr( fn, '.' );
   if ( ext == 0 )
      ext = fn + strlen( fn );
   sprintf( ext, ".z%d", z_version );

   printf( "Extracting Z code to story file %s\n", fn );
   out = open_file( fn, FALSE );

   fputc( z_version, out );
   copy( in, out );
   fclose( in );
   fclose( out );
}

#define USAGE "JZexe Ver. 1.1 - creates standalone Infocom-format games for MS-DOS and Linux.\n\
(c) 1995 by Magnus Olsson (mol@df.lth.se)\n\n\
Usage: jzexe story_file\n\
       jzexe story_file jzip_file\n\n\
These two commands create a standalone game from an Infocom story file.\n\
In the first case, it is assumed that the JZip interpreter is called jzip.exe\n\
and resides in the current directory.\n\n\
       jzexe -x game.exe\n\n\
This command extracts the Z code from a standalone executable and creates\n\
a story file that can be played with JZip or any other interpreter.\n\
Note that the extension '.exe' of the game file must be given.\n"

void main( int argc, char **argv )
{
   buf = ( unsigned char * ) malloc( BUFSIZE * sizeof ( unsigned char ) );

   if ( argc == 3 && strcmp( argv[1], "-x" ) == 0 )
      extract_zcode( argv[2] );
   else if ( argc == 2 )
      create_executable( argv[1], JZIP_NAME );
   else if ( argc == 3 )
      create_executable( argv[1], argv[2] );
   else
      fprintf( stderr, USAGE );

   exit( 0 );
}
