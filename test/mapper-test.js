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
      .link({ bucket: 'flights', keep: false, language: 'english' })
      .reduce(function() { return 1 + 1 });

    job.phases.length.should.equal(3);
    job.phases[0].map.should.eql({ name: 'Riak.mapValuesJson', arg: 'abc', language: 'javascript' });
    job.phases[1].link.should.eql({ bucket: 'flights', keep: false, language: 'english' });
    job.phases[2].reduce.source.should.equal('function () { return 1 + 1 }');
    job.phases[2].reduce.language.should.equal('javascript');

    // the `run` function depends on a client, so will be tested there instead
    should.not.exist(mapper.client);

    done();
  });
});
