import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * @example
 * <ErrorBoundary>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  /**
   * Catch error and update state with error info
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  /**
   * Reset the error state to allow recovery
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
            <Typography variant="h5" component="h2" color="error">
              Something went wrong
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              An error occurred while rendering this part of the application.
            </Typography>
            <Typography variant="body2" component="pre" sx={{ 
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 200,
              width: '100%',
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontSize: '0.8rem'
            }}>
              {this.state.error?.toString()}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleReset}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 