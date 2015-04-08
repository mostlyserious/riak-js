var Promise = require("bluebird");
var HttpClient = require('../http-test-client'),
    should = require('should'),
    helpers = require('./../test_helper');

var db, bucket, yzIndex, yzIndexVer = 1;

describe('http-client-solr-tests', function() {
  before(function(done) {
    this.timeout(50000);
    db = new HttpClient();
    // Ensure unit tests don't collide with pre-existing buckets
    bucket = 'users-riak-js-tests-solr';
    yzIndex = 'riak-js-index-test-' + yzIndexVer ;
    var obj = {
      email_s: 'test-search@gmail.com',
      name_s: 'Testy Test for Riak Search'
    };

    var dbSave = Promise.promisify( db.save, (db) );
    var dbGetBucket = Promise.promisify( db.getBucket, (db) );
    var dbSaveBucket = Promise.promisify( db.saveBucket, (db) );
    var dbYokozunaRemoveIndex = Promise.promisify( db.yokozuna.removeIndex, (db.yokozuna) );
    var dbYokozunaCreateIndex = Promise.promisify( db.yokozuna.createIndex, (db.yokozuna) );

    function reCreateSchema(){
      //delays required because schema propagation in riak is not async
      //Values taken from practical usage that can guarantee success on most environments
      return dbSaveBucket(bucket, {search_index: "_dont_index_"} )
        .delay(5000)
            .then ( function(){ return dbYokozunaRemoveIndex (yzIndex ); } )
            .delay(5000)
            .then ( function(){ return dbYokozunaCreateIndex (yzIndex ); } )
            .delay(10000)
            .then ( function(){ return dbSaveBucket(bucket, {search_index: yzIndex } ); } )
            .delay(5000)
    }

    dbGetBucket(bucket)
        .then ( function( response ) {
            var bucketProps = response && response[0];
            if ( ( bucketProps && bucketProps.search_index) != yzIndex)
              return reCreateSchema();
        })
        .then ( function(){ return dbSave( bucket, 'test-search@gmail.com', obj ); } )
        .delay(2000)
        .then ( function(){
            done();
         } )
  });

  after(function (done) {
    helpers.cleanupBucket(bucket, done);
  });

  it('creates an index', function (done) {
    db.yokozuna.getIndex(yzIndex, function (err, data) {
      should.not.exist(err);
      data.name.should.equal(yzIndex);
      data.schema.should.equal('_yz_default');
      done();
    });
  });

  it('saves the index bucket property', function (done) {
    db.saveBucket(bucket, { search_index: yzIndex }, function (err) {
      should.not.exist(err);

      done();
    });
  });

  it('gets the index bucket property', function (done) {
    db.getBucket(bucket, function (err, props) {
      props.search_index.should.equal(yzIndex);
      done();
    });
  });


  it('Searching via Solr interface', function (done) {
    db.yokozuna.find(yzIndex, 'email_s:test-search@gmail.com', function(err, data) {
      should.not.exist(err);
      should.exist(data);

      data.docs[0].email_s.should.equal('test-search@gmail.com');
      data.docs[0].name_s.should.equal('Testy Test for Riak Search');

      done();
    });
  });
});
