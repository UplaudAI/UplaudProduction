import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  const canonicalUrl = "https://www.uplaud.ai/privacy-policy";

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Uplaud Privacy Policy</title>
        <meta
          name="description"
          content="Learn how Uplaud collects, uses, and protects WhatsApp-based reviews, referrals, and customer data."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Effective Date: 01/01/2025</p>

          <p className="text-gray-700 mb-6">
            Uplaud ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how
            we collect, use, and share information when you use our website, WhatsApp integrations, and related services (the
            "Services").
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>
              <strong>Information You Provide:</strong> When you interact with Uplaud (e.g., signing up, onboarding your business), we
              collect information such as your name, email address, phone number, business name, and other contact details.
            </li>
            <li>
              <strong>Customer and Review Data:</strong> When a user shares a review or reads a shared review on Uplaud, we collect and
              store information exposed by WhatsApp APIs, including the user's WhatsApp display name, phone number, and other publicly
              available WhatsApp account information.
            </li>
            <li>
              <strong>Usage Data:</strong> We collect information about your interactions with our Services, such as IP address, browser type,
              device information, pages visited, and timestamps.
            </li>
            <li>
              <strong>Communications:</strong> If you contact us directly, we may collect additional information such as the content of the
              message and any attachments you send.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Information</h2>
          <p className="text-gray-700 mb-3">We use the collected information to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>Provide, maintain, and improve our Services</li>
            <li>Facilitate review collection, sharing, referrals, and related communications</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Send updates, promotional materials (with your consent), or service announcements</li>
            <li>Monitor and analyze trends, usage, and activities for service improvements</li>
            <li>Detect, prevent, and address fraud or security issues</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. How We Share Information</h2>
          <p className="text-gray-700 mb-3">
            We value your trust. We do <strong>not share users' phone numbers</strong> with third parties without explicit consent. We may share
            information as follows:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>
              <strong>With Service Providers:</strong> We share information with trusted vendors (e.g., hosting providers, analytics tools) who
              are bound by confidentiality obligations.
            </li>
            <li>
              <strong>With Your Consent:</strong> We will share your information if you explicitly authorize us to do so.
            </li>
            <li>
              <strong>For Legal Reasons:</strong> We may disclose information when required to comply with legal obligations or government requests.
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, your information may be transferred as part of
              that transaction.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
          <p className="text-gray-700 mb-6">
            We implement technical and organizational security measures designed to protect your information. However, no system is completely
            secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Choices</h2>
          <p className="text-gray-700 mb-3">You have choices regarding your information:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>You may request access to, correction of, or deletion of your personal information by contacting us at [Insert Contact Email].</li>
            <li>You can opt-out of receiving promotional communications by following the unsubscribe instructions or messaging us directly.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Third-Party Services</h2>
          <p className="text-gray-700 mb-6">
            Our Services may contain links to third-party websites or services. We are not responsible for the privacy practices of such third parties.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Children's Privacy</h2>
          <p className="text-gray-700 mb-6">
            Our Services are not intended for children under 13 (or the equivalent minimum age in your jurisdiction). We do not knowingly collect personal
            information from children.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Changes to This Policy</h2>
          <p className="text-gray-700 mb-6">
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this
            page with a new "Effective Date."
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
          <p className="text-gray-700 mb-2">If you have any questions about this Privacy Policy, please contact us:</p>
          <p className="text-gray-700 mb-6">
            <strong>Uplaud, Inc.</strong>
            <br />
            Email: [Insert Contact Email]
            <br />
            Website: <a href="https://www.uplaud.ai" className="text-[#6214a8] hover:underline">https://www.uplaud.ai</a>
          </p>

          <hr className="my-8 border-gray-200" />

          <p className="text-gray-600 text-sm">
            By using Uplaud, you agree to our <a href="/terms-of-service" className="text-[#6214a8] hover:underline">Terms of Service</a> and this Privacy Policy.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
