import {
  InformationBullet,
  InformationCallout,
  InformationPage,
  InformationParagraph,
  InformationReference,
  InformationSection,
} from "../components/InformationPage";

const SUMMARIES = [
  {
    number: "CP",
    title: "Critical Power",
    text: "A modeled boundary separating exercise domains with different fatigue behavior.",
  },
  {
    number: "W′",
    title: "Work above CP",
    text: "A finite modeled work capacity that helps describe severe-intensity performance.",
  },
  {
    number: "VO₂",
    title: "Aerobic capacity",
    text: "Measured laboratory data when available, otherwise a clearly labeled field estimate.",
  },
] as const;

export default function SciencePage() {
  return (
    <InformationPage
      eyebrow="THE SCIENCE"
      title="Useful models, visible assumptions."
      intro="Vector uses established power-duration concepts to organize cycling performance. The models are decision aids—not perfect descriptions of physiology and never substitutes for medical evaluation."
      summaries={[...SUMMARIES]}
    >
      <InformationSection eyebrow="POWER–DURATION" title="Why duration changes the meaning of power">
        <InformationParagraph>
          A cyclist can produce high power briefly and lower power for longer periods. Critical Power models describe that curved relationship rather than reducing performance to a single test or percentage.
        </InformationParagraph>
        <InformationParagraph>
          Research commonly interprets CP as a boundary between heavy- and severe-intensity exercise. Above CP, physiological responses do not stabilize and tolerable duration becomes limited as finite work capacity is expended.
        </InformationParagraph>
      </InformationSection>

      <InformationSection eyebrow="THE MODEL" title="Morton’s three-parameter approach">
        <InformationParagraph>
          Vector currently fits R. Hugh Morton’s three-parameter Critical Power model from maximal 1-, 5-, and 12-minute efforts. In addition to CP and W′, the third parameter introduces a finite maximal-power estimate and a negative time asymptote.
        </InformationParagraph>
        <InformationBullet
          title="Critical Power"
          text="The power asymptote of the fitted relationship—not a promise that the wattage can be maintained indefinitely."
        />
        <InformationBullet
          title="W′"
          text="The curvature constant expressed as work. It is useful for describing capacity above CP, but recovery and reconstitution are more complex than a single fixed number."
        />
        <InformationBullet
          title="Power-duration curve"
          text="A continuous estimate between and beyond recorded efforts. Confidence depends on testing quality and distance from the observed durations."
        />
      </InformationSection>

      <InformationSection eyebrow="AEROBIC DATA" title="Measured values take priority">
        <InformationParagraph>
          When no laboratory VO₂max is available, Vector estimates aerobic capacity from five-minute power relative to body mass. This is a field estimate and can be influenced by pacing, anaerobic contribution, fatigue, equipment, and testing conditions.
        </InformationParagraph>
        <InformationParagraph>
          A valid laboratory VO₂max result overrides the estimate. Optional CPET and lactate-threshold fields preserve test dates and sources, allowing measured and modeled data to coexist without being confused.
        </InformationParagraph>
      </InformationSection>

      <InformationSection eyebrow="INTERPRETATION" title="What can change the result">
        <InformationBullet
          title="Effort quality"
          text="The model assumes each input represents a genuine maximal effort for its duration."
        />
        <InformationBullet
          title="Protocol consistency"
          text="Warm-up, recovery, terrain, calibration, fatigue, and environmental conditions can all affect field-test power."
        />
        <InformationBullet
          title="Model range"
          text="Estimates are most defensible near the durations used to fit the model; very short or very long extrapolations require caution."
        />
        <InformationBullet
          title="Training use"
          text="Zones derived from CP are practical starting points. Session goals and individual response still matter."
        />
      </InformationSection>

      <InformationSection eyebrow="REFERENCES" title="Core research informing Vector">
        <InformationReference>
          Morton RH. A 3-parameter critical power model. Ergonomics. 1996;39(4):611–619. doi:10.1080/00140139608964484.
        </InformationReference>
        <InformationReference>
          Poole DC, Burnley M, Vanhatalo A, Rossiter HB, Jones AM. Critical Power: An Important Fatigue Threshold in Exercise Physiology. Med Sci Sports Exerc. 2016;48(11):2320–2334. doi:10.1249/MSS.0000000000000939.
        </InformationReference>
        <InformationReference>
          Leo P, Spragg J, Podlogar T, Lawley JS, Mujika I. Power profiling and the power-duration relationship in cycling: a narrative review. Eur J Appl Physiol. 2022;122:301–316. doi:10.1007/s00421-021-04833-y.
        </InformationReference>
      </InformationSection>

      <InformationCallout
        eyebrow="IMPORTANT"
        title="Performance guidance, not medical advice."
        text="Vector’s outputs describe modeled cycling performance. Symptoms, health concerns, return-to-exercise decisions, and clinical interpretation belong with a qualified healthcare professional."
      />
    </InformationPage>
  );
}
