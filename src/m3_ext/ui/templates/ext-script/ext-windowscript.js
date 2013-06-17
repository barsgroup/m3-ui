(function (){
    var win = {{ window.render|safe }};
    
	function closeWindow(){ win.close(); }
    
    {{ window.render_globals }}
    
    win.show();
    return win;
})()



