require('@nomiclabs/hardhat-waffle')
require('solidity-coverage')
//require('hardhat-gas-reporter')

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
	const accounts = await hre.ethers.getSigners()

	for (const account of accounts) {
		console.log(account.address)
	}
})

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	solidity: {
		compilers: [
			{
				version: '0.5.5',
			},
			{
				version: '0.8.0',
			},
		],
	},
}
