git diff HEAD --numstat | awk '{add+=$1; del+=$2} END {printf "+%d -%d\n", add, del}'
