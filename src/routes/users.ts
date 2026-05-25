import { Router } from 'express';
import bcrypt from 'bcrypt';
import * as Users from '../models/users';
import { catchErrors } from '../lib/async-error';
import { needAuth } from '../middlewares/auth';

const BCRYPT_ROUNDS = 12;
const router = Router();

interface SignupForm {
  name?: string;
  address?: string;
  birth?: string;
  email?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  job?: string;
}

function validateSignup(form: SignupForm): string | null {
  const name = (form.name ?? '').trim();
  const address = (form.address ?? '').trim();
  const birth = (form.birth ?? '').trim();
  const email = (form.email ?? '').trim();
  const phone = (form.phone ?? '').trim();

  if (!name) return 'Name is required.';
  if (!address) return 'Address is required.';
  if (!birth) return 'Birth is required.';
  if (!phone) return 'Phone is required.';
  if (!email) return 'Email is required.';
  if (!form.password) return 'Password is required.';
  if (form.password !== form.password_confirmation) return 'Passwords do not match.';
  if (form.password.length < 6) return 'Password must be at least 6 characters.';

  return null;
}

function validateProfileUpdate(form: SignupForm): string | null {
  const name = (form.name ?? '').trim();
  const address = (form.address ?? '').trim();
  const birth = (form.birth ?? '').trim();
  const phone = (form.phone ?? '').trim();

  if (!name) return 'Name is required.';
  if (!address) return 'Address is required.';
  if (!birth) return 'Birth is required.';
  if (!phone) return 'Phone is required.';
  if (form.password && form.password !== form.password_confirmation) {
    return 'Passwords do not match.';
  }
  if (form.password && form.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

router.get(
  '/',
  needAuth,
  catchErrors(async (_req, res) => {
    const users = await Users.getAllUsers();
    res.render('users/index', { users });
  }),
);

router.get('/new', (req, res) => {
  res.render('users/new', { messages: req.flash() });
});

router.get(
  '/:id/edit',
  needAuth,
  catchErrors(async (req, res) => {
    const user = await Users.findById(req.params.id);
    res.render('users/edit', { user });
  }),
);

router.post(
  '/',
  catchErrors(async (req, res) => {
    const err = validateSignup(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const existing = await Users.findByEmail(req.body.email);
    if (existing) {
      req.flash('danger', 'User email already exists.');
      return res.redirect('back');
    }
    const passwordHash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
    await Users.saveUser({
      email: req.body.email,
      name: req.body.name,
      address: req.body.address,
      birth: req.body.birth,
      phone: req.body.phone,
      job: req.body.job ?? null,
      password: passwordHash,
    });
    req.flash('success', 'Registered successfully. Please sign in.');
    res.redirect('/');
  }),
);

router.put(
  '/:id',
  needAuth,
  catchErrors(async (req, res) => {
    const err = validateProfileUpdate(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const user = await Users.findById(req.params.id);
    if (!user) {
      req.flash('danger', 'User does not exist.');
      return res.redirect('back');
    }
    const currentOk = await bcrypt.compare(req.body.current_password ?? '', user.password);
    if (!currentOk) {
      req.flash('danger', 'Current password invalid.');
      return res.redirect('back');
    }

    user.name = req.body.name;
    user.address = req.body.address;
    user.birth = req.body.birth;
    user.job = req.body.job ?? null;
    user.phone = req.body.phone;
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
    }
    await Users.updateUser(user);
    req.flash('success', 'Updated successfully.');
    res.redirect('/users');
  }),
);

router.delete(
  '/:id',
  needAuth,
  catchErrors(async (req, res) => {
    await Users.deleteUser(req.params.id);
    req.flash('success', 'Deleted successfully.');
    res.redirect('/users');
  }),
);

router.get(
  '/:id',
  needAuth,
  catchErrors(async (req, res) => {
    const user = await Users.findById(req.params.id);
    res.render('users/show', { user });
  }),
);

export default router;
