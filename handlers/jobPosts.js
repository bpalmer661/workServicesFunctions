

const { db, admin } = require('../util/admin')

const config = require('../util/config');



exports.getAllJobPosts = (req, res) => {
    db.collection('JobPosts').orderBy('createdAt','desc').get()
    .then(data => {
        let jobPosts = [];
        data.forEach(doc => {
            jobPosts.push({
                jobId: doc.id,
                ...doc.data()
            });
        });
    return res.json(jobPosts);
    })
    .catch(err => console.error(err));
    }





    
    const jobPostDefaultImage = "hammer.jpg"  













   
    exports.createJobPost  = (req, res) => {

///////////lesson 31/////////////

const errors = {};
let valid = Boolean;

        if (req.body.jobDescription.trim() === '') {
            errors.jobDescription = 'Job Description must not be empty';
          }

          if (req.body.jobTitle.trim() === '') {
            errors.jobTitle = 'Job Title must not be empty';
            //return res.status(400).json({ jobTitle: 'Job Description must not be empty' });
          }


          valid = Object.keys(errors).length === 0 ? true : false

          if(!valid){ 
              return res.status(400).json(errors)
          }
///////////////lesson 31///////////////////////////////


        const newJob = {
            jobDescription: req.body.jobDescription,
            jobTitle: req.body.jobTitle,
            createdAt: new Date().toISOString(),
            username: req.user.username,
            userImageUrl: "",
            jobPostDefaultImage: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${jobPostDefaultImage}?alt=media`,
        };

        
db.collection('users').doc(newJob.username).get()
.then(doc => {
    if(!doc.exists){
        //404 NOT FOUND
        return res.status(404).json({error: 'user Not Found'})
        console.log("User Not Found ")
    } 
    user = doc.data();
     
    newJob.userImageUrl = user.userImageUrl        
    
 })
 .then(() => {

        db.collection('JobPosts').add(newJob)
        .then(docRef => {
            ///////lesson 31//////////

            const job = newJob
            job.jobId = docRef.id
              
            res.json(job);
            //////////////////////
        //res.json({message: `document ${docRef.id} created succesfully`})
        console.log("Job Post document created successfully ")
        })
        .catch(err => {
            //500 server error
            //return res.status(500).json({error: 'something went wrong'})
           return res.status(500).json({error: err.code});
      
        })
    })
            }

     





           exports.getJobPostAndReplys = (req, res) => {

              let jobData = {};

              db.collection("JobPosts").doc(`${req.params.jobPostId}`).get()
              .then(doc => {



           if(!doc.exists){
               //404 NOT FOUND
               return res.status(404).json({error: 'Job Post Not Found'})
           } 


           jobData = doc.data();
           jobData.jobPostId = doc.id;           
 
           return db.collection("jobReplys").where("jobPostId" , '==' , req.params.jobPostId).orderBy('createdAt','desc').get();
        
          
          
        })
        .then(data => {

            jobData.JobReplys = [];
            data.forEach(doc => {
                
                jobData.JobReplys.push(doc.data())
            });
            return res.json(jobData);
        })
        .catch(err => {
            console.error(err)
            //500 Internal Server Error 
            res.status(500).json({error: err.code});
              })
           }



           

           exports.replyToJobPost  = (req, res) => {
            
            const jobReply = {

                email: req.body.email,
                number: req.body.number,
                replyText: req.body.replyText,
                jobPostId: req.params.jobPostId,
                createdAt: new Date().toISOString(),
                username: req.user.username,
                /////lesson 35//////      
                userImage: req.body.userImage,
                ////////////////////
            };
            
            db.collection('jobReplys').add(jobReply)
        .then(docRef => {
        res.json({message: `document ${docRef.id} created succesfully`})
        })
        .catch(err => {
            //500 server error
            res.status(500).json({error: 'something went wrong'})
            console.error(err)
        })
            }



            

           exports.deleteJobPost = (req,res) => {
               
            const document = db.doc(`/JobPosts/${req.params.jobPostId}`);

            document.get()
            .then(doc => {
                if(!doc.exists){
                return res.status(404).json({error: "Job Post Not Found"})
            }
            if(doc.data().username !== req.user.username){
                //403 Forbidden
                return res.status(403).json({error: "unauthorised"})
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({message: `Job Post Deleted Successfully`})
        })
           }






           exports.deleteJobPostReply = (req,res) => {
               
            const document = db.doc(`/jobReplys/${req.params.jobPostReplyId}`);

            document.get()
            .then(doc => {
                if(!doc.exists){
                return res.status(404).json({error: "Job Post Reply Not Found"})
            }
            if(doc.data().username !== req.user.username){
                //403 Forbidden
                return res.status(403).json({error: "unauthorised"})
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({message: `Job Post Deleted Successfully`})
        })
           }









     exports.getAllJobPostsReplys = (req,res) => {
               

     db.collection("jobReplys").where("jobPostId" , '==' ,req.params.jobPostId).get()
     .then(data => {
               
        let jobPostReplys = [];
          data.forEach(doc => {
            jobPostReplys.push({
              jobReplyId: doc.id,
              ...doc.data()
                 });
                 });
        return res.json(jobPostReplys);
        })
        .catch(err => console.error(err));
                    }

                    