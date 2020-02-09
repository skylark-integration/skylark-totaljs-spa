/**
 * skylark-totaljs-spa - A version of totaljs spa that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-totaljs-spa/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx/skylark");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-langx-ns/_attach',[],function(){
    return  function attach(obj1,path,obj2) {
        if (typeof path == "string") {
            path = path.split(".");//[path]
        };
        var length = path.length,
            ns=obj1,
            i=0,
            name = path[i++];

        while (i < length) {
            ns = ns[name] = ns[name] || {};
            name = path[i++];
        }

        return ns[name] = obj2;
    }
});
define('skylark-langx-ns/ns',[
    "./_attach"
], function(_attach) {
    var skylark = {
    	attach : function(path,obj) {
    		return _attach(skylark,path,obj);
    	}
    };
    return skylark;
});

define('skylark-langx-ns/main',[
	"./ns"
],function(skylark){
	return skylark;
});
define('skylark-langx-ns', ['skylark-langx-ns/main'], function (main) { return main; });

define('skylark-langx/skylark',[
    "skylark-langx-ns"
], function(ns) {
	return ns;
});

define('skylark-langx-types/types',[
    "skylark-langx-ns"
],function(skylark){
    var toString = {}.toString;
    
    var type = (function() {
        var class2type = {};

        // Populate the class2type map
        "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" ").forEach(function(name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });

        return function type(obj) {
            return obj == null ? String(obj) :
                class2type[toString.call(obj)] || "object";
        };
    })();

    function isArray(object) {
        return object && object.constructor === Array;
    }


    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function/string/element and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * isArrayLike([1, 2, 3])
     * // => true
     *
     * isArrayLike(document.body.children)
     * // => false
     *
     * isArrayLike('abc')
     * // => true
     *
     * isArrayLike(Function)
     * // => false
     */    
    function isArrayLike(obj) {
        return !isString(obj) && !isHtmlNode(obj) && typeof obj.length == 'number' && !isFunction(obj);
    }

    /**
     * Checks if `value` is classified as a boolean primitive or object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a boolean, else `false`.
     * @example
     *
     * isBoolean(false)
     * // => true
     *
     * isBoolean(null)
     * // => false
     */
    function isBoolean(obj) {
        return typeof(obj) === "boolean";
    }

    function isDefined(obj) {
        return typeof obj !== 'undefined';
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    }

    function isEmptyObject(obj) {
        var name;
        for (name in obj) {
            if (obj[name] !== null) {
                return false;
            }
        }
        return true;
    }


    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * isFunction(parseInt)
     * // => true
     *
     * isFunction(/abc/)
     * // => false
     */
    function isFunction(value) {
        return type(value) == "function";
    }

    function isHtmlNode(obj) {
        return obj && obj.nodeType; // obj instanceof Node; //Consider the elements in IFRAME
    }

    function isInstanceOf( /*Object*/ value, /*Type*/ type) {
        //Tests whether the value is an instance of a type.
        if (value === undefined) {
            return false;
        } else if (value === null || type == Object) {
            return true;
        } else if (typeof value === "number") {
            return type === Number;
        } else if (typeof value === "string") {
            return type === String;
        } else if (typeof value === "boolean") {
            return type === Boolean;
        } else if (typeof value === "string") {
            return type === String;
        } else {
            return (value instanceof type) || (value && value.isInstanceOf ? value.isInstanceOf(type) : false);
        }
    }

    function isNull(value) {
      return type(value) === "null";
    }

    function isNumber(obj) {
        return typeof obj == 'number';
    }

    function isObject(obj) {
        return type(obj) == "object";
    }

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    }

    function isString(obj) {
        return typeof obj === 'string';
    }

    function isWindow(obj) {
        return obj && obj == obj.window;
    }

    function isSameOrigin(href) {
        if (href) {
            var origin = location.protocol + '//' + location.hostname;
            if (location.port) {
                origin += ':' + location.port;
            }
            return href.startsWith(origin);
        }
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString.call(value) == symbolTag);
    }

    function isUndefined(value) {
      return value === undefined
    }

    return skylark.attach("langx.types",{

        isArray: isArray,

        isArrayLike: isArrayLike,

        isBoolean: isBoolean,

        isDefined: isDefined,

        isDocument: isDocument,

        isEmpty : isEmptyObject,

        isEmptyObject: isEmptyObject,

        isFunction: isFunction,

        isHtmlNode: isHtmlNode,

        isNull: isNull,

        isNumber: isNumber,

        isNumeric: isNumber,

        isObject: isObject,

        isPlainObject: isPlainObject,

        isString: isString,

        isSameOrigin: isSameOrigin,

        isSymbol : isSymbol,

        isUndefined: isUndefined,

        isWindow: isWindow,

        type: type
    });

});
define('skylark-langx-types/main',[
	"./types"
],function(types){
	return types;
});
define('skylark-langx-types', ['skylark-langx-types/main'], function (main) { return main; });

define('skylark-langx-numbers/numbers',[
    "skylark-langx-ns",
    "skylark-langx-types"
],function(skylark,types){
	var isObject = types.isObject,
		isSymbol = types.isSymbol;

	var INFINITY = 1 / 0,
	    MAX_SAFE_INTEGER = 9007199254740991,
	    MAX_INTEGER = 1.7976931348623157e+308,
	    NAN = 0 / 0;

	/** Used to match leading and trailing whitespace. */
	var reTrim = /^\s+|\s+$/g;

	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;

	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;

	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;

	/** Built-in method references without a dependency on `root`. */
	var freeParseInt = parseInt;

	/**
	 * Converts `value` to a finite number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.12.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted number.
	 * @example
	 *
	 * _.toFinite(3.2);
	 * // => 3.2
	 *
	 * _.toFinite(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toFinite(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toFinite('3.2');
	 * // => 3.2
	 */
	function toFinite(value) {
	  if (!value) {
	    return value === 0 ? value : 0;
	  }
	  value = toNumber(value);
	  if (value === INFINITY || value === -INFINITY) {
	    var sign = (value < 0 ? -1 : 1);
	    return sign * MAX_INTEGER;
	  }
	  return value === value ? value : 0;
	}

	/**
	 * Converts `value` to an integer.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
	 *
	 * @static
	 * @memberOf _
	 * @param {*} value The value to convert.
	 * @returns {number} Returns the converted integer.
	 * @example
	 *
	 * _.toInteger(3.2);
	 * // => 3
	 *
	 * _.toInteger(Number.MIN_VALUE);
	 * // => 0
	 *
	 * _.toInteger(Infinity);
	 * // => 1.7976931348623157e+308
	 *
	 * _.toInteger('3.2');
	 * // => 3
	 */
	function toInteger(value) {
	  var result = toFinite(value),
	      remainder = result % 1;

	  return result === result ? (remainder ? result - remainder : result) : 0;
	}	

	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3.2);
	 * // => 3.2
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3.2');
	 * // => 3.2
	 */
	function toNumber(value) {
	  if (typeof value == 'number') {
	    return value;
	  }
	  if (isSymbol(value)) {
	    return NAN;
	  }
	  if (isObject(value)) {
	    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
	    value = isObject(other) ? (other + '') : other;
	  }
	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }
	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return (isBinary || reIsOctal.test(value))
	    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
	    : (reIsBadHex.test(value) ? NAN : +value);
	}

	return  skylark.attach("langx.numbers",{
		toFinite : toFinite,
		toNumber : toNumber,
		toInteger : toInteger
	});
});
define('skylark-langx-numbers/main',[
	"./numbers"
],function(numbers){
	return numbers;
});
define('skylark-langx-numbers', ['skylark-langx-numbers/main'], function (main) { return main; });

define('skylark-langx-objects/objects',[
    "skylark-langx-ns/ns",
    "skylark-langx-ns/_attach",
	"skylark-langx-types",
    "skylark-langx-numbers"
],function(skylark,_attach,types,numbers){
	var hasOwnProperty = Object.prototype.hasOwnProperty,
        slice = Array.prototype.slice,
        isBoolean = types.isBoolean,
        isFunction = types.isFunction,
		isObject = types.isObject,
		isPlainObject = types.isPlainObject,
		isArray = types.isArray,
        isArrayLike = types.isArrayLike,
        isString = types.isString,
        toInteger = numbers.toInteger;

     // An internal function for creating assigner functions.
    function createAssigner(keysFunc, defaults) {
        return function(obj) {
          var length = arguments.length;
          if (defaults) obj = Object(obj);  
          if (length < 2 || obj == null) return obj;
          for (var index = 1; index < length; index++) {
            var source = arguments[index],
                keys = keysFunc(source),
                l = keys.length;
            for (var i = 0; i < l; i++) {
              var key = keys[i];
              if (!defaults || obj[key] === void 0) obj[key] = source[key];
            }
          }
          return obj;
       };
    }

    // Internal recursive comparison function for `isEqual`.
    var eq, deepEq;
    var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

    eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // `null` or `undefined` only equal to itself (strict comparison).
        if (a == null || b == null) return false;
        // `NaN`s are equivalent, but non-reflexive.
        if (a !== a) return b !== b;
        // Exhaust primitive checks
        var type = typeof a;
        if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
        return deepEq(a, b, aStack, bStack);
    };

    // Internal recursive comparison function for `isEqual`.
    deepEq = function(a, b, aStack, bStack) {
        // Unwrap any wrapped objects.
        //if (a instanceof _) a = a._wrapped;
        //if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN.
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
            case '[object Symbol]':
                return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;
            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor &&
                               isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // Deep compare objects.
            var keys = Object.keys(a), key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (Object.keys(b).length !== length) return false;
            while (length--) {
                // Deep compare each member
                key = keys[length];
                if (!(b[key]!==undefined && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return true;
    };

    // Retrieve all the property names of an object.
    function allKeys(obj) {
        if (!isObject(obj)) return [];
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
    }

    function each(obj, callback) {
        var length, key, i, undef, value;

        if (obj) {
            length = obj.length;

            if (length === undef) {
                // Loop object items
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        value = obj[key];
                        if (callback.call(value, key, value) === false) {
                            break;
                        }
                    }
                }
            } else {
                // Loop array items
                for (i = 0; i < length; i++) {
                    value = obj[i];
                    if (callback.call(value, i, value) === false) {
                        break;
                    }
                }
            }
        }

        return this;
    }

    function extend(target) {
        var deep, args = slice.call(arguments, 1);
        if (typeof target == 'boolean') {
            deep = target
            target = args.shift()
        }
        if (args.length == 0) {
            args = [target];
            target = this;
        }
        args.forEach(function(arg) {
            mixin(target, arg, deep);
        });
        return target;
    }

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`.
    function keys(obj) {
        if (isObject(obj)) return [];
        var keys = [];
        for (var key in obj) if (has(obj, key)) keys.push(key);
        return keys;
    }

    function has(obj, path) {
        if (!isArray(path)) {
            return obj != null && hasOwnProperty.call(obj, path);
        }
        var length = path.length;
        for (var i = 0; i < length; i++) {
            var key = path[i];
            if (obj == null || !hasOwnProperty.call(obj, key)) {
                return false;
            }
            obj = obj[key];
        }
        return !!length;
    }

    /**
     * Checks if `value` is in `collection`. If `collection` is a string, it's
     * checked for a substring of `value`, otherwise
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * is used for equality comparisons. If `fromIndex` is negative, it's used as
     * the offset from the end of `collection`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
     * @returns {boolean} Returns `true` if `value` is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'a': 1, 'b': 2 }, 1);
     * // => true
     *
     * _.includes('abcd', 'bc');
     * // => true
     */
    function includes(collection, value, fromIndex, guard) {
      collection = isArrayLike(collection) ? collection : values(collection);
      fromIndex = (fromIndex && !guard) ? toInteger(fromIndex) : 0;

      var length = collection.length;
      if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
      }
      return isString(collection)
        ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
        : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
    }


   // Perform a deep comparison to check if two objects are equal.
    function isEqual(a, b) {
        return eq(a, b);
    }

    // Returns whether an object has a given set of `key:value` pairs.
    function isMatch(object, attrs) {
        var keys = keys(attrs), length = keys.length;
        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
          var key = keys[i];
          if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    }    

    function _mixin(target, source, deep, safe) {
        for (var key in source) {
            //if (!source.hasOwnProperty(key)) {
            //    continue;
            //}
            if (safe && target[key] !== undefined) {
                continue;
            }
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
                    target[key] = {};
                }
                if (isArray(source[key]) && !isArray(target[key])) {
                    target[key] = [];
                }
                _mixin(target[key], source[key], deep, safe);
            } else if (source[key] !== undefined) {
                target[key] = source[key]
            }
        }
        return target;
    }

    function _parseMixinArgs(args) {
        var params = slice.call(arguments, 0),
            target = params.shift(),
            deep = false;
        if (isBoolean(params[params.length - 1])) {
            deep = params.pop();
        }

        return {
            target: target,
            sources: params,
            deep: deep
        };
    }

    function mixin() {
        var args = _parseMixinArgs.apply(this, arguments);

        args.sources.forEach(function(source) {
            _mixin(args.target, source, args.deep, false);
        });
        return args.target;
    }

   // Return a copy of the object without the blacklisted properties.
    function omit(obj, prop1,prop2) {
        if (!obj) {
            return null;
        }
        var result = mixin({},obj);
        for(var i=1;i<arguments.length;i++) {
            var pn = arguments[i];
            if (pn in obj) {
                delete result[pn];
            }
        }
        return result;

    }

   // Return a copy of the object only containing the whitelisted properties.
    function pick(obj,prop1,prop2) {
        if (!obj) {
            return null;
        }
        var result = {};
        for(var i=1;i<arguments.length;i++) {
            var pn = arguments[i];
            if (pn in obj) {
                result[pn] = obj[pn];
            }
        }
        return result;
    }

    function removeItem(items, item) {
        if (isArray(items)) {
            var idx = items.indexOf(item);
            if (idx != -1) {
                items.splice(idx, 1);
            }
        } else if (isPlainObject(items)) {
            for (var key in items) {
                if (items[key] == item) {
                    delete items[key];
                    break;
                }
            }
        }

        return this;
    }

    function result(obj, path, fallback) {
        if (!isArray(path)) {
            path = path.split(".");//[path]
        };
        var length = path.length;
        if (!length) {
          return isFunction(fallback) ? fallback.call(obj) : fallback;
        }
        for (var i = 0; i < length; i++) {
          var prop = obj == null ? void 0 : obj[path[i]];
          if (prop === void 0) {
            prop = fallback;
            i = length; // Ensure we don't continue iterating.
          }
          obj = isFunction(prop) ? prop.call(obj) : prop;
        }

        return obj;
    }

    function safeMixin() {
        var args = _parseMixinArgs.apply(this, arguments);

        args.sources.forEach(function(source) {
            _mixin(args.target, source, args.deep, true);
        });
        return args.target;
    }

    // Retrieve the values of an object's properties.
    function values(obj) {
        var keys = allKeys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    }

    function clone( /*anything*/ src,checkCloneMethod) {
        var copy;
        if (src === undefined || src === null) {
            copy = src;
        } else if (checkCloneMethod && src.clone) {
            copy = src.clone();
        } else if (isArray(src)) {
            copy = [];
            for (var i = 0; i < src.length; i++) {
                copy.push(clone(src[i]));
            }
        } else if (isPlainObject(src)) {
            copy = {};
            for (var key in src) {
                copy[key] = clone(src[key]);
            }
        } else {
            copy = src;
        }

        return copy;

    }

    return skylark.attach("langx.objects",{
        allKeys: allKeys,

        attach : _attach,

        clone: clone,

        defaults : createAssigner(allKeys, true),

        each : each,

        extend : extend,

        has: has,

        isEqual: isEqual,   

        includes: includes,

        isMatch: isMatch,

        keys: keys,

        mixin: mixin,

        omit: omit,

        pick: pick,

        removeItem: removeItem,

        result : result,
        
        safeMixin: safeMixin,

        values: values
    });


});
define('skylark-langx-objects/main',[
	"./objects"
],function(objects){
	return objects;
});
define('skylark-langx-objects', ['skylark-langx-objects/main'], function (main) { return main; });

define('skylark-langx-arrays/arrays',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects"
],function(skylark,types,objects){
	var filter = Array.prototype.filter,
		isArrayLike = types.isArrayLike;

    /**
     * The base implementation of `_.findIndex` and `_.findLastIndex` without
     * support for iteratee shorthands.
     *
     * @param {Array} array The array to inspect.
     * @param {Function} predicate The function invoked per iteration.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 1 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return baseFindIndex(array, baseIsNaN, fromIndex);
      }
      var index = fromIndex - 1,
          length = array.length;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `isNaN` without support for number objects.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     */
    function baseIsNaN(value) {
      return value !== value;
    }


    function compact(array) {
        return filter.call(array, function(item) {
            return item != null;
        });
    }

    function filter2(array,func) {
      return filter.call(array,func);
    }

    function flatten(array) {
        if (isArrayLike(array)) {
            var result = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (isArrayLike(item)) {
                    for (var j = 0; j < item.length; j++) {
                        result.push(item[j]);
                    }
                } else {
                    result.push(item);
                }
            }
            return result;
        } else {
            return array;
        }
        //return array.length > 0 ? concat.apply([], array) : array;
    }

    function grep(array, callback) {
        var out = [];

        objects.each(array, function(i, item) {
            if (callback(item, i)) {
                out.push(item);
            }
        });

        return out;
    }

    function inArray(item, array) {
        if (!array) {
            return -1;
        }
        var i;

        if (array.indexOf) {
            return array.indexOf(item);
        }

        i = array.length;
        while (i--) {
            if (array[i] === item) {
                return i;
            }
        }

        return -1;
    }

    function makeArray(obj, offset, startWith) {
       if (isArrayLike(obj) ) {
        return (startWith || []).concat(Array.prototype.slice.call(obj, offset || 0));
      }

      // array of single index
      return [ obj ];             
    }


    function forEach (arr, fn) {
      if (arr.forEach) return arr.forEach(fn)
      for (var i = 0; i < arr.length; i++) fn(arr[i], i);
    }

    function map(elements, callback) {
        var value, values = [],
            i, key
        if (isArrayLike(elements))
            for (i = 0; i < elements.length; i++) {
                value = callback.call(elements[i], elements[i], i);
                if (value != null) values.push(value)
            }
        else
            for (key in elements) {
                value = callback.call(elements[key], elements[key], key);
                if (value != null) values.push(value)
            }
        return flatten(values)
    }


    function merge( first, second ) {
      var l = second.length,
          i = first.length,
          j = 0;

      if ( typeof l === "number" ) {
        for ( ; j < l; j++ ) {
          first[ i++ ] = second[ j ];
        }
      } else {
        while ( second[j] !== undefined ) {
          first[ i++ ] = second[ j++ ];
        }
      }

      first.length = i;

      return first;
    }

    function reduce(array,callback,initialValue) {
        return Array.prototype.reduce.call(array,callback,initialValue);
    }

    function uniq(array) {
        return filter.call(array, function(item, idx) {
            return array.indexOf(item) == idx;
        })
    }

    return skylark.attach("langx.arrays",{
        baseFindIndex: baseFindIndex,

        baseIndexOf : baseIndexOf,
        
        compact: compact,

        first : function(items,n) {
            if (n) {
                return items.slice(0,n);
            } else {
                return items[0];
            }
        },

        filter : filter2,
        
        flatten: flatten,

        grep: grep,

        inArray: inArray,

        makeArray: makeArray,

        merge : merge,

        forEach : forEach,

        map : map,
        
        reduce : reduce,

        uniq : uniq

    });
});
define('skylark-langx-arrays/main',[
	"./arrays"
],function(arrays){
	return arrays;
});
define('skylark-langx-arrays', ['skylark-langx-arrays/main'], function (main) { return main; });

define('skylark-langx/arrays',[
	"skylark-langx-arrays"
],function(arrays){
  return arrays;
});
define('skylark-langx-klass/klass',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
],function(skylark,types,objects,arrays){
    var uniq = arrays.uniq,
        has = objects.has,
        mixin = objects.mixin,
        isArray = types.isArray,
        isDefined = types.isDefined;

/* for reference 
 function klass(props,parent) {
    var ctor = function(){
        this._construct();
    };
    ctor.prototype = props;
    if (parent) {
        ctor._proto_ = parent;
        props.__proto__ = parent.prototype;
    }
    return ctor;
}

// Type some JavaScript code here.
let animal = klass({
  _construct(){
      this.name = this.name + ",hi";
  },
    
  name: "Animal",
  eat() {         // [[HomeObject]] == animal
    alert(`${this.name} eats.`);
  }
    
    
});


let rabbit = klass({
  name: "Rabbit",
  _construct(){
      super._construct();
  },
  eat() {         // [[HomeObject]] == rabbit
    super.eat();
  }
},animal);

let longEar = klass({
  name: "Long Ear",
  eat() {         // [[HomeObject]] == longEar
    super.eat();
  }
},rabbit);
*/
    
    function inherit(ctor, base) {
        var f = function() {};
        f.prototype = base.prototype;

        ctor.prototype = new f();
    }

    var f1 = function() {
        function extendClass(ctor, props, options) {
            // Copy the properties to the prototype of the class.
            var proto = ctor.prototype,
                _super = ctor.superclass.prototype,
                noOverrided = options && options.noOverrided,
                overrides = options && options.overrides || {};

            for (var name in props) {
                if (name === "constructor") {
                    continue;
                }

                // Check if we're overwriting an existing function
                var prop = props[name];
                if (typeof props[name] == "function") {
                    proto[name] =  !prop._constructor && !noOverrided && typeof _super[name] == "function" ?
                          (function(name, fn, superFn) {
                            return function() {
                                var tmp = this.overrided;

                                // Add a new ._super() method that is the same method
                                // but on the super-class
                                this.overrided = superFn;

                                // The method only need to be bound temporarily, so we
                                // remove it when we're done executing
                                var ret = fn.apply(this, arguments);

                                this.overrided = tmp;

                                return ret;
                            };
                        })(name, prop, _super[name]) :
                        prop;
                } else if (types.isPlainObject(prop) && prop!==null && (prop.get)) {
                    Object.defineProperty(proto,name,prop);
                } else {
                    proto[name] = prop;
                }
            }
            return ctor;
        }

        function serialMixins(ctor,mixins) {
            var result = [];

            mixins.forEach(function(mixin){
                if (has(mixin,"__mixins__")) {
                     throw new Error("nested mixins");
                }
                var clss = [];
                while (mixin) {
                    clss.unshift(mixin);
                    mixin = mixin.superclass;
                }
                result = result.concat(clss);
            });

            result = uniq(result);

            result = result.filter(function(mixin){
                var cls = ctor;
                while (cls) {
                    if (mixin === cls) {
                        return false;
                    }
                    if (has(cls,"__mixins__")) {
                        var clsMixines = cls["__mixins__"];
                        for (var i=0; i<clsMixines.length;i++) {
                            if (clsMixines[i]===mixin) {
                                return false;
                            }
                        }
                    }
                    cls = cls.superclass;
                }
                return true;
            });

            if (result.length>0) {
                return result;
            } else {
                return false;
            }
        }

        function mergeMixins(ctor,mixins) {
            var newCtor =ctor;
            for (var i=0;i<mixins.length;i++) {
                var xtor = new Function();
                xtor.prototype = Object.create(newCtor.prototype);
                xtor.__proto__ = newCtor;
                xtor.superclass = null;
                mixin(xtor.prototype,mixins[i].prototype);
                xtor.prototype.__mixin__ = mixins[i];
                newCtor = xtor;
            }

            return newCtor;
        }

        function _constructor ()  {
            if (this._construct) {
                return this._construct.apply(this, arguments);
            } else  if (this.init) {
                return this.init.apply(this, arguments);
            }
        }

        return function createClass(props, parent, mixins,options) {
            if (isArray(parent)) {
                options = mixins;
                mixins = parent;
                parent = null;
            }
            parent = parent || Object;

            if (isDefined(mixins) && !isArray(mixins)) {
                options = mixins;
                mixins = false;
            }

            var innerParent = parent;

            if (mixins) {
                mixins = serialMixins(innerParent,mixins);
            }

            if (mixins) {
                innerParent = mergeMixins(innerParent,mixins);
            }

            var klassName = props.klassName || "",
                ctor = new Function(
                    "return function " + klassName + "() {" +
                    "var inst = this," +
                    " ctor = arguments.callee;" +
                    "if (!(inst instanceof ctor)) {" +
                    "inst = Object.create(ctor.prototype);" +
                    "}" +
                    "return ctor._constructor.apply(inst, arguments) || inst;" + 
                    "}"
                )();


            // Populate our constructed prototype object
            ctor.prototype = Object.create(innerParent.prototype);

            // Enforce the constructor to be what we expect
            ctor.prototype.constructor = ctor;
            ctor.superclass = parent;

            // And make this class extendable
            ctor.__proto__ = innerParent;


            if (!ctor._constructor) {
                ctor._constructor = _constructor;
            } 

            if (mixins) {
                ctor.__mixins__ = mixins;
            }

            if (!ctor.partial) {
                ctor.partial = function(props, options) {
                    return extendClass(this, props, options);
                };
            }
            if (!ctor.inherit) {
                ctor.inherit = function(props, mixins,options) {
                    return createClass(props, this, mixins,options);
                };
            }

            ctor.partial(props, options);

            return ctor;
        };
    }

    var createClass = f1();

    return skylark.attach("langx.klass",createClass);
});
define('skylark-langx-klass/main',[
	"./klass"
],function(klass){
	return klass;
});
define('skylark-langx-klass', ['skylark-langx-klass/main'], function (main) { return main; });

define('skylark-langx/klass',[
    "skylark-langx-klass"
],function(klass){
    return klass;
});
define('skylark-langx/ArrayStore',[
    "./klass"
],function(klass){
    var SimpleQueryEngine = function(query, options){
        // summary:
        //      Simple query engine that matches using filter functions, named filter
        //      functions or objects by name-value on a query object hash
        //
        // description:
        //      The SimpleQueryEngine provides a way of getting a QueryResults through
        //      the use of a simple object hash as a filter.  The hash will be used to
        //      match properties on data objects with the corresponding value given. In
        //      other words, only exact matches will be returned.
        //
        //      This function can be used as a template for more complex query engines;
        //      for example, an engine can be created that accepts an object hash that
        //      contains filtering functions, or a string that gets evaluated, etc.
        //
        //      When creating a new dojo.store, simply set the store's queryEngine
        //      field as a reference to this function.
        //
        // query: Object
        //      An object hash with fields that may match fields of items in the store.
        //      Values in the hash will be compared by normal == operator, but regular expressions
        //      or any object that provides a test() method are also supported and can be
        //      used to match strings by more complex expressions
        //      (and then the regex's or object's test() method will be used to match values).
        //
        // options: dojo/store/api/Store.QueryOptions?
        //      An object that contains optional information such as sort, start, and count.
        //
        // returns: Function
        //      A function that caches the passed query under the field "matches".  See any
        //      of the "query" methods on dojo.stores.
        //
        // example:
        //      Define a store with a reference to this engine, and set up a query method.
        //
        //  |   var myStore = function(options){
        //  |       //  ...more properties here
        //  |       this.queryEngine = SimpleQueryEngine;
        //  |       //  define our query method
        //  |       this.query = function(query, options){
        //  |           return QueryResults(this.queryEngine(query, options)(this.data));
        //  |       };
        //  |   };

        // create our matching query function
        switch(typeof query){
            default:
                throw new Error("Can not query with a " + typeof query);
            case "object": case "undefined":
                var queryObject = query;
                query = function(object){
                    for(var key in queryObject){
                        var required = queryObject[key];
                        if(required && required.test){
                            // an object can provide a test method, which makes it work with regex
                            if(!required.test(object[key], object)){
                                return false;
                            }
                        }else if(required != object[key]){
                            return false;
                        }
                    }
                    return true;
                };
                break;
            case "string":
                // named query
                if(!this[query]){
                    throw new Error("No filter function " + query + " was found in store");
                }
                query = this[query];
                // fall through
            case "function":
                // fall through
        }
        
        function filter(arr, callback, thisObject){
            // summary:
            //      Returns a new Array with those items from arr that match the
            //      condition implemented by callback.
            // arr: Array
            //      the array to iterate over.
            // callback: Function|String
            //      a function that is invoked with three arguments (item,
            //      index, array). The return of this function is expected to
            //      be a boolean which determines whether the passed-in item
            //      will be included in the returned array.
            // thisObject: Object?
            //      may be used to scope the call to callback
            // returns: Array
            // description:
            //      This function corresponds to the JavaScript 1.6 Array.filter() method, with one difference: when
            //      run over sparse arrays, this implementation passes the "holes" in the sparse array to
            //      the callback function with a value of undefined. JavaScript 1.6's filter skips the holes in the sparse array.
            //      For more details, see:
            //      https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
            // example:
            //  | // returns [2, 3, 4]
            //  | array.filter([1, 2, 3, 4], function(item){ return item>1; });

            // TODO: do we need "Ctr" here like in map()?
            var i = 0, l = arr && arr.length || 0, out = [], value;
            if(l && typeof arr == "string") arr = arr.split("");
            if(typeof callback == "string") callback = cache[callback] || buildFn(callback);
            if(thisObject){
                for(; i < l; ++i){
                    value = arr[i];
                    if(callback.call(thisObject, value, i, arr)){
                        out.push(value);
                    }
                }
            }else{
                for(; i < l; ++i){
                    value = arr[i];
                    if(callback(value, i, arr)){
                        out.push(value);
                    }
                }
            }
            return out; // Array
        }

        function execute(array){
            // execute the whole query, first we filter
            var results = filter(array, query);
            // next we sort
            var sortSet = options && options.sort;
            if(sortSet){
                results.sort(typeof sortSet == "function" ? sortSet : function(a, b){
                    for(var sort, i=0; sort = sortSet[i]; i++){
                        var aValue = a[sort.attribute];
                        var bValue = b[sort.attribute];
                        // valueOf enables proper comparison of dates
                        aValue = aValue != null ? aValue.valueOf() : aValue;
                        bValue = bValue != null ? bValue.valueOf() : bValue;
                        if (aValue != bValue){
                            // modified by lwf 2016/07/09
                            //return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
                            return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
                        }
                    }
                    return 0;
                });
            }
            // now we paginate
            if(options && (options.start || options.count)){
                var total = results.length;
                results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
                results.total = total;
            }
            return results;
        }
        execute.matches = query;
        return execute;
    };

    var QueryResults = function(results){
        // summary:
        //      A function that wraps the results of a store query with additional
        //      methods.
        // description:
        //      QueryResults is a basic wrapper that allows for array-like iteration
        //      over any kind of returned data from a query.  While the simplest store
        //      will return a plain array of data, other stores may return deferreds or
        //      promises; this wrapper makes sure that *all* results can be treated
        //      the same.
        //
        //      Additional methods include `forEach`, `filter` and `map`.
        // results: Array|dojo/promise/Promise
        //      The result set as an array, or a promise for an array.
        // returns:
        //      An array-like object that can be used for iterating over.
        // example:
        //      Query a store and iterate over the results.
        //
        //  |   store.query({ prime: true }).forEach(function(item){
        //  |       //  do something
        //  |   });

        if(!results){
            return results;
        }

        var isPromise = !!results.then;
        // if it is a promise it may be frozen
        if(isPromise){
            results = Object.delegate(results);
        }
        function addIterativeMethod(method){
            // Always add the iterative methods so a QueryResults is
            // returned whether the environment is ES3 or ES5
            results[method] = function(){
                var args = arguments;
                var result = Deferred.when(results, function(results){
                    //Array.prototype.unshift.call(args, results);
                    return QueryResults(Array.prototype[method].apply(results, args));
                });
                // forEach should only return the result of when()
                // when we're wrapping a promise
                if(method !== "forEach" || isPromise){
                    return result;
                }
            };
        }

        addIterativeMethod("forEach");
        addIterativeMethod("filter");
        addIterativeMethod("map");
        if(results.total == null){
            results.total = Deferred.when(results, function(results){
                return results.length;
            });
        }
        return results; // Object
    };

    var ArrayStore = klass({
        "klassName": "ArrayStore",

        "queryEngine": SimpleQueryEngine,
        
        "idProperty": "id",


        get: function(id){
            // summary:
            //      Retrieves an object by its identity
            // id: Number
            //      The identity to use to lookup the object
            // returns: Object
            //      The object in the store that matches the given id.
            return this.data[this.index[id]];
        },

        getIdentity: function(object){
            return object[this.idProperty];
        },

        put: function(object, options){
            var data = this.data,
                index = this.index,
                idProperty = this.idProperty;
            var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
            if(id in index){
                // object exists
                if(options && options.overwrite === false){
                    throw new Error("Object already exists");
                }
                // replace the entry in data
                data[index[id]] = object;
            }else{
                // add the new object
                index[id] = data.push(object) - 1;
            }
            return id;
        },

        add: function(object, options){
            (options = options || {}).overwrite = false;
            // call put with overwrite being false
            return this.put(object, options);
        },

        remove: function(id){
            // summary:
            //      Deletes an object by its identity
            // id: Number
            //      The identity to use to delete the object
            // returns: Boolean
            //      Returns true if an object was removed, falsy (undefined) if no object matched the id
            var index = this.index;
            var data = this.data;
            if(id in index){
                data.splice(index[id], 1);
                // now we have to reindex
                this.setData(data);
                return true;
            }
        },
        query: function(query, options){
            // summary:
            //      Queries the store for objects.
            // query: Object
            //      The query to use for retrieving objects from the store.
            // options: dojo/store/api/Store.QueryOptions?
            //      The optional arguments to apply to the resultset.
            // returns: dojo/store/api/Store.QueryResults
            //      The results of the query, extended with iterative methods.
            //
            // example:
            //      Given the following store:
            //
            //  |   var store = new Memory({
            //  |       data: [
            //  |           {id: 1, name: "one", prime: false },
            //  |           {id: 2, name: "two", even: true, prime: true},
            //  |           {id: 3, name: "three", prime: true},
            //  |           {id: 4, name: "four", even: true, prime: false},
            //  |           {id: 5, name: "five", prime: true}
            //  |       ]
            //  |   });
            //
            //  ...find all items where "prime" is true:
            //
            //  |   var results = store.query({ prime: true });
            //
            //  ...or find all items where "even" is true:
            //
            //  |   var results = store.query({ even: true });
            return QueryResults(this.queryEngine(query, options)(this.data));
        },

        setData: function(data){
            // summary:
            //      Sets the given data as the source for this store, and indexes it
            // data: Object[]
            //      An array of objects to use as the source of data.
            if(data.items){
                // just for convenience with the data format IFRS expects
                this.idProperty = data.identifier || this.idProperty;
                data = this.data = data.items;
            }else{
                this.data = data;
            }
            this.index = {};
            for(var i = 0, l = data.length; i < l; i++){
                this.index[data[i][this.idProperty]] = i;
            }
        },

        init: function(options) {
            for(var i in options){
                this[i] = options[i];
            }
            this.setData(this.data || []);
        }

    });

	return ArrayStore;
});
define('skylark-langx-aspect/aspect',[
    "skylark-langx-ns"
],function(skylark){

  var undefined, nextId = 0;
    function advise(dispatcher, type, advice, receiveArguments){
        var previous = dispatcher[type];
        var around = type == "around";
        var signal;
        if(around){
            var advised = advice(function(){
                return previous.advice(this, arguments);
            });
            signal = {
                remove: function(){
                    if(advised){
                        advised = dispatcher = advice = null;
                    }
                },
                advice: function(target, args){
                    return advised ?
                        advised.apply(target, args) :  // called the advised function
                        previous.advice(target, args); // cancelled, skip to next one
                }
            };
        }else{
            // create the remove handler
            signal = {
                remove: function(){
                    if(signal.advice){
                        var previous = signal.previous;
                        var next = signal.next;
                        if(!next && !previous){
                            delete dispatcher[type];
                        }else{
                            if(previous){
                                previous.next = next;
                            }else{
                                dispatcher[type] = next;
                            }
                            if(next){
                                next.previous = previous;
                            }
                        }

                        // remove the advice to signal that this signal has been removed
                        dispatcher = advice = signal.advice = null;
                    }
                },
                id: nextId++,
                advice: advice,
                receiveArguments: receiveArguments
            };
        }
        if(previous && !around){
            if(type == "after"){
                // add the listener to the end of the list
                // note that we had to change this loop a little bit to workaround a bizarre IE10 JIT bug
                while(previous.next && (previous = previous.next)){}
                previous.next = signal;
                signal.previous = previous;
            }else if(type == "before"){
                // add to beginning
                dispatcher[type] = signal;
                signal.next = previous;
                previous.previous = signal;
            }
        }else{
            // around or first one just replaces
            dispatcher[type] = signal;
        }
        return signal;
    }
    function aspect(type){
        return function(target, methodName, advice, receiveArguments){
            var existing = target[methodName], dispatcher;
            if(!existing || existing.target != target){
                // no dispatcher in place
                target[methodName] = dispatcher = function(){
                    var executionId = nextId;
                    // before advice
                    var args = arguments;
                    var before = dispatcher.before;
                    while(before){
                        args = before.advice.apply(this, args) || args;
                        before = before.next;
                    }
                    // around advice
                    if(dispatcher.around){
                        var results = dispatcher.around.advice(this, args);
                    }
                    // after advice
                    var after = dispatcher.after;
                    while(after && after.id < executionId){
                        if(after.receiveArguments){
                            var newResults = after.advice.apply(this, args);
                            // change the return value only if a new value was returned
                            results = newResults === undefined ? results : newResults;
                        }else{
                            results = after.advice.call(this, results, args);
                        }
                        after = after.next;
                    }
                    return results;
                };
                if(existing){
                    dispatcher.around = {advice: function(target, args){
                        return existing.apply(target, args);
                    }};
                }
                dispatcher.target = target;
            }
            var results = advise((dispatcher || existing), type, advice, receiveArguments);
            advice = null;
            return results;
        };
    }

    return skylark.attach("langx.aspect",{
        after: aspect("after"),
 
        around: aspect("around"),
        
        before: aspect("before")
    });
});
define('skylark-langx-aspect/main',[
	"./aspect"
],function(aspect){
	return aspect;
});
define('skylark-langx-aspect', ['skylark-langx-aspect/main'], function (main) { return main; });

define('skylark-langx/aspect',[
    "skylark-langx-aspect"
],function(aspect){
  return aspect;
});
define('skylark-langx-funcs/funcs',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects"
],function(skylark,types,objects){
	var mixin = objects.mixin,
        slice = Array.prototype.slice,
        isFunction = types.isFunction,
        isString = types.isString;

    function defer(fn) {
        if (requestAnimationFrame) {
            requestAnimationFrame(fn);
        } else {
            setTimeoutout(fn);
        }
        return this;
    }

    function noop() {
    }

    function proxy(fn, context) {
        var args = (2 in arguments) && slice.call(arguments, 2)
        if (isFunction(fn)) {
            var proxyFn = function() {
                return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
            }
            return proxyFn;
        } else if (isString(context)) {
            if (args) {
                args.unshift(fn[context], fn)
                return proxy.apply(null, args)
            } else {
                return proxy(fn[context], fn);
            }
        } else {
            throw new TypeError("expected function");
        }
    }

    function debounce(fn, wait) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                fn.apply(context, args);
            };
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
   
    var delegate = (function() {
        // boodman/crockford delegation w/ cornford optimization
        function TMP() {}
        return function(obj, props) {
            TMP.prototype = obj;
            var tmp = new TMP();
            TMP.prototype = null;
            if (props) {
                mixin(tmp, props);
            }
            return tmp; // Object
        };
    })();

  var templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };


  function template(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = objects.defaults({}, settings,templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

    return skylark.attach("langx.funcs",{
        debounce: debounce,

        delegate: delegate,

        defer: defer,

        noop : noop,

        proxy: proxy,

        returnTrue: function() {
            return true;
        },

        returnFalse: function() {
            return false;
        },

        templateSettings : templateSettings,
        template : template
    });
});
define('skylark-langx-funcs/main',[
	"./funcs"
],function(funcs){
	return funcs;
});
define('skylark-langx-funcs', ['skylark-langx-funcs/main'], function (main) { return main; });

define('skylark-langx-async/Deferred',[
    "skylark-langx-arrays",
	"skylark-langx-funcs",
    "skylark-langx-objects"
],function(arrays,funcs,objects){
    "use strict";
    
    var  PGLISTENERS = Symbol ? Symbol() : '__pglisteners',
         PGNOTIFIES = Symbol ? Symbol() : '__pgnotifies';

    var slice = Array.prototype.slice,
        proxy = funcs.proxy,
        makeArray = arrays.makeArray,
        result = objects.result,
        mixin = objects.mixin;

    mixin(Promise.prototype,{
        always: function(handler) {
            //this.done(handler);
            //this.fail(handler);
            this.then(handler,handler);
            return this;
        },
        done : function() {
            for (var i = 0;i<arguments.length;i++) {
                this.then(arguments[i]);
            }
            return this;
        },
        fail : function(handler) { 
            //return mixin(Promise.prototype.catch.call(this,handler),added);
            //return this.then(null,handler);
            this.catch(handler);
            return this;
         }
    });


    var Deferred = function() {
        var self = this,
            p = this.promise = new Promise(function(resolve, reject) {
                self._resolve = resolve;
                self._reject = reject;
            });

        wrapPromise(p,self);

        this[PGLISTENERS] = [];
        this[PGNOTIFIES] = [];

        //this.resolve = Deferred.prototype.resolve.bind(this);
        //this.reject = Deferred.prototype.reject.bind(this);
        //this.progress = Deferred.prototype.progress.bind(this);

    };

    function wrapPromise(p,d) {
        var   added = {
                state : function() {
                    if (d.isResolved()) {
                        return 'resolved';
                    }
                    if (d.isRejected()) {
                        return 'rejected';
                    }
                    return 'pending';
                },
                then : function(onResolved,onRejected,onProgress) {
                    if (onProgress) {
                        this.progress(onProgress);
                    }
                    return wrapPromise(Promise.prototype.then.call(this,
                            onResolved && function(args) {
                                if (args && args.__ctx__ !== undefined) {
                                    return onResolved.apply(args.__ctx__,args);
                                } else {
                                    return onResolved(args);
                                }
                            },
                            onRejected && function(args){
                                if (args && args.__ctx__ !== undefined) {
                                    return onRejected.apply(args.__ctx__,args);
                                } else {
                                    return onRejected(args);
                                }
                            }));
                },
                progress : function(handler) {
                    d[PGNOTIFIES].forEach(function (value) {
                        handler(value);
                    });
                    d[PGLISTENERS].push(handler);
                    return this;
                }

            };

        added.pipe = added.then;
        return mixin(p,added);

    }

    Deferred.prototype.resolve = function(value) {
        var args = slice.call(arguments);
        return this.resolveWith(null,args);
    };

    Deferred.prototype.resolveWith = function(context,args) {
        args = args ? makeArray(args) : []; 
        args.__ctx__ = context;
        this._resolve(args);
        this._resolved = true;
        return this;
    };

    Deferred.prototype.notify = function(value) {
        try {
            this[PGNOTIFIES].push(value);

            return this[PGLISTENERS].forEach(function (listener) {
                return listener(value);
            });
        } catch (error) {
          this.reject(error);
        }
        return this;
    };

    Deferred.prototype.reject = function(reason) {
        var args = slice.call(arguments);
        return this.rejectWith(null,args);
    };

    Deferred.prototype.rejectWith = function(context,args) {
        args = args ? makeArray(args) : []; 
        args.__ctx__ = context;
        this._reject(args);
        this._rejected = true;
        return this;
    };

    Deferred.prototype.isResolved = function() {
        return !!this._resolved;
    };

    Deferred.prototype.isRejected = function() {
        return !!this._rejected;
    };

    Deferred.prototype.then = function(callback, errback, progback) {
        var p = result(this,"promise");
        return p.then(callback, errback, progback);
    };

    Deferred.prototype.progress = function(progback){
        var p = result(this,"promise");
        return p.progress(progback);
    };
   
    Deferred.prototype.catch = function(errback) {
        var p = result(this,"promise");
        return p.catch(errback);
    };


    Deferred.prototype.done  = function() {
        var p = result(this,"promise");
        return p.done.apply(p,arguments);
    };

    Deferred.prototype.fail = function(errback) {
        var p = result(this,"promise");
        return p.fail(errback);
    };


    Deferred.all = function(array) {
        //return wrapPromise(Promise.all(array));
        var d = new Deferred();
        Promise.all(array).then(d.resolve.bind(d),d.reject.bind(d));
        return result(d,"promise");
    };

    Deferred.first = function(array) {
        return wrapPromise(Promise.race(array));
    };


    Deferred.when = function(valueOrPromise, callback, errback, progback) {
        var receivedPromise = valueOrPromise && typeof valueOrPromise.then === "function";
        var nativePromise = receivedPromise && valueOrPromise instanceof Promise;

        if (!receivedPromise) {
            if (arguments.length > 1) {
                return callback ? callback(valueOrPromise) : valueOrPromise;
            } else {
                return new Deferred().resolve(valueOrPromise);
            }
        } else if (!nativePromise) {
            var deferred = new Deferred(valueOrPromise.cancel);
            valueOrPromise.then(proxy(deferred.resolve,deferred), proxy(deferred.reject,deferred), deferred.notify);
            valueOrPromise = deferred.promise;
        }

        if (callback || errback || progback) {
            return valueOrPromise.then(callback, errback, progback);
        }
        return valueOrPromise;
    };

    Deferred.reject = function(err) {
        var d = new Deferred();
        d.reject(err);
        return d.promise;
    };

    Deferred.resolve = function(data) {
        var d = new Deferred();
        d.resolve.apply(d,arguments);
        return d.promise;
    };

    Deferred.immediate = Deferred.resolve;

    return Deferred;
});
define('skylark-langx-async/async',[
    "skylark-langx-ns",
    "skylark-langx-objects",
    "./Deferred"
],function(skylark,objects,Deferred){
    var each = objects.each;
    
    var async = {
        Deferred : Deferred,

        parallel : function(arr,args,ctx) {
            var rets = [];
            ctx = ctx || null;
            args = args || [];

            each(arr,function(i,func){
                rets.push(func.apply(ctx,args));
            });

            return Deferred.all(rets);
        },

        series : function(arr,args,ctx) {
            var rets = [],
                d = new Deferred(),
                p = d.promise;

            ctx = ctx || null;
            args = args || [];

            d.resolve();
            each(arr,function(i,func){
                p = p.then(function(){
                    return func.apply(ctx,args);
                });
                rets.push(p);
            });

            return Deferred.all(rets);
        },

        waterful : function(arr,args,ctx) {
            var d = new Deferred(),
                p = d.promise;

            ctx = ctx || null;
            args = args || [];

            d.resolveWith(ctx,args);

            each(arr,function(i,func){
                p = p.then(func);
            });
            return p;
        }
    };

	return skylark.attach("langx.async",async);	
});
define('skylark-langx-async/main',[
	"./async"
],function(async){
	return async;
});
define('skylark-langx-async', ['skylark-langx-async/main'], function (main) { return main; });

define('skylark-langx/async',[
    "skylark-langx-async"
],function(async){
    return async;
});
define('skylark-langx-datetimes/datetimes',[
    "skylark-langx-ns"
],function(skylark){
     function parseMilliSeconds(str) {

        var strs = str.split(' ');
        var number = parseInt(strs[0]);

        if (isNaN(number)){
            return 0;
        }

        var min = 60000 * 60;

        switch (strs[1].trim().replace(/\./g, '')) {
            case 'minutes':
            case 'minute':
            case 'min':
            case 'mm':
            case 'm':
                return 60000 * number;
            case 'hours':
            case 'hour':
            case 'HH':
            case 'hh':
            case 'h':
            case 'H':
                return min * number;
            case 'seconds':
            case 'second':
            case 'sec':
            case 'ss':
            case 's':
                return 1000 * number;
            case 'days':
            case 'day':
            case 'DD':
            case 'dd':
            case 'd':
                return (min * 24) * number;
            case 'months':
            case 'month':
            case 'MM':
            case 'M':
                return (min * 24 * 28) * number;
            case 'weeks':
            case 'week':
            case 'W':
            case 'w':
                return (min * 24 * 7) * number;
            case 'years':
            case 'year':
            case 'yyyy':
            case 'yy':
            case 'y':
                return (min * 24 * 365) * number;
            default:
                return 0;
        }
    };
	
	return skylark.attach("langx.datetimes",{
		parseMilliSeconds
	});
});
define('skylark-langx-datetimes/main',[
	"./datetimes"
],function(datetimes){
	return datetimes;
});
define('skylark-langx-datetimes', ['skylark-langx-datetimes/main'], function (main) { return main; });

define('skylark-langx/datetimes',[
    "skylark-langx-datetimes"
],function(datetimes){
    return datetimes;
});
define('skylark-langx/Deferred',[
    "skylark-langx-async/Deferred"
],function(Deferred){
    return Deferred;
});
define('skylark-langx-emitter/Emitter',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "skylark-langx-klass"
],function(skylark,types,objects,arrays,klass){
    var slice = Array.prototype.slice,
        compact = arrays.compact,
        isDefined = types.isDefined,
        isPlainObject = types.isPlainObject,
        isFunction = types.isFunction,
        isString = types.isString,
        isEmptyObject = types.isEmptyObject,
        mixin = objects.mixin,
        safeMixin = objects.safeMixin;

    function parse(event) {
        var segs = ("" + event).split(".");
        return {
            name: segs[0],
            ns: segs.slice(1).join(" ")
        };
    }

    var Emitter = klass({
        on: function(events, selector, data, callback, ctx, /*used internally*/ one) {
            var self = this,
                _hub = this._hub || (this._hub = {});

            if (isPlainObject(events)) {
                ctx = callback;
                each(events, function(type, fn) {
                    self.on(type, selector, data, fn, ctx, one);
                });
                return this;
            }

            if (!isString(selector) && !isFunction(callback)) {
                ctx = callback;
                callback = data;
                data = selector;
                selector = undefined;
            }

            if (isFunction(data)) {
                ctx = callback;
                callback = data;
                data = null;
            }

            if (isString(events)) {
                events = events.split(/\s/)
            }

            events.forEach(function(event) {
                var parsed = parse(event),
                    name = parsed.name,
                    ns = parsed.ns;

                (_hub[name] || (_hub[name] = [])).push({
                    fn: callback,
                    selector: selector,
                    data: data,
                    ctx: ctx,
                    ns : ns,
                    one: one
                });
            });

            return this;
        },

        one: function(events, selector, data, callback, ctx) {
            return this.on(events, selector, data, callback, ctx, 1);
        },

        emit: function(e /*,argument list*/ ) {
            if (!this._hub) {
                return this;
            }

            var self = this;

            if (isString(e)) {
                e = new CustomEvent(e);
            }

            Object.defineProperty(e,"target",{
                value : this
            });

            var args = slice.call(arguments, 1);
            if (isDefined(args)) {
                args = [e].concat(args);
            } else {
                args = [e];
            }
            [e.type || e.name, "all"].forEach(function(eventName) {
                var parsed = parse(eventName),
                    name = parsed.name,
                    ns = parsed.ns;

                var listeners = self._hub[name];
                if (!listeners) {
                    return;
                }

                var len = listeners.length,
                    reCompact = false;

                for (var i = 0; i < len; i++) {
                    var listener = listeners[i];
                    if (ns && (!listener.ns ||  !listener.ns.startsWith(ns))) {
                        continue;
                    }
                    if (e.data) {
                        if (listener.data) {
                            e.data = mixin({}, listener.data, e.data);
                        }
                    } else {
                        e.data = listener.data || null;
                    }
                    listener.fn.apply(listener.ctx, args);
                    if (listener.one) {
                        listeners[i] = null;
                        reCompact = true;
                    }
                }

                if (reCompact) {
                    self._hub[eventName] = compact(listeners);
                }

            });
            return this;
        },

        listened: function(event) {
            var evtArr = ((this._hub || (this._events = {}))[event] || []);
            return evtArr.length > 0;
        },

        listenTo: function(obj, event, callback, /*used internally*/ one) {
            if (!obj) {
                return this;
            }

            // Bind callbacks on obj,
            if (isString(callback)) {
                callback = this[callback];
            }

            if (one) {
                obj.one(event, callback, this);
            } else {
                obj.on(event, callback, this);
            }

            //keep track of them on listening.
            var listeningTo = this._listeningTo || (this._listeningTo = []),
                listening;

            for (var i = 0; i < listeningTo.length; i++) {
                if (listeningTo[i].obj == obj) {
                    listening = listeningTo[i];
                    break;
                }
            }
            if (!listening) {
                listeningTo.push(
                    listening = {
                        obj: obj,
                        events: {}
                    }
                );
            }
            var listeningEvents = listening.events,
                listeningEvent = listeningEvents[event] = listeningEvents[event] || [];
            if (listeningEvent.indexOf(callback) == -1) {
                listeningEvent.push(callback);
            }

            return this;
        },

        listenToOnce: function(obj, event, callback) {
            return this.listenTo(obj, event, callback, 1);
        },

        off: function(events, callback) {
            var _hub = this._hub || (this._hub = {});
            if (isString(events)) {
                events = events.split(/\s/)
            }

            events.forEach(function(event) {
                var parsed = parse(event),
                    name = parsed.name,
                    ns = parsed.ns;

                var evts = _hub[name];

                if (evts) {
                    var liveEvents = [];

                    if (callback || ns) {
                        for (var i = 0, len = evts.length; i < len; i++) {
                            
                            if (callback && evts[i].fn !== callback && evts[i].fn._ !== callback) {
                                liveEvents.push(evts[i]);
                                continue;
                            } 

                            if (ns && (!evts[i].ns || evts[i].ns.indexOf(ns)!=0)) {
                                liveEvents.push(evts[i]);
                                continue;
                            }
                        }
                    }

                    if (liveEvents.length) {
                        _hub[name] = liveEvents;
                    } else {
                        delete _hub[name];
                    }

                }
            });

            return this;
        },
        unlistenTo: function(obj, event, callback) {
            var listeningTo = this._listeningTo;
            if (!listeningTo) {
                return this;
            }
            for (var i = 0; i < listeningTo.length; i++) {
                var listening = listeningTo[i];

                if (obj && obj != listening.obj) {
                    continue;
                }

                var listeningEvents = listening.events;
                for (var eventName in listeningEvents) {
                    if (event && event != eventName) {
                        continue;
                    }

                    var listeningEvent = listeningEvents[eventName];

                    for (var j = 0; j < listeningEvent.length; j++) {
                        if (!callback || callback == listeningEvent[i]) {
                            listening.obj.off(eventName, listeningEvent[i], this);
                            listeningEvent[i] = null;
                        }
                    }

                    listeningEvent = listeningEvents[eventName] = compact(listeningEvent);

                    if (isEmptyObject(listeningEvent)) {
                        listeningEvents[eventName] = null;
                    }

                }

                if (isEmptyObject(listeningEvents)) {
                    listeningTo[i] = null;
                }
            }

            listeningTo = this._listeningTo = compact(listeningTo);
            if (isEmptyObject(listeningTo)) {
                this._listeningTo = null;
            }

            return this;
        },

        trigger  : function() {
            return this.emit.apply(this,arguments);
        }
    });

    Emitter.createEvent = function (type,props) {
        var e = new CustomEvent(type,props);
        return safeMixin(e, props);
    };

    return skylark.attach("langx.Emitter",Emitter);

});
define('skylark-langx-emitter/Evented',[
  "skylark-langx-ns/ns",
	"./Emitter"
],function(skylark,Emitter){
	return skylark.attach("langx.Evented",Emitter);
});
define('skylark-langx-emitter/main',[
	"./Emitter",
	"./Evented"
],function(Emitter){
	return Emitter;
});
define('skylark-langx-emitter', ['skylark-langx-emitter/main'], function (main) { return main; });

define('skylark-langx/Emitter',[
    "skylark-langx-emitter"
],function(Evented){
    return Evented;
});
define('skylark-langx/Evented',[
    "skylark-langx-emitter"
],function(Evented){
    return Evented;
});
define('skylark-langx/funcs',[
    "skylark-langx-funcs"
],function(funcs){
    return funcs;
});
define('skylark-langx-hoster/hoster',[
    "skylark-langx-ns"
],function(skylark){
	// The javascript host environment, brower and nodejs are supported.
	var hoster = {
		"isBrowser" : true, // default
		"isNode" : null,
		"global" : this,
		"browser" : null,
		"node" : null
	};

	if (typeof process == "object" && process.versions && process.versions.node && process.versions.v8) {
		hoster.isNode = true;
		hoster.isBrowser = false;
	}

	hoster.global = (function(){
		if (typeof global !== 'undefined' && typeof global !== 'function') {
			// global spec defines a reference to the global object called 'global'
			// https://github.com/tc39/proposal-global
			// `global` is also defined in NodeJS
			return global;
		} else if (typeof window !== 'undefined') {
			// window is defined in browsers
			return window;
		}
		else if (typeof self !== 'undefined') {
			// self is defined in WebWorkers
			return self;
		}
		return this;
	})();

	var _document = null;

	Object.defineProperty(hoster,"document",function(){
		if (!_document) {
			var w = typeof window === 'undefined' ? require('html-element') : window;
			_document = w.document;
		}

		return _document;
	});

	if (hoster.isBrowser) {
	    function uaMatch( ua ) {
		    ua = ua.toLowerCase();

		    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
		      /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
		      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
		      /(msie) ([\w.]+)/.exec( ua ) ||
		      ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
		      [];

		    return {
		      browser: match[ 1 ] || '',
		      version: match[ 2 ] || '0'
		    };
	  	};

	    var matched = uaMatch( navigator.userAgent );

	    var browser = hoster.browser = {};

	    if ( matched.browser ) {
	      browser[ matched.browser ] = true;
	      browser.version = matched.version;
	    }

	    // Chrome is Webkit, but Webkit is also Safari.
	    if ( browser.chrome ) {
	      browser.webkit = true;
	    } else if ( browser.webkit ) {
	      browser.safari = true;
	    }
	}

	return  skylark.attach("langx.hoster",hoster);
});
define('skylark-langx-hoster/main',[
	"./hoster"
],function(hoster){
	return hoster;
});
define('skylark-langx-hoster', ['skylark-langx-hoster/main'], function (main) { return main; });

define('skylark-langx/hoster',[
	"skylark-langx-hoster"
],function(hoster){
	return hoster;
});
define('skylark-langx/numbers',[
	"skylark-langx-numbers"
],function(numbers){
	return numbers;
});
define('skylark-langx/objects',[
    "skylark-langx-objects"
],function(objects){
    return objects;
});
define('skylark-langx-strings/strings',[
    "skylark-langx-ns"
],function(skylark){
    // add default escape function for escaping HTML entities
    var escapeCharMap = Object.freeze({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
        '=': '&#x3D;',
    });
    function replaceChar(c) {
        return escapeCharMap[c];
    }
    var escapeChars = /[&<>"'`=]/g;


     /*
     * Converts camel case into dashes.
     * @param {String} str
     * @return {String}
     * @exapmle marginTop -> margin-top
     */
    function dasherize(str) {
        return str.replace(/::/g, '/')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .replace(/_/g, '-')
            .toLowerCase();
    }

    function deserializeValue(value) {
        try {
            return value ?
                value == "true" ||
                (value == "false" ? false :
                    value == "null" ? null :
                    +value + "" == value ? +value :
                    /^[\[\{]/.test(value) ? JSON.parse(value) :
                    value) : value;
        } catch (e) {
            return value;
        }
    }

    function escapeHTML(str) {
        if (str == null) {
            return '';
        }
        if (!str) {
            return String(str);
        }

        return str.toString().replace(escapeChars, replaceChar);
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }

    function trim(str) {
        return str == null ? "" : String.prototype.trim.call(str);
    }

    function substitute( /*String*/ template,
        /*Object|Array*/
        map,
        /*Function?*/
        transform,
        /*Object?*/
        thisObject) {
        // summary:
        //    Performs parameterized substitutions on a string. Throws an
        //    exception if any parameter is unmatched.
        // template:
        //    a string with expressions in the form `${key}` to be replaced or
        //    `${key:format}` which specifies a format function. keys are case-sensitive.
        // map:
        //    hash to search for substitutions
        // transform:
        //    a function to process all parameters before substitution takes


        thisObject = thisObject || window;
        transform = transform ?
            proxy(thisObject, transform) : function(v) {
                return v;
            };

        function getObject(key, map) {
            if (key.match(/\./)) {
                var retVal,
                    getValue = function(keys, obj) {
                        var _k = keys.pop();
                        if (_k) {
                            if (!obj[_k]) return null;
                            return getValue(keys, retVal = obj[_k]);
                        } else {
                            return retVal;
                        }
                    };
                return getValue(key.split(".").reverse(), map);
            } else {
                return map[key];
            }
        }

        return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g,
            function(match, key, format) {
                var value = getObject(key, map);
                if (format) {
                    value = getObject(format, thisObject).call(thisObject, value, key);
                }
                return transform(value, key).toString();
            }); // String
    }

    var idCounter = 0;
    function uniqueId (prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    }


    /**
     * https://github.com/cho45/micro-template.js
     * (c) cho45 http://cho45.github.com/mit-license
     */
    function template (id, data) {

        function include(name, args) {
            var stash = {};
            for (var key in template.context.stash) if (template.context.stash.hasOwnProperty(key)) {
                stash[key] = template.context.stash[key];
            }
            if (args) for (var key in args) if (args.hasOwnProperty(key)) {
                stash[key] = args[key];
            }
            var context = template.context;
            context.ret += template(name, stash);
            template.context = context;
        }

        function wrapper(name, fun) {
            var current = template.context.ret;
            template.context.ret = '';
            fun.apply(template.context);
            var content = template.context.ret;
            var orig_content = template.context.stash.content;
            template.context.stash.content = content;
            template.context.ret = current + template(name, template.context.stash);
            template.context.stash.content = orig_content;
        }

        var me = arguments.callee;
        if (!me.cache[id]) me.cache[id] = (function () {
            var name = id, string = /^[\w\-]+$/.test(id) ? me.get(id): (name = 'template(string)', id); // no warnings
            var line = 1, body = (
                "try { " +
                    (me.variable ?  "var " + me.variable + " = this.stash;" : "with (this.stash) { ") +
                        "this.ret += '"  +
                        string.
                            replace(/<%/g, '\x11').replace(/%>/g, '\x13'). // if you want other tag, just edit this line
                            replace(/'(?![^\x11\x13]+?\x13)/g, '\\x27').
                            replace(/^\s*|\s*$/g, '').
                            replace(/\n|\r\n/g, function () { return "';\nthis.line = " + (++line) + "; this.ret += '\\n" }).
                            replace(/\x11=raw(.+?)\x13/g, "' + ($1) + '").
                            replace(/\x11=(.+?)\x13/g, "' + this.escapeHTML($1) + '").
                            replace(/\x11(.+?)\x13/g, "'; $1; this.ret += '") +
                    "'; " + (me.variable ? "" : "}") + "return this.ret;" +
                "} catch (e) { throw 'TemplateError: ' + e + ' (on " + name + "' + ' line ' + this.line + ')'; } " +
                "//@ sourceURL=" + name + "\n" // source map
            ).replace(/this\.ret \+= '';/g, '');
            var func = new Function(body);
            var map  = { '&' : '&amp;', '<' : '&lt;', '>' : '&gt;', '\x22' : '&#x22;', '\x27' : '&#x27;' };
            var escapeHTML = function (string) { return (''+string).replace(/[&<>\'\"]/g, function (_) { return map[_] }) };
            return function (stash) { return func.call(me.context = { escapeHTML: escapeHTML, line: 1, ret : '', stash: stash }) };
        })();
        return data ? me.cache[id](data) : me.cache[id];
    }

    template.cache = {};
    

    template.get = function (id) {
        return document.getElementById(id).innerHTML;
    };

    function rtrim(str) {
        return str.replace(/\s+$/g, '');
    }

    // Slugify a string
    function slugify(str) {
        str = str.replace(/^\s+|\s+$/g, '');

        // Make the string lowercase
        str = str.toLowerCase();

        // Remove accents, swap ñ for n, etc
        var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
        var to   = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        // Remove invalid chars
        //str = str.replace(/[^a-z0-9 -]/g, '') 
        // Collapse whitespace and replace by -
        str = str.replace(/\s+/g, '-') 
        // Collapse dashes
        .replace(/-+/g, '-'); 

        return str;
    }    

    // return boolean if string 'true' or string 'false', or if a parsable string which is a number
    // also supports JSON object and/or arrays parsing
    function toType(str) {
        var type = typeof str;
        if (type !== 'string') {
            return str;
        }
        var nb = parseFloat(str);
        if (!isNaN(nb) && isFinite(str)) {
            return nb;
        }
        if (str === 'false') {
            return false;
        }
        if (str === 'true') {
            return true;
        }

        try {
            str = JSON.parse(str);
        } catch (e) {}

        return str;
    }

	return skylark.attach("langx.strings",{
        camelCase: function(str) {
            return str.replace(/-([\da-z])/g, function(a) {
                return a.toUpperCase().replace('-', '');
            });
        },

        dasherize: dasherize,

        deserializeValue: deserializeValue,

        escapeHTML : escapeHTML,

        generateUUID : generateUUID,

        lowerFirst: function(str) {
            return str.charAt(0).toLowerCase() + str.slice(1);
        },

        rtrim : rtrim,

        serializeValue: function(value) {
            return JSON.stringify(value)
        },


        substitute: substitute,

        slugify : slugify,

        template : template,

        trim: trim,

        uniqueId: uniqueId,

        upperFirst: function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
	}) ; 

});
define('skylark-langx-strings/main',[
	"./strings"
],function(strings){
	return strings;
});
define('skylark-langx-strings', ['skylark-langx-strings/main'], function (main) { return main; });

define('skylark-langx/strings',[
    "skylark-langx-strings"
],function(strings){
    return strings;
});
define('skylark-langx/Stateful',[
	"./Evented",
  "./strings",
  "./objects"
],function(Evented,strings,objects){
    var isEqual = objects.isEqual,
        mixin = objects.mixin,
        result = objects.result,
        isEmptyObject = objects.isEmptyObject,
        clone = objects.clone,
        uniqueId = strings.uniqueId;

    var Stateful = Evented.inherit({
        _construct : function(attributes, options) {
            var attrs = attributes || {};
            options || (options = {});
            this.cid = uniqueId(this.cidPrefix);
            this.attributes = {};
            if (options.collection) this.collection = options.collection;
            if (options.parse) attrs = this.parse(attrs, options) || {};
            var defaults = result(this, 'defaults');
            attrs = mixin({}, defaults, attrs);
            this.set(attrs, options);
            this.changed = {};
        },

        // A hash of attributes whose current and previous value differ.
        changed: null,

        // The value returned during the last failed validation.
        validationError: null,

        // The default name for the JSON `id` attribute is `"id"`. MongoDB and
        // CouchDB users may want to set this to `"_id"`.
        idAttribute: 'id',

        // The prefix is used to create the client id which is used to identify models locally.
        // You may want to override this if you're experiencing name clashes with model ids.
        cidPrefix: 'c',


        // Return a copy of the model's `attributes` object.
        toJSON: function(options) {
          return clone(this.attributes);
        },


        // Get the value of an attribute.
        get: function(attr) {
          return this.attributes[attr];
        },

        // Returns `true` if the attribute contains a value that is not null
        // or undefined.
        has: function(attr) {
          return this.get(attr) != null;
        },

        // Set a hash of model attributes on the object, firing `"change"`. This is
        // the core primitive operation of a model, updating the data and notifying
        // anyone who needs to know about the change in state. The heart of the beast.
        set: function(key, val, options) {
          if (key == null) return this;

          // Handle both `"key", value` and `{key: value}` -style arguments.
          var attrs;
          if (typeof key === 'object') {
            attrs = key;
            options = val;
          } else {
            (attrs = {})[key] = val;
          }

          options || (options = {});

          // Run validation.
          if (!this._validate(attrs, options)) return false;

          // Extract attributes and options.
          var unset      = options.unset;
          var silent     = options.silent;
          var changes    = [];
          var changing   = this._changing;
          this._changing = true;

          if (!changing) {
            this._previousAttributes = clone(this.attributes);
            this.changed = {};
          }

          var current = this.attributes;
          var changed = this.changed;
          var prev    = this._previousAttributes;

          // For each `set` attribute, update or delete the current value.
          for (var attr in attrs) {
            val = attrs[attr];
            if (!isEqual(current[attr], val)) changes.push(attr);
            if (!isEqual(prev[attr], val)) {
              changed[attr] = val;
            } else {
              delete changed[attr];
            }
            unset ? delete current[attr] : current[attr] = val;
          }

          // Update the `id`.
          if (this.idAttribute in attrs) this.id = this.get(this.idAttribute);

          // Trigger all relevant attribute changes.
          if (!silent) {
            if (changes.length) this._pending = options;
            for (var i = 0; i < changes.length; i++) {
              this.trigger('change:' + changes[i], this, current[changes[i]], options);
            }
          }

          // You might be wondering why there's a `while` loop here. Changes can
          // be recursively nested within `"change"` events.
          if (changing) return this;
          if (!silent) {
            while (this._pending) {
              options = this._pending;
              this._pending = false;
              this.trigger('change', this, options);
            }
          }
          this._pending = false;
          this._changing = false;
          return this;
        },

        // Remove an attribute from the model, firing `"change"`. `unset` is a noop
        // if the attribute doesn't exist.
        unset: function(attr, options) {
          return this.set(attr, void 0, mixin({}, options, {unset: true}));
        },

        // Clear all attributes on the model, firing `"change"`.
        clear: function(options) {
          var attrs = {};
          for (var key in this.attributes) attrs[key] = void 0;
          return this.set(attrs, mixin({}, options, {unset: true}));
        },

        // Determine if the model has changed since the last `"change"` event.
        // If you specify an attribute name, determine if that attribute has changed.
        hasChanged: function(attr) {
          if (attr == null) return !isEmptyObject(this.changed);
          return this.changed[attr] !== undefined;
        },

        // Return an object containing all the attributes that have changed, or
        // false if there are no changed attributes. Useful for determining what
        // parts of a view need to be updated and/or what attributes need to be
        // persisted to the server. Unset attributes will be set to undefined.
        // You can also pass an attributes object to diff against the model,
        // determining if there *would be* a change.
        changedAttributes: function(diff) {
          if (!diff) return this.hasChanged() ? clone(this.changed) : false;
          var old = this._changing ? this._previousAttributes : this.attributes;
          var changed = {};
          for (var attr in diff) {
            var val = diff[attr];
            if (isEqual(old[attr], val)) continue;
            changed[attr] = val;
          }
          return !isEmptyObject(changed) ? changed : false;
        },

        // Get the previous value of an attribute, recorded at the time the last
        // `"change"` event was fired.
        previous: function(attr) {
          if (attr == null || !this._previousAttributes) return null;
          return this._previousAttributes[attr];
        },

        // Get all of the attributes of the model at the time of the previous
        // `"change"` event.
        previousAttributes: function() {
          return clone(this._previousAttributes);
        },

        // Create a new model with identical attributes to this one.
        clone: function() {
          return new this.constructor(this.attributes);
        },

        // A model is new if it has never been saved to the server, and lacks an id.
        isNew: function() {
          return !this.has(this.idAttribute);
        },

        // Check if the model is currently in a valid state.
        isValid: function(options) {
          return this._validate({}, mixin({}, options, {validate: true}));
        },

        // Run validation against the next complete set of model attributes,
        // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
        _validate: function(attrs, options) {
          if (!options.validate || !this.validate) return true;
          attrs = mixin({}, this.attributes, attrs);
          var error = this.validationError = this.validate(attrs, options) || null;
          if (!error) return true;
          this.trigger('invalid', this, error, mixin(options, {validationError: error}));
          return false;
        }
    });

	return Stateful;
});
define('skylark-langx-topic/topic',[
	"skylark-langx-ns",
	"skylark-langx-emitter/Evented"
],function(skylark,Evented){
	var hub = new Evented();

	return skylark.attach("langx.topic",{
	    publish: function(name, arg1,argn) {
	        var data = [].slice.call(arguments, 1);

	        return hub.trigger({
	            type : name,
	            data : data
	        });
	    },

        subscribe: function(name, listener,ctx) {
        	var handler = function(e){
                listener.apply(ctx,e.data);
            };
            hub.on(name, handler);
            return {
            	remove : function(){
            		hub.off(name,handler);
            	}
            }

        }

	});
});
define('skylark-langx-topic/main',[
	"./topic"
],function(topic){
	return topic;
});
define('skylark-langx-topic', ['skylark-langx-topic/main'], function (main) { return main; });

define('skylark-langx/topic',[
	"skylark-langx-topic"
],function(topic){
	return topic;
});
define('skylark-langx/types',[
    "skylark-langx-types"
],function(types){
    return types;
});
define('skylark-langx/langx',[
    "./skylark",
    "./arrays",
    "./ArrayStore",
    "./aspect",
    "./async",
    "./datetimes",
    "./Deferred",
    "./Emitter",
    "./Evented",
    "./funcs",
    "./hoster",
    "./klass",
    "./numbers",
    "./objects",
    "./Stateful",
    "./strings",
    "./topic",
    "./types"
], function(skylark,arrays,ArrayStore,aspect,async,datetimes,Deferred,Emitter,Evented,funcs,hoster,klass,numbers,objects,Stateful,strings,topic,types) {
    "use strict";
    var toString = {}.toString,
        concat = Array.prototype.concat,
        indexOf = Array.prototype.indexOf,
        slice = Array.prototype.slice,
        filter = Array.prototype.filter,
        mixin = objects.mixin,
        safeMixin = objects.safeMixin,
        isFunction = types.isFunction;


    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg;
    }

    function getQueryParams(url) {
        var url = url || window.location.href,
            segs = url.split("?"),
            params = {};

        if (segs.length > 1) {
            segs[1].split("&").forEach(function(queryParam) {
                var nv = queryParam.split('=');
                params[nv[0]] = nv[1];
            });
        }
        return params;
    }


    function toPixel(value) {
        // style values can be floats, client code may want
        // to round for integer pixels.
        return parseFloat(value) || 0;
    }


    var _uid = 1;

    function uid(obj) {
        return obj._uid || (obj._uid = _uid++);
    }

    function langx() {
        return langx;
    }

    mixin(langx, {
        createEvent : Emitter.createEvent,

        funcArg: funcArg,

        getQueryParams: getQueryParams,

        toPixel: toPixel,

        uid: uid,

        URL: typeof window !== "undefined" ? window.URL || window.webkitURL : null

    });


    mixin(langx, arrays,aspect,datetimes,funcs,numbers,objects,strings,types,{
        ArrayStore : ArrayStore,

        async : async,
        
        Deferred: Deferred,

        Emitter: Emitter,

        Evented: Evented,

        hoster : hoster,

        klass : klass,
       
        Stateful: Stateful,

        topic : topic
    });

    return skylark.langx = langx;
});
define('skylark-domx-browser/browser',[
    "skylark-langx/skylark",
    "skylark-langx/langx"
], function(skylark,langx) {
    "use strict";

    var browser = langx.hoster.browser;
 
    var checkedCssProperties = {
            "transitionproperty": "TransitionProperty",
        },
        transEndEventNames = {
          WebkitTransition : 'webkitTransitionEnd',
          MozTransition    : 'transitionend',
          OTransition      : 'oTransitionEnd otransitionend',
          transition       : 'transitionend'
        },
        transEndEventName = null;


    var css3PropPrefix = "",
        css3StylePrefix = "",
        css3EventPrefix = "",

        cssStyles = {},
        cssProps = {},

        vendorPrefix,
        vendorPrefixRE,
        vendorPrefixesRE = /^(Webkit|webkit|O|Moz|moz|ms)(.*)$/,

        document = window.document,
        testEl = document.createElement("div"),

        matchesSelector = testEl.webkitMatchesSelector ||
                          testEl.mozMatchesSelector ||
                          testEl.oMatchesSelector ||
                          testEl.matchesSelector,

        requestFullScreen = testEl.requestFullscreen || 
                            testEl.webkitRequestFullscreen || 
                            testEl.mozRequestFullScreen || 
                            testEl.msRequestFullscreen,

        exitFullScreen =  document.exitFullscreen ||
                          document.webkitCancelFullScreen ||
                          document.mozCancelFullScreen ||
                          document.msExitFullscreen,

        testStyle = testEl.style;

    for (var name in testStyle) {
        var matched = name.match(vendorPrefixRE || vendorPrefixesRE);
        if (matched) {
            if (!vendorPrefixRE) {
                vendorPrefix = matched[1];
                vendorPrefixRE = new RegExp("^(" + vendorPrefix + ")(.*)$");

                css3StylePrefix = vendorPrefix;
                css3PropPrefix = '-' + vendorPrefix.toLowerCase() + '-';
                css3EventPrefix = vendorPrefix.toLowerCase();
            }

            cssStyles[langx.lowerFirst(matched[2])] = name;
            var cssPropName = langx.dasherize(matched[2]);
            cssProps[cssPropName] = css3PropPrefix + cssPropName;

            if (transEndEventNames[name]) {
              transEndEventName = transEndEventNames[name];
            }
        }
    }

    if (!transEndEventName) {
        if (testStyle["transition"] !== undefined) {
            transEndEventName = transEndEventNames["transition"];
        }
    }

    function normalizeCssEvent(name) {
        return css3EventPrefix ? css3EventPrefix + name : name.toLowerCase();
    }

    function normalizeCssProperty(name) {
        return cssProps[name] || name;
    }

    function normalizeStyleProperty(name) {
        return cssStyles[name] || name;
    }

    langx.mixin(browser, {
        css3PropPrefix: css3PropPrefix,

        isIE : !!/msie/i.exec( window.navigator.userAgent ),

        normalizeStyleProperty: normalizeStyleProperty,

        normalizeCssProperty: normalizeCssProperty,

        normalizeCssEvent: normalizeCssEvent,

        matchesSelector: matchesSelector,

        requestFullScreen : requestFullScreen,

        exitFullscreen : requestFullScreen,

        location: function() {
            return window.location;
        },

        support : {

        }

    });

    if  (transEndEventName) {
        browser.support.transition = {
            end : transEndEventName
        };
    }

    testEl = null;

    return skylark.attach("domx.browser",browser);
});

define('skylark-domx-browser/main',[
	"./browser"
],function(browser){
	return browser;
});
define('skylark-domx-browser', ['skylark-domx-browser/main'], function (main) { return main; });

define('skylark-domx-noder/noder',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-browser"
], function(skylark, langx, browser) {
    var isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g),
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
        div = document.createElement("div"),
        table = document.createElement('table'),
        tableBody = document.createElement('tbody'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': tableBody,
            'tbody': table,
            'thead': table,
            'tfoot': table,
            'td': tableRow,
            'th': tableRow,
            '*': div
        },
        rootNodeRE = /^(?:body|html)$/i,
        map = Array.prototype.map,
        slice = Array.prototype.slice;

    function ensureNodes(nodes, copyByClone) {
        if (!langx.isArrayLike(nodes)) {
            nodes = [nodes];
        }
        if (copyByClone) {
            nodes = map.call(nodes, function(node) {
                return node.cloneNode(true);
            });
        }
        return langx.flatten(nodes);
    }

    function nodeName(elm, chkName) {
        var name = elm.nodeName && elm.nodeName.toLowerCase();
        if (chkName !== undefined) {
            return name === chkName.toLowerCase();
        }
        return name;
    };


    function activeElement(doc) {
        doc = doc || document;
        var el;

        // Support: IE 9 only
        // IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
        try {
            el = doc.activeElement;
        } catch ( error ) {
            el = doc.body;
        }

        // Support: IE 9 - 11 only
        // IE may return null instead of an element
        // Interestingly, this only seems to occur when NOT in an iframe
        if ( !el ) {
            el = doc.body;
        }

        // Support: IE 11 only
        // IE11 returns a seemingly empty object in some cases when accessing
        // document.activeElement from an <iframe>
        if ( !el.nodeName ) {
            el = doc.body;
        }

        return el;
    };

    function enhancePlaceContent(placing,node) {
        if (langx.isFunction(placing)) {
            return placing.apply(node,[]);
        }
        if (langx.isArrayLike(placing)) {
            var neddsFlattern;
            for (var i=0;i<placing.length;i++) {
                if (langx.isFunction(placing[i])) {
                    placing[i] = placing[i].apply(node,[]);
                    if (langx.isArrayLike(placing[i])) {
                        neddsFlattern = true;
                    }
                }
            }
            if (neddsFlattern) {
                placing = langx.flatten(placing);
            }
        }
        return placing;
    }
    function after(node, placing, copyByClone) {
        placing = enhancePlaceContent(placing,node);
        var refNode = node,
            parent = refNode.parentNode;
        if (parent) {
            var nodes = ensureNodes(placing, copyByClone),
                refNode = refNode.nextSibling;

            for (var i = 0; i < nodes.length; i++) {
                if (refNode) {
                    parent.insertBefore(nodes[i], refNode);
                } else {
                    parent.appendChild(nodes[i]);
                }
            }
        }
        return this;
    }

    function append(node, placing, copyByClone) {
        placing = enhancePlaceContent(placing,node);
        var parentNode = node,
            nodes = ensureNodes(placing, copyByClone);
        for (var i = 0; i < nodes.length; i++) {
            parentNode.appendChild(nodes[i]);
        }
        return this;
    }

    function before(node, placing, copyByClone) {
        placing = enhancePlaceContent(placing,node);
        var refNode = node,
            parent = refNode.parentNode;
        if (parent) {
            var nodes = ensureNodes(placing, copyByClone);
            for (var i = 0; i < nodes.length; i++) {
                parent.insertBefore(nodes[i], refNode);
            }
        }
        return this;
    }
    /*   
     * Get the children of the specified node, including text and comment nodes.
     * @param {HTMLElement} elm
     */
    function contents(elm) {
        if (nodeName(elm, "iframe")) {
            return elm.contentDocument;
        }
        return elm.childNodes;
    }

    /*   
     * Create a element and set attributes on it.
     * @param {HTMLElement} tag
     * @param {props} props
     * @param } parent
     */
    function createElement(tag, props, parent) {
        var node;

        if (/svg/i.test(tag)) {
            node = document.createElementNS("http://www.w3.org/2000/svg", tag)
        } else {
            node = document.createElement(tag);
        }

        if (props) {
            for (var name in props) {
                node.setAttribute(name, props[name]);
            }
        }
        if (parent) {
            append(parent, node);
        }
        return node;
    }

    /*   
     * Create a DocumentFragment from the HTML fragment.
     * @param {String} html
     */
    function createFragment(html) {
        // A special case optimization for a single tag
        html = langx.trim(html);
        if (singleTagRE.test(html)) {
            return [createElement(RegExp.$1)];
        }

        var name = fragmentRE.test(html) && RegExp.$1
        if (!(name in containers)) {
            name = "*"
        }
        var container = containers[name];
        container.innerHTML = "" + html;
        dom = slice.call(container.childNodes);

        dom.forEach(function(node) {
            container.removeChild(node);
        })

        return dom;
    }

    /*   
     * Create a deep copy of the set of matched elements.
     * @param {HTMLElement} node
     * @param {Boolean} deep
     */
    function clone(node, deep) {
        var self = this,
            clone;

        // TODO: Add feature detection here in the future
        if (!isIE || node.nodeType !== 1 || deep) {
            return node.cloneNode(deep);
        }

        // Make a HTML5 safe shallow copy
        if (!deep) {
            clone = document.createElement(node.nodeName);

            // Copy attribs
            each(self.getAttribs(node), function(attr) {
                self.setAttrib(clone, attr.nodeName, self.getAttrib(node, attr.nodeName));
            });

            return clone;
        }
    }

    /*   
     * Check to see if a dom node is a descendant of another dom node .
     * @param {String} node
     * @param {Node} child
     */
    function contains(node, child) {
        return isChildOf(child, node);
    }

    /*   
     * Create a new Text node.
     * @param {String} text
     * @param {Node} child
     */
    function createTextNode(text) {
        return document.createTextNode(text);
    }

    /*   
     * Get the current document object.
     */
    function doc() {
        return document;
    }

    /*   
     * Remove all child nodes of the set of matched elements from the DOM.
     * @param {Object} node
     */
    function empty(node) {
        while (node.hasChildNodes()) {
            var child = node.firstChild;
            node.removeChild(child);
        }
        return this;
    }

    var fulledEl = null;

    function fullScreen(el) {
        if (el === false) {
            browser.exitFullScreen.apply(document);
        } else if (el) {
            browser.requestFullScreen.apply(el);
            fulledEl = el;
        } else {
            return (
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            )
        }
    }


    // Selectors
    function focusable( element, hasTabindex ) {
        var map, mapName, img, focusableIfVisible, fieldset,
            nodeName = element.nodeName.toLowerCase();

        if ( "area" === nodeName ) {
            map = element.parentNode;
            mapName = map.name;
            if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
                return false;
            }
            img = $( "img[usemap='#" + mapName + "']" );
            return img.length > 0 && img.is( ":visible" );
        }

        if ( /^(input|select|textarea|button|object)$/.test( nodeName ) ) {
            focusableIfVisible = !element.disabled;

            if ( focusableIfVisible ) {

                // Form controls within a disabled fieldset are disabled.
                // However, controls within the fieldset's legend do not get disabled.
                // Since controls generally aren't placed inside legends, we skip
                // this portion of the check.
                fieldset = $( element ).closest( "fieldset" )[ 0 ];
                if ( fieldset ) {
                    focusableIfVisible = !fieldset.disabled;
                }
            }
        } else if ( "a" === nodeName ) {
            focusableIfVisible = element.href || hasTabindex;
        } else {
            focusableIfVisible = hasTabindex;
        }

        return focusableIfVisible && $( element ).is( ":visible" ) && visible( $( element ) );
    };


   var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi;
 
    /*   
     * Get the HTML contents of the first element in the set of matched elements.
     * @param {HTMLElement} node
     * @param {String} html
     */
    function html(node, html) {
        if (html === undefined) {
            return node.innerHTML;
        } else {
            this.empty(node);
            html = html || "";
            if (langx.isString(html)) {
                html = html.replace( rxhtmlTag, "<$1></$2>" );
            }
            if (langx.isString(html) || langx.isNumber(html)) {               
                node.innerHTML = html;
            } else if (langx.isArrayLike(html)) {
                for (var i = 0; i < html.length; i++) {
                    node.appendChild(html[i]);
                }
            } else {
                node.appendChild(html);
            }

            return this;
        }
    }


    /*   
     * Check to see if a dom node is a descendant of another dom node.
     * @param {Node} node
     * @param {Node} parent
     * @param {Node} directly
     */
    function isChildOf(node, parent, directly) {
        if (directly) {
            return node.parentNode === parent;
        }
        if (document.documentElement.contains) {
            return parent.contains(node);
        }
        while (node) {
            if (parent === node) {
                return true;
            }

            node = node.parentNode;
        }

        return false;
    }

    /*   
     * Check to see if a dom node is a document.
     * @param {Node} node
     */
    function isDocument(node) {
        return node != null && node.nodeType == node.DOCUMENT_NODE
    }

    /*   
     * Check to see if a dom node is in the document
     * @param {Node} node
     */
    function isInDocument(node) {
      return (node === document.body) ? true : document.body.contains(node);
    }        

    var blockNodes = ["div", "p", "ul", "ol", "li", "blockquote", "hr", "pre", "h1", "h2", "h3", "h4", "h5", "table"];

    function isBlockNode(node) {
        if (!node || node.nodeType === 3) {
          return false;
        }
        return new RegExp("^(" + (blockNodes.join('|')) + ")$").test(node.nodeName.toLowerCase());
    }


    /*   
     * Get the owner document object for the specified element.
     * @param {Node} elm
     */
    function ownerDoc(elm) {
        if (!elm) {
            return document;
        }

        if (elm.nodeType == 9) {
            return elm;
        }

        return elm.ownerDocument;
    }

    /*   
     *
     * @param {Node} elm
     */
    function ownerWindow(elm) {
        var doc = ownerDoc(elm);
        return doc.defaultView || doc.parentWindow;
    }

    /*   
     * insert one or more nodes as the first children of the specified node.
     * @param {Node} node
     * @param {Node or ArrayLike} placing
     * @param {Boolean Optional} copyByClone
     */
    function prepend(node, placing, copyByClone) {
        var parentNode = node,
            refNode = parentNode.firstChild,
            nodes = ensureNodes(placing, copyByClone);
        for (var i = 0; i < nodes.length; i++) {
            if (refNode) {
                parentNode.insertBefore(nodes[i], refNode);
            } else {
                parentNode.appendChild(nodes[i]);
            }
        }
        return this;
    }

    /*   
     *
     * @param {Node} elm
     */
    function offsetParent(elm) {
        var parent = elm.offsetParent || document.body;
        while (parent && !rootNodeRE.test(parent.nodeName) && document.defaultView.getComputedStyle(parent).position == "static") {
            parent = parent.offsetParent;
        }
        return parent;
    }

    /*   
     * Remove the set of matched elements from the DOM.
     * @param {Node} node
     */
    function remove(node) {
        if (node && node.parentNode) {
            try {
                node.parentNode.removeChild(node);
            } catch (e) {
                console.warn("The node is already removed", e);
            }
        }
        return this;
    }

    function removeChild(node,children) {
        if (!langx.isArrayLike(children)) {
            children = [children];
        }
        for (var i=0;i<children.length;i++) {
            node.removeChild(children[i]);
        }

        return this;
    }

    function scrollParent( elm, includeHidden ) {
        var position = document.defaultView.getComputedStyle(elm).position,
            excludeStaticParent = position === "absolute",
            overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
            scrollParent = this.parents().filter( function() {
                var parent = $( this );
                if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
                    return false;
                }
                return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
                    parent.css( "overflow-x" ) );
            } ).eq( 0 );

        return position === "fixed" || !scrollParent.length ?
            $( this[ 0 ].ownerDocument || document ) :
            scrollParent;
    };


    function reflow(elm) {
        if (el == null) {
          elm = document;
        }
        elm.offsetHeight;

        return this;      
    }

    /*   
     * Replace an old node with the specified node.
     * @param {Node} node
     * @param {Node} oldNode
     */
    function replace(node, oldNode) {
        oldNode.parentNode.replaceChild(node, oldNode);
        return this;
    }


    /*   
     * traverse the specified node and its descendants, perform the callback function on each
     * @param {Node} node
     * @param {Function} fn
     */
    function traverse(node, fn) {
        fn(node)
        for (var i = 0, len = node.childNodes.length; i < len; i++) {
            traverse(node.childNodes[i], fn);
        }
        return this;
    }

    /*   
     *
     * @param {Node} node
     */
    function reverse(node) {
        var firstChild = node.firstChild;
        for (var i = node.children.length - 1; i > 0; i--) {
            if (i > 0) {
                var child = node.children[i];
                node.insertBefore(child, firstChild);
            }
        }
    }

    /*   
     * Wrap an HTML structure around each element in the set of matched elements.
     * @param {Node} node
     * @param {Node} wrapperNode
     */
    function wrapper(node, wrapperNode) {
        if (langx.isString(wrapperNode)) {
            wrapperNode = this.createFragment(wrapperNode).firstChild;
        }
        node.parentNode.insertBefore(wrapperNode, node);
        wrapperNode.appendChild(node);
    }

    /*   
     * Wrap an HTML structure around the content of each element in the set of matched
     * @param {Node} node
     * @param {Node} wrapperNode
     */
    function wrapperInner(node, wrapperNode) {
        var childNodes = slice.call(node.childNodes);
        node.appendChild(wrapperNode);
        for (var i = 0; i < childNodes.length; i++) {
            wrapperNode.appendChild(childNodes[i]);
        }
        return this;
    }

    /*   
     * Remove the parents of the set of matched elements from the DOM, leaving the matched
     * @param {Node} node
     */
    function unwrap(node) {
        var child, parent = node.parentNode;
        if (parent) {
            if (this.isDoc(parent.parentNode)) return;
            parent.parentNode.insertBefore(node, parent);
        }
    }

    function noder() {
        return noder;
    }

    langx.mixin(noder, {
        active  : activeElement,

        blur : function(el) {
            el.blur();
        },

        body: function() {
            return document.body;
        },

        clone: clone,
        contents: contents,

        createElement: createElement,

        createFragment: createFragment,

        contains: contains,

        createTextNode: createTextNode,

        doc: doc,

        empty: empty,

        fullScreen: fullScreen,

        focusable: focusable,

        html: html,

        isChildOf: isChildOf,

        isDocument: isDocument,

        isInDocument: isInDocument,

        isWindow: langx.isWindow,

        nodeName : nodeName,

        offsetParent: offsetParent,

        ownerDoc: ownerDoc,

        ownerWindow: ownerWindow,

        after: after,

        before: before,

        prepend: prepend,

        append: append,

        reflow: reflow,

        remove: remove,

        removeChild : removeChild,

        replace: replace,

        traverse: traverse,

        reverse: reverse,

        wrapper: wrapper,

        wrapperInner: wrapperInner,

        unwrap: unwrap
    });

    return skylark.attach("domx.noder" , noder);
});
define('skylark-domx-noder/main',[
	"./noder"
],function(noder){
	return noder;
});
define('skylark-domx-noder', ['skylark-domx-noder/main'], function (main) { return main; });

define('skylark-domx-finder/finder',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-browser",
    "skylark-domx-noder"
], function(skylark, langx, browser, noder) {
    var local = {},
        filter = Array.prototype.filter,
        slice = Array.prototype.slice,
        nativeMatchesSelector = browser.matchesSelector;

    /*
    ---
    name: Slick.Parser
    description: Standalone CSS3 Selector parser
    provides: Slick.Parser
    ...
    */
    ;
    (function() {

        var parsed,
            separatorIndex,
            combinatorIndex,
            reversed,
            cache = {},
            reverseCache = {},
            reUnescape = /\\/g;

        var parse = function(expression, isReversed) {
            if (expression == null) return null;
            if (expression.Slick === true) return expression;
            expression = ('' + expression).replace(/^\s+|\s+$/g, '');
            reversed = !!isReversed;
            var currentCache = (reversed) ? reverseCache : cache;
            if (currentCache[expression]) return currentCache[expression];
            parsed = {
                Slick: true,
                expressions: [],
                raw: expression,
                reverse: function() {
                    return parse(this.raw, true);
                }
            };
            separatorIndex = -1;
            while (expression != (expression = expression.replace(regexp, parser)));
            parsed.length = parsed.expressions.length;
            return currentCache[parsed.raw] = (reversed) ? reverse(parsed) : parsed;
        };

        var reverseCombinator = function(combinator) {
            if (combinator === '!') return ' ';
            else if (combinator === ' ') return '!';
            else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
            else return '!' + combinator;
        };

        var reverse = function(expression) {
            var expressions = expression.expressions;
            for (var i = 0; i < expressions.length; i++) {
                var exp = expressions[i];
                var last = {
                    parts: [],
                    tag: '*',
                    combinator: reverseCombinator(exp[0].combinator)
                };

                for (var j = 0; j < exp.length; j++) {
                    var cexp = exp[j];
                    if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
                    cexp.combinator = cexp.reverseCombinator;
                    delete cexp.reverseCombinator;
                }

                exp.reverse().push(last);
            }
            return expression;
        };

        var escapeRegExp = (function() {
            // Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
            var from = /(?=[\-\[\]{}()*+?.\\\^$|,#\s])/g,
                to = '\\';
            return function(string) {
                return string.replace(from, to)
            }
        }())

        var regexp = new RegExp(
            "^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|(:+)(<unicode>+)(?:\\((?:(?:([\"'])([^\\13]*)\\13)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
            .replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
            .replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
            .replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
        );

        function parser(
            rawMatch,

            separator,
            combinator,
            combinatorChildren,

            tagName,
            id,
            className,

            attributeKey,
            attributeOperator,
            attributeQuote,
            attributeValue,

            pseudoMarker,
            pseudoClass,
            pseudoQuote,
            pseudoClassQuotedValue,
            pseudoClassValue
        ) {
            if (separator || separatorIndex === -1) {
                parsed.expressions[++separatorIndex] = [];
                combinatorIndex = -1;
                if (separator) return '';
            }

            if (combinator || combinatorChildren || combinatorIndex === -1) {
                combinator = combinator || ' ';
                var currentSeparator = parsed.expressions[separatorIndex];
                if (reversed && currentSeparator[combinatorIndex])
                    currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
                currentSeparator[++combinatorIndex] = {
                    combinator: combinator,
                    tag: '*'
                };
            }

            var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

            if (tagName) {
                currentParsed.tag = tagName.replace(reUnescape, '');

            } else if (id) {
                currentParsed.id = id.replace(reUnescape, '');

            } else if (className) {
                className = className.replace(reUnescape, '');

                if (!currentParsed.classList) currentParsed.classList = [];
                if (!currentParsed.classes) currentParsed.classes = [];
                currentParsed.classList.push(className);
                currentParsed.classes.push({
                    value: className,
                    regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
                });

            } else if (pseudoClass) {
                pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
                pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

                if (!currentParsed.pseudos) currentParsed.pseudos = [];
                currentParsed.pseudos.push({
                    key: pseudoClass.replace(reUnescape, ''),
                    value: pseudoClassValue,
                    type: pseudoMarker.length == 1 ? 'class' : 'element'
                });

            } else if (attributeKey) {
                attributeKey = attributeKey.replace(reUnescape, '');
                attributeValue = (attributeValue || '').replace(reUnescape, '');

                var test, regexp;

                switch (attributeOperator) {
                    case '^=':
                        regexp = new RegExp('^' + escapeRegExp(attributeValue));
                        break;
                    case '$=':
                        regexp = new RegExp(escapeRegExp(attributeValue) + '$');
                        break;
                    case '~=':
                        regexp = new RegExp('(^|\\s)' + escapeRegExp(attributeValue) + '(\\s|$)');
                        break;
                    case '|=':
                        regexp = new RegExp('^' + escapeRegExp(attributeValue) + '(-|$)');
                        break;
                    case '=':
                        test = function(value) {
                            return attributeValue == value;
                        };
                        break;
                    case '*=':
                        test = function(value) {
                            return value && value.indexOf(attributeValue) > -1;
                        };
                        break;
                    case '!=':
                        test = function(value) {
                            return attributeValue != value;
                        };
                        break;
                    default:
                        test = function(value) {
                            return !!value;
                        };
                }

                if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function() {
                    return false;
                };

                if (!test) test = function(value) {
                    return value && regexp.test(value);
                };

                if (!currentParsed.attributes) currentParsed.attributes = [];
                currentParsed.attributes.push({
                    key: attributeKey,
                    operator: attributeOperator,
                    value: attributeValue,
                    test: test
                });

            }

            return '';
        };

        // Slick NS

        var Slick = (this.Slick || {});

        Slick.parse = function(expression) {
            return parse(expression);
        };

        Slick.escapeRegExp = escapeRegExp;

        if (!this.Slick) this.Slick = Slick;

    }).apply(local);


    var simpleClassSelectorRE = /^\.([\w-]*)$/,
        simpleIdSelectorRE = /^#([\w-]*)$/,
        rinputs = /^(?:input|select|textarea|button)$/i,
        rheader = /^h\d$/i,
        slice = Array.prototype.slice;


    local.parseSelector = local.Slick.parse;


    var pseudos = local.pseudos = {
        // custom pseudos
        "button": function(elem) {
            var name = elem.nodeName.toLowerCase();
            return name === "input" && elem.type === "button" || name === "button";
        },

        'checked': function(elm) {
            return !!elm.checked;
        },

        'contains': function(elm, idx, nodes, text) {
            if ($(this).text().indexOf(text) > -1) return this
        },

        'disabled': function(elm) {
            return !!elm.disabled;
        },

        'enabled': function(elm) {
            return !elm.disabled;
        },

        'eq': function(elm, idx, nodes, value) {
            return (idx == value);
        },

        'even': function(elm, idx, nodes, value) {
            return (idx % 2) === 0;
        },

        'focus': function(elm) {
            return document.activeElement === elm && (elm.href || elm.type || elm.tabindex);
        },

        'focusable': function( elm ) {
            return noder.focusable(elm, elm.tabindex != null );
        },

        'first': function(elm, idx) {
            return (idx === 0);
        },

        'gt': function(elm, idx, nodes, value) {
            return (idx > value);
        },

        'has': function(elm, idx, nodes, sel) {
            return find(elm, sel);
        },

        // Element/input types
        "header": function(elem) {
            return rheader.test(elem.nodeName);
        },

        'hidden': function(elm) {
            return !local.pseudos["visible"](elm);
        },

        "input": function(elem) {
            return rinputs.test(elem.nodeName);
        },

        'last': function(elm, idx, nodes) {
            return (idx === nodes.length - 1);
        },

        'lt': function(elm, idx, nodes, value) {
            return (idx < value);
        },

        'not': function(elm, idx, nodes, sel) {
            return !matches(elm, sel);
        },

        'odd': function(elm, idx, nodes, value) {
            return (idx % 2) === 1;
        },

        /*   
         * Get the parent of each element in the current set of matched elements.
         * @param {Object} elm
         */
        'parent': function(elm) {
            return !!elm.parentNode;
        },

        'selected': function(elm) {
            return !!elm.selected;
        },

        'tabbable': function(elm) {
            var tabIndex = elm.tabindex,
                hasTabindex = tabIndex != null;
            return ( !hasTabindex || tabIndex >= 0 ) && noder.focusable( element, hasTabindex );
        },

        'text': function(elm) {
            return elm.type === "text";
        },

        'visible': function(elm) {
            return elm.offsetWidth && elm.offsetWidth
        },
        'empty': function(elm) {
            return !elm.hasChildNodes();
        }
    };

    ["first", "eq", "last"].forEach(function(item) {
        pseudos[item].isArrayFilter = true;
    });



    pseudos["nth"] = pseudos["eq"];

    function createInputPseudo(type) {
        return function(elem) {
            var name = elem.nodeName.toLowerCase();
            return name === "input" && elem.type === type;
        };
    }

    function createButtonPseudo(type) {
        return function(elem) {
            var name = elem.nodeName.toLowerCase();
            return (name === "input" || name === "button") && elem.type === type;
        };
    }

    // Add button/input type pseudos
    for (i in {
        radio: true,
        checkbox: true,
        file: true,
        password: true,
        image: true
    }) {
        pseudos[i] = createInputPseudo(i);
    }
    for (i in {
        submit: true,
        reset: true
    }) {
        pseudos[i] = createButtonPseudo(i);
    }


    local.divide = function(cond) {
        var nativeSelector = "",
            customPseudos = [],
            tag,
            id,
            classes,
            attributes,
            pseudos;


        if (id = cond.id) {
            nativeSelector += ("#" + id);
        }
        if (classes = cond.classes) {
            for (var i = classes.length; i--;) {
                nativeSelector += ("." + classes[i].value);
            }
        }
        if (attributes = cond.attributes) {
            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].operator) {
                    nativeSelector += ("[" + attributes[i].key + attributes[i].operator + JSON.stringify(attributes[i].value) + "]");
                } else {
                    nativeSelector += ("[" + attributes[i].key + "]");
                }
            }
        }
        if (pseudos = cond.pseudos) {
            for (i = pseudos.length; i--;) {
                part = pseudos[i];
                if (this.pseudos[part.key]) {
                    customPseudos.push(part);
                } else {
                    if (part.value !== undefined) {
                        nativeSelector += (":" + part.key + "(" + JSON.stringify(part))
                    }
                }
            }
        }

        if (tag = cond.tag) {
            if (tag !== "*") {
                nativeSelector = tag.toUpperCase() + nativeSelector;
            }
        }

        if (!nativeSelector) {
            nativeSelector = "*";
        }

        return {
            nativeSelector: nativeSelector,
            customPseudos: customPseudos
        }

    };

    local.check = function(node, cond, idx, nodes, arrayFilte) {
        var tag,
            id,
            classes,
            attributes,
            pseudos,

            i, part, cls, pseudo;

        if (!arrayFilte) {
            if (tag = cond.tag) {
                var nodeName = node.nodeName.toUpperCase();
                if (tag == '*') {
                    if (nodeName < '@') return false; // Fix for comment nodes and closed nodes
                } else {
                    if (nodeName != (tag || "").toUpperCase()) return false;
                }
            }

            if (id = cond.id) {
                if (node.getAttribute('id') != id) {
                    return false;
                }
            }


            if (classes = cond.classes) {
                for (i = classes.length; i--;) {
                    cls = node.getAttribute('class');
                    if (!(cls && classes[i].regexp.test(cls))) return false;
                }
            }

            if (attributes = cond.attributes) {
                for (i = attributes.length; i--;) {
                    part = attributes[i];
                    if (part.operator ? !part.test(node.getAttribute(part.key)) : !node.hasAttribute(part.key)) return false;
                }
            }

        }
        if (pseudos = cond.pseudos) {
            for (i = pseudos.length; i--;) {
                part = pseudos[i];
                if (pseudo = this.pseudos[part.key]) {
                    if ((arrayFilte && pseudo.isArrayFilter) || (!arrayFilte && !pseudo.isArrayFilter)) {
                        if (!pseudo(node, idx, nodes, part.value)) {
                            return false;
                        }
                    }
                } else {
                    if (!arrayFilte && !nativeMatchesSelector.call(node, part.key)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    local.match = function(node, selector) {

        var parsed;

        if (langx.isString(selector)) {
            parsed = local.Slick.parse(selector);
        } else {
            parsed = selector;
        }

        if (!parsed) {
            return true;
        }

        // simple (single) selectors
        var expressions = parsed.expressions,
            simpleExpCounter = 0,
            i,
            currentExpression;
        for (i = 0;
            (currentExpression = expressions[i]); i++) {
            if (currentExpression.length == 1) {
                var exp = currentExpression[0];
                if (this.check(node, exp)) {
                    return true;
                }
                simpleExpCounter++;
            }
        }

        if (simpleExpCounter == parsed.length) {
            return false;
        }

        var nodes = this.query(document, parsed),
            item;
        for (i = 0; item = nodes[i++];) {
            if (item === node) {
                return true;
            }
        }
        return false;
    };


    local.filterSingle = function(nodes, exp) {
        var matchs = filter.call(nodes, function(node, idx) {
            return local.check(node, exp, idx, nodes, false);
        });

        matchs = filter.call(matchs, function(node, idx) {
            return local.check(node, exp, idx, matchs, true);
        });
        return matchs;
    };

    local.filter = function(nodes, selector) {
        var parsed;

        if (langx.isString(selector)) {
            parsed = local.Slick.parse(selector);
        } else {
            return local.filterSingle(nodes, selector);
        }

        // simple (single) selectors
        var expressions = parsed.expressions,
            i,
            currentExpression,
            ret = [];
        for (i = 0;
            (currentExpression = expressions[i]); i++) {
            if (currentExpression.length == 1) {
                var exp = currentExpression[0];

                var matchs = local.filterSingle(nodes, exp);

                ret = langx.uniq(ret.concat(matchs));
            } else {
                throw new Error("not supported selector:" + selector);
            }
        }

        return ret;

    };

    local.combine = function(elm, bit) {
        var op = bit.combinator,
            cond = bit,
            node1,
            nodes = [];

        switch (op) {
            case '>': // direct children
                nodes = children(elm, cond);
                break;
            case '+': // next sibling
                node1 = nextSibling(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '^': // first child
                node1 = firstChild(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '~': // next siblings
                nodes = nextSiblings(elm, cond);
                break;
            case '++': // next sibling and previous sibling
                var prev = previousSibling(elm, cond, true),
                    next = nextSibling(elm, cond, true);
                if (prev) {
                    nodes.push(prev);
                }
                if (next) {
                    nodes.push(next);
                }
                break;
            case '~~': // next siblings and previous siblings
                nodes = siblings(elm, cond);
                break;
            case '!': // all parent nodes up to document
                nodes = ancestors(elm, cond);
                break;
            case '!>': // direct parent (one level)
                node1 = parent(elm, cond);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '!+': // previous sibling
                nodes = previousSibling(elm, cond, true);
                break;
            case '!^': // last child
                node1 = lastChild(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '!~': // previous siblings
                nodes = previousSiblings(elm, cond);
                break;
            default:
                var divided = this.divide(bit);
                nodes = slice.call(elm.querySelectorAll(divided.nativeSelector));
                if (divided.customPseudos) {
                    for (var i = divided.customPseudos.length - 1; i >= 0; i--) {
                        nodes = filter.call(nodes, function(item, idx) {
                            return local.check(item, {
                                pseudos: [divided.customPseudos[i]]
                            }, idx, nodes, false)
                        });

                        nodes = filter.call(nodes, function(item, idx) {
                            return local.check(item, {
                                pseudos: [divided.customPseudos[i]]
                            }, idx, nodes, true)
                        });
                    }
                }
                break;

        }
        return nodes;
    }

    local.query = function(node, selector, single) {


        var parsed = this.Slick.parse(selector);

        var
            founds = [],
            currentExpression, currentBit,
            expressions = parsed.expressions;

        for (var i = 0;
            (currentExpression = expressions[i]); i++) {
            var currentItems = [node],
                found;
            for (var j = 0;
                (currentBit = currentExpression[j]); j++) {
                found = langx.map(currentItems, function(item, i) {
                    return local.combine(item, currentBit)
                });
                if (found) {
                    currentItems = found;
                }
            }
            if (found) {
                founds = founds.concat(found);
            }
        }

        return founds;
    }

    /*
     * Get the nearest ancestor of the specified element,optional matched by a selector.
     * @param {HTMLElement} node
     * @param {String Optional } selector
     * @param {Object} root
     */
    function ancestor(node, selector, root) {
        var rootIsSelector = root && langx.isString(root);
        while (node = node.parentNode) {
            if (matches(node, selector)) {
                return node;
            }
            if (root) {
                if (rootIsSelector) {
                    if (matches(node, root)) {
                        break;
                    }
                } else if (node == root) {
                    break;
                }
            }
        }
        return null;
    }

    /*
     * Get the ancestors of the specitied element , optionally filtered by a selector.
     * @param {HTMLElement} node
     * @param {String Optional } selector
     * @param {Object} root
     */
    function ancestors(node, selector, root) {
        var ret = [],
            rootIsSelector = root && langx.isString(root);
        while ((node = node.parentNode) && (node.nodeType !== 9)) {
            if (root) {
                if (rootIsSelector) {
                    if (matches(node, root)) {
                        break;
                    }
                } else if (langx.isArrayLike(root)) {
                    if (langx.inArray(node,root)>-1) {
                        break;
                    }
                } else if (node == root) {
                    break;
                }
            }
            ret.push(node); // TODO
        }

        if (selector) {
            ret = local.filter(ret, selector);
        }
        return ret;
    }

    /*
     * Returns a element by its ID.
     * @param {string} id
     */
    function byId(id, doc) {
        doc = doc || noder.doc();
        return doc.getElementById(id);
    }

    /*
     * Get the children of the specified element , optionally filtered by a selector.
     * @param {string} node
     * @param {String optionlly} selector
     */
    function children(node, selector) {
        var childNodes = node.childNodes,
            ret = [];
        for (var i = 0; i < childNodes.length; i++) {
            var node = childNodes[i];
            if (node.nodeType == 1) {
                ret.push(node);
            }
        }
        if (selector) {
            ret = local.filter(ret, selector);
        }
        return ret;
    }

    function closest(node, selector) {
        while (node && !(matches(node, selector))) {
            node = node.parentNode;
        }

        return node;
    }

    /*
     * Get the decendant of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function descendants(elm, selector) {
        // Selector
        try {
            return slice.call(elm.querySelectorAll(selector));
        } catch (matchError) {
            //console.log(matchError);
        }
        return local.query(elm, selector);
    }

    /*
     * Get the nearest decendent of the specified element,optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function descendant(elm, selector) {
        // Selector
        try {
            return elm.querySelector(selector);
        } catch (matchError) {
            //console.log(matchError);
        }
        var nodes = local.query(elm, selector);
        if (nodes.length > 0) {
            return nodes[0];
        } else {
            return null;
        }
    }

    /*
     * Get the descendants of each element in the current set of matched elements, filtered by a selector, jQuery object, or element.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function find(elm, selector) {
        if (!selector) {
            selector = elm;
            elm = document.body;
        }
        if (matches(elm, selector)) {
            return elm;
        } else {
            return descendant(elm, selector);
        }
    }

    /*
     * Get the findAll of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function findAll(elm, selector) {
        if (!selector) {
            selector = elm;
            elm = document.body;
        }
        return descendants(elm, selector);
    }

    /*
     * Get the first child of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {String} first
     */
    function firstChild(elm, selector, first) {
        var childNodes = elm.childNodes,
            node = childNodes[0];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (first) {
                    break;
                }
            }
            node = node.nextSibling;
        }

        return null;
    }

    /*
     * Get the last child of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {String } last
     */
    function lastChild(elm, selector, last) {
        var childNodes = elm.childNodes,
            node = childNodes[childNodes.length - 1];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (last) {
                    break;
                }
            }
            node = node.previousSibling;
        }

        return null;
    }

    /*
     * Check the specified element against a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function matches(elm, selector) {
        if (!selector || !elm || elm.nodeType !== 1) {
            return false
        }

        if (langx.isString(selector)) {
            try {
                return nativeMatchesSelector.call(elm, selector.replace(/\[([^=]+)=\s*([^'"\]]+?)\s*\]/g, '[$1="$2"]'));
            } catch (matchError) {
                //console.log(matchError);
            }
            return local.match(elm, selector);
        } else if (langx.isArrayLike(selector)) {
            return langx.inArray(elm, selector) > -1;
        } else if (langx.isPlainObject(selector)) {
            return local.check(elm, selector);
        } else {
            return elm === selector;
        }

    }

    /*
     * Get the nearest next sibing of the specitied element , optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {Boolean Optional} adjacent
     */
    function nextSibling(elm, selector, adjacent) {
        var node = elm.nextSibling;
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (adjacent) {
                    break;
                }
            }
            node = node.nextSibling;
        }
        return null;
    }

    /*
     * Get the next siblings of the specified element , optional filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function nextSiblings(elm, selector) {
        var node = elm.nextSibling,
            ret = [];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.nextSibling;
        }
        return ret;
    }

    /*
     * Get the parent element of the specified element. if a selector is provided, it retrieves the parent element only if it matches that selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function parent(elm, selector) {
        var node = elm.parentNode;
        if (node && (!selector || matches(node, selector))) {
            return node;
        }

        return null;
    }

    /*
     * Get hte nearest previous sibling of the specified element ,optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {Boolean Optional } adjacent
     */
    function previousSibling(elm, selector, adjacent) {
        var node = elm.previousSibling;
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (adjacent) {
                    break;
                }
            }
            node = node.previousSibling;
        }
        return null;
    }

    /*
     * Get all preceding siblings of each element in the set of matched elements, optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function previousSiblings(elm, selector) {
        var node = elm.previousSibling,
            ret = [];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.previousSibling;
        }
        return ret;
    }

    /*
     * Selects all sibling elements that follow after the “prev” element, have the same parent, and match the filtering “siblings” selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function siblings(elm, selector) {
        var node = elm.parentNode.firstChild,
            ret = [];
        while (node) {
            if (node.nodeType == 1 && node !== elm) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.nextSibling;
        }
        return ret;
    }

    var finder = function() {
        return finder;
    };

    langx.mixin(finder, {

        ancestor: ancestor,

        ancestors: ancestors,

        byId: byId,

        children: children,

        closest: closest,

        descendant: descendant,

        descendants: descendants,

        find: find,

        findAll: findAll,

        firstChild: firstChild,

        lastChild: lastChild,

        matches: matches,

        nextSibling: nextSibling,

        nextSiblings: nextSiblings,

        parent: parent,

        previousSibling,

        previousSiblings,

        pseudos: local.pseudos,

        siblings: siblings
    });

    return skylark.attach("domx.finder", finder);
});
define('skylark-domx-finder/main',[
	"./finder"
],function(finder){

	return finder;
});
define('skylark-domx-finder', ['skylark-domx-finder/main'], function (main) { return main; });

define('skylark-domx-data/data',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-finder",
    "skylark-domx-noder"
], function(skylark, langx, finder,noder) {
    var map = Array.prototype.map,
        filter = Array.prototype.filter,
        camelCase = langx.camelCase,
        deserializeValue = langx.deserializeValue,

        capitalRE = /([A-Z])/g,
        propMap = {
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'for': 'htmlFor',
            'class': 'className',
            'maxlength': 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'usemap': 'useMap',
            'frameborder': 'frameBorder',
            'contenteditable': 'contentEditable'
        };

    // Strip and collapse whitespace according to HTML spec
    function stripAndCollapse( value ) {
      var tokens = value.match( /[^\x20\t\r\n\f]+/g ) || [];
      return tokens.join( " " );
    }


    var valHooks = {
      option: {
        get: function( elem ) {
          var val = elem.getAttribute( "value" );
          return val != null ?  val :  stripAndCollapse(text( elem ) );
        }
      },
      select: {
        get: function( elem ) {
          var value, option, i,
            options = elem.options,
            index = elem.selectedIndex,
            one = elem.type === "select-one",
            values = one ? null : [],
            max = one ? index + 1 : options.length;

          if ( index < 0 ) {
            i = max;

          } else {
            i = one ? index : 0;
          }

          // Loop through all the selected options
          for ( ; i < max; i++ ) {
            option = options[ i ];

            if ( option.selected &&

                // Don't return options that are disabled or in a disabled optgroup
                !option.disabled &&
                ( !option.parentNode.disabled ||
                  !noder.nodeName( option.parentNode, "optgroup" ) ) ) {

              // Get the specific value for the option
              value = val(option);

              // We don't need an array for one selects
              if ( one ) {
                return value;
              }

              // Multi-Selects return an array
              values.push( value );
            }
          }

          return values;
        },

        set: function( elem, value ) {
          var optionSet, option,
            options = elem.options,
            values = langx.makeArray( value ),
            i = options.length;

          while ( i-- ) {
            option = options[ i ];

            /* eslint-disable no-cond-assign */

            if ( option.selected =
              langx.inArray( valHooks.option.get( option ), values ) > -1
            ) {
              optionSet = true;
            }

            /* eslint-enable no-cond-assign */
          }

          // Force browsers to behave consistently when non-matching value is set
          if ( !optionSet ) {
            elem.selectedIndex = -1;
          }
          return values;
        }
      }
    };


    // Radios and checkboxes getter/setter
    langx.each( [ "radio", "checkbox" ], function() {
      valHooks[ this ] = {
        set: function( elem, value ) {
          if ( langx.isArray( value ) ) {
            return ( elem.checked = langx.inArray( val(elem), value ) > -1 );
          }
        }
      };
    });



    /*
     * Set property values
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */

    function setAttribute(elm, name, value) {
        if (value == null) {
            elm.removeAttribute(name);
        } else {
            elm.setAttribute(name, value);
        }
    }

    function aria(elm, name, value) {
        return this.attr(elm, "aria-" + name, value);
    }

    /*
     * Set property values
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */

    function attr(elm, name, value) {
        if (value === undefined) {
            if (typeof name === "object") {
                for (var attrName in name) {
                    attr(elm, attrName, name[attrName]);
                }
                return this;
            } else {
                return elm.getAttribute(name);
            }
        } else {
            elm.setAttribute(name, value);
            return this;
        }
    }


    /*
     *  Read all "data-*" attributes from a node
     * @param {Object} elm  
     */

    function _attributeData(elm) {
        var store = {}
        langx.each(elm.attributes || [], function(i, attr) {
            if (attr.name.indexOf('data-') == 0) {
                store[camelCase(attr.name.replace('data-', ''))] = deserializeValue(attr.value);
            }
        })
        return store;
    }

    function _store(elm, confirm) {
        var store = elm["_$_store"];
        if (!store && confirm) {
            store = elm["_$_store"] = _attributeData(elm);
        }
        return store;
    }

    function _getData(elm, name) {
        if (name === undefined) {
            return _store(elm, true);
        } else {
            var store = _store(elm);
            if (store) {
                if (name in store) {
                    return store[name];
                }
                var camelName = camelCase(name);
                if (camelName in store) {
                    return store[camelName];
                }
            }
            var attrName = 'data-' + name.replace(capitalRE, "-$1").toLowerCase()
            return attr(elm, attrName);
        }

    }

    function _setData(elm, name, value) {
        var store = _store(elm, true);
        store[camelCase(name)] = value;
    }


    /*
     * xxx
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */
    function data(elm, name, value) {

        if (value === undefined) {
            if (typeof name === "object") {
                for (var dataAttrName in name) {
                    _setData(elm, dataAttrName, name[dataAttrName]);
                }
                return this;
            } else {
                return _getData(elm, name);
            }
        } else {
            _setData(elm, name, value);
            return this;
        }
    } 
    /*
     * Remove from the element all items that have not yet been run. 
     * @param {Object} elm  
     */

    function cleanData(elm) {
        if (elm["_$_store"]) {
            delete elm["_$_store"];
        }
    }

    /*
     * Remove a previously-stored piece of data. 
     * @param {Object} elm  
     * @param {Array} names
     */
    function removeData(elm, names) {
        if (names) {
            if (langx.isString(names)) {
                names = names.split(/\s+/);
            }
            var store = _store(elm, true);
            names.forEach(function(name) {
                delete store[name];
            });            
        } else {
            cleanData(elm);
        }
        return this;
    }

    /*
     * xxx 
     * @param {Object} elm  
     * @param {Array} names
     */
    function pluck(nodes, property) {
        return map.call(nodes, function(elm) {
            return elm[property];
        });
    }

    /*
     * Get or set the value of an property for the specified element.
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */
    function prop(elm, name, value) {
        name = propMap[name] || name;
        if (value === undefined) {
            return elm[name];
        } else {
            elm[name] = value;
            return this;
        }
    }

    /*
     * remove Attributes  
     * @param {Object} elm  
     * @param {String} name
     */
    function removeAttr(elm, name) {
        name.split(' ').forEach(function(attr) {
            setAttribute(elm, attr);
        });
        return this;
    }


    /*
     * Remove the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.
     * @param {Object} elm  
     * @param {String} name
     */
    function removeProp(elm, name) {
        name.split(' ').forEach(function(prop) {
            delete elm[prop];
        });
        return this;
    }

    /*   
     * Get the combined text contents of each element in the set of matched elements, including their descendants, or set the text contents of the matched elements.  
     * @param {Object} elm  
     * @param {String} txt
     */
    function text(elm, txt) {
        if (txt === undefined) {
            return elm.textContent;
        } else {
            elm.textContent = txt == null ? '' : '' + txt;
            return this;
        }
    }

    /*   
     * Get the current value of the first element in the set of matched elements or set the value of every matched element.
     * @param {Object} elm  
     * @param {String} value
     */
    function val(elm, value) {
        var hooks = valHooks[ elm.type ] || valHooks[ elm.nodeName.toLowerCase() ];
        if (value === undefined) {
/*
            if (elm.multiple) {
                // select multiple values
                var selectedOptions = filter.call(finder.find(elm, "option"), (function(option) {
                    return option.selected;
                }));
                return pluck(selectedOptions, "value");
            } else {
                if (/input|textarea/i.test(elm.tagName)) {
                  return elm.value;
                }
                return text(elm);
            }
*/

          if ( hooks &&  "get" in hooks &&  ( ret = hooks.get( elm, "value" ) ) !== undefined ) {
            return ret;
          }

          ret = elm.value;

          // Handle most common string cases
          if ( typeof ret === "string" ) {
            return ret.replace( /\r/g, "" );
          }

          // Handle cases where value is null/undef or number
          return ret == null ? "" : ret;

        } else {
/*          
            if (/input|textarea/i.test(elm.tagName)) {
              elm.value = value;
            } else {
              text(elm,value);
            }
            return this;
*/
          // Treat null/undefined as ""; convert numbers to string
          if ( value == null ) {
            value = "";

          } else if ( typeof value === "number" ) {
            value += "";

          } else if ( langx.isArray( value ) ) {
            value = langx.map( value, function( value1 ) {
              return value1 == null ? "" : value1 + "";
            } );
          }

          // If set returns undefined, fall back to normal setting
          if ( !hooks || !( "set" in hooks ) || hooks.set( elm, value, "value" ) === undefined ) {
            elm.value = value;
          }
        }      
    }


    finder.pseudos.data = function( elem, i, match,dataName ) {
        return !!data( elem, dataName || match[3]);
    };
   

    function datax() {
        return datax;
    }

    langx.mixin(datax, {
        aria: aria,

        attr: attr,

        cleanData: cleanData,

        data: data,

        pluck: pluck,

        prop: prop,

        removeAttr: removeAttr,

        removeData: removeData,

        removeProp: removeProp,

        text: text,

        val: val,

        valHooks : valHooks
    });

    return skylark.attach("domx.data", datax);
});
define('skylark-domx-query/query',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-noder",
    "skylark-domx-finder"
], function(skylark, langx, noder, finder) {
    var some = Array.prototype.some,
        push = Array.prototype.push,
        every = Array.prototype.every,
        concat = Array.prototype.concat,
        slice = Array.prototype.slice,
        map = Array.prototype.map,
        filter = Array.prototype.filter,
        forEach = Array.prototype.forEach,
        indexOf = Array.prototype.indexOf,
        sort = Array.prototype.sort,
        isQ;

    var rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/;

    var funcArg = langx.funcArg,
        isArrayLike = langx.isArrayLike,
        isString = langx.isString,
        uniq = langx.uniq,
        isFunction = langx.isFunction;

    var type = langx.type,
        isArray = langx.isArray,

        isWindow = langx.isWindow,

        isDocument = langx.isDocument,

        isObject = langx.isObject,

        isPlainObject = langx.isPlainObject,

        compact = langx.compact,

        flatten = langx.flatten,

        camelCase = langx.camelCase,

        dasherize = langx.dasherize,
        children = finder.children;

    function wrapper_node_operation(func, context, oldValueFunc) {
        return function(html) {
            var argType, nodes = langx.map(arguments, function(arg) {
                argType = type(arg)
                return argType == "function" || argType == "object" || argType == "array" || arg == null ?
                    arg : noder.createFragment(arg)
            });
            if (nodes.length < 1) {
                return this
            }
            this.each(function(idx) {
                func.apply(context, [this, nodes, idx > 0]);
            });
            return this;
        }
    }

    function wrapper_map(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            var result = langx.map(self, function(elem, idx) {
                return func.apply(context, [elem].concat(params));
            });
            return query(uniq(result));
        }
    }

    function wrapper_selector(func, context, last) {
        return function(selector) {
            var self = this,
                params = slice.call(arguments);
            var result = this.map(function(idx, elem) {
                // if (elem.nodeType == 1) {
                //if (elem.querySelector) {
                    return func.apply(context, last ? [elem] : [elem, selector]);
                //}
            });
            if (last && selector) {
                return result.filter(selector);
            } else {
                return result;
            }
        }
    }

    function wrapper_selector_until(func, context, last) {
        return function(util, selector) {
            var self = this,
                params = slice.call(arguments);
            //if (selector === undefined) { //TODO : needs confirm?
            //    selector = util;
            //    util = undefined;
            //}
            var result = this.map(function(idx, elem) {
                // if (elem.nodeType == 1) { // TODO
                //if (elem.querySelector) {
                    return func.apply(context, last ? [elem, util] : [elem, selector, util]);
                //}
            });
            if (last && selector) {
                return result.filter(selector);
            } else {
                return result;
            }
        }
    }


    function wrapper_every_act(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            this.each(function(idx,node) {
                func.apply(context, [this].concat(params));
            });
            return self;
        }
    }

    function wrapper_every_act_firstArgFunc(func, context, oldValueFunc) {
        return function(arg1) {
            var self = this,
                params = slice.call(arguments);
            forEach.call(self, function(elem, idx) {
                var newArg1 = funcArg(elem, arg1, idx, oldValueFunc(elem));
                func.apply(context, [elem, arg1].concat(params.slice(1)));
            });
            return self;
        }
    }

    function wrapper_some_chk(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            return some.call(self, function(elem) {
                return func.apply(context, [elem].concat(params));
            });
        }
    }

    function wrapper_name_value(func, context, oldValueFunc) {
        return function(name, value) {
            var self = this,
                params = slice.call(arguments);

            if (langx.isPlainObject(name) || langx.isDefined(value)) {
                forEach.call(self, function(elem, idx) {
                    var newValue;
                    if (oldValueFunc) {
                        newValue = funcArg(elem, value, idx, oldValueFunc(elem, name));
                    } else {
                        newValue = value
                    }
                    func.apply(context, [elem].concat(params));
                });
                return self;
            } else {
                if (self[0]) {
                    return func.apply(context, [self[0], name]);
                }
            }

        }
    }

    function wrapper_value(func, context, oldValueFunc) {
        return function(value) {
            var self = this;

            if (langx.isDefined(value)) {
                forEach.call(self, function(elem, idx) {
                    var newValue;
                    if (oldValueFunc) {
                        newValue = funcArg(elem, value, idx, oldValueFunc(elem));
                    } else {
                        newValue = value
                    }
                    func.apply(context, [elem, newValue]);
                });
                return self;
            } else {
                if (self[0]) {
                    return func.apply(context, [self[0]]);
                }
            }

        }
    }

    var NodeList = langx.klass({
        klassName: "SkNodeList",
        init: function(selector, context) {
            var self = this,
                match, nodes, node, props;

            if (selector) {
                self.context = context = context || noder.doc();

                if (isString(selector)) {
                    // a html string or a css selector is expected
                    self.selector = selector;

                    if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
                        match = [null, selector, null];
                    } else {
                        match = rquickExpr.exec(selector);
                    }

                    if (match) {
                        if (match[1]) {
                            // if selector is html
                            nodes = noder.createFragment(selector);

                            if (langx.isPlainObject(context)) {
                                props = context;
                            }

                        } else {
                            node = finder.byId(match[2], noder.ownerDoc(context));

                            if (node) {
                                // if selector is id
                                nodes = [node];
                            }

                        }
                    } else {
                        // if selector is css selector
                        if (langx.isString(context)) {
                            context = finder.find(context);
                        }

                        nodes = finder.descendants(context, selector);
                    }
                } else {
                    if (selector !== window && isArrayLike(selector)) {
                        // a dom node array is expected
                        nodes = selector;
                    } else {
                        // a dom node is expected
                        nodes = [selector];
                    }
                    //self.add(selector, false);
                }
            }


            if (nodes) {

                push.apply(self, nodes);

                if (props) {
                    for ( var name  in props ) {
                        // Properties of context are called as methods if possible
                        if ( langx.isFunction( this[ name ] ) ) {
                            this[ name ]( props[ name ] );
                        } else {
                            this.attr( name, props[ name ] );
                        }
                    }
                }
            }

            return self;
        }
    });

    var query = (function() {
        isQ = function(object) {
            return object instanceof NodeList;
        }
        init = function(selector, context) {
            return new NodeList(selector, context);
        }

        var $ = function(selector, context) {
            if (isFunction(selector)) {
                $.ready(function() {
                    selector($);
                });
            } else if (isQ(selector)) {
                return selector;
            } else {
                if (context && isQ(context) && isString(selector)) {
                    return context.find(selector);
                }
                return init(selector, context);
            }
        };

        $.fn = NodeList.prototype;
        langx.mixin($.fn, {
            // `map` and `slice` in the jQuery API work differently
            // from their array counterparts
            length : 0,

            map: function(fn) {
                return $(uniq(langx.map(this, function(el, i) {
                    return fn.call(el, i, el)
                })));
            },

            slice: function() {
                return $(slice.apply(this, arguments))
            },

            forEach: function() {
                return forEach.apply(this,arguments);
            },

            get: function(idx) {
                return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
            },

            indexOf: function() {
                return indexOf.apply(this,arguments);
            },

            sort : function() {
                return sort.apply(this,arguments);
            },

            toArray: function() {
                return slice.call(this);
            },

            size: function() {
                return this.length
            },

            //remove: wrapper_every_act(noder.remove, noder),
            remove : function(selector) {
                if (selector) {
                    return this.find(selector).remove();
                }
                this.each(function(i,node){
                    noder.remove(node);
                });
                return this;
            },

            each: function(callback) {
                langx.each(this, callback);
                return this;
            },

            filter: function(selector) {
                if (isFunction(selector)) return this.not(this.not(selector))
                return $(filter.call(this, function(element) {
                    return finder.matches(element, selector)
                }))
            },

            add: function(selector, context) {
                return $(uniq(this.toArray().concat($(selector, context).toArray())));
            },

            is: function(selector) {
                if (this.length > 0) {
                    var self = this;
                    if (langx.isString(selector)) {
                        return some.call(self,function(elem) {
                            return finder.matches(elem, selector);
                        });
                    } else if (langx.isArrayLike(selector)) {
                       return some.call(self,function(elem) {
                            return langx.inArray(elem, selector) > -1;
                        });
                    } else if (langx.isHtmlNode(selector)) {
                       return some.call(self,function(elem) {
                            return elem ==  selector;
                        });
                    }
                }
                return false;
            },
            
            not: function(selector) {
                var nodes = []
                if (isFunction(selector) && selector.call !== undefined)
                    this.each(function(idx,node) {
                        if (!selector.call(this, idx,node)) nodes.push(this)
                    })
                else {
                    var excludes = typeof selector == 'string' ? this.filter(selector) :
                        (isArrayLike(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                    this.forEach(function(el) {
                        if (excludes.indexOf(el) < 0) nodes.push(el)
                    })
                }
                return $(nodes)
            },

            has: function(selector) {
                return this.filter(function() {
                    return isObject(selector) ?
                        noder.contains(this, selector) :
                        $(this).find(selector).size()
                })
            },

            eq: function(idx) {
                return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
            },

            first: function() {
                return this.eq(0);
            },

            last: function() {
                return this.eq(-1);
            },

            find: wrapper_selector(finder.descendants, finder),

            closest: wrapper_selector(finder.closest, finder),
            /*
                        closest: function(selector, context) {
                            var node = this[0],
                                collection = false
                            if (typeof selector == 'object') collection = $(selector)
                            while (node && !(collection ? collection.indexOf(node) >= 0 : finder.matches(node, selector)))
                                node = node !== context && !isDocument(node) && node.parentNode
                            return $(node)
                        },
            */


            parents: wrapper_selector(finder.ancestors, finder),

            parentsUntil: wrapper_selector_until(finder.ancestors, finder),


            parent: wrapper_selector(finder.parent, finder),

            children: wrapper_selector(finder.children, finder),

            contents: wrapper_map(noder.contents, noder),

            empty: wrapper_every_act(noder.empty, noder),

            html: wrapper_value(noder.html, noder),

            // `pluck` is borrowed from Prototype.js
            pluck: function(property) {
                return langx.map(this, function(el) {
                    return el[property]
                })
            },

            pushStack : function(elms) {
                var ret = $(elms);
                ret.prevObject = this;
                return ret;
            },
            
            replaceWith: function(newContent) {
                return this.before(newContent).remove();
            },

            wrap: function(html) {
                /*
                var func = isFunction(structure)
                if (this[0] && !func)
                    var dom = $(structure).get(0),
                        clone = dom.parentNode || this.length > 1

                return this.each(function(index,node) {
                    $(this).wrapAll(
                        func ? structure.call(this, index,node) :
                        clone ? dom.cloneNode(true) : dom
                    )
                })
                */
                var htmlIsFunction = typeof html === "function";

                return this.each( function( i ) {
                    $( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
                } );                
            },

            wrapAll: function(html) {
                /*
                if (this[0]) {
                    $(this[0]).before(wrappingElement = $(wrappingElement));
                    var children;
                    // drill down to the inmost element
                    while ((children = wrappingElement.children()).length) {
                        wrappingElement = children.first();
                    }
                    $(wrappingElement).append(this);
                }
                return this
                */
                var wrap;

                if ( this[ 0 ] ) {
                    if ( typeof html === "function" ) {
                        html = html.call( this[ 0 ] );
                    }

                    // The elements to wrap the target around
                    wrap = $( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

                    if ( this[ 0 ].parentNode ) {
                        wrap.insertBefore( this[ 0 ] );
                    }

                    wrap.map( function() {
                        var elem = this;

                        while ( elem.firstElementChild ) {
                            elem = elem.firstElementChild;
                        }

                        return elem;
                    } ).append( this );
                }

                return this;

            },

            wrapInner: function(html) {
                /*
                var func = isFunction(wrappingElement)
                return this.each(function(index,node) {
                    var self = $(this),
                        contents = self.contents(),
                        dom = func ? wrappingElement.call(this, index,node) : wrappingElement
                    contents.length ? contents.wrapAll(dom) : self.append(dom)
                })
                */
                if ( typeof html === "function" ) {
                    return this.each( function( i ) {
                        $( this ).wrapInner( html.call( this, i ) );
                    } );
                }

                return this.each( function() {
                    var self = $( this ),
                        contents = self.contents();

                    if ( contents.length ) {
                        contents.wrapAll( html );

                    } else {
                        self.append( html );
                    }
                } );

            },

            unwrap: function(selector) {
                /*
                if (this.parent().children().length === 0) {
                    // remove dom without text
                    this.parent(selector).not("body").each(function() {
                        $(this).replaceWith(document.createTextNode(this.childNodes[0].textContent));
                    });
                } else {
                    this.parent().each(function() {
                        $(this).replaceWith($(this).children())
                    });
                }
                return this
                */
                this.parent(selector).not("body").each( function() {
                    $(this).replaceWith(this.childNodes);
                });
                return this;

            },

            clone: function() {
                return this.map(function() {
                    return this.cloneNode(true)
                })
            },


            toggle: function(setting) {
                return this.each(function() {
                    var el = $(this);
                    (setting === undefined ? el.css("display") == "none" : setting) ? el.show(): el.hide()
                })
            },

            prev: function(selector) {
                return $(this.pluck('previousElementSibling')).filter(selector || '*')
            },

            prevAll: wrapper_selector(finder.previousSiblings, finder),

            next: function(selector) {
                return $(this.pluck('nextElementSibling')).filter(selector || '*')
            },

            nextAll: wrapper_selector(finder.nextSiblings, finder),

            siblings: wrapper_selector(finder.siblings, finder),

            index: function(elem) {
                if (elem) {
                    return this.indexOf($(elem)[0]);
                } else {
                    return this.parent().children().indexOf(this[0]);
                }
            }
        });

        // for now
        $.fn.detach = $.fn.remove;

        $.fn.hover = function(fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
        };


        var traverseNode = noder.traverse;


        $.fn.after = wrapper_node_operation(noder.after, noder);

        $.fn.prepend = wrapper_node_operation(noder.prepend, noder);

        $.fn.before = wrapper_node_operation(noder.before, noder);

        $.fn.append = wrapper_node_operation(noder.append, noder);


        langx.each( {
            appendTo: "append",
            prependTo: "prepend",
            insertBefore: "before",
            insertAfter: "after",
            replaceAll: "replaceWith"
        }, function( name, original ) {
            $.fn[ name ] = function( selector ) {
                var elems,
                    ret = [],
                    insert = $( selector ),
                    last = insert.length - 1,
                    i = 0;

                for ( ; i <= last; i++ ) {
                    elems = i === last ? this : this.clone( true );
                    $( insert[ i ] )[ original ]( elems );

                    // Support: Android <=4.0 only, PhantomJS 1 only
                    // .get() because push.apply(_, arraylike) throws on ancient WebKit
                    push.apply( ret, elems.get() );
                }

                return this.pushStack( ret );
            };
        } );

/*
        $.fn.insertAfter = function(html) {
            $(html).after(this);
            return this;
        };

        $.fn.insertBefore = function(html) {
            $(html).before(this);
            return this;
        };

        $.fn.appendTo = function(html) {
            $(html).append(this);
            return this;
        };

        $.fn.prependTo = function(html) {
            $(html).prepend(this);
            return this;
        };

        $.fn.replaceAll = function(selector) {
            $(selector).replaceWith(this);
            return this;
        };
*/
        return $;
    })();

    (function($) {
        $.fn.scrollParent = function( includeHidden ) {
            var position = this.css( "position" ),
                excludeStaticParent = position === "absolute",
                overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
                scrollParent = this.parents().filter( function() {
                    var parent = $( this );
                    if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
                        return false;
                    }
                    return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
                        parent.css( "overflow-x" ) );
                } ).eq( 0 );

            return position === "fixed" || !scrollParent.length ?
                $( this[ 0 ].ownerDocument || document ) :
                scrollParent;
        };

    })(query);


    (function($) {
        $.fn.end = function() {
            return this.prevObject || $()
        }

        $.fn.andSelf = function() {
            return this.add(this.prevObject || $())
        }

        $.fn.addBack = function(selector) {
            if (this.prevObject) {
                if (selector) {
                    return this.add(this.prevObject.filter(selector));
                } else {
                    return this.add(this.prevObject);
                }
            } else {
                return this;
            }
        }

        'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings,prev,prevAll,next,nextAll'.split(',').forEach(function(property) {
            var fn = $.fn[property]
            $.fn[property] = function() {
                var ret = fn.apply(this, arguments)
                ret.prevObject = this
                return ret
            }
        })
    })(query);


    (function($) {
        $.fn.query = $.fn.find;

        $.fn.place = function(refNode, position) {
            // summary:
            //      places elements of this node list relative to the first element matched
            //      by queryOrNode. Returns the original NodeList. See: `dojo/dom-construct.place`
            // queryOrNode:
            //      may be a string representing any valid CSS3 selector or a DOM node.
            //      In the selector case, only the first matching element will be used
            //      for relative positioning.
            // position:
            //      can be one of:
            //
            //      -   "last" (default)
            //      -   "first"
            //      -   "before"
            //      -   "after"
            //      -   "only"
            //      -   "replace"
            //
            //      or an offset in the childNodes
            if (langx.isString(refNode)) {
                refNode = finder.descendant(refNode);
            } else if (isQ(refNode)) {
                refNode = refNode[0];
            }
            return this.each(function(i, node) {
                switch (position) {
                    case "before":
                        noder.before(refNode, node);
                        break;
                    case "after":
                        noder.after(refNode, node);
                        break;
                    case "replace":
                        noder.replace(refNode, node);
                        break;
                    case "only":
                        noder.empty(refNode);
                        noder.append(refNode, node);
                        break;
                    case "first":
                        noder.prepend(refNode, node);
                        break;
                        // else fallthrough...
                    default: // aka: last
                        noder.append(refNode, node);
                }
            });
        };

        $.fn.addContent = function(content, position) {
            if (content.template) {
                content = langx.substitute(content.template, content);
            }
            return this.append(content);
        };



        $.fn.disableSelection = ( function() {
            var eventType = "onselectstart" in document.createElement( "div" ) ?
                "selectstart" :
                "mousedown";

            return function() {
                return this.on( eventType + ".ui-disableSelection", function( event ) {
                    event.preventDefault();
                } );
            };
        } )();

        $.fn.enableSelection = function() {
            return this.off( ".ui-disableSelection" );
        };

        $.fn.reflow = function() {
            return noder.flow(this[0]);
        };

        $.fn.isBlockNode = function() {
            return noder.isBlockNode(this[0]);
        };
       

    })(query);

    query.fn.plugin = function(name,options) {
        var args = slice.call( arguments, 1 ),
            self = this,
            returnValue = this;

        this.each(function(){
            returnValue = plugins.instantiate.apply(self,[this,name].concat(args));
        });
        return returnValue;
    };


    query.wraps = {
        wrapper_node_operation,
        wrapper_map,
        wrapper_value,
        wrapper_selector,
        wrapper_some_chk,
        wrapper_selector_until,
        wrapper_every_act_firstArgFunc,
        wrapper_every_act,
        wrapper_name_value

    };

    return skylark.attach("domx.query", query);

});
define('skylark-domx-query/main',[
	"./query"
],function(query){
	return query;
});
define('skylark-domx-query', ['skylark-domx-query/main'], function (main) { return main; });

define('skylark-domx-velm/velm',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-noder",
    "skylark-domx-finder",
    "skylark-domx-query"
], function(skylark, langx, noder, finder, $) {
    var map = Array.prototype.map,
        slice = Array.prototype.slice;
    /*
     * VisualElement is a skylark class type wrapping a visule dom node,
     * provides a number of prototype methods and supports chain calls.
     */
    var VisualElement = langx.klass({
        klassName: "VisualElement",

        "_construct": function(node) {
            if (langx.isString(node)) {
                if (node.charAt(0) === "<") {
                    //html
                    node = noder.createFragment(node)[0];
                } else {
                    // id
                    node = document.getElementById(node);
                }
            }
            this._elm = node;
        }
    });

    VisualElement.prototype.$ = VisualElement.prototype.query = function(selector) {
        return $(selector,this._elm);
    };

    VisualElement.prototype.elm = function() {
        return this._elm;
    };

    /*
     * the VisualElement object wrapping document.body
     */
    var root = new VisualElement(document.body),
        velm = function(node) {
            if (node) {
                return new VisualElement(node);
            } else {
                return root;
            }
        };
    /*
     * Extend VisualElement prototype with wrapping the specified methods.
     * @param {ArrayLike} fn
     * @param {Object} context
     */
    function _delegator(fn, context) {
        return function() {
            var self = this,
                elem = self._elm,
                ret = fn.apply(context, [elem].concat(slice.call(arguments)));

            if (ret) {
                if (ret === context) {
                    return self;
                } else {
                    if (ret instanceof HTMLElement) {
                        ret = new VisualElement(ret);
                    } else if (langx.isArrayLike(ret)) {
                        ret = map.call(ret, function(el) {
                            if (el instanceof HTMLElement) {
                                return new VisualElement(el);
                            } else {
                                return el;
                            }
                        })
                    }
                }
            }
            return ret;
        };
    }

    langx.mixin(velm, {
        batch: function(nodes, action, args) {
            nodes.forEach(function(node) {
                var elm = (node instanceof VisualElement) ? node : velm(node);
                elm[action].apply(elm, args);
            });

            return this;
        },

        root: new VisualElement(document.body),

        VisualElement: VisualElement,

        partial: function(name, fn) {
            var props = {};

            props[name] = fn;

            VisualElement.partial(props);
        },

        delegate: function(names, context) {
            var props = {};

            names.forEach(function(name) {
                props[name] = _delegator(context[name], context);
            });

            VisualElement.partial(props);
        }
    });

    // from ./finder
    velm.delegate([
        "ancestor",
        "ancestors",
        "children",
        "descendant",
        "find",
        "findAll",
        "firstChild",
        "lastChild",
        "matches",
        "nextSibling",
        "nextSiblings",
        "parent",
        "previousSibling",
        "previousSiblings",
        "siblings"
    ], finder);

    /*
     * find a dom element matched by the specified selector.
     * @param {String} selector
     */
    velm.find = function(selector) {
        if (selector === "body") {
            return this.root;
        } else {
            return this.root.descendant(selector);
        }
    };


    // from ./noder
    velm.delegate([
        "after",
        "append",
        "before",
        "clone",
        "contains",
        "contents",
        "empty",
        "html",
        "isChildOf",
        "isDocument",
        "isInDocument",
        "isWindow",
        "ownerDoc",
        "prepend",
        "remove",
        "removeChild",
        "replace",
        "reverse",
        "throb",
        "traverse",
        "wrapper",
        "wrapperInner",
        "unwrap"
    ], noder);


    return skylark.attach("domx.velm", velm);
});
define('skylark-domx-velm/main',[
	"./velm"
],function(velm){
	return velm;
});
define('skylark-domx-velm', ['skylark-domx-velm/main'], function (main) { return main; });

define('skylark-domx-data/main',[
    "./data",
    "skylark-domx-velm",
    "skylark-domx-query"    
],function(data,velm,$){
    // from ./data
    velm.delegate([
        "attr",
        "data",
        "prop",
        "removeAttr",
        "removeData",
        "text",
        "val"
    ], data);

    $.fn.text = $.wraps.wrapper_value(data.text, data, data.text);

    $.fn.attr = $.wraps.wrapper_name_value(data.attr, data, data.attr);

    $.fn.removeAttr = $.wraps.wrapper_every_act(data.removeAttr, data);

    $.fn.prop = $.wraps.wrapper_name_value(data.prop, data, data.prop);

    $.fn.removeProp = $.wraps.wrapper_every_act(data.removeProp, data);

    $.fn.data = $.wraps.wrapper_name_value(data.data, data, data.data);

    $.fn.removeData = $.wraps.wrapper_every_act(data.removeData, data);

    $.fn.val = $.wraps.wrapper_value(data.val, data, data.val);


    return data;
});
define('skylark-domx-data', ['skylark-domx-data/main'], function (main) { return main; });

define('skylark-domx-eventer/eventer',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-browser",
    "skylark-domx-finder",
    "skylark-domx-noder",
    "skylark-domx-data"
], function(skylark, langx, browser, finder, noder, datax) {
    var mixin = langx.mixin,
        each = langx.each,
        slice = Array.prototype.slice,
        uid = langx.uid,
        ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
        eventMethods = {
            preventDefault: "isDefaultPrevented",
            stopImmediatePropagation: "isImmediatePropagationStopped",
            stopPropagation: "isPropagationStopped"
        },
        readyRE = /complete|loaded|interactive/;

    function compatible(event, source) {
        if (source || !event.isDefaultPrevented) {
            if (!source) {
                source = event;
            }

            langx.each(eventMethods, function(name, predicate) {
                var sourceMethod = source[name];
                event[name] = function() {
                    this[predicate] = langx.returnTrue;
                    return sourceMethod && sourceMethod.apply(source, arguments);
                }
                event[predicate] = langx.returnFalse;
            });
        }
        return event;
    }

    function parse(event) {
        var segs = ("" + event).split(".");
        return {
            type: segs[0],
            ns: segs.slice(1).sort().join(" ")
        };
    }


    var NativeEventCtors = [
            window["CustomEvent"], // 0 default
            window["CompositionEvent"], // 1
            window["DragEvent"], // 2
            window["Event"], // 3
            window["FocusEvent"], // 4
            window["KeyboardEvent"], // 5
            window["MessageEvent"], // 6
            window["MouseEvent"], // 7
            window["MouseScrollEvent"], // 8
            window["MouseWheelEvent"], // 9
            window["MutationEvent"], // 10
            window["ProgressEvent"], // 11
            window["TextEvent"], // 12
            window["TouchEvent"], // 13
            window["UIEvent"], // 14
            window["WheelEvent"], // 15
            window["ClipboardEvent"] // 16
        ],
        NativeEvents = {
            "compositionstart": 1, // CompositionEvent
            "compositionend": 1, // CompositionEvent
            "compositionupdate": 1, // CompositionEvent

            "beforecopy": 16, // ClipboardEvent
            "beforecut": 16, // ClipboardEvent
            "beforepaste": 16, // ClipboardEvent
            "copy": 16, // ClipboardEvent
            "cut": 16, // ClipboardEvent
            "paste": 16, // ClipboardEvent

            "drag": 2, // DragEvent
            "dragend": 2, // DragEvent
            "dragenter": 2, // DragEvent
            "dragexit": 2, // DragEvent
            "dragleave": 2, // DragEvent
            "dragover": 2, // DragEvent
            "dragstart": 2, // DragEvent
            "drop": 2, // DragEvent

            "abort": 3, // Event
            "change": 3, // Event
            "error": 3, // Event
            "selectionchange": 3, // Event
            "submit": 3, // Event
            "reset": 3, // Event

            "focus": 4, // FocusEvent
            "blur": 4, // FocusEvent
            "focusin": 4, // FocusEvent
            "focusout": 4, // FocusEvent

            "keydown": 5, // KeyboardEvent
            "keypress": 5, // KeyboardEvent
            "keyup": 5, // KeyboardEvent

            "message": 6, // MessageEvent

            "click": 7, // MouseEvent
            "contextmenu": 7, // MouseEvent
            "dblclick": 7, // MouseEvent
            "mousedown": 7, // MouseEvent
            "mouseup": 7, // MouseEvent
            "mousemove": 7, // MouseEvent
            "mouseover": 7, // MouseEvent
            "mouseout": 7, // MouseEvent
            "mouseenter": 7, // MouseEvent
            "mouseleave": 7, // MouseEvent


            "textInput": 12, // TextEvent

            "touchstart": 13, // TouchEvent
            "touchmove": 13, // TouchEvent
            "touchend": 13, // TouchEvent

            "load": 14, // UIEvent
            "resize": 14, // UIEvent
            "select": 14, // UIEvent
            "scroll": 14, // UIEvent
            "unload": 14, // UIEvent,

            "wheel": 15 // WheelEvent
        };

    //create a custom dom event
    var createEvent = (function() {

        function getEventCtor(type) {
            var idx = NativeEvents[type];
            if (!idx) {
                idx = 0;
            }
            return NativeEventCtors[idx];
        }

        return function(type, props) {
            //create a custom dom event

            if (langx.isString(type)) {
                props = props || {};
            } else {
                props = type || {};
                type = props.type || "";
            }
            var parsed = parse(type);
            type = parsed.type;

            props = langx.mixin({
                bubbles: true,
                cancelable: true
            }, props);

            if (parsed.ns) {
                props.namespace = parsed.ns;
            }

            var ctor = getEventCtor(type),
                e = new ctor(type, props);

            langx.safeMixin(e, props);

            return compatible(e);
        };
    })();

    function createProxy(src, props) {
        var key,
            proxy = {
                originalEvent: src
            };
        for (key in src) {
            if (key !== "keyIdentifier" && !ignoreProperties.test(key) && src[key] !== undefined) {
                proxy[key] = src[key];
            }
        }
        if (props) {
            langx.mixin(proxy, props);
        }
        return compatible(proxy, src);
    }

    var
        specialEvents = {},
        focusinSupported = "onfocusin" in window,
        focus = { focus: "focusin", blur: "focusout" },
        hover = { mouseenter: "mouseover", mouseleave: "mouseout" },
        realEvent = function(type) {
            return hover[type] || (focusinSupported && focus[type]) || type;
        },
        handlers = {},
        EventBindings = langx.klass({
            init: function(target, event) {
                this._target = target;
                this._event = event;
                this._bindings = [];
            },

            add: function(fn, options) {
                var bindings = this._bindings,
                    binding = {
                        fn: fn,
                        options: langx.mixin({}, options)
                    };

                bindings.push(binding);

                var self = this;
                if (!self._listener) {
                    self._listener = function(domEvt) {
                        var elm = this,
                            e = createProxy(domEvt),
                            args = domEvt._args,
                            bindings = self._bindings,
                            ns = e.namespace;

                        if (langx.isDefined(args)) {
                            args = [e].concat(args);
                        } else {
                            args = [e];
                        }

                        langx.each(bindings, function(idx, binding) {
                            var match = elm;
                            if (e.isImmediatePropagationStopped && e.isImmediatePropagationStopped()) {
                                return false;
                            }
                            var fn = binding.fn,
                                options = binding.options || {},
                                selector = options.selector,
                                one = options.one,
                                data = options.data;

                            if (ns && ns != options.ns && options.ns.indexOf(ns) === -1) {
                                return;
                            }
                            if (selector) {
                                match = finder.closest(e.target, selector);
                                if (match && match !== elm) {
                                    langx.mixin(e, {
                                        currentTarget: match,
                                        liveFired: elm
                                    });
                                } else {
                                    return;
                                }
                            }

                            var originalEvent = self._event;
                            if (originalEvent in hover) {
                                var related = e.relatedTarget;
                                if (related && (related === match || noder.contains(match, related))) {
                                    return;
                                }
                            }

                            if (langx.isDefined(data)) {
                                e.data = data;
                            }

                            if (one) {
                                self.remove(fn, options);
                            }

                            var result = fn.apply(match, args);

                            if (result === false) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        });;
                    };

                    var event = self._event;
                    /*
                                        if (event in hover) {
                                            var l = self._listener;
                                            self._listener = function(e) {
                                                var related = e.relatedTarget;
                                                if (!related || (related !== this && !noder.contains(this, related))) {
                                                    return l.apply(this, arguments);
                                                }
                                            }
                                        }
                    */

                    if (self._target.addEventListener) {
                        self._target.addEventListener(realEvent(event), self._listener, false);
                    } else {
                        console.warn("invalid eventer object", self._target);
                    }
                }

            },
            remove: function(fn, options) {
                options = langx.mixin({}, options);

                function matcherFor(ns) {
                    return new RegExp("(?:^| )" + ns.replace(" ", " .* ?") + "(?: |$)");
                }
                var matcher;
                if (options.ns) {
                    matcher = matcherFor(options.ns);
                }

                this._bindings = this._bindings.filter(function(binding) {
                    var removing = (!fn || fn === binding.fn) &&
                        (!matcher || matcher.test(binding.options.ns)) &&
                        (!options.selector || options.selector == binding.options.selector);

                    return !removing;
                });
                if (this._bindings.length == 0) {
                    if (this._target.removeEventListener) {
                        this._target.removeEventListener(realEvent(this._event), this._listener, false);
                    }
                    this._listener = null;
                }
            }
        }),
        EventsHandler = langx.klass({
            init: function(elm) {
                this._target = elm;
                this._handler = {};
            },

            // add a event listener
            // selector Optional
            register: function(event, callback, options) {
                // Seperate the event from the namespace
                var parsed = parse(event),
                    event = parsed.type,
                    specialEvent = specialEvents[event],
                    bindingEvent = specialEvent && (specialEvent.bindType || specialEvent.bindEventName);

                var events = this._handler;

                // Check if there is already a handler for this event
                if (events[event] === undefined) {
                    events[event] = new EventBindings(this._target, bindingEvent || event);
                }

                // Register the new callback function
                events[event].add(callback, langx.mixin({
                    ns: parsed.ns
                }, options)); // options:{selector:xxx}
            },

            // remove a event listener
            unregister: function(event, fn, options) {
                // Check for parameter validtiy
                var events = this._handler,
                    parsed = parse(event);
                event = parsed.type;

                if (event) {
                    var listener = events[event];

                    if (listener) {
                        listener.remove(fn, langx.mixin({
                            ns: parsed.ns
                        }, options));
                    }
                } else {
                    //remove all events
                    for (event in events) {
                        var listener = events[event];
                        listener.remove(fn, langx.mixin({
                            ns: parsed.ns
                        }, options));
                    }
                }
            }
        }),

        findHandler = function(elm) {
            var id = uid(elm),
                handler = handlers[id];
            if (!handler) {
                handler = handlers[id] = new EventsHandler(elm);
            }
            return handler;
        };

    /*   
     * Remove an event handler for one or more events from the specified element.
     * @param {HTMLElement} elm  
     * @param {String} events
     * @param {String　Optional } selector
     * @param {Function} callback
     */
    function off(elm, events, selector, callback) {
        var $this = this
        if (langx.isPlainObject(events)) {
            langx.each(events, function(type, fn) {
                off(elm, type, selector, fn);
            })
            return $this;
        }

        if (!langx.isString(selector) && !langx.isFunction(callback) && callback !== false) {
            callback = selector;
            selector = undefined;
        }

        if (callback === false) {
            callback = langx.returnFalse;
        }

        if (typeof events == "string") {
            if (events.indexOf(",") > -1) {
                events = events.split(",");
            } else {
                events = events.split(/\s/);
            }
        }

        var handler = findHandler(elm);

        if (events) events.forEach(function(event) {

            handler.unregister(event, callback, {
                selector: selector,
            });
        });
        return this;
    }

    /*   
     * Attach an event handler function for one or more events to the selected elements.
     * @param {HTMLElement} elm  
     * @param {String} events
     * @param {String　Optional} selector
     * @param {Anything Optional} data
     * @param {Function} callback
     * @param {Boolean　Optional} one
     */
    function on(elm, events, selector, data, callback, one) {

        var autoRemove, delegator;
        if (langx.isPlainObject(events)) {
            langx.each(events, function(type, fn) {
                on(elm, type, selector, data, fn, one);
            });
            return this;
        }

        if (!langx.isString(selector) && !langx.isFunction(callback)) {
            callback = data;
            data = selector;
            selector = undefined;
        }

        if (langx.isFunction(data)) {
            callback = data;
            data = undefined;
        }

        if (callback === false) {
            callback = langx.returnFalse;
        }

        if (typeof events == "string") {
            if (events.indexOf(",") > -1) {
                events = events.split(",");
            } else {
                events = events.split(/\s/);
            }
        }

        var handler = findHandler(elm);

        events.forEach(function(event) {
            if (event == "ready") {
                return ready(callback);
            }
            handler.register(event, callback, {
                data: data,
                selector: selector,
                one: !!one
            });
        });
        return this;
    }

    /*   
     * Attach a handler to an event for the elements. The handler is executed at most once per 
     * @param {HTMLElement} elm  
     * @param {String} event
     * @param {String　Optional} selector
     * @param {Anything Optional} data
     * @param {Function} callback
     */
    function one(elm, events, selector, data, callback) {
        on(elm, events, selector, data, callback, 1);

        return this;
    }

    /*   
     * Prevents propagation and clobbers the default action of the passed event. The same as calling event.preventDefault() and event.stopPropagation(). 
     * @param {String} event
     */
    function stop(event) {
        if (window.document.all) {
            event.keyCode = 0;
        }
        if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
        }
        return this;
    }
    /*   
     * Execute all handlers and behaviors attached to the matched elements for the given event  
     * @param {String} evented
     * @param {String} type
     * @param {Array or PlainObject } args
     */
    function trigger(evented, type, args) {
        var e;
        if (type instanceof Event) {
            e = type;
        } else {
            e = createEvent(type, args);
        }
        e._args = args;

        var fn = (evented.dispatchEvent || evented.trigger);
        if (fn) {
            fn.call(evented, e);
        } else {
            console.warn("The evented parameter is not a eventable object");
        }

        return this;
    }
    /*   
     * Specify a function to execute when the DOM is fully loaded.  
     * @param {Function} callback
     */
    function ready(callback) {
        // need to check if document.body exists for IE as that browser reports
        // document ready when it hasn't yet created the body elm
        if (readyRE.test(document.readyState) && document.body) {
            langx.defer(callback);
        } else {
            document.addEventListener('DOMContentLoaded', callback, false);
        }

        return this;
    }

    var keyCodeLookup = {
        "backspace": 8,
        "comma": 188,
        "delete": 46,
        "down": 40,
        "end": 35,
        "enter": 13,
        "escape": 27,
        "home": 36,
        "left": 37,
        "page_down": 34,
        "page_up": 33,
        "period": 190,
        "right": 39,
        "space": 32,
        "tab": 9,
        "up": 38
    };
    //example:
    //shortcuts(elm).add("CTRL+ALT+SHIFT+X",function(){console.log("test!")});
    function shortcuts(elm) {

        var registry = datax.data(elm, "shortcuts");
        if (!registry) {
            registry = {};
            datax.data(elm, "shortcuts", registry);
            var run = function(shortcut, event) {
                var n = event.metaKey || event.ctrlKey;
                if (shortcut.ctrl == n && shortcut.alt == event.altKey && shortcut.shift == event.shiftKey) {
                    if (event.keyCode == shortcut.keyCode || event.charCode && event.charCode == shortcut.charCode) {
                        event.preventDefault();
                        if ("keydown" == event.type) {
                            shortcut.fn(event);
                        }
                        return true;
                    }
                }
            };
            on(elm, "keyup keypress keydown", function(event) {
                if (!(/INPUT|TEXTAREA/.test(event.target.nodeName))) {
                    for (var key in registry) {
                        run(registry[key], event);
                    }
                }
            });

        }

        return {
            add: function(pattern, fn) {
                var shortcutKeys;
                if (pattern.indexOf(",") > -1) {
                    shortcutKeys = pattern.toLowerCase().split(",");
                } else {
                    shortcutKeys = pattern.toLowerCase().split(" ");
                }
                shortcutKeys.forEach(function(shortcutKey) {
                    var setting = {
                        fn: fn,
                        alt: false,
                        ctrl: false,
                        shift: false
                    };
                    shortcutKey.split("+").forEach(function(key) {
                        switch (key) {
                            case "alt":
                            case "ctrl":
                            case "shift":
                                setting[key] = true;
                                break;
                            default:
                                setting.charCode = key.charCodeAt(0);
                                setting.keyCode = keyCodeLookup[key] || key.toUpperCase().charCodeAt(0);
                        }
                    });
                    var regKey = (setting.ctrl ? "ctrl" : "") + "," + (setting.alt ? "alt" : "") + "," + (setting.shift ? "shift" : "") + "," + setting.keyCode;
                    registry[regKey] = setting;
                })
            }

        };

    }

    if (browser.support.transition) {
        specialEvents.transitionEnd = {
//          handle: function (e) {
//            if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
//          },
          bindType: browser.support.transition.end,
          delegateType: browser.support.transition.end
        }        
    }

    function eventer() {
        return eventer;
    }

    langx.mixin(eventer, {
        NativeEvents : NativeEvents,
        
        create: createEvent,

        keys: keyCodeLookup,

        off: off,

        on: on,

        one: one,

        proxy: createProxy,

        ready: ready,

        shortcuts: shortcuts,

        special: specialEvents,

        stop: stop,

        trigger: trigger

    });

    each(NativeEvents,function(name){
        eventer[name] = function(elm,selector,data,callback) {
            if (arguments.length>1) {
                return this.on(elm,name,selector,data,callback);
            } else {
                if (name == "focus") {
                    if (elm.focus) {
                        elm.focus();
                    }
                } else if (name == "blur") {
                    if (elm.blur) {
                        elm.blur();
                    }
                } else if (name == "click") {
                    if (elm.click) {
                        elm.click();
                    }
                } else {
                    this.trigger(elm,name);
                }

                return this;
            }
        };
    });

    return skylark.attach("domx.eventer",eventer);
});
define('skylark-domx-eventer/main',[
    "skylark-langx/langx",
    "./eventer",
    "skylark-domx-velm",
    "skylark-domx-query"        
],function(langx,eventer,velm,$){

    var delegateMethodNames = [
        "off",
        "on",
        "one",
        "trigger"
    ];

    langx.each(eventer.NativeEvents,function(name){
        delegateMethodNames.push(name);
    });

    // from ./eventer
    velm.delegate(delegateMethodNames, eventer);

    langx.each(delegateMethodNames,function(i,name){
        $.fn[name] = $.wraps.wrapper_every_act(eventer[name],eventer);
    });


    /*
    $.fn.on = $.wraps.wrapper_every_act(eventer.on, eventer);

    $.fn.off = $.wraps.wrapper_every_act(eventer.off, eventer);

    $.fn.trigger = $.wraps.wrapper_every_act(eventer.trigger, eventer);

    ('focusin focusout focus blur load resize scroll unload click dblclick ' +
        'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
        'change select keydown keypress keyup error transitionEnd').split(' ').forEach(function(event) {
        $.fn[event] = $.wraps.wrapper_every_act(eventer[event],eventer);
    });

    $.fn.one = function(event, selector, data, callback) {
        if (!langx.isString(selector) && !langx.isFunction(callback)) {
            callback = data;
            data = selector;
            selector = null;
        }

        if (langx.isFunction(data)) {
            callback = data;
            data = null;
        }

        return this.on(event, selector, data, callback, 1)
    }; 
    */

    $.ready = eventer.ready;

    return eventer;
});
define('skylark-domx-eventer', ['skylark-domx-eventer/main'], function (main) { return main; });

define('skylark-domx-forms/forms',[
	"skylark-langx/skylark"
],function(skylark){
	return skylark.attach("domx.forms",{});
});
define('skylark-domx-forms/deserialize',[
  "skylark-langx/langx",
  "skylark-domx-query",
  "./forms"
],function(langx,$,forms){
  /**
   * Updates a key/valueArray with the given property and value. Values will always be stored as arrays.
   *
   * @param prop The property to add the value to.
   * @param value The value to add.
   * @param obj The object to update.
   * @returns {object} Updated object.
   */
  function updateKeyValueArray( prop, value, obj ) {
    var current = obj[ prop ];

    if ( current === undefined ) {
      obj[ prop ] = [ value ];
    } else {
      current.push( value );
    }

    return obj;
  }

  /**
   * Get all of the fields contained within the given elements by name.
   *
   * @param formElm The form element.
   * @param filter Custom filter to apply to the list of fields.
   * @returns {object} All of the fields contained within the given elements, keyed by name.
   */
  function getFieldsByName(formElm, filter ) {
    var elementsByName = {};

    // Extract fields from elements
    var fields = $(formElm)
      .map(function convertFormToElements() {
        return this.elements ? langx.makeArray( this.elements ) : this;
      })
      .filter( filter || ":input:not(:disabled)" )
      .get();

    langx.each( fields, function( index, field ) {
      updateKeyValueArray( field.name, field, elementsByName );
    });

    return elementsByName;
  }

  /**
   * Figure out the type of an element. Input type will be used first, falling back to nodeName.
   *
   * @param element DOM element to check type of.
   * @returns {string} The element's type.
   */
  function getElementType( element ) {
    return ( element.type || element.nodeName ).toLowerCase();
  }

  /**
   * Normalize the provided data into a key/valueArray store.
   *
   * @param data The data provided by the user to the plugin.
   * @returns {object} The data normalized into a key/valueArray store.
   */
  function normalizeData( data ) {
    var normalized = {};
    var rPlus = /\+/g;

    // Convert data from .serializeObject() notation
    if ( langx.isPlainObject( data ) ) {
      langx.extend( normalized, data );

      // Convert non-array values into an array
      langx.each( normalized, function( name, value ) {
        if ( !langx.isArray( value ) ) {
          normalized[ name ] = [ value ];
        }
      });

    // Convert data from .serializeArray() notation
    } else if ( langx.isArray( data ) ) {
      langx.each( data, function( index, field ) {
        updateKeyValueArray( field.name, field.value, normalized );
      });

    // Convert data from .serialize() notation
    } else if ( typeof data === "string" ) {
      langx.each( data.split( "&" ), function( index, field ) {
        var current = field.split( "=" );
        var name = decodeURIComponent( current[ 0 ].replace( rPlus, "%20" ) );
        var value = decodeURIComponent( current[ 1 ].replace( rPlus, "%20" ) );
        updateKeyValueArray( name, value, normalized );
      });
    }

    return normalized;
  }

  /**
   * Map of property name -> element types.
   *
   * @type {object}
   */
  var updateTypes = {
    checked: [
      "radio",
      "checkbox"
    ],
    selected: [
      "option",
      "select-one",
      "select-multiple"
    ],
    value: [
      "button",
      "color",
      "date",
      "datetime",
      "datetime-local",
      "email",
      "hidden",
      "month",
      "number",
      "password",
      "range",
      "reset",
      "search",
      "submit",
      "tel",
      "text",
      "textarea",
      "time",
      "url",
      "week"
    ]
  };

  /**
   * Get the property to update on an element being updated.
   *
   * @param element The DOM element to get the property for.
   * @returns The name of the property to update if element is supported, otherwise `undefined`.
   */
  function getPropertyToUpdate( element ) {
    var type = getElementType( element );
    var elementProperty = undefined;

    langx.each( updateTypes, function( property, types ) {
      if ( langx.inArray( type, types ) > -1 ) {
        elementProperty = property;
        return false;
      }
    });

    return elementProperty;
  }

  /**
   * Update the element based on the provided data.
   *
   * @param element The DOM element to update.
   * @param elementIndex The index of this element in the list of elements with the same name.
   * @param value The serialized element value.
   * @param valueIndex The index of the value in the list of values for elements with the same name.
   * @param callback A function to call if the value of an element was updated.
   */
  function update( element, elementIndex, value, valueIndex, callback ) {
    var property = getPropertyToUpdate( element );

    // Handle value inputs
    // If there are multiple value inputs with the same name, they will be populated by matching indexes.
    if ( property == "value" && elementIndex == valueIndex ) {
      element.value = value;
      callback.call( element, value );

    // Handle select menus, checkboxes and radio buttons
    } else if ( property == "checked" || property == "selected" ) {
      var fields = [];

      // Extract option fields from select menus
      if ( element.options ) {
        langx.each( element.options, function( index, option ) {
          fields.push( option );
        });

      } else {
        fields.push( element );
      }

      // #37: Remove selection from multiple select menus before deserialization
      if ( element.multiple && valueIndex == 0 ) {
        element.selectedIndex = -1;
      }

      langx.each( fields, function( index, field ) {
        if ( field.value == value ) {
          field[ property ] = true;
          callback.call( field, value );
        }
      });
    }
  }

  /**
   * Default plugin options.
   *
   * @type {object}
   */
  var defaultOptions = {
    change: langx.noop,
    complete: langx.noop
  };

  /**
   * The $.deserialize function.
   *
   * @param data The data to deserialize.
   * @param options Additional options.
   * @returns {jQuery} The jQuery object that was provided to the plugin.
   */
  function deserialize(formElm,data, options ) {

    // Backwards compatible with old arguments: data, callback
    if ( langx.isFunction( options ) ) {
      options = { complete: options };
    }

    options = langx.extend( defaultOptions, options || {} );
    data = normalizeData( data );

    var elementsByName = getFieldsByName( formElm, options.filter );

    langx.each( data, function( name, values ) {
      langx.each( elementsByName[ name ], function( elementIndex, element ) {
        langx.each( values, function( valueIndex, value ) {
          update( element, elementIndex, value, valueIndex, options.change );
        });
      });
    });

    options.complete.call( formElm );

    return this;
  };

  return forms.deserialize = deserialize;
});
define('skylark-domx-forms/serializeArray',[
  "skylark-langx/langx",
  "skylark-domx-data",
  "./forms"
],function(langx,datax,forms){
    function serializeArray(formElm) {
        var name, type, result = [],
            add = function(value) {
                if (value.forEach) return value.forEach(add)
                result.push({ name: name, value: value })
            }
        langx.each(formElm.elements, function(_, field) {
            type = field.type, name = field.name
            if (name && field.nodeName.toLowerCase() != 'fieldset' &&
                !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
                ((type != 'radio' && type != 'checkbox') || field.checked))
                add(datax.val(field))
        })
        return result
    };

    return forms.serializeArray = serializeArray;
});

define('skylark-domx-forms/serializeObject',[
  "skylark-langx/langx",
  "./forms",
  "./serializeArray"
],function(langx,forms,serializeArray){

  function serializeObject(formElm){
    var obj = {};
    
    langx.each(serializeArray(formElm), function(i,o){
      var n = o.name,
        v = o.value;
        
        obj[n] = obj[n] === undefined ? v
          : langx.isArray( obj[n] ) ? obj[n].concat( v )
          : [ obj[n], v ];
    });
    
    return obj;
  }

  return forms.serializeObject = serializeObject;
});  
define('skylark-domx-forms/serialize',[
  "skylark-langx/langx",
  "./forms",
  "./serializeArray"
],function(langx,forms,serializeArray){
    function serialize(formElm) {
        var result = []
        serializeArray(formElm).forEach(function(elm) {
            result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
        })
        return result.join('&')
    }

    return forms.serialize = serialize;
});
define('skylark-domx-forms/main',[
	"./forms",
    "skylark-domx-velm",
    "skylark-domx-query",
    "./deserialize",
    "./serializeArray",
    "./serializeObject",
    "./serialize"
],function(forms,velm,$){

    // from ./data
    velm.delegate([
        "deserialize",
        "serializeArray",
        "serializeObject",
        "serialize"
    ], forms);

    $.fn.deserialize = $.wraps.wrapper_value(forms.deserialize, forms, forms.deserialize);
    $.fn.serializeArray = $.wraps.wrapper_value(forms.serializeArray, forms, forms.serializeArray);
    $.fn.serializeObject = $.wraps.wrapper_value(forms.serializeObject, forms, forms.serializeObject);
    $.fn.serialize = $.wraps.wrapper_value(forms.serialize, forms, forms.serialize);


	return forms;
});
define('skylark-domx-forms', ['skylark-domx-forms/main'], function (main) { return main; });

define('skylark-domx-styler/styler',[
    "skylark-langx/skylark",
    "skylark-langx/langx"
], function(skylark, langx) {
    var every = Array.prototype.every,
        forEach = Array.prototype.forEach,
        camelCase = langx.camelCase,
        dasherize = langx.dasherize;

    function maybeAddPx(name, value) {
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }

    var cssNumber = {
            'column-count': 1,
            'columns': 1,
            'font-weight': 1,
            'line-height': 1,
            'opacity': 1,
            'z-index': 1,
            'zoom': 1
        },
        classReCache = {

        };

    function classRE(name) {
        return name in classReCache ?
            classReCache[name] : (classReCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
    }

    // access className property while respecting SVGAnimatedString
    /*
     * Adds the specified class(es) to each element in the set of matched elements.
     * @param {HTMLElement} node
     * @param {String} value
     */
    function className(node, value) {
        var klass = node.className || '',
            svg = klass && klass.baseVal !== undefined

        if (value === undefined) return svg ? klass.baseVal : klass
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    function disabled(elm, value ) {
        if (arguments.length < 2) {
            return !!this.dom.disabled;
        }

        elm.disabled = value;

        return this;
    }

    var elementDisplay = {};

    function defaultDisplay(nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) {
            element = document.createElement(nodeName)
            document.body.appendChild(element)
            display = getStyles(element).getPropertyValue("display")
            element.parentNode.removeChild(element)
            display == "none" && (display = "block")
            elementDisplay[nodeName] = display
        }
        return elementDisplay[nodeName]
    }
    /*
     * Display the matched elements.
     * @param {HTMLElement} elm
     */
    function show(elm) {
        styler.css(elm, "display", "");
        if (styler.css(elm, "display") == "none") {
            styler.css(elm, "display", defaultDisplay(elm.nodeName));
        }
        return this;
    }

    function isInvisible(elm) {
        return styler.css(elm, "display") == "none" || styler.css(elm, "opacity") == 0;
    }

    /*
     * Hide the matched elements.
     * @param {HTMLElement} elm
     */
    function hide(elm) {
        styler.css(elm, "display", "none");
        return this;
    }

    /*
     * Adds the specified class(es) to each element in the set of matched elements.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function addClass(elm, name) {
        if (!name) return this
        var cls = className(elm),
            names;
        if (langx.isString(name)) {
            names = name.split(/\s+/g);
        } else {
            names = name;
        }
        names.forEach(function(klass) {
            var re = classRE(klass);
            if (!cls.match(re)) {
                cls += (cls ? " " : "") + klass;
            }
        });

        className(elm, cls);

        return this;
    }

    function getStyles( elem ) {

        // Support: IE <=11 only, Firefox <=30 (#15098, #14150)
        // IE throws on elements created in popups
        // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
        var view = elem.ownerDocument.defaultView;

        if ( !view || !view.opener ) {
            view = window;
        }

        return view.getComputedStyle( elem);
    }


    /*
     * Get the value of a computed style property for the first element in the set of matched elements or set one or more CSS properties for every matched element.
     * @param {HTMLElement} elm
     * @param {String} property
     * @param {Any} value
     */
    function css(elm, property, value) {
        if (arguments.length < 3) {
            var computedStyle,
                computedStyle = getStyles(elm)
            if (langx.isString(property)) {
                return elm.style[camelCase(property)] || computedStyle.getPropertyValue(dasherize(property))
            } else if (langx.isArrayLike(property)) {
                var props = {}
                forEach.call(property, function(prop) {
                    props[prop] = (elm.style[camelCase(prop)] || computedStyle.getPropertyValue(dasherize(prop)))
                })
                return props
            }
        }

        var css = '';
        if (typeof(property) == 'string') {
            if (!value && value !== 0) {
                elm.style.removeProperty(dasherize(property));
            } else {
                css = dasherize(property) + ":" + maybeAddPx(property, value)
            }
        } else {
            for (key in property) {
                if (property[key] === undefined) {
                    continue;
                }
                if (!property[key] && property[key] !== 0) {
                    elm.style.removeProperty(dasherize(key));
                } else {
                    css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
                }
            }
        }

        elm.style.cssText += ';' + css;
        return this;
    }

    /*
     * Determine whether any of the matched elements are assigned the given class.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function hasClass(elm, name) {
        var re = classRE(name);
        return elm.className && elm.className.match(re);
    }

    /*
     * Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function removeClass(elm, name) {
        if (name) {
            var cls = className(elm),
                names;

            if (langx.isString(name)) {
                names = name.split(/\s+/g);
            } else {
                names = name;
            }

            names.forEach(function(klass) {
                var re = classRE(klass);
                if (cls.match(re)) {
                    cls = cls.replace(re, " ");
                }
            });

            className(elm, cls.trim());
        } else {
            className(elm, "");
        }

        return this;
    }

    /*
     * Add or remove one or more classes from the specified element.
     * @param {HTMLElement} elm
     * @param {String} name
     * @param {} when
     */
    function toggleClass(elm, name, when) {
        var self = this;
        name.split(/\s+/g).forEach(function(klass) {
            if (when === undefined) {
                when = !self.hasClass(elm, klass);
            }
            if (when) {
                self.addClass(elm, klass);
            } else {
                self.removeClass(elm, klass)
            }
        });

        return self;
    }

    var styler = function() {
        return styler;
    };

    langx.mixin(styler, {
        autocssfix: false,
        cssHooks: {

        },

        addClass: addClass,
        className: className,
        css: css,
        disabled : disabled,        
        hasClass: hasClass,
        hide: hide,
        isInvisible: isInvisible,
        removeClass: removeClass,
        show: show,
        toggleClass: toggleClass
    });

    return skylark.attach("domx.styler", styler);
});
define('skylark-domx-styler/main',[
	"./styler",
	"skylark-domx-velm",
	"skylark-domx-query"	
],function(styler,velm,$){
	
    // from ./styler
    velm.delegate([
        "addClass",
        "className",
        "css",
        "hasClass",
        "hide",
        "isInvisible",
        "removeClass",
        "show",
        "toggleClass"
    ], styler);

    // properties

    var properties = [ 'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
    'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
    'background', 'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'textDecoration', 'textTransform', 'cursor', 'zIndex' ];

    properties.forEach( function ( property ) {

        var method = property;

        velm.VisualElement.prototype[method ] = function (value) {

            this.css( property, value );

            return this;

        };

    });


    $.fn.style = $.wraps.wrapper_name_value(styler.css, styler);

    $.fn.css = $.wraps.wrapper_name_value(styler.css, styler);

    //hasClass(name)
    $.fn.hasClass = $.wraps.wrapper_some_chk(styler.hasClass, styler);

    //addClass(name)
    $.fn.addClass = $.wraps.wrapper_every_act_firstArgFunc(styler.addClass, styler, styler.className);

    //removeClass(name)
    $.fn.removeClass = $.wraps.wrapper_every_act_firstArgFunc(styler.removeClass, styler, styler.className);

    //toogleClass(name,when)
    $.fn.toggleClass = $.wraps.wrapper_every_act_firstArgFunc(styler.toggleClass, styler, styler.className);

    $.fn.replaceClass = function(newClass, oldClass) {
        this.removeClass(oldClass);
        this.addClass(newClass);
        return this;
    };

    $.fn.replaceClass = function(newClass, oldClass) {
        this.removeClass(oldClass);
        this.addClass(newClass);
        return this;
    };
        
	return styler;
});
define('skylark-domx-styler', ['skylark-domx-styler/main'], function (main) { return main; });

define('skylark-domx-geom/geom',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-noder",
    "skylark-domx-styler"
], function(skylark, langx, noder, styler) {
    var rootNodeRE = /^(?:body|html)$/i,
        px = langx.toPixel,
        offsetParent = noder.offsetParent,
        cachedScrollbarWidth;

    function scrollbarWidth() {
        if (cachedScrollbarWidth !== undefined) {
            return cachedScrollbarWidth;
        }
        var w1, w2,
            div = noder.createFragment("<div style=" +
                "'display:block;position:absolute;width:200px;height:200px;overflow:hidden;'>" +
                "<div style='height:300px;width:auto;'></div></div>")[0],
            innerDiv = div.childNodes[0];

        noder.append(document.body, div);

        w1 = innerDiv.offsetWidth;

        styler.css(div, "overflow", "scroll");

        w2 = innerDiv.offsetWidth;

        if (w1 === w2) {
            w2 = div[0].clientWidth;
        }

        noder.remove(div);

        return (cachedScrollbarWidth = w1 - w2);
    }
    /*
     * Get the widths of each border of the specified element.
     * @param {HTMLElement} elm
     */
    function borderExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }        var s = getComputedStyle(elm);
        return {
            left: px(s.borderLeftWidth, elm),
            top: px(s.borderTopWidth, elm),
            right: px(s.borderRightWidth, elm),
            bottom: px(s.borderBottomWidth, elm)
        }
    }

    //viewport coordinate
    /*
     * Get or set the viewport position of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function boundingPosition(elm, coords) {
        if (coords === undefined) {
            return rootNodeRE.test(elm.nodeName) ? { top: 0, left: 0 } : elm.getBoundingClientRect();
        } else {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            relativePosition(elm, {
                top: coords.top - parentOffset.top - mex.top - pbex.top,
                left: coords.left - parentOffset.left - mex.left - pbex.left
            });
            return this;
        }
    }

    /*
     * Get or set the viewport rect of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function boundingRect(elm, coords) {
        if (coords === undefined) {
            return elm.getBoundingClientRect()
        } else {
            boundingPosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }

    /*
     * Get or set the height of the specified element client box.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function clientHeight(elm, value) {
        if (value == undefined) {
            return clientSize(elm).height;
        } else {
            return clientSize(elm, {
                height: value
            });
        }
    }

    /*
     * Get or set the size of the specified element client box.
     * @param {HTMLElement} elm
     * @param {PlainObject} dimension
     */
    function clientSize(elm, dimension) {
        if (dimension == undefined) {
            return {
                width: elm.clientWidth,
                height: elm.clientHeight
            }
        } else {
            var isBorderBox = (styler.css(elm, "box-sizing") === "border-box"),
                props = {
                    width: dimension.width,
                    height: dimension.height
                };
            if (!isBorderBox) {
                var pex = paddingExtents(elm);

                if (props.width !== undefined) {
                    props.width = props.width - pex.left - pex.right;
                }

                if (props.height !== undefined) {
                    props.height = props.height - pex.top - pex.bottom;
                }
            } else {
                var bex = borderExtents(elm);

                if (props.width !== undefined) {
                    props.width = props.width + bex.left + bex.right;
                }

                if (props.height !== undefined) {
                    props.height = props.height + bex.top + bex.bottom;
                }

            }
            styler.css(elm, props);
            return this;
        }
        return {
            width: elm.clientWidth,
            height: elm.clientHeight
        };
    }

    /*
     * Get or set the width of the specified element client box.
     * @param {HTMLElement} elm
     * @param {PlainObject} dimension
     */
    function clientWidth(elm, value) {
        if (value == undefined) {
            return clientSize(elm).width;
        } else {
            clientSize(elm, {
                width: value
            });
            return this;
        }
    }

    /*
     * Get the rect of the specified element content box.
     * @param {HTMLElement} elm
     */
    function contentRect(elm) {
        var cs = clientSize(elm),
            pex = paddingExtents(elm);


        //// On Opera, offsetLeft includes the parent's border
        //if(has("opera")){
        //    pe.l += be.l;
        //    pe.t += be.t;
        //}
        return {
            left: pex.left,
            top: pex.top,
            width: cs.width - pex.left - pex.right,
            height: cs.height - pex.top - pex.bottom
        };
    }

    /*
     * Get the document size.
     * @param {HTMLDocument} doc
     */
    function getDocumentSize(doc) {
        var documentElement = doc.documentElement,
            body = doc.body,
            max = Math.max,
            scrollWidth = max(documentElement.scrollWidth, body.scrollWidth),
            clientWidth = max(documentElement.clientWidth, body.clientWidth),
            offsetWidth = max(documentElement.offsetWidth, body.offsetWidth),
            scrollHeight = max(documentElement.scrollHeight, body.scrollHeight),
            clientHeight = max(documentElement.clientHeight, body.clientHeight),
            offsetHeight = max(documentElement.offsetHeight, body.offsetHeight);

        return {
            width: scrollWidth < offsetWidth ? clientWidth : scrollWidth,
            height: scrollHeight < offsetHeight ? clientHeight : scrollHeight
        };
    }

    /*
     * Get the document size.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function height(elm, value) {
        if (value == undefined) {
            return size(elm).height;
        } else {
            size(elm, {
                height: value
            });
            return this;
        }
    }

    /*
     * Get the widths of each margin of the specified element.
     * @param {HTMLElement} elm
     */
    function marginExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }
        var s = getComputedStyle(elm);
        return {
            left: px(s.marginLeft),
            top: px(s.marginTop),
            right: px(s.marginRight),
            bottom: px(s.marginBottom),
        }
    }


    function marginRect(elm) {
        var obj = relativeRect(elm),
            me = marginExtents(elm);

        return {
            left: obj.left,
            top: obj.top,
            width: obj.width + me.left + me.right,
            height: obj.height + me.top + me.bottom
        };
    }


    function marginSize(elm) {
        var obj = size(elm),
            me = marginExtents(elm);

        return {
            width: obj.width + me.left + me.right,
            height: obj.height + me.top + me.bottom
        };
    }

    /*
     * Get the widths of each padding of the specified element.
     * @param {HTMLElement} elm
     */
    function paddingExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }
        var s = getComputedStyle(elm);
        return {
            left: px(s.paddingLeft),
            top: px(s.paddingTop),
            right: px(s.paddingRight),
            bottom: px(s.paddingBottom),
        }
    }

    /*
     * Get or set the document position of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    //coordinate to the document
    function pagePosition(elm, coords) {
        if (coords === undefined) {
            var obj = elm.getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset
            }
        } else {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                parentOffset = pagePosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            relativePosition(elm, {
                top: coords.top - parentOffset.top - mex.top - pbex.top,
                left: coords.left - parentOffset.left - mex.left - pbex.left
            });
            return this;
        }
    }

    /*
     * Get or set the document rect of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function pageRect(elm, coords) {
        if (coords === undefined) {
            var obj = elm.getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        } else {
            pagePosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }

    /*
     * Get or set the position of the specified element border box , relative to parent element.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    // coordinate relative to it's parent
    function relativePosition(elm, coords) {
        if (coords == undefined) {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                offset = boundingPosition(elm),
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            // Subtract parent offsets and element margins
            return {
                top: offset.top - parentOffset.top - pbex.top, // - mex.top,
                left: offset.left - parentOffset.left - pbex.left, // - mex.left
            }
        } else {
            var props = {
                top: coords.top,
                left: coords.left
            }

            if (styler.css(elm, "position") == "static") {
                props['position'] = "relative";
            }
            styler.css(elm, props);
            return this;
        }
    }

    /*
     * Get or set the rect of the specified element border box , relatived to parent element.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function relativeRect(elm, coords) {
        if (coords === undefined) {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                offset = boundingRect(elm),
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            // Subtract parent offsets and element margins
            return {
                top: offset.top - parentOffset.top - pbex.top, // - mex.top,
                left: offset.left - parentOffset.left - pbex.left, // - mex.left,
                width: offset.width,
                height: offset.height
            }
        } else {
            relativePosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }
    /*
     * Scroll the specified element into view.
     * @param {HTMLElement} elm
     * @param {} align
     */
    function scrollIntoView(elm, align) {
        function getOffset(elm, rootElm) {
            var x, y, parent = elm;

            x = y = 0;
            while (parent && parent != rootElm && parent.nodeType) {
                x += parent.offsetLeft || 0;
                y += parent.offsetTop || 0;
                parent = parent.offsetParent;
            }

            return { x: x, y: y };
        }

        var parentElm = elm.parentNode;
        var x, y, width, height, parentWidth, parentHeight;
        var pos = getOffset(elm, parentElm);

        x = pos.x;
        y = pos.y;
        width = elm.offsetWidth;
        height = elm.offsetHeight;
        parentWidth = parentElm.clientWidth;
        parentHeight = parentElm.clientHeight;

        if (align == "end") {
            x -= parentWidth - width;
            y -= parentHeight - height;
        } else if (align == "center") {
            x -= (parentWidth / 2) - (width / 2);
            y -= (parentHeight / 2) - (height / 2);
        }

        parentElm.scrollLeft = x;
        parentElm.scrollTop = y;

        return this;
    }
    /*
     * Get or set the current horizontal position of the scroll bar for the specified element.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function scrollLeft(elm, value) {
        if (elm.nodeType === 9) {
            elm = elm.defaultView;
        }
        var hasScrollLeft = "scrollLeft" in elm;
        if (value === undefined) {
            return hasScrollLeft ? elm.scrollLeft : elm.pageXOffset
        } else {
            if (hasScrollLeft) {
                elm.scrollLeft = value;
            } else {
                elm.scrollTo(value, elm.scrollY);
            }
            return this;
        }
    }
    /*
     * Get or the current vertical position of the scroll bar for the specified element.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function scrollTop(elm, value) {
        if (elm.nodeType === 9) {
            elm = elm.defaultView;
        }
        var hasScrollTop = "scrollTop" in elm;

        if (value === undefined) {
            return hasScrollTop ? elm.scrollTop : elm.pageYOffset
        } else {
            if (hasScrollTop) {
                elm.scrollTop = value;
            } else {
                elm.scrollTo(elm.scrollX, value);
            }
            return this;
        }
    }
    /*
     * Get or set the size of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject}dimension
     */
    function size(elm, dimension) {
        if (dimension == undefined) {
            if (langx.isWindow(elm)) {
                return {
                    width: elm.innerWidth,
                    height: elm.innerHeight
                }

            } else if (langx.isDocument(elm)) {
                return getDocumentSize(document);
            } else {
                return {
                    width: elm.offsetWidth,
                    height: elm.offsetHeight
                }
            }
        } else {
            var isBorderBox = (styler.css(elm, "box-sizing") === "border-box"),
                props = {
                    width: dimension.width,
                    height: dimension.height
                };
            if (!isBorderBox) {
                var pex = paddingExtents(elm),
                    bex = borderExtents(elm);

                if (props.width !== undefined && props.width !== "" && props.width !== null) {
                    props.width = props.width - pex.left - pex.right - bex.left - bex.right;
                }

                if (props.height !== undefined && props.height !== "" && props.height !== null) {
                    props.height = props.height - pex.top - pex.bottom - bex.top - bex.bottom;
                }
            }
            styler.css(elm, props);
            return this;
        }
    }
    /*
     * Get or set the size of the specified element border box.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function width(elm, value) {
        if (value == undefined) {
            return size(elm).width;
        } else {
            size(elm, {
                width: value
            });
            return this;
        }
    }

    function geom() {
        return geom;
    }

    langx.mixin(geom, {
        borderExtents: borderExtents,
        //viewport coordinate
        boundingPosition: boundingPosition,

        boundingRect: boundingRect,

        clientHeight: clientHeight,

        clientSize: clientSize,

        clientWidth: clientWidth,

        contentRect: contentRect,

        getDocumentSize: getDocumentSize,

        height: height,

        marginExtents: marginExtents,

        marginRect: marginRect,

        marginSize: marginSize,

        offsetParent: offsetParent,

        paddingExtents: paddingExtents,

        //coordinate to the document
        pagePosition: pagePosition,

        pageRect: pageRect,

        // coordinate relative to it's parent
        relativePosition: relativePosition,

        relativeRect: relativeRect,

        scrollbarWidth: scrollbarWidth,

        scrollIntoView: scrollIntoView,

        scrollLeft: scrollLeft,

        scrollTop: scrollTop,

        size: size,

        width: width
    });

    ( function() {
        var max = Math.max,
            abs = Math.abs,
            rhorizontal = /left|center|right/,
            rvertical = /top|center|bottom/,
            roffset = /[\+\-]\d+(\.[\d]+)?%?/,
            rposition = /^\w+/,
            rpercent = /%$/;

        function getOffsets( offsets, width, height ) {
            return [
                parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
                parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
            ];
        }

        function parseCss( element, property ) {
            return parseInt( styler.css( element, property ), 10 ) || 0;
        }

        function getDimensions( raw ) {
            if ( raw.nodeType === 9 ) {
                return {
                    size: size(raw),
                    offset: { top: 0, left: 0 }
                };
            }
            if ( noder.isWindow( raw ) ) {
                return {
                    size: size(raw),
                    offset: { 
                        top: scrollTop(raw), 
                        left: scrollLeft(raw) 
                    }
                };
            }
            if ( raw.preventDefault ) {
                return {
                    size : {
                        width: 0,
                        height: 0
                    },
                    offset: { 
                        top: raw.pageY, 
                        left: raw.pageX 
                    }
                };
            }
            return {
                size: size(raw),
                offset: pagePosition(raw)
            };
        }

        function getScrollInfo( within ) {
            var overflowX = within.isWindow || within.isDocument ? "" :
                    styler.css(within.element,"overflow-x" ),
                overflowY = within.isWindow || within.isDocument ? "" :
                    styler.css(within.element,"overflow-y" ),
                hasOverflowX = overflowX === "scroll" ||
                    ( overflowX === "auto" && within.width < scrollWidth(within.element) ),
                hasOverflowY = overflowY === "scroll" ||
                    ( overflowY === "auto" && within.height < scrollHeight(within.element));
            return {
                width: hasOverflowY ? scrollbarWidth() : 0,
                height: hasOverflowX ? scrollbarWidth() : 0
            };
        }

        function getWithinInfo( element ) {
            var withinElement = element || window,
                isWindow = noder.isWindow( withinElement),
                isDocument = !!withinElement && withinElement.nodeType === 9,
                hasOffset = !isWindow && !isDocument,
                msize = marginSize(withinElement);
            return {
                element: withinElement,
                isWindow: isWindow,
                isDocument: isDocument,
                offset: hasOffset ? pagePosition(element) : { left: 0, top: 0 },
                scrollLeft: scrollLeft(withinElement),
                scrollTop: scrollTop(withinElement),
                width: msize.width,
                height: msize.height
            };
        }

        function posit(elm,options ) {
            // Make a copy, we don't want to modify arguments
            options = langx.extend( {}, options );

            var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
                target = options.of,
                within = getWithinInfo( options.within ),
                scrollInfo = getScrollInfo( within ),
                collision = ( options.collision || "flip" ).split( " " ),
                offsets = {};

            dimensions = getDimensions( target );
            if ( target.preventDefault ) {

                // Force left top to allow flipping
                options.at = "left top";
            }
            targetWidth = dimensions.size.width;
            targetHeight = dimensions.size.height;
            targetOffset = dimensions.offset;

            // Clone to reuse original targetOffset later
            basePosition = langx.extend( {}, targetOffset );

            // Force my and at to have valid horizontal and vertical positions
            // if a value is missing or invalid, it will be converted to center
            langx.each( [ "my", "at" ], function() {
                var pos = ( options[ this ] || "" ).split( " " ),
                    horizontalOffset,
                    verticalOffset;

                if ( pos.length === 1 ) {
                    pos = rhorizontal.test( pos[ 0 ] ) ?
                        pos.concat( [ "center" ] ) :
                        rvertical.test( pos[ 0 ] ) ?
                            [ "center" ].concat( pos ) :
                            [ "center", "center" ];
                }
                pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
                pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

                // Calculate offsets
                horizontalOffset = roffset.exec( pos[ 0 ] );
                verticalOffset = roffset.exec( pos[ 1 ] );
                offsets[ this ] = [
                    horizontalOffset ? horizontalOffset[ 0 ] : 0,
                    verticalOffset ? verticalOffset[ 0 ] : 0
                ];

                // Reduce to just the positions without the offsets
                options[ this ] = [
                    rposition.exec( pos[ 0 ] )[ 0 ],
                    rposition.exec( pos[ 1 ] )[ 0 ]
                ];
            } );

            // Normalize collision option
            if ( collision.length === 1 ) {
                collision[ 1 ] = collision[ 0 ];
            }

            if ( options.at[ 0 ] === "right" ) {
                basePosition.left += targetWidth;
            } else if ( options.at[ 0 ] === "center" ) {
                basePosition.left += targetWidth / 2;
            }

            if ( options.at[ 1 ] === "bottom" ) {
                basePosition.top += targetHeight;
            } else if ( options.at[ 1 ] === "center" ) {
                basePosition.top += targetHeight / 2;
            }

            atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
            basePosition.left += atOffset[ 0 ];
            basePosition.top += atOffset[ 1 ];

            return ( function(elem) {
                var collisionPosition, using,
                    msize = marginSize(elem),
                    elemWidth = msize.width,
                    elemHeight = msize.height,
                    marginLeft = parseCss( elem, "marginLeft" ),
                    marginTop = parseCss( elem, "marginTop" ),
                    collisionWidth = elemWidth + marginLeft + parseCss( elem, "marginRight" ) +
                        scrollInfo.width,
                    collisionHeight = elemHeight + marginTop + parseCss( elem, "marginBottom" ) +
                        scrollInfo.height,
                    position = langx.extend( {}, basePosition ),
                    myOffset = getOffsets( offsets.my, msize.width, msize.height);

                if ( options.my[ 0 ] === "right" ) {
                    position.left -= elemWidth;
                } else if ( options.my[ 0 ] === "center" ) {
                    position.left -= elemWidth / 2;
                }

                if ( options.my[ 1 ] === "bottom" ) {
                    position.top -= elemHeight;
                } else if ( options.my[ 1 ] === "center" ) {
                    position.top -= elemHeight / 2;
                }

                position.left += myOffset[ 0 ];
                position.top += myOffset[ 1 ];

                collisionPosition = {
                    marginLeft: marginLeft,
                    marginTop: marginTop
                };

                langx.each( [ "left", "top" ], function( i, dir ) {
                    if ( positions[ collision[ i ] ] ) {
                        positions[ collision[ i ] ][ dir ]( position, {
                            targetWidth: targetWidth,
                            targetHeight: targetHeight,
                            elemWidth: elemWidth,
                            elemHeight: elemHeight,
                            collisionPosition: collisionPosition,
                            collisionWidth: collisionWidth,
                            collisionHeight: collisionHeight,
                            offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
                            my: options.my,
                            at: options.at,
                            within: within,
                            elem: elem
                        } );
                    }
                } );

                if ( options.using ) {

                    // Adds feedback as second argument to using callback, if present
                    using = function( props ) {
                        var left = targetOffset.left - position.left,
                            right = left + targetWidth - elemWidth,
                            top = targetOffset.top - position.top,
                            bottom = top + targetHeight - elemHeight,
                            feedback = {
                                target: {
                                    element: target,
                                    left: targetOffset.left,
                                    top: targetOffset.top,
                                    width: targetWidth,
                                    height: targetHeight
                                },
                                element: {
                                    element: elem,
                                    left: position.left,
                                    top: position.top,
                                    width: elemWidth,
                                    height: elemHeight
                                },
                                horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
                                vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
                            };
                        if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
                            feedback.horizontal = "center";
                        }
                        if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
                            feedback.vertical = "middle";
                        }
                        if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
                            feedback.important = "horizontal";
                        } else {
                            feedback.important = "vertical";
                        }
                        options.using.call( this, props, feedback );
                    };
                }

                pagePosition(elem, langx.extend( position, { using: using } ));
            })(elm);
        }

        var positions = {
            fit: {
                left: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
                        outerWidth = within.width,
                        collisionPosLeft = position.left - data.collisionPosition.marginLeft,
                        overLeft = withinOffset - collisionPosLeft,
                        overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
                        newOverRight;

                    // Element is wider than within
                    if ( data.collisionWidth > outerWidth ) {

                        // Element is initially over the left side of within
                        if ( overLeft > 0 && overRight <= 0 ) {
                            newOverRight = position.left + overLeft + data.collisionWidth - outerWidth -
                                withinOffset;
                            position.left += overLeft - newOverRight;

                        // Element is initially over right side of within
                        } else if ( overRight > 0 && overLeft <= 0 ) {
                            position.left = withinOffset;

                        // Element is initially over both left and right sides of within
                        } else {
                            if ( overLeft > overRight ) {
                                position.left = withinOffset + outerWidth - data.collisionWidth;
                            } else {
                                position.left = withinOffset;
                            }
                        }

                    // Too far left -> align with left edge
                    } else if ( overLeft > 0 ) {
                        position.left += overLeft;

                    // Too far right -> align with right edge
                    } else if ( overRight > 0 ) {
                        position.left -= overRight;

                    // Adjust based on position and margin
                    } else {
                        position.left = max( position.left - collisionPosLeft, position.left );
                    }
                },
                top: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
                        outerHeight = data.within.height,
                        collisionPosTop = position.top - data.collisionPosition.marginTop,
                        overTop = withinOffset - collisionPosTop,
                        overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
                        newOverBottom;

                    // Element is taller than within
                    if ( data.collisionHeight > outerHeight ) {

                        // Element is initially over the top of within
                        if ( overTop > 0 && overBottom <= 0 ) {
                            newOverBottom = position.top + overTop + data.collisionHeight - outerHeight -
                                withinOffset;
                            position.top += overTop - newOverBottom;

                        // Element is initially over bottom of within
                        } else if ( overBottom > 0 && overTop <= 0 ) {
                            position.top = withinOffset;

                        // Element is initially over both top and bottom of within
                        } else {
                            if ( overTop > overBottom ) {
                                position.top = withinOffset + outerHeight - data.collisionHeight;
                            } else {
                                position.top = withinOffset;
                            }
                        }

                    // Too far up -> align with top
                    } else if ( overTop > 0 ) {
                        position.top += overTop;

                    // Too far down -> align with bottom edge
                    } else if ( overBottom > 0 ) {
                        position.top -= overBottom;

                    // Adjust based on position and margin
                    } else {
                        position.top = max( position.top - collisionPosTop, position.top );
                    }
                }
            },
            flip: {
                left: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.offset.left + within.scrollLeft,
                        outerWidth = within.width,
                        offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
                        collisionPosLeft = position.left - data.collisionPosition.marginLeft,
                        overLeft = collisionPosLeft - offsetLeft,
                        overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
                        myOffset = data.my[ 0 ] === "left" ?
                            -data.elemWidth :
                            data.my[ 0 ] === "right" ?
                                data.elemWidth :
                                0,
                        atOffset = data.at[ 0 ] === "left" ?
                            data.targetWidth :
                            data.at[ 0 ] === "right" ?
                                -data.targetWidth :
                                0,
                        offset = -2 * data.offset[ 0 ],
                        newOverRight,
                        newOverLeft;

                    if ( overLeft < 0 ) {
                        newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth -
                            outerWidth - withinOffset;
                        if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
                            position.left += myOffset + atOffset + offset;
                        }
                    } else if ( overRight > 0 ) {
                        newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset +
                            atOffset + offset - offsetLeft;
                        if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
                            position.left += myOffset + atOffset + offset;
                        }
                    }
                },
                top: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.offset.top + within.scrollTop,
                        outerHeight = within.height,
                        offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
                        collisionPosTop = position.top - data.collisionPosition.marginTop,
                        overTop = collisionPosTop - offsetTop,
                        overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
                        top = data.my[ 1 ] === "top",
                        myOffset = top ?
                            -data.elemHeight :
                            data.my[ 1 ] === "bottom" ?
                                data.elemHeight :
                                0,
                        atOffset = data.at[ 1 ] === "top" ?
                            data.targetHeight :
                            data.at[ 1 ] === "bottom" ?
                                -data.targetHeight :
                                0,
                        offset = -2 * data.offset[ 1 ],
                        newOverTop,
                        newOverBottom;
                    if ( overTop < 0 ) {
                        newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight -
                            outerHeight - withinOffset;
                        if ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) {
                            position.top += myOffset + atOffset + offset;
                        }
                    } else if ( overBottom > 0 ) {
                        newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset +
                            offset - offsetTop;
                        if ( newOverTop > 0 || abs( newOverTop ) < overBottom ) {
                            position.top += myOffset + atOffset + offset;
                        }
                    }
                }
            },
            flipfit: {
                left: function() {
                    positions.flip.left.apply( this, arguments );
                    positions.fit.left.apply( this, arguments );
                },
                top: function() {
                    positions.flip.top.apply( this, arguments );
                    positions.fit.top.apply( this, arguments );
                }
            }
        };

        geom.posit = posit;
    })();

    return skylark.attach("domx.geom", geom);
});
define('skylark-domx-geom/main',[
    "skylark-langx/langx",
    "./geom",
    "skylark-domx-velm",
    "skylark-domx-query"        
],function(langx,geom,velm,$){
   // from ./geom
    velm.delegate([
        "borderExtents",
        "boundingPosition",
        "boundingRect",
        "clientHeight",
        "clientSize",
        "clientWidth",
        "contentRect",
        "height",
        "marginExtents",
        "offsetParent",
        "paddingExtents",
        "pagePosition",
        "pageRect",
        "relativePosition",
        "relativeRect",
        "scrollIntoView",
        "scrollLeft",
        "scrollTop",
        "size",
        "width"
    ], geom);

    $.fn.offset = $.wraps.wrapper_value(geom.pagePosition, geom, geom.pagePosition);

    $.fn.scrollTop = $.wraps.wrapper_value(geom.scrollTop, geom);

    $.fn.scrollLeft = $.wraps.wrapper_value(geom.scrollLeft, geom);

    $.fn.position =  function(options) {
        if (!this.length) {
            return this;
        }

        if (options) {
            if (options.of && options.of.length) {
                options = langx.clone(options);
                options.of = options.of[0];
            }
            return this.each( function() {
                geom.posit(this,options);
            });
        } else {
            var elem = this[0];

            return geom.relativePosition(elem);

        }             
    };

    $.fn.offsetParent = $.wraps.wrapper_map(geom.offsetParent, geom);


    $.fn.size = $.wraps.wrapper_value(geom.size, geom);

    $.fn.width = $.wraps.wrapper_value(geom.width, geom, geom.width);

    $.fn.height = $.wraps.wrapper_value(geom.height, geom, geom.height);

    $.fn.clientSize = $.wraps.wrapper_value(geom.clientSize, geom.clientSize);
    
    ['width', 'height'].forEach(function(dimension) {
        var offset, Dimension = dimension.replace(/./, function(m) {
            return m[0].toUpperCase()
        });

        $.fn['outer' + Dimension] = function(margin, value) {
            if (arguments.length) {
                if (typeof margin !== 'boolean') {
                    value = margin;
                    margin = false;
                }
            } else {
                margin = false;
                value = undefined;
            }

            if (value === undefined) {
                var el = this[0];
                if (!el) {
                    return undefined;
                }
                var cb = geom.size(el);
                if (margin) {
                    var me = geom.marginExtents(el);
                    cb.width = cb.width + me.left + me.right;
                    cb.height = cb.height + me.top + me.bottom;
                }
                return dimension === "width" ? cb.width : cb.height;
            } else {
                return this.each(function(idx, el) {
                    var mb = {};
                    var me = geom.marginExtents(el);
                    if (dimension === "width") {
                        mb.width = value;
                        if (margin) {
                            mb.width = mb.width - me.left - me.right
                        }
                    } else {
                        mb.height = value;
                        if (margin) {
                            mb.height = mb.height - me.top - me.bottom;
                        }
                    }
                    geom.size(el, mb);
                })

            }
        };
    })

    $.fn.innerWidth = $.wraps.wrapper_value(geom.clientWidth, geom, geom.clientWidth);

    $.fn.innerHeight = $.wraps.wrapper_value(geom.clientHeight, geom, geom.clientHeight);

    return geom;
});
define('skylark-domx-geom', ['skylark-domx-geom/main'], function (main) { return main; });

define('skylark-domx-fx/fx',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-browser",
    "skylark-domx-noder",
    "skylark-domx-geom",
    "skylark-domx-styler",
    "skylark-domx-eventer"
], function(skylark, langx, browser, noder, geom, styler, eventer) {
    var animationName,
        animationDuration,
        animationTiming,
        animationDelay,
        transitionProperty,
        transitionDuration,
        transitionTiming,
        transitionDelay,

        animationEnd = browser.normalizeCssEvent('AnimationEnd'),
        transitionEnd = browser.normalizeCssEvent('TransitionEnd'),

        supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
        transform = browser.css3PropPrefix + "transform",
        cssReset = {};


    cssReset[animationName = browser.normalizeCssProperty("animation-name")] =
        cssReset[animationDuration = browser.normalizeCssProperty("animation-duration")] =
        cssReset[animationDelay = browser.normalizeCssProperty("animation-delay")] =
        cssReset[animationTiming = browser.normalizeCssProperty("animation-timing-function")] = "";

    cssReset[transitionProperty = browser.normalizeCssProperty("transition-property")] =
        cssReset[transitionDuration = browser.normalizeCssProperty("transition-duration")] =
        cssReset[transitionDelay = browser.normalizeCssProperty("transition-delay")] =
        cssReset[transitionTiming = browser.normalizeCssProperty("transition-timing-function")] = "";



    /*   
     * Perform a custom animation of a set of CSS properties.
     * @param {Object} elm  
     * @param {Number or String} properties
     * @param {String} ease
     * @param {Number or String} duration
     * @param {Function} callback
     * @param {Number or String} delay
     */
    function animate(elm, properties, duration, ease, callback, delay) {
        var key,
            cssValues = {},
            cssProperties = [],
            transforms = "",
            that = this,
            endEvent,
            wrappedCallback,
            fired = false,
            hasScrollTop = false,
            resetClipAuto = false;

        if (langx.isPlainObject(duration)) {
            ease = duration.easing;
            callback = duration.complete;
            delay = duration.delay;
            duration = duration.duration;
        }

        if (langx.isString(duration)) {
            duration = fx.speeds[duration];
        }
        if (duration === undefined) {
            duration = fx.speeds.normal;
        }
        duration = duration / 1000;
        if (fx.off) {
            duration = 0;
        }

        if (langx.isFunction(ease)) {
            callback = ease;
            eace = "swing";
        } else {
            ease = ease || "swing";
        }

        if (delay) {
            delay = delay / 1000;
        } else {
            delay = 0;
        }

        if (langx.isString(properties)) {
            // keyframe animation
            cssValues[animationName] = properties;
            cssValues[animationDuration] = duration + "s";
            cssValues[animationTiming] = ease;
            endEvent = animationEnd;
        } else {
            // CSS transitions
            for (key in properties) {
                var v = properties[key];
                if (supportedTransforms.test(key)) {
                    transforms += key + "(" + v + ") ";
                } else {
                    if (key === "scrollTop") {
                        hasScrollTop = true;
                    }
                    if (key == "clip" && langx.isPlainObject(v)) {
                        cssValues[key] = "rect(" + v.top+"px,"+ v.right +"px,"+ v.bottom +"px,"+ v.left+"px)";
                        if (styler.css(elm,"clip") == "auto") {
                            var size = geom.size(elm);
                            styler.css(elm,"clip","rect("+"0px,"+ size.width +"px,"+ size.height +"px,"+"0px)");  
                            resetClipAuto = true;
                        }

                    } else {
                        cssValues[key] = v;
                    }
                    cssProperties.push(langx.dasherize(key));
                }
            }
            endEvent = transitionEnd;
        }

        if (transforms) {
            cssValues[transform] = transforms;
            cssProperties.push(transform);
        }

        if (duration > 0 && langx.isPlainObject(properties)) {
            cssValues[transitionProperty] = cssProperties.join(", ");
            cssValues[transitionDuration] = duration + "s";
            cssValues[transitionDelay] = delay + "s";
            cssValues[transitionTiming] = ease;
        }

        wrappedCallback = function(event) {
            fired = true;
            if (event) {
                if (event.target !== event.currentTarget) {
                    return // makes sure the event didn't bubble from "below"
                }
                eventer.off(event.target, endEvent, wrappedCallback)
            } else {
                eventer.off(elm, animationEnd, wrappedCallback) // triggered by setTimeout
            }
            styler.css(elm, cssReset);
            if (resetClipAuto) {
 //               styler.css(elm,"clip","auto");
            }
            callback && callback.call(this);
        };

        if (duration > 0) {
            eventer.on(elm, endEvent, wrappedCallback);
            // transitionEnd is not always firing on older Android phones
            // so make sure it gets fired
            langx.debounce(function() {
                if (fired) {
                    return;
                }
                wrappedCallback.call(that);
            }, ((duration + delay) * 1000) + 25)();
        }

        // trigger page reflow so new elements can animate
        elm.clientLeft;

        styler.css(elm, cssValues);

        if (duration <= 0) {
            langx.debounce(function() {
                if (fired) {
                    return;
                }
                wrappedCallback.call(that);
            }, 0)();
        }

        if (hasScrollTop) {
            scrollToTop(elm, properties["scrollTop"], duration, callback);
        }

        return this;
    }

    /*   
     * Display an element.
     * @param {Object} elm  
     * @param {String} speed
     * @param {Function} callback
     */
    function show(elm, speed, callback) {
        styler.show(elm);
        if (speed) {
            if (!callback && langx.isFunction(speed)) {
                callback = speed;
                speed = "normal";
            }
            styler.css(elm, "opacity", 0)
            animate(elm, { opacity: 1, scale: "1,1" }, speed, callback);
        }
        return this;
    }


    /*   
     * Hide an element.
     * @param {Object} elm  
     * @param {String} speed
     * @param {Function} callback
     */
    function hide(elm, speed, callback) {
        if (speed) {
            if (!callback && langx.isFunction(speed)) {
                callback = speed;
                speed = "normal";
            }
            animate(elm, { opacity: 0, scale: "0,0" }, speed, function() {
                styler.hide(elm);
                if (callback) {
                    callback.call(elm);
                }
            });
        } else {
            styler.hide(elm);
        }
        return this;
    }

    /*   
     * Set the vertical position of the scroll bar for an element.
     * @param {Object} elm  
     * @param {Number or String} pos
     * @param {Number or String} speed
     * @param {Function} callback
     */
    function scrollToTop(elm, pos, speed, callback) {
        var scrollFrom = parseInt(elm.scrollTop),
            i = 0,
            runEvery = 5, // run every 5ms
            freq = speed * 1000 / runEvery,
            scrollTo = parseInt(pos);

        var interval = setInterval(function() {
            i++;

            if (i <= freq) elm.scrollTop = (scrollTo - scrollFrom) / freq * i + scrollFrom;

            if (i >= freq + 1) {
                clearInterval(interval);
                if (callback) langx.debounce(callback, 1000)();
            }
        }, runEvery);
    }

    /*   
     * Display or hide an element.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {Function} callback
     */
    function toggle(elm, speed, callback) {
        if (styler.isInvisible(elm)) {
            show(elm, speed, callback);
        } else {
            hide(elm, speed, callback);
        }
        return this;
    }

    /*   
     * Adjust the opacity of an element.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {Number or String} opacity
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeTo(elm, speed, opacity, easing, callback) {
        animate(elm, { opacity: opacity }, speed, easing, callback);
        return this;
    }


    /*   
     * Display an element by fading them to opaque.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeIn(elm, speed, easing, callback) {
        var target = styler.css(elm, "opacity");
        if (target > 0) {
            styler.css(elm, "opacity", 0);
        } else {
            target = 1;
        }
        styler.show(elm);

        fadeTo(elm, speed, target, easing, callback);

        return this;
    }

    /*   
     * Hide an element by fading them to transparent.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeOut(elm, speed, easing, callback) {
        var _elm = elm,
            complete,
            opacity = styler.css(elm,"opacity"),
            options = {};

        if (langx.isPlainObject(speed)) {
            options.easing = speed.easing;
            options.duration = speed.duration;
            complete = speed.complete;
        } else {
            options.duration = speed;
            if (callback) {
                complete = callback;
                options.easing = easing;
            } else {
                complete = easing;
            }
        }
        options.complete = function() {
            styler.css(elm,"opacity",opacity);
            styler.hide(elm);
            if (complete) {
                complete.call(elm);
            }
        }

        fadeTo(elm, options, 0);

        return this;
    }

    /*   
     * Display or hide an element by animating its opacity.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} ceasing
     * @param {Function} callback
     */
    function fadeToggle(elm, speed, ceasing, allback) {
        if (styler.isInvisible(elm)) {
            fadeIn(elm, speed, easing, callback);
        } else {
            fadeOut(elm, speed, easing, callback);
        }
        return this;
    }

    /*   
     * Display an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideDown(elm, duration, callback) {

        // get the element position to restore it then
        var position = styler.css(elm, 'position');

        // show element if it is hidden
        show(elm);

        // place it so it displays as usually but hidden
        styler.css(elm, {
            position: 'absolute',
            visibility: 'hidden'
        });

        // get naturally height, margin, padding
        var marginTop = styler.css(elm, 'margin-top');
        var marginBottom = styler.css(elm, 'margin-bottom');
        var paddingTop = styler.css(elm, 'padding-top');
        var paddingBottom = styler.css(elm, 'padding-bottom');
        var height = styler.css(elm, 'height');

        // set initial css for animation
        styler.css(elm, {
            position: position,
            visibility: 'visible',
            overflow: 'hidden',
            height: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0
        });

        // animate to gotten height, margin and padding
        animate(elm, {
            height: height,
            marginTop: marginTop,
            marginBottom: marginBottom,
            paddingTop: paddingTop,
            paddingBottom: paddingBottom
        }, {
            duration: duration,
            complete: function() {
                if (callback) {
                    callback.apply(elm);
                }
            }
        });

        return this;
    }

    /*   
     * Hide an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideUp(elm, duration, callback) {
        // active the function only if the element is visible
        if (geom.height(elm) > 0) {

            // get the element position to restore it then
            var position = styler.css(elm, 'position');

            // get the element height, margin and padding to restore them then
            var height = styler.css(elm, 'height');
            var marginTop = styler.css(elm, 'margin-top');
            var marginBottom = styler.css(elm, 'margin-bottom');
            var paddingTop = styler.css(elm, 'padding-top');
            var paddingBottom = styler.css(elm, 'padding-bottom');

            // set initial css for animation
            styler.css(elm, {
                visibility: 'visible',
                overflow: 'hidden',
                height: height,
                marginTop: marginTop,
                marginBottom: marginBottom,
                paddingTop: paddingTop,
                paddingBottom: paddingBottom
            });

            // animate element height, margin and padding to zero
            animate(elm, {
                height: 0,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: 0,
                paddingBottom: 0
            }, {
                // callback : restore the element position, height, margin and padding to original values
                duration: duration,
                queue: false,
                complete: function() {
                    hide(elm);
                    styler.css(elm, {
                        visibility: 'visible',
                        overflow: 'hidden',
                        height: height,
                        marginTop: marginTop,
                        marginBottom: marginBottom,
                        paddingTop: paddingTop,
                        paddingBottom: paddingBottom
                    });
                    if (callback) {
                        callback.apply(elm);
                    }
                }
            });
        }
        return this;
    }


    /*   
     * Display or hide an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideToggle(elm, duration, callback) {

        // if the element is hidden, slideDown !
        if (geom.height(elm) == 0) {
            slideDown(elm, duration, callback);
        }
        // if the element is visible, slideUp !
        else {
            slideUp(elm, duration, callback);
        }
        return this;
    }

    function emulateTransitionEnd(elm,duration) {
        var called = false;
        eventer.one(elm,'transitionEnd', function () { 
            called = true;
        })
        var callback = function () { 
            if (!called) {
                eventer.trigger(elm,browser.support.transition.end) 
            }
        };
        setTimeout(callback, duration);
        
        return this;
    } 

    /*   
     *
     * @param {Node} elm
     * @param {Node} params
     */
    function overlay(elm, params) {
        var overlayDiv = noder.createElement("div", params);
        styler.css(overlayDiv, {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0x7FFFFFFF,
            opacity: 0.7
        });
        elm.appendChild(overlayDiv);
        return overlayDiv;

    }
    
    /*   
     * Replace an old node with the specified node.
     * @param {HTMLElement} elm
     * @param {Node} params
     */
    function throb(elm, params) {
        params = params || {};
        var self = this,
            text = params.text,
            style = params.style,
            time = params.time,
            callback = params.callback,
            timer,

            throbber = noder.createElement("div", {
                "class": params.className || "throbber"
            }),
            _overlay = overlay(throbber, {
                "class": 'overlay fade'
            }),
            throb = noder.createElement("div", {
                "class": "throb"
            }),
            textNode = noder.createTextNode(text || ""),
            remove = function() {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                if (throbber) {
                    noder.remove(throbber);
                    throbber = null;
                }
            },
            update = function(params) {
                if (params && params.text && throbber) {
                    textNode.nodeValue = params.text;
                }
            };
        if (params.style) {
            styler.css(throbber,params.style);
        }
        throb.appendChild(textNode);
        throbber.appendChild(throb);
        elm.appendChild(throbber);
        var end = function() {
            remove();
            if (callback) callback();
        };
        if (time) {
            timer = setTimeout(end, time);
        }

        return {
            remove: remove,
            update: update
        };
    }

    function fx() {
        return fx;
    }

    langx.mixin(fx, {
        off: false,

        speeds: {
            normal: 400,
            fast: 200,
            slow: 600
        },

        animate,
        emulateTransitionEnd,
        fadeIn,
        fadeOut,
        fadeTo,
        fadeToggle,
        hide,
        scrollToTop,

        slideDown,
        slideToggle,
        slideUp,
        show,
        throb,
        toggle
    });

    return skylark.attach("domx.fx", fx);
});
define('skylark-domx-fx/main',[
	"./fx",
	"skylark-domx-velm",
	"skylark-domx-query"	
],function(fx,velm,$){
    // from ./fx
    velm.delegate([
        "animate",
        "emulateTransitionEnd",
        "fadeIn",
        "fadeOut",
        "fadeTo",
        "fadeToggle",
        "hide",
        "scrollToTop",
        "slideDown",
        "slideToggle",
        "slideUp",
        "show",
        "toggle"
    ], fx);

    $.fn.hide =  $.wraps.wrapper_every_act(fx.hide, fx);

    $.fn.animate = $.wraps.wrapper_every_act(fx.animate, fx);
    $.fn.emulateTransitionEnd = $.wraps.wrapper_every_act(fx.emulateTransitionEnd, fx);

    $.fn.show = $.wraps.wrapper_every_act(fx.show, fx);
    $.fn.hide = $.wraps.wrapper_every_act(fx.hide, fx);
    $.fn.toogle = $.wraps.wrapper_every_act(fx.toogle, fx);
    $.fn.fadeTo = $.wraps.wrapper_every_act(fx.fadeTo, fx);
    $.fn.fadeIn = $.wraps.wrapper_every_act(fx.fadeIn, fx);
    $.fn.fadeOut = $.wraps.wrapper_every_act(fx.fadeOut, fx);
    $.fn.fadeToggle = $.wraps.wrapper_every_act(fx.fadeToggle, fx);

    $.fn.slideDown = $.wraps.wrapper_every_act(fx.slideDown, fx);
    $.fn.slideToggle = $.wraps.wrapper_every_act(fx.slideToggle, fx);
    $.fn.slideUp = $.wraps.wrapper_every_act(fx.slideUp, fx);

	return fx;
});
define('skylark-domx-fx', ['skylark-domx-fx/main'], function (main) { return main; });

define('skylark-domx-scripter/scripter',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-noder",
    "skylark-domx-finder"
], function(skylark, langx, noder, finder) {

    var head = document.getElementsByTagName('head')[0],
        scriptsByUrl = {},
        scriptElementsById = {},
        count = 0;

    var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );

    function scripter() {
        return scripter;
    }


    var preservedScriptAttributes = {
        type: true,
        src: true,
        nonce: true,
        noModule: true
    };

    function evaluate(code,node, doc ) {
        doc = doc || document;

        var i, val,
            script = doc.createElement("script");

        script.text = code;
        if ( node ) {
            for ( i in preservedScriptAttributes ) {

                // Support: Firefox 64+, Edge 18+
                // Some browsers don't support the "nonce" property on scripts.
                // On the other hand, just using `getAttribute` is not enough as
                // the `nonce` attribute is reset to an empty string whenever it
                // becomes browsing-context connected.
                // See https://github.com/whatwg/html/issues/2369
                // See https://html.spec.whatwg.org/#nonce-attributes
                // The `node.getAttribute` check was added for the sake of
                // `jQuery.globalEval` so that it can fake a nonce-containing node
                // via an object.
                val = node[ i ] || node.getAttribute && node.getAttribute( i );
                if ( val ) {
                    script.setAttribute( i, val );
                }
            }
        }
        doc.head.appendChild( script ).parentNode.removeChild( script );

        return this;
    }

    langx.mixin(scripter, {
        /*
         * Load a script from a url into the document.
         * @param {} url
         * @param {} loadedCallback
         * @param {} errorCallback
         */
        loadJavaScript: function(url, loadedCallback, errorCallback) {
            var script = scriptsByUrl[url];
            if (!script) {
                script = scriptsByUrl[url] = {
                    state: 0, //0:unload,1:loaded,-1:loaderror
                    loadedCallbacks: [],
                    errorCallbacks: []
                }
            }

            script.loadedCallbacks.push(loadedCallback);
            script.errorCallbacks.push(errorCallback);

            if (script.state === 1) {
                script.node.onload();
            } else if (script.state === -1) {
                script.node.onerror();
            } else {
                var node = script.node = document.createElement("script"),
                    id = script.id = (count++);

                node.type = "text/javascript";
                node.async = false;
                node.defer = false;
                startTime = new Date().getTime();
                head.appendChild(node);

                node.onload = function() {
                        script.state = 1;

                        var callbacks = script.loadedCallbacks,
                            i = callbacks.length;

                        while (i--) {
                            callbacks[i]();
                        }
                        script.loadedCallbacks = [];
                        script.errorCallbacks = [];
                    },
                    node.onerror = function() {
                        script.state = -1;
                        var callbacks = script.errorCallbacks,
                            i = callbacks.length;

                        while (i--) {
                            callbacks[i]();
                        }
                        script.loadedCallbacks = [];
                        script.errorCallbacks = [];
                    };
                node.src = url;

                scriptElementsById[id] = node;
            }
            return script.id;
        },
        /*
         * Remove the specified script from the document.
         * @param {Number} id
         */
        deleteJavaScript: function(id) {
            var node = scriptElementsById[id];
            if (node) {
                var url = node.src;
                noder.remove(node);
                delete scriptElementsById[id];
                delete scriptsByUrl[url];
            }
        },

        evaluate : evaluate,

        html : function(node,value) {

            var result = noder.html(node,value);

            if (value !== undefined) {
                var scripts = node.querySelectorAll('script');

                for (var i =0; i<scripts.length; i++) {
                    var node1 = scripts[i];
                    if (rscriptType.test( node1.type || "" ) ) {
                      evaluate(node1.textContent,node1);
                    }
                }       
                return this;         
            } else {
                return result;
            }



        }
    });

    return skylark.attach("domx.scripter", scripter);
});
define('skylark-domx-scripter/main',[
	"./scripter",
	"skylark-domx-query"
],function(scripter,$){

    $.fn.html = $.wraps.wrapper_value(scripter.html, scripter, scripter.html);

	return scripter;
});
define('skylark-domx-scripter', ['skylark-domx-scripter/main'], function (main) { return main; });

define('skylark-jquery/core',[
	"skylark-langx/skylark",
	"skylark-langx/langx",
	"skylark-domx-browser",
	"skylark-domx-noder",
	"skylark-domx-data",
	"skylark-domx-eventer",
	"skylark-domx-finder",
	"skylark-domx-forms",
	"skylark-domx-fx",
	"skylark-domx-styler",
	"skylark-domx-query",
	"skylark-domx-scripter"
],function(skylark,langx,browser,noder,datax,eventer,finder,forms,fx,styler,query,scripter){
	var filter = Array.prototype.filter,
		slice = Array.prototype.slice;

    (function($){
	    $.fn.jquery = '2.2.0';

	    $.browser = browser;
	    
	    $.camelCase = langx.camelCase;

		$.cleanData = function( elems ) {
			var elem,
				i = 0;

			for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
				datax.cleanData(elem);
			}
		};

		$.removeData = function(elm,name) {
			datax.removeData(elm,name);
		}
	
	    $.each = langx.each;

	    $.extend = langx.extend;

	    $.grep = function(elements, callback) {
	        return filter.call(elements, callback)
	    };

	    $.attr = function(elm,name) {
	    	return datax.attr(elm,name);
	    };

	    $.isArray = langx.isArray;
	    $.isEmptyObject = langx.isEmptyObject;
	    $.isFunction = langx.isFunction;
	    $.isWindow = langx.isWindow;
	    $.isPlainObject = langx.isPlainObject;
        $.isNumeric = langx.isNumber;

	    $.inArray = langx.inArray;

	    $.makeArray = langx.makeArray;
	    $.map = langx.map;  // The behavior is somewhat different from the original jquery.

	    $.noop = function() {
	    };

	    $.parseJSON = window.JSON.parse;

	    $.proxy = langx.proxy;

	    $.trim = langx.trim;
	    $.type = langx.type;

	    $.fn.extend = function(props) {
	        langx.mixin($.fn, props);
	    };


    })(query);

    (function($){
        $.Event = function Event(src, props) {
            if (langx.isString(src)) {
            	var type = src;
            	return eventer.create(type, props);
	        }
            return eventer.proxy(src, props);
        };

        $.event = {};

	    $.event.special = eventer.special;

	    $.fn.submit = function(callback) {
	        if (0 in arguments) this.bind('submit', callback)
	        else if (this.length) {
	            var event = $.Event('submit')
	            this.eq(0).trigger(event)
	            if (!event.isDefaultPrevented()) this.get(0).submit()
	        }
	        return this
	    };

	    // event
	    $.fn.triggerHandler = $.fn.trigger;

	    $.fn.delegate = function(selector, event, callback) {
	        return this.on(event, selector, callback)
	    };

	    $.fn.undelegate = function(selector, event, callback) {
	        return this.off(event, selector, callback)
	    };

	    $.fn.live = function(event, callback) {
	        $(document.body).delegate(this.selector, event, callback)
	        return this
	    };

	    $.fn.die = function(event, callback) {
	        $(document.body).undelegate(this.selector, event, callback)
	        return this
	    };

	    $.fn.bind = function(event, selector, data, callback) {
	        return this.on(event, selector, data, callback)
	    };

	    $.fn.unbind = function(event, callback) {
	        return this.off(event, callback)
	    };

	    $.fn.ready = function(callback) {
	        eventer.ready(callback);
	        return this;
	    };

	    $.fn.stop = function() {
	        // todo
	        return this;
	    };

	    $.fn.moveto = function(x, y) {
	        return this.animate({
	            left: x + "px",
	            top: y + "px"
	        }, 0.4);

	    };

	    $.ready = eventer.ready;

	    $.on = eventer.on;

	    $.off = eventer.off;
    })(query);

    (function($){
	    // plugin compatibility
	    $.uuid = 0;
	    $.support = browser.support;
	    $.expr = {};

	    $.expr[":"] = $.expr.pseudos = $.expr.filters = finder.pseudos;

	    $.expr.createPseudo = function(fn) {
	    	return fn;
	    };

	    $.cssHooks = styler.cssHooks;

	    $.contains = noder.contains;

	    $.css = styler.css;

	    $.data = datax.data;

	    $.fx = fx;
	    $.fx.step = {

        };

        $.speed = function( speed, easing, fn ) {
            var opt = speed && typeof speed === "object" ? $.extend( {}, speed ) : {
                complete: fn || !fn && easing ||
                    $.isFunction( speed ) && speed,
                duration: speed,
                easing: fn && easing || easing && !$.isFunction( easing ) && easing
            };

            // Go to the end state if fx are off
            if ( $.fx.off ) {
                opt.duration = 0;

            } else {
                if ( typeof opt.duration !== "number" ) {
                    if ( opt.duration in $.fx.speeds ) {
                        opt.duration = $.fx.speeds[ opt.duration ];

                    } else {
                        opt.duration = $.fx.speeds._default;
                    }
                }
            }

            // Normalize opt.queue - true/undefined/null -> "fx"
            if ( opt.queue == null || opt.queue === true ) {
                opt.queue = "fx";
            }

            // Queueing
            opt.old = opt.complete;

            opt.complete = function() {
                if ( $.isFunction( opt.old ) ) {
                    opt.old.call( this );
                }

                if ( opt.queue ) {
                    $.dequeue( this, opt.queue );
                }
            };

            return opt;
        };

        $.easing = {};

	    $.offset = {};
	    $.offset.setOffset = function(elem, options, i) {
	        var position = $.css(elem, "position");

	        // set position first, in-case top/left are set even on static elem
	        if (position === "static") {
	            elem.style.position = "relative";
	        }

	        var curElem = $(elem),
	            curOffset = curElem.offset(),
	            curCSSTop = $.css(elem, "top"),
	            curCSSLeft = $.css(elem, "left"),
	            calculatePosition = (position === "absolute" || position === "fixed") && $.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
	            props = {},
	            curPosition = {},
	            curTop, curLeft;

	        // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
	        if (calculatePosition) {
	            curPosition = curElem.position();
	            curTop = curPosition.top;
	            curLeft = curPosition.left;
	        } else {
	            curTop = parseFloat(curCSSTop) || 0;
	            curLeft = parseFloat(curCSSLeft) || 0;
	        }

	        if ($.isFunction(options)) {
	            options = options.call(elem, i, curOffset);
	        }

	        if (options.top != null) {
	            props.top = (options.top - curOffset.top) + curTop;
	        }
	        if (options.left != null) {
	            props.left = (options.left - curOffset.left) + curLeft;
	        }

	        if ("using" in options) {
	            options.using.call(elem, props);
	        } else {
	            curElem.css(props);
	        }
	    };

        $._data = function(elm,propName) {
            if (elm.hasAttribute) {
                return datax.data(elm,propName);
            } else {
                return {};
            }
        };

     	var t = $.fn.text;  
	    $.fn.text = function(v) {
	        var r = t.apply(this,arguments);
	        if (r === undefined) {
	            r = "";
	        }  
	        return r;
	    };       

	    $.fn.pos = $.fn.position;
        	    
    })(query);

    query.parseHTML = function(html) {
        return  noder.createFragment(html);
    };

    query.uniqueSort = query.unique = langx.uniq;

    query.skylark = skylark;

    return window.jQuery = window.$ = query;
});

define('skylark-net-http/http',[
  "skylark-langx-ns/ns",
],function(skylark){
	return skylark.attach("net.http",{});
});
define('skylark-net-http/Xhr',[
  "skylark-langx-ns/ns",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "skylark-langx-funcs",
  "skylark-langx-async/Deferred",
  "skylark-langx-emitter/Evented",
  "./http"
],function(skylark,types,objects,arrays,funcs,Deferred,Evented,http){

    var each = objects.each,
        mixin = objects.mixin,
        noop = funcs.noop,
        isArray = types.isArray,
        isFunction = types.isFunction,
        isPlainObject = types.isPlainObject,
        type = types.type;
 
     var getAbsoluteUrl = (function() {
        var a;

        return function(url) {
            if (!a) a = document.createElement('a');
            a.href = url;

            return a.href;
        };
    })();
   
    var Xhr = (function(){
        var jsonpID = 0,
            key,
            name,
            rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            scriptTypeRE = /^(?:text|application)\/javascript/i,
            xmlTypeRE = /^(?:text|application)\/xml/i,
            jsonType = 'application/json',
            htmlType = 'text/html',
            blankRE = /^\s*$/;

        var XhrDefaultOptions = {
            async: true,

            // Default type of request
            type: 'GET',
            // Callback that is executed before request
            beforeSend: noop,
            // Callback that is executed if the request succeeds
            success: noop,
            // Callback that is executed the the server drops error
            error: noop,
            // Callback that is executed on request complete (both: error and success)
            complete: noop,
            // The context for the callbacks
            context: null,
            // Whether to trigger "global" Ajax events
            global: true,

            // MIME types mapping
            // IIS returns Javascript as "application/x-javascript"
            accepts: {
                script: 'text/javascript, application/javascript, application/x-javascript',
                json: 'application/json',
                xml: 'application/xml, text/xml',
                html: 'text/html',
                text: 'text/plain'
            },
            // Whether the request is to another domain
            crossDomain: false,
            // Default timeout
            timeout: 0,
            // Whether data should be serialized to string
            processData: false,
            // Whether the browser should be allowed to cache GET responses
            cache: true,

            traditional : false,
            
            xhrFields : {
                withCredentials : false
            }
        };

        function mimeToDataType(mime) {
            if (mime) {
                mime = mime.split(';', 2)[0];
            }
            if (mime) {
                if (mime == htmlType) {
                    return "html";
                } else if (mime == jsonType) {
                    return "json";
                } else if (scriptTypeRE.test(mime)) {
                    return "script";
                } else if (xmlTypeRE.test(mime)) {
                    return "xml";
                }
            }
            return "text";
        }

        function appendQuery(url, query) {
            if (query == '') return url
            return (url + '&' + query).replace(/[&?]{1,2}/, '?')
        }

        // serialize payload and append it to the URL for GET requests
        function serializeData(options) {
            options.data = options.data || options.query;
            if (options.processData && options.data && type(options.data) != "string") {
                options.data = param(options.data, options.traditional);
            }
            if (options.data && (!options.type || options.type.toUpperCase() == 'GET')) {
                options.url = appendQuery(options.url, options.data);
                options.data = undefined;
            }
        }

        function serialize(params, obj, traditional, scope) {
            var t, array = isArray(obj),
                hash = isPlainObject(obj)
            each(obj, function(key, value) {
                t =type(value);
                if (scope) key = traditional ? scope :
                    scope + '[' + (hash || t == 'object' || t == 'array' ? key : '') + ']'
                // handle data in serializeArray() format
                if (!scope && array) params.add(value.name, value.value)
                // recurse into nested objects
                else if (t == "array" || (!traditional && t == "object"))
                    serialize(params, value, traditional, key)
                else params.add(key, value)
            })
        }

        var param = function(obj, traditional) {
            var params = []
            params.add = function(key, value) {
                if (isFunction(value)) {
                  value = value();
                }
                if (value == null) {
                  value = "";
                }
                this.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            };
            serialize(params, obj, traditional)
            return params.join('&').replace(/%20/g, '+')
        };

        var Xhr = Evented.inherit({
            klassName : "Xhr",

            _request  : function(args) {
                var _ = this._,
                    self = this,
                    options = mixin({},XhrDefaultOptions,_.options,args),
                    xhr = _.xhr = new XMLHttpRequest();

                serializeData(options)

                if (options.beforeSend) {
                    options.beforeSend.call(this, xhr, options);
                }                

                var dataType = options.dataType || options.handleAs,
                    mime = options.mimeType || options.accepts[dataType],
                    headers = options.headers,
                    xhrFields = options.xhrFields,
                    isFormData = options.data && options.data instanceof FormData,
                    basicAuthorizationToken = options.basicAuthorizationToken,
                    type = options.type,
                    url = options.url,
                    async = options.async,
                    user = options.user , 
                    password = options.password,
                    deferred = new Deferred(),
                    contentType = options.contentType || (isFormData ? false : 'application/x-www-form-urlencoded');

                if (xhrFields) {
                    for (name in xhrFields) {
                        xhr[name] = xhrFields[name];
                    }
                }

                if (mime && mime.indexOf(',') > -1) {
                    mime = mime.split(',', 2)[0];
                }
                if (mime && xhr.overrideMimeType) {
                    xhr.overrideMimeType(mime);
                }

                //if (dataType) {
                //    xhr.responseType = dataType;
                //}

                var finish = function() {
                    xhr.onloadend = noop;
                    xhr.onabort = noop;
                    xhr.onprogress = noop;
                    xhr.ontimeout = noop;
                    xhr = null;
                }
                var onloadend = function() {
                    var result, error = false
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && getAbsoluteUrl(url).startsWith('file:'))) {
                        dataType = dataType || mimeToDataType(options.mimeType || xhr.getResponseHeader('content-type'));

                        result = xhr.responseText;
                        try {
                            if (dataType == 'script') {
                                eval(result);
                            } else if (dataType == 'xml') {
                                result = xhr.responseXML;
                            } else if (dataType == 'json') {
                                result = blankRE.test(result) ? null : JSON.parse(result);
                            } else if (dataType == "blob") {
                                result = Blob([xhrObj.response]);
                            } else if (dataType == "arraybuffer") {
                                result = xhr.reponse;
                            }
                        } catch (e) { 
                            error = e;
                        }

                        if (error) {
                            deferred.reject(error,xhr.status,xhr);
                        } else {
                            deferred.resolve(result,xhr.status,xhr);
                        }
                    } else {
                        deferred.reject(new Error(xhr.statusText),xhr.status,xhr);
                    }
                    finish();
                };

                var onabort = function() {
                    if (deferred) {
                        deferred.reject(new Error("abort"),xhr.status,xhr);
                    }
                    finish();                 
                }
 
                var ontimeout = function() {
                    if (deferred) {
                        deferred.reject(new Error("timeout"),xhr.status,xhr);
                    }
                    finish();                 
                }

                var onprogress = function(evt) {
                    if (deferred) {
                        deferred.notify(evt,xhr.status,xhr);
                    }
                }

                xhr.onloadend = onloadend;
                xhr.onabort = onabort;
                xhr.ontimeout = ontimeout;
                xhr.onprogress = onprogress;

                xhr.open(type, url, async, user, password);
               
                if (headers) {
                    for ( var key in headers) {
                        var value = headers[key];
 
                        if(key.toLowerCase() === 'content-type'){
                            contentType = value;
                        } else {
                           xhr.setRequestHeader(key, value);
                        }
                    }
                }   

                if  (contentType && contentType !== false){
                    xhr.setRequestHeader('Content-Type', contentType);
                }

                if(!headers || !('X-Requested-With' in headers)){
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                }


                //If basicAuthorizationToken is defined set its value into "Authorization" header
                if (basicAuthorizationToken) {
                    xhr.setRequestHeader("Authorization", basicAuthorizationToken);
                }

                xhr.send(options.data ? options.data : null);

                return deferred.promise;

            },

            "abort": function() {
                var _ = this._,
                    xhr = _.xhr;

                if (xhr) {
                    xhr.abort();
                }    
            },


            "request": function(args) {
                return this._request(args);
            },

            get : function(args) {
                args = args || {};
                args.type = "GET";
                return this._request(args);
            },

            post : function(args) {
                args = args || {};
                args.type = "POST";
                return this._request(args);
            },

            patch : function(args) {
                args = args || {};
                args.type = "PATCH";
                return this._request(args);
            },

            put : function(args) {
                args = args || {};
                args.type = "PUT";
                return this._request(args);
            },

            del : function(args) {
                args = args || {};
                args.type = "DELETE";
                return this._request(args);
            },

            "init": function(options) {
                this._ = {
                    options : options || {}
                };
            }
        });

        ["request","get","post","put","del","patch"].forEach(function(name){
            Xhr[name] = function(url,args) {
                var xhr = new Xhr({"url" : url});
                return xhr[name](args);
            };
        });

        Xhr.defaultOptions = XhrDefaultOptions;
        Xhr.param = param;

        return Xhr;
    })();

	return http.Xhr = Xhr;	
});
define('skylark-jquery/ajax',[
    "skylark-langx/langx",
    "skylark-net-http/Xhr",
    "./core",
], function(langx,Xhr,$) {
    var jsonpID = 0;

     // Attach a bunch of functions for handling common AJAX events
    $.each( [
        "ajaxStart",
        "ajaxStop",
        "ajaxComplete",
        "ajaxError",
        "ajaxSuccess",
        "ajaxSend"
    ], function( i, type ) {
        $.fn[ type ] = function( fn ) {
            return this.on( type, fn );
        };
    } );
   

    function appendQuery(url, query) {
        if (query == '') return url
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }
    
    $.ajaxJSONP = function(options) {
        var deferred = new langx.Deferred();
        var _callbackName = options.jsonpCallback,
            callbackName = ($.isFunction(_callbackName) ?
                _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            abort = function(errorType) {
                $(script).triggerHandler('error', errorType || 'abort')
            },
            xhr = { abort: abort },
            abortTimeout;

        for (var key in options.data) {
            options.url = appendQuery(options.url, key + "=" + options.data[key]);
        }
         
//        if (deferred) deferred.promise(xhr)

        $(script).on('load error', function(e, errorType) {
            clearTimeout(abortTimeout)
            $(script).off().remove()

            if (e.type == 'error' || !responseData) {
                deferred.reject(e);
            } else {
                deferred.resolve(responseData[0],200,xhr);
            }

            window[callbackName] = originalCallback
            if (responseData && $.isFunction(originalCallback))
                originalCallback(responseData[0])

            originalCallback = responseData = undefined
        })

        window[callbackName] = function() {
            responseData = arguments
        }

        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
        document.head.appendChild(script)

        if (options.timeout > 0) abortTimeout = setTimeout(function() {
            abort('timeout')
        }, options.timeout)

        return deferred;
    }

    //$.ajaxSettings = Xhr.defaultOptions;
    //$.ajaxSettings.xhr = function() {
    //    return new window.XMLHttpRequest()
    //};

    $.ajaxSettings = {
        processData : true
    };


    $.ajax = function(url,options) {
        if (!url) {
            options = {
                url :  "./"
            };
        } else if (!options) {
            if (langx.isString(url)) {
                options = {
                    url :  url
                };
            } else {
                options = url;
            }
        } else {
            options.url = url;
        }

        options = langx.mixin({},$.ajaxSettings,options);

        if ('jsonp' == options.dataType) {
            var hasPlaceholder = /\?.+=\?/.test(options.url);

            if (!hasPlaceholder)
                options.url = appendQuery(options.url,
                    options.jsonp ? (options.jsonp + '=?') : options.jsonp === false ? '' : 'callback=?')
            return $.ajaxJSONP(options);
        }

        function ajaxSuccess(data,status,xhr) {
            $(document).trigger("ajaxSucess");
            if (options.success) {
                options.success.apply(this,arguments);
            }
            if (options.complete) {
                options.complete.apply(this,arguments);
            }
            return data;
        }

        function ajaxError() {
            $(document).trigger("ajaxError");
            if (options.error) {
                options.error.apply(this,arguments);
            }
        }

        var p = Xhr.request(options.url,options);
        p = p.then(ajaxSuccess,ajaxError);
        p.success = p.done;
        p.error = p.fail;
        p.complete = p.always;
        
        return p;
    };

    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
        if ($.isFunction(url)) {
            dataType = data, success = url, data = undefined,url = undefined;
        } else if ($.isFunction(data)) {
            dataType = success, success = data, data = undefined;
        } 
        if (!$.isFunction(success)) dataType = success, success = undefined
        return {
            url: url,
            data: data,
            success: success,
            dataType: dataType
        }
    }

    $.get = function( /* url, data, success, dataType */ ) {
        return $.ajax(parseArguments.apply(null, arguments))
    }

    $.post = function( /* url, data, success, dataType */ ) {
        var options = parseArguments.apply(null, arguments)
        options.type = 'POST'
        return $.ajax(options)
    }

    $.getJSON = function( /* url, data, success */ ) {
        var options = parseArguments.apply(null, arguments)
        options.dataType = 'json'
        return $.ajax(options)
    }

    var originalLoad = $.fn.load;

    $.fn.load = function(url, data, success) {
        if ("string" != typeof url && originalLoad) {
            return originalLoad.apply(this, arguments);
        }
        if (!this.length) return this
        var self = this,
            options = parseArguments(url, data, success),
            parts = options.url && options.url.split(/\s/),
            selector,
            callback = options.success
        if (parts && parts.length > 1) options.url = parts[0], selector = parts[1]

        if (options.data && typeof options.data === "object") {
            options.type = "POST";
        }
        options.success = function(response) {
            self.html(selector ?
                $('<div>').html(response.replace(rscript, "")).find(selector) : response)
            callback && callback.apply(self, arguments)
        }
        $.ajax(options)
        return this
    }

    $.param = Xhr.param;


    // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
    function addToPrefiltersOrTransports(structure) {

        // dataTypeExpression is optional and defaults to "*"
        return function(dataTypeExpression, func) {

            if (typeof dataTypeExpression !== "string") {
                func = dataTypeExpression;
                dataTypeExpression = "*";
            }

            var dataType,
                i = 0,
                dataTypes = dataTypeExpression.toLowerCase().match(rnotwhite) || [];

            if (jQuery.isFunction(func)) {

                // For each dataType in the dataTypeExpression
                while ((dataType = dataTypes[i++])) {

                    // Prepend if requested
                    if (dataType[0] === "+") {
                        dataType = dataType.slice(1) || "*";
                        (structure[dataType] = structure[dataType] || []).unshift(func);

                        // Otherwise append
                    } else {
                        (structure[dataType] = structure[dataType] || []).push(func);
                    }
                }
            }
        };
    }

    var
        prefilters = {},
        transports = {},
        rnotwhite = (/\S+/g);

    $.ajaxPrefilter = addToPrefiltersOrTransports(prefilters);
    $.ajaxTransport = addToPrefiltersOrTransports(transports);
    $.ajaxSetup = function(target, settings) {
        langx.mixin(Xhr.defaultOptions,target,settings);
    };

    $.getScript = function( url, callback ) {
        return $.get( url, undefined, callback, "script" );
    };

    return $;

});

define('skylark-jquery/callbacks',[
    "./core"
], function($) {

    //     This module is borrow from zepto.callback.js
    //     (c) 2010-2014 Thomas Fuchs
    //     Zepto.js may be freely distributed under the MIT license.

    // Create a collection of callbacks to be fired in a sequence, with configurable behaviour
    // Option flags:
    //   - once: Callbacks fired at most one time.
    //   - memory: Remember the most recent context and arguments
    //   - stopOnFalse: Cease iterating over callback list
    //   - unique: Permit adding at most one instance of the same callback
    $.Callbacks = function(options) {
        options = $.extend({}, options)

        var memory, // Last fire value (for non-forgettable lists)
            fired, // Flag to know if list was already fired
            firing, // Flag to know if list is currently firing
            firingStart, // First callback to fire (used internally by add and fireWith)
            firingLength, // End of the loop when firing
            firingIndex, // Index of currently firing callback (modified by remove if needed)
            list = [], // Actual callback list
            stack = !options.once && [], // Stack of fire calls for repeatable lists
            fire = function(data) {
                memory = options.memory && data
                fired = true
                firingIndex = firingStart || 0
                firingStart = 0
                firingLength = list.length
                firing = true
                for (; list && firingIndex < firingLength; ++firingIndex) {
                    if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
                        memory = false
                        break
                    }
                }
                firing = false
                if (list) {
                    if (stack) stack.length && fire(stack.shift())
                    else if (memory) list.length = 0
                    else Callbacks.disable()
                }
            },

            Callbacks = {
                add: function() {
                    if (list) {
                        var start = list.length,
                            add = function(args) {
                                $.each(args, function(_, arg) {
                                    if (typeof arg === "function") {
                                        if (!options.unique || !Callbacks.has(arg)) list.push(arg)
                                    } else if (arg && arg.length && typeof arg !== 'string') add(arg)
                                })
                            }
                        add(arguments)
                        if (firing) firingLength = list.length
                        else if (memory) {
                            firingStart = start
                            fire(memory)
                        }
                    }
                    return this
                },
                remove: function() {
                    if (list) {
                        $.each(arguments, function(_, arg) {
                            var index
                            while ((index = $.inArray(arg, list, index)) > -1) {
                                list.splice(index, 1)
                                // Handle firing indexes
                                if (firing) {
                                    if (index <= firingLength) --firingLength
                                    if (index <= firingIndex) --firingIndex
                                }
                            }
                        })
                    }
                    return this
                },
                has: function(fn) {
                    return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
                },
                empty: function() {
                    firingLength = list.length = 0
                    return this
                },
                disable: function() {
                    list = stack = memory = undefined
                    return this
                },
                disabled: function() {
                    return !list
                },
                lock: function() {
                    stack = undefined;
                    if (!memory) Callbacks.disable()
                    return this
                },
                locked: function() {
                    return !stack
                },
                fireWith: function(context, args) {
                    if (list && (!fired || stack)) {
                        args = args || []
                        args = [context, args.slice ? args.slice() : args]
                        if (firing) stack.push(args)
                        else fire(args)
                    }
                    return this
                },
                fire: function() {
                    return Callbacks.fireWith(this, arguments)
                },
                fired: function() {
                    return !!fired
                }
            }

        return Callbacks
    };

    return $;

});

define('skylark-jquery/deferred',[
    "./core",
    "skylark-langx/langx"
], function($,langx) {

    $.Deferred = function() {
        var d = new langx.Deferred(),
            ret = {
                promise : function() {
                    return d.promise;
                }
            };

        ["resolve","resolveWith","reject","rejectWith","notify","then","done","fail","progress"].forEach(function(name){
            ret[name] = function() {
              var ret2 =   d[name].apply(d,arguments);
              if (ret2 == d) {
                ret2 = ret;
              }
              return ret2;
            }
        });

        return ret;
    };
    
    $.when = function(){
        var p = langx.Deferred.all(langx.makeArray(arguments)),
            originThen = p.then;
        p.then = function(onResolved,onRejected) {
            var handler = function(results) {
                //results = results.map(function(result){
                //    return [result];
                //});
                return onResolved && onResolved.apply(null,results);
            };
            return originThen.call(p,handler,onRejected);
        };
        return p;
    };

    return $;

});

define('skylark-jquery/queue',[
    "skylark-langx/langx",
    "./core",
    "./callbacks"
], function(langx, $) {

 // jQuery Data object
  var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
      rmultiDash = /([A-Z])/g,
      expando = "Sky" + ( '1.0' + Math.random() ).replace( /\D/g, ""),
      optionsCache = {},
      core_rnotwhite = /\S+/g,
      core_deletedIds = [],
      core_push = core_deletedIds.push;

// Convert String-formatted options into Object-formatted ones and store in cache
  function createOptions( options ) {
    var object = optionsCache[ options ] = {};
    $.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
      object[ flag ] = true;
    });
    return object;
  }

  function isArraylike( obj ) {
    var length = obj.length,
        type = $.type( obj );

    if ( $.isWindow( obj ) ) {
      return false;
    }

    if ( obj.nodeType === 1 && length ) {
      return true;
    }

    return type === "array" || type !== "function" &&
        ( length === 0 ||
            typeof length === "number" && length > 0 && ( length - 1 ) in obj );
  }

  

  function Data() {
    // Support: Android < 4,
    // Old WebKit does not have Object.preventExtensions/freeze method,
    // return new empty object instead with no [[set]] accessor
    Object.defineProperty( this.cache = {}, 0, {
      get: function() {
        return {};
      }
    });

    this.expando = expando + Math.random();
  }

  Data.uid = 1;

  Data.accepts = function( owner ) {
    // Accepts only:
    //  - Node
    //    - Node.ELEMENT_NODE
    //    - Node.DOCUMENT_NODE
    //  - Object
    //    - Any
    return owner.nodeType ?
        owner.nodeType === 1 || owner.nodeType === 9 : true;
  };

  Data.prototype = {
    key: function( owner ) {
      // We can accept data for non-element nodes in modern browsers,
      // but we should not, see #8335.
      // Always return the key for a frozen object.
      if ( !Data.accepts( owner ) ) {
        return 0;
      }

      var descriptor = {},
      // Check if the owner object already has a cache key
          unlock = owner[ this.expando ];

      // If not, create one
      if ( !unlock ) {
        unlock = Data.uid++;

        // Secure it in a non-enumerable, non-writable property
        try {
          descriptor[ this.expando ] = { value: unlock };
          Object.defineProperties( owner, descriptor );

          // Support: Android < 4
          // Fallback to a less secure definition
        } catch ( e ) {
          descriptor[ this.expando ] = unlock;
          $.extend( owner, descriptor );
        }
      }

      // Ensure the cache object
      if ( !this.cache[ unlock ] ) {
        this.cache[ unlock ] = {};
      }

      return unlock;
    },
    set: function( owner, data, value ) {
      var prop,
      // There may be an unlock assigned to this node,
      // if there is no entry for this "owner", create one inline
      // and set the unlock as though an owner entry had always existed
          unlock = this.key( owner ),
          cache = this.cache[ unlock ];

      // Handle: [ owner, key, value ] args
      if ( typeof data === "string" ) {
        cache[ data ] = value;

        // Handle: [ owner, { properties } ] args
      } else {
        // Fresh assignments by object are shallow copied
        if ( $.isEmptyObject( cache ) ) {
          $.extend( this.cache[ unlock ], data );
          // Otherwise, copy the properties one-by-one to the cache object
        } else {
          for ( prop in data ) {
            cache[ prop ] = data[ prop ];
          }
        }
      }
      return cache;
    },
    get: function( owner, key ) {
      // Either a valid cache is found, or will be created.
      // New caches will be created and the unlock returned,
      // allowing direct access to the newly created
      // empty data object. A valid owner object must be provided.
      var cache = this.cache[ this.key( owner ) ];

      return key === undefined ?
          cache : cache[ key ];
    },
    access: function( owner, key, value ) {
      var stored;
      // In cases where either:
      //
      //   1. No key was specified
      //   2. A string key was specified, but no value provided
      //
      // Take the "read" path and allow the get method to determine
      // which value to return, respectively either:
      //
      //   1. The entire cache object
      //   2. The data stored at the key
      //
      if ( key === undefined ||
          ((key && typeof key === "string") && value === undefined) ) {

        stored = this.get( owner, key );

        return stored !== undefined ?
            stored : this.get( owner, $.camelCase(key) );
      }

      // [*]When the key is not a string, or both a key and value
      // are specified, set or extend (existing objects) with either:
      //
      //   1. An object of properties
      //   2. A key and value
      //
      this.set( owner, key, value );

      // Since the "set" path can have two possible entry points
      // return the expected data based on which path was taken[*]
      return value !== undefined ? value : key;
    },
    remove: function( owner, key ) {
      var i, name, camel,
          unlock = this.key( owner ),
          cache = this.cache[ unlock ];

      if ( key === undefined ) {
        this.cache[ unlock ] = {};

      } else {
        // Support array or space separated string of keys
        if ( $.isArray( key ) ) {
          // If "name" is an array of keys...
          // When data is initially created, via ("key", "val") signature,
          // keys will be converted to camelCase.
          // Since there is no way to tell _how_ a key was added, remove
          // both plain key and camelCase key. #12786
          // This will only penalize the array argument path.
          name = key.concat( key.map( $.camelCase ) );
        } else {
          camel = $.camelCase( key );
          // Try the string as a key before any manipulation
          if ( key in cache ) {
            name = [ key, camel ];
          } else {
            // If a key with the spaces exists, use it.
            // Otherwise, create an array by matching non-whitespace
            name = camel;
            name = name in cache ?
                [ name ] : ( name.match( core_rnotwhite ) || [] );
          }
        }

        i = name.length;
        while ( i-- ) {
          delete cache[ name[ i ] ];
        }
      }
    },
    hasData: function( owner ) {
      return !$.isEmptyObject(
          this.cache[ owner[ this.expando ] ] || {}
      );
    },
    discard: function( owner ) {
      if ( owner[ this.expando ] ) {
        delete this.cache[ owner[ this.expando ] ];
      }
    }
  };

  var data_priv = new Data();

  $.extend($, {
    queue: function( elem, type, data ) {
      var queue;

      if ( elem ) {
        type = ( type || "fx" ) + "queue";
        queue = data_priv.get( elem, type );

        // Speed up dequeue by getting out quickly if this is just a lookup
        if ( data ) {
          if ( !queue || $.isArray( data ) ) {
            queue = data_priv.access( elem, type, $.makeArray(data) );
          } else {
            queue.push( data );
          }
        }
        return queue || [];
      }
    },

    dequeue: function( elem, type ) {
      type = type || "fx";

      var queue = $.queue( elem, type ),
          startLength = queue.length,
          fn = queue.shift(),
          hooks = $._queueHooks( elem, type ),
          next = function() {
            $.dequeue( elem, type );
          };

      // If the fx queue is dequeued, always remove the progress sentinel
      if ( fn === "inprogress" ) {
        fn = queue.shift();
        startLength--;
      }

      if ( fn ) {

        // Add a progress sentinel to prevent the fx queue from being
        // automatically dequeued
        if ( type === "fx" ) {
          queue.unshift( "inprogress" );
        }

        // clear up the last queue stop function
        delete hooks.stop;
        fn.call( elem, next, hooks );
      }

      if ( !startLength && hooks ) {
        hooks.empty.fire();
      }
    },

    // not intended for public consumption - generates a queueHooks object, or returns the current one
    _queueHooks: function( elem, type ) {
      var key = type + "queueHooks";
      return data_priv.get( elem, key ) || data_priv.access( elem, key, {
        empty: $.Callbacks("once memory").add(function() {
          data_priv.remove( elem, [ type + "queue", key ] );
        })
      });
    },

    // array operations
    makeArray: function( arr, results ) {
      var ret = results || [];

      if ( arr != null ) {
        if ( isArraylike( Object(arr) ) ) {
          $.merge( ret,
              typeof arr === "string" ?
                  [ arr ] : arr
          );
        } else {
          core_push.call( ret, arr );
        }
      }

      return ret;
    },
    merge: function( first, second ) {
      var l = second.length,
          i = first.length,
          j = 0;

      if ( typeof l === "number" ) {
        for ( ; j < l; j++ ) {
          first[ i++ ] = second[ j ];
        }
      } else {
        while ( second[j] !== undefined ) {
          first[ i++ ] = second[ j++ ];
        }
      }

      first.length = i;

      return first;
    }
  });

  $.extend($.fn, {
    queue: function( type, data ) {
      var setter = 2;

      if ( typeof type !== "string" ) {
        data = type;
        type = "fx";
        setter--;
      }

      if ( arguments.length < setter ) {
        return $.queue( this[0], type );
      }

      return data === undefined ?
          this :
          this.each(function() {
            var queue = $.queue( this, type, data );

            // ensure a hooks for this queue
            $._queueHooks( this, type );

            if ( type === "fx" && queue[0] !== "inprogress" ) {
              $.dequeue( this, type );
            }
          });
    },
    dequeue: function( type ) {
      return this.each(function() {
        $.dequeue( this, type );
      });
    },
    // Based off of the plugin by Clint Helfers, with permission.
    // http://blindsignals.com/index.php/2009/07/jquery-delay/
    delay: function( time, type ) {
      time = $.fx ? $.fx.speeds[ time ] || time : time;
      type = type || "fx";

      return this.queue( type, function( next, hooks ) {
        var timeout = setTimeout( next, time );
        hooks.stop = function() {
          clearTimeout( timeout );
        };
      });
    },
    clearQueue: function( type ) {
      return this.queue( type || "fx", [] );
    },
    // Get a promise resolved when queues of a certain type
    // are emptied (fx is the type by default)
    promise: function( type, obj ) {
      var tmp,
          count = 1,
          defer = $.Deferred(),
          elements = this,
          i = this.length,
          resolve = function() {
            if ( !( --count ) ) {
              defer.resolveWith( elements, [ elements ] );
            }
          };

      if ( typeof type !== "string" ) {
        obj = type;
        type = undefined;
      }
      type = type || "fx";

      while( i-- ) {
        tmp = data_priv.get( elements[ i ], type + "queueHooks" );
        if ( tmp && tmp.empty ) {
          count++;
          tmp.empty.add( resolve );
        }
      }
      resolve();
      return defer.promise( obj );
    }
  });

  return $;

});

define('skylark-domx-plugins/plugins',[
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "skylark-domx-noder",
    "skylark-domx-data",
    "skylark-domx-eventer",
    "skylark-domx-finder",
    "skylark-domx-geom",
    "skylark-domx-styler",
    "skylark-domx-fx",
    "skylark-domx-query",
    "skylark-domx-velm"
], function(skylark, langx, noder, datax, eventer, finder, geom, styler, fx, $, elmx) {
    "use strict";

    var slice = Array.prototype.slice,
        concat = Array.prototype.concat,
        pluginKlasses = {},
        shortcuts = {};

    /*
     * Create or get or destory a plugin instance assocated with the element.
     */
    function instantiate(elm,pluginName,options) {
        var pair = pluginName.split(":"),
            instanceDataName = pair[1];
        pluginName = pair[0];

        if (!instanceDataName) {
            instanceDataName = pluginName;
        }

        var pluginInstance = datax.data( elm, instanceDataName );

        if (options === "instance") {
            return pluginInstance;
        } else if (options === "destroy") {
            if (!pluginInstance) {
                throw new Error ("The plugin instance is not existed");
            }
            pluginInstance.destroy();
            datax.removeData( elm, pluginName);
            pluginInstance = undefined;
        } else {
            if (!pluginInstance) {
                if (options !== undefined && typeof options !== "object") {
                    throw new Error ("The options must be a plain object");
                }
                var pluginKlass = pluginKlasses[pluginName]; 
                pluginInstance = new pluginKlass(elm,options);
                datax.data( elm, instanceDataName,pluginInstance );
            } else if (options) {
                pluginInstance.reset(options);
            }
        }

        return pluginInstance;
    }


    function shortcutter(pluginName,extfn) {
       /*
        * Create or get or destory a plugin instance assocated with the element,
        * and also you can execute the plugin method directory;
        */
        return function (elm,options) {
            var  plugin = instantiate(elm, pluginName,"instance");
            if ( options === "instance" ) {
              return plugin || null;
            }

            if (!plugin) {
                plugin = instantiate(elm, pluginName,typeof options == 'object' && options || {});
                if (typeof options != "string") {
                  return this;
                }
            } 
            if (options) {
                var args = slice.call(arguments,1); //2
                if (extfn) {
                    return extfn.apply(plugin,args);
                } else {
                    if (typeof options == 'string') {
                        var methodName = options;

                        if ( !plugin ) {
                            throw new Error( "cannot call methods on " + pluginName +
                                " prior to initialization; " +
                                "attempted to call method '" + methodName + "'" );
                        }

                        if ( !langx.isFunction( plugin[ methodName ] ) || methodName.charAt( 0 ) === "_" ) {
                            throw new Error( "no such method '" + methodName + "' for " + pluginName +
                                " plugin instance" );
                        }

                        return plugin[methodName].apply(plugin,args);
                    }                
                }                
            }

        }

    }

    /*
     * Register a plugin type
     */
    function register( pluginKlass,shortcutName,instanceDataName,extfn) {
        var pluginName = pluginKlass.prototype.pluginName;
        
        pluginKlasses[pluginName] = pluginKlass;

        if (shortcutName) {
            if (instanceDataName && langx.isFunction(instanceDataName)) {
                extfn = instanceDataName;
                instanceDataName = null;
            } 
            if (instanceDataName) {
                pluginName = pluginName + ":" + instanceDataName;
            }

            var shortcut = shortcuts[shortcutName] = shortcutter(pluginName,extfn);
                
            $.fn[shortcutName] = function(options) {
                var returnValue = this;

                if ( !this.length && options === "instance" ) {
                  returnValue = undefined;
                } else {
                  var args = slice.call(arguments);
                  this.each(function () {
                    var args2 = slice.call(args);
                    args2.unshift(this);
                    var  ret  = shortcut.apply(undefined,args2);
                    if (ret !== undefined) {
                        returnValue = ret;
                        return false;
                    }
                  });
                }

                return returnValue;
            };

            elmx.partial(shortcutName,function(options) {
                var  ret  = shortcut(this._elm,options);
                if (ret === undefined) {
                    ret = this;
                }
                return ret;
            });

        }
    }

 
    var Plugin =   langx.Evented.inherit({
        klassName: "Plugin",

        _construct : function(elm,options) {
           this._elm = elm;
           this._initOptions(options);
        },

        _initOptions : function(options) {
          var ctor = this.constructor,
              cache = ctor.cache = ctor.cache || {},
              defaults = cache.defaults;
          if (!defaults) {
            var  ctors = [];
            do {
              ctors.unshift(ctor);
              if (ctor === Plugin) {
                break;
              }
              ctor = ctor.superclass;
            } while (ctor);

            defaults = cache.defaults = {};
            for (var i=0;i<ctors.length;i++) {
              ctor = ctors[i];
              if (ctor.prototype.hasOwnProperty("options")) {
                langx.mixin(defaults,ctor.prototype.options,true);
              }
              if (ctor.hasOwnProperty("options")) {
                langx.mixin(defaults,ctor.options,true);
              }
            }
          }
          Object.defineProperty(this,"options",{
            value :langx.mixin({},defaults,options,true)
          });

          //return this.options = langx.mixin({},defaults,options);
          return this.options;
        },


        destroy: function() {
            var that = this;

            this._destroy();
            // We can probably remove the unbind calls in 2.0
            // all event bindings should go through this._on()
            datax.removeData(this._elm,this.pluginName );
        },

        _destroy: langx.noop,

        _delay: function( handler, delay ) {
            function handlerProxy() {
                return ( typeof handler === "string" ? instance[ handler ] : handler )
                    .apply( instance, arguments );
            }
            var instance = this;
            return setTimeout( handlerProxy, delay || 0 );
        },

        option: function( key, value ) {
            var options = key;
            var parts;
            var curOption;
            var i;

            if ( arguments.length === 0 ) {

                // Don't return a reference to the internal hash
                return langx.mixin( {}, this.options );
            }

            if ( typeof key === "string" ) {

                // Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
                options = {};
                parts = key.split( "." );
                key = parts.shift();
                if ( parts.length ) {
                    curOption = options[ key ] = langx.mixin( {}, this.options[ key ] );
                    for ( i = 0; i < parts.length - 1; i++ ) {
                        curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
                        curOption = curOption[ parts[ i ] ];
                    }
                    key = parts.pop();
                    if ( arguments.length === 1 ) {
                        return curOption[ key ] === undefined ? null : curOption[ key ];
                    }
                    curOption[ key ] = value;
                } else {
                    if ( arguments.length === 1 ) {
                        return this.options[ key ] === undefined ? null : this.options[ key ];
                    }
                    options[ key ] = value;
                }
            }

            this._setOptions( options );

            return this;
        },

        _setOptions: function( options ) {
            var key;

            for ( key in options ) {
                this._setOption( key, options[ key ] );
            }

            return this;
        },

        _setOption: function( key, value ) {

            this.options[ key ] = value;

            return this;
        },

        getUID : function (prefix) {
            prefix = prefix || "plugin";
            do prefix += ~~(Math.random() * 1000000)
            while (document.getElementById(prefix))
            return prefix;
        },

        elm : function() {
            return this._elm;
        }

    });

    $.fn.plugin = function(name,options) {
        var args = slice.call( arguments, 1 ),
            self = this,
            returnValue = this;

        this.each(function(){
            returnValue = instantiate.apply(self,[this,name].concat(args));
        });
        return returnValue;
    };

    elmx.partial("plugin",function(name,options) {
        var args = slice.call( arguments, 1 );
        return instantiate.apply(this,[this.domNode,name].concat(args));
    }); 


    function plugins() {
        return plugins;
    }
     
    langx.mixin(plugins, {
        instantiate,
        Plugin,
        register,
        shortcuts
    });

    return  skylark.attach("domx.plugins",plugins);
});
define('skylark-domx-plugins/main',[
	"./plugins"
],function(plugins){
	return plugins;
});
define('skylark-domx-plugins', ['skylark-domx-plugins/main'], function (main) { return main; });

define('skylark-jquery/JqueryPlugin',[
	"skylark-langx-types",
	"skylark-langx-objects",
	"skylark-langx-arrays",
	"skylark-langx/langx",
	"skylark-domx-data",
	"skylark-domx-eventer",
	"skylark-domx-plugins",
	"skylark-domx-query",
],function(types, objects, arrays, langx, datax, eventer, plugins, $){

    var pluginUuid = 0;

	var JqPlugin = plugins.Plugin.inherit({
		klassName : "JqPlugin",

        pluginEventPrefix: "",

        options: {
            // Callbacks
            create: null
        },

        destroy: function() {
            this.overrided();

            // We can probably remove the unbind calls in 2.0
            // all event bindings should go through this._on()
            this.element
                .off( this.eventNamespace );

            // Clean up events and states
            this.bindings.off( this.eventNamespace );
        },

        _construct : function(element,options) {
            //this.options = langx.mixin( {}, this.options );

            element = $( element || this.defaultElement || this )[ 0 ];
            this.element = $( element );
            this.uuid = pluginUuid++;
            this.eventNamespace = "." + this.pluginName + this.uuid;

            this.bindings = $();
            this.classesElementLookup = {};

			this.hoverable = $();
			this.focusable = $();

            if ( element !== this ) {
                datax.data( element, this.pluginName, this );
                this._on( true, this.element, {
                    remove: function( event ) {
                        if ( event.target === element ) {
                            this.destroy();
                        }
                    }
                } );
                this.document = $( element.style ?

                    // Element within the document
                    element.ownerDocument :

                    // Element is window or document
                    element.document || element );
                this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
            }

            this.overrided(element,options);

//            this.options = langx.mixin( {},
//                this.options,
//                this._getCreateOptions(),
//                options );

            this._create();

            this._trigger( "create", null, this._getCreateEventData() );

            this._init();
        },


	     _initOptions : function(options) {
	     	options = langx.mixin(this._getCreateOptions(),options);

			this.overrided(options);
		},

        _getCreateOptions: function() {
            return {};
        },

        _getCreateEventData: langx.noop,

		_super : function() {
			if (this.overrided) {
				return this.overrided.apply(this,arguments);
			}
		},

		_superApply : function ( args ) {
			if (this.overrided) {
				return this.overrided.apply(this,args);
			}
		},

        _create: langx.noop,

        _init: langx.noop,

		_classes: function( options ) {
			var full = [];
			var that = this;

			options = objects.mixin( {
				element: this.element,
				classes: this.options.classes || {}
			}, options );


			function bindRemoveEvent() {
				options.element.each( function( _, element ) {
					var isTracked = langx.map( that.classesElementLookup, function( elements ) {
						return elements;
					} )
						.some( function(elements ) {
							return $(elements).is( element );
						} );

					if ( !isTracked ) {
						that._on( $( element ), {
							remove: "_untrackClassesElement"
						} );
					}
				} );
			}

			function processClassString( classes, checkOption ) {
				var current, i;
				for ( i = 0; i < classes.length; i++ ) {
					current = that.classesElementLookup[ classes[ i ] ] || $();
					if ( options.add ) {
						bindRemoveEvent();
						current = $( langx.uniq( current.get().concat( options.element.get() ) ) );
					} else {
						current = $( current.not( options.element ).get() );
					}
					that.classesElementLookup[ classes[ i ] ] = current;
					full.push( classes[ i ] );
					if ( checkOption && options.classes[ classes[ i ] ] ) {
						full.push( options.classes[ classes[ i ] ] );
					}
				}
			}

			if ( options.keys ) {
				processClassString( options.keys.match( /\S+/g ) || [], true );
			}
			if ( options.extra ) {
				processClassString( options.extra.match( /\S+/g ) || [] );
			}

			return full.join( " " );
		},

		_untrackClassesElement: function( event ) {
			var that = this;
			langx.each( that.classesElementLookup, function( key, value ) {
				if ( arrays.inArray( event.target, value ) !== -1 ) {
					that.classesElementLookup[ key ] = $( value.not( event.target ).get() );
				}
			} );

			this._off( $( event.target ) );
		},

		_removeClass: function( element, keys, extra ) {
			return this._toggleClass( element, keys, extra, false );
		},

		_addClass: function( element, keys, extra ) {
			return this._toggleClass( element, keys, extra, true );
		},

		_toggleClass: function( element, keys, extra, add ) {
			add = ( typeof add === "boolean" ) ? add : extra;
			var shift = ( typeof element === "string" || element === null ),
				options = {
					extra: shift ? keys : extra,
					keys: shift ? element : keys,
					element: shift ? this.element : element,
					add: add
				};
			options.element.toggleClass( this._classes( options ), add );
			return this;
		},

		_on: function( suppressDisabledCheck, element, handlers ) {
			var delegateElement;
			var instance = this;

			// No suppressDisabledCheck flag, shuffle arguments
			if ( typeof suppressDisabledCheck !== "boolean" ) {
				handlers = element;
				element = suppressDisabledCheck;
				suppressDisabledCheck = false;
			}

			// No element argument, shuffle and use this.element
			if ( !handlers ) {
				handlers = element;
				element = this.element;
				delegateElement = this.widget();
			} else {
				element = delegateElement = $( element );
				this.bindings = this.bindings.add( element );
			}

			objects.each( handlers, function( event, handler ) {
				function handlerProxy() {

					// Allow widgets to customize the disabled handling
					// - disabled as an array instead of boolean
					// - disabled class as method for disabling individual parts
					if ( !suppressDisabledCheck &&
							( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
						return;
					}
					return ( typeof handler === "string" ? instance[ handler ] : handler )
						.apply( instance, arguments );
				}

				// Copy the guid so direct unbinding works
				if ( typeof handler !== "string" ) {
					handlerProxy.guid = handler.guid =
						handler.guid || handlerProxy.guid || $.guid++;
				}

				var match = event.match( /^([\w:-]*)\s*(.*)$/ );
				var eventName = match[ 1 ] + instance.eventNamespace;
				var selector = match[ 2 ];

				if ( selector ) {
					delegateElement.on( eventName, selector, handlerProxy );
				} else {
					element.on( eventName, handlerProxy );
				}
			} );
		},

		_off: function( element, eventName ) {
			eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
				this.eventNamespace;
			element.off( eventName );

			// Clear the stack to avoid memory leaks (#10056)
			this.bindings = $( this.bindings.not( element ).get() );
			this.focusable = $( this.focusable.not( element ).get() );
			this.hoverable = $( this.hoverable.not( element ).get() );
		},

		_trigger: function( type, event, data ) {
			var prop, orig;
			var callback = this.options[ type ];

			data = data || {};
			event = eventer.proxy( event );
			event.type = ( type === this.widgetEventPrefix ?
				type :
				this.widgetEventPrefix + type ).toLowerCase();

			// The original event may come from any element
			// so we need to reset the target on the new event
			event.target = this.element[ 0 ];

			// Copy original event properties over to the new event
			orig = event.originalEvent;
			if ( orig ) {
				for ( prop in orig ) {
					if ( !( prop in event ) ) {
						event[ prop ] = orig[ prop ];
					}
				}
			}

			this.element.trigger( event, data );
			return !( types.isFunction( callback ) &&
				callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
				event.isDefaultPrevented() );
		}

	});

	return JqPlugin;
});
/*!
 * jQuery UI Widget @VERSION
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget
//>>group: Core
//>>description: Provides a factory for creating stateful widgets with a common API.
//>>docs: http://api.jqueryui.com/jQuery.widget/
//>>demos: http://jqueryui.com/widget/

define( 'skylark-jquery/widget',[ 
	"skylark-langx/langx",
	"skylark-domx-plugins",
	"./core",
	"./JqueryPlugin"
],  function(langx,splugins, $,JqPlugin ) {

	var widgetUuid = 0;
	var widgetHasOwnProperty = Array.prototype.hasOwnProperty;
	var widgetSlice = Array.prototype.slice;

	$.cleanData = ( function( orig ) {
		return function( elems ) {
			var events, elem, i;
			for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}
			}
			orig( elems );
		};
	} )( $.cleanData );
	
	$.widget = function( name, base, prototype ) {
		var existingConstructor, constructor, basePrototype;

		// ProxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		var proxiedPrototype = {};

		var namespace = name.split( "." )[ 0 ];
		name = name.split( "." )[ 1 ];
		var fullName = namespace + "-" + name;

		if ( !prototype ) {
			prototype = base;
			base = $.Widget;
		}

		if ( $.isArray( prototype ) ) {
			prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
		}

		// Create selector for plugin
		$.expr.pseudos[ fullName.toLowerCase() ] = function( elem ) {
			return !!$.data( elem, fullName );
		};

		$[ namespace ] = $[ namespace ] || {};

		existingConstructor = $[ namespace ][ name ];

		var basePrototype = base.prototype,
			newPrototype = {};

		for (var key in prototype) {
			var value = prototype[key];

			if ( $.isPlainObject( value ) ) {
				newPrototype[ key ] = $.isPlainObject( basePrototype[ key ] ) ?
					$.widget.extend( {}, basePrototype[ key ], value ) :

					// Don't extend strings, arrays, etc. with objects
					$.widget.extend( {}, value );
			} else {
				newPrototype[key] = value;
			}
		}

		var _proto = $.widget.extend({

			// TODO: remove support for widgetEventPrefix
			// always use the name + a colon as the prefix, e.g., draggable:start
			// don't prefix for widgets that aren't DOM-based
			widgetEventPrefix: existingConstructor ? ( base.prototype.widgetEventPrefix || name ) : name
		}, {
			options : base.prototype.options
		},newPrototype, {
			name : fullName,
			namespace: namespace,
			widgetName: name,
			pluginName : "jqueryui." + (namespace ? namespace + "." : "") + name,
			widgetFullName: fullName
		} );

		constructor = $[ namespace ][ name ] = base.inherit(_proto);
		/*

		constructor = $[ namespace ][ name ] = function( options, element ) {

			// Allow instantiation without "new" keyword
			if ( !this._createWidget ) {
				return new constructor( options, element );
			}

			// Allow instantiation without initializing for simple inheritance
			// must use "new" keyword (the code above always passes args)
			if ( arguments.length ) {
				this._createWidget( options, element );
			}
		};
		*/
		// Extend with the existing constructor to carry over any static properties
		$.extend( constructor, existingConstructor, {
			version: prototype.version,

			// Copy the object used to create the prototype in case we need to
			// redefine the widget later
			_proto: _proto,

			// Track widgets that inherit from this widget in case this widget is
			// redefined after a widget inherits from it
			_childConstructors: []
		} );

		/*
		basePrototype = new base();

		// We need to make the options hash a property directly on the new instance
		// otherwise we'll modify the options hash on the prototype that we're
		// inheriting from
		basePrototype.options = $.widget.extend( {}, basePrototype.options );
		$.each( prototype, function( prop, value ) {
			if ( !$.isFunction( value ) ) {
				proxiedPrototype[ prop ] = value;
				return;
			}
			proxiedPrototype[ prop ] = ( function() {
				function _super() {
					return base.prototype[ prop ].apply( this, arguments );
				}

				function _superApply( args ) {
					return base.prototype[ prop ].apply( this, args );
				}

				return function() {
					var __super = this._super;
					var __superApply = this._superApply;
					var returnValue;

					this._super = _super;
					this._superApply = _superApply;

					returnValue = value.apply( this, arguments );

					this._super = __super;
					this._superApply = __superApply;

					return returnValue;
				};
			} )();
		} );
		constructor.prototype = $.widget.extend( basePrototype, {

			// TODO: remove support for widgetEventPrefix
			// always use the name + a colon as the prefix, e.g., draggable:start
			// don't prefix for widgets that aren't DOM-based
			widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
		}, proxiedPrototype, {
			constructor: constructor,
			namespace: namespace,
			widgetName: name,
			widgetFullName: fullName
		} );
		*/
		// If this widget is being redefined then we need to find all widgets that
		// are inheriting from it and redefine all of them so that they inherit from
		// the new version of this widget. We're essentially trying to replace one
		// level in the prototype chain.
		if ( existingConstructor ) {
			$.each( existingConstructor._childConstructors, function( i, child ) {
				var childPrototype = child.prototype;

				// Redefine the child widget using the same prototype that was
				// originally used, but inherit from the new version of the base
				$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor,
					child._proto );
			} );

			// Remove the list of existing child constructors from the old constructor
			// so the old child constructors can be garbage collected
			delete existingConstructor._childConstructors;
		} else {
			if (base._childConstructors) {
				base._childConstructors.push( constructor );
			}
		}

		//$.widget.bridge( name, constructor );

		splugins.register(constructor,name,fullName);

		return constructor;
	};

	$.widget.extend = function( target ) {
		var input = widgetSlice.call( arguments, 1 );
		var inputIndex = 0;
		var inputLength = input.length;
		var key;
		var value;

		for ( ; inputIndex < inputLength; inputIndex++ ) {
			for ( key in input[ inputIndex ] ) {
				value = input[ inputIndex ][ key ];
				if ( widgetHasOwnProperty.call( input[ inputIndex ], key ) && value !== undefined ) {

					// Clone objects
					if ( $.isPlainObject( value ) ) {
						target[ key ] = $.isPlainObject( target[ key ] ) ?
							$.widget.extend( {}, target[ key ], value ) :

							// Don't extend strings, arrays, etc. with objects
							$.widget.extend( {}, value );

					// Copy everything else by reference
					} else {
						target[ key ] = value;
					}
				}
			}
		}
		return target;
	};


	$.Widget = 	 JqPlugin.inherit({
		widgetName: "widget",
		widgetEventPrefix: "",
		defaultElement: "<div>",

		options: {
			classes: {},
			disabled: false,

			// Callbacks
			create: null
		},

		widget: function() {
			return this.element;
		},

		_setOption: function( key, value ) {
			if ( key === "classes" ) {
				this._setOptionClasses( value );
			}

			this.options[ key ] = value;

			if ( key === "disabled" ) {
				this._setOptionDisabled( value );
			}

			return this;
		},

		_setOptionClasses: function( value ) {
			var classKey, elements, currentElements;

			for ( classKey in value ) {
				currentElements = this.classesElementLookup[ classKey ];
				if ( value[ classKey ] === this.options.classes[ classKey ] ||
						!currentElements ||
						!currentElements.length ) {
					continue;
				}

				// We are doing this to create a new jQuery object because the _removeClass() call
				// on the next line is going to destroy the reference to the current elements being
				// tracked. We need to save a copy of this collection so that we can add the new classes
				// below.
				elements = $( currentElements.get() );
				this._removeClass( currentElements, classKey );

				// We don't use _addClass() here, because that uses this.options.classes
				// for generating the string of classes. We want to use the value passed in from
				// _setOption(), this is the new value of the classes option which was passed to
				// _setOption(). We pass this value directly to _classes().
				elements.addClass( this._classes( {
					element: elements,
					keys: classKey,
					classes: value,
					add: true
				} ));
			}
		},

		_setOptionDisabled: function( value ) {
			this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

			// If the widget is becoming disabled, then nothing is interactive
			if ( value ) {
				this._removeClass( this.hoverable, null, "ui-state-hover" );
				this._removeClass( this.focusable, null, "ui-state-focus" );
			}
		},

		enable: function() {
			return this._setOptions( { disabled: false } );
		},

		disable: function() {
			return this._setOptions( { disabled: true } );
		},


		_delay: function( handler, delay ) {
			function handlerProxy() {
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}
			var instance = this;
			return setTimeout( handlerProxy, delay || 0 );
		},

		_hoverable: function( element ) {
			this.hoverable = this.hoverable.add( element );
			this._on( element, {
				mouseenter: function( event ) {
					this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
				},
				mouseleave: function( event ) {
					this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
				}
			} );
		},

		_focusable: function( element ) {
			this.focusable = this.focusable.add( element );
			this._on( element, {
				focusin: function( event ) {
					this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
				},
				focusout: function( event ) {
					this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
				}
			} );
		}

	});

	$.Widget._childConstructors = [];

	$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
		$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
			if ( typeof options === "string" ) {
				options = { effect: options };
			}

			var hasOptions;
			var effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;

			options = options || {};
			if ( typeof options === "number" ) {
				options = { duration: options };
			}

			hasOptions = !$.isEmptyObject( options );
			options.complete = callback;

			if ( options.delay ) {
				element.delay( options.delay );
			}

			if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
				element[ method ]( options );
			} else if ( effectName !== method && element[ effectName ] ) {
				element[ effectName ]( options.duration, options.easing, callback );
			} else {
				element.queue( function( next ) {
					$( this )[ method ]();
					if ( callback ) {
						callback.call( element[ 0 ] );
					}
					next();
				} );
			}
		};
	} );

	return $.widget;

});

define('skylark-jquery/main',[
    "./core",
    "./ajax",
    "./callbacks",
    "./deferred",
    "./queue",
    "./JqueryPlugin",
    "./widget"
], function($) {
    return $;
});

define('skylark-jquery', ['skylark-jquery/main'], function (main) { return main; });

define('skylark-totaljs-jcomponent/utils/query',[
	"skylark-domx-query"
], function($) {
	return $;
});
define('skylark-totaljs-jcomponent/jc',[
	"skylark-langx/skylark",
	"skylark-langx/langx",
	"./utils/query"
],function(skylark,langx,$){
	var M = skylark.attach("intg.totaljs.jc",{}); // W.MAIN = W.M = W.jC = W.COM = M = {};

	// Internal cache
	//var blocked = {};
	//var storage = {};
	//var extensions = {}; // COMPONENT_EXTEND()
	//var configs = [];
	//var cache = {};
	//var paths = {}; // saved paths from get() and set()
	//var events = {};
	//var temp = {};
	//var toggles = [];
	//var versions = {};
	//var autofill = [];
	//var defaults = {};
	//var skips = {};

	//var current_owner = null;
	//var current_element = null;
	//var current_com = null;

	//W.EMPTYARRAY = [];
	//W.EMPTYOBJECT = {};
	//W.DATETIME = W.NOW = new Date();

	//- defaults

	//- M
	
	//- C



	//- VBinder

	//- W




	//- Scope


	//- Component

	//- Usage


	//- Windows

	//- Arrayx

	// ===============================================================
	// PROTOTYPES
	// ===============================================================
    
    //- Ex


	//- queryex



	//- parseBinder
	//- jBinder


	//- Plugin


	//M.months 
	//M.days 

	//M.skipproxy = '';

	//M.loaded = false;
	M.version = 16.044;
	//M.$localstorage = 'jc';
	M.$version = '';
	M.$language = '';

	//M.$parser = [];
	//M.transforms = {};
	//M.compiler = C;

	//M.compile = compile;


	M.prototypes = function(fn) {
		var obj = {};
		obj.Component = PPC;
		obj.Usage = USAGE.prototype;
		obj.Plugin = Plugin.prototype;
		fn.call(obj, obj);
		return M;
	};


	return M;
});
define('skylark-totaljs-jcomponent/langx/localCompare',[],function(){
	var localeCompare = window.Intl ? window.Intl.Collator().compare : function(a, b) {  // LCOMPARER
		return a.localeCompare(b);
	};

	return localeCompare;
});
define('skylark-totaljs-jcomponent/langx/regexp',[],function(){
	var MR = {};
	MR.int = /(-|\+)?[0-9]+/;
	MR.float = /(-|\+)?[0-9.,]+/;
	MR.date = /yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|a|ww|w/g;
	MR.pluralize = /#{1,}/g;
	MR.format = /\{\d+\}/g;

	return MR;
});

define('skylark-totaljs-jcomponent/langx/now',[],function(){
	var _n = new Date();

	return function(n) {
		if (n !== undefined) {
			if (typeof n === "boolean"){
				//reset
				_n = new Date();
			} else {
				_n = n;
			}
		}
		return _n;
	}

});
define('skylark-totaljs-jcomponent/langx/statics',[],function(){
	var statics = {};
	return statics;
});
define('skylark-totaljs-jcomponent/langx/ArrayEx',[
	"skylark-langx/langx",
	"./localCompare",
	"./regexp"
],function(slangx,localCompare,regexp){

	var AP = Array.prototype;
	AP.wait = AP.waitFor = function(onItem, callback, thread, tmp) {

		var self = this;
		var init = false;

		// INIT
		if (!tmp) {

			if (!slangx.isFunction(callback)) {
				thread = callback;
				callback = null;
			}

			tmp = {};
			tmp.pending = 0;
			tmp.index = 0;
			tmp.thread = thread;

			// thread === Boolean then array has to be removed item by item
			init = true;
		}

		var item = thread === true ? self.shift() : self[tmp.index++];

		if (item === undefined) {
			if (!tmp.pending) {
				callback && callback();
				tmp.cancel = true;
			}
			return self;
		}

		tmp.pending++;
		onItem.call(self, item, function() {
			setTimeout(next_wait, 1, self, onItem, callback, thread, tmp);
		}, tmp.index);

		if (!init || tmp.thread === 1){
			return self;
		}

		for (var i = 1; i < tmp.thread; i++) {
			self.wait(onItem, callback, 1, tmp);
		}

		return self;
	};

	function next_wait(self, onItem, callback, thread, tmp) {
		tmp.pending--;
		self.wait(onItem, callback, thread, tmp);
	}

	AP.limit = function(max, fn, callback, index) {

		if (index === undefined)
			index = 0;

		var current = [];
		var self = this;
		var length = index + max;

		for (var i = index; i < length; i++) {
			var item = self[i];

			if (item !== undefined) {
				current.push(item);
				continue;
			}

			if (!current.length) {
				callback && callback();
				return self;
			}

			fn(current, function() { callback && callback(); }, index, index + max);
			return self;
		}

		if (!current.length) {
			callback && callback();
			return self;
		}

		fn(current, function() {
			if (length < self.length)
				self.limit(max, fn, callback, length);
			else
				callback && callback();
		}, index, index + max);

		return self;
	};

	AP.async = function(context, callback) {

		if (slangx.isFunction(context)) {
			var tmp = callback;
			callback = context;
			context = tmp;
		}

		if (!context) {
			context = {};
		}

		var arr = this;
		var index = 0;

		var c = function() {
			var fn = arr[index++];
			if (fn) {
				fn.call(context, c, index - 1);
			} else {
				return callback && callback.call(context);
			}
		};

		c();
		return this;
	};

	AP.take = function(count) {
		var arr = [];
		var self = this;
		var length = self.length;
		for (var i = 0; i < length; i++) {
			arr.push(self[i]);
			if (arr.length >= count) {
				return arr;
			}
		}
		return arr;
	};

	AP.skip = function(count) {
		var arr = [];
		var self = this;
		var length = self.length;
		for (var i = 0; i < length; i++) {
			i >= count && arr.push(self[i]);
		}
		return arr;
	};

	AP.takeskip = function(take, skip) {
		var arr = [];
		var self = this;
		var length = self.length;
		for (var i = 0; i < length; i++) {
			if (i < skip)
				continue;
			if (arr.length >= take)
				return arr;
			arr.push(self[i]);
		}
		return arr;
	};

	AP.trim = function(empty) {
		var self = this;
		var output = [];
		for (var i = 0, length = self.length; i < length; i++) {
			if (slangx.isString(self[i]))
				self[i] = self[i].trim();
			if (empty || self[i])
				output.push(self[i]);
		}
		return output;
	};

	AP.findIndex = function(cb, value) {

		var self = this;
		var isFN = slangx.isFunction(cb);
		var isV = value !== undefined;

		for (var i = 0, length = self.length; i < length; i++) {
			if (isFN) {
				if (cb.call(self, self[i], i)) {
					return i;
				}
			} else if (isV) {
				if (self[i][cb] === value) {
					return i;
				}
			} else if (self[i] === cb) {
				return i;
			}
		}
		return -1;
	};

	AP.findAll = function(cb, value) {

		var self = this;
		var isFN = slangx.isFunction(cb);
		var isV = value !== undefined;
		var arr = [];

		for (var i = 0, length = self.length; i < length; i++) {
			if (isFN) {
				cb.call(self, self[i], i) && arr.push(self[i]);
			} else if (isV) {
				self[i][cb] === value && arr.push(self[i]);
			} else {
				self[i] === cb && arr.push(self[i]);
			}
		}
		return arr;
	};

	AP.findItem = function(cb, value) {
		var index = this.findIndex(cb, value);
		if (index !== -1)
			return this[index];
	};


	AP.remove = function(cb, value) {

		var self = this;
		var arr = [];
		var isFN = slangx.isFunction(cb);
		var isV = value !== undefined;

		for (var i = 0, length = self.length; i < length; i++) {
			if (isFN) {
				!cb.call(self, self[i], i) && arr.push(self[i]);
			} else if (isV) {
				self[i][cb] !== value && arr.push(self[i]);
			} else {
				self[i] !== cb && arr.push(self[i]);
			}
		}
		return arr;
	};

	AP.last = function(def) {
		var item = this[this.length - 1];
		return item === undefined ? def : item;
	};

	AP.quicksort = function(name, asc, type) {

		var self = this;
		var length = self.length;
		if (!length || length === 1) {
			return self;
		}

		if (typeof(name) === 'boolean') {
			asc = name;
			name = undefined;
		}

		if (asc == null || asc === 'asc')
			asc = true;
		else if (asc === 'desc')
			asc = false;

		switch (type) {
			case 'date':
				type = 4;
				break;
			case 'string':
				type = 1;
				break;
			case 'number':
				type = 2;
				break;
			case 'bool':
			case 'boolean':
				type = 3;
				break;
			default:
				type = 0;
				break;
		}

		if (!type) {
			var index = 0;
			while (!type) {
				var field = self[index++];
				if (field === undefined)
					return self;
				if (name)
					field = field[name];
				switch (typeof(field)) {
					case 'string':
						type = field.isJSONDate() ? 4 : 1;
						break;
					case 'number':
						type = 2;
						break;
					case 'boolean':
						type = 3;
						break;
					default:
						if (field instanceof Date)
							type = 4;
						break;
				}
			}
		}

		self.sort(function(a, b) {

			var va = name ? a[name] : a;
			var vb = name ? b[name] : b;

			if (va == null)
				return asc ? -1 : 1;

			if (vb == null)
				return asc ? 1 : -1;

			// String
			if (type === 1) {
				return va && vb ? (asc ? localCompare(va, vb) : localCompare(vb, va)) : 0;
			} else if (type === 2) {
				return va > vb ? (asc ? 1 : -1) : va < vb ? (asc ? -1 : 1) : 0;
			} else if (type === 3) {
				return va === true && vb === false ? (asc ? 1 : -1) : va === false && vb === true ? (asc ? -1 : 1) : 0;
			} else if (type === 4) {
				if (!va || !vb)
					return 0;
				if (!va.getTime) {
					va = new Date(va);
				}
				if (!vb.getTime) {
					vb = new Date(vb);
				}
				var at = va.getTime();
				var bt = vb.getTime();
				return at > bt ? (asc ? 1 : -1) : at < bt ? (asc ? -1 : 1) : 0;
			}
			return 0;
		});

		return self;
	};

	AP.attr = function(name, value) {

		var self = this;

		if (arguments.length === 2) {
			if (value == null)
				return self;
		} else if (value === undefined)
			value = name.toString();

		self.push(name + '="' + value.toString().env().toString().replace(/[<>&"]/g, function(c) {
			switch (c) {
				case '&': return '&amp;';
				case '<': return '&lt;';
				case '>': return '&gt;';
				case '"': return '&quot;';
			}
			return c;
		}) + '"');

		return self;
	};

	AP.scalar = function(type, key, def) {

		var output = def;
		var isDate = false;
		var isAvg = type === 'avg' || type === 'average';
		var isDistinct = type === 'distinct';
		var self = this;

		for (var i = 0, length = self.length; i < length; i++) {
			var val = key ? self[i][key] : self[i];

			if (slangx.isString(val))
				val = val.parseFloat();

			if (val instanceof Date) {
				isDate = true;
				val = val.getTime();
			}

			if (isDistinct) {
				if (!output)
					output = [];
				output.indexOf(val) === -1 && output.push(val);
				continue;
			}

			if (type === 'median') {
				if (!output)
					output = [];
				output.push(val);
				continue;
			}

			if (type === 'sum' || isAvg) {
				if (output)
					output += val;
				else
					output = val;
				continue;
			}

			if (type !== 'range') {
				if (!output)
					output = val;
			} else {
				if (!output) {
					output = new Array(2);
					output[0] = val;
					output[1] = val;
				}
			}

			switch (type) {
				case 'range':
					output[0] = Math.min(output[0], val);
					output[1] = Math.max(output[1], val);
					break;
				case 'min':
					output = Math.min(output, val);
					break;
				case 'max':
					output = Math.max(output, val);
					break;
			}
		}

		if (isDistinct)
			return output;

		if (isAvg) {
			output = output / self.length;
			return isDate ? new Date(output) : output;
		}

		if (type === 'median') {
			if (!output)
				output = [0];
			output.sort(function(a, b) {
				return a - b;
			});
			var half = Math.floor(output.length / 2);
			output = output.length % 2 ? output[half] : (output[half - 1] + output[half]) / 2.0;
		}

		if (isDate) {
			if (slangx.isNumber(output))
				return new Date(output);
			output[0] = new Date(output[0]);
			output[1] = new Date(output[1]);
		}

		return output;
	};

	
});
define('skylark-totaljs-jcomponent/langx/DateEx',[
	"skylark-langx/langx",
	"./regexp",
	"./statics"
],function(langx,regexp,statics){

	Date.months = 'January,February,March,April,May,June,July,August,September,October,November,December'.split(',');
	Date.days = 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(',');

	var MD = {
		dateformat : null

	};
	
	window.$jcdatempam = function(value) {  // TODO: will be changed
		return value >= 12 ? value - 12 : value;
	};


	var DP = Date.prototype;
	DP.toNumber = function(format) {
		return +this.format(format || 'yyyyMMdd');
	};

	DP.parseDate = function() {
		return this;
	};

	DP.add = function(type, value) {

		if (value === undefined) {
			var arr = type.split(' ');
			type = arr[1];
			value = parseInt(arr[0]);
		}

		if (langx.isString(value) )
			value = value.env();

		var self = this;
		var dt = new Date(self.getTime());

		switch(type.substring(0, 3)) {
			case 's':
			case 'ss':
			case 'sec':
				dt.setSeconds(dt.getSeconds() + value);
				return dt;
			case 'm':
			case 'mm':
			case 'min':
				dt.setMinutes(dt.getMinutes() + value);
				return dt;
			case 'h':
			case 'hh':
			case 'hou':
				dt.setHours(dt.getHours() + value);
				return dt;
			case 'd':
			case 'dd':
			case 'day':
				dt.setDate(dt.getDate() + value);
				return dt;
			case 'w':
			case 'ww':
			case 'wee':
				dt.setDate(dt.getDate() + (value * 7));
				return dt;
			case 'M':
			case 'MM':
			case 'mon':
				dt.setMonth(dt.getMonth() + value);
				return dt;
			case 'y':
			case 'yy':
			case 'yyy':
			case 'yea':
				dt.setFullYear(dt.getFullYear() + value);
				return dt;
		}
		return dt;
	};

	DP.toUTC = function(ticks) {
		var self = this;
		var dt = self.getTime() + self.getTimezoneOffset() * 60000;
		return ticks ? dt : new Date(dt);
	};

	DP.format = function(format, utc) {

		var self = utc ? this.toUTC() : this;

		if (format == null)
			format = MD.dateformat;

		if (!format)
			return self.getFullYear() + '-' + (self.getMonth() + 1).toString().padLeft(2, '0') + '-' + self.getDate().toString().padLeft(2, '0') + 'T' + self.getHours().toString().padLeft(2, '0') + ':' + self.getMinutes().toString().padLeft(2, '0') + ':' + self.getSeconds().toString().padLeft(2, '0') + '.' + self.getMilliseconds().toString().padLeft(3, '0') + 'Z';

		var key = 'dt_' + format;

		if (statics[key])
			return statics[key](self);

		var half = false;

		format = format.env();

		if (format && format.substring(0, 1) === '!') {
			half = true;
			format = format.substring(1);
		}

		var beg = '\'+';
		var end = '+\'';
		var before = [];

		var ismm = false;
		var isdd = false;
		var isww = false;

		format = format.replace(regexp.date, function(key) {
			switch (key) {
				case 'yyyy':
					return beg + 'd.getFullYear()' + end;
				case 'yy':
					return beg + 'd.getFullYear().toString().substring(2)' + end;
				case 'MMM':
					ismm = true;
					return beg + 'mm.substring(0, 3)' + end;
				case 'MMMM':
					ismm = true;
					return beg + 'mm' + end;
				case 'MM':
					return beg + '(d.getMonth() + 1).padLeft(2, \'0\')' + end;
				case 'M':
					return beg + '(d.getMonth() + 1)' + end;
				case 'ddd':
					isdd = true;
					return beg + 'dd.substring(0, 2).toUpperCase()' + end;
				case 'dddd':
					isdd = true;
					return beg + 'dd' + end;
				case 'dd':
					return beg + 'd.getDate().padLeft(2, \'0\')' + end;
				case 'd':
					return beg + 'd.getDate()' + end;
				case 'HH':
				case 'hh':
					return beg + (half ? 'window.$jcdatempam(d.getHours()).padLeft(2, \'0\')' : 'd.getHours().padLeft(2, \'0\')') + end;
				case 'H':
				case 'h':
					return beg + (half ? 'window.$jcdatempam(d.getHours())' : 'd.getHours()') + end;
				case 'mm':
					return beg + 'd.getMinutes().padLeft(2, \'0\')' + end;
				case 'm':
					return beg + 'd.getMinutes()' + end;
				case 'ss':
					return beg + 'd.getSeconds().padLeft(2, \'0\')' + end;
				case 's':
					return beg + 'd.getSeconds()' + end;
				case 'w':
				case 'ww':
					isww = true;
					return beg + (key === 'ww' ? 'ww.padLeft(2, \'0\')' : 'ww') + end;
				case 'a':
					var b = '\'PM\':\'AM\'';
					return beg + '(d.getHours() >= 12 ? ' + b + ')' + end;
			}
		});

		ismm && before.push('var mm = M.months[d.getMonth()];');
		isdd && before.push('var dd = M.days[d.getDay()];');
		isww && before.push('var ww = new Date(+d);ww.setHours(0, 0, 0);ww.setDate(ww.getDate() + 4 - (ww.getDay() || 7));ww = Math.ceil((((ww - new Date(ww.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);');

		statics[key] = new Function('d', before.join('\n') + 'return \'' + format + '\';');
		return statics[key](self);
	};
	
});
define('skylark-totaljs-jcomponent/langx/NumberEx',[
	"./regexp"
],function(regexp){
	var NP = Number.prototype;

	var	thousandsseparator = ' ',
		decimalseparator = '.' ;

	NP.pluralize = function(zero, one, few, other) {

		if (zero instanceof Array) {
			one = zero[1];
			few = zero[2];
			other = zero[3];
			zero = zero[0];
		}

		var num = this;
		var value = '';

		if (num == 0)
			value = zero || '';
		else if (num == 1)
			value = one || '';
		else if (num > 1 && num < 5)
			value = few || '';
		else
			value = other;

		return value.indexOf('#') === -1 ? value : value.replace(regexp.pluralize, function(text) {
			return text === '##' ? num.format() : num.toString();
		});
	};

	NP.format = function(decimals, separator, separatorDecimal) {

		var self = this;
		var num = self.toString();
		var dec = '';
		var output = '';
		var minus = num.substring(0, 1) === '-' ? '-' : '';
		if (minus)
			num = num.substring(1);

		var index = num.indexOf('.');

		if (typeof(decimals) === 'string') {
			var tmp;
			if (decimals.substring(0, 1) === '[') {
				tmp = ENV(decimals.substring(1, decimals.length - 1));
				if (tmp) {
					decimals = tmp.decimals;
					if (tmp.separator)
						separator = tmp.separator;
					if (tmp.decimalseparator)
						separatorDecimal = tmp.decimalseparator;
				}
			} else {
				tmp = separator;
				separator = decimals;
				decimals = tmp;
			}
		}

		if (separator === undefined)
			separator = thousandsseparator; //MD.thousandsseparator

		if (index !== -1) {
			dec = num.substring(index + 1);
			num = num.substring(0, index);
		}

		index = -1;
		for (var i = num.length - 1; i >= 0; i--) {
			index++;
			if (index > 0 && index % 3 === 0)
				output = separator + output;
			output = num[i] + output;
		}

		if (decimals || dec.length) {
			if (dec.length > decimals)
				dec = dec.substring(0, decimals || 0);
			else
				dec = dec.padRight(decimals || 0, '0');
		}

		if (dec.length && separatorDecimal === undefined)
			separatorDecimal = MD.decimalseparator;

		return minus + output + (dec.length ? separatorDecimal + dec : '');
	};

	NP.padLeft = function(t, e) {
		return this.toString().padLeft(t, e || '0');
	};

	NP.padRight = function(t, e) {
		return this.toString().padRight(t, e || '0');
	};

	NP.async = function(fn, callback) {
		var number = this;
		if (number >= 0)
			fn(number, function() {
				setTimeout(function() {
					(number - 1).async(fn, callback);
				}, 1);
			});
		else
			callback && callback();
		return number;
	};

	NP.add = NP.inc = function(value, decimals) {

		var self = this;

		if (value == null)
			return self;

		if (typeof(value) === 'number')
			return self + value;

		var first = value.charCodeAt(0);
		var is = false;

		if (first < 48 || first > 57) {
			is = true;
			value = value.substring(1);
		}

		var length = value.length;
		var num;

		if (value[length - 1] === '%') {
			value = value.substring(0, length - 1);
			if (is) {
				var val = value.parseFloat();
				switch (first) {
					case 42:
						num = self * ((self / 100) * val);
						break;
					case 43:
						num = self + ((self / 100) * val);
						break;
					case 45:
						num = self - ((self / 100) * val);
						break;
					case 47:
						num = self / ((self / 100) * val);
						break;
				}
				return decimals !== undefined ? num.floor(decimals) : num;
			} else {
				num = (self / 100) * value.parseFloat();
				return decimals !== undefined ? num.floor(decimals) : num;
			}

		} else
			num = value.parseFloat();

		switch (first) {
			case 42:
				num = self * num;
				break;
			case 43:
				num = self + num;
				break;
			case 45:
				num = self - num;
				break;
			case 47:
				num = self / num;
				break;
			default:
				num = self;
				break;
		}

		return decimals !== undefined ? num.floor(decimals) : num;
	};

	NP.floor = function(decimals) {
		return Math.floor(this * Math.pow(10, decimals)) / Math.pow(10, decimals);
	};

	NP.parseDate = function(offset) {
		return new Date(this + (offset || 0));
	};
	
});
define('skylark-totaljs-jcomponent/langx/StringEx',[
	"skylark-langx/langx",
	"./regexp",
	"./now"
],function(slangx,regexp,now){
	var MD = {
		root : ''  // String or Function

	}
	var REGWILDCARD = /\.\*/;

	var REGEMPTY = /\s/g;


	var REGSEARCH = /[^a-zA-Zá-žÁ-Žа-яА-Я\d\s:]/g;
	var DIACRITICS = {225:'a',228:'a',269:'c',271:'d',233:'e',283:'e',357:'t',382:'z',250:'u',367:'u',252:'u',369:'u',237:'i',239:'i',244:'o',243:'o',246:'o',353:'s',318:'l',314:'l',253:'y',255:'y',263:'c',345:'r',341:'r',328:'n',337:'o'};
	
	var MV =  {}; //jc.validators =
	MV.url = /^(https?:\/\/(?:www\.|(?!www))[^\s.#!:?+=&@!$'~*,;/()[\]]+\.[^\s#!?+=&@!$'~*,;()[\]\\]{2,}\/?|www\.[^\s#!:.?+=&@!$'~*,;/()[\]]+\.[^\s#!?+=&@!$'~*,;()[\]\\]{2,}\/?)/i;
	MV.phone = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im;
	MV.email = /^[a-zA-Z0-9-_.+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;	

	var SP = String.prototype;
	SP.trimAll = function() {
		return this.replace(REGEMPTY, '');
	};

	SP.ROOT = function(noBase) {
		var url = this;
		var r = MD.root;
		var b = MD.baseurl;
		var ext = /(https|http|wss|ws|file):\/\/|\/\/[a-z0-9]|[a-z]:/i;
		var replace = function(t) {
			return t.substring(0, 1) + '/';
		};
		if (r) {
			url = slangx.isFunction(r) ? r(url) : ext.test(url) ? url : (r + url);
		} else if (!noBase && b) {
			url = slangx.isFunction(b)  ? b(url) : ext.test(url) ? url : (b + url);
		}
		return url.replace(/[^:]\/{2,}/, replace);
	};

	SP.replaceWildcard = function() {
		return this.replace(REGWILDCARD, '');
	};

	SP.parseConfig = SP.$config = function(def, callback) {

		var output;

		switch (typeof(def)) {
			case 'function':
				callback = def;
				output = {};
				break;
			case 'string':
				output = def.parseConfig();
				break;
			case 'object':
				if (def != null)
					output = def;
				else
					output = {};
				break;
			default:
				output = {};
				break;
		}

		var arr = this.env().replace(/\\;/g, '\0').split(';');
		var num = /^(-)?[0-9.]+$/;
		var colon = /(https|http|wss|ws):\/\//gi;

		for (var i = 0, length = arr.length; i < length; i++) {

			var item = arr[i].replace(/\0/g, ';').replace(/\\:/g, '\0').replace(colon, function(text) {
				return text.replace(/:/g, '\0');
			});

			var kv = item.split(':');
			var l = kv.length;

			if (l !== 2)
				continue;

			var k = kv[0].trim();
			var v = kv[1].trim().replace(/\0/g, ':').env();

			if (v === 'true' || v === 'false')
				v = v === 'true';
			else if (num.test(v)) {
				var tmp = +v;
				if (!isNaN(tmp))
					v = tmp;
			}

			output[k] = v;
			callback && callback(k, v);
		}

		return output;
	};

	SP.render = function(a, b) {
		return Tangular.render(this, a, b);
	};

	SP.isJSONDate = function() {
		var t = this;
		var l = t.length - 1;
		return l > 18 && l < 30 && t.charCodeAt(l) === 90 && t.charCodeAt(10) === 84 && t.charCodeAt(4) === 45 && t.charCodeAt(13) === 58 && t.charCodeAt(16) === 58;
	};

	SP.parseExpire = function() {

		var str = this.split(' ');
		var number = parseInt(str[0]);

		if (isNaN(number))
			return 0;

		var min = 60000 * 60;

		switch (str[1].trim().replace(/\./g, '')) {
			case 'minutes':
			case 'minute':
			case 'min':
			case 'mm':
			case 'm':
				return 60000 * number;
			case 'hours':
			case 'hour':
			case 'HH':
			case 'hh':
			case 'h':
			case 'H':
				return min * number;
			case 'seconds':
			case 'second':
			case 'sec':
			case 'ss':
			case 's':
				return 1000 * number;
			case 'days':
			case 'day':
			case 'DD':
			case 'dd':
			case 'd':
				return (min * 24) * number;
			case 'months':
			case 'month':
			case 'MM':
			case 'M':
				return (min * 24 * 28) * number;
			case 'weeks':
			case 'week':
			case 'W':
			case 'w':
				return (min * 24 * 7) * number;
			case 'years':
			case 'year':
			case 'yyyy':
			case 'yy':
			case 'y':
				return (min * 24 * 365) * number;
			default:
				return 0;
		}
	};

	SP.removeDiacritics = function() {
		var buf = '';
		for (var i = 0, length = this.length; i < length; i++) {
			var c = this[i];
			var code = c.charCodeAt(0);
			var isUpper = false;

			var r = DIACRITICS[code];
			if (r === undefined) {
				code = c.toLowerCase().charCodeAt(0);
				r = DIACRITICS[code];
				isUpper = true;
			}

			if (r === undefined) {
				buf += c;
				continue;
			}

			c = r;
			buf += isUpper ? c.toUpperCase() : c;
		}
		return buf;
	};

	SP.toSearch = function() {

		var str = this.replace(REGSEARCH, '').trim().toLowerCase().removeDiacritics();
		var buf = [];
		var prev = '';

		for (var i = 0, length = str.length; i < length; i++) {
			var c = str.substring(i, i + 1);
			if (c === 'y')
				c = 'i';
			if (c !== prev) {
				prev = c;
				buf.push(c);
			}
		}

		return buf.join('');
	};

	SP.slug = function(max) {
		max = max || 60;

		var self = this.trim().toLowerCase().removeDiacritics();
		var builder = '';
		var length = self.length;

		for (var i = 0; i < length; i++) {
			var c = self.substring(i, i + 1);
			var code = self.charCodeAt(i);

			if (builder.length >= max)
				break;

			if (code > 31 && code < 48) {
				if (builder.substring(builder.length - 1, builder.length) !== '-')
					builder += '-';
			} else if (code > 47 && code < 58)
				builder += c;
			else if (code > 94 && code < 123)
				builder += c;
		}

		var l = builder.length - 1;
		return builder[l] === '-' ? builder.substring(0, l) : builder;
	};

	SP.isEmail = function() {
		var str = this;
		return str.length <= 4 ? false : MV.email.test(str);
	};

	SP.isPhone = function() {
		var str = this;
		return str.length < 6 ? false : MV.phone.test(str);
	};

	SP.isURL = function() {
		var str = this;
		return str.length <= 7 ? false : MV.url.test(str);
	};

	SP.parseInt = function(def) {
		var str = this.trim();
		var val = str.match(regexp.int);
		if (!val)
			return def || 0;
		val = +val[0];
		return isNaN(val) ? def || 0 : val;
	};

	SP.parseFloat = function(def) {
		var str = this.trim();
		var val = str.match(regexp.float);
		if (!val)
			return def || 0;
		val = val[0];
		if (val.indexOf(',') !== -1)
			val = val.replace(',', '.');
		val = +val;
		return isNaN(val) ? def || 0 : val;
	};

	SP.padLeft = function(t, e) {
		var r = this.toString();
		return Array(Math.max(0, t - r.length + 1)).join(e || ' ') + r;
	};

	SP.padRight = function(t, e) {
		var r = this.toString();
		return r + Array(Math.max(0, t - r.length + 1)).join(e || ' ');
	};
	
	SP.format = function() {
		var arg = arguments;
		return this.replace(regexp.format, function(text) {
			var value = arg[+text.substring(1, text.length - 1)];
			return value == null ? '' : value instanceof Array ? value.join('') : value;
		});
	};

	SP.parseDate = function() {
		var self = this.trim();
		if (!self)
			return null;

		var lc = self.charCodeAt(self.length - 1);

		// Classic date
		if (lc === 41)
			return new Date(self);

		// JSON format
		if (lc === 90)
			return new Date(Date.parse(self));

		var arr = self.indexOf(' ') === -1 ? self.split('T') : self.split(' ');
		var index = arr[0].indexOf(':');
		var length = arr[0].length;

		if (index !== -1) {
			var tmp = arr[1];
			arr[1] = arr[0];
			arr[0] = tmp;
		}

		if (arr[0] === undefined)
			arr[0] = '';

		var noTime = arr[1] === undefined ? true : arr[1].length === 0;

		for (var i = 0; i < length; i++) {
			var c = arr[0].charCodeAt(i);
			if ((c > 47 && c < 58) || c === 45 || c === 46)
				continue;
			if (noTime)
				return new Date(self);
		}

		if (arr[1] === undefined)
			arr[1] = '00:00:00';

		var firstDay = arr[0].indexOf('-') === -1;

		var date = (arr[0] || '').split(firstDay ? '.' : '-');
		var time = (arr[1] || '').split(':');
		var parsed = [];

		if (date.length < 4 && time.length < 2)
			return new Date(self);

		index = (time[2] || '').indexOf('.');

		// milliseconds
		if (index !== -1) {
			time[3] = time[2].substring(index + 1);
			time[2] = time[2].substring(0, index);
		} else
			time[3] = '0';

		parsed.push(+date[firstDay ? 2 : 0]); // year
		parsed.push(+date[1]); // month
		parsed.push(+date[firstDay ? 0 : 2]); // day
		parsed.push(+time[0]); // hours
		parsed.push(+time[1]); // minutes
		parsed.push(+time[2]); // seconds
		parsed.push(+time[3]); // miliseconds

		var def = now(true); //def = W.DATETIME = W.NOW = new Date();

		for (var i = 0, length = parsed.length; i < length; i++) {
			if (isNaN(parsed[i]))
				parsed[i] = 0;

			var value = parsed[i];
			if (value !== 0)
				continue;

			switch (i) {
				case 0:
					if (value <= 0)
						parsed[i] = def.getFullYear();
					break;
				case 1:
					if (value <= 0)
						parsed[i] = def.getMonth() + 1;
					break;
				case 2:
					if (value <= 0)
						parsed[i] = def.getDate();
					break;
			}
		}

		return new Date(parsed[0], parsed[1] - 1, parsed[2], parsed[3], parsed[4], parsed[5]);
	};
});
define('skylark-totaljs-jcomponent/langx',[
	"skylark-langx/langx",
	"./jc",
	"./langx/localCompare",
	"./langx/regexp",
	"./langx/now",
	"./langx/statics",
	"./langx/ArrayEx",
	"./langx/DateEx",
	"./langx/NumberEx",
	"./langx/StringEx"
],function(slangx,jc,localCompare,regexp,now,statics){

	var MD = {
		jsoncompress : false,
		jsondate : true
	};

	function async(arr, fn, done) {
		var item = arr.shift();
		if (item == null) {
			return done && done();
		}
		fn(item, function() {
			async(arr, fn, done);
		});
	}


	function clone(obj, path) {

		var type = typeof(obj);
		switch (type) {
			case 'number':
			case 'boolean':
				return obj;
			case 'string':
				return path ? obj : clone(get(obj), true);
		}

		if (obj == null)
			return obj;

		if (obj instanceof Date)
			return new Date(obj.getTime());

		return parse(JSON.stringify(obj));
	}

	function copy(a, b) {
		var keys = Object.keys(a);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var val = a[key];
			var type = typeof(val);
			b[key] = type === TYPE_O ? val ? clone(val) : val : val;
		}
		return b;
	}


	/*
	 * Generates a unique String.
	 *
	 */
	function guid(size) {
		if (!size)
			size = 10;
		var l = ((size / 10) >> 0) + 1;
		var b = [];
		for (var i = 0; i < l; i++)
			b.push(Math.random().toString(36).substring(2));
		return b.join('').substring(0, size);
	}

	/*
	 *  Generates Number hash sum.
	 *
	 */
	function hashCode(s) {
		if (!s)
			return 0;
		var type = typeof(s);
		if (type === 'number')
			return s;
		else if (type === 'boolean')
			return s ? 1 : 0;
		else if (s instanceof Date)
			return s.getTime();
		else if (type === 'object')
			s = stringify(s);
		var hash = 0, i, char;
		if (!s.length)
			return hash;
		var l = s.length;
		for (i = 0; i < l; i++) {
			char = s.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	}

	/*
	 *  Parses JSON String to Object.
	 *
	 */
	function parse(value, date) { // PARSE

		// Is selector?
		var c = value.substring(0, 1);
		if (c === '#' || c === '.')
			return parse($(value).html(), date); // PARSE

		if (date === undefined) {
			date = MD.jsondate;
		} 
		try {
			return JSON.parse(value, function(key, value) {
				return slangx.isString(value)  && date && value.isJSONDate() ? new Date(value) : value;
			});
		} catch (e) {
			return null;
		}
	}



	/*
	 * Serializes Object to JSON.
	 * @param
	 * @param 
	 * @param {Array|Object} fields
	 */
	function stringify(obj, compress, fields) { //STRINGIFY
		if(compress === undefined) {
			compress = MD.jsoncompress;
		} 
		var tf = typeof(fields);
		return JSON.stringify(obj, function(key, value) {

			if (!key) {
				return value;
			}

			if (fields) {
				if (fields instanceof Array) {
					if (fields.indexOf(key) === -1) {
						return undefined;
					}
				} else if (langx.isFunction(tf)) {
					if (!fields(key, value)){
						return undefined;
					}
				} else if (fields[key] === false)
					return undefined;
			}

			if (compress === true) {
				//var t = typeof(value);
				if (langx.isString(value)) {
					value = value.trim();
					return value ? value : undefined;
				} else if (value === false || value == null)
					return undefined;
			}

			return value;
		});
	}

	var empties = {
		array : [],
		object : {},
		fn :  function() {}
	};

	var singletons = {};

	function singleton(name, def) { //W.SINGLETON 
		return singletons[name] || (singletons[name] = (new Function('return ' + (def || '{}')))());
	};


	if (Object.freeze) {
		Object.freeze(empties.array);
		Object.freeze(empties.object);
	}


   /**
   * improves setTimeout method. This method cancels a previous unexecuted call.
   * @param  {String} name 
   * @param  {Function(name)} fn 
   * @param  {Number} timeout 
   * @param  {Number} limit  Optional, a maximum clear limit (default: 0)
   * @param  {Object} param  Optional, additional argument
   * @return {Number} 
   */
	function setTimeout2(name, fn, timeout, limit, param) { //W.setTimeout2 = 
		var key = ':' + name;
		if (limit > 0) {
			var key2 = key + ':limit';
			if (statics[key2] >= limit) {
				return;
			}
			statics[key2] = (statics[key2] || 0) + 1;
			statics[key] && clearTimeout(statics[key]);
			return statics[key] = setTimeout(function(param) {
				statics[key2] = undefined;
				fn && fn(param);
			}, timeout, param);
		}
		statics[key] && clearTimeout(statics[key]);
		return statics[key] = setTimeout(fn, timeout, param);
	}

   /**
   * clears a registered by setTimeout2().
   * @param  {String} name 
   * @return {Boolean} 
   */
	function clearTimeout2(name) { // W.clearTimeout2 = 
		var key = ':' + name;
		if (statics[key]) {
			clearTimeout(statics[key]);
			statics[key] = undefined;
			statics[key + ':limit'] && (statics[key + ':limit'] = undefined);
			return true;
		}
		return false;
	}



	return jc.langx = {
		each    : slangx.each,
		Evented : slangx.Evented,
		extend : slangx.extend,
		hoster  : slangx.hoster,
		isFunction : slangx.isFunction,
		isNumber : slangx.isNumber,
		isObject : slangx.isObject,
		isPlainObject: slangx.isPlainObject,
		isString : slangx.isString,
		klass : slangx.klass,
		mixin : slangx.mixin,
		result : slangx.result,
		topic : slangx.topic,
		Xhr : slangx.Xhr,

		async:async,
		clearTimeout2:clearTimeout2,
		clone:clone,
		copy:copy,
		empties:empties,
		Evented : slangx.Evented,
		guid:guid,
		hashCode:hashCode,
		localCompare : localCompare,
		now:now,
		parse:parse,
		regexp:regexp,
		result: slangx.result,
		setTimeout2:setTimeout2,
		singleton:singleton,
		stringify:stringify,
		statics : statics
	};

});
define('skylark-totaljs-jcomponent/binding/Binder',[
	"../utils/query",
	"../langx"
],function($, langx){

	var DEFMODEL = { value: null };
	/*
	 * A binder declaration:
	 * <div data-bind="path.to.property__command1:exp__command2:exp__commandN:exp"></div>
	 */
	function jBinder() {
		//this.path = null;
		//this.format = null;
		//this.virtual = null;
		//this.com = null; 
		//this.child = null;

	}

	var JBP = jBinder.prototype;

	JBP.exec = function(value, path, index, wakeup, can) {

		var item = this;
		var el = item.el;
		if (index != null) {
			if (item.child == null)
				return;
			item = item.child[index];
			if (item == null) {
				return;
			}
		}

		if (item.notnull && value == null) {
			return;
		}

		if (item.selector) {
			if (item.cache) {
				el = item.cache;
			} else {
				el = el.find(item.selector);
				if (el.length) {
					item.cache = el;
				}
			}
		}

		if (!el.length) {
			return;
		}

		if (!wakeup && item.delay) {
			item.$delay && clearTimeout(item.$delay);
			item.$delay = setTimeout(function(obj, value, path, index, can) {
				obj.$delay = null;
				obj.exec(value, path, index, true, can);
			}, item.delay, item, value, path, index, can);
			return;
		}

		if (item.init) {
			if (item.strict && item.path !== path)
				return;
			if (item.track && item.path !== path) {
				var can = false;
				for (var i = 0; i < item.track.length; i++) {
					if (item.track[i] === path) {
						can = true;
						break;
					}
				}
				if (!can) {
					return;
				}
			}
		} else {
			item.init = 1;
		}

		if (item.def && value == null) {
			value = item.def;
		}

		if (item.format) {
			value = item.format(value, path);
		}

		var tmp = null;

		can = can !== false;

		if (item.show && (value != null || !item.show.$nn)) {
			tmp = item.show.call(item.el, value, path, item.el);
			el.tclass('hidden', !tmp);
			if (!tmp) {
				can = false;
			}
		}

		if (item.hide && (value != null || !item.hide.$nn)) {
			tmp = item.hide.call(el, value, path, el);
			el.tclass('hidden', tmp);
			if (tmp) {
				can = false;
			}
		}

		if (item.invisible && (value != null || !item.invisible.$nn)) {
			tmp = item.invisible.call(item.el, value, path, item.el);
			el.tclass('invisible', tmp);
			if (!tmp) {
				can = false;
			}
		}

		if (item.visible && (value != null || !item.visible.$nn)) {
			tmp = item.visible.call(item.el, value, path, item.el);
			el.tclass('invisible', !tmp);
			if (!tmp) {
				can = false;
			}
		}

		if (item.classes) {
			for (var i = 0; i < item.classes.length; i++) {
				var cls = item.classes[i];
				if (!cls.fn.$nn || value != null)
					el.tclass(cls.name, !!cls.fn.call(el, value, path, el));
			}
		}

		if (can && item.import) {
			if (langx.isFunction(item.import)) {
				if (value) {
					!item.$ic && (item.$ic = {});
					!item.$ic[value] && http.import('ONCE ' + value, el); //IMPORT TODO
					item.$ic[value] = 1;
				}
			} else {
				http.import(item.import, el); //IMPORT TODO
				delete item.import;
			}
		}

		if (item.config && (can || item.config.$nv)) {
			if (value != null || !item.config.$nn) {
				tmp = item.config.call(el, value, path, el);
				if (tmp) {
					for (var i = 0; i < el.length; i++) {
						var c = el[i].$com;
						c && c.$ready && c.reconfigure(tmp);
					}
				}
			}
		}

		if (item.html && (can || item.html.$nv)) {
			if (value != null || !item.html.$nn) {
				tmp = item.html.call(el, value, path, el);
				el.html(tmp == null ? (item.htmlbk || '') : tmp);
			} else
				el.html(item.htmlbk || '');
		}

		if (item.text && (can || item.text.$nv)) {
			if (value != null || !item.text.$nn) {
				tmp = item.text.call(el, value, path, el);
				el.text(tmp == null ? (item.htmlbk || '') : tmp);
			} else
				el.html(item.htmlbk || '');
		}

		if (item.val && (can || item.val.$nv)) {
			if (value != null || !item.val.$nn) {
				tmp = item.val.call(el, value, path, el);
				el.val(tmp == null ? (item.valbk || '') : tmp);
			} else
				el.val(item.valbk || '');
		}

		if (item.template && (can || item.template.$nv) && (value != null || !item.template.$nn)) {
			DEFMODEL.value = value;
			DEFMODEL.path = path;
			el.html(item.template(DEFMODEL));
		}

		if (item.disabled && (can || item.disabled.$nv)) {
			if (value != null || !item.disabled.$nn) {
				tmp = item.disabled.call(el, value, path, el);
				el.prop('disabled', tmp == true);
			} else
				el.prop('disabled', item.disabledbk == true);
		}

		if (item.enabled && (can || item.enabled.$nv)) {
			if (value != null || !item.enabled.$nn) {
				tmp = item.enabled.call(el, value, path, el);
				el.prop('disabled', !tmp);
			} else {
				el.prop('disabled', item.enabledbk == false);
			}
		}

		if (item.checked && (can || item.checked.$nv)) {
			if (value != null || !item.checked.$nn) {
				tmp = item.checked.call(el, value, path, el);
				el.prop('checked', tmp == true);
			} else {
				el.prop('checked', item.checkedbk == true);
			}
		}

		if (item.title && (can || item.title.$nv)) {
			if (value != null || !item.title.$nn) {
				tmp = item.title.call(el, value, path, el);
				el.attr('title', tmp == null ? (item.titlebk || '') : tmp);
			} else {
				el.attr('title', item.titlebk || '');
			}
		}

		if (item.href && (can || item.href.$nv)) {
			if (value != null || !item.href.$nn) {
				tmp = item.href.call(el, value, path, el);
				el.attr('href', tmp == null ? (item.hrefbk || '') : tmp);
			} else {
				el.attr(item.hrefbk || '');
			}
		}

		if (item.src && (can || item.src.$nv)) {
			if (value != null || !item.src.$nn) {
				tmp = item.src.call(el, value, path, el);
				el.attr('src', tmp == null ? (item.srcbk || '') : tmp);
			} else {
				el.attr('src', item.srcbk || '');
			}
		}

		if (item.setter && (can || item.setter.$nv) && (value != null || !item.setter.$nn))
			item.setter.call(el, value, path, el);

		if (item.change && (value != null || !item.change.$nn)) {
			item.change.call(el, value, path, el);
		}

		if (can && index == null && item.child) {
			for (var i = 0; i < item.child.length; i++)
				item.exec(value, path, i, undefined, can);
		}

		if (item.tclass) {
			el.tclass(item.tclass);
			delete item.tclass;
		}
	};

	return jBinder;
});
define('skylark-totaljs-jcomponent/binding/pathmaker',[
//	"../plugins" // TODO
],function(plugins){

	function pathmaker(path, clean) {

		if (!path) {
			return path;
		}

		var tmp = '';

		if (clean) {
			var index = path.indexOf(' ');
			if (index !== -1) {
				tmp = path.substring(index);
				path = path.substring(0, index);
			}
		}

		// temporary
		if (path.charCodeAt(0) === 37)  { // % 
			return 'jctmp.' + path.substring(1) + tmp;
		}
		
		if (path.charCodeAt(0) === 64) { // @
			// parent component.data()
			return path;
		}

		var index = path.indexOf('/');

		if (index === -1) {
			return path + tmp;
		}

		var p = path.substring(0, index);
		var rem = plugins.find(p); //W.PLUGINS[p];
		return ((rem ? ('PLUGINS.' + p) : (p + '_plugin_not_found')) + '.' + path.substring(index + 1)) + tmp;
	}

	return pathmaker;

});
define('skylark-totaljs-jcomponent/binding/func',[
	"./pathmaker",
],function(pathmaker){

	//'PLUGIN/method_name' or '@PLUGIN.method_name'
	var REGFNPLUGIN = /[a-z0-9_-]+\/[a-z0-9_]+\(|(^|(?=[^a-z0-9]))@[a-z0-9-_]+\./i;


	var regfnplugin = function(v) {
		var l = v.length;
		return pathmaker(v.substring(0, l - 1)) + v.substring(l - 1);
	};

	function rebinddecode(val) {
		return val.replace(/&#39;/g, '\'');
	}

	function isValue(val) {
		var index = val.indexOf('value');
		return index !== -1 ? (((/\W/).test(val)) || val === 'value') : false;
	}


   /**
   * Generates Function from expression of arrow function.
   * @example var fn = func('n => n.toUpperCase()');
   *          console.log(fn('peter')); //Output: PETER
   * @param  {String} exp 
   * @return {Function} 
   */
	function func(exp, notrim) {  // W.FN = 

		exp = exp.replace(REGFNPLUGIN, regfnplugin);

		var index = exp.indexOf('=>');
		if (index === -1) {
			if (isValue(exp))  {
				// func("value.toUpperCase()") --> func("value=>value.toUpperCase()")
				// func("plugin/method(value)") --> func("value=>plugin/method(value)")
			  	return func('value=>' + rebinddecode(exp), true) 
			} else {
				// func("plugin/method(value)")
		      	return new Function('return ' + (exp.indexOf('(') === -1 ? 'typeof({0})==\'function\'?{0}.apply(this,arguments):{0}'.format(exp) : exp));
			}
		}

		var arg = exp.substring(0, index).trim();
		var val = exp.substring(index + 2).trim();
		var is = false;

		arg = arg.replace(/\(|\)|\s/g, '').trim();
		if (arg) {
			arg = arg.split(',');
		}

		if (val.charCodeAt(0) === 123 && !notrim) {  // "{"
			is = true;
			val = val.substring(1, val.length - 1).trim();
		}


		var output = (is ? '' : 'return ') + val;
		switch (arg.length) {
			case 1:
				return new Function(arg[0], output);
			case 2:
				return new Function(arg[0], arg[1], output);
			case 3:
				return new Function(arg[0], arg[1], arg[2], output);
			case 4:
				return new Function(arg[0], arg[1], arg[2], arg[3], output);
			case 0:
			default:
				return new Function(output);
		}
	};

	func.rebinddecode = rebinddecode;
	func.isValue = isValue;

	return func;
});
define('skylark-totaljs-jcomponent/binding/findFormat',[
	"./func",
	"./pathmaker"
],function(func, pathmaker){

	/**
	 * A inline helper example:
	 * 1. Direct assignment
	 *  <div data-bind="form.name --> (value || '').toUpperCase()__html:value"></div>
	 * 2. With arrow function
	 *  <div data-bind="form.name --> n => (n || '').toUpperCase()__html:value"></div>
	 * 3. Plugins
	 *  <div data-bind="form.name --> plugin/method(value)__html:value"></div>
	 */
	function findFormat(val) {
		var a = val.indexOf('-->');
		var s = 3;

		if (a === -1) {
			a = val.indexOf('->');
			s = 2;
		}

		if (a !== -1) {
			if (val.indexOf('/') !== -1 && val.indexOf('(') === -1) {
				//plugin/method --> plugin/method(value)
				val += '(value)';
			}
		}

		if (a === -1) {
			return null;
		} else {
			return  { 
				path: val.substring(0, a).trim(), 
				fn: func(val.substring(a + s).trim()) 
			};			
		}
	}

	return findFormat;
});
define('skylark-totaljs-jcomponent/binding/parse',[
	"../langx",
	"../utils/query",
	"./func",
	"./pathmaker",
	"./findFormat",
	"./Binder"
],function(langx, $,func,pathmaker,findFormat,jBinder){
	


	function parsebinderskip(str) {
		var a = arguments;
		for (var i = 1; i < a.length; i++) {
			if (str.indexOf(a[i]) !== -1) {
				return false;
			}
		}
		return true;
	}

	/*
	 * A binder declaration:
	 * <div data-bind="path.to.property__command1:exp__command2:exp__commandN:exp"></div>
	 */
	function parsebinder(el, b, scopes, options,r) {
		var binders = options.binders,
			bindersnew = options.bindersnew;
		
		var meta = b.split(/_{2,}/);
		if (meta.indexOf('|') !== -1) {
			//Multiple watchers (__|__)
			if (!r) {
				var tmp = [];
				var output = [];
				for (var i = 0; i < meta.length; i++) {
					var m = meta[i];
					if (m === '|') {
						if (tmp.length) {
							output.push(parsebinder(el, tmp.join('__'), scopes,options));
						} 
						tmp = [];
						continue;
					}
					if (m) {
						tmp.push(m);
					}
				}
				if (tmp.length) {
					output.push(parsebinder(el, tmp.join('__'), scopes, options,true));
				} 
			}
			return output;
		}

		var path = null;
		var index = null;
		var obj = new jBinder();
		var cls = [];
		var sub = {};
		var e = obj.el = $(el);

		for (var i = 0; i < meta.length; i++) {
			var item = meta[i].trim();
			if (item) {
				if (i) {
					//command

					var k, // command 
						v; // expression

					if (item !== 'template' && item !== '!template' && item !== 'strict') {

						index = item.indexOf(':');

						if (index === -1) {
							index = item.length;
							item += ':value';
						}

						k = item.substring(0, index).trim();
						v = item.substring(index + 1).trim();
					} else {
						k = item;
					}

					if (k === 'selector') {
						obj[k] = v;
						continue;
					}

					var rki = k.indexOf(' ');
					var rk = rki === -1 ? k : k.substring(0, rki);
					var fn;

					if ( (parsebinderskip(rk, 'setter', 'strict', 'track', 'delay', 'import', 'class', 'template')) && (k.substring(0, 3) !== 'def') ) {
					   if (v.indexOf('=>') !== -1 ) {
					       fn = func( func.rebinddecode(v)); 
					   } else {   
					       if (func.isValue(v) ) {
					          fn = func('(value,path,el)=>' + func.rebinddecode(v), true) ;
					       } else { 
					          if (v.substring(0, 1) === '@' ) {
					          	  // binding component method
					              fn = obj.com[v.substring(1)] ;
					          } else {
					          	  fn = GET(v) ;
					          } 
					        }
					    }
					} else {
						fn = 1;
					}


					if (!fn) {
						return null;
					}

					var keys = k.split('+'); // commands to same expression with help of + char with spaces on both sides.
					for (var j = 0; j < keys.length; j++) {

						k = keys[j].trim();

						var s = '';
						var notvisible = false;
						var notnull = false;
						var backup = false;

						index = k.indexOf(' ');
						if (index !== -1) {
							s = k.substring(index + 1); // selector
							k = k.substring(0, index);
						}

						k = k.replace(/^(~!|!~|!|~)/, function(text) { 
							if (text.indexOf('!') !== -1) {
								notnull = true; // !command 
							}
							if (text.indexOf('~') !== -1) { 
								notvisible = true; // ~command
							}
							return '';
						});

						var c = k.substring(0, 1);

						if (k === 'class') {
							k = 'tclass';
						}

						if (c === '.') { // command: .class_name
							if (notnull) {
								fn.$nn = 1;
							}
							cls.push({ 
								name: k.substring(1), 
								fn: fn 
							});
							k = 'class';
						}

						if (langx.isFunction(fn)) {
							if (notnull) {
								fn.$nn = 1;
							}
							if (notvisible) {
								fn.$nv = 1;
							}
						}

						switch (k) {
							case 'track':
								obj[k] = v.split(',').trim();
								continue;
							case 'strict':
								obj[k] = true;
								continue;
							case 'hidden':
								k = 'hide';
								break;
							case 'exec':
								k = 'change';
								break;
							case 'disable':
								k = 'disabled';
								backup = true;
								break;
							case 'value':
								k = 'val';
								backup = true;
								break;
							case 'default':
								k = 'def';
								break;
							case 'delay':
								fn = +v;
								break;
							case 'href':
							case 'src':
							case 'val':
							case 'title':
							case 'html':
							case 'text':
							case 'disabled':
							case 'enabled':
							case 'checked':
								backup = true;
								break;

							case 'setter':
								fn = langx.fn('(value,path,el)=>el.SETTER(' + v + ')');
								if (notnull)
									fn.$nn = 1;
								if (notvisible)
									fn.$nv =1;
								break;
							case 'import':
								var c = v.substring(0, 1);
								if ((/^(https|http):\/\//).test(v) || c === '/' || c === '.') {
									if (c === '.') {
										fn = v.substring(1);
									} else {
										fn = v;
									}
								} else {
									fn = func(func.rebinddecode(v));
								}
								break;
							case 'tclass':
								fn = v;
								break;
							case 'template':
								var scr = e.find('script');
								if (!scr.length) {
									scr = e;
								}
								fn = Tangular.compile(scr.html());
								if (notnull) {
									fn.$nn = 1;
								}
								if (notvisible) {
									fn.$nv = 1;
								}
								break;
						}

						if (k === 'def') {
							fn = new Function('return ' + v)();
						}

						if (backup && notnull) {
							obj[k + 'bk'] = (k == 'src' || k == 'href' || k == 'title') ? e.attr(k) : (k == 'html' || k == 'text') ? e.html() : k == 'val' ? e.val() : (k == 'disabled' || k == 'checked') ? e.prop(k) : '';
						}

						if (s) {

							if (!sub[s]) {
								sub[s] = {};
							}

							if (k !== 'class') {
								sub[s][k] = fn;
							} else {
								var p = cls.pop();
								if (sub[s].cls) {
									sub[s].cls.push(p);
								} else {
									sub[s].cls = [p];
								}
							}
						} else {
							if (k !== 'class') {
								obj[k] = fn;
							}
						}
					}

				} else {
					// path
					path = item;

					var c = path.substring(0, 1);

					if (c === '!') {
						path = path.substring(1);
						obj.notnull = true;
					}

					if (meta.length === 1) {
						var fn = GET(path);
						fn && fn.call(obj.el, obj.el);
						return fn ? fn : null;
					}

					var tmp = findFormat(path);
					if (tmp) {
						path = tmp.path;
						obj.format = tmp.fn;
					}

					// Is virtual path?
					if (c === '.') {
						obj.virtual = true;
						path = path.substring(1);
						continue;
					}

					if (path.substring(path.length - 1) === '.') {
						path = path.substring(0, path.length - 1);
					}

					if (path.substring(0, 1) === '@') {
						//component scope
						path = path.substring(1);

						var isCtrl = false;
						if (path.substring(0, 1) === '@') {
							isCtrl = true;
							path = path.substring(1);
						}

						if (!path) {
							path = '@';
						}

						var parent = el.parentNode;
						while (parent) {
							if (isCtrl) {
								if (parent.$ctrl) {
									obj.com = parent.$ctrl;
									if (path === '@' && !obj.com.$dataw) {
										obj.com.$dataw = 1;
										obj.com.watch(function(path, value) {
											obj.com.data('@', value);
										});
									}
									break;
								}
							} else {
								if (parent.$com) {
									obj.com = parent.$com;
									break;
								}
							}
							parent = parent.parentNode;
						}

						if (!obj.com) {
							return null;
						}
					}
				}
			}
		}

		var keys = Object.keys(sub);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (!obj.child) {
				obj.child = [];
			}
			var o = sub[key];
			o.selector = key;
			obj.child.push(o);
		}

		if (cls.length) {
			obj.classes = cls;
		}

		if (obj.virtual) {
			path = pathmaker(path);
		} else {

			var bj = obj.com && path.substring(0, 1) === '@';
			path = bj ? path : pathmaker(path);

			if (path.indexOf('?') !== -1) {
				// jComponent scopes
				// You can use data-bind in jComponent scopes, but you need to defined ? (question mark) 
				// on the start of data-bind path. Question mark ? will be replaced for a scope path.
				var scope = initscopes(scopes);
				if (scope) {
					path = path.replace(/\?/g, scope.path);
				} else {
					return;
				}
			}

			var arr = path.split('.');
			var p = '';

			if (obj.com) {
				!obj.com.$data[path] && (obj.com.$data[path] = { value: null, items: [] });
				obj.com.$data[path].items.push(obj);
			} else {
				for (var i = 0, length = arr.length; i < length; i++) {
					p += (p ? '.' : '') + arr[i];
					var k = i === length - 1 ? p : '!' + p;
					if (binders[k]) {
						binders[k].push(obj);
					} else {
						binders[k] = [obj];
					}
				}
			}
		}

		obj.path = path;

		if (obj.track) {
			for (var i = 0; i < obj.track.length; i++) {
				obj.track[i] = path + '.' + obj.track[i];
			}
		}

		obj.init = 0; 
		if(!obj.virtual) {
			bindersnew.push(obj);
		}
		return obj;
	}

	return parsebinder;
});
define('skylark-totaljs-jcomponent/binding/VirtualBinder',[
	"../langx",
	"../utils/query",
	"./parse"
],function(langx, $, parsebinder){
	var ATTRBIND = '[data-bind],[bind],[data-vbind]';
	
	function VBinder(html) {
		var t = this;
		var e = t.element = $(html);
		t.binders = [];
		var fn = function() {
			var dom = this;
			var el = $(dom);
			var b = el.attrd('bind') || el.attr('bind') || el.attrd('vbind');
			dom.$jcbind = parsebinder(dom, b, langx.empties.array,t.binders); //EMPTYARRAY);
			//if(dom.$jcbind) {
			//   t.binders.push(dom.$jcbind);
			//}
		};
		e.filter(ATTRBIND).each(fn);
		e.find(ATTRBIND).each(fn);
	}

	var VBP = VBinder.prototype;

	VBP.on = function() {
		var t = this;
		t.element.on.apply(t.element, arguments);
		return t;
	};

	VBP.remove = function() {
		var t = this;
		var e = t.element;
		e.find('*').off();
		e.off().remove();
		t.element = null;
		t.binders = null;
		t = null;
		return t;
	};

	VBP.set = function(path, model) {

		var t = this;

		if (model == null) {
			model = path;
			path = '';
		}

		for (var i = 0; i < t.binders.length; i++) {
			var b = t.binders[i];
			if (!path || path === b.path) {
				var val = path || !b.path ? model : langx.result(model,b.path); // get(b.path, model)
				t.binders[i].exec(val, b.path);
			}
		}

		return t;
	};

	return VBinder;

});


define('skylark-totaljs-jcomponent/utils/domx',[
	"../langx",
	"./query",
	"skylark-domx-plugins"
],function(langx, $, plugins){
	var statics = langx.statics;
	
	var $devices = { 
		xs: { max: 768 }, 
		sm: { min: 768, max: 992 }, 
		md: { min: 992, max: 1200 }, 
		lg: { min: 1200 }
	};

	var REGCSS = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
	var REGSCRIPT = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
	var mediaqueriescounter = 0;

 	var mediaqueries = [];
	var $domready = false;

	var ACTRLS = { INPUT: true, TEXTAREA: true, SELECT: true };

	function inputable(el) {
		var tag = el.tagName || el;

		return ACTRLS[tag];
	}
	

	function findInstance(t, type) {

		if (!t.length) {
			return null;
		}

		for (var i = 0; i < t.length; i++) {
			if (t[i][type]) {
				return t[i][type];
			}
		}

		var el = t[0].parentElement;
		while (el !== null) {
			if (el[type]) {
				return el[type];
			}
			el = el.parentElement;
		}

		return null;
	}
	
	function mediaquery() {
		var W = window;

		if (!mediaqueries || !mediaqueries.length) {
			return;
		}

		var orientation = W.orientation ? Math.abs(W.orientation) === 90 ? 'landscape' : 'portrait' : '';

		var $w = $(W);
		var w = $w.width();
		var h = $w.height();
		var d = $devices;

		for (var i = 0, length = mediaqueries.length; i < length; i++) {
			var mq = mediaqueries[i];
			var cw = w;
			var ch = h;

			if (mq.element) {
				cw = mq.element.width();
				ch = mq.element.height();
			}

			if (mq.orientation) {
				if (!orientation && mq.orientation !== 'portrait')
					continue;
				else if (orientation !== mq.orientation)
					continue;
			}

			if (mq.minW && mq.minW >= cw) {
				continue;
			}
			if (mq.maxW && mq.maxW <= cw) {
				continue;
			}
			if (mq.minH && mq.minH >= ch) {
				continue;
			}
			if (mq.maxH && mq.maxH <= ch) {
				continue;
			}

			if (mq.oldW === cw && mq.oldH !== ch) {
				// changed height
				if (!mq.maxH && !mq.minH)
					continue;
			}

			if (mq.oldH === ch && mq.oldW !== cw) {
				// changed width
				if (!mq.maxW && !mq.minW)
					continue;
			}

			if (mq.oldW === cw && mq.oldH === ch) {
				continue;
			}

			var type = null;

			if (cw >= d.md.min && cw <= d.md.max) {
				type = 'md';
			} else if (cw >= d.sm.min && cw <= d.sm.max) {
				type = 'sm';
			} else if (cw > d.lg.min) {
				type = 'lg';
			} else if (cw <= d.xs.max) {
				type = 'xs';
			}

			mq.oldW = cw;
			mq.oldH = ch;
			mq.fn(cw, ch, type, mq.id);
		}
	}

	function inDOM(el) {
		if (!el)
			return;
		if (el.nodeName === 'BODY') {
			return true;
		}
		var parent = el.parentNode;
		while (parent) {
			if (parent.nodeName === 'BODY')
				return true;
			parent = parent.parentNode;
		}
	}

	function remove(el) {
		var dom = el[0];
		dom.$com = null;
		el.attr(ATTRDEL, true);
		el.remove();
	}

	function removescripts(str) {
		return str.replace(REGSCRIPT, function(text) {
			var index = text.indexOf('>');
			var scr = text.substring(0, index + 1);
			return scr.substring(0, 6) === '<style' || (scr.substring(0, 7) === '<script' && scr.indexOf('type="') === -1) || scr.indexOf('/javascript"') !== -1 ? '' : text;
		});
	}

	function importscripts(str) {

		var beg = -1;
		var output = str;
		var external = [];
		var scr;

		while (true) {

			beg = str.indexOf('<script', beg);
			if (beg === -1) {
				break;
			}
			var end = str.indexOf('</script>', beg + 8);
			var code = str.substring(beg, end + 9);
			beg = end + 9;
			end = code.indexOf('>');
			scr = code.substring(0, end);

			if (scr.indexOf('type=') !== -1 && scr.lastIndexOf('javascript') === -1) {
				continue;
			}

			var tmp = code.substring(end + 1, code.length - 9).trim();
			if (!tmp) {
				output = output.replace(code, '').trim();
				var eid = 'external' + langx.hashCode(code);
				if (!statics[eid]) {
					external.push(code);
					statics[eid] = true;
				}
			}
		}

		if (external.length) {
			$('head').append(external.join('\n'));
		}
		return output;
	}

	function importstyles(str, id) {
		var builder = [];

		str = str.replace(REGCSS, function(text) {
			text = text.replace('<style>', '<style type="text/css">');
			builder.push(text.substring(23, text.length - 8).trim());
			return '';
		});

		var key = 'css' + (id || '');

		if (id) {
			if (statics[key])
				$('#' + key).remove();
			else
				statics[key] = true;
		}

		builder.length && $('<style' + (id ? ' id="' + key + '"' : '') + '>{0}</style>'.format(builder.join('\n'))).appendTo('head');
		return str;
	}

	var $scrollbarWidth;
	function scrollbarWidth() { //W.SCROLLBARWIDTH = 
		var id = 'jcscrollbarwidth';
		if ($scrollbarWidth !== undefined) {
			return $scrollbarWidth;
		}
		var b = document.body;
		$(b).append('<div id="{0}" style="width{1}height{1}overflow:scroll;position:absolute;top{2}left{2}"></div>'.format(id, ':100px;', ':9999px;'));
		var el = document.getElementById(id);
		$scrollbarWidth = el.offsetWidth - el.clientWidth;
		b.removeChild(el);
		return $scrollbarWidth;
	}

   /**
   * Returns a current display size of the element. Display size can be:
   * <ul>
   *   <li>xs extra small display (mobile device)</li>
   *   <li>sm small display (tablet)</li>
   *   <li>md medium display (small laptop)</li>
   *   <li>lg large display (desktop computer, laptop)</li>
   * </ul>
   * execute CSS() twice then the previous styles will be removed.
   * @param  {String} value 
   * @param  {String} id 
   */
	function mediaWidth(el) { //W.WIDTH = 
		if (!el) {
			el = $(window);
		}
		var w = el.width();
		var d = $devices;
		return w >= d.md.min && w <= d.md.max ? 'md' : w >= d.sm.min && w <= d.sm.max ? 'sm' : w > d.lg.min ? 'lg' : w <= d.xs.max ? 'xs' : '';
	}

   /**
   * Registers a listener for specific size of the browser window or element.
   * @param  {String} query media CSS query string 
   * @param  {jQuery Element} id 
   * @param  {Function(w, h, type, id)} fn 
   * @return {Number } an idetificator of MediaQuery
   */
	function watchMedia(query, element, fn) { //W.MEDIAQUERY = 

		if (langx.isNumber(query)) {
			mediaqueries.remove('id', query);
			return true;
		}

		if (langx.isFunction(element)) {
			fn = element;
			element = null;
		}

		query = query.toLowerCase();
		if (query.indexOf(',') !== -1) {
			var ids = [];
			query.split(',').forEach(function(q) {
				q = q.trim();
				q && ids.push(watchMedia(q, element, fn));
			});
			return ids;
		}

		var d = $devices;

		if (query === 'md') {
			query = 'min-width:{0}px and max-width:{1}px'.format(d.md.min, d.md.max);
		} else if (query === 'lg') {
			query = 'min-width:{0}px'.format(d.lg.min);
		} else if (query === 'xs') {
			query = 'max-width:{0}px'.format(d.xs.max);
		} else if (query === 'sm') {
			query = 'min-width:{0}px and max-width:{1}px'.format(d.sm.min, d.sm.max);
		}

		var arr = query.match(/(max-width|min-width|max-device-width|min-device-width|max-height|min-height|max-device-height|height|width):(\s)\d+(px|em|in)?/gi);
		var obj = {};

		var num = function(val) {
			var n = parseInt(val.match(/\d+/), 10);
			return val.match(/\d+(em)/) ? n * 16 : val.match(/\d+(in)/) ? (n * 0.010416667) >> 0 : n;
		};

		if (arr) {
			for (var i = 0, length = arr.length; i < length; i++) {
				var item = arr[i];
				var index = item.indexOf(':');
				switch (item.substring(0, index).toLowerCase().trim()) {
					case 'min-width':
					case 'min-device-width':
					case 'width':
						obj.minW = num(item);
						break;
					case 'max-width':
					case 'max-device-width':
						obj.maxW = num(item);
						break;
					case 'min-height':
					case 'min-device-height':
					case 'height':
						obj.minH = num(item);
						break;
					case 'max-height':
					case 'max-device-height':
						obj.maxH = num(item);
						break;
				}
			}
		}

		arr = query.match(/orientation:(\s)(landscape|portrait)/gi);
		if (arr) {
			for (var i = 0, length = arr.length; i < length; i++) {
				var item = arr[i];
				if (item.toLowerCase().indexOf('portrait') !== -1) {
					obj.orientation = 'portrait';
				} else {
					obj.orientation = 'landscape';
				}
			}
		}

		obj.id = mediaqueriescounter++;
		obj.fn = fn;

		if (element) {
			obj.element = element;
		}

		mediaqueries.push(obj);
		return obj.id;
	};

   /**
   * creates inline CSS registered in the head tag. If you use id and 
   * execute CSS() twice then the previous styles will be removed.
   * @param  {String} value 
   * @param  {String} id 
   */
	function style(value, id) { //W.CSS = W.STYLE = 
		if (id) {
		 $('#css' + id).remove();
		}
		$('<style type="text/css"' + (id ? ' id="css' + id + '"' : '') + '>' + (value instanceof Array ? value.join('') : value) + '</style>').appendTo('head');
	};


	function keyPress(fn, timeout, key) { // W.KEYPRESS = 
		if (!timeout) {
			timeout = 300;
		}
		var str = fn.toString();
		var beg = str.length - 20;
		if (beg < 0) {
			beg = 0;
		}
		var tkey = key ? key : langx.hashCode(str.substring(0, 20) + 'X' + str.substring(beg)) + '_keypress';
		langx.setTimeout2(tkey, fn, timeout);
	};


	//-- Waits for jQuery
	//WAIT(function() {
	//	return !!W.jQuery;
	//}, function() {

	//	setInterval(function() {
	//		temp = {};
	//		paths = {};
	//		cleaner();
	//	}, (1000 * 60) * 5);

		// scheduler


	// No scrollbar
	var cssnoscrollbar = {};
	var clsnoscrollbar = 'noscrollbar';
	var selnoscrollbar = '.' + clsnoscrollbar;

		$.fn.noscrollbar = function() {  // from v17.003
			var t = this;
			var sw = scrollbarWidth();

			cssnoscrollbar['overflow-y'] = sw ? 'scroll' : 'auto';

			for (var i = 0; i < t.length; i++) {
				var m = t[i];
				if (m && m.offsetParent) {
					var el = $(m);
					var w = $(el[0].parentNode).width();
					if (m.$noscrollbarwidth !== w) {
						m.$noscrollbarwidth = w;
						cssnoscrollbar.width = Math.ceil(w + sw) + 'px';
						el.css(cssnoscrollbar);
						if ((el.attr('class') || '').indexOf(clsnoscrollbar) === -1)
							el.aclass(clsnoscrollbar);
					}
				}
			}
			return t;
		};


		$.fn.aclass = function(a) {
			return this.addClass(a);
		};

		$.fn.rclass = function(a) {
			return a == null ? this.removeClass() : this.removeClass(a);
		};

		$.fn.rattr = function(a) {
			return this.removeAttr(a);
		};

		$.fn.rattrd = function(a) {
			return this.removeAttr('data-' + a);
		};

		$.fn.rclass2 = function(a) {

			var self = this;
			var arr = (self.attr('class') || '').split(' ');
			var isReg = typeof(a) === 'object';

			for (var i = 0, length = arr.length; i < length; i++) {
				var cls = arr[i];
				if (cls) {
					if (isReg) {
						a.test(cls) && self.rclass(cls);
					} else {
						cls.indexOf(a) !== -1 && self.rclass(cls);
					}
				}
			}

			return self;
		};

		$.fn.hclass = function(a) {
			return this.hasClass(a);
		};

		$.fn.tclass = function(a, v) {
			return this.toggleClass(a, v);
		};

		$.fn.attrd = function(a, v) {
			a = 'data-' + a;
			return v == null ? this.attr(a) : this.attr(a, v);
		};

		// Appends an SVG element
		$.fn.asvg = function(tag) {

			if (tag.indexOf('<') === -1) {
				var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
				this.append(el);
				return $(el);
			}

			var d = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
			d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + tag + '</svg>';
			var f = document.createDocumentFragment();
			while (d.firstChild.firstChild)
				f.appendChild(d.firstChild.firstChild);
			f = $(f);
			this.append(f);
			return f;
		};

		$.fn.psvg = function(tag) {

			if (tag.indexOf('<') === -1) {
				var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
				this.prepend(el);
				return $(el);
			}

			var d = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
			d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + tag + '</svg>';
			var f = document.createDocumentFragment();
			while (d.firstChild.firstChild)
				f.appendChild(d.firstChild.firstChild);
			f = $(f);
			this.prepend(f);
			return f;
		};

		$.fn.rescroll = function(offset, bottom) {
			var t = this;
			t.each(function() {
				var e = this;
				var el = e;
				el.scrollIntoView(true);
				if (offset) {
					var count = 0;
					while (el && el.scrollTop == 0 && count++ < 25) {
						el = el.parentNode;
						if (el && el.scrollTop) {

							var off = el.scrollTop + offset;

							if (bottom != false) {
								if (el.scrollTop + el.getBoundingClientRect().height >= el.scrollHeight) {
									el.scrollTop = el.scrollHeight;
									return;
								}
							}

							el.scrollTop = off;
							return;
						}
					}
				}
			});
			return t;
		};

		function resize() {
			//var w = $(window); // TODO
			//W.WW = w.width();
			//W.WH = w.height(); 
			mediaquery();
		}

		resize();

		$(window).on('resize', resize);


		$(window).on('orientationchange', mediaquery);
	//}, 100);

	$(function(){
		$domready = true;
	});

	return {
		"devices" : $devices,
		"findInstance" : findInstance,
		"inDOM" : inDOM,
		"importscripts" : importscripts,
		"importstyles" : importstyles,
		"inputable" : inputable,
		"keyPress" : keyPress,
		"mediaquery" : mediaquery,
		"mediaWidth" : mediaWidth,
		"Plugin" : plugins.Plugin,
		"removescripts" : removescripts,
		"scrollbarWidth" : scrollbarWidth,
		"style" : style,
		"watchMedia" : watchMedia,
		"$" : $,
	}

});
define('skylark-totaljs-jcomponent/binding/vbind',[
	"../utils/domx",
	"../utils/query",
	"./VirtualBinder"
],function(domx, $, VBinder){
	function vbind(html) { // W.VBIND = 
		return new VBinder(html);
	};

	return vbind;
});

define('skylark-totaljs-jcomponent/binding/vbindArray',[
	"../langx",
	"../utils/domx",
	"../utils/query",
	"./vbind"
],function(langx,domx,$,vbind){
	function vbindArray(html, el) { //W.VBINDARRAY = 
		var obj = {};
		obj.html = html;
		obj.items = [];
		//obj.element = el instanceof Component ? el.element : $(el);
		obj.element = el.element ? el.element : $(el);
		obj.element[0].$vbindarray = obj;
		obj.remove = function() {
			for (var i = 0; i < obj.items.length; i++) {
				obj.items[i].remove();
			}
			obj.checksum = null;
			obj.items = null;
			obj.html = null;
			obj.element = null;
		};

		var serialize = function(val) {
			switch (typeof(val)) {
				case 'number':
					return val + '';
				case 'boolean':
					return val ? '1' : '0';
				case 'string':
					return val;
				default:
					return val == null ? '' : val instanceof Date ? val.getTime() : JSON.stringify(val);
			}
		};

		var checksum = function(item) {
			var sum = 0;
			var binder = obj.items[0];
			if (binder) {
				for (var j = 0; j < binder.binders.length; j++) {
					var b = binder.binders[j];
					var p = b.path;
					if (b.track) {
						for (var i = 0; i < b.track.length; i++)
							sum += serialize($get((p ? (p + '.') : '') + b.track[i].substring(1), item));
					} else
						sum += serialize(p ? $get(p, item) : item);
				}
			}
			return langx.hashCode(sum); // HASH
		};

		obj.set = function(index, value) {

			var sum = null;

			if (!(index instanceof Array)) {
				var item = obj.items[index];
				if (item) {
					sum = checksum(value);
					var el = item.element[0];
					if (el.$bchecksum !== sum) {
						el.$bchecksum = sum;
						item.set(value);
					}
				}
				return obj;
			}

			value = index;

			if (obj.items.length > value.length) {
				var rem = obj.items.splice(value.length);
				for (var i = 0; i < rem.length; i++)
					rem[i].remove();
			}

			for (var i = 0; i < value.length; i++) {
				var val = value[i];
				var item = obj.items[i];

				if (!item) {
					item = vbind(obj.html); //VBIND
					obj.items.push(item);
					item.element.attrd('index', i);
					item.element[0].$vbind = item;
					item.index = i;
					obj.element.append(item.element);
				}

				var el = item.element[0];
				sum = checksum(val);

				if (el.$bchecksum !== sum) {
					el.$bchecksum = sum;
					item.set(val);
				}
			}
		};

		return obj;
	};

	return vbindArray;
});

define('skylark-totaljs-jcomponent/binding',[
	"./utils/query",
	"./jc",
	"./langx",
	"./binding/Binder",
	"./binding/findFormat",
	"./binding/func",
	"./binding/parse",
	"./binding/pathmaker",
	"./binding/VirtualBinder",
	"./binding/vbind",
	"./binding/vbindArray"
],function($, jc,langx,Binder,findFormat,func,parse,pathmaker,VirtualBinder,vbind,vbindArray){

	var REGCOMMA = /,/g;


	//var W = jc.W = {};


	// temporary
	//W.jctmp = {}; // not used




	
	// ===============================================================
	// MAIN FUNCTIONS
	// ===============================================================



//	jc.$parser.push(function(path, value, type) {

	return jc.binding = {
		"findFormat" : findFormat,
		"func" : func,
		"pathmaker" : pathmaker,
		"parse" : parse,

		"Binder" : Binder,
		"VirtualBinder" : VirtualBinder,
		"vbind" : vbind,
		"vbindArray" : vbindArray
	};

});
define('skylark-totaljs-jcomponent/components/Usage',[
	"../langx"
],function(langx){
	// ===============================================================
	// Usage DECLARATION
	// ===============================================================

	function Usage() {
		var t = this;
		t.init = 0;
		t.manually = 0;
		t.input = 0;
		t.default = 0;
		t.custom = 0;
		t.dirty = 0;
		t.valid = 0;
	}

	Usage.prototype.compare = function(type, dt) {
		if (langx.isString(dt) && dt.substring(0, 1) !== '-')
			//dt = W.NOW.add('-' + dt);
			dt = langx.now().add('-' + dt);
		var val = this[type];
		return val === 0 ? true : val < dt.getTime();
	};

	Usage.prototype.convert = function(type) {

		var n = Date.now();
		var output = {};
		var num = 1;
		var t = this;

		switch (type.toLowerCase().substring(0, 3)) {
			case 'min':
			case 'mm':
			case 'm':
				num = 60000;
				break;

			case 'hou':
			case 'hh':
			case 'h':
				num = 360000;
				break;

			case 'sec':
			case 'ss':
			case 's':
				num = 1000;
				break;
		}

		output.init = t.init === 0 ? 0 : ((n - t.init) / num) >> 0;
		output.manually = t.manually === 0 ? 0 : ((n - t.manually) / num) >> 0;
		output.input = t.input === 0 ? 0 : ((n - t.input) / num) >> 0;
		output.default = t.default === 0 ? 0 : ((n - t.default) / num) >> 0;
		output.custom = t.custom === 0 ? 0 : ((n - t.custom) / num) >> 0;
		output.dirty = t.dirty === 0 ? 0 : ((n - t.dirty) / num) >> 0;
		output.valid = t.valid === 0 ? 0 : ((n - t.valid) / num) >> 0;
		return output;
	};
	
	return Usage;
});
define('skylark-totaljs-jcomponent/components/Component',[
	"../langx",
	"../binding/findFormat",
	"../utils/domx",
	"./Usage"
],function(langx, findFormat, domx, Usage){
	var temp = {},
		statics = {},
		$ =domx.$;

	var counter = 0;

	var MD = {
		delay : 555,
		delaywatcher : 555,
		delaybinder : 200		
	};

	// ===============================================================
	// COMPONENT DECLARATION
	// ===============================================================

	var Component = langx.klass({
		_construct(name,view) {
			var self = this;
			self._id = self.ID = 'jc' + (counter++);
			self.usage = new Usage();
			self.$dirty = true;
			self.$valid = true;
			self.$validate = false;
			self.$parser = [];
			self.$formatter = [];
			self.$skip = false;
			self.$ready = false;
			self.$path;
			self.trim = true;
			self.$released = false;
			self.$bindreleased = true;
			self.$data = {};

			var version = name.lastIndexOf('@');

			self.view = view;
			self.storing = view.storing;

			self.name = name;
			self.$name = version === -1 ? name : name.substring(0, version);
			self.version = version === -1 ? '' : name.substring(version + 1);
			self.path;
			self.type;
			self.id;
			self.disabled = false;
			self.removed = false;

			self.make;
			self.done;
			self.prerender;
			self.destroy;
			self.state;
			self.validate;
			self.released;

			self.getter = function(value, realtime, nobind) {

				var self = this;

				value = self.parser(value);
				self.getter2 && self.getter2(value, realtime);

				if (realtime) {
					self.$skip = true;
				}

				// Binds a value
				if (nobind) {
					self.view.componenter.com_validate2(self);
				} else if (value !== self.get()) {
					self.set(value, 2);
				} else if (realtime === 3) {
					// A validation for same values, "realtime=3" is in "blur" event
					// Because we need to validate the input if the user leaves from the control
					self.view.componenter.com_validate2(self);
				}
			};

			self.stateX = function(type, what) {
				var key = type + 'x' + what;
				if (!self.$bindchanges || self.$state !== key) {
					self.$state = key;
					self.config.$state && EXEC.call(self, self.config.$state, type, what);
					self.state(type, what);
				}
			};

			self.setterX = function(value, path, type) {

				if (!self.setter || (self.$bindexact && self.path !== path && self.path.indexOf(path + '.') === -1 && type))
					return;

				var cache = self.$bindcache;
				if (arguments.length) {

					/*
					if (skips[self.path]) {
						var s = --skips[self.path];
						if (s <= 0) {
							delete skips[self.path];
							return;
						}
					}
					*/
					if (self.view.storing.skipDec(self.path) == false) {
						return;
					}

					if (self.$format) {
						value = self.$format(value, path, type);
					}

					if (self.$bindreleased) {

						if (self.$bindchanges) {
							var hash = langx.hashCode(value); // HASH
							if (hash === self.$valuehash)
								return;
							self.$valuehash = hash;
						}

						// Binds value directly
						self.config.$setter && EXEC.call(self, self.config.$setter, value, path, type);
						self.data('', value);
						self.setter(value, path, type);
						self.setter2 && self.setter2(value, path, type);
					} else {
						if (self.$released) {
							cache.is = true;
							cache.value = value;
							cache.path = path;
							cache.type = type;
						} else {
							cache.value = value;
							cache.path = path;
							cache.type = type;
							if (!cache.bt) {
								cache.is = true;
								self.setterX();
							}
						}
					}

				} else if (!self.$released && cache && cache.is) {
					cache.is = false;
					cache.bt && clearTimeout(cache.bt);
					cache.bt = setTimeout(function(self) {
						var cache = self.$bindcache;
						cache.bt = 0; // reset timer id

						if (self.$bindchanges) {
							var hash = langx.hashCode(value); // HASH
							if (hash === self.$valuehash)
								return;
							self.$valuehash = hash;
						}

						self.config.$setter && EXEC.call(self, self.config.$setter, cache.value, cache.path, cache.type);
						self.data('', cache.value);
						self.setter(cache.value, cache.path, cache.type);
						self.setter2 && self.setter2(cache.value, cache.path, cache.type);
					}, self.$bindtimeout, self);
				}
			};

			self.setter = function(value, path, type) {

				var self = this;

				if (type === 2) {
					if (self.$skip) {
						self.$skip = false;
						return;
					}
				}

				var a = 'select-one';
				value = self.formatter(value);

				self.view.helper.findControl(self.element[0], function(t) {

					if (t.$com !== self)
						t.$com = self;

					var path = t.$com.path;
					if (path && path.length && path !== self.path)
						return;

					if (t.type === 'checkbox') {
						var tmp = value != null ? value.toString().toLowerCase() : '';
						tmp = tmp === 'true' || tmp === '1' || tmp === 'on';
						tmp !== t.checked && (t.checked = tmp);
						return;
					}

					if (value == null)
						value = '';

					if (!type && t.type !== a && t.type !== 'range' && !self.$default && !value) {
						self.view.componenter.autofill.push(t.$com);
					}

					if (t.type === a || t.type === 'select') {
						var el = $(t);
						el.val() !== value && el.val(value);
					} else if (t.value !== value)
						t.value = value;
				});
			};
		}

	});


	var PPC = Component.prototype;

	/*
	 * Set or get data from internal component repository. 
	 * Data can be used for data-bind="" attribute and nested j-Components. 
	 */
	PPC.data = function(key, value) {

		if (!key) {
			key = '@';
		}

		var self = this;
		var data = self.$data[key];

		if (arguments.length === 1) {
			return data ? data.value : null;
		}

		if (data) {
			data.value = value;
			for (var i = 0; i < data.items.length; i++) {
				var o = data.items[i];
				o.el[0].parentNode && o.exec(value, key);
			}
		} else {
			self.$data[key] = { 
				value: value, 
				items: [] 
			};
		}

		if (self.$ppc) {
			var c = self.view.components.all; //M.components;
			for (var i = 0; i < c.length; i++) {
				var com = c[i];
				if (com.owner === self && com.$pp && key === com.path)
					com.setterX(value, value, 2);
			}
		}

		return value;
	};

	/*
	 * 
	 */
	PPC.$except = function(except) {
		var p = self.$path;
		for (var a = 0; a < except.length; a++) {
			for (var b = 0; b < p.length; b++) {
				if (except[a] === p[b]) {
					return true;
				}
			}
		}
		return false;
	};

	/*
	 * 
	 */
	PPC.$compare = function(path, fix) {
		var self = this;

		if (fix)
			return self.path === path;

		if (path.length > self.path.length) {
			var index = path.lastIndexOf('.', self.path.length);
			return index === -1 ? false : self.path === path.substring(0, index);
		}

		for (var i = 0, length = self.$path.length; i < length; i++) {
			if (self.$path[i] === path) {
				return true;
			}
		}
	};

	/*
	 * Removes waiter.
	 */
	function removewaiter(obj) {
		if (obj.$W) {
			var keys = Object.keys(obj.$W);
			for (var i = 0, length = keys.length; i < length; i++) {
				var v = obj.$W[keys[i]];
				if (v.id) {
					clearInterval(v.id);
				}
			}
		}
	}

	/*
	 * 
	 */
	PPC.notmodified = function(fields) {
		var t = this;
		if (langx.isString(fields)) {
			fields = [fields];
		}
		return NOTMODIFIED(t._id, t.get(), fields);
	};

	/*
	 * 
	 */
	PPC.$waiter = function(prop, callback) {

		var t = this;

		if (prop === true) {
			if (t.$W) {
				var keys = Object.keys(t.$W);
				for (var i = 0; i < keys.length; i++) {
					var k = keys[i];
					var o = t.$W[k];
					o.id = setInterval(function(t, prop) {
						var o = t.$W[prop];
						var v = t[prop]();
						if (v) {
							clearInterval(o.id);
							for (var i = 0; i < o.callback.length; i++)
								o.callback[i].call(t, v);
							delete t.$W[prop];
						}
					}, MD.delaywatcher, t, k);
				}
			}
			return;
		} else if (prop === false) {
			if (t.$W) {
				var keys = Object.keys(t.$W);
				for (var i = 0; i < keys.length; i++) {
					var a = t.$W[keys[i]];
					a && clearInterval(a.id);
				}
			}
			return;
		}

		!t.$W && (t.$W = {});

		if (t.$W[prop]) {
			// Checks if same callback exists
			for (var i = 0; i < t.$W[prop].length; i++) {
				if (t.$W[prop][i] === callback)
					return t;
			}
			t.$W[prop].callback.push(callback);
			return t;
		} else
			t.$W[prop] = { callback: [callback] };

		if (!t.$released) {
			t.$W[prop].id = setInterval(function(t, prop) {
				var o = t.$W[prop];
				var v = t[prop]();
				if (v) {
					clearInterval(o.id);
					for (var i = 0; i < o.callback.length; i++) {
						o.callback[i].call(t, v);
					}
					delete t.$W[prop];
				}
			}, MD.delaywatcher, t, prop);
		}
		return t;
	};

	/*
	 * .
	 */
	PPC.hidden = function(callback) {
		var t = this;
		var v = t.element ? t.element[0].offsetParent : null;
		v = v === null;
		if (callback) {
			if (v) {
				callback.call(t);
			} else {
				t.$waiter('hidden', callback);
			}
		}
		return v;
	};

	/*
	 * 
	 */
	PPC.visible = function(callback) {
		var t = this;
		var v = t.element ? t.element[0].offsetParent : null;
		v = v !== null;
		if (callback) {
			if (v) {
				callback.call(t);
			} else {
				t.$waiter('visible', callback);
			}
		}
		return v;
	};

	/*
	 * 
	 */
	PPC.width = function(callback) {
		var t = this;
		var v = t.element ? t.element[0].offsetWidth : 0;
		if (callback) {
			if (v) {
				callback.call(t, v);
			} else {
				t.$waiter('width', callback);
			}
		}
		return v;
	};

	/*
	 * 
	 */
	PPC.height = function(callback) {
		var t = this;
		var v = t.element ? t.element[0].offsetHeight : 0;
		if (callback) {
			if (v) {
				callback.call(t, v);
			} else {
				t.$waiter('height', callback);
			}
		}
		return v;
	};

	/*
	 * Import some content from external source to this element.
	 */
	PPC.import = function(url, callback, insert, preparator) {
		var self = this;
		this.view.http.import(url, self.element, callback, insert, preparator);
		return self;
	};

	/*
	 * Performs release state for all nested components.
	 */
	PPC.release = function(value, container) {

		var self = this;
		if (value === undefined || self.$removed) {
			return self.$released;
		}

		self.attrd('jc-released', value);

		//(container || self.element).find(consts.ATTRCOM).each(function() {
		self.view.helper.nested(container || self.element).forEach(function(com){ 
			var el = com.element; //var el = $(this);
			el.attrd('jc-released', value ? 'true' : 'false');
			//var com = el[0].$com;
			if (com instanceof Object) {
				if (com instanceof Array) {
					for (var i = 0, length = com.length; i < length; i++) {
						var o = com[i];
						if (!o.$removed && o.$released !== value) {
							o.$released = value;
							o.released && o.released(value, self);
							o.$waiter(!value);
							!value && o.setterX();
						}
					}
				} else if (!com.$removed && com.$released !== value) {
					com.$released = value;
					com.released && com.released(value, self);
					com.$waiter(!value);
					!value && com.setterX();
				}
			}
		});

		if (!container && self.$released !== value) {
			self.$released = value;
			self.released && self.released(value, self);
			self.$waiter(!value);
			!value && self.setterX();
		}

		return value;
	};

	/*
	 * Performs validation with refreshing state of component
	 */
	PPC.validate2 = function() {
		return com_validate2(this);
	};

	/*
	 * Returns all nested components.
	 */
	PPC.exec = function(name, a, b, c, d, e) {
		var self = this;
		/*
		self.find(consts.ATTRCOM).each(function() {
			var t = this;
			if (t.$com) {
				t.$com.caller = self;
				t.$com[name] && this.$com[name](a, b, c, d, e);
			}
		});
		*/

		return self;
	};

	/*
	 * Returns all nested components.
	 */
	PPC.replace = function(el, remove) {
		var self = this;

		if (this.view.compiler.is) {
			this.view.compiler.recompile = true;
		}

		var n = 'jc-scope';
		var prev = self.element;
		var scope = prev.attrd(n);

		self.element.rattrd('jc');
		self.element[0].$com = null;
		scope && self.element.rattrd(n);

		if (remove) {
			prev.off().remove();
		} else {
			self.attrd('jc-replaced', 'true');
		}

		self.element = $(el);
		self.dom = self.element[0];
		self.dom.$com = self;
		self.attrd('jc', self.name);
		if (scope) {
			self.attrd(n, scope);
		}
		self.siblings = false;
		return self;
	};

	//PPC.compile 

	/*
	 * Returns all nested components.
	 */
	PPC.nested = function() {
		var self = this;
		return self.view.helper.nested(this.element);

		/*
		var arr = [];
		this.find(ATTRCOM).each(function() {
			var el = $(this);
			var com = el[0].$com;
			if (com && !el.attr(ATTRDEL)) {
				if (com instanceof Array)
					arr.push.apply(arr, com);
				else
					arr.push(com);
			}
		});
		return arr;
		*/
	};

	/*
	 * Sets the last interaction time,time will be stored in self.usage.
	 */
	PPC.$interaction = function(type) {

		// type === 0 : init
		// type === 1 : manually
		// type === 2 : by input
		// type === 3 : by default
		// type === 100 : custom
		// type === 101 : dirty
		// type === 102 : valid

		var now = Date.now();
		var t = this;

		switch (type) {
			case 0:
				t.usage.init = now;
				t.$binded = true;
				break;
			case 1:
				t.usage.manually = now;
				t.$binded = true;
				break;
			case 2:
				t.usage.input = now;
				t.$binded = true;
				break;
			case 3:
				t.usage.default = now;
				t.$binded = true;
				break;
			case 100:
				t.usage.custom = now;
				break;
			case 101:
				t.usage.dirty = now;
				break;
			case 102:
				t.usage.valid = now;
				break;
		}

		return t;
	};

	/*
	 * Notifies a setter in all components according to the component.path.
	 */
	PPC.notify = function() {
		NOTIFY(this.path);
		return this;
	};

	/*
	 * Executes the component.setter with a refreshed value according to the component.path.
	 */
	PPC.update = PPC.refresh = function(notify, type) {
		var self = this;
		if (self.$binded) {

			if (langx.isString(notify)) {
				type = notify;
				notify = true;
			}

			if (notify) {
				self.set(self.get(), type);
			} else {
				if (self.setter) {
				 self.setterX(self.get(), self.path, 1);
				}
				self.$interaction(1);
			}
		}
		return self;
	};

	/*
	 * Toggles class, it's alias for self.element.toggleClass().
	 */
	PPC.tclass = function(cls, v) {
		var self = this;
		self.element.tclass(cls, v);
		return self;
	};

	/*
	 * Adds CSS class into the element classes., it's alias for self.element.addClass().
	 */
	PPC.aclass = function(cls, timeout) {
		var self = this;
		if (timeout) {
			setTimeout(function() { self.element.aclass(cls); }, timeout);
		} else {
			self.element.aclass(cls);
		}
		return self;
	};

	/*
	 * Determines class, it's alias for self.element.hasClass().
	 */
	PPC.hclass = function(cls) {
		return this.element.hclass(cls);
	};

	/*
	 * Removes class, it's alias for self.element.removeClass().
	 */
	PPC.rclass = function(cls, timeout) {
		var self = this;
		var e = self.element;
		if (timeout)
			setTimeout(function() { e.rclass(cls); }, timeout);
		else {
			if (cls) {
				e.rclass(cls);
			} else {
				e.rclass();
			}
		}
		return self;
	};

	/*
	 *  Removes classes according to the text to search.
	 */
	PPC.rclass2 = function(search) {
		this.element.rclass2(search);
		return this;
	};

	/*
	 * Add or remove CSS classes.
	 */
	PPC.classes = function(cls) {

		var key = 'cls.' + cls;
		var tmp = temp[key]; // caches.temp[key];
		var t = this;
		var e = t.element;

		if (tmp) {
			tmp.add && e.aclass(tmp.add);
			tmp.rem && e.rclass(tmp.rem);
			return t;
		}

		var arr = cls instanceof Array ? cls : cls.split(' ');
		var add = '';
		var rem = '';

		for (var i = 0, length = arr.length; i < length; i++) {
			var c = arr[i].substring(0, 1);
			if (c === '-')
				rem += (rem ? ' ' : '') + arr[i].substring(1);
			else
				add += (add ? ' ' : '') + (c === '+' ? arr[i].substring(1) : arr[i]);
		}

		if (add) {
			e.aclass(add);
		}
		if (rem) {
			e.rclass(rem);
		}

		if (cls instanceof Array) {
			return t;
		}

		temp[key] = { add: add, rem: rem };  // caches.temp[key] = { add: add, rem: rem }; 
		return t;
	};

	/*
	 * Returns a parent component instance if exists (otherwise: null).
	 */
	PPC.toggle = function(cls, visible, timeout) {

		var manual = false;
		var self = this;

		if (!langx.isString(cls)) {
			timeout = visible;
			visible = cls;
			cls = 'hidden';
			manual = true;
		}

		if (langx.isNumber(visible)) {
			timeout = visible;
			visible = undefined;
		} else if (manual && visible !== undefined) {
			visible = !visible;
		}

		var el = self.element;
		if (!timeout) {
			el.tclass(cls, visible);
			return self;
		}

		setTimeout(function() {
			el.tclass(cls, visible);
		}, timeout);
		return self;
	};

	/*
	 * Disables scopes according to the data-jc-scope attribute.
	 */
	PPC.noscope = PPC.noScope = function(value) {
		var self = this;
		self.$noscope = value === undefined ? true : value === true;
		return self;
	};

	/*
	 * Returns a parent component instance if exists (otherwise: null).
	 */
	PPC.nocompile = function() {
		var self = this;
		self.element.attrd('jc-compile', '0');
		return self;
	};

	/*
	 * Creates a single instance of the component. 
	 * So if the component will be declared multiple times then jComponent creates the only one instance and 
	 * another declarations will be skipped.
	 */
	PPC.singleton = function() {
		var self = this;
		statics['$ST_' + self.name] = true;
		return self;
	};

	/*
	 * Sets the component as blind.
	 * Component will be skipped when jComponent performs data-binding. 
	 * If your component won't work with data-binding then this option can increase a performance of your web app.
	 */
	PPC.blind = function() {
		var self = this;
		self.path = null;
		self.$path = null;
		self.$$path = null;
		return self;
	};

	/*
	 * Binds changes only. 
	 * If setter will get the same value as a previous value then skips binding.
	 */
	PPC.bindchanges = PPC.bindChanges = function(enable) {
		this.$bindchanges = enable == null || enable === true;
		return this;
	};

	/*
	 * Sets binding of values when the the modification path is same as the component path or the path is part of parent path.
	 */
	PPC.bindexact = PPC.bindExact = function(enable) {
		this.$bindexact = enable == null || enable === true;
		return this;
	};

	/*
	 * Sets binding of values only when the component is not released.
	 * it depends on releasing of the parent component.
	 */
	PPC.bindvisible = PPC.bindVisible = function(timeout) {
		var self = this;
		self.$bindreleased = false;
		self.$bindtimeout = timeout || MD.delaybinder;
		self.$bindcache = {};
		return self;
	};

	/*
	 * Enables readonly mode for the component.
	 * It disables dirty and valid states, getter, setter, parsers and formatters. 
	 * This option can improve performance.
	 */
	PPC.readonly = function() {
		var self = this;
		self.noDirty();
		self.noValid();
		self.getter = null;
		self.setter = null;
		self.$parser = null;
		self.$formatter = null;
		return self;
	};

	/*
	 * Returns a parent component instance if exists (otherwise: null).
	 */
	PPC.novalidate = PPC.noValid = PPC.noValidate = function(val) {
		if (val === undefined) {
			val = true;
		}
		var self = this;
		self.$valid_disabled = val;
		self.$valid = val;
		return self;
	};

	/*
	 * Returns a parent component instance if exists (otherwise: null).
	 */
	PPC.nodirty = PPC.noDirty = function(val) {
		if (val === undefined) {
			val = true;
		}
		var self = this;
		self.$dirty_disabled = val;
		self.$dirty = !val;
		return self;
	};

	/*
	 * Watch some additional data-source.
	 * Each next declaration of self.datasource() cancels previous declaration.
	 */
	PPC.datasource = function(path, callback, init) {
		var self = this;
		var ds = self.$datasource;

		ds && self.unwatch(ds.path, ds.fn);

		if (path) {
			self.$datasource = { path: path, fn: callback };
			self.watch(path, callback, init !== false);
		} else
			self.$datasource = null;

		return self;
	};

	/*
	 * Rewrites component.path.
	 */
	PPC.setPath = function(path, type) {

		// type 1: init
		// type 2: scope

		var self = this;
		var tmp = findFormat(path);

		if (tmp) {
			path = tmp.path;
			self.$format = tmp.fn;
		} else if (!type) {
			self.$format = null;
		}

		var arr = [];

		if (path.substring(0, 1) === '@') {
			path = path.substring(1);
			self.$pp = true;
			self.owner.$ppc = true;
		} else {
			self.$pp = false;
		}

		// Temporary
		if (path.charCodeAt(0) === 37) { // %
			path = 'jctmp.' + path.substring(1);
		}

		path = path.env();

		// !path = fixed path
		if (path.charCodeAt(0) === 33) { // !
			path = path.substring(1);
			arr.push(path);
		} else {
			var p = path.split('.');
			var s = [];
			for (var j = 0; j < p.length; j++) {
				var b = p[j].lastIndexOf('[');
				if (b !== -1) {
					var c = s.join('.');
					arr.push(c + (c ? '.' : '') + p[j].substring(0, b));
				}
				s.push(p[j]);
				arr.push(s.join('.'));
			}
		}

		self.path = path;
		self.$path = arr;
		
		if (type !== 1 && self.view.ready) {//C.ready
			refresh(); // TODO
		}
		return self;
	};

	/*
	 * Get/set a value into the element attribute, it's alias for self.element.attr(name, [value]).
	 */
//	PPC.attr = SCP.attr = function(name, value) {
	PPC.attr = function(name, value) {
		var el = this.element;
		if (value === undefined) {
			return el.attr(name);
		}
		el.attr(name, value);
		return this;
	};

	/*
	 * Get/set a value into the element attribute with data- prefix for name of attribute.
	 * it's alias for self.element.attr(name, [value]).
	 */
//	PPC.attrd = SCP.attrd = function(name, value) {
	PPC.attrd = function(name, value) {
		name = 'data-' + name;
		var el = this.element;
		if (value === undefined) {
			return el.attr(name);
		}
		el.attr(name, value);
		return this;
	};

	/*
	 * Sets css or get, it's alias for self.element.css(name, [value]).
	 */
//	PPC.css = SCP.css = function(name, value) {
	PPC.css = function(name, value) {
		var el = this.element;
		if (value === undefined) {
			return el.css(name);
		}
		el.css(name, value);
		return this;
	};

	/*
	 * Returns a parent component instance if exists (otherwise: null).
	 */
//	PPC.main = SCP.main = function() {
	PPC.main = function() {
		var self = this;
		if (self.$main === undefined) {
			var tmp = self.parent().closest('[data-jc]')[0];
			self.$main = tmp ? tmp.$com : null;
		}
		return self.$main;
	};

	PPC.rcwatch = function(path, value) {
		return value ? this.reconfigure(value) : this;
	};

	PPC.reconfigure = function(value, callback, init) {
		var self = this;
		if (langx.isPlainObject(value)) {
			Object.keys(value).forEach(function(k) {
				var prev = self.config[k];
				if (!init && self.config[k] !== value[k])
					self.config[k] = value[k];
				if (callback) {
					callback(k, value[k], init, init ? undefined : prev);
				} else if (self.configure) {
					self.configure(k, value[k], init, init ? undefined : prev);
				}
				self.data('config.' + k, value[k]);
			});
		} else if (value.substring(0, 1) === '=') {
			value = value.substring(1);
			if (self.watch) {
				self.$rcwatch && self.unwatch(self.$rcwatch, self.rcwatch);
				self.watch(value, self.rcwatch);
				self.$rcwatch = value;
			}
			self.reconfigure(get(value), callback, init);
		} else {
			value.$config(function(k, v) {
				var prev = self.config[k];
				if (!init && self.config[k] !== v)
					self.config[k] = v;
				self.data('config.' + k, v);
				if (callback) {
					callback(k, v, init, init ? undefined : prev);
				} else if (self.configure) {
					self.configure(k, v, init, init ? undefined : prev);
				}
			});
		}

		var cfg = self.config;

		self.data('config', cfg);

		if (cfg.$type) {
			self.type = cfg.$type;
		}

		if (cfg.$id) {
			self.id = cfg.$id;
		}

		if (cfg.$compile == false) {
			self.nocompile();
		}

		if (cfg.$init) {
			self.$init = cfg.$init;
		}

		if (cfg.$class) {
			self.tclass(cfg.$class);
		}
		
		if (cfg.$released) {
			self.release(cfg.$released == true);
		}
		
		if (cfg.$reconfigure) {
			EXEC.call(cfg.$reconfigure, cfg); // TODO
		}
		return self;
	};

//	PPC.closest = SCP.closest = function(sel) {
	PPC.closest = function(sel) {
		return this.element.closest(sel);
	};

//	PPC.parent = SCP.parent = function(sel) {
	PPC.parent = function(sel) {
		return this.element.parent(sel);
	};

	var TNB = { number: 1, boolean: 1 };

	PPC.html = function(value) {
		var el = this.element;
		if (value === undefined) {
			return el.html();
		}
		if (value instanceof Array) {
			value = value.join('');
		}
		var type = typeof(value);
		//caches.current.element = el[0];
		var v = (value || TNB[type]) ? el.empty().append(value) : el.empty();
		//caches.current.element = null;
		return v;
	};

	/*
	 * This method is alias for self.element.text(), it can set/get a content of the element.
	 */
	PPC.text = function(value) {
		var el = this.element;
		if (value === undefined) {
			return el.text();
		}
		if (value instanceof Array) {
			value = value.join('');
		}
		var type = typeof(value);
		return (value || TNB[type]) ? el.empty().text(value) : el.empty();
	};


	/*
	 * Removes the whole content of element and important removes all components which the parent component is this component.
	 * It is alias for self.element.empty()
	 */
	PPC.empty = function() {

		var self = this;

		if (self.$children) {
			for (var i = 0, length = all.length; i < length; i++) { // M.components.length
				var m = all[i]; //M.components[i];
				!m.$removed && m.owner === self && m.remove();
			}
			self.$children = 0;
		}

		var el = self.element;
		el.empty();
		return el;
	};

//	PPC.append = SCP.append = function(value) {
	PPC.append = function(value) {
		var el = this.element;
		if (value instanceof Array) {
			value = value.join('');
		}
		//caches.current.element = el[0];
		var v = value ? el.append(value) : el;
		//caches.current.element = null;
		return v;
	};

	/*
	 * Registers a new event for the element. Is alias for self.element.on() method.
	 */
//	PPC.event = SCP.event = function() {
	PPC.event = function() {
		var self = this;
		if (self.element) {
			self.element.on.apply(self.element, arguments);
		} else {
			setTimeout(function(arg) {
				self.event(self, arg);
			}, 500, arguments);
		}
		return self;
	};

	/*
	 * Finds elements according to the selector. Is alias for self.element.find() method.
	 */
//	PPC.find = SCP.find = function(selector) {
	PPC.find =  function(selector) {
		return this.element.find(selector);
	};


	/*
	 * Checks a state whether the component is invalid or valid.
	 */
	PPC.isInvalid = function() {
		var self = this;
		var is = !self.$valid;
		if (is && !self.$validate) {
			is = !self.$dirty;
		}
		return is;
	};

	/*
	 * Unregisters a monitoring of value according to the path argument.
	 */
	PPC.unwatch = function(path, fn) {
		var self = this;
		self.view.eventer.off('com' + self._id + '#watch', path, fn);  // OFF
		return self;
	};

	/*
	 * Registers a monitoring of value according to the path argument.
	 */
	PPC.watch = function(path, fn, init) {

		var self = this;

		if (langx.isFunction(path)) {
			init = fn;
			fn = path;
			path = self.path;
		} else {
			path = this.view.binding.pathmaker(path);
		}

		self.on('watch', path, fn, init);
		return self;
	};

	/*
	 * Sets the state of this component to invalid and it contacts all components listen on the path.
	 */
	PPC.invalid = function() {
		return this.storing.invalid(this.path, this);
	};

	PPC.valid = function(value, noEmit) {

		var self = this;

		if (value === undefined) {
			return self.$valid;
		}

		if (self.$valid_disabled) {
			return self;
		}

		self.$valid = value;
		self.$validate = false;
		self.$interaction(102);
		
		self.view.componenter.cache.clear('valid');
		
		if (!noEmit && self.state) {
			self.stateX(1, 1);
		}
		return self;
	};

	PPC.style = function(value) {
		domx.style(value, this._id);
		return this;
	};


	/*
	 * Perform a change state. It changes dirty state and contacts all components which listen on path.
	 */
	PPC.change = function(value) {
		var self = this;
		self.$dirty_disabled = false;
		self.$dirty = true;
		self.storing.change(self.path, value === undefined ? true : value, self);
		return self;
	};

	/*
	 * Sets the last used time, time will be stored in self.usage.custom.
	 */
	PPC.used = function() {
		return this.$interaction(100);
	};

	/*
	 * Sets the last used time, time will be stored in self.usage.custom.
	 */
	PPC.dirty = function(value, noEmit) {

		var self = this;

		if (value === undefined) {
			return self.$dirty;
		}

		if (self.$dirty_disabled) {　
			return self;
		}

		self.$dirty = value;
		self.$interaction(101);
		self.view.componenter.cache.clear('dirty');
		if (!noEmit && self.state) {
			self.stateX(2, 2);
		}
		return self;
	};


	/*
	 * Resets dirty and valid state.
	 */
	PPC.reset = function() {
		var self = this;
		self.storing.reset(self.path, 0, self);
		return self;
	};

	PPC.setDefault = function(value) {
		this.$default = function() {
			return value;
		};
		return this;
	};

	/*
	 * Set a default value for the current component path.
	 */
	PPC.default = function(reset) {
		var self = this;
		self.storing.default(self.path, 0, self, reset);
		return self;
	};


	/*
	 * Removes this component from the DOM and executes destroy delegate.
	 */
	PPC.remove = PPC.kill = function(noClear) {
		var self = this;
		var el = self.element;
		removewaiter(self);
		
		//el.removeData(ATTRDATA);
		//el.attr(ATTRDEL, 'true').find(ATTRCOM).attr(ATTRDEL, 'true');
		self.view.helper.kill(el);

		self.$removed = 1;
		self.removed = true;
		self.view.eventer.off('com' + self._id + '#'); // OFF
		
		if(!noClear) {
			langx.setTimeout2('$cleaner', cleaner2, 100);
		}
		return true;
	};

	PPC.isRemoved = function() {

	};

	PPC.on = function(name, path, fn, init) {
		if (langx.isFunction(path)) {
			init = fn;
			fn = path;
			path = '';
		} else
			path = path.replace('.*', '');

		var self = this;
		var push = '';

		if (name.substring(0, 1) === '^') {
			push = '^';
			name = name.substring(1);
		}

		self.view.eventer.on(push + 'com' + self._id + '#' + name, path, fn, init, self); // ON
		return self;
	};

	/*
	 * Register a new formatter for this component or can format a value.
	 */
	PPC.formatter = function(value, prepend) {
		var self = this;

		if (langx.isFunction(value)) {
			!self.$formatter && (self.$formatter = []);
			if (prepend === true) {
				self.$formatter.unshift(value);
			} else {
				self.$formatter.push(value);
			}
			return self;
		}

		var a = self.$formatter;
		if (a && a.length) {
			for (var i = 0, length = a.length; i < length; i++) {
				value = a[i].call(self, self.path, value, self.type);
			}
		}

		/*
		a = M.$formatter;
		if (a && a.length) {
			for (var i = 0, length = a.length; i < length; i++) {
				value = a[i].call(self, self.path, value, self.type);
			}
		}*/

		value = self.storing.format(value,self.path,self.type); // TODO

		return value;
	};

	PPC.parser = function(value, prepend) {

		var self = this;
		var type = typeof(value);

		if (type === 'function') {
			!self.$parser && (self.$parser = []);

			if (prepend === true) {
				self.$parser.unshift(value);
			} else {
				self.$parser.push(value);
			}

			return self;
		}

		if (self.trim && type === 'string') {
			value = value.trim();
		}

		var a = self.$parser;
		if (a && a.length) {
			for (var i = 0, length = a.length; i < length; i++) {
				value = a[i].call(self, self.path, value, self.type);
			}
		}


		//a = jc.$parser;
		//if (a && a.length) {
		//	for (var i = 0, length = a.length; i < length; i++) {
		//		value = a[i].call(self, self.path, value, self.type);
		//	}
		//}
		value = self.storing.parser(value,self.path,self.type);

		return value;
	};

	/*
	 * Emits an event within jComponent. Is alias for EMIT() method.
	 */
	PPC.emit = function() {
		var self = this;
		self.view.eventer.emit.apply(self.view.eventer, arguments); // W>EMIT
		return this;
	};

	PPC.evaluate = function(path, expression, nopath) {
		var self = this;
		if (!expression) {
			expression = path;
			path = this.path;
		}
		return self.storing.evaluate(path, expression, nopath);
	};

	/*
	 * Get a value according to the data-jc-path or path.
	 */
	PPC.get = function(path) {
		var self = this;
		if (!path) {
			path = self.path;
		}

		if (self.$pp) {
			return self.owner.data(self.path);
		}

		if (path) {
			return self.storing.get(path);
		}
	};

	PPC.skip = function(path) {
		var self = this;
		self.storing.skip(path || self.path); // SKIP
		return self;
	};

	/*
	 * Sets a value according to the component.path.
	 */
	PPC.set = function(value, type) {

		var self = this;
		var arg = arguments;

		if (self.$pp) {
			self.owner.set(self.path, value);
			return self;
		}

		// Backwards compatibility
		if (arg.length === 3) {
			self.storing.setx(arg[0], arg[1], arg[2]);
		} else {
			self.storing.setx(self.path, value, type);
		}

		return self;
	};

	/*
	 * Increments a Number according to the component.path.
	 */
	PPC.inc = function(value, type) {
		var self = this;
		self.storing.inc(self.path, value, type);
		return self;
	};

	/* 
	 * Extends a current value by adding/rewrite new fields with new values.
	 */
	PPC.extend = function(value, type) {
		var self = this;
		self.storing.extend(self.path, value, type); // M.extend
		return self;
	};

	/*
	 * Rewrites a value according to the component.path and it won't notify all listeners.
	 */
	PPC.rewrite = function(value) {
		var self = this;
		self.storing.rewrite(self.path, value);
		return self;
	};

	/*
	 * Pushs a new item into the Array according to the component.path.
	 */
	PPC.push = function(value, type) {
		var self = this;
		self.storing.push(self.path, value, type);
		return self;
	};

	// Component
	PPC.compile = function(container) {
		var self = this;
		!container && self.attrd('jc-compile') && self.attrd('jc-compile', '1');
		this.view.compile(container || self.element);
		return self;
	};

	return Component;
});
define('skylark-totaljs-jcomponent/components/configs',[],function(){
	var configs = {};

	return configs;
});
define('skylark-totaljs-jcomponent/components/configure',[
	"../langx",
	"./configs"
],function(langx,configs){
   /**
   * Sets a default configuration for all components according to the selector
   * @param  {String} selector 
   * @param  {String/Object} config A default configuration
   */
    function configure(selector, config) { //W.COMPONENT_CONFIG = 

        if (langx.isString(selector)) {
            var fn = [];
            selector.split(' ').forEach(function(sel) {
                var prop = '';
                switch (sel.trim().substring(0, 1)) {
                    case '*':
                        fn.push('com.path.indexOf(\'{0}\')!==-1'.format(sel.substring(1)));
                        return;
                    case '.':
                        // path
                        prop = 'path';
                        break;
                    case '#':
                        // id
                        prop = 'id';
                        break;
                    default:
                        // name
                        prop = '$name';
                        break;
                }
                fn.push('com.{0}==\'{1}\''.format(prop, prop === '$name' ? sel : sel.substring(1)));
            });
            selector = FN('com=>' + fn.join('&&'));
        }

        configs.push({ fn: selector, config: config });
    };  

    return configure;
	
});
define('skylark-totaljs-jcomponent/components/extensions',[],function(){
	var extensions = {};

	return extensions;
});
define('skylark-totaljs-jcomponent/components/extend',[
	"../langx",
	"./extensions"
],function(langx,extensions){
	var topic = langx.topic;
   /**
   * Extend a component by adding new features.
   * @param  {String} name 
   * @param  {String/Object} config A default configuration
   * @param  {Function} declaration 
   */
    function extend(name, config, declaration) { //W.COMPONENT_EXTEND = 

        if (langx.isFunction(config)) {
            var tmp = declaration;
            declaration = config;
            config = tmp;
        }

        if (extensions[name]) {
            extensions[name].push({ config: config, fn: declaration });
        } else {
            extensions[name] = [{ config: config, fn: declaration }];
        }

        topic.publish("skylark.vvm.component.extend",name);

    };

	return extend;	
});
define('skylark-totaljs-jcomponent/components/registry',[
], function() {
    var registry = {};

    return registry;
});

define('skylark-totaljs-jcomponent/components/register',[
	"../langx",
	"./registry"
],function(langx,registry){
    function register(name, config, declaration, dependencies) { // W.COMPONENT =

        if (langx.isFunction(config)) {
            dependencies = declaration;
            declaration = config;
            config = null;
        }

        // Multiple versions
        if (name.indexOf(',') !== -1) {
            name.split(',').forEach(function(item, index) {
                item = item.trim();
                if (item) {
                    add(item, config, declaration, index ? null : dependencies);   
                } 
            });
            return;
        }

        if (registry[name]){ // M.$components
            warn('Components: Overwriting component:', name);   
        } 
        var a = registry[name] = { //M.$components
            name: name, 
            config: config, 
            declaration: declaration, 
            shared: {}, 
            dependencies: dependencies instanceof Array ? dependencies : null 
        };
        //topic.emit('component.compile', name, a); //TODO
    }

    return register;
	
});
define('skylark-totaljs-jcomponent/components/versions',[],function(){
	var versions = {};
	
   /**
   * sets a version for specific components.
   * ex : version('textbox@1', 'dropdown@1');
   */
	function setVersion() { // W.VERSION = 
		for (var j = 0; j < arguments.length; j++) {
			var keys = arguments[j].split(',');
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i].trim();
				var tmp = key.indexOf('@');
				if (tmp === -1) {
					continue;
				}
				var version = key.substring(tmp + 1);
				key = key.substring(0, tmp);
				if (version) {
					versions[key] = version;
				}
			}
		}
	}

	function getVersion(name) {
		return versions[name]
	}

	return {
		"get" : getVersion,
		"set" : setVersion
	};
	
});
define('skylark-totaljs-jcomponent/components',[
	"./jc",
	"./langx",
	"./utils/domx",
	"./utils/query",
	"./components/Component",
	"./components/configs",
	"./components/configure",
	"./components/extensions",
	"./components/extend",
	"./components/registry",
	"./components/register",
	"./components/Usage",
	"./components/versions"
],function(jc, langx, domx, $, Component,configs,configure,extensions,extend,registry,register,Usage,versions){


//	var components = {};

//	M.$components = {};
//	M.components = [];


	// ===============================================================
	// PRIVATE FUNCTIONS
	// ===============================================================


    function exechelper(ctx, path, arg) {
		setTimeout(function() {
			EXEC.call(ctx, true, path, arg[0], arg[1], arg[2], arg[3], arg[4], arg[5], arg[6]);
		}, 200);
	}


	// ===============================================================
	// Query Extendtion
	// ===============================================================


	$.fn.component = function() {
		return domx.findInstance(this, '$com');
	};

	$.fn.components = function(fn) {
		//var all = this.find(ATTRCOM);
		var all = helper.nested(this);
		var output = null;
		//all.each(function(index) {
		all.forEach(function(com){
			//var com = this.$com;
			//if (com) {
				var isarr = com instanceof Array;
				if (isarr) {
					com.forEach(function(o) {
						if (o && o.$ready && !o.$removed) {
							if (fn)
								return fn.call(o, index);
							if (!output)
								output = [];
							output.push(o);
						}
					});
				} else if (com && com.$ready && !com.$removed) {
					if (fn)
						return fn.call(com, index);
					if (!output)
						output = [];
					output.push(com);
				}
			//}
		});
		return fn ? all : output;
	};


    function get(name) {
        return types[name];
    }

    /**
     * Returns true/false if the specified type exists or not.
     *
     * @method has
     * @param {String} type Type to look for.
     * @return {Boolean} true/false if the control by name exists.
     */
     function has(name) {
        return !!types[name.toLowerCase()];
    }




	return jc.components = {
		"Component" : Component,
		"configs" : configs,
		"configure" : configure,
		"extensions" : extensions,
		"extend" : extend,
		"registry" : registry,
		"register" : register,
		"Usage" : Usage,
		"versions" : versions

	};

});
define('skylark-totaljs-jcomponent/stores/Store',[
	"../langx"
],function(langx){
	var Store = langx.Evented.inherit({
		_construct : function(options) {
			this.data = options.data;
		}

	});

	return Store;
}); 
define('skylark-totaljs-jcomponent/stores',[
	"skylark-langx/langx",
	"./jc",
	"./stores/Store"
],function(langx, jc, Store){


	// paths -> view model

	var REGPARAMS = /\{{1,2}[a-z0-9_.-\s]+\}{1,2}/gi;

	var proxy = {};

	// ===============================================================
	// PRIVATE FUNCTIONS
	// ===============================================================



	Array.prototype.findValue = function(cb, value, path, def, cache) {

		if (langx.isFunction(cb)) {
			def = path;
			path = value;
			value = undefined;
			cache = false;
		}

		var key, val = def;

		if (cache) {
			key = 'fv_' + cb + '=' + value;
			if (caches.temp[key]) {
				return caches.temp[key];
			}
		}

		var index = this.findIndex(cb, value);
		if (index !== -1) {
			var item = this[index];
			if (path.indexOf('.') === -1) {
				item = item[path];
			} else {
				item = get(path, item);
			}
			cache && (caches.temp[key] = val);
			val = item == null ? def : item;
		}

		return val;
	};

	String.prototype.params = String.prototype.arg = function(obj) {
		return this.replace(REGPARAMS, function(text) {
			// Is double?
			var l = text.charCodeAt(1) === 123 ? 2 : 1;
			var val = langx.result(obj,text.substring(l, text.length - l).trim()); // get(text.substring(l, text.length - l).trim(), obj);
			return val == null ? text : val;
		});
	};



	return jc.stores  = {
		"Store" : Store
	}
});
define('skylark-totaljs-jcomponent/utils/localStorage',[
	"../langx"
],function(langx){

	var $localstorage = 'jc.'; //M.$localstorage


	function get(key) {
		var value = localStorage.getItem($localstorage + key);
		if (value && langx.isString(value)) {
			value = langx.parse(value); // PARSE
		}
		return value;
	}

	function set(key,value) {
		localStorage.setItem($localstorage + key, JSON.stringify(value)); // M.$localstorage
		return this;
	}

	function remove(key) {
		localStorage.removeItem($localstorage + key);
	}

	function clear() {
		var keys = [];
	  	for (var i = 0; i < localStorage.length; i++) {
    		var key = localStorage.key(i);
    		if (key.indexOf($localstorage) == 0)  {
    			keys.push(key);
    		}
  		}
  		for (var i=0;i<keys.length;i++) {
  			localStorage.removeItem(keys[i]);
  		}
	}
	return  {
		"clear" : clear,
		"get" : get,
		"remove": remove,
		"set" : set
	};
});
define('skylark-totaljs-jcomponent/utils/blocks',[
	"../langx",
	"./localStorage"
],function(langx,localStorage){
	var blocked = {},
		blocks = {};

   /**
   * Lock some code for a specific time. 
   * This method will paths info about blocks in localStorage if the expiration is longer than 10 seconds.
   * @param  {String} name   
   * @param  {Number} timeout 
   * @param  {Function} callback  
   */
	blocks.blocked = function (name, timeout, callback) { //W.BLOCKED = 
		var key = name;
		var item = blocked[key];
		var now = Date.now();

		if (item > now) {
			return true;
		}

		if (langx.isString(timeout)) {
			timeout = timeout.env().parseExpire();
		}

		var local = timeout > 10000; // MD.localstorage && timeout > 10000;
		blocked[key] = now + timeout;
		//if (!M.isPRIVATEMODE && local) { // W.isPRIVATEMODE
		  //localStorage.setItem(M.$localstorage + '.blocked', JSON.stringify(blocked));
		localStorage.set('blocked', blocked);
		//}
		callback && callback();
		return false;
	};

	blocks.load = function() {
		//clearTimeout($ready);
		//if (MD.localstorage) {
		blocked = localStorage.get('blocked');

		//M.loaded = true;  //TODO
	}

	blocks.clean = function() {
		for (var key in blocked) {
			if (blocked[key] <= now) {
				delete blocked[key];
				is2 = true;
			}
		}

		if (MD.localstorage && is2 && !M.isPRIVATEMODE)  // W.isPRIVATEMODE
			localStorage.setItem(M.$localstorage + '.blocked', JSON.stringify(blocked));
		
	}

	return blocks;

});
define('skylark-totaljs-jcomponent/utils/storage',[
	"../langx",
	"./localStorage"
],function(langx, localStorage){
	//var M = jc,
	//	MD = defaults;

	var	sessionData = {} ,
		localData= {};

	function save() {
		//if(!M.isPRIVATEMODE && MD.localstorage){ // !W.isPRIVATEMODE && MD.localstorage
		localStorage.setItem('cache', localData); // M.$localstorage
		//}
	}


	function storage(key, value, expire) { //cachestorage //W.CACHE =  

		if (value !== undefined) {
			return storage.set(key,value,expire)
		} else {
			return storage.get(key);
		}

	}

	function save() {
		//if(!M.isPRIVATEMODE && MD.localstorage){ // !W.isPRIVATEMODE && MD.localstorage
		//	localStorage.setItem($localstorage + '.cache', JSON.stringify(storage)); // M.$localstorage
		//}
		localStorage.set('cache', localData);
	}

	storage.get = function (key,expire) {
		var checkSession = !expire || expire == "session",
			checkStorage = !expire  || expire != "session",
			value;

		if (checkSession) {
			value = session[key];
		}

		if (value === undefined && checkStorage) {
			var item = localData[key];
			if (item && item.expire > langx.now()) {
				value = item.value;
			}
		}

		return value;
	};

	storage.set = function (key, value, expire) { 
		if (!expire || expire === 'session') {
			session[key] = value;
			return this;
		}

		if (langx.isString(expire)) {
			expire = expire.parseExpire();
		}

		var now = Date.now();

		localData[key] = { 
			expire: now + expire, 
			value: value 
		};

		save();
		return this;

	};

	storage.remove = function (key, isSearching) { // W.REMOVECACHE = 
		if (isSearching) {
			for (var m in localData) {
				if (m.indexOf(key) !== -1)
					delete localData[key];
			}
		} else {
			delete localData[key];
		}
		save();
		return this;
	};


	storage.clean = function () { 
		for (var key in localData) {
			var item = localData[key];
			if (!item.expire || item.expire <= now) {
				delete localData[key];
			}
		}

		save();		

		return this;
	};


	storage.clear = function () { // W.CLEARCACHE = 
		//if (!M.isPRIVATEMODE) { // !W.isPRIVATEMODE
			var rem = localStorage.removeItem;
			var k = $localstorage; //M.$localstorage;
			rem(k); 
			rem(k + '.cache');
			rem(k + '.blocked');
		//}
		return this;
	};


	storage.getSessionData = function(key) {
		return session[key];
	};

	storage.setSessionData = function(key,value) {
		session[key] = value;
		return this;
	};

	storage.clearSessionData = function() {

		if (!arguments.length) {
			session = {};
			return;
		}

		var keys = langx.keys(page);

		for (var i = 0, length = keys.length; i < length; i++) {
			var key = keys[i];
			var remove = false;
			var a = arguments;

			for (var j = 0; j < a.length; j++) {
				if (key.substring(0, a[j].length) !== a[j]) {
					continue;
				}
				remove = true;
				break;
			}

			if (remove) {
				delete session[key];
			}
		}
	};


	storage.getStorageData = function(key) {
		return session[key];
	};

	storage.setStorageData = function(key,value) {
		session[key] = value;
		return this;
	};

	storage.clearStorageData = function() {

		if (!arguments.length) {
			session = {};
		} else {
			var keys = langx.keys(page);

			for (var i = 0, length = keys.length; i < length; i++) {
				var key = keys[i];
				var remove = false;
				var a = arguments;

				for (var j = 0; j < a.length; j++) {
					if (key.substring(0, a[j].length) !== a[j]) {
						continue;
					}
					remove = true;
					break;
				}

				if (remove) {
					delete session[key];
				}
			}
		}
		save();

	};

	storage.load = function () {
		clearTimeout($ready);
		if (MD.localstorage) {
			var cache;
			try {
				cache = localStorage.getItem(M.$localstorage + '.cache');
				if (cache && langx.isString(cache)) {
					localData = langx.parse(cache); // PARSE
				}
			} catch (e) {}

		}

		if (localData) {
			var obj = localData['$jcpath'];
			obj && Object.keys(obj.value).forEach(function(key) {
				immSetx(key, obj.value[key], true);
			});
		}

		M.loaded = true;
	}


	function clean() {

	}

	return storage;
});
define('skylark-totaljs-jcomponent/utils/cookies',[
	"../langx"
],function(langx){

	function get (name) {
		name = name.env();
		var arr = document.cookie.split(';');
		for (var i = 0; i < arr.length; i++) {
			var c = arr[i];
			if (c.charAt(0) === ' ') {
				c = c.substring(1);
			}
			var v = c.split('=');
			if (v.length > 1 && v[0] === name)
				return v[1];
		}
		return '';
	}
	
	function set(name, value, expire) {
		var type = typeof(expire);
		if (type === 'number') {
			var date = langx.now();//W.NOW;
			date.setTime(date.getTime() + (expire * 24 * 60 * 60 * 1000));
			expire = date;
		} else if (type === 'string') {
			expire = new Date(Date.now() + expire.parseExpire());
		}
		document.cookie = name.env() + '=' + value + '; expires=' + expire.toGMTString() + '; path=/';
	}

	function rem(name) {
		set(name.env(), '', -1);
	}

	return { // W.COOKIES = 
		get,
		set,
		rem
	};


});
define('skylark-totaljs-jcomponent/utils/envs',[
	"../langx"
],function(langx){
	var topic = langx.topic;

	var KEY_ENV = 'skylark.vmm.env',
		REGENV = /(\[.*?\])/gi;

	// The follow code is not used?
	//M.environment = function(name, version, language, env) {
	//	M.$localstorage = name;
	//	M.$version = version || '';
	//	M.$language = language || '';
	//	env && ENV(env);
	//	return M;
	//};



	//var environment = MD.environment = {};
	var vars = {};

	function variant(name, value) { // W.ENV

		if (langx.isObject(name)) {
			name && Object.keys(name).forEach(function(key) {
				vars[key] = name[key];
				topic.publish(KEY_ENV, key, name[key]);  // EMIT
			});
			return name;
		}

		if (value !== undefined) {
			topic.publish(KEY_ENV, name, value); // EMIT
			vars[name]= value; ////ENV[name] = value;
			return value;
		}

		return vars[name];
	};


	/*
	SP.env = function() {
		var self = this;
		return self.replace(REGENV, function(val) {
			return ENV[val.substring(1, val.length - 1)] || val;
		});
	};

	SP.$env = function() {
		var self = this;
		var index = this.indexOf('?');
		return index === -1 ? self.env() : self.substring(0, index).env() + self.substring(index);
	};
	*/

	function replace(str) {
		return str.replace(REGENV, function(val) {
			return vars[val.substring(1, val.length - 1)] || val;
		});		
	}


	String.prototype.env = function() {
		return replace(this);
	};

	String.prototype.$env = function() {
		var self = this;
		var index = this.indexOf('?');
		return index === -1 ? self.env() : self.substring(0, index).env() + self.substring(index);
	};

	return {
		"variant" : variant,
		"replace" : replace 
	}
});
define('skylark-totaljs-jcomponent/utils/logs',[
	"../langx"
],function(langx){
	var W = langx.hoster.global;

	function warn() { // W.WARN
		if (W.console) {
			W.console.warn.apply(W.console, arguments);
		}
	};
	
	return {
		warn
	}

});
define('skylark-totaljs-jcomponent/utils',[
	"./jc",
	"./utils/blocks",
	"./utils/storage",
	"./utils/cookies",
	"./utils/domx",
	"./utils/envs",
	"./utils/localStorage",
	"./utils/logs",
	"./utils/query"
],function(jc,blocks,storage,cookies,domx,envs,localStorage,logs,query){
	
	return jc.utils = {
		blocks : blocks,
		storage : storage,
		cookies : cookies,
		domx : domx,
		envs : envs,
		localStorage : localStorage,
		logs : logs,
		query : query
	};
});
define('skylark-totaljs-jcomponent/views/binding',[
	"../utils/domx",
	"../binding/parse",
	"../binding/pathmaker"
],function(domx, parsebinder,pathmaker){
	function binding(view) {
		var binders = {},
			bindersnew = [];


 		//function parsebinder(el, b, scopes,

		function parse(el,b,scopes) {
			return parsebinder(el,b,scopes,{
				"binders" : binders,
				"bindersnew" : bindersnew
			});
		}

		function binder(el) {
			return el.$jcbind; 
		}

		var $rebinder;

		function binderbind(path, absolutePath, ticks) {
			var arr = binders[path];
			for (var i = 0; i < arr.length; i++) {
				var item = arr[i];
				if (item.ticks !== ticks) {
					item.ticks = ticks;
					item.exec(view.storing.get(item.path), absolutePath);  //GET no pathmake
				}
			}
		}

		function rebindbinder() {
			$rebinder && clearTimeout($rebinder);
			$rebinder = setTimeout(function() {
				var arr = bindersnew.splice(0);
				for (var i = 0; i < arr.length; i++) {
					var item = arr[i];
					if (!item.init) {
						if (item.com) {
							item.exec(item.com.data(item.path), item.path);
						} else {
							item.exec(view.storing.get(item.path), item.path);  // GET
						}
					}
				}
			}, 50);
		}

		function clean() {
			keys = Object.keys(binders);
			for (var i = 0; i < keys.length; i++) {
				arr = binders[keys[i]];
				var j = 0;
				while (true) {
					var o = arr[j++];
					if (!o)
						break;
					if (domx.inDOM(o.el[0])) {
						continue;
					}
					var e = o.el;
					if (!e[0].$br) {
						e.off();
						e.find('*').off();
						e[0].$br = 1;
					}
					j--;
					arr.splice(j, 1);
				}
				if (!arr.length) {
					delete binders[keys[i]];
				}
			}

		}

		return {
			"parse" : parse,
			"pathmaker" : pathmaker,
			"binder" : binder,
			"binders" : binders,
			"binderbind" : binderbind,
			"rebindbinder" : rebindbinder,
			"clean" : clean
		}

	}

	return binding;
});
define('skylark-totaljs-jcomponent/views/cache',[
	"../langx"
],function(langx){

	function cache(view) {	
		var page = {};

		function getPageData(key) {
			return page[key];
		}

		function setPageData(key,value) {
			page[key] = value;
			return this;
		}

		function clearPageData() {

			if (!arguments.length) {
				page = {};
				return;
			}

			var keys = Object.keys(page);

			for (var i = 0, length = keys.length; i < length; i++) {
				var key = keys[i];
				var remove = false;
				var a = arguments;

				for (var j = 0; j < a.length; j++) {
					if (key.substring(0, a[j].length) !== a[j]) {
						continue;
					}
					remove = true;
					break;
				}

				if (remove) {
					delete page[key];
				}
			}
		}

		return {
			"get" : getPageData,
			"set" : setPageData,
			"clear" : clearPageData
		}

	}

	return cache;
});
define('skylark-totaljs-jcomponent/views/http',[
	"skylark-net-http/Xhr",
	"../jc",
	"../langx",
    "../utils/domx",
	"../utils/storage"
],function(Xhr,jc,langx,domx,storage){
	var REGCOM = /(data-jc|data-jc-url|data-jc-import|data-bind|bind)=|COMPONENT\(/; //TODO

	var statics = langx.statics;

	function http(view) {
		var ajaxconfig = {};
		var defaults = {

		};
		defaults.ajaxerrors = false;
		defaults.pingdata = {};
		defaults.baseurl = ''; // String or Function
		defaults.makeurl = null; // Function
		defaults.delayrepeat = 2000;
		defaults.jsondate = true;
		defaults.jsonconverter = {
			'text json': function(text) {
				return PARSE(text);
			}
		};
		defaults.headers = { 'X-Requested-With': 'XMLHttpRequest' };

		function request(url,options) {
			options.url = url;
	        function ajaxSuccess() {
	            if (options.success) {
	                options.success.apply(this,arguments);
	            }
	        }

	        function ajaxError() {
	            if (options.error) {
	                options.error.apply(this,arguments);
	            }
	        }

	        var p = Xhr.request(options.url,options);
	        p = p.then(ajaxSuccess,ajaxError);
	        p.success = p.done;
	        p.error = p.fail;
	        p.complete = p.always;
	        
	        return p;		
		}

		function parseHeaders(val) {
			var h = {};
			val.split('\n').forEach(function(line) {
				var index = line.indexOf(':');
				if (index !== -1) {
					h[line.substring(0, index).toLowerCase()] = line.substring(index + 1).trim();
				}
			});
			return h;
		}

		function cacherest(method, url, params, value, expire) {

			if (params && !params.version && M.$version)
				params.version = M.$version;

			if (params && !params.language && M.$language)
				params.language = M.$language;

			params = langx.stringify(params);
			var key = langx.hashCode(method + '#' + url.replace(/\//g, '') + params).toString();
			return storage.set(key, value, expire);
		}
		


		function makeParams(url, values, type) { //W.MAKEPARAMS = 

			var l = location;

			if (langx.isObject(url)) {
				type = values;
				values = url;
				url = l.pathname + l.search;
			}

			var query;
			var index = url.indexOf('?');
			if (index !== -1) {
				query = M.parseQuery(url.substring(index + 1));
				url = url.substring(0, index);
			} else
				query = {};

			var keys = Object.keys(values);

			for (var i = 0, length = keys.length; i < length; i++) {
				var key = keys[i];
				query[key] = values[key];
			}

			var val = Xhr.param(query, type == null || type === true);
			return url + (val ? '?' + val : '');
		}

		function makeurl(url, make) {

			// TODO
			//defaults.makeurl && (url = defaults.makeurl(url));
			//
			//if (make)
			//	return url;

			var builder = [];
			var en = encodeURIComponent;

			//M.$version && builder.push('version=' + en(M.$version));
			//M.$language && builder.push('language=' + en(M.$language));

			if (!builder.length)
				return url;

			var index = url.indexOf('?');
			if (index == -1)
				url += '?';
			else
				url += '&';

			return url + builder.join('&');
		}

		function upload(url, data, callback, timeout, progress) { //W.UPLOAD = 

			if (!langx.isNumber(timeout) && progress == null) {
				progress = timeout;
				timeout = null;
			}

			if (!url)
				url = location.pathname;

			var method = 'POST';
			var index = url.indexOf(' ');
			var tmp = null;

			if (index !== -1) {
				method = url.substring(0, index).toUpperCase();
			}

			var isCredentials = method.substring(0, 1) === '!';
			if (isCredentials) {
				method = method.substring(1);
			}

			var headers = {};
			tmp = url.match(/\{.*?\}/g);

			if (tmp) {
				url = url.replace(tmp, '').replace(/\s{2,}/g, ' ');
				tmp = (new Function('return ' + tmp))();
				if (langx.isObject(tmp))
					headers = tmp;
			}

			url = url.substring(index).trim().$env();

			if (langx.isNumber(callback)) {
				timeout = callback;
				callback = undefined;
			}

			var output = {};
			output.url = url;
			output.process = true;
			output.error = false;
			output.upload = true;
			output.method = method;
			output.data = data;

			view.eventer.emit('request', output);

			if (output.cancel)
				return;

			setTimeout(function() {

				var xhr = new XMLHttpRequest();

				if (isCredentials) {
					xhr.withCredentials = true;
				}

				xhr.addEventListener('load', function() {

					var self = this;
					var r = self.responseText;
					try {
						r = PARSE(r, defaults.jsondate);
					} catch (e) {}

					if (progress) {
						/* TODO
						if (typeof(progress) === TYPE_S) {
							remap(progress, 100);
						} else {
							progress(100);
						}
						*/
						progress(100);
					}

					output.response = r;
					output.status = self.status;
					output.text = self.statusText;
					output.error = self.status > 399;
					output.headers = parseHeaders(self.getAllResponseHeaders());

					view.eventer.emit('response', output);

					if (!output.process || output.cancel)
						return;

					if (!r && output.error)
						r = output.response = self.status + ': ' + self.statusText;

					if (!output.error || defaults.ajaxerrors) {
						langx.isString(callback)  ? remap(callback.env(), r) : (callback && callback(r, null, output));
					} else {
						view.eventer.emit('error', output);
						output.process && langx.isFunction(callback)  && callback({}, r, output);
					}

				}, false);

				xhr.upload.onprogress = function(evt) {
					if (!progress) {
						return;
					}
					var percentage = 0;
					if (evt.lengthComputable) {
						percentage = Math.round(evt.loaded * 100 / evt.total);
					}
					/* TODO
					if (langx.isString(progress)) {
						remap(progress.env(), percentage);
					} else {
						progress(percentage, evt.transferSpeed, evt.timeRemaining);
					}
					*/
					progress(percentage, evt.transferSpeed, evt.timeRemaining);
				};

				xhr.open(method, makeurl(output.url));

				var keys = Object.keys(defaults.headers);
				for (var i = 0; i < keys.length; i++) {
					xhr.setRequestHeader(keys[i].env(), defaults.headers[keys[i]].env());
				}

				if (headers) {
					var keys = Object.keys(headers);
					for (var i = 0; i < keys.length; i++) {
						xhr.setRequestHeader(keys[i], headers[keys[i]]);
					}
				}

				xhr.send(data);

			}, timeout || 0);

			return W;
		}


		function importCache(url, expire, target, callback, insert, preparator) { // W.IMPORTCACHE = 

			var w;

			url = url.$env().replace(/<.*?>/, function(text) {
				w = text.substring(1, text.length - 1).trim();
				return '';
			}).trim();

			// unique
			var first = url.substring(0, 1);
			var once = url.substring(0, 5).toLowerCase() === 'once ';

			if (langx.isFunction(target)) {

				if (langx.isFunction(callback)) {
					preparator = callback;
					insert = true;
				} else if (langx.isFunction(insert) ) {
					preparator = insert;
					insert = true;
				}

				callback = target;
				target = 'body';
			} else if (langx.isFunction(insert)) {
				preparator = insert;
				insert = true;
			}

			if (w) {

				var wf = w.substring(w.length - 2) === '()';
				if (wf) {
					w = w.substring(0, w.length - 2);
				}

				var wo = GET(w);
				if (wf && langx.isFunction(wo)) {
					if (wo()) {
						callback && callback(0);
						return;
					}
				} else if (wo) {
					callback && callback(0);
					return;
				}
			}

			if (url.substring(0, 2) === '//') {
				url = location.protocol + url;
			}

			var index = url.lastIndexOf(' .');
			var ext = '';

			if (index !== -1) {
				ext = url.substring(index).trim().toLowerCase();
				url = url.substring(0, index).trim();
			}

			if (first === '!' || once) {

				if (once) {
					url = url.substring(5);
				} else {
					url = url.substring(1);
				}

				if (statics[url]) {
					if (callback) {
						if (statics[url] === 2)
							callback(0);
						else {
							view.storing.wait(function() {
								return statics[url] === 2;
							}, function() {
								callback(0);
							});
						}
					}
					return W;
				}

				statics[url] = 1;
			}

			if (target && target.setPath)
				target = target.element;

			if (!target) {
				target = 'body';
			}

			if (!ext) {
				index = url.lastIndexOf('?');
				if (index !== -1) {
					var index2 = url.lastIndexOf('.', index);
					if (index2 !== -1) {
						ext = url.substring(index2, index).toLowerCase();
					}
				} else {
					index = url.lastIndexOf('.');
					if (index !== -1) {
						ext = url.substring(index).toLowerCase();
					}
				}
			}

			var d = document;
			if (ext === '.js') {
				var scr = d.createElement('script');
				scr.type = 'text/javascript';
				scr.async = false;
				scr.onload = function() {
					statics[url] = 2;
					callback && callback(1);
					setTimeout(view.compiler.compile, 300);//W.jQuery && 
				};
				scr.src = makeurl(url, true);
				d.getElementsByTagName('head')[0].appendChild(scr);
				view.eventer.emit('import', url, $(scr));
				return this;
			}

			if (ext === '.css') {
				var stl = d.createElement('link');
				stl.type = 'text/css';
				stl.rel = 'stylesheet';
				stl.href = makeurl(url, true);
				d.getElementsByTagName('head')[0].appendChild(stl);
				statics[url] = 2;
				callback && setTimeout(callback, 200, 1);
				view.eventer.emit('import', url, $(stl));
				return this;
			}

			view.storing.wait(function() {
				return !!W.jQuery;
			}, function() {

				statics[url] = 2;
				var id = 'import' + langx.hashCode(url); // HASH

				var cb = function(response, code, output) {

					if (!response) {
						callback && callback(0);
						return;
					}

					url = '$import' + url;

					if (preparator)
						response = preparator(response, output);

					var is = REGCOM.test(response);
					response = domx.importscripts(domx.importstyles(response, id)).trim();
					target = $(target);

					if (response) {
						//caches.current.element = target[0];
            			target.addClass("importing");
						//if (insert === false) { // TODO
							target.html(response); 
						//} else {
						//	target.append(response);
						//}
						//caches.current.element = null;
            			target.removeClass("importing");
        			}

					setTimeout(function() {
						// is && compile(response ? target : null);
						// because of paths
						is && view.compiler.compile();
						callback && view.storing.wait(function() {
							return view.compiler.is == false;
						}, function() {
							callback(1);
						});
						view.eventer.emit('import', url, target);
					}, 10);
				};

				if (expire) {
					ajaxCache('GET ' + url, null, cb, expire);
				}else {
					ajax('GET ' + url, cb);
				}
			});

			return W;
		}

		function import2(url, target, callback, insert, preparator) { //W.IMPORT = M.import = 
			if (url instanceof Array) {

				if (langx.isFunction(target)) {
					preparator = insert;
					insert = callback;
					callback = target;
					target = null;
				}

				url.wait(function(url, next) {
					importCache(url, null, target, next, insert, preparator);
				}, function() {
					callback && callback();
				});
			} else {
				importCache(url, null, target, callback, insert, preparator);
			}

			return this;
		}

		/* 
		function uptodate(period, url, callback, condition) { // W.UPTODATE = 

			if (langx.isFunction(url)) {
				condition = callback;
				callback = url;
				url = '';
			}

			var dt = new Date().add(period);
			view.eventer.on('knockknock', function() {
				if (dt > langx.now()) //W.NOW)
					return;
				if (!condition || !condition())
					return;
				var id = setTimeout(function() {
					var l = window.location;
					if (url)
						l.href = url.$env();
					else
						l.reload(true);
				}, 5000);
				callback && callback(id);
			});
		}
		*/

		function ping(url, timeout, execute) { // W.PING = 

			if (navigator.onLine != null && !navigator.onLine)
				return;

			if (typeof(timeout) === 'boolean') {
				execute = timeout;
				timeout = 0;
			}

			url = url.$env();

			var index = url.indexOf(' ');
			var method = 'GET';

			if (index !== -1) {
				method = url.substring(0, index).toUpperCase();
				url = url.substring(index).trim();
			}

			var options = {};
			var data = $langx.Xhr.param(defaults.pingdata);

			if (data) {
				index = url.lastIndexOf('?');
				if (index === -1)
					url += '?' + data;
				else
					url += '&' + data;
			}

			options.type = method;
			options.headers = { 'x-ping': location.pathname, 'x-cookies': navigator.cookieEnabled ? '1' : '0', 'x-referrer': document.referrer };

			options.success = function(r) {
				if (r) {
					try {
						(new Function(r))();
					} catch (e) {}
				}
			};

			execute && request(makeurl(url), options);

			return setInterval(function() {
				request(makeurl(url), options);
			}, timeout || 30000);
		}

		function parseQuery(value) { //M.parseQuery = W.READPARAMS = 

			if (!value)
				value = location.search;

			if (!value)
				return {};

			var index = value.indexOf('?');
			if (index !== -1)
				value = value.substring(index + 1);

			var arr = value.split('&');
			var obj = {};
			for (var i = 0, length = arr.length; i < length; i++) {
				var sub = arr[i].split('=');
				var key = sub[0];
				var val = decodeURIComponent((sub[1] || '').replace(/\+/g, '%20'));

				if (!obj[key]) {
					obj[key] = val;
					continue;
				}

				if (!(obj[key] instanceof Array))
					obj[key] = [obj[key]];
				obj[key].push(val);
			}
			return obj;
		}

		function configure(name, fn) {  // W.AJAXCONFIG = 
			ajaxconfig[name] = fn;  
			return this;
		}

		function ajax(url, data, callback, timeout) { // W.AJAX = 

			if (langx.isFunction(url) ) {
				timeout = callback;
				callback = data;
				data = url;
				url = location.pathname;
			}

			var td = typeof(data);
			var arg = EMPTYARRAY;
			var tmp;

			if (!callback && (td === 'function' || td === 'string')) {
				timeout = callback;
				callback = data;
				data = undefined;
			}

			var index = url.indexOf(' ');
			if (index === -1)
				return W;

			var repeat = false;

			url = url.replace(/\srepeat/i, function() {
				repeat = true;
				return '';
			});

			if (repeat)
				arg = [url, data, callback, timeout];

			var method = url.substring(0, index).toUpperCase();
			var isCredentials = method.substring(0, 1) === '!';
			if (isCredentials)
				method = method.substring(1);

			var headers = {};
			tmp = url.match(/\{.*?\}/g);

			if (tmp) {
				url = url.replace(tmp, '').replace(/\s{2,}/g, ' ');
				tmp = (new Function('return ' + tmp))();
				if (langx.isObject(tmp) )
					headers = tmp;
			}

			url = url.substring(index).trim().$env();

			setTimeout(function() {

				if (method === 'GET' && data) {
					var qs = (langx.isString(data)  ? data : jQuery.param(data, true));
					if (qs)
						url += '?' + qs;
				}

				var options = {};
				options.method = method;
				options.converters = defaults.jsonconverter;

				if (method !== 'GET') {
					if (langx.isString(data) ) {
						options.data = data;
					} else {
						options.contentType = 'application/json; charset=utf-8';
						options.data = STRINGIFY(data);
					}
				}

				options.headers = langx.extend(headers, defaults.headers);

				if (url.match(/http:\/\/|https:\/\//i)) {
					options.crossDomain = true;
					delete options.headers['X-Requested-With'];
					if (isCredentials)
						options.xhrFields = { withCredentials: true };
				} else
					url = url.ROOT();

				var custom = url.match(/\([a-z0-9\-.,]+\)/i);
				if (custom) {
					url = url.replace(custom, '').replace(/\s+/g, '');
					options.url = url;
					custom = custom.toString().replace(/\(|\)/g, '').split(',');
					for (var i = 0; i < custom.length; i++) {
						var opt = ajaxconfig[custom[i].trim()];
						opt && opt(options);
					}
				}

				if (!options.url)
					options.url = url;

				view.eventer.emit('request', options); 

				if (options.cancel)
					return;

				options.type = options.method;
				delete options.method;

				var output = {};
				output.url = options.url;
				output.process = true;
				output.error = false;
				output.upload = false;
				output.method = method;
				output.data = data;

				delete options.url;

				options.success = function(r, s, req) {
					output.response = r;
					output.status = req.status || 999;
					output.text = s;
					output.headers = parseHeaders(req.getAllResponseHeaders());
					view.eventer.emit('response', output);
					if (output.process && !output.cancel) {
						/* TODO
						if (typeof(callback) === TYPE_S)
							remap(callback, output.response);
						else
							callback && callback.call(output, output.response, undefined, output);
						*/
						callback && callback.call(output, output.response, undefined, output);
					}
				};

				options.error = function(req, s) {

					var code = req.status;

					if (repeat && (!code || code === 408 || code === 502 || code === 503 || code === 504 || code === 509)) {
						// internal error
						// internet doesn't work
						setTimeout(function() {
							arg[0] += ' REPEAT';
							W.AJAX.apply(M, arg);
						}, defaults.delayrepeat);
						return;
					}

					output.response = req.responseText;
					output.status = code || 999;
					output.text = s;
					output.error = true;
					output.headers = parseHeaders(req.getAllResponseHeaders());
					var ct = output.headers['content-type'];

					if (ct && ct.indexOf('/json') !== -1) {
						try {
							output.response = PARSE(output.response, defaults.jsondate);
						} catch (e) {}
					}

					view.eventer.emit('response', output);

					if (output.cancel || !output.process)
						return;

					if (defaults.ajaxerrors) {
						/* TODO
						if (typeof(callback) === TYPE_S)
							remap(callback, output.response);
						else
							callback && callback.call(output, output.response, output.status, output);
						*/
						callback && callback.call(output, output.response, output.status, output);
					} else {
						view.eventer.emit('error', output);
						if (langx.isFunction(callback)) 
						callback.call(output, output.response, output.status, output);
					}
				};

				request(makeurl(output.url), options);

			}, timeout || 0);

			return this;
		}

		function ajaxCacheReview(url, data, callback, expire, timeout, clear) { //W.AJAXCACHEREVIEW = 
			return ajaxCache(url, data, callback, expire, timeout, clear, true);
		}

		function ajaxCache(url, data, callback, expire, timeout, clear, review) { //W.AJAXCACHE = 


			if (langx.isFunction(data) || (langx.isString(data) && langx.isString(callback)  && !langx.isString(expire))) {
				clear = timeout;
				timeout = expire;
				expire = callback;
				callback = data;
				data = null;
			}

			if (langx.isBoolean(timeout)) {
				clear = timeout === true;
				timeout = 0;
			}

			var index = url.indexOf(' ');
			if (index === -1)
				return W;

			var method = url.substring(0, index).toUpperCase();
			var uri = url.substring(index).trim().$env();

			setTimeout(function() {
				var value = clear ? undefined : cacherest(method, uri, data, undefined, expire);
				if (value !== undefined) {

					var diff = review ? STRINGIFY(value) : null;

					/* TODO
					if (typeof(callback) === TYPE_S)
						remap(callback, value);
					else
						callback(value, true);
					*/
					callback(value, true);

					if (!review)
						return;

					ajax(url, data, function(r, err) {
						if (err)
							r = err;
						// Is same?
						if (diff !== STRINGIFY(r)) {
							cacherest(method, uri, data, r, expire);
							/* TODO
							if (typeof(callback) === TYPE_S)
								remap(callback, r);
							else
								callback(r, false, true);
							*/
							callback(r, false, true);
						}
					});
					return;
				}

				ajax(url, data, function(r, err) {
					if (err)
						r = err;
					cacherest(method, uri, data, r, expire);
					/* TODO
					if (typeof(callback) === TYPE_S)
						remap(callback, r);
					else
						callback(r, false);
					*/
					callback(r, false);
				});
			}, timeout || 1);

			return this;
		}

		return  {
			defaults,
			ajax,
			ajaxCache,
			ajaxCacheReview,
			configure,
			"import" : import2,
			importCache,
			makeParams,
			makeurl,
			ping,
			parseQuery,
			upload
		};

	}
	
	return http;
});
define('skylark-totaljs-jcomponent/views/plugins',[
	"../utils/query",
	"../jc"
],function($, jc){

	function plugins() {
		var registry = {}; // W.PLUGINS

		function Plugin(name, fn) {
			if ((/\W/).test(name)) {
				warn('Plugin name must contain A-Z chars only.');
			}
			if (registry[name]) {
				registry[name].$remove(true);
			}
			var t = this;
			//t.element = $(caches.current.element || document.body); // TODO
			t.element = $(".importing");
			t.id = 'plug' + name;
			t.name = name;
			registry[name] = t;
			//var a = caches.current.owner;
			//caches.current.owner = t.id;
			fn.call(t, t);
			//caches.current.owner = a;
			// topic.emit('plugin', t); // EMIT TODO
		}

		Plugin.prototype.$remove = function() {

			var self = this;
			if (!self.element) {	
				return true;
			}

			/* TODO
			topic.emit('plugin.destroy', self); // EMIT
			if (self.destroy) {
				self.destroy();
			}

			// Remove all global events
			Object.keys(events).forEach(function(e) {
				var evt = events[e];
				evt = evt.remove('owner', self.id);
				if (!evt.length) {
					delete events[e];
				}
			});

			watches = watches.remove('owner', self.id);

			// Remove events
			topic.off(self.id + '#watch'); // OFF 
			*/

			// Remove schedulers
			//schedulers = schedulers.remove('owner', self.id);
			//schedulers.clearAll(self.id);

			// self.element.remove();
			self.element = null;

			delete registry[self.name];
			return true;
		};


		function register(name, fn) { //W.PLUGIN = 
			return fn ? new Plugin(name, fn) : registry[name]; // W.PLUGINS
		};

		function find(name) {
			return registry[name];
		}

		function clean() {
				// Checks PLUGINS
				var R = plugins.registry; //W.PLUGINS;
				Object.keys(R).forEach(function(key) {
					var a = R[key];
					if (!inDOM(a.element[0]) || !a.element[0].innerHTML) {
						a.$remove();
						delete R[key];
					}
				});
			
		}
		
		return  {
			"Plugin" : Plugin,
			"register" : register,
			"registry" : registry,
			"find" : find,
			"clean" : clean
		};

	}

	return plugins;
});
define('skylark-totaljs-jcomponent/views/componenter',[
	"../langx",
	"../utils/domx",
	"../utils/logs",
	"../components/extensions",
	"../components/registry"
],function(langx, domx, logs,extensions, registry){
	var warn = logs.warn;

	function componenter(view) {
		var helper = view.helper,
			eventer = view.eventer,
			storing = view.storing,
			components = [],
			lazycom = {},
			autofill = [],
			cache = {
				dirty : {},
				valid : {},
				find : {},
				clear : function(key1,key2,key3) {
					for (var i = 1; i<arguments.length;i++) {
						var key = arguments[i];
						this[key] = {};
					}
				},

				get : function(category,key) {
					this[category][key];
				},

				set : function(category,key,value) {
					this[category][key] = value;
				}

			},

			defaults = {};

		var knockknockcounter = 0;



		setInterval(function() {
			//W.DATETIME = W.NOW = new Date();
			langx.now(true);
			var c = components;
			for (var i = 0, length = c.length; i < length; i++)
				c[i].knockknock && c[i].knockknock(knockknockcounter);
			eventer.emit('knockknock', knockknockcounter++);  // EMIT
		}, 60000);

		function checkLazy(name) {
			var lo = lazycom[name];

			if (!lo) {
				var namea = name.substring(0, name.indexOf('@'));
				if (namea && name !== namea) {
					lo = lazycom[name] = lazycom[namea] = { state: 1 };
				} else {
					lo = lazycom[name] = { state: 1 };
				}
			}
			return lo;			
		}

		function each(fn, path) {   // M.each
			var wildcard = path ? path.lastIndexOf('*') !== -1 : false;
			if (wildcard) {
				path = path.replace('.*', '');
			}
			var all = components;//M.components;
			var index = 0;
			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];
				if (!com || !com.$loaded || com.$removed || (path && (!com.path || !com.$compare(path)))) {
					continue;
				}
				var stop = fn(com, index++, wildcard);
				if (stop === true) {
					return this;
				}
			}
			return this;
		}

		function com_validate2(com) {

			var valid = true;

			if (com.disabled) {
				return valid;
			}

			if (com.$valid_disabled) {
				return valid;
			}

			var arr = [];
			com.state && arr.push(com);
			com.$validate = true;

			if (com.validate) {
				com.$valid = com.validate(get(com.path));
				com.$interaction(102);
				if (!com.$valid)
					valid = false;
			}

			cache.clear('valid');
			state(arr, 1, 1);
			return valid;
		}

		function com_dirty(path, value, onlyComponent, skipEmitState) {
			var isExcept = value instanceof Array;
			var key = path + (isExcept ? '>' + value.join('|') : '');  // 'dirty' + 
			var except = null;

			if (isExcept) {
				except = value;
				value = undefined;
			}

			var dirty = cache.get("dirty",key);
			if (typeof(value) !== 'boolean' && dirty !== undefined) {
				return dirty;
			}

			dirty = true;
			var arr = value !== undefined ? [] : null;
			var flags = null;

			if (isExcept) {
				var is = false;
				flags = {};
				except = except.remove(function(item) {
					if (item.substring(0, 1) === '@') {
						flags[item.substring(1)] = true;
						is = true;
						return true;
					}
					return false;
				});
				!is && (flags = null);
				isExcept = except.length > 0;
			}

			var index = path.lastIndexOf('.*');
			var wildcard = index !== -1;
			if (index !== -1) {
				path = path.substring(0, index);
			}

			path = view.binding.pathmaker(path);

			var all = components;//M.components;
			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];

				if (!com || com.$removed || !com.$loaded || !com.path || !com.$compare(path) || (isExcept && com.$except(except)))
					continue;

				if (flags && ((flags.visible && !com.visible()) || (flags.hidden && !com.hidden()) || (flags.enabled && com.find(SELINPUT).is(':disabled')) || (flags.disabled && com.find(SELINPUT).is(':enabled'))))
					continue;

				if (com.disabled || com.$dirty_disabled) {
					arr && com.state && arr.push(com);
					continue;
				}

				if (value === undefined) {
					if (com.$dirty === false)
						dirty = false;
					continue;
				}

				com.state && arr.push(com);

				if (!onlyComponent) {
					if (wildcard || com.path === path) {
						com.$dirty = value;
						com.$interaction(101);
					}
				} else if (onlyComponent._id === com._id) {
					com.$dirty = value;
					com.$interaction(101);
				}
				if (com.$dirty === false)
					dirty = false;
			}

			cache.clear('dirty');
			cache.set('dirty',key,dirty);

			// For double hitting component.state() --> look into COM.invalid()
			!skipEmitState && state(arr, 1, 2);
			return dirty;
		}

		function com_valid(path, value, onlyComponent) {

			var isExcept = value instanceof Array;
			var key =  path + (isExcept ? '>' + value.join('|') : ''); // 'valid' +
			var except = null;

			if (isExcept) {
				except = value;
				value = undefined;
			}

			var valid = cache.get("valid",key);

			if (typeof(value) !== 'boolean' && valid !== undefined) {
				return valid; //cache[key];
			}

			var flags = null;

			if (isExcept) {
				var is = false;
				flags = {};
				except = except.remove(function(item) {
					if (item.substring(0, 1) === '@') {
						flags[item.substring(1)] = true;
						is = true;
						return true;
					}
					return false;
				});
				!is && (flags = null);
				isExcept = except.length > 0;
			}

			valid = true;
			var arr = value !== undefined ? [] : null;

			var index = path.lastIndexOf('.*');
			var wildcard = index !== -1;
			if (index !== -1) {
				path = path.substring(0, index);
			}

			path = view.binding.pathmaker(path);

			var all = components;//M.components;
			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];

				if (!com || com.$removed || !com.$loaded || !com.path || !com.$compare(path) || (isExcept && com.$except(except)))
					continue;

				if (flags && ((flags.visible && !com.visible()) || (flags.hidden && !com.hidden()) || (flags.enabled && com.find(SELINPUT).is(':disabled')) || (flags.disabled && com.find(SELINPUT).is(':enabled'))))
					continue;

				if (com.disabled || com.$valid_disabled) {
					arr && com.state && arr.push(com);
					continue;
				}

				if (value === undefined) {
					if (com.$valid === false)
						valid = false;
					continue;
				}

				com.state && arr.push(com);

				if (!onlyComponent) {
					if (wildcard || com.path === path) {
						com.$valid = value;
						com.$interaction(102);
					}
				} else if (onlyComponent._id === com._id) {
					com.$valid = value;
					com.$interaction(102);
				}
				if (com.$valid === false) {
					valid = false;
				}
			}

			cache.clear('valid');
			cache.set('valid',key, valid) ;
			state(arr, 1, 1);
			return valid;
		}

	  /**
	   * Notifies a setter in all components on the path.
	   * @param  {String} path 
	   */
		function notify() { // W.NOTIFY

			var arg = arguments;
			var all = components;//M.components;

			var $ticks = Math.random().toString().substring(2, 8);
			for (var j = 0; j < arg.length; j++) {
				var p = arg[j];
				binders[p] && binderbind(p, p, $ticks);
			}

			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];
				if (!com || com.$removed || com.disabled || !com.$loaded || !com.path)
					continue;

				var is = 0;
				for (var j = 0; j < arg.length; j++) {
					if (com.path === arg[j]) {
						is = 1;
						break;
					}
				}

				if (is) {
					var val = com.get();
					com.setter && com.setterX(val, com.path, 1);
					com.state && com.stateX(1, 6);
					com.$interaction(1);
				}
			}

			for (var j = 0; j < arg.length; j++) {
				eventer.emitwatch(arg[j], getx(arg[j]), 1);  // GET
			}

			return this;  // W
		}

		// what:
		// 1. valid
		// 2. dirty
		// 3. reset
		// 4. update
		// 5. set
		function state(arr, type, what) {
			if (arr && arr.length) {
				setTimeout(function() {
					for (var i = 0, length = arr.length; i < length; i++) {
						arr[i].stateX(type, what);
					}
				}, 2, arr);
			}
		}

		function validate(path, except) { //W.VALIDATE =

			var arr = [];
			var valid = true;

			path = view.binding.pathmaker(path.replaceWildcard()); //pathmaker(path.replace(REGWILDCARD, ''));

			var flags = null;
			if (except) {
				var is = false;
				flags = {};
				except = except.remove(function(item) {
					if (item.substring(0, 1) === '@') {
						flags[item.substring(1)] = true;
						is = true;
						return true;
					}
					return false;
				});
				!is && (flags = null);
				!except.length && (except = null);
			}

			var all = components;//M.components;
			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];
				if (!com || com.$removed || com.disabled || !com.$loaded || !com.path || !com.$compare(path))
					continue;

				if (flags && ((flags.visible && !com.visible()) || (flags.hidden && !com.hidden()) || (flags.enabled && com.find(SELINPUT).is(':disabled')) || (flags.disabled && com.find(SELINPUT).is(':enabled'))))
					continue;

				com.state && arr.push(com);

				if (com.$valid_disabled)
					continue;

				com.$validate = true;
				if (com.validate) {
					com.$valid = com.validate(get(com.path));
					com.$interaction(102);
					if (!com.$valid)
						valid = false;
				}
			}

			cache.clear('valid');
			state(arr, 1, 1);
			return valid;
		}

		function prepare(obj) {

			if (!obj) {
				return;
			}

			var el = obj.element;

			if(extensions[obj.name]) {
				extensions[obj.name].forEach(function(item) {
					if (item.config) {
						obj.reconfigure(item.config, langx.empties.fn);
					}
					item.fn.call(obj, obj, obj.config);
				});
			}

			var value = obj.get();
			var tmp;

			if (obj.configure) {
				obj.reconfigure(obj.config, undefined, true);
			}

			obj.$loaded = true;

			if (obj.setter) {
				if (!obj.$prepared) {

					obj.$prepared = true;
					obj.$ready = true;

					tmp = helper.attrcom(obj, 'value');

					if (tmp) {
						if (!defaults[tmp]) {
							defaults[tmp] = new Function('return ' + tmp);
						}

						obj.$default = defaults[tmp];
						if (value === undefined) {
							value = obj.$default();
							view.storing.set(obj.path, value);
							eventer.emitwatch(obj.path, value, 0);
						}
					}

					if (obj.$binded)
						obj.$interaction(0);
					else {
						obj.$binded = true;
						obj.setterX(value, obj.path, 0);
						obj.$interaction(0);
					}
				}
			} else {
				obj.$binded = true;
			}

			if (obj.validate && !obj.$valid_disabled) {
				obj.$valid = obj.validate(obj.get(), true);
			}

			if (obj.done) {
				setTimeout(obj.done, 20);
			}
			
			if (obj.state) {
				obj.stateX(0, 3);
			}

			if (obj.$init) {
				setTimeout(function() {
					var fn = get(obj.$init);
					if (langx.isFunction(fn)) {
						fn.call(obj, obj);	
					} 
					obj.$init = undefined;
				}, 5);
			}

			var n = 'component';
			el.trigger(n);
			el.off(n);

			var cls = helper.attrcom(el, 'class');
			cls && (function(cls) {
				setTimeout(function() {
					cls = cls.split(' ');
					var tmp = el[0].$jclass || {};
					for (var i = 0, length = cls.length; i < length; i++) {
						if (!tmp[cls[i]]) {
							el.tclass(cls[i]);
							tmp[cls[i]] = true;
						}
					}
					el[0].$jclass = tmp;
				}, 5);
			})(cls);

			if (obj.id) {
				eventer.emit('#' + obj.id, obj);  // EMIT
			}
			eventer.emit('@' + obj.name, obj); // EMIT
			eventer.emit(n, obj);  // EMIT
			cache.clear('find');
			if (obj.$lazy) {
				obj.$lazy.state = 3;
				delete obj.$lazy;
				eventer.emit('lazy', obj.$name, false); // EMIT
			}
		}


		/*
		 * Finds all component according to the selector.
		 *   find(selector,callback) -> wait
		 *   find(selector,many,callback,timeout) -> wait
		 *   find(selector,manay,nocache,callback) -> no wait
		 *   find(selector,manay,timeout) --> no wait
		 * @value {String} selector
         * @many {Boolean} Optional, output will be Array
         * @nocache {Boolean} Optional
         * @callback {Function(response)} Optional and the method will be wait for non-exist components
         * @timeout {Number} Optional, in milliseconds (default: 0)
         * returns {Component} or {Array Component}
		 */
		function find(value, many, noCache, callback) { //W.FIND

			var isWaiting = false;

			if (langx.isFunction(many)) {
				isWaiting = true;
				callback = many;
				many = undefined;
				// noCache = undefined;
				// noCache can be timeout
			} else if (langx.isFunction(noCache)) {
				var tmp = callback;
				isWaiting = true;
				callback = noCache;
				noCache = tmp;
				// noCache can be timeout
			}

			if (isWaiting) {
				view.storing.wait(function() {  // WAIT
					var val = find(value, many, noCache);
					if (lazycom[value] && lazycom[value].state === 1) {
						lazycom[value].state = 2;
						eventer.emit('lazy', value, true); // EMIT
						warn('Lazy load: ' + value);
						view.compiler.compile();
					}
					return val instanceof Array ? val.length > 0 : !!val;
				}, function(err) {
					// timeout
					if (!err) {
						var val = find(value, many);
						callback.call(val ? val : window, val);
					}
				}, 500, noCache);
				return;
			}

			// Element
			if (typeof(value) === 'object') {
				if (!(value instanceof jQuery)) {
					value = $(value);
				}
				var output = helper.findComponent(value, '');
				return many ? output : output[0];
			}

			var key, output;

			if (!noCache) {
				key = value + '.' + (many ? 0 : 1);  // 'find.' + 
				output = cache.get("find",key);//output = cache[key];
				if (output) {
					return output;
				}
			}

			var r = helper.findComponent(null, value);
			if (!many) {
				r = r[0];
			}
			output = r;
			if (!noCache) {
				cache.set("find",key,output);//cache[key] = output;
			}
			return output;
		}

	   /**
	   * Reconfigures all components according to the selector.
	   * @param  {String} selector 
	   * @param  {String/Object} config A default configuration
	   */
		function reconfigure(selector, value) { // W.RECONFIGURE = 
			setter(true, selector, 'reconfigure', value);
			return this; // RECONFIGURE
		};

	   /**
	   * Set a new value to the specific method in components.
	   * @param  {Boolean} wait Optional, can it wait for non-exist components? 
	   * @param  {String} selector  
	   * @param  {String} name Property or Method name (can't be nested) 
	   * @param  {Object} argA Optional, additional argument
	   * @param  {Object} argB Optional, additional argument
	   * @param  {Object} argN Optional, additional argument
	   */
		function setter(selector, name) { // W.SETTER

			var arg = [];
			var beg = selector === true ? 3 : 2;

			for (var i = beg; i < arguments.length; i++) {
				arg.push(arguments[i]);
			}

			if (beg === 3) {

				selector = name;

				if (lazycom[selector] && lazycom[selector].state !== 3) {

					if (lazycom[selector].state === 1) {
						lazycom[selector].state = 2;
						eventer.emit('lazy', selector, true); // EMIT
						warn('Lazy load: ' + selector);
						view.compiler.compile();
					}

					setTimeout(function(arg) {
						arg[0] = true;
						setter.apply(window, arg);
					}, 555, arguments);

					return SETTER;
				}

				name = arguments[2];

				find(selector, true, function(arr) {
					for (var i = 0, length = arr.length; i < length; i++) {
						var o = arr[i];
						if (langx.isFunction(o[name]))
							o[name].apply(o, arg);
						else
							o[name] = arg[0];
					}
				});
			} else {

				if (lazycom[selector] && lazycom[selector].state !== 3) {

					if (lazycom[selector].state === 1) {
						lazycom[selector].state = 2;
						eventer.emit('lazy', selector, true);  // EMIT
						warn('Lazy load: ' + selector);
						view.compiler.compile();
					}

					setTimeout(function(arg) {
						setter.apply(window, arg);
					}, 555, arguments);

					return SETTER;
				}

				var arr = find(selector, true);
				for (var i = 0, length = arr.length; i < length; i++) {
					var o = arr[i];
					if (langx.isFunction(o[name]) )
						o[name].apply(o, arg);
					else
						o[name] = arg[0];
				}
			}

			return this; // SETTER
		};


		// @type {String} Can be "init", "manually", "input" or "custom"
		// @expire {String/Number}, for example "5 minutes"
		// @path {String} Optional, for example "users.form.name"
		// returns {Array Component} or {jComponent}
		function usage(name, expire, path, callback) { //W.LASTMODIFICATION = W.USAGE = M.usage = 

			var type = typeof(expire);
			if (langx.isString(expire)) {
				//var dt = W.NOW = W.DATETIME = new Date();
				var dt = langx.now(true);
				expire = dt.add('-' + expire.env()).getTime();
			} else if (langx.isNumber(expire))
				expire = Date.now() - expire;

			if (langx.isFunction(path)) {
				callback = path;
				path = undefined;
			}

			var arr = [];
			var a = null;

			if (path) {
				a = find('.' + path, true);
			} else {
				a = components;//M.components;
			}

			for (var i = 0; i < a.length; i++) {
				var c = a[i];
				if (c.usage[name] >= expire) {
					if (callback) {
						callback(c);
					} else {
						arr.push(c);
					}
				}
			}

			return callback ? M : arr;
		}


		function clean() {
			var all =  components,
	 			index = 0;
				length = all.length;

			while (index < length) {

				var component = all[index++];

				if (!component) {
					index--;
					all.splice(index, 1);
					length = all.length;
					continue;
				}

				var c = component.element;
				if (!component.$removed && c && domx.inDOM(c[0])) {
					//if (!component.attr(ATTRDEL)) {  // TODO
						if (component.$parser && !component.$parser.length)
							component.$parser = undefined;
						if (component.$formatter && !component.$formatter.length)
							component.$formatter = undefined;
						continue;
					//}
				}

				eventer.emit('destroy', component.name, component);
				eventer.emit('component.destroy', component.name, component);

				delete langx.statics['$ST_' + component.name];
				component.destroy && component.destroy();
				$('#css' + component.ID).remove();

				if (c[0].nodeName !== 'BODY') {
					c.off();
					c.find('*').off();
					c.remove();
				}

				component.$main = undefined;
				component.$data = null;
				component.dom = null;
				component.$removed = 2;
				component.path = null;
				component.setter = null;
				component.setter2 = null;
				component.getter = null;
				component.getter2 = null;
				component.make = null;

				index--;
				all.splice(index, 1);
				length = all.length; // M.components.length
				is = true;
			}

			cache.clear("dirty","valid","find");
		}


		return {
			"autofill"  : autofill,
			"cache" : cache,
			"checkLazy" : checkLazy,
			"clean" : clean,
			"components" : components,
			"com_valid" : com_valid,
			"com_validate2" : com_validate2,
			"com_dirty" : com_dirty,
			"each" : each,
			"find"  : find,
			"notify" : notify,
			"prepare" : prepare,
			"reconfigure" : reconfigure,
			"setter" : setter,
			"state" : state,
			"usage" : usage,
			"validate" : validate
		}
	}
	

	return componenter;
});
define('skylark-totaljs-jcomponent/views/eventer',[
	"../langx",
	"../binding/findFormat"
],function(langx,findFormat){
	var MULTIPLE = ' + ';

	function eventer(view) {
		var events = {};

		function emitwatch(path, value, type) {
			for (var i = 0, length = watches.length; i < length; i++) {
				var self = watches[i];
				if (self.path === '*') {
					self.fn.call(self.context, path, self.format ? self.format(value, path, type) : value, type);
				} else if (path.length > self.path.length) {
					var index = path.lastIndexOf('.', self.path.length);
					if (index === -1 ? false : self.path === path.substring(0, index)) {
						var val = view.storing.get(self.path); // GET
						self.fn.call(self.context, path, self.format ? self.format(val, path, type) : val, type);
					}
				} else {
					for (var j = 0, jl = self.$path.length; j < jl; j++) {
						if (self.$path[j] === path) {
							var val = view.storing.get(self.path); // get2
							self.fn.call(self.context, path, self.format ? self.format(val, path, type) : val, type);
							break;
						}
					}
				}
			}
		}

		// ===============================================================
		// Eventer
		// ===============================================================


		function on(name, path, fn, init, context) {

			if (name.indexOf(MULTIPLE) !== -1) {
				//ex: ON('name1 + name2 + name3', function() {});
				var arr = name.split(MULTIPLE).trim();
				for (var i = 0; i < arr.length; i++) {
					on(arr[i], path, fn, init, context);
				}
				return this; //W;
			}

			var push = true;

			if (name.substring(0, 1) === '^') {
				push = false;
				name = name.substring(1);
			}

			var owner = null;
			var index = name.indexOf('#');

			if (index) {
				owner = name.substring(0, index).trim();
				name = name.substring(index + 1).trim();
			}

			if (langx.isFunction(path)) {
				fn = path;
				path = name === 'watch' ? '*' : '';
			} else {
				path = path.replace('.*', '');
			}

			var obj = { 
				name: name, 
				fn: fn, 
				owner: owner , 
				context: context 
//				owner: owner || current_owner, 
//				context: context || (current_com == null ? undefined : current_com) 
			};

			if (name === 'watch') {
				var arr = [];

				var tmp = findFormat(path);
				if (tmp) {
					path = tmp.path;
					obj.format = tmp.fn;
				}

				if (path.substring(path.length - 1) === '.') {
					path = path.substring(0, path.length - 1);
				}

				// Temporary
				if (path.charCodeAt(0) === 37) { // %
					path = 'jctmp.' + path.substring(1);
				}

				path = path.env();

				// !path = fixed path
				if (path.charCodeAt(0) === 33) { // !
					path = path.substring(1);
					arr.push(path);
				} else {
					var p = path.split('.');
					var s = [];
					for (var j = 0; j < p.length; j++) {
						var b = p[j].lastIndexOf('[');
						if (b !== -1) {
							var c = s.join('.');
							arr.push(c + (c ? '.' : '') + p[j].substring(0, b));
						}
						s.push(p[j]);
						arr.push(s.join('.'));
					}
				}

				obj.path = path;
				obj.$path = arr;

				if (push) {
					watches.push(obj);
				} else {
					watches.unshift(obj);
				}

				init && fn.call(context || view, path, obj.format ? obj.format(view.storing.get(path), path, 0) : view.storing.get(path), 0); // || M
			} else {
				if (events[name]) {
					if (push) {
						events[name].push(obj);
					} else {
						events[name].unshift(obj);
					}
				} else {
					events[name] = [obj];
				}
				//(!C.ready && (name === 'ready' || name === 'init')) && fn(); // TODO: lwf
			}
			return this; //W;
		}

		function off(name, path, fn) {

			if (name.indexOf('+') !== -1) {
				var arr = name.split('+').trim();
				for (var i = 0; i < arr.length; i++) {
					off(arr[i], path, fn); //W.OFF
				}
				return this; //W;
			}

			if (lang.isFunction(path)) {
				fn = path;
				path = '';
			}

			if (path === undefined) {
				path = '';
			}

			var owner = null;
			var index = name.indexOf('#');
			if (index) {
				owner = name.substring(0, index).trim();
				name = name.substring(index + 1).trim();
			}

			if (path) {
				path = path.replace('.*', '').trim();
				var tmp = findFormat(path);
				if (tmp) {
					path = tmp.path;
				}
				if (path.substring(path.length - 1) === '.') {
					path = path.substring(0, path.length - 1);
				}
			}

			var type = 0;

			if (owner && !path && !fn && !name)
				type = 1;
			else if (owner && name && !fn && !path)
				type = 2;
			else if (owner && name && path)
				type = 3;
			else if (owner && name && path && fn)
				type = 4;
			else if (name && path && fn)
				type = 5;
			else if (name && path)
				type = 7;
			else if (fn)
				type = 6;

			var cleararr = function(arr, key) {
				return arr.remove(function(item) {
					if (type > 2 && type < 5) {
						if (item.path !== path)
							return false;
					}
					var v = false;
					if (type === 1)
						v = item.owner === owner;
					else if (type === 2)
						v = key === name && item.owner === owner;
					else if (type === 3)
						v = key === name && item.owner === owner;
					else if (type === 4)
						v = key === name && item.owner === owner && item.fn === fn;
					else if (type === 5 || type === 6)
						v = key === name && item.fn === fn;
					else if (type === 6)
						v = item.fn === fn;
					else if (type === 7)
						v = key === name && item.path === path;
					else
						v = key === name;
					return v;
				});
			};

			Object.keys(events).forEach(function(p) {
				events[p] = cleararr(events[p], p);
				if (!events[p].length) {
					delete events[p];
				}
			});

			watches = cleararr(watches, 'watch');
			return this; //W;
		}

		function emit(name) {

			var e = events[name];
			if (!e) {
				return false;
			}

			var args = [];

			for (var i = 1, length = arguments.length; i < length; i++) {
				args.push(arguments[i]);
			}

			for (var i = 0, length = e.length; i < length; i++) {
				var context = e[i].context;
				if (context !== undefined && (context === null || context.$removed)) {
					continue;
				}
				e[i].fn.apply(context || window, args);
			}

			return true;
		}

		function each(fn) {

			var keys = Object.keys(events);
			var length = keys.length;

			for (var i = 0; i < length; i++) {
				var key = keys[i];
				arr = events[key];
				fn(key,arr);

				if (!arr.length) {
					delete events[key];
				}

			}

		}

		var watches = [];

		function unwatch(path, fn) { //W.UNWATCH 

			if (path.indexOf(MULTIPLE) !== -1) {
				var arr = path.split(MULTIPLE).trim();
				for (var i = 0; i < arr.length; i++)
					unwatch(arr[i], fn);
				return this; //W;
			}

			return off('watch', path, fn); //OFF
		};

		function watch(path, fn, init) { // W.WATCH

			if (path.indexOf(MULTIPLE) !== -1) {
				var arr = path.split(MULTIPLE).trim();
				for (var i = 0; i < arr.length; i++)
					watch(arr[i], fn, init);
				return this; //W;
			}

			if (langx.isFunction(path)) { //if (typeof(path) === TYPE_FN) {
				init = fn;
				fn = path;
				path = '*';
			}

			var push = '';

			if (path.substring(0, 1) === '^') {
				path = path.substring(1);
				push = '^';
			}

			path = view.binding.pathmaker(path, true);
			on(push + 'watch', path, fn, init);  // ON
			return this; //W;
		}

		function clean() {
			topic.each(function(key,arr){
				index = 0;
				while (true) {

					var item = arr[index++];
					if (item === undefined) {
						break;
					}

					if (item.context == null || (item.context.element && inDOM(item.context.element[0]))) {
						continue;
					}

					if (item.context && item.context.element) {
						item.context.element.remove();
					}

					item.context.$removed = true;
					item.context = null;
					arr.splice(index - 1, 1);

					if (!arr.length) {
						delete events[key];
					}

					index -= 2;
					is = true;
				}

			});

			index = 0;
			while (true) {
				var item = watches[index++];
				if (item === undefined)
					break;
				if (item.context == null || (item.context.element && inDOM(item.context.element[0])))
					continue;
				item.context && item.context.element && item.context.element.remove();
				item.context.$removed = true;
				item.context = null;
				watches.splice(index - 1, 1);
				index -= 2;
				is = true;
			}			
		}

		return {
			"clean" : clean,
			"on" : on,
			"off" : off,
			"emit" : emit,
			"watch" : watch,
			"unwatch" : unwatch,
			"emitwatch" : emitwatch
		};

	}

	return eventer;
});
define('skylark-totaljs-jcomponent/views/compiler',[
	"../langx",
	"../utils/query",
	"../utils/domx",
	"../utils/logs",
	"../components/registry",
	"../components/configs",
	"../components/versions"
],function(langx, $, domx, logs,registry,configs,versions){
	var statics = langx.statics;
	var warn = logs.warn;

	var MD = {
		fallback : 'https://cdn.componentator.com/j-{0}.html',
		fallbackcache : '',
		importcache : 'session',
		version : ''
	};

	var fallback = { $: 0 }; // $ === count of new items in fallback

	function compiler(view) {
		var helper = view.helper,
			eventer = view.eventer,
			storing = view.storing,
			scoper = view.scoper,
			binding = view.binding,
			cache = view.cache,
			http = view.http,
			componenter = view.componenter;

		setInterval(function() {
			temp = {};
	//		paths = {};
	//		cleaner();
		}, (1000 * 60) * 5);	

		function clean2() {
			cache.clear();
			clean();
		}

		function clean() {
			var is = false;
			var index;



			cache.clear('find');


			//W.DATETIME = W.NOW = new Date();
			//var now = W.NOW.getTime();
			var is2 = false;
			var is3 = false;




			if (is) {
				refresh();
				setTimeout(compile, 2000);
			}
		}


		setInterval(function() {
	//		temp = {};
	//		paths = {};
			clean();
		}, (1000 * 60) * 5);


	    /*
	    for (var i = 0, length = all.length; i < length; i++) { // M.components.length
	        var m = all[i]; // M.components[i];
	        if (!m.$removed || name === m.name){
	            config && m.reconfigure(config, undefined, true);
	            declaration.call(m, m, m.config);
	        }
	    }

	    RECOMPILE();
	    */
    
		var 
			importing = 0,
			pending = [],
			initing = [],
			imports = {},
			toggles = [],
			//ready = [], // view.ready
			current = {},
			compiles = {
				is : false,
				recompile : false
			}

		//C.get = get; // paths

		// ===============================================================
		// PRIVATE FUNCTIONS
		// ===============================================================
		//var $ready = setTimeout(load, 2);
		var $loaded = false;

		var fallbackPending = [];

		function download() {

			var arr = [];
			var count = 0;

			helper.findUrl(view.elm()).each(function() {

				var t = this;
				var el = $(t);

				if (t.$downloaded) {
					return;
				}

				t.$downloaded = 1;
				var url = helper.attrcom(el, 'url');

				// Unique
				var once = url.substring(0, 5).toLowerCase() === 'once ';
				if (url.substring(0, 1) === '!' || once) {
					if (once) {
						url = url.substring(5);
					} else {
						url = url.substring(1);
					}
					if (statics[url]) {
						return;
					}
					statics[url] = 2;
				}

				var item = {};
				item.url = url;
				item.element = el;
				item.callback = helper.attrcom(el, 'init');
				item.path = helper.attrcom(el, 'path');
				item.toggle = (helper.attrcom(el, 'class') || '').split(' ');
				item.expire = helper.attrcom(el, 'cache') || MD.importcache;
				arr.push(item);
			});

			if (!arr.length) {
				return;
			}

			var canCompile = false;
			importing++;

			langx.async(arr, function(item, next) {

				var key = helper.makeurl(item.url);
				var can = false;

				http.ajaxCache('GET ' + item.url, null, function(response) {

					key = '$import' + key;

					current.element = item.element[0];

					if (statics[key]) {
						response = domx.removescripts(response);
					} else {
						response = domx.importscripts(importstyles(response));
					}

					can = response && helper.canCompile(response);

					if (can) {
						canCompile = true;
					}

					item.element.html(response);
					statics[key] = true;
					item.toggle.length && item.toggle[0] && toggles.push(item);

					if (item.callback && ! helper.attrcom(item.element)) {
						var callback = storing.get(item.callback);
						if (langx.isFunction(callback)) {
							callback(item.element);
						}
					}

					current.element = null;
					count++;
					next();

				}, item.expire);

			}, function() {
				importing--;
				componenter.clean(); // clear('valid', 'dirty', 'find');
				if (count && canCompile){
					compile();
				}
			});
		}

		function downloadFallback() {
			if (importing) {
				setTimeout(downloadFallback, 1000);
			} else {
				langx.setTimeout2('$fallback', function() {
					fallbackPending.splice(0).wait(function(item, next) {
						if (registry[item]){ // M.$components
							next();
						}else {
							warn('Downloading: ' + item);
							http.importCache(MD.fallback.format(item), MD.fallbackcache, next);
						}
					}, 3);
				}, 100);
			}
		}

		function nextPending() {

			var next = pending.shift();
			if (next) {
				next();
			} else { //if ($domready) {
				if (view.ready) {
					compiles.is = false;
				}

				if (MD.fallback && fallback.$ && !importing) {
					var arr = Object.keys(fallback);
					for (var i = 0; i < arr.length; i++) {
						if (arr[i] !== '$') {
							var num = fallback[arr[i]];
							if (num === 1) {
								fallbackPending.push(arr[i].toLowerCase());
								fallback[arr[i]] = 2;
							}
						}
					}
					fallback.$ = 0;
					if (fallbackPending.length) {
						downloadFallback();
					}
				}
			}
		}


		function dependencies(declaration, callback, obj, el) {

			if (declaration.importing) {
				view.storing.wait(function() {
					return declaration.importing !== true;
				}, function() {
					callback(obj, el);
				});
				return;
			}

			if (!declaration.dependencies || !declaration.dependencies.length) {
				setTimeout(function(callback, obj, el) {
					callback(obj, el);
				}, 5, callback, obj, el);
				return;
			}

			declaration.importing = true;
			declaration.dependencies.wait(function(item, next) {
				if (langx.isFunction(item)) {
					item(next);
				} else {
					http.import((item.indexOf('<') === -1 ? 'once ' : '') + item, next);  // IMPORT
				}
			}, function() {
				declaration.importing = false;
				callback(obj, el);
			}, 3);
		}

		function init(el, obj) {

			var dom = el[0];
			var type = dom.tagName;
			var collection;

			// autobind
			if (domx.inputable(type)) {
				obj.$input = true;
				collection = obj.element;
			} else {
				collection = el;
			}

			helper.findControl2(obj, collection);

			obj.released && obj.released(obj.$released);
			componenter.components.push(obj); // M.components.push(obj)
			initing.push(obj);
			if (type !== 'BODY' && helper.canCompile(el[0])) {//REGCOM.test(el[0].innerHTML)) {
				compile(el);
			}
			request(); // ready
		}		


		// parse dom element and create a component instance
		function onComponent(name, dom, level, scope) {

			var el = $(dom);
			var meta = name.split(/_{2,}/);
			if (meta.length) {
				meta = meta.trim(true);
				name = meta[0];
			} else
				meta = null;

			has = true;

			// Check singleton instance
			if (statics['$ST_' + name]) {
				domx.remove(el);
				return;
			}

			var instances = [];
			var all = name.split(',');

			for (var y = 0; y < all.length; y++) {

				var name = all[y].trim();
				var is = false;

				if (name.indexOf('|') !== -1) {

					// Multiple versions
					var keys = name.split('|');
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i].trim();
						if (key &&  registry[key]) { // M.$components
							name = key;
							is = true;
							break;
						}
					}

					if (!is) {
						name = keys[0].trim();
					}
				}

				var lazy = false;

				if (name.substring(0, 5).toLowerCase() === 'lazy ') {
					name = name.substring(5);
					lazy = true;
				}

				if (!is && name.lastIndexOf('@') === -1) {
					var version = versions.get(name); 
					if (version) {
						name += '@' + version;
					} else if (MD.version) {
						name += '@' + MD.version;
					}
				}

				var com = registry[name]; // M.$components[name];
				var lo = null;

				if (lazy && name) {
					lo = componenter.checkLazy(name);;

					if (lo.state === 1) {
						continue;
					}
				}

				if (!com) {

					if (!fallback[name]) {
						fallback[name] = 1;
						fallback.$++;
					}

					var x = helper.attrcom(el, 'import');
					if (!x) {
						!statics['$NE_' + name] && (statics['$NE_' + name] = true);
						continue;
					}

					if (imports[x] === 1) {
						continue;
					}

					if (imports[x] === 2) {
						!statics['$NE_' + name] && (statics['$NE_' + name] = true);
						continue;
					}

					imports[x] = 1;
					importing++;

					http.import(x, function() {
						importing--;
						imports[x] = 2;
					});

					continue;
				}

				if (fallback[name] === 1) {
					fallback.$--;
					delete fallback[name];
				}

				var obj = new helper.Component(com.name,view);
				var parent = dom.parentNode;

				while (true) {
					if (parent.$com) {
						var pc = parent.$com;
						obj.owner = pc;
						if (pc.$children) {
							pc.$children++;
						} else {
							pc.$children = 1;
						}
						break;
					} else if (parent.nodeName === 'BODY') {
						break;
					}
					parent = parent.parentNode;
					if (parent == null) {
						break;
					}
				}

				obj.global = com.shared;
				obj.element = el;
				obj.dom = dom;

				var p = helper.attrcom(el, 'path') || (meta ? meta[1] === 'null' ? '' : meta[1] : '') || obj._id;

				if (p.substring(0, 1) === '%') {
					obj.$noscope = true;
				}

				obj.setPath(binding.pathmaker(p, true), 1);
				obj.config = {};

				// Default config
				if (com.config) {
					obj.reconfigure(com.config, NOOP);
				}

				var tmp = helper.attrcom(el, 'config') || (meta ? meta[2] === 'null' ? '' : meta[2] : ''); // // data-jc-config
				if (tmp) {
					obj.reconfigure(tmp, NOOP);
				}

				if (!obj.$init) {
					obj.$init = helper.attrcom(el, 'init') || null; // data-jc-init
				}

				if (!obj.type) {
					obj.type = helper.attrcom(el, 'type') || '';   // data-jc-type
				}

				if (!obj.id) {
					obj.id = helper.attrcom(el, 'id') || obj._id;  // data-jc-id
				}

				obj.siblings = all.length > 1;
				obj.$lazy = lo;

				for (var i = 0; i < configs.length; i++) {
					var con = configs[i];
					con.fn(obj) && obj.reconfigure(con.config, NOOP);
				}

				current.com = obj;
				com.declaration.call(obj, obj, obj.config);
				current.com = null;

				meta[3] && el.attrd('jc-value', meta[3]);

				if (obj.init && !statics[name]) {
					statics[name] = true;
					obj.init();
				}

				dom.$com = obj;

				if (!obj.$noscope) {
					obj.$noscope = helper.attrcom(el, 'noscope') === 'true';   // data-jc-noscope
				}

				var code = obj.path ? obj.path.charCodeAt(0) : 0;
				if (!obj.$noscope && scope.length && !obj.$pp) {

					var output = scoper.initscopes(scope);

					if (obj.path && code !== 33 && code !== 35) {
						obj.setPath(obj.path === '?' ? output.path : (obj.path.indexOf('?') === -1 ? output.path + '.' + obj.path : obj.path.replace(/\?/g, output.path)), 2);
					} else {
						obj.$$path = [];//EMPTYARRAY;
						obj.path = '';
					}

					obj.scope = output;
					obj.pathscope = output.path;
				}

				instances.push(obj);

				var template = helper.attrcom(el, 'template') || obj.template;  // data-jc-template
				if (template) {
					obj.template = template;
				}

				if (helper.attrcom(el, 'released') === 'true') { // data-jc-released
					obj.$released = true;
				}

				if (helper.attrcom(el, 'url')) {
					warn('Components: You have to use "data-jc-template" attribute instead of "data-jc-url" for the component: {0}[{1}].'.format(obj.name, obj.path));
					continue;
				}

				if (langx.isString(template)) {
					var fn = function(data) {
						if (obj.prerender) {
							data = obj.prerender(data);
						}
						dependencies(com, function(obj, el) {
							if (langx.isFunction(obj.make)) {
								var parent = current.com;
								current.com = obj;
								obj.make(data);
								current.com = parent;
							}
							init(el, obj);
						}, obj, el);
					};

					var c = template.substring(0, 1);
					if (c === '.' || c === '#' || c === '[') {
						fn($(template).html());
						continue;
					}

					var k = 'TE' + HASH(template);
					var a = statics[k];
					if (a) {
						fn(a);
						continue;
					}

					$.get(helper.makeurl(template), function(response) {
						statics[k] = response;
						fn(response);
					});

					continue;
				}

				if (langx.isString(obj.make)) {

					if (obj.make.indexOf('<') !== -1) {
						dependencies(com, function(obj, el) {
							if (obj.prerender)
								obj.make = obj.prerender(obj.make);
							el.html(obj.make);
							init(el, obj);
						}, obj, el);
						continue;
					}

					$.get(makeurl(obj.make), function(data) {
						dependencies(com, function(obj, el) {
							if (obj.prerender) {
								data = obj.prerender(data);
							}
							el.html(data);
							init(el, obj);
						}, obj, el);
					});

					continue;
				}

				if (com.dependencies) {
					dependencies(com, function(obj, el) {

						if (obj.make) {
							var parent = current.com;
							current.com = obj;
							obj.make();
							current.com = parent;
						}

						init(el, obj);
					}, obj, el);
				} else {

					// Because sometimes make doesn't contain the content of the element
					setTimeout(function(init, el, obj) {

						if (obj.make) {
							var parent = current.com;
							current.com = obj;
							obj.make();
							current.com = parent;
						}

						init(el, obj);
					}, 5, init, el, obj);
				}
			}

			// A reference to instances
			if (instances.length > 0) {
				el.$com = instances.length > 1 ? instances : instances[0];
			}

		}
		function crawler(container, onComponent, level, scopes) {
			if (container) {
				container = $(container)[0];
			} else {
				container = view.elm();//document.body;
			}

			if (!container) {
				return;
			}

			/*
			var comp = view.attrcom(container, 'compile') ;
			if (comp === '0' || comp === 'false') {
				// no compile
				return;
			}
			*/
			if (helper.nocompile(container)) {
				return;
			}

			if (level == null || level === 0) {
				scopes = [];
				if (container !== view.elm()) { // document.body) {
					/*
					var scope = $(container).closest('[' + ATTRSCOPE + ']'); //ATTRCOPE
					if (scope && scope.length) {
						scopes.push(scope[0]);
					}
					*/
					var scope = helper.scope(container);
					if (scope) {
						scopes.push(scope);
					}
				}
			}

			var b = null;
			var released = container ? helper.released(container) : false; // sttrcom
			var tmp = helper.attrscope(container); //attrcom
			var binders = null;

			if (tmp) {
				scopes.push(container);
			}

			if (!container.$jcbind) {
				b = helper.attrbind(container); //container.getAttribute('data-bind') || container.getAttribute('bind');
				if (b) {
					if (!binders) {
						binders = [];
					}
					binders.push({ 
						el: container, 
						b: b 
					});
				}
			}

			var name = helper.attrcom(container);
			if (!container.$com && name != null) {
				onComponent(name, container, 0, scopes);
			}

			var arr = container.childNodes;
			var sub = [];

			if (level === undefined) {
				level = 0;
			} else {
				level++;
			}

			for (var i = 0, length = arr.length; i < length; i++) {
				var el = arr[i];
				if (el) {

					if (!el.tagName) {
						continue;
					}

					/*
					comp = el.getAttribute('data-jc-compile');
					if (comp === '0' || comp === 'false') {
						continue;
					}
					*/
					if (helper.nocompile(el)) {
						continue;
					}

					if (el.$com === undefined) {
						name = helper.attrcom(el);
						if (name != null) {
							if (released) {
								helper.released(el,"true"); //el.setAttribute(ATTRREL, 'true');
							}
							onComponent(name || '', el, level, scopes);
						}
					}

					if (!el.$jcbind) {
						b = helper.attrbind(el); //el.getAttribute('data-bind') || el.getAttribute('bind');
						if (b) {
							el.$jcbind = 1;
							!binders && (binders = []);
							binders.push({ el: el, b: b });
						}
					}

					/*
					comp = el.getAttribute('data-jc-compile');
					if (comp !== '0' && comp !== 'false') {
						if (el.childNodes.length && el.tagName !== 'SCRIPT' && REGCOM.test(el.innerHTML) && sub.indexOf(el) === -1)  {
						  sub.push(el);
						}
					}
					*/
					if (!helper.nocompile(el)) {
						if (el.childNodes.length && el.tagName !== 'SCRIPT' && helper.canCompile(el) && sub.indexOf(el) === -1)  { // REGCOM.test(el.innerHTML)
						  sub.push(el);
						}
					}
				}
			}

			for (var i = 0, length = sub.length; i < length; i++) {
				el = sub[i];
				if (el) {
					crawler(el, onComponent, level, scopes && scopes.length ? scopes : []);
				}
			}

			if (binders) {
				for (var i = 0; i < binders.length; i++) {
					var a = binders[i];
					a.el.$jcbind = binding.parse(a.el, a.b, scopes); //parsebinder
				}
			}
		}
	
		function compile(container,immediate) {
			var self = this;

			if (compiles.is) {
				compiles.recompile = true;
				return;
			}

			var arr = [];

			//if (W.READY instanceof Array)  {
			//	arr.push.apply(arr, W.READY);
			//}
			//if (W.jComponent instanceof Array) {
			//	arr.push.apply(arr, W.jComponent);
			//}
			//if (W.components instanceof Array) {
			//	arr.push.apply(arr, W.components);
			//	}

			if (arr.length) {
				while (true) {
					var fn = arr.shift();
					if (!fn){
						break;
					}
					fn();
				}
			}

			compiles.is = true;
			download(self);

			if (pending.length) {
				(function(container) {
					pending.push(function() {
						compile(self,container);
					});
				})(container);
				return;
			}

			var has = false;

			crawler(container, onComponent);

			// perform binder
			binding.rebindbinder();

			if (!has || !pending.length) {
				compiles.is = false;
			}

			if (container !== undefined || !toggles.length) {
				return nextPending();
			}

			langx.async(toggles, function(item, next) {
				for (var i = 0, length = item.toggle.length; i < length; i++)
					item.element.tclass(item.toggle[i]);
				next();
			}, nextPending);
		}		

		function request() {

			langx.setTimeout2('$ready', function() {

				//mediaquery(); // TODO
				view.refresh(); // TODO

				function initialize() {
					var item = initing.pop();
					if (item === undefined)
						!view.ready && compile();
					else {
						if (!item.$removed) {
							componenter.prepare(item);
						}
						initialize();
					}
				}

				initialize();

				var count = componenter.components.length; // M.components
				$(document).trigger('components', [count]);

				if (!$loaded) {
					$loaded = true;
					componenter.clean(); //caches.clear('valid', 'dirty', 'find');
					eventer.emit('init');
					eventer.emit('ready');
				}

				langx.setTimeout2('$initcleaner', function() {
					componenter.clean();
					var arr = componenter.autofill.splice(0);
					for (var i = 0; i < arr.length; i++) {
						var com = arr[i];
						!com.$default && helper.findControl(com.element[0], function(el) {
							var val = $(el).val();
							if (val) {
								var tmp = com.parser(val);
								if (tmp && com.get() !== tmp) {
									com.dirty(false, true);
									com.set(tmp, 0);
								}
							}
							return true;
						});
					}
				}, 1000);

				compiles.is = false;

				if (compiles.recompile) {
					compiles.recompile = false;
					compile();
				}

				if (view.ready) {
					var arr = view.ready;
					for (var i = 0, length = arr.length; i < length; i++)
						arr[i](count);
					view.ready = undefined;
					compile();
					setTimeout(compile, 3000);
					setTimeout(compile, 6000);
					setTimeout(compile, 9000);
				}
			}, 100);
		}

		return langx.mixin(compiles, {

			"compile" : compile,
			"request" : request

		});
	}

	return compiler;

});
define('skylark-totaljs-jcomponent/views/helper',[
	"../langx",	
	"../utils/domx",	
	"../utils/query",	
	"../components/Component",
	"../components/configs"
],function(langx, domx, $,Component,configs){

	var MD = {
		keypress : true,

	};

	function helper(view) {
		var ATTRCOM = '[data-jc]',
			ATTRURL = '[data-jc-url]',
			ATTRDATA = 'jc',
			ATTRDEL = 'data-jc-removed',
			ATTRREL = 'data-jc-released',
			ATTRSCOPE = 'data-jc-scope',
			ATTRCOMPILE = 'data-jc-comile';


		var REGCOM = /(data-jc|data-jc-url|data-jc-import|data-bind|bind)=|COMPONENT\(/;

		function findControl2(com, input) {

			if (com.$inputcontrol) {
				if (com.$inputcontrol % 2 !== 0) {
					com.$inputcontrol++;
					return;
				}
			}

			var target = input ? input : com.element;
			findControl(target[0], function(el) {
				if (!el.$com || el.$com !== com) {
					el.$com = com;
					com.$inputcontrol = 1;
				}
			});
		}

		function findControl(container, onElement, level) {

			var arr = container.childNodes;
			var sub = [];

			domx.inputable(container) && onElement(container);

			if (level == null) {
				level = 0;
			} else {
				level++;
			}

			for (var i = 0, length = arr.length; i < length; i++) {
				var el = arr[i];
				if (el && el.tagName) {
					el.childNodes.length && el.tagName !== 'SCRIPT' && el.getAttribute('data-jc') == null && sub.push(el);
					if (domx.inputable(el) && el.getAttribute('data-jc-bind') != null && onElement(el) === false)
						return;
				}
			}

			for (var i = 0, length = sub.length; i < length; i++) {
				el = sub[i];
				if (el && findControl(el, onElement, level) === false) {
					return;
				}
			}
		}

		// find all nested component
		function nested(el) {
			var $el = $(el),
				arr = [];
			$el.find(ATTRCOM).each(function() {
				var el = $(this);
				var com = el[0].$com;
				if (com && !el.attr(ATTRDEL)) {
					if (com instanceof Array) {
						arr.push.apply(arr, com);
					} else {
						arr.push(com);
					}
				}
			});
			return arr;
		}

		// destory all nested component
		function kill(el) {
			var $el = $(el);
			$el.removeData(ATTRDATA);
			$el.attr(ATTRDEL, 'true').find(ATTRCOM).attr(ATTRDEL, 'true');
		}

		function findComponent(container, selector, callback) {
			var components = view.componenter.components;

			var s = (selector ? selector.split(' ') : []);
			var path = '';
			var name = '';
			var id = '';
			var version = '';
			var index;

			for (var i = 0, length = s.length; i < length; i++) {
				switch (s[i].substring(0, 1)) {
					case '*':
						break;
					case '.':
						// path
						path = s[i].substring(1);
						break;
					case '#':
						// id;
						id = s[i].substring(1);
						index = id.indexOf('[');
						if (index !== -1) {
							path = id.substring(index + 1, id.length - 1).trim();
							id = id.substring(0, index);
						}
						break;
					default:
						// name
						name = s[i];
						index = name.indexOf('[');

						if (index !== -1) {
							path = name.substring(index + 1, name.length - 1).trim();
							name = name.substring(0, index);
						}

						index = name.lastIndexOf('@');

						if (index !== -1) {
							version = name.substring(index + 1);
							name = name.substring(0, index);
						}

						break;
				}
			}

			var arr = callback ? undefined : [];
			if (container) {
				var stop = false;
				container.find('['+view.option("elmAttrNames.com.base")+']').each(function() { // [data-jc]
					var com = this.$com;

					if (stop || !com || !com.$loaded || com.$removed || (id && com.id !== id) || (name && com.$name !== name) || (version && com.$version !== version) || (path && (com.$pp || (com.path !== path && (!com.pathscope || ((com.pathscope + '.' + path) !== com.path))))))
						return;

					if (callback) {
						if (callback(com) === false) {
							stop = true;
						}
					} else {
						arr.push(com);
					}
				});
			} else {
				for (var i = 0, length = components.length; i < length; i++) { // M.components.length
					var com = components[i]; // M.components[i]
					if (!com || !com.$loaded || com.$removed || (id && com.id !== id) || (name && com.$name !== name) || (version && com.$version !== version) || ((path && (com.$pp || (com.path !== path && (!com.pathscope || ((com.pathscope + '.' + path) !== com.path)))))))
						continue;

					if (callback) {
						if (callback(com) === false) {
							break;
						}
					} else {
						arr.push(com);
					}
				}
			}

			return arr;
		}

		function attrcom(el, name) {
			name = name ? '-' + name : '';
			return el.getAttribute ? el.getAttribute('data-jc' + name) : el.attrd('jc' + name);
		}

		function attrbind(el) {
			return el.getAttribute('data-bind') || el.getAttribute('bind');
		}

		function attrscope(el) {
			return el.getAttribute(ATTRSCOPE);
		}

		function scope(el) {
			var results = $(el).closest('[' + ATTRSCOPE + ']');
			if (results && results.length) {
				return results[0];
			}
		}

		function nocompile(el,value) {
			if (value === undefined) {
				var value = $(el).attr(ATTRCOMPILE) ;
				if (value === '0' || value === 'false') {
					// no compile
					return true;
				} else {
					return false;
				}
			} else {
				$(el).attr(ATTRCOMPILE,value);
				return this; 
			}
		}

		function released(el,value) {
			if (value === undefined) {
				var value = $(el).attr(ATTRREL) ;
				if (value === '0' || value === 'false') {
					// no compile
					return true;
				} else {
					return false;
				}
			} else {
				$(el).attr(ATTRREL,value);
				return this; 
			}
		}		

		function canCompile(el) {
			var html = el.innerHTML ? el.innerHTML : el;
			return REGCOM.test(html);
		}

		function findUrl(container) {
			return $(ATTRURL,container);
		}


		function startView() {
			var $el = $(view.elm());

			//if ($ready) {
			//	clearTimeout($ready);
			//	load();
			//}

			function keypressdelay(self) {
				var com = self.$com;
				// Reset timeout
				self.$jctimeout = 0;
				// It's not dirty
				com.dirty(false, true);
				// Binds a value
				com.getter(self.value, true);
			}
			

			$el.on('input', 'input[data-jc-bind],textarea[data-jc-bind]', function() {

				// realtime binding
				var self = this;
				var com = self.$com;

				if (!com || com.$removed || !com.getter || self.$jckeypress === false) {
					return;
				}

				self.$jcevent = 2;

				if (self.$jckeypress === undefined) {
					var tmp = attrcom(self, 'keypress');
					if (tmp)
						self.$jckeypress = tmp === 'true';
					else if (com.config.$realtime != null)
						self.$jckeypress = com.config.$realtime === true;
					else if (com.config.$binding)
						self.$jckeypress = com.config.$binding === 1;
					else
						self.$jckeypress = MD.keypress;
					if (self.$jckeypress === false)
						return;
				}

				if (self.$jcdelay === undefined) {
					self.$jcdelay = +(attrcom(self, 'keypress-delay') || com.config.$delay || MD.delay);
				}

				if (self.$jconly === undefined) {
					self.$jconly = attrcom(self, 'keypress-only') === 'true' || com.config.$keypress === true || com.config.$binding === 2;
				}

				if (self.$jctimeout) {
					clearTimeout(self.$jctimeout);	
				} 
				self.$jctimeout = setTimeout(keypressdelay, self.$jcdelay, self);
			});

			$el.on('focus blur', 'input[data-jc-bind],textarea[data-jc-bind],select[data-jc-bind]', function(e) {

				var self = this;
				var com = self.$com;

				if (!com || com.$removed || !com.getter)
					return;

				if (e.type === 'focusin')
					self.$jcevent = 1;
				else if (self.$jcevent === 1) {
					com.dirty(false, true);
					com.getter(self.value, 3);
				} else if (self.$jcskip) {
					self.$jcskip = false;
				} else {
					// formatter
					var tmp = com.$skip;
					if (tmp)
						com.$skip = false;
					com.setter(com.get(), com.path, 2);
					if (tmp) {
						com.$skip = tmp;
					}
				}
			});

			$el.on('change', 'input[data-jc-bind],textarea[data-jc-bind],select[data-jc-bind]', function() {

				var self = this;
				var com = self.$com;

				if (self.$jconly || !com || com.$removed || !com.getter)
					return;

				if (self.$jckeypress === false) {
					// bind + validate
					self.$jcskip = true;
					com.getter(self.value, false);
					return;
				}

				switch (self.tagName) {
					case 'SELECT':
						var sel = self[self.selectedIndex];
						self.$jcevent = 2;
						com.dirty(false, true);
						com.getter(sel.value, false);
						return;
					case 'INPUT':
						if (self.type === 'checkbox' || self.type === 'radio') {
							self.$jcevent = 2;
							com.dirty(false, true);
							com.getter(self.checked, false);
							return;
						}
						break;
				}

				if (self.$jctimeout) {
					com.dirty(false, true);
					com.getter(self.value, true);
					clearTimeout(self.$jctimeout);
					self.$jctimeout = 0;
				} else {
					self.$jcskip = true;
					com.setter && com.setterX(com.get(), self.path, 2);
				}
			});

			//setTimeout(compile, 2);

		}

		return {
			"attrcom" 		: attrcom,
			"attrbind"      : attrbind,
			"attrscope"     : attrscope,
			"canCompile"    : canCompile,
			"Component"     : Component,
			"findComponent" : findComponent,
			"findControl" 	: findControl,
			"findControl2" 	: findControl2,
			"findUrl"       : findUrl,
			"kill"          : kill,
			"nested"        : nested,
			"nocompile" 	: nocompile,
			"released" 		: released,
			"scope" 		: scope,
			"startView"     : startView
		};

	}

	return helper;
});
define('skylark-totaljs-jcomponent/components/Scope',[
	"../langx"
],function(langx){
	// ===============================================================
	// SCOPE
	// scopes can simplify paths in HTML declaration. In other words: 
	// scopes can reduce paths in all nested components.
	// ===============================================================

	var Scope = langx.klass({
		_construct(elm,view) {
			var self = this;
			self.view = view;
			self.storing = view.storing;
			self.eventer = view.eventer;
		}
	});

	var SCP = Scope.prototype;

	SCP.unwatch = function(path, fn) {
		var self = this;
		self.eventer.off('scope' + self._id + '#watch', self.path + (path ? '.' + path : ''), fn); // OFF
		return self;
	};

	SCP.watch = function(path, fn, init) {
		var self = this;
		self.eventer.on('scope' + self._id + '#watch', self.path + (path ? '.' + path : ''), fn, init, self); // ON 
		return self;
	};

	SCP.reset = function(path, timeout) {
		if (path > 0) {
			timeout = path;
			path = '';
		}
		return RESET(this.path + '.' + (path ? + path : '*'), timeout);
	};

	SCP.default = function(path, timeout) {
		if (path > 0) {
			timeout = path;
			path = '';
		}
		return this.storing.default(this.path + '.' + (path ? path : '*'), timeout); // DEFAULT
	};

	SCP.set = function(path, value, timeout, reset) {
		return this.storing.setx(this.path + (path ? '.' + path : ''), value, timeout, reset); // SET
	};

	SCP.push = function(path, value, timeout, reset) {
		return this.storing.push(this.path + (path ? '.' + path : ''), value, timeout, reset); // PUSH
	};

	SCP.update = function(path, timeout, reset) {
		return this.storing.update(this.path + (path ? '.' + path : ''), timeout, reset); // UPDATE
	};

	SCP.get = function(path) {
		return this.storing.get(this.path + (path ? '.' + path : '')); // GET
	};

	SCP.can = function(except) {
		return this.storing.can(this.path + '.*', except);  // CAN
	};

	SCP.errors = function(except, highlight) {
		return this.storing.errors(this.path + '.*', except, highlight); // ERRORS
	};

	SCP.remove = function() {
		var self = this;
		var arr = self.view.components;//M.components;

		for (var i = 0; i < arr.length; i++) {
			var a = arr[i];
			a.scope && a.scope.path === self.path && a.remove(true);
		}

		if (self.isolated) {
			arr = Object.keys(proxy);
			for (var i = 0; i < arr.length; i++) {
				var a = arr[i];
				if (a.substring(0, self.path.length) === self.path)
					delete proxy[a];
			}
		}

		self.eventer.off('scope' + self._id + '#watch'); // OFF
		var e = self.element;
		e.find('*').off();
		e.off();
		e.remove();
		langx.setTimeout2('$cleaner', cleaner2, 100);
	};

	SCP.FIND = function(selector, many, callback, timeout) {
		return this.element.FIND(selector, many, callback, timeout);
	};

	SCP.SETTER = function(a, b, c, d, e, f, g) {
		return this.element.SETTER(a, b, c, d, e, f, g);
	};

	SCP.RECONFIGURE = function(selector, name) {
		return this.element.RECONFIGURE(selector, name);
	};

	return Scope;
	
});
define('skylark-totaljs-jcomponent/views/scoper',[
  "../langx",
	"../components/Scope"
],function(langx,Scope){
	function scoper(view) {
		var current_owner = null;
		
		var helper = view.helper,
			eventer = view.eventer;

		function initscopes(scopes) {

			var scope = scopes[scopes.length - 1];
			if (scope.$scopedata) {
				return scope.$scopedata;
			}

			var path = helper.attrscope(scope); //attrcom(scope, 'scope');
			var independent = path.substring(0, 1) === '!';

			if (independent) {
				path = path.substring(1);
			}

			var arr = [scope];
			if (!independent) {
				for (var i = scopes.length - 1; i > -1; i--) {
					arr.push(scopes[i]);
					if (helper.attrscope(scopes[i]).substring(0, 1) === '!') { // scopes[i].getAttribute(ATTRSCOPE).
						break;
					}
				}
			}

			var absolute = '';

			arr.length && arr.reverse();

			for (var i = 0, length = arr.length; i < length; i++) {

				var sc = arr[i];
				var p = sc.$scope || helper.attrscope(sc); //attrcom(sc, 'scope');

				sc.$initialized = true;

				if (sc.$processed) {
					absolute = p;
					continue;
				}

				sc.$processed = true;
				sc.$isolated = p.substring(0, 1) === '!';

				if (sc.$isolated) {
					p = p.substring(1);
				}

				if (!p || p === '?')
					p = langx.guid(25).replace(/\d/g, ''); //GUID

				if (sc.$isolated) {
					absolute = p;
				} else {
					absolute += (absolute ? '.' : '') + p;
				}

				sc.$scope = absolute;
				var d = new Scope(sc,view);
				d._id = d.ID = d.id = langx.guid(10); //GUID
				d.path = absolute;
				d.elements = arr.slice(0, i + 1);
				d.isolated = sc.$isolated;
				d.element = $(arr[0]);
				sc.$scopedata = d;

				var tmp = helper.attrcom(sc, 'value');
				if (tmp) {
					var fn = new Function('return ' + tmp);
					defaults['#' + HASH(p)] = fn; // paths by path (DEFAULT() --> can reset scope object)
					tmp = fn();
					set(p, tmp);
					eventer.emitwatch(p, tmp, 1);
				}

				// Applies classes
				var cls = helper.attrcom(sc, 'class');
				if (cls) {
					(function(cls) {
						cls = cls.split(' ');
						setTimeout(function() {
							var el = $(sc);
							for (var i = 0, length = cls.length; i < length; i++) {
								el.tclass(cls[i]);
							}
						}, 5);
					})(cls);
				}

				tmp = helper.attrcom(sc, 'init');
				if (tmp) {
					tmp = scopes.get(tmp);
					if (tmp) {
						var a = current_owner;
						current_owner = 'scope' + d._id;
						tmp.call(d, p, $(sc));
						current_owner = a;
					}
				}
			}

			return scope.$scopedata;
		}


		return {
			initscopes
		}
	}

	return scoper;
});
define('skylark-totaljs-jcomponent/views/storing',[
	"../langx",
	"../utils/storage",
	"../binding/pathmaker"
],function(langx,storage,pathmaker){
	var	SELINPUT = 'input,textarea,select';
	var BLACKLIST = { sort: 1, reverse: 1, splice: 1, slice: 1, pop: 1, unshift: 1, shift: 1, push: 1 };
	
	var REGISARR = /\[\d+\]$/;
	
	function storing (view) {

		var skipproxy = '';

		var eventer = view.eventer,
			binding = view.binding,
			helper = view.helper,
			cache = view.cache;

		var store = view.option("store");

		function remap(path, value) {

			var index = path.replace('-->', '->').indexOf('->');

			if (index !== -1) {
				value = value[path.substring(0, index).trim()];
				path = path.substring(index + 3).trim();
			}

			setx(path, value);
		}


		function parsepath(path) {
			var arr = path.split('.');
			var builder = [];
			var all = [];

			for (var i = 0; i < arr.length; i++) {
				var p = arr[i];
				var index = p.indexOf('[');
				if (index === -1) {
					if (p.indexOf('-') === -1) {
						all.push(p);
						builder.push(all.join('.'));
					} else {
						var a = all.splice(all.length - 1);
						all.push(a + '[\'' + p + '\']');
						builder.push(all.join('.'));
					}
				} else {
					if (p.indexOf('-') === -1) {
						all.push(p.substring(0, index));
						builder.push(all.join('.'));
						all.splice(all.length - 1);
						all.push(p);
						builder.push(all.join('.'));
					} else {
						all.push('[\'' + p.substring(0, index) + '\']');
						builder.push(all.join(''));
						all.push(p.substring(index));
						builder.push(all.join(''));
					}
				}
			}

			return builder;
		}

		var paths = {},
			defaults = {},
			$formatter = [],
			skips = {};
			$parser = [],
			nmCache = {},  // notmodified cache 
			temp = {};


		function bind(path) { // W.BIND = 
			if (path instanceof Array) {
				for (var i = 0; i < path.length; i++) {
					bind(path[i]);
				}
				return this; // 
			}
			path = pathmaker(path);
			if (!path) {
				return this;
			}
			var is = path.charCodeAt(0) === 33; // !
			if (is) {
				path = path.substring(1);
			}
			path = path.replaceWildcard();
			if(path){
				set(path, get(path), true);	
			} 
		}


	   /**
	   * Creates a watcher for all changes.
	   * @param  {String} path 
	   */
		function create(path) { //W.CREATE

			var is = false;
			var callback;

			if (langx.isString(path)) {
				if (proxy[path]) {
					return proxy[path];
				}
				is = true;
				callback = function(key) {

					var p = path + (key ? '.' + key : '');
					if (skipproxy === p) {
						skipproxy = '';
						return;
					}
					setTimeout(function() {
						if (skipproxy === p) {
							skipproxy = '';
						} else {
							notify(p);  // NOTIFY
							reset(p);   // REEST
						}
					}, MD.delaybinder);
				};

			} else {
				callback = path;
			}

			var blocked = false;
			var obj = path ? (get(path) || {}) : {}; // GET
			var handler = {
				get: function(target, property, receiver) {
					try {
						return new Proxy(target[property], handler);
					} catch (err) {
						return Reflect.get(target, property, receiver);
					}
				},
				defineProperty: function(target, property, descriptor) {
					!blocked && callback(property, descriptor);
					return Reflect.defineProperty(target, property, descriptor);
				},
				deleteProperty: function(target, property) {
					!blocked && callback(property);
					return Reflect.deleteProperty(target, property);
				},
				apply: function(target, thisArg, argumentsList) {
					if (BLACKLIST[target.name]) {
						blocked = true;
						var result = Reflect.apply(target, thisArg, argumentsList);
						callback('', argumentsList[0]);
						blocked = false;
						return result;
					}
					return Reflect.apply(target, thisArg, argumentsList);
				}
			};

			var o = new Proxy(obj, handler);

			if (is) {
				skipproxy = path;
				get(path) == null && setx(path, obj, true);  // GET SET
				return proxy[path] = o;
			} else
				return o;
		}


	 	//cache
		function cachePath(path, expire, rebind) { // W.CACHEPATH = 
			var key = '$jcpath';
			WATCH(path, function(p, value) {
				var obj = storage(key); // cachestorage(key);
				if (obj) {
					obj[path] = value;
				}else {
					obj = {};
					obj[path] = value;
				}
				storage(key, obj, expire); // cachestorage(key, obj, expire);
			});

			if (rebind === undefined || rebind) {
				var cache = storage(key); // cachestorage(key);
				if (cache && cache[path] !== undefined && cache[path] !== get(path)){
					setx(path, cache[path], true);	
				} 
			}
			return this; //W 
		};


	   /**
	   * Evaluates a global formatter.
	   * @param  {String} path 
	   * @param  {Object} value
	   * @param  {String} type 
	   * @returns {Boolean}   
	   * OR
	   * Registers a global formatter.
	   * @param  {Function} value 
	   * @param  {Boolean} path 
	   */
		function format(value, path, type) {  // W.FORMATTER = M.formatter =

			if (langx.isFunction(value)) {
				// Prepend
				if (path === true) {
					$formatter.unshift(value);
				} else {
					$formatter.push(value);
				}

				return this;  //M
			}

			var a = $formatter;
			if (a && a.length) {
				for (var i = 0, length = a.length; i < length; i++) {
					var val = a[i].call(M, path, value, type);
					if (val !== undefined)
						value = val;
				}
			}

			return value;
		};

		//get... 

		function get(path, scope) {

			if (path == null) {
				return;
			}

			var code = path.charCodeAt(0);
			if (code === 37)　{  // % 
				path = 'jctmp.' + path.substring(1);
			}

			var key = '=' + path;
			if (paths[key]) {
				return paths[key](scope || store.data);
			}

			if (path.indexOf('?') !== -1) {
				return;
			}

			var arr = parsepath(path);
			var builder = [];

			for (var i = 0, length = arr.length - 1; i < length; i++) {
				var item = arr[i];
				if (item.substring(0, 1) !== '[') {
					item = '.' + item;
				}
				builder.push('if(!w' + item + ')return');
			}

			var v = arr[arr.length - 1];
			if (v.substring(0, 1) !== '['){
				v = '.' + v;
			}

			var fn = (new Function('w', builder.join(';') + ';return w' + v));
			paths[key] = fn;
			return fn(scope || store.data);  // MD.scope
		}

		// set...
		function set(path, value, is) {

			if (path == null) {
				return;
			}

			var key = '+' + path;

			if (paths[key]) {
				return paths[key](store.data, value, path, binding.binders, binding.binderbind, is); // MD.scope
			}

			if (path.indexOf('?') !== -1) {
				path = '';
				return;
			}

			var arr = parsepath(path);
			var builder = [];
			var binder = [];

			for (var i = 0; i < arr.length - 1; i++) {
				var item = arr[i];
				var type = arr[i + 1] ? (REGISARR.test(arr[i + 1]) ? '[]' : '{}') : '{}';
				var p = 'w' + (item.substring(0, 1) === '[' ? '' : '.') + item;
				builder.push('if(typeof(' + p + ')!==\'object\'||' + p + '==null)' + p + '=' + type);
			}

			for (var i = 0; i < arr.length - 1; i++) {
				var item = arr[i];
				binder.push('binders[\'' + item + '\']&&binderbind(\'' + item + '\',\'' + path + '\',$ticks)');
			}

			var v = arr[arr.length - 1];
			binder.push('binders[\'' + v + '\']&&binderbind(\'' + v + '\',\'' + path + '\',$ticks)');
			binder.push('binders[\'!' + v + '\']&&binderbind(\'!' + v + '\',\'' + path + '\',$ticks)');

			if (v.substring(0, 1) !== '['){
				v = '.' + v;
			}

			var fn = (new Function('w', 'a', 'b', 'binders', 'binderbind', 'nobind', 'var $ticks=Math.random().toString().substring(2,8);if(!nobind){' + builder.join(';') + ';var v=typeof(a)==\'function\'?a(MAIN.compiler.get(b)):a;w' + v + '=v}' + binder.join(';') + ';return a'));
			paths[key] = fn;
			fn(store.data, value, path, binding.binders, binding.binderbind, is); // MD.scope

			return this; //C
		}

		function set2(scope, path, value) {

			if (path == null) {
				return;
			}

			var key = '++' + path;

			if (paths[key]) {
				return paths[key](scope, value, path);
			}

			var arr = parsepath(path);

			var builder = [];

			for (var i = 0; i < arr.length - 1; i++) {
				var item = arr[i];
				var type = arr[i + 1] ? (REGISARR.test(arr[i + 1]) ? '[]' : '{}') : '{}';
				var p = 'w' + (item.substring(0, 1) === '[' ? '' : '.') + item;
				builder.push('if(typeof(' + p + ')!==\'object\'||' + p + '==null)' + p + '=' + type);
			}

			var v = arr[arr.length - 1];

			if (v.substring(0, 1) !== '[') {
				v = '.' + v;
			}

			var fn = (new Function('w', 'a', 'b', builder.join(';') + ';w' + v + '=a;return a'));
			paths[key] = fn;
			fn(scope, value, path);
			return scope;
		}

		// 1 === manually
		// 2 === by input
		// 3 === default
		function setx(path, value, type) {  // M.set

			if (path instanceof Array) {
				for (var i = 0; i < path.length; i++) 
					setx(path[i], value, type);
				return this; // M
			}

			path = pathmaker(path);

			if (!path) {
				return this; // M
			}

			var is = path.charCodeAt(0) === 33; // !
			if (is) {
				path = path.substring(1);
			}

			if (path.charCodeAt(0) === 43) { // +
				path = path.substring(1);
				return push(path, value, type);
			}

			if (!path) {
				return this; // M
			}

			var isUpdate = (typeof(value) === 'object' && !(value instanceof Array) && value != null);
			var reset = type === true;
			if (reset) {
				type = 1;
			}

			skipproxy = path;
			set(path, value);

			if (isUpdate) {
				return update(path, reset, type, true);
			}

			var result = get(path);
			var state = [];

			if (type === undefined) {
				type = 1;
			}

			var all = view.componenter.components;//M.components;

			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];

				if (!com || com.disabled || com.$removed || !com.$loaded || !com.path || !com.$compare(path))
					continue;

				if (com.setter) {
					if (com.path === path) {
						if (com.setter) {
							com.setterX(result, path, type);
							com.$interaction(type);
						}
					} else {
						if (com.setter) {
							com.setterX(get(com.path), path, type);
							com.$interaction(type);
						}
					}
				}

				if (!com.$ready) {
					com.$ready = true;
				}

				type !== 3 && com.state && state.push(com);

				if (reset) {
					if (!com.$dirty_disabled)
						com.$dirty = true;
					if (!com.$valid_disabled) {
						com.$valid = true;
						com.$validate = false;
						if (com.validate) {
							com.$valid = com.validate(result);
							com.$interaction(102);
						}
					}

					helper.findControl2(com);

				} else if (com.validate && !com.$valid_disabled) {
					com.valid(com.validate(result), true);
				}
			}

			if (reset) {
				cache.clear('dirty', 'valid');
			}

			for (var i = 0, length = state.length; i < length; i++) {
				state[i].stateX(type, 5);
			}

			eventer.emitwatch(path, result, type);
			return this; // M;
		}

		function defaultValue(path, timeout, onlyComponent, reset) { //M.default = 

			if (timeout > 0) {
				setTimeout(function() {
					defaultValue(path, 0, onlyComponent, reset);
				}, timeout);
				return this;
			}

			if (typeof(onlyComponent) === 'boolean') {
				reset = onlyComponent;
				onlyComponent = null;
			}

			if (reset === undefined) {
				reset = true;
			}

			path = pathmaker(path.replaceWildcard()); //pathmaker(path.replace(REGWILDCARD, ''));

			// Reset scope
			var key = path.replace(/\.\*$/, '');
			var fn = defaults['#' + langx.hashCode(key)]; // HASH
			var tmp;

			if (fn) {
				tmp = fn();
				set(key, tmp);
			}

			var arr = [];
			var all = view.componenter.components;//M.components;

			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];

				if (!com || com.$removed || com.disabled || !com.$loaded || !com.path || !com.$compare(path)) {
					continue;
				}

				if (com.state) {
					arr.push(com);
				}

				if (onlyComponent && onlyComponent._id !== com._id) {
					continue;
				}

				if (com.$default) {
				 com.set(com.$default(), 3);
				}

				if (!reset) {
					return;
				}

				helper.findControl2(com);

				if (!com.$dirty_disabled) {
					com.$dirty = true;
				}
				if (!com.$valid_disabled) {
					com.$valid = true;
					com.$validate = false;
					if (com.validate) {
						com.$valid = com.validate(com.get());
						com.$interaction(102);
					}
				}
			}

			if (reset) {
				cache.clearPageData('valid', 'dirty');
				view.componenter.state(arr, 3, 3);
			}

			return this;
		}


		// 1 === manually
		// 2 === by input
		function update(path, reset, type, wasset) { // M.update =  // immUpdate
			if (path instanceof Array) {
				for (var i = 0; i < path.length; i++) {
					update(store, path[i], reset, type);
				}
				return this;  // M
			}

			path = pathmaker(path);
			if (!path) {
				return this;  // M
			}

			var is = path.charCodeAt(0) === 33; // !
			if (is) {
				path = path.substring(1);
			}

			path = path.replaceWildcard();
			if (!path) {
				return this;  // M
			}

			if (!wasset) {
				get(path, get(path), true);
			}

			var state = [];

			if (type === undefined) {
				type = 1; // manually
			}

			skipproxy = path;

			var all = view.componenter.components;//M.components;
			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];

				if (!com || com.disabled || com.$removed || !com.$loaded || !com.path || !com.$compare(path))
					continue;

				var result = com.get();
				if (com.setter) {
					com.$skip = false;
					com.setterX(result, path, type);
					com.$interaction(type);
				}

				if (!com.$ready) {
					com.$ready = true;
				}

				if (reset === true) {

					if (!com.$dirty_disabled) {
						com.$dirty = true;
						com.$interaction(101);
					}

					if (!com.$valid_disabled) {
						com.$valid = true;
						com.$validate = false;
						if (com.validate) {
							com.$valid = com.validate(result);
							com.$interaction(102);
						}
					}

					helper.findControl2(com);

				} else if (com.validate && !com.$valid_disabled) {
					com.valid(com.validate(result), true);
				}

				if (com.state) {
					state.push(com);
				}
			}

			if (reset) {
				cache.clear('dirty', 'valid');
			}

			for (var i = 0, length = state.length; i < length; i++) {
				state[i].stateX(1, 4);
			}

			eventer.emitwatch(path, get(path), type);

			return this; // M
		}
		
	   /**
	   * Evaluate String expression as JavaScript code.
	   * @param  {String/Object} path Can be object if "path_is_real_value" is "true"
	   * @param  {String} expression A condition.
	   * @param  {Boolean} path_is_real_value Optional, default: false
	   * @returns {Boolean}   
	   */
		function evaluate(path, expression, nopath) { //W.EVALUATE = 

			var key = 'eval' + expression;
			var exp = temp[key];
			var val = null;

			if (nopath) {
				val = path;
			} else {
				val = get(path);
			}

			if (exp) {
				return exp.call(val, val, path);
			}

			if (expression.indexOf('return') === -1) {
				expression = 'return ' + expression;
			}

			exp = new Function('value', 'path', expression);
			temp[key] = exp;
			return exp.call(val, val, path);
		}

		// inc.. 
		function inc(path, value, type) {  // M.inc

			if (path instanceof Array) {
				for (var i = 0; i < path.length; i++)
					inc(path[i], value, type);
				return this; // M
			}

			//path = pathmaker(path); ---

			if (!path) {
				return this; // M
			}

			var current = get(path);
			if (!current) {
				current = 0;
			} else if (!langx.isNumber(current)) {
				current = parseFloat(current);
				if (isNaN(current))
					current = 0;
			}

			current += value;
			setx(path, current, type);
			return this; // M
		}


		// extend...
		function extend(path, value, type) { // M.extend
			path = pathmaker(path);
			if (path) {
				var val = get(path);
				if (val == null) {
					val = {};
				}
				setx(path, langx.extend(val, value), type);
			}
			return this; // M
		}


		function push(path, value, type) { // M.push

			if (path instanceof Array) {
				for (var i = 0; i < path.length; i++) {
					push(path[i], value, type);
				}
				return this; // M
			}

			var arr = get(path);
			var n = false;

			if (!(arr instanceof Array)) {
				arr = [];
				n = true;
			}

			var is = true;
			skipproxy = path;

			if (value instanceof Array) {
				if (value.length)
					arr.push.apply(arr, value);
				else {
					is = false;
				}
			} else {
				arr.push(value);
			}

			if (n) {
				setx(path, arr, type);
			} else if (is) {
				update(path, undefined, type);
			}

			return this; // M
		}

	   /**
	   * Creates an object on the path and notifies all components
	   * @param  {String} path 
	   * @param  {Function} fn 
	   * @param  {Boolean} update Optional Optional, default "true"
	   */
		function make(obj, fn, needsUpdate) { // W.MAKE

			switch (typeof(obj)) {
				case 'function':
					fn = obj;
					obj = {};
					break;
				case 'string':
					var p = obj;
					var is = true;
					obj = get(p);
					if (obj == null) {
						is = false;
						obj = {};
					}
					fn.call(obj, obj, p, function(path, value) {
						setx(obj, path, value);
					});
					if (is && (needsUpdate === undefined || needsUpdate === true))
						update(p, true);
					else {
						if (view.ready) {
							set(p, obj);
						} else {
							setx(p, obj, true);
						}
					}
					return obj;
			}

			fn.call(obj, obj, '');
			return obj;
		}

	   /**
	   * Reads a state, it works with dirty state.
	   * @param  {String} path 
	   * @return {Boolean} 
	   */
		function changed(path) {
			return !view.componenter.com_dirty(path);
		};


	   /**
	   * Set a change for the path or can read the state, it works with dirty state.
	   * @param  {String} path 
	   * @param  {Boolean} value Optional
	   * @return {Boolean} 
	   */
		function change(path, value) {
			if (value == null) {
				value = true;
			}
			return !view.componenter.com_dirty(path, !value);
		};


		/*
		 * This method is same like EXEC() method but it returns a function.
		 * It must be used as a callback. All callback arguments will be used for the targeted method.
		 */
		function exec2(path, tmp) { //W.EXEC2 = 
			var is = path === true;
			return function(a, b, c, d) {
				if (is) {
					exec(tmp, path, a, b, c, d);
				} else {
					exec(path, a, b, c, d);
				}
			};
		};

	  /**
	   * Executes a method according to the path. It wont't throw any exception if the method not exist.
	   * @param  {Boolean} wait Optional enables a waiter for the method instance (if method doesn't exist) 
	   * @param  {String} path 
	   * @param  {Object} a - Optional, additional argument
	   * @param  {Object} b - Optional, additional argument
	   * @param  {Object} c - Optional, additional argument
	   */
		function exec(path) {   // W.EXEC = 

			var arg = [];
			var f = 1;
			var wait = false;
			var p;
			var ctx = this;

			if (path === true) {
				wait = true;
				path = arguments[1];
				f = 2;
			}

			path = path.env();

			for (var i = f; i < arguments.length; i++) {
				arg.push(arguments[i]);
			}

			var c = path.charCodeAt(0);

			// Event
			if (c === 35) { // # , ex: EXEC('#submit', true); --> EMIT('submit', true);
				p = path.substring(1);
				if (wait) {
					!events[p] && exechelper(ctx, path, arg);
				} else {
					EMIT.call(ctx, p, arg[0], arg[1], arg[2], arg[3], arg[4]);
				}
				return EXEC;
			}

			var ok = 0;

			// PLUGINS
			if (c === 64) { // @ , ex: EXEC('@PLUGIN.method_name');
				var index = path.indexOf('.');
				p = path.substring(1, index);
				var ctrl = view.plugins.find(p); //W.PLUGINS[p];
				if (ctrl) {
					var fn = ctrl[path.substring(index + 1)];
					if (langx.isFunction(fn) ) { // if (typeof(fn) === TYPE_FN) {
						fn.apply(ctx === Window ? ctrl : ctx, arg);
						ok = 1;
					}
				}

				if (wait && !ok) {
				 exechelper(ctx, path, arg);
				}
				return EXEC;
			}

			// PLUGINS
			var index = path.indexOf('/'); // ex : EXEC('PLUGIN/method_name');
			if (index !== -1) {
				p = path.substring(0, index);
				var ctrl = view.plugins.find(p); //W.PLUGINS[p];
				var fn = path.substring(index + 1);
				if (ctrl && langx.isFunction(ctrl[fn])) {
					ctrl[fn].apply(ctx === W ? ctrl : ctx, arg);
					ok = 1;
				}

				if (wait && !ok) {
				 exechelper(ctx, path, arg);
				}
				return EXEC;
			}

			var fn = get(path);

			if (langx.isFunction(fn)) {
				fn.apply(ctx, arg);
				ok = 1;
			}

			if (wait && !ok) {
				exechelper(ctx, path, arg);
			}
			return exec;
		};



	   /**
	   * Checks dirty and valid paths for all declared components on the path. 
	   * If the method return true then the components are validated and 
	   * some component has been changed by user (otherwise: false).
	   * @param  {String} path 
	   * @param  {String|Array} except  With absolute paths for skipping
	   * @returns {Boolean}   
	   */
		function can(path, except) { // W.CAN = 
			path = pathmaker(path);
			return !view.componenter.com_dirty(path, except) && view.componenter.com_valid(path, except);
		}

	   /**
	   * Checks dirty and valid paths for all declared components on the path. 
	   * If the method return false then the components are validated and 
	   * some component has been changed by user (otherwise: true).
	   * @param  {String} path 
	   * @param  {String|Array} except  With absolute paths for skipping
	   * @returns {Boolean}   
	   */
		function disabled(path, except) { // W.DISABLED = 
			path = pathmaker(path);
			return view.componenter.com_dirty(path, except) || !view.componenter.com_valid(path, except);
		}

	   /**
	   * Highlights all components on the path as invalid. 
	   * @param  {String} path 
	   * @param  {String|Array} except  With absolute paths for skipping
	   * @returns {Boolean}   
	   */
		function invalid(path, onlyComponent) {  // W.INVALID = 
			path = pathmaker(path);
			if (path) {
				view.componenter.com_dirty(path, false, onlyComponent, true);
				view.componenter.com_valid(path, false, onlyComponent);
			}
			return W;
		};

	   /**
	   * Resets dirty and valid state in all components on the path.
	   * @param  {String} path 
	   * @param  {Number} delay  Optional, in milliseconds (default: 0)
	   */
		function reset(path, timeout, onlyComponent) { //W.RESET = M.reset

			if (timeout > 0) {
				setTimeout(function() {
					reset(path);
				}, timeout);
				return this;
			}

			path = pathmaker(path).replaceWildcard();

			var arr = [];
			var all = view.componenter.components;//M.components;

			for (var i = 0, length = all.length; i < length; i++) {
				var com = all[i];
				if (!com || com.$removed || com.disabled || !com.$loaded || !com.path || !com.$compare(path)) {
					continue;
				}

				com.state && arr.push(com);

				if (onlyComponent && onlyComponent._id !== com._id) {	
					continue;
				}

				helper.findControl2(com);

				if (!com.$dirty_disabled) {
					com.$dirty = true;
					com.$interaction(101);
				}

				if (!com.$valid_disabled) {
					com.$valid = true;
					com.$validate = false;
					if (com.validate) {
						com.$valid = com.validate(com.get());
						com.$interaction(102);
					}
				}
			}

			cache.clear('valid', 'dirty');
			view.componenter.state(arr, 1, 3);
			return this;
		}

		function used(path) {   //M.used
			each(function(obj) {
				!obj.disabled && obj.used();
			}, path);
			return this;
		};

	   /**
	   * Performs SET() and CHANGE() together.
	   * @param  {String} path 
	   * @param  {Object|Array} value.
	   * @param  {String/Number} timeout  Optional, "value > 10" will be used as delay
	   * @param {Boolean} reset Optional
	   */
		function modify (path, value, timeout) { // W.MODIFY =
			if (path && typeof(path) === 'object') {
				Object.keys(path).forEach(function(k) {
					modify(k, path[k], value);
				});
			} else {
				if (langx.isFunction(value)) {
					value = value(get(path));
				}
				setx(path, value, timeout); 
				if (timeout) {
					langx.setTimeout(change, timeout + 5, path);
				} else {
					change(path);
				}
			}
			return this;
		};

	   /**
	   * Returns all modified components by user on the path.
	   * @param  {String} path 
	   * @returns {Array<String>}   
	   */
		function modified(path) { //W.MODIFIED = 
			var output = [];
			each(function(obj) {
				if (!(obj.disabled || obj.$dirty_disabled)) {
					obj.$dirty === false && output.push(obj.path);
				}
			}, pathmaker(path));
			return output;
		}


	   /**
	   * Checks whether the value has not been modified on the path.
	   * @param  {String} path 
	   * @param {Object} value  Optional
	   * @param {Array<String>} fields  Optional, field names
	   * @returns {Booean}   
	   */
		function notmodified(path, value, fields) { // W.NOTMODIFIED = 

			if (value === undefined) {
				value = get(path);
			}

			if (value === undefined) {
				value = null;
			}

			if (fields) {
				path = path.concat('#', fields);
			}

			var s = langx.stringify(value, false, fields); // STRINGIFY
			var hash = langx.hashCode(s); // HASH
			var key =  path; // 'notmodified.' + path

			if (nmCache[key] === hash) { // cache
				return true;
			}

			nmCache[key] = hash; //cache 
			return false;
		}

		function errors(path, except, highlight) { //W.ERRORS = 

			if (path instanceof Array) {
				except = path;
				path = undefined;
			}

			if (except === true) {
				except = highlight instanceof Array ? highlight : null;
				highlight = true;
			}

			var arr = [];

			each(function(obj) { // M.each
				if (!obj.disabled && (!except || !obj.$except(except)) && obj.$valid === false && !obj.$valid_disabled)
					arr.push(obj);
			}, pathmaker(path));

			highlight && langx.state(arr, 1, 1);
			return arr;
		}


		function rewrite(path, value, type) { // W.REWRITE = 
			path = pathmaker(path);
			if (path) {
				skipproxy = path;
				set(path, value);
				eventer.emitwatch(path, value, type);
			}
			return this; // W
		}

		// ===============================================================
		// MAIN FUNCTIONS
		// ===============================================================

	   /**
	   * Evaluates a global parser.
	   * @param  {String} path 
	   * @param  {Object} value
	   * @param  {String} type 
	   * @returns {Boolean}   
	   * OR
	   * Registers a global parser.
	   * @param  {Function} value 
	   */
		function parser(value, path, type) { //W.PARSER = M.parser =  

			if (langx.isFunction(value)) {

				// Prepend
				if (path === true) {
					$parser.unshift(value);
				} else {
					$parser.push(value);
				}

				return this;
			}

			var a = $parser;
			if (a && a.length) {
				for (var i = 0, length = a.length; i < length; i++) {
					value = a[i].call(this, path, value, type);
				}
			}

			return value;
		}

		parser(function(path, value, type) {

			switch (type) {
				case 'number':
				case 'currency':
				case 'float':
					var v = +(langx.isString(value) ? value.trimAll().replace(REGCOMMA, '.') : value);
					return isNaN(v) ? null : v;

				case 'date':
				case 'datetime':

					if (!value) {
						return null;
					}

					if (value instanceof Date) {
						return value;
					}

					value = value.parseDate();
					return value && value.getTime() ? value : null;
			}

			return value;
		});

	   /**
	   * skips component.setter for future update. It's incremental.
	   * @param  {String} pathA Absolute path according to the component "data-jc-path"  
	   * @param  {String} pathB Absolute path according to the component "data-jc-path"  
	   * @param  {String} pathN Absolute path according to the component "data-jc-path"  
	   */
		function skipInc() { // W.SKIP = 
			for (var j = 0; j < arguments.length; j++) {
				var arr = arguments[j].split(',');
				for (var i = 0, length = arr.length; i < length; i++) {
					var p = arr[i].trim();
					if (skips[p]) {
						skips[p]++;
					} else {
						skips[p] = 1;
					}
				}
			}
		}

		function skipDec(p) { // 
			if (skips[p]) {
				var s = --skips[p];
				if (s <= 0) {
					delete skips[p];
					return false;
				}
			}
			return true
		}


		function clean() {
			temp = {};
			paths = {};
		}

		
		var waits = {};

	   /**
	   * Wait for a feature
	   * @param  {String|Function} path/fn  
	   * @param  {Function} callback  
	   * @param  {Number} interval  Optional, in milliseconds (default: 500)
	   * @param  {Number} timeout Optional, a timeout (default: 0 - disabled) 
	   * @return {Boolean}  
	   */ 
		function wait(fn, callback, interval, timeout) { // W.WAIT = 
			var key = ((Math.random() * 10000) >> 0).toString(16);
			var tkey = timeout > 0 ? key + '_timeout' : 0;

			if (typeof(callback) === 'number') {
				var tmp = interval;
				interval = callback;
				callback = tmp;
			}

			var is = typeof(fn) === 'string';
			var run = false;

			if (is) {
				var result = get(fn);
				if (result)
					run = true;
			} else if (fn())
				run = true;

			if (run) {
				callback(null, function(sleep) {
					setTimeout(function() {
						WAIT(fn, callback, interval, timeout);
					}, sleep || 1);
				});
				return;
			}

			if (tkey) {
				waits[tkey] = setTimeout(function() {
					clearInterval(waits[key]);
					delete waits[tkey];
					delete waits[key];
					callback(new Error('Timeout.'));
				}, timeout);
			}

			waits[key] = setInterval(function() {

				if (is) {
					var result = get(fn);
					if (result == null)
						return;
				} else if (!fn())
					return;

				clearInterval(waits[key]);
				delete waits[key];

				if (tkey) {
					clearTimeout(waits[tkey]);
					delete waits[tkey];
				}

				callback && callback(null, function(sleep) {
					setTimeout(function() {
						WAIT(fn, callback, interval);
					}, sleep || 1);
				});

			}, interval || 500);
		};

		return {
			"bind"  : bind,
			"cachePath" : cachePath,
			"can" : can,
			"change" : change,
			"changed" : changed,
			"create" : create,
			"default" : defaultValue,
			"disabled" : disabled,
			"errors" : errors,
			"evaluate" : evaluate,
			"exec" : exec,
			"exec2" : exec2,
			"extend" : extend,
			"format" : format,
			"get"  : get,
			"inc"  : inc,
			"invalid" : invalid,
			"make" : make,
			"modify" : modify,
			"modified" : modified,
			"parser" : parser,
			"paths" : paths,
			"push" : push,
			"reset" : reset,
			"remap" : remap,
			"rewrite" : rewrite,
			"set"  : set,
			"set2" : set2,
 			"setx" : setx,
 			"skipInc" : skipInc,
 			"skipDec" : skipDec,
 			"update" : update,
 			"used" : used,
 			"wait" : wait
		};
	}

	return storing;
});
define('skylark-totaljs-jcomponent/views/View',[
	"../langx",
	"../utils/domx",
	"../utils/query",
	"./binding",
	"./cache",
	"./http",
	"./plugins",
	"./componenter",
	"./eventer",
	"./compiler",
	"./helper",
	"./scoper",
	"./storing",
],function(langx, domx, $,binding, cache, http,plugins,componenter, eventer,compiler, helper,scoper,storing){



	// data-scope    
	// data-compile 
	// data-released 
	// data-vendor
	// data-store
	// data-com
	// data-bind
	var View = domx.Plugin.inherit({
	    options : {
	      elmAttrNames: {
	        scope   : "data-scope",             // data-jc-scope
	        bind    : "data-bind",              // data-bind
	        store   : "data-store",
	      	com  : {
		        base     : "data-com",          // data-jc
		        url      : "data-comp-url",     // data-jc-url
		        removed  : "data-com-removed",  //data-jc-removed
		        released : "data-com-released", //data-jc-released
	      	},
	        compile : "data-compile"            // data-jc-comile
	      }
	    },

		_construct : function(elm,options) {
			domx.Plugin.prototype._construct.apply(this,arguments);

			this.cache = cache(this);
			this.http = http(this);
			this.plugins = plugins(this);
			this.helper = helper(this);
			this.eventer = eventer(this);
			this.scoper = scoper(this);
			this.binding = binding(this);
			this.storing = storing(this);
			this.componenter = componenter(this);
			this.compiler = compiler(this);
			
			this.ready = [];
		},

	   /**
	   * Create new components dynamically.
	   * @param  {String|Array<String>} declaration 
	   * @param  {jQuery Element/Component/Scope/Plugin} element optional,a parent element (default: "document.body")
	   */
		add : function (value, element) { // W.ADD =
			if (element instanceof COM || element instanceof Scope || element instanceof Plugin) {
				element = element.element;
			}
			if (value instanceof Array) {
				for (var i = 0; i < value.length; i++)
					ADD(value[i], element);
			} else {
				$(element || document.body).append('<div data-jc="{0}"></div>'.format(value));
				setTimeout2('ADD', COMPILE, 10);
			}
		},

		compile : function (container,immediate) {

		},

		refresh : function () {
			var self = this;
			setTimeout2('$refresh', function() {
				self.componenter.components.sort(function(a, b) {  // M.components.sort
					if (a.$removed || !a.path)
						return 1;
					if (b.$removed || !b.path)
						return -1;
					var al = a.path.length;
					var bl = b.path.length;
					return al > bl ? - 1 : al === bl ? langx.localCompare(a.path, b.path) : 1;
				});
			}, 200);
		},

		start : function() {
			this.helper.startView();
		},

		end : function() {

		}

	});

	return View;
});
define('skylark-totaljs-jcomponent/views',[
	"./jc",
	"./views/View"
],function(jc, View){
	return jc.views = {
		"View" : View
	};
});
define('skylark-totaljs-jcomponent/others/schedulers',[
	"../langx"
],function(langx){
	var schedulers = [];
	var schedulercounter = 0;


	function clearAll(ownerId) {
		schedulers.remove('owner', ownerId);
		return this;
	}	

	// scheduler
	schedulercounter = 0;
	setInterval(function() {

		if (!schedulers.length)
			return;

		schedulercounter++;
		//var now = new Date();
		//W.DATETIME = W.NOW = now;
		var now = langx.now(true);
		for (var i = 0, length = schedulers.length; i < length; i++) {
			var item = schedulers[i];
			if (item.type === 'm') {
				if (schedulercounter % 30 !== 0)
					continue;
			} else if (item.type === 'h') {
				// 1800 seconds --> 30 minutes
				// 1800 / 2 (seconds) --> 900
				if (schedulercounter % 900 !== 0)
					continue;
			}

			var dt = now.add(item.expire);
			var arr = FIND(item.selector, true);
			for (var j = 0; j < arr.length; j++) {
				var a = arr[j];
				a && a.usage.compare(item.name, dt) && item.callback(a);
			}
		}
	}, 3500);


	function schedule(selector, name, expire, callback) { //W.SCHEDULE = 
		if (expire.substring(0, 1) !== '-')
			expire = '-' + expire;
		var arr = expire.split(' ');
		var type = arr[1].toLowerCase().substring(0, 1);
		var id = langx.guid(10); //GUID
		schedulers.push({ 
			id: id, 
			name: name, 
			expire: expire, 
			selector: selector, callback: callback, type: type === 'y' || type === 'd' ? 'h' : type, owner: current_owner });
		return id;
	};

	function clear(id) {  //W.CLEARSCHEDULE
		schedulers = schedulers.remove('id', id);
		return this;
	};


	return  {
		clear,
		clearAll,
		schedule
	}
});
define('skylark-totaljs-jcomponent/others/transforms',[
],function(){
	var registry = { //M.transforms

	};

	function register(name, callback) { // W.NEWTRANSFORM
		registry[name] = callback;  
		return this;
	};

	function transform(name, value, callback) { //W.TRANSFORM

		var m = registry;

		if (arguments.length === 2) {
			// name + value (is callback)
			return function(val) {
				transform(name, val, value);
			};
		}

		var cb = function() {
			if (typeof(callback) === 'string') {
				SET(callback, value);
			} else {
				callback(value);
			}
		};

		var keys = name.split(',');
		var async = [];
		var context = {};

		context.value = value;

		for (var i = 0, length = keys.length; i < length; i++) {
			var key = keys[i].trim();
			key && m[key] && async.push(m[key]);
		}

		if (async.length === 1)
			async[0].call(context, value, function(val) {
				if (val !== undefined)
					value = val;
				cb();
			});
		else if (async.length) {
			async.wait(function(fn, next) {
				fn.call(context, value, function(val) {
					if (val !== undefined)
						value = val;
					next();
				});
			}, cb);
		} else {
			cb();
		}

		return this;
	};

	return  {
		register,
		transform
	}
});
define('skylark-totaljs-jcomponent/globals',[
	"./jc",
	"./langx",
	"./utils",
	"./components",
	"./binding",
	"./stores",
	"./views",
	"./others/schedulers",
	"./others/transforms"
],function(jc, langx,utils,components,binding,stores,views, schedulers, transforms){
	var $ = utils.query,
	    blocks = utils.blocks,
		storage = utils.storage,
		cookies = utils.cookies,
		domx = utils.domx;
		envs = utils.envs,
		localStorage = utils.localStorage,
		logs = utils.logs;
		W = window,
		inited = false; 

	function init() {
		if (inited) {
			return W;
		}
		W.W = window; 
	    W.FUNC = {};	

		Object.defineProperty(W,"WH",{
			get : function() {
				return $(W).height();
			}
		});

		Object.defineProperty(W,"WW",{
			get : function() {
				return $(W).width();
			}

		});

		Object.defineProperty(W,"NOW",{
			get : function() {
				return langx.now();
			}

		});

		$.fn.scope = function() {

			if (!this.length) {
				return null; 
			}

			var data = this[0].$scopedata;
			if (data) {
				return data;
			}
			var el = this.closest('[' + ATTRSCOPE + ']');
			if (el.length) {
				data = el[0].$scopedata;
				if (data) {
					return data;
				}
			}
			return null;
		};	

		$.fn.vbindarray = function() {
			return domx.findinstance(this, '$vbindarray');
		};

		$.fn.vbind = function() {
			return domx.findinstance(this, '$vbind');
		};
		

		var gv = new views.View(document.body,{
				store : new stores.Store({
								data : W
							})
			}),
			gs = gv.storing,
			gh = gv.helper,
			gm = gv.componenter,
			gl = gv.compiler,
			ge = gv.eventer,
			gt = gv.http,
			gb = gv.binding,
			gp=  gv.plugins;

		gv.start();
		$.components = gv.components;

		langx.mixin(W, {
			isPRIVATEMODE : false,
			isMOBILE : /Mobi/.test(navigator.userAgent),
			isROBOT : navigator.userAgent ? (/search|agent|bot|crawler|spider/i).test(navigator.userAgent) : true,
			isSTANDALONE : navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
			isTOUCH : !!('ontouchstart' in window || navigator.maxTouchPoints)
		}); // W.MAIN = W.M = W.jC = W.COM = M = {};

		//jc
		
		langx.each({
			"MONTHS" : "months",
			"DAYS" : "days"
		},function(name1,name2){
			Object.defineProperty(W, name1, {
			    get() {
			      return Date[name2];
			    },
			    set(value) {
			    	Date[name2] = value;
			    }
			});	
		});
		

		// langx
		langx.mixin(W,{
			AJAXCONFIG: gt.configure,
			//AJAX: gt.ajax,
			AJAXCACHE: gt.ajaxCache,
			AJAXCACHEREVIEW: gt.ajaxCacheReview,

			clearTimeout2: langx.clearTimeout2,
			CACHE : storage,
			CLEARCACHE : storage.clear,
			CLEARSCHEDULE : schedulers.clear,
			CLONE: langx.clone,
			ENV: envs.variant,
			COOKIES : cookies,
			COPY : langx.copy,
			CSS : domx.style,

			DEF : {},

			EMPTYARRAY : langx.empties.array,
			EMPTYOBJECT : langx.empties.object,

			GUID: langx.guid,
			HASH: langx.hashCode,

			LCOMPARER : langx.localCompare,
			IMPORTCACHE: gt.importCache,
			IMPORT: gt.import,

			MAKEPARAMS: gt.makeParams,
			MEDIAQUERY : domx.watchMedia,

			NOOP : langx.empties.fn,

			PING: gt.ping,

			READPARAMS: gt.parseQuery,
			REMOVECACHE : storage.remove,

			PARSE: langx.parse,

			setTimeout2 : langx.setTimeout2,
			SCHEDULE : schedulers.schedule,	
			SCROLLBARWIDTH : domx.scrollbarWidth,
			SINGLETON: langx.singleton,
			STRINGIFY: langx.stringify,
			STYLE: domx.style,

			UPLOAD: gt.upload,
			UPTODATE: gt.uptodate,

			WAIT : gs.wait,

			WARN : logs.warn,

			WIDTH : domx.mediaWidth,
			

			FN : langx.arrowFn
		});



		//W.SCHEMA = function(name, declaration) {
		//	return M.schema(name, declaration);
		//};

		// plugins
		langx.mixin(W,{
			PLUGIN : gp.register,
			PLUGINS : gp.registry
		});

		W.ADD = gv.add;

		W.AJAX = function(url, data, callback, timeout) {
			if (langx.isFunction(url) ) {
				timeout = callback;
				callback = data;
				data = url;
				url = location.pathname;
			}

		    if (!callback && (langx.isFunction(data) || langx.isString(data))) {
		        timeout = callback;
		        callback = data;
		        data = undefined;
		    }

			
			if (langx.isString(callback)) {
				var path = callback;
				callback = function(output) {
					return gs.remap(path,output);
				};
			}

			return gt.ajax(url,data,callback,timeout);

		};

		W.BIND = function(path) {
			return gs.bind(path);
		};

		W.BLOCKED  = blocks.blocked;
		
		W.CACHEPATH = function (path, expire, rebind) { 
			return gs.cache(path, expire, rebind) ;
		};

		W.CAN = function() {
			return gs.can.apply(gs,arguments);
		};
		W.CHANGE = function (path, value) {
			return gs.change(path.value);
		};

		W.CHANGED = function(path) {
			return gs.change(path);
		};

		W.COMPILE = function(container) {
			clearTimeout($recompile);
			return gl.compile(container);
		};

		W.COMPONENT = components.register;

		W.COMPONENT_CONFIG = components.configer;

		W.COMPONENT_EXTEND = components.extend;

		W.CREATE = function(path) {
			return gs.create(path);
		}


	   /**
	   * Sets default values for all declared components listen on the path.
	   * All components need to have declared data-jc-value="VALUE" attribute. 
	   * @param  {String} path 
	   * @param  {Number} delay Optional, default: 0 
	   * @param  {Boolean} reset Optional, default: true
	   */
		W.DEFAULT = function (path, timeout, reset) { //
			var arr = path.split(/_{2,}/);
			if (arr.length > 1) {
				var def = arr[1];
				path = arr[0];
				var index = path.indexOf('.*');
				if (index !== -1)　{
					path = path.substring(0, index);
				}
				SET(path, new Function('return ' + def)(), timeout > 10 ? timeout : 3, timeout > 10 ? 3 : null);
			}
			return gs.default(arr[0], timeout, null, reset);
		}

		W.DISABLED = function() {
			return gs.disabled.apply(gs,arguments);
		};

		W.EMIT = function(name) {
			return ge.emit.apply(ge,arguments);
		};

		W.ERRORS =	function errors(path, except, highlight) { // 
		
			return gs.errors(path,except,highlight);
		};

		W.EXEC = function(path) {
			return gs.exec.apply(gs,arguments);
		};

	   /**
	   * Pushs a new item into the Array according to the path.
	   * @param  {String} path 
	   * @param  {Object|Array} value.
	   * @param  {String/Number} timeout  Optional, "value > 10" will be used as delay
	   * @param {Boolean} reset Optional
	   */
		W.EXTEND = function extend(path, value, timeout, reset) {
			var t = typeof(timeout);
			if (t === 'boolean') {
				return gs.extend(path, value, timeout);
			}
			if (!timeout || timeout < 10 || t !== 'number') {
				return gs.extend(path, value, timeout);
			}
			setTimeout(function() {
				gs.extend(path, value, reset);
			}, timeout);
			return W; 
		}

	   /**
	   * Extends a path by adding/rewrite new fields with new values and performs CHANGE().
	   * @param  {String} path 
	   * @param  {Object} value 
	   * @param {String|Number} type  Optional, "value > 10" will be used as timeout
	   */
		W.EXTEND2 = function (path, value, type) {
			W.EXTEND(path, value, type);
			CHANGE(path);
			return W;
		}

		W.EVALUATE = function (path, expression, nopath) { 
			return gs.evaluate(path, expression, nopath);
		};


		W.FIND = function (value, many, noCache, callback) {  
			return gm.find(value, many, noCache, callback);
		};

		W.FREE = function(timeout) {
			langx.setTimeout2('$clean', cleaner, timeout || 10);
			return W;
		};

	   /**
	   * Reads a value according to the path.
	   * @param  {String} path 
	   */
		W.GET = function (path, scope) {
			path = gb.pathmaker(path);
			if (scope === true) {
				scope = null;
				RESET(path, true);
			}
			return gs.get(path, scope); 
		}

	   /**
	   * Reads value and resets all components according to the path.
	   * @param  {String} path 
	   */
		W.GETR = function getr(path) { 
			return GET(path, true);
		}

	   /**
	   * Pushs a new item into the Array according to the path.
	   * @param  {String} path 
	   * @param  {Object|Array} value.
	   * @param  {String/Number} timeout  Optional, "value > 10" will be used as delay
	   * @param {Boolean} reset Optional
	   */
		W.INC = function (path, value, timeout, reset) {

			if (value == null) {
				value = 1;
			}

			var t = typeof(timeout);
			if (t === 'boolean') {
				return gs.inc(path, value, timeout);
			}
			if (!timeout || timeout < 10 || t !== 'number') {
				return gs.inc(path, value, timeout);
			}
			setTimeout(function() {
				gs.inc(path, value, reset);
			}, timeout);
			return W;
		}

	  /**
	   * Extends a path by adding/rewrite new fields with new values and performs CHANGE().
	   * @param  {String} path 
	   * @param  {Object} value 
	   * @param {String|Number} type  Optional, "value > 10" will be used as timeout
	   */
		W.INC2 = function (path, value, type) {
			INC(path, value, type);
			CHANGE(path);
			return W;
		};	

		W.LASTMODIFICATION = W.USAGE = function (name, expire, path, callback) {
			return gm.usage(name,expire,path,callback);
		};

		W.MAKE = function (obj, fn, update) {
			return gs.make(obj,fn,update);
		};

		W.MODIFIED = function(path) {
			return gs.modified(path);
		};

		W.NOTMODIFIED = function(path, value, fields) {

		};	

	   /**
	   * Performs SET() and CHANGE() together.
	   * @param  {String} path 
	   * @param  {Object|Array} value.
	   * @param  {String/Number} timeout  Optional, "value > 10" will be used as delay
	   * @param {Boolean} reset Optional
	   */
		W.MODIFY =function (path, value, timeout) {
			gs.modify(path,value,timeout);
			return W;
		};

		W.NOTIFY = function() {
			gm.notify.apply(gm,arguments);
			return W;
		};

		W.OFF = function(name, path, fn) {
			return ge.off(name,path,fn);
		};	

		W.ON = function(name, path, fn, init, context) {
			return ge.on(name,path,fn,init,context);
		};
	   /**
	    * creates an object with more readable properties.
	    * @param  {String} obj  
	    * @param  {Function} fn A maker
	    */
		W.OPT = function(obj, fn) {
			if (langx.isFunction(obj)) {
				fn = obj;
				obj = {};
			}
			fn.call(obj, function(path, value) {
				return gs.set2(obj, path, value);
			});
			return obj;
		};


	   /**
	   * Pushs a new item into the Array according to the path.
	   * @param  {String} path 
	   * @param  {Object|Array} value.
	   * @param  {String/Number} timeout  Optional, "value > 10" will be used as delay
	   * @param {Boolean} reset Optional
	   */
		W.PUSH =  function (path, value, timeout, reset) {
			var t = typeof(timeout);
			if (t === 'boolean') {
				return gs.push(path, value, timeout);
			}
			if (!timeout || timeout < 10 || t !== 'number') {
				return gs.push(path, value, timeout);
			}
			setTimeout(function() {
				gs.push(path, value, reset);
			}, timeout);
			return W;
		};

	   /**
	   * Extends a path by adding/rewrite new fields with new values and performs CHANGE().
	   * @param  {String} path 
	   * @param  {Object} value 
	   * @param {String|Number} type  Optional, "value > 10" will be used as timeout
	   */
		W.PUSH2 = function (path, value, type) {
			PUSH(path, value, type);
			CHANGE(path);
			return W;
		};


		var $recompile;

		W.RECOMPILE = function () { 
			$recompile && clearTimeout($recompile);
			$recompile = setTimeout(function() {
				COMPILE();
				$recompile = null;
			}, 700);
		};

		W.REMOVECACHE = storage.remove;

		W.RESET = function(path, timeout, onlyComponent) {
			return gs.reset(path,timeout,onlyComponent);
		};

		W.REWRITE =	function (path, value, type) {
			return gs.rewrite(path,value,type);
		};

	   /**
	   * Sets a new value according to the path..
	   * @param  {String} path 
	   * @param  {Object} value.
	   * @param  {String/Number} timeout  Optional, value > 10 will be used as delay
	   * @param {Boolean} reset Optional  default: false
	   */
		W.SET = function (path, value, timeout, reset) { 
			var t = typeof(timeout);
			if (t === 'boolean') {
				return gs.setx(path, value, timeout);
			}
			if (!timeout || timeout < 10 || t !== 'number') {
				return gs.setx(path, value, timeout);
			}
			setTimeout(function() {
				gs.setx(path, value, reset);
			}, timeout);
			return W;
		};

		W.SEEX = function(path, a, b, c, d) {
			if (path.indexOf('.') === -1)
				EXEC(path, a, b, c, d);
			else
				SET(path, a);
		};
	
	   /**
	   * Sets a new value according to the path and performs CHANGE() for all components 
	   * which are listening on the path.
	   * @param  {String} path 
	   * @param  {Object} value.
	   * @param  {String/Number} type  Optional, value > 10 will be used as delay
	   */
		W.SET2 = function (path, value, type) { 
			SET(path, value, type); 
			CHANGE(path);
			return W;
		};

	   /**
	   * Sets a new value according to the path and resets the state. 
	   * @param  {String} path 
	   * @param  {Object} value.
	   * @param  {String/Number} type  Optional, value > 10 will be used as delay
	   */
		W.SETR = function (path, value, type) {
			gs.setx(path, value, type);
			RESET(path); 
			return W;
		};


		W.SETTER = function () {  
			return gm.setter.apply(gm,arguments);
		};

		W.SKIP = function () { 
			return gs.skipInc.apply(gs,arguments);
		};

	   /**
	   * Performs toggle for the path. A value must be Boolean.
	   * @param  {String} path 
	   * @param  {String/Number} timeout  Optional, value > 10 will be used as delay
	   * @param {Boolean} reset Optional  default: false
	   */
		W.TOGGLE = function toggle(path, timeout, reset) { 
			var v = GET(path); 
			SET(path, !v, timeout, reset); 
			return W;
		};

	   /**
	   * Performs toggle for the path and performs CHANGE() for all components which are listening on the path.
	   * A value must be Boolean.
	   * @param  {String} path 
	   * @param {String|Number} type  Optional, "value > 10" will be used as timeout
	   */
		W.TOGGLE2 = function (path, type) {
			TOGGLE(path, type);
			CHANGE(path);
			return W;
		};

		W.UNWATCH  = function (path, fn) { 
			return gs.unwatch(path, fn) ;
		};

		W.UPDATE = function (path, timeout, reset) {
			var t = typeof(timeout); 
			if (t === 'boolean') {
				return gs.update(path, timeout);
			}
			if (!timeout || timeout < 10 || t !== 'number') {
				return gs.update(path, reset, timeout);
			}
			setTimeout(function() {
				gs.update(path, reset);
			}, timeout);
		};

		W.UPDATE2 = function (path, type) {
			UPDATE(path, type);
			CHANGE(path); 
			return W; 
		};	

		W.UPTODATE =function uptodate(period, url, callback, condition) {   

			if (langx.isFunction(url)) {
				condition = callback;
				callback = url;
				url = '';
			}

			var dt = new Date().add(period);
			topic.on('knockknock', function() {
				if (dt > langx.now()) //W.NOW)
					return;
				if (!condition || !condition())
					return;
				var id = setTimeout(function() {
					var l = window.location;
					if (url)
						l.href = url.$env();
					else
						l.reload(true);
				}, 5000);
				callback && callback(id);
			});
		}


		W.VBIND = binding.vbind;

		W.VBINDARRAY = binding.vbindArray;

		W.VALIDATE = function(path, except) {
			return gm.validate(path,except);
		};

		W.VERSION = components.versions.set;

		W.WATCH	= function (path, fn, init) { // 
			return ge.watch(path, fn, init);
		};

		inited = true;
		return W;
	}

	return init;
});
define('skylark-totaljs-jcomponent/main',[
	"./jc",
	"./binding",
	"./components",
	"./langx",
	"./stores",
	"./utils",
	"./views",
	"./globals"
],function(jc){
	return jc;
});
define('skylark-totaljs-jcomponent', ['skylark-totaljs-jcomponent/main'], function (main) { return main; });

define('skylark-totaljs-jrouting/jR',[
	"skylark-langx/skylark"
],function(skylark){
	var JRFU = {};
	var jR = {
		LIMIT_HISTORY: 100,
		LIMIT_HISTORY_ERROR: 100,
		version: 'v3.0.0',
		cache: {},
		routes: [],
		history: [],
		errors: [],
		events: {},
		eventsOnce: {},
		global: {},
		query: {},
		params: [],
		middlewares: {},
		repository: {},
		url: '',
		model: null,
		isFirst: true,
		isReady: false,
		isRefresh: false,
		isModernBrowser: history.pushState ? true : false,
		hashtags: false,
		count: 0
	};

	if (!window.jR)
		window.jR = jR;

	if (!window.jRouting)
		window.jRouting = jR;

	if (!window.JRFU)
		window.JRFU = JRFU;

	jR.remove = function(url) {
		var self = this;
		var routes = [];
		for (var i = 0, length = self.routes.length; i < length; i++)
			self.routes[i].id !== url && routes.push(self.routes[i]);
		self.routes = routes;
		return self;
	};

	jR.on = function(name, fn) {
		var self = this;
		var e = self.events[name];
		if (e)
			e.push(fn);
		else
			self.events[name] = [fn];
		return self;
	};

	jR.once = function(name, fn) {
		var self = this;
		var e = self.eventsOnce[name];
		if (e)
			e.push(fn);
		else
			self.eventsOnce[name] = [fn];
		return self;
	};

	jR.emit = function(name) {

		var self = this;
		var events = self.events[name] || [];
		var eventsOnce = self.eventsOnce[name] || [];
		var length = events.length;
		var lengthOnce = eventsOnce.length;

		if (!length && !lengthOnce)
			return self;

		var params = [];
		var tmp = arguments.length;

		for (var i = 1; i < tmp; i++)
			params.push(arguments[i]);

		if (length > 0) {
			for (var i = 0; i < length; i++)
				events[i].apply(self, params);
		}

		if (lengthOnce) {
			for (var i = 0; i < length; i++)
				eventsOnce[i].apply(self, params);
			delete self.eventsOnce[name];
		}

	};

	jR.route = function(url, fn, middleware, init) {

		var tmp;

		if (fn instanceof Array) {
			var tmp = middleware;
			middleware = fn;
			fn = tmp;
		}

		if (typeof(middleware) === 'function') {
			tmp = init;
			init = middleware;
			middleware = tmp;
		}

		var priority = url.count('/') + (url.indexOf('*') === -1 ? 0 : 10);
		var route = jR._route(url.trim());
		var params = [];

		if (typeof(middleware) === 'string')
			middleware = middleware.split(',');

		var mid = [];
		var roles = [];
		var options = {};

		(middleware instanceof Array) && middleware.forEach(function(item) {
			if (typeof(item) === 'object')
				options = item;
			else if (item.substring(0, 1) === '@')
				roles.push(item.substring(1));
			else
				mid.push(item);
		});

		if (url.indexOf('{') !== -1) {
			priority -= 100;
			for (var i = 0; i < route.length; i++)
				route[i].substring(0, 1) === '{' && params.push(i);
			priority -= params.length;
		}

		jR.remove(url);
		jR.routes.push({ id: url, url: route, fn: fn, priority: priority, params: params, middleware: mid.length ? mid : null, init: init, count: 0, pending: false, options: options, roles: roles });
		jR.routes.sort(function(a, b) {
			return a.priority > b.priority ? -1 : a.priority < b.priority ? 1 :0;
		});

		return jR;
	};

	jR.middleware = function(name, fn) {
		var self = this;
		self.middlewares[name] = fn;
		return self;
	};

	jR.refresh = function() {
		var self = this;
		return self.location(self.url, true);
	};

	jR.reload = function() {
		return jR.refresh();
	};

	jR.async = function() {
		if (!window.jRoute || !window.jRoute.length)
			return;
		while (true) {
			var fn = window.jRoute.shift();
			if (!fn)
				break;
			fn();
		}
		jR.is404 && jR.location(jR.url);
	};

	jR._route = function(url) {

		if (url.charCodeAt(0) === 47)
			url = url.substring(1);

		if (url.charCodeAt(url.length - 1) === 47)
			url = url.substring(0, url.length - 1);

		var arr = url.split('/');
		if (arr.length === 1 && !arr[0])
			arr[0] = '/';

		return arr;
	};

	jR._route_param = function(routeUrl, route) {
		var arr = [];

		if (!route || !routeUrl)
			return arr;

		var length = route.params.length;
		if (length) {
			for (var i = 0; i < length; i++) {
				var value = routeUrl[route.params[i]];
				arr.push(value === '/' ? '' : value);
			}
		}

		return arr;
	};

	jR._route_compare = function(url, route) {

		var length = url.length;
		var skip = length === 1 && url[0] === '/';

		if (route.length !== length)
			return false;

		for (var i = 0; i < length; i++) {

			var value = route[i];
			if (!value)
				return false;

			if (!skip && value.charCodeAt(0) === 123)
				continue;

			if (value === '*')
				return true;

			if (url[i] !== value)
				return false;
		}

		return true;
	};

	jR.location = function(url, isRefresh) {

		if (!jR.isReady)
			return;

		var index = url.indexOf('?');
		if (index !== -1)
			url = url.substring(0, index);

		url = JRFU.prepareUrl(url);
		url = JRFU.path(url);

		var self = this;
		var path = self._route(url);
		var routes = [];
		var notfound = true;
		var raw = [];

		raw.push.apply(raw, path);

		for (var i = 0, length = path.length; i < length; i++)
			path[i] = path[i].toLowerCase();

		self.isRefresh = isRefresh || false;
		self.count++;

		if (!isRefresh && self.url.length && self.history[self.history.length - 1] !== self.url) {
			self.history.push(self.url);
			self.history.length > self.LIMIT_HISTORY && self.history.shift();
		}

		var length = self.routes.length;
		for (var i = 0; i < length; i++) {

			var route = self.routes[i];
			if (!self._route_compare(path, route.url))
				continue;

			if (route.url.indexOf('*') === -1)
				notfound = false;

			if (route.once && route.count > 0)
				continue;

			route.count++;
			routes.push(route);
			break;
		}

		var isError = false;
		var error = [];

		// cache old repository

		if (self.url.length)
			self.cache[self.url] = self.repository;

		self.url = url;
		self.repository = self.cache[url];

		if (!self.repository)
			self.repository = {};

		self._params();
		self.params = self._route_param(raw, route);
		self.is404 = false;
		self.emit('location', url);
		length = routes.length;

		for (var i = 0; i < length; i++) {
			var route = routes[i];

			if (route.pending)
				continue;

			if (!route.middleware || !route.middleware.length) {
				if (!route.init) {
					route.fn.apply(self, self.params);
					continue;
				}

				route.pending = true;

				(function(route) {
					route.init(function() {
						route.fn.apply(self, self.params);
						route.pending = false;
					});
				})(route);

				route.init = null;
				continue;
			}

			(function(route) {

				var l = route.middleware.length;
				var middleware = [];

				for (var j = 0; j < l; j++) {
					var fn = jR.middlewares[route.middleware[j]];
					fn && (function(route, fn) {
						middleware.push(function(next) {
							fn.call(jR, next, route.options, route.roles, route);
						});
					})(route, fn);
				}

				if (!route.init) {
					route.pending = true;
					middleware.middleware(function(err) {
						!err && route.fn.apply(jR, jR.params);
						route.pending = false;
					}, route);
					return;
				}

				route.pending = true;
				route.init(function() {
					middleware.middleware(function(err) {
						!err && route.fn.apply(jR, jR.params);
						route.pending = false;
					}, route);
				});

				route.init = null;
			})(route);
		}

		isError && self.status(500, error);
		self.is404 = true;
		notfound && self.status(404, new Error('Route not found.'));
	};

	jR.prev = function() {
		return this.history[this.history.length - 1];
	};

	jR.back = function() {
		var self = this;
		var url = self.history.pop() || '/';
		self.url = '';
		self.redirect(url, true);
		return self;
	};

	jR.status = function(code, message) {
		var self = this;
		self.emit('status', code || 404, message);
		return self;
	};

	jR.redirect = function(url, model) {
		var self = this;

		if (url.charCodeAt(0) === 35) {
			location.hash = url;
			self.model = model || null;
			self.location(url, false);
			return self;
		}

		if (!self.isModernBrowser) {
			location.href = url;
			return false;
		}

		history.pushState(null, null, url);
		self.model = model || null;
		self.location(url, false);
		return self;
	};

	jR._params = function() {

		var self = this;
		var data = {};

		var params = location.href.slice(location.href.indexOf('?') + 1).split('&');

		for (var i = 0; i < params.length; i++) {

			var param = params[i].split('=');
			if (param.length !== 2)
				continue;

			var name = decodeURIComponent(param[0]);
			var value = decodeURIComponent(param[1]);
			var isArray = data[name] instanceof Array;

			if (data[name] && !isArray)
				data[name] = [data[name]];

			if (isArray)
				data[name].push(value);
			else
				data[name] = value;
		}

		self.query = data;
		return self;
	};

	jR.path = JRFU.path = function (url, d) {

		if (url.substring(0, 1) === '#')
			return url;

		if (!d)
			d = '/';

		var index = url.indexOf('?');
		var params = '';

		if (index !== -1) {
			params = url.substring(index);
			url = url.substring(0, index);
		}

		var l = url.length;
		var c = url.substring(l - 1, l);
		if (c !== d)
			url += d;

		return url + params;
	};

	JRFU.prepareUrl = function(url) {
		if (url.substring(0, 1) === '#')
			return url;
		var index = url.indexOf('#');
		return index !== -1 ? url.substring(0, index) : url;
	};

	if (!Array.prototype.middleware) {
		Array.prototype.middleware = function(callback, route) {

			var self = this;
			var item = self.shift();

			if (item === undefined) {
				callback && callback();
				return self;
			}

			item(function(err) {
				if (err instanceof Error || err === false)
					callback && callback(err === false ? true : err);
				else setTimeout(function() {
					self.middleware(callback, route);
				}, 1);
			}, route.options, route.roles);

			return self;
		};
	}

	if (!String.prototype.count) {
		String.prototype.count = function(text) {
			var index = 0;
			var count = 0;
			do {
				index = this.indexOf(text, index + text.length);
				if (index > 0)
					count++;
			} while (index > 0);
			return count;
		};
	}

	jR.on('error', function (err, url, name) {
		var self = this;
		self.errors.push({ error: err, url: url, name: name, date: new Date() });
		self.errors.length > self.LIMIT_HISTORY_ERROR && self.errors.shift();
	});

	jR.clientside = function(selector) {
		$(document).on('click', selector, function(e) {
			e.preventDefault();
			var el = $(this);
			jR.redirect(el.attr('href') || el.attr('data-jrouting') || el.attr('data-jr'));
		});
		return jR;
	};

	return skylark.attach("intg.totaljs.jR",jR);

});




define('skylark-totaljs-jrouting/globals',[
	"skylark-domx-query",
	"./jR"
],function($,tangular){
	return function() {
		var W = window;

		W.jR = jR;
		
		W.ROUTE = function(url, fn, middleware, init) {
			return jR.route(url, fn, middleware, init);
		};	

		setTimeout(jR.async, 500);
		setTimeout(jR.async, 1000);
		setTimeout(jR.async, 2000);
		setTimeout(jR.async, 3000);
		setTimeout(jR.async, 5000);

		function jRinit() {
			jR.async();
			$.fn.jRouting = function(g) {

				if (jR.hashtags || !jR.isModernBrowser)
					return this;

				var version = +$.fn.jquery.replace(/\./g, '');
				if (version >= 300 && g === true)
					throw Error('$(selector).jRouting() doesn\'t work in jQuery +3. Instead of this use jR.clientside(selector).');

				var handler = function(e) {
					e.preventDefault();
					jR.redirect($(this).attr('href'));
				};

				if (g)
					$(document).on('click', this.selector, handler);
				else
					this.filter('a').bind('click', handler);

				return this;
			};

			$(function() {

				jR.async();

				if (jR.hashtags)
					jR.url = location.hash || JRFU.path(JRFU.prepareUrl(location.pathname));
				else
					jR.url = JRFU.path(JRFU.prepareUrl(location.pathname));

				if (jR.events.ready) {
					jR.emit('ready', jR.url);
					jR.emit('load', jR.url);
				} else {
					setTimeout(function() {
						jR.isReady = true;
						jR.location(jR.url);
						jR.emit('ready', jR.url);
						jR.emit('load', jR.url);
					}, 5);
				}

				$(window).on('hashchange', function() {
					if (!jR.isReady || !jR.hashtags)
						return;
					jR.location(JRFU.path(location.hash));
				});

				$(window).on('popstate', function() {
					if (!jR.isReady || jR.hashtags)
						return;
					var url = JRFU.path(location.pathname);
					jR.url !== url && jR.location(url);
				});
			});
		}

		jRinit();


		return W;
	};
x});

define('skylark-totaljs-jrouting/main',[
	"./jR",
	"./globals"
],function(jR){

	return jR;
});
define('skylark-totaljs-jrouting', ['skylark-totaljs-jrouting/main'], function (main) { return main; });

define('skylark-tangular/tangular',[
	"skylark-langx/skylark"
],function(skylark){
	var tangular = skylark.attach("intg.totaljs.tangular",{}); 
	var Thelpers = tangular.helpers = {};
	tangular.version = 'v3.0.1';
	tangular.cache = {};
	tangular.debug = false;

	tangular.toArray = function(obj) {
		var keys = Object.keys(obj);
		var arr = [];
		for (var i = 0, length = keys.length; i < length; i++)
			arr.push({ key: keys[i], value: obj[keys[i]] });
		return arr;
	};

	return tangular;
});


define('skylark-tangular/Template',[
	"./tangular"
],function(tangular){

	var SKIP = { 'null': true, 'undefined': true, 'true': true, 'false': true };
	var REG_VARIABLES = /&&|\|\|/;
	var REG_KEY = /[a-z0-9._]+/gi;
	var REG_KEYCLEAN = /^[a-z0-9_$]+/i;
	var REG_NUM = /^[0-9]/;
	var REG_STRING = /'.*?'|".?"/g;
	var REG_CMDFIND = /\{\{.*?\}\}/g;
	var REG_CMDCLEAN = /\{\{|\}\}/g;
	var REG_TRIM = /\n$/g;

	function Template() {
		this.commands;
		this.variables;
		this.builder;
		this.split = '\0';
	}


	Template.prototype.compile = function(template) {

		var self = this;
		var ifcount = 0;
		var loopcount = 0;
		var tmp;
		var loops = [];

		self.variables = {};
		self.commands = [];

		self.builder = template.replace(REG_CMDFIND, function(text) {

			var cmd = text.replace(REG_CMDCLEAN, '').trim();
			var variable = null;
			var helpers = null;
			var index;
			var isif = false;
			var isloop = false;
			var iscode = true;

			if (cmd === 'fi') {
				ifcount--;
				// end of condition
			} else if (cmd === 'end') {
				loopcount--;
				// end of loop
				loops.pop();
			} else if (cmd.substring(0, 3) === 'if ') {
				ifcount++;
				// condition
				variable = self.parseVariables(cmd.substring(3), loops);
				if (variable.length) {
					for (var i = 0; i < variable.length; i++) {
						var name = variable[i];
						if (self.variables[name])
							self.variables[name]++;
						else
							self.variables[name] = 1;
					}
				} else
					variable = null;
				isif = true;
				iscode = true;
			} else if (cmd.substring(0, 8) === 'foreach ') {

				loopcount++;
				// loop

				tmp = cmd.substring(8).split(' ');
				loops.push(tmp[0].trim());

				index = tmp[2].indexOf('.');
				if (index !== -1)
					tmp[2] = tmp[2].substring(0, index);

				variable = tmp[2].trim();

				if (loops.indexOf(variable) === -1) {
					if (self.variables[variable])
						self.variables[variable]++;
					else
						self.variables[variable] = 1;
					variable = [variable];
				}
				else
					variable = null;

				isloop = true;
			} else if (cmd.substring(0, 8) === 'else if ') {
				// else if
				variable = self.parseVariables(cmd.substring(8), loops);
				if (variable.length) {
					for (var i = 0; i < variable.length; i++) {
						var name = variable[i];
						if (self.variables[name])
							self.variables[name]++;
						else
							self.variables[name] = 1;
					}
				} else
					variable = null;
				isif = true;
			} else if (cmd !== 'continue' && cmd !== 'break' && cmd !== 'else') {


				variable = cmd ? cmd.match(REG_KEYCLEAN) : null;

				if (variable)
					variable = variable.toString();

				if (variable && SKIP[variable])
					variable = null;

				if (variable && loops.indexOf(variable) === -1) {
					if (self.variables[variable])
						self.variables[variable]++;
					else
						self.variables[variable] = 1;

					variable = [variable];
				} else
					variable = null;

				if (cmd.indexOf('|') === -1)
					cmd += ' | encode';

				helpers = cmd.split('|');
				cmd = helpers[0];
				helpers = helpers.slice(1);
				if (helpers.length) {
					for (var i = 0; i < helpers.length; i++) {
						var helper = helpers[i].trim();
						index = helper.indexOf('(');
						if (index === -1) {
							helper = 'Thelpers.$execute(model,\'' + helper + '\',\7)';
						} else
							helper = 'Thelpers.$execute(model,\'' + helper.substring(0, index) + '\',\7,' + helper.substring(index + 1);
						helpers[i] = helper;
					}
				} else
					helpers = null;

				cmd = self.safe(cmd.trim() || 'model');
				iscode = false;
			}

			self.commands.push({ index: self.commands.length, cmd: cmd, ifcount: ifcount, loopcount: loopcount, variable: variable, helpers: helpers, isloop: isloop, isif: isif, iscode: iscode });
			return self.split;

		}).split(self.split);


		for (var i = 0, length = self.builder.length; i < length; i++)
			self.builder[i] = self.builder[i].replace(REG_TRIM, '');

		return self.make();
	};

	Template.prototype.parseVariables = function(condition, skip) {

		var variables = [];
		var arr = condition.split(REG_VARIABLES);
		for (var i = 0, length = arr.length; i < length; i++) {

			var key = arr[i].replace(REG_STRING, '');
			var keys = key.match(REG_KEY);

			for (var j = 0; j < keys.length; j++) {
				key = keys[j];
				key = key.split('.')[0];
				if (!key || (REG_NUM).test(key) || SKIP[key])
					continue;
				variables.indexOf(key) === -1 && skip.indexOf(key) === -1 && variables.push(key);
			}
		}
		return variables;
	};

	Template.prototype.safe = function(cmd) {

		var arr = cmd.split('.');
		var output = [];

		for (var i = 1; i < arr.length; i++) {
			var k = arr.slice(0, i).join('.');
			output.push(k + '==null?\'\':');
		}
		return output.join('') + arr.join('.');
	};

	Template.prototype.make = function() {

		var self = this;
		var builder = ['var $output=$text[0];var $tmp;var $index=0;'];

		for (var i = 0, length = self.commands.length; i < length; i++) {

			var cmd = self.commands[i];
			var tmp;

			i && builder.push('$output+=$text[' + i + '];');

			if (cmd.iscode) {

				if (cmd.isloop) {

					var name = '$i' + Math.random().toString(16).substring(3, 6);
					var namea = name + 'a';
					tmp = cmd.cmd.substring(cmd.cmd.lastIndexOf(' in ') + 4).trim();
					tmp = namea + '=' + self.safe(tmp) + ';if(!(' + namea + ' instanceof Array)){if(' + namea + '&&typeof(' + namea + ')===\'object\')' + namea + '=Tangular.toArray(' + namea + ')}if(' + namea + ' instanceof Array&&' + namea + '.length){for(var ' + name + '=0,' + name + 'l=' + namea + '.length;' + name + '<' + name + 'l;' + name + '++){$index=' + name + ';var ' + cmd.cmd.split(' ')[1] + '=' + namea + '[' + name + '];';
					builder.push(tmp);

				} else if (cmd.isif) {
					if (cmd.cmd.substring(0, 8) === 'else if ')
						builder.push('}' + cmd.cmd.substring(0, 8).trim() + '(' + cmd.cmd.substring(8).trim() + '){');
					else
						builder.push(cmd.cmd.substring(0, 3).trim() + '(' + cmd.cmd.substring(3).trim() + '){');
				} else {
					switch (cmd.cmd) {
						case 'else':
							builder.push('}else{');
							break;
						case 'end':
							builder.push('}}');
							break;
						case 'fi':
							builder.push('}');
							break;
						case 'break':
							builder.push('break;');
							break;
						case 'continue':
							builder.push('continue;');
							break;
					}
				}

			} else {
				if (cmd.helpers) {
					var str = '';
					for (var j = 0; j < cmd.helpers.length; j++) {
						var helper = cmd.helpers[j];
						if (j === 0)
							str = helper.replace('\7', cmd.cmd.trim()).trim();
						else
							str = helper.replace('\7', str.trim());
					}
					builder.push('$tmp=' + str + ';if($tmp!=null)$output+=$tmp;');
				} else
					builder.push('if(' + cmd.cmd + '!=null)$output+=' + cmd.cmd + ';');
			}
		}

		builder.push((length ? ('$output+=$text[' + length + '];') : '') + 'return $output;');

		delete self.variables.$;
		var variables = Object.keys(self.variables);
		var names = ['$ || {}', 'model'];

		for (var i = 0; i < variables.length; i++)
			names.push('model.' + variables[i]);

		var code = 'var tangular=function($,model' + (variables.length ? (',' + variables.join(',')) : '') + '){' + builder.join('') + '};return function(model,$){return tangular(' + names.join(',') + ');}';
		return (new Function('$text', code))(self.builder);
	};

	return Template	;

});
define('skylark-tangular/compile',[
	"./tangular",
	"./Template"
],function(tangular,Template){

	return tangular.compile = function(template) {
		return new Template().compile(template);
	};

});
define('skylark-tangular/helpers',[
	"./tangular"
],function(tangular){
	var helpers = {};

	var REG_ENCODE = /[<>&"]/g;


	helpers.$execute = function(model, name, a, b, c, d, e, f, g, h) {

		if (helpers[name] == null) {
			console && console.warn('Tangular: missing helper', '"' + name + '"');
			return a;
		}
		return helpers[name].call(model, a, b, c, d, e, f, g, h);
	};

	helpers.encode = function(value) {
		return value == null ? '' : value.toString().replace(REG_ENCODE, function(c) {
			switch (c) {
				case '&': return '&amp;';
				case '<': return '&lt;';
				case '>': return '&gt;';
				case '"': return '&quot;';
			}
			return c;
		});
	};

	helpers.raw = function(value) {
		return value;
	};

	return tangular.helpers = helpers;
});
define('skylark-tangular/register',[
	"./tangular",
	"./helpers"
],function(tangular,helpers){

	return tangular.register = function(name, fn) {
		helpers[name] = fn;
		return this;
	};
});
define('skylark-tangular/render',[
	"./tangular",
	"./Template"
],function(tangular,Template){

	return tangular.render = function(template, model, repository) {
		if (model == null)
			model = {};
		return new Template().compile(template)(model, repository);
	};

});
define('skylark-tangular/main',[
	"./tangular",
	"./compile",
	"./helpers",
	"./register",
	"./render",
	"./Template"
],function(tangular){

	return tangular;
});
define('skylark-tangular', ['skylark-tangular/main'], function (main) { return main; });

define('skylark-tangular/globals',[
	"./tangular",
	"./helpers"
],function(tangular){
	function init() {
		var W = window;
		W.Ta = W.Tangular = tangular;
		W.Thelpers = tangular.helpers;		
	}
	return init;
});
define('skylark-totaljs-spa/main',[
	"skylark-langx/skylark",
    "skylark-jquery",
	"skylark-totaljs-jcomponent",
	"skylark-totaljs-jrouting",
	"skylark-tangular",
	"skylark-totaljs-jcomponent/globals",
	"skylark-totaljs-jrouting/globals",
	"skylark-tangular/globals"
],function(skylark,$,jc,jr,tangular,g1,g2,g3){
	var spa = skylark.attach("intg.totaljs.spa",{});

	g1();
	g2();
	g3();


  $(function(){
      COMPILE();
  })
  	
	return spa;
});
define('skylark-totaljs-spa', ['skylark-totaljs-spa/main'], function (main) { return main; });


},this);