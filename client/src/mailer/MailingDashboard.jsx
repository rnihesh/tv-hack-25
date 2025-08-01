import { useState } from 'react';
import EmailComposer from './EmailComposer';
import EmailPreview from './EmailPreview';
import CustomerList from './CustomerList';
import SendConfirmation from './SendConfirmation';

const MailingDashboard = () => {
  const [currentStep, setCurrentStep] = useState('compose');
  const [emailData, setEmailData] = useState({
    description: '',
    enhancedMessage: '',
    subject: '',
    selectedCustomers: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { id: 'compose', label: 'Compose', icon: '✏️' },
    { id: 'preview', label: 'Preview', icon: '👁️' },
    { id: 'customers', label: 'Recipients', icon: '👥' },
    { id: 'send', label: 'Send', icon: '🚀' }
  ];

  const handleStepChange = (stepId) => {
    setCurrentStep(stepId);
  };

  const handleEmailDataUpdate = (newData) => {
    setEmailData(prev => ({ ...prev, ...newData }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Marketing Campaign</h1>
          <p className="text-gray-600">Create and send personalized emails to your customers</p>
        </div>

        {/* Step Navigation */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepChange(step.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="font-medium">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="mx-4 h-px bg-gray-300 w-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {currentStep === 'compose' && (
            <EmailComposer
              emailData={emailData}
              onDataUpdate={handleEmailDataUpdate}
              onNext={() => handleStepChange('preview')}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
          
          {currentStep === 'preview' && (
            <EmailPreview
              emailData={emailData}
              onBack={() => handleStepChange('compose')}
              onNext={() => handleStepChange('customers')}
              onEdit={() => handleStepChange('compose')}
            />
          )}
          
          {currentStep === 'customers' && (
            <CustomerList
              emailData={emailData}
              onDataUpdate={handleEmailDataUpdate}
              onBack={() => handleStepChange('preview')}
              onNext={() => handleStepChange('send')}
            />
          )}
          
          {currentStep === 'send' && (
            <SendConfirmation
              emailData={emailData}
              onBack={() => handleStepChange('customers')}
              onSent={() => {
                // Reset to compose for new campaign
                setCurrentStep('compose');
                setEmailData({
                  description: '',
                  enhancedMessage: '',
                  subject: '',
                  selectedCustomers: []
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MailingDashboard;
