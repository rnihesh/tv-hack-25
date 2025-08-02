import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const businessTypes = [
  {
    value: "restaurant",
    label: "Restaurant",
    icon: "🍽️",
    desc: "Food & Dining",
  },
  {
    value: "retail",
    label: "Retail Store",
    icon: "🛍️",
    desc: "Shopping & Commerce",
  },
  {
    value: "service",
    label: "Service Business",
    icon: "🔧",
    desc: "Professional Services",
  },
  {
    value: "consulting",
    label: "Consulting",
    icon: "💼",
    desc: "Business Advisory",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    icon: "🏥",
    desc: "Medical & Wellness",
  },
  {
    value: "education",
    label: "Education",
    icon: "🎓",
    desc: "Learning & Training",
  },
  {
    value: "technology",
    label: "Technology",
    icon: "💻",
    desc: "Tech & Software",
  },
  {
    value: "manufacturing",
    label: "Manufacturing",
    icon: "🏭",
    desc: "Production & Industry",
  },
  {
    value: "real_estate",
    label: "Real Estate",
    icon: "🏠",
    desc: "Property & Investment",
  },
  {
    value: "finance",
    label: "Finance",
    icon: "💰",
    desc: "Banking & Investment",
  },
  {
    value: "marketing",
    label: "Marketing",
    icon: "📢",
    desc: "Advertising & Promotion",
  },
  { value: "other", label: "Other", icon: "📋", desc: "Other Industry" },
];

const companySizes = [
  { value: "solo", label: "Solo Entrepreneur", desc: "Just me", range: "1" },
  {
    value: "small",
    label: "Small Team",
    desc: "2-10 employees",
    range: "2-10",
  },
  {
    value: "medium",
    label: "Medium Business",
    desc: "11-50 employees",
    range: "11-50",
  },
  {
    value: "large",
    label: "Large Company",
    desc: "50+ employees",
    range: "50+",
  },
];

const experienceLevels = [
  { value: "beginner", label: "Beginner", desc: "New to digital marketing" },
  { value: "intermediate", label: "Intermediate", desc: "Some experience" },
  { value: "advanced", label: "Advanced", desc: "Very experienced" },
  { value: "expert", label: "Expert", desc: "Digital marketing professional" },
];

const brandStyles = [
  {
    value: "modern",
    label: "Modern",
    description: "Clean, contemporary design",
  },
  {
    value: "classic",
    label: "Classic",
    description: "Timeless, traditional style",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Simple, uncluttered look",
  },
  { value: "bold", label: "Bold", description: "Eye-catching, vibrant design" },
  {
    value: "elegant",
    label: "Elegant",
    description: "Sophisticated, refined style",
  },
  { value: "playful", label: "Playful", description: "Fun, creative approach" },
];

const communicationTones = [
  {
    value: "professional",
    label: "Professional",
    description: "Formal and business-like",
    icon: "💼",
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and approachable",
    icon: "😊",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Relaxed and informal",
    icon: "👋",
  },
  {
    value: "conversational",
    label: "Conversational",
    description: "Natural and engaging",
    icon: "💬",
  },
  {
    value: "formal",
    label: "Formal",
    description: "Structured and official",
    icon: "🎩",
  },
  {
    value: "enthusiastic",
    label: "Enthusiastic",
    description: "Energetic and excited",
    icon: "🚀",
  },
];

const marketingGoals = [
  {
    value: "brand_awareness",
    label: "Brand Awareness",
    icon: "📢",
    desc: "Get known in your market",
  },
  {
    value: "lead_generation",
    label: "Lead Generation",
    icon: "🎯",
    desc: "Attract potential customers",
  },
  {
    value: "customer_retention",
    label: "Customer Retention",
    icon: "💝",
    desc: "Keep existing customers happy",
  },
  {
    value: "sales_conversion",
    label: "Sales Conversion",
    icon: "💰",
    desc: "Turn leads into sales",
  },
  {
    value: "engagement",
    label: "Engagement",
    icon: "👥",
    desc: "Build community around your brand",
  },
  {
    value: "reach",
    label: "Reach",
    icon: "🌐",
    desc: "Expand your market presence",
  },
];

const Register = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Account Setup
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Step 2 - Basic Business Info
    businessType: "",
    companySize: "",
    industry: "",
    businessDescription: "",

    // Step 3 - Target Audience & Goals
    targetAudience: "",
    marketingExperience: "",
    primaryGoals: [],

    // Step 4 - Brand Preferences
    preferences: {
      colorScheme: "purple",
      brandStyle: "modern",
      communicationTone: "professional",
      marketingGoals: [],
      contentStyle: "informative",
    },
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("preferences.")) {
      const prefKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleMarketingGoalToggle = (goal) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        marketingGoals: prev.preferences.marketingGoals.includes(goal)
          ? prev.preferences.marketingGoals.filter((g) => g !== goal)
          : [...prev.preferences.marketingGoals, goal],
      },
    }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (currentStep === 2) {
      if (!formData.businessType) {
        newErrors.businessType = "Please select your business type";
      }

      if (!formData.companySize) {
        newErrors.companySize = "Please select your company size";
      }

      if (!formData.businessDescription.trim()) {
        newErrors.businessDescription = "Business description is required";
      }
    }

    if (currentStep === 3) {
      if (!formData.targetAudience.trim()) {
        newErrors.targetAudience = "Target audience description is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(step)) {
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        businessType: formData.businessType,
        businessDescription: formData.businessDescription,
        targetAudience: formData.targetAudience,
        preferences: formData.preferences,
      };

      const result = await register(registrationData);

      if (!result.success) {
        setErrors({ general: result.message || "Registration failed" });
      }
      // If successful, the AuthContext will handle the redirect
    } catch (error) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚀</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Your Account
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Start your AI-powered journey today
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="companyName"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Company Name *
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.companyName
                ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/20"
            } focus:outline-none focus:ring-2`}
            placeholder="Enter your company name"
          />
          {errors.companyName && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.companyName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Email Address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.email
                ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/20"
            } focus:outline-none focus:ring-2`}
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
            >
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.password
                  ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20"
                  : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/20"
              } focus:outline-none focus:ring-2`}
              placeholder="Create a password"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
            >
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.confirmPassword
                  ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20"
                  : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/20"
              } focus:outline-none focus:ring-2`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏢</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          About Your Business
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Help us understand your business better
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            What type of business do you run? *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {businessTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, businessType: type.value }))
                }
                className={`p-4 border rounded-lg text-left hover:shadow-sm transition-all duration-200 ${
                  formData.businessType === type.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {type.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {type.desc}
                </div>
              </button>
            ))}
          </div>
          {errors.businessType && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.businessType}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Company Size *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {companySizes.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, companySize: size.value }))
                }
                className={`p-4 border rounded-lg text-center hover:shadow-sm transition-all duration-200 ${
                  formData.companySize === size.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {size.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {size.desc}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                  {size.range}
                </div>
              </button>
            ))}
          </div>
          {errors.companySize && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.companySize}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="businessDescription"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Describe your business *
          </label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            rows={4}
            value={formData.businessDescription}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.businessDescription
                ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/20"
            } focus:outline-none focus:ring-2`}
            placeholder="What products or services do you offer? What makes your business unique?"
          />
          {errors.businessDescription && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.businessDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 dark:bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Target Audience & Goals
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Who are you trying to reach and what do you want to achieve?
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <label
            htmlFor="targetAudience"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Who is your target audience? *
          </label>
          <textarea
            id="targetAudience"
            name="targetAudience"
            rows={4}
            value={formData.targetAudience}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.targetAudience
                ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/20"
            } focus:outline-none focus:ring-2`}
            placeholder="Describe your ideal customers (age, interests, demographics, pain points, etc.)"
          />
          {errors.targetAudience && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.targetAudience}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Your Marketing Experience Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {experienceLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    marketingExperience: level.value,
                  }))
                }
                className={`p-4 border rounded-xl text-center hover:shadow-lg transition-all duration-300 ${
                  formData.marketingExperience === level.value
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-lg"
                    : "border-gray-300 dark:border-gray-600 hover:border-violet-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {level.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {level.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Primary Marketing Goals (select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {marketingGoals.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    primaryGoals: prev.primaryGoals.includes(goal.value)
                      ? prev.primaryGoals.filter((g) => g !== goal.value)
                      : [...prev.primaryGoals, goal.value],
                  }));
                }}
                className={`p-4 border rounded-lg text-left hover:shadow-sm transition-all duration-200 ${
                  formData.primaryGoals.includes(goal.value)
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm"
                    : "border-gray-300 dark:border-gray-600 hover:border-green-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="text-2xl mb-2">{goal.icon}</div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {goal.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {goal.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎨</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Brand Preferences
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Customize your AI's output to match your brand
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Brand Style
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brandStyles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      brandStyle: style.value,
                    },
                  }))
                }
                className={`p-4 border rounded-lg text-left hover:shadow-sm transition-all duration-200 ${
                  formData.preferences.brandStyle === style.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {style.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {style.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Communication Tone
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {communicationTones.map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      communicationTone: tone.value,
                    },
                  }))
                }
                className={`p-4 border rounded-lg text-center hover:shadow-sm transition-all duration-200 ${
                  formData.preferences.communicationTone === tone.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="text-2xl mb-2">{tone.icon}</div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {tone.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {tone.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {[
        {
          num: 1,
          label: "Account",
          icon: "🚀",
        },
        {
          num: 2,
          label: "Business",
          icon: "🏢",
        },
        {
          num: 3,
          label: "Goals",
          icon: "🎯",
        },
        {
          num: 4,
          label: "Brand",
          icon: "🎨",
        },
      ].map((stepInfo, index) => (
        <div key={stepInfo.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= stepInfo.num
                  ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {step > stepInfo.num ? "✓" : stepInfo.icon}
            </div>
            <div
              className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                step >= stepInfo.num
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {stepInfo.label}
            </div>
          </div>
          {index < 3 && (
            <div
              className={`w-16 h-1 mx-4 rounded-full transition-all duration-300 ${
                step > stepInfo.num
                  ? "bg-blue-600 dark:bg-blue-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-2xl w-full mx-auto">
        {renderStepIndicator()}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 transition-all duration-300">
          <form
            onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {errors.general && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
                {errors.general}
              </div>
            )}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Next Step
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
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
                      Creating Account...
                    </>
                  ) : (
                    <>🎉 Create Account & Get 10 Free Credits!</>
                  )}
                </button>
              )}
            </div>

            {step === 1 && (
              <div className="text-center mt-6">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                  >
                    Sign in here
                  </button>
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
