// API Base URL
const API_URL = 'http://localhost:3000/api';

// Check which page we're on
const isLoginPage = document.getElementById('loginForm') !== null;
const isSignupPage = document.getElementById('signupForm') !== null;

// LOGIN PAGE
if (isLoginPage) {
    const loginForm = document.getElementById('loginForm');
    const signupBtn = document.getElementById('signupBtn');
    const forgotPassword = document.getElementById('forgotPassword');
    const googleLogin = document.getElementById('googleLogin');
    const facebookLogin = document.getElementById('facebookLogin');

    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Disable submit button to prevent double submission
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                // Store logged in user in sessionStorage
                sessionStorage.setItem('currentUser', JSON.stringify(result.data));
                
                // Show success message
                alert('Login successful!');
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                alert(result.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred. Please check if the server is running.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'LOGIN';
        }
    });

    // Navigate to signup page
    signupBtn.addEventListener('click', function() {
        window.location.href = '/signup';
    });

    // Forgot password handler
    forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Password reset functionality would be implemented here.');
    });

    // Google login handler
    googleLogin.addEventListener('click', function() {
        alert('Google login would be implemented here with OAuth.');
    });

    // Facebook login handler
    facebookLogin.addEventListener('click', function() {
        alert('Facebook login would be implemented here with OAuth.');
    });
}

// SIGNUP PAGE
if (isSignupPage) {
    const signupForm = document.getElementById('signupForm');

    // Handle signup form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validation
        if (!username) {
            alert('Please enter a username.');
            return;
        }

        if (!email) {
            alert('Please enter an email.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }

        // Disable submit button
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        try {
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (result.success) {
                // Store logged in user in sessionStorage
                sessionStorage.setItem('currentUser', JSON.stringify(result.data));
                
                // Show success message
                alert('Account created successfully!');
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                alert(result.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred. Please check if the server is running.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'SIGN UP';
        }
    });
}