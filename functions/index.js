
const admin = require('firebase-admin');


admin.initializeApp();

const functions = require('firebase-functions');


const app = require('express')();


const db = admin.firestore();







const firebase = require('firebase')


const firebaseConfig = {
  apiKey: "AIzaSyBEkSLuI3itUsX3iIhvDnnHHT7WoCT76qI",
  authDomain: "workservices-e4506.firebaseapp.com",
  databaseURL: "https://workservices-e4506.firebaseio.com",
  projectId: "workservices-e4506",
  storageBucket: "workservices-e4506.appspot.com",
  messagingSenderId: "232325006209",
  appId: "1:232325006209:web:da0aca044337ef4b119e80",
  measurementId: "G-K8BRW9Y8HL"
};

  firebase.initializeApp(firebaseConfig);









app.get('/JobPosts', (req, res) => {
    admin.firestore().collection('JobPosts').orderBy('createdAt','desc').get()
    .then(data => {
        let jobPosts = [];
        data.forEach(doc => {


            // jobPosts.push(doc.data())

            jobPosts.push({
                jobId: doc.id,
                ...doc.data()
            });

        });
    return res.json(jobPosts);
    })
    .catch(err => console.error(err));
    });




app.post('/createJobPost', (req, res) => {
const newJob = {
    jobDescription: req.body.jobDescription,
    jobTitle: req.body.jobTitle,
    createdAt: new Date().toISOString()
};
admin.firestore().collection('JobPosts').add(newJob)
.then(docRef => {
res.json({message: `document ${docRef.id} created succesfully`})
})
.catch(err => {
    //500 server error
    res.status(500).json({error: 'something went wrong'})
    console.error(err)
})
    });



/////////lesson #7 ////////////////

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

}



    const isEmpty  = (string) => {
        if(string.trim() === '') return true
        else return false;
    }
    /////////lesson #7 ////////////////




//sign up route
app.post('/signup', (req, res) => { 
    const user = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    username:req.body.username
};


/////////lesson #7 ////////////////
let errors = {};

if(isEmpty(user.email)){
    errors.email = "Email Must Not Be Empty",
} else if(){

}

/////////lesson #7 ////////////////


//validate data
let token, userId; 
admin.firestore().doc(`/users/${user.username}`).get()
.then((doc) => {
if(doc.exists){
    ///bad request
    return res.status(400).json({
        username: 'this username is already taken'});
} else {
    return firebase.auth().createUserWithEmailAndPassword(user.email,user.password)
}
})
.then((data) =>{
userId = data.user.uid;
   return  data.user.getIdToken();
})
.then(token =>{
token = tokenId;
const userInfo = {
    username: user.username,
    email: user.email,
    createdAt: new Date().toISOString(),
    userId:  userId,
};
admin.firestore().doc(`/users/${user.username}`).set(userInfo)
}).then(() =>{
    //201 data created successfully
    return res.status(201).json({ token });
})
.catch((err) => { 
    console.error(err);
    if(err.code === "auth/email-already-in-use"){
        ///400 
        return res.status(400).json({ email: 'Email is already in use'})
    } else {
        return res.status(500).json({error: err.code });
    }
    });
});











  exports.api = functions.region('australia-southeast1').https.onRequest(app);


