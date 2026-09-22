import {
  InformationBullet,
  InformationCallout,
  InformationPage,
  InformationParagraph,
  InformationSection,
} from "../components/InformationPage";

export default function TermsPage() {
  return (
    <InformationPage
      eyebrow="TERMS AND CONDITIONS · UPDATED SEPTEMBER 21, 2026"
      title="Clear terms for training in the right direction."
      intro="These terms govern access to Vector Training. By creating an account or using the service, you agree to them."
      summaries={[
        { number: "01", title: "Training guidance", text: "Vector provides informational fitness guidance, not medical diagnosis or treatment." },
        { number: "02", title: "Your account", text: "Keep credentials secure and provide accurate information used to personalize training." },
        { number: "03", title: "Train responsibly", text: "You remain responsible for judging whether a workout is appropriate and safe for you." },
      ]}
    >
      <InformationSection title="1. Eligibility and acceptance">
        <InformationParagraph>You must be legally able to agree to these terms where you live. If you use Vector for an organization or another person, you confirm that you have authority and any required consent to do so.</InformationParagraph>
      </InformationSection>
      <InformationSection title="2. Accounts and security">
        <InformationBullet title="Accurate information" text="Provide current account, physiology, availability, and performance information so the service can operate as intended." />
        <InformationBullet title="Credential security" text="Use a strong, unique password and promptly report suspected unauthorized access." />
        <InformationBullet title="One person per account" text="Do not share an account or impersonate another person." />
      </InformationSection>
      <InformationSection title="3. Fitness and medical disclaimer">
        <InformationParagraph>Vector provides automated cycling performance estimates and training suggestions for general informational purposes. It is not a medical device or healthcare provider and does not diagnose, treat, cure, or prevent any condition.</InformationParagraph>
        <InformationParagraph>Consult a qualified professional before starting or changing training, especially if you have symptoms, an injury, a medical condition, or concerns about exercise. Stop exercising and seek appropriate care if you feel unwell.</InformationParagraph>
      </InformationSection>
      <InformationSection title="4. Acceptable use">
        <InformationBullet title="Lawful use" text="Do not use the service to violate law, privacy, intellectual-property, or other rights." />
        <InformationBullet title="Service integrity" text="Do not probe, disrupt, overload, scrape, reverse engineer, or bypass access controls except where law expressly permits." />
        <InformationBullet title="No harmful content" text="Do not upload malicious code or content intended to deceive, abuse, or harm others." />
      </InformationSection>
      <InformationSection title="5. Data and privacy">
        <InformationParagraph>You retain rights in information you submit. You permit Vector and its service providers to process it as needed to provide, secure, maintain, and improve the service. The Privacy Policy explains collection, use, retention, and your choices.</InformationParagraph>
      </InformationSection>
      <InformationSection title="6. Service availability and changes">
        <InformationParagraph>Vector may change, suspend, or discontinue features and may update these terms as the service develops. We will provide appropriate notice of material changes. Continued use after an effective date constitutes acceptance where permitted by law.</InformationParagraph>
      </InformationSection>
      <InformationSection title="7. Intellectual property">
        <InformationParagraph>Vector&apos;s software, design, branding, and original content are protected by applicable laws. These terms grant a limited, personal, non-exclusive, non-transferable right to use the service; they do not transfer ownership.</InformationParagraph>
      </InformationSection>
      <InformationSection title="8. Disclaimers and liability">
        <InformationParagraph>The service is provided on an “as available” basis to the extent permitted by law. Training estimates can be incomplete or inaccurate. To the maximum extent permitted by law, Vector is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the service.</InformationParagraph>
      </InformationSection>
      <InformationSection title="9. Suspension and termination">
        <InformationParagraph>You may stop using Vector and delete your account through the profile controls. Access may be limited or terminated for material violations, security risk, unlawful conduct, or where required by law.</InformationParagraph>
      </InformationSection>
      <InformationSection title="10. Contact and governing terms">
        <InformationParagraph>Questions about these terms may be sent through the official support channel published with the application or its distribution listing. Mandatory consumer rights and laws in your jurisdiction continue to apply.</InformationParagraph>
      </InformationSection>
      <InformationCallout eyebrow="IMPORTANT" title="Listen to your body" text="A generated session is never an instruction to train through pain, illness, unsafe conditions, or professional medical advice." />
    </InformationPage>
  );
}
