// tx - Object: The transaction object as follows:
// from - String: The sender of the transaction
// to - String: The receiver of the transaction
// amount - number: The amount of the transaction.
// amountPerEth - number: Amount per eth conversion, e.g. 10^18 if amount in Wei, or 1.0 if amount in Eth
// gasPrice - number: The gas price set by this transaction
// gas - number: The gas provided by the transaction.

export default class ERC20Transaction {
  from: string
  to: string
  amount: number
  gasPrice: number
  gas: number

  constructor(from: string, to: string, amount: number, amountPerEth: number, gasPrice: number, gas: number) {
    if (typeof from === 'string' && from.substr(0, 2) === '0x') {
      from = from.substr(2)
    }
    if (typeof to === 'string' && to.substr(0, 2) === '0x') {
      to = to.substr(2)
    }
    this.from = from
    this.to = to
    this.amount = amount * amountPerEth
    this.gasPrice = gasPrice
    this.gas = gas
  }
}