const { admin, db } = require('./admin');

exports.fbAuth = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization 
  ) {
    idToken = req.headers.authorization
  } else {
    console.error('No token found');
    return res.status(403).json({ error: 'Unauthorized' });
  }

admin.auth().verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      return db.collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.username = data.docs[0].data().username;
      req.user.userImageUrl = data.docs[0].data().userImageUrl;
      return next();
    })
    .catch((err) => {
      console.error('Error while verifying token ', err);
      return res.status(403).json(err);
    });
};