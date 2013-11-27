
/* $Id: object.c,v 1.2 2000/05/25 22:28:56 jholder Exp $   
 * --------------------------------------------------------------------
 * see doc/License.txt for License Information   
 * --------------------------------------------------------------------
 * 
 * File name: $Id: object.c,v 1.2 2000/05/25 22:28:56 jholder Exp $  
 *   
 * Description:    
 *    
 * Modification history:      
 * $Log: object.c,v $
 * Revision 1.2  2000/05/25 22:28:56  jholder
 * changes routine names to reflect zmachine opcode names per spec 1.0
 *
 * Revision 1.1.1.1  2000/05/10 14:21:34  jholder
 *
 * imported
 *
 *
 * --------------------------------------------------------------------
 */

/*
 * object.c
 *
 * Object manipulation routines.
 *
 */

#include "ztypes.h"

#define PARENT 0
#define NEXT 1
#define CHILD 2

static zword_t read_object( zword_t objp, int field );
static void write_object( zword_t objp, int field, zword_t value );

/*
 * get_object_address
 *
 * Calculate the address of an object in the data area.
 *
 */

zword_t get_object_address( zword_t obj )
{
   int offset;

   /* Address calculation is object table base + size of default properties area +
    * object number-1 * object size */

   if ( h_type < V4 )
      offset = h_objects_offset + ( ( P3_MAX_PROPERTIES - 1 ) * 2 ) + ( ( obj - 1 ) * O3_SIZE );
   else
      offset = h_objects_offset + ( ( P4_MAX_PROPERTIES - 1 ) * 2 ) + ( ( obj - 1 ) * O4_SIZE );

   return ( ( zword_t ) offset );

}                               /* get_object_address */

/*
 * z_insert_obj
 *
 * Insert object 1 as the child of object 2 after first removing it from its
 * previous parent. The object is inserted at the front of the child object
 * chain.
 *
 */

void z_insert_obj( zword_t obj1, zword_t obj2 )
{
   zword_t obj1p, obj2p, child2;

#ifdef STRICTZ
   if ( obj1 == 0 )
   {
      report_strictz_error( STRZERR_MOVE_OBJECT, "@insert_obj called moving object 0" );
   }
   if ( obj2 == 0 )
   {
      report_strictz_error( STRZERR_MOVE_OBJECT_2, "@insert_obj called moving into object 0" );
   }
#endif


   /* Get addresses of both objects */

   obj1p = get_object_address( obj1 );
   obj2p = get_object_address( obj2 );

   /* Remove object 1 from current parent */

   z_remove_obj( obj1 );

   /* Make object 2 object 1's parent */

   write_object( obj1p, PARENT, obj2 );

   /* Get current first child of object 2 */

   child2 = read_object( obj2p, CHILD );

   /* Make object 1 first child of object 2 */

   write_object( obj2p, CHILD, obj1 );

   /* If object 2 had children then link them into the next child field of object 1 */

   if ( child2 )
      write_object( obj1p, NEXT, child2 );

}                               /* z_insert_obj */

/*
 * z_remove_obj
 *
 * Remove an object by unlinking from the its parent object and from its
 * siblings.
 *
 */

void z_remove_obj( zword_t obj )
{
   zword_t objp, parentp, childp, parent, child;

#ifdef STRICTZ
   if ( obj == 0 )
   {
      report_strictz_error( STRZERR_REMOVE_OBJECT, "@remove_obj called with object 0" );
   }
#endif

   /* Get address of object to be removed */

   objp = get_object_address( obj );

   /* Get parent of object, and return if no parent */

   if ( ( parent = read_object( objp, PARENT ) ) == 0 )
      return;

   /* Get address of parent object */

   parentp = get_object_address( parent );

   /* Find first child of parent */

   child = read_object( parentp, CHILD );

   /* If object is first child then just make the parent child pointer
    * equal to the next child */

   if ( child == obj )
      write_object( parentp, CHILD, read_object( objp, NEXT ) );
   else
   {

      /* Walk down the child chain looking for this object */

      do
      {
         childp = get_object_address( child );
         child = read_object( childp, NEXT );
      }
      while ( child != obj );

      /* Set the next pointer thre previous child to the next pointer
       * of the current object child pointer */

      write_object( childp, NEXT, read_object( objp, NEXT ) );
   }

   /* Set the parent and next child pointers to NULL */

   write_object( objp, PARENT, 0 );
   write_object( objp, NEXT, 0 );

}                               /* z_remove_obj */

/*
 * z_get_parent
 *
 * Load the parent object pointer of an object
 *
 */

void z_get_parent( zword_t obj )
{

#ifdef STRICTZ
   if ( obj == 0 )
   {
      report_strictz_error( STRZERR_GET_PARENT, "@get_parent called with object 0" );
      store_operand( 0 );
      return;
   }
#endif

   store_operand( read_object( get_object_address( obj ), PARENT ) );

}                               /* z_get_parent */

/*
 * z_get_child
 *
 * Load the child object pointer of an object and jump if the child pointer is
 * not NULL.
 *
 */

void z_get_child( zword_t obj )
{
   zword_t child;

#ifdef STRICTZ
   if ( obj == 0 )
   {
      report_strictz_error( STRZERR_GET_CHILD, "@get_child called with object 0" );
      store_operand( 0 );
      conditional_jump( FALSE );
      return;
   }
#endif

   child = read_object( get_object_address( obj ), CHILD );

   store_operand( child );

   conditional_jump( child != 0 );

}                               /* z_get_child */

/*
 * z_get_sibling
 *
 * Load the next child object pointer of an object and jump if the next child
 * pointer is not NULL.
 *
 */

void z_get_sibling( zword_t obj )
{
   zword_t next;

#ifdef STRICTZ
   if ( obj == 0 )
   {
      report_strictz_error( STRZERR_GET_SIBLING, "@get_sibling called with object 0" );
      store_operand( 0 );
      conditional_jump( FALSE );
      return;
   }
#endif

   next = read_object( get_object_address( obj ), NEXT );

   store_operand( next );

   conditional_jump( next != 0 );

}                               /* z_get_sibling */

/*
 * z_jin
 *
 * Jump if object 2 is the parent of object 1
 *
 */

void z_jin( zword_t obj1, zword_t obj2 )
{

#ifdef STRICTZ
   if ( obj1 == 0 )
   {
      report_strictz_error( STRZERR_JIN, "@jin called with object 0" );
      conditional_jump( 0 == obj2 );
      return;
   }
#endif

   conditional_jump( read_object( get_object_address( obj1 ), PARENT ) == obj2 );

}                               /* z_jin */

/*
 * z_test_attr
 *
 * Test if an attribute bit is set.
 *
 */

void z_test_attr( zword_t obj, zword_t bit )
{
   zword_t objp;
   zbyte_t value;

   assert( O3_ATTRIBUTES == O4_ATTRIBUTES );

#ifdef STRICTZ
   if ( obj == 0 )
   {
      report_strictz_error( STRZERR_TEST_ATTR, "@test_attr called with object 0" );
      conditional_jump( FALSE );
      return;
   }
#endif

   /* Get attribute address */

   objp = get_object_address( obj ) + ( bit >> 3 );

   /* Load attribute byte */

   value = get_byte( objp );

   /* Test attribute */

   conditional_jump( ( value >> ( 7 - ( bit & 7 ) ) ) & 1 );

}                               /* z_test_attr */

/*
 * z_set_attr
 *
 * Set an attribute bit.
 *
 */

void z_set_attr( zword_t obj, zword_t bit )
{
   zword_t objp;
   zbyte_t value;

   assert( O3_ATTRIBUTES == O4_ATTRIBUTES );

#ifdef STRICTZ
   if ( obj == 0 )
   {
      report_strictz_error( STRZERR_SET_ATTR, "@set_attr called with object 0" );
      return;
   }
#endif

   /* Get attribute address */

   objp = get_object_address( obj ) + ( bit >> 3 );

   /* Load attribute byte */

   value = get_byte( objp );

   /* Set attribute bit */

   value |= ( zbyte_t ) ( 1 << ( 7 - ( bit & 7 ) ) );

   /* Store attribute byte */

   set_byte( objp, value );

}                               /* z_set_attr */

/*
 * z_clear_attr
 *
 * Clear an attribute bit
 *
 */

void z_clear_attr( zword_t obj, zword_t bit )
{
   zword_t objp;
   zbyte_t value;

   assert( O3_ATTRIBUTES == O4_ATTRIBUTES );

#ifdef STRICTZ
   if ( obj == 0 )
   {
      report_strictz_error( STRZERR_CLEAR_ATTR, "@clear_attr called with object 0" );
      return;
   }
#endif

   /* Get attribute address */

   objp = get_object_address( obj ) + ( bit >> 3 );

   /* Load attribute byte */

   value = get_byte( objp );

   /* Clear attribute bit */

   value &= ( zbyte_t ) ~ ( 1 << ( 7 - ( bit & 7 ) ) );

   /* Store attribute byte */

   set_byte( objp, value );

}                               /* z_clear_attr */

static zword_t read_object( zword_t objp, int field )
{
   zword_t value;

   if ( h_type < V4 )
   {
      if ( field == PARENT )
         value = ( zword_t ) get_byte( PARENT3( objp ) );
      else if ( field == NEXT )
         value = ( zword_t ) get_byte( NEXT3( objp ) );
      else
         value = ( zword_t ) get_byte( CHILD3( objp ) );
   }
   else
   {
      if ( field == PARENT )
         value = get_word( PARENT4( objp ) );
      else if ( field == NEXT )
         value = get_word( NEXT4( objp ) );
      else
         value = get_word( CHILD4( objp ) );
   }

   return ( value );

}                               /* read_object */

static void write_object( zword_t objp, int field, zword_t value )
{

   if ( h_type < V4 )
   {
      if ( field == PARENT )
         set_byte( PARENT3( objp ), value );
      else if ( field == NEXT )
         set_byte( NEXT3( objp ), value );
      else
         set_byte( CHILD3( objp ), value );
   }
   else
   {
      if ( field == PARENT )
         set_word( PARENT4( objp ), value );
      else if ( field == NEXT )
         set_word( NEXT4( objp ), value );
      else
         set_word( CHILD4( objp ), value );
   }

}                               /* write_object */
