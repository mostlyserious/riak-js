#!/bin/sh

if [ $RIAK_VERSION != "default" ]
then
  echo "Stopping Riak service"
  sudo service riak stop
  sudo apt-get remove riak
  riak_file="riak_$RIAK_VERSION-1_amd64.deb"
  cd /tmp
  echo "Downloading Riak $RIAK_VERSION"
  wget http://s3.amazonaws.com/downloads.basho.com/riak/$RIAK_RELEASE/$RIAK_VERSION/ubuntu/precise/$riak_file
  echo "Installing Riak $RIAK_VERSION"
  sudo dpkg -i $riak_file
  echo "Enabling yokozuna"
  sudo sed -i'' 's/yokozuna = off/yokozuna = on/' /etc/riak/riak.conf
  echo "Starting Riak..."
  sudo service riak start
fi
