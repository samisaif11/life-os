// ============================================================
// LIFE OS — Login View
// ============================================================

import { signIn, signUp } from '../services/auth.js';
import { $ } from '../utils/dom.js';
import { hideNav } from '../components/nav.js';

/**
 * Render the login view
 * @param {HTMLElement} container
 */
export async function render(container) {
  hideNav();
  let isSignUp = false;

  container.innerHTML = `
    <div class="login-view">
      <div class="login-card card">
        <div class="login-logo">PIĀNKY OS</div>
        <div class="login-subtitle">Life Operating System</div>

        <div id="login-error" class="login-error hidden"></div>

        <form id="login-form" class="login-form">
          <div id="name-field" class="form-group hidden">
            <label class="form-label" for="display-name">Display Name</label>
            <input class="form-input" type="text" id="display-name" placeholder="Sami">
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input class="form-input" type="email" id="email" placeholder="sami@example.com" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input class="form-input" type="password" id="password" placeholder="••••••••" required minlength="6">
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-btn">
            Sign In
          </button>
        </form>

        <div class="login-toggle">
          <span id="toggle-text">Don't have an account?</span>
          <a id="toggle-link">Create one</a>
        </div>
      </div>
    </div>
  `;

  const form = $('#login-form', container);
  const errorEl = $('#login-error', container);
  const nameField = $('#name-field', container);
  const submitBtn = $('#submit-btn', container);
  const toggleText = $('#toggle-text', container);
  const toggleLink = $('#toggle-link', container);

  // Toggle sign-in / sign-up
  toggleLink.addEventListener('click', () => {
    isSignUp = !isSignUp;
    nameField.classList.toggle('hidden', !isSignUp);
    submitBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
    toggleText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
    toggleLink.textContent = isSignUp ? 'Sign in' : 'Create one';
    errorEl.classList.add('hidden');
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = isSignUp ? 'Creating...' : 'Signing in...';

    const email = $('#email', container).value.trim();
    const password = $('#password', container).value;
    const displayName = $('#display-name', container).value.trim();

    let result;
    if (isSignUp) {
      result = await signUp(email, password, displayName);
    } else {
      result = await signIn(email, password);
    }

    if (result.error) {
      errorEl.textContent = result.error;
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
    }
    // If successful, the auth listener in app.js will handle navigation
  });
}
