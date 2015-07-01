(function(global) {
  'use strict';
  if (global.$traceurRuntime) {
    return;
  }
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $Object.defineProperties;
  var $defineProperty = $Object.defineProperty;
  var $freeze = $Object.freeze;
  var $getOwnPropertyDescriptor = $Object.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $Object.getOwnPropertyNames;
  var $keys = $Object.keys;
  var $hasOwnProperty = $Object.prototype.hasOwnProperty;
  var $toString = $Object.prototype.toString;
  var $preventExtensions = Object.preventExtensions;
  var $seal = Object.seal;
  var $isExtensible = Object.isExtensible;
  var $apply = Function.prototype.call.bind(Function.prototype.apply);
  function $bind(operand, thisArg, args) {
    var argArray = [thisArg];
    for (var i = 0; i < args.length; i++) {
      argArray[i + 1] = args[i];
    }
    var func = $apply(Function.prototype.bind, operand, argArray);
    return func;
  }
  function $construct(func, argArray) {
    var object = new ($bind(func, null, argArray));
    return object;
  }
  var counter = 0;
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }
  var privateNames = $create(null);
  function isPrivateName(s) {
    return privateNames[s];
  }
  function createPrivateName() {
    var s = newUniqueString();
    privateNames[s] = true;
    return s;
  }
  var CONTINUATION_TYPE = Object.create(null);
  function createContinuation(operand, thisArg, argsArray) {
    return [CONTINUATION_TYPE, operand, thisArg, argsArray];
  }
  function isContinuation(object) {
    return object && object[0] === CONTINUATION_TYPE;
  }
  var isTailRecursiveName = null;
  function setupProperTailCalls() {
    isTailRecursiveName = createPrivateName();
    Function.prototype.call = initTailRecursiveFunction(function call(thisArg) {
      var result = tailCall(function(thisArg) {
        var argArray = [];
        for (var i = 1; i < arguments.length; ++i) {
          argArray[i - 1] = arguments[i];
        }
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
    Function.prototype.apply = initTailRecursiveFunction(function apply(thisArg, argArray) {
      var result = tailCall(function(thisArg, argArray) {
        var continuation = createContinuation(this, thisArg, argArray);
        return continuation;
      }, this, arguments);
      return result;
    });
  }
  function initTailRecursiveFunction(func) {
    if (isTailRecursiveName === null) {
      setupProperTailCalls();
    }
    func[isTailRecursiveName] = true;
    return func;
  }
  function isTailRecursive(func) {
    return !!func[isTailRecursiveName];
  }
  function tailCall(func, thisArg, argArray) {
    var continuation = argArray[0];
    if (isContinuation(continuation)) {
      continuation = $apply(func, thisArg, continuation[3]);
      return continuation;
    }
    continuation = createContinuation(func, thisArg, argArray);
    while (true) {
      if (isTailRecursive(func)) {
        continuation = $apply(func, continuation[2], [continuation]);
      } else {
        continuation = $apply(func, continuation[2], continuation[3]);
      }
      if (!isContinuation(continuation)) {
        return continuation;
      }
      func = continuation[1];
    }
  }
  function construct() {
    var object;
    if (isTailRecursive(this)) {
      object = $construct(this, [createContinuation(null, null, arguments)]);
    } else {
      object = $construct(this, arguments);
    }
    return object;
  }
  var $traceurRuntime = {
    initTailRecursiveFunction: initTailRecursiveFunction,
    call: tailCall,
    continuation: createContinuation,
    construct: construct
  };
  (function() {
    function nonEnum(value) {
      return {
        configurable: true,
        enumerable: false,
        value: value,
        writable: true
      };
    }
    var method = nonEnum;
    var symbolInternalProperty = newUniqueString();
    var symbolDescriptionProperty = newUniqueString();
    var symbolDataProperty = newUniqueString();
    var symbolValues = $create(null);
    function isShimSymbol(symbol) {
      return typeof symbol === 'object' && symbol instanceof SymbolValue;
    }
    function typeOf(v) {
      if (isShimSymbol(v))
        return 'symbol';
      return typeof v;
    }
    function Symbol(description) {
      var value = new SymbolValue(description);
      if (!(this instanceof Symbol))
        return value;
      throw new TypeError('Symbol cannot be new\'ed');
    }
    $defineProperty(Symbol.prototype, 'constructor', nonEnum(Symbol));
    $defineProperty(Symbol.prototype, 'toString', method(function() {
      var symbolValue = this[symbolDataProperty];
      return symbolValue[symbolInternalProperty];
    }));
    $defineProperty(Symbol.prototype, 'valueOf', method(function() {
      var symbolValue = this[symbolDataProperty];
      if (!symbolValue)
        throw TypeError('Conversion from symbol to string');
      if (!getOption('symbols'))
        return symbolValue[symbolInternalProperty];
      return symbolValue;
    }));
    function SymbolValue(description) {
      var key = newUniqueString();
      $defineProperty(this, symbolDataProperty, {value: this});
      $defineProperty(this, symbolInternalProperty, {value: key});
      $defineProperty(this, symbolDescriptionProperty, {value: description});
      freeze(this);
      symbolValues[key] = this;
    }
    $defineProperty(SymbolValue.prototype, 'constructor', nonEnum(Symbol));
    $defineProperty(SymbolValue.prototype, 'toString', {
      value: Symbol.prototype.toString,
      enumerable: false
    });
    $defineProperty(SymbolValue.prototype, 'valueOf', {
      value: Symbol.prototype.valueOf,
      enumerable: false
    });
    var hashProperty = createPrivateName();
    var hashPropertyDescriptor = {value: undefined};
    var hashObjectProperties = {
      hash: {value: undefined},
      self: {value: undefined}
    };
    var hashCounter = 0;
    function getOwnHashObject(object) {
      var hashObject = object[hashProperty];
      if (hashObject && hashObject.self === object)
        return hashObject;
      if ($isExtensible(object)) {
        hashObjectProperties.hash.value = hashCounter++;
        hashObjectProperties.self.value = object;
        hashPropertyDescriptor.value = $create(null, hashObjectProperties);
        $defineProperty(object, hashProperty, hashPropertyDescriptor);
        return hashPropertyDescriptor.value;
      }
      return undefined;
    }
    function freeze(object) {
      getOwnHashObject(object);
      return $freeze.apply(this, arguments);
    }
    function preventExtensions(object) {
      getOwnHashObject(object);
      return $preventExtensions.apply(this, arguments);
    }
    function seal(object) {
      getOwnHashObject(object);
      return $seal.apply(this, arguments);
    }
    freeze(SymbolValue.prototype);
    function isSymbolString(s) {
      return symbolValues[s] || privateNames[s];
    }
    function toProperty(name) {
      if (isShimSymbol(name))
        return name[symbolInternalProperty];
      return name;
    }
    function removeSymbolKeys(array) {
      var rv = [];
      for (var i = 0; i < array.length; i++) {
        if (!isSymbolString(array[i])) {
          rv.push(array[i]);
        }
      }
      return rv;
    }
    function getOwnPropertyNames(object) {
      return removeSymbolKeys($getOwnPropertyNames(object));
    }
    function keys(object) {
      return removeSymbolKeys($keys(object));
    }
    function getOwnPropertySymbols(object) {
      var rv = [];
      var names = $getOwnPropertyNames(object);
      for (var i = 0; i < names.length; i++) {
        var symbol = symbolValues[names[i]];
        if (symbol) {
          rv.push(symbol);
        }
      }
      return rv;
    }
    function getOwnPropertyDescriptor(object, name) {
      return $getOwnPropertyDescriptor(object, toProperty(name));
    }
    function hasOwnProperty(name) {
      return $hasOwnProperty.call(this, toProperty(name));
    }
    function getOption(name) {
      return global.$traceurRuntime.options[name];
    }
    function defineProperty(object, name, descriptor) {
      if (isShimSymbol(name)) {
        name = name[symbolInternalProperty];
      }
      $defineProperty(object, name, descriptor);
      return object;
    }
    function polyfillObject(Object) {
      $defineProperty(Object, 'defineProperty', {value: defineProperty});
      $defineProperty(Object, 'getOwnPropertyNames', {value: getOwnPropertyNames});
      $defineProperty(Object, 'getOwnPropertyDescriptor', {value: getOwnPropertyDescriptor});
      $defineProperty(Object.prototype, 'hasOwnProperty', {value: hasOwnProperty});
      $defineProperty(Object, 'freeze', {value: freeze});
      $defineProperty(Object, 'preventExtensions', {value: preventExtensions});
      $defineProperty(Object, 'seal', {value: seal});
      $defineProperty(Object, 'keys', {value: keys});
    }
    function exportStar(object) {
      for (var i = 1; i < arguments.length; i++) {
        var names = $getOwnPropertyNames(arguments[i]);
        for (var j = 0; j < names.length; j++) {
          var name = names[j];
          if (name === '__esModule' || name === 'default' || isSymbolString(name))
            continue;
          (function(mod, name) {
            $defineProperty(object, name, {
              get: function() {
                return mod[name];
              },
              enumerable: true
            });
          })(arguments[i], names[j]);
        }
      }
      return object;
    }
    function isObject(x) {
      return x != null && (typeof x === 'object' || typeof x === 'function');
    }
    function toObject(x) {
      if (x == null)
        throw $TypeError();
      return $Object(x);
    }
    function checkObjectCoercible(argument) {
      if (argument == null) {
        throw new TypeError('Value cannot be converted to an Object');
      }
      return argument;
    }
    var hasNativeSymbol;
    function polyfillSymbol(global, Symbol) {
      if (!global.Symbol) {
        global.Symbol = Symbol;
        Object.getOwnPropertySymbols = getOwnPropertySymbols;
        hasNativeSymbol = false;
      } else {
        hasNativeSymbol = true;
      }
      if (!global.Symbol.iterator) {
        global.Symbol.iterator = Symbol('Symbol.iterator');
      }
      if (!global.Symbol.observer) {
        global.Symbol.observer = Symbol('Symbol.observer');
      }
    }
    function hasNativeSymbolFunc() {
      return hasNativeSymbol;
    }
    function setupGlobals(global) {
      polyfillSymbol(global, Symbol);
      global.Reflect = global.Reflect || {};
      global.Reflect.global = global.Reflect.global || global;
      polyfillObject(global.Object);
    }
    setupGlobals(global);
    global.$traceurRuntime = {
      call: tailCall,
      checkObjectCoercible: checkObjectCoercible,
      construct: construct,
      continuation: createContinuation,
      createPrivateName: createPrivateName,
      defineProperties: $defineProperties,
      defineProperty: $defineProperty,
      exportStar: exportStar,
      getOwnHashObject: getOwnHashObject,
      getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
      getOwnPropertyNames: $getOwnPropertyNames,
      hasNativeSymbol: hasNativeSymbolFunc,
      initTailRecursiveFunction: initTailRecursiveFunction,
      isObject: isObject,
      isPrivateName: isPrivateName,
      isSymbolString: isSymbolString,
      keys: $keys,
      options: {},
      setupGlobals: setupGlobals,
      toObject: toObject,
      toProperty: toProperty,
      typeof: typeOf
    };
  })();
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
(function() {
  function buildFromEncodedParts(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
    var out = [];
    if (opt_scheme) {
      out.push(opt_scheme, ':');
    }
    if (opt_domain) {
      out.push('//');
      if (opt_userInfo) {
        out.push(opt_userInfo, '@');
      }
      out.push(opt_domain);
      if (opt_port) {
        out.push(':', opt_port);
      }
    }
    if (opt_path) {
      out.push(opt_path);
    }
    if (opt_queryData) {
      out.push('?', opt_queryData);
    }
    if (opt_fragment) {
      out.push('#', opt_fragment);
    }
    return out.join('');
  }
  ;
  var splitRe = new RegExp('^' + '(?:' + '([^:/?#.]+)' + ':)?' + '(?://' + '(?:([^/?#]*)@)?' + '([\\w\\d\\-\\u0100-\\uffff.%]*)' + '(?::([0-9]+))?' + ')?' + '([^?#]+)?' + '(?:\\?([^#]*))?' + '(?:#(.*))?' + '$');
  var ComponentIndex = {
    SCHEME: 1,
    USER_INFO: 2,
    DOMAIN: 3,
    PORT: 4,
    PATH: 5,
    QUERY_DATA: 6,
    FRAGMENT: 7
  };
  function split(uri) {
    return (uri.match(splitRe));
  }
  function removeDotSegments(path) {
    if (path === '/')
      return '/';
    var leadingSlash = path[0] === '/' ? '/' : '';
    var trailingSlash = path.slice(-1) === '/' ? '/' : '';
    var segments = path.split('/');
    var out = [];
    var up = 0;
    for (var pos = 0; pos < segments.length; pos++) {
      var segment = segments[pos];
      switch (segment) {
        case '':
        case '.':
          break;
        case '..':
          if (out.length)
            out.pop();
          else
            up++;
          break;
        default:
          out.push(segment);
      }
    }
    if (!leadingSlash) {
      while (up-- > 0) {
        out.unshift('..');
      }
      if (out.length === 0)
        out.push('.');
    }
    return leadingSlash + out.join('/') + trailingSlash;
  }
  function joinAndCanonicalizePath(parts) {
    var path = parts[ComponentIndex.PATH] || '';
    path = removeDotSegments(path);
    parts[ComponentIndex.PATH] = path;
    return buildFromEncodedParts(parts[ComponentIndex.SCHEME], parts[ComponentIndex.USER_INFO], parts[ComponentIndex.DOMAIN], parts[ComponentIndex.PORT], parts[ComponentIndex.PATH], parts[ComponentIndex.QUERY_DATA], parts[ComponentIndex.FRAGMENT]);
  }
  function canonicalizeUrl(url) {
    var parts = split(url);
    return joinAndCanonicalizePath(parts);
  }
  function resolveUrl(base, url) {
    var parts = split(url);
    var baseParts = split(base);
    if (parts[ComponentIndex.SCHEME]) {
      return joinAndCanonicalizePath(parts);
    } else {
      parts[ComponentIndex.SCHEME] = baseParts[ComponentIndex.SCHEME];
    }
    for (var i = ComponentIndex.SCHEME; i <= ComponentIndex.PORT; i++) {
      if (!parts[i]) {
        parts[i] = baseParts[i];
      }
    }
    if (parts[ComponentIndex.PATH][0] == '/') {
      return joinAndCanonicalizePath(parts);
    }
    var path = baseParts[ComponentIndex.PATH];
    var index = path.lastIndexOf('/');
    path = path.slice(0, index + 1) + parts[ComponentIndex.PATH];
    parts[ComponentIndex.PATH] = path;
    return joinAndCanonicalizePath(parts);
  }
  function isAbsolute(name) {
    if (!name)
      return false;
    if (name[0] === '/')
      return true;
    var parts = split(name);
    if (parts[ComponentIndex.SCHEME])
      return true;
    return false;
  }
  $traceurRuntime.canonicalizeUrl = canonicalizeUrl;
  $traceurRuntime.isAbsolute = isAbsolute;
  $traceurRuntime.removeDotSegments = removeDotSegments;
  $traceurRuntime.resolveUrl = resolveUrl;
})();
(function(global) {
  'use strict';
  var $__1 = $traceurRuntime,
      canonicalizeUrl = $__1.canonicalizeUrl,
      resolveUrl = $__1.resolveUrl,
      isAbsolute = $__1.isAbsolute;
  var moduleInstantiators = Object.create(null);
  var baseURL;
  if (global.location && global.location.href)
    baseURL = resolveUrl(global.location.href, './');
  else
    baseURL = '';
  function UncoatedModuleEntry(url, uncoatedModule) {
    this.url = url;
    this.value_ = uncoatedModule;
  }
  function ModuleEvaluationError(erroneousModuleName, cause) {
    this.message = this.constructor.name + ': ' + this.stripCause(cause) + ' in ' + erroneousModuleName;
    if (!(cause instanceof ModuleEvaluationError) && cause.stack)
      this.stack = this.stripStack(cause.stack);
    else
      this.stack = '';
  }
  ModuleEvaluationError.prototype = Object.create(Error.prototype);
  ModuleEvaluationError.prototype.constructor = ModuleEvaluationError;
  ModuleEvaluationError.prototype.stripError = function(message) {
    return message.replace(/.*Error:/, this.constructor.name + ':');
  };
  ModuleEvaluationError.prototype.stripCause = function(cause) {
    if (!cause)
      return '';
    if (!cause.message)
      return cause + '';
    return this.stripError(cause.message);
  };
  ModuleEvaluationError.prototype.loadedBy = function(moduleName) {
    this.stack += '\n loaded by ' + moduleName;
  };
  ModuleEvaluationError.prototype.stripStack = function(causeStack) {
    var stack = [];
    causeStack.split('\n').some(function(frame) {
      if (/UncoatedModuleInstantiator/.test(frame))
        return true;
      stack.push(frame);
    });
    stack[0] = this.stripError(stack[0]);
    return stack.join('\n');
  };
  function beforeLines(lines, number) {
    var result = [];
    var first = number - 3;
    if (first < 0)
      first = 0;
    for (var i = first; i < number; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function afterLines(lines, number) {
    var last = number + 1;
    if (last > lines.length - 1)
      last = lines.length - 1;
    var result = [];
    for (var i = number; i <= last; i++) {
      result.push(lines[i]);
    }
    return result;
  }
  function columnSpacing(columns) {
    var result = '';
    for (var i = 0; i < columns - 1; i++) {
      result += '-';
    }
    return result;
  }
  function UncoatedModuleInstantiator(url, func) {
    UncoatedModuleEntry.call(this, url, null);
    this.func = func;
  }
  UncoatedModuleInstantiator.prototype = Object.create(UncoatedModuleEntry.prototype);
  UncoatedModuleInstantiator.prototype.getUncoatedModule = function() {
    var $__0 = this;
    if (this.value_)
      return this.value_;
    try {
      var relativeRequire;
      if (typeof $traceurRuntime !== undefined && $traceurRuntime.require) {
        relativeRequire = $traceurRuntime.require.bind(null, this.url);
      }
      return this.value_ = this.func.call(global, relativeRequire);
    } catch (ex) {
      if (ex instanceof ModuleEvaluationError) {
        ex.loadedBy(this.url);
        throw ex;
      }
      if (ex.stack) {
        var lines = this.func.toString().split('\n');
        var evaled = [];
        ex.stack.split('\n').some(function(frame, index) {
          if (frame.indexOf('UncoatedModuleInstantiator.getUncoatedModule') > 0)
            return true;
          var m = /(at\s[^\s]*\s).*>:(\d*):(\d*)\)/.exec(frame);
          if (m) {
            var line = parseInt(m[2], 10);
            evaled = evaled.concat(beforeLines(lines, line));
            if (index === 1) {
              evaled.push(columnSpacing(m[3]) + '^ ' + $__0.url);
            } else {
              evaled.push(columnSpacing(m[3]) + '^');
            }
            evaled = evaled.concat(afterLines(lines, line));
            evaled.push('= = = = = = = = =');
          } else {
            evaled.push(frame);
          }
        });
        ex.stack = evaled.join('\n');
      }
      throw new ModuleEvaluationError(this.url, ex);
    }
  };
  function getUncoatedModuleInstantiator(name) {
    if (!name)
      return;
    var url = ModuleStore.normalize(name);
    return moduleInstantiators[url];
  }
  ;
  var moduleInstances = Object.create(null);
  var liveModuleSentinel = {};
  function Module(uncoatedModule) {
    var isLive = arguments[1];
    var coatedModule = Object.create(null);
    Object.getOwnPropertyNames(uncoatedModule).forEach(function(name) {
      var getter,
          value;
      if (isLive === liveModuleSentinel) {
        var descr = Object.getOwnPropertyDescriptor(uncoatedModule, name);
        if (descr.get)
          getter = descr.get;
      }
      if (!getter) {
        value = uncoatedModule[name];
        getter = function() {
          return value;
        };
      }
      Object.defineProperty(coatedModule, name, {
        get: getter,
        enumerable: true
      });
    });
    Object.preventExtensions(coatedModule);
    return coatedModule;
  }
  var ModuleStore = {
    normalize: function(name, refererName, refererAddress) {
      if (typeof name !== 'string')
        throw new TypeError('module name must be a string, not ' + typeof name);
      if (isAbsolute(name))
        return canonicalizeUrl(name);
      if (/[^\.]\/\.\.\//.test(name)) {
        throw new Error('module name embeds /../: ' + name);
      }
      if (name[0] === '.' && refererName)
        return resolveUrl(refererName, name);
      return canonicalizeUrl(name);
    },
    get: function(normalizedName) {
      var m = getUncoatedModuleInstantiator(normalizedName);
      if (!m)
        return undefined;
      var moduleInstance = moduleInstances[m.url];
      if (moduleInstance)
        return moduleInstance;
      moduleInstance = Module(m.getUncoatedModule(), liveModuleSentinel);
      return moduleInstances[m.url] = moduleInstance;
    },
    set: function(normalizedName, module) {
      normalizedName = String(normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, function() {
        return module;
      });
      moduleInstances[normalizedName] = module;
    },
    get baseURL() {
      return baseURL;
    },
    set baseURL(v) {
      baseURL = String(v);
    },
    registerModule: function(name, deps, func) {
      var normalizedName = ModuleStore.normalize(name);
      if (moduleInstantiators[normalizedName])
        throw new Error('duplicate module named ' + normalizedName);
      moduleInstantiators[normalizedName] = new UncoatedModuleInstantiator(normalizedName, func);
    },
    bundleStore: Object.create(null),
    register: function(name, deps, func) {
      if (!deps || !deps.length && !func.length) {
        this.registerModule(name, deps, func);
      } else {
        this.bundleStore[name] = {
          deps: deps,
          execute: function() {
            var $__0 = arguments;
            var depMap = {};
            deps.forEach(function(dep, index) {
              return depMap[dep] = $__0[index];
            });
            var registryEntry = func.call(this, depMap);
            registryEntry.execute.call(this);
            return registryEntry.exports;
          }
        };
      }
    },
    getAnonymousModule: function(func) {
      return new Module(func.call(global), liveModuleSentinel);
    }
  };
  var moduleStoreModule = new Module({ModuleStore: ModuleStore});
  ModuleStore.set('@traceur/src/runtime/ModuleStore.js', moduleStoreModule);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
  };
  $traceurRuntime.ModuleStore = ModuleStore;
  global.System = {
    register: ModuleStore.register.bind(ModuleStore),
    registerModule: ModuleStore.registerModule.bind(ModuleStore),
    get: ModuleStore.get,
    set: ModuleStore.set,
    normalize: ModuleStore.normalize
  };
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
System.registerModule("traceur@0.0.91/src/runtime/async.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/async.js";
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var $createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $create = Object.create;
  var thisName = $createPrivateName();
  var argsName = $createPrivateName();
  var observeName = $createPrivateName();
  function AsyncGeneratorFunction() {}
  function AsyncGeneratorFunctionPrototype() {}
  AsyncGeneratorFunction.prototype = AsyncGeneratorFunctionPrototype;
  AsyncGeneratorFunctionPrototype.constructor = AsyncGeneratorFunction;
  $defineProperty(AsyncGeneratorFunctionPrototype, 'constructor', {enumerable: false});
  var AsyncGeneratorContext = function() {
    function AsyncGeneratorContext(observer) {
      var $__0 = this;
      this.decoratedObserver = $traceurRuntime.createDecoratedGenerator(observer, function() {
        $__0.done = true;
      });
      this.done = false;
      this.inReturn = false;
    }
    return ($traceurRuntime.createClass)(AsyncGeneratorContext, {
      throw: function(error) {
        if (!this.inReturn) {
          throw error;
        }
      },
      yield: function(value) {
        if (this.done) {
          this.inReturn = true;
          throw undefined;
        }
        var result;
        try {
          result = this.decoratedObserver.next(value);
        } catch (e) {
          this.done = true;
          throw e;
        }
        if (result === undefined) {
          return;
        }
        if (result.done) {
          this.done = true;
          this.inReturn = true;
          throw undefined;
        }
        return result.value;
      },
      yieldFor: function(observable) {
        var ctx = this;
        return $traceurRuntime.observeForEach(observable[$traceurRuntime.toProperty(Symbol.observer)].bind(observable), function(value) {
          if (ctx.done) {
            this.return();
            return;
          }
          var result;
          try {
            result = ctx.decoratedObserver.next(value);
          } catch (e) {
            ctx.done = true;
            throw e;
          }
          if (result === undefined) {
            return;
          }
          if (result.done) {
            ctx.done = true;
          }
          return result;
        });
      }
    }, {});
  }();
  AsyncGeneratorFunctionPrototype.prototype[Symbol.observer] = function(observer) {
    var observe = this[observeName];
    var ctx = new AsyncGeneratorContext(observer);
    $traceurRuntime.schedule(function() {
      return observe(ctx);
    }).then(function(value) {
      if (!ctx.done) {
        ctx.decoratedObserver.return(value);
      }
    }).catch(function(error) {
      if (!ctx.done) {
        ctx.decoratedObserver.throw(error);
      }
    });
    return ctx.decoratedObserver;
  };
  $defineProperty(AsyncGeneratorFunctionPrototype.prototype, Symbol.observer, {enumerable: false});
  function initAsyncGeneratorFunction(functionObject) {
    functionObject.prototype = $create(AsyncGeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = AsyncGeneratorFunctionPrototype;
    return functionObject;
  }
  function createAsyncGeneratorInstance(observe, functionObject) {
    for (var args = [],
        $__9 = 2; $__9 < arguments.length; $__9++)
      args[$__9 - 2] = arguments[$__9];
    var object = $create(functionObject.prototype);
    object[thisName] = this;
    object[argsName] = args;
    object[observeName] = observe;
    return object;
  }
  function observeForEach(observe, next) {
    return new Promise(function(resolve, reject) {
      var generator = observe({
        next: function(value) {
          return next.call(generator, value);
        },
        throw: function(error) {
          reject(error);
        },
        return: function(value) {
          resolve(value);
        }
      });
    });
  }
  function schedule(asyncF) {
    return Promise.resolve().then(asyncF);
  }
  var generator = Symbol();
  var onDone = Symbol();
  var DecoratedGenerator = function() {
    function DecoratedGenerator(_generator, _onDone) {
      this[generator] = _generator;
      this[onDone] = _onDone;
    }
    return ($traceurRuntime.createClass)(DecoratedGenerator, {
      next: function(value) {
        var result = this[generator].next(value);
        if (result !== undefined && result.done) {
          this[onDone].call(this);
        }
        return result;
      },
      throw: function(error) {
        this[onDone].call(this);
        return this[generator].throw(error);
      },
      return: function(value) {
        this[onDone].call(this);
        return this[generator].return(value);
      }
    }, {});
  }();
  function createDecoratedGenerator(generator, onDone) {
    return new DecoratedGenerator(generator, onDone);
  }
  Array.prototype[$traceurRuntime.toProperty(Symbol.observer)] = function(observer) {
    var done = false;
    var decoratedObserver = createDecoratedGenerator(observer, function() {
      return done = true;
    });
    var $__5 = true;
    var $__6 = false;
    var $__7 = undefined;
    try {
      for (var $__3 = void 0,
          $__2 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
        var value = $__3.value;
        {
          decoratedObserver.next(value);
          if (done) {
            return;
          }
        }
      }
    } catch ($__8) {
      $__6 = true;
      $__7 = $__8;
    } finally {
      try {
        if (!$__5 && $__2.return != null) {
          $__2.return();
        }
      } finally {
        if ($__6) {
          throw $__7;
        }
      }
    }
    decoratedObserver.return();
    return decoratedObserver;
  };
  $defineProperty(Array.prototype, $traceurRuntime.toProperty(Symbol.observer), {enumerable: false});
  $traceurRuntime.initAsyncGeneratorFunction = initAsyncGeneratorFunction;
  $traceurRuntime.createAsyncGeneratorInstance = createAsyncGeneratorInstance;
  $traceurRuntime.observeForEach = observeForEach;
  $traceurRuntime.schedule = schedule;
  $traceurRuntime.createDecoratedGenerator = createDecoratedGenerator;
  return {};
});
System.registerModule("traceur@0.0.91/src/runtime/classes.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/classes.js";
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $getOwnPropertyDescriptor = $traceurRuntime.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $traceurRuntime.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $__0 = Object,
      getOwnPropertyNames = $__0.getOwnPropertyNames,
      getOwnPropertySymbols = $__0.getOwnPropertySymbols;
  function superDescriptor(homeObject, name) {
    var proto = $getPrototypeOf(homeObject);
    do {
      var result = $getOwnPropertyDescriptor(proto, name);
      if (result)
        return result;
      proto = $getPrototypeOf(proto);
    } while (proto);
    return undefined;
  }
  function superConstructor(ctor) {
    return ctor.__proto__;
  }
  function superGet(self, homeObject, name) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor) {
      var value = descriptor.value;
      if (value)
        return value;
      if (!descriptor.get)
        return value;
      return descriptor.get.call(self);
    }
    return undefined;
  }
  function superSet(self, homeObject, name, value) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor && descriptor.set) {
      descriptor.set.call(self, value);
      return value;
    }
    throw $TypeError(("super has no setter '" + name + "'."));
  }
  function forEachPropertyKey(object, f) {
    getOwnPropertyNames(object).forEach(f);
    getOwnPropertySymbols(object).forEach(f);
  }
  function getDescriptors(object) {
    var descriptors = {};
    forEachPropertyKey(object, function(key) {
      descriptors[key] = $getOwnPropertyDescriptor(object, key);
      descriptors[key].enumerable = false;
    });
    return descriptors;
  }
  var nonEnum = {enumerable: false};
  function makePropertiesNonEnumerable(object) {
    forEachPropertyKey(object, function(key) {
      $defineProperty(object, key, nonEnum);
    });
  }
  function createClass(ctor, object, staticObject, superClass) {
    $defineProperty(object, 'constructor', {
      value: ctor,
      configurable: true,
      enumerable: false,
      writable: true
    });
    if (arguments.length > 3) {
      if (typeof superClass === 'function')
        ctor.__proto__ = superClass;
      ctor.prototype = $create(getProtoParent(superClass), getDescriptors(object));
    } else {
      makePropertiesNonEnumerable(object);
      ctor.prototype = object;
    }
    $defineProperty(ctor, 'prototype', {
      configurable: false,
      writable: false
    });
    return $defineProperties(ctor, getDescriptors(staticObject));
  }
  function getProtoParent(superClass) {
    if (typeof superClass === 'function') {
      var prototype = superClass.prototype;
      if ($Object(prototype) === prototype || prototype === null)
        return superClass.prototype;
      throw new $TypeError('super prototype must be an Object or null');
    }
    if (superClass === null)
      return null;
    throw new $TypeError(("Super expression must either be null or a function, not " + typeof superClass + "."));
  }
  $traceurRuntime.createClass = createClass;
  $traceurRuntime.superConstructor = superConstructor;
  $traceurRuntime.superGet = superGet;
  $traceurRuntime.superSet = superSet;
  return {};
});
System.registerModule("traceur@0.0.91/src/runtime/destructuring.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/destructuring.js";
  function iteratorToArray(iter) {
    var rv = [];
    var i = 0;
    var tmp;
    while (!(tmp = iter.next()).done) {
      rv[i++] = tmp.value;
    }
    return rv;
  }
  $traceurRuntime.iteratorToArray = iteratorToArray;
  return {};
});
System.registerModule("traceur@0.0.91/src/runtime/generators.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/generators.js";
  if (typeof $traceurRuntime !== 'object') {
    throw new Error('traceur runtime not found.');
  }
  var createPrivateName = $traceurRuntime.createPrivateName;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $create = Object.create;
  var $TypeError = TypeError;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var ST_NEWBORN = 0;
  var ST_EXECUTING = 1;
  var ST_SUSPENDED = 2;
  var ST_CLOSED = 3;
  var END_STATE = -2;
  var RETHROW_STATE = -3;
  function getInternalError(state) {
    return new Error('Traceur compiler bug: invalid state in state machine: ' + state);
  }
  var RETURN_SENTINEL = {};
  function GeneratorContext() {
    this.state = 0;
    this.GState = ST_NEWBORN;
    this.storedException = undefined;
    this.finallyFallThrough = undefined;
    this.sent_ = undefined;
    this.returnValue = undefined;
    this.oldReturnValue = undefined;
    this.tryStack_ = [];
  }
  GeneratorContext.prototype = {
    pushTry: function(catchState, finallyState) {
      if (finallyState !== null) {
        var finallyFallThrough = null;
        for (var i = this.tryStack_.length - 1; i >= 0; i--) {
          if (this.tryStack_[i].catch !== undefined) {
            finallyFallThrough = this.tryStack_[i].catch;
            break;
          }
        }
        if (finallyFallThrough === null)
          finallyFallThrough = RETHROW_STATE;
        this.tryStack_.push({
          finally: finallyState,
          finallyFallThrough: finallyFallThrough
        });
      }
      if (catchState !== null) {
        this.tryStack_.push({catch: catchState});
      }
    },
    popTry: function() {
      this.tryStack_.pop();
    },
    maybeUncatchable: function() {
      if (this.storedException === RETURN_SENTINEL) {
        throw RETURN_SENTINEL;
      }
    },
    get sent() {
      this.maybeThrow();
      return this.sent_;
    },
    set sent(v) {
      this.sent_ = v;
    },
    get sentIgnoreThrow() {
      return this.sent_;
    },
    maybeThrow: function() {
      if (this.action === 'throw') {
        this.action = 'next';
        throw this.sent_;
      }
    },
    end: function() {
      switch (this.state) {
        case END_STATE:
          return this;
        case RETHROW_STATE:
          throw this.storedException;
        default:
          throw getInternalError(this.state);
      }
    },
    handleException: function(ex) {
      this.GState = ST_CLOSED;
      this.state = END_STATE;
      throw ex;
    },
    wrapYieldStar: function(iterator) {
      var ctx = this;
      return {
        next: function(v) {
          return iterator.next(v);
        },
        throw: function(e) {
          var result;
          if (e === RETURN_SENTINEL) {
            if (iterator.return) {
              result = iterator.return(ctx.returnValue);
              if (!result.done) {
                ctx.returnValue = ctx.oldReturnValue;
                return result;
              }
              ctx.returnValue = result.value;
            }
            throw e;
          }
          if (iterator.throw) {
            return iterator.throw(e);
          }
          iterator.return && iterator.return();
          throw $TypeError('Inner iterator does not have a throw method');
        }
      };
    }
  };
  function nextOrThrow(ctx, moveNext, action, x) {
    switch (ctx.GState) {
      case ST_EXECUTING:
        throw new Error(("\"" + action + "\" on executing generator"));
      case ST_CLOSED:
        if (action == 'next') {
          return {
            value: undefined,
            done: true
          };
        }
        if (x === RETURN_SENTINEL) {
          return {
            value: ctx.returnValue,
            done: true
          };
        }
        throw x;
      case ST_NEWBORN:
        if (action === 'throw') {
          ctx.GState = ST_CLOSED;
          if (x === RETURN_SENTINEL) {
            return {
              value: ctx.returnValue,
              done: true
            };
          }
          throw x;
        }
        if (x !== undefined)
          throw $TypeError('Sent value to newborn generator');
      case ST_SUSPENDED:
        ctx.GState = ST_EXECUTING;
        ctx.action = action;
        ctx.sent = x;
        var value;
        try {
          value = moveNext(ctx);
        } catch (ex) {
          if (ex === RETURN_SENTINEL) {
            value = ctx;
          } else {
            throw ex;
          }
        }
        var done = value === ctx;
        if (done)
          value = ctx.returnValue;
        ctx.GState = done ? ST_CLOSED : ST_SUSPENDED;
        return {
          value: value,
          done: done
        };
    }
  }
  var ctxName = createPrivateName();
  var moveNextName = createPrivateName();
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  $defineProperty(GeneratorFunctionPrototype, 'constructor', nonEnum(GeneratorFunction));
  GeneratorFunctionPrototype.prototype = {
    constructor: GeneratorFunctionPrototype,
    next: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'next', v);
    },
    throw: function(v) {
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', v);
    },
    return: function(v) {
      this[ctxName].oldReturnValue = this[ctxName].returnValue;
      this[ctxName].returnValue = v;
      return nextOrThrow(this[ctxName], this[moveNextName], 'throw', RETURN_SENTINEL);
    }
  };
  $defineProperties(GeneratorFunctionPrototype.prototype, {
    constructor: {enumerable: false},
    next: {enumerable: false},
    throw: {enumerable: false},
    return: {enumerable: false}
  });
  Object.defineProperty(GeneratorFunctionPrototype.prototype, Symbol.iterator, nonEnum(function() {
    return this;
  }));
  function createGeneratorInstance(innerFunction, functionObject, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new GeneratorContext();
    var object = $create(functionObject.prototype);
    object[ctxName] = ctx;
    object[moveNextName] = moveNext;
    return object;
  }
  function initGeneratorFunction(functionObject) {
    functionObject.prototype = $create(GeneratorFunctionPrototype.prototype);
    functionObject.__proto__ = GeneratorFunctionPrototype;
    return functionObject;
  }
  function AsyncFunctionContext() {
    GeneratorContext.call(this);
    this.err = undefined;
    var ctx = this;
    ctx.result = new Promise(function(resolve, reject) {
      ctx.resolve = resolve;
      ctx.reject = reject;
    });
  }
  AsyncFunctionContext.prototype = $create(GeneratorContext.prototype);
  AsyncFunctionContext.prototype.end = function() {
    switch (this.state) {
      case END_STATE:
        this.resolve(this.returnValue);
        break;
      case RETHROW_STATE:
        this.reject(this.storedException);
        break;
      default:
        this.reject(getInternalError(this.state));
    }
  };
  AsyncFunctionContext.prototype.handleException = function() {
    this.state = RETHROW_STATE;
  };
  function asyncWrap(innerFunction, self) {
    var moveNext = getMoveNext(innerFunction, self);
    var ctx = new AsyncFunctionContext();
    ctx.createCallback = function(newState) {
      return function(value) {
        ctx.state = newState;
        ctx.value = value;
        moveNext(ctx);
      };
    };
    ctx.errback = function(err) {
      handleCatch(ctx, err);
      moveNext(ctx);
    };
    moveNext(ctx);
    return ctx.result;
  }
  function getMoveNext(innerFunction, self) {
    return function(ctx) {
      while (true) {
        try {
          return innerFunction.call(self, ctx);
        } catch (ex) {
          handleCatch(ctx, ex);
        }
      }
    };
  }
  function handleCatch(ctx, ex) {
    ctx.storedException = ex;
    var last = ctx.tryStack_[ctx.tryStack_.length - 1];
    if (!last) {
      ctx.handleException(ex);
      return;
    }
    ctx.state = last.catch !== undefined ? last.catch : last.finally;
    if (last.finallyFallThrough !== undefined)
      ctx.finallyFallThrough = last.finallyFallThrough;
  }
  $traceurRuntime.asyncWrap = asyncWrap;
  $traceurRuntime.initGeneratorFunction = initGeneratorFunction;
  $traceurRuntime.createGeneratorInstance = createGeneratorInstance;
  return {};
});
System.registerModule("traceur@0.0.91/src/runtime/relativeRequire.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/relativeRequire.js";
  var path;
  function relativeRequire(callerPath, requiredPath) {
    path = path || typeof require !== 'undefined' && require('path');
    function isDirectory(path) {
      return path.slice(-1) === '/';
    }
    function isAbsolute(path) {
      return path[0] === '/';
    }
    function isRelative(path) {
      return path[0] === '.';
    }
    if (isDirectory(requiredPath) || isAbsolute(requiredPath))
      return;
    return isRelative(requiredPath) ? require(path.resolve(path.dirname(callerPath), requiredPath)) : require(requiredPath);
  }
  $traceurRuntime.require = relativeRequire;
  return {};
});
System.registerModule("traceur@0.0.91/src/runtime/spread.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/spread.js";
  function spread() {
    var rv = [],
        j = 0,
        iterResult;
    for (var i = 0; i < arguments.length; i++) {
      var valueToSpread = $traceurRuntime.checkObjectCoercible(arguments[i]);
      if (typeof valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)] !== 'function') {
        throw new TypeError('Cannot spread non-iterable object.');
      }
      var iter = valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)]();
      while (!(iterResult = iter.next()).done) {
        rv[j++] = iterResult.value;
      }
    }
    return rv;
  }
  $traceurRuntime.spread = spread;
  return {};
});
System.registerModule("traceur@0.0.91/src/runtime/template.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/template.js";
  var $__0 = Object,
      defineProperty = $__0.defineProperty,
      freeze = $__0.freeze;
  var slice = Array.prototype.slice;
  var map = Object.create(null);
  function getTemplateObject(raw) {
    var cooked = arguments[1];
    var key = raw.join('${}');
    var templateObject = map[key];
    if (templateObject)
      return templateObject;
    if (!cooked) {
      cooked = slice.call(raw);
    }
    return map[key] = freeze(defineProperty(cooked, 'raw', {value: freeze(raw)}));
  }
  $traceurRuntime.getTemplateObject = getTemplateObject;
  return {};
});
System.registerModule("traceur@0.0.91/src/runtime/type-assertions.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/type-assertions.js";
  var types = {
    any: {name: 'any'},
    boolean: {name: 'boolean'},
    number: {name: 'number'},
    string: {name: 'string'},
    symbol: {name: 'symbol'},
    void: {name: 'void'}
  };
  var GenericType = function() {
    function GenericType(type, argumentTypes) {
      this.type = type;
      this.argumentTypes = argumentTypes;
    }
    return ($traceurRuntime.createClass)(GenericType, {}, {});
  }();
  var typeRegister = Object.create(null);
  function genericType(type) {
    for (var argumentTypes = [],
        $__1 = 1; $__1 < arguments.length; $__1++)
      argumentTypes[$__1 - 1] = arguments[$__1];
    var typeMap = typeRegister;
    var key = $traceurRuntime.getOwnHashObject(type).hash;
    if (!typeMap[key]) {
      typeMap[key] = Object.create(null);
    }
    typeMap = typeMap[key];
    for (var i = 0; i < argumentTypes.length - 1; i++) {
      key = $traceurRuntime.getOwnHashObject(argumentTypes[i]).hash;
      if (!typeMap[key]) {
        typeMap[key] = Object.create(null);
      }
      typeMap = typeMap[key];
    }
    var tail = argumentTypes[argumentTypes.length - 1];
    key = $traceurRuntime.getOwnHashObject(tail).hash;
    if (!typeMap[key]) {
      typeMap[key] = new GenericType(type, argumentTypes);
    }
    return typeMap[key];
  }
  $traceurRuntime.GenericType = GenericType;
  $traceurRuntime.genericType = genericType;
  $traceurRuntime.type = types;
  return {};
});
System.registerModule("traceur@0.0.91/src/runtime/runtime-modules.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/runtime-modules.js";
  System.get("traceur@0.0.91/src/runtime/relativeRequire.js");
  System.get("traceur@0.0.91/src/runtime/spread.js");
  System.get("traceur@0.0.91/src/runtime/destructuring.js");
  System.get("traceur@0.0.91/src/runtime/classes.js");
  System.get("traceur@0.0.91/src/runtime/async.js");
  System.get("traceur@0.0.91/src/runtime/generators.js");
  System.get("traceur@0.0.91/src/runtime/template.js");
  System.get("traceur@0.0.91/src/runtime/type-assertions.js");
  return {};
});
System.get("traceur@0.0.91/src/runtime/runtime-modules.js" + '');
System.registerModule("traceur@0.0.91/src/runtime/polyfills/utils.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/utils.js";
  var $ceil = Math.ceil;
  var $floor = Math.floor;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $pow = Math.pow;
  var $min = Math.min;
  var toObject = $traceurRuntime.toObject;
  function toUint32(x) {
    return x >>> 0;
  }
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function isCallable(x) {
    return typeof x === 'function';
  }
  function isNumber(x) {
    return typeof x === 'number';
  }
  function toInteger(x) {
    x = +x;
    if ($isNaN(x))
      return 0;
    if (x === 0 || !$isFinite(x))
      return x;
    return x > 0 ? $floor(x) : $ceil(x);
  }
  var MAX_SAFE_LENGTH = $pow(2, 53) - 1;
  function toLength(x) {
    var len = toInteger(x);
    return len < 0 ? 0 : $min(len, MAX_SAFE_LENGTH);
  }
  function checkIterable(x) {
    return !isObject(x) ? undefined : x[Symbol.iterator];
  }
  function isConstructor(x) {
    return isCallable(x);
  }
  function createIteratorResultObject(value, done) {
    return {
      value: value,
      done: done
    };
  }
  function maybeDefine(object, name, descr) {
    if (!(name in object)) {
      Object.defineProperty(object, name, descr);
    }
  }
  function maybeDefineMethod(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  function maybeDefineConst(object, name, value) {
    maybeDefine(object, name, {
      value: value,
      configurable: false,
      enumerable: false,
      writable: false
    });
  }
  function maybeAddFunctions(object, functions) {
    for (var i = 0; i < functions.length; i += 2) {
      var name = functions[i];
      var value = functions[i + 1];
      maybeDefineMethod(object, name, value);
    }
  }
  function maybeAddConsts(object, consts) {
    for (var i = 0; i < consts.length; i += 2) {
      var name = consts[i];
      var value = consts[i + 1];
      maybeDefineConst(object, name, value);
    }
  }
  function maybeAddIterator(object, func, Symbol) {
    if (!Symbol || !Symbol.iterator || object[Symbol.iterator])
      return;
    if (object['@@iterator'])
      func = object['@@iterator'];
    Object.defineProperty(object, Symbol.iterator, {
      value: func,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  var polyfills = [];
  function registerPolyfill(func) {
    polyfills.push(func);
  }
  function polyfillAll(global) {
    polyfills.forEach(function(f) {
      return f(global);
    });
  }
  return {
    get toObject() {
      return toObject;
    },
    get toUint32() {
      return toUint32;
    },
    get isObject() {
      return isObject;
    },
    get isCallable() {
      return isCallable;
    },
    get isNumber() {
      return isNumber;
    },
    get toInteger() {
      return toInteger;
    },
    get toLength() {
      return toLength;
    },
    get checkIterable() {
      return checkIterable;
    },
    get isConstructor() {
      return isConstructor;
    },
    get createIteratorResultObject() {
      return createIteratorResultObject;
    },
    get maybeDefine() {
      return maybeDefine;
    },
    get maybeDefineMethod() {
      return maybeDefineMethod;
    },
    get maybeDefineConst() {
      return maybeDefineConst;
    },
    get maybeAddFunctions() {
      return maybeAddFunctions;
    },
    get maybeAddConsts() {
      return maybeAddConsts;
    },
    get maybeAddIterator() {
      return maybeAddIterator;
    },
    get registerPolyfill() {
      return registerPolyfill;
    },
    get polyfillAll() {
      return polyfillAll;
    }
  };
});
System.registerModule("traceur@0.0.91/src/runtime/polyfills/Map.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/Map.js";
  var $__0 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      registerPolyfill = $__0.registerPolyfill;
  var $__9 = $traceurRuntime,
      getOwnHashObject = $__9.getOwnHashObject,
      hasNativeSymbol = $__9.hasNativeSymbol;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  var deletedSentinel = {};
  function lookupIndex(map, key) {
    if (isObject(key)) {
      var hashObject = getOwnHashObject(key);
      return hashObject && map.objectIndex_[hashObject.hash];
    }
    if (typeof key === 'string')
      return map.stringIndex_[key];
    return map.primitiveIndex_[key];
  }
  function initMap(map) {
    map.entries_ = [];
    map.objectIndex_ = Object.create(null);
    map.stringIndex_ = Object.create(null);
    map.primitiveIndex_ = Object.create(null);
    map.deletedCount_ = 0;
  }
  var Map = function() {
    function Map() {
      var $__11,
          $__12;
      var iterable = arguments[0];
      if (!isObject(this))
        throw new TypeError('Map called on incompatible type');
      if ($hasOwnProperty.call(this, 'entries_')) {
        throw new TypeError('Map can not be reentrantly initialised');
      }
      initMap(this);
      if (iterable !== null && iterable !== undefined) {
        var $__5 = true;
        var $__6 = false;
        var $__7 = undefined;
        try {
          for (var $__3 = void 0,
              $__2 = (iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
            var $__10 = $__3.value,
                key = ($__11 = $__10[$traceurRuntime.toProperty(Symbol.iterator)](), ($__12 = $__11.next()).done ? void 0 : $__12.value),
                value = ($__12 = $__11.next()).done ? void 0 : $__12.value;
            {
              this.set(key, value);
            }
          }
        } catch ($__8) {
          $__6 = true;
          $__7 = $__8;
        } finally {
          try {
            if (!$__5 && $__2.return != null) {
              $__2.return();
            }
          } finally {
            if ($__6) {
              throw $__7;
            }
          }
        }
      }
    }
    return ($traceurRuntime.createClass)(Map, {
      get size() {
        return this.entries_.length / 2 - this.deletedCount_;
      },
      get: function(key) {
        var index = lookupIndex(this, key);
        if (index !== undefined)
          return this.entries_[index + 1];
      },
      set: function(key, value) {
        var objectMode = isObject(key);
        var stringMode = typeof key === 'string';
        var index = lookupIndex(this, key);
        if (index !== undefined) {
          this.entries_[index + 1] = value;
        } else {
          index = this.entries_.length;
          this.entries_[index] = key;
          this.entries_[index + 1] = value;
          if (objectMode) {
            var hashObject = getOwnHashObject(key);
            var hash = hashObject.hash;
            this.objectIndex_[hash] = index;
          } else if (stringMode) {
            this.stringIndex_[key] = index;
          } else {
            this.primitiveIndex_[key] = index;
          }
        }
        return this;
      },
      has: function(key) {
        return lookupIndex(this, key) !== undefined;
      },
      delete: function(key) {
        var objectMode = isObject(key);
        var stringMode = typeof key === 'string';
        var index;
        var hash;
        if (objectMode) {
          var hashObject = getOwnHashObject(key);
          if (hashObject) {
            index = this.objectIndex_[hash = hashObject.hash];
            delete this.objectIndex_[hash];
          }
        } else if (stringMode) {
          index = this.stringIndex_[key];
          delete this.stringIndex_[key];
        } else {
          index = this.primitiveIndex_[key];
          delete this.primitiveIndex_[key];
        }
        if (index !== undefined) {
          this.entries_[index] = deletedSentinel;
          this.entries_[index + 1] = undefined;
          this.deletedCount_++;
          return true;
        }
        return false;
      },
      clear: function() {
        initMap(this);
      },
      forEach: function(callbackFn) {
        var thisArg = arguments[1];
        for (var i = 0; i < this.entries_.length; i += 2) {
          var key = this.entries_[i];
          var value = this.entries_[i + 1];
          if (key === deletedSentinel)
            continue;
          callbackFn.call(thisArg, value, key, this);
        }
      },
      entries: $traceurRuntime.initGeneratorFunction(function $__13() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return [key, value];
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__13, this);
      }),
      keys: $traceurRuntime.initGeneratorFunction(function $__14() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return key;
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__14, this);
      }),
      values: $traceurRuntime.initGeneratorFunction(function $__15() {
        var i,
            key,
            value;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                i = 0;
                $ctx.state = 12;
                break;
              case 12:
                $ctx.state = (i < this.entries_.length) ? 8 : -2;
                break;
              case 4:
                i += 2;
                $ctx.state = 12;
                break;
              case 8:
                key = this.entries_[i];
                value = this.entries_[i + 1];
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = (key === deletedSentinel) ? 4 : 6;
                break;
              case 6:
                $ctx.state = 2;
                return value;
              case 2:
                $ctx.maybeThrow();
                $ctx.state = 4;
                break;
              default:
                return $ctx.end();
            }
        }, $__15, this);
      })
    }, {});
  }();
  Object.defineProperty(Map.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Map.prototype.entries
  });
  function needsPolyfill(global) {
    var $__10 = global,
        Map = $__10.Map,
        Symbol = $__10.Symbol;
    if (!Map || !$traceurRuntime.hasNativeSymbol() || !Map.prototype[Symbol.iterator] || !Map.prototype.entries) {
      return true;
    }
    try {
      return new Map([[]]).size !== 1;
    } catch (e) {
      return false;
    }
  }
  function polyfillMap(global) {
    if (needsPolyfill(global)) {
      global.Map = Map;
    }
  }
  registerPolyfill(polyfillMap);
  return {
    get Map() {
      return Map;
    },
    get polyfillMap() {
      return polyfillMap;
    }
  };
});
System.get("traceur@0.0.91/src/runtime/polyfills/Map.js" + '');
System.registerModule("traceur@0.0.91/src/runtime/polyfills/Set.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/Set.js";
  var $__0 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      isObject = $__0.isObject,
      registerPolyfill = $__0.registerPolyfill;
  var Map = System.get("traceur@0.0.91/src/runtime/polyfills/Map.js").Map;
  var getOwnHashObject = $traceurRuntime.getOwnHashObject;
  var $hasOwnProperty = Object.prototype.hasOwnProperty;
  function initSet(set) {
    set.map_ = new Map();
  }
  var Set = function() {
    function Set() {
      var iterable = arguments[0];
      if (!isObject(this))
        throw new TypeError('Set called on incompatible type');
      if ($hasOwnProperty.call(this, 'map_')) {
        throw new TypeError('Set can not be reentrantly initialised');
      }
      initSet(this);
      if (iterable !== null && iterable !== undefined) {
        var $__7 = true;
        var $__8 = false;
        var $__9 = undefined;
        try {
          for (var $__5 = void 0,
              $__4 = (iterable)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__7 = ($__5 = $__4.next()).done); $__7 = true) {
            var item = $__5.value;
            {
              this.add(item);
            }
          }
        } catch ($__10) {
          $__8 = true;
          $__9 = $__10;
        } finally {
          try {
            if (!$__7 && $__4.return != null) {
              $__4.return();
            }
          } finally {
            if ($__8) {
              throw $__9;
            }
          }
        }
      }
    }
    return ($traceurRuntime.createClass)(Set, {
      get size() {
        return this.map_.size;
      },
      has: function(key) {
        return this.map_.has(key);
      },
      add: function(key) {
        this.map_.set(key, key);
        return this;
      },
      delete: function(key) {
        return this.map_.delete(key);
      },
      clear: function() {
        return this.map_.clear();
      },
      forEach: function(callbackFn) {
        var thisArg = arguments[1];
        var $__2 = this;
        return this.map_.forEach(function(value, key) {
          callbackFn.call(thisArg, key, key, $__2);
        });
      },
      values: $traceurRuntime.initGeneratorFunction(function $__12() {
        var $__13,
            $__14;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                $__13 = $ctx.wrapYieldStar(this.map_.keys()[Symbol.iterator]());
                $ctx.sent = void 0;
                $ctx.action = 'next';
                $ctx.state = 12;
                break;
              case 12:
                $__14 = $__13[$ctx.action]($ctx.sentIgnoreThrow);
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = ($__14.done) ? 3 : 2;
                break;
              case 3:
                $ctx.sent = $__14.value;
                $ctx.state = -2;
                break;
              case 2:
                $ctx.state = 12;
                return $__14.value;
              default:
                return $ctx.end();
            }
        }, $__12, this);
      }),
      entries: $traceurRuntime.initGeneratorFunction(function $__15() {
        var $__16,
            $__17;
        return $traceurRuntime.createGeneratorInstance(function($ctx) {
          while (true)
            switch ($ctx.state) {
              case 0:
                $__16 = $ctx.wrapYieldStar(this.map_.entries()[Symbol.iterator]());
                $ctx.sent = void 0;
                $ctx.action = 'next';
                $ctx.state = 12;
                break;
              case 12:
                $__17 = $__16[$ctx.action]($ctx.sentIgnoreThrow);
                $ctx.state = 9;
                break;
              case 9:
                $ctx.state = ($__17.done) ? 3 : 2;
                break;
              case 3:
                $ctx.sent = $__17.value;
                $ctx.state = -2;
                break;
              case 2:
                $ctx.state = 12;
                return $__17.value;
              default:
                return $ctx.end();
            }
        }, $__15, this);
      })
    }, {});
  }();
  Object.defineProperty(Set.prototype, Symbol.iterator, {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  Object.defineProperty(Set.prototype, 'keys', {
    configurable: true,
    writable: true,
    value: Set.prototype.values
  });
  function needsPolyfill(global) {
    var $__11 = global,
        Set = $__11.Set,
        Symbol = $__11.Symbol;
    if (!Set || !$traceurRuntime.hasNativeSymbol() || !Set.prototype[Symbol.iterator] || !Set.prototype.values) {
      return true;
    }
    try {
      return new Set([1]).size !== 1;
    } catch (e) {
      return false;
    }
  }
  function polyfillSet(global) {
    if (needsPolyfill(global)) {
      global.Set = Set;
    }
  }
  registerPolyfill(polyfillSet);
  return {
    get Set() {
      return Set;
    },
    get polyfillSet() {
      return polyfillSet;
    }
  };
});
System.get("traceur@0.0.91/src/runtime/polyfills/Set.js" + '');
System.registerModule("traceur@0.0.91/node_modules/rsvp/lib/rsvp/asap.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/node_modules/rsvp/lib/rsvp/asap.js";
  var len = 0;
  function asap(callback, arg) {
    queue[len] = callback;
    queue[len + 1] = arg;
    len += 2;
    if (len === 2) {
      scheduleFlush();
    }
  }
  var $__default = asap;
  var browserGlobal = (typeof window !== 'undefined') ? window : {};
  var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
  var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
  function useNextTick() {
    return function() {
      process.nextTick(flush);
    };
  }
  function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, {characterData: true});
    return function() {
      node.data = (iterations = ++iterations % 2);
    };
  }
  function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function() {
      channel.port2.postMessage(0);
    };
  }
  function useSetTimeout() {
    return function() {
      setTimeout(flush, 1);
    };
  }
  var queue = new Array(1000);
  function flush() {
    for (var i = 0; i < len; i += 2) {
      var callback = queue[i];
      var arg = queue[i + 1];
      callback(arg);
      queue[i] = undefined;
      queue[i + 1] = undefined;
    }
    len = 0;
  }
  var scheduleFlush;
  if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
    scheduleFlush = useNextTick();
  } else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
  } else if (isWorker) {
    scheduleFlush = useMessageChannel();
  } else {
    scheduleFlush = useSetTimeout();
  }
  return {get default() {
      return $__default;
    }};
});
System.registerModule("traceur@0.0.91/src/runtime/polyfills/Promise.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/Promise.js";
  var async = System.get("traceur@0.0.91/node_modules/rsvp/lib/rsvp/asap.js").default;
  var registerPolyfill = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js").registerPolyfill;
  var promiseRaw = {};
  function isPromise(x) {
    return x && typeof x === 'object' && x.status_ !== undefined;
  }
  function idResolveHandler(x) {
    return x;
  }
  function idRejectHandler(x) {
    throw x;
  }
  function chain(promise) {
    var onResolve = arguments[1] !== (void 0) ? arguments[1] : idResolveHandler;
    var onReject = arguments[2] !== (void 0) ? arguments[2] : idRejectHandler;
    var deferred = getDeferred(promise.constructor);
    switch (promise.status_) {
      case undefined:
        throw TypeError;
      case 0:
        promise.onResolve_.push(onResolve, deferred);
        promise.onReject_.push(onReject, deferred);
        break;
      case +1:
        promiseEnqueue(promise.value_, [onResolve, deferred]);
        break;
      case -1:
        promiseEnqueue(promise.value_, [onReject, deferred]);
        break;
    }
    return deferred.promise;
  }
  function getDeferred(C) {
    if (this === $Promise) {
      var promise = promiseInit(new $Promise(promiseRaw));
      return {
        promise: promise,
        resolve: function(x) {
          promiseResolve(promise, x);
        },
        reject: function(r) {
          promiseReject(promise, r);
        }
      };
    } else {
      var result = {};
      result.promise = new C(function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
      });
      return result;
    }
  }
  function promiseSet(promise, status, value, onResolve, onReject) {
    promise.status_ = status;
    promise.value_ = value;
    promise.onResolve_ = onResolve;
    promise.onReject_ = onReject;
    return promise;
  }
  function promiseInit(promise) {
    return promiseSet(promise, 0, undefined, [], []);
  }
  var Promise = function() {
    function Promise(resolver) {
      if (resolver === promiseRaw)
        return;
      if (typeof resolver !== 'function')
        throw new TypeError;
      var promise = promiseInit(this);
      try {
        resolver(function(x) {
          promiseResolve(promise, x);
        }, function(r) {
          promiseReject(promise, r);
        });
      } catch (e) {
        promiseReject(promise, e);
      }
    }
    return ($traceurRuntime.createClass)(Promise, {
      catch: function(onReject) {
        return this.then(undefined, onReject);
      },
      then: function(onResolve, onReject) {
        if (typeof onResolve !== 'function')
          onResolve = idResolveHandler;
        if (typeof onReject !== 'function')
          onReject = idRejectHandler;
        var that = this;
        var constructor = this.constructor;
        return chain(this, function(x) {
          x = promiseCoerce(constructor, x);
          return x === that ? onReject(new TypeError) : isPromise(x) ? x.then(onResolve, onReject) : onResolve(x);
        }, onReject);
      }
    }, {
      resolve: function(x) {
        if (this === $Promise) {
          if (isPromise(x)) {
            return x;
          }
          return promiseSet(new $Promise(promiseRaw), +1, x);
        } else {
          return new this(function(resolve, reject) {
            resolve(x);
          });
        }
      },
      reject: function(r) {
        if (this === $Promise) {
          return promiseSet(new $Promise(promiseRaw), -1, r);
        } else {
          return new this(function(resolve, reject) {
            reject(r);
          });
        }
      },
      all: function(values) {
        var deferred = getDeferred(this);
        var resolutions = [];
        try {
          var makeCountdownFunction = function(i) {
            return function(x) {
              resolutions[i] = x;
              if (--count === 0)
                deferred.resolve(resolutions);
            };
          };
          var count = 0;
          var i = 0;
          var $__6 = true;
          var $__7 = false;
          var $__8 = undefined;
          try {
            for (var $__4 = void 0,
                $__3 = (values)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
              var value = $__4.value;
              {
                var countdownFunction = makeCountdownFunction(i);
                this.resolve(value).then(countdownFunction, function(r) {
                  deferred.reject(r);
                });
                ++i;
                ++count;
              }
            }
          } catch ($__9) {
            $__7 = true;
            $__8 = $__9;
          } finally {
            try {
              if (!$__6 && $__3.return != null) {
                $__3.return();
              }
            } finally {
              if ($__7) {
                throw $__8;
              }
            }
          }
          if (count === 0) {
            deferred.resolve(resolutions);
          }
        } catch (e) {
          deferred.reject(e);
        }
        return deferred.promise;
      },
      race: function(values) {
        var deferred = getDeferred(this);
        try {
          for (var i = 0; i < values.length; i++) {
            this.resolve(values[i]).then(function(x) {
              deferred.resolve(x);
            }, function(r) {
              deferred.reject(r);
            });
          }
        } catch (e) {
          deferred.reject(e);
        }
        return deferred.promise;
      }
    });
  }();
  var $Promise = Promise;
  var $PromiseReject = $Promise.reject;
  function promiseResolve(promise, x) {
    promiseDone(promise, +1, x, promise.onResolve_);
  }
  function promiseReject(promise, r) {
    promiseDone(promise, -1, r, promise.onReject_);
  }
  function promiseDone(promise, status, value, reactions) {
    if (promise.status_ !== 0)
      return;
    promiseEnqueue(value, reactions);
    promiseSet(promise, status, value);
  }
  function promiseEnqueue(value, tasks) {
    async(function() {
      for (var i = 0; i < tasks.length; i += 2) {
        promiseHandle(value, tasks[i], tasks[i + 1]);
      }
    });
  }
  function promiseHandle(value, handler, deferred) {
    try {
      var result = handler(value);
      if (result === deferred.promise)
        throw new TypeError;
      else if (isPromise(result))
        chain(result, deferred.resolve, deferred.reject);
      else
        deferred.resolve(result);
    } catch (e) {
      try {
        deferred.reject(e);
      } catch (e) {}
    }
  }
  var thenableSymbol = '@@thenable';
  function isObject(x) {
    return x && (typeof x === 'object' || typeof x === 'function');
  }
  function promiseCoerce(constructor, x) {
    if (!isPromise(x) && isObject(x)) {
      var then;
      try {
        then = x.then;
      } catch (r) {
        var promise = $PromiseReject.call(constructor, r);
        x[thenableSymbol] = promise;
        return promise;
      }
      if (typeof then === 'function') {
        var p = x[thenableSymbol];
        if (p) {
          return p;
        } else {
          var deferred = getDeferred(constructor);
          x[thenableSymbol] = deferred.promise;
          try {
            then.call(x, deferred.resolve, deferred.reject);
          } catch (r) {
            deferred.reject(r);
          }
          return deferred.promise;
        }
      }
    }
    return x;
  }
  function polyfillPromise(global) {
    if (!global.Promise)
      global.Promise = Promise;
  }
  registerPolyfill(polyfillPromise);
  return {
    get Promise() {
      return Promise;
    },
    get polyfillPromise() {
      return polyfillPromise;
    }
  };
});
System.get("traceur@0.0.91/src/runtime/polyfills/Promise.js" + '');
System.registerModule("traceur@0.0.91/src/runtime/polyfills/StringIterator.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/StringIterator.js";
  var $__0 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      createIteratorResultObject = $__0.createIteratorResultObject,
      isObject = $__0.isObject;
  var toProperty = $traceurRuntime.toProperty;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var iteratedString = Symbol('iteratedString');
  var stringIteratorNextIndex = Symbol('stringIteratorNextIndex');
  var StringIterator = function() {
    var $__2;
    function StringIterator() {}
    return ($traceurRuntime.createClass)(StringIterator, ($__2 = {}, Object.defineProperty($__2, "next", {
      value: function() {
        var o = this;
        if (!isObject(o) || !hasOwnProperty.call(o, iteratedString)) {
          throw new TypeError('this must be a StringIterator object');
        }
        var s = o[toProperty(iteratedString)];
        if (s === undefined) {
          return createIteratorResultObject(undefined, true);
        }
        var position = o[toProperty(stringIteratorNextIndex)];
        var len = s.length;
        if (position >= len) {
          o[toProperty(iteratedString)] = undefined;
          return createIteratorResultObject(undefined, true);
        }
        var first = s.charCodeAt(position);
        var resultString;
        if (first < 0xD800 || first > 0xDBFF || position + 1 === len) {
          resultString = String.fromCharCode(first);
        } else {
          var second = s.charCodeAt(position + 1);
          if (second < 0xDC00 || second > 0xDFFF) {
            resultString = String.fromCharCode(first);
          } else {
            resultString = String.fromCharCode(first) + String.fromCharCode(second);
          }
        }
        o[toProperty(stringIteratorNextIndex)] = position + resultString.length;
        return createIteratorResultObject(resultString, false);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__2), {});
  }();
  function createStringIterator(string) {
    var s = String(string);
    var iterator = Object.create(StringIterator.prototype);
    iterator[toProperty(iteratedString)] = s;
    iterator[toProperty(stringIteratorNextIndex)] = 0;
    return iterator;
  }
  return {get createStringIterator() {
      return createStringIterator;
    }};
});
System.registerModule("traceur@0.0.91/src/runtime/polyfills/String.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/String.js";
  var createStringIterator = System.get("traceur@0.0.91/src/runtime/polyfills/StringIterator.js").createStringIterator;
  var $__1 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill;
  var $toString = Object.prototype.toString;
  var $indexOf = String.prototype.indexOf;
  var $lastIndexOf = String.prototype.lastIndexOf;
  function startsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (isNaN(pos)) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    return $indexOf.call(string, searchString, pos) == start;
  }
  function endsWith(search) {
    var string = String(this);
    if (this == null || $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var pos = stringLength;
    if (arguments.length > 1) {
      var position = arguments[1];
      if (position !== undefined) {
        pos = position ? Number(position) : 0;
        if (isNaN(pos)) {
          pos = 0;
        }
      }
    }
    var end = Math.min(Math.max(pos, 0), stringLength);
    var start = end - searchLength;
    if (start < 0) {
      return false;
    }
    return $lastIndexOf.call(string, searchString, start) == start;
  }
  function includes(search) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    if (search && $toString.call(search) == '[object RegExp]') {
      throw TypeError();
    }
    var stringLength = string.length;
    var searchString = String(search);
    var searchLength = searchString.length;
    var position = arguments.length > 1 ? arguments[1] : undefined;
    var pos = position ? Number(position) : 0;
    if (pos != pos) {
      pos = 0;
    }
    var start = Math.min(Math.max(pos, 0), stringLength);
    if (searchLength + start > stringLength) {
      return false;
    }
    return $indexOf.call(string, searchString, pos) != -1;
  }
  function repeat(count) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var n = count ? Number(count) : 0;
    if (isNaN(n)) {
      n = 0;
    }
    if (n < 0 || n == Infinity) {
      throw RangeError();
    }
    if (n == 0) {
      return '';
    }
    var result = '';
    while (n--) {
      result += string;
    }
    return result;
  }
  function codePointAt(position) {
    if (this == null) {
      throw TypeError();
    }
    var string = String(this);
    var size = string.length;
    var index = position ? Number(position) : 0;
    if (isNaN(index)) {
      index = 0;
    }
    if (index < 0 || index >= size) {
      return undefined;
    }
    var first = string.charCodeAt(index);
    var second;
    if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
      second = string.charCodeAt(index + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) {
        return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
      }
    }
    return first;
  }
  function raw(callsite) {
    var raw = callsite.raw;
    var len = raw.length >>> 0;
    if (len === 0)
      return '';
    var s = '';
    var i = 0;
    while (true) {
      s += raw[i];
      if (i + 1 === len)
        return s;
      s += arguments[++i];
    }
  }
  function fromCodePoint(_) {
    var codeUnits = [];
    var floor = Math.floor;
    var highSurrogate;
    var lowSurrogate;
    var index = -1;
    var length = arguments.length;
    if (!length) {
      return '';
    }
    while (++index < length) {
      var codePoint = Number(arguments[index]);
      if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || floor(codePoint) != codePoint) {
        throw RangeError('Invalid code point: ' + codePoint);
      }
      if (codePoint <= 0xFFFF) {
        codeUnits.push(codePoint);
      } else {
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xD800;
        lowSurrogate = (codePoint % 0x400) + 0xDC00;
        codeUnits.push(highSurrogate, lowSurrogate);
      }
    }
    return String.fromCharCode.apply(null, codeUnits);
  }
  function stringPrototypeIterator() {
    var o = $traceurRuntime.checkObjectCoercible(this);
    var s = String(o);
    return createStringIterator(s);
  }
  function polyfillString(global) {
    var String = global.String;
    maybeAddFunctions(String.prototype, ['codePointAt', codePointAt, 'endsWith', endsWith, 'includes', includes, 'repeat', repeat, 'startsWith', startsWith]);
    maybeAddFunctions(String, ['fromCodePoint', fromCodePoint, 'raw', raw]);
    maybeAddIterator(String.prototype, stringPrototypeIterator, Symbol);
  }
  registerPolyfill(polyfillString);
  return {
    get startsWith() {
      return startsWith;
    },
    get endsWith() {
      return endsWith;
    },
    get includes() {
      return includes;
    },
    get repeat() {
      return repeat;
    },
    get codePointAt() {
      return codePointAt;
    },
    get raw() {
      return raw;
    },
    get fromCodePoint() {
      return fromCodePoint;
    },
    get stringPrototypeIterator() {
      return stringPrototypeIterator;
    },
    get polyfillString() {
      return polyfillString;
    }
  };
});
System.get("traceur@0.0.91/src/runtime/polyfills/String.js" + '');
System.registerModule("traceur@0.0.91/src/runtime/polyfills/ArrayIterator.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/ArrayIterator.js";
  var $__0 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      toObject = $__0.toObject,
      toUint32 = $__0.toUint32,
      createIteratorResultObject = $__0.createIteratorResultObject;
  var ARRAY_ITERATOR_KIND_KEYS = 1;
  var ARRAY_ITERATOR_KIND_VALUES = 2;
  var ARRAY_ITERATOR_KIND_ENTRIES = 3;
  var ArrayIterator = function() {
    var $__2;
    function ArrayIterator() {}
    return ($traceurRuntime.createClass)(ArrayIterator, ($__2 = {}, Object.defineProperty($__2, "next", {
      value: function() {
        var iterator = toObject(this);
        var array = iterator.iteratorObject_;
        if (!array) {
          throw new TypeError('Object is not an ArrayIterator');
        }
        var index = iterator.arrayIteratorNextIndex_;
        var itemKind = iterator.arrayIterationKind_;
        var length = toUint32(array.length);
        if (index >= length) {
          iterator.arrayIteratorNextIndex_ = Infinity;
          return createIteratorResultObject(undefined, true);
        }
        iterator.arrayIteratorNextIndex_ = index + 1;
        if (itemKind == ARRAY_ITERATOR_KIND_VALUES)
          return createIteratorResultObject(array[index], false);
        if (itemKind == ARRAY_ITERATOR_KIND_ENTRIES)
          return createIteratorResultObject([index, array[index]], false);
        return createIteratorResultObject(index, false);
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__2, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__2), {});
  }();
  function createArrayIterator(array, kind) {
    var object = toObject(array);
    var iterator = new ArrayIterator;
    iterator.iteratorObject_ = object;
    iterator.arrayIteratorNextIndex_ = 0;
    iterator.arrayIterationKind_ = kind;
    return iterator;
  }
  function entries() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_ENTRIES);
  }
  function keys() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_KEYS);
  }
  function values() {
    return createArrayIterator(this, ARRAY_ITERATOR_KIND_VALUES);
  }
  return {
    get entries() {
      return entries;
    },
    get keys() {
      return keys;
    },
    get values() {
      return values;
    }
  };
});
System.registerModule("traceur@0.0.91/src/runtime/polyfills/Array.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/Array.js";
  var $__0 = System.get("traceur@0.0.91/src/runtime/polyfills/ArrayIterator.js"),
      entries = $__0.entries,
      keys = $__0.keys,
      jsValues = $__0.values;
  var $__1 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      checkIterable = $__1.checkIterable,
      isCallable = $__1.isCallable,
      isConstructor = $__1.isConstructor,
      maybeAddFunctions = $__1.maybeAddFunctions,
      maybeAddIterator = $__1.maybeAddIterator,
      registerPolyfill = $__1.registerPolyfill,
      toInteger = $__1.toInteger,
      toLength = $__1.toLength,
      toObject = $__1.toObject;
  function from(arrLike) {
    var mapFn = arguments[1];
    var thisArg = arguments[2];
    var C = this;
    var items = toObject(arrLike);
    var mapping = mapFn !== undefined;
    var k = 0;
    var arr,
        len;
    if (mapping && !isCallable(mapFn)) {
      throw TypeError();
    }
    if (checkIterable(items)) {
      arr = isConstructor(C) ? new C() : [];
      var $__5 = true;
      var $__6 = false;
      var $__7 = undefined;
      try {
        for (var $__3 = void 0,
            $__2 = (items)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
          var item = $__3.value;
          {
            if (mapping) {
              arr[k] = mapFn.call(thisArg, item, k);
            } else {
              arr[k] = item;
            }
            k++;
          }
        }
      } catch ($__8) {
        $__6 = true;
        $__7 = $__8;
      } finally {
        try {
          if (!$__5 && $__2.return != null) {
            $__2.return();
          }
        } finally {
          if ($__6) {
            throw $__7;
          }
        }
      }
      arr.length = k;
      return arr;
    }
    len = toLength(items.length);
    arr = isConstructor(C) ? new C(len) : new Array(len);
    for (; k < len; k++) {
      if (mapping) {
        arr[k] = typeof thisArg === 'undefined' ? mapFn(items[k], k) : mapFn.call(thisArg, items[k], k);
      } else {
        arr[k] = items[k];
      }
    }
    arr.length = len;
    return arr;
  }
  function of() {
    for (var items = [],
        $__9 = 0; $__9 < arguments.length; $__9++)
      items[$__9] = arguments[$__9];
    var C = this;
    var len = items.length;
    var arr = isConstructor(C) ? new C(len) : new Array(len);
    for (var k = 0; k < len; k++) {
      arr[k] = items[k];
    }
    arr.length = len;
    return arr;
  }
  function fill(value) {
    var start = arguments[1] !== (void 0) ? arguments[1] : 0;
    var end = arguments[2];
    var object = toObject(this);
    var len = toLength(object.length);
    var fillStart = toInteger(start);
    var fillEnd = end !== undefined ? toInteger(end) : len;
    fillStart = fillStart < 0 ? Math.max(len + fillStart, 0) : Math.min(fillStart, len);
    fillEnd = fillEnd < 0 ? Math.max(len + fillEnd, 0) : Math.min(fillEnd, len);
    while (fillStart < fillEnd) {
      object[fillStart] = value;
      fillStart++;
    }
    return object;
  }
  function find(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg);
  }
  function findIndex(predicate) {
    var thisArg = arguments[1];
    return findHelper(this, predicate, thisArg, true);
  }
  function findHelper(self, predicate) {
    var thisArg = arguments[2];
    var returnIndex = arguments[3] !== (void 0) ? arguments[3] : false;
    var object = toObject(self);
    var len = toLength(object.length);
    if (!isCallable(predicate)) {
      throw TypeError();
    }
    for (var i = 0; i < len; i++) {
      var value = object[i];
      if (predicate.call(thisArg, value, i, object)) {
        return returnIndex ? i : value;
      }
    }
    return returnIndex ? -1 : undefined;
  }
  function polyfillArray(global) {
    var $__10 = global,
        Array = $__10.Array,
        Object = $__10.Object,
        Symbol = $__10.Symbol;
    var values = jsValues;
    if (Symbol && Symbol.iterator && Array.prototype[Symbol.iterator]) {
      values = Array.prototype[Symbol.iterator];
    }
    maybeAddFunctions(Array.prototype, ['entries', entries, 'keys', keys, 'values', values, 'fill', fill, 'find', find, 'findIndex', findIndex]);
    maybeAddFunctions(Array, ['from', from, 'of', of]);
    maybeAddIterator(Array.prototype, values, Symbol);
    maybeAddIterator(Object.getPrototypeOf([].values()), function() {
      return this;
    }, Symbol);
  }
  registerPolyfill(polyfillArray);
  return {
    get from() {
      return from;
    },
    get of() {
      return of;
    },
    get fill() {
      return fill;
    },
    get find() {
      return find;
    },
    get findIndex() {
      return findIndex;
    },
    get polyfillArray() {
      return polyfillArray;
    }
  };
});
System.get("traceur@0.0.91/src/runtime/polyfills/Array.js" + '');
System.registerModule("traceur@0.0.91/src/runtime/polyfills/Object.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/Object.js";
  var $__0 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill;
  var $__1 = $traceurRuntime,
      defineProperty = $__1.defineProperty,
      getOwnPropertyDescriptor = $__1.getOwnPropertyDescriptor,
      getOwnPropertyNames = $__1.getOwnPropertyNames,
      isPrivateName = $__1.isPrivateName,
      keys = $__1.keys;
  function is(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    return left !== left && right !== right;
  }
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      var props = source == null ? [] : keys(source);
      var p = void 0,
          length = props.length;
      for (p = 0; p < length; p++) {
        var name = props[p];
        if (isPrivateName(name))
          continue;
        target[name] = source[name];
      }
    }
    return target;
  }
  function mixin(target, source) {
    var props = getOwnPropertyNames(source);
    var p,
        descriptor,
        length = props.length;
    for (p = 0; p < length; p++) {
      var name = props[p];
      if (isPrivateName(name))
        continue;
      descriptor = getOwnPropertyDescriptor(source, props[p]);
      defineProperty(target, props[p], descriptor);
    }
    return target;
  }
  function polyfillObject(global) {
    var Object = global.Object;
    maybeAddFunctions(Object, ['assign', assign, 'is', is, 'mixin', mixin]);
  }
  registerPolyfill(polyfillObject);
  return {
    get is() {
      return is;
    },
    get assign() {
      return assign;
    },
    get mixin() {
      return mixin;
    },
    get polyfillObject() {
      return polyfillObject;
    }
  };
});
System.get("traceur@0.0.91/src/runtime/polyfills/Object.js" + '');
System.registerModule("traceur@0.0.91/src/runtime/polyfills/Number.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/Number.js";
  var $__0 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      isNumber = $__0.isNumber,
      maybeAddConsts = $__0.maybeAddConsts,
      maybeAddFunctions = $__0.maybeAddFunctions,
      registerPolyfill = $__0.registerPolyfill,
      toInteger = $__0.toInteger;
  var $abs = Math.abs;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
  var MIN_SAFE_INTEGER = -Math.pow(2, 53) + 1;
  var EPSILON = Math.pow(2, -52);
  function NumberIsFinite(number) {
    return isNumber(number) && $isFinite(number);
  }
  function isInteger(number) {
    return NumberIsFinite(number) && toInteger(number) === number;
  }
  function NumberIsNaN(number) {
    return isNumber(number) && $isNaN(number);
  }
  function isSafeInteger(number) {
    if (NumberIsFinite(number)) {
      var integral = toInteger(number);
      if (integral === number)
        return $abs(integral) <= MAX_SAFE_INTEGER;
    }
    return false;
  }
  function polyfillNumber(global) {
    var Number = global.Number;
    maybeAddConsts(Number, ['MAX_SAFE_INTEGER', MAX_SAFE_INTEGER, 'MIN_SAFE_INTEGER', MIN_SAFE_INTEGER, 'EPSILON', EPSILON]);
    maybeAddFunctions(Number, ['isFinite', NumberIsFinite, 'isInteger', isInteger, 'isNaN', NumberIsNaN, 'isSafeInteger', isSafeInteger]);
  }
  registerPolyfill(polyfillNumber);
  return {
    get MAX_SAFE_INTEGER() {
      return MAX_SAFE_INTEGER;
    },
    get MIN_SAFE_INTEGER() {
      return MIN_SAFE_INTEGER;
    },
    get EPSILON() {
      return EPSILON;
    },
    get isFinite() {
      return NumberIsFinite;
    },
    get isInteger() {
      return isInteger;
    },
    get isNaN() {
      return NumberIsNaN;
    },
    get isSafeInteger() {
      return isSafeInteger;
    },
    get polyfillNumber() {
      return polyfillNumber;
    }
  };
});
System.get("traceur@0.0.91/src/runtime/polyfills/Number.js" + '');
System.registerModule("traceur@0.0.91/src/runtime/polyfills/fround.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/fround.js";
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__0 = Math,
      LN2 = $__0.LN2,
      abs = $__0.abs,
      floor = $__0.floor,
      log = $__0.log,
      min = $__0.min,
      pow = $__0.pow;
  function packIEEE754(v, ebits, fbits) {
    var bias = (1 << (ebits - 1)) - 1,
        s,
        e,
        f,
        ln,
        i,
        bits,
        str,
        bytes;
    function roundToEven(n) {
      var w = floor(n),
          f = n - w;
      if (f < 0.5)
        return w;
      if (f > 0.5)
        return w + 1;
      return w % 2 ? w + 1 : w;
    }
    if (v !== v) {
      e = (1 << ebits) - 1;
      f = pow(2, fbits - 1);
      s = 0;
    } else if (v === Infinity || v === -Infinity) {
      e = (1 << ebits) - 1;
      f = 0;
      s = (v < 0) ? 1 : 0;
    } else if (v === 0) {
      e = 0;
      f = 0;
      s = (1 / v === -Infinity) ? 1 : 0;
    } else {
      s = v < 0;
      v = abs(v);
      if (v >= pow(2, 1 - bias)) {
        e = min(floor(log(v) / LN2), 1023);
        f = roundToEven(v / pow(2, e) * pow(2, fbits));
        if (f / pow(2, fbits) >= 2) {
          e = e + 1;
          f = 1;
        }
        if (e > bias) {
          e = (1 << ebits) - 1;
          f = 0;
        } else {
          e = e + bias;
          f = f - pow(2, fbits);
        }
      } else {
        e = 0;
        f = roundToEven(v / pow(2, 1 - bias - fbits));
      }
    }
    bits = [];
    for (i = fbits; i; i -= 1) {
      bits.push(f % 2 ? 1 : 0);
      f = floor(f / 2);
    }
    for (i = ebits; i; i -= 1) {
      bits.push(e % 2 ? 1 : 0);
      e = floor(e / 2);
    }
    bits.push(s ? 1 : 0);
    bits.reverse();
    str = bits.join('');
    bytes = [];
    while (str.length) {
      bytes.push(parseInt(str.substring(0, 8), 2));
      str = str.substring(8);
    }
    return bytes;
  }
  function unpackIEEE754(bytes, ebits, fbits) {
    var bits = [],
        i,
        j,
        b,
        str,
        bias,
        s,
        e,
        f;
    for (i = bytes.length; i; i -= 1) {
      b = bytes[i - 1];
      for (j = 8; j; j -= 1) {
        bits.push(b % 2 ? 1 : 0);
        b = b >> 1;
      }
    }
    bits.reverse();
    str = bits.join('');
    bias = (1 << (ebits - 1)) - 1;
    s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
    e = parseInt(str.substring(1, 1 + ebits), 2);
    f = parseInt(str.substring(1 + ebits), 2);
    if (e === (1 << ebits) - 1) {
      return f !== 0 ? NaN : s * Infinity;
    } else if (e > 0) {
      return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
    } else if (f !== 0) {
      return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
    } else {
      return s < 0 ? -0 : 0;
    }
  }
  function unpackF32(b) {
    return unpackIEEE754(b, 8, 23);
  }
  function packF32(v) {
    return packIEEE754(v, 8, 23);
  }
  function fround(x) {
    if (x === 0 || !$isFinite(x) || $isNaN(x)) {
      return x;
    }
    return unpackF32(packF32(Number(x)));
  }
  return {get fround() {
      return fround;
    }};
});
System.registerModule("traceur@0.0.91/src/runtime/polyfills/Math.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/Math.js";
  var jsFround = System.get("traceur@0.0.91/src/runtime/polyfills/fround.js").fround;
  var $__1 = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js"),
      maybeAddFunctions = $__1.maybeAddFunctions,
      registerPolyfill = $__1.registerPolyfill,
      toUint32 = $__1.toUint32;
  var $isFinite = isFinite;
  var $isNaN = isNaN;
  var $__2 = Math,
      abs = $__2.abs,
      ceil = $__2.ceil,
      exp = $__2.exp,
      floor = $__2.floor,
      log = $__2.log,
      pow = $__2.pow,
      sqrt = $__2.sqrt;
  function clz32(x) {
    x = toUint32(+x);
    if (x == 0)
      return 32;
    var result = 0;
    if ((x & 0xFFFF0000) === 0) {
      x <<= 16;
      result += 16;
    }
    ;
    if ((x & 0xFF000000) === 0) {
      x <<= 8;
      result += 8;
    }
    ;
    if ((x & 0xF0000000) === 0) {
      x <<= 4;
      result += 4;
    }
    ;
    if ((x & 0xC0000000) === 0) {
      x <<= 2;
      result += 2;
    }
    ;
    if ((x & 0x80000000) === 0) {
      x <<= 1;
      result += 1;
    }
    ;
    return result;
  }
  function imul(x, y) {
    x = toUint32(+x);
    y = toUint32(+y);
    var xh = (x >>> 16) & 0xffff;
    var xl = x & 0xffff;
    var yh = (y >>> 16) & 0xffff;
    var yl = y & 0xffff;
    return xl * yl + (((xh * yl + xl * yh) << 16) >>> 0) | 0;
  }
  function sign(x) {
    x = +x;
    if (x > 0)
      return 1;
    if (x < 0)
      return -1;
    return x;
  }
  function log10(x) {
    return log(x) * 0.434294481903251828;
  }
  function log2(x) {
    return log(x) * 1.442695040888963407;
  }
  function log1p(x) {
    x = +x;
    if (x < -1 || $isNaN(x)) {
      return NaN;
    }
    if (x === 0 || x === Infinity) {
      return x;
    }
    if (x === -1) {
      return -Infinity;
    }
    var result = 0;
    var n = 50;
    if (x < 0 || x > 1) {
      return log(1 + x);
    }
    for (var i = 1; i < n; i++) {
      if ((i % 2) === 0) {
        result -= pow(x, i) / i;
      } else {
        result += pow(x, i) / i;
      }
    }
    return result;
  }
  function expm1(x) {
    x = +x;
    if (x === -Infinity) {
      return -1;
    }
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return exp(x) - 1;
  }
  function cosh(x) {
    x = +x;
    if (x === 0) {
      return 1;
    }
    if ($isNaN(x)) {
      return NaN;
    }
    if (!$isFinite(x)) {
      return Infinity;
    }
    if (x < 0) {
      x = -x;
    }
    if (x > 21) {
      return exp(x) / 2;
    }
    return (exp(x) + exp(-x)) / 2;
  }
  function sinh(x) {
    x = +x;
    if (!$isFinite(x) || x === 0) {
      return x;
    }
    return (exp(x) - exp(-x)) / 2;
  }
  function tanh(x) {
    x = +x;
    if (x === 0)
      return x;
    if (!$isFinite(x))
      return sign(x);
    var exp1 = exp(x);
    var exp2 = exp(-x);
    return (exp1 - exp2) / (exp1 + exp2);
  }
  function acosh(x) {
    x = +x;
    if (x < 1)
      return NaN;
    if (!$isFinite(x))
      return x;
    return log(x + sqrt(x + 1) * sqrt(x - 1));
  }
  function asinh(x) {
    x = +x;
    if (x === 0 || !$isFinite(x))
      return x;
    if (x > 0)
      return log(x + sqrt(x * x + 1));
    return -log(-x + sqrt(x * x + 1));
  }
  function atanh(x) {
    x = +x;
    if (x === -1) {
      return -Infinity;
    }
    if (x === 1) {
      return Infinity;
    }
    if (x === 0) {
      return x;
    }
    if ($isNaN(x) || x < -1 || x > 1) {
      return NaN;
    }
    return 0.5 * log((1 + x) / (1 - x));
  }
  function hypot(x, y) {
    var length = arguments.length;
    var args = new Array(length);
    var max = 0;
    for (var i = 0; i < length; i++) {
      var n = arguments[i];
      n = +n;
      if (n === Infinity || n === -Infinity)
        return Infinity;
      n = abs(n);
      if (n > max)
        max = n;
      args[i] = n;
    }
    if (max === 0)
      max = 1;
    var sum = 0;
    var compensation = 0;
    for (var i = 0; i < length; i++) {
      var n = args[i] / max;
      var summand = n * n - compensation;
      var preliminary = sum + summand;
      compensation = (preliminary - sum) - summand;
      sum = preliminary;
    }
    return sqrt(sum) * max;
  }
  function trunc(x) {
    x = +x;
    if (x > 0)
      return floor(x);
    if (x < 0)
      return ceil(x);
    return x;
  }
  var fround,
      f32;
  if (typeof Float32Array === 'function') {
    f32 = new Float32Array(1);
    fround = function(x) {
      f32[0] = Number(x);
      return f32[0];
    };
  } else {
    fround = jsFround;
  }
  function cbrt(x) {
    x = +x;
    if (x === 0)
      return x;
    var negate = x < 0;
    if (negate)
      x = -x;
    var result = pow(x, 1 / 3);
    return negate ? -result : result;
  }
  function polyfillMath(global) {
    var Math = global.Math;
    maybeAddFunctions(Math, ['acosh', acosh, 'asinh', asinh, 'atanh', atanh, 'cbrt', cbrt, 'clz32', clz32, 'cosh', cosh, 'expm1', expm1, 'fround', fround, 'hypot', hypot, 'imul', imul, 'log10', log10, 'log1p', log1p, 'log2', log2, 'sign', sign, 'sinh', sinh, 'tanh', tanh, 'trunc', trunc]);
  }
  registerPolyfill(polyfillMath);
  return {
    get clz32() {
      return clz32;
    },
    get imul() {
      return imul;
    },
    get sign() {
      return sign;
    },
    get log10() {
      return log10;
    },
    get log2() {
      return log2;
    },
    get log1p() {
      return log1p;
    },
    get expm1() {
      return expm1;
    },
    get cosh() {
      return cosh;
    },
    get sinh() {
      return sinh;
    },
    get tanh() {
      return tanh;
    },
    get acosh() {
      return acosh;
    },
    get asinh() {
      return asinh;
    },
    get atanh() {
      return atanh;
    },
    get hypot() {
      return hypot;
    },
    get trunc() {
      return trunc;
    },
    get fround() {
      return fround;
    },
    get cbrt() {
      return cbrt;
    },
    get polyfillMath() {
      return polyfillMath;
    }
  };
});
System.get("traceur@0.0.91/src/runtime/polyfills/Math.js" + '');
System.registerModule("traceur@0.0.91/src/runtime/polyfills/polyfills.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/runtime/polyfills/polyfills.js";
  var polyfillAll = System.get("traceur@0.0.91/src/runtime/polyfills/utils.js").polyfillAll;
  polyfillAll(Reflect.global);
  var setupGlobals = $traceurRuntime.setupGlobals;
  $traceurRuntime.setupGlobals = function(global) {
    setupGlobals(global);
    polyfillAll(global);
  };
  return {};
});
System.get("traceur@0.0.91/src/runtime/polyfills/polyfills.js" + '');
System.registerModule("traceur@0.0.91/src/Options.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/Options.js";
  function enumerableOnlyObject(obj) {
    var result = Object.create(null);
    Object.keys(obj).forEach(function(key) {
      Object.defineProperty(result, key, {
        enumerable: true,
        value: obj[key]
      });
    });
    return result;
  }
  var optionsV01 = enumerableOnlyObject({
    annotations: false,
    arrayComprehension: false,
    arrowFunctions: true,
    asyncFunctions: false,
    asyncGenerators: false,
    blockBinding: true,
    classes: true,
    commentCallback: false,
    computedPropertyNames: true,
    debug: false,
    debugNames: false,
    defaultParameters: true,
    destructuring: true,
    exponentiation: false,
    exportFromExtended: false,
    forOf: true,
    forOn: false,
    freeVariableChecker: false,
    generatorComprehension: false,
    generators: true,
    inputSourceMap: false,
    lowResolutionSourceMap: false,
    memberVariables: false,
    moduleName: 'default',
    modules: 'bootstrap',
    numericLiterals: true,
    outputLanguage: 'es5',
    properTailCalls: false,
    propertyMethods: true,
    propertyNameShorthand: true,
    referrer: '',
    require: false,
    restParameters: true,
    script: false,
    sourceMaps: false,
    sourceRoot: false,
    spread: true,
    symbols: false,
    templateLiterals: true,
    typeAssertionModule: null,
    typeAssertions: false,
    types: false,
    unicodeEscapeSequences: true,
    unicodeExpressions: true,
    validate: false
  });
  var versionLockedOptions = optionsV01;
  var defaultValues = Object.create(null);
  var featureOptions = Object.create(null);
  var experimentalOptions = Object.create(null);
  var moduleOptions = ['amd', 'commonjs', 'closure', 'instantiate', 'inline', 'bootstrap'];
  var EXPERIMENTAL = 0;
  var ON_BY_DEFAULT = 1;
  function addFeatureOption(name, kind) {
    featureOptions[name] = true;
    if (kind === EXPERIMENTAL)
      experimentalOptions[name] = true;
    var defaultValue = kind === ON_BY_DEFAULT;
    defaultValues[name] = defaultValue;
  }
  function addBoolOption(name) {
    defaultValues[name] = false;
  }
  addFeatureOption('arrowFunctions', ON_BY_DEFAULT);
  addFeatureOption('blockBinding', ON_BY_DEFAULT);
  addFeatureOption('classes', ON_BY_DEFAULT);
  addFeatureOption('computedPropertyNames', ON_BY_DEFAULT);
  addFeatureOption('defaultParameters', ON_BY_DEFAULT);
  addFeatureOption('destructuring', ON_BY_DEFAULT);
  addFeatureOption('forOf', ON_BY_DEFAULT);
  addFeatureOption('generators', ON_BY_DEFAULT);
  addFeatureOption('modules', 'SPECIAL');
  addFeatureOption('numericLiterals', ON_BY_DEFAULT);
  addFeatureOption('propertyMethods', ON_BY_DEFAULT);
  addFeatureOption('propertyNameShorthand', ON_BY_DEFAULT);
  addFeatureOption('restParameters', ON_BY_DEFAULT);
  addFeatureOption('sourceMaps', 'SPECIAL');
  addFeatureOption('spread', ON_BY_DEFAULT);
  addFeatureOption('templateLiterals', ON_BY_DEFAULT);
  addFeatureOption('unicodeEscapeSequences', ON_BY_DEFAULT);
  addFeatureOption('unicodeExpressions', ON_BY_DEFAULT);
  addFeatureOption('properTailCalls', EXPERIMENTAL);
  addFeatureOption('symbols', EXPERIMENTAL);
  addFeatureOption('annotations', EXPERIMENTAL);
  addFeatureOption('arrayComprehension', EXPERIMENTAL);
  addFeatureOption('asyncFunctions', EXPERIMENTAL);
  addFeatureOption('asyncGenerators', EXPERIMENTAL);
  addFeatureOption('exponentiation', EXPERIMENTAL);
  addFeatureOption('exportFromExtended', EXPERIMENTAL);
  addFeatureOption('forOn', EXPERIMENTAL);
  addFeatureOption('generatorComprehension', EXPERIMENTAL);
  addFeatureOption('memberVariables', EXPERIMENTAL);
  addFeatureOption('require', EXPERIMENTAL);
  addFeatureOption('types', EXPERIMENTAL);
  var transformOptionsPrototype = {};
  Object.keys(featureOptions).forEach(function(name) {
    Object.defineProperty(transformOptionsPrototype, name, {
      get: function() {
        var v = this.proxiedOptions_[name];
        if (v === 'parse')
          return false;
        return v;
      },
      enumerable: true
    });
  });
  var parseOptionsPrototype = {};
  Object.keys(featureOptions).forEach(function(name) {
    Object.defineProperty(parseOptionsPrototype, name, {
      get: function() {
        return !!this.proxiedOptions_[name];
      },
      enumerable: true
    });
  });
  addBoolOption('commentCallback');
  addBoolOption('debug');
  addBoolOption('debugNames');
  addBoolOption('freeVariableChecker');
  addBoolOption('script');
  addBoolOption('typeAssertions');
  addBoolOption('validate');
  var Options = function() {
    function Options() {
      var options = arguments[0] !== (void 0) ? arguments[0] : Object.create(null);
      this.reset();
      Object.defineProperties(this, {
        modules_: {
          value: versionLockedOptions.modules,
          writable: true,
          enumerable: false
        },
        sourceMaps_: {
          value: versionLockedOptions.sourceMaps,
          writable: true,
          enumerable: false
        },
        sourceRoot_: {
          value: versionLockedOptions.sourceRoot,
          writable: true,
          enumerable: false
        },
        transformOptions: {
          value: Object.create(transformOptionsPrototype, {proxiedOptions_: {
              value: this,
              enumerable: false
            }}),
          enumerable: false
        },
        parseOptions: {
          value: Object.create(parseOptionsPrototype, {proxiedOptions_: {
              value: this,
              enumerable: false
            }}),
          enumerable: false
        }
      });
      this.setFromObject(options);
    }
    return ($traceurRuntime.createClass)(Options, {
      set experimental(v) {
        var $__0 = this;
        v = coerceOptionValue(v);
        Object.keys(experimentalOptions).forEach(function(name) {
          $__0[name] = v;
        });
      },
      get experimental() {
        var $__0 = this;
        var value;
        Object.keys(experimentalOptions).every(function(name) {
          var currentValue = $__0[name];
          if (value === undefined) {
            value = currentValue;
            return true;
          }
          if (currentValue !== value) {
            value = null;
            return false;
          }
          return true;
        });
        return value;
      },
      get atscript() {
        return this.types && this.annotations && this.memberVariables;
      },
      set atscript(value) {
        this.types = value;
        this.annotations = value;
        this.memberVariables = value;
      },
      get modules() {
        return this.modules_;
      },
      set modules(value) {
        if (typeof value === 'boolean' && !value)
          value = 'bootstrap';
        if (moduleOptions.indexOf(value) === -1) {
          throw new Error('Invalid \'modules\' option \'' + value + '\', not in ' + moduleOptions.join(', '));
        }
        this.modules_ = value;
      },
      get sourceMaps() {
        return this.sourceMaps_;
      },
      set sourceMaps(value) {
        if (value === null || typeof value === 'boolean') {
          this.sourceMaps_ = value ? 'file' : false;
          return;
        }
        if (value === 'file' || value === 'inline' || value === 'memory') {
          this.sourceMaps_ = value;
        } else {
          throw new Error('Option sourceMaps should be ' + '[false|inline|file|memory], not ' + value);
        }
      },
      reset: function() {
        var allOff = arguments[0];
        var $__0 = this;
        var useDefault = allOff === undefined;
        Object.keys(defaultValues).forEach(function(name) {
          $__0[name] = useDefault && defaultValues[name];
        });
        this.setDefaults();
      },
      setDefaults: function() {
        this.modules = 'bootstrap';
        this.moduleName = 'default';
        this.outputLanguage = 'es5';
        this.referrer = '';
        this.sourceMaps = false;
        this.sourceRoot = false;
        this.lowResolutionSourceMap = false;
        this.inputSourceMap = false;
        this.typeAssertionModule = null;
      },
      setFromObject: function(object) {
        var $__0 = this;
        Object.keys(this).forEach(function(name) {
          if (name in object)
            $__0.setOption(name, object[name]);
        });
        this.modules = object.modules || this.modules;
        if (typeof object.sourceMaps === 'boolean' || typeof object.sourceMaps === 'string') {
          this.sourceMaps = object.sourceMaps;
        }
        if (object.sourceRoot !== undefined)
          this.sourceRoot = object.sourceRoot;
        return this;
      },
      setOption: function(name, value) {
        name = toCamelCase(name);
        if (name in this) {
          this[name] = value;
        } else {
          throw Error('Unknown option: ' + name);
        }
      },
      diff: function(ref) {
        var $__0 = this;
        var mismatches = [];
        Object.keys(this).forEach(function(key) {
          if ($__0[key] !== ref[key]) {
            mismatches.push({
              key: key,
              now: $traceurRuntime.options[key],
              v01: ref[key]
            });
          }
        });
        return mismatches;
      }
    }, {
      experimental: function() {
        return new Options(experimentalOptions);
      },
      atscript: function() {
        return new Options({
          types: true,
          annotations: true,
          memberVariables: true
        });
      },
      listUnknownOptions: function(obj) {
        var unknowns = [];
        Object.keys(obj).forEach(function(propName) {
          if (!(propName in optionsV01)) {
            unknowns.push(propName);
          }
        });
        return unknowns;
      }
    });
  }();
  ;
  var descriptions = {
    experimental: 'Turns on all experimental features',
    require: 'Generate require function argument for node when modules=register',
    sourceMaps: 'Generate source map and (\'file\') write to .map' + ' or (\'inline\') append data URL'
  };
  var CommandOptions = function($__super) {
    function CommandOptions() {
      $traceurRuntime.superConstructor(CommandOptions).apply(this, arguments);
    }
    return ($traceurRuntime.createClass)(CommandOptions, {
      parseCommand: function(s) {
        var re = /--([^=]+)(?:=(.+))?/;
        var m = re.exec(s);
        if (m)
          this.setOptionCoerced(m[1], m[2]);
      },
      setOptionCoerced: function(name, value) {
        if (typeof value !== 'undefined' && value !== null)
          value = coerceOptionValue(value);
        else
          value = true;
        this.setOption(name, value);
      }
    }, {
      fromString: function(s) {
        return CommandOptions.fromArgv(s.split(/\s+/));
      },
      fromArgv: function(args) {
        var options = new CommandOptions();
        args.forEach(function(arg) {
          return options.parseCommand(arg);
        });
        return options;
      }
    }, $__super);
  }(Options);
  function coerceOptionValue(v) {
    switch (v) {
      case 'false':
        return false;
      case 'true':
      case true:
        return true;
      default:
        return !!v && String(v);
    }
  }
  function toCamelCase(s) {
    return s.replace(/-\w/g, function(ch) {
      return ch[1].toUpperCase();
    });
  }
  function toDashCase(s) {
    return s.replace(/[A-Z]/g, function(ch) {
      return '-' + ch.toLowerCase();
    });
  }
  function addOptions(flags, commandOptions) {
    flags.option('--referrer <name>', 'Bracket output code with System.referrerName=<name>', function(name) {
      commandOptions.setOption('referrer', name);
      System.map = System.semverMap(name);
      return name;
    });
    flags.option('--type-assertion-module <path>', 'Absolute path to the type assertion module.', function(path) {
      commandOptions.setOption('type-assertion-module', path);
      return path;
    });
    flags.option('--modules <' + moduleOptions.join(', ') + '>', 'select the output format for modules', function(moduleFormat) {
      commandOptions.modules = moduleFormat;
    });
    flags.option('--moduleName [true|false|default]', 'true for named, false for anonymous modules; default depends on --modules', function(moduleName) {
      if (moduleName === 'true')
        moduleName = true;
      else if (moduleName === 'false')
        moduleName = false;
      else
        moduleName = 'default';
      commandOptions.moduleName = moduleName;
    });
    flags.option('--outputLanguage <es6|es5>', 'compilation target language', function(outputLanguage) {
      if (outputLanguage === 'es6' || outputLanguage === 'es5')
        commandOptions.outputLanguage = outputLanguage;
      else
        throw new Error('outputLanguage must be one of es5, es6');
    });
    flags.option('--source-maps [file|inline|memory]', 'sourceMaps generated to file or inline with data: URL', function(to) {
      return commandOptions.sourceMaps = to;
    });
    flags.option('--source-root <true|false|string>', 'sourcemap sourceRoot value. false to omit, ' + 'true for directory of output file.', function(to) {
      if (to === 'false')
        to = false;
      else if (to === 'true')
        to = true;
      return commandOptions.sourceRoot = to;
    });
    flags.option('--low-resolution-source-maps', 'Lower sourceMaps granularity to one mapping per output line', function() {
      return commandOptions.lowResolutionSourceMap = true;
    });
    flags.option('--experimental', 'Turns on all experimental features', function() {
      commandOptions.experimental = true;
    });
    flags.option('--atscript', 'Turns on all AtScript features', function() {
      commandOptions.atscript = true;
    });
    Object.keys(commandOptions).forEach(function(name) {
      var dashedName = toDashCase(name);
      if (flags.optionFor('--' + name) || flags.optionFor('--' + dashedName)) {
        return;
      } else if (name in featureOptions) {
        flags.option('--' + dashedName + ' [true|false|parse]', descriptions[name]);
        flags.on(dashedName, function(value) {
          return commandOptions.setOptionCoerced(dashedName, value);
        });
      } else if (commandOptions[name] !== null) {
        flags.option('--' + dashedName, descriptions[name]);
        flags.on(dashedName, function() {
          return commandOptions.setOption(dashedName, true);
        });
      } else {
        throw new Error('Unexpected null commandOption ' + name);
      }
    });
    commandOptions.setDefaults();
  }
  return {
    get optionsV01() {
      return optionsV01;
    },
    get versionLockedOptions() {
      return versionLockedOptions;
    },
    get Options() {
      return Options;
    },
    get CommandOptions() {
      return CommandOptions;
    },
    get toDashCase() {
      return toDashCase;
    },
    get addOptions() {
      return addOptions;
    }
  };
});
System.registerModule("traceur@0.0.91/src/syntax/TokenType.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/TokenType.js";
  var AMPERSAND = '&';
  var AMPERSAND_EQUAL = '&=';
  var AND = '&&';
  var ARROW = '=>';
  var AT = '@';
  var BACK_QUOTE = '`';
  var BANG = '!';
  var BAR = '|';
  var BAR_EQUAL = '|=';
  var BREAK = 'break';
  var CARET = '^';
  var CARET_EQUAL = '^=';
  var CASE = 'case';
  var CATCH = 'catch';
  var CLASS = 'class';
  var CLOSE_ANGLE = '>';
  var CLOSE_CURLY = '}';
  var CLOSE_PAREN = ')';
  var CLOSE_SQUARE = ']';
  var COLON = ':';
  var COMMA = ',';
  var CONST = 'const';
  var CONTINUE = 'continue';
  var DEBUGGER = 'debugger';
  var DEFAULT = 'default';
  var DELETE = 'delete';
  var DO = 'do';
  var DOT_DOT_DOT = '...';
  var ELSE = 'else';
  var END_OF_FILE = 'End of File';
  var ENUM = 'enum';
  var EQUAL = '=';
  var EQUAL_EQUAL = '==';
  var EQUAL_EQUAL_EQUAL = '===';
  var ERROR = 'error';
  var EXPORT = 'export';
  var EXTENDS = 'extends';
  var FALSE = 'false';
  var FINALLY = 'finally';
  var FOR = 'for';
  var FUNCTION = 'function';
  var GREATER_EQUAL = '>=';
  var IDENTIFIER = 'identifier';
  var IF = 'if';
  var IMPLEMENTS = 'implements';
  var IMPORT = 'import';
  var IN = 'in';
  var INSTANCEOF = 'instanceof';
  var INTERFACE = 'interface';
  var LEFT_SHIFT = '<<';
  var LEFT_SHIFT_EQUAL = '<<=';
  var LESS_EQUAL = '<=';
  var LET = 'let';
  var MINUS = '-';
  var MINUS_EQUAL = '-=';
  var MINUS_MINUS = '--';
  var NEW = 'new';
  var NO_SUBSTITUTION_TEMPLATE = 'no substitution template';
  var NOT_EQUAL = '!=';
  var NOT_EQUAL_EQUAL = '!==';
  var NULL = 'null';
  var NUMBER = 'number literal';
  var OPEN_ANGLE = '<';
  var OPEN_CURLY = '{';
  var OPEN_PAREN = '(';
  var OPEN_SQUARE = '[';
  var OR = '||';
  var PACKAGE = 'package';
  var PERCENT = '%';
  var PERCENT_EQUAL = '%=';
  var PERIOD = '.';
  var PLUS = '+';
  var PLUS_EQUAL = '+=';
  var PLUS_PLUS = '++';
  var PRIVATE = 'private';
  var PROTECTED = 'protected';
  var PUBLIC = 'public';
  var QUESTION = '?';
  var REGULAR_EXPRESSION = 'regular expression literal';
  var RETURN = 'return';
  var RIGHT_SHIFT = '>>';
  var RIGHT_SHIFT_EQUAL = '>>=';
  var SEMI_COLON = ';';
  var SLASH = '/';
  var SLASH_EQUAL = '/=';
  var STAR = '*';
  var STAR_EQUAL = '*=';
  var STAR_STAR = '**';
  var STAR_STAR_EQUAL = '**=';
  var STATIC = 'static';
  var STRING = 'string literal';
  var SUPER = 'super';
  var SWITCH = 'switch';
  var TEMPLATE_HEAD = 'template head';
  var TEMPLATE_MIDDLE = 'template middle';
  var TEMPLATE_TAIL = 'template tail';
  var THIS = 'this';
  var THROW = 'throw';
  var TILDE = '~';
  var TRUE = 'true';
  var TRY = 'try';
  var TYPEOF = 'typeof';
  var UNSIGNED_RIGHT_SHIFT = '>>>';
  var UNSIGNED_RIGHT_SHIFT_EQUAL = '>>>=';
  var VAR = 'var';
  var VOID = 'void';
  var WHILE = 'while';
  var WITH = 'with';
  var YIELD = 'yield';
  return {
    get AMPERSAND() {
      return AMPERSAND;
    },
    get AMPERSAND_EQUAL() {
      return AMPERSAND_EQUAL;
    },
    get AND() {
      return AND;
    },
    get ARROW() {
      return ARROW;
    },
    get AT() {
      return AT;
    },
    get BACK_QUOTE() {
      return BACK_QUOTE;
    },
    get BANG() {
      return BANG;
    },
    get BAR() {
      return BAR;
    },
    get BAR_EQUAL() {
      return BAR_EQUAL;
    },
    get BREAK() {
      return BREAK;
    },
    get CARET() {
      return CARET;
    },
    get CARET_EQUAL() {
      return CARET_EQUAL;
    },
    get CASE() {
      return CASE;
    },
    get CATCH() {
      return CATCH;
    },
    get CLASS() {
      return CLASS;
    },
    get CLOSE_ANGLE() {
      return CLOSE_ANGLE;
    },
    get CLOSE_CURLY() {
      return CLOSE_CURLY;
    },
    get CLOSE_PAREN() {
      return CLOSE_PAREN;
    },
    get CLOSE_SQUARE() {
      return CLOSE_SQUARE;
    },
    get COLON() {
      return COLON;
    },
    get COMMA() {
      return COMMA;
    },
    get CONST() {
      return CONST;
    },
    get CONTINUE() {
      return CONTINUE;
    },
    get DEBUGGER() {
      return DEBUGGER;
    },
    get DEFAULT() {
      return DEFAULT;
    },
    get DELETE() {
      return DELETE;
    },
    get DO() {
      return DO;
    },
    get DOT_DOT_DOT() {
      return DOT_DOT_DOT;
    },
    get ELSE() {
      return ELSE;
    },
    get END_OF_FILE() {
      return END_OF_FILE;
    },
    get ENUM() {
      return ENUM;
    },
    get EQUAL() {
      return EQUAL;
    },
    get EQUAL_EQUAL() {
      return EQUAL_EQUAL;
    },
    get EQUAL_EQUAL_EQUAL() {
      return EQUAL_EQUAL_EQUAL;
    },
    get ERROR() {
      return ERROR;
    },
    get EXPORT() {
      return EXPORT;
    },
    get EXTENDS() {
      return EXTENDS;
    },
    get FALSE() {
      return FALSE;
    },
    get FINALLY() {
      return FINALLY;
    },
    get FOR() {
      return FOR;
    },
    get FUNCTION() {
      return FUNCTION;
    },
    get GREATER_EQUAL() {
      return GREATER_EQUAL;
    },
    get IDENTIFIER() {
      return IDENTIFIER;
    },
    get IF() {
      return IF;
    },
    get IMPLEMENTS() {
      return IMPLEMENTS;
    },
    get IMPORT() {
      return IMPORT;
    },
    get IN() {
      return IN;
    },
    get INSTANCEOF() {
      return INSTANCEOF;
    },
    get INTERFACE() {
      return INTERFACE;
    },
    get LEFT_SHIFT() {
      return LEFT_SHIFT;
    },
    get LEFT_SHIFT_EQUAL() {
      return LEFT_SHIFT_EQUAL;
    },
    get LESS_EQUAL() {
      return LESS_EQUAL;
    },
    get LET() {
      return LET;
    },
    get MINUS() {
      return MINUS;
    },
    get MINUS_EQUAL() {
      return MINUS_EQUAL;
    },
    get MINUS_MINUS() {
      return MINUS_MINUS;
    },
    get NEW() {
      return NEW;
    },
    get NO_SUBSTITUTION_TEMPLATE() {
      return NO_SUBSTITUTION_TEMPLATE;
    },
    get NOT_EQUAL() {
      return NOT_EQUAL;
    },
    get NOT_EQUAL_EQUAL() {
      return NOT_EQUAL_EQUAL;
    },
    get NULL() {
      return NULL;
    },
    get NUMBER() {
      return NUMBER;
    },
    get OPEN_ANGLE() {
      return OPEN_ANGLE;
    },
    get OPEN_CURLY() {
      return OPEN_CURLY;
    },
    get OPEN_PAREN() {
      return OPEN_PAREN;
    },
    get OPEN_SQUARE() {
      return OPEN_SQUARE;
    },
    get OR() {
      return OR;
    },
    get PACKAGE() {
      return PACKAGE;
    },
    get PERCENT() {
      return PERCENT;
    },
    get PERCENT_EQUAL() {
      return PERCENT_EQUAL;
    },
    get PERIOD() {
      return PERIOD;
    },
    get PLUS() {
      return PLUS;
    },
    get PLUS_EQUAL() {
      return PLUS_EQUAL;
    },
    get PLUS_PLUS() {
      return PLUS_PLUS;
    },
    get PRIVATE() {
      return PRIVATE;
    },
    get PROTECTED() {
      return PROTECTED;
    },
    get PUBLIC() {
      return PUBLIC;
    },
    get QUESTION() {
      return QUESTION;
    },
    get REGULAR_EXPRESSION() {
      return REGULAR_EXPRESSION;
    },
    get RETURN() {
      return RETURN;
    },
    get RIGHT_SHIFT() {
      return RIGHT_SHIFT;
    },
    get RIGHT_SHIFT_EQUAL() {
      return RIGHT_SHIFT_EQUAL;
    },
    get SEMI_COLON() {
      return SEMI_COLON;
    },
    get SLASH() {
      return SLASH;
    },
    get SLASH_EQUAL() {
      return SLASH_EQUAL;
    },
    get STAR() {
      return STAR;
    },
    get STAR_EQUAL() {
      return STAR_EQUAL;
    },
    get STAR_STAR() {
      return STAR_STAR;
    },
    get STAR_STAR_EQUAL() {
      return STAR_STAR_EQUAL;
    },
    get STATIC() {
      return STATIC;
    },
    get STRING() {
      return STRING;
    },
    get SUPER() {
      return SUPER;
    },
    get SWITCH() {
      return SWITCH;
    },
    get TEMPLATE_HEAD() {
      return TEMPLATE_HEAD;
    },
    get TEMPLATE_MIDDLE() {
      return TEMPLATE_MIDDLE;
    },
    get TEMPLATE_TAIL() {
      return TEMPLATE_TAIL;
    },
    get THIS() {
      return THIS;
    },
    get THROW() {
      return THROW;
    },
    get TILDE() {
      return TILDE;
    },
    get TRUE() {
      return TRUE;
    },
    get TRY() {
      return TRY;
    },
    get TYPEOF() {
      return TYPEOF;
    },
    get UNSIGNED_RIGHT_SHIFT() {
      return UNSIGNED_RIGHT_SHIFT;
    },
    get UNSIGNED_RIGHT_SHIFT_EQUAL() {
      return UNSIGNED_RIGHT_SHIFT_EQUAL;
    },
    get VAR() {
      return VAR;
    },
    get VOID() {
      return VOID;
    },
    get WHILE() {
      return WHILE;
    },
    get WITH() {
      return WITH;
    },
    get YIELD() {
      return YIELD;
    }
  };
});
System.registerModule("traceur@0.0.91/src/syntax/trees/ParseTreeType.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/trees/ParseTreeType.js";
  var ANNOTATION = 'ANNOTATION';
  var ANON_BLOCK = 'ANON_BLOCK';
  var ARGUMENT_LIST = 'ARGUMENT_LIST';
  var ARRAY_COMPREHENSION = 'ARRAY_COMPREHENSION';
  var ARRAY_LITERAL_EXPRESSION = 'ARRAY_LITERAL_EXPRESSION';
  var ARRAY_PATTERN = 'ARRAY_PATTERN';
  var ARRAY_TYPE = 'ARRAY_TYPE';
  var ARROW_FUNCTION_EXPRESSION = 'ARROW_FUNCTION_EXPRESSION';
  var ASSIGNMENT_ELEMENT = 'ASSIGNMENT_ELEMENT';
  var AWAIT_EXPRESSION = 'AWAIT_EXPRESSION';
  var BINARY_EXPRESSION = 'BINARY_EXPRESSION';
  var BINDING_ELEMENT = 'BINDING_ELEMENT';
  var BINDING_IDENTIFIER = 'BINDING_IDENTIFIER';
  var BLOCK = 'BLOCK';
  var BREAK_STATEMENT = 'BREAK_STATEMENT';
  var CALL_EXPRESSION = 'CALL_EXPRESSION';
  var CALL_SIGNATURE = 'CALL_SIGNATURE';
  var CASE_CLAUSE = 'CASE_CLAUSE';
  var CATCH = 'CATCH';
  var CLASS_DECLARATION = 'CLASS_DECLARATION';
  var CLASS_EXPRESSION = 'CLASS_EXPRESSION';
  var COMMA_EXPRESSION = 'COMMA_EXPRESSION';
  var COMPREHENSION_FOR = 'COMPREHENSION_FOR';
  var COMPREHENSION_IF = 'COMPREHENSION_IF';
  var COMPUTED_PROPERTY_NAME = 'COMPUTED_PROPERTY_NAME';
  var CONDITIONAL_EXPRESSION = 'CONDITIONAL_EXPRESSION';
  var CONSTRUCT_SIGNATURE = 'CONSTRUCT_SIGNATURE';
  var CONSTRUCTOR_TYPE = 'CONSTRUCTOR_TYPE';
  var CONTINUE_STATEMENT = 'CONTINUE_STATEMENT';
  var COVER_FORMALS = 'COVER_FORMALS';
  var COVER_INITIALIZED_NAME = 'COVER_INITIALIZED_NAME';
  var DEBUGGER_STATEMENT = 'DEBUGGER_STATEMENT';
  var DEFAULT_CLAUSE = 'DEFAULT_CLAUSE';
  var DO_WHILE_STATEMENT = 'DO_WHILE_STATEMENT';
  var EMPTY_STATEMENT = 'EMPTY_STATEMENT';
  var EXPORT_DECLARATION = 'EXPORT_DECLARATION';
  var EXPORT_DEFAULT = 'EXPORT_DEFAULT';
  var EXPORT_SPECIFIER = 'EXPORT_SPECIFIER';
  var EXPORT_SPECIFIER_SET = 'EXPORT_SPECIFIER_SET';
  var EXPORT_STAR = 'EXPORT_STAR';
  var EXPRESSION_STATEMENT = 'EXPRESSION_STATEMENT';
  var FINALLY = 'FINALLY';
  var FOR_IN_STATEMENT = 'FOR_IN_STATEMENT';
  var FOR_OF_STATEMENT = 'FOR_OF_STATEMENT';
  var FOR_ON_STATEMENT = 'FOR_ON_STATEMENT';
  var FOR_STATEMENT = 'FOR_STATEMENT';
  var FORMAL_PARAMETER = 'FORMAL_PARAMETER';
  var FORMAL_PARAMETER_LIST = 'FORMAL_PARAMETER_LIST';
  var FORWARD_DEFAULT_EXPORT = 'FORWARD_DEFAULT_EXPORT';
  var FUNCTION_BODY = 'FUNCTION_BODY';
  var FUNCTION_DECLARATION = 'FUNCTION_DECLARATION';
  var FUNCTION_EXPRESSION = 'FUNCTION_EXPRESSION';
  var FUNCTION_TYPE = 'FUNCTION_TYPE';
  var GENERATOR_COMPREHENSION = 'GENERATOR_COMPREHENSION';
  var GET_ACCESSOR = 'GET_ACCESSOR';
  var IDENTIFIER_EXPRESSION = 'IDENTIFIER_EXPRESSION';
  var IF_STATEMENT = 'IF_STATEMENT';
  var IMPORT_CLAUSE_PAIR = 'IMPORT_CLAUSE_PAIR';
  var IMPORT_DECLARATION = 'IMPORT_DECLARATION';
  var IMPORT_SPECIFIER = 'IMPORT_SPECIFIER';
  var IMPORT_SPECIFIER_SET = 'IMPORT_SPECIFIER_SET';
  var IMPORTED_BINDING = 'IMPORTED_BINDING';
  var INDEX_SIGNATURE = 'INDEX_SIGNATURE';
  var INTERFACE_DECLARATION = 'INTERFACE_DECLARATION';
  var LABELLED_STATEMENT = 'LABELLED_STATEMENT';
  var LITERAL_EXPRESSION = 'LITERAL_EXPRESSION';
  var LITERAL_PROPERTY_NAME = 'LITERAL_PROPERTY_NAME';
  var MEMBER_EXPRESSION = 'MEMBER_EXPRESSION';
  var MEMBER_LOOKUP_EXPRESSION = 'MEMBER_LOOKUP_EXPRESSION';
  var METHOD_SIGNATURE = 'METHOD_SIGNATURE';
  var MODULE = 'MODULE';
  var MODULE_SPECIFIER = 'MODULE_SPECIFIER';
  var NAME_SPACE_EXPORT = 'NAME_SPACE_EXPORT';
  var NAME_SPACE_IMPORT = 'NAME_SPACE_IMPORT';
  var NAMED_EXPORT = 'NAMED_EXPORT';
  var NEW_EXPRESSION = 'NEW_EXPRESSION';
  var OBJECT_LITERAL_EXPRESSION = 'OBJECT_LITERAL_EXPRESSION';
  var OBJECT_PATTERN = 'OBJECT_PATTERN';
  var OBJECT_PATTERN_FIELD = 'OBJECT_PATTERN_FIELD';
  var OBJECT_TYPE = 'OBJECT_TYPE';
  var PAREN_EXPRESSION = 'PAREN_EXPRESSION';
  var POSTFIX_EXPRESSION = 'POSTFIX_EXPRESSION';
  var PREDEFINED_TYPE = 'PREDEFINED_TYPE';
  var PROPERTY_METHOD_ASSIGNMENT = 'PROPERTY_METHOD_ASSIGNMENT';
  var PROPERTY_NAME_ASSIGNMENT = 'PROPERTY_NAME_ASSIGNMENT';
  var PROPERTY_NAME_SHORTHAND = 'PROPERTY_NAME_SHORTHAND';
  var PROPERTY_SIGNATURE = 'PROPERTY_SIGNATURE';
  var PROPERTY_VARIABLE_DECLARATION = 'PROPERTY_VARIABLE_DECLARATION';
  var REST_PARAMETER = 'REST_PARAMETER';
  var RETURN_STATEMENT = 'RETURN_STATEMENT';
  var SCRIPT = 'SCRIPT';
  var SET_ACCESSOR = 'SET_ACCESSOR';
  var SPREAD_EXPRESSION = 'SPREAD_EXPRESSION';
  var SPREAD_PATTERN_ELEMENT = 'SPREAD_PATTERN_ELEMENT';
  var STATE_MACHINE = 'STATE_MACHINE';
  var SUPER_EXPRESSION = 'SUPER_EXPRESSION';
  var SWITCH_STATEMENT = 'SWITCH_STATEMENT';
  var SYNTAX_ERROR_TREE = 'SYNTAX_ERROR_TREE';
  var TEMPLATE_LITERAL_EXPRESSION = 'TEMPLATE_LITERAL_EXPRESSION';
  var TEMPLATE_LITERAL_PORTION = 'TEMPLATE_LITERAL_PORTION';
  var TEMPLATE_SUBSTITUTION = 'TEMPLATE_SUBSTITUTION';
  var THIS_EXPRESSION = 'THIS_EXPRESSION';
  var THROW_STATEMENT = 'THROW_STATEMENT';
  var TRY_STATEMENT = 'TRY_STATEMENT';
  var TYPE_ARGUMENTS = 'TYPE_ARGUMENTS';
  var TYPE_NAME = 'TYPE_NAME';
  var TYPE_PARAMETER = 'TYPE_PARAMETER';
  var TYPE_PARAMETERS = 'TYPE_PARAMETERS';
  var TYPE_REFERENCE = 'TYPE_REFERENCE';
  var UNARY_EXPRESSION = 'UNARY_EXPRESSION';
  var UNION_TYPE = 'UNION_TYPE';
  var VARIABLE_DECLARATION = 'VARIABLE_DECLARATION';
  var VARIABLE_DECLARATION_LIST = 'VARIABLE_DECLARATION_LIST';
  var VARIABLE_STATEMENT = 'VARIABLE_STATEMENT';
  var WHILE_STATEMENT = 'WHILE_STATEMENT';
  var WITH_STATEMENT = 'WITH_STATEMENT';
  var YIELD_EXPRESSION = 'YIELD_EXPRESSION';
  return {
    get ANNOTATION() {
      return ANNOTATION;
    },
    get ANON_BLOCK() {
      return ANON_BLOCK;
    },
    get ARGUMENT_LIST() {
      return ARGUMENT_LIST;
    },
    get ARRAY_COMPREHENSION() {
      return ARRAY_COMPREHENSION;
    },
    get ARRAY_LITERAL_EXPRESSION() {
      return ARRAY_LITERAL_EXPRESSION;
    },
    get ARRAY_PATTERN() {
      return ARRAY_PATTERN;
    },
    get ARRAY_TYPE() {
      return ARRAY_TYPE;
    },
    get ARROW_FUNCTION_EXPRESSION() {
      return ARROW_FUNCTION_EXPRESSION;
    },
    get ASSIGNMENT_ELEMENT() {
      return ASSIGNMENT_ELEMENT;
    },
    get AWAIT_EXPRESSION() {
      return AWAIT_EXPRESSION;
    },
    get BINARY_EXPRESSION() {
      return BINARY_EXPRESSION;
    },
    get BINDING_ELEMENT() {
      return BINDING_ELEMENT;
    },
    get BINDING_IDENTIFIER() {
      return BINDING_IDENTIFIER;
    },
    get BLOCK() {
      return BLOCK;
    },
    get BREAK_STATEMENT() {
      return BREAK_STATEMENT;
    },
    get CALL_EXPRESSION() {
      return CALL_EXPRESSION;
    },
    get CALL_SIGNATURE() {
      return CALL_SIGNATURE;
    },
    get CASE_CLAUSE() {
      return CASE_CLAUSE;
    },
    get CATCH() {
      return CATCH;
    },
    get CLASS_DECLARATION() {
      return CLASS_DECLARATION;
    },
    get CLASS_EXPRESSION() {
      return CLASS_EXPRESSION;
    },
    get COMMA_EXPRESSION() {
      return COMMA_EXPRESSION;
    },
    get COMPREHENSION_FOR() {
      return COMPREHENSION_FOR;
    },
    get COMPREHENSION_IF() {
      return COMPREHENSION_IF;
    },
    get COMPUTED_PROPERTY_NAME() {
      return COMPUTED_PROPERTY_NAME;
    },
    get CONDITIONAL_EXPRESSION() {
      return CONDITIONAL_EXPRESSION;
    },
    get CONSTRUCT_SIGNATURE() {
      return CONSTRUCT_SIGNATURE;
    },
    get CONSTRUCTOR_TYPE() {
      return CONSTRUCTOR_TYPE;
    },
    get CONTINUE_STATEMENT() {
      return CONTINUE_STATEMENT;
    },
    get COVER_FORMALS() {
      return COVER_FORMALS;
    },
    get COVER_INITIALIZED_NAME() {
      return COVER_INITIALIZED_NAME;
    },
    get DEBUGGER_STATEMENT() {
      return DEBUGGER_STATEMENT;
    },
    get DEFAULT_CLAUSE() {
      return DEFAULT_CLAUSE;
    },
    get DO_WHILE_STATEMENT() {
      return DO_WHILE_STATEMENT;
    },
    get EMPTY_STATEMENT() {
      return EMPTY_STATEMENT;
    },
    get EXPORT_DECLARATION() {
      return EXPORT_DECLARATION;
    },
    get EXPORT_DEFAULT() {
      return EXPORT_DEFAULT;
    },
    get EXPORT_SPECIFIER() {
      return EXPORT_SPECIFIER;
    },
    get EXPORT_SPECIFIER_SET() {
      return EXPORT_SPECIFIER_SET;
    },
    get EXPORT_STAR() {
      return EXPORT_STAR;
    },
    get EXPRESSION_STATEMENT() {
      return EXPRESSION_STATEMENT;
    },
    get FINALLY() {
      return FINALLY;
    },
    get FOR_IN_STATEMENT() {
      return FOR_IN_STATEMENT;
    },
    get FOR_OF_STATEMENT() {
      return FOR_OF_STATEMENT;
    },
    get FOR_ON_STATEMENT() {
      return FOR_ON_STATEMENT;
    },
    get FOR_STATEMENT() {
      return FOR_STATEMENT;
    },
    get FORMAL_PARAMETER() {
      return FORMAL_PARAMETER;
    },
    get FORMAL_PARAMETER_LIST() {
      return FORMAL_PARAMETER_LIST;
    },
    get FORWARD_DEFAULT_EXPORT() {
      return FORWARD_DEFAULT_EXPORT;
    },
    get FUNCTION_BODY() {
      return FUNCTION_BODY;
    },
    get FUNCTION_DECLARATION() {
      return FUNCTION_DECLARATION;
    },
    get FUNCTION_EXPRESSION() {
      return FUNCTION_EXPRESSION;
    },
    get FUNCTION_TYPE() {
      return FUNCTION_TYPE;
    },
    get GENERATOR_COMPREHENSION() {
      return GENERATOR_COMPREHENSION;
    },
    get GET_ACCESSOR() {
      return GET_ACCESSOR;
    },
    get IDENTIFIER_EXPRESSION() {
      return IDENTIFIER_EXPRESSION;
    },
    get IF_STATEMENT() {
      return IF_STATEMENT;
    },
    get IMPORT_CLAUSE_PAIR() {
      return IMPORT_CLAUSE_PAIR;
    },
    get IMPORT_DECLARATION() {
      return IMPORT_DECLARATION;
    },
    get IMPORT_SPECIFIER() {
      return IMPORT_SPECIFIER;
    },
    get IMPORT_SPECIFIER_SET() {
      return IMPORT_SPECIFIER_SET;
    },
    get IMPORTED_BINDING() {
      return IMPORTED_BINDING;
    },
    get INDEX_SIGNATURE() {
      return INDEX_SIGNATURE;
    },
    get INTERFACE_DECLARATION() {
      return INTERFACE_DECLARATION;
    },
    get LABELLED_STATEMENT() {
      return LABELLED_STATEMENT;
    },
    get LITERAL_EXPRESSION() {
      return LITERAL_EXPRESSION;
    },
    get LITERAL_PROPERTY_NAME() {
      return LITERAL_PROPERTY_NAME;
    },
    get MEMBER_EXPRESSION() {
      return MEMBER_EXPRESSION;
    },
    get MEMBER_LOOKUP_EXPRESSION() {
      return MEMBER_LOOKUP_EXPRESSION;
    },
    get METHOD_SIGNATURE() {
      return METHOD_SIGNATURE;
    },
    get MODULE() {
      return MODULE;
    },
    get MODULE_SPECIFIER() {
      return MODULE_SPECIFIER;
    },
    get NAME_SPACE_EXPORT() {
      return NAME_SPACE_EXPORT;
    },
    get NAME_SPACE_IMPORT() {
      return NAME_SPACE_IMPORT;
    },
    get NAMED_EXPORT() {
      return NAMED_EXPORT;
    },
    get NEW_EXPRESSION() {
      return NEW_EXPRESSION;
    },
    get OBJECT_LITERAL_EXPRESSION() {
      return OBJECT_LITERAL_EXPRESSION;
    },
    get OBJECT_PATTERN() {
      return OBJECT_PATTERN;
    },
    get OBJECT_PATTERN_FIELD() {
      return OBJECT_PATTERN_FIELD;
    },
    get OBJECT_TYPE() {
      return OBJECT_TYPE;
    },
    get PAREN_EXPRESSION() {
      return PAREN_EXPRESSION;
    },
    get POSTFIX_EXPRESSION() {
      return POSTFIX_EXPRESSION;
    },
    get PREDEFINED_TYPE() {
      return PREDEFINED_TYPE;
    },
    get PROPERTY_METHOD_ASSIGNMENT() {
      return PROPERTY_METHOD_ASSIGNMENT;
    },
    get PROPERTY_NAME_ASSIGNMENT() {
      return PROPERTY_NAME_ASSIGNMENT;
    },
    get PROPERTY_NAME_SHORTHAND() {
      return PROPERTY_NAME_SHORTHAND;
    },
    get PROPERTY_SIGNATURE() {
      return PROPERTY_SIGNATURE;
    },
    get PROPERTY_VARIABLE_DECLARATION() {
      return PROPERTY_VARIABLE_DECLARATION;
    },
    get REST_PARAMETER() {
      return REST_PARAMETER;
    },
    get RETURN_STATEMENT() {
      return RETURN_STATEMENT;
    },
    get SCRIPT() {
      return SCRIPT;
    },
    get SET_ACCESSOR() {
      return SET_ACCESSOR;
    },
    get SPREAD_EXPRESSION() {
      return SPREAD_EXPRESSION;
    },
    get SPREAD_PATTERN_ELEMENT() {
      return SPREAD_PATTERN_ELEMENT;
    },
    get STATE_MACHINE() {
      return STATE_MACHINE;
    },
    get SUPER_EXPRESSION() {
      return SUPER_EXPRESSION;
    },
    get SWITCH_STATEMENT() {
      return SWITCH_STATEMENT;
    },
    get SYNTAX_ERROR_TREE() {
      return SYNTAX_ERROR_TREE;
    },
    get TEMPLATE_LITERAL_EXPRESSION() {
      return TEMPLATE_LITERAL_EXPRESSION;
    },
    get TEMPLATE_LITERAL_PORTION() {
      return TEMPLATE_LITERAL_PORTION;
    },
    get TEMPLATE_SUBSTITUTION() {
      return TEMPLATE_SUBSTITUTION;
    },
    get THIS_EXPRESSION() {
      return THIS_EXPRESSION;
    },
    get THROW_STATEMENT() {
      return THROW_STATEMENT;
    },
    get TRY_STATEMENT() {
      return TRY_STATEMENT;
    },
    get TYPE_ARGUMENTS() {
      return TYPE_ARGUMENTS;
    },
    get TYPE_NAME() {
      return TYPE_NAME;
    },
    get TYPE_PARAMETER() {
      return TYPE_PARAMETER;
    },
    get TYPE_PARAMETERS() {
      return TYPE_PARAMETERS;
    },
    get TYPE_REFERENCE() {
      return TYPE_REFERENCE;
    },
    get UNARY_EXPRESSION() {
      return UNARY_EXPRESSION;
    },
    get UNION_TYPE() {
      return UNION_TYPE;
    },
    get VARIABLE_DECLARATION() {
      return VARIABLE_DECLARATION;
    },
    get VARIABLE_DECLARATION_LIST() {
      return VARIABLE_DECLARATION_LIST;
    },
    get VARIABLE_STATEMENT() {
      return VARIABLE_STATEMENT;
    },
    get WHILE_STATEMENT() {
      return WHILE_STATEMENT;
    },
    get WITH_STATEMENT() {
      return WITH_STATEMENT;
    },
    get YIELD_EXPRESSION() {
      return YIELD_EXPRESSION;
    }
  };
});
System.registerModule("traceur@0.0.91/src/syntax/ParseTreeVisitor.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/ParseTreeVisitor.js";
  var ParseTreeVisitor = function() {
    function ParseTreeVisitor() {}
    return ($traceurRuntime.createClass)(ParseTreeVisitor, {
      visitAny: function(tree) {
        tree !== null && tree.visit(this);
      },
      visit: function(tree) {
        this.visitAny(tree);
      },
      visitList: function(list) {
        if (list) {
          for (var i = 0; i < list.length; i++) {
            this.visitAny(list[i]);
          }
        }
      },
      visitStateMachine: function(tree) {
        throw Error('State machines should not live outside of the GeneratorTransformer.');
      },
      visitAnnotation: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.args);
      },
      visitAnonBlock: function(tree) {
        this.visitList(tree.statements);
      },
      visitArgumentList: function(tree) {
        this.visitList(tree.args);
      },
      visitArrayComprehension: function(tree) {
        this.visitList(tree.comprehensionList);
        this.visitAny(tree.expression);
      },
      visitArrayLiteralExpression: function(tree) {
        this.visitList(tree.elements);
      },
      visitArrayPattern: function(tree) {
        this.visitList(tree.elements);
      },
      visitArrayType: function(tree) {
        this.visitAny(tree.elementType);
      },
      visitArrowFunctionExpression: function(tree) {
        this.visitAny(tree.parameterList);
        this.visitAny(tree.body);
      },
      visitAssignmentElement: function(tree) {
        this.visitAny(tree.assignment);
        this.visitAny(tree.initializer);
      },
      visitAwaitExpression: function(tree) {
        this.visitAny(tree.expression);
      },
      visitBinaryExpression: function(tree) {
        this.visitAny(tree.left);
        this.visitAny(tree.right);
      },
      visitBindingElement: function(tree) {
        this.visitAny(tree.binding);
        this.visitAny(tree.initializer);
      },
      visitBindingIdentifier: function(tree) {},
      visitBlock: function(tree) {
        this.visitList(tree.statements);
      },
      visitBreakStatement: function(tree) {},
      visitCallExpression: function(tree) {
        this.visitAny(tree.operand);
        this.visitAny(tree.args);
      },
      visitCallSignature: function(tree) {
        this.visitAny(tree.typeParameters);
        this.visitAny(tree.parameterList);
        this.visitAny(tree.returnType);
      },
      visitCaseClause: function(tree) {
        this.visitAny(tree.expression);
        this.visitList(tree.statements);
      },
      visitCatch: function(tree) {
        this.visitAny(tree.binding);
        this.visitAny(tree.catchBody);
      },
      visitClassDeclaration: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.superClass);
        this.visitList(tree.elements);
        this.visitList(tree.annotations);
        this.visitAny(tree.typeParameters);
      },
      visitClassExpression: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.superClass);
        this.visitList(tree.elements);
        this.visitList(tree.annotations);
        this.visitAny(tree.typeParameters);
      },
      visitCommaExpression: function(tree) {
        this.visitList(tree.expressions);
      },
      visitComprehensionFor: function(tree) {
        this.visitAny(tree.left);
        this.visitAny(tree.iterator);
      },
      visitComprehensionIf: function(tree) {
        this.visitAny(tree.expression);
      },
      visitComputedPropertyName: function(tree) {
        this.visitAny(tree.expression);
      },
      visitConditionalExpression: function(tree) {
        this.visitAny(tree.condition);
        this.visitAny(tree.left);
        this.visitAny(tree.right);
      },
      visitConstructSignature: function(tree) {
        this.visitAny(tree.typeParameters);
        this.visitAny(tree.parameterList);
        this.visitAny(tree.returnType);
      },
      visitConstructorType: function(tree) {
        this.visitAny(tree.typeParameters);
        this.visitAny(tree.parameterList);
        this.visitAny(tree.returnType);
      },
      visitContinueStatement: function(tree) {},
      visitCoverFormals: function(tree) {
        this.visitList(tree.expressions);
      },
      visitCoverInitializedName: function(tree) {
        this.visitAny(tree.initializer);
      },
      visitDebuggerStatement: function(tree) {},
      visitDefaultClause: function(tree) {
        this.visitList(tree.statements);
      },
      visitDoWhileStatement: function(tree) {
        this.visitAny(tree.body);
        this.visitAny(tree.condition);
      },
      visitEmptyStatement: function(tree) {},
      visitExportDeclaration: function(tree) {
        this.visitAny(tree.declaration);
        this.visitList(tree.annotations);
      },
      visitExportDefault: function(tree) {
        this.visitAny(tree.expression);
      },
      visitExportSpecifier: function(tree) {},
      visitExportSpecifierSet: function(tree) {
        this.visitList(tree.specifiers);
      },
      visitExportStar: function(tree) {},
      visitExpressionStatement: function(tree) {
        this.visitAny(tree.expression);
      },
      visitFinally: function(tree) {
        this.visitAny(tree.block);
      },
      visitForInStatement: function(tree) {
        this.visitAny(tree.initializer);
        this.visitAny(tree.collection);
        this.visitAny(tree.body);
      },
      visitForOfStatement: function(tree) {
        this.visitAny(tree.initializer);
        this.visitAny(tree.collection);
        this.visitAny(tree.body);
      },
      visitForOnStatement: function(tree) {
        this.visitAny(tree.initializer);
        this.visitAny(tree.observable);
        this.visitAny(tree.body);
      },
      visitForStatement: function(tree) {
        this.visitAny(tree.initializer);
        this.visitAny(tree.condition);
        this.visitAny(tree.increment);
        this.visitAny(tree.body);
      },
      visitFormalParameter: function(tree) {
        this.visitAny(tree.parameter);
        this.visitAny(tree.typeAnnotation);
        this.visitList(tree.annotations);
      },
      visitFormalParameterList: function(tree) {
        this.visitList(tree.parameters);
      },
      visitForwardDefaultExport: function(tree) {},
      visitFunctionBody: function(tree) {
        this.visitList(tree.statements);
      },
      visitFunctionDeclaration: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.parameterList);
        this.visitAny(tree.typeAnnotation);
        this.visitList(tree.annotations);
        this.visitAny(tree.body);
      },
      visitFunctionExpression: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.parameterList);
        this.visitAny(tree.typeAnnotation);
        this.visitList(tree.annotations);
        this.visitAny(tree.body);
      },
      visitFunctionType: function(tree) {
        this.visitAny(tree.typeParameters);
        this.visitAny(tree.parameterList);
        this.visitAny(tree.returnType);
      },
      visitGeneratorComprehension: function(tree) {
        this.visitList(tree.comprehensionList);
        this.visitAny(tree.expression);
      },
      visitGetAccessor: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.typeAnnotation);
        this.visitList(tree.annotations);
        this.visitAny(tree.body);
      },
      visitIdentifierExpression: function(tree) {},
      visitIfStatement: function(tree) {
        this.visitAny(tree.condition);
        this.visitAny(tree.ifClause);
        this.visitAny(tree.elseClause);
      },
      visitImportedBinding: function(tree) {
        this.visitAny(tree.binding);
      },
      visitImportClausePair: function(tree) {
        this.visitAny(tree.first);
        this.visitAny(tree.second);
      },
      visitImportDeclaration: function(tree) {
        this.visitAny(tree.importClause);
        this.visitAny(tree.moduleSpecifier);
      },
      visitImportSpecifier: function(tree) {
        this.visitAny(tree.binding);
      },
      visitImportSpecifierSet: function(tree) {
        this.visitList(tree.specifiers);
      },
      visitIndexSignature: function(tree) {
        this.visitAny(tree.indexType);
        this.visitAny(tree.typeAnnotation);
      },
      visitInterfaceDeclaration: function(tree) {
        this.visitAny(tree.typeParameters);
        this.visitAny(tree.objectType);
      },
      visitLabelledStatement: function(tree) {
        this.visitAny(tree.statement);
      },
      visitLiteralExpression: function(tree) {},
      visitLiteralPropertyName: function(tree) {},
      visitMemberExpression: function(tree) {
        this.visitAny(tree.operand);
      },
      visitMemberLookupExpression: function(tree) {
        this.visitAny(tree.operand);
        this.visitAny(tree.memberExpression);
      },
      visitMethodSignature: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.callSignature);
      },
      visitModule: function(tree) {
        this.visitList(tree.scriptItemList);
      },
      visitModuleSpecifier: function(tree) {},
      visitNameSpaceExport: function(tree) {},
      visitNameSpaceImport: function(tree) {
        this.visitAny(tree.binding);
      },
      visitNamedExport: function(tree) {
        this.visitAny(tree.exportClause);
        this.visitAny(tree.moduleSpecifier);
      },
      visitNewExpression: function(tree) {
        this.visitAny(tree.operand);
        this.visitAny(tree.args);
      },
      visitObjectLiteralExpression: function(tree) {
        this.visitList(tree.propertyNameAndValues);
      },
      visitObjectPattern: function(tree) {
        this.visitList(tree.fields);
      },
      visitObjectPatternField: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.element);
      },
      visitObjectType: function(tree) {
        this.visitList(tree.typeMembers);
      },
      visitParenExpression: function(tree) {
        this.visitAny(tree.expression);
      },
      visitPostfixExpression: function(tree) {
        this.visitAny(tree.operand);
      },
      visitPredefinedType: function(tree) {},
      visitScript: function(tree) {
        this.visitList(tree.scriptItemList);
      },
      visitPropertyMethodAssignment: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.parameterList);
        this.visitAny(tree.typeAnnotation);
        this.visitList(tree.annotations);
        this.visitAny(tree.body);
        this.visitAny(tree.debugName);
      },
      visitPropertyNameAssignment: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.value);
      },
      visitPropertyNameShorthand: function(tree) {},
      visitPropertyVariableDeclaration: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.typeAnnotation);
        this.visitList(tree.annotations);
        this.visitAny(tree.initializer);
      },
      visitPropertySignature: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.typeAnnotation);
      },
      visitRestParameter: function(tree) {
        this.visitAny(tree.identifier);
        this.visitAny(tree.typeAnnotation);
      },
      visitReturnStatement: function(tree) {
        this.visitAny(tree.expression);
      },
      visitSetAccessor: function(tree) {
        this.visitAny(tree.name);
        this.visitAny(tree.parameterList);
        this.visitList(tree.annotations);
        this.visitAny(tree.body);
      },
      visitSpreadExpression: function(tree) {
        this.visitAny(tree.expression);
      },
      visitSpreadPatternElement: function(tree) {
        this.visitAny(tree.lvalue);
      },
      visitSuperExpression: function(tree) {},
      visitSwitchStatement: function(tree) {
        this.visitAny(tree.expression);
        this.visitList(tree.caseClauses);
      },
      visitSyntaxErrorTree: function(tree) {},
      visitTemplateLiteralExpression: function(tree) {
        this.visitAny(tree.operand);
        this.visitList(tree.elements);
      },
      visitTemplateLiteralPortion: function(tree) {},
      visitTemplateSubstitution: function(tree) {
        this.visitAny(tree.expression);
      },
      visitThisExpression: function(tree) {},
      visitThrowStatement: function(tree) {
        this.visitAny(tree.value);
      },
      visitTryStatement: function(tree) {
        this.visitAny(tree.body);
        this.visitAny(tree.catchBlock);
        this.visitAny(tree.finallyBlock);
      },
      visitTypeArguments: function(tree) {
        this.visitList(tree.args);
      },
      visitTypeName: function(tree) {
        this.visitAny(tree.moduleName);
      },
      visitTypeParameter: function(tree) {
        this.visitAny(tree.extendsType);
      },
      visitTypeParameters: function(tree) {
        this.visitList(tree.parameters);
      },
      visitTypeReference: function(tree) {
        this.visitAny(tree.typeName);
        this.visitAny(tree.args);
      },
      visitUnaryExpression: function(tree) {
        this.visitAny(tree.operand);
      },
      visitUnionType: function(tree) {
        this.visitList(tree.types);
      },
      visitVariableDeclaration: function(tree) {
        this.visitAny(tree.lvalue);
        this.visitAny(tree.typeAnnotation);
        this.visitAny(tree.initializer);
      },
      visitVariableDeclarationList: function(tree) {
        this.visitList(tree.declarations);
      },
      visitVariableStatement: function(tree) {
        this.visitAny(tree.declarations);
      },
      visitWhileStatement: function(tree) {
        this.visitAny(tree.condition);
        this.visitAny(tree.body);
      },
      visitWithStatement: function(tree) {
        this.visitAny(tree.expression);
        this.visitAny(tree.body);
      },
      visitYieldExpression: function(tree) {
        this.visitAny(tree.expression);
      }
    }, {});
  }();
  return {get ParseTreeVisitor() {
      return ParseTreeVisitor;
    }};
});
System.registerModule("traceur@0.0.91/src/util/StringSet.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/StringSet.js";
  function assertString(value) {
    if (typeof value !== 'string')
      throw new TypeError();
  }
  var StringSet = function() {
    function StringSet() {
      this.storage_ = Object.create(null);
    }
    return ($traceurRuntime.createClass)(StringSet, {
      add: function(value) {
        assertString(value);
        this.storage_[value] = true;
      },
      has: function(value) {
        assertString(value);
        return this.storage_[value] !== undefined;
      },
      delete: function(value) {
        assertString(value);
        delete this.storage_[value];
      },
      isEmpty: function() {
        for (var _ in this.storage_) {
          return false;
        }
        return true;
      },
      valuesAsArray: function() {
        return Object.keys(this.storage_);
      },
      forEach: function(func) {
        for (var value in this.storage_) {
          func(value);
        }
      }
    }, {});
  }();
  return {get StringSet() {
      return StringSet;
    }};
});
System.registerModule("traceur@0.0.91/src/util/StringMap.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/StringMap.js";
  var StringSet = System.get("traceur@0.0.91/src/util/StringSet.js").StringSet;
  function assertString(value) {
    if (typeof value !== 'string')
      throw new TypeError();
  }
  var StringMap = function() {
    function StringMap() {
      this.storage_ = Object.create(null);
    }
    return ($traceurRuntime.createClass)(StringMap, {
      set: function(key, value) {
        assertString(key);
        this.storage_[key] = value;
      },
      get: function(key) {
        assertString(key);
        return this.storage_[key];
      },
      delete: function(key) {
        assertString(key);
        delete this.storage_[key];
      },
      has: function(key) {
        assertString(key);
        return this.storage_[key] !== undefined;
      },
      keysAsArray: function() {
        return Object.keys(this.storage_);
      },
      keysAsSet: function() {
        var set = new StringSet();
        this.forEach(function(key) {
          return set.add(key);
        });
        return set;
      },
      forEach: function(func) {
        for (var key in this.storage_) {
          func(key, this.storage_[key]);
        }
      }
    }, {});
  }();
  return {get StringMap() {
      return StringMap;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/PredefinedName.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/PredefinedName.js";
  var $ARGUMENTS = '$arguments';
  var ANY = 'any';
  var APPLY = 'apply';
  var ARGUMENTS = 'arguments';
  var ARRAY = 'Array';
  var AS = 'as';
  var ASYNC = 'async';
  var ASYNC_STAR = 'async star';
  var AWAIT = 'await';
  var BIND = 'bind';
  var CALL = 'call';
  var CONFIGURABLE = 'configurable';
  var CONSTRUCTOR = 'constructor';
  var CREATE = 'create';
  var CURRENT = 'current';
  var DEFINE_PROPERTY = 'defineProperty';
  var ENUMERABLE = 'enumerable';
  var FREEZE = 'freeze';
  var FROM = 'from';
  var FUNCTION = 'Function';
  var GET = 'get';
  var HAS = 'has';
  var LENGTH = 'length';
  var MODULE = 'module';
  var NEW = 'new';
  var OBJECT = 'Object';
  var OBJECT_NAME = 'Object';
  var OF = 'of';
  var ON = 'on';
  var PREVENT_EXTENSIONS = 'preventExtensions';
  var PROTOTYPE = 'prototype';
  var PUSH = 'push';
  var SET = 'set';
  var SLICE = 'slice';
  var THIS = 'this';
  var TRACEUR_RUNTIME = '$traceurRuntime';
  var UNDEFINED = 'undefined';
  var WRITABLE = 'writable';
  return {
    get $ARGUMENTS() {
      return $ARGUMENTS;
    },
    get ANY() {
      return ANY;
    },
    get APPLY() {
      return APPLY;
    },
    get ARGUMENTS() {
      return ARGUMENTS;
    },
    get ARRAY() {
      return ARRAY;
    },
    get AS() {
      return AS;
    },
    get ASYNC() {
      return ASYNC;
    },
    get ASYNC_STAR() {
      return ASYNC_STAR;
    },
    get AWAIT() {
      return AWAIT;
    },
    get BIND() {
      return BIND;
    },
    get CALL() {
      return CALL;
    },
    get CONFIGURABLE() {
      return CONFIGURABLE;
    },
    get CONSTRUCTOR() {
      return CONSTRUCTOR;
    },
    get CREATE() {
      return CREATE;
    },
    get CURRENT() {
      return CURRENT;
    },
    get DEFINE_PROPERTY() {
      return DEFINE_PROPERTY;
    },
    get ENUMERABLE() {
      return ENUMERABLE;
    },
    get FREEZE() {
      return FREEZE;
    },
    get FROM() {
      return FROM;
    },
    get FUNCTION() {
      return FUNCTION;
    },
    get GET() {
      return GET;
    },
    get HAS() {
      return HAS;
    },
    get LENGTH() {
      return LENGTH;
    },
    get MODULE() {
      return MODULE;
    },
    get NEW() {
      return NEW;
    },
    get OBJECT() {
      return OBJECT;
    },
    get OBJECT_NAME() {
      return OBJECT_NAME;
    },
    get OF() {
      return OF;
    },
    get ON() {
      return ON;
    },
    get PREVENT_EXTENSIONS() {
      return PREVENT_EXTENSIONS;
    },
    get PROTOTYPE() {
      return PROTOTYPE;
    },
    get PUSH() {
      return PUSH;
    },
    get SET() {
      return SET;
    },
    get SLICE() {
      return SLICE;
    },
    get THIS() {
      return THIS;
    },
    get TRACEUR_RUNTIME() {
      return TRACEUR_RUNTIME;
    },
    get UNDEFINED() {
      return UNDEFINED;
    },
    get WRITABLE() {
      return WRITABLE;
    }
  };
});
System.registerModule("traceur@0.0.91/src/semantics/util.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/util.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      IDENTIFIER_EXPRESSION = $__0.IDENTIFIER_EXPRESSION,
      LITERAL_EXPRESSION = $__0.LITERAL_EXPRESSION,
      PAREN_EXPRESSION = $__0.PAREN_EXPRESSION,
      UNARY_EXPRESSION = $__0.UNARY_EXPRESSION;
  var UNDEFINED = System.get("traceur@0.0.91/src/syntax/PredefinedName.js").UNDEFINED;
  var VOID = System.get("traceur@0.0.91/src/syntax/TokenType.js").VOID;
  function hasUseStrict(list) {
    for (var i = 0; i < list.length; i++) {
      if (!list[i].isDirectivePrologue())
        return false;
      if (list[i].isUseStrictDirective())
        return true;
    }
    return false;
  }
  function isUndefined(tree) {
    if (tree.type === PAREN_EXPRESSION)
      return isUndefined(tree.expression);
    return tree.type === IDENTIFIER_EXPRESSION && tree.identifierToken.value === UNDEFINED;
  }
  function isVoidExpression(tree) {
    if (tree.type === PAREN_EXPRESSION)
      return isVoidExpression(tree.expression);
    return tree.type === UNARY_EXPRESSION && tree.operator.type === VOID && isLiteralExpression(tree.operand);
  }
  function isLiteralExpression(tree) {
    if (tree.type === PAREN_EXPRESSION)
      return isLiteralExpression(tree.expression);
    return tree.type === LITERAL_EXPRESSION;
  }
  return {
    get hasUseStrict() {
      return hasUseStrict;
    },
    get isUndefined() {
      return isUndefined;
    },
    get isVoidExpression() {
      return isVoidExpression;
    },
    get isLiteralExpression() {
      return isLiteralExpression;
    }
  };
});
System.registerModule("traceur@0.0.91/src/semantics/isTreeStrict.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/isTreeStrict.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      ARROW_FUNCTION_EXPRESSION = $__0.ARROW_FUNCTION_EXPRESSION,
      CLASS_DECLARATION = $__0.CLASS_DECLARATION,
      CLASS_EXPRESSION = $__0.CLASS_EXPRESSION,
      FUNCTION_BODY = $__0.FUNCTION_BODY,
      FUNCTION_DECLARATION = $__0.FUNCTION_DECLARATION,
      FUNCTION_EXPRESSION = $__0.FUNCTION_EXPRESSION,
      GET_ACCESSOR = $__0.GET_ACCESSOR,
      MODULE = $__0.MODULE,
      PROPERTY_METHOD_ASSIGNMENT = $__0.PROPERTY_METHOD_ASSIGNMENT,
      SCRIPT = $__0.SCRIPT,
      SET_ACCESSOR = $__0.SET_ACCESSOR;
  var hasUseStrict = System.get("traceur@0.0.91/src/semantics/util.js").hasUseStrict;
  function isTreeStrict(tree) {
    switch (tree.type) {
      case CLASS_DECLARATION:
      case CLASS_EXPRESSION:
      case MODULE:
        return true;
      case FUNCTION_BODY:
        return hasUseStrict(tree.statements);
      case FUNCTION_EXPRESSION:
      case FUNCTION_DECLARATION:
      case PROPERTY_METHOD_ASSIGNMENT:
        return isTreeStrict(tree.body);
      case ARROW_FUNCTION_EXPRESSION:
        if (tree.body.type === FUNCTION_BODY) {
          return isTreeStrict(tree.body);
        }
        return false;
      case GET_ACCESSOR:
      case SET_ACCESSOR:
        return isTreeStrict(tree.body);
      case SCRIPT:
        return hasUseStrict(tree.scriptItemList);
      default:
        return false;
    }
  }
  return {get isTreeStrict() {
      return isTreeStrict;
    }};
});
System.registerModule("traceur@0.0.91/src/semantics/Scope.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/Scope.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      BLOCK = $__0.BLOCK,
      CATCH = $__0.CATCH;
  var StringMap = System.get("traceur@0.0.91/src/util/StringMap.js").StringMap;
  var VAR = System.get("traceur@0.0.91/src/syntax/TokenType.js").VAR;
  var isTreeStrict = System.get("traceur@0.0.91/src/semantics/isTreeStrict.js").isTreeStrict;
  function reportDuplicateVar(reporter, tree, name) {
    reporter.reportError(tree.location, ("Duplicate declaration, " + name));
  }
  var Scope = function() {
    function Scope(parent, tree) {
      this.parent = parent;
      this.tree = tree;
      this.variableDeclarations_ = new StringMap();
      this.lexicalDeclarations_ = new StringMap();
      this.strictMode = parent && parent.strictMode || isTreeStrict(tree);
      this.inGenerator = parent ? parent.inGenerator || false : false;
    }
    return ($traceurRuntime.createClass)(Scope, {
      addBinding: function(tree, type, reporter) {
        if (type === VAR) {
          this.addVar(tree, reporter);
        } else {
          this.addDeclaration(tree, type, reporter);
        }
      },
      addVar: function(tree, reporter) {
        var name = tree.getStringValue();
        if (this.lexicalDeclarations_.has(name)) {
          reportDuplicateVar(reporter, tree, name);
          return;
        }
        this.variableDeclarations_.set(name, {
          type: VAR,
          tree: tree
        });
        if (!this.isVarScope && this.parent) {
          this.parent.addVar(tree, reporter);
        }
      },
      addDeclaration: function(tree, type, reporter) {
        var name = tree.getStringValue();
        if (this.lexicalDeclarations_.has(name) || this.variableDeclarations_.has(name)) {
          reportDuplicateVar(reporter, tree, name);
          return;
        }
        this.lexicalDeclarations_.set(name, {
          type: type,
          tree: tree
        });
      },
      renameBinding: function(oldName, newTree, newType, reporter) {
        var name = newTree.getStringValue();
        if (newType === VAR) {
          if (this.lexicalDeclarations_.has(oldName)) {
            this.lexicalDeclarations_.delete(oldName);
            this.addVar(newTree, reporter);
          }
        } else if (this.variableDeclarations_.has(oldName)) {
          this.variableDeclarations_.delete(oldName);
          this.addDeclaration(newTree, newType, reporter);
          if (!this.isVarScope && this.parent) {
            this.parent.renameBinding(oldName, newTree, newType);
          }
        }
      },
      get isVarScope() {
        switch (this.tree.type) {
          case BLOCK:
          case CATCH:
            return false;
        }
        return true;
      },
      getVarScope: function() {
        if (this.isVarScope) {
          return this;
        }
        if (this.parent) {
          return this.parent.getVarScope();
        }
        return null;
      },
      getBinding: function(tree) {
        var name = tree.getStringValue();
        return this.getBindingByName(name);
      },
      getBindingByName: function(name) {
        var b = this.lexicalDeclarations_.get(name);
        if (b) {
          return b;
        }
        b = this.variableDeclarations_.get(name);
        if (b && this.isVarScope) {
          return b;
        }
        if (this.parent) {
          return this.parent.getBindingByName(name);
        }
        return null;
      },
      getAllBindingNames: function() {
        var names = this.variableDeclarations_.keysAsSet();
        this.lexicalDeclarations_.forEach(function(name) {
          return names.add(name);
        });
        return names;
      },
      getVariableBindingNames: function() {
        return this.variableDeclarations_.keysAsSet();
      },
      getLexicalBindingNames: function() {
        return this.lexicalDeclarations_.keysAsSet();
      },
      hasBindingName: function(name) {
        return this.lexicalDeclarations_.has(name) || this.variableDeclarations_.has(name);
      },
      hasLexicalBindingName: function(name) {
        return this.lexicalDeclarations_.has(name);
      },
      hasVariableBindingName: function(name) {
        return this.variableDeclarations_.has(name);
      }
    }, {});
  }();
  return {get Scope() {
      return Scope;
    }};
});
System.registerModule("traceur@0.0.91/src/semantics/ScopeVisitor.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/ScopeVisitor.js";
  var Map = System.get("traceur@0.0.91/src/runtime/polyfills/Map.js").Map;
  var ParseTreeVisitor = System.get("traceur@0.0.91/src/syntax/ParseTreeVisitor.js").ParseTreeVisitor;
  var VAR = System.get("traceur@0.0.91/src/syntax/TokenType.js").VAR;
  var Scope = System.get("traceur@0.0.91/src/semantics/Scope.js").Scope;
  var $__4 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      COMPREHENSION_FOR = $__4.COMPREHENSION_FOR,
      VARIABLE_DECLARATION_LIST = $__4.VARIABLE_DECLARATION_LIST;
  var ScopeVisitor = function($__super) {
    function ScopeVisitor() {
      $traceurRuntime.superConstructor(ScopeVisitor).call(this);
      this.map_ = new Map();
      this.scope = null;
      this.withBlockCounter_ = 0;
    }
    return ($traceurRuntime.createClass)(ScopeVisitor, {
      getScopeForTree: function(tree) {
        return this.map_.get(tree);
      },
      createScope: function(tree) {
        return new Scope(this.scope, tree);
      },
      pushScope: function(tree) {
        var scope = this.createScope(tree);
        this.map_.set(tree, scope);
        return this.scope = scope;
      },
      popScope: function(scope) {
        if (this.scope !== scope) {
          throw new Error('ScopeVisitor scope mismatch');
        }
        this.scope = scope.parent;
      },
      visitScript: function(tree) {
        var scope = this.pushScope(tree);
        $traceurRuntime.superGet(this, ScopeVisitor.prototype, "visitScript").call(this, tree);
        this.popScope(scope);
      },
      visitModule: function(tree) {
        var scope = this.pushScope(tree);
        $traceurRuntime.superGet(this, ScopeVisitor.prototype, "visitModule").call(this, tree);
        this.popScope(scope);
      },
      visitBlock: function(tree) {
        var scope = this.pushScope(tree);
        $traceurRuntime.superGet(this, ScopeVisitor.prototype, "visitBlock").call(this, tree);
        this.popScope(scope);
      },
      visitCatch: function(tree) {
        var scope = this.pushScope(tree);
        this.visitAny(tree.binding);
        this.visitList(tree.catchBody.statements);
        this.popScope(scope);
      },
      visitFunctionBodyForScope: function(tree) {
        var parameterList = arguments[1] !== (void 0) ? arguments[1] : tree.parameterList;
        var scope = this.pushScope(tree);
        this.visitAny(parameterList);
        scope.inGenerator = tree.functionKind && tree.isGenerator();
        this.visitAny(tree.body);
        this.popScope(scope);
      },
      visitFunctionExpression: function(tree) {
        this.visitFunctionBodyForScope(tree);
      },
      visitFunctionDeclaration: function(tree) {
        this.visitAny(tree.name);
        this.visitFunctionBodyForScope(tree);
      },
      visitArrowFunctionExpression: function(tree) {
        this.visitFunctionBodyForScope(tree);
      },
      visitGetAccessor: function(tree) {
        this.visitFunctionBodyForScope(tree, null);
      },
      visitSetAccessor: function(tree) {
        this.visitFunctionBodyForScope(tree);
      },
      visitPropertyMethodAssignment: function(tree) {
        this.visitFunctionBodyForScope(tree);
      },
      visitClassDeclaration: function(tree) {
        this.visitAny(tree.superClass);
        var scope = this.pushScope(tree);
        this.visitAny(tree.name);
        this.visitList(tree.elements);
        this.popScope(scope);
      },
      visitClassExpression: function(tree) {
        this.visitAny(tree.superClass);
        var scope;
        if (tree.name) {
          scope = this.pushScope(tree);
          this.visitAny(tree.name);
        }
        this.visitList(tree.elements);
        if (tree.name) {
          this.popScope(scope);
        }
      },
      visitWithStatement: function(tree) {
        this.visitAny(tree.expression);
        this.withBlockCounter_++;
        this.visitAny(tree.body);
        this.withBlockCounter_--;
      },
      get inWithBlock() {
        return this.withBlockCounter_ > 0;
      },
      visitLoop_: function(tree, func) {
        if (tree.initializer.type !== VARIABLE_DECLARATION_LIST || tree.initializer.declarationType === VAR) {
          func();
          return;
        }
        var scope = this.pushScope(tree);
        func();
        this.popScope(scope);
      },
      visitForInStatement: function(tree) {
        var $__5 = this;
        this.visitLoop_(tree, function() {
          return $traceurRuntime.superGet($__5, ScopeVisitor.prototype, "visitForInStatement").call($__5, tree);
        });
      },
      visitForOfStatement: function(tree) {
        var $__5 = this;
        this.visitLoop_(tree, function() {
          return $traceurRuntime.superGet($__5, ScopeVisitor.prototype, "visitForOfStatement").call($__5, tree);
        });
      },
      visitForStatement: function(tree) {
        var $__5 = this;
        if (!tree.initializer) {
          $traceurRuntime.superGet(this, ScopeVisitor.prototype, "visitForStatement").call(this, tree);
        } else {
          this.visitLoop_(tree, function() {
            return $traceurRuntime.superGet($__5, ScopeVisitor.prototype, "visitForStatement").call($__5, tree);
          });
        }
      },
      visitComprehension_: function(tree) {
        var scopes = [];
        for (var i = 0; i < tree.comprehensionList.length; i++) {
          var scope = null;
          if (tree.comprehensionList[i].type === COMPREHENSION_FOR) {
            scope = this.pushScope(tree.comprehensionList[i]);
          }
          scopes.push(scope);
          this.visitAny(tree.comprehensionList[i]);
        }
        this.visitAny(tree.expression);
        for (var i$__6 = scopes.length - 1; i$__6 >= 0; i$__6--) {
          if (scopes[i$__6]) {
            this.popScope(scopes[i$__6]);
          }
        }
      },
      visitArrayComprehension: function(tree) {
        this.visitComprehension_(tree);
      },
      visitGeneratorComprehension: function(tree) {
        this.visitComprehension_(tree);
      },
      visitPredefinedType: function(tree) {},
      visitTypeArguments: function(tree) {},
      visitFunctionType: function(tree) {}
    }, {}, $__super);
  }(ParseTreeVisitor);
  return {get ScopeVisitor() {
      return ScopeVisitor;
    }};
});
System.registerModule("traceur@0.0.91/src/semantics/ScopeChainBuilder.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/ScopeChainBuilder.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      CONST = $__0.CONST,
      LET = $__0.LET,
      VAR = $__0.VAR;
  var ScopeVisitor = System.get("traceur@0.0.91/src/semantics/ScopeVisitor.js").ScopeVisitor;
  var ScopeChainBuilder = function($__super) {
    function ScopeChainBuilder(reporter) {
      $traceurRuntime.superConstructor(ScopeChainBuilder).call(this);
      this.reporter = reporter;
      this.declarationType_ = null;
    }
    return ($traceurRuntime.createClass)(ScopeChainBuilder, {
      visitCatch: function(tree) {
        var scope = this.pushScope(tree);
        this.declarationType_ = LET;
        this.visitAny(tree.binding);
        this.visitList(tree.catchBody.statements);
        this.popScope(scope);
      },
      visitImportedBinding: function(tree) {
        this.declarationType_ = CONST;
        $traceurRuntime.superGet(this, ScopeChainBuilder.prototype, "visitImportedBinding").call(this, tree);
      },
      visitVariableDeclarationList: function(tree) {
        this.declarationType_ = tree.declarationType;
        $traceurRuntime.superGet(this, ScopeChainBuilder.prototype, "visitVariableDeclarationList").call(this, tree);
      },
      visitBindingIdentifier: function(tree) {
        this.declareVariable(tree);
      },
      visitFunctionExpression: function(tree) {
        var scope = this.pushScope(tree);
        if (tree.name) {
          this.declarationType_ = CONST;
          this.visitAny(tree.name);
        }
        this.visitAny(tree.parameterList);
        scope.inGenerator = tree.isGenerator();
        this.visitAny(tree.body);
        this.popScope(scope);
      },
      visitFormalParameter: function(tree) {
        this.declarationType_ = VAR;
        $traceurRuntime.superGet(this, ScopeChainBuilder.prototype, "visitFormalParameter").call(this, tree);
      },
      visitFunctionDeclaration: function(tree) {
        if (this.scope) {
          if (this.scope.isVarScope) {
            this.declarationType_ = VAR;
            this.visitAny(tree.name);
          } else {
            if (!this.scope.strictMode) {
              var varScope = this.scope.getVarScope();
              if (varScope) {
                varScope.addVar(tree.name, this.reporter);
              }
            }
            this.declarationType_ = LET;
            this.visitAny(tree.name);
          }
        }
        this.visitFunctionBodyForScope(tree, tree.parameterList, tree.body);
      },
      visitClassDeclaration: function(tree) {
        this.visitAny(tree.superClass);
        this.declarationType_ = LET;
        this.visitAny(tree.name);
        var scope = this.pushScope(tree);
        this.declarationType_ = CONST;
        this.visitAny(tree.name);
        this.visitList(tree.elements);
        this.popScope(scope);
      },
      visitClassExpression: function(tree) {
        this.visitAny(tree.superClass);
        var scope;
        if (tree.name) {
          scope = this.pushScope(tree);
          this.declarationType_ = CONST;
          this.visitAny(tree.name);
        }
        this.visitList(tree.elements);
        if (tree.name) {
          this.popScope(scope);
        }
      },
      visitComprehensionFor: function(tree) {
        this.declarationType_ = LET;
        $traceurRuntime.superGet(this, ScopeChainBuilder.prototype, "visitComprehensionFor").call(this, tree);
      },
      declareVariable: function(tree) {
        this.scope.addBinding(tree, this.declarationType_, this.reporter);
      }
    }, {}, $__super);
  }(ScopeVisitor);
  return {get ScopeChainBuilder() {
      return ScopeChainBuilder;
    }};
});
System.registerModule("traceur@0.0.91/src/semantics/ConstChecker.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/ConstChecker.js";
  var IDENTIFIER_EXPRESSION = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js").IDENTIFIER_EXPRESSION;
  var $__1 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      CONST = $__1.CONST,
      MINUS_MINUS = $__1.MINUS_MINUS,
      PLUS_PLUS = $__1.PLUS_PLUS;
  var ScopeVisitor = System.get("traceur@0.0.91/src/semantics/ScopeVisitor.js").ScopeVisitor;
  var ScopeChainBuilder = System.get("traceur@0.0.91/src/semantics/ScopeChainBuilder.js").ScopeChainBuilder;
  var ConstChecker = function($__super) {
    function ConstChecker(scopeBuilder, reporter) {
      $traceurRuntime.superConstructor(ConstChecker).call(this);
      this.scopeBuilder_ = scopeBuilder;
      this.reporter_ = reporter;
    }
    return ($traceurRuntime.createClass)(ConstChecker, {
      pushScope: function(tree) {
        return this.scope = this.scopeBuilder_.getScopeForTree(tree);
      },
      visitUnaryExpression: function(tree) {
        if (tree.operand.type === IDENTIFIER_EXPRESSION && (tree.operator.type === PLUS_PLUS || tree.operator.type === MINUS_MINUS)) {
          this.validateMutation_(tree.operand);
        }
        $traceurRuntime.superGet(this, ConstChecker.prototype, "visitUnaryExpression").call(this, tree);
      },
      visitPostfixExpression: function(tree) {
        if (tree.operand.type === IDENTIFIER_EXPRESSION) {
          this.validateMutation_(tree.operand);
        }
        $traceurRuntime.superGet(this, ConstChecker.prototype, "visitPostfixExpression").call(this, tree);
      },
      visitBinaryExpression: function(tree) {
        if (tree.left.type === IDENTIFIER_EXPRESSION && tree.operator.isAssignmentOperator()) {
          this.validateMutation_(tree.left);
        }
        $traceurRuntime.superGet(this, ConstChecker.prototype, "visitBinaryExpression").call(this, tree);
      },
      validateMutation_: function(identifierExpression) {
        if (this.inWithBlock) {
          return;
        }
        var binding = this.scope.getBinding(identifierExpression);
        if (binding === null) {
          return;
        }
        var $__5 = binding,
            type = $__5.type,
            tree = $__5.tree;
        if (type === CONST) {
          this.reportError_(identifierExpression.location, (tree.getStringValue() + " is read-only"));
        }
      },
      reportError_: function(location, message) {
        this.reporter_.reportError(location, message);
      }
    }, {}, $__super);
  }(ScopeVisitor);
  function validate(tree, reporter) {
    var builder = new ScopeChainBuilder(reporter);
    builder.visitAny(tree);
    var checker = new ConstChecker(builder, reporter);
    checker.visitAny(tree);
  }
  return {
    get ConstChecker() {
      return ConstChecker;
    },
    get validate() {
      return validate;
    }
  };
});
System.registerModule("traceur@0.0.91/src/semantics/ScopeReferences.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/ScopeReferences.js";
  var Scope = System.get("traceur@0.0.91/src/semantics/Scope.js").Scope;
  var StringSet = System.get("traceur@0.0.91/src/util/StringSet.js").StringSet;
  var ScopeReferences = function($__super) {
    function ScopeReferences(parent, tree) {
      $traceurRuntime.superConstructor(ScopeReferences).call(this, parent, tree);
      this.freeVars_ = new StringSet();
    }
    return ($traceurRuntime.createClass)(ScopeReferences, {
      addReference: function(name) {
        this.freeVars_.add(name);
      },
      hasFreeVariable: function(name) {
        return this.freeVars_.has(name);
      }
    }, {}, $__super);
  }(Scope);
  return {get ScopeReferences() {
      return ScopeReferences;
    }};
});
System.registerModule("traceur@0.0.91/src/semantics/ScopeChainBuilderWithReferences.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/ScopeChainBuilderWithReferences.js";
  var ScopeChainBuilder = System.get("traceur@0.0.91/src/semantics/ScopeChainBuilder.js").ScopeChainBuilder;
  var ScopeReferences = System.get("traceur@0.0.91/src/semantics/ScopeReferences.js").ScopeReferences;
  var $__2 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      FUNCTION_DECLARATION = $__2.FUNCTION_DECLARATION,
      FUNCTION_EXPRESSION = $__2.FUNCTION_EXPRESSION,
      GET_ACCESSOR = $__2.GET_ACCESSOR,
      IDENTIFIER_EXPRESSION = $__2.IDENTIFIER_EXPRESSION,
      MODULE = $__2.MODULE,
      PROPERTY_METHOD_ASSIGNMENT = $__2.PROPERTY_METHOD_ASSIGNMENT,
      SET_ACCESSOR = $__2.SET_ACCESSOR;
  var TYPEOF = System.get("traceur@0.0.91/src/syntax/TokenType.js").TYPEOF;
  function hasArgumentsInScope(scope) {
    for (; scope; scope = scope.parent) {
      switch (scope.tree.type) {
        case FUNCTION_DECLARATION:
        case FUNCTION_EXPRESSION:
        case GET_ACCESSOR:
        case PROPERTY_METHOD_ASSIGNMENT:
        case SET_ACCESSOR:
          return true;
      }
    }
    return false;
  }
  function inModuleScope(scope) {
    for (; scope; scope = scope.parent) {
      if (scope.tree.type === MODULE) {
        return true;
      }
    }
    return false;
  }
  var ScopeChainBuilderWithReferences = function($__super) {
    function ScopeChainBuilderWithReferences() {
      $traceurRuntime.superConstructor(ScopeChainBuilderWithReferences).apply(this, arguments);
    }
    return ($traceurRuntime.createClass)(ScopeChainBuilderWithReferences, {
      createScope: function(tree) {
        return new ScopeReferences(this.scope, tree);
      },
      visitIdentifierExpression: function(tree) {
        if (this.inWithBlock) {
          return;
        }
        var scope = this.scope;
        var name = tree.getStringValue();
        if (name === 'arguments' && hasArgumentsInScope(scope)) {
          return;
        }
        if (name === '__moduleName' && inModuleScope(scope)) {
          return;
        }
        this.referenceFound(tree, name);
      },
      visitUnaryExpression: function(tree) {
        if (tree.operator.type === TYPEOF && tree.operand.type === IDENTIFIER_EXPRESSION) {
          var scope = this.scope;
          var binding = scope.getBinding(tree.operand);
          if (!binding) {
            scope.addVar(tree.operand, this.reporter);
          }
        } else {
          $traceurRuntime.superGet(this, ScopeChainBuilderWithReferences.prototype, "visitUnaryExpression").call(this, tree);
        }
      },
      referenceFound: function(tree, name) {
        this.scope.addReference(name);
      }
    }, {}, $__super);
  }(ScopeChainBuilder);
  return {get ScopeChainBuilderWithReferences() {
      return ScopeChainBuilderWithReferences;
    }};
});
System.registerModule("traceur@0.0.91/src/semantics/FreeVariableChecker.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/FreeVariableChecker.js";
  var ScopeChainBuilderWithReferences = System.get("traceur@0.0.91/src/semantics/ScopeChainBuilderWithReferences.js").ScopeChainBuilderWithReferences;
  var FreeVariableChecker = function($__super) {
    function FreeVariableChecker(reporter, global) {
      $traceurRuntime.superConstructor(FreeVariableChecker).call(this, reporter);
      this.global_ = global;
    }
    return ($traceurRuntime.createClass)(FreeVariableChecker, {referenceFound: function(tree, name) {
        if (this.scope.getBinding(tree))
          return;
        if (!(name in this.global_)) {
          this.reporter.reportError(tree.location, (name + " is not defined"));
        }
      }}, {}, $__super);
  }(ScopeChainBuilderWithReferences);
  function validate(tree, reporter) {
    var global = arguments[2] !== (void 0) ? arguments[2] : Reflect.global;
    var checker = new FreeVariableChecker(reporter, global);
    checker.visitAny(tree);
  }
  return {get validate() {
      return validate;
    }};
});
System.registerModule("traceur@0.0.91/src/util/JSON.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/JSON.js";
  function transform(v) {
    var replacer = arguments[1] !== (void 0) ? arguments[1] : function(k, v) {
      return v;
    };
    return transform_(replacer('', v), replacer);
  }
  function transform_(v, replacer) {
    var rv,
        tv;
    if (Array.isArray(v)) {
      var len = v.length;
      rv = Array(len);
      for (var i = 0; i < len; i++) {
        tv = transform_(replacer(String(i), v[i]), replacer);
        rv[i] = tv === undefined ? null : tv;
      }
      return rv;
    }
    if (v instanceof Object) {
      rv = {};
      Object.keys(v).forEach(function(k) {
        tv = transform_(replacer(k, v[k]), replacer);
        if (tv !== undefined) {
          rv[k] = tv;
        }
      });
      return rv;
    }
    return v;
  }
  return {get transform() {
      return transform;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/Token.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/Token.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      AMPERSAND_EQUAL = $__0.AMPERSAND_EQUAL,
      BAR_EQUAL = $__0.BAR_EQUAL,
      CARET_EQUAL = $__0.CARET_EQUAL,
      EQUAL = $__0.EQUAL,
      LEFT_SHIFT_EQUAL = $__0.LEFT_SHIFT_EQUAL,
      MINUS_EQUAL = $__0.MINUS_EQUAL,
      PERCENT_EQUAL = $__0.PERCENT_EQUAL,
      PLUS_EQUAL = $__0.PLUS_EQUAL,
      RIGHT_SHIFT_EQUAL = $__0.RIGHT_SHIFT_EQUAL,
      SLASH_EQUAL = $__0.SLASH_EQUAL,
      STAR_EQUAL = $__0.STAR_EQUAL,
      STAR_STAR_EQUAL = $__0.STAR_STAR_EQUAL,
      UNSIGNED_RIGHT_SHIFT_EQUAL = $__0.UNSIGNED_RIGHT_SHIFT_EQUAL;
  var Token = function() {
    function Token(type, location) {
      this.type = type;
      this.location = location;
    }
    return ($traceurRuntime.createClass)(Token, {
      toString: function() {
        return this.type;
      },
      isAssignmentOperator: function() {
        return isAssignmentOperator(this.type);
      },
      isKeyword: function() {
        return false;
      },
      isStrictKeyword: function() {
        return false;
      }
    }, {});
  }();
  function isAssignmentOperator(type) {
    switch (type) {
      case AMPERSAND_EQUAL:
      case BAR_EQUAL:
      case CARET_EQUAL:
      case EQUAL:
      case LEFT_SHIFT_EQUAL:
      case MINUS_EQUAL:
      case PERCENT_EQUAL:
      case PLUS_EQUAL:
      case RIGHT_SHIFT_EQUAL:
      case SLASH_EQUAL:
      case STAR_EQUAL:
      case STAR_STAR_EQUAL:
      case UNSIGNED_RIGHT_SHIFT_EQUAL:
        return true;
    }
    return false;
  }
  return {
    get Token() {
      return Token;
    },
    get isAssignmentOperator() {
      return isAssignmentOperator;
    }
  };
});
System.registerModule("traceur@0.0.91/src/syntax/trees/ParseTree.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/trees/ParseTree.js";
  var ParseTreeType = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js");
  var $__0 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      IDENTIFIER = $__0.IDENTIFIER,
      STAR = $__0.STAR,
      STRING = $__0.STRING,
      VAR = $__0.VAR;
  var Token = System.get("traceur@0.0.91/src/syntax/Token.js").Token;
  var utilJSON = System.get("traceur@0.0.91/src/util/JSON.js");
  var $__2 = System.get("traceur@0.0.91/src/syntax/PredefinedName.js"),
      ASYNC = $__2.ASYNC,
      ASYNC_STAR = $__2.ASYNC_STAR;
  var $__3 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      ARRAY_COMPREHENSION = $__3.ARRAY_COMPREHENSION,
      ARRAY_LITERAL_EXPRESSION = $__3.ARRAY_LITERAL_EXPRESSION,
      ARRAY_PATTERN = $__3.ARRAY_PATTERN,
      ARROW_FUNCTION_EXPRESSION = $__3.ARROW_FUNCTION_EXPRESSION,
      AWAIT_EXPRESSION = $__3.AWAIT_EXPRESSION,
      BINARY_EXPRESSION = $__3.BINARY_EXPRESSION,
      BINDING_IDENTIFIER = $__3.BINDING_IDENTIFIER,
      BLOCK = $__3.BLOCK,
      BREAK_STATEMENT = $__3.BREAK_STATEMENT,
      CALL_EXPRESSION = $__3.CALL_EXPRESSION,
      CLASS_DECLARATION = $__3.CLASS_DECLARATION,
      CLASS_EXPRESSION = $__3.CLASS_EXPRESSION,
      COMMA_EXPRESSION = $__3.COMMA_EXPRESSION,
      CONDITIONAL_EXPRESSION = $__3.CONDITIONAL_EXPRESSION,
      CONTINUE_STATEMENT = $__3.CONTINUE_STATEMENT,
      DEBUGGER_STATEMENT = $__3.DEBUGGER_STATEMENT,
      DO_WHILE_STATEMENT = $__3.DO_WHILE_STATEMENT,
      EMPTY_STATEMENT = $__3.EMPTY_STATEMENT,
      EXPORT_DECLARATION = $__3.EXPORT_DECLARATION,
      EXPRESSION_STATEMENT = $__3.EXPRESSION_STATEMENT,
      FORMAL_PARAMETER = $__3.FORMAL_PARAMETER,
      FOR_IN_STATEMENT = $__3.FOR_IN_STATEMENT,
      FOR_OF_STATEMENT = $__3.FOR_OF_STATEMENT,
      FOR_ON_STATEMENT = $__3.FOR_ON_STATEMENT,
      FOR_STATEMENT = $__3.FOR_STATEMENT,
      FUNCTION_DECLARATION = $__3.FUNCTION_DECLARATION,
      FUNCTION_EXPRESSION = $__3.FUNCTION_EXPRESSION,
      GENERATOR_COMPREHENSION = $__3.GENERATOR_COMPREHENSION,
      IDENTIFIER_EXPRESSION = $__3.IDENTIFIER_EXPRESSION,
      IF_STATEMENT = $__3.IF_STATEMENT,
      IMPORTED_BINDING = $__3.IMPORTED_BINDING,
      IMPORT_DECLARATION = $__3.IMPORT_DECLARATION,
      INTERFACE_DECLARATION = $__3.INTERFACE_DECLARATION,
      LABELLED_STATEMENT = $__3.LABELLED_STATEMENT,
      LITERAL_EXPRESSION = $__3.LITERAL_EXPRESSION,
      LITERAL_PROPERTY_NAME = $__3.LITERAL_PROPERTY_NAME,
      MEMBER_EXPRESSION = $__3.MEMBER_EXPRESSION,
      MEMBER_LOOKUP_EXPRESSION = $__3.MEMBER_LOOKUP_EXPRESSION,
      NEW_EXPRESSION = $__3.NEW_EXPRESSION,
      OBJECT_LITERAL_EXPRESSION = $__3.OBJECT_LITERAL_EXPRESSION,
      OBJECT_PATTERN = $__3.OBJECT_PATTERN,
      PAREN_EXPRESSION = $__3.PAREN_EXPRESSION,
      POSTFIX_EXPRESSION = $__3.POSTFIX_EXPRESSION,
      PREDEFINED_TYPE = $__3.PREDEFINED_TYPE,
      PROPERTY_NAME_SHORTHAND = $__3.PROPERTY_NAME_SHORTHAND,
      REST_PARAMETER = $__3.REST_PARAMETER,
      RETURN_STATEMENT = $__3.RETURN_STATEMENT,
      SPREAD_EXPRESSION = $__3.SPREAD_EXPRESSION,
      SPREAD_PATTERN_ELEMENT = $__3.SPREAD_PATTERN_ELEMENT,
      SUPER_EXPRESSION = $__3.SUPER_EXPRESSION,
      SWITCH_STATEMENT = $__3.SWITCH_STATEMENT,
      TEMPLATE_LITERAL_EXPRESSION = $__3.TEMPLATE_LITERAL_EXPRESSION,
      THIS_EXPRESSION = $__3.THIS_EXPRESSION,
      THROW_STATEMENT = $__3.THROW_STATEMENT,
      TRY_STATEMENT = $__3.TRY_STATEMENT,
      TYPE_REFERENCE = $__3.TYPE_REFERENCE,
      UNARY_EXPRESSION = $__3.UNARY_EXPRESSION,
      VARIABLE_DECLARATION = $__3.VARIABLE_DECLARATION,
      VARIABLE_STATEMENT = $__3.VARIABLE_STATEMENT,
      WHILE_STATEMENT = $__3.WHILE_STATEMENT,
      WITH_STATEMENT = $__3.WITH_STATEMENT,
      YIELD_EXPRESSION = $__3.YIELD_EXPRESSION;
  var ParseTree = function() {
    function ParseTree(location) {
      this.location = location;
    }
    return ($traceurRuntime.createClass)(ParseTree, {
      isPattern: function() {
        switch (this.type) {
          case ARRAY_PATTERN:
          case OBJECT_PATTERN:
            return true;
          default:
            return false;
        }
      },
      isLeftHandSideExpression: function() {
        switch (this.type) {
          case ARRAY_PATTERN:
          case IDENTIFIER_EXPRESSION:
          case MEMBER_EXPRESSION:
          case MEMBER_LOOKUP_EXPRESSION:
          case OBJECT_PATTERN:
            return true;
          case PAREN_EXPRESSION:
            return this.expression.isLeftHandSideExpression();
          default:
            return false;
        }
      },
      isAssignmentExpression: function() {
        switch (this.type) {
          case ARRAY_COMPREHENSION:
          case ARRAY_LITERAL_EXPRESSION:
          case ARROW_FUNCTION_EXPRESSION:
          case AWAIT_EXPRESSION:
          case BINARY_EXPRESSION:
          case CALL_EXPRESSION:
          case CLASS_EXPRESSION:
          case CONDITIONAL_EXPRESSION:
          case FUNCTION_EXPRESSION:
          case GENERATOR_COMPREHENSION:
          case IDENTIFIER_EXPRESSION:
          case LITERAL_EXPRESSION:
          case MEMBER_EXPRESSION:
          case MEMBER_LOOKUP_EXPRESSION:
          case NEW_EXPRESSION:
          case OBJECT_LITERAL_EXPRESSION:
          case PAREN_EXPRESSION:
          case POSTFIX_EXPRESSION:
          case TEMPLATE_LITERAL_EXPRESSION:
          case SUPER_EXPRESSION:
          case THIS_EXPRESSION:
          case UNARY_EXPRESSION:
          case YIELD_EXPRESSION:
            return true;
          default:
            return false;
        }
      },
      isMemberExpression: function() {
        switch (this.type) {
          case THIS_EXPRESSION:
          case CLASS_EXPRESSION:
          case SUPER_EXPRESSION:
          case IDENTIFIER_EXPRESSION:
          case LITERAL_EXPRESSION:
          case ARRAY_LITERAL_EXPRESSION:
          case OBJECT_LITERAL_EXPRESSION:
          case PAREN_EXPRESSION:
          case TEMPLATE_LITERAL_EXPRESSION:
          case FUNCTION_EXPRESSION:
          case MEMBER_LOOKUP_EXPRESSION:
          case MEMBER_EXPRESSION:
          case CALL_EXPRESSION:
            return true;
          case NEW_EXPRESSION:
            return this.args !== null;
        }
        return false;
      },
      isExpression: function() {
        return this.isAssignmentExpression() || this.type === COMMA_EXPRESSION;
      },
      isAssignmentOrSpread: function() {
        return this.isAssignmentExpression() || this.type === SPREAD_EXPRESSION;
      },
      isRestParameter: function() {
        return this.type === REST_PARAMETER || (this.type === FORMAL_PARAMETER && this.parameter.isRestParameter());
      },
      isSpreadPatternElement: function() {
        return this.type === SPREAD_PATTERN_ELEMENT;
      },
      isStatementListItem: function() {
        return this.isStatement() || this.isDeclaration();
      },
      isStatement: function() {
        switch (this.type) {
          case BLOCK:
          case VARIABLE_STATEMENT:
          case EMPTY_STATEMENT:
          case EXPRESSION_STATEMENT:
          case IF_STATEMENT:
          case CONTINUE_STATEMENT:
          case BREAK_STATEMENT:
          case RETURN_STATEMENT:
          case WITH_STATEMENT:
          case LABELLED_STATEMENT:
          case THROW_STATEMENT:
          case TRY_STATEMENT:
          case DEBUGGER_STATEMENT:
            return true;
        }
        return this.isBreakableStatement();
      },
      isDeclaration: function() {
        switch (this.type) {
          case FUNCTION_DECLARATION:
          case CLASS_DECLARATION:
            return true;
        }
        return this.isLexicalDeclaration();
      },
      isLexicalDeclaration: function() {
        switch (this.type) {
          case VARIABLE_STATEMENT:
            return this.declarations.declarationType !== VAR;
        }
        return false;
      },
      isBreakableStatement: function() {
        switch (this.type) {
          case SWITCH_STATEMENT:
            return true;
        }
        return this.isIterationStatement();
      },
      isIterationStatement: function() {
        switch (this.type) {
          case DO_WHILE_STATEMENT:
          case FOR_IN_STATEMENT:
          case FOR_OF_STATEMENT:
          case FOR_ON_STATEMENT:
          case FOR_STATEMENT:
          case WHILE_STATEMENT:
            return true;
        }
        return false;
      },
      isScriptElement: function() {
        switch (this.type) {
          case CLASS_DECLARATION:
          case EXPORT_DECLARATION:
          case FUNCTION_DECLARATION:
          case IMPORT_DECLARATION:
          case INTERFACE_DECLARATION:
          case VARIABLE_DECLARATION:
            return true;
        }
        return this.isStatement();
      },
      isGenerator: function() {
        return this.functionKind !== null && this.functionKind.type === STAR;
      },
      isAsyncFunction: function() {
        return this.functionKind !== null && this.functionKind.type === IDENTIFIER && this.functionKind.value === ASYNC;
      },
      isAsyncGenerator: function() {
        return this.functionKind !== null && this.functionKind.type === IDENTIFIER && this.functionKind.value === ASYNC_STAR;
      },
      isType: function() {
        switch (this.type) {
          case PREDEFINED_TYPE:
          case TYPE_REFERENCE:
            return true;
        }
        return false;
      },
      getDirectivePrologueStringToken_: function() {
        var tree = this;
        if (tree.type !== EXPRESSION_STATEMENT || !(tree = tree.expression))
          return null;
        if (tree.type !== LITERAL_EXPRESSION || !(tree = tree.literalToken))
          return null;
        if (tree.type !== STRING)
          return null;
        return tree;
      },
      isDirectivePrologue: function() {
        return this.getDirectivePrologueStringToken_() !== null;
      },
      isUseStrictDirective: function() {
        var token = this.getDirectivePrologueStringToken_();
        if (!token)
          return false;
        var v = token.value;
        return v === '"use strict"' || v === "'use strict'";
      },
      toJSON: function() {
        return utilJSON.transform(this, ParseTree.replacer);
      },
      stringify: function() {
        var indent = arguments[0] !== (void 0) ? arguments[0] : 2;
        return JSON.stringify(this, ParseTree.replacer, indent);
      },
      getStringValue: function() {
        switch (this.type) {
          case IDENTIFIER_EXPRESSION:
          case BINDING_IDENTIFIER:
            return this.identifierToken.toString();
          case IMPORTED_BINDING:
            return this.binding.getStringValue();
          case PROPERTY_NAME_SHORTHAND:
            return this.name.toString();
          case LITERAL_PROPERTY_NAME:
            return this.literalToken.toString();
        }
        throw new Error('Not yet implemented');
      }
    }, {
      stripLocation: function(key, value) {
        if (key === 'location') {
          return undefined;
        }
        return value;
      },
      replacer: function(k, v) {
        if (v instanceof ParseTree || v instanceof Token) {
          var rv = {type: v.type};
          Object.keys(v).forEach(function(name) {
            if (name !== 'location')
              rv[name] = v[name];
          });
          return rv;
        }
        return v;
      }
    });
  }();
  return {
    get ParseTreeType() {
      return ParseTreeType;
    },
    get ParseTree() {
      return ParseTree;
    }
  };
});
System.registerModule("traceur@0.0.91/src/syntax/trees/ParseTrees.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/trees/ParseTrees.js";
  var ParseTree = System.get("traceur@0.0.91/src/syntax/trees/ParseTree.js").ParseTree;
  var ParseTreeType = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js");
  var ANNOTATION = ParseTreeType.ANNOTATION;
  var Annotation = function($__super) {
    function Annotation(location, name, args) {
      $traceurRuntime.superConstructor(Annotation).call(this, location);
      this.name = name;
      this.args = args;
    }
    return ($traceurRuntime.createClass)(Annotation, {
      transform: function(transformer) {
        return transformer.transformAnnotation(this);
      },
      visit: function(visitor) {
        visitor.visitAnnotation(this);
      },
      get type() {
        return ANNOTATION;
      }
    }, {}, $__super);
  }(ParseTree);
  var ANON_BLOCK = ParseTreeType.ANON_BLOCK;
  var AnonBlock = function($__super) {
    function AnonBlock(location, statements) {
      $traceurRuntime.superConstructor(AnonBlock).call(this, location);
      this.statements = statements;
    }
    return ($traceurRuntime.createClass)(AnonBlock, {
      transform: function(transformer) {
        return transformer.transformAnonBlock(this);
      },
      visit: function(visitor) {
        visitor.visitAnonBlock(this);
      },
      get type() {
        return ANON_BLOCK;
      }
    }, {}, $__super);
  }(ParseTree);
  var ARGUMENT_LIST = ParseTreeType.ARGUMENT_LIST;
  var ArgumentList = function($__super) {
    function ArgumentList(location, args) {
      $traceurRuntime.superConstructor(ArgumentList).call(this, location);
      this.args = args;
    }
    return ($traceurRuntime.createClass)(ArgumentList, {
      transform: function(transformer) {
        return transformer.transformArgumentList(this);
      },
      visit: function(visitor) {
        visitor.visitArgumentList(this);
      },
      get type() {
        return ARGUMENT_LIST;
      }
    }, {}, $__super);
  }(ParseTree);
  var ARRAY_COMPREHENSION = ParseTreeType.ARRAY_COMPREHENSION;
  var ArrayComprehension = function($__super) {
    function ArrayComprehension(location, comprehensionList, expression) {
      $traceurRuntime.superConstructor(ArrayComprehension).call(this, location);
      this.comprehensionList = comprehensionList;
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(ArrayComprehension, {
      transform: function(transformer) {
        return transformer.transformArrayComprehension(this);
      },
      visit: function(visitor) {
        visitor.visitArrayComprehension(this);
      },
      get type() {
        return ARRAY_COMPREHENSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var ARRAY_LITERAL_EXPRESSION = ParseTreeType.ARRAY_LITERAL_EXPRESSION;
  var ArrayLiteralExpression = function($__super) {
    function ArrayLiteralExpression(location, elements) {
      $traceurRuntime.superConstructor(ArrayLiteralExpression).call(this, location);
      this.elements = elements;
    }
    return ($traceurRuntime.createClass)(ArrayLiteralExpression, {
      transform: function(transformer) {
        return transformer.transformArrayLiteralExpression(this);
      },
      visit: function(visitor) {
        visitor.visitArrayLiteralExpression(this);
      },
      get type() {
        return ARRAY_LITERAL_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var ARRAY_PATTERN = ParseTreeType.ARRAY_PATTERN;
  var ArrayPattern = function($__super) {
    function ArrayPattern(location, elements) {
      $traceurRuntime.superConstructor(ArrayPattern).call(this, location);
      this.elements = elements;
    }
    return ($traceurRuntime.createClass)(ArrayPattern, {
      transform: function(transformer) {
        return transformer.transformArrayPattern(this);
      },
      visit: function(visitor) {
        visitor.visitArrayPattern(this);
      },
      get type() {
        return ARRAY_PATTERN;
      }
    }, {}, $__super);
  }(ParseTree);
  var ARRAY_TYPE = ParseTreeType.ARRAY_TYPE;
  var ArrayType = function($__super) {
    function ArrayType(location, elementType) {
      $traceurRuntime.superConstructor(ArrayType).call(this, location);
      this.elementType = elementType;
    }
    return ($traceurRuntime.createClass)(ArrayType, {
      transform: function(transformer) {
        return transformer.transformArrayType(this);
      },
      visit: function(visitor) {
        visitor.visitArrayType(this);
      },
      get type() {
        return ARRAY_TYPE;
      }
    }, {}, $__super);
  }(ParseTree);
  var ARROW_FUNCTION_EXPRESSION = ParseTreeType.ARROW_FUNCTION_EXPRESSION;
  var ArrowFunctionExpression = function($__super) {
    function ArrowFunctionExpression(location, functionKind, parameterList, body) {
      $traceurRuntime.superConstructor(ArrowFunctionExpression).call(this, location);
      this.functionKind = functionKind;
      this.parameterList = parameterList;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(ArrowFunctionExpression, {
      transform: function(transformer) {
        return transformer.transformArrowFunctionExpression(this);
      },
      visit: function(visitor) {
        visitor.visitArrowFunctionExpression(this);
      },
      get type() {
        return ARROW_FUNCTION_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var ASSIGNMENT_ELEMENT = ParseTreeType.ASSIGNMENT_ELEMENT;
  var AssignmentElement = function($__super) {
    function AssignmentElement(location, assignment, initializer) {
      $traceurRuntime.superConstructor(AssignmentElement).call(this, location);
      this.assignment = assignment;
      this.initializer = initializer;
    }
    return ($traceurRuntime.createClass)(AssignmentElement, {
      transform: function(transformer) {
        return transformer.transformAssignmentElement(this);
      },
      visit: function(visitor) {
        visitor.visitAssignmentElement(this);
      },
      get type() {
        return ASSIGNMENT_ELEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var AWAIT_EXPRESSION = ParseTreeType.AWAIT_EXPRESSION;
  var AwaitExpression = function($__super) {
    function AwaitExpression(location, expression) {
      $traceurRuntime.superConstructor(AwaitExpression).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(AwaitExpression, {
      transform: function(transformer) {
        return transformer.transformAwaitExpression(this);
      },
      visit: function(visitor) {
        visitor.visitAwaitExpression(this);
      },
      get type() {
        return AWAIT_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var BINARY_EXPRESSION = ParseTreeType.BINARY_EXPRESSION;
  var BinaryExpression = function($__super) {
    function BinaryExpression(location, left, operator, right) {
      $traceurRuntime.superConstructor(BinaryExpression).call(this, location);
      this.left = left;
      this.operator = operator;
      this.right = right;
    }
    return ($traceurRuntime.createClass)(BinaryExpression, {
      transform: function(transformer) {
        return transformer.transformBinaryExpression(this);
      },
      visit: function(visitor) {
        visitor.visitBinaryExpression(this);
      },
      get type() {
        return BINARY_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var BINDING_ELEMENT = ParseTreeType.BINDING_ELEMENT;
  var BindingElement = function($__super) {
    function BindingElement(location, binding, initializer) {
      $traceurRuntime.superConstructor(BindingElement).call(this, location);
      this.binding = binding;
      this.initializer = initializer;
    }
    return ($traceurRuntime.createClass)(BindingElement, {
      transform: function(transformer) {
        return transformer.transformBindingElement(this);
      },
      visit: function(visitor) {
        visitor.visitBindingElement(this);
      },
      get type() {
        return BINDING_ELEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var BINDING_IDENTIFIER = ParseTreeType.BINDING_IDENTIFIER;
  var BindingIdentifier = function($__super) {
    function BindingIdentifier(location, identifierToken) {
      $traceurRuntime.superConstructor(BindingIdentifier).call(this, location);
      this.identifierToken = identifierToken;
    }
    return ($traceurRuntime.createClass)(BindingIdentifier, {
      transform: function(transformer) {
        return transformer.transformBindingIdentifier(this);
      },
      visit: function(visitor) {
        visitor.visitBindingIdentifier(this);
      },
      get type() {
        return BINDING_IDENTIFIER;
      }
    }, {}, $__super);
  }(ParseTree);
  var BLOCK = ParseTreeType.BLOCK;
  var Block = function($__super) {
    function Block(location, statements) {
      $traceurRuntime.superConstructor(Block).call(this, location);
      this.statements = statements;
    }
    return ($traceurRuntime.createClass)(Block, {
      transform: function(transformer) {
        return transformer.transformBlock(this);
      },
      visit: function(visitor) {
        visitor.visitBlock(this);
      },
      get type() {
        return BLOCK;
      }
    }, {}, $__super);
  }(ParseTree);
  var BREAK_STATEMENT = ParseTreeType.BREAK_STATEMENT;
  var BreakStatement = function($__super) {
    function BreakStatement(location, name) {
      $traceurRuntime.superConstructor(BreakStatement).call(this, location);
      this.name = name;
    }
    return ($traceurRuntime.createClass)(BreakStatement, {
      transform: function(transformer) {
        return transformer.transformBreakStatement(this);
      },
      visit: function(visitor) {
        visitor.visitBreakStatement(this);
      },
      get type() {
        return BREAK_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var CALL_EXPRESSION = ParseTreeType.CALL_EXPRESSION;
  var CallExpression = function($__super) {
    function CallExpression(location, operand, args) {
      $traceurRuntime.superConstructor(CallExpression).call(this, location);
      this.operand = operand;
      this.args = args;
    }
    return ($traceurRuntime.createClass)(CallExpression, {
      transform: function(transformer) {
        return transformer.transformCallExpression(this);
      },
      visit: function(visitor) {
        visitor.visitCallExpression(this);
      },
      get type() {
        return CALL_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var CALL_SIGNATURE = ParseTreeType.CALL_SIGNATURE;
  var CallSignature = function($__super) {
    function CallSignature(location, typeParameters, parameterList, returnType) {
      $traceurRuntime.superConstructor(CallSignature).call(this, location);
      this.typeParameters = typeParameters;
      this.parameterList = parameterList;
      this.returnType = returnType;
    }
    return ($traceurRuntime.createClass)(CallSignature, {
      transform: function(transformer) {
        return transformer.transformCallSignature(this);
      },
      visit: function(visitor) {
        visitor.visitCallSignature(this);
      },
      get type() {
        return CALL_SIGNATURE;
      }
    }, {}, $__super);
  }(ParseTree);
  var CASE_CLAUSE = ParseTreeType.CASE_CLAUSE;
  var CaseClause = function($__super) {
    function CaseClause(location, expression, statements) {
      $traceurRuntime.superConstructor(CaseClause).call(this, location);
      this.expression = expression;
      this.statements = statements;
    }
    return ($traceurRuntime.createClass)(CaseClause, {
      transform: function(transformer) {
        return transformer.transformCaseClause(this);
      },
      visit: function(visitor) {
        visitor.visitCaseClause(this);
      },
      get type() {
        return CASE_CLAUSE;
      }
    }, {}, $__super);
  }(ParseTree);
  var CATCH = ParseTreeType.CATCH;
  var Catch = function($__super) {
    function Catch(location, binding, catchBody) {
      $traceurRuntime.superConstructor(Catch).call(this, location);
      this.binding = binding;
      this.catchBody = catchBody;
    }
    return ($traceurRuntime.createClass)(Catch, {
      transform: function(transformer) {
        return transformer.transformCatch(this);
      },
      visit: function(visitor) {
        visitor.visitCatch(this);
      },
      get type() {
        return CATCH;
      }
    }, {}, $__super);
  }(ParseTree);
  var CLASS_DECLARATION = ParseTreeType.CLASS_DECLARATION;
  var ClassDeclaration = function($__super) {
    function ClassDeclaration(location, name, superClass, elements, annotations, typeParameters) {
      $traceurRuntime.superConstructor(ClassDeclaration).call(this, location);
      this.name = name;
      this.superClass = superClass;
      this.elements = elements;
      this.annotations = annotations;
      this.typeParameters = typeParameters;
    }
    return ($traceurRuntime.createClass)(ClassDeclaration, {
      transform: function(transformer) {
        return transformer.transformClassDeclaration(this);
      },
      visit: function(visitor) {
        visitor.visitClassDeclaration(this);
      },
      get type() {
        return CLASS_DECLARATION;
      }
    }, {}, $__super);
  }(ParseTree);
  var CLASS_EXPRESSION = ParseTreeType.CLASS_EXPRESSION;
  var ClassExpression = function($__super) {
    function ClassExpression(location, name, superClass, elements, annotations, typeParameters) {
      $traceurRuntime.superConstructor(ClassExpression).call(this, location);
      this.name = name;
      this.superClass = superClass;
      this.elements = elements;
      this.annotations = annotations;
      this.typeParameters = typeParameters;
    }
    return ($traceurRuntime.createClass)(ClassExpression, {
      transform: function(transformer) {
        return transformer.transformClassExpression(this);
      },
      visit: function(visitor) {
        visitor.visitClassExpression(this);
      },
      get type() {
        return CLASS_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var COMMA_EXPRESSION = ParseTreeType.COMMA_EXPRESSION;
  var CommaExpression = function($__super) {
    function CommaExpression(location, expressions) {
      $traceurRuntime.superConstructor(CommaExpression).call(this, location);
      this.expressions = expressions;
    }
    return ($traceurRuntime.createClass)(CommaExpression, {
      transform: function(transformer) {
        return transformer.transformCommaExpression(this);
      },
      visit: function(visitor) {
        visitor.visitCommaExpression(this);
      },
      get type() {
        return COMMA_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var COMPREHENSION_FOR = ParseTreeType.COMPREHENSION_FOR;
  var ComprehensionFor = function($__super) {
    function ComprehensionFor(location, left, iterator) {
      $traceurRuntime.superConstructor(ComprehensionFor).call(this, location);
      this.left = left;
      this.iterator = iterator;
    }
    return ($traceurRuntime.createClass)(ComprehensionFor, {
      transform: function(transformer) {
        return transformer.transformComprehensionFor(this);
      },
      visit: function(visitor) {
        visitor.visitComprehensionFor(this);
      },
      get type() {
        return COMPREHENSION_FOR;
      }
    }, {}, $__super);
  }(ParseTree);
  var COMPREHENSION_IF = ParseTreeType.COMPREHENSION_IF;
  var ComprehensionIf = function($__super) {
    function ComprehensionIf(location, expression) {
      $traceurRuntime.superConstructor(ComprehensionIf).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(ComprehensionIf, {
      transform: function(transformer) {
        return transformer.transformComprehensionIf(this);
      },
      visit: function(visitor) {
        visitor.visitComprehensionIf(this);
      },
      get type() {
        return COMPREHENSION_IF;
      }
    }, {}, $__super);
  }(ParseTree);
  var COMPUTED_PROPERTY_NAME = ParseTreeType.COMPUTED_PROPERTY_NAME;
  var ComputedPropertyName = function($__super) {
    function ComputedPropertyName(location, expression) {
      $traceurRuntime.superConstructor(ComputedPropertyName).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(ComputedPropertyName, {
      transform: function(transformer) {
        return transformer.transformComputedPropertyName(this);
      },
      visit: function(visitor) {
        visitor.visitComputedPropertyName(this);
      },
      get type() {
        return COMPUTED_PROPERTY_NAME;
      }
    }, {}, $__super);
  }(ParseTree);
  var CONDITIONAL_EXPRESSION = ParseTreeType.CONDITIONAL_EXPRESSION;
  var ConditionalExpression = function($__super) {
    function ConditionalExpression(location, condition, left, right) {
      $traceurRuntime.superConstructor(ConditionalExpression).call(this, location);
      this.condition = condition;
      this.left = left;
      this.right = right;
    }
    return ($traceurRuntime.createClass)(ConditionalExpression, {
      transform: function(transformer) {
        return transformer.transformConditionalExpression(this);
      },
      visit: function(visitor) {
        visitor.visitConditionalExpression(this);
      },
      get type() {
        return CONDITIONAL_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var CONSTRUCT_SIGNATURE = ParseTreeType.CONSTRUCT_SIGNATURE;
  var ConstructSignature = function($__super) {
    function ConstructSignature(location, typeParameters, parameterList, returnType) {
      $traceurRuntime.superConstructor(ConstructSignature).call(this, location);
      this.typeParameters = typeParameters;
      this.parameterList = parameterList;
      this.returnType = returnType;
    }
    return ($traceurRuntime.createClass)(ConstructSignature, {
      transform: function(transformer) {
        return transformer.transformConstructSignature(this);
      },
      visit: function(visitor) {
        visitor.visitConstructSignature(this);
      },
      get type() {
        return CONSTRUCT_SIGNATURE;
      }
    }, {}, $__super);
  }(ParseTree);
  var CONSTRUCTOR_TYPE = ParseTreeType.CONSTRUCTOR_TYPE;
  var ConstructorType = function($__super) {
    function ConstructorType(location, typeParameters, parameterList, returnType) {
      $traceurRuntime.superConstructor(ConstructorType).call(this, location);
      this.typeParameters = typeParameters;
      this.parameterList = parameterList;
      this.returnType = returnType;
    }
    return ($traceurRuntime.createClass)(ConstructorType, {
      transform: function(transformer) {
        return transformer.transformConstructorType(this);
      },
      visit: function(visitor) {
        visitor.visitConstructorType(this);
      },
      get type() {
        return CONSTRUCTOR_TYPE;
      }
    }, {}, $__super);
  }(ParseTree);
  var CONTINUE_STATEMENT = ParseTreeType.CONTINUE_STATEMENT;
  var ContinueStatement = function($__super) {
    function ContinueStatement(location, name) {
      $traceurRuntime.superConstructor(ContinueStatement).call(this, location);
      this.name = name;
    }
    return ($traceurRuntime.createClass)(ContinueStatement, {
      transform: function(transformer) {
        return transformer.transformContinueStatement(this);
      },
      visit: function(visitor) {
        visitor.visitContinueStatement(this);
      },
      get type() {
        return CONTINUE_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var COVER_FORMALS = ParseTreeType.COVER_FORMALS;
  var CoverFormals = function($__super) {
    function CoverFormals(location, expressions) {
      $traceurRuntime.superConstructor(CoverFormals).call(this, location);
      this.expressions = expressions;
    }
    return ($traceurRuntime.createClass)(CoverFormals, {
      transform: function(transformer) {
        return transformer.transformCoverFormals(this);
      },
      visit: function(visitor) {
        visitor.visitCoverFormals(this);
      },
      get type() {
        return COVER_FORMALS;
      }
    }, {}, $__super);
  }(ParseTree);
  var COVER_INITIALIZED_NAME = ParseTreeType.COVER_INITIALIZED_NAME;
  var CoverInitializedName = function($__super) {
    function CoverInitializedName(location, name, equalToken, initializer) {
      $traceurRuntime.superConstructor(CoverInitializedName).call(this, location);
      this.name = name;
      this.equalToken = equalToken;
      this.initializer = initializer;
    }
    return ($traceurRuntime.createClass)(CoverInitializedName, {
      transform: function(transformer) {
        return transformer.transformCoverInitializedName(this);
      },
      visit: function(visitor) {
        visitor.visitCoverInitializedName(this);
      },
      get type() {
        return COVER_INITIALIZED_NAME;
      }
    }, {}, $__super);
  }(ParseTree);
  var DEBUGGER_STATEMENT = ParseTreeType.DEBUGGER_STATEMENT;
  var DebuggerStatement = function($__super) {
    function DebuggerStatement(location) {
      $traceurRuntime.superConstructor(DebuggerStatement).call(this, location);
    }
    return ($traceurRuntime.createClass)(DebuggerStatement, {
      transform: function(transformer) {
        return transformer.transformDebuggerStatement(this);
      },
      visit: function(visitor) {
        visitor.visitDebuggerStatement(this);
      },
      get type() {
        return DEBUGGER_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var DEFAULT_CLAUSE = ParseTreeType.DEFAULT_CLAUSE;
  var DefaultClause = function($__super) {
    function DefaultClause(location, statements) {
      $traceurRuntime.superConstructor(DefaultClause).call(this, location);
      this.statements = statements;
    }
    return ($traceurRuntime.createClass)(DefaultClause, {
      transform: function(transformer) {
        return transformer.transformDefaultClause(this);
      },
      visit: function(visitor) {
        visitor.visitDefaultClause(this);
      },
      get type() {
        return DEFAULT_CLAUSE;
      }
    }, {}, $__super);
  }(ParseTree);
  var DO_WHILE_STATEMENT = ParseTreeType.DO_WHILE_STATEMENT;
  var DoWhileStatement = function($__super) {
    function DoWhileStatement(location, body, condition) {
      $traceurRuntime.superConstructor(DoWhileStatement).call(this, location);
      this.body = body;
      this.condition = condition;
    }
    return ($traceurRuntime.createClass)(DoWhileStatement, {
      transform: function(transformer) {
        return transformer.transformDoWhileStatement(this);
      },
      visit: function(visitor) {
        visitor.visitDoWhileStatement(this);
      },
      get type() {
        return DO_WHILE_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var EMPTY_STATEMENT = ParseTreeType.EMPTY_STATEMENT;
  var EmptyStatement = function($__super) {
    function EmptyStatement(location) {
      $traceurRuntime.superConstructor(EmptyStatement).call(this, location);
    }
    return ($traceurRuntime.createClass)(EmptyStatement, {
      transform: function(transformer) {
        return transformer.transformEmptyStatement(this);
      },
      visit: function(visitor) {
        visitor.visitEmptyStatement(this);
      },
      get type() {
        return EMPTY_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var EXPORT_DECLARATION = ParseTreeType.EXPORT_DECLARATION;
  var ExportDeclaration = function($__super) {
    function ExportDeclaration(location, declaration, annotations) {
      $traceurRuntime.superConstructor(ExportDeclaration).call(this, location);
      this.declaration = declaration;
      this.annotations = annotations;
    }
    return ($traceurRuntime.createClass)(ExportDeclaration, {
      transform: function(transformer) {
        return transformer.transformExportDeclaration(this);
      },
      visit: function(visitor) {
        visitor.visitExportDeclaration(this);
      },
      get type() {
        return EXPORT_DECLARATION;
      }
    }, {}, $__super);
  }(ParseTree);
  var EXPORT_DEFAULT = ParseTreeType.EXPORT_DEFAULT;
  var ExportDefault = function($__super) {
    function ExportDefault(location, expression) {
      $traceurRuntime.superConstructor(ExportDefault).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(ExportDefault, {
      transform: function(transformer) {
        return transformer.transformExportDefault(this);
      },
      visit: function(visitor) {
        visitor.visitExportDefault(this);
      },
      get type() {
        return EXPORT_DEFAULT;
      }
    }, {}, $__super);
  }(ParseTree);
  var EXPORT_SPECIFIER = ParseTreeType.EXPORT_SPECIFIER;
  var ExportSpecifier = function($__super) {
    function ExportSpecifier(location, lhs, rhs) {
      $traceurRuntime.superConstructor(ExportSpecifier).call(this, location);
      this.lhs = lhs;
      this.rhs = rhs;
    }
    return ($traceurRuntime.createClass)(ExportSpecifier, {
      transform: function(transformer) {
        return transformer.transformExportSpecifier(this);
      },
      visit: function(visitor) {
        visitor.visitExportSpecifier(this);
      },
      get type() {
        return EXPORT_SPECIFIER;
      }
    }, {}, $__super);
  }(ParseTree);
  var EXPORT_SPECIFIER_SET = ParseTreeType.EXPORT_SPECIFIER_SET;
  var ExportSpecifierSet = function($__super) {
    function ExportSpecifierSet(location, specifiers) {
      $traceurRuntime.superConstructor(ExportSpecifierSet).call(this, location);
      this.specifiers = specifiers;
    }
    return ($traceurRuntime.createClass)(ExportSpecifierSet, {
      transform: function(transformer) {
        return transformer.transformExportSpecifierSet(this);
      },
      visit: function(visitor) {
        visitor.visitExportSpecifierSet(this);
      },
      get type() {
        return EXPORT_SPECIFIER_SET;
      }
    }, {}, $__super);
  }(ParseTree);
  var EXPORT_STAR = ParseTreeType.EXPORT_STAR;
  var ExportStar = function($__super) {
    function ExportStar(location) {
      $traceurRuntime.superConstructor(ExportStar).call(this, location);
    }
    return ($traceurRuntime.createClass)(ExportStar, {
      transform: function(transformer) {
        return transformer.transformExportStar(this);
      },
      visit: function(visitor) {
        visitor.visitExportStar(this);
      },
      get type() {
        return EXPORT_STAR;
      }
    }, {}, $__super);
  }(ParseTree);
  var EXPRESSION_STATEMENT = ParseTreeType.EXPRESSION_STATEMENT;
  var ExpressionStatement = function($__super) {
    function ExpressionStatement(location, expression) {
      $traceurRuntime.superConstructor(ExpressionStatement).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(ExpressionStatement, {
      transform: function(transformer) {
        return transformer.transformExpressionStatement(this);
      },
      visit: function(visitor) {
        visitor.visitExpressionStatement(this);
      },
      get type() {
        return EXPRESSION_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var FINALLY = ParseTreeType.FINALLY;
  var Finally = function($__super) {
    function Finally(location, block) {
      $traceurRuntime.superConstructor(Finally).call(this, location);
      this.block = block;
    }
    return ($traceurRuntime.createClass)(Finally, {
      transform: function(transformer) {
        return transformer.transformFinally(this);
      },
      visit: function(visitor) {
        visitor.visitFinally(this);
      },
      get type() {
        return FINALLY;
      }
    }, {}, $__super);
  }(ParseTree);
  var FOR_IN_STATEMENT = ParseTreeType.FOR_IN_STATEMENT;
  var ForInStatement = function($__super) {
    function ForInStatement(location, initializer, collection, body) {
      $traceurRuntime.superConstructor(ForInStatement).call(this, location);
      this.initializer = initializer;
      this.collection = collection;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(ForInStatement, {
      transform: function(transformer) {
        return transformer.transformForInStatement(this);
      },
      visit: function(visitor) {
        visitor.visitForInStatement(this);
      },
      get type() {
        return FOR_IN_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var FOR_OF_STATEMENT = ParseTreeType.FOR_OF_STATEMENT;
  var ForOfStatement = function($__super) {
    function ForOfStatement(location, initializer, collection, body) {
      $traceurRuntime.superConstructor(ForOfStatement).call(this, location);
      this.initializer = initializer;
      this.collection = collection;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(ForOfStatement, {
      transform: function(transformer) {
        return transformer.transformForOfStatement(this);
      },
      visit: function(visitor) {
        visitor.visitForOfStatement(this);
      },
      get type() {
        return FOR_OF_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var FOR_ON_STATEMENT = ParseTreeType.FOR_ON_STATEMENT;
  var ForOnStatement = function($__super) {
    function ForOnStatement(location, initializer, observable, body) {
      $traceurRuntime.superConstructor(ForOnStatement).call(this, location);
      this.initializer = initializer;
      this.observable = observable;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(ForOnStatement, {
      transform: function(transformer) {
        return transformer.transformForOnStatement(this);
      },
      visit: function(visitor) {
        visitor.visitForOnStatement(this);
      },
      get type() {
        return FOR_ON_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var FOR_STATEMENT = ParseTreeType.FOR_STATEMENT;
  var ForStatement = function($__super) {
    function ForStatement(location, initializer, condition, increment, body) {
      $traceurRuntime.superConstructor(ForStatement).call(this, location);
      this.initializer = initializer;
      this.condition = condition;
      this.increment = increment;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(ForStatement, {
      transform: function(transformer) {
        return transformer.transformForStatement(this);
      },
      visit: function(visitor) {
        visitor.visitForStatement(this);
      },
      get type() {
        return FOR_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var FORMAL_PARAMETER = ParseTreeType.FORMAL_PARAMETER;
  var FormalParameter = function($__super) {
    function FormalParameter(location, parameter, typeAnnotation, annotations) {
      $traceurRuntime.superConstructor(FormalParameter).call(this, location);
      this.parameter = parameter;
      this.typeAnnotation = typeAnnotation;
      this.annotations = annotations;
    }
    return ($traceurRuntime.createClass)(FormalParameter, {
      transform: function(transformer) {
        return transformer.transformFormalParameter(this);
      },
      visit: function(visitor) {
        visitor.visitFormalParameter(this);
      },
      get type() {
        return FORMAL_PARAMETER;
      }
    }, {}, $__super);
  }(ParseTree);
  var FORMAL_PARAMETER_LIST = ParseTreeType.FORMAL_PARAMETER_LIST;
  var FormalParameterList = function($__super) {
    function FormalParameterList(location, parameters) {
      $traceurRuntime.superConstructor(FormalParameterList).call(this, location);
      this.parameters = parameters;
    }
    return ($traceurRuntime.createClass)(FormalParameterList, {
      transform: function(transformer) {
        return transformer.transformFormalParameterList(this);
      },
      visit: function(visitor) {
        visitor.visitFormalParameterList(this);
      },
      get type() {
        return FORMAL_PARAMETER_LIST;
      }
    }, {}, $__super);
  }(ParseTree);
  var FORWARD_DEFAULT_EXPORT = ParseTreeType.FORWARD_DEFAULT_EXPORT;
  var ForwardDefaultExport = function($__super) {
    function ForwardDefaultExport(location, name) {
      $traceurRuntime.superConstructor(ForwardDefaultExport).call(this, location);
      this.name = name;
    }
    return ($traceurRuntime.createClass)(ForwardDefaultExport, {
      transform: function(transformer) {
        return transformer.transformForwardDefaultExport(this);
      },
      visit: function(visitor) {
        visitor.visitForwardDefaultExport(this);
      },
      get type() {
        return FORWARD_DEFAULT_EXPORT;
      }
    }, {}, $__super);
  }(ParseTree);
  var FUNCTION_BODY = ParseTreeType.FUNCTION_BODY;
  var FunctionBody = function($__super) {
    function FunctionBody(location, statements) {
      $traceurRuntime.superConstructor(FunctionBody).call(this, location);
      this.statements = statements;
    }
    return ($traceurRuntime.createClass)(FunctionBody, {
      transform: function(transformer) {
        return transformer.transformFunctionBody(this);
      },
      visit: function(visitor) {
        visitor.visitFunctionBody(this);
      },
      get type() {
        return FUNCTION_BODY;
      }
    }, {}, $__super);
  }(ParseTree);
  var FUNCTION_DECLARATION = ParseTreeType.FUNCTION_DECLARATION;
  var FunctionDeclaration = function($__super) {
    function FunctionDeclaration(location, name, functionKind, parameterList, typeAnnotation, annotations, body) {
      $traceurRuntime.superConstructor(FunctionDeclaration).call(this, location);
      this.name = name;
      this.functionKind = functionKind;
      this.parameterList = parameterList;
      this.typeAnnotation = typeAnnotation;
      this.annotations = annotations;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(FunctionDeclaration, {
      transform: function(transformer) {
        return transformer.transformFunctionDeclaration(this);
      },
      visit: function(visitor) {
        visitor.visitFunctionDeclaration(this);
      },
      get type() {
        return FUNCTION_DECLARATION;
      }
    }, {}, $__super);
  }(ParseTree);
  var FUNCTION_EXPRESSION = ParseTreeType.FUNCTION_EXPRESSION;
  var FunctionExpression = function($__super) {
    function FunctionExpression(location, name, functionKind, parameterList, typeAnnotation, annotations, body) {
      $traceurRuntime.superConstructor(FunctionExpression).call(this, location);
      this.name = name;
      this.functionKind = functionKind;
      this.parameterList = parameterList;
      this.typeAnnotation = typeAnnotation;
      this.annotations = annotations;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(FunctionExpression, {
      transform: function(transformer) {
        return transformer.transformFunctionExpression(this);
      },
      visit: function(visitor) {
        visitor.visitFunctionExpression(this);
      },
      get type() {
        return FUNCTION_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var FUNCTION_TYPE = ParseTreeType.FUNCTION_TYPE;
  var FunctionType = function($__super) {
    function FunctionType(location, typeParameters, parameterList, returnType) {
      $traceurRuntime.superConstructor(FunctionType).call(this, location);
      this.typeParameters = typeParameters;
      this.parameterList = parameterList;
      this.returnType = returnType;
    }
    return ($traceurRuntime.createClass)(FunctionType, {
      transform: function(transformer) {
        return transformer.transformFunctionType(this);
      },
      visit: function(visitor) {
        visitor.visitFunctionType(this);
      },
      get type() {
        return FUNCTION_TYPE;
      }
    }, {}, $__super);
  }(ParseTree);
  var GENERATOR_COMPREHENSION = ParseTreeType.GENERATOR_COMPREHENSION;
  var GeneratorComprehension = function($__super) {
    function GeneratorComprehension(location, comprehensionList, expression) {
      $traceurRuntime.superConstructor(GeneratorComprehension).call(this, location);
      this.comprehensionList = comprehensionList;
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(GeneratorComprehension, {
      transform: function(transformer) {
        return transformer.transformGeneratorComprehension(this);
      },
      visit: function(visitor) {
        visitor.visitGeneratorComprehension(this);
      },
      get type() {
        return GENERATOR_COMPREHENSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var GET_ACCESSOR = ParseTreeType.GET_ACCESSOR;
  var GetAccessor = function($__super) {
    function GetAccessor(location, isStatic, name, typeAnnotation, annotations, body) {
      $traceurRuntime.superConstructor(GetAccessor).call(this, location);
      this.isStatic = isStatic;
      this.name = name;
      this.typeAnnotation = typeAnnotation;
      this.annotations = annotations;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(GetAccessor, {
      transform: function(transformer) {
        return transformer.transformGetAccessor(this);
      },
      visit: function(visitor) {
        visitor.visitGetAccessor(this);
      },
      get type() {
        return GET_ACCESSOR;
      }
    }, {}, $__super);
  }(ParseTree);
  var IDENTIFIER_EXPRESSION = ParseTreeType.IDENTIFIER_EXPRESSION;
  var IdentifierExpression = function($__super) {
    function IdentifierExpression(location, identifierToken) {
      $traceurRuntime.superConstructor(IdentifierExpression).call(this, location);
      this.identifierToken = identifierToken;
    }
    return ($traceurRuntime.createClass)(IdentifierExpression, {
      transform: function(transformer) {
        return transformer.transformIdentifierExpression(this);
      },
      visit: function(visitor) {
        visitor.visitIdentifierExpression(this);
      },
      get type() {
        return IDENTIFIER_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var IF_STATEMENT = ParseTreeType.IF_STATEMENT;
  var IfStatement = function($__super) {
    function IfStatement(location, condition, ifClause, elseClause) {
      $traceurRuntime.superConstructor(IfStatement).call(this, location);
      this.condition = condition;
      this.ifClause = ifClause;
      this.elseClause = elseClause;
    }
    return ($traceurRuntime.createClass)(IfStatement, {
      transform: function(transformer) {
        return transformer.transformIfStatement(this);
      },
      visit: function(visitor) {
        visitor.visitIfStatement(this);
      },
      get type() {
        return IF_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var IMPORTED_BINDING = ParseTreeType.IMPORTED_BINDING;
  var ImportedBinding = function($__super) {
    function ImportedBinding(location, binding) {
      $traceurRuntime.superConstructor(ImportedBinding).call(this, location);
      this.binding = binding;
    }
    return ($traceurRuntime.createClass)(ImportedBinding, {
      transform: function(transformer) {
        return transformer.transformImportedBinding(this);
      },
      visit: function(visitor) {
        visitor.visitImportedBinding(this);
      },
      get type() {
        return IMPORTED_BINDING;
      }
    }, {}, $__super);
  }(ParseTree);
  var IMPORT_CLAUSE_PAIR = ParseTreeType.IMPORT_CLAUSE_PAIR;
  var ImportClausePair = function($__super) {
    function ImportClausePair(location, first, second) {
      $traceurRuntime.superConstructor(ImportClausePair).call(this, location);
      this.first = first;
      this.second = second;
    }
    return ($traceurRuntime.createClass)(ImportClausePair, {
      transform: function(transformer) {
        return transformer.transformImportClausePair(this);
      },
      visit: function(visitor) {
        visitor.visitImportClausePair(this);
      },
      get type() {
        return IMPORT_CLAUSE_PAIR;
      }
    }, {}, $__super);
  }(ParseTree);
  var IMPORT_DECLARATION = ParseTreeType.IMPORT_DECLARATION;
  var ImportDeclaration = function($__super) {
    function ImportDeclaration(location, importClause, moduleSpecifier) {
      $traceurRuntime.superConstructor(ImportDeclaration).call(this, location);
      this.importClause = importClause;
      this.moduleSpecifier = moduleSpecifier;
    }
    return ($traceurRuntime.createClass)(ImportDeclaration, {
      transform: function(transformer) {
        return transformer.transformImportDeclaration(this);
      },
      visit: function(visitor) {
        visitor.visitImportDeclaration(this);
      },
      get type() {
        return IMPORT_DECLARATION;
      }
    }, {}, $__super);
  }(ParseTree);
  var IMPORT_SPECIFIER = ParseTreeType.IMPORT_SPECIFIER;
  var ImportSpecifier = function($__super) {
    function ImportSpecifier(location, binding, name) {
      $traceurRuntime.superConstructor(ImportSpecifier).call(this, location);
      this.binding = binding;
      this.name = name;
    }
    return ($traceurRuntime.createClass)(ImportSpecifier, {
      transform: function(transformer) {
        return transformer.transformImportSpecifier(this);
      },
      visit: function(visitor) {
        visitor.visitImportSpecifier(this);
      },
      get type() {
        return IMPORT_SPECIFIER;
      }
    }, {}, $__super);
  }(ParseTree);
  var IMPORT_SPECIFIER_SET = ParseTreeType.IMPORT_SPECIFIER_SET;
  var ImportSpecifierSet = function($__super) {
    function ImportSpecifierSet(location, specifiers) {
      $traceurRuntime.superConstructor(ImportSpecifierSet).call(this, location);
      this.specifiers = specifiers;
    }
    return ($traceurRuntime.createClass)(ImportSpecifierSet, {
      transform: function(transformer) {
        return transformer.transformImportSpecifierSet(this);
      },
      visit: function(visitor) {
        visitor.visitImportSpecifierSet(this);
      },
      get type() {
        return IMPORT_SPECIFIER_SET;
      }
    }, {}, $__super);
  }(ParseTree);
  var INDEX_SIGNATURE = ParseTreeType.INDEX_SIGNATURE;
  var IndexSignature = function($__super) {
    function IndexSignature(location, name, indexType, typeAnnotation) {
      $traceurRuntime.superConstructor(IndexSignature).call(this, location);
      this.name = name;
      this.indexType = indexType;
      this.typeAnnotation = typeAnnotation;
    }
    return ($traceurRuntime.createClass)(IndexSignature, {
      transform: function(transformer) {
        return transformer.transformIndexSignature(this);
      },
      visit: function(visitor) {
        visitor.visitIndexSignature(this);
      },
      get type() {
        return INDEX_SIGNATURE;
      }
    }, {}, $__super);
  }(ParseTree);
  var INTERFACE_DECLARATION = ParseTreeType.INTERFACE_DECLARATION;
  var InterfaceDeclaration = function($__super) {
    function InterfaceDeclaration(location, name, typeParameters, extendsClause, objectType) {
      $traceurRuntime.superConstructor(InterfaceDeclaration).call(this, location);
      this.name = name;
      this.typeParameters = typeParameters;
      this.extendsClause = extendsClause;
      this.objectType = objectType;
    }
    return ($traceurRuntime.createClass)(InterfaceDeclaration, {
      transform: function(transformer) {
        return transformer.transformInterfaceDeclaration(this);
      },
      visit: function(visitor) {
        visitor.visitInterfaceDeclaration(this);
      },
      get type() {
        return INTERFACE_DECLARATION;
      }
    }, {}, $__super);
  }(ParseTree);
  var LABELLED_STATEMENT = ParseTreeType.LABELLED_STATEMENT;
  var LabelledStatement = function($__super) {
    function LabelledStatement(location, name, statement) {
      $traceurRuntime.superConstructor(LabelledStatement).call(this, location);
      this.name = name;
      this.statement = statement;
    }
    return ($traceurRuntime.createClass)(LabelledStatement, {
      transform: function(transformer) {
        return transformer.transformLabelledStatement(this);
      },
      visit: function(visitor) {
        visitor.visitLabelledStatement(this);
      },
      get type() {
        return LABELLED_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var LITERAL_EXPRESSION = ParseTreeType.LITERAL_EXPRESSION;
  var LiteralExpression = function($__super) {
    function LiteralExpression(location, literalToken) {
      $traceurRuntime.superConstructor(LiteralExpression).call(this, location);
      this.literalToken = literalToken;
    }
    return ($traceurRuntime.createClass)(LiteralExpression, {
      transform: function(transformer) {
        return transformer.transformLiteralExpression(this);
      },
      visit: function(visitor) {
        visitor.visitLiteralExpression(this);
      },
      get type() {
        return LITERAL_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var LITERAL_PROPERTY_NAME = ParseTreeType.LITERAL_PROPERTY_NAME;
  var LiteralPropertyName = function($__super) {
    function LiteralPropertyName(location, literalToken) {
      $traceurRuntime.superConstructor(LiteralPropertyName).call(this, location);
      this.literalToken = literalToken;
    }
    return ($traceurRuntime.createClass)(LiteralPropertyName, {
      transform: function(transformer) {
        return transformer.transformLiteralPropertyName(this);
      },
      visit: function(visitor) {
        visitor.visitLiteralPropertyName(this);
      },
      get type() {
        return LITERAL_PROPERTY_NAME;
      }
    }, {}, $__super);
  }(ParseTree);
  var MEMBER_EXPRESSION = ParseTreeType.MEMBER_EXPRESSION;
  var MemberExpression = function($__super) {
    function MemberExpression(location, operand, memberName) {
      $traceurRuntime.superConstructor(MemberExpression).call(this, location);
      this.operand = operand;
      this.memberName = memberName;
    }
    return ($traceurRuntime.createClass)(MemberExpression, {
      transform: function(transformer) {
        return transformer.transformMemberExpression(this);
      },
      visit: function(visitor) {
        visitor.visitMemberExpression(this);
      },
      get type() {
        return MEMBER_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var MEMBER_LOOKUP_EXPRESSION = ParseTreeType.MEMBER_LOOKUP_EXPRESSION;
  var MemberLookupExpression = function($__super) {
    function MemberLookupExpression(location, operand, memberExpression) {
      $traceurRuntime.superConstructor(MemberLookupExpression).call(this, location);
      this.operand = operand;
      this.memberExpression = memberExpression;
    }
    return ($traceurRuntime.createClass)(MemberLookupExpression, {
      transform: function(transformer) {
        return transformer.transformMemberLookupExpression(this);
      },
      visit: function(visitor) {
        visitor.visitMemberLookupExpression(this);
      },
      get type() {
        return MEMBER_LOOKUP_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var METHOD_SIGNATURE = ParseTreeType.METHOD_SIGNATURE;
  var MethodSignature = function($__super) {
    function MethodSignature(location, name, optional, callSignature) {
      $traceurRuntime.superConstructor(MethodSignature).call(this, location);
      this.name = name;
      this.optional = optional;
      this.callSignature = callSignature;
    }
    return ($traceurRuntime.createClass)(MethodSignature, {
      transform: function(transformer) {
        return transformer.transformMethodSignature(this);
      },
      visit: function(visitor) {
        visitor.visitMethodSignature(this);
      },
      get type() {
        return METHOD_SIGNATURE;
      }
    }, {}, $__super);
  }(ParseTree);
  var MODULE = ParseTreeType.MODULE;
  var Module = function($__super) {
    function Module(location, scriptItemList, moduleName) {
      $traceurRuntime.superConstructor(Module).call(this, location);
      this.scriptItemList = scriptItemList;
      this.moduleName = moduleName;
    }
    return ($traceurRuntime.createClass)(Module, {
      transform: function(transformer) {
        return transformer.transformModule(this);
      },
      visit: function(visitor) {
        visitor.visitModule(this);
      },
      get type() {
        return MODULE;
      }
    }, {}, $__super);
  }(ParseTree);
  var MODULE_SPECIFIER = ParseTreeType.MODULE_SPECIFIER;
  var ModuleSpecifier = function($__super) {
    function ModuleSpecifier(location, token) {
      $traceurRuntime.superConstructor(ModuleSpecifier).call(this, location);
      this.token = token;
    }
    return ($traceurRuntime.createClass)(ModuleSpecifier, {
      transform: function(transformer) {
        return transformer.transformModuleSpecifier(this);
      },
      visit: function(visitor) {
        visitor.visitModuleSpecifier(this);
      },
      get type() {
        return MODULE_SPECIFIER;
      }
    }, {}, $__super);
  }(ParseTree);
  var NAME_SPACE_EXPORT = ParseTreeType.NAME_SPACE_EXPORT;
  var NameSpaceExport = function($__super) {
    function NameSpaceExport(location, name) {
      $traceurRuntime.superConstructor(NameSpaceExport).call(this, location);
      this.name = name;
    }
    return ($traceurRuntime.createClass)(NameSpaceExport, {
      transform: function(transformer) {
        return transformer.transformNameSpaceExport(this);
      },
      visit: function(visitor) {
        visitor.visitNameSpaceExport(this);
      },
      get type() {
        return NAME_SPACE_EXPORT;
      }
    }, {}, $__super);
  }(ParseTree);
  var NAME_SPACE_IMPORT = ParseTreeType.NAME_SPACE_IMPORT;
  var NameSpaceImport = function($__super) {
    function NameSpaceImport(location, binding) {
      $traceurRuntime.superConstructor(NameSpaceImport).call(this, location);
      this.binding = binding;
    }
    return ($traceurRuntime.createClass)(NameSpaceImport, {
      transform: function(transformer) {
        return transformer.transformNameSpaceImport(this);
      },
      visit: function(visitor) {
        visitor.visitNameSpaceImport(this);
      },
      get type() {
        return NAME_SPACE_IMPORT;
      }
    }, {}, $__super);
  }(ParseTree);
  var NAMED_EXPORT = ParseTreeType.NAMED_EXPORT;
  var NamedExport = function($__super) {
    function NamedExport(location, exportClause, moduleSpecifier) {
      $traceurRuntime.superConstructor(NamedExport).call(this, location);
      this.exportClause = exportClause;
      this.moduleSpecifier = moduleSpecifier;
    }
    return ($traceurRuntime.createClass)(NamedExport, {
      transform: function(transformer) {
        return transformer.transformNamedExport(this);
      },
      visit: function(visitor) {
        visitor.visitNamedExport(this);
      },
      get type() {
        return NAMED_EXPORT;
      }
    }, {}, $__super);
  }(ParseTree);
  var NEW_EXPRESSION = ParseTreeType.NEW_EXPRESSION;
  var NewExpression = function($__super) {
    function NewExpression(location, operand, args) {
      $traceurRuntime.superConstructor(NewExpression).call(this, location);
      this.operand = operand;
      this.args = args;
    }
    return ($traceurRuntime.createClass)(NewExpression, {
      transform: function(transformer) {
        return transformer.transformNewExpression(this);
      },
      visit: function(visitor) {
        visitor.visitNewExpression(this);
      },
      get type() {
        return NEW_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var OBJECT_LITERAL_EXPRESSION = ParseTreeType.OBJECT_LITERAL_EXPRESSION;
  var ObjectLiteralExpression = function($__super) {
    function ObjectLiteralExpression(location, propertyNameAndValues) {
      $traceurRuntime.superConstructor(ObjectLiteralExpression).call(this, location);
      this.propertyNameAndValues = propertyNameAndValues;
    }
    return ($traceurRuntime.createClass)(ObjectLiteralExpression, {
      transform: function(transformer) {
        return transformer.transformObjectLiteralExpression(this);
      },
      visit: function(visitor) {
        visitor.visitObjectLiteralExpression(this);
      },
      get type() {
        return OBJECT_LITERAL_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var OBJECT_PATTERN = ParseTreeType.OBJECT_PATTERN;
  var ObjectPattern = function($__super) {
    function ObjectPattern(location, fields) {
      $traceurRuntime.superConstructor(ObjectPattern).call(this, location);
      this.fields = fields;
    }
    return ($traceurRuntime.createClass)(ObjectPattern, {
      transform: function(transformer) {
        return transformer.transformObjectPattern(this);
      },
      visit: function(visitor) {
        visitor.visitObjectPattern(this);
      },
      get type() {
        return OBJECT_PATTERN;
      }
    }, {}, $__super);
  }(ParseTree);
  var OBJECT_PATTERN_FIELD = ParseTreeType.OBJECT_PATTERN_FIELD;
  var ObjectPatternField = function($__super) {
    function ObjectPatternField(location, name, element) {
      $traceurRuntime.superConstructor(ObjectPatternField).call(this, location);
      this.name = name;
      this.element = element;
    }
    return ($traceurRuntime.createClass)(ObjectPatternField, {
      transform: function(transformer) {
        return transformer.transformObjectPatternField(this);
      },
      visit: function(visitor) {
        visitor.visitObjectPatternField(this);
      },
      get type() {
        return OBJECT_PATTERN_FIELD;
      }
    }, {}, $__super);
  }(ParseTree);
  var OBJECT_TYPE = ParseTreeType.OBJECT_TYPE;
  var ObjectType = function($__super) {
    function ObjectType(location, typeMembers) {
      $traceurRuntime.superConstructor(ObjectType).call(this, location);
      this.typeMembers = typeMembers;
    }
    return ($traceurRuntime.createClass)(ObjectType, {
      transform: function(transformer) {
        return transformer.transformObjectType(this);
      },
      visit: function(visitor) {
        visitor.visitObjectType(this);
      },
      get type() {
        return OBJECT_TYPE;
      }
    }, {}, $__super);
  }(ParseTree);
  var PAREN_EXPRESSION = ParseTreeType.PAREN_EXPRESSION;
  var ParenExpression = function($__super) {
    function ParenExpression(location, expression) {
      $traceurRuntime.superConstructor(ParenExpression).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(ParenExpression, {
      transform: function(transformer) {
        return transformer.transformParenExpression(this);
      },
      visit: function(visitor) {
        visitor.visitParenExpression(this);
      },
      get type() {
        return PAREN_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var POSTFIX_EXPRESSION = ParseTreeType.POSTFIX_EXPRESSION;
  var PostfixExpression = function($__super) {
    function PostfixExpression(location, operand, operator) {
      $traceurRuntime.superConstructor(PostfixExpression).call(this, location);
      this.operand = operand;
      this.operator = operator;
    }
    return ($traceurRuntime.createClass)(PostfixExpression, {
      transform: function(transformer) {
        return transformer.transformPostfixExpression(this);
      },
      visit: function(visitor) {
        visitor.visitPostfixExpression(this);
      },
      get type() {
        return POSTFIX_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var PREDEFINED_TYPE = ParseTreeType.PREDEFINED_TYPE;
  var PredefinedType = function($__super) {
    function PredefinedType(location, typeToken) {
      $traceurRuntime.superConstructor(PredefinedType).call(this, location);
      this.typeToken = typeToken;
    }
    return ($traceurRuntime.createClass)(PredefinedType, {
      transform: function(transformer) {
        return transformer.transformPredefinedType(this);
      },
      visit: function(visitor) {
        visitor.visitPredefinedType(this);
      },
      get type() {
        return PREDEFINED_TYPE;
      }
    }, {}, $__super);
  }(ParseTree);
  var SCRIPT = ParseTreeType.SCRIPT;
  var Script = function($__super) {
    function Script(location, scriptItemList, moduleName) {
      $traceurRuntime.superConstructor(Script).call(this, location);
      this.scriptItemList = scriptItemList;
      this.moduleName = moduleName;
    }
    return ($traceurRuntime.createClass)(Script, {
      transform: function(transformer) {
        return transformer.transformScript(this);
      },
      visit: function(visitor) {
        visitor.visitScript(this);
      },
      get type() {
        return SCRIPT;
      }
    }, {}, $__super);
  }(ParseTree);
  var PROPERTY_METHOD_ASSIGNMENT = ParseTreeType.PROPERTY_METHOD_ASSIGNMENT;
  var PropertyMethodAssignment = function($__super) {
    function PropertyMethodAssignment(location, isStatic, functionKind, name, parameterList, typeAnnotation, annotations, body, debugName) {
      $traceurRuntime.superConstructor(PropertyMethodAssignment).call(this, location);
      this.isStatic = isStatic;
      this.functionKind = functionKind;
      this.name = name;
      this.parameterList = parameterList;
      this.typeAnnotation = typeAnnotation;
      this.annotations = annotations;
      this.body = body;
      this.debugName = debugName;
    }
    return ($traceurRuntime.createClass)(PropertyMethodAssignment, {
      transform: function(transformer) {
        return transformer.transformPropertyMethodAssignment(this);
      },
      visit: function(visitor) {
        visitor.visitPropertyMethodAssignment(this);
      },
      get type() {
        return PROPERTY_METHOD_ASSIGNMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var PROPERTY_NAME_ASSIGNMENT = ParseTreeType.PROPERTY_NAME_ASSIGNMENT;
  var PropertyNameAssignment = function($__super) {
    function PropertyNameAssignment(location, name, value) {
      $traceurRuntime.superConstructor(PropertyNameAssignment).call(this, location);
      this.name = name;
      this.value = value;
    }
    return ($traceurRuntime.createClass)(PropertyNameAssignment, {
      transform: function(transformer) {
        return transformer.transformPropertyNameAssignment(this);
      },
      visit: function(visitor) {
        visitor.visitPropertyNameAssignment(this);
      },
      get type() {
        return PROPERTY_NAME_ASSIGNMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var PROPERTY_NAME_SHORTHAND = ParseTreeType.PROPERTY_NAME_SHORTHAND;
  var PropertyNameShorthand = function($__super) {
    function PropertyNameShorthand(location, name) {
      $traceurRuntime.superConstructor(PropertyNameShorthand).call(this, location);
      this.name = name;
    }
    return ($traceurRuntime.createClass)(PropertyNameShorthand, {
      transform: function(transformer) {
        return transformer.transformPropertyNameShorthand(this);
      },
      visit: function(visitor) {
        visitor.visitPropertyNameShorthand(this);
      },
      get type() {
        return PROPERTY_NAME_SHORTHAND;
      }
    }, {}, $__super);
  }(ParseTree);
  var PROPERTY_VARIABLE_DECLARATION = ParseTreeType.PROPERTY_VARIABLE_DECLARATION;
  var PropertyVariableDeclaration = function($__super) {
    function PropertyVariableDeclaration(location, isStatic, name, typeAnnotation, annotations, initializer) {
      $traceurRuntime.superConstructor(PropertyVariableDeclaration).call(this, location);
      this.isStatic = isStatic;
      this.name = name;
      this.typeAnnotation = typeAnnotation;
      this.annotations = annotations;
      this.initializer = initializer;
    }
    return ($traceurRuntime.createClass)(PropertyVariableDeclaration, {
      transform: function(transformer) {
        return transformer.transformPropertyVariableDeclaration(this);
      },
      visit: function(visitor) {
        visitor.visitPropertyVariableDeclaration(this);
      },
      get type() {
        return PROPERTY_VARIABLE_DECLARATION;
      }
    }, {}, $__super);
  }(ParseTree);
  var PROPERTY_SIGNATURE = ParseTreeType.PROPERTY_SIGNATURE;
  var PropertySignature = function($__super) {
    function PropertySignature(location, name, optional, typeAnnotation) {
      $traceurRuntime.superConstructor(PropertySignature).call(this, location);
      this.name = name;
      this.optional = optional;
      this.typeAnnotation = typeAnnotation;
    }
    return ($traceurRuntime.createClass)(PropertySignature, {
      transform: function(transformer) {
        return transformer.transformPropertySignature(this);
      },
      visit: function(visitor) {
        visitor.visitPropertySignature(this);
      },
      get type() {
        return PROPERTY_SIGNATURE;
      }
    }, {}, $__super);
  }(ParseTree);
  var REST_PARAMETER = ParseTreeType.REST_PARAMETER;
  var RestParameter = function($__super) {
    function RestParameter(location, identifier, typeAnnotation) {
      $traceurRuntime.superConstructor(RestParameter).call(this, location);
      this.identifier = identifier;
      this.typeAnnotation = typeAnnotation;
    }
    return ($traceurRuntime.createClass)(RestParameter, {
      transform: function(transformer) {
        return transformer.transformRestParameter(this);
      },
      visit: function(visitor) {
        visitor.visitRestParameter(this);
      },
      get type() {
        return REST_PARAMETER;
      }
    }, {}, $__super);
  }(ParseTree);
  var RETURN_STATEMENT = ParseTreeType.RETURN_STATEMENT;
  var ReturnStatement = function($__super) {
    function ReturnStatement(location, expression) {
      $traceurRuntime.superConstructor(ReturnStatement).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(ReturnStatement, {
      transform: function(transformer) {
        return transformer.transformReturnStatement(this);
      },
      visit: function(visitor) {
        visitor.visitReturnStatement(this);
      },
      get type() {
        return RETURN_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var SET_ACCESSOR = ParseTreeType.SET_ACCESSOR;
  var SetAccessor = function($__super) {
    function SetAccessor(location, isStatic, name, parameterList, annotations, body) {
      $traceurRuntime.superConstructor(SetAccessor).call(this, location);
      this.isStatic = isStatic;
      this.name = name;
      this.parameterList = parameterList;
      this.annotations = annotations;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(SetAccessor, {
      transform: function(transformer) {
        return transformer.transformSetAccessor(this);
      },
      visit: function(visitor) {
        visitor.visitSetAccessor(this);
      },
      get type() {
        return SET_ACCESSOR;
      }
    }, {}, $__super);
  }(ParseTree);
  var SPREAD_EXPRESSION = ParseTreeType.SPREAD_EXPRESSION;
  var SpreadExpression = function($__super) {
    function SpreadExpression(location, expression) {
      $traceurRuntime.superConstructor(SpreadExpression).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(SpreadExpression, {
      transform: function(transformer) {
        return transformer.transformSpreadExpression(this);
      },
      visit: function(visitor) {
        visitor.visitSpreadExpression(this);
      },
      get type() {
        return SPREAD_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var SPREAD_PATTERN_ELEMENT = ParseTreeType.SPREAD_PATTERN_ELEMENT;
  var SpreadPatternElement = function($__super) {
    function SpreadPatternElement(location, lvalue) {
      $traceurRuntime.superConstructor(SpreadPatternElement).call(this, location);
      this.lvalue = lvalue;
    }
    return ($traceurRuntime.createClass)(SpreadPatternElement, {
      transform: function(transformer) {
        return transformer.transformSpreadPatternElement(this);
      },
      visit: function(visitor) {
        visitor.visitSpreadPatternElement(this);
      },
      get type() {
        return SPREAD_PATTERN_ELEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var SUPER_EXPRESSION = ParseTreeType.SUPER_EXPRESSION;
  var SuperExpression = function($__super) {
    function SuperExpression(location) {
      $traceurRuntime.superConstructor(SuperExpression).call(this, location);
    }
    return ($traceurRuntime.createClass)(SuperExpression, {
      transform: function(transformer) {
        return transformer.transformSuperExpression(this);
      },
      visit: function(visitor) {
        visitor.visitSuperExpression(this);
      },
      get type() {
        return SUPER_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var SWITCH_STATEMENT = ParseTreeType.SWITCH_STATEMENT;
  var SwitchStatement = function($__super) {
    function SwitchStatement(location, expression, caseClauses) {
      $traceurRuntime.superConstructor(SwitchStatement).call(this, location);
      this.expression = expression;
      this.caseClauses = caseClauses;
    }
    return ($traceurRuntime.createClass)(SwitchStatement, {
      transform: function(transformer) {
        return transformer.transformSwitchStatement(this);
      },
      visit: function(visitor) {
        visitor.visitSwitchStatement(this);
      },
      get type() {
        return SWITCH_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var SYNTAX_ERROR_TREE = ParseTreeType.SYNTAX_ERROR_TREE;
  var SyntaxErrorTree = function($__super) {
    function SyntaxErrorTree(location, nextToken, message) {
      $traceurRuntime.superConstructor(SyntaxErrorTree).call(this, location);
      this.nextToken = nextToken;
      this.message = message;
    }
    return ($traceurRuntime.createClass)(SyntaxErrorTree, {
      transform: function(transformer) {
        return transformer.transformSyntaxErrorTree(this);
      },
      visit: function(visitor) {
        visitor.visitSyntaxErrorTree(this);
      },
      get type() {
        return SYNTAX_ERROR_TREE;
      }
    }, {}, $__super);
  }(ParseTree);
  var TEMPLATE_LITERAL_EXPRESSION = ParseTreeType.TEMPLATE_LITERAL_EXPRESSION;
  var TemplateLiteralExpression = function($__super) {
    function TemplateLiteralExpression(location, operand, elements) {
      $traceurRuntime.superConstructor(TemplateLiteralExpression).call(this, location);
      this.operand = operand;
      this.elements = elements;
    }
    return ($traceurRuntime.createClass)(TemplateLiteralExpression, {
      transform: function(transformer) {
        return transformer.transformTemplateLiteralExpression(this);
      },
      visit: function(visitor) {
        visitor.visitTemplateLiteralExpression(this);
      },
      get type() {
        return TEMPLATE_LITERAL_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var TEMPLATE_LITERAL_PORTION = ParseTreeType.TEMPLATE_LITERAL_PORTION;
  var TemplateLiteralPortion = function($__super) {
    function TemplateLiteralPortion(location, value) {
      $traceurRuntime.superConstructor(TemplateLiteralPortion).call(this, location);
      this.value = value;
    }
    return ($traceurRuntime.createClass)(TemplateLiteralPortion, {
      transform: function(transformer) {
        return transformer.transformTemplateLiteralPortion(this);
      },
      visit: function(visitor) {
        visitor.visitTemplateLiteralPortion(this);
      },
      get type() {
        return TEMPLATE_LITERAL_PORTION;
      }
    }, {}, $__super);
  }(ParseTree);
  var TEMPLATE_SUBSTITUTION = ParseTreeType.TEMPLATE_SUBSTITUTION;
  var TemplateSubstitution = function($__super) {
    function TemplateSubstitution(location, expression) {
      $traceurRuntime.superConstructor(TemplateSubstitution).call(this, location);
      this.expression = expression;
    }
    return ($traceurRuntime.createClass)(TemplateSubstitution, {
      transform: function(transformer) {
        return transformer.transformTemplateSubstitution(this);
      },
      visit: function(visitor) {
        visitor.visitTemplateSubstitution(this);
      },
      get type() {
        return TEMPLATE_SUBSTITUTION;
      }
    }, {}, $__super);
  }(ParseTree);
  var THIS_EXPRESSION = ParseTreeType.THIS_EXPRESSION;
  var ThisExpression = function($__super) {
    function ThisExpression(location) {
      $traceurRuntime.superConstructor(ThisExpression).call(this, location);
    }
    return ($traceurRuntime.createClass)(ThisExpression, {
      transform: function(transformer) {
        return transformer.transformThisExpression(this);
      },
      visit: function(visitor) {
        visitor.visitThisExpression(this);
      },
      get type() {
        return THIS_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var THROW_STATEMENT = ParseTreeType.THROW_STATEMENT;
  var ThrowStatement = function($__super) {
    function ThrowStatement(location, value) {
      $traceurRuntime.superConstructor(ThrowStatement).call(this, location);
      this.value = value;
    }
    return ($traceurRuntime.createClass)(ThrowStatement, {
      transform: function(transformer) {
        return transformer.transformThrowStatement(this);
      },
      visit: function(visitor) {
        visitor.visitThrowStatement(this);
      },
      get type() {
        return THROW_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var TRY_STATEMENT = ParseTreeType.TRY_STATEMENT;
  var TryStatement = function($__super) {
    function TryStatement(location, body, catchBlock, finallyBlock) {
      $traceurRuntime.superConstructor(TryStatement).call(this, location);
      this.body = body;
      this.catchBlock = catchBlock;
      this.finallyBlock = finallyBlock;
    }
    return ($traceurRuntime.createClass)(TryStatement, {
      transform: function(transformer) {
        return transformer.transformTryStatement(this);
      },
      visit: function(visitor) {
        visitor.visitTryStatement(this);
      },
      get type() {
        return TRY_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var TYPE_ARGUMENTS = ParseTreeType.TYPE_ARGUMENTS;
  var TypeArguments = function($__super) {
    function TypeArguments(location, args) {
      $traceurRuntime.superConstructor(TypeArguments).call(this, location);
      this.args = args;
    }
    return ($traceurRuntime.createClass)(TypeArguments, {
      transform: function(transformer) {
        return transformer.transformTypeArguments(this);
      },
      visit: function(visitor) {
        visitor.visitTypeArguments(this);
      },
      get type() {
        return TYPE_ARGUMENTS;
      }
    }, {}, $__super);
  }(ParseTree);
  var TYPE_NAME = ParseTreeType.TYPE_NAME;
  var TypeName = function($__super) {
    function TypeName(location, moduleName, name) {
      $traceurRuntime.superConstructor(TypeName).call(this, location);
      this.moduleName = moduleName;
      this.name = name;
    }
    return ($traceurRuntime.createClass)(TypeName, {
      transform: function(transformer) {
        return transformer.transformTypeName(this);
      },
      visit: function(visitor) {
        visitor.visitTypeName(this);
      },
      get type() {
        return TYPE_NAME;
      }
    }, {}, $__super);
  }(ParseTree);
  var TYPE_PARAMETER = ParseTreeType.TYPE_PARAMETER;
  var TypeParameter = function($__super) {
    function TypeParameter(location, identifierToken, extendsType) {
      $traceurRuntime.superConstructor(TypeParameter).call(this, location);
      this.identifierToken = identifierToken;
      this.extendsType = extendsType;
    }
    return ($traceurRuntime.createClass)(TypeParameter, {
      transform: function(transformer) {
        return transformer.transformTypeParameter(this);
      },
      visit: function(visitor) {
        visitor.visitTypeParameter(this);
      },
      get type() {
        return TYPE_PARAMETER;
      }
    }, {}, $__super);
  }(ParseTree);
  var TYPE_PARAMETERS = ParseTreeType.TYPE_PARAMETERS;
  var TypeParameters = function($__super) {
    function TypeParameters(location, parameters) {
      $traceurRuntime.superConstructor(TypeParameters).call(this, location);
      this.parameters = parameters;
    }
    return ($traceurRuntime.createClass)(TypeParameters, {
      transform: function(transformer) {
        return transformer.transformTypeParameters(this);
      },
      visit: function(visitor) {
        visitor.visitTypeParameters(this);
      },
      get type() {
        return TYPE_PARAMETERS;
      }
    }, {}, $__super);
  }(ParseTree);
  var TYPE_REFERENCE = ParseTreeType.TYPE_REFERENCE;
  var TypeReference = function($__super) {
    function TypeReference(location, typeName, args) {
      $traceurRuntime.superConstructor(TypeReference).call(this, location);
      this.typeName = typeName;
      this.args = args;
    }
    return ($traceurRuntime.createClass)(TypeReference, {
      transform: function(transformer) {
        return transformer.transformTypeReference(this);
      },
      visit: function(visitor) {
        visitor.visitTypeReference(this);
      },
      get type() {
        return TYPE_REFERENCE;
      }
    }, {}, $__super);
  }(ParseTree);
  var UNARY_EXPRESSION = ParseTreeType.UNARY_EXPRESSION;
  var UnaryExpression = function($__super) {
    function UnaryExpression(location, operator, operand) {
      $traceurRuntime.superConstructor(UnaryExpression).call(this, location);
      this.operator = operator;
      this.operand = operand;
    }
    return ($traceurRuntime.createClass)(UnaryExpression, {
      transform: function(transformer) {
        return transformer.transformUnaryExpression(this);
      },
      visit: function(visitor) {
        visitor.visitUnaryExpression(this);
      },
      get type() {
        return UNARY_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  var UNION_TYPE = ParseTreeType.UNION_TYPE;
  var UnionType = function($__super) {
    function UnionType(location, types) {
      $traceurRuntime.superConstructor(UnionType).call(this, location);
      this.types = types;
    }
    return ($traceurRuntime.createClass)(UnionType, {
      transform: function(transformer) {
        return transformer.transformUnionType(this);
      },
      visit: function(visitor) {
        visitor.visitUnionType(this);
      },
      get type() {
        return UNION_TYPE;
      }
    }, {}, $__super);
  }(ParseTree);
  var VARIABLE_DECLARATION = ParseTreeType.VARIABLE_DECLARATION;
  var VariableDeclaration = function($__super) {
    function VariableDeclaration(location, lvalue, typeAnnotation, initializer) {
      $traceurRuntime.superConstructor(VariableDeclaration).call(this, location);
      this.lvalue = lvalue;
      this.typeAnnotation = typeAnnotation;
      this.initializer = initializer;
    }
    return ($traceurRuntime.createClass)(VariableDeclaration, {
      transform: function(transformer) {
        return transformer.transformVariableDeclaration(this);
      },
      visit: function(visitor) {
        visitor.visitVariableDeclaration(this);
      },
      get type() {
        return VARIABLE_DECLARATION;
      }
    }, {}, $__super);
  }(ParseTree);
  var VARIABLE_DECLARATION_LIST = ParseTreeType.VARIABLE_DECLARATION_LIST;
  var VariableDeclarationList = function($__super) {
    function VariableDeclarationList(location, declarationType, declarations) {
      $traceurRuntime.superConstructor(VariableDeclarationList).call(this, location);
      this.declarationType = declarationType;
      this.declarations = declarations;
    }
    return ($traceurRuntime.createClass)(VariableDeclarationList, {
      transform: function(transformer) {
        return transformer.transformVariableDeclarationList(this);
      },
      visit: function(visitor) {
        visitor.visitVariableDeclarationList(this);
      },
      get type() {
        return VARIABLE_DECLARATION_LIST;
      }
    }, {}, $__super);
  }(ParseTree);
  var VARIABLE_STATEMENT = ParseTreeType.VARIABLE_STATEMENT;
  var VariableStatement = function($__super) {
    function VariableStatement(location, declarations) {
      $traceurRuntime.superConstructor(VariableStatement).call(this, location);
      this.declarations = declarations;
    }
    return ($traceurRuntime.createClass)(VariableStatement, {
      transform: function(transformer) {
        return transformer.transformVariableStatement(this);
      },
      visit: function(visitor) {
        visitor.visitVariableStatement(this);
      },
      get type() {
        return VARIABLE_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var WHILE_STATEMENT = ParseTreeType.WHILE_STATEMENT;
  var WhileStatement = function($__super) {
    function WhileStatement(location, condition, body) {
      $traceurRuntime.superConstructor(WhileStatement).call(this, location);
      this.condition = condition;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(WhileStatement, {
      transform: function(transformer) {
        return transformer.transformWhileStatement(this);
      },
      visit: function(visitor) {
        visitor.visitWhileStatement(this);
      },
      get type() {
        return WHILE_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var WITH_STATEMENT = ParseTreeType.WITH_STATEMENT;
  var WithStatement = function($__super) {
    function WithStatement(location, expression, body) {
      $traceurRuntime.superConstructor(WithStatement).call(this, location);
      this.expression = expression;
      this.body = body;
    }
    return ($traceurRuntime.createClass)(WithStatement, {
      transform: function(transformer) {
        return transformer.transformWithStatement(this);
      },
      visit: function(visitor) {
        visitor.visitWithStatement(this);
      },
      get type() {
        return WITH_STATEMENT;
      }
    }, {}, $__super);
  }(ParseTree);
  var YIELD_EXPRESSION = ParseTreeType.YIELD_EXPRESSION;
  var YieldExpression = function($__super) {
    function YieldExpression(location, expression, isYieldFor) {
      $traceurRuntime.superConstructor(YieldExpression).call(this, location);
      this.expression = expression;
      this.isYieldFor = isYieldFor;
    }
    return ($traceurRuntime.createClass)(YieldExpression, {
      transform: function(transformer) {
        return transformer.transformYieldExpression(this);
      },
      visit: function(visitor) {
        visitor.visitYieldExpression(this);
      },
      get type() {
        return YIELD_EXPRESSION;
      }
    }, {}, $__super);
  }(ParseTree);
  return {
    get Annotation() {
      return Annotation;
    },
    get AnonBlock() {
      return AnonBlock;
    },
    get ArgumentList() {
      return ArgumentList;
    },
    get ArrayComprehension() {
      return ArrayComprehension;
    },
    get ArrayLiteralExpression() {
      return ArrayLiteralExpression;
    },
    get ArrayPattern() {
      return ArrayPattern;
    },
    get ArrayType() {
      return ArrayType;
    },
    get ArrowFunctionExpression() {
      return ArrowFunctionExpression;
    },
    get AssignmentElement() {
      return AssignmentElement;
    },
    get AwaitExpression() {
      return AwaitExpression;
    },
    get BinaryExpression() {
      return BinaryExpression;
    },
    get BindingElement() {
      return BindingElement;
    },
    get BindingIdentifier() {
      return BindingIdentifier;
    },
    get Block() {
      return Block;
    },
    get BreakStatement() {
      return BreakStatement;
    },
    get CallExpression() {
      return CallExpression;
    },
    get CallSignature() {
      return CallSignature;
    },
    get CaseClause() {
      return CaseClause;
    },
    get Catch() {
      return Catch;
    },
    get ClassDeclaration() {
      return ClassDeclaration;
    },
    get ClassExpression() {
      return ClassExpression;
    },
    get CommaExpression() {
      return CommaExpression;
    },
    get ComprehensionFor() {
      return ComprehensionFor;
    },
    get ComprehensionIf() {
      return ComprehensionIf;
    },
    get ComputedPropertyName() {
      return ComputedPropertyName;
    },
    get ConditionalExpression() {
      return ConditionalExpression;
    },
    get ConstructSignature() {
      return ConstructSignature;
    },
    get ConstructorType() {
      return ConstructorType;
    },
    get ContinueStatement() {
      return ContinueStatement;
    },
    get CoverFormals() {
      return CoverFormals;
    },
    get CoverInitializedName() {
      return CoverInitializedName;
    },
    get DebuggerStatement() {
      return DebuggerStatement;
    },
    get DefaultClause() {
      return DefaultClause;
    },
    get DoWhileStatement() {
      return DoWhileStatement;
    },
    get EmptyStatement() {
      return EmptyStatement;
    },
    get ExportDeclaration() {
      return ExportDeclaration;
    },
    get ExportDefault() {
      return ExportDefault;
    },
    get ExportSpecifier() {
      return ExportSpecifier;
    },
    get ExportSpecifierSet() {
      return ExportSpecifierSet;
    },
    get ExportStar() {
      return ExportStar;
    },
    get ExpressionStatement() {
      return ExpressionStatement;
    },
    get Finally() {
      return Finally;
    },
    get ForInStatement() {
      return ForInStatement;
    },
    get ForOfStatement() {
      return ForOfStatement;
    },
    get ForOnStatement() {
      return ForOnStatement;
    },
    get ForStatement() {
      return ForStatement;
    },
    get FormalParameter() {
      return FormalParameter;
    },
    get FormalParameterList() {
      return FormalParameterList;
    },
    get ForwardDefaultExport() {
      return ForwardDefaultExport;
    },
    get FunctionBody() {
      return FunctionBody;
    },
    get FunctionDeclaration() {
      return FunctionDeclaration;
    },
    get FunctionExpression() {
      return FunctionExpression;
    },
    get FunctionType() {
      return FunctionType;
    },
    get GeneratorComprehension() {
      return GeneratorComprehension;
    },
    get GetAccessor() {
      return GetAccessor;
    },
    get IdentifierExpression() {
      return IdentifierExpression;
    },
    get IfStatement() {
      return IfStatement;
    },
    get ImportedBinding() {
      return ImportedBinding;
    },
    get ImportClausePair() {
      return ImportClausePair;
    },
    get ImportDeclaration() {
      return ImportDeclaration;
    },
    get ImportSpecifier() {
      return ImportSpecifier;
    },
    get ImportSpecifierSet() {
      return ImportSpecifierSet;
    },
    get IndexSignature() {
      return IndexSignature;
    },
    get InterfaceDeclaration() {
      return InterfaceDeclaration;
    },
    get LabelledStatement() {
      return LabelledStatement;
    },
    get LiteralExpression() {
      return LiteralExpression;
    },
    get LiteralPropertyName() {
      return LiteralPropertyName;
    },
    get MemberExpression() {
      return MemberExpression;
    },
    get MemberLookupExpression() {
      return MemberLookupExpression;
    },
    get MethodSignature() {
      return MethodSignature;
    },
    get Module() {
      return Module;
    },
    get ModuleSpecifier() {
      return ModuleSpecifier;
    },
    get NameSpaceExport() {
      return NameSpaceExport;
    },
    get NameSpaceImport() {
      return NameSpaceImport;
    },
    get NamedExport() {
      return NamedExport;
    },
    get NewExpression() {
      return NewExpression;
    },
    get ObjectLiteralExpression() {
      return ObjectLiteralExpression;
    },
    get ObjectPattern() {
      return ObjectPattern;
    },
    get ObjectPatternField() {
      return ObjectPatternField;
    },
    get ObjectType() {
      return ObjectType;
    },
    get ParenExpression() {
      return ParenExpression;
    },
    get PostfixExpression() {
      return PostfixExpression;
    },
    get PredefinedType() {
      return PredefinedType;
    },
    get Script() {
      return Script;
    },
    get PropertyMethodAssignment() {
      return PropertyMethodAssignment;
    },
    get PropertyNameAssignment() {
      return PropertyNameAssignment;
    },
    get PropertyNameShorthand() {
      return PropertyNameShorthand;
    },
    get PropertyVariableDeclaration() {
      return PropertyVariableDeclaration;
    },
    get PropertySignature() {
      return PropertySignature;
    },
    get RestParameter() {
      return RestParameter;
    },
    get ReturnStatement() {
      return ReturnStatement;
    },
    get SetAccessor() {
      return SetAccessor;
    },
    get SpreadExpression() {
      return SpreadExpression;
    },
    get SpreadPatternElement() {
      return SpreadPatternElement;
    },
    get SuperExpression() {
      return SuperExpression;
    },
    get SwitchStatement() {
      return SwitchStatement;
    },
    get SyntaxErrorTree() {
      return SyntaxErrorTree;
    },
    get TemplateLiteralExpression() {
      return TemplateLiteralExpression;
    },
    get TemplateLiteralPortion() {
      return TemplateLiteralPortion;
    },
    get TemplateSubstitution() {
      return TemplateSubstitution;
    },
    get ThisExpression() {
      return ThisExpression;
    },
    get ThrowStatement() {
      return ThrowStatement;
    },
    get TryStatement() {
      return TryStatement;
    },
    get TypeArguments() {
      return TypeArguments;
    },
    get TypeName() {
      return TypeName;
    },
    get TypeParameter() {
      return TypeParameter;
    },
    get TypeParameters() {
      return TypeParameters;
    },
    get TypeReference() {
      return TypeReference;
    },
    get UnaryExpression() {
      return UnaryExpression;
    },
    get UnionType() {
      return UnionType;
    },
    get VariableDeclaration() {
      return VariableDeclaration;
    },
    get VariableDeclarationList() {
      return VariableDeclarationList;
    },
    get VariableStatement() {
      return VariableStatement;
    },
    get WhileStatement() {
      return WhileStatement;
    },
    get WithStatement() {
      return WithStatement;
    },
    get YieldExpression() {
      return YieldExpression;
    }
  };
});
System.registerModule("traceur@0.0.91/src/util/assert.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/assert.js";
  function assert(b) {
    if (!b && $traceurRuntime.options.debug)
      throw Error('Assertion failed');
  }
  return {get assert() {
      return assert;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/IdentifierToken.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/IdentifierToken.js";
  var Token = System.get("traceur@0.0.91/src/syntax/Token.js").Token;
  var IDENTIFIER = System.get("traceur@0.0.91/src/syntax/TokenType.js").IDENTIFIER;
  var IdentifierToken = function($__super) {
    function IdentifierToken(location, value) {
      $traceurRuntime.superConstructor(IdentifierToken).call(this, IDENTIFIER, location);
      this.value = value;
    }
    return ($traceurRuntime.createClass)(IdentifierToken, {toString: function() {
        return this.value;
      }}, {}, $__super);
  }(Token);
  return {get IdentifierToken() {
      return IdentifierToken;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/LiteralToken.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/LiteralToken.js";
  var Token = System.get("traceur@0.0.91/src/syntax/Token.js").Token;
  var $__1 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      NULL = $__1.NULL,
      NUMBER = $__1.NUMBER,
      STRING = $__1.STRING;
  var StringParser = function() {
    var $__3;
    function StringParser(value) {
      this.value = value;
      this.index = 0;
    }
    return ($traceurRuntime.createClass)(StringParser, ($__3 = {}, Object.defineProperty($__3, Symbol.iterator, {
      value: function() {
        return this;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "next", {
      value: function() {
        if (++this.index >= this.value.length - 1)
          return {
            value: undefined,
            done: true
          };
        return {
          value: this.value[this.index],
          done: false
        };
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "parse", {
      value: function() {
        if (this.value.indexOf('\\') === -1)
          return this.value.slice(1, -1);
        var result = '';
        var $__7 = true;
        var $__8 = false;
        var $__9 = undefined;
        try {
          for (var $__5 = void 0,
              $__4 = (this)[$traceurRuntime.toProperty(Symbol.iterator)](); !($__7 = ($__5 = $__4.next()).done); $__7 = true) {
            var ch = $__5.value;
            {
              result += ch === '\\' ? this.parseEscapeSequence() : ch;
            }
          }
        } catch ($__10) {
          $__8 = true;
          $__9 = $__10;
        } finally {
          try {
            if (!$__7 && $__4.return != null) {
              $__4.return();
            }
          } finally {
            if ($__8) {
              throw $__9;
            }
          }
        }
        return result;
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), Object.defineProperty($__3, "parseEscapeSequence", {
      value: function() {
        var ch = this.next().value;
        switch (ch) {
          case '\n':
          case '\r':
          case '\u2028':
          case '\u2029':
            return '';
          case '0':
            return '\0';
          case 'b':
            return '\b';
          case 'f':
            return '\f';
          case 'n':
            return '\n';
          case 'r':
            return '\r';
          case 't':
            return '\t';
          case 'v':
            return '\v';
          case 'x':
            return String.fromCharCode(parseInt(this.next().value + this.next().value, 16));
          case 'u':
            {
              var nextValue = this.next().value;
              if (nextValue === '{') {
                var hexDigits = '';
                while ((nextValue = this.next().value) !== '}') {
                  hexDigits += nextValue;
                }
                var codePoint = parseInt(hexDigits, 16);
                if (codePoint <= 0xFFFF) {
                  return String.fromCharCode(codePoint);
                }
                var high = Math.floor((codePoint - 0x10000) / 0x400) + 0xD800;
                var low = (codePoint - 0x10000) % 0x400 + 0xDC00;
                return String.fromCharCode(high, low);
              }
              return String.fromCharCode(parseInt(nextValue + this.next().value + this.next().value + this.next().value, 16));
            }
          default:
            if (Number(ch) < 8)
              throw new Error('Octal literals are not supported');
            return ch;
        }
      },
      configurable: true,
      enumerable: true,
      writable: true
    }), $__3), {});
  }();
  var LiteralToken = function($__super) {
    function LiteralToken(type, value, location) {
      $traceurRuntime.superConstructor(LiteralToken).call(this, type, location);
      this.value = value;
    }
    return ($traceurRuntime.createClass)(LiteralToken, {
      toString: function() {
        return this.value;
      },
      get processedValue() {
        switch (this.type) {
          case NULL:
            return null;
          case NUMBER:
            {
              var value = this.value;
              if (value.charCodeAt(0) === 48) {
                switch (value.charCodeAt(1)) {
                  case 66:
                  case 98:
                    return parseInt(this.value.slice(2), 2);
                  case 79:
                  case 111:
                    return parseInt(this.value.slice(2), 8);
                }
              }
              return Number(this.value);
            }
          case STRING:
            {
              var parser = new StringParser(this.value);
              return parser.parse();
            }
          default:
            throw new Error('Not implemented');
        }
      }
    }, {}, $__super);
  }(Token);
  return {get LiteralToken() {
      return LiteralToken;
    }};
});
System.registerModule("traceur@0.0.91/src/codegeneration/ParseTreeFactory.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/codegeneration/ParseTreeFactory.js";
  var IdentifierToken = System.get("traceur@0.0.91/src/syntax/IdentifierToken.js").IdentifierToken;
  var LiteralToken = System.get("traceur@0.0.91/src/syntax/LiteralToken.js").LiteralToken;
  var $__2 = System.get("traceur@0.0.91/src/syntax/trees/ParseTree.js"),
      ParseTree = $__2.ParseTree,
      ParseTreeType = $__2.ParseTreeType;
  var $__3 = System.get("traceur@0.0.91/src/syntax/PredefinedName.js"),
      CALL = $__3.CALL,
      CREATE = $__3.CREATE,
      DEFINE_PROPERTY = $__3.DEFINE_PROPERTY,
      FREEZE = $__3.FREEZE,
      OBJECT = $__3.OBJECT,
      UNDEFINED = $__3.UNDEFINED;
  var Token = System.get("traceur@0.0.91/src/syntax/Token.js").Token;
  var $__5 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      EQUAL = $__5.EQUAL,
      FALSE = $__5.FALSE,
      NULL = $__5.NULL,
      NUMBER = $__5.NUMBER,
      STRING = $__5.STRING,
      TRUE = $__5.TRUE,
      VOID = $__5.VOID;
  var assert = System.get("traceur@0.0.91/src/util/assert.js").assert;
  var $__7 = System.get("traceur@0.0.91/src/syntax/trees/ParseTrees.js"),
      ArgumentList = $__7.ArgumentList,
      ArrayLiteralExpression = $__7.ArrayLiteralExpression,
      BinaryExpression = $__7.BinaryExpression,
      BindingIdentifier = $__7.BindingIdentifier,
      Block = $__7.Block,
      BreakStatement = $__7.BreakStatement,
      CallExpression = $__7.CallExpression,
      CaseClause = $__7.CaseClause,
      Catch = $__7.Catch,
      ClassDeclaration = $__7.ClassDeclaration,
      CommaExpression = $__7.CommaExpression,
      ConditionalExpression = $__7.ConditionalExpression,
      ContinueStatement = $__7.ContinueStatement,
      DefaultClause = $__7.DefaultClause,
      DoWhileStatement = $__7.DoWhileStatement,
      EmptyStatement = $__7.EmptyStatement,
      ExpressionStatement = $__7.ExpressionStatement,
      Finally = $__7.Finally,
      ForInStatement = $__7.ForInStatement,
      ForOfStatement = $__7.ForOfStatement,
      ForStatement = $__7.ForStatement,
      FormalParameterList = $__7.FormalParameterList,
      FunctionBody = $__7.FunctionBody,
      FunctionExpression = $__7.FunctionExpression,
      IdentifierExpression = $__7.IdentifierExpression,
      IfStatement = $__7.IfStatement,
      ImportedBinding = $__7.ImportedBinding,
      LiteralExpression = $__7.LiteralExpression,
      LiteralPropertyName = $__7.LiteralPropertyName,
      MemberExpression = $__7.MemberExpression,
      MemberLookupExpression = $__7.MemberLookupExpression,
      NewExpression = $__7.NewExpression,
      ObjectLiteralExpression = $__7.ObjectLiteralExpression,
      ParenExpression = $__7.ParenExpression,
      PostfixExpression = $__7.PostfixExpression,
      Script = $__7.Script,
      PropertyNameAssignment = $__7.PropertyNameAssignment,
      RestParameter = $__7.RestParameter,
      ReturnStatement = $__7.ReturnStatement,
      SpreadExpression = $__7.SpreadExpression,
      SwitchStatement = $__7.SwitchStatement,
      ThisExpression = $__7.ThisExpression,
      ThrowStatement = $__7.ThrowStatement,
      TryStatement = $__7.TryStatement,
      UnaryExpression = $__7.UnaryExpression,
      VariableDeclaration = $__7.VariableDeclaration,
      VariableDeclarationList = $__7.VariableDeclarationList,
      VariableStatement = $__7.VariableStatement,
      WhileStatement = $__7.WhileStatement,
      WithStatement = $__7.WithStatement;
  var slice = Array.prototype.slice.call.bind(Array.prototype.slice);
  var map = Array.prototype.map.call.bind(Array.prototype.map);
  function createOperatorToken(operator) {
    return new Token(operator, null);
  }
  function createIdentifierToken(identifier) {
    return new IdentifierToken(null, identifier);
  }
  function createStringLiteralToken(value) {
    return new LiteralToken(STRING, JSON.stringify(value), null);
  }
  function createBooleanLiteralToken(value) {
    return new Token(value ? TRUE : FALSE, null);
  }
  function createNullLiteralToken() {
    return new LiteralToken(NULL, 'null', null);
  }
  function createNumberLiteralToken(value) {
    return new LiteralToken(NUMBER, String(value), null);
  }
  function createEmptyParameterList() {
    return new FormalParameterList(null, []);
  }
  function createArgumentList(list) {
    return new ArgumentList(null, list);
  }
  function createEmptyArgumentList() {
    return createArgumentList([]);
  }
  function createArrayLiteralExpression(list) {
    return new ArrayLiteralExpression(null, list);
  }
  function createEmptyArrayLiteralExpression() {
    return createArrayLiteralExpression([]);
  }
  function createAssignmentExpression(lhs, rhs) {
    return new BinaryExpression(null, lhs, createOperatorToken(EQUAL), rhs);
  }
  function createBinaryExpression(left, operator, right) {
    return new BinaryExpression(null, left, operator, right);
  }
  function createBindingIdentifier(identifier) {
    if (typeof identifier === 'string')
      identifier = createIdentifierToken(identifier);
    else if (identifier.type === ParseTreeType.BINDING_IDENTIFIER)
      return identifier;
    else if (identifier.type === ParseTreeType.IDENTIFIER_EXPRESSION)
      return new BindingIdentifier(identifier.location, identifier.identifierToken);
    return new BindingIdentifier(null, identifier);
  }
  function createImportedBinding(name) {
    var bindingIdentifier = createBindingIdentifier(name);
    return new ImportedBinding(bindingIdentifier.location, bindingIdentifier);
  }
  function createEmptyStatement() {
    return new EmptyStatement(null);
  }
  function createEmptyBlock() {
    return createBlock([]);
  }
  function createBlock(statements) {
    return new Block(null, statements);
  }
  function createFunctionBody(statements) {
    return new FunctionBody(null, statements);
  }
  function createScopedExpression(body, scope) {
    assert(body.type === 'FUNCTION_BODY');
    return createCallCall(createParenExpression(createFunctionExpression(createEmptyParameterList(), body)), scope);
  }
  function createImmediatelyInvokedFunctionExpression(body) {
    assert(body.type === 'FUNCTION_BODY');
    return createCallExpression(createParenExpression(createFunctionExpression(createEmptyParameterList(), body)));
  }
  function createCallExpression(operand) {
    var args = arguments[1] !== (void 0) ? arguments[1] : createEmptyArgumentList();
    return new CallExpression(null, operand, args);
  }
  function createBreakStatement() {
    var name = arguments[0] !== (void 0) ? arguments[0] : null;
    return new BreakStatement(null, name);
  }
  function createCallCall(func, thisExpression) {
    return createCallExpression(createMemberExpression(func, CALL), createArgumentList([thisExpression]));
  }
  function createCaseClause(expression, statements) {
    return new CaseClause(null, expression, statements);
  }
  function createCatch(identifier, catchBody) {
    identifier = createBindingIdentifier(identifier);
    return new Catch(null, identifier, catchBody);
  }
  function createClassDeclaration(name, superClass, elements) {
    return new ClassDeclaration(null, name, superClass, elements, []);
  }
  function createCommaExpression(expressions) {
    return new CommaExpression(null, expressions);
  }
  function createConditionalExpression(condition, left, right) {
    return new ConditionalExpression(null, condition, left, right);
  }
  function createContinueStatement() {
    var name = arguments[0] !== (void 0) ? arguments[0] : null;
    return new ContinueStatement(null, name);
  }
  function createDefaultClause(statements) {
    return new DefaultClause(null, statements);
  }
  function createDoWhileStatement(body, condition) {
    return new DoWhileStatement(null, body, condition);
  }
  function createAssignmentStatement(lhs, rhs) {
    return createExpressionStatement(createAssignmentExpression(lhs, rhs));
  }
  function createCallStatement(operand) {
    var args = arguments[1];
    return createExpressionStatement(createCallExpression(operand, args));
  }
  function createExpressionStatement(expression) {
    return new ExpressionStatement(null, expression);
  }
  function createFinally(block) {
    return new Finally(null, block);
  }
  function createForOfStatement(initializer, collection, body) {
    return new ForOfStatement(null, initializer, collection, body);
  }
  function createForInStatement(initializer, collection, body) {
    return new ForInStatement(null, initializer, collection, body);
  }
  function createForStatement(variables, condition, increment, body) {
    return new ForStatement(null, variables, condition, increment, body);
  }
  function createFunctionExpression(parameterList, body) {
    assert(body.type === 'FUNCTION_BODY');
    return new FunctionExpression(null, null, false, parameterList, null, [], body);
  }
  function createIdentifierExpression(identifier) {
    if (typeof identifier === 'string')
      identifier = createIdentifierToken(identifier);
    else if (identifier instanceof BindingIdentifier)
      identifier = identifier.identifierToken;
    return new IdentifierExpression(null, identifier);
  }
  function createUndefinedExpression() {
    return createIdentifierExpression(UNDEFINED);
  }
  function createIfStatement(condition, ifClause) {
    var elseClause = arguments[2] !== (void 0) ? arguments[2] : null;
    return new IfStatement(null, condition, ifClause, elseClause);
  }
  function createStringLiteral(value) {
    return new LiteralExpression(null, createStringLiteralToken(value));
  }
  function createBooleanLiteral(value) {
    return new LiteralExpression(null, createBooleanLiteralToken(value));
  }
  function createTrueLiteral() {
    return createBooleanLiteral(true);
  }
  function createFalseLiteral() {
    return createBooleanLiteral(false);
  }
  function createNullLiteral() {
    return new LiteralExpression(null, createNullLiteralToken());
  }
  function createNumberLiteral(value) {
    return new LiteralExpression(null, createNumberLiteralToken(value));
  }
  function createMemberExpression(operand, memberName) {
    for (var memberNames = [],
        $__8 = 2; $__8 < arguments.length; $__8++)
      memberNames[$__8 - 2] = arguments[$__8];
    if (typeof operand === 'string' || operand instanceof IdentifierToken)
      operand = createIdentifierExpression(operand);
    if (typeof memberName === 'string')
      memberName = createIdentifierToken(memberName);
    if (memberName instanceof LiteralToken)
      memberName = new LiteralExpression(null, memberName);
    var tree = memberName instanceof LiteralExpression ? new MemberLookupExpression(null, operand, memberName) : new MemberExpression(null, operand, memberName);
    for (var i = 0; i < memberNames.length; i++) {
      tree = createMemberExpression(tree, memberNames[i]);
    }
    return tree;
  }
  function createMemberLookupExpression(operand, memberExpression) {
    return new MemberLookupExpression(null, operand, memberExpression);
  }
  function createThisExpression() {
    return new ThisExpression(null);
  }
  function createNewExpression(operand, args) {
    return new NewExpression(null, operand, args);
  }
  function createObjectFreeze(value) {
    return createCallExpression(createMemberExpression(OBJECT, FREEZE), createArgumentList([value]));
  }
  function createObjectCreate(protoExpression) {
    var descriptors = arguments[1];
    var argumentList = [protoExpression];
    if (descriptors)
      argumentList.push(descriptors);
    return createCallExpression(createMemberExpression(OBJECT, CREATE), createArgumentList(argumentList));
  }
  function createObjectLiteral(descr) {
    var propertyNameAndValues = Object.keys(descr).map(function(name) {
      var value = descr[name];
      if (!(value instanceof ParseTree))
        value = createBooleanLiteral(!!value);
      return createPropertyNameAssignment(name, value);
    });
    return createObjectLiteralExpression(propertyNameAndValues);
  }
  function createDefineProperty(tree, name, descr) {
    if (typeof name === 'string')
      name = createStringLiteral(name);
    return createCallExpression(createMemberExpression(OBJECT, DEFINE_PROPERTY), createArgumentList([tree, name, createObjectLiteral(descr)]));
  }
  function createObjectLiteralExpression(propertyNameAndValues) {
    return new ObjectLiteralExpression(null, propertyNameAndValues);
  }
  function createParenExpression(expression) {
    return new ParenExpression(null, expression);
  }
  function createPostfixExpression(operand, operator) {
    return new PostfixExpression(null, operand, operator);
  }
  function createScript(scriptItemList) {
    return new Script(null, scriptItemList, null);
  }
  function createPropertyNameAssignment(identifier, value) {
    if (typeof identifier === 'string')
      identifier = createLiteralPropertyName(identifier);
    return new PropertyNameAssignment(null, identifier, value);
  }
  function createLiteralPropertyName(name) {
    return new LiteralPropertyName(null, createIdentifierToken(name));
  }
  function createRestParameter(identifier) {
    return new RestParameter(null, createBindingIdentifier(identifier), null);
  }
  function createReturnStatement(expression) {
    return new ReturnStatement(null, expression);
  }
  function createSpreadExpression(expression) {
    return new SpreadExpression(null, expression);
  }
  function createSwitchStatement(expression, caseClauses) {
    return new SwitchStatement(null, expression, caseClauses);
  }
  function createThrowStatement(value) {
    return new ThrowStatement(null, value);
  }
  function createTryStatement(body, catchBlock) {
    var finallyBlock = arguments[2] !== (void 0) ? arguments[2] : null;
    return new TryStatement(null, body, catchBlock, finallyBlock);
  }
  function createUnaryExpression(operator, operand) {
    return new UnaryExpression(null, operator, operand);
  }
  function createUseStrictDirective() {
    return createExpressionStatement(createStringLiteral('use strict'));
  }
  function createVariableDeclarationList(binding, identifierOrDeclarations) {
    var initializer = arguments[2];
    if (identifierOrDeclarations instanceof Array) {
      var declarations = identifierOrDeclarations;
      return new VariableDeclarationList(null, binding, declarations);
    }
    var identifier = identifierOrDeclarations;
    return createVariableDeclarationList(binding, [createVariableDeclaration(identifier, initializer)]);
  }
  function createVariableDeclaration(identifier, initializer) {
    if (!(identifier instanceof ParseTree) || identifier.type !== ParseTreeType.BINDING_IDENTIFIER && identifier.type !== ParseTreeType.OBJECT_PATTERN && identifier.type !== ParseTreeType.ARRAY_PATTERN) {
      identifier = createBindingIdentifier(identifier);
    }
    return new VariableDeclaration(null, identifier, null, initializer);
  }
  function createVariableStatement(listOrBinding) {
    var identifier = arguments[1];
    var initializer = arguments[2];
    if (listOrBinding instanceof VariableDeclarationList)
      return new VariableStatement(null, listOrBinding);
    var binding = listOrBinding;
    var list = createVariableDeclarationList(binding, identifier, initializer);
    return createVariableStatement(list);
  }
  function createVoid0() {
    return createParenExpression(createUnaryExpression(createOperatorToken(VOID), createNumberLiteral(0)));
  }
  function createWhileStatement(condition, body) {
    return new WhileStatement(null, condition, body);
  }
  function createWithStatement(expression, body) {
    return new WithStatement(null, expression, body);
  }
  function createAssignStateStatement(state) {
    return createAssignmentStatement(createMemberExpression('$ctx', 'state'), createNumberLiteral(state));
  }
  return {
    get createOperatorToken() {
      return createOperatorToken;
    },
    get createIdentifierToken() {
      return createIdentifierToken;
    },
    get createStringLiteralToken() {
      return createStringLiteralToken;
    },
    get createBooleanLiteralToken() {
      return createBooleanLiteralToken;
    },
    get createNullLiteralToken() {
      return createNullLiteralToken;
    },
    get createNumberLiteralToken() {
      return createNumberLiteralToken;
    },
    get createEmptyParameterList() {
      return createEmptyParameterList;
    },
    get createArgumentList() {
      return createArgumentList;
    },
    get createEmptyArgumentList() {
      return createEmptyArgumentList;
    },
    get createArrayLiteralExpression() {
      return createArrayLiteralExpression;
    },
    get createEmptyArrayLiteralExpression() {
      return createEmptyArrayLiteralExpression;
    },
    get createAssignmentExpression() {
      return createAssignmentExpression;
    },
    get createBinaryExpression() {
      return createBinaryExpression;
    },
    get createBindingIdentifier() {
      return createBindingIdentifier;
    },
    get createImportedBinding() {
      return createImportedBinding;
    },
    get createEmptyStatement() {
      return createEmptyStatement;
    },
    get createEmptyBlock() {
      return createEmptyBlock;
    },
    get createBlock() {
      return createBlock;
    },
    get createFunctionBody() {
      return createFunctionBody;
    },
    get createScopedExpression() {
      return createScopedExpression;
    },
    get createImmediatelyInvokedFunctionExpression() {
      return createImmediatelyInvokedFunctionExpression;
    },
    get createCallExpression() {
      return createCallExpression;
    },
    get createBreakStatement() {
      return createBreakStatement;
    },
    get createCaseClause() {
      return createCaseClause;
    },
    get createCatch() {
      return createCatch;
    },
    get createClassDeclaration() {
      return createClassDeclaration;
    },
    get createCommaExpression() {
      return createCommaExpression;
    },
    get createConditionalExpression() {
      return createConditionalExpression;
    },
    get createContinueStatement() {
      return createContinueStatement;
    },
    get createDefaultClause() {
      return createDefaultClause;
    },
    get createDoWhileStatement() {
      return createDoWhileStatement;
    },
    get createAssignmentStatement() {
      return createAssignmentStatement;
    },
    get createCallStatement() {
      return createCallStatement;
    },
    get createExpressionStatement() {
      return createExpressionStatement;
    },
    get createFinally() {
      return createFinally;
    },
    get createForOfStatement() {
      return createForOfStatement;
    },
    get createForInStatement() {
      return createForInStatement;
    },
    get createForStatement() {
      return createForStatement;
    },
    get createFunctionExpression() {
      return createFunctionExpression;
    },
    get createIdentifierExpression() {
      return createIdentifierExpression;
    },
    get createUndefinedExpression() {
      return createUndefinedExpression;
    },
    get createIfStatement() {
      return createIfStatement;
    },
    get createStringLiteral() {
      return createStringLiteral;
    },
    get createBooleanLiteral() {
      return createBooleanLiteral;
    },
    get createTrueLiteral() {
      return createTrueLiteral;
    },
    get createFalseLiteral() {
      return createFalseLiteral;
    },
    get createNullLiteral() {
      return createNullLiteral;
    },
    get createNumberLiteral() {
      return createNumberLiteral;
    },
    get createMemberExpression() {
      return createMemberExpression;
    },
    get createMemberLookupExpression() {
      return createMemberLookupExpression;
    },
    get createThisExpression() {
      return createThisExpression;
    },
    get createNewExpression() {
      return createNewExpression;
    },
    get createObjectFreeze() {
      return createObjectFreeze;
    },
    get createObjectCreate() {
      return createObjectCreate;
    },
    get createObjectLiteral() {
      return createObjectLiteral;
    },
    get createDefineProperty() {
      return createDefineProperty;
    },
    get createObjectLiteralExpression() {
      return createObjectLiteralExpression;
    },
    get createParenExpression() {
      return createParenExpression;
    },
    get createPostfixExpression() {
      return createPostfixExpression;
    },
    get createScript() {
      return createScript;
    },
    get createPropertyNameAssignment() {
      return createPropertyNameAssignment;
    },
    get createLiteralPropertyName() {
      return createLiteralPropertyName;
    },
    get createRestParameter() {
      return createRestParameter;
    },
    get createReturnStatement() {
      return createReturnStatement;
    },
    get createSwitchStatement() {
      return createSwitchStatement;
    },
    get createThrowStatement() {
      return createThrowStatement;
    },
    get createTryStatement() {
      return createTryStatement;
    },
    get createUnaryExpression() {
      return createUnaryExpression;
    },
    get createUseStrictDirective() {
      return createUseStrictDirective;
    },
    get createVariableDeclarationList() {
      return createVariableDeclarationList;
    },
    get createVariableDeclaration() {
      return createVariableDeclaration;
    },
    get createVariableStatement() {
      return createVariableStatement;
    },
    get createVoid0() {
      return createVoid0;
    },
    get createWhileStatement() {
      return createWhileStatement;
    },
    get createWithStatement() {
      return createWithStatement;
    },
    get createAssignStateStatement() {
      return createAssignStateStatement;
    }
  };
});
System.registerModule("traceur@0.0.91/src/codegeneration/FindVisitor.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/codegeneration/FindVisitor.js";
  var ParseTreeVisitor = System.get("traceur@0.0.91/src/syntax/ParseTreeVisitor.js").ParseTreeVisitor;
  var FindVisitor = function($__super) {
    function FindVisitor() {
      var keepOnGoing = arguments[0];
      $traceurRuntime.superConstructor(FindVisitor).call(this);
      this.found_ = false;
      this.shouldContinue_ = true;
      this.keepOnGoing_ = keepOnGoing;
    }
    return ($traceurRuntime.createClass)(FindVisitor, {
      get found() {
        return this.found_;
      },
      set found(v) {
        if (v) {
          this.found_ = true;
          if (!this.keepOnGoing_)
            this.shouldContinue_ = false;
        }
      },
      visitAny: function(tree) {
        this.shouldContinue_ && tree && tree.visit(this);
      },
      visitList: function(list) {
        if (list) {
          for (var i = 0; this.shouldContinue_ && i < list.length; i++) {
            this.visitAny(list[i]);
          }
        }
      }
    }, {}, $__super);
  }(ParseTreeVisitor);
  return {get FindVisitor() {
      return FindVisitor;
    }};
});
System.registerModule("traceur@0.0.91/src/semantics/ConstructorValidator.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/semantics/ConstructorValidator.js";
  var SUPER_EXPRESSION = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js").SUPER_EXPRESSION;
  var FindVisitor = System.get("traceur@0.0.91/src/codegeneration/FindVisitor.js").FindVisitor;
  var ConstructorValidator = function($__super) {
    function ConstructorValidator(reporter) {
      $traceurRuntime.superConstructor(ConstructorValidator).call(this);
      this.reporter_ = reporter;
      this.hasError = false;
    }
    return ($traceurRuntime.createClass)(ConstructorValidator, {
      visitClassExpression: function(tree) {
        this.visitAny(tree.superClass);
      },
      visitClassDeclaration: function(tree) {
        this.visitAny(tree.superClass);
      },
      visitThisExpression: function(tree) {
        this.reportError_(tree.location, 'this');
      },
      visitCallExpression: function(tree) {
        if (tree.operand.type === SUPER_EXPRESSION) {
          this.visitAny(tree.args);
          this.found = true;
          return;
        }
        $traceurRuntime.superGet(this, ConstructorValidator.prototype, "visitCallExpression").call(this, tree);
      },
      visitSuperExpression: function(tree) {
        this.reportError_(tree.location, 'super property');
      },
      reportError_: function(location, kind) {
        this.reporter_.reportError(location, ("'" + kind + "' is not allowed before super()"));
        this.hasError = true;
        this.found = true;
      }
    }, {}, $__super);
  }(FindVisitor);
  function validateConstructor(tree, reporter) {
    var visitor = new ConstructorValidator(reporter);
    visitor.visitAny(tree);
    if (visitor.hasError)
      return false;
    if (visitor.found)
      return true;
    reporter.reportError(tree.location, 'Derived constructor must call super()');
    return false;
  }
  return {get validateConstructor() {
      return validateConstructor;
    }};
});
System.registerModule("traceur@0.0.91/src/staticsemantics/isValidSimpleAssignmentTarget.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/staticsemantics/isValidSimpleAssignmentTarget.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      IDENTIFIER_EXPRESSION = $__0.IDENTIFIER_EXPRESSION,
      MEMBER_EXPRESSION = $__0.MEMBER_EXPRESSION,
      MEMBER_LOOKUP_EXPRESSION = $__0.MEMBER_LOOKUP_EXPRESSION,
      PAREN_EXPRESSION = $__0.PAREN_EXPRESSION;
  function isValidSimpleAssignmentTarget(tree, isStrict) {
    switch (tree.type) {
      case IDENTIFIER_EXPRESSION:
        {
          if (!isStrict)
            return true;
          var value = tree.identifierToken.value;
          return value !== 'arguments' && value !== 'eval';
        }
      case PAREN_EXPRESSION:
        return isValidSimpleAssignmentTarget(tree.expression, isStrict);
      case MEMBER_EXPRESSION:
      case MEMBER_LOOKUP_EXPRESSION:
        return true;
      default:
        return false;
    }
  }
  var $__default = isValidSimpleAssignmentTarget;
  return {get default() {
      return $__default;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/Keywords.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/Keywords.js";
  var keywords = ['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'enum', 'extends', 'null', 'true', 'false'];
  var strictKeywords = ['implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield'];
  var keywordsByName = Object.create(null);
  var NORMAL_KEYWORD = 1;
  var STRICT_KEYWORD = 2;
  keywords.forEach(function(value) {
    keywordsByName[value] = NORMAL_KEYWORD;
  });
  strictKeywords.forEach(function(value) {
    keywordsByName[value] = STRICT_KEYWORD;
  });
  function getKeywordType(value) {
    return keywordsByName[value];
  }
  function isStrictKeyword(value) {
    return getKeywordType(value) === STRICT_KEYWORD;
  }
  return {
    get NORMAL_KEYWORD() {
      return NORMAL_KEYWORD;
    },
    get STRICT_KEYWORD() {
      return STRICT_KEYWORD;
    },
    get getKeywordType() {
      return getKeywordType;
    },
    get isStrictKeyword() {
      return isStrictKeyword;
    }
  };
});
System.registerModule("traceur@0.0.91/src/staticsemantics/validateParameters.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/staticsemantics/validateParameters.js";
  var ParseTreeVisitor = System.get("traceur@0.0.91/src/syntax/ParseTreeVisitor.js").ParseTreeVisitor;
  var StringSet = System.get("traceur@0.0.91/src/util/StringSet.js").StringSet;
  var isStrictKeyword = System.get("traceur@0.0.91/src/syntax/Keywords.js").isStrictKeyword;
  var ParameterValidationVisitor = function($__super) {
    function ParameterValidationVisitor(isStrict, reporter) {
      $traceurRuntime.superConstructor(ParameterValidationVisitor).call(this);
      this.reporter_ = reporter;
      this.names_ = new StringSet();
      this.errors_ = [];
      this.reportStrictKeywords_ = isStrict;
      this.reportDuplicates_ = isStrict;
    }
    return ($traceurRuntime.createClass)(ParameterValidationVisitor, {
      visitBindingIdentifier: function(tree) {
        var name = tree.identifierToken.toString();
        if (this.reportStrictKeywords_ && (isStrictKeyword(name) || name === 'eval' || name === 'arguments')) {
          this.reporter_.reportError(tree.location, (name + " is a reserved identifier"));
        }
        if (this.names_.has(name)) {
          this.maybeReportDuplicateError_(name, tree.location);
        }
        this.names_.add(name);
      },
      visitBindingElement: function(tree) {
        if (tree.initializer !== null) {
          this.reportEarlierErrors_();
        }
        this.visitAny(tree.binding);
      },
      visitRestParameter: function(tree) {
        this.reportEarlierErrors_();
        this.visitAny(tree.identifier);
      },
      visitFormalParameter: function(tree) {
        this.visitAny(tree.parameter);
      },
      visitArrayPattern: function(tree) {
        this.reportEarlierErrors_();
        $traceurRuntime.superGet(this, ParameterValidationVisitor.prototype, "visitArrayPattern").call(this, tree);
      },
      visitObjectPattern: function(tree) {
        this.reportEarlierErrors_();
        $traceurRuntime.superGet(this, ParameterValidationVisitor.prototype, "visitObjectPattern").call(this, tree);
      },
      reportDuplicateError_: function(name, location) {
        this.reporter_.reportError(location, ("Duplicate parameter name " + name));
      },
      maybeReportDuplicateError_: function(name, location) {
        if (this.reportDuplicates_) {
          this.reportDuplicateError_(name, location);
        } else {
          this.errors_.push(name, location);
        }
      },
      reportEarlierErrors_: function() {
        if (!this.reportDuplicates_) {
          this.reportDuplicates_ = true;
          for (var i = 0; i < this.errors_.length; i += 2) {
            var name = this.errors_[i];
            var location = this.errors_[i + 1];
            this.reportDuplicateError_(name, location);
          }
        }
      }
    }, {}, $__super);
  }(ParseTreeVisitor);
  var $__default = function(tree, isStrict, reporter) {
    new ParameterValidationVisitor(isStrict, reporter).visitAny(tree);
  };
  return {get default() {
      return $__default;
    }};
});
System.registerModule("traceur@0.0.91/src/util/SourceRange.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/SourceRange.js";
  var SourceRange = function() {
    function SourceRange(start, end) {
      this.start = start;
      this.end = end;
    }
    return ($traceurRuntime.createClass)(SourceRange, {toString: function() {
        var str = this.start.source.contents;
        return str.slice(this.start.offset, this.end.offset);
      }}, {});
  }();
  return {get SourceRange() {
      return SourceRange;
    }};
});
System.registerModule("traceur@0.0.91/src/util/ErrorReporter.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/ErrorReporter.js";
  var SourceRange = System.get("traceur@0.0.91/src/util/SourceRange.js").SourceRange;
  var ErrorReporter = function() {
    function ErrorReporter() {
      this.hadError_ = false;
    }
    return ($traceurRuntime.createClass)(ErrorReporter, {
      reportError: function(location, message) {
        this.hadError_ = true;
        this.reportMessageInternal(location, message);
      },
      reportMessageInternal: function(location, message) {
        if (location)
          message = (location.start + ": " + message);
        console.error(message);
      },
      hadError: function() {
        return this.hadError_;
      },
      clearError: function() {
        this.hadError_ = false;
      }
    }, {});
  }();
  function format(location, text) {
    var args = arguments[2];
    var i = 0;
    text = text.replace(/%./g, function(s) {
      switch (s) {
        case '%s':
          return args && args[i++];
        case '%%':
          return '%';
      }
      return s;
    });
    if (location)
      text = (location + ": " + text);
    return text;
  }
  ;
  ErrorReporter.format = format;
  return {
    get ErrorReporter() {
      return ErrorReporter;
    },
    get format() {
      return format;
    }
  };
});
System.registerModule("traceur@0.0.91/src/util/SyntaxErrorReporter.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/SyntaxErrorReporter.js";
  var $__0 = System.get("traceur@0.0.91/src/util/ErrorReporter.js"),
      ErrorReporter = $__0.ErrorReporter,
      format = $__0.format;
  var SyntaxErrorReporter = function($__super) {
    function SyntaxErrorReporter() {
      $traceurRuntime.superConstructor(SyntaxErrorReporter).apply(this, arguments);
    }
    return ($traceurRuntime.createClass)(SyntaxErrorReporter, {reportMessageInternal: function(location, message) {
        var s = format(location, message);
        throw new SyntaxError(s);
      }}, {}, $__super);
  }(ErrorReporter);
  return {get SyntaxErrorReporter() {
      return SyntaxErrorReporter;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/KeywordToken.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/KeywordToken.js";
  var STRICT_KEYWORD = System.get("traceur@0.0.91/src/syntax/Keywords.js").STRICT_KEYWORD;
  var Token = System.get("traceur@0.0.91/src/syntax/Token.js").Token;
  var KeywordToken = function($__super) {
    function KeywordToken(type, keywordType, location) {
      $traceurRuntime.superConstructor(KeywordToken).call(this, type, location);
      this.isStrictKeyword_ = keywordType === STRICT_KEYWORD;
    }
    return ($traceurRuntime.createClass)(KeywordToken, {
      isKeyword: function() {
        return true;
      },
      isStrictKeyword: function() {
        return this.isStrictKeyword_;
      }
    }, {}, $__super);
  }(Token);
  return {get KeywordToken() {
      return KeywordToken;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/unicode-tables.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/unicode-tables.js";
  var idStartTable = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 442, 443, 443, 444, 447, 448, 451, 452, 659, 660, 660, 661, 687, 688, 705, 710, 721, 736, 740, 748, 748, 750, 750, 880, 883, 884, 884, 886, 887, 890, 890, 891, 893, 895, 895, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1162, 1327, 1329, 1366, 1369, 1369, 1377, 1415, 1488, 1514, 1520, 1522, 1568, 1599, 1600, 1600, 1601, 1610, 1646, 1647, 1649, 1747, 1749, 1749, 1765, 1766, 1774, 1775, 1786, 1788, 1791, 1791, 1808, 1808, 1810, 1839, 1869, 1957, 1969, 1969, 1994, 2026, 2036, 2037, 2042, 2042, 2048, 2069, 2074, 2074, 2084, 2084, 2088, 2088, 2112, 2136, 2208, 2226, 2308, 2361, 2365, 2365, 2384, 2384, 2392, 2401, 2417, 2417, 2418, 2432, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2493, 2493, 2510, 2510, 2524, 2525, 2527, 2529, 2544, 2545, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2654, 2654, 2674, 2676, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2749, 2749, 2768, 2768, 2784, 2785, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2877, 2877, 2908, 2909, 2911, 2913, 2929, 2929, 2947, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3024, 3024, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3129, 3133, 3133, 3160, 3161, 3168, 3169, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3261, 3261, 3294, 3294, 3296, 3297, 3313, 3314, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3389, 3406, 3406, 3424, 3425, 3450, 3455, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3653, 3654, 3654, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3760, 3762, 3763, 3773, 3773, 3776, 3780, 3782, 3782, 3804, 3807, 3840, 3840, 3904, 3911, 3913, 3948, 3976, 3980, 4096, 4138, 4159, 4159, 4176, 4181, 4186, 4189, 4193, 4193, 4197, 4198, 4206, 4208, 4213, 4225, 4238, 4238, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4348, 4349, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5873, 5880, 5888, 5900, 5902, 5905, 5920, 5937, 5952, 5969, 5984, 5996, 5998, 6000, 6016, 6067, 6103, 6103, 6108, 6108, 6176, 6210, 6211, 6211, 6212, 6263, 6272, 6312, 6314, 6314, 6320, 6389, 6400, 6430, 6480, 6509, 6512, 6516, 6528, 6571, 6593, 6599, 6656, 6678, 6688, 6740, 6823, 6823, 6917, 6963, 6981, 6987, 7043, 7072, 7086, 7087, 7098, 7141, 7168, 7203, 7245, 7247, 7258, 7287, 7288, 7293, 7401, 7404, 7406, 7409, 7413, 7414, 7424, 7467, 7468, 7530, 7531, 7543, 7544, 7544, 7545, 7578, 7579, 7615, 7680, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8305, 8305, 8319, 8319, 8336, 8348, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8472, 8472, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8494, 8494, 8495, 8500, 8501, 8504, 8505, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8578, 8579, 8580, 8581, 8584, 11264, 11310, 11312, 11358, 11360, 11387, 11388, 11389, 11390, 11492, 11499, 11502, 11506, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11648, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 12293, 12293, 12294, 12294, 12295, 12295, 12321, 12329, 12337, 12341, 12344, 12346, 12347, 12347, 12348, 12348, 12353, 12438, 12443, 12444, 12445, 12446, 12447, 12447, 12449, 12538, 12540, 12542, 12543, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 40980, 40981, 40981, 40982, 42124, 42192, 42231, 42232, 42237, 42240, 42507, 42508, 42508, 42512, 42527, 42538, 42539, 42560, 42605, 42606, 42606, 42623, 42623, 42624, 42651, 42652, 42653, 42656, 42725, 42726, 42735, 42775, 42783, 42786, 42863, 42864, 42864, 42865, 42887, 42888, 42888, 42891, 42894, 42896, 42925, 42928, 42929, 42999, 42999, 43000, 43001, 43002, 43002, 43003, 43009, 43011, 43013, 43015, 43018, 43020, 43042, 43072, 43123, 43138, 43187, 43250, 43255, 43259, 43259, 43274, 43301, 43312, 43334, 43360, 43388, 43396, 43442, 43471, 43471, 43488, 43492, 43494, 43494, 43495, 43503, 43514, 43518, 43520, 43560, 43584, 43586, 43588, 43595, 43616, 43631, 43632, 43632, 43633, 43638, 43642, 43642, 43646, 43695, 43697, 43697, 43701, 43702, 43705, 43709, 43712, 43712, 43714, 43714, 43739, 43740, 43741, 43741, 43744, 43754, 43762, 43762, 43763, 43764, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43824, 43866, 43868, 43871, 43876, 43877, 43968, 44002, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64285, 64287, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65391, 65392, 65392, 65393, 65437, 65438, 65439, 65440, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500, 65536, 65547, 65549, 65574, 65576, 65594, 65596, 65597, 65599, 65613, 65616, 65629, 65664, 65786, 65856, 65908, 66176, 66204, 66208, 66256, 66304, 66335, 66352, 66368, 66369, 66369, 66370, 66377, 66378, 66378, 66384, 66421, 66432, 66461, 66464, 66499, 66504, 66511, 66513, 66517, 66560, 66639, 66640, 66717, 66816, 66855, 66864, 66915, 67072, 67382, 67392, 67413, 67424, 67431, 67584, 67589, 67592, 67592, 67594, 67637, 67639, 67640, 67644, 67644, 67647, 67669, 67680, 67702, 67712, 67742, 67840, 67861, 67872, 67897, 67968, 68023, 68030, 68031, 68096, 68096, 68112, 68115, 68117, 68119, 68121, 68147, 68192, 68220, 68224, 68252, 68288, 68295, 68297, 68324, 68352, 68405, 68416, 68437, 68448, 68466, 68480, 68497, 68608, 68680, 69635, 69687, 69763, 69807, 69840, 69864, 69891, 69926, 69968, 70002, 70006, 70006, 70019, 70066, 70081, 70084, 70106, 70106, 70144, 70161, 70163, 70187, 70320, 70366, 70405, 70412, 70415, 70416, 70419, 70440, 70442, 70448, 70450, 70451, 70453, 70457, 70461, 70461, 70493, 70497, 70784, 70831, 70852, 70853, 70855, 70855, 71040, 71086, 71168, 71215, 71236, 71236, 71296, 71338, 71840, 71903, 71935, 71935, 72384, 72440, 73728, 74648, 74752, 74862, 77824, 78894, 92160, 92728, 92736, 92766, 92880, 92909, 92928, 92975, 92992, 92995, 93027, 93047, 93053, 93071, 93952, 94020, 94032, 94032, 94099, 94111, 110592, 110593, 113664, 113770, 113776, 113788, 113792, 113800, 113808, 113817, 119808, 119892, 119894, 119964, 119966, 119967, 119970, 119970, 119973, 119974, 119977, 119980, 119982, 119993, 119995, 119995, 119997, 120003, 120005, 120069, 120071, 120074, 120077, 120084, 120086, 120092, 120094, 120121, 120123, 120126, 120128, 120132, 120134, 120134, 120138, 120144, 120146, 120485, 120488, 120512, 120514, 120538, 120540, 120570, 120572, 120596, 120598, 120628, 120630, 120654, 120656, 120686, 120688, 120712, 120714, 120744, 120746, 120770, 120772, 120779, 124928, 125124, 126464, 126467, 126469, 126495, 126497, 126498, 126500, 126500, 126503, 126503, 126505, 126514, 126516, 126519, 126521, 126521, 126523, 126523, 126530, 126530, 126535, 126535, 126537, 126537, 126539, 126539, 126541, 126543, 126545, 126546, 126548, 126548, 126551, 126551, 126553, 126553, 126555, 126555, 126557, 126557, 126559, 126559, 126561, 126562, 126564, 126564, 126567, 126570, 126572, 126578, 126580, 126583, 126585, 126588, 126590, 126590, 126592, 126601, 126603, 126619, 126625, 126627, 126629, 126633, 126635, 126651, 131072, 173782, 173824, 177972, 177984, 178205, 194560, 195101];
  var idContinueTable = [183, 183, 768, 879, 903, 903, 1155, 1159, 1425, 1469, 1471, 1471, 1473, 1474, 1476, 1477, 1479, 1479, 1552, 1562, 1611, 1631, 1632, 1641, 1648, 1648, 1750, 1756, 1759, 1764, 1767, 1768, 1770, 1773, 1776, 1785, 1809, 1809, 1840, 1866, 1958, 1968, 1984, 1993, 2027, 2035, 2070, 2073, 2075, 2083, 2085, 2087, 2089, 2093, 2137, 2139, 2276, 2306, 2307, 2307, 2362, 2362, 2363, 2363, 2364, 2364, 2366, 2368, 2369, 2376, 2377, 2380, 2381, 2381, 2382, 2383, 2385, 2391, 2402, 2403, 2406, 2415, 2433, 2433, 2434, 2435, 2492, 2492, 2494, 2496, 2497, 2500, 2503, 2504, 2507, 2508, 2509, 2509, 2519, 2519, 2530, 2531, 2534, 2543, 2561, 2562, 2563, 2563, 2620, 2620, 2622, 2624, 2625, 2626, 2631, 2632, 2635, 2637, 2641, 2641, 2662, 2671, 2672, 2673, 2677, 2677, 2689, 2690, 2691, 2691, 2748, 2748, 2750, 2752, 2753, 2757, 2759, 2760, 2761, 2761, 2763, 2764, 2765, 2765, 2786, 2787, 2790, 2799, 2817, 2817, 2818, 2819, 2876, 2876, 2878, 2878, 2879, 2879, 2880, 2880, 2881, 2884, 2887, 2888, 2891, 2892, 2893, 2893, 2902, 2902, 2903, 2903, 2914, 2915, 2918, 2927, 2946, 2946, 3006, 3007, 3008, 3008, 3009, 3010, 3014, 3016, 3018, 3020, 3021, 3021, 3031, 3031, 3046, 3055, 3072, 3072, 3073, 3075, 3134, 3136, 3137, 3140, 3142, 3144, 3146, 3149, 3157, 3158, 3170, 3171, 3174, 3183, 3201, 3201, 3202, 3203, 3260, 3260, 3262, 3262, 3263, 3263, 3264, 3268, 3270, 3270, 3271, 3272, 3274, 3275, 3276, 3277, 3285, 3286, 3298, 3299, 3302, 3311, 3329, 3329, 3330, 3331, 3390, 3392, 3393, 3396, 3398, 3400, 3402, 3404, 3405, 3405, 3415, 3415, 3426, 3427, 3430, 3439, 3458, 3459, 3530, 3530, 3535, 3537, 3538, 3540, 3542, 3542, 3544, 3551, 3558, 3567, 3570, 3571, 3633, 3633, 3636, 3642, 3655, 3662, 3664, 3673, 3761, 3761, 3764, 3769, 3771, 3772, 3784, 3789, 3792, 3801, 3864, 3865, 3872, 3881, 3893, 3893, 3895, 3895, 3897, 3897, 3902, 3903, 3953, 3966, 3967, 3967, 3968, 3972, 3974, 3975, 3981, 3991, 3993, 4028, 4038, 4038, 4139, 4140, 4141, 4144, 4145, 4145, 4146, 4151, 4152, 4152, 4153, 4154, 4155, 4156, 4157, 4158, 4160, 4169, 4182, 4183, 4184, 4185, 4190, 4192, 4194, 4196, 4199, 4205, 4209, 4212, 4226, 4226, 4227, 4228, 4229, 4230, 4231, 4236, 4237, 4237, 4239, 4239, 4240, 4249, 4250, 4252, 4253, 4253, 4957, 4959, 4969, 4977, 5906, 5908, 5938, 5940, 5970, 5971, 6002, 6003, 6068, 6069, 6070, 6070, 6071, 6077, 6078, 6085, 6086, 6086, 6087, 6088, 6089, 6099, 6109, 6109, 6112, 6121, 6155, 6157, 6160, 6169, 6313, 6313, 6432, 6434, 6435, 6438, 6439, 6440, 6441, 6443, 6448, 6449, 6450, 6450, 6451, 6456, 6457, 6459, 6470, 6479, 6576, 6592, 6600, 6601, 6608, 6617, 6618, 6618, 6679, 6680, 6681, 6682, 6683, 6683, 6741, 6741, 6742, 6742, 6743, 6743, 6744, 6750, 6752, 6752, 6753, 6753, 6754, 6754, 6755, 6756, 6757, 6764, 6765, 6770, 6771, 6780, 6783, 6783, 6784, 6793, 6800, 6809, 6832, 6845, 6912, 6915, 6916, 6916, 6964, 6964, 6965, 6965, 6966, 6970, 6971, 6971, 6972, 6972, 6973, 6977, 6978, 6978, 6979, 6980, 6992, 7001, 7019, 7027, 7040, 7041, 7042, 7042, 7073, 7073, 7074, 7077, 7078, 7079, 7080, 7081, 7082, 7082, 7083, 7085, 7088, 7097, 7142, 7142, 7143, 7143, 7144, 7145, 7146, 7148, 7149, 7149, 7150, 7150, 7151, 7153, 7154, 7155, 7204, 7211, 7212, 7219, 7220, 7221, 7222, 7223, 7232, 7241, 7248, 7257, 7376, 7378, 7380, 7392, 7393, 7393, 7394, 7400, 7405, 7405, 7410, 7411, 7412, 7412, 7416, 7417, 7616, 7669, 7676, 7679, 8255, 8256, 8276, 8276, 8400, 8412, 8417, 8417, 8421, 8432, 11503, 11505, 11647, 11647, 11744, 11775, 12330, 12333, 12334, 12335, 12441, 12442, 42528, 42537, 42607, 42607, 42612, 42621, 42655, 42655, 42736, 42737, 43010, 43010, 43014, 43014, 43019, 43019, 43043, 43044, 43045, 43046, 43047, 43047, 43136, 43137, 43188, 43203, 43204, 43204, 43216, 43225, 43232, 43249, 43264, 43273, 43302, 43309, 43335, 43345, 43346, 43347, 43392, 43394, 43395, 43395, 43443, 43443, 43444, 43445, 43446, 43449, 43450, 43451, 43452, 43452, 43453, 43456, 43472, 43481, 43493, 43493, 43504, 43513, 43561, 43566, 43567, 43568, 43569, 43570, 43571, 43572, 43573, 43574, 43587, 43587, 43596, 43596, 43597, 43597, 43600, 43609, 43643, 43643, 43644, 43644, 43645, 43645, 43696, 43696, 43698, 43700, 43703, 43704, 43710, 43711, 43713, 43713, 43755, 43755, 43756, 43757, 43758, 43759, 43765, 43765, 43766, 43766, 44003, 44004, 44005, 44005, 44006, 44007, 44008, 44008, 44009, 44010, 44012, 44012, 44013, 44013, 44016, 44025, 64286, 64286, 65024, 65039, 65056, 65069, 65075, 65076, 65101, 65103, 65296, 65305, 65343, 65343, 66045, 66045, 66272, 66272, 66422, 66426, 66720, 66729, 68097, 68099, 68101, 68102, 68108, 68111, 68152, 68154, 68159, 68159, 68325, 68326, 69632, 69632, 69633, 69633, 69634, 69634, 69688, 69702, 69734, 69743, 69759, 69761, 69762, 69762, 69808, 69810, 69811, 69814, 69815, 69816, 69817, 69818, 69872, 69881, 69888, 69890, 69927, 69931, 69932, 69932, 69933, 69940, 69942, 69951, 70003, 70003, 70016, 70017, 70018, 70018, 70067, 70069, 70070, 70078, 70079, 70080, 70096, 70105, 70188, 70190, 70191, 70193, 70194, 70195, 70196, 70196, 70197, 70197, 70198, 70199, 70367, 70367, 70368, 70370, 70371, 70378, 70384, 70393, 70401, 70401, 70402, 70403, 70460, 70460, 70462, 70463, 70464, 70464, 70465, 70468, 70471, 70472, 70475, 70477, 70487, 70487, 70498, 70499, 70502, 70508, 70512, 70516, 70832, 70834, 70835, 70840, 70841, 70841, 70842, 70842, 70843, 70846, 70847, 70848, 70849, 70849, 70850, 70851, 70864, 70873, 71087, 71089, 71090, 71093, 71096, 71099, 71100, 71101, 71102, 71102, 71103, 71104, 71216, 71218, 71219, 71226, 71227, 71228, 71229, 71229, 71230, 71230, 71231, 71232, 71248, 71257, 71339, 71339, 71340, 71340, 71341, 71341, 71342, 71343, 71344, 71349, 71350, 71350, 71351, 71351, 71360, 71369, 71904, 71913, 92768, 92777, 92912, 92916, 92976, 92982, 93008, 93017, 94033, 94078, 94095, 94098, 113821, 113822, 119141, 119142, 119143, 119145, 119149, 119154, 119163, 119170, 119173, 119179, 119210, 119213, 119362, 119364, 120782, 120831, 125136, 125142, 917760, 917999];
  return {
    get idStartTable() {
      return idStartTable;
    },
    get idContinueTable() {
      return idContinueTable;
    }
  };
});
System.registerModule("traceur@0.0.91/src/syntax/Scanner.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/Scanner.js";
  var IdentifierToken = System.get("traceur@0.0.91/src/syntax/IdentifierToken.js").IdentifierToken;
  var KeywordToken = System.get("traceur@0.0.91/src/syntax/KeywordToken.js").KeywordToken;
  var LiteralToken = System.get("traceur@0.0.91/src/syntax/LiteralToken.js").LiteralToken;
  var SourceRange = System.get("traceur@0.0.91/src/util/SourceRange.js").SourceRange;
  var Token = System.get("traceur@0.0.91/src/syntax/Token.js").Token;
  var getKeywordType = System.get("traceur@0.0.91/src/syntax/Keywords.js").getKeywordType;
  var $__6 = System.get("traceur@0.0.91/src/syntax/unicode-tables.js"),
      idContinueTable = $__6.idContinueTable,
      idStartTable = $__6.idStartTable;
  var $__7 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      AMPERSAND = $__7.AMPERSAND,
      AMPERSAND_EQUAL = $__7.AMPERSAND_EQUAL,
      AND = $__7.AND,
      ARROW = $__7.ARROW,
      AT = $__7.AT,
      BANG = $__7.BANG,
      BAR = $__7.BAR,
      BAR_EQUAL = $__7.BAR_EQUAL,
      CARET = $__7.CARET,
      CARET_EQUAL = $__7.CARET_EQUAL,
      CLOSE_ANGLE = $__7.CLOSE_ANGLE,
      CLOSE_CURLY = $__7.CLOSE_CURLY,
      CLOSE_PAREN = $__7.CLOSE_PAREN,
      CLOSE_SQUARE = $__7.CLOSE_SQUARE,
      COLON = $__7.COLON,
      COMMA = $__7.COMMA,
      DOT_DOT_DOT = $__7.DOT_DOT_DOT,
      END_OF_FILE = $__7.END_OF_FILE,
      EQUAL = $__7.EQUAL,
      EQUAL_EQUAL = $__7.EQUAL_EQUAL,
      EQUAL_EQUAL_EQUAL = $__7.EQUAL_EQUAL_EQUAL,
      ERROR = $__7.ERROR,
      GREATER_EQUAL = $__7.GREATER_EQUAL,
      LEFT_SHIFT = $__7.LEFT_SHIFT,
      LEFT_SHIFT_EQUAL = $__7.LEFT_SHIFT_EQUAL,
      LESS_EQUAL = $__7.LESS_EQUAL,
      MINUS = $__7.MINUS,
      MINUS_EQUAL = $__7.MINUS_EQUAL,
      MINUS_MINUS = $__7.MINUS_MINUS,
      NO_SUBSTITUTION_TEMPLATE = $__7.NO_SUBSTITUTION_TEMPLATE,
      NOT_EQUAL = $__7.NOT_EQUAL,
      NOT_EQUAL_EQUAL = $__7.NOT_EQUAL_EQUAL,
      NUMBER = $__7.NUMBER,
      OPEN_ANGLE = $__7.OPEN_ANGLE,
      OPEN_CURLY = $__7.OPEN_CURLY,
      OPEN_PAREN = $__7.OPEN_PAREN,
      OPEN_SQUARE = $__7.OPEN_SQUARE,
      OR = $__7.OR,
      PERCENT = $__7.PERCENT,
      PERCENT_EQUAL = $__7.PERCENT_EQUAL,
      PERIOD = $__7.PERIOD,
      PLUS = $__7.PLUS,
      PLUS_EQUAL = $__7.PLUS_EQUAL,
      PLUS_PLUS = $__7.PLUS_PLUS,
      QUESTION = $__7.QUESTION,
      REGULAR_EXPRESSION = $__7.REGULAR_EXPRESSION,
      RIGHT_SHIFT = $__7.RIGHT_SHIFT,
      RIGHT_SHIFT_EQUAL = $__7.RIGHT_SHIFT_EQUAL,
      SEMI_COLON = $__7.SEMI_COLON,
      SLASH = $__7.SLASH,
      SLASH_EQUAL = $__7.SLASH_EQUAL,
      STAR = $__7.STAR,
      STAR_EQUAL = $__7.STAR_EQUAL,
      STAR_STAR = $__7.STAR_STAR,
      STAR_STAR_EQUAL = $__7.STAR_STAR_EQUAL,
      STRING = $__7.STRING,
      TEMPLATE_HEAD = $__7.TEMPLATE_HEAD,
      TEMPLATE_MIDDLE = $__7.TEMPLATE_MIDDLE,
      TEMPLATE_TAIL = $__7.TEMPLATE_TAIL,
      TILDE = $__7.TILDE,
      UNSIGNED_RIGHT_SHIFT = $__7.UNSIGNED_RIGHT_SHIFT,
      UNSIGNED_RIGHT_SHIFT_EQUAL = $__7.UNSIGNED_RIGHT_SHIFT_EQUAL;
  var isWhitespaceArray = [];
  for (var i = 0; i < 128; i++) {
    isWhitespaceArray[i] = i >= 9 && i <= 13 || i === 0x20;
  }
  function isWhitespace(code) {
    if (code < 128)
      return isWhitespaceArray[code];
    switch (code) {
      case 0xA0:
      case 0xFEFF:
      case 0x2028:
      case 0x2029:
        return true;
    }
    return false;
  }
  function isLineTerminator(code) {
    switch (code) {
      case 10:
      case 13:
      case 0x2028:
      case 0x2029:
        return true;
    }
    return false;
  }
  function isDecimalDigit(code) {
    return code >= 48 && code <= 57;
  }
  var isHexDigitArray = [];
  for (var i$__8 = 0; i$__8 < 128; i$__8++) {
    isHexDigitArray[i$__8] = i$__8 >= 48 && i$__8 <= 57 || i$__8 >= 65 && i$__8 <= 70 || i$__8 >= 97 && i$__8 <= 102;
  }
  function isHexDigit(code) {
    return code < 128 && isHexDigitArray[code];
  }
  function isBinaryDigit(code) {
    return code === 48 || code === 49;
  }
  function isOctalDigit(code) {
    return code >= 48 && code <= 55;
  }
  var isIdentifierStartArray = [];
  for (var i$__9 = 0; i$__9 < 128; i$__9++) {
    isIdentifierStartArray[i$__9] = i$__9 === 36 || i$__9 >= 65 && i$__9 <= 90 || i$__9 === 95 || i$__9 >= 97 && i$__9 <= 122;
  }
  function isIdentifierStart(code) {
    return code < 128 ? isIdentifierStartArray[code] : inTable(idStartTable, code);
  }
  var isIdentifierPartArray = [];
  for (var i$__10 = 0; i$__10 < 128; i$__10++) {
    isIdentifierPartArray[i$__10] = isIdentifierStart(i$__10) || isDecimalDigit(i$__10);
  }
  function isIdentifierPart(code) {
    return code < 128 ? isIdentifierPartArray[code] : inTable(idStartTable, code) || inTable(idContinueTable, code) || code === 8204 || code === 8205;
  }
  function inTable(table, code) {
    for (var i = 0; i < table.length; ) {
      if (code < table[i++])
        return false;
      if (code <= table[i++])
        return true;
    }
    return false;
  }
  function isRegularExpressionChar(code) {
    switch (code) {
      case 47:
        return false;
      case 91:
      case 92:
        return true;
    }
    return !isLineTerminator(code);
  }
  function isRegularExpressionFirstChar(code) {
    return isRegularExpressionChar(code) && code !== 42;
  }
  var index,
      input,
      length,
      token,
      lastToken,
      lookaheadToken,
      currentCharCode,
      lineNumberTable,
      errorReporter,
      currentParser,
      options;
  function init(reporter, file, parser, traceurOptions) {
    errorReporter = reporter;
    lineNumberTable = file.lineNumberTable;
    input = file.contents;
    length = file.contents.length;
    setIndex(0);
    currentParser = parser;
    options = traceurOptions;
  }
  function getLastToken() {
    return lastToken;
  }
  function nextRegularExpressionLiteralToken() {
    lastToken = nextRegularExpressionLiteralToken2();
    token = scanToken();
    return lastToken;
  }
  function nextTemplateLiteralToken() {
    var t = nextTemplateLiteralToken2();
    token = scanToken();
    return t;
  }
  function setIndex(i) {
    index = i;
    lastToken = null;
    token = null;
    lookaheadToken = null;
    updateCurrentCharCode();
  }
  function getPosition() {
    return getPositionByOffset(getOffset());
  }
  function getPositionByOffset(offset) {
    return lineNumberTable.getSourcePosition(offset);
  }
  function nextCloseAngle() {
    switch (token.type) {
      case GREATER_EQUAL:
      case RIGHT_SHIFT:
      case RIGHT_SHIFT_EQUAL:
      case UNSIGNED_RIGHT_SHIFT:
      case UNSIGNED_RIGHT_SHIFT_EQUAL:
        setIndex(index - token.type.length + 1);
        lastToken = createToken(CLOSE_ANGLE, index);
        token = scanToken();
        return lastToken;
    }
    return nextToken();
  }
  function getTokenRange(startOffset) {
    return lineNumberTable.getSourceRange(startOffset, index);
  }
  function getOffset() {
    return token ? token.location.start.offset : index;
  }
  function nextRegularExpressionLiteralToken2() {
    var beginIndex = index - token.toString().length;
    if (!(token.type === SLASH_EQUAL && currentCharCode === 47) && !skipRegularExpressionBody(beginIndex)) {
      return new LiteralToken(REGULAR_EXPRESSION, getTokenString(beginIndex), getTokenRange(beginIndex));
    }
    if (currentCharCode !== 47) {
      reportError('Expected \'/\' in regular expression literal', beginIndex);
      return new LiteralToken(REGULAR_EXPRESSION, getTokenString(beginIndex), getTokenRange(beginIndex));
    }
    next();
    while (isIdentifierPart(currentCharCode)) {
      next();
    }
    return new LiteralToken(REGULAR_EXPRESSION, getTokenString(beginIndex), getTokenRange(beginIndex));
  }
  function skipRegularExpressionBody(beginIndex) {
    if (!isRegularExpressionFirstChar(currentCharCode)) {
      reportError('Expected regular expression first char', beginIndex);
      return false;
    }
    while (!isAtEnd() && isRegularExpressionChar(currentCharCode)) {
      if (!skipRegularExpressionChar())
        return false;
    }
    return true;
  }
  function skipRegularExpressionChar() {
    switch (currentCharCode) {
      case 92:
        return skipRegularExpressionBackslashSequence();
      case 91:
        return skipRegularExpressionClass();
      default:
        next();
        return true;
    }
  }
  function skipRegularExpressionBackslashSequence() {
    var beginIndex = index;
    next();
    if (isLineTerminator(currentCharCode) || isAtEnd()) {
      reportError('New line not allowed in regular expression literal', beginIndex, index);
      return false;
    }
    next();
    return true;
  }
  function skipRegularExpressionClass() {
    var beginIndex = index;
    next();
    while (!isAtEnd() && peekRegularExpressionClassChar()) {
      if (!skipRegularExpressionClassChar()) {
        return false;
      }
    }
    if (currentCharCode !== 93) {
      reportError('\']\' expected', beginIndex, index);
      return false;
    }
    next();
    return true;
  }
  function peekRegularExpressionClassChar() {
    return currentCharCode !== 93 && !isLineTerminator(currentCharCode);
  }
  function skipRegularExpressionClassChar() {
    if (currentCharCode === 92) {
      return skipRegularExpressionBackslashSequence();
    }
    next();
    return true;
  }
  function skipTemplateCharacter() {
    while (!isAtEnd()) {
      switch (currentCharCode) {
        case 96:
          return;
        case 92:
          skipStringLiteralEscapeSequence();
          break;
        case 36:
          {
            var code = input.charCodeAt(index + 1);
            if (code === 123)
              return;
            next();
            break;
          }
        default:
          next();
      }
    }
  }
  function scanTemplateStart(beginIndex) {
    if (isAtEnd()) {
      reportError('Unterminated template literal', beginIndex, index);
      return lastToken = createToken(END_OF_FILE, beginIndex);
    }
    return nextTemplateLiteralTokenShared(NO_SUBSTITUTION_TEMPLATE, TEMPLATE_HEAD);
  }
  function nextTemplateLiteralToken2() {
    if (isAtEnd()) {
      reportError('Expected \'}\' after expression in template literal', index, index);
      return createToken(END_OF_FILE, index);
    }
    if (token.type !== CLOSE_CURLY) {
      reportError('Expected \'}\' after expression in template literal', index, index);
      return createToken(ERROR, index);
    }
    return nextTemplateLiteralTokenShared(TEMPLATE_TAIL, TEMPLATE_MIDDLE);
  }
  function nextTemplateLiteralTokenShared(endType, middleType) {
    var beginIndex = index;
    skipTemplateCharacter();
    if (isAtEnd()) {
      reportError('Unterminated template literal');
      return createToken(ERROR, beginIndex);
    }
    var value = getTokenString(beginIndex);
    switch (currentCharCode) {
      case 96:
        next();
        return lastToken = new LiteralToken(endType, value, getTokenRange(beginIndex - 1));
      case 36:
        next();
        next();
        return lastToken = new LiteralToken(middleType, value, getTokenRange(beginIndex - 1));
    }
  }
  function nextToken() {
    var t = peekToken();
    token = lookaheadToken || scanToken();
    lookaheadToken = null;
    lastToken = t;
    return t;
  }
  function peekTokenNoLineTerminator() {
    var t = peekToken();
    var start = lastToken.location.end.offset;
    var end = t.location.start.offset;
    for (var i = start; i < end; i++) {
      if (isLineTerminator(input.charCodeAt(i))) {
        return null;
      }
    }
    return t;
  }
  function peek(expectedType) {
    return peekToken().type === expectedType;
  }
  function peekLookahead(expectedType) {
    return peekTokenLookahead().type === expectedType;
  }
  function peekToken() {
    return token || (token = scanToken());
  }
  function peekType() {
    return peekToken().type;
  }
  function peekLocation() {
    return peekToken().location;
  }
  function peekTokenLookahead() {
    if (!token)
      token = scanToken();
    if (!lookaheadToken)
      lookaheadToken = scanToken();
    return lookaheadToken;
  }
  function skipWhitespace() {
    while (!isAtEnd() && peekWhitespace()) {
      next();
    }
  }
  function peekWhitespace() {
    return isWhitespace(currentCharCode);
  }
  function skipComments() {
    while (skipComment()) {}
  }
  function skipComment() {
    skipWhitespace();
    var code = currentCharCode;
    if (code === 47) {
      code = input.charCodeAt(index + 1);
      switch (code) {
        case 47:
          skipSingleLineComment();
          return true;
        case 42:
          skipMultiLineComment();
          return true;
      }
    }
    return false;
  }
  function commentCallback(start, index) {
    if (options.commentCallback)
      currentParser.handleComment(lineNumberTable.getSourceRange(start, index));
  }
  function skipSingleLineComment() {
    var start = index;
    index += 2;
    while (!isAtEnd() && !isLineTerminator(input.charCodeAt(index++))) {}
    updateCurrentCharCode();
    commentCallback(start, index);
  }
  function skipMultiLineComment() {
    var start = index;
    var i = input.indexOf('*/', index + 2);
    if (i !== -1)
      index = i + 2;
    else
      index = length;
    updateCurrentCharCode();
    commentCallback(start, index);
  }
  function scanToken() {
    skipComments();
    var beginIndex = index;
    if (isAtEnd())
      return createToken(END_OF_FILE, beginIndex);
    var code = currentCharCode;
    next();
    switch (code) {
      case 123:
        return createToken(OPEN_CURLY, beginIndex);
      case 125:
        return createToken(CLOSE_CURLY, beginIndex);
      case 40:
        return createToken(OPEN_PAREN, beginIndex);
      case 41:
        return createToken(CLOSE_PAREN, beginIndex);
      case 91:
        return createToken(OPEN_SQUARE, beginIndex);
      case 93:
        return createToken(CLOSE_SQUARE, beginIndex);
      case 46:
        switch (currentCharCode) {
          case 46:
            if (input.charCodeAt(index + 1) === 46) {
              next();
              next();
              return createToken(DOT_DOT_DOT, beginIndex);
            }
            break;
          default:
            if (isDecimalDigit(currentCharCode))
              return scanNumberPostPeriod(beginIndex);
        }
        return createToken(PERIOD, beginIndex);
      case 59:
        return createToken(SEMI_COLON, beginIndex);
      case 44:
        return createToken(COMMA, beginIndex);
      case 126:
        return createToken(TILDE, beginIndex);
      case 63:
        return createToken(QUESTION, beginIndex);
      case 58:
        return createToken(COLON, beginIndex);
      case 60:
        switch (currentCharCode) {
          case 60:
            next();
            if (currentCharCode === 61) {
              next();
              return createToken(LEFT_SHIFT_EQUAL, beginIndex);
            }
            return createToken(LEFT_SHIFT, beginIndex);
          case 61:
            next();
            return createToken(LESS_EQUAL, beginIndex);
          default:
            return createToken(OPEN_ANGLE, beginIndex);
        }
      case 62:
        switch (currentCharCode) {
          case 62:
            next();
            switch (currentCharCode) {
              case 61:
                next();
                return createToken(RIGHT_SHIFT_EQUAL, beginIndex);
              case 62:
                next();
                if (currentCharCode === 61) {
                  next();
                  return createToken(UNSIGNED_RIGHT_SHIFT_EQUAL, beginIndex);
                }
                return createToken(UNSIGNED_RIGHT_SHIFT, beginIndex);
              default:
                return createToken(RIGHT_SHIFT, beginIndex);
            }
          case 61:
            next();
            return createToken(GREATER_EQUAL, beginIndex);
          default:
            return createToken(CLOSE_ANGLE, beginIndex);
        }
      case 61:
        if (currentCharCode === 61) {
          next();
          if (currentCharCode === 61) {
            next();
            return createToken(EQUAL_EQUAL_EQUAL, beginIndex);
          }
          return createToken(EQUAL_EQUAL, beginIndex);
        }
        if (currentCharCode === 62 && options.arrowFunctions) {
          next();
          return createToken(ARROW, beginIndex);
        }
        return createToken(EQUAL, beginIndex);
      case 33:
        if (currentCharCode === 61) {
          next();
          if (currentCharCode === 61) {
            next();
            return createToken(NOT_EQUAL_EQUAL, beginIndex);
          }
          return createToken(NOT_EQUAL, beginIndex);
        }
        return createToken(BANG, beginIndex);
      case 42:
        if (currentCharCode === 61) {
          next();
          return createToken(STAR_EQUAL, beginIndex);
        }
        if (currentCharCode === 42 && options.exponentiation) {
          next();
          if (currentCharCode === 61) {
            next();
            return createToken(STAR_STAR_EQUAL, beginIndex);
          }
          return createToken(STAR_STAR, beginIndex);
        }
        return createToken(STAR, beginIndex);
      case 37:
        if (currentCharCode === 61) {
          next();
          return createToken(PERCENT_EQUAL, beginIndex);
        }
        return createToken(PERCENT, beginIndex);
      case 94:
        if (currentCharCode === 61) {
          next();
          return createToken(CARET_EQUAL, beginIndex);
        }
        return createToken(CARET, beginIndex);
      case 47:
        if (currentCharCode === 61) {
          next();
          return createToken(SLASH_EQUAL, beginIndex);
        }
        return createToken(SLASH, beginIndex);
      case 43:
        switch (currentCharCode) {
          case 43:
            next();
            return createToken(PLUS_PLUS, beginIndex);
          case 61:
            next();
            return createToken(PLUS_EQUAL, beginIndex);
          default:
            return createToken(PLUS, beginIndex);
        }
      case 45:
        switch (currentCharCode) {
          case 45:
            next();
            return createToken(MINUS_MINUS, beginIndex);
          case 61:
            next();
            return createToken(MINUS_EQUAL, beginIndex);
          default:
            return createToken(MINUS, beginIndex);
        }
      case 38:
        switch (currentCharCode) {
          case 38:
            next();
            return createToken(AND, beginIndex);
          case 61:
            next();
            return createToken(AMPERSAND_EQUAL, beginIndex);
          default:
            return createToken(AMPERSAND, beginIndex);
        }
      case 124:
        switch (currentCharCode) {
          case 124:
            next();
            return createToken(OR, beginIndex);
          case 61:
            next();
            return createToken(BAR_EQUAL, beginIndex);
          default:
            return createToken(BAR, beginIndex);
        }
      case 96:
        return scanTemplateStart(beginIndex);
      case 64:
        return createToken(AT, beginIndex);
      case 48:
        return scanPostZero(beginIndex);
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        return scanPostDigit(beginIndex);
      case 34:
      case 39:
        return scanStringLiteral(beginIndex, code);
      default:
        return scanIdentifierOrKeyword(beginIndex, code);
    }
  }
  function scanNumberPostPeriod(beginIndex) {
    skipDecimalDigits();
    return scanExponentOfNumericLiteral(beginIndex);
  }
  function scanPostDigit(beginIndex) {
    skipDecimalDigits();
    return scanFractionalNumericLiteral(beginIndex);
  }
  function scanPostZero(beginIndex) {
    switch (currentCharCode) {
      case 46:
        return scanFractionalNumericLiteral(beginIndex);
      case 88:
      case 120:
        next();
        if (!isHexDigit(currentCharCode)) {
          reportError('Hex Integer Literal must contain at least one digit', beginIndex);
        }
        skipHexDigits();
        return new LiteralToken(NUMBER, getTokenString(beginIndex), getTokenRange(beginIndex));
      case 66:
      case 98:
        if (!options.numericLiterals)
          break;
        next();
        if (!isBinaryDigit(currentCharCode)) {
          reportError('Binary Integer Literal must contain at least one digit', beginIndex);
        }
        skipBinaryDigits();
        return new LiteralToken(NUMBER, getTokenString(beginIndex), getTokenRange(beginIndex));
      case 79:
      case 111:
        if (!options.numericLiterals)
          break;
        next();
        if (!isOctalDigit(currentCharCode)) {
          reportError('Octal Integer Literal must contain at least one digit', beginIndex);
        }
        skipOctalDigits();
        return new LiteralToken(NUMBER, getTokenString(beginIndex), getTokenRange(beginIndex));
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        return scanPostDigit(beginIndex);
    }
    return new LiteralToken(NUMBER, getTokenString(beginIndex), getTokenRange(beginIndex));
  }
  function createToken(type, beginIndex) {
    return new Token(type, getTokenRange(beginIndex));
  }
  function readUnicodeEscapeSequence() {
    var beginIndex = index;
    if (currentCharCode === 117) {
      next();
      if (skipHexDigit() && skipHexDigit() && skipHexDigit() && skipHexDigit()) {
        return parseInt(getTokenString(beginIndex + 1), 16);
      }
    }
    reportError('Invalid unicode escape sequence in identifier', beginIndex - 1);
    return 0;
  }
  function scanIdentifierOrKeyword(beginIndex, code) {
    var escapedCharCodes;
    if (code === 92) {
      code = readUnicodeEscapeSequence();
      escapedCharCodes = [code];
    }
    if (!isIdentifierStart(code)) {
      reportError(("Character code '" + code + "' is not a valid identifier start char"), beginIndex);
      return createToken(ERROR, beginIndex);
    }
    for (; ; ) {
      code = currentCharCode;
      if (isIdentifierPart(code)) {
        next();
      } else if (code === 92) {
        next();
        code = readUnicodeEscapeSequence();
        if (!escapedCharCodes)
          escapedCharCodes = [];
        escapedCharCodes.push(code);
        if (!isIdentifierPart(code))
          return createToken(ERROR, beginIndex);
      } else {
        break;
      }
    }
    var value = input.slice(beginIndex, index);
    var keywordType = getKeywordType(value);
    if (keywordType)
      return new KeywordToken(value, keywordType, getTokenRange(beginIndex));
    if (escapedCharCodes) {
      var i = 0;
      value = value.replace(/\\u..../g, function(s) {
        return String.fromCharCode(escapedCharCodes[i++]);
      });
    }
    return new IdentifierToken(getTokenRange(beginIndex), value);
  }
  function scanStringLiteral(beginIndex, terminator) {
    while (peekStringLiteralChar(terminator)) {
      if (!skipStringLiteralChar()) {
        return new LiteralToken(STRING, getTokenString(beginIndex), getTokenRange(beginIndex));
      }
    }
    if (currentCharCode !== terminator) {
      reportError('Unterminated String Literal', beginIndex);
    } else {
      next();
    }
    return new LiteralToken(STRING, getTokenString(beginIndex), getTokenRange(beginIndex));
  }
  function getTokenString(beginIndex) {
    return input.substring(beginIndex, index);
  }
  function peekStringLiteralChar(terminator) {
    return !isAtEnd() && currentCharCode !== terminator && !isLineTerminator(currentCharCode);
  }
  function skipStringLiteralChar() {
    if (currentCharCode === 92) {
      return skipStringLiteralEscapeSequence();
    }
    next();
    return true;
  }
  function skipStringLiteralEscapeSequence() {
    next();
    if (isAtEnd()) {
      reportError('Unterminated string literal escape sequence');
      return false;
    }
    if (isLineTerminator(currentCharCode)) {
      skipLineTerminator();
      return true;
    }
    var code = currentCharCode;
    next();
    switch (code) {
      case 39:
      case 34:
      case 92:
      case 98:
      case 102:
      case 110:
      case 114:
      case 116:
      case 118:
      case 48:
        return true;
      case 120:
        return skipHexDigit() && skipHexDigit();
      case 117:
        return skipUnicodeEscapeSequence();
      default:
        return true;
    }
  }
  function skipUnicodeEscapeSequence() {
    if (currentCharCode === 123 && options.unicodeEscapeSequences) {
      next();
      var beginIndex = index;
      if (!isHexDigit(currentCharCode)) {
        reportError('Hex digit expected', beginIndex);
        return false;
      }
      skipHexDigits();
      if (currentCharCode !== 125) {
        reportError('Hex digit expected', beginIndex);
        return false;
      }
      var codePoint = getTokenString(beginIndex, index);
      if (parseInt(codePoint, 16) > 0x10FFFF) {
        reportError('The code point in a Unicode escape sequence cannot exceed 10FFFF', beginIndex);
        return false;
      }
      next();
      return true;
    }
    return skipHexDigit() && skipHexDigit() && skipHexDigit() && skipHexDigit();
  }
  function skipHexDigit() {
    if (!isHexDigit(currentCharCode)) {
      reportError('Hex digit expected');
      return false;
    }
    next();
    return true;
  }
  function skipLineTerminator() {
    var first = currentCharCode;
    next();
    if (first === 13 && currentCharCode === 10) {
      next();
    }
  }
  function scanFractionalNumericLiteral(beginIndex) {
    if (currentCharCode === 46) {
      next();
      skipDecimalDigits();
    }
    return scanExponentOfNumericLiteral(beginIndex);
  }
  function scanExponentOfNumericLiteral(beginIndex) {
    switch (currentCharCode) {
      case 101:
      case 69:
        next();
        switch (currentCharCode) {
          case 43:
          case 45:
            next();
            break;
        }
        if (!isDecimalDigit(currentCharCode)) {
          reportError('Exponent part must contain at least one digit', beginIndex);
        }
        skipDecimalDigits();
        break;
      default:
        break;
    }
    return new LiteralToken(NUMBER, getTokenString(beginIndex), getTokenRange(beginIndex));
  }
  function skipDecimalDigits() {
    while (isDecimalDigit(currentCharCode)) {
      next();
    }
  }
  function skipHexDigits() {
    while (isHexDigit(currentCharCode)) {
      next();
    }
  }
  function skipBinaryDigits() {
    while (isBinaryDigit(currentCharCode)) {
      next();
    }
  }
  function skipOctalDigits() {
    while (isOctalDigit(currentCharCode)) {
      next();
    }
  }
  function isAtEnd() {
    return index === length;
  }
  function next() {
    index++;
    updateCurrentCharCode();
  }
  function updateCurrentCharCode() {
    currentCharCode = input.charCodeAt(index);
  }
  function reportError(message) {
    var startIndex = arguments[1] !== (void 0) ? arguments[1] : index;
    var endIndex = arguments[2] !== (void 0) ? arguments[2] : index;
    var start = getPositionByOffset(startIndex);
    var end = getPositionByOffset(endIndex);
    var location = new SourceRange(start, end);
    errorReporter.reportError(location, message);
  }
  return {
    get isWhitespace() {
      return isWhitespace;
    },
    get isLineTerminator() {
      return isLineTerminator;
    },
    get isIdentifierPart() {
      return isIdentifierPart;
    },
    get init() {
      return init;
    },
    get getLastToken() {
      return getLastToken;
    },
    get nextRegularExpressionLiteralToken() {
      return nextRegularExpressionLiteralToken;
    },
    get nextTemplateLiteralToken() {
      return nextTemplateLiteralToken;
    },
    get setIndex() {
      return setIndex;
    },
    get getPosition() {
      return getPosition;
    },
    get nextCloseAngle() {
      return nextCloseAngle;
    },
    get nextToken() {
      return nextToken;
    },
    get peekTokenNoLineTerminator() {
      return peekTokenNoLineTerminator;
    },
    get peek() {
      return peek;
    },
    get peekLookahead() {
      return peekLookahead;
    },
    get peekToken() {
      return peekToken;
    },
    get peekType() {
      return peekType;
    },
    get peekLocation() {
      return peekLocation;
    },
    get peekTokenLookahead() {
      return peekTokenLookahead;
    },
    get isAtEnd() {
      return isAtEnd;
    }
  };
});
System.registerModule("traceur@0.0.91/src/syntax/Parser.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/Parser.js";
  var FindVisitor = System.get("traceur@0.0.91/src/codegeneration/FindVisitor.js").FindVisitor;
  var IdentifierToken = System.get("traceur@0.0.91/src/syntax/IdentifierToken.js").IdentifierToken;
  var $__2 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      ARRAY_LITERAL_EXPRESSION = $__2.ARRAY_LITERAL_EXPRESSION,
      BINDING_IDENTIFIER = $__2.BINDING_IDENTIFIER,
      CALL_EXPRESSION = $__2.CALL_EXPRESSION,
      COMPUTED_PROPERTY_NAME = $__2.COMPUTED_PROPERTY_NAME,
      COVER_FORMALS = $__2.COVER_FORMALS,
      FORMAL_PARAMETER_LIST = $__2.FORMAL_PARAMETER_LIST,
      IDENTIFIER_EXPRESSION = $__2.IDENTIFIER_EXPRESSION,
      LITERAL_PROPERTY_NAME = $__2.LITERAL_PROPERTY_NAME,
      OBJECT_LITERAL_EXPRESSION = $__2.OBJECT_LITERAL_EXPRESSION,
      REST_PARAMETER = $__2.REST_PARAMETER,
      SYNTAX_ERROR_TREE = $__2.SYNTAX_ERROR_TREE;
  var Options = System.get("traceur@0.0.91/src/Options.js").Options;
  var $__4 = System.get("traceur@0.0.91/src/syntax/PredefinedName.js"),
      AS = $__4.AS,
      ASYNC = $__4.ASYNC,
      ASYNC_STAR = $__4.ASYNC_STAR,
      AWAIT = $__4.AWAIT,
      CONSTRUCTOR = $__4.CONSTRUCTOR,
      FROM = $__4.FROM,
      GET = $__4.GET,
      OF = $__4.OF,
      ON = $__4.ON,
      SET = $__4.SET;
  var SyntaxErrorReporter = System.get("traceur@0.0.91/src/util/SyntaxErrorReporter.js").SyntaxErrorReporter;
  var $__6 = System.get("traceur@0.0.91/src/syntax/Scanner.js"),
      getLastToken = $__6.getLastToken,
      getPosition = $__6.getPosition,
      initScanner = $__6.init,
      isAtEnd = $__6.isAtEnd,
      nextCloseAngle = $__6.nextCloseAngle,
      nextRegularExpressionLiteralToken = $__6.nextRegularExpressionLiteralToken,
      nextTemplateLiteralToken = $__6.nextTemplateLiteralToken,
      nextToken = $__6.nextToken,
      peek = $__6.peek,
      peekLocation = $__6.peekLocation,
      peekLookahead = $__6.peekLookahead,
      peekToken = $__6.peekToken,
      peekTokenLookahead = $__6.peekTokenLookahead,
      peekTokenNoLineTerminator = $__6.peekTokenNoLineTerminator,
      peekType = $__6.peekType,
      resetScanner = $__6.setIndex;
  var SourceRange = System.get("traceur@0.0.91/src/util/SourceRange.js").SourceRange;
  var $__8 = System.get("traceur@0.0.91/src/syntax/Token.js"),
      Token = $__8.Token,
      isAssignmentOperator = $__8.isAssignmentOperator;
  var getKeywordType = System.get("traceur@0.0.91/src/syntax/Keywords.js").getKeywordType;
  var validateConstructor = System.get("traceur@0.0.91/src/semantics/ConstructorValidator.js").validateConstructor;
  var validateParameters = System.get("traceur@0.0.91/src/staticsemantics/validateParameters.js").default;
  var isValidSimpleAssignmentTarget = System.get("traceur@0.0.91/src/staticsemantics/isValidSimpleAssignmentTarget.js").default;
  var $__13 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      AMPERSAND = $__13.AMPERSAND,
      AND = $__13.AND,
      ARROW = $__13.ARROW,
      AT = $__13.AT,
      BANG = $__13.BANG,
      BAR = $__13.BAR,
      BREAK = $__13.BREAK,
      CARET = $__13.CARET,
      CASE = $__13.CASE,
      CATCH = $__13.CATCH,
      CLASS = $__13.CLASS,
      CLOSE_ANGLE = $__13.CLOSE_ANGLE,
      CLOSE_CURLY = $__13.CLOSE_CURLY,
      CLOSE_PAREN = $__13.CLOSE_PAREN,
      CLOSE_SQUARE = $__13.CLOSE_SQUARE,
      COLON = $__13.COLON,
      COMMA = $__13.COMMA,
      CONST = $__13.CONST,
      CONTINUE = $__13.CONTINUE,
      DEBUGGER = $__13.DEBUGGER,
      DEFAULT = $__13.DEFAULT,
      DELETE = $__13.DELETE,
      DO = $__13.DO,
      DOT_DOT_DOT = $__13.DOT_DOT_DOT,
      ELSE = $__13.ELSE,
      END_OF_FILE = $__13.END_OF_FILE,
      EQUAL = $__13.EQUAL,
      EQUAL_EQUAL = $__13.EQUAL_EQUAL,
      EQUAL_EQUAL_EQUAL = $__13.EQUAL_EQUAL_EQUAL,
      ERROR = $__13.ERROR,
      EXPORT = $__13.EXPORT,
      EXTENDS = $__13.EXTENDS,
      FALSE = $__13.FALSE,
      FINALLY = $__13.FINALLY,
      FOR = $__13.FOR,
      FUNCTION = $__13.FUNCTION,
      GREATER_EQUAL = $__13.GREATER_EQUAL,
      IDENTIFIER = $__13.IDENTIFIER,
      IF = $__13.IF,
      IMPLEMENTS = $__13.IMPLEMENTS,
      IMPORT = $__13.IMPORT,
      IN = $__13.IN,
      INSTANCEOF = $__13.INSTANCEOF,
      INTERFACE = $__13.INTERFACE,
      LEFT_SHIFT = $__13.LEFT_SHIFT,
      LESS_EQUAL = $__13.LESS_EQUAL,
      LET = $__13.LET,
      MINUS = $__13.MINUS,
      MINUS_MINUS = $__13.MINUS_MINUS,
      NEW = $__13.NEW,
      NO_SUBSTITUTION_TEMPLATE = $__13.NO_SUBSTITUTION_TEMPLATE,
      NOT_EQUAL = $__13.NOT_EQUAL,
      NOT_EQUAL_EQUAL = $__13.NOT_EQUAL_EQUAL,
      NULL = $__13.NULL,
      NUMBER = $__13.NUMBER,
      OPEN_ANGLE = $__13.OPEN_ANGLE,
      OPEN_CURLY = $__13.OPEN_CURLY,
      OPEN_PAREN = $__13.OPEN_PAREN,
      OPEN_SQUARE = $__13.OPEN_SQUARE,
      OR = $__13.OR,
      PACKAGE = $__13.PACKAGE,
      PERCENT = $__13.PERCENT,
      PERIOD = $__13.PERIOD,
      PLUS = $__13.PLUS,
      PLUS_PLUS = $__13.PLUS_PLUS,
      PRIVATE = $__13.PRIVATE,
      PROTECTED = $__13.PROTECTED,
      PUBLIC = $__13.PUBLIC,
      QUESTION = $__13.QUESTION,
      RETURN = $__13.RETURN,
      RIGHT_SHIFT = $__13.RIGHT_SHIFT,
      SEMI_COLON = $__13.SEMI_COLON,
      SLASH = $__13.SLASH,
      SLASH_EQUAL = $__13.SLASH_EQUAL,
      STAR = $__13.STAR,
      STAR_STAR = $__13.STAR_STAR,
      STATIC = $__13.STATIC,
      STRING = $__13.STRING,
      SUPER = $__13.SUPER,
      SWITCH = $__13.SWITCH,
      TEMPLATE_HEAD = $__13.TEMPLATE_HEAD,
      TEMPLATE_TAIL = $__13.TEMPLATE_TAIL,
      THIS = $__13.THIS,
      THROW = $__13.THROW,
      TILDE = $__13.TILDE,
      TRUE = $__13.TRUE,
      TRY = $__13.TRY,
      TYPEOF = $__13.TYPEOF,
      UNSIGNED_RIGHT_SHIFT = $__13.UNSIGNED_RIGHT_SHIFT,
      VAR = $__13.VAR,
      VOID = $__13.VOID,
      WHILE = $__13.WHILE,
      WITH = $__13.WITH,
      YIELD = $__13.YIELD;
  var $__14 = System.get("traceur@0.0.91/src/syntax/trees/ParseTrees.js"),
      ArgumentList = $__14.ArgumentList,
      ArrayComprehension = $__14.ArrayComprehension,
      ArrayLiteralExpression = $__14.ArrayLiteralExpression,
      ArrayPattern = $__14.ArrayPattern,
      ArrayType = $__14.ArrayType,
      ArrowFunctionExpression = $__14.ArrowFunctionExpression,
      AssignmentElement = $__14.AssignmentElement,
      AwaitExpression = $__14.AwaitExpression,
      BinaryExpression = $__14.BinaryExpression,
      BindingElement = $__14.BindingElement,
      BindingIdentifier = $__14.BindingIdentifier,
      Block = $__14.Block,
      BreakStatement = $__14.BreakStatement,
      CallExpression = $__14.CallExpression,
      CallSignature = $__14.CallSignature,
      CaseClause = $__14.CaseClause,
      Catch = $__14.Catch,
      ClassDeclaration = $__14.ClassDeclaration,
      ClassExpression = $__14.ClassExpression,
      CommaExpression = $__14.CommaExpression,
      ComprehensionFor = $__14.ComprehensionFor,
      ComprehensionIf = $__14.ComprehensionIf,
      ComputedPropertyName = $__14.ComputedPropertyName,
      ConditionalExpression = $__14.ConditionalExpression,
      ConstructSignature = $__14.ConstructSignature,
      ConstructorType = $__14.ConstructorType,
      ContinueStatement = $__14.ContinueStatement,
      CoverFormals = $__14.CoverFormals,
      CoverInitializedName = $__14.CoverInitializedName,
      DebuggerStatement = $__14.DebuggerStatement,
      Annotation = $__14.Annotation,
      DefaultClause = $__14.DefaultClause,
      DoWhileStatement = $__14.DoWhileStatement,
      EmptyStatement = $__14.EmptyStatement,
      ExportDeclaration = $__14.ExportDeclaration,
      ExportDefault = $__14.ExportDefault,
      ExportSpecifier = $__14.ExportSpecifier,
      ExportSpecifierSet = $__14.ExportSpecifierSet,
      ExportStar = $__14.ExportStar,
      ExpressionStatement = $__14.ExpressionStatement,
      Finally = $__14.Finally,
      ForInStatement = $__14.ForInStatement,
      ForOfStatement = $__14.ForOfStatement,
      ForOnStatement = $__14.ForOnStatement,
      ForStatement = $__14.ForStatement,
      FormalParameter = $__14.FormalParameter,
      FormalParameterList = $__14.FormalParameterList,
      ForwardDefaultExport = $__14.ForwardDefaultExport,
      FunctionBody = $__14.FunctionBody,
      FunctionDeclaration = $__14.FunctionDeclaration,
      FunctionExpression = $__14.FunctionExpression,
      FunctionType = $__14.FunctionType,
      GeneratorComprehension = $__14.GeneratorComprehension,
      GetAccessor = $__14.GetAccessor,
      IdentifierExpression = $__14.IdentifierExpression,
      IfStatement = $__14.IfStatement,
      ImportClausePair = $__14.ImportClausePair,
      ImportDeclaration = $__14.ImportDeclaration,
      ImportSpecifier = $__14.ImportSpecifier,
      ImportSpecifierSet = $__14.ImportSpecifierSet,
      ImportedBinding = $__14.ImportedBinding,
      IndexSignature = $__14.IndexSignature,
      InterfaceDeclaration = $__14.InterfaceDeclaration,
      LabelledStatement = $__14.LabelledStatement,
      LiteralExpression = $__14.LiteralExpression,
      LiteralPropertyName = $__14.LiteralPropertyName,
      MemberExpression = $__14.MemberExpression,
      MemberLookupExpression = $__14.MemberLookupExpression,
      MethodSignature = $__14.MethodSignature,
      Module = $__14.Module,
      ModuleSpecifier = $__14.ModuleSpecifier,
      NameSpaceExport = $__14.NameSpaceExport,
      NameSpaceImport = $__14.NameSpaceImport,
      NamedExport = $__14.NamedExport,
      NewExpression = $__14.NewExpression,
      ObjectLiteralExpression = $__14.ObjectLiteralExpression,
      ObjectPattern = $__14.ObjectPattern,
      ObjectPatternField = $__14.ObjectPatternField,
      ObjectType = $__14.ObjectType,
      ParenExpression = $__14.ParenExpression,
      PostfixExpression = $__14.PostfixExpression,
      PredefinedType = $__14.PredefinedType,
      PropertyMethodAssignment = $__14.PropertyMethodAssignment,
      PropertyNameAssignment = $__14.PropertyNameAssignment,
      PropertyNameShorthand = $__14.PropertyNameShorthand,
      PropertySignature = $__14.PropertySignature,
      PropertyVariableDeclaration = $__14.PropertyVariableDeclaration,
      RestParameter = $__14.RestParameter,
      ReturnStatement = $__14.ReturnStatement,
      Script = $__14.Script,
      SetAccessor = $__14.SetAccessor,
      SpreadExpression = $__14.SpreadExpression,
      SpreadPatternElement = $__14.SpreadPatternElement,
      SuperExpression = $__14.SuperExpression,
      SwitchStatement = $__14.SwitchStatement,
      SyntaxErrorTree = $__14.SyntaxErrorTree,
      TemplateLiteralExpression = $__14.TemplateLiteralExpression,
      TemplateLiteralPortion = $__14.TemplateLiteralPortion,
      TemplateSubstitution = $__14.TemplateSubstitution,
      ThisExpression = $__14.ThisExpression,
      ThrowStatement = $__14.ThrowStatement,
      TryStatement = $__14.TryStatement,
      TypeArguments = $__14.TypeArguments,
      TypeName = $__14.TypeName,
      TypeParameter = $__14.TypeParameter,
      TypeParameters = $__14.TypeParameters,
      TypeReference = $__14.TypeReference,
      UnaryExpression = $__14.UnaryExpression,
      UnionType = $__14.UnionType,
      VariableDeclaration = $__14.VariableDeclaration,
      VariableDeclarationList = $__14.VariableDeclarationList,
      VariableStatement = $__14.VariableStatement,
      WhileStatement = $__14.WhileStatement,
      WithStatement = $__14.WithStatement,
      YieldExpression = $__14.YieldExpression;
  var ALLOW_IN = true;
  var NO_IN = false;
  var INITIALIZER_REQUIRED = true;
  var INITIALIZER_OPTIONAL = false;
  var ValidateObjectLiteral = function($__super) {
    function ValidateObjectLiteral() {
      $traceurRuntime.superConstructor(ValidateObjectLiteral).call(this);
      this.errorToken = null;
    }
    return ($traceurRuntime.createClass)(ValidateObjectLiteral, {visitCoverInitializedName: function(tree) {
        this.errorToken = tree.equalToken;
        this.found = true;
      }}, {}, $__super);
  }(FindVisitor);
  function containsInitializer(declarations) {
    return declarations.some(function(v) {
      return v.initializer;
    });
  }
  var FUNCTION_STATE_SCRIPT = 1;
  var FUNCTION_STATE_MODULE = 1 << 1;
  var FUNCTION_STATE_FUNCTION = 1 << 2;
  var FUNCTION_STATE_ARROW = 1 << 3;
  var FUNCTION_STATE_METHOD = 1 << 4;
  var FUNCTION_STATE_DERIVED_CONSTRUCTOR = 1 << 5;
  var FUNCTION_STATE_GENERATOR = 1 << 6;
  var FUNCTION_STATE_ASYNC = 1 << 7;
  var FUNCTION_STATE_LENIENT = FUNCTION_STATE_METHOD | FUNCTION_STATE_GENERATOR | FUNCTION_STATE_ASYNC | FUNCTION_STATE_DERIVED_CONSTRUCTOR;
  var FunctionState = function() {
    function FunctionState(outer, kind) {
      this.outer = outer;
      this.kind = kind;
    }
    return ($traceurRuntime.createClass)(FunctionState, {
      isTopMost: function() {
        return this.kind & (FUNCTION_STATE_SCRIPT | FUNCTION_STATE_MODULE);
      },
      isMethod: function() {
        return this.kind & FUNCTION_STATE_METHOD;
      },
      isDerivedConstructor: function() {
        return this.kind & FUNCTION_STATE_DERIVED_CONSTRUCTOR;
      },
      isArrowFunction: function() {
        return this.kind & FUNCTION_STATE_ARROW;
      },
      isGenerator: function() {
        return this.kind & FUNCTION_STATE_GENERATOR;
      },
      isAsyncFunction: function() {
        return this.kind & FUNCTION_STATE_ASYNC;
      },
      isAsyncGenerator: function() {
        return this.isGenerator() && this.isAsyncFunction();
      }
    }, {});
  }();
  var Parser = function() {
    function Parser(file) {
      var errorReporter = arguments[1] !== (void 0) ? arguments[1] : new SyntaxErrorReporter();
      var options = arguments[2] !== (void 0) ? arguments[2] : new Options();
      this.errorReporter_ = errorReporter;
      initScanner(errorReporter, file, this, options);
      this.options_ = options;
      this.coverInitializedNameCount_ = 0;
      this.strictMode_ = false;
      this.annotations_ = [];
      this.functionState_ = null;
    }
    return ($traceurRuntime.createClass)(Parser, {
      get allowYield_() {
        return this.functionState_.isGenerator();
      },
      get allowAwait_() {
        return this.functionState_.isAsyncFunction();
      },
      get allowForOn_() {
        return this.functionState_.isAsyncFunction();
      },
      parseScript: function() {
        this.strictMode_ = false;
        var start = this.getTreeStartLocation_();
        var fs = this.pushFunctionState_(FUNCTION_STATE_SCRIPT);
        var scriptItemList = this.parseStatementList_(true);
        this.eat_(END_OF_FILE);
        this.popFunctionState_(fs);
        return new Script(this.getTreeLocation_(start), scriptItemList, null);
      },
      pushFunctionState_: function(kind) {
        return this.functionState_ = new FunctionState(this.functionState_, kind);
      },
      popFunctionState_: function(fs) {
        if (fs != this.functionState_) {
          throw new Error('Internal error');
        }
        this.functionState_ = this.functionState_.outer;
      },
      parseStatementList_: function(checkUseStrictDirective) {
        var result = [];
        var type;
        while ((type = peekType()) !== CLOSE_CURLY && type !== END_OF_FILE) {
          var statement = this.parseStatementListItem_(type);
          if (checkUseStrictDirective) {
            if (!statement.isDirectivePrologue()) {
              checkUseStrictDirective = false;
            } else if (statement.isUseStrictDirective()) {
              this.strictMode_ = true;
              checkUseStrictDirective = false;
            }
          }
          result.push(statement);
        }
        return result;
      },
      parseStatementListItem_: function(type) {
        switch (type) {
          case LET:
          case CONST:
            if (this.options_.blockBinding) {
              return this.parseVariableStatement_();
            }
            break;
          case CLASS:
            if (this.options_.classes) {
              return this.parseClassDeclaration_();
            }
            break;
          case FUNCTION:
            return this.parseFunctionDeclaration_();
        }
        return this.parseStatementWithType_(type);
      },
      parseModule: function() {
        var start = this.getTreeStartLocation_();
        var fs = this.pushFunctionState_(FUNCTION_STATE_MODULE);
        var scriptItemList = this.parseModuleItemList_();
        this.eat_(END_OF_FILE);
        this.popFunctionState_(fs);
        return new Module(this.getTreeLocation_(start), scriptItemList, null);
      },
      parseModuleItemList_: function() {
        this.strictMode_ = true;
        var result = [];
        var type;
        while ((type = peekType()) !== END_OF_FILE) {
          var statement = this.parseModuleItem_(type);
          result.push(statement);
        }
        return result;
      },
      parseModuleItem_: function(type) {
        switch (type) {
          case IMPORT:
            return this.parseImportDeclaration_();
          case EXPORT:
            return this.parseExportDeclaration_();
          case AT:
            if (this.options_.annotations)
              return this.parseAnnotatedDeclarations_(true);
            break;
        }
        return this.parseStatementListItem_(type);
      },
      parseModuleSpecifier_: function() {
        var start = this.getTreeStartLocation_();
        var token = this.eat_(STRING);
        return new ModuleSpecifier(this.getTreeLocation_(start), token);
      },
      parseNameSpaceImport_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(STAR);
        this.eatId_(AS);
        var binding = this.parseImportedBinding_();
        return new NameSpaceImport(this.getTreeLocation_(start), binding);
      },
      parseImportDeclaration_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(IMPORT);
        var importClause = null;
        if (!peek(STRING)) {
          importClause = this.parseImportClause_(true);
          this.eatId_(FROM);
        }
        var moduleSpecifier = this.parseModuleSpecifier_();
        this.eatPossibleImplicitSemiColon_();
        return new ImportDeclaration(this.getTreeLocation_(start), importClause, moduleSpecifier);
      },
      parseImportClause_: function(allowImportedDefaultBinding) {
        switch (peekType()) {
          case STAR:
            return this.parseNameSpaceImport_();
          case OPEN_CURLY:
            return this.parseImportSpecifierSet_();
          case IDENTIFIER:
            if (allowImportedDefaultBinding) {
              var start = this.getTreeStartLocation_();
              var importedBinding = this.parseImportedBinding_();
              if (this.eatIf_(COMMA)) {
                var second = this.parseImportClause_(false);
                return new ImportClausePair(this.getTreeLocation_(start), importedBinding, second);
              }
              return importedBinding;
            }
            break;
        }
        return this.parseUnexpectedToken_(peekToken());
      },
      parseImportSpecifierSet_: function() {
        var start = this.getTreeStartLocation_();
        var specifiers = [];
        this.eat_(OPEN_CURLY);
        while (!peek(CLOSE_CURLY) && !isAtEnd()) {
          specifiers.push(this.parseImportSpecifier_());
          if (!this.eatIf_(COMMA))
            break;
        }
        this.eat_(CLOSE_CURLY);
        return new ImportSpecifierSet(this.getTreeLocation_(start), specifiers);
      },
      parseImportedBinding_: function() {
        var start = this.getTreeStartLocation_();
        var binding = this.parseBindingIdentifier_();
        return new ImportedBinding(this.getTreeLocation_(start), binding);
      },
      parseImportSpecifier_: function() {
        var start = this.getTreeStartLocation_();
        var token = peekToken();
        var isKeyword = token.isKeyword();
        var binding;
        var name = this.eatIdName_();
        if (isKeyword || this.peekPredefinedString_(AS)) {
          this.eatId_(AS);
          binding = this.parseImportedBinding_();
        } else {
          binding = new ImportedBinding(name.location, new BindingIdentifier(name.location, name));
          name = null;
        }
        return new ImportSpecifier(this.getTreeLocation_(start), binding, name);
      },
      parseExportDeclaration_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(EXPORT);
        var exportTree;
        var annotations = this.popAnnotations_();
        var type = peekType();
        switch (type) {
          case CONST:
          case LET:
            if (this.options_.blockBinding) {
              exportTree = this.parseVariableStatement_();
              break;
            }
            return this.parseUnexpectedToken_(peekToken());
          case VAR:
            exportTree = this.parseVariableStatement_();
            break;
          case FUNCTION:
            exportTree = this.parseFunctionDeclaration_();
            break;
          case CLASS:
            exportTree = this.parseClassDeclaration_();
            break;
          case DEFAULT:
            exportTree = this.parseExportDefault_();
            break;
          case OPEN_CURLY:
          case STAR:
            exportTree = this.parseNamedExport_();
            break;
          case IDENTIFIER:
            if (this.options_.asyncFunctions && this.peekPredefinedString_(ASYNC)) {
              var asyncToken = this.eatId_();
              exportTree = this.parseAsyncFunctionDeclaration_(asyncToken);
            } else if (this.options_.exportFromExtended) {
              exportTree = this.parseNamedExport_();
            }
            break;
          default:
            return this.parseUnexpectedToken_(peekToken());
        }
        return new ExportDeclaration(this.getTreeLocation_(start), exportTree, annotations);
      },
      parseExportDefault_: function() {
        var start = this.getTreeStartLocation_();
        var defaultToken = this.eat_(DEFAULT);
        if (this.options_.exportFromExtended && this.peekPredefinedString_(FROM)) {
          var idName = new IdentifierToken(defaultToken.location, DEFAULT);
          var namedExport = new ForwardDefaultExport(this.getTreeLocation_(start), idName);
          this.eatId_(FROM);
          var moduleSpecifier = this.parseModuleSpecifier_();
          return new NamedExport(this.getTreeLocation_(start), namedExport, moduleSpecifier);
        }
        var exportValue;
        switch (peekType()) {
          case FUNCTION:
            {
              var tree = this.parseFunctionExpression_();
              if (tree.name) {
                tree = new FunctionDeclaration(tree.location, tree.name, tree.functionKind, tree.parameterList, tree.typeAnnotation, tree.annotations, tree.body);
              }
              exportValue = tree;
              break;
            }
          case CLASS:
            {
              if (!this.options_.classes) {
                return this.parseSyntaxError_('Unexpected reserved word');
              }
              var tree$__17 = this.parseClassExpression_();
              if (tree$__17.name) {
                tree$__17 = new ClassDeclaration(tree$__17.location, tree$__17.name, tree$__17.superClass, tree$__17.elements, tree$__17.annotations, tree$__17.typeParameters);
              }
              exportValue = tree$__17;
              break;
            }
          default:
            exportValue = this.parseAssignmentExpression_(ALLOW_IN);
            this.eatPossibleImplicitSemiColon_();
        }
        return new ExportDefault(this.getTreeLocation_(start), exportValue);
      },
      parseNamedExport_: function() {
        var start = this.getTreeStartLocation_();
        var exportClause,
            moduleSpecifier = null;
        switch (peekType()) {
          case OPEN_CURLY:
            exportClause = this.parseExportSpecifierSet_();
            if (this.peekPredefinedString_(FROM)) {
              this.eatId_(FROM);
              moduleSpecifier = this.parseModuleSpecifier_();
            } else {
              this.validateExportSpecifierSet_(exportClause);
            }
            break;
          case IDENTIFIER:
            exportClause = this.parseForwardDefaultExport_();
            this.eatId_(FROM);
            moduleSpecifier = this.parseModuleSpecifier_();
            break;
          case STAR:
            exportClause = this.parseExportStar_();
            this.eatId_(FROM);
            moduleSpecifier = this.parseModuleSpecifier_();
            break;
        }
        this.eatPossibleImplicitSemiColon_();
        return new NamedExport(this.getTreeLocation_(start), exportClause, moduleSpecifier);
      },
      parseExportStar_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(STAR);
        if (this.peekPredefinedString_(AS)) {
          this.eatId_(AS);
          var name = this.eatIdName_();
          return new NameSpaceExport(this.getTreeLocation_(start), name);
        }
        return new ExportStar(this.getTreeLocation_(start));
      },
      parseExportSpecifierSet_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(OPEN_CURLY);
        var specifiers = [this.parseExportSpecifier_()];
        while (this.eatIf_(COMMA)) {
          if (peek(CLOSE_CURLY))
            break;
          specifiers.push(this.parseExportSpecifier_());
        }
        this.eat_(CLOSE_CURLY);
        return new ExportSpecifierSet(this.getTreeLocation_(start), specifiers);
      },
      parseExportSpecifier_: function() {
        var start = this.getTreeStartLocation_();
        var lhs = this.eatIdName_();
        var rhs = null;
        if (this.peekPredefinedString_(AS)) {
          this.eatId_();
          rhs = this.eatIdName_();
        }
        return new ExportSpecifier(this.getTreeLocation_(start), lhs, rhs);
      },
      parseForwardDefaultExport_: function() {
        var start = this.getTreeStartLocation_();
        var idName = this.eatIdName_();
        return new ForwardDefaultExport(this.getTreeLocation_(start), idName);
      },
      validateExportSpecifierSet_: function(tree) {
        for (var i = 0; i < tree.specifiers.length; i++) {
          var specifier = tree.specifiers[i];
          if (getKeywordType(specifier.lhs.value)) {
            this.reportError_(specifier.lhs.location, ("Unexpected token " + specifier.lhs.value));
          }
        }
      },
      peekId_: function(type) {
        if (type === IDENTIFIER)
          return true;
        if (this.strictMode_)
          return false;
        return peekToken().isStrictKeyword();
      },
      peekIdName_: function(token) {
        return token.type === IDENTIFIER || token.isKeyword();
      },
      parseClassShared_: function(constr) {
        var start = this.getTreeStartLocation_();
        var strictMode = this.strictMode_;
        this.strictMode_ = true;
        this.eat_(CLASS);
        var name = null;
        var typeParameters = null;
        var annotations = [];
        if (constr === ClassDeclaration || !peek(EXTENDS) && !peek(OPEN_CURLY)) {
          name = this.parseBindingIdentifier_();
          if (this.options_.types) {
            typeParameters = this.parseTypeParametersOpt_();
          }
          annotations = this.popAnnotations_();
        }
        var superClass = null;
        if (this.eatIf_(EXTENDS)) {
          superClass = this.parseLeftHandSideExpression_();
          superClass = this.coverFormalsToParenExpression_(superClass);
        }
        this.eat_(OPEN_CURLY);
        var elements = this.parseClassElements_(superClass);
        this.eat_(CLOSE_CURLY);
        this.strictMode_ = strictMode;
        return new constr(this.getTreeLocation_(start), name, superClass, elements, annotations, typeParameters);
      },
      parseClassDeclaration_: function() {
        return this.parseClassShared_(ClassDeclaration);
      },
      parseClassExpression_: function() {
        return this.parseClassShared_(ClassExpression);
      },
      parseClassElements_: function(derivedClass) {
        var result = [];
        while (true) {
          var type = peekType();
          if (type === SEMI_COLON) {
            nextToken();
          } else if (this.peekClassElement_(peekType())) {
            result.push(this.parseClassElement_(derivedClass));
          } else {
            break;
          }
        }
        return result;
      },
      peekClassElement_: function(type) {
        return this.peekPropertyName_(type) || type === STAR && this.options_.generators || type === AT && this.options_.annotations;
      },
      parsePropertyName_: function() {
        if (peek(OPEN_SQUARE))
          return this.parseComputedPropertyName_();
        return this.parseLiteralPropertyName_();
      },
      parseLiteralPropertyName_: function() {
        var start = this.getTreeStartLocation_();
        var token = nextToken();
        return new LiteralPropertyName(this.getTreeLocation_(start), token);
      },
      parseComputedPropertyName_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(OPEN_SQUARE);
        var expression = this.parseAssignmentExpression_(ALLOW_IN);
        this.eat_(CLOSE_SQUARE);
        return new ComputedPropertyName(this.getTreeLocation_(start), expression);
      },
      parseStatement: function() {
        var fs = this.pushFunctionState_(FUNCTION_STATE_LENIENT);
        var result = this.parseModuleItem_(peekType());
        this.popFunctionState_(fs);
        return result;
      },
      parseStatements: function() {
        var fs = this.pushFunctionState_(FUNCTION_STATE_LENIENT);
        var result = this.parseModuleItemList_();
        this.popFunctionState_(fs);
        return result;
      },
      parseStatement_: function() {
        return this.parseStatementWithType_(peekType());
      },
      parseStatementWithType_: function(type) {
        switch (type) {
          case RETURN:
            return this.parseReturnStatement_();
          case VAR:
            return this.parseVariableStatement_();
          case IF:
            return this.parseIfStatement_();
          case FOR:
            return this.parseForStatement_();
          case BREAK:
            return this.parseBreakStatement_();
          case SWITCH:
            return this.parseSwitchStatement_();
          case THROW:
            return this.parseThrowStatement_();
          case WHILE:
            return this.parseWhileStatement_();
          case AT:
            if (this.options_.annotations)
              return this.parseAnnotatedDeclarations_(false);
            break;
          case CONTINUE:
            return this.parseContinueStatement_();
          case DEBUGGER:
            return this.parseDebuggerStatement_();
          case DO:
            return this.parseDoWhileStatement_();
          case OPEN_CURLY:
            return this.parseBlock_();
          case SEMI_COLON:
            return this.parseEmptyStatement_();
          case TRY:
            return this.parseTryStatement_();
          case WITH:
            return this.parseWithStatement_();
          case INTERFACE:
            if (this.options_.types) {
              return this.parseInterfaceDeclaration_();
            }
        }
        return this.parseFallThroughStatement_();
      },
      parseFunctionDeclaration_: function() {
        return this.parseFunction_(FunctionDeclaration);
      },
      parseFunctionExpression_: function() {
        return this.parseFunction_(FunctionExpression);
      },
      parseAsyncFunctionDeclaration_: function(asyncToken) {
        return this.parseAsyncFunction_(asyncToken, FunctionDeclaration);
      },
      parseAsyncFunctionExpression_: function(asyncToken) {
        return this.parseAsyncFunction_(asyncToken, FunctionExpression);
      },
      peekAsyncStar_: function() {
        return this.options_.asyncGenerators && peek(STAR);
      },
      parseAsyncFunction_: function(asyncToken, ctor) {
        var start = asyncToken.location.start;
        this.eat_(FUNCTION);
        var kind = FUNCTION_STATE_FUNCTION | FUNCTION_STATE_ASYNC;
        if (this.peekAsyncStar_()) {
          kind |= FUNCTION_STATE_GENERATOR;
          this.eat_(STAR);
          asyncToken = new IdentifierToken(asyncToken.location, ASYNC_STAR);
        }
        var fs = this.pushFunctionState_(kind);
        var f = this.parseFunction2_(start, asyncToken, ctor);
        this.popFunctionState_(fs);
        return f;
      },
      parseFunction_: function(ctor) {
        var start = this.getTreeStartLocation_();
        this.eat_(FUNCTION);
        var functionKind = null;
        var kind = FUNCTION_STATE_FUNCTION;
        if (this.options_.generators && peek(STAR)) {
          functionKind = this.eat_(STAR);
          kind |= FUNCTION_STATE_GENERATOR;
        }
        var fs = this.pushFunctionState_(kind);
        var f = this.parseFunction2_(start, functionKind, ctor);
        this.popFunctionState_(fs);
        return f;
      },
      parseFunction2_: function(start, functionKind, ctor) {
        var name = null;
        var annotations = [];
        if (ctor === FunctionDeclaration || this.peekBindingIdentifier_(peekType())) {
          name = this.parseBindingIdentifier_();
          annotations = this.popAnnotations_();
        }
        this.eat_(OPEN_PAREN);
        var parameters = this.parseFormalParameters_();
        this.eat_(CLOSE_PAREN);
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        var body = this.parseFunctionBody_(parameters);
        return new ctor(this.getTreeLocation_(start), name, functionKind, parameters, typeAnnotation, annotations, body);
      },
      peekRest_: function(type) {
        return type === DOT_DOT_DOT && this.options_.restParameters;
      },
      parseFormalParameters_: function() {
        var start = this.getTreeStartLocation_();
        var formals = [];
        this.pushAnnotations_();
        var type = peekType();
        if (this.peekRest_(type)) {
          formals.push(this.parseFormalRestParameter_());
        } else {
          if (this.peekFormalParameter_(peekType()))
            formals.push(this.parseFormalParameter_(INITIALIZER_OPTIONAL));
          while (this.eatIf_(COMMA)) {
            this.pushAnnotations_();
            if (this.peekRest_(peekType())) {
              formals.push(this.parseFormalRestParameter_());
              break;
            }
            formals.push(this.parseFormalParameter_(INITIALIZER_OPTIONAL));
          }
        }
        return new FormalParameterList(this.getTreeLocation_(start), formals);
      },
      peekFormalParameter_: function(type) {
        return this.peekBindingElement_(type);
      },
      parseFormalParameter_: function(initializerAllowed) {
        var start = this.getTreeStartLocation_();
        var binding = this.parseBindingElementBinding_();
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        var initializer = this.parseBindingElementInitializer_(initializerAllowed);
        return new FormalParameter(this.getTreeLocation_(start), new BindingElement(this.getTreeLocation_(start), binding, initializer), typeAnnotation, this.popAnnotations_());
      },
      parseFormalRestParameter_: function() {
        var start = this.getTreeStartLocation_();
        var restParameter = this.parseRestParameter_();
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        return new FormalParameter(this.getTreeLocation_(start), restParameter, typeAnnotation, this.popAnnotations_());
      },
      parseRestParameter_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(DOT_DOT_DOT);
        var id = this.parseBindingIdentifier_();
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        return new RestParameter(this.getTreeLocation_(start), id, typeAnnotation);
      },
      parseFunctionBody_: function(params) {
        var start = this.getTreeStartLocation_();
        this.eat_(OPEN_CURLY);
        var strictMode = this.strictMode_;
        var result = this.parseStatementList_(!strictMode);
        validateParameters(params, this.strictMode_, this.errorReporter_);
        this.strictMode_ = strictMode;
        this.eat_(CLOSE_CURLY);
        return new FunctionBody(this.getTreeLocation_(start), result);
      },
      parseSpreadExpression_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(DOT_DOT_DOT);
        var operand = this.parseAssignmentExpression_(ALLOW_IN);
        return new SpreadExpression(this.getTreeLocation_(start), operand);
      },
      parseBlock_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(OPEN_CURLY);
        var result = this.parseStatementList_(false);
        this.eat_(CLOSE_CURLY);
        return new Block(this.getTreeLocation_(start), result);
      },
      parseVariableStatement_: function() {
        var start = this.getTreeStartLocation_();
        var declarations = this.parseVariableDeclarationList_(ALLOW_IN, INITIALIZER_REQUIRED);
        this.checkInitializers_(declarations);
        this.eatPossibleImplicitSemiColon_();
        return new VariableStatement(this.getTreeLocation_(start), declarations);
      },
      parseVariableDeclarationList_: function(allowIn, initializerRequired) {
        var type = peekType();
        switch (type) {
          case CONST:
          case LET:
          case VAR:
            nextToken();
            break;
          default:
            throw Error('unreachable');
        }
        var start = this.getTreeStartLocation_();
        var declarations = [];
        declarations.push(this.parseVariableDeclaration_(type, allowIn, initializerRequired));
        while (this.eatIf_(COMMA)) {
          declarations.push(this.parseVariableDeclaration_(type, allowIn, initializerRequired));
        }
        return new VariableDeclarationList(this.getTreeLocation_(start), type, declarations);
      },
      parseVariableDeclaration_: function(binding, noIn, initializerRequired) {
        var initRequired = initializerRequired !== INITIALIZER_OPTIONAL;
        var start = this.getTreeStartLocation_();
        var lvalue;
        var typeAnnotation;
        if (this.peekPattern_(peekType())) {
          lvalue = this.parseBindingPattern_();
          typeAnnotation = null;
        } else {
          lvalue = this.parseBindingIdentifier_();
          typeAnnotation = this.parseTypeAnnotationOpt_();
        }
        var init = null;
        if (peek(EQUAL)) {
          init = this.parseInitializer_(noIn);
        } else if (lvalue.isPattern() && initRequired) {
          this.reportError_(lvalue.location, 'destructuring must have an initializer');
        }
        return new VariableDeclaration(this.getTreeLocation_(start), lvalue, typeAnnotation, init);
      },
      parseInitializer_: function(allowIn) {
        this.eat_(EQUAL);
        return this.parseAssignmentExpression_(allowIn);
      },
      parseInitializerOpt_: function(allowIn) {
        if (this.eatIf_(EQUAL))
          return this.parseAssignmentExpression_(allowIn);
        return null;
      },
      parseEmptyStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(SEMI_COLON);
        return new EmptyStatement(this.getTreeLocation_(start));
      },
      parseFallThroughStatement_: function() {
        var start = this.getTreeStartLocation_();
        var expression;
        switch (peekType()) {
          case OPEN_CURLY:
            return this.parseUnexpectedToken_(peekToken());
          case FUNCTION:
          case CLASS:
            return this.parseUnexpectedReservedWord_(peekToken());
          case LET:
            {
              var token = peekLookahead(OPEN_SQUARE);
              if (token) {
                return this.parseSyntaxError_("A statement cannot start with 'let ['");
              }
            }
        }
        if (this.options_.asyncFunctions && this.peekPredefinedString_(ASYNC) && peekLookahead(FUNCTION)) {
          var asyncToken = this.eatId_();
          var functionToken = peekTokenNoLineTerminator();
          if (functionToken !== null)
            return this.parseAsyncFunctionDeclaration_(asyncToken);
          expression = new IdentifierExpression(this.getTreeLocation_(start), asyncToken);
        } else {
          expression = this.parseExpression_(ALLOW_IN);
        }
        if (expression.type === IDENTIFIER_EXPRESSION) {
          if (this.eatIf_(COLON)) {
            var nameToken = expression.identifierToken;
            var statement = this.parseStatement_();
            return new LabelledStatement(this.getTreeLocation_(start), nameToken, statement);
          }
        }
        this.eatPossibleImplicitSemiColon_();
        return new ExpressionStatement(this.getTreeLocation_(start), expression);
      },
      parseIfStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(IF);
        this.eat_(OPEN_PAREN);
        var condition = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        var ifClause = this.parseStatement_();
        var elseClause = null;
        if (this.eatIf_(ELSE)) {
          elseClause = this.parseStatement_();
        }
        return new IfStatement(this.getTreeLocation_(start), condition, ifClause, elseClause);
      },
      parseDoWhileStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(DO);
        var body = this.parseStatement_();
        this.eat_(WHILE);
        this.eat_(OPEN_PAREN);
        var condition = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        this.eatPossibleImplicitSemiColon_();
        return new DoWhileStatement(this.getTreeLocation_(start), body, condition);
      },
      parseWhileStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(WHILE);
        this.eat_(OPEN_PAREN);
        var condition = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        var body = this.parseStatement_();
        return new WhileStatement(this.getTreeLocation_(start), condition, body);
      },
      parseForStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(FOR);
        this.eat_(OPEN_PAREN);
        var type = peekType();
        if (this.peekVariableDeclarationList_(type)) {
          var variables = this.parseVariableDeclarationList_(NO_IN, INITIALIZER_OPTIONAL);
          var declarations = variables.declarations;
          if (declarations.length > 1 || containsInitializer(declarations)) {
            return this.parseForStatement2_(start, variables);
          }
          type = peekType();
          if (type === IN) {
            return this.parseForInStatement_(start, variables);
          } else if (this.peekOf_()) {
            return this.parseForOfStatement_(start, variables);
          } else if (this.allowForOn_ && this.peekOn_()) {
            return this.parseForOnStatement_(start, variables);
          } else {
            this.checkInitializers_(variables);
            return this.parseForStatement2_(start, variables);
          }
        }
        if (type === SEMI_COLON) {
          return this.parseForStatement2_(start, null);
        }
        var coverInitializedNameCount = this.coverInitializedNameCount_;
        var initializer = this.parseExpressionAllowPattern_(NO_IN);
        type = peekType();
        if ((type === IN || this.peekOf_() || this.allowForOn_ && this.peekOn_())) {
          initializer = this.transformLeftHandSideExpression_(initializer);
          this.validateAssignmentTarget_(initializer, 'assignment');
          if (this.peekOf_()) {
            return this.parseForOfStatement_(start, initializer);
          } else if (this.allowForOn_ && this.peekOn_()) {
            return this.parseForOnStatement_(start, initializer);
          }
          return this.parseForInStatement_(start, initializer);
        }
        this.ensureNoCoverInitializedNames_(initializer, coverInitializedNameCount);
        return this.parseForStatement2_(start, initializer);
      },
      peekOf_: function() {
        return this.options_.forOf && this.peekPredefinedString_(OF);
      },
      peekOn_: function() {
        return this.options_.forOn && this.peekPredefinedString_(ON);
      },
      parseForOfStatement_: function(start, initializer) {
        this.eatId_();
        var collection = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        var body = this.parseStatement_();
        return new ForOfStatement(this.getTreeLocation_(start), initializer, collection, body);
      },
      parseForOnStatement_: function(start, initializer) {
        this.eatId_();
        var observable = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        var body = this.parseStatement_();
        return new ForOnStatement(this.getTreeLocation_(start), initializer, observable, body);
      },
      checkInitializers_: function(variables) {
        if (this.options_.blockBinding && variables.declarationType === CONST) {
          var type = variables.declarationType;
          for (var i = 0; i < variables.declarations.length; i++) {
            if (!this.checkInitializer_(type, variables.declarations[i])) {
              break;
            }
          }
        }
      },
      checkInitializer_: function(type, declaration) {
        if (this.options_.blockBinding && type === CONST && declaration.initializer === null) {
          this.reportError_(declaration.location, 'const variables must have an initializer');
          return false;
        }
        return true;
      },
      peekVariableDeclarationList_: function(type) {
        switch (type) {
          case VAR:
            return true;
          case CONST:
          case LET:
            return this.options_.blockBinding;
          default:
            return false;
        }
      },
      parseForStatement2_: function(start, initializer) {
        this.eat_(SEMI_COLON);
        var condition = null;
        if (!peek(SEMI_COLON)) {
          condition = this.parseExpression_(ALLOW_IN);
        }
        this.eat_(SEMI_COLON);
        var increment = null;
        if (!peek(CLOSE_PAREN)) {
          increment = this.parseExpression_(ALLOW_IN);
        }
        this.eat_(CLOSE_PAREN);
        var body = this.parseStatement_();
        return new ForStatement(this.getTreeLocation_(start), initializer, condition, increment, body);
      },
      parseForInStatement_: function(start, initializer) {
        this.eat_(IN);
        var collection = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        var body = this.parseStatement_();
        return new ForInStatement(this.getTreeLocation_(start), initializer, collection, body);
      },
      parseContinueStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(CONTINUE);
        var name = null;
        if (!this.peekImplicitSemiColon_()) {
          name = this.eatIdOpt_();
        }
        this.eatPossibleImplicitSemiColon_();
        return new ContinueStatement(this.getTreeLocation_(start), name);
      },
      parseBreakStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(BREAK);
        var name = null;
        if (!this.peekImplicitSemiColon_()) {
          name = this.eatIdOpt_();
        }
        this.eatPossibleImplicitSemiColon_();
        return new BreakStatement(this.getTreeLocation_(start), name);
      },
      parseReturnStatement_: function() {
        var start = this.getTreeStartLocation_();
        var returnToken = this.eat_(RETURN);
        if (this.functionState_.isTopMost()) {
          this.reportError_(returnToken.location, 'Illegal return statement');
        }
        var expression = null;
        if (!this.peekImplicitSemiColon_()) {
          expression = this.parseExpression_(ALLOW_IN);
        }
        this.eatPossibleImplicitSemiColon_();
        return new ReturnStatement(this.getTreeLocation_(start), expression);
      },
      parseYieldExpression_: function(allowIn) {
        var start = this.getTreeStartLocation_();
        this.eat_(YIELD);
        var expression = null;
        var isYieldFor = false;
        var token = peekTokenNoLineTerminator();
        if (token !== null) {
          switch (token.type) {
            case CLOSE_CURLY:
            case CLOSE_PAREN:
            case CLOSE_SQUARE:
            case COLON:
            case COMMA:
            case END_OF_FILE:
            case SEMI_COLON:
              break;
            default:
              isYieldFor = this.eatIf_(STAR);
              expression = this.parseAssignmentExpression_(allowIn);
          }
        }
        return new YieldExpression(this.getTreeLocation_(start), expression, isYieldFor);
      },
      parseWithStatement_: function() {
        var start = this.getTreeStartLocation_();
        var withToken = this.eat_(WITH);
        if (this.strictMode_) {
          this.reportError_(withToken.location, 'Strict mode code may not include a with statement');
        }
        this.eat_(OPEN_PAREN);
        var expression = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        var body = this.parseStatement_();
        return new WithStatement(this.getTreeLocation_(start), expression, body);
      },
      parseSwitchStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(SWITCH);
        this.eat_(OPEN_PAREN);
        var expression = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        this.eat_(OPEN_CURLY);
        var caseClauses = this.parseCaseClauses_();
        this.eat_(CLOSE_CURLY);
        return new SwitchStatement(this.getTreeLocation_(start), expression, caseClauses);
      },
      parseCaseClauses_: function() {
        var foundDefaultClause = false;
        var result = [];
        while (true) {
          var start = this.getTreeStartLocation_();
          switch (peekType()) {
            case CASE:
              {
                nextToken();
                var expression = this.parseExpression_(ALLOW_IN);
                this.eat_(COLON);
                var statements = this.parseCaseStatementsOpt_();
                result.push(new CaseClause(this.getTreeLocation_(start), expression, statements));
                break;
              }
            case DEFAULT:
              {
                var defaultToken = nextToken();
                if (foundDefaultClause) {
                  this.reportError_(defaultToken.location, 'Switch statements may have at most one \'default\' clause');
                } else {
                  foundDefaultClause = true;
                }
                this.eat_(COLON);
                result.push(new DefaultClause(this.getTreeLocation_(start), this.parseCaseStatementsOpt_()));
                break;
              }
            default:
              return result;
          }
        }
      },
      parseCaseStatementsOpt_: function() {
        var result = [];
        var type;
        while (true) {
          switch (type = peekType()) {
            case CASE:
            case DEFAULT:
            case CLOSE_CURLY:
            case END_OF_FILE:
              return result;
          }
          result.push(this.parseStatementListItem_(type));
        }
      },
      parseThrowStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(THROW);
        var value = null;
        if (!this.peekImplicitSemiColon_()) {
          value = this.parseExpression_(ALLOW_IN);
        }
        this.eatPossibleImplicitSemiColon_();
        return new ThrowStatement(this.getTreeLocation_(start), value);
      },
      parseTryStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(TRY);
        var body = this.parseBlock_();
        var catchBlock = null;
        if (peek(CATCH)) {
          catchBlock = this.parseCatch_();
        }
        var finallyBlock = null;
        if (peek(FINALLY)) {
          finallyBlock = this.parseFinallyBlock_();
        }
        if (catchBlock === null && finallyBlock === null) {
          var token = peekToken();
          this.reportError_(token.location, "'catch' or 'finally' expected.");
        }
        return new TryStatement(this.getTreeLocation_(start), body, catchBlock, finallyBlock);
      },
      parseCatch_: function() {
        var start = this.getTreeStartLocation_();
        var catchBlock;
        this.eat_(CATCH);
        this.eat_(OPEN_PAREN);
        var binding;
        if (this.peekPattern_(peekType()))
          binding = this.parseBindingPattern_();
        else
          binding = this.parseBindingIdentifier_();
        this.eat_(CLOSE_PAREN);
        var catchBody = this.parseBlock_();
        catchBlock = new Catch(this.getTreeLocation_(start), binding, catchBody);
        return catchBlock;
      },
      parseFinallyBlock_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(FINALLY);
        var finallyBlock = this.parseBlock_();
        return new Finally(this.getTreeLocation_(start), finallyBlock);
      },
      parseDebuggerStatement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(DEBUGGER);
        this.eatPossibleImplicitSemiColon_();
        return new DebuggerStatement(this.getTreeLocation_(start));
      },
      parsePrimaryExpression_: function() {
        switch (peekType()) {
          case CLASS:
            return this.options_.classes ? this.parseClassExpression_() : this.parseUnexpectedReservedWord_(peekToken());
          case THIS:
            return this.parseThisExpression_();
          case IDENTIFIER:
            {
              var identifier = this.parseIdentifierExpression_();
              if (this.options_.asyncFunctions && identifier.identifierToken.value === ASYNC) {
                var token$__18 = peekTokenNoLineTerminator();
                if (token$__18 && token$__18.type === FUNCTION) {
                  var asyncToken = identifier.identifierToken;
                  return this.parseAsyncFunctionExpression_(asyncToken);
                }
              }
              return identifier;
            }
          case NUMBER:
          case STRING:
          case TRUE:
          case FALSE:
          case NULL:
            return this.parseLiteralExpression_();
          case OPEN_SQUARE:
            return this.parseArrayLiteral_();
          case OPEN_CURLY:
            return this.parseObjectLiteral_();
          case OPEN_PAREN:
            return this.parsePrimaryExpressionStartingWithParen_();
          case SLASH:
          case SLASH_EQUAL:
            return this.parseRegularExpressionLiteral_();
          case NO_SUBSTITUTION_TEMPLATE:
          case TEMPLATE_HEAD:
            if (this.options_.templateLiterals) {
              return this.parseTemplateLiteral_(null);
            }
            break;
          case IMPLEMENTS:
          case INTERFACE:
          case PACKAGE:
          case PRIVATE:
          case PROTECTED:
          case PUBLIC:
          case STATIC:
          case YIELD:
            if (this.strictMode_) {
              this.reportReservedIdentifier_(nextToken());
            }
            return this.parseIdentifierExpression_();
          case END_OF_FILE:
            return this.parseSyntaxError_('Unexpected end of input');
        }
        var token = peekToken();
        if (token.isKeyword()) {
          return this.parseUnexpectedReservedWord_(token);
        }
        return this.parseUnexpectedToken_(token);
      },
      parseSuperExpression_: function(isNew) {
        var start = this.getTreeStartLocation_();
        var fs = this.functionState_;
        while (fs && fs.isArrowFunction()) {
          fs = fs.outer;
        }
        var superToken = this.eat_(SUPER);
        if (!fs || !fs.isMethod()) {
          this.reportError_(superToken.location, 'super is only allowed in methods');
        }
        var operand = new SuperExpression(this.getTreeLocation_(start));
        var type = peekType();
        if (isNew) {
          if (type === OPEN_SQUARE) {
            return this.parseMemberLookupExpression_(start, operand);
          }
          return this.parseMemberExpression_(start, operand);
        }
        switch (type) {
          case OPEN_SQUARE:
            return this.parseMemberLookupExpression_(start, operand);
          case PERIOD:
            return this.parseMemberExpression_(start, operand);
          case OPEN_PAREN:
            {
              var superCall = this.parseCallExpression_(start, operand);
              if (!fs.isDerivedConstructor()) {
                this.reportError_(superToken.location, 'super call is only allowed in derived constructor');
              }
              return superCall;
            }
        }
        return this.parseUnexpectedToken_(peekToken());
      },
      parseThisExpression_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(THIS);
        return new ThisExpression(this.getTreeLocation_(start));
      },
      peekBindingIdentifier_: function(type) {
        return this.peekId_(type);
      },
      parseBindingIdentifier_: function() {
        var start = this.getTreeStartLocation_();
        var identifier = this.eatId_();
        return new BindingIdentifier(this.getTreeLocation_(start), identifier);
      },
      parseIdentifierExpression_: function() {
        var start = this.getTreeStartLocation_();
        var identifier = this.eatId_();
        return new IdentifierExpression(this.getTreeLocation_(start), identifier);
      },
      parseIdentifierNameExpression_: function() {
        var start = this.getTreeStartLocation_();
        var identifier = this.eatIdName_();
        return new IdentifierExpression(this.getTreeLocation_(start), identifier);
      },
      parseLiteralExpression_: function() {
        var start = this.getTreeStartLocation_();
        var literal = this.nextLiteralToken_();
        return new LiteralExpression(this.getTreeLocation_(start), literal);
      },
      nextLiteralToken_: function() {
        return nextToken();
      },
      parseRegularExpressionLiteral_: function() {
        var start = this.getTreeStartLocation_();
        var literal = nextRegularExpressionLiteralToken();
        return new LiteralExpression(this.getTreeLocation_(start), literal);
      },
      peekSpread_: function(type) {
        return type === DOT_DOT_DOT && this.options_.spread;
      },
      parseArrayLiteral_: function() {
        var start = this.getTreeStartLocation_();
        var expression;
        var elements = [];
        this.eat_(OPEN_SQUARE);
        var type = peekType();
        if (type === FOR && this.options_.arrayComprehension)
          return this.parseArrayComprehension_(start);
        while (true) {
          type = peekType();
          if (type === COMMA) {
            expression = null;
          } else if (this.peekSpread_(type)) {
            expression = this.parseSpreadExpression_();
          } else if (type === CLOSE_SQUARE || type === END_OF_FILE) {
            break;
          } else {
            expression = this.parseAssignmentExpression_(ALLOW_IN);
          }
          elements.push(expression);
          type = peekType();
          if (type !== CLOSE_SQUARE)
            this.eat_(COMMA);
        }
        this.eat_(CLOSE_SQUARE);
        return new ArrayLiteralExpression(this.getTreeLocation_(start), elements);
      },
      parseArrayComprehension_: function(start) {
        var list = this.parseComprehensionList_();
        var expression = this.parseAssignmentExpression_(ALLOW_IN);
        this.eat_(CLOSE_SQUARE);
        return new ArrayComprehension(this.getTreeLocation_(start), list, expression);
      },
      parseComprehensionList_: function() {
        var list = [this.parseComprehensionFor_()];
        while (true) {
          var type = peekType();
          switch (type) {
            case FOR:
              list.push(this.parseComprehensionFor_());
              break;
            case IF:
              list.push(this.parseComprehensionIf_());
              break;
            default:
              return list;
          }
        }
      },
      parseComprehensionFor_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(FOR);
        this.eat_(OPEN_PAREN);
        var left = this.parseForBinding_();
        this.eatId_(OF);
        var iterator = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        return new ComprehensionFor(this.getTreeLocation_(start), left, iterator);
      },
      parseComprehensionIf_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(IF);
        this.eat_(OPEN_PAREN);
        var expression = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        return new ComprehensionIf(this.getTreeLocation_(start), expression);
      },
      parseObjectLiteral_: function() {
        var start = this.getTreeStartLocation_();
        var result = [];
        this.eat_(OPEN_CURLY);
        while (this.peekPropertyDefinition_(peekType())) {
          var propertyDefinition = this.parsePropertyDefinition_();
          result.push(propertyDefinition);
          if (!this.eatIf_(COMMA))
            break;
        }
        this.eat_(CLOSE_CURLY);
        return new ObjectLiteralExpression(this.getTreeLocation_(start), result);
      },
      parsePropertyDefinition: function() {
        var fs = this.pushFunctionState_(FUNCTION_STATE_SCRIPT);
        var result = this.parsePropertyDefinition_();
        this.popFunctionState_(fs);
        return result;
      },
      parsePropertyDefinition_: function() {
        var start = this.getTreeStartLocation_();
        var functionKind = null;
        var isStatic = false;
        if (this.options_.generators && this.options_.propertyMethods && peek(STAR)) {
          var fs = this.pushFunctionState_(FUNCTION_STATE_METHOD | FUNCTION_STATE_GENERATOR);
          var m = this.parseGeneratorMethod_(start, isStatic, []);
          this.popFunctionState_(fs);
          return m;
        }
        var token = peekToken();
        var name = this.parsePropertyName_();
        if (this.options_.propertyMethods && peek(OPEN_PAREN)) {
          var fs$__19 = this.pushFunctionState_(FUNCTION_STATE_METHOD);
          var m$__20 = this.parseMethod_(start, isStatic, functionKind, name, []);
          this.popFunctionState_(fs$__19);
          return m$__20;
        }
        if (this.eatIf_(COLON)) {
          var value = this.parseAssignmentExpression_(ALLOW_IN);
          return new PropertyNameAssignment(this.getTreeLocation_(start), name, value);
        }
        var type = peekType();
        if (name.type === LITERAL_PROPERTY_NAME) {
          var nameLiteral = name.literalToken;
          if (nameLiteral.value === GET && this.peekPropertyName_(type)) {
            return this.parseGetAccessor_(start, isStatic, []);
          }
          if (nameLiteral.value === SET && this.peekPropertyName_(type)) {
            return this.parseSetAccessor_(start, isStatic, []);
          }
          if (this.options_.asyncFunctions && nameLiteral.value === ASYNC && (this.peekPropertyName_(type) || this.peekAsyncStar_())) {
            var async = nameLiteral;
            var kind = FUNCTION_STATE_METHOD | FUNCTION_STATE_ASYNC;
            if (this.peekAsyncStar_()) {
              kind |= FUNCTION_STATE_GENERATOR;
              this.eat_(STAR);
              async = new IdentifierToken(async.location, ASYNC_STAR);
            }
            var name$__21 = this.parsePropertyName_();
            var fs$__22 = this.pushFunctionState_(kind);
            var m$__23 = this.parseMethod_(start, isStatic, async, name$__21, []);
            this.popFunctionState_(fs$__22);
            return m$__23;
          }
          if (this.options_.propertyNameShorthand && (nameLiteral.type === IDENTIFIER || nameLiteral.isStrictKeyword() && !this.strictMode_ || nameLiteral.type === YIELD && this.allowYield_)) {
            if (peek(EQUAL)) {
              token = nextToken();
              var coverInitializedNameCount = this.coverInitializedNameCount_;
              var expr = this.parseAssignmentExpression_(ALLOW_IN);
              this.ensureNoCoverInitializedNames_(expr, coverInitializedNameCount);
              this.coverInitializedNameCount_++;
              return new CoverInitializedName(this.getTreeLocation_(start), nameLiteral, token, expr);
            }
            return new PropertyNameShorthand(this.getTreeLocation_(start), nameLiteral);
          }
          if (this.strictMode_ && nameLiteral.isStrictKeyword())
            this.reportReservedIdentifier_(nameLiteral);
        }
        if (name.type === COMPUTED_PROPERTY_NAME)
          token = peekToken();
        return this.parseUnexpectedToken_(token);
      },
      parseClassElement_: function(derivedClass) {
        var start = this.getTreeStartLocation_();
        var annotations = this.parseAnnotations_();
        var type = peekType();
        var isStatic = false,
            functionKind = null;
        switch (type) {
          case STATIC:
            {
              var staticToken = nextToken();
              type = peekType();
              switch (type) {
                case OPEN_PAREN:
                  {
                    var location = this.getTreeLocation_(start);
                    var name = new LiteralPropertyName(location, staticToken);
                    var fs = this.pushFunctionState_(FUNCTION_STATE_METHOD);
                    var m = this.parseMethod_(start, isStatic, functionKind, name, annotations);
                    this.popFunctionState_(fs);
                    return m;
                  }
                default:
                  isStatic = true;
                  if (type === STAR && this.options_.generators)
                    return this.parseGeneratorMethod_(start, true, annotations);
                  return this.parseClassElement2_(start, isStatic, annotations, derivedClass);
              }
              break;
            }
          case STAR:
            return this.parseGeneratorMethod_(start, isStatic, annotations);
          default:
            return this.parseClassElement2_(start, isStatic, annotations, derivedClass);
        }
      },
      parseGeneratorMethod_: function(start, isStatic, annotations) {
        var functionKind = this.eat_(STAR);
        var name = this.parsePropertyName_();
        var fs = this.pushFunctionState_(FUNCTION_STATE_METHOD | FUNCTION_STATE_GENERATOR);
        var m = this.parseMethod_(start, isStatic, functionKind, name, annotations);
        this.popFunctionState_(fs);
        return m;
      },
      parseMethod_: function(start, isStatic, functionKind, name, annotations) {
        this.eat_(OPEN_PAREN);
        var parameterList = this.parseFormalParameters_();
        this.eat_(CLOSE_PAREN);
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        var body = this.parseFunctionBody_(parameterList);
        return new PropertyMethodAssignment(this.getTreeLocation_(start), isStatic, functionKind, name, parameterList, typeAnnotation, annotations, body, null);
      },
      parsePropertyVariableDeclaration_: function(start, isStatic, name, annotations) {
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        var initializer = this.parseInitializerOpt_(ALLOW_IN);
        this.eat_(SEMI_COLON);
        return new PropertyVariableDeclaration(this.getTreeLocation_(start), isStatic, name, typeAnnotation, annotations, initializer);
      },
      parseClassElement2_: function(start, isStatic, annotations, derivedClass) {
        var functionKind = null;
        var name = this.parsePropertyName_();
        var type = peekType();
        if (name.type === LITERAL_PROPERTY_NAME && name.literalToken.value === GET && this.peekPropertyName_(type)) {
          return this.parseGetAccessor_(start, isStatic, annotations);
        }
        if (name.type === LITERAL_PROPERTY_NAME && name.literalToken.value === SET && this.peekPropertyName_(type)) {
          return this.parseSetAccessor_(start, isStatic, annotations);
        }
        if (this.options_.asyncFunctions && name.type === LITERAL_PROPERTY_NAME && name.literalToken.value === ASYNC && (this.peekPropertyName_(type) || this.peekAsyncStar_())) {
          var async = name.literalToken;
          var kind = FUNCTION_STATE_METHOD | FUNCTION_STATE_ASYNC;
          if (this.peekAsyncStar_()) {
            kind |= FUNCTION_STATE_GENERATOR;
            this.eat_(STAR);
            async = new IdentifierToken(async.location, ASYNC_STAR);
          }
          name = this.parsePropertyName_();
          var fs = this.pushFunctionState_(kind);
          var m = this.parseMethod_(start, isStatic, async, name, annotations);
          this.popFunctionState_(fs);
          return m;
        }
        if (!this.options_.memberVariables || type === OPEN_PAREN) {
          var kind$__24 = FUNCTION_STATE_METHOD;
          var isDerivedConstructor = derivedClass && !isStatic && functionKind === null && name.type === LITERAL_PROPERTY_NAME && name.literalToken.value === CONSTRUCTOR;
          if (isDerivedConstructor) {
            kind$__24 |= FUNCTION_STATE_DERIVED_CONSTRUCTOR;
          }
          var fs$__25 = this.pushFunctionState_(kind$__24);
          var m$__26 = this.parseMethod_(start, isStatic, functionKind, name, annotations);
          this.popFunctionState_(fs$__25);
          if (isDerivedConstructor) {
            validateConstructor(m$__26, this.errorReporter_);
          }
          return m$__26;
        }
        return this.parsePropertyVariableDeclaration_(start, isStatic, name, annotations);
      },
      parseGetAccessor_: function(start, isStatic, annotations) {
        var name = this.parsePropertyName_();
        var fs = this.pushFunctionState_(FUNCTION_STATE_METHOD);
        this.eat_(OPEN_PAREN);
        this.eat_(CLOSE_PAREN);
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        var body = this.parseFunctionBody_(null);
        this.popFunctionState_(fs);
        return new GetAccessor(this.getTreeLocation_(start), isStatic, name, typeAnnotation, annotations, body);
      },
      parseSetAccessor_: function(start, isStatic, annotations) {
        var name = this.parsePropertyName_();
        var fs = this.pushFunctionState_(FUNCTION_STATE_METHOD);
        this.eat_(OPEN_PAREN);
        var parameterList = this.parsePropertySetParameterList_();
        this.eat_(CLOSE_PAREN);
        var body = this.parseFunctionBody_(parameterList);
        this.popFunctionState_(fs);
        return new SetAccessor(this.getTreeLocation_(start), isStatic, name, parameterList, annotations, body);
      },
      peekPropertyDefinition_: function(type) {
        return this.peekPropertyName_(type) || type === STAR && this.options_.propertyMethods && this.options_.generators;
      },
      peekPropertyName_: function(type) {
        switch (type) {
          case IDENTIFIER:
          case STRING:
          case NUMBER:
            return true;
          case OPEN_SQUARE:
            return this.options_.computedPropertyNames;
          default:
            return peekToken().isKeyword();
        }
      },
      peekPredefinedString_: function(string) {
        var token = peekToken();
        return token.type === IDENTIFIER && token.value === string;
      },
      parsePropertySetParameterList_: function() {
        var start = this.getTreeStartLocation_();
        var binding;
        this.pushAnnotations_();
        if (this.peekPattern_(peekType()))
          binding = this.parseBindingPattern_();
        else
          binding = this.parseBindingIdentifier_();
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        var parameter = new FormalParameter(this.getTreeLocation_(start), new BindingElement(this.getTreeLocation_(start), binding, null), typeAnnotation, this.popAnnotations_());
        return new FormalParameterList(parameter.location, [parameter]);
      },
      parsePrimaryExpressionStartingWithParen_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(OPEN_PAREN);
        if (peek(FOR) && this.options_.generatorComprehension)
          return this.parseGeneratorComprehension_(start);
        return this.parseCoverFormals_(start);
      },
      parseSyntaxError_: function(message) {
        var token = nextToken();
        this.reportError_(token.location, message);
        return new SyntaxErrorTree(token.location, token, message);
      },
      parseUnexpectedToken_: function(token) {
        if (token.type === NO_SUBSTITUTION_TEMPLATE) {
          return this.parseSyntaxError_('Unexpected token `');
        }
        return this.parseSyntaxError_(("Unexpected token " + token));
      },
      parseUnexpectedReservedWord_: function(token) {
        return this.parseSyntaxError_(("Unexpected reserved word " + token));
      },
      parseExpression_: function(allowIn) {
        var coverInitializedNameCount = this.coverInitializedNameCount_;
        var expression = this.parseExpressionAllowPattern_(allowIn);
        this.ensureNoCoverInitializedNames_(expression, coverInitializedNameCount);
        return expression;
      },
      parseExpression: function() {
        var fs = this.pushFunctionState_(FUNCTION_STATE_LENIENT);
        var expression = this.parseExpression_(ALLOW_IN);
        this.popFunctionState_(fs);
        return expression;
      },
      parseExpressionAllowPattern_: function(allowIn) {
        var start = this.getTreeStartLocation_();
        var expression = this.parseAssignmentExpression_(allowIn);
        if (peek(COMMA)) {
          var expressions = [expression];
          while (this.eatIf_(COMMA)) {
            expressions.push(this.parseAssignmentExpression_(allowIn));
          }
          return new CommaExpression(this.getTreeLocation_(start), expressions);
        }
        return expression;
      },
      parseAssignmentExpression_: function(allowIn) {
        if (this.allowYield_ && peek(YIELD))
          return this.parseYieldExpression_(allowIn);
        var start = this.getTreeStartLocation_();
        var validAsyncParen = false;
        if (this.options_.asyncFunctions && this.peekPredefinedString_(ASYNC)) {
          var asyncToken = peekToken();
          var maybeOpenParenToken = peekTokenLookahead();
          validAsyncParen = maybeOpenParenToken.type === OPEN_PAREN && asyncToken.location.end.line === maybeOpenParenToken.location.start.line;
        }
        var left = this.parseConditional_(allowIn);
        var type = peekType();
        if (this.options_.asyncFunctions && left.type === IDENTIFIER_EXPRESSION && left.identifierToken.value === ASYNC && type === IDENTIFIER) {
          if (peekTokenNoLineTerminator() !== null) {
            var bindingIdentifier = this.parseBindingIdentifier_();
            var asyncToken$__27 = left.identifierToken;
            return this.parseArrowFunction_(start, bindingIdentifier, asyncToken$__27);
          }
        }
        if (type === ARROW && peekTokenNoLineTerminator() !== null) {
          if (left.type === COVER_FORMALS || left.type === IDENTIFIER_EXPRESSION)
            return this.parseArrowFunction_(start, left, null);
          if (validAsyncParen && left.type === CALL_EXPRESSION) {
            var asyncToken$__28 = left.operand.identifierToken;
            return this.parseArrowFunction_(start, left.args, asyncToken$__28);
          }
        }
        left = this.coverFormalsToParenExpression_(left);
        if (this.peekAssignmentOperator_(type)) {
          if (type === EQUAL)
            left = this.transformLeftHandSideExpression_(left);
          this.validateAssignmentTarget_(left, 'assignment');
          var operator = nextToken();
          var right = this.parseAssignmentExpression_(allowIn);
          return new BinaryExpression(this.getTreeLocation_(start), left, operator, right);
        }
        return left;
      },
      transformLeftHandSideExpression_: function(tree) {
        switch (tree.type) {
          case ARRAY_LITERAL_EXPRESSION:
          case OBJECT_LITERAL_EXPRESSION:
            resetScanner(tree.location.start.offset);
            return this.parseAssignmentPattern_();
        }
        return tree;
      },
      peekAssignmentOperator_: function(type) {
        return isAssignmentOperator(type);
      },
      parseConditional_: function(allowIn) {
        var start = this.getTreeStartLocation_();
        var condition = this.parseBinaryExpression_(allowIn);
        if (this.eatIf_(QUESTION)) {
          condition = this.toPrimaryExpression_(condition);
          var left = this.parseAssignmentExpression_(ALLOW_IN);
          this.eat_(COLON);
          var right = this.parseAssignmentExpression_(allowIn);
          return new ConditionalExpression(this.getTreeLocation_(start), condition, left, right);
        }
        return condition;
      },
      getPrecedence_: function(type, allowIn) {
        switch (type) {
          case OR:
            return 1;
          case AND:
            return 2;
          case BAR:
            return 3;
          case CARET:
            return 4;
          case AMPERSAND:
            return 5;
          case EQUAL_EQUAL:
          case EQUAL_EQUAL_EQUAL:
          case NOT_EQUAL:
          case NOT_EQUAL_EQUAL:
            return 6;
          case CLOSE_ANGLE:
          case GREATER_EQUAL:
          case INSTANCEOF:
          case LESS_EQUAL:
          case OPEN_ANGLE:
            return 7;
          case IN:
            return allowIn ? 7 : 0;
          case LEFT_SHIFT:
          case RIGHT_SHIFT:
          case UNSIGNED_RIGHT_SHIFT:
            return 8;
          case MINUS:
          case PLUS:
            return 9;
          case SLASH:
          case STAR:
          case PERCENT:
            return 10;
          case STAR_STAR:
            return this.options_.exponentiation ? 11 : 0;
          default:
            return 0;
        }
      },
      parseBinaryExpression_: function(allowIn) {
        var start = this.getTreeStartLocation_();
        var left = this.parseUnaryExpression_();
        return this.parseBinaryExpressionHelper_(start, left, -1, allowIn);
      },
      parseBinaryExpressionHelper_: function(start, left, minPrec, allowIn) {
        var type = peekType();
        var prec = this.getPrecedence_(type, allowIn);
        if (prec === 0) {
          return left;
        }
        var leftToRight = type !== STAR_STAR;
        if (leftToRight ? prec > minPrec : prec >= minPrec) {
          var token = nextToken();
          var rightStart = this.getTreeStartLocation_();
          var rightUnary = this.parseUnaryExpression_();
          var right = this.parseBinaryExpressionHelper_(rightStart, rightUnary, prec, allowIn);
          left = this.toPrimaryExpression_(left);
          right = this.toPrimaryExpression_(right);
          var node = new BinaryExpression(this.getTreeLocation_(start), left, token, right);
          return this.parseBinaryExpressionHelper_(start, node, minPrec, allowIn);
        }
        return left;
      },
      parseUnaryExpression_: function() {
        var start = this.getTreeStartLocation_();
        if (this.allowAwait_ && this.peekPredefinedString_(AWAIT)) {
          this.eatId_();
          var operand;
          if (this.allowYield_ && peek(YIELD)) {
            operand = this.parseYieldExpression_(ALLOW_IN);
          } else {
            operand = this.parseUnaryExpression_();
            operand = this.toPrimaryExpression_(operand);
          }
          return new AwaitExpression(this.getTreeLocation_(start), operand);
        }
        if (this.peekUnaryOperator_(peekType())) {
          var operator = nextToken();
          var operand$__29 = this.parseUnaryExpression_();
          operand$__29 = this.toPrimaryExpression_(operand$__29);
          if (operand$__29.type !== SYNTAX_ERROR_TREE) {
            switch (operator.type) {
              case PLUS_PLUS:
              case MINUS_MINUS:
                this.validateAssignmentTarget_(operand$__29, 'prefix operation');
            }
          }
          return new UnaryExpression(this.getTreeLocation_(start), operator, operand$__29);
        }
        return this.parsePostfixExpression_();
      },
      peekUnaryOperator_: function(type) {
        switch (type) {
          case DELETE:
          case VOID:
          case TYPEOF:
          case PLUS_PLUS:
          case MINUS_MINUS:
          case PLUS:
          case MINUS:
          case TILDE:
          case BANG:
            return true;
          default:
            return false;
        }
      },
      parsePostfixExpression_: function() {
        var start = this.getTreeStartLocation_();
        var operand = this.parseLeftHandSideExpression_();
        while (this.peekPostfixOperator_(peekType())) {
          operand = this.toPrimaryExpression_(operand);
          var operator = nextToken();
          this.validateAssignmentTarget_(operand, 'postfix operation');
          operand = new PostfixExpression(this.getTreeLocation_(start), operand, operator);
        }
        return operand;
      },
      peekPostfixOperator_: function(type) {
        switch (type) {
          case PLUS_PLUS:
          case MINUS_MINUS:
            {
              var token = peekTokenNoLineTerminator();
              return token !== null;
            }
        }
        return false;
      },
      parseLeftHandSideExpression_: function() {
        var start = this.getTreeStartLocation_();
        var operand = this.parseNewExpression_();
        if (!(operand instanceof NewExpression) || operand.args !== null) {
          loop: while (true) {
            switch (peekType()) {
              case OPEN_PAREN:
                operand = this.toPrimaryExpression_(operand);
                operand = this.parseCallExpression_(start, operand);
                break;
              case OPEN_SQUARE:
                operand = this.toPrimaryExpression_(operand);
                operand = this.parseMemberLookupExpression_(start, operand);
                break;
              case PERIOD:
                operand = this.toPrimaryExpression_(operand);
                operand = this.parseMemberExpression_(start, operand);
                break;
              case NO_SUBSTITUTION_TEMPLATE:
              case TEMPLATE_HEAD:
                if (!this.options_.templateLiterals)
                  break loop;
                operand = this.toPrimaryExpression_(operand);
                if (this.options_.templateLiterals) {
                  operand = this.parseTemplateLiteral_(operand);
                }
                break;
              default:
                break loop;
            }
          }
        }
        return operand;
      },
      parseMemberExpressionNoNew_: function() {
        var start = this.getTreeStartLocation_();
        var operand;
        if (peekType() === FUNCTION) {
          operand = this.parseFunctionExpression_();
        } else {
          operand = this.parsePrimaryExpression_();
        }
        loop: while (true) {
          switch (peekType()) {
            case OPEN_SQUARE:
              operand = this.toPrimaryExpression_(operand);
              operand = this.parseMemberLookupExpression_(start, operand);
              break;
            case PERIOD:
              operand = this.toPrimaryExpression_(operand);
              operand = this.parseMemberExpression_(start, operand);
              break;
            case NO_SUBSTITUTION_TEMPLATE:
            case TEMPLATE_HEAD:
              if (!this.options_.templateLiterals)
                break loop;
              operand = this.toPrimaryExpression_(operand);
              operand = this.parseTemplateLiteral_(operand);
              break;
            default:
              break loop;
          }
        }
        return operand;
      },
      parseMemberExpression_: function(start, operand) {
        this.eat_(PERIOD);
        var name = this.eatIdName_();
        return new MemberExpression(this.getTreeLocation_(start), operand, name);
      },
      parseMemberLookupExpression_: function(start, operand) {
        this.eat_(OPEN_SQUARE);
        var member = this.parseExpression_(ALLOW_IN);
        this.eat_(CLOSE_SQUARE);
        return new MemberLookupExpression(this.getTreeLocation_(start), operand, member);
      },
      parseCallExpression_: function(start, operand) {
        var args = this.parseArguments_();
        return new CallExpression(this.getTreeLocation_(start), operand, args);
      },
      parseNewExpression_: function() {
        var operand,
            start;
        switch (peekType()) {
          case NEW:
            {
              start = this.getTreeStartLocation_();
              this.eat_(NEW);
              if (peek(SUPER)) {
                operand = this.parseSuperExpression_(true);
              } else {
                operand = this.toPrimaryExpression_(this.parseNewExpression_());
              }
              var args = null;
              if (peek(OPEN_PAREN)) {
                args = this.parseArguments_();
              }
              return new NewExpression(this.getTreeLocation_(start), operand, args);
            }
          case SUPER:
            return this.parseSuperExpression_(false);
          default:
            return this.parseMemberExpressionNoNew_();
        }
      },
      parseArguments_: function() {
        var start = this.getTreeStartLocation_();
        var args = [];
        this.eat_(OPEN_PAREN);
        if (!peek(CLOSE_PAREN)) {
          args.push(this.parseArgument_());
          while (this.eatIf_(COMMA)) {
            args.push(this.parseArgument_());
          }
        }
        this.eat_(CLOSE_PAREN);
        return new ArgumentList(this.getTreeLocation_(start), args);
      },
      parseArgument_: function() {
        if (this.peekSpread_(peekType()))
          return this.parseSpreadExpression_();
        return this.parseAssignmentExpression_(ALLOW_IN);
      },
      parseArrowFunction_: function(start, tree, asyncToken) {
        var $__15 = this;
        var formals;
        var kind = FUNCTION_STATE_ARROW;
        if (asyncToken && asyncToken.value === ASYNC) {
          kind |= FUNCTION_STATE_ASYNC;
        }
        var fs = this.pushFunctionState_(kind);
        var makeFormals = function(tree) {
          return new FormalParameterList($__15.getTreeLocation_(start), [new FormalParameter(tree.location, new BindingElement(tree.location, tree, null), null, [])]);
        };
        switch (tree.type) {
          case IDENTIFIER_EXPRESSION:
            formals = makeFormals(new BindingIdentifier(tree.location, tree.identifierToken));
            break;
          case BINDING_IDENTIFIER:
            formals = makeFormals(tree);
            break;
          case FORMAL_PARAMETER_LIST:
            formals = tree;
            break;
          default:
            formals = this.toFormalParameters_(start, tree, asyncToken);
        }
        this.eat_(ARROW);
        var body = this.parseConciseBody_(formals);
        this.popFunctionState_(fs);
        return new ArrowFunctionExpression(this.getTreeLocation_(start), asyncToken, formals, body);
      },
      parseCoverFormals_: function(start) {
        var expressions = [];
        if (!peek(CLOSE_PAREN)) {
          do {
            var type = peekType();
            if (this.peekRest_(type)) {
              expressions.push(this.parseRestParameter_());
              break;
            } else {
              expressions.push(this.parseAssignmentExpression_(ALLOW_IN));
            }
            if (this.eatIf_(COMMA))
              continue;
          } while (!peek(CLOSE_PAREN) && !isAtEnd());
        }
        this.eat_(CLOSE_PAREN);
        return new CoverFormals(this.getTreeLocation_(start), expressions);
      },
      ensureNoCoverInitializedNames_: function(tree, coverInitializedNameCount) {
        if (coverInitializedNameCount === this.coverInitializedNameCount_)
          return;
        var finder = new ValidateObjectLiteral();
        finder.visitAny(tree);
        if (finder.found) {
          var token = finder.errorToken;
          this.reportError_(token.location, ("Unexpected token " + token));
        }
      },
      toPrimaryExpression_: function(tree) {
        if (tree.type === COVER_FORMALS)
          return this.coverFormalsToParenExpression_(tree);
        return tree;
      },
      validateCoverFormalsAsParenExpression_: function(tree) {
        for (var i = 0; i < tree.expressions.length; i++) {
          if (tree.expressions[i].type === REST_PARAMETER) {
            var token = new Token(DOT_DOT_DOT, tree.expressions[i].location);
            this.reportError_(token.location, ("Unexpected token " + token));
            return;
          }
        }
      },
      coverFormalsToParenExpression_: function(tree) {
        if (tree.type === COVER_FORMALS) {
          var expressions = tree.expressions;
          if (expressions.length === 0) {
            var message = 'Unexpected token )';
            this.reportError_(tree.location, message);
          } else {
            this.validateCoverFormalsAsParenExpression_(tree);
            var expression;
            if (expressions.length > 1)
              expression = new CommaExpression(expressions[0].location, expressions);
            else
              expression = expressions[0];
            return new ParenExpression(tree.location, expression);
          }
        }
        return tree;
      },
      toFormalParameters_: function(start, tree, asyncToken) {
        resetScanner(start.offset);
        return this.parseArrowFormalParameters_(asyncToken);
      },
      parseArrowFormalParameters_: function(asyncToken) {
        if (asyncToken)
          this.eat_(IDENTIFIER);
        this.eat_(OPEN_PAREN);
        var parameters = this.parseFormalParameters_();
        this.eat_(CLOSE_PAREN);
        return parameters;
      },
      peekArrow_: function(type) {
        return type === ARROW && this.options_.arrowFunctions;
      },
      parseConciseBody_: function(params) {
        if (peek(OPEN_CURLY))
          return this.parseFunctionBody_(params);
        validateParameters(params, this.strictMode_, this.errorReporter_);
        return this.parseAssignmentExpression_(ALLOW_IN);
      },
      parseGeneratorComprehension_: function(start) {
        var comprehensionList = this.parseComprehensionList_();
        var expression = this.parseAssignmentExpression_(ALLOW_IN);
        this.eat_(CLOSE_PAREN);
        return new GeneratorComprehension(this.getTreeLocation_(start), comprehensionList, expression);
      },
      parseForBinding_: function() {
        if (this.peekPattern_(peekType()))
          return this.parseBindingPattern_();
        return this.parseBindingIdentifier_();
      },
      peekPattern_: function(type) {
        return this.options_.destructuring && (this.peekObjectPattern_(type) || this.peekArrayPattern_(type));
      },
      peekArrayPattern_: function(type) {
        return type === OPEN_SQUARE;
      },
      peekObjectPattern_: function(type) {
        return type === OPEN_CURLY;
      },
      parseBindingPattern_: function() {
        return this.parsePattern_(true);
      },
      parsePattern_: function(useBinding) {
        if (this.peekArrayPattern_(peekType()))
          return this.parseArrayPattern_(useBinding);
        return this.parseObjectPattern_(useBinding);
      },
      parseArrayBindingPattern_: function() {
        return this.parseArrayPattern_(true);
      },
      parsePatternElement_: function(useBinding) {
        return useBinding ? this.parseBindingElement_() : this.parseAssignmentElement_();
      },
      parsePatternRestElement_: function(useBinding) {
        return useBinding ? this.parseBindingRestElement_() : this.parseAssignmentRestElement_();
      },
      parseArrayPattern_: function(useBinding) {
        var start = this.getTreeStartLocation_();
        var elements = [];
        this.eat_(OPEN_SQUARE);
        while (true) {
          var type = peekType();
          if (type === COMMA) {
            elements.push(null);
          } else if (this.peekSpread_(type)) {
            elements.push(this.parsePatternRestElement_(useBinding));
            break;
          } else if (type === CLOSE_SQUARE || type === END_OF_FILE) {
            break;
          } else {
            elements.push(this.parsePatternElement_(useBinding));
          }
          type = peekType();
          if (type !== CLOSE_SQUARE) {
            this.eat_(COMMA);
          }
        }
        this.eat_(CLOSE_SQUARE);
        return new ArrayPattern(this.getTreeLocation_(start), elements);
      },
      parseBindingElementList_: function(elements) {
        this.parseElisionOpt_(elements);
        elements.push(this.parseBindingElement_());
        while (this.eatIf_(COMMA)) {
          this.parseElisionOpt_(elements);
          elements.push(this.parseBindingElement_());
        }
      },
      parseElisionOpt_: function(elements) {
        while (this.eatIf_(COMMA)) {
          elements.push(null);
        }
      },
      peekBindingElement_: function(type) {
        return this.peekBindingIdentifier_(type) || this.peekPattern_(type);
      },
      parseBindingElement_: function() {
        var start = this.getTreeStartLocation_();
        var binding = this.parseBindingElementBinding_();
        var initializer = this.parseBindingElementInitializer_(INITIALIZER_OPTIONAL);
        return new BindingElement(this.getTreeLocation_(start), binding, initializer);
      },
      parseBindingElementBinding_: function() {
        if (this.peekPattern_(peekType()))
          return this.parseBindingPattern_();
        return this.parseBindingIdentifier_();
      },
      parseBindingElementInitializer_: function(initializerRequired) {
        if (peek(EQUAL) || initializerRequired) {
          return this.parseInitializer_(ALLOW_IN);
        }
        return null;
      },
      parseBindingRestElement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(DOT_DOT_DOT);
        var identifier = this.parseBindingIdentifier_();
        return new SpreadPatternElement(this.getTreeLocation_(start), identifier);
      },
      parseObjectPattern_: function(useBinding) {
        var start = this.getTreeStartLocation_();
        var elements = [];
        this.eat_(OPEN_CURLY);
        var type;
        while ((type = peekType()) !== CLOSE_CURLY && type !== END_OF_FILE) {
          elements.push(this.parsePatternProperty_(useBinding));
          if (!this.eatIf_(COMMA))
            break;
        }
        this.eat_(CLOSE_CURLY);
        return new ObjectPattern(this.getTreeLocation_(start), elements);
      },
      parsePatternProperty_: function(useBinding) {
        var start = this.getTreeStartLocation_();
        var name = this.parsePropertyName_();
        var requireColon = name.type !== LITERAL_PROPERTY_NAME || !name.literalToken.isStrictKeyword() && name.literalToken.type !== IDENTIFIER;
        if (requireColon || peek(COLON)) {
          this.eat_(COLON);
          var element = this.parsePatternElement_(useBinding);
          return new ObjectPatternField(this.getTreeLocation_(start), name, element);
        }
        var token = name.literalToken;
        if (this.strictMode_ && token.isStrictKeyword())
          this.reportReservedIdentifier_(token);
        if (useBinding) {
          var binding = new BindingIdentifier(name.location, token);
          var initializer$__30 = this.parseInitializerOpt_(ALLOW_IN);
          return new BindingElement(this.getTreeLocation_(start), binding, initializer$__30);
        }
        var assignment = new IdentifierExpression(name.location, token);
        var initializer = this.parseInitializerOpt_(ALLOW_IN);
        return new AssignmentElement(this.getTreeLocation_(start), assignment, initializer);
      },
      parseAssignmentPattern_: function() {
        return this.parsePattern_(false);
      },
      parseArrayAssignmentPattern_: function() {
        return this.parseArrayPattern_(false);
      },
      parseAssignmentElement_: function() {
        var start = this.getTreeStartLocation_();
        var assignment = this.parseDestructuringAssignmentTarget_();
        var initializer = this.parseInitializerOpt_(ALLOW_IN);
        return new AssignmentElement(this.getTreeLocation_(start), assignment, initializer);
      },
      parseDestructuringAssignmentTarget_: function() {
        switch (peekType()) {
          case OPEN_SQUARE:
            return this.parseArrayAssignmentPattern_();
          case OPEN_CURLY:
            return this.parseObjectAssignmentPattern_();
        }
        var expression = this.parseLeftHandSideExpression_();
        expression = this.coverFormalsToParenExpression_(expression);
        this.validateAssignmentTarget_(expression, 'assignment');
        return expression;
      },
      parseAssignmentRestElement_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(DOT_DOT_DOT);
        var id = this.parseDestructuringAssignmentTarget_();
        return new SpreadPatternElement(this.getTreeLocation_(start), id);
      },
      parseObjectAssignmentPattern_: function() {
        return this.parseObjectPattern_(false);
      },
      parseAssignmentProperty_: function() {
        return this.parsePatternProperty_(false);
      },
      parseTemplateLiteral_: function(operand) {
        var start = operand ? operand.location.start : this.getTreeStartLocation_();
        var token = nextToken();
        var elements = [new TemplateLiteralPortion(token.location, token)];
        if (token.type === NO_SUBSTITUTION_TEMPLATE) {
          return new TemplateLiteralExpression(this.getTreeLocation_(start), operand, elements);
        }
        var expression = this.parseExpression_(ALLOW_IN);
        elements.push(new TemplateSubstitution(expression.location, expression));
        while (expression.type !== SYNTAX_ERROR_TREE) {
          token = nextTemplateLiteralToken();
          if (token.type === ERROR || token.type === END_OF_FILE)
            break;
          elements.push(new TemplateLiteralPortion(token.location, token));
          if (token.type === TEMPLATE_TAIL)
            break;
          expression = this.parseExpression_(ALLOW_IN);
          elements.push(new TemplateSubstitution(expression.location, expression));
        }
        return new TemplateLiteralExpression(this.getTreeLocation_(start), operand, elements);
      },
      parseTypeAnnotationOpt_: function() {
        if (this.options_.types && this.eatOpt_(COLON)) {
          return this.parseType_();
        }
        return null;
      },
      parseType_: function() {
        switch (peekType()) {
          case NEW:
            return this.parseConstructorType_();
          case OPEN_PAREN:
          case OPEN_ANGLE:
            return this.parseFunctionType_();
        }
        var start = this.getTreeStartLocation_();
        var elementType = this.parsePrimaryType_();
        return this.parseUnionTypeSuffix_(start, elementType);
      },
      parsePrimaryType_: function() {
        var start = this.getTreeStartLocation_();
        var elementType,
            token;
        switch (peekType()) {
          case VOID:
            token = nextToken();
            elementType = new PredefinedType(this.getTreeLocation_(start), token);
            break;
          case IDENTIFIER:
            switch (peekToken().value) {
              case 'any':
              case 'boolean':
              case 'number':
              case 'string':
              case 'symbol':
                token = nextToken();
                elementType = new PredefinedType(this.getTreeLocation_(start), token);
                break;
              default:
                elementType = this.parseTypeReference_();
            }
            break;
          case TYPEOF:
            elementType = this.parseTypeQuery_(start);
            break;
          case OPEN_CURLY:
            elementType = this.parseObjectType_();
            break;
          default:
            return this.parseUnexpectedToken_(peekToken());
        }
        return this.parseArrayTypeSuffix_(start, elementType);
      },
      parseTypeReference_: function() {
        var start = this.getTreeStartLocation_();
        var typeName = this.parseTypeName_();
        var args = null;
        if (peek(OPEN_ANGLE)) {
          var args$__31 = this.parseTypeArguments_();
          return new TypeReference(this.getTreeLocation_(start), typeName, args$__31);
        }
        return typeName;
      },
      parseUnionTypeSuffix_: function(start, elementType) {
        if (peek(BAR)) {
          var types = [elementType];
          this.eat_(BAR);
          while (true) {
            types.push(this.parsePrimaryType_());
            if (!this.eatIf_(BAR)) {
              break;
            }
          }
          return new UnionType(this.getTreeLocation_(start), types);
        }
        return elementType;
      },
      parseArrayTypeSuffix_: function(start, elementType) {
        var token = peekTokenNoLineTerminator();
        if (token && token.type === OPEN_SQUARE) {
          this.eat_(OPEN_SQUARE);
          this.eat_(CLOSE_SQUARE);
          elementType = new ArrayType(this.getTreeLocation_(start), elementType);
          return this.parseArrayTypeSuffix_(start, elementType);
        }
        return elementType;
      },
      parseTypeArguments_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(OPEN_ANGLE);
        var args = [this.parseType_()];
        while (peek(COMMA)) {
          this.eat_(COMMA);
          args.push(this.parseType_());
        }
        var token = nextCloseAngle();
        if (token.type !== CLOSE_ANGLE) {
          return this.parseUnexpectedToken_(token);
        }
        return new TypeArguments(this.getTreeLocation_(start), args);
      },
      parseConstructorType_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(NEW);
        var typeParameters = this.parseTypeParametersOpt_();
        this.eat_(OPEN_PAREN);
        var parameterList = this.parseFormalParameters_();
        this.eat_(CLOSE_PAREN);
        this.eat_(ARROW);
        var returnType = this.parseType_();
        return new ConstructorType(this.getTreeLocation_(start), typeParameters, parameterList, returnType);
      },
      parseObjectType_: function() {
        var start = this.getTreeStartLocation_();
        var typeMembers = [];
        this.eat_(OPEN_CURLY);
        var type;
        while (this.peekTypeMember_(type = peekType())) {
          typeMembers.push(this.parseTypeMember_(type));
          if (!this.eatIf_(SEMI_COLON)) {
            break;
          }
        }
        this.eat_(CLOSE_CURLY);
        return new ObjectType(this.getTreeLocation_(start), typeMembers);
      },
      peekTypeMember_: function(type) {
        switch (type) {
          case NEW:
          case OPEN_PAREN:
          case OPEN_ANGLE:
          case OPEN_SQUARE:
          case IDENTIFIER:
          case STRING:
          case NUMBER:
            return true;
          default:
            return peekToken().isKeyword();
        }
      },
      parseTypeMember_: function(type) {
        switch (type) {
          case NEW:
            return this.parseConstructSignature_();
          case OPEN_PAREN:
          case OPEN_ANGLE:
            return this.parseCallSignature_();
          case OPEN_SQUARE:
            return this.parseIndexSignature_();
        }
        var start = this.getTreeStartLocation_();
        var propertyName = this.parseLiteralPropertyName_();
        var isOpt = this.eatIf_(QUESTION);
        type = peekType();
        if (type === OPEN_ANGLE || type === OPEN_PAREN) {
          var callSignature = this.parseCallSignature_();
          return new MethodSignature(this.getTreeLocation_(start), propertyName, isOpt, callSignature);
        }
        var typeAnnotation = this.parseTypeAnnotationOpt_();
        return new PropertySignature(this.getTreeLocation_(start), propertyName, isOpt, typeAnnotation);
      },
      parseCallSignature_: function() {
        var start = this.getTreeStartLocation_();
        var typeParameters = this.parseTypeParametersOpt_();
        this.eat_(OPEN_PAREN);
        var parameterList = this.parseFormalParameters_();
        this.eat_(CLOSE_PAREN);
        var returnType = this.parseTypeAnnotationOpt_();
        return new CallSignature(this.getTreeLocation_(start), typeParameters, parameterList, returnType);
      },
      parseConstructSignature_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(NEW);
        var typeParameters = this.parseTypeParametersOpt_();
        this.eat_(OPEN_PAREN);
        var parameterList = this.parseFormalParameters_();
        this.eat_(CLOSE_PAREN);
        var returnType = this.parseTypeAnnotationOpt_();
        return new ConstructSignature(this.getTreeLocation_(start), typeParameters, parameterList, returnType);
      },
      parseIndexSignature_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(OPEN_SQUARE);
        var id = this.eatId_();
        this.eat_(COLON);
        var typeName;
        var typeStart = this.getTreeStartLocation_();
        if (this.peekPredefinedString_('string')) {
          typeName = this.eatId_('string');
        } else {
          typeName = this.eatId_('number');
        }
        var indexType = new PredefinedType(this.getTreeLocation_(typeStart), typeName);
        this.eat_(CLOSE_SQUARE);
        this.eat_(COLON);
        var typeAnnotation = this.parseType_();
        return new IndexSignature(this.getTreeLocation_(start), id, indexType, typeAnnotation);
      },
      parseFunctionType_: function() {
        var start = this.getTreeStartLocation_();
        var typeParameters = this.parseTypeParametersOpt_();
        this.eat_(OPEN_PAREN);
        var parameterList = this.parseFormalParameters_();
        this.eat_(CLOSE_PAREN);
        this.eat_(ARROW);
        var returnType = this.parseType_();
        return new FunctionType(this.getTreeLocation_(start), typeParameters, parameterList, returnType);
      },
      parseTypeQuery_: function(start) {
        throw 'NYI';
      },
      peekTypeParameters_: function() {
        return peek(OPEN_ANGLE);
      },
      parseTypeParametersOpt_: function() {
        if (peek(OPEN_ANGLE)) {
          return this.parseTypeParameters_();
        }
        return null;
      },
      parseTypeParameters_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(OPEN_ANGLE);
        var parameters = [this.parseTypeParameter_()];
        while (peek(COMMA)) {
          this.eat_(COMMA);
          parameters.push(this.parseTypeParameter_());
        }
        this.eat_(CLOSE_ANGLE);
        return new TypeParameters(this.getTreeLocation_(start), parameters);
      },
      parseTypeParameter_: function() {
        var start = this.getTreeStartLocation_();
        var id = this.eatId_();
        var extendsType = null;
        if (this.eatIf_(EXTENDS)) {
          extendsType = this.parseType_();
        }
        return new TypeParameter(this.getTreeLocation_(start), id, extendsType);
      },
      parseNamedOrPredefinedType_: function() {
        var start = this.getTreeStartLocation_();
        switch (peekToken().value) {
          case 'any':
          case 'number':
          case 'boolean':
          case 'string':
            {
              var token = nextToken();
              return new PredefinedType(this.getTreeLocation_(start), token);
            }
          default:
            return this.parseTypeName_();
        }
      },
      parseTypeName_: function() {
        var start = this.getTreeStartLocation_();
        var id = this.eatId_();
        var typeName = new TypeName(this.getTreeLocation_(start), null, id);
        while (this.eatIf_(PERIOD)) {
          var memberName = this.eatIdName_();
          typeName = new TypeName(this.getTreeLocation_(start), typeName, memberName);
        }
        return typeName;
      },
      parseInterfaceDeclaration_: function() {
        var start = this.getTreeStartLocation_();
        this.eat_(INTERFACE);
        var name = this.eatId_();
        var typeParameters = this.parseTypeParametersOpt_();
        var extendsClause;
        if (this.eatIf_(EXTENDS)) {
          extendsClause = this.parseInterfaceExtendsClause_();
        } else {
          extendsClause = [];
        }
        var objectType = this.parseObjectType_();
        return new InterfaceDeclaration(this.getTreeLocation_(start), name, typeParameters, extendsClause, objectType);
      },
      parseInterfaceExtendsClause_: function() {
        var result = [this.parseTypeReference_()];
        while (this.eatIf_(COMMA)) {
          result.push(this.parseTypeReference_());
        }
        return result;
      },
      parseAnnotatedDeclarations_: function(parsingModuleItem) {
        this.pushAnnotations_();
        var declaration;
        var type = peekType();
        if (parsingModuleItem) {
          declaration = this.parseModuleItem_(type);
        } else {
          declaration = this.parseStatementListItem_(type);
        }
        if (this.annotations_.length > 0) {
          this.reportError_(this.annotations_[0].location, 'Unsupported annotated expression');
        }
        return declaration;
      },
      parseAnnotations_: function() {
        var annotations = [];
        while (this.eatIf_(AT)) {
          annotations.push(this.parseAnnotation_());
        }
        return annotations;
      },
      pushAnnotations_: function() {
        this.annotations_ = this.parseAnnotations_();
      },
      popAnnotations_: function() {
        var annotations = this.annotations_;
        this.annotations_ = [];
        return annotations;
      },
      parseAnnotation_: function() {
        var start = this.getTreeStartLocation_();
        var expression = this.parseMemberExpressionNoNew_();
        var args = null;
        if (peek(OPEN_PAREN))
          args = this.parseArguments_();
        return new Annotation(this.getTreeLocation_(start), expression, args);
      },
      eatPossibleImplicitSemiColon_: function() {
        var token = peekTokenNoLineTerminator();
        if (!token)
          return;
        switch (token.type) {
          case SEMI_COLON:
            nextToken();
            return;
          case END_OF_FILE:
          case CLOSE_CURLY:
            return;
        }
        this.reportError_(token.location, 'Semi-colon expected');
      },
      peekImplicitSemiColon_: function() {
        switch (peekType()) {
          case SEMI_COLON:
          case CLOSE_CURLY:
          case END_OF_FILE:
            return true;
        }
        var token = peekTokenNoLineTerminator();
        return token === null;
      },
      eatOpt_: function(expectedTokenType) {
        if (peek(expectedTokenType))
          return nextToken();
        return null;
      },
      eatIdOpt_: function() {
        return peek(IDENTIFIER) ? this.eatId_() : null;
      },
      eatId_: function() {
        var expected = arguments[0];
        var token = nextToken();
        if (!token) {
          if (expected) {
            this.reportError_(peekLocation(), ("expected '" + expected + "'"));
          }
          return null;
        }
        if (token.type === IDENTIFIER) {
          if (expected && token.value !== expected)
            this.reportExpectedError_(token, expected);
          return token;
        }
        if (token.isStrictKeyword()) {
          if (this.strictMode_) {
            this.reportReservedIdentifier_(token);
          } else {
            return new IdentifierToken(token.location, token.type);
          }
        } else {
          this.reportExpectedError_(token, expected || 'identifier');
        }
        return token;
      },
      eatIdName_: function() {
        var t = nextToken();
        if (t.type !== IDENTIFIER) {
          if (!t.isKeyword()) {
            this.reportExpectedError_(t, 'identifier');
            return null;
          }
          return new IdentifierToken(t.location, t.type);
        }
        return t;
      },
      eat_: function(expectedTokenType) {
        var token = nextToken();
        if (token.type !== expectedTokenType) {
          this.reportExpectedError_(token, expectedTokenType);
          return null;
        }
        return token;
      },
      eatIf_: function(expectedTokenType) {
        if (peek(expectedTokenType)) {
          nextToken();
          return true;
        }
        return false;
      },
      reportExpectedError_: function(token, expected) {
        this.reportError_(token.location, ("Unexpected token " + token));
      },
      getTreeStartLocation_: function() {
        return peekLocation().start;
      },
      getTreeEndLocation_: function() {
        return getLastToken().location.end;
      },
      getTreeLocation_: function(start) {
        return new SourceRange(start, this.getTreeEndLocation_());
      },
      handleComment: function(range) {},
      isAtEnd: function() {
        return isAtEnd();
      },
      reportError_: function(location, message) {
        this.errorReporter_.reportError(location, message);
      },
      reportReservedIdentifier_: function(token) {
        this.reportError_(token.location, (token.type + " is a reserved identifier"));
      },
      validateAssignmentTarget_: function(tree, operation) {
        if (!tree.isPattern() && !isValidSimpleAssignmentTarget(tree, this.strictMode_)) {
          this.reportError_(tree.location, ("Invalid left-hand side expression in " + operation));
        }
      }
    }, {});
  }();
  return {get Parser() {
      return Parser;
    }};
});
System.registerModule("traceur@0.0.91/src/util/SourcePosition.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/SourcePosition.js";
  var SourcePosition = function() {
    function SourcePosition(source, offset) {
      this.source = source;
      this.offset = offset;
      this.line_ = -1;
      this.column_ = -1;
    }
    return ($traceurRuntime.createClass)(SourcePosition, {
      get line() {
        if (this.line_ === -1)
          this.line_ = this.source.lineNumberTable.getLine(this.offset);
        return this.line_;
      },
      get column() {
        if (this.column_ === -1)
          this.column_ = this.source.lineNumberTable.getColumn(this.offset);
        return this.column_;
      },
      toString: function() {
        var name = this.source ? this.source.name : '';
        return (name + ":" + (this.line + 1) + ":" + (this.column + 1));
      }
    }, {});
  }();
  return {get SourcePosition() {
      return SourcePosition;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/LineNumberTable.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/LineNumberTable.js";
  var SourcePosition = System.get("traceur@0.0.91/src/util/SourcePosition.js").SourcePosition;
  var SourceRange = System.get("traceur@0.0.91/src/util/SourceRange.js").SourceRange;
  var isLineTerminator = System.get("traceur@0.0.91/src/syntax/Scanner.js").isLineTerminator;
  var MAX_INT_REPRESENTATION = 9007199254740992;
  function computeLineStartOffsets(source) {
    var lineStartOffsets = [0];
    var k = 1;
    for (var index = 0; index < source.length; index++) {
      var code = source.charCodeAt(index);
      if (isLineTerminator(code)) {
        if (code === 13 && source.charCodeAt(index + 1) === 10) {
          index++;
        }
        lineStartOffsets[k++] = index + 1;
      }
    }
    lineStartOffsets[k++] = MAX_INT_REPRESENTATION;
    return lineStartOffsets;
  }
  var LineNumberTable = function() {
    function LineNumberTable(sourceFile) {
      this.sourceFile_ = sourceFile;
      this.lineStartOffsets_ = null;
      this.lastLine_ = 0;
      this.lastOffset_ = -1;
    }
    return ($traceurRuntime.createClass)(LineNumberTable, {
      ensureLineStartOffsets_: function() {
        if (!this.lineStartOffsets_) {
          this.lineStartOffsets_ = computeLineStartOffsets(this.sourceFile_.contents);
        }
      },
      getSourcePosition: function(offset) {
        return new SourcePosition(this.sourceFile_, offset);
      },
      getLine: function(offset) {
        if (offset === this.lastOffset_)
          return this.lastLine_;
        this.ensureLineStartOffsets_();
        if (offset < 0)
          return 0;
        var line;
        if (offset < this.lastOffset_) {
          for (var i = this.lastLine_; i >= 0; i--) {
            if (this.lineStartOffsets_[i] <= offset) {
              line = i;
              break;
            }
          }
        } else {
          for (var i$__4 = this.lastLine_; true; i$__4++) {
            if (this.lineStartOffsets_[i$__4] > offset) {
              line = i$__4 - 1;
              break;
            }
          }
        }
        this.lastLine_ = line;
        this.lastOffset_ = offset;
        return line;
      },
      offsetOfLine: function(line) {
        this.ensureLineStartOffsets_();
        return this.lineStartOffsets_[line];
      },
      getColumn: function(offset) {
        var line = this.getLine(offset);
        return offset - this.lineStartOffsets_[line];
      },
      getSourceRange: function(startOffset, endOffset) {
        return new SourceRange(this.getSourcePosition(startOffset), this.getSourcePosition(endOffset));
      }
    }, {});
  }();
  return {get LineNumberTable() {
      return LineNumberTable;
    }};
});
System.registerModule("traceur@0.0.91/src/syntax/SourceFile.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/syntax/SourceFile.js";
  var LineNumberTable = System.get("traceur@0.0.91/src/syntax/LineNumberTable.js").LineNumberTable;
  var SourceFile = function() {
    function SourceFile(name, contents) {
      this.name = name;
      this.contents = contents;
      this.lineNumberTable = new LineNumberTable(this);
    }
    return ($traceurRuntime.createClass)(SourceFile, {}, {});
  }();
  return {get SourceFile() {
      return SourceFile;
    }};
});
System.registerModule("traceur@0.0.91/src/util/CollectingErrorReporter.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/util/CollectingErrorReporter.js";
  var ErrorReporter = System.get("traceur@0.0.91/src/util/ErrorReporter.js").ErrorReporter;
  var MultipleErrors = function($__super) {
    function MultipleErrors(errors) {
      $traceurRuntime.superConstructor(MultipleErrors).call(this);
      this.message = errors ? errors.join('\n') + '' : '';
      this.name = errors && (errors.length > 1) ? 'MultipleErrors' : '';
      this.errors = errors;
    }
    return ($traceurRuntime.createClass)(MultipleErrors, {}, {}, $__super);
  }(Error);
  var CollectingErrorReporter = function($__super) {
    function CollectingErrorReporter() {
      $traceurRuntime.superConstructor(CollectingErrorReporter).call(this);
      this.errors = [];
    }
    return ($traceurRuntime.createClass)(CollectingErrorReporter, {
      reportMessageInternal: function(location, message) {
        this.errors.push((location.start + ": " + message));
      },
      errorsAsString: function() {
        return this.toError().message;
      },
      toError: function() {
        return new MultipleErrors(this.errors);
      }
    }, {}, $__super);
  }(ErrorReporter);
  return {
    get MultipleErrors() {
      return MultipleErrors;
    },
    get CollectingErrorReporter() {
      return CollectingErrorReporter;
    }
  };
});
System.registerModule("traceur@0.0.91/src/codegeneration/ParseTreeTransformer.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/codegeneration/ParseTreeTransformer.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/trees/ParseTrees.js"),
      Annotation = $__0.Annotation,
      AnonBlock = $__0.AnonBlock,
      ArgumentList = $__0.ArgumentList,
      ArrayComprehension = $__0.ArrayComprehension,
      ArrayLiteralExpression = $__0.ArrayLiteralExpression,
      ArrayPattern = $__0.ArrayPattern,
      ArrayType = $__0.ArrayType,
      ArrowFunctionExpression = $__0.ArrowFunctionExpression,
      AssignmentElement = $__0.AssignmentElement,
      AwaitExpression = $__0.AwaitExpression,
      BinaryExpression = $__0.BinaryExpression,
      BindingElement = $__0.BindingElement,
      BindingIdentifier = $__0.BindingIdentifier,
      Block = $__0.Block,
      BreakStatement = $__0.BreakStatement,
      CallExpression = $__0.CallExpression,
      CallSignature = $__0.CallSignature,
      CaseClause = $__0.CaseClause,
      Catch = $__0.Catch,
      ClassDeclaration = $__0.ClassDeclaration,
      ClassExpression = $__0.ClassExpression,
      CommaExpression = $__0.CommaExpression,
      ComprehensionFor = $__0.ComprehensionFor,
      ComprehensionIf = $__0.ComprehensionIf,
      ComputedPropertyName = $__0.ComputedPropertyName,
      ConditionalExpression = $__0.ConditionalExpression,
      ConstructSignature = $__0.ConstructSignature,
      ConstructorType = $__0.ConstructorType,
      ContinueStatement = $__0.ContinueStatement,
      CoverFormals = $__0.CoverFormals,
      CoverInitializedName = $__0.CoverInitializedName,
      DebuggerStatement = $__0.DebuggerStatement,
      DefaultClause = $__0.DefaultClause,
      DoWhileStatement = $__0.DoWhileStatement,
      EmptyStatement = $__0.EmptyStatement,
      ExportDeclaration = $__0.ExportDeclaration,
      ExportDefault = $__0.ExportDefault,
      ExportSpecifier = $__0.ExportSpecifier,
      ExportSpecifierSet = $__0.ExportSpecifierSet,
      ExportStar = $__0.ExportStar,
      ExpressionStatement = $__0.ExpressionStatement,
      Finally = $__0.Finally,
      ForInStatement = $__0.ForInStatement,
      ForOfStatement = $__0.ForOfStatement,
      ForOnStatement = $__0.ForOnStatement,
      ForStatement = $__0.ForStatement,
      FormalParameter = $__0.FormalParameter,
      FormalParameterList = $__0.FormalParameterList,
      ForwardDefaultExport = $__0.ForwardDefaultExport,
      FunctionBody = $__0.FunctionBody,
      FunctionDeclaration = $__0.FunctionDeclaration,
      FunctionExpression = $__0.FunctionExpression,
      FunctionType = $__0.FunctionType,
      GeneratorComprehension = $__0.GeneratorComprehension,
      GetAccessor = $__0.GetAccessor,
      IdentifierExpression = $__0.IdentifierExpression,
      IfStatement = $__0.IfStatement,
      ImportedBinding = $__0.ImportedBinding,
      ImportClausePair = $__0.ImportClausePair,
      ImportDeclaration = $__0.ImportDeclaration,
      ImportSpecifier = $__0.ImportSpecifier,
      ImportSpecifierSet = $__0.ImportSpecifierSet,
      IndexSignature = $__0.IndexSignature,
      InterfaceDeclaration = $__0.InterfaceDeclaration,
      LabelledStatement = $__0.LabelledStatement,
      LiteralExpression = $__0.LiteralExpression,
      LiteralPropertyName = $__0.LiteralPropertyName,
      MemberExpression = $__0.MemberExpression,
      MemberLookupExpression = $__0.MemberLookupExpression,
      MethodSignature = $__0.MethodSignature,
      Module = $__0.Module,
      ModuleSpecifier = $__0.ModuleSpecifier,
      NameSpaceExport = $__0.NameSpaceExport,
      NameSpaceImport = $__0.NameSpaceImport,
      NamedExport = $__0.NamedExport,
      NewExpression = $__0.NewExpression,
      ObjectLiteralExpression = $__0.ObjectLiteralExpression,
      ObjectPattern = $__0.ObjectPattern,
      ObjectPatternField = $__0.ObjectPatternField,
      ObjectType = $__0.ObjectType,
      ParenExpression = $__0.ParenExpression,
      PostfixExpression = $__0.PostfixExpression,
      PredefinedType = $__0.PredefinedType,
      Script = $__0.Script,
      PropertyMethodAssignment = $__0.PropertyMethodAssignment,
      PropertyNameAssignment = $__0.PropertyNameAssignment,
      PropertyNameShorthand = $__0.PropertyNameShorthand,
      PropertyVariableDeclaration = $__0.PropertyVariableDeclaration,
      PropertySignature = $__0.PropertySignature,
      RestParameter = $__0.RestParameter,
      ReturnStatement = $__0.ReturnStatement,
      SetAccessor = $__0.SetAccessor,
      SpreadExpression = $__0.SpreadExpression,
      SpreadPatternElement = $__0.SpreadPatternElement,
      SuperExpression = $__0.SuperExpression,
      SwitchStatement = $__0.SwitchStatement,
      SyntaxErrorTree = $__0.SyntaxErrorTree,
      TemplateLiteralExpression = $__0.TemplateLiteralExpression,
      TemplateLiteralPortion = $__0.TemplateLiteralPortion,
      TemplateSubstitution = $__0.TemplateSubstitution,
      ThisExpression = $__0.ThisExpression,
      ThrowStatement = $__0.ThrowStatement,
      TryStatement = $__0.TryStatement,
      TypeArguments = $__0.TypeArguments,
      TypeName = $__0.TypeName,
      TypeParameter = $__0.TypeParameter,
      TypeParameters = $__0.TypeParameters,
      TypeReference = $__0.TypeReference,
      UnaryExpression = $__0.UnaryExpression,
      UnionType = $__0.UnionType,
      VariableDeclaration = $__0.VariableDeclaration,
      VariableDeclarationList = $__0.VariableDeclarationList,
      VariableStatement = $__0.VariableStatement,
      WhileStatement = $__0.WhileStatement,
      WithStatement = $__0.WithStatement,
      YieldExpression = $__0.YieldExpression;
  var ParseTreeTransformer = function() {
    function ParseTreeTransformer() {}
    return ($traceurRuntime.createClass)(ParseTreeTransformer, {
      transformAny: function(tree) {
        return tree === null ? null : tree.transform(this);
      },
      transformList: function(list) {
        var $__2;
        var builder = null;
        for (var index = 0; index < list.length; index++) {
          var element = list[index];
          var transformed = this.transformAny(element);
          if (builder != null || element != transformed) {
            if (builder === null) {
              builder = list.slice(0, index);
            }
            if (transformed instanceof AnonBlock)
              ($__2 = builder).push.apply($__2, $traceurRuntime.spread(transformed.statements));
            else
              builder.push(transformed);
          }
        }
        return builder || list;
      },
      transformStateMachine: function(tree) {
        throw Error('State machines should not live outside of the GeneratorTransformer.');
      },
      transformToBlockOrStatement: function(tree) {
        var transformed = this.transformAny(tree);
        if (transformed instanceof AnonBlock) {
          return new Block(transformed.location, transformed.statements);
        }
        return transformed;
      },
      transformAnnotation: function(tree) {
        var name = this.transformAny(tree.name);
        var args = this.transformAny(tree.args);
        if (name === tree.name && args === tree.args) {
          return tree;
        }
        return new Annotation(tree.location, name, args);
      },
      transformAnonBlock: function(tree) {
        var statements = this.transformList(tree.statements);
        if (statements === tree.statements) {
          return tree;
        }
        return new AnonBlock(tree.location, statements);
      },
      transformArgumentList: function(tree) {
        var args = this.transformList(tree.args);
        if (args === tree.args) {
          return tree;
        }
        return new ArgumentList(tree.location, args);
      },
      transformArrayComprehension: function(tree) {
        var comprehensionList = this.transformList(tree.comprehensionList);
        var expression = this.transformAny(tree.expression);
        if (comprehensionList === tree.comprehensionList && expression === tree.expression) {
          return tree;
        }
        return new ArrayComprehension(tree.location, comprehensionList, expression);
      },
      transformArrayLiteralExpression: function(tree) {
        var elements = this.transformList(tree.elements);
        if (elements === tree.elements) {
          return tree;
        }
        return new ArrayLiteralExpression(tree.location, elements);
      },
      transformArrayPattern: function(tree) {
        var elements = this.transformList(tree.elements);
        if (elements === tree.elements) {
          return tree;
        }
        return new ArrayPattern(tree.location, elements);
      },
      transformArrayType: function(tree) {
        var elementType = this.transformAny(tree.elementType);
        if (elementType === tree.elementType) {
          return tree;
        }
        return new ArrayType(tree.location, elementType);
      },
      transformArrowFunctionExpression: function(tree) {
        var parameterList = this.transformAny(tree.parameterList);
        var body = this.transformAny(tree.body);
        if (parameterList === tree.parameterList && body === tree.body) {
          return tree;
        }
        return new ArrowFunctionExpression(tree.location, tree.functionKind, parameterList, body);
      },
      transformAssignmentElement: function(tree) {
        var assignment = this.transformAny(tree.assignment);
        var initializer = this.transformAny(tree.initializer);
        if (assignment === tree.assignment && initializer === tree.initializer) {
          return tree;
        }
        return new AssignmentElement(tree.location, assignment, initializer);
      },
      transformAwaitExpression: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new AwaitExpression(tree.location, expression);
      },
      transformBinaryExpression: function(tree) {
        var left = this.transformAny(tree.left);
        var right = this.transformAny(tree.right);
        if (left === tree.left && right === tree.right) {
          return tree;
        }
        return new BinaryExpression(tree.location, left, tree.operator, right);
      },
      transformBindingElement: function(tree) {
        var binding = this.transformAny(tree.binding);
        var initializer = this.transformAny(tree.initializer);
        if (binding === tree.binding && initializer === tree.initializer) {
          return tree;
        }
        return new BindingElement(tree.location, binding, initializer);
      },
      transformBindingIdentifier: function(tree) {
        return tree;
      },
      transformBlock: function(tree) {
        var statements = this.transformList(tree.statements);
        if (statements === tree.statements) {
          return tree;
        }
        return new Block(tree.location, statements);
      },
      transformBreakStatement: function(tree) {
        return tree;
      },
      transformCallExpression: function(tree) {
        var operand = this.transformAny(tree.operand);
        var args = this.transformAny(tree.args);
        if (operand === tree.operand && args === tree.args) {
          return tree;
        }
        return new CallExpression(tree.location, operand, args);
      },
      transformCallSignature: function(tree) {
        var typeParameters = this.transformAny(tree.typeParameters);
        var parameterList = this.transformAny(tree.parameterList);
        var returnType = this.transformAny(tree.returnType);
        if (typeParameters === tree.typeParameters && parameterList === tree.parameterList && returnType === tree.returnType) {
          return tree;
        }
        return new CallSignature(tree.location, typeParameters, parameterList, returnType);
      },
      transformCaseClause: function(tree) {
        var expression = this.transformAny(tree.expression);
        var statements = this.transformList(tree.statements);
        if (expression === tree.expression && statements === tree.statements) {
          return tree;
        }
        return new CaseClause(tree.location, expression, statements);
      },
      transformCatch: function(tree) {
        var binding = this.transformAny(tree.binding);
        var catchBody = this.transformAny(tree.catchBody);
        if (binding === tree.binding && catchBody === tree.catchBody) {
          return tree;
        }
        return new Catch(tree.location, binding, catchBody);
      },
      transformClassDeclaration: function(tree) {
        var name = this.transformAny(tree.name);
        var superClass = this.transformAny(tree.superClass);
        var elements = this.transformList(tree.elements);
        var annotations = this.transformList(tree.annotations);
        var typeParameters = this.transformAny(tree.typeParameters);
        if (name === tree.name && superClass === tree.superClass && elements === tree.elements && annotations === tree.annotations && typeParameters === tree.typeParameters) {
          return tree;
        }
        return new ClassDeclaration(tree.location, name, superClass, elements, annotations, typeParameters);
      },
      transformClassExpression: function(tree) {
        var name = this.transformAny(tree.name);
        var superClass = this.transformAny(tree.superClass);
        var elements = this.transformList(tree.elements);
        var annotations = this.transformList(tree.annotations);
        var typeParameters = this.transformAny(tree.typeParameters);
        if (name === tree.name && superClass === tree.superClass && elements === tree.elements && annotations === tree.annotations && typeParameters === tree.typeParameters) {
          return tree;
        }
        return new ClassExpression(tree.location, name, superClass, elements, annotations, typeParameters);
      },
      transformCommaExpression: function(tree) {
        var expressions = this.transformList(tree.expressions);
        if (expressions === tree.expressions) {
          return tree;
        }
        return new CommaExpression(tree.location, expressions);
      },
      transformComprehensionFor: function(tree) {
        var left = this.transformAny(tree.left);
        var iterator = this.transformAny(tree.iterator);
        if (left === tree.left && iterator === tree.iterator) {
          return tree;
        }
        return new ComprehensionFor(tree.location, left, iterator);
      },
      transformComprehensionIf: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new ComprehensionIf(tree.location, expression);
      },
      transformComputedPropertyName: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new ComputedPropertyName(tree.location, expression);
      },
      transformConditionalExpression: function(tree) {
        var condition = this.transformAny(tree.condition);
        var left = this.transformAny(tree.left);
        var right = this.transformAny(tree.right);
        if (condition === tree.condition && left === tree.left && right === tree.right) {
          return tree;
        }
        return new ConditionalExpression(tree.location, condition, left, right);
      },
      transformConstructSignature: function(tree) {
        var typeParameters = this.transformAny(tree.typeParameters);
        var parameterList = this.transformAny(tree.parameterList);
        var returnType = this.transformAny(tree.returnType);
        if (typeParameters === tree.typeParameters && parameterList === tree.parameterList && returnType === tree.returnType) {
          return tree;
        }
        return new ConstructSignature(tree.location, typeParameters, parameterList, returnType);
      },
      transformConstructorType: function(tree) {
        var typeParameters = this.transformAny(tree.typeParameters);
        var parameterList = this.transformAny(tree.parameterList);
        var returnType = this.transformAny(tree.returnType);
        if (typeParameters === tree.typeParameters && parameterList === tree.parameterList && returnType === tree.returnType) {
          return tree;
        }
        return new ConstructorType(tree.location, typeParameters, parameterList, returnType);
      },
      transformContinueStatement: function(tree) {
        return tree;
      },
      transformCoverFormals: function(tree) {
        var expressions = this.transformList(tree.expressions);
        if (expressions === tree.expressions) {
          return tree;
        }
        return new CoverFormals(tree.location, expressions);
      },
      transformCoverInitializedName: function(tree) {
        var initializer = this.transformAny(tree.initializer);
        if (initializer === tree.initializer) {
          return tree;
        }
        return new CoverInitializedName(tree.location, tree.name, tree.equalToken, initializer);
      },
      transformDebuggerStatement: function(tree) {
        return tree;
      },
      transformDefaultClause: function(tree) {
        var statements = this.transformList(tree.statements);
        if (statements === tree.statements) {
          return tree;
        }
        return new DefaultClause(tree.location, statements);
      },
      transformDoWhileStatement: function(tree) {
        var body = this.transformToBlockOrStatement(tree.body);
        var condition = this.transformAny(tree.condition);
        if (body === tree.body && condition === tree.condition) {
          return tree;
        }
        return new DoWhileStatement(tree.location, body, condition);
      },
      transformEmptyStatement: function(tree) {
        return tree;
      },
      transformExportDeclaration: function(tree) {
        var declaration = this.transformAny(tree.declaration);
        var annotations = this.transformList(tree.annotations);
        if (declaration === tree.declaration && annotations === tree.annotations) {
          return tree;
        }
        return new ExportDeclaration(tree.location, declaration, annotations);
      },
      transformExportDefault: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new ExportDefault(tree.location, expression);
      },
      transformExportSpecifier: function(tree) {
        return tree;
      },
      transformExportSpecifierSet: function(tree) {
        var specifiers = this.transformList(tree.specifiers);
        if (specifiers === tree.specifiers) {
          return tree;
        }
        return new ExportSpecifierSet(tree.location, specifiers);
      },
      transformExportStar: function(tree) {
        return tree;
      },
      transformExpressionStatement: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new ExpressionStatement(tree.location, expression);
      },
      transformFinally: function(tree) {
        var block = this.transformAny(tree.block);
        if (block === tree.block) {
          return tree;
        }
        return new Finally(tree.location, block);
      },
      transformForInStatement: function(tree) {
        var initializer = this.transformAny(tree.initializer);
        var collection = this.transformAny(tree.collection);
        var body = this.transformToBlockOrStatement(tree.body);
        if (initializer === tree.initializer && collection === tree.collection && body === tree.body) {
          return tree;
        }
        return new ForInStatement(tree.location, initializer, collection, body);
      },
      transformForOfStatement: function(tree) {
        var initializer = this.transformAny(tree.initializer);
        var collection = this.transformAny(tree.collection);
        var body = this.transformToBlockOrStatement(tree.body);
        if (initializer === tree.initializer && collection === tree.collection && body === tree.body) {
          return tree;
        }
        return new ForOfStatement(tree.location, initializer, collection, body);
      },
      transformForOnStatement: function(tree) {
        var initializer = this.transformAny(tree.initializer);
        var observable = this.transformAny(tree.observable);
        var body = this.transformToBlockOrStatement(tree.body);
        if (initializer === tree.initializer && observable === tree.observable && body === tree.body) {
          return tree;
        }
        return new ForOnStatement(tree.location, initializer, observable, body);
      },
      transformForStatement: function(tree) {
        var initializer = this.transformAny(tree.initializer);
        var condition = this.transformAny(tree.condition);
        var increment = this.transformAny(tree.increment);
        var body = this.transformToBlockOrStatement(tree.body);
        if (initializer === tree.initializer && condition === tree.condition && increment === tree.increment && body === tree.body) {
          return tree;
        }
        return new ForStatement(tree.location, initializer, condition, increment, body);
      },
      transformFormalParameter: function(tree) {
        var parameter = this.transformAny(tree.parameter);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var annotations = this.transformList(tree.annotations);
        if (parameter === tree.parameter && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations) {
          return tree;
        }
        return new FormalParameter(tree.location, parameter, typeAnnotation, annotations);
      },
      transformFormalParameterList: function(tree) {
        var parameters = this.transformList(tree.parameters);
        if (parameters === tree.parameters) {
          return tree;
        }
        return new FormalParameterList(tree.location, parameters);
      },
      transformForwardDefaultExport: function(tree) {
        return tree;
      },
      transformFunctionBody: function(tree) {
        var statements = this.transformList(tree.statements);
        if (statements === tree.statements) {
          return tree;
        }
        return new FunctionBody(tree.location, statements);
      },
      transformFunctionDeclaration: function(tree) {
        var name = this.transformAny(tree.name);
        var parameterList = this.transformAny(tree.parameterList);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var annotations = this.transformList(tree.annotations);
        var body = this.transformAny(tree.body);
        if (name === tree.name && parameterList === tree.parameterList && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
          return tree;
        }
        return new FunctionDeclaration(tree.location, name, tree.functionKind, parameterList, typeAnnotation, annotations, body);
      },
      transformFunctionExpression: function(tree) {
        var name = this.transformAny(tree.name);
        var parameterList = this.transformAny(tree.parameterList);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var annotations = this.transformList(tree.annotations);
        var body = this.transformAny(tree.body);
        if (name === tree.name && parameterList === tree.parameterList && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
          return tree;
        }
        return new FunctionExpression(tree.location, name, tree.functionKind, parameterList, typeAnnotation, annotations, body);
      },
      transformFunctionType: function(tree) {
        var typeParameters = this.transformAny(tree.typeParameters);
        var parameterList = this.transformAny(tree.parameterList);
        var returnType = this.transformAny(tree.returnType);
        if (typeParameters === tree.typeParameters && parameterList === tree.parameterList && returnType === tree.returnType) {
          return tree;
        }
        return new FunctionType(tree.location, typeParameters, parameterList, returnType);
      },
      transformGeneratorComprehension: function(tree) {
        var comprehensionList = this.transformList(tree.comprehensionList);
        var expression = this.transformAny(tree.expression);
        if (comprehensionList === tree.comprehensionList && expression === tree.expression) {
          return tree;
        }
        return new GeneratorComprehension(tree.location, comprehensionList, expression);
      },
      transformGetAccessor: function(tree) {
        var name = this.transformAny(tree.name);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var annotations = this.transformList(tree.annotations);
        var body = this.transformAny(tree.body);
        if (name === tree.name && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
          return tree;
        }
        return new GetAccessor(tree.location, tree.isStatic, name, typeAnnotation, annotations, body);
      },
      transformIdentifierExpression: function(tree) {
        return tree;
      },
      transformIfStatement: function(tree) {
        var condition = this.transformAny(tree.condition);
        var ifClause = this.transformToBlockOrStatement(tree.ifClause);
        var elseClause = this.transformToBlockOrStatement(tree.elseClause);
        if (condition === tree.condition && ifClause === tree.ifClause && elseClause === tree.elseClause) {
          return tree;
        }
        return new IfStatement(tree.location, condition, ifClause, elseClause);
      },
      transformImportedBinding: function(tree) {
        var binding = this.transformAny(tree.binding);
        if (binding === tree.binding) {
          return tree;
        }
        return new ImportedBinding(tree.location, binding);
      },
      transformImportClausePair: function(tree) {
        var first = this.transformAny(tree.first);
        var second = this.transformAny(tree.second);
        if (first === tree.first && second === tree.second) {
          return tree;
        }
        return new ImportClausePair(tree.location, first, second);
      },
      transformImportDeclaration: function(tree) {
        var importClause = this.transformAny(tree.importClause);
        var moduleSpecifier = this.transformAny(tree.moduleSpecifier);
        if (importClause === tree.importClause && moduleSpecifier === tree.moduleSpecifier) {
          return tree;
        }
        return new ImportDeclaration(tree.location, importClause, moduleSpecifier);
      },
      transformImportSpecifier: function(tree) {
        var binding = this.transformAny(tree.binding);
        if (binding === tree.binding) {
          return tree;
        }
        return new ImportSpecifier(tree.location, binding, tree.name);
      },
      transformImportSpecifierSet: function(tree) {
        var specifiers = this.transformList(tree.specifiers);
        if (specifiers === tree.specifiers) {
          return tree;
        }
        return new ImportSpecifierSet(tree.location, specifiers);
      },
      transformIndexSignature: function(tree) {
        var indexType = this.transformAny(tree.indexType);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        if (indexType === tree.indexType && typeAnnotation === tree.typeAnnotation) {
          return tree;
        }
        return new IndexSignature(tree.location, tree.name, indexType, typeAnnotation);
      },
      transformInterfaceDeclaration: function(tree) {
        var typeParameters = this.transformAny(tree.typeParameters);
        var objectType = this.transformAny(tree.objectType);
        if (typeParameters === tree.typeParameters && objectType === tree.objectType) {
          return tree;
        }
        return new InterfaceDeclaration(tree.location, tree.name, typeParameters, tree.extendsClause, objectType);
      },
      transformLabelledStatement: function(tree) {
        var statement = this.transformAny(tree.statement);
        if (statement === tree.statement) {
          return tree;
        }
        return new LabelledStatement(tree.location, tree.name, statement);
      },
      transformLiteralExpression: function(tree) {
        return tree;
      },
      transformLiteralPropertyName: function(tree) {
        return tree;
      },
      transformMemberExpression: function(tree) {
        var operand = this.transformAny(tree.operand);
        if (operand === tree.operand) {
          return tree;
        }
        return new MemberExpression(tree.location, operand, tree.memberName);
      },
      transformMemberLookupExpression: function(tree) {
        var operand = this.transformAny(tree.operand);
        var memberExpression = this.transformAny(tree.memberExpression);
        if (operand === tree.operand && memberExpression === tree.memberExpression) {
          return tree;
        }
        return new MemberLookupExpression(tree.location, operand, memberExpression);
      },
      transformMethodSignature: function(tree) {
        var name = this.transformAny(tree.name);
        var callSignature = this.transformAny(tree.callSignature);
        if (name === tree.name && callSignature === tree.callSignature) {
          return tree;
        }
        return new MethodSignature(tree.location, name, tree.optional, callSignature);
      },
      transformModule: function(tree) {
        var scriptItemList = this.transformList(tree.scriptItemList);
        if (scriptItemList === tree.scriptItemList) {
          return tree;
        }
        return new Module(tree.location, scriptItemList, tree.moduleName);
      },
      transformModuleSpecifier: function(tree) {
        return tree;
      },
      transformNameSpaceExport: function(tree) {
        return tree;
      },
      transformNameSpaceImport: function(tree) {
        var binding = this.transformAny(tree.binding);
        if (binding === tree.binding) {
          return tree;
        }
        return new NameSpaceImport(tree.location, binding);
      },
      transformNamedExport: function(tree) {
        var exportClause = this.transformAny(tree.exportClause);
        var moduleSpecifier = this.transformAny(tree.moduleSpecifier);
        if (exportClause === tree.exportClause && moduleSpecifier === tree.moduleSpecifier) {
          return tree;
        }
        return new NamedExport(tree.location, exportClause, moduleSpecifier);
      },
      transformNewExpression: function(tree) {
        var operand = this.transformAny(tree.operand);
        var args = this.transformAny(tree.args);
        if (operand === tree.operand && args === tree.args) {
          return tree;
        }
        return new NewExpression(tree.location, operand, args);
      },
      transformObjectLiteralExpression: function(tree) {
        var propertyNameAndValues = this.transformList(tree.propertyNameAndValues);
        if (propertyNameAndValues === tree.propertyNameAndValues) {
          return tree;
        }
        return new ObjectLiteralExpression(tree.location, propertyNameAndValues);
      },
      transformObjectPattern: function(tree) {
        var fields = this.transformList(tree.fields);
        if (fields === tree.fields) {
          return tree;
        }
        return new ObjectPattern(tree.location, fields);
      },
      transformObjectPatternField: function(tree) {
        var name = this.transformAny(tree.name);
        var element = this.transformAny(tree.element);
        if (name === tree.name && element === tree.element) {
          return tree;
        }
        return new ObjectPatternField(tree.location, name, element);
      },
      transformObjectType: function(tree) {
        var typeMembers = this.transformList(tree.typeMembers);
        if (typeMembers === tree.typeMembers) {
          return tree;
        }
        return new ObjectType(tree.location, typeMembers);
      },
      transformParenExpression: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new ParenExpression(tree.location, expression);
      },
      transformPostfixExpression: function(tree) {
        var operand = this.transformAny(tree.operand);
        if (operand === tree.operand) {
          return tree;
        }
        return new PostfixExpression(tree.location, operand, tree.operator);
      },
      transformPredefinedType: function(tree) {
        return tree;
      },
      transformScript: function(tree) {
        var scriptItemList = this.transformList(tree.scriptItemList);
        if (scriptItemList === tree.scriptItemList) {
          return tree;
        }
        return new Script(tree.location, scriptItemList, tree.moduleName);
      },
      transformPropertyMethodAssignment: function(tree) {
        var name = this.transformAny(tree.name);
        var parameterList = this.transformAny(tree.parameterList);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var annotations = this.transformList(tree.annotations);
        var body = this.transformAny(tree.body);
        var debugName = this.transformAny(tree.debugName);
        if (name === tree.name && parameterList === tree.parameterList && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body && debugName === tree.debugName) {
          return tree;
        }
        return new PropertyMethodAssignment(tree.location, tree.isStatic, tree.functionKind, name, parameterList, typeAnnotation, annotations, body, debugName);
      },
      transformPropertyNameAssignment: function(tree) {
        var name = this.transformAny(tree.name);
        var value = this.transformAny(tree.value);
        if (name === tree.name && value === tree.value) {
          return tree;
        }
        return new PropertyNameAssignment(tree.location, name, value);
      },
      transformPropertyNameShorthand: function(tree) {
        return tree;
      },
      transformPropertyVariableDeclaration: function(tree) {
        var name = this.transformAny(tree.name);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var annotations = this.transformList(tree.annotations);
        var initializer = this.transformAny(tree.initializer);
        if (name === tree.name && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && initializer === tree.initializer) {
          return tree;
        }
        return new PropertyVariableDeclaration(tree.location, tree.isStatic, name, typeAnnotation, annotations, initializer);
      },
      transformPropertySignature: function(tree) {
        var name = this.transformAny(tree.name);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        if (name === tree.name && typeAnnotation === tree.typeAnnotation) {
          return tree;
        }
        return new PropertySignature(tree.location, name, tree.optional, typeAnnotation);
      },
      transformRestParameter: function(tree) {
        var identifier = this.transformAny(tree.identifier);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        if (identifier === tree.identifier && typeAnnotation === tree.typeAnnotation) {
          return tree;
        }
        return new RestParameter(tree.location, identifier, typeAnnotation);
      },
      transformReturnStatement: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new ReturnStatement(tree.location, expression);
      },
      transformSetAccessor: function(tree) {
        var name = this.transformAny(tree.name);
        var parameterList = this.transformAny(tree.parameterList);
        var annotations = this.transformList(tree.annotations);
        var body = this.transformAny(tree.body);
        if (name === tree.name && parameterList === tree.parameterList && annotations === tree.annotations && body === tree.body) {
          return tree;
        }
        return new SetAccessor(tree.location, tree.isStatic, name, parameterList, annotations, body);
      },
      transformSpreadExpression: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new SpreadExpression(tree.location, expression);
      },
      transformSpreadPatternElement: function(tree) {
        var lvalue = this.transformAny(tree.lvalue);
        if (lvalue === tree.lvalue) {
          return tree;
        }
        return new SpreadPatternElement(tree.location, lvalue);
      },
      transformSuperExpression: function(tree) {
        return tree;
      },
      transformSwitchStatement: function(tree) {
        var expression = this.transformAny(tree.expression);
        var caseClauses = this.transformList(tree.caseClauses);
        if (expression === tree.expression && caseClauses === tree.caseClauses) {
          return tree;
        }
        return new SwitchStatement(tree.location, expression, caseClauses);
      },
      transformSyntaxErrorTree: function(tree) {
        return tree;
      },
      transformTemplateLiteralExpression: function(tree) {
        var operand = this.transformAny(tree.operand);
        var elements = this.transformList(tree.elements);
        if (operand === tree.operand && elements === tree.elements) {
          return tree;
        }
        return new TemplateLiteralExpression(tree.location, operand, elements);
      },
      transformTemplateLiteralPortion: function(tree) {
        return tree;
      },
      transformTemplateSubstitution: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new TemplateSubstitution(tree.location, expression);
      },
      transformThisExpression: function(tree) {
        return tree;
      },
      transformThrowStatement: function(tree) {
        var value = this.transformAny(tree.value);
        if (value === tree.value) {
          return tree;
        }
        return new ThrowStatement(tree.location, value);
      },
      transformTryStatement: function(tree) {
        var body = this.transformAny(tree.body);
        var catchBlock = this.transformAny(tree.catchBlock);
        var finallyBlock = this.transformAny(tree.finallyBlock);
        if (body === tree.body && catchBlock === tree.catchBlock && finallyBlock === tree.finallyBlock) {
          return tree;
        }
        return new TryStatement(tree.location, body, catchBlock, finallyBlock);
      },
      transformTypeArguments: function(tree) {
        var args = this.transformList(tree.args);
        if (args === tree.args) {
          return tree;
        }
        return new TypeArguments(tree.location, args);
      },
      transformTypeName: function(tree) {
        var moduleName = this.transformAny(tree.moduleName);
        if (moduleName === tree.moduleName) {
          return tree;
        }
        return new TypeName(tree.location, moduleName, tree.name);
      },
      transformTypeParameter: function(tree) {
        var extendsType = this.transformAny(tree.extendsType);
        if (extendsType === tree.extendsType) {
          return tree;
        }
        return new TypeParameter(tree.location, tree.identifierToken, extendsType);
      },
      transformTypeParameters: function(tree) {
        var parameters = this.transformList(tree.parameters);
        if (parameters === tree.parameters) {
          return tree;
        }
        return new TypeParameters(tree.location, parameters);
      },
      transformTypeReference: function(tree) {
        var typeName = this.transformAny(tree.typeName);
        var args = this.transformAny(tree.args);
        if (typeName === tree.typeName && args === tree.args) {
          return tree;
        }
        return new TypeReference(tree.location, typeName, args);
      },
      transformUnaryExpression: function(tree) {
        var operand = this.transformAny(tree.operand);
        if (operand === tree.operand) {
          return tree;
        }
        return new UnaryExpression(tree.location, tree.operator, operand);
      },
      transformUnionType: function(tree) {
        var types = this.transformList(tree.types);
        if (types === tree.types) {
          return tree;
        }
        return new UnionType(tree.location, types);
      },
      transformVariableDeclaration: function(tree) {
        var lvalue = this.transformAny(tree.lvalue);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var initializer = this.transformAny(tree.initializer);
        if (lvalue === tree.lvalue && typeAnnotation === tree.typeAnnotation && initializer === tree.initializer) {
          return tree;
        }
        return new VariableDeclaration(tree.location, lvalue, typeAnnotation, initializer);
      },
      transformVariableDeclarationList: function(tree) {
        var declarations = this.transformList(tree.declarations);
        if (declarations === tree.declarations) {
          return tree;
        }
        return new VariableDeclarationList(tree.location, tree.declarationType, declarations);
      },
      transformVariableStatement: function(tree) {
        var declarations = this.transformAny(tree.declarations);
        if (declarations === tree.declarations) {
          return tree;
        }
        return new VariableStatement(tree.location, declarations);
      },
      transformWhileStatement: function(tree) {
        var condition = this.transformAny(tree.condition);
        var body = this.transformToBlockOrStatement(tree.body);
        if (condition === tree.condition && body === tree.body) {
          return tree;
        }
        return new WhileStatement(tree.location, condition, body);
      },
      transformWithStatement: function(tree) {
        var expression = this.transformAny(tree.expression);
        var body = this.transformToBlockOrStatement(tree.body);
        if (expression === tree.expression && body === tree.body) {
          return tree;
        }
        return new WithStatement(tree.location, expression, body);
      },
      transformYieldExpression: function(tree) {
        var expression = this.transformAny(tree.expression);
        if (expression === tree.expression) {
          return tree;
        }
        return new YieldExpression(tree.location, expression, tree.isYieldFor);
      }
    }, {});
  }();
  return {get ParseTreeTransformer() {
      return ParseTreeTransformer;
    }};
});
System.registerModule("traceur@0.0.91/src/codegeneration/PlaceholderParser.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/codegeneration/PlaceholderParser.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      ARGUMENT_LIST = $__0.ARGUMENT_LIST,
      BLOCK = $__0.BLOCK,
      EXPRESSION_STATEMENT = $__0.EXPRESSION_STATEMENT,
      IDENTIFIER_EXPRESSION = $__0.IDENTIFIER_EXPRESSION;
  var IdentifierToken = System.get("traceur@0.0.91/src/syntax/IdentifierToken.js").IdentifierToken;
  var LiteralToken = System.get("traceur@0.0.91/src/syntax/LiteralToken.js").LiteralToken;
  var CollectingErrorReporter = System.get("traceur@0.0.91/src/util/CollectingErrorReporter.js").CollectingErrorReporter;
  var Options = System.get("traceur@0.0.91/src/Options.js").Options;
  var ParseTree = System.get("traceur@0.0.91/src/syntax/trees/ParseTree.js").ParseTree;
  var ParseTreeTransformer = System.get("traceur@0.0.91/src/codegeneration/ParseTreeTransformer.js").ParseTreeTransformer;
  var Parser = System.get("traceur@0.0.91/src/syntax/Parser.js").Parser;
  var $__8 = System.get("traceur@0.0.91/src/syntax/trees/ParseTrees.js"),
      LiteralExpression = $__8.LiteralExpression,
      LiteralPropertyName = $__8.LiteralPropertyName,
      TypeName = $__8.TypeName;
  var SourceFile = System.get("traceur@0.0.91/src/syntax/SourceFile.js").SourceFile;
  var IDENTIFIER = System.get("traceur@0.0.91/src/syntax/TokenType.js").IDENTIFIER;
  var $__11 = System.get("traceur@0.0.91/src/codegeneration/ParseTreeFactory.js"),
      createArrayLiteralExpression = $__11.createArrayLiteralExpression,
      createBindingIdentifier = $__11.createBindingIdentifier,
      createBlock = $__11.createBlock,
      createBooleanLiteral = $__11.createBooleanLiteral,
      createCommaExpression = $__11.createCommaExpression,
      createExpressionStatement = $__11.createExpressionStatement,
      createFunctionBody = $__11.createFunctionBody,
      createIdentifierExpression = $__11.createIdentifierExpression,
      createIdentifierToken = $__11.createIdentifierToken,
      createMemberExpression = $__11.createMemberExpression,
      createNullLiteral = $__11.createNullLiteral,
      createNumberLiteral = $__11.createNumberLiteral,
      createParenExpression = $__11.createParenExpression,
      createStringLiteral = $__11.createStringLiteral,
      createVoid0 = $__11.createVoid0;
  var NOT_FOUND = {};
  function makeParseFunction(doParse) {
    var cache = new Map();
    return function(sourceLiterals) {
      for (var values = [],
          $__13 = 1; $__13 < arguments.length; $__13++)
        values[$__13 - 1] = arguments[$__13];
      return parse(sourceLiterals, values, doParse, cache);
    };
  }
  var parseExpression = makeParseFunction(function(p) {
    return p.parseExpression();
  });
  var parseStatement = makeParseFunction(function(p) {
    return p.parseStatement();
  });
  var parseModule = makeParseFunction(function(p) {
    return p.parseModule();
  });
  var parseScript = makeParseFunction(function(p) {
    return p.parseScript();
  });
  var parseStatements = makeParseFunction(function(p) {
    return p.parseStatements();
  });
  var parsePropertyDefinition = makeParseFunction(function(p) {
    return p.parsePropertyDefinition();
  });
  function parse(sourceLiterals, values, doParse, cache) {
    var tree = cache.get(sourceLiterals);
    if (!tree) {
      var source = insertPlaceholderIdentifiers(sourceLiterals);
      var errorReporter = new CollectingErrorReporter();
      var parser = getParser(source, errorReporter);
      tree = doParse(parser);
      if (errorReporter.hadError() || !tree || !parser.isAtEnd()) {
        throw new Error(("Internal error trying to parse:\n\n" + source + "\n\n" + errorReporter.errorsAsString()));
      }
      cache.set(sourceLiterals, tree);
    }
    if (!values.length)
      return tree;
    if (tree instanceof ParseTree)
      return new PlaceholderTransformer(values).transformAny(tree);
    return new PlaceholderTransformer(values).transformList(tree);
  }
  var PREFIX = '$__placeholder__';
  function insertPlaceholderIdentifiers(sourceLiterals) {
    var source = sourceLiterals[0];
    for (var i = 1; i < sourceLiterals.length; i++) {
      source += PREFIX + String(i - 1) + sourceLiterals[i];
    }
    return source;
  }
  var counter = 0;
  function getParser(source, errorReporter) {
    var file = new SourceFile(null, source);
    var options = new Options();
    options.experimental = true;
    return new Parser(file, errorReporter, options);
  }
  function convertValueToExpression(value) {
    if (value instanceof ParseTree)
      return value;
    if (value instanceof IdentifierToken)
      return createIdentifierExpression(value);
    if (value instanceof LiteralToken)
      return new LiteralExpression(value.location, value);
    if (Array.isArray(value)) {
      if (value[0] instanceof ParseTree) {
        if (value.length === 1)
          return value[0];
        if (value[0].isStatement())
          return createBlock(value);
        else
          return createParenExpression(createCommaExpression(value));
      }
      return createArrayLiteralExpression(value.map(convertValueToExpression));
    }
    if (value === null)
      return createNullLiteral();
    if (value === undefined)
      return createVoid0();
    switch (typeof value) {
      case 'string':
        return createStringLiteral(value);
      case 'boolean':
        return createBooleanLiteral(value);
      case 'number':
        return createNumberLiteral(value);
    }
    throw new Error('Not implemented');
  }
  function convertValueToIdentifierToken(value) {
    if (value instanceof IdentifierToken)
      return value;
    return createIdentifierToken(value);
  }
  function convertValueToType(value) {
    if (value === null)
      return null;
    if (value instanceof ParseTree)
      return value;
    if (typeof value === 'string') {
      return new TypeName(null, null, convertValueToIdentifierToken(value));
    }
    if (value instanceof IdentifierToken) {
      return new TypeName(null, null, value);
    }
    throw new Error('Not implemented');
  }
  var PlaceholderTransformer = function($__super) {
    function PlaceholderTransformer(values) {
      $traceurRuntime.superConstructor(PlaceholderTransformer).call(this);
      this.values = values;
    }
    return ($traceurRuntime.createClass)(PlaceholderTransformer, {
      getValueAt: function(index) {
        return this.values[index];
      },
      getValue_: function(str) {
        if (str.indexOf(PREFIX) !== 0)
          return NOT_FOUND;
        return this.getValueAt(Number(str.slice(PREFIX.length)));
      },
      transformIdentifierExpression: function(tree) {
        var value = this.getValue_(tree.identifierToken.value);
        if (value === NOT_FOUND)
          return tree;
        return convertValueToExpression(value);
      },
      transformBindingIdentifier: function(tree) {
        var value = this.getValue_(tree.identifierToken.value);
        if (value === NOT_FOUND)
          return tree;
        return createBindingIdentifier(value);
      },
      transformExpressionStatement: function(tree) {
        if (tree.expression.type === IDENTIFIER_EXPRESSION) {
          var transformedExpression = this.transformIdentifierExpression(tree.expression);
          if (transformedExpression === tree.expression)
            return tree;
          if (transformedExpression.isStatementListItem())
            return transformedExpression;
          return createExpressionStatement(transformedExpression);
        }
        return $traceurRuntime.superGet(this, PlaceholderTransformer.prototype, "transformExpressionStatement").call(this, tree);
      },
      transformBlock: function(tree) {
        if (tree.statements.length === 1 && tree.statements[0].type === EXPRESSION_STATEMENT) {
          var transformedStatement = this.transformExpressionStatement(tree.statements[0]);
          if (transformedStatement === tree.statements[0])
            return tree;
          if (transformedStatement.type === BLOCK)
            return transformedStatement;
        }
        return $traceurRuntime.superGet(this, PlaceholderTransformer.prototype, "transformBlock").call(this, tree);
      },
      transformFunctionBody: function(tree) {
        if (tree.statements.length === 1 && tree.statements[0].type === EXPRESSION_STATEMENT) {
          var transformedStatement = this.transformExpressionStatement(tree.statements[0]);
          if (transformedStatement === tree.statements[0])
            return tree;
          if (transformedStatement.type === BLOCK)
            return createFunctionBody(transformedStatement.statements);
        }
        return $traceurRuntime.superGet(this, PlaceholderTransformer.prototype, "transformFunctionBody").call(this, tree);
      },
      transformMemberExpression: function(tree) {
        var value = this.getValue_(tree.memberName.value);
        if (value === NOT_FOUND)
          return $traceurRuntime.superGet(this, PlaceholderTransformer.prototype, "transformMemberExpression").call(this, tree);
        var operand = this.transformAny(tree.operand);
        return createMemberExpression(operand, value);
      },
      transformLiteralPropertyName: function(tree) {
        if (tree.literalToken.type === IDENTIFIER) {
          var value = this.getValue_(tree.literalToken.value);
          if (value !== NOT_FOUND) {
            return new LiteralPropertyName(null, convertValueToIdentifierToken(value));
          }
        }
        return $traceurRuntime.superGet(this, PlaceholderTransformer.prototype, "transformLiteralPropertyName").call(this, tree);
      },
      transformArgumentList: function(tree) {
        if (tree.args.length === 1 && tree.args[0].type === IDENTIFIER_EXPRESSION) {
          var arg0 = this.transformAny(tree.args[0]);
          if (arg0 === tree.args[0])
            return tree;
          if (arg0.type === ARGUMENT_LIST)
            return arg0;
        }
        return $traceurRuntime.superGet(this, PlaceholderTransformer.prototype, "transformArgumentList").call(this, tree);
      },
      transformTypeName: function(tree) {
        var value = this.getValue_(tree.name.value);
        if (value === NOT_FOUND)
          return $traceurRuntime.superGet(this, PlaceholderTransformer.prototype, "transformTypeName").call(this, tree);
        var moduleName = this.transformAny(tree.moduleName);
        if (moduleName !== null) {
          return new TypeName(null, moduleName, convertValueToIdentifierToken(value));
        }
        return convertValueToType(value);
      }
    }, {}, $__super);
  }(ParseTreeTransformer);
  return {
    get parseExpression() {
      return parseExpression;
    },
    get parseStatement() {
      return parseStatement;
    },
    get parseModule() {
      return parseModule;
    },
    get parseScript() {
      return parseScript;
    },
    get parseStatements() {
      return parseStatements;
    },
    get parsePropertyDefinition() {
      return parsePropertyDefinition;
    },
    get PlaceholderTransformer() {
      return PlaceholderTransformer;
    }
  };
});
System.registerModule("traceur@0.0.91/src/codegeneration/PrependStatements.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/codegeneration/PrependStatements.js";
  function prependStatements(statements) {
    var $__1;
    for (var statementsToPrepend = [],
        $__0 = 1; $__0 < arguments.length; $__0++)
      statementsToPrepend[$__0 - 1] = arguments[$__0];
    if (!statements.length)
      return statementsToPrepend;
    if (!statementsToPrepend.length)
      return statements;
    var transformed = [];
    var inProlog = true;
    statements.forEach(function(statement) {
      var $__1;
      if (inProlog && !statement.isDirectivePrologue()) {
        ($__1 = transformed).push.apply($__1, $traceurRuntime.spread(statementsToPrepend));
        inProlog = false;
      }
      transformed.push(statement);
    });
    if (inProlog) {
      ($__1 = transformed).push.apply($__1, $traceurRuntime.spread(statementsToPrepend));
    }
    return transformed;
  }
  return {get prependStatements() {
      return prependStatements;
    }};
});
System.registerModule("traceur@0.0.91/src/codegeneration/TempVarTransformer.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/codegeneration/TempVarTransformer.js";
  var ParseTreeTransformer = System.get("traceur@0.0.91/src/codegeneration/ParseTreeTransformer.js").ParseTreeTransformer;
  var $__1 = System.get("traceur@0.0.91/src/syntax/trees/ParseTrees.js"),
      Module = $__1.Module,
      Script = $__1.Script;
  var ARGUMENTS = System.get("traceur@0.0.91/src/syntax/PredefinedName.js").ARGUMENTS;
  var StringSet = System.get("traceur@0.0.91/src/util/StringSet.js").StringSet;
  var $__4 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      LET = $__4.LET,
      VAR = $__4.VAR;
  var $__5 = System.get("traceur@0.0.91/src/codegeneration/ParseTreeFactory.js"),
      createFunctionBody = $__5.createFunctionBody,
      createThisExpression = $__5.createThisExpression,
      createIdentifierExpression = $__5.createIdentifierExpression,
      createVariableDeclaration = $__5.createVariableDeclaration,
      createVariableDeclarationList = $__5.createVariableDeclarationList,
      createVariableStatement = $__5.createVariableStatement;
  var prependStatements = System.get("traceur@0.0.91/src/codegeneration/PrependStatements.js").prependStatements;
  var TempVarStatement = function() {
    function TempVarStatement(name, initializer) {
      this.name = name;
      this.initializer = initializer;
    }
    return ($traceurRuntime.createClass)(TempVarStatement, {}, {});
  }();
  var TempScope = function() {
    function TempScope() {
      this.identifiers = [];
    }
    return ($traceurRuntime.createClass)(TempScope, {
      push: function(identifier) {
        this.identifiers.push(identifier);
      },
      pop: function() {
        return this.identifiers.pop();
      },
      release: function(obj) {
        for (var i = this.identifiers.length - 1; i >= 0; i--) {
          obj.release_(this.identifiers[i]);
        }
      }
    }, {});
  }();
  var VarScope = function() {
    function VarScope(options) {
      this.thisName = null;
      this.argumentName = null;
      this.tempVarStatements = [];
      this.declarationType_ = options.blockBinding && !options.transformOptions.blockBinding ? LET : VAR;
    }
    return ($traceurRuntime.createClass)(VarScope, {
      push: function(tempVarStatement) {
        this.tempVarStatements.push(tempVarStatement);
      },
      pop: function() {
        return this.tempVarStatements.pop();
      },
      release: function(obj) {
        for (var i = this.tempVarStatements.length - 1; i >= 0; i--) {
          obj.release_(this.tempVarStatements[i].name);
        }
      },
      isEmpty: function() {
        return !this.tempVarStatements.length;
      },
      createVariableStatement: function() {
        var declarations = [];
        var seenNames = new StringSet();
        for (var i = 0; i < this.tempVarStatements.length; i++) {
          var $__8 = this.tempVarStatements[i],
              name = $__8.name,
              initializer = $__8.initializer;
          if (seenNames.has(name)) {
            if (initializer)
              throw new Error('Invalid use of TempVarTransformer');
            continue;
          }
          seenNames.add(name);
          declarations.push(createVariableDeclaration(name, initializer));
        }
        return createVariableStatement(createVariableDeclarationList(this.declarationType_, declarations));
      }
    }, {});
  }();
  var TempVarTransformer = function($__super) {
    function TempVarTransformer(identifierGenerator, reporter, options) {
      $traceurRuntime.superConstructor(TempVarTransformer).call(this);
      this.identifierGenerator = identifierGenerator;
      this.reporter = reporter;
      this.options = options;
      this.tempVarStack_ = [new VarScope(this.options)];
      this.tempScopeStack_ = [new TempScope()];
      this.namePool_ = [];
    }
    return ($traceurRuntime.createClass)(TempVarTransformer, {
      transformStatements_: function(statements) {
        this.tempVarStack_.push(new VarScope(this.options));
        var transformedStatements = this.transformList(statements);
        var vars = this.tempVarStack_.pop();
        if (vars.isEmpty())
          return transformedStatements;
        var variableStatement = vars.createVariableStatement();
        vars.release(this);
        return prependStatements(transformedStatements, variableStatement);
      },
      transformScript: function(tree) {
        var scriptItemList = this.transformStatements_(tree.scriptItemList);
        if (scriptItemList === tree.scriptItemList) {
          return tree;
        }
        return new Script(tree.location, scriptItemList, tree.moduleName);
      },
      transformModule: function(tree) {
        var scriptItemList = this.transformStatements_(tree.scriptItemList);
        if (scriptItemList === tree.scriptItemList) {
          return tree;
        }
        return new Module(tree.location, scriptItemList, tree.moduleName);
      },
      transformFunctionBody: function(tree) {
        this.pushTempScope();
        var statements = this.transformStatements_(tree.statements);
        this.popTempScope();
        if (statements === tree.statements)
          return tree;
        return createFunctionBody(statements);
      },
      getTempIdentifier: function() {
        var name = this.getName_();
        this.tempScopeStack_[this.tempScopeStack_.length - 1].push(name);
        return name;
      },
      getName_: function() {
        return this.namePool_.length ? this.namePool_.pop() : this.identifierGenerator.generateUniqueIdentifier();
      },
      addTempVar: function() {
        var initializer = arguments[0] !== (void 0) ? arguments[0] : null;
        var vars = this.tempVarStack_[this.tempVarStack_.length - 1];
        var name = this.getName_();
        vars.push(new TempVarStatement(name, initializer));
        return name;
      },
      addTempVarForThis: function() {
        var varScope = this.tempVarStack_[this.tempVarStack_.length - 1];
        return varScope.thisName || (varScope.thisName = this.addTempVar(createThisExpression()));
      },
      addTempVarForArguments: function() {
        var varScope = this.tempVarStack_[this.tempVarStack_.length - 1];
        return varScope.argumentName || (varScope.argumentName = this.addTempVar(createIdentifierExpression(ARGUMENTS)));
      },
      pushTempScope: function() {
        this.tempScopeStack_.push(new TempScope());
      },
      popTempScope: function() {
        this.tempScopeStack_.pop().release(this);
      },
      release_: function(name) {
        this.namePool_.push(name);
      }
    }, {}, $__super);
  }(ParseTreeTransformer);
  return {get TempVarTransformer() {
      return TempVarTransformer;
    }};
});
System.registerModule("traceur@0.0.91/src/codegeneration/DestructuringTransformer.js", [], function() {
  "use strict";
  var __moduleName = "traceur@0.0.91/src/codegeneration/DestructuringTransformer.js";
  var $__0 = System.get("traceur@0.0.91/src/syntax/trees/ParseTreeType.js"),
      ARRAY_LITERAL_EXPRESSION = $__0.ARRAY_LITERAL_EXPRESSION,
      ARRAY_PATTERN = $__0.ARRAY_PATTERN,
      ASSIGNMENT_ELEMENT = $__0.ASSIGNMENT_ELEMENT,
      BINDING_ELEMENT = $__0.BINDING_ELEMENT,
      BINDING_IDENTIFIER = $__0.BINDING_IDENTIFIER,
      BLOCK = $__0.BLOCK,
      CALL_EXPRESSION = $__0.CALL_EXPRESSION,
      COMPUTED_PROPERTY_NAME = $__0.COMPUTED_PROPERTY_NAME,
      IDENTIFIER_EXPRESSION = $__0.IDENTIFIER_EXPRESSION,
      LITERAL_EXPRESSION = $__0.LITERAL_EXPRESSION,
      MEMBER_EXPRESSION = $__0.MEMBER_EXPRESSION,
      MEMBER_LOOKUP_EXPRESSION = $__0.MEMBER_LOOKUP_EXPRESSION,
      OBJECT_LITERAL_EXPRESSION = $__0.OBJECT_LITERAL_EXPRESSION,
      OBJECT_PATTERN = $__0.OBJECT_PATTERN,
      OBJECT_PATTERN_FIELD = $__0.OBJECT_PATTERN_FIELD,
      PAREN_EXPRESSION = $__0.PAREN_EXPRESSION,
      VARIABLE_DECLARATION_LIST = $__0.VARIABLE_DECLARATION_LIST;
  var $__1 = System.get("traceur@0.0.91/src/syntax/trees/ParseTrees.js"),
      AssignmentElement = $__1.AssignmentElement,
      BindingElement = $__1.BindingElement,
      Catch = $__1.Catch,
      ForInStatement = $__1.ForInStatement,
      ForOfStatement = $__1.ForOfStatement,
      ForOnStatement = $__1.ForOnStatement;
  var TempVarTransformer = System.get("traceur@0.0.91/src/codegeneration/TempVarTransformer.js").TempVarTransformer;
  var $__3 = System.get("traceur@0.0.91/src/syntax/TokenType.js"),
      EQUAL = $__3.EQUAL,
      LET = $__3.LET,
      VAR = $__3.VAR;
  var $__4 = System.get("traceur@0.0.91/src/codegeneration/ParseTreeFactory.js"),
      createAssignmentExpression = $__4.createAssignmentExpression,
      createBindingIdentifier = $__4.createBindingIdentifier,
      createBlock = $__4.createBlock,
      createCommaExpression = $__4.createCommaExpression,
      createExpressionStatement = $__4.createExpressionStatement,
      createFunctionBody = $__4.createFunctionBody,
      createIdentifierExpression = $__4.createIdentifierExpression,
      createMemberExpression = $__4.createMemberExpression,
      createMemberLookupExpression = $__4.createMemberLookupExpression,
      createParenExpression = $__4.createParenExpression,
      createVariableDeclaration = $__4.createVariableDeclaration,
      createVariableDeclarationList = $__4.createVariableDeclarationList,
      createVariableStatement = $__4.createVariableStatement;
  var parseExpression = System.get("traceur@0.0.91/src/codegeneration/PlaceholderParser.js").parseExpression;
  var prependStatements = System.get("traceur@0.0.91/src/codegeneration/PrependStatements.js").prependStatements;
  var Desugaring = function() {
    function Desugaring(rvalue) {
      this.rvalue = rvalue;
      this.expressions = [];
      this.pendingExpressions = [];
    }
    return ($traceurRuntime.createClass)(Desugaring, {
      createIterator: function(iterId) {
        this.pendingExpressions.push(parseExpression($traceurRuntime.getTemplateObject(["", " =\n            ", "[$traceurRuntime.toProperty(Symbol.iterator)]()"]), iterId, this.rvalue));
      },
      createInitializer: function(expression) {
        if (this.pendingExpressions.length === 0)
          return expression;
        var expressions = this.pendingExpressions;
        this.pendingExpressions = [];
        expressions.push(expression);
        return createParenExpression(createCommaExpression(expressions));
      },
      skipH