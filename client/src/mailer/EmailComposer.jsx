import { useState } from "react";
import { emailAPI } from "../utils/api";

const EmailComposer = ({
  emailData,
  onDataUpdate,
  onNext,
  isLoading,
  setIsLoading,
}) => {
  const [description, setDescription] = useState(emailData.description || "");
  const [subject, setSubject] = useState(emailData.subject || "");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!description.trim()) {
      newErrors.description =
        "Please provide a description of what you want to send";
    }

    if (!subject.trim()) {
      newErrors.subject = "Email subject is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnhanceMessage = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await emailAPI.enhanceMessage({
        description: description,
        subject: subject,
      });

      // Handle the API response structure from /email/enhance
      let enhancedMessage = description; // fallback
      let enhancedSubject = subject; // fallback

      if (response.success && response.data) {
        enhancedMessage = response.data.enhancedMessage || description;
        enhancedSubject = response.data.subject || subject;
      }

      onDataUpdate({
        description,
        subject: enhancedSubject,
        enhancedMessage,
      });

      onNext();
    } catch (error) {
      console.error("Error enhancing message:", error);

      // Fallback: use original description if enhancement fails
      const fallbackMessage = description;

      onDataUpdate({
        description,
        subject,
        enhancedMessage: fallbackMessage,
      });

      setErrors({
        general:
          "AI enhancement failed, but you can still proceed with your original content.",
      });

      // Still proceed to next step after showing warning
      setTimeout(() => {
        setErrors({});
        onNext();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewWithoutEnhancing = () => {
    if (!validateForm()) return;

    onDataUpdate({
      description,
      subject,
      enhancedMessage: description, // Use original description as fallback
    });

    onNext();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Compose Your Email
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Describe your message and let AI create a professional email for you
        </p>
      </div>

      {errors.general && (
        <div
          className={`border px-4 py-3 rounded-lg mb-6 ${
            errors.general.includes("failed")
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
          }`}
        >
          {errors.general}
        </div>
      )}

      <div className="space-y-6">
        {/* Email Subject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Subject *
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
              errors.subject
                ? "border-red-300 dark:border-red-600"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.subject}
            </p>
          )}
        </div>

        {/* Email Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            What would you like to send to your customers? *
          </label>
          <textarea
            id="description"
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want to communicate to your customers. For example: 'I want to announce our new product launch with a 20% discount for existing customers. Include details about the product features and how they can claim the discount.'"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
              errors.description
                ? "border-red-300 dark:border-red-600"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Be as detailed as possible. Our AI will create a professional,
            engaging email based on your description.
          </p>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Tips for better results:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • Include the purpose of your email (promotion, announcement,
              newsletter, etc.)
            </li>
            <li>
              • Mention any specific offers, discounts, or calls to action
            </li>
            <li>
              • Specify the tone you want (professional, friendly, urgent, etc.)
            </li>
            <li>• Include any important details or deadlines</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={handleEnhanceMessage}
              disabled={isLoading}
              className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <span>🎨</span>
                  <span>Enhance with AI</span>
                </>
              )}
            </button>

            <button
              onClick={handlePreviewWithoutEnhancing}
              disabled={isLoading}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Skip Enhancement
            </button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step 1 of 4
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;
