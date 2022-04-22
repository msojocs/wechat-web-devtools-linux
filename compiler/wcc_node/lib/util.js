// Built by eustia.
/* eslint-disable */

var _ = {};

/* ------------------------------ has ------------------------------ */

var has = _.has = (function (exports) {
    /* Checks if key is a direct property.
     *
     * |Name  |Desc                            |
     * |------|--------------------------------|
     * |obj   |Object to query                 |
     * |key   |Path to check                   |
     * |return|True if key is a direct property|
     */

    /* example
     * has({ one: 1 }, 'one'); // -> true
     */

    /* typescript
     * export declare function has(obj: {}, key: string): boolean;
     */
    var hasOwnProp = Object.prototype.hasOwnProperty;

    exports = function(obj, key) {
        return hasOwnProp.call(obj, key);
    };

    return exports;
})({});

/* ------------------------------ isUndef ------------------------------ */

var isUndef = _.isUndef = (function (exports) {
    /* Check if value is undefined.
     *
     * |Name  |Desc                      |
     * |------|--------------------------|
     * |val   |Value to check            |
     * |return|True if value is undefined|
     */

    /* example
     * isUndef(void 0); // -> true
     * isUndef(null); // -> false
     */

    /* typescript
     * export declare function isUndef(val: any): boolean;
     */
    exports = function(val) {
        return val === void 0;
    };

    return exports;
})({});

/* ------------------------------ types ------------------------------ */

var types = _.types = (function (exports) {
    /* Used for typescript definitions only.
     */

    /* typescript
     * export declare namespace types {
     *     interface Collection<T> {}
     *     interface List<T> extends Collection<T> {
     *         [index: number]: T;
     *         length: number;
     *     }
     *     interface ListIterator<T, TResult> {
     *         (value: T, index: number, list: List<T>): TResult;
     *     }
     *     interface Dictionary<T> extends Collection<T> {
     *         [index: string]: T;
     *     }
     *     interface ObjectIterator<T, TResult> {
     *         (element: T, key: string, list: Dictionary<T>): TResult;
     *     }
     *     interface MemoIterator<T, TResult> {
     *         (prev: TResult, curr: T, index: number, list: List<T>): TResult;
     *     }
     *     interface MemoObjectIterator<T, TResult> {
     *         (prev: TResult, curr: T, key: string, list: Dictionary<T>): TResult;
     *     }
     *     type Fn<T> = (...args: any[]) => T;
     *     type AnyFn = Fn<any>;
     *     type PlainObj<T> = { [name: string]: T };
     * }
     * export declare const types: {};
     */
    exports = {};

    return exports;
})({});

/* ------------------------------ keys ------------------------------ */

var keys = _.keys = (function (exports) {
    /* Create an array of the own enumerable property names of object.
     *
     * |Name  |Desc                   |
     * |------|-----------------------|
     * |obj   |Object to query        |
     * |return|Array of property names|
     */

    /* example
     * keys({ a: 1 }); // -> ['a']
     */

    /* typescript
     * export declare function keys(obj: any): string[];
     */

    /* dependencies
     * has 
     */

    if (Object.keys && !false) {
        exports = Object.keys;
    } else {
        exports = function(obj) {
            var ret = [];

            for (var key in obj) {
                if (has(obj, key)) ret.push(key);
            }

            return ret;
        };
    }

    return exports;
})({});

/* ------------------------------ optimizeCb ------------------------------ */

var optimizeCb = _.optimizeCb = (function (exports) {
    /* Used for function context binding.
     */

    /* typescript
     * export declare function optimizeCb(
     *     fn: types.AnyFn,
     *     ctx: any,
     *     argCount?: number
     * ): types.AnyFn;
     */

    /* dependencies
     * isUndef types 
     */

    exports = function(fn, ctx, argCount) {
        if (isUndef(ctx)) return fn;

        switch (argCount == null ? 3 : argCount) {
            case 1:
                return function(val) {
                    return fn.call(ctx, val);
                };

            case 3:
                return function(val, idx, collection) {
                    return fn.call(ctx, val, idx, collection);
                };

            case 4:
                return function(accumulator, val, idx, collection) {
                    return fn.call(ctx, accumulator, val, idx, collection);
                };
        }

        return function() {
            return fn.apply(ctx, arguments);
        };
    };

    return exports;
})({});

/* ------------------------------ identity ------------------------------ */

var identity = _.identity = (function (exports) {
    /* Return the first argument given.
     *
     * |Name  |Desc       |
     * |------|-----------|
     * |val   |Any value  |
     * |return|Given value|
     */

    /* example
     * identity('a'); // -> 'a'
     */

    /* typescript
     * export declare function identity<T>(val: T): T;
     */
    exports = function(val) {
        return val;
    };

    return exports;
})({});

/* ------------------------------ objToStr ------------------------------ */

var objToStr = _.objToStr = (function (exports) {
    /* Alias of Object.prototype.toString.
     *
     * |Name  |Desc                                |
     * |------|------------------------------------|
     * |val   |Source value                        |
     * |return|String representation of given value|
     */

    /* example
     * objToStr(5); // -> '[object Number]'
     */

    /* typescript
     * export declare function objToStr(val: any): string;
     */
    var ObjToStr = Object.prototype.toString;

    exports = function(val) {
        return ObjToStr.call(val);
    };

    return exports;
})({});

/* ------------------------------ isArr ------------------------------ */

var isArr = _.isArr = (function (exports) {
    /* Check if value is an `Array` object.
     *
     * |Name  |Desc                              |
     * |------|----------------------------------|
     * |val   |Value to check                    |
     * |return|True if value is an `Array` object|
     */

    /* example
     * isArr([]); // -> true
     * isArr({}); // -> false
     */

    /* typescript
     * export declare function isArr(val: any): boolean;
     */

    /* dependencies
     * objToStr 
     */

    if (Array.isArray && !false) {
        exports = Array.isArray;
    } else {
        exports = function(val) {
            return objToStr(val) === '[object Array]';
        };
    }

    return exports;
})({});

/* ------------------------------ castPath ------------------------------ */

var castPath = _.castPath = (function (exports) {
    /* Cast value into a property path array.
     *
     * |Name  |Desc               |
     * |------|-------------------|
     * |path  |Value to inspect   |
     * |obj   |Object to query    |
     * |return|Property path array|
     */

    /* example
     * castPath('a.b.c'); // -> ['a', 'b', 'c']
     * castPath(['a']); // -> ['a']
     * castPath('a[0].b'); // -> ['a', '0', 'b']
     * castPath('a.b.c', { 'a.b.c': true }); // -> ['a.b.c']
     */

    /* typescript
     * export declare function castPath(path: string | string[], obj?: any): string[];
     */

    /* dependencies
     * has isArr 
     */

    exports = function(str, obj) {
        if (isArr(str)) return str;
        if (obj && has(obj, str)) return [str];
        var ret = [];
        str.replace(regPropName, function(match, number, quote, str) {
            ret.push(quote ? str.replace(regEscapeChar, '$1') : number || match);
        });
        return ret;
    }; // Lodash _stringToPath

    var regPropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var regEscapeChar = /\\(\\)?/g;

    return exports;
})({});

/* ------------------------------ isNum ------------------------------ */

var isNum = _.isNum = (function (exports) {
    /* Check if value is classified as a Number primitive or object.
     *
     * |Name  |Desc                                 |
     * |------|-------------------------------------|
     * |val   |Value to check                       |
     * |return|True if value is correctly classified|
     */

    /* example
     * isNum(5); // -> true
     * isNum(5.1); // -> true
     * isNum({}); // -> false
     */

    /* typescript
     * export declare function isNum(val: any): boolean;
     */

    /* dependencies
     * objToStr 
     */

    exports = function(val) {
        return objToStr(val) === '[object Number]';
    };

    return exports;
})({});

/* ------------------------------ isFn ------------------------------ */

var isFn = _.isFn = (function (exports) {
    /* Check if value is a function.
     *
     * |Name  |Desc                       |
     * |------|---------------------------|
     * |val   |Value to check             |
     * |return|True if value is a function|
     *
     * Generator function is also classified as true.
     */

    /* example
     * isFn(function() {}); // -> true
     * isFn(function*() {}); // -> true
     * isFn(async function() {}); // -> true
     */

    /* typescript
     * export declare function isFn(val: any): boolean;
     */

    /* dependencies
     * objToStr 
     */

    exports = function(val) {
        var objStr = objToStr(val);
        return (
            objStr === '[object Function]' ||
            objStr === '[object GeneratorFunction]' ||
            objStr === '[object AsyncFunction]'
        );
    };

    return exports;
})({});

/* ------------------------------ isArrLike ------------------------------ */

var isArrLike = _.isArrLike = (function (exports) {
    /* Check if value is array-like.
     *
     * |Name  |Desc                       |
     * |------|---------------------------|
     * |val   |Value to check             |
     * |return|True if value is array like|
     *
     * Function returns false.
     */

    /* example
     * isArrLike('test'); // -> true
     * isArrLike(document.body.children); // -> true;
     * isArrLike([1, 2, 3]); // -> true
     */

    /* typescript
     * export declare function isArrLike(val: any): boolean;
     */

    /* dependencies
     * isNum isFn 
     */

    var MAX_ARR_IDX = Math.pow(2, 53) - 1;

    exports = function(val) {
        if (!val) return false;
        var len = val.length;
        return isNum(len) && len >= 0 && len <= MAX_ARR_IDX && !isFn(val);
    };

    return exports;
})({});

/* ------------------------------ each ------------------------------ */

var each = _.each = (function (exports) {
    /* Iterate over elements of collection and invokes iterator for each element.
     *
     * |Name    |Desc                          |
     * |--------|------------------------------|
     * |obj     |Collection to iterate over    |
     * |iterator|Function invoked per iteration|
     * |ctx     |Function context              |
     */

    /* example
     * each({ a: 1, b: 2 }, function(val, key) {});
     */

    /* typescript
     * export declare function each<T>(
     *     list: types.List<T>,
     *     iterator: types.ListIterator<T, void>,
     *     ctx?: any
     * ): types.List<T>;
     * export declare function each<T>(
     *     object: types.Dictionary<T>,
     *     iterator: types.ObjectIterator<T, void>,
     *     ctx?: any
     * ): types.Collection<T>;
     */

    /* dependencies
     * isArrLike keys optimizeCb types 
     */

    exports = function(obj, iterator, ctx) {
        iterator = optimizeCb(iterator, ctx);
        var i, len;

        if (isArrLike(obj)) {
            for (i = 0, len = obj.length; i < len; i++) {
                iterator(obj[i], i, obj);
            }
        } else {
            var _keys = keys(obj);

            for (i = 0, len = _keys.length; i < len; i++) {
                iterator(obj[_keys[i]], _keys[i], obj);
            }
        }

        return obj;
    };

    return exports;
})({});

/* ------------------------------ createAssigner ------------------------------ */

var createAssigner = _.createAssigner = (function (exports) {
    /* Used to create extend, extendOwn and defaults.
     *
     * |Name    |Desc                          |
     * |--------|------------------------------|
     * |keysFn  |Function to get object keys   |
     * |defaults|No override when set to true  |
     * |return  |Result function, extend...    |
     */

    /* typescript
     * export declare function createAssigner(
     *     keysFn: types.AnyFn,
     *     defaults: boolean
     * ): types.AnyFn;
     */

    /* dependencies
     * isUndef each types 
     */

    exports = function(keysFn, defaults) {
        return function(obj) {
            each(arguments, function(src, idx) {
                if (idx === 0) return;
                var keys = keysFn(src);
                each(keys, function(key) {
                    if (!defaults || isUndef(obj[key])) obj[key] = src[key];
                });
            });
            return obj;
        };
    };

    return exports;
})({});

/* ------------------------------ extendOwn ------------------------------ */

var extendOwn = _.extendOwn = (function (exports) {
    /* Like extend, but only copies own properties over to the destination object.
     *
     * |Name       |Desc              |
     * |-----------|------------------|
     * |destination|Destination object|
     * |...sources |Sources objects   |
     * |return     |Destination object|
     */

    /* example
     * extendOwn({ name: 'RedHood' }, { age: 24 }); // -> {name: 'RedHood', age: 24}
     */

    /* typescript
     * export declare function extendOwn(destination: any, ...sources: any[]): any;
     */

    /* dependencies
     * keys createAssigner 
     */

    exports = createAssigner(keys);

    return exports;
})({});

/* ------------------------------ isBrowser ------------------------------ */

var isBrowser = _.isBrowser = (function (exports) {
    /* Check if running in a browser.
     */

    /* example
     * console.log(isBrowser); // -> true if running in a browser
     */

    /* typescript
     * export declare const isBrowser: boolean;
     */
    exports =
        typeof window === 'object' &&
        typeof document === 'object' &&
        document.nodeType === 9;

    return exports;
})({});

/* ------------------------------ root ------------------------------ */

var root = _.root = (function (exports) {
    /* Root object reference, `global` in nodeJs, `window` in browser. */

    /* typescript
     * export declare const root: any;
     */

    /* dependencies
     * isBrowser 
     */

    exports = isBrowser ? window : global;

    return exports;
})({});

/* ------------------------------ isMatch ------------------------------ */

var isMatch = _.isMatch = (function (exports) {
    /* Check if keys and values in src are contained in obj.
     *
     * |Name  |Desc                              |
     * |------|----------------------------------|
     * |obj   |Object to inspect                 |
     * |src   |Object of property values to match|
     * |return|True if object is match           |
     */

    /* example
     * isMatch({ a: 1, b: 2 }, { a: 1 }); // -> true
     */

    /* typescript
     * export declare function isMatch(obj: any, src: any): boolean;
     */

    /* dependencies
     * keys 
     */

    exports = function(obj, src) {
        var _keys = keys(src);

        var len = _keys.length;
        if (obj == null) return !len;
        obj = Object(obj);

        for (var i = 0; i < len; i++) {
            var key = _keys[i];
            if (src[key] !== obj[key] || !(key in obj)) return false;
        }

        return true;
    };

    return exports;
})({});

/* ------------------------------ isObj ------------------------------ */

var isObj = _.isObj = (function (exports) {
    /* Check if value is the language type of Object.
     *
     * |Name  |Desc                      |
     * |------|--------------------------|
     * |val   |Value to check            |
     * |return|True if value is an object|
     *
     * [Language Spec](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
     */

    /* example
     * isObj({}); // -> true
     * isObj([]); // -> true
     */

    /* typescript
     * export declare function isObj(val: any): boolean;
     */
    exports = function(val) {
        var type = typeof val;
        return !!val && (type === 'function' || type === 'object');
    };

    return exports;
})({});

/* ------------------------------ isStr ------------------------------ */

var isStr = _.isStr = (function (exports) {
    /* Check if value is a string primitive.
     *
     * |Name  |Desc                               |
     * |------|-----------------------------------|
     * |val   |Value to check                     |
     * |return|True if value is a string primitive|
     */

    /* example
     * isStr('licia'); // -> true
     */

    /* typescript
     * export declare function isStr(val: any): boolean;
     */

    /* dependencies
     * objToStr 
     */

    exports = function(val) {
        return objToStr(val) === '[object String]';
    };

    return exports;
})({});

/* ------------------------------ matcher ------------------------------ */

var matcher = _.matcher = (function (exports) {
    /* Return a predicate function that checks if attrs are contained in an object.
     *
     * |Name  |Desc                              |
     * |------|----------------------------------|
     * |attrs |Object of property values to match|
     * |return|New predicate function            |
     */

    /* example
     * const filter = require('licia/filter');
     *
     * const objects = [
     *     { a: 1, b: 2, c: 3 },
     *     { a: 4, b: 5, c: 6 }
     * ];
     * filter(objects, matcher({ a: 4, c: 6 })); // -> [{a: 4, b: 5, c: 6}]
     */

    /* typescript
     * export declare function matcher(attrs: any): types.AnyFn;
     */

    /* dependencies
     * extendOwn isMatch types 
     */

    exports = function(attrs) {
        attrs = extendOwn({}, attrs);
        return function(obj) {
            return isMatch(obj, attrs);
        };
    };

    return exports;
})({});

/* ------------------------------ restArgs ------------------------------ */

var restArgs = _.restArgs = (function (exports) {
    /* This accumulates the arguments passed into an array, after a given index.
     *
     * |Name      |Desc                                   |
     * |----------|---------------------------------------|
     * |function  |Function that needs rest parameters    |
     * |startIndex|The start index to accumulates         |
     * |return    |Generated function with rest parameters|
     */

    /* example
     * const paramArr = restArgs(function(rest) {
     *     return rest;
     * });
     * paramArr(1, 2, 3, 4); // -> [1, 2, 3, 4]
     */

    /* typescript
     * export declare function restArgs(
     *     fn: types.AnyFn,
     *     startIndex?: number
     * ): types.AnyFn;
     */

    /* dependencies
     * types 
     */

    exports = function(fn, startIdx) {
        startIdx = startIdx == null ? fn.length - 1 : +startIdx;
        return function() {
            var len = Math.max(arguments.length - startIdx, 0);
            var rest = new Array(len);
            var i;

            for (i = 0; i < len; i++) {
                rest[i] = arguments[i + startIdx];
            } // Call runs faster than apply.

            switch (startIdx) {
                case 0:
                    return fn.call(this, rest);

                case 1:
                    return fn.call(this, arguments[0], rest);

                case 2:
                    return fn.call(this, arguments[0], arguments[1], rest);
            }

            var args = new Array(startIdx + 1);

            for (i = 0; i < startIdx; i++) {
                args[i] = arguments[i];
            }

            args[startIdx] = rest;
            return fn.apply(this, args);
        };
    };

    return exports;
})({});

/* ------------------------------ promisify ------------------------------ */

var promisify = _.promisify = (function (exports) {
    /* Convert callback based functions into Promises.
     *
     * |Name           |Desc                                  |
     * |---------------|--------------------------------------|
     * |fn             |Callback based function               |
     * |multiArgs=false|If callback has multiple success value|
     * |return         |Result function                       |
     *
     * If multiArgs is set to true, the resulting promise will always fulfill with an array of the callback's success values.
     */

    /* example
     * const fs = require('fs');
     *
     * const readFile = promisify(fs.readFile);
     * readFile('test.js', 'utf-8').then(function(data) {
     *     // Do something with file content.
     * });
     */

    /* typescript
     * export declare function promisify(
     *     fn: types.AnyFn,
     *     multiArgs?: boolean
     * ): types.AnyFn;
     */

    /* dependencies
     * restArgs root types 
     */

    exports = function(fn, multiArgs) {
        return restArgs(function(args) {
            return new root.Promise(function(resolve, reject) {
                args.push(
                    restArgs(function callback(err, values) {
                        if (err) return reject(err);
                        if (!multiArgs) return resolve(values[0]);
                        resolve(values);
                    })
                );
                fn.apply(this, args);
            });
        });
    };

    return exports;
})({});

/* ------------------------------ safeGet ------------------------------ */

var safeGet = _.safeGet = (function (exports) {
    /* Get object property, don't throw undefined error.
     *
     * |Name  |Desc                     |
     * |------|-------------------------|
     * |obj   |Object to query          |
     * |path  |Path of property to get  |
     * |return|Target value or undefined|
     */

    /* example
     * const obj = { a: { aa: { aaa: 1 } } };
     * safeGet(obj, 'a.aa.aaa'); // -> 1
     * safeGet(obj, ['a', 'aa']); // -> {aaa: 1}
     * safeGet(obj, 'a.b'); // -> undefined
     */

    /* typescript
     * export declare function safeGet(obj: any, path: string | string[]): any;
     */

    /* dependencies
     * isUndef castPath 
     */

    exports = function(obj, path) {
        path = castPath(path, obj);
        var prop;
        prop = path.shift();

        while (!isUndef(prop)) {
            obj = obj[prop];
            if (obj == null) return;
            prop = path.shift();
        }

        return obj;
    };

    return exports;
})({});

/* ------------------------------ property ------------------------------ */

var property = _.property = (function (exports) {
    /* Return a function that will itself return the key property of any passed-in object.
     *
     * |Name  |Desc                       |
     * |------|---------------------------|
     * |path  |Path of the property to get|
     * |return|New accessor function      |
     */

    /* example
     * const obj = { a: { b: 1 } };
     * property('a')(obj); // -> {b: 1}
     * property(['a', 'b'])(obj); // -> 1
     */

    /* typescript
     * export declare function property(path: string | string[]): types.AnyFn;
     */

    /* dependencies
     * isArr safeGet types 
     */

    exports = function(path) {
        if (!isArr(path)) return shallowProperty(path);
        return function(obj) {
            return safeGet(obj, path);
        };
    };

    function shallowProperty(key) {
        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    }

    return exports;
})({});

/* ------------------------------ safeCb ------------------------------ */

var safeCb = _.safeCb = (function (exports) {
    /* Create callback based on input value.
     */

    /* typescript
     * export declare function safeCb(
     *     val?: any,
     *     ctx?: any,
     *     argCount?: number
     * ): types.AnyFn;
     */

    /* dependencies
     * isFn isObj isArr optimizeCb matcher identity types property 
     */

    exports = function(val, ctx, argCount) {
        if (val == null) return identity;
        if (isFn(val)) return optimizeCb(val, ctx, argCount);
        if (isObj(val) && !isArr(val)) return matcher(val);
        return property(val);
    };

    return exports;
})({});

/* ------------------------------ map ------------------------------ */

var map = _.map = (function (exports) {
    /* Create an array of values by running each element in collection through iteratee.
     *
     * |Name    |Desc                          |
     * |--------|------------------------------|
     * |object  |Collection to iterate over    |
     * |iterator|Function invoked per iteration|
     * |context |Function context              |
     * |return  |New mapped array              |
     */

    /* example
     * map([4, 8], function(n) {
     *     return n * n;
     * }); // -> [16, 64]
     */

    /* typescript
     * export declare function map<T, TResult>(
     *     list: types.List<T>,
     *     iterator: types.ListIterator<T, TResult>,
     *     context?: any
     * ): TResult[];
     * export declare function map<T, TResult>(
     *     object: types.Dictionary<T>,
     *     iterator: types.ObjectIterator<T, TResult>,
     *     context?: any
     * ): TResult[];
     */

    /* dependencies
     * safeCb keys isArrLike types 
     */

    exports = function(obj, iterator, ctx) {
        iterator = safeCb(iterator, ctx);

        var _keys = !isArrLike(obj) && keys(obj);

        var len = (_keys || obj).length;
        var results = Array(len);

        for (var i = 0; i < len; i++) {
            var curKey = _keys ? _keys[i] : i;
            results[i] = iterator(obj[curKey], curKey, obj);
        }

        return results;
    };

    return exports;
})({});

/* ------------------------------ toArr ------------------------------ */

var toArr = _.toArr = (function (exports) {
    /* Convert value to an array.
     *
     * |Name  |Desc            |
     * |------|----------------|
     * |val   |Value to convert|
     * |return|Converted array |
     */

    /* example
     * toArr({ a: 1, b: 2 }); // -> [{a: 1, b: 2}]
     * toArr('abc'); // -> ['abc']
     * toArr(1); // -> [1]
     * toArr(null); // -> []
     */

    /* typescript
     * export declare function toArr(val: any): any[];
     */

    /* dependencies
     * isArrLike map isArr isStr 
     */

    exports = function(val) {
        if (!val) return [];
        if (isArr(val)) return val;
        if (isArrLike(val) && !isStr(val)) return map(val);
        return [val];
    };

    return exports;
})({});

/* ------------------------------ fs ------------------------------ */
_.fs = (function (exports) {
    /* Promised version of node.js fs module.
     */

    /* example
     * fs.readFile('test.js')
     *     .then(function(data) {
     *         // Do something
     *     })
     *     .catch(function(err) {
     *         // Handle errors
     *     });
     */

    /* typescript
     * export declare const fs: {
     *     readFile(path: string, encoding: string): Promise<string>;
     *     readFile(path: string): Promise<Buffer>;
     *     exists(path: string): Promise<boolean>;
     *     unlink(path: string): Promise<void>;
     *     writeFile(path: string, data: string, options?: string): Promise<void>;
     *     writeFile(path: string, data: Buffer): Promise<void>;
     *     readdir(path: string): Promise<string[]>;
     *     rmdir(path: string): Promise<void>;
     *     [key: string]: any;
     * };
     */

    /* dependencies
     * promisify root each toArr 
     */

    const fs = require('fs');

    each(
        [
            'access',
            'appendFile',
            'chmod',
            'chown',
            'close',
            'fchmod',
            'fchown',
            'fdatasync',
            'fstat',
            'fsync',
            'ftruncate',
            'futimes',
            'link',
            'lstat',
            'mkdir',
            'mkdtemp',
            'open',
            'read',
            'readFile',
            'readdir',
            'readlink',
            'realpath',
            'rename',
            'rmdir',
            'stat',
            'symlink',
            'truncate',
            'unlink',
            'utimes',
            'write',
            'writeFile'
        ],
        function(method) {
            exports[method] = promisify(fs[method]);
        }
    );

    exports.exists = function() {
        const args = toArr(arguments);

        return new root.Promise(function(resolve) {
            args.push(resolve);
            fs.exists.apply(null, args);
        });
    };

    return exports;
})({});

module.exports = _;