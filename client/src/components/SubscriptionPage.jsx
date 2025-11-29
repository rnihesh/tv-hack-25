import React, { useState, useEffect } from "react";
import { subscriptionAPI } from "../utils/subscriptionApi";
import { authAPI } from "../utils/api";
import AppNavigation from "./AppNavigation";

const SubscriptionPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("packages");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load packages and user data
      const [packagesRes, creditsRes] = await Promise.all([
        subscriptionAPI.getCreditPackages(),
        authAPI.getCredits(),
      ]);

      if (packagesRes.success) {
        setPackages(packagesRes.data);
      }

      if (creditsRes.success) {
        setCurrentCredits(creditsRes.data.currentCredits);
      }

      // Load payment history and analytics if on those tabs
      if (activeTab === "history") {
        const historyRes = await subscriptionAPI.getPaymentHistory();
        if (historyRes.success) {
          setPaymentHistory(historyRes.data.payments);
        }
      }

      if (activeTab === "analytics") {
        const analyticsRes = await subscriptionAPI.getAnalytics();
        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    try {
      setLoading(true);

      // Create Razorpay order
      const orderResponse = await subscriptionAPI.createOrder(packageId);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      const { orderId, amount, currency, razorpayKeyId } = orderResponse.data;

      // Initialize Razorpay checkout
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: "Phoenix AI Toolkit",
        description: `Purchase ${orderResponse.data.package.displayName}`,
        image: "/logo.png", // Add your logo here
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await subscriptionAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              alert(
                `Payment successful! ${verifyResponse.data.creditsAdded} credits added to your account.`
              );
              setCurrentCredits(verifyResponse.data.currentCredits);
              loadData(); // Reload data
            } else {
              throw new Error(verifyResponse.message);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "User Name", // You can get this from user context
          email: "user@example.com", // You can get this from user context
        },
        notes: {
          address: "Phoenix AI Toolkit",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout form closed");
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to initiate purchase. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <AppNavigation />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Subscription & Credits
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Buy AI credits to power your business tools
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
              <span className="text-amber-600 dark:text-amber-400">✨</span>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Current Credits:{" "}
                <span className="text-lg font-bold">{currentCredits}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {["packages", "history", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  loadData();
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab === "packages" && "📦 Credit Packages"}
                {tab === "history" && "📜 Payment History"}
                {tab === "analytics" && "📊 Analytics"}
              </button>
            ))}
          </div>
        </div>

        {/* Credit Packages Tab */}
        {activeTab === "packages" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 sm:p-8 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl ${
                  pkg.isPopular
                    ? "ring-2 ring-amber-500 dark:ring-amber-400"
                    : ""
                }`}
              >
                {pkg.isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pkg.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {pkg.description}
                  </p>

                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(pkg.price)}
                    </span>
                  </div>

                  <div className="mt-6 space-y-2">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {pkg.credits} Credits + {pkg.bonusCredits} Bonus
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total: {pkg.credits + pkg.bonusCredits} Credits
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg
                          className="h-5 w-5 text-green-500 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading}
                    className={`mt-8 w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                      pkg.isPopular
                        ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                        : "bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? "Processing..." : "Purchase Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === "history" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Payment History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paymentHistory.map((payment) => (
                    <tr
                      key={payment._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {payment.metadata?.packageId || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {formatCurrency(payment.amount * 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {payment.metadata?.creditsAdded || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === "succeeded"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Total Spent
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {formatCurrency(analytics.totalSpent * 100)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Current Credits
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {analytics.currentCredits}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Credits Used
              </h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {analytics.totalCreditsUsed}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Efficiency
              </h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {analytics.currentCredits > 0
                  ? Math.round(
                      (analytics.totalCreditsUsed /
                        (analytics.totalCreditsUsed +
                          analytics.currentCredits)) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
              <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
                Processing...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
