/**
 * Auth Routes
 * -----------
 * Similar to Django's urlpatterns for auth views.
 *
 * POST /api/auth/register - Sign up
 * POST /api/auth/login    - Sign in
 */

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;
