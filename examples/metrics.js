var db = require('../lib').getClient();
var lynx = require('lynx');
var metrics = new lynx('localhost', 8125);

var instrument = {
  'riak.request.end': function(event) {
    var runtime = event.finished_at - event.started_at;
    metrics.timing('riak.request.' + event.method.toLowerCase(), runtime);
  }
}

db.registerListener(instrument);

db.get('airlines', 'KLM')
db.save('airlines', 'Lufthansa', {country: 'DE'})
