// This file is provided to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file
// except in compliance with the License.  You may obtain
// a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

var utils = require('./utils')

function Meta(headers, interface, key, statusCode) {
  this.headers = headers;
  this.key = key;
  this.statusCode = statusCode;
  this.type = headers['content-type'];
  this.interface = interface;
}

Meta.prototype.addLinks = function(links) {
  if (!utils.isArray(links)) links = [links]
  this.headers.link = (this.headers.link ? this.headers.link + ", " : "") + this.makeLinks(links)
}

Meta.prototype.removeLink = function(link) {
  this.headers.link = this.makeLinks(this.links().filter(function(n) {
    return n.bucket !== link.bucket || n.key !== link.key
    })
  )
}

Meta.prototype.links = function() {
  return utils.stringToLinks(this.headers.link)
}

Meta.prototype.makeLinks = function(links) {
  var self = this;
  return links.map(function(link) {
    link.tag = link.tag || "_";
    return '</' + self.interface + '/' + link.bucket + '/' + link.key + '>; riaktag="' + link.tag + '"';
  }).join(", ");
}

module.exports = Meta