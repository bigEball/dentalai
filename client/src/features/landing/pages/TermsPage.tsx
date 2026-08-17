import { Link } from 'react-router-dom';
import PageShell from '../PageShell';
import { COMPANY } from '../company';
import { B, Doc, H1, H2, Numbered, P, Term, proseLink } from '../prose';

/**
 * The terms of service as filed, SMS program terms first. Same rule as the
 * privacy policy: the wording is the registered wording, not copy to polish.
 */
export default function TermsPage() {
  return (
    <PageShell>
      <Doc>
        <H1>Terms of Service</H1>
        <p className="mt-6 font-semibold text-[#0a1628]">
          Program Name: {COMPANY.legalName}
        </p>
        <p className="mt-1">Effective Date: {COMPANY.effectiveDate}</p>

        <H2>SMS Messaging Terms &amp; Compliance</H2>
        <Numbered>
          <li>
            <B>Program Description:</B> This messaging program sends marketing and
            informational text messages from {COMPANY.legalName} to individuals who submit a
            form on our website at {COMPANY.url} (or our contact/scheduling forms) and
            explicitly opt in to receive SMS. Opt-in is collected via web forms with a
            dedicated, unchecked SMS-consent checkbox. Messages may include demo scheduling
            and confirmations, follow-ups to your inquiry, account and service updates,
            product news, and special offers.
          </li>
          <li>
            <B>Cancellation Instructions:</B> You can cancel the SMS service at any time.
            Simply text &ldquo;STOP&rdquo; to the same number that sent you messages. Upon
            sending &ldquo;STOP,&rdquo; we will confirm your unsubscribe status via SMS.
            Following this confirmation, you will no longer receive SMS messages from us. To
            rejoin, sign up as you did initially, and we will resume sending SMS messages to
            you.
          </li>
          <li>
            <B>Support Information:</B> If you experience issues with the messaging program,
            reply with the keyword &ldquo;HELP&rdquo; for more assistance, or reach out
            directly to {COMPANY.email} or call {COMPANY.phone} during business hours.
          </li>
          <li>
            <B>Carrier Liability:</B> Carriers are not liable for delayed or undelivered
            messages.
          </li>
          <li>
            <B>Message &amp; Data Rates:</B> Message and data rates may apply for messages
            sent to you from us and to us from you. Message frequency may vary. For questions
            about your text plan or data plan, contact your wireless provider.
          </li>
          <li>
            <B>Supported Carriers:</B> Our SMS program works with all major U.S. wireless
            carriers, including AT&amp;T, T-Mobile, Verizon, Sprint, and most regional
            carriers.
          </li>
          <li>
            <B>Age Restriction:</B> You must be 18 years or older to participate in our SMS
            program.
          </li>
          <li>
            <B>Privacy Policy:</B> For privacy-related inquiries, please refer to our{' '}
            <Link to="/privacy" className={proseLink}>
              Privacy Policy at /privacy
            </Link>
            .
          </li>
        </Numbered>
        <P>
          We comply with all applicable laws and regulations, including the Telephone Consumer
          Protection Act (TCPA) and CTIA guidelines, regarding the use of SMS communications.
        </P>

        <H2>General Terms</H2>
        <P>
          This website ({COMPANY.url}) is owned and operated by {COMPANY.legalName} (&ldquo;
          COMPANY,&rdquo; &ldquo;we&rdquo; or &ldquo;us&rdquo;). By using the Site, you agree
          to be bound by these Terms of Service and to use the Site in accordance with these
          Terms of Service, our Privacy Policy, and any additional terms and conditions that
          may apply to specific sections of the Site or to products and services available
          through the Site or from {COMPANY.legalName}.
        </P>
        <P>
          Accessing the Site, in any manner, whether automated or otherwise, constitutes use
          of the Site and your agreement to be bound by these Terms of Service.
        </P>
        <P>
          We reserve the right to change these Terms of Service or to impose new conditions on
          the use of the Site from time to time, in which case we will post the revised Terms
          of Service on this website. By continuing to use the Site after we post any such
          changes, you accept the Terms of Service, as modified.
        </P>

        <H2>Intellectual Property Rights</H2>
        <Term>Our Limited License to You</Term>
        <P>
          This Site and all the materials available on the Site are the property of{' '}
          {COMPANY.legalName} and/or our affiliates or licensors and are protected by
          copyright, trademark, and other intellectual property laws. The Site is provided
          solely for your personal non-commercial use. You may not use the Site or the
          materials available on the Site in a manner that constitutes an infringement of our
          rights or that has not been authorized by us.
        </P>
        <P>
          Unless explicitly authorized, you may not modify, copy, reproduce, republish, upload,
          post, transmit, translate, sell, create derivative works, exploit, or distribute in
          any manner or medium any material from the Site. However, you may download and/or
          print one copy of individual pages for your personal, non-commercial use, provided
          that you keep intact all copyright and other proprietary notices.
        </P>
        <Term>Your License to Us</Term>
        <P>
          By posting or submitting any material (including comments, blog entries, social media
          posts, photos, and videos) to us via the Site, internet groups, or other digital
          venues, you represent that you own the material or have obtained the necessary
          permissions. You grant us a royalty-free, perpetual, irrevocable, non-exclusive,
          worldwide license to use, modify, transmit, sell, exploit, create derivative works
          from, distribute, and publicly perform or display such material.
        </P>

        <H2>Disclaimers</H2>
        <P>
          Throughout the Site, we may provide links and pointers to Internet sites maintained
          by third parties. Our linking to such third-party sites does not imply an endorsement
          or sponsorship of such sites or the information, products, or services offered on or
          through the sites.
        </P>
        <P>
          The information, products, and services offered on or through the Site are provided
          &ldquo;as is&rdquo; and without warranties of any kind, either express or implied. To
          the fullest extent permissible pursuant to applicable law, we disclaim all
          warranties, including implied warranties of merchantability and fitness for a
          particular purpose.
        </P>
        <P>
          You agree at all times to indemnify and hold harmless {COMPANY.legalName}, its
          affiliates, and their respective officers, directors, agents, and employees from any
          claims, causes of action, damages, liabilities, costs, and expenses arising out of or
          related to your breach of any obligation, warranty, or representation under these
          Terms of Service.
        </P>

        <H2>Online Commerce</H2>
        <P>
          Certain sections of the Site may allow you to purchase products and services from
          third-party vendors. We are not responsible for the quality, accuracy, timeliness,
          reliability, or any other aspect of these products and services. If you make a
          purchase from a third party linked through the Site, the information obtained during
          your visit, including payment information, may be collected by both the merchant and
          us.
        </P>
        <P>
          Your participation in any dealings with third-party vendors is solely between you and
          the third party. {COMPANY.legalName} shall not be responsible for any loss or damage
          incurred as a result of such dealings.
        </P>

        <H2>Registration &amp; Passwords</H2>
        <P>
          To access certain features of the Site, you may be required to register and create an
          account. You agree to provide accurate, current, and complete information during the
          registration process. You are responsible for maintaining the confidentiality of your
          login credentials and for all activities conducted under your account.
        </P>
        <P>
          If you suspect unauthorized use of your account, notify us immediately at{' '}
          {COMPANY.email}. We are not liable for any loss or damage arising from your failure
          to comply with this obligation.
        </P>

        <H2>Termination</H2>
        <P>
          We reserve the right to terminate or suspend your access to the Site, without notice,
          if we determine that you have violated these Terms of Service or engaged in conduct
          that we deem inappropriate or unlawful. Upon termination, you must cease all use of
          the Site and any content obtained from it.
        </P>

        <H2>Governing Law</H2>
        <P>
          These Terms of Service shall be governed by and construed in accordance with the laws
          of the state in which {COMPANY.legalName} operates. Any dispute arising under these
          Terms shall be resolved exclusively through binding arbitration in that jurisdiction.
        </P>

        <H2>Changes to Terms of Service</H2>
        <P>
          We may update these Terms of Service from time to time. The latest version will
          always be available on our website with the effective date.
        </P>
        <P>For any questions regarding these Terms of Service, please contact us at:</P>
        <P>
          <B>{COMPANY.legalName}</B>
          <br />
          Phone: {COMPANY.phone}
          <br />
          Email: {COMPANY.email}
          <br />
          Website: {COMPANY.url}
        </P>
        <P>By using our website and services, you consent to these Terms of Service.</P>

        <p className="mt-12 border-t border-[#d8e1ed] pt-6 text-[15px]">
          See also our{' '}
          <Link to="/privacy" className={proseLink}>
            Privacy Policy
          </Link>
          .
        </p>
      </Doc>
    </PageShell>
  );
}
