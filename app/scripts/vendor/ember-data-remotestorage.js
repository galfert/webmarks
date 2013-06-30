DS.RSSerializer = DS.JSONSerializer.extend({

  extract: function(loader, json, type, record) {
    this._super(loader, this.rootJSON(json, type), type, record);
  },

  rootJSON: function(json, type, pluralize) {
    var root = this.rootForType(type);
    if (pluralize === 'pluralize') { root = this.pluralize(root); }
    var rootedJSON = {};
    rootedJSON[root] = json;
    return rootedJSON;
  }

});

DS.RSAdapter = DS.Adapter.extend(Ember.Evented, {

  init: function() {
    this._super.apply(this, arguments);
  },

  serializer: DS.RSSerializer,

  find: function(store, type, id) {
    var rsType = type.remoteStorage.type;
    var rsClient = this._rsClient(type);
    var self = this;

    rsClient.getObject(id).then(
      function(result) {
        Ember.debug(result);
        delete(result['@type']);
        self.didFindRecord(store, type, result, id);
      }
    );
  },

  findAll: function(store, type) {
    var rsType = type.remoteStorage.type;
    var rsClient = this._rsClient(type);
    var path = type.remoteStorage.pathPrefix || '';
    var self = this;

    rsClient.getAll(path).then(
      function(response) {
        var results = [];
        for (var id in response) {
          // TODO uses of didSaveRecord are not implemented properly yet
          // after deleting a record, the id is still in the response object
          if (typeof(response[id]) !== 'undefined') {
            result = response[id];
            self._removeJSONLDFields(result);
            results.push(Ember.copy(result));
          }
        }
        Ember.run(function() {
          self.didFindAll(store, type, {'bookmarks': results});
        });
      },
      function(error) {
        Ember.debug("error while fetching records", error);
      }
    );
  },

  createRecord: function(store, type, record) {
    var rsClient = this._rsClient(type);
    var rsType = type.remoteStorage.type;
    var pathPrefix = type.remoteStorage.pathPrefix || '';
    var path = pathPrefix + record.id;
    var self = this;

    Ember.debug("about to create single record");
    console.log(record);

    var jsonObject = self.serialize(record, { includeId: true });
    jsonObject = self._removeNullValues(jsonObject);
    console.log(jsonObject);

    rsClient.storeObject(rsType, path, jsonObject).then(
      function() {
        self._removeJSONLDFields(newObject);
        Ember.debug("created record", record, newObject);
        Ember.run(function() {
          self.didCreateRecord(store, type, record, newObject);
        });
      },
      function(error) {
        Ember.debug("error while saving record", error);
        if (error.errors) {
          store.recordWasInvalid(record, error.errors);
        } else {
          store.recordWasError(record);
        }
      }
    );
  },

  createRecords: function(store, type, records) {
    return this._super(store, type, records);
  },

  updateRecord: function(store, type, record) {
    Ember.debug("about to update record: ", record);

    rsType = type.remoteStorage.type;
    rsClient = this._rsClient(type);
    var self = this;

    var serialized = self._removeNullValues(record.serialize({includeId:true}));
    var id = record.get('id');

    rsClient.storeObject(rsType, id, serialized).then(
      function() {
        self._removeJSONLDFields(serialized);
        Ember.debug("updated record", record, serialized);
        Ember.run(function() {
          self.didSaveRecord(store, type, record, serialized);
        });
      },
      function(error) {
        Ember.debug("error while saving record", error);
        store.recordWasError(record);
      }
    );
  },

  updateRecords: function(store, type, records) {
    return this._super(store, type, records);
  },

  deleteRecord: function(store, type, record) {
    rsType = type.remoteStorage.type;
    rsClient = this._rsClient(type);
    var self = this;

    Ember.debug("about to delete record");

    var id = record.get('id');
    rsClient.remove(id).then(function() {
      Ember.debug('deleted record');
      Ember.run(function() {
        self.didDeleteRecord(store, type, record);
      });
    });
  },

  deleteRecords: function(store, type, records) {
    return this._super(store, type, records);
  },

  // private

  _removeNullValues: function(object) {
    //TODO should be handled in remoteStorage.js instead
    Object.keys(object).forEach(function(key) {
      if (object[key] == null) {
        delete(object[key])
      }
    });

    return object;
  },

  _removeJSONLDFields: function(object) {
    delete(object['@type']);
    delete(object['@context']);
  },

  _rsClient: function(type) {
    return eval('remoteStorage.'+type.remoteStorage.module+'.client');
  }

});
