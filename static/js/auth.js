// Get Supabase configuration from injected values
const SUPABASE_URL = window.SUPABASE_CONFIG?.url || '';
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey || '';

console.log('Auth.js loaded - checking Supabase availability:');
console.log('window.supabase:', typeof window.supabase);
console.log('SUPABASE_CONFIG available:', !!window.SUPABASE_CONFIG);

// Initialize Supabase client
let supabase = null;
try {
    if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        console.log('Attempting to create Supabase client...');
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client created:', !!supabase);
    } else {
        console.log('Supabase requirements not met:');
        console.log('- window.supabase available:', !!window.supabase);
        console.log('- URL present:', !!SUPABASE_URL);
        console.log('- Key present:', !!SUPABASE_ANON_KEY);
    }
} catch (error) {
    console.error('Error creating Supabase client:', error);
}

// Authentication state
let currentUser = null;
let isLoginMode = true;

// DOM elements for auth
let authModal, authForm, authTitle, authSubmit, toggleAuth, closeModal;
let loginBtn, userMenu, userEmailSpan, logoutBtn, authError;

// Initialize authentication system
async function initAuth() {
    // Add a small delay to ensure scripts have loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('InitAuth called - checking Supabase...');
    console.log('window.supabase at init:', typeof window.supabase);
    console.log('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('supabase')));
    
    // Try to create Supabase client again if it wasn't created earlier
    if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            console.log('Available Supabase objects:', Object.keys(window).filter(key => key.toLowerCase().includes('supabase')));
            
            // Try different ways Supabase might be exposed
            let supabaseLib = null;
            
            // Check various possible global names
            if (window.supabase) {
                supabaseLib = window.supabase;
            } else if (window.Supabase) {
                supabaseLib = window.Supabase;
            } else if (window.createClient) {
                // Some CDNs expose createClient directly
                supabaseLib = { createClient: window.createClient };
            }
            
            console.log('Found supabaseLib:', !!supabaseLib);
            console.log('Has createClient:', !!(supabaseLib && supabaseLib.createClient));
            
            if (supabaseLib && supabaseLib.createClient) {
                console.log('Creating Supabase client in initAuth...');
                supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase client created in initAuth:', !!supabase);
            } else {
                console.log('Supabase createClient not found.');
                if (supabaseLib) {
                    console.log('Available methods on supabaseLib:', Object.keys(supabaseLib));
                }
            }
        } catch (error) {
            console.error('Error creating Supabase client in initAuth:', error);
        }
    }
    
    // Check if Supabase is available and configured
    if (!supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured. Authentication features disabled.');
        console.log('Supabase URL:', SUPABASE_URL ? 'Present' : 'Missing');
        console.log('Supabase Key:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');
        console.log('Supabase client:', !!supabase);
        // Hide auth UI elements
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.style.display = 'none';
        return;
    }
    
    console.log('Supabase initialized successfully!');

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

    // Ensure login button is visible when auth is working
    if (loginBtn) {
        console.log('Login button found, making it visible');
        loginBtn.style.display = 'inline-flex';
        console.log('Login button display style:', loginBtn.style.display);
    } else {
        console.error('Login button not found in DOM');
    }

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