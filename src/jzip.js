// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 13464;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([228,246,252,196,214,220,223,187,171,235,239,255,203,207,225,233,237,243,250,253,193,201,205,211,218,221,224,232,236,242,249,192,200,204,210,217,226,234,238,244,251,194,202,206,212,219,229,197,248,216,227,241,245,195,209,213,230,198,231,199,254,240,222,208,163,111,79,161,191,0,0,0,97,101,111,101,117,101,65,101,79,101,85,101,115,115,62,62,60,60,0,0,0,0,0,0,92,47,43,45,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,36,0,0,0,37,0,0,0,0,0,0,0,0,0,0,0,40,0,0,0,41,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,45,0,0,0,46,0,0,0,47,0,0,0,115,116,111,114,121,46,115,99,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,115,116,111,114,121,46,115,97,118,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,115,116,111,114,121,46,114,101,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,240,21,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,66,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,255,3,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,115,116,111,114,121,46,97,117,120,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,99,111,110,115,111,108,101,46,108,111,103,40,39,99,108,101,97,114,95,115,116,97,116,117,115,95,119,105,110,100,111,119,40,41,39,41,59,0,0,0,70,105,108,101,32,99,111,110,116,97,105,110,115,32,98,111,103,117,115,32,67,77,101,109,32,99,104,117,110,107,0,0,111,112,101,110,95,115,116,111,114,121,40,41,58,32,90,99,111,100,101,32,102,105,108,101,32,110,111,116,32,102,111,117,110,100,0,0,0,0,0,0,99,111,110,115,111,108,101,46,108,111,103,40,39,99,108,101,97,114,95,116,101,120,116,95,119,105,110,100,111,119,40,41,39,41,59,0,0,0,0,0,74,90,105,112,47,109,97,103,105,99,32,40,109,111,108,41,126,126,126,126,0,0,0,0,66,97,100,32,99,111,108,111,117,114,33,0,0,0,0,0,101,114,114,111,114,58,32,116,104,105,115,32,115,97,118,101,45,102,105,108,101,32,117,115,101,115,32,109,111,114,101,32,115,116,97,99,107,32,116,104,97,110,32,73,32,99,97,110,32,99,111,112,101,32,119,105,116,104,46,0,0,0,0,0,37,115,32,0,0,0,0,0,99,111,110,115,111,108,101,46,108,111,103,40,39,99,108,101,97,114,95,108,105,110,101,40,41,39,41,59,0,0,0,0,99,111,110,115,111,108,101,46,108,111,103,40,39,122,95,112,114,105,110,116,95,116,97,98,108,101,39,41,59,0,0,0,101,114,114,111,114,58,32,116,104,105,115,32,103,97,109,101,32,117,115,101,115,32,105,110,99,111,109,112,108,101,116,101,32,97,114,103,117,109,101,110,116,32,108,105,115,116,115,32,40,119,104,105,99,104,32,73,32,99,97,110,39,116,32,104,97,110,100,108,101,41,46,0,73,78,70,79,67,79,77,95,80,65,84,72,0,0,0,0,119,105,110,100,111,119,91,39,106,115,87,114,105,116,101,67,104,97,114,39,93,40,49,51,41,59,0,0,0,0,0,0,101,114,114,111,114,58,32,119,114,111,110,103,32,118,97,114,105,97,98,108,101,32,110,117,109,98,101,114,32,111,110,32,115,116,97,99,107,32,40,119,114,111,110,103,32,115,116,111,114,121,32,102,105,108,101,63,41,46,0,0,0,0,0,0,114,98,0,0,0,0,0,0,32,77,111,118,101,115,58,32,0,0,0,0,0,0,0,0,101,114,114,111,114,58,32,116,104,105,115,32,115,97,118,101,45,102,105,108,101,32,104,97,115,32,116,111,111,32,109,117,99,104,32,115,116,97,99,107,44,32,97,110,100,32,73,32,99,97,110,39,116,32,99,111,112,101,46,0,0,0,0,0,115,97,118,101,95,114,101,115,116,111,114,101,40,41,58,32,82,101,97,100,32,102,114,111,109,32,83,65,86,69,32,102,105,108,101,32,102,97,105,108,101,100,0,0,0,0,0,0,87,114,105,116,101,32,116,111,32,83,65,86,69,32,102,105,108,101,32,102,97,105,108,101,100,0,0,0,0,0,0,0,46,115,114,99,0,0,0,0,115,97,118,101,95,114,101,115,116,111,114,101,40,41,58,32,87,114,111,110,103,32,103,97,109,101,32,111,114,32,118,101,114,115,105,111,110,0,0,0,46,97,117,120,0,0,0,0,67,97,110,110,111,116,32,111,112,101,110,32,83,65,86,69,32,102,105,108,101,0,0,0,60,37,111,62,10,0,0,0,115,97,118,101,46,115,97,118,0,0,0,0,0,0,0,0,82,101,99,111,114,100,32,102,105,108,101,32,111,112,101,110,32,102,97,105,108,101,100,0,114,0,0,0,0,0,0,0,115,116,111,114,121,46,97,117,120,0,0,0,0,0,0,0,82,101,99,111,114,100,105,110,103,32,111,114,32,114,101,112,108,97,121,105,110,103,32,105,115,32,97,108,114,101,97,100,121,32,97,99,116,105,118,101,46,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,115,116,111,114,121,46,114,101,99,0,0,0,0,0,0,0,60,37,48,111,62,10,0,0,32,83,99,111,114,101,58,32,0,0,0,0,0,0,0,0,70,105,108,101,32,99,111,110,116,97,105,110,115,32,116,119,111,32,115,116,97,99,107,32,99,104,117,110,107,115,33,0,115,116,111,114,121,46,115,99,114,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,82,101,99,111,114,100,32,102,105,108,101,32,99,114,101,97,116,101,32,102,97,105,108,101,100,0,0,0,0,0,0,0,82,101,99,111,114,100,105,110,103,32,111,114,32,112,108,97,121,98,97,99,107,32,97,114,101,32,97,108,114,101,97,100,121,32,97,99,116,105,118,101,46,0,0,0,0,0,0,0,32,48,49,50,51,52,53,54,55,56,57,46,44,33,63,95,35,39,34,47,92,60,45,58,40,41,0,0,0,0,0,0,83,99,114,105,112,116,32,102,105,108,101,32,99,114,101,97,116,101,32,102,97,105,108,101,100,0,0,0,0,0,0,0,46,114,101,99,0,0,0,0,119,0,0,0,0,0,0,0,83,99,114,105,112,116,32,102,105,108,101,32,111,112,101,110,32,102,97,105,108,101,100,0,97,0,0,0,0,0,0,0,119,98,0,0,0,0,0,0,32,83,116,111,114,121,46,0,37,100,0,0,0,0,0,0,80,108,97,121,105,110,103,32,97,32,86,101,114,115,105,111,110,32,0,0,0,0,0,0,32,84,105,109,101,58,32,0,70,105,108,101,32,119,97,115,32,110,111,116,32,115,97,118,101,100,32,102,114,111,109,32,116,104,105,115,32,115,116,111,114,121,33,0,0,0,0,0,122,95,115,116,111,114,101,98,40,41,58,32,65,116,116,101,109,112,116,101,100,32,119,114,105,116,101,32,111,117,116,115,105,100,101,32,111,102,32,100,97,116,97,32,97,114,101,97,0,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,84,117,101,44,32,79,99,116,32,49,48,32,50,48,48,48,0,0,0,0,0,0,0,0,82,101,108,101,97,115,101,32,0,0,0,0,0,0,0,0,32,10,48,49,50,51,52,53,54,55,56,57,46,44,33,63,95,35,39,34,47,92,45,58,40,41,0,0,0,0,0,0,72,65,82,68,95,67,79,76,79,82,83,32,0,0,0,0,46,115,99,114,0,0,0,0,76,79,85,83,89,95,82,65,78,68,79,77,32,0,0,0,119,105,110,100,111,119,91,39,106,115,83,101,116,87,105,110,100,111,119,39,93,40,39,115,116,97,116,117,115,39,41,59,0,0,0,0,0,0,0,0,85,83,69,95,81,85,69,84,90,65,76,32,0,0,0,0,67,111,109,112,105,108,101,32,111,112,116,105,111,110,115,58,32,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,90,45,109,97,99,104,105,110,101,32,111,112,101,114,97,116,105,111,110,58,32,99,97,110,39,116,32,115,97,118,101,32,119,104,105,108,101,32,105,110,32,105,110,116,101,114,114,117,112,116,46,0,0,0,0,0,32,67,111,109,112,108,105,97,110,99,101,46,0,0,0,0,37,100,46,37,100,0,0,0,115,116,111,114,101,95,112,114,111,112,101,114,116,121,40,41,58,32,78,111,32,115,117,99,104,32,112,114,111,112,101,114,116,121,0,0,0,0,0,0,64,115,101,116,95,116,101,120,116,95,115,116,121,108,101,32,99,97,108,108,101,100,32,119,105,116,104,32,105,110,118,97,108,105,100,32,109,111,100,101,46,0,0,0,0,0,0,0,41,46,32,82,101,112,111,114,116,105,110,103,32,83,112,101,99,32,0,0,0,0,0,0,99,111,110,115,111,108,101,46,108,111,103,40,39,98,101,102,111,114,101,32,116,105,109,101,45,49,39,41,0,0,0,0,83,97,118,101,32,102,105,108,101,32,104,97,115,32,116,119,111,32,73,70,104,100,32,99,104,117,110,107,115,33,0,0,122,95,115,116,111,114,101,119,40,41,58,32,65,116,116,101,109,112,116,101,100,32,119,114,105,116,101,32,111,117,116,115,105,100,101,32,111,102,32,100,97,116,97,32,97,114,101,97,0,0,0,0,0,0,0,0,86,77,83,0,0,0,0,0,114,101,97,100,95,100,97,116,97,95,98,121,116,101,40,41,58,32,70,101,116,99,104,105,110,103,32,100,97,116,97,32,102,114,111,109,32,105,110,118,97,108,105,100,32,112,97,103,101,33,0,0,0,0,0,0,105,110,116,101,114,112,114,101,116,40,41,58,32,73,108,108,101,103,97,108,32,122,101,114,111,32,111,112,101,114,97,110,100,32,105,110,115,116,114,117,99,116,105,111,110,0,0,0,85,78,73,88,0,0,0,0,68,79,83,0,0,0,0,0,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,0,0,0,0,0,0,65,116,97,114,105,32,83,84,0,0,0,0,0,0,0,0,46,115,97,118,0,0,0,0,65,109,105,103,97,0,0,0,71,101,110,101,114,105,99,0,32,40,0,0,0,0,0,0,74,122,105,112,32,86,50,46,49,0,0,0,0,0,0,0,101,114,114,111,114,58,32,110,111,32,109,101,109,111,114,121,32,99,104,117,110,107,32,105,110,32,102,105,108,101,46,0,108,111,97,100,95,99,97,99,104,101,40,41,58,32,73,110,115,117,102,102,105,99,105,101,110,116,32,109,101,109,111,114,121,32,116,111,32,112,108,97,121,32,103,97,109,101,0,0,82,117,110,110,105,110,103,32,111,110,32,0,0,0,0,0,27,91,48,109,27,91,49,109,0,0,0,0,0,0,0,0,101,114,114,111,114,58,32,110,111,32,115,116,97,99,107,32,99,104,117,110,107,32,105,110,32,102,105,108,101,46,0,0,114,101,97,100,95,112,97,103,101,40,41,58,32,90,99,111,100,101,32,102,105,108,101,32,114,101,97,100,32,101,114,114,111,114,0,0,0,0,0,0,37,115,47,37,115,0,0,0,119,105,110,100,111,119,91,39,106,115,83,101,116,87,105,110,100,111,119,39,93,40,39,116,101,120,116,39,41,59,0,0,84,104,105,115,32,105,115,32,110,111,116,32,97,32,115,97,118,101,100,32,103,97,109,101,32,102,105,108,101,33,0,0,27,91,37,100,109,0,0,0,108,111,97,100,95,110,101,120,116,95,112,114,111,112,101,114,116,121,40,41,58,32,78,111,32,115,117,99,104,32,112,114,111,112,101,114,116,121,0,0,101,114,114,111,114,58,32,110,111,32,104,101,97,100,101,114,32,99,104,117,110,107,32,105,110,32,102,105,108,101,46,0,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,0,0,0,0,114,101,97,100,95,99,111,100,101,95,98,121,116,101,40,41,58,32,114,101,97,100,32,102,114,111,109,32,110,111,110,45,101,120,105,115,116,97,110,116,32,112,97,103,101,33,10,9,40,89,111,117,114,32,100,121,110,97,109,105,99,32,109,101,109,111,114,121,32,117,115,97,103,101,32,95,109,97,121,95,32,98,101,32,111,118,101,114,32,54,52,107,32,105,110,32,115,105,122,101,33,41,0,0,119,97,114,110,105,110,103,58,32,85,77,101,109,32,99,104,117,110,107,32,119,114,111,110,103,32,115,105,122,101,33,0,105,110,116,101,114,112,114,101,116,40,41,58,32,73,108,108,101,103,97,108,32,50,32,111,114,32,109,111,114,101,32,111,112,101,114,97,110,100,32,105,110,115,116,114,117,99,116,105,111,110,0,0,0,0,0,0,32,9,10,12,46,44,63,0,58,0,0,0,0,0,0,0,105,110,116,101,114,112,114,101,116,40,41,58,32,73,108,108,101,103,97,108,32,101,120,116,101,110,100,101,100,32,111,112,101,114,97,110,100,32,105,110,115,116,114,117,99,116,105,111,110,0,0,0,0,0,0,0,119,97,114,110,105,110,103,58,32,67,77,101,109,32,99,104,117,110,107,32,116,111,111,32,108,111,110,103,33,0,0,0,84,111,111,32,109,97,110,121,32,119,111,114,100,115,32,116,121,112,101,100,44,32,100,105,115,99,97,114,100,105,110,103,58,32,0,0,0,0,0,0,80,65,84,72,0,0,0,0,122,95,116,104,114,111,119,40,41,58,32,110,111,110,101,120,105,115,116,97,110,116,32,102,114,97,109,101,0,0,0,0,87,114,111,110,103,32,103,97,109,101,32,111,114,32,118,101,114,115,105,111,110,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _srand(seed) {}
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }function _rewind(stream) {
      // void rewind(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rewind.html
      _fseek(stream, 0, 0);  // SEEK_SET.
      var streamObj = FS.getStream(stream);
      if (streamObj) streamObj.error = false;
    }
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  Module["_strcpy"] = _strcpy;
  Module["_strlen"] = _strlen;function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  var ___strtok_state=0;
  function _strtok_r(s, delim, lasts) {
      var skip_leading_delim = 1;
      var spanp;
      var c, sc;
      var tok;
      if (s == 0 && (s = getValue(lasts, 'i8*')) == 0) {
        return 0;
      }
      cont: while (1) {
        c = getValue(s++, 'i8');
        for (spanp = delim; (sc = getValue(spanp++, 'i8')) != 0;) {
          if (c == sc) {
            if (skip_leading_delim) {
              continue cont;
            } else {
              setValue(lasts, s, 'i8*');
              setValue(s - 1, 0, 'i8');
              return s - 1;
            }
          }
        }
        break;
      }
      if (c == 0) {
        setValue(lasts, 0, 'i8*');
        return 0;
      }
      tok = s - 1;
      for (;;) {
        c = getValue(s++, 'i8');
        spanp = delim;
        do {
          if ((sc = getValue(spanp++, 'i8')) == c) {
            if (c == 0) {
              s = 0;
            } else {
              setValue(s - 1, 0, 'i8');
            }
            setValue(lasts, s, 'i8*');
            return tok;
          }
        } while (sc != 0);
      }
      abort('strtok_r error!');
    }function _strtok(s, delim) {
      return _strtok_r(s, delim, ___strtok_state);
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function _isprint(chr) {
      return 0x1F < chr && chr < 0x7F;
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }var _putc=_fputc;
  function _fgets(s, n, stream) {
      // char *fgets(char *restrict s, int n, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return 0;
      if (streamObj.error || streamObj.eof) return 0;
      var byte_;
      for (var i = 0; i < n - 1 && byte_ != 10; i++) {
        byte_ = _fgetc(stream);
        if (byte_ == -1) {
          if (streamObj.error || (streamObj.eof && i == 0)) return 0;
          else if (streamObj.eof) break;
        }
        HEAP8[(((s)+(i))|0)]=byte_
      }
      HEAP8[(((s)+(i))|0)]=0
      return s;
    }
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }function _fscanf(stream, format, varargs) {
      // int fscanf(FILE *restrict stream, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        return -1;
      }
      var buffer = [];
      function get() {
        var c = _fgetc(stream);
        buffer.push(c);
        return c;
      };
      function unget() {
        _ungetc(buffer.pop(), stream);
      };
      return __scanString(format, get, unget, varargs);
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = Pointer_stringify(path);
      try {
        FS.rmdir(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  Module["_tolower"] = _tolower;
  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }
  function _emscripten_asm_const(code) {
      Runtime.getAsmConst(code, 0)();
    }
  function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    }
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
___buildEnvironment(ENV);
___strtok_state = Runtime.staticAlloc(4);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"almost asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stderr|0;var n=+env.NaN;var o=+env.Infinity;var p=0;var q=0;var r=0;var s=0;var t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0.0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=global.Math.floor;var N=global.Math.abs;var O=global.Math.sqrt;var P=global.Math.pow;var Q=global.Math.cos;var R=global.Math.sin;var S=global.Math.tan;var T=global.Math.acos;var U=global.Math.asin;var V=global.Math.atan;var W=global.Math.atan2;var X=global.Math.exp;var Y=global.Math.log;var Z=global.Math.ceil;var _=global.Math.imul;var $=env.abort;var aa=env.assert;var ab=env.asmPrintInt;var ac=env.asmPrintFloat;var ad=env.min;var ae=env.invoke_ii;var af=env.invoke_v;var ag=env.invoke_iii;var ah=env.invoke_vi;var ai=env._llvm_lifetime_end;var aj=env._lseek;var ak=env._snprintf;var al=env._rand;var am=env._fgetc;var an=env._srand;var ao=env._fclose;var ap=env._strtok_r;var aq=env.__getFloat;var ar=env._isprint;var as=env._abort;var at=env._fprintf;var au=env._close;var av=env._fgets;var aw=env._pread;var ax=env._fflush;var ay=env._fopen;var az=env._open;var aA=env._strchr;var aB=env._fputc;var aC=env._emscripten_asm_const;var aD=env.___buildEnvironment;var aE=env._sysconf;var aF=env._strtok;var aG=env.___setErrNo;var aH=env._fseek;var aI=env._send;var aJ=env._write;var aK=env.__scanString;var aL=env._ftell;var aM=env._exit;var aN=env._sprintf;var aO=env._rewind;var aP=env._strrchr;var aQ=env._rmdir;var aR=env._printf;var aS=env._fread;var aT=env._read;var aU=env.__reallyNegative;var aV=env.__formatString;var aW=env._getenv;var aX=env._unlink;var aY=env._recv;var aZ=env._pwrite;var a_=env._putchar;var a$=env._fwrite;var a0=env._fsync;var a1=env._fscanf;var a2=env.___errno_location;var a3=env._remove;var a4=env._llvm_lifetime_start;var a5=env._sbrk;var a6=env._time;var a7=env._ungetc;var a8=env.__exit;var a9=0.0;
// EMSCRIPTEN_START_FUNCS
function be(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function bf(){return i|0}function bg(a){a=a|0;i=a}function bh(a,b){a=a|0;b=b|0;if((p|0)==0){p=a;q=b}}function bi(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function bj(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function bk(a){a=a|0;C=a}function bl(a){a=a|0;D=a}function bm(a){a=a|0;E=a}function bn(a){a=a|0;F=a}function bo(a){a=a|0;G=a}function bp(a){a=a|0;H=a}function bq(a){a=a|0;I=a}function br(a){a=a|0;J=a}function bs(a){a=a|0;K=a}function bt(a){a=a|0;L=a}function bu(){}function bv(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+512|0;g=f|0;bH(e);e=g|0;bK(0,e);c[3232]=e;h=a[e]|0;a[12784]=h;L1:do{if((h<<24>>24|0)==77|(h<<24>>24|0)==90){j=a[g+1|0]|0;do{if(!(h<<24>>24==77&j<<24>>24==90)){if(h<<24>>24==90&j<<24>>24==77){break}c[3366]=h&255;k=10;break L1}}while(0);if((bF()|0)==0){l=a[12784]|0;k=8;break}else{bK(0,e);j=a[c[3232]|0]|0;a[12784]=j;l=j;k=8;break}}else{l=h;k=8}}while(0);do{if((k|0)==8){c[3366]=l&255;if(l<<24>>24==0|(l&255)>>>0>8>>>0){k=10;break}if((a[(c[3232]|0)+1|0]&1)==0){m=l}else{k=10}}}while(0);if((k|0)==10){cO(8280);m=a[12784]|0}do{if((m&255)>>>0<4>>>0){c[2596]=2;c[2594]=1;c[3152]=31;c[3150]=224}else{if((m&255)>>>0<8>>>0){c[2596]=4;c[2594]=2;c[3152]=63;c[3150]=63;break}else{c[2596]=8;c[2594]=3;c[3152]=63;c[3150]=63;break}}}while(0);k=c[3232]|0;a[12856]=a[k+1|0]|0;b[6384]=(d[k+2|0]|0)<<8|(d[k+3|0]|0);b[6424]=(d[k+4|0]|0)<<8|(d[k+5|0]|0);b[6400]=(d[k+6|0]|0)<<8|(d[k+7|0]|0);b[6380]=(d[k+8|0]|0)<<8|(d[k+9|0]|0);b[6408]=(d[k+10|0]|0)<<8|(d[k+11|0]|0);b[6412]=(d[k+12|0]|0)<<8|(d[k+13|0]|0);b[6404]=(d[k+14|0]|0)<<8|(d[k+15|0]|0);b[6416]=(d[k+16|0]|0)<<8|(d[k+17|0]|0);b[6396]=(d[k+24|0]|0)<<8|(d[k+25|0]|0);l=(d[k+26|0]|0)<<8|(d[k+27|0]|0);b[6420]=l;if(l<<16>>16==0){b[6420]=bJ()|0;n=c[3232]|0;o=a[12784]|0}else{n=k;o=m}b[6432]=(d[n+28|0]|0)<<8|(d[n+29|0]|0);b[6436]=(d[n+52|0]|0)<<8|(d[n+53|0]|0);if((o&255)>>>0<=4>>>0){c[3232]=0;((function($0){window["globalvars"]["h_type"]=$0}))(o);p=a[12856]|0;((function($0){window["globalvars"]["h_config"]=$0}))(p);q=b[6384]|0;((function($0){window["globalvars"]["h_version"]=$0}))(q);r=b[6432]|0;((function($0){window["globalvars"]["h_checksum"]=$0}))(r);cr();bB();c[3188]=1;i=f;return 0}b[6388]=(d[n+34|0]|0)<<8|(d[n+35|0]|0);c[3232]=0;((function($0){window["globalvars"]["h_type"]=$0}))(o);p=a[12856]|0;((function($0){window["globalvars"]["h_config"]=$0}))(p);q=b[6384]|0;((function($0){window["globalvars"]["h_version"]=$0}))(q);r=b[6432]|0;((function($0){window["globalvars"]["h_checksum"]=$0}))(r);cr();bB();c[3188]=1;i=f;return 0}function bw(a){a=a|0;cs();bI();bT();dP();aM(0);return 0}function bx(a){a=a|0;cN((b[10448+((e[2060]|0)+1<<1)>>1]&255)>>>0>=(a&65535)>>>0|0);return}function by(a,f,g){a=a|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;if((b[f>>1]|0)==0){if((g|0)!=0){h=0;return h|0}cK(0);h=0;return h|0}i=c[3154]|0;j=b[64]|0;b[10448+((j-1&65535)<<1)>>1]=i>>>9;b[10448+((j-2&65535)<<1)>>1]=i&511;b[10448+((j-3&65535)<<1)>>1]=b[2060]|0;i=j-4&65535;b[64]=i;b[10448+((i&65535)<<1)>>1]=a+65535|g;b[2060]=j-5;c[3154]=_(e[f>>1]|0,c[2596]|0)|0;b[6444]=(b[6444]|0)+1;j=cu()|0;i=j&255;k=10448+(e[64]<<1)|0;b[k>>1]=e[k>>1]|i<<8;if(j<<24>>24!=0){j=a;a=1;k=i;while(1){i=k-1|0;if((d[12784]|0)>>>0>4>>>0){l=0}else{l=ct()|0}m=j-1|0;if((m|0)>0){n=b[f+(a<<1)>>1]|0;o=a+1|0}else{n=l;o=a}p=(b[64]|0)-1&65535;b[64]=p;b[10448+((p&65535)<<1)>>1]=n;if((i|0)>0){j=m;a=o;k=i}else{break}}}if((g|0)!=8192){h=0;return h|0}g=ca()|0;c[1022]=1;c[3188]=1;h=g;return h|0}function bz(a){a=a|0;var d=0,f=0,g=0;d=b[2060]|0;f=b[10448+((d+1&65535)<<1)>>1]|0;b[2060]=b[10448+((d+2&65535)<<1)>>1]|0;g=e[10448+((d+3&65535)<<1)>>1]|0;b[64]=d+5;c[3154]=((e[10448+((d+4&65535)<<1)>>1]|0)<<9)+g;b[6444]=(b[6444]|0)-1;g=f&61440;if((g|0)==8192){c[1022]=0;c[3188]=a&65535;return}else if((g|0)==0){cK(a);return}else{return}}function bA(a){a=a|0;c[3154]=(a<<16>>16)-2+(c[3154]|0);return}function bB(){var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;dq(1);c[1032]=1;c[1018]=1;c[3144]=0;c[3146]=0;c[3126]=0;an(a6(0)|0);f=c[3232]|0;g=d[f+17|0]|0;h=((e[6404]|0)>>>9)+1|0;i=0;j=f;while(1){bK(i,j+(i<<9)|0);f=i+1|0;if(f>>>0>=h>>>0){break}i=f;j=c[3232]|0}c6(0);dL(1,1);dK(0);c7(255);dO();bC(g&1);g=b[6436]|0;j=0;while(1){k=g<<16>>16==0;if(k){a[12656+j|0]=a[7872+j|0]|0}else{a[12656+j|0]=a[(c[3232]|0)+(j+(g&65535))|0]|0}i=j+1|0;if(i>>>0<26>>>0){j=i}else{l=0;break}}while(1){if(k){a[12682+l|0]=a[7440+l|0]|0}else{a[12682+l|0]=a[(c[3232]|0)+(l+26+(g&65535))|0]|0}j=l+1|0;if(j>>>0<26>>>0){l=j}else{m=0;break}}do{do{if(k){if((a[12784]|0)==1){a[12708+m|0]=a[6528+m|0]|0;break}else{a[12708+m|0]=a[6840+m|0]|0;break}}else{a[12708+m|0]=a[(c[3232]|0)+(m+52+(g&65535))|0]|0}}while(0);m=m+1|0;}while(m>>>0<26>>>0);c[3154]=e[6400]|0;b[64]=1024;b[2060]=1023;b[6444]=0;return}function bC(b){b=b|0;if((b|0)!=0){b=(c[3232]|0)+17|0;a[b]=a[b]|1}a[(c[3232]|0)+30|0]=a[4112]|0;a[(c[3232]|0)+31|0]=a[4104]|0;a[(c[3232]|0)+32|0]=c[3132];a[(c[3232]|0)+33|0]=c[3134];a[(c[3232]|0)+34|0]=0;a[(c[3232]|0)+35|0]=c[3134];a[(c[3232]|0)+36|0]=0;a[(c[3232]|0)+37|0]=c[3132];a[(c[3232]|0)+38|0]=1;a[(c[3232]|0)+39|0]=1;if((d[12784]|0)>>>0>=4>>>0){return}c6(0);db();if((a[12784]|0)!=3|(a[12896]|0)==0){return}b=(c[3232]|0)+1|0;a[b]=a[b]|8;return}function bD(){if((d[12784]|0)>>>0>4>>>0){cK(b[6444]|0);return}else{b[64]=(b[64]|0)+1;return}}function bE(a,d){a=a|0;d=d|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=b[2060]|0;if((f&65535)>>>0<(d&65535)>>>0){cO(8248);g=b[2060]|0}else{g=f}f=b[6444]|0;h=g+1&65535;if((f&65535)>>>0>(d&65535)>>>0){i=-f&65535;j=~d;k=(i&65535)>>>0>(j&65535)>>>0?i:j;j=h;i=f;while(1){l=b[10448+((j&65535)+1<<1)>>1]|0;m=i-1&65535;n=l+1&65535;if((m&65535)>>>0>(d&65535)>>>0){j=n;i=m}else{break}}i=~k;b[64]=j;b[2060]=l;b[6444]=i;o=l;p=n;q=i}else{o=g;p=h;q=f}f=b[10448+((p&65535)<<1)>>1]|0;b[2060]=b[10448+((o+2&65535)<<1)>>1]|0;p=e[10448+((o+3&65535)<<1)>>1]|0;b[64]=o+5;c[3154]=((e[10448+((o+4&65535)<<1)>>1]|0)<<9)+p;b[6444]=q-1;q=f&61440;if((q|0)==8192){c[1022]=0;c[3188]=a&65535;return}else if((q|0)==0){cK(a);return}else{return}}function bF(){var b=0,d=0,e=0,f=0,g=0,h=0,i=0;if((c[2600]|0)>0){b=0;return b|0}aO(c[3220]|0);d=am(c[3220]|0)|0;if((d|0)>-1){e=0;f=d}else{b=0;return b|0}while(1){d=c[1020]|0;if((f|0)==(a[d+e|0]|0)){g=e+1|0;if((g|0)==16){break}else{h=g}}else{h=(f|0)==(a[d]|0)|0}d=am(c[3220]|0)|0;if((d|0)>-1){e=h;f=d}else{b=0;i=12;break}}if((i|0)==12){return b|0}if((am(c[3220]|0)|0)!=0){b=0;return b|0}c[2600]=am(c[3220]|0)|0;i=(am(c[3220]|0)|0)<<8;c[2600]=(c[2600]|0)+i;i=(am(c[3220]|0)|0)<<16;c[2600]=(c[2600]|0)+i;b=1;return b|0}function bG(b){b=b|0;d1(1504,b|0)|0;d1(208,b|0)|0;d1(2792,b|0)|0;d1(4184,b|0)|0;if((aP(b|0,46)|0)==0){b=1504+(d2(1504)|0)|0;a[b]=a[7488]|0;a[b+1|0]=a[7489]|0;a[b+2|0]=a[7490]|0;a[b+3|0]=a[7491]|0;a[b+4|0]=a[7492]|0;b=208+(d2(208)|0)|0;a[b]=a[6144]|0;a[b+1|0]=a[6145]|0;a[b+2|0]=a[6146]|0;a[b+3|0]=a[6147]|0;a[b+4|0]=a[6148]|0;b=2792+(d2(2792)|0)|0;a[b]=a[6592]|0;a[b+1|0]=a[6593]|0;a[b+2|0]=a[6594]|0;a[b+3|0]=a[6595]|0;a[b+4|0]=a[6596]|0;b=4184+(d2(4184)|0)|0;a[b]=a[6192]|0;a[b+1|0]=a[6193]|0;a[b+2|0]=a[6194]|0;a[b+3|0]=a[6195]|0;a[b+4|0]=a[6196]|0;return}else{a[aP(1504,46)|0]=0;b=1504+(d2(1504)|0)|0;a[b]=a[7488]|0;a[b+1|0]=a[7489]|0;a[b+2|0]=a[7490]|0;a[b+3|0]=a[7491]|0;a[b+4|0]=a[7492]|0;a[aP(208,46)|0]=0;b=208+(d2(208)|0)|0;a[b]=a[6888]|0;a[b+1|0]=a[6889]|0;a[b+2|0]=a[6890]|0;a[b+3|0]=a[6891]|0;a[b+4|0]=a[6892]|0;a[aP(2792,46)|0]=0;b=2792+(d2(2792)|0)|0;a[b]=a[6592]|0;a[b+1|0]=a[6593]|0;a[b+2|0]=a[6594]|0;a[b+3|0]=a[6595]|0;a[b+4|0]=a[6596]|0;a[aP(4184,46)|0]=0;b=4184+(d2(4184)|0)|0;a[b]=a[6192]|0;a[b+1|0]=a[6193]|0;a[b+2|0]=a[6194]|0;a[b+3|0]=a[6195]|0;a[b+4|0]=a[6196]|0;return}}function bH(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+1280|0;e=c[1020]|0;if((a[e+16|0]|0)==0){f=(a[e+18|0]<<8)+(a[e+17|0]|0)+(a[e+19|0]<<16)|0}else{f=0}c[2600]=f;f=d|0;d1(f|0,b|0)|0;e=ay(f|0,5976)|0;c[3220]=e;if((e|0)!=0){bG(b);i=d;return}do{if((a[(c[1020]|0)+16|0]|0)==0){e=aW(8240)|0;if((e|0)!=0){g=e;break}at(c[m>>2]|0,5720,(h=i,i=i+8|0,c[h>>2]=f,h)|0)|0;i=h;cO(5536);g=0}else{e=aW(5864)|0;if((e|0)!=0){g=e;break}at(c[m>>2]|0,5720,(h=i,i=i+8|0,c[h>>2]=f,h)|0)|0;i=h;cO(5536);g=0}}while(0);e=aF(g|0,8104)|0;L14:do{if((e|0)!=0){g=e;while(1){aN(f|0,7720,(h=i,i=i+16|0,c[h>>2]=g,c[h+8>>2]=b,h)|0)|0;i=h;j=ay(f|0,5976)|0;c[3220]=j;if((j|0)!=0){break}g=aF(0,8104)|0;if((g|0)==0){break L14}}bG(b);i=d;return}}while(0);at(c[m>>2]|0,5720,(h=i,i=i+8|0,c[h>>2]=f,h)|0)|0;i=h;cO(5536);i=d;return}function bI(){var a=0;a=c[3220]|0;if((a|0)==0){return}ao(a|0)|0;return}function bJ(){var a=0,b=0;aO(c[3220]|0);a=0;while(1){if((am(c[3220]|0)|0)==-1){break}else{a=a+1|0}}aO(c[3220]|0);b=c[2596]|0;return((a-1+b|0)>>>0)/(b>>>0)|0|0}function bK(a,b){a=a|0;b=b|0;var d=0,f=0;d=a<<9;aH(c[3220]|0,(c[2600]|0)+d|0,0)|0;if((aS(b|0,512,1,c[3220]|0)|0)==1){return}f=_(e[6420]|0,c[2596]|0)|0;if((f>>>9|0)!=(a|0)){return}aH(c[3220]|0,(c[2600]|0)+d|0,0)|0;if((aS(b|0,f&511|0,1,c[3220]|0)|0)==1){return}cO(7680);return}function bL(){var a=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;a=i;i=i+520|0;f=a|0;g=f|0;d3(g|0,0,512)|0;h=a+512|0;d3(h|0,0,6)|0;dk();dp(7616);dp(7520);dp(7512);switch(d[13456]|0){case 0:{dp(7504);break};case 4:{dp(7496);break};case 5:{dp(7472);break};case 6:{dp(7432);break};case 12:{dp(7424);break};case 13:{dp(7312);break};default:{}}dp(7168);j=c[3232]|0;k=d[j+51|0]|0;aN(h|0,7072,(l=i,i=i+16|0,c[l>>2]=d[j+50|0]|0,c[l+8>>2]=k,l)|0)|0;i=l;dp(h);dp(7056);dk();dp(6968);dp(6952);dp(6896);dp(6872);dk();dp(6824);dp(6800);dp(6792);dk();dp(6664);du(c[3366]&65535);dp(6648);dk();dk();h=_(e[6420]|0,c[2596]|0)|0;l=h>>>9;k=h&511;h=0;j=0;while(1){bK(h,g);m=(h|0)==0?64:0;n=(h|0)==(l|0)?k:512;if(m>>>0<n>>>0){o=m;m=j;while(1){p=(d[f+o|0]|0)+m&65535;q=o+1|0;if(q>>>0<n>>>0){o=q;m=p}else{r=p;break}}}else{r=j}m=h+1|0;if(m>>>0>l>>>0){break}else{h=m;j=r}}cN(r<<16>>16==(b[6432]|0)|0);i=a;return}function bM(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=i;i=i+2560|0;j=h|0;k=h+1280|0;do{if((b|0)==3){l=k|0;do{if(g<<16>>16==0){d1(l|0,4184)|0}else{m=c[3232]|0;n=a[m+(g&65535)|0]|0;o=n&255;do{if(n<<24>>24==0){p=0}else{q=g+1&65535;a[l]=a[m+(q&65535)|0]|0;if((n&255)>>>0>1>>>0){r=q;s=1}else{p=o;break}while(1){q=r+1&65535;a[k+s|0]=a[m+(q&65535)|0]|0;t=s+1|0;if(t>>>0<o>>>0){r=q;s=t}else{p=o;break}}}}while(0);o=k+p|0;a[o]=0;if((aA(l|0,46)|0)!=0){break}a[o]=a[6192]|0;a[o+1|0]=a[6193]|0;a[o+2|0]=a[6194]|0;a[o+3|0]=a[6195]|0;a[o+4|0]=a[6196]|0}}while(0);o=j|0;if((cR(o,l,7)|0)!=0){u=0;break}m=ay(o|0,6640)|0;if((m|0)==0){u=0;break}o=a$((c[3232]|0)+(e&65535)|0,f&65535|0,1,m|0)|0;ao(m|0)|0;m=(o|0)!=0;if(m){d1(4184,l|0)|0}u=m&1^1}else{m=j|0;if((cR(m,1504,1)|0)!=0){u=1;break}if((bN(m,1)|0)!=0){u=1;break}cP(m,1);d1(1504,m|0)|0;u=0}}while(0);j=u^1;if((d[12784]|0)>>>0<4>>>0){cN(j);i=h;return u|0}else{cK(j&65535);i=h;return u|0}return 0}function bN(d,f){d=d|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=(f|0)==1;h=(f|0)==0;do{if(f>>>0<2>>>0){i=ay(d|0,(g?6640:5976)|0)|0;if((i|0)!=0){j=c[3232]|0;k=a[j+17|0]|0;a[j+17|0]=k&-2;l=k&1;m=i;break}dd(6200);n=1;return n|0}else{l=0;m=0}}while(0);do{if(g){i=(c3(m,c[3220]|0)|0)==0|0;ao(m|0)|0;if((l|0)==0){o=i;break}k=(c[3232]|0)+17|0;a[k]=a[k]|1;o=i}else{do{if(h){p=(c4(m,c[3220]|0)|0)==0|0}else{i=c[3154]|0;k=b[64]|0;b[10448+((k-1&65535)<<1)>>1]=i>>>9;b[10448+((k-2&65535)<<1)>>1]=i&511;b[10448+((k-3&65535)<<1)>>1]=b[2060]|0;i=b[6384]|0;j=k-4&65535;b[64]=j;b[10448+((j&65535)<<1)>>1]=i;b[5224]=j;k=(f|0)==5;if(k){d4(8320,10448,2048)|0;q=j}else{d4(10448,8320,2048)|0;q=b[5224]|0}j=q+1&65535;b[64]=j;if((b[10448+((q&65535)<<1)>>1]|0)==i<<16>>16){r=j}else{cO(6152);r=b[64]|0}b[2060]=b[10448+((r&65535)<<1)>>1]|0;j=e[10448+((r+1&65535)<<1)>>1]|0;b[64]=r+3;c[3154]=(e[10448+((r+2&65535)<<1)>>1]<<9)+j;if(k){d4(c[2592]|0,c[3232]|0,e[6404]|0)|0}else{d4(c[3232]|0,c[2592]|0,e[6404]|0)|0}if(h){p=0;break}else{n=0}return n|0}}while(0);ao(m|0)|0;dO();bC(l);o=p}}while(0);if((o|0)==0){n=0;return n|0}if(g){dd(6112);a3(d|0)|0;n=o;return n|0}else{cO(6064);n=o;return n|0}return 0}function bO(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=i;i=i+2560|0;j=h|0;k=h+1280|0;do{if((b|0)==3){l=k|0;do{if(g<<16>>16==0){d1(l|0,4184)|0}else{m=c[3232]|0;n=a[m+(g&65535)|0]|0;o=n&255;do{if(n<<24>>24==0){p=0}else{q=g+1&65535;a[l]=a[m+(q&65535)|0]|0;if((n&255)>>>0>1>>>0){r=q;s=1}else{p=o;break}while(1){q=r+1&65535;a[k+s|0]=a[m+(q&65535)|0]|0;t=s+1|0;if(t>>>0<o>>>0){r=q;s=t}else{p=o;break}}}}while(0);o=k+p|0;a[o]=0;if((aA(l|0,46)|0)!=0){break}a[o]=a[6192]|0;a[o+1|0]=a[6193]|0;a[o+2|0]=a[6194]|0;a[o+3|0]=a[6195]|0;a[o+4|0]=a[6196]|0}}while(0);o=j|0;if((cR(o,l,8)|0)==0){u=0;break}m=ay(o|0,5976)|0;if((m|0)==0){u=0;break}o=aS((c[3232]|0)+(e&65535)|0,f&65535|0,1,m|0)|0;ao(m|0)|0;m=(o|0)!=0;if(m){d1(4184,l|0)|0}u=m&1^1}else{m=j|0;if((cR(m,1504,0)|0)!=0){u=1;break}if((bN(m,0)|0)!=0){u=1;break}if((d[12784]|0)>>>0<4>>>0){c6(0);db()}cP(m,1);d1(1504,m|0)|0;u=0}}while(0);if((d[12784]|0)>>>0<4>>>0){cN(u^1);i=h;return u|0}else{cK((u|0)==0?2:0);i=h;return u|0}return 0}function bP(){if((c[2592]|0)==0){cK(-1);return}else{bN(0,5)|0;a[120]=1;cK(1);return}}function bQ(){if((c[2592]|0)==0){cK(-1);return}if(a[120]|0){bN(0,6)|0;cK(2);return}else{cK(0);return}}function bR(){var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+1280|0;d=b|0;e=c[3128]|0;L1:do{if((e|0)==0){do{if(a[1488]|0){f=ay(208,6632)|0;c[3124]=f;if((f|0)==0){dd(6608);break}else{c[3128]=1;g=1;break L1}}else{f=d|0;if((cR(f,208,2)|0)!=0){break}h=ay(f|0,6600)|0;c[3124]=h;if((h|0)==0){dd(6560);break}else{a[1488]=1;d1(208,f|0)|0;c[3128]=1;g=1;break L1}}}while(0);g=c[3128]|0}else{g=e}}while(0);e=(c[3232]|0)+17|0;d=a[e]|0;a[e]=(g|0)==1?d|1:d&-2;i=b;return}function bS(){if((c[3128]|0)!=1){return}ax(c[3124]|0)|0;return}function bT(){var b=0,d=0,e=0;b=c[3128]|0;if((b|0)==1){ao(c[3124]|0)|0;c[3128]=0;d=0}else{d=b}b=(c[3232]|0)+17|0;e=a[b]|0;a[b]=(d|0)==0?e&-2:e|1;return}function bU(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a[(c[3232]|0)+17|0]|0;e=c[3128]|0;if((d&1)!=0&(e|0)==0){bR();f=c[3128]|0;g=a[(c[3232]|0)+17|0]|0}else{f=e;g=d}if((g&1)==0&(f|0)==1){ao(c[3124]|0)|0;c[3128]=0;g=c[3232]|0;a[g+17|0]=a[g+17|0]&-2;h=c[3128]|0}else{h=f}if(!((h|0)==1&(c[3126]|0)==0)){return}do{if((b|0)!=10){if((ar(b|0)|0)!=0){break}return}}while(0);aB(b|0,c[3124]|0)|0;return}function bV(b){b=b|0;var c=0,d=0,e=0;c=a[b]|0;if(c<<24>>24==0){return}else{d=b;e=c}do{d=d+1|0;bU(e<<24>>24);e=a[d]|0;}while(e<<24>>24!=0);return}function bW(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a[b]|0;if(d<<24>>24!=0){e=b;b=d;do{e=e+1|0;bU(b<<24>>24);b=a[e]|0;}while(b<<24>>24!=0)}b=a[(c[3232]|0)+17|0]|0;e=c[3128]|0;if((b&1)!=0&(e|0)==0){bR();f=c[3128]|0;g=a[(c[3232]|0)+17|0]|0}else{f=e;g=b}if((g&1)==0&(f|0)==1){ao(c[3124]|0)|0;c[3128]=0;g=(c[3232]|0)+17|0;a[g]=a[g]&-2;h=c[3128]|0}else{h=f}if(!((h|0)==1&(c[3126]|0)==0)){return}aB(10,c[3124]|0)|0;return}function bX(){var b=0,d=0,e=0,f=0,g=0;b=a[(c[3232]|0)+17|0]|0;d=c[3128]|0;if((b&1)!=0&(d|0)==0){bR();e=c[3128]|0;f=a[(c[3232]|0)+17|0]|0}else{e=d;f=b}if((f&1)==0&(e|0)==1){ao(c[3124]|0)|0;c[3128]=0;f=(c[3232]|0)+17|0;a[f]=a[f]&-2;g=c[3128]|0}else{g=e}if(!((g|0)==1&(c[3126]|0)==0)){return}aB(10,c[3124]|0)|0;return}function bY(){var a=0,b=0,d=0;a=i;i=i+1280|0;if((c[3148]|0)==1|(c[3142]|0)==1){dd(6480);i=a;return}b=a|0;if((cR(b,2792,3)|0)!=0){i=a;return}d=ay(b|0,6600)|0;c[3140]=d;if((d|0)==0){dd(6448);i=a;return}else{d1(2792,b|0)|0;c[3148]=1;i=a;return}}function bZ(a){a=a|0;var b=0,d=0;b=i;if(!((c[3148]|0)==1&(c[3142]|0)==0)){i=b;return}at(c[3140]|0,6440,(d=i,i=i+8|0,c[d>>2]=a,d)|0)|0;i=d;i=b;return}function b_(a){a=a|0;var b=0,d=0;b=i;if(!((c[3148]|0)==1&(c[3142]|0)==0)){i=b;return}at(c[3140]|0,6368,(d=i,i=i+8|0,c[d>>2]=a,d)|0)|0;i=d;i=b;return}function b$(){var a=0;a=c[3140]|0;do{if((a|0)!=0){ao(a|0)|0;c[3140]=0;if((c[3148]|0)==1){cP(2792,3);break}else{cP(2792,4);break}}}while(0);c[3148]=0;c[3142]=0;return}function b0(a){a=a|0;var b=0,d=0;a=i;i=i+1280|0;if((c[3148]|0)==1|(c[3142]|0)==1){dd(6296);i=a;return}b=a|0;if((cR(b,2792,4)|0)!=0){i=a;return}d=ay(b|0,6272)|0;c[3140]=d;if((d|0)==0){dd(6248);i=a;return}else{d1(2792,b|0)|0;c[3142]=1;i=a;return}}function b1(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((c[3148]|0)==1|(c[3142]|0)==0){f=-1;return f|0}if((av(d|0,b|0,c[3140]|0)|0)!=0){b=aP(d|0,10)|0;if((b|0)!=0){a[b]=0}c[e>>2]=d2(d|0)|0;dd(d);f=10;return f|0}d=c[3140]|0;do{if((d|0)!=0){ao(d|0)|0;c[3140]=0;if((c[3148]|0)==1){cP(2792,3);break}else{cP(2792,4);break}}}while(0);c[3148]=0;c[3142]=0;f=-1;return f|0}function b2(){var a=0,b=0,d=0,e=0,f=0;a=i;i=i+8|0;b=a|0;if((c[3148]|0)==1|(c[3142]|0)==0){d=-1;i=a;return d|0}e=a1(c[3140]|0,6224,(f=i,i=i+8|0,c[f>>2]=b,f)|0)|0;i=f;if((e|0)!=-1){d=c[b>>2]|0;i=a;return d|0}e=c[3140]|0;do{if((e|0)!=0){ao(e|0)|0;c[3140]=0;if((c[3148]|0)==1){cP(2792,3);break}else{cP(2792,4);break}}}while(0);c[3148]=0;c[3142]=0;c[b>>2]=-1;d=-1;i=a;return d|0}function b3(a,d){a=a|0;d=d|0;var f=0,g=0;do{if((a|0)<3){b[d+4>>1]=0;if((a|0)>=2){break}b[d+2>>1]=0}}while(0);dq(0);c[3184]=0;if((b[d>>1]|0)!=1){f=0;cK(f);return}a=b2()|0;g=a&65535;if((a|0)!=-1){f=g;cK(f);return}((function($0){window["argstore"]["a0"]=$0}))(b[d+4>>1]|0);((function($0){throw{task:"inputCharacter",timeout:$0}}))(e[d+2>>1]|0);f=g;cK(f);return}function b4(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+8|0;f=e|0;c[f>>2]=0;g=f;b[g>>1]=(function(){return window["argstore"]["a0"]})();do{if((a|0)==-1){if((by(1,g,8192)|0)!=0){h=0;break}((function($0){throw{task:"inputCharacter",timeout:$0}}))(d);h=0}else{b_(a);h=a&65535}}while(0);cK(h);i=e;return}function b5(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+8|0;j=h|0;do{if((f|0)<4){b[g+6>>1]=0;if((f|0)>=3){break}b[g+4>>1]=0;if((f|0)>=2){break}b[g+2>>1]=0}}while(0);if((d[12784]|0)>>>0<4>>>0){da()}dq(1);c[3184]=0;f=e[g>>1]|0;k=c[3232]|0;l=k+f|0;if((d[12784]|0)>>>0>4>>>0){m=a[k+(f+1)|0]|0}else{m=0}((function($0,$1){window["argstore"]["argv"]=$0;window["argstore"]["in_size"]=$1}))(g,m);m=b[g+4>>1]|0;n=b[g+6>>1]|0;g=c[3134]|0;o=((g|0)>127?127:g)+~c[696]|0;g=a[l]|0;if((d[12784]|0)>>>0>4>>>0){c[j>>2]=a[k+(f+1)|0]|0;p=f+2|0}else{c[j>>2]=0;p=f+1|0}f=k+p|0;if((b1((g|0)>(o|0)?o:g,f,j)|0)!=-1){i=h;return}((function($0,$1){window["argstore"]["arg_list"]=[$0,$1]}))(n,0);((function($0,$1,$2,$3){throw{task:"getLine",cbuf:$0,buffer:$1,timeout:$2,action_routine:$3}}))(l,f,m,n);i=h;return}function b6(c,e){c=c|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=(function(){return window["argstore"]["argv"]})();g=(function(){return window["argstore"]["in_size"]})();h=e+2|0;i=e+1|0;bW((d[12784]|0)>>>0>4>>>0?h:i);bZ((d[12784]|0)>>>0>4>>>0?h:i);if((d[12784]|0)>>>0>4>>>0){j=h;k=a[i]|0}else{j=i;k=d2(i|0)|0}if((k|0)>(g|0)){i=g;do{g=j+i|0;a[g]=d5(a[g]|0)|0;i=i+1|0;}while((i|0)<(k|0))}k=b[f+2>>1]|0;if(k<<16>>16!=0){b7(b[f>>1]|0,k,b[6380]|0,0)}if((d[12784]|0)>>>0<=4>>>0){return}cK(c&65535);return}function b7(f,g,h,j){f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0;k=i;i=i+24|0;l=k|0;m=k+8|0;n=f&65535;f=c[3232]|0;o=f+n|0;p=g&65535;g=f+p|0;q=(d[12784]|0)>>>0>4>>>0;r=n+1|0;s=f+r|0;if(q){t=n+2|0;u=t+(d[s]|0)|0;v=t}else{u=(d2(s|0)|0)+r|0;v=n+2|0}n=f+u|0;u=q?f+v|0:s;s=f+(p+2)|0;v=a[f+(h&65535)|0]|0;q=v&255;r=h+1&65535;if(v<<24>>24==0){w=0;x=h;y=r}else{v=q>>>0>1>>>0?q:1;t=(v+65535&65535)+h&65535;h=t+2&65535;z=0;A=r;while(1){a[m+z|0]=a[f+(A&65535)|0]|0;r=z+1|0;if((r|0)<(q|0)){z=r;A=A+1&65535}else{break}}w=v;x=t+1&65535;y=h}a[m+w|0]=0;c[3226]=d[f+(y&65535)|0]|0;y=x+2&65535;w=d[f+y|0]<<8|d[f+(y+1)|0];b[6456]=w;b[6460]=x+4;if(w<<16>>16>0){x=1;y=w<<16>>16;while(1){w=(y|0)/2|0;h=x<<1;if((w+1|0)>>>0>2>>>0){x=h;y=w}else{B=h;break}}}else{B=0}if(u>>>0>=n>>>0){C=0;D=p+1|0;E=f+D|0;a[E]=C;i=k;return}y=j<<16>>16==0;j=o;o=l|0;x=B-1|0;h=(B|0)==0;w=l+2|0;t=l+4|0;l=0;v=0;A=s;s=u;L19:while(1){u=s;z=0;q=l;r=0;L21:while(1){F=0;while(1){G=a[m+F|0]|0;if(G<<24>>24==0){H=0;I=19;break}if((a[u]|0)==G<<24>>24){I=17;break}else{F=F+1|0}}L26:do{if((I|0)==19){while(1){I=0;if((H|0)==7){I=23;break}if((a[u]|0)==(a[8096+H|0]|0)){I=21;break}else{H=H+1|0;I=19}}do{if((I|0)==21){I=0;if((z|0)==0){J=0;K=q;L=r;break}M=u+1|0;N=q;O=r;I=25;break L26}else if((I|0)==23){I=0;F=(z|0)==0;G=(F?r:z)+1|0;J=G;K=F?u:q;L=G}}while(0);G=u+1|0;if(G>>>0<n>>>0){u=G;z=J;q=K;r=L;continue L21}else{M=G;N=K;O=L;I=25}}else if((I|0)==17){I=0;if((z|0)!=0){M=u;N=q;O=r;I=25;break}P=1;Q=u;R=u+1|0}}while(0);if((I|0)==25){I=0;if((O|0)==0){I=61;break L19}else{P=O;Q=N;R=M}}if((v|0)<=(a[g]|0)){break}dc(8200);dd(Q);if(R>>>0<n>>>0){u=R;z=0;q=Q;r=0}else{I=62;break L19}}L42:do{if((b[6456]|0)==0){S=0}else{dl(P,Q,o);r=b[6456]|0;if(r<<16>>16<=0){if(r<<16>>16>=0){S=0;break}q=e[6460]|0;z=c[3226]|0;u=b[o>>1]|0;G=c[3232]|0;F=b[w>>1]|0;T=b[t>>1]|0;U=-(r<<16>>16)|0;if((d[12784]|0)>>>0<4>>>0){V=0;while(1){W=(_(V,z)|0)+q|0;if(u<<16>>16==(d[G+W|0]<<8|d[G+(W+1)|0])<<16>>16){if(F<<16>>16==(d[G+(W+2)|0]<<8|d[G+(W+3)|0])<<16>>16){break}}X=V+1|0;if((X|0)<(U|0)){V=X}else{S=0;break L42}}S=W&65535;break}else{Y=0}L54:while(1){Z=(_(Y,z)|0)+q|0;do{if(u<<16>>16==(d[G+Z|0]<<8|d[G+(Z+1)|0])<<16>>16){if(F<<16>>16!=(d[G+(Z+2)|0]<<8|d[G+(Z+3)|0])<<16>>16){break}if(T<<16>>16==(d[G+(Z+4)|0]<<8|d[G+(Z+5)|0])<<16>>16){break L54}}}while(0);V=Y+1|0;if((V|0)<(U|0)){Y=V}else{S=0;break L42}}S=Z&65535;break}if(h){S=0;break}U=r<<16>>16;G=U-1|0;T=e[6460]|0;F=c[3226]|0;u=b[o>>1]|0;q=u<<16>>16;z=c[3232]|0;V=b[w>>1]|0;X=V<<16>>16;$=b[t>>1]|0;aa=$<<16>>16;if((d[12784]|0)>>>0<4>>>0){ab=B;ac=x;while(1){ad=(ab|0)/2|0;ae=(ac|0)>(G|0)?G:ac;af=(_(ae,F)|0)+T|0;ag=d[z+af|0]<<8|d[z+(af+1)|0];ah=q-(ag<<16>>16)|0;if(u<<16>>16==ag<<16>>16){ag=d[z+(af+2)|0]<<8|d[z+(af+3)|0];if(V<<16>>16==ag<<16>>16){break}else{ai=X-(ag<<16>>16)|0}}else{ai=ah}if((ai|0)>0){ah=ae+ad|0;aj=(ah|0)<(U|0)?ah:G}else{ah=ae-ad|0;aj=(ah|0)<0?0:ah}if((ab+1|0)>>>0<3>>>0){S=0;break L42}else{ab=ad;ac=aj}}S=af&65535;break}else{ak=B;al=x}L74:while(1){ac=(ak|0)/2|0;ab=(al|0)>(G|0)?G:al;am=(_(ab,F)|0)+T|0;r=d[z+am|0]<<8|d[z+(am+1)|0];ad=q-(r<<16>>16)|0;do{if(u<<16>>16==r<<16>>16){ah=d[z+(am+2)|0]<<8|d[z+(am+3)|0];if(V<<16>>16!=ah<<16>>16){an=X-(ah<<16>>16)|0;break}ah=d[z+(am+4)|0]<<8|d[z+(am+5)|0];if($<<16>>16==ah<<16>>16){break L74}else{an=aa-(ah<<16>>16)|0}}else{an=ad}}while(0);if((an|0)>0){ad=ab+ac|0;ao=(ad|0)<(U|0)?ad:G}else{ad=ab-ac|0;ao=(ad|0)<0?0:ad}if((ak+1|0)>>>0<3>>>0){S=0;break L42}else{ak=ac;al=ao}}S=am&65535}}while(0);if(S<<16>>16!=0|y){a[A]=(S&65535)>>>8;a[A+1|0]=S}a[A+2|0]=P;a[A+3|0]=Q-j;ap=v+1|0;if(R>>>0<n>>>0){l=Q;v=ap;A=A+4|0;s=R}else{I=63;break}}if((I|0)==61){C=v&255;D=p+1|0;E=f+D|0;a[E]=C;i=k;return}else if((I|0)==62){C=v&255;D=p+1|0;E=f+D|0;a[E]=C;i=k;return}else if((I|0)==63){C=ap&255;D=p+1|0;E=f+D|0;a[E]=C;i=k;return}}function b8(c,e,f,g,h,j){c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0;k=i;i=i+8|0;l=k|0;m=l|0;b[m>>1]=(function(){return window["argstore"]["arg_list"][0]})();b[l+2>>1]=(function(){return window["argstore"]["arg_list"][1]})();do{if((g|0)==-1){l=by(1,m,8192)|0;if((l|0)!=0){n=l;break}((function($0,$1,$2,$3){throw{task:"getLine",cbuf:$0,buffer:$1,timeout:$2,action_routine:$3}}))(c,e,h,j);n=0}else{n=0}}while(0);j=(n|0)==0?f:0;if((d[12784]|0)>>>0>4>>>0){a[c+1|0]=j;b6(g,c);i=k;return}else{a[e+j|0]=0;b6(g,c);i=k;return}}function b9(a,c){a=a|0;c=c|0;var d=0,e=0;d=c+6|0;do{if((a|0)<4){b[d>>1]=0;if((a|0)>=3){e=0;break}b[c+4>>1]=b[6380]|0;e=0}else{e=b[d>>1]|0}}while(0);b7(b[c>>1]|0,b[c+2>>1]|0,b[c+4>>1]|0,e);return}function ca(){var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+16|0;g=f|0;c[1022]=1;if(a[4096]|0){h=c[3188]|0;i=f;return h|0}j=g|0;k=g+2|0;l=g+4|0;m=g+6|0;do{n=cu()|0;L6:do{if((d[12784]|0)>>>0>4>>>0&n<<24>>24==-66){o=1;p=cu()|0;q=8}else{r=n&255;s=n<<24>>24>-1;if(s|(n&255)>>>0>192>>>0){if(!s){o=0;p=n;q=8;break}b[j>>1]=cI((r>>>6&1)+1|0)|0;b[k>>1]=cI((r>>>5&1)+1|0)|0;t=2;u=n&31;q=24;break}if((n&255)>>>0>=176>>>0){switch(r&15|0){case 4:{break L6;break};case 0:{bz(1);break L6;break};case 1:{bz(0);break L6;break};case 2:{dy();break L6;break};case 3:{dz();break L6;break};case 5:{bM(0,0,0,0)|0;((function(){throw{task:"z_save"}}))();break L6;break};case 6:{((function(){throw{task:"z_restore",count:0,o0:0,o1:0,o2:0}}))();break L6;break};case 7:{bB();break L6;break};case 8:{s=b[64]|0;b[64]=s+1;bz(b[10448+((s&65535)<<1)>>1]|0);break L6;break};case 9:{bD();break L6;break};case 10:{a[4096]=1;break L6;break};case 11:{dk();break L6;break};case 12:{da();break L6;break};case 13:{bL();break L6;break};case 15:{cM(1);break L6;break};default:{cO(7376);break L6}}}s=cI(r>>>4&3)|0;b[j>>1]=s;switch(r&15|0){case 0:{cn(s);break L6;break};case 1:{cD(s);break L6;break};case 2:{cC(s);break L6;break};case 3:{cB(s);break L6;break};case 4:{cY(s);break L6;break};case 5:{dF(s);break L6;break};case 6:{dG(s);break L6;break};case 7:{dw(s);break L6;break};case 8:{by(1,j,0)|0;break L6;break};case 9:{cz(s);break L6;break};case 10:{dx(s);break L6;break};case 11:{bz(s);break L6;break};case 12:{bA(s);break L6;break};case 13:{dv(s);break L6;break};case 14:{dC(s);break L6;break};case 15:{if((d[12784]|0)>>>0>4>>>0){by(1,j,4096)|0;break L6}else{cj(s);break L6}break};default:{break L6}}}}while(0);L52:do{if((q|0)==8){q=0;n=p&63;if((n<<24>>24|0)==44|(n<<24>>24|0)==58){v=14;w=ct()|0}else{v=6;w=(cu()|0)&255}s=w&65535;r=0;x=v;while(1){y=s>>>(x>>>0)&3;if((y|0)==3){z=r;break}A=r+1|0;b[g+(r<<1)>>1]=cI(y)|0;y=x-2|0;if((y|0)>-1){r=A;x=y}else{z=A;break}}x=n&255;if(!o){t=z;u=x;q=24;break}switch(x|0){case 2:{cg(b[j>>1]|0,b[k>>1]|0);break L52;break};case 3:{ch(b[j>>1]|0,b[k>>1]|0);break L52;break};case 10:{bQ();break L52;break};case 0:{bM(z,b[j>>1]|0,b[k>>1]|0,b[l>>1]|0)|0;((function(){throw{task:"z_save"}}))();break L52;break};case 4:{dg(b[j>>1]|0);break L52;break};case 9:{bP();break L52;break};case 1:{((function(){console.log("z_save")}))();((function($0,$1,$2,$3){throw{task:"z_restore",count:$0,o0:$1,o1:$2,o2:$3}}))(z,b[j>>1]|0,b[k>>1]|0,b[l>>1]|0);break L52;break};default:{cO(8112);break L52}}}}while(0);L72:do{if((q|0)==24){q=0;switch(u|0){case 4:{dI(b[j>>1]|0,b[k>>1]|0);break L72;break};case 5:{dH(b[j>>1]|0,b[k>>1]|0);break L72;break};case 6:{cE(b[j>>1]|0,b[k>>1]|0);break L72;break};case 7:{cm(b[j>>1]|0,b[k>>1]|0);break L72;break};case 8:{ci(b[j>>1]|0,b[k>>1]|0);break L72;break};case 1:{co(t,j);break L72;break};case 2:{cp(b[j>>1]|0,b[k>>1]|0);break L72;break};case 3:{cq(b[j>>1]|0,b[k>>1]|0);break L72;break};case 9:{ck(b[j>>1]|0,b[k>>1]|0);break L72;break};case 10:{cF(b[j>>1]|0,b[k>>1]|0);break L72;break};case 11:{cG(b[j>>1]|0,b[k>>1]|0);break L72;break};case 12:{cH(b[j>>1]|0,b[k>>1]|0);break L72;break};case 13:{cL(e[j>>1]|0,b[k>>1]|0);break L72;break};case 14:{cy(b[j>>1]|0,b[k>>1]|0);break L72;break};case 15:{c0(b[j>>1]|0,b[k>>1]|0);break L72;break};case 16:{c1(b[j>>1]|0,b[k>>1]|0);break L72;break};case 17:{cU(b[j>>1]|0,b[k>>1]|0);break L72;break};case 18:{cX(b[j>>1]|0,b[k>>1]|0);break L72;break};case 19:{cW(b[j>>1]|0,b[k>>1]|0);break L72;break};case 20:{cb(b[j>>1]|0,b[k>>1]|0);break L72;break};case 21:{cc(b[j>>1]|0,b[k>>1]|0);break L72;break};case 22:{cd(b[j>>1]|0,b[k>>1]|0);break L72;break};case 23:{ce(b[j>>1]|0,b[k>>1]|0);break L72;break};case 24:{cf(b[j>>1]|0,b[k>>1]|0);break L72;break};case 25:{by(t,j,0)|0;break L72;break};case 26:{by(t,j,4096)|0;break L72;break};case 27:{dh(b[j>>1]|0,b[k>>1]|0);break L72;break};case 28:{bE(b[j>>1]|0,b[k>>1]|0);break L72;break};case 32:{by(t,j,0)|0;break L72;break};case 33:{c2(b[j>>1]|0,b[k>>1]|0,b[l>>1]|0);break L72;break};case 34:{c$(b[j>>1]|0,b[k>>1]|0,b[l>>1]|0);break L72;break};case 35:{cV(b[j>>1]|0,b[k>>1]|0,b[l>>1]|0);break L72;break};case 36:{b5(t,j);break L72;break};case 37:{dt(b[j>>1]|0);break L72;break};case 38:{du(b[j>>1]|0);break L72;break};case 39:{cl(b[j>>1]|0);break L72;break};case 40:{dD(b[j>>1]|0);break L72;break};case 41:{dE(b[j>>1]|0);break L72;break};case 42:{c6(b[j>>1]|0);break L72;break};case 43:{c5(b[j>>1]|0);break L72;break};case 44:{by(t,j,0)|0;break L72;break};case 45:{c7(b[j>>1]|0);break L72;break};case 46:{c8(b[j>>1]|0);break L72;break};case 47:{c9(b[j>>1]|0,b[k>>1]|0);break L72;break};case 49:{dn(b[j>>1]|0);break L72;break};case 50:{dr(b[j>>1]|0);break L72;break};case 51:{ds(b[j>>1]|0,b[k>>1]|0);break L72;break};case 52:{b0(e[j>>1]|0);break L72;break};case 53:{cQ(t,j);break L72;break};case 54:{b3(t,j);break L72;break};case 55:{cZ(t,j);break L72;break};case 56:{cj(b[j>>1]|0);break L72;break};case 57:{by(t,j,4096)|0;break L72;break};case 58:{by(t,j,4096)|0;break L72;break};case 59:{b9(t,j);break L72;break};case 60:{dB(b[j>>1]|0,b[k>>1]|0,b[l>>1]|0,b[m>>1]|0);break L72;break};case 61:{c_(b[j>>1]|0,b[k>>1]|0,b[l>>1]|0);break L72;break};case 62:{df(t,j);break L72;break};case 63:{bx(b[j>>1]|0);break L72;break};default:{cO(8040);break L72}}}}while(0);}while((c[1022]|0)==1&(a[4096]^1));h=c[3188]|0;i=f;return h|0}function cb(a,b){a=a|0;b=b|0;cK(b+a&65535);return}function cc(a,b){a=a|0;b=b|0;cK(a-b&65535);return}function cd(a,b){a=a|0;b=b|0;cK(_(b,a)|0);return}function ce(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;if(b<<16>>16<0){c=-b&65535;d=-a&65535}else{c=b;d=a}a=c<<16>>16;do{if(c<<16>>16==0){e=32767}else{b=d<<16>>16;if(d<<16>>16>-1){e=((b|0)/(a|0)|0)&65535;break}else{e=-((-b|0)/(a|0)|0)&65535;break}}}while(0);cK(e);return}function cf(a,b){a=a|0;b=b|0;var c=0,d=0;c=(b<<16>>16<0?-b&65535:b)<<16>>16;b=a<<16>>16;if(a<<16>>16>-1){d=((b|0)%(c|0)|0)&65535;cK(d);return}else{d=-((-b|0)%(c|0)|0)&65535;cK(d);return}}function cg(a,b){a=a|0;b=b|0;var c=0,d=0;c=b<<16>>16;d=a&65535;if(b<<16>>16>0){cK(d<<c&65535);return}else{cK(d>>>((-c|0)>>>0)&65535);return}}function ch(a,b){a=a|0;b=b|0;var c=0,d=0;c=b<<16>>16;d=a<<16>>16;if(b<<16>>16>0){cK(d<<c&65535);return}else{cK(d>>-c&65535);return}}function ci(a,b){a=a|0;b=b|0;cK(b|a);return}function cj(a){a=a|0;cK(~a);return}function ck(a,b){a=a|0;b=b|0;cK(b&a);return}function cl(a){a=a|0;var b=0;b=a&65535;if(a<<16>>16==0){cK(0);return}if((b&32768|0)==0){cK(((al()|0)%(b|0)|0)+1&65535);return}else{an(b|0);cK(0);return}}function cm(a,b){a=a|0;b=b|0;cN((b&65535&~(a&65535)|0)==0|0);return}function cn(a){a=a|0;cN(a<<16>>16==0|0);return}function co(a,c){a=a|0;c=c|0;var d=0,e=0;d=1;while(1){if((d|0)>=(a|0)){e=5;break}if((b[c>>1]|0)==(b[c+(d<<1)>>1]|0)){e=4;break}else{d=d+1|0}}if((e|0)==5){cN(0);return}else if((e|0)==4){cN(1);return}}function cp(a,b){a=a|0;b=b|0;cN(a<<16>>16<b<<16>>16|0);return}function cq(a,b){a=a|0;b=b|0;cN(a<<16>>16>b<<16>>16|0);return}function cr(){var d=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+8|0;f=d|0;g=c[3134]|0;h=dY(g+1|0)|0;c[3186]=h;if((h|0)==0){cO(7568);j=c[3134]|0}else{j=g}g=dY(j+1|0)|0;c[2610]=g;if((g|0)==0){cO(7568)}g=dY(520)|0;if((g|0)==0){cO(7568)}c[g>>2]=c[3244];c[g+4>>2]=0;c[3244]=g;if((a[12856]&4)==0){k=e[6424]|0}else{j=b[6424]|0;h=b[6404]|0;l=((j&65535)>>>0>(h&65535)>>>0?j:h)&65535;c[f>>2]=e[6380]|0;h=(cw(f)|0)&255;c[f>>2]=(c[f>>2]|0)+h;h=(cw(f)|0)&255;j=((cw(f)|0)&255)<<8;m=(j|(cw(f)|0)&255)&65535;j=(_(m,h)|0)+(c[f>>2]|0)|0;k=j>>>0>l>>>0?j:l}l=(k+511|0)>>>9;k=l<<9;c[3234]=k;j=((_(e[6420]|0,c[2596]|0)|0)+511|0)>>>9;f=dY(k)|0;c[3232]=f;if((f|0)==0){cO(7568)}if((l|0)!=0){f=0;do{bK(f,(c[3232]|0)+(f<<9)|0);f=f+1|0;}while(f>>>0<l>>>0)}c[2592]=dY(c[3234]|0)|0;if((g|0)!=0&l>>>0<j>>>0){n=l}else{i=d;return}while(1){l=dY(520)|0;if((l|0)==0){o=19;break}c[l>>2]=c[3244];c[l+4>>2]=n;bK(n,l+8|0);c[3244]=l;l=n+1|0;if(l>>>0<j>>>0){n=l}else{o=20;break}}if((o|0)==19){i=d;return}else if((o|0)==20){i=d;return}}function cs(){var a=0,b=0,d=0,e=0;dk();dZ(c[3186]|0);dZ(c[2610]|0);dZ(c[3232]|0);dZ(c[2592]|0);a=c[3244]|0;b=c[a>>2]|0;if((b|0)==0){return}else{d=a;e=b}while(1){dZ(d);b=c[e>>2]|0;if((b|0)==0){break}else{d=e;e=b}}return}function ct(){var a=0;a=((cu()|0)&255)<<8;return a|(cu()|0)&255|0}function cu(){var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;b=c[3154]|0;d=b>>>9;e=b&511;f=c[3240]|0;if((d|0)==(f|0)){g=c[3242]|0;h=b}else{b=c[3244]|0;i=b;j=b;while(1){k=j|0;l=c[k>>2]|0;m=j+4|0;n=c[m>>2]|0;if((l|0)==0){o=0;break}if((n|0)==0|(n|0)==(d|0)){o=l;break}else{i=j;j=l}}if((n|0)==(d|0)){p=b}else{do{if(!((o|0)!=0|(n|0)==0)){if((f|0)==(n|0)){c[3240]=0;q=c[m>>2]|0}else{q=n}if((c[3236]|0)!=(q|0)){break}c[3236]=0}}while(0);c[m>>2]=d;bK(d,j+8|0);p=c[3244]|0}if((i|0)!=(p|0)){c[i>>2]=c[k>>2];c[k>>2]=c[3244];c[3244]=j}c[3242]=j;c[3240]=d;g=j;h=c[3154]|0}c[3154]=h+1;if((g|0)!=0){r=g;s=r+8+e|0;t=a[s]|0;return t|0}cO(7904);r=c[3242]|0;s=r+8+e|0;t=a[s]|0;return t|0}function cv(a){a=a|0;var b=0;b=((cw(a)|0)&255)<<8;return b|(cw(a)|0)&255|0}function cw(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=c[b>>2]|0;if(d>>>0<(c[3234]|0)>>>0){e=a[(c[3232]|0)+d|0]|0;f=c[b>>2]|0;g=f+1|0;c[b>>2]=g;return e|0}h=d>>>9;i=d&511;d=c[3236]|0;if((h|0)==(d|0)){j=c[3238]|0}else{k=c[3244]|0;l=k;m=k;while(1){n=m|0;o=c[n>>2]|0;p=m+4|0;q=c[p>>2]|0;if((o|0)==0){r=0;break}if((q|0)==0|(q|0)==(h|0)){r=o;break}else{l=m;m=o}}if((q|0)==(h|0)){s=k}else{do{if(!((r|0)!=0|(q|0)==0)){if((c[3240]|0)==(q|0)){c[3240]=0;t=c[p>>2]|0}else{t=q}if((d|0)!=(t|0)){break}c[3236]=0}}while(0);c[p>>2]=h;bK(h,m+8|0);s=c[3244]|0}if((l|0)!=(s|0)){c[l>>2]=c[n>>2];c[n>>2]=c[3244];c[3244]=m}c[3238]=m;c[3236]=h;j=m}if((j|0)==0){cO(7320);e=0;f=c[b>>2]|0;g=f+1|0;c[b>>2]=g;return e|0}else{e=a[j+8+i|0]|0;f=c[b>>2]|0;g=f+1|0;c[b>>2]=g;return e|0}return 0}function cx(a){a=a|0;var c=0;if((d[12784]|0)>>>0<4>>>0){c=(a*9&65535)+53&65535}else{c=(a*14&65535)+112&65535}return c+(b[6408]|0)&65535|0}function cy(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=b[6408]|0;if((d[12784]|0)>>>0<4>>>0){h=(f*9&65535)+53&65535;i=(e*9&65535)+53&65535}else{h=(f*14&65535)+112&65535;i=(e*14&65535)+112&65535}j=i+g&65535;cz(e);if((d[12784]|0)>>>0<4>>>0){a[(c[3232]|0)+((j&65535)+4)|0]=f}else{i=j&65535;a[(c[3232]|0)+(i+6)|0]=(f&65535)>>>8;a[(c[3232]|0)+(i+7)|0]=f}f=h+g&65535;if((d[12784]|0)>>>0<4>>>0){g=c[3232]|0;h=d[g+(f+6)|0]|0;a[g+(f+6)|0]=e;k=h}else{h=c[3232]|0;g=(d[h+(f+10)|0]|0)<<8|(d[h+(f+11)|0]|0);a[h+(f+10)|0]=(e&65535)>>>8;a[(c[3232]|0)+(f+11)|0]=e;k=g}if(k<<16>>16==0){return}if((d[12784]|0)>>>0<4>>>0){a[(c[3232]|0)+((j&65535)+5)|0]=k;return}else{g=j&65535;a[(c[3232]|0)+(g+8)|0]=(k&65535)>>>8;a[(c[3232]|0)+(g+9)|0]=k;return}}function cz(e){e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=(d[12784]|0)>>>0<4>>>0;g=b[6408]|0;if(f){h=((e*9&65535)+53&65535)+g&65535;i=c[3232]|0;j=d[i+(h+4)|0]|0;k=i;l=h}else{h=((e*14&65535)+112&65535)+g&65535;i=c[3232]|0;j=(d[i+(h+6)|0]|0)<<8|(d[i+(h+7)|0]|0);k=i;l=h}if(j<<16>>16==0){return}if(f){h=((j*9&65535)+53&65535)+g&65535;m=d[k+(h+6)|0]|0;n=h}else{h=((j*14&65535)+112&65535)+g&65535;m=(d[k+(h+10)|0]|0)<<8|(d[k+(h+11)|0]|0);n=h}do{if(m<<16>>16==e<<16>>16){if(f){a[k+(n+6)|0]=a[k+(l+5)|0]|0;break}else{h=a[k+(l+9)|0]|0;a[k+(n+10)|0]=a[k+(l+8)|0]|0;a[(c[3232]|0)+(n+11)|0]=h;break}}else{if(f){h=m;while(1){j=((h*9&65535)+53&65535)+g&65535;i=d[k+((j&65535)+5)|0]|0;if(i<<16>>16==e<<16>>16){o=j;break}else{h=i}}}else{h=m;while(1){i=((h*14&65535)+112&65535)+g&65535;j=i&65535;p=(d[k+(j+8)|0]|0)<<8|(d[k+(j+9)|0]|0);if(p<<16>>16==e<<16>>16){o=i;break}else{h=p}}}if(f){a[k+((o&65535)+5)|0]=a[k+(l+5)|0]|0;break}else{h=a[k+(l+9)|0]|0;p=o&65535;a[k+(p+8)|0]=a[k+(l+8)|0]|0;a[(c[3232]|0)+(p+9)|0]=h;break}}}while(0);if((d[12784]|0)>>>0<4>>>0){a[(c[3232]|0)+(l+4)|0]=0}else{a[(c[3232]|0)+(l+6)|0]=0;a[(c[3232]|0)+(l+7)|0]=0}if((d[12784]|0)>>>0<4>>>0){a[(c[3232]|0)+(l+5)|0]=0;return}else{a[(c[3232]|0)+(l+8)|0]=0;a[(c[3232]|0)+(l+9)|0]=0;return}}function cA(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;e=(b|0)==0;if((d[12784]|0)>>>0<4>>>0){if(e){f=d[(c[3232]|0)+((a&65535)+4)|0]|0;return f|0}g=a&65535;if((b|0)==1){f=d[(c[3232]|0)+(g+5)|0]|0;return f|0}else{f=d[(c[3232]|0)+(g+6)|0]|0;return f|0}}else{if(e){e=a&65535;g=c[3232]|0;f=(d[g+(e+6)|0]|0)<<8|(d[g+(e+7)|0]|0);return f|0}e=a&65535;if((b|0)==1){b=c[3232]|0;f=(d[b+(e+8)|0]|0)<<8|(d[b+(e+9)|0]|0);return f|0}else{b=c[3232]|0;f=(d[b+(e+10)|0]|0)<<8|(d[b+(e+11)|0]|0);return f|0}}return 0}function cB(a){a=a|0;var e=0,f=0,g=0;e=b[6408]|0;if((d[12784]|0)>>>0<4>>>0){f=d[(c[3232]|0)+((((a*9&65535)+53&65535)+e&65535)+4)|0]|0;cK(f);return}else{g=((a*14&65535)+112&65535)+e&65535;e=c[3232]|0;f=(d[e+(g+6)|0]|0)<<8|(d[e+(g+7)|0]|0);cK(f);return}}function cC(a){a=a|0;var e=0,f=0,g=0,h=0,i=0;e=b[6408]|0;if((d[12784]|0)>>>0<4>>>0){f=d[(c[3232]|0)+((((a*9&65535)+53&65535)+e&65535)+6)|0]|0;cK(f);g=f<<16>>16!=0;h=g&1;cN(h);return}else{i=((a*14&65535)+112&65535)+e&65535;e=c[3232]|0;f=(d[e+(i+10)|0]|0)<<8|(d[e+(i+11)|0]|0);cK(f);g=f<<16>>16!=0;h=g&1;cN(h);return}}function cD(a){a=a|0;var e=0,f=0,g=0,h=0,i=0;e=b[6408]|0;if((d[12784]|0)>>>0<4>>>0){f=d[(c[3232]|0)+((((a*9&65535)+53&65535)+e&65535)+5)|0]|0;cK(f);g=f<<16>>16!=0;h=g&1;cN(h);return}else{i=((a*14&65535)+112&65535)+e&65535;e=c[3232]|0;f=(d[e+(i+8)|0]|0)<<8|(d[e+(i+9)|0]|0);cK(f);g=f<<16>>16!=0;h=g&1;cN(h);return}}function cE(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=b[6408]|0;if((d[12784]|0)>>>0<4>>>0){g=d[(c[3232]|0)+((((a*9&65535)+53&65535)+f&65535)+4)|0]|0;h=g<<16>>16==e<<16>>16;i=h&1;cN(i);return}else{j=((a*14&65535)+112&65535)+f&65535;f=c[3232]|0;g=(d[f+(j+6)|0]|0)<<8|(d[f+(j+7)|0]|0);h=g<<16>>16==e<<16>>16;i=h&1;cN(i);return}}function cF(a,e){a=a|0;e=e|0;var f=0;if((d[12784]|0)>>>0<4>>>0){f=(a*9&65535)+53&65535}else{f=(a*14&65535)+112&65535}cN((d[(c[3232]|0)+(((b[6408]|0)+((e&65535)>>>3)&65535)+f&65535)|0]|0)>>>((e&7^7)>>>0)&1);return}function cG(e,f){e=e|0;f=f|0;var g=0;if((d[12784]|0)>>>0<4>>>0){g=(e*9&65535)+53&65535}else{g=(e*14&65535)+112&65535}e=(c[3232]|0)+(((b[6408]|0)+((f&65535)>>>3)&65535)+g&65535)|0;a[e]=d[e]|0|1<<(f&7^7);return}function cH(e,f){e=e|0;f=f|0;var g=0;if((d[12784]|0)>>>0<4>>>0){g=(e*9&65535)+53&65535}else{g=(e*14&65535)+112&65535}e=(c[3232]|0)+(((b[6408]|0)+((f&65535)>>>3)&65535)+g&65535)|0;a[e]=(d[e]|0)&(1<<(f&7^7)^255);return}function cI(a){a=a|0;var f=0,g=0;if((a|0)==0){f=ct()|0;return f|0}g=cu()|0;if((a|0)!=2){f=g&255;return f|0}if(g<<24>>24==0){a=b[64]|0;b[64]=a+1;f=b[10448+((a&65535)<<1)>>1]|0;return f|0}a=g&255;if((g&255)>>>0<16>>>0){f=b[10448+(1-a+(e[2060]|0)<<1)>>1]|0;return f|0}else{g=(a<<1)-32+(e[6412]|0)|0;a=c[3232]|0;f=(d[a+g|0]|0)<<8|(d[a+(g+1)|0]|0);return f|0}return 0}function cJ(a){a=a|0;var f=0,g=0;if((a|0)==0){f=b[10448+((e[64]|0)<<1)>>1]|0;return f|0}if((a|0)<16){f=b[10448+(1-a+(e[2060]|0)<<1)>>1]|0;return f|0}else{g=(a<<1)-32+(e[6412]|0)|0;a=c[3232]|0;f=(d[a+g|0]|0)<<8|(d[a+(g+1)|0]|0);return f|0}return 0}function cK(d){d=d|0;var f=0,g=0;f=cu()|0;if(f<<24>>24==0){g=(b[64]|0)-1&65535;b[64]=g;b[10448+((g&65535)<<1)>>1]=d;return}g=f&255;if((f&255)>>>0<16>>>0){b[10448+(1-g+(e[2060]|0)<<1)>>1]=d;return}else{f=g<<1;a[(c[3232]|0)+(f-32+(e[6412]|0))|0]=(d&65535)>>>8;a[(c[3232]|0)+(f-31+(e[6412]|0))|0]=d;return}}function cL(d,f){d=d|0;f=f|0;var g=0;if((d|0)==0){b[10448+((e[64]|0)<<1)>>1]=f;return}if((d|0)<16){b[10448+(1-d+(e[2060]|0)<<1)>>1]=f;return}else{g=d<<1;a[(c[3232]|0)+((e[6412]|0)+(g-32))|0]=(f&65535)>>>8;a[(c[3232]|0)+(g-31+(e[6412]|0))|0]=f;return}}function cM(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=cu()|0;d=b&255;if((d&128|0)==0){e=a}else{e=(a|0)==0|0}a=b&63;do{if((d&64|0)==0){b=a<<8;f=(cu()|0)&255|b;if((b&8192)==0){g=f;break}g=f|-16384}else{g=a}}while(0);if((e|0)!=0){return}if((g&65535)>>>0<2>>>0){bz(g);return}else{c[3154]=(c[3154]|0)+((g-2&65535)<<16>>16);return}}function cN(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=cu()|0;d=b&255;if((d&128|0)==0){e=a}else{e=(a|0)==0|0}a=b&63;do{if((d&64|0)==0){b=a<<8;f=(cu()|0)&255|b;if((b&8192)==0){g=f;break}g=f|-16384}else{g=a}}while(0);if((e|0)!=0){return}if((g&65535)>>>0<2>>>0){bz(g);return}else{c[3154]=((g-2&65535)<<16>>16)+(c[3154]|0);return}}function cO(a){a=a|0;((function(){console.log("fatal error!")}))();aM(1)}function cP(a,b){a=a|0;b=b|0;return}function cQ(a,c){a=a|0;c=c|0;var d=0;do{if((a|0)<4){b[c+6>>1]=0;if((a|0)>=3){d=5;break}b[c+4>>1]=255;if((a|0)>=2){d=5;break}b[c+2>>1]=2;if((a|0)!=1){d=5}}else{d=5}}while(0);do{if((d|0)==5){if((b[c+2>>1]|0)==2){break}return}}while(0);dW(7);return}function cR(b,c,d){b=b|0;c=c|0;d=d|0;do{if((a[c]|0)==0){if((d|0)==2){d4(c|0,6424,10)|0;break}if((d-3|0)>>>0<2>>>0){d4(c|0,6352,10)|0;break}else{d4(c|0,6280,10)|0;break}}}while(0);d4(b|0,6232,9)|0;bZ(b);return 0}function cS(a,b){a=a|0;b=b|0;return 0}function cT(a){a=a|0;((function(){console.log("set_font()")}))();return}function cU(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;g=cx(e)|0;e=a[12784]|0;h=(e&255)>>>0<4>>>0;i=(h?7:12)+g&65535;g=c[3232]|0;j=(d[g+i|0]|0)<<8|(d[g+(i+1)|0]|0);i=(j+1&65535)+((d[g+(j&65535)|0]|0)<<1)&65535;j=a[g+(i&65535)|0]|0;k=j&255;l=c[3152]|0;m=k&l;n=f&255;L1:do{if(m>>>0>n>>>0){o=c[3150]|0;if(h){p=i;q=j;while(1){r=(p+2&65535)+((q&255)>>>5&255)&65535;s=a[g+(r&65535)|0]|0;t=s&255;u=t&l;if(u>>>0>n>>>0){p=r;q=s}else{v=r;w=t;x=u;break L1}}}else{y=i;z=j}while(1){if(z<<24>>24>-1){A=(z&255)>>>6}else{q=(d[g+(y+1&65535)|0]|0)&o;A=(q|0)==0?64:q&255}q=(y+2&65535)+(A&255)&65535;p=a[g+(q&65535)|0]|0;u=p&255;t=u&l;if(t>>>0>n>>>0){y=q;z=p}else{v=q;w=u;x=t;break}}}else{v=i;w=k;x=m}}while(0);if((x|0)!=(n|0)){n=((f<<1)-2&65535)+(b[6408]|0)&65535;B=(d[g+n|0]|0)<<8|(d[g+(n+1)|0]|0);cK(B);return}n=v+1&65535;do{if(h){if((w&224|0)==0){C=13;break}if((e&255)>>>0>3>>>0){C=12}else{C=14}}else{C=12}}while(0);if((C|0)==12){if((w&192|0)==0){C=13}else{C=14}}if((C|0)==13){B=d[g+(n&65535)|0]|0;cK(B);return}else if((C|0)==14){C=n&65535;B=(d[g+C|0]|0)<<8|(d[g+(C+1)|0]|0);cK(B);return}}function cV(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;g=cx(b)|0;b=a[12784]|0;h=(b&255)>>>0<4>>>0;i=(h?7:12)+g&65535;g=c[3232]|0;j=(d[g+i|0]|0)<<8|(d[g+(i+1)|0]|0);i=(j+1&65535)+((d[g+(j&65535)|0]|0)<<1)&65535;j=a[g+(i&65535)|0]|0;k=j&255;l=c[3152]|0;m=k&l;n=e&65535;L1:do{if(m>>>0>n>>>0){e=c[3150]|0;if(h){o=i;p=j;while(1){q=(o+2&65535)+((p&255)>>>5&255)&65535;r=a[g+(q&65535)|0]|0;s=r&255;t=s&l;if(t>>>0>n>>>0){o=q;p=r}else{u=q;v=s;w=t;break L1}}}else{x=i;y=j}while(1){if(y<<24>>24>-1){z=(y&255)>>>6}else{p=(d[g+(x+1&65535)|0]|0)&e;z=(p|0)==0?64:p&255}p=(x+2&65535)+(z&255)&65535;o=a[g+(p&65535)|0]|0;t=o&255;s=t&l;if(s>>>0>n>>>0){x=p;y=o}else{u=p;v=t;w=s;break}}}else{u=i;v=k;w=m}}while(0);if((w|0)==(n|0)){A=b}else{cO(7080);A=a[12784]|0}b=u+1&65535;do{if((A&255)>>>0<4>>>0){if((v&224|0)==0){B=14;break}if((A&255)>>>0>3>>>0){B=13}else{B=15}}else{B=13}}while(0);if((B|0)==13){if((v&192|0)==0){B=14}else{B=15}}if((B|0)==14){a[(c[3232]|0)+(b&65535)|0]=f;return}else if((B|0)==15){B=b&65535;a[(c[3232]|0)+B|0]=(f&65535)>>>8;a[(c[3232]|0)+(B+1)|0]=f;return}}function cW(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=cx(b)|0;b=(d[12784]|0)>>>0<4>>>0;g=(b?7:12)+f&65535;f=c[3232]|0;h=(d[f+g|0]|0)<<8|(d[f+(g+1)|0]|0);g=(h+1&65535)+((d[f+(h&65535)|0]|0)<<1)&65535;do{if(e<<16>>16==0){i=g;j=f}else{h=c[3152]|0;k=e&255;l=c[3150]|0;if(b){m=g;while(1){n=a[f+(m&65535)|0]|0;o=(m+2&65535)+((n&255)>>>5&255)&65535;p=h&(n&255);if(p>>>0>k>>>0){m=o}else{q=o;r=p;break}}}else{m=g;while(1){p=a[f+(m&65535)|0]|0;if(p<<24>>24>-1){s=(p&255)>>>6}else{o=(d[f+(m+1&65535)|0]|0)&l;s=(o|0)==0?64:o&255}o=(m+2&65535)+(s&255)&65535;n=h&(p&255);if(n>>>0>k>>>0){m=o}else{q=o;r=n;break}}}if((r|0)==(k|0)){i=q;j=f;break}cO(7800);i=q;j=c[3232]|0}}while(0);cK((d[j+(i&65535)|0]|0)&c[3152]&65535);return}function cX(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=cx(b)|0;b=a[12784]|0;g=(b&255)>>>0<4>>>0;h=(g?7:12)+f&65535;f=c[3232]|0;i=(d[f+h|0]|0)<<8|(d[f+(h+1)|0]|0);h=(i+1&65535)+((d[f+(i&65535)|0]|0)<<1)&65535;i=a[f+(h&65535)|0]|0;j=c[3152]|0;k=i&255&j;l=e&255;if(k>>>0>l>>>0){e=c[3150]|0;m=h;n=i;while(1){o=m+1&65535;do{if(g){p=(n&255)>>>5}else{if(n<<24>>24>-1){p=(n&255)>>>6;break}else{q=(d[f+(o&65535)|0]|0)&e;p=(q|0)==0?64:q&255;break}}}while(0);o=(m+2&65535)+(p&255)&65535;q=a[f+(o&65535)|0]|0;r=q&255&j;if(r>>>0>l>>>0){m=o;n=q}else{s=o;t=q;u=r;break}}}else{s=h;t=i;u=k}if((u|0)!=(l|0)){cK(0);return}if((b&255)>>>0>3>>>0){v=((t&255)>>>7&255)+s&65535}else{v=s}cK(v+1&65535);return}function cY(b){b=b|0;var e=0,f=0,g=0;if(b<<16>>16==0){cK(0);return}e=a[(c[3232]|0)+(b-1&65535)|0]|0;b=e&255;do{if((d[12784]|0)>>>0<4>>>0){f=((e&255)>>>5)+1&255}else{if((b&128|0)==0){f=((e&255)>>>6)+1&255;break}else{g=c[3150]&b;f=(g|0)==0?64:g&255;break}}}while(0);cK(f&255);return}function cZ(a,d){a=a|0;d=d|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+8|0;g=f|0;h=d+6|0;if((a|0)<4){b[h>>1]=130;j=130}else{j=e[h>>1]|0}c[g>>2]=e[d+2>>1]|0;h=j&127;a=d+4|0;k=(b[a>>1]|0)==0;L5:do{if((j&128|0)==0){if(k){break}else{l=0}while(1){m=(cw(g)|0)&255;n=(c[g>>2]|0)-1|0;if((m|0)==(e[d>>1]|0)){break}c[g>>2]=n+h;l=l+1|0;if(l>>>0>=(e[a>>1]|0)>>>0){break L5}}cK(n&65535);cN(1);i=f;return}else{if(k){break}else{o=0}while(1){m=cv(g)|0;p=(c[g>>2]|0)-2|0;if(m<<16>>16==(b[d>>1]|0)){break}c[g>>2]=p+h;o=o+1|0;if(o>>>0>=(e[a>>1]|0)>>>0){break L5}}cK(p&65535);cN(1);i=f;return}}while(0);cK(0);cN(0);i=f;return}function c_(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b&65535;if(b<<16>>16==d<<16>>16){i=f;return}j=e&65535;if(e<<16>>16==0){i=f;return}if(d<<16>>16==0){k=b;b=0;while(1){l=k&65535;if(l>>>0>(c[3234]|0)>>>0){cO(6736)}a[(c[3232]|0)+l|0]=0;l=b+1|0;if(l>>>0<j>>>0){k=k+1&65535;b=l}else{break}}i=f;return}c[g>>2]=h;if(e<<16>>16<0){b=d;k=e;while(1){l=k+1&65535;m=cw(g)|0;n=b&65535;if(n>>>0>(c[3234]|0)>>>0){cO(6736)}a[(c[3232]|0)+n|0]=m;if(l<<16>>16==0){break}else{b=b+1&65535;k=l}}i=f;return}k=j+h|0;c[g>>2]=k;h=e+d&65535;d=e;e=k;do{d=d-1&65535;c[g>>2]=e-1;h=h-1&65535;k=cw(g)|0;j=h&65535;if(j>>>0>(c[3234]|0)>>>0){cO(6736)}a[(c[3232]|0)+j|0]=k;e=(c[g>>2]|0)-1|0;c[g>>2]=e;}while(d<<16>>16!=0);i=f;return}function c$(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=d+b&65535;if(f>>>0>(c[3234]|0)>>>0){cO(6736)}a[(c[3232]|0)+f|0]=e;return}function c0(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+8|0;e=d|0;c[e>>2]=((b&65535)<<1)+(a&65535);cK(cv(e)|0);i=d;return}function c1(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+8|0;e=d|0;c[e>>2]=(b&65535)+(a&65535);cK((cw(e)|0)&255);i=d;return}function c2(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=(d<<1)+b&65535;if(f>>>0>(c[3234]|0)>>>0){cO(7256)}a[(c[3232]|0)+f|0]=(e&65535)>>>8;a[(c[3232]|0)+(f+1)|0]=e;return}function c3(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;h=i;i=i+528|0;j=h|0;k=h+8|0;L1:do{if((aB(70,f|0)|0)!=-1){if((aB(79,f|0)|0)==-1){break}if((aB(82,f|0)|0)==-1){break}if((aB(77,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(73,f|0)|0)==-1){break}if((aB(70,f|0)|0)==-1){break}if((aB(90,f|0)|0)==-1){break}if((aB(83,f|0)|0)==-1){break}if((aB(73,f|0)|0)==-1){break}if((aB(70,f|0)|0)==-1){break}if((aB(104,f|0)|0)==-1){break}if((aB(100,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(13,f|0)|0)==-1){break}if((aB((e[6384]|0)>>>8|0,f|0)|0)==-1){break}if((aB(b[6384]&255|0,f|0)|0)==-1){break}else{l=0}while(1){if((l&65535)>>>0>=6>>>0){break}if((aB(d[(c[3232]|0)+((l&65535)+18)|0]|0,f|0)|0)==-1){break L1}else{l=l+1&65535}}if((aB((e[6432]|0)>>>8|0,f|0)|0)==-1){break}if((aB(b[6432]&255|0,f|0)|0)==-1){break}if((aB((c[3154]|0)>>>16&255|0,f|0)|0)==-1){break}if((aB((c[3154]|0)>>>8&255|0,f|0)|0)==-1){break}if((aB(c[3154]&255|0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}m=aL(f|0)|0;if((m|0)<0){break}if((aB(67,f|0)|0)==-1){break}if((aB(77,f|0)|0)==-1){break}if((aB(101,f|0)|0)==-1){break}if((aB(109,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}aO(g|0);do{if((b[6404]|0)==0){n=0;o=0}else{p=0;q=0;r=0;s=0;while(1){t=am(g|0)|0;if((t|0)==-1){break L1}u=d[(c[3232]|0)+s|0]|0;v=u^t;if((t|0)==(u|0)){w=r;x=q+1&65535}else{if(q<<16>>16==0){y=r}else{u=(aB(0,f|0)|0)!=-1;if((q&65535)>>>0>256>>>0){t=q;z=r;A=u;while(1){if(!A){break L1}if((aB(255,f|0)|0)==-1){break L1}B=z+2|0;C=t-256&65535;D=(aB(0,f|0)|0)!=-1;if((C&65535)>>>0>256>>>0){t=C;z=B;A=D}else{E=B;F=C;G=D;break}}}else{E=r;F=q;G=u}if(!G){break L1}if((aB((F&65535)-1|0,f|0)|0)==-1){break L1}y=E+2|0}if((aB(v|0,f|0)|0)==-1){break L1}w=y+1|0;x=0}A=p+1&65535;if((A&65535)>>>0<(e[6404]|0)>>>0){p=A;q=x;r=w;s=A&65535}else{break}}s=w&1;if((s|0)==0){n=w;o=0;break}if((aB(0,f|0)|0)==-1){break L1}else{n=w;o=s}}}while(0);s=aL(f|0)|0;if((s|0)<0){break}if((aB(83,f|0)|0)==-1){break}if((aB(116,f|0)|0)==-1){break}if((aB(107,f|0)|0)==-1){break}if((aB(115,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}if((aB(0,f|0)|0)==-1){break}r=(b[64]|0)-5&65535;b[k>>1]=r;q=b[2060]|0;if((q&65535)>>>0<1020>>>0){p=0;A=q;while(1){q=p+1&65535;b[k+((q&65535)<<1)>>1]=A;z=b[10448+((A&65535)+2<<1)>>1]|0;if((z&65535)>>>0<1020>>>0){p=q;A=z}else{H=q;I=A;break}}}else{H=0;I=r}A=I+4&65535;if((a[12784]|0)==6){J=0}else{p=0;while(1){if((p&65535)>>>0>=6>>>0){break}if((aB(0,f|0)|0)==-1){break L1}else{p=p+1&65535}}p=1019-I&65535;if((aB(p>>>8|0,f|0)|0)==-1){break}if((aB(p&255|0,f|0)|0)==-1){break}else{K=1023}while(1){if((K&65535)>>>0<=(A&65535)>>>0){break}r=10448+((K&65535)<<1)|0;if((aB((e[r>>1]|0)>>>8|0,f|0)|0)==-1){break L1}if((aB(b[r>>1]&255|0,f|0)|0)==-1){break L1}else{K=K-1&65535}}J=(p<<1)+8|0}L90:do{if(H<<16>>16==0){L=J}else{A=J;r=H;q=I;while(1){z=q&65535;t=b[10448+(z+1<<1)>>1]|0;D=(t&65535)>>>8&15;C=t&255;B=D&65535;M=((q-4&65535)-(b[k+((r&65535)-1<<1)>>1]|0)&65535)-D&65535;D=(e[10448+(z+4<<1)>>1]<<9)+(e[10448+(z+3<<1)>>1]|0)|0;c[j>>2]=D;z=t&61440;if((z|0)==0){t=cw(j)|0;N=t&255;O=c[j>>2]<<8|B}else if((z|0)==4096){N=0;O=B|D<<8|16}else{break}c[j>>2]=O;if(C<<16>>16==0){P=0}else{P=(1<<(C&65535))+65535&65535}if((aB(O>>>24|0,f|0)|0)==-1){break L1}if((aB((c[j>>2]|0)>>>16&255|0,f|0)|0)==-1){break L1}if((aB((c[j>>2]|0)>>>8&255|0,f|0)|0)==-1){break L1}if((aB(c[j>>2]&255|0,f|0)|0)==-1){break L1}if((aB(N|0,f|0)|0)==-1){break L1}if((aB(P|0,f|0)|0)==-1){break L1}C=M&65535;if((aB(C>>>8|0,f|0)|0)==-1){break L1}if((aB(C&255|0,f|0)|0)==-1){break L1}M=C+B|0;if((M|0)>0){B=0;C=q;while(1){D=10448+((C&65535)<<1)|0;if((aB((e[D>>1]|0)>>>8|0,f|0)|0)==-1){break L1}if((aB(b[D>>1]&255|0,f|0)|0)==-1){break L1}D=B+1&65535;if((D&65535|0)<(M|0)){B=D;C=C-1&65535}else{break}}}C=A+8+(M<<1)|0;B=r-1&65535;if(B<<16>>16==0){L=C;break L90}A=C;r=B;q=b[k+((B&65535)<<1)>>1]|0}dd(6992);break L1}}while(0);p=n+42+o+L|0;aH(f|0,4,0)|0;if((aB(p>>>24|0,f|0)|0)==-1){break}if((aB(p>>>16&255|0,f|0)|0)==-1){break}if((aB(p>>>8&255|0,f|0)|0)==-1){break}if((aB(p&255|0,f|0)|0)==-1){break}aH(f|0,m+4|0,0)|0;if((aB(n>>>24|0,f|0)|0)==-1){break}if((aB(n>>>16&255|0,f|0)|0)==-1){break}if((aB(n>>>8&255|0,f|0)|0)==-1){break}if((aB(n&255|0,f|0)|0)==-1){break}aH(f|0,s+4|0,0)|0;if((aB(L>>>24|0,f|0)|0)==-1){break}if((aB(L>>>16&255|0,f|0)|0)==-1){break}if((aB(L>>>8&255|0,f|0)|0)==-1){break}p=(aB(L&255|0,f|0)|0)!=-1|0;i=h;return p|0}}while(0);i=h;return 0}function c4(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0;h=i;i=i+8|0;j=h|0;k=am(f|0)|0;if((k|0)==-1){l=0;i=h;return l|0}m=am(f|0)|0;if((m|0)==-1){l=0;i=h;return l|0}n=am(f|0)|0;if((n|0)==-1){l=0;i=h;return l|0}o=am(f|0)|0;if((o|0)==-1){l=0;i=h;return l|0}p=m<<16|k<<24|n<<8|o;c[j>>2]=p;o=am(f|0)|0;if((o|0)==-1){l=0;i=h;return l|0}n=am(f|0)|0;if((n|0)==-1){l=0;i=h;return l|0}k=am(f|0)|0;if((k|0)==-1){l=0;i=h;return l|0}m=am(f|0)|0;if((m|0)==-1){l=0;i=h;return l|0}q=n<<16|o<<24|k<<8|m;k=am(f|0)|0;if((k|0)==-1){l=0;i=h;return l|0}o=am(f|0)|0;if((o|0)==-1){l=0;i=h;return l|0}n=am(f|0)|0;if((n|0)==-1){l=0;i=h;return l|0}r=am(f|0)|0;if((r|0)==-1){l=0;i=h;return l|0}if(!((p|0)==1179603533&(o<<16|k<<24|n<<8|r|0)==1229347411)){dd(7760);l=0;i=h;return l|0}if((m&1|0)!=0|q>>>0<4>>>0){l=0;i=h;return l|0}m=q-4|0;L44:do{if((m|0)==0){s=0}else{q=m;r=0;L45:while(1){if(q>>>0<8>>>0){l=0;t=134;break}n=am(f|0)|0;if((n|0)==-1){l=0;t=154;break}k=am(f|0)|0;if((k|0)==-1){l=0;t=155;break}o=am(f|0)|0;if((o|0)==-1){l=0;t=163;break}p=am(f|0)|0;if((p|0)==-1){l=0;t=164;break}u=k<<16|n<<24|o<<8|p;c[j>>2]=u;p=am(f|0)|0;if((p|0)==-1){l=0;t=146;break}o=am(f|0)|0;if((o|0)==-1){l=0;t=147;break}n=am(f|0)|0;if((n|0)==-1){l=0;t=144;break}k=am(f|0)|0;if((k|0)==-1){l=0;t=145;break}v=o<<16|p<<24|n<<8|k;n=q-8|0;if(n>>>0<v>>>0){l=0;t=180;break}p=k&1;k=n-p|0;n=k-v|0;do{if((u|0)==1400138611){if((r&2)!=0){dd(6392);w=r;break}o=r|2;b[64]=1024;if((a[12784]|0)==6){x=v}else{if(v>>>0<8>>>0){l=0;t=136;break L45}else{y=0}while(1){z=am(f|0)|0;if((y&65535)>>>0>=6>>>0){break}if((z|0)==0){y=y+1&65535}else{l=0;t=137;break L45}}if((z|0)==-1){l=0;t=138;break L45}A=am(f|0)|0;if((A|0)==-1){l=0;t=166;break L45}B=A|z<<8;A=B&65535;C=v-8|0;D=B<<1&131070;if(C>>>0<D>>>0){l=0;t=167;break L45}if(A<<16>>16!=0){B=0;do{E=(b[64]|0)-1&65535;b[64]=E;F=am(f|0)|0;if((F|0)==-1){l=0;t=168;break L45}G=am(f|0)|0;if((G|0)==-1){l=0;t=169;break L45}b[10448+((E&65535)<<1)>>1]=G|F<<8;B=B+1&65535;}while((B&65535)>>>0<(A&65535)>>>0)}x=C-D|0}b[2060]=1023;b[6444]=0;if((x|0)==0){w=o;break}else{H=x}while(1){if(H>>>0<8>>>0){l=0;t=170;break L45}if((e[64]|0)>>>0<4>>>0){t=60;break L45}A=am(f|0)|0;if((A|0)==-1){l=0;t=173;break L45}B=am(f|0)|0;if((B|0)==-1){l=0;t=174;break L45}F=am(f|0)|0;if((F|0)==-1){l=0;t=175;break L45}G=am(f|0)|0;if((G|0)==-1){l=0;t=176;break L45}E=B<<16|A<<24|F<<8|G;c[j>>2]=E;F=G&15;A=F<<8&65535;B=am(f|0)|0;if((B|0)==-1){l=0;t=177;break L45}if((G&16|0)==0){c[j>>2]=(E>>>8)-1;if((cw(j)|0)<<24>>24!=(B&255)<<24>>24){t=69;break L45}I=(c[j>>2]|0)-1|0;J=A}else{I=E>>>8;J=A|4096}c[j>>2]=I;A=b[64]|0;b[10448+((A-1&65535)<<1)>>1]=I>>>9;b[10448+((A-2&65535)<<1)>>1]=I&511;E=b[2060]|0;B=A-3&65535;b[64]=B;b[10448+((B&65535)<<1)>>1]=E;E=am(f|0)|0;if((E|0)==-1){l=0;t=179;break L45}B=E+1|0;E=0;while(1){K=1<<(E&65535);if((E&65535)>>>0>=8>>>0){break}if((K&B|0)==0){E=E+1&65535}else{break}}if((B|0)!=(K|0)){t=76;break L45}A=b[64]|0;G=A-1&65535;b[64]=G;b[10448+((G&65535)<<1)>>1]=E|J;b[2060]=A-2;A=am(f|0)|0;if((A|0)==-1){l=0;t=186;break L45}G=am(f|0)|0;if((G|0)==-1){l=0;t=187;break L45}L=(G|A<<8)+F|0;A=L&65535;G=L&65535;M=b[64]|0;if(G>>>0>=(M&65535)>>>0){t=80;break L45}if(H>>>0<G<<1>>>0){l=0;t=189;break L45}L102:do{if(A<<16>>16!=0){G=1;N=M;while(1){O=N-1&65535;b[64]=O;P=am(f|0)|0;if((P|0)==-1){l=0;t=190;break L45}Q=am(f|0)|0;if((Q|0)==-1){l=0;t=191;break L45}b[10448+((O&65535)<<1)>>1]=Q|P<<8;if((G&65535)>>>0>=(A&65535)>>>0){break L102}G=G+1&65535;N=b[64]|0}}}while(0);A=L<<1&131070;M=H-8|0;if((M|0)==(A|0)){w=o;break}else{H=M-A|0}}}else if((u|0)==1229351012){if((r&1)!=0){t=29;break L45}if(v>>>0<13>>>0){l=0;t=150;break L45}o=am(f|0)|0;if((o|0)==-1){l=0;t=151;break L45}D=am(f|0)|0;if((D|0)==-1){l=0;t=152;break L45}C=b[6384]|0;A=am(f|0)|0;if((A|0)==-1){l=0;t=141;break L45}M=a[(c[3232]|0)+18|0]|0;F=am(f|0)|0;if((F|0)==-1){l=0;t=142;break L45}E=a[(c[3232]|0)+19|0]|0;B=am(f|0)|0;if((B|0)==-1){l=0;t=199;break L45}N=a[(c[3232]|0)+20|0]|0;G=am(f|0)|0;if((G|0)==-1){l=0;t=200;break L45}P=a[(c[3232]|0)+21|0]|0;Q=am(f|0)|0;if((Q|0)==-1){l=0;t=201;break L45}O=a[(c[3232]|0)+22|0]|0;R=am(f|0)|0;if((R|0)==-1){l=0;t=202;break L45}S=(R|0)==(d[(c[3232]|0)+23|0]|0)?(Q|0)==(O&255|0)?(G|0)==(P&255|0)?(B|0)==(N&255|0)?(F|0)==(E&255|0)?(A|0)==(M&255|0)?((D|o<<8)&65535)<<16>>16==C<<16>>16?r|1:-128:-128:-128:-128:-128:-128:-128;C=am(f|0)|0;if((C|0)==-1){l=0;t=203;break L45}o=am(f|0)|0;if((o|0)==-1){l=0;t=143;break L45}D=((o|C<<8)&65535)<<16>>16==(b[6432]|0)?S:-128;if(D<<24>>24==-128){t=37;break L45}S=am(f|0)|0;if((S|0)==-1){l=0;t=182;break L45}c[3154]=S<<16;S=am(f|0)|0;if((S|0)==-1){l=0;t=183;break L45}c[3154]=c[3154]|S<<8;S=am(f|0)|0;if((S|0)==-1){l=0;t=184;break L45}c[3154]=c[3154]|S;if(v>>>0>13>>>0){T=13}else{w=D;break}while(1){am(f|0)|0;S=T+1&65535;if((S&65535)>>>0<v>>>0){T=S}else{w=D;break}}}else if((u|0)==1095650895){dr(1);if((v|0)!=0){D=v;do{S=am(f|0)|0;if((S|0)==-1){l=0;t=192;break L45}dm(S);D=D-1|0;}while((D|0)!=0)}dm(13);w=r}else if((u|0)==1129145709){if((r&4)!=0){t=117;break}aO(g|0);D=0;S=v;L136:while(1){if((S|0)==0){U=D;V=0;t=108;break}C=am(f|0)|0;do{if((C|0)==0){if(S>>>0<2>>>0){t=97;break L136}o=S-1|0;M=am(f|0)|0;if((M|0)==-1){l=0;t=194;break L45}A=b[6404]|0;if((M|0)>-1&(D&65535)>>>0<(A&65535)>>>0){W=D;X=M}else{Y=D;Z=o;_=A;break}while(1){A=am(g|0)|0;if((A|0)==-1){l=0;t=195;break L45}a[(c[3232]|0)+(W&65535)|0]=A;A=W+1&65535;M=b[6404]|0;if((X|0)>0&(A&65535)>>>0<(M&65535)>>>0){W=A;X=X-1|0}else{Y=A;Z=o;_=M;break}}}else if((C|0)==(-1|0)){l=0;t=193;break L45}else{o=am(g|0)|0;if((o|0)==-1){l=0;t=196;break L45}a[(c[3232]|0)+(D&65535)|0]=o^C;Y=D+1&65535;Z=S;_=b[6404]|0}}while(0);if((Y&65535)>>>0>(_&65535)>>>0){t=106;break}else{D=Y;S=Z-1|0}}do{if((t|0)==97){t=0;dd(5504);D=S;while(1){am(f|0)|0;C=D-1|0;if((C|0)==0){$=1;break}else{D=C}}}else if((t|0)==106){t=0;dd(8168);if(Z>>>0>1>>>0){aa=Z}else{U=Y;V=Z;t=108;break}while(1){am(f|0)|0;D=aa-1|0;if(D>>>0>1>>>0){aa=D}else{U=Y;V=1;t=108;break}}}}while(0);do{if((t|0)==108){t=0;if((U&65535)>>>0<(e[6404]|0)>>>0){ab=U}else{$=V;break}while(1){S=am(g|0)|0;if((S|0)==-1){l=0;t=197;break L45}a[(c[3232]|0)+(ab&65535)|0]=S;S=ab+1&65535;if((S&65535)>>>0<(e[6404]|0)>>>0){ab=S}else{$=V;break}}}}while(0);w=($|0)==0?r|4:r}else if((u|0)==1431135597){if((r&4)!=0){t=117;break}if((v|0)!=(e[6404]|0)){dd(8008);t=117;break}if((aS(c[3232]|0,v|0,1,f|0)|0)!=1){t=117;break}w=r|4}else{t=117}}while(0);if((t|0)==117){t=0;aH(f|0,v|0,1)|0;w=r}if((p|0)!=0){am(f|0)|0}if((k|0)==(v|0)){s=w;break L44}else{q=n;r=w}}if((t|0)==29){dd(7224);l=0;i=h;return l|0}else if((t|0)==60){dd(6e3);l=0;i=h;return l|0}else if((t|0)==69){dd(5912);l=0;i=h;return l|0}else if((t|0)==37){dd(6696);l=0;i=h;return l|0}else if((t|0)==76){dd(5792);l=0;i=h;return l|0}else if((t|0)==80){dd(5656);l=0;i=h;return l|0}else if((t|0)==134){i=h;return l|0}else if((t|0)==136){i=h;return l|0}else if((t|0)==137){i=h;return l|0}else if((t|0)==138){i=h;return l|0}else if((t|0)==141){i=h;return l|0}else if((t|0)==142){i=h;return l|0}else if((t|0)==143){i=h;return l|0}else if((t|0)==144){i=h;return l|0}else if((t|0)==145){i=h;return l|0}else if((t|0)==146){i=h;return l|0}else if((t|0)==147){i=h;return l|0}else if((t|0)==150){i=h;return l|0}else if((t|0)==151){i=h;return l|0}else if((t|0)==152){i=h;return l|0}else if((t|0)==154){i=h;return l|0}else if((t|0)==155){i=h;return l|0}else if((t|0)==163){i=h;return l|0}else if((t|0)==164){i=h;return l|0}else if((t|0)==166){i=h;return l|0}else if((t|0)==167){i=h;return l|0}else if((t|0)==168){i=h;return l|0}else if((t|0)==169){i=h;return l|0}else if((t|0)==170){i=h;return l|0}else if((t|0)==173){i=h;return l|0}else if((t|0)==174){i=h;return l|0}else if((t|0)==175){i=h;return l|0}else if((t|0)==176){i=h;return l|0}else if((t|0)==177){i=h;return l|0}else if((t|0)==179){i=h;return l|0}else if((t|0)==180){i=h;return l|0}else if((t|0)==182){i=h;return l|0}else if((t|0)==183){i=h;return l|0}else if((t|0)==184){i=h;return l|0}else if((t|0)==186){i=h;return l|0}else if((t|0)==187){i=h;return l|0}else if((t|0)==189){i=h;return l|0}else if((t|0)==190){i=h;return l|0}else if((t|0)==191){i=h;return l|0}else if((t|0)==192){i=h;return l|0}else if((t|0)==193){i=h;return l|0}else if((t|0)==194){i=h;return l|0}else if((t|0)==195){i=h;return l|0}else if((t|0)==196){i=h;return l|0}else if((t|0)==197){i=h;return l|0}else if((t|0)==199){i=h;return l|0}else if((t|0)==200){i=h;return l|0}else if((t|0)==201){i=h;return l|0}else if((t|0)==202){i=h;return l|0}else if((t|0)==203){i=h;return l|0}}}while(0);t=s&255;if((t&1|0)==0){dd(7840)}if((t&2|0)==0){dd(7648)}if((t&4|0)==0){dd(7536)}l=s<<24>>24==7|0;i=h;return l|0}function c5(a){a=a|0;var b=0,e=0;b=i;i=i+16|0;e=b|0;dq(0);c[3130]=a&65535;if(a<<16>>16!=1){aC(7728);dS();c[3126]=0;c[1032]=1;dV(e,b+8|0);a=c[2606]|0;if((c[e>>2]|0)>(a|0)){dK(0);i=b;return}dN(a+1|0,1);dK(0);i=b;return}aC(6912);c[1032]=0;c[3126]=1;dR();if((d[12784]|0)>>>0<4>>>0){dN(2,1);dK(0);i=b;return}else{dN(1,1);dK(0);i=b;return}}function c6(a){a=a|0;((function($0){window["jsSplitWindow"]($0)}))(((d[12784]|0)>>>0<4>>>0)+(a&255)&65535);return}function c7(a){a=a|0;var b=0;dq(1);b=a&255;if((b<<16>>16|0)==0){dT()}else if((b<<16>>16|0)==1){dU();return}else if((b<<16>>16|0)==255){dM()}if((d[12784]|0)>>>0>4>>>0){dN(1,1);return}else{dN(c[3132]|0,1);return}}function c8(a){a=a|0;if(a<<16>>16!=1){return}dQ();return}function c9(a,b){a=a|0;b=b|0;if(!((c[1032]|0)==0&(c[3130]|0)==1)){return}dN(a&65535,b&65535);return}function da(){var b=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;i=i+32|0;e=b|0;f=b+16|0;dq(0);c[3130]=1;aC(6912);c[1032]=0;c[3126]=1;dR();if((d[12784]|0)>>>0<4>>>0){dN(2,1)}else{dN(1,1)}dK(0);dN(1,1);dK(1);ds(3,0);g=c[2608]|0;if((g|0)<1){h=g;while(1){dm(32);if((h|0)<0){h=h+1|0}else{break}}}c[2608]=1;h=f|0;c[h>>2]=(c[2610]|0)+1;((function(){window["jsFlushTo"]("DUMMY")}))();if((cJ(16)|0)<<16>>16!=0){dx(cJ(16)|0);((function($0){window["jsRegisterLocation"]($0)}))(cJ(16)|0);((function(){window["jsFlushTo"]("row1")}))()}g=c[2608]|0;c[e>>2]=g;c[2608]=g+1;a[(c[2610]|0)+g|0]=0;if((a[(c[3232]|0)+1|0]&2)==0){j=(c[3134]|0)-31|0;k=c[2608]|0;if((k|0)<(j|0)){l=k;do{dm(32);l=l+1|0;}while((l|0)<(j|0))}c[2608]=j;c[f+4>>2]=(c[2610]|0)+j;dp(6376);du(cJ(17)|0);((function(){window["jsFlushTo"]("score")}))();j=c[2608]|0;c[e+4>>2]=j;c[2608]=j+1;a[(c[2610]|0)+j|0]=0;j=(c[3134]|0)-15|0;l=c[2608]|0;if((l|0)<(j|0)){k=l;do{dm(32);k=k+1|0;}while((k|0)<(j|0))}c[2608]=j;c[f+8>>2]=(c[2610]|0)+j;dp(5984);du(cJ(18)|0);((function(){window["jsFlushTo"]("moves")}))();j=c[2608]|0;c[e+8>>2]=j;c[2608]=j+1;a[(c[2610]|0)+j|0]=0;m=3}else{aC(7192);j=(c[3134]|0)-21|0;k=c[2608]|0;if((k|0)<(j|0)){l=k;do{dm(32);l=l+1|0;}while((l|0)<(j|0))}c[2608]=j;c[f+4>>2]=(c[2610]|0)+j;dp(6688);j=(cJ(17)|0)&65535;dA(j,(cJ(18)|0)&65535);((function(){window["jsFlushTo"]("time")}))();j=c[2608]|0;c[e+4>>2]=j;c[2608]=j+1;a[(c[2610]|0)+j|0]=0;m=2}j=c[3134]|0;f=c[2608]|0;if((f|0)<(j|0)){l=f;do{dm(32);l=l+1|0;}while((l|0)<(j|0))}c[2608]=j;ds(-3,0);if((cS(m,h)|0)==0){n=1;o=g}else{dK(0);c5(0);i=b;return}while(1){a[(c[2610]|0)+o|0]=32;if((n|0)>=(m|0)){break}g=c[e+(n<<2)>>2]|0;n=n+1|0;o=g}a[(c[2610]|0)+(c[2608]|0)|0]=0;dp(c[2610]|0);dK(0);c5(0);i=b;return}function db(){((function(){window["jsBlankStatus"]()}))();return}function dc(a){a=a|0;((function($0){window["jsPrintString"]($0)}))(a);return}function dd(a){a=a|0;((function($0){window["jsPrintString"]($0)}))(a);aC(5880);return}function de(){aC(5880);return}function df(a,b){a=a|0;b=b|0;aC(5760);return}function dg(a){a=a|0;var b=0,d=0,e=0;b=c[1034]|0;d=b&65535;e=a&65535;if((e|0)==(b&65535|0)){cK(d);return}c[1034]=e;cT(e);cK(d);return}function dh(a,b){a=a|0;b=b|0;if((a+1&65535)>>>0>10>>>0|b<<16>>16<-1|b<<16>>16>9){cO(5640)}dq(0);dL(a,b);return}function di(b){b=b|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=i;i=i+8|0;g=f|0;h=0;j=0;k=0;l=0;m=0;n=0;while(1){o=(cv(b)|0)&65535;p=n;q=m;r=l;s=k;t=10;u=j;v=h;while(1){w=o>>>(t>>>0)&31;do{if((p|0)==0){if((r|0)==1){x=v;y=u;z=w<<5;A=2;B=q;C=0;break}else if((r|0)==0){if(w>>>0>5>>>0){D=w-6|0;E=(u|0)==2;if(E&(D|0)==0){x=v;y=v;z=s;A=1;B=q;C=0;break}if(!(E&(D|0)==1&(d[12784]|0)>>>0>1>>>0)){dj(a[12656+(u*26|0)+D|0]|0);x=v;y=v;z=s;A=0;B=q;C=0;break}if((c[3146]|0)==0){a[c[3186]|0]=0;bV(c[3186]|0);bS();dc(c[3186]|0);bX();de();x=v;y=v;z=s;A=0;B=q;C=0;break}else{((function($0){window["jsWriteChar"]($0)}))(13);x=v;y=v;z=s;A=0;B=q;C=0;break}}if((w|0)==0){((function($0){window["jsWriteChar"]($0)}))(32);x=v;y=u;z=s;A=0;B=q;C=0;break}D=a[12784]|0;if((D&255)>>>0>=3>>>0){E=w>>>0<4>>>0;x=E?v:0;y=E?u:w-3|0;z=s;A=0;B=E?w:q;C=E&1;break}if((w|0)!=1){E=v+w|0;if(w>>>0<4>>>0){x=v;y=(E+2|0)%3|0;z=s;A=0;B=q;C=0;break}else{F=(E|0)%3|0;x=F;y=F;z=s;A=0;B=q;C=0;break}}if(D<<24>>24!=1){x=v;y=u;z=s;A=0;B=1;C=1;break}if((c[3146]|0)==0){a[c[3186]|0]=0;bV(c[3186]|0);bS();dc(c[3186]|0);bX();de();x=v;y=u;z=s;A=0;B=q;C=0;break}else{((function($0){window["jsWriteChar"]($0)}))(13);x=v;y=u;z=s;A=0;B=q;C=0;break}}else{dj(w|s&255);x=v;y=u;z=s;A=0;B=q;C=0;break}}else{D=(q<<6)-64|0;F=(w<<1|D)+(e[6396]|0)|0;E=c[3232]|0;c[g>>2]=((d[E+F|0]<<8|d[E+(F+1)|0])&65535)<<1;di(g);x=v;y=v;z=s;A=r;B=D;C=0}}while(0);w=t-5|0;if((w|0)>-1){p=C;q=B;r=A;s=z;t=w;u=y;v=x}else{break}}if((o&32768|0)==0){h=x;j=y;k=z;l=A;m=B;n=C}else{break}}i=f;return}function dj(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;c=i;i=i+16|0;d=c|0;e=b&255;if((e-32|0)>>>0<95>>>0){((function($0){window["jsWriteChar"]($0)}))(e);i=c;return}if((e|0)==13){((function($0){window["jsWriteChar"]($0)}))(13);i=c;return}f=d|0;a[f]=63;g=d+1|0;a[g]=0;do{if((dX(e,f)|0)!=0){h=e-24|0;if(h>>>0<4>>>0){a[f]=a[104+h|0]|0;a[g]=0;break}if((e|0)==0){a[f]=0;i=c;return}if(e>>>0<32>>>0){a[f]=92;a[g]=e>>>6|48;a[d+2|0]=b>>>3&7|48;a[d+3|0]=b&7|48;a[d+4|0]=0;break}if((e-179|0)>>>0>=40>>>0){if((e-155|0)>>>0>=9>>>0){break}h=e<<1;a[f]=a[80+(h-310)|0]|0;a[g]=a[80+(h-309)|0]|0;a[d+2|0]=0;break}if((e|0)==179){a[f]=124}else if((e|0)==186){a[f]=35}else if((e|0)==196){a[f]=45}else if((e|0)==205){a[f]=61}else{a[f]=43}a[g]=0}}while(0);g=a[f]|0;if(g<<24>>24==0){i=c;return}else{j=0;k=g}do{((function($0){window["jsWriteChar"]($0)}))(k&255);j=j+1|0;k=a[d+j|0]|0;}while(k<<24>>24!=0);i=c;return}function dk(){if((c[3146]|0)==0){a[c[3186]|0]=0;bV(c[3186]|0);bS();dc(c[3186]|0);bX();de();return}else{((function($0){window["jsWriteChar"]($0)}))(13);return}}function dl(c,e,f){c=c|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=i;i=i+16|0;h=g|0;if((c|0)==0){j=0;k=4}else{l=e;e=0;m=0;n=c;while(1){c=a[l]|0;o=0;p=2;q=0;while(1){r=(a[12656+o|0]|0)==c<<24>>24;s=r?0:p;t=r?o:q;r=o+1|0;if((r|0)<26){o=r;p=s;q=t}else{u=0;v=s;w=t;break}}while(1){q=(a[12682+u|0]|0)==c<<24>>24;p=q?1:v;o=q?u:w;q=u+1|0;if((q|0)<26){u=q;v=p;w=o}else{x=0;y=p;z=o;break}}do{o=(a[12708+x|0]|0)==c<<24>>24;y=o?2:y;z=o?x:z;x=x+1|0;}while((x|0)<26);c=n-1|0;do{if((d[12784]|0)>>>0<3>>>0){if((y|0)==(e|0)){A=m;B=e;C=e;k=15;break}if((c|0)==0){D=0}else{o=a[l+1|0]|0;p=0;q=2;while(1){t=(a[12656+p|0]|0)==o<<24>>24?0:q;s=p+1|0;if((s|0)<26){p=s;q=t}else{E=0;F=t;break}}while(1){q=(a[12682+E|0]|0)==o<<24>>24?1:F;p=E+1|0;if((p|0)<26){E=p;F=q}else{G=0;H=q;break}}while(1){q=(a[12708+G|0]|0)==o<<24>>24?2:H;p=G+1|0;if((p|0)<26){G=p;H=q}else{D=q;break}}}o=(y+(e<<1)|0)%3|0;if((o|0)==0){A=m;B=e;C=y;k=15;break}q=(D|0)==(y|0);p=q?y:0;if((m|0)>=9){I=m;J=p;break}a[h+m|0]=(q?o+2|0:o)+1;A=m+1|0;B=p;C=y;k=15}else{if(!((y|0)!=0&(m|0)<9)){A=m;B=e;C=y;k=15;break}a[h+m|0]=y+3;A=m+1|0;B=e;C=y;k=15}}while(0);do{if((k|0)==15){k=0;if((A|0)>=9){I=A;J=B;break}p=A+1|0;a[h+A|0]=z+6;if(!((C|0)==2&(z|0)==0&(p|0)<9)){I=p;J=B;break}o=A+2|0;a[h+p|0]=(d[l]|0)>>>5;if((o|0)>=9){I=o;J=B;break}a[h+o|0]=a[l]&31;I=A+3|0;J=B}}while(0);if((c|0)==0){break}l=l+1|0;e=J;m=I;n=c}if((I|0)<9){j=I;k=4}}if((k|0)==4){d3(h+j|0,5,9-j|0)|0}b[f>>1]=a[h+1|0]<<5|d[h|0]<<10|a[h+2|0];j=a[h+4|0]<<5|d[h+3|0]<<10|a[h+5|0];k=f+2|0;b[k>>1]=j;I=a[h+7|0]<<5|d[h+6|0]<<10|a[h+8|0];h=f+4|0;b[h>>1]=I;if((d[12784]|0)>>>0<4>>>0){b[k>>1]=j|-32768;i=g;return}else{b[h>>1]=I|-32768;i=g;return}}function dm(a){a=a|0;((function($0){window["jsWriteChar"]($0)}))(a);return}function dn(a){a=a|0;if((a&65535)>>>0<9>>>0){dK(a&65535);return}else{cO(7120);return}}function dp(a){a=a|0;((function($0){window["jsPrintString"]($0)}))(a);return}function dq(b){b=b|0;a[c[3186]|0]=0;bV(c[3186]|0);bS();dc(c[3186]|0);return}function dr(b){b=b|0;a[c[3186]|0]=0;bV(c[3186]|0);bS();dc(c[3186]|0);c[1032]=b<<16>>16!=0;return}function ds(f,g){f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;switch(f<<16>>16){case 2:{bR();return};case 3:{f=c[3146]|0;if((f|0)==0){c[374]=c[1032];c[1032]=0;h=1}else{i=c[2078]|0;if((i|0)==0){c[2078]=4;c[2076]=dY(24)|0;j=4}else{j=i}if((f|0)>(j|0)){c[2078]=j<<1;c[2076]=d_(c[2076]|0,j*12|0)|0}if((d[12784]|0)>>>0<4>>>0){b[(c[2076]|0)+(((c[3146]|0)-1|0)*6|0)+4>>1]=c[2608]}else{b[(c[2076]|0)+(((c[3146]|0)-1|0)*6|0)+4>>1]=c[2598];b[(c[2076]|0)+(((c[3146]|0)-1|0)*6|0)+2>>1]=c[2604];b[(c[2076]|0)+(((c[3146]|0)-1|0)*6|0)>>1]=c[2602]}h=(c[3146]|0)+1|0}c[3146]=h;if((d[12784]|0)>>>0<4>>>0){c[2608]=0;return}else{c[2602]=0;h=g&65535;c[2604]=h;c[2598]=h+2;return}break};case 1:{c[1018]=1;return};case-4:{b$();return};case-3:{h=c[3146]|0;if((h|0)==0){return}else if((h|0)==1){c[1032]=c[374];c[3146]=0;if((d[12784]|0)>>>0<=3>>>0){return}a[(c[3232]|0)+(c[2604]|0)|0]=(c[2602]|0)>>>8;a[(c[3232]|0)+((c[2604]|0)+1)|0]=c[2602];return}else{g=a[12784]|0;if((g&255)>>>0>3>>>0){a[(c[3232]|0)+(c[2604]|0)|0]=(c[2602]|0)>>>8;a[(c[3232]|0)+((c[2604]|0)+1)|0]=c[2602];k=a[12784]|0;l=c[3146]|0}else{k=g;l=h}c[3146]=l-1;h=c[2076]|0;g=e[h+((l-2|0)*6|0)+4>>1]|0;if((k&255)>>>0<4>>>0){c[2608]=g;return}else{c[2598]=g;g=l-2|0;c[2604]=e[h+(g*6|0)+2>>1]|0;c[2602]=e[h+(g*6|0)>>1]|0;return}}break};case-2:{bT();return};case-1:{c[1018]=0;return};case 4:{bY();return};default:{return}}}function dt(a){a=a|0;dj((a&255)<<24>>24);return}function du(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=e|0;aN(f|0,6656,(g=i,i=i+8|0,c[g>>2]=b<<16>>16,g)|0)|0;i=g;g=d2(f|0)|0;if((g|0)>0){h=0}else{i=d;return}do{((function($0){window["jsWriteChar"]($0)}))(a[e+h|0]|0);h=h+1|0;}while((h|0)<(g|0));i=d;return}function dv(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;c[d>>2]=_(c[2596]|0,a&65535)|0;di(d);i=b;return}function dw(a){a=a|0;var b=0,d=0;b=i;i=i+8|0;d=b|0;c[d>>2]=a&65535;di(d);i=b;return}function dx(a){a=a|0;var b=0,e=0,f=0;b=i;i=i+8|0;e=b|0;if(a<<16>>16==0){i=b;return}f=cx(a)|0;a=((d[12784]|0)>>>0<4>>>0?7:12)+f&65535;f=c[3232]|0;c[e>>2]=(((d[f+a|0]|0)<<8|(d[f+(a+1)|0]|0))&65535)+1;di(e);i=b;return}function dy(){di(12616);return}function dz(){di(12616);if((c[3146]|0)==0){a[c[3186]|0]=0;bV(c[3186]|0);bS();dc(c[3186]|0);bX();de();bz(1);return}else{((function($0){window["jsWriteChar"]($0)}))(13);bz(1);return}}function dA(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+16|0;f=e|0;g=(b|0)>11;h=(b|0)%12|0;b=(h|0)==0?12:h;if((b|0)<10){((function($0){window["jsWriteChar"]($0)}))(32)}h=f|0;aN(h|0,6656,(j=i,i=i+8|0,c[j>>2]=b<<16>>16,j)|0)|0;i=j;b=d2(h|0)|0;if((b|0)>0){k=0;do{((function($0){window["jsWriteChar"]($0)}))(a[f+k|0]|0);k=k+1|0;}while((k|0)<(b|0))}((function($0){window["jsWriteChar"]($0)}))(58);if((d|0)<10){((function($0){window["jsWriteChar"]($0)}))(48)}aN(h|0,6656,(j=i,i=i+8|0,c[j>>2]=d<<16>>16,j)|0)|0;i=j;j=d2(h|0)|0;if((j|0)>0){h=0;do{((function($0){window["jsWriteChar"]($0)}))(a[f+h|0]|0);h=h+1|0;}while((h|0)<(j|0))}((function($0){window["jsWriteChar"]($0)}))(32);if(g){((function($0){window["jsWriteChar"]($0)}))(112);((function($0){window["jsWriteChar"]($0)}))(109);i=e;return}else{((function($0){window["jsWriteChar"]($0)}))(97);((function($0){window["jsWriteChar"]($0)}))(109);i=e;return}}function dB(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0;h=i;i=i+8|0;j=h|0;k=j|0;dl(e&65535,(c[3232]|0)+((f&65535)+(d&65535))|0,k);d=b[k>>1]|0;k=g&65535;a[(c[3232]|0)+k|0]=(d&65535)>>>8;a[(c[3232]|0)+(k+1)|0]=d;d=b[j+2>>1]|0;k=g+2&65535;a[(c[3232]|0)+k|0]=(d&65535)>>>8;a[(c[3232]|0)+(k+1)|0]=d;d=b[j+4>>1]|0;j=g+4&65535;a[(c[3232]|0)+j|0]=(d&65535)>>>8;a[(c[3232]|0)+(j+1)|0]=d;i=h;return}function dC(a){a=a|0;cK(cJ(a&65535)|0);return}function dD(a){a=a|0;var c=0;c=(b[64]|0)-1&65535;b[64]=c;b[10448+((c&65535)<<1)>>1]=a;return}function dE(a){a=a|0;var c=0;c=b[64]|0;b[64]=c+1;cL(a&65535,b[10448+((c&65535)<<1)>>1]|0);return}function dF(a){a=a|0;var b=0;b=a&65535;cL(b,(cJ(b)|0)+1&65535);return}function dG(a){a=a|0;var b=0;b=a&65535;cL(b,(cJ(b)|0)-1&65535);return}function dH(a,b){a=a|0;b=b|0;var c=0;c=a&65535;a=(cJ(c)|0)+1&65535;cL(c,a);cN(a<<16>>16>b<<16>>16|0);return}function dI(a,b){a=a|0;b=b|0;var c=0;c=a&65535;a=(cJ(c)|0)-1&65535;cL(c,a);cN(a<<16>>16<b<<16>>16|0);return}function dJ(b){b=b|0;c[3134]=b;a[(c[3232]|0)+33|0]=b;return}function dK(a){a=a|0;((function($0,$1,$2,$3,$4){window["jsSetAttribute"]($0,$1,$2,$3,$4)}))((a|0)==0|0,a&1,a&2,a&4,a&8);return}function dL(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;do{if((d-1&65535)>>>0<9>>>0){if(d<<16>>16==1){g=(b[2072]|0)+30|0;break}else{g=c[136+((d&65535)-2<<2)>>2]|0;break}}else{g=0}}while(0);do{if((e-1&65535)>>>0<9>>>0){if(e<<16>>16==1){h=(b[2076]|0)+40|0;break}else{h=c[176+((e&65535)-2<<2)>>2]|0;break}}else{h=0}}while(0);if((a[12648]|0)!=0){i=f;return}do{if((c[28]|0)==0){if((h|0)!=40){aR(7792,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j;a[168]=1;break}if(!(a[168]|0)){break}aR(7632,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;a[168]=0}else{aR(7792,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j}}while(0);aR(7792,(j=i,i=i+8|0,c[j>>2]=g,j)|0)|0;i=j;i=f;return}function dM(){var a=0;if((c[3132]|0)<1){c[1042]=1;c[1044]=1;return}else{a=1}do{((function($0,$1){window["jsMoveCursor"]($0,$1)}))(a,1);c[1042]=a;c[1044]=1;aC(5728);a=a+1|0;}while((a|0)<=(c[3132]|0));c[1042]=1;c[1044]=1;return}function dN(a,b){a=a|0;b=b|0;((function($0,$1){window["jsMoveCursor"]($0,$1)}))(a,b);c[1042]=a;c[1044]=b;return}function dO(){var b=0,e=0,f=0,g=0,h=0,i=0;a[4160]=0;a[(c[3232]|0)+50|0]=1;a[(c[3232]|0)+51|0]=0;b=(c[3232]|0)+1|0;e=a[b]|0;if((d[12784]|0)>>>0<4>>>0){a[b]=e|32;f=c[3232]|0;g=f+17|0;h=a[g]|0;i=h&-9;a[g]=i;return}else{a[b]=e|-100;e=(c[3232]|0)+1|0;a[e]=a[e]|1;e=(c[3232]|0)+1|0;a[e]=a[e]&-35;f=c[3232]|0;g=f+17|0;h=a[g]|0;i=h&-9;a[g]=i;return}}function dP(){((function($0){window["jsPrintString"]($0)}))(getelementptr);return}function dQ(){aC(5728);return}function dR(){if(a[4160]|0){return}c[3136]=c[1042];c[3138]=c[1044];a[4160]=1;return}function dS(){var b=0,d=0;if(!(a[4160]|0)){return}b=c[3136]|0;d=c[3138]|0;((function($0,$1){window["jsMoveCursor"]($0,$1)}))(b,d);c[1042]=b;c[1044]=d;a[4160]=0;return}function dT(){aC(5576);return}function dU(){aC(5464);return}function dV(a,b){a=a|0;b=b|0;c[a>>2]=c[1042];c[b>>2]=c[1044];return}function dW(a){a=a|0;var b=0;a_(a|0)|0;a=(c[1044]|0)+1|0;c[1044]=a;b=c[3134]|0;if((a|0)<=(b|0)){return}c[1044]=b;return}function dX(b,c){b=b|0;c=c|0;var d=0,e=0;d=b-155|0;if(d>>>0>=69>>>0){e=1;return e|0}a[c]=a[8+d|0]|0;if((b|0)==220){a[c+1|0]=101;a[c+2|0]=0;e=0;return e|0}d=c+1|0;if((b|0)==221){a[d]=69;a[c+2|0]=0;e=0;return e|0}else{a[d]=0;e=0;return e|0}return 0}function dY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aF=0,aG=0,aH=0,aI=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[3246]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=13024+(h<<2)|0;j=13024+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[3246]=e&~(1<<g)}else{if(l>>>0<(c[3250]|0)>>>0){as();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{as();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[3248]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=13024+(p<<2)|0;m=13024+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[3246]=e&~(1<<r)}else{if(l>>>0<(c[3250]|0)>>>0){as();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{as();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[3248]|0;if((l|0)!=0){q=c[3251]|0;d=l>>>3;l=d<<1;f=13024+(l<<2)|0;k=c[3246]|0;h=1<<d;do{if((k&h|0)==0){c[3246]=k|h;s=f;t=13024+(l+2<<2)|0}else{d=13024+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[3250]|0)>>>0){s=g;t=d;break}as();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[3248]=m;c[3251]=e;n=i;return n|0}l=c[3247]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[13288+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[3250]|0;if(r>>>0<i>>>0){as();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){as();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){as();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){as();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){as();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{as();return 0}}}while(0);L78:do{if((e|0)!=0){f=d+28|0;i=13288+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[3247]=c[3247]&~(1<<c[f>>2]);break L78}else{if(e>>>0<(c[3250]|0)>>>0){as();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L78}}}while(0);if(v>>>0<(c[3250]|0)>>>0){as();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[3250]|0)>>>0){as();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[3250]|0)>>>0){as();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[3248]|0;if((f|0)!=0){e=c[3251]|0;i=f>>>3;f=i<<1;q=13024+(f<<2)|0;k=c[3246]|0;g=1<<i;do{if((k&g|0)==0){c[3246]=k|g;y=q;z=13024+(f+2<<2)|0}else{i=13024+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[3250]|0)>>>0){y=l;z=i;break}as();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[3248]=p;c[3251]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[3247]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[13288+(A<<2)>>2]|0;L126:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L126}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[13288+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[3248]|0)-g|0)>>>0){o=g;break}q=K;m=c[3250]|0;if(q>>>0<m>>>0){as();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){as();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){as();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){as();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){as();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{as();return 0}}}while(0);L176:do{if((e|0)!=0){i=K+28|0;m=13288+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[3247]=c[3247]&~(1<<c[i>>2]);break L176}else{if(e>>>0<(c[3250]|0)>>>0){as();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L176}}}while(0);if(L>>>0<(c[3250]|0)>>>0){as();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[3250]|0)>>>0){as();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[3250]|0)>>>0){as();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=13024+(e<<2)|0;r=c[3246]|0;j=1<<i;do{if((r&j|0)==0){c[3246]=r|j;O=m;P=13024+(e+2<<2)|0}else{i=13024+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[3250]|0)>>>0){O=d;P=i;break}as();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=13288+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[3247]|0;l=1<<Q;if((m&l|0)==0){c[3247]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=151;break}else{l=l<<1;m=j}}if((T|0)==151){if(S>>>0<(c[3250]|0)>>>0){as();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[3250]|0;if(m>>>0<i>>>0){as();return 0}if(j>>>0<i>>>0){as();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[3248]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[3251]|0;if(S>>>0>15>>>0){R=J;c[3251]=R+o;c[3248]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[3248]=0;c[3251]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[3249]|0;if(o>>>0<J>>>0){S=J-o|0;c[3249]=S;J=c[3252]|0;K=J;c[3252]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[3156]|0)==0){J=aE(30)|0;if((J-1&J|0)==0){c[3158]=J;c[3157]=J;c[3159]=-1;c[3160]=-1;c[3161]=0;c[3357]=0;c[3156]=(a6(0)|0)&-16^1431655768;break}else{as();return 0}}}while(0);J=o+48|0;S=c[3158]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[3356]|0;do{if((O|0)!=0){P=c[3354]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L268:do{if((c[3357]&4|0)==0){O=c[3252]|0;L270:do{if((O|0)==0){T=181}else{L=O;P=13432;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=181;break L270}else{P=M}}if((P|0)==0){T=181;break}L=R-(c[3249]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=a5(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=190}}while(0);do{if((T|0)==181){O=a5(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[3157]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[3354]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[3356]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=a5($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=190}}while(0);L290:do{if((T|0)==190){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=201;break L268}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[3158]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((a5(O|0)|0)==-1){a5(m|0)|0;W=Y;break L290}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=201;break L268}}}while(0);c[3357]=c[3357]|4;ad=W;T=198}else{ad=0;T=198}}while(0);do{if((T|0)==198){if(S>>>0>=2147483647>>>0){break}W=a5(S|0)|0;Z=a5(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=201}}}while(0);do{if((T|0)==201){ad=(c[3354]|0)+aa|0;c[3354]=ad;if(ad>>>0>(c[3355]|0)>>>0){c[3355]=ad}ad=c[3252]|0;L310:do{if((ad|0)==0){S=c[3250]|0;if((S|0)==0|ab>>>0<S>>>0){c[3250]=ab}c[3358]=ab;c[3359]=aa;c[3361]=0;c[3255]=c[3156];c[3254]=-1;S=0;do{Y=S<<1;ac=13024+(Y<<2)|0;c[13024+(Y+3<<2)>>2]=ac;c[13024+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[3252]=ab+ae;c[3249]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[3253]=c[3160]}else{S=13432;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=213;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==213){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[3252]|0;Y=(c[3249]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[3252]=Z+ai;c[3249]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[3253]=c[3160];break L310}}while(0);if(ab>>>0<(c[3250]|0)>>>0){c[3250]=ab}S=ab+aa|0;Y=13432;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=223;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==223){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[3252]|0)){J=(c[3249]|0)+K|0;c[3249]=J;c[3252]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[3251]|0)){J=(c[3248]|0)+K|0;c[3248]=J;c[3251]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L355:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=13024+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[3250]|0)>>>0){as();return 0}if((c[U+12>>2]|0)==(Z|0)){break}as();return 0}}while(0);if((Q|0)==(U|0)){c[3246]=c[3246]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[3250]|0)>>>0){as();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}as();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[3250]|0)>>>0){as();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[3250]|0)>>>0){as();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){as();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{as();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=13288+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[3247]=c[3247]&~(1<<c[P>>2]);break L355}else{if(m>>>0<(c[3250]|0)>>>0){as();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L355}}}while(0);if(an>>>0<(c[3250]|0)>>>0){as();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[3250]|0)>>>0){as();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[3250]|0)>>>0){as();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=13024+(V<<2)|0;P=c[3246]|0;m=1<<J;do{if((P&m|0)==0){c[3246]=P|m;at=X;au=13024+(V+2<<2)|0}else{J=13024+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[3250]|0)>>>0){at=U;au=J;break}as();return 0}}while(0);c[au>>2]=_;c[at+12>>2]=_;c[ab+(W+8)>>2]=at;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){av=0}else{if(ar>>>0>16777215>>>0){av=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;av=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=13288+(av<<2)|0;c[ab+(W+28)>>2]=av;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[3247]|0;Q=1<<av;if((X&Q|0)==0){c[3247]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((av|0)==31){aw=0}else{aw=25-(av>>>1)|0}Q=ar<<aw;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}ax=X+16+(Q>>>31<<2)|0;m=c[ax>>2]|0;if((m|0)==0){T=296;break}else{Q=Q<<1;X=m}}if((T|0)==296){if(ax>>>0<(c[3250]|0)>>>0){as();return 0}else{c[ax>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[3250]|0;if(X>>>0<$>>>0){as();return 0}if(m>>>0<$>>>0){as();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=13432;while(1){ay=c[W>>2]|0;if(ay>>>0<=Y>>>0){az=c[W+4>>2]|0;aA=ay+az|0;if(aA>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ay+(az-39)|0;if((W&7|0)==0){aB=0}else{aB=-W&7}W=ay+(az-47+aB)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aC=0}else{aC=-_&7}_=aa-40-aC|0;c[3252]=ab+aC;c[3249]=_;c[ab+(aC+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[3253]=c[3160];c[ac+4>>2]=27;c[W>>2]=c[3358];c[W+4>>2]=c[3359];c[W+8>>2]=c[3360];c[W+12>>2]=c[3361];c[3358]=ab;c[3359]=aa;c[3361]=0;c[3360]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aA>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aA>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=13024+(K<<2)|0;S=c[3246]|0;m=1<<W;do{if((S&m|0)==0){c[3246]=S|m;aD=Z;aF=13024+(K+2<<2)|0}else{W=13024+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[3250]|0)>>>0){aD=Q;aF=W;break}as();return 0}}while(0);c[aF>>2]=ad;c[aD+12>>2]=ad;c[ad+8>>2]=aD;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aG=0}else{if(_>>>0>16777215>>>0){aG=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aG=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=13288+(aG<<2)|0;c[ad+28>>2]=aG;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[3247]|0;Q=1<<aG;if((Z&Q|0)==0){c[3247]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aG|0)==31){aH=0}else{aH=25-(aG>>>1)|0}Q=_<<aH;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aI=Z+16+(Q>>>31<<2)|0;m=c[aI>>2]|0;if((m|0)==0){T=331;break}else{Q=Q<<1;Z=m}}if((T|0)==331){if(aI>>>0<(c[3250]|0)>>>0){as();return 0}else{c[aI>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[3250]|0;if(Z>>>0<m>>>0){as();return 0}if(_>>>0<m>>>0){as();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[3249]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[3249]=_;ad=c[3252]|0;Q=ad;c[3252]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(a2()|0)>>2]=12;n=0;return n|0}function dZ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[3250]|0;if(b>>>0<e>>>0){as()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){as()}h=f&-8;i=a+(h-8)|0;j=i;L10:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){as()}if((n|0)==(c[3251]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[3248]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=13024+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){as()}if((c[k+12>>2]|0)==(n|0)){break}as()}}while(0);if((s|0)==(k|0)){c[3246]=c[3246]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){as()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}as()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){as()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){as()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){as()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{as()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=13288+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[3247]=c[3247]&~(1<<c[v>>2]);q=n;r=o;break L10}else{if(p>>>0<(c[3250]|0)>>>0){as()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L10}}}while(0);if(A>>>0<(c[3250]|0)>>>0){as()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3250]|0)>>>0){as()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[3250]|0)>>>0){as()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){as()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){as()}do{if((e&2|0)==0){if((j|0)==(c[3252]|0)){B=(c[3249]|0)+r|0;c[3249]=B;c[3252]=q;c[q+4>>2]=B|1;if((q|0)!=(c[3251]|0)){return}c[3251]=0;c[3248]=0;return}if((j|0)==(c[3251]|0)){B=(c[3248]|0)+r|0;c[3248]=B;c[3251]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L112:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=13024+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[3250]|0)>>>0){as()}if((c[u+12>>2]|0)==(j|0)){break}as()}}while(0);if((g|0)==(u|0)){c[3246]=c[3246]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[3250]|0)>>>0){as()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}as()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[3250]|0)>>>0){as()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[3250]|0)>>>0){as()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){as()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{as()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=13288+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[3247]=c[3247]&~(1<<c[t>>2]);break L112}else{if(f>>>0<(c[3250]|0)>>>0){as()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L112}}}while(0);if(E>>>0<(c[3250]|0)>>>0){as()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[3250]|0)>>>0){as()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[3250]|0)>>>0){as()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[3251]|0)){H=B;break}c[3248]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=13024+(d<<2)|0;A=c[3246]|0;E=1<<r;do{if((A&E|0)==0){c[3246]=A|E;I=e;J=13024+(d+2<<2)|0}else{r=13024+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[3250]|0)>>>0){I=h;J=r;break}as()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=13288+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[3247]|0;d=1<<K;do{if((r&d|0)==0){c[3247]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=129;break}else{A=A<<1;J=E}}if((N|0)==129){if(M>>>0<(c[3250]|0)>>>0){as()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[3250]|0;if(J>>>0<E>>>0){as()}if(B>>>0<E>>>0){as()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[3254]|0)-1|0;c[3254]=q;if((q|0)==0){O=13440}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[3254]=-1;return}function d_(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=dY(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(a2()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=d$(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=dY(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;d4(f|0,a|0,g>>>0<b>>>0?g:b)|0;dZ(a);d=f;return d|0}function d$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[3250]|0;if(g>>>0<j>>>0){as();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){as();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){as();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[3158]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;d0(g+b|0,k);n=a;return n|0}if((i|0)==(c[3252]|0)){k=(c[3249]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[3252]=g+b;c[3249]=l;n=a;return n|0}if((i|0)==(c[3251]|0)){l=(c[3248]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[3248]=q;c[3251]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L52:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=13024+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){as();return 0}if((c[l+12>>2]|0)==(i|0)){break}as();return 0}}while(0);if((k|0)==(l|0)){c[3246]=c[3246]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){as();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}as();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){as();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){as();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){as();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{as();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=13288+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3247]=c[3247]&~(1<<c[t>>2]);break L52}else{if(s>>>0<(c[3250]|0)>>>0){as();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L52}}}while(0);if(y>>>0<(c[3250]|0)>>>0){as();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[3250]|0)>>>0){as();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[3250]|0)>>>0){as();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;d0(g+b|0,q);n=a;return n|0}return 0}function d0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L1:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[3250]|0;if(i>>>0<l>>>0){as()}if((j|0)==(c[3251]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[3248]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=13024+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){as()}if((c[p+12>>2]|0)==(j|0)){break}as()}}while(0);if((q|0)==(p|0)){c[3246]=c[3246]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){as()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}as()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){as()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){as()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){as()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{as()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=13288+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3247]=c[3247]&~(1<<c[t>>2]);n=j;o=k;break L1}else{if(m>>>0<(c[3250]|0)>>>0){as()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L1}}}while(0);if(y>>>0<(c[3250]|0)>>>0){as()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3250]|0)>>>0){as()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[3250]|0)>>>0){as()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[3250]|0;if(e>>>0<a>>>0){as()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[3252]|0)){A=(c[3249]|0)+o|0;c[3249]=A;c[3252]=n;c[n+4>>2]=A|1;if((n|0)!=(c[3251]|0)){return}c[3251]=0;c[3248]=0;return}if((f|0)==(c[3251]|0)){A=(c[3248]|0)+o|0;c[3248]=A;c[3251]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L100:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=13024+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){as()}if((c[g+12>>2]|0)==(f|0)){break}as()}}while(0);if((t|0)==(g|0)){c[3246]=c[3246]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){as()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}as()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){as()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){as()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){as()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{as()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=13288+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[3247]=c[3247]&~(1<<c[l>>2]);break L100}else{if(m>>>0<(c[3250]|0)>>>0){as()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L100}}}while(0);if(C>>>0<(c[3250]|0)>>>0){as()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[3250]|0)>>>0){as()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[3250]|0)>>>0){as()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[3251]|0)){F=A;break}c[3248]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=13024+(z<<2)|0;C=c[3246]|0;b=1<<o;do{if((C&b|0)==0){c[3246]=C|b;G=y;H=13024+(z+2<<2)|0}else{o=13024+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[3250]|0)>>>0){G=d;H=o;break}as()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=13288+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[3247]|0;z=1<<I;if((o&z|0)==0){c[3247]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=126;break}else{I=I<<1;J=G}}if((L|0)==126){if(K>>>0<(c[3250]|0)>>>0){as()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[3250]|0;if(J>>>0<I>>>0){as()}if(L>>>0<I>>>0){as()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function d1(b,c){b=b|0;c=c|0;var d=0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while(a[c+(d-1)|0]|0);return b|0}function d2(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function d3(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function d4(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function d5(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function d6(a,b){a=a|0;b=b|0;return ba[a&1](b|0)|0}function d7(a){a=a|0;bb[a&1]()}function d8(a,b,c){a=a|0;b=b|0;c=c|0;return bc[a&1](b|0,c|0)|0}function d9(a,b){a=a|0;b=b|0;bd[a&1](b|0)}function ea(a){a=a|0;$(0);return 0}function eb(){$(1)}function ec(a,b){a=a|0;b=b|0;$(2);return 0}function ed(a){a=a|0;$(3)}
// EMSCRIPTEN_END_FUNCS
var ba=[ea,ea];var bb=[eb,eb];var bc=[ec,ec];var bd=[ed,ed];return{_spinupJS:bv,_jsrGetLine:b8,_strlen:d2,_read_object:cA,_free:dZ,_realloc:d_,_jsrResizeWindow:dJ,_tolower:d5,_get_object_address:cx,_memset:d3,_malloc:dY,_memcpy:d4,_z_print_obj:dx,_load_variable:cJ,_cleanupJS:bw,_jsrInputCharacter:b4,_interpret:ca,_strcpy:d1,_z_restore:bO,runPostSets:bu,stackAlloc:be,stackSave:bf,stackRestore:bg,setThrew:bh,setTempRet0:bk,setTempRet1:bl,setTempRet2:bm,setTempRet3:bn,setTempRet4:bo,setTempRet5:bp,setTempRet6:bq,setTempRet7:br,setTempRet8:bs,setTempRet9:bt,dynCall_ii:d6,dynCall_v:d7,dynCall_iii:d8,dynCall_vi:d9}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_vi": invoke_vi, "_llvm_lifetime_end": _llvm_lifetime_end, "_lseek": _lseek, "_snprintf": _snprintf, "_rand": _rand, "_fgetc": _fgetc, "_srand": _srand, "_fclose": _fclose, "_strtok_r": _strtok_r, "__getFloat": __getFloat, "_isprint": _isprint, "_abort": _abort, "_fprintf": _fprintf, "_close": _close, "_fgets": _fgets, "_pread": _pread, "_fflush": _fflush, "_fopen": _fopen, "_open": _open, "_strchr": _strchr, "_fputc": _fputc, "_emscripten_asm_const": _emscripten_asm_const, "___buildEnvironment": ___buildEnvironment, "_sysconf": _sysconf, "_strtok": _strtok, "___setErrNo": ___setErrNo, "_fseek": _fseek, "_send": _send, "_write": _write, "__scanString": __scanString, "_ftell": _ftell, "_exit": _exit, "_sprintf": _sprintf, "_rewind": _rewind, "_strrchr": _strrchr, "_rmdir": _rmdir, "_printf": _printf, "_fread": _fread, "_read": _read, "__reallyNegative": __reallyNegative, "__formatString": __formatString, "_getenv": _getenv, "_unlink": _unlink, "_recv": _recv, "_pwrite": _pwrite, "_putchar": _putchar, "_fwrite": _fwrite, "_fsync": _fsync, "_fscanf": _fscanf, "___errno_location": ___errno_location, "_remove": _remove, "_llvm_lifetime_start": _llvm_lifetime_start, "_sbrk": _sbrk, "_time": _time, "_ungetc": _ungetc, "__exit": __exit, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr }, buffer);
var _spinupJS = Module["_spinupJS"] = asm["_spinupJS"];
var _jsrGetLine = Module["_jsrGetLine"] = asm["_jsrGetLine"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _read_object = Module["_read_object"] = asm["_read_object"];
var _free = Module["_free"] = asm["_free"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _jsrResizeWindow = Module["_jsrResizeWindow"] = asm["_jsrResizeWindow"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _get_object_address = Module["_get_object_address"] = asm["_get_object_address"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _z_print_obj = Module["_z_print_obj"] = asm["_z_print_obj"];
var _load_variable = Module["_load_variable"] = asm["_load_variable"];
var _cleanupJS = Module["_cleanupJS"] = asm["_cleanupJS"];
var _jsrInputCharacter = Module["_jsrInputCharacter"] = asm["_jsrInputCharacter"];
var _interpret = Module["_interpret"] = asm["_interpret"];
var _strcpy = Module["_strcpy"] = asm["_strcpy"];
var _z_restore = Module["_z_restore"] = asm["_z_restore"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
