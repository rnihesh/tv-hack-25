import { useState } from "react";
import EmailComposer from "./EmailComposer";
import EmailPreview from "./EmailPreview";
import CustomerList from "./CustomerList";
import SendConfirmation from "./SendConfirmation";

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
    <div className="min-h-screen bg-theme-primary p-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="card p-6 mb-6">
          <h1 className="text-3xl heading-primary text-theme-primary mb-2">
            Email Marketing Campaign
          </h1>
          <p className="text-theme-secondary">
            Create and send personalized emails to your customers with
            AI-powered content generation
          </p>
        </div>

        {/* Step Navigation */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepChange(step.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 focus-ring ${
                    currentStep === step.id ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="font-medium">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="mx-4 h-px bg-border-theme w-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="card-elevated transition-colors duration-200">
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
  );
};

export default MailingDashboard;
