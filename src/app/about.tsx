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
    title: "Clarity first",
    text: "Make complex performance information understandable without hiding its limitations.",
  },
  {
    number: "02",
    title: "Athlete owned",
    text: "Keep personal data, measurement sources, and training context centered on the rider.",
  },
  {
    number: "03",
    title: "Direction over noise",
    text: "Prioritize the next useful decision instead of adding another crowded dashboard.",
  },
] as const;

export default function AboutPage() {
  return (
    <InformationPage
      eyebrow="ABOUT VECTOR"
      title="Training data should lead somewhere."
      intro="Vector is a cycling-performance platform being built to connect athlete physiology, current priorities, and day-to-day training in one understandable system."
      summaries={[...SUMMARIES]}
    >
      <InformationSection eyebrow="THE PROBLEM" title="More data does not automatically create better training">
        <InformationParagraph>
          Power meters, laboratory tests, and training platforms can produce an enormous number of metrics. Athletes are often left to decide which number matters, whether it can be trusted, and what to do with it next.
        </InformationParagraph>
        <InformationParagraph>
          Vector’s goal is to reduce that gap: preserve the useful detail, make assumptions visible, and connect the athlete profile to a clear training direction.
        </InformationParagraph>
      </InformationSection>

      <InformationSection eyebrow="WHAT WE ARE BUILDING" title="One path from testing to the training week">
        <InformationBullet
          title="A transparent physiology profile"
          text="Critical Power, W′, VO₂max, laboratory thresholds, and the power-duration relationship—with measured and estimated sources kept distinct."
        />
        <InformationBullet
          title="Athlete-specific ride targets"
          text="Practical training zones and exact watt ranges derived from the rider’s current CP model."
        />
        <InformationBullet
          title="A focused weekly plan"
          text="A real calendar week where each day can hold a prescribed workout or an intentional recovery day."
        />
        <InformationBullet
          title="An evolving prescription engine"
          text="Future weak-point analysis will compare the athlete’s power distribution and aerobic profile to select an appropriate training focus and workouts."
        />
      </InformationSection>

      <InformationSection eyebrow="OUR STANDARD" title="Honest about what is measured—and what is modeled">
        <InformationParagraph>
          Field models are valuable because they make everyday athlete data actionable. They are also estimates shaped by protocol quality and mathematical assumptions. Vector labels that distinction directly instead of presenting every output with the certainty of a laboratory measurement.
        </InformationParagraph>
        <InformationParagraph>
          When athletes provide valid laboratory data, those measurements take priority where appropriate and remain connected to their date and source.
        </InformationParagraph>
      </InformationSection>

      <InformationSection eyebrow="THE DIRECTION" title="Built to adapt with the rider">
        <InformationParagraph>
          Fitness is not static. As power, body mass, laboratory results, and training history change, the athlete model should change too. Vector is building toward plans that respond to those changes without losing the reasoning behind the recommendation.
        </InformationParagraph>
        <InformationParagraph>
          The platform is actively evolving. Current features establish the data model, testing workflow, physiology tools, training calendar, and internal athlete classification needed for more advanced prescription later.
        </InformationParagraph>
      </InformationSection>

      <InformationCallout
        eyebrow="WHY VECTOR"
        title="Understand the athlete. Choose the priority. Build the work."
        text="That sequence is the product philosophy: training recommendations should be traceable to the athlete profile, simple enough to act on, and flexible enough to evolve."
      />
    </InformationPage>
  );
}
