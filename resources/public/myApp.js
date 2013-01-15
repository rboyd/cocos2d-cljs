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
  var x__6126 = x == null ? null : x;
  if(p[goog.typeOf(x__6126)]) {
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
    var G__6127__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6127 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6127__delegate.call(this, array, i, idxs)
    };
    G__6127.cljs$lang$maxFixedArity = 2;
    G__6127.cljs$lang$applyTo = function(arglist__6128) {
      var array = cljs.core.first(arglist__6128);
      var i = cljs.core.first(cljs.core.next(arglist__6128));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6128));
      return G__6127__delegate(array, i, idxs)
    };
    G__6127.cljs$lang$arity$variadic = G__6127__delegate;
    return G__6127
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
      var and__3822__auto____6213 = this$;
      if(and__3822__auto____6213) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6213
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____6214 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6215 = cljs.core._invoke[goog.typeOf(x__2363__auto____6214)];
        if(or__3824__auto____6215) {
          return or__3824__auto____6215
        }else {
          var or__3824__auto____6216 = cljs.core._invoke["_"];
          if(or__3824__auto____6216) {
            return or__3824__auto____6216
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6217 = this$;
      if(and__3822__auto____6217) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6217
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____6218 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6219 = cljs.core._invoke[goog.typeOf(x__2363__auto____6218)];
        if(or__3824__auto____6219) {
          return or__3824__auto____6219
        }else {
          var or__3824__auto____6220 = cljs.core._invoke["_"];
          if(or__3824__auto____6220) {
            return or__3824__auto____6220
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6221 = this$;
      if(and__3822__auto____6221) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6221
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____6222 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6223 = cljs.core._invoke[goog.typeOf(x__2363__auto____6222)];
        if(or__3824__auto____6223) {
          return or__3824__auto____6223
        }else {
          var or__3824__auto____6224 = cljs.core._invoke["_"];
          if(or__3824__auto____6224) {
            return or__3824__auto____6224
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6225 = this$;
      if(and__3822__auto____6225) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6225
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____6226 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6227 = cljs.core._invoke[goog.typeOf(x__2363__auto____6226)];
        if(or__3824__auto____6227) {
          return or__3824__auto____6227
        }else {
          var or__3824__auto____6228 = cljs.core._invoke["_"];
          if(or__3824__auto____6228) {
            return or__3824__auto____6228
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6229 = this$;
      if(and__3822__auto____6229) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6229
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____6230 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6231 = cljs.core._invoke[goog.typeOf(x__2363__auto____6230)];
        if(or__3824__auto____6231) {
          return or__3824__auto____6231
        }else {
          var or__3824__auto____6232 = cljs.core._invoke["_"];
          if(or__3824__auto____6232) {
            return or__3824__auto____6232
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6233 = this$;
      if(and__3822__auto____6233) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6233
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____6234 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6235 = cljs.core._invoke[goog.typeOf(x__2363__auto____6234)];
        if(or__3824__auto____6235) {
          return or__3824__auto____6235
        }else {
          var or__3824__auto____6236 = cljs.core._invoke["_"];
          if(or__3824__auto____6236) {
            return or__3824__auto____6236
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6237 = this$;
      if(and__3822__auto____6237) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6237
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____6238 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6239 = cljs.core._invoke[goog.typeOf(x__2363__auto____6238)];
        if(or__3824__auto____6239) {
          return or__3824__auto____6239
        }else {
          var or__3824__auto____6240 = cljs.core._invoke["_"];
          if(or__3824__auto____6240) {
            return or__3824__auto____6240
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6241 = this$;
      if(and__3822__auto____6241) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6241
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____6242 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6243 = cljs.core._invoke[goog.typeOf(x__2363__auto____6242)];
        if(or__3824__auto____6243) {
          return or__3824__auto____6243
        }else {
          var or__3824__auto____6244 = cljs.core._invoke["_"];
          if(or__3824__auto____6244) {
            return or__3824__auto____6244
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6245 = this$;
      if(and__3822__auto____6245) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6245
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____6246 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6247 = cljs.core._invoke[goog.typeOf(x__2363__auto____6246)];
        if(or__3824__auto____6247) {
          return or__3824__auto____6247
        }else {
          var or__3824__auto____6248 = cljs.core._invoke["_"];
          if(or__3824__auto____6248) {
            return or__3824__auto____6248
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6249 = this$;
      if(and__3822__auto____6249) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6249
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____6250 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6251 = cljs.core._invoke[goog.typeOf(x__2363__auto____6250)];
        if(or__3824__auto____6251) {
          return or__3824__auto____6251
        }else {
          var or__3824__auto____6252 = cljs.core._invoke["_"];
          if(or__3824__auto____6252) {
            return or__3824__auto____6252
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6253 = this$;
      if(and__3822__auto____6253) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6253
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____6254 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6255 = cljs.core._invoke[goog.typeOf(x__2363__auto____6254)];
        if(or__3824__auto____6255) {
          return or__3824__auto____6255
        }else {
          var or__3824__auto____6256 = cljs.core._invoke["_"];
          if(or__3824__auto____6256) {
            return or__3824__auto____6256
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6257 = this$;
      if(and__3822__auto____6257) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6257
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____6258 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6259 = cljs.core._invoke[goog.typeOf(x__2363__auto____6258)];
        if(or__3824__auto____6259) {
          return or__3824__auto____6259
        }else {
          var or__3824__auto____6260 = cljs.core._invoke["_"];
          if(or__3824__auto____6260) {
            return or__3824__auto____6260
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6261 = this$;
      if(and__3822__auto____6261) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6261
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____6262 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6263 = cljs.core._invoke[goog.typeOf(x__2363__auto____6262)];
        if(or__3824__auto____6263) {
          return or__3824__auto____6263
        }else {
          var or__3824__auto____6264 = cljs.core._invoke["_"];
          if(or__3824__auto____6264) {
            return or__3824__auto____6264
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6265 = this$;
      if(and__3822__auto____6265) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6265
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____6266 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6267 = cljs.core._invoke[goog.typeOf(x__2363__auto____6266)];
        if(or__3824__auto____6267) {
          return or__3824__auto____6267
        }else {
          var or__3824__auto____6268 = cljs.core._invoke["_"];
          if(or__3824__auto____6268) {
            return or__3824__auto____6268
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6269 = this$;
      if(and__3822__auto____6269) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6269
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____6270 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6271 = cljs.core._invoke[goog.typeOf(x__2363__auto____6270)];
        if(or__3824__auto____6271) {
          return or__3824__auto____6271
        }else {
          var or__3824__auto____6272 = cljs.core._invoke["_"];
          if(or__3824__auto____6272) {
            return or__3824__auto____6272
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6273 = this$;
      if(and__3822__auto____6273) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6273
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____6274 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6275 = cljs.core._invoke[goog.typeOf(x__2363__auto____6274)];
        if(or__3824__auto____6275) {
          return or__3824__auto____6275
        }else {
          var or__3824__auto____6276 = cljs.core._invoke["_"];
          if(or__3824__auto____6276) {
            return or__3824__auto____6276
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6277 = this$;
      if(and__3822__auto____6277) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6277
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____6278 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6279 = cljs.core._invoke[goog.typeOf(x__2363__auto____6278)];
        if(or__3824__auto____6279) {
          return or__3824__auto____6279
        }else {
          var or__3824__auto____6280 = cljs.core._invoke["_"];
          if(or__3824__auto____6280) {
            return or__3824__auto____6280
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6281 = this$;
      if(and__3822__auto____6281) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6281
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____6282 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6283 = cljs.core._invoke[goog.typeOf(x__2363__auto____6282)];
        if(or__3824__auto____6283) {
          return or__3824__auto____6283
        }else {
          var or__3824__auto____6284 = cljs.core._invoke["_"];
          if(or__3824__auto____6284) {
            return or__3824__auto____6284
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6285 = this$;
      if(and__3822__auto____6285) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6285
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____6286 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6287 = cljs.core._invoke[goog.typeOf(x__2363__auto____6286)];
        if(or__3824__auto____6287) {
          return or__3824__auto____6287
        }else {
          var or__3824__auto____6288 = cljs.core._invoke["_"];
          if(or__3824__auto____6288) {
            return or__3824__auto____6288
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6289 = this$;
      if(and__3822__auto____6289) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6289
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____6290 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6291 = cljs.core._invoke[goog.typeOf(x__2363__auto____6290)];
        if(or__3824__auto____6291) {
          return or__3824__auto____6291
        }else {
          var or__3824__auto____6292 = cljs.core._invoke["_"];
          if(or__3824__auto____6292) {
            return or__3824__auto____6292
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6293 = this$;
      if(and__3822__auto____6293) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6293
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____6294 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6295 = cljs.core._invoke[goog.typeOf(x__2363__auto____6294)];
        if(or__3824__auto____6295) {
          return or__3824__auto____6295
        }else {
          var or__3824__auto____6296 = cljs.core._invoke["_"];
          if(or__3824__auto____6296) {
            return or__3824__auto____6296
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
    var and__3822__auto____6301 = coll;
    if(and__3822__auto____6301) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6301
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____6302 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6303 = cljs.core._count[goog.typeOf(x__2363__auto____6302)];
      if(or__3824__auto____6303) {
        return or__3824__auto____6303
      }else {
        var or__3824__auto____6304 = cljs.core._count["_"];
        if(or__3824__auto____6304) {
          return or__3824__auto____6304
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
    var and__3822__auto____6309 = coll;
    if(and__3822__auto____6309) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6309
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____6310 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6311 = cljs.core._empty[goog.typeOf(x__2363__auto____6310)];
      if(or__3824__auto____6311) {
        return or__3824__auto____6311
      }else {
        var or__3824__auto____6312 = cljs.core._empty["_"];
        if(or__3824__auto____6312) {
          return or__3824__auto____6312
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
    var and__3822__auto____6317 = coll;
    if(and__3822__auto____6317) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6317
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____6318 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6319 = cljs.core._conj[goog.typeOf(x__2363__auto____6318)];
      if(or__3824__auto____6319) {
        return or__3824__auto____6319
      }else {
        var or__3824__auto____6320 = cljs.core._conj["_"];
        if(or__3824__auto____6320) {
          return or__3824__auto____6320
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
      var and__3822__auto____6329 = coll;
      if(and__3822__auto____6329) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6329
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____6330 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6331 = cljs.core._nth[goog.typeOf(x__2363__auto____6330)];
        if(or__3824__auto____6331) {
          return or__3824__auto____6331
        }else {
          var or__3824__auto____6332 = cljs.core._nth["_"];
          if(or__3824__auto____6332) {
            return or__3824__auto____6332
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6333 = coll;
      if(and__3822__auto____6333) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6333
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____6334 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6335 = cljs.core._nth[goog.typeOf(x__2363__auto____6334)];
        if(or__3824__auto____6335) {
          return or__3824__auto____6335
        }else {
          var or__3824__auto____6336 = cljs.core._nth["_"];
          if(or__3824__auto____6336) {
            return or__3824__auto____6336
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
    var and__3822__auto____6341 = coll;
    if(and__3822__auto____6341) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6341
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____6342 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6343 = cljs.core._first[goog.typeOf(x__2363__auto____6342)];
      if(or__3824__auto____6343) {
        return or__3824__auto____6343
      }else {
        var or__3824__auto____6344 = cljs.core._first["_"];
        if(or__3824__auto____6344) {
          return or__3824__auto____6344
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6349 = coll;
    if(and__3822__auto____6349) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6349
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____6350 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6351 = cljs.core._rest[goog.typeOf(x__2363__auto____6350)];
      if(or__3824__auto____6351) {
        return or__3824__auto____6351
      }else {
        var or__3824__auto____6352 = cljs.core._rest["_"];
        if(or__3824__auto____6352) {
          return or__3824__auto____6352
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
    var and__3822__auto____6357 = coll;
    if(and__3822__auto____6357) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6357
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____6358 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6359 = cljs.core._next[goog.typeOf(x__2363__auto____6358)];
      if(or__3824__auto____6359) {
        return or__3824__auto____6359
      }else {
        var or__3824__auto____6360 = cljs.core._next["_"];
        if(or__3824__auto____6360) {
          return or__3824__auto____6360
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
      var and__3822__auto____6369 = o;
      if(and__3822__auto____6369) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6369
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____6370 = o == null ? null : o;
      return function() {
        var or__3824__auto____6371 = cljs.core._lookup[goog.typeOf(x__2363__auto____6370)];
        if(or__3824__auto____6371) {
          return or__3824__auto____6371
        }else {
          var or__3824__auto____6372 = cljs.core._lookup["_"];
          if(or__3824__auto____6372) {
            return or__3824__auto____6372
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6373 = o;
      if(and__3822__auto____6373) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6373
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____6374 = o == null ? null : o;
      return function() {
        var or__3824__auto____6375 = cljs.core._lookup[goog.typeOf(x__2363__auto____6374)];
        if(or__3824__auto____6375) {
          return or__3824__auto____6375
        }else {
          var or__3824__auto____6376 = cljs.core._lookup["_"];
          if(or__3824__auto____6376) {
            return or__3824__auto____6376
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
    var and__3822__auto____6381 = coll;
    if(and__3822__auto____6381) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6381
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____6382 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6383 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____6382)];
      if(or__3824__auto____6383) {
        return or__3824__auto____6383
      }else {
        var or__3824__auto____6384 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6384) {
          return or__3824__auto____6384
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6389 = coll;
    if(and__3822__auto____6389) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6389
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____6390 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6391 = cljs.core._assoc[goog.typeOf(x__2363__auto____6390)];
      if(or__3824__auto____6391) {
        return or__3824__auto____6391
      }else {
        var or__3824__auto____6392 = cljs.core._assoc["_"];
        if(or__3824__auto____6392) {
          return or__3824__auto____6392
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
    var and__3822__auto____6397 = coll;
    if(and__3822__auto____6397) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6397
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____6398 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6399 = cljs.core._dissoc[goog.typeOf(x__2363__auto____6398)];
      if(or__3824__auto____6399) {
        return or__3824__auto____6399
      }else {
        var or__3824__auto____6400 = cljs.core._dissoc["_"];
        if(or__3824__auto____6400) {
          return or__3824__auto____6400
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
    var and__3822__auto____6405 = coll;
    if(and__3822__auto____6405) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6405
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____6406 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6407 = cljs.core._key[goog.typeOf(x__2363__auto____6406)];
      if(or__3824__auto____6407) {
        return or__3824__auto____6407
      }else {
        var or__3824__auto____6408 = cljs.core._key["_"];
        if(or__3824__auto____6408) {
          return or__3824__auto____6408
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6413 = coll;
    if(and__3822__auto____6413) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6413
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____6414 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6415 = cljs.core._val[goog.typeOf(x__2363__auto____6414)];
      if(or__3824__auto____6415) {
        return or__3824__auto____6415
      }else {
        var or__3824__auto____6416 = cljs.core._val["_"];
        if(or__3824__auto____6416) {
          return or__3824__auto____6416
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
    var and__3822__auto____6421 = coll;
    if(and__3822__auto____6421) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6421
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____6422 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6423 = cljs.core._disjoin[goog.typeOf(x__2363__auto____6422)];
      if(or__3824__auto____6423) {
        return or__3824__auto____6423
      }else {
        var or__3824__auto____6424 = cljs.core._disjoin["_"];
        if(or__3824__auto____6424) {
          return or__3824__auto____6424
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
    var and__3822__auto____6429 = coll;
    if(and__3822__auto____6429) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6429
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____6430 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6431 = cljs.core._peek[goog.typeOf(x__2363__auto____6430)];
      if(or__3824__auto____6431) {
        return or__3824__auto____6431
      }else {
        var or__3824__auto____6432 = cljs.core._peek["_"];
        if(or__3824__auto____6432) {
          return or__3824__auto____6432
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6437 = coll;
    if(and__3822__auto____6437) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6437
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____6438 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6439 = cljs.core._pop[goog.typeOf(x__2363__auto____6438)];
      if(or__3824__auto____6439) {
        return or__3824__auto____6439
      }else {
        var or__3824__auto____6440 = cljs.core._pop["_"];
        if(or__3824__auto____6440) {
          return or__3824__auto____6440
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
    var and__3822__auto____6445 = coll;
    if(and__3822__auto____6445) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6445
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____6446 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6447 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____6446)];
      if(or__3824__auto____6447) {
        return or__3824__auto____6447
      }else {
        var or__3824__auto____6448 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6448) {
          return or__3824__auto____6448
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
    var and__3822__auto____6453 = o;
    if(and__3822__auto____6453) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6453
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____6454 = o == null ? null : o;
    return function() {
      var or__3824__auto____6455 = cljs.core._deref[goog.typeOf(x__2363__auto____6454)];
      if(or__3824__auto____6455) {
        return or__3824__auto____6455
      }else {
        var or__3824__auto____6456 = cljs.core._deref["_"];
        if(or__3824__auto____6456) {
          return or__3824__auto____6456
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
    var and__3822__auto____6461 = o;
    if(and__3822__auto____6461) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6461
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____6462 = o == null ? null : o;
    return function() {
      var or__3824__auto____6463 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____6462)];
      if(or__3824__auto____6463) {
        return or__3824__auto____6463
      }else {
        var or__3824__auto____6464 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6464) {
          return or__3824__auto____6464
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
    var and__3822__auto____6469 = o;
    if(and__3822__auto____6469) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6469
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____6470 = o == null ? null : o;
    return function() {
      var or__3824__auto____6471 = cljs.core._meta[goog.typeOf(x__2363__auto____6470)];
      if(or__3824__auto____6471) {
        return or__3824__auto____6471
      }else {
        var or__3824__auto____6472 = cljs.core._meta["_"];
        if(or__3824__auto____6472) {
          return or__3824__auto____6472
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
    var and__3822__auto____6477 = o;
    if(and__3822__auto____6477) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6477
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____6478 = o == null ? null : o;
    return function() {
      var or__3824__auto____6479 = cljs.core._with_meta[goog.typeOf(x__2363__auto____6478)];
      if(or__3824__auto____6479) {
        return or__3824__auto____6479
      }else {
        var or__3824__auto____6480 = cljs.core._with_meta["_"];
        if(or__3824__auto____6480) {
          return or__3824__auto____6480
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
      var and__3822__auto____6489 = coll;
      if(and__3822__auto____6489) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6489
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____6490 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6491 = cljs.core._reduce[goog.typeOf(x__2363__auto____6490)];
        if(or__3824__auto____6491) {
          return or__3824__auto____6491
        }else {
          var or__3824__auto____6492 = cljs.core._reduce["_"];
          if(or__3824__auto____6492) {
            return or__3824__auto____6492
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6493 = coll;
      if(and__3822__auto____6493) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6493
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____6494 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6495 = cljs.core._reduce[goog.typeOf(x__2363__auto____6494)];
        if(or__3824__auto____6495) {
          return or__3824__auto____6495
        }else {
          var or__3824__auto____6496 = cljs.core._reduce["_"];
          if(or__3824__auto____6496) {
            return or__3824__auto____6496
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
    var and__3822__auto____6501 = coll;
    if(and__3822__auto____6501) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6501
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____6502 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6503 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____6502)];
      if(or__3824__auto____6503) {
        return or__3824__auto____6503
      }else {
        var or__3824__auto____6504 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6504) {
          return or__3824__auto____6504
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
    var and__3822__auto____6509 = o;
    if(and__3822__auto____6509) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6509
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____6510 = o == null ? null : o;
    return function() {
      var or__3824__auto____6511 = cljs.core._equiv[goog.typeOf(x__2363__auto____6510)];
      if(or__3824__auto____6511) {
        return or__3824__auto____6511
      }else {
        var or__3824__auto____6512 = cljs.core._equiv["_"];
        if(or__3824__auto____6512) {
          return or__3824__auto____6512
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
    var and__3822__auto____6517 = o;
    if(and__3822__auto____6517) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6517
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____6518 = o == null ? null : o;
    return function() {
      var or__3824__auto____6519 = cljs.core._hash[goog.typeOf(x__2363__auto____6518)];
      if(or__3824__auto____6519) {
        return or__3824__auto____6519
      }else {
        var or__3824__auto____6520 = cljs.core._hash["_"];
        if(or__3824__auto____6520) {
          return or__3824__auto____6520
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
    var and__3822__auto____6525 = o;
    if(and__3822__auto____6525) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6525
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____6526 = o == null ? null : o;
    return function() {
      var or__3824__auto____6527 = cljs.core._seq[goog.typeOf(x__2363__auto____6526)];
      if(or__3824__auto____6527) {
        return or__3824__auto____6527
      }else {
        var or__3824__auto____6528 = cljs.core._seq["_"];
        if(or__3824__auto____6528) {
          return or__3824__auto____6528
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
    var and__3822__auto____6533 = coll;
    if(and__3822__auto____6533) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6533
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____6534 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6535 = cljs.core._rseq[goog.typeOf(x__2363__auto____6534)];
      if(or__3824__auto____6535) {
        return or__3824__auto____6535
      }else {
        var or__3824__auto____6536 = cljs.core._rseq["_"];
        if(or__3824__auto____6536) {
          return or__3824__auto____6536
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
    var and__3822__auto____6541 = coll;
    if(and__3822__auto____6541) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6541
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____6542 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6543 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____6542)];
      if(or__3824__auto____6543) {
        return or__3824__auto____6543
      }else {
        var or__3824__auto____6544 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6544) {
          return or__3824__auto____6544
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6549 = coll;
    if(and__3822__auto____6549) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6549
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____6550 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6551 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____6550)];
      if(or__3824__auto____6551) {
        return or__3824__auto____6551
      }else {
        var or__3824__auto____6552 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6552) {
          return or__3824__auto____6552
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6557 = coll;
    if(and__3822__auto____6557) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6557
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____6558 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6559 = cljs.core._entry_key[goog.typeOf(x__2363__auto____6558)];
      if(or__3824__auto____6559) {
        return or__3824__auto____6559
      }else {
        var or__3824__auto____6560 = cljs.core._entry_key["_"];
        if(or__3824__auto____6560) {
          return or__3824__auto____6560
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6565 = coll;
    if(and__3822__auto____6565) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6565
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____6566 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6567 = cljs.core._comparator[goog.typeOf(x__2363__auto____6566)];
      if(or__3824__auto____6567) {
        return or__3824__auto____6567
      }else {
        var or__3824__auto____6568 = cljs.core._comparator["_"];
        if(or__3824__auto____6568) {
          return or__3824__auto____6568
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
    var and__3822__auto____6573 = o;
    if(and__3822__auto____6573) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6573
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____6574 = o == null ? null : o;
    return function() {
      var or__3824__auto____6575 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____6574)];
      if(or__3824__auto____6575) {
        return or__3824__auto____6575
      }else {
        var or__3824__auto____6576 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6576) {
          return or__3824__auto____6576
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
    var and__3822__auto____6581 = d;
    if(and__3822__auto____6581) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6581
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____6582 = d == null ? null : d;
    return function() {
      var or__3824__auto____6583 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____6582)];
      if(or__3824__auto____6583) {
        return or__3824__auto____6583
      }else {
        var or__3824__auto____6584 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6584) {
          return or__3824__auto____6584
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
    var and__3822__auto____6589 = this$;
    if(and__3822__auto____6589) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6589
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____6590 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6591 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____6590)];
      if(or__3824__auto____6591) {
        return or__3824__auto____6591
      }else {
        var or__3824__auto____6592 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6592) {
          return or__3824__auto____6592
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6597 = this$;
    if(and__3822__auto____6597) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6597
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____6598 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6599 = cljs.core._add_watch[goog.typeOf(x__2363__auto____6598)];
      if(or__3824__auto____6599) {
        return or__3824__auto____6599
      }else {
        var or__3824__auto____6600 = cljs.core._add_watch["_"];
        if(or__3824__auto____6600) {
          return or__3824__auto____6600
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6605 = this$;
    if(and__3822__auto____6605) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6605
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____6606 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6607 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____6606)];
      if(or__3824__auto____6607) {
        return or__3824__auto____6607
      }else {
        var or__3824__auto____6608 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6608) {
          return or__3824__auto____6608
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
    var and__3822__auto____6613 = coll;
    if(and__3822__auto____6613) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6613
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____6614 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6615 = cljs.core._as_transient[goog.typeOf(x__2363__auto____6614)];
      if(or__3824__auto____6615) {
        return or__3824__auto____6615
      }else {
        var or__3824__auto____6616 = cljs.core._as_transient["_"];
        if(or__3824__auto____6616) {
          return or__3824__auto____6616
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
    var and__3822__auto____6621 = tcoll;
    if(and__3822__auto____6621) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6621
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____6622 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6623 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____6622)];
      if(or__3824__auto____6623) {
        return or__3824__auto____6623
      }else {
        var or__3824__auto____6624 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6624) {
          return or__3824__auto____6624
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6629 = tcoll;
    if(and__3822__auto____6629) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6629
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6630 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6631 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____6630)];
      if(or__3824__auto____6631) {
        return or__3824__auto____6631
      }else {
        var or__3824__auto____6632 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6632) {
          return or__3824__auto____6632
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
    var and__3822__auto____6637 = tcoll;
    if(and__3822__auto____6637) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6637
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____6638 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6639 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____6638)];
      if(or__3824__auto____6639) {
        return or__3824__auto____6639
      }else {
        var or__3824__auto____6640 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6640) {
          return or__3824__auto____6640
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
    var and__3822__auto____6645 = tcoll;
    if(and__3822__auto____6645) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6645
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____6646 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6647 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____6646)];
      if(or__3824__auto____6647) {
        return or__3824__auto____6647
      }else {
        var or__3824__auto____6648 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6648) {
          return or__3824__auto____6648
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
    var and__3822__auto____6653 = tcoll;
    if(and__3822__auto____6653) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6653
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____6654 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6655 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____6654)];
      if(or__3824__auto____6655) {
        return or__3824__auto____6655
      }else {
        var or__3824__auto____6656 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6656) {
          return or__3824__auto____6656
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6661 = tcoll;
    if(and__3822__auto____6661) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6661
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6662 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6663 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____6662)];
      if(or__3824__auto____6663) {
        return or__3824__auto____6663
      }else {
        var or__3824__auto____6664 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6664) {
          return or__3824__auto____6664
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
    var and__3822__auto____6669 = tcoll;
    if(and__3822__auto____6669) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6669
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____6670 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6671 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____6670)];
      if(or__3824__auto____6671) {
        return or__3824__auto____6671
      }else {
        var or__3824__auto____6672 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6672) {
          return or__3824__auto____6672
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
    var and__3822__auto____6677 = x;
    if(and__3822__auto____6677) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6677
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____6678 = x == null ? null : x;
    return function() {
      var or__3824__auto____6679 = cljs.core._compare[goog.typeOf(x__2363__auto____6678)];
      if(or__3824__auto____6679) {
        return or__3824__auto____6679
      }else {
        var or__3824__auto____6680 = cljs.core._compare["_"];
        if(or__3824__auto____6680) {
          return or__3824__auto____6680
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
    var and__3822__auto____6685 = coll;
    if(and__3822__auto____6685) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6685
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____6686 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6687 = cljs.core._drop_first[goog.typeOf(x__2363__auto____6686)];
      if(or__3824__auto____6687) {
        return or__3824__auto____6687
      }else {
        var or__3824__auto____6688 = cljs.core._drop_first["_"];
        if(or__3824__auto____6688) {
          return or__3824__auto____6688
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
    var and__3822__auto____6693 = coll;
    if(and__3822__auto____6693) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6693
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____6694 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6695 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____6694)];
      if(or__3824__auto____6695) {
        return or__3824__auto____6695
      }else {
        var or__3824__auto____6696 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6696) {
          return or__3824__auto____6696
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6701 = coll;
    if(and__3822__auto____6701) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6701
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____6702 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6703 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____6702)];
      if(or__3824__auto____6703) {
        return or__3824__auto____6703
      }else {
        var or__3824__auto____6704 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6704) {
          return or__3824__auto____6704
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
    var and__3822__auto____6709 = coll;
    if(and__3822__auto____6709) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6709
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____6710 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6711 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____6710)];
      if(or__3824__auto____6711) {
        return or__3824__auto____6711
      }else {
        var or__3824__auto____6712 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6712) {
          return or__3824__auto____6712
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
    var or__3824__auto____6714 = x === y;
    if(or__3824__auto____6714) {
      return or__3824__auto____6714
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6715__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6716 = y;
            var G__6717 = cljs.core.first.call(null, more);
            var G__6718 = cljs.core.next.call(null, more);
            x = G__6716;
            y = G__6717;
            more = G__6718;
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
    var G__6715 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6715__delegate.call(this, x, y, more)
    };
    G__6715.cljs$lang$maxFixedArity = 2;
    G__6715.cljs$lang$applyTo = function(arglist__6719) {
      var x = cljs.core.first(arglist__6719);
      var y = cljs.core.first(cljs.core.next(arglist__6719));
      var more = cljs.core.rest(cljs.core.next(arglist__6719));
      return G__6715__delegate(x, y, more)
    };
    G__6715.cljs$lang$arity$variadic = G__6715__delegate;
    return G__6715
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
  var G__6720 = null;
  var G__6720__2 = function(o, k) {
    return null
  };
  var G__6720__3 = function(o, k, not_found) {
    return not_found
  };
  G__6720 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6720__2.call(this, o, k);
      case 3:
        return G__6720__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6720
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
  var G__6721 = null;
  var G__6721__2 = function(_, f) {
    return f.call(null)
  };
  var G__6721__3 = function(_, f, start) {
    return start
  };
  G__6721 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6721__2.call(this, _, f);
      case 3:
        return G__6721__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6721
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
  var G__6722 = null;
  var G__6722__2 = function(_, n) {
    return null
  };
  var G__6722__3 = function(_, n, not_found) {
    return not_found
  };
  G__6722 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6722__2.call(this, _, n);
      case 3:
        return G__6722__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6722
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
  var and__3822__auto____6723 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6723) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6723
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
    var cnt__6736 = cljs.core._count.call(null, cicoll);
    if(cnt__6736 === 0) {
      return f.call(null)
    }else {
      var val__6737 = cljs.core._nth.call(null, cicoll, 0);
      var n__6738 = 1;
      while(true) {
        if(n__6738 < cnt__6736) {
          var nval__6739 = f.call(null, val__6737, cljs.core._nth.call(null, cicoll, n__6738));
          if(cljs.core.reduced_QMARK_.call(null, nval__6739)) {
            return cljs.core.deref.call(null, nval__6739)
          }else {
            var G__6748 = nval__6739;
            var G__6749 = n__6738 + 1;
            val__6737 = G__6748;
            n__6738 = G__6749;
            continue
          }
        }else {
          return val__6737
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6740 = cljs.core._count.call(null, cicoll);
    var val__6741 = val;
    var n__6742 = 0;
    while(true) {
      if(n__6742 < cnt__6740) {
        var nval__6743 = f.call(null, val__6741, cljs.core._nth.call(null, cicoll, n__6742));
        if(cljs.core.reduced_QMARK_.call(null, nval__6743)) {
          return cljs.core.deref.call(null, nval__6743)
        }else {
          var G__6750 = nval__6743;
          var G__6751 = n__6742 + 1;
          val__6741 = G__6750;
          n__6742 = G__6751;
          continue
        }
      }else {
        return val__6741
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6744 = cljs.core._count.call(null, cicoll);
    var val__6745 = val;
    var n__6746 = idx;
    while(true) {
      if(n__6746 < cnt__6744) {
        var nval__6747 = f.call(null, val__6745, cljs.core._nth.call(null, cicoll, n__6746));
        if(cljs.core.reduced_QMARK_.call(null, nval__6747)) {
          return cljs.core.deref.call(null, nval__6747)
        }else {
          var G__6752 = nval__6747;
          var G__6753 = n__6746 + 1;
          val__6745 = G__6752;
          n__6746 = G__6753;
          continue
        }
      }else {
        return val__6745
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
    var cnt__6766 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6767 = arr[0];
      var n__6768 = 1;
      while(true) {
        if(n__6768 < cnt__6766) {
          var nval__6769 = f.call(null, val__6767, arr[n__6768]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6769)) {
            return cljs.core.deref.call(null, nval__6769)
          }else {
            var G__6778 = nval__6769;
            var G__6779 = n__6768 + 1;
            val__6767 = G__6778;
            n__6768 = G__6779;
            continue
          }
        }else {
          return val__6767
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6770 = arr.length;
    var val__6771 = val;
    var n__6772 = 0;
    while(true) {
      if(n__6772 < cnt__6770) {
        var nval__6773 = f.call(null, val__6771, arr[n__6772]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6773)) {
          return cljs.core.deref.call(null, nval__6773)
        }else {
          var G__6780 = nval__6773;
          var G__6781 = n__6772 + 1;
          val__6771 = G__6780;
          n__6772 = G__6781;
          continue
        }
      }else {
        return val__6771
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6774 = arr.length;
    var val__6775 = val;
    var n__6776 = idx;
    while(true) {
      if(n__6776 < cnt__6774) {
        var nval__6777 = f.call(null, val__6775, arr[n__6776]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6777)) {
          return cljs.core.deref.call(null, nval__6777)
        }else {
          var G__6782 = nval__6777;
          var G__6783 = n__6776 + 1;
          val__6775 = G__6782;
          n__6776 = G__6783;
          continue
        }
      }else {
        return val__6775
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
  var this__6784 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6785 = this;
  if(this__6785.i + 1 < this__6785.a.length) {
    return new cljs.core.IndexedSeq(this__6785.a, this__6785.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6786 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6787 = this;
  var c__6788 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6788 > 0) {
    return new cljs.core.RSeq(coll, c__6788 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6789 = this;
  var this__6790 = this;
  return cljs.core.pr_str.call(null, this__6790)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6791 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6791.a)) {
    return cljs.core.ci_reduce.call(null, this__6791.a, f, this__6791.a[this__6791.i], this__6791.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6791.a[this__6791.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6792 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6792.a)) {
    return cljs.core.ci_reduce.call(null, this__6792.a, f, start, this__6792.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6793 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6794 = this;
  return this__6794.a.length - this__6794.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6795 = this;
  return this__6795.a[this__6795.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6796 = this;
  if(this__6796.i + 1 < this__6796.a.length) {
    return new cljs.core.IndexedSeq(this__6796.a, this__6796.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6797 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6798 = this;
  var i__6799 = n + this__6798.i;
  if(i__6799 < this__6798.a.length) {
    return this__6798.a[i__6799]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6800 = this;
  var i__6801 = n + this__6800.i;
  if(i__6801 < this__6800.a.length) {
    return this__6800.a[i__6801]
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
  var G__6802 = null;
  var G__6802__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6802__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6802 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6802__2.call(this, array, f);
      case 3:
        return G__6802__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6802
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6803 = null;
  var G__6803__2 = function(array, k) {
    return array[k]
  };
  var G__6803__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6803 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6803__2.call(this, array, k);
      case 3:
        return G__6803__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6803
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6804 = null;
  var G__6804__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6804__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6804 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6804__2.call(this, array, n);
      case 3:
        return G__6804__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6804
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
  var this__6805 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6806 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6807 = this;
  var this__6808 = this;
  return cljs.core.pr_str.call(null, this__6808)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6809 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6810 = this;
  return this__6810.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6811 = this;
  return cljs.core._nth.call(null, this__6811.ci, this__6811.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6812 = this;
  if(this__6812.i > 0) {
    return new cljs.core.RSeq(this__6812.ci, this__6812.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6813 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6814 = this;
  return new cljs.core.RSeq(this__6814.ci, this__6814.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6815 = this;
  return this__6815.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6819__6820 = coll;
      if(G__6819__6820) {
        if(function() {
          var or__3824__auto____6821 = G__6819__6820.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6821) {
            return or__3824__auto____6821
          }else {
            return G__6819__6820.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6819__6820.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6819__6820)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6819__6820)
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
      var G__6826__6827 = coll;
      if(G__6826__6827) {
        if(function() {
          var or__3824__auto____6828 = G__6826__6827.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6828) {
            return or__3824__auto____6828
          }else {
            return G__6826__6827.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6826__6827.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6826__6827)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6826__6827)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6829 = cljs.core.seq.call(null, coll);
      if(s__6829 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6829)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6834__6835 = coll;
      if(G__6834__6835) {
        if(function() {
          var or__3824__auto____6836 = G__6834__6835.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6836) {
            return or__3824__auto____6836
          }else {
            return G__6834__6835.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6834__6835.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6834__6835)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6834__6835)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6837 = cljs.core.seq.call(null, coll);
      if(!(s__6837 == null)) {
        return cljs.core._rest.call(null, s__6837)
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
      var G__6841__6842 = coll;
      if(G__6841__6842) {
        if(function() {
          var or__3824__auto____6843 = G__6841__6842.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6843) {
            return or__3824__auto____6843
          }else {
            return G__6841__6842.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6841__6842.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6841__6842)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6841__6842)
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
    var sn__6845 = cljs.core.next.call(null, s);
    if(!(sn__6845 == null)) {
      var G__6846 = sn__6845;
      s = G__6846;
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
    var G__6847__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6848 = conj.call(null, coll, x);
          var G__6849 = cljs.core.first.call(null, xs);
          var G__6850 = cljs.core.next.call(null, xs);
          coll = G__6848;
          x = G__6849;
          xs = G__6850;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6847 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6847__delegate.call(this, coll, x, xs)
    };
    G__6847.cljs$lang$maxFixedArity = 2;
    G__6847.cljs$lang$applyTo = function(arglist__6851) {
      var coll = cljs.core.first(arglist__6851);
      var x = cljs.core.first(cljs.core.next(arglist__6851));
      var xs = cljs.core.rest(cljs.core.next(arglist__6851));
      return G__6847__delegate(coll, x, xs)
    };
    G__6847.cljs$lang$arity$variadic = G__6847__delegate;
    return G__6847
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
  var s__6854 = cljs.core.seq.call(null, coll);
  var acc__6855 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6854)) {
      return acc__6855 + cljs.core._count.call(null, s__6854)
    }else {
      var G__6856 = cljs.core.next.call(null, s__6854);
      var G__6857 = acc__6855 + 1;
      s__6854 = G__6856;
      acc__6855 = G__6857;
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
        var G__6864__6865 = coll;
        if(G__6864__6865) {
          if(function() {
            var or__3824__auto____6866 = G__6864__6865.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6866) {
              return or__3824__auto____6866
            }else {
              return G__6864__6865.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6864__6865.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6864__6865)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6864__6865)
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
        var G__6867__6868 = coll;
        if(G__6867__6868) {
          if(function() {
            var or__3824__auto____6869 = G__6867__6868.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6869) {
              return or__3824__auto____6869
            }else {
              return G__6867__6868.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6867__6868.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6867__6868)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6867__6868)
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
    var G__6872__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6871 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6873 = ret__6871;
          var G__6874 = cljs.core.first.call(null, kvs);
          var G__6875 = cljs.core.second.call(null, kvs);
          var G__6876 = cljs.core.nnext.call(null, kvs);
          coll = G__6873;
          k = G__6874;
          v = G__6875;
          kvs = G__6876;
          continue
        }else {
          return ret__6871
        }
        break
      }
    };
    var G__6872 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6872__delegate.call(this, coll, k, v, kvs)
    };
    G__6872.cljs$lang$maxFixedArity = 3;
    G__6872.cljs$lang$applyTo = function(arglist__6877) {
      var coll = cljs.core.first(arglist__6877);
      var k = cljs.core.first(cljs.core.next(arglist__6877));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6877)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6877)));
      return G__6872__delegate(coll, k, v, kvs)
    };
    G__6872.cljs$lang$arity$variadic = G__6872__delegate;
    return G__6872
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
    var G__6880__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6879 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6881 = ret__6879;
          var G__6882 = cljs.core.first.call(null, ks);
          var G__6883 = cljs.core.next.call(null, ks);
          coll = G__6881;
          k = G__6882;
          ks = G__6883;
          continue
        }else {
          return ret__6879
        }
        break
      }
    };
    var G__6880 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6880__delegate.call(this, coll, k, ks)
    };
    G__6880.cljs$lang$maxFixedArity = 2;
    G__6880.cljs$lang$applyTo = function(arglist__6884) {
      var coll = cljs.core.first(arglist__6884);
      var k = cljs.core.first(cljs.core.next(arglist__6884));
      var ks = cljs.core.rest(cljs.core.next(arglist__6884));
      return G__6880__delegate(coll, k, ks)
    };
    G__6880.cljs$lang$arity$variadic = G__6880__delegate;
    return G__6880
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
    var G__6888__6889 = o;
    if(G__6888__6889) {
      if(function() {
        var or__3824__auto____6890 = G__6888__6889.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6890) {
          return or__3824__auto____6890
        }else {
          return G__6888__6889.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6888__6889.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6888__6889)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6888__6889)
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
    var G__6893__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6892 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6894 = ret__6892;
          var G__6895 = cljs.core.first.call(null, ks);
          var G__6896 = cljs.core.next.call(null, ks);
          coll = G__6894;
          k = G__6895;
          ks = G__6896;
          continue
        }else {
          return ret__6892
        }
        break
      }
    };
    var G__6893 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6893__delegate.call(this, coll, k, ks)
    };
    G__6893.cljs$lang$maxFixedArity = 2;
    G__6893.cljs$lang$applyTo = function(arglist__6897) {
      var coll = cljs.core.first(arglist__6897);
      var k = cljs.core.first(cljs.core.next(arglist__6897));
      var ks = cljs.core.rest(cljs.core.next(arglist__6897));
      return G__6893__delegate(coll, k, ks)
    };
    G__6893.cljs$lang$arity$variadic = G__6893__delegate;
    return G__6893
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
  var h__6899 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6899;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6899
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6901 = cljs.core.string_hash_cache[k];
  if(!(h__6901 == null)) {
    return h__6901
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
      var and__3822__auto____6903 = goog.isString(o);
      if(and__3822__auto____6903) {
        return check_cache
      }else {
        return and__3822__auto____6903
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
    var G__6907__6908 = x;
    if(G__6907__6908) {
      if(function() {
        var or__3824__auto____6909 = G__6907__6908.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6909) {
          return or__3824__auto____6909
        }else {
          return G__6907__6908.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6907__6908.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6907__6908)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6907__6908)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6913__6914 = x;
    if(G__6913__6914) {
      if(function() {
        var or__3824__auto____6915 = G__6913__6914.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6915) {
          return or__3824__auto____6915
        }else {
          return G__6913__6914.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6913__6914.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6913__6914)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6913__6914)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6919__6920 = x;
  if(G__6919__6920) {
    if(function() {
      var or__3824__auto____6921 = G__6919__6920.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6921) {
        return or__3824__auto____6921
      }else {
        return G__6919__6920.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6919__6920.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6919__6920)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6919__6920)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6925__6926 = x;
  if(G__6925__6926) {
    if(function() {
      var or__3824__auto____6927 = G__6925__6926.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6927) {
        return or__3824__auto____6927
      }else {
        return G__6925__6926.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6925__6926.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6925__6926)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6925__6926)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6931__6932 = x;
  if(G__6931__6932) {
    if(function() {
      var or__3824__auto____6933 = G__6931__6932.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6933) {
        return or__3824__auto____6933
      }else {
        return G__6931__6932.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6931__6932.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6931__6932)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6931__6932)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6937__6938 = x;
  if(G__6937__6938) {
    if(function() {
      var or__3824__auto____6939 = G__6937__6938.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6939) {
        return or__3824__auto____6939
      }else {
        return G__6937__6938.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6937__6938.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6937__6938)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6937__6938)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6943__6944 = x;
  if(G__6943__6944) {
    if(function() {
      var or__3824__auto____6945 = G__6943__6944.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6945) {
        return or__3824__auto____6945
      }else {
        return G__6943__6944.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6943__6944.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6943__6944)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6943__6944)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6949__6950 = x;
    if(G__6949__6950) {
      if(function() {
        var or__3824__auto____6951 = G__6949__6950.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6951) {
          return or__3824__auto____6951
        }else {
          return G__6949__6950.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6949__6950.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6949__6950)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6949__6950)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6955__6956 = x;
  if(G__6955__6956) {
    if(function() {
      var or__3824__auto____6957 = G__6955__6956.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6957) {
        return or__3824__auto____6957
      }else {
        return G__6955__6956.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6955__6956.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6955__6956)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6955__6956)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6961__6962 = x;
  if(G__6961__6962) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6963 = null;
      if(cljs.core.truth_(or__3824__auto____6963)) {
        return or__3824__auto____6963
      }else {
        return G__6961__6962.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6961__6962.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6961__6962)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6961__6962)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6964__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6964 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6964__delegate.call(this, keyvals)
    };
    G__6964.cljs$lang$maxFixedArity = 0;
    G__6964.cljs$lang$applyTo = function(arglist__6965) {
      var keyvals = cljs.core.seq(arglist__6965);
      return G__6964__delegate(keyvals)
    };
    G__6964.cljs$lang$arity$variadic = G__6964__delegate;
    return G__6964
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
  var keys__6967 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6967.push(key)
  });
  return keys__6967
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6971 = i;
  var j__6972 = j;
  var len__6973 = len;
  while(true) {
    if(len__6973 === 0) {
      return to
    }else {
      to[j__6972] = from[i__6971];
      var G__6974 = i__6971 + 1;
      var G__6975 = j__6972 + 1;
      var G__6976 = len__6973 - 1;
      i__6971 = G__6974;
      j__6972 = G__6975;
      len__6973 = G__6976;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6980 = i + (len - 1);
  var j__6981 = j + (len - 1);
  var len__6982 = len;
  while(true) {
    if(len__6982 === 0) {
      return to
    }else {
      to[j__6981] = from[i__6980];
      var G__6983 = i__6980 - 1;
      var G__6984 = j__6981 - 1;
      var G__6985 = len__6982 - 1;
      i__6980 = G__6983;
      j__6981 = G__6984;
      len__6982 = G__6985;
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
    var G__6989__6990 = s;
    if(G__6989__6990) {
      if(function() {
        var or__3824__auto____6991 = G__6989__6990.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____6991) {
          return or__3824__auto____6991
        }else {
          return G__6989__6990.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6989__6990.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6989__6990)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6989__6990)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6995__6996 = s;
  if(G__6995__6996) {
    if(function() {
      var or__3824__auto____6997 = G__6995__6996.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____6997) {
        return or__3824__auto____6997
      }else {
        return G__6995__6996.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6995__6996.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6995__6996)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6995__6996)
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
  var and__3822__auto____7000 = goog.isString(x);
  if(and__3822__auto____7000) {
    return!function() {
      var or__3824__auto____7001 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7001) {
        return or__3824__auto____7001
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7000
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7003 = goog.isString(x);
  if(and__3822__auto____7003) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7003
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7005 = goog.isString(x);
  if(and__3822__auto____7005) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7005
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7010 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7010) {
    return or__3824__auto____7010
  }else {
    var G__7011__7012 = f;
    if(G__7011__7012) {
      if(function() {
        var or__3824__auto____7013 = G__7011__7012.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7013) {
          return or__3824__auto____7013
        }else {
          return G__7011__7012.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7011__7012.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7011__7012)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7011__7012)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7015 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7015) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7015
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
    var and__3822__auto____7018 = coll;
    if(cljs.core.truth_(and__3822__auto____7018)) {
      var and__3822__auto____7019 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7019) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7019
      }
    }else {
      return and__3822__auto____7018
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
    var G__7028__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7024 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7025 = more;
        while(true) {
          var x__7026 = cljs.core.first.call(null, xs__7025);
          var etc__7027 = cljs.core.next.call(null, xs__7025);
          if(cljs.core.truth_(xs__7025)) {
            if(cljs.core.contains_QMARK_.call(null, s__7024, x__7026)) {
              return false
            }else {
              var G__7029 = cljs.core.conj.call(null, s__7024, x__7026);
              var G__7030 = etc__7027;
              s__7024 = G__7029;
              xs__7025 = G__7030;
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
    var G__7028 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7028__delegate.call(this, x, y, more)
    };
    G__7028.cljs$lang$maxFixedArity = 2;
    G__7028.cljs$lang$applyTo = function(arglist__7031) {
      var x = cljs.core.first(arglist__7031);
      var y = cljs.core.first(cljs.core.next(arglist__7031));
      var more = cljs.core.rest(cljs.core.next(arglist__7031));
      return G__7028__delegate(x, y, more)
    };
    G__7028.cljs$lang$arity$variadic = G__7028__delegate;
    return G__7028
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
            var G__7035__7036 = x;
            if(G__7035__7036) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7037 = null;
                if(cljs.core.truth_(or__3824__auto____7037)) {
                  return or__3824__auto____7037
                }else {
                  return G__7035__7036.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7035__7036.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7035__7036)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7035__7036)
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
    var xl__7042 = cljs.core.count.call(null, xs);
    var yl__7043 = cljs.core.count.call(null, ys);
    if(xl__7042 < yl__7043) {
      return-1
    }else {
      if(xl__7042 > yl__7043) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7042, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7044 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7045 = d__7044 === 0;
        if(and__3822__auto____7045) {
          return n + 1 < len
        }else {
          return and__3822__auto____7045
        }
      }()) {
        var G__7046 = xs;
        var G__7047 = ys;
        var G__7048 = len;
        var G__7049 = n + 1;
        xs = G__7046;
        ys = G__7047;
        len = G__7048;
        n = G__7049;
        continue
      }else {
        return d__7044
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
      var r__7051 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7051)) {
        return r__7051
      }else {
        if(cljs.core.truth_(r__7051)) {
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
      var a__7053 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7053, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7053)
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
    var temp__3971__auto____7059 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7059) {
      var s__7060 = temp__3971__auto____7059;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7060), cljs.core.next.call(null, s__7060))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7061 = val;
    var coll__7062 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7062) {
        var nval__7063 = f.call(null, val__7061, cljs.core.first.call(null, coll__7062));
        if(cljs.core.reduced_QMARK_.call(null, nval__7063)) {
          return cljs.core.deref.call(null, nval__7063)
        }else {
          var G__7064 = nval__7063;
          var G__7065 = cljs.core.next.call(null, coll__7062);
          val__7061 = G__7064;
          coll__7062 = G__7065;
          continue
        }
      }else {
        return val__7061
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
  var a__7067 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7067);
  return cljs.core.vec.call(null, a__7067)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7074__7075 = coll;
      if(G__7074__7075) {
        if(function() {
          var or__3824__auto____7076 = G__7074__7075.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7076) {
            return or__3824__auto____7076
          }else {
            return G__7074__7075.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7074__7075.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7074__7075)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7074__7075)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7077__7078 = coll;
      if(G__7077__7078) {
        if(function() {
          var or__3824__auto____7079 = G__7077__7078.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7079) {
            return or__3824__auto____7079
          }else {
            return G__7077__7078.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7077__7078.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7077__7078)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7077__7078)
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
  var this__7080 = this;
  return this__7080.val
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
    var G__7081__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7081 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7081__delegate.call(this, x, y, more)
    };
    G__7081.cljs$lang$maxFixedArity = 2;
    G__7081.cljs$lang$applyTo = function(arglist__7082) {
      var x = cljs.core.first(arglist__7082);
      var y = cljs.core.first(cljs.core.next(arglist__7082));
      var more = cljs.core.rest(cljs.core.next(arglist__7082));
      return G__7081__delegate(x, y, more)
    };
    G__7081.cljs$lang$arity$variadic = G__7081__delegate;
    return G__7081
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
    var G__7083__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7083 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7083__delegate.call(this, x, y, more)
    };
    G__7083.cljs$lang$maxFixedArity = 2;
    G__7083.cljs$lang$applyTo = function(arglist__7084) {
      var x = cljs.core.first(arglist__7084);
      var y = cljs.core.first(cljs.core.next(arglist__7084));
      var more = cljs.core.rest(cljs.core.next(arglist__7084));
      return G__7083__delegate(x, y, more)
    };
    G__7083.cljs$lang$arity$variadic = G__7083__delegate;
    return G__7083
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
    var G__7085__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7085 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7085__delegate.call(this, x, y, more)
    };
    G__7085.cljs$lang$maxFixedArity = 2;
    G__7085.cljs$lang$applyTo = function(arglist__7086) {
      var x = cljs.core.first(arglist__7086);
      var y = cljs.core.first(cljs.core.next(arglist__7086));
      var more = cljs.core.rest(cljs.core.next(arglist__7086));
      return G__7085__delegate(x, y, more)
    };
    G__7085.cljs$lang$arity$variadic = G__7085__delegate;
    return G__7085
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
    var G__7087__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7087 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7087__delegate.call(this, x, y, more)
    };
    G__7087.cljs$lang$maxFixedArity = 2;
    G__7087.cljs$lang$applyTo = function(arglist__7088) {
      var x = cljs.core.first(arglist__7088);
      var y = cljs.core.first(cljs.core.next(arglist__7088));
      var more = cljs.core.rest(cljs.core.next(arglist__7088));
      return G__7087__delegate(x, y, more)
    };
    G__7087.cljs$lang$arity$variadic = G__7087__delegate;
    return G__7087
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
    var G__7089__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7090 = y;
            var G__7091 = cljs.core.first.call(null, more);
            var G__7092 = cljs.core.next.call(null, more);
            x = G__7090;
            y = G__7091;
            more = G__7092;
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
    var G__7089 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7089__delegate.call(this, x, y, more)
    };
    G__7089.cljs$lang$maxFixedArity = 2;
    G__7089.cljs$lang$applyTo = function(arglist__7093) {
      var x = cljs.core.first(arglist__7093);
      var y = cljs.core.first(cljs.core.next(arglist__7093));
      var more = cljs.core.rest(cljs.core.next(arglist__7093));
      return G__7089__delegate(x, y, more)
    };
    G__7089.cljs$lang$arity$variadic = G__7089__delegate;
    return G__7089
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
    var G__7094__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7095 = y;
            var G__7096 = cljs.core.first.call(null, more);
            var G__7097 = cljs.core.next.call(null, more);
            x = G__7095;
            y = G__7096;
            more = G__7097;
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
    var G__7094 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7094__delegate.call(this, x, y, more)
    };
    G__7094.cljs$lang$maxFixedArity = 2;
    G__7094.cljs$lang$applyTo = function(arglist__7098) {
      var x = cljs.core.first(arglist__7098);
      var y = cljs.core.first(cljs.core.next(arglist__7098));
      var more = cljs.core.rest(cljs.core.next(arglist__7098));
      return G__7094__delegate(x, y, more)
    };
    G__7094.cljs$lang$arity$variadic = G__7094__delegate;
    return G__7094
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
    var G__7099__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7100 = y;
            var G__7101 = cljs.core.first.call(null, more);
            var G__7102 = cljs.core.next.call(null, more);
            x = G__7100;
            y = G__7101;
            more = G__7102;
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
    var G__7099 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7099__delegate.call(this, x, y, more)
    };
    G__7099.cljs$lang$maxFixedArity = 2;
    G__7099.cljs$lang$applyTo = function(arglist__7103) {
      var x = cljs.core.first(arglist__7103);
      var y = cljs.core.first(cljs.core.next(arglist__7103));
      var more = cljs.core.rest(cljs.core.next(arglist__7103));
      return G__7099__delegate(x, y, more)
    };
    G__7099.cljs$lang$arity$variadic = G__7099__delegate;
    return G__7099
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
    var G__7104__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7105 = y;
            var G__7106 = cljs.core.first.call(null, more);
            var G__7107 = cljs.core.next.call(null, more);
            x = G__7105;
            y = G__7106;
            more = G__7107;
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
    var G__7104 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7104__delegate.call(this, x, y, more)
    };
    G__7104.cljs$lang$maxFixedArity = 2;
    G__7104.cljs$lang$applyTo = function(arglist__7108) {
      var x = cljs.core.first(arglist__7108);
      var y = cljs.core.first(cljs.core.next(arglist__7108));
      var more = cljs.core.rest(cljs.core.next(arglist__7108));
      return G__7104__delegate(x, y, more)
    };
    G__7104.cljs$lang$arity$variadic = G__7104__delegate;
    return G__7104
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
    var G__7109__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7109 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7109__delegate.call(this, x, y, more)
    };
    G__7109.cljs$lang$maxFixedArity = 2;
    G__7109.cljs$lang$applyTo = function(arglist__7110) {
      var x = cljs.core.first(arglist__7110);
      var y = cljs.core.first(cljs.core.next(arglist__7110));
      var more = cljs.core.rest(cljs.core.next(arglist__7110));
      return G__7109__delegate(x, y, more)
    };
    G__7109.cljs$lang$arity$variadic = G__7109__delegate;
    return G__7109
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
    var G__7111__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7111 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7111__delegate.call(this, x, y, more)
    };
    G__7111.cljs$lang$maxFixedArity = 2;
    G__7111.cljs$lang$applyTo = function(arglist__7112) {
      var x = cljs.core.first(arglist__7112);
      var y = cljs.core.first(cljs.core.next(arglist__7112));
      var more = cljs.core.rest(cljs.core.next(arglist__7112));
      return G__7111__delegate(x, y, more)
    };
    G__7111.cljs$lang$arity$variadic = G__7111__delegate;
    return G__7111
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
  var rem__7114 = n % d;
  return cljs.core.fix.call(null, (n - rem__7114) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7116 = cljs.core.quot.call(null, n, d);
  return n - d * q__7116
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
  var v__7119 = v - (v >> 1 & 1431655765);
  var v__7120 = (v__7119 & 858993459) + (v__7119 >> 2 & 858993459);
  return(v__7120 + (v__7120 >> 4) & 252645135) * 16843009 >> 24
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
    var G__7121__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7122 = y;
            var G__7123 = cljs.core.first.call(null, more);
            var G__7124 = cljs.core.next.call(null, more);
            x = G__7122;
            y = G__7123;
            more = G__7124;
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
    var G__7121 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7121__delegate.call(this, x, y, more)
    };
    G__7121.cljs$lang$maxFixedArity = 2;
    G__7121.cljs$lang$applyTo = function(arglist__7125) {
      var x = cljs.core.first(arglist__7125);
      var y = cljs.core.first(cljs.core.next(arglist__7125));
      var more = cljs.core.rest(cljs.core.next(arglist__7125));
      return G__7121__delegate(x, y, more)
    };
    G__7121.cljs$lang$arity$variadic = G__7121__delegate;
    return G__7121
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
  var n__7129 = n;
  var xs__7130 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7131 = xs__7130;
      if(and__3822__auto____7131) {
        return n__7129 > 0
      }else {
        return and__3822__auto____7131
      }
    }())) {
      var G__7132 = n__7129 - 1;
      var G__7133 = cljs.core.next.call(null, xs__7130);
      n__7129 = G__7132;
      xs__7130 = G__7133;
      continue
    }else {
      return xs__7130
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
    var G__7134__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7135 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7136 = cljs.core.next.call(null, more);
            sb = G__7135;
            more = G__7136;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7134 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7134__delegate.call(this, x, ys)
    };
    G__7134.cljs$lang$maxFixedArity = 1;
    G__7134.cljs$lang$applyTo = function(arglist__7137) {
      var x = cljs.core.first(arglist__7137);
      var ys = cljs.core.rest(arglist__7137);
      return G__7134__delegate(x, ys)
    };
    G__7134.cljs$lang$arity$variadic = G__7134__delegate;
    return G__7134
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
    var G__7138__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7139 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7140 = cljs.core.next.call(null, more);
            sb = G__7139;
            more = G__7140;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7138 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7138__delegate.call(this, x, ys)
    };
    G__7138.cljs$lang$maxFixedArity = 1;
    G__7138.cljs$lang$applyTo = function(arglist__7141) {
      var x = cljs.core.first(arglist__7141);
      var ys = cljs.core.rest(arglist__7141);
      return G__7138__delegate(x, ys)
    };
    G__7138.cljs$lang$arity$variadic = G__7138__delegate;
    return G__7138
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
  format.cljs$lang$applyTo = function(arglist__7142) {
    var fmt = cljs.core.first(arglist__7142);
    var args = cljs.core.rest(arglist__7142);
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
    var xs__7145 = cljs.core.seq.call(null, x);
    var ys__7146 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7145 == null) {
        return ys__7146 == null
      }else {
        if(ys__7146 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7145), cljs.core.first.call(null, ys__7146))) {
            var G__7147 = cljs.core.next.call(null, xs__7145);
            var G__7148 = cljs.core.next.call(null, ys__7146);
            xs__7145 = G__7147;
            ys__7146 = G__7148;
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
  return cljs.core.reduce.call(null, function(p1__7149_SHARP_, p2__7150_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7149_SHARP_, cljs.core.hash.call(null, p2__7150_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7154 = 0;
  var s__7155 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7155) {
      var e__7156 = cljs.core.first.call(null, s__7155);
      var G__7157 = (h__7154 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7156)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7156)))) % 4503599627370496;
      var G__7158 = cljs.core.next.call(null, s__7155);
      h__7154 = G__7157;
      s__7155 = G__7158;
      continue
    }else {
      return h__7154
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7162 = 0;
  var s__7163 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7163) {
      var e__7164 = cljs.core.first.call(null, s__7163);
      var G__7165 = (h__7162 + cljs.core.hash.call(null, e__7164)) % 4503599627370496;
      var G__7166 = cljs.core.next.call(null, s__7163);
      h__7162 = G__7165;
      s__7163 = G__7166;
      continue
    }else {
      return h__7162
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7187__7188 = cljs.core.seq.call(null, fn_map);
  if(G__7187__7188) {
    var G__7190__7192 = cljs.core.first.call(null, G__7187__7188);
    var vec__7191__7193 = G__7190__7192;
    var key_name__7194 = cljs.core.nth.call(null, vec__7191__7193, 0, null);
    var f__7195 = cljs.core.nth.call(null, vec__7191__7193, 1, null);
    var G__7187__7196 = G__7187__7188;
    var G__7190__7197 = G__7190__7192;
    var G__7187__7198 = G__7187__7196;
    while(true) {
      var vec__7199__7200 = G__7190__7197;
      var key_name__7201 = cljs.core.nth.call(null, vec__7199__7200, 0, null);
      var f__7202 = cljs.core.nth.call(null, vec__7199__7200, 1, null);
      var G__7187__7203 = G__7187__7198;
      var str_name__7204 = cljs.core.name.call(null, key_name__7201);
      obj[str_name__7204] = f__7202;
      var temp__3974__auto____7205 = cljs.core.next.call(null, G__7187__7203);
      if(temp__3974__auto____7205) {
        var G__7187__7206 = temp__3974__auto____7205;
        var G__7207 = cljs.core.first.call(null, G__7187__7206);
        var G__7208 = G__7187__7206;
        G__7190__7197 = G__7207;
        G__7187__7198 = G__7208;
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
  var this__7209 = this;
  var h__2192__auto____7210 = this__7209.__hash;
  if(!(h__2192__auto____7210 == null)) {
    return h__2192__auto____7210
  }else {
    var h__2192__auto____7211 = cljs.core.hash_coll.call(null, coll);
    this__7209.__hash = h__2192__auto____7211;
    return h__2192__auto____7211
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7212 = this;
  if(this__7212.count === 1) {
    return null
  }else {
    return this__7212.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7213 = this;
  return new cljs.core.List(this__7213.meta, o, coll, this__7213.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7214 = this;
  var this__7215 = this;
  return cljs.core.pr_str.call(null, this__7215)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7216 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7217 = this;
  return this__7217.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7218 = this;
  return this__7218.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7219 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7220 = this;
  return this__7220.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7221 = this;
  if(this__7221.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7221.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7222 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7223 = this;
  return new cljs.core.List(meta, this__7223.first, this__7223.rest, this__7223.count, this__7223.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7224 = this;
  return this__7224.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7225 = this;
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
  var this__7226 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7227 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7228 = this;
  return new cljs.core.List(this__7228.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7229 = this;
  var this__7230 = this;
  return cljs.core.pr_str.call(null, this__7230)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7231 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7232 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7233 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7234 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7235 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7236 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7237 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7238 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7239 = this;
  return this__7239.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7240 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7244__7245 = coll;
  if(G__7244__7245) {
    if(function() {
      var or__3824__auto____7246 = G__7244__7245.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7246) {
        return or__3824__auto____7246
      }else {
        return G__7244__7245.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7244__7245.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7244__7245)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7244__7245)
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
    var G__7247__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7247 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7247__delegate.call(this, x, y, z, items)
    };
    G__7247.cljs$lang$maxFixedArity = 3;
    G__7247.cljs$lang$applyTo = function(arglist__7248) {
      var x = cljs.core.first(arglist__7248);
      var y = cljs.core.first(cljs.core.next(arglist__7248));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7248)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7248)));
      return G__7247__delegate(x, y, z, items)
    };
    G__7247.cljs$lang$arity$variadic = G__7247__delegate;
    return G__7247
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
  var this__7249 = this;
  var h__2192__auto____7250 = this__7249.__hash;
  if(!(h__2192__auto____7250 == null)) {
    return h__2192__auto____7250
  }else {
    var h__2192__auto____7251 = cljs.core.hash_coll.call(null, coll);
    this__7249.__hash = h__2192__auto____7251;
    return h__2192__auto____7251
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7252 = this;
  if(this__7252.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7252.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7253 = this;
  return new cljs.core.Cons(null, o, coll, this__7253.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7254 = this;
  var this__7255 = this;
  return cljs.core.pr_str.call(null, this__7255)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7256 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7257 = this;
  return this__7257.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7258 = this;
  if(this__7258.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7258.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7259 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7260 = this;
  return new cljs.core.Cons(meta, this__7260.first, this__7260.rest, this__7260.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7261 = this;
  return this__7261.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7262 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7262.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7267 = coll == null;
    if(or__3824__auto____7267) {
      return or__3824__auto____7267
    }else {
      var G__7268__7269 = coll;
      if(G__7268__7269) {
        if(function() {
          var or__3824__auto____7270 = G__7268__7269.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7270) {
            return or__3824__auto____7270
          }else {
            return G__7268__7269.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7268__7269.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7268__7269)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7268__7269)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7274__7275 = x;
  if(G__7274__7275) {
    if(function() {
      var or__3824__auto____7276 = G__7274__7275.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7276) {
        return or__3824__auto____7276
      }else {
        return G__7274__7275.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7274__7275.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7274__7275)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7274__7275)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7277 = null;
  var G__7277__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7277__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7277 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7277__2.call(this, string, f);
      case 3:
        return G__7277__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7277
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7278 = null;
  var G__7278__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7278__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7278 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7278__2.call(this, string, k);
      case 3:
        return G__7278__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7278
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7279 = null;
  var G__7279__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7279__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7279 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7279__2.call(this, string, n);
      case 3:
        return G__7279__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7279
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
  var G__7291 = null;
  var G__7291__2 = function(this_sym7282, coll) {
    var this__7284 = this;
    var this_sym7282__7285 = this;
    var ___7286 = this_sym7282__7285;
    if(coll == null) {
      return null
    }else {
      var strobj__7287 = coll.strobj;
      if(strobj__7287 == null) {
        return cljs.core._lookup.call(null, coll, this__7284.k, null)
      }else {
        return strobj__7287[this__7284.k]
      }
    }
  };
  var G__7291__3 = function(this_sym7283, coll, not_found) {
    var this__7284 = this;
    var this_sym7283__7288 = this;
    var ___7289 = this_sym7283__7288;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7284.k, not_found)
    }
  };
  G__7291 = function(this_sym7283, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7291__2.call(this, this_sym7283, coll);
      case 3:
        return G__7291__3.call(this, this_sym7283, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7291
}();
cljs.core.Keyword.prototype.apply = function(this_sym7280, args7281) {
  var this__7290 = this;
  return this_sym7280.call.apply(this_sym7280, [this_sym7280].concat(args7281.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7300 = null;
  var G__7300__2 = function(this_sym7294, coll) {
    var this_sym7294__7296 = this;
    var this__7297 = this_sym7294__7296;
    return cljs.core._lookup.call(null, coll, this__7297.toString(), null)
  };
  var G__7300__3 = function(this_sym7295, coll, not_found) {
    var this_sym7295__7298 = this;
    var this__7299 = this_sym7295__7298;
    return cljs.core._lookup.call(null, coll, this__7299.toString(), not_found)
  };
  G__7300 = function(this_sym7295, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7300__2.call(this, this_sym7295, coll);
      case 3:
        return G__7300__3.call(this, this_sym7295, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7300
}();
String.prototype.apply = function(this_sym7292, args7293) {
  return this_sym7292.call.apply(this_sym7292, [this_sym7292].concat(args7293.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7302 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7302
  }else {
    lazy_seq.x = x__7302.call(null);
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
  var this__7303 = this;
  var h__2192__auto____7304 = this__7303.__hash;
  if(!(h__2192__auto____7304 == null)) {
    return h__2192__auto____7304
  }else {
    var h__2192__auto____7305 = cljs.core.hash_coll.call(null, coll);
    this__7303.__hash = h__2192__auto____7305;
    return h__2192__auto____7305
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7306 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7307 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7308 = this;
  var this__7309 = this;
  return cljs.core.pr_str.call(null, this__7309)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7310 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7311 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7312 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7313 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7314 = this;
  return new cljs.core.LazySeq(meta, this__7314.realized, this__7314.x, this__7314.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7315 = this;
  return this__7315.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7316 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7316.meta)
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
  var this__7317 = this;
  return this__7317.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7318 = this;
  var ___7319 = this;
  this__7318.buf[this__7318.end] = o;
  return this__7318.end = this__7318.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7320 = this;
  var ___7321 = this;
  var ret__7322 = new cljs.core.ArrayChunk(this__7320.buf, 0, this__7320.end);
  this__7320.buf = null;
  return ret__7322
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
  var this__7323 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7323.arr[this__7323.off], this__7323.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7324 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7324.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7325 = this;
  if(this__7325.off === this__7325.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7325.arr, this__7325.off + 1, this__7325.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7326 = this;
  return this__7326.arr[this__7326.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7327 = this;
  if(function() {
    var and__3822__auto____7328 = i >= 0;
    if(and__3822__auto____7328) {
      return i < this__7327.end - this__7327.off
    }else {
      return and__3822__auto____7328
    }
  }()) {
    return this__7327.arr[this__7327.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7329 = this;
  return this__7329.end - this__7329.off
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
  var this__7330 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7331 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7332 = this;
  return cljs.core._nth.call(null, this__7332.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7333 = this;
  if(cljs.core._count.call(null, this__7333.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7333.chunk), this__7333.more, this__7333.meta)
  }else {
    if(this__7333.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7333.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7334 = this;
  if(this__7334.more == null) {
    return null
  }else {
    return this__7334.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7335 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7336 = this;
  return new cljs.core.ChunkedCons(this__7336.chunk, this__7336.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7337 = this;
  return this__7337.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7338 = this;
  return this__7338.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7339 = this;
  if(this__7339.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7339.more
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
    var G__7343__7344 = s;
    if(G__7343__7344) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7345 = null;
        if(cljs.core.truth_(or__3824__auto____7345)) {
          return or__3824__auto____7345
        }else {
          return G__7343__7344.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7343__7344.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7343__7344)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7343__7344)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7348 = [];
  var s__7349 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7349)) {
      ary__7348.push(cljs.core.first.call(null, s__7349));
      var G__7350 = cljs.core.next.call(null, s__7349);
      s__7349 = G__7350;
      continue
    }else {
      return ary__7348
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7354 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7355 = 0;
  var xs__7356 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7356) {
      ret__7354[i__7355] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7356));
      var G__7357 = i__7355 + 1;
      var G__7358 = cljs.core.next.call(null, xs__7356);
      i__7355 = G__7357;
      xs__7356 = G__7358;
      continue
    }else {
    }
    break
  }
  return ret__7354
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
    var a__7366 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7367 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7368 = 0;
      var s__7369 = s__7367;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7370 = s__7369;
          if(and__3822__auto____7370) {
            return i__7368 < size
          }else {
            return and__3822__auto____7370
          }
        }())) {
          a__7366[i__7368] = cljs.core.first.call(null, s__7369);
          var G__7373 = i__7368 + 1;
          var G__7374 = cljs.core.next.call(null, s__7369);
          i__7368 = G__7373;
          s__7369 = G__7374;
          continue
        }else {
          return a__7366
        }
        break
      }
    }else {
      var n__2527__auto____7371 = size;
      var i__7372 = 0;
      while(true) {
        if(i__7372 < n__2527__auto____7371) {
          a__7366[i__7372] = init_val_or_seq;
          var G__7375 = i__7372 + 1;
          i__7372 = G__7375;
          continue
        }else {
        }
        break
      }
      return a__7366
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
    var a__7383 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7384 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7385 = 0;
      var s__7386 = s__7384;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7387 = s__7386;
          if(and__3822__auto____7387) {
            return i__7385 < size
          }else {
            return and__3822__auto____7387
          }
        }())) {
          a__7383[i__7385] = cljs.core.first.call(null, s__7386);
          var G__7390 = i__7385 + 1;
          var G__7391 = cljs.core.next.call(null, s__7386);
          i__7385 = G__7390;
          s__7386 = G__7391;
          continue
        }else {
          return a__7383
        }
        break
      }
    }else {
      var n__2527__auto____7388 = size;
      var i__7389 = 0;
      while(true) {
        if(i__7389 < n__2527__auto____7388) {
          a__7383[i__7389] = init_val_or_seq;
          var G__7392 = i__7389 + 1;
          i__7389 = G__7392;
          continue
        }else {
        }
        break
      }
      return a__7383
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
    var a__7400 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7401 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7402 = 0;
      var s__7403 = s__7401;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7404 = s__7403;
          if(and__3822__auto____7404) {
            return i__7402 < size
          }else {
            return and__3822__auto____7404
          }
        }())) {
          a__7400[i__7402] = cljs.core.first.call(null, s__7403);
          var G__7407 = i__7402 + 1;
          var G__7408 = cljs.core.next.call(null, s__7403);
          i__7402 = G__7407;
          s__7403 = G__7408;
          continue
        }else {
          return a__7400
        }
        break
      }
    }else {
      var n__2527__auto____7405 = size;
      var i__7406 = 0;
      while(true) {
        if(i__7406 < n__2527__auto____7405) {
          a__7400[i__7406] = init_val_or_seq;
          var G__7409 = i__7406 + 1;
          i__7406 = G__7409;
          continue
        }else {
        }
        break
      }
      return a__7400
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
    var s__7414 = s;
    var i__7415 = n;
    var sum__7416 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7417 = i__7415 > 0;
        if(and__3822__auto____7417) {
          return cljs.core.seq.call(null, s__7414)
        }else {
          return and__3822__auto____7417
        }
      }())) {
        var G__7418 = cljs.core.next.call(null, s__7414);
        var G__7419 = i__7415 - 1;
        var G__7420 = sum__7416 + 1;
        s__7414 = G__7418;
        i__7415 = G__7419;
        sum__7416 = G__7420;
        continue
      }else {
        return sum__7416
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
      var s__7425 = cljs.core.seq.call(null, x);
      if(s__7425) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7425)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7425), concat.call(null, cljs.core.chunk_rest.call(null, s__7425), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7425), concat.call(null, cljs.core.rest.call(null, s__7425), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7429__delegate = function(x, y, zs) {
      var cat__7428 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7427 = cljs.core.seq.call(null, xys);
          if(xys__7427) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7427)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7427), cat.call(null, cljs.core.chunk_rest.call(null, xys__7427), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7427), cat.call(null, cljs.core.rest.call(null, xys__7427), zs))
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
      return cat__7428.call(null, concat.call(null, x, y), zs)
    };
    var G__7429 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7429__delegate.call(this, x, y, zs)
    };
    G__7429.cljs$lang$maxFixedArity = 2;
    G__7429.cljs$lang$applyTo = function(arglist__7430) {
      var x = cljs.core.first(arglist__7430);
      var y = cljs.core.first(cljs.core.next(arglist__7430));
      var zs = cljs.core.rest(cljs.core.next(arglist__7430));
      return G__7429__delegate(x, y, zs)
    };
    G__7429.cljs$lang$arity$variadic = G__7429__delegate;
    return G__7429
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
    var G__7431__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7431 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7431__delegate.call(this, a, b, c, d, more)
    };
    G__7431.cljs$lang$maxFixedArity = 4;
    G__7431.cljs$lang$applyTo = function(arglist__7432) {
      var a = cljs.core.first(arglist__7432);
      var b = cljs.core.first(cljs.core.next(arglist__7432));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7432)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7432))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7432))));
      return G__7431__delegate(a, b, c, d, more)
    };
    G__7431.cljs$lang$arity$variadic = G__7431__delegate;
    return G__7431
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
  var args__7474 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7475 = cljs.core._first.call(null, args__7474);
    var args__7476 = cljs.core._rest.call(null, args__7474);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7475)
      }else {
        return f.call(null, a__7475)
      }
    }else {
      var b__7477 = cljs.core._first.call(null, args__7476);
      var args__7478 = cljs.core._rest.call(null, args__7476);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7475, b__7477)
        }else {
          return f.call(null, a__7475, b__7477)
        }
      }else {
        var c__7479 = cljs.core._first.call(null, args__7478);
        var args__7480 = cljs.core._rest.call(null, args__7478);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7475, b__7477, c__7479)
          }else {
            return f.call(null, a__7475, b__7477, c__7479)
          }
        }else {
          var d__7481 = cljs.core._first.call(null, args__7480);
          var args__7482 = cljs.core._rest.call(null, args__7480);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7475, b__7477, c__7479, d__7481)
            }else {
              return f.call(null, a__7475, b__7477, c__7479, d__7481)
            }
          }else {
            var e__7483 = cljs.core._first.call(null, args__7482);
            var args__7484 = cljs.core._rest.call(null, args__7482);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7475, b__7477, c__7479, d__7481, e__7483)
              }else {
                return f.call(null, a__7475, b__7477, c__7479, d__7481, e__7483)
              }
            }else {
              var f__7485 = cljs.core._first.call(null, args__7484);
              var args__7486 = cljs.core._rest.call(null, args__7484);
              if(argc === 6) {
                if(f__7485.cljs$lang$arity$6) {
                  return f__7485.cljs$lang$arity$6(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485)
                }else {
                  return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485)
                }
              }else {
                var g__7487 = cljs.core._first.call(null, args__7486);
                var args__7488 = cljs.core._rest.call(null, args__7486);
                if(argc === 7) {
                  if(f__7485.cljs$lang$arity$7) {
                    return f__7485.cljs$lang$arity$7(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487)
                  }else {
                    return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487)
                  }
                }else {
                  var h__7489 = cljs.core._first.call(null, args__7488);
                  var args__7490 = cljs.core._rest.call(null, args__7488);
                  if(argc === 8) {
                    if(f__7485.cljs$lang$arity$8) {
                      return f__7485.cljs$lang$arity$8(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489)
                    }else {
                      return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489)
                    }
                  }else {
                    var i__7491 = cljs.core._first.call(null, args__7490);
                    var args__7492 = cljs.core._rest.call(null, args__7490);
                    if(argc === 9) {
                      if(f__7485.cljs$lang$arity$9) {
                        return f__7485.cljs$lang$arity$9(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491)
                      }else {
                        return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491)
                      }
                    }else {
                      var j__7493 = cljs.core._first.call(null, args__7492);
                      var args__7494 = cljs.core._rest.call(null, args__7492);
                      if(argc === 10) {
                        if(f__7485.cljs$lang$arity$10) {
                          return f__7485.cljs$lang$arity$10(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493)
                        }else {
                          return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493)
                        }
                      }else {
                        var k__7495 = cljs.core._first.call(null, args__7494);
                        var args__7496 = cljs.core._rest.call(null, args__7494);
                        if(argc === 11) {
                          if(f__7485.cljs$lang$arity$11) {
                            return f__7485.cljs$lang$arity$11(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495)
                          }else {
                            return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495)
                          }
                        }else {
                          var l__7497 = cljs.core._first.call(null, args__7496);
                          var args__7498 = cljs.core._rest.call(null, args__7496);
                          if(argc === 12) {
                            if(f__7485.cljs$lang$arity$12) {
                              return f__7485.cljs$lang$arity$12(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497)
                            }else {
                              return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497)
                            }
                          }else {
                            var m__7499 = cljs.core._first.call(null, args__7498);
                            var args__7500 = cljs.core._rest.call(null, args__7498);
                            if(argc === 13) {
                              if(f__7485.cljs$lang$arity$13) {
                                return f__7485.cljs$lang$arity$13(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499)
                              }else {
                                return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499)
                              }
                            }else {
                              var n__7501 = cljs.core._first.call(null, args__7500);
                              var args__7502 = cljs.core._rest.call(null, args__7500);
                              if(argc === 14) {
                                if(f__7485.cljs$lang$arity$14) {
                                  return f__7485.cljs$lang$arity$14(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501)
                                }else {
                                  return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501)
                                }
                              }else {
                                var o__7503 = cljs.core._first.call(null, args__7502);
                                var args__7504 = cljs.core._rest.call(null, args__7502);
                                if(argc === 15) {
                                  if(f__7485.cljs$lang$arity$15) {
                                    return f__7485.cljs$lang$arity$15(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503)
                                  }else {
                                    return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503)
                                  }
                                }else {
                                  var p__7505 = cljs.core._first.call(null, args__7504);
                                  var args__7506 = cljs.core._rest.call(null, args__7504);
                                  if(argc === 16) {
                                    if(f__7485.cljs$lang$arity$16) {
                                      return f__7485.cljs$lang$arity$16(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505)
                                    }else {
                                      return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505)
                                    }
                                  }else {
                                    var q__7507 = cljs.core._first.call(null, args__7506);
                                    var args__7508 = cljs.core._rest.call(null, args__7506);
                                    if(argc === 17) {
                                      if(f__7485.cljs$lang$arity$17) {
                                        return f__7485.cljs$lang$arity$17(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505, q__7507)
                                      }else {
                                        return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505, q__7507)
                                      }
                                    }else {
                                      var r__7509 = cljs.core._first.call(null, args__7508);
                                      var args__7510 = cljs.core._rest.call(null, args__7508);
                                      if(argc === 18) {
                                        if(f__7485.cljs$lang$arity$18) {
                                          return f__7485.cljs$lang$arity$18(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505, q__7507, r__7509)
                                        }else {
                                          return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505, q__7507, r__7509)
                                        }
                                      }else {
                                        var s__7511 = cljs.core._first.call(null, args__7510);
                                        var args__7512 = cljs.core._rest.call(null, args__7510);
                                        if(argc === 19) {
                                          if(f__7485.cljs$lang$arity$19) {
                                            return f__7485.cljs$lang$arity$19(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505, q__7507, r__7509, s__7511)
                                          }else {
                                            return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505, q__7507, r__7509, s__7511)
                                          }
                                        }else {
                                          var t__7513 = cljs.core._first.call(null, args__7512);
                                          var args__7514 = cljs.core._rest.call(null, args__7512);
                                          if(argc === 20) {
                                            if(f__7485.cljs$lang$arity$20) {
                                              return f__7485.cljs$lang$arity$20(a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505, q__7507, r__7509, s__7511, t__7513)
                                            }else {
                                              return f__7485.call(null, a__7475, b__7477, c__7479, d__7481, e__7483, f__7485, g__7487, h__7489, i__7491, j__7493, k__7495, l__7497, m__7499, n__7501, o__7503, p__7505, q__7507, r__7509, s__7511, t__7513)
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
    var fixed_arity__7529 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7530 = cljs.core.bounded_count.call(null, args, fixed_arity__7529 + 1);
      if(bc__7530 <= fixed_arity__7529) {
        return cljs.core.apply_to.call(null, f, bc__7530, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7531 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7532 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7533 = cljs.core.bounded_count.call(null, arglist__7531, fixed_arity__7532 + 1);
      if(bc__7533 <= fixed_arity__7532) {
        return cljs.core.apply_to.call(null, f, bc__7533, arglist__7531)
      }else {
        return f.cljs$lang$applyTo(arglist__7531)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7531))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7534 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7535 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7536 = cljs.core.bounded_count.call(null, arglist__7534, fixed_arity__7535 + 1);
      if(bc__7536 <= fixed_arity__7535) {
        return cljs.core.apply_to.call(null, f, bc__7536, arglist__7534)
      }else {
        return f.cljs$lang$applyTo(arglist__7534)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7534))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7537 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7538 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7539 = cljs.core.bounded_count.call(null, arglist__7537, fixed_arity__7538 + 1);
      if(bc__7539 <= fixed_arity__7538) {
        return cljs.core.apply_to.call(null, f, bc__7539, arglist__7537)
      }else {
        return f.cljs$lang$applyTo(arglist__7537)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7537))
    }
  };
  var apply__6 = function() {
    var G__7543__delegate = function(f, a, b, c, d, args) {
      var arglist__7540 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7541 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7542 = cljs.core.bounded_count.call(null, arglist__7540, fixed_arity__7541 + 1);
        if(bc__7542 <= fixed_arity__7541) {
          return cljs.core.apply_to.call(null, f, bc__7542, arglist__7540)
        }else {
          return f.cljs$lang$applyTo(arglist__7540)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7540))
      }
    };
    var G__7543 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7543__delegate.call(this, f, a, b, c, d, args)
    };
    G__7543.cljs$lang$maxFixedArity = 5;
    G__7543.cljs$lang$applyTo = function(arglist__7544) {
      var f = cljs.core.first(arglist__7544);
      var a = cljs.core.first(cljs.core.next(arglist__7544));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7544)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7544))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7544)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7544)))));
      return G__7543__delegate(f, a, b, c, d, args)
    };
    G__7543.cljs$lang$arity$variadic = G__7543__delegate;
    return G__7543
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
  vary_meta.cljs$lang$applyTo = function(arglist__7545) {
    var obj = cljs.core.first(arglist__7545);
    var f = cljs.core.first(cljs.core.next(arglist__7545));
    var args = cljs.core.rest(cljs.core.next(arglist__7545));
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
    var G__7546__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7546 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7546__delegate.call(this, x, y, more)
    };
    G__7546.cljs$lang$maxFixedArity = 2;
    G__7546.cljs$lang$applyTo = function(arglist__7547) {
      var x = cljs.core.first(arglist__7547);
      var y = cljs.core.first(cljs.core.next(arglist__7547));
      var more = cljs.core.rest(cljs.core.next(arglist__7547));
      return G__7546__delegate(x, y, more)
    };
    G__7546.cljs$lang$arity$variadic = G__7546__delegate;
    return G__7546
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
        var G__7548 = pred;
        var G__7549 = cljs.core.next.call(null, coll);
        pred = G__7548;
        coll = G__7549;
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
      var or__3824__auto____7551 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7551)) {
        return or__3824__auto____7551
      }else {
        var G__7552 = pred;
        var G__7553 = cljs.core.next.call(null, coll);
        pred = G__7552;
        coll = G__7553;
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
    var G__7554 = null;
    var G__7554__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7554__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7554__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7554__3 = function() {
      var G__7555__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7555 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7555__delegate.call(this, x, y, zs)
      };
      G__7555.cljs$lang$maxFixedArity = 2;
      G__7555.cljs$lang$applyTo = function(arglist__7556) {
        var x = cljs.core.first(arglist__7556);
        var y = cljs.core.first(cljs.core.next(arglist__7556));
        var zs = cljs.core.rest(cljs.core.next(arglist__7556));
        return G__7555__delegate(x, y, zs)
      };
      G__7555.cljs$lang$arity$variadic = G__7555__delegate;
      return G__7555
    }();
    G__7554 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7554__0.call(this);
        case 1:
          return G__7554__1.call(this, x);
        case 2:
          return G__7554__2.call(this, x, y);
        default:
          return G__7554__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7554.cljs$lang$maxFixedArity = 2;
    G__7554.cljs$lang$applyTo = G__7554__3.cljs$lang$applyTo;
    return G__7554
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7557__delegate = function(args) {
      return x
    };
    var G__7557 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7557__delegate.call(this, args)
    };
    G__7557.cljs$lang$maxFixedArity = 0;
    G__7557.cljs$lang$applyTo = function(arglist__7558) {
      var args = cljs.core.seq(arglist__7558);
      return G__7557__delegate(args)
    };
    G__7557.cljs$lang$arity$variadic = G__7557__delegate;
    return G__7557
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
      var G__7565 = null;
      var G__7565__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7565__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7565__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7565__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7565__4 = function() {
        var G__7566__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7566 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7566__delegate.call(this, x, y, z, args)
        };
        G__7566.cljs$lang$maxFixedArity = 3;
        G__7566.cljs$lang$applyTo = function(arglist__7567) {
          var x = cljs.core.first(arglist__7567);
          var y = cljs.core.first(cljs.core.next(arglist__7567));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7567)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7567)));
          return G__7566__delegate(x, y, z, args)
        };
        G__7566.cljs$lang$arity$variadic = G__7566__delegate;
        return G__7566
      }();
      G__7565 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7565__0.call(this);
          case 1:
            return G__7565__1.call(this, x);
          case 2:
            return G__7565__2.call(this, x, y);
          case 3:
            return G__7565__3.call(this, x, y, z);
          default:
            return G__7565__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7565.cljs$lang$maxFixedArity = 3;
      G__7565.cljs$lang$applyTo = G__7565__4.cljs$lang$applyTo;
      return G__7565
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7568 = null;
      var G__7568__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7568__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7568__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7568__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7568__4 = function() {
        var G__7569__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7569 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7569__delegate.call(this, x, y, z, args)
        };
        G__7569.cljs$lang$maxFixedArity = 3;
        G__7569.cljs$lang$applyTo = function(arglist__7570) {
          var x = cljs.core.first(arglist__7570);
          var y = cljs.core.first(cljs.core.next(arglist__7570));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7570)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7570)));
          return G__7569__delegate(x, y, z, args)
        };
        G__7569.cljs$lang$arity$variadic = G__7569__delegate;
        return G__7569
      }();
      G__7568 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7568__0.call(this);
          case 1:
            return G__7568__1.call(this, x);
          case 2:
            return G__7568__2.call(this, x, y);
          case 3:
            return G__7568__3.call(this, x, y, z);
          default:
            return G__7568__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7568.cljs$lang$maxFixedArity = 3;
      G__7568.cljs$lang$applyTo = G__7568__4.cljs$lang$applyTo;
      return G__7568
    }()
  };
  var comp__4 = function() {
    var G__7571__delegate = function(f1, f2, f3, fs) {
      var fs__7562 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7572__delegate = function(args) {
          var ret__7563 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7562), args);
          var fs__7564 = cljs.core.next.call(null, fs__7562);
          while(true) {
            if(fs__7564) {
              var G__7573 = cljs.core.first.call(null, fs__7564).call(null, ret__7563);
              var G__7574 = cljs.core.next.call(null, fs__7564);
              ret__7563 = G__7573;
              fs__7564 = G__7574;
              continue
            }else {
              return ret__7563
            }
            break
          }
        };
        var G__7572 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7572__delegate.call(this, args)
        };
        G__7572.cljs$lang$maxFixedArity = 0;
        G__7572.cljs$lang$applyTo = function(arglist__7575) {
          var args = cljs.core.seq(arglist__7575);
          return G__7572__delegate(args)
        };
        G__7572.cljs$lang$arity$variadic = G__7572__delegate;
        return G__7572
      }()
    };
    var G__7571 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7571__delegate.call(this, f1, f2, f3, fs)
    };
    G__7571.cljs$lang$maxFixedArity = 3;
    G__7571.cljs$lang$applyTo = function(arglist__7576) {
      var f1 = cljs.core.first(arglist__7576);
      var f2 = cljs.core.first(cljs.core.next(arglist__7576));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7576)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7576)));
      return G__7571__delegate(f1, f2, f3, fs)
    };
    G__7571.cljs$lang$arity$variadic = G__7571__delegate;
    return G__7571
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
      var G__7577__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7577 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7577__delegate.call(this, args)
      };
      G__7577.cljs$lang$maxFixedArity = 0;
      G__7577.cljs$lang$applyTo = function(arglist__7578) {
        var args = cljs.core.seq(arglist__7578);
        return G__7577__delegate(args)
      };
      G__7577.cljs$lang$arity$variadic = G__7577__delegate;
      return G__7577
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7579__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7579 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7579__delegate.call(this, args)
      };
      G__7579.cljs$lang$maxFixedArity = 0;
      G__7579.cljs$lang$applyTo = function(arglist__7580) {
        var args = cljs.core.seq(arglist__7580);
        return G__7579__delegate(args)
      };
      G__7579.cljs$lang$arity$variadic = G__7579__delegate;
      return G__7579
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7581__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7581 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7581__delegate.call(this, args)
      };
      G__7581.cljs$lang$maxFixedArity = 0;
      G__7581.cljs$lang$applyTo = function(arglist__7582) {
        var args = cljs.core.seq(arglist__7582);
        return G__7581__delegate(args)
      };
      G__7581.cljs$lang$arity$variadic = G__7581__delegate;
      return G__7581
    }()
  };
  var partial__5 = function() {
    var G__7583__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7584__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7584 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7584__delegate.call(this, args)
        };
        G__7584.cljs$lang$maxFixedArity = 0;
        G__7584.cljs$lang$applyTo = function(arglist__7585) {
          var args = cljs.core.seq(arglist__7585);
          return G__7584__delegate(args)
        };
        G__7584.cljs$lang$arity$variadic = G__7584__delegate;
        return G__7584
      }()
    };
    var G__7583 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7583__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7583.cljs$lang$maxFixedArity = 4;
    G__7583.cljs$lang$applyTo = function(arglist__7586) {
      var f = cljs.core.first(arglist__7586);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7586));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7586)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7586))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7586))));
      return G__7583__delegate(f, arg1, arg2, arg3, more)
    };
    G__7583.cljs$lang$arity$variadic = G__7583__delegate;
    return G__7583
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
      var G__7587 = null;
      var G__7587__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7587__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7587__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7587__4 = function() {
        var G__7588__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7588 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7588__delegate.call(this, a, b, c, ds)
        };
        G__7588.cljs$lang$maxFixedArity = 3;
        G__7588.cljs$lang$applyTo = function(arglist__7589) {
          var a = cljs.core.first(arglist__7589);
          var b = cljs.core.first(cljs.core.next(arglist__7589));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7589)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7589)));
          return G__7588__delegate(a, b, c, ds)
        };
        G__7588.cljs$lang$arity$variadic = G__7588__delegate;
        return G__7588
      }();
      G__7587 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7587__1.call(this, a);
          case 2:
            return G__7587__2.call(this, a, b);
          case 3:
            return G__7587__3.call(this, a, b, c);
          default:
            return G__7587__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7587.cljs$lang$maxFixedArity = 3;
      G__7587.cljs$lang$applyTo = G__7587__4.cljs$lang$applyTo;
      return G__7587
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7590 = null;
      var G__7590__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7590__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7590__4 = function() {
        var G__7591__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7591 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7591__delegate.call(this, a, b, c, ds)
        };
        G__7591.cljs$lang$maxFixedArity = 3;
        G__7591.cljs$lang$applyTo = function(arglist__7592) {
          var a = cljs.core.first(arglist__7592);
          var b = cljs.core.first(cljs.core.next(arglist__7592));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7592)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7592)));
          return G__7591__delegate(a, b, c, ds)
        };
        G__7591.cljs$lang$arity$variadic = G__7591__delegate;
        return G__7591
      }();
      G__7590 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7590__2.call(this, a, b);
          case 3:
            return G__7590__3.call(this, a, b, c);
          default:
            return G__7590__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7590.cljs$lang$maxFixedArity = 3;
      G__7590.cljs$lang$applyTo = G__7590__4.cljs$lang$applyTo;
      return G__7590
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7593 = null;
      var G__7593__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7593__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7593__4 = function() {
        var G__7594__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7594 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7594__delegate.call(this, a, b, c, ds)
        };
        G__7594.cljs$lang$maxFixedArity = 3;
        G__7594.cljs$lang$applyTo = function(arglist__7595) {
          var a = cljs.core.first(arglist__7595);
          var b = cljs.core.first(cljs.core.next(arglist__7595));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7595)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7595)));
          return G__7594__delegate(a, b, c, ds)
        };
        G__7594.cljs$lang$arity$variadic = G__7594__delegate;
        return G__7594
      }();
      G__7593 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7593__2.call(this, a, b);
          case 3:
            return G__7593__3.call(this, a, b, c);
          default:
            return G__7593__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7593.cljs$lang$maxFixedArity = 3;
      G__7593.cljs$lang$applyTo = G__7593__4.cljs$lang$applyTo;
      return G__7593
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
  var mapi__7611 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7619 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7619) {
        var s__7620 = temp__3974__auto____7619;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7620)) {
          var c__7621 = cljs.core.chunk_first.call(null, s__7620);
          var size__7622 = cljs.core.count.call(null, c__7621);
          var b__7623 = cljs.core.chunk_buffer.call(null, size__7622);
          var n__2527__auto____7624 = size__7622;
          var i__7625 = 0;
          while(true) {
            if(i__7625 < n__2527__auto____7624) {
              cljs.core.chunk_append.call(null, b__7623, f.call(null, idx + i__7625, cljs.core._nth.call(null, c__7621, i__7625)));
              var G__7626 = i__7625 + 1;
              i__7625 = G__7626;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7623), mapi.call(null, idx + size__7622, cljs.core.chunk_rest.call(null, s__7620)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7620)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7620)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7611.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7636 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7636) {
      var s__7637 = temp__3974__auto____7636;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7637)) {
        var c__7638 = cljs.core.chunk_first.call(null, s__7637);
        var size__7639 = cljs.core.count.call(null, c__7638);
        var b__7640 = cljs.core.chunk_buffer.call(null, size__7639);
        var n__2527__auto____7641 = size__7639;
        var i__7642 = 0;
        while(true) {
          if(i__7642 < n__2527__auto____7641) {
            var x__7643 = f.call(null, cljs.core._nth.call(null, c__7638, i__7642));
            if(x__7643 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7640, x__7643)
            }
            var G__7645 = i__7642 + 1;
            i__7642 = G__7645;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7640), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7637)))
      }else {
        var x__7644 = f.call(null, cljs.core.first.call(null, s__7637));
        if(x__7644 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7637))
        }else {
          return cljs.core.cons.call(null, x__7644, keep.call(null, f, cljs.core.rest.call(null, s__7637)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7671 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7681 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7681) {
        var s__7682 = temp__3974__auto____7681;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7682)) {
          var c__7683 = cljs.core.chunk_first.call(null, s__7682);
          var size__7684 = cljs.core.count.call(null, c__7683);
          var b__7685 = cljs.core.chunk_buffer.call(null, size__7684);
          var n__2527__auto____7686 = size__7684;
          var i__7687 = 0;
          while(true) {
            if(i__7687 < n__2527__auto____7686) {
              var x__7688 = f.call(null, idx + i__7687, cljs.core._nth.call(null, c__7683, i__7687));
              if(x__7688 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7685, x__7688)
              }
              var G__7690 = i__7687 + 1;
              i__7687 = G__7690;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7685), keepi.call(null, idx + size__7684, cljs.core.chunk_rest.call(null, s__7682)))
        }else {
          var x__7689 = f.call(null, idx, cljs.core.first.call(null, s__7682));
          if(x__7689 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7682))
          }else {
            return cljs.core.cons.call(null, x__7689, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7682)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7671.call(null, 0, coll)
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
          var and__3822__auto____7776 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7776)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7776
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7777 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7777)) {
            var and__3822__auto____7778 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7778)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7778
            }
          }else {
            return and__3822__auto____7777
          }
        }())
      };
      var ep1__4 = function() {
        var G__7847__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7779 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7779)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7779
            }
          }())
        };
        var G__7847 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7847__delegate.call(this, x, y, z, args)
        };
        G__7847.cljs$lang$maxFixedArity = 3;
        G__7847.cljs$lang$applyTo = function(arglist__7848) {
          var x = cljs.core.first(arglist__7848);
          var y = cljs.core.first(cljs.core.next(arglist__7848));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7848)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7848)));
          return G__7847__delegate(x, y, z, args)
        };
        G__7847.cljs$lang$arity$variadic = G__7847__delegate;
        return G__7847
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
          var and__3822__auto____7791 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7791)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7791
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7792 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7792)) {
            var and__3822__auto____7793 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7793)) {
              var and__3822__auto____7794 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7794)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7794
              }
            }else {
              return and__3822__auto____7793
            }
          }else {
            return and__3822__auto____7792
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7795 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7795)) {
            var and__3822__auto____7796 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7796)) {
              var and__3822__auto____7797 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7797)) {
                var and__3822__auto____7798 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7798)) {
                  var and__3822__auto____7799 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7799)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7799
                  }
                }else {
                  return and__3822__auto____7798
                }
              }else {
                return and__3822__auto____7797
              }
            }else {
              return and__3822__auto____7796
            }
          }else {
            return and__3822__auto____7795
          }
        }())
      };
      var ep2__4 = function() {
        var G__7849__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7800 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7800)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7646_SHARP_) {
                var and__3822__auto____7801 = p1.call(null, p1__7646_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7801)) {
                  return p2.call(null, p1__7646_SHARP_)
                }else {
                  return and__3822__auto____7801
                }
              }, args)
            }else {
              return and__3822__auto____7800
            }
          }())
        };
        var G__7849 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7849__delegate.call(this, x, y, z, args)
        };
        G__7849.cljs$lang$maxFixedArity = 3;
        G__7849.cljs$lang$applyTo = function(arglist__7850) {
          var x = cljs.core.first(arglist__7850);
          var y = cljs.core.first(cljs.core.next(arglist__7850));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7850)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7850)));
          return G__7849__delegate(x, y, z, args)
        };
        G__7849.cljs$lang$arity$variadic = G__7849__delegate;
        return G__7849
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
          var and__3822__auto____7820 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7820)) {
            var and__3822__auto____7821 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7821)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7821
            }
          }else {
            return and__3822__auto____7820
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7822 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7822)) {
            var and__3822__auto____7823 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7823)) {
              var and__3822__auto____7824 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7824)) {
                var and__3822__auto____7825 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7825)) {
                  var and__3822__auto____7826 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7826)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7826
                  }
                }else {
                  return and__3822__auto____7825
                }
              }else {
                return and__3822__auto____7824
              }
            }else {
              return and__3822__auto____7823
            }
          }else {
            return and__3822__auto____7822
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7827 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7827)) {
            var and__3822__auto____7828 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7828)) {
              var and__3822__auto____7829 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7829)) {
                var and__3822__auto____7830 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7830)) {
                  var and__3822__auto____7831 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7831)) {
                    var and__3822__auto____7832 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7832)) {
                      var and__3822__auto____7833 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7833)) {
                        var and__3822__auto____7834 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7834)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7834
                        }
                      }else {
                        return and__3822__auto____7833
                      }
                    }else {
                      return and__3822__auto____7832
                    }
                  }else {
                    return and__3822__auto____7831
                  }
                }else {
                  return and__3822__auto____7830
                }
              }else {
                return and__3822__auto____7829
              }
            }else {
              return and__3822__auto____7828
            }
          }else {
            return and__3822__auto____7827
          }
        }())
      };
      var ep3__4 = function() {
        var G__7851__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7835 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7835)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7647_SHARP_) {
                var and__3822__auto____7836 = p1.call(null, p1__7647_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7836)) {
                  var and__3822__auto____7837 = p2.call(null, p1__7647_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7837)) {
                    return p3.call(null, p1__7647_SHARP_)
                  }else {
                    return and__3822__auto____7837
                  }
                }else {
                  return and__3822__auto____7836
                }
              }, args)
            }else {
              return and__3822__auto____7835
            }
          }())
        };
        var G__7851 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7851__delegate.call(this, x, y, z, args)
        };
        G__7851.cljs$lang$maxFixedArity = 3;
        G__7851.cljs$lang$applyTo = function(arglist__7852) {
          var x = cljs.core.first(arglist__7852);
          var y = cljs.core.first(cljs.core.next(arglist__7852));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7852)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7852)));
          return G__7851__delegate(x, y, z, args)
        };
        G__7851.cljs$lang$arity$variadic = G__7851__delegate;
        return G__7851
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
    var G__7853__delegate = function(p1, p2, p3, ps) {
      var ps__7838 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7648_SHARP_) {
            return p1__7648_SHARP_.call(null, x)
          }, ps__7838)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7649_SHARP_) {
            var and__3822__auto____7843 = p1__7649_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7843)) {
              return p1__7649_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7843
            }
          }, ps__7838)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7650_SHARP_) {
            var and__3822__auto____7844 = p1__7650_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7844)) {
              var and__3822__auto____7845 = p1__7650_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7845)) {
                return p1__7650_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7845
              }
            }else {
              return and__3822__auto____7844
            }
          }, ps__7838)
        };
        var epn__4 = function() {
          var G__7854__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7846 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7846)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7651_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7651_SHARP_, args)
                }, ps__7838)
              }else {
                return and__3822__auto____7846
              }
            }())
          };
          var G__7854 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7854__delegate.call(this, x, y, z, args)
          };
          G__7854.cljs$lang$maxFixedArity = 3;
          G__7854.cljs$lang$applyTo = function(arglist__7855) {
            var x = cljs.core.first(arglist__7855);
            var y = cljs.core.first(cljs.core.next(arglist__7855));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7855)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7855)));
            return G__7854__delegate(x, y, z, args)
          };
          G__7854.cljs$lang$arity$variadic = G__7854__delegate;
          return G__7854
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
    var G__7853 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7853__delegate.call(this, p1, p2, p3, ps)
    };
    G__7853.cljs$lang$maxFixedArity = 3;
    G__7853.cljs$lang$applyTo = function(arglist__7856) {
      var p1 = cljs.core.first(arglist__7856);
      var p2 = cljs.core.first(cljs.core.next(arglist__7856));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7856)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7856)));
      return G__7853__delegate(p1, p2, p3, ps)
    };
    G__7853.cljs$lang$arity$variadic = G__7853__delegate;
    return G__7853
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
        var or__3824__auto____7937 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7937)) {
          return or__3824__auto____7937
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7938 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7938)) {
          return or__3824__auto____7938
        }else {
          var or__3824__auto____7939 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7939)) {
            return or__3824__auto____7939
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8008__delegate = function(x, y, z, args) {
          var or__3824__auto____7940 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7940)) {
            return or__3824__auto____7940
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8008 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8008__delegate.call(this, x, y, z, args)
        };
        G__8008.cljs$lang$maxFixedArity = 3;
        G__8008.cljs$lang$applyTo = function(arglist__8009) {
          var x = cljs.core.first(arglist__8009);
          var y = cljs.core.first(cljs.core.next(arglist__8009));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8009)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8009)));
          return G__8008__delegate(x, y, z, args)
        };
        G__8008.cljs$lang$arity$variadic = G__8008__delegate;
        return G__8008
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
        var or__3824__auto____7952 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7952)) {
          return or__3824__auto____7952
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7953 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7953)) {
          return or__3824__auto____7953
        }else {
          var or__3824__auto____7954 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7954)) {
            return or__3824__auto____7954
          }else {
            var or__3824__auto____7955 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7955)) {
              return or__3824__auto____7955
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7956 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7956)) {
          return or__3824__auto____7956
        }else {
          var or__3824__auto____7957 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7957)) {
            return or__3824__auto____7957
          }else {
            var or__3824__auto____7958 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7958)) {
              return or__3824__auto____7958
            }else {
              var or__3824__auto____7959 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7959)) {
                return or__3824__auto____7959
              }else {
                var or__3824__auto____7960 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7960)) {
                  return or__3824__auto____7960
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8010__delegate = function(x, y, z, args) {
          var or__3824__auto____7961 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7961)) {
            return or__3824__auto____7961
          }else {
            return cljs.core.some.call(null, function(p1__7691_SHARP_) {
              var or__3824__auto____7962 = p1.call(null, p1__7691_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7962)) {
                return or__3824__auto____7962
              }else {
                return p2.call(null, p1__7691_SHARP_)
              }
            }, args)
          }
        };
        var G__8010 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8010__delegate.call(this, x, y, z, args)
        };
        G__8010.cljs$lang$maxFixedArity = 3;
        G__8010.cljs$lang$applyTo = function(arglist__8011) {
          var x = cljs.core.first(arglist__8011);
          var y = cljs.core.first(cljs.core.next(arglist__8011));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8011)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8011)));
          return G__8010__delegate(x, y, z, args)
        };
        G__8010.cljs$lang$arity$variadic = G__8010__delegate;
        return G__8010
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
        var or__3824__auto____7981 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7981)) {
          return or__3824__auto____7981
        }else {
          var or__3824__auto____7982 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7982)) {
            return or__3824__auto____7982
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7983 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7983)) {
          return or__3824__auto____7983
        }else {
          var or__3824__auto____7984 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7984)) {
            return or__3824__auto____7984
          }else {
            var or__3824__auto____7985 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7985)) {
              return or__3824__auto____7985
            }else {
              var or__3824__auto____7986 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7986)) {
                return or__3824__auto____7986
              }else {
                var or__3824__auto____7987 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7987)) {
                  return or__3824__auto____7987
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____7988 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7988)) {
          return or__3824__auto____7988
        }else {
          var or__3824__auto____7989 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7989)) {
            return or__3824__auto____7989
          }else {
            var or__3824__auto____7990 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7990)) {
              return or__3824__auto____7990
            }else {
              var or__3824__auto____7991 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7991)) {
                return or__3824__auto____7991
              }else {
                var or__3824__auto____7992 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7992)) {
                  return or__3824__auto____7992
                }else {
                  var or__3824__auto____7993 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____7993)) {
                    return or__3824__auto____7993
                  }else {
                    var or__3824__auto____7994 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____7994)) {
                      return or__3824__auto____7994
                    }else {
                      var or__3824__auto____7995 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____7995)) {
                        return or__3824__auto____7995
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
        var G__8012__delegate = function(x, y, z, args) {
          var or__3824__auto____7996 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7996)) {
            return or__3824__auto____7996
          }else {
            return cljs.core.some.call(null, function(p1__7692_SHARP_) {
              var or__3824__auto____7997 = p1.call(null, p1__7692_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7997)) {
                return or__3824__auto____7997
              }else {
                var or__3824__auto____7998 = p2.call(null, p1__7692_SHARP_);
                if(cljs.core.truth_(or__3824__auto____7998)) {
                  return or__3824__auto____7998
                }else {
                  return p3.call(null, p1__7692_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8012 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8012__delegate.call(this, x, y, z, args)
        };
        G__8012.cljs$lang$maxFixedArity = 3;
        G__8012.cljs$lang$applyTo = function(arglist__8013) {
          var x = cljs.core.first(arglist__8013);
          var y = cljs.core.first(cljs.core.next(arglist__8013));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8013)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8013)));
          return G__8012__delegate(x, y, z, args)
        };
        G__8012.cljs$lang$arity$variadic = G__8012__delegate;
        return G__8012
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
    var G__8014__delegate = function(p1, p2, p3, ps) {
      var ps__7999 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7693_SHARP_) {
            return p1__7693_SHARP_.call(null, x)
          }, ps__7999)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7694_SHARP_) {
            var or__3824__auto____8004 = p1__7694_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8004)) {
              return or__3824__auto____8004
            }else {
              return p1__7694_SHARP_.call(null, y)
            }
          }, ps__7999)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7695_SHARP_) {
            var or__3824__auto____8005 = p1__7695_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8005)) {
              return or__3824__auto____8005
            }else {
              var or__3824__auto____8006 = p1__7695_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8006)) {
                return or__3824__auto____8006
              }else {
                return p1__7695_SHARP_.call(null, z)
              }
            }
          }, ps__7999)
        };
        var spn__4 = function() {
          var G__8015__delegate = function(x, y, z, args) {
            var or__3824__auto____8007 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8007)) {
              return or__3824__auto____8007
            }else {
              return cljs.core.some.call(null, function(p1__7696_SHARP_) {
                return cljs.core.some.call(null, p1__7696_SHARP_, args)
              }, ps__7999)
            }
          };
          var G__8015 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8015__delegate.call(this, x, y, z, args)
          };
          G__8015.cljs$lang$maxFixedArity = 3;
          G__8015.cljs$lang$applyTo = function(arglist__8016) {
            var x = cljs.core.first(arglist__8016);
            var y = cljs.core.first(cljs.core.next(arglist__8016));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8016)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8016)));
            return G__8015__delegate(x, y, z, args)
          };
          G__8015.cljs$lang$arity$variadic = G__8015__delegate;
          return G__8015
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
    var G__8014 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8014__delegate.call(this, p1, p2, p3, ps)
    };
    G__8014.cljs$lang$maxFixedArity = 3;
    G__8014.cljs$lang$applyTo = function(arglist__8017) {
      var p1 = cljs.core.first(arglist__8017);
      var p2 = cljs.core.first(cljs.core.next(arglist__8017));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8017)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8017)));
      return G__8014__delegate(p1, p2, p3, ps)
    };
    G__8014.cljs$lang$arity$variadic = G__8014__delegate;
    return G__8014
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
      var temp__3974__auto____8036 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8036) {
        var s__8037 = temp__3974__auto____8036;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8037)) {
          var c__8038 = cljs.core.chunk_first.call(null, s__8037);
          var size__8039 = cljs.core.count.call(null, c__8038);
          var b__8040 = cljs.core.chunk_buffer.call(null, size__8039);
          var n__2527__auto____8041 = size__8039;
          var i__8042 = 0;
          while(true) {
            if(i__8042 < n__2527__auto____8041) {
              cljs.core.chunk_append.call(null, b__8040, f.call(null, cljs.core._nth.call(null, c__8038, i__8042)));
              var G__8054 = i__8042 + 1;
              i__8042 = G__8054;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8040), map.call(null, f, cljs.core.chunk_rest.call(null, s__8037)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8037)), map.call(null, f, cljs.core.rest.call(null, s__8037)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8043 = cljs.core.seq.call(null, c1);
      var s2__8044 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8045 = s1__8043;
        if(and__3822__auto____8045) {
          return s2__8044
        }else {
          return and__3822__auto____8045
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8043), cljs.core.first.call(null, s2__8044)), map.call(null, f, cljs.core.rest.call(null, s1__8043), cljs.core.rest.call(null, s2__8044)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8046 = cljs.core.seq.call(null, c1);
      var s2__8047 = cljs.core.seq.call(null, c2);
      var s3__8048 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8049 = s1__8046;
        if(and__3822__auto____8049) {
          var and__3822__auto____8050 = s2__8047;
          if(and__3822__auto____8050) {
            return s3__8048
          }else {
            return and__3822__auto____8050
          }
        }else {
          return and__3822__auto____8049
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8046), cljs.core.first.call(null, s2__8047), cljs.core.first.call(null, s3__8048)), map.call(null, f, cljs.core.rest.call(null, s1__8046), cljs.core.rest.call(null, s2__8047), cljs.core.rest.call(null, s3__8048)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8055__delegate = function(f, c1, c2, c3, colls) {
      var step__8053 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8052 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8052)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8052), step.call(null, map.call(null, cljs.core.rest, ss__8052)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7857_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7857_SHARP_)
      }, step__8053.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8055 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8055__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8055.cljs$lang$maxFixedArity = 4;
    G__8055.cljs$lang$applyTo = function(arglist__8056) {
      var f = cljs.core.first(arglist__8056);
      var c1 = cljs.core.first(cljs.core.next(arglist__8056));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8056)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8056))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8056))));
      return G__8055__delegate(f, c1, c2, c3, colls)
    };
    G__8055.cljs$lang$arity$variadic = G__8055__delegate;
    return G__8055
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
      var temp__3974__auto____8059 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8059) {
        var s__8060 = temp__3974__auto____8059;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8060), take.call(null, n - 1, cljs.core.rest.call(null, s__8060)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8066 = function(n, coll) {
    while(true) {
      var s__8064 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8065 = n > 0;
        if(and__3822__auto____8065) {
          return s__8064
        }else {
          return and__3822__auto____8065
        }
      }())) {
        var G__8067 = n - 1;
        var G__8068 = cljs.core.rest.call(null, s__8064);
        n = G__8067;
        coll = G__8068;
        continue
      }else {
        return s__8064
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8066.call(null, n, coll)
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
  var s__8071 = cljs.core.seq.call(null, coll);
  var lead__8072 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8072) {
      var G__8073 = cljs.core.next.call(null, s__8071);
      var G__8074 = cljs.core.next.call(null, lead__8072);
      s__8071 = G__8073;
      lead__8072 = G__8074;
      continue
    }else {
      return s__8071
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8080 = function(pred, coll) {
    while(true) {
      var s__8078 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8079 = s__8078;
        if(and__3822__auto____8079) {
          return pred.call(null, cljs.core.first.call(null, s__8078))
        }else {
          return and__3822__auto____8079
        }
      }())) {
        var G__8081 = pred;
        var G__8082 = cljs.core.rest.call(null, s__8078);
        pred = G__8081;
        coll = G__8082;
        continue
      }else {
        return s__8078
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8080.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8085 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8085) {
      var s__8086 = temp__3974__auto____8085;
      return cljs.core.concat.call(null, s__8086, cycle.call(null, s__8086))
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
      var s1__8091 = cljs.core.seq.call(null, c1);
      var s2__8092 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8093 = s1__8091;
        if(and__3822__auto____8093) {
          return s2__8092
        }else {
          return and__3822__auto____8093
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8091), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8092), interleave.call(null, cljs.core.rest.call(null, s1__8091), cljs.core.rest.call(null, s2__8092))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8095__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8094 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8094)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8094), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8094)))
        }else {
          return null
        }
      }, null)
    };
    var G__8095 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8095__delegate.call(this, c1, c2, colls)
    };
    G__8095.cljs$lang$maxFixedArity = 2;
    G__8095.cljs$lang$applyTo = function(arglist__8096) {
      var c1 = cljs.core.first(arglist__8096);
      var c2 = cljs.core.first(cljs.core.next(arglist__8096));
      var colls = cljs.core.rest(cljs.core.next(arglist__8096));
      return G__8095__delegate(c1, c2, colls)
    };
    G__8095.cljs$lang$arity$variadic = G__8095__delegate;
    return G__8095
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
  var cat__8106 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8104 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8104) {
        var coll__8105 = temp__3971__auto____8104;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8105), cat.call(null, cljs.core.rest.call(null, coll__8105), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8106.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8107__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8107 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8107__delegate.call(this, f, coll, colls)
    };
    G__8107.cljs$lang$maxFixedArity = 2;
    G__8107.cljs$lang$applyTo = function(arglist__8108) {
      var f = cljs.core.first(arglist__8108);
      var coll = cljs.core.first(cljs.core.next(arglist__8108));
      var colls = cljs.core.rest(cljs.core.next(arglist__8108));
      return G__8107__delegate(f, coll, colls)
    };
    G__8107.cljs$lang$arity$variadic = G__8107__delegate;
    return G__8107
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
    var temp__3974__auto____8118 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8118) {
      var s__8119 = temp__3974__auto____8118;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8119)) {
        var c__8120 = cljs.core.chunk_first.call(null, s__8119);
        var size__8121 = cljs.core.count.call(null, c__8120);
        var b__8122 = cljs.core.chunk_buffer.call(null, size__8121);
        var n__2527__auto____8123 = size__8121;
        var i__8124 = 0;
        while(true) {
          if(i__8124 < n__2527__auto____8123) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8120, i__8124)))) {
              cljs.core.chunk_append.call(null, b__8122, cljs.core._nth.call(null, c__8120, i__8124))
            }else {
            }
            var G__8127 = i__8124 + 1;
            i__8124 = G__8127;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8122), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8119)))
      }else {
        var f__8125 = cljs.core.first.call(null, s__8119);
        var r__8126 = cljs.core.rest.call(null, s__8119);
        if(cljs.core.truth_(pred.call(null, f__8125))) {
          return cljs.core.cons.call(null, f__8125, filter.call(null, pred, r__8126))
        }else {
          return filter.call(null, pred, r__8126)
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
  var walk__8130 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8130.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8128_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8128_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8134__8135 = to;
    if(G__8134__8135) {
      if(function() {
        var or__3824__auto____8136 = G__8134__8135.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8136) {
          return or__3824__auto____8136
        }else {
          return G__8134__8135.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8134__8135.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8134__8135)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8134__8135)
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
    var G__8137__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8137 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8137__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8137.cljs$lang$maxFixedArity = 4;
    G__8137.cljs$lang$applyTo = function(arglist__8138) {
      var f = cljs.core.first(arglist__8138);
      var c1 = cljs.core.first(cljs.core.next(arglist__8138));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8138)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8138))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8138))));
      return G__8137__delegate(f, c1, c2, c3, colls)
    };
    G__8137.cljs$lang$arity$variadic = G__8137__delegate;
    return G__8137
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
      var temp__3974__auto____8145 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8145) {
        var s__8146 = temp__3974__auto____8145;
        var p__8147 = cljs.core.take.call(null, n, s__8146);
        if(n === cljs.core.count.call(null, p__8147)) {
          return cljs.core.cons.call(null, p__8147, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8146)))
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
      var temp__3974__auto____8148 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8148) {
        var s__8149 = temp__3974__auto____8148;
        var p__8150 = cljs.core.take.call(null, n, s__8149);
        if(n === cljs.core.count.call(null, p__8150)) {
          return cljs.core.cons.call(null, p__8150, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8149)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8150, pad)))
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
    var sentinel__8155 = cljs.core.lookup_sentinel;
    var m__8156 = m;
    var ks__8157 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8157) {
        var m__8158 = cljs.core._lookup.call(null, m__8156, cljs.core.first.call(null, ks__8157), sentinel__8155);
        if(sentinel__8155 === m__8158) {
          return not_found
        }else {
          var G__8159 = sentinel__8155;
          var G__8160 = m__8158;
          var G__8161 = cljs.core.next.call(null, ks__8157);
          sentinel__8155 = G__8159;
          m__8156 = G__8160;
          ks__8157 = G__8161;
          continue
        }
      }else {
        return m__8156
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
cljs.core.assoc_in = function assoc_in(m, p__8162, v) {
  var vec__8167__8168 = p__8162;
  var k__8169 = cljs.core.nth.call(null, vec__8167__8168, 0, null);
  var ks__8170 = cljs.core.nthnext.call(null, vec__8167__8168, 1);
  if(cljs.core.truth_(ks__8170)) {
    return cljs.core.assoc.call(null, m, k__8169, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8169, null), ks__8170, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8169, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8171, f, args) {
    var vec__8176__8177 = p__8171;
    var k__8178 = cljs.core.nth.call(null, vec__8176__8177, 0, null);
    var ks__8179 = cljs.core.nthnext.call(null, vec__8176__8177, 1);
    if(cljs.core.truth_(ks__8179)) {
      return cljs.core.assoc.call(null, m, k__8178, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8178, null), ks__8179, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8178, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8178, null), args))
    }
  };
  var update_in = function(m, p__8171, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8171, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8180) {
    var m = cljs.core.first(arglist__8180);
    var p__8171 = cljs.core.first(cljs.core.next(arglist__8180));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8180)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8180)));
    return update_in__delegate(m, p__8171, f, args)
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
  var this__8183 = this;
  var h__2192__auto____8184 = this__8183.__hash;
  if(!(h__2192__auto____8184 == null)) {
    return h__2192__auto____8184
  }else {
    var h__2192__auto____8185 = cljs.core.hash_coll.call(null, coll);
    this__8183.__hash = h__2192__auto____8185;
    return h__2192__auto____8185
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8186 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8187 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8188 = this;
  var new_array__8189 = this__8188.array.slice();
  new_array__8189[k] = v;
  return new cljs.core.Vector(this__8188.meta, new_array__8189, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8220 = null;
  var G__8220__2 = function(this_sym8190, k) {
    var this__8192 = this;
    var this_sym8190__8193 = this;
    var coll__8194 = this_sym8190__8193;
    return coll__8194.cljs$core$ILookup$_lookup$arity$2(coll__8194, k)
  };
  var G__8220__3 = function(this_sym8191, k, not_found) {
    var this__8192 = this;
    var this_sym8191__8195 = this;
    var coll__8196 = this_sym8191__8195;
    return coll__8196.cljs$core$ILookup$_lookup$arity$3(coll__8196, k, not_found)
  };
  G__8220 = function(this_sym8191, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8220__2.call(this, this_sym8191, k);
      case 3:
        return G__8220__3.call(this, this_sym8191, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8220
}();
cljs.core.Vector.prototype.apply = function(this_sym8181, args8182) {
  var this__8197 = this;
  return this_sym8181.call.apply(this_sym8181, [this_sym8181].concat(args8182.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8198 = this;
  var new_array__8199 = this__8198.array.slice();
  new_array__8199.push(o);
  return new cljs.core.Vector(this__8198.meta, new_array__8199, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8200 = this;
  var this__8201 = this;
  return cljs.core.pr_str.call(null, this__8201)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8202 = this;
  return cljs.core.ci_reduce.call(null, this__8202.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8203 = this;
  return cljs.core.ci_reduce.call(null, this__8203.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8204 = this;
  if(this__8204.array.length > 0) {
    var vector_seq__8205 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8204.array.length) {
          return cljs.core.cons.call(null, this__8204.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8205.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8206 = this;
  return this__8206.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8207 = this;
  var count__8208 = this__8207.array.length;
  if(count__8208 > 0) {
    return this__8207.array[count__8208 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8209 = this;
  if(this__8209.array.length > 0) {
    var new_array__8210 = this__8209.array.slice();
    new_array__8210.pop();
    return new cljs.core.Vector(this__8209.meta, new_array__8210, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8211 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8212 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8213 = this;
  return new cljs.core.Vector(meta, this__8213.array, this__8213.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8214 = this;
  return this__8214.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8215 = this;
  if(function() {
    var and__3822__auto____8216 = 0 <= n;
    if(and__3822__auto____8216) {
      return n < this__8215.array.length
    }else {
      return and__3822__auto____8216
    }
  }()) {
    return this__8215.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8217 = this;
  if(function() {
    var and__3822__auto____8218 = 0 <= n;
    if(and__3822__auto____8218) {
      return n < this__8217.array.length
    }else {
      return and__3822__auto____8218
    }
  }()) {
    return this__8217.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8219 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8219.meta)
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
  var cnt__8222 = pv.cnt;
  if(cnt__8222 < 32) {
    return 0
  }else {
    return cnt__8222 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8228 = level;
  var ret__8229 = node;
  while(true) {
    if(ll__8228 === 0) {
      return ret__8229
    }else {
      var embed__8230 = ret__8229;
      var r__8231 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8232 = cljs.core.pv_aset.call(null, r__8231, 0, embed__8230);
      var G__8233 = ll__8228 - 5;
      var G__8234 = r__8231;
      ll__8228 = G__8233;
      ret__8229 = G__8234;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8240 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8241 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8240, subidx__8241, tailnode);
    return ret__8240
  }else {
    var child__8242 = cljs.core.pv_aget.call(null, parent, subidx__8241);
    if(!(child__8242 == null)) {
      var node_to_insert__8243 = push_tail.call(null, pv, level - 5, child__8242, tailnode);
      cljs.core.pv_aset.call(null, ret__8240, subidx__8241, node_to_insert__8243);
      return ret__8240
    }else {
      var node_to_insert__8244 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8240, subidx__8241, node_to_insert__8244);
      return ret__8240
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8248 = 0 <= i;
    if(and__3822__auto____8248) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8248
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8249 = pv.root;
      var level__8250 = pv.shift;
      while(true) {
        if(level__8250 > 0) {
          var G__8251 = cljs.core.pv_aget.call(null, node__8249, i >>> level__8250 & 31);
          var G__8252 = level__8250 - 5;
          node__8249 = G__8251;
          level__8250 = G__8252;
          continue
        }else {
          return node__8249.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8255 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8255, i & 31, val);
    return ret__8255
  }else {
    var subidx__8256 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8255, subidx__8256, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8256), i, val));
    return ret__8255
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8262 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8263 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8262));
    if(function() {
      var and__3822__auto____8264 = new_child__8263 == null;
      if(and__3822__auto____8264) {
        return subidx__8262 === 0
      }else {
        return and__3822__auto____8264
      }
    }()) {
      return null
    }else {
      var ret__8265 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8265, subidx__8262, new_child__8263);
      return ret__8265
    }
  }else {
    if(subidx__8262 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8266 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8266, subidx__8262, null);
        return ret__8266
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
  var this__8269 = this;
  return new cljs.core.TransientVector(this__8269.cnt, this__8269.shift, cljs.core.tv_editable_root.call(null, this__8269.root), cljs.core.tv_editable_tail.call(null, this__8269.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8270 = this;
  var h__2192__auto____8271 = this__8270.__hash;
  if(!(h__2192__auto____8271 == null)) {
    return h__2192__auto____8271
  }else {
    var h__2192__auto____8272 = cljs.core.hash_coll.call(null, coll);
    this__8270.__hash = h__2192__auto____8272;
    return h__2192__auto____8272
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8273 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8274 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8275 = this;
  if(function() {
    var and__3822__auto____8276 = 0 <= k;
    if(and__3822__auto____8276) {
      return k < this__8275.cnt
    }else {
      return and__3822__auto____8276
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8277 = this__8275.tail.slice();
      new_tail__8277[k & 31] = v;
      return new cljs.core.PersistentVector(this__8275.meta, this__8275.cnt, this__8275.shift, this__8275.root, new_tail__8277, null)
    }else {
      return new cljs.core.PersistentVector(this__8275.meta, this__8275.cnt, this__8275.shift, cljs.core.do_assoc.call(null, coll, this__8275.shift, this__8275.root, k, v), this__8275.tail, null)
    }
  }else {
    if(k === this__8275.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8275.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8325 = null;
  var G__8325__2 = function(this_sym8278, k) {
    var this__8280 = this;
    var this_sym8278__8281 = this;
    var coll__8282 = this_sym8278__8281;
    return coll__8282.cljs$core$ILookup$_lookup$arity$2(coll__8282, k)
  };
  var G__8325__3 = function(this_sym8279, k, not_found) {
    var this__8280 = this;
    var this_sym8279__8283 = this;
    var coll__8284 = this_sym8279__8283;
    return coll__8284.cljs$core$ILookup$_lookup$arity$3(coll__8284, k, not_found)
  };
  G__8325 = function(this_sym8279, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8325__2.call(this, this_sym8279, k);
      case 3:
        return G__8325__3.call(this, this_sym8279, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8325
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8267, args8268) {
  var this__8285 = this;
  return this_sym8267.call.apply(this_sym8267, [this_sym8267].concat(args8268.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8286 = this;
  var step_init__8287 = [0, init];
  var i__8288 = 0;
  while(true) {
    if(i__8288 < this__8286.cnt) {
      var arr__8289 = cljs.core.array_for.call(null, v, i__8288);
      var len__8290 = arr__8289.length;
      var init__8294 = function() {
        var j__8291 = 0;
        var init__8292 = step_init__8287[1];
        while(true) {
          if(j__8291 < len__8290) {
            var init__8293 = f.call(null, init__8292, j__8291 + i__8288, arr__8289[j__8291]);
            if(cljs.core.reduced_QMARK_.call(null, init__8293)) {
              return init__8293
            }else {
              var G__8326 = j__8291 + 1;
              var G__8327 = init__8293;
              j__8291 = G__8326;
              init__8292 = G__8327;
              continue
            }
          }else {
            step_init__8287[0] = len__8290;
            step_init__8287[1] = init__8292;
            return init__8292
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8294)) {
        return cljs.core.deref.call(null, init__8294)
      }else {
        var G__8328 = i__8288 + step_init__8287[0];
        i__8288 = G__8328;
        continue
      }
    }else {
      return step_init__8287[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8295 = this;
  if(this__8295.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8296 = this__8295.tail.slice();
    new_tail__8296.push(o);
    return new cljs.core.PersistentVector(this__8295.meta, this__8295.cnt + 1, this__8295.shift, this__8295.root, new_tail__8296, null)
  }else {
    var root_overflow_QMARK___8297 = this__8295.cnt >>> 5 > 1 << this__8295.shift;
    var new_shift__8298 = root_overflow_QMARK___8297 ? this__8295.shift + 5 : this__8295.shift;
    var new_root__8300 = root_overflow_QMARK___8297 ? function() {
      var n_r__8299 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8299, 0, this__8295.root);
      cljs.core.pv_aset.call(null, n_r__8299, 1, cljs.core.new_path.call(null, null, this__8295.shift, new cljs.core.VectorNode(null, this__8295.tail)));
      return n_r__8299
    }() : cljs.core.push_tail.call(null, coll, this__8295.shift, this__8295.root, new cljs.core.VectorNode(null, this__8295.tail));
    return new cljs.core.PersistentVector(this__8295.meta, this__8295.cnt + 1, new_shift__8298, new_root__8300, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8301 = this;
  if(this__8301.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8301.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8302 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8303 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8304 = this;
  var this__8305 = this;
  return cljs.core.pr_str.call(null, this__8305)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8306 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8307 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8308 = this;
  if(this__8308.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8309 = this;
  return this__8309.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8310 = this;
  if(this__8310.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8310.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8311 = this;
  if(this__8311.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8311.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8311.meta)
    }else {
      if(1 < this__8311.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8311.meta, this__8311.cnt - 1, this__8311.shift, this__8311.root, this__8311.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8312 = cljs.core.array_for.call(null, coll, this__8311.cnt - 2);
          var nr__8313 = cljs.core.pop_tail.call(null, coll, this__8311.shift, this__8311.root);
          var new_root__8314 = nr__8313 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8313;
          var cnt_1__8315 = this__8311.cnt - 1;
          if(function() {
            var and__3822__auto____8316 = 5 < this__8311.shift;
            if(and__3822__auto____8316) {
              return cljs.core.pv_aget.call(null, new_root__8314, 1) == null
            }else {
              return and__3822__auto____8316
            }
          }()) {
            return new cljs.core.PersistentVector(this__8311.meta, cnt_1__8315, this__8311.shift - 5, cljs.core.pv_aget.call(null, new_root__8314, 0), new_tail__8312, null)
          }else {
            return new cljs.core.PersistentVector(this__8311.meta, cnt_1__8315, this__8311.shift, new_root__8314, new_tail__8312, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8317 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8318 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8319 = this;
  return new cljs.core.PersistentVector(meta, this__8319.cnt, this__8319.shift, this__8319.root, this__8319.tail, this__8319.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8320 = this;
  return this__8320.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8321 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8322 = this;
  if(function() {
    var and__3822__auto____8323 = 0 <= n;
    if(and__3822__auto____8323) {
      return n < this__8322.cnt
    }else {
      return and__3822__auto____8323
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8324 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8324.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8329 = xs.length;
  var xs__8330 = no_clone === true ? xs : xs.slice();
  if(l__8329 < 32) {
    return new cljs.core.PersistentVector(null, l__8329, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8330, null)
  }else {
    var node__8331 = xs__8330.slice(0, 32);
    var v__8332 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8331, null);
    var i__8333 = 32;
    var out__8334 = cljs.core._as_transient.call(null, v__8332);
    while(true) {
      if(i__8333 < l__8329) {
        var G__8335 = i__8333 + 1;
        var G__8336 = cljs.core.conj_BANG_.call(null, out__8334, xs__8330[i__8333]);
        i__8333 = G__8335;
        out__8334 = G__8336;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8334)
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
  vector.cljs$lang$applyTo = function(arglist__8337) {
    var args = cljs.core.seq(arglist__8337);
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
  var this__8338 = this;
  if(this__8338.off + 1 < this__8338.node.length) {
    var s__8339 = cljs.core.chunked_seq.call(null, this__8338.vec, this__8338.node, this__8338.i, this__8338.off + 1);
    if(s__8339 == null) {
      return null
    }else {
      return s__8339
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8340 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8341 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8342 = this;
  return this__8342.node[this__8342.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8343 = this;
  if(this__8343.off + 1 < this__8343.node.length) {
    var s__8344 = cljs.core.chunked_seq.call(null, this__8343.vec, this__8343.node, this__8343.i, this__8343.off + 1);
    if(s__8344 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8344
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8345 = this;
  var l__8346 = this__8345.node.length;
  var s__8347 = this__8345.i + l__8346 < cljs.core._count.call(null, this__8345.vec) ? cljs.core.chunked_seq.call(null, this__8345.vec, this__8345.i + l__8346, 0) : null;
  if(s__8347 == null) {
    return null
  }else {
    return s__8347
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8348 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8349 = this;
  return cljs.core.chunked_seq.call(null, this__8349.vec, this__8349.node, this__8349.i, this__8349.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8350 = this;
  return this__8350.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8351 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8351.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8352 = this;
  return cljs.core.array_chunk.call(null, this__8352.node, this__8352.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8353 = this;
  var l__8354 = this__8353.node.length;
  var s__8355 = this__8353.i + l__8354 < cljs.core._count.call(null, this__8353.vec) ? cljs.core.chunked_seq.call(null, this__8353.vec, this__8353.i + l__8354, 0) : null;
  if(s__8355 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8355
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
  var this__8358 = this;
  var h__2192__auto____8359 = this__8358.__hash;
  if(!(h__2192__auto____8359 == null)) {
    return h__2192__auto____8359
  }else {
    var h__2192__auto____8360 = cljs.core.hash_coll.call(null, coll);
    this__8358.__hash = h__2192__auto____8360;
    return h__2192__auto____8360
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8361 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8362 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8363 = this;
  var v_pos__8364 = this__8363.start + key;
  return new cljs.core.Subvec(this__8363.meta, cljs.core._assoc.call(null, this__8363.v, v_pos__8364, val), this__8363.start, this__8363.end > v_pos__8364 + 1 ? this__8363.end : v_pos__8364 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8390 = null;
  var G__8390__2 = function(this_sym8365, k) {
    var this__8367 = this;
    var this_sym8365__8368 = this;
    var coll__8369 = this_sym8365__8368;
    return coll__8369.cljs$core$ILookup$_lookup$arity$2(coll__8369, k)
  };
  var G__8390__3 = function(this_sym8366, k, not_found) {
    var this__8367 = this;
    var this_sym8366__8370 = this;
    var coll__8371 = this_sym8366__8370;
    return coll__8371.cljs$core$ILookup$_lookup$arity$3(coll__8371, k, not_found)
  };
  G__8390 = function(this_sym8366, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8390__2.call(this, this_sym8366, k);
      case 3:
        return G__8390__3.call(this, this_sym8366, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8390
}();
cljs.core.Subvec.prototype.apply = function(this_sym8356, args8357) {
  var this__8372 = this;
  return this_sym8356.call.apply(this_sym8356, [this_sym8356].concat(args8357.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8373 = this;
  return new cljs.core.Subvec(this__8373.meta, cljs.core._assoc_n.call(null, this__8373.v, this__8373.end, o), this__8373.start, this__8373.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8374 = this;
  var this__8375 = this;
  return cljs.core.pr_str.call(null, this__8375)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8376 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8377 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8378 = this;
  var subvec_seq__8379 = function subvec_seq(i) {
    if(i === this__8378.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8378.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8379.call(null, this__8378.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8380 = this;
  return this__8380.end - this__8380.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8381 = this;
  return cljs.core._nth.call(null, this__8381.v, this__8381.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8382 = this;
  if(this__8382.start === this__8382.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8382.meta, this__8382.v, this__8382.start, this__8382.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8383 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8384 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8385 = this;
  return new cljs.core.Subvec(meta, this__8385.v, this__8385.start, this__8385.end, this__8385.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8386 = this;
  return this__8386.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8387 = this;
  return cljs.core._nth.call(null, this__8387.v, this__8387.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8388 = this;
  return cljs.core._nth.call(null, this__8388.v, this__8388.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8389 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8389.meta)
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
  var ret__8392 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8392, 0, tl.length);
  return ret__8392
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8396 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8397 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8396, subidx__8397, level === 5 ? tail_node : function() {
    var child__8398 = cljs.core.pv_aget.call(null, ret__8396, subidx__8397);
    if(!(child__8398 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8398, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8396
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8403 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8404 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8405 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8403, subidx__8404));
    if(function() {
      var and__3822__auto____8406 = new_child__8405 == null;
      if(and__3822__auto____8406) {
        return subidx__8404 === 0
      }else {
        return and__3822__auto____8406
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8403, subidx__8404, new_child__8405);
      return node__8403
    }
  }else {
    if(subidx__8404 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8403, subidx__8404, null);
        return node__8403
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8411 = 0 <= i;
    if(and__3822__auto____8411) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8411
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8412 = tv.root;
      var node__8413 = root__8412;
      var level__8414 = tv.shift;
      while(true) {
        if(level__8414 > 0) {
          var G__8415 = cljs.core.tv_ensure_editable.call(null, root__8412.edit, cljs.core.pv_aget.call(null, node__8413, i >>> level__8414 & 31));
          var G__8416 = level__8414 - 5;
          node__8413 = G__8415;
          level__8414 = G__8416;
          continue
        }else {
          return node__8413.arr
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
  var G__8456 = null;
  var G__8456__2 = function(this_sym8419, k) {
    var this__8421 = this;
    var this_sym8419__8422 = this;
    var coll__8423 = this_sym8419__8422;
    return coll__8423.cljs$core$ILookup$_lookup$arity$2(coll__8423, k)
  };
  var G__8456__3 = function(this_sym8420, k, not_found) {
    var this__8421 = this;
    var this_sym8420__8424 = this;
    var coll__8425 = this_sym8420__8424;
    return coll__8425.cljs$core$ILookup$_lookup$arity$3(coll__8425, k, not_found)
  };
  G__8456 = function(this_sym8420, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8456__2.call(this, this_sym8420, k);
      case 3:
        return G__8456__3.call(this, this_sym8420, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8456
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8417, args8418) {
  var this__8426 = this;
  return this_sym8417.call.apply(this_sym8417, [this_sym8417].concat(args8418.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8427 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8428 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8429 = this;
  if(this__8429.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8430 = this;
  if(function() {
    var and__3822__auto____8431 = 0 <= n;
    if(and__3822__auto____8431) {
      return n < this__8430.cnt
    }else {
      return and__3822__auto____8431
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8432 = this;
  if(this__8432.root.edit) {
    return this__8432.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8433 = this;
  if(this__8433.root.edit) {
    if(function() {
      var and__3822__auto____8434 = 0 <= n;
      if(and__3822__auto____8434) {
        return n < this__8433.cnt
      }else {
        return and__3822__auto____8434
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8433.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8439 = function go(level, node) {
          var node__8437 = cljs.core.tv_ensure_editable.call(null, this__8433.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8437, n & 31, val);
            return node__8437
          }else {
            var subidx__8438 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8437, subidx__8438, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8437, subidx__8438)));
            return node__8437
          }
        }.call(null, this__8433.shift, this__8433.root);
        this__8433.root = new_root__8439;
        return tcoll
      }
    }else {
      if(n === this__8433.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8433.cnt)].join(""));
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
  var this__8440 = this;
  if(this__8440.root.edit) {
    if(this__8440.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8440.cnt) {
        this__8440.cnt = 0;
        return tcoll
      }else {
        if((this__8440.cnt - 1 & 31) > 0) {
          this__8440.cnt = this__8440.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8441 = cljs.core.editable_array_for.call(null, tcoll, this__8440.cnt - 2);
            var new_root__8443 = function() {
              var nr__8442 = cljs.core.tv_pop_tail.call(null, tcoll, this__8440.shift, this__8440.root);
              if(!(nr__8442 == null)) {
                return nr__8442
              }else {
                return new cljs.core.VectorNode(this__8440.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8444 = 5 < this__8440.shift;
              if(and__3822__auto____8444) {
                return cljs.core.pv_aget.call(null, new_root__8443, 1) == null
              }else {
                return and__3822__auto____8444
              }
            }()) {
              var new_root__8445 = cljs.core.tv_ensure_editable.call(null, this__8440.root.edit, cljs.core.pv_aget.call(null, new_root__8443, 0));
              this__8440.root = new_root__8445;
              this__8440.shift = this__8440.shift - 5;
              this__8440.cnt = this__8440.cnt - 1;
              this__8440.tail = new_tail__8441;
              return tcoll
            }else {
              this__8440.root = new_root__8443;
              this__8440.cnt = this__8440.cnt - 1;
              this__8440.tail = new_tail__8441;
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
  var this__8446 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8447 = this;
  if(this__8447.root.edit) {
    if(this__8447.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8447.tail[this__8447.cnt & 31] = o;
      this__8447.cnt = this__8447.cnt + 1;
      return tcoll
    }else {
      var tail_node__8448 = new cljs.core.VectorNode(this__8447.root.edit, this__8447.tail);
      var new_tail__8449 = cljs.core.make_array.call(null, 32);
      new_tail__8449[0] = o;
      this__8447.tail = new_tail__8449;
      if(this__8447.cnt >>> 5 > 1 << this__8447.shift) {
        var new_root_array__8450 = cljs.core.make_array.call(null, 32);
        var new_shift__8451 = this__8447.shift + 5;
        new_root_array__8450[0] = this__8447.root;
        new_root_array__8450[1] = cljs.core.new_path.call(null, this__8447.root.edit, this__8447.shift, tail_node__8448);
        this__8447.root = new cljs.core.VectorNode(this__8447.root.edit, new_root_array__8450);
        this__8447.shift = new_shift__8451;
        this__8447.cnt = this__8447.cnt + 1;
        return tcoll
      }else {
        var new_root__8452 = cljs.core.tv_push_tail.call(null, tcoll, this__8447.shift, this__8447.root, tail_node__8448);
        this__8447.root = new_root__8452;
        this__8447.cnt = this__8447.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8453 = this;
  if(this__8453.root.edit) {
    this__8453.root.edit = null;
    var len__8454 = this__8453.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8455 = cljs.core.make_array.call(null, len__8454);
    cljs.core.array_copy.call(null, this__8453.tail, 0, trimmed_tail__8455, 0, len__8454);
    return new cljs.core.PersistentVector(null, this__8453.cnt, this__8453.shift, this__8453.root, trimmed_tail__8455, null)
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
  var this__8457 = this;
  var h__2192__auto____8458 = this__8457.__hash;
  if(!(h__2192__auto____8458 == null)) {
    return h__2192__auto____8458
  }else {
    var h__2192__auto____8459 = cljs.core.hash_coll.call(null, coll);
    this__8457.__hash = h__2192__auto____8459;
    return h__2192__auto____8459
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8460 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8461 = this;
  var this__8462 = this;
  return cljs.core.pr_str.call(null, this__8462)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8463 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8464 = this;
  return cljs.core._first.call(null, this__8464.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8465 = this;
  var temp__3971__auto____8466 = cljs.core.next.call(null, this__8465.front);
  if(temp__3971__auto____8466) {
    var f1__8467 = temp__3971__auto____8466;
    return new cljs.core.PersistentQueueSeq(this__8465.meta, f1__8467, this__8465.rear, null)
  }else {
    if(this__8465.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8465.meta, this__8465.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8468 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8469 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8469.front, this__8469.rear, this__8469.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8470 = this;
  return this__8470.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8471 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8471.meta)
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
  var this__8472 = this;
  var h__2192__auto____8473 = this__8472.__hash;
  if(!(h__2192__auto____8473 == null)) {
    return h__2192__auto____8473
  }else {
    var h__2192__auto____8474 = cljs.core.hash_coll.call(null, coll);
    this__8472.__hash = h__2192__auto____8474;
    return h__2192__auto____8474
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8475 = this;
  if(cljs.core.truth_(this__8475.front)) {
    return new cljs.core.PersistentQueue(this__8475.meta, this__8475.count + 1, this__8475.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8476 = this__8475.rear;
      if(cljs.core.truth_(or__3824__auto____8476)) {
        return or__3824__auto____8476
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8475.meta, this__8475.count + 1, cljs.core.conj.call(null, this__8475.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8477 = this;
  var this__8478 = this;
  return cljs.core.pr_str.call(null, this__8478)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8479 = this;
  var rear__8480 = cljs.core.seq.call(null, this__8479.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8481 = this__8479.front;
    if(cljs.core.truth_(or__3824__auto____8481)) {
      return or__3824__auto____8481
    }else {
      return rear__8480
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8479.front, cljs.core.seq.call(null, rear__8480), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8482 = this;
  return this__8482.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8483 = this;
  return cljs.core._first.call(null, this__8483.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8484 = this;
  if(cljs.core.truth_(this__8484.front)) {
    var temp__3971__auto____8485 = cljs.core.next.call(null, this__8484.front);
    if(temp__3971__auto____8485) {
      var f1__8486 = temp__3971__auto____8485;
      return new cljs.core.PersistentQueue(this__8484.meta, this__8484.count - 1, f1__8486, this__8484.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8484.meta, this__8484.count - 1, cljs.core.seq.call(null, this__8484.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8487 = this;
  return cljs.core.first.call(null, this__8487.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8488 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8489 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8490 = this;
  return new cljs.core.PersistentQueue(meta, this__8490.count, this__8490.front, this__8490.rear, this__8490.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8491 = this;
  return this__8491.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8492 = this;
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
  var this__8493 = this;
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
  var len__8496 = array.length;
  var i__8497 = 0;
  while(true) {
    if(i__8497 < len__8496) {
      if(k === array[i__8497]) {
        return i__8497
      }else {
        var G__8498 = i__8497 + incr;
        i__8497 = G__8498;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8501 = cljs.core.hash.call(null, a);
  var b__8502 = cljs.core.hash.call(null, b);
  if(a__8501 < b__8502) {
    return-1
  }else {
    if(a__8501 > b__8502) {
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
  var ks__8510 = m.keys;
  var len__8511 = ks__8510.length;
  var so__8512 = m.strobj;
  var out__8513 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8514 = 0;
  var out__8515 = cljs.core.transient$.call(null, out__8513);
  while(true) {
    if(i__8514 < len__8511) {
      var k__8516 = ks__8510[i__8514];
      var G__8517 = i__8514 + 1;
      var G__8518 = cljs.core.assoc_BANG_.call(null, out__8515, k__8516, so__8512[k__8516]);
      i__8514 = G__8517;
      out__8515 = G__8518;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8515, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8524 = {};
  var l__8525 = ks.length;
  var i__8526 = 0;
  while(true) {
    if(i__8526 < l__8525) {
      var k__8527 = ks[i__8526];
      new_obj__8524[k__8527] = obj[k__8527];
      var G__8528 = i__8526 + 1;
      i__8526 = G__8528;
      continue
    }else {
    }
    break
  }
  return new_obj__8524
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
  var this__8531 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8532 = this;
  var h__2192__auto____8533 = this__8532.__hash;
  if(!(h__2192__auto____8533 == null)) {
    return h__2192__auto____8533
  }else {
    var h__2192__auto____8534 = cljs.core.hash_imap.call(null, coll);
    this__8532.__hash = h__2192__auto____8534;
    return h__2192__auto____8534
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8535 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8536 = this;
  if(function() {
    var and__3822__auto____8537 = goog.isString(k);
    if(and__3822__auto____8537) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8536.keys) == null)
    }else {
      return and__3822__auto____8537
    }
  }()) {
    return this__8536.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8538 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8539 = this__8538.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8539) {
        return or__3824__auto____8539
      }else {
        return this__8538.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8538.keys) == null)) {
        var new_strobj__8540 = cljs.core.obj_clone.call(null, this__8538.strobj, this__8538.keys);
        new_strobj__8540[k] = v;
        return new cljs.core.ObjMap(this__8538.meta, this__8538.keys, new_strobj__8540, this__8538.update_count + 1, null)
      }else {
        var new_strobj__8541 = cljs.core.obj_clone.call(null, this__8538.strobj, this__8538.keys);
        var new_keys__8542 = this__8538.keys.slice();
        new_strobj__8541[k] = v;
        new_keys__8542.push(k);
        return new cljs.core.ObjMap(this__8538.meta, new_keys__8542, new_strobj__8541, this__8538.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8543 = this;
  if(function() {
    var and__3822__auto____8544 = goog.isString(k);
    if(and__3822__auto____8544) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8543.keys) == null)
    }else {
      return and__3822__auto____8544
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8566 = null;
  var G__8566__2 = function(this_sym8545, k) {
    var this__8547 = this;
    var this_sym8545__8548 = this;
    var coll__8549 = this_sym8545__8548;
    return coll__8549.cljs$core$ILookup$_lookup$arity$2(coll__8549, k)
  };
  var G__8566__3 = function(this_sym8546, k, not_found) {
    var this__8547 = this;
    var this_sym8546__8550 = this;
    var coll__8551 = this_sym8546__8550;
    return coll__8551.cljs$core$ILookup$_lookup$arity$3(coll__8551, k, not_found)
  };
  G__8566 = function(this_sym8546, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8566__2.call(this, this_sym8546, k);
      case 3:
        return G__8566__3.call(this, this_sym8546, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8566
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8529, args8530) {
  var this__8552 = this;
  return this_sym8529.call.apply(this_sym8529, [this_sym8529].concat(args8530.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8553 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8554 = this;
  var this__8555 = this;
  return cljs.core.pr_str.call(null, this__8555)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8556 = this;
  if(this__8556.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8519_SHARP_) {
      return cljs.core.vector.call(null, p1__8519_SHARP_, this__8556.strobj[p1__8519_SHARP_])
    }, this__8556.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8557 = this;
  return this__8557.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8558 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8559 = this;
  return new cljs.core.ObjMap(meta, this__8559.keys, this__8559.strobj, this__8559.update_count, this__8559.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8560 = this;
  return this__8560.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8561 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8561.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8562 = this;
  if(function() {
    var and__3822__auto____8563 = goog.isString(k);
    if(and__3822__auto____8563) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8562.keys) == null)
    }else {
      return and__3822__auto____8563
    }
  }()) {
    var new_keys__8564 = this__8562.keys.slice();
    var new_strobj__8565 = cljs.core.obj_clone.call(null, this__8562.strobj, this__8562.keys);
    new_keys__8564.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8564), 1);
    cljs.core.js_delete.call(null, new_strobj__8565, k);
    return new cljs.core.ObjMap(this__8562.meta, new_keys__8564, new_strobj__8565, this__8562.update_count + 1, null)
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
  var this__8570 = this;
  var h__2192__auto____8571 = this__8570.__hash;
  if(!(h__2192__auto____8571 == null)) {
    return h__2192__auto____8571
  }else {
    var h__2192__auto____8572 = cljs.core.hash_imap.call(null, coll);
    this__8570.__hash = h__2192__auto____8572;
    return h__2192__auto____8572
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8573 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8574 = this;
  var bucket__8575 = this__8574.hashobj[cljs.core.hash.call(null, k)];
  var i__8576 = cljs.core.truth_(bucket__8575) ? cljs.core.scan_array.call(null, 2, k, bucket__8575) : null;
  if(cljs.core.truth_(i__8576)) {
    return bucket__8575[i__8576 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8577 = this;
  var h__8578 = cljs.core.hash.call(null, k);
  var bucket__8579 = this__8577.hashobj[h__8578];
  if(cljs.core.truth_(bucket__8579)) {
    var new_bucket__8580 = bucket__8579.slice();
    var new_hashobj__8581 = goog.object.clone(this__8577.hashobj);
    new_hashobj__8581[h__8578] = new_bucket__8580;
    var temp__3971__auto____8582 = cljs.core.scan_array.call(null, 2, k, new_bucket__8580);
    if(cljs.core.truth_(temp__3971__auto____8582)) {
      var i__8583 = temp__3971__auto____8582;
      new_bucket__8580[i__8583 + 1] = v;
      return new cljs.core.HashMap(this__8577.meta, this__8577.count, new_hashobj__8581, null)
    }else {
      new_bucket__8580.push(k, v);
      return new cljs.core.HashMap(this__8577.meta, this__8577.count + 1, new_hashobj__8581, null)
    }
  }else {
    var new_hashobj__8584 = goog.object.clone(this__8577.hashobj);
    new_hashobj__8584[h__8578] = [k, v];
    return new cljs.core.HashMap(this__8577.meta, this__8577.count + 1, new_hashobj__8584, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8585 = this;
  var bucket__8586 = this__8585.hashobj[cljs.core.hash.call(null, k)];
  var i__8587 = cljs.core.truth_(bucket__8586) ? cljs.core.scan_array.call(null, 2, k, bucket__8586) : null;
  if(cljs.core.truth_(i__8587)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8612 = null;
  var G__8612__2 = function(this_sym8588, k) {
    var this__8590 = this;
    var this_sym8588__8591 = this;
    var coll__8592 = this_sym8588__8591;
    return coll__8592.cljs$core$ILookup$_lookup$arity$2(coll__8592, k)
  };
  var G__8612__3 = function(this_sym8589, k, not_found) {
    var this__8590 = this;
    var this_sym8589__8593 = this;
    var coll__8594 = this_sym8589__8593;
    return coll__8594.cljs$core$ILookup$_lookup$arity$3(coll__8594, k, not_found)
  };
  G__8612 = function(this_sym8589, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8612__2.call(this, this_sym8589, k);
      case 3:
        return G__8612__3.call(this, this_sym8589, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8612
}();
cljs.core.HashMap.prototype.apply = function(this_sym8568, args8569) {
  var this__8595 = this;
  return this_sym8568.call.apply(this_sym8568, [this_sym8568].concat(args8569.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8596 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8597 = this;
  var this__8598 = this;
  return cljs.core.pr_str.call(null, this__8598)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8599 = this;
  if(this__8599.count > 0) {
    var hashes__8600 = cljs.core.js_keys.call(null, this__8599.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8567_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8599.hashobj[p1__8567_SHARP_]))
    }, hashes__8600)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8601 = this;
  return this__8601.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8602 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8603 = this;
  return new cljs.core.HashMap(meta, this__8603.count, this__8603.hashobj, this__8603.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8604 = this;
  return this__8604.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8605 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8605.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8606 = this;
  var h__8607 = cljs.core.hash.call(null, k);
  var bucket__8608 = this__8606.hashobj[h__8607];
  var i__8609 = cljs.core.truth_(bucket__8608) ? cljs.core.scan_array.call(null, 2, k, bucket__8608) : null;
  if(cljs.core.not.call(null, i__8609)) {
    return coll
  }else {
    var new_hashobj__8610 = goog.object.clone(this__8606.hashobj);
    if(3 > bucket__8608.length) {
      cljs.core.js_delete.call(null, new_hashobj__8610, h__8607)
    }else {
      var new_bucket__8611 = bucket__8608.slice();
      new_bucket__8611.splice(i__8609, 2);
      new_hashobj__8610[h__8607] = new_bucket__8611
    }
    return new cljs.core.HashMap(this__8606.meta, this__8606.count - 1, new_hashobj__8610, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8613 = ks.length;
  var i__8614 = 0;
  var out__8615 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8614 < len__8613) {
      var G__8616 = i__8614 + 1;
      var G__8617 = cljs.core.assoc.call(null, out__8615, ks[i__8614], vs[i__8614]);
      i__8614 = G__8616;
      out__8615 = G__8617;
      continue
    }else {
      return out__8615
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8621 = m.arr;
  var len__8622 = arr__8621.length;
  var i__8623 = 0;
  while(true) {
    if(len__8622 <= i__8623) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8621[i__8623], k)) {
        return i__8623
      }else {
        if("\ufdd0'else") {
          var G__8624 = i__8623 + 2;
          i__8623 = G__8624;
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
  var this__8627 = this;
  return new cljs.core.TransientArrayMap({}, this__8627.arr.length, this__8627.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8628 = this;
  var h__2192__auto____8629 = this__8628.__hash;
  if(!(h__2192__auto____8629 == null)) {
    return h__2192__auto____8629
  }else {
    var h__2192__auto____8630 = cljs.core.hash_imap.call(null, coll);
    this__8628.__hash = h__2192__auto____8630;
    return h__2192__auto____8630
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8631 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8632 = this;
  var idx__8633 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8633 === -1) {
    return not_found
  }else {
    return this__8632.arr[idx__8633 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8634 = this;
  var idx__8635 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8635 === -1) {
    if(this__8634.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8634.meta, this__8634.cnt + 1, function() {
        var G__8636__8637 = this__8634.arr.slice();
        G__8636__8637.push(k);
        G__8636__8637.push(v);
        return G__8636__8637
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8634.arr[idx__8635 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8634.meta, this__8634.cnt, function() {
          var G__8638__8639 = this__8634.arr.slice();
          G__8638__8639[idx__8635 + 1] = v;
          return G__8638__8639
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8640 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8672 = null;
  var G__8672__2 = function(this_sym8641, k) {
    var this__8643 = this;
    var this_sym8641__8644 = this;
    var coll__8645 = this_sym8641__8644;
    return coll__8645.cljs$core$ILookup$_lookup$arity$2(coll__8645, k)
  };
  var G__8672__3 = function(this_sym8642, k, not_found) {
    var this__8643 = this;
    var this_sym8642__8646 = this;
    var coll__8647 = this_sym8642__8646;
    return coll__8647.cljs$core$ILookup$_lookup$arity$3(coll__8647, k, not_found)
  };
  G__8672 = function(this_sym8642, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8672__2.call(this, this_sym8642, k);
      case 3:
        return G__8672__3.call(this, this_sym8642, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8672
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8625, args8626) {
  var this__8648 = this;
  return this_sym8625.call.apply(this_sym8625, [this_sym8625].concat(args8626.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8649 = this;
  var len__8650 = this__8649.arr.length;
  var i__8651 = 0;
  var init__8652 = init;
  while(true) {
    if(i__8651 < len__8650) {
      var init__8653 = f.call(null, init__8652, this__8649.arr[i__8651], this__8649.arr[i__8651 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8653)) {
        return cljs.core.deref.call(null, init__8653)
      }else {
        var G__8673 = i__8651 + 2;
        var G__8674 = init__8653;
        i__8651 = G__8673;
        init__8652 = G__8674;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8654 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8655 = this;
  var this__8656 = this;
  return cljs.core.pr_str.call(null, this__8656)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8657 = this;
  if(this__8657.cnt > 0) {
    var len__8658 = this__8657.arr.length;
    var array_map_seq__8659 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8658) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8657.arr[i], this__8657.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8659.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8660 = this;
  return this__8660.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8661 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8662 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8662.cnt, this__8662.arr, this__8662.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8663 = this;
  return this__8663.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8664 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8664.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8665 = this;
  var idx__8666 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8666 >= 0) {
    var len__8667 = this__8665.arr.length;
    var new_len__8668 = len__8667 - 2;
    if(new_len__8668 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8669 = cljs.core.make_array.call(null, new_len__8668);
      var s__8670 = 0;
      var d__8671 = 0;
      while(true) {
        if(s__8670 >= len__8667) {
          return new cljs.core.PersistentArrayMap(this__8665.meta, this__8665.cnt - 1, new_arr__8669, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8665.arr[s__8670])) {
            var G__8675 = s__8670 + 2;
            var G__8676 = d__8671;
            s__8670 = G__8675;
            d__8671 = G__8676;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8669[d__8671] = this__8665.arr[s__8670];
              new_arr__8669[d__8671 + 1] = this__8665.arr[s__8670 + 1];
              var G__8677 = s__8670 + 2;
              var G__8678 = d__8671 + 2;
              s__8670 = G__8677;
              d__8671 = G__8678;
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
  var len__8679 = cljs.core.count.call(null, ks);
  var i__8680 = 0;
  var out__8681 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8680 < len__8679) {
      var G__8682 = i__8680 + 1;
      var G__8683 = cljs.core.assoc_BANG_.call(null, out__8681, ks[i__8680], vs[i__8680]);
      i__8680 = G__8682;
      out__8681 = G__8683;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8681)
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
  var this__8684 = this;
  if(cljs.core.truth_(this__8684.editable_QMARK_)) {
    var idx__8685 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8685 >= 0) {
      this__8684.arr[idx__8685] = this__8684.arr[this__8684.len - 2];
      this__8684.arr[idx__8685 + 1] = this__8684.arr[this__8684.len - 1];
      var G__8686__8687 = this__8684.arr;
      G__8686__8687.pop();
      G__8686__8687.pop();
      G__8686__8687;
      this__8684.len = this__8684.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8688 = this;
  if(cljs.core.truth_(this__8688.editable_QMARK_)) {
    var idx__8689 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8689 === -1) {
      if(this__8688.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8688.len = this__8688.len + 2;
        this__8688.arr.push(key);
        this__8688.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8688.len, this__8688.arr), key, val)
      }
    }else {
      if(val === this__8688.arr[idx__8689 + 1]) {
        return tcoll
      }else {
        this__8688.arr[idx__8689 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8690 = this;
  if(cljs.core.truth_(this__8690.editable_QMARK_)) {
    if(function() {
      var G__8691__8692 = o;
      if(G__8691__8692) {
        if(function() {
          var or__3824__auto____8693 = G__8691__8692.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8693) {
            return or__3824__auto____8693
          }else {
            return G__8691__8692.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8691__8692.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8691__8692)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8691__8692)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8694 = cljs.core.seq.call(null, o);
      var tcoll__8695 = tcoll;
      while(true) {
        var temp__3971__auto____8696 = cljs.core.first.call(null, es__8694);
        if(cljs.core.truth_(temp__3971__auto____8696)) {
          var e__8697 = temp__3971__auto____8696;
          var G__8703 = cljs.core.next.call(null, es__8694);
          var G__8704 = tcoll__8695.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8695, cljs.core.key.call(null, e__8697), cljs.core.val.call(null, e__8697));
          es__8694 = G__8703;
          tcoll__8695 = G__8704;
          continue
        }else {
          return tcoll__8695
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8698 = this;
  if(cljs.core.truth_(this__8698.editable_QMARK_)) {
    this__8698.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8698.len, 2), this__8698.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8699 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8700 = this;
  if(cljs.core.truth_(this__8700.editable_QMARK_)) {
    var idx__8701 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8701 === -1) {
      return not_found
    }else {
      return this__8700.arr[idx__8701 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8702 = this;
  if(cljs.core.truth_(this__8702.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8702.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8707 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8708 = 0;
  while(true) {
    if(i__8708 < len) {
      var G__8709 = cljs.core.assoc_BANG_.call(null, out__8707, arr[i__8708], arr[i__8708 + 1]);
      var G__8710 = i__8708 + 2;
      out__8707 = G__8709;
      i__8708 = G__8710;
      continue
    }else {
      return out__8707
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
    var G__8715__8716 = arr.slice();
    G__8715__8716[i] = a;
    return G__8715__8716
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8717__8718 = arr.slice();
    G__8717__8718[i] = a;
    G__8717__8718[j] = b;
    return G__8717__8718
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
  var new_arr__8720 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8720, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8720, 2 * i, new_arr__8720.length - 2 * i);
  return new_arr__8720
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
    var editable__8723 = inode.ensure_editable(edit);
    editable__8723.arr[i] = a;
    return editable__8723
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8724 = inode.ensure_editable(edit);
    editable__8724.arr[i] = a;
    editable__8724.arr[j] = b;
    return editable__8724
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
  var len__8731 = arr.length;
  var i__8732 = 0;
  var init__8733 = init;
  while(true) {
    if(i__8732 < len__8731) {
      var init__8736 = function() {
        var k__8734 = arr[i__8732];
        if(!(k__8734 == null)) {
          return f.call(null, init__8733, k__8734, arr[i__8732 + 1])
        }else {
          var node__8735 = arr[i__8732 + 1];
          if(!(node__8735 == null)) {
            return node__8735.kv_reduce(f, init__8733)
          }else {
            return init__8733
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8736)) {
        return cljs.core.deref.call(null, init__8736)
      }else {
        var G__8737 = i__8732 + 2;
        var G__8738 = init__8736;
        i__8732 = G__8737;
        init__8733 = G__8738;
        continue
      }
    }else {
      return init__8733
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
  var this__8739 = this;
  var inode__8740 = this;
  if(this__8739.bitmap === bit) {
    return null
  }else {
    var editable__8741 = inode__8740.ensure_editable(e);
    var earr__8742 = editable__8741.arr;
    var len__8743 = earr__8742.length;
    editable__8741.bitmap = bit ^ editable__8741.bitmap;
    cljs.core.array_copy.call(null, earr__8742, 2 * (i + 1), earr__8742, 2 * i, len__8743 - 2 * (i + 1));
    earr__8742[len__8743 - 2] = null;
    earr__8742[len__8743 - 1] = null;
    return editable__8741
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8744 = this;
  var inode__8745 = this;
  var bit__8746 = 1 << (hash >>> shift & 31);
  var idx__8747 = cljs.core.bitmap_indexed_node_index.call(null, this__8744.bitmap, bit__8746);
  if((this__8744.bitmap & bit__8746) === 0) {
    var n__8748 = cljs.core.bit_count.call(null, this__8744.bitmap);
    if(2 * n__8748 < this__8744.arr.length) {
      var editable__8749 = inode__8745.ensure_editable(edit);
      var earr__8750 = editable__8749.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8750, 2 * idx__8747, earr__8750, 2 * (idx__8747 + 1), 2 * (n__8748 - idx__8747));
      earr__8750[2 * idx__8747] = key;
      earr__8750[2 * idx__8747 + 1] = val;
      editable__8749.bitmap = editable__8749.bitmap | bit__8746;
      return editable__8749
    }else {
      if(n__8748 >= 16) {
        var nodes__8751 = cljs.core.make_array.call(null, 32);
        var jdx__8752 = hash >>> shift & 31;
        nodes__8751[jdx__8752] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8753 = 0;
        var j__8754 = 0;
        while(true) {
          if(i__8753 < 32) {
            if((this__8744.bitmap >>> i__8753 & 1) === 0) {
              var G__8807 = i__8753 + 1;
              var G__8808 = j__8754;
              i__8753 = G__8807;
              j__8754 = G__8808;
              continue
            }else {
              nodes__8751[i__8753] = !(this__8744.arr[j__8754] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8744.arr[j__8754]), this__8744.arr[j__8754], this__8744.arr[j__8754 + 1], added_leaf_QMARK_) : this__8744.arr[j__8754 + 1];
              var G__8809 = i__8753 + 1;
              var G__8810 = j__8754 + 2;
              i__8753 = G__8809;
              j__8754 = G__8810;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8748 + 1, nodes__8751)
      }else {
        if("\ufdd0'else") {
          var new_arr__8755 = cljs.core.make_array.call(null, 2 * (n__8748 + 4));
          cljs.core.array_copy.call(null, this__8744.arr, 0, new_arr__8755, 0, 2 * idx__8747);
          new_arr__8755[2 * idx__8747] = key;
          new_arr__8755[2 * idx__8747 + 1] = val;
          cljs.core.array_copy.call(null, this__8744.arr, 2 * idx__8747, new_arr__8755, 2 * (idx__8747 + 1), 2 * (n__8748 - idx__8747));
          added_leaf_QMARK_.val = true;
          var editable__8756 = inode__8745.ensure_editable(edit);
          editable__8756.arr = new_arr__8755;
          editable__8756.bitmap = editable__8756.bitmap | bit__8746;
          return editable__8756
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8757 = this__8744.arr[2 * idx__8747];
    var val_or_node__8758 = this__8744.arr[2 * idx__8747 + 1];
    if(key_or_nil__8757 == null) {
      var n__8759 = val_or_node__8758.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8759 === val_or_node__8758) {
        return inode__8745
      }else {
        return cljs.core.edit_and_set.call(null, inode__8745, edit, 2 * idx__8747 + 1, n__8759)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8757)) {
        if(val === val_or_node__8758) {
          return inode__8745
        }else {
          return cljs.core.edit_and_set.call(null, inode__8745, edit, 2 * idx__8747 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8745, edit, 2 * idx__8747, null, 2 * idx__8747 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8757, val_or_node__8758, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8760 = this;
  var inode__8761 = this;
  return cljs.core.create_inode_seq.call(null, this__8760.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8762 = this;
  var inode__8763 = this;
  var bit__8764 = 1 << (hash >>> shift & 31);
  if((this__8762.bitmap & bit__8764) === 0) {
    return inode__8763
  }else {
    var idx__8765 = cljs.core.bitmap_indexed_node_index.call(null, this__8762.bitmap, bit__8764);
    var key_or_nil__8766 = this__8762.arr[2 * idx__8765];
    var val_or_node__8767 = this__8762.arr[2 * idx__8765 + 1];
    if(key_or_nil__8766 == null) {
      var n__8768 = val_or_node__8767.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8768 === val_or_node__8767) {
        return inode__8763
      }else {
        if(!(n__8768 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8763, edit, 2 * idx__8765 + 1, n__8768)
        }else {
          if(this__8762.bitmap === bit__8764) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8763.edit_and_remove_pair(edit, bit__8764, idx__8765)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8766)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8763.edit_and_remove_pair(edit, bit__8764, idx__8765)
      }else {
        if("\ufdd0'else") {
          return inode__8763
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8769 = this;
  var inode__8770 = this;
  if(e === this__8769.edit) {
    return inode__8770
  }else {
    var n__8771 = cljs.core.bit_count.call(null, this__8769.bitmap);
    var new_arr__8772 = cljs.core.make_array.call(null, n__8771 < 0 ? 4 : 2 * (n__8771 + 1));
    cljs.core.array_copy.call(null, this__8769.arr, 0, new_arr__8772, 0, 2 * n__8771);
    return new cljs.core.BitmapIndexedNode(e, this__8769.bitmap, new_arr__8772)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8773 = this;
  var inode__8774 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8773.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8775 = this;
  var inode__8776 = this;
  var bit__8777 = 1 << (hash >>> shift & 31);
  if((this__8775.bitmap & bit__8777) === 0) {
    return not_found
  }else {
    var idx__8778 = cljs.core.bitmap_indexed_node_index.call(null, this__8775.bitmap, bit__8777);
    var key_or_nil__8779 = this__8775.arr[2 * idx__8778];
    var val_or_node__8780 = this__8775.arr[2 * idx__8778 + 1];
    if(key_or_nil__8779 == null) {
      return val_or_node__8780.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8779)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8779, val_or_node__8780], true)
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
  var this__8781 = this;
  var inode__8782 = this;
  var bit__8783 = 1 << (hash >>> shift & 31);
  if((this__8781.bitmap & bit__8783) === 0) {
    return inode__8782
  }else {
    var idx__8784 = cljs.core.bitmap_indexed_node_index.call(null, this__8781.bitmap, bit__8783);
    var key_or_nil__8785 = this__8781.arr[2 * idx__8784];
    var val_or_node__8786 = this__8781.arr[2 * idx__8784 + 1];
    if(key_or_nil__8785 == null) {
      var n__8787 = val_or_node__8786.inode_without(shift + 5, hash, key);
      if(n__8787 === val_or_node__8786) {
        return inode__8782
      }else {
        if(!(n__8787 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8781.bitmap, cljs.core.clone_and_set.call(null, this__8781.arr, 2 * idx__8784 + 1, n__8787))
        }else {
          if(this__8781.bitmap === bit__8783) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8781.bitmap ^ bit__8783, cljs.core.remove_pair.call(null, this__8781.arr, idx__8784))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8785)) {
        return new cljs.core.BitmapIndexedNode(null, this__8781.bitmap ^ bit__8783, cljs.core.remove_pair.call(null, this__8781.arr, idx__8784))
      }else {
        if("\ufdd0'else") {
          return inode__8782
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8788 = this;
  var inode__8789 = this;
  var bit__8790 = 1 << (hash >>> shift & 31);
  var idx__8791 = cljs.core.bitmap_indexed_node_index.call(null, this__8788.bitmap, bit__8790);
  if((this__8788.bitmap & bit__8790) === 0) {
    var n__8792 = cljs.core.bit_count.call(null, this__8788.bitmap);
    if(n__8792 >= 16) {
      var nodes__8793 = cljs.core.make_array.call(null, 32);
      var jdx__8794 = hash >>> shift & 31;
      nodes__8793[jdx__8794] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8795 = 0;
      var j__8796 = 0;
      while(true) {
        if(i__8795 < 32) {
          if((this__8788.bitmap >>> i__8795 & 1) === 0) {
            var G__8811 = i__8795 + 1;
            var G__8812 = j__8796;
            i__8795 = G__8811;
            j__8796 = G__8812;
            continue
          }else {
            nodes__8793[i__8795] = !(this__8788.arr[j__8796] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8788.arr[j__8796]), this__8788.arr[j__8796], this__8788.arr[j__8796 + 1], added_leaf_QMARK_) : this__8788.arr[j__8796 + 1];
            var G__8813 = i__8795 + 1;
            var G__8814 = j__8796 + 2;
            i__8795 = G__8813;
            j__8796 = G__8814;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8792 + 1, nodes__8793)
    }else {
      var new_arr__8797 = cljs.core.make_array.call(null, 2 * (n__8792 + 1));
      cljs.core.array_copy.call(null, this__8788.arr, 0, new_arr__8797, 0, 2 * idx__8791);
      new_arr__8797[2 * idx__8791] = key;
      new_arr__8797[2 * idx__8791 + 1] = val;
      cljs.core.array_copy.call(null, this__8788.arr, 2 * idx__8791, new_arr__8797, 2 * (idx__8791 + 1), 2 * (n__8792 - idx__8791));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8788.bitmap | bit__8790, new_arr__8797)
    }
  }else {
    var key_or_nil__8798 = this__8788.arr[2 * idx__8791];
    var val_or_node__8799 = this__8788.arr[2 * idx__8791 + 1];
    if(key_or_nil__8798 == null) {
      var n__8800 = val_or_node__8799.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8800 === val_or_node__8799) {
        return inode__8789
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8788.bitmap, cljs.core.clone_and_set.call(null, this__8788.arr, 2 * idx__8791 + 1, n__8800))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8798)) {
        if(val === val_or_node__8799) {
          return inode__8789
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8788.bitmap, cljs.core.clone_and_set.call(null, this__8788.arr, 2 * idx__8791 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8788.bitmap, cljs.core.clone_and_set.call(null, this__8788.arr, 2 * idx__8791, null, 2 * idx__8791 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8798, val_or_node__8799, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8801 = this;
  var inode__8802 = this;
  var bit__8803 = 1 << (hash >>> shift & 31);
  if((this__8801.bitmap & bit__8803) === 0) {
    return not_found
  }else {
    var idx__8804 = cljs.core.bitmap_indexed_node_index.call(null, this__8801.bitmap, bit__8803);
    var key_or_nil__8805 = this__8801.arr[2 * idx__8804];
    var val_or_node__8806 = this__8801.arr[2 * idx__8804 + 1];
    if(key_or_nil__8805 == null) {
      return val_or_node__8806.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8805)) {
        return val_or_node__8806
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
  var arr__8822 = array_node.arr;
  var len__8823 = 2 * (array_node.cnt - 1);
  var new_arr__8824 = cljs.core.make_array.call(null, len__8823);
  var i__8825 = 0;
  var j__8826 = 1;
  var bitmap__8827 = 0;
  while(true) {
    if(i__8825 < len__8823) {
      if(function() {
        var and__3822__auto____8828 = !(i__8825 === idx);
        if(and__3822__auto____8828) {
          return!(arr__8822[i__8825] == null)
        }else {
          return and__3822__auto____8828
        }
      }()) {
        new_arr__8824[j__8826] = arr__8822[i__8825];
        var G__8829 = i__8825 + 1;
        var G__8830 = j__8826 + 2;
        var G__8831 = bitmap__8827 | 1 << i__8825;
        i__8825 = G__8829;
        j__8826 = G__8830;
        bitmap__8827 = G__8831;
        continue
      }else {
        var G__8832 = i__8825 + 1;
        var G__8833 = j__8826;
        var G__8834 = bitmap__8827;
        i__8825 = G__8832;
        j__8826 = G__8833;
        bitmap__8827 = G__8834;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8827, new_arr__8824)
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
  var this__8835 = this;
  var inode__8836 = this;
  var idx__8837 = hash >>> shift & 31;
  var node__8838 = this__8835.arr[idx__8837];
  if(node__8838 == null) {
    var editable__8839 = cljs.core.edit_and_set.call(null, inode__8836, edit, idx__8837, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8839.cnt = editable__8839.cnt + 1;
    return editable__8839
  }else {
    var n__8840 = node__8838.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8840 === node__8838) {
      return inode__8836
    }else {
      return cljs.core.edit_and_set.call(null, inode__8836, edit, idx__8837, n__8840)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8841 = this;
  var inode__8842 = this;
  return cljs.core.create_array_node_seq.call(null, this__8841.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8843 = this;
  var inode__8844 = this;
  var idx__8845 = hash >>> shift & 31;
  var node__8846 = this__8843.arr[idx__8845];
  if(node__8846 == null) {
    return inode__8844
  }else {
    var n__8847 = node__8846.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8847 === node__8846) {
      return inode__8844
    }else {
      if(n__8847 == null) {
        if(this__8843.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8844, edit, idx__8845)
        }else {
          var editable__8848 = cljs.core.edit_and_set.call(null, inode__8844, edit, idx__8845, n__8847);
          editable__8848.cnt = editable__8848.cnt - 1;
          return editable__8848
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8844, edit, idx__8845, n__8847)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8849 = this;
  var inode__8850 = this;
  if(e === this__8849.edit) {
    return inode__8850
  }else {
    return new cljs.core.ArrayNode(e, this__8849.cnt, this__8849.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8851 = this;
  var inode__8852 = this;
  var len__8853 = this__8851.arr.length;
  var i__8854 = 0;
  var init__8855 = init;
  while(true) {
    if(i__8854 < len__8853) {
      var node__8856 = this__8851.arr[i__8854];
      if(!(node__8856 == null)) {
        var init__8857 = node__8856.kv_reduce(f, init__8855);
        if(cljs.core.reduced_QMARK_.call(null, init__8857)) {
          return cljs.core.deref.call(null, init__8857)
        }else {
          var G__8876 = i__8854 + 1;
          var G__8877 = init__8857;
          i__8854 = G__8876;
          init__8855 = G__8877;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8855
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8858 = this;
  var inode__8859 = this;
  var idx__8860 = hash >>> shift & 31;
  var node__8861 = this__8858.arr[idx__8860];
  if(!(node__8861 == null)) {
    return node__8861.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8862 = this;
  var inode__8863 = this;
  var idx__8864 = hash >>> shift & 31;
  var node__8865 = this__8862.arr[idx__8864];
  if(!(node__8865 == null)) {
    var n__8866 = node__8865.inode_without(shift + 5, hash, key);
    if(n__8866 === node__8865) {
      return inode__8863
    }else {
      if(n__8866 == null) {
        if(this__8862.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8863, null, idx__8864)
        }else {
          return new cljs.core.ArrayNode(null, this__8862.cnt - 1, cljs.core.clone_and_set.call(null, this__8862.arr, idx__8864, n__8866))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8862.cnt, cljs.core.clone_and_set.call(null, this__8862.arr, idx__8864, n__8866))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8863
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8867 = this;
  var inode__8868 = this;
  var idx__8869 = hash >>> shift & 31;
  var node__8870 = this__8867.arr[idx__8869];
  if(node__8870 == null) {
    return new cljs.core.ArrayNode(null, this__8867.cnt + 1, cljs.core.clone_and_set.call(null, this__8867.arr, idx__8869, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8871 = node__8870.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8871 === node__8870) {
      return inode__8868
    }else {
      return new cljs.core.ArrayNode(null, this__8867.cnt, cljs.core.clone_and_set.call(null, this__8867.arr, idx__8869, n__8871))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8872 = this;
  var inode__8873 = this;
  var idx__8874 = hash >>> shift & 31;
  var node__8875 = this__8872.arr[idx__8874];
  if(!(node__8875 == null)) {
    return node__8875.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8880 = 2 * cnt;
  var i__8881 = 0;
  while(true) {
    if(i__8881 < lim__8880) {
      if(cljs.core.key_test.call(null, key, arr[i__8881])) {
        return i__8881
      }else {
        var G__8882 = i__8881 + 2;
        i__8881 = G__8882;
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
  var this__8883 = this;
  var inode__8884 = this;
  if(hash === this__8883.collision_hash) {
    var idx__8885 = cljs.core.hash_collision_node_find_index.call(null, this__8883.arr, this__8883.cnt, key);
    if(idx__8885 === -1) {
      if(this__8883.arr.length > 2 * this__8883.cnt) {
        var editable__8886 = cljs.core.edit_and_set.call(null, inode__8884, edit, 2 * this__8883.cnt, key, 2 * this__8883.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8886.cnt = editable__8886.cnt + 1;
        return editable__8886
      }else {
        var len__8887 = this__8883.arr.length;
        var new_arr__8888 = cljs.core.make_array.call(null, len__8887 + 2);
        cljs.core.array_copy.call(null, this__8883.arr, 0, new_arr__8888, 0, len__8887);
        new_arr__8888[len__8887] = key;
        new_arr__8888[len__8887 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8884.ensure_editable_array(edit, this__8883.cnt + 1, new_arr__8888)
      }
    }else {
      if(this__8883.arr[idx__8885 + 1] === val) {
        return inode__8884
      }else {
        return cljs.core.edit_and_set.call(null, inode__8884, edit, idx__8885 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8883.collision_hash >>> shift & 31), [null, inode__8884, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8889 = this;
  var inode__8890 = this;
  return cljs.core.create_inode_seq.call(null, this__8889.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8891 = this;
  var inode__8892 = this;
  var idx__8893 = cljs.core.hash_collision_node_find_index.call(null, this__8891.arr, this__8891.cnt, key);
  if(idx__8893 === -1) {
    return inode__8892
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8891.cnt === 1) {
      return null
    }else {
      var editable__8894 = inode__8892.ensure_editable(edit);
      var earr__8895 = editable__8894.arr;
      earr__8895[idx__8893] = earr__8895[2 * this__8891.cnt - 2];
      earr__8895[idx__8893 + 1] = earr__8895[2 * this__8891.cnt - 1];
      earr__8895[2 * this__8891.cnt - 1] = null;
      earr__8895[2 * this__8891.cnt - 2] = null;
      editable__8894.cnt = editable__8894.cnt - 1;
      return editable__8894
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8896 = this;
  var inode__8897 = this;
  if(e === this__8896.edit) {
    return inode__8897
  }else {
    var new_arr__8898 = cljs.core.make_array.call(null, 2 * (this__8896.cnt + 1));
    cljs.core.array_copy.call(null, this__8896.arr, 0, new_arr__8898, 0, 2 * this__8896.cnt);
    return new cljs.core.HashCollisionNode(e, this__8896.collision_hash, this__8896.cnt, new_arr__8898)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8899 = this;
  var inode__8900 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8899.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8901 = this;
  var inode__8902 = this;
  var idx__8903 = cljs.core.hash_collision_node_find_index.call(null, this__8901.arr, this__8901.cnt, key);
  if(idx__8903 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8901.arr[idx__8903])) {
      return cljs.core.PersistentVector.fromArray([this__8901.arr[idx__8903], this__8901.arr[idx__8903 + 1]], true)
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
  var this__8904 = this;
  var inode__8905 = this;
  var idx__8906 = cljs.core.hash_collision_node_find_index.call(null, this__8904.arr, this__8904.cnt, key);
  if(idx__8906 === -1) {
    return inode__8905
  }else {
    if(this__8904.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8904.collision_hash, this__8904.cnt - 1, cljs.core.remove_pair.call(null, this__8904.arr, cljs.core.quot.call(null, idx__8906, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8907 = this;
  var inode__8908 = this;
  if(hash === this__8907.collision_hash) {
    var idx__8909 = cljs.core.hash_collision_node_find_index.call(null, this__8907.arr, this__8907.cnt, key);
    if(idx__8909 === -1) {
      var len__8910 = this__8907.arr.length;
      var new_arr__8911 = cljs.core.make_array.call(null, len__8910 + 2);
      cljs.core.array_copy.call(null, this__8907.arr, 0, new_arr__8911, 0, len__8910);
      new_arr__8911[len__8910] = key;
      new_arr__8911[len__8910 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8907.collision_hash, this__8907.cnt + 1, new_arr__8911)
    }else {
      if(cljs.core._EQ_.call(null, this__8907.arr[idx__8909], val)) {
        return inode__8908
      }else {
        return new cljs.core.HashCollisionNode(null, this__8907.collision_hash, this__8907.cnt, cljs.core.clone_and_set.call(null, this__8907.arr, idx__8909 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8907.collision_hash >>> shift & 31), [null, inode__8908])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8912 = this;
  var inode__8913 = this;
  var idx__8914 = cljs.core.hash_collision_node_find_index.call(null, this__8912.arr, this__8912.cnt, key);
  if(idx__8914 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8912.arr[idx__8914])) {
      return this__8912.arr[idx__8914 + 1]
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
  var this__8915 = this;
  var inode__8916 = this;
  if(e === this__8915.edit) {
    this__8915.arr = array;
    this__8915.cnt = count;
    return inode__8916
  }else {
    return new cljs.core.HashCollisionNode(this__8915.edit, this__8915.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8921 = cljs.core.hash.call(null, key1);
    if(key1hash__8921 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8921, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8922 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8921, key1, val1, added_leaf_QMARK___8922).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8922)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8923 = cljs.core.hash.call(null, key1);
    if(key1hash__8923 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8923, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8924 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8923, key1, val1, added_leaf_QMARK___8924).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8924)
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
  var this__8925 = this;
  var h__2192__auto____8926 = this__8925.__hash;
  if(!(h__2192__auto____8926 == null)) {
    return h__2192__auto____8926
  }else {
    var h__2192__auto____8927 = cljs.core.hash_coll.call(null, coll);
    this__8925.__hash = h__2192__auto____8927;
    return h__2192__auto____8927
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8928 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8929 = this;
  var this__8930 = this;
  return cljs.core.pr_str.call(null, this__8930)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8931 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8932 = this;
  if(this__8932.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8932.nodes[this__8932.i], this__8932.nodes[this__8932.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8932.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8933 = this;
  if(this__8933.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8933.nodes, this__8933.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8933.nodes, this__8933.i, cljs.core.next.call(null, this__8933.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8934 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8935 = this;
  return new cljs.core.NodeSeq(meta, this__8935.nodes, this__8935.i, this__8935.s, this__8935.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8936 = this;
  return this__8936.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8937 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8937.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8944 = nodes.length;
      var j__8945 = i;
      while(true) {
        if(j__8945 < len__8944) {
          if(!(nodes[j__8945] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8945, null, null)
          }else {
            var temp__3971__auto____8946 = nodes[j__8945 + 1];
            if(cljs.core.truth_(temp__3971__auto____8946)) {
              var node__8947 = temp__3971__auto____8946;
              var temp__3971__auto____8948 = node__8947.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8948)) {
                var node_seq__8949 = temp__3971__auto____8948;
                return new cljs.core.NodeSeq(null, nodes, j__8945 + 2, node_seq__8949, null)
              }else {
                var G__8950 = j__8945 + 2;
                j__8945 = G__8950;
                continue
              }
            }else {
              var G__8951 = j__8945 + 2;
              j__8945 = G__8951;
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
  var this__8952 = this;
  var h__2192__auto____8953 = this__8952.__hash;
  if(!(h__2192__auto____8953 == null)) {
    return h__2192__auto____8953
  }else {
    var h__2192__auto____8954 = cljs.core.hash_coll.call(null, coll);
    this__8952.__hash = h__2192__auto____8954;
    return h__2192__auto____8954
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8955 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8956 = this;
  var this__8957 = this;
  return cljs.core.pr_str.call(null, this__8957)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8958 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8959 = this;
  return cljs.core.first.call(null, this__8959.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8960 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8960.nodes, this__8960.i, cljs.core.next.call(null, this__8960.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8961 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8962 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8962.nodes, this__8962.i, this__8962.s, this__8962.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8963 = this;
  return this__8963.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8964 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8964.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8971 = nodes.length;
      var j__8972 = i;
      while(true) {
        if(j__8972 < len__8971) {
          var temp__3971__auto____8973 = nodes[j__8972];
          if(cljs.core.truth_(temp__3971__auto____8973)) {
            var nj__8974 = temp__3971__auto____8973;
            var temp__3971__auto____8975 = nj__8974.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8975)) {
              var ns__8976 = temp__3971__auto____8975;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8972 + 1, ns__8976, null)
            }else {
              var G__8977 = j__8972 + 1;
              j__8972 = G__8977;
              continue
            }
          }else {
            var G__8978 = j__8972 + 1;
            j__8972 = G__8978;
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
  var this__8981 = this;
  return new cljs.core.TransientHashMap({}, this__8981.root, this__8981.cnt, this__8981.has_nil_QMARK_, this__8981.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8982 = this;
  var h__2192__auto____8983 = this__8982.__hash;
  if(!(h__2192__auto____8983 == null)) {
    return h__2192__auto____8983
  }else {
    var h__2192__auto____8984 = cljs.core.hash_imap.call(null, coll);
    this__8982.__hash = h__2192__auto____8984;
    return h__2192__auto____8984
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8985 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8986 = this;
  if(k == null) {
    if(this__8986.has_nil_QMARK_) {
      return this__8986.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8986.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8986.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8987 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____8988 = this__8987.has_nil_QMARK_;
      if(and__3822__auto____8988) {
        return v === this__8987.nil_val
      }else {
        return and__3822__auto____8988
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8987.meta, this__8987.has_nil_QMARK_ ? this__8987.cnt : this__8987.cnt + 1, this__8987.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8989 = new cljs.core.Box(false);
    var new_root__8990 = (this__8987.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8987.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8989);
    if(new_root__8990 === this__8987.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8987.meta, added_leaf_QMARK___8989.val ? this__8987.cnt + 1 : this__8987.cnt, new_root__8990, this__8987.has_nil_QMARK_, this__8987.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8991 = this;
  if(k == null) {
    return this__8991.has_nil_QMARK_
  }else {
    if(this__8991.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8991.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9014 = null;
  var G__9014__2 = function(this_sym8992, k) {
    var this__8994 = this;
    var this_sym8992__8995 = this;
    var coll__8996 = this_sym8992__8995;
    return coll__8996.cljs$core$ILookup$_lookup$arity$2(coll__8996, k)
  };
  var G__9014__3 = function(this_sym8993, k, not_found) {
    var this__8994 = this;
    var this_sym8993__8997 = this;
    var coll__8998 = this_sym8993__8997;
    return coll__8998.cljs$core$ILookup$_lookup$arity$3(coll__8998, k, not_found)
  };
  G__9014 = function(this_sym8993, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9014__2.call(this, this_sym8993, k);
      case 3:
        return G__9014__3.call(this, this_sym8993, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9014
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8979, args8980) {
  var this__8999 = this;
  return this_sym8979.call.apply(this_sym8979, [this_sym8979].concat(args8980.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9000 = this;
  var init__9001 = this__9000.has_nil_QMARK_ ? f.call(null, init, null, this__9000.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9001)) {
    return cljs.core.deref.call(null, init__9001)
  }else {
    if(!(this__9000.root == null)) {
      return this__9000.root.kv_reduce(f, init__9001)
    }else {
      if("\ufdd0'else") {
        return init__9001
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9002 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9003 = this;
  var this__9004 = this;
  return cljs.core.pr_str.call(null, this__9004)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9005 = this;
  if(this__9005.cnt > 0) {
    var s__9006 = !(this__9005.root == null) ? this__9005.root.inode_seq() : null;
    if(this__9005.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9005.nil_val], true), s__9006)
    }else {
      return s__9006
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9007 = this;
  return this__9007.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9008 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9009 = this;
  return new cljs.core.PersistentHashMap(meta, this__9009.cnt, this__9009.root, this__9009.has_nil_QMARK_, this__9009.nil_val, this__9009.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9010 = this;
  return this__9010.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9011 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9011.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9012 = this;
  if(k == null) {
    if(this__9012.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9012.meta, this__9012.cnt - 1, this__9012.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9012.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9013 = this__9012.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9013 === this__9012.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9012.meta, this__9012.cnt - 1, new_root__9013, this__9012.has_nil_QMARK_, this__9012.nil_val, null)
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
  var len__9015 = ks.length;
  var i__9016 = 0;
  var out__9017 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9016 < len__9015) {
      var G__9018 = i__9016 + 1;
      var G__9019 = cljs.core.assoc_BANG_.call(null, out__9017, ks[i__9016], vs[i__9016]);
      i__9016 = G__9018;
      out__9017 = G__9019;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9017)
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
  var this__9020 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9021 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9022 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9023 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9024 = this;
  if(k == null) {
    if(this__9024.has_nil_QMARK_) {
      return this__9024.nil_val
    }else {
      return null
    }
  }else {
    if(this__9024.root == null) {
      return null
    }else {
      return this__9024.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9025 = this;
  if(k == null) {
    if(this__9025.has_nil_QMARK_) {
      return this__9025.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9025.root == null) {
      return not_found
    }else {
      return this__9025.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9026 = this;
  if(this__9026.edit) {
    return this__9026.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9027 = this;
  var tcoll__9028 = this;
  if(this__9027.edit) {
    if(function() {
      var G__9029__9030 = o;
      if(G__9029__9030) {
        if(function() {
          var or__3824__auto____9031 = G__9029__9030.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9031) {
            return or__3824__auto____9031
          }else {
            return G__9029__9030.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9029__9030.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9029__9030)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9029__9030)
      }
    }()) {
      return tcoll__9028.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9032 = cljs.core.seq.call(null, o);
      var tcoll__9033 = tcoll__9028;
      while(true) {
        var temp__3971__auto____9034 = cljs.core.first.call(null, es__9032);
        if(cljs.core.truth_(temp__3971__auto____9034)) {
          var e__9035 = temp__3971__auto____9034;
          var G__9046 = cljs.core.next.call(null, es__9032);
          var G__9047 = tcoll__9033.assoc_BANG_(cljs.core.key.call(null, e__9035), cljs.core.val.call(null, e__9035));
          es__9032 = G__9046;
          tcoll__9033 = G__9047;
          continue
        }else {
          return tcoll__9033
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9036 = this;
  var tcoll__9037 = this;
  if(this__9036.edit) {
    if(k == null) {
      if(this__9036.nil_val === v) {
      }else {
        this__9036.nil_val = v
      }
      if(this__9036.has_nil_QMARK_) {
      }else {
        this__9036.count = this__9036.count + 1;
        this__9036.has_nil_QMARK_ = true
      }
      return tcoll__9037
    }else {
      var added_leaf_QMARK___9038 = new cljs.core.Box(false);
      var node__9039 = (this__9036.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9036.root).inode_assoc_BANG_(this__9036.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9038);
      if(node__9039 === this__9036.root) {
      }else {
        this__9036.root = node__9039
      }
      if(added_leaf_QMARK___9038.val) {
        this__9036.count = this__9036.count + 1
      }else {
      }
      return tcoll__9037
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9040 = this;
  var tcoll__9041 = this;
  if(this__9040.edit) {
    if(k == null) {
      if(this__9040.has_nil_QMARK_) {
        this__9040.has_nil_QMARK_ = false;
        this__9040.nil_val = null;
        this__9040.count = this__9040.count - 1;
        return tcoll__9041
      }else {
        return tcoll__9041
      }
    }else {
      if(this__9040.root == null) {
        return tcoll__9041
      }else {
        var removed_leaf_QMARK___9042 = new cljs.core.Box(false);
        var node__9043 = this__9040.root.inode_without_BANG_(this__9040.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9042);
        if(node__9043 === this__9040.root) {
        }else {
          this__9040.root = node__9043
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9042[0])) {
          this__9040.count = this__9040.count - 1
        }else {
        }
        return tcoll__9041
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9044 = this;
  var tcoll__9045 = this;
  if(this__9044.edit) {
    this__9044.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9044.count, this__9044.root, this__9044.has_nil_QMARK_, this__9044.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9050 = node;
  var stack__9051 = stack;
  while(true) {
    if(!(t__9050 == null)) {
      var G__9052 = ascending_QMARK_ ? t__9050.left : t__9050.right;
      var G__9053 = cljs.core.conj.call(null, stack__9051, t__9050);
      t__9050 = G__9052;
      stack__9051 = G__9053;
      continue
    }else {
      return stack__9051
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
  var this__9054 = this;
  var h__2192__auto____9055 = this__9054.__hash;
  if(!(h__2192__auto____9055 == null)) {
    return h__2192__auto____9055
  }else {
    var h__2192__auto____9056 = cljs.core.hash_coll.call(null, coll);
    this__9054.__hash = h__2192__auto____9056;
    return h__2192__auto____9056
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9057 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9058 = this;
  var this__9059 = this;
  return cljs.core.pr_str.call(null, this__9059)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9060 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9061 = this;
  if(this__9061.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9061.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9062 = this;
  return cljs.core.peek.call(null, this__9062.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9063 = this;
  var t__9064 = cljs.core.first.call(null, this__9063.stack);
  var next_stack__9065 = cljs.core.tree_map_seq_push.call(null, this__9063.ascending_QMARK_ ? t__9064.right : t__9064.left, cljs.core.next.call(null, this__9063.stack), this__9063.ascending_QMARK_);
  if(!(next_stack__9065 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9065, this__9063.ascending_QMARK_, this__9063.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9066 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9067 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9067.stack, this__9067.ascending_QMARK_, this__9067.cnt, this__9067.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9068 = this;
  return this__9068.meta
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
        var and__3822__auto____9070 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9070) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9070
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
        var and__3822__auto____9072 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9072) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9072
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
  var init__9076 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9076)) {
    return cljs.core.deref.call(null, init__9076)
  }else {
    var init__9077 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9076) : init__9076;
    if(cljs.core.reduced_QMARK_.call(null, init__9077)) {
      return cljs.core.deref.call(null, init__9077)
    }else {
      var init__9078 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9077) : init__9077;
      if(cljs.core.reduced_QMARK_.call(null, init__9078)) {
        return cljs.core.deref.call(null, init__9078)
      }else {
        return init__9078
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
  var this__9081 = this;
  var h__2192__auto____9082 = this__9081.__hash;
  if(!(h__2192__auto____9082 == null)) {
    return h__2192__auto____9082
  }else {
    var h__2192__auto____9083 = cljs.core.hash_coll.call(null, coll);
    this__9081.__hash = h__2192__auto____9083;
    return h__2192__auto____9083
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9084 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9085 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9086 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9086.key, this__9086.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9134 = null;
  var G__9134__2 = function(this_sym9087, k) {
    var this__9089 = this;
    var this_sym9087__9090 = this;
    var node__9091 = this_sym9087__9090;
    return node__9091.cljs$core$ILookup$_lookup$arity$2(node__9091, k)
  };
  var G__9134__3 = function(this_sym9088, k, not_found) {
    var this__9089 = this;
    var this_sym9088__9092 = this;
    var node__9093 = this_sym9088__9092;
    return node__9093.cljs$core$ILookup$_lookup$arity$3(node__9093, k, not_found)
  };
  G__9134 = function(this_sym9088, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9134__2.call(this, this_sym9088, k);
      case 3:
        return G__9134__3.call(this, this_sym9088, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9134
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9079, args9080) {
  var this__9094 = this;
  return this_sym9079.call.apply(this_sym9079, [this_sym9079].concat(args9080.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9095 = this;
  return cljs.core.PersistentVector.fromArray([this__9095.key, this__9095.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9096 = this;
  return this__9096.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9097 = this;
  return this__9097.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9098 = this;
  var node__9099 = this;
  return ins.balance_right(node__9099)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9100 = this;
  var node__9101 = this;
  return new cljs.core.RedNode(this__9100.key, this__9100.val, this__9100.left, this__9100.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9102 = this;
  var node__9103 = this;
  return cljs.core.balance_right_del.call(null, this__9102.key, this__9102.val, this__9102.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9104 = this;
  var node__9105 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9106 = this;
  var node__9107 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9107, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9108 = this;
  var node__9109 = this;
  return cljs.core.balance_left_del.call(null, this__9108.key, this__9108.val, del, this__9108.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9110 = this;
  var node__9111 = this;
  return ins.balance_left(node__9111)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9112 = this;
  var node__9113 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9113, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9135 = null;
  var G__9135__0 = function() {
    var this__9114 = this;
    var this__9116 = this;
    return cljs.core.pr_str.call(null, this__9116)
  };
  G__9135 = function() {
    switch(arguments.length) {
      case 0:
        return G__9135__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9135
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9117 = this;
  var node__9118 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9118, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9119 = this;
  var node__9120 = this;
  return node__9120
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9121 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9122 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9123 = this;
  return cljs.core.list.call(null, this__9123.key, this__9123.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9124 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9125 = this;
  return this__9125.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9126 = this;
  return cljs.core.PersistentVector.fromArray([this__9126.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9127 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9127.key, this__9127.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9128 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9129 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9129.key, this__9129.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9130 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9131 = this;
  if(n === 0) {
    return this__9131.key
  }else {
    if(n === 1) {
      return this__9131.val
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
  var this__9132 = this;
  if(n === 0) {
    return this__9132.key
  }else {
    if(n === 1) {
      return this__9132.val
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
  var this__9133 = this;
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
  var this__9138 = this;
  var h__2192__auto____9139 = this__9138.__hash;
  if(!(h__2192__auto____9139 == null)) {
    return h__2192__auto____9139
  }else {
    var h__2192__auto____9140 = cljs.core.hash_coll.call(null, coll);
    this__9138.__hash = h__2192__auto____9140;
    return h__2192__auto____9140
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9141 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9142 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9143 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9143.key, this__9143.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9191 = null;
  var G__9191__2 = function(this_sym9144, k) {
    var this__9146 = this;
    var this_sym9144__9147 = this;
    var node__9148 = this_sym9144__9147;
    return node__9148.cljs$core$ILookup$_lookup$arity$2(node__9148, k)
  };
  var G__9191__3 = function(this_sym9145, k, not_found) {
    var this__9146 = this;
    var this_sym9145__9149 = this;
    var node__9150 = this_sym9145__9149;
    return node__9150.cljs$core$ILookup$_lookup$arity$3(node__9150, k, not_found)
  };
  G__9191 = function(this_sym9145, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9191__2.call(this, this_sym9145, k);
      case 3:
        return G__9191__3.call(this, this_sym9145, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9191
}();
cljs.core.RedNode.prototype.apply = function(this_sym9136, args9137) {
  var this__9151 = this;
  return this_sym9136.call.apply(this_sym9136, [this_sym9136].concat(args9137.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9152 = this;
  return cljs.core.PersistentVector.fromArray([this__9152.key, this__9152.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9153 = this;
  return this__9153.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9154 = this;
  return this__9154.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9155 = this;
  var node__9156 = this;
  return new cljs.core.RedNode(this__9155.key, this__9155.val, this__9155.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9157 = this;
  var node__9158 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9159 = this;
  var node__9160 = this;
  return new cljs.core.RedNode(this__9159.key, this__9159.val, this__9159.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9161 = this;
  var node__9162 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9163 = this;
  var node__9164 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9164, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9165 = this;
  var node__9166 = this;
  return new cljs.core.RedNode(this__9165.key, this__9165.val, del, this__9165.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9167 = this;
  var node__9168 = this;
  return new cljs.core.RedNode(this__9167.key, this__9167.val, ins, this__9167.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9169 = this;
  var node__9170 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9169.left)) {
    return new cljs.core.RedNode(this__9169.key, this__9169.val, this__9169.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9169.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9169.right)) {
      return new cljs.core.RedNode(this__9169.right.key, this__9169.right.val, new cljs.core.BlackNode(this__9169.key, this__9169.val, this__9169.left, this__9169.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9169.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9170, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9192 = null;
  var G__9192__0 = function() {
    var this__9171 = this;
    var this__9173 = this;
    return cljs.core.pr_str.call(null, this__9173)
  };
  G__9192 = function() {
    switch(arguments.length) {
      case 0:
        return G__9192__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9192
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9174 = this;
  var node__9175 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9174.right)) {
    return new cljs.core.RedNode(this__9174.key, this__9174.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9174.left, null), this__9174.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9174.left)) {
      return new cljs.core.RedNode(this__9174.left.key, this__9174.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9174.left.left, null), new cljs.core.BlackNode(this__9174.key, this__9174.val, this__9174.left.right, this__9174.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9175, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9176 = this;
  var node__9177 = this;
  return new cljs.core.BlackNode(this__9176.key, this__9176.val, this__9176.left, this__9176.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9178 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9179 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9180 = this;
  return cljs.core.list.call(null, this__9180.key, this__9180.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9181 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9182 = this;
  return this__9182.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9183 = this;
  return cljs.core.PersistentVector.fromArray([this__9183.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9184 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9184.key, this__9184.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9185 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9186 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9186.key, this__9186.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9187 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9188 = this;
  if(n === 0) {
    return this__9188.key
  }else {
    if(n === 1) {
      return this__9188.val
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
  var this__9189 = this;
  if(n === 0) {
    return this__9189.key
  }else {
    if(n === 1) {
      return this__9189.val
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
  var this__9190 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9196 = comp.call(null, k, tree.key);
    if(c__9196 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9196 < 0) {
        var ins__9197 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9197 == null)) {
          return tree.add_left(ins__9197)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9198 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9198 == null)) {
            return tree.add_right(ins__9198)
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
          var app__9201 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9201)) {
            return new cljs.core.RedNode(app__9201.key, app__9201.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9201.left, null), new cljs.core.RedNode(right.key, right.val, app__9201.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9201, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9202 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9202)) {
              return new cljs.core.RedNode(app__9202.key, app__9202.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9202.left, null), new cljs.core.BlackNode(right.key, right.val, app__9202.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9202, right.right, null))
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
    var c__9208 = comp.call(null, k, tree.key);
    if(c__9208 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9208 < 0) {
        var del__9209 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9210 = !(del__9209 == null);
          if(or__3824__auto____9210) {
            return or__3824__auto____9210
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9209, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9209, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9211 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9212 = !(del__9211 == null);
            if(or__3824__auto____9212) {
              return or__3824__auto____9212
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9211)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9211, null)
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
  var tk__9215 = tree.key;
  var c__9216 = comp.call(null, k, tk__9215);
  if(c__9216 === 0) {
    return tree.replace(tk__9215, v, tree.left, tree.right)
  }else {
    if(c__9216 < 0) {
      return tree.replace(tk__9215, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9215, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__9219 = this;
  var h__2192__auto____9220 = this__9219.__hash;
  if(!(h__2192__auto____9220 == null)) {
    return h__2192__auto____9220
  }else {
    var h__2192__auto____9221 = cljs.core.hash_imap.call(null, coll);
    this__9219.__hash = h__2192__auto____9221;
    return h__2192__auto____9221
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9222 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9223 = this;
  var n__9224 = coll.entry_at(k);
  if(!(n__9224 == null)) {
    return n__9224.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9225 = this;
  var found__9226 = [null];
  var t__9227 = cljs.core.tree_map_add.call(null, this__9225.comp, this__9225.tree, k, v, found__9226);
  if(t__9227 == null) {
    var found_node__9228 = cljs.core.nth.call(null, found__9226, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9228.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9225.comp, cljs.core.tree_map_replace.call(null, this__9225.comp, this__9225.tree, k, v), this__9225.cnt, this__9225.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9225.comp, t__9227.blacken(), this__9225.cnt + 1, this__9225.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9229 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9263 = null;
  var G__9263__2 = function(this_sym9230, k) {
    var this__9232 = this;
    var this_sym9230__9233 = this;
    var coll__9234 = this_sym9230__9233;
    return coll__9234.cljs$core$ILookup$_lookup$arity$2(coll__9234, k)
  };
  var G__9263__3 = function(this_sym9231, k, not_found) {
    var this__9232 = this;
    var this_sym9231__9235 = this;
    var coll__9236 = this_sym9231__9235;
    return coll__9236.cljs$core$ILookup$_lookup$arity$3(coll__9236, k, not_found)
  };
  G__9263 = function(this_sym9231, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9263__2.call(this, this_sym9231, k);
      case 3:
        return G__9263__3.call(this, this_sym9231, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9263
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9217, args9218) {
  var this__9237 = this;
  return this_sym9217.call.apply(this_sym9217, [this_sym9217].concat(args9218.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9238 = this;
  if(!(this__9238.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9238.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9239 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9240 = this;
  if(this__9240.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9240.tree, false, this__9240.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9241 = this;
  var this__9242 = this;
  return cljs.core.pr_str.call(null, this__9242)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9243 = this;
  var coll__9244 = this;
  var t__9245 = this__9243.tree;
  while(true) {
    if(!(t__9245 == null)) {
      var c__9246 = this__9243.comp.call(null, k, t__9245.key);
      if(c__9246 === 0) {
        return t__9245
      }else {
        if(c__9246 < 0) {
          var G__9264 = t__9245.left;
          t__9245 = G__9264;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9265 = t__9245.right;
            t__9245 = G__9265;
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
  var this__9247 = this;
  if(this__9247.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9247.tree, ascending_QMARK_, this__9247.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9248 = this;
  if(this__9248.cnt > 0) {
    var stack__9249 = null;
    var t__9250 = this__9248.tree;
    while(true) {
      if(!(t__9250 == null)) {
        var c__9251 = this__9248.comp.call(null, k, t__9250.key);
        if(c__9251 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9249, t__9250), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9251 < 0) {
              var G__9266 = cljs.core.conj.call(null, stack__9249, t__9250);
              var G__9267 = t__9250.left;
              stack__9249 = G__9266;
              t__9250 = G__9267;
              continue
            }else {
              var G__9268 = stack__9249;
              var G__9269 = t__9250.right;
              stack__9249 = G__9268;
              t__9250 = G__9269;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9251 > 0) {
                var G__9270 = cljs.core.conj.call(null, stack__9249, t__9250);
                var G__9271 = t__9250.right;
                stack__9249 = G__9270;
                t__9250 = G__9271;
                continue
              }else {
                var G__9272 = stack__9249;
                var G__9273 = t__9250.left;
                stack__9249 = G__9272;
                t__9250 = G__9273;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9249 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9249, ascending_QMARK_, -1, null)
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
  var this__9252 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9253 = this;
  return this__9253.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9254 = this;
  if(this__9254.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9254.tree, true, this__9254.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9255 = this;
  return this__9255.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9256 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9257 = this;
  return new cljs.core.PersistentTreeMap(this__9257.comp, this__9257.tree, this__9257.cnt, meta, this__9257.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9258 = this;
  return this__9258.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9259 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9259.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9260 = this;
  var found__9261 = [null];
  var t__9262 = cljs.core.tree_map_remove.call(null, this__9260.comp, this__9260.tree, k, found__9261);
  if(t__9262 == null) {
    if(cljs.core.nth.call(null, found__9261, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9260.comp, null, 0, this__9260.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9260.comp, t__9262.blacken(), this__9260.cnt - 1, this__9260.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9276 = cljs.core.seq.call(null, keyvals);
    var out__9277 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9276) {
        var G__9278 = cljs.core.nnext.call(null, in__9276);
        var G__9279 = cljs.core.assoc_BANG_.call(null, out__9277, cljs.core.first.call(null, in__9276), cljs.core.second.call(null, in__9276));
        in__9276 = G__9278;
        out__9277 = G__9279;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9277)
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
  hash_map.cljs$lang$applyTo = function(arglist__9280) {
    var keyvals = cljs.core.seq(arglist__9280);
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
  array_map.cljs$lang$applyTo = function(arglist__9281) {
    var keyvals = cljs.core.seq(arglist__9281);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9285 = [];
    var obj__9286 = {};
    var kvs__9287 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9287) {
        ks__9285.push(cljs.core.first.call(null, kvs__9287));
        obj__9286[cljs.core.first.call(null, kvs__9287)] = cljs.core.second.call(null, kvs__9287);
        var G__9288 = cljs.core.nnext.call(null, kvs__9287);
        kvs__9287 = G__9288;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9285, obj__9286)
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
  obj_map.cljs$lang$applyTo = function(arglist__9289) {
    var keyvals = cljs.core.seq(arglist__9289);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9292 = cljs.core.seq.call(null, keyvals);
    var out__9293 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9292) {
        var G__9294 = cljs.core.nnext.call(null, in__9292);
        var G__9295 = cljs.core.assoc.call(null, out__9293, cljs.core.first.call(null, in__9292), cljs.core.second.call(null, in__9292));
        in__9292 = G__9294;
        out__9293 = G__9295;
        continue
      }else {
        return out__9293
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
  sorted_map.cljs$lang$applyTo = function(arglist__9296) {
    var keyvals = cljs.core.seq(arglist__9296);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9299 = cljs.core.seq.call(null, keyvals);
    var out__9300 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9299) {
        var G__9301 = cljs.core.nnext.call(null, in__9299);
        var G__9302 = cljs.core.assoc.call(null, out__9300, cljs.core.first.call(null, in__9299), cljs.core.second.call(null, in__9299));
        in__9299 = G__9301;
        out__9300 = G__9302;
        continue
      }else {
        return out__9300
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__9303) {
    var comparator = cljs.core.first(arglist__9303);
    var keyvals = cljs.core.rest(arglist__9303);
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
      return cljs.core.reduce.call(null, function(p1__9304_SHARP_, p2__9305_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9307 = p1__9304_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9307)) {
            return or__3824__auto____9307
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9305_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9308) {
    var maps = cljs.core.seq(arglist__9308);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9316 = function(m, e) {
        var k__9314 = cljs.core.first.call(null, e);
        var v__9315 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9314)) {
          return cljs.core.assoc.call(null, m, k__9314, f.call(null, cljs.core._lookup.call(null, m, k__9314, null), v__9315))
        }else {
          return cljs.core.assoc.call(null, m, k__9314, v__9315)
        }
      };
      var merge2__9318 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9316, function() {
          var or__3824__auto____9317 = m1;
          if(cljs.core.truth_(or__3824__auto____9317)) {
            return or__3824__auto____9317
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9318, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9319) {
    var f = cljs.core.first(arglist__9319);
    var maps = cljs.core.rest(arglist__9319);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9324 = cljs.core.ObjMap.EMPTY;
  var keys__9325 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9325) {
      var key__9326 = cljs.core.first.call(null, keys__9325);
      var entry__9327 = cljs.core._lookup.call(null, map, key__9326, "\ufdd0'cljs.core/not-found");
      var G__9328 = cljs.core.not_EQ_.call(null, entry__9327, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9324, key__9326, entry__9327) : ret__9324;
      var G__9329 = cljs.core.next.call(null, keys__9325);
      ret__9324 = G__9328;
      keys__9325 = G__9329;
      continue
    }else {
      return ret__9324
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
  var this__9333 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9333.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9334 = this;
  var h__2192__auto____9335 = this__9334.__hash;
  if(!(h__2192__auto____9335 == null)) {
    return h__2192__auto____9335
  }else {
    var h__2192__auto____9336 = cljs.core.hash_iset.call(null, coll);
    this__9334.__hash = h__2192__auto____9336;
    return h__2192__auto____9336
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9337 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9338 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9338.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9359 = null;
  var G__9359__2 = function(this_sym9339, k) {
    var this__9341 = this;
    var this_sym9339__9342 = this;
    var coll__9343 = this_sym9339__9342;
    return coll__9343.cljs$core$ILookup$_lookup$arity$2(coll__9343, k)
  };
  var G__9359__3 = function(this_sym9340, k, not_found) {
    var this__9341 = this;
    var this_sym9340__9344 = this;
    var coll__9345 = this_sym9340__9344;
    return coll__9345.cljs$core$ILookup$_lookup$arity$3(coll__9345, k, not_found)
  };
  G__9359 = function(this_sym9340, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9359__2.call(this, this_sym9340, k);
      case 3:
        return G__9359__3.call(this, this_sym9340, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9359
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9331, args9332) {
  var this__9346 = this;
  return this_sym9331.call.apply(this_sym9331, [this_sym9331].concat(args9332.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9347 = this;
  return new cljs.core.PersistentHashSet(this__9347.meta, cljs.core.assoc.call(null, this__9347.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9348 = this;
  var this__9349 = this;
  return cljs.core.pr_str.call(null, this__9349)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9350 = this;
  return cljs.core.keys.call(null, this__9350.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9351 = this;
  return new cljs.core.PersistentHashSet(this__9351.meta, cljs.core.dissoc.call(null, this__9351.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9352 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9353 = this;
  var and__3822__auto____9354 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9354) {
    var and__3822__auto____9355 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9355) {
      return cljs.core.every_QMARK_.call(null, function(p1__9330_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9330_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9355
    }
  }else {
    return and__3822__auto____9354
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9356 = this;
  return new cljs.core.PersistentHashSet(meta, this__9356.hash_map, this__9356.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9357 = this;
  return this__9357.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9358 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9358.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9360 = cljs.core.count.call(null, items);
  var i__9361 = 0;
  var out__9362 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9361 < len__9360) {
      var G__9363 = i__9361 + 1;
      var G__9364 = cljs.core.conj_BANG_.call(null, out__9362, items[i__9361]);
      i__9361 = G__9363;
      out__9362 = G__9364;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9362)
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
  var G__9382 = null;
  var G__9382__2 = function(this_sym9368, k) {
    var this__9370 = this;
    var this_sym9368__9371 = this;
    var tcoll__9372 = this_sym9368__9371;
    if(cljs.core._lookup.call(null, this__9370.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9382__3 = function(this_sym9369, k, not_found) {
    var this__9370 = this;
    var this_sym9369__9373 = this;
    var tcoll__9374 = this_sym9369__9373;
    if(cljs.core._lookup.call(null, this__9370.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9382 = function(this_sym9369, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9382__2.call(this, this_sym9369, k);
      case 3:
        return G__9382__3.call(this, this_sym9369, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9382
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9366, args9367) {
  var this__9375 = this;
  return this_sym9366.call.apply(this_sym9366, [this_sym9366].concat(args9367.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9376 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9377 = this;
  if(cljs.core._lookup.call(null, this__9377.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9378 = this;
  return cljs.core.count.call(null, this__9378.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9379 = this;
  this__9379.transient_map = cljs.core.dissoc_BANG_.call(null, this__9379.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9380 = this;
  this__9380.transient_map = cljs.core.assoc_BANG_.call(null, this__9380.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9381 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9381.transient_map), null)
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
  var this__9385 = this;
  var h__2192__auto____9386 = this__9385.__hash;
  if(!(h__2192__auto____9386 == null)) {
    return h__2192__auto____9386
  }else {
    var h__2192__auto____9387 = cljs.core.hash_iset.call(null, coll);
    this__9385.__hash = h__2192__auto____9387;
    return h__2192__auto____9387
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9388 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9389 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9389.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9415 = null;
  var G__9415__2 = function(this_sym9390, k) {
    var this__9392 = this;
    var this_sym9390__9393 = this;
    var coll__9394 = this_sym9390__9393;
    return coll__9394.cljs$core$ILookup$_lookup$arity$2(coll__9394, k)
  };
  var G__9415__3 = function(this_sym9391, k, not_found) {
    var this__9392 = this;
    var this_sym9391__9395 = this;
    var coll__9396 = this_sym9391__9395;
    return coll__9396.cljs$core$ILookup$_lookup$arity$3(coll__9396, k, not_found)
  };
  G__9415 = function(this_sym9391, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9415__2.call(this, this_sym9391, k);
      case 3:
        return G__9415__3.call(this, this_sym9391, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9415
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9383, args9384) {
  var this__9397 = this;
  return this_sym9383.call.apply(this_sym9383, [this_sym9383].concat(args9384.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9398 = this;
  return new cljs.core.PersistentTreeSet(this__9398.meta, cljs.core.assoc.call(null, this__9398.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9399 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9399.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9400 = this;
  var this__9401 = this;
  return cljs.core.pr_str.call(null, this__9401)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9402 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9402.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9403 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9403.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9404 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9405 = this;
  return cljs.core._comparator.call(null, this__9405.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9406 = this;
  return cljs.core.keys.call(null, this__9406.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9407 = this;
  return new cljs.core.PersistentTreeSet(this__9407.meta, cljs.core.dissoc.call(null, this__9407.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9408 = this;
  return cljs.core.count.call(null, this__9408.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9409 = this;
  var and__3822__auto____9410 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9410) {
    var and__3822__auto____9411 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9411) {
      return cljs.core.every_QMARK_.call(null, function(p1__9365_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9365_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9411
    }
  }else {
    return and__3822__auto____9410
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9412 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9412.tree_map, this__9412.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9413 = this;
  return this__9413.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9414 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9414.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9420__delegate = function(keys) {
      var in__9418 = cljs.core.seq.call(null, keys);
      var out__9419 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9418)) {
          var G__9421 = cljs.core.next.call(null, in__9418);
          var G__9422 = cljs.core.conj_BANG_.call(null, out__9419, cljs.core.first.call(null, in__9418));
          in__9418 = G__9421;
          out__9419 = G__9422;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9419)
        }
        break
      }
    };
    var G__9420 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9420__delegate.call(this, keys)
    };
    G__9420.cljs$lang$maxFixedArity = 0;
    G__9420.cljs$lang$applyTo = function(arglist__9423) {
      var keys = cljs.core.seq(arglist__9423);
      return G__9420__delegate(keys)
    };
    G__9420.cljs$lang$arity$variadic = G__9420__delegate;
    return G__9420
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
  sorted_set.cljs$lang$applyTo = function(arglist__9424) {
    var keys = cljs.core.seq(arglist__9424);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__9426) {
    var comparator = cljs.core.first(arglist__9426);
    var keys = cljs.core.rest(arglist__9426);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9432 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9433 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9433)) {
        var e__9434 = temp__3971__auto____9433;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9434))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9432, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9425_SHARP_) {
      var temp__3971__auto____9435 = cljs.core.find.call(null, smap, p1__9425_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9435)) {
        var e__9436 = temp__3971__auto____9435;
        return cljs.core.second.call(null, e__9436)
      }else {
        return p1__9425_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9466 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9459, seen) {
        while(true) {
          var vec__9460__9461 = p__9459;
          var f__9462 = cljs.core.nth.call(null, vec__9460__9461, 0, null);
          var xs__9463 = vec__9460__9461;
          var temp__3974__auto____9464 = cljs.core.seq.call(null, xs__9463);
          if(temp__3974__auto____9464) {
            var s__9465 = temp__3974__auto____9464;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9462)) {
              var G__9467 = cljs.core.rest.call(null, s__9465);
              var G__9468 = seen;
              p__9459 = G__9467;
              seen = G__9468;
              continue
            }else {
              return cljs.core.cons.call(null, f__9462, step.call(null, cljs.core.rest.call(null, s__9465), cljs.core.conj.call(null, seen, f__9462)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9466.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9471 = cljs.core.PersistentVector.EMPTY;
  var s__9472 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9472)) {
      var G__9473 = cljs.core.conj.call(null, ret__9471, cljs.core.first.call(null, s__9472));
      var G__9474 = cljs.core.next.call(null, s__9472);
      ret__9471 = G__9473;
      s__9472 = G__9474;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9471)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9477 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9477) {
        return or__3824__auto____9477
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9478 = x.lastIndexOf("/");
      if(i__9478 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9478 + 1)
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
    var or__3824__auto____9481 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9481) {
      return or__3824__auto____9481
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9482 = x.lastIndexOf("/");
    if(i__9482 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9482)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9489 = cljs.core.ObjMap.EMPTY;
  var ks__9490 = cljs.core.seq.call(null, keys);
  var vs__9491 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9492 = ks__9490;
      if(and__3822__auto____9492) {
        return vs__9491
      }else {
        return and__3822__auto____9492
      }
    }()) {
      var G__9493 = cljs.core.assoc.call(null, map__9489, cljs.core.first.call(null, ks__9490), cljs.core.first.call(null, vs__9491));
      var G__9494 = cljs.core.next.call(null, ks__9490);
      var G__9495 = cljs.core.next.call(null, vs__9491);
      map__9489 = G__9493;
      ks__9490 = G__9494;
      vs__9491 = G__9495;
      continue
    }else {
      return map__9489
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
    var G__9498__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9483_SHARP_, p2__9484_SHARP_) {
        return max_key.call(null, k, p1__9483_SHARP_, p2__9484_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9498 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9498__delegate.call(this, k, x, y, more)
    };
    G__9498.cljs$lang$maxFixedArity = 3;
    G__9498.cljs$lang$applyTo = function(arglist__9499) {
      var k = cljs.core.first(arglist__9499);
      var x = cljs.core.first(cljs.core.next(arglist__9499));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9499)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9499)));
      return G__9498__delegate(k, x, y, more)
    };
    G__9498.cljs$lang$arity$variadic = G__9498__delegate;
    return G__9498
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
    var G__9500__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9496_SHARP_, p2__9497_SHARP_) {
        return min_key.call(null, k, p1__9496_SHARP_, p2__9497_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9500 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9500__delegate.call(this, k, x, y, more)
    };
    G__9500.cljs$lang$maxFixedArity = 3;
    G__9500.cljs$lang$applyTo = function(arglist__9501) {
      var k = cljs.core.first(arglist__9501);
      var x = cljs.core.first(cljs.core.next(arglist__9501));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9501)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9501)));
      return G__9500__delegate(k, x, y, more)
    };
    G__9500.cljs$lang$arity$variadic = G__9500__delegate;
    return G__9500
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
      var temp__3974__auto____9504 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9504) {
        var s__9505 = temp__3974__auto____9504;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9505), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9505)))
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
    var temp__3974__auto____9508 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9508) {
      var s__9509 = temp__3974__auto____9508;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9509)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9509), take_while.call(null, pred, cljs.core.rest.call(null, s__9509)))
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
    var comp__9511 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9511.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9523 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9524 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9524)) {
        var vec__9525__9526 = temp__3974__auto____9524;
        var e__9527 = cljs.core.nth.call(null, vec__9525__9526, 0, null);
        var s__9528 = vec__9525__9526;
        if(cljs.core.truth_(include__9523.call(null, e__9527))) {
          return s__9528
        }else {
          return cljs.core.next.call(null, s__9528)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9523, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9529 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9529)) {
      var vec__9530__9531 = temp__3974__auto____9529;
      var e__9532 = cljs.core.nth.call(null, vec__9530__9531, 0, null);
      var s__9533 = vec__9530__9531;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9532)) ? s__9533 : cljs.core.next.call(null, s__9533))
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
    var include__9545 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9546 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9546)) {
        var vec__9547__9548 = temp__3974__auto____9546;
        var e__9549 = cljs.core.nth.call(null, vec__9547__9548, 0, null);
        var s__9550 = vec__9547__9548;
        if(cljs.core.truth_(include__9545.call(null, e__9549))) {
          return s__9550
        }else {
          return cljs.core.next.call(null, s__9550)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9545, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9551 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9551)) {
      var vec__9552__9553 = temp__3974__auto____9551;
      var e__9554 = cljs.core.nth.call(null, vec__9552__9553, 0, null);
      var s__9555 = vec__9552__9553;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9554)) ? s__9555 : cljs.core.next.call(null, s__9555))
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
  var this__9556 = this;
  var h__2192__auto____9557 = this__9556.__hash;
  if(!(h__2192__auto____9557 == null)) {
    return h__2192__auto____9557
  }else {
    var h__2192__auto____9558 = cljs.core.hash_coll.call(null, rng);
    this__9556.__hash = h__2192__auto____9558;
    return h__2192__auto____9558
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9559 = this;
  if(this__9559.step > 0) {
    if(this__9559.start + this__9559.step < this__9559.end) {
      return new cljs.core.Range(this__9559.meta, this__9559.start + this__9559.step, this__9559.end, this__9559.step, null)
    }else {
      return null
    }
  }else {
    if(this__9559.start + this__9559.step > this__9559.end) {
      return new cljs.core.Range(this__9559.meta, this__9559.start + this__9559.step, this__9559.end, this__9559.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9560 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9561 = this;
  var this__9562 = this;
  return cljs.core.pr_str.call(null, this__9562)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9563 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9564 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9565 = this;
  if(this__9565.step > 0) {
    if(this__9565.start < this__9565.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9565.start > this__9565.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9566 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9566.end - this__9566.start) / this__9566.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9567 = this;
  return this__9567.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9568 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9568.meta, this__9568.start + this__9568.step, this__9568.end, this__9568.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9569 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9570 = this;
  return new cljs.core.Range(meta, this__9570.start, this__9570.end, this__9570.step, this__9570.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9571 = this;
  return this__9571.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9572 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9572.start + n * this__9572.step
  }else {
    if(function() {
      var and__3822__auto____9573 = this__9572.start > this__9572.end;
      if(and__3822__auto____9573) {
        return this__9572.step === 0
      }else {
        return and__3822__auto____9573
      }
    }()) {
      return this__9572.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9574 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9574.start + n * this__9574.step
  }else {
    if(function() {
      var and__3822__auto____9575 = this__9574.start > this__9574.end;
      if(and__3822__auto____9575) {
        return this__9574.step === 0
      }else {
        return and__3822__auto____9575
      }
    }()) {
      return this__9574.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9576 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9576.meta)
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
    var temp__3974__auto____9579 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9579) {
      var s__9580 = temp__3974__auto____9579;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9580), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9580)))
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
    var temp__3974__auto____9587 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9587) {
      var s__9588 = temp__3974__auto____9587;
      var fst__9589 = cljs.core.first.call(null, s__9588);
      var fv__9590 = f.call(null, fst__9589);
      var run__9591 = cljs.core.cons.call(null, fst__9589, cljs.core.take_while.call(null, function(p1__9581_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9590, f.call(null, p1__9581_SHARP_))
      }, cljs.core.next.call(null, s__9588)));
      return cljs.core.cons.call(null, run__9591, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9591), s__9588))))
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
      var temp__3971__auto____9606 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9606) {
        var s__9607 = temp__3971__auto____9606;
        return reductions.call(null, f, cljs.core.first.call(null, s__9607), cljs.core.rest.call(null, s__9607))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9608 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9608) {
        var s__9609 = temp__3974__auto____9608;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9609)), cljs.core.rest.call(null, s__9609))
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
      var G__9612 = null;
      var G__9612__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9612__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9612__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9612__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9612__4 = function() {
        var G__9613__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9613 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9613__delegate.call(this, x, y, z, args)
        };
        G__9613.cljs$lang$maxFixedArity = 3;
        G__9613.cljs$lang$applyTo = function(arglist__9614) {
          var x = cljs.core.first(arglist__9614);
          var y = cljs.core.first(cljs.core.next(arglist__9614));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9614)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9614)));
          return G__9613__delegate(x, y, z, args)
        };
        G__9613.cljs$lang$arity$variadic = G__9613__delegate;
        return G__9613
      }();
      G__9612 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9612__0.call(this);
          case 1:
            return G__9612__1.call(this, x);
          case 2:
            return G__9612__2.call(this, x, y);
          case 3:
            return G__9612__3.call(this, x, y, z);
          default:
            return G__9612__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9612.cljs$lang$maxFixedArity = 3;
      G__9612.cljs$lang$applyTo = G__9612__4.cljs$lang$applyTo;
      return G__9612
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9615 = null;
      var G__9615__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9615__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9615__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9615__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9615__4 = function() {
        var G__9616__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9616 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9616__delegate.call(this, x, y, z, args)
        };
        G__9616.cljs$lang$maxFixedArity = 3;
        G__9616.cljs$lang$applyTo = function(arglist__9617) {
          var x = cljs.core.first(arglist__9617);
          var y = cljs.core.first(cljs.core.next(arglist__9617));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9617)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9617)));
          return G__9616__delegate(x, y, z, args)
        };
        G__9616.cljs$lang$arity$variadic = G__9616__delegate;
        return G__9616
      }();
      G__9615 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9615__0.call(this);
          case 1:
            return G__9615__1.call(this, x);
          case 2:
            return G__9615__2.call(this, x, y);
          case 3:
            return G__9615__3.call(this, x, y, z);
          default:
            return G__9615__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9615.cljs$lang$maxFixedArity = 3;
      G__9615.cljs$lang$applyTo = G__9615__4.cljs$lang$applyTo;
      return G__9615
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9618 = null;
      var G__9618__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9618__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9618__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9618__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9618__4 = function() {
        var G__9619__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9619 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9619__delegate.call(this, x, y, z, args)
        };
        G__9619.cljs$lang$maxFixedArity = 3;
        G__9619.cljs$lang$applyTo = function(arglist__9620) {
          var x = cljs.core.first(arglist__9620);
          var y = cljs.core.first(cljs.core.next(arglist__9620));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9620)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9620)));
          return G__9619__delegate(x, y, z, args)
        };
        G__9619.cljs$lang$arity$variadic = G__9619__delegate;
        return G__9619
      }();
      G__9618 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9618__0.call(this);
          case 1:
            return G__9618__1.call(this, x);
          case 2:
            return G__9618__2.call(this, x, y);
          case 3:
            return G__9618__3.call(this, x, y, z);
          default:
            return G__9618__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9618.cljs$lang$maxFixedArity = 3;
      G__9618.cljs$lang$applyTo = G__9618__4.cljs$lang$applyTo;
      return G__9618
    }()
  };
  var juxt__4 = function() {
    var G__9621__delegate = function(f, g, h, fs) {
      var fs__9611 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9622 = null;
        var G__9622__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9592_SHARP_, p2__9593_SHARP_) {
            return cljs.core.conj.call(null, p1__9592_SHARP_, p2__9593_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9611)
        };
        var G__9622__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9594_SHARP_, p2__9595_SHARP_) {
            return cljs.core.conj.call(null, p1__9594_SHARP_, p2__9595_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9611)
        };
        var G__9622__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9596_SHARP_, p2__9597_SHARP_) {
            return cljs.core.conj.call(null, p1__9596_SHARP_, p2__9597_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9611)
        };
        var G__9622__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9598_SHARP_, p2__9599_SHARP_) {
            return cljs.core.conj.call(null, p1__9598_SHARP_, p2__9599_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9611)
        };
        var G__9622__4 = function() {
          var G__9623__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9600_SHARP_, p2__9601_SHARP_) {
              return cljs.core.conj.call(null, p1__9600_SHARP_, cljs.core.apply.call(null, p2__9601_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9611)
          };
          var G__9623 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9623__delegate.call(this, x, y, z, args)
          };
          G__9623.cljs$lang$maxFixedArity = 3;
          G__9623.cljs$lang$applyTo = function(arglist__9624) {
            var x = cljs.core.first(arglist__9624);
            var y = cljs.core.first(cljs.core.next(arglist__9624));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9624)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9624)));
            return G__9623__delegate(x, y, z, args)
          };
          G__9623.cljs$lang$arity$variadic = G__9623__delegate;
          return G__9623
        }();
        G__9622 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9622__0.call(this);
            case 1:
              return G__9622__1.call(this, x);
            case 2:
              return G__9622__2.call(this, x, y);
            case 3:
              return G__9622__3.call(this, x, y, z);
            default:
              return G__9622__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9622.cljs$lang$maxFixedArity = 3;
        G__9622.cljs$lang$applyTo = G__9622__4.cljs$lang$applyTo;
        return G__9622
      }()
    };
    var G__9621 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9621__delegate.call(this, f, g, h, fs)
    };
    G__9621.cljs$lang$maxFixedArity = 3;
    G__9621.cljs$lang$applyTo = function(arglist__9625) {
      var f = cljs.core.first(arglist__9625);
      var g = cljs.core.first(cljs.core.next(arglist__9625));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9625)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9625)));
      return G__9621__delegate(f, g, h, fs)
    };
    G__9621.cljs$lang$arity$variadic = G__9621__delegate;
    return G__9621
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
        var G__9628 = cljs.core.next.call(null, coll);
        coll = G__9628;
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
        var and__3822__auto____9627 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9627) {
          return n > 0
        }else {
          return and__3822__auto____9627
        }
      }())) {
        var G__9629 = n - 1;
        var G__9630 = cljs.core.next.call(null, coll);
        n = G__9629;
        coll = G__9630;
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
  var matches__9632 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9632), s)) {
    if(cljs.core.count.call(null, matches__9632) === 1) {
      return cljs.core.first.call(null, matches__9632)
    }else {
      return cljs.core.vec.call(null, matches__9632)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9634 = re.exec(s);
  if(matches__9634 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9634) === 1) {
      return cljs.core.first.call(null, matches__9634)
    }else {
      return cljs.core.vec.call(null, matches__9634)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9639 = cljs.core.re_find.call(null, re, s);
  var match_idx__9640 = s.search(re);
  var match_str__9641 = cljs.core.coll_QMARK_.call(null, match_data__9639) ? cljs.core.first.call(null, match_data__9639) : match_data__9639;
  var post_match__9642 = cljs.core.subs.call(null, s, match_idx__9640 + cljs.core.count.call(null, match_str__9641));
  if(cljs.core.truth_(match_data__9639)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9639, re_seq.call(null, re, post_match__9642))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9649__9650 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9651 = cljs.core.nth.call(null, vec__9649__9650, 0, null);
  var flags__9652 = cljs.core.nth.call(null, vec__9649__9650, 1, null);
  var pattern__9653 = cljs.core.nth.call(null, vec__9649__9650, 2, null);
  return new RegExp(pattern__9653, flags__9652)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9643_SHARP_) {
    return print_one.call(null, p1__9643_SHARP_, opts)
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
          var and__3822__auto____9663 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9663)) {
            var and__3822__auto____9667 = function() {
              var G__9664__9665 = obj;
              if(G__9664__9665) {
                if(function() {
                  var or__3824__auto____9666 = G__9664__9665.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9666) {
                    return or__3824__auto____9666
                  }else {
                    return G__9664__9665.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9664__9665.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9664__9665)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9664__9665)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9667)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9667
            }
          }else {
            return and__3822__auto____9663
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9668 = !(obj == null);
          if(and__3822__auto____9668) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9668
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9669__9670 = obj;
          if(G__9669__9670) {
            if(function() {
              var or__3824__auto____9671 = G__9669__9670.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9671) {
                return or__3824__auto____9671
              }else {
                return G__9669__9670.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9669__9670.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9669__9670)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9669__9670)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9691 = new goog.string.StringBuffer;
  var G__9692__9693 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9692__9693) {
    var string__9694 = cljs.core.first.call(null, G__9692__9693);
    var G__9692__9695 = G__9692__9693;
    while(true) {
      sb__9691.append(string__9694);
      var temp__3974__auto____9696 = cljs.core.next.call(null, G__9692__9695);
      if(temp__3974__auto____9696) {
        var G__9692__9697 = temp__3974__auto____9696;
        var G__9710 = cljs.core.first.call(null, G__9692__9697);
        var G__9711 = G__9692__9697;
        string__9694 = G__9710;
        G__9692__9695 = G__9711;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9698__9699 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9698__9699) {
    var obj__9700 = cljs.core.first.call(null, G__9698__9699);
    var G__9698__9701 = G__9698__9699;
    while(true) {
      sb__9691.append(" ");
      var G__9702__9703 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9700, opts));
      if(G__9702__9703) {
        var string__9704 = cljs.core.first.call(null, G__9702__9703);
        var G__9702__9705 = G__9702__9703;
        while(true) {
          sb__9691.append(string__9704);
          var temp__3974__auto____9706 = cljs.core.next.call(null, G__9702__9705);
          if(temp__3974__auto____9706) {
            var G__9702__9707 = temp__3974__auto____9706;
            var G__9712 = cljs.core.first.call(null, G__9702__9707);
            var G__9713 = G__9702__9707;
            string__9704 = G__9712;
            G__9702__9705 = G__9713;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9708 = cljs.core.next.call(null, G__9698__9701);
      if(temp__3974__auto____9708) {
        var G__9698__9709 = temp__3974__auto____9708;
        var G__9714 = cljs.core.first.call(null, G__9698__9709);
        var G__9715 = G__9698__9709;
        obj__9700 = G__9714;
        G__9698__9701 = G__9715;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9691
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9717 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9717.append("\n");
  return[cljs.core.str(sb__9717)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9736__9737 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9736__9737) {
    var string__9738 = cljs.core.first.call(null, G__9736__9737);
    var G__9736__9739 = G__9736__9737;
    while(true) {
      cljs.core.string_print.call(null, string__9738);
      var temp__3974__auto____9740 = cljs.core.next.call(null, G__9736__9739);
      if(temp__3974__auto____9740) {
        var G__9736__9741 = temp__3974__auto____9740;
        var G__9754 = cljs.core.first.call(null, G__9736__9741);
        var G__9755 = G__9736__9741;
        string__9738 = G__9754;
        G__9736__9739 = G__9755;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9742__9743 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9742__9743) {
    var obj__9744 = cljs.core.first.call(null, G__9742__9743);
    var G__9742__9745 = G__9742__9743;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9746__9747 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9744, opts));
      if(G__9746__9747) {
        var string__9748 = cljs.core.first.call(null, G__9746__9747);
        var G__9746__9749 = G__9746__9747;
        while(true) {
          cljs.core.string_print.call(null, string__9748);
          var temp__3974__auto____9750 = cljs.core.next.call(null, G__9746__9749);
          if(temp__3974__auto____9750) {
            var G__9746__9751 = temp__3974__auto____9750;
            var G__9756 = cljs.core.first.call(null, G__9746__9751);
            var G__9757 = G__9746__9751;
            string__9748 = G__9756;
            G__9746__9749 = G__9757;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9752 = cljs.core.next.call(null, G__9742__9745);
      if(temp__3974__auto____9752) {
        var G__9742__9753 = temp__3974__auto____9752;
        var G__9758 = cljs.core.first.call(null, G__9742__9753);
        var G__9759 = G__9742__9753;
        obj__9744 = G__9758;
        G__9742__9745 = G__9759;
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
  pr_str.cljs$lang$applyTo = function(arglist__9760) {
    var objs = cljs.core.seq(arglist__9760);
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
  prn_str.cljs$lang$applyTo = function(arglist__9761) {
    var objs = cljs.core.seq(arglist__9761);
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
  pr.cljs$lang$applyTo = function(arglist__9762) {
    var objs = cljs.core.seq(arglist__9762);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__9763) {
    var objs = cljs.core.seq(arglist__9763);
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
  print_str.cljs$lang$applyTo = function(arglist__9764) {
    var objs = cljs.core.seq(arglist__9764);
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
  println.cljs$lang$applyTo = function(arglist__9765) {
    var objs = cljs.core.seq(arglist__9765);
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
  println_str.cljs$lang$applyTo = function(arglist__9766) {
    var objs = cljs.core.seq(arglist__9766);
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
  prn.cljs$lang$applyTo = function(arglist__9767) {
    var objs = cljs.core.seq(arglist__9767);
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
  printf.cljs$lang$applyTo = function(arglist__9768) {
    var fmt = cljs.core.first(arglist__9768);
    var args = cljs.core.rest(arglist__9768);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9769 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9769, "{", ", ", "}", opts, coll)
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
  var pr_pair__9770 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9770, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9771 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9771, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____9772 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9772)) {
        var nspc__9773 = temp__3974__auto____9772;
        return[cljs.core.str(nspc__9773), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9774 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9774)) {
          var nspc__9775 = temp__3974__auto____9774;
          return[cljs.core.str(nspc__9775), cljs.core.str("/")].join("")
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
  var pr_pair__9776 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9776, "{", ", ", "}", opts, coll)
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
  var normalize__9778 = function(n, len) {
    var ns__9777 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9777) < len) {
        var G__9780 = [cljs.core.str("0"), cljs.core.str(ns__9777)].join("");
        ns__9777 = G__9780;
        continue
      }else {
        return ns__9777
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9778.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9778.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9778.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9778.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9778.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9778.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__9779 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9779, "{", ", ", "}", opts, coll)
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
  var this__9781 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9782 = this;
  var G__9783__9784 = cljs.core.seq.call(null, this__9782.watches);
  if(G__9783__9784) {
    var G__9786__9788 = cljs.core.first.call(null, G__9783__9784);
    var vec__9787__9789 = G__9786__9788;
    var key__9790 = cljs.core.nth.call(null, vec__9787__9789, 0, null);
    var f__9791 = cljs.core.nth.call(null, vec__9787__9789, 1, null);
    var G__9783__9792 = G__9783__9784;
    var G__9786__9793 = G__9786__9788;
    var G__9783__9794 = G__9783__9792;
    while(true) {
      var vec__9795__9796 = G__9786__9793;
      var key__9797 = cljs.core.nth.call(null, vec__9795__9796, 0, null);
      var f__9798 = cljs.core.nth.call(null, vec__9795__9796, 1, null);
      var G__9783__9799 = G__9783__9794;
      f__9798.call(null, key__9797, this$, oldval, newval);
      var temp__3974__auto____9800 = cljs.core.next.call(null, G__9783__9799);
      if(temp__3974__auto____9800) {
        var G__9783__9801 = temp__3974__auto____9800;
        var G__9808 = cljs.core.first.call(null, G__9783__9801);
        var G__9809 = G__9783__9801;
        G__9786__9793 = G__9808;
        G__9783__9794 = G__9809;
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
  var this__9802 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9802.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9803 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9803.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9804 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9804.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9805 = this;
  return this__9805.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9806 = this;
  return this__9806.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9807 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9821__delegate = function(x, p__9810) {
      var map__9816__9817 = p__9810;
      var map__9816__9818 = cljs.core.seq_QMARK_.call(null, map__9816__9817) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9816__9817) : map__9816__9817;
      var validator__9819 = cljs.core._lookup.call(null, map__9816__9818, "\ufdd0'validator", null);
      var meta__9820 = cljs.core._lookup.call(null, map__9816__9818, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9820, validator__9819, null)
    };
    var G__9821 = function(x, var_args) {
      var p__9810 = null;
      if(goog.isDef(var_args)) {
        p__9810 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9821__delegate.call(this, x, p__9810)
    };
    G__9821.cljs$lang$maxFixedArity = 1;
    G__9821.cljs$lang$applyTo = function(arglist__9822) {
      var x = cljs.core.first(arglist__9822);
      var p__9810 = cljs.core.rest(arglist__9822);
      return G__9821__delegate(x, p__9810)
    };
    G__9821.cljs$lang$arity$variadic = G__9821__delegate;
    return G__9821
  }();
  atom = function(x, var_args) {
    var p__9810 = var_args;
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
  var temp__3974__auto____9826 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9826)) {
    var validate__9827 = temp__3974__auto____9826;
    if(cljs.core.truth_(validate__9827.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9828 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9828, new_value);
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
    var G__9829__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9829 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9829__delegate.call(this, a, f, x, y, z, more)
    };
    G__9829.cljs$lang$maxFixedArity = 5;
    G__9829.cljs$lang$applyTo = function(arglist__9830) {
      var a = cljs.core.first(arglist__9830);
      var f = cljs.core.first(cljs.core.next(arglist__9830));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9830)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9830))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9830)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9830)))));
      return G__9829__delegate(a, f, x, y, z, more)
    };
    G__9829.cljs$lang$arity$variadic = G__9829__delegate;
    return G__9829
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9831) {
    var iref = cljs.core.first(arglist__9831);
    var f = cljs.core.first(cljs.core.next(arglist__9831));
    var args = cljs.core.rest(cljs.core.next(arglist__9831));
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
  var this__9832 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9832.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9833 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9833.state, function(p__9834) {
    var map__9835__9836 = p__9834;
    var map__9835__9837 = cljs.core.seq_QMARK_.call(null, map__9835__9836) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9835__9836) : map__9835__9836;
    var curr_state__9838 = map__9835__9837;
    var done__9839 = cljs.core._lookup.call(null, map__9835__9837, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9839)) {
      return curr_state__9838
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9833.f.call(null)})
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
    var map__9860__9861 = options;
    var map__9860__9862 = cljs.core.seq_QMARK_.call(null, map__9860__9861) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9860__9861) : map__9860__9861;
    var keywordize_keys__9863 = cljs.core._lookup.call(null, map__9860__9862, "\ufdd0'keywordize-keys", null);
    var keyfn__9864 = cljs.core.truth_(keywordize_keys__9863) ? cljs.core.keyword : cljs.core.str;
    var f__9879 = function thisfn(x) {
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
                var iter__2462__auto____9878 = function iter__9872(s__9873) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9873__9876 = s__9873;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9873__9876)) {
                        var k__9877 = cljs.core.first.call(null, s__9873__9876);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9864.call(null, k__9877), thisfn.call(null, x[k__9877])], true), iter__9872.call(null, cljs.core.rest.call(null, s__9873__9876)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____9878.call(null, cljs.core.js_keys.call(null, x))
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
    return f__9879.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9880) {
    var x = cljs.core.first(arglist__9880);
    var options = cljs.core.rest(arglist__9880);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9885 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9889__delegate = function(args) {
      var temp__3971__auto____9886 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9885), args, null);
      if(cljs.core.truth_(temp__3971__auto____9886)) {
        var v__9887 = temp__3971__auto____9886;
        return v__9887
      }else {
        var ret__9888 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9885, cljs.core.assoc, args, ret__9888);
        return ret__9888
      }
    };
    var G__9889 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9889__delegate.call(this, args)
    };
    G__9889.cljs$lang$maxFixedArity = 0;
    G__9889.cljs$lang$applyTo = function(arglist__9890) {
      var args = cljs.core.seq(arglist__9890);
      return G__9889__delegate(args)
    };
    G__9889.cljs$lang$arity$variadic = G__9889__delegate;
    return G__9889
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9892 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9892)) {
        var G__9893 = ret__9892;
        f = G__9893;
        continue
      }else {
        return ret__9892
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9894__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9894 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9894__delegate.call(this, f, args)
    };
    G__9894.cljs$lang$maxFixedArity = 1;
    G__9894.cljs$lang$applyTo = function(arglist__9895) {
      var f = cljs.core.first(arglist__9895);
      var args = cljs.core.rest(arglist__9895);
      return G__9894__delegate(f, args)
    };
    G__9894.cljs$lang$arity$variadic = G__9894__delegate;
    return G__9894
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
    var k__9897 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9897, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9897, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____9906 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9906) {
      return or__3824__auto____9906
    }else {
      var or__3824__auto____9907 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9907) {
        return or__3824__auto____9907
      }else {
        var and__3822__auto____9908 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9908) {
          var and__3822__auto____9909 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9909) {
            var and__3822__auto____9910 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9910) {
              var ret__9911 = true;
              var i__9912 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9913 = cljs.core.not.call(null, ret__9911);
                  if(or__3824__auto____9913) {
                    return or__3824__auto____9913
                  }else {
                    return i__9912 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9911
                }else {
                  var G__9914 = isa_QMARK_.call(null, h, child.call(null, i__9912), parent.call(null, i__9912));
                  var G__9915 = i__9912 + 1;
                  ret__9911 = G__9914;
                  i__9912 = G__9915;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9910
            }
          }else {
            return and__3822__auto____9909
          }
        }else {
          return and__3822__auto____9908
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
    var tp__9924 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9925 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9926 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9927 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9928 = cljs.core.contains_QMARK_.call(null, tp__9924.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9926.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9926.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9924, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9927.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9925, parent, ta__9926), "\ufdd0'descendants":tf__9927.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9926, tag, td__9925)})
    }();
    if(cljs.core.truth_(or__3824__auto____9928)) {
      return or__3824__auto____9928
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
    var parentMap__9933 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9934 = cljs.core.truth_(parentMap__9933.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9933.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9935 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9934)) ? cljs.core.assoc.call(null, parentMap__9933, tag, childsParents__9934) : cljs.core.dissoc.call(null, parentMap__9933, tag);
    var deriv_seq__9936 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9916_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9916_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9916_SHARP_), cljs.core.second.call(null, p1__9916_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9935)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9933.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9917_SHARP_, p2__9918_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9917_SHARP_, p2__9918_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9936))
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
  var xprefs__9944 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9946 = cljs.core.truth_(function() {
    var and__3822__auto____9945 = xprefs__9944;
    if(cljs.core.truth_(and__3822__auto____9945)) {
      return xprefs__9944.call(null, y)
    }else {
      return and__3822__auto____9945
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9946)) {
    return or__3824__auto____9946
  }else {
    var or__3824__auto____9948 = function() {
      var ps__9947 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9947) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9947), prefer_table))) {
          }else {
          }
          var G__9951 = cljs.core.rest.call(null, ps__9947);
          ps__9947 = G__9951;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9948)) {
      return or__3824__auto____9948
    }else {
      var or__3824__auto____9950 = function() {
        var ps__9949 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9949) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9949), y, prefer_table))) {
            }else {
            }
            var G__9952 = cljs.core.rest.call(null, ps__9949);
            ps__9949 = G__9952;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9950)) {
        return or__3824__auto____9950
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9954 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9954)) {
    return or__3824__auto____9954
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9972 = cljs.core.reduce.call(null, function(be, p__9964) {
    var vec__9965__9966 = p__9964;
    var k__9967 = cljs.core.nth.call(null, vec__9965__9966, 0, null);
    var ___9968 = cljs.core.nth.call(null, vec__9965__9966, 1, null);
    var e__9969 = vec__9965__9966;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9967)) {
      var be2__9971 = cljs.core.truth_(function() {
        var or__3824__auto____9970 = be == null;
        if(or__3824__auto____9970) {
          return or__3824__auto____9970
        }else {
          return cljs.core.dominates.call(null, k__9967, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9969 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9971), k__9967, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9967), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9971)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9971
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9972)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9972));
      return cljs.core.second.call(null, best_entry__9972)
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
    var and__3822__auto____9977 = mf;
    if(and__3822__auto____9977) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9977
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____9978 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9979 = cljs.core._reset[goog.typeOf(x__2363__auto____9978)];
      if(or__3824__auto____9979) {
        return or__3824__auto____9979
      }else {
        var or__3824__auto____9980 = cljs.core._reset["_"];
        if(or__3824__auto____9980) {
          return or__3824__auto____9980
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9985 = mf;
    if(and__3822__auto____9985) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9985
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____9986 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9987 = cljs.core._add_method[goog.typeOf(x__2363__auto____9986)];
      if(or__3824__auto____9987) {
        return or__3824__auto____9987
      }else {
        var or__3824__auto____9988 = cljs.core._add_method["_"];
        if(or__3824__auto____9988) {
          return or__3824__auto____9988
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9993 = mf;
    if(and__3822__auto____9993) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____9993
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____9994 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9995 = cljs.core._remove_method[goog.typeOf(x__2363__auto____9994)];
      if(or__3824__auto____9995) {
        return or__3824__auto____9995
      }else {
        var or__3824__auto____9996 = cljs.core._remove_method["_"];
        if(or__3824__auto____9996) {
          return or__3824__auto____9996
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10001 = mf;
    if(and__3822__auto____10001) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10001
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____10002 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10003 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____10002)];
      if(or__3824__auto____10003) {
        return or__3824__auto____10003
      }else {
        var or__3824__auto____10004 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10004) {
          return or__3824__auto____10004
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10009 = mf;
    if(and__3822__auto____10009) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10009
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10010 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10011 = cljs.core._get_method[goog.typeOf(x__2363__auto____10010)];
      if(or__3824__auto____10011) {
        return or__3824__auto____10011
      }else {
        var or__3824__auto____10012 = cljs.core._get_method["_"];
        if(or__3824__auto____10012) {
          return or__3824__auto____10012
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10017 = mf;
    if(and__3822__auto____10017) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10017
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____10018 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10019 = cljs.core._methods[goog.typeOf(x__2363__auto____10018)];
      if(or__3824__auto____10019) {
        return or__3824__auto____10019
      }else {
        var or__3824__auto____10020 = cljs.core._methods["_"];
        if(or__3824__auto____10020) {
          return or__3824__auto____10020
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10025 = mf;
    if(and__3822__auto____10025) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10025
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____10026 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10027 = cljs.core._prefers[goog.typeOf(x__2363__auto____10026)];
      if(or__3824__auto____10027) {
        return or__3824__auto____10027
      }else {
        var or__3824__auto____10028 = cljs.core._prefers["_"];
        if(or__3824__auto____10028) {
          return or__3824__auto____10028
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10033 = mf;
    if(and__3822__auto____10033) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10033
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____10034 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10035 = cljs.core._dispatch[goog.typeOf(x__2363__auto____10034)];
      if(or__3824__auto____10035) {
        return or__3824__auto____10035
      }else {
        var or__3824__auto____10036 = cljs.core._dispatch["_"];
        if(or__3824__auto____10036) {
          return or__3824__auto____10036
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10039 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10040 = cljs.core._get_method.call(null, mf, dispatch_val__10039);
  if(cljs.core.truth_(target_fn__10040)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10039)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10040, args)
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
  var this__10041 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10042 = this;
  cljs.core.swap_BANG_.call(null, this__10042.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10042.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10042.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10042.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10043 = this;
  cljs.core.swap_BANG_.call(null, this__10043.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10043.method_cache, this__10043.method_table, this__10043.cached_hierarchy, this__10043.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10044 = this;
  cljs.core.swap_BANG_.call(null, this__10044.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10044.method_cache, this__10044.method_table, this__10044.cached_hierarchy, this__10044.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10045 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10045.cached_hierarchy), cljs.core.deref.call(null, this__10045.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10045.method_cache, this__10045.method_table, this__10045.cached_hierarchy, this__10045.hierarchy)
  }
  var temp__3971__auto____10046 = cljs.core.deref.call(null, this__10045.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10046)) {
    var target_fn__10047 = temp__3971__auto____10046;
    return target_fn__10047
  }else {
    var temp__3971__auto____10048 = cljs.core.find_and_cache_best_method.call(null, this__10045.name, dispatch_val, this__10045.hierarchy, this__10045.method_table, this__10045.prefer_table, this__10045.method_cache, this__10045.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10048)) {
      var target_fn__10049 = temp__3971__auto____10048;
      return target_fn__10049
    }else {
      return cljs.core.deref.call(null, this__10045.method_table).call(null, this__10045.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10050 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10050.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10050.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10050.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10050.method_cache, this__10050.method_table, this__10050.cached_hierarchy, this__10050.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10051 = this;
  return cljs.core.deref.call(null, this__10051.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10052 = this;
  return cljs.core.deref.call(null, this__10052.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10053 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10053.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10055__delegate = function(_, args) {
    var self__10054 = this;
    return cljs.core._dispatch.call(null, self__10054, args)
  };
  var G__10055 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10055__delegate.call(this, _, args)
  };
  G__10055.cljs$lang$maxFixedArity = 1;
  G__10055.cljs$lang$applyTo = function(arglist__10056) {
    var _ = cljs.core.first(arglist__10056);
    var args = cljs.core.rest(arglist__10056);
    return G__10055__delegate(_, args)
  };
  G__10055.cljs$lang$arity$variadic = G__10055__delegate;
  return G__10055
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10057 = this;
  return cljs.core._dispatch.call(null, self__10057, args)
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
  var this__10058 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10060, _) {
  var this__10059 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10059.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10061 = this;
  var and__3822__auto____10062 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10062) {
    return this__10061.uuid === other.uuid
  }else {
    return and__3822__auto____10062
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10063 = this;
  var this__10064 = this;
  return cljs.core.pr_str.call(null, this__10064)
};
cljs.core.UUID;
goog.provide("myapp.game");
goog.require("cljs.core");
myapp.game.layer_ctor = function layer_ctor() {
  var this__6102 = this;
  return cc.associateWithNative(this__6102, cc.Layer)
};
myapp.game.scene_ctor = function scene_ctor() {
  var this__6104 = this;
  return cc.associateWithNative(this__6104, cc.Scene)
};
myapp.game.space = cljs.core.atom.call(null, new cp.Space);
myapp.game.init_fn = function init_fn() {
  var this__6112 = this;
  this__6112._super();
  var size__6113 = cc.Director.getInstance().getWinSize();
  this__6112.sprite = cc.PhysicsSprite.create("watermelon.png");
  this__6112.body = new cp.Body(1, cp.momentForBox(1, 48, 48));
  this__6112.sprite.setBody(this__6112.body);
  cljs.core.deref.call(null, myapp.game.space).addBody(this__6112.body);
  var shape__6114 = new cp.BoxShape(this__6112.body, 64, 64);
  shape__6114.setElasticity(1);
  shape__6114.setFriction(1);
  cljs.core.deref.call(null, myapp.game.space).addShape(shape__6114);
  var G__6115__6116 = this__6112.sprite;
  G__6115__6116.setPosition(cc.p(size__6113.width / 2, size__6113.height / 2));
  G__6115__6116.setVisible(true);
  G__6115__6116.setAnchorPoint(cc.p(0.5, 0.5));
  G__6115__6116.setScale(0.5);
  G__6115__6116.setRotation(90);
  G__6115__6116;
  this__6112.addChild(this__6112.sprite, 0);
  this__6112.setTouchEnabled(true);
  this__6112.scoreLabel = cc.LabelTTF.create("0", "Arial", 32);
  var G__6117__6118 = this__6112.scoreLabel;
  G__6117__6118.setAnchorPoint(cc.p(0, 0));
  G__6117__6118.setPosition(cc.p(130, size__6113.height - 48));
  G__6117__6118.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
  G__6117__6118;
  return this__6112.addChild(this__6112.scoreLabel)
};
myapp.game.clicks = cljs.core.atom.call(null, 0);
myapp.game.on_touches_began = function on_touches_began(touches, events) {
  var this__6122 = this;
  var sprite__6123 = this__6122.sprite;
  var current_rotation__6124 = sprite__6123.getRotation();
  cljs.core.swap_BANG_.call(null, myapp.game.clicks, cljs.core.inc);
  this__6122.scoreLabel.setString(cljs.core.deref.call(null, myapp.game.clicks));
  return sprite__6123.setRotation(current_rotation__6124 + 5)
};
myapp.game.params = {isMouseDown:false, helloImg:null, helloLb:null, circle:null, sprite:null, scoreLabel:null, init:myapp.game.init_fn, ctor:myapp.game.layer_ctor, onTouchesBegan:myapp.game.on_touches_began};
myapp.game.hello_world_layer = cc.Layer.extend(myapp.game.params);
goog.exportSymbol("myapp.game.hello_world_layer", myapp.game.hello_world_layer);
myapp.game.update = function update(delta) {
  return cljs.core.deref.call(null, myapp.game.space).step(delta)
};
myapp.game.scene_params = {ctor:myapp.game.scene_ctor, space:null, update:myapp.game.update, onEnter:function() {
  var this__6125 = this;
  this__6125._super();
  var wall__6126 = new cp.SegmentShape(cljs.core.deref.call(null, myapp.game.space).staticBody, cp.v(0, 0), cp.v(800, 0), 0);
  wall__6126.setElasticity(1);
  wall__6126.setFriction(1);
  cljs.core.deref.call(null, myapp.game.space).addStaticShape(wall__6126);
  cljs.core.deref.call(null, myapp.game.space).gravity = cp.v(0, -100);
  this__6125.scheduleUpdate();
  var layer__6127 = new myapp.game.hello_world_layer;
  layer__6127.init();
  return this__6125.addChild(layer__6127)
}};
myapp.game.hello_world_scene = cc.Scene.extend(myapp.game.scene_params);
goog.exportSymbol("myapp.game.hello_world_scene", myapp.game.hello_world_scene);
