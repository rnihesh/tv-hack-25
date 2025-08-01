import { useState } from 'react';

const EmailPreview = ({ emailData, onBack, onNext, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatEmailContent = (content) => {
    // Simple formatting for better display
    return content.split('\n').map((line, index) => (
      <p key={index} className={line.trim() === '' ? 'mb-4' : 'mb-2'}>
        {line}
      </p>
    ));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview Your Email</h2>
      
      {/* Email Preview Container */}
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border max-w-2xl mx-auto">
          {/* Email Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  Y
                </div>
                <div>
                  <p className="font-medium text-gray-900">Your Company</p>
                  <p className="text-sm text-gray-500">noreply@yourcompany.com</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900">{emailData.subject}</h3>
          </div>

          {/* Email Body */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              {formatEmailContent(emailData.enhancedMessage)}
            </div>
          </div>

          {/* Email Footer */}
          <div className="border-t bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">
              You're receiving this email because you're a valued customer of Your Company.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <a href="#" className="text-blue-600 hover:underline">Unsubscribe</a> | 
              <a href="#" className="text-blue-600 hover:underline ml-2">Update Preferences</a>
            </p>
          </div>
        </div>
      </div>

      {/* Original Description (Expandable) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="font-medium text-blue-900">Original Description</h3>
          <span className="text-blue-600">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-blue-800 text-sm whitespace-pre-wrap">
              {emailData.description}
            </p>
          </div>
        )}
      </div>

      {/* Email Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">~250</div>
          <div className="text-sm text-green-800">Estimated Words</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">~30s</div>
          <div className="text-sm text-blue-800">Read Time</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">Mobile</div>
          <div className="text-sm text-purple-800">Optimized</div>
        </div>
      </div>

      {/* Content Analysis */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-yellow-900 mb-2">📊 Content Analysis</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-yellow-800">Tone:</span>
            <span className="ml-2 text-yellow-900 font-medium">Professional & Friendly</span>
          </div>
          <div>
            <span className="text-yellow-800">Call to Action:</span>
            <span className="ml-2 text-yellow-900 font-medium">Present</span>
          </div>
          <div>
            <span className="text-yellow-800">Personalization:</span>
            <span className="ml-2 text-yellow-900 font-medium">High</span>
          </div>
          <div>
            <span className="text-yellow-800">Spam Score:</span>
            <span className="ml-2 text-green-600 font-medium">Low ✓</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ← Back to Edit
          </button>
          
          <button
            onClick={onEdit}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ✏️ Make Changes
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Step 2 of 4
          </div>
          
          <button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Select Recipients →
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
