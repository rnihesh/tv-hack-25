const Company = require('../models/Company');
const Website = require('../models/Website');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const WEBSITE_GENERATION_COST = 10;

// Generate website with Gemini
const generateWebsite = async (req, res) => {
  try {
    console.log(req);
    const { companyId } = req.body;
    const { requirements } = req.body;

    // const company = await Company.findById(companyId);
    // if (!company) return res.status(404).json({ error: 'Company not found' });

    // if (!company.hasCredits(WEBSITE_GENERATION_COST)) {
    //   return res.status(400).json({
    //     error: 'Insufficient credits',
    //     required: WEBSITE_GENERATION_COST,
    //     current: company.credits.currentCredits
    //   });
    // }

    const dummyCompanyData = {
      companyName: "TechSolutions Inc",
      businessType: "technology",
      businessDescription: "We provide innovative technology solutions for modern businesses",
      targetAudience: "Small to medium businesses looking for digital transformation",
      preferences: {
        colorScheme:  "blue",
        brandStyle:  "modern",
        communicationTone: "professional"
      },
      productServices: [
        { name: "Web Development", description: "Custom website solutions", price: 2999 },
        { name: "Digital Marketing", description: "SEO and social media marketing", price: 1999 },
        { name: "Consulting", description: "Technology consulting services", price: 1499 }
      ]
    };

    const prompt = `
Create a complete, professional website for the following company. Return ONLY the HTML content with embedded CSS and JavaScript - no explanations or markdown formatting.

Company Details:
- Name: ${dummyCompanyData.companyName}
- Business Type: ${dummyCompanyData.businessType}
- Description: ${dummyCompanyData.businessDescription}
- Target Audience: ${dummyCompanyData.targetAudience}
- Color Scheme: ${dummyCompanyData.preferences.colorScheme}
- Brand Style: ${dummyCompanyData.preferences.brandStyle}
- Communication Tone: ${dummyCompanyData.preferences.communicationTone}

Additional Requirements: ${requirements || 'Create a modern, responsive website'}

Services/Products:
${dummyCompanyData.productServices.map(service => `- ${service.name}: ${service.description} ($${service.price})`).join('\n')}

Generate a complete HTML document that includes:
1. Modern, responsive design with CSS Grid/Flexbox
2. Navigation header with company name and menu
3. Hero section with compelling headline and call-to-action
4. About section highlighting the business
5. Services/Products section showcasing offerings
6. Contact section with form
7. Footer with contact information
8. Embedded CSS for styling (${dummyCompanyData.preferences.colorScheme} color scheme, ${dummyCompanyData.preferences.brandStyle} style)
9. Basic JavaScript for interactivity (smooth scrolling, form handling, mobile menu)
10. Mobile-responsive design

Make it professional, modern, and ready to deploy. Use semantic HTML5 and ensure good accessibility.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let htmlContent = response.text();

    htmlContent = htmlContent.replace(/```html\s*|```/g, '').trim();

    // const newWebsite = await Website.create({
    //   company: company._id,
    //   html: htmlContent,
    //   requirements: requirements || '',
    //   createdAt: new Date()
    // });

    // await company.deductCredits(
    //   WEBSITE_GENERATION_COST,
    //   'website_gen',
    //   'Website generation via Gemini AI'
    // );

    // company.usage.websitesGenerated += 1;
    // await company.save();

    res.json({
      success: true,
      htmlContent,
      websiteId: newWebsite._id,
      creditsUsed: WEBSITE_GENERATION_COST,
      remainingCredits: company.credits.currentCredits
    });

  } catch (error) {
    console.error('Website generation failed:', error);
    res.status(500).json({ error: 'Website generation failed' });
  }
};

const getGenerationStatus = async (req, res) => {
  try {
    const { companyId } = req.user;
    const company = await Company.findById(companyId).select('usage credits');
    if (!company) return res.status(404).json({ error: 'Company not found' });

    res.json({
      websitesGenerated: company.usage.websitesGenerated,
      creditsRemaining: company.credits.currentCredits,
      canGenerate: company.hasCredits(WEBSITE_GENERATION_COST),
      costPerGeneration: WEBSITE_GENERATION_COST
    });
  } catch (error) {
    console.error('Failed to get generation status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
};

const getCompanyProfile = async (req, res) => {
  try {
    const { companyId } = req.user;
    const company = await Company.findById(companyId).select(
      'companyName businessType businessDescription targetAudience preferences aiContextProfile'
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });

    res.json({
      success: true,
      profile: {
        companyName: company.companyName,
        businessType: company.businessType,
        businessDescription: company.businessDescription,
        targetAudience: company.targetAudience,
        preferences: company.preferences,
        productServices: company.aiContextProfile?.productServices || []
      }
    });
  } catch (error) {
    console.error('Failed to get company profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const updateWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const { html } = req.body;

    const updated = await Website.findByIdAndUpdate(id, { html }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Website not found' });

    res.json({ success: true, website: updated });
  } catch (error) {
    console.error('Website update failed:', error);
    res.status(500).json({ error: 'Update failed' });
  }
};

const deleteWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Website.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Website not found' });

    res.json({ success: true, message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
};

const deployWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const website = await Website.findById(id);
    if (!website) return res.status(404).json({ error: 'Website not found' });

    // Dummy deployment (replace with Netlify later)
    const fakeUrl = `https://netlify.com/${id}-fake`;

    res.json({
      success: true,
      message: 'Website deployed successfully',
      deploymentUrl: fakeUrl
    });
  } catch (error) {
    console.error('Deployment failed:', error);
    res.status(500).json({ error: 'Deployment failed' });
  }
};

module.exports = {
  generateWebsite,
  getGenerationStatus,
  getCompanyProfile,
  updateWebsite,
  deleteWebsite,
  deployWebsite
};
