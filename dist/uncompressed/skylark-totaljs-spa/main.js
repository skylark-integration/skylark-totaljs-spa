define([
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