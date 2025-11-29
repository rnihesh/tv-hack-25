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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AppNavigation />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Email Marketing Campaign
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Create and send personalized emails with AI-powered content
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                2 credits per email
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Step Navigation */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepChange(step.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 whitespace-nowrap ${
                    currentStep === step.id
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="font-medium">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="mx-3 sm:mx-4 h-px bg-gray-300 dark:bg-gray-600 w-6 sm:w-8 flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-colors duration-300">
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
    // </div>
  );
};

export default MailingDashboard;
