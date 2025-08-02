import { useState } from "react";
import EmailComposer from "./EmailComposer";
import EmailPreview from "./EmailPreview";
import CustomerList from "./CustomerList";
import SendConfirmation from "./SendConfirmation";
import AppNavigation from "../components/AppNavigation";

const MailingDashboard = () => {
  const [currentStep, setCurrentStep] = useState("compose");
  const [emailData, setEmailData] = useState({
    description: "",
    enhancedMessage: "",
    subject: "",
    selectedCustomers: [], // Keep same name for compatibility with existing components
  });
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { id: "compose", label: "Compose", icon: "✏️" },
    { id: "preview", label: "Preview", icon: "👁️" },
    { id: "customers", label: "Recipients", icon: "�" },
    { id: "send", label: "Send", icon: "🚀" },
  ];

  const handleStepChange = (stepId) => {
    setCurrentStep(stepId);
  };

  const handleEmailDataUpdate = (newData) => {
    setEmailData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <AppNavigation />
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 mb-6 shadow-sm">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Email Marketing Campaign
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Create and send personalized emails to your customers with
                AI-powered content generation
              </p>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepChange(step.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      currentStep === step.id
                        ? "bg-blue-600 dark:bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span className="text-lg">{step.icon}</span>
                    <span className="font-medium">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="mx-4 h-px bg-gray-300 dark:bg-gray-600 w-8"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors duration-200">
            {currentStep === "compose" && (
              <EmailComposer
                emailData={emailData}
                onDataUpdate={handleEmailDataUpdate}
                onNext={() => handleStepChange("preview")}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}

            {currentStep === "preview" && (
              <EmailPreview
                emailData={emailData}
                onBack={() => handleStepChange("compose")}
                onNext={() => handleStepChange("customers")}
                onEdit={() => handleStepChange("compose")}
              />
            )}

            {currentStep === "customers" && (
              <CustomerList
                emailData={emailData}
                onDataUpdate={handleEmailDataUpdate}
                onBack={() => handleStepChange("preview")}
                onNext={() => handleStepChange("send")}
              />
            )}

            {currentStep === "send" && (
              <SendConfirmation
                emailData={emailData}
                onBack={() => handleStepChange("customers")}
                onSent={() => {
                  // Reset to compose for new campaign
                  setCurrentStep("compose");
                  setEmailData({
                    description: "",
                    enhancedMessage: "",
                    subject: "",
                    selectedCustomers: [],
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailingDashboard;
