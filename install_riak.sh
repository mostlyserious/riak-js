#!/bin/sh

if [ "$RIAK_VERSION" != "default" ]
then
  echo "Stopping Riak service"
  sudo service riak stop
  sudo apt-get purge riak
  riak_file="riak_$RIAK_VERSION-1_amd64.deb"
  cd /tmp
  echo "Downloading Riak $RIAK_VERSION"
  wget http://s3.amazonaws.com/downloads.basho.com/riak/$RIAK_RELEASE/$RIAK_VERSION/ubuntu/precise/$riak_file
  echo "Installing Riak $RIAK_VERSION"
  sudo dpkg -i $riak_file
  echo "Enabling Yokozuna"  #http://docs.basho.com/riak/latest/ops/advanced/configs/search/
  sudo sed -i 's/search = off/search = on/' /etc/riak/riak.conf  
  echo "Use leveldb as the backend"
  sudo sed -i 's/storage_backend = bitcask/storage_backend = leveldb/' /etc/riak/riak.conf
  echo "Set ulimit"
  sudo sh -c 'echo "ulimit -n 65536" > /etc/default/riak'
  echo "Starting Riak..."
  sudo service riak start  
  sleep 15
fi
curl http://localhost:8098/ping  
java -version
sudo ls -ls /var/log/riak
sudo cat /etc/riak/riak.conf
sudo ls -l /etc/riak
# 

