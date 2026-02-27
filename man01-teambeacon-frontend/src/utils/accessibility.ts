/**
 * Accessibility utility functions
 * Helpers for ensuring WCAG 2.1 AA compliance
 */

/**
 * Announce content to screen readers
 * @param message - Message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Generate unique IDs for form elements
 * @param prefix - Optional prefix for the ID
 */
let idCounter = 0;
export const generateUniqueId = (prefix = 'id'): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
};

/**
 * Check if an element is focusable
 * @param element - DOM element to check
 */
export const isFocusable = (element: HTMLElement): boolean => {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute('disabled')) return false;
  
  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];
  
  return focusableTags.includes(tagName) || element.tabIndex >= 0;
};

/**
 * Trap focus within a container (useful for modals)
 * @param container - Container element
 */
export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Add skip link for keyboard navigation
 * @param targetId - ID of the main content
 */
export const createSkipLink = (targetId: string): HTMLAnchorElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #1976d2;
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  return skipLink;
};

/**
 * Format phone number for accessibility
 * @param phoneNumber - Phone number string
 */
export const formatPhoneForScreenReader = (phoneNumber: string): string => {
  // Remove special characters and add spaces for better pronunciation
  return phoneNumber
    .replace(/[^\d+]/g, '')
    .split('')
    .join(' ');
};

/**
 * Create accessible error message
 * @param fieldName - Name of the field with error
 * @param errorMessage - Error message
 */
export const createErrorMessage = (
  fieldName: string,
  errorMessage: string
): string => {
  return `Error in ${fieldName}: ${errorMessage}`;
};

/**
 * Debounce function for reducing announcement frequency
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
