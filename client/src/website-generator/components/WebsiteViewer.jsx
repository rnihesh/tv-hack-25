import React, { useState, useEffect } from "react";

const WebsiteViewer = ({ website, onUpdate, onDeploy, loading }) => {
  const [editMode, setEditMode] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [editData, setEditData] = useState({
    templateName: "",
    structure: {},
    customizations: {},
  });

  // Update editData when website prop changes
  useEffect(() => {
    if (website) {
      setEditData({
        templateName: website.templateName || "",
        structure: website.structure || {},
        customizations: website.customizations || {},
      });
    }
  }, [website]);

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset data to current website values
      setEditData({
        templateName: website?.templateName || "",
        structure: website?.structure || {},
        customizations: website?.customizations || {},
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
      alert("Please enter a site name for deployment");
      return;
    }

    try {
      setDeployLoading(true);
      await onDeploy(website._id, siteName);
      setSiteName("");
    } catch (error) {
      console.error("Deploy error:", error);
    } finally {
      setDeployLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomizationChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [field]: value,
      },
    }));
  };

  const renderWebsiteStructure = (structure) => {
    if (!structure || typeof structure !== "object") {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-2">
            No website structure available
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            The website structure could not be loaded or is invalid.
          </p>
        </div>
      );
    }

    try {
      // Create a mock website layout that resembles the actual website
      return (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
          {/* Mock Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {structure.header?.logo && (
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                    {structure.header.logo.charAt(0).toUpperCase()}
                  </div>
                )}
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {structure.header?.logo || website?.templateName || "Website"}
                </h1>
              </div>
              {structure.header?.navigation && (
                <nav className="hidden md:flex space-x-6">
                  {structure.header.navigation
                    .slice(0, 5)
                    .map((item, index) => (
                      <a
                        key={index}
                        href="#"
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
                        onClick={(e) => e.preventDefault()}
                      >
                        {item}
                      </a>
                    ))}
                </nav>
              )}
              {structure.header?.contactInfo && (
                <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  {structure.header.contactInfo.phone && (
                    <span>📞 {structure.header.contactInfo.phone}</span>
                  )}
                  {structure.header.contactInfo.email && (
                    <span>✉️ {structure.header.contactInfo.email}</span>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Mock Hero Section */}
          {structure.hero && (
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-16">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-4">
                  {structure.hero.headline || "Welcome to Our Website"}
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  {structure.hero.subheadline ||
                    "Discover amazing services and solutions"}
                </p>
                {structure.hero.callToAction && (
                  <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    {structure.hero.callToAction}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Mock About Section */}
          {structure.about && (
            <section className="px-6 py-16 bg-gray-50 dark:bg-gray-700">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                  {structure.about.title || "About Us"}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-3xl mx-auto">
                  {structure.about.content ||
                    "Learn more about our company and what we do."}
                </p>
                {structure.about.mission && (
                  <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Our Mission
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {structure.about.mission}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Mock Services Section */}
          {structure.services &&
            Array.isArray(structure.services) &&
            structure.services.length > 0 && (
              <section className="px-6 py-16 bg-white dark:bg-gray-800">
                <div className="max-w-6xl mx-auto">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-12 text-center">
                    Our Services
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {structure.services.slice(0, 6).map((service, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border dark:border-gray-600 hover:shadow-md transition-shadow"
                      >
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          {service.title || `Service ${index + 1}`}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {service.description ||
                            "Professional service description goes here."}
                        </p>
                        {service.features && service.features.length > 0 && (
                          <ul className="space-y-2">
                            {service.features
                              .slice(0, 3)
                              .map((feature, featureIndex) => (
                                <li
                                  key={featureIndex}
                                  className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
                                >
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
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

          {/* Mock Contact Section */}
          {structure.contact && (
            <section className="px-6 py-16 bg-gray-900 text-white">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold mb-8 text-center">
                  Contact Us
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                  {structure.contact.address && (
                    <div>
                      <div className="text-2xl mb-2">📍</div>
                      <h4 className="font-semibold mb-1">Address</h4>
                      <p className="text-gray-300 text-sm">
                        {structure.contact.address}
                      </p>
                    </div>
                  )}
                  {structure.contact.phone && (
                    <div>
                      <div className="text-2xl mb-2">📞</div>
                      <h4 className="font-semibold mb-1">Phone</h4>
                      <p className="text-gray-300 text-sm">
                        {structure.contact.phone}
                      </p>
                    </div>
                  )}
                  {structure.contact.email && (
                    <div>
                      <div className="text-2xl mb-2">✉️</div>
                      <h4 className="font-semibold mb-1">Email</h4>
                      <p className="text-gray-300 text-sm">
                        {structure.contact.email}
                      </p>
                    </div>
                  )}
                  {structure.contact.hours && (
                    <div>
                      <div className="text-2xl mb-2">🕐</div>
                      <h4 className="font-semibold mb-1">Hours</h4>
                      <p className="text-gray-300 text-sm">
                        {structure.contact.hours}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Fallback content if no specific sections are found */}
          {!structure.hero &&
            !structure.about &&
            !structure.services &&
            !structure.contact && (
              <div className="px-6 py-16 bg-white dark:bg-gray-800">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  Website Structure Preview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
                  This website contains custom content that will be displayed
                  when deployed.
                </p>

                {/* Show generation details if available */}
                {structure.sections && structure.sections[0]?.customData && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Generation Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {structure.sections[0].customData.prompt && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                            Prompt
                          </div>
                          <div className="text-blue-800 dark:text-blue-200 text-sm">
                            "{structure.sections[0].customData.prompt}"
                          </div>
                        </div>
                      )}
                      {structure.sections[0].customData.templateType && (
                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                          <div className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                            Template Type
                          </div>
                          <div className="text-green-800 dark:text-green-200 text-sm">
                            {structure.sections[0].customData.templateType}
                          </div>
                        </div>
                      )}
                      {structure.sections[0].customData.style && (
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                          <div className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                            Style
                          </div>
                          <div className="text-purple-800 dark:text-purple-200 text-sm">
                            {structure.sections[0].customData.style}
                          </div>
                        </div>
                      )}
                      {structure.sections[0].customData.colorScheme && (
                        <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                          <div className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
                            Color Scheme
                          </div>
                          <div className="text-orange-800 dark:text-orange-200 text-sm">
                            {structure.sections[0].customData.colorScheme}
                          </div>
                        </div>
                      )}
                      {structure.sections[0].customData.model && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                            AI Model
                          </div>
                          <div className="text-gray-800 dark:text-gray-200 text-sm">
                            {structure.sections[0].customData.model}
                          </div>
                        </div>
                      )}
                      {structure.sections[0].customData.tokensUsed && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                          <div className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                            Tokens Used
                          </div>
                          <div className="text-yellow-800 dark:text-yellow-200 text-sm">
                            {structure.sections[0].customData.tokensUsed}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notice about missing HTML content */}
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="text-amber-600 dark:text-amber-400 text-lg mr-3">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="text-amber-900 dark:text-amber-300 font-semibold mb-2">
                        HTML Content Not Found
                      </h4>
                      <p className="text-amber-800 dark:text-amber-200 text-sm mb-3">
                        This website appears to have been generated but the HTML
                        content is not stored in the expected location. The
                        website structure contains metadata but no renderable
                        content.
                      </p>
                      <p className="text-amber-800 dark:text-amber-200 text-sm">
                        <strong>Expected:</strong> HTML content in{" "}
                        <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">
                          structure.sections[0].content
                        </code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Raw structure for debugging */}
                <details className="bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg">
                  <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
                    View Raw Structure Data (Debug)
                  </summary>
                  <div className="p-4 border-t dark:border-gray-600">
                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-64 bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-600">
                      {JSON.stringify(structure, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering website structure:", error);
      return (
        <div className="text-center py-8">
          <div className="text-red-500 dark:text-red-400 mb-2">
            Error loading website structure
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            There was an error rendering the website structure. Please try
            refreshing.
          </p>
        </div>
      );
    }
  };

  const renderEditForm = () => {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <label
            htmlFor="templateName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Website Name
          </label>
          <input
            type="text"
            id="templateName"
            value={editData.templateName}
            onChange={(e) => handleInputChange("templateName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="style"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Style
          </label>
          <select
            id="style"
            value={editData.customizations.style || ""}
            onChange={(e) => handleCustomizationChange("style", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label
            htmlFor="colorScheme"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Color Scheme
          </label>
          <select
            id="colorScheme"
            value={editData.customizations.colorScheme || ""}
            onChange={(e) =>
              handleCustomizationChange("colorScheme", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label
            htmlFor="communicationTone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Communication Tone
          </label>
          <select
            id="communicationTone"
            value={editData.customizations.communicationTone || ""}
            onChange={(e) =>
              handleCustomizationChange("communicationTone", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
    // Check for HTML content in multiple locations
    let htmlContent = website?.htmlContent;

    // If no direct htmlContent, check structure sections
    if (!htmlContent && website?.structure?.sections) {
      const htmlSection = website.structure.sections.find(
        (section) =>
          section.content &&
          (section.content.includes("<!DOCTYPE html") ||
            section.content.includes("<html"))
      );
      if (htmlSection) {
        htmlContent = htmlSection.content;
      }
    }

    if (!htmlContent) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No HTML content available</p>
        </div>
      );
    }

    // Clean and prepare HTML content for safe rendering
    const cleanHtmlContent = htmlContent.replace(/^\s+|\s+$/g, "");

    return (
      <div className="space-y-4">
        {/* Iframe Preview */}
        <div className="w-full h-[600px] border dark:border-gray-600 rounded-lg overflow-hidden bg-white shadow-sm">
          <iframe
            srcDoc={cleanHtmlContent}
            className="w-full h-full border-0"
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin allow-forms"
            style={{
              border: "none",
              width: "100%",
              height: "100%",
              display: "block",
            }}
            onLoad={(e) => {
              console.log("Iframe loaded successfully");
            }}
            onError={(e) => {
              console.error("Iframe loading error:", e);
            }}
          />
        </div>

        {/* Alternative: Raw HTML Code View */}
        <details className="bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg">
          <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
            View HTML Source Code
          </summary>
          <div className="p-4 border-t dark:border-gray-600">
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-64 bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-600">
              {cleanHtmlContent}
            </pre>
          </div>
        </details>
      </div>
    );
  };

  // Helper function to check if website has HTML content
  const hasHTMLContent = () => {
    console.log("Checking for HTML content...");
    console.log("website?.htmlContent:", website?.htmlContent);
    console.log("website?.structure?:", website?.structure);

    if (website?.htmlContent) {
      console.log("Found HTML in website.htmlContent");
      return true;
    }

    if (website?.structure?.sections) {
      const htmlSection = website.structure.sections.find((section) => {
        console.log("Checking section:", section);
        console.log("Section content:", section.content);
        return (
          section.content &&
          (section.content.includes("<!DOCTYPE html") ||
            section.content.includes("<html"))
        );
      });

      if (htmlSection) {
        console.log("Found HTML in sections:", htmlSection);
        return true;
      } else {
        console.log("No HTML content found in sections");
      }
    }

    console.log("No HTML content found anywhere");
    return false;
  };

  if (!website) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No website selected
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select a website from your list to view it here
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {website.templateName}
          </h2>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
              {website.industry}
            </span>
            {website.aiGenerated && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
                🤖 AI Generated
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm">
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
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleEditToggle}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      {website?.customizations &&
        Object.keys(website.customizations).length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Style:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {website.customizations?.style || "Not set"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Color:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {website.customizations?.colorScheme || "Not set"}
                </span>
              </div>
              {website.customizations?.communicationTone && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Tone:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {website.customizations.communicationTone}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Content */}
      <div className="space-y-8">
        {editMode ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Edit Website Settings
            </h3>
            {renderEditForm()}
          </div>
        ) : (
          <div>
            {/* Show HTML preview if available, otherwise show structure */}
            {hasHTMLContent() ? (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Website Preview (HTML)
                </h3>
                {renderHTMLPreview()}
              </div>
            ) : website?.structure ? (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Website Preview (Structure)
                </h3>
                {renderWebsiteStructure(website.structure)}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  No preview available
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  This website doesn't have HTML content or structure data to
                  display.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      {website?.metadata && Object.keys(website.metadata).length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Generation Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {website.metadata?.templateType && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Template Type
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {website.metadata.templateType}
                </div>
              </div>
            )}
            {website.metadata?.tokensUsed && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tokens Used
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {website.metadata.tokensUsed}
                </div>
              </div>
            )}
            {website.metadata?.processingTime && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Processing Time
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {website.metadata.processingTime}
                </div>
              </div>
            )}
            {website.metadata?.model && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI Model
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {website.metadata.model}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteViewer;
