MNEMONIC=$(cat .env | grep MNEMONIC | tr -d 'MNEMONIC=')
ganache-cli -m "$MNEMONIC"
