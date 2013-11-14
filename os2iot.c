
/* $Id: os2iot.c,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: os2iot.c,v 1.1.1.1 2000/05/10 14:20:51 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: os2iot.c,v $
 * Revision 1.1.1.1  2000/05/10 14:20:51  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/*
 * os2iot.c
 *
 * keyboard thread for OS/2.
 *
 */

/* Created by John W. Kennedy */

/* Based on pre-existing mscio.c */

/* These functions, and these alone, are maintained in a separate module so */

/*   that they can be compiled with stack probes; all the other functions, */

/*   running in thread 1 alone, do not need stack probes */

/* KbdCharIn is performed in a separate thread so that timed keyboard I/O */

/*   (as in Border Zone) does not burn up the CPU with polling */

/* A functional change is that the cursor is forced visible during a read, */

/*   which is necessary to make the forms in Bureaucracy usable */

/* In the JZIP version, 0x40000000 is added to the result when Scroll Lock is on */

#include "ztypes.h"

#define                 INCL_NOCOMMON
#define                 INCL_DOSSEMAPHORES
#define                 INCL_VIO
#define                 INCL_KBD
#define                 INCL_NOPMAPI
#include <os2.h>

HEV hevKbdReq, hevKbdRsp;
volatile int fKbdOpen;
volatile int iKbdChar;


static int os2_read_key_byte( void )
{

   /* Use this to hold a two-byte value and return it one byte at a time */
   static int iExtend = -1;

   /* If we have saved the second half, return it now, and reset */
   if ( iExtend >= 0 )
   {

      int i = iExtend;

      iExtend = -1;
      return i;

   }
   else
   {

      VIOCURSORINFO vci;
      KBDKEYINFO kki;
      SHORT sAttr;

      /* If we are doing input with the cursor off, turn it on temporarily */
      VioGetCurType( &vci, NULLHANDLE );
      if ( ( sAttr = vci.attr ) != 0 )
      {
         vci.attr = 0;
         VioSetCurType( &vci, NULLHANDLE );
      }                         /* endif */

      /* Do the actual read */
      KbdCharIn( &kki, IO_WAIT, NULLHANDLE );

      /* If we turned the cursor on, turn it off again */
      if ( sAttr )
      {
         vci.attr = sAttr;
         VioSetCurType( &vci, NULLHANDLE );
      }                         /* endif */

      /* If we received a two-byte code, save it to return the second half */
      if ( kki.chChar == 0x00 || kki.chChar == 0xE0 )
      {
#if defined JZIPVER
         /* Add 0x40000000 to certain values to detect scroll-lock */
         if ( kki.fsState & KBDSTF_SCROLLLOCK_ON )
         {
            switch ( kki.chScan )
            {
               case 'H':       /* Up arrow */
               case 'P':       /* Down arrow */
               case 'I':       /* PgUp */
               case 'Q':       /* PgDn */
               case 'K':       /* Left arrow */
               case 's':       /* Ctrl + Left arrow */
               case 'M':       /* Right arrow */
               case 't':       /* Ctrl + Right arrow */
               case 'O':       /* End */
               case 'G':       /* Home */
               case 'S':       /* Delete */
                  iExtend = kki.chScan | 0x40000000;
                  break;
               default:
                  iExtend = kki.chScan;
                  break;
            }                   /* endswitch */
         }
         else
         {
            iExtend = kki.chScan;
         }                      /* endif */
#else
         iExtend = kki.chScan;
#endif
         return kki.chChar;
      }                         /* endif */

#if defined JZIPVER
      /* Add 0x40000000 to certain values to detect scroll-lock */
      if ( kki.fsState & KBDSTF_SCROLLLOCK_ON )
      {
         switch ( kki.chChar )
         {
            case '\x1B':       /* Escape */
               return kki.chChar | 0x40000000;
            default:
               return kki.chChar;
         }                      /* endswitch */
      }
      else
      {
         return kki.chChar;
      }                         /* endif */
#else
      return kki.chChar;
#endif

   }                            /* endif */

}                               /* os2_read_key_byte */


/* This is the actual thread process; we don't need an argument */
void os2_read_key_thread( void *p )
{

   /* Unbroken loop */
   for ( ;; )
   {

      ULONG ulPostCt;

      /* Wait for a request from the main thread */
      DosWaitEventSem( hevKbdReq, SEM_INDEFINITE_WAIT );
      DosResetEventSem( hevKbdReq, &ulPostCt );

      /* Either get a byte and post back or shut down the thread */
      if ( fKbdOpen )
      {
         iKbdChar = os2_read_key_byte(  );
         DosPostEventSem( hevKbdRsp );
      }
      else
      {
         break;
      }                         /* endif */

   }                            /* endfor */

}                               /* os2_read_key_thread */
