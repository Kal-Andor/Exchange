import Web3 from 'web3'
import {
    web3Loaded,
    web3AccountLoaded,
    tokenLoaded,
    exchangeLoaded,
    cancelledOrdersLoaded,
    filledOrdersLoaded,
    allOrdersLoaded,
    orderCancelling,
    orderCancelled,
    orderFilling,
    orderFilled,
    etherBalanceLoaded,
    tokenBalanceLoaded,
    exchangeEtherBalanceLoaded,
    exchangeTokenBalanceLoaded,
    balancesLoading,
    balancesLoaded,
    buyOrderMaking,
    sellOrderMaking,
    orderMade


} from './actions'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'
import { ETHER_ADDRESS } from '../helpers'

export const loadWeb3 = (dispatch) => {
    if (typeof window.ethereum !== 'undefined') {
        const web3 = new Web3(window.ethereum)
        dispatch(web3Loaded(web3))
        return web3
    } else {
        window.alert('please install MetaMask')
        window.location.assign("https://metamask.io")
    }
}

export const loadAccount = async (web3, dispatch) => {
    const accounts = await web3.eth.requestAccounts()
    const account = accounts[0]
    if (typeof account !== 'undefined') {
        dispatch(web3AccountLoaded(account))
        return account
    } else {
        window.alert('Cannot load account please login with MetaMask')
        return null
    }
}

export const loadToken = async (web3, networkId, dispatch) => {
    try {
        const token = new web3.eth.Contract(Token.abi, Token.networks[networkId].address)
        dispatch(tokenLoaded(token))
        return token
    } catch (error) {
        console.log('Contract not deployed to the current network. Please select another network with Metamask.')
        return null
    }
}

export const loadExchange = async (web3, networkId, dispatch) => {
    try {
        const exchange = new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
        dispatch(exchangeLoaded(exchange))
        return exchange
    } catch (error) {
        console.log('Contract not deployed to the current network. Please select another network with Metamask.')
        return null
    }
}

export const loadAllOrders = async (exchange, dispatch) => {
    // Fetch cancelled orders with the "Cancel" event stream

    const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest' })
    // Format
    const cancelledOrders = cancelStream.map((event) => event.returnValues)
    dispatch(cancelledOrdersLoaded(cancelledOrders))

    /// Fetch filled orders with th "Trade" event stream

    const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest' })
    // Format
    const filledOrders = tradeStream.map((event) => event.returnValues)
    dispatch(filledOrdersLoaded(filledOrders))


    // Fetch all orders with the "Order" event stream

    const orderStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest' })
    // Format
    const allOrders = orderStream.map((event) => event.returnValues)
    dispatch(allOrdersLoaded(allOrders))
}

export const subscribeToEvents = async (props) => {

    const { exchange, dispatch } = props

    exchange.events.Cancel({}, (error, event) => {
        dispatch(orderCancelled(event.returnValues))
    })

    exchange.events.Trade({}, (error, event) => {
        loadBalances(props)
        dispatch(orderFilled(event.returnValues))
    })
    exchange.events.Deposit({}, (error, event) => {
        loadBalances(props)
    })
    exchange.events.Withdraw({}, (error, event) => {
        loadBalances(props)
    })

    exchange.events.Order({}, (error, event) => {
        dispatch(orderMade(event.returnValues))
    })
}

export const cancelOrder = (dispatch, exchange, order, account) => {
    exchange.methods.cancelOrder(order.id).send({ from: account }).on('transactionHash', (hash) => {
        dispatch(orderCancelling())
    })
        .on('error', (error) => {
            console.log(error)
            window.alert('There was an error!')
        })
}

export const fillOrder = (dispatch, exchange, order, account) => {
    exchange.methods.fillOrder(order.id).send({ from: account }).on('transactionHash', (hash) => {
        dispatch(orderFilling())
    })
        .on('error', (error) => {
            console.log(error)
            window.alert('There was an error!')
        })
}

// Balances

export const loadBalances = async (props) => {
    const { dispatch, web3, exchange, token, account } = props
    if (typeof account !== 'undefined') {
        // Ether balance in wallet 
        const etherBalance = await web3.eth.getBalance(account)

        dispatch(etherBalanceLoaded(etherBalance))

        // Token balance in wallet
        const tokenBalance = await token.methods.balanceOf(account).call()
        dispatch(tokenBalanceLoaded(tokenBalance))

        // Ether balance in exchange
        const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call()
        dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

        // Token balance on the exchange
        const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
        dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

        dispatch(balancesLoaded())
    } else {
        window.alert('Cannot load balances please login with MetaMask')
    }
}

export const depositEther = (
    dispatch,
    exchange,
    web3,
    amount,
    account) => {
    exchange.methods.depositEther().send({ from: account, value: web3.utils.toWei(amount, 'ether') }).on('transactionHash', (hash) => {
        dispatch(balancesLoading())
    })
        .on('error', (error) => {
            console.log(error)
            window.alert('There was an error!')
        })
}

export const withdrawEther = (
    dispatch,
    exchange,
    web3,
    amount,
    account) => {
    exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account })
        .on('transactionHash', (hash) => {
            dispatch(balancesLoading())
        })
        .on('error', (error) => {
            console.log(error)
            window.alert('There was an error!')
        })
}

export const depositToken = async (
    dispatch,
    exchange,
    token,
    web3,
    amount,
    account
) => {

    amount = web3.utils.toWei(amount, 'ether')

    token.methods.approve(exchange.options.address, amount)
        .send(({ from: account }))
        .on('transactionHash', (hash) => {
            console.log("approved")
            exchange.methods.depositToken(token.options.address, amount)
                .send({ from: account })
                .on('transactionHash', (hash) => {
                    console.log("sent")
                    dispatch(balancesLoading())
                })
                .on('error', (error) => {
                    console.log(error)
                    window.alert('There was an error!')
                })

        })

}

export const withdrawToken = async (
    dispatch,
    exchange,
    token,
    web3,
    amount,
    account
) => {

    amount = web3.utils.toWei(amount, 'ether')

    exchange.methods.withdrawToken(token.options.address, amount)
        .send({ from: account })
        .on('transactionHash', (hash) => {
            console.log("sent")
            dispatch(balancesLoading())
        })
        .on('error', (error) => {
            console.log(error)
            window.alert('There was an error!')
        })

}

export const makeBuyOrder = async (
    dispatch,
    exchange,
    token,
    web3,
    order,
    account
) => {


    const tokenGet = token.options.address
    const amountGet = web3.utils.toWei(order.amount, 'ether')

    const tokenGive = ETHER_ADDRESS
    const amountGive = web3.utils.toWei((order.amount * order.price).toString(), 'ether')

    exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive)
        .send({ from: account })
        .on('transactionHash', (hash) => {
            console.log("Order made")
            dispatch(buyOrderMaking())
        })
        .on('error', (error) => {
            console.log(error)
            window.alert('There was an error!')
        })

}

export const makeSellOrder = async (
    dispatch,
    exchange,
    token,
    web3,
    order,
    account
) => {


    const tokenGet = ETHER_ADDRESS
    const amountGet = web3.utils.toWei((order.amount * order.price).toString(), 'ether')

    const tokenGive = token.options.address
    const amountGive = web3.utils.toWei(order.amount, 'ether')

    exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive)
        .send({ from: account })
        .on('transactionHash', (hash) => {
            console.log("Order made")
            dispatch(sellOrderMaking())
        })
        .on('error', (error) => {
            console.log(error)
            window.alert('There was an error!')
        })

}


