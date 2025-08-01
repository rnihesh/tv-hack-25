import React from 'react';

const WebsiteList = ({ 
  websites, 
  loading, 
  pagination, 
  onView, 
  onDelete, 
  onDeploy,
  onPageChange,
  deployingWebsites = new Set()
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTemplateIcon = (templateType) => {
    const icons = {
      landing: '🚀',
      portfolio: '🎨',
      business: '🏢',
      ecommerce: '🛒',
      blog: '📝'
    };
    return icons[templateType] || '🌐';
  };

  const getStyleColor = (style) => {
    const colors = {
      modern: 'bg-blue-100 text-blue-800',
      classic: 'bg-gray-100 text-gray-800',
      minimal: 'bg-green-100 text-green-800',
      bold: 'bg-red-100 text-red-800',
      elegant: 'bg-purple-100 text-purple-800'
    };
    return colors[style] || 'bg-gray-100 text-gray-800';
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, pagination.page - halfVisible);
    let endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Previous
      </button>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 border rounded-md ${
            i === pagination.page 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < pagination.pages) {
      if (endPage < pagination.pages - 1) {
        pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
      }
      pages.push(
        <button
          key={pagination.pages}
          onClick={() => onPageChange(pagination.pages)}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {pagination.pages}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.pages}
        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    );

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        {pages}
      </div>
    );
  };

  if (loading && websites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading your websites...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">My Websites</h2>
        <div className="text-sm text-gray-600">
          Showing {websites.length} of {pagination.total} websites
        </div>
      </div>

      {websites.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No websites yet</h3>
          <p className="text-gray-600 mb-6">Generate your first website using the AI generator</p>
          <button 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => window.location.hash = '#generate'}
          >
            Generate Website
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <div key={website._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">
                        {getTemplateIcon(website.customizations?.templateType)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{website.templateName}</h3>
                        <p className="text-sm text-gray-500">{website.industry}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onView(website._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Website"
                      >
                        👁️
                      </button>
                      {/* Deploy button - only show if files are available */}
                      {(website.filesAvailable || website.deployment?.url) && (
                        <button
                          onClick={() => onDeploy(website._id)}
                          disabled={deployingWebsites.has(website._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={website.deployment?.url ? "Redeploy Website" : "Deploy Website"}
                        >
                          {deployingWebsites.has(website._id) ? '⏳' : '🚀'}
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(website._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Website"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {website.customizations?.style && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStyleColor(website.customizations.style)}`}>
                          {website.customizations.style}
                        </span>
                      )}
                      {website.customizations?.colorScheme && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {website.customizations.colorScheme}
                        </span>
                      )}
                      {website.aiGenerated && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          🤖 AI Generated
                        </span>
                      )}
                      {website.deployment?.url && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          🌐 Deployed
                        </span>
                      )}
                    </div>
                    
                    {/* Deployment URL if available */}
                    {website.deployment?.url && (
                      <div className="mt-2">
                        <a 
                          href={website.deployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                        >
                          🔗 {website.deployment.url}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Created: {formatDate(website.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {renderPagination()}
        </>
      )}

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default WebsiteList;
