

const { db, admin } = require('../util/admin');


const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);


/////////lesson 26/////////////
//npm i uuidv4    
const { uuid } = require('uuidv4');
/////////lesson 26/////////////

const { validateSignUpData, validateLoginData, reduceUserDetails } = require('../util/validators')



exports.signup = (req, res) => { 
    const user = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    username:req.body.username
};





const { valid, errors } = validateSignUpData(user);
//400 Bad Request 
if(!valid) return res.status(400).json(errors)



const defaultImage ="https://firebasestorage.googleapis.com/v0/b/workservices-e4506.appspot.com/o/100846351935.png?alt=media&token=b5490b00-ba72-4663-934b-6a921627fcd0"


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
if(!valid) { 
  console.log("this is errors in login function:" + errors)
  return res.status(400).json(errors)
}

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



// Upload a profile image for user
exports.uploadImage = (req, res) => {
    const BusBoy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");
  
    const busboy = new BusBoy({ headers: req.headers });
  
    let imageToBeUploaded = {};
    let imageFileName;
     /////////lesson 26////////////
    // String for image token
    let generatedToken = uuid(); 
     /////////lesson 26////////////
  
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(fieldname, file, filename, encoding, mimetype);
      if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
        return res.status(400).json({ error: "Wrong file type submitted" });
      }
      // my.image.png => ['my', 'image', 'png']
      const imageExtension = filename.split(".")[filename.split(".").length - 1];
      // 32756238461724837.png
      imageFileName = `${Math.round(
        Math.random() * 1000000000000
      ).toString()}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filepath, mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on("finish", () => {
      admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype,
              //Generate token to be appended to imageUrl
              /////////lesson 26////////////
              firebaseStorageDownloadTokens: generatedToken,
               /////////lesson 26////////////
            },
          },
        })
        .then(() => {
         
           /////////lesson 26///////// // Append token to url and insure updated value matches your data base value///
          const userImageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
          return db.doc(`/users/${req.user.username}`).update({ userImageUrl });
        })
        
        .then(() => {
          return res.json({ message: "image uploaded successfully" });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: "something went wrong" });
        });
    });
    busboy.end(req.rawBody);
  };





  // Get any user's details
  exports.getUserDetails = (req, res) => {
  
    let user = {};
    

    db.collection("users").doc(`${req.params.username}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
           

          //lesson 36
          // user.credentials = doc.data();
          //change to 
          user.user = doc.data();
         
          return db
            .collection("JobPosts")
            .where("username", "==", req.params.username)
            .orderBy("createdAt", "desc")
            .get();
        } else {
          return res.status(404).json({ errror: "User not found xxx234" });
        }
      })
      .then((data) => {
          
        user.jobPosts = [];
        data.forEach((doc) => {  
          user.jobPosts.push({
            jobDescription: doc.data().jobDescription,
            jobTitle: doc.data().jobTitle,
            createdAt: doc.data().createdAt,
            username: doc.data().username,
            userImageUrl: doc.data().userImageUrl,
            jobPostDefaultImage: doc.data().jobPostDefaultImage,
            ////lesson 37
            //change 
            jobPostId: doc.id,
            //to 
            jobId: doc.id,
            ////////////
      
          });
        });
        return res.json(user);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  };







//////lesson 38///////////////

exports.getAuthenticatedUsersDetails = (req, res) => {
  let user = {};
  db.collection("users").doc(`${req.user.username}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        user.credentials = doc.data();
    return db.collection("notifications")
        .where("recipient", "==", req.user.username)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
} 
})
    .then((data) => {
      user.notifications = [];
      data.forEach((doc) => {
        user.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          jobPostId: doc.data().jobPostId,
          read: doc.data().read,
          notificationId: doc.id,
        });
      });
      return res.json(user);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
//////lesson 38///////////////











  	
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