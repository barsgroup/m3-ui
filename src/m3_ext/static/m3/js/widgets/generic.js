/* Диспетчеризация пользовательских событий для виджетов ExtJS 3.4

Антипаттерн:

    Допустим у нас есть ClientGrid который должен иначе обрабатыватся при сабмите формы. Типичным
    решением было бы определить метод обработки данного события (submit например) внутри компонента грида.
    если появился грид который чуть иначе должен обрабатывать сабмит формы то нужно наследовать
    класс от нашего грида AnotherClientGrid и переопределять метод. у нас получилось 2 класса
    которые различаются 1 методом. Это плохо. Грид не должен знать где он может применяться.
    Как надо поступить в таком случае? Лучше определить обработчик события отдельно в виде
    своего класса. Ему будет делегироваться исполнение обработки события submit
    В форме окна вызывается метод этого обработчика для соответствующего типа события.

Плюсы:

    1)  Организация в виде отдельных диспетчеров событий характерна слабой связанностью
        относительно кода виджетов. Для обработки событий одних и тех же групп событий мы
        не используем наследование при котором создается ненужная и громоздкая иерархия виджетов.
    2)  Концепция менеджеров и диспетчеров подается миграции с ExtJS 3.4 на 4.2

Организация кода:

1) Есть менеджер событий называемый диспетчером имеющий метод dispatch.
    Для каждого типа события необходимо зарегистрировать свой диспетчер
    в головном менеджере ActionManager

2) Диспетчер определяет то откуда приходит запрос для обработки данного события
   Например для сабмита формы и обработки этого события вызывается метод
   dispath у submitDispatcher, для загрузки данных на форму loadDispatcher

3) для каждого компонента (виджета) который должен обрабатывать такое действие (сабмит, загрузка в себя данных)
   нужно зарегистрировать класс виджета в соответствующем диспетчере с указанием специального
   хендлера для конечной обработки события (Ext.m3.BaseEventHandler).
   По умолчанию для класса виджета должен быть объявлен обработчик в пределах всего проекта.
   Но можно также заменить обработчик во время исполнения кода (runtime) для конкретного элемента
   ВАЖНО - Элемент должен иметь уникальное имя в пределах формы.
   У каждого элемента есть аттрибут для указания обработчика соответствующего события
   который будет заменен стандартным обработчиком при обработке события
   пример: overrideEventHandling: {
        "submit": 'my_event_handler'
   }

4) Пользователь может определить свой диспетчер событий, далее зарегистрировать
   свой виджет предварительно описав класс обработчик для данного события.

5) При срабатывании события будет вызван метод нужного обработчика (handler)
   для данного события


Принцип использования:

1) выберите наименование для вашего события;
2) опишите собственный диспетчер события наследуемый от Ext.m3.CustomEventDispatcher;
3) зарегистрируйте свой виджет в ActionManager
   указав свой класс обработчика события наследуемый от Ext.m3.BaseEventHandler
4) организуйте вызов метода-зацепки в нужном месте кода для перехвата события
*/


Ext.m3.ActionManager = Ext.extend(Ext.AbstractManager, {
    dispatch: function(event_group_alias, components, options) {
        debugger;
        var me = this;
        //hook - метод вызываемый когда необходимо обработать пользовательское действие
        Ext.each(components, function(component) {
            var getHandlerFunction = function(item) {
                return item.getActionAlias() == event_group_alias;
            };
            //пробегаемся по всем типам обработчиков и находим нужный
            var found_dispatcher = me.all.find(getHandlerFunction);
            if (found_dispatcher) {
                //инстанцируем нужный диспетчер
                var handlerType;
                if (component.overrideEventHandling) {
                    handlerType = component.overrideEventHandling[event_group_alias];
                } else {
                    //у компонента может не быть умолчательной конфигурации
                    //для обработки события
                    if (component.baseEventHandling) {
                        debugger;
                        handlerType = component.baseEventHandling[event_group_alias];
                    }
                }
                //если удалось найти нужный обработчик
                if (handlerType) {
                    debugger;
                    //вызываем обработчик для компонента
                    var found_handler = found_dispatcher.create({}, handlerType);
                    if (found_handler) {
                        me.doHandler(component, found_handler, options);
                    } else {
                        throw new Error(String.format(
                            "Dispatch error-> Handler for action {0} not found!"))
                    }
                }
            }
        });
        return true;
    },
    _registerDispatcher: function(dispatcher) {
         //для диспетчера вызывается регистрация по умолчанию
         Ext.m3.ActionManager.superclass.register.call(this, arguments[0]);
    },
    _registerEventHandler: function(handler_config) {
        assert(handler_config.length == 3,
                "Invalid number of items in config for registering event!");
        //регистрация виджета для обработки в соответствующем диспетчере
        //ищем подходящий диспетчер по имени экшена, нельзя иметь больше 1 обработчика
        var cls = handler_config[0].prototype,
            widget_action_alias = handler_config[1],
            handler_alias = handler_config[2], match_handlers = [];

        var findDispatcherFunc = function(item) {
            return item.getActionAlias() == widget_action_alias;
        };

        var dispatcher = this.all.find(findDispatcherFunc);

        if (dispatcher) {
            var handlers = dispatcher.all;
            handlers.each(function(handler_config) {
                var handlerAlias = handler_config[1];
                if (handler_alias == handlerAlias) {
                    match_handlers.push(handler_config);
                }
            });
            if (match_handlers.length > 1) {
                throw new Error("Duplicate registering!");
            }
        } else {
            dispatcher = this.create({}, widget_action_alias);
            this.register(dispatcher);
        }

        if (!cls.baseEventHandling) {
            cls.baseEventHandling = {};
        }

        if (!cls.baseEventHandling[widget_action_alias]) {
            cls.baseEventHandling[widget_action_alias] = handler_alias;
        } else {
            throw new Error(String.format(
                "Trying to override base event handler for {0}", cls
            ));
        }
        //делегируем регистрацию виджета найденному диспетчеру для указанного действия
        dispatcher.register([cls, handler_alias]);
    },
    register: function(item) {
        //мы можем зарегистрировать как диспетчер обработки действий
        //так и виджеты которые требуют такой обработки
        if (item instanceof Ext.m3.CustomEventDispatcher) {
            this._registerDispatcher(item);
        } else {
            this._registerEventHandler(item);
        }
    }
});

Ext.m3.actionManager = new Ext.m3.ActionManager();

Ext.m3.CustomEventDispatcher = Ext.extend(Ext.AbstractManager, {
    /*
      базовый обработчик для пользовательских событий
      в конечном проекте можно зарегистрировать собственное событие
    */
    constructor: function(config) {

        if (!this.typeName || config['typeName'] === "type") {
            throw new Error("Registering dispatcher must have valid attribute typeName")
        }

        Ext.m3.CustomEventDispatcher.superclass.constructor.call(this, config);
    },
    getActionAlias: function() {
        return this.typeName;
    },
    doHandler: function() {
        //template method
    }
});

Ext.m3.BaseSubmitHandler = Ext.extend(Ext.util.Observable, {
    /*обработчик сохранения формы*/
    constructor: function() {
        this.addEvents({
            "submit": true
        });
        Ext.m3.BaseSubmitHandler.superclass.constructor.call(this, arguments);
    },
    onSubmit: function(submitParams) {
        //template method
    }
});

Ext.m3.BaseLoadHandler = Ext.extend(Ext.util.Observable, {
    /*обработчик загрузки формы*/
    constructor: function() {
        this.addEvents({
            "load": true
        });
        Ext.m3.BaseLoadHandler.superclass.constructor.call(this, arguments);
    },
    onLoad: function(data) {
        //template method
    }
});





