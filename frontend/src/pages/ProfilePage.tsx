import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { updateProfile, changePassword } from '@/store/slices/authSlice';
import { showSnackbar } from '@/store/slices/uiSlice';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      dispatch(showSnackbar({ message: 'Profile updated successfully!', severity: 'success' }));
      setIsEditing(false);
    } catch (error: any) {
      dispatch(showSnackbar({ message: error || 'Failed to update profile', severity: 'error' }));
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || '',
    });
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      dispatch(showSnackbar({ message: 'Passwords do not match', severity: 'error' }));
      return;
    }

    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap();
      dispatch(showSnackbar({ message: 'Password changed successfully!', severity: 'success' }));
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      dispatch(showSnackbar({ message: error || 'Failed to change password', severity: 'error' }));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>

      {/* Profile Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Profile Information</Typography>
            {!isEditing ? (
              <Button
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            ) : (
              <Box>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>

          <Box display="flex" alignItems="center" mb={3}>
            <Avatar
              src={profileData.avatarUrl}
              sx={{ width: 80, height: 80, mr: 3 }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{user?.name}</Typography>
              <Typography color="text.secondary">{user?.email}</Typography>
              <Typography variant="caption" color="text.secondary">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Full Name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              disabled={!isEditing}
              fullWidth
            />
            <TextField
              label="Avatar URL"
              value={profileData.avatarUrl}
              onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
              disabled={!isEditing}
              fullWidth
              helperText="Enter a URL to an image for your avatar"
            />
            <TextField
              label="Email"
              value={user?.email || ''}
              disabled
              fullWidth
              helperText="Email cannot be changed"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage your password and security settings.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setPasswordDialogOpen(true)}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Password must be at least 8 characters with uppercase, lowercase, number and special character"
          />
          <TextField
            margin="dense"
            label="Confirm New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={isLoading}>
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
