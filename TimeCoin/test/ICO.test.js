/* eslint-disable */

const { BigNumber } = require('@ethersproject/bignumber')
const chai = require('chai')
const { expect, bignumber, assert } = chai
const { ethers, network } = require('hardhat')
const { solidity } = require('ethereum-waffle')
chai.use(solidity)

let timeToken,
	Ico,
	owner,
	addr1,
	addr2,
	_companyReserve,
	_equityInvestors,
	_team,
	_liquidity,
	_foundation,
	_rewards,
	_burnAddr,
	_advisors,
	_crowdsale,
	addrs
let Rate = 5400000
let softCap = '10000000000000000000'
let addr = []

const now = async () => (await ethers.provider.getBlock('latest')).timestamp

describe('TIME ICO', () => {
	beforeEach(async () => {
		;[
			owner,
			addr1,
			addr2,
			_companyReserve,
			_equityInvestors,
			_team,
			_liquidity,
			_foundation,
			_rewards,
			_burnAddr,
			_advisors,
			_crowdsale,
			...addrs
		] = await ethers.getSigners()

		const TimeToken = await ethers.getContractFactory('TimeToken')

		timeToken = await TimeToken.deploy(
			_companyReserve.address,
			_equityInvestors.address,
			_team.address,
			_liquidity.address,
			_foundation.address,
			_rewards.address,
			_burnAddr.address,
			_advisors.address,
			_crowdsale.address
		)
		await timeToken.deployed()

		const ICO = await ethers.getContractFactory('ICO')

		Ico = await ICO.deploy(
			Rate,
			owner.address,
			timeToken.address,
			(await now()) + 3,
			(await now()) + 5184000,
			BigNumber.from(softCap.toString())
		)
		await Ico.deployed()
		const amount = await timeToken.balanceOf(_crowdsale.address)

		await timeToken.connect(_crowdsale).transfer(Ico.address, amount)
	})

	describe('crowdsale contract', () => {
		it('tracks the rate', async function () {
			expect(await Ico.rate()).to.equal(Rate)
		})

		it('tracks the wallet', async function () {
			expect(await Ico.wallet()).to.equal(owner.address)
		})

		it('tracks the token', async function () {
			expect(await Ico.token()).to.equal(timeToken.address)
		})

		it('tracks the stage', async function () {
			expect((await Ico.stage()).toString()).to.equal('0')
		})
	})

	describe('Buy Tokens', () => {
		it('buy tokens for private', async function () {
			await Ico.buyTokens(addr1.address, {
				value: ethers.utils.parseEther('10'),
			})

			let balanceOfToken = await Ico.balanceOf(addr1.address)
			expect(balanceOfToken.toString()).to.be.equal(
				'54000000000000000000000000'
			)

			await Ico.buyTokens(addr2.address, {
				value: ethers.utils.parseEther('14.4'),
			})

			balanceOfToken = await Ico.balanceOf(addr2.address)
			expect(balanceOfToken.toString()).to.be.equal(
				'77760000000000000000000000'
			)
		})

		it('if user buy tokens for multiple times ', async function () {
			await Ico.buyTokens(addr1.address, {
				value: ethers.utils.parseEther('2'),
			})

			let addr1TokenAmount = await Ico.balanceOf(addr1.address)

			await Ico.buyTokens(addr1.address, {
				value: ethers.utils.parseEther('3'),
			})

			addr1TokenAmount = await Ico.balanceOf(addr1.address)
			expect(addr1TokenAmount.toString()).to.be.equal(
				'27000000000000000000000000'
			)
		})

		it('Buy tokens for private then change stage & buy for public', async function () {
			await Ico.buyTokens(addr1.address, {
				value: ethers.utils.parseEther('5'),
			})

			let tokenBalance = await Ico.balanceOf(addr1.address)
			expect(tokenBalance.toString()).to.be.equal(
				'27000000000000000000000000'
			)

			expect(await Ico.stage()).to.be.equal(0)

			await Ico.connect(owner).changeStage(1)
			expect(await Ico.stage()).to.be.equal(1)

			await Ico.buyTokens(addr2.address, {
				value: ethers.utils.parseEther('1'),
			})

			tokenBalance = await Ico.balanceOf(addr2.address)
			expect(tokenBalance.toString()).to.be.equal(
				'3780000000000000000000000'
			)
		})
	})
	describe('Goal Condition', () => {
		it('if Goal reached', async function () {
			await Ico.buyTokens(addr1.address, {
				value: ethers.utils.parseEther('10'),
			})

			let closeTimes = 60 * 24 * 60 * 60
			await network.provider.send('evm_increaseTime', [closeTimes])
			await network.provider.send('evm_mine')

			await Ico.finalize()
			await Ico.withdrawTokens(addr1.address)

			let addr1IcoBalance = await Ico.balanceOf(addr1.address)
			expect(addr1IcoBalance.toString()).to.be.equal('0')

			let addr1TokenBalance = await timeToken.balanceOf(addr1.address)
			expect(addr1TokenBalance.toString()).to.be.equal(
				'54000000000000000000000000'
			)
		})

		it('Goal not reached', async function () {
			await Ico.buyTokens(addr1.address, {
				value: ethers.utils.parseEther('1'),
			})

			let closeTimes = 60 * 24 * 60 * 60
			await network.provider.send('evm_increaseTime', [closeTimes])
			await network.provider.send('evm_mine')

			await Ico.finalize()
			await Ico.connect(addr1).claimRefund(addr1.address)

			let icoBalance = await Ico.balanceOf(addr1.address)

			expect(icoBalance.toString()).to.be.equal('0')
			let tokenBalance = await timeToken.balanceOf(addr1.address)

			expect(tokenBalance.toString()).to.be.equal('0')
		})

		it('Goal not reached & user claim refund again and again', async function () {
			await Ico.buyTokens(addr1.address, {
				value: ethers.utils.parseEther('1'),
			})

			let closeTimes = 60 * 24 * 60 * 60
			await network.provider.send('evm_increaseTime', [closeTimes])
			await network.provider.send('evm_mine')

			await Ico.finalize()
			await Ico.connect(addr1).claimRefund(addr1.address)

			let icoBalance = await Ico.balanceOf(addr1.address)

			expect(icoBalance.toString()).to.be.equal('0')
			let tokenBalance = await timeToken.balanceOf(addr1.address)

			expect(tokenBalance.toString()).to.be.equal('0')

			await expect(Ico.claimRefund(addr1.address)).to.be.revertedWith(
				'Insufficient tokens'
			)
		})
	})

	describe('To check buyBack functionality', () => {
		it('buyBack functionality', async function () {
			await Ico.buyTokens(addr2.address, {
				value: ethers.utils.parseEther('12'),
			})
			let balance = await Ico.balanceOf(addr2.address)
			expect(balance.toString()).to.be.equal('64800000000000000000000000')

			await Ico.connect(addr2).buyBack()

			balance = await Ico.balanceOf(addr2.address)
			expect(balance.toString()).to.be.equal('0')

			let amount = await timeToken.balanceOf(addr2.address)
			expect(amount.toString()).to.be.equal('0')
		})

		it('If user call buyBack function after ICO ends', async function () {
			await Ico.buyTokens(addr1.address, {
				value: ethers.utils.parseEther('10'),
			})
			let closeTimes = 60 * 24 * 60 * 60
			await network.provider.send('evm_increaseTime', [closeTimes])
			await network.provider.send('evm_mine')

			await network.provider.send('evm_increaseTime', [closeTimes])
			await network.provider.send('evm_mine')

			await expect(Ico.connect(addr1).buyBack()).to.be.revertedWith(
				'TimedCrowdsale: not open'
			)
		})

		it('buyBack amount and again try to buy back', async function () {
			await Ico.buyTokens(addr2.address, {
				value: ethers.utils.parseEther('12'),
			})
			let balance = await Ico.balanceOf(addr2.address)
			expect(balance.toString()).to.be.equal('64800000000000000000000000')
			await Ico.connect(addr2).buyBack()

			balance = await Ico.balanceOf(addr2.address)
			expect(balance.toString()).to.be.equal('0')

			let amount = await timeToken.balanceOf(addr2.address)
			expect(amount.toString()).to.be.equal('0')

			await expect(Ico.connect(addr2).buyBack()).to.be.revertedWith(
				'Insufficient tokens'
			)
		})
	})

	describe('Check stage function', () => {
		it('Only owner can change the stage', async function () {
			await Ico.connect(owner).changeStage(1)
			let stage = await Ico.stage()
			expect(stage.toString()).to.be.equal('1')

			await Ico.connect(owner).changeStage(0)
			stage = await Ico.stage()
			expect(stage.toString()).to.be.equal('0')
		})

		it('Change stage function not call by Owner ', async function () {
			await expect(Ico.connect(addr1).changeStage(1)).to.be.revertedWith(
				'Ownable: caller is not the owner'
			)
		})
	})

	describe('Change rate', () => {
		it('Only owner can change the rate for public sale', async function () {
			await Ico.changeStage(1)
			expect(await Ico.rate()).to.equal('3780000')
			await Ico.connect(owner).changeRate(4780000, 1)

			expect(await Ico.rate()).to.equal('4780000')
		})

		it('Only owner can change the rate for private sale', async function () {
			expect(await Ico.rate()).to.equal('5400000')
			await Ico.connect(owner).changeRate(7780000, 0)

			expect(await Ico.rate()).to.equal('7780000')
		})

		it('Change rate function not call by Owner', async function () {
			await expect(
				Ico.connect(addr1).changeRate(3780000, 1)
			).to.be.revertedWith('Ownable: caller is not the owner')
		})
	})
})
