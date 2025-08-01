import React, { useState, useEffect } from 'react';
import { api } from './api';
import WebsiteForm from './components/WebsiteForm';
import WebsiteList from './components/WebsiteList';
import WebsiteViewer from './components/WebsiteViewer';
import LoadingSpinner from './components/LoadingSpinner';
import Toast from './components/Toast';

const WebsiteGenerator = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deployingWebsites, setDeployingWebsites] = useState(new Set());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Dummy user for testing (will be replaced with auth later)
  const dummyUser = {
    id: 'dummy-user-123',
    companyName: 'Demo Company',
    businessType: 'Technology',
    credits: 100
  };

  useEffect(() => {
    if (activeTab === 'manage') {
      loadWebsites();
    }
  }, [activeTab, pagination.page]);

  const loadWebsites = async () => {
    try {
      setLoading(true);
      const response = await api.getMyWebsites({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setWebsites(response.data.websites);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (error) {
      showToast('Failed to load websites', 'error');
      console.error('Load websites error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWebsite = async (formData) => {
    try {
      setLoading(true);
      const response = await api.generateWebsite(formData);
      
      if (response.success) {
        const message = response.data.deployment 
          ? 'Website generated and deployed successfully!' 
          : 'Website generated successfully!';
        showToast(message, 'success');
        setSelectedWebsite(response.data);
        setActiveTab('preview');
        // Refresh websites list if we're on manage tab
        if (activeTab === 'manage') {
          loadWebsites();
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate website';
      showToast(message, 'error');
      console.error('Generate website error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWebsite = async (websiteId, updateData) => {
    try {
      setLoading(true);
      const response = await api.updateWebsite(websiteId, updateData);
      
      if (response.success) {
        showToast('Website updated successfully!', 'success');
        setSelectedWebsite(response.data.website);
        loadWebsites(); // Refresh the list
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update website';
      showToast(message, 'error');
      console.error('Update website error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployWebsite = async (websiteId, siteName) => {
    try {
      setDeployingWebsites(prev => new Set([...prev, websiteId]));
      const response = await api.deployWebsite(websiteId, { siteName });
      
      if (response.success) {
        showToast('Website deployed successfully!', 'success');
        loadWebsites(); // Refresh the list to show deployment status
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to deploy website';
      showToast(message, 'error');
      console.error('Deploy website error:', error);
    } finally {
      setDeployingWebsites(prev => {
        const newSet = new Set(prev);
        newSet.delete(websiteId);
        return newSet;
      });
    }
  };

  const handleDeleteWebsite = async (websiteId) => {
    if (!window.confirm('Are you sure you want to delete this website?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.deleteWebsite(websiteId);
      
      if (response.success) {
        showToast('Website deleted successfully!', 'success');
        setWebsites(prev => prev.filter(website => website._id !== websiteId));
        if (selectedWebsite?._id === websiteId) {
          setSelectedWebsite(null);
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete website';
      showToast(message, 'error');
      console.error('Delete website error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWebsite = async (websiteId) => {
    try {
      setLoading(true);
      const response = await api.getWebsite(websiteId);
      
      if (response.success) {
        setSelectedWebsite(response.data.website);
        setActiveTab('preview');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load website';
      showToast(message, 'error');
      console.error('View website error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-2">AI Website Generator</h1>
          <p className="text-xl opacity-90 mb-4">Generate professional websites with AI assistance</p>
          <div className="flex justify-center gap-8 text-sm">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Company: {dummyUser.companyName}
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Credits: {dummyUser.credits}
            </span>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex bg-white rounded-lg p-1 mb-8 shadow-md">
          <button 
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'generate' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('generate')}
          >
            Generate Website
          </button>
          <button 
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'manage' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('manage')}
          >
            My Websites
          </button>
          {selectedWebsite && (
            <button 
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
                activeTab === 'preview' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
          )}
        </nav>

        {/* Main Content */}
        <main className="bg-white rounded-xl shadow-lg p-8 relative">
          {loading && <LoadingSpinner />}
          
          {activeTab === 'generate' && (
            <WebsiteForm 
              onSubmit={handleGenerateWebsite}
              loading={loading}
              userCredits={dummyUser.credits}
            />
          )}

          {activeTab === 'manage' && (
            <WebsiteList
              websites={websites}
              loading={loading}
              pagination={pagination}
              onView={handleViewWebsite}
              onDelete={handleDeleteWebsite}
              onPageChange={handlePageChange}
            />
          )}

          {activeTab === 'preview' && selectedWebsite && (
            <WebsiteViewer
              website={selectedWebsite}
              onUpdate={handleUpdateWebsite}
              loading={loading}
            />
          )}
        </main>

        {/* Toast */}
        {toast.show && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        )}
      </div>
    </div>
  );
};

export default WebsiteGenerator;
