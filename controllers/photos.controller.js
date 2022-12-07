const Photo = require('../models/photo.model');
const Vote = require('../models/Vote.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...


      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt  = fileName.split('.').slice(-1)[0];
      const pattern = new RegExp(/^[a-zA-Z0-9 ]{4,25}$/, 'g');
      const emailPattern = new RegExp(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, 'g');

      const authorRegex = author.match(pattern);
      const emailRegex = email.match(emailPattern);
      console.log(authorRegex)

      if(!authorRegex) {
        throw new Error('Name is not allowed!');
      }
      if(!emailRegex) {
        throw new Error('Email is not allowed!');
      }

      if((fileExt === 'jpg' || fileExt === 'png' || fileExt === 'gif') && title.length <= 25 && author.length  <= 50) {
        console.log(fileExt)
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        res.status(500).json({message: 'Error!'})
      }


    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err.message);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const ip = requestIp.getClientIp(req);
    const voteUser =  await Vote.findOne({user: ip})
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if(!voteUser) {
      const newUser = new Vote({
          user: ip,
          votes: [req.params.id]
        });

      await newUser.save();
    }
    if(voteUser.votes.includes(req.params.id)) {
      res.status(500).json({message: 'You cant vote again!'})
    } else {
      await Vote.findOneAndUpdate(
        { user: ip },
        { $push: { votes: req.params.id }});

        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
    }
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });

  } catch(err) {
    res.status(500).json(err);
  }

};
