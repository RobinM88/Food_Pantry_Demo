import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';

function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    ),
    ...options,
  });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render }; 