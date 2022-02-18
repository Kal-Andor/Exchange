import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from './helpers'


const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {

    let token
    let exchange
    const feePercent = 10

    beforeEach(async () => { // szerintem ez működne egy sima before() funkcióval
        // Deploying token
        token = await Token.new()

        // Transfer some tokens to user1
        token.transfer(user1, tokens(100), { from: deployer })

        // Deploy exchange
        exchange = await Exchange.new(feeAccount, feePercent)
    })

    describe('deployment', () => {

        it('tracks the fee account', async () => {

            const result = await exchange.feeAccount()
            result.should.equal(feeAccount)
        })

        it('tracks the fee percent', async () => {

            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })
    })

    describe('fallback', () => {
        it('reverts when Ether is sent', () => {
            exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
    })

    describe('depositing Ether', () => {
        let result
        let amount

        beforeEach(async () => {
            amount = ether(1)
            result = await exchange.depositEther({ from: user1, value: amount })
        })

        it('tracks the ether deposit', async () => {

            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())

        })

        it('emits a Deposit event', () => {
            const log = result.logs[0]
            log.event.should.eq('Deposit')
            const event = log.args
            event.token.should.equal(ETHER_ADDRESS, 'token is correct') /* not correct */
            event.user.should.equal(user1, 'user is correct') /* not correct */
            event.amount.toString().should.equal(amount.toString(), 'amount is correct') /* not correct */
            event.balance.toString().should.equal(amount.toString(), 'balance is correct') /* not correct */

        })

    })

    describe('withdrawing Ether', () => {

        let result
        let amount
        beforeEach(async () => {

            amount = ether(1)
            // Deposit Ether
            await exchange.depositEther({ from: user1, value: amount })
        })

        describe('success', () => {

            beforeEach(async () => {
                // Withdraw Ether
                result = await exchange.withdrawEther(amount, { from: user1 })
            })

            it('withdraws Ether funds', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal('0')
            })

            it('emits a Withdraw event', () => {
                const log = result.logs[0]
                log.event.should.eq('Withdraw')
                const event = log.args
                event.token.toString().should.equal(ETHER_ADDRESS, 'token is correct') /* not correct */
                event.user.toString().should.equal(user1, 'user is correct') /* not correct */
                event.amount.toString().should.equal(amount.toString(), 'amount is correct') /* not correct */
                event.balance.toString().should.equal('0', 'balance is correct') /* not correct */

            })
        })

        describe('failure', () => {
            it('rejects withdraws for insufficient balances', async () => {
                await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('depositing tokens', () => {

        let result
        let amount

        describe('success', () => {

            beforeEach(async () => {
                amount = tokens(10)
                await token.approve(exchange.address, amount, { from: user1 })
                result = await exchange.depositToken(token.address, amount, { from: user1 })
            })

            it('tracks the token deposit', async () => {
                // Check exchange token balance
                let balance
                balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())
                // Check tokens on exchange
                balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal(amount.toString())
            })

            it('emits a Deposit event', () => {
                const log = result.logs[0]
                log.event.should.eq('Deposit')
                const event = log.args
                event.token.toString().should.equal(token.address, 'token is correct') /* not correct */
                event.user.toString().should.equal(user1, 'user is correct') /* not correct */
                event.amount.toString().should.equal(amount.toString(), 'amount is correct') /* not correct */
                event.balance.toString().should.equal(amount.toString(), 'balance is correct') /* not correct */

            })
        })

        describe('failure', () => {

            it('rejects Ether deposits', () => {
                //Don't approve any tokens before depositing
                exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })

            it('fails when no tokens are approved', () => {
                //Don't approve any tokens before depositing
                exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('withdrawing tokens', () => {

        let result
        let amount

        describe('success', () => {

            beforeEach(async () => {
                // Deposit tokens first
                amount = tokens(10)
                await token.approve(exchange.address, amount, { from: user1 })
                await exchange.depositToken(token.address, amount, { from: user1 })
                // Withdraw tokens
                result = await exchange.withdrawToken(token.address, amount, { from: user1 })
            })

            it('withdraws token funds', async () => {
                const balance = await exchange.tokens(token.address, user1) // mi van ha nem adom meg, hogy ki kuldi, ki lesz az alapertelmezett kuldo?
                balance.toString().should.equal('0')
            })

            it('emits a Withdraw event', () => {
                const log = result.logs[0]
                log.event.should.eq('Withdraw')
                const event = log.args
                event.token.toString().should.equal(token.address, 'token is correct') /* not correct */
                event.user.toString().should.equal(user1, 'user is correct') /* not correct */
                event.amount.toString().should.equal(amount.toString(), 'amount is correct') /* not correct */
                event.balance.toString().should.equal('0', 'balance is correct') /* not correct */

            })
        })

        describe('failure', () => {
            it('rejects Ether withdraws', () => {
                exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })

            it('fails for insufficient balances', () => {
                // Attempt to withdraw tokens without sufficient balance
                exchange.withdrawToken(token.address, tokens(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('checking balances', () => {
        beforeEach(async () => {
            await exchange.depositEther({ from: user1, value: ether(1) })
        })

        it('returns user balance', async () => {
            const balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
            balance.toString().should.equal(ether(1).toString())
        })
    })

    describe('making orders', () => {
        let result
        beforeEach(async () => {
            result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), { from: user1 })
        })

        it('tracking the new order', async () => {
            const orderCount = await exchange.orderCount()
            orderCount.toString().should.equal('1')
            const order = await exchange.orders(1)
            order.id.toString().should.equal('1')
            order.user.should.equal(user1, 'id is incorrect')
            order.tokenGet.should.equal(token.address, 'tokenGet is incorrect')
            order.amountGet.toString().should.equal(tokens(1).toString(), 'amount is incorrect')
            order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is incorrect')
            order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is incorrect')
            order.timestamp.toString().length.should.be.at.least(1, 'timestamp is not present')
        })

        it('emits an Order event', async () => {
            const log = result.logs[0]
            log.event.should.eq('Order')
            const event = log.args
            event.id.toString().should.equal('1')
            event.user.should.equal(user1, 'id is incorrect')
            event.tokenGet.should.equal(token.address, 'tokenGet is incorrect')
            event.amountGet.toString().should.equal(tokens(1).toString(), 'amount is incorrect')
            event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is incorrect')
            event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is incorrect')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is not present')

        })
    })

    describe('order actions', () => {

        beforeEach('Makes order', async () => {                                 // Added some descriptions for the before each hooks for troubleshooting, trouble solved, left the descriptions

            await exchange.depositEther({ from: user1, value: ether(1) })
            await exchange.makeOrder(
                token.address,
                tokens(1),
                ETHER_ADDRESS,
                ether(1),
                { from: user1 }
            )
        })
        describe('filling orders', () => {

            beforeEach('Deposits token for user2', async () => {
                await token.transfer(user2, tokens(100), { from: deployer })
                await token.approve(exchange.address, tokens(2), { from: user2 })
                await exchange.depositToken(token.address, tokens(2), { from: user2 })

            })

            describe('success', () => {
                let result

                beforeEach('Fills order', async () => {
                    result = await exchange.fillOrder(1, { from: user2 })
                })

                it('executes the trade & charges fees', async () => {
                    let balance

                    balance = await exchange.balanceOf(token.address, user1)
                    balance.toString().should.equal(tokens(1).toString(), 'user 1 should have received tokens')

                    balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
                    balance.toString().should.equal(ether(1).toString(), 'user2 should have received Ether')

                    balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
                    balance.toString().should.equal('0', 'user1-s Ether should be deducted')

                    balance = await exchange.balanceOf(token.address, user2)
                    balance.toString().should.equal(tokens(0.9).toString(), 'user2-s token should be deducted with fee applied')

                    balance = await exchange.balanceOf(token.address, feeAccount)
                    balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount should have receives fee')
                })

                it('updates filled orders', async () => {
                    const orderFilled = await exchange.orderFilled(1)
                    orderFilled.should.equal(true)
                })

                it('emits a trade event', () => {
                    const log = result.logs[0]
                    log.event.should.eq('Trade')
                    const event = log.args
                    event.id.toString().should.equal('1')

                    event.user.should.equal(user1, 'id should be correct')
                    event.tokenGet.should.equal(token.address, 'tokenGet should be correct')
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'amount should be correct')
                    event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive should be correct')
                    event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive should be correct')
                    event.userFill.should.equal(user2, 'userFill should be correct')
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp should be present')
                })
            })

            describe('failure', () => {

                it('rejects invalid order ids', async () => {
                    await exchange.fillOrder(9999, { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })

                it('rejects already filled ids', async () => {

                    await exchange.fillOrder(1, { from: user2 }).should.be.fulfilled

                    await exchange.fillOrder(1, { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })

                it('rejects cancelled orders', async () => {

                    await exchange.cancelOrder(1, { from: user1 }).should.be.fulfilled

                    await exchange.fillOrder(1, { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
            })
        })
        describe('cancelling orders', () => {
            let result

            describe('success', async () => {
                beforeEach(async () => {
                    result = await exchange.cancelOrder(1, { from: user1 })
                })
                it('updates cancelled orders', async () => {
                    const orderCancelled = await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                })

                it('emits a Cancel event', async () => {
                    const log = result.logs[0]
                    log.event.should.eq('Cancel')
                    const event = log.args
                    event.id.toString().should.equal('1')
                    event.user.should.equal(user1, 'id is incorrect')
                    event.tokenGet.should.equal(token.address, 'tokenGet is incorrect')
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'amount is incorrect')
                    event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is incorrect')
                    event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is incorrect')
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp is not present')

                })
            })

            describe('failure', async () => {
                it('rejects invalid ids', () => {
                    exchange.cancelOrder(999999, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
                })
                it('rejects unauthorized cancelations', () => {
                    exchange.cancelOrder(1, { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
            })
        })
    })
})