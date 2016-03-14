var NEW_ITEM_TEMPLATE =
    '<li class="<%= completeClass %>" data-id="<%= id %>">' +
    '<div class="view">' +
    '<input class="toggle" type="checkbox">' +
    '<label><%= text %></label>' +
    '<button class="destroy"></button>' +
    '</div>' +
    '<input class="edit" value="<%= text %>">' +
    '</li>';

(function () {
    var app = window.app = Neutrino.app('aedb27124c2e4d17bc3da2fad7081387');
    var todoCollection;
    var completedTodoCollection;
    var notCompletedTodoCollection;

    function listItemById(id) {
        return $('li[data-id="' + id + '"');
    }

    function destroyClickHandler(todoObject) {
        return function () {
            todoObject.remove();
        }
    }

    function toggleClickHandler($li, todoObject) {
        return function () {
            todoObject.complete = !$li.hasClass('completed');
            $li.toggleClass('completed');
        }
    }

    function todoDoubleClickHandler($todo, $edit, todoObject) {
        return function () {
            $edit.val(todoObject.text);
            $todo.toggleClass('editing');
            setTimeout(function () {
                $edit.focus();
            });
        }
    }

    function editElementKeyupHandler($todo, $edit, todoObject) {
        return function (e) {
            if (e.keyCode == 13) { //enter
                todoObject.text = $edit.val();
                $todo.toggleClass('editing');
            } else if (e.keyCode == 27) {
                $todo.toggleClass('editing');
            }
        }
    }

    function renderItems(objects, clear) {
        $todoContainer = $('.todo-list');
        if (clear) {
            $todoContainer.empty();
        }

        objects = Array.isArray(objects) ? objects : [objects];

        objects.forEach(function (todoObject) {
            var compiledTemplate = _.template(NEW_ITEM_TEMPLATE);
            var model = {};
            model.id = todoObject.id;
            model.text = todoObject.text;
            model.completeClass = todoObject.complete ? 'completed' : '';

            $todoElement = $(compiledTemplate(model));
            $todoElement.dataBound = todoObject;

            $toggle = $todoElement.find('.toggle');
            $toggle.prop('checked', todoObject.complete);
            $toggle.on('click', toggleClickHandler($todoElement, todoObject));

            $todoElement.find('.destroy').on('click', destroyClickHandler(todoObject));

            $edit = $todoElement.find('.edit');
            $edit.on('keyup', editElementKeyupHandler($todoElement, $edit, todoObject));
            $todoElement.find('.view').on('dblclick', todoDoubleClickHandler($todoElement, $edit, todoObject));

            $todoContainer.append($todoElement);
        });
    }

    function initHandlers() {
        var $todoInput = $('#todo-input');

        $todoInput.keyup(function (e) {
            if (e.keyCode == 13 && $todoInput.val()) {
                todoCollection.push({
                    text: $todoInput.val(),
                    complete: false
                });

                $todoInput.val('');
            } else if (e.keyCode == 27) {
                $todoInput.val('');
            }
        });

        $('.clear-completed').on('click', function () {
            var completed = todoCollection.filter(function (o) {
                return !!o.complete;
            });

            var completePromises = completed.map(function (o) {
                return o.remove();
            });

            Promise.all(completePromises)
                .then(function (ids) {
                    ids.forEach(function (id) {
                         listItemById(id).remove();
                    });
                });
        });

        var $filterButtons = $('.filter');
        $filterButtons.on('click', function () {
            $filterButtons.removeClass('selected');
            $(this).addClass('selected');
        });

        $('#toggle-all').on('click', function () {
            var allComplete = todoCollection.every(function (todo) {
                return todo.complete;
            });

            var toggle = !allComplete;
            todoCollection.forEach(function (todo) {
                todo.complete = toggle;
            });
        });

        var onItemAdded = function (e) {
            var item = e.value;
            renderItems(item, false);
        };

        var onItemRemoved = function (e) {
            var item = e.value;
            listItemById(item.id).remove();
        };

        var onItemChanged = function (e, todoObject, collection) {
            renderItems(collection, true);
        };

        window.onhashchange = function () {
            var hash = location.hash;

            var $filterAll = $('.filter-all');
            var $filterActive = $('.filter-active');
            var $filterCompleted = $('.filter-completed');

            var renderRealtimeCollection = function (collection) {
                notCompletedTodoCollection.off(Neutrino.ArrayEvents.add, onItemAdded);
                notCompletedTodoCollection.off(Neutrino.ArrayEvents.remove, onItemRemoved);
                notCompletedTodoCollection.off(Neutrino.ArrayEvents.itemChange, onItemChanged);

                completedTodoCollection.off(Neutrino.ArrayEvents.add, onItemAdded);
                completedTodoCollection.off(Neutrino.ArrayEvents.remove, onItemRemoved);
                completedTodoCollection.off(Neutrino.ArrayEvents.itemChange, onItemChanged);

                todoCollection.off(Neutrino.ArrayEvents.add, onItemAdded);
                todoCollection.off(Neutrino.ArrayEvents.remove, onItemRemoved);
                todoCollection.off(Neutrino.ArrayEvents.itemChange, onItemChanged);

                collection.on(Neutrino.ArrayEvents.add, onItemAdded);
                collection.on(Neutrino.ArrayEvents.remove, onItemRemoved);
                collection.on(Neutrino.ArrayEvents.itemChange, onItemChanged);

                renderItems(collection, true);
            };

            if (hash === '#/active') {
                renderRealtimeCollection(notCompletedTodoCollection);
                $filterAll.removeClass('selected');
                $filterCompleted.removeClass('selected');
                $filterActive.addClass('selected');
            } else if (hash === '#/completed') {
                renderRealtimeCollection(completedTodoCollection);
                $filterAll.removeClass('selected');
                $filterCompleted.addClass('selected');
                $filterActive.removeClass('selected');
            } else {
                renderRealtimeCollection(todoCollection);
                $filterAll.addClass('selected');
                $filterCompleted.removeClass('selected');
                $filterActive.removeClass('selected');
            }
        };

        window.onhashchange();
    }

    var initData = function () {
        var todos = app.use('todos');

        return Promise.all([
            todos.objects({realtime: true}).then(function (objects) {
                todoCollection = objects;
            }),
            todos.objects({
                realtime: true,
                filter: {
                    complete: false
                }
            }).then(function (notCompletedObjects) {
                notCompletedTodoCollection = notCompletedObjects;
                var collectionChangedHandler = function () {
                    $('.todo-count').text(notCompletedTodoCollection.length + ' items left');
                };

                notCompletedTodoCollection.on(Neutrino.ArrayEvents.change, collectionChangedHandler);
                collectionChangedHandler();
            }),
            todos.objects({
                realtime: true,
                filter: {
                    complete: true
                }
            }).then(function (completedObjects) {
                completedTodoCollection = completedObjects;
            })
        ]);
    };

    app.auth.login('test1', 'test1')
        .then(initData)
        .then(initHandlers)
        .catch(console.log.bind(console));
})();
