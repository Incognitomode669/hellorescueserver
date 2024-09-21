const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./serversideHLO.json'); // Update path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hello-rescue-default-rtdb.firebaseio.com/" // Update your database URL
});

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

// GET route for root URL
app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.post('/sendNotification', (req, res) => {
    const userId = req.body.userId;
    const username = req.body.username;
    const password = req.body.password;

    // Retrieve the user's FCM token from the database
    admin.database().ref(`users/${userId}`).once('value').then(snapshot => {
        const userData = snapshot.val();
        if (userData && userData.fcmToken) {
            const fcmToken = userData.fcmToken;

            // Create the notification message
            const message = {
                notification: {
                    title: 'Your Registration Details',
                    body: `Username: ${username}, Password: ${password}`
                },
                token: fcmToken
            };

            // Send the notification
            admin.messaging().send(message)
                .then((response) => {
                    console.log('Notification sent successfully:', response);
                    res.status(200).send('Notification sent');
                })
                .catch((error) => {
                    console.error('Error sending notification:', error);
                    res.status(500).send('Error sending notification');
                });
        } else {
            res.status(404).send('User not found or no FCM token');
        }
    }).catch(error => {
        console.error('Database error:', error);
        res.status(500).send('Database error');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
