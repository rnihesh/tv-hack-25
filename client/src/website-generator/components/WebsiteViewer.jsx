import React, { useState, useEffect } from 'react';

const WebsiteViewer = ({ website, onUpdate, onDeploy, loading }) => {
  const [editMode, setEditMode] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [editData, setEditData] = useState({
    templateName: '',
    structure: {},
    customizations: {}
  });

  // Update editData when website prop changes
  useEffect(() => {
    if (website) {
      setEditData({
        templateName: website.templateName || '',
        structure: website.structure || {},
        customizations: website.customizations || {}
      });
    }
  }, [website]);

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset data to current website values
      setEditData({
        templateName: website?.templateName || '',
        structure: website?.structure || {},
        customizations: website?.customizations || {}
      });
    }
    setEditMode(!editMode);
  };

  const handleSave = () => {
    onUpdate(website._id, editData);
    setEditMode(false);
  };

  const handleDeploy = async () => {
    if (!siteName.trim()) {
      alert('Please enter a site name for deployment');
      return;
    }
    
    try {
      setDeployLoading(true);
      await onDeploy(website._id, siteName);
      setSiteName('');
    } catch (error) {
      console.error('Deploy error:', error);
    } finally {
      setDeployLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomizationChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [field]: value
      }
    }));
  };

  const renderWebsiteStructure = (structure) => {
    if (!structure || typeof structure !== 'object') {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No website structure available</div>
          <p className="text-sm text-gray-400">
            The website structure could not be loaded or is invalid.
          </p>
        </div>
      );
    }

    try {
      return (
        <div className="space-y-6">
          {/* Header Section */}
          {structure.header && (
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <h3 className="bg-gray-50 px-4 py-3 font-medium text-gray-900 border-b border-gray-200">
                Header
              </h3>
              <div className="p-4 space-y-3">
                {structure.header.logo && (
                  <div>
                    <span className="font-medium text-gray-700">Logo:</span>
                    <span className="ml-2 text-gray-600">{structure.header.logo}</span>
                  </div>
                )}
                {structure.header.navigation && (
                  <div>
                    <span className="font-medium text-gray-700">Navigation:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {structure.header.navigation.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {structure.header.contactInfo && (
                  <div>
                    <span className="font-medium text-gray-700">Contact Info:</span>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-600">Phone: {structure.header.contactInfo.phone}</p>
                      <p className="text-sm text-gray-600">Email: {structure.header.contactInfo.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Hero Section */}
          {structure.hero && (
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <h3 className="bg-gray-50 px-4 py-3 font-medium text-gray-900 border-b border-gray-200">
                Hero Section
              </h3>
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{structure.hero.headline}</h2>
                <p className="text-lg text-gray-600 mb-4">{structure.hero.subheadline}</p>
                {structure.hero.callToAction && (
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
                    {structure.hero.callToAction}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* About Section */}
          {structure.about && (
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <h3 className="bg-gray-50 px-4 py-3 font-medium text-gray-900 border-b border-gray-200">
                About Section
              </h3>
              <div className="p-4 space-y-3">
                <h4 className="font-semibold text-gray-900">{structure.about.title}</h4>
                <p className="text-gray-600">{structure.about.content}</p>
                {structure.about.mission && (
                  <div>
                    <span className="font-medium text-gray-700">Mission:</span>
                    <span className="ml-2 text-gray-600">{structure.about.mission}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Services Section */}
          {structure.services && Array.isArray(structure.services) && (
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <h3 className="bg-gray-50 px-4 py-3 font-medium text-gray-900 border-b border-gray-200">
                Services
              </h3>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {structure.services.map((service, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">{service.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                      {service.features && (
                        <ul className="space-y-1">
                          {service.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="text-sm text-gray-600 flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Contact Section */}
          {structure.contact && (
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <h3 className="bg-gray-50 px-4 py-3 font-medium text-gray-900 border-b border-gray-200">
                Contact Section
              </h3>
              <div className="p-4 space-y-2">
                {structure.contact.address && (
                  <p className="text-sm"><span className="font-medium">Address:</span> {structure.contact.address}</p>
                )}
                {structure.contact.phone && (
                  <p className="text-sm"><span className="font-medium">Phone:</span> {structure.contact.phone}</p>
                )}
                {structure.contact.email && (
                  <p className="text-sm"><span className="font-medium">Email:</span> {structure.contact.email}</p>
                )}
                {structure.contact.hours && (
                  <p className="text-sm"><span className="font-medium">Hours:</span> {structure.contact.hours}</p>
                )}
              </div>
            </section>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error rendering website structure:', error);
      return (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Error loading website structure</div>
          <p className="text-sm text-gray-400">
            There was an error rendering the website structure. Please try refreshing.
          </p>
        </div>
      );
    }
  };

  const renderEditForm = () => {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
            Website Name
          </label>
          <input
            type="text"
            id="templateName"
            value={editData.templateName}
            onChange={(e) => handleInputChange('templateName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
            Style
          </label>
          <select
            id="style"
            value={editData.customizations.style || ''}
            onChange={(e) => handleCustomizationChange('style', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Style</option>
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
            <option value="bold">Bold</option>
            <option value="elegant">Elegant</option>
          </select>
        </div>

        <div>
          <label htmlFor="colorScheme" className="block text-sm font-medium text-gray-700 mb-2">
            Color Scheme
          </label>
          <select
            id="colorScheme"
            value={editData.customizations.colorScheme || ''}
            onChange={(e) => handleCustomizationChange('colorScheme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Color Scheme</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="red">Red</option>
            <option value="purple">Purple</option>
            <option value="orange">Orange</option>
            <option value="teal">Teal</option>
            <option value="pink">Pink</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label htmlFor="communicationTone" className="block text-sm font-medium text-gray-700 mb-2">
            Communication Tone
          </label>
          <select
            id="communicationTone"
            value={editData.customizations.communicationTone || ''}
            onChange={(e) => handleCustomizationChange('communicationTone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Tone</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="conversational">Conversational</option>
          </select>
        </div>
      </div>
    );
  };

  const renderHTMLPreview = () => {
    if (!website?.htmlContent) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No HTML content available</p>
        </div>
      );
    }

    // Clean and prepare HTML content for safe rendering
    const cleanHtmlContent = website.htmlContent.replace(/^\s+|\s+$/g, '');
    
    return (
      <div className="space-y-4">
        {/* Iframe Preview */}
        <div className="w-full h-96 border rounded-lg overflow-hidden bg-white">
          <iframe
            srcDoc={cleanHtmlContent}
            className="w-full h-full border-0"
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
            style={{ 
              border: 'none',
              width: '100%',
              height: '100%',
              display: 'block'
            }}
            onLoad={(e) => {
              console.log('Iframe loaded successfully');
            }}
            onError={(e) => {
              console.error('Iframe loading error:', e);
            }}
          />
        </div>
        
        {/* Alternative: Raw HTML Code View */}
        <details className="bg-gray-50 border rounded-lg">
          <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-100">
            View HTML Source Code
          </summary>
          <div className="p-4 border-t">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-64 bg-white p-3 rounded border">
              {cleanHtmlContent}
            </pre>
          </div>
        </details>
      </div>
    );
  };

  if (!website) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No website selected</h2>
        <p className="text-gray-600">Select a website from your list to view it here</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{website.templateName}</h2>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {website.industry}
            </span>
            {website.aiGenerated && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                🤖 AI Generated
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
              Created: {new Date(website.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleEditToggle}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleEditToggle}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✏️ Edit Website
            </button>
          )}
        </div>
      </div>

      {/* Customizations Bar */}
      {website?.customizations && Object.keys(website.customizations).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Style:</span>
              <span className="ml-2 text-gray-600">{website.customizations?.style || 'Not set'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Color:</span>
              <span className="ml-2 text-gray-600">{website.customizations?.colorScheme || 'Not set'}</span>
            </div>
            {website.customizations?.communicationTone && (
              <div>
                <span className="font-medium text-gray-700">Tone:</span>
                <span className="ml-2 text-gray-600">{website.customizations.communicationTone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-8">
        {editMode ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Website Settings</h3>
            {renderEditForm()}
          </div>
        ) : (
          <div>
            {/* Show HTML preview if available, otherwise show structure */}
            {website?.htmlContent ? (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Website Preview (HTML)</h3>
                {renderHTMLPreview()}
              </div>
            ) : website?.structure ? (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Website Preview (Structure)</h3>
                {renderWebsiteStructure(website.structure)}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-2">No preview available</div>
                <p className="text-sm text-gray-400">
                  This website doesn't have HTML content or structure data to display.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      {website?.metadata && Object.keys(website.metadata).length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {website.metadata?.templateType && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Template Type</div>
                <div className="text-gray-600">{website.metadata.templateType}</div>
              </div>
            )}
            {website.metadata?.tokensUsed && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Tokens Used</div>
                <div className="text-gray-600">{website.metadata.tokensUsed}</div>
              </div>
            )}
            {website.metadata?.processingTime && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Processing Time</div>
                <div className="text-gray-600">{website.metadata.processingTime}</div>
              </div>
            )}
            {website.metadata?.model && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700">AI Model</div>
                <div className="text-gray-600">{website.metadata.model}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteViewer;
