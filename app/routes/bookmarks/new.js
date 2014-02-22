import Bookmark from 'appkit/models/bookmark';

var BookmarksNewRoute = Ember.Route.extend({

  model: function() {
    return Bookmark.create();
  },

  setupController: function(controller, bookmark, queryParams) {
    if (queryParams.title && queryParams.url) {
      bookmark.title = queryParams.title;
      bookmark.url = queryParams.url;
      controller.set('bookmarkletUsed', true);
    }
    this._super(controller, bookmark);
  }

});

export default BookmarksNewRoute;
