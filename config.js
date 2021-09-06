import firebase from 'firebase'
require('@firebase/firestore')

const firebaseConfig = {
  //Add configuration here
  apiKey: 'AIzaSyBZ_VzKaRv5Gcx4t7N5JpolPilsFRHlpq0',
  authDomain: 'let-s-ride-139df.firebaseapp.com',
  projectId: 'let-s-ride-139df',
  storageBucket: 'let-s-ride-139df.appspot.com',
  messagingSenderId: '1068176798429',
  appId: '1:1068176798429:web:8259e992b618d05e0da134',
}
firebase.initializeApp(firebaseConfig)

export default firebase.firestore()
