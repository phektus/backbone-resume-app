// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

	// Entry Model
	// ----------

	// Our basic **Entry** model has `text`, `description`, `order`, and `done` attributes.
	window.Entry = Backbone.Model.extend({

		// Default attributes for a todo item.
		defaults: function() {
		    return {
			description: '',
			done:  false,
			order: Entries.nextOrder()
		    };
		},
		
		// Toggle the `done` state of this todo item.
		toggle: function() {
		    this.save({done: !this.get("done")});
		}
		
	    });

	// Entry Collection
	// ---------------
	
	// The collection of entries is backed by *localStorage* instead of a remote
	// server.
	window.EntryList = Backbone.Collection.extend({

		// Reference to this collection's model.
		model: Entry,

		// Save all of the entry items under the `"entries"` namespace.
		localStorage: new Store("entries"),

		// Filter down the list of all entry items that are finished.
		done: function() {
		    return this.filter(function(entry){ return entry.get('done'); });
		},

		// Filter down the list to only todo items that are still not finished.
		remaining: function() {
		    return this.without.apply(this, this.done());
		},

		// We keep the Entries in sequential order, despite being saved by unordered
		// GUID in the database. This generates the next order number for new items.
		nextOrder: function() {
		    if (!this.length) return 1;
		    return this.last().get('order') + 1;
		},

		// Entries are sorted by their original insertion order.
		comparator: function(entry) {
		    return entry.get('order');
		}

	    });

	// Create our global collection of **Entries**.
	window.Entries = new EntryList;

	// Entry Item View
	// --------------

	// The DOM element for a todo item...
	window.EntryView = Backbone.View.extend({

		//... is a list tag.
		tagName:  "li",

		// Cache the template function for a single item.
		template: _.template($('#item-template').html()),

		// The DOM events specific to an item.
		events: {
		    "click .check"              : "toggleDone",
		    "dblclick div.entry-text"    : "edit",
		    "click span.todo-destroy"   : "clear",
		    "keypress .entry-input"      : "updateOnEnter"
		},

		// The TodoView listens for changes to its model, re-rendering.
		initialize: function() {
		    this.model.bind('change', this.render, this);
		    this.model.bind('destroy', this.remove, this);
		},

		// Re-render the contents of the todo item.
		render: function() {
		    $(this.el).html(this.template(this.model.toJSON()));
		    this.setText();
		    return this;
		},

		// To avoid XSS (not that it would be harmful in this particular app),
		// we use `jQuery.text` to set the contents of the todo item.
		setText: function() {
		    var text = this.model.get('text');
		    this.$('.entry-text').text(text);
		    this.input = this.$('.entry-input');
		    this.input.bind('blur', _.bind(this.close, this)).val(text);
		},

		// Toggle the `"done"` state of the model.
		toggleDone: function() {
		    this.model.toggle();
		},

		// Switch this view into `"editing"` mode, displaying the input field.
		edit: function() {
		    $(this.el).addClass("editing");
		    this.input.focus();
		},

		// Close the `"editing"` mode, saving changes to the todo.
		close: function() {
		    this.model.save({text: this.input.val()});
		    $(this.el).removeClass("editing");
		},

		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function(e) {
		    if (e.keyCode == 13) this.close();
		},

		// Remove this view from the DOM.
		remove: function() {
		    $(this.el).remove();
		},

		// Remove the item, destroy the model.
		clear: function() {
		    this.model.destroy();
		}
		
	    });

	// The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	window.AppView = Backbone.View.extend({
		
		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: $("#resumeapp"),

		// Our template for the line of statistics at the bottom of the app.
		statsTemplate: _.template($('#stats-template').html()),

		// Delegated events for creating new items, and clearing completed ones.
		events: {
		    "keypress #new-entry":  "createOnEnter",
		    "keyup #new-entry":     "showTooltip",
		    "click .todo-clear a": "clearCompleted"
		},

		// At initialization we bind to the relevant events on the `Entries`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting entries that might be saved in *localStorage*.
		initialize: function() {
		    this.input    = this.$("#new-entry");
		    
		    Entries.bind('add',   this.addOne, this);
		    Entries.bind('reset', this.addAll, this);
		    Entries.bind('all',   this.render, this);

		    Entries.fetch();
		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function() {
		    this.$('#entry-stats').html(this.statsTemplate({
				total:      Entries.length,
				done:       Entries.done().length,
				remaining:  Entries.remaining().length
			    }));
		},

		// Add a single entry item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function(entry) {
		    var view = new EntryView({model: entry});
		    $("#entry-list").append(view.render().el);
		},

		// Add all items in the **Entries** collection at once.
		addAll: function() {
		    Entries.each(this.addOne);
		},

		// If you hit return in the main input field, and there is text to save,
		// create new **Entry** model persisting it to *localStorage*.
		createOnEnter: function(e) {
		    var text = this.input.val();
		    if (!text || e.keyCode != 13) return;
		    Entries.create({text: text});
		    this.input.val('');
		},

		// Clear all done entr items, destroying their models.
		clearCompleted: function() {
		    _.each(Entries.done(), function(entry){ entry.destroy(); });
		    return false;
		},

		// Lazily show the tooltip that tells you to press `enter` to save
		// a new entry item, after one second.
		showTooltip: function(e) {
		    var tooltip = this.$(".ui-tooltip-top");
		    var val = this.input.val();
		    tooltip.fadeOut();
		    if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
		    if (val == '' || val == this.input.attr('placeholder')) return;
		    var show = function(){ tooltip.show().fadeIn(); };
		    this.tooltipTimeout = _.delay(show, 1000);
		}
		
	    });

	// Finally, we kick things off by creating the **App**.
	window.App = new AppView;
	
    });
