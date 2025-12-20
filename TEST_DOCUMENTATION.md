# Test Documentation

## Overview

This document provides comprehensive information about the test suite for the Team Task Management System, including both frontend and backend tests.

## Test Structure

### Frontend Tests (React/Jest)

Located in: `frontend/src/__tests__/`

#### Test Files Created:

1. **notifications.test.js**
   - Tests notification API functionality
   - Covers notification creation, listing, and error handling
   - Mocks API calls and validates responses

2. **profile.test.js**
   - Tests Profile component functionality
   - Covers profile display, editing, and form submission
   - Validates user interactions and state management

3. **teamMetrics.test.js**
   - Tests utility functions for team metrics
   - Covers permission checking, task validation, and calculations
   - Validates data processing and business logic

4. **Dashboard.test.js**
   - Tests Dashboard component functionality
   - Covers metrics display, task lists, and user interactions
   - Validates real-time updates and data visualization

#### Running Frontend Tests:

```bash
cd frontend
npm test
```

For coverage:
```bash
npm test -- --coverage
```

For specific test files:
```bash
npm test -- --testPathPattern="notifications"
npm test -- --testPathPattern="profile"
npm test -- --testPathPattern="Dashboard"
```

### Backend Tests (Django/Python)

Located in: `backend/`

#### Test Files Created:

1. **users/test_models.py**
   - Tests User model and related profile models
   - Covers user creation, roles, and relationships
   - Validates model methods and constraints

2. **users/test_api.py**
   - Tests User API endpoints
   - Covers authentication, CRUD operations, and permissions
   - Validates API responses and error handling

3. **tasks/test_models.py**
   - Tests Task and TaskComment models
   - Covers task lifecycle, relationships, and comments
   - Validates model behavior and business rules

#### Running Backend Tests:

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
python manage.py test
```

For verbose output:
```bash
python manage.py test --verbosity=2
```

For specific test modules:
```bash
python manage.py test users.test_models
python manage.py test users.test_api
python manage.py test tasks.test_models
```

## Test Coverage

### Frontend Coverage Areas:

- **API Integration**: All API calls are mocked and tested
- **Component Rendering**: Components render correctly with props
- **User Interactions**: Click events, form submissions, navigation
- **State Management**: useState, useEffect, context updates
- **Error Handling**: API errors, validation errors, loading states
- **Data Flow**: Props drilling, context usage, data updates

### Backend Coverage Areas:

- **Model Validation**: Field constraints, relationships, methods
- **API Endpoints**: CRUD operations, authentication, permissions
- **Business Logic**: Role-based access, task workflows, notifications
- **Data Integrity**: Foreign keys, unique constraints, cascading
- **Edge Cases**: Empty data, null values, error conditions

## Test Configuration

### Frontend (Jest Configuration)

The frontend uses Jest with React Testing Library. Key configurations:

- **Mocking**: API calls are mocked using `jest.mock()`
- **Authentication**: Mock AuthContext for authenticated components
- **Routing**: Mock BrowserRouter for navigation testing
- **Async Testing**: Uses `waitFor` for async operations

### Backend (Django Configuration)

The backend uses Django's built-in test framework:

- **Database**: Uses in-memory SQLite for fast testing
- **Fixtures**: Dynamic test data creation using `setUp()` methods
- **Isolation**: Each test runs in isolation with clean database
- **UUID Usage**: Unique usernames/emails to avoid constraint conflicts

## Common Test Patterns

### Frontend Test Pattern:

```javascript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mocks
  });

  it('should do something', async () => {
    // Arrange
    renderComponent();
    
    // Act
    fireEvent.click(element);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

### Backend Test Pattern:

```python
class TestCaseName(TestCase):
    def setUp(self):
        # Create test data with unique identifiers
        self.user = User.objects.create_user(
            username=f'user_{uuid.uuid4().hex[:8]}',
            email=f'user_{uuid.uuid4().hex[:8]}@example.com',
            password='testpass123'
        )

    def test_feature(self):
        # Arrange - setup test conditions
        # Act - perform the action
        # Assert - verify the result
        self.assertEqual(result, expected)
```

## Known Issues and Fixes

### Issue: Username Uniqueness Conflicts

**Problem**: Tests failing due to duplicate usernames across test runs
**Solution**: Use UUID-based unique identifiers in test data

```python
# Before (causes conflicts)
username='testuser'

# After (unique per test)
username=f'testuser_{uuid.uuid4().hex[:8]}'
```

### Issue: API Mocking in Frontend Tests

**Problem**: Tests failing due to incorrect API mocking
**Solution**: Properly mock API modules and responses

```javascript
// Correct mocking approach
jest.mock('../api/notifications', () => ({
  notificationsAPI: {
    list: jest.fn(),
    create: jest.fn(),
  },
}));
```

## Best Practices

### Frontend Testing:

1. **Mock External Dependencies**: Always mock API calls and external modules
2. **Test User Interactions**: Simulate real user behavior (clicks, typing, navigation)
3. **Validate State Changes**: Ensure component state updates correctly
4. **Handle Async Operations**: Use `waitFor` for promises and async updates
5. **Test Error Cases**: Verify error handling and loading states

### Backend Testing:

1. **Use Unique Test Data**: Avoid constraint violations with UUID-based identifiers
2. **Test Model Validations**: Verify field constraints and business rules
3. **Cover API Endpoints**: Test all HTTP methods and status codes
4. **Verify Permissions**: Ensure role-based access control works
5. **Test Edge Cases**: Handle empty data, null values, and error conditions

## Continuous Integration

### Frontend CI Commands:

```bash
npm install
npm test -- --watchAll=false --coverage
npm run build  # Verify production build
```

### Backend CI Commands:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py test --verbosity=2
python manage.py check  # Verify Django configuration
```

## Test Data Management

### Frontend Mock Data:

- **Users**: Different role types (admin, manager, member)
- **Tasks**: Various statuses and priorities
- **Notifications**: Different types and timestamps
- **Metrics**: Sample data for dashboard calculations

### Backend Test Data:

- **Dynamic Creation**: Test data created fresh for each test
- **Relationships**: Proper foreign key relationships maintained
- **Timestamps**: Use `timezone.now()` for consistent datetime testing
- **UUID Fields**: Test UUID generation and uniqueness

## Debugging Tests

### Frontend Debugging:

- Use `screen.debug()` to print component state
- Check mock call history with `jest.fn().mock.calls`
- Verify DOM structure with browser dev tools
- Use `console.log` in test files for debugging

### Backend Debugging:

- Use `print()` statements in test methods
- Check database state with `Model.objects.all()`
- Verify query execution with Django debug toolbar
- Use `pdb` for interactive debugging

## Future Improvements

### Frontend:

- Add integration tests for complete user workflows
- Implement visual regression testing
- Add performance testing for large datasets
- Create end-to-end tests with Cypress

### Backend:

- Add load testing for API endpoints
- Implement database performance tests
- Create migration testing suite
- Add security testing for authentication

## Conclusion

This test suite provides comprehensive coverage of both frontend and backend functionality. Regular execution of these tests ensures code quality, prevents regressions, and maintains system reliability.

For questions or improvements to the test suite, please refer to the development team or create an issue in the project repository.
