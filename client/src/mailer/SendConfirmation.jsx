import { useState } from "react";
import { emailAPI } from "../utils/api";

const SendConfirmation = ({ emailData, onBack, onSent }) => {
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success' | 'error' | null
  const [sendResults, setSendResults] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sendOption, setSendOption] = useState("now"); // 'now' | 'schedule'

  const selectedEmailsCount = emailData.selectedCustomers.length;

  const handleSendNow = async () => {
    setIsSending(true);
    setSendStatus(null);

    try {
      const response = await emailAPI.sendEmail({
        subject: emailData.subject,
        message: emailData.enhancedMessage,
        recipients: emailData.selectedCustomers,
        sendImmediately: true,
      });

      setSendResults(response);
      setSendStatus("success");

      // Auto-redirect after success
      setTimeout(() => {
        onSent();
      }, 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      setSendStatus("error");
      setSendResults({
        error:
          error.response?.data?.message ||
          "Failed to send emails. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleSend = async () => {
    if (!scheduleDate || !scheduleTime) {
      alert("Please select both date and time for scheduling.");
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

      const response = await emailAPI.scheduleEmail({
        subject: emailData.subject,
        message: emailData.enhancedMessage,
        recipients: emailData.selectedCustomers,
        scheduledFor: scheduledDateTime.toISOString(),
      });

      setSendResults(response);
      setSendStatus("success");

      // Auto-redirect after success
      setTimeout(() => {
        onSent();
      }, 3000);
    } catch (error) {
      console.error("Error scheduling email:", error);
      setSendStatus("error");
      setSendResults({
        error:
          error.response?.data?.message ||
          "Failed to schedule emails. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    if (sendOption === "now") {
      handleSendNow();
    } else {
      handleScheduleSend();
    }
  };

  // Success state
  if (sendStatus === "success") {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {sendOption === "now"
              ? "Emails Sent Successfully!"
              : "Emails Scheduled Successfully!"}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {sendOption === "now"
              ? `Your email has been sent to ${selectedEmailsCount} recipients.`
              : `Your email has been scheduled for ${new Date(
                  `${scheduleDate}T${scheduleTime}`
                ).toLocaleString()}.`}
          </p>

          {sendResults && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                Send Results
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-800 dark:text-green-300">
                    Total Sent:
                  </span>
                  <span className="ml-2 text-green-900 dark:text-green-200 font-medium">
                    {sendResults.sent || selectedEmailsCount}
                  </span>
                </div>
                <div>
                  <span className="text-green-800 dark:text-green-300">
                    Delivery Rate:
                  </span>
                  <span className="ml-2 text-green-900 dark:text-green-200 font-medium">
                    {Math.round(
                      ((sendResults.sent || selectedEmailsCount) /
                        selectedEmailsCount) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onSent}
            className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create New Campaign
          </button>
        </div>
      </div>
    );
  }

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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Send Your Email Campaign
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Review and send your campaign to selected recipients
        </p>
      </div>

      {/* Campaign Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Campaign Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Subject:
            </span>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              {emailData.subject}
            </p>
          </div>

          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Recipients:
            </span>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              {selectedEmailsCount} emails
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Message Preview:
            </span>
            <p className="font-medium text-gray-900 dark:text-white mt-1 truncate">
              {emailData.enhancedMessage.substring(0, 100)}...
            </p>
          </div>
        </div>
      </div>

      {/* Send Options */}
      <div className="space-y-6 mb-8">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Send Options
        </h3>

        <div className="space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <input
              type="radio"
              value="now"
              checked={sendOption === "now"}
              onChange={(e) => setSendOption(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Send Now
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Emails will be sent immediately to all recipients
              </span>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <input
              type="radio"
              value="schedule"
              checked={sendOption === "schedule"}
              onChange={(e) => setSendOption(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Schedule for Later
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Choose when to send your campaign
              </span>
            </div>
          </label>
        </div>

        {/* Schedule Options */}
        {sendOption === "schedule" && (
          <div className="ml-7 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {sendStatus === "error" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
          <h3 className="font-medium mb-1">Failed to Send Email</h3>
          <p className="text-sm">{sendResults?.error}</p>
        </div>
      )}

      {/* Estimated Delivery */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Estimated Performance
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(selectedEmailsCount * 0.95)}
            </div>
            <div className="text-blue-800 dark:text-blue-300">Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(selectedEmailsCount * 0.25)}
            </div>
            <div className="text-blue-800 dark:text-blue-300">Opened</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(selectedEmailsCount * 0.05)}
            </div>
            <div className="text-blue-800 dark:text-blue-300">Clicked</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          disabled={isSending}
          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          ← Back to Recipients
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step 4 of 4
          </div>

          <button
            onClick={handleSend}
            disabled={
              isSending ||
              (sendOption === "schedule" && (!scheduleDate || !scheduleTime))
            }
            className="bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isSending ? (
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
                <span>
                  {sendOption === "now" ? "Sending..." : "Scheduling..."}
                </span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>
                  {sendOption === "now" ? "Send Now" : "Schedule Email"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendConfirmation;
