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
//# sourceMappingURL=sourcemaps/skylark-totaljs-spa.js.map
