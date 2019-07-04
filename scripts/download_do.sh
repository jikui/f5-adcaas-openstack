#!/bin/bash 

# TODO: make /var/tmp/ASGExtensions and filelist configurable.
filelist="
https://github.com/F5Networks/f5-declarative-onboarding/releases/download/v1.5.0/f5-declarative-onboarding-1.5.0-11.noarch.rpm
"
mkdir -p /var/tmp/DO

(
    cd /var/tmp/DO
    for n in $filelist; do
        filebase=`basename $n`
        if [ ! -f $filebase ]; then 
            wget $n
        fi
    done
)

