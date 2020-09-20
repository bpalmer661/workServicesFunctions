

const { db, admin } = require('../util/admin');


const config = require('../util/config');

const firebase = require('firebase')
firebase.initializeApp(config)



const { validateSignUpData, validateLoginData, reduceUserDetails } = require('../util/validators')



exports.signup = (req, res) => { 
    const user = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    username:req.body.username
};




const { valid, errors } = validateSignUpData(user)
//400 Bad Request 
if(!valid) return res.status(400).json(errors)



const defaultImage = "default-avatar.jpg"  


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
.then(tokenId =>{
token = tokenId;
const userInfo = {
    username: user.username,
    email: user.email,
    createdAt: new Date().toISOString(),
    userImageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImage}?alt=media`,
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
        return res.status(500).json({general: "Something went wrong please try again" + `${err.code}`});
    }
    });
}




exports.login = (req, res) => {
    
    const user = {
        email: req.body.email,
        password: req.body.password
    }

const { valid, errors } = validateLoginData(user)
//400 Bad Request 
if(!valid) return res.status(400).json(errors)


 firebase.auth().signInWithEmailAndPassword(user.email,user.password)
 .then((data) => {
     return data.user.getIdToken();
 })
 .then(token => {
     return res.json({token});
 })
.catch( err => {
console.error(err);

if(err.code === 'auth/wrong-password'){
    return res.status(403).json({general: 'Wrong Password, Please Try Again'})
}

if(err.code === 'auth/user-not-found'){
    return res.status(403).json({general: 'Incorrect Email, User Not Found'})
}



return res.status(500).json({error: err.code});

});

}




//Add User Details
exports.addUserDetails = (req,res) => {

    let userDetails = reduceUserDetails(req.body);

db.doc(`/users/${req.user.username}`).update(userDetails).then(() => {
    return res.json({message: 'details added successfully'});
})
.catch(err => {
    console.error(err);
    return res.status(500).json({error: err.code});
});


}

exports.getOurJobPosts = (req,res) => {

    db.doc(`/users/${req.user.username}`).get()
    .then( doc =>{
        if (doc.exists){
            return db.collection('JobPosts').where('username', "==", req.user.username).get()
        }
    })
    .then(data => {
        usersJobs = [];

        data.forEach(doc => {
            usersJobs.push(doc.data());
        })
        return res.json(usersJobs);
    })
.catch(err => {
    console.error(err);
    return res.status(500).json({error: err.code});

})

}







//upload a profile image for user
exports.uploadImage = (req, res) => {

const BusBoy = require('busboy')
const path = require('path')
const os = require('os')
const fs = require('fs')


const busboy = new BusBoy({headers: req.headers })

let imageFileName;
let imageToBeUploaded = {};


busboy.on('file', (fieldname,file,filename, encoding, mimetype) => {

console.log('File [' + fieldname + ']: filename: '
 + filename + ', encoding: ' + encoding + 
 ', mimetype:' + mimetype);


const imageExtension = filename.split('.')[filename.split('.').length - 1];
console.log('this is imageExtension' + imageExtension)

 imageFileName = `${Math.round(Math.random()*1000000)}.${imageExtension}`;
console.log('this is imageFileName' + imageFileName)

const filepath = path.join(os.tmpdir(),imageFileName);

imageToBeUploaded = { filepath, mimetype}

file.pipe(fs.createWriteStream(filepath));
});


busboy.on('finish', () => {
admin.storage().bucket().upload(imageToBeUploaded.filepath, {
    resumable: false,
    metadata: {
        metadata: {
            contentType: imageToBeUploaded.mimetype
        }
    }
})
.then(() => {
   const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`

    return db.doc(`/users/${req.user.username}`).update({ imageUrl: imageUrl })

})
.then(()=> {
return res.json({message: "image uploaded successfully"})
})
.catch( err => {
    console.log(err);
    return res.status(500).json({ error: err.code })
})
});
busboy.end(req.rawBody);
}

    








// Get any user's details
exports.getUserDetails = (req, res) => {
    let userData = {};
    db.collection("users").doc(`${req.params.username}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          userData.user = doc.data();
          return db
            .collection("JobPosts")
            .where("username", "==", req.params.username)
            .orderBy("createdAt", "desc")
            .get();
        } else {
          return res.status(404).json({ errror: "User not found" });
        }
      })
      .then((data) => {
        userData.jobPosts = [];
        data.forEach((doc) => {
          userData.jobPosts.push({
            jobDescription: doc.data().jobDescription,
            jobTitle: doc.data().jobTitle,
            createdAt: doc.data().createdAt,
            username: doc.data().username,
            userImageUrl: doc.data().userImageUrl,
            jobPostDefaultImage: doc.data().jobPostDefaultImage,
            jobPostId: doc.id,
          });
        });
        return res.json(userData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  };




  	
	exports.markNotificationsAsRead = (req, res) => {

        //batch write , it's when you update multiple documents 
        let batch = db.batch();

        req.body.forEach(notificationId => {

            const notification = db.collection("notifications").doc(`${notificationId}`);
            batch.update(notification, {read: true});
        });

        batch.commit()
        .then(() => {
            return res.json({message: "notifications marked read"});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code})
        })


    }