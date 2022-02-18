import React, { Component } from 'react';
import { connect } from 'react-redux'
import Spinner from './Spinner'
import { Tabs, Tab } from 'react-bootstrap'
import {
  loadBalances,
  depositEther,
  withdrawEther,
  depositToken,
  withdrawToken
} from '../store/interactions'
import {
  web3Selector,
  exchangeSelector,
  tokenSelector,
  accountSelector,
  balancesLoadingSelector,
  etherBalanceSelector,
  tokenBalanceSelector,
  exchangeEtherBalanceSelector,
  exchangeTokenBalanceSelector,
  etherDepositAmountSelector,
  etherWithdrawAmountSelector,
  tokenDepositAmountSelector,
  tokenWithdrawAmountSelector
} from '../store/selectors'
import {
  etherDepositAmountChanged,
  etherWithdrawAmountChanged,
  tokenDepositAmountChanged,
  tokenWithdrawAmountChanged
} from '../store/actions';

const showEtherDepositForm = (props) => {
  const {
    dispatch,
    exchange,
    web3,
    account,
    etherDepositAmount } = props

  return (
    <form className="row" onSubmit={(event) => {
      event.preventDefault()
      depositEther(
        dispatch,
        exchange,
        web3,
        etherDepositAmount,
        account)
    }}>
      <div className="col-12 col-sm pr-sm-2">
        <input
          type='text'
          placeholder='ETH amount'
          onChange={(e) => dispatch(etherDepositAmountChanged(e.target.value))}
          className='form-control form-control-sm bg-dark text-white'
          required />
      </div>
      <div className='col-12 col-sm-auto pl-sm-0'>
        <button type='submit' className='btn btn-primary btn-block btn-sm'>Deposit ETH</button>
      </div>
    </form>

  )
}

const showEtherWithdrawForm = (props) => {
  const {
    dispatch,
    exchange,
    web3,
    account,
    etherWithdrawAmount } = props

  return (
    <form className="row" onSubmit={(event) => {
      event.preventDefault()
      withdrawEther(
        dispatch,
        exchange,
        web3,
        etherWithdrawAmount,
        account)
    }}>
      <div className="col-12 col-sm pr-sm-2">
        <input
          type='text'
          placeholder='ETH amount'
          onChange={(e) => dispatch(etherWithdrawAmountChanged(e.target.value))}
          className='form-control form-control-sm bg-dark text-white'
          required />
      </div>
      <div className='col-12 col-sm-auto pl-sm-0'>
        <button type='submit' className='btn btn-primary btn-block btn-sm'>Withdraw ETH</button>
      </div>
    </form>
  )
}

const showTokenDepositForm = (props) => {
  const {
    dispatch,
    exchange,
    token,
    web3,
    account,
    tokenDepositAmount } = props

  return (
    <form className="row" onSubmit={(event) => {
      event.preventDefault()
      depositToken(
        dispatch,
        exchange,
        token,
        web3,
        tokenDepositAmount,
        account)
    }}>
      <div className="col-12 col-sm pr-sm-2">
        <input
          type='text'
          placeholder='DAPP amount'
          onChange={(e) => dispatch(tokenDepositAmountChanged(e.target.value))}
          className='form-control form-control-sm bg-dark text-white'
          required />
      </div>
      <div className='col-12 col-sm-auto pl-sm-0'>
        <button type='submit' className='btn btn-primary btn-block btn-sm'>Deposit DAPP</button>
      </div>
    </form>

  )
}

const showTokenWithdrawForm = (props) => {
  const {
    dispatch,
    exchange,
    token,
    web3,
    account,
    tokenWithdrawAmount } = props

  return (
    <form className="row" onSubmit={(event) => {
      event.preventDefault()
      withdrawToken(
        dispatch,
        exchange,
        token,
        web3,
        tokenWithdrawAmount,
        account)
    }}>
      <div className="col-12 col-sm pr-sm-2">
        <input
          type='text'
          placeholder='DAPP amount'
          onChange={(e) => dispatch(tokenWithdrawAmountChanged(e.target.value))}
          className='form-control form-control-sm bg-dark text-white'
          required />
      </div>
      <div className='col-12 col-sm-auto pl-sm-0'>
        <button type='submit' className='btn btn-primary btn-block btn-sm'>Withdraw DAPP</button>
      </div>
    </form>
  )
}


const showBalances = (props) => {
  const {
    etherBalance,
    tokenBalance,
    exchangeEtherBalance,
    exchangeTokenBalance
  } = props
  return (
    <div>
      <table className="table table-dark table-sm small">
        <thead>
          <tr>
            <th>Token</th>
            <th>Wallet</th>
            <th>Exchange</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ETH</td>
            <td>{etherBalance}</td>
            <td>{exchangeEtherBalance}</td>
          </tr>
          <tr>
            <td>DAPP</td>
            <td>{tokenBalance}</td>
            <td>{exchangeTokenBalance}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const showForm = (props) => {


  return (
    <Tabs defaultActiveKey="deposit" className="bg-dark text-white">
      <Tab eventKey="deposit" title="Deposit" className="bg-dark">
        {showBalances(props)}
        {showEtherDepositForm(props)}
        {showTokenDepositForm(props)}
      </Tab>
      <Tab eventKey="withdraw" title="Withdraw">
        {showBalances(props)}
        {showEtherWithdrawForm(props)}
        {showTokenWithdrawForm(props)}
      </Tab>
    </Tabs >

  )
}


class Balance extends Component {

  componentWillMount() {
    this.loadBlockchainData()
  }

  async loadBlockchainData() {
    await loadBalances(this.props)
  }

  render() {
    return (
      <div className="card bg-dark text-white">
        <div className="card-header">
          Balance
        </div>
        <div className="card-body">
          {this.props.showForm ? showForm(this.props) : <Spinner />}
        </div>
      </div>

    )
  }
}

function mapStateToProps(state) {
  const balancesLoading = balancesLoadingSelector(state)
  return {
    web3: web3Selector(state),
    exchange: exchangeSelector(state),
    token: tokenSelector(state),
    account: accountSelector(state),
    etherBalance: etherBalanceSelector(state),
    tokenBalance: tokenBalanceSelector(state),
    exchangeEtherBalance: exchangeEtherBalanceSelector(state),
    exchangeTokenBalance: exchangeTokenBalanceSelector(state),
    balancesLoading,
    showForm: !balancesLoading,
    etherDepositAmount: etherDepositAmountSelector(state),
    etherWithdrawAmount: etherWithdrawAmountSelector(state),
    tokenDepositAmount: tokenDepositAmountSelector(state),
    tokenWithdrawAmount: tokenWithdrawAmountSelector(state)


  }
}

export default connect(mapStateToProps)(Balance)

