#!/bin/bash

# get OS version
OS=$(sw_vers -productVersion)

# earlier Mac OS support
if [[ ${OS} < 10.14 ]]; then
	# get time from ntpdate
	delta=$(ntpdate -q pool.ntp.org | tail -n1)
	# look for the delta, remove sign
	regex="offset [-]*([0-9.]+) sec"
# Mojave support
else
	# get time from sntp
	delta=$(sntp -sS pool.ntp.org | tail -n1)
	# look for the delta, remove sign
	regex="([0-9.]+) \+\/\- [0-9.]+ pool.ntp.org"
fi

if [[ $delta =~ $regex ]]; then
	# strip decimal portion
	diff="${BASH_REMATCH[1]%.*}"
	
	# 60 s threshold
	if (( diff > 60 )); then
		echo "Time off by $diff sec"
		exit 1
	else
		echo "Time check passed"
		exit 0
	fi

else
	echo 'NTP time not found'
	exit 1
fi