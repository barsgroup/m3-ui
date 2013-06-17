Ext.namespace('Ext.ux');

Ext.ux.OnDemandLoad = function(){

    loadComponent = function(component, callback){
        var fileType = component.substring(component.lastIndexOf('.'));
        var head = document.getElementsByTagName("head")[0];
        var done = false;
        if (fileType === ".js") {
            var fileRef = document.createElement('script');
            fileRef.setAttribute("type", "text/javascript");
            fileRef.setAttribute("src", component);
            fileRef.onload = fileRef.onreadystatechange = function(){
                if (!done) {
                    done = true;
                    if(typeof callback == "function"){
                        callback();
                    };
                    head.removeChild(fileRef);
                }
            };
        } else if (fileType === ".css") {
            var fileRef = document.createElement("link");
            fileRef.setAttribute("type", "text/css");
            fileRef.setAttribute("rel", "stylesheet");
            fileRef.setAttribute("href", component);
        }
        if (typeof fileRef != "undefined") {
            head.appendChild(fileRef);
        }
    };

    return {
        load: function(components, callback){
                loadComponent(components, callback);
        }
    };
}();