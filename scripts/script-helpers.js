export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

export const ether = (n) => {
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
}

// Same as ether
export const tokens = (n) => ether(n)

const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}