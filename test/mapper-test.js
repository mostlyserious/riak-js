var should = require('should'),
  Mapper = require('../lib/mapper');

describe('mapper-tests', function() {
  it('Does not have any phases when initialized', function(done) {
    var mapper = new Mapper('airlines');

    mapper.phases.should.be.eql([]);
    mapper.inputs.should.equal('airlines');

    done();
  });

  it('Phases are added correctly', function(done) {
    var mapper = new Mapper('airlines');

    var job = mapper
      .map('Riak.mapValuesJson', 'abc')
      .link({ bucket: 'flights', keep: false})
      .reduce(function() { return 1 + 1 });

    job.phases.length.should.equal(3);
    job.phases[0].map.should.eql({ name: 'Riak.mapValuesJson', arg: 'abc', language: 'javascript' });
    job.phases[1].link.should.eql({ bucket: 'flights', keep: false});
    job.phases[2].reduce.source.should.equal('function () { return 1 + 1 }');
    job.phases[2].reduce.language.should.equal('javascript');

    // the `run` function depends on a client, so will be tested there instead
    should.not.exist(mapper.client);

    done();
  });

  it('Sets the language only on map and reduce phases', function(done) {
     var mapper = new Mapper('airlines');

    var job = mapper
      .link({ bucket: 'flights', keep: false})
      .map('Riak.mapValuesJson', 'abc')
      .map({module: 'riak_js', function: 'mapvalues', language: 'erlang'})
      .reduce(function() { return 1 + 1 });
    should.not.exist(job.phases[0].link.language);
    job.phases[1].map.language.should.equal('javascript');
    job.phases[2].map.language.should.equal('erlang');
    job.phases[3].reduce.language.should.equal('javascript');
    done();
  });
});
