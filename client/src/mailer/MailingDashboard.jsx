import { useState } from "react";
import EmailComposer from "./EmailComposer";
import EmailPreview from "./EmailPreview";
import CustomerList from "./CustomerList";
import SendConfirmation from "./SendConfirmation";
import AppNavigation from "../components/AppNavigation";
import { Eye, Mail, Pencil, Send, Users, Zap } from "lucide-react";

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
    { id: "compose", label: "Compose", icon: Pencil },
    { id: "preview", label: "Preview", icon: Eye },
    { id: "customers", label: "Recipients", icon: Users },
    { id: "send", label: "Send", icon: Send },
  ];

  const handleStepChange = (stepId) => {
    setCurrentStep(stepId);
  };

  const handleEmailDataUpdate = (newData) => {
    setEmailData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 enterprise-shell transition-colors duration-300">
      <AppNavigation />

      {/* Page Header */}
      <div className="glass-surface border-x-0 border-t-0 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-400/25 dark:to-indigo-400/20 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                <Mail className="w-6 h-6 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Email Marketing Campaign
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Create and send personalized emails with AI-powered content
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 gradient-panel rounded-lg">
              <Zap className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                2 credits per email
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Step Navigation */}
        <div className="glass-surface rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepChange(step.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 whitespace-nowrap ${
                    currentStep === step.id
                      ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <step.icon className="w-4 h-4" />
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
        <div className="glass-surface rounded-xl transition-colors duration-300">
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
