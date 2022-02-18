import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Tabs, Tab } from 'react-bootstrap'
import Spinner from './Spinner'

import { makeBuyOrder, makeSellOrder } from '../store/interactions'

import {
  web3Selector,
  exchangeSelector,
  tokenSelector,
  accountSelector,
  buyOrderSelector,
  sellOrderSelector
} from '../store/selectors'

import {
  buyOrderAmountChanged,
  buyOrderPriceChanged,
  sellOrderAmountChanged,
  sellOrderPriceChanged,
} from '../store/actions'


// import Spinner from './Spinner'


const showBuyForm = (props) => {

  const { dispatch, exchange, token, web3, buyOrder, account, showBuyTotal } = props
  return (
    <div>
      <form className="card-body" onSubmit={(event) => {
        event.preventDefault()
        makeBuyOrder(dispatch,
          exchange,
          token,
          web3,
          buyOrder,
          account)
      }}>
        <div className="form-group small">
          <label>Buy Amount (DAPP)</label>
          <div className='input-group'>
            <input
              type='text'
              placeholder='Buy amount'
              onChange={(e) => dispatch(buyOrderAmountChanged(e.target.value))}
              className='form-control form-control-sm bg-dark text-white'
              required />
          </div>
        </div>
        <div className="form-group small">
          <label>Buy Price </label>
          <div className='input-group'>
            <input
              type='text'
              placeholder='Buy price'
              onChange={(e) => dispatch(buyOrderPriceChanged(e.target.value))}
              className='form-control form-control-sm bg-dark text-white'
              required />
          </div>
        </div>

        <button type='submit' className='btn btn-primary btn-block btn-sm'>Make Buy order</button>

        {showBuyTotal ? <small>Total: {buyOrder.amount * buyOrder.price} ETH</small> : null}


        {/* 12:55 Create orders*/}
      </form>
    </div>
  )
}

const showSellForm = (props) => {

  const { dispatch, exchange, token, web3, sellOrder, account, showSellTotal } = props
  return (
    <div>
      <form className="card-body" onSubmit={(event) => {
        event.preventDefault()
        makeSellOrder(dispatch,
          exchange,
          token,
          web3,
          sellOrder,
          account)
      }}>
        <div className="form-group small">
          <label>Sell Amount (DAPP)</label>
          <div className='input-group'>
            <input
              type='text'
              placeholder='Sell amount'
              onChange={(e) => dispatch(sellOrderAmountChanged(e.target.value))}
              className='form-control form-control-sm bg-dark text-white'
              required />
          </div>
        </div>
        <div className="form-group small">
          <label>Sell Price </label>
          <div className='input-group'>
            <input
              type='text'
              placeholder='Sell price'
              onChange={(e) => dispatch(sellOrderPriceChanged(e.target.value))}
              className='form-control form-control-sm bg-dark text-white'
              required />
          </div>
        </div>

        <button type='submit' className='btn btn-primary btn-block btn-sm'>Make Sell order</button>

        {showSellTotal ? <small>Total: {sellOrder.amount * sellOrder.price} ETH</small> : null}


        {/* 12:55 Create orders*/}
      </form>
    </div>
  )
}




const showOrderForm = (props) => {

  return (
    <Tabs defaultActiveKey="buy" className="bg-dark text-white">
      <Tab eventKey="buy" title="Buy" className="bg-dark">

        {showBuyForm(props)}

      </Tab>
      <Tab eventKey="sell" title="Sell">
        {showSellForm(props)}
      </Tab>
    </Tabs >

  )
}



class Content extends Component {


  render() {
    return (
      <div className="card bg-dark text-white">
        <div className="card-header">
          New order
        </div>
        <div className="card-body">
          {this.props.showForm ? showOrderForm(this.props) : <Spinner type='div' />}
        </div>
      </div>

    )
  }
}

function mapStateToProps(state) {

  const buyOrder = buyOrderSelector(state)
  const sellOrder = sellOrderSelector(state)

  return {
    web3: web3Selector(state),
    exchange: exchangeSelector(state),
    token: tokenSelector(state),
    account: accountSelector(state),
    buyOrder,
    sellOrder,
    showForm: !buyOrder.making && !sellOrder.making,
    showBuyTotal: buyOrder.amount && buyOrder.price,
    showSellTotal: sellOrder.amount && sellOrder.price
  }
}

export default connect(mapStateToProps)(Content)