import {
  InformationBullet,
  InformationCallout,
  InformationPage,
  InformationParagraph,
  InformationSection,
} from "../components/InformationPage";

const SUMMARIES = [
  {
    number: "01",
    title: "Measure",
    text: "Start with body mass, maximal power efforts, and optional laboratory results.",
  },
  {
    number: "02",
    title: "Model",
    text: "Translate those inputs into CP, W′, VO₂max, and a power-duration profile.",
  },
  {
    number: "03",
    title: "Direct",
    text: "Use the athlete profile to establish a clear training focus and daily targets.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <InformationPage
      eyebrow="HOW IT WORKS"
      title="From athlete data to a clear next step."
      intro="Vector organizes field testing, laboratory measurements, and training structure into one practical workflow. Every output stays connected to the information that produced it."
      summaries={[...SUMMARIES]}
    >
      <InformationSection eyebrow="STEP 01" title="Build the athlete foundation">
        <InformationParagraph>
          Your profile begins with body mass and three maximal cycling efforts: 1 minute, 5 minutes, and 12 minutes. Together, these efforts describe how your power changes as duration increases.
        </InformationParagraph>
        <InformationBullet
          title="Field inputs"
          text="Record maximal efforts completed with adequate preparation and recovery so the model reflects current capability."
        />
        <InformationBullet
          title="Laboratory inputs"
          text="Add measured VO₂max, CPET, LT1, or LT2 data when available. Optional fields never prevent the core model from working."
        />
      </InformationSection>

      <InformationSection eyebrow="STEP 02" title="Create the performance model">
        <InformationParagraph>
          Vector fits a three-parameter Critical Power model to the maximal efforts. It produces Critical Power, W′, estimated maximal instantaneous power, and a continuous power-duration curve.
        </InformationParagraph>
        <InformationParagraph>
          VO₂max is estimated from power when no laboratory value exists. A valid measured result takes priority, while its source and test date remain visible so estimates are never presented as laboratory measurements.
        </InformationParagraph>
      </InformationSection>

      <InformationSection eyebrow="STEP 03" title="Turn physiology into training context">
        <InformationParagraph>
          Critical Power becomes the anchor for athlete-specific training zones and ride targets. The current training focus provides the direction that future workout selection will use when placing sessions into the weekly calendar.
        </InformationParagraph>
        <InformationBullet
          title="Today"
          text="See the assigned session—or a clear recovery day—without searching through the full plan."
        />
        <InformationBullet
          title="This week"
          text="Each calendar day is an independent assignment slot, ready for workouts from the evolving workout library."
        />
      </InformationSection>

      <InformationSection eyebrow="STEP 04" title="Reassess as the athlete changes">
        <InformationParagraph>
          New power efforts, body mass, or measured VO₂ data rebuild the athlete model automatically. That keeps displayed metrics and training targets synchronized with the latest available inputs.
        </InformationParagraph>
        <InformationParagraph>
          Current power tests update a provisional training focus: sustainable power, aerobic ceiling or balanced development. This comparison is a coaching heuristic, not a confirmed physiological limiter. Individual workout prescription is still being developed.
        </InformationParagraph>
      </InformationSection>

      <InformationCallout
        eyebrow="THE PRINCIPLE"
        title="No metric without context."
        text="Vector is designed to show where a number came from, whether it was measured or modeled, and how it should influence the athlete’s next decision."
      />
    </InformationPage>
  );
}
