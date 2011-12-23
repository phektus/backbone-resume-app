// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

	// Entry Model
	// ----------

	// Our basic **Entry** model has `title`, `description`, `order`, and `done` attributes.
	window.Entry = Backbone.Model.extend({

		// Default attributes for a entry item.
		defaults: function() {
		    return {
			title: '',
			description: '',
			done:  false,
			order: Entries.nextOrder()
		    };
		},
        
        validate: function(attribs){
            if(attribs.title === ""){
                return "Please provide a title";
            }
            if(attribs.description === ""){
                return "Please provide a description";
            }
        },
        
        initialize: function(){
            console.log('Entry model has been initialized');
            this.bind("error", function(model, error){
                alert(error);
            });
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
	window.Entries = new EntryList();

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
		    "click span.entry-destroy"   : "clear"
		},

		// The TodoView listens for changes to its model, re-rendering.
		initialize: function() {
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
		    var title = this.model.get('title');
		    var description = this.model.get('description');
		    this.$('.entry-title').text(title);
		    this.$('.entry-description').text(description);
		},

		// Toggle the `"done"` state of the model.
		toggleDone: function() {
		    this.model.toggle();
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
		    "click #create-entry button":  "createOnClick",
		    "click .todo-clear a": "clearCompleted"
		},

		// At initialization we bind to the relevant events on the `Entries`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting entries that might be saved in *localStorage*.
		initialize: function() {
		    this.input    = this.$("#create-entry");

		    Entries.bind('add',   this.addOne, this);
		    Entries.bind('reset', this.addAll, this);
		    Entries.bind('all',   this.render, this);

		    Entries.fetch();
		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function() {
		    this.$('#entry-stats').html(this.statsTemplate({
				total:      Entries.length
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
		createOnClick: function(e) {
		    var title = this.$('#title').val();
		    var description = this.$('#description').val();
		    Entries.create({title: title, description: description});
		    this.$('#title').val('');
		    this.$('#description').val('');
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
