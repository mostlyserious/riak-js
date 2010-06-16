var sys = require('sys'),
  fs = require('fs');

var Faker= require('../index');

var passengers = [];

var country = function() {
  return Faker.Helpers.randomize(['Argentina', 'Brazil', 'Chile', 'Uruguay', 'Australia', 'Zimbabwe']);
}

var passenger = function(){

  return {
    "name":Faker.Name.findName(),
    "email":Faker.Internet.email(),
    "address":{
      "street":Faker.Address.streetName(true),
      "city":Faker.Address.city(),
      "zipcode":Faker.Address.zipCode(),
      "country": country()
    },
    "phone":Faker.PhoneNumber.phoneNumber(),
    "company":Faker.Company.companyName(),
  };

};

for(i = 2; i >= 0; i--){
	passengers.push(passenger());
};

fs.writeFile('./data.json',  JSON.stringify(passengers), function() {
  sys.puts("Airline and passenger data generated successfully!");
});