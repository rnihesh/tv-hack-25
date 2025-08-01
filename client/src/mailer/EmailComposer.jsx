import { useState } from 'react';
import { emailAPI } from '../utils/api';

const EmailComposer = ({ emailData, onDataUpdate, onNext, isLoading, setIsLoading }) => {
  const [description, setDescription] = useState(emailData.description || '');
  const [subject, setSubject] = useState(emailData.subject || '');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!description.trim()) {
      newErrors.description = 'Please provide a description of what you want to send';
    }
    
    if (!subject.trim()) {
      newErrors.subject = 'Email subject is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnhanceMessage = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await emailAPI.enhanceMessage({
        description: description,
        subject: subject,
        // Add any additional context from company profile
      });

      const enhancedMessage = response.enhancedMessage;
      
      onDataUpdate({
        description,
        subject,
        enhancedMessage
      });

      onNext();
    } catch (error) {
      console.error('Error enhancing message:', error);
      setErrors({ 
        general: 'Failed to enhance message. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewWithoutEnhancing = () => {
    if (!validateForm()) return;

    onDataUpdate({
      description,
      subject,
      enhancedMessage: description // Use original description as fallback
    });

    onNext();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Compose Your Email</h2>
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {errors.general}
        </div>
      )}

      <div className="space-y-6">
        {/* Email Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Email Subject *
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.subject ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
          )}
        </div>

        {/* Email Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to send to your customers? *
          </label>
          <textarea
            id="description"
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want to communicate to your customers. For example: 'I want to announce our new product launch with a 20% discount for existing customers. Include details about the product features and how they can claim the discount.'"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Be as detailed as possible. Our AI will create a professional, engaging email based on your description.
          </p>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Tips for better results:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include the purpose of your email (promotion, announcement, newsletter, etc.)</li>
            <li>• Mention any specific offers, discounts, or calls to action</li>
            <li>• Specify the tone you want (professional, friendly, urgent, etc.)</li>
            <li>• Include any important details or deadlines</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex space-x-3">
            <button
              onClick={handleEnhanceMessage}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <span>🎨</span>
                  <span>Enhance with AI</span>
                </>
              )}
            </button>
            
            <button
              onClick={handlePreviewWithoutEnhancing}
              disabled={isLoading}
              className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Skip Enhancement
            </button>
          </div>

          <div className="text-sm text-gray-500">
            Step 1 of 4
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;
