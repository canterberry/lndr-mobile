import React, { Component } from 'react'

import { Text, TextInput, TouchableHighlight, View, Image, ScrollView } from 'react-native'
import { getResetAction } from 'reducers/nav'
import { getUcacCurrency } from 'reducers/app'

import { UserData } from 'lndr/user'
import { debounce } from 'lndr/time'
import { currencyFormats } from 'lndr/format'
import PendingTransaction from 'lndr/pending-transaction'
import profilePic from 'lndr/profile-pic'
import { currencySymbols, transferLimits  } from 'lndr/currencies'

import Button from 'ui/components/button'
import Loading, { LoadingContext } from 'ui/components/loading'
import DashboardShell from 'ui/components/dashboard-shell'
import PendingTransactionRow from 'ui/components/pending-transaction-row'

import style from 'theme/pending'
import formStyle from 'theme/form'
import general from 'theme/general'
import accountStyle from 'theme/account'

import language from 'language'
const {
  back,
  cancel,
  pendingTransactionsLanguage,
  debtManagement
} = language

import { getUser, submitterIsMe } from 'reducers/app'
import { confirmPendingTransaction, rejectPendingTransaction } from 'actions'
import { connect } from 'react-redux'

const loadingContext = new LoadingContext()

interface Props {
  confirmPendingTransaction: (pendingTransaction: PendingTransaction) => any
  rejectPendingTransaction: (pendingTransaction: PendingTransaction) => any
  getUcacCurrency: (ucac: string) => string
  user: UserData
  submitterIsMe: (pendingTransaction: PendingTransaction) => boolean
  navigation: any
}

interface State {
  userPic: string
  pic?: string
  unmounting?: boolean
}

class PendingTransactionDetail extends Component<Props, State> {
  constructor(props) {
    super(props)
    this.state = { userPic: '' }
  }

  async componentWillMount() {
    const { user, navigation } = this.props
    const pendingTransaction = navigation.state ? navigation.state.params.pendingTransaction : {}
    let pic

    try {
      const addr = user.address === pendingTransaction.creditorAddress ? pendingTransaction.debtorAddress : pendingTransaction.creditorAddress
      pic = await profilePic.get(addr)
    } catch (e) {}
    if(!this.state.unmounting && pic) {
      this.setState({ pic })
    }
  }

  componentWillUnmount() {
    this.setState({unmounting: true})
  }

  async confirmPendingTransaction(pendingTransaction: PendingTransaction) {
    const success = await loadingContext.wrap(
      this.props.confirmPendingTransaction(pendingTransaction)
    )

    if (success) {
      this.closePopup('confirm')
    } else {
      this.props.navigation.goBack()
    }
  }

  async rejectPendingTransaction(pendingTransaction: PendingTransaction) {
    const success = await loadingContext.wrap(
      this.props.rejectPendingTransaction(pendingTransaction)
    )

    if (success) {
      this.closePopup('reject')
    } else {
      this.props.navigation.goBack()
    }
  }

  closePopup(type) {
    const nickname = this.getFriendNickname()

    const resetAction = getResetAction({ routeName:'Confirmation', params: { type: type, friend: { nickname } } })

    this.props.navigation.dispatch(resetAction)
  }

  getFriendNickname() {
    const { user, navigation} = this.props
    const pendingTransaction = navigation.state ? navigation.state.params.pendingTransaction : {}

    if (user.address === pendingTransaction.creditorAddress) {
      return pendingTransaction.debtorNickname
    } else {
      return pendingTransaction.creditorNickname
    }
  }

  getTitle() {
    const { user, navigation } = this.props
    const pendingTransaction = navigation.state ? navigation.state.params.pendingTransaction : {}

    if (user.address === pendingTransaction.creditorAddress) {
      return debtManagement.direction.pendingLend(pendingTransaction.debtorNickname)
    } else if (user.address === pendingTransaction.debtorAddress) {
      return debtManagement.direction.pendingBorrow(pendingTransaction.creditorNickname)
    } else {
      return 'Unknown Transaction'
    }
  }

  getColor() {
    const { user, navigation } = this.props
    const pendingTransaction = navigation.state ? navigation.state.params.pendingTransaction : {}
    return user.address === pendingTransaction.creditorAddress ? accountStyle.greenAmount : accountStyle.redAmount
  }

  labelRow(memo) {
    return <View style={general.centeredColumn}>
      <Text style={style.memo}>{pendingTransactionsLanguage.for}</Text>
      <Text style={style.info}>{memo}</Text>
    </View>
  }

  showButtons() {
    const { submitterIsMe, navigation } = this.props
    const pendingTransaction = navigation.state ? navigation.state.params.pendingTransaction : {}
    if (submitterIsMe(pendingTransaction)) {
      return <Button danger round onPress={() => this.rejectPendingTransaction(pendingTransaction)} text={pendingTransactionsLanguage.cancel} />
    }

    return <View style={{marginBottom: 10}}>
      <Button round large onPress={() => this.confirmPendingTransaction(pendingTransaction)} text={pendingTransactionsLanguage.confirm} />
      <Button danger round onPress={() => this.rejectPendingTransaction(pendingTransaction)} text={pendingTransactionsLanguage.reject} />
    </View>
  }

  render() {
    const { user, submitterIsMe, navigation, getUcacCurrency } = this.props
    const { userPic } = this.state
    const pendingTransaction = navigation.state ? navigation.state.params.pendingTransaction : {}
    const imageSource = userPic ? {uri: userPic} : require('images/person-outline-dark.png')
    const currency = getUcacCurrency(pendingTransaction.ucac)
    const color = this.getColor()

    return <View style={general.whiteFlex}>
      <View style={general.view}>
        <Loading context={loadingContext} />
        <DashboardShell text={pendingTransactionsLanguage.shell} navigation={this.props.navigation} />
        <Button close onPress={() => this.props.navigation.goBack()} />
      </View>
      <ScrollView style={general.whiteFlex} keyboardShouldPersistTaps="always">
        <View style={general.centeredColumn}>
          <Image source={imageSource} style={style.image}/>
          <Text style={[style.title, color]}>{this.getTitle()}</Text>
          <View style={style.balanceRow}>
            <Text style={[style.balanceInfo, color]}>{currencySymbols(currency)}</Text>
            <Text style={[style.amount, color]}>{currencyFormats(currency)(pendingTransaction.amount)}</Text>
          </View>
          {this.labelRow(pendingTransaction.memo.trim())}
          <View style={{marginVertical: 20, width: '100%'}}>
          {pendingTransaction.multiTransactions === undefined ? null :
            pendingTransaction.multiTransactions.map(tx => <PendingTransactionRow user={user} key={tx.hash} pendingTransaction={tx} friend={true} onPress={() => null} />)
          }
          </View>
          {this.showButtons()}
          <View style={general.spaceBelow}/>
        </View>
      </ScrollView>
    </View>
  }
}

export default connect((state) => ({ user: getUser(state)(),
  submitterIsMe: submitterIsMe(state),
  getUcacCurrency: getUcacCurrency(state)
}), { confirmPendingTransaction, rejectPendingTransaction })(PendingTransactionDetail)
