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
			start_date: '',
            end_date: '',
            created: new Date()
		    };
		},
        
        validate: function(attribs){
            if(attribs.title === "") {
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

		// Entries are sorted by their original insertion order.
		comparator: function(entry) {
		    var created = entry.get('created');
            if(created.constructor === Date) {
                 created = created.getTime() * -1;
            } 
            return created
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
		    var start_date = this.model.get('start_date');
            var end_date = this.model.get('end_date');
		    this.$('.entry-title').text(title ? title : 'Unknown');
		    this.$('.entry-description').text(description);
            this.$('.entry-start_date').text(start_date ? start_date : 'Unknown');
		    this.$('.entry-end_date').text(end_date ? end_date : 'Present');
		},
        
		// Remove this view from the DOM.
		remove: function() {
            $(this.el).remove();
		},

		// Remove the item, destroy the model.
		clear: function() {
            if (confirm('Do you really want to remove '+this.model.get('title')+'?')){
		        this.model.destroy();
            }
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
		    $("#entry-list").prepend(view.render().el);
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
		    var start_date = this.$('#start_date').val();
            var end_date = this.$('#end_date').val();
            if (!start_date) {
                alert('Please indicate a start date');
                return;
            }
		    Entries.create({title: title, 
				description: description,
				start_date: start_date,
                end_date: end_date
		    });
		    this.$('#title').val('');
		    this.$('#description').val('');
		    this.$('#start_date').val('');
            this.$('#end_date').val('');
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
