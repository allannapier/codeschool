// Supabase configuration - you'll need to replace these with your actual values
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Authentication state
let currentUser = null;
let isLoginMode = true;

// DOM elements for auth
let authModal, authForm, authTitle, authSubmit, toggleAuth, closeModal;
let loginBtn, userMenu, userEmailSpan, logoutBtn, authError;

// Initialize authentication system
async function initAuth() {
    // Check if Supabase is available and configured
    if (!window.supabase || !SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.warn('Supabase not configured. Authentication features disabled.');
        // Hide auth UI elements
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.style.display = 'none';
        return;
    }

    // Get DOM elements
    authModal = document.getElementById('auth-modal');
    authForm = document.getElementById('auth-form');
    authTitle = document.getElementById('auth-title');
    authSubmit = document.getElementById('auth-submit');
    toggleAuth = document.getElementById('toggle-auth');
    closeModal = document.getElementById('close-modal');
    loginBtn = document.getElementById('login-btn');
    userMenu = document.getElementById('user-menu');
    userEmailSpan = document.getElementById('user-email');
    logoutBtn = document.getElementById('logout-btn');
    authError = document.getElementById('auth-error');

    // Add event listeners
    loginBtn.addEventListener('click', showAuthModal);
    closeModal.addEventListener('click', hideAuthModal);
    authForm.addEventListener('submit', handleAuth);
    toggleAuth.addEventListener('click', toggleAuthMode);
    logoutBtn.addEventListener('click', handleLogout);

    // Close modal on outside click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideAuthModal();
        }
    });

    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateAuthUI();
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateAuthUI();
            hideAuthModal();
            showSuccess('Successfully logged in!');
            
            // Refresh challenges dropdown to show progress
            if (window.populateChallengesDropdown) {
                await window.populateChallengesDropdown();
            }
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateAuthUI();
            showSuccess('Successfully logged out!');
            
            // Refresh challenges dropdown to hide progress
            if (window.populateChallengesDropdown) {
                await window.populateChallengesDropdown();
            }
        }
    });
}

function showAuthModal() {
    authModal.style.display = 'flex';
    document.getElementById('email').focus();
}

function hideAuthModal() {
    authModal.style.display = 'none';
    authForm.reset();
    hideAuthError();
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthModalUI();
}

function updateAuthModalUI() {
    if (isLoginMode) {
        authTitle.textContent = 'Login to Track Progress';
        authSubmit.textContent = 'Login';
        toggleAuth.textContent = 'Need an account? Sign up';
    } else {
        authTitle.textContent = 'Create Account';
        authSubmit.textContent = 'Sign Up';
        toggleAuth.textContent = 'Already have an account? Login';
    }
}

function updateAuthUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userEmailSpan.textContent = currentUser.email;
    } else {
        loginBtn.style.display = 'inline-flex';
        userMenu.style.display = 'none';
    }
}

async function handleAuth(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    hideAuthError();
    authSubmit.disabled = true;
    authSubmit.textContent = isLoginMode ? 'Logging in...' : 'Creating account...';
    
    try {
        let result;
        
        if (isLoginMode) {
            result = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
        } else {
            result = await supabase.auth.signUp({
                email: email,
                password: password
            });
        }
        
        if (result.error) {
            throw result.error;
        }
        
        if (!isLoginMode && result.data.user && !result.data.session) {
            showAuthError('Please check your email for verification link!');
        }
        
    } catch (error) {
        console.error('Auth error:', error);
        showAuthError(error.message);
    } finally {
        authSubmit.disabled = false;
        updateAuthModalUI();
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to logout. Please try again.');
    }
}

function showAuthError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
}

function hideAuthError() {
    authError.style.display = 'none';
}

function showSuccess(message) {
    // You can implement a success notification here
    console.log('Success:', message);
}

// Progress tracking functions
async function saveProgress(challengeId, challengeTitle, status = 'completed') {
    if (!currentUser || !supabase) {
        return false;
    }
    
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: currentUser.id,
                challenge_id: challengeId,
                challenge_title: challengeTitle,
                status: status,
                completed_at: new Date().toISOString()
            });
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving progress:', error);
        return false;
    }
}

async function getUserProgress() {
    if (!currentUser || !supabase) {
        return [];
    }
    
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', currentUser.id);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching progress:', error);
        return [];
    }
}

// Export functions for use in other files
window.authSystem = {
    initAuth,
    saveProgress,
    getUserProgress,
    getCurrentUser: () => currentUser,
    isLoggedIn: () => !!currentUser
};