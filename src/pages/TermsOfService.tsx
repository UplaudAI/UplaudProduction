import React from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  const canonicalUrl = "https://www.uplaud.ai/terms-of-service";

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Uplaud Terms of Service</title>
        <meta
          name="description"
          content="Review the terms, acceptable use, refund policy, and data processing agreements that govern your use of Uplaud."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Effective Date: 01/01/2025</p>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📜 Terms of Service</h2>
              <p className="text-gray-700 mb-3">Hey there — welcome to Uplaud!</p>
              <p className="text-gray-700 mb-3">
                These Terms of Service ("Terms") are here to help you understand the rules when using our website, WhatsApp integrations,
                and related services ("Services").
              </p>
              <p className="text-gray-700 mb-3">
                By using Uplaud, you're agreeing to these Terms. If not, that's okay — but please don't use our Services.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">What We Do:</h3>
              <p className="text-gray-700 mb-3">
                Uplaud helps businesses collect reviews, create warm referrals, and generate leads — all through WhatsApp!
              </p>
              <p className="text-gray-700 mb-3">
                We're always working on making Uplaud better, so the Services might evolve, and that's part of the adventure.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Part:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Be kind, be legal, and use Uplaud responsibly.</li>
                <li>Don't misuse or mess with our Services.</li>
                <li>If you share anything through Uplaud, make sure you have the rights to do so.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">What We Collect (and Share Carefully):</h3>
              <p className="text-gray-700 mb-3">
                When you interact with Uplaud (like sharing or reading a review), we collect info exposed by WhatsApp APIs — like your display
                name and phone number.
              </p>
              <p className="text-gray-700 mb-3">Good news: we do NOT share your phone number without your clear okay.</p>
              <p className="text-gray-700 mb-3">
                When you share a review with someone, we create a connection between you (the referrer) and the person you shared it with (the
                referral).
              </p>
              <p className="text-gray-700 mb-3">
                We share this connection info with the business — but only your display names, and the date and time when the share happened.
              </p>
              <p className="text-gray-700 mb-3">👉 We never share your phone number with the business.</p>
              <p className="text-gray-700 mb-3">You can peek at our Privacy Policy for the full scoop.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Keeping Things Secure:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Keep your devices and accounts safe.</li>
                <li>If something weird happens, let us know quickly.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ending Things:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You can stop using Uplaud anytime, no hard feelings.</li>
                <li>We can suspend or end access if Terms aren't followed.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Important Stuff to Know:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We provide Uplaud "as is" — no promises it'll always be perfect.</li>
                <li>We aren't responsible for third-party websites or services you might encounter through Uplaud.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Limits on Our Liability:</h3>
              <p className="text-gray-700 mb-3">
                We're not liable for things like indirect or unexpected damages related to your use of Uplaud, as much as the law allows.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">If We Change These Terms:</h3>
              <p className="text-gray-700 mb-3">We'll update this page and change the "Effective Date" at the top. Keep an eye out!</p>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔒 Privacy Policy</h2>
              <p className="text-gray-700 mb-3">Effective Date: 01/01/2025</p>
              <p className="text-gray-700 mb-3">At Uplaud, we care about your privacy. Here's what you should know:</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">What We Collect:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Information you provide: Name, email, phone, business name, etc.</li>
                <li>Customer and review data from WhatsApp APIs: display name, phone number, and other public WhatsApp info.</li>
                <li>Usage data: Device info, browser, IP address, timestamps.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">How We Use It:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To operate and improve Uplaud.</li>
                <li>To facilitate review sharing and referrals.</li>
                <li>To respond to your questions and provide support.</li>
                <li>To send updates and promotions (only if you opt-in).</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">How We Share It:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We do not share your phone number without your explicit consent.</li>
                <li>We may share name, date, and time info (no phone numbers) with businesses to track referrals.</li>
                <li>We may share info with trusted vendors or as required by law.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Choices:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access, edit, or delete your info anytime.</li>
                <li>Opt-out of promotional messages.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Security:</h3>
              <p className="text-gray-700 mb-3">We do our best to protect your data but no system can be 100% secure.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Children's Privacy:</h3>
              <p className="text-gray-700 mb-3">Uplaud isn't for kids under 13.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Updates:</h3>
              <p className="text-gray-700 mb-3">We'll post changes here.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Questions?</h3>
              <p className="text-gray-700 mb-3">Email: privacy@uplaud.ai</p>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">💸 Refund Policy</h2>
              <p className="text-gray-700 mb-3">Effective Date: 01/01/2025</p>
              <p className="text-gray-700 mb-3">We want you to love Uplaud! If something goes wrong:</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Refunds Available When:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We didn't deliver what you paid for, due to an error on our part.</li>
                <li>You request a refund within 30 days of your purchase.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">What's Not Refundable:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Services already rendered (like collected reviews or delivered referrals).</li>
                <li>Charges from third-party providers (like WhatsApp messaging fees).</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">How to Request:</h3>
              <p className="text-gray-700 mb-3">
                Email refund@uplaud.ai with your name, purchase info, and reason. We'll respond within 7 business days.
              </p>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🛡️ Data Processing Addendum (DPA)</h2>
              <p className="text-gray-700 mb-3">Effective Date: 01/01/2025</p>
              <p className="text-gray-700 mb-3">
                If you're in the EEA, UK, or Switzerland, or handle data of people there, this DPA applies.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Our Promise:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We only process your customer data to provide Uplaud services.</li>
                <li>We don't sell your data.</li>
                <li>We work with GDPR-compliant vendors.</li>
                <li>We protect data with strong security measures.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Rights:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Request access, correction, deletion, or limit processing of your data.</li>
                <li>We'll help you respond to user GDPR requests.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Data Transfers:</h3>
              <p className="text-gray-700 mb-3">
                We use Standard Contractual Clauses to keep data safe if transferred outside the EEA/UK.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Questions?</h3>
              <p className="text-gray-700 mb-3">Contact privacy@uplaud.ai</p>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🤝 Fair Use Policy</h2>
              <p className="text-gray-700 mb-3">Effective Date: 01/01/2025</p>
              <p className="text-gray-700 mb-3">
                We built Uplaud to help real businesses build real relationships — not to spam people!
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Good Use (✔️):</h3>
              <p className="text-gray-700 mb-3">Sharing honest reviews and warm referrals with real people.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bad Use (🚫):</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Spamming or bulk messaging.</li>
                <li>Misrepresenting your identity.</li>
                <li>Sharing illegal or harmful content.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Consequences:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We may warn, restrict, or suspend accounts that break this policy.</li>
                <li>We may involve authorities if necessary.</li>
              </ul>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📬 Contact Us</h2>
              <p className="text-gray-700 mb-3">Questions about anything? Reach out:</p>
              <p className="text-gray-700 mb-3">Email: hello@uplaud.ai</p>
              <p className="text-gray-700 mb-3">
                Website: <a href="https://www.uplaud.ai" className="text-[#6214a8] hover:underline">https://www.uplaud.ai</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
