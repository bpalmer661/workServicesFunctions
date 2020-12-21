
//npm i busboy
//npm i react
//npm i react-redux


const { uuid } = require("uuidv4");


const functions = require('firebase-functions');


const app = require('express')();

//lesson 35///// add getAuthenticatedUsersDetails///////
const { signup, login, uploadImage,addUserDetails, getOurJobPosts,getUserDetails, markNotificationsAsRead,getAuthenticatedUsersDetails } = require('./handlers/users')


const { getAllJobPosts,createJobPost,getJobPostAndReplys, replyToJobPost,deleteJobPost,deleteJobPostReply,getAllJobPostsReplys} = require('./handlers/jobPosts')


const { fbAuth } = require('./util/fbAuth');


const cors = require('cors');
app.use(cors());



const { db } = require('./util/admin')


//Job Routes
app.get('/JobPosts',getAllJobPosts );
app.post('/createJobPost',fbAuth,createJobPost);
app.get('/JobPost/:jobPostId',getJobPostAndReplys)
app.post('/JobPost/:jobPostId',fbAuth,replyToJobPost )
app.delete('/JobPost/:jobPostId',fbAuth,deleteJobPost)
app.delete('/deleteJobPostReply/:jobPostReplyId',fbAuth,deleteJobPostReply)
app.get('/JobPostReplys/:jobPostId',fbAuth,getAllJobPostsReplys)




//user routes 
app.post('/signup', signup);
app.post('/login',login);
app.post('/user/image',fbAuth, uploadImage)
app.post('/user',fbAuth,addUserDetails)
app.get('/getOurJobPosts',fbAuth,getOurJobPosts)
app.get('/user',fbAuth,getAuthenticatedUsersDetails)
app.get('/user/:username',getUserDetails)
app.post('/notifications',fbAuth,markNotificationsAsRead)






  exports.api = functions.region('australia-southeast1').https.onRequest(app);





  exports.createNotificationOnJobPostReply = functions
  .region('australia-southeast1')
  .firestore.document('jobReplys/{id}')
  .onCreate((snapshot) => {

    return db.collection("JobPosts").doc(`${snapshot.data().jobPostId}`)
      .get()
      .then((doc) => {
        console.log("sender and reciever =" + doc.data().username + "" + snapshot.data().username)
        if (
          doc.exists &&
          doc.data().username !== snapshot.data().username
        ) {
         
          return db.collection("notifications").doc(`${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().username,
            sender: snapshot.data().username,
            read: false,
            jobPostId: doc.id
          });
        } else {
          console.log("document does not exists or sender and receiver are the same")
        }
      })
      .catch((err) => console.error(err));
  });




  exports.deleteJobReplyNotificationOnJobReplyDelete = functions
  .region('australia-southeast1')
  .firestore.document('jobReplys/{id}')
  .onDelete((snapshot) => {

    return db.collection("notifications").doc(`${snapshot.id}`).delete().
    then(() => {
return;
    })
    .catch((err) => {
      console.error(err);
      return;
    });
  });







exports.onUserImageChange = functions
  .region('australia-southeast1')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().userImageUrl !== change.after.data().userImageUrl) {
      console.log('image has changed');
      const batch = db.batch();
      return db
        .collection('JobPosts')
        .where('username', '==', change.before.data().username)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const JobPosts = db.doc(`/JobPosts/${doc.id}`);
            batch.update(JobPosts, { userImageUrl: change.after.data().userImageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });





exports.onJobPostDelete = functions
.region('australia-southeast1')
  .firestore.document('/JobPosts/{JobPostId}')
  .onDelete((snapshot, context) => {
    const JobPostId = context.params.JobPostId;
    const batch = db.batch();

    return db
      .collection('jobReplys')
      .where('jobPostId', '==', JobPostId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.collection("jobReplys").doc(`${doc.id}`));
        });


        return db
          .collection('notifications')
          .where('jobPostId', '==', JobPostId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.collection("notifications").doc(`${doc.id}`));
        });
        return batch.commit();
      })

      

      .catch((err) => console.error(err));
  });


