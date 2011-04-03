#!/bin/bash
# npm 1.0 and 0.3 compatible build script 
GLOBAL_CAKE=`which cake`
LOCAL_CAKE="./node_modules/coffee-script/bin/cake"

if [ -n $GLOBAL_CAKE ]; then
    $GLOBAL_CAKE build
elif [ -f $LOCAL_CAKE ]; then
    $LOCAL_CAKE build
else 
    echo "No cake executable found, cannot compile. :-("
    exit 1
fi
