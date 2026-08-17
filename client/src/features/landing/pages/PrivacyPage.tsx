import { Link } from 'react-router-dom';
import PageShell from '../PageShell';
import { COMPANY } from '../company';
import { B, Doc, H1, H2, List, Notice, P, Term, proseLink } from '../prose';

/**
 * The privacy policy as filed. The text is fixed — carriers and A2P reviewers
 * read it against the campaign registration — so edit the wording only when
 * the filed policy itself changes, and move the effective date with it.
 */
export default function PrivacyPage() {
  return (
    <PageShell>
      <Doc>
        <H1>Privacy Policy</H1>
        <p className="mt-6 font-semibold text-[#0a1628]">{COMPANY.legalName}</p>
        <p className="mt-1">Effective Date: {COMPANY.effectiveDate}</p>

        <P>
          Welcome to {COMPANY.legalName}. This Privacy Policy outlines our practices
          regarding the collection, use, and disclosure of personal information through
          our website, {COMPANY.url}. By utilizing our Site, you agree to the terms
          outlined in this policy.
        </P>

        <Notice>Important Notice Regarding Text Messaging</Notice>
        <P>
          {COMPANY.legalName} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          DOES NOT share customer opt-in information, including phone numbers and consent
          records, with any affiliates or third parties for marketing, promotional, or any
          other purposes unrelated to providing our direct services. All text messaging
          originator opt-in data is kept strictly confidential.
        </P>

        <H2>1. Information We Collect</H2>
        <P>We collect the following types of information:</P>
        <Term>Personal Information:</Term>
        <List>
          <li>Name, email address, phone number, physical address</li>
          <li>Payment information when you make a purchase or request a quote</li>
          <li>Opt-in records and timestamps for all communication channels (SMS, email, etc.)</li>
        </List>
        <Term>Non-Personal Information:</Term>
        <List>
          <li>IP address, browser type, device information</li>
          <li>Website usage patterns and analytics</li>
          <li>Cookies and similar technologies</li>
        </List>
        <Term>Customer Communication:</Term>
        <List>
          <li>Records of inquiries and service requests</li>
          <li>Appointment details and preferences</li>
          <li>Service history and feedback</li>
        </List>

        <H2>2. How We Use Your Information</H2>
        <P>We use collected data for:</P>
        <List>
          <li>Providing and improving our services</li>
          <li>Processing transactions and payments</li>
          <li>Communicating with you about your inquiries, appointments, and promotions</li>
          <li>Enhancing website functionality and user experience</li>
          <li>Ensuring security and fraud prevention</li>
          <li>Maintaining records of your communication preferences and consent</li>
        </List>

        <H2>3. SMS Messaging &amp; Compliance</H2>
        <Term>Text Message Program Terms &amp; Conditions</Term>
        <P>
          By opting into our SMS messaging services, you agree to receive text messages
          related to our services, including follow-ups to your inquiry, account and service
          updates, customer support, product news, and special offers.
        </P>
        <Term>Opt-In &amp; Consent:</Term>
        <List>
          <li>You will only receive messages if you have explicitly opted in</li>
          <li>We maintain timestamped records of all opt-in actions</li>
          <li>
            We comply with the Telephone Consumer Protection Act (TCPA) and all applicable
            laws
          </li>
        </List>
        <Term>Opt-Out Instructions:</Term>
        <List>
          <li>You can cancel SMS notifications at any time by replying &ldquo;STOP&rdquo;</li>
          <li>
            You will receive a final confirmation message, and no further messages will be
            sent unless you re-opt in
          </li>
          <li>All opt-out requests are processed immediately.</li>
        </List>
        <Term>Message Frequency &amp; Content:</Term>
        <List>
          <li>We send promotional messages only to recipients who have explicitly opted in</li>
          <li>Message frequency may vary</li>
        </List>
        <Term>Help &amp; Support:</Term>
        <List>
          <li>
            Reply &ldquo;HELP&rdquo; for assistance or contact us at {COMPANY.email}. Customer
            support is available during regular business hours
          </li>
        </List>
        <Term>Carrier Information:</Term>
        <List>
          <li>Standard message and data rates may apply</li>
          <li>Carriers are not liable for delayed or undelivered messages</li>
          <li>
            Supported carriers include AT&amp;T, Verizon, T-Mobile, Sprint, and most regional
            carriers
          </li>
        </List>
        <Term>SMS Data Protection Statement</Term>
        <P>
          No mobile information will be shared with third parties/affiliates for
          marketing/promotional purposes. Information sharing to subcontractors in support
          services, such as customer service is permitted. All other use case categories
          exclude text messaging originator opt-in data and consent; this information will
          not be shared with any third parties. We implement strict data protection measures
          to safeguard your SMS opt-in information and consent records.
        </P>

        <H2>4. Information Sharing &amp; Disclosure</H2>
        <P>
          We do not sell, rent, or trade personal information. We may share information with:
        </P>
        <Term>Service Providers:</Term>
        <List>
          <li>
            Third-party vendors who assist in our operations (e.g., payment processing,
            appointment scheduling)
          </li>
          <li>
            SMS aggregators and providers solely for the purpose of delivering messages
            you&rsquo;ve consented to receive
          </li>
          <li>
            All service providers are contractually obligated to maintain confidentiality and
            security
          </li>
        </List>
        <Term>Legal Compliance:</Term>
        <List>
          <li>If required by law, legal process, or to protect our rights</li>
          <li>In response to valid law enforcement requests or court orders</li>
        </List>
        <Term>Business Transfers:</Term>
        <List>
          <li>In case of mergers, acquisitions, or sale of assets</li>
          <li>In such cases, your data remains protected under the terms of this policy</li>
        </List>
        <P>
          All the above categories exclude text messaging originator opt-in data and consent;
          this information will not be shared with any third parties, excluding aggregators
          and providers of the Text Message services.
        </P>

        <H2>5. Data Security</H2>
        <P>
          We implement and maintain reasonable security measures to protect your personal
          information:
        </P>
        <List>
          <li>Encryption of sensitive data in transit and at rest</li>
          <li>Secure access controls and authentication mechanisms</li>
          <li>Regular security assessments and updates</li>
          <li>Employee training on data protection</li>
          <li>Breach notification protocols in accordance with applicable laws</li>
          <li>Secure backup systems and disaster recovery procedures</li>
        </List>
        <P>
          Despite these measures, no method of transmission over the Internet or electronic
          storage is 100% secure. We strive to use commercially acceptable means to protect
          your personal information but cannot guarantee absolute security.
        </P>

        <H2>6. Cookies &amp; Tracking Technologies</H2>
        <P>We use cookies and similar technologies to:</P>
        <List>
          <li>Analyze site traffic and user behavior</li>
          <li>Remember your preferences</li>
          <li>Improve website functionality and user experience</li>
          <li>Measure the effectiveness of our services</li>
        </List>
        <P>
          You may control cookies through your browser settings. Disabling cookies may limit
          your ability to use certain features of our website.
        </P>

        <H2>7. Your Rights &amp; Choices</H2>
        <P>You have the right to:</P>
        <List>
          <li>Access, update, or delete your personal information</li>
          <li>Opt-out of marketing emails by clicking &ldquo;unsubscribe&rdquo; in our emails</li>
          <li>Opt-out of SMS messages by replying &ldquo;STOP&rdquo;</li>
          <li>Request information on how we process your data</li>
          <li>Withdraw consent at any time for future communications</li>
          <li>
            Lodge a complaint with a supervisory authority if you believe your rights have
            been violated
          </li>
        </List>
        <P>To exercise these rights, please contact us using the information in Section 10.</P>

        <H2>8. Third-Party Links</H2>
        <P>
          Our website may contain links to third-party websites. We are not responsible for
          their privacy practices and encourage you to review their policies. This privacy
          policy applies only to information collected by {COMPANY.legalName}.
        </P>

        <H2>9. Changes to This Privacy Policy</H2>
        <P>
          We may update this policy periodically. The latest version will always be available
          on our website with the effective date. For significant changes, we will notify you
          by email or through a notice on our website.
        </P>

        <H2>10. Contact Us</H2>
        <P>
          If you have questions about this Privacy Policy or how your information is handled,
          contact us at:
        </P>
        <P>
          <B>{COMPANY.legalName}</B>
          <br />
          Phone: {COMPANY.phone}
          <br />
          Email: {COMPANY.email}
          <br />
          Website: {COMPANY.url}
        </P>
        <P>By using our website and services, you consent to this Privacy Policy.</P>

        <p className="mt-12 border-t border-[#d8e1ed] pt-6 text-[15px]">
          See also our{' '}
          <Link to="/terms" className={proseLink}>
            Terms of Service
          </Link>
          .
        </p>
      </Doc>
    </PageShell>
  );
}
