import React from 'react'
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Alert,
} from 'react-native'
import * as Permissions from 'expo-permissions'
import { BarCodeScanner } from 'expo-barcode-scanner'
import * as firebase from 'firebase'
import db from '../config.js'

export default class TransactionScreen extends React.Component {
  constructor() {
    super()
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedCycleId: 'c1',
      scannedStudentId: 'st1',
      buttonState: 'normal',
      transactionMessage: '',
    }
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA)

    this.setState({
      hasCameraPermissions: status === 'granted',
      buttonState: id,
      scanned: false,
    })
  }

  handleBarCodeScanned = async ({ type, data }) => {
    const { buttonState } = this.state

    if (buttonState === 'CycleId') {
      this.setState({
        scanned: true,
        scannedCycleId: data,
        buttonState: 'normal',
      })
    } else if (buttonState === 'StudentId') {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal',
      })
    }
  }

  initiateCycleIssue = async () => {
    db.collection('transactions').add({
      student_id: this.state.scannedStudentId,
      cycle_id: this.state.scannedCycleId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: 'Issue',
    })

    var cycleissue = db.collection('cycle')
    cycleissue
      .where('cycle_id', '==', this.state.scannedCycleId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          console.log(doc.data())
          console.log(doc.id)
          cycleissue.doc(doc.id).update({
            cycle_availability: false,
          })
        })
      })

    var studentcycles = db.collection('students')
    studentcycles
      .where('studentId', '==', this.state.scannedStudentId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          studentcycles.doc(doc.id).update({
            number_of_cycles_issued: firebase.firestore.FieldValue.increment(1),
          })
        })
      })

    this.setState({
      scannedStudentId: '',
      scannedCycleId: '',
    })
  }

  initiateCycleReturn = async () => {
    //add a transaction
    db.collection('transactions').add({
      student_id: this.state.scannedStudentId,
      cycleId: this.state.scannedCycleId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: 'Return',
    })
    //change cycle status
    var cycleissue = db.collection('cycle')
    cycleissue
      .where('cycle_id', '==', this.state.scannedCycleId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          cycleissue.doc(doc.id).update({
            cycle_availability: true,
          })
        })
      })

    var studentcycles = db.collection('students')
    studentcycles
      .where('studentId', '==', this.state.scannedStudentId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          studentcycles.doc(doc.id).update({
            number_of_cycles_issued: firebase.firestore.FieldValue.increment(-1),
          })
        })
      })
    this.setState({
      scannedStudentId: '',
      scannedCycleId: '',
    })
  }

  checkCycleEligibility = async () => {
    const cycleRef = await db
      .collection('cycle')
      .where('cycle_id', '==', this.state.scannedCycleId)
      .get()
    var transactionType = ''
    if (cycleRef.docs.length === 0) {
      transactionType = false
    } else {
      cycleRef.docs.map((doc) => {
        var cycle = doc.data()
        if (cycle.cycle_availability) {
          transactionType = 'Issue'
        } else {
          transactionType = 'Return'
        }
      })
    }
    console.log('checkCycleEligibility() : ' + transactionType)
    return transactionType
  }

  checkStudentEligibilityForCycleIssue = async () => {
    const studentRef = await db
      .collection('students')
      .where('student_id', '==', this.state.scannedStudentId)
      .get()
    var isStudentEligible = ''
    console.log(studentRef.docs.length)
    if (studentRef.docs.length == 0) {
      this.setState({
        scannedStudentId: '',
        scannedCycleId: '',
      })
      isStudentEligible = false
      alert("The student id doesn't exist in the database!")
    } else {
      studentRef.docs.map((doc) => {
        var student = doc.data()
        if (student.number_of_cycles_issued < 2) {
          isStudentEligible = true
        } else {
          isStudentEligible = false
          alert('The student has already issued 2 cycles!')
          this.setState({
            scannedStudentId: '',
            scannedCycleId: '',
          })
        }
      })
    }

    return isStudentEligible
  }

  checkStudentEligibilityForReturn = async () => {
    const transactionRef = await db
      .collection('transactions')
      .where('cycle_id', '==', this.state.scannedCycleId)
      // .limit(1)
      .get()

    console.log(transactionRef.docs)
    var isStudentEligible = ''
    transactionRef.docs.map((doc) => {
      var lastCycleTransaction = doc.data()
      if (lastCycleTransaction.student_id === this.state.scannedStudentId) {
        isStudentEligible = true
      } else {
        isStudentEligible = false
        alert("The cycle wasn't issued by this student!")
        this.setState({
          scannedStudentId: '',
          scannedCycleId: '',
        })
      }
    })
    return isStudentEligible
  }

  handleTransaction = async () => {
    var transaction_type = await this.checkCycleEligibility()
    if (!transaction_type) {
      console.log("The cycle doesn't exist in the database!")
      this.setState({
        scannedStudentId: '',
        scannedCycleId: '',
      })
    } else if (transaction_type === 'Issue') {
      var isStudentEligible = await this.checkStudentEligibilityForCycleIssue()
      console.log('Issuing cycle')
      if (isStudentEligible) {
        this.initiateCycleIssue()
        alert('Cycle issued to the student!')
      }
    } else {
      var isStudentEligible = await this.checkStudentEligibilityForReturn()
      console.log('Returning cycle')
      if (isStudentEligible) {
        this.initiateCycleReturn()
        alert('Thank you for returning it to the School!')
      }
    }
  }

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions
    const scanned = this.state.scanned
    const buttonState = this.state.buttonState

    if (buttonState !== 'normal' && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      )
    } else if (buttonState === 'normal') {
      return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          <View>
            <Image
              source={require('../assets/cycle.jpg')}
              style={{ width: 200, height: 200 }}
            />
            <Text style={{ textAlign: 'center', fontSize: 30 }}>
              LET'S RIDE
            </Text>
          </View>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Cycle Id"
              onChangeText={(text) => {
                this.setState({
                  scannedCycleId: text,
                })
              }}
              value={this.state.scannedCycleId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions('CycleId')
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText={(text) => {
                this.setState({
                  scannedStudentId: text,
                })
              }}
              value={this.state.scannedStudentId}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions('StudentId')
              }}
            >
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.transactionAlert}>
            {this.state.transactionMessage}
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={async () => {
              var transactionMessage = this.handleTransaction()
            }}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'peachpuff',
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  scanButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10,
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    color: '#fff',
  },
  inputView: {
    flexDirection: 'row',
    margin: 20,
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    fontSize: 20,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 10,
    textAlign: 'center',
  },
  scanButton: {
    marginLeft: 20,
    backgroundColor: '#15169c',
    width: 50,
    borderWidth: 1.5,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  submitButton: {
    backgroundColor: '#15aa21',
    width: 100,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  submitButtonText: {
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  transactionAlert: {
    margin: 10,
    color: 'red',
  },
})
