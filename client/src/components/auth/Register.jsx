import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'retail', label: 'Retail Store', icon: '🛍️' },
  { value: 'service', label: 'Service Business', icon: '🔧' },
  { value: 'consulting', label: 'Consulting', icon: '💼' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const brandStyles = [
  { value: 'modern', label: 'Modern', description: 'Clean, contemporary design' },
  { value: 'classic', label: 'Classic', description: 'Timeless, traditional style' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, uncluttered look' },
  { value: 'bold', label: 'Bold', description: 'Eye-catching, vibrant design' },
  { value: 'elegant', label: 'Elegant', description: 'Sophisticated, refined style' },
  { value: 'playful', label: 'Playful', description: 'Fun, creative approach' },
];

const colorSchemes = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'teal', label: 'Teal', color: 'bg-teal-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
];

const communicationTones = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and informal' },
  { value: 'conversational', label: 'Conversational', description: 'Natural and engaging' },
  { value: 'formal', label: 'Formal', description: 'Structured and official' },
];

const marketingGoals = [
  { value: 'brand_awareness', label: 'Brand Awareness', icon: '📢' },
  { value: 'lead_generation', label: 'Lead Generation', icon: '🎯' },
  { value: 'customer_retention', label: 'Customer Retention', icon: '💝' },
  { value: 'sales_conversion', label: 'Sales Conversion', icon: '💰' },
  { value: 'engagement', label: 'Engagement', icon: '👥' },
  { value: 'reach', label: 'Reach', icon: '🌐' },
];

const Register = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Basic Info
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2 - Business Details
    businessType: '',
    businessDescription: '',
    targetAudience: '',
    
    // Step 3 - Preferences
    preferences: {
      colorScheme: 'blue',
      brandStyle: 'modern',
      communicationTone: 'professional',
      marketingGoals: [],
      contentStyle: 'informative',
    }
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMarketingGoalToggle = (goal) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        marketingGoals: prev.preferences.marketingGoals.includes(goal)
          ? prev.preferences.marketingGoals.filter(g => g !== goal)
          : [...prev.preferences.marketingGoals, goal]
      }
    }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (currentStep === 2) {
      if (!formData.businessType) {
        newErrors.businessType = 'Please select your business type';
      }
      
      if (!formData.businessDescription.trim()) {
        newErrors.businessDescription = 'Business description is required';
      }
      
      if (!formData.targetAudience.trim()) {
        newErrors.targetAudience = 'Target audience description is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        businessType: formData.businessType,
        businessDescription: formData.businessDescription,
        targetAudience: formData.targetAudience,
        preferences: formData.preferences,
      };

      const result = await register(registrationData);
      
      if (!result.success) {
        setErrors({ general: result.message || 'Registration failed' });
      }
      // If successful, the AuthContext will handle the redirect
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Create Your Account</h2>
        <p className="mt-2 text-sm text-gray-600">Start your AI-powered business journey</p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {errors.general}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Company Name *
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.companyName ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Enter your company name"
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Create a password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Tell Us About Your Business</h2>
        <p className="mt-2 text-sm text-gray-600">Help us personalize your AI experience</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What type of business do you run? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {businessTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, businessType: type.value }))}
                className={`p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  formData.businessType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </div>
              </button>
            ))}
          </div>
          {errors.businessType && (
            <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
          )}
        </div>

        <div>
          <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">
            Describe your business *
          </label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            rows={4}
            value={formData.businessDescription}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.businessDescription ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="What products or services do you offer? What makes your business unique?"
          />
          {errors.businessDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.businessDescription}</p>
          )}
        </div>

        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
            Who is your target audience? *
          </label>
          <textarea
            id="targetAudience"
            name="targetAudience"
            rows={3}
            value={formData.targetAudience}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.targetAudience ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Describe your ideal customers (age, interests, demographics, etc.)"
          />
          {errors.targetAudience && (
            <p className="mt-1 text-sm text-red-600">{errors.targetAudience}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Customize Your Preferences</h2>
        <p className="mt-2 text-sm text-gray-600">These help us create content that matches your brand</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Brand Style
          </label>
          <div className="grid grid-cols-1 gap-3">
            {brandStyles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, brandStyle: style.value }
                }))}
                className={`p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  formData.preferences.brandStyle === style.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="font-medium">{style.label}</div>
                <div className="text-sm text-gray-600">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color Scheme
          </label>
          <div className="grid grid-cols-4 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, colorScheme: scheme.value }
                }))}
                className={`p-3 border rounded-lg text-center hover:bg-gray-50 transition-colors ${
                  formData.preferences.colorScheme === scheme.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <div className={`w-8 h-8 ${scheme.color} rounded-full mx-auto mb-2`}></div>
                <div className="text-sm font-medium">{scheme.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Communication Tone
          </label>
          <div className="grid grid-cols-1 gap-3">
            {communicationTones.map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, communicationTone: tone.value }
                }))}
                className={`p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  formData.preferences.communicationTone === tone.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="font-medium">{tone.label}</div>
                <div className="text-sm text-gray-600">{tone.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Marketing Goals (select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {marketingGoals.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => handleMarketingGoalToggle(goal.value)}
                className={`p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  formData.preferences.marketingGoals.includes(goal.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{goal.icon}</span>
                  <span className="text-sm font-medium">{goal.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNumber
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {stepNumber}
          </div>
          {stepNumber < 3 && (
            <div
              className={`w-12 h-1 ${
                step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        {renderStepIndicator()}
        
        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Previous
              </button>
            )}
            
            <div className="flex-1"></div>
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account & Get 10 Free Credits!'
                )}
              </button>
            )}
          </div>

          {step === 1 && (
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in here
                </button>
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;