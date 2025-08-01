import React, { useState } from 'react';

const WebsiteForm = ({ onSubmit, loading, userCredits }) => {
  const [formData, setFormData] = useState({
    prompt: '',
    requirements: '',
    templateType: 'business',
    style: 'modern',
    colorScheme: 'blue',
    sections: [],
    siteName: '',
    autoDeploy: false
  });

  const [errors, setErrors] = useState({});

  const templateTypes = [
    { value: 'landing', label: 'Landing Page', description: 'Single page for product/service promotion', icon: '🚀' },
    { value: 'portfolio', label: 'Portfolio', description: 'Showcase work and projects', icon: '🎨' },
    { value: 'business', label: 'Business', description: 'Professional business website', icon: '🏢' },
    { value: 'ecommerce', label: 'E-commerce', description: 'Online store with product catalog', icon: '🛒' },
    { value: 'blog', label: 'Blog', description: 'Content-focused blog website', icon: '📝' }
  ];

  const styles = [
    { value: 'modern', label: 'Modern', description: 'Clean, contemporary design' },
    { value: 'classic', label: 'Classic', description: 'Traditional, timeless design' },
    { value: 'minimal', label: 'Minimal', description: 'Simple, uncluttered layout' },
    { value: 'bold', label: 'Bold', description: 'Strong, eye-catching design' },
    { value: 'elegant', label: 'Elegant', description: 'Sophisticated, refined appearance' }
  ];

  const colorSchemes = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'teal', label: 'Teal', color: 'bg-teal-500' },
    { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
    { value: 'custom', label: 'Custom', color: 'bg-gray-500' }
  ];

  const sectionOptions = [
    'hero', 'about', 'services', 'portfolio', 'testimonials', 'team', 'contact', 'blog', 'pricing', 'faq'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSectionToggle = (section) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Business description is required';
    } else if (formData.prompt.trim().length < 10) {
      newErrors.prompt = 'Business description must be at least 10 characters';
    } else if (formData.prompt.trim().length > 1000) {
      newErrors.prompt = 'Business description must not exceed 1000 characters';
    }

    if (userCredits < 5) {
      newErrors.credits = 'Insufficient credits. Website generation requires 5 credits.';
    }

    const totalCredits = 5 + (formData.autoDeploy ? 2 : 0);
    if (userCredits < totalCredits) {
      newErrors.credits = `Insufficient credits. This operation requires ${totalCredits} credits (5 for generation${formData.autoDeploy ? ' + 2 for deployment' : ''}).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({
      prompt: '',
      requirements: '',
      templateType: 'business',
      style: 'modern',
      colorScheme: 'blue',
      sections: [],
      siteName: '',
      autoDeploy: false
    });
    setErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Generate New Website</h2>
        <p className="text-gray-600 mb-4">Describe your business and we'll create a professional website for you</p>
        <div className="flex justify-center gap-4 text-sm">
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
            Cost: {5 + (formData.autoDeploy ? 2 : 0)} credits
          </span>
          <span className={`px-3 py-1 rounded-full font-medium ${
            userCredits < (5 + (formData.autoDeploy ? 2 : 0)) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            Available: {userCredits} credits
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Description */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Business Description *
            <span className="block text-xs text-gray-500 font-normal">
              Describe your business, services, and target audience
            </span>
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={formData.prompt}
            onChange={handleInputChange}
            placeholder="e.g., We are a digital marketing agency specializing in helping small businesses grow their online presence through social media marketing, content creation, and SEO services. Our target audience includes local restaurants, retail stores, and service-based businesses."
            rows="4"
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.prompt ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.prompt && (
            <p className="mt-1 text-sm text-red-600">{errors.prompt}</p>
          )}
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.prompt.length}/1000 characters
          </div>
        </div>

        {/* Additional Requirements */}
        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Requirements
            <span className="block text-xs text-gray-500 font-normal">
              Any specific features, design elements, or functionality you want included
            </span>
          </label>
          <textarea
            id="requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            placeholder="e.g., Include a contact form, customer testimonials section, photo gallery, or specific color preferences"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.requirements.length}/500 characters
          </div>
        </div>

        {/* Template Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Website Template Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateTypes.map(template => (
              <div key={template.value} className="relative">
                <input
                  type="radio"
                  id={`template-${template.value}`}
                  name="templateType"
                  value={template.value}
                  checked={formData.templateType === template.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <label
                  htmlFor={`template-${template.value}`}
                  className={`block p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-500 ${
                    formData.templateType === template.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{template.label}</div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Design Style</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {styles.map(style => (
              <div key={style.value} className="relative">
                <input
                  type="radio"
                  id={`style-${style.value}`}
                  name="style"
                  value={style.value}
                  checked={formData.style === style.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <label
                  htmlFor={`style-${style.value}`}
                  className={`block p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-500 ${
                    formData.style === style.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{style.label}</div>
                  <div className="text-sm text-gray-500">{style.description}</div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Color Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Color Scheme</label>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {colorSchemes.map(color => (
              <div key={color.value} className="relative">
                <input
                  type="radio"
                  id={`color-${color.value}`}
                  name="colorScheme"
                  value={color.value}
                  checked={formData.colorScheme === color.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <label
                  htmlFor={`color-${color.value}`}
                  className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all hover:border-gray-400 ${
                    formData.colorScheme === color.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${color.color} mb-2`}></div>
                  <span className="text-xs text-gray-700">{color.label}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website Sections (Optional)
            <span className="block text-xs text-gray-500 font-normal">
              Select specific sections you want to include
            </span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {sectionOptions.map(section => (
              <div key={section} className="relative">
                <input
                  type="checkbox"
                  id={`section-${section}`}
                  checked={formData.sections.includes(section)}
                  onChange={() => handleSectionToggle(section)}
                  className="sr-only"
                />
                <label
                  htmlFor={`section-${section}`}
                  className={`block px-3 py-2 text-sm border rounded-lg cursor-pointer transition-all hover:border-blue-500 text-center ${
                    formData.sections.includes(section)
                      ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-200'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Error Messages */}
        {errors.credits && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errors.credits}</p>
          </div>
        )}

        {/* Site Configuration */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Site Configuration</h3>
          
          {/* Site Name */}
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
              Site Name (Optional)
            </label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={formData.siteName}
              onChange={handleInputChange}
              placeholder="e.g., my-awesome-business"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Used for deployment URL. Leave empty for auto-generated name.
            </p>
          </div>

          {/* Auto Deploy */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoDeploy"
              name="autoDeploy"
              checked={formData.autoDeploy}
              onChange={(e) => setFormData(prev => ({ ...prev, autoDeploy: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoDeploy" className="text-sm font-medium text-gray-700">
              Auto-deploy to Netlify (+2 credits)
            </label>
          </div>
          {formData.autoDeploy && (
            <div className="ml-7 text-sm text-gray-600">
              Your website will be automatically deployed and live on the web immediately after generation.
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={loading || userCredits < (5 + (formData.autoDeploy ? 2 : 0))}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Generating Website...' : `Generate Website${formData.autoDeploy ? ' & Deploy' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WebsiteForm;
