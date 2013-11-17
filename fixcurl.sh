#!/bin/bash

sed 's/\$(/{/g' $1 | sed 's/\$)/}/g' > $1.
mv $1. $1
