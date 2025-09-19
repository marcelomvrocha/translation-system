import React from 'react';
import { Snackbar as MuiSnackbar, Alert, AlertTitle } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { hideSnackbar } from '@/store/slices/uiSlice';

const Snackbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { snackbar } = useAppSelector((state) => state.ui);

  const handleClose = () => {
    dispatch(hideSnackbar());
  };

  return (
    <MuiSnackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar;
