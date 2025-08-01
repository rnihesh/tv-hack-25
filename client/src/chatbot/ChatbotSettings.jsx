import { useState, useEffect } from 'react';
import { chatbotAPI } from '../utils/mailapi';

const ChatbotSettings = () => {
  const [settings, setSettings] = useState({
    botName: 'Customer Assistant',
    personality: 'professional',
    welcomeMessage: 'Hello! How can I help you today?',
    fallbackMessage: 'I\'m sorry, I don\'t have information about that. Would you like me to connect you with a human representative?',
    maxResponseLength: 500,
    responseDelay: 1000,
    contextWindow: 5,
    escalationTriggers: ['human_request', 'confusion', 'complaint'],
    businessHours: {
      enabled: false,
      timezone: 'UTC',
      schedule: [
        { day: 'monday', startTime: '09:00', endTime: '17:00', isOpen: true },
        { day: 'tuesday', startTime: '09:00', endTime: '17:00', isOpen: true },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00', isOpen: true },
        { day: 'thursday', startTime: '09:00', endTime: '17:00', isOpen: true },
        { day: 'friday', startTime: '09:00', endTime: '17:00', isOpen: true },
        { day: 'saturday', startTime: '10:00', endTime: '16:00', isOpen: false },
        { day: 'sunday', startTime: '10:00', endTime: '16:00', isOpen: false }
      ]
    },
    aiModel: 'ollama-llama3',
    widgetSettings: {
      position: 'bottom-right',
      primaryColor: '#4f46e5',
      textColor: '#1f2937',
      backgroundColor: '#ffffff',
      size: 'medium'
    }
  });

  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState('');

  const settingSections = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'personality', label: 'Personality', icon: '🎭' },
    { id: 'responses', label: 'Responses', icon: '💬' },
    { id: 'business-hours', label: 'Business Hours', icon: '🕒' },
    { id: 'widget', label: 'Widget', icon: '🔧' },
    { id: 'advanced', label: 'Advanced', icon: '🔬' }
  ];

  const personalityOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-like tone' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable personality' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and conversational style' },
    { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and positive attitude' },
    { value: 'empathetic', label: 'Empathetic', description: 'Understanding and supportive approach' },
    { value: 'authoritative', label: 'Authoritative', description: 'Confident and knowledgeable tone' }
  ];

  const escalationTriggerOptions = [
    { value: 'human_request', label: 'Human Request', description: 'User explicitly asks for human help' },
    { value: 'confusion', label: 'Confusion', description: 'Bot cannot understand user intent' },
    { value: 'complaint', label: 'Complaint', description: 'User expresses dissatisfaction' },
    { value: 'technical_issue', label: 'Technical Issue', description: 'Complex technical problems' },
    { value: 'billing_inquiry', label: 'Billing Inquiry', description: 'Payment or billing questions' }
  ];

  const aiModelOptions = [
    { value: 'gemini-pro', label: 'Gemini Pro', description: 'Google\'s advanced language model' },
    { value: 'ollama-llama3', label: 'Llama 3 (Local)', description: 'Open-source model running locally' },
    { value: 'hybrid', label: 'Hybrid', description: 'Intelligent switching between models' }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await chatbotAPI.updateSettings(settings);
      setSavedStatus('success');
      setTimeout(() => setSavedStatus(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSavedStatus('error');
      setTimeout(() => setSavedStatus(''), 3000);
    }
    setIsSaving(false);
  };

  const updateSetting = (path, value) => {
    const pathArray = path.split('.');
    const newSettings = { ...settings };
    let current = newSettings;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    setSettings(newSettings);
  };

  const toggleEscalationTrigger = (trigger) => {
    const triggers = settings.escalationTriggers.includes(trigger)
      ? settings.escalationTriggers.filter(t => t !== trigger)
      : [...settings.escalationTriggers, trigger];
    updateSetting('escalationTriggers', triggers);
  };

  const updateBusinessHours = (day, field, value) => {
    const newSchedule = settings.businessHours.schedule.map(item => 
      item.day === day ? { ...item, [field]: value } : item
    );
    updateSetting('businessHours.schedule', newSchedule);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-theme-primary mb-2">
          Bot Name
        </label>
        <input
          type="text"
          value={settings.botName}
          onChange={(e) => updateSetting('botName', e.target.value)}
          className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          placeholder="Enter bot name..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-primary mb-2">
          AI Model
        </label>
        <select
          value={settings.aiModel}
          onChange={(e) => updateSetting('aiModel', e.target.value)}
          className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
        >
          {aiModelOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-theme-secondary mt-1">
          {aiModelOptions.find(opt => opt.value === settings.aiModel)?.description}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-primary mb-2">
          Welcome Message
        </label>
        <textarea
          value={settings.welcomeMessage}
          onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
          rows={3}
          className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          placeholder="Enter welcome message..."
        />
      </div>
    </div>
  );

  const renderPersonalitySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-theme-primary mb-4">
          Bot Personality
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalityOptions.map(option => (
            <div
              key={option.value}
              onClick={() => updateSetting('personality', option.value)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                settings.personality === option.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-theme bg-theme-secondary text-theme-primary hover:border-brand-300'
              }`}
            >
              <div className="font-semibold mb-1">{option.label}</div>
              <div className="text-sm text-theme-secondary">{option.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-primary mb-2">
          Fallback Response
        </label>
        <textarea
          value={settings.fallbackMessage}
          onChange={(e) => updateSetting('fallbackMessage', e.target.value)}
          rows={3}
          className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          placeholder="Message when bot doesn't understand..."
        />
      </div>
    </div>
  );

  const renderResponseSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Max Response Length
          </label>
          <input
            type="number"
            value={settings.maxResponseLength}
            onChange={(e) => updateSetting('maxResponseLength', parseInt(e.target.value))}
            min="100"
            max="2000"
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-sm text-theme-secondary mt-1">Characters (100-2000)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Response Delay
          </label>
          <input
            type="number"
            value={settings.responseDelay}
            onChange={(e) => updateSetting('responseDelay', parseInt(e.target.value))}
            min="0"
            max="5000"
            step="100"
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-sm text-theme-secondary mt-1">Milliseconds (0-5000)</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-primary mb-2">
          Context Window Size
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={settings.contextWindow}
          onChange={(e) => updateSetting('contextWindow', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-theme-secondary mt-1">
          <span>1 message</span>
          <span className="font-medium">{settings.contextWindow} messages</span>
          <span>20 messages</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-primary mb-4">
          Escalation Triggers
        </label>
        <div className="space-y-3">
          {escalationTriggerOptions.map(option => (
            <div key={option.value} className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={settings.escalationTriggers.includes(option.value)}
                onChange={() => toggleEscalationTrigger(option.value)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-theme-primary">{option.label}</div>
                <div className="text-sm text-theme-secondary">{option.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBusinessHours = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={settings.businessHours.enabled}
          onChange={(e) => updateSetting('businessHours.enabled', e.target.checked)}
          className="form-checkbox"
        />
        <label className="text-sm font-medium text-theme-primary">
          Enable Business Hours
        </label>
      </div>

      {settings.businessHours.enabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Timezone
            </label>
            <select
              value={settings.businessHours.timezone}
              onChange={(e) => updateSetting('businessHours.timezone', e.target.value)}
              className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-4">
              Weekly Schedule
            </label>
            <div className="space-y-3">
              {settings.businessHours.schedule.map((day) => (
                <div key={day.day} className="flex items-center space-x-4 p-3 bg-theme-secondary rounded-lg">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(e) => updateBusinessHours(day.day, 'isOpen', e.target.checked)}
                    className="form-checkbox"
                  />
                  <div className="w-20 font-medium text-theme-primary capitalize">
                    {day.day}
                  </div>
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => updateBusinessHours(day.day, 'startTime', e.target.value)}
                    disabled={!day.isOpen}
                    className="p-2 border border-theme rounded bg-theme-primary text-theme-primary focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  />
                  <span className="text-theme-secondary">to</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => updateBusinessHours(day.day, 'endTime', e.target.value)}
                    disabled={!day.isOpen}
                    className="p-2 border border-theme rounded bg-theme-primary text-theme-primary focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderWidgetSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Widget Position
          </label>
          <select
            value={settings.widgetSettings.position}
            onChange={(e) => updateSetting('widgetSettings.position', e.target.value)}
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Widget Size
          </label>
          <select
            value={settings.widgetSettings.size}
            onChange={(e) => updateSetting('widgetSettings.size', e.target.value)}
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Primary Color
          </label>
          <input
            type="color"
            value={settings.widgetSettings.primaryColor}
            onChange={(e) => updateSetting('widgetSettings.primaryColor', e.target.value)}
            className="w-full h-12 border border-theme rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Text Color
          </label>
          <input
            type="color"
            value={settings.widgetSettings.textColor}
            onChange={(e) => updateSetting('widgetSettings.textColor', e.target.value)}
            className="w-full h-12 border border-theme rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Background Color
          </label>
          <input
            type="color"
            value={settings.widgetSettings.backgroundColor}
            onChange={(e) => updateSetting('widgetSettings.backgroundColor', e.target.value)}
            className="w-full h-12 border border-theme rounded-lg"
          />
        </div>
      </div>

      <div className="card p-4 bg-theme-tertiary">
        <h4 className="font-semibold text-theme-primary mb-2">Widget Preview</h4>
        <div className="text-sm text-theme-secondary">
          A preview of your chat widget will appear here based on your settings.
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div className="card p-4 bg-accent-warning-light border-accent-warning">
        <div className="flex items-start space-x-3">
          <span className="text-accent-warning text-lg">⚠️</span>
          <div>
            <div className="font-medium text-theme-primary">Advanced Settings</div>
            <div className="text-sm text-theme-secondary">
              These settings require technical knowledge. Incorrect values may affect bot performance.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            API Key (Optional)
          </label>
          <input
            type="password"
            placeholder="Enter custom API key..."
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Webhook URL (Optional)
          </label>
          <input
            type="url"
            placeholder="https://your-webhook-url.com"
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Custom Headers (JSON)
          </label>
          <textarea
            rows={4}
            placeholder='{"Authorization": "Bearer token", "Custom-Header": "value"}'
            className="w-full p-3 border border-theme rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-brand-500 font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Save Status */}
      {savedStatus && (
        <div className={`card p-4 ${
          savedStatus === 'success' ? 'bg-accent-success-light border-accent-success' : 'bg-accent-error-light border-accent-error'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{savedStatus === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">
              {savedStatus === 'success' ? 'Settings saved successfully!' : 'Error saving settings. Please try again.'}
            </span>
          </div>
        </div>
      )}

      {/* Settings Navigation */}
      <div className="card">
        <div className="border-b border-theme">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {settingSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  activeSection === section.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-theme-secondary hover:text-theme-primary'
                }`}
              >
                <span className="text-lg">{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeSection === 'general' && renderGeneralSettings()}
          {activeSection === 'personality' && renderPersonalitySettings()}
          {activeSection === 'responses' && renderResponseSettings()}
          {activeSection === 'business-hours' && renderBusinessHours()}
          {activeSection === 'widget' && renderWidgetSettings()}
          {activeSection === 'advanced' && renderAdvancedSettings()}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setSettings({})} // Reset to defaults
          className="btn-secondary px-6 py-3 rounded-lg focus-ring"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary px-6 py-3 rounded-lg focus-ring disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default ChatbotSettings;
