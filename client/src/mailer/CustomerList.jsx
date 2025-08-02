import { useState, useEffect } from "react";
import { emailAPI } from "../utils/api";

const CustomerList = ({ emailData, onDataUpdate, onBack, onNext }) => {
  const [emails, setEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState(
    emailData.selectedCustomers || []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEmails, setNewEmails] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await emailAPI.getEmails();
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error("Error fetching emails:", error);
      // Keep empty array if no emails
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter((email) =>
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmailToggle = (email) => {
    setSelectedEmails((prev) => {
      if (prev.includes(email)) {
        return prev.filter((e) => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedEmails((prev) => {
      const isAllSelected = filteredEmails.every((email) =>
        prev.includes(email)
      );
      if (isAllSelected) {
        return prev.filter((email) => !filteredEmails.includes(email));
      } else {
        const newSelected = [...prev];
        filteredEmails.forEach((email) => {
          if (!newSelected.includes(email)) {
            newSelected.push(email);
          }
        });
        return newSelected;
      }
    });
  };

  const handleAddSingleEmail = async () => {
    if (!newEmail.trim()) return;

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(newEmail.trim())) {
      alert("Please enter a valid email address");
      return;
    }

    setIsAdding(true);
    try {
      await emailAPI.addEmails({ emails: [newEmail.trim()] });
      setNewEmail("");
      await fetchEmails(); // Refresh the list
    } catch (error) {
      console.error("Error adding email:", error);
      alert("Error adding email. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddMultipleEmails = async () => {
    if (!newEmails.trim()) return;

    const emailArray = newEmails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e);
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const invalidEmails = emailArray.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      alert(`Invalid emails found: ${invalidEmails.join(", ")}`);
      return;
    }

    setIsAdding(true);
    try {
      await emailAPI.addEmails({ emails: emailArray });
      setNewEmails("");
      await fetchEmails(); // Refresh the list
    } catch (error) {
      console.error("Error adding emails:", error);
      alert("Error adding emails. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      await emailAPI.addEmails(formData, true); // true indicates file upload
      setUploadFile(null);
      await fetchEmails(); // Refresh the list

      // Reset file input
      const fileInput = document.getElementById("csvFile");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    onDataUpdate({ selectedCustomers: selectedEmails });
    onNext();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300 mt-4 font-medium">
              Loading email list...
            </span>
          </div>
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Manage Email Recipients
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select customers to receive your email campaign
        </p>
      </div>

      {/* Add Emails Section */}
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Email Addresses
        </h3>

        {/* Single Email Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add Single Email
          </label>
          <div className="flex gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
            <button
              onClick={handleAddSingleEmail}
              disabled={isAdding || !newEmail.trim()}
              className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* Multiple Emails Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add Multiple Emails (one per line)
          </label>
          <div className="flex gap-3">
            <textarea
              value={newEmails}
              onChange={(e) => setNewEmails(e.target.value)}
              placeholder="Enter multiple emails, one per line..."
              rows={3}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
            />
            <button
              onClick={handleAddMultipleEmails}
              disabled={isAdding || !newEmails.trim()}
              className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isAdding ? "Adding..." : "Add All"}
            </button>
          </div>
        </div>

        {/* CSV File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload CSV File
          </label>
          <div className="flex gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 transition-colors"
            />
            <button
              onClick={handleFileUpload}
              disabled={isUploading || !uploadFile}
              className="bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            CSV should have emails in the first column
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Emails
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          />
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-blue-900 dark:text-blue-100">
              {selectedEmails.length} of {filteredEmails.length} emails selected
            </span>
            {searchTerm && (
              <span className="ml-2 text-blue-700 dark:text-blue-300">
                (filtered by search)
              </span>
            )}
          </div>

          <button
            onClick={handleSelectAll}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium transition-colors"
          >
            {filteredEmails.every((email) => selectedEmails.includes(email))
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6 shadow-sm">
        <div className="max-h-96 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {emails.length === 0 ? (
                <div>
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  <p className="mb-2 font-medium">
                    No emails in your list yet.
                  </p>
                  <p className="text-sm">
                    Add some emails using the form above to get started!
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <p className="font-medium">
                    No emails found matching your search.
                  </p>
                </div>
              )}
            </div>
          ) : (
            filteredEmails.map((email, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedEmails.includes(email)
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email)}
                    onChange={() => handleEmailToggle(email)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Estimated Reach */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {selectedEmails.length}
          </div>
          <div className="text-sm text-green-800 dark:text-green-300">
            Recipients
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ~{Math.round(selectedEmails.length * 0.25)}
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            Expected Opens
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ~{Math.round(selectedEmails.length * 0.05)}
          </div>
          <div className="text-sm text-purple-800 dark:text-purple-300">
            Expected Clicks
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          ← Back to Preview
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step 3 of 4
          </div>

          <button
            onClick={handleNext}
            disabled={selectedEmails.length === 0}
            className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Continue to Send →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
