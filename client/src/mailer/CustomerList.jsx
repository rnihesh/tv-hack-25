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
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading email list...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Manage Email Recipients
      </h2>

      {/* Add Emails Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-4">Add Email Addresses</h3>

        {/* Single Email Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Single Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAddSingleEmail}
              disabled={isAdding || !newEmail.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* Multiple Emails Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Multiple Emails (one per line)
          </label>
          <div className="flex gap-2">
            <textarea
              value={newEmails}
              onChange={(e) => setNewEmails(e.target.value)}
              placeholder="Enter multiple emails, one per line..."
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <button
              onClick={handleAddMultipleEmails}
              disabled={isAdding || !newEmails.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isAdding ? "Adding..." : "Add All"}
            </button>
          </div>
        </div>

        {/* CSV File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File
          </label>
          <div className="flex gap-2">
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleFileUpload}
              disabled={isUploading || !uploadFile}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            CSV should have emails in the first column
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search emails..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-blue-900">
              {selectedEmails.length} of {filteredEmails.length} emails selected
            </span>
            {searchTerm && (
              <span className="ml-2 text-blue-700">(filtered by search)</span>
            )}
          </div>

          <button
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {filteredEmails.every((email) => selectedEmails.includes(email))
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="max-h-96 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {emails.length === 0 ? (
                <div>
                  <p className="mb-2">No emails in your list yet.</p>
                  <p className="text-sm">
                    Add some emails using the form above to get started!
                  </p>
                </div>
              ) : (
                "No emails found matching your search."
              )}
            </div>
          ) : (
            filteredEmails.map((email, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedEmails.includes(email) ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email)}
                    onChange={() => handleEmailToggle(email)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{email}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Estimated Reach */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {selectedEmails.length}
          </div>
          <div className="text-sm text-green-800">Recipients</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            ~{Math.round(selectedEmails.length * 0.25)}
          </div>
          <div className="text-sm text-blue-800">Expected Opens</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            ~{Math.round(selectedEmails.length * 0.05)}
          </div>
          <div className="text-sm text-purple-800">Expected Clicks</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          ← Back to Preview
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">Step 3 of 4</div>

          <button
            onClick={handleNext}
            disabled={selectedEmails.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Continue to Send →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
