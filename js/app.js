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

	function renderItems(objects) {
		$todoContainer = $('.todo-list');
		$todoContainer.empty();
		objects.forEach(function (o) {
			var compiledTemplate = _.template(NEW_ITEM_TEMPLATE);
			var model = {};
			model._id = o._id;
			model.text = o.text;
			model.completeClass = o.complete ? 'complete' : '';

			$todoElement = $(compiledTemplate(model));
			$todoElement.find('.toggle').prop('checked', o.complete);
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

		$('.destroy').click(function () {
			$li = $(this.closest('li'));
			id = $li.data('id');

			todos.remove(id)
				.then(function () {
					$li.detach();
				});
		});

		$('.toggle').click(function () {
			$li = $(this.closest('li'));
			id = $li.data('id');

			todos.object(id)
				.then(function (todo) {
					todo.complete = !$li.hasClass('complete');
					return todo.update();
				})
				.then(function () {
					$li.toggleClass('complete');
				});
		});
	}

	app.auth.login('test', 'test')
		.then(function () {
			return todos.objects()
				.then(renderItems);
		})
		.then(init)
		.catch(console.log.bind(console));
})();
