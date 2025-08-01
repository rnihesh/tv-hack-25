# Email Marketing Frontend

A complete email marketing system built with React and Tailwind CSS for the AI Digital Toolkit.

## Features

### 📧 4-Step Email Campaign Process

1. **Compose** - Write email description and subject
2. **Preview** - Review AI-enhanced content  
3. **Recipients** - Select customers to send to
4. **Send** - Send immediately or schedule for later

### 🎯 Key Capabilities

- **AI-Enhanced Content**: Automatically improve email messages using AI
- **Customer Management**: View and select from customer database
- **Email Scheduling**: Send immediately or schedule for later
- **Customer Segmentation**: Filter customers by segment (premium, regular, new)
- **Performance Predictions**: Estimated open and click rates
- **Responsive Design**: Works on all devices

## Components

### `MailingDashboard.jsx`
Main dashboard component that orchestrates the entire email flow.

### `EmailComposer.jsx`
- Text input for email description
- Subject line input
- AI enhancement integration
- Form validation

### `EmailPreview.jsx`
- Professional email preview
- Content analysis
- Original description comparison
- Performance metrics

### `CustomerList.jsx`
- Customer database display
- Search and filter functionality
- Segment-based filtering
- Bulk selection tools

### `SendConfirmation.jsx`
- Send now or schedule options
- Campaign summary
- Success/error handling
- Performance tracking

## API Integration

All components use the centralized API utility (`utils/api.js`) for backend communication:

```javascript
import { emailAPI, customerAPI } from '../utils/api';

// Enhance email content
const enhanced = await emailAPI.enhanceMessage({
  description,
  subject
});

// Get customers
const customers = await customerAPI.getCustomers();

// Send email
await emailAPI.sendEmail({
  subject,
  message,
  recipients
});
```

## Backend Endpoints Needed

You'll need to implement these backend routes:

```
POST /api/email/enhance     - Enhance email content with AI
POST /api/email/send        - Send email immediately  
POST /api/email/schedule    - Schedule email for later
GET  /api/customers         - Get customer list
GET  /api/customers/segments - Get customer segments
```

## Setup

1. Copy `.env.example` to `.env`
2. Update `VITE_API_URL` to your backend URL
3. Run `npm run dev` to start development server

## Usage

```jsx
import MailingDashboard from './components/MailingDashboard';

function App() {
  return <MailingDashboard />;
}
```

## Error Handling

- API call failures show user-friendly messages
- Form validation prevents invalid submissions
- Loading states provide user feedback
- Fallback to mock data when API unavailable

## Mock Data

Components include mock customer data for development/testing when backend isn't ready.

## Customization

- Update colors by modifying Tailwind classes
- Change API endpoints in `utils/api.js`
- Modify mock data in `CustomerList.jsx`
- Adjust email preview styling in `EmailPreview.jsx`
