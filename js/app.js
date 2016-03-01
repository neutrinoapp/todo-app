var NEW_ITEM_TEMPLATE =
    '<li class="<%= completeClass %>" data-id="<%= _id %>">' +
    '<div class="view">' +
    '<input class="toggle" type="checkbox">' +
    '<label><%= text %></label>' +
    '<button class="destroy"></button>' +
    '</div>' +
    '<input class="edit" value="<%= text %>">' +
    '</li>';

(function () {
    var app = Neutrino.app('8139ed1ec39a467b96b0250dcf520749');
    var todos = app.use('todos');
    var todoCollection;
    var completedTodoCollection;

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
            model._id = todoObject._id;
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

            todoObject.on(Neutrino.ObjectEvents.change, function () {
                $li = listItemById(todoObject._id);
                $li.find('label').text(todoObject.text);
                $li.find('.toggle').prop('checked', todoObject.complete);
                $li.toggleClass('completed', todoObject.complete);
            });

            $todoContainer.append($todoElement);
        });
    }

    function init() {
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

        todoCollection.on(Neutrino.ArrayEvents.add, function (e) {
            var item = e.value;
            renderItems(item, false);
        });

        todoCollection.on(Neutrino.ArrayEvents.remove, function (e) {
            var item = e.value;
            listItemById(item._id).remove();
        });
    }

    app.auth.login('test', 'test')
        .then(function () {
            return todos.objects({realtime: true}).then(function (objects) {
                todoCollection = objects;
                renderItems(objects, true);
            }).then(function () {
                return todos.objects({
                    realtime: true,
                    filter: {
                        complete: true
                    }
                })
            }).then(function (completedObjects) {
                completedTodoCollection = completedObjects;
            });
        })
        .then(init)
        .catch(console.log.bind(console));
})();
