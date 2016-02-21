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
	var app = Neutrino.app('19bcea83e5f3481cb74e40c7146f1a30');
	var todos = app.use('todos');
	//TODO: implement login

	function destroyClickHandler() {
		$li = $(this.closest('li'));
		id = $li.data('id');

		todos.remove(id)
			.then(function () {
				$li.detach();
			});
	}

	function toggleClickHandler() {
		$li = $(this.closest('li'));
		id = $li.data('id');

		todos.object(id)
			.then(function (todo) {
				todo.complete = !$li.hasClass('completed');
				return todo.update();
			})
			.then(function () {
				$li.toggleClass('completed');
			});
	}

    function todoDoubleClickHandler($todo, $edit) {
        return function () {
            $edit.val($todo.dataBound.text);
            $edit.focus();
            $todo.toggleClass('editing');
        }
    }

    function editElementKeyupHandler($todo, $edit) {
        return function (e) {
            if (e.keyCode == 13) { //enter
                $todo.dataBound.text = $edit.val();
                $todo.toggleClass('editing');
            }
        }
    }

	function renderItems(objects) {
		$todoContainer = $('.todo-list');
		$todoContainer.empty();
		objects.forEach(function (o) {
			var compiledTemplate = _.template(NEW_ITEM_TEMPLATE);
			var model = {};
			model._id = o._id;
			model.text = o.text;
			model.completeClass = o.complete ? 'completed' : '';

			$todoElement = $(compiledTemplate(model));
            $todoElement.dataBound = o;

            o.onChanged(function () {
                $('li[data-id="' + o._id + '"').find('label').text(o.text);
            });

			$toggle = $todoElement.find('.toggle');
			$toggle.prop('checked', o.complete);
			$toggle.on('click', toggleClickHandler);

			$todoElement.find('.destroy').on('click', destroyClickHandler);

            $edit = $todoElement.find('.edit');
            $edit.on('keyup', editElementKeyupHandler($todoElement, $edit));
            $todoElement.find('.view').on('dblclick', todoDoubleClickHandler($todoElement, $edit));

			$todoContainer.append($todoElement);
		});
	}

	function init() {
		$('#todo-input').keyup(function(e){
			if(e.keyCode == 13) {
				todos.object({
					text: $('#todo-input').val()
				}).then(function (id) {
					$('#todo-input').val('');
					//TODO: filter by id
					return todos.objects();
				}).then(renderItems);
			}
		});
	}

	app.auth.login('test', 'test')
		.then(function () {
			return todos.objects({
                realtime: true
            }).then(renderItems);
		})
		.then(init)
		.catch(console.log.bind(console));
})();
