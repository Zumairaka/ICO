/* eslint-disable */
const { ethers } = require('hardhat')

async function main() {
	const [owner] = await ethers.getSigners()
	const TimeToken = await ethers.getContractFactory('TimeToken')
	const timeToken = await TimeToken.deploy()
	console.log('Time token deployed to:', timeToken.address)

	const ICO = await ethers.getContractFactory('ICO')

	const ico = await ICO.deploy(
		'25',
		owner.address,
		timeToken.address,
		1644831300, //3:55
		1644832800, //4:15
		'10000000000000000000'
	)
	console.log('Owner address', owner.address)

	console.log('Time Ico deployed to:', guIco.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
