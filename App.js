import React from 'react'
import { StyleSheet, Text, View, Image } from 'react-native'
import { createAppContainer } from 'react-navigation'
import { createBottomTabNavigator } from 'react-navigation-tabs'
import SearchScreen from './screens/SearchScreen'
import TransactionScreen from './screens/CycleTransactionScreen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons'

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <AppContainer />
      </View>
    )
  }
}

const TabNavigator = createBottomTabNavigator(
  {
    Transaction: { screen: TransactionScreen },
    Search: { screen: SearchScreen },
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: () => {
        const routeName = navigation.state.routeName
        if (routeName === 'Search') {
          return (
            <Image
              source={require('./assets/book.png')}
              style={{ width: 40, height: 40 }}
            />
          )
        } else if (routeName === 'Transaction') {
          return (
            <View>
              <Image
                source={require('./assets/book.png')}
                style={{ width: 40, height: 40 }}
              />
            </View>
          )
        }
      },
    }),
  },
)

const AppContainer = createAppContainer(TabNavigator)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
})
