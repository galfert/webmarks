App.Router.map(function () {
  this.resource('bookmarks', { path: '/bookmarks' }, function() {
    this.route('new');
  });
  this.route('import', { path: "/import" });
});

App.IndexRoute = Ember.Route.extend({
  redirect: function() {
    this.transitionTo('bookmarks');
  }
});

App.ImportRoute = Ember.Route.extend({});

App.BookmarksIndexRoute = Ember.Route.extend({
  model: function () {
    //TODO Use listView for bookmarks lists https://github.com/emberjs/list-view
    return App.Bookmark.find();
  }
});

App.BookmarksNewRoute = Ember.Route.extend({
  renderTemplate: function() {
    this.render('bookmarks/edit');
  },

  model: function() {
    return App.Bookmark.createRecord();
  }

  // deactivate: function() {
  //   var model = this.get('controller.model');
  //   if (!model.get('isSaving')) {
  //     model.deleteRecord();
  //   }
  // }
});
