

M3.Ext.Register = function(config) {
    //класс предназначен для регистрации классов компонентов в менеджере
    //на примере ExtJs Ext.ComponentMgr
    this.ns = config['ns'];

    this.registerWidget = function(xtype, baseClass, config) {
        /**
         * регистрируем класс виджета в менеджере
         */
        var ns = this.ns; 
        var class_ = ns.extend(baseClass, {
            initComponent: function(config) {
                this.config = config;
                ns.apply(this, config);
                class_.superclass.initComponent.call(this, config);
            }
        });

        if (!this.getClass(xtype)) {
            ns.reg(xtype, class_);
        }

        return class_;
    };

    this.getClass = function(keyName) {
        return Ext.ComponentMgr.isRegistered(keyName);
    }
}


M3.Ext.Storage = function(ns, config) {

    "use_strict";
    //определим библиотечный метод для расширения экземпляра
    var ens = ns.apply || ns.extend, defaultKeyName = "xtype",
        baseClass = (ns && ns.window && ns.window.Window) ||
                    (ns && ns.Window);
    //определяем базовое имя для ключа в хранилище
    this.keyName = this.keyName || defaultKeyName;
    this.baseClass = baseClass;

    ens(this, config);

    //метод получения конструктора хранилища для определенной версии ExtJS
    var getStorageConstructor = function(ns) {

        var method;

        if (ns.version && ns.version == '3.4.0') {

            method = '';

        } else if (ns.version && ns.version == '4.2.2') {

            method = ns.widget;

        }

        return method;
    }
    //метод получения конструктора записи для определенной версии ExtJS
    var getRecord = function(ns) {

        var prototype;

        if (ns.version && ns.version == '3.4.0') {

            prototype = ns.data.Record.create([
                'xtype_',
                'config'
            ])

        } else if (ns.version && ns.version == '4.2.2') {
            //TODO - доработать
            prototype = ns.define('Ext.m3.ui4.ConfigModel', {
                extend: ns + '.data.Model',
                fields: []
            });

        }

        return prototype;
    }

    var storageClass, storageConstructor, concreteStorage;

    storageClass = (!this.simplify && ns && ns.data && ns.data.Store) || function() {};
    //получаем конструктор объекта хранилища 
    storageConstructor = getStorageConstructor(ns);
    //хранилище
    concreteStorage = storageConstructor ? storageConstructor(storageClass.toString(), {}) : new storageClass();
    this._storage = concreteStorage;
    
    this.createRegistry = function(customRegistrator, optionalConfig) {
        //setter метод для инстанцирования регистратора типа виджетов
        var registratorCls = customRegistrator || M3.Ext.Register,
            conf = optionalConfig || {ns: ns, baseClass: this.baseClass};

        this.registrator = new registratorCls(conf);
    }

    if (this.useRegistry) {
        this.createRegistry();
    }

    this.set = function(xtype, config) {

        //если не используем упрощенную схему хранения

        var registeredClass;
        if (this.useRegistry) {
            registeredClass = this.registrator.registerWidget(xtype, this.baseClass, config);
        }

        //если нужно отдельно хранить конфигурацию окон в своем хранилище
        if (config && this.standaloneConfigStorage  && !this.simplify) {
            //используется механизмы хранения ExtJS
            this.setConfig(xtype, config);

        } else if (config && this.standaloneConfigStorage && this.simplify) {
            //используется упрощенная схема хранения
            this._storage[xtype] = config;
            // console.log("STORAGE:SET->");
            // console.dir(this._storage[xtype]);
        }

        return [registeredClass, config];
    };

    this.get = function(xtype) {
        /**
         * метод получения записи из хранилища по его уникальному ключу
         * @xtype {String} - уникальный ключ хранения конфигурации
         */
        var cls;
        //если используется регистратор то берем класс виджета из него
        if (this.useRegistry) {
            cls = this.registrator.getClass(xtype);
        } else {
            cls = baseClass;
        }

        return cls;
    };

    //метод записи конфигурации виджета в хранилище
    this.setConfig = function(xtype, config) {

        var copyConf = Ext.apply({}, config),
            recordConf, newRecord, rc = getRecord(ns); 

        recordConf = {  
            xtype_: xtype,
            config: ns.encode(copyConf)
        };

        newRecord = new rc(recordConf, xtype);
        concreteStorage.add(newRecord);

    }

    this.getConfig = function(xtype) {
        var conf;
        //достаем упрощенно
        if (this.simplify) {
            conf = this._storage[xtype];
            // console.log("STORAGE:GET->");
            // console.dir(conf);
        } else {
            //с использованием механизмов ExtJS
            var recordFromStore = concreteStorage.getById(xtype);
            conf = Ext.decode(recordFromStore.get('config'));
        }

        return conf;

    }

}