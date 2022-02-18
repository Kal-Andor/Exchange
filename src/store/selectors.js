import { get, reject, groupBy, maxBy, minBy } from 'lodash'
import { createSelector } from 'reselect'
import { ETHER_ADDRESS, tokens, ether, formatBalance, RED, GREEN } from "../helpers"
import moment from 'moment'

const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const web3 = state => get(state, 'web3.connection')
export const web3Selector = createSelector(web3, w => w)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

const token = state => get(state, 'token.contract')
export const tokenSelector = createSelector(token, t => t)


const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)

const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, e => e)


export const contractsLoadedSelector = createSelector(
  tokenLoaded,
  exchangeLoaded,
  (tl, el) => (tl && el)
)               // lehetne egyszerusiteni igy: = tokenLoaded(state) && exchangeLoaded(state)    igy nem lenne szukseg a fentebb pirosozott ket sorra


// All orders
const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
const allOrders = state => get(state, 'exchange.allOrders.data', [])

// export const allOrdersLoadedSelector = createSelector(allOrdersLoaded, o => o)
// export const allOrdersSelector = createSelector(allOrders, o => o)

// Cancelled orders
const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)

// Filled orders
const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(
  filledOrders,
  orders => {
    // Sort orders by date ascending for price comparison in decorateFilledOrders
    orders = orders.sort((a, b) => a.timestamp - b.timestamp)

    // Decorate the orders
    orders = decorateFilledOrders(orders)

    // Sort orders by date descending for display
    orders = orders.sort((a, b) => b.timestamp - a.timestamp)
    return orders
  }
)

const decorateFilledOrders = (orders) => {
  let previousOrder = orders[0]
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateFilledOrder(order, previousOrder)
      previousOrder = order
      return order
    })
  )
}

const decorateOrder = (order) => {
  let etherAmount
  let tokenAmount
  if (order.tokenGive === ETHER_ADDRESS) {
    etherAmount = order.amountGive
    tokenAmount = order.amountGet
  } else {
    etherAmount = order.amountGet
    tokenAmount = order.amountGive
  }

  // Calculate token price to 5 decimal places
  const precision = 100000
  let tokenPrice = (etherAmount / tokenAmount)
  tokenPrice = Math.round(tokenPrice * precision) / precision

  return ({
    ...order,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')

  })
}

const decorateFilledOrder = (order, previousOrder) => {
  return ({
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
  })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  if (previousOrder.id === orderId) {
    return GREEN
  }

  if (previousOrder.tokenPrice <= tokenPrice) {
    return GREEN
  } else {
    return RED
  }
}


const openOrders = state => {
  const all = allOrders(state)
  const filled = filledOrders(state)
  const cancelled = cancelledOrders(state)

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some((o) => o.id === order.id)
    const orderCancelled = cancelled.some((o) => o.id === order.id)
    return (orderFilled || orderCancelled)
  })
  return openOrders
}

const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)

export const orderBookLoadedSelector = createSelector(orderBookLoaded, (loaded) => loaded)

// Create the order book


export const orderBookSelector = createSelector(
  openOrders,
  (orders) => {

    // Decorate orders
    orders = decorateOrderBookOrders(orders)

    // Group orders by orderType
    orders = groupBy(orders, 'orderType')

    // Sort buy orders by token price

    const buyOrders = get(orders, 'buy', [])
    orders = {
      ...orders,
      buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }

    // Sort sell orders by token price

    const sellOrders = get(orders, 'sell', [])
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }

    // orders.buy.sort((a, b) => b.tokenPrice - a.tokenPrice)

    return orders
  }
)


const decorateOrderBookOrders = (orders) => {
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      // decorate order book order
      order = decorateOrderBookOrder(order)


      return order
    })
  )
}

const decorateOrderBookOrder = (order) => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderFillAction: (orderType === 'buy' ? 'sell' : 'buy')
  })
}


/////// Selectors for my orders:



export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded) // hanszalhato helyette az ordersLoadedSelector

export const myFilledOrdersSelector = createSelector(
  filledOrders,
  account,

  (orders, account) => {
    // Find our orders
    orders = orders.filter((o) => o.user === account || o.userFill === account)
    // Sort by date ascending
    orders = orders.sort((a, b) => a.timestamp - b.timestamp)
    // Decorate orders - add display attributes
    orders = decorateMyFilledOrders(orders, account)
    return orders
  })

const decorateMyFilledOrders = (orders, account) => {
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateMyFilledOrder(order, account)
      return order
    })
  )
}

const decorateMyFilledOrder = (order, account) => {

  const myOrder = order.user === account
  let orderType

  if (myOrder) {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  } else {
    orderType = order.tokenGive === ETHER_ADDRESS ? 'sell' : 'buy'
  }

  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderSign: (orderType === 'buy' ? '+' : '-')
  })
}

export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded) // hanszalhato helyette az ordersLoadedSelector

export const myOpenOrdersSelector = createSelector(
  account,
  openOrders,
  (account, orders) => {
    // Find our orders
    orders = orders.filter((o) => o.user === account)

    // Sort by date ascending
    orders = orders.sort((a, b) => b.timestamp - a.timestamp)

    // Decorate orders - add display attributes
    orders = decorateMyOpenOrders(orders)

    return orders
  }
)

const decorateMyOpenOrders = (orders) => {
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateMyOpenOrder(order)
      return order
    })
  )
}

const decorateMyOpenOrder = (order) => {

  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'

  return ({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED)
  })
}

export const priceChartLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)


export const priceChartSelector = createSelector(filledOrders, (orders) => {
  //     Sort order by date
  orders = orders.sort((a, b) => a.timestamp - b.timestamp)
  //     Decorete oders - add display attributes
  orders = orders.map((o) => decorateOrder(o))
  // Get last 2 order for final price and price change
  let secondLastOrder, lastOrder
  [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)

  const lastPrice = get(lastOrder, 'tokenPrice', 0)
  const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

  return ({
    lastPrice,
    lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
    series: [
      {
        data: buildGraphData(orders)

      }
    ]
  })

})

const buildGraphData = (orders) => {

  // Group the orders by hour
  orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())
  // Get each hour where data exists
  const hours = Object.keys(orders)
  // Build the graph series
  const graphData = hours.map((hour) => {
    // Fetch all the orders from current hour
    const group = orders[hour]
    // Calculate the prce values - open, high, low, close
    const open = group[0].tokenPrice
    const high = maxBy(group, 'tokenPrice').tokenPrice
    const low = minBy(group, 'tokenPrice').tokenPrice
    const close = group[group.length - 1].tokenPrice
    return ({
      x: new Date(hour),
      y: [open, high, low, close]
    })
  })

  return graphData
}

const orderCancelling = (state) => get(state, 'exchange.orderCancelling', false)
export const orderCancellingSelector = createSelector(orderCancelling, status => status)


const orderFilling = (state) => get(state, 'exchange.orderFilling', false)
export const orderFillingSelector = createSelector(orderFilling, status => status)

// Balances

const balancesLoading = (state) => get(state, 'exchange.balancesLoading', true)
export const balancesLoadingSelector = createSelector(balancesLoading, status => status)

const etherBalance = (state) => get(state, 'web3.balance', 0)
export const etherBalanceSelector = createSelector(etherBalance, (balance) => {
  return formatBalance(balance)
})

const tokenBalance = (state) => get(state, 'token.balance', 0)
export const tokenBalanceSelector = createSelector(tokenBalance, (balance) => {
  return formatBalance(balance)
})

const exchangeEtherBalance = (state) => get(state, 'exchange.etherBalance', 0)
export const exchangeEtherBalanceSelector = createSelector(exchangeEtherBalance, (balance) => {
  return formatBalance(balance)
})

const exchangeTokenBalance = (state) => get(state, 'exchange.tokenBalance', 0)
export const exchangeTokenBalanceSelector = createSelector(exchangeTokenBalance, (balance) => {
  return formatBalance(balance)
})

const etherDepositAmount = (state) => get(state, 'exchange.etherDepositAmount', null)
export const etherDepositAmountSelector = createSelector(etherDepositAmount, a => a)

const etherWithdrawAmount = (state) => get(state, 'exchange.etherWithdrawAmount', null)
export const etherWithdrawAmountSelector = createSelector(etherWithdrawAmount, a => a)

const tokenDepositAmount = (state) => get(state, 'exchange.tokenDepositAmount', null)
export const tokenDepositAmountSelector = createSelector(tokenDepositAmount, a => a)

const tokenWithdrawAmount = (state) => get(state, 'exchange.tokenWithdrawAmount', null)
export const tokenWithdrawAmountSelector = createSelector(tokenWithdrawAmount, a => a)

const buyOrder = state => get(state, 'exchange.buyOrder', {})
export const buyOrderSelector = createSelector(buyOrder, o => o)

const sellOrder = state => get(state, 'exchange.sellOrder', {})
export const sellOrderSelector = createSelector(sellOrder, o => o)
