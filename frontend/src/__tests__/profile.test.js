import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../pages/Profile';
import { AuthContext } from '../context/AuthContext';

// Mock API
jest.mock('../api/users', () => ({
  usersAPI: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('../api/notifications', () => ({
  notificationsAPI: {
    list: jest.fn(),
  },
}));

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: '1234567890',
  role: 'member',
};

const mockProfile = {
  ...mockUser,
  role_name: 'Member',
};

const renderProfile = (user = mockUser) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user, updateUser: jest.fn() }}>
        <Profile />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render profile information', async () => {
    const { usersAPI } = require('../api/users');
    usersAPI.getProfile.mockResolvedValue(mockProfile);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
  });

  it('should show "Not set" for empty phone number', async () => {
    const profileWithoutPhone = { ...mockProfile, phone: null };
    const { usersAPI } = require('../api/users');
    usersAPI.getProfile.mockResolvedValue(profileWithoutPhone);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Not set')).toBeInTheDocument();
    });
  });

  it('should enter edit mode when Edit Profile button is clicked', async () => {
    const { usersAPI } = require('../api/users');
    usersAPI.getProfile.mockResolvedValue(mockProfile);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
  });

  it('should save profile changes successfully', async () => {
    const { usersAPI } = require('../api/users');
    const mockUpdateUser = jest.fn();
    
    usersAPI.getProfile.mockResolvedValue(mockProfile);
    usersAPI.updateProfile.mockResolvedValue({
      ...mockProfile,
      first_name: 'Updated',
      last_name: 'Name',
      phone: '9876543210'
    });

    renderProfile(mockUser);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Update form fields
    const firstNameInput = screen.getByDisplayValue('Test');
    const lastNameInput = screen.getByDisplayValue('User');
    const phoneInput = screen.getByDisplayValue('1234567890');

    fireEvent.change(firstNameInput, { target: { value: 'Updated' } });
    fireEvent.change(lastNameInput, { target: { value: 'Name' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(usersAPI.updateProfile).toHaveBeenCalledWith({
        first_name: 'Updated',
        last_name: 'Name',
        phone: '9876543210'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  it('should show validation error when no fields are provided', async () => {
    const { usersAPI } = require('../api/users');
    usersAPI.getProfile.mockResolvedValue(mockProfile);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Clear all fields
    const firstNameInput = screen.getByDisplayValue('Test');
    const lastNameInput = screen.getByDisplayValue('User');
    const phoneInput = screen.getByDisplayValue('1234567890');

    fireEvent.change(firstNameInput, { target: { value: '' } });
    fireEvent.change(lastNameInput, { target: { value: '' } });
    fireEvent.change(phoneInput, { target: { value: '' } });

    // Try to save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide at least one field to update')).toBeInTheDocument();
    });
  });

  it('should cancel edit mode when Cancel button is clicked', async () => {
    const { usersAPI } = require('../api/users');
    usersAPI.getProfile.mockResolvedValue(mockProfile);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Cancel edit
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Should be back to view mode
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test')).not.toBeInTheDocument();
  });
});
