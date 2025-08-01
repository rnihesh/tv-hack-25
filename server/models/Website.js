const mongoose = require("mongoose");

const WebsiteTemplateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      
    },
    templateName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    industry: {
      type: String,
      required: true,
      enum: [
        "restaurant",
        "retail",
        "service",
        "healthcare",
        "education",
        "technology",
        "consulting",
        "manufacturing",
        "real_estate",
        "other",
      ],
    },
    structure: {
      header: {
        logo: String,
        navigation: [
          {
            label: String,
            url: String,
            order: Number,
          },
        ],
        ctaButton: {
          text: String,
          url: String,
          style: String,
        },
      },
      sections: [
        {
          type: {
            type: String,
            enum: [
              "hero",
              "about",
              "services",
              "products",
              "testimonials",
              "contact",
              "gallery",
              "pricing",
              "team",
              "blog",
              "faq",
            ],
          },
          title: String,
          content: String,
          images: [String],
          order: Number,
          visible: {
            type: Boolean,
            default: true,
          },
          customData: mongoose.Schema.Types.Mixed,
        },
      ],
      footer: {
        companyInfo: String,
        socialLinks: [
          {
            platform: String,
            url: String,
          },
        ],
        contactInfo: {
          phone: String,
          email: String,
          address: String,
        },
        links: [
          {
            label: String,
            url: String,
          },
        ],
      },
      styling: {
        colorScheme: {
          primary: String,
          secondary: String,
          accent: String,
          background: String,
          text: String,
        },
        fonts: {
          heading: String,
          body: String,
        },
        layout: {
          type: String,
          enum: ["grid", "linear", "masonry"],
          default: "linear",
        },
        customCSS: String,
      },
    },
    aiGenerated: {
      type: Boolean,
      default: true,
    },
    customizations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedUrl: {
      type: String,
      unique: true,
      sparse: true,
    },
    seoData: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String,
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      uniqueVisitors: {
        type: Number,
        default: 0,
      },
      bounceRate: {
        type: Number,
        default: 0,
      },
      lastAnalyticsUpdate: Date,
    },
    generationPrompt: {
      type: String,
      maxlength: 2000,
    },
    aiModel: {
      type: String,
      enum: ["gemini-2.5-flash", "ollama-llama3", "custom"],
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: "website_templates",
  }
);

// Indexes
WebsiteTemplateSchema.index({ companyId: 1 });
WebsiteTemplateSchema.index({ industry: 1 });
WebsiteTemplateSchema.index({ isPublished: 1 });

// Pre-save middleware to generate published URL
WebsiteTemplateSchema.pre("save", function (next) {
  if (this.isPublished && !this.publishedUrl) {
    const slug = this.templateName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    this.publishedUrl = `${slug}-${this._id.toString().slice(-6)}`;
  }
  next();
});

// Methods
WebsiteTemplateSchema.methods.incrementViews = function () {
  this.analytics.views += 1;
  this.analytics.lastAnalyticsUpdate = new Date();
};

WebsiteTemplateSchema.methods.publish = function () {
  this.isPublished = true;
  if (!this.publishedUrl) {
    const slug = this.templateName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    this.publishedUrl = `${slug}-${this._id.toString().slice(-6)}`;
  }
};

WebsiteTemplateSchema.methods.unpublish = function () {
  this.isPublished = false;
};

module.exports = mongoose.model("WebsiteTemplate", WebsiteTemplateSchema);
