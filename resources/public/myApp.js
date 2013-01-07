var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6112 = x == null ? null : x;
  if(p[goog.typeOf(x__6112)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6113__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6113 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6113__delegate.call(this, array, i, idxs)
    };
    G__6113.cljs$lang$maxFixedArity = 2;
    G__6113.cljs$lang$applyTo = function(arglist__6114) {
      var array = cljs.core.first(arglist__6114);
      var i = cljs.core.first(cljs.core.next(arglist__6114));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6114));
      return G__6113__delegate(array, i, idxs)
    };
    G__6113.cljs$lang$arity$variadic = G__6113__delegate;
    return G__6113
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6199 = this$;
      if(and__3822__auto____6199) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6199
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____6200 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6201 = cljs.core._invoke[goog.typeOf(x__2363__auto____6200)];
        if(or__3824__auto____6201) {
          return or__3824__auto____6201
        }else {
          var or__3824__auto____6202 = cljs.core._invoke["_"];
          if(or__3824__auto____6202) {
            return or__3824__auto____6202
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6203 = this$;
      if(and__3822__auto____6203) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6203
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____6204 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6205 = cljs.core._invoke[goog.typeOf(x__2363__auto____6204)];
        if(or__3824__auto____6205) {
          return or__3824__auto____6205
        }else {
          var or__3824__auto____6206 = cljs.core._invoke["_"];
          if(or__3824__auto____6206) {
            return or__3824__auto____6206
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6207 = this$;
      if(and__3822__auto____6207) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6207
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____6208 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6209 = cljs.core._invoke[goog.typeOf(x__2363__auto____6208)];
        if(or__3824__auto____6209) {
          return or__3824__auto____6209
        }else {
          var or__3824__auto____6210 = cljs.core._invoke["_"];
          if(or__3824__auto____6210) {
            return or__3824__auto____6210
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6211 = this$;
      if(and__3822__auto____6211) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6211
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____6212 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6213 = cljs.core._invoke[goog.typeOf(x__2363__auto____6212)];
        if(or__3824__auto____6213) {
          return or__3824__auto____6213
        }else {
          var or__3824__auto____6214 = cljs.core._invoke["_"];
          if(or__3824__auto____6214) {
            return or__3824__auto____6214
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6215 = this$;
      if(and__3822__auto____6215) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6215
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____6216 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6217 = cljs.core._invoke[goog.typeOf(x__2363__auto____6216)];
        if(or__3824__auto____6217) {
          return or__3824__auto____6217
        }else {
          var or__3824__auto____6218 = cljs.core._invoke["_"];
          if(or__3824__auto____6218) {
            return or__3824__auto____6218
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6219 = this$;
      if(and__3822__auto____6219) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6219
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____6220 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6221 = cljs.core._invoke[goog.typeOf(x__2363__auto____6220)];
        if(or__3824__auto____6221) {
          return or__3824__auto____6221
        }else {
          var or__3824__auto____6222 = cljs.core._invoke["_"];
          if(or__3824__auto____6222) {
            return or__3824__auto____6222
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6223 = this$;
      if(and__3822__auto____6223) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6223
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____6224 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6225 = cljs.core._invoke[goog.typeOf(x__2363__auto____6224)];
        if(or__3824__auto____6225) {
          return or__3824__auto____6225
        }else {
          var or__3824__auto____6226 = cljs.core._invoke["_"];
          if(or__3824__auto____6226) {
            return or__3824__auto____6226
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6227 = this$;
      if(and__3822__auto____6227) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6227
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____6228 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6229 = cljs.core._invoke[goog.typeOf(x__2363__auto____6228)];
        if(or__3824__auto____6229) {
          return or__3824__auto____6229
        }else {
          var or__3824__auto____6230 = cljs.core._invoke["_"];
          if(or__3824__auto____6230) {
            return or__3824__auto____6230
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6231 = this$;
      if(and__3822__auto____6231) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6231
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____6232 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6233 = cljs.core._invoke[goog.typeOf(x__2363__auto____6232)];
        if(or__3824__auto____6233) {
          return or__3824__auto____6233
        }else {
          var or__3824__auto____6234 = cljs.core._invoke["_"];
          if(or__3824__auto____6234) {
            return or__3824__auto____6234
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6235 = this$;
      if(and__3822__auto____6235) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6235
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____6236 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6237 = cljs.core._invoke[goog.typeOf(x__2363__auto____6236)];
        if(or__3824__auto____6237) {
          return or__3824__auto____6237
        }else {
          var or__3824__auto____6238 = cljs.core._invoke["_"];
          if(or__3824__auto____6238) {
            return or__3824__auto____6238
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6239 = this$;
      if(and__3822__auto____6239) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6239
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____6240 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6241 = cljs.core._invoke[goog.typeOf(x__2363__auto____6240)];
        if(or__3824__auto____6241) {
          return or__3824__auto____6241
        }else {
          var or__3824__auto____6242 = cljs.core._invoke["_"];
          if(or__3824__auto____6242) {
            return or__3824__auto____6242
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6243 = this$;
      if(and__3822__auto____6243) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6243
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____6244 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6245 = cljs.core._invoke[goog.typeOf(x__2363__auto____6244)];
        if(or__3824__auto____6245) {
          return or__3824__auto____6245
        }else {
          var or__3824__auto____6246 = cljs.core._invoke["_"];
          if(or__3824__auto____6246) {
            return or__3824__auto____6246
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6247 = this$;
      if(and__3822__auto____6247) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6247
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____6248 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6249 = cljs.core._invoke[goog.typeOf(x__2363__auto____6248)];
        if(or__3824__auto____6249) {
          return or__3824__auto____6249
        }else {
          var or__3824__auto____6250 = cljs.core._invoke["_"];
          if(or__3824__auto____6250) {
            return or__3824__auto____6250
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6251 = this$;
      if(and__3822__auto____6251) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6251
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____6252 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6253 = cljs.core._invoke[goog.typeOf(x__2363__auto____6252)];
        if(or__3824__auto____6253) {
          return or__3824__auto____6253
        }else {
          var or__3824__auto____6254 = cljs.core._invoke["_"];
          if(or__3824__auto____6254) {
            return or__3824__auto____6254
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6255 = this$;
      if(and__3822__auto____6255) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6255
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____6256 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6257 = cljs.core._invoke[goog.typeOf(x__2363__auto____6256)];
        if(or__3824__auto____6257) {
          return or__3824__auto____6257
        }else {
          var or__3824__auto____6258 = cljs.core._invoke["_"];
          if(or__3824__auto____6258) {
            return or__3824__auto____6258
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6259 = this$;
      if(and__3822__auto____6259) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6259
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____6260 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6261 = cljs.core._invoke[goog.typeOf(x__2363__auto____6260)];
        if(or__3824__auto____6261) {
          return or__3824__auto____6261
        }else {
          var or__3824__auto____6262 = cljs.core._invoke["_"];
          if(or__3824__auto____6262) {
            return or__3824__auto____6262
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6263 = this$;
      if(and__3822__auto____6263) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6263
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____6264 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6265 = cljs.core._invoke[goog.typeOf(x__2363__auto____6264)];
        if(or__3824__auto____6265) {
          return or__3824__auto____6265
        }else {
          var or__3824__auto____6266 = cljs.core._invoke["_"];
          if(or__3824__auto____6266) {
            return or__3824__auto____6266
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6267 = this$;
      if(and__3822__auto____6267) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6267
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____6268 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6269 = cljs.core._invoke[goog.typeOf(x__2363__auto____6268)];
        if(or__3824__auto____6269) {
          return or__3824__auto____6269
        }else {
          var or__3824__auto____6270 = cljs.core._invoke["_"];
          if(or__3824__auto____6270) {
            return or__3824__auto____6270
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6271 = this$;
      if(and__3822__auto____6271) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6271
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____6272 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6273 = cljs.core._invoke[goog.typeOf(x__2363__auto____6272)];
        if(or__3824__auto____6273) {
          return or__3824__auto____6273
        }else {
          var or__3824__auto____6274 = cljs.core._invoke["_"];
          if(or__3824__auto____6274) {
            return or__3824__auto____6274
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6275 = this$;
      if(and__3822__auto____6275) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6275
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____6276 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6277 = cljs.core._invoke[goog.typeOf(x__2363__auto____6276)];
        if(or__3824__auto____6277) {
          return or__3824__auto____6277
        }else {
          var or__3824__auto____6278 = cljs.core._invoke["_"];
          if(or__3824__auto____6278) {
            return or__3824__auto____6278
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6279 = this$;
      if(and__3822__auto____6279) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6279
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____6280 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6281 = cljs.core._invoke[goog.typeOf(x__2363__auto____6280)];
        if(or__3824__auto____6281) {
          return or__3824__auto____6281
        }else {
          var or__3824__auto____6282 = cljs.core._invoke["_"];
          if(or__3824__auto____6282) {
            return or__3824__auto____6282
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6287 = coll;
    if(and__3822__auto____6287) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6287
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____6288 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6289 = cljs.core._count[goog.typeOf(x__2363__auto____6288)];
      if(or__3824__auto____6289) {
        return or__3824__auto____6289
      }else {
        var or__3824__auto____6290 = cljs.core._count["_"];
        if(or__3824__auto____6290) {
          return or__3824__auto____6290
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6295 = coll;
    if(and__3822__auto____6295) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6295
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____6296 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6297 = cljs.core._empty[goog.typeOf(x__2363__auto____6296)];
      if(or__3824__auto____6297) {
        return or__3824__auto____6297
      }else {
        var or__3824__auto____6298 = cljs.core._empty["_"];
        if(or__3824__auto____6298) {
          return or__3824__auto____6298
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6303 = coll;
    if(and__3822__auto____6303) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6303
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____6304 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6305 = cljs.core._conj[goog.typeOf(x__2363__auto____6304)];
      if(or__3824__auto____6305) {
        return or__3824__auto____6305
      }else {
        var or__3824__auto____6306 = cljs.core._conj["_"];
        if(or__3824__auto____6306) {
          return or__3824__auto____6306
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6315 = coll;
      if(and__3822__auto____6315) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6315
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____6316 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6317 = cljs.core._nth[goog.typeOf(x__2363__auto____6316)];
        if(or__3824__auto____6317) {
          return or__3824__auto____6317
        }else {
          var or__3824__auto____6318 = cljs.core._nth["_"];
          if(or__3824__auto____6318) {
            return or__3824__auto____6318
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6319 = coll;
      if(and__3822__auto____6319) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6319
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____6320 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6321 = cljs.core._nth[goog.typeOf(x__2363__auto____6320)];
        if(or__3824__auto____6321) {
          return or__3824__auto____6321
        }else {
          var or__3824__auto____6322 = cljs.core._nth["_"];
          if(or__3824__auto____6322) {
            return or__3824__auto____6322
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6327 = coll;
    if(and__3822__auto____6327) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6327
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____6328 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6329 = cljs.core._first[goog.typeOf(x__2363__auto____6328)];
      if(or__3824__auto____6329) {
        return or__3824__auto____6329
      }else {
        var or__3824__auto____6330 = cljs.core._first["_"];
        if(or__3824__auto____6330) {
          return or__3824__auto____6330
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6335 = coll;
    if(and__3822__auto____6335) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6335
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____6336 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6337 = cljs.core._rest[goog.typeOf(x__2363__auto____6336)];
      if(or__3824__auto____6337) {
        return or__3824__auto____6337
      }else {
        var or__3824__auto____6338 = cljs.core._rest["_"];
        if(or__3824__auto____6338) {
          return or__3824__auto____6338
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6343 = coll;
    if(and__3822__auto____6343) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6343
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____6344 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6345 = cljs.core._next[goog.typeOf(x__2363__auto____6344)];
      if(or__3824__auto____6345) {
        return or__3824__auto____6345
      }else {
        var or__3824__auto____6346 = cljs.core._next["_"];
        if(or__3824__auto____6346) {
          return or__3824__auto____6346
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6355 = o;
      if(and__3822__auto____6355) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6355
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____6356 = o == null ? null : o;
      return function() {
        var or__3824__auto____6357 = cljs.core._lookup[goog.typeOf(x__2363__auto____6356)];
        if(or__3824__auto____6357) {
          return or__3824__auto____6357
        }else {
          var or__3824__auto____6358 = cljs.core._lookup["_"];
          if(or__3824__auto____6358) {
            return or__3824__auto____6358
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6359 = o;
      if(and__3822__auto____6359) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6359
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____6360 = o == null ? null : o;
      return function() {
        var or__3824__auto____6361 = cljs.core._lookup[goog.typeOf(x__2363__auto____6360)];
        if(or__3824__auto____6361) {
          return or__3824__auto____6361
        }else {
          var or__3824__auto____6362 = cljs.core._lookup["_"];
          if(or__3824__auto____6362) {
            return or__3824__auto____6362
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6367 = coll;
    if(and__3822__auto____6367) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6367
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____6368 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6369 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____6368)];
      if(or__3824__auto____6369) {
        return or__3824__auto____6369
      }else {
        var or__3824__auto____6370 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6370) {
          return or__3824__auto____6370
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6375 = coll;
    if(and__3822__auto____6375) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6375
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____6376 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6377 = cljs.core._assoc[goog.typeOf(x__2363__auto____6376)];
      if(or__3824__auto____6377) {
        return or__3824__auto____6377
      }else {
        var or__3824__auto____6378 = cljs.core._assoc["_"];
        if(or__3824__auto____6378) {
          return or__3824__auto____6378
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6383 = coll;
    if(and__3822__auto____6383) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6383
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____6384 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6385 = cljs.core._dissoc[goog.typeOf(x__2363__auto____6384)];
      if(or__3824__auto____6385) {
        return or__3824__auto____6385
      }else {
        var or__3824__auto____6386 = cljs.core._dissoc["_"];
        if(or__3824__auto____6386) {
          return or__3824__auto____6386
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6391 = coll;
    if(and__3822__auto____6391) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6391
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____6392 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6393 = cljs.core._key[goog.typeOf(x__2363__auto____6392)];
      if(or__3824__auto____6393) {
        return or__3824__auto____6393
      }else {
        var or__3824__auto____6394 = cljs.core._key["_"];
        if(or__3824__auto____6394) {
          return or__3824__auto____6394
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6399 = coll;
    if(and__3822__auto____6399) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6399
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____6400 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6401 = cljs.core._val[goog.typeOf(x__2363__auto____6400)];
      if(or__3824__auto____6401) {
        return or__3824__auto____6401
      }else {
        var or__3824__auto____6402 = cljs.core._val["_"];
        if(or__3824__auto____6402) {
          return or__3824__auto____6402
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6407 = coll;
    if(and__3822__auto____6407) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6407
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____6408 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6409 = cljs.core._disjoin[goog.typeOf(x__2363__auto____6408)];
      if(or__3824__auto____6409) {
        return or__3824__auto____6409
      }else {
        var or__3824__auto____6410 = cljs.core._disjoin["_"];
        if(or__3824__auto____6410) {
          return or__3824__auto____6410
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6415 = coll;
    if(and__3822__auto____6415) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6415
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____6416 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6417 = cljs.core._peek[goog.typeOf(x__2363__auto____6416)];
      if(or__3824__auto____6417) {
        return or__3824__auto____6417
      }else {
        var or__3824__auto____6418 = cljs.core._peek["_"];
        if(or__3824__auto____6418) {
          return or__3824__auto____6418
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6423 = coll;
    if(and__3822__auto____6423) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6423
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____6424 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6425 = cljs.core._pop[goog.typeOf(x__2363__auto____6424)];
      if(or__3824__auto____6425) {
        return or__3824__auto____6425
      }else {
        var or__3824__auto____6426 = cljs.core._pop["_"];
        if(or__3824__auto____6426) {
          return or__3824__auto____6426
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6431 = coll;
    if(and__3822__auto____6431) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6431
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____6432 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6433 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____6432)];
      if(or__3824__auto____6433) {
        return or__3824__auto____6433
      }else {
        var or__3824__auto____6434 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6434) {
          return or__3824__auto____6434
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6439 = o;
    if(and__3822__auto____6439) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6439
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____6440 = o == null ? null : o;
    return function() {
      var or__3824__auto____6441 = cljs.core._deref[goog.typeOf(x__2363__auto____6440)];
      if(or__3824__auto____6441) {
        return or__3824__auto____6441
      }else {
        var or__3824__auto____6442 = cljs.core._deref["_"];
        if(or__3824__auto____6442) {
          return or__3824__auto____6442
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6447 = o;
    if(and__3822__auto____6447) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6447
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____6448 = o == null ? null : o;
    return function() {
      var or__3824__auto____6449 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____6448)];
      if(or__3824__auto____6449) {
        return or__3824__auto____6449
      }else {
        var or__3824__auto____6450 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6450) {
          return or__3824__auto____6450
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6455 = o;
    if(and__3822__auto____6455) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6455
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____6456 = o == null ? null : o;
    return function() {
      var or__3824__auto____6457 = cljs.core._meta[goog.typeOf(x__2363__auto____6456)];
      if(or__3824__auto____6457) {
        return or__3824__auto____6457
      }else {
        var or__3824__auto____6458 = cljs.core._meta["_"];
        if(or__3824__auto____6458) {
          return or__3824__auto____6458
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6463 = o;
    if(and__3822__auto____6463) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6463
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____6464 = o == null ? null : o;
    return function() {
      var or__3824__auto____6465 = cljs.core._with_meta[goog.typeOf(x__2363__auto____6464)];
      if(or__3824__auto____6465) {
        return or__3824__auto____6465
      }else {
        var or__3824__auto____6466 = cljs.core._with_meta["_"];
        if(or__3824__auto____6466) {
          return or__3824__auto____6466
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6475 = coll;
      if(and__3822__auto____6475) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6475
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____6476 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6477 = cljs.core._reduce[goog.typeOf(x__2363__auto____6476)];
        if(or__3824__auto____6477) {
          return or__3824__auto____6477
        }else {
          var or__3824__auto____6478 = cljs.core._reduce["_"];
          if(or__3824__auto____6478) {
            return or__3824__auto____6478
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6479 = coll;
      if(and__3822__auto____6479) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6479
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____6480 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6481 = cljs.core._reduce[goog.typeOf(x__2363__auto____6480)];
        if(or__3824__auto____6481) {
          return or__3824__auto____6481
        }else {
          var or__3824__auto____6482 = cljs.core._reduce["_"];
          if(or__3824__auto____6482) {
            return or__3824__auto____6482
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6487 = coll;
    if(and__3822__auto____6487) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6487
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____6488 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6489 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____6488)];
      if(or__3824__auto____6489) {
        return or__3824__auto____6489
      }else {
        var or__3824__auto____6490 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6490) {
          return or__3824__auto____6490
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6495 = o;
    if(and__3822__auto____6495) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6495
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____6496 = o == null ? null : o;
    return function() {
      var or__3824__auto____6497 = cljs.core._equiv[goog.typeOf(x__2363__auto____6496)];
      if(or__3824__auto____6497) {
        return or__3824__auto____6497
      }else {
        var or__3824__auto____6498 = cljs.core._equiv["_"];
        if(or__3824__auto____6498) {
          return or__3824__auto____6498
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6503 = o;
    if(and__3822__auto____6503) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6503
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____6504 = o == null ? null : o;
    return function() {
      var or__3824__auto____6505 = cljs.core._hash[goog.typeOf(x__2363__auto____6504)];
      if(or__3824__auto____6505) {
        return or__3824__auto____6505
      }else {
        var or__3824__auto____6506 = cljs.core._hash["_"];
        if(or__3824__auto____6506) {
          return or__3824__auto____6506
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6511 = o;
    if(and__3822__auto____6511) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6511
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____6512 = o == null ? null : o;
    return function() {
      var or__3824__auto____6513 = cljs.core._seq[goog.typeOf(x__2363__auto____6512)];
      if(or__3824__auto____6513) {
        return or__3824__auto____6513
      }else {
        var or__3824__auto____6514 = cljs.core._seq["_"];
        if(or__3824__auto____6514) {
          return or__3824__auto____6514
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6519 = coll;
    if(and__3822__auto____6519) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6519
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____6520 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6521 = cljs.core._rseq[goog.typeOf(x__2363__auto____6520)];
      if(or__3824__auto____6521) {
        return or__3824__auto____6521
      }else {
        var or__3824__auto____6522 = cljs.core._rseq["_"];
        if(or__3824__auto____6522) {
          return or__3824__auto____6522
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6527 = coll;
    if(and__3822__auto____6527) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6527
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____6528 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6529 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____6528)];
      if(or__3824__auto____6529) {
        return or__3824__auto____6529
      }else {
        var or__3824__auto____6530 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6530) {
          return or__3824__auto____6530
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6535 = coll;
    if(and__3822__auto____6535) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6535
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____6536 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6537 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____6536)];
      if(or__3824__auto____6537) {
        return or__3824__auto____6537
      }else {
        var or__3824__auto____6538 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6538) {
          return or__3824__auto____6538
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6543 = coll;
    if(and__3822__auto____6543) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6543
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____6544 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6545 = cljs.core._entry_key[goog.typeOf(x__2363__auto____6544)];
      if(or__3824__auto____6545) {
        return or__3824__auto____6545
      }else {
        var or__3824__auto____6546 = cljs.core._entry_key["_"];
        if(or__3824__auto____6546) {
          return or__3824__auto____6546
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6551 = coll;
    if(and__3822__auto____6551) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6551
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____6552 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6553 = cljs.core._comparator[goog.typeOf(x__2363__auto____6552)];
      if(or__3824__auto____6553) {
        return or__3824__auto____6553
      }else {
        var or__3824__auto____6554 = cljs.core._comparator["_"];
        if(or__3824__auto____6554) {
          return or__3824__auto____6554
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6559 = o;
    if(and__3822__auto____6559) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6559
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____6560 = o == null ? null : o;
    return function() {
      var or__3824__auto____6561 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____6560)];
      if(or__3824__auto____6561) {
        return or__3824__auto____6561
      }else {
        var or__3824__auto____6562 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6562) {
          return or__3824__auto____6562
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6567 = d;
    if(and__3822__auto____6567) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6567
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____6568 = d == null ? null : d;
    return function() {
      var or__3824__auto____6569 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____6568)];
      if(or__3824__auto____6569) {
        return or__3824__auto____6569
      }else {
        var or__3824__auto____6570 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6570) {
          return or__3824__auto____6570
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6575 = this$;
    if(and__3822__auto____6575) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6575
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____6576 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6577 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____6576)];
      if(or__3824__auto____6577) {
        return or__3824__auto____6577
      }else {
        var or__3824__auto____6578 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6578) {
          return or__3824__auto____6578
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6583 = this$;
    if(and__3822__auto____6583) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6583
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____6584 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6585 = cljs.core._add_watch[goog.typeOf(x__2363__auto____6584)];
      if(or__3824__auto____6585) {
        return or__3824__auto____6585
      }else {
        var or__3824__auto____6586 = cljs.core._add_watch["_"];
        if(or__3824__auto____6586) {
          return or__3824__auto____6586
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6591 = this$;
    if(and__3822__auto____6591) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6591
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____6592 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6593 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____6592)];
      if(or__3824__auto____6593) {
        return or__3824__auto____6593
      }else {
        var or__3824__auto____6594 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6594) {
          return or__3824__auto____6594
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____6599 = coll;
    if(and__3822__auto____6599) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6599
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____6600 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6601 = cljs.core._as_transient[goog.typeOf(x__2363__auto____6600)];
      if(or__3824__auto____6601) {
        return or__3824__auto____6601
      }else {
        var or__3824__auto____6602 = cljs.core._as_transient["_"];
        if(or__3824__auto____6602) {
          return or__3824__auto____6602
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____6607 = tcoll;
    if(and__3822__auto____6607) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6607
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____6608 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6609 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____6608)];
      if(or__3824__auto____6609) {
        return or__3824__auto____6609
      }else {
        var or__3824__auto____6610 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6610) {
          return or__3824__auto____6610
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6615 = tcoll;
    if(and__3822__auto____6615) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6615
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6616 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6617 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____6616)];
      if(or__3824__auto____6617) {
        return or__3824__auto____6617
      }else {
        var or__3824__auto____6618 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6618) {
          return or__3824__auto____6618
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____6623 = tcoll;
    if(and__3822__auto____6623) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6623
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____6624 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6625 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____6624)];
      if(or__3824__auto____6625) {
        return or__3824__auto____6625
      }else {
        var or__3824__auto____6626 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6626) {
          return or__3824__auto____6626
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____6631 = tcoll;
    if(and__3822__auto____6631) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6631
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____6632 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6633 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____6632)];
      if(or__3824__auto____6633) {
        return or__3824__auto____6633
      }else {
        var or__3824__auto____6634 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6634) {
          return or__3824__auto____6634
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____6639 = tcoll;
    if(and__3822__auto____6639) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6639
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____6640 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6641 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____6640)];
      if(or__3824__auto____6641) {
        return or__3824__auto____6641
      }else {
        var or__3824__auto____6642 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6642) {
          return or__3824__auto____6642
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6647 = tcoll;
    if(and__3822__auto____6647) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6647
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6648 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6649 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____6648)];
      if(or__3824__auto____6649) {
        return or__3824__auto____6649
      }else {
        var or__3824__auto____6650 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6650) {
          return or__3824__auto____6650
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____6655 = tcoll;
    if(and__3822__auto____6655) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6655
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____6656 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6657 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____6656)];
      if(or__3824__auto____6657) {
        return or__3824__auto____6657
      }else {
        var or__3824__auto____6658 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6658) {
          return or__3824__auto____6658
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____6663 = x;
    if(and__3822__auto____6663) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6663
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____6664 = x == null ? null : x;
    return function() {
      var or__3824__auto____6665 = cljs.core._compare[goog.typeOf(x__2363__auto____6664)];
      if(or__3824__auto____6665) {
        return or__3824__auto____6665
      }else {
        var or__3824__auto____6666 = cljs.core._compare["_"];
        if(or__3824__auto____6666) {
          return or__3824__auto____6666
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____6671 = coll;
    if(and__3822__auto____6671) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6671
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____6672 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6673 = cljs.core._drop_first[goog.typeOf(x__2363__auto____6672)];
      if(or__3824__auto____6673) {
        return or__3824__auto____6673
      }else {
        var or__3824__auto____6674 = cljs.core._drop_first["_"];
        if(or__3824__auto____6674) {
          return or__3824__auto____6674
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____6679 = coll;
    if(and__3822__auto____6679) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6679
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____6680 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6681 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____6680)];
      if(or__3824__auto____6681) {
        return or__3824__auto____6681
      }else {
        var or__3824__auto____6682 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6682) {
          return or__3824__auto____6682
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6687 = coll;
    if(and__3822__auto____6687) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6687
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____6688 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6689 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____6688)];
      if(or__3824__auto____6689) {
        return or__3824__auto____6689
      }else {
        var or__3824__auto____6690 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6690) {
          return or__3824__auto____6690
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____6695 = coll;
    if(and__3822__auto____6695) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6695
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____6696 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6697 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____6696)];
      if(or__3824__auto____6697) {
        return or__3824__auto____6697
      }else {
        var or__3824__auto____6698 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6698) {
          return or__3824__auto____6698
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____6700 = x === y;
    if(or__3824__auto____6700) {
      return or__3824__auto____6700
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6701__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6702 = y;
            var G__6703 = cljs.core.first.call(null, more);
            var G__6704 = cljs.core.next.call(null, more);
            x = G__6702;
            y = G__6703;
            more = G__6704;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6701 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6701__delegate.call(this, x, y, more)
    };
    G__6701.cljs$lang$maxFixedArity = 2;
    G__6701.cljs$lang$applyTo = function(arglist__6705) {
      var x = cljs.core.first(arglist__6705);
      var y = cljs.core.first(cljs.core.next(arglist__6705));
      var more = cljs.core.rest(cljs.core.next(arglist__6705));
      return G__6701__delegate(x, y, more)
    };
    G__6701.cljs$lang$arity$variadic = G__6701__delegate;
    return G__6701
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6706 = null;
  var G__6706__2 = function(o, k) {
    return null
  };
  var G__6706__3 = function(o, k, not_found) {
    return not_found
  };
  G__6706 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6706__2.call(this, o, k);
      case 3:
        return G__6706__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6706
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6707 = null;
  var G__6707__2 = function(_, f) {
    return f.call(null)
  };
  var G__6707__3 = function(_, f, start) {
    return start
  };
  G__6707 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6707__2.call(this, _, f);
      case 3:
        return G__6707__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6707
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6708 = null;
  var G__6708__2 = function(_, n) {
    return null
  };
  var G__6708__3 = function(_, n, not_found) {
    return not_found
  };
  G__6708 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6708__2.call(this, _, n);
      case 3:
        return G__6708__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6708
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____6709 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6709) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6709
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6722 = cljs.core._count.call(null, cicoll);
    if(cnt__6722 === 0) {
      return f.call(null)
    }else {
      var val__6723 = cljs.core._nth.call(null, cicoll, 0);
      var n__6724 = 1;
      while(true) {
        if(n__6724 < cnt__6722) {
          var nval__6725 = f.call(null, val__6723, cljs.core._nth.call(null, cicoll, n__6724));
          if(cljs.core.reduced_QMARK_.call(null, nval__6725)) {
            return cljs.core.deref.call(null, nval__6725)
          }else {
            var G__6734 = nval__6725;
            var G__6735 = n__6724 + 1;
            val__6723 = G__6734;
            n__6724 = G__6735;
            continue
          }
        }else {
          return val__6723
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6726 = cljs.core._count.call(null, cicoll);
    var val__6727 = val;
    var n__6728 = 0;
    while(true) {
      if(n__6728 < cnt__6726) {
        var nval__6729 = f.call(null, val__6727, cljs.core._nth.call(null, cicoll, n__6728));
        if(cljs.core.reduced_QMARK_.call(null, nval__6729)) {
          return cljs.core.deref.call(null, nval__6729)
        }else {
          var G__6736 = nval__6729;
          var G__6737 = n__6728 + 1;
          val__6727 = G__6736;
          n__6728 = G__6737;
          continue
        }
      }else {
        return val__6727
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6730 = cljs.core._count.call(null, cicoll);
    var val__6731 = val;
    var n__6732 = idx;
    while(true) {
      if(n__6732 < cnt__6730) {
        var nval__6733 = f.call(null, val__6731, cljs.core._nth.call(null, cicoll, n__6732));
        if(cljs.core.reduced_QMARK_.call(null, nval__6733)) {
          return cljs.core.deref.call(null, nval__6733)
        }else {
          var G__6738 = nval__6733;
          var G__6739 = n__6732 + 1;
          val__6731 = G__6738;
          n__6732 = G__6739;
          continue
        }
      }else {
        return val__6731
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6752 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6753 = arr[0];
      var n__6754 = 1;
      while(true) {
        if(n__6754 < cnt__6752) {
          var nval__6755 = f.call(null, val__6753, arr[n__6754]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6755)) {
            return cljs.core.deref.call(null, nval__6755)
          }else {
            var G__6764 = nval__6755;
            var G__6765 = n__6754 + 1;
            val__6753 = G__6764;
            n__6754 = G__6765;
            continue
          }
        }else {
          return val__6753
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6756 = arr.length;
    var val__6757 = val;
    var n__6758 = 0;
    while(true) {
      if(n__6758 < cnt__6756) {
        var nval__6759 = f.call(null, val__6757, arr[n__6758]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6759)) {
          return cljs.core.deref.call(null, nval__6759)
        }else {
          var G__6766 = nval__6759;
          var G__6767 = n__6758 + 1;
          val__6757 = G__6766;
          n__6758 = G__6767;
          continue
        }
      }else {
        return val__6757
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6760 = arr.length;
    var val__6761 = val;
    var n__6762 = idx;
    while(true) {
      if(n__6762 < cnt__6760) {
        var nval__6763 = f.call(null, val__6761, arr[n__6762]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6763)) {
          return cljs.core.deref.call(null, nval__6763)
        }else {
          var G__6768 = nval__6763;
          var G__6769 = n__6762 + 1;
          val__6761 = G__6768;
          n__6762 = G__6769;
          continue
        }
      }else {
        return val__6761
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6770 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6771 = this;
  if(this__6771.i + 1 < this__6771.a.length) {
    return new cljs.core.IndexedSeq(this__6771.a, this__6771.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6772 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6773 = this;
  var c__6774 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6774 > 0) {
    return new cljs.core.RSeq(coll, c__6774 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6775 = this;
  var this__6776 = this;
  return cljs.core.pr_str.call(null, this__6776)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6777 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6777.a)) {
    return cljs.core.ci_reduce.call(null, this__6777.a, f, this__6777.a[this__6777.i], this__6777.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6777.a[this__6777.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6778 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6778.a)) {
    return cljs.core.ci_reduce.call(null, this__6778.a, f, start, this__6778.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6779 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6780 = this;
  return this__6780.a.length - this__6780.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6781 = this;
  return this__6781.a[this__6781.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6782 = this;
  if(this__6782.i + 1 < this__6782.a.length) {
    return new cljs.core.IndexedSeq(this__6782.a, this__6782.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6783 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6784 = this;
  var i__6785 = n + this__6784.i;
  if(i__6785 < this__6784.a.length) {
    return this__6784.a[i__6785]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6786 = this;
  var i__6787 = n + this__6786.i;
  if(i__6787 < this__6786.a.length) {
    return this__6786.a[i__6787]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6788 = null;
  var G__6788__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6788__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6788 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6788__2.call(this, array, f);
      case 3:
        return G__6788__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6788
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6789 = null;
  var G__6789__2 = function(array, k) {
    return array[k]
  };
  var G__6789__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6789 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6789__2.call(this, array, k);
      case 3:
        return G__6789__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6789
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6790 = null;
  var G__6790__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6790__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6790 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6790__2.call(this, array, n);
      case 3:
        return G__6790__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6790
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6791 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6792 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6793 = this;
  var this__6794 = this;
  return cljs.core.pr_str.call(null, this__6794)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6795 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6796 = this;
  return this__6796.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6797 = this;
  return cljs.core._nth.call(null, this__6797.ci, this__6797.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6798 = this;
  if(this__6798.i > 0) {
    return new cljs.core.RSeq(this__6798.ci, this__6798.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6799 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6800 = this;
  return new cljs.core.RSeq(this__6800.ci, this__6800.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6801 = this;
  return this__6801.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6805__6806 = coll;
      if(G__6805__6806) {
        if(function() {
          var or__3824__auto____6807 = G__6805__6806.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6807) {
            return or__3824__auto____6807
          }else {
            return G__6805__6806.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6805__6806.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6805__6806)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6805__6806)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6812__6813 = coll;
      if(G__6812__6813) {
        if(function() {
          var or__3824__auto____6814 = G__6812__6813.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6814) {
            return or__3824__auto____6814
          }else {
            return G__6812__6813.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6812__6813.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6812__6813)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6812__6813)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6815 = cljs.core.seq.call(null, coll);
      if(s__6815 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6815)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6820__6821 = coll;
      if(G__6820__6821) {
        if(function() {
          var or__3824__auto____6822 = G__6820__6821.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6822) {
            return or__3824__auto____6822
          }else {
            return G__6820__6821.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6820__6821.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6820__6821)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6820__6821)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6823 = cljs.core.seq.call(null, coll);
      if(!(s__6823 == null)) {
        return cljs.core._rest.call(null, s__6823)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6827__6828 = coll;
      if(G__6827__6828) {
        if(function() {
          var or__3824__auto____6829 = G__6827__6828.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6829) {
            return or__3824__auto____6829
          }else {
            return G__6827__6828.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6827__6828.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6827__6828)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6827__6828)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6831 = cljs.core.next.call(null, s);
    if(!(sn__6831 == null)) {
      var G__6832 = sn__6831;
      s = G__6832;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6833__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6834 = conj.call(null, coll, x);
          var G__6835 = cljs.core.first.call(null, xs);
          var G__6836 = cljs.core.next.call(null, xs);
          coll = G__6834;
          x = G__6835;
          xs = G__6836;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6833 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6833__delegate.call(this, coll, x, xs)
    };
    G__6833.cljs$lang$maxFixedArity = 2;
    G__6833.cljs$lang$applyTo = function(arglist__6837) {
      var coll = cljs.core.first(arglist__6837);
      var x = cljs.core.first(cljs.core.next(arglist__6837));
      var xs = cljs.core.rest(cljs.core.next(arglist__6837));
      return G__6833__delegate(coll, x, xs)
    };
    G__6833.cljs$lang$arity$variadic = G__6833__delegate;
    return G__6833
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6840 = cljs.core.seq.call(null, coll);
  var acc__6841 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6840)) {
      return acc__6841 + cljs.core._count.call(null, s__6840)
    }else {
      var G__6842 = cljs.core.next.call(null, s__6840);
      var G__6843 = acc__6841 + 1;
      s__6840 = G__6842;
      acc__6841 = G__6843;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6850__6851 = coll;
        if(G__6850__6851) {
          if(function() {
            var or__3824__auto____6852 = G__6850__6851.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6852) {
              return or__3824__auto____6852
            }else {
              return G__6850__6851.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6850__6851.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6850__6851)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6850__6851)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6853__6854 = coll;
        if(G__6853__6854) {
          if(function() {
            var or__3824__auto____6855 = G__6853__6854.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6855) {
              return or__3824__auto____6855
            }else {
              return G__6853__6854.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6853__6854.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6853__6854)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6853__6854)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6858__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6857 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6859 = ret__6857;
          var G__6860 = cljs.core.first.call(null, kvs);
          var G__6861 = cljs.core.second.call(null, kvs);
          var G__6862 = cljs.core.nnext.call(null, kvs);
          coll = G__6859;
          k = G__6860;
          v = G__6861;
          kvs = G__6862;
          continue
        }else {
          return ret__6857
        }
        break
      }
    };
    var G__6858 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6858__delegate.call(this, coll, k, v, kvs)
    };
    G__6858.cljs$lang$maxFixedArity = 3;
    G__6858.cljs$lang$applyTo = function(arglist__6863) {
      var coll = cljs.core.first(arglist__6863);
      var k = cljs.core.first(cljs.core.next(arglist__6863));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6863)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6863)));
      return G__6858__delegate(coll, k, v, kvs)
    };
    G__6858.cljs$lang$arity$variadic = G__6858__delegate;
    return G__6858
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6866__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6865 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6867 = ret__6865;
          var G__6868 = cljs.core.first.call(null, ks);
          var G__6869 = cljs.core.next.call(null, ks);
          coll = G__6867;
          k = G__6868;
          ks = G__6869;
          continue
        }else {
          return ret__6865
        }
        break
      }
    };
    var G__6866 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6866__delegate.call(this, coll, k, ks)
    };
    G__6866.cljs$lang$maxFixedArity = 2;
    G__6866.cljs$lang$applyTo = function(arglist__6870) {
      var coll = cljs.core.first(arglist__6870);
      var k = cljs.core.first(cljs.core.next(arglist__6870));
      var ks = cljs.core.rest(cljs.core.next(arglist__6870));
      return G__6866__delegate(coll, k, ks)
    };
    G__6866.cljs$lang$arity$variadic = G__6866__delegate;
    return G__6866
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6874__6875 = o;
    if(G__6874__6875) {
      if(function() {
        var or__3824__auto____6876 = G__6874__6875.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6876) {
          return or__3824__auto____6876
        }else {
          return G__6874__6875.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6874__6875.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6874__6875)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6874__6875)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6879__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6878 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6880 = ret__6878;
          var G__6881 = cljs.core.first.call(null, ks);
          var G__6882 = cljs.core.next.call(null, ks);
          coll = G__6880;
          k = G__6881;
          ks = G__6882;
          continue
        }else {
          return ret__6878
        }
        break
      }
    };
    var G__6879 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6879__delegate.call(this, coll, k, ks)
    };
    G__6879.cljs$lang$maxFixedArity = 2;
    G__6879.cljs$lang$applyTo = function(arglist__6883) {
      var coll = cljs.core.first(arglist__6883);
      var k = cljs.core.first(cljs.core.next(arglist__6883));
      var ks = cljs.core.rest(cljs.core.next(arglist__6883));
      return G__6879__delegate(coll, k, ks)
    };
    G__6879.cljs$lang$arity$variadic = G__6879__delegate;
    return G__6879
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6885 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6885;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6885
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6887 = cljs.core.string_hash_cache[k];
  if(!(h__6887 == null)) {
    return h__6887
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____6889 = goog.isString(o);
      if(and__3822__auto____6889) {
        return check_cache
      }else {
        return and__3822__auto____6889
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6893__6894 = x;
    if(G__6893__6894) {
      if(function() {
        var or__3824__auto____6895 = G__6893__6894.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6895) {
          return or__3824__auto____6895
        }else {
          return G__6893__6894.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6893__6894.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6893__6894)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6893__6894)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6899__6900 = x;
    if(G__6899__6900) {
      if(function() {
        var or__3824__auto____6901 = G__6899__6900.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6901) {
          return or__3824__auto____6901
        }else {
          return G__6899__6900.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6899__6900.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6899__6900)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6899__6900)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6905__6906 = x;
  if(G__6905__6906) {
    if(function() {
      var or__3824__auto____6907 = G__6905__6906.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6907) {
        return or__3824__auto____6907
      }else {
        return G__6905__6906.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6905__6906.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6905__6906)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6905__6906)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6911__6912 = x;
  if(G__6911__6912) {
    if(function() {
      var or__3824__auto____6913 = G__6911__6912.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6913) {
        return or__3824__auto____6913
      }else {
        return G__6911__6912.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6911__6912.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6911__6912)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6911__6912)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6917__6918 = x;
  if(G__6917__6918) {
    if(function() {
      var or__3824__auto____6919 = G__6917__6918.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6919) {
        return or__3824__auto____6919
      }else {
        return G__6917__6918.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6917__6918.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6917__6918)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6917__6918)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6923__6924 = x;
  if(G__6923__6924) {
    if(function() {
      var or__3824__auto____6925 = G__6923__6924.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6925) {
        return or__3824__auto____6925
      }else {
        return G__6923__6924.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6923__6924.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6923__6924)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6923__6924)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6929__6930 = x;
  if(G__6929__6930) {
    if(function() {
      var or__3824__auto____6931 = G__6929__6930.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6931) {
        return or__3824__auto____6931
      }else {
        return G__6929__6930.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6929__6930.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6929__6930)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6929__6930)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6935__6936 = x;
    if(G__6935__6936) {
      if(function() {
        var or__3824__auto____6937 = G__6935__6936.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6937) {
          return or__3824__auto____6937
        }else {
          return G__6935__6936.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6935__6936.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6935__6936)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6935__6936)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6941__6942 = x;
  if(G__6941__6942) {
    if(function() {
      var or__3824__auto____6943 = G__6941__6942.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6943) {
        return or__3824__auto____6943
      }else {
        return G__6941__6942.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6941__6942.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6941__6942)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6941__6942)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6947__6948 = x;
  if(G__6947__6948) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6949 = null;
      if(cljs.core.truth_(or__3824__auto____6949)) {
        return or__3824__auto____6949
      }else {
        return G__6947__6948.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6947__6948.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6947__6948)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6947__6948)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6950__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6950 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6950__delegate.call(this, keyvals)
    };
    G__6950.cljs$lang$maxFixedArity = 0;
    G__6950.cljs$lang$applyTo = function(arglist__6951) {
      var keyvals = cljs.core.seq(arglist__6951);
      return G__6950__delegate(keyvals)
    };
    G__6950.cljs$lang$arity$variadic = G__6950__delegate;
    return G__6950
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6953 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6953.push(key)
  });
  return keys__6953
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6957 = i;
  var j__6958 = j;
  var len__6959 = len;
  while(true) {
    if(len__6959 === 0) {
      return to
    }else {
      to[j__6958] = from[i__6957];
      var G__6960 = i__6957 + 1;
      var G__6961 = j__6958 + 1;
      var G__6962 = len__6959 - 1;
      i__6957 = G__6960;
      j__6958 = G__6961;
      len__6959 = G__6962;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6966 = i + (len - 1);
  var j__6967 = j + (len - 1);
  var len__6968 = len;
  while(true) {
    if(len__6968 === 0) {
      return to
    }else {
      to[j__6967] = from[i__6966];
      var G__6969 = i__6966 - 1;
      var G__6970 = j__6967 - 1;
      var G__6971 = len__6968 - 1;
      i__6966 = G__6969;
      j__6967 = G__6970;
      len__6968 = G__6971;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6975__6976 = s;
    if(G__6975__6976) {
      if(function() {
        var or__3824__auto____6977 = G__6975__6976.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____6977) {
          return or__3824__auto____6977
        }else {
          return G__6975__6976.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6975__6976.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6975__6976)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6975__6976)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6981__6982 = s;
  if(G__6981__6982) {
    if(function() {
      var or__3824__auto____6983 = G__6981__6982.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____6983) {
        return or__3824__auto____6983
      }else {
        return G__6981__6982.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6981__6982.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6981__6982)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6981__6982)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____6986 = goog.isString(x);
  if(and__3822__auto____6986) {
    return!function() {
      var or__3824__auto____6987 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____6987) {
        return or__3824__auto____6987
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____6986
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____6989 = goog.isString(x);
  if(and__3822__auto____6989) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____6989
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____6991 = goog.isString(x);
  if(and__3822__auto____6991) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____6991
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____6996 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____6996) {
    return or__3824__auto____6996
  }else {
    var G__6997__6998 = f;
    if(G__6997__6998) {
      if(function() {
        var or__3824__auto____6999 = G__6997__6998.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____6999) {
          return or__3824__auto____6999
        }else {
          return G__6997__6998.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6997__6998.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6997__6998)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6997__6998)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7001 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7001) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7001
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7004 = coll;
    if(cljs.core.truth_(and__3822__auto____7004)) {
      var and__3822__auto____7005 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7005) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7005
      }
    }else {
      return and__3822__auto____7004
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7014__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7010 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7011 = more;
        while(true) {
          var x__7012 = cljs.core.first.call(null, xs__7011);
          var etc__7013 = cljs.core.next.call(null, xs__7011);
          if(cljs.core.truth_(xs__7011)) {
            if(cljs.core.contains_QMARK_.call(null, s__7010, x__7012)) {
              return false
            }else {
              var G__7015 = cljs.core.conj.call(null, s__7010, x__7012);
              var G__7016 = etc__7013;
              s__7010 = G__7015;
              xs__7011 = G__7016;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7014 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7014__delegate.call(this, x, y, more)
    };
    G__7014.cljs$lang$maxFixedArity = 2;
    G__7014.cljs$lang$applyTo = function(arglist__7017) {
      var x = cljs.core.first(arglist__7017);
      var y = cljs.core.first(cljs.core.next(arglist__7017));
      var more = cljs.core.rest(cljs.core.next(arglist__7017));
      return G__7014__delegate(x, y, more)
    };
    G__7014.cljs$lang$arity$variadic = G__7014__delegate;
    return G__7014
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7021__7022 = x;
            if(G__7021__7022) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7023 = null;
                if(cljs.core.truth_(or__3824__auto____7023)) {
                  return or__3824__auto____7023
                }else {
                  return G__7021__7022.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7021__7022.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7021__7022)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7021__7022)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7028 = cljs.core.count.call(null, xs);
    var yl__7029 = cljs.core.count.call(null, ys);
    if(xl__7028 < yl__7029) {
      return-1
    }else {
      if(xl__7028 > yl__7029) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7028, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7030 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7031 = d__7030 === 0;
        if(and__3822__auto____7031) {
          return n + 1 < len
        }else {
          return and__3822__auto____7031
        }
      }()) {
        var G__7032 = xs;
        var G__7033 = ys;
        var G__7034 = len;
        var G__7035 = n + 1;
        xs = G__7032;
        ys = G__7033;
        len = G__7034;
        n = G__7035;
        continue
      }else {
        return d__7030
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7037 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7037)) {
        return r__7037
      }else {
        if(cljs.core.truth_(r__7037)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7039 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7039, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7039)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7045 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7045) {
      var s__7046 = temp__3971__auto____7045;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7046), cljs.core.next.call(null, s__7046))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7047 = val;
    var coll__7048 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7048) {
        var nval__7049 = f.call(null, val__7047, cljs.core.first.call(null, coll__7048));
        if(cljs.core.reduced_QMARK_.call(null, nval__7049)) {
          return cljs.core.deref.call(null, nval__7049)
        }else {
          var G__7050 = nval__7049;
          var G__7051 = cljs.core.next.call(null, coll__7048);
          val__7047 = G__7050;
          coll__7048 = G__7051;
          continue
        }
      }else {
        return val__7047
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7053 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7053);
  return cljs.core.vec.call(null, a__7053)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7060__7061 = coll;
      if(G__7060__7061) {
        if(function() {
          var or__3824__auto____7062 = G__7060__7061.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7062) {
            return or__3824__auto____7062
          }else {
            return G__7060__7061.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7060__7061.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7060__7061)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7060__7061)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7063__7064 = coll;
      if(G__7063__7064) {
        if(function() {
          var or__3824__auto____7065 = G__7063__7064.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7065) {
            return or__3824__auto____7065
          }else {
            return G__7063__7064.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7063__7064.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7063__7064)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7063__7064)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7066 = this;
  return this__7066.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7067__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7067 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7067__delegate.call(this, x, y, more)
    };
    G__7067.cljs$lang$maxFixedArity = 2;
    G__7067.cljs$lang$applyTo = function(arglist__7068) {
      var x = cljs.core.first(arglist__7068);
      var y = cljs.core.first(cljs.core.next(arglist__7068));
      var more = cljs.core.rest(cljs.core.next(arglist__7068));
      return G__7067__delegate(x, y, more)
    };
    G__7067.cljs$lang$arity$variadic = G__7067__delegate;
    return G__7067
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7069__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7069 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7069__delegate.call(this, x, y, more)
    };
    G__7069.cljs$lang$maxFixedArity = 2;
    G__7069.cljs$lang$applyTo = function(arglist__7070) {
      var x = cljs.core.first(arglist__7070);
      var y = cljs.core.first(cljs.core.next(arglist__7070));
      var more = cljs.core.rest(cljs.core.next(arglist__7070));
      return G__7069__delegate(x, y, more)
    };
    G__7069.cljs$lang$arity$variadic = G__7069__delegate;
    return G__7069
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7071__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7071 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7071__delegate.call(this, x, y, more)
    };
    G__7071.cljs$lang$maxFixedArity = 2;
    G__7071.cljs$lang$applyTo = function(arglist__7072) {
      var x = cljs.core.first(arglist__7072);
      var y = cljs.core.first(cljs.core.next(arglist__7072));
      var more = cljs.core.rest(cljs.core.next(arglist__7072));
      return G__7071__delegate(x, y, more)
    };
    G__7071.cljs$lang$arity$variadic = G__7071__delegate;
    return G__7071
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7073__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7073 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7073__delegate.call(this, x, y, more)
    };
    G__7073.cljs$lang$maxFixedArity = 2;
    G__7073.cljs$lang$applyTo = function(arglist__7074) {
      var x = cljs.core.first(arglist__7074);
      var y = cljs.core.first(cljs.core.next(arglist__7074));
      var more = cljs.core.rest(cljs.core.next(arglist__7074));
      return G__7073__delegate(x, y, more)
    };
    G__7073.cljs$lang$arity$variadic = G__7073__delegate;
    return G__7073
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7075__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7076 = y;
            var G__7077 = cljs.core.first.call(null, more);
            var G__7078 = cljs.core.next.call(null, more);
            x = G__7076;
            y = G__7077;
            more = G__7078;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7075 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7075__delegate.call(this, x, y, more)
    };
    G__7075.cljs$lang$maxFixedArity = 2;
    G__7075.cljs$lang$applyTo = function(arglist__7079) {
      var x = cljs.core.first(arglist__7079);
      var y = cljs.core.first(cljs.core.next(arglist__7079));
      var more = cljs.core.rest(cljs.core.next(arglist__7079));
      return G__7075__delegate(x, y, more)
    };
    G__7075.cljs$lang$arity$variadic = G__7075__delegate;
    return G__7075
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7080__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7081 = y;
            var G__7082 = cljs.core.first.call(null, more);
            var G__7083 = cljs.core.next.call(null, more);
            x = G__7081;
            y = G__7082;
            more = G__7083;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7080 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7080__delegate.call(this, x, y, more)
    };
    G__7080.cljs$lang$maxFixedArity = 2;
    G__7080.cljs$lang$applyTo = function(arglist__7084) {
      var x = cljs.core.first(arglist__7084);
      var y = cljs.core.first(cljs.core.next(arglist__7084));
      var more = cljs.core.rest(cljs.core.next(arglist__7084));
      return G__7080__delegate(x, y, more)
    };
    G__7080.cljs$lang$arity$variadic = G__7080__delegate;
    return G__7080
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7085__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7086 = y;
            var G__7087 = cljs.core.first.call(null, more);
            var G__7088 = cljs.core.next.call(null, more);
            x = G__7086;
            y = G__7087;
            more = G__7088;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7085 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7085__delegate.call(this, x, y, more)
    };
    G__7085.cljs$lang$maxFixedArity = 2;
    G__7085.cljs$lang$applyTo = function(arglist__7089) {
      var x = cljs.core.first(arglist__7089);
      var y = cljs.core.first(cljs.core.next(arglist__7089));
      var more = cljs.core.rest(cljs.core.next(arglist__7089));
      return G__7085__delegate(x, y, more)
    };
    G__7085.cljs$lang$arity$variadic = G__7085__delegate;
    return G__7085
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7090__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7091 = y;
            var G__7092 = cljs.core.first.call(null, more);
            var G__7093 = cljs.core.next.call(null, more);
            x = G__7091;
            y = G__7092;
            more = G__7093;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7090 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7090__delegate.call(this, x, y, more)
    };
    G__7090.cljs$lang$maxFixedArity = 2;
    G__7090.cljs$lang$applyTo = function(arglist__7094) {
      var x = cljs.core.first(arglist__7094);
      var y = cljs.core.first(cljs.core.next(arglist__7094));
      var more = cljs.core.rest(cljs.core.next(arglist__7094));
      return G__7090__delegate(x, y, more)
    };
    G__7090.cljs$lang$arity$variadic = G__7090__delegate;
    return G__7090
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7095__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7095 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7095__delegate.call(this, x, y, more)
    };
    G__7095.cljs$lang$maxFixedArity = 2;
    G__7095.cljs$lang$applyTo = function(arglist__7096) {
      var x = cljs.core.first(arglist__7096);
      var y = cljs.core.first(cljs.core.next(arglist__7096));
      var more = cljs.core.rest(cljs.core.next(arglist__7096));
      return G__7095__delegate(x, y, more)
    };
    G__7095.cljs$lang$arity$variadic = G__7095__delegate;
    return G__7095
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7097__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7097 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7097__delegate.call(this, x, y, more)
    };
    G__7097.cljs$lang$maxFixedArity = 2;
    G__7097.cljs$lang$applyTo = function(arglist__7098) {
      var x = cljs.core.first(arglist__7098);
      var y = cljs.core.first(cljs.core.next(arglist__7098));
      var more = cljs.core.rest(cljs.core.next(arglist__7098));
      return G__7097__delegate(x, y, more)
    };
    G__7097.cljs$lang$arity$variadic = G__7097__delegate;
    return G__7097
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7100 = n % d;
  return cljs.core.fix.call(null, (n - rem__7100) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7102 = cljs.core.quot.call(null, n, d);
  return n - d * q__7102
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7105 = v - (v >> 1 & 1431655765);
  var v__7106 = (v__7105 & 858993459) + (v__7105 >> 2 & 858993459);
  return(v__7106 + (v__7106 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7107__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7108 = y;
            var G__7109 = cljs.core.first.call(null, more);
            var G__7110 = cljs.core.next.call(null, more);
            x = G__7108;
            y = G__7109;
            more = G__7110;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7107 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7107__delegate.call(this, x, y, more)
    };
    G__7107.cljs$lang$maxFixedArity = 2;
    G__7107.cljs$lang$applyTo = function(arglist__7111) {
      var x = cljs.core.first(arglist__7111);
      var y = cljs.core.first(cljs.core.next(arglist__7111));
      var more = cljs.core.rest(cljs.core.next(arglist__7111));
      return G__7107__delegate(x, y, more)
    };
    G__7107.cljs$lang$arity$variadic = G__7107__delegate;
    return G__7107
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7115 = n;
  var xs__7116 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7117 = xs__7116;
      if(and__3822__auto____7117) {
        return n__7115 > 0
      }else {
        return and__3822__auto____7117
      }
    }())) {
      var G__7118 = n__7115 - 1;
      var G__7119 = cljs.core.next.call(null, xs__7116);
      n__7115 = G__7118;
      xs__7116 = G__7119;
      continue
    }else {
      return xs__7116
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7120__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7121 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7122 = cljs.core.next.call(null, more);
            sb = G__7121;
            more = G__7122;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7120 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7120__delegate.call(this, x, ys)
    };
    G__7120.cljs$lang$maxFixedArity = 1;
    G__7120.cljs$lang$applyTo = function(arglist__7123) {
      var x = cljs.core.first(arglist__7123);
      var ys = cljs.core.rest(arglist__7123);
      return G__7120__delegate(x, ys)
    };
    G__7120.cljs$lang$arity$variadic = G__7120__delegate;
    return G__7120
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7124__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7125 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7126 = cljs.core.next.call(null, more);
            sb = G__7125;
            more = G__7126;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7124 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7124__delegate.call(this, x, ys)
    };
    G__7124.cljs$lang$maxFixedArity = 1;
    G__7124.cljs$lang$applyTo = function(arglist__7127) {
      var x = cljs.core.first(arglist__7127);
      var ys = cljs.core.rest(arglist__7127);
      return G__7124__delegate(x, ys)
    };
    G__7124.cljs$lang$arity$variadic = G__7124__delegate;
    return G__7124
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7128) {
    var fmt = cljs.core.first(arglist__7128);
    var args = cljs.core.rest(arglist__7128);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7131 = cljs.core.seq.call(null, x);
    var ys__7132 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7131 == null) {
        return ys__7132 == null
      }else {
        if(ys__7132 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7131), cljs.core.first.call(null, ys__7132))) {
            var G__7133 = cljs.core.next.call(null, xs__7131);
            var G__7134 = cljs.core.next.call(null, ys__7132);
            xs__7131 = G__7133;
            ys__7132 = G__7134;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7135_SHARP_, p2__7136_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7135_SHARP_, cljs.core.hash.call(null, p2__7136_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7140 = 0;
  var s__7141 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7141) {
      var e__7142 = cljs.core.first.call(null, s__7141);
      var G__7143 = (h__7140 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7142)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7142)))) % 4503599627370496;
      var G__7144 = cljs.core.next.call(null, s__7141);
      h__7140 = G__7143;
      s__7141 = G__7144;
      continue
    }else {
      return h__7140
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7148 = 0;
  var s__7149 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7149) {
      var e__7150 = cljs.core.first.call(null, s__7149);
      var G__7151 = (h__7148 + cljs.core.hash.call(null, e__7150)) % 4503599627370496;
      var G__7152 = cljs.core.next.call(null, s__7149);
      h__7148 = G__7151;
      s__7149 = G__7152;
      continue
    }else {
      return h__7148
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7173__7174 = cljs.core.seq.call(null, fn_map);
  if(G__7173__7174) {
    var G__7176__7178 = cljs.core.first.call(null, G__7173__7174);
    var vec__7177__7179 = G__7176__7178;
    var key_name__7180 = cljs.core.nth.call(null, vec__7177__7179, 0, null);
    var f__7181 = cljs.core.nth.call(null, vec__7177__7179, 1, null);
    var G__7173__7182 = G__7173__7174;
    var G__7176__7183 = G__7176__7178;
    var G__7173__7184 = G__7173__7182;
    while(true) {
      var vec__7185__7186 = G__7176__7183;
      var key_name__7187 = cljs.core.nth.call(null, vec__7185__7186, 0, null);
      var f__7188 = cljs.core.nth.call(null, vec__7185__7186, 1, null);
      var G__7173__7189 = G__7173__7184;
      var str_name__7190 = cljs.core.name.call(null, key_name__7187);
      obj[str_name__7190] = f__7188;
      var temp__3974__auto____7191 = cljs.core.next.call(null, G__7173__7189);
      if(temp__3974__auto____7191) {
        var G__7173__7192 = temp__3974__auto____7191;
        var G__7193 = cljs.core.first.call(null, G__7173__7192);
        var G__7194 = G__7173__7192;
        G__7176__7183 = G__7193;
        G__7173__7184 = G__7194;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7195 = this;
  var h__2192__auto____7196 = this__7195.__hash;
  if(!(h__2192__auto____7196 == null)) {
    return h__2192__auto____7196
  }else {
    var h__2192__auto____7197 = cljs.core.hash_coll.call(null, coll);
    this__7195.__hash = h__2192__auto____7197;
    return h__2192__auto____7197
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7198 = this;
  if(this__7198.count === 1) {
    return null
  }else {
    return this__7198.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7199 = this;
  return new cljs.core.List(this__7199.meta, o, coll, this__7199.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7200 = this;
  var this__7201 = this;
  return cljs.core.pr_str.call(null, this__7201)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7202 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7203 = this;
  return this__7203.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7204 = this;
  return this__7204.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7205 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7206 = this;
  return this__7206.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7207 = this;
  if(this__7207.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7207.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7208 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7209 = this;
  return new cljs.core.List(meta, this__7209.first, this__7209.rest, this__7209.count, this__7209.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7210 = this;
  return this__7210.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7211 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7212 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7213 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7214 = this;
  return new cljs.core.List(this__7214.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7215 = this;
  var this__7216 = this;
  return cljs.core.pr_str.call(null, this__7216)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7217 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7218 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7219 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7220 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7221 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7222 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7223 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7224 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7225 = this;
  return this__7225.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7226 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7230__7231 = coll;
  if(G__7230__7231) {
    if(function() {
      var or__3824__auto____7232 = G__7230__7231.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7232) {
        return or__3824__auto____7232
      }else {
        return G__7230__7231.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7230__7231.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7230__7231)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7230__7231)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7233__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7233 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7233__delegate.call(this, x, y, z, items)
    };
    G__7233.cljs$lang$maxFixedArity = 3;
    G__7233.cljs$lang$applyTo = function(arglist__7234) {
      var x = cljs.core.first(arglist__7234);
      var y = cljs.core.first(cljs.core.next(arglist__7234));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7234)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7234)));
      return G__7233__delegate(x, y, z, items)
    };
    G__7233.cljs$lang$arity$variadic = G__7233__delegate;
    return G__7233
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7235 = this;
  var h__2192__auto____7236 = this__7235.__hash;
  if(!(h__2192__auto____7236 == null)) {
    return h__2192__auto____7236
  }else {
    var h__2192__auto____7237 = cljs.core.hash_coll.call(null, coll);
    this__7235.__hash = h__2192__auto____7237;
    return h__2192__auto____7237
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7238 = this;
  if(this__7238.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7238.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7239 = this;
  return new cljs.core.Cons(null, o, coll, this__7239.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7240 = this;
  var this__7241 = this;
  return cljs.core.pr_str.call(null, this__7241)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7242 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7243 = this;
  return this__7243.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7244 = this;
  if(this__7244.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7244.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7245 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7246 = this;
  return new cljs.core.Cons(meta, this__7246.first, this__7246.rest, this__7246.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7247 = this;
  return this__7247.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7248 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7248.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7253 = coll == null;
    if(or__3824__auto____7253) {
      return or__3824__auto____7253
    }else {
      var G__7254__7255 = coll;
      if(G__7254__7255) {
        if(function() {
          var or__3824__auto____7256 = G__7254__7255.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7256) {
            return or__3824__auto____7256
          }else {
            return G__7254__7255.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7254__7255.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7254__7255)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7254__7255)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7260__7261 = x;
  if(G__7260__7261) {
    if(function() {
      var or__3824__auto____7262 = G__7260__7261.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7262) {
        return or__3824__auto____7262
      }else {
        return G__7260__7261.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7260__7261.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7260__7261)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7260__7261)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7263 = null;
  var G__7263__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7263__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7263 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7263__2.call(this, string, f);
      case 3:
        return G__7263__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7263
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7264 = null;
  var G__7264__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7264__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7264 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7264__2.call(this, string, k);
      case 3:
        return G__7264__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7264
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7265 = null;
  var G__7265__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7265__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7265 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7265__2.call(this, string, n);
      case 3:
        return G__7265__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7265
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7277 = null;
  var G__7277__2 = function(this_sym7268, coll) {
    var this__7270 = this;
    var this_sym7268__7271 = this;
    var ___7272 = this_sym7268__7271;
    if(coll == null) {
      return null
    }else {
      var strobj__7273 = coll.strobj;
      if(strobj__7273 == null) {
        return cljs.core._lookup.call(null, coll, this__7270.k, null)
      }else {
        return strobj__7273[this__7270.k]
      }
    }
  };
  var G__7277__3 = function(this_sym7269, coll, not_found) {
    var this__7270 = this;
    var this_sym7269__7274 = this;
    var ___7275 = this_sym7269__7274;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7270.k, not_found)
    }
  };
  G__7277 = function(this_sym7269, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7277__2.call(this, this_sym7269, coll);
      case 3:
        return G__7277__3.call(this, this_sym7269, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7277
}();
cljs.core.Keyword.prototype.apply = function(this_sym7266, args7267) {
  var this__7276 = this;
  return this_sym7266.call.apply(this_sym7266, [this_sym7266].concat(args7267.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7286 = null;
  var G__7286__2 = function(this_sym7280, coll) {
    var this_sym7280__7282 = this;
    var this__7283 = this_sym7280__7282;
    return cljs.core._lookup.call(null, coll, this__7283.toString(), null)
  };
  var G__7286__3 = function(this_sym7281, coll, not_found) {
    var this_sym7281__7284 = this;
    var this__7285 = this_sym7281__7284;
    return cljs.core._lookup.call(null, coll, this__7285.toString(), not_found)
  };
  G__7286 = function(this_sym7281, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7286__2.call(this, this_sym7281, coll);
      case 3:
        return G__7286__3.call(this, this_sym7281, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7286
}();
String.prototype.apply = function(this_sym7278, args7279) {
  return this_sym7278.call.apply(this_sym7278, [this_sym7278].concat(args7279.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7288 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7288
  }else {
    lazy_seq.x = x__7288.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7289 = this;
  var h__2192__auto____7290 = this__7289.__hash;
  if(!(h__2192__auto____7290 == null)) {
    return h__2192__auto____7290
  }else {
    var h__2192__auto____7291 = cljs.core.hash_coll.call(null, coll);
    this__7289.__hash = h__2192__auto____7291;
    return h__2192__auto____7291
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7292 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7293 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7294 = this;
  var this__7295 = this;
  return cljs.core.pr_str.call(null, this__7295)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7296 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7297 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7298 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7299 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7300 = this;
  return new cljs.core.LazySeq(meta, this__7300.realized, this__7300.x, this__7300.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7301 = this;
  return this__7301.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7302 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7302.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7303 = this;
  return this__7303.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7304 = this;
  var ___7305 = this;
  this__7304.buf[this__7304.end] = o;
  return this__7304.end = this__7304.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7306 = this;
  var ___7307 = this;
  var ret__7308 = new cljs.core.ArrayChunk(this__7306.buf, 0, this__7306.end);
  this__7306.buf = null;
  return ret__7308
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7309 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7309.arr[this__7309.off], this__7309.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7310 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7310.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7311 = this;
  if(this__7311.off === this__7311.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7311.arr, this__7311.off + 1, this__7311.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7312 = this;
  return this__7312.arr[this__7312.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7313 = this;
  if(function() {
    var and__3822__auto____7314 = i >= 0;
    if(and__3822__auto____7314) {
      return i < this__7313.end - this__7313.off
    }else {
      return and__3822__auto____7314
    }
  }()) {
    return this__7313.arr[this__7313.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7315 = this;
  return this__7315.end - this__7315.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7316 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7317 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7318 = this;
  return cljs.core._nth.call(null, this__7318.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7319 = this;
  if(cljs.core._count.call(null, this__7319.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7319.chunk), this__7319.more, this__7319.meta)
  }else {
    if(this__7319.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7319.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7320 = this;
  if(this__7320.more == null) {
    return null
  }else {
    return this__7320.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7321 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7322 = this;
  return new cljs.core.ChunkedCons(this__7322.chunk, this__7322.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7323 = this;
  return this__7323.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7324 = this;
  return this__7324.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7325 = this;
  if(this__7325.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7325.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7329__7330 = s;
    if(G__7329__7330) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7331 = null;
        if(cljs.core.truth_(or__3824__auto____7331)) {
          return or__3824__auto____7331
        }else {
          return G__7329__7330.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7329__7330.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7329__7330)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7329__7330)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7334 = [];
  var s__7335 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7335)) {
      ary__7334.push(cljs.core.first.call(null, s__7335));
      var G__7336 = cljs.core.next.call(null, s__7335);
      s__7335 = G__7336;
      continue
    }else {
      return ary__7334
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7340 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7341 = 0;
  var xs__7342 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7342) {
      ret__7340[i__7341] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7342));
      var G__7343 = i__7341 + 1;
      var G__7344 = cljs.core.next.call(null, xs__7342);
      i__7341 = G__7343;
      xs__7342 = G__7344;
      continue
    }else {
    }
    break
  }
  return ret__7340
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7352 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7353 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7354 = 0;
      var s__7355 = s__7353;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7356 = s__7355;
          if(and__3822__auto____7356) {
            return i__7354 < size
          }else {
            return and__3822__auto____7356
          }
        }())) {
          a__7352[i__7354] = cljs.core.first.call(null, s__7355);
          var G__7359 = i__7354 + 1;
          var G__7360 = cljs.core.next.call(null, s__7355);
          i__7354 = G__7359;
          s__7355 = G__7360;
          continue
        }else {
          return a__7352
        }
        break
      }
    }else {
      var n__2527__auto____7357 = size;
      var i__7358 = 0;
      while(true) {
        if(i__7358 < n__2527__auto____7357) {
          a__7352[i__7358] = init_val_or_seq;
          var G__7361 = i__7358 + 1;
          i__7358 = G__7361;
          continue
        }else {
        }
        break
      }
      return a__7352
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7369 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7370 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7371 = 0;
      var s__7372 = s__7370;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7373 = s__7372;
          if(and__3822__auto____7373) {
            return i__7371 < size
          }else {
            return and__3822__auto____7373
          }
        }())) {
          a__7369[i__7371] = cljs.core.first.call(null, s__7372);
          var G__7376 = i__7371 + 1;
          var G__7377 = cljs.core.next.call(null, s__7372);
          i__7371 = G__7376;
          s__7372 = G__7377;
          continue
        }else {
          return a__7369
        }
        break
      }
    }else {
      var n__2527__auto____7374 = size;
      var i__7375 = 0;
      while(true) {
        if(i__7375 < n__2527__auto____7374) {
          a__7369[i__7375] = init_val_or_seq;
          var G__7378 = i__7375 + 1;
          i__7375 = G__7378;
          continue
        }else {
        }
        break
      }
      return a__7369
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7386 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7387 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7388 = 0;
      var s__7389 = s__7387;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7390 = s__7389;
          if(and__3822__auto____7390) {
            return i__7388 < size
          }else {
            return and__3822__auto____7390
          }
        }())) {
          a__7386[i__7388] = cljs.core.first.call(null, s__7389);
          var G__7393 = i__7388 + 1;
          var G__7394 = cljs.core.next.call(null, s__7389);
          i__7388 = G__7393;
          s__7389 = G__7394;
          continue
        }else {
          return a__7386
        }
        break
      }
    }else {
      var n__2527__auto____7391 = size;
      var i__7392 = 0;
      while(true) {
        if(i__7392 < n__2527__auto____7391) {
          a__7386[i__7392] = init_val_or_seq;
          var G__7395 = i__7392 + 1;
          i__7392 = G__7395;
          continue
        }else {
        }
        break
      }
      return a__7386
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7400 = s;
    var i__7401 = n;
    var sum__7402 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7403 = i__7401 > 0;
        if(and__3822__auto____7403) {
          return cljs.core.seq.call(null, s__7400)
        }else {
          return and__3822__auto____7403
        }
      }())) {
        var G__7404 = cljs.core.next.call(null, s__7400);
        var G__7405 = i__7401 - 1;
        var G__7406 = sum__7402 + 1;
        s__7400 = G__7404;
        i__7401 = G__7405;
        sum__7402 = G__7406;
        continue
      }else {
        return sum__7402
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7411 = cljs.core.seq.call(null, x);
      if(s__7411) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7411)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7411), concat.call(null, cljs.core.chunk_rest.call(null, s__7411), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7411), concat.call(null, cljs.core.rest.call(null, s__7411), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7415__delegate = function(x, y, zs) {
      var cat__7414 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7413 = cljs.core.seq.call(null, xys);
          if(xys__7413) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7413)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7413), cat.call(null, cljs.core.chunk_rest.call(null, xys__7413), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7413), cat.call(null, cljs.core.rest.call(null, xys__7413), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7414.call(null, concat.call(null, x, y), zs)
    };
    var G__7415 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7415__delegate.call(this, x, y, zs)
    };
    G__7415.cljs$lang$maxFixedArity = 2;
    G__7415.cljs$lang$applyTo = function(arglist__7416) {
      var x = cljs.core.first(arglist__7416);
      var y = cljs.core.first(cljs.core.next(arglist__7416));
      var zs = cljs.core.rest(cljs.core.next(arglist__7416));
      return G__7415__delegate(x, y, zs)
    };
    G__7415.cljs$lang$arity$variadic = G__7415__delegate;
    return G__7415
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7417__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7417 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7417__delegate.call(this, a, b, c, d, more)
    };
    G__7417.cljs$lang$maxFixedArity = 4;
    G__7417.cljs$lang$applyTo = function(arglist__7418) {
      var a = cljs.core.first(arglist__7418);
      var b = cljs.core.first(cljs.core.next(arglist__7418));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7418)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7418))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7418))));
      return G__7417__delegate(a, b, c, d, more)
    };
    G__7417.cljs$lang$arity$variadic = G__7417__delegate;
    return G__7417
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7460 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7461 = cljs.core._first.call(null, args__7460);
    var args__7462 = cljs.core._rest.call(null, args__7460);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7461)
      }else {
        return f.call(null, a__7461)
      }
    }else {
      var b__7463 = cljs.core._first.call(null, args__7462);
      var args__7464 = cljs.core._rest.call(null, args__7462);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7461, b__7463)
        }else {
          return f.call(null, a__7461, b__7463)
        }
      }else {
        var c__7465 = cljs.core._first.call(null, args__7464);
        var args__7466 = cljs.core._rest.call(null, args__7464);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7461, b__7463, c__7465)
          }else {
            return f.call(null, a__7461, b__7463, c__7465)
          }
        }else {
          var d__7467 = cljs.core._first.call(null, args__7466);
          var args__7468 = cljs.core._rest.call(null, args__7466);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7461, b__7463, c__7465, d__7467)
            }else {
              return f.call(null, a__7461, b__7463, c__7465, d__7467)
            }
          }else {
            var e__7469 = cljs.core._first.call(null, args__7468);
            var args__7470 = cljs.core._rest.call(null, args__7468);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7461, b__7463, c__7465, d__7467, e__7469)
              }else {
                return f.call(null, a__7461, b__7463, c__7465, d__7467, e__7469)
              }
            }else {
              var f__7471 = cljs.core._first.call(null, args__7470);
              var args__7472 = cljs.core._rest.call(null, args__7470);
              if(argc === 6) {
                if(f__7471.cljs$lang$arity$6) {
                  return f__7471.cljs$lang$arity$6(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471)
                }else {
                  return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471)
                }
              }else {
                var g__7473 = cljs.core._first.call(null, args__7472);
                var args__7474 = cljs.core._rest.call(null, args__7472);
                if(argc === 7) {
                  if(f__7471.cljs$lang$arity$7) {
                    return f__7471.cljs$lang$arity$7(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473)
                  }else {
                    return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473)
                  }
                }else {
                  var h__7475 = cljs.core._first.call(null, args__7474);
                  var args__7476 = cljs.core._rest.call(null, args__7474);
                  if(argc === 8) {
                    if(f__7471.cljs$lang$arity$8) {
                      return f__7471.cljs$lang$arity$8(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475)
                    }else {
                      return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475)
                    }
                  }else {
                    var i__7477 = cljs.core._first.call(null, args__7476);
                    var args__7478 = cljs.core._rest.call(null, args__7476);
                    if(argc === 9) {
                      if(f__7471.cljs$lang$arity$9) {
                        return f__7471.cljs$lang$arity$9(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477)
                      }else {
                        return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477)
                      }
                    }else {
                      var j__7479 = cljs.core._first.call(null, args__7478);
                      var args__7480 = cljs.core._rest.call(null, args__7478);
                      if(argc === 10) {
                        if(f__7471.cljs$lang$arity$10) {
                          return f__7471.cljs$lang$arity$10(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479)
                        }else {
                          return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479)
                        }
                      }else {
                        var k__7481 = cljs.core._first.call(null, args__7480);
                        var args__7482 = cljs.core._rest.call(null, args__7480);
                        if(argc === 11) {
                          if(f__7471.cljs$lang$arity$11) {
                            return f__7471.cljs$lang$arity$11(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481)
                          }else {
                            return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481)
                          }
                        }else {
                          var l__7483 = cljs.core._first.call(null, args__7482);
                          var args__7484 = cljs.core._rest.call(null, args__7482);
                          if(argc === 12) {
                            if(f__7471.cljs$lang$arity$12) {
                              return f__7471.cljs$lang$arity$12(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483)
                            }else {
                              return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483)
                            }
                          }else {
                            var m__7485 = cljs.core._first.call(null, args__7484);
                            var args__7486 = cljs.core._rest.call(null, args__7484);
                            if(argc === 13) {
                              if(f__7471.cljs$lang$arity$13) {
                                return f__7471.cljs$lang$arity$13(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485)
                              }else {
                                return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485)
                              }
                            }else {
                              var n__7487 = cljs.core._first.call(null, args__7486);
                              var args__7488 = cljs.core._rest.call(null, args__7486);
                              if(argc === 14) {
                                if(f__7471.cljs$lang$arity$14) {
                                  return f__7471.cljs$lang$arity$14(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487)
                                }else {
                                  return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487)
                                }
                              }else {
                                var o__7489 = cljs.core._first.call(null, args__7488);
                                var args__7490 = cljs.core._rest.call(null, args__7488);
                                if(argc === 15) {
                                  if(f__7471.cljs$lang$arity$15) {
                                    return f__7471.cljs$lang$arity$15(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489)
                                  }else {
                                    return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489)
                                  }
                                }else {
                                  var p__7491 = cljs.core._first.call(null, args__7490);
                                  var args__7492 = cljs.core._rest.call(null, args__7490);
                                  if(argc === 16) {
                                    if(f__7471.cljs$lang$arity$16) {
                                      return f__7471.cljs$lang$arity$16(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491)
                                    }else {
                                      return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491)
                                    }
                                  }else {
                                    var q__7493 = cljs.core._first.call(null, args__7492);
                                    var args__7494 = cljs.core._rest.call(null, args__7492);
                                    if(argc === 17) {
                                      if(f__7471.cljs$lang$arity$17) {
                                        return f__7471.cljs$lang$arity$17(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491, q__7493)
                                      }else {
                                        return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491, q__7493)
                                      }
                                    }else {
                                      var r__7495 = cljs.core._first.call(null, args__7494);
                                      var args__7496 = cljs.core._rest.call(null, args__7494);
                                      if(argc === 18) {
                                        if(f__7471.cljs$lang$arity$18) {
                                          return f__7471.cljs$lang$arity$18(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491, q__7493, r__7495)
                                        }else {
                                          return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491, q__7493, r__7495)
                                        }
                                      }else {
                                        var s__7497 = cljs.core._first.call(null, args__7496);
                                        var args__7498 = cljs.core._rest.call(null, args__7496);
                                        if(argc === 19) {
                                          if(f__7471.cljs$lang$arity$19) {
                                            return f__7471.cljs$lang$arity$19(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491, q__7493, r__7495, s__7497)
                                          }else {
                                            return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491, q__7493, r__7495, s__7497)
                                          }
                                        }else {
                                          var t__7499 = cljs.core._first.call(null, args__7498);
                                          var args__7500 = cljs.core._rest.call(null, args__7498);
                                          if(argc === 20) {
                                            if(f__7471.cljs$lang$arity$20) {
                                              return f__7471.cljs$lang$arity$20(a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491, q__7493, r__7495, s__7497, t__7499)
                                            }else {
                                              return f__7471.call(null, a__7461, b__7463, c__7465, d__7467, e__7469, f__7471, g__7473, h__7475, i__7477, j__7479, k__7481, l__7483, m__7485, n__7487, o__7489, p__7491, q__7493, r__7495, s__7497, t__7499)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7515 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7516 = cljs.core.bounded_count.call(null, args, fixed_arity__7515 + 1);
      if(bc__7516 <= fixed_arity__7515) {
        return cljs.core.apply_to.call(null, f, bc__7516, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7517 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7518 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7519 = cljs.core.bounded_count.call(null, arglist__7517, fixed_arity__7518 + 1);
      if(bc__7519 <= fixed_arity__7518) {
        return cljs.core.apply_to.call(null, f, bc__7519, arglist__7517)
      }else {
        return f.cljs$lang$applyTo(arglist__7517)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7517))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7520 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7521 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7522 = cljs.core.bounded_count.call(null, arglist__7520, fixed_arity__7521 + 1);
      if(bc__7522 <= fixed_arity__7521) {
        return cljs.core.apply_to.call(null, f, bc__7522, arglist__7520)
      }else {
        return f.cljs$lang$applyTo(arglist__7520)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7520))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7523 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7524 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7525 = cljs.core.bounded_count.call(null, arglist__7523, fixed_arity__7524 + 1);
      if(bc__7525 <= fixed_arity__7524) {
        return cljs.core.apply_to.call(null, f, bc__7525, arglist__7523)
      }else {
        return f.cljs$lang$applyTo(arglist__7523)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7523))
    }
  };
  var apply__6 = function() {
    var G__7529__delegate = function(f, a, b, c, d, args) {
      var arglist__7526 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7527 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7528 = cljs.core.bounded_count.call(null, arglist__7526, fixed_arity__7527 + 1);
        if(bc__7528 <= fixed_arity__7527) {
          return cljs.core.apply_to.call(null, f, bc__7528, arglist__7526)
        }else {
          return f.cljs$lang$applyTo(arglist__7526)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7526))
      }
    };
    var G__7529 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7529__delegate.call(this, f, a, b, c, d, args)
    };
    G__7529.cljs$lang$maxFixedArity = 5;
    G__7529.cljs$lang$applyTo = function(arglist__7530) {
      var f = cljs.core.first(arglist__7530);
      var a = cljs.core.first(cljs.core.next(arglist__7530));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7530)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7530))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7530)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7530)))));
      return G__7529__delegate(f, a, b, c, d, args)
    };
    G__7529.cljs$lang$arity$variadic = G__7529__delegate;
    return G__7529
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7531) {
    var obj = cljs.core.first(arglist__7531);
    var f = cljs.core.first(cljs.core.next(arglist__7531));
    var args = cljs.core.rest(cljs.core.next(arglist__7531));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7532__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7532 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7532__delegate.call(this, x, y, more)
    };
    G__7532.cljs$lang$maxFixedArity = 2;
    G__7532.cljs$lang$applyTo = function(arglist__7533) {
      var x = cljs.core.first(arglist__7533);
      var y = cljs.core.first(cljs.core.next(arglist__7533));
      var more = cljs.core.rest(cljs.core.next(arglist__7533));
      return G__7532__delegate(x, y, more)
    };
    G__7532.cljs$lang$arity$variadic = G__7532__delegate;
    return G__7532
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7534 = pred;
        var G__7535 = cljs.core.next.call(null, coll);
        pred = G__7534;
        coll = G__7535;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____7537 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7537)) {
        return or__3824__auto____7537
      }else {
        var G__7538 = pred;
        var G__7539 = cljs.core.next.call(null, coll);
        pred = G__7538;
        coll = G__7539;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7540 = null;
    var G__7540__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7540__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7540__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7540__3 = function() {
      var G__7541__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7541 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7541__delegate.call(this, x, y, zs)
      };
      G__7541.cljs$lang$maxFixedArity = 2;
      G__7541.cljs$lang$applyTo = function(arglist__7542) {
        var x = cljs.core.first(arglist__7542);
        var y = cljs.core.first(cljs.core.next(arglist__7542));
        var zs = cljs.core.rest(cljs.core.next(arglist__7542));
        return G__7541__delegate(x, y, zs)
      };
      G__7541.cljs$lang$arity$variadic = G__7541__delegate;
      return G__7541
    }();
    G__7540 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7540__0.call(this);
        case 1:
          return G__7540__1.call(this, x);
        case 2:
          return G__7540__2.call(this, x, y);
        default:
          return G__7540__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7540.cljs$lang$maxFixedArity = 2;
    G__7540.cljs$lang$applyTo = G__7540__3.cljs$lang$applyTo;
    return G__7540
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7543__delegate = function(args) {
      return x
    };
    var G__7543 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7543__delegate.call(this, args)
    };
    G__7543.cljs$lang$maxFixedArity = 0;
    G__7543.cljs$lang$applyTo = function(arglist__7544) {
      var args = cljs.core.seq(arglist__7544);
      return G__7543__delegate(args)
    };
    G__7543.cljs$lang$arity$variadic = G__7543__delegate;
    return G__7543
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7551 = null;
      var G__7551__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7551__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7551__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7551__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7551__4 = function() {
        var G__7552__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7552 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7552__delegate.call(this, x, y, z, args)
        };
        G__7552.cljs$lang$maxFixedArity = 3;
        G__7552.cljs$lang$applyTo = function(arglist__7553) {
          var x = cljs.core.first(arglist__7553);
          var y = cljs.core.first(cljs.core.next(arglist__7553));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7553)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7553)));
          return G__7552__delegate(x, y, z, args)
        };
        G__7552.cljs$lang$arity$variadic = G__7552__delegate;
        return G__7552
      }();
      G__7551 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7551__0.call(this);
          case 1:
            return G__7551__1.call(this, x);
          case 2:
            return G__7551__2.call(this, x, y);
          case 3:
            return G__7551__3.call(this, x, y, z);
          default:
            return G__7551__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7551.cljs$lang$maxFixedArity = 3;
      G__7551.cljs$lang$applyTo = G__7551__4.cljs$lang$applyTo;
      return G__7551
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7554 = null;
      var G__7554__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7554__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7554__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7554__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7554__4 = function() {
        var G__7555__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7555 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7555__delegate.call(this, x, y, z, args)
        };
        G__7555.cljs$lang$maxFixedArity = 3;
        G__7555.cljs$lang$applyTo = function(arglist__7556) {
          var x = cljs.core.first(arglist__7556);
          var y = cljs.core.first(cljs.core.next(arglist__7556));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7556)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7556)));
          return G__7555__delegate(x, y, z, args)
        };
        G__7555.cljs$lang$arity$variadic = G__7555__delegate;
        return G__7555
      }();
      G__7554 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7554__0.call(this);
          case 1:
            return G__7554__1.call(this, x);
          case 2:
            return G__7554__2.call(this, x, y);
          case 3:
            return G__7554__3.call(this, x, y, z);
          default:
            return G__7554__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7554.cljs$lang$maxFixedArity = 3;
      G__7554.cljs$lang$applyTo = G__7554__4.cljs$lang$applyTo;
      return G__7554
    }()
  };
  var comp__4 = function() {
    var G__7557__delegate = function(f1, f2, f3, fs) {
      var fs__7548 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7558__delegate = function(args) {
          var ret__7549 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7548), args);
          var fs__7550 = cljs.core.next.call(null, fs__7548);
          while(true) {
            if(fs__7550) {
              var G__7559 = cljs.core.first.call(null, fs__7550).call(null, ret__7549);
              var G__7560 = cljs.core.next.call(null, fs__7550);
              ret__7549 = G__7559;
              fs__7550 = G__7560;
              continue
            }else {
              return ret__7549
            }
            break
          }
        };
        var G__7558 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7558__delegate.call(this, args)
        };
        G__7558.cljs$lang$maxFixedArity = 0;
        G__7558.cljs$lang$applyTo = function(arglist__7561) {
          var args = cljs.core.seq(arglist__7561);
          return G__7558__delegate(args)
        };
        G__7558.cljs$lang$arity$variadic = G__7558__delegate;
        return G__7558
      }()
    };
    var G__7557 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7557__delegate.call(this, f1, f2, f3, fs)
    };
    G__7557.cljs$lang$maxFixedArity = 3;
    G__7557.cljs$lang$applyTo = function(arglist__7562) {
      var f1 = cljs.core.first(arglist__7562);
      var f2 = cljs.core.first(cljs.core.next(arglist__7562));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7562)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7562)));
      return G__7557__delegate(f1, f2, f3, fs)
    };
    G__7557.cljs$lang$arity$variadic = G__7557__delegate;
    return G__7557
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7563__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7563 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7563__delegate.call(this, args)
      };
      G__7563.cljs$lang$maxFixedArity = 0;
      G__7563.cljs$lang$applyTo = function(arglist__7564) {
        var args = cljs.core.seq(arglist__7564);
        return G__7563__delegate(args)
      };
      G__7563.cljs$lang$arity$variadic = G__7563__delegate;
      return G__7563
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7565__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7565 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7565__delegate.call(this, args)
      };
      G__7565.cljs$lang$maxFixedArity = 0;
      G__7565.cljs$lang$applyTo = function(arglist__7566) {
        var args = cljs.core.seq(arglist__7566);
        return G__7565__delegate(args)
      };
      G__7565.cljs$lang$arity$variadic = G__7565__delegate;
      return G__7565
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7567__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7567 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7567__delegate.call(this, args)
      };
      G__7567.cljs$lang$maxFixedArity = 0;
      G__7567.cljs$lang$applyTo = function(arglist__7568) {
        var args = cljs.core.seq(arglist__7568);
        return G__7567__delegate(args)
      };
      G__7567.cljs$lang$arity$variadic = G__7567__delegate;
      return G__7567
    }()
  };
  var partial__5 = function() {
    var G__7569__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7570__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7570 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7570__delegate.call(this, args)
        };
        G__7570.cljs$lang$maxFixedArity = 0;
        G__7570.cljs$lang$applyTo = function(arglist__7571) {
          var args = cljs.core.seq(arglist__7571);
          return G__7570__delegate(args)
        };
        G__7570.cljs$lang$arity$variadic = G__7570__delegate;
        return G__7570
      }()
    };
    var G__7569 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7569__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7569.cljs$lang$maxFixedArity = 4;
    G__7569.cljs$lang$applyTo = function(arglist__7572) {
      var f = cljs.core.first(arglist__7572);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7572));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7572)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7572))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7572))));
      return G__7569__delegate(f, arg1, arg2, arg3, more)
    };
    G__7569.cljs$lang$arity$variadic = G__7569__delegate;
    return G__7569
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7573 = null;
      var G__7573__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7573__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7573__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7573__4 = function() {
        var G__7574__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7574 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7574__delegate.call(this, a, b, c, ds)
        };
        G__7574.cljs$lang$maxFixedArity = 3;
        G__7574.cljs$lang$applyTo = function(arglist__7575) {
          var a = cljs.core.first(arglist__7575);
          var b = cljs.core.first(cljs.core.next(arglist__7575));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7575)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7575)));
          return G__7574__delegate(a, b, c, ds)
        };
        G__7574.cljs$lang$arity$variadic = G__7574__delegate;
        return G__7574
      }();
      G__7573 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7573__1.call(this, a);
          case 2:
            return G__7573__2.call(this, a, b);
          case 3:
            return G__7573__3.call(this, a, b, c);
          default:
            return G__7573__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7573.cljs$lang$maxFixedArity = 3;
      G__7573.cljs$lang$applyTo = G__7573__4.cljs$lang$applyTo;
      return G__7573
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7576 = null;
      var G__7576__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7576__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7576__4 = function() {
        var G__7577__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7577 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7577__delegate.call(this, a, b, c, ds)
        };
        G__7577.cljs$lang$maxFixedArity = 3;
        G__7577.cljs$lang$applyTo = function(arglist__7578) {
          var a = cljs.core.first(arglist__7578);
          var b = cljs.core.first(cljs.core.next(arglist__7578));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7578)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7578)));
          return G__7577__delegate(a, b, c, ds)
        };
        G__7577.cljs$lang$arity$variadic = G__7577__delegate;
        return G__7577
      }();
      G__7576 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7576__2.call(this, a, b);
          case 3:
            return G__7576__3.call(this, a, b, c);
          default:
            return G__7576__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7576.cljs$lang$maxFixedArity = 3;
      G__7576.cljs$lang$applyTo = G__7576__4.cljs$lang$applyTo;
      return G__7576
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7579 = null;
      var G__7579__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7579__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7579__4 = function() {
        var G__7580__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7580 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7580__delegate.call(this, a, b, c, ds)
        };
        G__7580.cljs$lang$maxFixedArity = 3;
        G__7580.cljs$lang$applyTo = function(arglist__7581) {
          var a = cljs.core.first(arglist__7581);
          var b = cljs.core.first(cljs.core.next(arglist__7581));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7581)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7581)));
          return G__7580__delegate(a, b, c, ds)
        };
        G__7580.cljs$lang$arity$variadic = G__7580__delegate;
        return G__7580
      }();
      G__7579 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7579__2.call(this, a, b);
          case 3:
            return G__7579__3.call(this, a, b, c);
          default:
            return G__7579__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7579.cljs$lang$maxFixedArity = 3;
      G__7579.cljs$lang$applyTo = G__7579__4.cljs$lang$applyTo;
      return G__7579
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7597 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7605 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7605) {
        var s__7606 = temp__3974__auto____7605;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7606)) {
          var c__7607 = cljs.core.chunk_first.call(null, s__7606);
          var size__7608 = cljs.core.count.call(null, c__7607);
          var b__7609 = cljs.core.chunk_buffer.call(null, size__7608);
          var n__2527__auto____7610 = size__7608;
          var i__7611 = 0;
          while(true) {
            if(i__7611 < n__2527__auto____7610) {
              cljs.core.chunk_append.call(null, b__7609, f.call(null, idx + i__7611, cljs.core._nth.call(null, c__7607, i__7611)));
              var G__7612 = i__7611 + 1;
              i__7611 = G__7612;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7609), mapi.call(null, idx + size__7608, cljs.core.chunk_rest.call(null, s__7606)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7606)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7606)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7597.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7622 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7622) {
      var s__7623 = temp__3974__auto____7622;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7623)) {
        var c__7624 = cljs.core.chunk_first.call(null, s__7623);
        var size__7625 = cljs.core.count.call(null, c__7624);
        var b__7626 = cljs.core.chunk_buffer.call(null, size__7625);
        var n__2527__auto____7627 = size__7625;
        var i__7628 = 0;
        while(true) {
          if(i__7628 < n__2527__auto____7627) {
            var x__7629 = f.call(null, cljs.core._nth.call(null, c__7624, i__7628));
            if(x__7629 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7626, x__7629)
            }
            var G__7631 = i__7628 + 1;
            i__7628 = G__7631;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7626), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7623)))
      }else {
        var x__7630 = f.call(null, cljs.core.first.call(null, s__7623));
        if(x__7630 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7623))
        }else {
          return cljs.core.cons.call(null, x__7630, keep.call(null, f, cljs.core.rest.call(null, s__7623)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7657 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7667 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7667) {
        var s__7668 = temp__3974__auto____7667;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7668)) {
          var c__7669 = cljs.core.chunk_first.call(null, s__7668);
          var size__7670 = cljs.core.count.call(null, c__7669);
          var b__7671 = cljs.core.chunk_buffer.call(null, size__7670);
          var n__2527__auto____7672 = size__7670;
          var i__7673 = 0;
          while(true) {
            if(i__7673 < n__2527__auto____7672) {
              var x__7674 = f.call(null, idx + i__7673, cljs.core._nth.call(null, c__7669, i__7673));
              if(x__7674 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7671, x__7674)
              }
              var G__7676 = i__7673 + 1;
              i__7673 = G__7676;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7671), keepi.call(null, idx + size__7670, cljs.core.chunk_rest.call(null, s__7668)))
        }else {
          var x__7675 = f.call(null, idx, cljs.core.first.call(null, s__7668));
          if(x__7675 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7668))
          }else {
            return cljs.core.cons.call(null, x__7675, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7668)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7657.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7762 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7762)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7762
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7763 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7763)) {
            var and__3822__auto____7764 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7764)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7764
            }
          }else {
            return and__3822__auto____7763
          }
        }())
      };
      var ep1__4 = function() {
        var G__7833__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7765 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7765)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7765
            }
          }())
        };
        var G__7833 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7833__delegate.call(this, x, y, z, args)
        };
        G__7833.cljs$lang$maxFixedArity = 3;
        G__7833.cljs$lang$applyTo = function(arglist__7834) {
          var x = cljs.core.first(arglist__7834);
          var y = cljs.core.first(cljs.core.next(arglist__7834));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7834)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7834)));
          return G__7833__delegate(x, y, z, args)
        };
        G__7833.cljs$lang$arity$variadic = G__7833__delegate;
        return G__7833
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7777 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7777)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7777
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7778 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7778)) {
            var and__3822__auto____7779 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7779)) {
              var and__3822__auto____7780 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7780)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7780
              }
            }else {
              return and__3822__auto____7779
            }
          }else {
            return and__3822__auto____7778
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7781 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7781)) {
            var and__3822__auto____7782 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7782)) {
              var and__3822__auto____7783 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7783)) {
                var and__3822__auto____7784 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7784)) {
                  var and__3822__auto____7785 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7785)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7785
                  }
                }else {
                  return and__3822__auto____7784
                }
              }else {
                return and__3822__auto____7783
              }
            }else {
              return and__3822__auto____7782
            }
          }else {
            return and__3822__auto____7781
          }
        }())
      };
      var ep2__4 = function() {
        var G__7835__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7786 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7786)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7632_SHARP_) {
                var and__3822__auto____7787 = p1.call(null, p1__7632_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7787)) {
                  return p2.call(null, p1__7632_SHARP_)
                }else {
                  return and__3822__auto____7787
                }
              }, args)
            }else {
              return and__3822__auto____7786
            }
          }())
        };
        var G__7835 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7835__delegate.call(this, x, y, z, args)
        };
        G__7835.cljs$lang$maxFixedArity = 3;
        G__7835.cljs$lang$applyTo = function(arglist__7836) {
          var x = cljs.core.first(arglist__7836);
          var y = cljs.core.first(cljs.core.next(arglist__7836));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7836)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7836)));
          return G__7835__delegate(x, y, z, args)
        };
        G__7835.cljs$lang$arity$variadic = G__7835__delegate;
        return G__7835
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7806 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7806)) {
            var and__3822__auto____7807 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7807)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7807
            }
          }else {
            return and__3822__auto____7806
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7808 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7808)) {
            var and__3822__auto____7809 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7809)) {
              var and__3822__auto____7810 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7810)) {
                var and__3822__auto____7811 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7811)) {
                  var and__3822__auto____7812 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7812)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7812
                  }
                }else {
                  return and__3822__auto____7811
                }
              }else {
                return and__3822__auto____7810
              }
            }else {
              return and__3822__auto____7809
            }
          }else {
            return and__3822__auto____7808
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7813 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7813)) {
            var and__3822__auto____7814 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7814)) {
              var and__3822__auto____7815 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7815)) {
                var and__3822__auto____7816 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7816)) {
                  var and__3822__auto____7817 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7817)) {
                    var and__3822__auto____7818 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7818)) {
                      var and__3822__auto____7819 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7819)) {
                        var and__3822__auto____7820 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7820)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7820
                        }
                      }else {
                        return and__3822__auto____7819
                      }
                    }else {
                      return and__3822__auto____7818
                    }
                  }else {
                    return and__3822__auto____7817
                  }
                }else {
                  return and__3822__auto____7816
                }
              }else {
                return and__3822__auto____7815
              }
            }else {
              return and__3822__auto____7814
            }
          }else {
            return and__3822__auto____7813
          }
        }())
      };
      var ep3__4 = function() {
        var G__7837__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7821 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7821)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7633_SHARP_) {
                var and__3822__auto____7822 = p1.call(null, p1__7633_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7822)) {
                  var and__3822__auto____7823 = p2.call(null, p1__7633_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7823)) {
                    return p3.call(null, p1__7633_SHARP_)
                  }else {
                    return and__3822__auto____7823
                  }
                }else {
                  return and__3822__auto____7822
                }
              }, args)
            }else {
              return and__3822__auto____7821
            }
          }())
        };
        var G__7837 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7837__delegate.call(this, x, y, z, args)
        };
        G__7837.cljs$lang$maxFixedArity = 3;
        G__7837.cljs$lang$applyTo = function(arglist__7838) {
          var x = cljs.core.first(arglist__7838);
          var y = cljs.core.first(cljs.core.next(arglist__7838));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7838)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7838)));
          return G__7837__delegate(x, y, z, args)
        };
        G__7837.cljs$lang$arity$variadic = G__7837__delegate;
        return G__7837
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7839__delegate = function(p1, p2, p3, ps) {
      var ps__7824 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7634_SHARP_) {
            return p1__7634_SHARP_.call(null, x)
          }, ps__7824)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7635_SHARP_) {
            var and__3822__auto____7829 = p1__7635_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7829)) {
              return p1__7635_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7829
            }
          }, ps__7824)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7636_SHARP_) {
            var and__3822__auto____7830 = p1__7636_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7830)) {
              var and__3822__auto____7831 = p1__7636_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7831)) {
                return p1__7636_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7831
              }
            }else {
              return and__3822__auto____7830
            }
          }, ps__7824)
        };
        var epn__4 = function() {
          var G__7840__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7832 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7832)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7637_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7637_SHARP_, args)
                }, ps__7824)
              }else {
                return and__3822__auto____7832
              }
            }())
          };
          var G__7840 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7840__delegate.call(this, x, y, z, args)
          };
          G__7840.cljs$lang$maxFixedArity = 3;
          G__7840.cljs$lang$applyTo = function(arglist__7841) {
            var x = cljs.core.first(arglist__7841);
            var y = cljs.core.first(cljs.core.next(arglist__7841));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7841)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7841)));
            return G__7840__delegate(x, y, z, args)
          };
          G__7840.cljs$lang$arity$variadic = G__7840__delegate;
          return G__7840
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7839 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7839__delegate.call(this, p1, p2, p3, ps)
    };
    G__7839.cljs$lang$maxFixedArity = 3;
    G__7839.cljs$lang$applyTo = function(arglist__7842) {
      var p1 = cljs.core.first(arglist__7842);
      var p2 = cljs.core.first(cljs.core.next(arglist__7842));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7842)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7842)));
      return G__7839__delegate(p1, p2, p3, ps)
    };
    G__7839.cljs$lang$arity$variadic = G__7839__delegate;
    return G__7839
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____7923 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7923)) {
          return or__3824__auto____7923
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7924 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7924)) {
          return or__3824__auto____7924
        }else {
          var or__3824__auto____7925 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7925)) {
            return or__3824__auto____7925
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7994__delegate = function(x, y, z, args) {
          var or__3824__auto____7926 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7926)) {
            return or__3824__auto____7926
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7994 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7994__delegate.call(this, x, y, z, args)
        };
        G__7994.cljs$lang$maxFixedArity = 3;
        G__7994.cljs$lang$applyTo = function(arglist__7995) {
          var x = cljs.core.first(arglist__7995);
          var y = cljs.core.first(cljs.core.next(arglist__7995));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7995)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7995)));
          return G__7994__delegate(x, y, z, args)
        };
        G__7994.cljs$lang$arity$variadic = G__7994__delegate;
        return G__7994
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____7938 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7938)) {
          return or__3824__auto____7938
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7939 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7939)) {
          return or__3824__auto____7939
        }else {
          var or__3824__auto____7940 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7940)) {
            return or__3824__auto____7940
          }else {
            var or__3824__auto____7941 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7941)) {
              return or__3824__auto____7941
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7942 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7942)) {
          return or__3824__auto____7942
        }else {
          var or__3824__auto____7943 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7943)) {
            return or__3824__auto____7943
          }else {
            var or__3824__auto____7944 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7944)) {
              return or__3824__auto____7944
            }else {
              var or__3824__auto____7945 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7945)) {
                return or__3824__auto____7945
              }else {
                var or__3824__auto____7946 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7946)) {
                  return or__3824__auto____7946
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7996__delegate = function(x, y, z, args) {
          var or__3824__auto____7947 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7947)) {
            return or__3824__auto____7947
          }else {
            return cljs.core.some.call(null, function(p1__7677_SHARP_) {
              var or__3824__auto____7948 = p1.call(null, p1__7677_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7948)) {
                return or__3824__auto____7948
              }else {
                return p2.call(null, p1__7677_SHARP_)
              }
            }, args)
          }
        };
        var G__7996 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7996__delegate.call(this, x, y, z, args)
        };
        G__7996.cljs$lang$maxFixedArity = 3;
        G__7996.cljs$lang$applyTo = function(arglist__7997) {
          var x = cljs.core.first(arglist__7997);
          var y = cljs.core.first(cljs.core.next(arglist__7997));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7997)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7997)));
          return G__7996__delegate(x, y, z, args)
        };
        G__7996.cljs$lang$arity$variadic = G__7996__delegate;
        return G__7996
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____7967 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7967)) {
          return or__3824__auto____7967
        }else {
          var or__3824__auto____7968 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7968)) {
            return or__3824__auto____7968
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7969 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7969)) {
          return or__3824__auto____7969
        }else {
          var or__3824__auto____7970 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7970)) {
            return or__3824__auto____7970
          }else {
            var or__3824__auto____7971 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7971)) {
              return or__3824__auto____7971
            }else {
              var or__3824__auto____7972 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7972)) {
                return or__3824__auto____7972
              }else {
                var or__3824__auto____7973 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7973)) {
                  return or__3824__auto____7973
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____7974 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7974)) {
          return or__3824__auto____7974
        }else {
          var or__3824__auto____7975 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7975)) {
            return or__3824__auto____7975
          }else {
            var or__3824__auto____7976 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7976)) {
              return or__3824__auto____7976
            }else {
              var or__3824__auto____7977 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7977)) {
                return or__3824__auto____7977
              }else {
                var or__3824__auto____7978 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7978)) {
                  return or__3824__auto____7978
                }else {
                  var or__3824__auto____7979 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____7979)) {
                    return or__3824__auto____7979
                  }else {
                    var or__3824__auto____7980 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____7980)) {
                      return or__3824__auto____7980
                    }else {
                      var or__3824__auto____7981 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____7981)) {
                        return or__3824__auto____7981
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7998__delegate = function(x, y, z, args) {
          var or__3824__auto____7982 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7982)) {
            return or__3824__auto____7982
          }else {
            return cljs.core.some.call(null, function(p1__7678_SHARP_) {
              var or__3824__auto____7983 = p1.call(null, p1__7678_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7983)) {
                return or__3824__auto____7983
              }else {
                var or__3824__auto____7984 = p2.call(null, p1__7678_SHARP_);
                if(cljs.core.truth_(or__3824__auto____7984)) {
                  return or__3824__auto____7984
                }else {
                  return p3.call(null, p1__7678_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7998 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7998__delegate.call(this, x, y, z, args)
        };
        G__7998.cljs$lang$maxFixedArity = 3;
        G__7998.cljs$lang$applyTo = function(arglist__7999) {
          var x = cljs.core.first(arglist__7999);
          var y = cljs.core.first(cljs.core.next(arglist__7999));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7999)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7999)));
          return G__7998__delegate(x, y, z, args)
        };
        G__7998.cljs$lang$arity$variadic = G__7998__delegate;
        return G__7998
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8000__delegate = function(p1, p2, p3, ps) {
      var ps__7985 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7679_SHARP_) {
            return p1__7679_SHARP_.call(null, x)
          }, ps__7985)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7680_SHARP_) {
            var or__3824__auto____7990 = p1__7680_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7990)) {
              return or__3824__auto____7990
            }else {
              return p1__7680_SHARP_.call(null, y)
            }
          }, ps__7985)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7681_SHARP_) {
            var or__3824__auto____7991 = p1__7681_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7991)) {
              return or__3824__auto____7991
            }else {
              var or__3824__auto____7992 = p1__7681_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7992)) {
                return or__3824__auto____7992
              }else {
                return p1__7681_SHARP_.call(null, z)
              }
            }
          }, ps__7985)
        };
        var spn__4 = function() {
          var G__8001__delegate = function(x, y, z, args) {
            var or__3824__auto____7993 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____7993)) {
              return or__3824__auto____7993
            }else {
              return cljs.core.some.call(null, function(p1__7682_SHARP_) {
                return cljs.core.some.call(null, p1__7682_SHARP_, args)
              }, ps__7985)
            }
          };
          var G__8001 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8001__delegate.call(this, x, y, z, args)
          };
          G__8001.cljs$lang$maxFixedArity = 3;
          G__8001.cljs$lang$applyTo = function(arglist__8002) {
            var x = cljs.core.first(arglist__8002);
            var y = cljs.core.first(cljs.core.next(arglist__8002));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8002)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8002)));
            return G__8001__delegate(x, y, z, args)
          };
          G__8001.cljs$lang$arity$variadic = G__8001__delegate;
          return G__8001
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8000 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8000__delegate.call(this, p1, p2, p3, ps)
    };
    G__8000.cljs$lang$maxFixedArity = 3;
    G__8000.cljs$lang$applyTo = function(arglist__8003) {
      var p1 = cljs.core.first(arglist__8003);
      var p2 = cljs.core.first(cljs.core.next(arglist__8003));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8003)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8003)));
      return G__8000__delegate(p1, p2, p3, ps)
    };
    G__8000.cljs$lang$arity$variadic = G__8000__delegate;
    return G__8000
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8022 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8022) {
        var s__8023 = temp__3974__auto____8022;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8023)) {
          var c__8024 = cljs.core.chunk_first.call(null, s__8023);
          var size__8025 = cljs.core.count.call(null, c__8024);
          var b__8026 = cljs.core.chunk_buffer.call(null, size__8025);
          var n__2527__auto____8027 = size__8025;
          var i__8028 = 0;
          while(true) {
            if(i__8028 < n__2527__auto____8027) {
              cljs.core.chunk_append.call(null, b__8026, f.call(null, cljs.core._nth.call(null, c__8024, i__8028)));
              var G__8040 = i__8028 + 1;
              i__8028 = G__8040;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8026), map.call(null, f, cljs.core.chunk_rest.call(null, s__8023)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8023)), map.call(null, f, cljs.core.rest.call(null, s__8023)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8029 = cljs.core.seq.call(null, c1);
      var s2__8030 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8031 = s1__8029;
        if(and__3822__auto____8031) {
          return s2__8030
        }else {
          return and__3822__auto____8031
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8029), cljs.core.first.call(null, s2__8030)), map.call(null, f, cljs.core.rest.call(null, s1__8029), cljs.core.rest.call(null, s2__8030)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8032 = cljs.core.seq.call(null, c1);
      var s2__8033 = cljs.core.seq.call(null, c2);
      var s3__8034 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8035 = s1__8032;
        if(and__3822__auto____8035) {
          var and__3822__auto____8036 = s2__8033;
          if(and__3822__auto____8036) {
            return s3__8034
          }else {
            return and__3822__auto____8036
          }
        }else {
          return and__3822__auto____8035
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8032), cljs.core.first.call(null, s2__8033), cljs.core.first.call(null, s3__8034)), map.call(null, f, cljs.core.rest.call(null, s1__8032), cljs.core.rest.call(null, s2__8033), cljs.core.rest.call(null, s3__8034)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8041__delegate = function(f, c1, c2, c3, colls) {
      var step__8039 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8038 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8038)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8038), step.call(null, map.call(null, cljs.core.rest, ss__8038)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7843_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7843_SHARP_)
      }, step__8039.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8041 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8041__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8041.cljs$lang$maxFixedArity = 4;
    G__8041.cljs$lang$applyTo = function(arglist__8042) {
      var f = cljs.core.first(arglist__8042);
      var c1 = cljs.core.first(cljs.core.next(arglist__8042));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8042)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8042))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8042))));
      return G__8041__delegate(f, c1, c2, c3, colls)
    };
    G__8041.cljs$lang$arity$variadic = G__8041__delegate;
    return G__8041
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8045 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8045) {
        var s__8046 = temp__3974__auto____8045;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8046), take.call(null, n - 1, cljs.core.rest.call(null, s__8046)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8052 = function(n, coll) {
    while(true) {
      var s__8050 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8051 = n > 0;
        if(and__3822__auto____8051) {
          return s__8050
        }else {
          return and__3822__auto____8051
        }
      }())) {
        var G__8053 = n - 1;
        var G__8054 = cljs.core.rest.call(null, s__8050);
        n = G__8053;
        coll = G__8054;
        continue
      }else {
        return s__8050
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8052.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8057 = cljs.core.seq.call(null, coll);
  var lead__8058 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8058) {
      var G__8059 = cljs.core.next.call(null, s__8057);
      var G__8060 = cljs.core.next.call(null, lead__8058);
      s__8057 = G__8059;
      lead__8058 = G__8060;
      continue
    }else {
      return s__8057
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8066 = function(pred, coll) {
    while(true) {
      var s__8064 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8065 = s__8064;
        if(and__3822__auto____8065) {
          return pred.call(null, cljs.core.first.call(null, s__8064))
        }else {
          return and__3822__auto____8065
        }
      }())) {
        var G__8067 = pred;
        var G__8068 = cljs.core.rest.call(null, s__8064);
        pred = G__8067;
        coll = G__8068;
        continue
      }else {
        return s__8064
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8066.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8071 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8071) {
      var s__8072 = temp__3974__auto____8071;
      return cljs.core.concat.call(null, s__8072, cycle.call(null, s__8072))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8077 = cljs.core.seq.call(null, c1);
      var s2__8078 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8079 = s1__8077;
        if(and__3822__auto____8079) {
          return s2__8078
        }else {
          return and__3822__auto____8079
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8077), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8078), interleave.call(null, cljs.core.rest.call(null, s1__8077), cljs.core.rest.call(null, s2__8078))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8081__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8080 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8080)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8080), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8080)))
        }else {
          return null
        }
      }, null)
    };
    var G__8081 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8081__delegate.call(this, c1, c2, colls)
    };
    G__8081.cljs$lang$maxFixedArity = 2;
    G__8081.cljs$lang$applyTo = function(arglist__8082) {
      var c1 = cljs.core.first(arglist__8082);
      var c2 = cljs.core.first(cljs.core.next(arglist__8082));
      var colls = cljs.core.rest(cljs.core.next(arglist__8082));
      return G__8081__delegate(c1, c2, colls)
    };
    G__8081.cljs$lang$arity$variadic = G__8081__delegate;
    return G__8081
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8092 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8090 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8090) {
        var coll__8091 = temp__3971__auto____8090;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8091), cat.call(null, cljs.core.rest.call(null, coll__8091), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8092.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8093__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8093 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8093__delegate.call(this, f, coll, colls)
    };
    G__8093.cljs$lang$maxFixedArity = 2;
    G__8093.cljs$lang$applyTo = function(arglist__8094) {
      var f = cljs.core.first(arglist__8094);
      var coll = cljs.core.first(cljs.core.next(arglist__8094));
      var colls = cljs.core.rest(cljs.core.next(arglist__8094));
      return G__8093__delegate(f, coll, colls)
    };
    G__8093.cljs$lang$arity$variadic = G__8093__delegate;
    return G__8093
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8104 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8104) {
      var s__8105 = temp__3974__auto____8104;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8105)) {
        var c__8106 = cljs.core.chunk_first.call(null, s__8105);
        var size__8107 = cljs.core.count.call(null, c__8106);
        var b__8108 = cljs.core.chunk_buffer.call(null, size__8107);
        var n__2527__auto____8109 = size__8107;
        var i__8110 = 0;
        while(true) {
          if(i__8110 < n__2527__auto____8109) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8106, i__8110)))) {
              cljs.core.chunk_append.call(null, b__8108, cljs.core._nth.call(null, c__8106, i__8110))
            }else {
            }
            var G__8113 = i__8110 + 1;
            i__8110 = G__8113;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8108), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8105)))
      }else {
        var f__8111 = cljs.core.first.call(null, s__8105);
        var r__8112 = cljs.core.rest.call(null, s__8105);
        if(cljs.core.truth_(pred.call(null, f__8111))) {
          return cljs.core.cons.call(null, f__8111, filter.call(null, pred, r__8112))
        }else {
          return filter.call(null, pred, r__8112)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8116 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8116.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8114_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8114_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8120__8121 = to;
    if(G__8120__8121) {
      if(function() {
        var or__3824__auto____8122 = G__8120__8121.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8122) {
          return or__3824__auto____8122
        }else {
          return G__8120__8121.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8120__8121.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8120__8121)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8120__8121)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8123__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8123 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8123__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8123.cljs$lang$maxFixedArity = 4;
    G__8123.cljs$lang$applyTo = function(arglist__8124) {
      var f = cljs.core.first(arglist__8124);
      var c1 = cljs.core.first(cljs.core.next(arglist__8124));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8124)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8124))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8124))));
      return G__8123__delegate(f, c1, c2, c3, colls)
    };
    G__8123.cljs$lang$arity$variadic = G__8123__delegate;
    return G__8123
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8131 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8131) {
        var s__8132 = temp__3974__auto____8131;
        var p__8133 = cljs.core.take.call(null, n, s__8132);
        if(n === cljs.core.count.call(null, p__8133)) {
          return cljs.core.cons.call(null, p__8133, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8132)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8134 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8134) {
        var s__8135 = temp__3974__auto____8134;
        var p__8136 = cljs.core.take.call(null, n, s__8135);
        if(n === cljs.core.count.call(null, p__8136)) {
          return cljs.core.cons.call(null, p__8136, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8135)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8136, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8141 = cljs.core.lookup_sentinel;
    var m__8142 = m;
    var ks__8143 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8143) {
        var m__8144 = cljs.core._lookup.call(null, m__8142, cljs.core.first.call(null, ks__8143), sentinel__8141);
        if(sentinel__8141 === m__8144) {
          return not_found
        }else {
          var G__8145 = sentinel__8141;
          var G__8146 = m__8144;
          var G__8147 = cljs.core.next.call(null, ks__8143);
          sentinel__8141 = G__8145;
          m__8142 = G__8146;
          ks__8143 = G__8147;
          continue
        }
      }else {
        return m__8142
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8148, v) {
  var vec__8153__8154 = p__8148;
  var k__8155 = cljs.core.nth.call(null, vec__8153__8154, 0, null);
  var ks__8156 = cljs.core.nthnext.call(null, vec__8153__8154, 1);
  if(cljs.core.truth_(ks__8156)) {
    return cljs.core.assoc.call(null, m, k__8155, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8155, null), ks__8156, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8155, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8157, f, args) {
    var vec__8162__8163 = p__8157;
    var k__8164 = cljs.core.nth.call(null, vec__8162__8163, 0, null);
    var ks__8165 = cljs.core.nthnext.call(null, vec__8162__8163, 1);
    if(cljs.core.truth_(ks__8165)) {
      return cljs.core.assoc.call(null, m, k__8164, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8164, null), ks__8165, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8164, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8164, null), args))
    }
  };
  var update_in = function(m, p__8157, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8157, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8166) {
    var m = cljs.core.first(arglist__8166);
    var p__8157 = cljs.core.first(cljs.core.next(arglist__8166));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8166)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8166)));
    return update_in__delegate(m, p__8157, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8169 = this;
  var h__2192__auto____8170 = this__8169.__hash;
  if(!(h__2192__auto____8170 == null)) {
    return h__2192__auto____8170
  }else {
    var h__2192__auto____8171 = cljs.core.hash_coll.call(null, coll);
    this__8169.__hash = h__2192__auto____8171;
    return h__2192__auto____8171
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8172 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8173 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8174 = this;
  var new_array__8175 = this__8174.array.slice();
  new_array__8175[k] = v;
  return new cljs.core.Vector(this__8174.meta, new_array__8175, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8206 = null;
  var G__8206__2 = function(this_sym8176, k) {
    var this__8178 = this;
    var this_sym8176__8179 = this;
    var coll__8180 = this_sym8176__8179;
    return coll__8180.cljs$core$ILookup$_lookup$arity$2(coll__8180, k)
  };
  var G__8206__3 = function(this_sym8177, k, not_found) {
    var this__8178 = this;
    var this_sym8177__8181 = this;
    var coll__8182 = this_sym8177__8181;
    return coll__8182.cljs$core$ILookup$_lookup$arity$3(coll__8182, k, not_found)
  };
  G__8206 = function(this_sym8177, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8206__2.call(this, this_sym8177, k);
      case 3:
        return G__8206__3.call(this, this_sym8177, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8206
}();
cljs.core.Vector.prototype.apply = function(this_sym8167, args8168) {
  var this__8183 = this;
  return this_sym8167.call.apply(this_sym8167, [this_sym8167].concat(args8168.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8184 = this;
  var new_array__8185 = this__8184.array.slice();
  new_array__8185.push(o);
  return new cljs.core.Vector(this__8184.meta, new_array__8185, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8186 = this;
  var this__8187 = this;
  return cljs.core.pr_str.call(null, this__8187)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8188 = this;
  return cljs.core.ci_reduce.call(null, this__8188.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8189 = this;
  return cljs.core.ci_reduce.call(null, this__8189.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8190 = this;
  if(this__8190.array.length > 0) {
    var vector_seq__8191 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8190.array.length) {
          return cljs.core.cons.call(null, this__8190.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8191.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8192 = this;
  return this__8192.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8193 = this;
  var count__8194 = this__8193.array.length;
  if(count__8194 > 0) {
    return this__8193.array[count__8194 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8195 = this;
  if(this__8195.array.length > 0) {
    var new_array__8196 = this__8195.array.slice();
    new_array__8196.pop();
    return new cljs.core.Vector(this__8195.meta, new_array__8196, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8197 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8198 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8199 = this;
  return new cljs.core.Vector(meta, this__8199.array, this__8199.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8200 = this;
  return this__8200.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8201 = this;
  if(function() {
    var and__3822__auto____8202 = 0 <= n;
    if(and__3822__auto____8202) {
      return n < this__8201.array.length
    }else {
      return and__3822__auto____8202
    }
  }()) {
    return this__8201.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8203 = this;
  if(function() {
    var and__3822__auto____8204 = 0 <= n;
    if(and__3822__auto____8204) {
      return n < this__8203.array.length
    }else {
      return and__3822__auto____8204
    }
  }()) {
    return this__8203.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8205 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8205.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8208 = pv.cnt;
  if(cnt__8208 < 32) {
    return 0
  }else {
    return cnt__8208 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8214 = level;
  var ret__8215 = node;
  while(true) {
    if(ll__8214 === 0) {
      return ret__8215
    }else {
      var embed__8216 = ret__8215;
      var r__8217 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8218 = cljs.core.pv_aset.call(null, r__8217, 0, embed__8216);
      var G__8219 = ll__8214 - 5;
      var G__8220 = r__8217;
      ll__8214 = G__8219;
      ret__8215 = G__8220;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8226 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8227 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8226, subidx__8227, tailnode);
    return ret__8226
  }else {
    var child__8228 = cljs.core.pv_aget.call(null, parent, subidx__8227);
    if(!(child__8228 == null)) {
      var node_to_insert__8229 = push_tail.call(null, pv, level - 5, child__8228, tailnode);
      cljs.core.pv_aset.call(null, ret__8226, subidx__8227, node_to_insert__8229);
      return ret__8226
    }else {
      var node_to_insert__8230 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8226, subidx__8227, node_to_insert__8230);
      return ret__8226
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8234 = 0 <= i;
    if(and__3822__auto____8234) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8234
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8235 = pv.root;
      var level__8236 = pv.shift;
      while(true) {
        if(level__8236 > 0) {
          var G__8237 = cljs.core.pv_aget.call(null, node__8235, i >>> level__8236 & 31);
          var G__8238 = level__8236 - 5;
          node__8235 = G__8237;
          level__8236 = G__8238;
          continue
        }else {
          return node__8235.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8241 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8241, i & 31, val);
    return ret__8241
  }else {
    var subidx__8242 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8241, subidx__8242, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8242), i, val));
    return ret__8241
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8248 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8249 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8248));
    if(function() {
      var and__3822__auto____8250 = new_child__8249 == null;
      if(and__3822__auto____8250) {
        return subidx__8248 === 0
      }else {
        return and__3822__auto____8250
      }
    }()) {
      return null
    }else {
      var ret__8251 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8251, subidx__8248, new_child__8249);
      return ret__8251
    }
  }else {
    if(subidx__8248 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8252 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8252, subidx__8248, null);
        return ret__8252
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8255 = this;
  return new cljs.core.TransientVector(this__8255.cnt, this__8255.shift, cljs.core.tv_editable_root.call(null, this__8255.root), cljs.core.tv_editable_tail.call(null, this__8255.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8256 = this;
  var h__2192__auto____8257 = this__8256.__hash;
  if(!(h__2192__auto____8257 == null)) {
    return h__2192__auto____8257
  }else {
    var h__2192__auto____8258 = cljs.core.hash_coll.call(null, coll);
    this__8256.__hash = h__2192__auto____8258;
    return h__2192__auto____8258
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8259 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8260 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8261 = this;
  if(function() {
    var and__3822__auto____8262 = 0 <= k;
    if(and__3822__auto____8262) {
      return k < this__8261.cnt
    }else {
      return and__3822__auto____8262
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8263 = this__8261.tail.slice();
      new_tail__8263[k & 31] = v;
      return new cljs.core.PersistentVector(this__8261.meta, this__8261.cnt, this__8261.shift, this__8261.root, new_tail__8263, null)
    }else {
      return new cljs.core.PersistentVector(this__8261.meta, this__8261.cnt, this__8261.shift, cljs.core.do_assoc.call(null, coll, this__8261.shift, this__8261.root, k, v), this__8261.tail, null)
    }
  }else {
    if(k === this__8261.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8261.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8311 = null;
  var G__8311__2 = function(this_sym8264, k) {
    var this__8266 = this;
    var this_sym8264__8267 = this;
    var coll__8268 = this_sym8264__8267;
    return coll__8268.cljs$core$ILookup$_lookup$arity$2(coll__8268, k)
  };
  var G__8311__3 = function(this_sym8265, k, not_found) {
    var this__8266 = this;
    var this_sym8265__8269 = this;
    var coll__8270 = this_sym8265__8269;
    return coll__8270.cljs$core$ILookup$_lookup$arity$3(coll__8270, k, not_found)
  };
  G__8311 = function(this_sym8265, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8311__2.call(this, this_sym8265, k);
      case 3:
        return G__8311__3.call(this, this_sym8265, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8311
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8253, args8254) {
  var this__8271 = this;
  return this_sym8253.call.apply(this_sym8253, [this_sym8253].concat(args8254.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8272 = this;
  var step_init__8273 = [0, init];
  var i__8274 = 0;
  while(true) {
    if(i__8274 < this__8272.cnt) {
      var arr__8275 = cljs.core.array_for.call(null, v, i__8274);
      var len__8276 = arr__8275.length;
      var init__8280 = function() {
        var j__8277 = 0;
        var init__8278 = step_init__8273[1];
        while(true) {
          if(j__8277 < len__8276) {
            var init__8279 = f.call(null, init__8278, j__8277 + i__8274, arr__8275[j__8277]);
            if(cljs.core.reduced_QMARK_.call(null, init__8279)) {
              return init__8279
            }else {
              var G__8312 = j__8277 + 1;
              var G__8313 = init__8279;
              j__8277 = G__8312;
              init__8278 = G__8313;
              continue
            }
          }else {
            step_init__8273[0] = len__8276;
            step_init__8273[1] = init__8278;
            return init__8278
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8280)) {
        return cljs.core.deref.call(null, init__8280)
      }else {
        var G__8314 = i__8274 + step_init__8273[0];
        i__8274 = G__8314;
        continue
      }
    }else {
      return step_init__8273[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8281 = this;
  if(this__8281.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8282 = this__8281.tail.slice();
    new_tail__8282.push(o);
    return new cljs.core.PersistentVector(this__8281.meta, this__8281.cnt + 1, this__8281.shift, this__8281.root, new_tail__8282, null)
  }else {
    var root_overflow_QMARK___8283 = this__8281.cnt >>> 5 > 1 << this__8281.shift;
    var new_shift__8284 = root_overflow_QMARK___8283 ? this__8281.shift + 5 : this__8281.shift;
    var new_root__8286 = root_overflow_QMARK___8283 ? function() {
      var n_r__8285 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8285, 0, this__8281.root);
      cljs.core.pv_aset.call(null, n_r__8285, 1, cljs.core.new_path.call(null, null, this__8281.shift, new cljs.core.VectorNode(null, this__8281.tail)));
      return n_r__8285
    }() : cljs.core.push_tail.call(null, coll, this__8281.shift, this__8281.root, new cljs.core.VectorNode(null, this__8281.tail));
    return new cljs.core.PersistentVector(this__8281.meta, this__8281.cnt + 1, new_shift__8284, new_root__8286, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8287 = this;
  if(this__8287.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8287.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8288 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8289 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8290 = this;
  var this__8291 = this;
  return cljs.core.pr_str.call(null, this__8291)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8292 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8293 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8294 = this;
  if(this__8294.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8295 = this;
  return this__8295.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8296 = this;
  if(this__8296.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8296.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8297 = this;
  if(this__8297.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8297.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8297.meta)
    }else {
      if(1 < this__8297.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8297.meta, this__8297.cnt - 1, this__8297.shift, this__8297.root, this__8297.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8298 = cljs.core.array_for.call(null, coll, this__8297.cnt - 2);
          var nr__8299 = cljs.core.pop_tail.call(null, coll, this__8297.shift, this__8297.root);
          var new_root__8300 = nr__8299 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8299;
          var cnt_1__8301 = this__8297.cnt - 1;
          if(function() {
            var and__3822__auto____8302 = 5 < this__8297.shift;
            if(and__3822__auto____8302) {
              return cljs.core.pv_aget.call(null, new_root__8300, 1) == null
            }else {
              return and__3822__auto____8302
            }
          }()) {
            return new cljs.core.PersistentVector(this__8297.meta, cnt_1__8301, this__8297.shift - 5, cljs.core.pv_aget.call(null, new_root__8300, 0), new_tail__8298, null)
          }else {
            return new cljs.core.PersistentVector(this__8297.meta, cnt_1__8301, this__8297.shift, new_root__8300, new_tail__8298, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8303 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8304 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8305 = this;
  return new cljs.core.PersistentVector(meta, this__8305.cnt, this__8305.shift, this__8305.root, this__8305.tail, this__8305.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8306 = this;
  return this__8306.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8307 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8308 = this;
  if(function() {
    var and__3822__auto____8309 = 0 <= n;
    if(and__3822__auto____8309) {
      return n < this__8308.cnt
    }else {
      return and__3822__auto____8309
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8310 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8310.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8315 = xs.length;
  var xs__8316 = no_clone === true ? xs : xs.slice();
  if(l__8315 < 32) {
    return new cljs.core.PersistentVector(null, l__8315, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8316, null)
  }else {
    var node__8317 = xs__8316.slice(0, 32);
    var v__8318 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8317, null);
    var i__8319 = 32;
    var out__8320 = cljs.core._as_transient.call(null, v__8318);
    while(true) {
      if(i__8319 < l__8315) {
        var G__8321 = i__8319 + 1;
        var G__8322 = cljs.core.conj_BANG_.call(null, out__8320, xs__8316[i__8319]);
        i__8319 = G__8321;
        out__8320 = G__8322;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8320)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8323) {
    var args = cljs.core.seq(arglist__8323);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8324 = this;
  if(this__8324.off + 1 < this__8324.node.length) {
    var s__8325 = cljs.core.chunked_seq.call(null, this__8324.vec, this__8324.node, this__8324.i, this__8324.off + 1);
    if(s__8325 == null) {
      return null
    }else {
      return s__8325
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8326 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8327 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8328 = this;
  return this__8328.node[this__8328.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8329 = this;
  if(this__8329.off + 1 < this__8329.node.length) {
    var s__8330 = cljs.core.chunked_seq.call(null, this__8329.vec, this__8329.node, this__8329.i, this__8329.off + 1);
    if(s__8330 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8330
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8331 = this;
  var l__8332 = this__8331.node.length;
  var s__8333 = this__8331.i + l__8332 < cljs.core._count.call(null, this__8331.vec) ? cljs.core.chunked_seq.call(null, this__8331.vec, this__8331.i + l__8332, 0) : null;
  if(s__8333 == null) {
    return null
  }else {
    return s__8333
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8334 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8335 = this;
  return cljs.core.chunked_seq.call(null, this__8335.vec, this__8335.node, this__8335.i, this__8335.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8336 = this;
  return this__8336.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8337 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8337.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8338 = this;
  return cljs.core.array_chunk.call(null, this__8338.node, this__8338.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8339 = this;
  var l__8340 = this__8339.node.length;
  var s__8341 = this__8339.i + l__8340 < cljs.core._count.call(null, this__8339.vec) ? cljs.core.chunked_seq.call(null, this__8339.vec, this__8339.i + l__8340, 0) : null;
  if(s__8341 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8341
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8344 = this;
  var h__2192__auto____8345 = this__8344.__hash;
  if(!(h__2192__auto____8345 == null)) {
    return h__2192__auto____8345
  }else {
    var h__2192__auto____8346 = cljs.core.hash_coll.call(null, coll);
    this__8344.__hash = h__2192__auto____8346;
    return h__2192__auto____8346
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8347 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8348 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8349 = this;
  var v_pos__8350 = this__8349.start + key;
  return new cljs.core.Subvec(this__8349.meta, cljs.core._assoc.call(null, this__8349.v, v_pos__8350, val), this__8349.start, this__8349.end > v_pos__8350 + 1 ? this__8349.end : v_pos__8350 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8376 = null;
  var G__8376__2 = function(this_sym8351, k) {
    var this__8353 = this;
    var this_sym8351__8354 = this;
    var coll__8355 = this_sym8351__8354;
    return coll__8355.cljs$core$ILookup$_lookup$arity$2(coll__8355, k)
  };
  var G__8376__3 = function(this_sym8352, k, not_found) {
    var this__8353 = this;
    var this_sym8352__8356 = this;
    var coll__8357 = this_sym8352__8356;
    return coll__8357.cljs$core$ILookup$_lookup$arity$3(coll__8357, k, not_found)
  };
  G__8376 = function(this_sym8352, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8376__2.call(this, this_sym8352, k);
      case 3:
        return G__8376__3.call(this, this_sym8352, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8376
}();
cljs.core.Subvec.prototype.apply = function(this_sym8342, args8343) {
  var this__8358 = this;
  return this_sym8342.call.apply(this_sym8342, [this_sym8342].concat(args8343.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8359 = this;
  return new cljs.core.Subvec(this__8359.meta, cljs.core._assoc_n.call(null, this__8359.v, this__8359.end, o), this__8359.start, this__8359.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8360 = this;
  var this__8361 = this;
  return cljs.core.pr_str.call(null, this__8361)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8362 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8363 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8364 = this;
  var subvec_seq__8365 = function subvec_seq(i) {
    if(i === this__8364.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8364.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8365.call(null, this__8364.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8366 = this;
  return this__8366.end - this__8366.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8367 = this;
  return cljs.core._nth.call(null, this__8367.v, this__8367.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8368 = this;
  if(this__8368.start === this__8368.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8368.meta, this__8368.v, this__8368.start, this__8368.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8369 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8370 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8371 = this;
  return new cljs.core.Subvec(meta, this__8371.v, this__8371.start, this__8371.end, this__8371.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8372 = this;
  return this__8372.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8373 = this;
  return cljs.core._nth.call(null, this__8373.v, this__8373.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8374 = this;
  return cljs.core._nth.call(null, this__8374.v, this__8374.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8375 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8375.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8378 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8378, 0, tl.length);
  return ret__8378
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8382 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8383 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8382, subidx__8383, level === 5 ? tail_node : function() {
    var child__8384 = cljs.core.pv_aget.call(null, ret__8382, subidx__8383);
    if(!(child__8384 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8384, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8382
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8389 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8390 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8391 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8389, subidx__8390));
    if(function() {
      var and__3822__auto____8392 = new_child__8391 == null;
      if(and__3822__auto____8392) {
        return subidx__8390 === 0
      }else {
        return and__3822__auto____8392
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8389, subidx__8390, new_child__8391);
      return node__8389
    }
  }else {
    if(subidx__8390 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8389, subidx__8390, null);
        return node__8389
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8397 = 0 <= i;
    if(and__3822__auto____8397) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8397
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8398 = tv.root;
      var node__8399 = root__8398;
      var level__8400 = tv.shift;
      while(true) {
        if(level__8400 > 0) {
          var G__8401 = cljs.core.tv_ensure_editable.call(null, root__8398.edit, cljs.core.pv_aget.call(null, node__8399, i >>> level__8400 & 31));
          var G__8402 = level__8400 - 5;
          node__8399 = G__8401;
          level__8400 = G__8402;
          continue
        }else {
          return node__8399.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8442 = null;
  var G__8442__2 = function(this_sym8405, k) {
    var this__8407 = this;
    var this_sym8405__8408 = this;
    var coll__8409 = this_sym8405__8408;
    return coll__8409.cljs$core$ILookup$_lookup$arity$2(coll__8409, k)
  };
  var G__8442__3 = function(this_sym8406, k, not_found) {
    var this__8407 = this;
    var this_sym8406__8410 = this;
    var coll__8411 = this_sym8406__8410;
    return coll__8411.cljs$core$ILookup$_lookup$arity$3(coll__8411, k, not_found)
  };
  G__8442 = function(this_sym8406, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8442__2.call(this, this_sym8406, k);
      case 3:
        return G__8442__3.call(this, this_sym8406, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8442
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8403, args8404) {
  var this__8412 = this;
  return this_sym8403.call.apply(this_sym8403, [this_sym8403].concat(args8404.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8413 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8414 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8415 = this;
  if(this__8415.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8416 = this;
  if(function() {
    var and__3822__auto____8417 = 0 <= n;
    if(and__3822__auto____8417) {
      return n < this__8416.cnt
    }else {
      return and__3822__auto____8417
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8418 = this;
  if(this__8418.root.edit) {
    return this__8418.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8419 = this;
  if(this__8419.root.edit) {
    if(function() {
      var and__3822__auto____8420 = 0 <= n;
      if(and__3822__auto____8420) {
        return n < this__8419.cnt
      }else {
        return and__3822__auto____8420
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8419.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8425 = function go(level, node) {
          var node__8423 = cljs.core.tv_ensure_editable.call(null, this__8419.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8423, n & 31, val);
            return node__8423
          }else {
            var subidx__8424 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8423, subidx__8424, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8423, subidx__8424)));
            return node__8423
          }
        }.call(null, this__8419.shift, this__8419.root);
        this__8419.root = new_root__8425;
        return tcoll
      }
    }else {
      if(n === this__8419.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8419.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8426 = this;
  if(this__8426.root.edit) {
    if(this__8426.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8426.cnt) {
        this__8426.cnt = 0;
        return tcoll
      }else {
        if((this__8426.cnt - 1 & 31) > 0) {
          this__8426.cnt = this__8426.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8427 = cljs.core.editable_array_for.call(null, tcoll, this__8426.cnt - 2);
            var new_root__8429 = function() {
              var nr__8428 = cljs.core.tv_pop_tail.call(null, tcoll, this__8426.shift, this__8426.root);
              if(!(nr__8428 == null)) {
                return nr__8428
              }else {
                return new cljs.core.VectorNode(this__8426.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8430 = 5 < this__8426.shift;
              if(and__3822__auto____8430) {
                return cljs.core.pv_aget.call(null, new_root__8429, 1) == null
              }else {
                return and__3822__auto____8430
              }
            }()) {
              var new_root__8431 = cljs.core.tv_ensure_editable.call(null, this__8426.root.edit, cljs.core.pv_aget.call(null, new_root__8429, 0));
              this__8426.root = new_root__8431;
              this__8426.shift = this__8426.shift - 5;
              this__8426.cnt = this__8426.cnt - 1;
              this__8426.tail = new_tail__8427;
              return tcoll
            }else {
              this__8426.root = new_root__8429;
              this__8426.cnt = this__8426.cnt - 1;
              this__8426.tail = new_tail__8427;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8432 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8433 = this;
  if(this__8433.root.edit) {
    if(this__8433.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8433.tail[this__8433.cnt & 31] = o;
      this__8433.cnt = this__8433.cnt + 1;
      return tcoll
    }else {
      var tail_node__8434 = new cljs.core.VectorNode(this__8433.root.edit, this__8433.tail);
      var new_tail__8435 = cljs.core.make_array.call(null, 32);
      new_tail__8435[0] = o;
      this__8433.tail = new_tail__8435;
      if(this__8433.cnt >>> 5 > 1 << this__8433.shift) {
        var new_root_array__8436 = cljs.core.make_array.call(null, 32);
        var new_shift__8437 = this__8433.shift + 5;
        new_root_array__8436[0] = this__8433.root;
        new_root_array__8436[1] = cljs.core.new_path.call(null, this__8433.root.edit, this__8433.shift, tail_node__8434);
        this__8433.root = new cljs.core.VectorNode(this__8433.root.edit, new_root_array__8436);
        this__8433.shift = new_shift__8437;
        this__8433.cnt = this__8433.cnt + 1;
        return tcoll
      }else {
        var new_root__8438 = cljs.core.tv_push_tail.call(null, tcoll, this__8433.shift, this__8433.root, tail_node__8434);
        this__8433.root = new_root__8438;
        this__8433.cnt = this__8433.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8439 = this;
  if(this__8439.root.edit) {
    this__8439.root.edit = null;
    var len__8440 = this__8439.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8441 = cljs.core.make_array.call(null, len__8440);
    cljs.core.array_copy.call(null, this__8439.tail, 0, trimmed_tail__8441, 0, len__8440);
    return new cljs.core.PersistentVector(null, this__8439.cnt, this__8439.shift, this__8439.root, trimmed_tail__8441, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8443 = this;
  var h__2192__auto____8444 = this__8443.__hash;
  if(!(h__2192__auto____8444 == null)) {
    return h__2192__auto____8444
  }else {
    var h__2192__auto____8445 = cljs.core.hash_coll.call(null, coll);
    this__8443.__hash = h__2192__auto____8445;
    return h__2192__auto____8445
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8446 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8447 = this;
  var this__8448 = this;
  return cljs.core.pr_str.call(null, this__8448)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8449 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8450 = this;
  return cljs.core._first.call(null, this__8450.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8451 = this;
  var temp__3971__auto____8452 = cljs.core.next.call(null, this__8451.front);
  if(temp__3971__auto____8452) {
    var f1__8453 = temp__3971__auto____8452;
    return new cljs.core.PersistentQueueSeq(this__8451.meta, f1__8453, this__8451.rear, null)
  }else {
    if(this__8451.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8451.meta, this__8451.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8454 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8455 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8455.front, this__8455.rear, this__8455.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8456 = this;
  return this__8456.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8457 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8457.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8458 = this;
  var h__2192__auto____8459 = this__8458.__hash;
  if(!(h__2192__auto____8459 == null)) {
    return h__2192__auto____8459
  }else {
    var h__2192__auto____8460 = cljs.core.hash_coll.call(null, coll);
    this__8458.__hash = h__2192__auto____8460;
    return h__2192__auto____8460
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8461 = this;
  if(cljs.core.truth_(this__8461.front)) {
    return new cljs.core.PersistentQueue(this__8461.meta, this__8461.count + 1, this__8461.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8462 = this__8461.rear;
      if(cljs.core.truth_(or__3824__auto____8462)) {
        return or__3824__auto____8462
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8461.meta, this__8461.count + 1, cljs.core.conj.call(null, this__8461.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8463 = this;
  var this__8464 = this;
  return cljs.core.pr_str.call(null, this__8464)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8465 = this;
  var rear__8466 = cljs.core.seq.call(null, this__8465.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8467 = this__8465.front;
    if(cljs.core.truth_(or__3824__auto____8467)) {
      return or__3824__auto____8467
    }else {
      return rear__8466
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8465.front, cljs.core.seq.call(null, rear__8466), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8468 = this;
  return this__8468.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8469 = this;
  return cljs.core._first.call(null, this__8469.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8470 = this;
  if(cljs.core.truth_(this__8470.front)) {
    var temp__3971__auto____8471 = cljs.core.next.call(null, this__8470.front);
    if(temp__3971__auto____8471) {
      var f1__8472 = temp__3971__auto____8471;
      return new cljs.core.PersistentQueue(this__8470.meta, this__8470.count - 1, f1__8472, this__8470.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8470.meta, this__8470.count - 1, cljs.core.seq.call(null, this__8470.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8473 = this;
  return cljs.core.first.call(null, this__8473.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8474 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8475 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8476 = this;
  return new cljs.core.PersistentQueue(meta, this__8476.count, this__8476.front, this__8476.rear, this__8476.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8477 = this;
  return this__8477.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8478 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8479 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8482 = array.length;
  var i__8483 = 0;
  while(true) {
    if(i__8483 < len__8482) {
      if(k === array[i__8483]) {
        return i__8483
      }else {
        var G__8484 = i__8483 + incr;
        i__8483 = G__8484;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8487 = cljs.core.hash.call(null, a);
  var b__8488 = cljs.core.hash.call(null, b);
  if(a__8487 < b__8488) {
    return-1
  }else {
    if(a__8487 > b__8488) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8496 = m.keys;
  var len__8497 = ks__8496.length;
  var so__8498 = m.strobj;
  var out__8499 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8500 = 0;
  var out__8501 = cljs.core.transient$.call(null, out__8499);
  while(true) {
    if(i__8500 < len__8497) {
      var k__8502 = ks__8496[i__8500];
      var G__8503 = i__8500 + 1;
      var G__8504 = cljs.core.assoc_BANG_.call(null, out__8501, k__8502, so__8498[k__8502]);
      i__8500 = G__8503;
      out__8501 = G__8504;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8501, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8510 = {};
  var l__8511 = ks.length;
  var i__8512 = 0;
  while(true) {
    if(i__8512 < l__8511) {
      var k__8513 = ks[i__8512];
      new_obj__8510[k__8513] = obj[k__8513];
      var G__8514 = i__8512 + 1;
      i__8512 = G__8514;
      continue
    }else {
    }
    break
  }
  return new_obj__8510
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8517 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8518 = this;
  var h__2192__auto____8519 = this__8518.__hash;
  if(!(h__2192__auto____8519 == null)) {
    return h__2192__auto____8519
  }else {
    var h__2192__auto____8520 = cljs.core.hash_imap.call(null, coll);
    this__8518.__hash = h__2192__auto____8520;
    return h__2192__auto____8520
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8521 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8522 = this;
  if(function() {
    var and__3822__auto____8523 = goog.isString(k);
    if(and__3822__auto____8523) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8522.keys) == null)
    }else {
      return and__3822__auto____8523
    }
  }()) {
    return this__8522.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8524 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8525 = this__8524.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8525) {
        return or__3824__auto____8525
      }else {
        return this__8524.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8524.keys) == null)) {
        var new_strobj__8526 = cljs.core.obj_clone.call(null, this__8524.strobj, this__8524.keys);
        new_strobj__8526[k] = v;
        return new cljs.core.ObjMap(this__8524.meta, this__8524.keys, new_strobj__8526, this__8524.update_count + 1, null)
      }else {
        var new_strobj__8527 = cljs.core.obj_clone.call(null, this__8524.strobj, this__8524.keys);
        var new_keys__8528 = this__8524.keys.slice();
        new_strobj__8527[k] = v;
        new_keys__8528.push(k);
        return new cljs.core.ObjMap(this__8524.meta, new_keys__8528, new_strobj__8527, this__8524.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8529 = this;
  if(function() {
    var and__3822__auto____8530 = goog.isString(k);
    if(and__3822__auto____8530) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8529.keys) == null)
    }else {
      return and__3822__auto____8530
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8552 = null;
  var G__8552__2 = function(this_sym8531, k) {
    var this__8533 = this;
    var this_sym8531__8534 = this;
    var coll__8535 = this_sym8531__8534;
    return coll__8535.cljs$core$ILookup$_lookup$arity$2(coll__8535, k)
  };
  var G__8552__3 = function(this_sym8532, k, not_found) {
    var this__8533 = this;
    var this_sym8532__8536 = this;
    var coll__8537 = this_sym8532__8536;
    return coll__8537.cljs$core$ILookup$_lookup$arity$3(coll__8537, k, not_found)
  };
  G__8552 = function(this_sym8532, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8552__2.call(this, this_sym8532, k);
      case 3:
        return G__8552__3.call(this, this_sym8532, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8552
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8515, args8516) {
  var this__8538 = this;
  return this_sym8515.call.apply(this_sym8515, [this_sym8515].concat(args8516.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8539 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8540 = this;
  var this__8541 = this;
  return cljs.core.pr_str.call(null, this__8541)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8542 = this;
  if(this__8542.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8505_SHARP_) {
      return cljs.core.vector.call(null, p1__8505_SHARP_, this__8542.strobj[p1__8505_SHARP_])
    }, this__8542.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8543 = this;
  return this__8543.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8544 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8545 = this;
  return new cljs.core.ObjMap(meta, this__8545.keys, this__8545.strobj, this__8545.update_count, this__8545.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8546 = this;
  return this__8546.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8547 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8547.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8548 = this;
  if(function() {
    var and__3822__auto____8549 = goog.isString(k);
    if(and__3822__auto____8549) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8548.keys) == null)
    }else {
      return and__3822__auto____8549
    }
  }()) {
    var new_keys__8550 = this__8548.keys.slice();
    var new_strobj__8551 = cljs.core.obj_clone.call(null, this__8548.strobj, this__8548.keys);
    new_keys__8550.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8550), 1);
    cljs.core.js_delete.call(null, new_strobj__8551, k);
    return new cljs.core.ObjMap(this__8548.meta, new_keys__8550, new_strobj__8551, this__8548.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8556 = this;
  var h__2192__auto____8557 = this__8556.__hash;
  if(!(h__2192__auto____8557 == null)) {
    return h__2192__auto____8557
  }else {
    var h__2192__auto____8558 = cljs.core.hash_imap.call(null, coll);
    this__8556.__hash = h__2192__auto____8558;
    return h__2192__auto____8558
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8559 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8560 = this;
  var bucket__8561 = this__8560.hashobj[cljs.core.hash.call(null, k)];
  var i__8562 = cljs.core.truth_(bucket__8561) ? cljs.core.scan_array.call(null, 2, k, bucket__8561) : null;
  if(cljs.core.truth_(i__8562)) {
    return bucket__8561[i__8562 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8563 = this;
  var h__8564 = cljs.core.hash.call(null, k);
  var bucket__8565 = this__8563.hashobj[h__8564];
  if(cljs.core.truth_(bucket__8565)) {
    var new_bucket__8566 = bucket__8565.slice();
    var new_hashobj__8567 = goog.object.clone(this__8563.hashobj);
    new_hashobj__8567[h__8564] = new_bucket__8566;
    var temp__3971__auto____8568 = cljs.core.scan_array.call(null, 2, k, new_bucket__8566);
    if(cljs.core.truth_(temp__3971__auto____8568)) {
      var i__8569 = temp__3971__auto____8568;
      new_bucket__8566[i__8569 + 1] = v;
      return new cljs.core.HashMap(this__8563.meta, this__8563.count, new_hashobj__8567, null)
    }else {
      new_bucket__8566.push(k, v);
      return new cljs.core.HashMap(this__8563.meta, this__8563.count + 1, new_hashobj__8567, null)
    }
  }else {
    var new_hashobj__8570 = goog.object.clone(this__8563.hashobj);
    new_hashobj__8570[h__8564] = [k, v];
    return new cljs.core.HashMap(this__8563.meta, this__8563.count + 1, new_hashobj__8570, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8571 = this;
  var bucket__8572 = this__8571.hashobj[cljs.core.hash.call(null, k)];
  var i__8573 = cljs.core.truth_(bucket__8572) ? cljs.core.scan_array.call(null, 2, k, bucket__8572) : null;
  if(cljs.core.truth_(i__8573)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8598 = null;
  var G__8598__2 = function(this_sym8574, k) {
    var this__8576 = this;
    var this_sym8574__8577 = this;
    var coll__8578 = this_sym8574__8577;
    return coll__8578.cljs$core$ILookup$_lookup$arity$2(coll__8578, k)
  };
  var G__8598__3 = function(this_sym8575, k, not_found) {
    var this__8576 = this;
    var this_sym8575__8579 = this;
    var coll__8580 = this_sym8575__8579;
    return coll__8580.cljs$core$ILookup$_lookup$arity$3(coll__8580, k, not_found)
  };
  G__8598 = function(this_sym8575, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8598__2.call(this, this_sym8575, k);
      case 3:
        return G__8598__3.call(this, this_sym8575, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8598
}();
cljs.core.HashMap.prototype.apply = function(this_sym8554, args8555) {
  var this__8581 = this;
  return this_sym8554.call.apply(this_sym8554, [this_sym8554].concat(args8555.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8582 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8583 = this;
  var this__8584 = this;
  return cljs.core.pr_str.call(null, this__8584)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8585 = this;
  if(this__8585.count > 0) {
    var hashes__8586 = cljs.core.js_keys.call(null, this__8585.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8553_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8585.hashobj[p1__8553_SHARP_]))
    }, hashes__8586)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8587 = this;
  return this__8587.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8588 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8589 = this;
  return new cljs.core.HashMap(meta, this__8589.count, this__8589.hashobj, this__8589.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8590 = this;
  return this__8590.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8591 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8591.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8592 = this;
  var h__8593 = cljs.core.hash.call(null, k);
  var bucket__8594 = this__8592.hashobj[h__8593];
  var i__8595 = cljs.core.truth_(bucket__8594) ? cljs.core.scan_array.call(null, 2, k, bucket__8594) : null;
  if(cljs.core.not.call(null, i__8595)) {
    return coll
  }else {
    var new_hashobj__8596 = goog.object.clone(this__8592.hashobj);
    if(3 > bucket__8594.length) {
      cljs.core.js_delete.call(null, new_hashobj__8596, h__8593)
    }else {
      var new_bucket__8597 = bucket__8594.slice();
      new_bucket__8597.splice(i__8595, 2);
      new_hashobj__8596[h__8593] = new_bucket__8597
    }
    return new cljs.core.HashMap(this__8592.meta, this__8592.count - 1, new_hashobj__8596, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8599 = ks.length;
  var i__8600 = 0;
  var out__8601 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8600 < len__8599) {
      var G__8602 = i__8600 + 1;
      var G__8603 = cljs.core.assoc.call(null, out__8601, ks[i__8600], vs[i__8600]);
      i__8600 = G__8602;
      out__8601 = G__8603;
      continue
    }else {
      return out__8601
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8607 = m.arr;
  var len__8608 = arr__8607.length;
  var i__8609 = 0;
  while(true) {
    if(len__8608 <= i__8609) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8607[i__8609], k)) {
        return i__8609
      }else {
        if("\ufdd0'else") {
          var G__8610 = i__8609 + 2;
          i__8609 = G__8610;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8613 = this;
  return new cljs.core.TransientArrayMap({}, this__8613.arr.length, this__8613.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8614 = this;
  var h__2192__auto____8615 = this__8614.__hash;
  if(!(h__2192__auto____8615 == null)) {
    return h__2192__auto____8615
  }else {
    var h__2192__auto____8616 = cljs.core.hash_imap.call(null, coll);
    this__8614.__hash = h__2192__auto____8616;
    return h__2192__auto____8616
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8617 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8618 = this;
  var idx__8619 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8619 === -1) {
    return not_found
  }else {
    return this__8618.arr[idx__8619 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8620 = this;
  var idx__8621 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8621 === -1) {
    if(this__8620.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8620.meta, this__8620.cnt + 1, function() {
        var G__8622__8623 = this__8620.arr.slice();
        G__8622__8623.push(k);
        G__8622__8623.push(v);
        return G__8622__8623
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8620.arr[idx__8621 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8620.meta, this__8620.cnt, function() {
          var G__8624__8625 = this__8620.arr.slice();
          G__8624__8625[idx__8621 + 1] = v;
          return G__8624__8625
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8626 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8658 = null;
  var G__8658__2 = function(this_sym8627, k) {
    var this__8629 = this;
    var this_sym8627__8630 = this;
    var coll__8631 = this_sym8627__8630;
    return coll__8631.cljs$core$ILookup$_lookup$arity$2(coll__8631, k)
  };
  var G__8658__3 = function(this_sym8628, k, not_found) {
    var this__8629 = this;
    var this_sym8628__8632 = this;
    var coll__8633 = this_sym8628__8632;
    return coll__8633.cljs$core$ILookup$_lookup$arity$3(coll__8633, k, not_found)
  };
  G__8658 = function(this_sym8628, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8658__2.call(this, this_sym8628, k);
      case 3:
        return G__8658__3.call(this, this_sym8628, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8658
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8611, args8612) {
  var this__8634 = this;
  return this_sym8611.call.apply(this_sym8611, [this_sym8611].concat(args8612.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8635 = this;
  var len__8636 = this__8635.arr.length;
  var i__8637 = 0;
  var init__8638 = init;
  while(true) {
    if(i__8637 < len__8636) {
      var init__8639 = f.call(null, init__8638, this__8635.arr[i__8637], this__8635.arr[i__8637 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8639)) {
        return cljs.core.deref.call(null, init__8639)
      }else {
        var G__8659 = i__8637 + 2;
        var G__8660 = init__8639;
        i__8637 = G__8659;
        init__8638 = G__8660;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8640 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8641 = this;
  var this__8642 = this;
  return cljs.core.pr_str.call(null, this__8642)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8643 = this;
  if(this__8643.cnt > 0) {
    var len__8644 = this__8643.arr.length;
    var array_map_seq__8645 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8644) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8643.arr[i], this__8643.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8645.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8646 = this;
  return this__8646.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8647 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8648 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8648.cnt, this__8648.arr, this__8648.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8649 = this;
  return this__8649.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8650 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8650.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8651 = this;
  var idx__8652 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8652 >= 0) {
    var len__8653 = this__8651.arr.length;
    var new_len__8654 = len__8653 - 2;
    if(new_len__8654 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8655 = cljs.core.make_array.call(null, new_len__8654);
      var s__8656 = 0;
      var d__8657 = 0;
      while(true) {
        if(s__8656 >= len__8653) {
          return new cljs.core.PersistentArrayMap(this__8651.meta, this__8651.cnt - 1, new_arr__8655, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8651.arr[s__8656])) {
            var G__8661 = s__8656 + 2;
            var G__8662 = d__8657;
            s__8656 = G__8661;
            d__8657 = G__8662;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8655[d__8657] = this__8651.arr[s__8656];
              new_arr__8655[d__8657 + 1] = this__8651.arr[s__8656 + 1];
              var G__8663 = s__8656 + 2;
              var G__8664 = d__8657 + 2;
              s__8656 = G__8663;
              d__8657 = G__8664;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8665 = cljs.core.count.call(null, ks);
  var i__8666 = 0;
  var out__8667 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8666 < len__8665) {
      var G__8668 = i__8666 + 1;
      var G__8669 = cljs.core.assoc_BANG_.call(null, out__8667, ks[i__8666], vs[i__8666]);
      i__8666 = G__8668;
      out__8667 = G__8669;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8667)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8670 = this;
  if(cljs.core.truth_(this__8670.editable_QMARK_)) {
    var idx__8671 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8671 >= 0) {
      this__8670.arr[idx__8671] = this__8670.arr[this__8670.len - 2];
      this__8670.arr[idx__8671 + 1] = this__8670.arr[this__8670.len - 1];
      var G__8672__8673 = this__8670.arr;
      G__8672__8673.pop();
      G__8672__8673.pop();
      G__8672__8673;
      this__8670.len = this__8670.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8674 = this;
  if(cljs.core.truth_(this__8674.editable_QMARK_)) {
    var idx__8675 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8675 === -1) {
      if(this__8674.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8674.len = this__8674.len + 2;
        this__8674.arr.push(key);
        this__8674.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8674.len, this__8674.arr), key, val)
      }
    }else {
      if(val === this__8674.arr[idx__8675 + 1]) {
        return tcoll
      }else {
        this__8674.arr[idx__8675 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8676 = this;
  if(cljs.core.truth_(this__8676.editable_QMARK_)) {
    if(function() {
      var G__8677__8678 = o;
      if(G__8677__8678) {
        if(function() {
          var or__3824__auto____8679 = G__8677__8678.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8679) {
            return or__3824__auto____8679
          }else {
            return G__8677__8678.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8677__8678.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8677__8678)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8677__8678)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8680 = cljs.core.seq.call(null, o);
      var tcoll__8681 = tcoll;
      while(true) {
        var temp__3971__auto____8682 = cljs.core.first.call(null, es__8680);
        if(cljs.core.truth_(temp__3971__auto____8682)) {
          var e__8683 = temp__3971__auto____8682;
          var G__8689 = cljs.core.next.call(null, es__8680);
          var G__8690 = tcoll__8681.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8681, cljs.core.key.call(null, e__8683), cljs.core.val.call(null, e__8683));
          es__8680 = G__8689;
          tcoll__8681 = G__8690;
          continue
        }else {
          return tcoll__8681
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8684 = this;
  if(cljs.core.truth_(this__8684.editable_QMARK_)) {
    this__8684.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8684.len, 2), this__8684.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8685 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8686 = this;
  if(cljs.core.truth_(this__8686.editable_QMARK_)) {
    var idx__8687 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8687 === -1) {
      return not_found
    }else {
      return this__8686.arr[idx__8687 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8688 = this;
  if(cljs.core.truth_(this__8688.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8688.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8693 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8694 = 0;
  while(true) {
    if(i__8694 < len) {
      var G__8695 = cljs.core.assoc_BANG_.call(null, out__8693, arr[i__8694], arr[i__8694 + 1]);
      var G__8696 = i__8694 + 2;
      out__8693 = G__8695;
      i__8694 = G__8696;
      continue
    }else {
      return out__8693
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8701__8702 = arr.slice();
    G__8701__8702[i] = a;
    return G__8701__8702
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8703__8704 = arr.slice();
    G__8703__8704[i] = a;
    G__8703__8704[j] = b;
    return G__8703__8704
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8706 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8706, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8706, 2 * i, new_arr__8706.length - 2 * i);
  return new_arr__8706
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8709 = inode.ensure_editable(edit);
    editable__8709.arr[i] = a;
    return editable__8709
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8710 = inode.ensure_editable(edit);
    editable__8710.arr[i] = a;
    editable__8710.arr[j] = b;
    return editable__8710
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8717 = arr.length;
  var i__8718 = 0;
  var init__8719 = init;
  while(true) {
    if(i__8718 < len__8717) {
      var init__8722 = function() {
        var k__8720 = arr[i__8718];
        if(!(k__8720 == null)) {
          return f.call(null, init__8719, k__8720, arr[i__8718 + 1])
        }else {
          var node__8721 = arr[i__8718 + 1];
          if(!(node__8721 == null)) {
            return node__8721.kv_reduce(f, init__8719)
          }else {
            return init__8719
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8722)) {
        return cljs.core.deref.call(null, init__8722)
      }else {
        var G__8723 = i__8718 + 2;
        var G__8724 = init__8722;
        i__8718 = G__8723;
        init__8719 = G__8724;
        continue
      }
    }else {
      return init__8719
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8725 = this;
  var inode__8726 = this;
  if(this__8725.bitmap === bit) {
    return null
  }else {
    var editable__8727 = inode__8726.ensure_editable(e);
    var earr__8728 = editable__8727.arr;
    var len__8729 = earr__8728.length;
    editable__8727.bitmap = bit ^ editable__8727.bitmap;
    cljs.core.array_copy.call(null, earr__8728, 2 * (i + 1), earr__8728, 2 * i, len__8729 - 2 * (i + 1));
    earr__8728[len__8729 - 2] = null;
    earr__8728[len__8729 - 1] = null;
    return editable__8727
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8730 = this;
  var inode__8731 = this;
  var bit__8732 = 1 << (hash >>> shift & 31);
  var idx__8733 = cljs.core.bitmap_indexed_node_index.call(null, this__8730.bitmap, bit__8732);
  if((this__8730.bitmap & bit__8732) === 0) {
    var n__8734 = cljs.core.bit_count.call(null, this__8730.bitmap);
    if(2 * n__8734 < this__8730.arr.length) {
      var editable__8735 = inode__8731.ensure_editable(edit);
      var earr__8736 = editable__8735.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8736, 2 * idx__8733, earr__8736, 2 * (idx__8733 + 1), 2 * (n__8734 - idx__8733));
      earr__8736[2 * idx__8733] = key;
      earr__8736[2 * idx__8733 + 1] = val;
      editable__8735.bitmap = editable__8735.bitmap | bit__8732;
      return editable__8735
    }else {
      if(n__8734 >= 16) {
        var nodes__8737 = cljs.core.make_array.call(null, 32);
        var jdx__8738 = hash >>> shift & 31;
        nodes__8737[jdx__8738] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8739 = 0;
        var j__8740 = 0;
        while(true) {
          if(i__8739 < 32) {
            if((this__8730.bitmap >>> i__8739 & 1) === 0) {
              var G__8793 = i__8739 + 1;
              var G__8794 = j__8740;
              i__8739 = G__8793;
              j__8740 = G__8794;
              continue
            }else {
              nodes__8737[i__8739] = !(this__8730.arr[j__8740] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8730.arr[j__8740]), this__8730.arr[j__8740], this__8730.arr[j__8740 + 1], added_leaf_QMARK_) : this__8730.arr[j__8740 + 1];
              var G__8795 = i__8739 + 1;
              var G__8796 = j__8740 + 2;
              i__8739 = G__8795;
              j__8740 = G__8796;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8734 + 1, nodes__8737)
      }else {
        if("\ufdd0'else") {
          var new_arr__8741 = cljs.core.make_array.call(null, 2 * (n__8734 + 4));
          cljs.core.array_copy.call(null, this__8730.arr, 0, new_arr__8741, 0, 2 * idx__8733);
          new_arr__8741[2 * idx__8733] = key;
          new_arr__8741[2 * idx__8733 + 1] = val;
          cljs.core.array_copy.call(null, this__8730.arr, 2 * idx__8733, new_arr__8741, 2 * (idx__8733 + 1), 2 * (n__8734 - idx__8733));
          added_leaf_QMARK_.val = true;
          var editable__8742 = inode__8731.ensure_editable(edit);
          editable__8742.arr = new_arr__8741;
          editable__8742.bitmap = editable__8742.bitmap | bit__8732;
          return editable__8742
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8743 = this__8730.arr[2 * idx__8733];
    var val_or_node__8744 = this__8730.arr[2 * idx__8733 + 1];
    if(key_or_nil__8743 == null) {
      var n__8745 = val_or_node__8744.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8745 === val_or_node__8744) {
        return inode__8731
      }else {
        return cljs.core.edit_and_set.call(null, inode__8731, edit, 2 * idx__8733 + 1, n__8745)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8743)) {
        if(val === val_or_node__8744) {
          return inode__8731
        }else {
          return cljs.core.edit_and_set.call(null, inode__8731, edit, 2 * idx__8733 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8731, edit, 2 * idx__8733, null, 2 * idx__8733 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8743, val_or_node__8744, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8746 = this;
  var inode__8747 = this;
  return cljs.core.create_inode_seq.call(null, this__8746.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8748 = this;
  var inode__8749 = this;
  var bit__8750 = 1 << (hash >>> shift & 31);
  if((this__8748.bitmap & bit__8750) === 0) {
    return inode__8749
  }else {
    var idx__8751 = cljs.core.bitmap_indexed_node_index.call(null, this__8748.bitmap, bit__8750);
    var key_or_nil__8752 = this__8748.arr[2 * idx__8751];
    var val_or_node__8753 = this__8748.arr[2 * idx__8751 + 1];
    if(key_or_nil__8752 == null) {
      var n__8754 = val_or_node__8753.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8754 === val_or_node__8753) {
        return inode__8749
      }else {
        if(!(n__8754 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8749, edit, 2 * idx__8751 + 1, n__8754)
        }else {
          if(this__8748.bitmap === bit__8750) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8749.edit_and_remove_pair(edit, bit__8750, idx__8751)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8752)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8749.edit_and_remove_pair(edit, bit__8750, idx__8751)
      }else {
        if("\ufdd0'else") {
          return inode__8749
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8755 = this;
  var inode__8756 = this;
  if(e === this__8755.edit) {
    return inode__8756
  }else {
    var n__8757 = cljs.core.bit_count.call(null, this__8755.bitmap);
    var new_arr__8758 = cljs.core.make_array.call(null, n__8757 < 0 ? 4 : 2 * (n__8757 + 1));
    cljs.core.array_copy.call(null, this__8755.arr, 0, new_arr__8758, 0, 2 * n__8757);
    return new cljs.core.BitmapIndexedNode(e, this__8755.bitmap, new_arr__8758)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8759 = this;
  var inode__8760 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8759.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8761 = this;
  var inode__8762 = this;
  var bit__8763 = 1 << (hash >>> shift & 31);
  if((this__8761.bitmap & bit__8763) === 0) {
    return not_found
  }else {
    var idx__8764 = cljs.core.bitmap_indexed_node_index.call(null, this__8761.bitmap, bit__8763);
    var key_or_nil__8765 = this__8761.arr[2 * idx__8764];
    var val_or_node__8766 = this__8761.arr[2 * idx__8764 + 1];
    if(key_or_nil__8765 == null) {
      return val_or_node__8766.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8765)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8765, val_or_node__8766], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8767 = this;
  var inode__8768 = this;
  var bit__8769 = 1 << (hash >>> shift & 31);
  if((this__8767.bitmap & bit__8769) === 0) {
    return inode__8768
  }else {
    var idx__8770 = cljs.core.bitmap_indexed_node_index.call(null, this__8767.bitmap, bit__8769);
    var key_or_nil__8771 = this__8767.arr[2 * idx__8770];
    var val_or_node__8772 = this__8767.arr[2 * idx__8770 + 1];
    if(key_or_nil__8771 == null) {
      var n__8773 = val_or_node__8772.inode_without(shift + 5, hash, key);
      if(n__8773 === val_or_node__8772) {
        return inode__8768
      }else {
        if(!(n__8773 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8767.bitmap, cljs.core.clone_and_set.call(null, this__8767.arr, 2 * idx__8770 + 1, n__8773))
        }else {
          if(this__8767.bitmap === bit__8769) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8767.bitmap ^ bit__8769, cljs.core.remove_pair.call(null, this__8767.arr, idx__8770))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8771)) {
        return new cljs.core.BitmapIndexedNode(null, this__8767.bitmap ^ bit__8769, cljs.core.remove_pair.call(null, this__8767.arr, idx__8770))
      }else {
        if("\ufdd0'else") {
          return inode__8768
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8774 = this;
  var inode__8775 = this;
  var bit__8776 = 1 << (hash >>> shift & 31);
  var idx__8777 = cljs.core.bitmap_indexed_node_index.call(null, this__8774.bitmap, bit__8776);
  if((this__8774.bitmap & bit__8776) === 0) {
    var n__8778 = cljs.core.bit_count.call(null, this__8774.bitmap);
    if(n__8778 >= 16) {
      var nodes__8779 = cljs.core.make_array.call(null, 32);
      var jdx__8780 = hash >>> shift & 31;
      nodes__8779[jdx__8780] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8781 = 0;
      var j__8782 = 0;
      while(true) {
        if(i__8781 < 32) {
          if((this__8774.bitmap >>> i__8781 & 1) === 0) {
            var G__8797 = i__8781 + 1;
            var G__8798 = j__8782;
            i__8781 = G__8797;
            j__8782 = G__8798;
            continue
          }else {
            nodes__8779[i__8781] = !(this__8774.arr[j__8782] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8774.arr[j__8782]), this__8774.arr[j__8782], this__8774.arr[j__8782 + 1], added_leaf_QMARK_) : this__8774.arr[j__8782 + 1];
            var G__8799 = i__8781 + 1;
            var G__8800 = j__8782 + 2;
            i__8781 = G__8799;
            j__8782 = G__8800;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8778 + 1, nodes__8779)
    }else {
      var new_arr__8783 = cljs.core.make_array.call(null, 2 * (n__8778 + 1));
      cljs.core.array_copy.call(null, this__8774.arr, 0, new_arr__8783, 0, 2 * idx__8777);
      new_arr__8783[2 * idx__8777] = key;
      new_arr__8783[2 * idx__8777 + 1] = val;
      cljs.core.array_copy.call(null, this__8774.arr, 2 * idx__8777, new_arr__8783, 2 * (idx__8777 + 1), 2 * (n__8778 - idx__8777));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8774.bitmap | bit__8776, new_arr__8783)
    }
  }else {
    var key_or_nil__8784 = this__8774.arr[2 * idx__8777];
    var val_or_node__8785 = this__8774.arr[2 * idx__8777 + 1];
    if(key_or_nil__8784 == null) {
      var n__8786 = val_or_node__8785.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8786 === val_or_node__8785) {
        return inode__8775
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8774.bitmap, cljs.core.clone_and_set.call(null, this__8774.arr, 2 * idx__8777 + 1, n__8786))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8784)) {
        if(val === val_or_node__8785) {
          return inode__8775
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8774.bitmap, cljs.core.clone_and_set.call(null, this__8774.arr, 2 * idx__8777 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8774.bitmap, cljs.core.clone_and_set.call(null, this__8774.arr, 2 * idx__8777, null, 2 * idx__8777 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8784, val_or_node__8785, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8787 = this;
  var inode__8788 = this;
  var bit__8789 = 1 << (hash >>> shift & 31);
  if((this__8787.bitmap & bit__8789) === 0) {
    return not_found
  }else {
    var idx__8790 = cljs.core.bitmap_indexed_node_index.call(null, this__8787.bitmap, bit__8789);
    var key_or_nil__8791 = this__8787.arr[2 * idx__8790];
    var val_or_node__8792 = this__8787.arr[2 * idx__8790 + 1];
    if(key_or_nil__8791 == null) {
      return val_or_node__8792.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8791)) {
        return val_or_node__8792
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8808 = array_node.arr;
  var len__8809 = 2 * (array_node.cnt - 1);
  var new_arr__8810 = cljs.core.make_array.call(null, len__8809);
  var i__8811 = 0;
  var j__8812 = 1;
  var bitmap__8813 = 0;
  while(true) {
    if(i__8811 < len__8809) {
      if(function() {
        var and__3822__auto____8814 = !(i__8811 === idx);
        if(and__3822__auto____8814) {
          return!(arr__8808[i__8811] == null)
        }else {
          return and__3822__auto____8814
        }
      }()) {
        new_arr__8810[j__8812] = arr__8808[i__8811];
        var G__8815 = i__8811 + 1;
        var G__8816 = j__8812 + 2;
        var G__8817 = bitmap__8813 | 1 << i__8811;
        i__8811 = G__8815;
        j__8812 = G__8816;
        bitmap__8813 = G__8817;
        continue
      }else {
        var G__8818 = i__8811 + 1;
        var G__8819 = j__8812;
        var G__8820 = bitmap__8813;
        i__8811 = G__8818;
        j__8812 = G__8819;
        bitmap__8813 = G__8820;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8813, new_arr__8810)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8821 = this;
  var inode__8822 = this;
  var idx__8823 = hash >>> shift & 31;
  var node__8824 = this__8821.arr[idx__8823];
  if(node__8824 == null) {
    var editable__8825 = cljs.core.edit_and_set.call(null, inode__8822, edit, idx__8823, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8825.cnt = editable__8825.cnt + 1;
    return editable__8825
  }else {
    var n__8826 = node__8824.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8826 === node__8824) {
      return inode__8822
    }else {
      return cljs.core.edit_and_set.call(null, inode__8822, edit, idx__8823, n__8826)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8827 = this;
  var inode__8828 = this;
  return cljs.core.create_array_node_seq.call(null, this__8827.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8829 = this;
  var inode__8830 = this;
  var idx__8831 = hash >>> shift & 31;
  var node__8832 = this__8829.arr[idx__8831];
  if(node__8832 == null) {
    return inode__8830
  }else {
    var n__8833 = node__8832.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8833 === node__8832) {
      return inode__8830
    }else {
      if(n__8833 == null) {
        if(this__8829.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8830, edit, idx__8831)
        }else {
          var editable__8834 = cljs.core.edit_and_set.call(null, inode__8830, edit, idx__8831, n__8833);
          editable__8834.cnt = editable__8834.cnt - 1;
          return editable__8834
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8830, edit, idx__8831, n__8833)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8835 = this;
  var inode__8836 = this;
  if(e === this__8835.edit) {
    return inode__8836
  }else {
    return new cljs.core.ArrayNode(e, this__8835.cnt, this__8835.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8837 = this;
  var inode__8838 = this;
  var len__8839 = this__8837.arr.length;
  var i__8840 = 0;
  var init__8841 = init;
  while(true) {
    if(i__8840 < len__8839) {
      var node__8842 = this__8837.arr[i__8840];
      if(!(node__8842 == null)) {
        var init__8843 = node__8842.kv_reduce(f, init__8841);
        if(cljs.core.reduced_QMARK_.call(null, init__8843)) {
          return cljs.core.deref.call(null, init__8843)
        }else {
          var G__8862 = i__8840 + 1;
          var G__8863 = init__8843;
          i__8840 = G__8862;
          init__8841 = G__8863;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8841
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8844 = this;
  var inode__8845 = this;
  var idx__8846 = hash >>> shift & 31;
  var node__8847 = this__8844.arr[idx__8846];
  if(!(node__8847 == null)) {
    return node__8847.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8848 = this;
  var inode__8849 = this;
  var idx__8850 = hash >>> shift & 31;
  var node__8851 = this__8848.arr[idx__8850];
  if(!(node__8851 == null)) {
    var n__8852 = node__8851.inode_without(shift + 5, hash, key);
    if(n__8852 === node__8851) {
      return inode__8849
    }else {
      if(n__8852 == null) {
        if(this__8848.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8849, null, idx__8850)
        }else {
          return new cljs.core.ArrayNode(null, this__8848.cnt - 1, cljs.core.clone_and_set.call(null, this__8848.arr, idx__8850, n__8852))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8848.cnt, cljs.core.clone_and_set.call(null, this__8848.arr, idx__8850, n__8852))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8849
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8853 = this;
  var inode__8854 = this;
  var idx__8855 = hash >>> shift & 31;
  var node__8856 = this__8853.arr[idx__8855];
  if(node__8856 == null) {
    return new cljs.core.ArrayNode(null, this__8853.cnt + 1, cljs.core.clone_and_set.call(null, this__8853.arr, idx__8855, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8857 = node__8856.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8857 === node__8856) {
      return inode__8854
    }else {
      return new cljs.core.ArrayNode(null, this__8853.cnt, cljs.core.clone_and_set.call(null, this__8853.arr, idx__8855, n__8857))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8858 = this;
  var inode__8859 = this;
  var idx__8860 = hash >>> shift & 31;
  var node__8861 = this__8858.arr[idx__8860];
  if(!(node__8861 == null)) {
    return node__8861.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8866 = 2 * cnt;
  var i__8867 = 0;
  while(true) {
    if(i__8867 < lim__8866) {
      if(cljs.core.key_test.call(null, key, arr[i__8867])) {
        return i__8867
      }else {
        var G__8868 = i__8867 + 2;
        i__8867 = G__8868;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8869 = this;
  var inode__8870 = this;
  if(hash === this__8869.collision_hash) {
    var idx__8871 = cljs.core.hash_collision_node_find_index.call(null, this__8869.arr, this__8869.cnt, key);
    if(idx__8871 === -1) {
      if(this__8869.arr.length > 2 * this__8869.cnt) {
        var editable__8872 = cljs.core.edit_and_set.call(null, inode__8870, edit, 2 * this__8869.cnt, key, 2 * this__8869.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8872.cnt = editable__8872.cnt + 1;
        return editable__8872
      }else {
        var len__8873 = this__8869.arr.length;
        var new_arr__8874 = cljs.core.make_array.call(null, len__8873 + 2);
        cljs.core.array_copy.call(null, this__8869.arr, 0, new_arr__8874, 0, len__8873);
        new_arr__8874[len__8873] = key;
        new_arr__8874[len__8873 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8870.ensure_editable_array(edit, this__8869.cnt + 1, new_arr__8874)
      }
    }else {
      if(this__8869.arr[idx__8871 + 1] === val) {
        return inode__8870
      }else {
        return cljs.core.edit_and_set.call(null, inode__8870, edit, idx__8871 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8869.collision_hash >>> shift & 31), [null, inode__8870, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8875 = this;
  var inode__8876 = this;
  return cljs.core.create_inode_seq.call(null, this__8875.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8877 = this;
  var inode__8878 = this;
  var idx__8879 = cljs.core.hash_collision_node_find_index.call(null, this__8877.arr, this__8877.cnt, key);
  if(idx__8879 === -1) {
    return inode__8878
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8877.cnt === 1) {
      return null
    }else {
      var editable__8880 = inode__8878.ensure_editable(edit);
      var earr__8881 = editable__8880.arr;
      earr__8881[idx__8879] = earr__8881[2 * this__8877.cnt - 2];
      earr__8881[idx__8879 + 1] = earr__8881[2 * this__8877.cnt - 1];
      earr__8881[2 * this__8877.cnt - 1] = null;
      earr__8881[2 * this__8877.cnt - 2] = null;
      editable__8880.cnt = editable__8880.cnt - 1;
      return editable__8880
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8882 = this;
  var inode__8883 = this;
  if(e === this__8882.edit) {
    return inode__8883
  }else {
    var new_arr__8884 = cljs.core.make_array.call(null, 2 * (this__8882.cnt + 1));
    cljs.core.array_copy.call(null, this__8882.arr, 0, new_arr__8884, 0, 2 * this__8882.cnt);
    return new cljs.core.HashCollisionNode(e, this__8882.collision_hash, this__8882.cnt, new_arr__8884)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8885 = this;
  var inode__8886 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8885.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8887 = this;
  var inode__8888 = this;
  var idx__8889 = cljs.core.hash_collision_node_find_index.call(null, this__8887.arr, this__8887.cnt, key);
  if(idx__8889 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8887.arr[idx__8889])) {
      return cljs.core.PersistentVector.fromArray([this__8887.arr[idx__8889], this__8887.arr[idx__8889 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8890 = this;
  var inode__8891 = this;
  var idx__8892 = cljs.core.hash_collision_node_find_index.call(null, this__8890.arr, this__8890.cnt, key);
  if(idx__8892 === -1) {
    return inode__8891
  }else {
    if(this__8890.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8890.collision_hash, this__8890.cnt - 1, cljs.core.remove_pair.call(null, this__8890.arr, cljs.core.quot.call(null, idx__8892, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8893 = this;
  var inode__8894 = this;
  if(hash === this__8893.collision_hash) {
    var idx__8895 = cljs.core.hash_collision_node_find_index.call(null, this__8893.arr, this__8893.cnt, key);
    if(idx__8895 === -1) {
      var len__8896 = this__8893.arr.length;
      var new_arr__8897 = cljs.core.make_array.call(null, len__8896 + 2);
      cljs.core.array_copy.call(null, this__8893.arr, 0, new_arr__8897, 0, len__8896);
      new_arr__8897[len__8896] = key;
      new_arr__8897[len__8896 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8893.collision_hash, this__8893.cnt + 1, new_arr__8897)
    }else {
      if(cljs.core._EQ_.call(null, this__8893.arr[idx__8895], val)) {
        return inode__8894
      }else {
        return new cljs.core.HashCollisionNode(null, this__8893.collision_hash, this__8893.cnt, cljs.core.clone_and_set.call(null, this__8893.arr, idx__8895 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8893.collision_hash >>> shift & 31), [null, inode__8894])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8898 = this;
  var inode__8899 = this;
  var idx__8900 = cljs.core.hash_collision_node_find_index.call(null, this__8898.arr, this__8898.cnt, key);
  if(idx__8900 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8898.arr[idx__8900])) {
      return this__8898.arr[idx__8900 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8901 = this;
  var inode__8902 = this;
  if(e === this__8901.edit) {
    this__8901.arr = array;
    this__8901.cnt = count;
    return inode__8902
  }else {
    return new cljs.core.HashCollisionNode(this__8901.edit, this__8901.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8907 = cljs.core.hash.call(null, key1);
    if(key1hash__8907 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8907, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8908 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8907, key1, val1, added_leaf_QMARK___8908).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8908)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8909 = cljs.core.hash.call(null, key1);
    if(key1hash__8909 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8909, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8910 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8909, key1, val1, added_leaf_QMARK___8910).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8910)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8911 = this;
  var h__2192__auto____8912 = this__8911.__hash;
  if(!(h__2192__auto____8912 == null)) {
    return h__2192__auto____8912
  }else {
    var h__2192__auto____8913 = cljs.core.hash_coll.call(null, coll);
    this__8911.__hash = h__2192__auto____8913;
    return h__2192__auto____8913
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8914 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8915 = this;
  var this__8916 = this;
  return cljs.core.pr_str.call(null, this__8916)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8917 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8918 = this;
  if(this__8918.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8918.nodes[this__8918.i], this__8918.nodes[this__8918.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8918.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8919 = this;
  if(this__8919.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8919.nodes, this__8919.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8919.nodes, this__8919.i, cljs.core.next.call(null, this__8919.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8920 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8921 = this;
  return new cljs.core.NodeSeq(meta, this__8921.nodes, this__8921.i, this__8921.s, this__8921.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8922 = this;
  return this__8922.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8923 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8923.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8930 = nodes.length;
      var j__8931 = i;
      while(true) {
        if(j__8931 < len__8930) {
          if(!(nodes[j__8931] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8931, null, null)
          }else {
            var temp__3971__auto____8932 = nodes[j__8931 + 1];
            if(cljs.core.truth_(temp__3971__auto____8932)) {
              var node__8933 = temp__3971__auto____8932;
              var temp__3971__auto____8934 = node__8933.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8934)) {
                var node_seq__8935 = temp__3971__auto____8934;
                return new cljs.core.NodeSeq(null, nodes, j__8931 + 2, node_seq__8935, null)
              }else {
                var G__8936 = j__8931 + 2;
                j__8931 = G__8936;
                continue
              }
            }else {
              var G__8937 = j__8931 + 2;
              j__8931 = G__8937;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8938 = this;
  var h__2192__auto____8939 = this__8938.__hash;
  if(!(h__2192__auto____8939 == null)) {
    return h__2192__auto____8939
  }else {
    var h__2192__auto____8940 = cljs.core.hash_coll.call(null, coll);
    this__8938.__hash = h__2192__auto____8940;
    return h__2192__auto____8940
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8941 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8942 = this;
  var this__8943 = this;
  return cljs.core.pr_str.call(null, this__8943)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8944 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8945 = this;
  return cljs.core.first.call(null, this__8945.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8946 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8946.nodes, this__8946.i, cljs.core.next.call(null, this__8946.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8947 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8948 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8948.nodes, this__8948.i, this__8948.s, this__8948.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8949 = this;
  return this__8949.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8950 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8950.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8957 = nodes.length;
      var j__8958 = i;
      while(true) {
        if(j__8958 < len__8957) {
          var temp__3971__auto____8959 = nodes[j__8958];
          if(cljs.core.truth_(temp__3971__auto____8959)) {
            var nj__8960 = temp__3971__auto____8959;
            var temp__3971__auto____8961 = nj__8960.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8961)) {
              var ns__8962 = temp__3971__auto____8961;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8958 + 1, ns__8962, null)
            }else {
              var G__8963 = j__8958 + 1;
              j__8958 = G__8963;
              continue
            }
          }else {
            var G__8964 = j__8958 + 1;
            j__8958 = G__8964;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8967 = this;
  return new cljs.core.TransientHashMap({}, this__8967.root, this__8967.cnt, this__8967.has_nil_QMARK_, this__8967.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8968 = this;
  var h__2192__auto____8969 = this__8968.__hash;
  if(!(h__2192__auto____8969 == null)) {
    return h__2192__auto____8969
  }else {
    var h__2192__auto____8970 = cljs.core.hash_imap.call(null, coll);
    this__8968.__hash = h__2192__auto____8970;
    return h__2192__auto____8970
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8971 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8972 = this;
  if(k == null) {
    if(this__8972.has_nil_QMARK_) {
      return this__8972.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8972.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8972.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8973 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____8974 = this__8973.has_nil_QMARK_;
      if(and__3822__auto____8974) {
        return v === this__8973.nil_val
      }else {
        return and__3822__auto____8974
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8973.meta, this__8973.has_nil_QMARK_ ? this__8973.cnt : this__8973.cnt + 1, this__8973.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8975 = new cljs.core.Box(false);
    var new_root__8976 = (this__8973.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8973.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8975);
    if(new_root__8976 === this__8973.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8973.meta, added_leaf_QMARK___8975.val ? this__8973.cnt + 1 : this__8973.cnt, new_root__8976, this__8973.has_nil_QMARK_, this__8973.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8977 = this;
  if(k == null) {
    return this__8977.has_nil_QMARK_
  }else {
    if(this__8977.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8977.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9000 = null;
  var G__9000__2 = function(this_sym8978, k) {
    var this__8980 = this;
    var this_sym8978__8981 = this;
    var coll__8982 = this_sym8978__8981;
    return coll__8982.cljs$core$ILookup$_lookup$arity$2(coll__8982, k)
  };
  var G__9000__3 = function(this_sym8979, k, not_found) {
    var this__8980 = this;
    var this_sym8979__8983 = this;
    var coll__8984 = this_sym8979__8983;
    return coll__8984.cljs$core$ILookup$_lookup$arity$3(coll__8984, k, not_found)
  };
  G__9000 = function(this_sym8979, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9000__2.call(this, this_sym8979, k);
      case 3:
        return G__9000__3.call(this, this_sym8979, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9000
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8965, args8966) {
  var this__8985 = this;
  return this_sym8965.call.apply(this_sym8965, [this_sym8965].concat(args8966.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8986 = this;
  var init__8987 = this__8986.has_nil_QMARK_ ? f.call(null, init, null, this__8986.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8987)) {
    return cljs.core.deref.call(null, init__8987)
  }else {
    if(!(this__8986.root == null)) {
      return this__8986.root.kv_reduce(f, init__8987)
    }else {
      if("\ufdd0'else") {
        return init__8987
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8988 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8989 = this;
  var this__8990 = this;
  return cljs.core.pr_str.call(null, this__8990)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8991 = this;
  if(this__8991.cnt > 0) {
    var s__8992 = !(this__8991.root == null) ? this__8991.root.inode_seq() : null;
    if(this__8991.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8991.nil_val], true), s__8992)
    }else {
      return s__8992
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8993 = this;
  return this__8993.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8994 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8995 = this;
  return new cljs.core.PersistentHashMap(meta, this__8995.cnt, this__8995.root, this__8995.has_nil_QMARK_, this__8995.nil_val, this__8995.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8996 = this;
  return this__8996.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8997 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8997.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8998 = this;
  if(k == null) {
    if(this__8998.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8998.meta, this__8998.cnt - 1, this__8998.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8998.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8999 = this__8998.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8999 === this__8998.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8998.meta, this__8998.cnt - 1, new_root__8999, this__8998.has_nil_QMARK_, this__8998.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9001 = ks.length;
  var i__9002 = 0;
  var out__9003 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9002 < len__9001) {
      var G__9004 = i__9002 + 1;
      var G__9005 = cljs.core.assoc_BANG_.call(null, out__9003, ks[i__9002], vs[i__9002]);
      i__9002 = G__9004;
      out__9003 = G__9005;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9003)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9006 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9007 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9008 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9009 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9010 = this;
  if(k == null) {
    if(this__9010.has_nil_QMARK_) {
      return this__9010.nil_val
    }else {
      return null
    }
  }else {
    if(this__9010.root == null) {
      return null
    }else {
      return this__9010.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9011 = this;
  if(k == null) {
    if(this__9011.has_nil_QMARK_) {
      return this__9011.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9011.root == null) {
      return not_found
    }else {
      return this__9011.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9012 = this;
  if(this__9012.edit) {
    return this__9012.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9013 = this;
  var tcoll__9014 = this;
  if(this__9013.edit) {
    if(function() {
      var G__9015__9016 = o;
      if(G__9015__9016) {
        if(function() {
          var or__3824__auto____9017 = G__9015__9016.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9017) {
            return or__3824__auto____9017
          }else {
            return G__9015__9016.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9015__9016.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9015__9016)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9015__9016)
      }
    }()) {
      return tcoll__9014.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9018 = cljs.core.seq.call(null, o);
      var tcoll__9019 = tcoll__9014;
      while(true) {
        var temp__3971__auto____9020 = cljs.core.first.call(null, es__9018);
        if(cljs.core.truth_(temp__3971__auto____9020)) {
          var e__9021 = temp__3971__auto____9020;
          var G__9032 = cljs.core.next.call(null, es__9018);
          var G__9033 = tcoll__9019.assoc_BANG_(cljs.core.key.call(null, e__9021), cljs.core.val.call(null, e__9021));
          es__9018 = G__9032;
          tcoll__9019 = G__9033;
          continue
        }else {
          return tcoll__9019
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9022 = this;
  var tcoll__9023 = this;
  if(this__9022.edit) {
    if(k == null) {
      if(this__9022.nil_val === v) {
      }else {
        this__9022.nil_val = v
      }
      if(this__9022.has_nil_QMARK_) {
      }else {
        this__9022.count = this__9022.count + 1;
        this__9022.has_nil_QMARK_ = true
      }
      return tcoll__9023
    }else {
      var added_leaf_QMARK___9024 = new cljs.core.Box(false);
      var node__9025 = (this__9022.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9022.root).inode_assoc_BANG_(this__9022.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9024);
      if(node__9025 === this__9022.root) {
      }else {
        this__9022.root = node__9025
      }
      if(added_leaf_QMARK___9024.val) {
        this__9022.count = this__9022.count + 1
      }else {
      }
      return tcoll__9023
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9026 = this;
  var tcoll__9027 = this;
  if(this__9026.edit) {
    if(k == null) {
      if(this__9026.has_nil_QMARK_) {
        this__9026.has_nil_QMARK_ = false;
        this__9026.nil_val = null;
        this__9026.count = this__9026.count - 1;
        return tcoll__9027
      }else {
        return tcoll__9027
      }
    }else {
      if(this__9026.root == null) {
        return tcoll__9027
      }else {
        var removed_leaf_QMARK___9028 = new cljs.core.Box(false);
        var node__9029 = this__9026.root.inode_without_BANG_(this__9026.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9028);
        if(node__9029 === this__9026.root) {
        }else {
          this__9026.root = node__9029
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9028[0])) {
          this__9026.count = this__9026.count - 1
        }else {
        }
        return tcoll__9027
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9030 = this;
  var tcoll__9031 = this;
  if(this__9030.edit) {
    this__9030.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9030.count, this__9030.root, this__9030.has_nil_QMARK_, this__9030.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9036 = node;
  var stack__9037 = stack;
  while(true) {
    if(!(t__9036 == null)) {
      var G__9038 = ascending_QMARK_ ? t__9036.left : t__9036.right;
      var G__9039 = cljs.core.conj.call(null, stack__9037, t__9036);
      t__9036 = G__9038;
      stack__9037 = G__9039;
      continue
    }else {
      return stack__9037
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9040 = this;
  var h__2192__auto____9041 = this__9040.__hash;
  if(!(h__2192__auto____9041 == null)) {
    return h__2192__auto____9041
  }else {
    var h__2192__auto____9042 = cljs.core.hash_coll.call(null, coll);
    this__9040.__hash = h__2192__auto____9042;
    return h__2192__auto____9042
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9043 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9044 = this;
  var this__9045 = this;
  return cljs.core.pr_str.call(null, this__9045)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9046 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9047 = this;
  if(this__9047.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9047.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9048 = this;
  return cljs.core.peek.call(null, this__9048.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9049 = this;
  var t__9050 = cljs.core.first.call(null, this__9049.stack);
  var next_stack__9051 = cljs.core.tree_map_seq_push.call(null, this__9049.ascending_QMARK_ ? t__9050.right : t__9050.left, cljs.core.next.call(null, this__9049.stack), this__9049.ascending_QMARK_);
  if(!(next_stack__9051 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9051, this__9049.ascending_QMARK_, this__9049.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9052 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9053 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9053.stack, this__9053.ascending_QMARK_, this__9053.cnt, this__9053.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9054 = this;
  return this__9054.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9056 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9056) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9056
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9058 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9058) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9058
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9062 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9062)) {
    return cljs.core.deref.call(null, init__9062)
  }else {
    var init__9063 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9062) : init__9062;
    if(cljs.core.reduced_QMARK_.call(null, init__9063)) {
      return cljs.core.deref.call(null, init__9063)
    }else {
      var init__9064 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9063) : init__9063;
      if(cljs.core.reduced_QMARK_.call(null, init__9064)) {
        return cljs.core.deref.call(null, init__9064)
      }else {
        return init__9064
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9067 = this;
  var h__2192__auto____9068 = this__9067.__hash;
  if(!(h__2192__auto____9068 == null)) {
    return h__2192__auto____9068
  }else {
    var h__2192__auto____9069 = cljs.core.hash_coll.call(null, coll);
    this__9067.__hash = h__2192__auto____9069;
    return h__2192__auto____9069
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9070 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9071 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9072 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9072.key, this__9072.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9120 = null;
  var G__9120__2 = function(this_sym9073, k) {
    var this__9075 = this;
    var this_sym9073__9076 = this;
    var node__9077 = this_sym9073__9076;
    return node__9077.cljs$core$ILookup$_lookup$arity$2(node__9077, k)
  };
  var G__9120__3 = function(this_sym9074, k, not_found) {
    var this__9075 = this;
    var this_sym9074__9078 = this;
    var node__9079 = this_sym9074__9078;
    return node__9079.cljs$core$ILookup$_lookup$arity$3(node__9079, k, not_found)
  };
  G__9120 = function(this_sym9074, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9120__2.call(this, this_sym9074, k);
      case 3:
        return G__9120__3.call(this, this_sym9074, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9120
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9065, args9066) {
  var this__9080 = this;
  return this_sym9065.call.apply(this_sym9065, [this_sym9065].concat(args9066.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9081 = this;
  return cljs.core.PersistentVector.fromArray([this__9081.key, this__9081.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9082 = this;
  return this__9082.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9083 = this;
  return this__9083.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9084 = this;
  var node__9085 = this;
  return ins.balance_right(node__9085)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9086 = this;
  var node__9087 = this;
  return new cljs.core.RedNode(this__9086.key, this__9086.val, this__9086.left, this__9086.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9088 = this;
  var node__9089 = this;
  return cljs.core.balance_right_del.call(null, this__9088.key, this__9088.val, this__9088.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9090 = this;
  var node__9091 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9092 = this;
  var node__9093 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9093, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9094 = this;
  var node__9095 = this;
  return cljs.core.balance_left_del.call(null, this__9094.key, this__9094.val, del, this__9094.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9096 = this;
  var node__9097 = this;
  return ins.balance_left(node__9097)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9098 = this;
  var node__9099 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9099, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9121 = null;
  var G__9121__0 = function() {
    var this__9100 = this;
    var this__9102 = this;
    return cljs.core.pr_str.call(null, this__9102)
  };
  G__9121 = function() {
    switch(arguments.length) {
      case 0:
        return G__9121__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9121
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9103 = this;
  var node__9104 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9104, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9105 = this;
  var node__9106 = this;
  return node__9106
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9107 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9108 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9109 = this;
  return cljs.core.list.call(null, this__9109.key, this__9109.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9110 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9111 = this;
  return this__9111.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9112 = this;
  return cljs.core.PersistentVector.fromArray([this__9112.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9113 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9113.key, this__9113.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9114 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9115 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9115.key, this__9115.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9116 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9117 = this;
  if(n === 0) {
    return this__9117.key
  }else {
    if(n === 1) {
      return this__9117.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9118 = this;
  if(n === 0) {
    return this__9118.key
  }else {
    if(n === 1) {
      return this__9118.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9119 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9124 = this;
  var h__2192__auto____9125 = this__9124.__hash;
  if(!(h__2192__auto____9125 == null)) {
    return h__2192__auto____9125
  }else {
    var h__2192__auto____9126 = cljs.core.hash_coll.call(null, coll);
    this__9124.__hash = h__2192__auto____9126;
    return h__2192__auto____9126
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9127 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9128 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9129 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9129.key, this__9129.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9177 = null;
  var G__9177__2 = function(this_sym9130, k) {
    var this__9132 = this;
    var this_sym9130__9133 = this;
    var node__9134 = this_sym9130__9133;
    return node__9134.cljs$core$ILookup$_lookup$arity$2(node__9134, k)
  };
  var G__9177__3 = function(this_sym9131, k, not_found) {
    var this__9132 = this;
    var this_sym9131__9135 = this;
    var node__9136 = this_sym9131__9135;
    return node__9136.cljs$core$ILookup$_lookup$arity$3(node__9136, k, not_found)
  };
  G__9177 = function(this_sym9131, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9177__2.call(this, this_sym9131, k);
      case 3:
        return G__9177__3.call(this, this_sym9131, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9177
}();
cljs.core.RedNode.prototype.apply = function(this_sym9122, args9123) {
  var this__9137 = this;
  return this_sym9122.call.apply(this_sym9122, [this_sym9122].concat(args9123.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9138 = this;
  return cljs.core.PersistentVector.fromArray([this__9138.key, this__9138.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9139 = this;
  return this__9139.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9140 = this;
  return this__9140.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9141 = this;
  var node__9142 = this;
  return new cljs.core.RedNode(this__9141.key, this__9141.val, this__9141.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9143 = this;
  var node__9144 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9145 = this;
  var node__9146 = this;
  return new cljs.core.RedNode(this__9145.key, this__9145.val, this__9145.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9147 = this;
  var node__9148 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9149 = this;
  var node__9150 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9150, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9151 = this;
  var node__9152 = this;
  return new cljs.core.RedNode(this__9151.key, this__9151.val, del, this__9151.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9153 = this;
  var node__9154 = this;
  return new cljs.core.RedNode(this__9153.key, this__9153.val, ins, this__9153.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9155 = this;
  var node__9156 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9155.left)) {
    return new cljs.core.RedNode(this__9155.key, this__9155.val, this__9155.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9155.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9155.right)) {
      return new cljs.core.RedNode(this__9155.right.key, this__9155.right.val, new cljs.core.BlackNode(this__9155.key, this__9155.val, this__9155.left, this__9155.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9155.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9156, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9178 = null;
  var G__9178__0 = function() {
    var this__9157 = this;
    var this__9159 = this;
    return cljs.core.pr_str.call(null, this__9159)
  };
  G__9178 = function() {
    switch(arguments.length) {
      case 0:
        return G__9178__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9178
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9160 = this;
  var node__9161 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9160.right)) {
    return new cljs.core.RedNode(this__9160.key, this__9160.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9160.left, null), this__9160.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9160.left)) {
      return new cljs.core.RedNode(this__9160.left.key, this__9160.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9160.left.left, null), new cljs.core.BlackNode(this__9160.key, this__9160.val, this__9160.left.right, this__9160.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9161, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9162 = this;
  var node__9163 = this;
  return new cljs.core.BlackNode(this__9162.key, this__9162.val, this__9162.left, this__9162.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9164 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9165 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9166 = this;
  return cljs.core.list.call(null, this__9166.key, this__9166.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9167 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9168 = this;
  return this__9168.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9169 = this;
  return cljs.core.PersistentVector.fromArray([this__9169.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9170 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9170.key, this__9170.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9171 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9172 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9172.key, this__9172.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9173 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9174 = this;
  if(n === 0) {
    return this__9174.key
  }else {
    if(n === 1) {
      return this__9174.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9175 = this;
  if(n === 0) {
    return this__9175.key
  }else {
    if(n === 1) {
      return this__9175.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9176 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9182 = comp.call(null, k, tree.key);
    if(c__9182 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9182 < 0) {
        var ins__9183 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9183 == null)) {
          return tree.add_left(ins__9183)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9184 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9184 == null)) {
            return tree.add_right(ins__9184)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9187 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9187)) {
            return new cljs.core.RedNode(app__9187.key, app__9187.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9187.left, null), new cljs.core.RedNode(right.key, right.val, app__9187.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9187, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9188 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9188)) {
              return new cljs.core.RedNode(app__9188.key, app__9188.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9188.left, null), new cljs.core.BlackNode(right.key, right.val, app__9188.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9188, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9194 = comp.call(null, k, tree.key);
    if(c__9194 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9194 < 0) {
        var del__9195 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9196 = !(del__9195 == null);
          if(or__3824__auto____9196) {
            return or__3824__auto____9196
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9195, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9195, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9197 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9198 = !(del__9197 == null);
            if(or__3824__auto____9198) {
              return or__3824__auto____9198
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9197)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9197, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9201 = tree.key;
  var c__9202 = comp.call(null, k, tk__9201);
  if(c__9202 === 0) {
    return tree.replace(tk__9201, v, tree.left, tree.right)
  }else {
    if(c__9202 < 0) {
      return tree.replace(tk__9201, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9201, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9205 = this;
  var h__2192__auto____9206 = this__9205.__hash;
  if(!(h__2192__auto____9206 == null)) {
    return h__2192__auto____9206
  }else {
    var h__2192__auto____9207 = cljs.core.hash_imap.call(null, coll);
    this__9205.__hash = h__2192__auto____9207;
    return h__2192__auto____9207
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9208 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9209 = this;
  var n__9210 = coll.entry_at(k);
  if(!(n__9210 == null)) {
    return n__9210.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9211 = this;
  var found__9212 = [null];
  var t__9213 = cljs.core.tree_map_add.call(null, this__9211.comp, this__9211.tree, k, v, found__9212);
  if(t__9213 == null) {
    var found_node__9214 = cljs.core.nth.call(null, found__9212, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9214.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9211.comp, cljs.core.tree_map_replace.call(null, this__9211.comp, this__9211.tree, k, v), this__9211.cnt, this__9211.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9211.comp, t__9213.blacken(), this__9211.cnt + 1, this__9211.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9215 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9249 = null;
  var G__9249__2 = function(this_sym9216, k) {
    var this__9218 = this;
    var this_sym9216__9219 = this;
    var coll__9220 = this_sym9216__9219;
    return coll__9220.cljs$core$ILookup$_lookup$arity$2(coll__9220, k)
  };
  var G__9249__3 = function(this_sym9217, k, not_found) {
    var this__9218 = this;
    var this_sym9217__9221 = this;
    var coll__9222 = this_sym9217__9221;
    return coll__9222.cljs$core$ILookup$_lookup$arity$3(coll__9222, k, not_found)
  };
  G__9249 = function(this_sym9217, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9249__2.call(this, this_sym9217, k);
      case 3:
        return G__9249__3.call(this, this_sym9217, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9249
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9203, args9204) {
  var this__9223 = this;
  return this_sym9203.call.apply(this_sym9203, [this_sym9203].concat(args9204.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9224 = this;
  if(!(this__9224.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9224.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9225 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9226 = this;
  if(this__9226.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9226.tree, false, this__9226.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9227 = this;
  var this__9228 = this;
  return cljs.core.pr_str.call(null, this__9228)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9229 = this;
  var coll__9230 = this;
  var t__9231 = this__9229.tree;
  while(true) {
    if(!(t__9231 == null)) {
      var c__9232 = this__9229.comp.call(null, k, t__9231.key);
      if(c__9232 === 0) {
        return t__9231
      }else {
        if(c__9232 < 0) {
          var G__9250 = t__9231.left;
          t__9231 = G__9250;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9251 = t__9231.right;
            t__9231 = G__9251;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9233 = this;
  if(this__9233.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9233.tree, ascending_QMARK_, this__9233.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9234 = this;
  if(this__9234.cnt > 0) {
    var stack__9235 = null;
    var t__9236 = this__9234.tree;
    while(true) {
      if(!(t__9236 == null)) {
        var c__9237 = this__9234.comp.call(null, k, t__9236.key);
        if(c__9237 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9235, t__9236), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9237 < 0) {
              var G__9252 = cljs.core.conj.call(null, stack__9235, t__9236);
              var G__9253 = t__9236.left;
              stack__9235 = G__9252;
              t__9236 = G__9253;
              continue
            }else {
              var G__9254 = stack__9235;
              var G__9255 = t__9236.right;
              stack__9235 = G__9254;
              t__9236 = G__9255;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9237 > 0) {
                var G__9256 = cljs.core.conj.call(null, stack__9235, t__9236);
                var G__9257 = t__9236.right;
                stack__9235 = G__9256;
                t__9236 = G__9257;
                continue
              }else {
                var G__9258 = stack__9235;
                var G__9259 = t__9236.left;
                stack__9235 = G__9258;
                t__9236 = G__9259;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9235 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9235, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9238 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9239 = this;
  return this__9239.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9240 = this;
  if(this__9240.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9240.tree, true, this__9240.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9241 = this;
  return this__9241.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9242 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9243 = this;
  return new cljs.core.PersistentTreeMap(this__9243.comp, this__9243.tree, this__9243.cnt, meta, this__9243.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9244 = this;
  return this__9244.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9245 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9245.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9246 = this;
  var found__9247 = [null];
  var t__9248 = cljs.core.tree_map_remove.call(null, this__9246.comp, this__9246.tree, k, found__9247);
  if(t__9248 == null) {
    if(cljs.core.nth.call(null, found__9247, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9246.comp, null, 0, this__9246.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9246.comp, t__9248.blacken(), this__9246.cnt - 1, this__9246.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9262 = cljs.core.seq.call(null, keyvals);
    var out__9263 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9262) {
        var G__9264 = cljs.core.nnext.call(null, in__9262);
        var G__9265 = cljs.core.assoc_BANG_.call(null, out__9263, cljs.core.first.call(null, in__9262), cljs.core.second.call(null, in__9262));
        in__9262 = G__9264;
        out__9263 = G__9265;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9263)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9266) {
    var keyvals = cljs.core.seq(arglist__9266);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9267) {
    var keyvals = cljs.core.seq(arglist__9267);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9271 = [];
    var obj__9272 = {};
    var kvs__9273 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9273) {
        ks__9271.push(cljs.core.first.call(null, kvs__9273));
        obj__9272[cljs.core.first.call(null, kvs__9273)] = cljs.core.second.call(null, kvs__9273);
        var G__9274 = cljs.core.nnext.call(null, kvs__9273);
        kvs__9273 = G__9274;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9271, obj__9272)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9275) {
    var keyvals = cljs.core.seq(arglist__9275);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9278 = cljs.core.seq.call(null, keyvals);
    var out__9279 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9278) {
        var G__9280 = cljs.core.nnext.call(null, in__9278);
        var G__9281 = cljs.core.assoc.call(null, out__9279, cljs.core.first.call(null, in__9278), cljs.core.second.call(null, in__9278));
        in__9278 = G__9280;
        out__9279 = G__9281;
        continue
      }else {
        return out__9279
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9282) {
    var keyvals = cljs.core.seq(arglist__9282);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9285 = cljs.core.seq.call(null, keyvals);
    var out__9286 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9285) {
        var G__9287 = cljs.core.nnext.call(null, in__9285);
        var G__9288 = cljs.core.assoc.call(null, out__9286, cljs.core.first.call(null, in__9285), cljs.core.second.call(null, in__9285));
        in__9285 = G__9287;
        out__9286 = G__9288;
        continue
      }else {
        return out__9286
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9289) {
    var comparator = cljs.core.first(arglist__9289);
    var keyvals = cljs.core.rest(arglist__9289);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9290_SHARP_, p2__9291_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9293 = p1__9290_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9293)) {
            return or__3824__auto____9293
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9291_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9294) {
    var maps = cljs.core.seq(arglist__9294);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9302 = function(m, e) {
        var k__9300 = cljs.core.first.call(null, e);
        var v__9301 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9300)) {
          return cljs.core.assoc.call(null, m, k__9300, f.call(null, cljs.core._lookup.call(null, m, k__9300, null), v__9301))
        }else {
          return cljs.core.assoc.call(null, m, k__9300, v__9301)
        }
      };
      var merge2__9304 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9302, function() {
          var or__3824__auto____9303 = m1;
          if(cljs.core.truth_(or__3824__auto____9303)) {
            return or__3824__auto____9303
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9304, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9305) {
    var f = cljs.core.first(arglist__9305);
    var maps = cljs.core.rest(arglist__9305);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9310 = cljs.core.ObjMap.EMPTY;
  var keys__9311 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9311) {
      var key__9312 = cljs.core.first.call(null, keys__9311);
      var entry__9313 = cljs.core._lookup.call(null, map, key__9312, "\ufdd0'cljs.core/not-found");
      var G__9314 = cljs.core.not_EQ_.call(null, entry__9313, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9310, key__9312, entry__9313) : ret__9310;
      var G__9315 = cljs.core.next.call(null, keys__9311);
      ret__9310 = G__9314;
      keys__9311 = G__9315;
      continue
    }else {
      return ret__9310
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9319 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9319.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9320 = this;
  var h__2192__auto____9321 = this__9320.__hash;
  if(!(h__2192__auto____9321 == null)) {
    return h__2192__auto____9321
  }else {
    var h__2192__auto____9322 = cljs.core.hash_iset.call(null, coll);
    this__9320.__hash = h__2192__auto____9322;
    return h__2192__auto____9322
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9323 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9324 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9324.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9345 = null;
  var G__9345__2 = function(this_sym9325, k) {
    var this__9327 = this;
    var this_sym9325__9328 = this;
    var coll__9329 = this_sym9325__9328;
    return coll__9329.cljs$core$ILookup$_lookup$arity$2(coll__9329, k)
  };
  var G__9345__3 = function(this_sym9326, k, not_found) {
    var this__9327 = this;
    var this_sym9326__9330 = this;
    var coll__9331 = this_sym9326__9330;
    return coll__9331.cljs$core$ILookup$_lookup$arity$3(coll__9331, k, not_found)
  };
  G__9345 = function(this_sym9326, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9345__2.call(this, this_sym9326, k);
      case 3:
        return G__9345__3.call(this, this_sym9326, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9345
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9317, args9318) {
  var this__9332 = this;
  return this_sym9317.call.apply(this_sym9317, [this_sym9317].concat(args9318.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9333 = this;
  return new cljs.core.PersistentHashSet(this__9333.meta, cljs.core.assoc.call(null, this__9333.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9334 = this;
  var this__9335 = this;
  return cljs.core.pr_str.call(null, this__9335)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9336 = this;
  return cljs.core.keys.call(null, this__9336.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9337 = this;
  return new cljs.core.PersistentHashSet(this__9337.meta, cljs.core.dissoc.call(null, this__9337.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9338 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9339 = this;
  var and__3822__auto____9340 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9340) {
    var and__3822__auto____9341 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9341) {
      return cljs.core.every_QMARK_.call(null, function(p1__9316_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9316_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9341
    }
  }else {
    return and__3822__auto____9340
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9342 = this;
  return new cljs.core.PersistentHashSet(meta, this__9342.hash_map, this__9342.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9343 = this;
  return this__9343.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9344 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9344.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9346 = cljs.core.count.call(null, items);
  var i__9347 = 0;
  var out__9348 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9347 < len__9346) {
      var G__9349 = i__9347 + 1;
      var G__9350 = cljs.core.conj_BANG_.call(null, out__9348, items[i__9347]);
      i__9347 = G__9349;
      out__9348 = G__9350;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9348)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9368 = null;
  var G__9368__2 = function(this_sym9354, k) {
    var this__9356 = this;
    var this_sym9354__9357 = this;
    var tcoll__9358 = this_sym9354__9357;
    if(cljs.core._lookup.call(null, this__9356.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9368__3 = function(this_sym9355, k, not_found) {
    var this__9356 = this;
    var this_sym9355__9359 = this;
    var tcoll__9360 = this_sym9355__9359;
    if(cljs.core._lookup.call(null, this__9356.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9368 = function(this_sym9355, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9368__2.call(this, this_sym9355, k);
      case 3:
        return G__9368__3.call(this, this_sym9355, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9368
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9352, args9353) {
  var this__9361 = this;
  return this_sym9352.call.apply(this_sym9352, [this_sym9352].concat(args9353.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9362 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9363 = this;
  if(cljs.core._lookup.call(null, this__9363.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9364 = this;
  return cljs.core.count.call(null, this__9364.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9365 = this;
  this__9365.transient_map = cljs.core.dissoc_BANG_.call(null, this__9365.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9366 = this;
  this__9366.transient_map = cljs.core.assoc_BANG_.call(null, this__9366.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9367 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9367.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9371 = this;
  var h__2192__auto____9372 = this__9371.__hash;
  if(!(h__2192__auto____9372 == null)) {
    return h__2192__auto____9372
  }else {
    var h__2192__auto____9373 = cljs.core.hash_iset.call(null, coll);
    this__9371.__hash = h__2192__auto____9373;
    return h__2192__auto____9373
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9374 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9375 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9375.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9401 = null;
  var G__9401__2 = function(this_sym9376, k) {
    var this__9378 = this;
    var this_sym9376__9379 = this;
    var coll__9380 = this_sym9376__9379;
    return coll__9380.cljs$core$ILookup$_lookup$arity$2(coll__9380, k)
  };
  var G__9401__3 = function(this_sym9377, k, not_found) {
    var this__9378 = this;
    var this_sym9377__9381 = this;
    var coll__9382 = this_sym9377__9381;
    return coll__9382.cljs$core$ILookup$_lookup$arity$3(coll__9382, k, not_found)
  };
  G__9401 = function(this_sym9377, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9401__2.call(this, this_sym9377, k);
      case 3:
        return G__9401__3.call(this, this_sym9377, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9401
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9369, args9370) {
  var this__9383 = this;
  return this_sym9369.call.apply(this_sym9369, [this_sym9369].concat(args9370.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9384 = this;
  return new cljs.core.PersistentTreeSet(this__9384.meta, cljs.core.assoc.call(null, this__9384.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9385 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9385.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9386 = this;
  var this__9387 = this;
  return cljs.core.pr_str.call(null, this__9387)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9388 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9388.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9389 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9389.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9390 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9391 = this;
  return cljs.core._comparator.call(null, this__9391.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9392 = this;
  return cljs.core.keys.call(null, this__9392.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9393 = this;
  return new cljs.core.PersistentTreeSet(this__9393.meta, cljs.core.dissoc.call(null, this__9393.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9394 = this;
  return cljs.core.count.call(null, this__9394.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9395 = this;
  var and__3822__auto____9396 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9396) {
    var and__3822__auto____9397 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9397) {
      return cljs.core.every_QMARK_.call(null, function(p1__9351_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9351_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9397
    }
  }else {
    return and__3822__auto____9396
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9398 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9398.tree_map, this__9398.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9399 = this;
  return this__9399.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9400 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9400.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9406__delegate = function(keys) {
      var in__9404 = cljs.core.seq.call(null, keys);
      var out__9405 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9404)) {
          var G__9407 = cljs.core.next.call(null, in__9404);
          var G__9408 = cljs.core.conj_BANG_.call(null, out__9405, cljs.core.first.call(null, in__9404));
          in__9404 = G__9407;
          out__9405 = G__9408;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9405)
        }
        break
      }
    };
    var G__9406 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9406__delegate.call(this, keys)
    };
    G__9406.cljs$lang$maxFixedArity = 0;
    G__9406.cljs$lang$applyTo = function(arglist__9409) {
      var keys = cljs.core.seq(arglist__9409);
      return G__9406__delegate(keys)
    };
    G__9406.cljs$lang$arity$variadic = G__9406__delegate;
    return G__9406
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9410) {
    var keys = cljs.core.seq(arglist__9410);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9412) {
    var comparator = cljs.core.first(arglist__9412);
    var keys = cljs.core.rest(arglist__9412);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9418 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9419 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9419)) {
        var e__9420 = temp__3971__auto____9419;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9420))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9418, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9411_SHARP_) {
      var temp__3971__auto____9421 = cljs.core.find.call(null, smap, p1__9411_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9421)) {
        var e__9422 = temp__3971__auto____9421;
        return cljs.core.second.call(null, e__9422)
      }else {
        return p1__9411_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9452 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9445, seen) {
        while(true) {
          var vec__9446__9447 = p__9445;
          var f__9448 = cljs.core.nth.call(null, vec__9446__9447, 0, null);
          var xs__9449 = vec__9446__9447;
          var temp__3974__auto____9450 = cljs.core.seq.call(null, xs__9449);
          if(temp__3974__auto____9450) {
            var s__9451 = temp__3974__auto____9450;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9448)) {
              var G__9453 = cljs.core.rest.call(null, s__9451);
              var G__9454 = seen;
              p__9445 = G__9453;
              seen = G__9454;
              continue
            }else {
              return cljs.core.cons.call(null, f__9448, step.call(null, cljs.core.rest.call(null, s__9451), cljs.core.conj.call(null, seen, f__9448)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9452.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9457 = cljs.core.PersistentVector.EMPTY;
  var s__9458 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9458)) {
      var G__9459 = cljs.core.conj.call(null, ret__9457, cljs.core.first.call(null, s__9458));
      var G__9460 = cljs.core.next.call(null, s__9458);
      ret__9457 = G__9459;
      s__9458 = G__9460;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9457)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9463 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9463) {
        return or__3824__auto____9463
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9464 = x.lastIndexOf("/");
      if(i__9464 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9464 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9467 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9467) {
      return or__3824__auto____9467
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9468 = x.lastIndexOf("/");
    if(i__9468 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9468)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9475 = cljs.core.ObjMap.EMPTY;
  var ks__9476 = cljs.core.seq.call(null, keys);
  var vs__9477 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9478 = ks__9476;
      if(and__3822__auto____9478) {
        return vs__9477
      }else {
        return and__3822__auto____9478
      }
    }()) {
      var G__9479 = cljs.core.assoc.call(null, map__9475, cljs.core.first.call(null, ks__9476), cljs.core.first.call(null, vs__9477));
      var G__9480 = cljs.core.next.call(null, ks__9476);
      var G__9481 = cljs.core.next.call(null, vs__9477);
      map__9475 = G__9479;
      ks__9476 = G__9480;
      vs__9477 = G__9481;
      continue
    }else {
      return map__9475
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9484__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9469_SHARP_, p2__9470_SHARP_) {
        return max_key.call(null, k, p1__9469_SHARP_, p2__9470_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9484 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9484__delegate.call(this, k, x, y, more)
    };
    G__9484.cljs$lang$maxFixedArity = 3;
    G__9484.cljs$lang$applyTo = function(arglist__9485) {
      var k = cljs.core.first(arglist__9485);
      var x = cljs.core.first(cljs.core.next(arglist__9485));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9485)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9485)));
      return G__9484__delegate(k, x, y, more)
    };
    G__9484.cljs$lang$arity$variadic = G__9484__delegate;
    return G__9484
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9486__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9482_SHARP_, p2__9483_SHARP_) {
        return min_key.call(null, k, p1__9482_SHARP_, p2__9483_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9486 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9486__delegate.call(this, k, x, y, more)
    };
    G__9486.cljs$lang$maxFixedArity = 3;
    G__9486.cljs$lang$applyTo = function(arglist__9487) {
      var k = cljs.core.first(arglist__9487);
      var x = cljs.core.first(cljs.core.next(arglist__9487));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9487)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9487)));
      return G__9486__delegate(k, x, y, more)
    };
    G__9486.cljs$lang$arity$variadic = G__9486__delegate;
    return G__9486
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9490 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9490) {
        var s__9491 = temp__3974__auto____9490;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9491), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9491)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9494 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9494) {
      var s__9495 = temp__3974__auto____9494;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9495)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9495), take_while.call(null, pred, cljs.core.rest.call(null, s__9495)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9497 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9497.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9509 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9510 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9510)) {
        var vec__9511__9512 = temp__3974__auto____9510;
        var e__9513 = cljs.core.nth.call(null, vec__9511__9512, 0, null);
        var s__9514 = vec__9511__9512;
        if(cljs.core.truth_(include__9509.call(null, e__9513))) {
          return s__9514
        }else {
          return cljs.core.next.call(null, s__9514)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9509, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9515 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9515)) {
      var vec__9516__9517 = temp__3974__auto____9515;
      var e__9518 = cljs.core.nth.call(null, vec__9516__9517, 0, null);
      var s__9519 = vec__9516__9517;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9518)) ? s__9519 : cljs.core.next.call(null, s__9519))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9531 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9532 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9532)) {
        var vec__9533__9534 = temp__3974__auto____9532;
        var e__9535 = cljs.core.nth.call(null, vec__9533__9534, 0, null);
        var s__9536 = vec__9533__9534;
        if(cljs.core.truth_(include__9531.call(null, e__9535))) {
          return s__9536
        }else {
          return cljs.core.next.call(null, s__9536)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9531, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9537 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9537)) {
      var vec__9538__9539 = temp__3974__auto____9537;
      var e__9540 = cljs.core.nth.call(null, vec__9538__9539, 0, null);
      var s__9541 = vec__9538__9539;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9540)) ? s__9541 : cljs.core.next.call(null, s__9541))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9542 = this;
  var h__2192__auto____9543 = this__9542.__hash;
  if(!(h__2192__auto____9543 == null)) {
    return h__2192__auto____9543
  }else {
    var h__2192__auto____9544 = cljs.core.hash_coll.call(null, rng);
    this__9542.__hash = h__2192__auto____9544;
    return h__2192__auto____9544
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9545 = this;
  if(this__9545.step > 0) {
    if(this__9545.start + this__9545.step < this__9545.end) {
      return new cljs.core.Range(this__9545.meta, this__9545.start + this__9545.step, this__9545.end, this__9545.step, null)
    }else {
      return null
    }
  }else {
    if(this__9545.start + this__9545.step > this__9545.end) {
      return new cljs.core.Range(this__9545.meta, this__9545.start + this__9545.step, this__9545.end, this__9545.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9546 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9547 = this;
  var this__9548 = this;
  return cljs.core.pr_str.call(null, this__9548)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9549 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9550 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9551 = this;
  if(this__9551.step > 0) {
    if(this__9551.start < this__9551.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9551.start > this__9551.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9552 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9552.end - this__9552.start) / this__9552.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9553 = this;
  return this__9553.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9554 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9554.meta, this__9554.start + this__9554.step, this__9554.end, this__9554.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9555 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9556 = this;
  return new cljs.core.Range(meta, this__9556.start, this__9556.end, this__9556.step, this__9556.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9557 = this;
  return this__9557.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9558 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9558.start + n * this__9558.step
  }else {
    if(function() {
      var and__3822__auto____9559 = this__9558.start > this__9558.end;
      if(and__3822__auto____9559) {
        return this__9558.step === 0
      }else {
        return and__3822__auto____9559
      }
    }()) {
      return this__9558.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9560 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9560.start + n * this__9560.step
  }else {
    if(function() {
      var and__3822__auto____9561 = this__9560.start > this__9560.end;
      if(and__3822__auto____9561) {
        return this__9560.step === 0
      }else {
        return and__3822__auto____9561
      }
    }()) {
      return this__9560.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9562 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9562.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9565 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9565) {
      var s__9566 = temp__3974__auto____9565;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9566), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9566)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9573 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9573) {
      var s__9574 = temp__3974__auto____9573;
      var fst__9575 = cljs.core.first.call(null, s__9574);
      var fv__9576 = f.call(null, fst__9575);
      var run__9577 = cljs.core.cons.call(null, fst__9575, cljs.core.take_while.call(null, function(p1__9567_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9576, f.call(null, p1__9567_SHARP_))
      }, cljs.core.next.call(null, s__9574)));
      return cljs.core.cons.call(null, run__9577, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9577), s__9574))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9592 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9592) {
        var s__9593 = temp__3971__auto____9592;
        return reductions.call(null, f, cljs.core.first.call(null, s__9593), cljs.core.rest.call(null, s__9593))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9594 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9594) {
        var s__9595 = temp__3974__auto____9594;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9595)), cljs.core.rest.call(null, s__9595))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9598 = null;
      var G__9598__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9598__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9598__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9598__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9598__4 = function() {
        var G__9599__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9599 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9599__delegate.call(this, x, y, z, args)
        };
        G__9599.cljs$lang$maxFixedArity = 3;
        G__9599.cljs$lang$applyTo = function(arglist__9600) {
          var x = cljs.core.first(arglist__9600);
          var y = cljs.core.first(cljs.core.next(arglist__9600));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9600)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9600)));
          return G__9599__delegate(x, y, z, args)
        };
        G__9599.cljs$lang$arity$variadic = G__9599__delegate;
        return G__9599
      }();
      G__9598 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9598__0.call(this);
          case 1:
            return G__9598__1.call(this, x);
          case 2:
            return G__9598__2.call(this, x, y);
          case 3:
            return G__9598__3.call(this, x, y, z);
          default:
            return G__9598__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9598.cljs$lang$maxFixedArity = 3;
      G__9598.cljs$lang$applyTo = G__9598__4.cljs$lang$applyTo;
      return G__9598
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9601 = null;
      var G__9601__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9601__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9601__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9601__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9601__4 = function() {
        var G__9602__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9602 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9602__delegate.call(this, x, y, z, args)
        };
        G__9602.cljs$lang$maxFixedArity = 3;
        G__9602.cljs$lang$applyTo = function(arglist__9603) {
          var x = cljs.core.first(arglist__9603);
          var y = cljs.core.first(cljs.core.next(arglist__9603));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9603)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9603)));
          return G__9602__delegate(x, y, z, args)
        };
        G__9602.cljs$lang$arity$variadic = G__9602__delegate;
        return G__9602
      }();
      G__9601 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9601__0.call(this);
          case 1:
            return G__9601__1.call(this, x);
          case 2:
            return G__9601__2.call(this, x, y);
          case 3:
            return G__9601__3.call(this, x, y, z);
          default:
            return G__9601__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9601.cljs$lang$maxFixedArity = 3;
      G__9601.cljs$lang$applyTo = G__9601__4.cljs$lang$applyTo;
      return G__9601
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9604 = null;
      var G__9604__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9604__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9604__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9604__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9604__4 = function() {
        var G__9605__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9605 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9605__delegate.call(this, x, y, z, args)
        };
        G__9605.cljs$lang$maxFixedArity = 3;
        G__9605.cljs$lang$applyTo = function(arglist__9606) {
          var x = cljs.core.first(arglist__9606);
          var y = cljs.core.first(cljs.core.next(arglist__9606));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9606)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9606)));
          return G__9605__delegate(x, y, z, args)
        };
        G__9605.cljs$lang$arity$variadic = G__9605__delegate;
        return G__9605
      }();
      G__9604 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9604__0.call(this);
          case 1:
            return G__9604__1.call(this, x);
          case 2:
            return G__9604__2.call(this, x, y);
          case 3:
            return G__9604__3.call(this, x, y, z);
          default:
            return G__9604__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9604.cljs$lang$maxFixedArity = 3;
      G__9604.cljs$lang$applyTo = G__9604__4.cljs$lang$applyTo;
      return G__9604
    }()
  };
  var juxt__4 = function() {
    var G__9607__delegate = function(f, g, h, fs) {
      var fs__9597 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9608 = null;
        var G__9608__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9578_SHARP_, p2__9579_SHARP_) {
            return cljs.core.conj.call(null, p1__9578_SHARP_, p2__9579_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9597)
        };
        var G__9608__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9580_SHARP_, p2__9581_SHARP_) {
            return cljs.core.conj.call(null, p1__9580_SHARP_, p2__9581_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9597)
        };
        var G__9608__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9582_SHARP_, p2__9583_SHARP_) {
            return cljs.core.conj.call(null, p1__9582_SHARP_, p2__9583_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9597)
        };
        var G__9608__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9584_SHARP_, p2__9585_SHARP_) {
            return cljs.core.conj.call(null, p1__9584_SHARP_, p2__9585_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9597)
        };
        var G__9608__4 = function() {
          var G__9609__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9586_SHARP_, p2__9587_SHARP_) {
              return cljs.core.conj.call(null, p1__9586_SHARP_, cljs.core.apply.call(null, p2__9587_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9597)
          };
          var G__9609 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9609__delegate.call(this, x, y, z, args)
          };
          G__9609.cljs$lang$maxFixedArity = 3;
          G__9609.cljs$lang$applyTo = function(arglist__9610) {
            var x = cljs.core.first(arglist__9610);
            var y = cljs.core.first(cljs.core.next(arglist__9610));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9610)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9610)));
            return G__9609__delegate(x, y, z, args)
          };
          G__9609.cljs$lang$arity$variadic = G__9609__delegate;
          return G__9609
        }();
        G__9608 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9608__0.call(this);
            case 1:
              return G__9608__1.call(this, x);
            case 2:
              return G__9608__2.call(this, x, y);
            case 3:
              return G__9608__3.call(this, x, y, z);
            default:
              return G__9608__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9608.cljs$lang$maxFixedArity = 3;
        G__9608.cljs$lang$applyTo = G__9608__4.cljs$lang$applyTo;
        return G__9608
      }()
    };
    var G__9607 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9607__delegate.call(this, f, g, h, fs)
    };
    G__9607.cljs$lang$maxFixedArity = 3;
    G__9607.cljs$lang$applyTo = function(arglist__9611) {
      var f = cljs.core.first(arglist__9611);
      var g = cljs.core.first(cljs.core.next(arglist__9611));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9611)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9611)));
      return G__9607__delegate(f, g, h, fs)
    };
    G__9607.cljs$lang$arity$variadic = G__9607__delegate;
    return G__9607
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9614 = cljs.core.next.call(null, coll);
        coll = G__9614;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9613 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9613) {
          return n > 0
        }else {
          return and__3822__auto____9613
        }
      }())) {
        var G__9615 = n - 1;
        var G__9616 = cljs.core.next.call(null, coll);
        n = G__9615;
        coll = G__9616;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9618 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9618), s)) {
    if(cljs.core.count.call(null, matches__9618) === 1) {
      return cljs.core.first.call(null, matches__9618)
    }else {
      return cljs.core.vec.call(null, matches__9618)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9620 = re.exec(s);
  if(matches__9620 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9620) === 1) {
      return cljs.core.first.call(null, matches__9620)
    }else {
      return cljs.core.vec.call(null, matches__9620)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9625 = cljs.core.re_find.call(null, re, s);
  var match_idx__9626 = s.search(re);
  var match_str__9627 = cljs.core.coll_QMARK_.call(null, match_data__9625) ? cljs.core.first.call(null, match_data__9625) : match_data__9625;
  var post_match__9628 = cljs.core.subs.call(null, s, match_idx__9626 + cljs.core.count.call(null, match_str__9627));
  if(cljs.core.truth_(match_data__9625)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9625, re_seq.call(null, re, post_match__9628))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9635__9636 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9637 = cljs.core.nth.call(null, vec__9635__9636, 0, null);
  var flags__9638 = cljs.core.nth.call(null, vec__9635__9636, 1, null);
  var pattern__9639 = cljs.core.nth.call(null, vec__9635__9636, 2, null);
  return new RegExp(pattern__9639, flags__9638)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9629_SHARP_) {
    return print_one.call(null, p1__9629_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____9649 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9649)) {
            var and__3822__auto____9653 = function() {
              var G__9650__9651 = obj;
              if(G__9650__9651) {
                if(function() {
                  var or__3824__auto____9652 = G__9650__9651.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9652) {
                    return or__3824__auto____9652
                  }else {
                    return G__9650__9651.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9650__9651.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9650__9651)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9650__9651)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9653)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9653
            }
          }else {
            return and__3822__auto____9649
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9654 = !(obj == null);
          if(and__3822__auto____9654) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9654
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9655__9656 = obj;
          if(G__9655__9656) {
            if(function() {
              var or__3824__auto____9657 = G__9655__9656.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9657) {
                return or__3824__auto____9657
              }else {
                return G__9655__9656.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9655__9656.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9655__9656)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9655__9656)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9677 = new goog.string.StringBuffer;
  var G__9678__9679 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9678__9679) {
    var string__9680 = cljs.core.first.call(null, G__9678__9679);
    var G__9678__9681 = G__9678__9679;
    while(true) {
      sb__9677.append(string__9680);
      var temp__3974__auto____9682 = cljs.core.next.call(null, G__9678__9681);
      if(temp__3974__auto____9682) {
        var G__9678__9683 = temp__3974__auto____9682;
        var G__9696 = cljs.core.first.call(null, G__9678__9683);
        var G__9697 = G__9678__9683;
        string__9680 = G__9696;
        G__9678__9681 = G__9697;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9684__9685 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9684__9685) {
    var obj__9686 = cljs.core.first.call(null, G__9684__9685);
    var G__9684__9687 = G__9684__9685;
    while(true) {
      sb__9677.append(" ");
      var G__9688__9689 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9686, opts));
      if(G__9688__9689) {
        var string__9690 = cljs.core.first.call(null, G__9688__9689);
        var G__9688__9691 = G__9688__9689;
        while(true) {
          sb__9677.append(string__9690);
          var temp__3974__auto____9692 = cljs.core.next.call(null, G__9688__9691);
          if(temp__3974__auto____9692) {
            var G__9688__9693 = temp__3974__auto____9692;
            var G__9698 = cljs.core.first.call(null, G__9688__9693);
            var G__9699 = G__9688__9693;
            string__9690 = G__9698;
            G__9688__9691 = G__9699;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9694 = cljs.core.next.call(null, G__9684__9687);
      if(temp__3974__auto____9694) {
        var G__9684__9695 = temp__3974__auto____9694;
        var G__9700 = cljs.core.first.call(null, G__9684__9695);
        var G__9701 = G__9684__9695;
        obj__9686 = G__9700;
        G__9684__9687 = G__9701;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9677
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9703 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9703.append("\n");
  return[cljs.core.str(sb__9703)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9722__9723 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9722__9723) {
    var string__9724 = cljs.core.first.call(null, G__9722__9723);
    var G__9722__9725 = G__9722__9723;
    while(true) {
      cljs.core.string_print.call(null, string__9724);
      var temp__3974__auto____9726 = cljs.core.next.call(null, G__9722__9725);
      if(temp__3974__auto____9726) {
        var G__9722__9727 = temp__3974__auto____9726;
        var G__9740 = cljs.core.first.call(null, G__9722__9727);
        var G__9741 = G__9722__9727;
        string__9724 = G__9740;
        G__9722__9725 = G__9741;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9728__9729 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9728__9729) {
    var obj__9730 = cljs.core.first.call(null, G__9728__9729);
    var G__9728__9731 = G__9728__9729;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9732__9733 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9730, opts));
      if(G__9732__9733) {
        var string__9734 = cljs.core.first.call(null, G__9732__9733);
        var G__9732__9735 = G__9732__9733;
        while(true) {
          cljs.core.string_print.call(null, string__9734);
          var temp__3974__auto____9736 = cljs.core.next.call(null, G__9732__9735);
          if(temp__3974__auto____9736) {
            var G__9732__9737 = temp__3974__auto____9736;
            var G__9742 = cljs.core.first.call(null, G__9732__9737);
            var G__9743 = G__9732__9737;
            string__9734 = G__9742;
            G__9732__9735 = G__9743;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9738 = cljs.core.next.call(null, G__9728__9731);
      if(temp__3974__auto____9738) {
        var G__9728__9739 = temp__3974__auto____9738;
        var G__9744 = cljs.core.first.call(null, G__9728__9739);
        var G__9745 = G__9728__9739;
        obj__9730 = G__9744;
        G__9728__9731 = G__9745;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9746) {
    var objs = cljs.core.seq(arglist__9746);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9747) {
    var objs = cljs.core.seq(arglist__9747);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9748) {
    var objs = cljs.core.seq(arglist__9748);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9749) {
    var objs = cljs.core.seq(arglist__9749);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9750) {
    var objs = cljs.core.seq(arglist__9750);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9751) {
    var objs = cljs.core.seq(arglist__9751);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9752) {
    var objs = cljs.core.seq(arglist__9752);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9753) {
    var objs = cljs.core.seq(arglist__9753);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9754) {
    var fmt = cljs.core.first(arglist__9754);
    var args = cljs.core.rest(arglist__9754);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9755 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9755, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9756 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9756, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9757 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9757, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9758 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9758)) {
        var nspc__9759 = temp__3974__auto____9758;
        return[cljs.core.str(nspc__9759), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9760 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9760)) {
          var nspc__9761 = temp__3974__auto____9760;
          return[cljs.core.str(nspc__9761), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9762 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9762, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9764 = function(n, len) {
    var ns__9763 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9763) < len) {
        var G__9766 = [cljs.core.str("0"), cljs.core.str(ns__9763)].join("");
        ns__9763 = G__9766;
        continue
      }else {
        return ns__9763
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9764.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9764.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9764.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9764.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9764.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9764.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9765 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9765, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9767 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9768 = this;
  var G__9769__9770 = cljs.core.seq.call(null, this__9768.watches);
  if(G__9769__9770) {
    var G__9772__9774 = cljs.core.first.call(null, G__9769__9770);
    var vec__9773__9775 = G__9772__9774;
    var key__9776 = cljs.core.nth.call(null, vec__9773__9775, 0, null);
    var f__9777 = cljs.core.nth.call(null, vec__9773__9775, 1, null);
    var G__9769__9778 = G__9769__9770;
    var G__9772__9779 = G__9772__9774;
    var G__9769__9780 = G__9769__9778;
    while(true) {
      var vec__9781__9782 = G__9772__9779;
      var key__9783 = cljs.core.nth.call(null, vec__9781__9782, 0, null);
      var f__9784 = cljs.core.nth.call(null, vec__9781__9782, 1, null);
      var G__9769__9785 = G__9769__9780;
      f__9784.call(null, key__9783, this$, oldval, newval);
      var temp__3974__auto____9786 = cljs.core.next.call(null, G__9769__9785);
      if(temp__3974__auto____9786) {
        var G__9769__9787 = temp__3974__auto____9786;
        var G__9794 = cljs.core.first.call(null, G__9769__9787);
        var G__9795 = G__9769__9787;
        G__9772__9779 = G__9794;
        G__9769__9780 = G__9795;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9788 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9788.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9789 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9789.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9790 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9790.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9791 = this;
  return this__9791.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9792 = this;
  return this__9792.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9793 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9807__delegate = function(x, p__9796) {
      var map__9802__9803 = p__9796;
      var map__9802__9804 = cljs.core.seq_QMARK_.call(null, map__9802__9803) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9802__9803) : map__9802__9803;
      var validator__9805 = cljs.core._lookup.call(null, map__9802__9804, "\ufdd0'validator", null);
      var meta__9806 = cljs.core._lookup.call(null, map__9802__9804, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9806, validator__9805, null)
    };
    var G__9807 = function(x, var_args) {
      var p__9796 = null;
      if(goog.isDef(var_args)) {
        p__9796 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9807__delegate.call(this, x, p__9796)
    };
    G__9807.cljs$lang$maxFixedArity = 1;
    G__9807.cljs$lang$applyTo = function(arglist__9808) {
      var x = cljs.core.first(arglist__9808);
      var p__9796 = cljs.core.rest(arglist__9808);
      return G__9807__delegate(x, p__9796)
    };
    G__9807.cljs$lang$arity$variadic = G__9807__delegate;
    return G__9807
  }();
  atom = function(x, var_args) {
    var p__9796 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____9812 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9812)) {
    var validate__9813 = temp__3974__auto____9812;
    if(cljs.core.truth_(validate__9813.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9814 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9814, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9815__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9815 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9815__delegate.call(this, a, f, x, y, z, more)
    };
    G__9815.cljs$lang$maxFixedArity = 5;
    G__9815.cljs$lang$applyTo = function(arglist__9816) {
      var a = cljs.core.first(arglist__9816);
      var f = cljs.core.first(cljs.core.next(arglist__9816));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9816)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9816))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9816)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9816)))));
      return G__9815__delegate(a, f, x, y, z, more)
    };
    G__9815.cljs$lang$arity$variadic = G__9815__delegate;
    return G__9815
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9817) {
    var iref = cljs.core.first(arglist__9817);
    var f = cljs.core.first(cljs.core.next(arglist__9817));
    var args = cljs.core.rest(cljs.core.next(arglist__9817));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9818 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9818.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9819 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9819.state, function(p__9820) {
    var map__9821__9822 = p__9820;
    var map__9821__9823 = cljs.core.seq_QMARK_.call(null, map__9821__9822) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9821__9822) : map__9821__9822;
    var curr_state__9824 = map__9821__9823;
    var done__9825 = cljs.core._lookup.call(null, map__9821__9823, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9825)) {
      return curr_state__9824
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9819.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9846__9847 = options;
    var map__9846__9848 = cljs.core.seq_QMARK_.call(null, map__9846__9847) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9846__9847) : map__9846__9847;
    var keywordize_keys__9849 = cljs.core._lookup.call(null, map__9846__9848, "\ufdd0'keywordize-keys", null);
    var keyfn__9850 = cljs.core.truth_(keywordize_keys__9849) ? cljs.core.keyword : cljs.core.str;
    var f__9865 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2462__auto____9864 = function iter__9858(s__9859) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9859__9862 = s__9859;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9859__9862)) {
                        var k__9863 = cljs.core.first.call(null, s__9859__9862);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9850.call(null, k__9863), thisfn.call(null, x[k__9863])], true), iter__9858.call(null, cljs.core.rest.call(null, s__9859__9862)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____9864.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9865.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9866) {
    var x = cljs.core.first(arglist__9866);
    var options = cljs.core.rest(arglist__9866);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9871 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9875__delegate = function(args) {
      var temp__3971__auto____9872 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9871), args, null);
      if(cljs.core.truth_(temp__3971__auto____9872)) {
        var v__9873 = temp__3971__auto____9872;
        return v__9873
      }else {
        var ret__9874 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9871, cljs.core.assoc, args, ret__9874);
        return ret__9874
      }
    };
    var G__9875 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9875__delegate.call(this, args)
    };
    G__9875.cljs$lang$maxFixedArity = 0;
    G__9875.cljs$lang$applyTo = function(arglist__9876) {
      var args = cljs.core.seq(arglist__9876);
      return G__9875__delegate(args)
    };
    G__9875.cljs$lang$arity$variadic = G__9875__delegate;
    return G__9875
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9878 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9878)) {
        var G__9879 = ret__9878;
        f = G__9879;
        continue
      }else {
        return ret__9878
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9880__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9880 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9880__delegate.call(this, f, args)
    };
    G__9880.cljs$lang$maxFixedArity = 1;
    G__9880.cljs$lang$applyTo = function(arglist__9881) {
      var f = cljs.core.first(arglist__9881);
      var args = cljs.core.rest(arglist__9881);
      return G__9880__delegate(f, args)
    };
    G__9880.cljs$lang$arity$variadic = G__9880__delegate;
    return G__9880
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9883 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9883, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9883, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____9892 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9892) {
      return or__3824__auto____9892
    }else {
      var or__3824__auto____9893 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9893) {
        return or__3824__auto____9893
      }else {
        var and__3822__auto____9894 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9894) {
          var and__3822__auto____9895 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9895) {
            var and__3822__auto____9896 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9896) {
              var ret__9897 = true;
              var i__9898 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9899 = cljs.core.not.call(null, ret__9897);
                  if(or__3824__auto____9899) {
                    return or__3824__auto____9899
                  }else {
                    return i__9898 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9897
                }else {
                  var G__9900 = isa_QMARK_.call(null, h, child.call(null, i__9898), parent.call(null, i__9898));
                  var G__9901 = i__9898 + 1;
                  ret__9897 = G__9900;
                  i__9898 = G__9901;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9896
            }
          }else {
            return and__3822__auto____9895
          }
        }else {
          return and__3822__auto____9894
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__9910 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9911 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9912 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9913 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9914 = cljs.core.contains_QMARK_.call(null, tp__9910.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9912.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9912.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9910, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9913.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9911, parent, ta__9912), "\ufdd0'descendants":tf__9913.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9912, tag, td__9911)})
    }();
    if(cljs.core.truth_(or__3824__auto____9914)) {
      return or__3824__auto____9914
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9919 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9920 = cljs.core.truth_(parentMap__9919.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9919.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9921 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9920)) ? cljs.core.assoc.call(null, parentMap__9919, tag, childsParents__9920) : cljs.core.dissoc.call(null, parentMap__9919, tag);
    var deriv_seq__9922 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9902_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9902_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9902_SHARP_), cljs.core.second.call(null, p1__9902_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9921)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9919.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9903_SHARP_, p2__9904_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9903_SHARP_, p2__9904_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9922))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9930 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9932 = cljs.core.truth_(function() {
    var and__3822__auto____9931 = xprefs__9930;
    if(cljs.core.truth_(and__3822__auto____9931)) {
      return xprefs__9930.call(null, y)
    }else {
      return and__3822__auto____9931
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9932)) {
    return or__3824__auto____9932
  }else {
    var or__3824__auto____9934 = function() {
      var ps__9933 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9933) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9933), prefer_table))) {
          }else {
          }
          var G__9937 = cljs.core.rest.call(null, ps__9933);
          ps__9933 = G__9937;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9934)) {
      return or__3824__auto____9934
    }else {
      var or__3824__auto____9936 = function() {
        var ps__9935 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9935) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9935), y, prefer_table))) {
            }else {
            }
            var G__9938 = cljs.core.rest.call(null, ps__9935);
            ps__9935 = G__9938;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9936)) {
        return or__3824__auto____9936
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9940 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9940)) {
    return or__3824__auto____9940
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9958 = cljs.core.reduce.call(null, function(be, p__9950) {
    var vec__9951__9952 = p__9950;
    var k__9953 = cljs.core.nth.call(null, vec__9951__9952, 0, null);
    var ___9954 = cljs.core.nth.call(null, vec__9951__9952, 1, null);
    var e__9955 = vec__9951__9952;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9953)) {
      var be2__9957 = cljs.core.truth_(function() {
        var or__3824__auto____9956 = be == null;
        if(or__3824__auto____9956) {
          return or__3824__auto____9956
        }else {
          return cljs.core.dominates.call(null, k__9953, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9955 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9957), k__9953, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9953), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9957)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9957
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9958)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9958));
      return cljs.core.second.call(null, best_entry__9958)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____9963 = mf;
    if(and__3822__auto____9963) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9963
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____9964 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9965 = cljs.core._reset[goog.typeOf(x__2363__auto____9964)];
      if(or__3824__auto____9965) {
        return or__3824__auto____9965
      }else {
        var or__3824__auto____9966 = cljs.core._reset["_"];
        if(or__3824__auto____9966) {
          return or__3824__auto____9966
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9971 = mf;
    if(and__3822__auto____9971) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9971
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____9972 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9973 = cljs.core._add_method[goog.typeOf(x__2363__auto____9972)];
      if(or__3824__auto____9973) {
        return or__3824__auto____9973
      }else {
        var or__3824__auto____9974 = cljs.core._add_method["_"];
        if(or__3824__auto____9974) {
          return or__3824__auto____9974
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9979 = mf;
    if(and__3822__auto____9979) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____9979
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____9980 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9981 = cljs.core._remove_method[goog.typeOf(x__2363__auto____9980)];
      if(or__3824__auto____9981) {
        return or__3824__auto____9981
      }else {
        var or__3824__auto____9982 = cljs.core._remove_method["_"];
        if(or__3824__auto____9982) {
          return or__3824__auto____9982
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____9987 = mf;
    if(and__3822__auto____9987) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____9987
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____9988 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9989 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____9988)];
      if(or__3824__auto____9989) {
        return or__3824__auto____9989
      }else {
        var or__3824__auto____9990 = cljs.core._prefer_method["_"];
        if(or__3824__auto____9990) {
          return or__3824__auto____9990
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9995 = mf;
    if(and__3822__auto____9995) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____9995
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____9996 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9997 = cljs.core._get_method[goog.typeOf(x__2363__auto____9996)];
      if(or__3824__auto____9997) {
        return or__3824__auto____9997
      }else {
        var or__3824__auto____9998 = cljs.core._get_method["_"];
        if(or__3824__auto____9998) {
          return or__3824__auto____9998
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10003 = mf;
    if(and__3822__auto____10003) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10003
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____10004 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10005 = cljs.core._methods[goog.typeOf(x__2363__auto____10004)];
      if(or__3824__auto____10005) {
        return or__3824__auto____10005
      }else {
        var or__3824__auto____10006 = cljs.core._methods["_"];
        if(or__3824__auto____10006) {
          return or__3824__auto____10006
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10011 = mf;
    if(and__3822__auto____10011) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10011
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____10012 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10013 = cljs.core._prefers[goog.typeOf(x__2363__auto____10012)];
      if(or__3824__auto____10013) {
        return or__3824__auto____10013
      }else {
        var or__3824__auto____10014 = cljs.core._prefers["_"];
        if(or__3824__auto____10014) {
          return or__3824__auto____10014
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10019 = mf;
    if(and__3822__auto____10019) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10019
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____10020 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10021 = cljs.core._dispatch[goog.typeOf(x__2363__auto____10020)];
      if(or__3824__auto____10021) {
        return or__3824__auto____10021
      }else {
        var or__3824__auto____10022 = cljs.core._dispatch["_"];
        if(or__3824__auto____10022) {
          return or__3824__auto____10022
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10025 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10026 = cljs.core._get_method.call(null, mf, dispatch_val__10025);
  if(cljs.core.truth_(target_fn__10026)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10025)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10026, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10027 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10028 = this;
  cljs.core.swap_BANG_.call(null, this__10028.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10028.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10028.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10028.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10029 = this;
  cljs.core.swap_BANG_.call(null, this__10029.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10029.method_cache, this__10029.method_table, this__10029.cached_hierarchy, this__10029.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10030 = this;
  cljs.core.swap_BANG_.call(null, this__10030.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10030.method_cache, this__10030.method_table, this__10030.cached_hierarchy, this__10030.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10031 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10031.cached_hierarchy), cljs.core.deref.call(null, this__10031.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10031.method_cache, this__10031.method_table, this__10031.cached_hierarchy, this__10031.hierarchy)
  }
  var temp__3971__auto____10032 = cljs.core.deref.call(null, this__10031.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10032)) {
    var target_fn__10033 = temp__3971__auto____10032;
    return target_fn__10033
  }else {
    var temp__3971__auto____10034 = cljs.core.find_and_cache_best_method.call(null, this__10031.name, dispatch_val, this__10031.hierarchy, this__10031.method_table, this__10031.prefer_table, this__10031.method_cache, this__10031.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10034)) {
      var target_fn__10035 = temp__3971__auto____10034;
      return target_fn__10035
    }else {
      return cljs.core.deref.call(null, this__10031.method_table).call(null, this__10031.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10036 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10036.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10036.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10036.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10036.method_cache, this__10036.method_table, this__10036.cached_hierarchy, this__10036.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10037 = this;
  return cljs.core.deref.call(null, this__10037.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10038 = this;
  return cljs.core.deref.call(null, this__10038.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10039 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10039.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10041__delegate = function(_, args) {
    var self__10040 = this;
    return cljs.core._dispatch.call(null, self__10040, args)
  };
  var G__10041 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10041__delegate.call(this, _, args)
  };
  G__10041.cljs$lang$maxFixedArity = 1;
  G__10041.cljs$lang$applyTo = function(arglist__10042) {
    var _ = cljs.core.first(arglist__10042);
    var args = cljs.core.rest(arglist__10042);
    return G__10041__delegate(_, args)
  };
  G__10041.cljs$lang$arity$variadic = G__10041__delegate;
  return G__10041
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10043 = this;
  return cljs.core._dispatch.call(null, self__10043, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10044 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10046, _) {
  var this__10045 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10045.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10047 = this;
  var and__3822__auto____10048 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10048) {
    return this__10047.uuid === other.uuid
  }else {
    return and__3822__auto____10048
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10049 = this;
  var this__10050 = this;
  return cljs.core.pr_str.call(null, this__10050)
};
cljs.core.UUID;
goog.provide("myapp.game");
goog.require("cljs.core");
myapp.game.init_fn = function init_fn() {
  var this__6107 = this;
  this__6107._super();
  var size__6108 = cc.Director.getInstance().getWinSize();
  this__6107.sprite = cc.Sprite.create("res/HelloWorld.png");
  var G__6109__6110 = this__6107.sprite;
  G__6109__6110.setPosition(cc.p(size__6108.width / 2, size__6108.height / 2));
  G__6109__6110.setVisible(true);
  G__6109__6110.setAnchorPoint(cc.p(0.5, 0.5));
  G__6109__6110.setScale(0.5);
  G__6109__6110.setRotation(90);
  G__6109__6110;
  this__6107.addChild(this__6107.sprite, 0);
  this__6107.setTouchEnabled(true);
  this__6107.scoreLabel = cc.LabelTTF.create("0", "Arial", 32, 200);
  var G__6111__6112 = this__6107.scoreLabel;
  G__6111__6112.setAnchorPoint(cc.p(0, 0));
  G__6111__6112.setPosition(cc.p(130, size__6108.height - 48));
  G__6111__6112.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
  G__6111__6112;
  return this__6107.addChild(this__6107.scoreLabel)
};
myapp.game.clicks = cljs.core.atom.call(null, 0);
myapp.game.on_touches_began = function on_touches_began(touches, events) {
  var this__6117 = this;
  var sprite__6118 = this__6117.sprite;
  var current_rotation__6119 = sprite__6118.getRotation();
  cljs.core.swap_BANG_.call(null, myapp.game.clicks, cljs.core.inc);
  var this__6120 = this;
  this__6120.scoreLabel.setString(cljs.core.deref.call(null, myapp.game.clicks));
  return sprite__6118.setRotation(current_rotation__6119 + 5)
};
myapp.game.params = {isMouseDown:false, helloImg:null, helloLb:null, circle:null, sprite:null, scoreLabel:null, init:myapp.game.init_fn, onTouchesBegan:myapp.game.on_touches_began};
myapp.game.hello_world_layer = cc.Layer.extend(myapp.game.params);
goog.exportSymbol("myapp.game.hello_world_layer", myapp.game.hello_world_layer);
myapp.game.scene_params = {onEnter:function() {
  var this__6121 = this;
  this__6121._super();
  var layer__6122 = new myapp.game.hello_world_layer;
  layer__6122.init();
  return this__6121.addChild(layer__6122)
}};
myapp.game.hello_world_scene = cc.Scene.extend(myapp.game.scene_params);
goog.exportSymbol("myapp.game.hello_world_scene", myapp.game.hello_world_scene);
