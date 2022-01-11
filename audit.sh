echo 'Starting audit for all smart contracts'
echo ''

echo 'Mythril analysis'
for file in $(find contracts/ -name '*.sol')
do 
	echo 'auditing of '$file
	docker run -v $(pwd):/tmp --rm mythril/myth analyze /tmp/$file --solv 0.8.7
	echo ''
done
