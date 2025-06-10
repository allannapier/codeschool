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
    // Silent fallback
}

// Authentication state
let currentUser = null;
let isLoginMode = true;
let userInitiatedLogin = false;

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
            // Silent fallback
        }
    }
    
    // Check if Supabase is available and configured
    if (!supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return;
    }

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

    // Add event listeners (only if elements exist)
    if (authToggleBtn) authToggleBtn.addEventListener('click', handleAuthToggle);
    if (closeModal) closeModal.addEventListener('click', hideAuthModal);
    if (authForm) authForm.addEventListener('submit', handleAuth);
    if (toggleAuth) toggleAuth.addEventListener('click', toggleAuthMode);
    if (closeProgressModal) closeProgressModal.addEventListener('click', hideProgressModal);

    // Close modal on outside click (only if elements exist)
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                hideAuthModal();
            }
        });
    }
    
    if (progressModal) {
        progressModal.addEventListener('click', (e) => {
            if (e.target === progressModal) {
                hideProgressModal();
            }
        });
    }

    // Check if user is already logged in
    try {
        let session = null;
        
        // Handle both v1 and v2 Supabase API
        if (supabase.auth.getSession) {
            // v2 API
            const { data: { session: sessionData } } = await supabase.auth.getSession();
            session = sessionData;
        } else if (supabase.auth.session) {
            // v1 API - session() is a synchronous method
            session = supabase.auth.session();
        } else if (supabase.auth.user) {
            // v1 API alternative - check current user
            const user = supabase.auth.user();
            if (user) {
                session = { user: user };
            }
        } else {
            return;
        }
        
        if (session && session.user) {
            currentUser = session.user;
            updateAuthUI();
        }
    } catch (error) {
        return;
    }

    // Listen for auth state changes
    const authStateChangeHandler = async (event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateAuthUI();
            hideAuthModal();
            
            // Only show success message if user actually initiated the login
            if (userInitiatedLogin) {
                showSuccess('Successfully logged in!');
                userInitiatedLogin = false; // Reset flag
            }
            
            // Refresh challenges dropdown to show progress
            if (window.populateChallengesDropdown) {
                await window.populateChallengesDropdown();
            }
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateAuthUI();
            
            // Only show success message if user actually initiated the logout
            if (userInitiatedLogin) {
                showSuccess('Successfully logged out!');
                userInitiatedLogin = false; // Reset flag
            }
            
            // Refresh challenges dropdown to hide progress
            if (window.populateChallengesDropdown) {
                await window.populateChallengesDropdown();
            }
        }
    };
    
    // Handle both v1 and v2 auth state listeners
    if (supabase.auth.onAuthStateChange) {
        supabase.auth.onAuthStateChange(authStateChangeHandler);
    } else if (supabase.auth.on) {
        // v1 API
        supabase.auth.on('SIGNED_IN', (session) => authStateChangeHandler('SIGNED_IN', session));
        supabase.auth.on('SIGNED_OUT', () => authStateChangeHandler('SIGNED_OUT', null));
    }
}

function showAuthModal() {
    if (authModal) {
        authModal.style.display = 'flex';
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.focus();
    } else {
        // If no auth modal exists, redirect to a page that has one
        window.location.href = '/tutorials';
    }
}

function hideAuthModal() {
    if (authModal) {
        authModal.style.display = 'none';
    }
    if (authForm) {
        authForm.reset();
    }
    hideAuthError();
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateAuthModalUI();
}

function updateAuthModalUI() {
    const nameGroup = document.getElementById('name-group');
    const nameField = document.getElementById('name');
    
    if (isLoginMode) {
        if (authTitle) authTitle.textContent = 'Login to Track Progress';
        if (authSubmit) authSubmit.textContent = 'Login';
        if (toggleAuth) toggleAuth.textContent = 'Need an account? Sign up';
        if (nameGroup) nameGroup.style.display = 'none';
        if (nameField) nameField.required = false;
    } else {
        if (authTitle) authTitle.textContent = 'Create Account';
        if (authSubmit) authSubmit.textContent = 'Sign Up';
        if (toggleAuth) toggleAuth.textContent = 'Already have an account? Login';
        if (nameGroup) nameGroup.style.display = 'block';
        if (nameField) nameField.required = true;
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
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('name');
    
    if (!emailInput || !passwordInput) {
        console.error('Auth form inputs not found');
        return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    const name = nameInput ? nameInput.value : '';
    
    // Validate name field during signup
    if (!isLoginMode && (!name || name.trim().length < 2)) {
        showAuthError('Please enter your full name (at least 2 characters).');
        return;
    }
    
    hideAuthError();
    if (authSubmit) {
        authSubmit.disabled = true;
        authSubmit.textContent = isLoginMode ? 'Logging in...' : 'Creating account...';
    }
    
    // Set flag to indicate user initiated this action
    userInitiatedLogin = true;
    
    try {
        let result;
        
        if (isLoginMode) {
            // Handle both v1 and v2 login API
            if (supabase.auth.signInWithPassword) {
                // v2 API
                result = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
            } else if (supabase.auth.signIn) {
                // v1 API
                result = await supabase.auth.signIn({
                    email: email,
                    password: password
                });
            } else {
                throw new Error('Login method not available');
            }
        } else {
            // Handle both v1 and v2 signup API
            if (supabase.auth.signUp) {
                // Both v1 and v2 have signUp, but with different options format
                const signUpOptions = {
                    email: email,
                    password: password
                };
                
                // v2 has options object, v1 has redirectTo directly
                if (supabase.auth.signInWithPassword) {
                    // v2 API
                    signUpOptions.options = {
                        emailRedirectTo: `${window.location.origin}/`,
                        data: {
                            signup_source: 'codebotiks_web',
                            full_name: name.trim()
                        }
                    };
                } else {
                    // v1 API
                    signUpOptions.redirectTo = `${window.location.origin}/`;
                    signUpOptions.data = {
                        full_name: name.trim()
                    };
                }
                
                result = await supabase.auth.signUp(signUpOptions);
            } else {
                throw new Error('Signup method not available');
            }
        }
        
        if (result.error) {
            throw result.error;
        }
        
        if (!isLoginMode && result.data.user) {
            // Try to update the user's display name in Supabase auth
            try {
                if (result.data.user && name.trim()) {
                    // Use Supabase's updateUser method to set display name
                    await supabase.auth.updateUser({
                        data: {
                            full_name: name.trim(),
                            display_name: name.trim()
                        }
                    });
                }
            } catch (nameError) {
                console.warn('Could not update display name:', nameError);
                // Don't fail the signup for this
            }
            
            if (!result.data.session) {
                // Account created but needs email confirmation
                showAuthError('Account created! Please check your email for a confirmation link before logging in.');
                // Auto-switch to login mode
                isLoginMode = true;
                updateAuthModalUI();
            }
        }
        
    } catch (error) {
        
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
        
        // Reset flag on error since auth state change won't fire
        userInitiatedLogin = false;
    } finally {
        if (authSubmit) {
            authSubmit.disabled = false;
        }
        updateAuthModalUI();
    }
}

async function handleLogout() {
    // Set flag to indicate user initiated this action
    userInitiatedLogin = true;
    
    try {
        let result;
        
        // Handle both v1 and v2 logout API
        if (supabase.auth.signOut) {
            result = await supabase.auth.signOut();
        } else {
            throw new Error('Logout method not available');
        }
        
        // v1 returns error directly, v2 returns { error }
        const error = result?.error || (result && !result.data ? result : null);
        if (error) throw error;
    } catch (error) {
        // Reset flag on error since auth state change won't fire
        userInitiatedLogin = false;
        showError('Failed to logout. Please try again.');
    }
}

function showAuthError(message) {
    if (authError) {
        authError.textContent = message;
        authError.style.display = 'block';
    }
}

function hideAuthError() {
    if (authError) {
        authError.style.display = 'none';
    }
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