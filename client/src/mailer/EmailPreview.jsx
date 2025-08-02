import { useState } from "react";

const EmailPreview = ({ emailData, onBack, onNext, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Debug logging
  console.log("EmailPreview received emailData:", emailData);

  // Safety check for emailData
  if (!emailData) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No email data available. Please go back and compose your email
            first.
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Compose
          </button>
        </div>
      </div>
    );
  }

  const formatEmailContent = (content) => {
    // Handle undefined, null, or empty content
    if (!content) {
      return (
        <p className="text-gray-500 dark:text-gray-400 italic">
          No content available
        </p>
      );
    }

    // Ensure content is a string
    const stringContent =
      typeof content === "string" ? content : String(content);

    // Simple formatting for better display
    return stringContent.split("\n").map((line, index) => (
      <p key={index} className={line.trim() === "" ? "mb-4" : "mb-2"}>
        {line}
      </p>
    ));
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
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Preview Your Email
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Review your email before selecting recipients
        </p>
      </div>

      {/* Email Preview Container */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
          {/* Email Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {JSON.parse(localStorage.getItem("userData"))
                    ?.company?.companyName?.charAt(0)
                    ?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {
                      JSON.parse(localStorage.getItem("userData"))?.company
                        ?.companyName
                    }
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {
                      JSON.parse(localStorage.getItem("userData"))?.company
                        ?.email
                    }
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString()}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {emailData.subject || "No Subject"}
            </h3>
          </div>

          {/* Email Body */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none text-gray-900 dark:text-gray-100">
              {formatEmailContent(
                emailData.enhancedMessage || emailData.description
              )}
            </div>
          </div>

          {/* Email Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You're receiving this email because you're a valued customer of
              Your Company.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <a
                href="#"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Unsubscribe
              </a>{" "}
              |
              <a
                href="#"
                className="text-blue-600 dark:text-blue-400 hover:underline ml-2"
              >
                Update Preferences
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Original Description (Expandable) */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left transition-colors"
        >
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            Original Description
          </h3>
          <span className="text-blue-600 dark:text-blue-400">
            {isExpanded ? "▼" : "▶"}
          </span>
        </button>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200 text-sm whitespace-pre-wrap">
              {emailData.description || "No description provided"}
            </p>
          </div>
        )}
      </div>

      {/* Email Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ~250
          </div>
          <div className="text-sm text-green-800 dark:text-green-300">
            Estimated Words
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ~30s
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            Read Time
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            Mobile
          </div>
          <div className="text-sm text-purple-800 dark:text-purple-300">
            Optimized
          </div>
        </div>
      </div>

      {/* Content Analysis */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
        <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          📊 Content Analysis
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-yellow-800 dark:text-yellow-300">Tone:</span>
            <span className="ml-2 text-yellow-900 dark:text-yellow-200 font-medium">
              Professional & Friendly
            </span>
          </div>
          <div>
            <span className="text-yellow-800 dark:text-yellow-300">
              Call to Action:
            </span>
            <span className="ml-2 text-yellow-900 dark:text-yellow-200 font-medium">
              Present
            </span>
          </div>
          <div>
            <span className="text-yellow-800 dark:text-yellow-300">
              Personalization:
            </span>
            <span className="ml-2 text-yellow-900 dark:text-yellow-200 font-medium">
              High
            </span>
          </div>
          <div>
            <span className="text-yellow-800 dark:text-yellow-300">
              Spam Score:
            </span>
            <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
              Low ✓
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ← Back to Edit
          </button>

          <button
            onClick={onEdit}
            className="bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ✏️ Make Changes
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step 2 of 4
          </div>

          <button
            onClick={onNext}
            className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Select Recipients →
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
