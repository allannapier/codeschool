// Get Supabase configuration from injected values
const SUPABASE_URL = window.SUPABASE_CONFIG?.url || '';
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey || '';


// Initialize Supabase client
let supabase = null;
try {
    if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (error) {
    console.error('Error creating Supabase client:', error);
}

// Authentication state
let currentUser = null;
let isLoginMode = true;

// DOM elements for auth
let authModal, authForm, authTitle, authSubmit, toggleAuth, closeModal;
let authToggleBtn, userEmailSpan, progressBtn, authError;
let progressModal, closeProgressModal;

// Initialize authentication system
async function initAuth() {
    // Wait for Supabase ready event or timeout
    await new Promise((resolve) => {
        if (window.supabase) {
            resolve();
        } else {
            const timeout = setTimeout(() => {
                resolve();
            }, 3000);
            
            window.addEventListener('supabaseReady', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
        }
    });
    
    // Try to create Supabase client again if it wasn't created earlier
    if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            // Try different ways Supabase might be exposed
            let supabaseLib = null;
            
            // Check various possible global names
            if (window.supabase) {
                supabaseLib = window.supabase;
            } else if (window.Supabase) {
                supabaseLib = window.Supabase;
            } else if (window.createClient) {
                supabaseLib = { createClient: window.createClient };
            }
            
            if (supabaseLib && supabaseLib.createClient) {
                supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            }
        } catch (error) {
            console.error('Error creating Supabase client in initAuth:', error);
        }
    }
    
    // Check if Supabase is available and configured
    if (!supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured. Authentication features disabled.');
        console.log('Debug - supabase:', !!supabase, 'URL:', !!SUPABASE_URL, 'KEY:', !!SUPABASE_ANON_KEY);
        return;
    }
    
    // Debug Supabase client
    console.log('Supabase client created:', supabase);
    console.log('Supabase auth methods:', Object.keys(supabase.auth || {}));

    // Get DOM elements
    authModal = document.getElementById('auth-modal');
    authForm = document.getElementById('auth-form');
    authTitle = document.getElementById('auth-title');
    authSubmit = document.getElementById('auth-submit');
    toggleAuth = document.getElementById('toggle-auth');
    closeModal = document.getElementById('close-modal');
    authToggleBtn = document.getElementById('auth-toggle-btn');
    userEmailSpan = document.getElementById('user-email');
    authError = document.getElementById('auth-error');
    progressModal = document.getElementById('progress-modal');
    closeProgressModal = document.getElementById('close-progress-modal');

    // Ensure auth toggle button is visible when auth is working
    if (authToggleBtn) {
        authToggleBtn.style.display = 'inline-flex';
    }

    // Add event listeners
    authToggleBtn.addEventListener('click', handleAuthToggle);
    closeModal.addEventListener('click', hideAuthModal);
    authForm.addEventListener('submit', handleAuth);
    toggleAuth.addEventListener('click', toggleAuthMode);
    closeProgressModal.addEventListener('click', hideProgressModal);

    // Close modal on outside click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideAuthModal();
        }
    });
    
    progressModal.addEventListener('click', (e) => {
        if (e.target === progressModal) {
            hideProgressModal();
        }
    });

    // Check if user is already logged in
    try {
        if (!supabase.auth || typeof supabase.auth.getSession !== 'function') {
            console.error('Supabase auth.getSession is not available. Auth object:', supabase.auth);
            return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            updateAuthUI();
        }
    } catch (error) {
        console.error('Error getting session:', error);
        return;
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
        // User is logged in - show email and logout button
        authToggleBtn.textContent = 'Logout';
        userEmailSpan.textContent = currentUser.email;
        userEmailSpan.style.display = 'inline';
    } else {
        // User is not logged in - show login button only
        authToggleBtn.textContent = 'Login';
        userEmailSpan.style.display = 'none';
    }
}

function handleAuthToggle() {
    if (currentUser) {
        // User is logged in, so logout
        handleLogout();
    } else {
        // User is not logged in, so show login modal
        showAuthModal();
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
                password: password,
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                    data: {
                        signup_source: 'codebotiks_web'
                    }
                }
            });
        }
        
        if (result.error) {
            throw result.error;
        }
        
        if (!isLoginMode && result.data.user && !result.data.session) {
            // Account created but needs email confirmation
            showAuthError('Account created! Please check your email for a confirmation link before logging in.');
            // Auto-switch to login mode
            isLoginMode = true;
            updateAuthModalUI();
        }
        
    } catch (error) {
        console.error('Auth error:', error);
        
        // Handle specific error types
        if (error.message.includes('Email not confirmed')) {
            showAuthError('Please check your email and click the confirmation link before logging in.');
        } else if (error.message.includes('Invalid login credentials')) {
            showAuthError('Invalid email or password. If you just signed up, please confirm your email first.');
        } else if (error.message.includes('signup disabled')) {
            showAuthError('New signups are currently disabled. Please contact support.');
        } else if (error.message.includes('confirmation email') || error.message.includes('email')) {
            showAuthError('Email confirmation issue. Please contact support if this persists.');
        } else {
            showAuthError(error.message);
        }
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
    // Show success notification to user
    if (window.showSuccess) {
        window.showSuccess(message);
    }
}

async function showProgressModal() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    progressModal.style.display = 'flex';
    await loadUserProgress();
}

function hideProgressModal() {
    progressModal.style.display = 'none';
}

async function loadUserProgress() {
    try {
        const userProgress = await getUserProgress();
        const completedCount = userProgress.length;
        
        // Update stats
        document.getElementById('completed-count').textContent = completedCount;
        
        // Display completed challenges
        const completedContainer = document.getElementById('completed-challenges');
        if (completedCount === 0) {
            completedContainer.innerHTML = '<p class="placeholder">No challenges completed yet. Start coding to track your progress!</p>';
        } else {
            const challengesData = window.getChallengesData ? window.getChallengesData() : [];
            
            completedContainer.innerHTML = userProgress.map(progress => {
                // Find the challenge details from challengesData
                const challenge = challengesData.find(c => c.title === progress.challenge_title);
                const level = challenge ? challenge.level : 'unknown';
                
                return `
                    <div class="completed-challenge">
                        <span class="challenge-title">✅ ${progress.challenge_title}</span>
                        <span class="challenge-level ${level}">${level}</span>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading user progress:', error);
        document.getElementById('completed-challenges').innerHTML = '<p class="error">Failed to load progress data.</p>';
    }
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
    isLoggedIn: () => !!currentUser,
    showProgressModal
};