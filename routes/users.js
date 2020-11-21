const express = require('express');
const router = express.Router();
const User = require('../models/users')
const catchErrors = require('../lib/async-error');

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/signin');
  }
}


function validateForm(form, options) {
  var name = form.name || "";
  var address = form.address || "";
  var birth = form.name || "";
  var email = form.email || "";
  var phone = form.phone || "";

  name = name.trim();
  address = address.trim();
  birth = birth.trim();
  name = name.trim();
  email = email.trim();
  phone = phone.trim();

  if (!name) {
    return 'Name is required.';
  }

  if (!address) {
    return 'address is required.';
  }

  if (!birth) {
    return 'birth is required.';
  }

  if (!phone) {
    return 'phone is required.';
  }

  if (!email) {
    return 'Email is required.';
  }

  if (!form.password && options.needPassword) {
    return 'Password is required.';
  }

  if (form.password !== form.password_confirmation) {
    return 'Passsword do not match.';
  }

  if (form.password.length < 6 && options.needPassword) {
    return 'Password must be at least 6 characters.';
  }

  var regPhone = /^((01[1|6|7|8|9])[1-9]+[0-9]{6,7})|(010[1-9][0-9]{7})$/;
  if (regPhone.test(phone)){
    return 'input valid phone number'
  }

  return null;
}
function validateEditForm(form, options) {
  var name = form.name || "";
  var address = form.address || "";
  var birth = form.name || "";
  var phone = form.phone || "";

  name = name.trim();
  address = address.trim();
  birth = birth.trim();
  name = name.trim();
  phone = phone.trim();

  if (!name) {
    return 'Name is required.';
  }

  if (!address) {
    return 'address is required.';
  }

  if (!birth) {
    return 'birth is required.';
  }

  if (!phone) {
    return 'phone is required.';
  }

  if (!form.password && options.needPassword) {
    return 'Password is required.';
  }

  if (form.password !== form.password_confirmation) {
    return 'Passsword do not match.';
  }

  if (form.password.length < 6 && options.needPassword) {
    return 'Password must be at least 6 characters.';
  }

  var regPhone = /^((01[1|6|7|8|9])[1-9]+[0-9]{6,7})|(010[1-9][0-9]{7})$/;
  if (regPhone.test(phone)){
    return 'input valid phone number'
  }

  return null;
}
/* GET users listing. */
router.get('/', needAuth, catchErrors(async (req, res, next) => {
  const users = await User.getAllUser();
  res.render('users/index', {users: users});
}));

router.get('/new', (req, res, next) => {
  res.render('users/new', {messages: req.flash()});
});

router.get('/:id/edit',needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/edit', {user: user});
}));


router.post('/', catchErrors(async (req, res, next) => {
  var err = validateForm(req.body, {needPassword: true});
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }
  var email = await User.findOne(req.body.email);
  if (email) {
    req.flash('danger', 'user email already exists.');
    return res.redirect('back');
  }
  user = {
    email: req.body.email,
    name: req.body.name,
    address: req.body.address,
    birth: req.body.birth,
    phone: req.body.phone,
    job: req.body.job,
    password: req.body.password,
  };
  await User.saveUser(user);
  req.flash('success', 'Registered successfully. Please sign in.');
  res.redirect('/');
}));

router.put('/:id', needAuth, catchErrors(async (req, res, next) => {
  const err = validateEditForm(req.body, {needPassword: false});
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    req.flash('danger', 'Not exist user.');
    return res.redirect('back');
  }

  if (req.body.current_password != user.password) {
    req.flash('danger', 'Current password invalid.');
    return res.redirect('back');
  }
  
  user.name = req.body.name;
  user.address = req.body.address;
  user.birth = req.body.birth;
  user.job = req.body.job;
  user.phone = req.body.phone;
  if(req.body.password){
    user.password = req.body.password;
  }
  await User.updateUser(user);
  req.flash('success', 'Updated successfully.');
  res.redirect('/users');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  await User.findOneAndRemove(req.params.id);
  req.flash('success', 'Deleted Successfully.');
  res.redirect('/users');
}));

router.get('/:id',needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/show', {user: user});
}));

module.exports = router;
