import { useState } from 'react';
import { chatbotAPI } from '../utils/mailapi';

const ChatbotTraining = () => {
  const [activeTrainingTab, setActiveTrainingTab] = useState('business');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  
  // Business Info State
  const [businessInfo, setBusinessInfo] = useState({
    companyName: 'AI Digital Toolkit',
    industry: 'Technology',
    description: 'AI-powered digital marketing and automation platform',
    products: '',
    values: '',
    tone: 'professional'
  });

  // FAQ State
  const [faqData, setFaqData] = useState([
    {
      id: 1,
      question: 'What is AI Digital Toolkit?',
      answer: 'AI Digital Toolkit is a comprehensive platform that helps businesses automate their digital marketing using artificial intelligence.',
      category: 'general',
      priority: 'high'
    },
    {
      id: 2,
      question: 'How much does it cost?',
      answer: 'We offer flexible pricing plans starting from $29/month for small businesses to enterprise solutions.',
      category: 'pricing',
      priority: 'high'
    }
  ]);

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const trainingTabs = [
    { id: 'business', label: 'Business Info', icon: '🏢' },
    { id: 'faq', label: 'FAQ Management', icon: '❓' },
    { id: 'documents', label: 'Document Upload', icon: '📄' },
    { id: 'conversations', label: 'Past Conversations', icon: '💬' }
  ];

  const handleBusinessInfoSubmit = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsTraining(false);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      await chatbotAPI.trainChatbot({
        businessInfo,
        trainingType: 'business_context'
      });

    } catch (error) {
      console.error('Training error:', error);
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  const addNewFAQ = () => {
    const newFAQ = {
      id: Date.now(),
      question: '',
      answer: '',
      category: 'general',
      priority: 'medium'
    };
    setFaqData([...faqData, newFAQ]);
  };

  const updateFAQ = (id, field, value) => {
    setFaqData(faqData.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };

  const deleteFAQ = (id) => {
    setFaqData(faqData.filter(faq => faq.id !== id));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploaded',
      file
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (id) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderBusinessInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={businessInfo.companyName}
            onChange={(e) => setBusinessInfo({...businessInfo, companyName: e.target.value})}
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Industry
          </label>
          <select
            value={businessInfo.industry}
            onChange={(e) => setBusinessInfo({...businessInfo, industry: e.target.value})}
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Education">Education</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-primary mb-2">
          Company Description
        </label>
        <textarea
          value={businessInfo.description}
          onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
          rows={4}
          className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder="Describe what your company does, your mission, and key services..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-primary mb-2">
          Products & Services
        </label>
        <textarea
          value={businessInfo.products}
          onChange={(e) => setBusinessInfo({...businessInfo, products: e.target.value})}
          rows={3}
          className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder="List your main products and services..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-primary mb-2">
          Communication Tone
        </label>
        <select
          value={businessInfo.tone}
          onChange={(e) => setBusinessInfo({...businessInfo, tone: e.target.value})}
          className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="casual">Casual</option>
          <option value="enthusiastic">Enthusiastic</option>
          <option value="empathetic">Empathetic</option>
        </select>
      </div>

      {isTraining && (
        <div className="card p-4 bg-brand-50 border-brand-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-brand-700 font-medium">Training in Progress</span>
            <span className="text-brand-600">{trainingProgress}%</span>
          </div>
          <div className="w-full bg-brand-200 rounded-full h-2">
            <div 
              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${trainingProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <button
        onClick={handleBusinessInfoSubmit}
        disabled={isTraining}
        className="btn-primary px-6 py-3 rounded-lg focus-ring disabled:opacity-50"
      >
        {isTraining ? 'Training...' : 'Train Chatbot with Business Info'}
      </button>
    </div>
  );

  const renderFAQManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-theme-primary">FAQ Management</h3>
        <button
          onClick={addNewFAQ}
          className="btn-primary px-4 py-2 rounded-lg focus-ring"
        >
          Add New FAQ
        </button>
      </div>

      <div className="space-y-4">
        {faqData.map((faq) => (
          <div key={faq.id} className="card p-4 border border-theme">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <select
                value={faq.category}
                onChange={(e) => updateFAQ(faq.id, 'category', e.target.value)}
                className="p-2 border border-theme rounded bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
              >
                <option value="general">General</option>
                <option value="pricing">Pricing</option>
                <option value="support">Support</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
              </select>
              
              <select
                value={faq.priority}
                onChange={(e) => updateFAQ(faq.id, 'priority', e.target.value)}
                className="p-2 border border-theme rounded bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <button
                onClick={() => deleteFAQ(faq.id)}
                className="btn-secondary px-3 py-2 rounded focus-ring text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={faq.question}
                onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                placeholder="Enter the question..."
                className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
              />
              
              <textarea
                value={faq.answer}
                onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                placeholder="Enter the answer..."
                rows={3}
                className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => chatbotAPI.trainChatbot({ faqData, trainingType: 'faq' })}
        className="btn-primary px-6 py-3 rounded-lg focus-ring"
      >
        Update FAQ Training
      </button>
    </div>
  );

  const renderDocumentUpload = () => (
    <div className="space-y-6">
      <div className="card p-6 border-2 border-dashed border-theme text-center">
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx,.csv"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-4xl mb-4">📁</div>
          <div className="text-lg font-medium text-theme-primary mb-2">
            Upload Training Documents
          </div>
          <div className="text-theme-secondary">
            Drop files here or click to browse
          </div>
          <div className="text-sm text-theme-tertiary mt-2">
            Supports: PDF, TXT, DOC, DOCX, CSV
          </div>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-theme-primary">Uploaded Files</h3>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-brand-100 rounded flex items-center justify-center">
                  <span className="text-brand-600 text-sm">📄</span>
                </div>
                <div>
                  <div className="font-medium text-theme-primary">{file.name}</div>
                  <div className="text-sm text-theme-secondary">
                    {formatFileSize(file.size)} • {file.status}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                ✕
              </button>
            </div>
          ))}
          
          <button
            onClick={() => chatbotAPI.trainChatbot({ documents: uploadedFiles, trainingType: 'documents' })}
            className="btn-primary px-6 py-3 rounded-lg focus-ring"
          >
            Process Documents
          </button>
        </div>
      )}
    </div>
  );

  const renderConversations = () => (
    <div className="space-y-6">
      <div className="card p-4">
        <h3 className="font-semibold text-theme-primary mb-4">Import Past Conversations</h3>
        <p className="text-theme-secondary mb-4">
          Upload conversation logs to help train your chatbot with real customer interactions.
        </p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4 text-center border-2 border-dashed border-theme">
              <div className="text-2xl mb-2">💬</div>
              <div className="font-medium text-theme-primary">Chat Logs</div>
              <div className="text-sm text-theme-secondary">JSON, CSV formats</div>
            </div>
            
            <div className="card p-4 text-center border-2 border-dashed border-theme">
              <div className="text-2xl mb-2">📧</div>
              <div className="font-medium text-theme-primary">Email History</div>
              <div className="text-sm text-theme-secondary">EML, MSG formats</div>
            </div>
          </div>
          
          <button className="btn-secondary px-4 py-2 rounded-lg focus-ring">
            Import Conversations
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Training Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🧠</div>
          <div className="font-semibold text-theme-primary">Knowledge Base</div>
          <div className="text-sm text-brand-600">85% Complete</div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">❓</div>
          <div className="font-semibold text-theme-primary">FAQ Items</div>
          <div className="text-sm text-theme-secondary">{faqData.length} items</div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">📄</div>
          <div className="font-semibold text-theme-primary">Documents</div>
          <div className="text-sm text-theme-secondary">{uploadedFiles.length} files</div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-semibold text-theme-primary">Accuracy</div>
          <div className="text-sm text-accent-success">92%</div>
        </div>
      </div>

      {/* Training Tabs */}
      <div className="card">
        <div className="border-b border-theme">
          <nav className="flex space-x-8 px-6">
            {trainingTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTrainingTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTrainingTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-theme-secondary hover:text-theme-primary'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTrainingTab === 'business' && renderBusinessInfo()}
          {activeTrainingTab === 'faq' && renderFAQManagement()}
          {activeTrainingTab === 'documents' && renderDocumentUpload()}
          {activeTrainingTab === 'conversations' && renderConversations()}
        </div>
      </div>
    </div>
  );
};

export default ChatbotTraining;
