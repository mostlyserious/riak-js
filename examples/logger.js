var db = require('../lib').getClient();

var instrument = {
  'riak.request.start': function(event) {
    console.log('[riak-js] ' + event.method.toUpperCase() + ' ' + event.path);
  }
}

db.registerListener(instrument);

db.get('airlines', 'KLM')
db.save('airlines', 'Lufthansa', {country: 'DE'})
