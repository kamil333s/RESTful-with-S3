'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let app = express();
var AWS = require('aws-sdk');
let mongoose = require('mongoose');
let File = require('./models/file_model');
let User = require('./models/user_model');

let DB_PORT = process.env.MONGOLAB_URI || 'mongodb://localhost/db';
mongoose.connect(DB_PORT);

var s3 = new AWS.S3();

AWS.config.update({region: 'us-west-2'});
app.use(bodyParser.json());


// POST /users/:user/files     ### create new file with {"fileName": "fileOne", "content": "hello world!"} in body
app.post('/users/:user/files', (req, res) => {
  console.log('POST!!!');
  var urlArray = req.url.split('/');
  var bucketName = urlArray[urlArray.length - 2];  
  var params = {Bucket: bucketName, Key: req.body.fileName, Body:req.body.content};
  console.log('params: ', params);
  s3.putObject(params, function(err, data) {
    if (err) {
      res.json({'Error': err});
    } else { 
      var newFile = new File({URL: 'https://s3.amazonzws.com/' + bucketName + '/' + params.Key});
        newFile.save((err, user) => {
          res.json(user);
        });
      // res.json('Successfully uploaded data to ' + bucketName);   
    }// if
  });// putObject
});// app.post


// GET /users         ### List all buckets
app.get('/users', (req, res) => {
  s3.listBuckets(function(err, data) {
    if (err) {console.log('Error:', err);}
    else {
      var bucketArray = [];
      for (var index in data.Buckets) {
        bucketArray.push(data.Buckets[index].Name);
        console.log('BUCKET: ', bucketArray[0]);
        // console.log('Bucket: ', bucket.Name, ' : ', bucket.CreationDate);
      }// for

      // Using D
      User.find({}, (err, users) => {
        res.json({data: users});
      });
      // res.json({Buckets: bucketArray});
    }// if
  });// listBuckets
});// app.get


// POST /users            ### Create a new bucket
app.post('/users', (req, res) => {
  s3.createBucket({Bucket: req.body.Bucket}, function() {
    var params = {Bucket: req.body.Bucket, Key: 'myTestFile', Body: 'Hello!'};
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
        res.json({ 'message': 'There was an error. Try a different name.', 'Error' : err});   
      } else { 

      var newUser = new User({URL: 'https://s3.amazonzws.com/' + bucketName + '/' + params.Key});
        newFile.save((err, user) => {
          res.json(user);
        });
        console.log('Successfully uploaded data to myBucket/myTestKey');
        res.json({'bucket' : req.body.Bucket});   
      }// if
    });// putObject
  });// createBucket
});// app.post


// GET /users/:user       Display a list details about a bucket
app.get('/users/:user', (req, res) => {
  // Get name of bucket
  var urlArray = req.url.split('/');
  var bucketName = urlArray[urlArray.length - 1];  
  var params = {Bucket: bucketName /* required */ };
  var objArray = [];
  // ***********Don't know method to get bucket metadata***********
  s3.listBuckets(function(err, data) {
    if (err) {console.log('Error:', err);}
    else {
      for (var index in data.Buckets) {
        if (data.Buckets[index].Name == bucketName) {
          res.json({Buckets: data.Buckets[index]});
        }// if
      }// for
    }// if
  });// listBuckets
});// app.get


// DELETE /users/:user/files/:file     Delete a particular file in a particular bucket
app.delete('/users/:user/files/:file', (req, res) => {
  console.log('DELETE!');
  var urlArray = req.url.split('/');
  var bucketName = urlArray[urlArray.length - 3]; 
  var objectName = urlArray[urlArray.length - 1];  
  var params = {Bucket: bucketName, Key: objectName /* required */ };
  console.log('Params: ', params);
  s3.deleteObject(params, function(err, data) {
    if (err) {
      res.json({'Error':(err, err.stack)}); // an error occurred
    } else {
      res.json({'message': 'File deleted'});           // successful response
    }// if 
  });// deleteObject
});// app.delete


// DELETE /users/:user        ###delete a bucket and all the files in it
app.delete('/users/:user', (req, res) => {
  // Get name of bucket to delete
  var urlArray = req.url.split('/');
  var bucketName = urlArray[urlArray.length - 1];  
  var params = {Bucket: bucketName /* required */ };

  // list all items in bucket
  s3.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      res.json({'Error': err});
    } else {
      console.log(data);           // successful response
      params.Delete = {Objects:[]};

      // Add the items to be deleted to params
      data.Contents.forEach((content) => {
        params.Delete.Objects.push({Key: content.Key});
        console.log(params.Delete.Objects);
      });// forEach

      // Delete all objects in the bucket
      s3.deleteObjects(params, function(err, data) {
        if (err) {
          console.log(err, err.stack); // an error occurred
          res.json({'Error': err});
        } else {
          console.log(data);              // successful response
        }// if

        // Delete the bucket
        s3.deleteBucket({'Bucket': params.Bucket}, function(err, data) {
          if (err) {
            console.log(err, err.stack); // an error occurred
            res.json({'Error': err});
          } else {
            console.log(data);              // successful response
            res.json({'message': 'Bucket deleted'});
          }// if
        });// deleteBucket 
      });// deleteObjects
    }// if
  });// listObjects
});// app.delete


// GET /users/:user/files           ###Display the contents of a particular bucket
app.get('/users/:user/files', (req, res) => {
  // Get name of bucket to delete
  var urlArray = req.url.split('/');
  var bucketName = urlArray[urlArray.length - 2];  
  var params = {Bucket: bucketName /* required */ };

  // list all items in bucket
  s3.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      res.json({'Error': err});
    } else {
      console.log(data);           // successful response
      params.Items = {Objects:[]};
      // Add the items to be deleted to params
      data.Contents.forEach((content) => {
        params.Items.Objects.push({Key: content.Key});
      });// forEach
      res.json({'objects': params.Items.Objects});
    }// if
  });// listObjects
});// app.get


// GET /users/:user/files/:file           ###Returns a JSON object with the URL location of the file on S3
app.get('/users/:user/files/:file', (req, res) => {
  // Get name of bucket to delete
  var urlArray = req.url.split('/');
  var bucketName = urlArray[urlArray.length - 3];  
  var fileName = urlArray[urlArray.length - 1];  
  var params = {Bucket: bucketName, Key: fileName};


  User.find({Bucket: bucketName}, (err, users) => {
    res.json({'URL': 'https://s3.amazonzws.com/' + data.Bucket + '/' + data.Key});
  });


  // res.json({bucketName + '/' + fileName});
});// app.get


app.put('/files/:file', (req, res) => {

});


app.listen(3000, () =>{
  console.log('Server started on 3000');
});

